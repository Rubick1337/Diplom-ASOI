'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './Reportstab.css';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import FilterPills from '@/features/Filterpills/Filterpills';
import DateRangePicker from '@/shared/components/DateRangePicker/DateRangePicker';
import CustomSelect from '@/shared/components/CustomSelect/CustomSelect';
import ReportActionModal from '@/features/ReportActionModal/ReportActionModal';

const TOOLTIP_STYLE = {
    contentStyle: { background: '#0b1120', border: '1px solid #223355', borderRadius: 10, color: '#dde6f0', fontSize: 12, fontFamily: 'inherit' },
    labelStyle: { color: '#dde6f0', fontWeight: 700, marginBottom: 4 },
    itemStyle: { color: '#dde6f0' },
    cursor: { fill: '#ffffff08' },
};

const STATUS_COLOR_MAP: Record<string, string> = {
    Pending: '#fbbf24',
    Resolved: '#00e5b0',
    Dismissed: '#3d5470',
};

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

interface ReportsPage {
    total: number;
    page: number;
    limit: number;
    rows: any[];
}

interface Props {
    reportsStats: any;
    allStatuses: string[];
    allReasons: string[];
    selStatuses: Set<string>;
    setSelStatuses: (v: Set<string>) => void;
    selReasons: Set<string>;
    setSelReasons: (v: Set<string>) => void;
    filteredByStatus: any[];
    filteredByReason: any[];
    reportsPage: ReportsPage;
    onLoadReports: (filters: any) => void;
    onUpdateReport: (id: number, status: string) => void;
    hideTable?: boolean;
    readOnly?: boolean;
}

