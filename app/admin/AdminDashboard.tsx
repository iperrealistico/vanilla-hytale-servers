"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';

import { FieldEditor } from '@/components/admin/FieldEditors';
import { SiteContent, ManifestEntry } from '@/lib/content';

const editorialHighlights = [
  {
    title: 'Canonical live content',
    body: 'Published articles now live in content/blog/**/*.mdx and are rendered by the validated v3 article runtime at /blog.',
  },
  {
    title: 'Deterministic image layer',
    body: 'Cover, wash, and orbit assets resolve through tracked slot IDs in content/site/image-slots.json plus the runtime image manifest.',
  },
  {
    title: 'Local-only control plane',
    body: 'Queue state, staged drafts, prompt docs, and image sidecars are intentionally managed in AI-START-HERE.local.md and documents-local/ rather than through this browser UI.',
  },
];

const editorialChecklist = [
  'Write or promote live articles in content/blog with articleTemplate: v3.',
  'Run npm run validate:articles before any article goes live.',
  'Run npm run test:articles and npm run build before a publish or deploy step.',
  'Use /blog plus the homepage anchors /#servers and /#methodology as the strategic internal-link backbone.',
];

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
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (data.success) {
      setMessage('Published successfully! Rebuild triggered.');
    } else {
      setMessage(`Error: ${data.message}`);
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
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      setManifest({ ...manifest, [data.path]: data.entry });
      setMessage(`Uploaded: ${data.path}`);
    } else {
      setMessage(`Upload error: ${data.message}`);
    }
    setSaving(false);
  };

  const updateContent = (section: keyof SiteContent, value: any) => {
    setContent((prev) => ({ ...prev, [section]: value }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--text)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0 }}>Admin Panel</h1>
          <span style={{ fontSize: '12px', background: 'var(--bg-2)', padding: '4px 8px', borderRadius: '12px', color: 'var(--muted)' }}>v3 editorial runtime</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePublish} disabled={saving} className="btn btn-primary" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <i className="fa-solid fa-cloud-arrow-up"></i>
            {saving ? 'Publishing...' : 'Publish to GitHub'}
          </button>
          <a href="/" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <i className="fa-solid fa-external-link"></i>
            View Site
          </a>
        </div>
      </header>

      {message && (
        <div
          style={{
            padding: '15px',
            background: message.includes('Error') ? '#ff4d4d22' : '#29e3a222',
            border: `1px solid ${message.includes('Error') ? '#ff4d4d' : '#29e3a2'}`,
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <i className={`fa-solid ${message.includes('Error') ? 'fa-triangle-exclamation' : 'fa-check-circle'}`}></i>
          {message}
        </div>
      )}

      <nav style={{ display: 'flex', borderBottom: '1px solid var(--stroke)', marginBottom: '30px', overflowX: 'auto' }}>
        {[
          { id: 'servers', label: 'Servers', icon: 'fa-solid fa-server' },
          { id: 'editorial', label: 'Editorial System', icon: 'fa-solid fa-book-open' },
          { id: 'content', label: 'Page Content', icon: 'fa-solid fa-file-pen' },
          { id: 'media', label: 'Media Library', icon: 'fa-solid fa-images' },
          { id: 'settings', label: 'Settings & SEO', icon: 'fa-solid fa-gear' },
          { id: 'json', label: 'Raw JSON', icon: 'fa-solid fa-code' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
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
              whiteSpace: 'nowrap',
            }}
          >
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

        {activeTab === 'editorial' && (
          <div className="admin-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--stroke)' }}>
              <h2 style={{ marginTop: 0, marginBottom: '10px' }}>File-driven editorial runtime</h2>
              <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
                The old in-browser AI Blog generator has been retired. Articles now run through a validated MDX pipeline with deterministic image slots, a staged queue, and local operator docs that are intentionally kept out of the published admin UI.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {editorialHighlights.map((item) => (
                  <div key={item.title} style={{ background: 'var(--bg-1)', padding: '18px', borderRadius: '14px', border: '1px solid var(--stroke)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '8px' }}>{item.title}</h3>
                    <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--bg-2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--stroke)' }}>
                <h3 style={{ marginTop: 0 }}>Editorial operating checklist</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted)', display: 'grid', gap: '10px' }}>
                  {editorialChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'var(--bg-2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--stroke)' }}>
                <h3 style={{ marginTop: 0 }}>Public routes</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {[
                    { href: '/', label: 'Homepage' },
                    { href: '/blog', label: 'Blog index' },
                  ].map((route) => (
                    <a key={route.href} href={route.href} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                      <span>{route.label}</span>
                      <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                    </a>
                  ))}
                </div>
              </div>
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
              { id: 'suggest', label: 'Suggest Form', desc: 'Text for the server suggestion section.' },
            ].map((section) => (
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
                  <div
                    style={{
                      height: '150px',
                      backgroundImage: `url(${path})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '8px',
                      marginBottom: '10px',
                    }}
                  ></div>
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
              Advanced mode: edit the raw JSON structure. Syntax errors will break the editable site content.
            </p>
            <textarea
              value={JSON.stringify(content, null, 2)}
              onChange={(e) => {
                try {
                  const newContent = JSON.parse(e.target.value);
                  setContent(newContent);
                } catch {
                  // Intentionally ignore intermediate invalid JSON while the admin types.
                }
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
                lineHeight: '1.5',
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
