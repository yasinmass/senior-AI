import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

// Only messages FROM the doctor are stored here
const DOCTOR_MESSAGES = [
    {
        id: 1,
        from: 'Dr. Chen',
        subject: 'Assessment Reviewed',
        body: 'I have reviewed your Feb 28 assessment. Your risk level is Low — no immediate action required. Keep following the exercise plan.',
        time: '2 hours ago',
        date: 'Mar 3, 2026',
        read: false,
    },
    {
        id: 2,
        from: 'Dr. Chen',
        subject: 'New Exercise Plan Assigned',
        body: 'I have updated your exercise schedule for this week. Please check the Exercises section for your new daily tasks.',
        time: '3 days ago',
        date: 'Feb 28, 2026',
        read: false,
    },
    {
        id: 3,
        from: 'Dr. Chen',
        subject: 'Upcoming Appointment Reminder',
        body: 'You have a video consultation scheduled for March 10, 2026 at 10:00 AM. Please be available and have your latest test results ready.',
        time: '3 days ago',
        date: 'Feb 28, 2026',
        read: true,
    },
    {
        id: 4,
        from: 'Dr. Chen',
        subject: 'Diet Recommendation',
        body: 'Based on your recent screening, I recommend increasing omega-3 intake (walnuts, salmon). Also reduce processed sugar. I have updated your diet chart.',
        time: '1 week ago',
        date: 'Feb 24, 2026',
        read: true,
    },
];

export default function PatientNotifications() {
    const [messages, setMessages] = useState(DOCTOR_MESSAGES);
    const [selected, setSelected] = useState(null);

    function openMessage(msg) {
        setSelected(msg);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    }

    function markAllRead() {
        setMessages(prev => prev.map(m => ({ ...m, read: true })));
    }

    const unread = messages.filter(m => !m.read).length;

    return (
        <DashboardLayout role="patient" title="Messages">
            <div className="page-header">
                <h2>Messages from Doctor</h2>
                <p>Direct communications from your healthcare provider</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

                {/* Message List */}
                <div className="card" style={{ overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h3 style={{ margin: 0 }}>Inbox</h3>
                            {unread > 0 && (
                                <span style={{
                                    background: 'var(--primary)', color: '#fff',
                                    borderRadius: 20, padding: '2px 10px',
                                    fontSize: 12, fontWeight: 700
                                }}>{unread} new</span>
                            )}
                        </div>
                        {unread > 0 && (
                            <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                                <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No messages yet</p>
                            </div>
                        ) : messages.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => openMessage(msg)}
                                style={{
                                    padding: '14px 18px',
                                    borderBottom: '1px solid var(--gray-100)',
                                    cursor: 'pointer',
                                    background: selected?.id === msg.id ? 'var(--primary-light)' : msg.read ? 'transparent' : 'var(--gray-50)',
                                    borderLeft: selected?.id === msg.id ? '3px solid var(--primary)' : '3px solid transparent',
                                    transition: 'all .15s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {!msg.read && (
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                                        )}
                                        <span style={{
                                            fontSize: 13, fontWeight: msg.read ? 500 : 700,
                                            color: selected?.id === msg.id ? 'var(--primary)' : 'var(--gray-800)'
                                        }}>
                                            {msg.from}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{msg.time}</span>
                                </div>
                                <p style={{
                                    fontSize: 13, fontWeight: msg.read ? 400 : 600,
                                    color: 'var(--gray-700)', marginBottom: 4,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                    {msg.subject}
                                </p>
                                <p style={{
                                    fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.4,
                                    display: '-webkit-box', WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                }}>
                                    {msg.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Detail */}
                {selected ? (
                    <div className="card fade-in" key={selected.id}>
                        <div className="card-header">
                            <div>
                                <h3 style={{ marginBottom: 4 }}>{selected.subject}</h3>
                                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>From {selected.from} · {selected.date}</span>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
                        </div>
                        <div className="card-body">
                            {/* Doctor avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0,
                                }}>
                                    {selected.from[3]}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-800)' }}>{selected.from}</p>
                                    <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Your Healthcare Provider · {selected.date}</p>
                                </div>
                            </div>

                            <p style={{ fontSize: 15, color: 'var(--gray-700)', lineHeight: 1.8 }}>{selected.body}</p>

                            <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--primary-light)', borderRadius: 8, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                                📌 If you have questions about this message, bring it up during your next appointment with {selected.from}.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>💬</div>
                        <h3 style={{ fontWeight: 700, color: 'var(--gray-700)', marginBottom: 8 }}>Select a message</h3>
                        <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>Click any message from the list to read it here</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
