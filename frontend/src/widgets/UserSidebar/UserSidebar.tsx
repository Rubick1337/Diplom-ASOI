'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/shared/store/store';
import { logout } from '@/shared/store/slice/authSlice';
import './UserSidebar.css';

type NavItem = { href: string; label: string; desc: string; icon: React.ReactNode };

const ICON_CODE = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const ICON_PROFILE = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    </svg>
);
const ICON_LEADERBOARD = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="20" x2="12" y2="4"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="6"  y1="20" x2="6"  y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const ICON_BATTLE = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 19l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const ICON_REPORT = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const ICON_TOPIC = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const ICON_OVERVIEW = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    </svg>
);
const ICON_USERS = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const NAV_BY_ROLE: Record<string, NavItem[]> = {
    user: [
        { href: '/challenges',  label: 'Задачи',    desc: 'Все задачи',          icon: ICON_CODE },
        { href: '/profile',     label: 'Профиль',   desc: 'Мой профиль',         icon: ICON_PROFILE },
        { href: '/leaderboard', label: 'Лидерборд', desc: 'Таблица лидеров',     icon: ICON_LEADERBOARD },
        { href: '/battle',      label: 'Арена',     desc: 'Битвы и дуэли',       icon: ICON_BATTLE },
    ],
    admin: [
        { href: '/admin?tab=reports', label: 'Репорты', desc: 'Жалобы и обработка',    icon: ICON_REPORT },
        { href: '/admin?tab=manage',  label: 'Задачи',  desc: 'Управление задачами',   icon: ICON_CODE },
        { href: '/admin?tab=topics',  label: 'Темы',    desc: 'Управление темами',     icon: ICON_TOPIC },
    ],
    owner: [
        { href: '/owner?tab=overview',   label: 'Обзор',          desc: 'Ключевые показатели', icon: ICON_OVERVIEW },
        { href: '/owner?tab=challenges', label: 'Задачи',         desc: 'Статистика задач',    icon: ICON_CODE },
        { href: '/owner?tab=users',      label: 'Пользователи',   desc: 'Топ и рейтинг',       icon: ICON_USERS },
        { href: '/owner?tab=reports',    label: 'Репорты',        desc: 'Аналитика жалоб',     icon: ICON_REPORT },
    ],
};

interface UserSidebarProps {
    drawerOpen?: boolean;
    setDrawerOpen?: (v: boolean | ((prev: boolean) => boolean)) => void;
}

export default function UserSidebar({ drawerOpen: extOpen, setDrawerOpen: extSet }: UserSidebarProps = {}) {
    const pathname     = usePathname();
    const searchParams = useSearchParams();
    const router       = useRouter();
    const dispatch     = useDispatch<AppDispatch>();
    const user         = useSelector((s: RootState) => s.auth.user);
    const [intOpen, setIntOpen] = useState(false);
    const drawerOpen    = extOpen    ?? intOpen;
    const setDrawerOpen = extSet     ?? setIntOpen;

    const navItems: NavItem[] = NAV_BY_ROLE[user?.roleName ?? 'user'] ?? NAV_BY_ROLE['user'];

    const currentTab = searchParams.get('tab');
    const isActive = (href: string) => {
        const [hPath, hQuery] = href.split('?');
        if (pathname !== hPath) return false;
        if (!hQuery) return !currentTab;
        const hTab = new URLSearchParams(hQuery).get('tab');
        return hTab === currentTab;
    };

    useEffect(() => { setDrawerOpen(false); }, [pathname, currentTab]);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    const handleLogout = async () => {
        setDrawerOpen(false);
        await dispatch(logout());
        router.push('/auth/login');
    };

    const go = (href: string) => { setDrawerOpen(false); router.push(href); };

    return (
        <>
            {}
            <nav className="usb-sidebar">
                <ul className="usb-list">
                    {navItems.map(item => (
                        <li key={item.href}>
                            <button
                                onClick={() => go(item.href)}
                                className={`usb-item${isActive(item.href) ? ' usb-item--active' : ''}`}
                            >
                                <span className="usb-icon">{item.icon}</span>
                                <span className="usb-text">
                                    <span className="usb-label">{item.label}</span>
                                    <span className="usb-desc">{item.desc}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="usb-bottom">
                    <button className="usb-item usb-item--logout" onClick={handleLogout}>
                        <span className="usb-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </span>
                        <span className="usb-text">
                            <span className="usb-label usb-label--logout">Выйти</span>
                        </span>
                    </button>
                </div>
            </nav>

            {}
            <div
                className={`usb-overlay${drawerOpen ? ' usb-overlay--open' : ''}`}
                onClick={() => setDrawerOpen(false)}
            >
                    <nav className="usb-drawer" onClick={e => e.stopPropagation()}>
                        <div className="usb-drawer__header">
                            <span className="usb-drawer__title">Навигация</span>
                            <button className="usb-drawer__close usb-drawer__close--open" onClick={() => setDrawerOpen(false)} aria-label="Закрыть">
                                <span /><span /><span />
                            </button>
                        </div>

                        <ul className="usb-drawer__list">
                            {navItems.map(item => (
                                <li key={item.href}>
                                    <button
                                        onClick={() => go(item.href)}
                                        className={`usb-drawer__item${isActive(item.href) ? ' usb-drawer__item--active' : ''}`}
                                    >
                                        <span className="usb-drawer__icon">{item.icon}</span>
                                        <span className="usb-drawer__label">{item.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="usb-drawer__bottom">
                            <button className="usb-drawer__item usb-drawer__item--logout" onClick={handleLogout}>
                                <span className="usb-drawer__icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </span>
                                <span className="usb-drawer__label usb-drawer__label--logout">Выйти</span>
                            </button>
                        </div>
                    </nav>
            </div>
        </>
    );
}
