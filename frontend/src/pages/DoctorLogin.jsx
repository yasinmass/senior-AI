import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doctorLogin } from '../utils/api';

export default function DoctorLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await doctorLogin(email, password);
            if (data.success) {
                sessionStorage.setItem('doctor_id', data.doctor.id);
                sessionStorage.setItem('doctor_name', data.doctor.name);
                sessionStorage.setItem('doctor_email', data.doctor.email);
                sessionStorage.setItem('role', 'doctor');
                navigate('/doctor');
            } else {
                setError(data.error || 'Invalid doctor credentials.');
            }
        } catch {
            setError('Connection error. Please verify clinician services.');
        } finally { setLoading(false); }
    }

    return (
        <div className="auth-page px-6">
            <div className="fade-in w-full max-w-[480px]">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-900/50">
                        <svg width={32} height={32} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white">NeuroScan <span className="text-teal-400">AI</span></h1>
                        <p className="text-xs font-semibold text-teal-500/60 uppercase tracking-widest mt-1">Specialist Portal</p>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Login</h2>
                        <p className="text-sm text-gray-400">Access your clinical dashboard</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in shake">
                            <span className="text-red-500">⚠️</span>
                            <p className="text-xs font-bold text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Professional Email</label>
                            <input
                                type="email"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none"
                                placeholder="dr.smith@example.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-gray-500">Password</label>
                                <a href="#" className="text-xs font-bold text-teal-600 hover:underline">Support</a>
                            </div>
                            <input
                                type="password"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-teal-500 focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm shadow-xl shadow-black/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Authenticating..." : "Login to Doctor Suite"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center space-y-4">
                        <p className="text-sm text-gray-400">
                            Need professional access? <Link to="/signup/doctor" className="text-teal-600 font-bold hover:underline">Register Practice</Link>
                        </p>
                        <Link to="/login/patient" className="block text-xs font-bold text-gray-300 hover:text-gray-500 transition-colors">
                            Return to Patient Login →
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Encrypted Clinician Access</p>
            </div>
        </div>
    );
}
