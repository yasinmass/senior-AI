import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { recordDiary, getDiaryEntries } from '../../utils/api';

/* ── Language display map ──────────────────────────────────────── */
const LANG_MAP = {
    ta: 'Tamil', hi: 'Hindi', te: 'Telugu',
    ml: 'Malayalam', kn: 'Kannada', bn: 'Bengali',
    mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi',
    en: 'English', ur: 'Urdu', or: 'Odia',
};

const LANG_FLAG = {
    ta: '🇮🇳', hi: '🇮🇳', te: '🇮🇳', ml: '🇮🇳', kn: '🇮🇳',
    bn: '🇮🇳', mr: '🇮🇳', gu: '🇮🇳', pa: '🇮🇳', ur: '🇮🇳',
    or: '🇮🇳', en: '🇬🇧',
};

const EMOTION_EMOJI = {
    joy: '😊', happy: '😊', love: '❤️', sad: '😢', sadness: '😢',
    anger: '😡', fear: '😨', surprise: '😲', neutral: '😐',
    disgust: '🤢', contempt: '😤',
};

/* ── Date formatting helpers ───────────────────────────────────── */
function formatDiaryDate(isoStr) {
    const d = new Date(isoStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const entry = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const diffDays = Math.floor((today - entry) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('en-IN', {
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
}

/* ── Styles (inline for Diary page) ────────────────────────────── */
const styles = {
    container: {
        maxWidth: 720,
    },

    /* ── Record button area ── */
    recordSection: {
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-card)',
        padding: '40px 32px',
        textAlign: 'center',
        marginBottom: 28,
    },
    micRing: {
        width: 140,
        height: 140,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        position: 'relative',
    },
    micBtn: (isRecording) => ({
        width: 96,
        height: 96,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
        color: '#fff',
        background: isRecording
            ? 'linear-gradient(135deg, #E74C3C, #F08080)'
            : 'linear-gradient(135deg, #6BCB77, #4DA85A)',
        boxShadow: isRecording
            ? '0 8px 28px rgba(231,76,60,0.35)'
            : '0 8px 28px rgba(107,203,119,0.35)',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 2,
    }),
    micLabel: {
        fontSize: 17,
        fontWeight: 600,
        color: 'var(--gray-700)',
        marginBottom: 4,
    },
    micSub: {
        fontSize: 14,
        color: 'var(--gray-400)',
    },

    /* ── Recording pulse ring ── */
    pulseRing: {
        position: 'absolute',
        inset: -16,
        borderRadius: '50%',
        border: '3px solid rgba(231,76,60,0.25)',
        animation: 'diaryPulse 1.5s ease-in-out infinite',
    },

    /* ── Processing overlay ── */
    processingOverlay: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '28px 0',
    },
    spinner: {
        width: 44,
        height: 44,
        border: '4px solid var(--gray-200)',
        borderTop: '4px solid var(--primary)',
        borderRadius: '50%',
        animation: 'diarySpin 0.8s linear infinite',
    },

    /* ── Entry list ── */
    entryList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    entryCard: {
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-card)',
        padding: '22px 24px',
        transition: 'all 0.2s ease',
    },
    entryHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    entryDate: {
        fontSize: 14,
        color: 'var(--gray-500)',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    langBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        background: 'var(--primary-pale)',
        color: 'var(--primary)',
    },
    entryText: {
        fontSize: 16,
        lineHeight: 1.7,
        color: 'var(--gray-800)',
        fontWeight: 400,
        padding: '0 0 8px',
    },
    emotionRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    emotionBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        background: 'var(--success-light)',
        color: '#2D7A36',
    },

    /* ── Empty state ── */
    emptyState: {
        textAlign: 'center',
        padding: '48px 24px',
        background: 'var(--bg-white)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-card)',
    },
    emptyIcon: {
        fontSize: 56,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--gray-700)',
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 15,
        color: 'var(--gray-400)',
        maxWidth: 340,
        margin: '0 auto',
        lineHeight: 1.6,
    },

    /* ── Timer ── */
    timer: {
        fontSize: 28,
        fontWeight: 700,
        color: 'var(--danger)',
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 6,
    },

    /* ── Error toast ── */
    errorBox: {
        background: 'var(--danger-light)',
        color: '#C0392B',
        padding: '12px 18px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 14,
        fontWeight: 500,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },

    /* ── Section header ── */
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 600,
        color: 'var(--gray-800)',
    },
    entryCount: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--gray-400)',
    },
};

/* ── Keyframes injected via <style> ── */
const keyframes = `
@keyframes diaryPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%   { transform: scale(1.16); opacity: 0.5; }
}
@keyframes diarySpin {
    to { transform: rotate(360deg); }
}
.diary-entry-card:hover {
    box-shadow: 0 4px 16px rgba(42,111,151,0.08) !important;
    transform: translateY(-2px);
}
`;


