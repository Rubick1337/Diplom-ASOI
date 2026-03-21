'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/shared/store/hooks';
import OwnerPage from '@/pages/OwnerPage/OwnerPage';

export default function OwnerRoute() {
    const router = useRouter();
    const { user, isInitialized } = useAppSelector(s => s.auth);

    useEffect(() => {
        if (!isInitialized) return;
        if (!user || user.roleName !== 'owner') {
            router.replace('/forbidden');
        }
    }, [isInitialized, user, router]);

    if (!isInitialized || !user || user.roleName !== 'owner') return null;

    return (
        <>
            <OwnerPage />
        </>
    );
}
