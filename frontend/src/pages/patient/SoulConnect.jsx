import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { submitDailyCheckin } from '../../utils/api';
import { speakText, getRecognitionLang } from '../../utils/voiceLanguage';
import { useTranslate } from '../../hooks/useTranslate';

// voiceMaps contain ENGLISH keywords (always works when STT returns English).
// For Tamil / Hindi we fall back to index-based matching on digit words.
const QUESTION_DEFS = [
    {
        key: 'sleep_rating', textKey: 'q_sleep',
        optKeys: ['opt_verywell', 'opt_okay', 'opt_notgood', 'opt_badly'],
        emojis: ['😴', '🙂', '😕', '😫'], values: [4, 3, 2, 1],
        voiceMap: {
            'very well': 4, 'good': 4, 'great': 4,
            'okay': 3, 'ok': 3, 'fine': 3, 'alright': 3,
            'not good': 2, 'not great': 2, 'poor': 2,
            'badly': 1, 'terrible': 1, 'awful': 1,
            // Tamil / Hindi digit words
            'ஒன்று': 1, 'ஒன்': 1, 'இரண்டு': 2, 'மூன்று': 3, 'நான்கு': 4,
            'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4,
            'one': 1, 'two': 2, 'three': 3, 'four': 4, '1': 1, '2': 2, '3': 3, '4': 4,
        }
    },
    {
        key: 'food_rating', textKey: 'q_food',
        optKeys: ['opt_yes', 'opt_little', 'opt_notmuch', 'opt_no'],
        emojis: ['😋', '🙂', '😕', '❌'], values: [4, 3, 2, 1],
        voiceMap: {
            'yes': 4, 'well': 4, 'good': 4, 'ate well': 4,
            'little': 3, 'a little': 3, 'some': 3,
            'not much': 2, 'not really': 2,
            'no': 1, 'nothing': 1, 'did not eat': 1,
            // Tamil / Hindi
            'ஆம்': 4, 'சாப்பிட்டேன்': 4, 'கொஞ்சம்': 3, 'இல்லை': 1,
            'हाँ': 4, 'हां': 4, 'थोड़ा': 3, 'नहीं': 1,
            'one': 1, 'two': 2, 'three': 3, 'four': 4, '1': 1, '2': 2, '3': 3, '4': 4,
        }
    },
    {
        key: 'day_rating', textKey: 'q_day',
        optKeys: ['opt_great', 'opt_okay', 'opt_sad', 'opt_difficult'],
        emojis: ['😊', '🙂', '😔', '😰'], values: [4, 3, 2, 1],
        voiceMap: {
            'great': 4, 'wonderful': 4, 'good': 4,
            'okay': 3, 'fine': 3, 'alright': 3,
            'sad': 2, 'not good': 2, 'unhappy': 2,
            'difficult': 1, 'hard': 1, 'tough': 1,
            // Tamil / Hindi
            'சிறப்பாக': 4, 'நன்றாக': 4, 'சரி': 3, 'சோகமாக': 2, 'கஷ்டமாக': 1,
            'अच्छा': 4, 'ठीक': 3, 'उदास': 2, 'मुश्किल': 1,
            'one': 1, 'two': 2, 'three': 3, 'four': 4, '1': 1, '2': 2, '3': 3, '4': 4,
        }
    },
    {
        key: 'exercise', textKey: 'q_exercise',
        optKeys: ['opt_yes', 'opt_little', 'opt_no'],
        emojis: ['✅', '🚶', '❌'], values: [3, 2, 1],
        voiceMap: {
            'yes': 3, 'did': 3, 'exercised': 3,
            'little': 2, 'walked': 2, 'a bit': 2,
            'no': 1, 'did not': 1, 'nothing': 1,
            // Tamil / Hindi
            'ஆம்': 3, 'நடந்தேன்': 3, 'கொஞ்சம்': 2, 'இல்லை': 1,
            'हाँ': 3, 'हां': 3, 'थोड़ा': 2, 'नहीं': 1,
            'one': 1, 'two': 2, 'three': 3, '1': 1, '2': 2, '3': 3,
        }
    },
];

