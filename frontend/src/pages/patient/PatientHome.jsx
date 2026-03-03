import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getLatestAssessment, getAssessmentHistory } from '../../utils/api';

export default function PatientHome() {
    const navigate = useNavigate();
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const lData = await getLatestAssessment();
                const hData = await getAssessmentHistory();
                if (lData.success) setLatest(lData.assessment);
                if (hData.success) setHistory(hData.assessments);
            } catch (err) {
                console.error("Failed to load patient data:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const name = sessionStorage.getItem('patient_name') || 'Patient';

    if (loading) return (
        <DashboardLayout role="patient" title="My Health Portal">
            <div className="flex items-center justify-center p-20">
                <div className="spin text-teal-600 text-4xl">⟳</div>
            </div>
        </DashboardLayout>
    );

    const stats = [
        { label: 'Total Assessments', value: history.length, icon: '📋', color: 'var(--primary)', bg: 'var(--primary-pale)' },
        { label: 'Latest Score', value: latest ? `${latest.total_score}/30` : 'None', icon: '🎯', color: 'var(--success)', bg: 'var(--success-light)' },
        { label: 'Risk Level', value: latest?.final_risk_level || 'Pending', icon: '🛡️', color: 'var(--accent)', bg: 'var(--accent-light)' },
        { label: 'Next Exercise', value: 'Today, 2PM', icon: '🧘', color: 'var(--teal)', bg: 'var(--teal-light)' },
    ];

    return (
        <DashboardLayout role="patient" title="My Health Portal">
            {/* Welcome */}
            <div className="fade-in" style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px',
                marginBottom: 32,
                color: '#fff',
                boxShadow: '0 20px 40px -10px rgba(37, 99, 235, 0.3)'
            }}>
                <div style={{ maxWidth: 600 }}>
                    <h5 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-2">Patient Dashboard</h5>
                    <h2 className="text-4xl font-black mb-4">Hello, {name}! 👋</h2>
                    <p className="text-white/80 text-lg font-medium leading-relaxed mb-8">
                        Welcome back to your cognitive health portal. Take your daily assessment or review your previous results.
                    </p>
                    <div className="flex gap-4">
                        <button className="btn bg-white text-primary font-black px-10 py-4 rounded-xl shadow-xl transition-all hover:scale-105" onClick={() => navigate('/patient/test')}>
                            Start New Assessment Now
                        </button>
                        <button className="btn bg-blue-700/40 hover:bg-blue-700/60 text-white font-bold border border-white/20 px-8 py-4 rounded-xl" onClick={() => navigate('/patient/schedule')}>
                            View My Schedule
                        </button>
                        <button className="btn bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20 px-8 py-4 rounded-xl ml-auto" onClick={() => navigate('/patient/results')}>
                            View History
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                {stats.map(s => (
                    <div key={s.label} className="stat-card" style={{ borderBottom: `4px solid ${s.color}` }}>
                        <div className="stat-icon" style={{ background: s.bg, fontSize: 24 }}>{s.icon}</div>
                        <div className="stat-value" style={{ color: 'var(--gray-900)', fontSize: 32 }}>{s.value}</div>
                        <div className="stat-label uppercase tracking-widest text-[10px] font-black text-gray-400 mt-2">{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
                {/* Latest Result Card */}
                <div className="card shadow-xl border-0 overflow-hidden">
                    <div className="card-header bg-gray-50/50 py-6 px-8 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Latest Screening Outcome</h3>
                        {latest && <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{latest.created_at}</span>}
                    </div>
                    <div className="card-body p-10">
                        {latest ? (
                            <div className="flex flex-col md:flex-row gap-12 items-center">
                                <div className="circ-progress" style={{ width: 180, height: 180 }}>
                                    <svg width="180" height="180">
                                        <circle cx="90" cy="90" r="80" fill="transparent" stroke="var(--gray-100)" strokeWidth="12" />
                                        <circle cx="90" cy="90" r="80" fill="transparent" stroke="var(--primary)" strokeWidth="12"
                                            strokeDasharray={502} strokeDashoffset={502 - (502 * latest.total_score) / 30}
                                            strokeLinecap="round" />
                                    </svg>
                                    <div className="inner">
                                        <span className="text-5xl font-black text-gray-900 leading-tight">{latest.total_score}</span>
                                        <span className="block text-xs font-black text-gray-400 uppercase tracking-widest">Score / 30</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className={`badge ${latest.final_risk_level === 'Low' ? 'badge-low' : latest.final_risk_level === 'Moderate' ? 'badge-moderate' : 'badge-high'} p-4 px-6 rounded-2xl mb-6 flex justify-center text-lg font-black`}>
                                        {latest.final_risk_level} Risk Level
                                    </div>
                                    <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                        Your cognitive screening indicates a <b className="text-gray-900">{latest.final_risk_level}</b> risk of dementia based on voice and memory tests.
                                    </p>
                                    <button className="btn btn-outline w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest border-2" onClick={() => navigate('/patient/results')}>
                                        Detailed Clinical Report →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500 font-medium text-lg mb-8">No assessment recorded yet. Early screening is crucial for brain health monitoring.</p>
                                <button className="btn btn-primary btn-lg" onClick={() => navigate('/patient/test')}>Take your first AI screening →</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cognitive Wellness */}
                <div className="card shadow-xl border-0 overflow-hidden bg-gray-900 text-white">
                    <div className="card-header border-white/5 py-6 px-8 flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase tracking-tight">Today's Focus</h3>
                        <span className="text-emerald-400 text-xs font-black uppercase bg-emerald-400/10 px-3 py-1 rounded-full">Active Prescriptions</span>
                    </div>
                    <div className="card-body p-8 space-y-6">
                        <div className="p-10 text-center bg-white/5 rounded-[32px] border border-white/10">
                            <div className="text-4xl mb-6">🗓️</div>
                            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Clinical Timeline</h4>
                            <p className="text-white/40 text-xs font-medium italic mb-8">View your personalized neuro-protective exercises and diet chart for today.</p>
                            <button className="w-full py-4 bg-teal-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-900/20"
                                onClick={() => navigate('/patient/schedule')}>
                                Open Daily Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
