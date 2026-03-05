import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Hospital + Brain SVG Logo component
function Logo({ size = 40 }) {
    return (
        <div style={{
            width: size, height: size,
            background: 'linear-gradient(135deg, #2A6F97, #3A8FBF)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(42,111,151,0.25)'
        }}>
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.5 2 6 4.5 6 7.5c0 1.5.5 2.8 1.5 3.8C6 12 5 13.5 5 15.5 5 18.5 7.5 21 10.5 21c1 0 1.5-.2 1.5-.2s.5.2 1.5.2C16.5 21 19 18.5 19 15.5c0-2-1-3.5-2.5-4.2 1-.9 1.5-2.3 1.5-3.8C18 4.5 15.5 2 12 2z" />
                <path strokeLinecap="round" d="M12 6v6M9.5 9h5" />
                <circle cx="12" cy="16" r="1.5" fill="#fff" stroke="none" />
            </svg>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const modules = [
        {
            icon: '🎙️',
            title: 'Voice Analysis',
            desc: 'AI-powered speech pattern analysis detects cognitive decline through voice biomarkers.',
            marks: '40 marks',
            color: '#2A6F97'
        },
        {
            icon: '🧠',
            title: 'MMSE Assessment',
            desc: 'Mini-Mental State Examination tests memory, orientation, and cognitive function.',
            marks: '30 marks',
            color: '#3A8FBF'
        },
        {
            icon: '📋',
            title: 'MoCA Screening',
            desc: 'Montreal Cognitive Assessment with comprehensive evaluation of multiple cognitive domains.',
            marks: '30 marks',
            color: '#6BCB77'
        },
    ];

    const trustItems = [
        { icon: '🔒', text: 'HIPAA Compliant' },
        { icon: '🏥', text: 'Clinically Validated' },
        { icon: '🤖', text: '94.2% AI Accuracy' },
        { icon: '👨‍⚕️', text: 'Doctor Reviewed' },
    ];

    return (
        <div style={{ background: '#fff', minHeight: '100vh' }}>
            {/* ─── Sticky Navbar ─────────────────────────────────────────── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                transition: 'all 0.3s ease',
                background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
                backdropFilter: scrolled ? 'blur(12px)' : 'none',
                boxShadow: scrolled ? '0 2px 12px rgba(42,111,151,0.08)' : 'none',
                padding: scrolled ? '12px 0' : '20px 0',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Logo size={42} />
                        <div>
                            <span style={{ fontSize: 18, fontWeight: 700, color: '#1F2F3D' }}>NeuroScan</span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: '#2A6F97' }}> AI</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <a href="#modules" style={{ padding: '10px 16px', fontSize: 15, fontWeight: 500, color: '#4A5D6F', borderRadius: 8, transition: 'all 0.2s' }}>Features</a>
                        <a href="#about" style={{ padding: '10px 16px', fontSize: 15, fontWeight: 500, color: '#4A5D6F', borderRadius: 8, transition: 'all 0.2s' }}>About</a>
                        <div style={{ width: 1, height: 24, background: '#E2E7ED', margin: '0 8px' }} />
                        <Link to="/login/patient" style={{ padding: '10px 18px', fontSize: 15, fontWeight: 600, color: '#2A6F97', borderRadius: 8, transition: 'all 0.2s' }}>Patient Login</Link>
                        <Link to="/login/doctor" style={{
                            padding: '10px 20px',
                            background: '#2A6F97',
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 600,
                            borderRadius: 10,
                            boxShadow: '0 4px 14px rgba(42,111,151,0.25)',
                            transition: 'all 0.2s',
                        }}>Doctor Portal</Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ──────────────────────────────────────────── */}
            <section style={{
                position: 'relative',
                paddingTop: 140,
                paddingBottom: 80,
                background: 'linear-gradient(180deg, #F4F6F9 0%, #FFFFFF 100%)',
                overflow: 'hidden',
            }}>
                {/* Subtle background decorations */}
                <div style={{
                    position: 'absolute', top: -100, right: -100,
                    width: 500, height: 500,
                    background: 'radial-gradient(circle, rgba(42,111,151,0.06) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', bottom: -50, left: -80,
                    width: 400, height: 400,
                    background: 'radial-gradient(circle, rgba(107,203,119,0.06) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none'
                }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    {/* Badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 20px',
                        background: 'rgba(42,111,151,0.08)',
                        borderRadius: 100,
                        border: '1px solid rgba(42,111,151,0.15)',
                        marginBottom: 32,
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6BCB77', display: 'inline-block' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#2A6F97', letterSpacing: '0.03em' }}>AI-Powered Cognitive Screening Platform</span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(36px, 5vw, 56px)',
                        fontWeight: 800,
                        color: '#1F2F3D',
                        lineHeight: 1.15,
                        marginBottom: 24,
                        maxWidth: 750,
                        margin: '0 auto 24px',
                    }}>
                        Early Dementia Screening{' '}
                        <span style={{ color: '#2A6F97' }}>Made Simple</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(16px, 2vw, 20px)',
                        color: '#6B7D8F',
                        lineHeight: 1.7,
                        maxWidth: 620,
                        margin: '0 auto 40px',
                        fontWeight: 400,
                    }}>
                        A comprehensive AI-powered diagnostic platform combining voice analysis, MMSE, and MoCA assessments for trusted, early cognitive health evaluation.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
                        <button
                            onClick={() => navigate('/signup/patient')}
                            style={{
                                padding: '16px 36px',
                                background: '#2A6F97',
                                color: '#fff',
                                fontSize: 18,
                                fontWeight: 700,
                                borderRadius: 12,
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 6px 24px rgba(42,111,151,0.3)',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                            }}
                        >
                            Start Assessment →
                        </button>
                        <button
                            onClick={() => navigate('/login/doctor')}
                            style={{
                                padding: '16px 36px',
                                background: '#fff',
                                color: '#2A6F97',
                                fontSize: 18,
                                fontWeight: 700,
                                borderRadius: 12,
                                border: '2px solid #2A6F97',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                            }}
                        >
                            Healthcare Professional
                        </button>
                    </div>

                    {/* Trust indicators */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                        {trustItems.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 16px',
                                background: '#fff',
                                borderRadius: 8,
                                border: '1px solid #E2E7ED',
                                boxShadow: '0 2px 8px rgba(42,111,151,0.05)',
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#4A5D6F',
                            }}>
                                <span>{item.icon}</span>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── User Cards Section ────────────────────────────────────── */}
            <section style={{ background: '#fff', padding: '60px 0' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
                    {/* Patient Card */}
                    <div style={{
                        background: '#F4F6F9',
                        borderRadius: 16,
                        padding: 36,
                        border: '1px solid #E2E7ED',
                        transition: 'all 0.2s',
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 16 }}>👤</div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D', marginBottom: 10 }}>For Patients</h3>
                        <p style={{ fontSize: 15, color: '#6B7D8F', lineHeight: 1.7, marginBottom: 24 }}>
                            Take AI-powered cognitive screening tests, track your brain health, and access your results securely.
                        </p>
                        <button
                            onClick={() => navigate('/signup/patient')}
                            style={{
                                width: '100%', padding: '14px 0',
                                background: '#2A6F97', color: '#fff',
                                fontSize: 16, fontWeight: 600,
                                borderRadius: 10, border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(42,111,151,0.25)',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                            }}
                        >
                            Start Free Screening
                        </button>
                    </div>

                    {/* Doctor Card */}
                    <div style={{
                        background: '#2A6F97',
                        borderRadius: 16,
                        padding: 36,
                        transition: 'all 0.2s',
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 16 }}>🩺</div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 10 }}>For Doctors</h3>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 24 }}>
                            Access your clinical dashboard with patient data, screening reports, and longitudinal health tracking.
                        </p>
                        <button
                            onClick={() => navigate('/login/doctor')}
                            style={{
                                width: '100%', padding: '14px 0',
                                background: '#6BCB77', color: '#1F2F3D',
                                fontSize: 16, fontWeight: 600,
                                borderRadius: 10, border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(107,203,119,0.3)',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                            }}
                        >
                            Provider Portal
                        </button>
                    </div>
                </div>
            </section>

            {/* ─── Modules Section ───────────────────────────────────────── */}
            <section id="modules" style={{ background: '#F4F6F9', padding: '80px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
                        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 700, color: '#1F2F3D', marginBottom: 16 }}>
                            Three Screening Modules
                        </h2>
                        <p style={{ fontSize: 17, color: '#6B7D8F', lineHeight: 1.7 }}>
                            Our platform combines three validated assessment methods for a comprehensive cognitive evaluation scored out of 100.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                        {modules.map((m, i) => (
                            <div key={i} style={{
                                background: '#fff',
                                borderRadius: 16,
                                padding: 36,
                                border: '1px solid #E2E7ED',
                                boxShadow: '0 2px 12px rgba(42,111,151,0.06)',
                                transition: 'all 0.2s',
                            }}>
                                <div style={{
                                    width: 56, height: 56,
                                    background: `${m.color}12`,
                                    borderRadius: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, marginBottom: 20,
                                }}>{m.icon}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1F2F3D' }}>{m.title}</h3>
                                    <span style={{
                                        background: `${m.color}15`,
                                        color: m.color,
                                        padding: '4px 10px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 600,
                                    }}>{m.marks}</span>
                                </div>
                                <p style={{ fontSize: 15, color: '#6B7D8F', lineHeight: 1.7 }}>{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── About / How It Works ──────────────────────────────────── */}
            <section id="about" style={{ background: '#fff', padding: '80px 0' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 36px)', fontWeight: 700, color: '#1F2F3D', marginBottom: 16 }}>
                        How It Works
                    </h2>
                    <p style={{ fontSize: 17, color: '#6B7D8F', lineHeight: 1.7, maxWidth: 600, margin: '0 auto 48px' }}>
                        Complete three simple steps to receive your comprehensive cognitive health assessment.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
                        {[
                            { step: '1', title: 'Create Account', desc: 'Sign up securely in under a minute. Your data stays private and encrypted.', color: '#2A6F97' },
                            { step: '2', title: 'Take 3 Tests', desc: 'Complete voice, MMSE, and MoCA assessments at your own pace from home.', color: '#3A8FBF' },
                            { step: '3', title: 'View Results', desc: 'Get instant AI-powered analysis with risk scoring and professional recommendations.', color: '#6BCB77' },
                        ].map((s, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    width: 56, height: 56,
                                    borderRadius: '50%',
                                    background: s.color,
                                    color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, fontWeight: 700,
                                    marginBottom: 16,
                                    boxShadow: `0 6px 20px ${s.color}40`,
                                }}>{s.step}</div>
                                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#1F2F3D', marginBottom: 8 }}>{s.title}</h4>
                                <p style={{ fontSize: 15, color: '#6B7D8F', lineHeight: 1.6 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Footer ───────────────────────────────────────────────── */}
            <footer style={{ background: '#F4F6F9', borderTop: '1px solid #E2E7ED', padding: '60px 0 32px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
                        {/* Brand */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <Logo size={36} />
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#1F2F3D' }}>NeuroScan AI</span>
                            </div>
                            <p style={{ fontSize: 14, color: '#6B7D8F', lineHeight: 1.7, marginBottom: 16 }}>
                                Early detection and monitoring for cognitive conditions using advanced machine learning.
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ padding: '6px 12px', background: '#fff', borderRadius: 6, border: '1px solid #E2E7ED', fontSize: 12, fontWeight: 600, color: '#6B7D8F' }}>HIPAA Compliant</span>
                                <span style={{ padding: '6px 12px', background: '#fff', borderRadius: 6, border: '1px solid #E2E7ED', fontSize: 12, fontWeight: 600, color: '#6B7D8F' }}>GDPR Ready</span>
                            </div>
                        </div>

                        {/* Patient Links */}
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1F2F3D', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Tools</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <Link to="/signup/patient" style={{ fontSize: 15, color: '#6B7D8F', transition: 'color 0.2s' }}>Start Screening</Link>
                                <Link to="/login/patient" style={{ fontSize: 15, color: '#6B7D8F', transition: 'color 0.2s' }}>Secure Sign In</Link>
                                <a href="#" style={{ fontSize: 15, color: '#6B7D8F' }}>Privacy Policy</a>
                            </div>
                        </div>

                        {/* Doctor Links */}
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1F2F3D', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>For Professionals</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <Link to="/login/doctor" style={{ fontSize: 15, color: '#6B7D8F' }}>Doctor Login</Link>
                                <Link to="/signup/doctor" style={{ fontSize: 15, color: '#6B7D8F' }}>Register Practice</Link>
                                <a href="#" style={{ fontSize: 15, color: '#6B7D8F' }}>Contact Support</a>
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1F2F3D', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <span style={{ fontSize: 15, color: '#6B7D8F' }}>support@neuroscan.ai</span>
                                <span style={{ fontSize: 15, color: '#6B7D8F' }}>+1 (800) NEURO-AI</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div style={{
                        borderTop: '1px solid #E2E7ED',
                        paddingTop: 24,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: 12,
                    }}>
                        <p style={{ fontSize: 13, color: '#94A3B5' }}>© 2026 NeuroScan AI. All rights reserved.</p>
                        <p style={{ fontSize: 12, color: '#94A3B5', fontStyle: 'italic', maxWidth: 500 }}>
                            Disclaimer: This tool is for screening purposes only and does not constitute a medical diagnosis. Consult a healthcare professional for clinical evaluation.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
