import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Logo component — teal brain mark
function Logo({ size = 40 }) {
    return (
        <div style={{
            width: size, height: size,
            background: 'linear-gradient(135deg, #14bdac, #2A6F97)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(20,189,172,0.3)',
            flexShrink: 0,
        }}>
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.5 2 6 4.5 6 7.5c0 1.5.5 2.8 1.5 3.8C6 12 5 13.5 5 15.5 5 18.5 7.5 21 10.5 21c1 0 1.5-.2 1.5-.2s.5.2 1.5.2C16.5 21 19 18.5 19 15.5c0-2-1-3.5-2.5-4.2 1-.9 1.5-2.3 1.5-3.8C18 4.5 15.5 2 12 2z" />
                <path strokeLinecap="round" d="M12 6v6M9.5 9h5" />
                <circle cx="12" cy="16" r="1.5" fill="#fff" stroke="none" />
            </svg>
        </div>
    );
}

const FEATURES = [
    {
        icon: '🤖',
        title: 'AI Companion — Bhavi',
        desc: 'Your personal AI friend who listens, remembers your diary, and speaks back in your language. Always available, always caring.',
        color: '#2A6F97',
    },
    {
        icon: '📔',
        title: 'Voice Diary',
        desc: 'Simply speak your thoughts in Tamil, Hindi, or English. Bhavi converts your voice to text and analyses your mood every day.',
        color: '#14bdac',
    },
    {
        icon: '🧠',
        title: 'Dementia Screening',
        desc: 'Clinically validated MMSE and MoCA assessments combined with AI voice analysis for early cognitive health evaluation.',
        color: '#3A8FBF',
    },
    {
        icon: '🌍',
        title: 'Multilingual Support',
        desc: 'Fully supports Tamil, Hindi, and English. Seniors can speak and read in their own language — no tech literacy needed.',
        color: '#6BCB77',
    },
];

const TRUST = [
    { icon: '🔒', text: 'HIPAA Compliant' },
    { icon: '🧠', text: 'Clinically Validated' },
    { icon: '🎯', text: '94.2% AI Accuracy' },
    { icon: '👨‍⚕️', text: 'Doctor Reviewed' },
];

const STATS = [
    { value: '10+', label: 'Languages Supported' },
    { value: '94.2%', label: 'AI Accuracy' },
    { value: '24/7', label: 'Availability' },
    { value: '0', label: 'Tech Literacy Required' },
];

const HOW = [
    {
        icon: '🎙',
        step: '01',
        title: 'Speak',
        desc: 'Senior speaks freely in their language. No typing, no app complexity needed.',
        color: '#2A6F97',
    },
    {
        icon: '🧠',
        step: '02',
        title: 'AI Analyses',
        desc: 'Bhavi listens, analyses mood, detects cognitive patterns, and remembers context from past conversations.',
        color: '#14bdac',
    },
    {
        icon: '📊',
        step: '03',
        title: 'Doctors & Caretakers Informed',
        desc: 'Real-time reports sent to caretakers and doctors. Crisis alerts triggered immediately when needed.',
        color: '#6BCB77',
    },
];

