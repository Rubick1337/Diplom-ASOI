'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import $api from '@/http/apiClient';
import { API_ENDPOINTS } from '@/http/apiEndpoints';
import Editor from '@monaco-editor/react';
import {
    Settings, FileText, FlaskConical, Code2,
    Plus, Trash2, Play, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, AlertTriangle, UserCheck, UserX, Send,
} from 'lucide-react';
import ChallengeService, { ExecuteResponse, Topic } from '@/shared/services/ChallengeService';
import { useAppSelector } from '@/shared/store/hooks';
import Header from '@/widgets/Header/Header';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import CustomSelect from '@/shared/components/CustomSelect/CustomSelect';
import LanguageSelect, { LanguageValue } from '@/features/LanguageSelect/LanguageSelect';
import '@/features/ChallengeFilters/ChallengeFilters.css';
import '@/pages/CreateChallengePage/CreateChallenge.css';

const DIFFICULTY_LEVELS = [1,2,3,4,5,6,7,8,9,10];
const INIT_PARAMS: any[] = [];

function getDiffColor(n: number) {
    if (n <= 3) return '#4ade80';
    if (n <= 7) return '#fbbf24';
    return '#f87171';
}

const ALL_PARAM_TYPES = ['int', 'float', 'string', 'bool', 'array', 'array2d', 'object'] as const;
type ParamDataType = typeof ALL_PARAM_TYPES[number];

const PARAM_TYPE_ABSTRACT: Record<ParamDataType, string> = {
    int:    'Integer',
    float:  'Decimal',
    string: 'String',
    bool:   'Boolean',
    array:  'Array',
    array2d:'Matrix 2D',
    object: 'Object',
};

const PARAM_TYPE_HINTS: Record<ParamDataType, string> = {
    int:    '42',
    float:  '3.14',
    string: '"hello"',
    bool:   'true',
    array:  '[1, 2, 3]',
    array2d:'[[1,2],[3,4]]',
    object: '{"key": "val"}',
};

const PARAM_TYPE_LABELS: Record<LanguageValue, Record<ParamDataType, string>> = {
    javascript:   { int: 'Number',  float: 'Number', string: 'String', bool: 'Boolean', array: 'Array',      array2d: 'Array 2D', object: 'Object'  },
    typescript:   { int: 'number',  float: 'number', string: 'string', bool: 'boolean', array: 'any[]',      array2d: 'any[][]',  object: 'any'     },
    python:       { int: 'int',     float: 'float',  string: 'str',    bool: 'bool',    array: 'list',       array2d: 'list[]',   object: 'dict'    },
    cpp:          { int: 'int',     float: 'double', string: 'string', bool: 'bool',    array: 'vector<int>',array2d: 'vec<vec>', object: 'auto'    },
    csharp:       { int: 'int',     float: 'double', string: 'string', bool: 'bool',    array: 'int[]',      array2d: 'int[][]',  object: 'object'  },
    php:          { int: 'int',     float: 'float',  string: 'string', bool: 'bool',    array: 'array',      array2d: 'array[]',  object: 'array'   },
    coffeescript: { int: 'Number',  float: 'Number', string: 'String', bool: 'Boolean', array: 'Array',      array2d: 'Array 2D', object: 'Object'  },
};

function toTsType(t: string)  { return t === 'int' || t === 'float' ? 'number' : t === 'string' ? 'string' : t === 'bool' ? 'boolean' : t === 'array' ? 'any[]' : t === 'array2d' ? 'any[][]' : 'any'; }
function toCppType(t: string) { return t === 'float' ? 'double' : t === 'string' ? 'std::string' : t === 'bool' ? 'bool' : t === 'array' ? 'std::vector<int>' : t === 'array2d' ? 'std::vector<std::vector<int>>' : t === 'object' ? 'auto' : 'int'; }
function toCsType(t: string)  { return t === 'float' ? 'double' : t === 'string' ? 'string' : t === 'bool' ? 'bool' : t === 'array' ? 'int[]' : t === 'array2d' ? 'int[][]' : t === 'object' ? 'object' : 'int'; }

