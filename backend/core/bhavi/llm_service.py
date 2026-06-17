"""
Bhavi AI — LLM Service v2.1 (Groq-first → Ollama fallback)
==============================================================
Cloud-first strategy:
  1. If GROQ_API_KEY is set, call Groq REST API first (fast, <2s)
  2. If Groq is unavailable / exhausted / timed-out, fall back
     automatically to local Ollama (qwen2.5:3b)

Supports both streaming and synchronous generation.
Supports English, Tamil, and Hindi natively through Groq.

v2.1 changes:
- Groq API (llama-3.3-70b-specdec) tried first for all generation
- Robust fallback to Ollama on ANY cloud failure
- Fast Groq timeout (15s) so fallback is quick
- Full Bhavi v2.0 system prompt injection with all state variables
- Structured ---MEMORY_START--- block injection
- [MEMORY_UPDATE: ...] tag parsing
- Tier-aware prompt building (Free / Plus)
- Soft 80% warning weaving logic
"""

import json
import logging
import re
from typing import Generator, Optional, List, Dict, Tuple

import requests

from .config import BhaviConfig

logger = logging.getLogger("bhavi.llm")


# ── Memory Update Tag Parser ──────────────────────────────────────────────────

def parse_memory_updates(response_text: str) -> Tuple[str, List[str]]:
    """
    Extract [MEMORY_UPDATE: ...] tags from Bhavi's response.

    Returns:
        (clean_response, list_of_facts)
        - clean_response: response with all [MEMORY_UPDATE: ...] tags stripped
        - list_of_facts: list of extracted fact strings
    """
    pattern = r'\[MEMORY_UPDATE:\s*([^\]]+)\]'
    facts = re.findall(pattern, response_text)
    clean = re.sub(pattern, '', response_text).strip()
    # Clean up any double newlines left behind
    clean = re.sub(r'\n{3,}', '\n\n', clean)
    return clean, [f.strip() for f in facts if f.strip()]


# ── Memory Context Builder ────────────────────────────────────────────────────

def build_memory_context_block(
    memories: List[Dict],
    memory_facts: List[str],
    patient_name: str = "Friend",
    preferred_lang: str = "en",
    known_interests: List[str] = None,
    recent_topics: List[str] = None,
    last_session_summary: str = "",
    emotional_pattern: str = "",
) -> str:
    """
    Build the structured ---MEMORY_START--- block for the system prompt.
    Combines ChromaDB semantic memories + DB-stored BhaviMemoryFact records.
    """
    lines = ["---MEMORY_START---"]
    lines.append(f"User name: {patient_name}")
    lines.append(f"Preferred language: {BhaviConfig.SUPPORTED_LANGUAGES.get(preferred_lang, 'English')}")

    if known_interests:
        lines.append(f"Known interests: {', '.join(known_interests)}")

    if recent_topics:
        lines.append(f"Recent topics: {', '.join(recent_topics[-3:])}")

    if memory_facts:
        lines.append(f"Important facts:")
        for fact in memory_facts[:10]:
            lines.append(f"  - {fact}")

    if last_session_summary:
        lines.append(f"Last conversation: {last_session_summary}")

    if memories:
        lines.append("Semantic memory:")
        for m in memories[:4]:
            text = m.get("text", "")[:150]
            lines.append(f"  • {text}")

    if emotional_pattern:
        lines.append(f"Emotional pattern: {emotional_pattern}")

    lines.append("---MEMORY_END---")
    return "\n".join(lines)


# ── System Prompt Builder ─────────────────────────────────────────────────────