export default function SoulConnect() {
    const navigate = useNavigate();
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState({ sleep_rating: 0, food_rating: 0, day_rating: 0, exercise: 0 });
    const [phase, setPhase] = useState('question'); // 'question' | 'saving' | 'done'
    const [isListening, setIsListening] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');      // interim words while speaking
    const [finalTranscript, setFinalTranscript] = useState('');    // final recognised text
    const [voiceStatus, setVoiceStatus] = useState('');            // matched/no-match feedback
    const name = localStorage.getItem('patient_name') || 'Patient';

    // Keep a ref to the latest state so voice callbacks always use current values
    const stateRef = useRef({ qIndex, answers });
    useEffect(() => { stateRef.current = { qIndex, answers }; }, [qIndex, answers]);

    const t = useTranslate({
        title: 'Daily Check-in',
        subtitle: 'Answer with your voice or tap a button',
        question_of: 'Question',
        of: 'of',
        hear_again: 'Tap 🔊 to hear again',
        or_speak: '── OR speak your answer ──',
        listening: 'Listening... Speak now',
        tap_answer: 'Tap to Answer',
        saving: 'Saving your answers...',
        thanks: `Thank you, ${name}!`,
        saved_msg: 'Your check-in is saved.',
        see_tomorrow: 'See you tomorrow! 🌟',
        go_home: 'Go Home',
        q_sleep: 'How did you sleep last night?',
        q_food: 'Did you eat well today?',
        q_day: 'How was your day today?',
        q_exercise: 'Did you do any exercise or walking today?',
        opt_verywell: 'Very Well',
        opt_okay: 'Okay',
        opt_notgood: 'Not Good',
        opt_badly: 'Badly',
        opt_yes: 'Yes',
        opt_little: 'A little',
        opt_notmuch: 'Not much',
        opt_no: 'No',
        opt_great: 'Great',
        opt_sad: 'Sad',
        opt_difficult: 'Difficult',
    });

    // ── Local MediaRecorder instead of browser STT
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const toggleRecording = useCallback(async (voiceMap) => {
        // Stop recording if already listening
        if (isListening) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            return;
        }

        // Start new recording
        setLiveTranscript('');
        setFinalTranscript('');
        setVoiceStatus('🎙 Listening... Tap again to stop');
        setIsListening(true);
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                setIsListening(false);
                const tracks = stream.getTracks();
                tracks.forEach((t) => t.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size === 0) {
                    setVoiceStatus('⚠️ Mic error — no audio recorded.');
                    return;
                }

                setVoiceStatus('⏳ Understanding your speech...');
                setIsProcessing(true);

                const formData = new FormData();
                formData.append('audio', audioBlob, 'answer.webm');

                try {
                    const res = await fetch('/api/audio/transcribe-local/', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                    });

                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    
                    setIsProcessing(false);
                    if (data.error) throw new Error(data.error);

                    const understoodText = data.english_text || '';
                    if (!understoodText) {
                         setVoiceStatus(`❓ No speech heard. Try again.`);
                         return;
                    }

                    // Lowercase without punctuation to match voiceMap
                    const cleanText = understoodText.toLowerCase().replace(/[^\w\s]/g, '').trim();
                    setFinalTranscript(understoodText);
                    console.log('[SoulConnect STT] heard:', cleanText);

                    // Try keyword match
                    for (const [key, val] of Object.entries(voiceMap)) {
                        if (cleanText.includes(key.toLowerCase()) || cleanText === key.toLowerCase()) {
                            setVoiceStatus(`✅ Matched: "${key}"`);
                            setTimeout(() => handleTapRef.current(val), 500);
                            return;
                        }
                    }

                    // Try digit fallback
                    const digit = parseInt(cleanText.replace(/\D/g, ''), 10);
                    if (!isNaN(digit)) {
                        const def = QUESTION_DEFS[stateRef.current.qIndex];
                        if (digit >= 1 && digit <= def.values.length) {
                            setVoiceStatus(`✅ Matched option ${digit}`);
                            setTimeout(() => handleTapRef.current(def.values[digit - 1]), 500);
                            return;
                        }
                    }

                    setVoiceStatus(`❌ Not recognised: "${understoodText}". Tap a button instead.`);
                } catch (err) {
                    console.error('[SoulConnect STT] backend error:', err);
                    setVoiceStatus(`⚠️ Error processing audio: ${err.message}`);
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start(200); // 200ms slice for fast data saving
            
            // Auto-stop after 8 seconds
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            }, 8000);

        } catch (err) {
            console.error('[SoulConnect STT] mic error:', err);
            setVoiceStatus('⚠️ Microphone access denied. Check your browser settings.');
            setIsListening(false);
        }
    }, [isListening]);
    const handleTapFn = useCallback(async (value) => {
        const { qIndex: currentQ, answers: currentAnswers } = stateRef.current;
        const def = QUESTION_DEFS[currentQ];
        const newAnswers = { ...currentAnswers, [def.key]: value };

        // Stop any ongoing recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try { mediaRecorderRef.current.stop(); } catch (_) { }
        }
        setIsListening(false);

        if (currentQ < QUESTION_DEFS.length - 1) {
            setAnswers(newAnswers);
            setQIndex(currentQ + 1);
        } else {
            setAnswers(newAnswers);
            setPhase('saving');
            try { await submitDailyCheckin(newAnswers); } catch (err) { console.error('Save failed', err); }
            setPhase('done');
        }
    }, []); // stable — reads state through ref

    const handleTapRef = useRef(handleTapFn);
    useEffect(() => { handleTapRef.current = handleTapFn; }, [handleTapFn]);

    // ── Speak question on mount / question change
    useEffect(() => {
        if (phase !== 'question') return;
        const def = QUESTION_DEFS[qIndex];
        const questionText = t[def.textKey] || def.textKey;
        speakText(questionText);
        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try { mediaRecorderRef.current.stop(); } catch (_) { }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qIndex, phase]);

    // Stable reference needed because useCallback replaces function



    const def = QUESTION_DEFS[qIndex];
    const progressPct = (qIndex / QUESTION_DEFS.length) * 100;

    if (phase === 'saving') {
        return (
            <DashboardLayout role="patient" title={t.title}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                    <div style={{ fontSize: '56px', animation: 'spin 2s linear infinite' }}>⚙️</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2F3D', marginTop: '20px' }}>{t.saving}</h2>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </DashboardLayout>
        );
    }

    if (phase === 'done') {
        return (
            <DashboardLayout role="patient" title={t.title}>
                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '40px auto', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '72px', color: '#f59e0b', marginBottom: '20px' }}>💛</div>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1F2F3D', marginBottom: '16px' }}>{t.thanks}</h2>
                    <p style={{ fontSize: '20px', color: '#6B7D8F', margin: '0 0 40px 0', lineHeight: '1.6' }}>
                        {t.saved_msg}<br />{t.see_tomorrow}
                    </p>
                    <button
                        onClick={() => navigate('/patient')}
                        style={{ background: '#14bdac', color: '#ffffff', border: 'none', padding: '16px 36px', borderRadius: '16px', fontSize: '20px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '12px' }}
                    >
                        🏠 {t.go_home}
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="patient" title={t.title}>
            <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'inherit' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1F2F3D', margin: '0 0 8px 0' }}>{t.title}</h1>
                    <p style={{ fontSize: '18px', color: '#6B7D8F', margin: '0' }}>{t.subtitle}</p>
                </div>

                {/* Question Card */}
                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#94A3B5', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                        {t.question_of} {qIndex + 1} {t.of} {QUESTION_DEFS.length}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ background: '#E2E7ED', height: '8px', borderRadius: '4px', marginBottom: '32px', overflow: 'hidden' }}>
                        <div style={{ background: '#14bdac', height: '100%', width: `${progressPct}%`, transition: 'width 0.3s ease' }}></div>
                    </div>

                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#1F2F3D', marginBottom: '16px', lineHeight: '1.4' }}>
                        🔊 &ldquo;{t[def.textKey]}&rdquo;
                    </div>
                    <button
                        onClick={() => speakText(t[def.textKey])}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2A6F97', fontSize: '16px', fontWeight: '600', marginBottom: '32px', textDecoration: 'underline' }}
                    >
                        {t.hear_again}
                    </button>

                    {/* Answer Buttons — always work regardless of voice */}
                    <div style={{ display: 'grid', gridTemplateColumns: def.optKeys.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                        {def.optKeys.map((optKey, i) => (
                            <button
                                key={i}
                                onClick={() => handleTapRef.current(def.values[i])}
                                style={{ background: '#F4F6F9', border: '2px solid transparent', borderRadius: '16px', padding: '20px 10px', fontSize: '20px', fontWeight: '700', color: '#1F2F3D', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', minHeight: '100px', justifyContent: 'center' }}
                            >
                                <span style={{ fontSize: '36px' }}>{def.emojis[i]}</span>
                                <span>{t[optKey]}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#94A3B5', marginBottom: '20px' }}>{t.or_speak}</div>

                    <button
                        onClick={() => toggleRecording(def.voiceMap)}
                        disabled={isProcessing}
                        style={{
                            background: isListening ? '#FEF3C7' : (isProcessing ? '#E2E8F0' : '#ffffff'),
                            border: `3px solid ${isListening ? '#F59E0B' : (isProcessing ? '#CBD5E1' : '#E2E7ED')}`,
                            borderRadius: '50px', padding: '16px 32px', fontSize: '20px', fontWeight: '700',
                            color: isListening ? '#B45309' : (isProcessing ? '#64748B' : '#1F2F3D'), cursor: isProcessing ? 'not-allowed' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: '12px',
                            transition: 'all 0.2s',
                            boxShadow: isListening ? '0 0 0 6px rgba(245,158,11,0.2)' : 'none',
                            opacity: isProcessing ? 0.7 : 1
                        }}
                    >
                        <span style={{ fontSize: '24px' }}>
                            {isProcessing ? '⏳' : (isListening ? '🛑' : '🎙')}
                        </span>
                        {isProcessing ? 'Thinking...' : (isListening ? 'Tap to Stop' : t.tap_answer)}
                    </button>

                    {/* ── Live Voice Transcript Panel ── */}
                    {(isListening || liveTranscript || finalTranscript || voiceStatus) && (
                        <div style={{
                            marginTop: '20px',
                            background: '#F8FAFF',
                            border: '2px solid #CBD5E1',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            textAlign: 'left',
                            fontSize: '15px',
                        }}>
                            {/* Status row */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                marginBottom: (liveTranscript || finalTranscript) ? '10px' : 0,
                                fontSize: '14px', fontWeight: '700',
                                color: isListening ? '#D97706' : voiceStatus.startsWith('✅') ? '#059669' : voiceStatus.startsWith('❌') ? '#DC2626' : '#64748B',
                            }}>
                                {isListening && (
                                    <span style={{
                                        display: 'inline-block', width: 10, height: 10,
                                        borderRadius: '50%', background: '#EF4444',
                                        animation: 'vcPulse 1s ease-in-out infinite',
                                    }} />
                                )}
                                {voiceStatus || (isListening ? '🎙 Listening...' : '')}
                            </div>

                            {/* Interim words — shown while speaking */}
                            {(liveTranscript || finalTranscript) && (
                                <div style={{
                                    background: '#fff',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    fontSize: '18px',
                                    color: '#1E293B',
                                    fontStyle: liveTranscript && !finalTranscript ? 'italic' : 'normal',
                                    opacity: liveTranscript && !finalTranscript ? 0.6 : 1,
                                    minHeight: '40px',
                                }}>
                                    {finalTranscript || liveTranscript}
                                </div>
                            )}

                            {/* Hint */}
                            {!isListening && !finalTranscript && (
                                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>
                                    Say a word like "good", "okay", "no" — or just say "1", "2", "3"
                                </div>
                            )}
                        </div>
                    )}

                    <style>{`
                        @keyframes vcPulse {
                            0%, 100% { opacity: 1; transform: scale(1); }
                            50%       { opacity: 0.4; transform: scale(0.8); }
                        }
                    `}</style>
                </div>
            </div>
        </DashboardLayout>
    );
}
