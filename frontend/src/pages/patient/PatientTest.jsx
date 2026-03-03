import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { blobToWavBlob } from '../../utils/audioUtils';
import { apiFetch } from '../../utils/api';
import { t, getQuestions } from '../../utils/i18n';
import { getFinalOutput, startReactionTimer, stopReactionTimer, getAverageReactionTime, resetReactionTimer } from '../../utils/scoring';

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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: i < step ? 'var(--success)' : i === step ? 'var(--primary)' : 'var(--gray-200)',
                            color: i <= step ? '#fff' : 'var(--gray-400)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 14, transition: 'all .3s'
                        }}>
                            {i < step ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? 'var(--primary)' : 'var(--gray-400)', whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                    {i < items.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: i < step ? 'var(--success)' : 'var(--gray-200)', margin: '0 8px', marginBottom: 20, transition: 'background .3s' }} />
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
    const [statusText, setStatusText] = useState('Click the mic to begin recording');
    const [statusColor, setStatusColor] = useState('var(--gray-500)');
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
                sessionStorage.setItem('voice_biomarkers', JSON.stringify({
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
                            sessionStorage.setItem('ml_result', JSON.stringify({
                                ml_prediction: ml.ml_prediction,
                                ml_dementia_probability: ml.ml_dementia_probability,
                                ml_normal_probability: ml.ml_normal_probability,
                            }));
                            setStatusText(ml.ml_prediction === 'dementia' ? '⚠ Voice analysis indicates elevated markers' : '✔ Voice analysis complete — normal pattern');
                            setStatusColor(ml.ml_prediction === 'dementia' ? 'var(--warning)' : 'var(--success)');
                        }
                    } catch { setStatusText('Voice saved. Proceeding to questionnaire.'); }
                    setAnalyzing(false);
                    setNextEnabled(true);
                } else {
                    setStatusText(`Too short! Please record at least ${MIN_DURATION} seconds.`);
                    setStatusColor('var(--danger)');
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
            setStatusColor('var(--primary)');
        } catch (err) {
            setStatusText('Microphone access denied or not available.');
            setStatusColor('var(--danger)');
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
        <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>⚠️</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: 'var(--gray-800)' }}>Before You Begin</h3>
                <div style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
                    <p>• Find a <strong>quiet environment</strong> with minimal background noise</p>
                    <p>• Speak clearly and naturally for <strong>10–60 seconds</strong></p>
                    <p>• Describe your morning routine, a recent memory, or read the passage shown</p>
                    <p>• This voice recording helps our AI detect speech patterns</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowNotice(false)}>I'm Ready →</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 32, textAlign: 'center' }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Voice Analysis</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 28 }}>Speak naturally — our AI will analyze your speech patterns</p>

                {/* Circular mic */}
                <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}>
                    <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} width={140} height={140}>
                        <circle cx={70} cy={70} r={54} stroke="var(--gray-200)" strokeWidth={8} fill="transparent" />
                        <circle cx={70} cy={70} r={54} stroke={isRecording ? 'var(--danger)' : 'var(--primary)'} strokeWidth={8} fill="transparent"
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
                            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <rect x={6} y={6} width={12} height={12} rx={2} fill="currentColor" stroke="none" />
                            </svg>
                        ) : (
                            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>
                </div>

                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }}>
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
                <p style={{ fontSize: 14, color: statusColor, fontWeight: 600, marginBottom: 24, minHeight: 20 }}>
                    {analyzing ? <span className="spin" style={{ display: 'inline-block' }}>⟳</span> : null} {statusText}
                </p>

                <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 24, textAlign: 'left' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Suggested prompt:</p>
                    <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7, fontStyle: 'italic' }}>
                        "Tell me about what you did this morning — what you ate, where you went, and what you plan to do today."
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button className="btn btn-primary" onClick={() => isRecording ? stopRecording() : startRecording()} disabled={analyzing}>
                        {isRecording ? '⏹ Stop Recording' : '🎙 Start Recording'}
                    </button>
                    <button className="btn btn-secondary" disabled={!nextEnabled} onClick={onDone}
                        style={{ opacity: nextEnabled ? 1 : .5, cursor: nextEnabled ? 'pointer' : 'not-allowed' }}>
                        Next: Quiz →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Quiz Phase ────────────────────────────────────────────────────────────────
