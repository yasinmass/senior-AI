export function getVoiceLang() {
    const lang = localStorage.getItem("patient_language") || "en";
    const map = {
        "en": "en-US",
        "ta": "ta-IN",
        "hi": "hi-IN"
    };
    return map[lang] || "en-US";
}

export function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getVoiceLang();
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
}

export function getRecognitionLang() {
    const lang = localStorage.getItem("patient_language") || "en";
    const map = {
        "en": "en-US",
        "ta": "ta-IN",
        "hi": "hi-IN"
    };
    return map[lang] || "en-US";
}
