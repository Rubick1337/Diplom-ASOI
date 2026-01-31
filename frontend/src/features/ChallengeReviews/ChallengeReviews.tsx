'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { RootState } from '@/shared/store/store';
import { fetchReviews, addReview } from '@/shared/store/slice/challengeSlice';
import './ChallengeReviews.css';

export const ChallengeReviews: React.FC = () => {
    const dispatch = useAppDispatch();
    const params = useParams<{ id: string }>();
    const challengeId = params ? Number(params.id) : 0;

    const { user } = useAppSelector((state: RootState) => state.auth);
    const { reviews, avgRating, isReviewsLoading } = useAppSelector((state: RootState) => state.challenges);

    const [content, setContent] = useState('');
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    const existingReview = useMemo(() => {
        return reviews.find(r => r.userId === user?.id);
    }, [reviews, user]);

    const sortedReviews = useMemo(() => {
        if (!reviews) return [];
        return [...reviews].sort((a, b) => {
            if (a.userId === user?.id) return -1;
            if (b.userId === user?.id) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [reviews, user]);

    useEffect(() => {
        if (existingReview) {
            setContent(existingReview.content);
            setRating(existingReview.rating);
        }
    }, [existingReview]);

    useEffect(() => {
        if (challengeId) {
            dispatch(fetchReviews(challengeId));
        }
    }, [challengeId, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert('Войдите, чтобы оставить отзыв');
        if (rating === 0) return alert('Пожалуйста, выставите оценку');
        if (!content.trim()) return alert('Напишите текст отзыва');

        await dispatch(addReview({
            challengeId,
            userId: user.id,
            content,
            rating
        }));

        alert(existingReview ? 'Отзыв обновлен' : 'Отзыв опубликован');
    };

    const getAvatarLetter = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

    return (
        <div className="reviews-section">
            <div className="reviews-header">
                <div className="header-info">
                    <h2>Отзывы сообщества</h2>
                    <span className="reviews-count">{reviews.length} отзывов</span>
                </div>
                {avgRating > 0 && (
                    <div className="rating-badge">
                        <span className="rating-star">★</span>
                        <span className="rating-value">{Number(avgRating).toFixed(1)}</span>
                    </div>
                )}
            </div>

            <div className="reviews-layout">
                <div className="reviews-sidebar">
                    {user ? (
                        <form className="review-card-form" onSubmit={handleSubmit}>
                            <h3>{existingReview ? 'Редактировать мой отзыв' : 'Написать отзыв'}</h3>
                            <div className="rating-input-wrapper">
                                <label>Ваша оценка:</label>
                                <div className="star-rating interactive">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            className={star <= (hover || rating) ? 'star filled' : 'star'}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                className="review-textarea"
                                placeholder="Поделитесь впечатлениями..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={5}
                            />
                            <button type="submit" className="submit-btn">
                                {existingReview ? 'Сохранить изменения' : 'Опубликовать'}
                            </button>
                        </form>
                    ) : (
                        <div className="login-prompt-card">
                            <p>Войдите, чтобы оставить отзыв.</p>
                        </div>
                    )}
                </div>

                <div className="reviews-feed">
                    {isReviewsLoading && <div className="loading-state">Загрузка...</div>}
                    <div className="reviews-list">
                        {sortedReviews.map((review) => {
                            const isMyReview = review.userId === user?.id;
                            return (
                                <div
                                    key={`${review.userId}-${review.challengeId}`}
                                    className={`review-card ${isMyReview ? 'my-review' : ''}`}
                                >
                                    <div className="review-header">
                                        <div className="user-avatar">
                                            {getAvatarLetter(review.user?.username || 'A')}
                                        </div>
                                        <div className="user-info">
                                            <span className="username">
                                                {review.user?.username || 'Аноним'}
                                                {isMyReview && <span className="own-tag">(Ваш отзыв)</span>}
                                            </span>
                                            <span className="date">
                                                {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                                            </span>
                                        </div>
                                        <div className="review-rating-static">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <span key={s} className={s <= review.rating ? 'star filled' : 'star empty'}>★</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="review-body">
                                        <p>{review.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};