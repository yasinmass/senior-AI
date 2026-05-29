import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatients, getDoctorCompletions, assignClinicalPlan } from '../../utils/api';

export default function CaretakerSchedule() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [completions, setCompletions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const pData = await getDoctorPatients();
                if (pData.success) setPatients(pData.patients);
                const cData = await getDoctorCompletions();
                if (cData.success) setCompletions(cData.completions || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Read-only view: Caretakers only monitor schedules created by the therapist.

    if (loading) return (
        <DashboardLayout role="caretaker" title="Schedule">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                <div className="loader-ring" />
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="caretaker" title="Schedule & Plans">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--gray-200)', paddingBottom: 16, marginBottom: 28 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 4 }}>Therapist Schedules</h2>
                    <p style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500, fontStyle: 'italic' }}>Monitor wellness plans and tasks assigned by the clinical therapist.</p>
                </div>
                <div style={{ padding: '8px 16px', background: 'var(--primary-pale)', borderRadius: 8, color: 'var(--primary)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                    Read Only Mode
                </div>
            </div>

            {/* Recent Completions */}
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--gray-200)' }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recent Activity & Completions</h3>
                </div>
                {completions.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                                    <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-400)' }}>Senior</th>
                                    <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-400)' }}>Task</th>
                                    <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-400)' }}>Date</th>
                                    <th style={{ padding: '14px 28px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-400)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completions.map((c, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                        <td style={{ padding: '14px 28px', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>{c.patient_name}</td>
                                        <td style={{ padding: '14px 28px', fontSize: 12, color: 'var(--gray-600)' }}>{c.task_name}</td>
                                        <td style={{ padding: '14px 28px', fontSize: 11, color: 'var(--gray-400)' }}>{c.completed_at}</td>
                                        <td style={{ padding: '14px 28px' }}>
                                            <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--success-light)', color: 'var(--success-dark)', padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase' }}>Done</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-300)', textTransform: 'uppercase', marginBottom: 6 }}>No Completions Yet</h3>
                        <p style={{ fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic' }}>Assign care plans and track senior progress here.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
