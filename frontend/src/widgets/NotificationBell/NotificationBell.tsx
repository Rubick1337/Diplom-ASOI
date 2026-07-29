'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import $api from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/apiEndpoints';
import './NotificationBell.css';

interface Notif {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    challengeId: number | null;
}

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9005/api').replace(/\/api$/, '');

const TYPE_COLOR: Record<string, string> = {
    report:      '#FF6B35',
    admin:       '#58a6ff',
    achievement: '#c084fc',
};
const TYPE_ICON: Record<string, string> = {
    report: '⚑',
    admin:  '🛡',
};
const RARITY_COLOR: Record<string, string> = {
    common:    '#9ca3af',
    uncommon:  '#4ade80',
    rare:      '#60a5fa',
    epic:      '#c084fc',
    legendary: '#fbbf24',
};

interface AchPayload { desc: string; rarity: string; imageFilename: string | null; }
function parseAch(msg: string): AchPayload | null {
    try { return JSON.parse(msg); } catch { return null; }
}

function timeAgo(date: string): string {
    const normalized = date.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(date) ? date : date + 'Z';
    const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
    if (diff < 60)   return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

export default function NotificationBell() {
    const [notifs, setNotifs] = useState<Notif[]>([]);
    const [open,   setOpen]   = useState(false);
    const [tab,    setTab]    = useState<'all' | 'unread'>('all');
    const ref = useRef<HTMLDivElement>(null);

    const fetchNotifs = useCallback(async () => {
        try {
            const { data } = await $api.get(API_ENDPOINTS.NOTIFICATIONS.GET);
            setNotifs(data);
        } catch {}
    }, []);

    useEffect(() => {
        fetchNotifs();
        const id = setInterval(fetchNotifs, 30_000);
        return () => clearInterval(id);
    }, [fetchNotifs]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const markRead = async (id: number) => {
        try {
            await $api.patch(API_ENDPOINTS.NOTIFICATIONS.READ(id));
            setNotifs(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
        } catch {}
    };

    const deleteOne = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await $api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE_ONE(id));
            setNotifs(n => n.filter(x => x.id !== id));
        } catch {}
    };

    const deleteAll = async () => {
        try {
            await $api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL);
            setNotifs([]);
        } catch {}
    };

    const markAll = async () => {
        const unread = notifs.filter(n => !n.isRead);
        await Promise.all(unread.map(n => $api.patch(API_ENDPOINTS.NOTIFICATIONS.READ(n.id)).catch(() => {})));
        setNotifs(n => n.map(x => ({ ...x, isRead: true })));
    };

    const unreadCount = notifs.filter(n => !n.isRead).length;
    const displayed   = tab === 'unread' ? notifs.filter(n => !n.isRead) : notifs;

    return (
        <div className="nb-wrap" ref={ref}>
            <button
                className={`nb-btn${open ? ' nb-btn--active' : ''}`}
                onClick={() => setOpen(v => !v)}
                title="Уведомления"
            >
                <svg className="nb-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {unreadCount > 0 && (
                    <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="nb-dropdown">
                    {}
                    <div className="nb-head">
                        <span className="nb-head__title">Уведомления</span>
                        <div className="nb-head__actions">
                            {unreadCount > 0 && (
                                <button className="nb-action-btn" onClick={markAll} title="Прочитать все">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 12l5 5L22 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                            )}
                            {notifs.length > 0 && (
                                <button className="nb-action-btn nb-action-btn--danger" onClick={deleteAll} title="Удалить все">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="nb-tabs">
                        <button className={`nb-tab${tab === 'all' ? ' nb-tab--active' : ''}`} onClick={() => setTab('all')}>
                            Все <span className="nb-tab-count">{notifs.length}</span>
                        </button>
                        <button className={`nb-tab${tab === 'unread' ? ' nb-tab--active' : ''}`} onClick={() => setTab('unread')}>
                            Непрочитанные {unreadCount > 0 && <span className="nb-tab-count nb-tab-count--orange">{unreadCount}</span>}
                        </button>
                    </div>

                    {}
                    {displayed.length === 0 ? (
                        <div className="nb-empty">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="nb-empty__icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span>{tab === 'unread' ? 'Нет непрочитанных' : 'Нет уведомлений'}</span>
                        </div>
                    ) : (
                        <ul className="nb-list">
                            {displayed.map(n => (
                                <li
                                    key={n.id}
                                    className={`nb-item${n.isRead ? '' : ' nb-item--unread'}`}
                                    onClick={() => !n.isRead && markRead(n.id)}
                                    style={{ '--accent': TYPE_COLOR[n.type] ?? '#FF6B35' } as React.CSSProperties}
                                >
                                    <div className="nb-item__indicator" />
                                    {n.type === 'achievement' ? (() => {
                                        const ach = parseAch(n.message);
                                        const color = ach ? (RARITY_COLOR[ach.rarity] ?? '#c084fc') : '#c084fc';
                                        return (
                                            <div className="nb-item__ach-icon" style={{ borderColor: `${color}50` }}>
                                                {ach?.imageFilename
                                                    ? <img src={`${BACKEND_BASE}/achievements/${ach.imageFilename}`} alt="" className="nb-item__ach-img" onError={e => { e.currentTarget.style.display = 'none'; }} />
                                                    : <span>🏅</span>}
                                            </div>
                                        );
                                    })() : (
                                        <div className="nb-item__icon-wrap" style={{ background: `${TYPE_COLOR[n.type] ?? '#FF6B35'}18`, color: TYPE_COLOR[n.type] ?? '#FF6B35' }}>
                                            <span>{TYPE_ICON[n.type] ?? '🔔'}</span>
                                        </div>
                                    )}
                                    <div className="nb-item__content">
                                        <div className="nb-item__top">
                                            <span className="nb-item__title">{n.title}</span>
                                            <span className="nb-item__time">{timeAgo(n.createdAt)}</span>
                                        </div>
                                        {(() => {
                                            if (n.type === 'achievement') {
                                                const ach = parseAch(n.message);
                                                if (!ach) return <p className="nb-item__msg">{n.message}</p>;
                                                const color = RARITY_COLOR[ach.rarity] ?? '#c084fc';
                                                return (
                                                    <>
                                                        <p className="nb-item__msg">{ach.desc}</p>
                                                        <span className="nb-item__ach-rarity" style={{ color, borderColor: `${color}40` }}>
                                                            {ach.rarity}
                                                        </span>
                                                    </>
                                                );
                                            }
                                            const SPLIT = '\n\nКомментарий администратора: ';
                                            const idx = n.message.indexOf(SPLIT);
                                            if (idx === -1) return <p className="nb-item__msg">{n.message}</p>;
                                            const base    = n.message.slice(0, idx);
                                            const comment = n.message.slice(idx + SPLIT.length);
                                            return (
                                                <>
                                                    <p className="nb-item__msg">{base}</p>
                                                    <div className="nb-item__admin-comment">
                                                        <span className="nb-item__admin-label">Комментарий администратора</span>
                                                        <span className="nb-item__admin-text">{comment}</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <button className="nb-item__del" onClick={e => deleteOne(e, n.id)} title="Удалить">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
