'use client';

import React from 'react';
import './ChallengeInfo.css';

interface ChallengeInfoProps {
    name: string;
    description: string;
    topics?: { id: number; name: string }[];
    sampleInput: string;
    sampleOutput: string;
    author?: {
        username: string;
    };
}

export default function ChallengeInfo({
                                          name,
                                          description,
                                          topics = [],
                                          sampleInput,
                                          sampleOutput
                                      }: ChallengeInfoProps) {
    return (
        <div className="challenge-info-container">
            {topics.length > 0 && (
                <div className="challenge-topic-row">
                    {topics.map(t => (
                        <span key={t.id} className="topic-badge">{t.name}</span>
                    ))}
                </div>
            )}
            <p className="challenge-section-label">Описание задачи:</p>
            <div className="info-text">
                {description}
            </div>
            {(sampleInput || sampleOutput) && (
                <div className="examples-section">
                    <p className="examples-header"><strong>Пример:</strong></p>
                    <pre className="examples-block">
                        <code>{sampleInput} ➔ {sampleOutput}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}
