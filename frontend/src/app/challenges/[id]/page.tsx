'use client';

import React from 'react';
// Импортируем хук для работы с параметрами в Client Components
import { useParams } from 'next/navigation';
import ChallengeWorkspace from '@/widgets/ChallengeWorkspace/ChallengeWorkspace';

export default function ChallengePage() {
    // Получаем id из URL динамически
    const params = useParams();

    return (
        <main className="app-main-page">
            {/* Передаем id в ваш компонент, если он ему нужен */}
            <ChallengeWorkspace  />
        </main>
    );
}