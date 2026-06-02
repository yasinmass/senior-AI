def translate_text(text, target_lang):
    """
    Translation disabled for now to stop connection errors.
    Will be replaced with Google Translate API in production.
    """
    return text

def translate_batch(texts_dict, target_lang):
    """
    Return English text as-is.
    LibreTranslate server connection disabled.
    """
    return texts_dict
