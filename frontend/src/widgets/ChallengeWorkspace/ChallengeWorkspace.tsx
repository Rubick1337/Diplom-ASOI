'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import './ChallengeWorkspace.css';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchChallengeById,
    runChallengeTests,
    runCompetitiveTests,
    resetTestResults,
    resetCompetitiveResults,
    fetchChallengeHistory,
    fetchCommunitySolutions,
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
import ReportModal from '@/features/ReportModal/ReportModal';
import { addExperience } from '@/shared/store/slice/authSlice';

const generateStarterCode = (language: string, funcName: string, params: any[] = []): string => {
    const pArray = params || [];
    const paramNames = pArray.map((p: any) => p.name);
    const tsParams = pArray.map((p: any) => {
        const t = p.type || 'any';
        const tsType = (t === 'int' || t === 'float' || t === 'number') ? 'number'
            : (t === 'bool' || t === 'boolean') ? 'boolean'
            : (t === 'string') ? 'string'
            : (t === 'array') ? 'any[]'
            : (t === 'array2d') ? 'any[][]'
            : 'any';
        return `${p.name}: ${tsType}`;
    }).join(', ');
    const cppTypes = pArray.map((p: any) => {
        const t = p.type || 'int';
        const cppType = (t === 'float') ? 'double'
            : (t === 'string') ? 'std::string'
            : (t === 'bool' || t === 'boolean') ? 'bool'
            : (t === 'array') ? 'std::vector<int>'
            : (t === 'array2d') ? 'std::vector<std::vector<int>>'
            : (t === 'object') ? 'auto'
            : (t === 'number') ? 'double'
            : 'int';
        return `${cppType} ${p.name}`;
    }).join(', ');
    const javaTypes = pArray.map((p: any) => {
        const t = p.type || 'int';
        const jType = (t === 'float' || t === 'number') ? 'double'
            : (t === 'string') ? 'String'
            : (t === 'bool' || t === 'boolean') ? 'boolean'
            : (t === 'array') ? 'int[]'
            : (t === 'array2d') ? 'int[][]'
            : 'int';
        return `${jType} ${p.name}`;
    }).join(', ');
    const csParams = pArray.map((p: any) => {
        const t = p.type || 'int';
        const csType = (t === 'float') ? 'double'
            : (t === 'string') ? 'string'
            : (t === 'bool' || t === 'boolean') ? 'bool'
            : (t === 'array') ? 'object[]'
            : (t === 'array2d') ? 'object[][]'
            : (t === 'object') ? 'object'
            : (t === 'number') ? 'double'
            : 'int';
        return `${csType} ${p.name}`;
    }).join(', ');
    const name = funcName || 'solution';

    switch (language) {
        case 'javascript':
            return `function ${name}(${paramNames.join(', ')}) {\n    // ваш код здесь\n    return;\n}`;
        case 'typescript':
            return `function ${name}(${tsParams}): any {\n    // ваш код здесь\n    return;\n}`;
        case 'python':
            return `def ${name}(${paramNames.join(', ')}):\n    # ваш код здесь\n    pass`;
        case 'cpp':
            return `#include <string>\n#include <vector>\nusing namespace std;\n\nauto ${name}(${cppTypes || 'int n'}) {\n    // ваш код здесь\n    return 0;\n}`;
        case 'csharp':
            return `public static object ${name}(${csParams || 'int n'}) {\n    // ваш код здесь\n    return null;\n}`;
        case 'php':
            return `<?php\nfunction ${name}(${paramNames.map(p => '$' + p).join(', ') || '$n'}) {\n    // ваш код здесь\n    return null;\n}`;
        case 'coffeescript':
            return `${name} = (${paramNames.join(', ') || 'n'}) ->\n    # ваш код здесь\n    null`;
        case 'java':
            return `class Solution {\n    public Object ${name}(${javaTypes || 'int n'}) {\n        // ваш код здесь\n        return null;\n    }\n}`;
        default:
            return `function ${name}(${paramNames.join(', ')}) {\n    return;\n}`;
    }
};

interface ChallengeWorkspaceProps {
    isCompetitive?: boolean;
    manualChallenge?: any;
    onBattleUpdate?: (data: any) => void;
}

