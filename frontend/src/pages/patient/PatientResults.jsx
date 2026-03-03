import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiFetch } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

// Mini bar chart
function BarChart({ data }) {
    const max = Math.max(...data.map(d => d.score), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 600 }}>{d.score}</div>
                    <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: d.risk === 'Low' ? 'var(--success)' : d.risk === 'Moderate' ? 'var(--warning)' : 'var(--danger)', height: `${(d.score / max) * 60}px`, minHeight: 4, transition: 'height .4s ease' }} />
                    <div style={{ fontSize: 9, color: 'var(--gray-400)', textAlign: 'center' }}>{d.date.slice(5)}</div>
                </div>
            ))}
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
            .then(d => { if (d.success) { setAssessments(d.assessments); if (d.assessments.length) setSelected(d.assessments[0]); } })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const chartData = assessments.slice(0, 8).reverse().map(a => ({ score: a.total_score, risk: a.risk_level, date: a.created_at }));

    return (
        <DashboardLayout role="patient" title="My Results">
            <div className="page-header">
                <h2>Assessment History</h2>
                <p>Track your cognitive health progress over time</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                    <div className="loader-ring" style={{ margin: '0 auto' }} />
                </div>
            ) : assessments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
                    <h3 style={{ fontWeight: 800, marginBottom: 8 }}>No Assessments Yet</h3>
                    <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>Complete your first AI dementia test to see results here.</p>
                    <a href="/patient/test" className="btn btn-primary">Take AI Test Now</a>
                </div>
            ) : (
                <>
                    {/* Chart */}
                    {chartData.length > 1 && (
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div className="card-header"><h3>Score Trend</h3></div>
                            <div className="card-body">
                                <BarChart data={chartData} />
                                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                                    {[['Low', 'var(--success)'], ['Moderate', 'var(--warning)'], ['High', 'var(--danger)']].map(([l, c]) => (
                                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                                            {l} Risk
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
                        {/* List */}
                        <div className="card" style={{ overflow: 'hidden' }}>
                            <div className="card-header" style={{ padding: '14px 18px' }}><h3>All Assessments</h3></div>
                            <div style={{ overflowY: 'auto', maxHeight: 500 }}>
                                {assessments.map(a => (
                                    <div key={a.id} onClick={() => setSelected(a)}
                                        style={{
                                            padding: '14px 18px', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer',
                                            background: selected?.id === a.id ? 'var(--primary-light)' : 'transparent',
                                            borderLeft: selected?.id === a.id ? '3px solid var(--primary)' : '3px solid transparent',
                                            transition: 'all .15s'
                                        }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: selected?.id === a.id ? 'var(--primary)' : 'var(--gray-700)' }}>Assessment #{a.id}</span>
                                            <RiskBadge level={a.risk_level} />
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{a.created_at}</div>
                                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>Score: {a.total_score}/30</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detail */}
                        {selected && (
                            <div className="card fade-in" key={selected.id}>
                                <div className="card-header">
                                    <h3>Assessment Detail #{selected.id}</h3>
                                    <RiskBadge level={selected.risk_level} />
                                </div>
                                <div className="card-body">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                        {[
                                            { label: 'Total Score', value: `${selected.total_score}/30`, color: 'var(--primary)' },
                                            { label: 'ML Prediction', value: selected.ml_prediction === 'dementia' ? '⚠ Positive' : '✔ Normal', color: selected.ml_prediction === 'dementia' ? 'var(--warning)' : 'var(--success)' },
                                            { label: 'Final Risk', value: selected.risk_level, color: selected.risk_level === 'Low' ? 'var(--success)' : selected.risk_level === 'Moderate' ? 'var(--warning)' : 'var(--danger)' },
                                            { label: 'Date', value: selected.created_at, color: 'var(--gray-700)' },
                                        ].map(item => (
                                            <div key={item.label} style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                                                <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <h4 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--gray-700)' }}>ML Voice Model</h4>
                                    <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>Dementia Probability</span>
                                            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{selected.ml_dementia_probability || 0}%</span>
                                        </div>
                                        <div className="progress"><div className="progress-bar red" style={{ width: `${selected.ml_dementia_probability || 0}%` }} /></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>Normal Probability</span>
                                            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{selected.ml_normal_probability || 0}%</span>
                                        </div>
                                        <div className="progress"><div className="progress-bar green" style={{ width: `${selected.ml_normal_probability || 0}%` }} /></div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/patient/test'}>New Test</button>
                                        <button className="btn btn-secondary btn-sm">Download PDF</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
