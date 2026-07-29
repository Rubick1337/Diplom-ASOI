'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import '@/widgets/MainHeader/Header.css';
import '@/widgets/Header/Header.css';
import './AdminHeader.css';
import NotificationBell from '@/widgets/NotificationBell/NotificationBell';
import UserSidebar from '@/widgets/UserSidebar/UserSidebar';
import ThemeToggle from '@/widgets/ThemeToggle/ThemeToggle';
import { RootState } from '@/shared/store/store';

const getAvatarColor = (name: string) => {
    const colors = ['#FF6B35', '#F04949', '#4ade80', '#fbbf24', '#8b5cf6', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function AdminHeader() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { user, isInitialized } = useSelector((state: RootState) => state.auth);

    const initials = user?.username
        ? user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'AD';

    const avatarColor = user?.username ? getAvatarColor(user.username) : '#333';

    const roleLabel =
        user?.roleName === 'admin' ? 'Администратор' :
        user?.roleName === 'owner' ? 'Владелец' :
        user?.roleName ?? 'Роль';

    return (
        <>
            {mounted && isInitialized && user && (
                <UserSidebar drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
            )}
            <header className="site-header">
                <div className="header-inner">

                    {}
                    <div className="admin-header-brand">
                        <div className="admin-header-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <span className="admin-header-title">Админ панель</span>
                    </div>

                    {}
                    <div className="header-right-section">
                        {!mounted || !isInitialized ? null : user ? (
                            <>
                                <ThemeToggle />
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
                                        <span className="admin-role-badge">{roleLabel}</span>
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
            </header>
        </>
    );
}
