import React, { Suspense } from 'react';
import LeaderboardPage from '@/pages/LeaderboardPage/LeaderboardPage';

export default function LeaderboardRoute() {
    return (
        <Suspense fallback={null}>
            <LeaderboardPage />
        </Suspense>
    );
}
