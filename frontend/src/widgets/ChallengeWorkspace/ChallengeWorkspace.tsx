'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import './ChallengeWorkspace.css';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchChallengeById,
    runChallengeTests,
    resetTestResults,
    fetchChallengeHistory,
    fetchCommunitySolutions,
    fetchReviews
} from '@/shared/store/slice/challengeSlice';
import { RootState } from '@/shared/store/store';
import confetti from 'canvas-confetti';

import ChallengeInfo from '@/entities/challenge/ChallengeInfo';
import { TestCase, TerminalLog } from '@/shared/types/ide';
import { ChallengeTestCase } from "@/shared/types/challenge";
import LanguageSelect, { LanguageValue } from '@/features/LanguageSelect/LanguageSelect';
import CodeIdeWidget from '@/widgets/CodeIdeWidget/CodeIdeWidget';
import TestsPanel from '@/widgets/TestsPanel/TestsPanel';
import { AiAssistantChat } from '@/widgets/AiAssistantChat/AiAssistantChat';
import { CommunitySolutions } from '@/widgets/CommunitySolutions/CommunitySolutions';
import { ChallengeReviews } from '@/features/ChallengeReviews/ChallengeReviews';
import LockedOverlay from '@/shared/components/LockedOverlay/LockedOverlay';

const generateStarterCode = (language: string, funcName: string, params: any[]): string => {
    const paramNames = params.map(p => p.name);
    const tsParams = params.map(p => `${p.name}: ${p.type || 'any'}`).join(', ');

    switch (language) {
        case 'javascript':
            return `function ${funcName}(${paramNames.join(', ')}) {\n    // ваш код здесь\n    return;\n}\n\nmodule.exports = ${funcName};`;
        case 'typescript':
            return `export function ${funcName}(${tsParams}): any {\n    // ваш код здесь\n    return;\n}`;
        case 'python':
            return `def ${funcName}(${paramNames.join(', ')}):\n    # ваш код здесь\n    pass`;
        default:
            return `function ${funcName}(${paramNames.join(', ')}) {\n    return;\n}`;
    }
};

