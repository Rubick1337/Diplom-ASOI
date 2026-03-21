'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import './LanguageSelect.css';

export type LanguageValue = 'javascript' | 'typescript' | 'python' | 'cpp' | 'coffeescript' | 'php' | 'csharp' | 'java';

interface LanguageOption {
    value: LanguageValue;
    label: string;
    iconPath: string;
    extension: string;
}

export const languages: LanguageOption[] = [
    { value: 'javascript',  label: 'JavaScript',  iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',   extension: '.js' },
    { value: 'typescript',  label: 'TypeScript',  iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',     extension: '.ts' },
    { value: 'python',      label: 'Python',      iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',             extension: '.py' },
    { value: 'cpp',         label: 'C++',         iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',       extension: '.cpp' },
    { value: 'csharp',      label: 'C#',          iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',             extension: '.cs' },
    { value: 'php',         label: 'PHP',         iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',                   extension: '.php' },
    { value: 'coffeescript',label: 'CoffeeScript',iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/coffeescript/coffeescript-original.svg', extension: '.coffee' },
    { value: 'java',        label: 'Java',        iconPath: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',                 extension: '.java' },
];

interface LanguageSelectProps {
    currentValue: LanguageValue;
    onChange: (lang: LanguageOption) => void;
}

export default function LanguageSelect({ currentValue, onChange }: LanguageSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = languages.find(l => l.value === currentValue) || languages[0];

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
        <div className="language-select-wrapper" ref={containerRef}>
            <div className={`ls-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <div className="ls-value">
                    <Image src={selected.iconPath} alt={selected.label} width={20} height={20} unoptimized />
                    {selected.label}
                </div>
                <svg className="ls-arrow" width="10" height="6" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            {isOpen && (
                <ul className="ls-options">
                    {languages.map((lang) => (
                        <li
                            key={lang.value}
                            className={`ls-option ${selected.value === lang.value ? 'selected' : ''}`}
                            onClick={() => { onChange(lang); setIsOpen(false); }}
                        >
                            <Image src={lang.iconPath} alt={lang.label} width={20} height={20} unoptimized />
                            {lang.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
