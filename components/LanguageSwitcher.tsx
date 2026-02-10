"use client";

import React, { useState } from 'react';

export default function LanguageSwitcher({ currentLang }: { currentLang: string }) {
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        { code: 'en', name: 'English', flag: '🇺🇸' }
    ];

    return (
        <div className="language-switcher" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'flex-end',
            gap: '10px'
        }}>
            <button
                className="btn btn-primary pressable"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    borderRadius: '999px',
                    padding: '12px',
                    width: '50px',
                    height: '50px',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow)'
                }}
            >
                <span style={{ fontSize: '20px' }}>{languages.find(l => l.code === currentLang)?.flag || '🇮🇹'}</span>
            </button>

            {isOpen && (
                <div className="language-dropdown" style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--stroke)',
                    borderRadius: '16px',
                    padding: '8px',
                    boxShadow: 'var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    {languages.map(l => (
                        <a
                            key={l.code}
                            href={l.code === 'it' ? '/' : `/${l.code}`}
                            className="nav-text"
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                background: currentLang === l.code ? 'var(--panel-2)' : 'transparent',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span style={{ marginRight: '8px' }}>{l.flag}</span>
                            {l.name}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
