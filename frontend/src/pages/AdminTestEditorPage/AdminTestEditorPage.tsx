'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Save, Eye, EyeOff, GripVertical, X, ListChecks, ToggleLeft, Type, Hash, ArrowLeftRight, Edit3, AlignLeft, Code2, ImagePlus, Trash2 } from 'lucide-react';
import CustomSelect from '@/shared/components/CustomSelect/CustomSelect';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchAdminTest,
    fetchQuestionTypes,
    adminUpdateTest,
    adminPublishTest,
    adminCreateQuestion,
    adminUpdateQuestion,
    adminDeleteQuestion,
    clearCurrentTest,
} from '@/shared/store/slice/adminTestSlice';
import { fetchTestTopics } from '@/shared/store/slice/testSlice';
import { Question, QuestionInput, QuestionOption, QuestionTestCase, QuestionType } from '@/shared/services/TestApiService';
import $api from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/apiEndpoints';
import './AdminTestEditorPage.css';

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9005/api').replace(/\/api$/, '');

// ─── Иконки, цвета и описания типов вопросов ─────────────────────────────────

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
    'Множественный выбор': ListChecks,
    'Да / Нет':            ToggleLeft,
    'Короткий ответ':      Type,
    'Числовой ответ':      Hash,
    'Сопоставление':       ArrowLeftRight,
    'Заполни пропуск':     Edit3,
    'Информационный блок': AlignLeft,
    'Выполнение кода':     Code2,
};

const TYPE_COLORS: Record<string, string> = {
    'Множественный выбор': '#60a5fa',
    'Да / Нет':            '#4ade80',
    'Короткий ответ':      '#a78bfa',
    'Числовой ответ':      '#38bdf8',
    'Сопоставление':       '#fb923c',
    'Заполни пропуск':     '#f472b6',
    'Информационный блок': '#94a3b8',
    'Выполнение кода':     '#fbbf24',
};

const TYPE_DESC: Record<string, string> = {
    'Множественный выбор': 'один или несколько вариантов',
    'Да / Нет':            'верно или неверно',
    'Короткий ответ':      'произвольный текст',
    'Числовой ответ':      'число с погрешностью',
    'Сопоставление':       'пары левое → правое',
    'Заполни пропуск':     '[[1]], [[2]] в тексте',
    'Информационный блок': 'только текст, без ответа',
    'Выполнение кода':     'Docker sandbox',
};

const OPT_LETTERS = 'АБВГДЕЖЗИК';

// ─── Редактор тест-кейсов для code-вопросов ──────────────────────────────────

interface TestCasesEditorProps {
    testCases: Partial<QuestionTestCase>[];
    onChange:  (tcs: Partial<QuestionTestCase>[]) => void;
    funcMode:  boolean;
}

function TestCasesEditor({ testCases, onChange, funcMode }: TestCasesEditorProps) {
    const add    = () => onChange([...testCases, { input: funcMode ? '[]' : '', expectedOutput: '', isHidden: false, order: testCases.length }]);
    const remove = (i: number) => onChange(testCases.filter((_, idx) => idx !== i));
    const set    = (i: number, field: keyof QuestionTestCase, val: any) =>
        onChange(testCases.map((tc, idx) => idx === i ? { ...tc, [field]: val } : tc));

    return (
        <div className="qed-tc-wrap">
            <div className="qed-section__label">Тест-кейсы <span className="qed-hint">автопроверка кода</span></div>
            {testCases.map((tc, i) => (
                <div key={i} className="qed-tc-card">
                    <div className="qed-tc-card__head">
                        <span className="qed-tc-num">#{i + 1}</span>
                        <label className="qed-tc-hidden-label">
                            <input type="checkbox" checked={!!tc.isHidden}
                                   onChange={e => set(i, 'isHidden', e.target.checked)} />
                            Скрытый
                        </label>
                        <button className="ate-icon-btn ate-icon-btn--danger" onClick={() => remove(i)}>
                            <X size={12} />
                        </button>
                    </div>
                    <div className="qed-tc-card__body">
                        <div className="qed-tc-field">
                            <span className="qed-tc-field__lbl">
                                {funcMode ? 'Аргументы (JSON)' : 'Входные данные (stdin)'}
                            </span>
                            <textarea className="qed-tc-textarea" rows={2} value={tc.input ?? ''}
                                      placeholder={funcMode ? '[5] или [3, "hello"]' : 'пусто = нет stdin'}
                                      onChange={e => set(i, 'input', e.target.value)} />
                        </div>
                        <div className="qed-tc-arrow">→</div>
                        <div className="qed-tc-field">
                            <span className="qed-tc-field__lbl">
                                {funcMode ? 'Ожидаемый результат' : 'Ожидаемый вывод *'}
                            </span>
                            <textarea className="qed-tc-textarea" rows={2} value={tc.expectedOutput ?? ''}
                                      placeholder={funcMode ? '15 или "hello"' : 'Hello, World!'}
                                      onChange={e => set(i, 'expectedOutput', e.target.value)} />
                        </div>
                    </div>
                </div>
            ))}
            <button className="qed-add-btn" onClick={add}>
                <Plus size={11} /> Добавить тест-кейс
            </button>
        </div>
    );
}

