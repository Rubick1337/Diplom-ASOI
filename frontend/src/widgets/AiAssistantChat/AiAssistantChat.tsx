import React from 'react';
import Image from 'next/image';
import LockedOverlay from '@/shared/components/LockedOverlay/LockedOverlay';
import './AiAssistantChat.css';

interface AiAssistantChatProps {
    isSolved: boolean;
    attemptsCount: number;
}

export const AiAssistantChat = ({ isSolved, attemptsCount }: AiAssistantChatProps) => {
    const isAccessible = isSolved || attemptsCount >= 20;

    return (
        <section className="ai-assistant-widget">
            <div className="assistant-header">
                <div className="assistant-info">
                    <Image src="/images/locked/gpt-white.png" alt="GPT" width={24} height={24} unoptimized />
                    <span className="assistant-name">AI Ассистент</span>
                </div>
                <div className="status-badge">
                    {isAccessible ? (
                        <span className="unlocked-text">Доступ открыт</span>
                    ) : (
                        <span className="locked-text">Попытки: {attemptsCount}/20</span>
                    )}
                </div>
            </div>

            <div className="chat-area-wrapper">
                {!isAccessible && (
                    <LockedOverlay
                        title="Чат недоступен"
                        description="Сдайте задачу или сделайте 20 попыток, чтобы ИИ помог вам."
                    />
                )}

                <div className="chat-content">
                    <div className="messages-list">
                        <div className="message ai">
                            Привет! Я помогу разобрать твое решение, когда доступ откроется.
                        </div>
                        {!isAccessible && (
                            <>
                                <div className="message user blur-mock" style={{width: '40%'}}></div>
                                <div className="message ai blur-mock" style={{width: '60%'}}></div>
                            </>
                        )}
                    </div>

                    <div className="input-area">
                        <input
                            type="text"
                            placeholder={isAccessible ? "Задайте вопрос..." : "Чат заблокирован"}
                            disabled={!isAccessible}
                            className="chat-input"
                        />
                        <button className="send-btn" disabled={!isAccessible}>
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};