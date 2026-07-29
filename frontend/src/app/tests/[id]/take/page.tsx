'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/shared/store/hooks';
import TestTakePage from '@/pages/TestTakePage/TestTakePage';

export default function TestTakeRoute() {
    const router = useRouter();
    const { user, isInitialized } = useAppSelector(s => s.auth);

    useEffect(() => {
        if (!isInitialized) return;
        if (!user) router.replace('/auth/login');
    }, [isInitialized, user, router]);

    if (!isInitialized || !user) return null;

    return (
        <Suspense fallback={null}>
            <TestTakePage />
        </Suspense>
    );
}
