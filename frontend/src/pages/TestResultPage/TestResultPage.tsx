'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/widgets/Header/Header';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { fetchAttemptResult, clearAttemptResult } from '@/shared/store/slice/testSlice';
import { AttemptAnswer, TestCaseResult } from '@/shared/services/TestApiService';
import './TestResultPage.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function gradeLabel(percent: number): { label: string; cls: string } {
    if (percent >= 90) return { label: 'Отлично',       cls: 'trp-grade--excellent' };
    if (percent >= 75) return { label: 'Хорошо',        cls: 'trp-grade--good'      };
    if (percent >= 50) return { label: 'Удовлетворительно', cls: 'trp-grade--ok'    };
    return                    { label: 'Неудовлетворительно', cls: 'trp-grade--fail' };
}

// ─── Answer detail per question type ─────────────────────────────────────────

function AnswerDetail({ ans, showCorrectAnswers }: { ans: AttemptAnswer; showCorrectAnswers: boolean }) {
    const typeName   = ans.question?.type?.name;
    const options    = ans.question?.options ?? [];
    const hideHints  = !showCorrectAnswers && ans.isCorrect === false;

    if (typeName === 'Информационный блок') {
        return <span className="trp-ans-note">Информационный блок</span>;
    }

    if (typeName === 'Множественный выбор' || typeName === 'Да / Нет') {
        const selIds = ans.selectedOptionIds ?? [];
        return (
            <div className="trp-ans-opts">
                {options.map(opt => {
                    const selected = selIds.includes(opt.id);
                    const correct  = opt.isCorrect;
                    const showMark = !hideHints || selected;
                    return (
                        <div
                            key={opt.id}
                            className={`trp-ans-opt${selected ? ' trp-ans-opt--selected' : ''}${!hideHints && correct ? ' trp-ans-opt--correct' : ''}`}
                        >
                            <span className="trp-ans-opt__mark">
                                {!hideHints && correct && selected ? '✓' : !hideHints && correct ? '○' : selected ? '✗' : '·'}
                            </span>
                            <span>{opt.text}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (typeName === 'Короткий ответ' || typeName === 'Числовой ответ') {
        const correct = options.filter(o => o.isCorrect).map(o => o.text);
        return (
            <div className="trp-ans-text-wrap">
                <div className="trp-ans-label">Ваш ответ:</div>
                <div className="trp-ans-text">{ans.answerText || <em>—</em>}</div>
                {!hideHints && correct.length > 0 && (
                    <>
                        <div className="trp-ans-label trp-ans-label--correct">Правильный ответ:</div>
                        <div className="trp-ans-text trp-ans-text--correct">{correct.join(' / ')}</div>
                    </>
                )}
            </div>
        );
    }

    if (typeName === 'Выполнение кода') {
        const tcResults: TestCaseResult[] | null = ans.testCaseResults ?? null;
        const hasResults = tcResults && tcResults.length > 0;
        const visibleResults = tcResults?.filter(tc => !tc.isHidden) ?? [];
        const hiddenCount    = (tcResults?.length ?? 0) - visibleResults.length;
        const passedVisible  = visibleResults.filter(tc => tc.passed).length;
        const passedHidden   = (tcResults?.filter(tc => tc.isHidden && tc.passed).length ?? 0);
        const totalPassed    = passedVisible + passedHidden;
        const totalCount     = tcResults?.length ?? 0;

        return (
            <div className="trp-ans-text-wrap">
                <div className="trp-ans-label">Ваш код:</div>
                <pre className="trp-ans-code">{ans.codeAnswer || '—'}</pre>
                {!hasResults && <div className="trp-ans-note">Проверяется вручную</div>}
                {hasResults && (
                    <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>
                            Тест-кейсы: <strong style={{ color: totalPassed === totalCount ? '#4ade80' : '#f87171' }}>{totalPassed}/{totalCount}</strong> пройдено
                            {hiddenCount > 0 && <span style={{ color: 'rgba(255,255,255,.3)', marginLeft: 8 }}>({hiddenCount} скрытых)</span>}
                        </div>
                        {visibleResults.map((tc, i) => (
                            <div key={i} style={{
                                background: tc.passed ? 'rgba(74,222,128,.08)' : 'rgba(248,113,113,.08)',
                                border: `1px solid ${tc.passed ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)'}`,
                                borderRadius: 6, padding: '8px 10px', marginBottom: 6, fontSize: 12,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: 'rgba(255,255,255,.4)' }}>Тест #{i + 1}</span>
                                    <span style={{ color: tc.passed ? '#4ade80' : '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {tc.timedOut ? '⏱ TLE' : tc.passed
                                            ? <><img src="/images/done.png" alt="done" style={{width:'14px',height:'14px'}} /> Пройден</>
                                            : <><img src="/images/fail.png" alt="fail" style={{width:'14px',height:'14px',transform:'scale(1.3)'}} /> Не пройден</>}
                                    </span>
                                </div>
                                {tc.input !== null && tc.input !== '' && (
                                    <div style={{ marginBottom: 4 }}>
                                        <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 10, marginBottom: 2 }}>Вход:</div>
                                        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,.7)', whiteSpace: 'pre-wrap' }}>{tc.input}</pre>
                                    </div>
                                )}
                                {!tc.passed && !tc.timedOut && !hideHints && (
                                    <>
                                        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 10, marginBottom: 2 }}>Ожидалось:</div>
                                                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: '#4ade80', whiteSpace: 'pre-wrap' }}>{tc.expectedOutput}</pre>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 10, marginBottom: 2 }}>Получено:</div>
                                                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: '#f87171', whiteSpace: 'pre-wrap' }}>{tc.actualOutput ?? '(нет вывода)'}</pre>
                                            </div>
                                        </div>
                                        {tc.error && <div style={{ marginTop: 4, fontSize: 11, color: '#fbbf24' }}>{tc.error}</div>}
                                    </>
                                )}
                            </div>
                        ))}
                        {hiddenCount > 0 && (
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', padding: '6px 10px', background: 'rgba(255,255,255,.03)', borderRadius: 6, marginTop: 2 }}>
                                + {hiddenCount} скрытых тест-кейса: {passedHidden}/{hiddenCount} пройдено
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (typeName === 'Заполни пропуск') {
        let blanks: Record<string, string> = {};
        try { blanks = JSON.parse(ans.answerText || '{}'); } catch {}
        const correctOpts = options.filter(o => o.isCorrect);
        return (
            <div className="trp-ans-cloze">
                {correctOpts.map(opt => {
                    const idx  = String(opt.blankIndex);
                    const user = blanks[idx] ?? '—';
                    const ok   = user.trim().toLowerCase() === opt.text.trim().toLowerCase();
                    return (
                        <div key={opt.id} className="trp-ans-cloze-row">
                            <span className="trp-ans-cloze-idx">[{idx}]</span>
                            <span className={`trp-ans-cloze-user${ok ? ' ok' : ' fail'}`}>{user}</span>
                            {!ok && !hideHints && <span className="trp-ans-cloze-correct">→ {opt.text}</span>}
                        </div>
                    );
                })}
            </div>
        );
    }

    if (typeName === 'Сопоставление') {
        const userPairs = ans.matchingAnswer ?? {};
        return (
            <div className="trp-ans-matching">
                {options.map(opt => {
                    const user = (userPairs[String(opt.id)] ?? '').trim();
                    const ok   = opt.isCorrect && user.toLowerCase() === (opt.matchPair ?? '').trim().toLowerCase();
                    return (
                        <div key={opt.id} className="trp-ans-matching-row">
                            <span className="trp-ans-matching-left">{opt.text}</span>
                            <span className={`trp-ans-matching-right${ok ? ' ok' : opt.isCorrect ? ' fail' : ''}`}>
                                {user || '—'}
                            </span>
                            {opt.isCorrect && !ok && opt.matchPair && !hideHints && (
                                <span className="trp-ans-correct-hint">→ {opt.matchPair}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TestResultPage() {
    const dispatch = useAppDispatch();
    const router   = useRouter();
    const params   = useParams();
    const id       = params?.id as string;
    const attemptId = Number(id);

    const { attemptResult, isLoading, error } = useAppSelector(s => s.test);

    useEffect(() => {
        dispatch(fetchAttemptResult(attemptId));
        return () => { dispatch(clearAttemptResult()); };
    }, [attemptId, dispatch]);

    if (isLoading || !attemptResult) {
        return (
            <div className="trp-layout">
                <Header />
                <main className="trp-main">
                    <div className="trp-state">
                        {isLoading ? <><div className="trp-spinner" /><span>Загрузка результатов...</span></> : (
                            <div className="trp-error">{error ?? 'Результат не найден'}</div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    const percent = attemptResult.maxScore > 0
        ? Math.round((attemptResult.score / attemptResult.maxScore) * 100)
        : 0;
    const { label: grLabel, cls: grCls } = gradeLabel(percent);
    const timedOut = attemptResult.status === 'timed_out';

    const answeredQuestions = attemptResult.answers ?? [];
    const autoGraded = answeredQuestions.filter(a => a.isCorrect !== null);
    const correct    = autoGraded.filter(a => a.isCorrect === true).length;
    const wrong      = autoGraded.filter(a => a.isCorrect === false).length;
    const manual     = answeredQuestions.filter(a => a.isCorrect === null).length;

    return (
        <div className="trp-layout">
            <Header />
            <main className="trp-main">
                <div className="trp-container">

                    <button className="trp-back-btn" onClick={() => router.push(`/tests/${attemptResult.test.id}/take`)}>
                        <img src="/images/left-arrow.png" alt="←" className="icon-back" style={{width:'14px',height:'14px'}} />К тесту
                    </button>

                    {/* Score card */}
                    <div className="trp-score-card">
                        {timedOut && (
                            <div className="trp-timed-out-banner">⏱ Время вышло — тест завершён автоматически</div>
                        )}
                        <div className="trp-score-card__title">{attemptResult.test.title}</div>
                        <div className="trp-score-card__main">
                            <div className={`trp-percent-ring ${grCls}`}>
                                <svg viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="trp-ring-bg"/>
                                    <circle
                                        cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                                        className="trp-ring-fill"
                                        strokeDasharray={`${2 * Math.PI * 42}`}
                                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - percent / 100)}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 50 50)"
                                    />
                                    <text x="50" y="46" textAnchor="middle" className="trp-ring-pct">{percent}%</text>
                                    <text x="50" y="62" textAnchor="middle" className="trp-ring-score">{attemptResult.score}/{attemptResult.maxScore}</text>
                                </svg>
                            </div>
                            <div className="trp-score-details">
                                <div className={`trp-grade ${grCls}`}>{grLabel}</div>
                                <div className="trp-score-meta-grid">
                                    <div className="trp-score-meta">
                                        <span className="trp-score-meta__val trp-score-meta__val--correct">{correct}</span>
                                        <span className="trp-score-meta__label"><img src="/images/done.png" alt="done" style={{width:'14px',height:'14px',verticalAlign:'middle',marginRight:3}} />верно</span>
                                    </div>
                                    <div className="trp-score-meta">
                                        <span className="trp-score-meta__val trp-score-meta__val--wrong">{wrong}</span>
                                        <span className="trp-score-meta__label"><img src="/images/fail.png" alt="fail" style={{width:'14px',height:'14px',verticalAlign:'middle',marginRight:3,transform:'scale(1.3)'}} />неверно</span>
                                    </div>
                                    {manual > 0 && (
                                        <div className="trp-score-meta">
                                            <span className="trp-score-meta__val trp-score-meta__val--manual">{manual}</span>
                                            <span className="trp-score-meta__label">вручную</span>
                                        </div>
                                    )}
                                </div>
                                <div className="trp-attempt-info">
                                    <span>Начат: {formatDate(attemptResult.startedAt)}</span>
                                    {attemptResult.finishedAt && <span>Завершён: {formatDate(attemptResult.finishedAt)}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Per-question breakdown */}
                    <div className="trp-section-label">Разбор ответов</div>
                    <div className="trp-answers">
                        {answeredQuestions.map((ans, i) => {
                            const isCorrect  = ans.isCorrect;
                            const isManual   = isCorrect === null;
                            const typeName   = ans.question?.type?.name;
                            const isInfoOnly = typeName === 'Информационный блок';

                            return (
                                <div
                                    key={ans.id}
                                    className={`trp-ans-card${isCorrect === true ? ' trp-ans-card--correct' : isCorrect === false ? ' trp-ans-card--wrong' : ''}`}
                                >
                                    <div className="trp-ans-card__header">
                                        <span className="trp-ans-card__num">{i + 1}</span>
                                        <div className="trp-ans-card__question">{ans.question?.text}</div>
                                        <div className="trp-ans-card__right">
                                            {isInfoOnly ? (
                                                <span className="trp-verdict trp-verdict--info">—</span>
                                            ) : isManual ? (
                                                <span className="trp-verdict trp-verdict--manual">Ожидает</span>
                                            ) : isCorrect ? (
                                                <span className="trp-verdict trp-verdict--correct"><img src="/images/done.png" alt="done" style={{width:'14px',height:'14px',verticalAlign:'middle'}} /> +{ans.pointsEarned}</span>
                                            ) : (
                                                <span className="trp-verdict trp-verdict--wrong"><img src="/images/fail.png" alt="fail" style={{width:'14px',height:'14px',verticalAlign:'middle',transform:'scale(1.3)'}} /> +{ans.pointsEarned}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="trp-ans-card__body">
                                        <AnswerDetail ans={ans} showCorrectAnswers={attemptResult.test.showCorrectAnswers ?? true} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="trp-footer-actions">
                        <button className="trp-btn trp-btn--ghost" onClick={() => router.push('/tests')}>
                            <img src="/images/left-arrow.png" alt="←" className="icon-back" style={{width:'14px',height:'14px'}} />Все тесты
                        </button>
                        <button
                            className="trp-btn trp-btn--primary"
                            onClick={() => router.push(`/tests/${attemptResult.test.id}/take`)}
                        >
                            Попробовать ещё раз
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
