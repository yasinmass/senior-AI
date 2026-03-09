import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { recordDiary, getDiaryEntries, deleteDiaryEntry, starDiaryEntry } from '../../utils/api';
import { useTranslate } from '../../hooks/useTranslate';


/* ── Language maps ─────────────────────────────────────── */
const LANG_MAP = {
    ta: 'Tamil', hi: 'Hindi', te: 'Telugu', ml: 'Malayalam', kn: 'Kannada',
    bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi',
    en: 'English', ur: 'Urdu', or: 'Odia',
};
const LANG_FLAG = {
    ta: '🇮🇳', hi: '🇮🇳', te: '🇮🇳', ml: '🇮🇳', kn: '🇮🇳',
    bn: '🇮🇳', mr: '🇮🇳', gu: '🇮🇳', pa: '🇮🇳', ur: '🇮🇳', or: '🇮🇳', en: '🇬🇧',
};
const EMOTION_EMOJI = {
    joy: '😊', happy: '😊', love: '❤️', sad: '😢', sadness: '😢',
    anger: '😡', fear: '😨', surprise: '😲', neutral: '😐',
    disgust: '🤢', contempt: '😤',
};

/* ── TASK 2: Timestamp helpers ────────────────────────────
   The backend now returns ISO strings with timezone info
   e.g. "2026-03-06T01:44:00+00:00"
   new Date() will correctly convert UTC → local IST.
───────────────────────────────────────────────────────── */
function formatDiaryDate(isoStr) {
    const d = new Date(isoStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today - entryDay) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('en-IN', {
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
}

/* ── Styles ────────────────────────────────────────────── */
const S = {
    container: { maxWidth: 720 },
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
        width: 140, height: 140, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', position: 'relative',
    },
    micBtn: (rec) => ({
        width: 96, height: 96, borderRadius: '50%', border: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 40, color: '#fff',
        background: rec
            ? 'linear-gradient(135deg, #E74C3C, #F08080)'
            : 'linear-gradient(135deg, #6BCB77, #4DA85A)',
        boxShadow: rec
            ? '0 8px 28px rgba(231,76,60,0.35)'
            : '0 8px 28px rgba(107,203,119,0.35)',
        transition: 'all 0.3s ease', position: 'relative', zIndex: 2,
    }),
    micLabel: { fontSize: 17, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 },
    micSub: { fontSize: 14, color: 'var(--gray-400)' },
    pulseRing: {
        position: 'absolute', inset: -16, borderRadius: '50%',
        border: '3px solid rgba(231,76,60,0.25)',
        animation: 'diaryPulse 1.5s ease-in-out infinite',
    },
    processingOverlay: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '28px 0',
    },
    spinner: {
        width: 44, height: 44,
        border: '4px solid var(--gray-200)', borderTop: '4px solid var(--primary)',
        borderRadius: '50%', animation: 'diarySpin 0.8s linear infinite',
    },
    entryList: { display: 'flex', flexDirection: 'column', gap: 16 },
    entryCard: (starred) => ({
        background: starred ? '#fffbea' : 'var(--bg-white)',
        borderRadius: 'var(--radius)',
        border: starred ? '1.5px solid #f59e0b' : '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-card)',
        padding: '18px 20px',
        transition: 'all 0.2s ease',
    }),
    entryHeader: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 10,
    },
    entryDate: {
        fontSize: 13, color: 'var(--gray-500)',
        fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
    },
    headerRight: {
        display: 'flex', alignItems: 'center', gap: 8,
    },
    langBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
        background: 'var(--primary-pale)', color: 'var(--primary)',
    },
    /* TASK 3: Star button */
    starBtn: (starred) => ({
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 20, lineHeight: 1, padding: '2px 4px',
        color: starred ? '#f59e0b' : '#d1d5db',
        transition: 'color 0.2s, transform 0.15s',
    }),
    /* TASK 3: Delete button */
    deleteBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 16, lineHeight: 1, padding: '2px 6px',
        color: '#e5534b', opacity: 0.7, transition: 'opacity 0.2s',
    },
    entryText: {
        fontSize: 16, lineHeight: 1.7,
        color: 'var(--gray-800)', fontWeight: 400, padding: '0 0 8px',
    },
    emotionRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
    emotionBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
        background: 'var(--success-light)', color: '#2D7A36',
    },
    emptyState: {
        textAlign: 'center', padding: '48px 24px',
        background: 'var(--bg-white)', borderRadius: 'var(--radius)',
        border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-card)',
    },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 },
    emptySub: { fontSize: 15, color: 'var(--gray-400)', maxWidth: 340, margin: '0 auto', lineHeight: 1.6 },
    timer: { fontSize: 28, fontWeight: 700, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums', marginBottom: 6 },
    errorBox: {
        background: 'var(--danger-light)', color: '#C0392B',
        padding: '12px 18px', borderRadius: 'var(--radius-sm)',
        fontSize: 14, fontWeight: 500, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 8,
    },
    sectionHeader: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
    },
    sectionTitle: { fontSize: 17, fontWeight: 600, color: 'var(--gray-800)' },
    entryCount: { fontSize: 13, fontWeight: 600, color: 'var(--gray-400)' },
};

