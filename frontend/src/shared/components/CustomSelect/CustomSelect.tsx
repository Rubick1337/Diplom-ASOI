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
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Выбрать...', small }: Props) {
    const [open, setOpen] = useState(false);
    const ref  = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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
                <div className="csel__dropdown">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`csel__option${opt.value === value ? ' csel__option--active' : ''}`}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
