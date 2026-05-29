import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatients, addPatientByEmail, ingestPatientPDF } from '../../utils/api';

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

    // Enrollment State
    const [enrollEmail, setEnrollEmail] = useState('');
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [enrollMessage, setEnrollMessage] = useState({ text: '', type: '' });

    const loadPatients = async () => {
        setLoading(true);
        try {
            const data = await getDoctorPatients();
            if (data.success) setPatients(data.patients);
        } catch (err) {
            console.error("Failed to load patients:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    const handleEnroll = async (e) => {
        e.preventDefault();
        setEnrollLoading(true);
        setEnrollMessage({ text: '', type: '' });
        try {
            const res = await addPatientByEmail(enrollEmail);
            if (res.success) {
                setEnrollMessage({ text: res.message, type: 'success' });
                setEnrollEmail('');
                loadPatients(); // Refresh list
            } else {
                setEnrollMessage({ text: res.error, type: 'error' });
            }
        } catch (err) {
            setEnrollMessage({ text: "Connection error. Please try again.", type: 'error' });
        } finally {
            setEnrollLoading(false);
        }
    };

    const handlePDFUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setEnrollLoading(true);
        setEnrollMessage({ text: 'Parsing clinical metadata from PDF...', type: 'info' });

        try {
            const res = await ingestPatientPDF(file);
            if (res.success) {
                setEnrollMessage({ text: `Ingestion successful! Patient "${res.patient.name}" has been linked to your registry.`, type: 'success' });
                loadPatients();
            } else {
                setEnrollMessage({ text: res.error, type: 'error' });
            }
        } catch (err) {
            setEnrollMessage({ text: "PDF extraction failed. Ensure the document is an official clinical report.", type: 'error' });
        } finally {
            setEnrollLoading(false);
            e.target.value = ''; // Reset
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
        const matchesRisk = filter === 'all' || p.latest_assessment?.risk_level === filter;
        return matchesSearch && matchesRisk;
    });

    return (
        <DashboardLayout role="doctor" title="Clinical Registry">
            <div className="page-header mb-8 border-b pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Registry Management</h2>
                    <p className="text-gray-500 text-sm italic">Full clinical directory of enrolled patients for maintenance monitoring.</p>
                </div>
            </div>

            <div className="mb-8 bg-gray-50 border border-gray-200 p-8 rounded-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Patient Enrollment Workspace</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Option 1: Manual Email */}
                    <div className="border-r border-gray-200/50 pr-12">
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Method 01 — Manual Lookup</span>
                        <form onSubmit={handleEnroll} className="space-y-4">
                            <input
                                type="email"
                                required
                                placeholder="Enter patient system email..."
                                className="w-full bg-white border border-gray-200 px-4 py-4 rounded-xl text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                                value={enrollEmail}
                                onChange={e => setEnrollEmail(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={enrollLoading}
                                className="w-full bg-gray-900 text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {enrollLoading ? 'Validating...' : 'Authorize Access'}
                            </button>
                        </form>
                    </div>

                    {/* Option 2: PDF Ingestion */}
                    <div>
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Method 02 — Automated Ingestion</span>
                        <div className="relative group cursor-pointer h-full">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePDFUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full w-full"
                                disabled={enrollLoading}
                            />
                            <div className="border-2 border-dashed border-gray-200 group-hover:border-teal-500 group-hover:bg-teal-50/50 transition-all p-8 rounded-2xl text-center h-full flex flex-col justify-center items-center">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📄</div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-teal-600">Upload Official Report</p>
                                <p className="text-[9px] text-gray-400 mt-3 font-medium italic">System extracts credentials automatically</p>
                            </div>
                        </div>
                    </div>
                </div>

                {enrollMessage.text && (
                    <div className={`mt-8 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300 ${enrollMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-100' :
                        enrollMessage.type === 'info' ? 'bg-blue-50 border border-blue-100' :
                            'bg-red-50 border border-red-100'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${enrollMessage.type === 'success' ? 'bg-emerald-600 text-white' :
                            enrollMessage.type === 'info' ? 'bg-blue-600 text-white' :
                                'bg-red-600 text-white'}`}>
                            {enrollMessage.type === 'success' ? '✓' : enrollMessage.type === 'info' ? '⟳' : '!'}
                        </div>
                        <p className={`text-[11px] font-black uppercase tracking-tight ${enrollMessage.type === 'success' ? 'text-emerald-800' :
                            enrollMessage.type === 'info' ? 'text-blue-800' :
                                'text-red-800'}`}>
                            {enrollMessage.text}
                        </p>
                    </div>
                )}

                <p className="text-[9px] text-gray-400 mt-8 font-bold uppercase tracking-widest border-t border-gray-200/50 pt-6">Security Note: Linked patients will be able to see shared diagnostic history.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search patient database by name or identifier..."
                        className="w-full bg-white border border-gray-200 p-3 pl-10 rounded-md text-sm font-medium focus:ring-1 ring-primary"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex gap-2">
                    {['all', 'High', 'Moderate', 'Low'].map(f => (
                        <button key={f} className={`px-5 py-2 rounded font-bold text-[10px] uppercase tracking-wider border transition-colors ${filter === f ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`} onClick={() => setFilter(f)}>
                            {f === 'all' ? 'All Records' : `${f} Risk`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-12 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-40 text-center text-primary text-3xl spin">⟳</div>
                    ) : filteredPatients.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Clinical Profile</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Biometric Data</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Latest Outcome</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Clinical Status</th>
                                    <th className="px-8 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPatients.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm">
                                                    {p.name[0]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-800 uppercase tracking-tight">{p.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium underline">{p.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-gray-700">{p.age || '—'} YRS</div>
                                            <div className="text-[10px] text-gray-400 font-medium italic mt-0.5">Enroll: {p.created_at}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {p.latest_assessment ? (
                                                <div className="flex items-center gap-3">
                                                    <RiskBadge level={p.latest_assessment.risk_level} />
                                                    <span className="text-sm font-bold text-primary">{p.latest_assessment.total_score}<span className="text-gray-300 text-[10px] ml-0.5">/30</span></span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-300 font-bold uppercase">No Screening</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            {p.latest_assessment ? (
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase text-gray-500">{p.latest_assessment.ml_prediction}</div>
                                                    <div className="text-[9px] text-gray-400 font-medium italic">{p.latest_assessment.created_at}</div>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider" onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                                                Review Profile →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-32 text-center">
                            <h3 className="text-2xl font-bold text-gray-200 uppercase mb-2">Registry Entry Not Found</h3>
                            <p className="text-gray-400 text-sm italic">Adjust search clinical filters to locate patient.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
