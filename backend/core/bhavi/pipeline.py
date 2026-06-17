"""
Bhavi AI — Main Pipeline Orchestrator (v2.0)
=============================================
Orchestrates the full voice AI pipeline:

  User Speech → VAD → STT → Quota Check → Emotion → Memory → LLM → TTS → Voice

v2.0 additions:
- Voice quota tracking (24-hr rolling window)
- Full state variable injection into LLM
- [MEMORY_UPDATE: ...] tag parsing and DB storage
- Personalization pipeline trigger (Plus only)
- Structured memory block (ChromaDB + BhaviMemoryFact)
- Soft 80% quota warning in responses
"""

import logging
import tempfile
import os
from typing import Dict, List, Optional, Tuple
from datetime import timedelta

from .config import BhaviConfig
from . import stt_service
from . import llm_service
from . import emotion_service
from . import memory_service
from . import tts_service
from . import quota_service
from . import personalization_service

logger = logging.getLogger("bhavi.pipeline")

# ── Per-patient session memory cache ──────────────────────────────────────────
_session_memories: Dict[int, memory_service.SessionMemory] = {}
# Track turn count per patient session for personalization trigger
_session_turn_counts: Dict[int, int] = {}


def _get_session(session_id: str) -> memory_service.SessionMemory:
    """Get or create session memory."""
    if session_id not in _session_memories:
        _session_memories[session_id] = memory_service.SessionMemory()
    return _session_memories[session_id]


def _get_turn_count(patient_id: int) -> int:
    """Get and increment turn count for personalization trigger."""
    _session_turn_counts[patient_id] = _session_turn_counts.get(patient_id, 0) + 1
    return _session_turn_counts[patient_id]


def _build_full_memory_context(patient_id: int, user_text: str, patient) -> str:
    """
    Build the complete ---MEMORY_START--- memory block for the LLM prompt.
    Combines ChromaDB semantic memories + DB-stored BhaviMemoryFact records.
    """
    # Import here to avoid circular import
    try:
        from core.models import BhaviMemoryFact
    except ImportError:
        from backend.core.models import BhaviMemoryFact

    # ChromaDB semantic memories
    chroma_memories = memory_service.retrieve_memories(
        patient_id=patient_id,
        query=user_text,
    )

    # DB-stored explicit facts from [MEMORY_UPDATE: ...] tags
    db_facts = list(
        BhaviMemoryFact.objects.filter(patient_id=patient_id)
        .order_by('-created_at')
        .values_list('fact', flat=True)[:15]
    )

    # Derive recent topics from last session summary
    # Using patient_id just to avoid breaking _get_session context
    session = _get_session(str(patient_id))
    last_session_summary = session.get_context_summary()

    return llm_service.build_memory_context_block(
        memories=chroma_memories,
        memory_facts=db_facts,
        patient_name=patient.name,
        preferred_lang=patient.preferred_lang or "en",
        last_session_summary=last_session_summary,
    )


def _save_memory_updates(patient_id: int, facts: List[str]):
    """Save [MEMORY_UPDATE: ...] parsed facts to the BhaviMemoryFact DB table."""
    if not facts:
        return

    try:
        from core.models import BhaviMemoryFact, Patient
    except ImportError:
        from backend.core.models import BhaviMemoryFact, Patient

    try:
        patient = Patient.objects.get(id=patient_id)
        for fact in facts:
            BhaviMemoryFact.objects.create(patient=patient, fact=fact)
            logger.info("[BHAVI PIPELINE] Saved memory fact for patient %d: %s", patient_id, fact[:80])
    except Exception as e:
        logger.error("[BHAVI PIPELINE] Failed to save memory facts: %s", e)


