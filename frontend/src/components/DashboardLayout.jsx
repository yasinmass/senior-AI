import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { logout } from '../utils/api';

export default function DashboardLayout({ role, title, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/');
    }

    const name = (role === 'doctor' || role === 'caretaker'
        ? localStorage.getItem('doctor_name')
        : localStorage.getItem('patient_name')) || 'User';

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="main-content" style={{ background: '#F4F6F9' }}>
                {/* Top Bar */}
                <header className="topbar" style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #E2E7ED',
                    padding: '0 32px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Hamburger for mobile */}
                        <button
                            className="hamburger"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                            style={{ display: 'none', padding: 8, background: '#F4F6F9', borderRadius: 8, border: 'none', cursor: 'pointer' }}
                        >
                            <span style={{ width: 20, height: 2, background: '#344756', display: 'block', marginBottom: 5 }} />
                            <span style={{ width: 20, height: 2, background: '#344756', display: 'block', marginBottom: 5 }} />
                            <span style={{ width: 14, height: 2, background: '#344756', display: 'block' }} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#94A3B5', borderRight: '1px solid #E2E7ED', paddingRight: 12 }}>
                                {role === 'doctor' ? 'Clinical Portal' : role === 'caretaker' ? 'Caretaker Portal' : 'Patient Portal'}
                            </span>
                            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1F2F3D' }}>{title}</h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Notifications bell */}
                        <button className="topbar-icon-btn" title="Notifications" style={{
                            width: 40, height: 40, borderRadius: '50%',
                            border: '1.5px solid #E2E7ED', background: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                            color: '#6B7D8F',
                        }}>
                            <div style={{
                                position: 'absolute', top: 7, right: 7,
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#E74C3C', border: '2px solid #fff'
                            }} />
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        {/* User avatar + logout */}
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: '#F4F6F9', padding: '6px 16px 6px 6px',
                                borderRadius: 12, cursor: 'pointer',
                                border: '1px solid #E2E7ED',
                                transition: 'all 0.2s',
                            }}
                            onClick={handleLogout}
                            title="Sign out"
                        >
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'linear-gradient(135deg, #2A6F97, #3A8FBF)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: 15,
                            }}>
                                {name[0]}
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#1F2F3D', lineHeight: 1.3 }}>{name}</span>
                                <span style={{ display: 'block', fontSize: 11, color: '#94A3B5', fontWeight: 500 }}>Sign Out</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content fade-in" style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
