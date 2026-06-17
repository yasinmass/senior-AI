"""
Bhavi AI — Speech-to-Text Service
===================================
Faster-Whisper based STT with automatic language detection.
Supports Tamil, Hindi, and English. Fully offline.

Refactored from inline views.py code into a reusable service.
"""

import os
import subprocess
import tempfile
import logging
from typing import Optional, Dict

from .config import BhaviConfig

logger = logging.getLogger("bhavi.stt")

# ── Singleton model instance ──────────────────────────────────────────────────
_whisper_model = None


def get_model():
    """Lazy-load the Faster-Whisper model (singleton)."""
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            _whisper_model = WhisperModel(
                BhaviConfig.WHISPER_MODEL_SIZE,
                device=BhaviConfig.WHISPER_DEVICE,
                compute_type=BhaviConfig.WHISPER_COMPUTE_TYPE,
            )
            logger.info(
                "[BHAVI STT] Faster-Whisper model '%s' loaded on %s (%s)",
                BhaviConfig.WHISPER_MODEL_SIZE,
                BhaviConfig.WHISPER_DEVICE,
                BhaviConfig.WHISPER_COMPUTE_TYPE,
            )
        except Exception as e:
            logger.error("[BHAVI STT] Failed to load Whisper model: %s", e)
    return _whisper_model


def convert_audio_to_wav(input_path: str, output_path: str) -> bool:
    """Convert any audio format to 16kHz mono WAV using ffmpeg."""
    try:
        subprocess.run(
            ["ffmpeg", "-i", input_path, "-ar", "16000", "-ac", "1", "-y", output_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
        return True
    except Exception as e:
        logger.error("[BHAVI STT] Audio conversion failed: %s", e)
        return False


def transcribe(
    audio_path: str,
    explicit_lang: Optional[str] = None,
    translate_to_english: bool = True,
    browser_stt: Optional[str] = None,
) -> Dict[str, str]:
    """
    Transcribe audio file using Faster-Whisper.

    Args:
        audio_path: Path to audio file (any format — will be converted to WAV).
        explicit_lang: Force language ('en', 'ta', 'hi'). None = auto-detect.
        translate_to_english: Also produce an English translation.

    Returns:
        {
            "original_text": "...",    # Text in detected language
            "english_text": "...",     # English translation
            "language": "ta",          # Detected language code
            "duration_seconds": 12.5,  # Audio duration (for quota tracking)
        }
    """
    model = get_model()
    if model is None:
        raise RuntimeError("Whisper model could not be loaded.")

    # ── Convert to WAV ────────────────────────────────────────────────────
    wav_path = audio_path.rsplit(".", 1)[0] + "_stt.wav"
    if not convert_audio_to_wav(audio_path, wav_path):
        raise RuntimeError("Audio conversion to WAV failed.")

    try:
        language = explicit_lang
        raw_text = ""
        original_text = ""

        if browser_stt and browser_stt.strip() and browser_stt.strip() != '""':
            # ── BROWSER STT OVERRIDE ──────────────────────────────────────────
            # Strip quotes if they were added
            original_text = browser_stt.strip('"').strip()
            language = explicit_lang or "en"
        else:
            # ── Pass 1: Auto-detect language if not specified ──────────────────
            if not language:
                segments, info = model.transcribe(
                wav_path,
                task="transcribe",
                beam_size=BhaviConfig.WHISPER_BEAM_SIZE,
                vad_filter=BhaviConfig.WHISPER_VAD_FILTER,
                vad_parameters=dict(
                    min_silence_duration_ms=BhaviConfig.WHISPER_VAD_MIN_SILENCE_MS
                ),
            )
            language = info.language  # e.g. 'ta', 'en', 'hi'
            raw_text = " ".join([s.text for s in segments]).strip()

            # ── Pass 2: Re-transcribe with forced language for accuracy ────────
            if language and language != "en":
                segments2, _ = model.transcribe(
                    wav_path,
                    task="transcribe",
                    language=language,
                    beam_size=BhaviConfig.WHISPER_BEAM_SIZE,
                    vad_filter=BhaviConfig.WHISPER_VAD_FILTER,
                    vad_parameters=dict(
                        min_silence_duration_ms=BhaviConfig.WHISPER_VAD_MIN_SILENCE_MS
                    ),
                )
                original_text = " ".join([s.text for s in segments2]).strip() or raw_text
            elif explicit_lang == "en":
                segments_en, _ = model.transcribe(
                    wav_path,
                    task="transcribe",
                    language="en",
                    beam_size=BhaviConfig.WHISPER_BEAM_SIZE,
                    vad_filter=BhaviConfig.WHISPER_VAD_FILTER,
                    vad_parameters=dict(
                        min_silence_duration_ms=BhaviConfig.WHISPER_VAD_MIN_SILENCE_MS
                    ),
                )
                original_text = " ".join([s.text for s in segments_en]).strip()
            else:
                original_text = raw_text

        # ── Translate to English ──────────────────────────────────────────
        english_text = original_text
        if translate_to_english and language and language != "en":
            segments_tr, _ = model.transcribe(
                wav_path,
                task="translate",
                beam_size=BhaviConfig.WHISPER_BEAM_SIZE,
                vad_filter=BhaviConfig.WHISPER_VAD_FILTER,
                vad_parameters=dict(
                    min_silence_duration_ms=BhaviConfig.WHISPER_VAD_MIN_SILENCE_MS
                ),
            )
            english_text = " ".join([s.text for s in segments_tr]).strip()

        # Estimate duration from WAV file size (16kHz mono = 32000 bytes/sec)
        duration_seconds = 0.0
        try:
            wav_size = os.path.getsize(wav_path) if os.path.exists(wav_path) else 0
            # 16-bit PCM 16kHz mono: 2 bytes/sample * 16000 samples/sec = 32000 bytes/sec
            # Subtract 44-byte WAV header
            duration_seconds = max(0.0, (wav_size - 44) / 32000.0)
        except Exception:
            pass

        logger.info(
            "[BHAVI STT] Transcribed: lang=%s, text_len=%d, duration=%.1fs",
            language, len(original_text), duration_seconds,
        )

        return {
            "original_text": original_text or english_text,
            "english_text": english_text or original_text,
            "language": language or "en",
            "duration_seconds": round(duration_seconds, 2),
        }

    finally:
        # ── Cleanup temp files ────────────────────────────────────────────
        for p in [wav_path]:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass


def transcribe_for_companion(
    audio_path: str,
    preferred_lang: Optional[str] = None,
    browser_stt: Optional[str] = None,
) -> Dict[str, str]:
    """
    Convenience wrapper for companion chat use-case.
    Transcribes audio, cleans up the source file, returns result.
    """
    try:
        result = transcribe(
            audio_path,
            explicit_lang=preferred_lang,
            translate_to_english=True,
            browser_stt=browser_stt,
        )
    finally:
        # Always clean up the uploaded audio (privacy)
        try:
            if os.path.exists(audio_path):
                os.remove(audio_path)
        except Exception:
            pass
    return result
