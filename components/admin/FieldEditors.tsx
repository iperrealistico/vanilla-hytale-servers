/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface FieldEditorProps {
    label: string;
    value: any;
    onChange: (newValue: any) => void;
    path?: string; // For debugging/keys
}

export function FieldEditor({ label, value, onChange, path = '' }: FieldEditorProps) {
    // Determine type
    const type = Array.isArray(value) ? 'array' : typeof value;

    if (value === null || value === undefined) {
        return <div style={{ color: 'red' }}>Null value for {label}</div>;
    }

    if (type === 'string') {
        const isLongText = value.length > 60 || label.toLowerCase().includes('description') || label.toLowerCase().includes('text') || label.toLowerCase().includes('content');
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                <label style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{label}</label>
                {isLongText ? (
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
        return (
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid var(--stroke)',
                marginBottom: '20px'
            }}>
                <h4 style={{ margin: '0 0 15px', color: 'var(--accent)', fontSize: '14px', textTransform: 'uppercase' }}>{label}</h4>
                {Object.keys(value).map((key) => (
                    <FieldEditor
                        key={key}
                        label={key}
                        value={value[key]}
                        onChange={(newVal) => onChange({ ...value, [key]: newVal })}
                        path={`${path}.${key}`}
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
                            } else if (typeof template === 'string') {
                                // it's a primitive array
                                // template is ''
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
