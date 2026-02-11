/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import { FieldEditor } from '@/components/admin/FieldEditors';
import { SiteContent, ManifestEntry } from '@/lib/content';

export default function AdminDashboard({ initialContent, initialManifest }: { initialContent: SiteContent, initialManifest: Record<string, ManifestEntry> }) {
    const [content, setContent] = useState(initialContent);
    const [manifest, setManifest] = useState(initialManifest);
    const [activeTab, setActiveTab] = useState('servers');
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

    const updateContent = (section: keyof SiteContent, value: any) => {
        setContent(prev => ({ ...prev, [section]: value }));
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1 style={{ margin: 0 }}>Admin Panel</h1>
                    <span style={{ fontSize: '12px', background: 'var(--bg-2)', padding: '4px 8px', borderRadius: '12px', color: 'var(--muted)' }}>v2.0 Simplified</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handlePublish} disabled={saving} className="btn btn-primary" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        {saving ? 'Publishing...' : 'Publish to GitHub'}
                    </button>
                    <a href="/" target="_blank" className="btn btn-secondary" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <i className="fa-solid fa-external-link"></i>
                        View Site
                    </a>
                </div>
            </header>

            {message && <div style={{
                padding: '15px',
                background: message.includes('Error') ? '#ff4d4d22' : '#29e3a222',
                border: `1px solid ${message.includes('Error') ? '#ff4d4d' : '#29e3a2'}`,
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <i className={`fa-solid ${message.includes('Error') ? 'fa-triangle-exclamation' : 'fa-check-circle'}`}></i>
                {message}
            </div>}

            <nav style={{ display: 'flex', borderBottom: '1px solid var(--stroke)', marginBottom: '30px', overflowX: 'auto' }}>
                {[
                    { id: 'servers', label: 'Servers', icon: 'fa-solid fa-server' },
                    { id: 'content', label: 'Page Content', icon: 'fa-solid fa-file-pen' },
                    { id: 'media', label: 'Media Library', icon: 'fa-solid fa-images' },
                    { id: 'settings', label: 'Settings & SEO', icon: 'fa-solid fa-gear' },
                    { id: 'json', label: 'Raw JSON', icon: 'fa-solid fa-code' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        padding: '12px 24px',
                        background: activeTab === tab.id ? 'rgba(255,255,255,0.05)' : 'none',
                        border: 'none',
                        borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                        color: activeTab === tab.id ? 'var(--accent)' : 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                    }}>
                        <i className={tab.icon}></i>
                        {tab.label}
                    </button>
                ))}
            </nav>

            <main>
                {activeTab === 'servers' && (
                    <div className="admin-section">
                        <h2 style={{ marginBottom: '10px' }}>Manage Servers</h2>
                        <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                            This is the main list of servers displayed on the homepage. Use the arrows to reorder them.
                        </p>

                        <div style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                            <FieldEditor
                                label="Server List"
                                value={content.servers}
                                onChange={(val) => updateContent('servers', val)}
                                path="servers"
                                manifest={manifest}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="admin-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        {[
                            { id: 'hero', label: 'Hero Section', desc: 'Main headline, description, and floating images.' },
                            { id: 'methodology', label: 'Methodology', desc: 'Scoring rules and contact info.' },
                            { id: 'filmstrip', label: 'Filmstrip Gallery', desc: 'Rolling images carousel.' },
                            { id: 'faq', label: 'FAQ', desc: 'Frequently asked questions.' },
                            { id: 'suggest', label: 'Suggest Form', desc: 'Text for the server suggestion section.' }
                        ].map(section => (
                            <div key={section.id} style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                                <h3 style={{ marginTop: 0 }}>{section.label}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>{section.desc}</p>
                                <FieldEditor
                                    label={section.label}
                                    value={(content as any)[section.id]}
                                    onChange={(val) => updateContent(section.id as keyof SiteContent, val)}
                                    path={section.id}
                                    manifest={manifest}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="admin-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <div style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                            <h3 style={{ marginTop: 0 }}>Meta & SEO</h3>
                            <FieldEditor label="Meta Tags" value={content.meta} onChange={(val) => updateContent('meta', val)} path="meta" manifest={manifest} />
                        </div>
                        <div style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                            <h3 style={{ marginTop: 0 }}>Header Navigation</h3>
                            <FieldEditor label="Header" value={content.header} onChange={(val) => updateContent('header', val)} path="header" manifest={manifest} />
                        </div>
                        <div style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                            <h3 style={{ marginTop: 0 }}>Footer</h3>
                            <FieldEditor label="Footer" value={content.footer} onChange={(val) => updateContent('footer', val)} path="footer" manifest={manifest} />
                        </div>
                    </div>
                )}

                {activeTab === 'media' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>Media Library</h2>
                            <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-upload"></i> Upload Image
                                <input type="file" onChange={handleUpload} style={{ display: 'none' }} accept="image/*" />
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {Object.entries(manifest).map(([path, entry]: [string, any]) => (
                                <div key={path} style={{ background: 'var(--bg-2)', padding: '10px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                                    <div style={{
                                        height: '150px',
                                        backgroundImage: `url(${path})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        borderRadius: '8px',
                                        marginBottom: '10px'
                                    }}></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }} title={path}>{path}</p>
                                        <span style={{ fontSize: '10px', color: 'var(--muted)', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>
                                            {(entry.size / 1024).toFixed(1)} KB
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'json' && (
                    <div>
                        <p style={{ color: 'var(--muted)', marginBottom: '10px' }}>
                            ⚠ Advanced Mode: Edit the raw JSON structure. Be careful, syntax errors will break the content.
                        </p>
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
                                height: '700px',
                                background: '#111',
                                color: '#0f0',
                                fontFamily: 'monospace',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '1px solid var(--stroke)',
                                lineHeight: '1.5'
                            }}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
