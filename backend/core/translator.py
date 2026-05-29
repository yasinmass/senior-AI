import requests
from django.core.cache import cache
import hashlib

LIBRETRANSLATE_URL = "http://127.0.0.1:5000/translate"


def translate_text(text, target_lang):
    """
    Translate text from English to target language.
    Uses Django cache to avoid repeated API calls.
    Falls back to English if LibreTranslate is unavailable.
    """
    if not text or target_lang == "en":
        return text

    # Build a stable cache key from language + text
    hash_key  = hashlib.md5(f"{target_lang}:{text}".encode()).hexdigest()
    cache_key = f"lt_{hash_key}"

    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        response = requests.post(
            LIBRETRANSLATE_URL,
            json={
                "q":      text,
                "source": "en",
                "target": target_lang,
                "format": "text"
            },
            timeout=5
        )
        if response.status_code == 200:
            result = response.json().get("translatedText", text)
            cache.set(cache_key, result, 604800)   # cache 7 days
            return result
        else:
            return text
    except Exception as e:
        print(f"[LibreTranslate] error: {e}")
        return text          # graceful fallback to English


def translate_batch(texts_dict, target_lang):
    """
    Translate a dictionary of English strings.
    texts_dict  = {"key": "English text", ...}
    Returns     = {"key": "Translated text", ...}
    """
    if target_lang == "en":
        return texts_dict

    return {
        key: translate_text(val, target_lang)
        for key, val in texts_dict.items()
    }
