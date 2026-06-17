"""
Bhavi AI — Emotion Detection Service
======================================
Multilingual emotion detection using XLM-Roberta.
Works for Tamil, Hindi, and English text — fully offline.

Detects: sadness, loneliness, stress, anger, joy, neutral
Generates: emotion scores, emotional summaries, risk indicators
"""

import logging
from typing import Dict, Optional, List
from collections import Counter

from .config import BhaviConfig

logger = logging.getLogger("bhavi.emotion")

# ── Singleton model instances ─────────────────────────────────────────────────
_sentiment_pipeline = None
_emotion_pipeline = None


def _load_models():
    """Lazy-load the emotion detection models."""
    global _sentiment_pipeline, _emotion_pipeline

    if _sentiment_pipeline is not None:
        return

    try:
        from transformers import pipeline

        logger.info("[BHAVI EMOTION] Loading multilingual sentiment model...")
        _sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model=BhaviConfig.EMOTION_MODEL_PRIMARY,
            device=-1,  # CPU
            top_k=None,
        )
        logger.info("[BHAVI EMOTION] Sentiment model loaded successfully.")

        # Try loading the advanced GoEmotions model
        try:
            logger.info("[BHAVI EMOTION] Loading GoEmotions model...")
            _emotion_pipeline = pipeline(
                "text-classification",
                model=BhaviConfig.EMOTION_MODEL_ADVANCED,
                device=-1,
                top_k=None,
            )
            logger.info("[BHAVI EMOTION] GoEmotions model loaded successfully.")
        except Exception as e:
            logger.warning(
                "[BHAVI EMOTION] GoEmotions model unavailable, using sentiment-only: %s", e
            )
            _emotion_pipeline = None

    except Exception as e:
        logger.error("[BHAVI EMOTION] Failed to load emotion models: %s", e)


def analyze(text: str) -> Dict:
    """
    Analyze text for emotions and sentiment.

    Args:
        text: Input text in any supported language (en/ta/hi).

    Returns:
        {
            "sentiment": "positive" | "negative" | "neutral",
            "sentiment_score": 0.0-1.0,
            "emotion": "sadness" | "joy" | "anger" | "fear" | "surprise" | "neutral",
            "emotion_scores": {"sadness": 0.8, "joy": 0.1, ...},
            "mood_score": 1-10,
            "risk_level": "low" | "medium" | "high",
            "crisis": bool,
        }
    """
    _load_models()

    result = {
        "sentiment": "neutral",
        "sentiment_score": 0.5,
        "emotion": "neutral",
        "emotion_scores": {},
        "mood_score": 5,
        "risk_level": "low",
        "crisis": False,
    }

    if not text or not text.strip():
        return result

    # ── Sentiment Analysis (XLM-Roberta — multilingual) ───────────────────
    if _sentiment_pipeline:
        try:
            sent_result = _sentiment_pipeline(text[:512])
            if sent_result and isinstance(sent_result[0], list):
                sent_result = sent_result[0]

            # Parse results — XLM-Roberta returns labels like 'positive', 'negative', 'neutral'
            sentiment_map = {}
            for item in sent_result:
                label = item["label"].lower()
                score = item["score"]
                sentiment_map[label] = score

            # Determine dominant sentiment
            if sentiment_map:
                dominant = max(sentiment_map, key=sentiment_map.get)
                result["sentiment"] = dominant
                result["sentiment_score"] = sentiment_map[dominant]
        except Exception as e:
            logger.warning("[BHAVI EMOTION] Sentiment analysis failed: %s", e)

    # ── Emotion Detection (GoEmotions) ────────────────────────────────────
    if _emotion_pipeline:
        try:
            emo_result = _emotion_pipeline(text[:512])
            if emo_result and isinstance(emo_result[0], list):
                emo_result = emo_result[0]

            emotion_scores = {}
            for item in emo_result:
                label = item["label"].lower()
                score = item["score"]
                emotion_scores[label] = round(score, 4)

            result["emotion_scores"] = emotion_scores

            if emotion_scores:
                dominant_emotion = max(emotion_scores, key=emotion_scores.get)
                result["emotion"] = dominant_emotion
        except Exception as e:
            logger.warning("[BHAVI EMOTION] Emotion detection failed: %s", e)
    else:
        # Map sentiment to basic emotion when GoEmotions unavailable
        sentiment_to_emotion = {
            "positive": "joy",
            "negative": "sadness",
            "neutral": "neutral",
        }
        result["emotion"] = sentiment_to_emotion.get(result["sentiment"], "neutral")

    # ── Mood Score (1-10) ─────────────────────────────────────────────────
    result["mood_score"] = _calculate_mood_score(result)

    # ── Crisis Detection ──────────────────────────────────────────────────
    result["crisis"] = _detect_crisis(text, result)

    # ── Risk Level ────────────────────────────────────────────────────────
    result["risk_level"] = _assess_risk(result)

    logger.info(
        "[BHAVI EMOTION] Analysis: sentiment=%s, emotion=%s, mood=%d, crisis=%s",
        result["sentiment"], result["emotion"],
        result["mood_score"], result["crisis"],
    )

    return result


