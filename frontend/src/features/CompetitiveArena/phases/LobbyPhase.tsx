'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import RoomCard from '@/features/RoomCard/RoomCard';
import ChallengePagination from '@/shared/components/Pagination/Pagination';
import PasswordModal from '@/shared/components/PasswordModal/PasswordModal';

interface LobbyPhaseProps {
    socket: any;
    currentUser: any;
    isSearching: boolean;
    setIsSearching: (v: boolean) => void;
    rooms: any[];
    roomsTotal: number;
    roomsTotalPages: number;
    roomsPage: number;
    setRoomsPage: (v: number) => void;
    roomsPageRef: React.MutableRefObject<number>;
    roomsSearch: string;
    setRoomsSearch: (v: string) => void;
    roomsSearchRef: React.MutableRefObject<string>;
    createPassword: string;
    setCreatePassword: (v: string) => void;
    loadRooms: (p?: number, s?: string) => void;
    joinCode: string;
    setJoinCode: (v: string) => void;
    joinError: string;
    setJoinError: (v: string) => void;
    joinPassword: string;
    setJoinPassword: (v: string) => void;
    showPasswordInput: string | null;
    setShowPasswordInput: (v: string | null) => void;
    handleJoinRoom: (code: string, password?: string) => void;
    handleRoomCardClick: (code: string, hasPassword: boolean) => void;
    containerVariants: Variants;
    itemVariants: Variants;
}

