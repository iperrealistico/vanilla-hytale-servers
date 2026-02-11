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

    // Blog controls state
    const [blogTypology, setBlogTypology] = useState('AUTO');
    const [blogResearchMode, setBlogResearchMode] = useState('deep');
    const [blogProgress, setBlogProgress] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

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

    const handleGenerateBlog = async () => {
        setIsGenerating(true);
        setBlogProgress(['Initializing connection...']);
        setMessage('');

        try {
            const url = `/api/blog/run?typology=${blogTypology}&researchMode=${blogResearchMode}`;
            const response = await fetch(url);
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error("Could not start stream");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'progress') {
                            setBlogProgress(prev => [...prev, data.status]);
                        } else if (data.type === 'complete') {
                            setBlogProgress(prev => [...prev, '✅ Success: Post created!']);
                            setMessage('Blog post generated successfully!');
                        } else if (data.type === 'error') {
                            setBlogProgress(prev => [...prev, `❌ Error: ${data.message}`]);
                            setMessage('Error: ' + data.message);
                        }
                    }
                }
            }
        } catch (err: any) {
            setBlogProgress(prev => [...prev, `❌ Fatal Error: ${err.message}`]);
            setMessage('Error: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
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
                    { id: 'blog', label: 'AI Blog', icon: 'fa-solid fa-robot' },
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
                {activeTab === 'blog' && (
                    <div className="admin-section">
                        <h2 style={{ marginBottom: '10px' }}>AI Content Engine</h2>
                        <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>
                            Trigger manual article generation. "Deep" mode will look for the latest GitHub research report.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <div style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>Article Typology</label>
                                <select
                                    value={blogTypology}
                                    onChange={(e) => setBlogTypology(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-1)', border: '1px solid var(--stroke)', borderRadius: '8px', color: 'inherit' }}
                                >
                                    <option value="AUTO">Auto-Select (Editor's Choice)</option>
                                    <option value="news">Hytale News</option>
                                    <option value="spotlight">Lore Spotlight</option>
                                    <option value="guide">Technical Guide</option>
                                    <option value="patch_notes">Patch Notes</option>
                                </select>
                            </div>

                            <div style={{ background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--stroke)' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>Research Strategy</label>
                                <select
                                    value={blogResearchMode}
                                    onChange={(e) => setBlogResearchMode(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-1)', border: '1px solid var(--stroke)', borderRadius: '8px', color: 'inherit' }}
                                >
                                    <option value="deep">Deep Research (Uses GitHub reports)</option>
                                    <option value="web-lite">Web-Lite (Fast browser search)</option>
                                    <option value="internal">Internal (AI Knowledge only)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <button
                                onClick={handleGenerateBlog}
                                disabled={isGenerating}
                                className="btn btn-primary"
                                style={{ width: '100%', height: '50px', fontSize: '16px', fontWeight: 700 }}
                            >
                                <i className={`fa-solid ${isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} style={{ marginRight: '10px' }}></i>
                                {isGenerating ? 'Generating Content...' : 'Start Intelligence Engine'}
                            </button>
                        </div>

                        {blogProgress.length > 0 && (
                            <div style={{ background: '#000', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', border: '1px solid var(--stroke)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Engine Status</span>
                                    <span style={{ color: 'var(--muted)', fontSize: '10px' }}>REAL-TIME LOGS</span>
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    {blogProgress.map((p, i) => (
                                        <div key={i} style={{ color: p.includes('Error') ? '#ff4d4d' : p.includes('Success') ? '#29e3a2' : '#fff' }}>
                                            <span style={{ opacity: 0.3, marginRight: '10px' }}>[{i + 1}]</span>
                                            {p}
                                        </div>
                                    ))}
                                    {isGenerating && (
                                        <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ opacity: 0.3, marginRight: '10px' }}>[{blogProgress.length + 1}]</span>
                                            Thinking
                                            <span className="dot-pulse"></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
