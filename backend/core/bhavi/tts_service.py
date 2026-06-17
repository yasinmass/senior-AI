"""
Bhavi AI — Text-to-Speech Service (Piper TTS)
===============================================
Offline TTS using Piper for natural speech output.
Falls back to gTTS when Piper voices are unavailable.

Features:
  - Elderly-friendly speaking pace
  - Calm conversational tone
  - Streaming-capable WAV output
  - Multilingual (English primary, Tamil/Hindi via fallback)
"""

import io
import os
import subprocess
import logging
from typing import Optional, Tuple

from .config import BhaviConfig

logger = logging.getLogger("bhavi.tts")


def _find_piper_binary() -> Optional[str]:
    """Locate the Piper TTS binary."""
    # Check if piper is in PATH
    import shutil
    piper_path = shutil.which("piper")
    if piper_path:
        return piper_path

    # Check common locations
    candidates = [
        os.path.join(BhaviConfig.DATA_DIR, "piper", "piper.exe"),
        os.path.join(BhaviConfig.DATA_DIR, "piper", "piper"),
        "/usr/local/bin/piper",
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p

    return None


def _get_voice_path(lang: str) -> Optional[str]:
    """Get the Piper voice model path for a language."""
    voice_name = BhaviConfig.PIPER_VOICES.get(lang, "")
    if not voice_name:
        return None

    voice_dir = BhaviConfig.PIPER_VOICE_DIR
    # Look for .onnx model file
    model_path = os.path.join(voice_dir, f"{voice_name}.onnx")
    if os.path.isfile(model_path):
        return model_path

    # Try looking in a subdirectory
    model_path = os.path.join(voice_dir, voice_name, f"{voice_name}.onnx")
    if os.path.isfile(model_path):
        return model_path

    return None


def synthesize_piper(text: str, lang: str = "en") -> Optional[bytes]:
    """
    Synthesize speech using Piper TTS (local/offline).

    Args:
        text: Text to synthesize.
        lang: Language code ('en', 'ta', 'hi').

    Returns:
        WAV audio bytes, or None if Piper unavailable.
    """
    piper_bin = _find_piper_binary()
    if not piper_bin:
        logger.debug("[BHAVI TTS] Piper binary not found.")
        return None

    voice_path = _get_voice_path(lang)
    if not voice_path:
        logger.debug("[BHAVI TTS] No Piper voice for lang '%s'.", lang)
        return None

    try:
        # Run piper with text input via stdin
        cmd = [
            piper_bin,
            "--model", voice_path,
            "--output-raw",
            "--length_scale", str(1.0 / BhaviConfig.PIPER_SPEECH_RATE),
        ]

        proc = subprocess.run(
            cmd,
            input=text.encode("utf-8"),
            capture_output=True,
            timeout=30,
        )

        if proc.returncode != 0:
            logger.warning("[BHAVI TTS] Piper returned error: %s", proc.stderr.decode()[:200])
            return None

        raw_audio = proc.stdout
        if not raw_audio:
            return None

        # Convert raw PCM to WAV
        wav_audio = _pcm_to_wav(raw_audio, sample_rate=22050, channels=1, sample_width=2)
        logger.info("[BHAVI TTS] Piper synthesized %d bytes of WAV for lang '%s'.", len(wav_audio), lang)
        return wav_audio

    except subprocess.TimeoutExpired:
        logger.error("[BHAVI TTS] Piper timed out after 30 seconds.")
        return None
    except Exception as e:
        logger.error("[BHAVI TTS] Piper synthesis failed: %s", e)
        return None


def synthesize_gtts(text: str, lang: str = "en") -> Optional[bytes]:
    """
    Fallback TTS using gTTS (requires internet).
    Returns MP3 audio bytes, or None on failure.
    """
    try:
        from gtts import gTTS
        tts = gTTS(text=text, lang=lang, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        audio_data = buf.getvalue()
        logger.info("[BHAVI TTS] gTTS synthesized %d bytes for lang '%s'.", len(audio_data), lang)
        return audio_data
    except Exception as e:
        logger.error("[BHAVI TTS] gTTS failed: %s", e)
        return None


def synthesize_elevenlabs(text: str) -> Optional[bytes]:
    """
    Synthesize English text using ElevenLabs API.
    Returns MP3 audio bytes, or None on failure.
    """
    import requests as req
    api_key = "sk_3dac30467cc05769ba206411ca96c36e98d01e320af4872a"
    voice_id = "21m00Tcm4TlvDq8ikWAM" # Rachel
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json"
    }
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    try:
        resp = req.post(url, json=data, headers=headers, timeout=15)
        if resp.status_code == 200:
            logger.info("[BHAVI TTS] ElevenLabs synthesized %d bytes for EN.", len(resp.content))
            return resp.content
        else:
            logger.warning("[BHAVI TTS] ElevenLabs failed with HTTP %d: %s", resp.status_code, resp.text[:120])
    except Exception as e:
        logger.error("[BHAVI TTS] ElevenLabs synthesis error: %s", e)
    return None


def synthesize_sarvam(text: str, lang: str = "en") -> Optional[bytes]:
    """
    Primary TTS using Sarvam AI Indian voices (bulbul:v2).
    Supports EN, TA, HI with expressive natural voices.
    Detects quota exhaustion (429/403) and returns None to trigger fallback.
    Returns WAV audio bytes (base64-decoded), or None on failure/exhaustion.
    """
    import base64
    import requests as req

    api_key = BhaviConfig.get_sarvam_api_key()
    if not api_key:
        logger.debug("[BHAVI TTS] No Sarvam API key configured.")
        return None

    lang_code = BhaviConfig.SARVAM_LANG_CODES.get(lang, "en-IN")
    speaker   = BhaviConfig.SARVAM_SPEAKERS.get(lang, "anushka")

    try:
        resp = req.post(
            BhaviConfig.SARVAM_API_URL,
            json={
                "inputs": [text],
                "target_language_code": lang_code,
                "speaker": speaker,
                "model": BhaviConfig.SARVAM_MODEL,
                "enable_preprocessing": True,
            },
            headers={"api-subscription-key": api_key},
            timeout=BhaviConfig.SARVAM_TIMEOUT,
        )
        if resp.status_code == 200:
            audios = resp.json().get("audios", [])
            if audios:
                wav_bytes = base64.b64decode(audios[0])
                logger.info("[BHAVI TTS] Sarvam synthesized %d bytes for lang '%s' (%s) — EXPRESSIVE voice.", len(wav_bytes), lang, speaker)
                return wav_bytes
            logger.warning("[BHAVI TTS] Sarvam returned no audio in response.")
        elif resp.status_code == 429:
            logger.warning("[BHAVI TTS] Sarvam quota exhausted (429) — falling back to next TTS service.")
        elif resp.status_code == 403:
            logger.warning("[BHAVI TTS] Sarvam API forbidden/unauthorized (403) — likely quota issue. Falling back.")
        else:
            logger.warning("[BHAVI TTS] Sarvam HTTP %d: %s", resp.status_code, resp.text[:120])
    except req.Timeout:
        logger.warning("[BHAVI TTS] Sarvam timeout after %ds — falling back.", BhaviConfig.SARVAM_TIMEOUT)
    except req.ConnectionError as e:
        logger.warning("[BHAVI TTS] Sarvam connection error: %s — falling back.", e)
    except Exception as e:
        logger.error("[BHAVI TTS] Sarvam synthesis error: %s", e)
    return None


def synthesize(text: str, lang: str = "en") -> Tuple[Optional[bytes], str]:
    """
    Synthesize speech with comprehensive fallback chain (Task 3 & 4).
    
    Priority order:
      1. Sarvam AI (bulbul:v2) — expressive Indian voices (EN/TA/HI), WAV output
         - Supports 3 languages with natural, warm speakers
         - Returns if successful, falls through on 429/403/error
      2. Google TTS (gTTS) — online fallback, MP3 output
         - Works when Sarvam exhausted, requires internet
      3. Piper TTS — local offline last resort, WAV output
         - No external API calls, works offline
    
    Quota Exhaustion Handling:
      - If Sarvam returns 429/403: treated as exhausted, skips to gTTS
      - If gTTS unavailable: falls back to Piper (local)
      - If all fail: returns (None, "") and logs comprehensive error

    Args:
        text (str): Text to synthesize
        lang (str): Language code ('en', 'ta', 'hi')

    Returns:
        (audio_bytes, content_type) or (None, "") on total failure
        - content_type: 'audio/wav' or 'audio/mpeg'
    """
    if not text or not text.strip():
        return None, ""

    # ── 0. ElevenLabs — primary for English only ────────────────────────────
    if lang == "en":
        logger.info("[BHAVI TTS] Trying ElevenLabs for lang '%s'...", lang)
        mp3_audio = synthesize_elevenlabs(text)
        if mp3_audio:
            return mp3_audio, "audio/mpeg"
        logger.warning("[BHAVI TTS] ElevenLabs failed/exhausted, falling back to Sarvam...")

    # ── 1. Sarvam — primary Indian voice (EN/TA/HI with expressive speakers) ─
    logger.info("[BHAVI TTS] Trying Sarvam AI for lang '%s'...", lang)
    wav_audio = synthesize_sarvam(text, lang)
    if wav_audio:
        return wav_audio, "audio/wav"

    # ── 2. gTTS — Google TTS online fallback ────────────────────────────────
    logger.info("[BHAVI TTS] Sarvam unavailable/exhausted, trying gTTS for lang '%s'...", lang)
    mp3_audio = synthesize_gtts(text, lang)
    if mp3_audio:
        logger.info("[BHAVI TTS] gTTS fallback succeeded for lang '%s'.", lang)
        return mp3_audio, "audio/mpeg"

    # ── 3. Piper — local offline last resort ────────────────────────────────
    logger.info("[BHAVI TTS] gTTS unavailable, trying Piper for lang '%s' (offline fallback)...", lang)
    wav_audio = synthesize_piper(text, lang)
    if wav_audio:
        logger.info("[BHAVI TTS] Piper offline fallback succeeded for lang '%s'.", lang)
        return wav_audio, "audio/wav"

    # ── All TTS engines failed ──────────────────────────────────────────────
    logger.error(
        "[BHAVI TTS] ❌ CRITICAL: All TTS engines failed for lang '%s'. "
        "Sarvam (exhausted?), gTTS (no internet?), Piper (no model?). "
        "User will see silence in voice chat.",
        lang
    )
    return None, ""


def _pcm_to_wav(
    pcm_data: bytes,
    sample_rate: int = 22050,
    channels: int = 1,
    sample_width: int = 2,
) -> bytes:
    """Convert raw PCM data to WAV format."""
    import struct

    data_size = len(pcm_data)
    # WAV header (44 bytes)
    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        36 + data_size,
        b'WAVE',
        b'fmt ',
        16,                          # chunk size
        1,                           # PCM format
        channels,
        sample_rate,
        sample_rate * channels * sample_width,  # byte rate
        channels * sample_width,     # block align
        sample_width * 8,            # bits per sample
        b'data',
        data_size,
    )
    return header + pcm_data


