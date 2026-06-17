"""
Bhavi AI — Model Setup Script
================================
Downloads and prepares all required AI models for the Bhavi pipeline.

Usage:
    python -m core.bhavi.setup_models

This script should be run once during initial setup.
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger("bhavi.setup")


def setup_whisper():
    """Download and cache the Faster-Whisper model."""
    logger.info("═══ Setting up Faster-Whisper STT model ═══")
    try:
        from faster_whisper import WhisperModel
        from .config import BhaviConfig

        logger.info("Downloading model '%s' (this may take a few minutes)...", BhaviConfig.WHISPER_MODEL_SIZE)
        model = WhisperModel(
            BhaviConfig.WHISPER_MODEL_SIZE,
            device=BhaviConfig.WHISPER_DEVICE,
            compute_type=BhaviConfig.WHISPER_COMPUTE_TYPE,
        )
        logger.info("✅ Faster-Whisper model '%s' ready.", BhaviConfig.WHISPER_MODEL_SIZE)
        del model
    except Exception as e:
        logger.error("❌ Faster-Whisper setup failed: %s", e)
        logger.info("   Install with: pip install faster-whisper")


def setup_emotion_models():
    """Download and cache the emotion detection models."""
    logger.info("═══ Setting up Emotion Detection models ═══")
    from .config import BhaviConfig

    try:
        from transformers import pipeline

        logger.info("Downloading sentiment model: %s", BhaviConfig.EMOTION_MODEL_PRIMARY)
        p1 = pipeline(
            "sentiment-analysis",
            model=BhaviConfig.EMOTION_MODEL_PRIMARY,
            device=-1,
        )
        logger.info("✅ Sentiment model ready.")
        del p1

        logger.info("Downloading GoEmotions model: %s", BhaviConfig.EMOTION_MODEL_ADVANCED)
        try:
            p2 = pipeline(
                "text-classification",
                model=BhaviConfig.EMOTION_MODEL_ADVANCED,
                device=-1,
            )
            logger.info("✅ GoEmotions model ready.")
            del p2
        except Exception as e:
            logger.warning("⚠️ GoEmotions model unavailable (optional): %s", e)

    except Exception as e:
        logger.error("❌ Emotion model setup failed: %s", e)
        logger.info("   Install with: pip install transformers torch")


def setup_embeddings():
    """Download and cache the sentence-transformer embedding model."""
    logger.info("═══ Setting up Embedding model ═══")
    from .config import BhaviConfig

    try:
        from sentence_transformers import SentenceTransformer

        logger.info("Downloading embedding model: %s", BhaviConfig.EMBEDDING_MODEL)
        model = SentenceTransformer(BhaviConfig.EMBEDDING_MODEL)
        # Quick test
        test_embedding = model.encode("test sentence")
        logger.info("✅ Embedding model ready (dim=%d).", len(test_embedding))
        del model
    except Exception as e:
        logger.error("❌ Embedding model setup failed: %s", e)
        logger.info("   Install with: pip install sentence-transformers")


def setup_chromadb():
    """Initialize ChromaDB persistent storage."""
    logger.info("═══ Setting up ChromaDB ═══")
    from .config import BhaviConfig

    try:
        import chromadb

        BhaviConfig.ensure_dirs()
        client = chromadb.PersistentClient(path=BhaviConfig.CHROMADB_DIR)
        # Create default collections
        client.get_or_create_collection(BhaviConfig.CHROMADB_COLLECTION_MEMORY)
        client.get_or_create_collection(BhaviConfig.CHROMADB_COLLECTION_EMOTIONS)
        logger.info("✅ ChromaDB initialized at %s", BhaviConfig.CHROMADB_DIR)
        del client
    except Exception as e:
        logger.error("❌ ChromaDB setup failed: %s", e)
        logger.info("   Install with: pip install chromadb")


def setup_ollama():
    """Check Ollama installation and model availability."""
    logger.info("═══ Checking Ollama LLM ═══")
    from .config import BhaviConfig
    from . import llm_service

    if llm_service.check_ollama_status():
        logger.info("✅ Ollama is running at %s", BhaviConfig.OLLAMA_BASE_URL)

        if llm_service.check_model_available():
            logger.info("✅ Model '%s' is available.", BhaviConfig.OLLAMA_MODEL)
        else:
            logger.warning(
                "⚠️ Model '%s' not found. Pull it with:\n"
                "   ollama pull %s",
                BhaviConfig.OLLAMA_MODEL,
                BhaviConfig.OLLAMA_MODEL,
            )
    else:
        logger.warning(
            "⚠️ Ollama is not running. Start it with:\n"
            "   ollama serve\n"
            "   Then pull the model: ollama pull %s",
            BhaviConfig.OLLAMA_MODEL,
        )


def setup_silero_vad():
    """Download and cache the Silero VAD model."""
    logger.info("═══ Setting up Silero VAD ═══")
    try:
        import torch
        model, utils = torch.hub.load(
            repo_or_dir="snakers4/silero-vad",
            model="silero_vad",
            force_reload=False,
            trust_repo=True,
        )
        logger.info("✅ Silero VAD model ready.")
        del model, utils
    except Exception as e:
        logger.warning("⚠️ Silero VAD setup failed (optional): %s", e)
        logger.info("   Install with: pip install torch")


def setup_piper():
    """Check Piper TTS installation."""
    logger.info("═══ Checking Piper TTS ═══")
    from . import tts_service
    from .config import BhaviConfig

    status = tts_service.get_tts_status()

    if status["piper_available"]:
        logger.info("✅ Piper TTS binary found at: %s", status["piper_binary"])
    else:
        logger.warning(
            "⚠️ Piper TTS not found. Download from:\n"
            "   https://github.com/rhasspy/piper/releases\n"
            "   Place the binary in: %s/piper/",
            BhaviConfig.DATA_DIR,
        )

    for lang, info in status["voices"].items():
        if info["available"]:
            logger.info("  ✅ %s voice: %s", lang, info["voice"])
        elif info["voice"]:
            logger.warning(
                "  ⚠️ %s voice '%s' not found. Download from:\n"
                "     https://github.com/rhasspy/piper/blob/master/VOICES.md",
                lang, info["voice"],
            )

    if status["gtts_available"]:
        logger.info("✅ gTTS fallback available.")
    else:
        logger.warning("⚠️ gTTS not available (optional fallback).")


def run_all():
    """Run complete setup — download all models and check dependencies."""
    logger.info("╔══════════════════════════════════════════════════╗")
    logger.info("║   Bhavi AI — Model Setup                        ║")
    logger.info("║   Privacy-First Multilingual AI Companion        ║")
    logger.info("╚══════════════════════════════════════════════════╝")
    logger.info("")

    setup_whisper()
    logger.info("")

    setup_emotion_models()
    logger.info("")

    setup_embeddings()
    logger.info("")

    setup_chromadb()
    logger.info("")

    setup_ollama()
    logger.info("")

    setup_silero_vad()
    logger.info("")

    setup_piper()
    logger.info("")

    logger.info("═══════════════════════════════════════════════════")
    logger.info("Setup complete! See warnings above for any missing components.")
    logger.info("═══════════════════════════════════════════════════")


if __name__ == "__main__":
    run_all()
