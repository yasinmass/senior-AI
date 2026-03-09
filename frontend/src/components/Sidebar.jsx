import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getCaretakerDiaryAlerts } from '../utils/api';
import { useTranslate } from '../hooks/useTranslate';

export default function Sidebar({ role, isOpen, onClose }) {
    const navigate = useNavigate();

    // Dynamic translations via LibreTranslate — patient portal only.
    // Doctor/Caretaker portal stays in English.
    const tPt = useTranslate({
        home: 'Home',
        mitra: 'Talk to Mitra',
        diary: 'My Diary',
        checkin: 'Daily Check-in',
        game: 'Memory Game',
        profile: 'My Profile',
        signout: 'Sign Out',
        patient: 'Patient',
    });

    async function handleLogout() {
        await logout();
        navigate('/');
        onClose();
    }

    const [alertCount, setAlertCount] = useState(0);

    useEffect(() => {
        if (role === 'caretaker') {
            getCaretakerDiaryAlerts()
                .then(res => {
                    if (res.success) setAlertCount(res.total_alerts || 0);
                })
                .catch(() => { });
        }
    }, [role]);

    const name = (role === 'doctor' || role === 'caretaker'
        ? localStorage.getItem('doctor_name')
        : localStorage.getItem('patient_name')) || 'User';

    // Patient links — labels from LibreTranslate
    const patientLinks = [
        { to: '/patient', label: tPt.home, icon: '🏠' },
        { to: '/patient/companion', label: tPt.mitra, icon: '🤖' },
        { to: '/patient/diary', label: tPt.diary, icon: '📓' },
        { to: '/patient/soul-connect', label: tPt.checkin, icon: '🤝' },
        { to: '/patient/games', label: tPt.game, icon: '🎮' },
        { to: '/patient/profile', label: tPt.profile, icon: '👤' },
    ];

    const doctorLinks = [
        { to: '/doctor', label: 'Overview', icon: '📋' },
        { to: '/doctor/patients', label: 'Patients', icon: '👥' },
        { to: '/doctor/schedule', label: 'Schedule', icon: '📅' },
        { to: '/doctor/screening-reports', label: 'AI Screening Reports', icon: '🧠' },
        { to: '/doctor/diary-reports', label: 'Diary Reports', icon: '📓' },
    ];

    const caretakerLinks = [
        { to: '/caretaker', label: 'Overview', icon: '📋' },
        { to: '/caretaker/seniors', label: 'Seniors', icon: '👥' },
        { to: '/caretaker/schedule', label: 'Schedule', icon: '📅' },
        { to: '/caretaker/screening-reports', label: 'AI Screening Reports', icon: '🧠' },
        { to: '/caretaker/diary-reports', label: 'Diary Reports', icon: '📓', badge: alertCount > 0 ? alertCount : null },
    ];

    const links = role === 'caretaker' ? caretakerLinks
        : role === 'doctor' ? doctorLinks
            : patientLinks;

    const roleLabel = role === 'doctor' ? 'Healthcare Provider'
        : role === 'caretaker' ? 'Caretaker'
            : tPt.patient;

    const signOutLabel = role === 'patient' ? tPt.signout : 'Sign Out';

    return (
        <>
            {/* Mobile overlay */}
            <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-mark">
                        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M12 2C8.5 2 6 4.5 6 7.5c0 1.5.5 2.8 1.5 3.8C6 12 5 13.5 5 15.5 5 18.5 7.5 21 10.5 21c1 0 1.5-.2 1.5-.2s.5.2 1.5.2C16.5 21 19 18.5 19 15.5c0-2-1-3.5-2.5-4.2 1-.9 1.5-2.3 1.5-3.8C18 4.5 15.5 2 12 2z" />
                            <path strokeLinecap="round" d="M12 6v6M9.5 9h5" />
                            <circle cx="12" cy="16" r="1.5" fill="#fff" stroke="none" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                        SeniorMind <span style={{ color: '#14bdac' }}>AI</span>
                    </h1>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 400, display: 'block', marginTop: 2 }}>
                        Voice-First Senior Care
                    </span>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {links.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>
                                {link.label}
                            </span>
                            {link.badge != null && (
                                <span style={{
                                    background: 'var(--danger)', color: '#fff',
                                    fontSize: 10, fontWeight: 800,
                                    padding: '2px 8px', borderRadius: 10,
                                    alignSelf: 'center',
                                }}>
                                    {link.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user" style={{ marginBottom: 8, marginTop: 10 }}>
                        <div className="sidebar-avatar">{name[0]?.toUpperCase()}</div>
                        <div className="sidebar-user-info" style={{ maxWidth: 140, overflow: 'hidden' }}>
                            <p style={{
                                fontSize: 14, fontWeight: 600, color: '#fff',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{name}</p>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                {roleLabel}
                            </span>
                        </div>
                    </div>

                    <button
                        className="nav-item"
                        style={{ border: '1px solid rgba(255,255,255,0.1)', marginTop: 8 }}
                        onClick={handleLogout}
                    >
                        <span className="nav-icon">🚪</span>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{signOutLabel}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
