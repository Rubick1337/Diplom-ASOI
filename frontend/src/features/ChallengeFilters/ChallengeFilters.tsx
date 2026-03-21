'use client';

import React, { useState, useEffect, useRef } from 'react';
import './ChallengeFilters.css';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { fetchTopics } from '@/shared/store/slice/challengeSlice';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Сначала новые' },
    { value: 'popular', label: 'Популярные' },
    { value: 'rating_high', label: 'Высокий рейтинг' },
    { value: 'hardest', label: 'Сложные' },
    { value: 'easiest', label: 'Легкие' },
];

const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface ChallengeFiltersProps {
    initialDifficulty?: number | 'all';
    initialTopicId?: number | 'all';
    initialSort?: string;
    onApply: (filters: { difficulty: number | 'all'; topicId: number | 'all'; sort: string }) => void;
    onReset: () => void;
}

export default function ChallengeFilters({
                                             initialDifficulty = 'all',
                                             initialTopicId = 'all',
                                             initialSort = 'newest',
                                             onApply,
                                             onReset,
                                         }: ChallengeFiltersProps) {
    const dispatch = useAppDispatch();
    const { topics } = useAppSelector((state) => state.challenges);

    const [difficulty, setDifficulty] = useState<number | 'all'>(initialDifficulty);
    const [topicId, setTopicId] = useState<number | 'all'>(initialTopicId);
    const [sort, setSort] = useState(initialSort);

    const [isDiffOpen, setIsDiffOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isTopicOpen, setIsTopicOpen] = useState(false);

    const diffRef = useRef<HTMLDivElement>(null);
    const sortRef = useRef<HTMLDivElement>(null);
    const topicRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dispatch(fetchTopics());
    }, [dispatch]);

    useEffect(() => {
        setDifficulty(initialDifficulty);
        setTopicId(initialTopicId);
        setSort(initialSort);
    }, [initialDifficulty, initialTopicId, initialSort]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (diffRef.current && !diffRef.current.contains(e.target as Node)) setIsDiffOpen(false);
            if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
            if (topicRef.current && !topicRef.current.contains(e.target as Node)) setIsTopicOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const getDifficultyColor = (level: number | 'all') => {
        if (level === 'all') return '#333';
        if (level <= 3) return '#4ade80';
        if (level <= 7) return '#fbbf24';
        return '#f87171';
    };

    const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sort)?.label;
    const currentTopicLabel = topicId === 'all'
        ? 'Все категории'
        : topics.find(t => t.id === topicId)?.name || 'Все категории';

    const handleApplyClick = () => onApply({ difficulty, topicId, sort });

    const handleResetClick = () => {
        setDifficulty('all');
        setTopicId('all');
        setSort('newest');
        setIsDiffOpen(false);
        setIsSortOpen(false);
        setIsTopicOpen(false);
        onReset();
    };

    return (
        <aside className="challenges-sidebar">
            <div className="sidebar-filter-card">
                <h3>Фильтры</h3>

                {}
                <div className="filter-group" ref={sortRef}>
                    <label className="filter-label">Сортировать</label>
                    <div className={`custom-select ${isSortOpen ? 'open' : ''}`} onClick={() => setIsSortOpen(!isSortOpen)}>
                        <div className="select-trigger sort-trigger">
                            <span>{currentSortLabel}</span>
                            <span className="arrow">▼</span>
                        </div>
                        {isSortOpen && (
                            <div className="select-options">
                                {SORT_OPTIONS.map(opt => (
                                    <div
                                        key={opt.value}
                                        className={`option sort-option ${opt.value === sort ? 'active' : ''}`}
                                        onClick={() => { setSort(opt.value); setIsSortOpen(false); }}
                                    >
                                        {opt.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="filter-group" ref={topicRef}>
                    <label className="filter-label">Категория</label>
                    <div className={`custom-select ${isTopicOpen ? 'open' : ''}`} onClick={() => setIsTopicOpen(!isTopicOpen)}>
                        <div className="select-trigger sort-trigger">
                            <span>{currentTopicLabel}</span>
                            <span className="arrow">▼</span>
                        </div>
                        {isTopicOpen && (
                            <div className="select-options">
                                <div
                                    className={`option sort-option ${topicId === 'all' ? 'active' : ''}`}
                                    onClick={() => { setTopicId('all'); setIsTopicOpen(false); }}
                                >
                                    Все категории
                                </div>
                                {topics.map(t => (
                                    <div
                                        key={t.id}
                                        className={`option sort-option ${topicId === t.id ? 'active' : ''}`}
                                        onClick={() => { setTopicId(t.id); setIsTopicOpen(false); }}
                                    >
                                        {t.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="filter-group" ref={diffRef}>
                    <label className="filter-label">Уровень сложности</label>
                    <div className={`custom-select ${isDiffOpen ? 'open' : ''}`} onClick={() => setIsDiffOpen(!isDiffOpen)}>
                        <div className="select-trigger">
                            {difficulty === 'all' ? (
                                <span>Любая сложность</span>
                            ) : (
                                <div className="diff-item">
                                    <div className="difficulty-card-box small" style={{ borderColor: getDifficultyColor(difficulty) }}>
                                        {difficulty}
                                    </div>
                                    <span>Сложность: {difficulty}</span>
                                </div>
                            )}
                            <span className="arrow">▼</span>
                        </div>
                        {isDiffOpen && (
                            <div className="select-options">
                                <div className="option" onClick={() => { setDifficulty('all'); setIsDiffOpen(false); }}>
                                    Любая сложность
                                </div>
                                {DIFFICULTY_LEVELS.map(num => (
                                    <div key={num} className="option" onClick={() => { setDifficulty(num); setIsDiffOpen(false); }}>
                                        <div className="difficulty-card-box small" style={{ borderColor: getDifficultyColor(num) }}>
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
                    <button className="btn-apply" onClick={handleApplyClick}>Применить фильтры</button>
                    <button className="btn-reset" onClick={handleResetClick}>Сбросить</button>
                </div>
            </div>
        </aside>
    );
}
