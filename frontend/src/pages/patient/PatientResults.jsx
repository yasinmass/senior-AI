import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiFetch } from '../../utils/api';

function RiskBadge({ level }) {
    const cls = level === 'Low' ? 'badge-low' : level === 'Moderate' ? 'badge-moderate' : 'badge-high';
    return <span className={`badge ${cls}`}>{level}</span>;
}

export default function PatientResults() {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        apiFetch('/assessment/history/')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setAssessments(d.assessments);
                    if (d.assessments.length) setSelected(d.assessments[0]);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const getClassification = (score) => {
        const pct = Math.round((score / 30) * 100);
        if (pct >= 85) return {
            text: 'Normal Cognitive Baseline',
            color: '#10B981',
            desc: 'Your cognitive health is within the normal range. Continue with healthy habits and regular monitoring.',
            remark: 'Normal'
        };
        if (pct >= 40) return {
            text: 'Moderate Cognitive Concern',
            color: '#F59E0B',
            desc: 'Monitoring suggested. Some indicators recommend a professional follow-up for a detailed clinical review.',
            remark: 'Moderate'
        };
        return {
            text: 'Critical Clinical Marker',
            color: '#EF4444',
            desc: 'Professional medical evaluation is strongly advised. Significant cognitive indicators detected.',
            remark: 'Urgent'
        };
    };

    if (loading) return (
        <DashboardLayout role="patient" title="Diagnostic History">
            <div className="flex items-center justify-center py-40">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </DashboardLayout>
    );

    if (assessments.length === 0) return (
        <DashboardLayout role="patient" title="Diagnostic History">
            <div className="card shadow-lg p-12 text-center bg-white rounded-3xl max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4">No Assessment Found</h3>
                <p className="text-gray-500 mb-8">Complete a screening test to view your results here.</p>
                <button onClick={() => window.location.href = '/patient/test'} className="btn btn-primary px-8">Start Assessment</button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="patient" title="Clinical Report">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8 no-print">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Clinical Report</h2>
                        <p className="text-gray-500 text-sm">Review and download your cognitive health documentation.</p>
                    </div>
                    {assessments.length > 1 && (
                        <select
                            className="bg-white border border-gray-200 p-2 rounded-lg text-sm font-semibold outline-none focus:ring-2 ring-primary/20"
                            value={selected?.id || ''}
                            onChange={(e) => setSelected(assessments.find(a => a.id === parseInt(e.target.value)))}
                        >
                            {assessments.map(a => (
                                <option key={a.id} value={a.id}>Assessment {a.id} - {a.created_at}</option>
                            ))}
                        </select>
                    )}
                </div>

                {selected && (
                    <div className="card shadow-xl border-0 bg-white overflow-hidden rounded-3xl fade-in mb-8" id="printable-report">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center text-sm">
                            <div>
                                <h3 className="font-bold uppercase tracking-wider">NeuroScan AI Clinical Report</h3>
                                <p className="text-white/40 text-[10px]">Registry ID: {selected.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/40 text-[10px] uppercase">Date of Issue</p>
                                <p className="font-bold">{selected.created_at}</p>
                            </div>
                        </div>

                        <div className="p-10">
                            {/* Summary Block */}
                            {(() => {
                                const c = getClassification(selected.total_score);
                                return (
                                    <div className="mb-10">
                                        <div className="flex items-center gap-6 mb-4">
                                            <div className="text-6xl font-black text-gray-900">{Math.round((selected.total_score / 30) * 100)}%</div>
                                            <div style={{ backgroundColor: c.color }} className="px-4 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest">
                                                {c.text}
                                            </div>
                                        </div>
                                        <p className="text-lg text-gray-600 leading-relaxed border-l-4 pl-6" style={{ borderColor: c.color }}>
                                            {c.desc}
                                        </p>
                                    </div>
                                );
                            })()}

                            {/* Scores Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                <div className="p-6 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Cognitive Score</p>
                                    <p className="text-xl font-bold text-primary">{selected.total_score}/30</p>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">AI Analysis</p>
                                    <p className={`text-xl font-bold ${selected.ml_prediction === 'dementia' ? 'text-red-600' : 'text-green-600'}`}>
                                        {selected.ml_prediction === 'dementia' ? 'Concern' : 'Normal'}
                                    </p>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Memory</p>
                                    <p className="text-xl font-bold text-gray-900">{selected.memory_score}/10</p>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-2xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Executive</p>
                                    <p className="text-xl font-bold text-gray-900">{selected.executive_score}/10</p>
                                </div>
                            </div>

                            {/* Registry ID Block - CRITICAL FOR DOCTOR */}
                            <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-3xl mb-10">
                                <p className="text-[10px] font-black text-blue-800/40 uppercase tracking-widest mb-4">Registry Identification Information</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Patient Name</p>
                                        <p className="font-bold text-gray-900">{sessionStorage.getItem('patient_name')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">System Registry Email</p>
                                        <p className="font-mono text-blue-700 font-bold">{sessionStorage.getItem('patient_email')}</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-[10px] text-blue-500 italic">
                                    Notice: Clinicians can use this report to synchronize their dashboard registry.
                                </p>
                            </div>

                            <div className="flex gap-4 no-print mt-12">
                                <button
                                    className="btn btn-primary flex-1 py-4 rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
                                    onClick={() => window.print()}
                                >
                                    📄 Download PDF Report
                                </button>
                                <button
                                    className="btn btn-secondary px-8 rounded-xl font-bold uppercase text-xs tracking-widest"
                                    onClick={() => window.location.href = '/patient/test'}
                                >
                                    New Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-900 text-white p-6 rounded-3xl no-print">
                    <p className="text-xs text-white/50 italic leading-relaxed">
                        Medical Disclaimer: This report is generated by a screening tool. It is not a definitive medical diagnosis.
                        Please consult a qualified medical professional for a complete clinical evaluation.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
