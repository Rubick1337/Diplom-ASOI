'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/widgets/Header/Header';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { fetchTests, fetchTestTopics } from '@/shared/store/slice/testSlice';
import { TestListItem } from '@/shared/services/TestApiService';
import ChallengeSearch from '@/features/ChallengeSearch/ChallengeSearch';
import ChallengePagination from '@/shared/components/Pagination/Pagination';

// Те же стили что у страницы задач — один в один
import '@/pages/ChallengesPage/ChallengesPage.css';
import '@/widgets/ChallengeCard/ChallengeCard.css';
import '@/features/ChallengeFilters/ChallengeFilters.css';
import '@/features/ChallengeSearch/ChallengeSearch.css';
import '@/widgets/ChallengeList/ChallengeList.css';

const PAGE_SIZE = 3;

const SORT_OPTIONS = [
    { value: 'newest',    label: 'Сначала новые' },
    { value: 'oldest',    label: 'Сначала старые' },
    { value: 'title',     label: 'По названию' },
    { value: 'diff_asc',  label: 'Лёгкие' },
    { value: 'diff_desc', label: 'Сложные' },
];

const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ─── Карточка теста — структура один в один как ChallengeCard ────────────────

const ICON_LIST = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="3" cy="6" r="1" fill="currentColor"/>
        <circle cx="3" cy="12" r="1" fill="currentColor"/>
        <circle cx="3" cy="18" r="1" fill="currentColor"/>
    </svg>
);

const ICON_CLOCK = (
    <img src="/images/clock.png" alt="clock" className="icon-clock" style={{width:'14px',height:'14px',verticalAlign:'middle'}} />
);

function TestCard({ test, onClick }: { test: TestListItem; onClick: () => void }) {
    const badge       = test.title.slice(0, 2).toUpperCase();
    const shortDesc   = test.description && test.description.length > 140
        ? test.description.slice(0, 140) + '…'
        : test.description;
    const safeDiff    = test.difficulty != null
        ? Math.min(10, Math.max(1, test.difficulty))
        : null;

    return (
        <article className="challenge-card" style={{ cursor: 'pointer' }} onClick={onClick}>
            <header className="challenge-card-head">
                <div className="challenge-card-badge">{badge}</div>
                <div className="challenge-card-title-area">
                    <h2 className="challenge-card-title">{test.title}</h2>
                    {test.topic && (
                        <div className="challenge-card-topics">
                            <span className="challenge-card-topic">{test.topic.name}</span>
                        </div>
                    )}
                </div>
            </header>

            {shortDesc && <p className="challenge-card-desc">{shortDesc}</p>}

            <div className="challenge-card-stats">
                <div className="stat-item">
                    {ICON_LIST}
                    <span className="stat-text">{test.questionCount} вопросов</span>
                </div>
                {test.timeLimitMinutes ? (
                    <div className="stat-item rating">
                        {ICON_CLOCK}
                        <span className="stat-text">{test.timeLimitMinutes} мин</span>
                    </div>
                ) : (
                    <div className="stat-item" style={{ opacity: .45 }}>
                        {ICON_CLOCK}
                        <span className="stat-text">без лимита</span>
                    </div>
                )}
            </div>

            <div className="challenge-card-meta">
                <div className="challenge-card-meta-row">
                    <span className="challenge-card-meta-label">Сложность</span>
                    <div className="challenge-card-difficulty-wrap">
                        <div className="challenge-card-difficulty-box">
                            {safeDiff ?? '–'}
                        </div>
                    </div>
                </div>
                <div className="challenge-card-meta-row">
                    <span className="challenge-card-meta-label">Лимит времени</span>
                    <span className="challenge-card-meta-value">
                        {test.timeLimitMinutes ? `${test.timeLimitMinutes} мин` : 'без лимита'}
                    </span>
                </div>
            </div>

            <div className="challenge-card-footer">
                <button className="challenge-card-btn">Начать тест</button>
            </div>
        </article>
    );
}

// ─── Основная страница ────────────────────────────────────────────────────────

