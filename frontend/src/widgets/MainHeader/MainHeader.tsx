'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import './Header.css';

type NavItem = { id: string; label: string };



const NAV: NavItem[] = [
    { id: 'hero',        label: 'Главная' },
    { id: 'challenges',  label: 'Задачи' },
    { id: 'howitworks',  label: 'Как это работает' },
    { id: 'community',   label: 'Сообщество' },
    { id: 'creator',     label: 'О создателе' },
];

export default function MainHeader() {
    const [open, setOpen]   = useState(false);
    const [active, setAct]  = useState<string>('hero');
    const router = useRouter();
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = open ? 'hidden' : '';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open]);

    useEffect(() => {
        const handleScroll = () => {
            const midpoint = window.innerHeight / 2;
            let current = NAV[0].id;
            for (const item of NAV) {
                const section = document.getElementById(item.id);
                if (!section) continue;
                const rect = section.getBoundingClientRect();
                if (rect.top <= midpoint && rect.bottom >= midpoint) current = item.id;
            }
            setAct(current);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleNav = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        setOpen(false);

        const el = document.getElementById(id);
        if (!el) return;

        const headerH = parseInt(
            getComputedStyle(document.documentElement)
                .getPropertyValue('--header-h')
                .trim()
                .replace('px','')
        ) || 74;

        const extra = 12;
        const y = el.getBoundingClientRect().top + window.scrollY - (headerH + extra);

        window.history.replaceState(null, "", `#${id}`);
        window.scrollTo({ top: y, behavior: 'smooth' });
    };


    const links = useMemo(() => (
        NAV.map(item => (
            <a
                key={item.id}
                href={`#${item.id}`}
                onClick={handleNav(item.id)}
                className={`nav-link ${active === item.id ? 'is-active' : ''}`}
            >
                {item.label}
            </a>
        ))
    ), [active]);

    return (
        <header className="site-header">
            <div className="header-inner">
                <a href="#hero" onClick={handleNav('hero')} className="brand">
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
                </a>

                <nav className="nav-desktop">
                    {links}
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
                    aria-expanded={open}
                    aria-controls="mobile-panel"
                    aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            <div
                className={`backdrop ${open ? 'show' : ''}`}
                onClick={() => setOpen(false)}
            />

            <div className={`mobile-panel ${open ? 'show' : ''}`}>
                {NAV.map(item => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={handleNav(item.id)}
                        className={`mobile-link ${active === item.id ? 'is-active' : ''}`}
                    >
                        {item.label}
                    </a>
                ))}

                <div className="mobile-buttons">
                    <button className="mobile-btn-dark">Войти</button>
                    <button className="mobile-btn-accent">Присоединиться</button>
                </div>
            </div>
        </header>
    );
}
