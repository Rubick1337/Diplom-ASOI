'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dices, Sparkles } from 'lucide-react';
import { useAppSelector } from '@/shared/store/hooks';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import './RandomChallenge.css';

interface RandomChallengeProps {

    onSelect?: (challenge: any) => void;
    isPickingMode?: boolean;
}

export default function RandomChallenge({ onSelect, isPickingMode }: RandomChallengeProps) {
    const router = useRouter();
    const { items } = useAppSelector((state) => state.challenges);
    const [difficulty, setDifficulty] = useState<number>(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRandomGo = () => {

        const filtered = items.filter(item => item.difficulty === difficulty);

        if (filtered.length > 0) {
            const randomIndex = Math.floor(Math.random() * filtered.length);
            const randomTask = filtered[randomIndex];

            if (isPickingMode && onSelect) {

                onSelect(randomTask);
            } else {

                router.push(`/challenges/${randomTask.id}`);
            }
        } else {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <div className="random-challenge-card">
                <div className="random-card-header">
                    <Dices className="icon-orange" size={20} />
                    <h3>{isPickingMode ? "Случайный выбор" : "Проверь силы"}</h3>
                </div>

                <p className="random-card-desc">
                    {isPickingMode
                        ? "Не можешь выбрать? Положись на удачу!"
                        : "Выбери сложность и получи случайную задачу"}
                </p>

                <div className="random-input-group">
                    <div className="difficulty-selector">
                        <label>Сложность: <span>{difficulty}</span></label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={difficulty}
                            onChange={(e) => setDifficulty(Number(e.target.value))}
                            className="random-range"
                        />
                    </div>

                    <button className="btn-random" onClick={handleRandomGo}>
                        <Sparkles size={16} />
                        {isPickingMode ? "Выбрать случайно" : "Перейти к задаче"}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                title="Задачи не найдены"
                message={`К сожалению, в текущем списке нет задач со сложностью ${difficulty}. Попробуйте выбрать другой уровень или загрузите другие задачи через фильтры.`}
                confirmText="Понятно"
                cancelText="Закрыть"
                type="warning"
                onConfirm={() => setIsModalOpen(false)}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
