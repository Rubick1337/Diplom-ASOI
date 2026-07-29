'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './RoomLobby.css';

interface Player {
    id: string;
    username: string;
}

interface RoomLobbyProps {
    socket: any;
    roomCode: string;
    currentUser: any;
    onBattleStart?: () => void;
}

export default function RoomLobby({ socket, roomCode, currentUser, onBattleStart }: RoomLobbyProps) {
    const router = useRouter();
    const [players, setPlayers] = useState<Player[]>([]);
    const [roomInfo, setRoomInfo] = useState<{ code: string; hasPassword: boolean } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        if (!socket || !currentUser) return;

        socket.emit('get_room_info', { code: roomCode });

        socket.on('room_info', (data: any) => {
            setRoomInfo(data);
            setPlayers(data.players || []);
            setIsHost(data.hostId === socket.id);
        });

        socket.on('room_info_error', (data: any) => {
            setError(data.message);
        });

        socket.on('player_joined_room', (data: { player: Player; players: Player[] }) => {
            setPlayers(data.players);
        });

        socket.on('player_left_room', (data: { players: Player[] }) => {
            setPlayers(data.players);
        });

        socket.on('match_found', () => {

            router.push('/battle');
        });

        socket.on('room_closed', () => {
            setError('Хост закрыл комнату');
            setTimeout(() => router.push('/battle'), 2000);
        });

        return () => {
            socket.off('room_info');
            socket.off('room_info_error');
            socket.off('player_joined_room');
            socket.off('player_left_room');
            socket.off('match_found');
            socket.off('room_closed');
        };
    }, [socket, roomCode, currentUser]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLeave = () => {
        socket.emit('leave_room', { code: roomCode });
        router.push('/battle');
    };

    if (error) return (
        <div className="room-lobby-error">
            <p>⚠️ {error}</p>
            <button onClick={() => router.push('/battle')} style={{display:'inline-flex',alignItems:'center',gap:'6px'}}><img src="/images/left-arrow.png" alt="←" className="icon-back" style={{width:'14px',height:'14px'}} />Назад в арену</button>
        </div>
    );

    if (!roomInfo) return (
        <div className="room-lobby-loading">Загрузка комнаты...</div>
    );

    return (
        <div className="room-lobby-page">
            <div className="room-lobby-container">

                {}
                <div className="room-lobby-header">
                    <button className="back-btn" onClick={handleLeave}><img src="/images/left-arrow.png" alt="←" className="icon-back" style={{width:'14px',height:'14px'}} />Назад</button>
                    <h1>Лобби комнаты</h1>
                    <div className="room-lobby-status">
                        {players.length === 2
                            ? '✅ Готово к старту!'
                            : '⏳ Ожидание игрока...'}
                    </div>
                </div>

                <div className="room-lobby-grid">

                    {}
                    <div className="room-lobby-info">
                        <div className="room-info-card">
                            <h2>Информация о комнате</h2>

                            <div className="room-info-row">
                                <span className="room-info-label">Код комнаты</span>
                                <div className="room-info-value-row">
                                    <span className="room-code-big">{roomCode}</span>
                                    <button
                                        className="copy-btn"
                                        onClick={() => handleCopy(roomCode)}
                                    >
                                        {copied ? '✓ Скопировано' : '📋 Копировать'}
                                    </button>
                                </div>
                            </div>

                            <div className="room-info-row">
                                <span className="room-info-label">Тип комнаты</span>
                                <span className="room-info-value">
                                    {roomInfo.hasPassword ? '🔒 Защищена паролем' : '🌐 Открытая'}
                                </span>
                            </div>

                            {roomInfo.hasPassword && (
                                <div className="room-info-row">
                                    <span className="room-info-label">Пароль</span>
                                    <div className="room-info-value-row">
                                        <span className="room-code-big" style={{ letterSpacing: 2, fontSize: '1.2rem' }}>
                                            {roomInfo.hasPassword ? '••••••' : '—'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="room-info-row">
                                <span className="room-info-label">Игроков</span>
                                <span className="room-info-value">{players.length} / 2</span>
                            </div>

                            {}
                            <div className="room-invite">
                                <span className="room-info-label">Ссылка для приглашения</span>
                                <div className="room-invite-row">
                                    <span className="room-invite-link">
                                        {typeof window !== 'undefined'
                                            ? `${window.location.origin}/battle/${roomCode}`
                                            : `/battle/${roomCode}`}
                                    </span>
                                    <button
                                        className="copy-btn"
                                        onClick={() => handleCopy(
                                            typeof window !== 'undefined'
                                                ? `${window.location.origin}/battle/${roomCode}`
                                                : `/battle/${roomCode}`
                                        )}
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button className="leave-btn" onClick={handleLeave}>
                            🚪 Покинуть комнату
                        </button>
                    </div>

                    {}
                    <div className="room-lobby-players">
                        <h2>Игроки</h2>

                        <div className="players-list">
                            {}
                            <div className={`player-slot ${players[0] ? 'filled' : 'empty'}`}>
                                {players[0] ? (
                                    <>
                                        <div className="player-avatar">
                                            {players[0].username.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="player-info">
                                            <span className="player-name">{players[0].username}</span>
                                            <span className="player-badge host">👑 Хост</span>
                                        </div>
                                        <div className="player-ready">✓</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="player-avatar empty-avatar">?</div>
                                        <span className="player-waiting">Ожидание...</span>
                                    </>
                                )}
                            </div>

                            <div className="vs-divider">VS</div>

                            {}
                            <div className={`player-slot ${players[1] ? 'filled' : 'empty'}`}>
                                {players[1] ? (
                                    <>
                                        <div className="player-avatar">
                                            {players[1].username.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="player-info">
                                            <span className="player-name">{players[1].username}</span>
                                            <span className="player-badge guest">⚔️ Соперник</span>
                                        </div>
                                        <div className="player-ready">✓</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="player-avatar empty-avatar">?</div>
                                        <span className="player-waiting">Ожидание...</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {players.length === 2 && (
                            <div className="battle-starting">
                                <div className="battle-starting-text">⚡ Битва начинается...</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
