import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const NOTIFS = [
    { id: 1, type: 'info', title: 'Assessment Reviewed', body: 'Dr. Chen has reviewed your Feb 28 assessment. Risk level: Low. No immediate action required.', time: '2 hours ago', read: false },
    { id: 2, type: 'success', title: 'Exercise Goal Achieved! 🎉', body: "You completed all 3 exercises yesterday. Your weekly streak is now 5 days! Keep it up.", time: '1 day ago', read: false },
    { id: 3, type: 'warning', title: 'Upcoming Appointment', body: 'Reminder: You have a video consultation with Dr. Chen on March 10, 2026 at 10:00 AM.', time: '2 days ago', read: false },
    { id: 4, type: 'info', title: 'New Exercise Plan Assigned', body: "Dr. Chen has updated your exercise schedule for this week. Check the Exercise Schedule page.", time: '3 days ago', read: true },
    { id: 5, type: 'warning', title: 'Exercise Reminder', body: "Don't forget today's exercises: Memory Card Match (15 min) and Word Chain (10 min).", time: '3 days ago', read: true },
    { id: 6, type: 'success', title: 'Monthly Report Generated', body: 'Your February 2026 cognitive health report is ready. Showing improvement in memory scores.', time: '5 days ago', read: true },
];

const typeConfig = {
    info: { color: 'var(--primary)', bg: 'var(--primary-pale)', icon: '💬' },
    success: { color: 'var(--success)', bg: 'var(--success-light)', icon: '✅' },
    warning: { color: 'var(--warning)', bg: 'var(--warning-light)', icon: '⚠️' },
    danger: { color: 'var(--danger)', bg: 'var(--danger-light)', icon: '🔴' },
};

export default function PatientNotifications() {
    const [notifs, setNotifs] = useState(NOTIFS);
    const [filter, setFilter] = useState('all');

    function markRead(id) {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
    function markAllRead() {
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    }

    const filtered = filter === 'all' ? notifs : filter === 'unread' ? notifs.filter(n => !n.read) : notifs.filter(n => n.type === filter);
    const unreadCount = notifs.filter(n => !n.read).length;

    return (
        <DashboardLayout role="patient" title="Notifications">
            <div className="page-header">
                <h2>Notifications</h2>
                <p>Messages, reminders, and updates from your healthcare team</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h3>All Notifications</h3>
                        {unreadCount > 0 && <span className="badge badge-high">{unreadCount} new</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {unreadCount > 0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all read</button>}
                    </div>
                </div>

                {/* Filter tabs */}
                <div style={{ padding: '0 22px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div className="tab-nav" style={{ marginBottom: 0 }}>
                        {[['all', 'All'], ['unread', 'Unread'], ['info', 'Doctor'], ['warning', 'Reminders'], ['success', 'Achievements']].map(([val, label]) => (
                            <button key={val} className={`tab-btn ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>{label}</button>
                        ))}
                    </div>
                </div>

                <div className="card-body" style={{ padding: '8px 22px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                            <p style={{ color: 'var(--gray-400)' }}>No notifications in this category</p>
                        </div>
                    ) : filtered.map(n => {
                        const tc = typeConfig[n.type];
                        return (
                            <div key={n.id} onClick={() => markRead(n.id)}
                                style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', opacity: n.read ? .7 : 1, transition: 'opacity .2s' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                                    {tc.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                        <p style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: 'var(--gray-800)' }}>{n.title}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                                            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc.color }} />}
                                            <span style={{ fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{n.time}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>{n.body}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
