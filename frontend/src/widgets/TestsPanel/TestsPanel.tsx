'use client';
import React, { useState, useEffect } from 'react';
import { TestCase } from '@/shared/types/ide';
import { TestCaseItem } from '@/entities/test/TestCaseItem';
import './TestsPanel.css';

export default function TestsPanel({ tests }: { tests: TestCase[] }) {
    const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

    const total = tests.length;
    const passed = tests.filter(t => t.status === 'success').length;
    const failed = tests.filter(t => t.status === 'fail').length;
    const isRunning = tests.some(t => t.status === 'running');

    useEffect(() => {
        if (isRunning && tests.length > 0 && !expandedTestId) {
            setExpandedTestId(tests[0].id);
        }
    }, [isRunning, tests, expandedTestId]);

    useEffect(() => {
        const firstFailed = tests.find(t => t.status === 'fail');
        if (firstFailed) {
            setExpandedTestId(firstFailed.id);
        }
    }, [failed]);

    const progressPercent = total > 0 ? (passed / total) * 100 : 0;

    const toggleExpand = (id: string) => {
        setExpandedTestId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="tests-panel-widget">
            <div className="tests-header-ui">
                <div className="tests-stats-info">
                    <div className="stats-left">
                        <span className="label">TEST RESULTS</span>
                        {isRunning && <span className="running-tag">Running...</span>}
                    </div>
                    <div className="stats-right">
                        <span className={`count ${failed > 0 ? 'has-errors' : ''}`}>
                            {passed} / {total} Passed
                        </span>
                    </div>
                </div>

                <div className="progress-track">
                    <div
                        className={`progress-fill ${failed > 0 ? 'warning' : 'success-fill'} ${isRunning ? 'animating' : ''}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="tests-scroll-container">
                {tests.length > 0 ? (
                    tests.map(test => (
                        <div
                            key={test.id}
                            className="test-item-click-area"
                            onClick={() => toggleExpand(test.id)}
                        >
                            <TestCaseItem
                                test={test}
                                isExpanded={expandedTestId === test.id}
                            />
                        </div>
                    ))
                ) : (
                    <div className="tests-empty-state">
                        Нажмите «Отправить», чтобы проверить решение
                    </div>
                )}
            </div>
        </div>
    );
}
