'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import '@/widgets/MainHeader/Header.css';
import ThemeToggle from '@/widgets/ThemeToggle/ThemeToggle';

export default function AuthHeader() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const goHome = () => { setOpen(false); router.push('/'); };

    return (
        <header className="site-header">
            <div className="header-inner">
                <button className="brand" onClick={goHome}>
                    <span className="brand-logo">
                        <Image src="/logo.png" alt="Лого" width={68} height={68} className="brand-logo-img" priority />
                    </span>
                    <span className="brand-name">GooseCode</span>
                </button>

                <nav className="nav-desktop">
                    <button className="nav-link" onClick={goHome}>Главная</button>
                </nav>

                <div className="header-actions">
                    <ThemeToggle />
                    <button className="btn-dark" onClick={() => router.push('/auth/login')}>Войти</button>
                    <button className="btn-accent" onClick={() => router.push('/auth/register')}>Присоединиться</button>
                </div>

                <button className="burger" onClick={() => setOpen(v => !v)} aria-label="Меню">
                    <span /><span /><span />
                </button>
            </div>

            {}
            <div className={`mh-overlay${open ? ' mh-overlay--open' : ''}`} onClick={() => setOpen(false)}>
                <nav className="mh-drawer" onClick={e => e.stopPropagation()}>
                    <div className="mh-drawer__header">
                        <span className="mh-drawer__title">Меню</span>
                        <button className="mh-drawer__close mh-drawer__close--open" onClick={() => setOpen(false)} aria-label="Закрыть">
                            <span /><span /><span />
                        </button>
                    </div>

                    <ul className="mh-drawer__list">
                        <li>
                            <button className="mh-drawer__item" onClick={goHome}>Главная</button>
                        </li>
                    </ul>

                    <div className="mh-drawer__bottom">
                        <button className="mh-drawer__btn mh-drawer__btn--dark" onClick={() => { setOpen(false); router.push('/auth/login'); }}>Войти</button>
                        <button className="mh-drawer__btn mh-drawer__btn--accent" onClick={() => { setOpen(false); router.push('/auth/register'); }}>Присоединиться</button>
                    </div>
                </nav>
            </div>
        </header>
    );
}
