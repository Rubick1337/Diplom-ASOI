'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import '@/widgets/MainHeader/Header.css';
import './Header.css'
import NotificationBell from '@/widgets/NotificationBell/NotificationBell';
import UserSidebar from '@/widgets/UserSidebar/UserSidebar';

import { RootState } from '@/shared/store/store';

const getAvatarColor = (name: string) => {
    const colors = ['#FF6B35', '#F04949', '#4ade80', '#fbbf24', '#8b5cf6', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function AuthHeader() {
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { user, isInitialized } = useSelector((state: RootState) => state.auth);

    const XP_PER_LEVEL = 500;
    const currentXP = user?.experience || 0;

    const userLevel = Math.floor(currentXP / XP_PER_LEVEL) + 1;

    const xpInCurrentLevel = currentXP % XP_PER_LEVEL;
    const xpPercent = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

    const initials = user?.username
        ? user.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'GC';

    const avatarColor = user?.username ? getAvatarColor(user.username) : '#333';

    return (
        <>
        {mounted && isInitialized && user && <UserSidebar drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />}
        <header className="site-header">
            <div className="header-inner">
                <button className="brand" onClick={() => router.push('/')}>
                    <span className="brand-logo">
                        <Image src="/logo.png" alt="Лого" width={45} height={45} priority />
                    </span>
                    <span className="brand-name">GooseCode</span>
                </button>

                <div className="header-right-section">
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
                                    <div className="level-container">
                                        <span className="level-text">LVL {userLevel}</span>
                                        <div className="xp-bar-bg">
                                            <motion.div
                                                className="xp-bar-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${xpPercent}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <motion.div
                                    className="avatar-box"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => router.push('/profile')}
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
                    ) : (
                        <div className="header-actions">
                            <button className="btn-dark" onClick={() => router.push('/auth/login')}>
                                Войти
                            </button>
                        </div>
                    )}

                    </div>
            </div>
        </header>
        </>
    );
}