def _build_system_prompt(
    # Patient identity
    patient_name: str = "Friend",
    patient_lang: str = "auto",
    tier: str = "free",
    # Voice quota state
    voice_quota_used: float = 0.0,
    voice_quota_limit: float = 3.0,
    voice_exhausted: bool = False,
    quota_resets_in: float = 24.0,
    upgrade_msg_shown: bool = False,
    # Context
    memory_context: str = "No stored memories yet.",
    personality_notes: str = "",
    diary_context: str = "No recent diary entries.",
    emotion_context: str = "No recent emotion data.",
    # Language
    lang: str = "auto",
) -> str:
    """Build the full Bhavi v2.0 system prompt with all state variables injected."""

    lang_instruction = BhaviConfig.LANG_INSTRUCTIONS.get(
        lang, BhaviConfig.LANG_INSTRUCTIONS["auto"]
    )

    # Personality notes — only inject for plus, else empty string
    personality_section = personality_notes if (tier == "plus" and personality_notes) else "Not available (Free tier)."

    return BhaviConfig.SYSTEM_PROMPT_TEMPLATE.format(
        USER_TIER=tier.upper(),
        USER_NAME=patient_name,
        USER_LANG=BhaviConfig.SUPPORTED_LANGUAGES.get(patient_lang, "auto"),
        VOICE_QUOTA_USED=f"{voice_quota_used:.1f}",
        VOICE_QUOTA_LIMIT=f"{voice_quota_limit:.1f}",
        VOICE_EXHAUSTED=str(voice_exhausted).lower(),
        QUOTA_RESETS_IN=f"{quota_resets_in:.0f}",
        UPGRADE_MSG_SHOWN=str(upgrade_msg_shown).lower(),
        MEMORY_CONTEXT=memory_context,
        PERSONALITY_NOTES=personality_section,
        DIARY_CONTEXT=diary_context,
        EMOTION_CONTEXT=emotion_context,
        LANG_INSTRUCTION=lang_instruction,
    )


# ── Ollama Health Checks ──────────────────────────────────────────────────────

def check_ollama_status() -> bool:
    """Check if Ollama server is running and responsive."""
    try:
        resp = requests.get(
            f"{BhaviConfig.OLLAMA_BASE_URL}/api/tags",
            timeout=5,
        )
        return resp.status_code == 200
    except Exception:
        return False


def check_model_available() -> bool:
    """Check if the configured model is available in Ollama."""
    try:
        resp = requests.get(
            f"{BhaviConfig.OLLAMA_BASE_URL}/api/tags",
            timeout=5,
        )
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            target = BhaviConfig.OLLAMA_MODEL
            return any(target in name for name in model_names)
        return False
    except Exception:
        return False


# ── Main Generation Function ──────────────────────────────────────────────────

