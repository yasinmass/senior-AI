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
            setError('Connection error. Please verify services.');
        } finally { setLoading(false); }
    }

    const inputStyle = {
        width: '100%', padding: '14px 18px',
        background: '#F4F6F9', border: '2px solid #E2E7ED',
        borderRadius: 10, fontSize: 16, fontFamily: 'inherit',
        color: '#1F2F3D', outline: 'none', transition: 'border-color 0.2s',
    };

    return (
        <div className="auth-page" style={{ padding: 24 }}>
            <div className="fade-in" style={{ width: '100%', maxWidth: 460 }}>
                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'linear-gradient(135deg, #1B4F6E, #2A6F97)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(27,79,110,0.3)',
                    }}>
                        <svg width={28} height={28} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D' }}>
                            NeuroScan <span style={{ color: '#2A6F97' }}>AI</span>
                        </h1>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#94A3B5', marginTop: 4 }}>Healthcare Professional Portal</p>
                    </div>
                </div>

                {/* Card */}
                <div className="auth-card">
                    <div style={{ marginBottom: 28, textAlign: 'center' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2F3D', marginBottom: 6 }}>Doctor Login</h2>
                        <p style={{ fontSize: 15, color: '#94A3B5' }}>Access your clinical dashboard</p>
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
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4A5D6F', marginBottom: 6 }}>Professional Email</label>
                            <input
                                type="email"
                                style={inputStyle}
                                placeholder="dr.smith@hospital.com"
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
                                <a href="#" style={{ fontSize: 13, fontWeight: 600, color: '#2A6F97' }}>Need Help?</a>
                            </div>
                            <input
                                type="password"
                                style={inputStyle}
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
                                background: '#1B4F6E', color: '#fff',
                                fontSize: 16, fontWeight: 600, fontFamily: 'inherit',
                                borderRadius: 10, border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(27,79,110,0.3)',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? "Authenticating..." : "Login to Doctor Suite"}
                        </button>
                    </form>

                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E7ED', textAlign: 'center' }}>
                        <p style={{ fontSize: 15, color: '#6B7D8F' }}>
                            Need access?{' '}
                            <Link to="/signup/doctor" style={{ color: '#2A6F97', fontWeight: 600 }}>Register Practice</Link>
                        </p>
                        <Link to="/login/patient" style={{ display: 'block', marginTop: 12, fontSize: 14, color: '#94A3B5', fontWeight: 500 }}>
                            ← Return to Patient Login
                        </Link>
                    </div>
                </div>

                <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#CBD3DC', fontWeight: 500 }}>
                    🔒 Encrypted Clinical Access
                </p>
            </div>
        </div>
    );
}
