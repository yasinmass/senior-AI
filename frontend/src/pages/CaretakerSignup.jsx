import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doctorSignup } from '../utils/api';

export default function CaretakerSignup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', specialty: 'Caretaker' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await doctorSignup(form);
            if (data.success) {
                localStorage.setItem('role', 'caretaker');
                navigate('/login/caretaker');
            } else {
                setError(data.error || 'Registration failed.');
            }
        } catch {
            setError('Connection error.');
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'linear-gradient(135deg, #1B4F6E, #2A6F97)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(27,79,110,0.3)',
                    }}>
                        <svg width={28} height={28} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D' }}>
                            SeniorMind <span style={{ color: '#14bdac' }}>AI</span>
                        </h1>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#94A3B5', marginTop: 4 }}>Caretaker Registration</p>
                    </div>
                </div>

                <div className="auth-card">
                    <div style={{ marginBottom: 28, textAlign: 'center' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2F3D', marginBottom: 6 }}>Create Account</h2>
                        <p style={{ fontSize: 15, color: '#94A3B5' }}>Register as a caretaker</p>
                    </div>

                    {error && (
                        <div style={{ background: '#FDEAEA', border: '1px solid #F5C6C6', padding: '14px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <span style={{ fontSize: 18 }}>⚠️</span>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#C0392B' }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4A5D6F', marginBottom: 6 }}>Full Name</label>
                            <input type="text" style={inputStyle} placeholder="Your name" required value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                onFocus={e => e.target.style.borderColor = '#2A6F97'}
                                onBlur={e => e.target.style.borderColor = '#E2E7ED'}
                            />
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4A5D6F', marginBottom: 6 }}>Email</label>
                            <input type="email" style={inputStyle} placeholder="caretaker@example.com" required value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                onFocus={e => e.target.style.borderColor = '#2A6F97'}
                                onBlur={e => e.target.style.borderColor = '#E2E7ED'}
                            />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4A5D6F', marginBottom: 6 }}>Password</label>
                            <input type="password" style={inputStyle} placeholder="••••••••" required value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                onFocus={e => e.target.style.borderColor = '#2A6F97'}
                                onBlur={e => e.target.style.borderColor = '#E2E7ED'}
                            />
                        </div>

                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '16px 0',
                            background: '#1B4F6E', color: '#fff',
                            fontSize: 16, fontWeight: 600, fontFamily: 'inherit',
                            borderRadius: 10, border: 'none', cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(27,79,110,0.3)',
                            opacity: loading ? 0.6 : 1,
                        }}>
                            {loading ? "Creating account..." : "Register as Caretaker"}
                        </button>
                    </form>

                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E7ED', textAlign: 'center' }}>
                        <p style={{ fontSize: 15, color: '#6B7D8F' }}>
                            Already registered?{' '}
                            <Link to="/login/caretaker" style={{ color: '#2A6F97', fontWeight: 600 }}>Login here</Link>
                        </p>
                        <Link to="/" style={{ display: 'block', marginTop: 12, fontSize: 14, color: '#94A3B5', fontWeight: 500 }}>
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
