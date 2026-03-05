import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiFetch } from '../../utils/api';

function RiskBadge({ level }) {
    const styles = {
        Low: { bg: '#E3F7E6', color: '#2D7A36', border: '#6BCB77' },
        Moderate: { bg: '#FFF6E5', color: '#8B6914', border: '#F0AD4E' },
        High: { bg: '#FDEAEA', color: '#C0392B', border: '#E74C3C' },
    };
    const s = styles[level] || styles.Low;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 14px', borderRadius: 20,
            background: s.bg, color: s.color,
            fontSize: 13, fontWeight: 600,
            border: `1px solid ${s.border}20`,
        }}>
            {level === 'Low' && '✅'} {level === 'Moderate' && '⚠️'} {level === 'High' && '🚨'} {level} Risk
        </span>
    );
}

// Simple bar chart component
function ScoreBar({ label, score, max, color }) {
    const pct = Math.round((score / max) * 100);
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#4A5D6F' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: color }}>{score}/{max}</span>
            </div>
            <div style={{ height: 10, background: '#E2E7ED', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: color,
                    borderRadius: 100,
                    transition: 'width 0.8s ease',
                }} />
            </div>
        </div>
    );
}

export default function PatientResults() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        apiFetch('/assessment/history/')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setAssessments(d.assessments);
                    if (d.assessments.length) setSelected(d.assessments[0]);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const getClassification = (score) => {
        const pct = Math.round((score / 30) * 100);
        if (pct >= 85) return {
            text: 'Low Risk — Normal Cognitive Health',
            color: '#6BCB77', bgColor: '#E3F7E6',
            desc: 'Your cognitive health is within the normal range. Continue with healthy habits and regular monitoring.',
            level: 'Low'
        };
        if (pct >= 40) return {
            text: 'Moderate Risk — Monitoring Recommended',
            color: '#F0AD4E', bgColor: '#FFF6E5',
            desc: 'Some indicators suggest monitoring is advisable. We recommend a professional follow-up for detailed clinical review.',
            level: 'Moderate'
        };
        return {
            text: 'High Risk — Professional Evaluation Needed',
            color: '#E74C3C', bgColor: '#FDEAEA',
            desc: 'Significant cognitive indicators detected. Professional medical evaluation is strongly recommended.',
            level: 'High'
        };
    };

    if (loading) return (
        <DashboardLayout role="patient" title="My Reports">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
                <div className="loader-ring" />
            </div>
        </DashboardLayout>
    );

    if (assessments.length === 0) return (
        <DashboardLayout role="patient" title="My Reports">
            <div style={{
                maxWidth: 500, margin: '60px auto',
                background: '#fff', borderRadius: 16,
                padding: 48, textAlign: 'center',
                border: '1px solid #E2E7ED',
                boxShadow: '0 4px 16px rgba(42,111,151,0.08)'
            }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D', marginBottom: 8 }}>No Assessment Found</h3>
                <p style={{ fontSize: 15, color: '#6B7D8F', marginBottom: 24, lineHeight: 1.6 }}>
                    Complete a screening test to view your cognitive health results here.
                </p>
                <button
                    className="btn btn-primary btn-lg"
                    onClick={() => window.location.href = '/patient/test'}
                >
                    Start Assessment
                </button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="patient" title="My Reports">
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2F3D' }}>Clinical Report</h2>
                        <p style={{ fontSize: 15, color: '#6B7D8F', marginTop: 4 }}>Review your cognitive health assessment results.</p>
                    </div>
                    {assessments.length > 1 && (
                        <select
                            style={{
                                background: '#fff', border: '2px solid #E2E7ED',
                                padding: '10px 16px', borderRadius: 10,
                                fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                                color: '#1F2F3D', outline: 'none', cursor: 'pointer',
                            }}
                            value={selected?.id || ''}
                            onChange={(e) => setSelected(assessments.find(a => a.id === parseInt(e.target.value)))}
                        >
                            {assessments.map(a => (
                                <option key={a.id} value={a.id}>Assessment #{a.id} — {a.created_at}</option>
                            ))}
                        </select>
                    )}
                </div>

                {selected && (() => {
                    const riskLevel = selected.risk_level || 'Low';
                    const riskStyles = {
                        Low: { text: 'Low Risk — Normal Cognitive Health', color: '#6BCB77', bgColor: '#E3F7E6', desc: 'Your cognitive health is within the normal range. Continue with healthy habits and regular monitoring.' },
                        Moderate: { text: 'Moderate Risk — Monitoring Recommended', color: '#F0AD4E', bgColor: '#FFF6E5', desc: 'Some indicators suggest monitoring is advisable. We recommend a professional follow-up for detailed clinical review.' },
                        High: { text: 'High Risk — Professional Evaluation Needed', color: '#E74C3C', bgColor: '#FDEAEA', desc: 'Significant cognitive indicators detected. Professional medical evaluation is strongly recommended.' },
                    };
                    const c = { ...riskStyles[riskLevel], level: riskLevel };
                    const pct = Math.round((selected.total_score / 30) * 100);

                    return (
                        <div className="fade-in" style={{ marginBottom: 24 }}>
                            {/* Main Result Card */}
                            <div style={{
                                background: '#fff', borderRadius: 16,
                                border: '1px solid #E2E7ED',
                                boxShadow: '0 4px 20px rgba(42,111,151,0.08)',
                                overflow: 'hidden', marginBottom: 20,
                            }} id="printable-report">
                                {/* Result Header */}
                                <div style={{
                                    background: c.bgColor,
                                    borderBottom: `3px solid ${c.color}`,
                                    padding: '32px 36px',
                                    display: 'flex', alignItems: 'center', gap: 24,
                                    flexWrap: 'wrap',
                                }}>
                                    <div style={{
                                        width: 80, height: 80,
                                        borderRadius: '50%',
                                        background: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 4px 16px ${c.color}30`,
                                        flexShrink: 0,
                                    }}>
                                        <span style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{pct}%</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <RiskBadge level={c.level} />
                                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D', marginTop: 8 }}>{c.text}</h3>
                                        <p style={{ fontSize: 15, color: '#6B7D8F', marginTop: 4, lineHeight: 1.6 }}>{c.desc}</p>
                                    </div>
                                </div>

                                {/* Score Details */}
                                <div style={{ padding: '32px 36px' }}>
                                    {/* Score Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                                        {[
                                            { label: 'Total Score', value: `${selected.total_score}/30`, color: '#2A6F97', bg: '#E8F1F8' },
                                            { label: 'AI Prediction', value: selected.ml_prediction === 'dementia' ? 'Concern' : 'Normal', color: selected.ml_prediction === 'dementia' ? '#E74C3C' : '#6BCB77', bg: selected.ml_prediction === 'dementia' ? '#FDEAEA' : '#E3F7E6' },
                                            { label: 'Memory', value: `${selected.memory_score}/10`, color: '#3A8FBF', bg: '#E0F0FA' },
                                            { label: 'Executive', value: `${selected.executive_score}/10`, color: '#2A6F97', bg: '#E8F1F8' },
                                        ].map((s, i) => (
                                            <div key={i} style={{
                                                background: s.bg, borderRadius: 12,
                                                padding: '20px', textAlign: 'center',
                                            }}>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B5', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{s.label}</p>
                                                <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bar Chart Visualization */}
                                    <div style={{ background: '#F4F6F9', borderRadius: 12, padding: 24, marginBottom: 28 }}>
                                        <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1F2F3D', marginBottom: 16 }}>Score Breakdown</h4>
                                        <ScoreBar label="Orientation" score={selected.orientation_score || 0} max={10} color="#2A6F97" />
                                        <ScoreBar label="Memory" score={selected.memory_score || 0} max={10} color="#3A8FBF" />
                                        <ScoreBar label="Executive Function" score={selected.executive_score || 0} max={10} color="#6BCB77" />
                                    </div>

                                    {/* Patient Info */}
                                    <div style={{
                                        background: '#E8F1F8', borderRadius: 12,
                                        padding: 24, marginBottom: 28,
                                        border: '1px solid #D0E4F0',
                                    }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#2A6F97', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Patient Information</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                                            <div>
                                                <p style={{ fontSize: 12, color: '#94A3B5', fontWeight: 500 }}>Patient Name</p>
                                                <p style={{ fontSize: 15, fontWeight: 600, color: '#1F2F3D' }}>{sessionStorage.getItem('patient_name')}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 12, color: '#94A3B5', fontWeight: 500 }}>Email</p>
                                                <p style={{ fontSize: 15, fontWeight: 600, color: '#2A6F97' }}>{sessionStorage.getItem('patient_email')}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 12, color: '#94A3B5', fontWeight: 500 }}>Assessment Date</p>
                                                <p style={{ fontSize: 15, fontWeight: 600, color: '#1F2F3D' }}>{selected.created_at}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sync Confirmation */}
                                    <div style={{
                                        background: '#E3F7E6', borderRadius: 12,
                                        padding: '16px 20px',
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        border: '1px solid #B8E6BF',
                                        marginBottom: 28,
                                    }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: '#6BCB77', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: 16, flexShrink: 0,
                                        }}>✓</div>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#2D7A36' }}>
                                            Your clinical report has been securely saved to your medical portal.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <button className="btn btn-primary" style={{ padding: '16px 0', borderRadius: 10, fontSize: 15 }} onClick={() => window.print()}>
                                            📄 Download PDF Report
                                        </button>
                                        <button className="btn btn-secondary" style={{ padding: '16px 0', borderRadius: 10, fontSize: 15 }} onClick={() => window.location.href = '/patient/test'}>
                                            🔄 Take New Test
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div style={{
                                background: '#F4F6F9',
                                borderRadius: 12,
                                padding: '16px 20px',
                                border: '1px solid #E2E7ED',
                            }} className="no-print">
                                <p style={{ fontSize: 13, color: '#94A3B5', fontStyle: 'italic', lineHeight: 1.6 }}>
                                    ⚕️ Medical Disclaimer: This report is generated by a screening tool. It is not a definitive medical diagnosis. Please consult a qualified medical professional for a complete clinical evaluation.
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </DashboardLayout>
    );
}
