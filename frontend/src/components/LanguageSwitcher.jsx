import { useLanguage } from '../context/LanguageContext';

const LANGS = [
    { code: 'en', label: '🇬🇧 English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'hi', label: 'हिंदी' },
];

export default function LanguageSwitcher() {
    const { language, changeLanguage } = useLanguage();

    return (
        <div style={{
            display: 'flex',
            gap: 8,
            padding: '12px 14px 4px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginTop: 4,
            justifyContent: 'center'
        }}>
            {LANGS.map(lang => {
                const isActive = language === lang.code;
                return (
                    <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        title={lang.label}
                        style={{
                            padding: '8px 14px',
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            background: isActive
                                ? '#14bdac'
                                : '#E2E7ED',
                            color: isActive ? '#fff' : '#1F2F3D',
                            border: 'none',
                            borderRadius: 20,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                        }}
                    >
                        {lang.label}
                    </button>
                );
            })}
        </div>
    );
}

