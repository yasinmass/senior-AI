import { useState, useEffect } from 'react';
import { getCurrentLang, setLang } from '../utils/i18n';

const LANGS = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिं' },
    { code: 'ta', label: 'தமி' },
];

export default function LangSwitcher({ onChange }) {
    const [active, setActive] = useState(getCurrentLang());

    function handleLang(code) {
        setLang(code);
        setActive(code);
        if (onChange) onChange(code);
    }

    return (
        <div
            style={{
                position: 'fixed', top: 14, right: 18, zIndex: 9999,
                display: 'flex', gap: 4, background: 'rgba(255,255,255,0.92)',
                border: '1px solid #e5e7eb', borderRadius: 999,
                padding: '4px 6px', boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                backdropFilter: 'blur(8px)',
            }}
        >
            {LANGS.map(({ code, label }) => (
                <button
                    key={code}
                    onClick={() => handleLang(code)}
                    style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px',
                        borderRadius: 999, border: 'none', cursor: 'pointer',
                        transition: 'all 0.2s', fontFamily: 'inherit', letterSpacing: '0.02em',
                        background: active === code ? '#14b8a6' : 'transparent',
                        color: active === code ? '#fff' : '#6b7280',
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