def generate(
    user_message: str,
    history: Optional[List[Dict[str, str]]] = None,
    # Patient identity
    patient_name: str = "Friend",
    patient_lang: str = "auto",
    tier: str = "free",
    # Quota state
    voice_quota_used: float = 0.0,
    voice_quota_limit: float = 3.0,
    voice_exhausted: bool = False,
    quota_resets_in: float = 24.0,
    upgrade_msg_shown: bool = False,
    # Context
    memory_context: str = "No stored memories yet.",
    personality_notes: str = "",
    diary_context: str = "No recent diary entries.",
    emotion_context: str = "No recent emotion data.",
    # Language
    lang: str = "auto",
    stream: bool = False,
) -> str:
    """
    Generate a Bhavi v2.1 response.

    Strategy:
      1. Try Groq API (fast cloud, <2s) if GROQ_API_KEY is available.
      2. Fall back to local Ollama (qwen2.5:3b) on any Groq failure.

    Returns:
        Complete AI response text (tags already stripped by pipeline).
        Or generator if stream=True.
    """
    system_prompt = _build_system_prompt(
        patient_name=patient_name,
        patient_lang=patient_lang,
        tier=tier,
        voice_quota_used=voice_quota_used,
        voice_quota_limit=voice_quota_limit,
        voice_exhausted=voice_exhausted,
        quota_resets_in=quota_resets_in,
        upgrade_msg_shown=upgrade_msg_shown,
        memory_context=memory_context,
        personality_notes=personality_notes,
        diary_context=diary_context,
        emotion_context=emotion_context,
        lang=lang,
    )

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last N turns)
    if history:
        messages.extend(history[-BhaviConfig.MEMORY_SHORT_TERM_TURNS * 2:])

    messages.append({"role": "user", "content": user_message})

    # ── 1. Try ALL Groq keys (primary then backup) ──────────────────────────
    api_keys = BhaviConfig.get_groq_api_keys()
    if api_keys:
        try:
            if stream:
                return _generate_groq_stream(messages, api_keys[0])
            else:
                result = _generate_groq_all_keys(messages)
                if result == BhaviConfig.BHAVI_QUOTA_EXCEEDED:
                    # Task 2: Show "Upgrade to Bhavi Plus" in user's language
                    upgrade_lang = lang if lang in _UPGRADE_MESSAGES else "en"
                    logger.warning("[BHAVI LLM] Quota exceeded — showing upgrade message.")
                    return _UPGRADE_MESSAGES[upgrade_lang]
                if result:
                    logger.info("[BHAVI LLM] Groq response: %d chars", len(result))
                    return result
        except Exception as e:
            logger.warning("[BHAVI LLM] Groq failed (%s), falling back to Ollama", e)

    # ── 2. Fall back to local Ollama ───────────────────────────────────────
    payload = {
        "model": BhaviConfig.OLLAMA_MODEL,
        "messages": messages,
        "stream": stream,
        "options": {
            "temperature": BhaviConfig.LLM_TEMPERATURE,
            "num_predict": BhaviConfig.LLM_MAX_TOKENS,
        },
    }

    try:
        if stream:
            return _generate_stream(payload)
        else:
            return _generate_sync(payload)
    except requests.ConnectionError:
        logger.error("[BHAVI LLM] Cannot connect to Ollama at %s", BhaviConfig.OLLAMA_BASE_URL)
        return _fallback_response(patient_name, lang)
    except requests.Timeout:
        logger.error("[BHAVI LLM] Ollama request timed out after %ds", BhaviConfig.OLLAMA_TIMEOUT)
        return _fallback_response(patient_name, lang)
    except Exception as e:
        logger.error("[BHAVI LLM] Unexpected Ollama error: %s", e)
        return _fallback_response(patient_name, lang)


# ── Groq API Helpers ──────────────────────────────────────────────────

