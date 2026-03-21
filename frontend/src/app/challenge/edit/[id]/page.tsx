import React, { Suspense } from 'react';
import EditChallengePage from '@/pages/EditChallengePage/EditChallengePage';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditChallengeRoute({ params }: Props) {
    const { id } = await params;
    return (
        <Suspense fallback={null}>
            <EditChallengePage id={Number(id)} />
        </Suspense>
    );
}