export default function Home() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    return (
        <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'inherit' }}>

            {/* ── Sticky Navbar ─────────────────────────────────────── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                transition: 'all 0.3s ease',
                background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
                backdropFilter: scrolled ? 'blur(14px)' : 'none',
                boxShadow: scrolled ? '0 2px 16px rgba(20,189,172,0.08)' : 'none',
                padding: scrolled ? '12px 0' : '20px 0',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Logo size={40} />
                        <div>
                            <div style={{ fontSize: 17, fontWeight: 800, color: '#1F2F3D', lineHeight: 1.1 }}>
                                SeniorMind <span style={{ color: '#14bdac' }}>AI</span>
                            </div>
                            <div style={{ fontSize: 10.5, color: '#94A3B5', fontWeight: 500, letterSpacing: '0.04em' }}>
                                Voice-First Senior Care Platform
                            </div>
                        </div>
                    </div>

                    {/* Nav links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <a href="#features" style={{ padding: '10px 14px', fontSize: 15, fontWeight: 500, color: '#4A5D6F', borderRadius: 8 }}>Features</a>
                        <a href="#about" style={{ padding: '10px 14px', fontSize: 15, fontWeight: 500, color: '#4A5D6F', borderRadius: 8 }}>About</a>
                        <div style={{ width: 1, height: 22, background: '#E2E7ED', margin: '0 6px' }} />
                        <Link to="/login/patient" style={{ padding: '10px 16px', fontSize: 15, fontWeight: 600, color: '#2A6F97', borderRadius: 8 }}>Patient Login</Link>
                        <Link to="/login/caretaker" style={{ padding: '10px 16px', fontSize: 15, fontWeight: 600, color: '#6B7D8F', borderRadius: 8 }}>Caretaker</Link>
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

            {/* ── Hero Section ──────────────────────────────────────── */}
            <section style={{
                position: 'relative',
                paddingTop: 152,
                paddingBottom: 88,
                background: 'linear-gradient(180deg, #F4F6F9 0%, #FFFFFF 100%)',
                overflow: 'hidden',
            }}>
                {/* Background orbs */}
                <div style={{ position: 'absolute', top: -120, right: -120, width: 560, height: 560, background: 'radial-gradient(circle, rgba(20,189,172,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -80, width: 440, height: 440, background: 'radial-gradient(circle, rgba(107,203,119,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    {/* Badge pill */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '8px 20px',
                        background: 'rgba(20,189,172,0.08)',
                        borderRadius: 100,
                        border: '1px solid rgba(20,189,172,0.18)',
                        marginBottom: 32,
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6BCB77', display: 'inline-block', boxShadow: '0 0 0 3px rgba(107,203,119,0.25)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#14bdac', letterSpacing: '0.03em' }}>
                            🟢 AI-Powered Senior Mental &amp; Cognitive Health
                        </span>
                    </div>

                    {/* Main heading */}
                    <h1 style={{
                        fontSize: 'clamp(34px, 5vw, 58px)',
                        fontWeight: 800,
                        color: '#1F2F3D',
                        lineHeight: 1.13,
                        marginBottom: 24,
                        maxWidth: 780,
                        margin: '0 auto 24px',
                    }}>
                        Senior Mental Health<br />
                        &amp; Dementia Care<br />
                        <span style={{ color: '#14bdac' }}>Made Simple</span>
                    </h1>

                    {/* Subtext */}
                    <p style={{
                        fontSize: 'clamp(16px, 2vw, 19px)',
                        color: '#6B7D8F',
                        lineHeight: 1.75,
                        maxWidth: 640,
                        margin: '0 auto 44px',
                        fontWeight: 400,
                    }}>
                        A comprehensive AI-powered platform combining voice diary, AI companion,
                        and cognitive screening for trusted, early mental health and dementia care
                        for senior citizens.
                    </p>

                    {/* CTA Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 52 }}>
                        <button
                            onClick={() => navigate('/signup/patient')}
                            style={{
                                padding: '16px 38px',
                                background: '#2A6F97',
                                color: '#fff',
                                fontSize: 17,
                                fontWeight: 700,
                                borderRadius: 12,
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 6px 24px rgba(42,111,151,0.3)',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                        >
                            Start Your Journey →
                        </button>
                        <button
                            onClick={() => navigate('/login/doctor')}
                            style={{
                                padding: '16px 38px',
                                background: '#fff',
                                color: '#2A6F97',
                                fontSize: 17,
                                fontWeight: 700,
                                borderRadius: 12,
                                border: '2px solid #2A6F97',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                        >
                            Healthcare Professional
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                        {TRUST.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '8px 18px',
                                background: '#fff',
                                borderRadius: 10,
                                border: '1px solid #E2E7ED',
                                boxShadow: '0 2px 8px rgba(42,111,151,0.06)',
                                fontSize: 13.5,
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

            {/* ── Feature Cards Section ─────────────────────────────── */}
            <section id="features" style={{ background: '#F4F6F9', padding: '88px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    {/* Section header */}
                    <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 52px' }}>
                        <div style={{
                            display: 'inline-block', padding: '5px 16px',
                            background: 'rgba(20,189,172,0.1)',
                            border: '1px solid rgba(20,189,172,0.2)',
                            borderRadius: 100, marginBottom: 16,
                            fontSize: 12, fontWeight: 700, color: '#14bdac', letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                        }}>Platform Features</div>
                        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: '#1F2F3D', marginBottom: 14, lineHeight: 1.2 }}>
                            Everything a Senior Needs, in One Place
                        </h2>
                        <p style={{ fontSize: 16.5, color: '#6B7D8F', lineHeight: 1.75 }}>
                            SeniorMind AI brings voice-first technology, daily companionship, and clinical-grade screening together for senior mental health care.
                        </p>
                    </div>

                    {/* 4 card grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                        {FEATURES.map((f, i) => (
                            <div key={i} style={{
                                background: '#fff',
                                borderRadius: 18,
                                padding: 32,
                                border: '1px solid #E2E7ED',
                                boxShadow: '0 2px 14px rgba(42,111,151,0.06)',
                                transition: 'all 0.22s',
                                cursor: 'default',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(42,111,151,0.12)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 14px rgba(42,111,151,0.06)'; }}
                            >
                                <div style={{
                                    width: 58, height: 58,
                                    background: `${f.color}12`,
                                    borderRadius: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 30, marginBottom: 20,
                                    border: `1px solid ${f.color}20`,
                                }}>{f.icon}</div>
                                <h3 style={{ fontSize: 18.5, fontWeight: 700, color: '#1F2F3D', marginBottom: 10 }}>{f.title}</h3>
                                <p style={{ fontSize: 14.5, color: '#6B7D8F', lineHeight: 1.75 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ──────────────────────────────────────── */}
            <section id="about" style={{ background: '#fff', padding: '88px 0' }}>
                <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-block', padding: '5px 16px',
                        background: 'rgba(42,111,151,0.08)',
                        border: '1px solid rgba(42,111,151,0.15)',
                        borderRadius: 100, marginBottom: 16,
                        fontSize: 12, fontWeight: 700, color: '#2A6F97', letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                    }}>How It Works</div>
                    <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: '#1F2F3D', marginBottom: 14, lineHeight: 1.2 }}>
                        Simple. Trusted. Smart.
                    </h2>
                    <p style={{ fontSize: 16.5, color: '#6B7D8F', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 60px' }}>
                        SeniorMind AI turns complex clinical care into three easy steps — no tech skills needed.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 36 }}>
                        {HOW.map((h, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                                {/* Step circle */}
                                <div style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: h.color,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 20,
                                    boxShadow: `0 8px 24px ${h.color}40`,
                                    position: 'relative',
                                }}>
                                    <span style={{ fontSize: 28 }}>{h.icon}</span>
                                    <span style={{
                                        position: 'absolute', top: -6, right: -6,
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: '#1F2F3D', color: '#fff',
                                        fontSize: 10, fontWeight: 800,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>{h.step}</span>
                                </div>
                                <h4 style={{ fontSize: 19, fontWeight: 700, color: '#1F2F3D', marginBottom: 10 }}>{h.title}</h4>
                                <p style={{ fontSize: 14.5, color: '#6B7D8F', lineHeight: 1.75 }}>{h.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Stats Row ─────────────────────────────────────────── */}
            <section style={{
                background: 'linear-gradient(135deg, #1F2F3D 0%, #2A6F97 100%)',
                padding: '64px 0',
            }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
                    {STATS.map((s, i) => (
                        <div key={i} style={{ padding: '8px 0' }}>
                            <div style={{ fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 800, color: '#14bdac', marginBottom: 8, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── User Portal Cards ─────────────────────────────────── */}
            <section style={{ background: '#F4F6F9', padding: '80px 0' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                    {/* Patient */}
                    <div style={{ background: '#fff', borderRadius: 18, padding: 36, border: '1px solid #E2E7ED', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: 38, marginBottom: 16 }}>👤</div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D', marginBottom: 10 }}>For Seniors & Patients</h3>
                        <p style={{ fontSize: 15, color: '#6B7D8F', lineHeight: 1.75, marginBottom: 24 }}>
                            Access your AI companion Bhavi, record your daily voice diary, and take cognitive screening tests — all in your own language.
                        </p>
                        <button onClick={() => navigate('/signup/patient')} style={{ width: '100%', padding: '14px 0', background: '#2A6F97', color: '#fff', fontSize: 15, fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(42,111,151,0.25)', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                            Start Your Journey
                        </button>
                    </div>

                    {/* Caretaker */}
                    <div style={{ background: '#F0F7F4', borderRadius: 18, padding: 36, border: '1px solid #D5E8DC', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: 38, marginBottom: 16 }}>🤝</div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1F2F3D', marginBottom: 10 }}>For Caretakers</h3>
                        <p style={{ fontSize: 15, color: '#6B7D8F', lineHeight: 1.75, marginBottom: 24 }}>
                            Monitor your loved one's daily mood, diary entries, and cognitive health. Stay informed with real-time alerts and progress reports.
                        </p>
                        <button onClick={() => navigate('/login/caretaker')} style={{ width: '100%', padding: '14px 0', background: '#6BCB77', color: '#1F2F3D', fontSize: 15, fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(107,203,119,0.3)', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                            Caretaker Portal
                        </button>
                    </div>

                    {/* Doctor */}
                    <div style={{ background: '#2A6F97', borderRadius: 18, padding: 36, transition: 'all 0.2s' }}>
                        <div style={{ fontSize: 38, marginBottom: 16 }}>🩺</div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 10 }}>For Doctors</h3>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, marginBottom: 24 }}>
                            Access clinical dashboards, patient screening reports, diary analysis, crisis alerts, and longitudinal cognitive tracking.
                        </p>
                        <button onClick={() => navigate('/login/doctor')} style={{ width: '100%', padding: '14px 0', background: '#6BCB77', color: '#1F2F3D', fontSize: 15, fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(107,203,119,0.3)', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                            Provider Portal
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────── */}
            <footer style={{ background: '#1F2F3D', padding: '56px 0 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
                        {/* Brand block */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <Logo size={36} />
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>SeniorMind <span style={{ color: '#14bdac' }}>AI</span></div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>Voice-First Senior Mental Health Platform</div>
                                </div>
                            </div>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 18 }}>
                                Dementia &amp; Mental Health Care, Made Simple.<br />
                                Trusted by seniors, caregivers, and clinicians.
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.07)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>HIPAA Compliant</span>
                                <span style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.07)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>GDPR Ready</span>
                            </div>
                        </div>

                        {/* Platform links */}
                        <div>
                            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Platform</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <a href="#features" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>Features</a>
                                <a href="#about" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>About</a>
                                <Link to="/signup/patient" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>Patient Login</Link>
                                <Link to="/login/caretaker" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>Caretaker</Link>
                                <Link to="/login/doctor" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>Doctor Portal</Link>
                            </div>
                        </div>

                        {/* For Professionals */}
                        <div>
                            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>For Professionals</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <Link to="/login/doctor" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>Doctor Login</Link>
                                <Link to="/signup/doctor" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>Register Practice</Link>
                                <Link to="/login/caretaker" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>Caretaker Login</Link>
                                <Link to="/signup/caretaker" style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>Register as Caretaker</Link>
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>support@seniormind.ai</span>
                                <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.6)' }}>+91 (800) SENIOR-AI</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        paddingTop: 22, paddingBottom: 28,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: 12,
                    }}>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>© 2025 SeniorMind AI. All rights reserved.</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', maxWidth: 520 }}>
                            Disclaimer: This tool is for screening purposes only and does not constitute a medical diagnosis. Consult a healthcare professional for clinical evaluation.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