def process_text_turn(
    patient_id: int,
    user_text: str,
    patient_name: str = "Friend",
    preferred_lang: str = "auto",
    diary_context: str = "No recent diary entries.",
    # v2.0 state
    tier: str = "free",
    patient=None,
    session_id: str = "default",
) -> Dict:
    """
    Process a text-based conversation turn through the full Bhavi v2.0 pipeline.

    Args:
        patient_id: Patient database ID.
        user_text: The user's input text.
        patient_name: Patient's display name.
        preferred_lang: Language preference.
        diary_context: Recent diary entries as text context.
        tier: Patient's subscription tier ('free' or 'plus').
        patient: Patient model instance (for memory building).

    Returns:
        {
            "user_text": str,
            "ai_response": str,
            "emotion": {...},
            "crisis_flag": bool,
            "memories_used": int,
            "memory_facts_saved": list[str],
            "quota": {...},
        }
    """
    if not user_text or not user_text.strip():
        return {
            "user_text": "",
            "ai_response": "I didn't catch that. Could you say that again?",
            "emotion": {"emotion": "neutral", "mood_score": 5, "crisis": False},
            "crisis_flag": False,
            "memories_used": 0,
            "memory_facts_saved": [],
            "quota": quota_service.get_quota_state(patient_id, tier),
        }

    session = _get_session(session_id)

    # ── Step 1: Get current quota state ──────────────────────────────────
    current_quota = quota_service.get_quota_state(patient_id, tier)

    # ── Step 2: Emotion Detection ─────────────────────────────────────────
    emotion_result = emotion_service.analyze(user_text)
    emotion_context = emotion_service.format_for_prompt(emotion_result)

    # ── Step 3: Build full memory context ─────────────────────────────────
    if patient is not None:
        memory_context = _build_full_memory_context(patient_id, user_text, patient)
    else:
        # Fallback: use ChromaDB only
        chroma_memories = memory_service.retrieve_memories(
            patient_id=patient_id,
            query=user_text,
        )
        memory_context = memory_service.format_memories_for_prompt(chroma_memories)

    chroma_memories = memory_service.retrieve_memories(patient_id=patient_id, query=user_text)

    # ── Step 4: Get personality notes (Plus only) ─────────────────────────
    personality_notes = ""
    if tier == "plus" and patient is not None:
        personality_notes = patient.personality_notes or ""

    # ── Step 5: Get conversation history ──────────────────────────────────
    history = session.get_history()

    # ── Step 6: Generate response via LLM ────────────────────────────────
    raw_response = llm_service.generate(
        user_message=user_text,
        history=history,
        patient_name=patient_name,
        patient_lang=preferred_lang,
        tier=tier,
        voice_quota_used=current_quota["voice_quota_used"],
        voice_quota_limit=current_quota["voice_quota_limit"],
        voice_exhausted=current_quota["voice_exhausted"],
        quota_resets_in=current_quota["quota_resets_in"],
        upgrade_msg_shown=current_quota["upgrade_msg_shown"],
        memory_context=memory_context,
        personality_notes=personality_notes,
        diary_context=diary_context,
        emotion_context=emotion_context,
        lang=preferred_lang,
    )

    # ── Step 7: Parse and strip [MEMORY_UPDATE: ...] tags ─────────────────
    ai_response, new_facts = llm_service.parse_memory_updates(raw_response)
    _save_memory_updates(patient_id, new_facts)

    # ── Step 8: Update session memory ─────────────────────────────────────
    session.add_turn("user", user_text, emotion=emotion_result.get("emotion"))
    session.add_turn("assistant", ai_response)

    # ── Step 9: Store in long-term ChromaDB memory ────────────────────────
    memory_service.store_conversation_summary(
        patient_id=patient_id,
        user_message=user_text,
        ai_response=ai_response,
        emotion=emotion_result.get("emotion", "neutral"),
    )

    # ── Step 10: Crisis detection ─────────────────────────────────────────
    crisis_flag = emotion_result.get("crisis", False)

    # ── Step 11: Personalization trigger (Plus only) ──────────────────────
    turn_count = _get_turn_count(patient_id)
    personalization_service.trigger_async(patient_id, tier, turn_count)

    # ── Step 12: If upgrade message is in response, mark it shown ─────────
    if (current_quota["voice_exhausted"]
            and not current_quota["upgrade_msg_shown"]
            and ("Bhavi Plus" in ai_response or "upgrade" in ai_response.lower()
                 or "plus" in ai_response.lower())):
        quota_service.mark_upgrade_msg_shown(patient_id)

    logger.info(
        "[BHAVI PIPELINE v2.0] Turn processed for patient %d: emotion=%s, crisis=%s, "
        "memories=%d, facts_saved=%d, tier=%s, exhausted=%s",
        patient_id, emotion_result.get("emotion"), crisis_flag,
        len(chroma_memories), len(new_facts), tier, current_quota["voice_exhausted"],
    )

    # ── Step 13: Rename session if needed ─────────────────────────────────
    try:
        from core.models import ChatSession
        db_session = ChatSession.objects.get(id=session_id)
        if db_session.title == 'New Chat' and len(session.turns) >= 2:
            import threading
            def _update_title():
                title = llm_service.generate_title(user_text, ai_response)
                db_session.title = title
                db_session.save()
            threading.Thread(target=_update_title).start()
    except Exception as e:
        logger.error("[BHAVI PIPELINE] Failed to rename session: %s", e)

    return {
        "user_text": user_text,
        "ai_response": ai_response,
        "emotion": emotion_result,
        "crisis_flag": crisis_flag,
        "memories_used": len(chroma_memories),
        "memory_facts_saved": new_facts,
        "quota": current_quota,
    }


