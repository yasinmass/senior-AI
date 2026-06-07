# SeniorMind AI 🧠

> Voice-first mental health care platform built for senior citizens.

SeniorMind AI is designed to help seniors speak naturally in their own language. No typing, no complex navigation—just warm, empathetic voice-driven interaction.

---

## 🚀 Recent Architecture Upgrade: Privacy-First Local AI (Bhavi Companion)

The AI Companion (**Bhavi**) has been fully transitioned from external cloud-based APIs to a **100% local, offline-capable, privacy-first stack**. All voice processing, emotion classification, and semantic memory retrieval occur entirely on the client/host machine.

### 1. Local Models Added & Their Purpose
*   **LLM: Qwen2.5-3B (via Ollama)**
    *   *Purpose*: Performs local, offline conversational reasoning and empathetic dialogue.
    *   *Why*: Fine-tuned for strong multilingual capabilities (especially in Tamil and Hindi) while running efficiently on consumer CPUs/GPUs.
*   **STT: Faster-Whisper (small)**
    *   *Purpose*: Performs local Speech-to-Text conversion.
    *   *Why*: Leverages CTranslate2 for ultra-fast, quantized, offline transcription with automatic language detection (Tamil, Hindi, English).
*   **VAD: Silero VAD**
    *   *Purpose*: Speech activity detection.
    *   *Why*: Efficiently segments voice activity from background silence/noise to prevent unnecessary LLM processing.
*   **Emotion: XLM-Roberta Multilingual Sentiment**
    *   *Purpose*: Multilingual sentiment and emotion classification.
    *   *Why*: Natively parses code-mixed inputs and non-English text (Tamil, Hindi, English) to detect user distress, loneliness, sadness, or joy.
*   **Embeddings: all-MiniLM-L6-v2**
    *   *Purpose*: Vector representation of text.
    *   *Why*: Powers local semantic search inside the vector database.
*   **Memory: ChromaDB**
    *   *Purpose*: Local persistent vector database.
    *   *Why*: Implements cognitive memory recall (family, past routines, hobbies) without sacrificing privacy.
*   **TTS: Piper TTS**
    *   *Purpose*: Fast local neural Text-to-Speech generation.
    *   *Why*: Synthesizes natural, elderly-friendly conversational speech at a comfortable, warm pace.

---

### 2. What Has Been Replaced
*   **Groq Cloud API (Llama3)** ➔ Replaced by **Qwen2.5:3b (Ollama)** running entirely locally.
*   **Cloud gTTS API** ➔ Replaced by **Piper TTS** (local neural speech generator), with gTTS retained only as an internet-connected fallback.
*   **English-only pysentimiento** ➔ Replaced by **XLM-Roberta Multilingual Emotion Engine** to support Hindi and Tamil.
*   **Simple DB-only ChatHistory** ➔ Upgraded to **ChromaDB Semantic Memory System** for contextual long-term recall.

---

### 3. New Features Implemented
*   **Complete Offline Operation**: Zero dependencies on external cloud APIs or API keys. 
*   **Multilingual Support**: Fully operational in **Tamil**, **Hindi**, and **English** (audio speech recognition, text-to-speech, and emotional assessment).
*   **Cognitive Memory Recall**: Automatically retrieves previous interactions and refers back to past events (e.g., *"Remember when you mentioned Meena calling yesterday?"*) to provide comforting context.
*   **Visual Emotion Indicators**: Real-time color-coded emotion badges displayed directly inside the chat interface based on local sentiment classification.
*   **Standalone Server Integration**: A lightweight, standalone companion server (`server.py`) serving static files and routing local TTS requests seamlessly.
*   **Fallback Resolution Helper**: Seamless Django session bypass to support both authenticated portal users and standalone local clients under a default patient profile (`Lakshmi`).

---

## Tech Stack
*   **Frontend**: React + Vite
*   **Backend**: Django + Python
*   **AI Engine**: Ollama, Faster-Whisper, Silero VAD, Transformers (XLM-Roberta), Sentence-Transformers, Piper TTS, ChromaDB
*   **Database**: SQLite3 (relational) + ChromaDB (vectors)

---

## Local Setup

### Prerequisite: Models & Ollama
1. Download and run [Ollama](https://ollama.com).
2. Pull the 3B model:
   ```bash
   ollama pull qwen2.5:3b
   ```
3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Run the local model setup script (downloads STT, VAD, Emotion, and Embedding weights):
   ```bash
   python -m core.bhavi.setup_models
   ```

### Running the Project

1. **Start Django Backend**:
   ```bash
   python backend/manage.py migrate
   python backend/manage.py runserver
   ```
2. **Start Standalone Companion Server**:
   ```bash
   python ai-companion/ai-healthcare/server.py
   ```
   Access the standalone UI at `http://localhost:5500`.
3. **Start React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Access the portal at `http://localhost:5173` (or the Vite dev port).