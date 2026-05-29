import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatientDetail } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level} Risk</span>;
}

export default function DoctorPatientDetail() {
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
                    console.log('[DEBUG] soul_connections from API:', sc);
                    setSoulConnections(sc);
                } else {
                    console.error('[DEBUG] API returned error:', data);
                }
            } catch (err) {
                console.error("Failed to load patient detail:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    if (loading) return (
        <DashboardLayout role="doctor" title="Loading Profile...">
            <div className="flex items-center justify-center p-20">
                <div className="spin text-teal-600 text-3xl">⟳</div>
            </div>
        </DashboardLayout>
    );

    if (!patient) return (
        <DashboardLayout role="doctor" title="Error">
            <div className="p-20 text-center">
                <h3 className="text-2xl font-bold text-gray-400 mb-4">Patient Not Found</h3>
                <button className="bg-primary text-white px-4 py-2 rounded" onClick={() => navigate('/doctor/patients')}>Back to Registry</button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="doctor" title="Patient Detail">
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-800">← Back</button>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Case ID: {id}</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                {/* Profile Card */}
                <div className="md:col-span-1 bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
                    <div className="w-20 h-20 rounded bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                        {patient.name[0]}
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>
                        <p className="text-sm text-gray-500 mb-6">{patient.email}</p>

                        <div className="text-left space-y-4 pt-6 border-t border-gray-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Age</p>
                                <p className="text-sm font-bold text-gray-700">{patient.age || '—'} yrs</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Assessments</p>
                                <p className="text-sm font-bold text-gray-700">{assessments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-3 space-y-8">
                    {/* Latest Summary */}
                    <div className="bg-gray-800 text-white p-8 rounded-lg shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Latest Diagnostic Summary</h3>
                        {assessments.length > 0 ? (
                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">Risk Level</p>
                                    <RiskBadge level={assessments[0].risk_level} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">MoCA Score</p>
                                    <p className="text-2xl font-bold">{assessments[0].total_score}/30</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase mb-1">ML Prediction</p>
                                    <p className="text-sm font-bold uppercase">{assessments[0].ml_prediction}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic">No assessment history found for this patient.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4">Adherence & Plans</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-600">Total Exercises Completed</span>
                                    <span className="text-sm font-bold text-primary">{patient.adherence?.completed_count || 0}</span>
                                </div>
                                <button onClick={() => navigate('/doctor/schedule')} className="w-full mt-2 py-2 bg-gray-50 border border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-600 rounded hover:bg-gray-100 transition-colors">Set Practice Schedule</button>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-100 p-6 rounded-lg shadow-sm flex flex-col justify-center items-center gap-2 border-dashed">
                            <span className="text-2xl">💬</span>
                            <button onClick={() => navigate('/doctor/messages')} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Message Patient</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assessment History Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-12 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Detailed Assessment History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Breakdown</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Prediction</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</th>
                                <th className="px-8 py-4 text-right">Risk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {assessments.map(a => (
                                <tr key={a.id}>
                                    <td className="px-8 py-4">
                                        <p className="text-xs font-bold text-gray-800">{a.created_at}</p>
                                        <p className="text-[10px] text-gray-400">ID: {a.id}</p>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="text-[10px] flex gap-3 text-gray-500 font-medium">
                                            <span>M: {a.memory_score}</span>
                                            <span>O: {a.orientation_score}</span>
                                            <span>E: {a.executive_score}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <p className="text-[10px] font-bold uppercase text-gray-600">{a.ml_prediction}</p>
                                        <p className="text-[9px] text-gray-400">Prob: {(a.ml_dementia_probability * 100).toFixed(1)}%</p>
                                    </td>
                                    <td className="px-8 py-4 font-bold text-sm text-primary">
                                        {a.total_score}/30
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <RiskBadge level={a.risk_level} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Soul Connect History */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-12 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">🤝 Soul Connect — Daily Check-In</h3>
                    <span className="text-xs text-gray-400 font-medium">{soulConnections.length} session(s)</span>
                </div>
                {soulConnections.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>🤝</div>
                        <p className="text-sm text-gray-400 italic">No daily check-in responses yet. They will appear here automatically once the patient completes a Soul Connect session.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">How is your day?</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Did you eat well?</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Did you exercise?</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Did you sleep well?</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {soulConnections.map(sc => (
                                    <tr key={sc.id}>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-gray-800">{sc.created_at}</p>
                                            <p className="text-[10px] text-gray-400">{sc.language === 'ta' ? 'Tamil' : 'English'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-700">{sc.q1_answer || '—'}</td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className={`font-bold ${sc.q2_answer === 'Yes' ? 'text-green-600' : 'text-red-500'}`}>{sc.q2_answer || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className={`font-bold ${sc.q3_answer === 'Yes' ? 'text-green-600' : 'text-red-500'}`}>{sc.q3_answer || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className={`font-bold ${sc.q4_answer === 'Yes' ? 'text-green-600' : 'text-red-500'}`}>{sc.q4_answer || '—'}</span>
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
