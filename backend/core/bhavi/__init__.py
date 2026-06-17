"""
Bhavi AI — Privacy-First Multilingual Emotional AI Companion (v2.0)
====================================================================
Modular service layer for the SeniorMind AI voice agent.

Pipeline:
  User Speech → VAD → Faster-Whisper STT → Emotion Detection
  → ChromaDB Memory Retrieval → Qwen2.5 Response → Piper TTS → Voice

v2.0 additions:
  → Voice Quota tracking (24-hr rolling window, Free/Plus tiers)
  → [MEMORY_UPDATE: ...] tag parsing and DB storage
  → Personalization pipeline (Plus only)
  → Full Bhavi Master System Prompt v2.0

All services are LOCAL / OFFLINE by design.
"""

from .config import BhaviConfig

__all__ = [
    'BhaviConfig',
]
