'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Variants } from 'framer-motion';
import ChallengeService from '@/shared/services/ChallengeService';

import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { fetchChallenges } from '@/shared/store/slice/challengeSlice';

import LobbyPhase from './phases/LobbyPhase';
import RoomPhase from './phases/RoomPhase';
import PickingPhase from './phases/PickingPhase';
import BattlePhase from './phases/BattlePhase';
import FinishedPhase from './phases/FinishedPhase';

import '../../pages/ChallengesPage/ChallengesPage.css';
import './CompetitiveArena.css';

const PAGE_SIZE = 3;
const ROOMS_PAGE_SIZE = 6;

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 70, damping: 18 } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }
};

const clearSession = () => {
    ['battleRoomId', 'battlePhase', 'battleUsername',
        'battleMyProgress', 'battleOpponentProgress',
        'battleChatMessages', 'battleChallenges', 'battleOpponent'
    ].forEach(k => sessionStorage.removeItem(k));
};

export default function CompetitiveArena({ socket, currentUser }: any) {
    const dispatch = useAppDispatch();
    const { items, total, totalPages, isLoading } = useAppSelector((state) => state.challenges);

    const [phase, setPhase] = useState<'lobby' | 'room' | 'picking' | 'battle' | 'finished'>('lobby');

    const [isSearching, setIsSearching] = useState(false);
    const [opponent, setOpponent] = useState<any>(null);
    const [battleChallenges, setBattleChallenges] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedIds, setSelectedIds] = useState<{ me?: number; opponent?: number }>({});
    const [myProgress, setMyProgress] = useState<any>({});
    const [opponentProgress, setOpponentProgress] = useState<any>({});
    const [winner, setWinner] = useState<string | null>(null);
    const [surrenderInfo, setSurrenderInfo] = useState<string | null>(null);
    const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);

    const [createPassword, setCreatePassword] = useState('');
    const [createdRoomCode, setCreatedRoomCode] = useState('');
    const [createdRoomHasPassword, setCreatedRoomHasPassword] = useState(false);
    const [roomGuest, setRoomGuest] = useState<string | null>(null);

    const [rooms, setRooms] = useState<any[]>([]);
    const [roomsTotal, setRoomsTotal] = useState(0);
    const [roomsTotalPages, setRoomsTotalPages] = useState(1);
    const [roomsPage, setRoomsPage] = useState(1);
    const [roomsSearch, setRoomsSearch] = useState('');

    const [joinCode, setJoinCode] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [joinError, setJoinError] = useState('');
    const [showPasswordInput, setShowPasswordInput] = useState<string | null>(null);
    const joinCodeRef = useRef('');
    const showPasswordInputRef = useRef<string | null>(null);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [difficulty, setDifficulty] = useState<number | 'all'>('all');
    const [topic, setTopic] = useState('');
    const [sort, setSort] = useState('newest');

    const roomIdRef = useRef('');
    const battleChallengesRef = useRef<any[]>([]);
    const activeTabRef = useRef(0);
    const roomsPageRef = useRef(1);
    const roomsSearchRef = useRef('');

    useEffect(() => { roomsPageRef.current = roomsPage; }, [roomsPage]);
    useEffect(() => { roomsSearchRef.current = roomsSearch; }, [roomsSearch]);
    useEffect(() => { battleChallengesRef.current = battleChallenges; }, [battleChallenges]);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
    useEffect(() => { joinCodeRef.current = joinCode; }, [joinCode]);
    useEffect(() => { showPasswordInputRef.current = showPasswordInput; }, [showPasswordInput]);

    useEffect(() => {
        if (phase === 'battle' && Object.keys(myProgress).length > 0) {
            sessionStorage.setItem('battleMyProgress', JSON.stringify(myProgress));
        }
    }, [myProgress, phase]);

    useEffect(() => {
        if (phase === 'battle' && Object.keys(opponentProgress).length > 0) {
            sessionStorage.setItem('battleOpponentProgress', JSON.stringify(opponentProgress));
        }
    }, [opponentProgress, phase]);

    useEffect(() => {
        if (phase !== 'battle') return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [phase]);

    const loadRooms = (p = roomsPageRef.current, s = roomsSearchRef.current) => {
        socket.emit('get_rooms', { page: p, pageSize: ROOMS_PAGE_SIZE, search: s });
    };

    useEffect(() => {
        if (phase === 'lobby') loadRooms(1, '');
    }, [phase]);

    useEffect(() => {
        if (phase === 'picking') {
            dispatch(fetchChallenges({
                page, pageSize: PAGE_SIZE,
                search: search.trim() || undefined,
                topic: topic === '' ? undefined : topic,
                difficulty: difficulty === 'all' ? undefined : difficulty,
                sort,
            }));
        }
    }, [dispatch, page, search, difficulty, topic, sort, phase]);

    useEffect(() => {
        if (!socket) return;
        const savedRoomId = sessionStorage.getItem('battleRoomId');
        const savedPhase = sessionStorage.getItem('battlePhase');
        const savedUsername = sessionStorage.getItem('battleUsername');
        if (savedRoomId && savedPhase === 'battle' && savedUsername) {
            socket.emit('rejoin_battle', { roomId: savedRoomId, username: savedUsername });
        }
    }, [socket]);

    useEffect(() => {
        if (!socket || !currentUser || phase !== 'lobby') return;
        socket.emit('check_my_room', {
            userId: currentUser.id,
            username: currentUser.username,
        });
    }, [socket, currentUser, phase]);

    useEffect(() => {
        if (!socket) return;

        const handleRoomsUpdated = (allRooms: any[]) => {
            const s = roomsSearchRef.current;
            const p = roomsPageRef.current;

            const filtered = s
                ? allRooms.filter((r: any) =>
                    r.hostUsername.toLowerCase().includes(s.toLowerCase())
                )
                : allRooms;

            const total = filtered.length;
            const totalPages = Math.ceil(total / ROOMS_PAGE_SIZE) || 1;
            const paginated = filtered.slice((p - 1) * ROOMS_PAGE_SIZE, p * ROOMS_PAGE_SIZE);

            setRooms(paginated);
            setRoomsTotal(total);
            setRoomsTotalPages(totalPages);
        };

        socket.on('rooms_updated', handleRoomsUpdated);

        socket.on('my_room_found', (data: { code: string; hasPassword: boolean }) => {
            setCreatedRoomCode(data.code);
            setCreatedRoomHasPassword(data.hasPassword);
            setPhase('room');
        });

        socket.on('my_room_not_found', () => {});

        socket.on('room_expired', () => {
            setPhase('lobby');
            setCreatedRoomCode('');
            setCreatedRoomHasPassword(false);
            setRoomGuest(null);
        });

        socket.on('rooms_list', (data: any) => {
            setRooms(data.items);
            setRoomsTotal(data.total);
            setRoomsTotalPages(data.totalPages);
            setRoomsPage(data.page);
        });

        socket.on('room_created', (data: { code: string; hasPassword: boolean }) => {
            setCreatedRoomCode(data.code);
            setCreatedRoomHasPassword(data.hasPassword);
            setRoomGuest(null);
            setPhase('room');
            loadRooms(1, roomsSearchRef.current);
        });

        socket.on('room_error', (data: { message: string }) => {
            if (data.message === 'Неверный пароль' && !showPasswordInputRef.current) {
                setShowPasswordInput(joinCodeRef.current);
                setJoinPassword('');
                setJoinError('');
            } else {
                setJoinError(data.message);
            }
        });

        socket.on('player_joined_room', (data: any) => {
            const guest = data.players.find((p: any) => p.id !== socket.id);
            if (guest) setRoomGuest(guest.username);
        });

        socket.on('match_found', (data: any) => {
            roomIdRef.current = data.roomId;
            sessionStorage.setItem('battleRoomId', data.roomId);
            sessionStorage.setItem('battleUsername', currentUser.username);
            setOpponent(data.players.find((p: any) => p.id !== socket.id));
            setCreatedRoomCode('');
            setCreatedRoomHasPassword(false);
            setCreatePassword('');
            setRoomGuest(null);
            setPhase('picking');
            setIsSearching(false);
            setSelectedIds({});
        });

        socket.on('challenge_selected_by_player', (data: any) => {
            if (data.playerId === socket.id) {
                setSelectedIds(prev => ({ ...prev, me: data.challengeId }));
            } else {
                setSelectedIds(prev => ({ ...prev, opponent: data.challengeId }));
            }
        });

        socket.on('battle_start', (data: { challenges: any[] }) => {
            sessionStorage.setItem('battlePhase', 'battle');
            sessionStorage.setItem('battleChallenges', JSON.stringify(data.challenges));
            setBattleChallenges(data.challenges);
            battleChallengesRef.current = data.challenges;
            setActiveTab(0);
            activeTabRef.current = 0;
            setWinner(null);
            setSurrenderInfo(null);
            const initial: any = {};
            data.challenges.forEach((c: any) => {
                initial[c.id] = { passed: 0, total: 0, solved: false };
            });
            setMyProgress(initial);
            setOpponentProgress(initial);
            setPhase('battle');
        });

        socket.on('battle_rejoined', (data: any) => {
            roomIdRef.current = data.roomId;
            const savedChallenges = sessionStorage.getItem('battleChallenges');
            const challenges = savedChallenges ? JSON.parse(savedChallenges) : data.challenges;
            setBattleChallenges(challenges);
            battleChallengesRef.current = challenges;
            setActiveTab(0);
            activeTabRef.current = 0;
            const savedMyProgress = sessionStorage.getItem('battleMyProgress');
            const savedOppProgress = sessionStorage.getItem('battleOpponentProgress');
            const initial: any = {};
            challenges.forEach((c: any) => { initial[c.id] = { passed: 0, total: 0, solved: false }; });
            setMyProgress(savedMyProgress ? JSON.parse(savedMyProgress) : initial);
            setOpponentProgress(savedOppProgress ? JSON.parse(savedOppProgress) : {});
            if (data.opponent) {
                setOpponent(data.opponent);
                sessionStorage.setItem('battleOpponent', JSON.stringify(data.opponent));
            } else {
                const saved = sessionStorage.getItem('battleOpponent');
                if (saved) setOpponent(JSON.parse(saved));
            }
            setPhase('battle');
        });

        socket.on('battle_not_found', () => { clearSession(); setPhase('lobby'); });

        socket.on('opponent_challenge_result', (data: any) => {
            setOpponentProgress((prev: any) => ({
                ...prev,
                [data.challengeId]: { passed: data.passed, total: data.total, solved: data.solved }
            }));
        });

        socket.on('battle_winner', (data: any) => {
            setWinner(data.winnerUsername);
            if (data.isSurrender) setSurrenderInfo(data.surrenderedUsername);
            clearSession();
            setPhase('finished');
        });

        socket.on('opponent_disconnected', () => {
            alert('Соперник отключился');
            clearSession();
            setPhase('lobby');
        });

        socket.on('opponent_rejoined', () => {});

        return () => {
            socket.off('rooms_updated', handleRoomsUpdated);
            socket.off('my_room_found');
            socket.off('my_room_not_found');
            socket.off('room_expired');
            socket.off('rooms_list');
            socket.off('room_created');
            socket.off('room_error');
            socket.off('player_joined_room');
            socket.off('match_found');
            socket.off('challenge_selected_by_player');
            socket.off('battle_start');
            socket.off('battle_rejoined');
            socket.off('battle_not_found');
            socket.off('opponent_challenge_result');
            socket.off('battle_winner');
            socket.off('opponent_disconnected');
            socket.off('opponent_rejoined');
        };
    }, [socket]);

    const handleJoinRoom = (code: string, password = '') => {
        setJoinError('');
        socket.emit('join_room', {
            username: currentUser.username,
            userId: currentUser.id,
            code,
            password,
        });
    };

    const handleRoomCardClick = (code: string, hasPassword: boolean) => {
        if (hasPassword) {
            setShowPasswordInput(code);
            setJoinPassword('');
            setJoinError('');
        } else {
            handleJoinRoom(code);
        }
    };

    const handleSelectTask = async (id: number) => {
        try {
            const fullTask = await ChallengeService.getChallengeById(id);
            socket.emit('select_battle_challenge', { roomId: roomIdRef.current, challenge: fullTask });
        } catch {
            const task = items.find((c: any) => c.id === id);
            if (task) socket.emit('select_battle_challenge', { roomId: roomIdRef.current, challenge: task });
        }
    };

    const handleBattleUpdate = (data: any) => {
        const currentRoomId = roomIdRef.current;
        const challengeId = battleChallengesRef.current[activeTabRef.current]?.id;
        if (!challengeId) return;
        const solved = data.passedTests > 0 && data.passedTests === data.totalTests;
        setMyProgress((prev: any) => ({
            ...prev,
            [challengeId]: { passed: data.passedTests, total: data.totalTests, solved }
        }));
        if (!currentRoomId) return;
        socket.emit('challenge_result', {
            roomId: currentRoomId, challengeId,
            passed: data.passedTests, total: data.totalTests, solved,
            username: currentUser.username,
        });
    };

    const handleSurrender = () => {
        socket.emit('surrender', {
            roomId: roomIdRef.current,
            username: currentUser.username,
        });
        clearSession();
    };

    const handleCancelRoom = () => {
        socket.emit('cancel_room');
        setPhase('lobby');
        setCreatedRoomCode('');
        setCreatedRoomHasPassword(false);
        setCreatePassword('');
        setRoomGuest(null);
    };

    const handlePlayAgain = () => {
        clearSession();
        roomIdRef.current = '';
        setPhase('lobby');
        setMyProgress({});
        setOpponentProgress({});
        setWinner(null);
        setSurrenderInfo(null);
        setBattleChallenges([]);
        setOpponent(null);
        setSelectedIds({});
        setIsSearching(false);
    };

    if (phase === 'room') return (
        <RoomPhase
            currentUser={currentUser}
            createdRoomCode={createdRoomCode}
            createdRoomHasPassword={createdRoomHasPassword}
            createPassword={createPassword}
            roomGuest={roomGuest}
            onCancel={handleCancelRoom}
        />
    );

    if (phase === 'lobby') return (
        <LobbyPhase
            socket={socket}
            currentUser={currentUser}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            rooms={rooms}
            roomsTotal={roomsTotal}
            roomsTotalPages={roomsTotalPages}
            roomsPage={roomsPage}
            setRoomsPage={setRoomsPage}
            roomsPageRef={roomsPageRef}
            roomsSearch={roomsSearch}
            setRoomsSearch={setRoomsSearch}
            roomsSearchRef={roomsSearchRef}
            createPassword={createPassword}
            setCreatePassword={setCreatePassword}
            loadRooms={loadRooms}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            joinError={joinError}
            setJoinError={setJoinError}
            joinPassword={joinPassword}
            setJoinPassword={setJoinPassword}
            showPasswordInput={showPasswordInput}
            setShowPasswordInput={setShowPasswordInput}
            handleJoinRoom={handleJoinRoom}
            handleRoomCardClick={handleRoomCardClick}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
        />
    );

    if (phase === 'picking') return (
        <PickingPhase
            socket={socket}
            roomIdRef={roomIdRef}
            selectedIds={selectedIds}
            items={items}
            total={total}
            totalPages={totalPages}
            isLoading={isLoading}
            search={search}
            setSearch={setSearch}
            page={page}
            setPage={setPage}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            topic={topic}
            setTopic={setTopic}
            sort={sort}
            setSort={setSort}
            containerVariants={containerVariants}
            itemVariants={itemVariants}
            onSelectTask={handleSelectTask}
        />
    );

    if (phase === 'finished') return (
        <FinishedPhase
            currentUser={currentUser}
            winner={winner}
            surrenderInfo={surrenderInfo}
            onPlayAgain={handlePlayAgain}
        />
    );

    return (
        <BattlePhase
            socket={socket}
            currentUser={currentUser}
            battleChallenges={battleChallenges}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeTabRef={activeTabRef}
            myProgress={myProgress}
            opponentProgress={opponentProgress}
            opponent={opponent}
            roomIdRef={roomIdRef}
            showSurrenderConfirm={showSurrenderConfirm}
            setShowSurrenderConfirm={setShowSurrenderConfirm}
            onBattleUpdate={handleBattleUpdate}
            onSurrender={handleSurrender}
        />
    );
}