def process_audio_turn(
    patient_id: int,
    audio_path: str,
    patient_name: str = "Friend",
    preferred_lang: str = None,
    browser_stt: str = None,
    diary_context: str = "No recent diary entries.",
    tier: str = "free",
    patient=None,
    session_id: str = "default",
) -> Dict:
    """
    Process an audio-based conversation turn through the full pipeline.

    Pipeline: Audio → STT → Record Voice Usage → Emotion → Memory → LLM → Response

    Args:
        patient_id: Patient database ID.
        audio_path: Path to the uploaded audio file.
        patient_name: Patient's display name.
        preferred_lang: Force language for STT, or None for auto-detect.
        diary_context: Recent diary entries.
        tier: Patient's subscription tier.
        patient: Patient model instance.

    Returns:
        Same as process_text_turn, plus "language" and "audio_duration_minutes" fields.
    """
    # ── Step 0: Check if voice is exhausted BEFORE transcribing ──────────
    current_quota = quota_service.get_quota_state(patient_id, tier)
    if current_quota["voice_exhausted"]:
        logger.info(
            "[BHAVI PIPELINE] Voice exhausted for patient %d — rejecting audio input",
            patient_id
        )
        return {
            "user_text": "",
            "ai_response": _exhaustion_fallback(patient_name, preferred_lang or "en"),
            "emotion": {"emotion": "neutral", "mood_score": 5, "crisis": False},
            "crisis_flag": False,
            "memories_used": 0,
            "memory_facts_saved": [],
            "language": preferred_lang or "en",
            "audio_duration_minutes": 0.0,
            "quota": current_quota,
            "voice_rejected": True,
        }

    # ── Step 1: Transcribe audio ──────────────────────────────────────────
    try:
        stt_result = stt_service.transcribe_for_companion(
            audio_path=audio_path,
            preferred_lang=preferred_lang,
            browser_stt=browser_stt,
        )
        user_text = stt_result.get("original_text", "")
        detected_lang = stt_result.get("language", "en")
        audio_duration_seconds = stt_result.get("duration_seconds", 0.0)
        audio_duration_minutes = audio_duration_seconds / 60.0
    except Exception as e:
        logger.error("[BHAVI PIPELINE] STT failed: %s", e)
        return {
            "user_text": "",
            "ai_response": "I'm sorry, I couldn't understand the audio. Could you try again?",
            "emotion": {"emotion": "neutral", "mood_score": 5, "crisis": False},
            "crisis_flag": False,
            "memories_used": 0,
            "memory_facts_saved": [],
            "language": preferred_lang or "en",
            "audio_duration_minutes": 0.0,
            "quota": current_quota,
        }

    # ── Step 2: Record voice usage ────────────────────────────────────────
    if audio_duration_minutes > 0:
        quota_service.record_voice_usage(patient_id, audio_duration_minutes, tier)

    # Use detected language if no preference set
    lang = preferred_lang or detected_lang

    # ── Step 3: Process through the text pipeline ─────────────────────────
    result = process_text_turn(
        patient_id=patient_id,
        user_text=user_text,
        patient_name=patient_name,
        preferred_lang=lang,
        diary_context=diary_context,
        tier=tier,
        patient=patient,
        session_id=session_id,
    )
    result["language"] = detected_lang
    result["audio_duration_minutes"] = round(audio_duration_minutes, 3)
    return result


