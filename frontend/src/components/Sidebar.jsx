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
        { to: '/patient', label: 'Dashboard', icon: '📊' },
        { to: '/patient/test', label: 'AI Screening', icon: '🧠' },
        { to: '/patient/results', label: 'My Reports', icon: '📜' },
        { to: '/patient/schedule', label: 'Exercises', icon: '🧘' },
        { to: '/patient/notifications', label: 'Notifications', icon: '🔔', badge: 2 },
    ];

    const doctorLinks = [
        { to: '/doctor', label: 'Overview', icon: '🏛️' },
        { to: '/doctor/patients', label: 'Patients Registry', icon: '👥' },
        { to: '/doctor/schedule', label: 'Schedule Targets', icon: '📅' },
        { to: '/doctor/completions', label: 'Clinical Tracking', icon: '✅' },
    ];

    const links = role === 'doctor' ? doctorLinks : patientLinks;

    return (
        <>
            {/* Mobile Overlay */}
            <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="logo-mark">
                        <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <h1 className="uppercase tracking-[0.1em] font-black text-xs text-white">NeuroScan <span className="text-teal-400">AI</span></h1>
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-1 block px-0.5">Clinical Edition v2.0</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">{role === 'doctor' ? 'Clinical Workspace' : 'Health Portal'}</div>
                    {links.map(link => (
                        <NavLink key={link.to} to={link.to} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                            <span className="nav-icon text-lg">{link.icon}</span>
                            <span className="font-black uppercase tracking-widest text-[10px]">{link.label}</span>
                            {link.badge && <span className="nav-badge">{link.badge}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user mb-4">
                        <div className="sidebar-avatar font-black">{name[0]}</div>
                        <div className="sidebar-user-info max-w-[140px] truncate">
                            <p className="font-black text-[11px] uppercase tracking-tight truncate">{name}</p>
                            <span className="text-[10px] font-bold text-gray-500 uppercase truncate">{role === 'doctor' ? 'Neurologist' : 'Patient'}</span>
                        </div>
                    </div>
                    <button className="nav-item border border-white/10 mt-4 hover:bg-red-500/10 hover:text-red-400 transition-all font-black" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        <span className="uppercase tracking-widest text-[9px]">Terminate Session</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
