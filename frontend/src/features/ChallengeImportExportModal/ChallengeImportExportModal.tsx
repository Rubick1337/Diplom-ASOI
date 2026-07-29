'use client';

import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './ChallengeImportExportModal.css';
import AdminApiService, {
    ChallengeImportItem,
    ChallengeManageRow,
    ImportResult,
} from '@/shared/services/AdminApiService';

const JSON_TEMPLATE: ChallengeImportItem[] = [
    {
        name: 'Название задачи',
        description: 'Условие задачи: что принимает функция, что возвращает, ограничения и примеры.',
        difficulty: 3,
        funcName: 'myFunction',
        timeLimitMs: 2000,
        sampleInput: 'a=5, b=10',
        sampleOutput: '15',
        isHidden: false,
        topics: ['Математика'],
        parameters: [
            { name: 'a', dataType: 'int', order: 0 },
            { name: 'b', dataType: 'int', order: 1 },
        ],
        testCases: [
            { title: 'Тест 1: базовый', expectedOutput: '15', testArgs: [{ value: '5', order: 0 }, { value: '10', order: 1 }] },
            { title: 'Тест 2: нули',    expectedOutput: '0',  testArgs: [{ value: '0', order: 0 }, { value: '0',  order: 1 }] },
        ],
    },
];

/* ─── Import Modal ─────────────────────────────────────────────────────── */

interface ImportModalProps {
    onClose: () => void;
    onImported: () => void;
}

