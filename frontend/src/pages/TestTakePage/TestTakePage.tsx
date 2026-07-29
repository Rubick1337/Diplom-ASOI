'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    DndContext, DragOverlay,
    useDraggable, useDroppable,
    PointerSensor, useSensor, useSensors,
    type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/widgets/Header/Header';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchTest, startAttempt, submitAttempt,
    fetchMyAttempts, clearAttempt, clearCurrentTest,
} from '@/shared/store/slice/testSlice';
import { Question } from '@/shared/services/TestApiService';
import $api from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/apiEndpoints';
import ReportModal from '@/features/ReportModal/ReportModal';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import { TestReviews } from '@/features/TestReviews/TestReviews';
import { RootState } from '@/shared/store/store';
import './TestTakePage.css';

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9005/api').replace(/\/api$/, '');

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'loading' | 'preview' | 'taking' | 'submitting';

interface AnswerState {
    selectedOptionIds?: number[];
    answerText?:        string;
    codeAnswer?:        string;
    matchingAnswer?:    Record<string, string>;
}

interface StoredAttempt {
    attemptId:        number;
    startedAt:        string;
    timeLimitMinutes: number | null;
    maxScore:         number;
    questionIds?:     number[];
    shuffleOptions?:  boolean;
}

function shuffleArr<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const lsKey          = (id: number) => `gc_test_attempt_${id}`;
const saveAttempt    = (id: number, d: StoredAttempt) => { try { localStorage.setItem(lsKey(id), JSON.stringify(d)); } catch {} };
const loadAttempt    = (id: number): StoredAttempt | null => { try { const r = localStorage.getItem(lsKey(id)); return r ? JSON.parse(r) : null; } catch { return null; } };
const clearAttemptLS = (id: number) => { try { localStorage.removeItem(lsKey(id)); } catch {} };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const LETTERS    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LAUNCH_CMD = './start_test.sh';

function isAnswered(q: Question, a?: AnswerState): boolean {
    if (!a) return false;
    const t = q.type?.name;
    if (t === 'Информационный блок') return true;
    if (t === 'Выполнение кода')     return !!(a.codeAnswer?.trim());
    if (t === 'Короткий ответ' || t === 'Числовой ответ') return !!(a.answerText?.trim());
    if (t === 'Заполни пропуск') { try { return Object.values(JSON.parse(a.answerText || '{}')).some((v: any) => v?.trim()); } catch { return false; } }
    if (t === 'Сопоставление')   return Object.values(a.matchingAnswer ?? {}).some(v => v.trim());
    return (a.selectedOptionIds?.length ?? 0) > 0;
}

// ─── Cloze ───────────────────────────────────────────────────────────────────

function ClozeField({ text, blanks, onChange }: {
    text: string;
    blanks: Record<string, string>;
    onChange: (i: string, v: string) => void;
}) {
    const parts = text.split(/\[\[(\d+)\]\]/);
    return (
        <span className="ttp-cloze">
            {parts.map((p, i) => i % 2 === 1
                ? <input key={i} className="ttp-cloze__input" value={blanks[p] || ''} onChange={e => onChange(p, e.target.value)} placeholder={`[${p}]`} />
                : <span key={i}>{p}</span>
            )}
        </span>
    );
}

// ─── Matching area ────────────────────────────────────────────────────────────

function MatchingChip({ pair, isUsed }: { pair: string; isUsed: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `chip::${pair}`,
        data: { pair },
        disabled: isUsed,
    });
    return (
        <button
            ref={setNodeRef}
            disabled={isUsed}
            {...attributes}
            {...listeners}
            className={[
                'ttp-match-chip',
                isUsed     ? 'ttp-match-chip--used'     : '',
                isDragging ? 'ttp-match-chip--dragging'  : '',
            ].filter(Boolean).join(' ')}
        >
            {pair}
        </button>
    );
}

function MatchingSlot({ optId, text, idx, val, onClear }: {
    optId: string; text: string; idx: number; val: string; onClear: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `slot::${optId}`, disabled: !!val });
    return (
        <div className="ttp-match-row">
            <div className="ttp-match-idx">{idx + 1}</div>
            <div className="ttp-match-left">{text}</div>
            <div className="ttp-match-arr">→</div>
            <div
                ref={setNodeRef}
                className={[
                    'ttp-match-slot',
                    val            ? 'ttp-match-slot--filled'   : '',
                    isOver && !val ? 'ttp-match-slot--dragover'  : '',
                ].filter(Boolean).join(' ')}
            >
                {val ? (
                    <>
                        <span className="ttp-match-val">{val}</span>
                        <button className="ttp-match-clear" onClick={e => { e.stopPropagation(); onClear(); }}>×</button>
                    </>
                ) : (
                    <span className="ttp-match-ph">{isOver ? 'Отпустите здесь' : '—'}</span>
                )}
            </div>
        </div>
    );
}

