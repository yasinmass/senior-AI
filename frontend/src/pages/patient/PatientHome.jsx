import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { getCheckinToday, getDiaryEntries } from '../../utils/api';
import { speakText } from '../../utils/voiceLanguage';
import { useTranslate } from '../../hooks/useTranslate';

export default function PatientHome() {
    const navigate = useNavigate();
    const name = localStorage.getItem('patient_name') || 'Patient';
    const [greeting, setGreeting] = useState('');
    const [greetingEmoji, setGreetingEmoji] = useState('🌅');
    const [currentDate, setCurrentDate] = useState('');
    const [mood, setMood] = useState(null);
    const [checkinDone, setCheckinDone] = useState(false);
    const [diaryDone, setDiaryDone] = useState(false);
    const lang = localStorage.getItem('patient_language') || 'en';

    // Dynamic translations via LibreTranslate
    const t = useTranslate({
        greeting_morning: 'Good Morning',
        greeting_afternoon: 'Good Afternoon',
        greeting_evening: 'Good Evening',
        greeting_night: 'Good Night',
        mood_label: 'Mood today:',
        summary_title: "Today's Summary",
        diary: 'Diary',
        game: 'Game',
        checkin: 'Check-in',
        mitra: 'Bhavi',
        done: 'Done',
        not_yet: 'Not yet',
        activities: 'Activities for you',
        btn_mitra: 'Talk to Bhavi',
        btn_diary: 'My Diary',
        btn_checkin: 'Daily Check-in',
        btn_game: 'Memory Game',
        sub_mitra: 'Your AI friend is here',
        sub_diary: 'Record your thoughts',
        sub_checkin: 'How are you feeling today?',
        sub_game: 'Train your brain',
    });

    // Greet and speak — runs once on load
    useEffect(() => {
        const hour = new Date().getHours();
        let greetingKey = '';
        if (hour >= 5 && hour < 12) {
            greetingKey = 'greeting_morning';
            setGreetingEmoji('🌅');
        } else if (hour >= 12 && hour < 17) {
            greetingKey = 'greeting_afternoon';
            setGreetingEmoji('☀️');
        } else if (hour >= 17 && hour < 21) {
            greetingKey = 'greeting_evening';
            setGreetingEmoji('🌆');
        } else {
            greetingKey = 'greeting_night';
            setGreetingEmoji('🌙');
        }

        const localeMap = { ta: 'ta-IN', hi: 'hi-IN', en: 'en-US' };
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(new Date().toLocaleDateString(localeMap[lang] || 'en-US', options));

        // Fetch status
        async function fetchStatus() {
            try {
                const checkin = await getCheckinToday();
                if (checkin.success && checkin.completed) setCheckinDone(true);
                const diary = await getDiaryEntries();
                if (diary.success && diary.entries) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (diary.entries.some(e => e.created_at.startsWith(todayStr))) setDiaryDone(true);
                }
            } catch (err) {
                console.error('Status check failed', err);
            }
        }
        fetchStatus();
        // Store key for speaking once translation resolves
        setGreeting(greetingKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Once the translation resolves, update greeting text and speak it
    useEffect(() => {
        if (!greeting) return;
        const resolvedText = t[greeting] || t.greeting_morning || 'Good Morning';
        setTimeout(() => {
            speakText(`${resolvedText}, ${name}!`);
        }, 800);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t, name]);

    const buttons = [
        { icon: '🤖', titleKey: 'btn_mitra', subtitleKey: 'sub_mitra', color: '#14bdac', path: '/patient/companion' },
        { icon: '📔', titleKey: 'btn_diary', subtitleKey: 'sub_diary', color: '#7c3aed', path: '/patient/diary' },
        { icon: '💛', titleKey: 'btn_checkin', subtitleKey: 'sub_checkin', color: '#f59e0b', path: '/patient/soul-connect', isCheckin: true },
        { icon: '🎮', titleKey: 'btn_game', subtitleKey: 'sub_game', color: '#3b82f6', path: '/patient/games' },
    ];

    return (
        <DashboardLayout role="patient" title="Home">
            <div style={{ padding: '0px', maxWidth: '800px', margin: '0 auto', fontFamily: 'inherit' }}>

                {/* 1. TOP GREETING BAR */}
                <div style={{
                    background: '#ffffff', padding: '30px', borderRadius: '20px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '24px'
                }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1F2F3D', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                        {t[greeting] || t.greeting_morning},<br />
                        {name}! {greetingEmoji}
                    </h1>
                    <p style={{ fontSize: '18px', color: '#6B7D8F', margin: '0 0 24px 0', fontWeight: '500' }}>
                        {currentDate}
                    </p>

                    <div style={{ borderTop: '1px solid #E2E7ED', paddingTop: '20px' }}>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2F3D', marginBottom: '16px' }}>
                            {t.mood_label}
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {['😊', '😐', '😔', '😰'].map((emoji, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMood(emoji)}
                                    style={{
                                        fontSize: '32px', width: '64px', height: '64px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '16px',
                                        background: mood === emoji ? '#EBF4FB' : '#F4F6F9',
                                        border: mood === emoji ? '2px solid #2A6F97' : '2px solid transparent',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. DAILY STATUS STRIP */}
                <div style={{
                    background: '#F0F7F4', padding: '24px', borderRadius: '20px',
                    border: '1px solid #D5E8DC', marginBottom: '32px'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2F3D', margin: '0 0 16px 0' }}>
                        {t.summary_title}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {[
                            { emoji: '📔', key: 'diary', done: diaryDone },
                            { emoji: '🎮', key: 'game', done: false },
                            { emoji: '💛', key: 'checkin', done: checkinDone },
                            { emoji: '🤖', key: 'mitra', done: false },
                        ].map(item => (
                            <div key={item.key} style={{
                                fontSize: '18px', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', background: '#fff',
                                padding: '12px 16px', borderRadius: '12px'
                            }}>
                                <span>{item.emoji} {t[item.key]}</span>
                                {item.done
                                    ? <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ {t.done}</span>
                                    : <span style={{ color: '#94A3B5' }}>{t.not_yet}</span>
                                }
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. BIG FEATURE BUTTONS */}
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2F3D', margin: '0 0 20px 0' }}>
                    {t.activities}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {buttons.map((btn, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigate(btn.path)}
                            style={{
                                display: 'flex', alignItems: 'center', width: '100%',
                                minHeight: '90px', background: '#ffffff', border: 'none',
                                borderRadius: '20px', padding: '20px 24px', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                borderLeft: `6px solid ${btn.color}`,
                                textAlign: 'left', transition: 'transform 0.1s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <span style={{ fontSize: '42px', marginRight: '24px', minWidth: '50px', textAlign: 'center' }}>
                                {btn.icon}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1F2F3D', margin: '0 0 6px 0', lineHeight: '1.2' }}>
                                        {t[btn.titleKey]}
                                    </h3>
                                    {btn.isCheckin && checkinDone && (
                                        <span style={{
                                            background: '#DEF7EC', color: '#03543F',
                                            padding: '6px 12px', borderRadius: '20px',
                                            fontSize: '14px', fontWeight: 'bold'
                                        }}>
                                            ✓ {t.done}
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: '17px', color: '#6B7D8F', margin: '0', lineHeight: '1.4' }}>
                                    {t[btn.subtitleKey]}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <div style={{ height: '60px' }}></div>
            </div>
        </DashboardLayout>
    );
}