// ─── Редактор вариантов по типу вопроса ──────────────────────────────────────

interface OptionsEditorProps {
    typeName:  string;
    options:   Partial<QuestionOption>[];
    onChange:  (opts: Partial<QuestionOption>[]) => void;
    allowMultiple?: boolean;
}

function OptionsEditor({ typeName, options, onChange, allowMultiple }: OptionsEditorProps) {
    const add    = () => onChange([...options, { text: '', isCorrect: false, order: options.length }]);
    const remove = (i: number) => onChange(options.filter((_, idx) => idx !== i));
    const set    = (i: number, field: keyof QuestionOption, val: any) =>
        onChange(options.map((o, idx) => idx === i ? { ...o, [field]: val } : o));

    // Для radio (single choice) — снимаем isCorrect у остальных
    const setCorrectSingle = (i: number) =>
        onChange(options.map((o, idx) => ({ ...o, isCorrect: idx === i })));

    if (typeName === 'Информационный блок') {
        return (
            <div className="qed-info-note">
                <AlignLeft size={14} />
                Информационный блок — правильный ответ не задаётся
            </div>
        );
    }

    if (typeName === 'Да / Нет') {
        return (
            <div className="qed-opts-wrap">
                <div className="qed-section__label">Правильный ответ</div>
                <div className="qed-tf-row">
                    {['Верно', 'Неверно'].map((lbl, i) => {
                        const isOn = !!(options[i] ?? {}).isCorrect;
                        return (
                            <button key={lbl}
                                className={`qed-tf-card ${isOn ? 'qed-tf-card--on' : ''}`}
                                onClick={() => onChange(['Верно','Неверно'].map((l, idx) => ({ text: l, isCorrect: idx === i, order: idx })))}>
                                <span className="qed-tf-icon">{lbl === 'Верно' ? '✓' : '✗'}</span>
                                <span className="qed-tf-label">{lbl}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (typeName === 'Числовой ответ') {
        const opt = options[0] ?? {};
        return (
            <div className="qed-opts-wrap">
                <div className="qed-section__label">Правильный ответ</div>
                <input className="qed-single-input" type="number" value={opt.text ?? ''}
                       placeholder="например: 42" onChange={e => onChange([{ text: e.target.value, isCorrect: true, order: 0 }])} />
            </div>
        );
    }

    if (typeName === 'Короткий ответ') {
        return (
            <div className="qed-opts-wrap">
                <div className="qed-section__label">
                    Допустимые ответы <span className="qed-hint">можно несколько</span>
                </div>
                {options.map((o, i) => (
                    <div key={i} className="qed-sa-row">
                        <span className="qed-sa-num">{i + 1}</span>
                        <input className="qed-opt-input" value={o.text ?? ''} placeholder="Правильный ответ"
                               onChange={e => set(i, 'text', e.target.value)} />
                        <button className="ate-icon-btn ate-icon-btn--danger" onClick={() => remove(i)}><X size={12} /></button>
                    </div>
                ))}
                <button className="qed-add-btn" onClick={add}><Plus size={11} /> Добавить вариант</button>
            </div>
        );
    }

    if (typeName === 'Множественный выбор') {
        const multi = !!allowMultiple;
        return (
            <div className="qed-opts-wrap">
                <div className="qed-section__label">
                    Варианты ответа
                    <span className="qed-hint">{multi ? 'отметьте все верные' : 'отметьте один верный'}</span>
                </div>
                {options.map((o, i) => (
                    <div key={i} className={`qed-opt-card ${o.isCorrect ? 'qed-opt-card--on' : ''}`}>
                        <button className={`qed-opt-letter ${o.isCorrect ? 'qed-opt-letter--on' : ''}`}
                                onClick={() => multi ? set(i, 'isCorrect', !o.isCorrect) : setCorrectSingle(i)}>
                            {OPT_LETTERS[i] ?? i + 1}
                        </button>
                        <input className="qed-opt-input" value={o.text ?? ''}
                               placeholder={`Вариант ${i + 1}`} onChange={e => set(i, 'text', e.target.value)} />
                        <button className="ate-icon-btn ate-icon-btn--danger" onClick={() => remove(i)}><X size={12} /></button>
                    </div>
                ))}
                <button className="qed-add-btn" onClick={add}><Plus size={11} /> Добавить вариант</button>
            </div>
        );
    }

    if (typeName === 'Сопоставление') {
        return (
            <div className="qed-opts-wrap">
                <div className="qed-match-head">
                    <span>Левая часть</span>
                    <span className="qed-match-arrow">↔</span>
                    <span>Правая часть</span>
                    <span style={{ width: 28 }} />
                </div>
                {options.map((o, i) => (
                    <div key={i} className="qed-match-row">
                        <input className="qed-opt-input" value={o.text ?? ''} placeholder="Москва"
                               onChange={e => set(i, 'text', e.target.value)} />
                        <span className="qed-match-arrow">→</span>
                        <input className="qed-opt-input" value={o.matchPair ?? ''} placeholder="Россия"
                               onChange={e => set(i, 'matchPair', e.target.value)} />
                        <button className="ate-icon-btn ate-icon-btn--danger" onClick={() => remove(i)}><X size={12} /></button>
                    </div>
                ))}
                <button className="qed-add-btn" onClick={add}><Plus size={11} /> Добавить пару</button>
            </div>
        );
    }

    if (typeName === 'Заполни пропуск') {
        const byBlank: Record<number, string> = {};
        options.forEach(o => { if (o.blankIndex != null) byBlank[o.blankIndex] = o.text ?? ''; });
        return (
            <div className="qed-opts-wrap">
                <div className="qed-section__label">
                    Ответы для пропусков
                    <span className="qed-hint">используйте [[1]], [[2]] в тексте</span>
                </div>
                {Object.entries(byBlank).map(([idx, val]) => (
                    <div key={idx} className="qed-cloze-row">
                        <span className="qed-cloze-tag">[[{idx}]]</span>
                        <input className="qed-opt-input" value={val} placeholder="Правильный ответ"
                               onChange={e => onChange(options.map(o =>
                                   o.blankIndex === Number(idx) ? { ...o, text: e.target.value } : o
                               ))} />
                    </div>
                ))}
                <button className="qed-add-btn" onClick={() => {
                    const nextIdx = (Math.max(-1, ...options.map(o => o.blankIndex ?? -1)) + 1);
                    onChange([...options, { text: '', isCorrect: true, blankIndex: nextIdx, order: options.length }]);
                }}>
                    <Plus size={11} /> Добавить бланк [[{Math.max(0, ...options.map(o => o.blankIndex ?? -1)) + (options.length ? 1 : 1)}]]
                </button>
            </div>
        );
    }

    return null;
}

// ─── Редактор одного вопроса ─────────────────────────────────────────────────

interface QuestionEditorProps {
    question:     Question | null;   // null = новый вопрос
    testId:       number;
    questionTypes: QuestionType[];
    onClose:      () => void;
}

function QuestionEditor({ question, testId, questionTypes, onClose }: QuestionEditorProps) {
    const dispatch = useAppDispatch();
    const { isSaving, error } = useAppSelector(s => s.adminTest);

    const defaultTypeId = questionTypes.find(t => t.name === 'Множественный выбор')?.id ?? questionTypes[0]?.id ?? 0;

    const [typeId,        setTypeId]        = useState(question?.typeId ?? defaultTypeId);
    const [text,          setText]          = useState(question?.text ?? '');
    const [points,        setPoints]        = useState(String(question?.points ?? '1'));
    const [allowMultiple, setAllowMultiple] = useState(question?.allowMultiple ?? false);
    const [caseSensitive, setCaseSensitive] = useState(question?.caseSensitive ?? false);
    const [tolerance,     setTolerance]     = useState(String(question?.tolerance ?? '0'));
    const [codeLanguage,  setCodeLanguage]  = useState(question?.codeLanguage ?? 'javascript');
    const [starterCode,   setStarterCode]   = useState(question?.starterCode ?? '');
    const [funcName,      setFuncName]      = useState(question?.funcName ?? '');
    const [options,       setOptions]       = useState<Partial<QuestionOption>[]>(question?.options ?? []);
    const [testCases,     setTestCases]     = useState<Partial<QuestionTestCase>[]>(question?.testCases ?? []);
    const [imageUrl,      setImageUrl]      = useState<string | null>(question?.imageUrl ?? null);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedType = questionTypes.find(t => t.id === typeId);
    const typeName     = selectedType?.name ?? '';

    const handleImageUpload = async (file: File) => {
        if (!question?.id) return;
        setImageUploading(true);
        try {
            const form = new FormData();
            form.append('image', file);
            const res = await $api.post(API_ENDPOINTS.TESTS.QUESTION_IMAGE(question.id), form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setImageUrl(res.data.imageUrl);
        } finally {
            setImageUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImageDelete = async () => {
        if (!question?.id || !imageUrl) return;
        setImageUploading(true);
        try {
            await $api.delete(API_ENDPOINTS.TESTS.QUESTION_IMAGE(question.id));
            setImageUrl(null);
        } finally {
            setImageUploading(false);
        }
    };

    const handleSave = async () => {
        if (!text.trim()) return;
        const payload: QuestionInput = {
            typeId,
            text: text.trim(),
            points:        parseFloat(points) || 1,
            allowMultiple: typeName === 'Множественный выбор' ? allowMultiple : undefined,
            caseSensitive: typeName === 'Короткий ответ'      ? caseSensitive : undefined,
            tolerance:     typeName === 'Числовой ответ'      ? parseFloat(tolerance) || 0 : undefined,
            codeLanguage:  typeName === 'Выполнение кода'     ? codeLanguage : undefined,
            starterCode:   typeName === 'Выполнение кода'     ? starterCode  : undefined,
            funcName:      typeName === 'Выполнение кода'     ? (funcName.trim() || null) : undefined,
            options: options
                .filter(o => o.text !== undefined)
                .map((o, i) => ({
                    text:       o.text ?? '',
                    isCorrect:  o.isCorrect ?? false,
                    matchPair:  o.matchPair ?? null,
                    blankIndex: o.blankIndex ?? null,
                    order:      i,
                })),
            testCases: typeName === 'Выполнение кода'
                ? testCases
                    .filter(tc => (tc.expectedOutput ?? '').trim() !== '')
                    .map((tc, i) => ({
                        input:          tc.input?.trim() || null,
                        expectedOutput: tc.expectedOutput ?? '',
                        isHidden:       tc.isHidden ?? false,
                        order:          i,
                    }))
                : undefined,
        };

        const action = question
            ? dispatch(adminUpdateQuestion({ testId, questionId: question.id, payload }))
            : dispatch(adminCreateQuestion({ testId, payload }));

        const result = await action;
        if (adminCreateQuestion.fulfilled.match(result) || adminUpdateQuestion.fulfilled.match(result)) {
            onClose();
        }
    };

    return (
        <div className="ate-editor-panel">
            <div className="ate-editor-title">
                <span>{question ? 'Редактировать вопрос' : 'Новый вопрос'}</span>
                <button className="ate-icon-btn" onClick={onClose}><X size={16} /></button>
            </div>

            {/* Тип */}
            <div className="ate-field" style={{ marginBottom: 16 }}>
                <span className="ate-label">Тип вопроса</span>
                <div className="qed-type-grid">
                    {questionTypes.map(qt => {
                        const Icon = TYPE_ICONS[qt.name];
                        const color = TYPE_COLORS[qt.name] ?? 'rgba(255,255,255,.4)';
                        return (
                            <button key={qt.id}
                                className={`qed-type-card ${typeId === qt.id ? 'qed-type-card--on' : ''}`}
                                style={{ '--type-color': color } as React.CSSProperties}
                                onClick={() => { setTypeId(qt.id); setOptions([]); }}>
                                {Icon && <span className="qed-type-card__icon"><Icon size={17} /></span>}
                                <span className="qed-type-card__name">{qt.name}</span>
                                <span className="qed-type-card__desc">{TYPE_DESC[qt.name] ?? ''}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Текст вопроса */}
            <div className="ate-field" style={{ marginBottom: 12 }}>
                <label className="ate-label">
                    Текст вопроса
                    {typeName === 'Заполни пропуск' && <span className="qed-hint" style={{ marginLeft: 6 }}>— используйте [[1]], [[2]] для пропусков</span>}
                </label>
                <textarea className="ate-textarea" rows={3} value={text}
                          onChange={e => setText(e.target.value)} placeholder="Введите текст вопроса…" />
            </div>

            {/* Изображение вопроса */}
            {question?.id && (
                <div className="ate-field" style={{ marginBottom: 12 }}>
                    <label className="ate-label">Изображение</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                    />
                    {imageUrl ? (
                        <div className="qed-img-preview">
                            <img src={`${BACKEND_BASE}${imageUrl}`} alt="Изображение вопроса" className="qed-img-preview__img" />
                            <div className="qed-img-preview__actions">
                                <button className="ate-btn ate-btn--ghost qed-img-btn" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}>
                                    <ImagePlus size={14} /> Заменить
                                </button>
                                <button className="ate-btn ate-btn--danger qed-img-btn" onClick={handleImageDelete} disabled={imageUploading}>
                                    <Trash2 size={14} /> Удалить
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className="ate-btn ate-btn--ghost qed-img-btn" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}>
                            <ImagePlus size={14} /> {imageUploading ? 'Загрузка…' : 'Добавить изображение'}
                        </button>
                    )}
                </div>
            )}

            {/* Баллы + доп. настройки */}
            <div className="qed-settings-row">
                <div className="ate-field" style={{ width: 100 }}>
                    <label className="ate-label">Баллы</label>
                    <input className="ate-input" type="number" min={0} step={0.5} value={points}
                           onChange={e => setPoints(e.target.value)} />
                </div>
                {typeName === 'Множественный выбор' && (
                    <label className="ate-checkbox-label">
                        <input type="checkbox" checked={allowMultiple} onChange={e => setAllowMultiple(e.target.checked)} />
                        Несколько правильных
                    </label>
                )}
                {typeName === 'Короткий ответ' && (
                    <label className="ate-checkbox-label">
                        <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} />
                        Учитывать регистр
                    </label>
                )}
                {typeName === 'Числовой ответ' && (
                    <div className="ate-field" style={{ width: 140 }}>
                        <label className="ate-label">Погрешность (±)</label>
                        <input className="ate-input" type="number" min={0} step={0.01} value={tolerance}
                               onChange={e => setTolerance(e.target.value)} placeholder="0" />
                    </div>
                )}
                {typeName === 'Выполнение кода' && (
                    <div className="ate-field" style={{ width: 180 }}>
                        <label className="ate-label">Язык</label>
                        <CustomSelect
                            value={codeLanguage}
                            onChange={setCodeLanguage}
                            options={['javascript','typescript','python','cpp','csharp','php','coffeescript'].map(l => ({ value: l, label: l }))}
                        />
                    </div>
                )}
                {typeName === 'Выполнение кода' && (
                    <div className="ate-field" style={{ flex: 1, minWidth: 160 }}>
                        <label className="ate-label">Имя функции</label>
                        <input className="ate-input" value={funcName}
                               onChange={e => setFuncName(e.target.value)}
                               placeholder="solve (оставьте пустым для stdin-режима)" />
                    </div>
                )}
            </div>

            {/* Стартовый код для code-вопросов */}
            {typeName === 'Выполнение кода' && (
                <div className="ate-field" style={{ marginBottom: 12 }}>
                    <label className="ate-label">Начальный код (необязательно)</label>
                    <textarea className="ate-textarea" rows={5} value={starterCode}
                              onChange={e => setStarterCode(e.target.value)}
                              placeholder={funcName.trim()
                                  ? `def ${funcName.trim()}(n):\n    # ваш код\n    pass`
                                  : `def solve():\n    # ваш код\n    pass`}
                              style={{ fontFamily: 'monospace', fontSize: 12 }} />
                </div>
            )}

            {/* Тест-кейсы для code-вопросов */}
            {typeName === 'Выполнение кода' && (
                <TestCasesEditor testCases={testCases} onChange={setTestCases} funcMode={!!funcName.trim()} />
            )}

            {/* Варианты ответов */}
            <OptionsEditor typeName={typeName} options={options} onChange={setOptions} allowMultiple={allowMultiple} />

            {error && <div className="ate-error">{error}</div>}

            <div className="qed-actions">
                <button className="ate-btn ate-btn--ghost" onClick={onClose}>Отмена</button>
                <button className="ate-btn ate-btn--primary" disabled={!text.trim() || isSaving} onClick={handleSave}>
                    {isSaving ? 'Сохранение…' : question ? 'Сохранить' : 'Добавить вопрос'}
                </button>
            </div>
        </div>
    );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function AdminTestEditorPage() {
    const params   = useParams();
    const router   = useRouter();
    const dispatch = useAppDispatch();

    const testId = Number(params?.id);

    const { currentTest, questionTypes, isSaving, error } = useAppSelector(s => s.adminTest);
    const { topics } = useAppSelector(s => s.test);

    const [title,            setTitle]            = useState('');
    const [desc,             setDesc]             = useState('');
    const [timeLimit,        setTimeLimit]        = useState('');
    const [topicId,          setTopicId]          = useState<number | ''>('');
    const [difficulty,       setDifficulty]       = useState<number | ''>('');
    const [shuffleQuestions,   setShuffleQuestions]   = useState(false);
    const [shuffleOptions,     setShuffleOptions]     = useState(false);
    const [questionPoolSize,   setQuestionPoolSize]   = useState('');
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
    const [infoSaved,        setInfoSaved]        = useState(false);

    const [editingQuestion, setEditingQuestion] = useState<Question | null | undefined>(undefined);
    // undefined = панель закрыта, null = новый, Question = редактировать

    const editorRef      = React.useRef<HTMLDivElement>(null);
    const pendingScroll  = React.useRef(false);

    // после рендера — если ждём скролл, прокручиваем к редактору
    React.useEffect(() => {
        if (pendingScroll.current && editingQuestion !== undefined) {
            pendingScroll.current = false;
            editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    const openFromNav = (q: Question) => {
        const closing = editingQuestion !== undefined && (editingQuestion as Question)?.id === q.id;
        setEditingQuestion(closing ? undefined : q);
        if (!closing) pendingScroll.current = true;
    };

    useEffect(() => {
        dispatch(fetchQuestionTypes());
        dispatch(fetchAdminTest(testId));
        dispatch(fetchTestTopics());
        return () => { dispatch(clearCurrentTest()); };
    }, [testId, dispatch]);

    useEffect(() => {
        if (currentTest) {
            setTitle(currentTest.title ?? '');
            setDesc(currentTest.description ?? '');
            setTimeLimit(currentTest.timeLimitMinutes ? String(currentTest.timeLimitMinutes) : '');
            setTopicId((currentTest as any).topicId ?? '');
            setDifficulty((currentTest as any).difficulty ?? '');
            setShuffleQuestions((currentTest as any).shuffleQuestions ?? false);
            setShuffleOptions((currentTest as any).shuffleOptions ?? false);
            setQuestionPoolSize((currentTest as any).questionPoolSize ? String((currentTest as any).questionPoolSize) : '');
            setShowCorrectAnswers((currentTest as any).showCorrectAnswers ?? true);
        }
    }, [currentTest?.id]);

    const handleSaveInfo = async () => {
        const result = await dispatch(adminUpdateTest({
            id: testId,
            title:            title.trim(),
            description:      desc.trim() || undefined,
            timeLimitMinutes: timeLimit        ? Number(timeLimit)        : null,
            topicId:          topicId          ? Number(topicId)          : null,
            difficulty:       difficulty       ? Number(difficulty)       : null,
            shuffleQuestions,
            shuffleOptions,
            questionPoolSize:   questionPoolSize ? Number(questionPoolSize) : null,
            showCorrectAnswers,
        }));
        if (adminUpdateTest.fulfilled.match(result)) {
            setInfoSaved(true);
            setTimeout(() => setInfoSaved(false), 2000);
        }
    };

    const handlePublish = () => {
        dispatch(adminPublishTest({ id: testId, isPublished: !currentTest?.isPublished }));
    };

    const handleDeleteQuestion = async (q: Question) => {
        if (!confirm(`Удалить вопрос «${q.text.slice(0, 60)}»?`)) return;
        dispatch(adminDeleteQuestion({ testId, questionId: q.id }));
        if (editingQuestion?.id === q.id) setEditingQuestion(undefined);
    };

    const sortedQuestions = [...(currentTest?.questions ?? [])].sort((a, b) => a.order - b.order);

    if (!currentTest) {
        return <div className="ate-loading">Загрузка…</div>;
    }

    return (
        <div className="ate-page">

            {/* Шапка */}
            <div className="ate-header">
                <button className="ate-back-btn" onClick={() => router.push('/admin?tab=tests')}>
                    <img src="/images/left-arrow.png" alt="←" className="icon-back" style={{width:'14px',height:'14px'}} />Назад к тестам
                </button>
                <h1 className="ate-header-title">{currentTest.title}</h1>
                <div className="ate-header-actions">
                    <button
                        className={`ate-btn ${currentTest.isPublished ? 'ate-btn--unpublish' : 'ate-btn--publish'}`}
                        onClick={handlePublish}
                    >
                        {currentTest.isPublished ? <><EyeOff size={13} /> Снять</>  : <><Eye size={13} /> Опубликовать</>}
                    </button>
                </div>
            </div>

            <div className="ate-layout">
            <div className="ate-main">

            {/* Информация о тесте */}
            <div className="ate-card">
                <p className="ate-card-title"><span className="ate-card-title-accent" />Основная информация</p>
                <div className="ate-fields">
                    <div className="ate-field">
                        <label className="ate-label">Название *</label>
                        <input className="ate-input" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="ate-field">
                        <label className="ate-label">Описание</label>
                        <textarea className="ate-textarea" rows={2} value={desc}
                                  onChange={e => setDesc(e.target.value)} placeholder="Необязательно" />
                    </div>
                    <div className="ate-field-row">
                        <div className="ate-field">
                            <label className="ate-label">Лимит (мин.)</label>
                            <input className="ate-input" type="number" min={1} value={timeLimit}
                                   onChange={e => setTimeLimit(e.target.value)} placeholder="без лимита" />
                        </div>
                        <div className="ate-field">
                            <label className="ate-label">Сложность (1–10)</label>
                            <CustomSelect
                                value={String(difficulty)}
                                onChange={v => setDifficulty(v ? Number(v) : '')}
                                options={[
                                    { value: '', label: '—' },
                                    ...[1,2,3,4,5,6,7,8,9,10].map(n => ({ value: String(n), label: String(n) })),
                                ]}
                                placeholder="—"
                            />
                        </div>
                        <div className="ate-field">
                            <label className="ate-label">Категория</label>
                            <CustomSelect
                                value={String(topicId)}
                                onChange={v => setTopicId(v ? Number(v) : '')}
                                options={[
                                    { value: '', label: '— без категории —' },
                                    ...topics.map(t => ({ value: String(t.id), label: t.name })),
                                ]}
                                placeholder="— без категории —"
                            />
                        </div>
                        <div className="ate-field">
                            <label className="ate-label">Вопросов из пула</label>
                            <input className="ate-input" type="number" min={1} value={questionPoolSize}
                                   onChange={e => setQuestionPoolSize(e.target.value)}
                                   placeholder="все вопросы" />
                        </div>
                    </div>
                    <div className="ate-field-row">
                        <label className="ate-checkbox-label">
                            <input type="checkbox" checked={shuffleQuestions}
                                   onChange={e => setShuffleQuestions(e.target.checked)} />
                            Перемешивать вопросы
                        </label>
                        <label className="ate-checkbox-label">
                            <input type="checkbox" checked={shuffleOptions}
                                   onChange={e => setShuffleOptions(e.target.checked)} />
                            Перемешивать варианты ответов
                        </label>
                        <label className="ate-checkbox-label">
                            <input type="checkbox" checked={showCorrectAnswers}
                                   onChange={e => setShowCorrectAnswers(e.target.checked)} />
                            Показывать правильные ответы после прохождения
                        </label>
                    </div>
                    {error && <div className="ate-error">{error}</div>}
                    {infoSaved && <div className="ate-success">Сохранено</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="ate-btn ate-btn--primary" disabled={!title.trim() || isSaving} onClick={handleSaveInfo}>
                            <Save size={13} /> {isSaving ? 'Сохранение…' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Редактор вопроса */}
            <div ref={editorRef}>
            {editingQuestion !== undefined && (
                <QuestionEditor
                    question={editingQuestion}
                    testId={testId}
                    questionTypes={questionTypes}
                    onClose={() => setEditingQuestion(undefined)}
                />
            )}
            </div>

            {/* Список вопросов */}
            <div className="ate-card">
                <p className="ate-card-title">
                    <span className="ate-card-title-accent" />
                    Вопросы
                    <span className="ate-q-stat">
                        {sortedQuestions.length} вопр. · {sortedQuestions.reduce((s, q) => s + q.points, 0)} балл.
                    </span>
                </p>

                {sortedQuestions.length === 0 ? (
                    <div className="ate-q-empty">Вопросов пока нет. Нажмите «Добавить вопрос».</div>
                ) : (
                    <div className="ate-q-list">
                        {sortedQuestions.map((q, i) => {
                            const isCode = q.type?.name === 'Выполнение кода';
                            return (
                                <div
                                    key={q.id}
                                    className={`ate-q-item ${editingQuestion?.id === q.id ? 'ate-q-item--active' : ''}`}
                                    onClick={() => setEditingQuestion(prev => prev?.id === q.id ? undefined : q)}
                                >
                                    <span className="ate-q-num">{i + 1}</span>
                                    <div className="ate-q-body">
                                        <div className="ate-q-text">{q.text}</div>
                                        <div className="ate-q-meta">
                                            <span className={`ate-type-badge ${isCode ? 'ate-type-badge--code' : 'ate-type-badge--moodle'}`}>
                                                {q.type?.name ?? q.typeId}
                                            </span>
                                            <span className="ate-pts-badge">{q.points} б.</span>
                                            {isCode && <span style={{ fontSize: 10, color: '#fbbf24' }}>⚠️ Не Moodle</span>}
                                        </div>
                                    </div>
                                    <div className="ate-q-actions" onClick={e => e.stopPropagation()}>
                                        <button className="ate-icon-btn" title="Редактировать"
                                                onClick={() => setEditingQuestion(q)}>
                                            <Save size={13} />
                                        </button>
                                        <button className="ate-icon-btn ate-icon-btn--danger" title="Удалить"
                                                onClick={() => handleDeleteQuestion(q)}>
                                            <img src="/images/trash.png" alt="del" className="ate-trash-img" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="ate-btn ate-btn--primary" onClick={() => setEditingQuestion(null)}>
                        <Plus size={13} /> Добавить вопрос
                    </button>
                </div>
            </div>

            </div>{/* /ate-main */}

            {/* Правая навигация по вопросам */}
            <aside className="ate-nav">
                <p className="ate-nav__title">
                    <span className="ate-card-title-accent" />
                    Вопросы
                    <span className="ate-nav__count">{sortedQuestions.length}</span>
                </p>

                {sortedQuestions.length === 0 ? (
                    <p className="ate-nav__empty">Нет вопросов</p>
                ) : (
                    <div className="ate-nav__grid">
                        {sortedQuestions.map((q, i) => {
                            const isCode   = q.type?.name === 'Выполнение кода';
                            const isActive = (editingQuestion as Question)?.id === q.id;
                            return (
                                <button
                                    key={q.id}
                                    className={`ate-nav__btn${isActive ? ' ate-nav__btn--active' : ''}${isCode ? ' ate-nav__btn--code' : ''}`}
                                    onClick={() => openFromNav(q)}
                                    title={q.text.slice(0, 80)}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="ate-nav__pts">
                    {sortedQuestions.reduce((s, q) => s + q.points, 0)} балл.
                </div>

                <button className="ate-btn ate-btn--primary ate-nav__add" onClick={() => setEditingQuestion(null)}>
                    <Plus size={13} /> Добавить
                </button>
            </aside>

            </div>{/* /ate-layout */}
        </div>
    );
}
