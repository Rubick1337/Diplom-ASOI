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
                    style={{
                        background: '#111',
                        border: '1px solid #2a2a2a',
                        borderRadius: 16,
                        padding: '40px 36px',
                        marginTop: 40,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <Image src="/images/arena/duel.png" alt="" width={36} height={36} />
                        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Комната создана</h1>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>

                        {}
                        <div style={{
                            background: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: 12,
                            padding: '20px 24px',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Код комнаты</p>
                            <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: 10, color: '#FF6B35', marginBottom: 12 }}>
                                {createdRoomCode}
                            </div>
                            <button className="btn-random" style={{ width: '100%' }} onClick={() => navigator.clipboard.writeText(createdRoomCode)}>
                                📋 Скопировать код
                            </button>
                        </div>

                        {}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                                <p style={{ color: '#666', fontSize: '0.72rem', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Тип комнаты</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: createdRoomHasPassword ? '#f0a500' : '#4caf50' }}>
                                    {createdRoomHasPassword ? '🔒 Закрытая' : '🌐 Открытая'}
                                </p>
                            </div>
                            <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                                <p style={{ color: '#666', fontSize: '0.72rem', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Пароль</p>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: createdRoomHasPassword ? '#fff' : '#555' }}>
                                    {createdRoomHasPassword ? createPassword || '••••••' : 'Нет'}
                                </p>
                            </div>
                        </div>

                        {}
                        <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '16px 20px' }}>
                            <p style={{ color: '#666', fontSize: '0.72rem', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Игроки</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50', flexShrink: 0 }} />
                                    <span style={{ fontWeight: 700 }}>{currentUser.username}</span>
                                    <span style={{ fontSize: '0.7rem', background: '#FF6B3520', color: '#FF6B35', padding: '2px 8px', borderRadius: 4 }}>хост</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {roomGuest ? (
                                        <>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 700 }}>{roomGuest}</span>
                                            <span style={{ fontSize: '0.7rem', background: '#4caf5020', color: '#4caf50', padding: '2px 8px', borderRadius: 4 }}>подключился</span>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#333', flexShrink: 0 }} />
                                            <span style={{ color: '#555', fontStyle: 'italic', fontSize: '0.9rem' }}>Ожидание соперника</span>
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
