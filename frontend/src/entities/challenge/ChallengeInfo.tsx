'use client';

import React from 'react';
import './ChallengeInfo.css';

interface ChallengeInfoProps {
    name: string;
    description: string;
    topic: string;
    sampleInput: string;
    sampleOutput: string;
    author?: {
        username: string;
    };
}

export default function ChallengeInfo({
                                          name,
                                          description,
                                          topic,
                                          sampleInput,
                                          sampleOutput
                                      }: ChallengeInfoProps) {
    return (
        <div className="challenge-info-container">
            <div className="challenge-topic-row">
                {topic && <span className="topic-badge">Тема: {topic}</span>}
            </div>
            <div className="challenge-topic-row">
                <span className="topic-badge">Описание задачи:</span>
            </div>
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