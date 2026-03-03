import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doctorSignup } from '../utils/api';

export default function DoctorSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        specialization: 'Neurology', license_number: '', hospital: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await doctorSignup(formData);
            if (data.success) {
                sessionStorage.setItem('doctor_id', data.doctor.id);
                sessionStorage.setItem('doctor_name', data.doctor.name);
                sessionStorage.setItem('role', 'doctor');
                navigate('/doctor');
            } else {
                setError(data.error || 'Signup failed.');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally { setLoading(false); }
    }

    return (
        <div className="auth-page px-6 bg-gray-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 -z-0 w-[600px] h-[600px] bg-teal-600/10 blur-[150px] rounded-full" />

            <div className="w-full max-w-lg mb-20 fade-in">
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div className="flex items-center gap-3 justify-center mb-8">
                        <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
                            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter">NeuroScan AI</span>
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Professional Enrollment</h2>
                    <p className="text-white/40 font-medium">Join our advanced cognitive screening network.</p>
                </div>

                <div className="auth-card p-10 shadow-2xl border-0 overflow-hidden bg-white/80 backdrop-blur-xl rounded-[40px] border border-white/40">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold mb-8 flex gap-3 items-center">
                            <span>❌</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-group">
                                <label className="form-label uppercase tracking-widest text-[10px] font-black text-gray-400 mb-3 block">Full Name</label>
                                <input type="text" name="name" className="form-control" placeholder="Dr. John Doe" required value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label uppercase tracking-widest text-[10px] font-black text-gray-400 mb-3 block">Clinician Email</label>
                                <input type="email" name="email" className="form-control" placeholder="dr.john@example.com" required value={formData.email} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label uppercase tracking-widest text-[10px] font-black text-gray-400 mb-3 block">Secure Password</label>
                            <input type="password" name="password" className="form-control" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-group">
                                <label className="form-label uppercase tracking-widest text-[10px] font-black text-gray-400 mb-3 block">Clinical Unit / Hospital</label>
                                <input type="text" name="hospital" className="form-control" placeholder="Global Health AI Center" value={formData.hospital} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label uppercase tracking-widest text-[10px] font-black text-gray-400 mb-3 block">Medical Specialization</label>
                                <select name="specialization" className="form-control" value={formData.specialization} onChange={handleChange}>
                                    <option value="Neurology">Neurology</option>
                                    <option value="Psychiatry">Psychiatry</option>
                                    <option value="Geriatrics">Geriatrics</option>
                                    <option value="Primary Care">Primary Care</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label uppercase tracking-widest text-[10px] font-black text-gray-400 mb-3 block">Professional License ID</label>
                            <input type="text" name="license_number" className="form-control" placeholder="MC-8822-001" value={formData.license_number} onChange={handleChange} />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full py-5 rounded-2xl shadow-xl shadow-teal-100 font-extrabold uppercase tracking-widest text-sm" disabled={loading}>
                            {loading ? <span className="spin">⟳</span> : null}
                            {loading ? ' Processing Enrollment…' : 'Enroll as Medical Provider →'}
                        </button>
                    </form>

                    <div className="text-center mt-10">
                        <p className="text-gray-500 font-medium italic">Already have a pro account? <Link to="/login/doctor" className="text-teal-600 font-black underline underline-offset-4 decoration-2 decoration-teal-100">Clinician Sign In</Link></p>
                    </div>

                    <div className="mt-6 text-center">
                        <Link to="/signup/patient" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
                            Switch to Patient Portal →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
