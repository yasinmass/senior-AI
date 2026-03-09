import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import './AICompanion.css';
import { useTranslate } from '../../hooks/useTranslate';

/* ═══════════════════════════════════════════════════
   AI Companion — strictly voice-first
   TASK 1: TTS via gTTS backend (Tamil & English)  ← primary
            Web Speech API                          ← fallback
   TASK 2: Audio unlocked on mic button click so
           audio.play() works after async Groq call
═══════════════════════════════════════════════════ */

function detectLang(text) {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
    return 'English';
}

function getTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const API_BASE = '/api';
const GROQ_KEY = 'REMOVED_API_KEY';

export default function AICompanion() {

    // ── State ──────────────────────────────────────────────────────────
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [orbState, setOrbState] = useState('idle');
    const [transcript, setTranscript] = useState('');
    const [showTranscript, setShowTranscript] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [recogLang, setRecogLang] = useState(
        () => localStorage.getItem('nanbhan_recognLang') || 'ta-IN'
    );
    const [apiKey, setApiKey] = useState(
        () => localStorage.getItem('nanbhan_key') || GROQ_KEY
    );
    const [autoSpeak, setAutoSpeak] = useState(
        () => localStorage.getItem('nanbhan_speak') !== 'false'
    );
    const [keyStatus, setKeyStatus] = useState('✅ API key loaded.');
    const [keyStatusCls, setKeyStatusCls] = useState('ok');
    const [waveActive, setWaveActive] = useState(false);
    const [dockHint, setDockHint] = useState('');
    const [liveLabel, setLiveLabel] = useState('Live');
    const [contextLoaded, setContextLoaded] = useState(false);
    const [crisisVisible, setCrisisVisible] = useState(false);
    const [patientName, setPatientName] = useState('Friend');
    const [systemPrompt, setSystemPrompt] = useState(
        'You are Mitra, a warm AI companion for senior citizens. Be caring, brief and friendly.'
    );

    // Dynamic UI translations
    const tr = useTranslate({
        title: 'AI Companion',
        diary_badge: 'Diary Connected',
        mic_start: 'Tap to Speak',
        mic_stop: 'Tap to Stop',
        type_msg: 'Type your message...',
        send: 'Send',
        thinking: 'Mitra is thinking...',
        auto_speak: 'Auto-speak replies',
        api_key: 'Groq API Key',
        clear: 'Clear Chat',
        companion_hint: 'Tap the mic and speak in your language',
    });

    // ── Refs ────────────────────────────────────────────────────────────
    const historyRef = useRef([]);
    const recognitionRef = useRef(null);
    const currentAudioRef = useRef(null);
    const messagesEndRef = useRef(null);
    const wavePathRef = useRef(null);
    const waveTimerRef = useRef(null);
    const wavePhaseRef = useRef(0);
    const textareaRef = useRef(null);
    const pendingGreetRef = useRef(null);
    const processTurnRef = useRef(null);
    const startMicRef = useRef(null);
    const autoSpeakRef = useRef(localStorage.getItem('nanbhan_speak') !== 'false');
    const audioUnlocked = useRef(false);   // tracks whether AudioContext was unlocked

    const ORB_ICONS = { idle: '🤍', listening: '🎙️', thinking: '💭', speaking: '🔊' };
    const ORB_LABELS = {
        idle: 'உங்கள் நண்பன்',
        listening: 'கேட்கிறேன்…',
        thinking: 'யோசிக்கிறேன்…',
        speaking: 'பேசுகிறேன்…'
    };

    // ── Auto-scroll ──────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Dock hint ────────────────────────────────────────────────────────
    useEffect(() => {
        const h = {
            idle: `🎙️ Mic தொடுங்கள் · ${recogLang === 'ta-IN' ? '🇮🇳 Tamil' : '🇬🇧 English'}`,
            listening: '⏹ நிறுத்த மீண்டும் Mic தொடுங்கள்',
            thinking: '💭 யோசிக்கிறேன்…',
            speaking: '🔊 பேசுகிறேன்…'
        };
        setDockHint(h[orbState] || '');
        setLiveLabel(orbState === 'idle' ? 'Live' : (ORB_LABELS[orbState] || 'Live').replace('…', ''));
    }, [orbState, recogLang]);

    // ── Load context + greeting ─────────────────────────────────────────
    useEffect(() => {
        async function init() {
            try {
                const ctxRes = await fetch(`${API_BASE}/companion/context/`);
                const ctxData = await ctxRes.json();
                let name = 'Friend', diaryTxt = 'No diary entries yet.', assmtTxt = '';

                if (ctxData.success) {
                    name = ctxData.profile?.name || 'Friend';
                    setPatientName(name);
                    setContextLoaded(true);
                    if (ctxData.diary_entries?.length > 0) {
                        diaryTxt = ctxData.diary_entries.map(e =>
                            `[${e.date}] ${e.english_text || e.original_text} (emotion:${e.emotion || '?'}, mood:${e.mood_score ?? '?'}/10)`
                        ).join('\n');
                    }
                    if (ctxData.latest_assessment) {
                        const a = ctxData.latest_assessment;
                        assmtTxt = `\n=== HEALTH SCREENING ===\nDate:${a.date} | Risk:${a.risk_level} | Score:${a.total_score}/30\nNever alarm them or quote scores.`;
                    }
                }

                setSystemPrompt(`You are "Mitra" (உங்கள் நண்பன்) — a warm AI companion for a senior citizen.

=== PROFILE ===
Name: ${name}

=== RECENT DIARY ===
${diaryTxt}
${assmtTxt}

══════════════════════════════
⚠️ LANGUAGE RULE (STRICT) ⚠️
Tamil script in message → reply ENTIRELY in Tamil.
English (Latin) → reply ENTIRELY in English.
No mixing. No Tanglish.
══════════════════════════════

REPLY: 2-4 sentences. End with one gentle question. Use name occasionally.`);

                const histRes = await fetch(`${API_BASE}/companion/history/`);
                const histData = await histRes.json();

                if (histData.success && histData.messages?.length > 0) {
                    setMessages(histData.messages.map(m => ({
                        role: m.role === 'assistant' ? 'ai' : 'user',
                        text: m.message, time: m.time
                    })));
                    historyRef.current = histData.messages.map(m => ({
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.message
                    }));
                } else {
                    try {
                        const gRes = await fetch(`${API_BASE}/companion/greet/`);
                        const gData = await gRes.json();
                        const msg = gData.success
                            ? gData.message
                            : `Hello ${name}! I'm Mitra, your AI companion. How are you feeling today?`;
                        setMessages([{ role: 'ai', text: msg, time: getTime() }]);
                        pendingGreetRef.current = msg;
                    } catch {
                        const fb = `Hello ${name}! I'm Mitra. How are you feeling today?`;
                        setMessages([{ role: 'ai', text: fb, time: getTime() }]);
                        pendingGreetRef.current = fb;
                    }
                }
            } catch (err) {
                console.error('[AICompanion] init error:', err);
                const fb = "Hello! I'm Mitra, your AI companion. How are you feeling today?";
                setMessages([{ role: 'ai', text: fb, time: getTime() }]);
                pendingGreetRef.current = fb;
            }
        }
        init();

        // Pre-warm speechSynthesis voices list
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }

        return () => {
            clearInterval(waveTimerRef.current);
            recognitionRef.current?.abort();
        };
    }, []);

    // ── Wave animation ───────────────────────────────────────────────────
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

    // ── TASK 1 & 2: Audio unlock (defeats browser autoplay policy) ──────
    // Called synchronously on mic button click (user gesture).
    // After this, audio.play() works even after an async Groq API call.
    const unlockAudio = useCallback(() => {
        if (audioUnlocked.current) return;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) {
                const ctx = new AC();
                const buf = ctx.createBuffer(1, 1, 22050);
                const src = ctx.createBufferSource();
                src.buffer = buf;
                src.connect(ctx.destination);
                src.start(0);
                setTimeout(() => ctx.close(), 200);
            }
        } catch { /* silent */ }
        audioUnlocked.current = true;
    }, []);

    // ── TASK 1: Web Speech fallback (English always works; Tamil when voice installed) ──
    const webSpeechFallback = useCallback((text, lang, resolve) => {
        if (!('speechSynthesis' in window)) { resolve(); return; }
        window.speechSynthesis.cancel();
        setTimeout(() => {
            const voices = window.speechSynthesis.getVoices();
            const utt = new SpeechSynthesisUtterance(text);
            utt.rate = 0.85; utt.pitch = 1.0; utt.volume = 1;

            if (lang === 'Tamil') {
                utt.lang = 'ta-IN';
                const v = voices.find(v => v.lang === 'ta-IN')
                    || voices.find(v => v.lang.startsWith('ta'))
                    || voices[0] || null;
                if (v) utt.voice = v;
            } else {
                utt.lang = 'en-US';
                const v = voices.find(v => v.lang === 'en-US')
                    || voices.find(v => v.lang === 'en-IN')
                    || voices.find(v => v.lang.startsWith('en'))
                    || voices[0] || null;
                if (v) utt.voice = v;
            }
            utt.onstart = () => { setOrbState('speaking'); startWave('rgba(52,211,153,0.8)'); };
            utt.onend = () => { stopWave(); setOrbState('idle'); resolve(); };
            utt.onerror = () => { stopWave(); setOrbState('idle'); resolve(); };
            window.speechSynthesis.speak(utt);
        }, 100);
    }, [startWave, stopWave]);

    // ── TASK 1 & 2: PRIMARY TTS — gTTS backend ──────────────────────────
    // /api/tts/?lang=ta&text=... → returns audio/mpeg
    // Works for BOTH Tamil AND English perfectly via Google TTS.
    // unlockAudio() on mic click ensures audio.play() passes after async Groq.
    const speak = useCallback((text, lang) => {
        if (!autoSpeakRef.current || !text?.trim()) return Promise.resolve();

        // Stop anything playing
        window.speechSynthesis?.cancel();
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.src = '';
            currentAudioRef.current = null;
        }

        const gttsLang = lang === 'Tamil' ? 'ta' : 'en';
        const url = `${API_BASE}/tts/?lang=${gttsLang}&text=${encodeURIComponent(text)}`;

        return new Promise(resolve => {
            const audio = new Audio();
            currentAudioRef.current = audio;

            const done = () => {
                stopWave();
                setOrbState('idle');
                currentAudioRef.current = null;
                resolve();
            };

            audio.onplay = () => { setOrbState('speaking'); startWave('rgba(52,211,153,0.8)'); };
            audio.onended = done;
            audio.onerror = (e) => {
                console.warn('[gTTS] error → Web Speech fallback', e);
                currentAudioRef.current = null;
                stopWave(); setOrbState('idle');
                webSpeechFallback(text, lang, resolve);
            };

            audio.src = url;
            // play() works because unlockAudio() was called synchronously on mic click
            audio.play().catch(err => {
                console.warn('[gTTS] play() blocked → Web Speech fallback', err);
                currentAudioRef.current = null;
                webSpeechFallback(text, lang, resolve);
            });
        });
    }, [startWave, stopWave, webSpeechFallback]);

    // ── Groq API (direct from frontend — fast) ──────────────────────────
    const callGroq = useCallback(async (userText) => {
        const key = apiKey || GROQ_KEY;
        historyRef.current.push({ role: 'user', content: userText });
        if (historyRef.current.length > 20) historyRef.current = historyRef.current.slice(-20);

        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...historyRef.current
                    ],
                    temperature: 0.78,
                    max_tokens: 600,
                    stream: false
                })
            });
            if (!res.ok) {
                if (res.status === 401) return 'API key invalid. Check Settings.';
                return 'AI connection failed. Try again.';
            }
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content?.trim() || 'I am here for you.';
            historyRef.current.push({ role: 'assistant', content: reply });
            return reply;
        } catch (e) {
            console.error('[Groq]', e);
            return 'Network error. Please try again.';
        }
    }, [apiKey, systemPrompt]);

    // ── Save to backend (fire-and-forget) ───────────────────────────────
    const saveToBackend = useCallback(async (userText, aiReply) => {
        try {
            await fetch(`${API_BASE}/companion/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: userText, ai_response: aiReply })
            });
        } catch { /* non-critical */ }
    }, []);

    // ── Full conversation turn ───────────────────────────────────────────
    const processTurn = useCallback(async (userText) => {
        if (!userText.trim()) return;
        const lang = detectLang(userText);

        // Speak pending greeting on first user interaction
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

        const reply = await callGroq(userText);

        setMessages(prev => {
            const f = prev.filter(m => m.role !== 'thinking');
            return [...f, { role: 'ai', text: reply, time: getTime() }];
        });

        saveToBackend(userText, reply);

        // Crisis detection
        const crisisKw = ['want to die', 'end my life', 'no point', 'give up', 'nobody cares',
            "can't go on", 'hurt myself', 'hopeless', 'பொருளில்லை', 'தேவையில்லை',
            'போய்விடுவேன்', 'யாரும் இல்லை'];
        if (crisisKw.some(w => userText.toLowerCase().includes(w))) {
            setCrisisVisible(true);
            fetch(`${API_BASE}/companion/crisis/`, { method: 'POST' }).catch(() => { });
        }

        // ── TASK 2: Speak reply ──
        await speak(reply, lang);

        // Safety follow-up
        const hopelessKw = ['give up', 'hopeless', 'no reason', 'want to die', 'nobody cares',
            'பொருளில்லை', 'தேவையில்லை', 'போய்விடுவேன்', 'யாரும் இல்லை'];
        if (hopelessKw.some(w => userText.toLowerCase().includes(w))) {
            await new Promise(r => setTimeout(r, 1200));
            const safety = lang === 'Tamil'
                ? '💜 உங்கள் அன்பானவர்களை ஒரு முறை அழைத்துப் பேசுங்கள். அவர்கள் உங்களை மிகவும் நேசிக்கிறார்கள்.'
                : '💜 It might help to call someone you love today. They care about you deeply.';
            setMessages(prev => [...prev, { role: 'ai', text: safety, time: getTime() }]);
            await speak(safety, lang);
        }

        setOrbState('idle');
        stopWave();
    }, [callGroq, speak, stopWave, saveToBackend]);

    // Keep processTurn ref up to date
    useEffect(() => { processTurnRef.current = processTurn; });

    // ── Mic toggle (unlocks audio FIRST on user gesture) ─────────────────
    const toggleMic = useCallback(() => {
        unlockAudio();                       // ← synchronous, defeats autoplay policy
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            startMicRef.current?.();
        }
    }, [isRecording, unlockAudio]);

    // ── Start speech recognition ─────────────────────────────────────────
    const startMicFn = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: 'Voice input not supported. Please use Chrome or click ⌨️ to type.',
                time: getTime()
            }]);
            setShowTextInput(true);
            return;
        }

        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.lang = recogLang;
        recognitionRef.current = rec;

        let finalText = '';

        rec.onstart = () => {
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
            if (finalText.trim()) {
                processTurnRef.current?.(finalText.trim());
            } else {
                setShowTranscript(false);
                setOrbState('idle');
                stopWave();
            }
        };

        rec.onerror = (e) => {
            console.error('[SpeechRec]', e.error);
            setIsRecording(false);
            if (e.error === 'not-allowed') {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    text: 'Microphone access denied. Allow mic in browser settings, or use ⌨️ to type.',
                    time: getTime()
                }]);
                setShowTextInput(true);
            }
            setOrbState('idle');
            stopWave();
        };

        rec.start();
    }, [recogLang, startWave, stopWave]);

    // Keep startMicFn ref up to date
    useEffect(() => { startMicRef.current = startMicFn; });

    // ── Text input ───────────────────────────────────────────────────────
    const sendTextMessage = () => {
        if (!textInput.trim()) return;
        unlockAudio();          // also unlock for text path
        const t = textInput.trim();
        setTextInput('');
        processTurn(t);
    };

    const handleTextKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTextMessage(); }
    };

    // ── Settings ─────────────────────────────────────────────────────────
    const saveKey = () => {
        const v = apiKey.trim();
        if (!v || !v.startsWith('gsk_')) {
            setKeyStatus('⚠️ Groq keys start with gsk_'); setKeyStatusCls('err'); return;
        }
        localStorage.setItem('nanbhan_key', v);
        setKeyStatus('✅ Key saved!'); setKeyStatusCls('ok');
    };

    const toggleAutoSpeak = () => {
        setAutoSpeak(prev => {
            const next = !prev;
            autoSpeakRef.current = next;
            localStorage.setItem('nanbhan_speak', String(next));
            if (!next) { window.speechSynthesis?.cancel(); }
            return next;
        });
    };

    const toggleRecogLang = () => {
        setRecogLang(prev => {
            const next = prev === 'ta-IN' ? 'en-IN' : 'ta-IN';
            localStorage.setItem('nanbhan_recognLang', next);
            return next;
        });
    };

    const clearConversation = () => {
        historyRef.current = [];
        window.speechSynthesis?.cancel();
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        setOrbState('idle');
        stopWave();
        setCrisisVisible(false);
        const fb = `Hello ${patientName}! I'm Mitra. How are you feeling today?`;
        setMessages([{ role: 'ai', text: fb, time: getTime() }]);
        pendingGreetRef.current = fb;
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <DashboardLayout role="patient" title={tr.title}>
            <div className="companion-root">

                {/* Ambient */}
                <div className="companion-ambient">
                    <div className="camb-orb blue" />
                    <div className="camb-orb purple" />
                    <div className="camb-orb teal" />
                </div>

                {/* Top bar */}
                <div className="comp-topbar">
                    <div className="comp-topbar-title">
                        <div className="title-icon">🧠</div>
                        AI Companion
                        {contextLoaded && <span className="context-badge">📔 {tr.diary_badge}</span>}
                    </div>
                    <div className="live-indicator">
                        <div className="live-bars">
                            <span /><span /><span /><span />
                        </div>
                        <span className="live-label">{liveLabel}</span>
                    </div>
                    <button className="comp-settings-btn" onClick={() => setShowSettings(s => !s)} title="Settings">
                        <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                </div>

                {/* Settings panel */}
                <div className={`comp-settings-panel ${showSettings ? '' : 'hidden'}`}>
                    <div>
                        <label>Groq API Key</label>
                        <div className="comp-api-row">
                            <input type="password" className="comp-api-input" placeholder="gsk_…"
                                value={apiKey} onChange={e => setApiKey(e.target.value)} />
                            <button className="comp-save-btn" onClick={saveKey}>Save</button>
                        </div>
                        {keyStatus && <p className={`comp-key-status ${keyStatusCls}`}>{keyStatus}</p>}
                    </div>
                    <div className="comp-toggle-row">
                        <label>{tr.auto_speak}</label>
                        <label className="comp-toggle">
                            <input type="checkbox" checked={autoSpeak} onChange={toggleAutoSpeak} />
                            <span className="slider" />
                        </label>
                    </div>
                </div>

                {/* Main stage */}
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
                            return (
                                <div key={i} className={`msg-row ${msg.role === 'ai' ? 'ai' : 'user'}`}>
                                    <div className="msg-avatar">{msg.role === 'ai' ? '🤍' : '👤'}</div>
                                    <div>
                                        <div className="msg-bubble">{msg.text}</div>
                                        <div className="msg-time">{msg.time}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Bottom dock */}
                <div className="comp-dock">
                    <div className={`text-input-row ${showTextInput ? '' : 'hidden'}`}>
                        <textarea ref={textareaRef} rows="1" value={textInput}
                            placeholder={tr.type_msg}
                            onChange={e => setTextInput(e.target.value)}
                            onKeyDown={handleTextKey} />
                        <button className="send-text-btn" onClick={sendTextMessage}>
                            <svg viewBox="0 0 24 24">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>

                    <div className="dock-buttons">
                        <button className="dock-btn lang-btn" onClick={toggleRecogLang}
                            title={recogLang === 'ta-IN' ? 'Switch to English' : 'Switch to Tamil'}>
                            {recogLang === 'ta-IN' ? '🇮🇳 TA' : '🇬🇧 EN'}
                        </button>

                        <button className="dock-btn secondary"
                            onClick={() => { setShowTextInput(s => !s); setTimeout(() => textareaRef.current?.focus(), 100); }}
                            title="Keyboard">
                            <svg viewBox="0 0 24 24">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8" />
                            </svg>
                        </button>

                        <button
                            className={`dock-btn mic-btn ${isRecording ? 'recording' : ''}`}
                            onClick={toggleMic}
                            title={isRecording ? 'Stop' : 'Start talking'}>
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

                        <button className="dock-btn secondary" onClick={clearConversation} title="Clear chat">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </button>
                    </div>

                    <p className="dock-hint">{dockHint}</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
