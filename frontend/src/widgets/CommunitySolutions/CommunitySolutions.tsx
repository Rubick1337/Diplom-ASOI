'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { RootState } from '@/shared/store/store';
import { fetchCommunitySolutions } from '@/shared/store/slice/challengeSlice';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ChallengePagination from '@/shared/components/Pagination/Pagination';
import './CommunitySolutions.css';

export const CommunitySolutions: React.FC = () => {
    const dispatch = useAppDispatch();
    const params = useParams<{ id: string }>();
    const challengeId = params ? Number(params.id) : 0;

    // Состояние для уведомления о копировании (опционально)
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const { user } = useAppSelector((state: RootState) => state.auth);
    const {
        solutions,
        isSolutionsLoading,
        solutionsTotalPages,
        solutionsCurrentPage
    } = useAppSelector((state: RootState) => state.challenges);

    const handlePageChange = (page: number) => {
        if (challengeId && user?.id) {
            dispatch(fetchCommunitySolutions({
                challengeId,
                userId: user.id,
                page,
                pageSize: 1
            }));
        }
    };

    const handleCopy = (code: string, id: number) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000); // Сброс статуса через 2 сек
        });
    };

    if (isSolutionsLoading && (!solutions || solutions.length === 0)) {
        return <div className="solutions-loading">Загрузка решений...</div>;
    }

    if (!solutions || solutions.length === 0) return null;

    return (
        <div className="community-solutions-container">
            <h2 className="solutions-title">Решения сообщества</h2>

            <div className="solutions-grid" style={{
                opacity: isSolutionsLoading ? 0.5 : 1,
                transition: 'opacity 0.2s ease'
            }}>
                {solutions.map((sol: any) => (
                    <div key={sol.id} className="solution-card">
                        <div className="solution-header">
                            <div className="author-info">
                                <div className="author-avatar">
                                    {sol.user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <span className="author-name">{sol.user?.username}</span>
                            </div>
                            <span className="lang-tag">{sol.language}</span>
                        </div>

                        <div className="solution-code-wrapper">
                            {/* Кнопка копирования */}
                            <button
                                className="copy-button"
                                onClick={() => handleCopy(sol.code, sol.id)}
                            >
                                {copiedId === sol.id ? 'Скопировано!' : 'Копировать'}
                            </button>

                            <SyntaxHighlighter
                                language={sol.language === 'python' ? 'python' : 'javascript'}
                                style={vscDarkPlus}
                                customStyle={{
                                    margin: 0,
                                    padding: '16px',
                                    fontSize: '0.85rem',
                                    backgroundColor: '#0f0f0f',
                                    maxHeight: '400px',
                                }}
                            >
                                {sol.code}
                            </SyntaxHighlighter>
                        </div>

                        <div className="solution-footer">
                            <span>Время: <span className="stat-value">{sol.executionTimeMs}мс</span></span>
                            <span>{new Date(sol.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="solutions-pagination-wrapper">
                <ChallengePagination
                    currentPage={solutionsCurrentPage}
                    totalPages={solutionsTotalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};