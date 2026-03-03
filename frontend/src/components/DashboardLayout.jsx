import { useState, useEffect } from 'react';
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

    const name = (role === 'doctor' ? sessionStorage.getItem('doctor_name') : sessionStorage.getItem('patient_name')) || 'User';

    return (
        <div className="dashboard-layout bg-gray-50">
            {/* Sidebar with overlay on mobile */}
            <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="main-content min-h-screen bg-gray-50">
                {/* Fixed Top Bar */}
                <header className="topbar bg-white/80 backdrop-blur-md sticky top-0 z-[500] border-b border-gray-100 shadow-sm px-10">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <button className="hamburger md:hidden block p-3 bg-gray-100 rounded-xl" onClick={() => setSidebarOpen(true)} aria-label="Menu">
                            <span className="w-5 h-0.5 bg-gray-900 mb-1" />
                            <span className="w-5 h-0.5 bg-gray-900 mb-1" />
                            <span className="w-3 h-0.5 bg-gray-900" />
                        </button>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 pr-5 hidden md:block">Clinical Portal</span>
                            <span className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</span>
                        </div>
                    </div>

                    <div className="topbar-actions flex items-center gap-6">
                        <button className="topbar-icon-btn hover:bg-teal-50 hover:text-teal-600 transition-all rounded-2xl border-gray-100" title="Notifications">
                            <div className="dot bg-red-500 ring-4 ring-white" />
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-3 bg-gray-100 p-1.5 pr-5 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-200 transition-all group overflow-hidden" onClick={handleLogout}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-teal-50 group-hover:scale-105 transition-transform">
                                {name[0]}
                            </div>
                            <div className="hidden lg:block truncate">
                                <span className="block text-[11px] font-black uppercase tracking-tight text-gray-900 leading-tight truncate">{name}</span>
                                <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-tight">Exit Portal</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content py-12 px-10 fade-in max-w-[1440px] mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
