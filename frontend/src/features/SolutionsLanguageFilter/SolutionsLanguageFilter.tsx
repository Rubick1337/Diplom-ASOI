'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import './LanguageFilter.css';

export type FilterLanguageValue = 'all' | 'javascript' | 'typescript' | 'python' | 'cpp' | 'coffeescript';

interface FilterOption {
    value: FilterLanguageValue;
    label: string;
    iconPath: string;
}

const filterOptions: FilterOption[] = [
    {value: 'all', label: 'Все языки', iconPath: '/images/languges/allLanguges.png'},
    { value: 'javascript', label: 'JavaScript', iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
    { value: 'typescript', label: 'TypeScript', iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
    { value: 'python', label: 'Python', iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
    { value: 'cpp', label: 'C++', iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
    { value: 'coffeescript', label: 'CoffeeScript', iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/coffeescript/coffeescript-original.svg' },
];

interface LanguageFilterProps {
    value: FilterLanguageValue;
    onChange: (value: FilterLanguageValue) => void;
}

export const SolutionsLanguageFilter: React.FC<LanguageFilterProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = filterOptions.find(opt => opt.value === value) || filterOptions[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="language-filter-wrapper" ref={containerRef}>
            <div className={`lf-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <div className="lf-value">
                    <Image
                        src={selected.iconPath}
                        alt={selected.label}
                        className="lf-icon"
                        width={20}
                        height={20}
                        unoptimized
                    />
                    {selected.label}
                </div>
                <svg className="lf-arrow" width="10" height="6" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            {isOpen && (
                <ul className="lf-options">
                    {filterOptions.map((opt) => (
                        <li
                            key={opt.value}
                            className={`lf-option ${selected.value === opt.value ? 'selected' : ''}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            <Image
                                src={opt.iconPath}
                                alt={opt.label}
                                className="lf-icon"
                                width={20}
                                height={20}
                                unoptimized
                            />
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