export default function ReportsTab({
    reportsStats,
    allStatuses, allReasons,
    selStatuses, setSelStatuses,
    selReasons, setSelReasons,
    filteredByStatus, filteredByReason,
    reportsPage, onLoadReports,
    onUpdateReport,
    hideTable = false,
    readOnly = false,
}: Props) {
    const [activeReport, setActiveReport] = useState<any | null>(null);
    const [filterStatus,    setFilterStatus]    = useState('');
    const [filterChallenge, setFilterChallenge] = useState('');
    const [filterReporter,  setFilterReporter]  = useState('');
    const [filterDateFrom,  setFilterDateFrom]  = useState('');
    const [filterDateTo,    setFilterDateTo]    = useState('');
    const [page,  setPage]  = useState(1);
    const [limit, setLimit] = useState(15);

    const load = useCallback((p = page, l = limit) => {
        onLoadReports({
            page: p, limit: l,
            status:    filterStatus    || undefined,
            challenge: filterChallenge || undefined,
            reporter:  filterReporter  || undefined,
            dateFrom:  filterDateFrom  || undefined,
            dateTo:    filterDateTo    || undefined,
        });
    }, [filterStatus, filterChallenge, filterReporter, filterDateFrom, filterDateTo, page, limit]);

    const applyFilters = () => {
        setPage(1);
        onLoadReports({
            page: 1, limit,
            status:    filterStatus    || undefined,
            challenge: filterChallenge || undefined,
            reporter:  filterReporter  || undefined,
            dateFrom:  filterDateFrom  || undefined,
            dateTo:    filterDateTo    || undefined,
        });
    };

    const resetFilters = () => {
        setFilterStatus('');
        setFilterChallenge('');
        setFilterReporter('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setPage(1);
        onLoadReports({ page: 1, limit });
    };

    const goTo = (p: number) => {
        setPage(p);
        onLoadReports({
            page: p, limit,
            status:    filterStatus    || undefined,
            challenge: filterChallenge || undefined,
            reporter:  filterReporter  || undefined,
            dateFrom:  filterDateFrom  || undefined,
            dateTo:    filterDateTo    || undefined,
        });
    };

    if (!reportsStats) return null;

    const totalPages = Math.ceil(reportsPage.total / reportsPage.limit) || 1;
    const hasFilters = filterStatus || filterChallenge || filterReporter || filterDateFrom || filterDateTo;

    return (
        <>
            {}
            <section className="reports-section">
                <div className="reports-section__header">
                    <div className="reports-section__accent" />
                    <h2 className="reports-section__title">Статистика репортов</h2>
                    <div className="reports-section__filters">
                        <FilterPills label="Статус" all={allStatuses} selected={selStatuses} onChange={setSelStatuses} colorMap={STATUS_COLOR_MAP} />
                    </div>
                </div>
                <div className="reports-grid">
                    <div className="reports-card">
                        <div className="reports-card__label">По статусу</div>
                        <div className="reports-chart-scroll">
                            <div className="reports-chart-inner" style={{ minWidth: 260 }}>
                                <ResponsiveContainer width="100%" height={230}>
                                    <PieChart>
                                        <Pie data={filteredByStatus} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={82} innerRadius={36} paddingAngle={4} isAnimationActive={false} label={({ name, value }) => `${name ?? ''}: ${value ?? ''}`}>
                                            {filteredByStatus.map((entry, i) => (
                                                <Cell key={i} fill={STATUS_COLOR_MAP[entry.status] ?? '#3d5470'} />
                                            ))}
                                        </Pie>
                                        <Tooltip {...TOOLTIP_STYLE} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="reports-card">
                        <div className="reports-card__label-row">
                            <span className="reports-card__label">По причине</span>
                            <FilterPills label="Причины" all={allReasons} selected={selReasons} onChange={setSelReasons} />
                        </div>
                        <div className="reports-chart-scroll">
                            <div className="reports-chart-inner" style={{ minWidth: 340 }}>
                                <ResponsiveContainer width="100%" height={210}>
                                    <BarChart data={filteredByReason} layout="vertical" margin={{ left: 8, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" horizontal={false} />
                                        <XAxis type="number" stroke="#3d5470" tick={{ fontSize: 10 }} />
                                        <YAxis dataKey="reason" type="category" stroke="#3d5470" tick={{ fontSize: 10 }} width={115} />
                                        <Tooltip {...TOOLTIP_STYLE} />
                                        <Bar dataKey="total" name="Кол-во" fill="#fb7185" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {}
            {!hideTable && <section className="reports-section">
                <div className="reports-section__header">
                    <div className="reports-section__accent" />
                    <h2 className="reports-section__title">Все репорты</h2>
                    <span className="reports-total-badge">{reportsPage.total} записей</span>
                </div>

                {}
                <div className="reports-filters-card">
                    <div className="reports-filters-grid">
                        <div className="reports-filter-group">
                            <label className="reports-filter-label">Статус</label>
                            <CustomSelect
                                value={filterStatus}
                                onChange={setFilterStatus}
                                placeholder="Все статусы"
                                options={[{ value: '', label: 'Все статусы' }, ...allStatuses.map(s => ({ value: s, label: s }))]}
                            />
                        </div>
                        <div className="reports-filter-group">
                            <label className="reports-filter-label">Задача</label>
                            <input className="reports-filter-input" placeholder="Название задачи..." value={filterChallenge} onChange={e => setFilterChallenge(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} />
                        </div>
                        <div className="reports-filter-group">
                            <label className="reports-filter-label">Репортер</label>
                            <input className="reports-filter-input" placeholder="Имя пользователя..." value={filterReporter} onChange={e => setFilterReporter(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} />
                        </div>
                        <div className="reports-filter-group reports-filter-group--date">
                            <label className="reports-filter-label">Период</label>
                            <DateRangePicker
                                from={filterDateFrom}
                                to={filterDateTo}
                                onChange={(from, to) => { setFilterDateFrom(from); setFilterDateTo(to); }}
                            />
                        </div>
                    </div>
                    <div className="reports-filters-actions">
                        <button className="reports-filter-btn reports-filter-btn--primary" onClick={applyFilters}>Применить</button>
                        {hasFilters && (
                            <button className="reports-filter-btn reports-filter-btn--ghost" onClick={resetFilters}>Сбросить</button>
                        )}
                        <div className="reports-filter-group reports-filter-group--size">
                            <label className="reports-filter-label">На странице</label>
                            <CustomSelect
                                small
                                value={String(limit)}
                                onChange={v => { const l = Number(v); setLimit(l); setPage(1); onLoadReports({ page: 1, limit: l, status: filterStatus || undefined, challenge: filterChallenge || undefined, reporter: filterReporter || undefined, dateFrom: filterDateFrom || undefined, dateTo: filterDateTo || undefined }); }}
                                options={PAGE_SIZE_OPTIONS.map(n => ({ value: String(n), label: String(n) }))}
                            />
                        </div>
                    </div>
                </div>

                {}
                <div className="reports-card">
                    <div key={page} className="reports-table-scroll">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th className="reports-th">Задача</th>
                                    <th className="reports-th">Причина</th>
                                    <th className="reports-th">Репортер</th>
                                    <th className="reports-th">Статус</th>
                                    <th className="reports-th reports-th--right">Дата</th>
                                    <th className="reports-th reports-th--right">Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportsPage.rows.length === 0 ? (
                                    <tr><td colSpan={readOnly ? 5 : 6} className="reports-td reports-empty">Репортов не найдено</td></tr>
                                ) : reportsPage.rows.map((r: any) => {
                                    const statusColor = STATUS_COLOR_MAP[r.status] ?? '#3d5470';
                                    return (
                                        <tr key={r.id} className="reports-row">
                                            <td className="reports-td reports-td--bold">{r.challenge}</td>
                                            <td className="reports-td">{r.reason}</td>
                                            <td className="reports-td reports-td--muted">{r.reporter}</td>
                                            <td className="reports-td">
                                                <span className="reports-status-badge" style={{ background: `${statusColor}1a`, color: statusColor }}>{r.status}</span>
                                            </td>
                                            <td className="reports-td reports-td--right reports-td--muted reports-td--small">
                                                {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                                            </td>
                                            <td className="reports-td reports-td--right" style={{ whiteSpace: 'nowrap' }}>
                                                {!readOnly ? (
                                                    <>
                                                        <button className="reports-action-btn reports-action-btn--manage" onClick={() => setActiveReport(r)}>⚑ Разобраться</button>
                                                    </>
                                                ) : (
                                                    <span className="reports-status-badge" style={{ background: `${STATUS_COLOR_MAP[r.status] ?? '#3d5470'}1a`, color: STATUS_COLOR_MAP[r.status] ?? '#3d5470', fontSize: 11 }}>{r.status}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {}
                    {totalPages > 1 && (
                        <div className="reports-pagination">
                            <button className="reports-page-btn" disabled={page === 1} onClick={() => goTo(1)}>«</button>
                            <button className="reports-page-btn" disabled={page === 1} onClick={() => goTo(page - 1)}>‹</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) => p === '...'
                                    ? <span key={`e${i}`} className="reports-page-ellipsis">…</span>
                                    : <button key={p} className={`reports-page-btn${page === p ? ' reports-page-btn--active' : ''}`} onClick={() => goTo(p as number)}>{p}</button>
                                )
                            }
                            <button className="reports-page-btn" disabled={page === totalPages} onClick={() => goTo(page + 1)}>›</button>
                            <button className="reports-page-btn" disabled={page === totalPages} onClick={() => goTo(totalPages)}>»</button>
                            <span className="reports-page-info">{(page - 1) * limit + 1}–{Math.min(page * limit, reportsPage.total)} из {reportsPage.total}</span>
                        </div>
                    )}
                </div>
            </section>}

            {activeReport && (
                <ReportActionModal
                    reportId={activeReport.id}
                    challengeId={activeReport.challengeId ?? null}
                    reportReason={activeReport.reason}
                    reportReasonText={activeReport.reasonText}
                    reportStatus={activeReport.status}
                    reporterName={activeReport.reporter}
                    challengeName={activeReport.challenge}
                    resolvedBy={activeReport.resolvedBy ?? null}
                    resolvedAt={activeReport.resolvedAt ?? null}
                    onClose={() => setActiveReport(null)}
                />
            )}
        </>
    );
}
