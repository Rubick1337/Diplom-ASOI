'use client';

import React from 'react';
import './Challengestab.css';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import FilterPills from '@/shared/components/FilterPills/FilterPills';

const PIE_COLORS = ['#00e5b0', '#38bdf8', '#c084fc', '#fbbf24', '#fb7185', '#67e8f9', '#86efac', '#fca5a5'];

const TOOLTIP_STYLE = {
    contentStyle: { background: '#0b1120', border: '1px solid #223355', borderRadius: 10, color: '#dde6f0', fontSize: 12, fontFamily: 'inherit' },
    labelStyle: { color: '#dde6f0', fontWeight: 700, marginBottom: 4 },
    itemStyle: { color: '#dde6f0' },
    cursor: { fill: '#ffffff08' },
};

interface Props {
    challengeStats: any;
    allLanguages: string[];
    allTopics: string[];
    selLangs: Set<string>;
    setSelLangs: (v: Set<string>) => void;
    selTopics: Set<string>;
    setSelTopics: (v: Set<string>) => void;
    filteredLanguages: any[];
    filteredTopics: any[];
    filteredDifficulty: any[];
    langColorMap: Record<string, string>;
    diffRange: [number, number];
    setDiffRange: (v: [number, number]) => void;
}

export default function ChallengesTab({
    challengeStats,
    allLanguages, allTopics,
    selLangs, setSelLangs,
    selTopics, setSelTopics,
    filteredLanguages, filteredTopics, filteredDifficulty,
    langColorMap,
    diffRange, setDiffRange,
}: Props) {
    if (!challengeStats) return null;

    return (
        <>
            {}
            <section className="challenges-section">
                <div className="challenges-section__header">
                    <div className="challenges-section__accent" />
                    <h2 className="challenges-section__title">Статистика по темам</h2>
                    <div className="challenges-section__filters">
                        <FilterPills label="Темы" all={allTopics} selected={selTopics} onChange={setSelTopics} />
                    </div>
                </div>

                <div className="challenges-grid">
                    <div className="challenges-card">
                        <div className="challenges-card__label">Решений по темам</div>
                        <div className="challenges-chart-wrap">
                            <div className="challenges-chart-inner challenges-chart-inner--bar-v">
                                <ResponsiveContainer width="100%" height={270}>
                                    <BarChart data={filteredTopics} layout="vertical" margin={{ left: 8, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" horizontal={false} />
                                        <XAxis type="number" stroke="#3d5470" tick={{ fontSize: 10 }} />
                                        <YAxis dataKey="topic" type="category" stroke="#3d5470" tick={{ fontSize: 10 }} width={80} />
                                        <Tooltip {...TOOLTIP_STYLE} />
                                        <Bar dataKey="submissions" name="Решений"  fill="#c084fc" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="successes"   name="Успешных" fill="#00e5b0" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="challenges-card">
                        <div className="challenges-card__label-row">
                            <span className="challenges-card__label">Языки программирования</span>
                            <FilterPills
                                label="Языки"
                                all={allLanguages}
                                selected={selLangs}
                                onChange={setSelLangs}
                                colorMap={langColorMap}
                            />
                        </div>
                        <div className="challenges-chart-wrap">
                            <div className="challenges-chart-inner challenges-chart-inner--pie">
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={filteredLanguages}
                                            dataKey="total" nameKey="language"
                                            cx="50%" cy="50%"
                                            outerRadius={90} innerRadius={40}
                                            paddingAngle={3}
                                            label={({ name, percent }) => `${name ?? ''} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={{ stroke: '#3d5470' }}
                                        >
                                            {filteredLanguages.map((r, i) => (
                                                <Cell key={i} fill={langColorMap[r.language] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip {...TOOLTIP_STYLE} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {}
            <section className="challenges-section">
                <div className="challenges-section__header">
                    <div className="challenges-section__accent" />
                    <h2 className="challenges-section__title">Сложность задач</h2>
                </div>

                <div className="challenges-grid">
                    <div className="challenges-card">
                        <div className="challenges-card__label-row">
                            <span className="challenges-card__label">Решений по уровню сложности</span>
                            <div className="challenges-range-row">
                                <span className="challenges-range-label">Сл:</span>
                                <input type="range" min={1} max={10} value={diffRange[0]}
                                       onChange={e => setDiffRange([Number(e.target.value), diffRange[1]])}
                                       className="challenges-range" />
                                <span className="challenges-range-val challenges-range-val--green">{diffRange[0]}</span>
                                <span className="challenges-range-sep">—</span>
                                <input type="range" min={1} max={10} value={diffRange[1]}
                                       onChange={e => setDiffRange([diffRange[0], Number(e.target.value)])}
                                       className="challenges-range" />
                                <span className="challenges-range-val challenges-range-val--rose">{diffRange[1]}</span>
                            </div>
                        </div>
                        <div className="challenges-chart-wrap">
                            <div className="challenges-chart-inner">
                                <ResponsiveContainer width="100%" height={210}>
                                    <BarChart data={filteredDifficulty} margin={{ left: -10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" />
                                        <XAxis dataKey="difficulty" stroke="#3d5470" tick={{ fontSize: 10 }} />
                                        <YAxis stroke="#3d5470" tick={{ fontSize: 10 }} />
                                        <Tooltip {...TOOLTIP_STYLE} />
                                        <Bar dataKey="submissions" name="Решений" radius={[4, 4, 0, 0]}>
                                            {filteredDifficulty.map((entry, i) => (
                                                <Cell key={i} fill={entry.difficulty <= 3 ? '#00e5b0' : entry.difficulty <= 7 ? '#fbbf24' : '#fb7185'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="challenges-card">
                        <div className="challenges-card__label">Низкий рейтинг задач (средняя оценка)</div>
                        <div className="challenges-hardest-scroll">
                            <table className="challenges-table">
                                <thead>
                                <tr>
                                    <th className="challenges-th">Задача</th>
                                    <th className="challenges-th challenges-th--right">Отзывов</th>
                                    <th className="challenges-th challenges-th--right">Ср. оценка</th>
                                </tr>
                                </thead>
                                <tbody>
                                {(challengeStats.lowestRated ?? []).map((c: any, i: number) => {
                                    const ratingColor = c.avgRating <= 2 ? '#fb7185' : c.avgRating <= 3.5 ? '#fbbf24' : '#00e5b0';
                                    return (
                                        <tr key={i}>
                                            <td className="challenges-td">{c.name}</td>
                                            <td className="challenges-td challenges-td--right">{c.reviewCount}</td>
                                            <td className="challenges-td challenges-td--right" style={{ color: ratingColor, fontWeight: 700 }}>{c.avgRating} ★</td>
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
