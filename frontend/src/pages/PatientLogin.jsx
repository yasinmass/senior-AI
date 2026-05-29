import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getMyProfile } from '../utils/api';

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
                localStorage.clear(); // clear any stale role from previous login

                // Get profile to store preferred language
                const profileRes = await getMyProfile();
                if (profileRes.success && profileRes.patient) {
                    localStorage.setItem('patient_language', profileRes.patient.preferred_lang || 'en');
                }

                localStorage.setItem('patient_id', data.patient.id);
                localStorage.setItem('patient_name', data.patient.name);
                localStorage.setItem('patient_email', data.patient.email);
                localStorage.setItem('role', 'patient');
                navigate('/patient');
            } else {
                setError(data.error || 'Invalid credentials.');
            }
        } catch {
            setError('Connection error. Please try again.');
        } finally { setLoading(false); }
    }

    return (
        <div className="auth-page" style={{ padding: 24 }}>
            <div className="fade-in" style={{ width: '100%', maxWidth: 460 }}>
                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'linear-gradient(135deg, #2A6F97, #3A8FBF)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(42,111,151,0.25)',
                    }}>
                        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.5 2 6 4.5 6 7.5c0 1.5.5 2.8 1.5 3.8C6 12 5 13.5 5 15.5 5 18.5 7.5 21 10.5 21c1 0 1.5-.2 1.5-.2s.5.2 1.5.2C16.5 21 19 18.5 19 15.5c0-2-1-3.5-2.5-4.2 1-.9 1.5-2.3 1.5-3.8C18 4.5 15.5 2 12 2z" />
                            <path strokeLinecap="round" d="M12 6v6M9.5 9h5" />
                            <circle cx="12" cy="16" r="1.5" fill="#fff" stroke="none" />
                        </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D' }}>
                            SeniorMind <span style={{ color: '#14bdac' }}>AI</span>
                        </h1>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#94A3B5', marginTop: 4 }}>Patient Portal</p>
                    </div>
                </div>

                {/* Card */}
                <div className="auth-card">
                    <div style={{ marginBottom: 28, textAlign: 'center' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2F3D', marginBottom: 6 }}>Welcome Back</h2>
                        <p style={{ fontSize: 15, color: '#94A3B5' }}>Login to access your screening results</p>
                    </div>

                    {error && (
                        <div style={{
                            background: '#FDEAEA', border: '1px solid #F5C6C6',
                            padding: '14px 16px', borderRadius: 10,
                            display: 'flex', alignItems: 'center', gap: 10,
                            marginBottom: 20,
                        }}>
                            <span style={{ fontSize: 18 }}>⚠️</span>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#C0392B' }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4A5D6F', marginBottom: 6 }}>Email Address</label>
                            <input
                                type="email"
                                style={{
                                    width: '100%', padding: '14px 18px',
                                    background: '#F4F6F9', border: '2px solid #E2E7ED',
                                    borderRadius: 10, fontSize: 16, fontFamily: 'inherit',
                                    color: '#1F2F3D', outline: 'none', transition: 'border-color 0.2s',
                                }}
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onFocus={e => e.target.style.borderColor = '#2A6F97'}
                                onBlur={e => e.target.style.borderColor = '#E2E7ED'}
                            />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <label style={{ fontSize: 14, fontWeight: 600, color: '#4A5D6F' }}>Password</label>
                                <a href="#" style={{ fontSize: 13, fontWeight: 600, color: '#2A6F97' }}>Forgot?</a>
                            </div>
                            <input
                                type="password"
                                style={{
                                    width: '100%', padding: '14px 18px',
                                    background: '#F4F6F9', border: '2px solid #E2E7ED',
                                    borderRadius: 10, fontSize: 16, fontFamily: 'inherit',
                                    color: '#1F2F3D', outline: 'none', transition: 'border-color 0.2s',
                                }}
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={e => e.target.style.borderColor = '#2A6F97'}
                                onBlur={e => e.target.style.borderColor = '#E2E7ED'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '16px 0',
                                background: '#2A6F97', color: '#fff',
                                fontSize: 16, fontWeight: 600, fontFamily: 'inherit',
                                borderRadius: 10, border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(42,111,151,0.25)',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? "Logging in..." : "Login to Portal"}
                        </button>
                    </form>

                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E7ED', textAlign: 'center' }}>
                        <p style={{ fontSize: 15, color: '#6B7D8F' }}>
                            No account yet?{' '}
                            <Link to="/signup/patient" style={{ color: '#2A6F97', fontWeight: 600 }}>Create Profile</Link>
                        </p>
                        <Link to="/login/doctor" style={{ display: 'block', marginTop: 12, fontSize: 14, color: '#94A3B5', fontWeight: 500 }}>
                            Healthcare Professional? Login here →
                        </Link>
                    </div>
                </div>

                <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#CBD3DC', fontWeight: 500 }}>
                    🔒 Secure & Encrypted Connection
                </p>
            </div>
        </div>
    );
}
