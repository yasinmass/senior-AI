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
                sessionStorage.setItem('doctor_email', data.doctor.email);
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
        <div className="auth-page px-6">
            <div className="fade-in w-full max-w-[600px]">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-900/50">
                        <svg width={32} height={32} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white">NeuroScan <span className="text-teal-400">AI</span></h1>
                        <p className="text-xs font-semibold text-teal-500/60 uppercase tracking-widest mt-1">Professional Enrollment</p>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Professional Profile</h2>
                        <p className="text-sm text-gray-400">Register as a clinical specialist</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in shake">
                            <span className="text-red-500 text-lg">⚠️</span>
                            <p className="text-xs font-bold text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                                <input type="text" name="name" className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="Dr. Jane Smith" required value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Work Email</label>
                                <input type="email" name="email" className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="dr@example.com" required value={formData.email} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
                            <input type="password" name="password" className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Hospital / Clinic</label>
                                <input type="text" name="hospital" className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="Name of institution" value={formData.hospital} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Specialization</label>
                                <select name="specialization" className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-bold transition-all outline-none appearance-none cursor-pointer" value={formData.specialization} onChange={handleChange}>
                                    <option value="Neurology">Neurology</option>
                                    <option value="Psychiatry">Psychiatry</option>
                                    <option value="Geriatrics">Geriatrics</option>
                                    <option value="Primary Care">Primary Care</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Medical License Number</label>
                            <input type="text" name="license_number" className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="Ex: ML-12345" value={formData.license_number} onChange={handleChange} />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm shadow-xl shadow-black/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Registering..." : "Create Professional Account"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center space-y-4">
                        <p className="text-sm text-gray-400">
                            Already have an account? <Link to="/login/doctor" className="text-teal-600 font-bold hover:underline">Sign In</Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Institutional Verification Required</p>
            </div>
        </div>
    );
}