def generate_greeting(
    patient_id: int,
    patient_name: str = "Friend",
    diary_context: str = "No recent diary entries.",
    preferred_lang: str = "en",
    tier: str = "free",
    patient=None,
) -> str:
    """Generate a personalized greeting via Ollama."""
    # Get recent memory for contextual greeting
    last_session = ""
    try:
        session = _get_session(patient_id)
        last_session = session.get_context_summary()
    except Exception:
        pass

    memory_context = ""
    try:
        memories = memory_service.retrieve_memories(
            patient_id=patient_id,
            query="last session topics feelings",
            max_results=3,
        )
        memory_context = memory_service.format_memories_for_prompt(memories)
    except Exception:
        pass

    return llm_service.generate_greeting(
        patient_name=patient_name,
        diary_context=diary_context,
        memory_context=memory_context,
        last_session_summary=last_session,
        lang=preferred_lang,
        tier=tier,
    )


def synthesize_speech(text: str, lang: str = "en") -> Tuple[Optional[bytes], str]:
    """
    Synthesize speech from text using best available TTS.

    Returns:
        Tuple of (audio_bytes, content_type).
    """
    return tts_service.synthesize(text, lang)


def get_pipeline_status() -> Dict:
    """Check the status of all pipeline components."""
    ollama_ok = llm_service.check_ollama_status()
    model_ok = llm_service.check_model_available() if ollama_ok else False
    tts_status = tts_service.get_tts_status()

    return {
        "ollama": {
            "running": ollama_ok,
            "model_available": model_ok,
            "model": BhaviConfig.OLLAMA_MODEL,
            "url": BhaviConfig.OLLAMA_BASE_URL,
        },
        "stt": {
            "model": BhaviConfig.WHISPER_MODEL_SIZE,
            "device": BhaviConfig.WHISPER_DEVICE,
            "loaded": stt_service._whisper_model is not None,
        },
        "tts": tts_status,
        "emotion": {
            "primary_model": BhaviConfig.EMOTION_MODEL_PRIMARY,
            "advanced_model": BhaviConfig.EMOTION_MODEL_ADVANCED,
        },
        "memory": {
            "chromadb_dir": BhaviConfig.CHROMADB_DIR,
            "embedding_model": BhaviConfig.EMBEDDING_MODEL,
        },
        "privacy": {
            "store_raw_audio": BhaviConfig.STORE_RAW_AUDIO,
            "all_local": ollama_ok and model_ok,
        },
        "version": "2.0",
    }


def clear_session(patient_id: int):
    """Clear the session memory for a patient."""
    if patient_id in _session_memories:
        _session_memories[patient_id].clear()
        logger.info("[BHAVI PIPELINE] Session cleared for patient %d", patient_id)
    _session_turn_counts.pop(patient_id, None)


def _exhaustion_fallback(patient_name: str, lang: str) -> str:
    """Return a simple fallback message when voice is exhausted and audio is rejected."""
    fallbacks = {
        "en": f"{patient_name}, our voice time for today is used up. Please type your message — I'm still right here!",
        "ta": f"{patient_name} அவர்களே, இன்னைக்கு குரல் நேரம் முடிஞ்சுடுச்சு. Text-ல பேசுங்க — நான் இங்கேயே இருக்கேன்!",
        "hi": f"{patient_name} जी, आज की बात का समय पूरा हो गया। कृपया text में लिखें — मैं यहीं हूँ!",
    }
    return fallbacks.get(lang, fallbacks["en"])
