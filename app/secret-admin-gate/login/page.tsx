"use client";

import React, { useState } from 'react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({ password }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            window.location.href = '/secret-admin-gate';
        } else {
            setError('Invalid password');
        }
        setLoading(false);
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg)'
        }}>
            <form onSubmit={handleSubmit} style={{
                background: 'var(--bg-2)',
                padding: '40px',
                borderRadius: '20px',
                border: '1px solid var(--stroke)',
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <h1 style={{ textAlign: 'center', margin: 0 }}>Admin Login</h1>
                <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
                    Enter password to access the CMS
                </p>

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoFocus
                    required
                    style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid var(--stroke)',
                        background: 'rgba(0,0,0,0.1)',
                        color: 'var(--text)',
                        fontSize: '16px'
                    }}
                />

                {error && <p style={{ color: '#ff4d4d', fontSize: '14px', margin: 0 }}>{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ justifyContent: 'center', padding: '14px' }}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}
