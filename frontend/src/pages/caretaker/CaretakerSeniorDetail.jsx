import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatientDetail } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level} Risk</span>;
}

export default function CaretakerSeniorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [soulConnections, setSoulConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const data = await getDoctorPatientDetail(id);
                if (data.success) {
                    setPatient(data.patient);
                    setAssessments(data.assessments);
                    const sc = data.soul_connections || [];
                    console.log('[DEBUG caretaker] soul_connections:', sc);
                    setSoulConnections(sc);
                } else {
                    console.error('[DEBUG caretaker] API error:', data);
                }
            } catch (err) {
                console.error("Failed to load senior detail:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    if (loading) return (
        <DashboardLayout role="caretaker" title="Loading...">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                <div className="loader-ring" />
            </div>
        </DashboardLayout>
    );

    if (!patient) return (
        <DashboardLayout role="caretaker" title="Not Found">
            <div style={{ padding: 80, textAlign: 'center' }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-400)', marginBottom: 16 }}>Senior Not Found</h3>
                <button className="btn btn-primary" onClick={() => navigate('/caretaker/seniors')}>Back to Registry</button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="caretaker" title="Senior Profile">
            {/* Back + ID */}
            <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: 14, fontWeight: 500 }}>← Back</button>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Senior ID: {id}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 28, marginBottom: 32 }}>
                {/* Profile Card */}
                <div className="card" style={{ padding: 28, textAlign: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26, margin: '0 auto 14px' }}>
                        {patient.name[0]}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>{patient.name}</h2>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>{patient.email}</p>

                    <div style={{ textAlign: 'left', borderTop: '1px solid var(--gray-100)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Age</p>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>{patient.age || '—'} yrs</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Total Assessments</p>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-700)' }}>{assessments.length}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Latest Summary */}
                    <div style={{ background: 'var(--gray-800)', color: '#fff', padding: 28, borderRadius: 12 }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Latest Diagnostic Summary</h3>
                        {assessments.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                                <div>
                                    <p style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 6 }}>Risk Level</p>
                                    <RiskBadge level={assessments[0].risk_level} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 6 }}>MoCA Score</p>
                                    <p style={{ fontSize: 24, fontWeight: 700 }}>{assessments[0].total_score}/30</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 10, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 6 }}>ML Prediction</p>
                                    <p style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }}>{assessments[0].ml_prediction}</p>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--gray-400)', fontSize: 14, fontStyle: 'italic' }}>No assessment data found for this senior.</p>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="card" style={{ padding: 20 }}>
                            <h4 style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 14 }}>Adherence & Activities</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Exercises Completed</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{patient.adherence?.completed_count || 0}</span>
                            </div>
                            <button
                                onClick={() => navigate('/caretaker/schedule')}
                                className="btn btn-outline"
                                style={{ width: '100%', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 16px', borderRadius: 8 }}
                            >
                                View Schedule
                            </button>
                        </div>
                        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 10, borderStyle: 'dashed' }}>
                            <span style={{ fontSize: 28 }}>💬</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message Senior</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: 32 }}>
                <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--gray-200)' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assessment History</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Date</th>
                                <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Breakdown</th>
                                <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Prediction</th>
                                <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Total</th>
                                <th style={{ padding: '14px 28px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Risk</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                    <td style={{ padding: '14px 28px' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-800)' }}>{a.created_at}</div>
                                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>ID: {a.id}</div>
                                    </td>
                                    <td style={{ padding: '14px 28px' }}>
                                        <div style={{ fontSize: 10, color: 'var(--gray-500)', display: 'flex', gap: 10, fontWeight: 500 }}>
                                            <span>M: {a.memory_score}</span>
                                            <span>O: {a.orientation_score}</span>
                                            <span>E: {a.executive_score}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 28px' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-600)' }}>{a.ml_prediction}</div>
                                        <div style={{ fontSize: 9, color: 'var(--gray-400)' }}>Prob: {(a.ml_dementia_probability * 100).toFixed(1)}%</div>
                                    </td>
                                    <td style={{ padding: '14px 28px', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                                        {a.total_score}/30
                                    </td>
                                    <td style={{ padding: '14px 28px', textAlign: 'right' }}>
                                        <RiskBadge level={a.risk_level} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Soul Connect History */}
            <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: 32 }}>
                <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🤝 Soul Connect — Daily Check-In</h3>
                    <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>{soulConnections.length} session(s)</span>
                </div>
                {soulConnections.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>🤝</div>
                        <p style={{ fontSize: 13, color: 'var(--gray-400)', fontStyle: 'italic' }}>No daily check-in responses yet. They will appear here once the senior completes a Soul Connect session.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                    <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Date</th>
                                    <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>How is your day?</th>
                                    <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Ate well?</th>
                                    <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Exercised?</th>
                                    <th style={{ padding: '14px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Slept well?</th>
                                </tr>
                            </thead>
                            <tbody>
                                {soulConnections.map(sc => (
                                    <tr key={sc.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                        <td style={{ padding: '14px 20px' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-800)' }}>{sc.created_at}</div>
                                            <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{sc.language === 'ta' ? 'Tamil' : 'English'}</div>
                                        </td>
                                        <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--gray-700)' }}>{sc.q1_answer || '—'}</td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: sc.q2_answer === 'Yes' ? '#16a34a' : '#dc2626' }}>{sc.q2_answer || '—'}</span>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: sc.q3_answer === 'Yes' ? '#16a34a' : '#dc2626' }}>{sc.q3_answer || '—'}</span>
                                        </td>
                                        <td style={{ padding: '14px 20px' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: sc.q4_answer === 'Yes' ? '#16a34a' : '#dc2626' }}>{sc.q4_answer || '—'}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