def _generate_groq(messages: list, api_key: str) -> Optional[str]:
    """
    Synchronous Groq API call. Tries each model in GROQ_MODELS until one succeeds.
    Returns response text or None on failure.
    Use _generate_groq_all_keys() for multi-key support.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    for model in BhaviConfig.GROQ_MODELS:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": BhaviConfig.LLM_MAX_TOKENS,
            "temperature": BhaviConfig.LLM_TEMPERATURE,
            "stream": False,
        }
        try:
            resp = requests.post(
                BhaviConfig.GROQ_API_URL,
                json=payload,
                headers=headers,
                timeout=BhaviConfig.GROQ_TIMEOUT,
            )
            if resp.status_code == 200:
                content = (
                    resp.json()
                    .get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                    .strip()
                )
                if content:
                    logger.info("[BHAVI LLM] Groq success with model '%s'", model)
                    return content
            elif resp.status_code == 429:
                logger.warning("[BHAVI LLM] Groq rate limit on model '%s', trying next", model)
                continue
            else:
                logger.warning("[BHAVI LLM] Groq HTTP %d on model '%s'", resp.status_code, model)
                continue
        except (requests.Timeout, requests.ConnectionError) as e:
            logger.warning("[BHAVI LLM] Groq connection/timeout for model '%s': %s", model, e)
            continue
    return None


def _generate_groq_all_keys(messages: list) -> Optional[str]:
    """
    Try ALL configured Groq API keys in order.
    Returns:
        - Response text on success
        - BhaviConfig.BHAVI_QUOTA_EXCEEDED if ALL keys are rate-limited (429)
        - None on connection/other errors
    """
    api_keys = BhaviConfig.get_groq_api_keys()
    if not api_keys:
        return None

    all_exhausted = True
    for idx, key in enumerate(api_keys):
        logger.info("[BHAVI LLM] Trying Groq key #%d", idx + 1)
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        for model in BhaviConfig.GROQ_MODELS:
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": BhaviConfig.LLM_MAX_TOKENS,
                "temperature": BhaviConfig.LLM_TEMPERATURE,
                "stream": False,
            }
            try:
                resp = requests.post(
                    BhaviConfig.GROQ_API_URL,
                    json=payload,
                    headers=headers,
                    timeout=BhaviConfig.GROQ_TIMEOUT,
                )
                if resp.status_code == 200:
                    content = (
                        resp.json()
                        .get("choices", [{}])[0]
                        .get("message", {})
                        .get("content", "")
                        .strip()
                    )
                    if content:
                        logger.info("[BHAVI LLM] Groq key #%d success with model '%s'", idx + 1, model)
                        return content
                elif resp.status_code == 429:
                    logger.warning("[BHAVI LLM] Key #%d model '%s' rate limited", idx + 1, model)
                    continue  # all_exhausted stays True
                else:
                    all_exhausted = False  # got a non-429 error — not exhausted, just broken
                    logger.warning("[BHAVI LLM] Key #%d HTTP %d on model '%s'", idx + 1, resp.status_code, model)
                    continue
            except (requests.Timeout, requests.ConnectionError) as e:
                all_exhausted = False
                logger.warning("[BHAVI LLM] Key #%d connection error on model '%s': %s", idx + 1, model, e)
                continue

    if all_exhausted:
        logger.warning("[BHAVI LLM] ALL Groq keys exhausted (429). Returning quota sentinel.")
        return BhaviConfig.BHAVI_QUOTA_EXCEEDED

    return None


# ── Groq Quota-Exceeded Upgrade Messages ─────────────────────────────────────

_UPGRADE_MESSAGES = {
    "ta": (
        "அன்பே, இன்று நம்முடைய Groq AI நேரம் முடிஞ்சுடுச்சு. 😔 "
        "ஆனா கவலைப்படாதீங்க — நான் இங்கேயே இருக்கேன்! "
        "சிறிது நேரம் கழிச்சு திரும்பவும் பேசலாம். "
        "தடையில்லாம தினமும் பேச Bhavi Plus பாருங்க! 💛"
    ),
    "hi": (
        "प्रिय, आज का Groq AI समय पूरा हो गया। 😔 "
        "लेकिन चिंता मत करें — मैं यहाँ हूँ! "
        "थोड़ी देर में फिर बात करें। "
        "रोज़ बिना रुके बात के लिए Bhavi Plus देखें। 💛"
    ),
    "en": (
        "Dear friend, today's Groq AI time has been used up. 😔 "
        "But don't worry — I'm right here with you! "
        "Please try again in a little while. "
        "For unlimited daily conversations, check out Bhavi Plus! 💛"
    ),
}




def _generate_groq_stream(messages: list, api_key: str) -> Generator[str, None, None]:
    """
    Streaming Groq API call. Parses SSE data: {...} chunks and yields text.
    Falls back to empty yield on failure (caller should handle generator result).
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    for model in BhaviConfig.GROQ_MODELS:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": BhaviConfig.LLM_MAX_TOKENS,
            "temperature": BhaviConfig.LLM_TEMPERATURE,
            "stream": True,
        }
        try:
            resp = requests.post(
                BhaviConfig.GROQ_API_URL,
                json=payload,
                headers=headers,
                timeout=BhaviConfig.GROQ_TIMEOUT,
                stream=True,
            )
            if resp.status_code != 200:
                logger.warning("[BHAVI LLM] Groq stream HTTP %d on model '%s'", resp.status_code, model)
                continue
            # Successfully connected to this model
            logger.info("[BHAVI LLM] Groq streaming with model '%s'", model)
            got_any = False
            for raw_line in resp.iter_lines():
                if not raw_line:
                    continue
                line = raw_line.decode("utf-8") if isinstance(raw_line, bytes) else raw_line
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        return
                    try:
                        data = json.loads(data_str)
                        delta = (
                            data.get("choices", [{}])[0]
                            .get("delta", {})
                            .get("content", "")
                        )
                        if delta:
                            got_any = True
                            yield delta
                    except json.JSONDecodeError:
                        continue
            if got_any:
                return
        except (requests.Timeout, requests.ConnectionError) as e:
            logger.warning("[BHAVI LLM] Groq stream error for model '%s': %s", model, e)
            continue
    # All Groq models failed — caller should fall back to Ollama
    raise RuntimeError("All Groq models failed for streaming")



