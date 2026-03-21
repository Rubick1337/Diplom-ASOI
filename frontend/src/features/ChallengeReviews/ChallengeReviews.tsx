'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { RootState } from '@/shared/store/store';
import { fetchReviews, addReview } from '@/shared/store/slice/challengeSlice';
import ChallengePagination from '@/shared/components/Pagination/Pagination';
import { SortSelect, SortValue } from '../SortSelect/SortSelect';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import './ChallengeReviews.css';

const sortOptions: Record<SortValue, string> = {
    newest: 'Сначала новые',
    oldest: 'Сначала старые',
    highest: 'Высокий рейтинг',
    lowest: 'Низкий рейтинг'
};

export const ChallengeReviews: React.FC = () => {
    const dispatch = useAppDispatch();
    const params = useParams<{ id: string }>();
    const challengeId = params ? Number(params.id) : 0;

    const { user } = useAppSelector((state: RootState) => state.auth);
    const { reviews, avgRating, isReviewsLoading, reviewsTotalPages, reviewsCurrentPage } = useAppSelector((state: RootState) => state.challenges);

    const [content, setContent] = useState('');
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [sort, setSort] = useState<SortValue>('newest');
    const [pageSize] = useState(5);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'success' as 'success' | 'warning' });

    const myReview = useMemo(() => reviews.find(r => r.userId === user?.id), [reviews, user]);

    useEffect(() => {
        if (myReview) {
            setContent(myReview.content);
            setRating(myReview.rating);
        }
    }, [myReview]);

    useEffect(() => {
        if (challengeId) {
            dispatch(fetchReviews({ challengeId, params: { page: 1, pageSize, sort } }));
        }
    }, [challengeId, sort, pageSize, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const isUpdating = !!myReview;

        if (!isUpdating) {

            if (rating === 0 || !content.trim()) {
                setModalConfig({
                    title: 'Внимание',
                    message: 'Пожалуйста, поставьте оценку и напишите текст отзыва.',
                    type: 'warning'
                });
                setIsModalOpen(true);
                return;
            }
        } else {

            if (rating === 0 && !content.trim()) {
                setModalConfig({
                    title: 'Внимание',
                    message: 'Отзыв не может быть пустым.',
                    type: 'warning'
                });
                setIsModalOpen(true);
                return;
            }
        }

        try {
            await dispatch(addReview({ challengeId, userId: user.id, content, rating }));

            setModalConfig({
                title: isUpdating ? 'Обновлено!' : 'Опубликовано!',
                message: isUpdating
                    ? 'Ваш отзыв успешно изменен.'
                    : 'Спасибо! Ваш отзыв добавлен в общую ленту.',
                type: 'success'
            });
            setIsModalOpen(true);

            if (!isUpdating) {
                setContent('');
                setRating(0);
            }
            dispatch(fetchReviews({ challengeId, params: { page: 1, pageSize, sort } }));
        } catch (err) {
            console.error(err);
        }
    };

    const renderReviewCard = (review: any, isMyOwn = false) => (
        <div key={`${review.userId}-${review.challengeId}`} className={`review-card ${isMyOwn ? 'my-review' : ''}`}>
            <div className="review-header">
                <div className="user-avatar">{review.user?.username?.charAt(0).toUpperCase() || '?'}</div>
                <div className="user-info">
                    <span className="username">
                        {review.user?.username || 'Аноним'}
                        {isMyOwn && <span className="own-tag"> (Вы)</span>}
                    </span>
                    <span className="date">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="review-rating-static">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= review.rating ? 'star filled' : 'star empty'}>★</span>
                    ))}
                </div>
            </div>
            <div className="review-body"><p>{review.content}</p></div>
        </div>
    );

    return (
        <div className="reviews-section">
            <div className="reviews-header">
                <div className="header-info">
                    <h2>Отзывы сообщества</h2>
                    <div className="avg-stats">
                        <span className="rating-val">{Number(avgRating).toFixed(1)} ★</span>
                    </div>
                </div>
                <SortSelect value={sort} onChange={(s) => setSort(s)} options={sortOptions} />
            </div>

            <div className="reviews-layout">
                <div className="reviews-sidebar">
                    {user ? (
                        <form className="review-card-form" onSubmit={handleSubmit}>
                            <h3>{myReview ? 'Редактировать отзыв' : 'Написать отзыв'}</h3>
                            <div className="star-rating interactive">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button" key={star}
                                        className={star <= (hover || rating) ? 'star filled' : 'star'}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                    >★</button>
                                ))}
                            </div>
                            <textarea
                                className="review-textarea"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Ваши впечатления от задачи..."
                                rows={4}
                            />
                            <button type="submit" className="submit-btn">
                                {myReview ? 'Сохранить изменения' : 'Опубликовать'}
                            </button>
                        </form>
                    ) : (
                        <div className="login-prompt-card">Войдите, чтобы оставить отзыв.</div>
                    )}
                </div>

                <div className="reviews-feed">
                    <div key={reviewsCurrentPage} className="reviews-list">
                        {myReview && reviewsCurrentPage === 1 && renderReviewCard(myReview, true)}
                        {reviews.filter(r => r.userId !== user?.id).map(review => renderReviewCard(review))}
                    </div>
                    {reviewsTotalPages > 1 && (
                        <ChallengePagination
                            currentPage={reviewsCurrentPage}
                            totalPages={reviewsTotalPages}
                            onPageChange={(p) => dispatch(fetchReviews({ challengeId, params: { page: p, pageSize, sort } }))}
                        />
                    )}
                </div>
            </div>

            {}
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
