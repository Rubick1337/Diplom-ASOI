'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/shared/store/hooks';
import LoginPage from '@/pages/LoginPage/LoginPage';

function roleRedirect(roleName: string | null | undefined): string {
    if (roleName === 'admin') return '/admin';
    if (roleName === 'owner') return '/owner';
    return '/challenges';
}

export default function LoginRoute() {
    const router = useRouter();
    const { user, isInitialized } = useAppSelector(s => s.auth);
    const initialCheckDone = useRef(false);

    useEffect(() => {
        if (!isInitialized) return;
        if (initialCheckDone.current) return;
        initialCheckDone.current = true;

        if (user) {
            router.replace(roleRedirect(user.roleName));
        }
    }, [isInitialized, user, router]);

    return <LoginPage />;
}
