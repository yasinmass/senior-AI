import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { apiFetch, getMyProfile } from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';

export default function PatientProfile() {
    const { t } = useLanguage();
    const [currentLang, setCurrentLang] = useState(localStorage.getItem('patient_language') || 'en');
    const [isSaving, setIsSaving] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        getMyProfile().then(res => {
            if (res.success && res.patient) setUserData(res.patient);
        }).catch(() => { });
    }, []);

    const handleLanguageChange = async (langCode) => {
        setIsSaving(true);
        try {
            const res = await apiFetch('/profile/language/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferred_lang: langCode })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('patient_language', data.language);
                setCurrentLang(data.language);
                // Reload explicitly to ensure entire app switches its context correctly immediately
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const LANG_OPTIONS = [
        { code: 'en', flag: '🇬🇧', label: 'English', sub: '' },
        { code: 'ta', flag: '🇮🇳', label: 'தமிழ்', sub: 'Tamil' },
        { code: 'hi', flag: '🇮🇳', label: 'हिंदी', sub: 'Hindi' },
    ];

    return (
        <DashboardLayout role="patient" title="My Profile">
            <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: 'inherit' }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1F2F3D', marginBottom: 24 }}>My Profile</h1>

                {userData && (
                    <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.05)', marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                            <div style={{ width: 80, height: 80, background: '#F4F6F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#2A6F97', fontWeight: 800 }}>
                                {userData.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1F2F3D', margin: '0 0 4px 0' }}>{userData.name}</h2>
                                <p style={{ fontSize: 16, color: '#6B7D8F', margin: 0 }}>{userData.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1F2F3D', marginBottom: 12 }}>My Preferred Language</h3>
                    <p style={{ fontSize: 15, color: '#6B7D8F', marginBottom: 24 }}>Select the language for the voice assistant and the app interface.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                        {LANG_OPTIONS.map(lang => {
                            const isSelected = currentLang === lang.code;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    disabled={isSaving}
                                    style={{
                                        background: isSelected ? '#14bdac' : '#ffffff',
                                        border: `2px solid ${isSelected ? '#14bdac' : '#E2E7ED'}`,
                                        borderRadius: 16,
                                        padding: '24px 12px',
                                        textAlign: 'center',
                                        cursor: isSaving ? 'wait' : 'pointer',
                                        transition: 'all 0.2s',
                                        color: isSelected ? '#fff' : '#1F2F3D',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 8,
                                        opacity: isSaving && !isSelected ? 0.5 : 1
                                    }}
                                >
                                    <span style={{ fontSize: 36 }}>{lang.flag}</span>
                                    <span style={{ fontSize: 20, fontWeight: 700 }}>{lang.label}</span>
                                    {lang.sub && <span style={{ fontSize: 14, opacity: 0.8 }}>{lang.sub}</span>}
                                    {isSelected && <span style={{ fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20, marginTop: 4 }}>(Current)</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
