/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';

interface FieldEditorProps {
    label: string;
    value: any;
    onChange: (newValue: any) => void;
    path?: string; // For debugging/keys
    manifest?: Record<string, any>; // Passed down for image picker
}

// Simple Image Picker Modal
function ImagePicker({ onSelect, onClose, manifest }: { onSelect: (url: string) => void, onClose: () => void, manifest: Record<string, any> }) {
    const images = Object.keys(manifest || {}).filter(k => k.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--bg-2)', width: '80%', height: '80%',
                padding: '20px', borderRadius: '12px', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', gap: '20px',
                border: '1px solid var(--stroke)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3>Select Image</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                    {images.map(img => (
                        <div key={img} onClick={() => onSelect(img)} style={{ cursor: 'pointer', border: '1px solid var(--stroke)', borderRadius: '8px', overflow: 'hidden' }}>
                            <div style={{ height: '100px', background: `url(${img}) center/cover` }}></div>
                            <div style={{ padding: '5px', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.split('/').pop()}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function FieldEditor({ label, value, onChange, path = '', manifest }: FieldEditorProps) {
    const [showPicker, setShowPicker] = useState(false);

    // Determine type
    const type = Array.isArray(value) ? 'array' : typeof value;

    if (value === null || value === undefined) {
        return <div style={{ color: 'red' }}>Null value for {label}</div>;
    }

    // Detect image fields
    const isImage = typeof value === 'string' && (label.toLowerCase().includes('image') || label.toLowerCase().includes('src') || label.toLowerCase().includes('icon') || path?.includes('floats'));

    if (type === 'string') {
        const isLongText = value.length > 60 || label.toLowerCase().includes('description') || label.toLowerCase().includes('text') || label.toLowerCase().includes('content');

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{label}</label>

                {isImage ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {value && <img src={value} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', background: '#333' }} />}
                        <div style={{ flex: 1, display: 'flex', gap: '5px' }}>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--stroke)',
                                    background: 'var(--bg)',
                                    color: 'var(--text)'
                                }}
                            />
                            <button
                                onClick={() => setShowPicker(true)}
                                style={{ padding: '0 15px', background: 'var(--bg-2)', border: '1px solid var(--stroke)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text)' }}
                            >
                                Browse
                            </button>
                        </div>
                        {showPicker && (
                            <ImagePicker
                                manifest={manifest || {}}
                                onClose={() => setShowPicker(false)}
                                onSelect={(url) => { onChange(url); setShowPicker(false); }}
                            />
                        )}
                    </div>
                ) : isLongText ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid var(--stroke)',
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            minHeight: '80px',
                            fontFamily: 'inherit'
                        }}
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid var(--stroke)',
                            background: 'var(--bg)',
                            color: 'var(--text)'
                        }}
                    />
                )}
            </div>
        );
    }

    if (type === 'boolean') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    style={{ width: '20px', height: '20px' }}
                />
                <label style={{ fontSize: '14px', color: 'var(--text)' }}>{label}</label>
            </div>
        );
    }

    if (type === 'object' && !Array.isArray(value)) {
        const [isCollapsed, setIsCollapsed] = React.useState(true);
        const childCount = Object.keys(value).length;

        return (
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid var(--stroke)',
                marginBottom: '15px'
            }}>
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        marginBottom: isCollapsed ? '0' : '15px'
                    }}
                >
                    <h4 style={{ margin: 0, color: 'var(--accent)', fontSize: '14px', textTransform: 'uppercase' }}>
                        {label} <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '5px' }}>({childCount} fields)</span>
                    </h4>
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{isCollapsed ? '▶ Show' : '▼ Hide'}</span>
                </div>

                {!isCollapsed && Object.keys(value).map((key) => (
                    <FieldEditor
                        key={key}
                        label={key}
                        value={value[key]}
                        onChange={(newVal) => onChange({ ...value, [key]: newVal })}
                        path={`${path}.${key}`}
                        manifest={manifest}
                    />
                ))}
            </div>
        );
    }

    if (type === 'array') {
        return (
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--stroke)',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: 'var(--accent)', fontSize: '14px', textTransform: 'uppercase' }}>{label} ({value.length})</h4>
                    <button
                        onClick={() => {
                            // Clone strict structure of first item if exists, otherwise empty object or string
                            const template = value.length > 0 ? JSON.parse(JSON.stringify(value[0])) : (typeof value[0] === 'string' ? '' : {});
                            // If template is object, clear strings
                            if (typeof template === 'object') {
                                Object.keys(template).forEach(k => {
                                    if (typeof template[k] === 'string') template[k] = '';
                                    if (typeof template[k] === 'number') template[k] = 0;
                                    if (typeof template[k] === 'boolean') template[k] = false;
                                });
                            }
                            onChange([...value, template]);
                        }}
                        style={{
                            background: 'var(--accent)',
                            color: 'var(--bg)',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        + Add Item
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {value.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '30px' }}>
                                <button
                                    disabled={idx === 0}
                                    onClick={() => {
                                        const newArr = [...value];
                                        [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
                                        onChange(newArr);
                                    }}
                                    style={{ cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, background: 'none', border: 'none', color: 'var(--muted)' }}
                                >
                                    ▲
                                </button>
                                <button
                                    disabled={idx === value.length - 1}
                                    onClick={() => {
                                        const newArr = [...value];
                                        [newArr[idx + 1], newArr[idx]] = [newArr[idx], newArr[idx + 1]];
                                        onChange(newArr);
                                    }}
                                    style={{ cursor: idx === value.length - 1 ? 'default' : 'pointer', opacity: idx === value.length - 1 ? 0.3 : 1, background: 'none', border: 'none', color: 'var(--muted)' }}
                                >
                                    ▼
                                </button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <FieldEditor
                                    label={`Item ${idx + 1}`}
                                    value={item}
                                    onChange={(newVal) => {
                                        const newArr = [...value];
                                        newArr[idx] = newVal;
                                        onChange(newArr);
                                    }}
                                    path={`${path}[${idx}]`}
                                    manifest={manifest}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm('Delete this item?')) {
                                        const newArr = value.filter((_: any, i: number) => i !== idx);
                                        onChange(newArr);
                                    }
                                }}
                                style={{
                                    background: '#ff4d4d',
                                    color: 'white',
                                    border: 'none',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: typeof item === 'object' ? '45px' : '26px' // Rough alignment
                                }}
                                title="Remove"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return <div>Unsupported type: {type}</div>;
}
