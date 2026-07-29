'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TerminalLog, EditorValidation, EditorProblem } from '@/shared/types/ide';
import './TerminalPanel.css';
import Image from "next/image";

interface TerminalPanelProps {
    logs: TerminalLog[];
    validationStats: EditorValidation;
    executionResults?: {
        testResults: any[];
        systemError: any | null;
    };
    onProblemClick: (problem: EditorProblem) => void;
}

export default function TerminalPanel({
                                          logs,
                                          validationStats,
                                          executionResults,
                                          onProblemClick
                                      }: TerminalPanelProps) {
    const [activeTab, setActiveTab] = useState<'terminal' | 'problems'>('terminal');
    const scrollRef = useRef<HTMLDivElement>(null);

    const allProblems = useMemo(() => {
        const problems: EditorProblem[] = [...(validationStats?.problems || [])];

        if (executionResults?.systemError) {
            const err = executionResults.systemError;
            const details: string = err.details || '';

            let lineNum = 1;
            let colNum = 1;
            let msgLine: string;

            if (err.errorLine) {
                lineNum = err.errorLine;
                colNum = err.errorCol || 1;
                msgLine = details
                    .split('\n')
                    .map((l: string) => l.trim())
                    .find((l: string) =>
                        l.length > 0 &&
                        !l.startsWith('File "') &&
                        !l.startsWith('Traceback')
                    ) || err.message;
            } else {
                const compilerErrMatch =
                    details.match(/code:(\d+):(\d+):\s*(?:error|warning):\s*(.+)/i) ||
                    details.match(/code\((\d+),(\d+)\):\s*(?:error|warning)\s+\w+:\s*(.+)/i);

                const phpLineMatch = !compilerErrMatch && details.match(/on line (\d+)/i);
                const nodeLineMatch = !compilerErrMatch && !phpLineMatch && details.match(/\[stdin\]:(\d+)/i);
                const pyLineMatch = !compilerErrMatch && !phpLineMatch && !nodeLineMatch &&
                    details.match(/line (\d+)/i);

                if (compilerErrMatch) {
                    lineNum = parseInt(compilerErrMatch[1]);
                    colNum = parseInt(compilerErrMatch[2]);
                    msgLine = compilerErrMatch[3].trim();
                    if (err.userCodeLines && lineNum > err.userCodeLines + 50) lineNum = 1;
                } else {
                    const m = phpLineMatch || nodeLineMatch || pyLineMatch;
                    lineNum = m ? parseInt(m[1]) : 1;
                    if (err.userCodeLines && lineNum > err.userCodeLines) lineNum = 1;
                    msgLine = details
                        .split('\n')
                        .map((l: string) => l.trim())
                        .find((l: string) =>
                            l.length > 0 &&
                            !l.startsWith('at ') &&
                            !l.startsWith('File "') &&
                            !l.startsWith('Traceback') &&
                            !l.startsWith('#') &&
                            !/^code:\s*In (function|method)/i.test(l)
                        ) || err.message;
                }
            }

            if (lineNum <= 0) lineNum = 1;

            problems.push({
                id: `sys-err-${Date.now()}`,
                message: msgLine,
                line: lineNum,
                column: colNum,
                severity: 'Error',
                details
            } as any);
        }

        logs.forEach((log) => {
            if (log.type === 'error') {
                const lineMatch = log.message.match(/(?:line\s+|:\s*|\[stdin\]:|\()(\d+)/i);
                const rawLine = lineMatch ? parseInt(lineMatch[1]) : 1;
                const finalLine = (executionResults?.systemError?.userCodeLines && rawLine > executionResults.systemError.userCodeLines)
                    ? 1
                    : rawLine;

                problems.push({
                    id: `log-err-${log.id}`,
                    message: log.message.split('\n').find(l => l.trim()) || 'Error',
                    line: finalLine,
                    column: 1,
                    severity: 'Error'
                });
            }
        });

        return problems;
    }, [validationStats, executionResults, logs]);

    const severityMap = {
        Error: { icon: '/images/ide/error.png', className: 'error' },
        Warning: { icon: '/images/ide/warning.png', className: 'warning' }
    };

    useEffect(() => {
        if (scrollRef.current && activeTab === 'terminal') {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, activeTab]);

    useEffect(() => {
        if (executionResults?.systemError || logs.some(l => l.type === 'error')) {
            setActiveTab('problems');
        }
    }, [executionResults?.systemError, logs]);

    return (
        <div className="terminal-panel">
            <div className="terminal-tabs-header">
                <button
                    className={`term-tab ${activeTab === 'terminal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('terminal')}
                >
                    <Image src="/images/ide/terminal.png" alt="T" width={14} height={14} unoptimized />
                    <span>TERMINAL</span>
                </button>
                <button
                    className={`term-tab ${activeTab === 'problems' ? 'active' : ''}`}
                    onClick={() => setActiveTab('problems')}
                >
                    <Image src="/images/ide/warning-console.png" alt="P" width={14} height={14} unoptimized />
                    <span>PROBLEMS</span>
                    {allProblems.length > 0 && <span className="problems-badge">{allProblems.length}</span>}
                </button>
            </div>

            <div className="terminal-body" ref={scrollRef}>
                {activeTab === 'terminal' ? (
                    <div className="logs-list">
                        {logs.length === 0 ? (
                            <div className="empty-state-terminal">Ready to code.</div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className={`log-entry ${log.type}`}>
                                    <span className="log-time">[{log.timestamp}]</span>
                                    <pre className="log-message">{String(log.message)}</pre>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="problems-view">
                        {allProblems.length === 0 ? (
                            <div className="empty-state success">No problems detected.</div>
                        ) : (
                            allProblems.map((prob: any) => {
                                const config = severityMap[prob.severity as keyof typeof severityMap] || severityMap.Error;
                                return (
                                    <div
                                        key={prob.id}
                                        className={`problem-item ${config.className}`}
                                        onClick={() => onProblemClick(prob)}
                                    >
                                        <div className="prob-icon-wrapper">
                                            <Image src={config.icon} alt="ico" width={16} height={16} unoptimized />
                                        </div>
                                        <div className="prob-content">
                                            <span className="prob-msg">{prob.message}</span>
                                            <span className="prob-location">Line {prob.line}, Col {prob.column}</span>
                                            {prob.details && prob.details !== prob.message && (
                                                <pre className="prob-details">{prob.details}</pre>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
