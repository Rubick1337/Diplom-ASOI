'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './ChallengeCard.css';

interface ChallengeCardProps {
    id: number;
    name: string;
    description: string;
    difficulty?: number | null;
    timeLimitMs?: number | null;
    topics?: { id: number; name: string }[];
    solvedCount?: number;
    averageRating?: number;
    author?: { username: string };

    isPickingMode?: boolean;
    onSelect?: (id: number) => void;
    isSelectedByMe?: boolean;
    isSelectedByOpponent?: boolean;
}

const MAX_DESC_LENGTH = 140;

const ChallengeCard: React.FC<ChallengeCardProps> = ({
                                                         id,
                                                         name,
                                                         description,
                                                         difficulty,
                                                         timeLimitMs,
                                                         topics,
                                                         solvedCount,
                                                         averageRating,
                                                         author,
                                                         isPickingMode,
                                                         onSelect,
                                                         isSelectedByMe,
                                                         isSelectedByOpponent
                                                     }) => {
    const shortDescription =
        description.length > MAX_DESC_LENGTH
            ? description.slice(0, MAX_DESC_LENGTH) + '...'
            : description;

    const safeDifficulty =
        difficulty && difficulty > 0 ? Math.min(10, Math.max(1, difficulty)) : null;

    const badgeText = name.slice(0, 2).toUpperCase();

    const isLocked = isSelectedByMe || isSelectedByOpponent;

    return (
        <article className={`challenge-card ${isSelectedByMe ? 'selected-me' : ''} ${isSelectedByOpponent ? 'selected-opp' : ''}`}>
            <header className="challenge-card-head">
                <div className="challenge-card-badge">
                    {badgeText}
                </div>
                <div className="challenge-card-title-area">
                    <h2 className="challenge-card-title">{name}</h2>
                    {topics && topics.length > 0 && (
                        <div className="challenge-card-topics">
                            {topics.map(t => (
                                <span key={t.id} className="challenge-card-topic">{t.name}</span>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <p className="challenge-card-desc">
                {shortDescription}
            </p>

            <div className="challenge-card-stats">
                {}
                {(averageRating !== undefined && averageRating !== null) && (
                    <div className="stat-item rating">
                        <span className="stat-icon">★</span>
                        <span className="stat-text">{Number(averageRating).toFixed(1)}</span>
                    </div>
                )}

                {(solvedCount !== undefined && solvedCount !== null) && (
                    <div className="stat-item solved">
                        <Image
                            src="/images/Challenge/users.png"
                            alt="users"
                            width={28}
                            height={28}
                            className="stat-image-icon"
                        />
                        <span className="stat-text">решили: {Number(solvedCount)}</span>
                    </div>
                )}

                {author?.username && (
                    <div className="stat-item author">
                        <Image
                            src="/images/Challenge/автор.png"
                            alt="author"
                            width={24}
                            height={24}
                            className="stat-image-icon"
                        />
                        <span className="stat-text">{author.username}</span>
                    </div>
                )}
            </div>

            <div className="challenge-card-meta">
                <div className="challenge-card-meta-row">
                    <span className="challenge-card-meta-label">Сложность</span>
                    <div className="challenge-card-difficulty-wrap">
                        <div className="challenge-card-difficulty-box">
                            {safeDifficulty ?? '–'}
                        </div>
                    </div>
                </div>

                <div className="challenge-card-meta-row">
                    <span className="challenge-card-meta-label">Лимит времени</span>
                    <span className="challenge-card-meta-value">
                        {typeof timeLimitMs === 'number'
                            ? `${timeLimitMs} мс`
                            : 'без лимита'}
                    </span>
                </div>
            </div>

            <div className="challenge-card-footer">
                {isPickingMode ? (
                    <button
                        className={`challenge-card-btn ${isLocked ? 'locked' : ''}`}
                        onClick={() => !isLocked && onSelect?.(id)}
                        disabled={isLocked}
                    >
                        {isSelectedByMe ? 'Вы выбрали' : isSelectedByOpponent ? 'Выбрал оппонент' : 'Выбрать'}
                    </button>
                ) : (
                    <Link href={`/challenges/${id}`} className="challenge-card-link">
                        <button className="challenge-card-btn">
                            Перейти к задаче
                        </button>
                    </Link>
                )}
            </div>
        </article>
    );
};

export default ChallengeCard;
