import DashboardLayout from '../../components/DashboardLayout';

const COMPLETIONS = [
    { patient: 'Maria Santos', risk: 'High', exercise: 'Memory Card Match', day: 'Monday', completedAt: '2026-03-02 09:14', week: 'Week 9' },
    { patient: 'Robert Chen', risk: 'Low', exercise: 'Word Chain', day: 'Monday', completedAt: '2026-03-02 10:30', week: 'Week 9' },
    { patient: 'James Wilson', risk: 'Moderate', exercise: 'Deep Breathing', day: 'Monday', completedAt: '2026-03-02 11:05', week: 'Week 9' },
    { patient: 'Fatima Al-Hassan', risk: 'Low', exercise: 'Puzzle Solving', day: 'Tuesday', completedAt: '2026-03-01 08:55', week: 'Week 9' },
    { patient: 'Thomas Müller', risk: 'High', exercise: 'Reading Aloud', day: 'Tuesday', completedAt: '2026-03-01 09:20', week: 'Week 9' },
    { patient: 'Priya Sharma', risk: 'Moderate', exercise: 'Math Exercises', day: 'Wednesday', completedAt: '2026-03-01 14:00', week: 'Week 9' },
    { patient: 'Maria Santos', risk: 'High', exercise: 'Storytelling', day: 'Thursday', completedAt: '2026-02-28 10:15', week: 'Week 8' },
];

const PATIENT_SUMMARY = [
    { name: 'Maria Santos', risk: 'High', assigned: 7, done: 3, pct: 43 },
    { name: 'James Wilson', risk: 'Moderate', assigned: 6, done: 4, pct: 67 },
    { name: 'Fatima Al-Hassan', risk: 'Low', assigned: 5, done: 5, pct: 100 },
    { name: 'Robert Chen', risk: 'Low', assigned: 5, done: 2, pct: 40 },
    { name: 'Priya Sharma', risk: 'Moderate', assigned: 7, done: 1, pct: 14 },
    { name: 'Thomas Müller', risk: 'High', assigned: 7, done: 2, pct: 29 },
];

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

export default function DoctorCompletions() {
    const totalCompleted = COMPLETIONS.length;
    const totalAssigned = PATIENT_SUMMARY.reduce((a, p) => a + p.assigned, 0);
    const overallPct = Math.round((PATIENT_SUMMARY.reduce((a, p) => a + p.done, 0) / totalAssigned) * 100);

    return (
        <DashboardLayout role="doctor" title="Completion Monitor">
            <div className="page-header">
                <h2>Exercise Completion Monitor</h2>
                <p>Track which patients have completed their assigned exercises</p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Completions', value: totalCompleted, color: 'var(--primary)', icon: '✅' },
                    { label: 'Overall Completion %', value: `${overallPct}%`, color: 'var(--success)', icon: '📊' },
                    { label: 'Patients On Track (≥50%)', value: PATIENT_SUMMARY.filter(p => p.pct >= 50).length, color: 'var(--teal)', icon: '🏃' },
                    { label: 'Need Attention (<30%)', value: PATIENT_SUMMARY.filter(p => p.pct < 30).length, color: 'var(--danger)', icon: '⚠️' },
                ].map(s => (
                    <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Per-patient completion */}
                <div className="card">
                    <div className="card-header"><h3>Patient Completion Rates</h3></div>
                    <div className="card-body">
                        {PATIENT_SUMMARY.map(p => (
                            <div key={p.name} style={{ marginBottom: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-pale)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                                            {p.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</span>
                                            <div style={{ marginTop: 1 }}><RiskBadge level={p.risk} /></div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontWeight: 800, fontSize: 16, color: p.pct >= 70 ? 'var(--success)' : p.pct >= 40 ? 'var(--warning)' : 'var(--danger)' }}>{p.pct}%</span>
                                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{p.done}/{p.assigned}</div>
                                    </div>
                                </div>
                                <div className="progress">
                                    <div className="progress-bar" style={{
                                        width: `${p.pct}%`,
                                        background: p.pct >= 70 ? 'var(--success)' : p.pct >= 40 ? 'var(--warning)' : 'var(--danger)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent completions */}
                <div className="card">
                    <div className="card-header"><h3>Recent Completions</h3><span className="badge badge-primary">This Week</span></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {COMPLETIONS.slice(0, 6).map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--gray-100)' }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                    ✅
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, fontSize: 13 }}>{c.patient}</p>
                                    <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>{c.exercise} · {c.day}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <RiskBadge level={c.risk} />
                                    <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{c.completedAt.split(' ')[1]}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Full log table */}
            <div className="card">
                <div className="card-header"><h3>Full Completion Log</h3></div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Risk Level</th>
                                <th>Exercise</th>
                                <th>Day</th>
                                <th>Week</th>
                                <th>Completed At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPLETIONS.map((c, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 700 }}>{c.patient}</td>
                                    <td><RiskBadge level={c.risk} /></td>
                                    <td>{c.exercise}</td>
                                    <td>{c.day}</td>
                                    <td><span className="badge badge-info">{c.week}</span></td>
                                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{c.completedAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
