'use client';

import React from 'react';
import './Overviewtab.css';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import KpiCard from '@/widgets/Kpicard/Kpicard';
import FilterPills from '@/shared/components/FilterPills/FilterPills';
import ActivityHeatmap from '@/features/charts/ActivityHeatmap';

const TOOLTIP_STYLE = {
    contentStyle: { background: '#0b1120', border: '1px solid #223355', borderRadius: 10, color: '#dde6f0', fontSize: 12, fontFamily: 'inherit' },
    labelStyle: { color: '#dde6f0', fontWeight: 700, marginBottom: 4 },
    itemStyle: { color: '#dde6f0' },
    cursor: { fill: '#ffffff08' },
};

interface Props {
    overview: any;
    activity: any[];
    activityLines: Set<string>;
    setActivityLines: (v: Set<string>) => void;
    heatmap: { day: number; hour: number; count: number }[];
}

export default function OverviewTab({ overview, activity, activityLines, setActivityLines, heatmap }: Props) {
    return (
        <>
            {overview && (
                <section className="overview-section">
                    <div className="overview-section__header">
                        <div className="overview-section__accent" />
                        <h2 className="overview-section__title">Ключевые показатели</h2>
                    </div>
                    <div className="overview-kpi-grid">
                        <KpiCard label="Пользователей"    value={overview.totalUsers.toLocaleString()}       icon="/images/Admin/users.png"        color="#67e8f9" sub="Всего зарегистрировано" />
                        <KpiCard label="Задач"            value={overview.totalChallenges.toLocaleString()}  icon="/images/Admin/challenges.png"   color="#c084fc" sub="Опубликовано" />
                        <KpiCard label="Решений"          value={overview.totalSubmissions.toLocaleString()} icon="/images/Admin/submissions.png"  color="#00e5b0" sub="Всего отправлено" />
                        <KpiCard label="% Успеха"         value={`${overview.successRate}%`}                 icon="/images/Admin/success-rate.png" color="#00e5b0" sub="Успешных решений" />
                        <KpiCard label="Средний рейтинг"  value={overview.avgRating.toFixed(2)}              icon="/images/Admin/rating.png"       color="#fbbf24" sub="По отзывам пользователей" />
                        <KpiCard label="Pending репортов" value={overview.pendingReports}                    icon="/images/Admin/reports.png"      color="#fb7185" sub="Ожидают рассмотрения" />
                    </div>
                </section>
            )}

            {activity.length > 0 && (
                <section className="overview-section">
                    <div className="overview-section__header">
                        <div className="overview-section__accent" />
                        <h2 className="overview-section__title">Активность за период</h2>
                        <div className="overview-section__filters">
                            <FilterPills
                                label="Линии"
                                all={['submissions', 'successes', 'failures']}
                                selected={activityLines}
                                onChange={setActivityLines}
                                colorMap={{ submissions: '#67e8f9', successes: '#00e5b0', failures: '#fb7185' }}
                            />
                        </div>
                    </div>
                    <div className="overview-card">
                        <div className="overview-chart-scroll">
                            <div className="overview-chart-inner">
                                <ResponsiveContainer width="100%" height={290}>
                                    <LineChart data={activity} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" />
                                        <XAxis dataKey="date" stroke="#3d5470" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                                        <YAxis stroke="#3d5470" tick={{ fontSize: 10 }} />
                                        <Tooltip {...TOOLTIP_STYLE} />
                                        <Legend wrapperStyle={{ color: '#3d5470', fontSize: 11 }} />
                                        {activityLines.has('submissions') && <Line type="monotone" dataKey="submissions" name="Всего"     stroke="#67e8f9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                                        {activityLines.has('successes')   && <Line type="monotone" dataKey="successes"   name="Успешных"  stroke="#00e5b0" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                                        {activityLines.has('failures')    && <Line type="monotone" dataKey="failures"    name="Неудачных" stroke="#fb7185" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {heatmap.length > 0 && (
                <section className="overview-section">
                    <div className="overview-section__header">
                        <div className="overview-section__accent" />
                        <h2 className="overview-section__title">Карта активности по часам и дням</h2>
                    </div>
                    <ActivityHeatmap heatmap={heatmap} />
                </section>
            )}

        </>
    );
}
