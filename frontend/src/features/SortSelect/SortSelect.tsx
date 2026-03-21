'use client';

import React, { useState, useRef, useEffect } from 'react';
import './SortSelect.css';

export type SortValue = 'newest' | 'oldest' | 'highest' | 'lowest';

interface SortSelectProps {
    value: SortValue;
    onChange: (value: SortValue) => void;
    options: Record<SortValue, string>;
}

export const SortSelect: React.FC<SortSelectProps> = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="custom-select-container" ref={containerRef}>
            <div
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{options[value]}</span>
                <svg className="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            {isOpen && (
                <div className="custom-options">
                    {(Object.entries(options) as [SortValue, string][]).map(([key, label]) => (
                        <div
                            key={key}
                            className={`custom-option ${value === key ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(key);
                                setIsOpen(false);
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
