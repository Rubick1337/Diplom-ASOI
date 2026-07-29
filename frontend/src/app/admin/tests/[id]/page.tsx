'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/shared/store/hooks';
import AdminTestEditorPage from '@/pages/AdminTestEditorPage/AdminTestEditorPage';
import AdminHeader from '@/widgets/AdminHeader/AdminHeader';

export default function AdminTestEditorRoute() {
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
                <AdminTestEditorPage />
            </Suspense>
        </>
    );
}
