"use client";

import React, { useState } from 'react';

export default function AdminDashboard({ initialContent, initialManifest }: { initialContent: any, initialManifest: any }) {
    const [content, setContent] = useState(initialContent);
    const [manifest, setManifest] = useState(initialManifest);
    const [activeTab, setActiveTab] = useState('content');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handlePublish = async () => {
        setSaving(true);
        setMessage('');
        const res = await fetch('/api/admin/publish', {
            method: 'POST',
            body: JSON.stringify({ content, manifest }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (data.success) {
            setMessage('Published successfully! Rebuild triggered.');
        } else {
            setMessage('Error: ' + data.message);
        }
        setSaving(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setSaving(true);
        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            setManifest({ ...manifest, [data.path]: data.entry });
            setMessage('Uploaded: ' + data.path);
        } else {
            setMessage('Upload error: ' + data.message);
        }
        setSaving(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Admin Panel</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handlePublish} disabled={saving} className="btn btn-primary">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        {saving ? 'Saving...' : 'Publish to GitHub'}
                    </button>
                    <a href="/" target="_blank" className="btn btn-secondary">View Site</a>
                </div>
            </header>

            <nav style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--stroke)', marginBottom: '20px' }}>
                <button onClick={() => setActiveTab('content')} style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'content' ? 'var(--accent)' : 'var(--muted)',
                    borderBottom: activeTab === 'content' ? '2px solid var(--accent)' : 'none',
                    cursor: 'pointer'
                }}>Content</button>
                <button onClick={() => setActiveTab('uploads')} style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'uploads' ? 'var(--accent)' : 'var(--muted)',
                    borderBottom: activeTab === 'uploads' ? '2px solid var(--accent)' : 'none',
                    cursor: 'pointer'
                }}>Uploads</button>
                <button onClick={() => setActiveTab('json')} style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'json' ? 'var(--accent)' : 'var(--muted)',
                    borderBottom: activeTab === 'json' ? '2px solid var(--accent)' : 'none',
                    cursor: 'pointer'
                }}>Raw JSON</button>
            </nav>

            {message && <div style={{
                padding: '10px',
                background: message.includes('Error') ? '#ff4d4d22' : '#29e3a222',
                border: `1px solid ${message.includes('Error') ? '#ff4d4d' : '#29e3a2'}`,
                borderRadius: '8px',
                marginBottom: '20px'
            }}>{message}</div>}

            {activeTab === 'content' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <section style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                        <h2 style={{ marginTop: 0 }}>Meta & Hero (Italian)</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label>Title</label>
                                <input
                                    value={content.it.meta.title}
                                    onChange={(e) => setContent({ ...content, it: { ...content.it, meta: { ...content.it.meta, title: e.target.value } } })}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--stroke)', background: 'var(--bg)', color: 'white' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label>Hero Title</label>
                                <input
                                    value={content.it.hero.title}
                                    onChange={(e) => setContent({ ...content, it: { ...content.it, hero: { ...content.it.hero, title: e.target.value } } })}
                                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--stroke)', background: 'var(--bg)', color: 'white' }}
                                />
                            </div>
                        </div>
                    </section>

                    <section style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                        <h2 style={{ marginTop: 0 }}>Servers (Italian)</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {content.it.servers.items.map((server: any, idx: number) => (
                                <div key={idx} style={{ padding: '15px', border: '1px solid var(--stroke)', borderRadius: '8px' }}>
                                    <h4 style={{ margin: '0 0 10px' }}>Server #{idx + 1}: {server.name}</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                        <input
                                            value={server.name}
                                            onChange={(e) => {
                                                const newItems = [...content.it.servers.items];
                                                newItems[idx] = { ...server, name: e.target.value };
                                                setContent({ ...content, it: { ...content.it, servers: { ...content.it.servers, items: newItems } } });
                                            }}
                                            placeholder="Server Name"
                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--stroke)', background: 'var(--bg)', color: 'white' }}
                                        />
                                        <input
                                            value={server.ip}
                                            onChange={(e) => {
                                                const newItems = [...content.it.servers.items];
                                                newItems[idx] = { ...server, ip: e.target.value };
                                                setContent({ ...content, it: { ...content.it, servers: { ...content.it.servers, items: newItems } } });
                                            }}
                                            placeholder="Server IP"
                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--stroke)', background: 'var(--bg)', color: 'white' }}
                                        />
                                        <input
                                            value={server.subtitle}
                                            onChange={(e) => {
                                                const newItems = [...content.it.servers.items];
                                                newItems[idx] = { ...server, subtitle: e.target.value };
                                                setContent({ ...content, it: { ...content.it, servers: { ...content.it.servers, items: newItems } } });
                                            }}
                                            placeholder="Subtitle"
                                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--stroke)', background: 'var(--bg)', color: 'white' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <p style={{ color: 'var(--muted)' }}>Note: This is a simplified interface. Use the <strong>Raw JSON</strong> tab for full multi-language editing and complex fields.</p>
                </div>
            )}

            {activeTab === 'uploads' && (
                <div>
                    <h2>Uploads</h2>
                    <input type="file" onChange={handleUpload} style={{ marginBottom: '20px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {Object.entries(manifest).map(([path, entry]: [string, any]) => (
                            <div key={path} style={{ background: 'var(--bg-2)', padding: '10px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                                <img src={path.startsWith('/') ? path : '/' + path} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                                <p style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '10px' }}>{path}</p>
                                <p style={{ fontSize: '10px', color: 'var(--muted)' }}>{(entry.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'json' && (
                <textarea
                    value={JSON.stringify(content, null, 2)}
                    onChange={(e) => {
                        try {
                            const newContent = JSON.parse(e.target.value);
                            setContent(newContent);
                        } catch (err) { }
                    }}
                    style={{
                        width: '100%',
                        height: '600px',
                        background: '#000',
                        color: '#0f0',
                        fontFamily: 'monospace',
                        padding: '10px',
                        borderRadius: '8px'
                    }}
                />
            )}
        </div>
    );
}