def _generate_sync(payload: dict) -> str:
    """Synchronous (non-streaming) generation."""
    payload["stream"] = False
    resp = requests.post(
        f"{BhaviConfig.OLLAMA_BASE_URL}/api/chat",
        json=payload,
        timeout=BhaviConfig.OLLAMA_TIMEOUT,
    )

    if resp.status_code != 200:
        logger.error("[BHAVI LLM] Ollama returned status %d: %s", resp.status_code, resp.text[:200])
        return _fallback_response()

    data = resp.json()
    content = data.get("message", {}).get("content", "").strip()

    if not content:
        return _fallback_response()

    logger.info("[BHAVI LLM] Generated response: %d chars", len(content))
    return content


def _generate_stream(payload: dict) -> Generator[str, None, None]:
    """Streaming generation — yields text chunks as they arrive."""
    payload["stream"] = True
    resp = requests.post(
        f"{BhaviConfig.OLLAMA_BASE_URL}/api/chat",
        json=payload,
        timeout=BhaviConfig.OLLAMA_TIMEOUT,
        stream=True,
    )

    if resp.status_code != 200:
        logger.error("[BHAVI LLM] Ollama stream error: %d", resp.status_code)
        yield _fallback_response()
        return

    for line in resp.iter_lines():
        if line:
            try:
                data = json.loads(line)
                chunk = data.get("message", {}).get("content", "")
                if chunk:
                    yield chunk
                if data.get("done", False):
                    break
            except json.JSONDecodeError:
                continue


# ── Greeting Generator ────────────────────────────────────────────────────────

