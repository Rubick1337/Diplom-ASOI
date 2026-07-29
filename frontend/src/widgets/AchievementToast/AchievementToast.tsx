'use client';
import React, { useEffect, useRef, useState } from 'react';
import './AchievementToast.css';

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9005/api').replace(/\/api$/, '');

export interface AchievementToastData {
    id: number; title: string; desc: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    imageFilename: string | null;
}

interface Props { achievements: AchievementToastData[]; onDismiss: (id: number) => void; }

const RM = {
    common:    { label: 'Common',    color: '#9ca3af', glow: 'rgba(156,163,175,0.5)' },
    uncommon:  { label: 'Uncommon',  color: '#4ade80', glow: 'rgba(74,222,128,0.6)'  },
    rare:      { label: 'Rare',      color: '#60a5fa', glow: 'rgba(96,165,250,0.6)'  },
    epic:      { label: 'Epic',      color: '#c084fc', glow: 'rgba(192,132,252,0.65)'},
    legendary: { label: 'Legendary', color: '#fbbf24', glow: 'rgba(251,191,36,0.70)' },
};

function playAchievementSound() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('achievement_sound_disabled') === '1') return;
    try {
        const audio = new Audio('/steam-achievement.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {});
    } catch {}
}

function Toast({ a, onDismiss }: { a: AchievementToastData; onDismiss: () => void }) {
    const rm = RM[a.rarity] ?? RM.common;
    const [exiting, setExiting] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dismiss = () => { setExiting(true); setTimeout(onDismiss, 380); };
    useEffect(() => {
        playAchievementSound();
        timer.current = setTimeout(dismiss, 5000);
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, []);

    return (
        <div
            className={`ach-toast ach-toast--${a.rarity}${exiting ? ' ach-toast--exit' : ''}`}
            style={{ '--color': rm.color, '--glow': rm.glow } as React.CSSProperties}
            onClick={dismiss}
        >
            <div className="ach-toast__icon-wrap">
                {a.imageFilename && (
                    <img src={`${BACKEND_BASE}/achievements/${a.imageFilename}`} alt={a.title}
                        className="ach-toast__img"
                        onError={e => { e.currentTarget.style.display = 'none'; const fb = e.currentTarget.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = 'inline'; }}
                    />
                )}
                <span className="ach-toast__icon" style={{ display: a.imageFilename ? 'none' : undefined }}>🏅</span>
                <div className="ach-toast__ring" />
            </div>
            <div className="ach-toast__body">
                <div className="ach-toast__label">Достижение получено!</div>
                <div className="ach-toast__title">{a.title}</div>
                <div className="ach-toast__desc">{a.desc}</div>
                <div className="ach-toast__rarity" style={{ color: rm.color }}>{rm.label}</div>
            </div>
            <div className="ach-toast__bar"><div className="ach-toast__bar-fill" /></div>
        </div>
    );
}

export default function AchievementToastContainer({ achievements, onDismiss }: Props) {
    if (!achievements.length) return null;
    return (
        <div className="ach-toast-container">
            {achievements.map(a => <Toast key={a.id} a={a} onDismiss={() => onDismiss(a.id)} />)}
        </div>
    );
}
