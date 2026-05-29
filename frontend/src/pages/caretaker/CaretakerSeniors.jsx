import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatients, addPatientByEmail, ingestPatientPDF } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

export default function CaretakerSeniors() {
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
            console.error("Failed to load seniors:", err);
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
        setEnrollMessage({ text: 'Parsing metadata from PDF...', type: 'info' });

        try {
            const res = await ingestPatientPDF(file);
            if (res.success) {
                setEnrollMessage({ text: `Ingestion successful! "${res.patient.name}" has been linked to your care registry.`, type: 'success' });
                loadPatients();
            } else {
                setEnrollMessage({ text: res.error, type: 'error' });
            }
        } catch (err) {
            setEnrollMessage({ text: "PDF extraction failed.", type: 'error' });
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
        <DashboardLayout role="caretaker" title="Seniors">
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--gray-200)', paddingBottom: 16, marginBottom: 28 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>Senior Registry</h2>
                    <p style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500, fontStyle: 'italic' }}>All seniors under your care and monitoring.</p>
                </div>
            </div>

            <div className="mb-8 bg-gray-50 border border-gray-200 p-8 rounded-2xl" style={{ marginBottom: 32 }}>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-[0.2em]" style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Senior Enrollment Workspace</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
                    {/* Option 1: Manual Email */}
                    <div className="border-r border-gray-200/50 pr-12" style={{ borderRight: '1px solid var(--gray-200)', paddingRight: '48px' }}>
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6" style={{ display: 'block', fontSize: 9, fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 24 }}>Method 01 — Manual Lookup</span>
                        <form onSubmit={handleEnroll} className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <input
                                type="email"
                                required
                                placeholder="Enter system email..."
                                className="w-full bg-white border border-gray-200 px-4 py-4 rounded-xl text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all"
                                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--gray-200)', fontSize: 14, fontWeight: 'bold' }}
                                value={enrollEmail}
                                onChange={e => setEnrollEmail(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={enrollLoading}
                                className="w-full bg-gray-900 text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#111827', color: 'white', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: enrollLoading ? 0.5 : 1 }}
                            >
                                {enrollLoading ? 'Validating...' : 'Authorize Access'}
                            </button>
                        </form>
                    </div>

                    {/* Option 2: PDF Ingestion */}
                    <div>
                        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6" style={{ display: 'block', fontSize: 9, fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 24 }}>Method 02 — Automated Ingestion</span>
                        <div className="relative group cursor-pointer h-full" style={{ position: 'relative', height: '100%' }}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePDFUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full w-full"
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10, width: '100%', height: '100%' }}
                                disabled={enrollLoading}
                            />
                            <div className="border-2 border-dashed border-gray-200 group-hover:border-teal-500 group-hover:bg-teal-50/50 transition-all p-8 rounded-2xl text-center h-full flex flex-col justify-center items-center" style={{ border: '2px dashed var(--gray-200)', padding: '32px', borderRadius: '16px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <div className="text-3xl mb-4" style={{ fontSize: '30px', marginBottom: '16px' }}>📄</div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]" style={{ fontSize: 10, fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Upload Official Report</p>
                                <p className="text-[9px] text-gray-400 mt-3 font-medium italic" style={{ fontSize: 9, color: 'var(--gray-400)', marginTop: '12px', fontStyle: 'italic' }}>System extracts credentials automatically</p>
                            </div>
                        </div>
                    </div>
                </div>

                {enrollMessage.text && (
                    <div style={{ marginTop: 32, padding: 20, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16, border: enrollMessage.type === 'success' ? '1px solid #d1fae5' : enrollMessage.type === 'info' ? '1px solid #dbeafe' : '1px solid #fee2e2', backgroundColor: enrollMessage.type === 'success' ? '#ecfdf5' : enrollMessage.type === 'info' ? '#eff6ff' : '#fef2f2' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, color: 'white', backgroundColor: enrollMessage.type === 'success' ? '#059669' : enrollMessage.type === 'info' ? '#2563eb' : '#dc2626' }}>
                            {enrollMessage.type === 'success' ? '✓' : enrollMessage.type === 'info' ? '⟳' : '!'}
                        </div>
                        <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: enrollMessage.type === 'success' ? '#065f46' : enrollMessage.type === 'info' ? '#1e40af' : '#991b1b' }}>
                            {enrollMessage.text}
                        </p>
                    </div>
                )}

                <p className="text-[9px] text-gray-400 mt-8 font-bold uppercase tracking-widest border-t border-gray-200/50 pt-6" style={{ fontSize: 9, color: 'var(--gray-400)', marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.05)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Security Note: Linked seniors will be able to see shared diagnostic history.</p>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="form-input"
                        style={{ width: '100%', padding: '10px 16px 10px 38px', fontSize: 13, borderRadius: 8 }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    {['all', 'High', 'Moderate', 'Low'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={filter === f ? 'btn btn-primary' : 'btn btn-outline'}
                            style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '8px 16px', borderRadius: 6 }}
                        >
                            {f === 'all' ? 'All' : `${f} Risk`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden', padding: 0, marginBottom: 32 }}>
                {loading ? (
                    <div style={{ padding: 80, textAlign: 'center' }}>
                        <div className="loader-ring" />
                    </div>
                ) : filteredPatients.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                    <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Senior Profile</th>
                                    <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Age</th>
                                    <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Risk Level</th>
                                    <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)' }}>Status</th>
                                    <th style={{ padding: '14px 28px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map(p => (
                                    <tr key={p.id}
                                        style={{ borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => navigate(`/caretaker/senior/${p.id}`)}
                                    >
                                        <td style={{ padding: '16px 28px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                                                    {p.name[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-800)' }}>{p.name}</div>
                                                    <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 500 }}>{p.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 28px', fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>{p.age || '—'} yrs</td>
                                        <td style={{ padding: '16px 28px' }}>
                                            {p.latest_assessment ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <RiskBadge level={p.latest_assessment.risk_level} />
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{p.latest_assessment.total_score}<span style={{ color: 'var(--gray-300)', fontSize: 10 }}>/30</span></span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 10, color: 'var(--gray-300)', fontWeight: 700, textTransform: 'uppercase' }}>No Screening</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 28px' }}>
                                            {p.latest_assessment ? (
                                                <div>
                                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-500)' }}>{p.latest_assessment.ml_prediction}</div>
                                                    <div style={{ fontSize: 9, color: 'var(--gray-400)', fontStyle: 'italic' }}>{p.latest_assessment.created_at}</div>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td style={{ padding: '16px 28px', textAlign: 'right' }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>View Profile →</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-200)', textTransform: 'uppercase', marginBottom: 8 }}>No Seniors Found</h3>
                        <p style={{ fontSize: 13, color: 'var(--gray-400)', fontStyle: 'italic' }}>Adjust your search or add seniors using the button above.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
