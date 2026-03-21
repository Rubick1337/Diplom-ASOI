'use client';

import React, { useEffect, useMemo, useState } from 'react';
import CompetitiveArena from '@/features/CompetitiveArena/CompetitiveArena';
import Header from '@/widgets/Header/Header';
import { useAppSelector, useAppDispatch } from '@/shared/store/hooks';
import { fetchChallenges } from '@/shared/store/slice/challengeSlice';
import { RootState } from '@/shared/store/store';

import { getSocket } from '@/shared/lib/socket';

export default function BattleTestPage() {
    const dispatch = useAppDispatch();
    const socket = getSocket();

    const { user } = useAppSelector((state: RootState) => state.auth);
    const { items: challenges, isLoading } = useAppSelector((state: RootState) => state.challenges);

    const [socketId, setSocketId] = useState<string>(socket.id || '');

    useEffect(() => {
        dispatch(fetchChallenges({ pageSize: 20 }));
    }, [dispatch]);

    useEffect(() => {

        const onConnect = () => {
            console.log('✅ Socket connected:', socket.id);
            setSocketId(socket.id!);
        };

        const onDisconnect = () => {
            console.log('❌ Socket disconnected');
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {

            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [socket]);

    const currentUser = useMemo(() => {

        if (user?.id) return { id: user.id, username: user.username };

        const id = socketId || 'connecting';
        return {
            id: id,
            username: `Guest_${id.slice(-4)}`
        };
    }, [user, socketId]);

    if ((isLoading && challenges.length === 0) || !socketId) {
        return (
            <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <h2>{!socketId ? 'Установка соединения с сервером...' : 'Загрузка задач...'}</h2>
            </div>
        );
    }

    return (
        <div style={{ background: '#000', minHeight: '100vh' }}>
            <Header />
            <CompetitiveArena
                socket={socket}
                currentUser={currentUser}
                availableChallenges={challenges}
            />
        </div>
    );
}
