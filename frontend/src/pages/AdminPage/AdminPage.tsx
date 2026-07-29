'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import './AdminPage.css';

import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchAdminReportsPage,
    adminUpdateReportStatus,
    fetchChallengesManage,
    fetchAdminTopics,
} from '@/shared/store/slice/adminManageSlice';
import { fetchAdminReportsStats, fetchAdminChallengeStats } from '@/shared/store/slice/adminSlice';

import ReportsTab from '@/features/Reportstab/Reportstab';
import ChallengeManageTab from '@/widgets/ChallengeManageTab/ChallengeManageTab';
import TopicsTab from '@/features/TopicsTab/TopicsTab';
import AchievementsManageTab from '@/features/AchievementsManageTab/AchievementsManageTab';
import TestsManageTab from '@/features/TestsManageTab/TestsManageTab';

type TabId = 'reports' | 'manage' | 'topics' | 'achievements' | 'tests';

export default function AdminPage() {
    const dispatch = useAppDispatch();

    const { reportsPage, isLoading } = useAppSelector(s => s.adminManage);
    const { reportsStats }           = useAppSelector(s => s.admin);

    const searchParams = useSearchParams();
    const rawTab = searchParams.get('tab');
    const tab: TabId = (rawTab === 'manage' || rawTab === 'topics' || rawTab === 'reports' || rawTab === 'achievements' || rawTab === 'tests') ? rawTab : 'reports';

    useEffect(() => {
        dispatch(fetchAdminReportsStats());
        dispatch(fetchAdminReportsPage());
    }, [dispatch]);

    useEffect(() => {
        if (tab === 'topics') {
            dispatch(fetchAdminTopics());
            dispatch(fetchAdminChallengeStats());
        }
    }, [tab]);

    const allStatuses = useMemo(() => reportsStats?.byStatus.map((r: any) => r.status) ?? [], [reportsStats]);
    const [selStatuses, setSelStatuses] = useState<Set<string>>(new Set());
    useEffect(() => { if (allStatuses.length > 0) setSelStatuses(new Set(allStatuses)); }, [allStatuses.join(',')]);

    const allReasons = useMemo(() => reportsStats?.byReason.map((r: any) => r.reason) ?? [], [reportsStats]);
    const [selReasons, setSelReasons] = useState<Set<string>>(new Set());
    useEffect(() => { if (allReasons.length > 0) setSelReasons(new Set(allReasons)); }, [allReasons.join(',')]);

    const filteredByStatus = useMemo(() => (reportsStats?.byStatus ?? []).filter((r: any) => selStatuses.has(r.status)), [reportsStats, selStatuses]);
    const filteredByReason = useMemo(() => (reportsStats?.byReason ?? []).filter((r: any) => selReasons.has(r.reason)), [reportsStats, selReasons]);

    return (
        <div className="admin-analytics">
            <style>{`
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: #0a0a0a; }
                ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
            `}</style>

            <div className="admin-analytics__main">

                <div className="admin-analytics__content">
                    {tab === 'reports' && (
                        reportsStats === null ? (
                            <div className="admin-analytics__loader">
                                <div className="admin-analytics__spinner" />
                                <span className="admin-analytics__loader-text">ЗАГРУЗКА...</span>
                            </div>
                        ) : (
                            <ReportsTab
                                reportsStats={reportsStats}
                                allStatuses={allStatuses}
                                allReasons={allReasons}
                                selStatuses={selStatuses}
                                setSelStatuses={setSelStatuses}
                                selReasons={selReasons}
                                setSelReasons={setSelReasons}
                                filteredByStatus={filteredByStatus}
                                filteredByReason={filteredByReason}
                                reportsPage={reportsPage}
                                onLoadReports={(filters) => dispatch(fetchAdminReportsPage(filters))}
                                onUpdateReport={(id, status) => dispatch(adminUpdateReportStatus({ id, status }))}
                            />
                        )
                    )}
                    {tab === 'manage' && <ChallengeManageTab />}
                    {tab === 'topics' && <TopicsTab />}
                    {tab === 'achievements' && <AchievementsManageTab />}
                    {tab === 'tests' && <TestsManageTab />}
                </div>
            </div>
        </div>
    );
}