function QuizPhase({ onDone }) {
    const [phase, setPhase] = useState('memory'); // memory | quiz | saving
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
        try { voiceBio = JSON.parse(sessionStorage.getItem('voice_biomarkers') || '{}'); } catch { }
        try { mlRes = JSON.parse(sessionStorage.getItem('ml_result') || '{}'); } catch { }
        const payload = { ...finalResults, ...voiceBio, ...mlRes };

        try {
            const res = await apiFetch('/assessment/save/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const data = await res.json();
            if (data.success) { sessionStorage.removeItem('voice_biomarkers'); sessionStorage.removeItem('ml_result'); onDone(); }
            else throw new Error(data.error || 'Save failed');
        } catch (e) { setErrMsg(e.message); setPhase('error'); }
    }

    const q = questions[step];

    if (phase === 'memory') return (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 32, textAlign: 'center' }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Memory Warm-Up</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 24 }}>Memorize these words — you'll be asked about them later</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
                    {MEMORY_WORDS.map(w => (
                        <span key={w} style={{ background: 'var(--primary-pale)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', padding: '12px 24px', fontWeight: 800, fontSize: 18, border: '2px solid var(--primary-pale)' }}>{w}</span>
                    ))}
                </div>
                <button className="btn btn-primary btn-lg" onClick={startQuiz}>I've Memorized Them — Start Quiz →</button>
            </div>
        </div>
    );

    if (phase === 'quiz') return (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ height: 6, background: 'var(--gray-200)' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--primary),var(--accent))', width: `${progress}%`, transition: 'width .5s ease', borderRadius: '0 4px 4px 0' }} />
            </div>
            <div className="card-body" style={{ padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{q?.domain} Assessment</span>
                    <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 600 }}>{step + 1} / {questions.length}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--gray-800)', lineHeight: 1.5 }}>{q?.q}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {q?.opts.map(opt => (
                        <button key={opt} onClick={() => handleAnswer(opt)}
                            style={{ padding: '14px 18px', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', background: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all .15s', color: 'var(--gray-700)' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--gray-700)'; }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    if (phase === 'saving') return (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 48, textAlign: 'center' }}>
                <div className="loader-ring" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Analyzing Your Results…</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Our AI is combining your voice patterns and quiz responses to generate a comprehensive assessment.</p>
            </div>
        </div>
    );

    if (phase === 'error') return (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="card-body" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: 'var(--danger)', marginBottom: 8 }}>Save Error</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Could not save to database. Make sure the Django server is running.</p>
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8 }}>{errMsg}</p>
            </div>
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
            <p style={{ color: 'var(--gray-400)' }}>Loading results…</p>
        </div>
    );

    if (!assessment) return (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--gray-500)' }}>No assessment found.</p>
        </div>
    );

    const { final_risk_level: risk, total_score, ml_prediction, ml_dementia_probability, orientation_score, memory_score, executive_score, created_at } = assessment;
    const riskConfig = {
        Low: { cls: 'result-card-low', icon: '✅', color: 'var(--success)', text: 'Low Risk — Normal Cognitive Function', desc: 'Your cognitive assessment shows no significant indicators of dementia. Continue healthy habits and schedule regular check-ups.' },
        Moderate: { cls: 'result-card-mod', icon: '⚠️', color: 'var(--warning)', text: 'Moderate Risk — Monitor Closely', desc: 'Some indicators suggest closer monitoring is needed. We recommend a follow-up consultation with your doctor within 2 weeks.' },
        High: { cls: 'result-card-high', icon: '🔴', color: 'var(--danger)', text: 'High Risk — Immediate Consultation', desc: 'Your results indicate elevated dementia markers. Please contact your doctor immediately for a comprehensive evaluation.' },
    };
    const rc = riskConfig[risk] || riskConfig.Low;

    return (
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
            {/* Main result */}
            <div className={`card ${rc.cls}`} style={{ borderRadius: 'var(--radius-lg)', padding: 32, textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{rc.icon}</div>
                <span className={`badge ${risk === 'Low' ? 'badge-low' : risk === 'Moderate' ? 'badge-moderate' : 'badge-high'}`} style={{ fontSize: 13, padding: '6px 16px', marginBottom: 12 }}>Dementia Risk: {risk}</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: rc.color, marginBottom: 8 }}>{rc.text}</h3>
                <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 16 }}>{rc.desc}</p>
                <div style={{ background: 'rgba(255,255,255,.6)', borderRadius: 'var(--radius-sm)', padding: '10px 20px', display: 'inline-block' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>ML Voice Analysis: </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: ml_prediction === 'dementia' ? 'var(--danger)' : 'var(--success)' }}>
                        {ml_prediction === 'dementia' ? `⚠ Positive (${ml_dementia_probability}%)` : '✔ Normal Pattern'}
                    </span>
                </div>
            </div>

            {/* Score breakdown */}
            <div className="card" style={{ marginBottom: 20, padding: 24 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 16, color: 'var(--gray-700)' }}>Score Breakdown</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                        { label: 'Orientation', score: orientation_score, max: 10, color: 'var(--primary)' },
                        { label: 'Memory', score: memory_score, max: 10, color: 'var(--accent)' },
                        { label: 'Executive', score: executive_score, max: 10, color: 'var(--teal)' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: 14, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.score}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>/ {s.max}</div>
                            <div className="progress" style={{ marginTop: 8 }}><div className="progress-bar blue" style={{ width: `${(s.score / s.max) * 100}%`, background: s.color }} /></div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Total Cognitive Score</span>
                    <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--primary)' }}>{total_score} / 30</span>
                </div>
            </div>

            {/* Confirmation */}
            <div className="card" style={{ padding: 20, background: 'var(--success-light)', border: '2px solid #6EE7B7', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>📤</span>
                    <div>
                        <p style={{ fontWeight: 700, color: '#065F46' }}>Report Sent to Doctor</p>
                        <p style={{ fontSize: 13, color: '#047857' }}>Your results have been automatically shared with your healthcare provider. Assessment date: {created_at}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button className="btn btn-outline btn-lg" onClick={() => window.location.reload()}>Take Another Test</button>
                <button className="btn btn-primary btn-lg" onClick={() => window.location.href = '/patient'}>Back to Dashboard</button>
            </div>
        </div>
    );
}

// ── Main Test Page ────────────────────────────────────────────────────────────
export default function PatientTest() {
    const [step, setStep] = useState(0); // 0=voice, 1=quiz, 2=result

    return (
        <DashboardLayout role="patient" title="AI Dementia Test">
            <div className="page-header">
                <h2>AI Dementia Screening Test</h2>
                <p>Complete both the voice analysis and cognitive questionnaire for a comprehensive assessment</p>
            </div>

            <Steps step={step} />

            <div className="fade-in" key={step}>
                {step === 0 && <VoicePhase onDone={() => setStep(1)} />}
                {step === 1 && <QuizPhase onDone={() => setStep(2)} />}
                {step === 2 && <ResultPhase />}
            </div>
        </DashboardLayout>
    );
}
