'use client';

import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

interface Option {
    value: string;
    label: string;
}

interface Props {
    options: Option[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    small?: boolean;
    searchable?: boolean;
    searchThreshold?: number;
}

const DEFAULT_SEARCH_THRESHOLD = 7;

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Выбрать...',
    small,
    searchable,
    searchThreshold = DEFAULT_SEARCH_THRESHOLD,
}: Props) {
    const [open,    setOpen]    = useState(false);
    const [query,   setQuery]   = useState('');
    const [dropUp,  setDropUp]  = useState(false);
    const ref       = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const showSearch = searchable || options.length >= searchThreshold;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open) {
            if (showSearch) setTimeout(() => searchRef.current?.focus(), 0);
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                setDropUp(spaceBelow < 260);
            }
        } else {
            setQuery('');
        }
    }, [open, showSearch]);

    const filtered = query.trim()
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} className={`csel${open ? ' csel--open' : ''}${small ? ' csel--small' : ''}`}>
            <button type="button" className="csel__trigger" onClick={() => setOpen(o => !o)}>
                <span className={`csel__value${!selected ? ' csel__value--placeholder' : ''}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg className="csel__arrow" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            {open && (
                <div className={`csel__dropdown${dropUp ? ' csel__dropdown--up' : ''}`}>
                    {showSearch && (
                        <div className="csel__search-wrap">
                            <input
                                ref={searchRef}
                                className="csel__search"
                                placeholder="Поиск..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Escape' && setOpen(false)}
                            />
                        </div>
                    )}
                    <div className="csel__list">
                        {filtered.length === 0 ? (
                            <span className="csel__empty">Ничего не найдено</span>
                        ) : filtered.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`csel__option${opt.value === value ? ' csel__option--active' : ''}`}
                                onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
