'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/shared/store/hooks';
import { checkAuth } from '@/shared/store/slice/authSlice';

export default function AuthInit() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    return null;
}
