'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import CodeEditor from '@/features/CodeEditor/CodeEditor';
import TerminalPanel from '@/features/TerminalPanel/TerminalPanel';
import { EditorValidation, EditorProblem, TerminalLog } from '@/shared/types/ide';
import { languages, LanguageValue } from '@/features/LanguageSelect/LanguageSelect';

import ChallengeService, { TestResult, SystemError } from '@/shared/services/ChallengeService';
import { formatChallengeCode } from '@/shared/store/slice/challengeSlice';

import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { RootState } from '@/shared/store/store';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import { formatCodeLocal } from "@/shared/utils/prettierFormatter";
import './CodeIdeWidget.css';

interface CodeIdeWidgetProps {
    language: LanguageValue;
    code: string;
    starterCode: string;
    onCodeChange: (val: string) => void;
    logs: TerminalLog[];
    onClearLogs: () => void;
    executionResults?: {
        testResults: TestResult[];
        systemError: SystemError | null;
        executionTimeMs?: number | null;
        isTimeLimitExceeded?: boolean;
        isExecuting?: boolean;
    };
}

export default function CodeIdeWidget({
                                          language,
                                          code,
                                          starterCode,
                                          onCodeChange,
                                          logs,
                                          onClearLogs,
                                          executionResults
                                      }: CodeIdeWidgetProps) {
    const dispatch = useAppDispatch();

    const { isFormatting, executionTimeMs, isTimeLimitExceeded, isExecuting } = useAppSelector((state: RootState) => state.challenges);

    const errorLine = (() => {
        const details = executionResults?.systemError?.details || '';
        if (!details) return undefined;
        const m = details.match(/code:(\d+):\d+:\s*(?:error|warning)/i)
            || details.match(/on line (\d+)/i)
            || details.match(/\[stdin\]:(\d+)/i)
            || details.match(/line (\d+)/i);
        const n = m ? parseInt(m[1]) : 0;
        return (n > 0 && n < 1000) ? n : undefined;
    })();

    const [validationStats, setValidationStats] = useState<EditorValidation>({
        errors: 0, warnings: 0, problems: []
    });

    const [isDiffMode, setIsDiffMode] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [animateDiff, setAnimateDiff] = useState(false);
    const [animateReset, setAnimateReset] = useState(false);

    const editorRef = useRef<any>(null);
    const currentLangInfo = languages.find(l => l.value === language) || languages[0];

    const handleToggleDiff = () => {
        setAnimateDiff(true);
        setIsDiffMode(!isDiffMode);
        setTimeout(() => setAnimateDiff(false), 500);
    };

    const handleConfirmReset = () => {
        setAnimateReset(true);
        onCodeChange(starterCode);
        setIsDiffMode(false);
        setIsResetModalOpen(false);
        setTimeout(() => setAnimateReset(false), 600);
    };

    const handleFormat = async () => {
        if (isFormatting || !code) return;
        const localResult = await formatCodeLocal(language, code);
        if (localResult) {
            onCodeChange(localResult);
            return;
        }
        try {
            const resultAction = await dispatch(formatChallengeCode({ code, language }));
            if (formatChallengeCode.fulfilled.match(resultAction)) {
                onCodeChange(resultAction.payload as string);
            }
        } catch (e) { console.error(e); }
    };

    const handleJumpToProblem = (problem: EditorProblem) => {
        if (isDiffMode) setIsDiffMode(false);
        setTimeout(() => {
            if (editorRef.current) {
                editorRef.current.setPosition({ lineNumber: problem.line, column: problem.column });
                editorRef.current.revealPositionInCenter({ lineNumber: problem.line, column: problem.column }, 0);
                editorRef.current.focus();
            }
        }, 50);
    };

    return (
        <div className="ide-wrapper">
            <ConfirmationModal
                isOpen={isResetModalOpen}
                title="Сбросить прогресс?"
                message="Весь ваш текущий код будет заменен на начальный шаблон. Это действие нельзя отменить."
                confirmText="Сбросить"
                onConfirm={handleConfirmReset}
                onClose={() => setIsResetModalOpen(false)}
                type="danger"
            />

            <div className="ide-header-main">
                <div className="ide-file-bar">
                    <div className="file-tab active">
                        <Image src={currentLangInfo.iconPath} alt="lang" width={16} height={16} />
                        <span>solution{currentLangInfo.extension}</span>
                    </div>

                    <div className="ide-actions-group">
                        <button
                            className={`ide-format-btn ${isFormatting ? 'spinning' : ''}`}
                            onClick={handleFormat}
                            disabled={isFormatting || isDiffMode}
                            title="Форматировать"
                        >
                            <Image src="/images/ide/pretier.png" alt="format" width={20} height={20} />
                        </button>

                        <button
                            className={`ide-format-btn ${isDiffMode ? 'active-diff' : ''} ${animateDiff ? 'icon-rotate' : ''}`}
                            onClick={handleToggleDiff}
                            title="Сравнить с шаблоном"
                        >
                            <Image src="/images/ide/diff.png" alt="diff" width={20} height={20} />
                        </button>

                        <button
                            className={`ide-format-btn ${animateReset ? 'icon-rotate' : ''}`}
                            onClick={() => setIsResetModalOpen(true)}
                            title="Сбросить код"
                        >
                            <Image src="/images/ide/reset.png" alt="reset" width={20} height={20} />
                        </button>

                    </div>
                </div>

                <div className="ide-status-bar">
                    {(isExecuting || executionTimeMs !== null) && (
                        <div className={`status-item timer ${isTimeLimitExceeded ? 'text-danger' : ''}`}>
                            <Image

                                key={isExecuting ? 'animating' : 'static'}
                                src={isExecuting
                                    ? `/images/ide/timer.gif`
                                    : "/images/ide/timer-static.png"
                                }
                                alt="timer"
                                width={18}
                                height={18}
                                style={{ marginRight: '4px' }}
                                unoptimized
                            />
                            <span>
                                {isExecuting ? 'Вычисляем ...' : `${executionTimeMs}ms`}
                            </span>
                        </div>
                    )}

                    <div className="status-item error">
                        <Image src="/images/ide/error.png" alt="error" width={16} height={16}/>
                        <span>{validationStats.errors}</span>
                    </div>
                    <div className="status-item warning">
                        <Image src="/images/ide/warning.png" alt="warning" width={16} height={16}/>
                        <span>{validationStats.warnings}</span>
                    </div>
                </div>
            </div>

            <div className="ide-editor-area">
                <CodeEditor
                    language={language}
                    code={code}
                    originalCode={starterCode}
                    isDiffMode={isDiffMode}
                    errorLine={errorLine}
                    onChange={(val: string | undefined) => onCodeChange(val || '')}
                    onValidate={setValidationStats}
                    editorRef={editorRef}
                />
            </div>

            <div className="ide-terminal-area">
                <TerminalPanel
                    logs={logs}
                    validationStats={validationStats}
                    executionResults={executionResults}
                    onProblemClick={handleJumpToProblem}
                />
            </div>
        </div>
    );
}