def generate_greeting(
    patient_name: str = "Friend",
    diary_context: str = "No recent diary entries.",
    memory_context: str = "",
    last_session_summary: str = "",
    lang: str = "en",
    tier: str = "free",
) -> str:
    """
    Generate a personalized greeting.
    v2.1: Tries Groq first (5s timeout) then falls back to Ollama.
    Shorter and warmer than regular responses.
    References last session if available.
    """
    lang_instruction = BhaviConfig.LANG_INSTRUCTIONS.get(lang, "Always respond in English.")

    memory_hint = ""
    if last_session_summary:
        memory_hint = f"\nLast conversation summary: {last_session_summary}"
    elif memory_context and memory_context != "No stored memories yet.":
        memory_hint = f"\nRecent memory: {memory_context[:200]}"

    system_prompt = (
        f"You are Bhavi, a warm AI companion for senior citizens.\n"
        f"Patient name: {patient_name}\n"
        f"Their recent diary entries (last 3 days):\n{diary_context}\n"
        f"{memory_hint}\n\n"
        f"{lang_instruction}\n\n"
        "Generate a warm, personal greeting (2 sentences max). "
        "If there is a last conversation summary, reference something from it naturally "
        "(e.g. 'yesterday you mentioned your garden \u2014 how is it today?'). "
        "Be friendly, caring, unhurried. Never say 'Certainly!' or 'Great to see you!'. "
        "Do NOT mention AI, models, or technology."
    )

    greeting_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "greet"},
    ]

    # ── 1. Try Groq first (short timeout for greeting) ─────────────────────
    api_key = BhaviConfig.get_groq_api_key()
    if api_key:
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            for model in BhaviConfig.GROQ_MODELS:
                payload = {
                    "model": model,
                    "messages": greeting_messages,
                    "max_tokens": 120,
                    "temperature": 0.8,
                    "stream": False,
                }
                try:
                    resp = requests.post(
                        BhaviConfig.GROQ_API_URL,
                        json=payload,
                        headers=headers,
                        timeout=min(BhaviConfig.GROQ_TIMEOUT, 10),  # shorter for greeting
                    )
                    if resp.status_code == 200:
                        content = (
                            resp.json()
                            .get("choices", [{}])[0]
                            .get("message", {})
                            .get("content", "")
                            .strip()
                        )
                        if content:
                            logger.info("[BHAVI LLM] Groq greeting via model '%s'", model)
                            return content
                    elif resp.status_code == 429:
                        continue  # try next model
                except (requests.Timeout, requests.ConnectionError):
                    continue
        except Exception as e:
            logger.warning("[BHAVI LLM] Groq greeting failed: %s", e)

    # ── 2. Fall back to Ollama ──────────────────────────────────────────
    payload = {
        "model": BhaviConfig.OLLAMA_MODEL,
        "messages": greeting_messages,
        "stream": False,
        "options": {
            "temperature": 0.8,
            "num_predict": 120,
        },
    }

    try:
        resp = requests.post(
            f"{BhaviConfig.OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=BhaviConfig.OLLAMA_TIMEOUT,
        )
        if resp.status_code == 200:
            content = resp.json().get("message", {}).get("content", "").strip()
            if content:
                return content
    except Exception as e:
        logger.error("[BHAVI LLM] Ollama greeting generation failed: %s", e)

    # ── 3. Static fallback ──────────────────────────────────────────────
    fallbacks = {
        "en": f"Hello {patient_name}! I'm Bhavi, your companion. How are you feeling today?",
        "ta": f"வணக்கம் {patient_name}! நான் பவி. இன்னைக்கு எப்படி இருக்கீங்க?",
        "hi": f"नमस्ते {patient_name}! मैं भवि हूँ। आज कैसा महसूस हो रहा है?",
    }
    return fallbacks.get(lang, fallbacks["en"])


def generate_title(user_text: str, ai_response: str) -> str:
    """Generate a short 4-5 word title for a new conversation session."""
    system_prompt = (
        "You are an AI that creates very short, concise titles for conversations. "
        "Summarize the topic of the following exchange into a 3 to 5 word phrase. "
        "Do not use quotes. Do not include a period. Capitalize words properly. "
        "Example: 'GitHub Account Setup' or 'Feeling Anxious About Health'."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"User: {user_text}\nAI: {ai_response}"}
    ]

    api_key = BhaviConfig.get_groq_api_key()
    if api_key:
        try:
            for model in BhaviConfig.GROQ_MODELS:
                resp = requests.post(
                    BhaviConfig.GROQ_API_URL,
                    json={
                        "model": model,
                        "messages": messages,
                        "max_tokens": 15,
                        "temperature": 0.5,
                        "stream": False,
                    },
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=5,
                )
                if resp.status_code == 200:
                    title = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip('"\' .')
                    if title: return title
        except Exception:
            pass

    # Fallback to Ollama
    try:
        resp = requests.post(
            f"{BhaviConfig.OLLAMA_BASE_URL}/api/chat",
            json={
                "model": BhaviConfig.OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {"temperature": 0.5, "num_predict": 15},
            },
            timeout=5,
        )
        if resp.status_code == 200:
            title = resp.json().get("message", {}).get("content", "").strip('"\' .')
            if title: return title
    except Exception:
        pass

    return "New Chat"


# ── Fallback Response ─────────────────────────────────────────────────────────

