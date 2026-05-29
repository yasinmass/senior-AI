import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiFetch } from '../../utils/api';

function RiskBadge({ level }) {
    const map = {
        Low: { bg: '#E3F7E6', color: '#2D7A36', label: '✅ Low Risk' },
        Moderate: { bg: '#FFF6E5', color: '#8B6914', label: '⚠️ Moderate Risk' },
        High: { bg: '#FDEAEA', color: '#C0392B', label: '🚨 High Risk' },
    };
    const s = map[level] || map.Low;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 14px', borderRadius: 20,
            background: s.bg, color: s.color,
            fontSize: 13, fontWeight: 600,
        }}>{s.label}</span>
    );
}

function ScoreBar({ label, score, max, color }) {
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#4A5D6F' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color }}>{score}/{max}</span>
            </div>
            <div style={{ height: 10, background: '#E2E7ED', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 100, transition: 'width 0.8s ease' }} />
            </div>
        </div>
    );
}

const RISK_STYLES = {
    Low: { color: '#6BCB77', bgColor: '#E3F7E6', text: 'Low Risk — Normal Cognitive Health', desc: 'Cognitive health is within the normal range. Continue with healthy habits and regular monitoring.' },
    Moderate: { color: '#F0AD4E', bgColor: '#FFF6E5', text: 'Moderate Risk — Monitoring Recommended', desc: 'Some indicators suggest monitoring is advisable. A professional follow-up is recommended for detailed clinical review.' },
    High: { color: '#E74C3C', bgColor: '#FDEAEA', text: 'High Risk — Professional Evaluation Needed', desc: 'Significant cognitive indicators detected. Professional medical evaluation is strongly recommended.' },
};