function MatchingArea({ q, ans, onChange }: {
    q: Question;
    ans: AnswerState;
    onChange: (a: AnswerState) => void;
}) {
    const [activePair, setActivePair] = useState<string | null>(null);
    const [shuffled] = useState<string[]>(() =>
        [...q.options.map(o => o.matchPair!).filter(Boolean)].sort(() => Math.random() - 0.5)
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const assigned  = ans.matchingAnswer ?? {};
    const usedPairs = new Set(Object.values(assigned).filter(Boolean));

    const clearPair = (optId: string) => {
        const next = { ...assigned };
        delete next[optId];
        onChange({ ...ans, matchingAnswer: next });
    };

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActivePair(active.data.current?.pair ?? null);
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActivePair(null);
        if (!over) return;
        const pair  = active.data.current?.pair as string | undefined;
        const optId = String(over.id).replace('slot::', '');
        if (pair && !assigned[optId]) {
            onChange({ ...ans, matchingAnswer: { ...assigned, [optId]: pair } });
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="ttp-matching">
                <div className="ttp-matching__head">
                    <span /><span>Утверждение</span><span /><span>Ответ</span>
                </div>
                {q.options.map((opt, i) => (
                    <MatchingSlot
                        key={opt.id}
                        optId={String(opt.id)}
                        text={opt.text}
                        idx={i}
                        val={assigned[String(opt.id)] ?? ''}
                        onClear={() => clearPair(String(opt.id))}
                    />
                ))}
                <div className="ttp-match-chips">
                    <div className="ttp-match-chips__lbl">Варианты ответов:</div>
                    <div className="ttp-match-chips__list">
                        {shuffled.map(pair => (
                            <MatchingChip key={pair} pair={pair} isUsed={usedPairs.has(pair)} />
                        ))}
                    </div>
                </div>
            </div>
            <DragOverlay dropAnimation={null}>
                {activePair && (
                    <button className="ttp-match-chip ttp-match-chip--overlay">{activePair}</button>
                )}
            </DragOverlay>
        </DndContext>
    );
}

// ─── Code area ────────────────────────────────────────────────────────────────

interface PreviewResult {
    id:             number;
    input:          string | null;
    expectedOutput: string;
    actualOutput:   string | null;
    passed:         boolean;
    timedOut:       boolean;
    error:          string | null;
}

function CodeArea({ q, ans, onChange }: {
    q: Question;
    ans: AnswerState;
    onChange: (a: AnswerState) => void;
}) {
    const [running, setRunning]   = useState(false);
    const [results, setResults]   = useState<PreviewResult[] | null>(null);
    const [runErr,  setRunErr]    = useState<string | null>(null);

    const code = ans.codeAnswer ?? q.starterCode ?? '';

    const handleRun = async () => {
        if (running) return;
        setRunning(true);
        setResults(null);
        setRunErr(null);
        try {
            const { data } = await $api.post(API_ENDPOINTS.TESTS.RUN_CODE_PREVIEW, {
                code,
                language:   q.codeLanguage,
                questionId: q.id,
            });
            if (data.results?.length === 0) {
                setRunErr('Нет тест-кейсов для запуска');
            } else {
                setResults(data.results);
            }
        } catch (e: any) {
            setRunErr(e?.response?.data?.message ?? 'Ошибка запуска кода');
        } finally {
            setRunning(false);
        }
    };

    const passed = results?.filter(r => r.passed).length ?? 0;
    const total  = results?.length ?? 0;
    const allOk  = total > 0 && passed === total;

    return (
        <div className="ttp-field">
            {q.codeLanguage && <div className="ttp-code-badge">{q.codeLanguage.toUpperCase()}</div>}
            <textarea
                className="ttp-ta ttp-ta--code"
                placeholder={q.starterCode ?? '// код...'}
                value={code}
                onChange={e => onChange({ ...ans, codeAnswer: e.target.value })}
                spellCheck={false}
            />
            <div className="ttp-run-row">
                <button className="ttp-code-run" onClick={handleRun} disabled={running}>
                    {running
                        ? <><span className="ttp-spin" style={{ width: 12, height: 12, borderWidth: 2 }} />Выполняется…</>
                        : '▶  Запустить'}
                </button>
                {results !== null && (
                    <span className={`ttp-run-summary ${allOk ? 'ttp-run-summary--ok' : 'ttp-run-summary--fail'}`}>
                        {passed}/{total} тестов пройдено
                    </span>
                )}
            </div>
            {runErr && <pre className="ttp-code-out__err" style={{ borderRadius: 8, marginTop: 8 }}>{runErr}</pre>}
            {results && results.length > 0 && (
                <div className="ttp-tc-list">
                    {results.map((r, i) => (
                        <div key={r.id} className={`ttp-tc ${r.passed ? 'ttp-tc--pass' : 'ttp-tc--fail'}`}>
                            <div className="ttp-tc__head">
                                <span className="ttp-tc__num">Тест {i + 1}</span>
                                <span className="ttp-tc__badge">{r.timedOut ? '⏱ TLE' : r.passed ? '✓' : '✗'}</span>
                            </div>
                            {r.input != null && (
                                <div className="ttp-tc__row">
                                    <span className="ttp-tc__lbl">{q.funcName ? 'Аргументы' : 'Ввод'}</span>
                                    <code className="ttp-tc__val">{r.input}</code>
                                </div>
                            )}
                            <div className="ttp-tc__row">
                                <span className="ttp-tc__lbl">Ожидается</span>
                                <code className="ttp-tc__val">{r.expectedOutput}</code>
                            </div>
                            {!r.timedOut && !r.error && (
                                <div className="ttp-tc__row">
                                    <span className="ttp-tc__lbl">Получено</span>
                                    <code className={`ttp-tc__val ${r.passed ? '' : 'ttp-tc__val--wrong'}`}>{r.actualOutput ?? '(нет вывода)'}</code>
                                </div>
                            )}
                            {r.error && <pre className="ttp-tc__err">{r.error}</pre>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Per-type area components ─────────────────────────────────────────────────

interface AreaProps {
    q: Question;
    ans: AnswerState;
    onChange: (a: AnswerState) => void;
}

function DescriptionArea() {
    return (
        <div className="ttp-desc-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
            Информационный блок — ответ не требуется
        </div>
    );
}

function ChoiceArea({ q, ans, onChange }: AreaProps) {
    const multi = q.type?.name === 'Множественный выбор' && !!q.allowMultiple;
    const toggle = (id: number) => {
        if (multi) {
            const cur = ans.selectedOptionIds ?? [];
            onChange({ ...ans, selectedOptionIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
        } else {
            onChange({ ...ans, selectedOptionIds: [id] });
        }
    };
    return (
        <div className="ttp-opts">
            {multi && <div className="ttp-opts__hint">Выберите все верные варианты</div>}
            {q.options.map((opt, i) => {
                const sel = (ans.selectedOptionIds ?? []).includes(opt.id);
                return (
                    <button key={opt.id} className={`ttp-opt${sel ? ' ttp-opt--on' : ''}`} onClick={() => toggle(opt.id)}>
                        <span className={`ttp-opt__badge${sel ? ' ttp-opt__badge--on' : ''}`}>
                            {sel
                                ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                : LETTERS[i] ?? i + 1}
                        </span>
                        <span className="ttp-opt__txt">{opt.text}</span>
                    </button>
                );
            })}
        </div>
    );
}

function ShortAnswerArea({ q: _q, ans, onChange }: AreaProps) {
    return (
        <div className="ttp-field">
            <label className="ttp-field__lbl">Ваш ответ</label>
            <input className="ttp-inp" placeholder="Введите текстовый ответ..." value={ans.answerText ?? ''} onChange={e => onChange({ ...ans, answerText: e.target.value })} />
        </div>
    );
}

function NumericalArea({ q: _q, ans, onChange }: AreaProps) {
    return (
        <div className="ttp-field">
            <label className="ttp-field__lbl">Числовой ответ</label>
            <input className="ttp-inp" type="number" placeholder="0" value={ans.answerText ?? ''} onChange={e => onChange({ ...ans, answerText: e.target.value })} />
        </div>
    );
}


function ClozeArea({ q, ans, onChange }: AreaProps) {
    const blanks: Record<string, string> = (() => { try { return JSON.parse(ans.answerText || '{}'); } catch { return {}; } })();
    return (
        <div className="ttp-cloze-wrap">
            <ClozeField text={q.text} blanks={blanks} onChange={(i, v) => onChange({ ...ans, answerText: JSON.stringify({ ...blanks, [i]: v }) })} />
        </div>
    );
}

// ─── Registry ─────────────────────────────────────────────────────────────────

const AREA_MAP: Record<string, React.FC<AreaProps>> = {
    'Информационный блок': DescriptionArea,
    'Множественный выбор': ChoiceArea,
    'Да / Нет':            ChoiceArea,
    'Короткий ответ':      ShortAnswerArea,
    'Числовой ответ':      NumericalArea,
    'Выполнение кода':     CodeArea,
    'Заполни пропуск':     ClozeArea,
    'Сопоставление':       MatchingArea,
};

const TYPE_CSS_KEY: Record<string, string> = {
    'Выполнение кода':    'code',
    'Заполни пропуск':    'cloze',
    'Сопоставление':      'matching',
    'Да / Нет':           'truefalse',
    'Короткий ответ':     'shortanswer',
    'Числовой ответ':     'numerical',
    'Информационный блок':'description',
};

// ─── Answer area ──────────────────────────────────────────────────────────────

function AnswerArea({ q, ans, onChange }: AreaProps) {
    const Comp = AREA_MAP[q.type?.name ?? ''];
    return Comp ? <Comp q={q} ans={ans} onChange={onChange} /> : null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TestTakePage() {
    const dispatch = useAppDispatch();
    const router   = useRouter();
    const params   = useParams();
    const id       = params?.id as string;
    const testId   = Number(id);

    const { currentTest, attempt, myAttempts, isLoading, error } = useAppSelector(s => s.test);
    const { user } = useAppSelector((s: RootState) => s.auth);

    const [phase,            setPhase]            = useState<Phase>('loading');
    const [answers,          setAnswers]          = useState<Record<number, AnswerState>>({});
    const [idx,              setIdx]              = useState(0);
    const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
    const [secs,    setSecs]    = useState<number | null>(null);
    const [stored,  setStored]  = useState<StoredAttempt | null>(null);
    const [confirm,     setConfirm]     = useState(false);
    const [exitConfirm, setExitConfirm] = useState(false);

    const [histFilter,      setHistFilter]      = useState('all');
    const [histPage,        setHistPage]        = useState(1);
    const [typingPhase,     setTypingPhase]     = useState<'idle' | 'typing' | 'running'>('idle');
    const [typedChars,      setTypedChars]      = useState(0);
    const [reportModalOpen, setReportModalOpen] = useState(false);

    const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
    const submitting = useRef(false);

    // Mount
    useEffect(() => {
        dispatch(fetchTest(testId));
        dispatch(fetchMyAttempts(testId));
        return () => {
            dispatch(clearAttempt());
            dispatch(clearCurrentTest());
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [testId, dispatch]);

    const buildDisplayQuestions = useCallback((allQuestions: Question[], stored: StoredAttempt): Question[] => {
        let qs = allQuestions;
        if (stored.questionIds?.length) {
            const qMap = new Map(allQuestions.map(q => [q.id, q]));
            qs = stored.questionIds.map(id => qMap.get(id)).filter(Boolean) as Question[];
        }
        if (stored.shuffleOptions) {
            qs = qs.map(q => ({ ...q, options: shuffleArr(q.options ?? []) }));
        }
        return qs;
    }, []);

    // Test loaded → check localStorage
    useEffect(() => {
        if (!currentTest) return;
        const saved = loadAttempt(testId);
        if (saved) {
            if (saved.timeLimitMinutes) {
                const elapsed = (Date.now() - new Date(saved.startedAt).getTime()) / 1000 / 60;
                if (elapsed > saved.timeLimitMinutes) { clearAttemptLS(testId); setPhase('preview'); return; }
            }
            setDisplayQuestions(buildDisplayQuestions(currentTest.questions, saved));
            setStored(saved); setPhase('taking');
        } else {
            setPhase('preview');
        }
    }, [currentTest]);

    // New attempt started
    useEffect(() => {
        if (!attempt) return;
        const d: StoredAttempt = {
            attemptId:        attempt.attemptId,
            startedAt:        attempt.startedAt,
            timeLimitMinutes: attempt.timeLimitMinutes,
            maxScore:         attempt.maxScore,
            questionIds:      attempt.questionIds,
            shuffleOptions:   attempt.shuffleOptions,
        };
        saveAttempt(testId, d);
        setStored(d);
        if (currentTest) {
            const dq = buildDisplayQuestions(currentTest.questions, d);
            setDisplayQuestions(dq);
            const init: Record<number, AnswerState> = {};
            dq.forEach(q => { init[q.id] = {}; });
            setAnswers(init);
        }
        setIdx(0); setPhase('taking');
    }, [attempt]);

    // Timer
    useEffect(() => {
        if (phase !== 'taking' || !stored?.timeLimitMinutes) { setSecs(null); return; }
        const calc = () => Math.max(0, stored.timeLimitMinutes! * 60 - Math.floor((Date.now() - new Date(stored.startedAt).getTime()) / 1000));
        setSecs(calc());
        timerRef.current = setInterval(() => {
            const l = calc(); setSecs(l);
            if (l <= 0 && !submitting.current) { clearInterval(timerRef.current!); doSubmit(); }
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase, stored]);

    // Typing animation → launch
    useEffect(() => {
        if (typingPhase !== 'typing') return;
        if (typedChars < LAUNCH_CMD.length) {
            const t = setTimeout(() => setTypedChars(c => c + 1), 52);
            return () => clearTimeout(t);
        }
        const t = setTimeout(async () => {
            setTypingPhase('running');
            const result = await dispatch(startAttempt(testId));
            if (startAttempt.rejected.match(result)) {
                setTypingPhase('idle');
                setTypedChars(0);
            }
        }, 280);
        return () => clearTimeout(t);
    }, [typingPhase, typedChars, dispatch, testId]);

    const handleStart = useCallback(() => {
        if (typingPhase !== 'idle') return;
        setTypingPhase('typing');
        setTypedChars(0);
    }, [typingPhase]);

    const doSubmit = useCallback(async () => {
        if (!stored || !currentTest || submitting.current) return;
        submitting.current = true; setPhase('submitting'); setConfirm(false);
        if (timerRef.current) clearInterval(timerRef.current);
        const list = displayQuestions.map(q => ({ questionId: q.id, ...(answers[q.id] ?? {}) }));
        const res  = await dispatch(submitAttempt({ attemptId: stored.attemptId, answers: list }));
        clearAttemptLS(testId);
        if (submitAttempt.fulfilled.match(res)) router.push(`/tests/attempts/${stored.attemptId}/result`);
        else { submitting.current = false; setPhase('taking'); }
    }, [stored, currentTest, displayQuestions, answers, dispatch, router, testId]);

    const qs    = phase === 'taking' ? displayQuestions : (currentTest?.questions ?? []);
    const total = qs.length;
    const done  = qs.filter(q => isAnswered(q, answers[q.id])).length;
    const cur   = qs[idx] ?? null;
    const urgent = secs !== null && secs < 60;

    // ── Loading ────────────────────────────────────────────────────────────────
    if (phase === 'loading' || (isLoading && !currentTest)) return (
        <div className="ttp-shell">
            <Header />
            <div className="ttp-spinner-wrap"><div className="ttp-spin" /><span>Загружаем тест...</span></div>
        </div>
    );

    if (!currentTest) return (
        <div className="ttp-shell">
            <Header />
            <div className="ttp-spinner-wrap">
                <span className="ttp-err">{error ?? 'Тест не найден'}</span>
                <button className="ttp-pill-btn" onClick={() => router.push('/tests')}><img src="/images/left-arrow.png" alt="←" className="icon-back" style={{width:'14px',height:'14px'}} />К тестам</button>
            </div>
        </div>
    );

    // ── Preview ────────────────────────────────────────────────────────────────
    if (phase === 'preview') {
        const HIST_PAGE_SIZE = 5;
        const STATUS_LABELS: Record<string, string> = {
            completed: 'Завершён',
            timed_out: 'Время вышло',
            active:    'Активный',
        };
        const filteredAttempts = myAttempts.filter(a =>
            histFilter === 'all' || a.status === histFilter,
        );
        const totalHistPages = Math.ceil(filteredAttempts.length / HIST_PAGE_SIZE);
        const pagedAttempts  = filteredAttempts.slice(
            (histPage - 1) * HIST_PAGE_SIZE,
            histPage * HIST_PAGE_SIZE,
        );

        return (
            <div className="ttp-shell">
                <Header />
                <div className="ttp-preview-page">

                    <div className="ttp-nav-row">
                        <button className="ttp-crumb" onClick={() => router.push('/tests')}>
                            <span className="ttp-back-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                            Все тесты
                        </button>
                        {user && (
                            <button className="tpv-report-btn" onClick={() => setReportModalOpen(true)}>
                                ⚑ Пожаловаться на тест
                            </button>
                        )}
                    </div>

                    {/* ── Terminal window ───────────────────────────────── */}
                    <div className="tpv-term">
                        <div className="tpv-term__bar">
                            <div className="tpv-term__dots">
                                <span className="tpv-dot dot-r" />
                                <span className="tpv-dot dot-y" />
                                <span className="tpv-dot dot-g" />
                            </div>
                            <span className="tpv-term__tab">{currentTest.title} — bash</span>
                        </div>

                        <div className="tpv-term__body">
                            <div className="tpv-prompt">
                                <span className="tpv-path">~/tests</span>
                                <span className="tpv-sym"> $ </span>
                                <span className="tpv-cmd">cat info.txt</span>
                            </div>

                            <table className="tpv-table">
                                <tbody>
                                    <tr>
                                        <td className="tpv-key">title</td>
                                        <td className="tpv-val">"{currentTest.title}"</td>
                                    </tr>
                                    {currentTest.topic && (
                                        <tr>
                                            <td className="tpv-key">topic</td>
                                            <td className="tpv-val">{currentTest.topic.name}</td>
                                        </tr>
                                    )}
                                    {currentTest.difficulty != null && (
                                        <tr>
                                            <td className="tpv-key">difficulty</td>
                                            <td className="tpv-val">
                                                <span className="tpv-diffbar">
                                                    {Array.from({ length: 10 }, (_, i) => (
                                                        <span key={i} className={`tpv-diffseg${i < currentTest.difficulty! ? ' filled' : ''}`} />
                                                    ))}
                                                </span>
                                                {' '}{currentTest.difficulty}/10
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="tpv-key">questions</td>
                                        <td className="tpv-val">
                                            {currentTest.questionPoolSize
                                                ? <>{currentTest.questionPoolSize} <span className="tpv-dim">из {currentTest.questionCount} (случайно)</span></>
                                                : currentTest.questionCount}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="tpv-key">time_limit</td>
                                        <td className="tpv-val">
                                            {currentTest.timeLimitMinutes
                                                ? `${currentTest.timeLimitMinutes} min`
                                                : <span className="tpv-dim">unlimited</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="tpv-key">attempts</td>
                                        <td className="tpv-val">{myAttempts.length}</td>
                                    </tr>
                                    {currentTest.description && (
                                        <tr>
                                            <td className="tpv-key">desc</td>
                                            <td className="tpv-val tpv-val--desc">"{currentTest.description}"</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <div className="tpv-prompt tpv-prompt--gap">
                                <span className="tpv-path">~/tests</span>
                                <span className="tpv-sym"> $ </span>
                                {typingPhase === 'idle' ? (
                                    <span className="tpv-cursor">_</span>
                                ) : (
                                    <>
                                        <span className="tpv-cmd">{LAUNCH_CMD.slice(0, typedChars)}</span>
                                        {typingPhase === 'typing' && <span className="tpv-cursor">_</span>}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="tpv-term__footer">
                            {currentTest.timeLimitMinutes && (
                                <div className="tpv-warn">
                                    ⏱ Таймер запускается на сервере — обновление страницы не остановит его.
                                </div>
                            )}
                            {error && <div className="tpv-err">{error}</div>}
                            <button
                                className="tpv-start"
                                onClick={handleStart}
                                disabled={typingPhase !== 'idle' || isLoading}
                            >
                                {typingPhase === 'running' || isLoading
                                    ? <><span className="tpv-spin" />Запуск…</>
                                    : 'Начать тест'}
                            </button>
                        </div>
                    </div>

                    {/* ── History ───────────────────────────────────────── */}
                    <div className="tpv-hist">
                        <div className="tpv-hist__head">
                            <h2 className="tpv-hist__title">История попыток</h2>
                            <div className="tpv-hist__filters">
                                {(['all', 'completed', 'timed_out'] as const).map(s => (
                                    <button
                                        key={s}
                                        className={`tpv-hist__filter${histFilter === s ? ' active' : ''}`}
                                        onClick={() => { setHistFilter(s); setHistPage(1); }}
                                    >
                                        {s === 'all' ? 'Все' : s === 'completed' ? 'Завершён' : 'Время вышло'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredAttempts.length === 0 ? (
                            <div className="tpv-hist__empty">
                                {myAttempts.length === 0
                                    ? 'Попыток ещё нет — начните первую.'
                                    : 'Нет попыток с таким статусом.'}
                            </div>
                        ) : (
                            <>
                                <div className="tpv-hist__list">
                                    {pagedAttempts.map(a => (
                                        <div key={a.id} className="tpv-hist__row">
                                            <span className={`ttp-badge ttp-badge--${a.status}`}>
                                                {STATUS_LABELS[a.status] ?? a.status}
                                            </span>
                                            <span className="tpv-hist__date">{fmtDate(a.startedAt)}</span>
                                            {a.status !== 'active' && a.score !== null && (
                                                <span className="tpv-hist__score">
                                                    {a.score}<span className="tpv-hist__max">/{a.maxScore}</span>
                                                </span>
                                            )}
                                            {a.status !== 'active' && (
                                                <button
                                                    className="tpv-hist__link"
                                                    onClick={() => router.push(`/tests/attempts/${a.id}/result`)}
                                                >
                                                    Результат →
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {totalHistPages > 1 && (
                                    <div className="tpv-hist__paging">
                                        {Array.from({ length: totalHistPages }, (_, i) => i + 1).map(p => (
                                            <button
                                                key={p}
                                                className={`tpv-hist__pg${histPage === p ? ' active' : ''}`}
                                                onClick={() => setHistPage(p)}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>

                <TestReviews testId={testId} />

                {reportModalOpen && user && (
                    <ReportModal
                        testId={testId}
                        userId={user.id}
                        onClose={() => setReportModalOpen(false)}
                    />
                )}

            </div>
        );
    }

    // ── Taking ─────────────────────────────────────────────────────────────────
    return (
        <div className="ttp-shell">
            <Header />

            <div className="ttp-body">

                {/* ── Left panel ───────────────────────────────────────────── */}
                <aside className="ttp-left">
                    <button className="ttp-left__back" onClick={() => setExitConfirm(true)}>
                        <span className="ttp-back-icon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </span>
                        К тестам
                    </button>
                    <div className="ttp-left__head">
                        <div className="ttp-left__name">{currentTest.title}</div>
                        <div className="ttp-left__progress-bar">
                            <div
                                className="ttp-left__progress-fill"
                                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                            />
                        </div>
                        <div className="ttp-left__done-row">
                            <span className="ttp-left__done-count">{done} / {total}</span>
                            <span className="ttp-left__done-label">отвечено</span>
                        </div>
                    </div>

                    <div className="ttp-left__section-lbl">Навигация</div>
                    <div className="ttp-nav-grid">
                        {qs.map((q, i) => {
                            const answered = isAnswered(q, answers[q.id]);
                            const current  = i === idx;
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setIdx(i)}
                                    className={`ttp-nav-cell${current ? ' current' : answered ? ' answered' : ''}`}
                                    title={`Вопрос ${i + 1}`}
                                >
                                    {answered && !current
                                        ? <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        : i + 1}
                                </button>
                            );
                        })}
                    </div>

                    <div className="ttp-legend">
                        <div className="ttp-legend__row"><span className="ttp-legend__dot ttp-legend__dot--current"/><span>Текущий</span></div>
                        <div className="ttp-legend__row"><span className="ttp-legend__dot ttp-legend__dot--answered"/><span>Отвечен</span></div>
                        <div className="ttp-legend__row"><span className="ttp-legend__dot"/><span>Без ответа</span></div>
                    </div>

                    <div className="ttp-left__bottom">
                        {secs !== null && (
                            <div className={`ttp-left__timer${urgent ? ' ttp-left__timer--red' : ''}`}>
                                <img src="/images/clock.png" alt="clock" className="icon-clock" style={{width:'14px',height:'14px',flexShrink:0,verticalAlign:'middle'}} />
                                {fmtTime(secs)}
                            </div>
                        )}
                        <button className="ttp-left__submit" onClick={() => setConfirm(true)} disabled={phase === 'submitting'}>
                            {phase === 'submitting' ? 'Отправка...' : 'Завершить тест'}
                        </button>
                    </div>
                </aside>

                {/* ── Right panel ──────────────────────────────────────────── */}
                <div className="ttp-right">
                    {cur ? (
                        <div className="qc-card">
                            <div className="qc-term-bar">
                                <div className="qc-term-dots">
                                    <span className="qc-term-dot dot-r" />
                                    <span className="qc-term-dot dot-y" />
                                    <span className="qc-term-dot dot-g" />
                                </div>
                                <span className="qc-term-title">{currentTest.title}</span>
                                <span className="qc-term-hint">bash — 80×24</span>
                            </div>

                            <div className="qc-header">
                                <div className="qc-header__left">
                                    <span className="qc-num">{String(idx + 1).padStart(2, '0')}</span>
                                    <span className={`qc-type qc-type--${TYPE_CSS_KEY[cur.type?.name ?? ''] ?? 'default'}`}>
                                        {cur.type?.name === 'Множественный выбор'
                                            ? (cur.allowMultiple ? 'Множественный выбор' : 'Одиночный выбор')
                                            : cur.type?.name}
                                    </span>
                                </div>
                                <div className="qc-header__right">
                                    {isAnswered(cur, answers[cur.id]) && (
                                        <span className="qc-answered-chip">
                                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                                <path d="M3 8.5l3 3L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Отвечено
                                        </span>
                                    )}
                                    <span className="qc-pts">
                                        {cur.points} {cur.points === 1 ? 'балл' : cur.points < 5 ? 'балла' : 'баллов'}
                                    </span>
                                </div>
                            </div>

                            <div className="qc-body">
                                {cur.type?.name !== 'Заполни пропуск' && (
                                    <div className="qc-question-line">
                                        <span className="qc-question-label">Вопрос:</span>
                                        <p className="qc-text">{cur.text}</p>
                                        {cur.imageUrl && (
                                            <img
                                                src={`${BACKEND_BASE}${cur.imageUrl}`}
                                                alt="Изображение к вопросу"
                                                className="qc-question-img"
                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        )}
                                    </div>
                                )}
                                <div className="qc-answer">
                                    <AnswerArea
                                        q={cur}
                                        ans={answers[cur.id] ?? {}}
                                        onChange={a => setAnswers(p => ({ ...p, [cur.id]: a }))}
                                    />
                                </div>
                            </div>

                            <div className="qc-footer">
                                <button
                                    className="qc-btn qc-btn--ghost"
                                    onClick={() => setIdx(i => Math.max(0, i - 1))}
                                    disabled={idx === 0}
                                >
                                    <img src="/images/left-arrow.png" alt="←" className="icon-back" style={{width:'14px',height:'14px'}} />Назад
                                </button>
                                <span className="qc-footer__pos">
                                    {idx + 1}<span> / {total}</span>
                                </span>
                                {idx === total - 1 ? (
                                    <button
                                        className="qc-btn qc-btn--finish"
                                        onClick={() => setConfirm(true)}
                                        disabled={phase === 'submitting'}
                                    >
                                        Завершить тест
                                    </button>
                                ) : (
                                    <button
                                        className="qc-btn qc-btn--next"
                                        onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
                                    >
                                        Далее <img src="/images/right-arrow.png" alt="→" className="icon-back" style={{width:'14px',height:'14px'}} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="ttp-qcard__empty">Нет вопросов</div>
                    )}
                </div>
            </div>

            {/* ── Exit confirm modal ───────────────────────────────────────── */}
            <ConfirmationModal
                isOpen={exitConfirm}
                type="warning"
                title="Выйти из теста?"
                message={`Текущий тест будет завершён и сдан с вашими ответами. Отвечено ${done} из ${total}.${done < total ? ` Есть ${total - done} вопрос(а) без ответа.` : ''}`}
                confirmText="Завершить и выйти"
                cancelText="Продолжить тест"
                onConfirm={doSubmit}
                onClose={() => setExitConfirm(false)}
            />

            {/* ── Confirm modal ────────────────────────────────────────────── */}
            {confirm && (
                <div className="ttp-overlay" onClick={() => setConfirm(false)}>
                    <div className="ttp-modal" onClick={e => e.stopPropagation()}>
                        <div className="ttp-modal__emoji">🏁</div>
                        <h3 className="ttp-modal__title">Завершить тест?</h3>
                        <p className="ttp-modal__body">
                            Отвечено <b>{done}</b> из <b>{total}</b>.
                            {done < total && <span className="ttp-modal__warn"><br />Есть {total - done} вопрос(а) без ответа.</span>}
                        </p>
                        <div className="ttp-modal__row">
                            <button className="ttp-modal__cancel" onClick={() => setConfirm(false)}>Продолжить</button>
                            <button className="ttp-modal__ok" onClick={doSubmit}>Сдать тест</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
