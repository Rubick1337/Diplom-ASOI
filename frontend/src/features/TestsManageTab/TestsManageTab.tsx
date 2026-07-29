'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, Download, Eye, EyeOff, FileText } from 'lucide-react';
import type { TestListItem } from '@/shared/services/TestApiService';
import CustomSelect from '@/shared/components/CustomSelect/CustomSelect';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchAdminTests,
    adminCreateTest,
    adminDeleteTest,
    adminPublishTest,
    adminImportMoodle,
    adminImportQuizApi,
    clearImportResult,
} from '@/shared/store/slice/adminTestSlice';
import { fetchTestTopics } from '@/shared/store/slice/testSlice';
import TestApiService from '@/shared/services/TestApiService';
import './TestsManageTab.css';

// ── Меню строки ───────────────────────────────────────────────────────────────

function RowMenu({ test, onPublish, onExport, onEdit, onDelete, isExporting, isDeleting }: {
    test: TestListItem;
    onPublish: () => void; onExport: () => void;
    onEdit: () => void; onDelete: () => void;
    isExporting: boolean; isDeleting: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top: 0, right: 0 });
    const ref    = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const close    = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onScroll = () => setOpen(false);
        document.addEventListener('mousedown', close);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', close);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open]);

    const handleOpen = () => {
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
        }
        setOpen(v => !v);
    };

    const act = (fn: () => void) => { fn(); setOpen(false); };

    return (
        <div className="tm-menu" ref={ref}>
            <button ref={btnRef} className="tm-menu__btn" onClick={handleOpen} title="Действия">⋯</button>
            {open && (
                <div className="tm-menu__dropdown" style={{ position: 'fixed', top: pos.top, right: pos.right }}>
                    <button className="tm-menu__item tm-menu__item--toggle" onClick={() => act(onPublish)}>
                        {test.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                        {test.isPublished ? 'Снять с публикации' : 'Опубликовать'}
                    </button>
                    <button className="tm-menu__item tm-menu__item--export" onClick={() => act(onExport)} disabled={isExporting}>
                        <Download size={13} />
                        Экспорт XML
                    </button>
                    <button className="tm-menu__item tm-menu__item--edit" onClick={() => act(onEdit)}>
                        <img src="/images/edit.png" alt="" />
                        Редактировать
                    </button>
                    <div className="tm-menu__divider" />
                    <button className="tm-menu__item tm-menu__item--delete" onClick={() => act(onDelete)} disabled={isDeleting}>
                        <img src="/images/trash.png" alt="" />
                        Удалить
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Вспомогательные компоненты ────────────────────────────────────────────────

function KpiCard({ value, label, color }: { value: number | string; label: string; color?: string }) {
    return (
        <div className={`tm-kpi ${color ? `tm-kpi--${color}` : ''}`}>
            <span className="tm-kpi__value">{value}</span>
            <span className="tm-kpi__label">{label}</span>
        </div>
    );
}

// ── Модальное окно создания теста ─────────────────────────────────────────────

interface CreateModalProps {
    onClose: () => void;
    onCreated: (id: number) => void;
}

const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function CreateTestModal({ onClose, onCreated }: CreateModalProps) {
    const dispatch = useAppDispatch();
    const { isSaving, error } = useAppSelector(s => s.adminTest);
    const { topics } = useAppSelector(s => s.test);

    const [title,       setTitle]       = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit,   setTimeLimit]   = useState('');
    const [topicId,     setTopicId]     = useState<number | ''>('');
    const [difficulty,  setDifficulty]  = useState<number | ''>('');

    useEffect(() => { dispatch(fetchTestTopics()); }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        const result = await dispatch(adminCreateTest({
            title: title.trim(),
            description:      description.trim() || undefined,
            timeLimitMinutes: timeLimit   ? Number(timeLimit)  : null,
            topicId:          topicId    ? Number(topicId)    : null,
            difficulty:       difficulty ? Number(difficulty) : null,
        }));
        if (adminCreateTest.fulfilled.match(result)) {
            onCreated(result.payload.id);
        }
    };

    return (
        <div className="tm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="tm-modal">
                <h2 className="tm-modal__title">Новый тест</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="tm-field">
                        <label className="tm-label">Название *</label>
                        <input className="tm-input" value={title} onChange={e => setTitle(e.target.value)}
                               placeholder="Тест по основам Python" autoFocus />
                    </div>
                    <div className="tm-field">
                        <label className="tm-label">Описание</label>
                        <textarea className="tm-textarea" value={description}
                                  onChange={e => setDescription(e.target.value)}
                                  placeholder="Краткое описание теста (необязательно)" rows={3} />
                    </div>
                    <div className="tm-field" style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label className="tm-label">Лимит времени (мин.)</label>
                            <input className="tm-input" type="number" min={1} value={timeLimit}
                                   onChange={e => setTimeLimit(e.target.value)} placeholder="без лимита" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="tm-label">Сложность (1–10)</label>
                            <CustomSelect
                                value={String(difficulty)}
                                onChange={v => setDifficulty(v ? Number(v) : '')}
                                options={[
                                    { value: '', label: '—' },
                                    ...DIFFICULTY_LEVELS.map(n => ({ value: String(n), label: String(n) })),
                                ]}
                                placeholder="—"
                            />
                        </div>
                    </div>
                    <div className="tm-field">
                        <label className="tm-label">Категория</label>
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
                    {error && <div className="tm-modal__error">{error}</div>}
                    <div className="tm-modal__actions">
                        <button type="button" className="tm-btn tm-btn--ghost" onClick={onClose}>Отмена</button>
                        <button type="submit" className="tm-btn tm-btn--primary" disabled={!title.trim() || isSaving}>
                            {isSaving ? 'Создание…' : 'Создать и редактировать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Модальное окно импорта ────────────────────────────────────────────────────

interface ImportModalProps { onClose: () => void; onDone: () => void; }

function ImportModal({ onClose, onDone }: ImportModalProps) {
    const dispatch = useAppDispatch();
    const { isSaving, error, importResult } = useAppSelector(s => s.adminTest);
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);

    const handleImport = async () => {
        if (!file) return;
        const result = await dispatch(adminImportMoodle(file));
        if (adminImportMoodle.fulfilled.match(result)) {
            // ждём секунду чтобы показать результат, потом закрываем
        }
    };

    const handleClose = () => {
        dispatch(clearImportResult());
        onDone();
        onClose();
    };

    return (
        <div className="tm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="tm-modal">
                <h2 className="tm-modal__title">Импорт из Moodle XML</h2>

                {!importResult ? (
                    <>
                        <div className="tm-field">
                            <label className="tm-label">XML-файл (.xml)</label>
                            <input ref={fileRef} type="file" accept=".xml"
                                   style={{ display: 'none' }}
                                   onChange={e => setFile(e.target.files?.[0] ?? null)} />
                            <button className="tm-btn tm-btn--ghost" onClick={() => fileRef.current?.click()}>
                                <Upload size={13} />
                                {file ? file.name : 'Выбрать файл'}
                            </button>
                        </div>
                        {error && <div className="tm-modal__error">{error}</div>}
                        <div className="tm-modal__actions">
                            <button className="tm-btn tm-btn--ghost" onClick={onClose}>Отмена</button>
                            <button className="tm-btn tm-btn--primary" disabled={!file || isSaving} onClick={handleImport}>
                                {isSaving ? 'Импорт…' : 'Импортировать'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="tm-import-result">
                            <strong>Тест создан: «{importResult.title}»</strong>
                            <span>Импортировано вопросов: {importResult.imported}</span>
                            {importResult.skipped > 0 && (
                                <span style={{ color: '#f87171' }}>Пропущено: {importResult.skipped}</span>
                            )}
                        </div>
                        {importResult.skipped > 0 && (
                            <div className="tm-import-warn">
                                ⚠️ Некоторые вопросы не удалось распознать — возможно, нестандартный тип Moodle.
                            </div>
                        )}
                        <div className="tm-modal__actions">
                            <button className="tm-btn tm-btn--primary" onClick={handleClose}>Готово</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Модальное окно импорта из Quiz API ───────────────────────────────────────

const QUIZ_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

interface ImportQuizApiModalProps { onClose: () => void; onDone: () => void; }

function ImportQuizApiModal({ onClose, onDone }: ImportQuizApiModalProps) {
    const dispatch = useAppDispatch();
    const { isSaving, error, importResult } = useAppSelector(s => s.adminTest);

    const [tags,       setTags]       = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [limit,      setLimit]      = useState(10);
    const [title,      setTitle]      = useState('');

    const handleImport = () => {
        dispatch(adminImportQuizApi({
            tags:       tags || undefined,
            difficulty: difficulty || undefined,
            limit,
            title:      title.trim() || undefined,
        }));
    };

    const handleClose = () => {
        dispatch(clearImportResult());
        onDone();
        onClose();
    };

    return (
        <div className="tm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="tm-modal">
                <h2 className="tm-modal__title">Импорт из Quiz API</h2>

                {!importResult ? (
                    <>
                        <div className="tm-field">
                            <label className="tm-label">Тема (Python, Rust, SQL, Docker…)</label>
                            <input
                                className="tm-input"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                placeholder="Введите тему, например: Rust"
                                autoFocus
                            />
                        </div>
                        <div className="tm-field" style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <label className="tm-label">Сложность</label>
                                <CustomSelect
                                    value={difficulty}
                                    onChange={setDifficulty}
                                    options={[
                                        { value: '', label: 'Любая' },
                                        ...QUIZ_DIFFICULTIES.map(d => ({ value: d, label: d })),
                                    ]}
                                    placeholder="Любая"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="tm-label">Количество (1–20)</label>
                                <input
                                    className="tm-input"
                                    type="number"
                                    min={1} max={20}
                                    value={limit}
                                    onChange={e => setLimit(Math.min(20, Math.max(1, Number(e.target.value))))}
                                />
                            </div>
                        </div>
                        <div className="tm-field">
                            <label className="tm-label">Название теста (необязательно)</label>
                            <input
                                className="tm-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder={`Quiz API: ${tags || 'programming'} (авто)`}
                            />
                        </div>
                        {error && <div className="tm-modal__error">{error}</div>}
                        <div className="tm-modal__actions">
                            <button className="tm-btn tm-btn--ghost" onClick={onClose}>Отмена</button>
                            <button className="tm-btn tm-btn--primary" disabled={isSaving} onClick={handleImport}>
                                {isSaving ? 'Загрузка…' : 'Импортировать'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="tm-import-result">
                            <strong>Тест создан: «{importResult.title}»</strong>
                            <span>Импортировано вопросов: {importResult.imported}</span>
                            {importResult.skipped > 0 && (
                                <span style={{ color: '#f87171' }}>Пропущено: {importResult.skipped}</span>
                            )}
                        </div>
                        <div className="tm-modal__actions">
                            <button className="tm-btn tm-btn--primary" onClick={handleClose}>Готово</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Основной компонент ────────────────────────────────────────────────────────

export default function TestsManageTab() {
    const dispatch = useAppDispatch();
    const router   = useRouter();
    const { tests, isLoading } = useAppSelector(s => s.adminTest);

    const [search,          setSearch]          = useState('');
    const [page,            setPage]            = useState(1);
    const [pageSize,        setPageSize]        = useState(10);
    const [showCreate,      setShowCreate]      = useState(false);
    const [showImport,      setShowImport]      = useState(false);
    const [showImportQuiz,  setShowImportQuiz]  = useState(false);
    const [deletingId,      setDeletingId]      = useState<number | null>(null);
    const [exportingId,     setExportingId]     = useState<number | null>(null);

    useEffect(() => { dispatch(fetchAdminTests()); }, [dispatch]);
    useEffect(() => { setPage(1); }, [search]);

    const filtered   = tests.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

    const total     = tests.length;
    const published = tests.filter(t => t.isPublished).length;
    const draft     = total - published;
    const questions = tests.reduce((s, t) => s + (t.questionCount ?? 0), 0);

    const handleCreated = (id: number) => {
        setShowCreate(false);
        router.push(`/admin/tests/${id}`);
    };

    const handleEdit = (id: number) => router.push(`/admin/tests/${id}`);

    const handlePublish = (id: number, current: boolean) => {
        dispatch(adminPublishTest({ id, isPublished: !current }));
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить тест? Все попытки будут удалены.')) return;
        setDeletingId(id);
        await dispatch(adminDeleteTest(id));
        setDeletingId(null);
    };

    const handleExport = async (id: number, title?: string) => {
        setExportingId(id);
        try {
            const { blob, filename, hasCode } = await TestApiService.exportMoodle(id, title);
            if (hasCode && !confirm('Тест содержит вопросы с кодом. При экспорте они станут essay (без выполнения). Продолжить?')) {
                return;
            }
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert(e?.response?.data?.message || e.message || 'Ошибка экспорта');
        } finally {
            setExportingId(null);
        }
    };

    return (
        <div className="tm-section">
            {/* Заголовок */}
            <div className="tm-section__header">
                <div className="tm-section__accent" />
                <h2 className="tm-section__title">Управление тестами</h2>
                <span className="tm-section__badge">{total} тестов</span>
            </div>

            {/* KPI */}
            <div className="tm-kpi-row">
                <KpiCard value={total}     label="Всего тестов" />
                <KpiCard value={published} label="Опубликовано" color="green" />
                <KpiCard value={draft}     label="Черновики"    color="yellow" />
                <KpiCard value={questions} label="Вопросов"     color="blue" />
            </div>

            {/* Тулбар */}
            <div className="tm-toolbar">
                <input
                    className="tm-toolbar__search"
                    placeholder="Поиск по названию…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="tm-page-size-wrap">
                    <span className="tm-page-size-label">На странице:</span>
                    <CustomSelect
                        small
                        value={String(pageSize)}
                        onChange={v => { setPageSize(Number(v)); setPage(1); }}
                        options={[5, 10, 20, 50].map(n => ({ value: String(n), label: String(n) }))}
                    />
                </div>
                <button className="tm-btn tm-btn--ghost" onClick={() => setShowImport(true)}>
                    <Upload size={13} /> Импорт XML
                </button>
                <button className="tm-btn tm-btn--ghost" onClick={() => setShowImportQuiz(true)}>
                    <FileText size={13} /> Quiz API
                </button>
                <button className="tm-btn tm-btn--primary" onClick={() => setShowCreate(true)}>
                    <Plus size={13} /> Создать тест
                </button>
            </div>

            {/* Таблица */}
            <div className="tm-table-wrap">
                {isLoading ? (
                    <div className="tm-empty">Загрузка…</div>
                ) : filtered.length === 0 ? (
                    <div className="tm-empty">
                        {search ? 'Ничего не найдено' : 'Тестов пока нет. Создайте первый или импортируйте из Moodle.'}
                    </div>
                ) : (
                    <table className="tm-table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Вопросов</th>
                                <th>Лимит</th>
                                <th>Статус</th>
                                <th style={{ textAlign: 'right' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(test => {
                                const hasCode = false; // на этапе списка неизвестно — узнаём при экспорте
                                return (
                                    <tr key={test.id}>
                                        <td className="tm-title-cell">
                                            <span>{test.title}</span>
                                            {test.description && (
                                                <span className="tm-desc-cell">{test.description}</span>
                                            )}
                                        </td>
                                        <td>{test.questionCount}</td>
                                        <td>{test.timeLimitMinutes ? `${test.timeLimitMinutes} мин` : '—'}</td>
                                        <td>
                                            <span className={`tm-badge ${test.isPublished ? 'tm-badge--pub' : 'tm-badge--draft'}`}>
                                                {test.isPublished ? 'Опубликован' : 'Черновик'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <RowMenu
                                                test={test}
                                                onPublish={() => handlePublish(test.id, !!test.isPublished)}
                                                onExport={() => handleExport(test.id, test.title)}
                                                onEdit={() => handleEdit(test.id)}
                                                onDelete={() => handleDelete(test.id)}
                                                isExporting={exportingId === test.id}
                                                isDeleting={deletingId === test.id}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Пагинация */}
            {!isLoading && totalCount > 0 && (
                <div className="tm-pagination">
                    <button className="tm-page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                    <button className="tm-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                        .reduce<(number | '...')[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                            acc.push(p); return acc;
                        }, [])
                        .map((p, i) => p === '...'
                            ? <span key={`e${i}`} className="tm-page-ellipsis">…</span>
                            : <button key={p} className={`tm-page-btn${page === p ? ' tm-page-btn--active' : ''}`} onClick={() => setPage(p as number)}>{p}</button>
                        )
                    }
                    <button className="tm-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                    <button className="tm-page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                    <span className="tm-page-info">
                        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} из {totalCount}
                    </span>
                </div>
            )}

            {/* Модалки */}
            {showCreate     && <CreateTestModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
            {showImport     && <ImportModal onClose={() => setShowImport(false)} onDone={() => dispatch(fetchAdminTests())} />}
            {showImportQuiz && <ImportQuizApiModal onClose={() => setShowImportQuiz(false)} onDone={() => dispatch(fetchAdminTests())} />}
        </div>
    );
}
