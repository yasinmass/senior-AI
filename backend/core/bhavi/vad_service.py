"""
Bhavi AI — Voice Activity Detection Service (Silero VAD)
=========================================================
Detects when a user starts and stops speaking.
Reduces unnecessary STT processing and improves conversational flow.
Fully offline using Silero VAD model.
"""

import logging
from typing import List, Tuple, Optional

import numpy as np

from .config import BhaviConfig

logger = logging.getLogger("bhavi.vad")

# ── Singleton model ──────────────────────────────────────────────────────────
_vad_model = None
_vad_utils = None


def _load_model():
    """Lazy-load the Silero VAD model."""
    global _vad_model, _vad_utils

    if _vad_model is not None:
        return

    try:
        import torch

        model, utils = torch.hub.load(
            repo_or_dir="snakers4/silero-vad",
            model="silero_vad",
            force_reload=False,
            trust_repo=True,
        )
        _vad_model = model
        _vad_utils = utils
        logger.info("[BHAVI VAD] Silero VAD model loaded successfully.")
    except Exception as e:
        logger.error("[BHAVI VAD] Failed to load Silero VAD: %s", e)


def detect_speech_segments(
    audio_data: np.ndarray,
    sample_rate: int = None,
) -> List[Tuple[float, float]]:
    """
    Detect speech segments in audio data.

    Args:
        audio_data: Audio samples as numpy array (float32, mono).
        sample_rate: Audio sample rate (default: from config).

    Returns:
        List of (start_sec, end_sec) tuples for each speech segment.
    """
    _load_model()

    if _vad_model is None or _vad_utils is None:
        logger.warning("[BHAVI VAD] Model not available — returning full audio as speech.")
        duration = len(audio_data) / (sample_rate or BhaviConfig.VAD_SAMPLE_RATE)
        return [(0.0, duration)]

    sample_rate = sample_rate or BhaviConfig.VAD_SAMPLE_RATE

    try:
        import torch

        # Get the speech timestamps utility
        (get_speech_timestamps, _, _, _, _) = _vad_utils

        # Convert numpy to torch tensor
        if isinstance(audio_data, np.ndarray):
            audio_tensor = torch.FloatTensor(audio_data)
        else:
            audio_tensor = audio_data

        # Ensure 1D
        if audio_tensor.dim() > 1:
            audio_tensor = audio_tensor.mean(dim=-1)

        # Get speech timestamps
        speech_timestamps = get_speech_timestamps(
            audio_tensor,
            _vad_model,
            sampling_rate=sample_rate,
            threshold=BhaviConfig.VAD_THRESHOLD,
            min_speech_duration_ms=BhaviConfig.VAD_MIN_SPEECH_MS,
            min_silence_duration_ms=BhaviConfig.VAD_MIN_SILENCE_MS,
        )

        # Convert sample indices to seconds
        segments = []
        for ts in speech_timestamps:
            start_sec = round(ts["start"] / sample_rate, 3)
            end_sec = round(ts["end"] / sample_rate, 3)
            segments.append((start_sec, end_sec))

        logger.info("[BHAVI VAD] Found %d speech segments in audio.", len(segments))
        return segments

    except Exception as e:
        logger.error("[BHAVI VAD] Detection failed: %s", e)
        duration = len(audio_data) / sample_rate
        return [(0.0, duration)]


def has_speech(
    audio_data: np.ndarray,
    sample_rate: int = None,
) -> bool:
    """
    Quick check: does the audio contain speech?

    Args:
        audio_data: Audio samples as numpy array.
        sample_rate: Audio sample rate.

    Returns:
        True if speech detected, False otherwise.
    """
    segments = detect_speech_segments(audio_data, sample_rate)
    return len(segments) > 0


def get_speech_audio(
    audio_data: np.ndarray,
    sample_rate: int = None,
) -> Optional[np.ndarray]:
    """
    Extract only the speech portions from audio, removing silence.

    Args:
        audio_data: Full audio as numpy array.
        sample_rate: Audio sample rate.

    Returns:
        Audio array containing only speech segments, or None if no speech.
    """
    sample_rate = sample_rate or BhaviConfig.VAD_SAMPLE_RATE
    segments = detect_speech_segments(audio_data, sample_rate)

    if not segments:
        return None

    speech_parts = []
    for start_sec, end_sec in segments:
        start_idx = int(start_sec * sample_rate)
        end_idx = int(end_sec * sample_rate)
        speech_parts.append(audio_data[start_idx:end_idx])

    if not speech_parts:
        return None

    return np.concatenate(speech_parts)


def is_available() -> bool:
    """Check if Silero VAD is available."""
    _load_model()
    return _vad_model is not None
