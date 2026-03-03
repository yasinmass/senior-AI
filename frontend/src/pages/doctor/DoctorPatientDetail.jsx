import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatientDetail } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

export default function DoctorPatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getDoctorPatientDetail(id);
                if (data.success) {
                    setPatient(data.patient);
                    setAssessments(data.assessments);
                }
            } catch (err) {
                console.error("Failed to load patient detail:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) return (
        <DashboardLayout role="doctor" title="Patient Clinical Profile">
            <div className="flex items-center justify-center p-40">
                <div className="spin text-teal-600 text-4xl">⟳</div>
            </div>
        </DashboardLayout>
    );

    if (!patient) return (
        <DashboardLayout role="doctor" title="Patient Clinical Profile">
            <div className="p-40 text-center">
                <h3 className="text-4xl font-black text-gray-200 uppercase mb-4">Patient Not Found</h3>
                <button className="btn btn-secondary" onClick={() => navigate('/doctor/patients')}>Return to Registry</button>
            </div>
        </DashboardLayout>
    );

    const latest = assessments[0];

    return (
        <DashboardLayout role="doctor" title="Patient Clinical Profile">
            {/* Nav Back */}
            <button className="btn btn-secondary btn-sm mb-8 px-8 font-black uppercase text-xs tracking-widest bg-gray-100 hover:bg-gray-200" onClick={() => navigate(-1)}>
                ← Back to Directory
            </button>

            {/* Profile Header */}
            <div className="grid md:grid-template-columns: 1fr 1.6fr gap-12 items-start mb-12">
                <div className="card shadow-2xl border-0 overflow-hidden bg-white p-12 text-center rounded-[40px]">
                    <div className="w-24 h-24 rounded-3xl bg-teal-600 text-white flex items-center justify-center font-black text-4xl mx-auto mb-8 shadow-xl shadow-teal-100">
                        {patient.name[0]}
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2 leading-tight uppercase">{patient.name}</h2>
                    <p className="text-sm font-bold text-gray-400 underline mb-8">{patient.email}</p>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-8">
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-300 mb-1">Biological Age</span>
                            <span className="text-lg font-black text-gray-700">{patient.age || '—'} YRS</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-300 mb-1">Registry Date</span>
                            <span className="text-base font-black text-gray-500 uppercase">{patient.created_at}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Clinical Summary */}
                    <div className="card shadow-2xl border-0 p-10 bg-gray-900 text-white rounded-[40px]">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-8">Clinical Summary Snapshot</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Primary Risk</span>
                                {latest ? <RiskBadge level={latest.risk_level} /> : <span className="text-xs font-bold">N/A</span>}
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Assessments</span>
                                <span className="text-2xl font-black">{assessments.length} Records</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Neuro Score</span>
                                <span className="text-2xl font-black text-teal-400">{latest?.total_score || '—'} / 30</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">AI Detection</span>
                                <span className="text-sm font-black uppercase bg-white/10 px-3 py-1.5 rounded-lg text-center">{latest?.ml_prediction || 'PENDING'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-teal-500 p-8 rounded-[30px] shadow-lg shadow-teal-100 flex flex-col justify-between group cursor-pointer" onClick={() => navigate('/doctor/schedule')}>
                            <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl mb-6 group-hover:bg-white group-hover:text-teal-600 transition-all">📅</div>
                            <div>
                                <h4 className="text-white text-lg font-black uppercase tracking-tight mb-2">Schedule Exercise</h4>
                                <p className="text-white/70 text-sm font-medium">Assign daily cognitive targets.</p>
                            </div>
                        </div>
                        <div className="bg-gray-100 p-8 rounded-[30px] shadow-sm flex flex-col justify-between group cursor-pointer" onClick={() => navigate('/doctor/messages')}>
                            <div className="w-12 h-12 rounded-xl bg-white text-gray-400 flex items-center justify-center text-xl mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">💬</div>
                            <div>
                                <h4 className="text-gray-900 text-lg font-black uppercase tracking-tight mb-2">Send Clinical Msg</h4>
                                <p className="text-gray-500 text-sm font-medium">Direct secure communication.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assessment History Table */}
            <div className="card shadow-2xl border-0 overflow-hidden mb-20">
                <div className="card-header bg-gray-50/50 py-8 px-10 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Full Longitudinal Assessment History</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table w-full">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Exam Record</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Memory</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Orientation</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Executive</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">AI ML Biomarkers</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Score</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Classification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {assessments.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50/50 transition-all">
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-800 uppercase tracking-tight">SCAN_ID_{a.id}</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase mt-1">{a.created_at}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-2 w-24">
                                            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                <span>Level:</span>
                                                <span>{a.memory_score}/10</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-teal-500" style={{ width: `${a.memory_score * 10}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-2 w-24">
                                            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                <span>Level:</span>
                                                <span>{a.orientation_score}/10</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-teal-500" style={{ width: `${a.orientation_score * 10}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-2 w-24">
                                            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                <span>Level:</span>
                                                <span>{a.executive_score}/10</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-teal-500" style={{ width: `${a.executive_score * 10}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className={`badge ${a.ml_prediction === 'dementia' ? 'badge-moderate' : 'badge-low'} text-[10px] font-black uppercase px-2 py-0.5 self-start mb-2`}>{a.ml_prediction}</span>
                                            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Prob: {(a.ml_dementia_probability * 100).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-xl font-black text-gray-900">{a.total_score} / 30</td>
                                    <td className="px-10 py-6">
                                        <RiskBadge level={a.risk_level} />
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