const keyframes = `
@keyframes diaryPulse {
    0%,100% { transform: scale(1); opacity: 1; }
    50%      { transform: scale(1.16); opacity: 0.5; }
}
@keyframes diarySpin { to { transform: rotate(360deg); } }
.diary-entry-card:hover { box-shadow: 0 4px 16px rgba(42,111,151,0.08) !important; transform: translateY(-2px); }
.diary-star-btn:hover  { transform: scale(1.25); }
.diary-del-btn:hover   { opacity: 1 !important; }
`;

export default function Diary() {
    const [entries, setEntries] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [loaded, setLoaded] = useState(false);

    const t = useTranslate({
        diary_title: 'My Diary',
        diary_subtitle: 'Record your thoughts and daily experiences.',
        diary_record_btn: 'Record Diary Entry',
        diary_recording: 'Recording... Tap to stop',
        diary_processing: 'Transcribing your entry...',
        diary_empty: 'No diary entries yet. Tap the mic to record!',
        diary_today: 'Today',
        diary_yesterday: 'Yesterday',
        diary_saved: 'Entry saved successfully!',
        diary_error: 'Could not save. Please try again.',
        diary_recent: 'Recent Entries',
        diary_starred: 'starred',
        diary_entries: 'entries',
        diary_entry: 'entry',
        diary_speak_hint: 'Speak in any language — we will understand.',
    });
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);


    useEffect(() => { loadEntries(); }, []);

    /* ── Load entries — TASK 3: starred entries arrive first from backend ── */
    async function loadEntries() {
        try {
            const res = await getDiaryEntries();
            if (res.success) setEntries(res.entries || []);
        } catch (e) {
            console.error('Failed to load diary entries', e);
        } finally {
            setLoaded(true);
        }
    }

    /* ── Recording ── */
    async function startRecording() {
        setErrorMsg('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mr;
            chunksRef.current = [];
            mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mr.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                if (blob.size < 1000) { setErrorMsg('Recording too short. Please speak for a few seconds.'); return; }
                await submitAudio(blob);
            };
            mr.start();
            setIsRecording(true);
            setSeconds(0);
            timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
        } catch {
            setErrorMsg('Microphone access denied. Please allow mic permission.');
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
        setIsRecording(false);
        clearInterval(timerRef.current);
    }

    async function submitAudio(blob) {
        setIsProcessing(true);
        setErrorMsg('');
        try {
            const res = await recordDiary(blob);
            if (res.success) {
                /* TASK 1: language from Whisper (with forced-language fix) is now correct.
                   TASK 2: created_at now has UTC offset, timestamp will display in local IST. */
                setEntries(prev => {
                    const newEntry = {
                        id: res.id,
                        original_text: res.original_text,
                        language: res.language,
                        mood_score: res.mood_score,
                        emotion: res.emotion,
                        is_starred: false,
                        created_at: res.created_at,
                    };
                    // Keep starred entries at top
                    const starred = prev.filter(e => e.is_starred);
                    const unstarred = prev.filter(e => !e.is_starred);
                    return [...starred, newEntry, ...unstarred];
                });
            } else {
                setErrorMsg(res.error || 'Failed to process recording.');
            }
        } catch {
            setErrorMsg('Network error. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }

    /* ── TASK 3: Star toggle ── */
    async function handleStar(id) {
        try {
            const res = await starDiaryEntry(id);
            if (res.success) {
                setEntries(prev => {
                    const updated = prev.map(e =>
                        e.id === id ? { ...e, is_starred: res.is_starred } : e
                    );
                    // Re-sort: starred first, then by date desc
                    return [
                        ...updated.filter(e => e.is_starred).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
                        ...updated.filter(e => !e.is_starred).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
                    ];
                });
            }
        } catch { /* silent */ }
    }

    /* ── TASK 3: Delete ── */
    async function handleDelete(id) {
        if (!window.confirm('Delete this diary entry? This cannot be undone.')) return;
        try {
            const res = await deleteDiaryEntry(id);
            if (res.success) setEntries(prev => prev.filter(e => e.id !== id));
        } catch { /* silent */ }
    }

    function formatTimer(s) {
        return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    }

    function handleMicClick() {
        if (isProcessing) return;
        if (isRecording) stopRecording(); else startRecording();
    }

    return (
        <DashboardLayout role="patient" title={t.diary_title}>
            <style>{keyframes}</style>
            <div style={S.container}>
                {/* Header */}
                <div className="page-header">
                    <h2>📓 {t.diary_title}</h2>
                    <p>{t.diary_subtitle}</p>
                </div>

                {/* Error */}
                {errorMsg && (
                    <div style={S.errorBox}><span>⚠️</span> {errorMsg}</div>
                )}

                {/* Record section */}
                <div style={S.recordSection}>
                    {isProcessing ? (
                        <div style={S.processingOverlay}>
                            <div style={S.spinner} />
                            <div style={S.micLabel}>{t.diary_processing}</div>
                            <div style={S.micSub}>Transcribing &amp; detecting language — this may take a moment</div>
                        </div>
                    ) : (
                        <>
                            {isRecording && <div style={S.timer}>{formatTimer(seconds)}</div>}
                            <div style={S.micRing}>
                                {isRecording && <div style={S.pulseRing} />}
                                <button
                                    id="diary-mic-btn"
                                    style={S.micBtn(isRecording)}
                                    onClick={handleMicClick}
                                    title={isRecording ? t.diary_recording : t.diary_record_btn}
                                >
                                    {isRecording ? '⏹' : '🎤'}
                                </button>
                            </div>
                            <div style={S.micLabel}>
                                {isRecording ? t.diary_recording : t.diary_record_btn}
                            </div>
                            <div style={S.micSub}>
                                {t.diary_speak_hint}
                            </div>
                        </>
                    )}
                </div>

                {/* Entries */}
                {loaded && (
                    <>
                        {entries.length > 0 && (
                            <div style={S.sectionHeader}>
                                <div style={S.sectionTitle}>{t.diary_recent}</div>
                                <div style={S.entryCount}>
                                    {entries.filter(e => e.is_starred).length > 0 &&
                                        <span style={{ color: '#f59e0b', marginRight: 12 }}>
                                            ⭐ {entries.filter(e => e.is_starred).length} {t.diary_starred}
                                        </span>
                                    }
                                    {entries.length} {entries.length === 1 ? t.diary_entry : t.diary_entries}
                                </div>
                            </div>
                        )}

                        {entries.length === 0 ? (
                            <div style={S.emptyState}>
                                <div style={S.emptyIcon}>🎙️</div>
                                <div style={S.emptyTitle}>{t.diary_empty}</div>
                                <div style={S.emptySub}>{t.diary_speak_hint}</div>
                            </div>
                        ) : (
                            <div style={S.entryList}>
                                {entries.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="diary-entry-card"
                                        style={S.entryCard(entry.is_starred)}
                                    >
                                        {/* Header row */}
                                        <div style={S.entryHeader}>
                                            {/* TASK 2: Date & time now correct (UTC ISO → local IST) */}
                                            <div style={S.entryDate}>
                                                📅 {formatDiaryDate(entry.created_at)}{' '}
                                                {formatTime(entry.created_at)}
                                                {entry.is_starred && (
                                                    <span style={{ color: '#f59e0b', fontSize: 13 }}>·  ⭐ Starred</span>
                                                )}
                                            </div>

                                            <div style={S.headerRight}>
                                                {/* Language badge */}
                                                <div style={S.langBadge}>
                                                    {LANG_FLAG[entry.language] || '🌐'}{' '}
                                                    {LANG_MAP[entry.language] || entry.language}
                                                </div>

                                                {/* TASK 3: Star button */}
                                                <button
                                                    className="diary-star-btn"
                                                    style={S.starBtn(entry.is_starred)}
                                                    onClick={() => handleStar(entry.id)}
                                                    title={entry.is_starred ? 'Unstar' : 'Star this entry'}
                                                >
                                                    {entry.is_starred ? '⭐' : '☆'}
                                                </button>

                                                {/* TASK 3: Delete button */}
                                                <button
                                                    className="diary-del-btn"
                                                    style={S.deleteBtn}
                                                    onClick={() => handleDelete(entry.id)}
                                                    title="Delete entry"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {/* Original text (TASK 1: now correct language) */}
                                        <div style={S.entryText}>
                                            "{entry.original_text}"
                                        </div>

                                        {/* Emotion badge */}
                                        {entry.emotion && (
                                            <div style={S.emotionRow}>
                                                <div style={S.emotionBadge}>
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
