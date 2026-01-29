import React from 'react';
import './ChallengeList.css';
import ChallengeCard from '@/widgets/ChallengeCard/ChallengeCard';

export interface ChallengeItem {
    id: number;
    name: string;
    description: string;
    difficulty?: number | null;
    timeLimitMs?: number | null;
}

interface ChallengeListProps {
    challenges: ChallengeItem[];
    isLoading?: boolean;
}

const ChallengeList: React.FC<ChallengeListProps> = ({ challenges, isLoading }) => {
    if (isLoading) {
        return (
            <div className="challenge-list-loading">
                Загрузка задач...
            </div>
        );
    }

    if (!challenges.length) {
        return (
            <div className="challenge-list-empty">
                Задачи не найдены. Попробуй изменить запрос.
            </div>
        );
    }

    return (
        <div className="challenge-list-column">
            {challenges.map((challenge) => (
                <ChallengeCard
                    key={challenge.id}
                    id={challenge.id}
                    name={challenge.name}
                    description={challenge.description}
                    difficulty={challenge.difficulty}
                    timeLimitMs={challenge.timeLimitMs}
                />
            ))}
        </div>
    );
};

export default ChallengeList;
