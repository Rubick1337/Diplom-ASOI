'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface RoomPhaseProps {
    currentUser: any;
    createdRoomCode: string;
    createdRoomHasPassword: boolean;
    createPassword: string;
    roomGuest: string | null;
    onCancel: () => void;
}

export default function RoomPhase({
    currentUser,
    createdRoomCode,
    createdRoomHasPassword,
    createPassword,
    roomGuest,
    onCancel,
}: RoomPhaseProps) {
    return (
        <main className="challenges-main app-main-page arena-mode">
            <section className="cp-container" style={{ maxWidth: 560, margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rp-card"
                >
                    <div className="rp-card-header">
                        <Image src="/images/arena/duel.png" alt="" width={36} height={36} />
                        <h1 className="rp-title">Комната создана</h1>
                    </div>

                    <div className="rp-sections">

                        <div className="rp-code-block">
                            <p className="rp-label">Код комнаты</p>
                            <div className="rp-code-value">{createdRoomCode}</div>
                            <button className="btn-random" style={{ width: '100%' }} onClick={() => navigator.clipboard.writeText(createdRoomCode)}>
                                📋 Скопировать код
                            </button>
                        </div>

                        <div className="rp-info-grid">
                            <div className="rp-info-cell">
                                <p className="rp-label">Тип комнаты</p>
                                <p className="rp-info-val" style={{ color: createdRoomHasPassword ? '#f0a500' : '#4caf50' }}>
                                    {createdRoomHasPassword ? '🔒 Закрытая' : '🌐 Открытая'}
                                </p>
                            </div>
                            <div className="rp-info-cell">
                                <p className="rp-label">Пароль</p>
                                <p className="rp-info-val rp-info-val--password" data-has={createdRoomHasPassword ? 'true' : 'false'}>
                                    {createdRoomHasPassword ? createPassword || '••••••' : 'Нет'}
                                </p>
                            </div>
                        </div>

                        <div className="rp-players-block">
                            <p className="rp-label">Игроки</p>
                            <div className="rp-players-list">
                                <div className="rp-player-row">
                                    <div className="rp-dot rp-dot--online" />
                                    <span className="rp-player-name">{currentUser.username}</span>
                                    <span className="rp-badge rp-badge--host">хост</span>
                                </div>
                                <div className="rp-player-row">
                                    {roomGuest ? (
                                        <>
                                            <div className="rp-dot rp-dot--online" />
                                            <span className="rp-player-name">{roomGuest}</span>
                                            <span className="rp-badge rp-badge--guest">подключился</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="rp-dot rp-dot--waiting" />
                                            <span className="rp-waiting-text">Ожидание соперника</span>
                                            <Image src="/images/arena/timer1.gif" alt="" width={14} height={14} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="btn-reset-arena" style={{ width: '100%' }} onClick={onCancel}>
                        Отменить комнату
                    </button>
                </motion.div>
            </section>
        </main>
    );
}