function generateStarterCode(language: LanguageValue, funcName: string, params: any[]): string {
    const pArray = params || [];
    const paramNames = pArray.map((p: any) => p.name);
    const tsParams  = pArray.map((p: any) => `${p.name}: ${toTsType(p.dataType)}`).join(', ');
    const cppTypes  = pArray.map((p: any) => `${toCppType(p.dataType)} ${p.name}`).join(', ');
    const csParams  = pArray.map((p: any) => `${toCsType(p.dataType)} ${p.name}`).join(', ');
    const name = funcName || 'solution';
    switch (language) {
        case 'javascript':   return `function ${name}(${paramNames.join(', ')}) {\n    // ваш код здесь\n    return;\n}`;
        case 'typescript':   return `function ${name}(${tsParams}): any {\n    // ваш код здесь\n    return;\n}`;
        case 'python':       return `def ${name}(${paramNames.join(', ')}):\n    # ваш код здесь\n    pass`;
        case 'cpp':          return `#include <string>\n#include <vector>\nusing namespace std;\n\nauto ${name}(${cppTypes}) {\n    // ваш код здесь\n    return 0;\n}`;
        case 'csharp':       return `public static object ${name}(${csParams}) {\n    // ваш код здесь\n    return null;\n}`;
        case 'php':          return `<?php\nfunction ${name}(${paramNames.map((p: string) => '$' + p).join(', ')}) {\n    // ваш код здесь\n    return null;\n}`;
        case 'coffeescript': return `${name} = (${paramNames.join(', ')}) ->\n    # ваш код здесь\n    null`;
        default:             return `function ${name}(${paramNames.join(', ')}) {\n    return;\n}`;
    }
}

function isValidJson(val: string): boolean {
    try { JSON.parse(val); return true; } catch { return false; }
}

function needsJson(type: string) {
    return ['array', 'array2d', 'object'].includes(type);
}

function ParamTypeTag({ type, label }: { type: string; label?: string }) {
    return (
        <span className="cc-param-tag" data-type={type}>
            {label ?? type}
        </span>
    );
}

function ArgInput({
    paramName, paramType, paramLabel, value, onChange,
}: {
    paramName: string; paramType: string; paramLabel?: string; value: string; onChange: (v: string) => void;
}) {
    const hint = PARAM_TYPE_HINTS[paramType as ParamDataType] ?? '';
    const isJson = needsJson(paramType);
    const invalid = isJson && value.trim() !== '' && !isValidJson(value);

    return (
        <div className={`cc-arg-row ${invalid ? 'cc-arg-invalid' : ''}`}>
            <div className="cc-arg-label">
                <span className="cc-arg-name">{paramName}</span>
                <ParamTypeTag type={paramType} label={paramLabel} />
            </div>
            {isJson ? (
                <textarea
                    className="cc-arg-json"
                    rows={2}
                    placeholder={hint}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    spellCheck={false}
                />
            ) : (
                <input
                    className="cc-arg-input"
                    placeholder={hint}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            )}
            {invalid && <span className="cc-arg-err">Невалидный JSON</span>}
        </div>
    );
}