export default function Diary() {
    const [entries, setEntries] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [loaded, setLoaded] = useState(false);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    /* ── Load existing entries on mount ── */
    useEffect(() => {
        loadEntries();
    }, []);

    async function loadEntries() {
        try {
            const res = await getDiaryEntries();
            if (res.success) {
                setEntries(res.entries || []);
            }
        } catch (e) {
            console.error('Failed to load diary entries', e);
        } finally {
            setLoaded(true);
        }
    }

    /* ── Recording logic ── */
    async function startRecording() {
        setErrorMsg('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach(t => t.stop());

                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                if (blob.size < 1000) {
                    setErrorMsg('Recording too short. Please speak for at least a few seconds.');
                    return;
                }
                await submitAudio(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setSeconds(0);
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        } catch (err) {
            setErrorMsg('Microphone access denied. Please allow mic permission and try again.');
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        clearInterval(timerRef.current);
    }

    async function submitAudio(blob) {
        setIsProcessing(true);
        setErrorMsg('');
        try {
            const res = await recordDiary(blob);
            if (res.success) {
                // Prepend new entry to top
                setEntries(prev => [{
                    id: res.id,
                    original_text: res.original_text,
                    language: res.language,
                    mood_score: null,
                    emotion: null,
                    created_at: res.created_at,
                }, ...prev]);
            } else {
                setErrorMsg(res.error || 'Failed to process recording.');
            }
        } catch (e) {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }

    function formatTimer(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function handleMicClick() {
        if (isProcessing) return;
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    return (
        <DashboardLayout role="patient" title="Diary">
            {/* Inject keyframes */}
            <style>{keyframes}</style>

            <div style={styles.container}>
                {/* ── Header ── */}
                <div className="page-header">
                    <h2>📓 My Voice Diary</h2>
                    <p>Record your thoughts, memories, and daily experiences using your voice.</p>
                </div>

                {/* ── Error message ── */}
                {errorMsg && (
                    <div style={styles.errorBox}>
                        <span>⚠️</span> {errorMsg}
                    </div>
                )}

                {/* ── Record section ── */}
                <div style={styles.recordSection}>
                    {isProcessing ? (
                        <div style={styles.processingOverlay}>
                            <div style={styles.spinner} />
                            <div style={styles.micLabel}>Processing your recording...</div>
                            <div style={styles.micSub}>
                                Transcribing & detecting language — this may take a moment
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Timer while recording */}
                            {isRecording && (
                                <div style={styles.timer}>{formatTimer(seconds)}</div>
                            )}

                            {/* Mic button */}
                            <div style={styles.micRing}>
                                {isRecording && <div style={styles.pulseRing} />}
                                <button
                                    id="diary-mic-btn"
                                    style={styles.micBtn(isRecording)}
                                    onClick={handleMicClick}
                                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                                >
                                    {isRecording ? '⏹' : '🎙'}
                                </button>
                            </div>

                            <div style={styles.micLabel}>
                                {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
                            </div>
                            <div style={styles.micSub}>
                                {isRecording
                                    ? 'Speak freely in your language'
                                    : 'Speak in Tamil, Hindi, English or any language'
                                }
                            </div>
                        </>
                    )}
                </div>

                {/* ── Entries section ── */}
                {loaded && (
                    <>
                        {entries.length > 0 && (
                            <div style={styles.sectionHeader}>
                                <div style={styles.sectionTitle}>Recent Entries</div>
                                <div style={styles.entryCount}>
                                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                                </div>
                            </div>
                        )}

                        {entries.length === 0 ? (
                            <div style={styles.emptyState}>
                                <div style={styles.emptyIcon}>🎙️</div>
                                <div style={styles.emptyTitle}>No diary entries yet</div>
                                <div style={styles.emptySub}>
                                    Click the microphone above to record your first entry!
                                    Speak in any language — we'll understand.
                                </div>
                            </div>
                        ) : (
                            <div style={styles.entryList}>
                                {entries.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="diary-entry-card"
                                        style={styles.entryCard}
                                    >
                                        {/* Card header: date + language */}
                                        <div style={styles.entryHeader}>
                                            <div style={styles.entryDate}>
                                                📅 {formatDiaryDate(entry.created_at)}{' '}
                                                {formatTime(entry.created_at)}
                                            </div>
                                            <div style={styles.langBadge}>
                                                {LANG_FLAG[entry.language] || '🌐'}{' '}
                                                {LANG_MAP[entry.language] || entry.language}
                                            </div>
                                        </div>

                                        {/* Original text */}
                                        <div style={styles.entryText}>
                                            "{entry.original_text}"
                                        </div>

                                        {/* Emotion badge (if available) */}
                                        {entry.emotion && (
                                            <div style={styles.emotionRow}>
                                                <div style={styles.emotionBadge}>
                                                    {EMOTION_EMOJI[entry.emotion?.toLowerCase()] || '💭'}{' '}
                                                    {entry.emotion}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
