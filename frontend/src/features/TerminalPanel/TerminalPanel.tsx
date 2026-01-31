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

            const lineMatch = details.match(/(?:line\s+|:)(\d+)/i);
            let lineNum = lineMatch ? parseInt(lineMatch[1]) : 1;

            if (err.userCodeLines && lineNum > err.userCodeLines) {
                lineNum = 1;
            }

            problems.push({
                id: `sys-err-${Date.now()}`,
                message: `[Runtime Error]: ${details.split('\n').pop() || err.message}`,
                line: lineNum,
                column: 1,
                severity: 'Error'
            });
        }

        logs.forEach((log) => {
            if (log.type === 'error') {
                const lineMatch = log.message.match(/(?:line\s+|:)(\d+)/i);
                const rawLine = lineMatch ? parseInt(lineMatch[1]) : 1;
                const finalLine = (executionResults?.systemError?.userCodeLines && rawLine > executionResults.systemError.userCodeLines)
                    ? 1
                    : rawLine;

                problems.push({
                    id: `log-err-${log.id}`,
                    message: log.message.split('\n').pop() || 'Error',
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
                            <div className="empty-state success">✓ No problems detected.</div>
                        ) : (
                            allProblems.map((prob) => {
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