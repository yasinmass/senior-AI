import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getCaretakerDiaryReports } from '../../utils/api';

export default function CaretakerDiaryReports() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReports() {
            setLoading(true);
            try {
                const res = await getCaretakerDiaryReports();
                if (res.success) {
                    setReports(res.patients || []);
                }
            } catch (err) {
                console.error("Failed to fetch diary reports:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    }, []);

    const getScoreColor = (score) => {
        if (!score) return 'var(--gray-300)';
        if (score >= 7) return 'var(--success)';
        if (score >= 4) return 'var(--warning)';
        return 'var(--danger)';
    };

    const getEmotionEmoji = (emotion) => {
        switch (emotion?.toLowerCase()) {
            case 'joy': return '😊';
            case 'sadness': return '😢';
            case 'anger': return '😠';
            case 'fear': return '😨';
            case 'disgust': return '🤢';
            case 'surprise': return '😲';
            default: return '😐';
        }
    };

    if (loading) return (
        <DashboardLayout role="caretaker" title="Diary Reports">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                <div className="loader-ring" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="caretaker" title="Diary Reports">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--gray-200)', paddingBottom: 16, marginBottom: 28 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>Senior Voice Diaries</h2>
                    <p style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500, fontStyle: 'italic' }}>AI-powered emotional analysis of senior voice recordings.</p>
                </div>
            </div>

            {reports.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)', fontStyle: 'italic' }}>
                    No diary entries found for your assigned seniors.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {reports.map((patient) => (
                        <div key={patient.patient_id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                            {/* Patient Header */}
                            <div style={{ padding: '16px 24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                                        {patient.patient_name[0]}
                                    </div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-800)' }}>{patient.patient_name}</h3>
                                </div>

                                {/* Weekly Summary Tag */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {patient.weekly_summary.crisis_count > 0 && (
                                        <span style={{ fontSize: 11, background: 'var(--danger-light)', color: 'var(--danger)', padding: '6px 12px', borderRadius: 8, fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            ⚠️ Action Required
                                        </span>
                                    )}
                                    <span style={{ fontSize: 11, background: 'var(--gray-200)', color: 'var(--gray-600)', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                                        Avg Mood: {patient.weekly_summary.average_mood}/10
                                    </span>
                                </div>
                            </div>

                            {/* Crisis Banner */}
                            {patient.weekly_summary.crisis_count > 0 && (
                                <div style={{ padding: '14px 20px', background: 'var(--danger)', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <span style={{ fontSize: 18 }}>⚠️</span>
                                    <p>Crisis detected in recent diary entries. Please check on senior immediately and contact doctor.</p>
                                </div>
                            )}

                            {/* Diary Entries Feed */}
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {patient.entries.length > 0 ? patient.entries.map((entry) => (
                                    <div key={entry.id} style={{
                                        padding: '16px 20px',
                                        borderRadius: 12,
                                        border: `1px solid ${entry.crisis_flag ? 'var(--danger)' : 'var(--gray-200)'}`,
                                        background: entry.crisis_flag ? 'var(--danger-pale)' : '#fff',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)' }}>📅 {entry.date}</span>
                                            <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 700 }}>
                                                <span style={{ color: getScoreColor(entry.mood_score) }}>
                                                    📊 Score: {entry.mood_score || 'N/A'}/10
                                                </span>
                                                <span style={{ color: 'var(--gray-600)' }}>
                                                    {getEmotionEmoji(entry.emotion)} Emotion: <span style={{ textTransform: 'capitalize' }}>{entry.emotion}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: 14, color: 'var(--gray-800)', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>
                                            "{entry.original_text}"
                                        </p>

                                        {entry.language !== 'en' && entry.english_text && (
                                            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8, borderLeft: '2px solid var(--gray-300)', paddingLeft: 12 }}>
                                                <span style={{ fontWeight: 600, display: 'block', marginBottom: 2 }}>English Translation:</span>
                                                {entry.english_text}
                                            </p>
                                        )}

                                        {entry.crisis_flag && (
                                            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--danger)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                ⚠️ CRISIS FLAG TRIGGERED
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 12, fontStyle: 'italic' }}>
                                        No recent entries recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
