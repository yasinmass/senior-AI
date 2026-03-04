import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../utils/api';

export default function PatientSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', age: '', phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await signup(formData);
            if (data.success) {
                sessionStorage.setItem('patient_id', data.patient.id);
                sessionStorage.setItem('patient_name', data.patient.name);
                sessionStorage.setItem('patient_email', data.patient.email);
                sessionStorage.setItem('role', 'patient');
                navigate('/patient');
            } else {
                setError(data.error || 'Signup failed.');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally { setLoading(false); }
    }

    return (
        <div className="auth-page px-6">
            <div className="fade-in w-full max-w-[540px]">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                        <svg width={32} height={32} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white">NeuroScan <span className="text-primary-pale">AI</span></h1>
                        <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest mt-1">Join the Registry</p>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                        <p className="text-sm text-gray-400">Join our clinical monitoring platform</p>
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
                                <input type="text" name="name" className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="John Doe" required value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                                <input type="email" name="email" className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="john@example.com" required value={formData.email} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
                            <input type="password" name="password" className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Current Age</label>
                                <input type="number" name="age" className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="72" value={formData.age} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Phone Number</label>
                                <input type="text" name="phone" className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none" placeholder="+1 234 567 890" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Creating Profile..." : "Complete Registration"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center space-y-4">
                        <p className="text-sm text-gray-400">
                            Already registered? <Link to="/login/patient" className="text-primary font-bold hover:underline">Sign In</Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Patient Privacy Protected</p>
            </div>
        </div>
    );
}