def get_tts_status() -> dict:
    """
    Check TTS system availability with detailed diagnostics.
    Checks all three TTS backends: Sarvam, gTTS, and Piper.
    """
    import requests as req
    
    status = {
        "sarvam": {
            "configured": False,
            "connectivity": "unknown",
            "languages_supported": ["en", "ta", "hi"],
            "status": "unknown"
        },
        "gtts": {
            "available": False,
            "connectivity": "unknown",
            "status": "unknown"
        },
        "piper": {
            "binary_available": False,
            "voice_models": {},
            "status": "unknown"
        },
        "fallback_chain": "Sarvam → gTTS → Piper",
        "overall_health": "unknown"
    }
    
    # ── Check Sarvam API ────────────────────────────────────────────────────
    sarvam_key = BhaviConfig.get_sarvam_api_key()
    status["sarvam"]["configured"] = bool(sarvam_key)
    
    if sarvam_key:
        try:
            # Test Sarvam connectivity with a minimal request
            resp = req.post(
                BhaviConfig.SARVAM_API_URL,
                json={
                    "inputs": ["test"],
                    "target_language_code": "en-IN",
                    "speaker": "anushka",
                    "model": BhaviConfig.SARVAM_MODEL,
                },
                headers={"api-subscription-key": sarvam_key},
                timeout=5,
            )
            if resp.status_code == 200:
                status["sarvam"]["connectivity"] = "ok"
                status["sarvam"]["status"] = "working"
            elif resp.status_code == 429:
                status["sarvam"]["connectivity"] = "rate_limited"
                status["sarvam"]["status"] = "exhausted_quota"
            elif resp.status_code == 403:
                status["sarvam"]["connectivity"] = "forbidden"
                status["sarvam"]["status"] = "unauthorized_or_invalid_key"
            else:
                status["sarvam"]["connectivity"] = "error"
                status["sarvam"]["status"] = f"http_{resp.status_code}"
        except req.Timeout:
            status["sarvam"]["connectivity"] = "timeout"
            status["sarvam"]["status"] = "slow_or_unreachable"
        except Exception as e:
            status["sarvam"]["connectivity"] = "error"
            status["sarvam"]["status"] = str(e)[:50]
    
    # ── Check gTTS availability ─────────────────────────────────────────────
    try:
        from gtts import gTTS
        status["gtts"]["available"] = True
        # Try a quick synthesis
        try:
            tts = gTTS(text="test", lang="en", slow=False)
            status["gtts"]["connectivity"] = "ok"
            status["gtts"]["status"] = "working"
        except Exception as e:
            status["gtts"]["connectivity"] = "error"
            status["gtts"]["status"] = str(e)[:50]
    except ImportError:
        status["gtts"]["available"] = False
        status["gtts"]["connectivity"] = "not_installed"
        status["gtts"]["status"] = "module_not_found"
    
    # ── Check Piper availability ────────────────────────────────────────────
    piper_bin = _find_piper_binary()
    status["piper"]["binary_available"] = piper_bin is not None
    
    for lang in ("en", "ta", "hi"):
        voice_path = _get_voice_path(lang)
        speaker_name = BhaviConfig.PIPER_VOICES.get(lang, "")
        status["piper"]["voice_models"][lang] = {
            "available": voice_path is not None,
            "speaker": speaker_name,
            "path": voice_path,
        }
    
    status["piper"]["status"] = "working" if piper_bin else "binary_not_found"
    
    # ── Overall health assessment ───────────────────────────────────────────
    sarvam_ok = status["sarvam"]["connectivity"] == "ok"
    gtts_ok = status["gtts"]["connectivity"] == "ok"
    piper_ok = status["piper"]["binary_available"]
    
    if sarvam_ok:
        status["overall_health"] = "excellent"
    elif gtts_ok and piper_ok:
        status["overall_health"] = "good"
    elif gtts_ok or piper_ok:
        status["overall_health"] = "degraded"
    else:
        status["overall_health"] = "critical"
    
    logger.info(
        "[BHAVI TTS STATUS] Sarvam: %s (%s) | gTTS: %s | Piper: %s | Overall: %s",
        status["sarvam"]["status"],
        status["sarvam"]["connectivity"],
        status["gtts"]["status"],
        status["piper"]["status"],
        status["overall_health"]
    )
    
    return status
