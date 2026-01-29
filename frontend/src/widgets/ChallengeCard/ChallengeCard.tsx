import React from 'react';
import Link from 'next/link';
import './ChallengeCard.css';

interface ChallengeCardProps {
    id: number;
    name: string;
    description: string;
    difficulty?: number | null;
    timeLimitMs?: number | null;
}

const MAX_DESC_LENGTH = 180;

const ChallengeCard: React.FC<ChallengeCardProps> = ({
                                                         id,
                                                         name,
                                                         description,
                                                         difficulty,
                                                         timeLimitMs,
                                                     }) => {
    const shortDescription =
        description.length > MAX_DESC_LENGTH
            ? description.slice(0, MAX_DESC_LENGTH) + '...'
            : description;

    const safeDifficulty =
        difficulty && difficulty > 0 ? Math.min(10, Math.max(1, difficulty)) : null;

    const badgeText = name.slice(0, 2).toUpperCase();

    return (
        <article className="challenge-card">
            <header className="challenge-card-head">
                <div className="challenge-card-badge">
                    {badgeText}
                </div>
                <h2 className="challenge-card-title">{name}</h2>
            </header>

            <p className="challenge-card-desc">
                {shortDescription}
            </p>

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
                            : 'по умолчанию'}
                    </span>
                </div>
            </div>

            <div className="challenge-card-footer">
                <Link href={`/challenges/${id}`} className="challenge-card-link">
                    <button className="challenge-card-btn">
                        Перейти к задаче
                    </button>
                </Link>
            </div>
        </article>
    );
};

export default ChallengeCard;
