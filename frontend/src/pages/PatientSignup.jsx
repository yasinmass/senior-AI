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

    const inputStyle = {
        width: '100%', padding: '14px 18px',
        background: '#F4F6F9', border: '2px solid #E2E7ED',
        borderRadius: 10, fontSize: 16, fontFamily: 'inherit',
        color: '#1F2F3D', outline: 'none', transition: 'border-color 0.2s',
    };

    const labelStyle = { display: 'block', fontSize: 14, fontWeight: 600, color: '#4A5D6F', marginBottom: 6 };

    return (
        <div className="auth-page" style={{ padding: 24 }}>
            <div className="fade-in" style={{ width: '100%', maxWidth: 520 }}>
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
                            NeuroScan <span style={{ color: '#2A6F97' }}>AI</span>
                        </h1>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#94A3B5', marginTop: 4 }}>Create Your Account</p>
                    </div>
                </div>

                {/* Card */}
                <div className="auth-card" style={{ maxWidth: 520 }}>
                    <div style={{ marginBottom: 28, textAlign: 'center' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2F3D', marginBottom: 6 }}>Patient Registration</h2>
                        <p style={{ fontSize: 15, color: '#94A3B5' }}>Join our cognitive health monitoring platform</p>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>Full Name</label>
                                <input type="text" name="name" style={inputStyle} placeholder="John Doe" required value={formData.name} onChange={handleChange}
                                    onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Email Address</label>
                                <input type="email" name="email" style={inputStyle} placeholder="john@example.com" required value={formData.email} onChange={handleChange}
                                    onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Password</label>
                            <input type="password" name="password" style={inputStyle} placeholder="Create a secure password" required value={formData.password} onChange={handleChange}
                                onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                            <div>
                                <label style={labelStyle}>Age</label>
                                <input type="number" name="age" style={inputStyle} placeholder="72" value={formData.age} onChange={handleChange}
                                    onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone Number</label>
                                <input type="text" name="phone" style={inputStyle} placeholder="+1 234 567 890" value={formData.phone} onChange={handleChange}
                                    onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                            </div>
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
                            {loading ? "Creating Profile..." : "Complete Registration"}
                        </button>
                    </form>

                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E7ED', textAlign: 'center' }}>
                        <p style={{ fontSize: 15, color: '#6B7D8F' }}>
                            Already registered?{' '}
                            <Link to="/login/patient" style={{ color: '#2A6F97', fontWeight: 600 }}>Sign In</Link>
                        </p>
                    </div>
                </div>

                <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#CBD3DC', fontWeight: 500 }}>
                    🔒 Your data is protected with encryption
                </p>
            </div>
        </div>
    );
}
