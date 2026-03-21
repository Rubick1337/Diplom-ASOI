'use client';

import React, { useState, useMemo } from 'react';
import './TopicsTab.css';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    adminCreateTopic,
    adminUpdateTopic,
    adminDeleteTopic,
} from '@/shared/store/slice/adminManageSlice';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal/ConfirmationModal';
import CustomSelect from '@/shared/components/CustomSelect/CustomSelect';

type SortKey = 'name' | 'challenges' | 'submissions';
const PAGE_SIZES = [5, 10, 20];

function fmtNum(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n); }

function StatsPanel({ enriched, maxSubmissions }: {
    enriched: { id: number; name: string; total: number; submissions: number; successes: number; successRate: number }[];
    maxSubmissions: number;
}) {
    const byPop     = [...enriched].sort((a, b) => b.submissions - a.submissions).slice(0, 8);
    const byChallenges = [...enriched].sort((a, b) => b.total - a.total).slice(0, 5);
    const bestRate  = [...enriched].filter(t => t.submissions >= 10).sort((a, b) => b.successRate - a.successRate).slice(0, 5);
    const hardest   = [...enriched].filter(t => t.submissions >= 10).sort((a, b) => a.successRate - b.successRate).slice(0, 5);

    const tierColor = (submissions: number) => {
        const p = maxSubmissions > 0 ? submissions / maxSubmissions : 0;
        if (p > 0.6) return '#FF6B35';
        if (p > 0.25) return '#fbbf24';
        if (submissions > 0) return '#38bdf8';
        return '#2a2a2a';
    };

    return (
        <aside className="tt-stats-panel">

            {}
            <div className="tt-stats-block">
                <div className="tt-stats-block__title">
                    <span className="tt-stats-block__icon" style={{ color: '#FF6B35' }}>↗</span>
                    Топ по популярности
                </div>
                {byPop.length === 0 ? (
                    <p className="tt-stats-empty">Нет данных о попытках</p>
                ) : byPop.map((t, i) => (
                    <div key={t.id} className="tt-stats-row">
                        <span className="tt-stats-rank">#{i + 1}</span>
                        <div className="tt-stats-info">
                            <span className="tt-stats-name" title={t.name}>{t.name}</span>
                            <div className="tt-stats-bar-track">
                                <div
                                    className="tt-stats-bar-fill"
                                    style={{
                                        width: maxSubmissions > 0 ? `${Math.round((t.submissions / maxSubmissions) * 100)}%` : '0%',
                                        background: tierColor(t.submissions),
                                    }}
                                />
                            </div>
                        </div>
                        <span className="tt-stats-val">{fmtNum(t.submissions)}</span>
                    </div>
                ))}
            </div>

            {}
            <div className="tt-stats-block">
                <div className="tt-stats-block__title">
                    <span className="tt-stats-block__icon" style={{ color: '#38bdf8' }}>◈</span>
                    Больше всего задач
                </div>
                {byChallenges.filter(t => t.total > 0).length === 0 ? (
                    <p className="tt-stats-empty">Нет задач ни в одной теме</p>
                ) : byChallenges.filter(t => t.total > 0).map((t, i) => (
                    <div key={t.id} className="tt-stats-row">
                        <span className="tt-stats-rank">#{i + 1}</span>
                        <span className="tt-stats-name tt-stats-name--flex" title={t.name}>{t.name}</span>
                        <span className="tt-stats-badge tt-stats-badge--blue">{t.total} задач</span>
                    </div>
                ))}
            </div>

            {}
            {bestRate.length > 0 && (
                <div className="tt-stats-block">
                    <div className="tt-stats-block__title">
                        <span className="tt-stats-block__icon" style={{ color: '#4ade80' }}>✓</span>
                        Лучший % решений
                    </div>
                    {bestRate.map((t, i) => (
                        <div key={t.id} className="tt-stats-row">
                            <span className="tt-stats-rank">#{i + 1}</span>
                            <span className="tt-stats-name tt-stats-name--flex" title={t.name}>{t.name}</span>
                            <span className={`tt-stats-badge ${t.successRate >= 60 ? 'tt-stats-badge--green' : 'tt-stats-badge--yellow'}`}>
                                {t.successRate}%
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {}
            {hardest.length > 0 && (
                <div className="tt-stats-block">
                    <div className="tt-stats-block__title">
                        <span className="tt-stats-block__icon" style={{ color: '#f87171' }}>✕</span>
                        Самые сложные
                    </div>
                    {hardest.map((t, i) => (
                        <div key={t.id} className="tt-stats-row">
                            <span className="tt-stats-rank">#{i + 1}</span>
                            <span className="tt-stats-name tt-stats-name--flex" title={t.name}>{t.name}</span>
                            <span className="tt-stats-badge tt-stats-badge--red">{t.successRate}%</span>
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
}

export default function TopicsTab() {
    const dispatch       = useAppDispatch();
    const topics         = useAppSelector(s => s.adminManage.topics);
    const challengeStats = useAppSelector(s => s.admin.challengeStats);

    const statMap = useMemo(() => {
        const m: Record<string, { total: number; submissions: number; successes: number }> = {};
        for (const s of challengeStats?.byTopic ?? []) {
            m[s.topic] = { total: s.total, submissions: s.submissions, successes: s.successes };
        }
        return m;
    }, [challengeStats]);

    const enriched = useMemo(() => topics.map(t => {
        const s = statMap[t.name] ?? { total: 0, submissions: 0, successes: 0 };
        return {
            ...t,
            total:       s.total,
            submissions: s.submissions,
            successes:   s.successes,
            successRate: s.submissions > 0 ? Math.round((s.successes / s.submissions) * 100) : 0,
        };
    }), [topics, statMap]);

    const maxSubmissions   = useMemo(() => Math.max(...enriched.map(t => t.submissions), 1), [enriched]);
    const totalChallenges  = useMemo(() => enriched.reduce((s, t) => s + t.total, 0), [enriched]);
    const totalSubmissions = useMemo(() => enriched.reduce((s, t) => s + t.submissions, 0), [enriched]);
    const activeTopics     = useMemo(() => enriched.filter(t => t.submissions > 0).length, [enriched]);

    const [newName,      setNewName]      = useState('');
    const [editId,       setEditId]       = useState<number | null>(null);
    const [editName,     setEditName]     = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [error,        setError]        = useState('');
    const [successMsg,   setSuccessMsg]   = useState('');
    const [sortKey,      setSortKey]      = useState<SortKey>('submissions');
    const [sortDesc,     setSortDesc]     = useState(true);
    const [page,         setPage]         = useState(1);
    const [limit,        setLimit]        = useState(10);

    const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

    const handleCreate = async () => {
        const name = newName.trim();
        if (!name) return;
        setError('');
        const res = await dispatch(adminCreateTopic(name));
        if (adminCreateTopic.fulfilled.match(res)) { setNewName(''); flash('Тема добавлена'); }
        else setError(res.payload as string);
    };

    const startEdit = (id: number, name: string) => { setEditId(id); setEditName(name); setError(''); };

    const handleUpdate = async () => {
        const name = editName.trim();
        if (!name || editId === null) return;
        setError('');
        const res = await dispatch(adminUpdateTopic({ id: editId, name }));
        if (adminUpdateTopic.fulfilled.match(res)) { setEditId(null); setEditName(''); flash('Тема переименована'); }
        else setError(res.payload as string);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setError('');
        const res = await dispatch(adminDeleteTopic(deleteTarget.id));
        if (adminDeleteTopic.rejected.match(res)) setError(res.payload as string);
        else flash('Тема удалена');
        setDeleteTarget(null);
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDesc(v => !v);
        else { setSortKey(key); setSortDesc(true); }
        setPage(1);
    };

    const sorted = useMemo(() => {
        const copy = [...enriched];
        copy.sort((a, b) => {
            const v = sortKey === 'name' ? a.name.localeCompare(b.name)
                    : sortKey === 'challenges' ? a.total - b.total
                    : a.submissions - b.submissions;
            return sortDesc ? -v : v;
        });
        return copy;
    }, [enriched, sortKey, sortDesc]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / limit));
    const pageItems  = sorted.slice((page - 1) * limit, page * limit);

    return (
        <section className="tt-section">

            {}
            <div className="tt-section__header">
                <div className="tt-section__accent" />
                <h2 className="tt-section__title">Управление темами</h2>
                <span className="tt-section__badge">{topics.length} тем</span>
            </div>

            {}
            <div className="tt-kpi-row">
                <div className="tt-kpi">
                    <span className="tt-kpi__value">{topics.length}</span>
                    <span className="tt-kpi__label">Всего тем</span>
                </div>
                <div className="tt-kpi tt-kpi--orange">
                    <span className="tt-kpi__value">{totalChallenges}</span>
                    <span className="tt-kpi__label">Задач привязано</span>
                </div>
                <div className="tt-kpi tt-kpi--blue">
                    <span className="tt-kpi__value">{fmtNum(totalSubmissions)}</span>
                    <span className="tt-kpi__label">Всего попыток</span>
                </div>
                <div className="tt-kpi tt-kpi--green">
                    <span className="tt-kpi__value">{activeTopics}</span>
                    <span className="tt-kpi__label">Активных тем</span>
                </div>
            </div>

            {error      && <div className="tt-alert tt-alert--error">{error}</div>}
            {successMsg && <div className="tt-alert tt-alert--success">{successMsg}</div>}

            {}
            <div className="tt-add-card">
                <p className="tt-add-label">Новая тема</p>
                <div className="tt-add-row">
                    <input
                        className="tt-input"
                        placeholder="Название темы..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        maxLength={80}
                    />
                    <button className="tt-btn tt-btn--primary" onClick={handleCreate} disabled={!newName.trim()}>
                        + Добавить
                    </button>
                </div>
            </div>

            {}
            <div className="tt-controls">
                <div className="tt-ctrl-group">
                    <span className="tt-ctrl-label">Сортировка:</span>
                    {(['submissions', 'challenges', 'name'] as SortKey[]).map(k => (
                        <button
                            key={k}
                            className={`tt-ctrl-btn${sortKey === k ? ' active' : ''}`}
                            onClick={() => toggleSort(k)}
                        >
                            {k === 'name' ? 'А→Я' : k === 'challenges' ? 'Задачи' : 'Популярность'}
                            {sortKey === k && <span className="tt-sort-arr">{sortDesc ? ' ↓' : ' ↑'}</span>}
                        </button>
                    ))}
                </div>
                <div className="tt-ctrl-group">
                    <label className="tt-ctrl-label">На странице:</label>
                    <CustomSelect
                        small
                        value={String(limit)}
                        onChange={v => { setLimit(Number(v)); setPage(1); }}
                        options={PAGE_SIZES.map(n => ({ value: String(n), label: `${n} записей` }))}
                    />
                </div>
            </div>

            {}
            <div className="tt-split">

                {}
                <div className="tt-table-wrap">
                    <div key={page} className="tt-card">
                        <table className="tt-table">
                            <thead>
                                <tr>
                                    <th className="tt-th" style={{ width: 36 }}>#</th>
                                    <th className="tt-th">Название</th>
                                    <th className="tt-th tt-th--center">Задач</th>
                                    <th className="tt-th tt-th--center">Попыток</th>
                                    <th className="tt-th tt-th--center">% Успеха</th>
                                    <th className="tt-th tt-th--right">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.length === 0 ? (
                                    <tr><td colSpan={6} className="tt-td tt-empty">Тем пока нет. Добавьте первую тему выше.</td></tr>
                                ) : pageItems.map((t, idx) => (
                                    <tr key={t.id} className={`tt-row${editId === t.id ? ' tt-edit-row' : ''}`}>
                                        {editId === t.id ? (
                                            <td className="tt-td" colSpan={6}>
                                                <div className="tt-edit-inner">
                                                    <input
                                                        className="tt-input"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleUpdate();
                                                            if (e.key === 'Escape') setEditId(null);
                                                        }}
                                                        autoFocus maxLength={80}
                                                    />
                                                    <button className="tt-btn tt-btn--save"   onClick={handleUpdate}>Сохранить</button>
                                                    <button className="tt-btn tt-btn--cancel" onClick={() => setEditId(null)}>Отмена</button>
                                                </div>
                                            </td>
                                        ) : (
                                            <>
                                                <td className="tt-td tt-td--muted">{(page - 1) * limit + idx + 1}</td>
                                                <td className="tt-td tt-td--name">
                                                    <div className="tt-name-cell">
                                                        <span className={`tt-dot tt-dot--${
                                                            t.submissions / maxSubmissions > 0.6 ? 'hot'
                                                            : t.submissions / maxSubmissions > 0.25 ? 'mid'
                                                            : t.submissions > 0 ? 'low' : 'none'
                                                        }`} />
                                                        {t.name}
                                                    </div>
                                                </td>
                                                <td className="tt-td tt-td--center">
                                                    {t.total > 0
                                                        ? <span className="tt-badge tt-badge--blue">{t.total}</span>
                                                        : <span className="tt-td--muted">—</span>
                                                    }
                                                </td>
                                                <td className="tt-td tt-td--center tt-td--muted">{t.submissions > 0 ? fmtNum(t.submissions) : '—'}</td>
                                                <td className="tt-td tt-td--center">
                                                    {t.submissions > 0 ? (
                                                        <span className={`tt-rate ${t.successRate >= 60 ? 'good' : t.successRate >= 30 ? 'mid' : 'low'}`}>
                                                            {t.successRate}%
                                                        </span>
                                                    ) : <span className="tt-td--muted">—</span>}
                                                </td>
                                                <td className="tt-td tt-td--right">
                                                    <button className="tt-action-btn tt-action-btn--edit"   onClick={() => startEdit(t.id, t.name)}>✎ Изменить</button>
                                                    <button className="tt-action-btn tt-action-btn--delete" onClick={() => setDeleteTarget({ id: t.id, name: t.name })}>✕ Удалить</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {}
                    {totalPages > 1 && (
                        <div className="tt-pagination">
                            <button className="tt-page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                            <button className="tt-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                    acc.push(p); return acc;
                                }, [])
                                .map((p, i) => p === '...'
                                    ? <span key={`e${i}`} className="tt-page-ellipsis">…</span>
                                    : <button key={p} className={`tt-page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p as number)}>{p}</button>
                                )
                            }
                            <button className="tt-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                            <button className="tt-page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                            <span className="tt-page-info">{(page - 1) * limit + 1}–{Math.min(page * limit, sorted.length)} из {sorted.length}</span>
                        </div>
                    )}
                </div>

                {}
                <StatsPanel enriched={enriched} maxSubmissions={maxSubmissions} />
            </div>

            {deleteTarget && (
                <ConfirmationModal
                    isOpen
                    title="Удаление темы"
                    message={`Удалить тему «${deleteTarget.name}»? Если к ней привязаны задачи, удаление будет отклонено.`}
                    confirmText="Удалить"
                    type="danger"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </section>
    );
}
