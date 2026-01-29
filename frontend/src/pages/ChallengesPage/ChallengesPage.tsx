'use client';

import React, { useEffect, useState } from 'react';
import './ChallengesPage.css';

import ChallengeList from '@/widgets/ChallengeList/ChallengeList';
import ChallengeSearch from '@/features/ChallengeSearch/ChallengeSearch';
import ChallengePagination from '@/shared/components/Pagination/Pagination';

import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { fetchChallenges } from '@/shared/store/slice/challengeSlice';
import ReduxProvider from '@/app/ReduxProvider';

const PAGE_SIZE = 8;

export default function ChallengesPage() {
    return (
        <ReduxProvider>
            <ChallengesPageContent />
        </ReduxProvider>
    );
}

function ChallengesPageContent() {
    const dispatch = useAppDispatch();
    const {
        items,
        total,
        totalPages,
        isLoading,
        error,
    } = useAppSelector((state) => state.challenges);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        dispatch(
            fetchChallenges({
                page,
                pageSize: PAGE_SIZE,
                search,
            })
        );
    }, [dispatch, page, search]);

    const handleSearchChange = (value: string) => {
        setPage(1);
        setSearch(value);
    };

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
    };

    const safeTotalPages = totalPages || Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <main className="challenges-main app-main-page">
            <section className="challenge-section challenges-section-inner">
                <div className="challenge-container">
                    <div className="challenge-content">

                        <div className="challenges-controls">
                            <ChallengeSearch
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>

                        {error && (
                            <div className="challenges-error">
                                {error}
                            </div>
                        )}

                        <ChallengeList
                            challenges={items}
                            isLoading={isLoading}
                        />

                        <ChallengePagination
                            currentPage={page}
                            totalPages={safeTotalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}