export default function ChallengeWorkspace() {
    const params = useParams<{ id: string }>();
    const challengeId = params ? Number(params.id) : 0;
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state: RootState) => state.auth);
    const {
        currentChallenge,
        isCurrentLoading,
        currentError,
        testResults,
        isExecuting,
        systemError,
        reviews
    } = useAppSelector((state: RootState) => state.challenges);

    const [language, setLanguage] = useState<LanguageValue>('javascript');
    const [code, setCode] = useState('');
    const [logs, setLogs] = useState<TerminalLog[]>([]);
    const [attempts, setAttempts] = useState(0);
    const [testCases, setTestCases] = useState<TestCase[]>([]);

    // По умолчанию открыты решения (но они будут под LockedOverlay)
    const [activeTab, setActiveTab] = useState<'solutions' | 'reviews'>('solutions');

    const isSolved = useMemo(() => {
        return testResults.length > 0 && testResults.every(r => r.status === 'success');
    }, [testResults]);

    const starterCode = useMemo(() => {
        if (!currentChallenge) return '';
        return generateStarterCode(language, currentChallenge.funcName, currentChallenge.parameters);
    }, [currentChallenge, language]);

    useEffect(() => {
        if (challengeId) {
            dispatch(fetchChallengeById(challengeId));
            dispatch(fetchReviews(challengeId));
        }
    }, [dispatch, challengeId]);

    const fireVictoryConfetti = () => {
        const count = 200;
        const defaults = { origin: { y: 0.7 }, zIndex: 10000 };
        function fire(particleRatio: number, opts: any) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    useEffect(() => {
        if (!currentChallenge) return;
        const storageKey = `challenge_${challengeId}_${language}_code`;
        const savedCode = localStorage.getItem(storageKey);
        setCode(savedCode || starterCode);

        if (currentChallenge.testCases) {
            setTestCases(currentChallenge.testCases.map((tc: ChallengeTestCase) => ({
                id: String(tc.id),
                title: tc.title,
                status: 'idle',
                expected: String(tc.expectedOutput),
                actual: undefined
            })));
        }
    }, [currentChallenge, language, starterCode, challengeId]);

    useEffect(() => {
        if (isExecuting) return;
        const newLogs: TerminalLog[] = [];
        const timestamp = new Date().toLocaleTimeString();

        if (systemError) {
            setTestCases(prev => prev.map(t => ({
                ...t,
                status: 'fail',
                actual: systemError.message || 'Execution Error'
            })));
            newLogs.push({ id: `sys-${Date.now()}`, type: 'error', message: `[ОШИБКА]: ${systemError.message}`, timestamp });
        }
        else if (testResults.length > 0) {
            setTestCases(prev => prev.map(t => {
                const res = testResults.find(r => String(r.id) === t.id);
                if (!res) return t;
                return {
                    ...t,
                    status: res.status as any,
                    actual: (res.actual !== undefined && res.actual !== null) ? String(res.actual) : '—',
                    duration: res.duration
                };
            }));

            if (isSolved) {
                fireVictoryConfetti();
                if (user?.id) {
                    dispatch(fetchChallengeHistory({ challengeId, userId: user.id }));
                    dispatch(fetchCommunitySolutions({ challengeId, userId: user.id }));
                }
            }
        }
        if (newLogs.length > 0) setLogs(newLogs);
    }, [testResults, systemError, isExecuting, user?.id, challengeId, dispatch, isSolved]);

    const handleRunTests = () => {
        if (!currentChallenge || isExecuting) return;
        dispatch(resetTestResults());
        setLogs([]);
        setTestCases(prev => prev.map(t => ({ ...t, status: 'running', actual: undefined })));
        dispatch(runChallengeTests({ id: challengeId, code, language, userId: user?.id }));
        setAttempts(a => a + 1);
    };

    if (isCurrentLoading) return <div className="loading-screen">Загрузка...</div>;
    if (currentError || !currentChallenge) return <div className="error-screen">Задача не найдена</div>;

    return (
        <section className="challenge-workspace">
            <div className="workspace-header">
                <div className="header-left">
                    <div className="title-row">
                        <span className="rank-badge">7</span>
                        <h1 className="task-title">{currentChallenge.name}</h1>
                    </div>
                </div>
                <div className="header-right">
                    <LanguageSelect currentValue={language} onChange={(l) => setLanguage(l.value)}/>
                </div>
            </div>

            <div className="workspace-main-grid">
                <div className="column-left">
                    <ChallengeInfo
                        name={currentChallenge.name}
                        description={currentChallenge.description}
                        topic={currentChallenge.topic}
                        sampleInput={currentChallenge.sampleInput}
                        sampleOutput={currentChallenge.sampleOutput}
                    />
                </div>
                <div className="column-right">
                    <div className="editor-container">
                        <CodeIdeWidget
                            key={language}
                            language={language}
                            code={code}
                            starterCode={starterCode}
                            onCodeChange={setCode}
                            logs={logs}
                            onClearLogs={() => setLogs([])}
                            executionResults={{ testResults, systemError, isExecuting }}
                        />
                    </div>
                    <div className="tests-container">
                        <TestsPanel tests={testCases}/>
                    </div>
                    <div className="action-bar">
                        <button
                            className={`challenge-submit-btn ${isExecuting ? 'loading' : ''}`}
                            onClick={handleRunTests}
                            disabled={isExecuting}
                        >
                            {isExecuting ? 'Выполняется' : 'Отправить'}
                        </button>
                    </div>
                </div>
            </div>

            <AiAssistantChat isSolved={isSolved} attemptsCount={attempts} />

            <div className="workspace-bottom">
                <div className="workspace-tabs-nav">
                    <button
                        className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Отзывы {reviews?.length > 0 && <span className="count-badge">{reviews.length}</span>}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'solutions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('solutions')}
                    >
                        Решения сообщества
                        {!isSolved && <span className="lock-inline"></span>}
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'solutions' ? (
                        isSolved ? (
                            <CommunitySolutions />
                        ) : (
                            <LockedOverlay
                                title="Решения заблокированы"
                                description="Решите задачу успешно, чтобы получить доступ к решениям других участников."
                            />
                        )
                    ) : (
                        <ChallengeReviews />
                    )}
                </div>
            </div>
        </section>
    );
}