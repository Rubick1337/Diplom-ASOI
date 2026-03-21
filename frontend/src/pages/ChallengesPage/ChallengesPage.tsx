'use client';

import React, { useEffect, useState } from 'react';
import './ChallengesPage.css';

import RandomChallenge from '@/features/RandomChallenge/RandomChallenge';
import ChallengeList from '@/widgets/ChallengeList/ChallengeList';
import ChallengeSearch from '@/features/ChallengeSearch/ChallengeSearch';
import ChallengePagination from '@/shared/components/Pagination/Pagination';
import ChallengeFilters from '@/features/ChallengeFilters/ChallengeFilters';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { fetchChallenges } from '@/shared/store/slice/challengeSlice';
import Header from '@/widgets/Header/Header';

const PAGE_SIZE = 3;

export default function ChallengesPage() {
    return <ChallengesPageContent />;
}

function ChallengesPageContent() {
    const dispatch = useAppDispatch();
    const { items, total, totalPages, isLoading, error } = useAppSelector((state) => state.challenges);

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [topicId, setTopicId] = useState<number | 'all'>('all');
    const [difficulty, setDifficulty] = useState<number | 'all'>('all');
    const [sort, setSort] = useState('newest');

    useEffect(() => {
        dispatch(fetchChallenges({
            page,
            pageSize: PAGE_SIZE,
            search: search.trim() || undefined,
            topicId: topicId === 'all' ? undefined : topicId,
            difficulty: difficulty === 'all' ? undefined : difficulty,
            sort,
        }));
    }, [dispatch, page, search, topicId, difficulty, sort]);

    const handleApply = (filters: { difficulty: number | 'all'; topicId: number | 'all'; sort: string }) => {
        setPage(1);
        setDifficulty(filters.difficulty);
        setTopicId(filters.topicId);
        setSort(filters.sort);
    };

    const handleReset = () => {
        setSearch('');
        setPage(1);
        setDifficulty('all');
        setTopicId('all');
        setSort('newest');
    };

    return (
        <>
            <Header />
            <main className="challenges-main app-main-page">
                <section className="cp-container">
                    <header className="challenges-header-top">
                        <div className="header-info">
                            <h1>Все задачи</h1>
                            <span className="solutions-count">Найдено: {total}</span>
                        </div>
                        <div className="challenges-search-wrapper">
                            <ChallengeSearch
                                value={search}
                                onChange={(val) => { setPage(1); setSearch(val); }}
                            />
                        </div>
                    </header>

                    <div className="challenges-layout">
                        <aside className="challenges-sidebar">
                            <ChallengeFilters
                                initialDifficulty={difficulty}
                                initialTopicId={topicId}
                                initialSort={sort}
                                onApply={handleApply}
                                onReset={handleReset}
                            />
                            <RandomChallenge />
                        </aside>

                        <div className="challenges-feed">
                            {error && <div className="challenges-error">{error}</div>}

                            <ChallengeList challenges={items} isLoading={isLoading} />

                            {totalPages > 1 && (
                                <div className="pagination-wrapper">
                                    <ChallengePagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