def _calculate_mood_score(analysis: Dict) -> int:
    """Calculate a 1-10 mood score from sentiment and emotion data."""
    sentiment = analysis.get("sentiment", "neutral")
    emotion = analysis.get("emotion", "neutral")

    # Base score from sentiment
    base_scores = {"positive": 8, "neutral": 5, "negative": 3}
    score = base_scores.get(sentiment, 5)

    # Adjust based on specific emotion
    emotion_adjustments = {
        "joy": +2, "surprise": +1, "neutral": 0,
        "sadness": -2, "fear": -1, "disgust": -2,
        "anger": -2, "loneliness": -2,
    }
    score += emotion_adjustments.get(emotion, 0)

    return max(1, min(10, score))


def _detect_crisis(text: str, analysis: Dict) -> bool:
    """Detect crisis indicators from text and emotion analysis."""
    text_lower = text.lower()

    # Crisis keywords (multilingual)
    crisis_keywords = [
        # English
        "want to die", "end my life", "no point", "give up",
        "nobody cares", "can't go on", "hurt myself", "disappear",
        "hopeless", "no reason to live", "kill myself", "suicide", "kill",
        # Tamil
        "பொருளில்லை", "தேவையில்லை", "போய்விடுவேன்",
        "யாரும் இல்லை", "சாகணும்", "தற்கொலை", "கொல்ல",
        # Hindi
        "मरना चाहता", "जीने का मन नहीं", "कोई नहीं है",
        "हार मान", "उम्मीद नहीं", "आत्महत्या", "मार",
    ]

    if any(kw in text_lower for kw in crisis_keywords):
        return True

    return False


def _assess_risk(analysis: Dict) -> str:
    """Assess overall emotional risk level."""
    if analysis.get("crisis"):
        return "high"

    mood = analysis.get("mood_score", 5)
    emotion = analysis.get("emotion", "neutral")

    if mood <= 3 or emotion in ("sadness", "fear", "anger"):
        return "medium"
    elif mood >= 7:
        return "low"
    return "low"


def analyze_trend(recent_analyses: List[Dict]) -> Dict:
    """
    Analyze emotional trends over a series of interactions.

    Args:
        recent_analyses: List of emotion analysis results (most recent first).

    Returns:
        {
            "trend": "improving" | "stable" | "declining",
            "avg_mood": float,
            "dominant_emotion": str,
            "crisis_count": int,
            "summary": str,
        }
    """
    if not recent_analyses:
        return {
            "trend": "stable",
            "avg_mood": 5.0,
            "dominant_emotion": "neutral",
            "crisis_count": 0,
            "summary": "No emotional data available.",
        }

    moods = [a.get("mood_score", 5) for a in recent_analyses]
    emotions = [a.get("emotion", "neutral") for a in recent_analyses]
    crises = sum(1 for a in recent_analyses if a.get("crisis", False))

    avg_mood = round(sum(moods) / len(moods), 1)
    dominant_emotion = Counter(emotions).most_common(1)[0][0]

    # Trend: compare first half vs second half
    trend = "stable"
    if len(moods) >= 4:
        mid = len(moods) // 2
        recent_avg = sum(moods[:mid]) / mid
        older_avg = sum(moods[mid:]) / (len(moods) - mid)
        if recent_avg > older_avg + 1:
            trend = "improving"
        elif recent_avg < older_avg - 1:
            trend = "declining"

    # Human-readable summary
    mood_desc = "very low" if avg_mood <= 3 else "moderate" if avg_mood <= 6 else "good"
    summary = (
        f"Over the last {len(recent_analyses)} interactions, mood has been {mood_desc} "
        f"(avg {avg_mood}/10). Dominant emotion: {dominant_emotion}. "
        f"Trend: {trend}."
    )
    if crises > 0:
        summary += f" ⚠️ {crises} crisis indicator(s) detected."

    return {
        "trend": trend,
        "avg_mood": avg_mood,
        "dominant_emotion": dominant_emotion,
        "crisis_count": crises,
        "summary": summary,
    }


def format_for_prompt(analysis: Dict) -> str:
    """Format emotion analysis into a concise string for the LLM prompt."""
    if not analysis:
        return "No emotion data available."

    parts = [
        f"Current mood: {analysis.get('mood_score', '?')}/10",
        f"Sentiment: {analysis.get('sentiment', '?')}",
        f"Emotion: {analysis.get('emotion', '?')}",
    ]
    if analysis.get("crisis"):
        parts.append("⚠️ CRISIS INDICATORS DETECTED — respond with extra warmth and care")
    if analysis.get("risk_level") == "medium":
        parts.append("Patient seems emotionally distressed — be gentle")

    return " | ".join(parts)