export default function EditChallengePage({ id }: { id: number }) {
    const router      = useRouter();
    const currentUser = useAppSelector(s => s.auth.user);

    const [loading, setLoading] = useState(true);

    const [topics,           setTopics]           = useState<Topic[]>([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
    const [topicInput,       setTopicInput]       = useState('');
    const [topicOpen,        setTopicOpen]        = useState(false);
    const topicRef = useRef<HTMLDivElement>(null);

    const [diffOpen, setDiffOpen] = useState(false);
    const diffRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ChallengeService.getTopics().then(setTopics).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        $api.get(API_ENDPOINTS.CHALLENGE.GET_ONE(id)).then(({ data }) => {
            setName(data.name ?? '');
            setDifficulty(data.difficulty ?? 1);
            setFuncName(data.funcName ?? 'solution');
            setTimeLimitMs(data.timeLimitMs ?? 2000);
            setDescription(data.description ?? '');
            setSampleInput(data.sampleInput ?? '');
            setSampleOutput(data.sampleOutput ?? '');
            setShowAuthor(data.userId !== null && data.userId !== undefined);
            if (data.topics?.length) {
                setSelectedTopicIds(data.topics.map((t: { id: number }) => t.id));
            }
            if (data.parameters?.length) {
                setParameters(data.parameters.map((p: any, i: number) => ({
                    name: p.name,
                    dataType: p.dataType ?? p.type ?? 'int',
                    order: i,
                })));
            }
            if (data.testCases?.length) {
                setTestCases(data.testCases.map((tc: any) => ({
                    title: tc.title,
                    expectedOutput: tc.expectedOutput,
                    testArgs: (tc.testArgs ?? []).map((a: any, i: number) => ({ value: a.value, order: i })),
                })));
            }
        }).catch(() => {
            showModal('Ошибка', 'Не удалось загрузить задачу.', 'danger');
        }).finally(() => setLoading(false));

    }, [id]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (topicRef.current && !topicRef.current.contains(e.target as Node)) setTopicOpen(false);
            if (diffRef.current  && !diffRef.current.contains(e.target as Node))  setDiffOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const [name,        setName]        = useState('');
    const [difficulty,  setDifficulty]  = useState(1);
    const [funcName,    setFuncName]    = useState('solution');
    const [timeLimitMs, setTimeLimitMs] = useState<number | ''>(2000);
    const [description, setDescription] = useState('');
    const [sampleInput, setSampleInput] = useState('');
    const [sampleOutput,setSampleOutput]= useState('');
    const [showAuthor,  setShowAuthor]  = useState(true);

    const [parameters, setParameters] = useState<any[]>(INIT_PARAMS);
    const [testCases, setTestCases] = useState<any[]>([
        { title: 'Test 1', expectedOutput: '', testArgs: [] },
    ]);

    const [verifyLang,    setVerifyLang]    = useState<LanguageValue>('javascript');
    const [verifyCode,    setVerifyCode]    = useState(() => generateStarterCode('javascript', 'solution', INIT_PARAMS));
    const [verifyResult,  setVerifyResult]  = useState<ExecuteResponse | null>(null);
    const [verifying,     setVerifying]     = useState(false);
    const [verifyError,   setVerifyError]   = useState('');

    useEffect(() => {
        setVerifyCode(generateStarterCode(verifyLang, funcName, parameters));
        setVerifyResult(null);

    }, [funcName, parameters]);

    const paramTypeOptions = ALL_PARAM_TYPES.map(t => ({
        value: t,
        label: PARAM_TYPE_ABSTRACT[t] ?? t,
    }));

    const [modal, setModal] = useState<{
        title: string;
        message: string;
        type: 'warning' | 'danger' | 'info';
        onConfirm?: () => void;
    } | null>(null);
    const showModal = (
        title: string,
        message: string,
        type: 'warning' | 'danger' | 'info' = 'warning',
        onConfirm?: () => void,
    ) => setModal({ title, message, type, onConfirm });

    const [saving, setSaving] = useState(false);

    const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

    const addParameter = () => {
        const order = parameters.length;
        setParameters(prev => [...prev, { name: '', dataType: 'int', order }]);
        setTestCases(prev => prev.map(tc => ({
            ...tc,
            testArgs: [...tc.testArgs, { value: '', order }],
        })));
    };

    const removeParameter = (idx: number) => {
        setParameters(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, order: i })));
        setTestCases(prev => prev.map(tc => ({
            ...tc,
            testArgs: tc.testArgs.filter((_: any, i: number) => i !== idx).map((a: any, i: number) => ({ ...a, order: i })),
        })));
    };

    const updateParam = (idx: number, field: string, val: string) => {
        setParameters(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: val };
            return next;
        });
    };

    const addTestCase = () => {
        const n = testCases.length + 1;
        setTestCases(prev => [...prev, {
            title: `Test ${n}`,
            expectedOutput: '',
            testArgs: parameters.map((_, i) => ({ value: '', order: i })),
        }]);
    };

    const removeTestCase = (idx: number) => {
        setTestCases(prev => prev.filter((_, i) => i !== idx));
    };

    const updateTest = (tcIdx: number, field: string, val: string) => {
        setTestCases(prev => {
            const next = [...prev];
            next[tcIdx] = { ...next[tcIdx], [field]: val };
            return next;
        });
    };

    const updateArg = (tcIdx: number, argIdx: number, val: string) => {
        setTestCases(prev => {
            const next = [...prev];
            next[tcIdx] = {
                ...next[tcIdx],
                testArgs: next[tcIdx].testArgs.map((a: any, i: number) =>
                    i === argIdx ? { ...a, value: val } : a
                ),
            };
            return next;
        });
    };

    const toggleCollapse = (idx: number) => {
        setCollapsed(prev => {
            const s = new Set(prev);
            s.has(idx) ? s.delete(idx) : s.add(idx);
            return s;
        });
    };

    const handleVerify = async () => {
        if (!verifyCode.trim()) { setVerifyError('Введите эталонное решение'); return; }
        setVerifying(true);
        setVerifyResult(null);
        setVerifyError('');
        try {
            const res = await ChallengeService.verifyChallenge({
                funcName,
                timeLimitMs: Number(timeLimitMs) || 2000,
                testCases,
                code: verifyCode,
                language: verifyLang,
                parameters,
            });
            setVerifyResult(res);
        } catch (e: any) {
            setVerifyError(e?.response?.data?.message || e.message || 'Ошибка запуска');
        } finally {
            setVerifying(false);
        }
    };

    const doSave = async () => {
        setSaving(true);
        const topicPayload = selectedTopicIds.length > 0
            ? { topicIds: selectedTopicIds }
            : topicInput.trim()
                ? { topicName: topicInput.trim() }
                : {};

        const payload = {
            name, difficulty, funcName,
            timeLimitMs: Number(timeLimitMs) || 2000,
            description, sampleInput, sampleOutput,
            parameters,
            testCases,
            mode: 'harness',
            userId: showAuthor ? currentUser?.id : null,
            ...topicPayload,
        };

        try {
            await $api.put(API_ENDPOINTS.CHALLENGE.UPDATE(id), payload);
            router.push('/admin?tab=manage');
        } catch {
            showModal('Ошибка', 'Не удалось сохранить изменения.', 'danger');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim())        { showModal('Заполните форму', 'Введите название задачи'); return; }
        if (!description.trim()) { showModal('Заполните форму', 'Введите условие задачи'); return; }
        if (testCases.length === 0) { showModal('Заполните форму', 'Добавьте хотя бы один тест-кейс'); return; }

        if (verifyResult && !verifyResult.error && !verifyResult.testResults?.every(r => r.status === 'success')) {
            showModal('Тесты не прошли', 'Эталонное решение не проходит все тесты. Исправьте тесты или решение перед сохранением.');
            return;
        }

        if (!verifyResult) {
            showModal(
                'Решение не проверено',
                'Эталонное решение не было запущено. Сохранить изменения без проверки?',
                'warning',
                doSave,
            );
            return;
        }

        await doSave();
    };

    const allVerified = !!verifyResult?.testResults?.length &&
        verifyResult.testResults.every(r => r.status === 'success');

    if (loading) {
        return (
            <>
                <Header />
                <main className="cc-page">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#aaa' }}>
                        <div className="cc-spinner" />
                        <span>Загрузка задачи…</span>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="cc-page">
                {}
                <div className="cc-topbar">
                    <div className="cc-topbar-left">
                        <Code2 size={26} className="cc-logo-icon" />
                        <div>
                            <h1 className="cc-title">Редактирование задачи</h1>
                            <span className="cc-subtitle">
                                {showAuthor ? `Автор: ${currentUser?.username ?? 'Вы'}` : 'Анонимно'}
                            </span>
                        </div>
                    </div>
                    <div className="cc-topbar-right">
                        <button
                            className={`cc-btn-ghost ${showAuthor ? 'active' : ''}`}
                            onClick={() => setShowAuthor(v => !v)}
                        >
                            {showAuthor ? <UserCheck size={16} /> : <UserX size={16} />}
                            {showAuthor ? 'Авторство' : 'Анонимно'}
                        </button>
                        <button
                            className={`cc-btn-publish ${allVerified ? 'ready' : ''}`}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Send size={15} />
                            {saving ? 'Сохранение…' : 'Сохранить изменения'}
                        </button>
                    </div>
                </div>

                {}
                <div className="cc-grid">

                    {}
                    <div className="cc-col cc-col-left">
                        <section className="cc-card">
                            <h2 className="cc-card-title"><Settings size={16} /> Конфигурация</h2>

                            <div className="cc-field">
                                <label>Название</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Напр: Сумма двух чисел"
                                />
                            </div>

                            <div className="cc-row2">
                                {}
                                <div className="cc-field">
                                    <label>Сложность</label>
                                    <div className={`custom-select ${diffOpen ? 'open' : ''}`} ref={diffRef} onClick={() => setDiffOpen(v => !v)}>
                                        <div className="select-trigger">
                                            <div className="diff-item">
                                                <div className="difficulty-card-box small" style={{ borderColor: getDiffColor(difficulty) }}>
                                                    {difficulty}
                                                </div>
                                                <span>Сложность {difficulty}</span>
                                            </div>
                                            <span className="arrow">▼</span>
                                        </div>
                                        {diffOpen && (
                                            <div className="select-options">
                                                {DIFFICULTY_LEVELS.map(n => (
                                                    <div key={n} className={`option ${difficulty === n ? 'sort-option active' : ''}`}
                                                        onClick={e => { e.stopPropagation(); setDifficulty(n); setDiffOpen(false); }}>
                                                        <div className="difficulty-card-box small" style={{ borderColor: getDiffColor(n) }}>{n}</div>
                                                        <span>Сложность {n}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {}
                                <div className="cc-field">
                                    <label>Темы</label>
                                    {selectedTopicIds.length > 0 && (
                                        <div className="cc-topic-tags">
                                            {selectedTopicIds.map(id => {
                                                const t = topics.find(t => t.id === id);
                                                return t ? (
                                                    <span key={id} className="cc-topic-tag">
                                                        {t.name}
                                                        <button onClick={() => setSelectedTopicIds(ids => ids.filter(i => i !== id))}>✕</button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                    <div className={`custom-select ${topicOpen ? 'open' : ''}`} ref={topicRef}>
                                        <div className="select-trigger sort-trigger" onClick={() => setTopicOpen(v => !v)}>
                                            <span className="cc-placeholder">+ Добавить тему…</span>
                                            <span className="arrow">▼</span>
                                        </div>
                                        {topicOpen && (
                                            <div className="select-options">
                                                <div className="cc-topic-search" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        autoFocus
                                                        placeholder="Поиск темы…"
                                                        value={topicInput}
                                                        onChange={e => setTopicInput(e.target.value)}
                                                        className="cc-topic-input"
                                                    />
                                                </div>
                                                {topics
                                                    .filter(t => !selectedTopicIds.includes(t.id))
                                                    .filter(t => !topicInput || t.name.toLowerCase().includes(topicInput.toLowerCase()))
                                                    .map(t => (
                                                        <div key={t.id} className="option sort-option"
                                                            onClick={() => { setSelectedTopicIds(ids => [...ids, t.id]); setTopicInput(''); }}>
                                                            {t.name}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="cc-row2">
                                <div className="cc-field">
                                    <label>Имя функции</label>
                                    <input
                                        value={funcName}
                                        onChange={e => setFuncName(e.target.value)}
                                        className="cc-mono"
                                    />
                                </div>
                                <div className="cc-field">
                                    <label>Лимит (мс)</label>
                                    <input
                                        type="number"
                                        value={timeLimitMs}
                                        onChange={e => setTimeLimitMs(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="2000"
                                    />
                                </div>
                            </div>

                            {}
                            <div className="cc-field">
                                <div className="cc-field-header">
                                    <label>Параметры</label>
                                    <button className="cc-btn-add" onClick={addParameter}>
                                        <Plus size={13} /> Добавить
                                    </button>
                                </div>
                                <div className="cc-params-list">
                                    {parameters.map((p, i) => (
                                        <div key={i} className="cc-param-row">
                                            <span className="cc-param-num">{i + 1}</span>
                                            <input
                                                className="cc-mono cc-param-name"
                                                placeholder="имя"
                                                value={p.name}
                                                onChange={e => updateParam(i, 'name', e.target.value)}
                                            />
                                            <div className="cc-param-type-wrap">
                                                <CustomSelect
                                                    small
                                                    options={paramTypeOptions}
                                                    value={p.dataType}
                                                    onChange={v => updateParam(i, 'dataType', v)}
                                                />
                                            </div>
                                            <span className="cc-param-lang-hint" title={`В ${verifyLang}`}>
                                                {PARAM_TYPE_LABELS[verifyLang]?.[p.dataType as ParamDataType] ?? p.dataType}
                                            </span>
                                            <span className="cc-param-hint">
                                                {PARAM_TYPE_HINTS[p.dataType as ParamDataType]}
                                            </span>
                                            <button
                                                className="cc-btn-icon-del"
                                                onClick={() => removeParameter(i)}
                                                title="Удалить параметр"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {}
                        <section className="cc-card">
                            <h2 className="cc-card-title"><FileText size={16} /> Условие</h2>
                            <textarea
                                className="cc-desc"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Опишите задачу подробно: что принимает функция, что возвращает, ограничения…"
                                rows={10}
                            />
                            <div className="cc-samples-row">
                                <div className="cc-field">
                                    <label>Пример входа</label>
                                    <input value={sampleInput} onChange={e => setSampleInput(e.target.value)} placeholder="a=5, b=10" />
                                </div>
                                <div className="cc-field">
                                    <label>Пример выхода</label>
                                    <input value={sampleOutput} onChange={e => setSampleOutput(e.target.value)} placeholder="15" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {}
                    <div className="cc-col cc-col-right">

                        {}
                        <section className="cc-card">
                            <div className="cc-card-title-row">
                                <h2 className="cc-card-title"><FlaskConical size={16} /> Тест-кейсы</h2>
                                <button className="cc-btn-add" onClick={addTestCase}>
                                    <Plus size={13} /> Добавить
                                </button>
                            </div>
                            <div className="cc-tests-list">
                                {testCases.map((tc, tcIdx) => {
                                    const isCollapsed = collapsed.has(tcIdx);
                                    const result = verifyResult?.testResults?.[tcIdx];
                                    return (
                                        <div key={tcIdx} className={`cc-test ${result ? `cc-test-${result.status}` : ''}`}>
                                            <div className="cc-test-head" onClick={() => toggleCollapse(tcIdx)}>
                                                <div className="cc-test-head-left">
                                                    {result?.status === 'success' && <CheckCircle2 size={14} className="cc-icon-ok" />}
                                                    {result?.status === 'fail'    && <XCircle      size={14} className="cc-icon-fail" />}
                                                    {result?.status === 'error'   && <AlertTriangle size={14} className="cc-icon-err" />}
                                                    <input
                                                        className="cc-test-name"
                                                        value={tc.title}
                                                        onChange={e => { e.stopPropagation(); updateTest(tcIdx, 'title', e.target.value); }}
                                                        onClick={e => e.stopPropagation()}
                                                        placeholder={`Test ${tcIdx + 1}`}
                                                    />
                                                </div>
                                                <div className="cc-test-head-right">
                                                    {result && (
                                                        <span className={`cc-test-badge cc-test-badge-${result.status}`}>
                                                            {result.status === 'success' ? 'Passed' : result.status === 'fail' ? 'Failed' : 'Error'}
                                                        </span>
                                                    )}
                                                    <button
                                                        className="cc-btn-icon-del"
                                                        onClick={e => { e.stopPropagation(); removeTestCase(tcIdx); }}
                                                        disabled={testCases.length <= 1}
                                                        title="Удалить тест"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                                </div>
                                            </div>

                                            {!isCollapsed && (
                                                <div className="cc-test-body">
                                                    <div className="cc-test-args">
                                                        {tc.testArgs.map((arg: any, argIdx: number) => (
                                                            <ArgInput
                                                                key={argIdx}
                                                                paramName={parameters[argIdx]?.name || `arg${argIdx}`}
                                                                paramType={parameters[argIdx]?.dataType || 'int'}
                                                                paramLabel={PARAM_TYPE_LABELS[verifyLang]?.[parameters[argIdx]?.dataType as ParamDataType] ?? parameters[argIdx]?.dataType}
                                                                value={arg.value}
                                                                onChange={v => updateArg(tcIdx, argIdx, v)}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="cc-test-expected">
                                                        <label>
                                                            Expected
                                                            {needsJson(typeof tc.expectedOutput === 'object' ? 'array' : '') && (
                                                                <span className="cc-json-hint"> (JSON)</span>
                                                            )}
                                                        </label>
                                                        <input
                                                            placeholder='42 или "строка" или [1,2,3]'
                                                            value={tc.expectedOutput}
                                                            onChange={e => updateTest(tcIdx, 'expectedOutput', e.target.value)}
                                                        />
                                                    </div>
                                                    {result?.status === 'fail' && (
                                                        <div className="cc-test-actual">
                                                            <span className="cc-actual-label">Получено:</span>
                                                            <span className="cc-actual-val">
                                                                {JSON.stringify(result.actual)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {result?.status === 'error' && (
                                                        <div className="cc-test-error-msg">
                                                            {String(result.actual)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {}
                        <section className="cc-card cc-verify-card">
                            <div className="cc-card-title-row">
                                <h2 className="cc-card-title"><Code2 size={16} /> Эталонное решение</h2>
                                <div className="cc-verify-controls">
                                    <LanguageSelect
                                        currentValue={verifyLang}
                                        onChange={lang => {
                                            setVerifyLang(lang.value);
                                            setVerifyCode(generateStarterCode(lang.value, funcName, parameters));
                                            setVerifyResult(null);
                                        }}
                                    />
                                    <button
                                        className={`cc-btn-run ${verifying ? 'loading' : ''}`}
                                        onClick={handleVerify}
                                        disabled={verifying}
                                    >
                                        {verifying ? (
                                            <span className="cc-spinner" />
                                        ) : (
                                            <Play size={13} fill="currentColor" />
                                        )}
                                        {verifying ? 'Запуск…' : 'Запустить'}
                                    </button>
                                </div>
                            </div>

                            <div className="cc-editor-wrap">
                                <Editor
                                    height="280px"
                                    language={verifyLang === 'coffeescript' ? 'javascript' : verifyLang === 'cpp' ? 'cpp' : verifyLang}
                                    value={verifyCode}
                                    onChange={v => { setVerifyCode(v ?? ''); setVerifyResult(null); }}
                                    theme="vs-dark"
                                    beforeMount={monaco => {
                                        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
                                        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
                                    }}
                                    options={{
                                        fontSize: 13,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        lineNumbers: 'on',
                                        padding: { top: 10, bottom: 10 },
                                        fontFamily: "'Fira Code', monospace",
                                        fontLigatures: true,
                                    }}
                                />
                            </div>

                            {verifyError && (
                                <div className="cc-verify-error">
                                    <AlertTriangle size={14} /> {verifyError}
                                </div>
                            )}
                            {verifyResult && !verifyResult.error && (
                                <div className="cc-verify-summary">
                                    {verifyResult.testResults?.map((r, i) => (
                                        <div key={i} className={`cc-verify-row cc-verify-row-${r.status}`}>
                                            {r.status === 'success'
                                                ? <CheckCircle2 size={14} />
                                                : <XCircle size={14} />}
                                            <span className="cc-verify-test-name">
                                                {testCases[i]?.title ?? `Test ${i + 1}`}
                                            </span>
                                            {r.status === 'fail' && (
                                                <span className="cc-verify-diff">
                                                    ожидалось&nbsp;<b>{JSON.stringify(r.expected)}</b>,
                                                    &nbsp;получено&nbsp;<b>{JSON.stringify(r.actual)}</b>
                                                </span>
                                            )}
                                            {r.duration !== undefined && (
                                                <span className="cc-verify-time">{r.duration}ms</span>
                                            )}
                                        </div>
                                    ))}
                                    <div className={`cc-verify-verdict ${allVerified ? 'ok' : 'fail'}`}>
                                        {allVerified
                                            ? <><CheckCircle2 size={15} /> Все тесты пройдены — можно сохранять</>
                                            : <><XCircle size={15} /> Не все тесты прошли — исправьте тесты или решение</>}
                                    </div>
                                </div>
                            )}
                            {verifyResult?.error && (
                                <div className="cc-verify-error">
                                    <AlertTriangle size={14} />
                                    <span><b>{verifyResult.error.message}</b>: {verifyResult.error.details}</span>
                                </div>
                            )}
                            {!verifyResult && !verifyError && (
                                <div className="cc-verify-placeholder">
                                    Можно сохранить без проверки, но рекомендуется запустить эталонное решение перед сохранением
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
            <ConfirmationModal
                isOpen={!!modal}
                title={modal?.title ?? ''}
                message={modal?.message ?? ''}
                type={modal?.type ?? 'warning'}
                confirmText={modal?.onConfirm ? 'Сохранить' : 'Понятно'}
                cancelText="Отмена"
                onConfirm={() => { modal?.onConfirm?.(); setModal(null); }}
                onClose={() => setModal(null)}
            />
        </>
    );
}
