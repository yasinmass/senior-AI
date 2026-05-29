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
                localStorage.setItem('doctor_id', data.doctor.id);
                localStorage.setItem('doctor_name', data.doctor.name);
                localStorage.setItem('doctor_email', data.doctor.email);
                localStorage.setItem('role', 'doctor');
                navigate('/doctor');
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
            <div className="fade-in" style={{ width: '100%', maxWidth: 560 }}>
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
                            SeniorMind <span style={{ color: '#14bdac' }}>AI</span>
                        </h1>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#94A3B5', marginTop: 4 }}>Professional Enrollment</p>
                    </div>
                </div>

                {/* Card */}
                <div className="auth-card" style={{ maxWidth: 560 }}>
                    <div style={{ marginBottom: 28, textAlign: 'center' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2F3D', marginBottom: 6 }}>Create Professional Account</h2>
                        <p style={{ fontSize: 15, color: '#94A3B5' }}>Register as a clinical specialist</p>
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
                                <input type="text" name="name" style={inputStyle} placeholder="Dr. Jane Smith" required value={formData.name} onChange={handleChange}
                                    onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Work Email</label>
                                <input type="email" name="email" style={inputStyle} placeholder="dr@hospital.com" required value={formData.email} onChange={handleChange}
                                    onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Password</label>
                            <input type="password" name="password" style={inputStyle} placeholder="••••••••" required value={formData.password} onChange={handleChange}
                                onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>Hospital / Clinic</label>
                                <input type="text" name="hospital" style={inputStyle} placeholder="Name of institution" value={formData.hospital} onChange={handleChange}
                                    onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
                            </div>
                            <div>
                                <label style={labelStyle}>Specialization</label>
                                <select name="specialization" style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} value={formData.specialization} onChange={handleChange}>
                                    <option value="Neurology">Neurology</option>
                                    <option value="Psychiatry">Psychiatry</option>
                                    <option value="Geriatrics">Geriatrics</option>
                                    <option value="Primary Care">Primary Care</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>Medical License Number</label>
                            <input type="text" name="license_number" style={inputStyle} placeholder="Ex: ML-12345" value={formData.license_number} onChange={handleChange}
                                onFocus={e => e.target.style.borderColor = '#2A6F97'} onBlur={e => e.target.style.borderColor = '#E2E7ED'} />
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
                            {loading ? "Registering..." : "Create Professional Account"}
                        </button>
                    </form>

                    <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E7ED', textAlign: 'center' }}>
                        <p style={{ fontSize: 15, color: '#6B7D8F' }}>
                            Already have an account?{' '}
                            <Link to="/login/doctor" style={{ color: '#2A6F97', fontWeight: 600 }}>Sign In</Link>
                        </p>
                    </div>
                </div>

                <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#CBD3DC', fontWeight: 500 }}>
                    🏥 Institutional Verification Required
                </p>
            </div>
        </div>
    );
}
