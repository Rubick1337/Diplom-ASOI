'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/shared/store/hooks';
import AdminPage from '@/pages/AdminPage/AdminPage';
import AdminHeader from '@/widgets/AdminHeader/AdminHeader';

export default function AdminRoute() {
    const router = useRouter();
    const { user, isInitialized } = useAppSelector(s => s.auth);

    useEffect(() => {
        if (!isInitialized) return;
        if (!user || user.roleName !== 'admin') {
            router.replace('/forbidden');
        }
    }, [isInitialized, user, router]);

    if (!isInitialized || !user || user.roleName !== 'admin') return null;

    return (
        <>
            <AdminHeader />
            <Suspense fallback={null}>
                <AdminPage />
            </Suspense>
        </>
    );
}
