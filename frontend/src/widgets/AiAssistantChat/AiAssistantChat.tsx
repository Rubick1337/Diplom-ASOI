'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { API_ENDPOINTS } from '@/shared/api/apiEndpoints';
import './AiAssistantChat.css';

interface TestResult {
    status: 'success' | 'failed' | string;
    expected?: string;
    actual?: string;
    error?: string;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface AiAssistantChatProps {
    isSolved: boolean;
    attemptsCount: number;
    challengeId: number | string;
    code: string;
    language: string;
    testResults?: TestResult[];
}

const WELCOME_TEXT = 'Привет! Я твой ИИ-ассистент по этой задаче.\n\nЗапусти код — и я автоматически разберу результаты. Или задай вопрос прямо сейчас.';

const SUGGESTIONS_DEFAULT = [
    'С чего мне начать решение задачи?',
    'Почему мой код не проходит тесты?',
    'Объясни что не так в логике',
];

const SUGGESTIONS_SOLVED = [
    'Покажи альтернативное решение',
    'Какие темы стоит изучить по этой задаче?',
    'Как улучшить читаемость моего кода?',
];

export const AiAssistantChat = ({
    isSolved,
    challengeId,
    code,
    language,
    testResults = [],
}: AiAssistantChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [notification, setNotification] = useState<'idle' | 'analyzing' | 'done'>('idle');

    const lastAnalyzedResultsRef = useRef<string>('');
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages, isLoading]);

    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }, [input]);

    useEffect(() => {
        if (!testResults.length) return;
        const key = JSON.stringify(testResults) + String(isSolved);
        if (key === lastAnalyzedResultsRef.current) return;
        lastAnalyzedResultsRef.current = key;
        handleAnalyze(isSolved);
    }, [testResults, isSolved]);

    useEffect(() => {
        if (notification !== 'done') return;
        const t = setTimeout(() => setNotification('idle'), 4000);
        return () => clearTimeout(t);
    }, [notification]);

    const handleAnalyze = useCallback(async (solved = false) => {
        setNotification('analyzing');
        setIsLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.CHALLENGE.AI_ANALYZE(challengeId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code, language, testResults, isSolved: solved }),
            });
            const data = await res.json();
            const text = !res.ok
                ? `Ошибка сервера: ${data.message ?? res.status}`
                : (data.analysis ?? 'Пустой ответ от ИИ.');
            setMessages(prev => [...prev, { role: 'model', text }]);
            setNotification('done');
        } catch {
            setMessages(prev => [...prev, { role: 'model', text: 'Не удалось подключиться к серверу.' }]);
            setNotification('idle');
        } finally {
            setIsLoading(false);
        }
    }, [challengeId, code, language, testResults]);

    async function handleSend(text?: string) {
        const trimmed = (text ?? input).trim();
        if (!trimmed || isLoading) return;

        const newHistory: Message[] = [...messages, { role: 'user', text: trimmed }];
        setMessages(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(API_ENDPOINTS.CHALLENGE.AI_CHAT(challengeId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    message: trimmed,
                    code,
                    language,
                    history: newHistory.slice(0, -1),
                }),
            });
            const data = await res.json();
            const reply = !res.ok
                ? `Ошибка: ${data.message ?? res.status}`
                : (data.reply ?? 'Пустой ответ.');
            setMessages(prev => [...prev, { role: 'model', text: reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'model', text: 'Ошибка при отправке. Попробуй снова.' }]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function scrollToLatest() {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setNotification('idle');
    }

    const isEmpty = messages.length === 0 && !isLoading;

    return (
        <section className="ai-chat">

            {}
            {notification === 'analyzing' && (
                <div className="ai-chat__toast ai-chat__toast--analyzing">
                    <span className="ai-chat__toast-pulse" />
                    <span>ИИ анализирует код...</span>
                </div>
            )}
            {notification === 'done' && (
                <div className="ai-chat__toast" onClick={scrollToLatest}>
                    <span className="ai-chat__toast-icon">✦</span>
                    <span>ИИ анализ готов</span>
                </div>
            )}

            {}
            <div className="ai-chat__header">
                <div className="ai-chat__header-left">
                    <div className="ai-chat__avatar">AI</div>
                    <div>
                        <div className="ai-chat__title">ИИ-ассистент</div>
                        <div className="ai-chat__subtitle">
                            {isLoading ? 'Думает...' : 'Помогает разобраться, не даёт готовых ответов'}
                        </div>
                    </div>
                </div>
                {isLoading && <span className="ai-chat__header-spinner" />}
            </div>

            {}
            <div className="ai-chat__body" ref={chatBodyRef}>
                {isEmpty && (
                    <div className="ai-chat__welcome">
                        <div className="ai-chat__welcome-icon">
                            <Image src="/images/goose-ai.png" alt="Goose" width={72} height={72} unoptimized />
                        </div>
                        <p className="ai-chat__welcome-text">
                            {isSolved
                                ? 'Задача решена! Запусти код ещё раз — я разберу твоё решение, покажу альтернативный подход и порекомендую что почитать.'
                                : WELCOME_TEXT}
                        </p>
                        <div className="ai-chat__suggestions">
                            {(isSolved ? SUGGESTIONS_SOLVED : SUGGESTIONS_DEFAULT).map(s => (
                                <button key={s} className="ai-chat__suggestion" onClick={() => handleSend(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, i) => (
                    <div key={i} className={`ai-chat__message ai-chat__message--${m.role === 'model' ? 'ai' : 'user'}`}>
                        {m.role === 'model' && <div className="ai-chat__msg-avatar">AI</div>}
                        <div className="ai-chat__bubble">
                            <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="ai-chat__message ai-chat__message--ai">
                        <div className="ai-chat__msg-avatar">AI</div>
                        <div className="ai-chat__thinking">
                            <span className="ai-chat__thinking-pulse" />
                            <span className="ai-chat__thinking-text">Думаю...</span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {}
            <div className="ai-chat__footer">
                <div className="ai-chat__input-wrap">
                    <textarea
                        ref={textareaRef}
                        className="ai-chat__textarea"
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Задай вопрос по коду... (Enter — отправить)"
                        disabled={isLoading}
                    />
                    <button
                        className="ai-chat__send"
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        aria-label="Отправить"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div className="ai-chat__hint">Shift+Enter — новая строка</div>
            </div>
        </section>
    );
};
