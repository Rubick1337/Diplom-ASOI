'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { RootState } from '@/shared/store/store';
import { fetchComments, postComment, removeComment } from '@/shared/store/slice/solutionSlice';
import './SolutionComments.css';

interface Props {
    solutionId: number;
    userId: number | undefined;
}

export const SolutionComments: React.FC<Props> = ({ solutionId, userId }) => {
    const dispatch = useAppDispatch();
    const commentsState = useAppSelector((s: RootState) => s.solutions.comments[solutionId]);

    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');

    const items      = commentsState?.items      ?? [];
    const total      = commentsState?.total      ?? 0;
    const loading    = commentsState?.loading    ?? false;
    const submitting = commentsState?.submitting ?? false;

    const handleToggle = () => {
        if (!open && !commentsState) {
            dispatch(fetchComments({ solutionId }));
        }
        setOpen(prev => !prev);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !text.trim()) return;
        dispatch(postComment({ solutionId, userId, content: text.trim() }));
        setText('');
    };

    const handleDelete = (commentId: number) => {
        if (!userId) return;
        dispatch(removeComment({ solutionId, commentId, userId }));
    };

    return (
        <div className="sol-comments">
            <button className="comments-toggle" onClick={handleToggle}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                {open ? 'Скрыть комментарии' : `Комментарии${total > 0 ? ` (${total})` : ''}`}
            </button>

            {open && (
                <div className="comments-body">
                    {loading && <p className="comments-loading">Загрузка...</p>}

                    {!loading && items.length === 0 && (
                        <p className="comments-empty">Комментариев пока нет. Будьте первым!</p>
                    )}

                    <div className="comments-list">
                        {items.map(c => (
                            <div key={c.id} className="comment-item">
                                <div className="comment-header">
                                    <span className="comment-avatar">{c.author?.username?.charAt(0).toUpperCase()}</span>
                                    <span className="comment-author">{c.author?.username}</span>
                                    <span className="comment-date">
                                        {new Date(c.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                    {c.author?.id === userId && (
                                        <button className="comment-delete-btn" onClick={() => handleDelete(c.id)} title="Удалить">
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <p className="comment-content">{c.content}</p>
                            </div>
                        ))}
                    </div>

                    {userId ? (
                        <form className="comment-form" onSubmit={handleSubmit}>
                            <textarea
                                className="comment-input"
                                placeholder="Написать комментарий..."
                                value={text}
                                onChange={e => setText(e.target.value)}
                                rows={2}
                                maxLength={2000}
                            />
                            <button className="comment-submit" type="submit" disabled={submitting || !text.trim()}>
                                {submitting ? 'Отправка...' : 'Отправить'}
                            </button>
                        </form>
                    ) : (
                        <p className="comments-login-hint">Войдите, чтобы оставить комментарий</p>
                    )}
                </div>
            )}
        </div>
    );
};
