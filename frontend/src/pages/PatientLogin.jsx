import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../utils/api';

export default function PatientLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await login(email, password);
            if (data.success) {
                sessionStorage.setItem('patient_id', data.patient.id);
                sessionStorage.setItem('patient_name', data.patient.name);
                sessionStorage.setItem('patient_email', data.patient.email);
                sessionStorage.setItem('role', 'patient');
                navigate('/patient');
            } else {
                setError(data.error || 'Invalid credentials.');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally { setLoading(false); }
    }

    return (
        <div className="auth-page px-6">
            <div className="fade-in w-full max-w-[480px]">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                        <svg width={32} height={32} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white">NeuroScan <span className="text-primary-pale">AI</span></h1>
                        <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest mt-1">Patient Portal</p>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-sm text-gray-400">Login to access your screening results</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 animate-in shake">
                            <span className="text-red-500">⚠️</span>
                            <p className="text-xs font-bold text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-gray-500">Password</label>
                                <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot?</a>
                            </div>
                            <input
                                type="password"
                                className="w-full bg-gray-50 border border-gray-100 focus:border-primary focus:bg-white px-5 py-4 rounded-xl text-sm font-medium transition-all outline-none"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Logging in..." : "Login to Portal"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center space-y-4">
                        <p className="text-sm text-gray-400">
                            No account yet? <Link to="/signup/patient" className="text-primary font-bold hover:underline">Create Profile</Link>
                        </p>
                        <Link to="/login/doctor" className="block text-xs font-bold text-gray-300 hover:text-gray-500 transition-colors">
                            Professional Access Portal →
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Secure Clinical Gateway</p>
            </div>
        </div>
    );
}
