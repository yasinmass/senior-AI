import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import './AICompanion.css';
import { useTranslate } from '../../hooks/useTranslate';

/* ═══════════════════════════════════════════════════════════════════
   Bhavi AI Companion v2.0 — Privacy-First Multilingual Voice Agent
   ─────────────────────────────────────────────────────────────────
   STT  : Faster-Whisper via backend (MediaRecorder audio upload)
   LLM  : Qwen2.5 via Ollama (LOCAL — no cloud)
   TTS  : Piper TTS → gTTS fallback (via backend)
   Mem  : ChromaDB semantic memory (via backend)
   Emo  : XLM-Roberta multilingual (via backend)
   Quota: 24-hr rolling voice quota (Free 3min / Plus 20min)
   Langs: Tamil · English · Hindi
═══════════════════════════════════════════════════════════════════ */

function detectLang(text) {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
    if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
    return 'English';
}

function getTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const API_BASE = '/api';

const LANG_CYCLE = [
    { code: 'ta-IN', api: 'ta', label: '🇮🇳 TA', full: 'Tamil' },
    { code: 'en-IN', api: 'en', label: '🇬🇧 EN', full: 'English' },
    { code: 'hi-IN', api: 'hi', label: '🇮🇳 HI', full: 'Hindi' },
];

const EMOTION_MAP = {
    joy:        { icon: '😊', color: '#34d399', label: 'Joyful' },
    sadness:    { icon: '💙', color: '#60a5fa', label: 'Sad' },
    anger:      { icon: '🔴', color: '#f87171', label: 'Upset' },
    fear:       { icon: '😰', color: '#a78bfa', label: 'Worried' },
    surprise:   { icon: '😲', color: '#fbbf24', label: 'Surprised' },
    neutral:    { icon: '🤍', color: '#94a3b8', label: 'Neutral' },
    loneliness: { icon: '💜', color: '#c084fc', label: 'Lonely' },
};

const DEFAULT_QUOTA = {
    voice_quota_used:  0,
    voice_quota_limit: 3,
    voice_exhausted:   false,
    quota_resets_in:   24,
    should_warn:       false,
    upgrade_msg_shown: false,
    tier:              'free',
};

