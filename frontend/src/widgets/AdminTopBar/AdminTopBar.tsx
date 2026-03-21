'use client';

import React from 'react';
import './AdminTopbar.css';
import DateRangePicker from '@/shared/components/DateRangePicker/DateRangePicker';

const PERIODS = [
    { label: '7д',     days: 7 },
    { label: '30д',    days: 30 },
    { label: '90д',    days: 90 },
    { label: 'Период', days: 0 },
];

interface Props {
    periodIdx: number;
    setPeriodIdx: (i: number) => void;
    customFrom: string;
    setCustomFrom: (v: string) => void;
    customTo: string;
    setCustomTo: (v: string) => void;
    exporting: boolean;
    onRefresh: () => void;
    onExportTab: () => void;
    onExportFull: () => void;
}

export default function AdminTopbar({
                                        periodIdx, setPeriodIdx,
                                        customFrom, setCustomFrom,
                                        customTo, setCustomTo,
                                        exporting,
                                        onRefresh, onExportTab, onExportFull,
                                    }: Props) {
    return (
        <div className="admin-topbar">
            <div className="admin-topbar__title">Аналитика платформы</div>

            <div className="admin-topbar__controls">
                <div className="admin-topbar__periods">
                    {PERIODS.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => setPeriodIdx(i)}
                            className={`admin-topbar__period-btn${periodIdx === i ? ' admin-topbar__period-btn--active' : ''}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {periodIdx === 3 && (
                    <DateRangePicker
                        from={customFrom}
                        to={customTo}
                        onChange={(from, to) => {
                            setCustomFrom(from);
                            setCustomTo(to);
                        }}
                    />
                )}

                <button onClick={onRefresh} className="admin-topbar__btn admin-topbar__btn--ghost">↻</button>
                <button onClick={onExportTab} disabled={exporting} className="admin-topbar__btn admin-topbar__btn--dark">
                    Вкладка
                </button>
                <button onClick={onExportFull} disabled={exporting} className="admin-topbar__btn admin-topbar__btn--primary">
                    {exporting ? 'Генерация...' : 'Полный отчёт'}
                </button>
            </div>
        </div>
    );
}