export default function TestsListPage() {
    const dispatch = useAppDispatch();
    const router   = useRouter();
    const { tests, isLoading, error, topics } = useAppSelector(s => s.test);

    const [search, setSearch] = useState('');
    const [page,   setPage]   = useState(1);

    // Pending state — то что в сайдбаре до Apply
    const [pendingTopicId,    setPendingTopicId]    = useState<number | 'all'>('all');
    const [pendingDifficulty, setPendingDifficulty] = useState<number | 'all'>('all');
    const [pendingSort,       setPendingSort]       = useState('newest');

    // Active state — применённые фильтры
    const [activeTopicId,    setActiveTopicId]    = useState<number | 'all'>('all');
    const [activeDifficulty, setActiveDifficulty] = useState<number | 'all'>('all');
    const [activeSort,       setActiveSort]       = useState('newest');

    const [isDiffOpen,  setIsDiffOpen]  = useState(false);
    const [isSortOpen,  setIsSortOpen]  = useState(false);
    const [isTopicOpen, setIsTopicOpen] = useState(false);

    const diffRef  = useRef<HTMLDivElement>(null);
    const sortRef  = useRef<HTMLDivElement>(null);
    const topicRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dispatch(fetchTests());
        dispatch(fetchTestTopics());
    }, [dispatch]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (diffRef.current  && !diffRef.current.contains(e.target as Node))  setIsDiffOpen(false);
            if (sortRef.current  && !sortRef.current.contains(e.target as Node))   setIsSortOpen(false);
            if (topicRef.current && !topicRef.current.contains(e.target as Node))  setIsTopicOpen(false);
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const filtered = [...tests]
        .filter(t => !search.trim() || t.title.toLowerCase().includes(search.toLowerCase()))
        .filter(t => activeTopicId    === 'all' || t.topicId    === activeTopicId)
        .filter(t => activeDifficulty === 'all' || t.difficulty === activeDifficulty)
        .sort((a, b) => {
            switch (activeSort) {
                case 'oldest':    return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
                case 'title':     return a.title.localeCompare(b.title, 'ru');
                case 'diff_asc':  return (a.difficulty ?? 0) - (b.difficulty ?? 0);
                case 'diff_desc': return (b.difficulty ?? 0) - (a.difficulty ?? 0);
                default:          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
            }
        });

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleApply = () => {
        setPage(1);
        setActiveTopicId(pendingTopicId);
        setActiveDifficulty(pendingDifficulty);
        setActiveSort(pendingSort);
        setIsDiffOpen(false); setIsSortOpen(false); setIsTopicOpen(false);
    };

    const handleReset = () => {
        setSearch(''); setPage(1);
        setPendingTopicId('all');    setActiveTopicId('all');
        setPendingDifficulty('all'); setActiveDifficulty('all');
        setPendingSort('newest');    setActiveSort('newest');
        setIsDiffOpen(false); setIsSortOpen(false); setIsTopicOpen(false);
    };

    const currentSortLabel  = SORT_OPTIONS.find(o => o.value === pendingSort)?.label;
    const currentTopicLabel = pendingTopicId === 'all'
        ? 'Все категории'
        : topics.find(t => t.id === pendingTopicId)?.name ?? 'Все категории';

    return (
        <>
            <Header />
            <main className="challenges-main app-main-page">
                <section className="cp-container">

                    <header className="challenges-header-top">
                        <div className="header-info">
                            <h1>Все тесты</h1>
                            <span className="solutions-count">Найдено: {filtered.length}</span>
                        </div>
                        <div className="challenges-search-wrapper">
                            <ChallengeSearch
                                value={search}
                                onChange={val => { setPage(1); setSearch(val); }}
                            />
                        </div>
                    </header>

                    <div className="challenges-layout">

                        {/* ── Сайдбар фильтров — структура как ChallengeFilters ── */}
                        <aside className="challenges-sidebar">
                            <div className="sidebar-filter-card">
                                <h3>Фильтры</h3>

                                {/* Сортировка */}
                                <div className="filter-group" ref={sortRef}>
                                    <label className="filter-label">Сортировать</label>
                                    <div
                                        className={`custom-select ${isSortOpen ? 'open' : ''}`}
                                        onClick={() => setIsSortOpen(v => !v)}
                                    >
                                        <div className="select-trigger sort-trigger">
                                            <span>{currentSortLabel}</span>
                                            <span className="arrow">▼</span>
                                        </div>
                                        {isSortOpen && (
                                            <div className="select-options">
                                                {SORT_OPTIONS.map(opt => (
                                                    <div
                                                        key={opt.value}
                                                        className={`option sort-option ${opt.value === pendingSort ? 'active' : ''}`}
                                                        onClick={() => { setPendingSort(opt.value); setIsSortOpen(false); }}
                                                    >
                                                        {opt.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Категория */}
                                <div className="filter-group" ref={topicRef}>
                                    <label className="filter-label">Категория</label>
                                    <div
                                        className={`custom-select ${isTopicOpen ? 'open' : ''}`}
                                        onClick={() => setIsTopicOpen(v => !v)}
                                    >
                                        <div className="select-trigger sort-trigger">
                                            <span>{currentTopicLabel}</span>
                                            <span className="arrow">▼</span>
                                        </div>
                                        {isTopicOpen && (
                                            <div className="select-options">
                                                <div
                                                    className={`option sort-option ${pendingTopicId === 'all' ? 'active' : ''}`}
                                                    onClick={() => { setPendingTopicId('all'); setIsTopicOpen(false); }}
                                                >
                                                    Все категории
                                                </div>
                                                {topics.map(t => (
                                                    <div
                                                        key={t.id}
                                                        className={`option sort-option ${pendingTopicId === t.id ? 'active' : ''}`}
                                                        onClick={() => { setPendingTopicId(t.id); setIsTopicOpen(false); }}
                                                    >
                                                        {t.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Сложность */}
                                <div className="filter-group" ref={diffRef}>
                                    <label className="filter-label">Уровень сложности</label>
                                    <div
                                        className={`custom-select ${isDiffOpen ? 'open' : ''}`}
                                        onClick={() => setIsDiffOpen(v => !v)}
                                    >
                                        <div className="select-trigger">
                                            {pendingDifficulty === 'all' ? (
                                                <span>Любая сложность</span>
                                            ) : (
                                                <div className="diff-item">
                                                    <div
                                                        className="difficulty-card-box small"
                                                        style={{ borderColor: getDifficultyColor(pendingDifficulty) }}
                                                    >
                                                        {pendingDifficulty}
                                                    </div>
                                                    <span>Сложность: {pendingDifficulty}</span>
                                                </div>
                                            )}
                                            <span className="arrow">▼</span>
                                        </div>
                                        {isDiffOpen && (
                                            <div className="select-options">
                                                <div
                                                    className="option"
                                                    onClick={() => { setPendingDifficulty('all'); setIsDiffOpen(false); }}
                                                >
                                                    Любая сложность
                                                </div>
                                                {DIFFICULTY_LEVELS.map(num => (
                                                    <div
                                                        key={num}
                                                        className="option"
                                                        onClick={() => { setPendingDifficulty(num); setIsDiffOpen(false); }}
                                                    >
                                                        <div
                                                            className="difficulty-card-box small"
                                                            style={{ borderColor: getDifficultyColor(num) }}
                                                        >
                                                            {num}
                                                        </div>
                                                        <span>Сложность {num}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="filter-actions">
                                    <button className="btn-apply" onClick={handleApply}>Применить фильтры</button>
                                    <button className="btn-reset"  onClick={handleReset}>Сбросить</button>
                                </div>
                            </div>
                        </aside>

                        {/* ── Лента тестов ── */}
                        <div className="challenges-feed">
                            {error && (
                                <div className="challenge-list-empty">{error}</div>
                            )}

                            <div className="challenge-list-column">
                                {isLoading ? (
                                    [1, 2, 3].map(n => (
                                        <div key={n} className="challenge-card tl-skeleton" aria-hidden />
                                    ))
                                ) : paged.length === 0 ? (
                                    <div className="challenge-list-empty">
                                        {search || activeTopicId !== 'all' || activeDifficulty !== 'all'
                                            ? 'Тесты не найдены. Попробуйте изменить фильтры.'
                                            : 'Нет опубликованных тестов.'}
                                    </div>
                                ) : (
                                    paged.map(t => (
                                        <TestCard
                                            key={t.id}
                                            test={t}
                                            onClick={() => router.push(`/tests/${t.id}/take`)}
                                        />
                                    ))
                                )}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination-wrapper">
                                    <ChallengePagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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

function getDifficultyColor(level: number | 'all') {
    if (level === 'all') return '#333';
    if (level <= 3) return '#4ade80';
    if (level <= 7) return '#fbbf24';
    return '#f87171';
}
