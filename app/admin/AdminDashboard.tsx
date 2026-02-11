"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { FieldEditor } from '@/components/admin/FieldEditors';
import { SiteContent, ManifestEntry } from '@/lib/content';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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

    // Advanced Blog CMS State
    const [posts, setPosts] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [editingPost, setEditingPost] = useState<any | null>(null);
    const [loadingBlog, setLoadingBlog] = useState(false);

    useEffect(() => {
        if (activeTab === 'blog') {
            fetchBlogData();
        }
    }, [activeTab]);

    const fetchBlogData = async () => {
        setLoadingBlog(true);
        try {
            const [postsRes, schedulesRes] = await Promise.all([
                fetch('/api/blog/posts'),
                fetch('/api/blog/schedules')
            ]);
            const [postsData, schedulesData] = await Promise.all([
                postsRes.json(),
                schedulesRes.json()
            ]);
            setPosts(postsData);
            setSchedules(schedulesData);
        } catch (err) {
            console.error("Failed to fetch blog data", err);
        } finally {
            setLoadingBlog(false);
        }
    };

    const handleSavePost = async (post: any) => {
        setSaving(true);
        const res = await fetch('/api/blog/posts', {
            method: 'POST',
            body: JSON.stringify(post),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            setMessage('Post saved and synced to GitHub!');
            setEditingPost(null);
            fetchBlogData();
        } else {
            setMessage('Error saving post.');
        }
        setSaving(false);
    };

    const handleDeletePost = async (slug: string) => {
        if (!confirm('Are you sure you want to delete this post? This will remove it from GitHub too.')) return;
        setSaving(true);
        const res = await fetch(`/api/blog/posts?slug=${slug}`, { method: 'DELETE' });
        if (res.ok) {
            setMessage('Post deleted successfully.');
            fetchBlogData();
        } else {
            setMessage('Error deleting post.');
        }
        setSaving(false);
    };

    const handleSaveSchedules = async (newSchedules: any[]) => {
        setSaving(true);
        const res = await fetch('/api/blog/schedules', {
            method: 'POST',
            body: JSON.stringify(newSchedules),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            setMessage('Schedules updated successfully!');
            fetchBlogData();
        } else {
            setMessage('Error updating schedules.');
        }
        setSaving(false);
    };

    const handleToggleSchedule = (id: string) => {
        const newSchedules = schedules.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
        setSchedules(newSchedules);
        handleSaveSchedules(newSchedules);
    };

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
                        } else if (data.type === 'research_triggered') {
                            setBlogProgress(prev => [
                                ...prev,
                                `📋 Selected Topic: ${data.topic}`,
                                '🚀 GitHub Action triggered!',
                                '⌛ Research is now running on GitHub. Vercel will automatically write the article when it finishes (approx. 5 mins).'
                            ]);
                            setMessage('Deep Research initiated on GitHub.');
                        } else if (data.type === 'complete') {
                            setBlogProgress(prev => [...prev, '✅ Success: Post created!']);
                            setMessage('Blog post generated successfully!');
                            fetchBlogData();
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
                        {/* Intelligence Engine Trigger */}
                        <div style={{ marginBottom: '40px' }}>
                            <h2 style={{ marginBottom: '10px' }}>AI Content Engine</h2>
                            <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
                                Trigger manual article generation. "Deep" mode will look for the latest GitHub research report.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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

                            <button
                                onClick={handleGenerateBlog}
                                disabled={isGenerating}
                                className="btn btn-primary"
                                style={{ width: '100%', height: '50px', fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}
                            >
                                <i className={`fa-solid ${isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} style={{ marginRight: '10px' }}></i>
                                {isGenerating ? 'Generating Content...' : 'Start Intelligence Engine'}
                            </button>

                            {blogProgress.length > 0 && (
                                <div style={{ background: '#000', borderRadius: '12px', padding: '20px', fontFamily: 'monospace', border: '1px solid var(--stroke)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Engine Status</span>
                                        <span style={{ color: 'var(--muted)', fontSize: '10px' }}>REAL-TIME LOGS</span>
                                    </div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {blogProgress.map((p, i) => (
                                            <div key={i} style={{ color: p.includes('Error') ? '#ff4d4d' : p.includes('Success') ? '#29e3a2' : '#fff' }}>
                                                <span style={{ opacity: 0.3, marginRight: '10px' }}>[{i + 1}]</span>
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Schedule Editor */}
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ margin: 0 }}>Auto-Publish Schedule</h2>
                                <button className="btn btn-secondary btn-sm" onClick={() => {
                                    const id = `sched-${Date.now()}`;
                                    const newSched = { id, name: 'New Schedule', typology: 'AUTO', cron: '0 10 * * 1', researchMode: 'deep', enabled: true };
                                    handleSaveSchedules([...schedules, newSched]);
                                }}>
                                    <i className="fa-solid fa-plus"></i> Add Trigger
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {schedules.map(sched => (
                                    <div key={sched.id} style={{
                                        background: 'var(--bg-2)',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--stroke)',
                                        opacity: sched.enabled ? 1 : 0.6
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                            <div>
                                                <h4 style={{ margin: 0 }}>{sched.name}</h4>
                                                <code style={{ fontSize: '11px', color: 'var(--muted)' }}>{sched.cron}</code>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleToggleSchedule(sched.id)} style={{ border: 'none', background: 'none', color: sched.enabled ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer' }}>
                                                    <i className={`fa-solid ${sched.enabled ? 'fa-toggle-on' : 'fa-toggle-off'} fa-xl`}></i>
                                                </button>
                                                <button onClick={() => handleSaveSchedules(schedules.filter(s => s.id !== sched.id))} style={{ border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                                                    <i className="fa-solid fa-trash-can"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                                            <span style={{ padding: '2px 6px', background: 'var(--bg-3)', borderRadius: '4px' }}>Mode: {sched.researchMode}</span>
                                            <span style={{ padding: '2px 6px', background: 'var(--bg-3)', borderRadius: '4px' }}>Type: {sched.typology}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Post Manager */}
                        <div>
                            <h2 style={{ marginBottom: '20px' }}>Existing Articles</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {posts.length === 0 && <p style={{ color: 'var(--muted)' }}>No articles found.</p>}
                                {posts.map(post => (
                                    <div key={post.slug} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '15px 20px',
                                        background: 'var(--bg-2)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--stroke)'
                                    }}>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{post.title}</h4>
                                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--accent)' }}>{post.category}</span>
                                                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingPost(post)}>
                                                <i className="fa-solid fa-pen-to-square"></i> Edit
                                            </button>
                                            <button className="btn btn-secondary btn-sm" style={{ color: '#ff4d4d' }} onClick={() => handleDeletePost(post.slug)}>
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rich Text Editor Modal */}
                        {editingPost && (
                            <div style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.85)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000,
                                padding: '20px'
                            }}>
                                <div style={{
                                    background: 'var(--bg-1)',
                                    width: '100%',
                                    maxWidth: '1000px',
                                    maxHeight: '90vh',
                                    borderRadius: '16px',
                                    padding: '30px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '20px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2 style={{ margin: 0 }}>Edit Article</h2>
                                        <button onClick={() => setEditingPost(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Title</label>
                                        <input
                                            value={editingPost.title}
                                            onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                                            style={{ width: '100%', padding: '12px', background: 'var(--bg-2)', border: '1px solid var(--stroke)', borderRadius: '8px', color: 'inherit' }}
                                        />
                                    </div>

                                    <div style={{ height: '400px', marginBottom: '50px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Content</label>
                                        <ReactQuill
                                            theme="snow"
                                            value={editingPost.content}
                                            onChange={(val) => setEditingPost({ ...editingPost, content: val })}
                                            style={{ height: '350px' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                        <button className="btn btn-secondary" onClick={() => setEditingPost(null)}>Cancel</button>
                                        <button className="btn btn-primary" onClick={() => handleSavePost(editingPost)}>Save Changes</button>
                                    </div>
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
