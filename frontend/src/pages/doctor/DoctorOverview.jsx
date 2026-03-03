import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorStats, getDoctorPatients } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

export default function DoctorOverview() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const sData = await getDoctorStats();
                const pData = await getDoctorPatients();
                if (sData.success) setStats(sData.stats);
                if (pData.success) setPatients(pData.patients);
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

    const docName = sessionStorage.getItem('doctor_name') || 'Medical Professional';

    const statCards = [
        { label: 'Total Patients', value: stats?.total_patients || 0, icon: '👥', color: 'var(--primary)', bg: 'var(--primary-pale)', change: 'Active database' },
        { label: 'High Risk Alert', value: stats?.high_risk || 0, icon: '🔴', color: 'var(--danger)', bg: 'var(--danger-light)', change: 'Needs attention' },
        { label: 'Moderate Risk', value: stats?.moderate_risk || 0, icon: '🟠', color: 'var(--warning)', bg: 'var(--warning-light)', change: 'Monitoring required' },
        { label: 'Total Assessments', value: stats?.total_assessments || 0, icon: '📋', color: 'var(--teal)', bg: 'var(--teal-light)', change: 'System wide' },
    ];

    const highRiskShortlist = patients.filter(p => p.latest_assessment?.risk_level === 'High').slice(0, 4);

    return (
        <DashboardLayout role="doctor" title="Doctor Dashboard">
            {/* Welcome Banner */}
            <div className="fade-in" style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px 40px',
                marginBottom: 32,
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4)'
            }}>
                <div>
                    <h5 className="text-sm font-bold opacity-60 uppercase tracking-widest mb-2">Internal Portal</h5>
                    <h2 className="text-3xl font-black mb-2">Welcome Back, Dr. {docName} 👋</h2>
                    <p className="text-white/60 font-medium">NeuroScan Clinical Network · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-4">
                    <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 24px' }} onClick={() => navigate('/doctor/messages')}>
                        💬 Clinical Chat
                    </button>
                    <button className="btn bg-teal-500 hover:bg-teal-400 text-white font-bold" style={{ padding: '12px 28px' }} onClick={() => navigate('/doctor/patients')}>
                        Manage All Patients
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                {statCards.map(s => (
                    <div key={s.label} className="stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
                        <div className="stat-icon" style={{ background: s.bg, fontSize: 24 }}>{s.icon}</div>
                        <div className="stat-value" style={{ color: s.color, fontSize: 36 }}>{s.value}</div>
                        <div className="stat-label uppercase tracking-widest text-[10px] font-black">{s.label}</div>
                        <div className="stat-change" style={{ color: 'var(--gray-400)', fontWeight: 600 }}>{s.change}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28 }}>
                {/* High risk patients */}
                <div className="card shadow-xl border-0 overflow-hidden">
                    <div className="card-header bg-gray-50/50 py-6 px-8 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Immediate Attention Required</h3>
                        </div>
                        <span className="badge badge-high">{stats?.high_risk || 0} Critical</span>
                    </div>
                    <div className="card-body p-0">
                        {highRiskShortlist.length > 0 ? highRiskShortlist.map(p => (
                            <div key={p.id} className="flex items-center gap-16 px-8 py-5 border-b border-gray-50 hover:bg-red-50/20 transition-all cursor-pointer group"
                                onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                                    {p.name[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p className="text-base font-bold text-gray-900 group-hover:text-red-700 transition-colors uppercase tracking-tight">{p.name}</p>
                                    <p className="text-xs text-gray-400 font-semibold tracking-wide">
                                        Score <b className="text-gray-900">{p.latest_assessment?.total_score}/30</b> · {p.latest_assessment?.created_at}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <RiskBadge level="High" />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{p.latest_assessment?.ml_prediction}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-16 text-center text-gray-400 font-medium italic">
                                No high-risk alerts at this time.
                            </div>
                        )}
                        <div className="p-6 bg-gray-50/30">
                            <button className="btn btn-secondary w-full font-bold uppercase tracking-widest text-xs py-3" onClick={() => navigate('/doctor/patients')}>View Full Clinical Directory</button>
                        </div>
                    </div>
                </div>

                {/* Quick News / Activity */}
                <div className="card shadow-xl border-0 overflow-hidden">
                    <div className="card-header bg-gray-50/50 py-6 px-8 border-b border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Recent Clinical Activity</h3>
                    </div>
                    <div className="card-body px-8 py-2">
                        {patients.slice(0, 5).map((p, i) => (
                            <div key={i} className="flex gap-4 py-8 border-b border-gray-50 last:border-0">
                                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-4 border-blue-100 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-gray-800 leading-tight mb-1">
                                        {p.latest_assessment ? (
                                            <>Assessment completed by <span className="text-teal-600">{p.name}</span>. Final Risk Level: <b className="bg-gray-100 px-2 py-0.5 rounded ml-1">{p.latest_assessment.risk_level}</b></>
                                        ) : (
                                            <>New patient registered in clinical directory: <span className="text-teal-600">{p.name}</span></>
                                        )}
                                    </p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.created_at} · RECORD_ID_{p.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Directory Table */}
            <div className="card shadow-xl border-0 mt-8 overflow-hidden mb-12">
                <div className="card-header bg-white py-6 px-8 flex justify-between items-center border-b border-gray-100">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Clinical Registry: Recent Enrollments</h3>
                    <button className="btn btn-primary btn-sm px-6 font-bold" onClick={() => navigate('/doctor/patients')}>See Full Registry</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Patient Profile</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Biological Age</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Clinical Risk</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Neuro Score</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">AI ML Output</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Recorded On</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {patients.slice(0, 10).map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-all cursor-pointer" onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm border border-teal-100">
                                                {p.name[0]}
                                            </div>
                                            <div>
                                                <span className="block text-sm font-bold text-gray-900 uppercase tracking-tight">{p.name}</span>
                                                <span className="block text-xs font-medium text-gray-400 underline">{p.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-gray-500">{p.age || '—'} YRS</td>
                                    <td className="px-8 py-5">
                                        {p.latest_assessment ? <RiskBadge level={p.latest_assessment.risk_level} /> : <span className="text-gray-300 font-bold uppercase text-[10px]">Pending Test</span>}
                                    </td>
                                    <td className="px-8 py-5 font-black text-base text-gray-700">
                                        {p.latest_assessment ? <div className="flex items-center gap-1.5"><span className="text-teal-600">{p.latest_assessment.total_score}</span><span className="text-gray-300 text-xs">/30</span></div> : '—'}
                                    </td>
                                    <td className="px-8 py-5">
                                        {p.latest_assessment ? (
                                            <span className={`badge ${p.latest_assessment.ml_prediction === 'dementia' ? 'badge-moderate' : 'badge-low'} border border-black/5`}>
                                                {p.latest_assessment.ml_prediction}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        {p.latest_assessment ? p.latest_assessment.created_at : p.created_at}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="btn btn-outline btn-sm font-bold border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-600" onClick={e => { e.stopPropagation(); navigate(`/doctor/patient/${p.id}`); }}>Open Profile</button>
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
