'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { RootState } from '@/shared/store/store';
import { fetchCommunitySolutions } from '@/shared/store/slice/challengeSlice';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ChallengePagination from '@/shared/components/Pagination/Pagination';
import { SortSelect, SortValue } from '@/features/SortSelect/SortSelect';
import { SolutionsLanguageFilter, FilterLanguageValue } from '@/features/SolutionsLanguageFilter/SolutionsLanguageFilter';
import './CommunitySolutions.css';

const sortOptions: Record<string, string> = {
    newest: 'Сначала новые',
    oldest: 'Сначала старые'
};

export const CommunitySolutions: React.FC = () => {
    const dispatch = useAppDispatch();
    const params = useParams<{ id: string }>();
    const challengeId = params ? Number(params.id) : 0;

    const { user } = useAppSelector((state: RootState) => state.auth);
    const {
        solutions,
        isSolutionsLoading,
        solutionsTotalPages,
        solutionsCurrentPage
    } = useAppSelector((state: RootState) => state.challenges);

    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [sort, setSort] = useState<SortValue>('newest');
    const [language, setLanguage] = useState<FilterLanguageValue>('all');
    const [pageSize] = useState(5);

    useEffect(() => {
        if (challengeId && user?.id) {
            dispatch(fetchCommunitySolutions({
                challengeId,
                userId: user.id,
                params: {
                    page: 1,
                    pageSize,
                    sort: sort as any,
                    language: language === 'all' ? undefined : language
                }
            }));
        }
    }, [challengeId, user?.id, sort, language, pageSize, dispatch]);

    const handlePageChange = (newPage: number) => {
        if (challengeId && user?.id) {
            dispatch(fetchCommunitySolutions({
                challengeId,
                userId: user.id,
                params: {
                    page: newPage,
                    pageSize,
                    sort: sort as any,
                    language: language === 'all' ? undefined : language
                }
            }));
        }
    };

    const handleCopy = (code: string, id: number) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    return (
        <div className="solutions-section">
            <div className="solutions-header">
                <div className="header-info">
                    <h2>Решения сообщества</h2>
                    <span className="solutions-count">Найдено: {solutions.length}</span>
                </div>
                {}
                <SortSelect value={sort} onChange={(val) => setSort(val)} options={sortOptions} />
            </div>

            <div className="solutions-layout">
                {}
                <aside className="solutions-sidebar">
                    <div className="sidebar-filter-card">
                        <h3>Фильтрация</h3>

                        <div className="filter-group">
                            <label className="filter-label">Язык программирования</label>
                            {}
                            <SolutionsLanguageFilter
                                value={language}
                                onChange={setLanguage}
                            />
                        </div>

                        <div className="filter-hint">
                            Показаны только успешные решения других пользователей.
                        </div>
                    </div>
                </aside>

                <main className="solutions-feed">
                    <div key={solutionsCurrentPage} className="solutions-list" style={{ opacity: isSolutionsLoading ? 0.6 : 1 }}>
                        {solutions.map((sol: any) => (
                            <div key={sol.id} className="solution-card">
                                <div className="solution-card-header">
                                    <div className="author-info">
                                        <div className="author-avatar">
                                            {sol.user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="author-details">
                                            <span className="author-name">{sol.user?.username}</span>
                                            <span className="sol-date">
                                                {new Date(sol.createdAt).toLocaleDateString('ru-RU')}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`lang-badge ${sol.language}`}>{sol.language}</span>
                                </div>

                                <div className="solution-code-container">
                                    <button className="copy-btn" onClick={() => handleCopy(sol.code, sol.id)}>
                                        {copiedId === sol.id ? 'Скопировано!' : 'Копировать'}
                                    </button>
                                    <SyntaxHighlighter
                                        language={sol.language === 'python' ? 'python' : 'javascript'}
                                        style={vscDarkPlus}
                                        customStyle={{
                                            margin: 0,
                                            padding: '20px',
                                            fontSize: '0.9rem',
                                            backgroundColor: '#0d0d0d',
                                            borderRadius: '8px',
                                            minHeight: '153px'
                                        }}
                                    >
                                        {sol.code}
                                    </SyntaxHighlighter>
                                </div>

                                <div className="solution-card-footer">
                                    <div className="sol-stats">
                                        <span className="stat-item">Скорость: <b>{sol.executionTimeMs}мс</b></span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isSolutionsLoading && solutions.length === 0 && (
                            <div className="empty-solutions">Решений не найдено</div>
                        )}
                    </div>

                    {solutionsTotalPages > 1 && (
                        <div className="solutions-pagination-wrapper">
                            <ChallengePagination
                                currentPage={solutionsCurrentPage}
                                totalPages={solutionsTotalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