export function ChallengeImportModal({ onClose, onImported }: ImportModalProps) {
    const [tab,         setTab]         = useState<'file' | 'ai'>('file');
    const [parsed,      setParsed]      = useState<ChallengeImportItem[] | null>(null);
    const [selected,    setSelected]    = useState<Set<number>>(new Set());
    const [aiPrompt,    setAiPrompt]    = useState('');
    const [aiCount,     setAiCount]     = useState(3);
    const [aiLoading,   setAiLoading]   = useState(false);
    const [importing,   setImporting]   = useState(false);
    const [results,     setResults]     = useState<ImportResult[] | null>(null);
    const [error,       setError]       = useState('');
    const [showTemplate,setShowTemplate]= useState(true);
    const fileRef = useRef<HTMLInputElement>(null);

    const loadChallenges = (list: ChallengeImportItem[]) => {
        setParsed(list);
        setSelected(new Set(list.map((_, i) => i)));
        setResults(null);
        setError('');
    };

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                const list = Array.isArray(json) ? json : [json];
                loadChallenges(list);
            } catch {
                setError('Невалидный JSON-файл');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        setError('');
        try {
            const list = await AdminApiService.generateChallengesAI(aiPrompt, aiCount);
            loadChallenges(list);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Ошибка генерации');
        } finally {
            setAiLoading(false);
        }
    };

    const toggleAll = () => {
        if (!parsed) return;
        if (selected.size === parsed.length) setSelected(new Set());
        else setSelected(new Set(parsed.map((_, i) => i)));
    };

    const toggle = (i: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const handleImport = async () => {
        if (!parsed || selected.size === 0) return;
        setImporting(true);
        setError('');
        try {
            const toImport = parsed.filter((_, i) => selected.has(i));
            const { results: r } = await AdminApiService.importChallenges(toImport);
            setResults(r);
            onImported();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Ошибка импорта');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const blob = new Blob([JSON.stringify(JSON_TEMPLATE, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'challenges_template.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return createPortal(
        <div className="ciem-overlay" onClick={onClose}>
            <div className="ciem-modal" onClick={e => e.stopPropagation()}>
                <div className="ciem-header">
                    <span className="ciem-title">Импорт задач</span>
                    <button className="ciem-close" onClick={onClose}>✕</button>
                </div>

                <div className="ciem-tabs">
                    <button className={`ciem-tab${tab === 'file' ? ' ciem-tab--active' : ''}`} onClick={() => setTab('file')}>
                        Загрузить JSON
                    </button>
                    <button className={`ciem-tab${tab === 'ai' ? ' ciem-tab--active' : ''}`} onClick={() => setTab('ai')}>
                        Генерация через ИИ
                    </button>
                </div>

                <div className="ciem-body">
                    {tab === 'file' && !parsed && (
                        <>
                            <div className="ciem-template-header" onClick={() => setShowTemplate(v => !v)}>
                                <span>Пример шаблона JSON</span>
                                <span className="ciem-template-arrow">{showTemplate ? '▲' : '▼'}</span>
                                <button className="ciem-template-dl" onClick={e => { e.stopPropagation(); downloadTemplate(); }}>
                                    Скачать шаблон
                                </button>
                            </div>
                            {showTemplate && (
                                <pre className="ciem-template-code">{JSON.stringify(JSON_TEMPLATE, null, 2)}</pre>
                            )}
                            <div className="ciem-upload-zone" onClick={() => fileRef.current?.click()}>
                                <span className="ciem-upload-text">Перетащите JSON-файл сюда или нажмите для выбора</span>
                                <input ref={fileRef} type="file" accept=".json" className="ciem-file-input" onChange={handleFile} />
                            </div>
                        </>
                    )}

                    {tab === 'ai' && !parsed && (
                        <div className="ciem-ai-section">
                            <label className="ciem-label">Описание задач</label>
                            <textarea
                                className="ciem-textarea"
                                placeholder="Например: задачи на сортировку массивов средней сложности"
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                rows={4}
                            />
                            <div className="ciem-ai-row">
                                <label className="ciem-label">Количество задач</label>
                                <div className="ciem-count-wrap">
                                    {[1, 2, 3, 5, 10].map(n => (
                                        <button key={n} className={`ciem-count-btn${aiCount === n ? ' ciem-count-btn--active' : ''}`} onClick={() => setAiCount(n)}>{n}</button>
                                    ))}
                                </div>
                            </div>
                            <button className="ciem-btn ciem-btn--primary" disabled={aiLoading || !aiPrompt.trim()} onClick={handleGenerate}>
                                {aiLoading ? <span className="ciem-spinner" /> : null}
                                {aiLoading ? 'Генерирую...' : 'Сгенерировать'}
                            </button>
                        </div>
                    )}

                    {parsed && !results && (
                        <div className="ciem-list">
                            <div className="ciem-list-header">
                                <label className="ciem-check-row ciem-check-row--all">
                                    <input type="checkbox" checked={selected.size === parsed.length} onChange={toggleAll} />
                                    <span>Выбрать все ({parsed.length})</span>
                                </label>
                                <button className="ciem-btn-ghost" onClick={() => { setParsed(null); setSelected(new Set()); }}>
                                    ← Назад
                                </button>
                            </div>
                            <div className="ciem-list-items">
                                {parsed.map((ch, i) => (
                                    <label key={i} className={`ciem-check-row${selected.has(i) ? ' ciem-check-row--checked' : ''}`}>
                                        <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} />
                                        <div className="ciem-item-info">
                                            <span className="ciem-item-name">{ch.name || `Задача ${i + 1}`}</span>
                                            <span className="ciem-item-meta">
                                                Сложность: {ch.difficulty} · {ch.funcName}() · тестов: {ch.testCases?.length ?? 0}
                                                {ch.topics?.length ? ` · ${ch.topics.join(', ')}` : ''}
                                            </span>
                                        </div>
                                        <span className={`ciem-diff-badge ciem-diff-${ch.difficulty <= 3 ? 'easy' : ch.difficulty <= 7 ? 'med' : 'hard'}`}>
                                            {ch.difficulty}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <div className="ciem-footer">
                                <span className="ciem-footer-count">Выбрано: {selected.size} из {parsed.length}</span>
                                <button className="ciem-btn ciem-btn--primary" disabled={importing || selected.size === 0} onClick={handleImport}>
                                    {importing ? <span className="ciem-spinner" /> : null}
                                    {importing ? 'Импортирую...' : `Импортировать (${selected.size})`}
                                </button>
                            </div>
                        </div>
                    )}

                    {results && (
                        <div className="ciem-results">
                            <div className="ciem-results-title">Результат импорта</div>
                            {results.map((r, i) => (
                                <div key={i} className={`ciem-result-row ciem-result-row--${r.status}`}>
                                    <span className="ciem-result-icon">{r.status === 'created' ? '✓' : '✕'}</span>
                                    <span className="ciem-result-name">{r.name}</span>
                                    {r.status === 'error' && <span className="ciem-result-err">{r.error}</span>}
                                </div>
                            ))}
                            <div className="ciem-footer">
                                <span className="ciem-footer-count">
                                    Создано: {results.filter(r => r.status === 'created').length} /
                                    Ошибок: {results.filter(r => r.status === 'error').length}
                                </span>
                                <button className="ciem-btn ciem-btn--primary" onClick={onClose}>Закрыть</button>
                            </div>
                        </div>
                    )}

                    {error && <div className="ciem-error">{error}</div>}
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ─── Export Modal ─────────────────────────────────────────────────────── */

interface ExportModalProps {
    rows: ChallengeManageRow[];
    onClose: () => void;
}

export function ChallengeExportModal({ rows, onClose }: ExportModalProps) {
    const [selected,  setSelected]  = useState<Set<number>>(new Set(rows.map(r => r.id)));
    const [exporting, setExporting] = useState(false);
    const [error,     setError]     = useState('');
    const [search,    setSearch]    = useState('');

    const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    const toggleAll = () => {
        const visibleIds = filtered.map(r => r.id);
        const allSelected = visibleIds.every(id => selected.has(id));
        setSelected(prev => {
            const next = new Set(prev);
            if (allSelected) visibleIds.forEach(id => next.delete(id));
            else visibleIds.forEach(id => next.add(id));
            return next;
        });
    };

    const toggle = (id: number) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleExport = async () => {
        if (selected.size === 0) return;
        setExporting(true);
        setError('');
        try {
            const data = await AdminApiService.exportChallenges([...selected]);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `challenges_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Ошибка экспорта');
        } finally {
            setExporting(false);
        }
    };

    return createPortal(
        <div className="ciem-overlay" onClick={onClose}>
            <div className="ciem-modal" onClick={e => e.stopPropagation()}>
                <div className="ciem-header">
                    <span className="ciem-title">Экспорт задач</span>
                    <button className="ciem-close" onClick={onClose}>✕</button>
                </div>
                <div className="ciem-body">
                    <div className="ciem-list">
                        <div className="ciem-list-header">
                            <label className="ciem-check-row ciem-check-row--all">
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && filtered.every(r => selected.has(r.id))}
                                    onChange={toggleAll}
                                />
                                <span>Выбрать все на странице</span>
                            </label>
                            <input
                                className="ciem-search"
                                placeholder="Поиск..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="ciem-list-items">
                            {filtered.map(r => (
                                <label key={r.id} className={`ciem-check-row${selected.has(r.id) ? ' ciem-check-row--checked' : ''}`}>
                                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                                    <div className="ciem-item-info">
                                        <span className="ciem-item-name">{r.name}</span>
                                        <span className="ciem-item-meta">
                                            {r.funcName}()
                                            {r.topics?.length ? ` · ${r.topics.map(t => t.name).join(', ')}` : ''}
                                        </span>
                                    </div>
                                    <span className={`ciem-diff-badge ciem-diff-${r.difficulty <= 3 ? 'easy' : r.difficulty <= 7 ? 'med' : 'hard'}`}>
                                        {r.difficulty}
                                    </span>
                                </label>
                            ))}
                            {filtered.length === 0 && <div className="ciem-empty">Задачи не найдены</div>}
                        </div>
                        <div className="ciem-footer">
                            <span className="ciem-footer-count">Выбрано: {selected.size}</span>
                            <button className="ciem-btn ciem-btn--primary" disabled={exporting || selected.size === 0} onClick={handleExport}>
                                {exporting ? <span className="ciem-spinner" /> : null}
                                {exporting ? 'Экспортирую...' : `Скачать JSON (${selected.size})`}
                            </button>
                        </div>
                    </div>
                    {error && <div className="ciem-error">{error}</div>}
                </div>
            </div>
        </div>,
        document.body
    );
}
