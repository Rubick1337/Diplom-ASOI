'use client';

import React from 'react';
import './FilterPills.css';

interface Props<T extends string> {
    label: string;
    all: T[];
    selected: Set<T>;
    onChange: (v: Set<T>) => void;
    colorMap?: Record<string, string>;
}

export default function FilterPills<T extends string>({ label, all, selected, onChange, colorMap }: Props<T>) {
    const toggle = (v: T) => {
        const next = new Set(selected);
        if (next.has(v)) { next.delete(v); } else { next.add(v); }
        if (next.size === 0) return;
        onChange(next);
    };

    const allSelected = selected.size === all.length;
    const toggleAll = () => onChange(allSelected ? new Set([all[0]]) : new Set(all));

    return (
        <div className="filter-pills">
            <span className="filter-pills__label">{label}:</span>
            <button
                onClick={toggleAll}
                className={`filter-pills__btn ${allSelected ? 'filter-pills__btn--active-all' : ''}`}
            >
                Все
            </button>
            {all.map(v => {
                const active = selected.has(v);
                const color = colorMap?.[v] ?? '#38bdf8';
                return (
                    <button
                        key={v}
                        onClick={() => toggle(v)}
                        className="filter-pills__btn"
                        style={{
                            borderColor: active ? color : '#1a2b42',
                            background: active ? `${color}22` : 'transparent',
                            color: active ? color : '#3d5470',
                        }}
                    >
                        {v}
                    </button>
                );
            })}
        </div>
    );
}
