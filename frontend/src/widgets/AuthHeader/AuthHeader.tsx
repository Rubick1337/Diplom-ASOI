'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import '@/widgets/MainHeader/Header.css';

export default function AuthHeader() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const goHome = () => {
        router.push('/');
        setOpen(false);
    };

    return (
        <header className="site-header">
            <div className="header-inner">

                <button className="brand" onClick={goHome}>
                    <span className="brand-logo">
                        <Image
                            src="/logo.png"
                            alt="Лого"
                            width={68}
                            height={68}
                            className="brand-logo-img"
                            priority
                        />
                    </span>
                    <span className="brand-name">GooseCode</span>
                </button>

                <nav className="nav-desktop">
                    <button className="nav-link" onClick={goHome}>
                        Главная
                    </button>
                </nav>

                <div className="header-actions">
                    <button className="btn-dark" onClick={() => router.push('/auth/login')}>
                        Войти
                    </button>
                    <button className="btn-accent" onClick={() => router.push('/auth/register')}>
                        Присоединиться
                    </button>
                </div>

                <button
                    className={`burger ${open ? 'is-open' : ''}`}
                    onClick={() => setOpen(v => !v)}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            {/* ✅ Mobile panel */}
            <div className={`mobile-panel ${open ? 'show' : ''}`}>
                <button className="mobile-link" onClick={goHome}>
                    Главная
                </button>

                <div className="mobile-buttons">
                    <button className="mobile-btn-dark" onClick={() => router.push('/auth/login')}>
                        Войти
                    </button>
                    <button className="mobile-btn-accent" onClick={() => router.push('/auth/register')}>
                        Присоединиться
                    </button>
                </div>
            </div>
        </header>
    );
}
