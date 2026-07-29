'use client';

import React from 'react';
import './Teststab.css';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TestStats } from '@/shared/services/AdminApiService';

const PIE_COLORS = ['#00e5b0', '#38bdf8', '#c084fc', '#fbbf24', '#fb7185', '#67e8f9', '#86efac', '#fca5a5'];

const TOOLTIP_STYLE = {
    contentStyle: { background: '#0b1120', border: '1px solid #223355', borderRadius: 10, color: '#dde6f0', fontSize: 12, fontFamily: 'inherit' },
    labelStyle: { color: '#dde6f0', fontWeight: 700, marginBottom: 4 },
    itemStyle: { color: '#dde6f0' },
    cursor: { fill: '#ffffff08' },
};

const STATUS_LABELS: Record<string, string> = {
    completed: 'Завершён',
    timed_out: 'Время вышло',
    active:    'Активен',
};

interface Props {
    testStats: TestStats | null;
}

export default function TestsTab({ testStats }: Props) {
    if (!testStats) return null;

    const completionRate = testStats.totalAttempts > 0
        ? Math.round((testStats.completedAttempts / testStats.totalAttempts) * 1000) / 10
        : 0;

    const statusData = testStats.byStatus.map(r => ({
        ...r,
        label: STATUS_LABELS[r.status] ?? r.status,
    }));

    return (
        <>
            {/* KPI */}
            <section className="tests-section">
                <div className="tests-section__header">
                    <div className="tests-section__accent" />
                    <h2 className="tests-section__title">Обзор тестов</h2>
                </div>
                <div className="tests-kpi-grid">
                    <div className="tests-kpi-card">
                        <div className="tests-kpi-card__val">{testStats.totalTests}</div>
                        <div className="tests-kpi-card__label">Всего тестов</div>
                    </div>
                    <div className="tests-kpi-card">
                        <div className="tests-kpi-card__val tests-kpi-card__val--green">{testStats.publishedTests}</div>
                        <div className="tests-kpi-card__label">Опубликовано</div>
                    </div>
                    <div className="tests-kpi-card">
                        <div className="tests-kpi-card__val tests-kpi-card__val--blue">{testStats.totalAttempts}</div>
                        <div className="tests-kpi-card__label">Попыток (завершённых)</div>
                    </div>
                    <div className="tests-kpi-card">
                        <div className="tests-kpi-card__val tests-kpi-card__val--purple">{testStats.avgScore}%</div>
                        <div className="tests-kpi-card__label">Средний балл</div>
                    </div>
                    <div className="tests-kpi-card">
                        <div className="tests-kpi-card__val tests-kpi-card__val--orange">{completionRate}%</div>
                        <div className="tests-kpi-card__label">Завершено из попыток</div>
                    </div>
                </div>
            </section>

            {/* by status + by topic */}
            <section className="tests-section">
                <div className="tests-section__header">
                    <div className="tests-section__accent" />
                    <h2 className="tests-section__title">Статистика попыток</h2>
                </div>
                <div className="tests-grid">
                    <div className="tests-card">
                        <div className="tests-card__label">По статусу</div>
                        <div className="tests-chart-wrap">
                            <div className="tests-chart-inner tests-chart-inner--pie">
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            dataKey="total"
                                            nameKey="label"
                                            cx="50%" cy="50%"
                                            outerRadius={90} innerRadius={40}
                                            paddingAngle={3}
                                            label={({ name, percent }) => `${name ?? ''} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: '#3d5470' }}
                                        >
                                            {statusData.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip {...TOOLTIP_STYLE} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="tests-card">
                        <div className="tests-card__label">Попыток по темам</div>
                        <div className="tests-chart-wrap">
                            <div className="tests-chart-inner tests-chart-inner--bar-v">
                                <ResponsiveContainer width="100%" height={270}>
                                    <BarChart data={testStats.byTopic} layout="vertical" margin={{ left: 8, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" horizontal={false} />
                                        <XAxis type="number" stroke="#3d5470" tick={{ fontSize: 10 }} />
                                        <YAxis dataKey="topic" type="category" stroke="#3d5470" tick={{ fontSize: 10 }} width={90} />
                                        <Tooltip {...TOOLTIP_STYLE} />
                                        <Bar dataKey="totalAttempts" name="Попыток" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="totalTests"    name="Тестов"  fill="#c084fc" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* avg score by topic + hardest tests */}
            <section className="tests-section">
                <div className="tests-section__header">
                    <div className="tests-section__accent" />
                    <h2 className="tests-section__title">Сложность тестов</h2>
                </div>
                <div className="tests-grid">
                    <div className="tests-card">
                        <div className="tests-card__label">Средний балл по темам (%)</div>
                        <div className="tests-chart-wrap">
                            <div className="tests-chart-inner tests-chart-inner--bar-v">
                                <ResponsiveContainer width="100%" height={270}>
                                    <BarChart
                                        data={testStats.byTopic.filter(r => r.totalAttempts > 0)}
                                        layout="vertical"
                                        margin={{ left: 8, right: 16 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" horizontal={false} />
                                        <XAxis type="number" domain={[0, 100]} stroke="#3d5470" tick={{ fontSize: 10 }} unit="%" />
                                        <YAxis dataKey="topic" type="category" stroke="#3d5470" tick={{ fontSize: 10 }} width={90} />
                                        <Tooltip
                                            {...TOOLTIP_STYLE}
                                            formatter={(v: any) => [`${v}%`, 'Средний балл']}
                                        />
                                        <Bar dataKey="avgPct" name="Средний балл" radius={[0, 4, 4, 0]}>
                                            {testStats.byTopic.filter(r => r.totalAttempts > 0).map((r, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={r.avgPct >= 70 ? '#00e5b0' : r.avgPct >= 40 ? '#fbbf24' : '#fb7185'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="tests-card">
                        <div className="tests-card__label">Низкий рейтинг тестов (средняя оценка)</div>
                        <div className="tests-hardest-scroll">
                            <table className="tests-table">
                                <thead>
                                    <tr>
                                        <th className="tests-th">Тест</th>
                                        <th className="tests-th tests-th--right">Отзывов</th>
                                        <th className="tests-th tests-th--right">Ср. оценка</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(testStats.lowestRated ?? []).map((t, i) => {
                                        const color = t.avgRating <= 2 ? '#fb7185' : t.avgRating <= 3.5 ? '#fbbf24' : '#00e5b0';
                                        return (
                                            <tr key={i}>
                                                <td className="tests-td">{t.title}</td>
                                                <td className="tests-td tests-td--right">{t.reviewCount}</td>
                                                <td className="tests-td tests-td--right" style={{ color, fontWeight: 700 }}>
                                                    {t.avgRating} ★
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
