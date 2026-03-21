'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ChallengeCard from '@/widgets/ChallengeCard/ChallengeCard';
import ChallengeSearch from '@/features/ChallengeSearch/ChallengeSearch';
import ChallengeFilters from '@/features/ChallengeFilters/ChallengeFilters';
import RandomChallenge from '@/features/RandomChallenge/RandomChallenge';
import ChallengePagination from '@/shared/components/Pagination/Pagination';
import { SkeletonCard } from '@/widgets/SkeletonCard/SkeletonCard';
import ChallengeService from '@/shared/services/ChallengeService';

interface PickingPhaseProps {
    socket: any;
    roomIdRef: React.MutableRefObject<string>;
    selectedIds: { me?: number; opponent?: number };
    items: any[];
    total: number;
    totalPages: number;
    isLoading: boolean;
    search: string;
    setSearch: (v: string) => void;
    page: number;
    setPage: (v: number) => void;
    difficulty: number | 'all';
    setDifficulty: (v: number | 'all') => void;
    topic: string;
    setTopic: (v: string) => void;
    sort: string;
    setSort: (v: string) => void;
    containerVariants: Variants;
    itemVariants: Variants;
    onSelectTask: (id: number) => Promise<void>;
}

export default function PickingPhase({
    socket,
    roomIdRef,
    selectedIds,
    items,
    total,
    totalPages,
    isLoading,
    search,
    setSearch,
    page,
    setPage,
    difficulty,
    setDifficulty,
    topic,
    setTopic,
    sort,
    setSort,
    containerVariants,
    itemVariants,
    onSelectTask,
}: PickingPhaseProps) {
    return (
        <main className="challenges-main app-main-page arena-mode">
            <section className="cp-container">
                <header className="challenges-header-top">
                    <div className="header-info">
                        <h1>{selectedIds.me ? 'Ожидание выбора противника...' : 'Выберите задачу для боя'}</h1>
                        <span className="solutions-count">Найдено: {total}</span>
                    </div>
                    <div className="challenges-search-wrapper">
                        <ChallengeSearch value={search} onChange={(val) => { setPage(1); setSearch(val); }} />
                    </div>
                </header>

                <div className="challenges-layout">
                    <aside className="challenges-sidebar">
                        <ChallengeFilters
                            initialDifficulty={difficulty}
                            initialTopic={topic}
                            initialSort={sort}
                            onApply={(f: any) => { setPage(1); setDifficulty(f.difficulty); setTopic(f.topic); setSort(f.sort); }}
                            onReset={() => { setSearch(''); setPage(1); setDifficulty('all'); setTopic(''); setSort('newest'); }}
                        />
                        <RandomChallenge
                            isPickingMode={true}
                            onSelect={async (task: any) => {
                                try {
                                    const fullTask = await ChallengeService.getChallengeById(task.id);
                                    socket.emit('select_battle_challenge', { roomId: roomIdRef.current, challenge: fullTask });
                                } catch {
                                    socket.emit('select_battle_challenge', { roomId: roomIdRef.current, challenge: task });
                                }
                            }}
                        />
                    </aside>

                    <div className="challenges-feed">
                        <div className="challenge-list-column">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    <motion.div key="loading" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="motion-wrapper">
                                        {[1, 2, 3].map(n => <div key={n} className="skeleton-wrapper"><SkeletonCard /></div>)}
                                    </motion.div>
                                ) : items.length === 0 ? (
                                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="challenge-list-empty">
                                        Задачи не найдены.
                                    </motion.div>
                                ) : (
                                    <motion.div key="list" variants={containerVariants} initial="hidden" animate="visible" className="motion-wrapper">
                                        {items.map((challenge: any) => (
                                            <motion.div key={challenge.id} variants={itemVariants} layout>
                                                <ChallengeCard
                                                    {...challenge}
                                                    isPickingMode={true}
                                                    onSelect={onSelectTask}
                                                    isSelectedByMe={selectedIds.me === challenge.id}
                                                    isSelectedByOpponent={selectedIds.opponent === challenge.id}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {!isLoading && totalPages > 1 && (
                            <div className="pagination-wrapper">
                                <ChallengePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
