'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppSelector } from '@/shared/store/hooks';
import { RootState } from '@/shared/store/store';
import TestApiService, { TestReview, TestReviewsResult } from '@/shared/services/TestApiService';
import ChallengePagination from '@/shared/components/Pagination/Pagination';
import { SortSelect, SortValue } from '../SortSelect/SortSelect';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import './TestReviews.css';

const sortOptions: Record<SortValue, string> = {
    newest:  'Сначала новые',
    oldest:  'Сначала старые',
    highest: 'Высокий рейтинг',
    lowest:  'Низкий рейтинг',
};

interface Props {
    testId: number;
}

export const TestReviews: React.FC<Props> = ({ testId }) => {
    const { user } = useAppSelector((state: RootState) => state.auth);

    const [data, setData]           = useState<TestReviewsResult | null>(null);
    const [loading, setLoading]     = useState(false);
    const [content, setContent]     = useState('');
    const [rating, setRating]       = useState(0);
    const [hover, setHover]         = useState(0);
    const [sort, setSort]           = useState<SortValue>('newest');
    const [page, setPage]           = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [modalConfig, setModalConfig]   = useState({ title: '', message: '', type: 'success' as 'success' | 'warning' });

    const PAGE_SIZE = 5;

    const load = useCallback((p = page, s = sort) => {
        setLoading(true);
        TestApiService.getTestReviews(testId, { page: p, pageSize: PAGE_SIZE, sort: s })
            .then(d => setData(d))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [testId, page, sort]);

    useEffect(() => { load(page, sort); }, [testId, sort, page]);

    const myReview = useMemo(
        () => data?.reviews.find(r => r.userId === user?.id) ?? null,
        [data, user],
    );

    useEffect(() => {
        if (myReview) {
            setContent(myReview.content ?? '');
            setRating(myReview.rating);
        }
    }, [myReview?.userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!myReview && (rating === 0 || !content.trim())) {
            setModalConfig({ title: 'Внимание', message: 'Поставьте оценку и напишите текст отзыва.', type: 'warning' });
            setIsModalOpen(true);
            return;
        }
        if (myReview && rating === 0 && !content.trim()) {
            setModalConfig({ title: 'Внимание', message: 'Отзыв не может быть пустым.', type: 'warning' });
            setIsModalOpen(true);
            return;
        }

        setIsSubmitting(true);
        try {
            await TestApiService.createTestReview(testId, content, rating);
            setModalConfig({
                title:   myReview ? 'Обновлено!'     : 'Опубликовано!',
                message: myReview ? 'Ваш отзыв успешно изменён.' : 'Спасибо! Ваш отзыв добавлен.',
                type: 'success',
            });
            setIsModalOpen(true);
            if (!myReview) { setContent(''); setRating(0); }
            load(1, sort);
            setPage(1);
        } catch {
            setModalConfig({ title: 'Ошибка', message: 'Не удалось сохранить отзыв. Попробуйте позже.', type: 'warning' });
            setIsModalOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCard = (review: TestReview, isOwn = false) => (
        <div key={`${review.userId}-${review.testId}`} className={`tr-card ${isOwn ? 'tr-card--own' : ''}`}>
            <div className="tr-card__head">
                <div className="tr-avatar">{review.user?.username?.charAt(0).toUpperCase() ?? '?'}</div>
                <div className="tr-meta">
                    <span className="tr-username">
                        {review.user?.username ?? 'Аноним'}
                        {isOwn && <span className="tr-own-tag"> (Вы)</span>}
                    </span>
                    <span className="tr-date">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="tr-stars-static">
                    {[1,2,3,4,5].map(s => (
                        <span key={s} className={s <= review.rating ? 'tr-star tr-star--on' : 'tr-star'}> ★</span>
                    ))}
                </div>
            </div>
            {review.content && <div className="tr-card__body"><p>{review.content}</p></div>}
        </div>
    );

    const reviews      = data?.reviews ?? [];
    const totalPages   = data?.pagination.totalPages ?? 1;
    const currentPage  = data?.pagination.page ?? 1;
    const avgRating    = data?.avgRating ?? 0;

    return (
        <div className="tr-section">
            <div className="tr-header">
                <div className="tr-header__info">
                    <h2>Отзывы сообщества</h2>
                    <span className="tr-avg">{avgRating.toFixed(1)} ★</span>
                </div>
                <SortSelect value={sort} onChange={s => { setSort(s); setPage(1); }} options={sortOptions} />
            </div>

            <div className="tr-layout">
                <div className="tr-sidebar">
                    {user ? (
                        <form className="tr-form" onSubmit={handleSubmit}>
                            <h3>{myReview ? 'Редактировать отзыв' : 'Написать отзыв'}</h3>
                            <div className="tr-stars-interactive">
                                {[1,2,3,4,5].map(star => (
                                    <button
                                        type="button" key={star}
                                        className={star <= (hover || rating) ? 'tr-star tr-star--on' : 'tr-star'}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                    >★</button>
                                ))}
                            </div>
                            <textarea
                                className="tr-textarea"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Ваши впечатления о тесте..."
                                rows={4}
                                maxLength={1000}
                            />
                            <button type="submit" className="tr-submit" disabled={isSubmitting}>
                                {isSubmitting ? '…' : myReview ? 'Сохранить изменения' : 'Опубликовать'}
                            </button>
                        </form>
                    ) : (
                        <div className="tr-login-prompt">Войдите, чтобы оставить отзыв.</div>
                    )}
                </div>

                <div className="tr-feed">
                    {loading ? (
                        <div className="tr-loading">Загрузка…</div>
                    ) : (
                        <div className="tr-list">
                            {myReview && currentPage === 1 && renderCard(myReview, true)}
                            {reviews.filter(r => r.userId !== user?.id).map(r => renderCard(r))}
                            {reviews.length === 0 && !myReview && (
                                <div className="tr-empty">Отзывов пока нет. Будьте первым!</div>
                            )}
                        </div>
                    )}
                    {totalPages > 1 && (
                        <ChallengePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={p => setPage(p)}
                        />
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText="Ок"
                cancelText="Закрыть"
                onConfirm={() => setIsModalOpen(false)}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};