export default function AICompanion() {

    // ── State ───────────────────────────────────────────────────────────────
    const [messages, setMessages]             = useState([]);
    const [isRecording, setIsRecording]       = useState(false);
    const [orbState, setOrbState]             = useState('idle');
    const [transcript, setTranscript]         = useState('');
    const [showTranscript, setShowTranscript] = useState(false);
    const [showTextInput, setShowTextInput]   = useState(false);
    const [textInput, setTextInput]           = useState('');
    const [langIdx, setLangIdx]               = useState(
        () => parseInt(localStorage.getItem('bhavi_lang_idx') || '0')
    );
    const [autoSpeak, setAutoSpeak]           = useState(
        () => localStorage.getItem('bhavi_speak') !== 'false'
    );
    const [waveActive, setWaveActive]         = useState(false);
    const [dockHint, setDockHint]             = useState('');
    const [liveLabel, setLiveLabel]           = useState('Live');
    const [contextLoaded, setContextLoaded]   = useState(false);
    const [crisisVisible, setCrisisVisible]   = useState(false);
    const [patientName, setPatientName]       = useState('Friend');
    const [pipelineOk, setPipelineOk]         = useState(null);
    const [lastEmotion, setLastEmotion]       = useState(null);
    const [memoriesUsed, setMemoriesUsed]     = useState(0);
    // v2.0: Voice quota state
    const [quotaState, setQuotaState]         = useState(DEFAULT_QUOTA);
    
    // History sidebar
    const [showHistory, setShowHistory]       = useState(false);
    const [historyData, setHistoryData]       = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    const currentLang = LANG_CYCLE[langIdx];

    const tr = useTranslate({
        title:          'Bhavi — AI Companion',
        diary_badge:    'Diary Connected',
        type_msg:       'Type your message…',
        auto_speak:     'Auto-speak replies',
        offline_mode:   'Offline AI (Local)',
        privacy_badge:  '🔒 Private',
    });

    // ── Refs ─────────────────────────────────────────────────────────────────
    const recognitionRef   = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef   = useRef([]);
    const currentAudioRef  = useRef(null);
    const messagesEndRef   = useRef(null);
    const wavePathRef      = useRef(null);
    const waveTimerRef     = useRef(null);
    const wavePhaseRef     = useRef(0);
    const textareaRef      = useRef(null);
    const pendingGreetRef  = useRef(null);
    const processTurnRef   = useRef(null);
    const startMicRef      = useRef(null);
    const autoSpeakRef     = useRef(localStorage.getItem('bhavi_speak') !== 'false');
    const audioUnlocked    = useRef(false);
    const browserSTTRef    = useRef('');

    const ORB_ICONS  = { idle: '🤍', listening: '🎙️', thinking: '💭', speaking: '🔊' };
    const getOrbLabels = (langApi) => {
        if (langApi === 'en') return { idle: 'Your Friend', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…' };
        if (langApi === 'hi') return { idle: 'आपका दोस्त', listening: 'सुन रहा हूँ…', thinking: 'सोच रहा हूँ…', speaking: 'बोल रहा हूँ…' };
        return { idle: 'உங்கள் நண்பன்', listening: 'கேட்கிறேன்…', thinking: 'யோசிக்கிறேன்…', speaking: 'பேசுகிறேன்…' };
    };
    const ORB_LABELS = getOrbLabels(currentLang.api);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Dock hint ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const exhausted = quotaState.voice_exhausted;
        const h = {
            idle:      exhausted
                ? '🔇 Voice limit reached · type to continue'
                : `🎙️ Tap mic · ${currentLang.full}`,
            listening: '⏹ Tap again to stop',
            thinking:  '💭 Thinking…',
            speaking:  '🔊 Speaking…',
        };
        setDockHint(h[orbState] || '');
        setLiveLabel(orbState === 'idle' ? 'Live' : (ORB_LABELS[orbState] || 'Live').replace('…', ''));
    }, [orbState, langIdx, quotaState.voice_exhausted]);

    // ── History sidebar (Fetch Sessions) ──────────────────────────────────────
    useEffect(() => {
        if (showHistory) {
            setHistoryLoading(true);
            fetch(`${API_BASE}/companion/sessions/`)
                .then(r => r.json())
                .then(data => {
                    setHistoryData(data.sessions || []);
                    setHistoryLoading(false);
                })
                .catch(() => setHistoryLoading(false));
        }
    }, [showHistory]);

    // ── Load specific session ─────────────────────────────────────────────────
    const loadSessionHistory = useCallback(async (sessionId) => {
        setHistoryLoading(true);
        try {
            const res = await fetch(`${API_BASE}/companion/history/?session_id=${sessionId}`);
            const data = await res.json();
            if (data.success) {
                // Clear current text and load the past conversation
                setMessages(
                    data.messages.map(m => ({
                        role: m.role === 'assistant' ? 'ai' : 'user',
                        text: m.message,
                        time: m.time,
                        emotion: m.emotion,
                    }))
                );
                setCurrentSessionId(sessionId);
                setShowHistory(false);
            }
        } catch { /* ignore */ }
        setHistoryLoading(false);
    }, []);

    // ── Quota helpers ─────────────────────────────────────────────────────────
    const applyQuota = useCallback((q) => {
        if (!q) return;
        setQuotaState(prev => ({
            ...prev,
            voice_quota_used:  q.voice_quota_used  ?? prev.voice_quota_used,
            voice_quota_limit: q.voice_quota_limit ?? prev.voice_quota_limit,
            voice_exhausted:   q.voice_exhausted   ?? prev.voice_exhausted,
            quota_resets_in:   q.quota_resets_in   ?? prev.quota_resets_in,
            should_warn:       q.should_warn       ?? prev.should_warn,
            upgrade_msg_shown: q.upgrade_msg_shown ?? prev.upgrade_msg_shown,
            tier:              q.tier              ?? prev.tier,
        }));
        if (q.voice_exhausted) setShowTextInput(true);
    }, []);

    const fetchQuota = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/companion/quota/`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) applyQuota(data);
            }
        } catch { /* silent */ }
    }, [applyQuota]);

    // ── Quota bar computed values ─────────────────────────────────────────────
    const quotaPct       = Math.min(100, (quotaState.voice_quota_used / (quotaState.voice_quota_limit || 1)) * 100);
    const quotaFillClass = quotaPct >= 100 ? 'high' : quotaPct >= 80 ? 'mid' : 'low';
    const quotaWrapClass = quotaState.voice_exhausted ? 'exhausted' : quotaState.should_warn ? 'warn' : '';
    const quotaLabelCls  = quotaState.voice_exhausted ? 'exhausted' : quotaState.should_warn ? 'warn' : '';
    const quotaResetStr  = quotaState.quota_resets_in >= 1
        ? `Resets in ${Math.round(quotaState.quota_resets_in)}h`
        : `Resets in ${Math.round(quotaState.quota_resets_in * 60)}m`;

    // ── Check pipeline + quota on mount ───────────────────────────────────────
    useEffect(() => {
        fetch(`${API_BASE}/companion/status/`)
            .then(r => r.json())
            .then(d => setPipelineOk(d.success && d.status?.ollama?.running))
            .catch(() => setPipelineOk(false));
        fetchQuota();
    }, [fetchQuota]);

    // ── Load context + greeting ───────────────────────────────────────────────
    useEffect(() => {
        async function init() {
            try {
                const ctxRes  = await fetch(`${API_BASE}/companion/context/`);
                const ctxData = await ctxRes.json();
                let name = 'Friend';
                if (ctxData.success) {
                    name = ctxData.profile?.name || 'Friend';
                    setPatientName(name);
                    setContextLoaded(true);
                }
                const histRes  = await fetch(`${API_BASE}/companion/history/`);
                const histData = await histRes.json();
                if (histData.success && histData.messages?.length > 0) {
                    setMessages(histData.messages.map(m => ({
                        role:    m.role === 'assistant' ? 'ai' : 'user',
                        text:    m.message,
                        time:    m.time,
                        emotion: m.emotion,
                    })));
                } else {
                    try {
                        const gRes  = await fetch(`${API_BASE}/companion/greet/`);
                        const gData = await gRes.json();
                        const msg   = gData.success ? gData.message
                            : `Hello ${name}! I'm Bhavi. How are you feeling today?`;
                        setMessages([{ role: 'ai', text: msg, time: getTime() }]);
                        pendingGreetRef.current = msg;
                    } catch {
                        const fb = `Hello ${name}! I'm Bhavi. How are you feeling today?`;
                        setMessages([{ role: 'ai', text: fb, time: getTime() }]);
                        pendingGreetRef.current = fb;
                    }
                }
            } catch {
                const fb = "Hello! I'm Bhavi, your companion. How are you feeling today?";
                setMessages([{ role: 'ai', text: fb, time: getTime() }]);
                pendingGreetRef.current = fb;
            }
        }
        init();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }
        return () => {
            clearInterval(waveTimerRef.current);
            recognitionRef.current?.abort();
        };
    }, []);

    // ── Wave animation ────────────────────────────────────────────────────────
    const startWave = useCallback((color = 'rgba(96,165,250,0.8)') => {
        setWaveActive(true);
        if (wavePathRef.current) wavePathRef.current.setAttribute('stroke', color);
        clearInterval(waveTimerRef.current);
        waveTimerRef.current = setInterval(() => {
            wavePhaseRef.current += 0.18;
            const p = wavePhaseRef.current;
            const a = 16 + Math.random() * 12;
            wavePathRef.current?.setAttribute('d',
                `M0,40 Q37.5,${40 - a * Math.sin(p)} 75,40 Q112.5,${40 + a * Math.sin(p + 1)} 150,40 Q187.5,${40 - a * Math.sin(p + 2)} 225,40 Q262.5,${40 + a * Math.sin(p + 3)} 300,40`
            );
        }, 60);
    }, []);

    const stopWave = useCallback(() => {
        clearInterval(waveTimerRef.current);
        setWaveActive(false);
        wavePathRef.current?.setAttribute('d', 'M0,40 Q75,40 150,40 Q225,40 300,40');
    }, []);

    // ── Audio unlock ──────────────────────────────────────────────────────────
    const unlockAudio = useCallback(() => {
        if (audioUnlocked.current) return;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) {
                const ctx = new AC();
                const src = ctx.createBufferSource();
                src.buffer = ctx.createBuffer(1, 1, 22050);
                src.connect(ctx.destination);
                src.start(0);
                setTimeout(() => ctx.close(), 200);
            }
        } catch { /* silent */ }
        audioUnlocked.current = true;
    }, []);

    // ── Web Speech TTS fallback ───────────────────────────────────────────────
    const webSpeechFallback = useCallback((text, lang, resolve) => {
        if (!('speechSynthesis' in window)) { resolve(); return; }
        window.speechSynthesis.cancel();
        setTimeout(() => {
            const voices = window.speechSynthesis.getVoices();
            const utt    = new SpeechSynthesisUtterance(text);
            utt.rate = 0.85; utt.pitch = 1.0; utt.volume = 1;
            const langMap = { Tamil: 'ta-IN', Hindi: 'hi-IN', English: 'en-IN' };
            utt.lang = langMap[lang] || 'en-IN';
            const v = voices.find(v => v.lang === utt.lang)
                || voices.find(v => v.lang.startsWith(utt.lang.split('-')[0]))
                || voices[0] || null;
            if (v) utt.voice = v;
            utt.onstart = () => { setOrbState('speaking'); startWave('rgba(52,211,153,0.8)'); };
            utt.onend   = () => { stopWave(); setOrbState('idle'); resolve(); };
            utt.onerror = () => { stopWave(); setOrbState('idle'); resolve(); };
            window.speechSynthesis.speak(utt);
        }, 100);
    }, [startWave, stopWave]);

    // ── TTS via backend (Piper → gTTS fallback) ───────────────────────────────
    const speak = useCallback((text, lang) => {
        if (!autoSpeakRef.current || !text?.trim()) return Promise.resolve();
        window.speechSynthesis?.cancel();
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.src = '';
            currentAudioRef.current = null;
        }
        const langMap = { Tamil: 'ta', Hindi: 'hi', English: 'en' };
        const apiLang = langMap[lang] || 'en';
        const url     = `${API_BASE}/tts/?lang=${apiLang}&text=${encodeURIComponent(text)}`;
        return new Promise(resolve => {
            const audio = new Audio();
            currentAudioRef.current = audio;
            let fallbackTriggered = false;
            
            const triggerFallback = () => {
                if (fallbackTriggered) return;
                fallbackTriggered = true;
                currentAudioRef.current = null;
                stopWave(); setOrbState('idle');
                webSpeechFallback(text, lang, resolve);
            };

            const done = () => { stopWave(); setOrbState('idle'); currentAudioRef.current = null; resolve(); };
            audio.onplay  = () => { setOrbState('speaking'); startWave('rgba(52,211,153,0.8)'); };
            audio.onended = done;
            audio.onerror = triggerFallback;
            audio.src = url;
            audio.play().catch(triggerFallback);
        });
    }, [startWave, stopWave, webSpeechFallback]);

    // ── Call backend — text mode ──────────────────────────────────────────────
    const callBhavi = useCallback(async (userText) => {
        try {
            const body = { text: userText };
            if (currentSessionId) body.session_id = currentSessionId;
            
            const res = await fetch(`${API_BASE}/companion/chat/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            });
            if (!res.ok) return { ai_response: "I'm here with you.", emotion: null, crisis_flag: false };
            const data = await res.json();
            if (data.success) {
                if (data.quota) applyQuota(data.quota);
                if (data.session_id) setCurrentSessionId(data.session_id);
                return {
                    ai_response:    data.ai_response  || "I'm here for you.",
                    emotion:        data.emotion      || null,
                    crisis_flag:    data.crisis_flag  || false,
                    memories_used:  data.memories_used || 0,
                    voice_rejected: data.voice_rejected || false,
                };
            }
            return { ai_response: "I'm here with you.", emotion: null, crisis_flag: false };
        } catch { return { ai_response: 'Connection error. Please try again.', emotion: null, crisis_flag: false }; }
    }, [applyQuota, currentSessionId]);

    // ── Call backend — audio mode (Faster-Whisper STT) ────────────────────────
    const callBhaviAudio = useCallback(async (audioBlob, langApi, browserStt) => {
        try {
            const fd = new FormData();
            fd.append('audio', audioBlob, 'recording.webm');
            if (langApi) fd.append('lang', langApi);
            if (browserStt) fd.append('browser_stt', browserStt);
            if (currentSessionId) fd.append('session_id', currentSessionId);
            
            const res = await fetch(`${API_BASE}/companion/chat/`, { method: 'POST', body: fd });
            if (!res.ok) return { ai_response: "I'm here with you.", user_text: '', emotion: null, crisis_flag: false };
            const data = await res.json();
            if (data.success) {
                if (data.quota) applyQuota(data.quota);
                if (data.session_id) setCurrentSessionId(data.session_id);
                return {
                    ai_response:    data.ai_response  || "I'm here for you.",
                    user_text:      data.user_text    || '',
                    emotion:        data.emotion      || null,
                    crisis_flag:    data.crisis_flag  || false,
                    memories_used:  data.memories_used || 0,
                    voice_rejected: data.voice_rejected || false,
                };
            }
            return { ai_response: "I'm here with you.", user_text: '', emotion: null, crisis_flag: false };
        } catch { return { ai_response: 'Connection error.', user_text: '', emotion: null, crisis_flag: false }; }
    }, [applyQuota, currentSessionId]);

    // ── Safety follow-up ──────────────────────────────────────────────────────
    const safetyFollowUp = useCallback(async (userText, lang) => {
        const kw = [
            'give up', 'hopeless', 'no reason', 'want to die', 'nobody cares',
            'suicide', 'kill', 'kill myself',
            'பொருளில்லை', 'தேவையில்லை', 'போய்விடுவேன்', 'யாரும் இல்லை', 'தற்கொலை', 'கொல்ல',
            'मरना चाहता', 'जीने का मन नहीं', 'आत्महत्या', 'मार',
        ];
        if (!kw.some(w => userText.toLowerCase().includes(w))) return;
        await new Promise(r => setTimeout(r, 1200));
        const safety = lang === 'Tamil'
            ? '💜 உங்கள் அன்பானவர்களை ஒரு முறை அழைத்துப் பேசுங்கள். அவர்கள் உங்களை மிகவும் நேசிக்கிறார்கள்.'
            : lang === 'Hindi'
            ? '💜 आज अपने किसी प्रियजन को फ़ोन करें। वे आपसे बहुत प्यार करते हैं।'
            : '💜 It might help to call someone you love today. They care about you deeply.';
        setMessages(prev => [...prev, { role: 'ai', text: safety, time: getTime() }]);
        await speak(safety, lang);
    }, [speak]);

    // ── Process text turn ─────────────────────────────────────────────────────
    const processTurn = useCallback(async (userText) => {
        if (!userText.trim()) return;
        const lang = detectLang(userText);

        if (pendingGreetRef.current) {
            const g = pendingGreetRef.current;
            pendingGreetRef.current = null;
            await speak(g, 'English');
        }

        setMessages(prev => [...prev, { role: 'user', text: userText, time: getTime() }]);
        setShowTranscript(false);
        setTranscript('');
        setMessages(prev => [...prev, { role: 'thinking' }]);
        setOrbState('thinking');

        const result = await callBhavi(userText);
        const reply  = result.ai_response;

        if (result.emotion) {
            setLastEmotion(result.emotion);
            if (result.memories_used > 0) setMemoriesUsed(result.memories_used);
        }

        setMessages(prev => {
            const f = prev.filter(m => m.role !== 'thinking');
            return [...f, { role: 'ai', text: reply, time: getTime(), emotion: result.emotion?.detected }];
        });

        if (result.crisis_flag) {
            setCrisisVisible(true);
            fetch(`${API_BASE}/companion/crisis/`, { method: 'POST' }).catch(() => { });
        }

        await safetyFollowUp(userText, lang);
        await speak(reply, lang);
        setOrbState('idle');
        stopWave();
    }, [callBhavi, speak, stopWave, safetyFollowUp]);

    // ── Process audio turn (Faster-Whisper) ───────────────────────────────────
    const processAudioTurn = useCallback(async (audioBlob, langApi, browserStt) => {
        if (pendingGreetRef.current) {
            const g = pendingGreetRef.current;
            pendingGreetRef.current = null;
            await speak(g, 'English');
        }

        setShowTranscript(false);
        setTranscript('');
        setMessages(prev => [...prev, { role: 'thinking' }]);
        setOrbState('thinking');

        const result = await callBhaviAudio(audioBlob, langApi, browserStt);

        if (result.voice_rejected) {
            setMessages(prev => prev.filter(m => m.role !== 'thinking'));
            setOrbState('idle');
            stopWave();
            return;
        }

        const userText = result.user_text || '';
        const reply    = result.ai_response;
        const lang     = userText ? detectLang(userText) : 'English';

        if (result.emotion) {
            setLastEmotion(result.emotion);
            if (result.memories_used > 0) setMemoriesUsed(result.memories_used);
        }

        setMessages(prev => {
            const f = prev.filter(m => m.role !== 'thinking');
            const next = [];
            if (userText) next.push({ role: 'user', text: userText, time: getTime() });
            next.push({ role: 'ai', text: reply, time: getTime(), emotion: result.emotion?.detected });
            return [...f, ...next];
        });

        if (result.crisis_flag) {
            setCrisisVisible(true);
            fetch(`${API_BASE}/companion/crisis/`, { method: 'POST' }).catch(() => { });
        }

        await speak(reply, lang);
        setOrbState('idle');
        stopWave();
    }, [callBhaviAudio, speak, stopWave]);

    useEffect(() => { processTurnRef.current = processTurn; });

    // ── Mic toggle ────────────────────────────────────────────────────────────
    const toggleMic = useCallback(() => {
        if (quotaState.voice_exhausted) {
            setShowTextInput(true);
            return;
        }
        unlockAudio();
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            recognitionRef.current?.stop();
        } else {
            startMicRef.current?.();
        }
    }, [isRecording, unlockAudio, quotaState.voice_exhausted]);

    // ── Start recording (MediaRecorder + browser STT preview) ─────────────────
    const startMicFn = useCallback(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                // ── MediaRecorder — audio blob for Faster-Whisper ────────────
                const opts = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? { mimeType: 'audio/webm;codecs=opus' }
                    : {};
                const mr = new MediaRecorder(stream, opts);
                mediaRecorderRef.current = mr;
                audioChunksRef.current   = [];
                browserSTTRef.current    = '';

                mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

                mr.onstop = () => {
                    stream.getTracks().forEach(t => t.stop());
                    setIsRecording(false);
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    audioChunksRef.current = [];
                    if (blob.size > 2000) {
                        processAudioTurn(blob, currentLang.api, browserSTTRef.current);
                        browserSTTRef.current = '';
                    } else {
                        setOrbState('idle');
                        stopWave();
                        setShowTranscript(false);
                    }
                };

                mr.start(250);
                setIsRecording(true);
                setOrbState('listening');
                startWave('rgba(239,68,68,0.8)');
                setShowTranscript(true);
                setTranscript('🎙️ Listening…');

                // ── Browser STT — live transcript preview only ───────────────
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SR) {
                    const rec = new SR();
                    rec.continuous     = true;
                    rec.interimResults = true;
                    rec.lang           = currentLang.code;
                    recognitionRef.current = rec;
                    rec.onresult = (e) => {
                        let interim = '', final = '';
                        for (let i = 0; i < e.results.length; i++) {
                            if (e.results[i].isFinal) final += e.results[i][0].transcript;
                            else interim += e.results[i][0].transcript;
                        }
                        const text = final || interim;
                        setTranscript(`"${text}"`);
                        browserSTTRef.current = text;
                    };
                    rec.onerror = () => { /* silent — MediaRecorder handles actual turn */ };
                    try { rec.start(); } catch { /* STT unavailable, MediaRecorder still works */ }
                }
            })
            .catch(() => {
                // Fallback: browser STT only (no audio file upload)
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SR) {
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        text: 'Microphone access denied. Please allow mic or use ⌨️ to type.',
                        time: getTime(),
                    }]);
                    setShowTextInput(true);
                    return;
                }
                const rec = new SR();
                rec.continuous     = true;
                rec.interimResults = true;
                rec.lang           = currentLang.code;
                recognitionRef.current = rec;
                let finalText = '';
                rec.onstart  = () => {
                    setIsRecording(true);
                    finalText = '';
                    setOrbState('listening');
                    startWave('rgba(239,68,68,0.8)');
                    setShowTranscript(true);
                    setTranscript('…');
                };
                rec.onresult = (e) => {
                    let interim = ''; finalText = '';
                    for (let i = 0; i < e.results.length; i++) {
                        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
                        else interim += e.results[i][0].transcript;
                    }
                    setTranscript(`"${finalText || interim}"`);
                };
                rec.onend = () => {
                    setIsRecording(false);
                    if (finalText.trim()) processTurnRef.current?.(finalText.trim());
                    else { setShowTranscript(false); setOrbState('idle'); stopWave(); }
                };
                rec.onerror = (e) => {
                    setIsRecording(false);
                    if (e.error === 'not-allowed') {
                        setMessages(prev => [...prev, {
                            role: 'ai',
                            text: 'Microphone access denied. Use ⌨️ to type.',
                            time: getTime(),
                        }]);
                        setShowTextInput(true);
                    }
                    setOrbState('idle'); stopWave();
                };
                rec.start();
            });
    }, [currentLang.code, startWave, stopWave, processAudioTurn]);

    useEffect(() => { startMicRef.current = startMicFn; });

    // ── Text input ────────────────────────────────────────────────────────────
    const sendTextMessage = () => {
        if (!textInput.trim()) return;
        unlockAudio();
        const t = textInput.trim();
        setTextInput('');
        processTurn(t);
    };

    const handleTextKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTextMessage(); }
    };

    const cycleLang = () => {
        setLangIdx(prev => {
            const next = (prev + 1) % LANG_CYCLE.length;
            localStorage.setItem('bhavi_lang_idx', String(next));
            return next;
        });
    };

    const toggleAutoSpeak = () => {
        setAutoSpeak(prev => {
            const next = !prev;
            autoSpeakRef.current = next;
            localStorage.setItem('bhavi_speak', String(next));
            if (!next) window.speechSynthesis?.cancel();
            return next;
        });
    };

    const clearConversation = () => {
        window.speechSynthesis?.cancel();
        if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
        setOrbState('idle'); stopWave(); setCrisisVisible(false);
        setLastEmotion(null); setMemoriesUsed(0);
        setCurrentSessionId(null);
        const fb = `Hello ${patientName}! I'm Bhavi. How are you feeling today?`;
        setMessages([{ role: 'ai', text: fb, time: getTime() }]);
        pendingGreetRef.current = fb;
    };

    // ── Derived render values ─────────────────────────────────────────────────
    const emotionInfo = lastEmotion ? (EMOTION_MAP[lastEmotion.detected] || EMOTION_MAP.neutral) : null;
    const isExhausted = quotaState.voice_exhausted;
    const showStatusStrip = emotionInfo || memoriesUsed > 0 || quotaState.should_warn;

    return (
        <DashboardLayout role="patient" title={tr.title}>
            <div className="companion-root">

                {/* Ambient background */}
                <div className="companion-ambient">
                    <div className="camb-orb blue" />
                    <div className="camb-orb purple" />
                    <div className="camb-orb teal" />
                </div>

                {/* ── TOP BAR ── */}
                <div className="comp-topbar">
                    <div className="comp-topbar-title">
                        <div className="title-icon">🧠</div>
                        Bhavi
                        {contextLoaded && <span className="context-badge">📔 {tr.diary_badge}</span>}
                        <span className="privacy-badge">{tr.privacy_badge}</span>
                        {pipelineOk === true  && <span className="offline-badge">⚡ {tr.offline_mode}</span>}
                        {pipelineOk === false && <span className="offline-badge warn">⚠️ Ollama offline</span>}
                    </div>
                    <div className="live-indicator">
                        <div className="live-bars"><span /><span /><span /><span /></div>
                        <span className="live-label">{liveLabel}</span>
                    </div>
                    <div className="comp-top-controls">
                        <label className="comp-speak-toggle" title={tr.auto_speak}>
                            🔊
                            <input type="checkbox" checked={autoSpeak} onChange={toggleAutoSpeak} />
                            <span className="slider-mini" />
                        </label>
                    </div>
                </div>

                {/* ── VOICE QUOTA BAR ── */}
                <div className="quota-strip">
                    <div className={`quota-bar-wrap ${quotaWrapClass}`}>
                        <span className="quota-icon">
                            {isExhausted ? '🔇' : quotaState.should_warn ? '⚠️' : '🎙️'}
                        </span>
                        <div className="quota-bar-track">
                            <div
                                className={`quota-bar-fill ${quotaFillClass}`}
                                style={{ width: `${quotaPct}%` }}
                            />
                        </div>
                        <span className={`quota-label ${quotaLabelCls}`}>
                            {(quotaState.voice_quota_used || 0).toFixed(1)} / {quotaState.voice_quota_limit.toFixed(0)} min
                        </span>
                        {isExhausted && (
                            <span className="quota-reset-label">{quotaResetStr}</span>
                        )}
                        <span style={{ fontSize: '0.6rem', color: 'var(--dim)', textTransform: 'uppercase', flexShrink: 0 }}>
                            {quotaState.tier}
                        </span>
                    </div>
                </div>

                {/* ── STATUS STRIP (emotion · memory · warning) ── */}
                {showStatusStrip && (
                    <div className="comp-status-strip">
                        {emotionInfo && (
                            <span className="emotion-badge" style={{ borderColor: emotionInfo.color }}>
                                {emotionInfo.icon} {emotionInfo.label}
                                {lastEmotion?.mood_score && ` · ${lastEmotion.mood_score}/10`}
                            </span>
                        )}
                        {memoriesUsed > 0 && (
                            <span className="memory-badge">
                                🧠 {memoriesUsed} {memoriesUsed === 1 ? 'memory' : 'memories'} recalled
                            </span>
                        )}
                        {quotaState.should_warn && !isExhausted && (
                            <span className="warn-badge">⚡ Voice time running low</span>
                        )}
                    </div>
                )}

                {/* ── MAIN STAGE ── */}
                <div className="comp-stage">

                    {/* Orb */}
                    <div className="orb-stage">
                        <div className="ai-orb">
                            <div className="orb-ring r1" />
                            <div className="orb-ring r2" />
                            <div className="orb-ring r3" />
                            <div className={`orb-core ${orbState}`}>
                                <span>{ORB_ICONS[orbState] || '🧠'}</span>
                            </div>
                        </div>
                        <p className="orb-state-label">{ORB_LABELS[orbState] || 'Ready'}</p>
                    </div>

                    {/* Wave */}
                    <div className={`wave-wrap ${waveActive ? 'active' : ''}`}>
                        <svg className="wave-svg" viewBox="0 0 300 80" preserveAspectRatio="none">
                            <path ref={wavePathRef}
                                d="M0,40 Q75,40 150,40 Q225,40 300,40"
                                fill="none" stroke="rgba(42,111,151,0.5)"
                                strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Live transcript */}
                    {showTranscript && (
                        <div className="transcript-bubble"><p>{transcript}</p></div>
                    )}

                    {/* Crisis banner */}
                    {crisisVisible && (
                        <div className="crisis-banner">
                            💜 It sounds like you're having a very difficult time.
                            Your caretaker has been notified. You are not alone.
                        </div>
                    )}

                    {/* Voice exhausted upgrade notice */}
                    {isExhausted && (
                        <div className="upgrade-notice">
                            <div className="upgrade-notice-header">🌸 Voice time for today is done</div>
                            <div>
                                Keep chatting by text — I&apos;m right here with you!
                                {quotaState.tier === 'free' &&
                                    ' For uninterrupted daily conversations, Bhavi Plus lets you talk freely every day. 💛'}
                            </div>
                            <div className="upgrade-notice-reset">{quotaResetStr}</div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="messages-area">
                        {messages.map((msg, i) => {
                            if (msg.role === 'thinking') return (
                                <div key={`t-${i}`} className="msg-row ai">
                                    <div className="msg-avatar">🧠</div>
                                    <div className="thinking-dots">
                                        <div className="dot" /><div className="dot" /><div className="dot" />
                                    </div>
                                </div>
                            );
                            const emoInfo = msg.emotion ? (EMOTION_MAP[msg.emotion] || null) : null;
                            return (
                                <div key={i} className={`msg-row ${msg.role === 'ai' ? 'ai' : 'user'}`}>
                                    <div className="msg-avatar">{msg.role === 'ai' ? '🤍' : '👤'}</div>
                                    <div>
                                        <div className="msg-bubble">{msg.text}</div>
                                        <div className="msg-meta">
                                            <span className="msg-time">{msg.time}</span>
                                            {emoInfo && (
                                                <span className="msg-emotion-tag" style={{ color: emoInfo.color }}>
                                                    {emoInfo.icon} {emoInfo.label}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* ── BOTTOM DOCK ── */}
                <div className="comp-dock">
                    <div className={`text-input-row ${showTextInput ? '' : 'hidden'}`}>
                        <textarea
                            ref={textareaRef}
                            rows="1"
                            value={textInput}
                            placeholder={tr.type_msg}
                            onChange={e => setTextInput(e.target.value)}
                            onKeyDown={handleTextKey}
                        />
                        <button className="send-text-btn" onClick={sendTextMessage}>
                            <svg viewBox="0 0 24 24">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>

                    <div className="dock-buttons">
                        {/* Language cycle */}
                        <button
                            className="dock-btn lang-btn"
                            onClick={cycleLang}
                            title={`Speaking: ${currentLang.full} — tap to switch`}
                        >
                            {currentLang.label}
                        </button>

                        {/* Keyboard toggle */}
                        <button
                            className="dock-btn secondary"
                            onClick={() => { setShowTextInput(s => !s); setTimeout(() => textareaRef.current?.focus(), 100); }}
                            title="Type message"
                        >
                            <svg viewBox="0 0 24 24">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8" />
                            </svg>
                        </button>

                        {/* Mic button — disabled when voice exhausted */}
                        <button
                            id="bhavi-mic-btn"
                            className={`dock-btn mic-btn ${isRecording ? 'recording' : ''} ${isExhausted ? 'exhausted' : ''}`}
                            onClick={toggleMic}
                            disabled={isExhausted}
                            title={isExhausted
                                ? 'Voice time used up — type to continue'
                                : isRecording ? 'Tap to stop' : 'Tap to speak'}
                        >
                            <svg className="mic-on" viewBox="0 0 24 24">
                                <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                                <path d="M19 10a7 7 0 0 1-14 0" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                            <svg className="mic-stop" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        </button>

                        {/* History */}
                        <button className="dock-btn secondary" onClick={() => setShowHistory(true)} title="View chat history">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>

                        {/* Clear / New Chat */}
                        <button className="dock-btn secondary" onClick={clearConversation} title="Start new chat" style={{ padding: '0 12px', width: 'auto', gap: '6px' }}>
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span style={{ fontSize: '13px', fontWeight: '600' }}>New Chat</span>
                        </button>
                    </div>

                    <p className="dock-hint">{dockHint}</p>
                </div>

                {/* ── HISTORY SIDEBAR ── */}
                <div className={`history-sidebar ${showHistory ? 'open' : ''}`}>
                    <div className="history-header">
                        <h3>Past Conversations</h3>
                        <button onClick={() => setShowHistory(false)}>×</button>
                    </div>
                    <div className="history-content">
                        {historyLoading ? (
                            <p style={{ color: 'var(--gray-500)' }}>Loading sessions...</p>
                        ) : historyData.length === 0 ? (
                            <p style={{ color: 'var(--gray-500)' }}>No past conversations found.</p>
                        ) : (
                            historyData.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className={`history-session-item ${currentSessionId === item.id ? 'active' : ''}`}
                                    onClick={() => loadSessionHistory(item.id)}
                                >
                                    <div className="session-title">{item.title}</div>
                                    <div className="session-date">{new Date(item.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short'})}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
