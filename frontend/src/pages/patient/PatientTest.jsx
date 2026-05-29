import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { blobToWavBlob } from '../../utils/audioUtils';
import { apiFetch } from '../../utils/api';
import { t as i18nT, getQuestions } from '../../utils/i18n';
import { getFinalOutput, startReactionTimer, stopReactionTimer, getAverageReactionTime, resetReactionTimer } from '../../utils/scoring';
import { useLanguage } from '../../context/LanguageContext';


const CIRCUMFERENCE = 2 * Math.PI * 54;
const MAX_DURATION = 60;
const MIN_DURATION = 10;
const MEMORY_WORDS = ['Apple', 'Car', 'Tree', 'Book', 'Pen'];

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ step }) {
    const items = ['Voice Test', 'Questionnaire', 'Results'];
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            {items.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < items.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: i < step ? '#6BCB77' : i === step ? '#2A6F97' : '#E2E7ED',
                            color: i <= step ? '#fff' : '#94A3B5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 15, transition: 'all .3s'
                        }}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: i === step ? '#2A6F97' : '#94A3B5', whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                    {i < items.length - 1 && (
                        <div style={{ flex: 1, height: 3, background: i < step ? '#6BCB77' : '#E2E7ED', margin: '0 10px', marginBottom: 24, borderRadius: 2, transition: 'background .3s' }} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Voice Recording Phase ─────────────────────────────────────────────────────
function VoicePhase({ onDone }) {
    const [showNotice, setShowNotice] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [statusText, setStatusText] = useState('Click the microphone button to begin recording');
    const [statusColor, setStatusColor] = useState('#6B7D8F');
    const [nextEnabled, setNextEnabled] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const silenceStartRef = useRef(0);
    const totalSilenceRef = useRef(0);
    const recognitionRef = useRef(null);
    const wordCountRef = useRef(0);
    const secondsRef = useRef(0);
    const isRecordingRef = useRef(false);

    function updateTimer() {
        secondsRef.current++;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_DURATION) stopRecording();
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true; recognition.interimResults = true;
                recognition.onresult = (e) => {
                    let t = '';
                    for (let i = e.resultIndex; i < e.results.length; ++i) t += e.results[i][0].transcript;
                    wordCountRef.current = t.trim().split(/\s+/).filter(w => w.length > 0).length;
                };
                recognition.start();
                recognitionRef.current = recognition;
            }

            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512; source.connect(analyser);
            audioContextRef.current = audioContext;

            const dataArr = new Uint8Array(analyser.frequencyBinCount);
            const checkSilence = () => {
                if (!isRecordingRef.current) return;
                analyser.getByteFrequencyData(dataArr);
                const vol = dataArr.reduce((a, b) => a + b) / dataArr.length;
                if (vol < 3) { if (!silenceStartRef.current) silenceStartRef.current = Date.now(); }
                else { if (silenceStartRef.current) { const d = (Date.now() - silenceStartRef.current) / 1000; if (d > 0.5) totalSilenceRef.current += d; silenceStartRef.current = 0; } }
                requestAnimationFrame(checkSilence);
            };

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = async () => {
                const dur = secondsRef.current;
                localStorage.setItem('voice_biomarkers', JSON.stringify({
                    pause_duration: parseFloat(totalSilenceRef.current.toFixed(2)),
                    word_count: wordCountRef.current,
                    speech_rate: dur > 0 ? parseFloat((wordCountRef.current / (dur / 60)).toFixed(2)) : 0,
                    recording_duration: dur,
                }));

                if (dur >= MIN_DURATION) {
                    setAnalyzing(true);
                    setStatusText('Analyzing voice with AI model…');
                    try {
                        const raw = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
                        const wav = await blobToWavBlob(raw);
                        const form = new FormData();
                        form.append('audio', wav, 'recording.wav');
                        const res = await apiFetch('/audio/analyze/', { method: 'POST', body: form });
                        const ml = await res.json();
                        if (ml.success) {
                            localStorage.setItem('ml_result', JSON.stringify({
                                ml_prediction: ml.ml_prediction,
                                ml_dementia_probability: ml.ml_dementia_probability,
                                ml_normal_probability: ml.ml_normal_probability,
                            }));
                            setStatusText(ml.ml_prediction === 'dementia' ? '⚠ Voice analysis indicates elevated markers' : '✔ Voice analysis complete — normal patterns detected');
                            setStatusColor(ml.ml_prediction === 'dementia' ? '#F0AD4E' : '#6BCB77');
                        }
                    } catch { setStatusText('Voice saved. Proceeding to next step.'); }
                    setAnalyzing(false);
                    setNextEnabled(true);
                } else {
                    setStatusText(`Recording too short. Please record at least ${MIN_DURATION} seconds.`);
                    setStatusColor('#E74C3C');
                }
                setIsRecording(false);
                isRecordingRef.current = false;
            };

            audioChunksRef.current = [];
            totalSilenceRef.current = 0; silenceStartRef.current = 0;
            wordCountRef.current = 0; secondsRef.current = 0; setSeconds(0);

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            isRecordingRef.current = true; setIsRecording(true);
            timerRef.current = setInterval(updateTimer, 1000);
            checkSilence();
            setStatusText('Recording… speak naturally about your day');
            setStatusColor('#2A6F97');
        } catch (err) {
            setStatusText('Microphone access denied or not available.');
            setStatusColor('#E74C3C');
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
        if (recognitionRef.current) recognitionRef.current.stop();
        if (audioContextRef.current) audioContextRef.current.close();
        clearInterval(timerRef.current);
        isRecordingRef.current = false; setIsRecording(false);
    }

    const strokeOffset = CIRCUMFERENCE - (seconds / MAX_DURATION * CIRCUMFERENCE);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (showNotice) return (
        <div style={{
            maxWidth: 560, margin: '0 auto',
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E7ED',
            boxShadow: '0 4px 16px rgba(42,111,151,0.08)',
            padding: 36,
        }}>
            <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: '#FFF6E5', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 20,
            }}>⚠️</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#1F2F3D' }}>Before You Begin</h3>
            <div style={{ color: '#6B7D8F', fontSize: 16, lineHeight: 1.9, marginBottom: 28 }}>
                <p>• Find a <strong>quiet environment</strong> with minimal background noise</p>
                <p>• Speak clearly and naturally for <strong>10–60 seconds</strong></p>
                <p>• Describe your morning routine, a recent memory, or read the prompt</p>
                <p>• This voice recording helps our AI detect speech patterns</p>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setShowNotice(false)}>
                I'm Ready — Start Voice Test →
            </button>
        </div>
    );

    return (
        <div style={{
            maxWidth: 560, margin: '0 auto',
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E7ED',
            boxShadow: '0 4px 16px rgba(42,111,151,0.08)',
            padding: 36, textAlign: 'center',
        }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#1F2F3D' }}>Voice Analysis</h3>
            <p style={{ fontSize: 15, color: '#6B7D8F', marginBottom: 28 }}>Speak naturally — our AI will analyze your speech patterns</p>

            {/* Circular mic button */}
            <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 28px' }}>
                <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} width={160} height={160}>
                    <circle cx={80} cy={80} r={54} stroke="#E2E7ED" strokeWidth={8} fill="transparent" />
                    <circle cx={80} cy={80} r={54} stroke={isRecording ? '#E74C3C' : '#2A6F97'} strokeWidth={8} fill="transparent"
                        strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeOffset} strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }} />
                </svg>
                <button
                    className={`mic-btn ${isRecording ? 'recording' : ''} ${isRecording ? 'pulse-ring' : ''}`}
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                    onClick={() => isRecording ? stopRecording() : startRecording()}
                    disabled={analyzing}
                >
                    {isRecording ? (
                        <svg width={26} height={26} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <rect x={6} y={6} width={12} height={12} rx={2} fill="currentColor" stroke="none" />
                        </svg>
                    ) : (
                        <svg width={28} height={28} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>
            </div>

            <div style={{ fontSize: 32, fontWeight: 700, color: '#1F2F3D', marginBottom: 8 }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <p style={{ fontSize: 15, color: statusColor, fontWeight: 600, marginBottom: 28, minHeight: 22 }}>
                {analyzing ? <span className="spin" style={{ display: 'inline-block' }}>⟳</span> : null} {statusText}
            </p>

            {/* Prompt */}
            <div style={{ background: '#F4F6F9', borderRadius: 10, padding: 18, marginBottom: 28, textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#94A3B5', textTransform: 'uppercase', marginBottom: 8 }}>Suggested prompt:</p>
                <p style={{ fontSize: 15, color: '#4A5D6F', lineHeight: 1.7, fontStyle: 'italic' }}>
                    "Tell me about what you did this morning — what you ate, where you went, and what you plan to do today."
                </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button className="btn btn-primary" onClick={() => isRecording ? stopRecording() : startRecording()} disabled={analyzing} style={{ fontSize: 15, padding: '14px 0' }}>
                    {isRecording ? '⏹ Stop' : '🎙 Record'}
                </button>
                <button className="btn btn-secondary" disabled={!nextEnabled} onClick={onDone}
                    style={{ opacity: nextEnabled ? 1 : .5, cursor: nextEnabled ? 'pointer' : 'not-allowed', fontSize: 15, padding: '14px 0' }}>
                    Continue →
                </button>
            </div>
        </div>
    );
}

// ── Quiz Phase ────────────────────────────────────────────────────────────────
function QuizPhase({ onDone }) {
    const [phase, setPhase] = useState('memory');
    const [questions] = useState(() => getQuestions());
    const [step, setStep] = useState(0);
    const [domainCounts, setDomainCounts] = useState({ orientation: 0, memory: 0, executive: 0 });
    const [progress, setProgress] = useState(0);
    const [errMsg, setErrMsg] = useState('');

    function startQuiz() {
        setPhase('quiz');
        setProgress((1 / questions.length) * 100);
        resetReactionTimer();
        startReactionTimer();
    }

    function handleAnswer(opt) {
        stopReactionTimer();
        const q = questions[step];
        const nc = { ...domainCounts };
        if (opt === q.a) nc[q.domain] = (nc[q.domain] || 0) + 1;
        setDomainCounts(nc);
        const next = step + 1;
        setStep(next);
        if (next >= questions.length) { finish(nc); return; }
        setProgress(((next + 1) / questions.length) * 100);
        startReactionTimer();
    }

    async function finish(counts) {
        setPhase('saving');
        const avgRT = getAverageReactionTime();
        const scores = { orientation: counts.orientation * 2, memory: counts.memory * 2, executive: counts.executive * 2 };
        const finalResults = getFinalOutput(scores, avgRT);
        let voiceBio = {}; let mlRes = {};
        try { voiceBio = JSON.parse(localStorage.getItem('voice_biomarkers') || '{}'); } catch { }
        try { mlRes = JSON.parse(localStorage.getItem('ml_result') || '{}'); } catch { }
        const payload = { ...finalResults, ...voiceBio, ...mlRes };

        try {
            const res = await apiFetch('/assessment/save/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (data.success) { localStorage.removeItem('voice_biomarkers'); localStorage.removeItem('ml_result'); onDone(); }
            else throw new Error(data.error || 'Save failed');
        } catch (e) { setErrMsg(e.message); setPhase('error'); }
    }

    const q = questions[step];

    if (phase === 'memory') return (
        <div style={{
            maxWidth: 600, margin: '0 auto',
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E7ED',
            boxShadow: '0 4px 16px rgba(42,111,151,0.08)',
            padding: 36, textAlign: 'center',
        }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#1F2F3D' }}>Memory Warm-Up</h3>
            <p style={{ fontSize: 15, color: '#6B7D8F', marginBottom: 28 }}>Memorize these words — you'll be asked about them later</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
                {MEMORY_WORDS.map(w => (
                    <span key={w} style={{
                        background: '#E8F1F8', color: '#2A6F97',
                        borderRadius: 10, padding: '14px 28px',
                        fontWeight: 700, fontSize: 20,
                        border: '2px solid #D0E4F0',
                    }}>{w}</span>
                ))}
            </div>
            <button className="btn btn-primary btn-lg" onClick={startQuiz} style={{ width: '100%' }}>
                I've Memorized Them — Start Quiz →
            </button>
        </div>
    );

    if (phase === 'quiz') return (
        <div style={{
            maxWidth: 600, margin: '0 auto',
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E7ED',
            boxShadow: '0 4px 16px rgba(42,111,151,0.08)',
            overflow: 'hidden',
        }}>
            {/* Progress bar at top */}
            <div style={{ height: 8, background: '#E2E7ED' }}>
                <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #2A6F97, #6BCB77)',
                    width: `${progress}%`,
                    transition: 'width .5s ease',
                    borderRadius: '0 4px 4px 0',
                }} />
            </div>
            <div style={{ padding: 36 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{
                        display: 'inline-flex', padding: '5px 14px',
                        background: '#E8F1F8', color: '#2A6F97',
                        borderRadius: 20, fontSize: 13, fontWeight: 600,
                        textTransform: 'capitalize',
                    }}>{q?.domain} Assessment</span>
                    <span style={{ fontSize: 14, color: '#94A3B5', fontWeight: 600 }}>{step + 1} / {questions.length}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: '#1F2F3D', lineHeight: 1.5 }}>{q?.q}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {q?.opts.map(opt => (
                        <button key={opt} onClick={() => handleAnswer(opt)}
                            style={{
                                padding: '16px 20px',
                                border: '2px solid #E2E7ED',
                                borderRadius: 10,
                                background: '#fff',
                                fontSize: 16, fontWeight: 500,
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all .15s',
                                color: '#4A5D6F',
                                fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2A6F97'; e.currentTarget.style.background = '#E8F1F8'; e.currentTarget.style.color = '#2A6F97'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E7ED'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#4A5D6F'; }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    if (phase === 'saving') return (
        <div style={{
            maxWidth: 500, margin: '0 auto',
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E7ED',
            boxShadow: '0 4px 16px rgba(42,111,151,0.08)',
            padding: 48, textAlign: 'center',
        }}>
            <div className="loader-ring" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: '#1F2F3D' }}>Analyzing Your Results…</h3>
            <p style={{ color: '#6B7D8F', fontSize: 15 }}>Our AI is combining your voice patterns and quiz responses to generate a comprehensive assessment.</p>
        </div>
    );

    if (phase === 'error') return (
        <div style={{
            maxWidth: 500, margin: '0 auto',
            background: '#fff', borderRadius: 16,
            border: '1px solid #E2E7ED',
            boxShadow: '0 4px 16px rgba(42,111,151,0.08)',
            padding: 36, textAlign: 'center',
        }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
            <h3 style={{ fontWeight: 700, fontSize: 20, color: '#E74C3C', marginBottom: 8 }}>Save Error</h3>
            <p style={{ color: '#6B7D8F', fontSize: 15 }}>Could not save to database. Make sure the server is running.</p>
            <p style={{ color: '#E74C3C', fontSize: 13, marginTop: 8 }}>{errMsg}</p>
        </div>
    );
}

// ── Result Phase ──────────────────────────────────────────────────────────────
function ResultPhase() {
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/assessment/latest/').then(r => r.json()).then(d => { if (d.success) setAssessment(d.assessment); }).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: 48 }}>
            <div className="loader-ring" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#94A3B5' }}>Finalizing results…</p>
        </div>
    );

    if (!assessment) return (
        <div style={{
            maxWidth: 500, margin: '0 auto',
            background: '#fff', borderRadius: 16, padding: 40,
            textAlign: 'center', border: '1px solid #E2E7ED',
        }}>
            <p style={{ color: '#6B7D8F', fontSize: 15 }}>Assessment summary not available.</p>
        </div>
    );

    const { total_score, ml_prediction, orientation_score, memory_score, executive_score } = assessment;
    const pct = Math.round((total_score / 30) * 100);

    const getClassification = () => {
        if (pct >= 85) return { text: 'Low Risk — Normal', color: '#6BCB77', bg: '#E3F7E6', icon: '✅', desc: 'Your cognitive health is excellent. No significant markers detected.' };
        if (pct >= 40) return { text: 'Moderate Risk', color: '#F0AD4E', bg: '#FFF6E5', icon: '⚠️', desc: 'Moderate concerns detected. We recommend a clinical follow-up.' };
        return { text: 'High Risk', color: '#E74C3C', bg: '#FDEAEA', icon: '🚨', desc: 'Significant indicators detected. Professional evaluation is strongly recommended.' };
    };

    const c = getClassification();

    return (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #E2E7ED',
                boxShadow: '0 4px 20px rgba(42,111,151,0.08)',
                overflow: 'hidden', marginBottom: 20,
            }}>
                {/* Header */}
                <div style={{ background: c.bg, borderBottom: `3px solid ${c.color}`, padding: '36px', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{c.icon}</div>
                    <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1F2F3D', marginBottom: 8 }}>{c.text}</h2>
                    <p style={{ fontSize: 15, color: '#6B7D8F', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>{c.desc}</p>
                    <div style={{
                        display: 'inline-flex', alignItems: 'baseline', gap: 8,
                        background: 'rgba(255,255,255,0.8)', padding: '16px 28px',
                        borderRadius: 16, marginTop: 20,
                        boxShadow: `0 4px 12px ${c.color}20`,
                    }}>
                        <span style={{ fontSize: 52, fontWeight: 800, color: c.color }}>{pct}%</span>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B5', textTransform: 'uppercase' }}>Score</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#1F2F3D' }}>{total_score}<span style={{ opacity: 0.5, fontSize: 14 }}>/30</span></div>
                        </div>
                    </div>
                </div>

                {/* Scores */}
                <div style={{ padding: 36 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                        {[
                            { label: 'Orientation', score: orientation_score, color: '#2A6F97' },
                            { label: 'Memory', score: memory_score, color: '#3A8FBF' },
                            { label: 'Executive', score: executive_score, color: '#6BCB77' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#F4F6F9', padding: 20, borderRadius: 12, textAlign: 'center' }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B5', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.score}<span style={{ fontSize: 13, opacity: 0.4 }}>/10</span></div>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: '#E3F7E6', padding: '14px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, border: '1px solid #B8E6BF' }}>
                        <span style={{ fontSize: 18 }}>✅</span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#2D7A36' }}>Your clinical report has been securely saved.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button className="btn btn-primary" onClick={() => navigate('/patient/results')} style={{ padding: '14px 0', borderRadius: 10, fontSize: 15 }}>
                            View Full Report →
                        </button>
                        <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ padding: '14px 0', borderRadius: 10, fontSize: 15 }}>
                            Take Another Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Exam Selection Hub ─────────────────────────────────────────────────────────
function ExamHub({ onStart }) {
    const { t } = useLanguage();
    const voiceDone = !!localStorage.getItem('voice_exam_done');
    const mmseDone = !!localStorage.getItem('mmse_exam_done');
    const completedCount = [voiceDone, mmseDone].filter(Boolean).length;

    const exams = [
        {
            key: 'voice', icon: '🎙️', title: t('screening_voice_title'), marks: 40,
            color: '#2A6F97', done: voiceDone,
            scoreText: voiceDone ? '40 / 40' : null,
            desc: 'Record your voice for 10–60 seconds. AI analyzes pause patterns, speech rate, and vocal biomarkers.',
            steps: ['Find a quiet room', 'Press Start and speak naturally', 'Talk about your day or read the prompt'],
        },
        {
            key: 'mmse', icon: '🧠', title: t('screening_mmse_title'), marks: 30,
            color: '#3A8FBF', done: mmseDone,
            scoreText: mmseDone ? '30 marks done' : null,
            desc: 'Answer questions about orientation, memory, and executive function. Multiple-choice, ~5 minutes.',
            steps: ['No preparation needed', 'Answer each question honestly', 'Results analyzed instantly'],
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>{t('screening_title')}</h2>
                <p>{t('screening_desc')}</p>
            </div>

            {/* Progress bar */}
            <div style={{
                background: '#fff', border: '1px solid #E2E7ED', borderRadius: 12,
                padding: '18px 24px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 20,
                boxShadow: '0 2px 8px rgba(42,111,151,0.05)',
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#4A5D6F' }}>Overall Progress</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#2A6F97' }}>{completedCount} / 2 {t('screening_completed')}</span>
                    </div>
                    <div className="progress">
                        <div className="progress-bar blue" style={{ width: `${(completedCount / 2) * 100}%` }} />
                    </div>
                </div>
                {completedCount === 2 && (
                    <span style={{
                        background: '#E3F7E6', color: '#2D7A36',
                        padding: '6px 16px', borderRadius: 20,
                        fontWeight: 600, fontSize: 14, flexShrink: 0,
                    }}>✓ {t('screening_all_done')}</span>
                )}
            </div>

            {/* Exam cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {exams.map(exam => (
                    <div key={exam.key} style={{
                        background: '#fff', border: '1px solid #E2E7ED',
                        borderLeft: `5px solid ${exam.color}`,
                        borderRadius: 12, padding: 28,
                        boxShadow: '0 2px 8px rgba(42,111,151,0.05)',
                        transition: 'all 0.2s',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 240 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 24 }}>{exam.icon}</span>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1F2F3D', margin: 0 }}>{exam.title}</h3>
                                    <span style={{ fontSize: 13, color: '#94A3B5', fontWeight: 500 }}>— {exam.marks} marks</span>
                                    {exam.done && (
                                        <span style={{
                                            background: '#E3F7E6', color: '#2D7A36',
                                            borderRadius: 20, padding: '3px 12px',
                                            fontSize: 13, fontWeight: 600,
                                        }}>
                                            ✓ {exam.scoreText || 'Done'}
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: 15, color: '#6B7D8F', lineHeight: 1.6, marginBottom: 12 }}>{exam.desc}</p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {exam.steps.map((s, i) => (
                                        <span key={i} style={{
                                            fontSize: 12, background: '#F4F6F9',
                                            color: '#4A5D6F', borderRadius: 6,
                                            padding: '4px 10px', fontWeight: 500,
                                        }}>
                                            {i + 1}. {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flexShrink: 0, paddingTop: 4 }}>
                                <button className="btn btn-primary" style={{ background: exam.color, fontSize: 15 }} onClick={() => onStart(exam.key)}>
                                    {exam.done ? `↻ ${t('screening_retake')}` : `▶ ${t('screening_start')}`} {t('screening_test')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>



        </div>
    );
}

// ── Main Patient Test Page ─────────────────────────────────────────────────────
export default function PatientTest() {
    const [mode, setMode] = useState('hub');
    const { t } = useLanguage();

    function back() { setMode('hub'); }

    return (
        <DashboardLayout role="patient" title={t('screening_title')}>
            <div className="fade-in" key={mode}>

                {mode === 'hub' && <ExamHub onStart={setMode} />}

                {mode === 'voice' && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <button className="btn btn-secondary btn-sm" onClick={back}>{t('screening_back')}</button>
                        </div>
                        <div className="page-header">
                            <h2>{t('screening_voice_title')} <span style={{ fontSize: 15, fontWeight: 400, color: '#94A3B5' }}>— 40 marks</span></h2>
                            <p>Speak naturally for 10–60 seconds about your day or read the suggested prompt.</p>
                        </div>
                        <VoicePhase onDone={() => { localStorage.setItem('voice_exam_done', '1'); back(); }} />
                    </div>
                )}

                {mode === 'mmse' && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <button className="btn btn-secondary btn-sm" onClick={back}>{t('screening_back')}</button>
                        </div>
                        <div className="page-header">
                            <h2>{t('screening_mmse_title')} <span style={{ fontSize: 15, fontWeight: 400, color: '#94A3B5' }}>— 30 marks</span></h2>
                            <p>Answer questions about orientation, memory, and executive function.</p>
                        </div>
                        <QuizPhase onDone={() => { localStorage.setItem('mmse_exam_done', '1'); back(); }} />
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
