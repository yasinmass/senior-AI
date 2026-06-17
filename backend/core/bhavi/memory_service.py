"""
Bhavi AI — Semantic Memory Service (ChromaDB)
==============================================
Local vector memory for conversational context and emotional patterns.
Uses sentence-transformers for embeddings + ChromaDB for storage.

Stores:
  - Emotional summaries
  - Important user preferences
  - Recurring emotional patterns
  - Important life events

Does NOT store:
  - Full raw audio (ever)
  - Entire conversations (only summaries)
"""

import logging
import time
from datetime import datetime
from typing import Dict, List, Optional

from .config import BhaviConfig

logger = logging.getLogger("bhavi.memory")

# ── Singleton instances ───────────────────────────────────────────────────────
_chroma_client = None
_embedding_fn = None


def _get_embedding_function():
    """Lazy-load the sentence-transformer embedding function."""
    global _embedding_fn
    if _embedding_fn is None:
        try:
            from chromadb.utils import embedding_functions
            _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=BhaviConfig.EMBEDDING_MODEL,
            )
            logger.info("[BHAVI MEMORY] Embedding model '%s' loaded.", BhaviConfig.EMBEDDING_MODEL)
        except Exception as e:
            logger.error("[BHAVI MEMORY] Failed to load embedding model: %s", e)
    return _embedding_fn


def _get_client():
    """Lazy-load the ChromaDB client with persistent storage."""
    global _chroma_client
    if _chroma_client is None:
        try:
            import chromadb
            BhaviConfig.ensure_dirs()
            _chroma_client = chromadb.PersistentClient(path=BhaviConfig.CHROMADB_DIR)
            logger.info("[BHAVI MEMORY] ChromaDB client initialized at %s", BhaviConfig.CHROMADB_DIR)
        except Exception as e:
            logger.error("[BHAVI MEMORY] Failed to initialize ChromaDB: %s", e)
    return _chroma_client


def _get_collection(collection_name: str):
    """Get or create a ChromaDB collection."""
    client = _get_client()
    embed_fn = _get_embedding_function()
    if client is None or embed_fn is None:
        return None
    try:
        return client.get_or_create_collection(
            name=collection_name,
            embedding_function=embed_fn,
        )
    except Exception as e:
        logger.error("[BHAVI MEMORY] Failed to get collection '%s': %s", collection_name, e)
        return None


# ── Short-Term Session Memory ─────────────────────────────────────────────────

class SessionMemory:
    """In-memory short-term conversation context (per session)."""

    def __init__(self, max_turns: int = None):
        self.max_turns = max_turns or BhaviConfig.MEMORY_SHORT_TERM_TURNS
        self.turns: List[Dict[str, str]] = []

    def add_turn(self, role: str, content: str, emotion: str = None):
        """Add a conversation turn."""
        self.turns.append({
            "role": role,
            "content": content,
            "emotion": emotion,
            "timestamp": datetime.now().isoformat(),
        })
        # Trim to max turns
        if len(self.turns) > self.max_turns * 2:
            self.turns = self.turns[-(self.max_turns * 2):]

    def get_history(self) -> List[Dict[str, str]]:
        """Get conversation history in Ollama-compatible format."""
        return [
            {"role": t["role"], "content": t["content"]}
            for t in self.turns
        ]

    def get_context_summary(self) -> str:
        """Get a brief summary of the current session for memory storage."""
        if not self.turns:
            return ""
        user_msgs = [t["content"] for t in self.turns if t["role"] == "user"]
        emotions = [t.get("emotion", "") for t in self.turns if t.get("emotion")]
        summary = f"User discussed: {'; '.join(user_msgs[-3:])}"
        if emotions:
            summary += f" | Emotions: {', '.join(set(emotions))}"
        return summary

    def clear(self):
        """Clear session memory."""
        self.turns = []


# ── Long-Term Memory (ChromaDB) ──────────────────────────────────────────────

def store_memory(
    patient_id: int,
    text: str,
    memory_type: str = "conversation",
    metadata: Optional[Dict] = None,
):
    """
    Store a memory in ChromaDB.

    Args:
        patient_id: Patient identifier.
        text: Memory content (summary, not raw conversation).
        memory_type: Type of memory ('conversation', 'emotion', 'preference', 'event').
        metadata: Additional metadata dict.
    """
    collection = _get_collection(BhaviConfig.CHROMADB_COLLECTION_MEMORY)
    if collection is None:
        logger.warning("[BHAVI MEMORY] Cannot store — ChromaDB unavailable.")
        return

    doc_id = f"p{patient_id}_{memory_type}_{int(time.time() * 1000)}"
    meta = {
        "patient_id": str(patient_id),
        "memory_type": memory_type,
        "timestamp": datetime.now().isoformat(),
    }
    if metadata:
        meta.update({k: str(v) for k, v in metadata.items()})

    try:
        collection.add(
            documents=[text],
            ids=[doc_id],
            metadatas=[meta],
        )
        logger.info("[BHAVI MEMORY] Stored memory type='%s' for patient %d", memory_type, patient_id)
    except Exception as e:
        logger.error("[BHAVI MEMORY] Failed to store memory: %s", e)


