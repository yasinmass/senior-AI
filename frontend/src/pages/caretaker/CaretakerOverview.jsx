import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorStats, getDoctorPatients, getCaretakerDiaryAlerts } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

export default function CaretakerOverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentSC, setRecentSC] = useState([]);
    const [patients, setPatients] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const sData = await getDoctorStats();
                const pData = await getDoctorPatients();
                const aData = await getCaretakerDiaryAlerts();
                if (sData.success) {
                    setStats(sData.stats);
                    setRecentSC(sData.recent_soul_connects || []);
                }
                if (pData.success) setPatients(pData.patients);
                if (aData.success) setAlerts(aData.alerts || []);
            } catch (err) {
                console.error("Dashboard failed to load data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return (
        <DashboardLayout role="caretaker" title="Caretaker Dashboard">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                <div className="loader-ring" />
            </div>
        </DashboardLayout>
    );

    const ctName = localStorage.getItem('doctor_name') || 'Caretaker';

    const statCards = [
        { label: 'Seniors Under Care', value: stats?.total_patients || 0, icon: '👥', color: 'var(--primary)', bg: 'var(--primary-pale)', change: 'Active profiles' },
        { label: 'High Risk Alert', value: stats?.high_risk || 0, icon: '🔴', color: 'var(--danger)', bg: 'var(--danger-light)', change: 'Needs attention' },
        { label: 'Moderate Risk', value: stats?.moderate_risk || 0, icon: '🟠', color: 'var(--warning)', bg: 'var(--warning-light)', change: 'Monitoring' },
        { label: 'Total Screenings', value: stats?.total_assessments || 0, icon: '📋', color: 'var(--primary)', bg: 'var(--primary-light)', change: 'All assessments' },
    ];

    const highRiskList = patients.filter(p => p.latest_assessment?.risk_level === 'High').slice(0, 4);
    const recentPatients = patients.slice(0, 8);

    return (
        <DashboardLayout role="caretaker" title="Dashboard">
            {/* Welcome Banner */}
            <div className="card" style={{ padding: '28px 32px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Caretaker Portal</div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>Welcome, {ctName}</h2>
                    <p style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>
                        SeniorMind AI · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-outline" onClick={() => navigate('/caretaker/seniors')} style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Senior Registry
                    </button>
                </div>
            </div>

            {/* Crisis Alerts Banner */}
            {alerts.length > 0 && (
                <div style={{ background: 'var(--danger)', color: '#fff', padding: '16px 24px', borderRadius: 12, marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ fontSize: 24 }}>⚠️</div>
                    <div>
                        <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Urgent: AI Diary Crisis Detected</h3>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>
                            {alerts.length} senior{alerts.length > 1 ? 's' : ''} triggered a crisis alert in their latest recordings.
                            <button onClick={() => navigate('/caretaker/diary-reports')} style={{ background: 'none', border: 'none', borderBottom: '1px solid #fff', color: '#fff', fontWeight: 700, marginLeft: 8, cursor: 'pointer' }}>View Reports</button>
                        </p>
                    </div>
                </div>
            )}

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
                {statCards.map(s => (
                    <div key={s.label} className="card" style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span style={{ fontSize: 22 }}>{s.icon}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', fontStyle: 'italic' }}>{s.change}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                {/* High risk alerts */}
                <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '16px 24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Senior Alerts</h3>
                        <span style={{ fontSize: 10, background: 'var(--danger-light)', color: 'var(--danger)', padding: '4px 8px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase' }}>{stats?.high_risk || 0} Critical</span>
                    </div>
                    {highRiskList.length > 0 ? highRiskList.map(p => (
                        <div key={p.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', transition: 'background 0.2s' }}
                            onClick={() => navigate(`/caretaker/senior/${p.id}`)}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                                {p.name[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>
                                    Score: {p.latest_assessment?.total_score}/30 · {p.latest_assessment?.created_at}
                                </div>
                            </div>
                            <RiskBadge level="High" />
                        </div>
                    )) : (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14, fontStyle: 'italic' }}>
                            No high-risk alerts at this time.
                        </div>
                    )}
                    <div style={{ padding: 14, background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)', textAlign: 'center' }}>
                        <button onClick={() => navigate('/caretaker/seniors')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            View All Seniors
                        </button>
                    </div>
                </div>

                {/* Recent Soul Connects */}
                <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '16px 24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🤝 Recent Soul Connects</h3>
                    </div>
                    {recentSC.length > 0 ? (
                        <div>
                            {recentSC.map(sc => (
                                <div key={sc.id}
                                    style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => navigate(`/caretaker/senior/${sc.patient_id}`)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-800)' }}>{sc.patient_name}</div>
                                        <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 500 }}>{sc.created_at}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 10 }}>
                                        <div style={{ fontSize: 10, color: 'var(--gray-500)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sc.q1_answer}>"{sc.q1_answer}"</div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: sc.q2_answer === 'Yes' ? 'var(--success)' : 'var(--danger)' }}><span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>Ate:</span> {sc.q2_answer || '-'}</div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: sc.q3_answer === 'Yes' ? 'var(--success)' : 'var(--danger)' }}><span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>Exer:</span> {sc.q3_answer || '-'}</div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: sc.q4_answer === 'Yes' ? 'var(--success)' : 'var(--danger)' }}><span style={{ color: 'var(--gray-400)', fontWeight: 600 }}>Slept:</span> {sc.q4_answer || '-'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)', fontSize: 12, fontStyle: 'italic' }}>
                            No recent check-ins. Senior feedback will appear here.
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Directory Table */}
            <div className="card" style={{ marginTop: 28, overflow: 'hidden', padding: 0 }}>
                <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Senior Registry</h3>
                    <button onClick={() => navigate('/caretaker/seniors')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: 12, fontWeight: 700 }}>
                        Full Directory →
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Profile</th>
                                <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Age</th>
                                <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Risk</th>
                                <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Score</th>
                                <th style={{ padding: '14px 28px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPatients.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => navigate(`/caretaker/senior/${p.id}`)}
                                >
                                    <td style={{ padding: '14px 28px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gray-100)', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                                                {p.name[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>{p.name}</div>
                                                <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 500 }}>{p.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 28px', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>{p.age || '—'} yrs</td>
                                    <td style={{ padding: '14px 28px' }}>
                                        {p.latest_assessment ? <RiskBadge level={p.latest_assessment.risk_level} /> : <span style={{ fontSize: 9, color: 'var(--gray-300)', fontWeight: 700 }}>—</span>}
                                    </td>
                                    <td style={{ padding: '14px 28px', fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>
                                        {p.latest_assessment ? <><span style={{ color: 'var(--primary)' }}>{p.latest_assessment.total_score}</span><span style={{ color: 'var(--gray-300)', fontSize: 10 }}>/30</span></> : '—'}
                                    </td>
                                    <td style={{ padding: '14px 28px', textAlign: 'right' }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>View →</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
