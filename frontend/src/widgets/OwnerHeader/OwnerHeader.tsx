'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import '@/widgets/MainHeader/Header.css';
import '@/widgets/Header/Header.css';
import '@/widgets/AdminHeader/AdminHeader.css';
import './OwnerHeader.css';
import NotificationBell from '@/widgets/NotificationBell/NotificationBell';
import UserSidebar from '@/widgets/UserSidebar/UserSidebar';
import DateRangePicker from '@/shared/components/DateRangePicker/DateRangePicker';
import { RootState } from '@/shared/store/store';

const PERIODS = [
    { label: '7д' },
    { label: '30д' },
    { label: '90д' },
    { label: 'Период' },
];

const getAvatarColor = (name: string) => {
    const colors = ['#FF6B35', '#F04949', '#4ade80', '#fbbf24', '#8b5cf6', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

interface Props {
    periodIdx: number;
    setPeriodIdx: (i: number) => void;
    customFrom: string;
    setCustomFrom: (v: string) => void;
    customTo: string;
    setCustomTo: (v: string) => void;
    exporting: boolean;
    onRefresh: () => void;
    onExportTab: () => void;
    onExportFull: () => void;
}

export default function OwnerHeader({
    periodIdx, setPeriodIdx,
    customFrom, setCustomFrom,
    customTo, setCustomTo,
    exporting,
    onRefresh, onExportTab, onExportFull,
}: Props) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [controlsOpen, setControlsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { user, isInitialized } = useSelector((state: RootState) => state.auth);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!controlsOpen) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                dropdownRef.current && !dropdownRef.current.contains(target) &&
                toggleRef.current && !toggleRef.current.contains(target)
            ) {
                setControlsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [controlsOpen]);

    const initials = user?.username
        ? user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'OW';

    const avatarColor = user?.username ? getAvatarColor(user.username) : '#333';

    const periodControls = (
        <>
            <div className="owner-header-periods">
                {PERIODS.map((p, i) => (
                    <button
                        key={i}
                        onClick={() => { setPeriodIdx(i); setControlsOpen(false); }}
                        className={`owner-header-period-btn${periodIdx === i ? ' owner-header-period-btn--active' : ''}`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
            {periodIdx === 3 && (
                <DateRangePicker
                    from={customFrom}
                    to={customTo}
                    onChange={(from, to) => { setCustomFrom(from); setCustomTo(to); }}
                />
            )}
            <button onClick={onRefresh} className="owner-header-btn owner-header-btn--ghost" title="Обновить">↻</button>
            <button onClick={onExportTab} disabled={exporting} className="owner-header-btn">Вкладка</button>
            <button onClick={onExportFull} disabled={exporting} className="owner-header-btn owner-header-btn--primary">
                {exporting ? 'Генерация...' : 'Полный отчёт'}
            </button>
        </>
    );

    return (
        <>
            {mounted && isInitialized && user && (
                <UserSidebar drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
            )}
            <header className="site-header owner-site-header">
                <div className="header-inner">

                    {}
                    <div className="admin-header-brand">
                        <div className="admin-header-icon owner-header-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="2"/>
                                <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="2"/>
                                <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </div>
                        <span className="admin-header-title owner-header-title">Аналитика платформы</span>
                    </div>

                    {}
                    <div className="owner-header-controls">
                        {periodControls}
                    </div>

                    {}
                    <div className="header-right-section">
                        {}
                        <button
                            ref={toggleRef}
                            className={`owner-header-toggle-btn${controlsOpen ? ' owner-header-toggle-btn--active' : ''}`}
                            onClick={() => setControlsOpen(v => !v)}
                            title="Фильтры"
                            aria-label="Фильтры периода"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>

                        {!mounted || !isInitialized ? null : user ? (
                            <>
                                <NotificationBell />
                                <button
                                    className="header-burger"
                                    onClick={() => setDrawerOpen(v => !v)}
                                    aria-label="Меню"
                                >
                                    <span /><span /><span />
                                </button>
                                <div className="user-profile-card">
                                    <div className="user-text-data">
                                        <span className="user-nickname">{user.username}</span>
                                        <span className="admin-role-badge owner-role-badge">Владелец</span>
                                    </div>
                                    <motion.div
                                        className="avatar-box"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <div
                                            className="avatar-placeholder gamer-style"
                                            style={{ backgroundColor: avatarColor }}
                                        >
                                            {initials}
                                            <div className="avatar-glass-effect" />
                                        </div>
                                        <div className="avatar-border-effect" />
                                    </motion.div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {}
                {controlsOpen && (
                    <div className="owner-header-dropdown" ref={dropdownRef}>
                        {periodControls}
                    </div>
                )}
            </header>
        </>
    );
}
