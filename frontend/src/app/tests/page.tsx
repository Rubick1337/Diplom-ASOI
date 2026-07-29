'use client';

import React, { Suspense } from 'react';
import TestsListPage from '@/pages/TestsListPage/TestsListPage';

export default function TestsRoute() {
    return (
        <Suspense fallback={null}>
            <TestsListPage />
        </Suspense>
    );
}
