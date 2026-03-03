import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatients } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

export default function DoctorPatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getDoctorPatients();
                if (data.success) setPatients(data.patients);
            } catch (err) {
                console.error("Failed to load patients:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
        const matchesRisk = filter === 'all' || p.latest_assessment?.risk_level === filter;
        return matchesSearch && matchesRisk;
    });

    return (
        <DashboardLayout role="doctor" title="Clinical Patient Directory">
            <div className="page-header mb-12">
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">System Registry</h2>
                <p className="text-gray-500 font-medium">Manage and monitor all patients enrolled in the NeuroScan clinical network.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-12">
                <div className="search-bar shrink-0 flex-1 relative max-w-xl">
                    <input
                        type="text"
                        placeholder="Search clinical registry by name or email ID..."
                        className="form-control"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '16px 20px 16px 52px', border: '2px solid var(--gray-100)', borderRadius: 20, fontSize: 16, fontWeight: 600 }}
                    />
                    <svg className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex gap-3">
                    {['all', 'High', 'Moderate', 'Low'].map(f => (
                        <button key={f} className={`px-8 rounded-2xl font-black uppercase text-xs tracking-widest border-2 transition-all ${filter === f ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`} onClick={() => setFilter(f)}>
                            {f === 'all' ? 'Entire Database' : `${f} Risk`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card shadow-2xl border-0 overflow-hidden mb-20 bg-white">
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div className="p-40 text-center text-teal-600 text-4xl spin">⟳</div>
                    ) : filteredPatients.length > 0 ? (
                        <table className="data-table w-full">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Biological Profile</th>
                                    <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Clinical Data</th>
                                    <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Neuro Health Score</th>
                                    <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Latest Assessment</th>
                                    <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPatients.map(p => (
                                    <tr key={p.id} className="hover:bg-teal-50/10 transition-all cursor-pointer group" onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-xl border-2 border-teal-100 group-hover:scale-110 transition-transform">
                                                    {p.name[0]}
                                                </div>
                                                <div>
                                                    <span className="block text-xl font-black text-gray-900 leading-tight uppercase tracking-tight group-hover:text-teal-600 transition-colors uppercase">{p.name}</span>
                                                    <span className="block text-xs font-bold text-gray-400 tracking-wide underline mt-1">{p.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Age:</span>
                                                    <span className="text-sm font-black text-gray-700">{p.age || '—'} YRS</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Enroll:</span>
                                                    <span className="text-xs font-bold text-gray-500">{p.created_at}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            {p.latest_assessment ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full border-4 border-teal-50 bg-teal-500 text-white flex items-center justify-center text-sm font-black">
                                                        {p.latest_assessment.total_score}
                                                    </div>
                                                    <RiskBadge level={p.latest_assessment.risk_level} />
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-300 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">No Assessment Recorded</span>
                                            )}
                                        </td>
                                        <td className="px-10 py-8">
                                            {p.latest_assessment ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">AI DETECT:</span>
                                                        <span className={`badge ${p.latest_assessment.ml_prediction === 'dementia' ? 'badge-moderate' : 'badge-low'} text-[10px] px-2 py-0.5 font-black uppercase`}>{p.latest_assessment.ml_prediction}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">DATE:</span>
                                                        <span className="text-xs font-bold text-gray-400">{p.latest_assessment.created_at}</span>
                                                    </div>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button className="btn btn-outline border-2 border-gray-100 text-gray-400 hover:border-teal-600 hover:text-teal-600 font-black uppercase text-xs tracking-widest px-8 rounded-xl transition-all" onClick={e => { e.stopPropagation(); navigate(`/doctor/patient/${p.id}`); }}>
                                                Clinical Review →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-40 text-center">
                            <h3 className="text-4xl font-black text-gray-200 uppercase mb-4">No Patients Found</h3>
                            <p className="text-gray-400 font-medium">Try adjusting your search clinical filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
