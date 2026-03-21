'use client';

import React from 'react';
import './AdminTabs.css';

export type TabId = 'reports' | 'manage' | 'topics';

const TABS: { id: TabId; label: string; icon: string; desc: string }[] = [
    { id: 'reports', label: 'Репорты',    icon: '◌', desc: 'Жалобы — просмотр и обработка' },
    { id: 'manage',  label: 'Задачи',     icon: '⊞', desc: 'Управление задачами (CRUD)' },
    { id: 'topics',  label: 'Темы',       icon: '⊟', desc: 'Управление темами' },
];

export { TABS };

interface Props {
    active: TabId;
    onChange: (id: TabId) => void;
}

export default function AdminTabs({ active, onChange }: Props) {
    return (
        <nav className="admin-sidebar">
            <ul className="admin-sidebar__list">
                {TABS.map(t => (
                    <li key={t.id}>
                        <button
                            onClick={() => onChange(t.id)}
                            className={`admin-sidebar__item${active === t.id ? ' admin-sidebar__item--active' : ''}`}
                        >
                            <span className="admin-sidebar__icon">{t.icon}</span>
                            <span className="admin-sidebar__text">
                                <span className="admin-sidebar__label">{t.label}</span>
                                <span className="admin-sidebar__desc">{t.desc}</span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
