import React, { Suspense } from 'react';
import CreateChallengePage from '@/pages/CreateChallengePage/CreateChallengePage';

export default function CreateChallengeRoute() {
    return (
        <Suspense fallback={null}>
            <CreateChallengePage />
        </Suspense>
    );
}
