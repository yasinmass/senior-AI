"""
Bhavi AI — Personalization Service (v2.0)
==========================================
Generates PERSONALITY_NOTES for Plus tier users by analyzing
their recent conversation history via an Ollama LLM background job.

Run after every N turns (configurable) for Plus users only.
Saves output to Patient.personality_notes field.

Privacy: only uses text summaries — no raw audio ever.
"""

import logging
import threading
from typing import Optional

import requests

from .config import BhaviConfig

logger = logging.getLogger("bhavi.personalization")


def _analyze_personality_sync(patient_id: int, chat_turns: list) -> Optional[str]:
    """
    Internal: call Ollama LLM to extract personality notes from recent turns.

    Args:
        patient_id: Patient DB ID (for logging).
        chat_turns: List of {"role": "user"/"assistant", "content": "..."} dicts.

    Returns:
        Personality notes string, or None if analysis fails.
    """
    if not chat_turns:
        return None

    # Build a conversation log for analysis
    convo_log = "\n".join(
        f"[{t['role'].upper()}]: {t['content'][:200]}"
        for t in chat_turns[-20:]  # Last 20 turns for analysis
    )

    analysis_prompt = (
        "You are a careful analyst. Analyze the following conversation between a senior citizen "
        "and their AI companion Bhavi. Extract a structured set of personality notes that will "
        "help Bhavi become more personalized and effective for this specific person.\n\n"
        "Output ONLY the following structured notes (no preamble, no explanation):\n\n"
        "Preferred formality: [formal/informal/mixed]\n"
        "Language preference: [Tamil/Hindi/English/mixed]\n"
        "Communication style: [brief/detailed/storytelling]\n"
        "Emotional tone: [needs warmth/responds well to humor/prefers calm/appreciates validation]\n"
        "Favorite topics: [list up to 3]\n"
        "Topics to avoid: [list any if evident, else 'none detected']\n"
        "Time-of-day patterns: [if evident from context, else 'not detected']\n"
        "Recurring concerns: [if any, else 'none']\n"
        "Special dates or milestones mentioned: [if any, else 'none']\n"
        "One-line personality summary: [warm summary of who this person is]\n\n"
        f"CONVERSATION LOG:\n{convo_log}"
    )

    payload = {
        "model": BhaviConfig.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": analysis_prompt},
            {"role": "user", "content": "analyze"},
        ],
        "stream": False,
        "options": {
            "temperature": 0.3,   # Lower temperature for structured extraction
            "num_predict": 300,
        },
    }

    try:
        resp = requests.post(
            f"{BhaviConfig.OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=60,
        )
        if resp.status_code == 200:
            notes = resp.json().get("message", {}).get("content", "").strip()
            if notes:
                logger.info(
                    "[BHAVI PERSONALIZATION] Generated personality notes for patient %d (%d chars)",
                    patient_id, len(notes)
                )
                return notes
    except Exception as e:
        logger.error("[BHAVI PERSONALIZATION] LLM analysis failed for patient %d: %s", patient_id, e)

    return None


def analyze_and_save(patient_id: int):
    """
    Analyze recent chat history and save personality notes to Patient.personality_notes.
    Called from a background thread — safe to run async.

    Args:
        patient_id: Patient DB ID.
    """
    # Import inside function to avoid circular imports at module load
    try:
        from core.models import Patient, ChatHistory
    except ImportError:
        try:
            from backend.core.models import Patient, ChatHistory
        except ImportError:
            logger.error("[BHAVI PERSONALIZATION] Cannot import models.")
            return

    try:
        patient = Patient.objects.get(id=patient_id)
    except Exception as e:
        logger.error("[BHAVI PERSONALIZATION] Patient %d not found: %s", patient_id, e)
        return

    if patient.tier != "plus":
        logger.debug("[BHAVI PERSONALIZATION] Skipping — patient %d is not Plus tier.", patient_id)
        return

    # Fetch recent chat turns
    try:
        history_qs = ChatHistory.objects.filter(
            patient=patient
        ).order_by('-created_at')[:20]

        chat_turns = [
            {"role": h.role, "content": h.message}
            for h in reversed(list(history_qs))
        ]
    except Exception as e:
        logger.error("[BHAVI PERSONALIZATION] Failed to fetch chat history: %s", e)
        return

    if len(chat_turns) < 4:
        logger.info(
            "[BHAVI PERSONALIZATION] Not enough turns for patient %d (got %d, need 4+)",
            patient_id, len(chat_turns)
        )
        return

    # Run LLM analysis
    notes = _analyze_personality_sync(patient_id, chat_turns)

    if notes:
        try:
            patient.personality_notes = notes
            patient.save(update_fields=['personality_notes'])
            logger.info(
                "[BHAVI PERSONALIZATION] Saved personality notes for patient %d", patient_id
            )
        except Exception as e:
            logger.error(
                "[BHAVI PERSONALIZATION] Failed to save personality notes: %s", e
            )


def trigger_async(patient_id: int, tier: str, turn_count: int):
    """
    Trigger personalization analysis in a background thread (non-blocking).

    Called after every N turns for Plus users only.
    The turn_count is used to decide if we should run (modulo PERSONALIZATION_TRIGGER_TURNS).

    Args:
        patient_id: Patient DB ID.
        tier: Patient's tier ('free' or 'plus').
        turn_count: Total chat turns so far in this session.
    """
    if tier != "plus":
        return

    # Only run every N turns (configurable)
    trigger_every = BhaviConfig.PERSONALIZATION_TRIGGER_TURNS
    if turn_count > 0 and (turn_count % trigger_every == 0):
        logger.info(
            "[BHAVI PERSONALIZATION] Triggering background analysis for patient %d (turn %d)",
            patient_id, turn_count
        )
        thread = threading.Thread(
            target=analyze_and_save,
            args=(patient_id,),
            daemon=True,
            name=f"bhavi-personalization-{patient_id}",
        )
        thread.start()