export default function LobbyPhase({
    socket,
    currentUser,
    isSearching,
    setIsSearching,
    rooms,
    roomsTotal,
    roomsTotalPages,
    roomsPage,
    setRoomsPage,
    roomsPageRef,
    roomsSearch,
    setRoomsSearch,
    roomsSearchRef,
    createPassword,
    setCreatePassword,
    loadRooms,
    joinCode,
    setJoinCode,
    joinError,
    setJoinError,
    joinPassword,
    setJoinPassword,
    showPasswordInput,
    setShowPasswordInput,
    handleJoinRoom,
    handleRoomCardClick,
    containerVariants,
    itemVariants,
}: LobbyPhaseProps) {
    return (
        <main className="challenges-main app-main-page arena-mode">
            <section className="cp-container">
                <header className="challenges-header-top">
                    <div className="header-info">
                        <h1>Арена 1v1</h1>
                        <span className="solutions-count">Открытых комнат: {roomsTotal}</span>
                    </div>
                    <div className="challenges-search-wrapper">
                        <input
                            className="filter-input-text"
                            placeholder="Поиск по нику создателя..."
                            value={roomsSearch}
                            onChange={e => {
                                const val = e.target.value;
                                setRoomsSearch(val);
                                roomsSearchRef.current = val;
                                setRoomsPage(1);
                                roomsPageRef.current = 1;
                                loadRooms(1, val);
                            }}
                            style={{ minWidth: 280 }}
                        />
                    </div>
                </header>

                <div className="challenges-layout">
                    <aside className="challenges-sidebar">
                        <div className="sidebar-filter-card">
                            <h3>Рейтинг</h3>
                            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1.2rem', lineHeight: 1.4 }}>
                                Найди соперника для рейтинга
                            </p>
                            <div className="filter-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                                <button
                                    className="btn-apply"
                                    onClick={() => {
                                        setIsSearching(true);
                                        socket.emit('join_matchmaking', {
                                            userId: currentUser.id,
                                            username: currentUser.username,
                                        });
                                    }}
                                    disabled={isSearching}
                                >
                                    {isSearching ? (
                                        <>
                                            <Image src="/images/arena/timer1.gif" alt="" width={16} height={16} style={{ marginRight: 6 }} />
                                            Поиск соперника...
                                        </>
                                    ) : (
                                        <>
                                            <Image src="/images/arena/sword.png" alt="" width={16} height={16} style={{ marginRight: 6 }} />
                                            Найти соперника
                                        </>
                                    )}
                                </button>
                                {isSearching && (
                                    <button className="btn-reset" onClick={() => { socket.emit('leave_matchmaking'); setIsSearching(false); }}>
                                        Отменить
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="random-challenge-card">
                            <div className="random-card-header">
                                <Image src="/images/arena/duel.png" alt="" width={28} height={28} style={{ marginRight: 6 }} />
                                <h3>Создать комнату</h3>
                            </div>
                            <p className="random-card-desc">Создай комнату с паролем или без и пригласи друга</p>
                            <div className="random-input-group">
                                <div className="difficulty-selector">
                                    <label>Пароль <span style={{ color: '#555', fontWeight: 400 }}>(необязательно)</span></label>
                                    <input
                                        className="filter-input-text"
                                        placeholder="Без пароля — открытая комната"
                                        value={createPassword}
                                        onChange={e => setCreatePassword(e.target.value)}
                                        type="password"
                                        style={{ marginTop: 6 }}
                                    />
                                </div>
                                <button
                                    className="btn-random"
                                    onClick={() => {
                                        if (isSearching) {
                                            socket.emit('leave_matchmaking');
                                            setIsSearching(false);
                                        }
                                        socket.emit('create_room', {
                                            username: currentUser.username,
                                            userId: currentUser.id,
                                            password: createPassword || null,
                                        });
                                    }}
                                >
                                    <Image src="/images/arena/key.png" alt="" width={18} height={18} style={{ marginRight: 6 }} />
                                    Создать комнату
                                </button>
                            </div>
                        </div>
                    </aside>

                    <div className="challenges-feed">
                        <div className="challenge-list-column">
                            <div className="lobby-join-bar">
                                <input
                                    className="filter-input-text"
                                    placeholder="Введите код комнаты..."
                                    value={joinCode}
                                    onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                                    maxLength={6}
                                    style={{ flex: 1, letterSpacing: 3, fontWeight: 700 }}
                                    onKeyDown={e => e.key === 'Enter' && joinCode.length >= 4 && handleRoomCardClick(joinCode, false)}
                                />
                                <button
                                    className="btn-apply"
                                    style={{ width: 'auto', maxWidth: 'none', padding: '0 20px', flexShrink: 0 }}
                                    onClick={() => handleRoomCardClick(joinCode, false)}
                                    disabled={joinCode.length < 4}
                                >
                                    Войти по коду
                                </button>
                            </div>

                            {joinError && !showPasswordInput && (
                                <p style={{ color: '#ff4444', fontSize: '0.85rem', margin: '-8px 0 12px' }}>⚠️ {joinError}</p>
                            )}

                            {showPasswordInput && (
                                <PasswordModal
                                    password={joinPassword}
                                    error={joinError}
                                    onPasswordChange={v => { setJoinPassword(v); setJoinError(''); }}
                                    onConfirm={() => handleJoinRoom(showPasswordInput, joinPassword)}
                                    onCancel={() => { setShowPasswordInput(null); setJoinPassword(''); setJoinError(''); }}
                                />
                            )}

                            {rooms.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="challenge-list-empty"
                                >
                                    Нет открытых комнат. Создайте свою!
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={rooms.map(r => r.code).join(',')}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="motion-wrapper"
                                >
                                    {rooms.map((room: any) => (
                                        <motion.div key={room.code} variants={itemVariants} layout>
                                            <RoomCard
                                                code={room.code}
                                                hostUsername={room.hostUsername}
                                                hasPassword={room.hasPassword}
                                                onJoin={(code: string) => handleRoomCardClick(code, room.hasPassword)}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {roomsTotalPages > 1 && (
                            <div className="pagination-wrapper">
                                <ChallengePagination
                                    currentPage={roomsPage}
                                    totalPages={roomsTotalPages}
                                    onPageChange={(p: number) => {
                                        setRoomsPage(p);
                                        roomsPageRef.current = p;
                                        loadRooms(p, roomsSearchRef.current);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
