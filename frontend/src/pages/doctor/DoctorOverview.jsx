import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorStats, getDoctorPatients, getCaretakerDiaryAlerts } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

export default function DoctorOverview() {
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
        <DashboardLayout role="doctor" title="Doctor Dashboard">
            <div className="flex items-center justify-center p-20">
                <div className="spin text-teal-600 text-4xl">⟳</div>
            </div>
        </DashboardLayout>
    );

    const docName = localStorage.getItem('doctor_name') || 'Medical Professional';

    const statCards = [
        { label: 'Total Patients', value: stats?.total_patients || 0, icon: '👥', color: 'var(--primary)', bg: 'var(--primary-pale)', change: 'Active database' },
        { label: 'High Risk Alert', value: stats?.high_risk || 0, icon: '🔴', color: 'var(--danger)', bg: 'var(--danger-light)', change: 'Needs attention' },
        { label: 'Moderate Risk', value: stats?.moderate_risk || 0, icon: '🟠', color: 'var(--warning)', bg: 'var(--warning-light)', change: 'Monitoring required' },
        { label: 'Total Assessments', value: stats?.total_assessments || 0, icon: '📋', color: 'var(--teal)', bg: 'var(--teal-light)', change: 'System wide' },
    ];

    const highRiskShortlist = patients.filter(p => p.latest_assessment?.risk_level === 'High').slice(0, 4);

    return (
        <DashboardLayout role="doctor" title="Clinical Overview">
            {/* Welcome Banner */}
            <div className="fade-in mb-8 p-8 border border-gray-200 bg-white rounded-lg shadow-sm flex justify-between items-center">
                <div>
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Clinical Portal</h5>
                    <h2 className="text-2xl font-bold text-gray-800">Welcome, Dr. {docName}</h2>
                    <p className="text-gray-500 text-sm font-medium">SeniorMind AI · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-gray-50 text-gray-600 font-bold text-xs rounded border border-gray-200 hover:bg-gray-100 transition-colors" onClick={() => navigate('/doctor/messages')}>
                        Clinical Messaging
                    </button>
                    <button className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-colors"
                        onClick={() => navigate('/doctor/patients')}>
                        Clinical Registry →
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
                            {alerts.length} patient{alerts.length > 1 ? 's' : ''} triggered a crisis alert in their latest recordings.
                            <button onClick={() => navigate('/doctor/diary-reports')} style={{ background: 'none', border: 'none', borderBottom: '1px solid #fff', color: '#fff', fontWeight: 700, marginLeft: 8, cursor: 'pointer' }}>View Reports</button>
                        </p>
                    </div>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {statCards.map(s => (
                    <div key={s.label} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xl">{s.icon}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{s.label}</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-800 mb-1">{s.value}</div>
                        <div className="text-[10px] font-semibold text-gray-400 uppercase italic">{s.change}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-[1.2fr_1fr] gap-8">
                {/* High risk patients */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Patient Alerts</h3>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase">{stats?.high_risk || 0} Critical Cases</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {highRiskShortlist.length > 0 ? highRiskShortlist.map(p => (
                            <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                                <div className="w-10 h-10 rounded bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                                    {p.name[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">{p.name}</p>
                                    <p className="text-[11px] text-gray-400 font-medium">
                                        Score: {p.latest_assessment?.total_score}/30 · {p.latest_assessment?.created_at}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <RiskBadge level="High" />
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center text-gray-400 text-sm italic">
                                No high-risk alerts at this time.
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50/30 border-t border-gray-200">
                        <button className="w-full py-2.5 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-primary transition-colors" onClick={() => navigate('/doctor/patients')}>Open Clinical Directory</button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Registry Updates</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {patients.slice(0, 5).map((p, i) => (
                            <div key={i} className="flex gap-3 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-700">
                                        {p.latest_assessment ? (
                                            <>Assessment: <span className="text-gray-900">{p.name}</span> ({p.latest_assessment.risk_level})</>
                                        ) : (
                                            <>New Enrollment: <span className="text-gray-900">{p.name}</span></>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-medium">{p.created_at}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Soul Connects Panel */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">🤝 Recent Soul Connects</h3>
                </div>
                {recentSC.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {recentSC.map(sc => (
                            <div key={sc.id} className="p-5 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col gap-2"
                                onClick={() => navigate(`/doctor/patient/${sc.patient_id}`)}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-xs font-bold text-gray-800">{sc.patient_name}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">{sc.created_at}</div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-[10px] text-gray-500 italic truncate" title={sc.q1_answer}>"{sc.q1_answer}"</div>
                                    <div className="text-[10px] font-bold"><span className="text-gray-400">Ate:</span> <span className={sc.q2_answer === 'Yes' ? 'text-green-600' : 'text-red-500'}>{sc.q2_answer || '-'}</span></div>
                                    <div className="text-[10px] font-bold"><span className="text-gray-400">Exer:</span> <span className={sc.q3_answer === 'Yes' ? 'text-green-600' : 'text-red-500'}>{sc.q3_answer || '-'}</span></div>
                                    <div className="text-[10px] font-bold"><span className="text-gray-400">Slept:</span> <span className={sc.q4_answer === 'Yes' ? 'text-green-600' : 'text-red-500'}>{sc.q4_answer || '-'}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400 text-xs italic">
                        No recent check-ins. Patient Soul Connect answers will appear here.
                    </div>
                )}
            </div>

            {/* Quick Directory Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-8 mb-12 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Recent Clinical Registry</h3>
                    <button className="text-xs font-bold text-primary hover:underline" onClick={() => navigate('/doctor/patients')}>Full Directory →</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Profile</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Biometric Age</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Risk</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Score</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                                <th className="px-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {patients.slice(0, 8).map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">
                                                {p.name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-800">{p.name}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{p.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-gray-500">{p.age || '—'} yrs</td>
                                    <td className="px-8 py-4">
                                        {p.latest_assessment ? <RiskBadge level={p.latest_assessment.risk_level} /> : <span className="text-[9px] text-gray-300 font-bold uppercase">—</span>}
                                    </td>
                                    <td className="px-8 py-4 text-sm font-bold text-gray-700">
                                        {p.latest_assessment ? <><span className="text-primary">{p.latest_assessment.total_score}</span><span className="text-gray-300 text-[10px]">/30</span></> : '—'}
                                    </td>
                                    <td className="px-8 py-4">
                                        {p.latest_assessment ? (
                                            <span className="text-[10px] font-bold uppercase text-gray-500">{p.latest_assessment.ml_prediction}</span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <button className="text-[10px] font-bold text-primary hover:underline uppercase" onClick={() => navigate(`/doctor/patient/${p.id}`)}>View Profile</button>
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