export default function ChallengeWorkspace({
                                               isCompetitive = false,
                                               manualChallenge = null,
                                               onBattleUpdate
                                           }: ChallengeWorkspaceProps) {
    const params = useParams<{ id: string }>();
    const dispatch = useAppDispatch();

    const challengeId = isCompetitive
        ? Number(manualChallenge?.id)
        : (params ? Number(params.id) : 0);

    const { user } = useAppSelector((state: RootState) => state.auth);
    const {
        currentChallenge: reduxChallenge,
        isCurrentLoading,
        currentError,
        testResults: reduxTestResults,
        isExecuting: reduxIsExecuting,
        systemError: reduxSystemError,
        competitiveTestResults,
        competitiveIsExecuting,
        competitiveSystemError,
        reviews,
        xpGained,
    } = useAppSelector((state: RootState) => state.challenges);

    const testResults = isCompetitive ? competitiveTestResults : reduxTestResults;
    const isExecuting = isCompetitive ? competitiveIsExecuting : reduxIsExecuting;
    const systemError = isCompetitive ? competitiveSystemError : reduxSystemError;

    const currentChallenge = useMemo(() => {
        const reduxIdMatch = reduxChallenge && Number(reduxChallenge.id) === challengeId;
        if (reduxIdMatch) return reduxChallenge;
        return manualChallenge;
    }, [reduxChallenge, manualChallenge, challengeId]);

    const [language, setLanguage] = useState<LanguageValue>('javascript');
    const [code, setCode] = useState('');
    const [logs, setLogs] = useState<TerminalLog[]>([]);
    const [attempts, setAttempts] = useState(0);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [activeTab, setActiveTab] = useState<'solutions' | 'reviews'>('solutions');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [xpToast, setXpToast] = useState<number | null>(null);

    const lastReportedAttempt = useRef<number>(0);
    const lastRunChallengeId = useRef<number>(0);
    const confettiShown = useRef<boolean>(false);

    useEffect(() => {
        lastReportedAttempt.current = 0;
        lastRunChallengeId.current = 0;
        confettiShown.current = false;
        setAttempts(0);
        setLogs([]);
        setTestCases([]);
        if (isCompetitive) dispatch(resetCompetitiveResults());
    }, [challengeId, dispatch, isCompetitive]);

    const isSolved = useMemo(() =>
            testResults.length > 0 && testResults.every(r => r.status === 'success'),
        [testResults]);

    const starterCode = useMemo(() => {
        if (!currentChallenge) return '';
        return generateStarterCode(
            language,
            currentChallenge.funcName,
            currentChallenge.parameters || []
        );
    }, [currentChallenge?.id, currentChallenge?.funcName, currentChallenge?.parameters, language]);

    useEffect(() => {
        if (challengeId) {
            dispatch(fetchChallengeById(challengeId));
        }
    }, [dispatch, challengeId]);

    useEffect(() => {
        if (!currentChallenge || Number(currentChallenge.id) !== challengeId) return;

        if (isCompetitive) {
            setCode(prev => {
                const isEditorEmpty = !prev || prev.trim() === '';
                const isStaleDefault = /function\s+\w+\s*\(\s*\)/.test(prev);
                return (isEditorEmpty || isStaleDefault) ? starterCode : prev;
            });
        } else {
            const storageKey = `challenge_${challengeId}_${language}_code`;
            const savedCode = localStorage.getItem(storageKey);
            setCode(savedCode || starterCode);
        }

        if (currentChallenge.testCases) {
            setTestCases(currentChallenge.testCases.map((tc: ChallengeTestCase) => ({
                id: String(tc.id),
                title: tc.title || `Тест ${tc.id}`,
                status: 'idle',
                expected: String(tc.expectedOutput),
                actual: undefined
            })));
        }
    }, [
        currentChallenge?.id,
        currentChallenge?.testCases,
        currentChallenge?.parameters,
        language,
        starterCode,
        challengeId,
        isCompetitive
    ]);

    useEffect(() => {
        if (isExecuting) return;

        if (systemError) {
            setTestCases(prev => prev.map(t => ({ ...t, status: 'fail', actual: systemError.message })));
        } else if (testResults.length > 0) {
            setTestCases(prev => prev.map(t => {
                const res = testResults.find(r => String(r.id) === t.id);
                return res
                    ? { ...t, status: res.status as any, actual: res.actual != null ? JSON.stringify(res.actual) : '—', duration: res.duration }
                    : t;
            }));

            if (isSolved && !isCompetitive && !confettiShown.current && attempts > 0) {
                confettiShown.current = true;
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                if (xpGained && xpGained > 0) {
                    dispatch(addExperience(xpGained));
                    setXpToast(xpGained);
                    setTimeout(() => setXpToast(null), 3000);
                }
            }

            const resultsAreForThisChallenge = lastRunChallengeId.current === challengeId;

            if (
                isCompetitive &&
                onBattleUpdate &&
                attempts > 0 &&
                resultsAreForThisChallenge &&
                lastReportedAttempt.current !== attempts
            ) {
                lastReportedAttempt.current = attempts;
                onBattleUpdate({
                    passedTests: testResults.filter(r => r.status === 'success').length,
                    totalTests: testResults.length,
                    isFinished: isSolved,
                    code
                });
            }
        }
    }, [testResults, systemError, isExecuting, isSolved, attempts, code, isCompetitive, onBattleUpdate]);

    const handleRunTests = () => {
        if (!currentChallenge || isExecuting) return;
        setTestCases(prev => prev.map(t => ({ ...t, status: 'running', actual: undefined })));

        lastRunChallengeId.current = challengeId;

        if (isCompetitive) {
            dispatch(runCompetitiveTests({ id: challengeId, code, language, userId: user?.id }));
        } else {
            dispatch(resetTestResults());
            dispatch(runChallengeTests({ id: challengeId, code, language, userId: user?.id }));
        }
        setAttempts(a => a + 1);
    };

    const hasDataReady = currentChallenge && Number(currentChallenge.id) === challengeId;

    if (!hasDataReady) {
        if (currentError) return <div className="error-screen">Задача не найдена</div>;
        return <div className="loading-screen">Синхронизация данных...</div>;
    }

    return (
        <section className="challenge-workspace">
            <div className="workspace-header">
                <div className="header-left">
                    <div className="title-row">
                        <span className="rank-badge">7</span>
                        <h1 className="task-title">{currentChallenge.name}</h1>
                    </div>
                    {!isCompetitive && (
                        <button
                            className="report-challenge-btn"
                            onClick={() => setReportModalOpen(true)}
                            title="Пожаловаться на задачу"
                        >
                            ⚑ Пожаловаться
                        </button>
                    )}
                </div>
                <div className="header-right">
                    <LanguageSelect
                        currentValue={language}
                        onChange={(l) => {
                            setLanguage(l.value);
                            setLogs([]);
                            if (isCompetitive) dispatch(resetCompetitiveResults());
                            else dispatch(resetTestResults());
                        }}
                    />
                </div>
            </div>

            <div className="workspace-main-grid">
                <div className="column-left">
                    <ChallengeInfo
                        name={currentChallenge.name}
                        description={currentChallenge.description}
                        topics={currentChallenge.topics}
                        sampleInput={currentChallenge.sampleInput}
                        sampleOutput={currentChallenge.sampleOutput}
                    />
                </div>
                <div className="column-right">
                    <div className="editor-container">
                        <CodeIdeWidget
                            key={`${challengeId}_${language}`}
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
                        <TestsPanel tests={testCases} />
                    </div>
                    <div className="action-bar">
                        <button
                            className={`challenge-submit-btn ${isExecuting ? 'loading' : ''}`}
                            onClick={handleRunTests}
                            disabled={isExecuting}
                        >
                            {isExecuting ? 'Выполняется...' : 'Отправить'}
                        </button>
                    </div>
                </div>
            </div>

            {!isCompetitive && (
                <AiAssistantChat
                    isSolved={isSolved}
                    attemptsCount={attempts}
                    challengeId={challengeId}
                    code={code}
                    language={language}
                    testResults={testResults}
                />
            )}

            {!isCompetitive && (
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
                            Решения сообщества {!isSolved && <span className="lock-inline"></span>}
                        </button>
                    </div>
                    <div className="tab-content">
                        {activeTab === 'solutions' ? (
                            isSolved
                                ? <CommunitySolutions />
                                : <LockedOverlay title="Решения заблокированы" description="Решите задачу успешно." />
                        ) : (
                            <ChallengeReviews />
                        )}
                    </div>
                </div>
            )}

            {xpToast && (
                <div className="xp-toast">
                    <span className="xp-toast-star">✦</span>
                    +{xpToast} XP
                </div>
            )}

            {reportModalOpen && user && (
                <ReportModal
                    challengeId={challengeId}
                    userId={user.id}
                    onClose={() => setReportModalOpen(false)}
                />
            )}
        </section>
    );
}
