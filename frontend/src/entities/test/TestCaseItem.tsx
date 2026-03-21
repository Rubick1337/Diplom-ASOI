'use client';

import React from 'react';
import Image from 'next/image';
import './TestCaseItem.css';
import { TestCase } from '@/shared/types/ide';

function renderDiff(expected: string, actual: string) {

    const tokenize = (s: string) => s.match(/\[|\]|\{|\}|"[^"]*"|[^,\[\]{}\s]+|,|\s+/g) || [s];
    const expTokens = tokenize(expected);
    const actTokens = tokenize(actual);
    const maxLen = Math.max(expTokens.length, actTokens.length);
    return Array.from({ length: maxLen }, (_, i) => {
        const e = expTokens[i] ?? '';
        const a = actTokens[i] ?? '';
        const same = e === a;
        return (
            <span key={i} className={same ? 'diff-same' : 'diff-wrong'}>
                {a || <span className="diff-missing">∅</span>}
            </span>
        );
    });
}

interface TestCaseItemProps {
    test: TestCase;
    isExpanded: boolean;
}

const statusAssets = {
    success: '/images/tests/succes.png',
    fail: '/images/tests/fail.png',
    error: '/images/tests/fail.png',
    tle: '/images/tests/fail.png',
    idle: '/images/tests/idle.png',
};

export const TestCaseItem = ({ test, isExpanded }: TestCaseItemProps) => {
    const hasResult = test.status !== 'idle' && test.status !== 'running';

    const renderStatusIcon = () => {
        if (test.status === 'running') {
            return <div className="spinner" />;
        }

        const iconPath = statusAssets[test.status as keyof typeof statusAssets] || statusAssets.idle;

        return (
            <Image
                src={iconPath}
                alt={test.status}
                width={18}
                height={18}
            />
        );
    };

    return (
        <div className={`test-case-item ${test.status} ${isExpanded ? 'expanded' : ''}`}>
            <div className="test-case-header">
                <div className="test-status-icon">
                    {renderStatusIcon()}
                </div>

                <span className="test-title">{test.title}</span>

                <div className="header-right">
                    {test.duration !== undefined && (
                        <span className="test-duration">{test.duration}ms</span>
                    )}
                    <span className={`arrow-icon ${isExpanded ? 'up' : 'down'}`}>▾</span>
                </div>
            </div>

            <div className="test-case-content">
                <div className="test-case-details">
                    <div className="detail-row">
                        <span className="label">Expected:</span>
                        <code className="value-box">{String(test.expected)}</code>
                    </div>

                    {test.status === 'tle' && (
                        <div className="detail-row">
                            <span className="label">Result:</span>
                            <code className="value-box tle-text">⏱ Time Limit Exceeded</code>
                        </div>
                    )}

                    {test.status === 'error' && (
                        <div className="detail-row">
                            <span className="label">Error:</span>
                            <code className="value-box runtime-error-text">{String(test.actual)}</code>
                        </div>
                    )}

                    {(test.status === 'success' || test.status === 'fail') && hasResult && (
                        <div className="detail-row">
                            <span className="label">Actual:</span>
                            <code className={`value-box ${test.status === 'fail' ? 'error-text' : 'success-text'}`}>
                                {String(test.actual)}
                            </code>
                        </div>
                    )}

                    {test.status === 'fail' && test.actual !== undefined && test.actual !== test.expected && (
                        <div className="detail-row">
                            <span className="label">Diff:</span>
                            <code className="value-box diff-box">
                                {renderDiff(String(test.expected), String(test.actual))}
                            </code>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