function ClinicalReport({ assessment, seniorName, seniorEmail }) {
    const riskLevel = assessment.risk_level || 'Low';
    const c = { ...RISK_STYLES[riskLevel], level: riskLevel };
    const pct = Math.round((assessment.total_score / 30) * 100);

    return (
        <div className="fade-in" style={{ marginBottom: 24 }}>
            <div style={{
                background: '#fff', borderRadius: 16,
                border: '1px solid #E2E7ED',
                boxShadow: '0 4px 20px rgba(42,111,151,0.08)',
                overflow: 'hidden', marginBottom: 20,
            }}>
                {/* Risk Header */}
                <div style={{
                    background: c.bgColor,
                    borderBottom: `3px solid ${c.color}`,
                    padding: '32px 36px',
                    display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', background: '#fff', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 16px ${c.color}30`,
                    }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{pct}%</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <RiskBadge level={riskLevel} />
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D', marginTop: 8 }}>{c.text}</h3>
                        <p style={{ fontSize: 15, color: '#6B7D8F', marginTop: 4, lineHeight: 1.6 }}>{c.desc}</p>
                    </div>
                </div>

                <div style={{ padding: '32px 36px' }}>
                    {/* Score Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                        {[
                            { label: 'Total Score', value: `${assessment.total_score}/30`, color: '#2A6F97', bg: '#E8F1F8' },
                            { label: 'AI Prediction', value: assessment.ml_prediction === 'dementia' ? 'Concern' : 'Normal', color: assessment.ml_prediction === 'dementia' ? '#E74C3C' : '#6BCB77', bg: assessment.ml_prediction === 'dementia' ? '#FDEAEA' : '#E3F7E6' },
                            { label: 'Memory', value: `${assessment.memory_score}/10`, color: '#3A8FBF', bg: '#E0F0FA' },
                            { label: 'Executive', value: `${assessment.executive_score}/10`, color: '#2A6F97', bg: '#E8F1F8' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: s.bg, borderRadius: 12, padding: '20px', textAlign: 'center' }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{s.label}</p>
                                <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Score Bars */}
                    <div style={{ background: '#F4F6F9', borderRadius: 12, padding: 24, marginBottom: 28 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1F2F3D', marginBottom: 16 }}>Score Breakdown</h4>
                        <ScoreBar label="Orientation" score={assessment.orientation_score || 0} max={10} color="#2A6F97" />
                        <ScoreBar label="Memory" score={assessment.memory_score || 0} max={10} color="#3A8FBF" />
                        <ScoreBar label="Executive Function" score={assessment.executive_score || 0} max={10} color="#6BCB77" />
                    </div>

                    {/* Patient Info */}
                    <div style={{ background: '#E8F1F8', borderRadius: 12, padding: 24, marginBottom: 28, border: '1px solid #D0E4F0' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#2A6F97', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Patient Information</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                            <div>
                                <p style={{ fontSize: 12, color: '#94A3B5', fontWeight: 500 }}>Patient Name</p>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#1F2F3D' }}>{seniorName}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: '#94A3B5', fontWeight: 500 }}>Email</p>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#2A6F97' }}>{seniorEmail || '—'}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: '#94A3B5', fontWeight: 500 }}>Assessment Date</p>
                                <p style={{ fontSize: 15, fontWeight: 600, color: '#1F2F3D' }}>{assessment.created_at}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sync Confirmation */}
                    <div style={{ background: '#E3F7E6', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #B8E6BF', marginBottom: 28 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6BCB77', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>✓</div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#2D7A36' }}>This clinical report has been securely recorded in the medical portal.</p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button className="btn btn-primary" style={{ padding: '16px 0', borderRadius: 10, fontSize: 15 }} onClick={() => window.print()}>
                            📄 Download PDF Report
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '16px 0', borderRadius: 10, fontSize: 15 }} onClick={() => window.location.href = '/caretaker/seniors'}>
                            👥 View Senior Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{ background: '#F4F6F9', borderRadius: 12, padding: '16px 20px', border: '1px solid #E2E7ED' }}>
                <p style={{ fontSize: 13, color: '#94A3B5', fontStyle: 'italic', lineHeight: 1.6 }}>
                    ⚕️ Medical Disclaimer: This report is generated by a screening tool. It is not a definitive medical diagnosis. Please consult a qualified medical professional for a complete clinical evaluation.
                </p>
            </div>
        </div>
    );
}

export default function CaretakerScreeningReports() {
    const [seniors, setSeniors] = useState([]);
    const [selected, setSelected] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [activeAssessment, setActiveAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        // Caretaker uses the same doctor patients endpoint
        apiFetch('/doctor/patients/')
            .then(r => r.json())
            .then(d => { if (d.success) setSeniors(d.patients || []); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    function loadAssessments(seniorId) {
        setLoadingDetail(true);
        setAssessments([]);
        setActiveAssessment(null);
        apiFetch(`/doctor/patient/${seniorId}/`)
            .then(r => r.json())
            .then(d => {
                if (d.success && d.assessments?.length) {
                    setAssessments(d.assessments);
                    setActiveAssessment(d.assessments[0]);
                }
            })
            .catch(() => { })
            .finally(() => setLoadingDetail(false));
    }

    function handleSelectSenior(s) {
        setSelected(s);
        loadAssessments(s.id);
    }

    return (
        <DashboardLayout role="caretaker" title="AI Screening Reports">
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>

                {/* ── Senior List Panel ── */}
                <div style={{
                    background: '#fff', borderRadius: 16,
                    border: '1px solid #E2E7ED',
                    boxShadow: '0 2px 12px rgba(42,111,151,0.06)',
                    overflow: 'hidden', position: 'sticky', top: 24,
                }}>
                    <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #F0F2F5' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1F2F3D' }}>🧠 Screening Reports</h3>
                        <p style={{ fontSize: 12, color: '#94A3B5', marginTop: 3 }}>Select a senior to view their AI screening results</p>
                    </div>
                    <div style={{ padding: '10px 12px', maxHeight: '70vh', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B5', fontSize: 13 }}>Loading seniors…</div>
                        ) : seniors.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B5', fontSize: 13 }}>No seniors assigned yet.</div>
                        ) : seniors.map(s => (
                            <button key={s.id} onClick={() => handleSelectSenior(s)} style={{
                                width: '100%', textAlign: 'left',
                                padding: '11px 12px', borderRadius: 10,
                                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                background: selected?.id === s.id ? '#EBF4FB' : 'transparent',
                                borderLeft: selected?.id === s.id ? '3px solid #2A6F97' : '3px solid transparent',
                                transition: 'all 0.15s', marginBottom: 2,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                        background: selected?.id === s.id ? '#2A6F97' : '#E8F1F8',
                                        color: selected?.id === s.id ? '#fff' : '#2A6F97',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 700,
                                    }}>{(s.name || s.username || 'S')[0].toUpperCase()}</div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1F2F3D', margin: 0 }}>{s.name || s.username}</p>
                                        <p style={{ fontSize: 11, color: '#94A3B5', margin: 0 }}>{s.email || ''}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Report Detail Panel ── */}
                <div>
                    {!selected ? (
                        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E7ED', padding: '80px 40px', textAlign: 'center' }}>
                            <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1F2F3D', marginBottom: 8 }}>Select a Senior</h3>
                            <p style={{ fontSize: 15, color: '#6B7D8F' }}>Choose a senior from the left panel to view their AI screening report.</p>
                        </div>
                    ) : loadingDetail ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
                            <div className="loader-ring" />
                        </div>
                    ) : assessments.length === 0 ? (
                        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E7ED', padding: '60px 40px', textAlign: 'center' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1F2F3D', marginBottom: 8 }}>No Screening Data</h3>
                            <p style={{ fontSize: 15, color: '#6B7D8F' }}>{selected.name || selected.username} has not completed any AI screening tests yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header + assessment picker */}
                            <div style={{
                                background: '#fff', borderRadius: 16, border: '1px solid #E2E7ED',
                                padding: '18px 24px', marginBottom: 20,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                            }}>
                                <div>
                                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D' }}>Clinical Report</h2>
                                    <p style={{ fontSize: 14, color: '#6B7D8F', marginTop: 3 }}>
                                        Review {selected.name || selected.username}'s cognitive health assessment results.
                                    </p>
                                </div>
                                {assessments.length > 1 && (
                                    <select
                                        value={activeAssessment?.id || ''}
                                        onChange={e => setActiveAssessment(assessments.find(a => a.id === parseInt(e.target.value)))}
                                        style={{
                                            background: '#fff', border: '2px solid #E2E7ED',
                                            padding: '10px 16px', borderRadius: 10,
                                            fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                                            color: '#1F2F3D', outline: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        {assessments.map(a => (
                                            <option key={a.id} value={a.id}>Assessment #{a.id} — {a.created_at}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {activeAssessment && (
                                <ClinicalReport
                                    assessment={activeAssessment}
                                    seniorName={selected.name || selected.username}
                                    seniorEmail={selected.email}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
