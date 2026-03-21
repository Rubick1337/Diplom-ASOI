'use client';

import React from 'react';
import NextImage from 'next/image';

interface RoomCardProps {
    code: string;
    hostUsername: string;
    hasPassword: boolean;
    onJoin: (code: string) => void;
}

export default function RoomCard({ code, hostUsername, hasPassword, onJoin }: RoomCardProps) {
    return (
        <article className="challenge-card room-card">
            <header className="challenge-card-head">
                <div className="challenge-card-badge">
                    {hostUsername.slice(0, 2).toUpperCase()}
                </div>
                <div className="challenge-card-title-area">
                    <h2 className="challenge-card-title">{hostUsername}</h2>
                    <span className="challenge-card-topic" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <NextImage src={hasPassword ? '/images/arena/locker.png' : '/images/arena/globe.png'} alt="" width={14} height={14} />
                        {hasPassword ? 'С паролем' : 'Открытая'}
</span>
                </div>
            </header>

            <div className="challenge-card-meta">
                <div className="challenge-card-meta-row">
                    <span className="challenge-card-meta-label">Код комнаты</span>
                    <span className="challenge-card-meta-value" style={{ letterSpacing: '2px', color: '#FF6B35' }}>
                        {code}
                    </span>
                </div>
                <div className="challenge-card-meta-row">
                    <span className="challenge-card-meta-label">Статус</span>
                    <span className="challenge-card-meta-value" style={{ color: '#4caf50' }}>
                        ● Ожидает игрока
                    </span>
                </div>
            </div>

            <div className="challenge-card-footer">
                <button
                    className="challenge-card-btn"
                    onClick={() => onJoin(code)}
                >
                    Войти
                </button>
            </div>
        </article>
    );
}