def _fallback_response(patient_name: str = "Friend", lang: str = "en") -> str:
    """Graceful fallback when Ollama is unavailable."""
    fallbacks = {
        "en": f"I'm here with you, {patient_name}. Could you tell me more about how you're feeling?",
        "ta": f"நான் உங்களுடன் இருக்கிறேன், {patient_name}. உங்கள் உணர்வுகளைப் பற்றி மேலும் சொல்ல முடியுமா?",
        "hi": f"मैं आपके साथ हूँ, {patient_name}. क्या आप बता सकते हैं कि आप कैसा महसूस कर रहे हैं?",
    }
    return fallbacks.get(lang, fallbacks["en"])


# ── Health Check & Status Reporting ───────────────────────────────────────

def get_llm_status() -> dict:
    """
    Check LLM subsystem health:
      - Groq API key availability and status
      - Ollama server connectivity
      - Model availability
    
    Returns comprehensive status dict for debugging/admin dashboards.
    """
    status = {
        "groq": {
            "configured": False,
            "keys_count": 0,
            "connectivity": "unknown",
            "status": "not_configured"
        },
        "ollama": {
            "connectivity": "unknown",
            "model_available": False,
            "status": "unknown"
        },
        "fallback_available": False,
    }
    
    # Check Groq configuration
    groq_keys = BhaviConfig.get_groq_api_keys()
    status["groq"]["configured"] = len(groq_keys) > 0
    status["groq"]["keys_count"] = len(groq_keys)
    
    if groq_keys:
        try:
            # Quick Groq health check
            headers = {
                "Authorization": f"Bearer {groq_keys[0]}",
                "Content-Type": "application/json",
            }
            test_payload = {
                "model": BhaviConfig.GROQ_MODELS[0],
                "messages": [{"role": "user", "content": "ping"}],
                "max_tokens": 10,
            }
            resp = requests.post(
                BhaviConfig.GROQ_API_URL,
                json=test_payload,
                headers=headers,
                timeout=5,
            )
            if resp.status_code == 200:
                status["groq"]["connectivity"] = "ok"
                status["groq"]["status"] = "working"
            elif resp.status_code == 429:
                status["groq"]["connectivity"] = "exhausted"
                status["groq"]["status"] = "rate_limited_all_keys"
            else:
                status["groq"]["connectivity"] = "error"
                status["groq"]["status"] = f"http_{resp.status_code}"
        except Exception as e:
            status["groq"]["connectivity"] = "error"
            status["groq"]["status"] = str(e)[:50]
    
    # Check Ollama connectivity
    try:
        resp = requests.get(
            f"{BhaviConfig.OLLAMA_BASE_URL}/api/tags",
            timeout=5,
        )
        if resp.status_code == 200:
            status["ollama"]["connectivity"] = "ok"
            models = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            status["ollama"]["model_available"] = any(
                BhaviConfig.OLLAMA_MODEL in name for name in model_names
            )
            status["ollama"]["status"] = "working" if status["ollama"]["model_available"] else "no_model"
        else:
            status["ollama"]["connectivity"] = "error"
            status["ollama"]["status"] = f"http_{resp.status_code}"
    except requests.ConnectionError:
        status["ollama"]["connectivity"] = "connection_refused"
        status["ollama"]["status"] = "offline"
    except Exception as e:
        status["ollama"]["connectivity"] = "error"
        status["ollama"]["status"] = str(e)[:50]
    
    # Check if fallback is available
    status["fallback_available"] = (
        status["ollama"]["connectivity"] == "ok" 
        and status["ollama"]["model_available"]
    )
    
    logger.info(
        "[BHAVI LLM STATUS] Groq: %s (%d keys, %s) | Ollama: %s (%s) | Fallback: %s",
        status["groq"]["status"],
        status["groq"]["keys_count"],
        status["groq"]["connectivity"],
        status["ollama"]["status"],
        status["ollama"]["connectivity"],
        "yes" if status["fallback_available"] else "NO"
    )
    
    return status
