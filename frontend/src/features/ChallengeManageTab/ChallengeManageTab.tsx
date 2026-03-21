'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './ChallengeManageTab.css';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchChallengesManage,
    adminToggleChallengeHidden,
    adminDeleteChallenge,
} from '@/shared/store/slice/adminManageSlice';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import CustomSelect from '@/shared/components/CustomSelect/CustomSelect';
import type { ChallengeManageRow } from '@/shared/services/AdminApiService';

const PAGE_SIZES = [5, 10, 20, 50];

function getDiffColor(n: number) {
    if (n <= 3) return '#4ade80';
    if (n <= 7) return '#fbbf24';
    return '#f87171';
}

function RowMenu({ row, onEdit, onToggle, onDelete, onOpen }: {
    row: ChallengeManageRow;
    onEdit: () => void; onToggle: () => void;
    onDelete: () => void; onOpen: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const act = (fn: () => void) => { fn(); setOpen(false); };

    return (
        <div className="cm-menu" ref={ref}>
            <button className="cm-menu__btn" onClick={() => setOpen(v => !v)} title="Действия">⋯</button>
            {open && (
                <div className="cm-menu__dropdown">
                    <button className="cm-menu__item cm-menu__item--open"   onClick={() => act(onOpen)}>↗ Открыть</button>
                    <button className="cm-menu__item cm-menu__item--edit"   onClick={() => act(onEdit)}>✎ Редактировать</button>
                    <button className="cm-menu__item cm-menu__item--toggle" onClick={() => act(onToggle)}>
                        {row.isHidden ? '◎ Показать' : '◉ Скрыть'}
                    </button>
                    <div className="cm-menu__divider" />
                    <button className="cm-menu__item cm-menu__item--delete" onClick={() => act(onDelete)}>✕ Удалить</button>
                </div>
            )}
        </div>
    );
}

export default function ChallengeManageTab() {
    const dispatch = useAppDispatch();
    const router   = useRouter();
    const { challengesManage, topics, isLoading } = useAppSelector(s => s.adminManage);

    const [search,       setSearch]       = useState('');
    const [topicId,      setTopicId]      = useState('');
    const [page,         setPage]         = useState(1);
    const [limit,        setLimit]        = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [actionError,  setActionError]  = useState('');

    useEffect(() => {
        dispatch(fetchChallengesManage({ page: 1, limit: 10 }));

    }, []);

    const load = useCallback((p = page, s = search, t = topicId, lim = limit) => {
        dispatch(fetchChallengesManage({
            page: p, limit: lim,
            search:  s || undefined,
            topicId: t ? Number(t) : undefined,
        }));
    }, [dispatch, page, search, topicId, limit]);

    const hiddenOnPage  = challengesManage.rows.filter(r => r.isHidden).length;
    const visibleOnPage = challengesManage.rows.length - hiddenOnPage;

    const applyFilters      = () => { setPage(1); load(1, search, topicId, limit); };
    const resetFilters      = () => { setSearch(''); setTopicId(''); setPage(1); load(1, '', '', limit); };
    const goTo              = (p: number) => { setPage(p); load(p, search, topicId, limit); };
    const handleLimitChange = (val: string) => {
        const n = Number(val);
        setLimit(n);
        setPage(1);
        load(1, search, topicId, n);
    };

    const handleToggleHidden = async (id: number, isHidden: boolean) => {
        setActionError('');
        const res = await dispatch(adminToggleChallengeHidden({ id, isHidden: !isHidden }));
        if (adminToggleChallengeHidden.rejected.match(res)) setActionError(res.payload as string);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setActionError('');
        const res = await dispatch(adminDeleteChallenge(deleteTarget.id));
        if (adminDeleteChallenge.rejected.match(res)) setActionError(res.payload as string);
        setDeleteTarget(null);
    };

    const totalPages = Math.ceil(challengesManage.total / limit) || 1;
    const rows = challengesManage.rows;

    const topicOptions = [
        { value: '', label: 'Все темы' },
        ...topics.map(t => ({ value: String(t.id), label: t.name })),
    ];

    const pageSizeOptions = PAGE_SIZES.map(n => ({ value: String(n), label: `${n} записей` }));

    return (
        <section className="cm-section">

            {}
            <div className="cm-section__header">
                <div className="cm-section__accent" />
                <h2 className="cm-section__title">Управление задачами</h2>
                <span className="cm-section__badge">{challengesManage.total} задач</span>
                <button className="cm-filter-btn cm-filter-btn--add" onClick={() => router.push('/challenge/create')}>
                    + Добавить задачу
                </button>
            </div>

            {}
            <div className="cm-kpi-row">
                <div className="cm-kpi">
                    <span className="cm-kpi__value">{challengesManage.total}</span>
                    <span className="cm-kpi__label">Всего задач</span>
                </div>
                <div className="cm-kpi cm-kpi--green">
                    <span className="cm-kpi__value">{visibleOnPage}</span>
                    <span className="cm-kpi__label">Видимых (стр.)</span>
                </div>
                <div className="cm-kpi cm-kpi--red">
                    <span className="cm-kpi__value">{hiddenOnPage}</span>
                    <span className="cm-kpi__label">Скрытых (стр.)</span>
                </div>
                <div className="cm-kpi cm-kpi--blue">
                    <span className="cm-kpi__value">{topics.length}</span>
                    <span className="cm-kpi__label">Тем</span>
                </div>
            </div>

            {}
            <div className="cm-filters-card">
                <div className="cm-filters-grid">
                    <div className="cm-filter-group">
                        <label className="cm-filter-label">Поиск по названию</label>
                        <input
                            className="cm-filter-input"
                            placeholder="Название задачи..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                        />
                    </div>
                    <div className="cm-filter-group">
                        <label className="cm-filter-label">Тема</label>
                        <CustomSelect
                            value={topicId}
                            onChange={setTopicId}
                            options={topicOptions}
                            placeholder="Все темы"
                        />
                    </div>
                </div>
                <div className="cm-filters-actions">
                    <button className="cm-filter-btn cm-filter-btn--primary" onClick={applyFilters}>Применить</button>
                    {(search || topicId) && (
                        <button className="cm-filter-btn cm-filter-btn--ghost" onClick={resetFilters}>Сбросить</button>
                    )}
                    <div className="cm-page-size-wrap">
                        <label className="cm-filter-label" style={{ margin: 0 }}>На странице:</label>
                        <CustomSelect
                            small
                            value={String(limit)}
                            onChange={handleLimitChange}
                            options={pageSizeOptions}
                        />
                    </div>
                </div>
            </div>

            {actionError && <div className="cm-error">{actionError}</div>}

            {}
            <div className="cm-card">
                {isLoading ? (
                    <div className="cm-spinner-wrap"><div className="cm-spinner" /></div>
                ) : (
                    <div key={page} className="cm-table-scroll">
                        <table className="cm-table">
                            <thead>
                                <tr>
                                    <th className="cm-th">Название</th>
                                    <th className="cm-th">Тема</th>
                                    <th className="cm-th cm-th--center">Сложность</th>
                                    <th className="cm-th">Статус</th>
                                    <th className="cm-th cm-th--right">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr><td colSpan={5} className="cm-td cm-empty">Задачи не найдены</td></tr>
                                ) : rows.map(r => (
                                    <tr key={r.id} className="cm-row">
                                        <td className="cm-td cm-td--bold cm-td--link" onClick={() => router.push(`/challenges/${r.id}`)}>
                                            {r.name}
                                        </td>
                                        <td className="cm-td cm-td--muted">{r.topics?.length ? r.topics.map(t => t.name).join(', ') : '—'}</td>
                                        <td className="cm-td cm-td--center">
                                            <div className="cm-diff-box" style={{ borderColor: getDiffColor(r.difficulty), color: getDiffColor(r.difficulty) }}>
                                                {r.difficulty}
                                            </div>
                                        </td>
                                        <td className="cm-td">
                                            <span className={`cm-chip ${r.isHidden ? 'cm-chip--hidden' : 'cm-chip--visible'}`}>
                                                {r.isHidden ? 'Скрыта' : 'Видна'}
                                            </span>
                                        </td>
                                        <td className="cm-td cm-td--right">
                                            <RowMenu
                                                row={r}
                                                onOpen={()    => router.push(`/challenges/${r.id}`)}
                                                onEdit={()    => router.push(`/challenge/edit/${r.id}`)}
                                                onToggle={()  => handleToggleHidden(r.id, r.isHidden)}
                                                onDelete={()  => setDeleteTarget({ id: r.id, name: r.name })}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && totalPages > 1 && (
                    <div className="cm-pagination">
                        <button className="cm-page-btn" disabled={page === 1} onClick={() => goTo(1)}>«</button>
                        <button className="cm-page-btn" disabled={page === 1} onClick={() => goTo(page - 1)}>‹</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                            .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                acc.push(p); return acc;
                            }, [])
                            .map((p, i) => p === '...'
                                ? <span key={`e${i}`} className="cm-page-ellipsis">…</span>
                                : <button key={p} className={`cm-page-btn${page === p ? ' cm-page-btn--active' : ''}`} onClick={() => goTo(p as number)}>{p}</button>
                            )
                        }
                        <button className="cm-page-btn" disabled={page === totalPages} onClick={() => goTo(page + 1)}>›</button>
                        <button className="cm-page-btn" disabled={page === totalPages} onClick={() => goTo(totalPages)}>»</button>
                        <span className="cm-page-info">{(page - 1) * limit + 1}–{Math.min(page * limit, challengesManage.total)} из {challengesManage.total}</span>
                    </div>
                )}
            </div>

            {deleteTarget && (
                <ConfirmationModal
                    isOpen
                    title="Удаление задачи"
                    message={`Удалить задачу «${deleteTarget.name}»? Это действие необратимо.`}
                    confirmText="Удалить"
                    type="danger"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </section>
    );
}
