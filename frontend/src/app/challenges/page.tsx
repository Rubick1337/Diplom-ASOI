import React from 'react';
import ReduxProvider from '@/app/ReduxProvider';
import ChallengesPage from '@/pages/ChallengesPage/ChallengesPage';

export default function ChallengesRoute() {
    return (
        <ReduxProvider>
            <ChallengesPage />
        </ReduxProvider>
    );
}
