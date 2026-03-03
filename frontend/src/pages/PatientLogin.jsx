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
                sessionStorage.setItem('role', 'patient');
                navigate('/patient');
            } else {
                setError(data.error || 'Invalid credentials.');
            }
        } catch {
            setError('Connection error. Please ensure the server is running.');
        } finally { setLoading(false); }
    }

    return (
        <div className="auth-page px-6">
            <div style={{ width: '100%', maxWidth: 1000, display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: 60, alignItems: 'center' }}>
                <div className="fade-in hidden md:block">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
                            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-black text-gray-900 tracking-tighter">NeuroScan AI</span>
                    </div>
                    <h2 style={{ fontSize: 52, fontWeight: 900, color: 'var(--gray-900)', lineHeight: 1.1, marginBottom: 24 }}>
                        Your Path to <br /><span style={{ color: 'var(--primary)' }}>Brain Wellness</span> starts here.
                    </h2>
                    <p style={{ fontSize: 18, color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 32 }}>
                        Access your screening results, track your daily exercises, and monitor your cognitive health journey in real-time.
                    </p>
                    <div className="grid gap-6">
                        {[
                            { icon: '📊', title: 'Personalized Reports', desc: 'Detailed breakdown of your cognitive performance.' },
                            { icon: '🧘', title: 'Wellness Exercises', desc: 'Daily activities to keep your mind sharp.' },
                        ].map((f, i) => (
                            <div key={i} className="flex gap-4 items-center p-4 bg-white/50 rounded-2xl border border-white">
                                <span className="text-3xl">{f.icon}</span>
                                <div>
                                    <h4 className="font-bold text-gray-900">{f.title}</h4>
                                    <p className="text-sm text-gray-500">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="auth-card fade-in bg-white/80 backdrop-blur-xl border-none shadow-2xl p-10 rounded-[40px]">
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div className="badge badge-primary mb-4 p-2 px-4 rounded-full font-black text-[10px] uppercase tracking-widest">Patient Wellness Portal</div>
                        <h3 style={{ fontSize: 32, fontWeight: 900, color: 'var(--gray-900)', marginBottom: 8, tracking: '-0.03em' }}>Welcome Back</h3>
                        <p style={{ fontSize: 14, color: 'var(--gray-500)', fontWeight: 500 }}>Sign in to continue your cognitive journey</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold mb-8 flex gap-3 items-center">
                            <span>❌</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="form-group">
                            <label className="form-label uppercase tracking-widest text-[10px] font-black text-gray-400 mb-2 block">Email Address</label>
                            <input type="email" className="form-control py-4 px-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50" placeholder="jane.doe@example.com" required
                                value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <div className="flex justify-between items-center mb-2">
                                <label className="form-label uppercase tracking-widest text-[10px] font-black text-gray-400 block mb-0">Password</label>
                                <a href="#" className="text-[10px] font-black uppercase text-teal-600 tracking-widest">Forgot Access?</a>
                            </div>
                            <input type="password" className="form-control py-4 px-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50" placeholder="••••••••" required
                                value={password} onChange={e => setPassword(e.target.value)} />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full py-5 rounded-2xl shadow-xl shadow-teal-100 font-extrabold uppercase tracking-widest text-sm" disabled={loading}>
                            {loading ? <span className="spin">⟳</span> : null}
                            {loading ? ' Securely Signing In…' : 'Patient Sign In →'}
                        </button>
                    </form>

                    <div className="text-center mt-10">
                        <p className="text-gray-500 font-medium italic">
                            New to NeuroScan? <Link to="/signup/patient" className="text-primary font-black underline underline-offset-4 decoration-2 decoration-primary/20">Create Patient Profile</Link>
                        </p>
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                        <Link to="/login/doctor" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-teal-600 transition-colors">
                            Switch to Clinician Access →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