def retrieve_memories(
    patient_id: int,
    query: str,
    max_results: int = None,
    memory_type: Optional[str] = None,
) -> List[Dict]:
    """
    Retrieve relevant memories using semantic similarity search.

    Args:
        patient_id: Patient identifier.
        query: Search query text.
        max_results: Maximum number of results.
        memory_type: Filter by memory type (optional).

    Returns:
        List of {"text": ..., "type": ..., "timestamp": ..., "distance": ...}
    """
    collection = _get_collection(BhaviConfig.CHROMADB_COLLECTION_MEMORY)
    if collection is None:
        return []

    max_results = max_results or BhaviConfig.MEMORY_LONG_TERM_MAX_RESULTS

    where_filter = {"patient_id": str(patient_id)}
    if memory_type:
        where_filter["memory_type"] = memory_type

    try:
        results = collection.query(
            query_texts=[query],
            n_results=max_results,
            where=where_filter,
        )

        memories = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 0
                memories.append({
                    "text": doc,
                    "type": meta.get("memory_type", "unknown"),
                    "timestamp": meta.get("timestamp", ""),
                    "distance": round(distance, 4),
                })

        logger.info(
            "[BHAVI MEMORY] Retrieved %d memories for patient %d (query: '%s...')",
            len(memories), patient_id, query[:50],
        )
        return memories

    except Exception as e:
        logger.error("[BHAVI MEMORY] Retrieval failed: %s", e)
        return []


def store_emotional_summary(
    patient_id: int,
    summary: str,
    dominant_emotion: str,
    avg_mood: float,
    risk_level: str,
):
    """Store an emotional summary in the emotions collection."""
    collection = _get_collection(BhaviConfig.CHROMADB_COLLECTION_EMOTIONS)
    if collection is None:
        return

    doc_id = f"p{patient_id}_emo_{int(time.time() * 1000)}"
    try:
        collection.add(
            documents=[summary],
            ids=[doc_id],
            metadatas=[{
                "patient_id": str(patient_id),
                "dominant_emotion": dominant_emotion,
                "avg_mood": str(avg_mood),
                "risk_level": risk_level,
                "timestamp": datetime.now().isoformat(),
            }],
        )
        logger.info(
            "[BHAVI MEMORY] Emotional summary stored for patient %d: %s (mood: %s)",
            patient_id, dominant_emotion, avg_mood,
        )
    except Exception as e:
        logger.error("[BHAVI MEMORY] Failed to store emotional summary: %s", e)


def format_memories_for_prompt(memories: List[Dict]) -> str:
    """Format retrieved memories into a concise string for the LLM prompt."""
    if not memories:
        return "No stored memories yet."

    lines = []
    for m in memories[:5]:  # Max 5 memories in prompt
        timestamp = m.get("timestamp", "")
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp)
                timestamp = dt.strftime("%b %d")
            except Exception:
                timestamp = ""

        text = m.get("text", "")
        if len(text) > 200:
            text = text[:200] + "..."

        prefix = f"[{timestamp}]" if timestamp else "•"
        lines.append(f"{prefix} {text}")

    return "\n".join(lines)


def store_conversation_summary(
    patient_id: int,
    user_message: str,
    ai_response: str,
    emotion: str = "neutral",
):
    """
    Store a summarized conversation exchange as a memory.
    Does NOT store raw audio — only text summaries.
    """
    # Only store if the message seems meaningful (>20 chars)
    if len(user_message) < 20:
        return

    summary = f"User said: {user_message[:150]}. "
    summary += f"Bhavi responded about: {ai_response[:100]}. "
    summary += f"User emotion: {emotion}."

    store_memory(
        patient_id=patient_id,
        text=summary,
        memory_type="conversation",
        metadata={"emotion": emotion},
    )


def get_patient_memory_summary(patient_id: int) -> Dict:
    """Get a full memory summary for a patient (for API endpoint)."""
    memories = retrieve_memories(
        patient_id=patient_id,
        query="emotional state feelings mood",
        max_results=10,
    )

    return {
        "total_memories": len(memories),
        "memories": [
            {
                "text": m["text"][:200],
                "type": m["type"],
                "timestamp": m["timestamp"],
            }
            for m in memories
        ],
    }
