"use client";

import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        const t = document.documentElement.getAttribute('data-theme') || 'dark';
        setTheme(t);
    }, []);

    const toggle = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

    return (
        <button
            id="themeToggle"
            className="btn theme-toggle pressable"
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
            <i className={theme === 'light' ? "fa-solid fa-sun" : "fa-solid fa-moon"} aria-hidden="true"></i>
            <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
        </button>
    );
}
