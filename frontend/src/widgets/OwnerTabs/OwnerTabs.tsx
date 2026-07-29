'use client';

import React from 'react';
import './OwnerTabs.css';

export type OwnerTabId = 'overview' | 'challenges' | 'reports' | 'tests';

const TABS: { id: OwnerTabId; label: string; icon: string; desc: string }[] = [
    { id: 'overview',   label: 'Обзор',   icon: '◈', desc: 'Ключевые показатели платформы' },
    { id: 'challenges', label: 'Задачи',  icon: '◉', desc: 'Статистика по задачам' },
    { id: 'reports',    label: 'Репорты', icon: '◌', desc: 'Аналитика жалоб' },
    { id: 'tests',      label: 'Тесты',   icon: '◷', desc: 'Аналитика по тестам' },
];

interface Props {
    active: OwnerTabId;
    onChange: (id: OwnerTabId) => void;
}

export default function OwnerTabs({ active, onChange }: Props) {
    return (
        <nav className="owner-sidebar">
            <ul className="owner-sidebar__list">
                {TABS.map(t => (
                    <li key={t.id}>
                        <button
                            onClick={() => onChange(t.id)}
                            className={`owner-sidebar__item${active === t.id ? ' owner-sidebar__item--active' : ''}`}
                        >
                            <span className="owner-sidebar__icon">{t.icon}</span>
                            <span className="owner-sidebar__text">
                                <span className="owner-sidebar__label">{t.label}</span>
                                <span className="owner-sidebar__desc">{t.desc}</span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
