import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../utils/api';

export default function Sidebar({ role, isOpen, onClose }) {
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/');
        onClose();
    }

    const name = (role === 'doctor' ? sessionStorage.getItem('doctor_name') : sessionStorage.getItem('patient_name')) || 'User';

    const patientLinks = [
        { to: '/patient/schedule', label: 'Home', icon: '🏠' },
        { to: '/patient/test', label: 'AI Screening', icon: '🧠' },
        { to: '/patient/companion', label: 'AI Companion', icon: '🤖' },
        { to: '/patient/diary', label: 'Diary', icon: '📓' },
        { to: '/patient/soul-connect', label: 'Soul Connect', icon: '🤝' },
        { to: '/patient/results', label: 'My Reports', icon: '📊' },
        { to: '/patient/notifications', label: 'Messages', icon: '💬' },
    ];

    const doctorLinks = [
        { to: '/doctor', label: 'Overview', icon: '📋' },
        { to: '/doctor/patients', label: 'Patients', icon: '👥' },
        { to: '/doctor/schedule', label: 'Schedule', icon: '📅' },
    ];

    const links = role === 'doctor' ? doctorLinks : patientLinks;

    return (
        <>
            {/* Mobile Overlay */}
            <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-mark">
                        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.5 2 6 4.5 6 7.5c0 1.5.5 2.8 1.5 3.8C6 12 5 13.5 5 15.5 5 18.5 7.5 21 10.5 21c1 0 1.5-.2 1.5-.2s.5.2 1.5.2C16.5 21 19 18.5 19 15.5c0-2-1-3.5-2.5-4.2 1-.9 1.5-2.3 1.5-3.8C18 4.5 15.5 2 12 2z" />
                            <path strokeLinecap="round" d="M12 6v6M9.5 9h5" />
                            <circle cx="12" cy="16" r="1.5" fill="#fff" stroke="none" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                        NeuroScan <span style={{ color: '#6BCB77' }}>AI</span>
                    </h1>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 400, display: 'block', marginTop: 2 }}>
                        Dementia Screening Platform
                    </span>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <div className="nav-section-label">
                        {role === 'doctor' ? 'Clinical Workspace' : 'Health Portal'}
                    </div>
                    {links.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <span className="nav-icon">{link.icon}</span>
                            <span style={{ fontSize: 15, fontWeight: 500 }}>{link.label}</span>
                            {link.badge && <span className="nav-badge">{link.badge}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className="sidebar-user" style={{ marginBottom: 8 }}>
                        <div className="sidebar-avatar">{name[0]}</div>
                        <div className="sidebar-user-info" style={{ maxWidth: 140, overflow: 'hidden' }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                {role === 'doctor' ? 'Healthcare Provider' : 'Patient'}
                            </span>
                        </div>
                    </div>
                    <button
                        className="nav-item"
                        style={{ border: '1px solid rgba(255,255,255,0.1)', marginTop: 8 }}
                        onClick={handleLogout}
                    >
                        <span className="nav-icon">🚪</span>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
