'use client';

import React, { useState, useMemo } from 'react';
import './UsersTab.css';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import RatingDistributionChart from '@/features/charts/RatingDistributionChart';
import ExperienceDistributionChart from '@/features/charts/ExperienceDistributionChart';

const TOOLTIP_STYLE = {
    contentStyle: { background: '#0b1120', border: '1px solid #223355', borderRadius: 10, color: '#dde6f0', fontSize: 12, fontFamily: 'inherit' },
    labelStyle: { color: '#dde6f0', fontWeight: 700, marginBottom: 4 },
    itemStyle: { color: '#dde6f0' },
    cursor: { fill: '#ffffff08' },
};

const PIE_COLORS = ['#00e5b0', '#38bdf8', '#c084fc'];

const CHART_LIMIT = 10;

const PRESETS: { label: string; fn: (users: any[]) => any[] }[] = [
    { label: 'Топ 10',          fn: u => [...u].sort((a, b) => b.solved - a.solved).slice(0, 10) },
    { label: 'Топ 5',           fn: u => [...u].sort((a, b) => b.solved - a.solved).slice(0, 5) },
    { label: 'Худшие 10',       fn: u => [...u].sort((a, b) => a.solved - b.solved).slice(0, 10) },
    { label: '% успеха ↑',      fn: u => [...u].sort((a, b) => b.successRate - a.successRate).slice(0, 10) },
    { label: '% успеха ↓',      fn: u => [...u].sort((a, b) => a.successRate - b.successRate).slice(0, 10) },
    { label: 'Рейтинг ↑',       fn: u => [...u].sort((a, b) => b.rating - a.rating).slice(0, 10) },
    { label: 'Больше попыток',   fn: u => [...u].sort((a, b) => b.submissions - a.submissions).slice(0, 10) },
];

const RATING_PRESETS = [10, 25, 50, 100, 200];
const EXP_PRESETS    = [50, 100, 250, 500, 1000];

interface Props {
    topUsers: any[];
    distributions: { rating: { label: string; count: number }[]; experience: { label: string; count: number }[] } | null;
    ratingBucket: number;
    expBucket: number;
    onBucketChange: (rb: number, eb: number) => void;
}

export default function UsersTab({ topUsers, distributions, ratingBucket, expBucket, onBucketChange }: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [activePreset, setActivePreset] = useState<string | null>('Топ 10');

    const defaultSelected = useMemo(() => {
        const preset = PRESETS.find(p => p.label === 'Топ 10');
        return new Set(preset ? preset.fn(topUsers).map((u: any) => u.id) : []);
    }, [topUsers]);

    const [selIds, setSelIds] = useState<Set<string>>(() => defaultSelected);

    const applyPreset = (preset: typeof PRESETS[0]) => {
        const ids = new Set(preset.fn(topUsers).map((u: any) => u.id));
        setSelIds(ids);
        setActivePreset(preset.label);
    };

    const toggleUser = (id: string) => {
        const next = new Set(selIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            if (next.size >= CHART_LIMIT) return;
            next.add(id);
        }
        setSelIds(next);
        setActivePreset(null);
    };

    const filteredSearch = useMemo(() =>
            topUsers.filter(u =>
                u.username.toLowerCase().includes(search.toLowerCase())
            ),
        [topUsers, search]
    );

    const selectedUsers = useMemo(() =>
            topUsers.filter(u => selIds.has(u.id)),
        [topUsers, selIds]
    );

    if (!topUsers.length) return null;

    return (
        <>
            {}
            <section className="users-section">
                <div className="users-section__header">
                    <div className="users-section__accent" />
                    <h2 className="users-section__title">Выбор пользователей</h2>
                    <span className="users-limit-badge">{selIds.size} / {CHART_LIMIT}</span>
                </div>

                <div className="users-presets">
                    {PRESETS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => applyPreset(p)}
                            className={`users-preset-btn${activePreset === p.label ? ' users-preset-btn--active' : ''}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="users-picker-card">
                    <input
                        className="users-search"
                        placeholder="Поиск пользователя..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="users-picker-list">
                        {filteredSearch.map(u => {
                            const isSelected = selIds.has(u.id);
                            const isDisabled = !isSelected && selIds.size >= CHART_LIMIT;
                            return (
                                <button
                                    key={u.id}
                                    onClick={() => toggleUser(u.id)}
                                    disabled={isDisabled}
                                    className={`users-picker-item${isSelected ? ' users-picker-item--selected' : ''}${isDisabled ? ' users-picker-item--disabled' : ''}`}
                                >
                                    <span className="users-picker-name">{u.username}</span>
                                    <span className="users-picker-meta">
                                        <span className="users-picker-solved">{u.solved} решений</span>
                                        <span className="users-picker-rate" style={{
                                            color: u.successRate >= 70 ? '#00e5b0' : u.successRate >= 40 ? '#fbbf24' : '#fb7185'
                                        }}>{u.successRate}%</span>
                                    </span>
                                    {isSelected && <span className="users-picker-check">✓</span>}
                                </button>
                            );
                        })}
                        {filteredSearch.length === 0 && (
                            <div className="users-picker-empty">Ничего не найдено</div>
                        )}
                    </div>
                    {selIds.size >= CHART_LIMIT && (
                        <div className="users-limit-warn">
                            Достигнут лимит {CHART_LIMIT} пользователей для графика
                        </div>
                    )}
                </div>
            </section>

            {}
            {selectedUsers.length > 0 && (
                <section className="users-section">
                    <div className="users-section__header">
                        <div className="users-section__accent" />
                        <h2 className="users-section__title">Решённые задачи vs попытки</h2>
                    </div>
                    <div className="users-card">
                        <div className="users-chart-scroll">
                            <div className="users-chart-inner" style={{ minWidth: Math.max(320, selectedUsers.length * 90) }}>
                                <ResponsiveContainer width="100%" height={270}>
                                    <BarChart data={selectedUsers} margin={{ left: -10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" />
                                        <XAxis dataKey="username" stroke="#3d5470" tick={{ fontSize: 10 }} />
                                        <YAxis stroke="#3d5470" tick={{ fontSize: 10 }} />
                                        <Tooltip {...TOOLTIP_STYLE} />
                                        <Legend wrapperStyle={{ color: '#3d5470', fontSize: 11 }} />
                                        <Bar dataKey="solved"      name="Решено"  fill="#00e5b0" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="submissions" name="Попыток" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {}
            {selectedUsers.length > 0 && (
                <section className="users-section">
                    <div className="users-section__header">
                        <div className="users-section__accent" />
                        <h2 className="users-section__title">Таблица сравнения</h2>
                    </div>
                    <div className="users-card">
                        <table className="users-table">
                            <thead>
                            <tr>
                                <th className="users-th">#</th>
                                <th className="users-th">Пользователь</th>
                                <th className="users-th users-th--right">Решено</th>
                                <th className="users-th users-th--right">Уникальных</th>
                                <th className="users-th users-th--right">Попыток</th>
                                <th className="users-th users-th--right">% успеха</th>
                                <th className="users-th users-th--right">Рейтинг</th>
                                <th className="users-th users-th--right">Опыт</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedUsers.map((u, i) => {
                                const rankColor = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#3d5470';
                                const successColor = u.successRate >= 70 ? '#00e5b0' : u.successRate >= 40 ? '#fbbf24' : '#fb7185';
                                return (
                                    <tr
                                        key={u.id}
                                        className="users-row"
                                        style={{ background: i < 3 ? `${PIE_COLORS[i]}09` : 'transparent' }}
                                    >
                                        <td className="users-td" style={{ fontWeight: 800, color: rankColor }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </td>
                                        <td className="users-td users-td--bold">{u.username}</td>
                                        <td className="users-td users-td--right users-td--green">{u.solved}</td>
                                        <td className="users-td users-td--right">{u.uniqueSolved}</td>
                                        <td className="users-td users-td--right users-td--muted">{u.submissions}</td>
                                        <td className="users-td users-td--right" style={{ color: successColor, fontWeight: 700 }}>{u.successRate}%</td>
                                        <td className="users-td users-td--right users-td--violet">{u.rating}</td>
                                        <td className="users-td users-td--right users-td--muted">{u.experience}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {}
            <section className="users-section">
                <div className="users-section__header">
                    <div className="users-section__accent" />
                    <h2 className="users-section__title">Размер промежутков распределения</h2>
                </div>
                <div className="users-card users-buckets">
                    <div className="users-bucket-row">
                        <span className="users-bucket-label">Шаг рейтинга</span>
                        <div className="users-bucket-presets">
                            {RATING_PRESETS.map(v => (
                                <button
                                    key={v}
                                    className={`users-preset-btn${ratingBucket === v ? ' users-preset-btn--active' : ''}`}
                                    onClick={() => onBucketChange(v, expBucket)}
                                >{v}</button>
                            ))}
                        </div>
                        <div className="users-bucket-stepper">
                            <button className="users-bucket-stepper__btn" onClick={() => onBucketChange(Math.max(1, ratingBucket - 1), expBucket)}>−</button>
                            <input
                                type="number"
                                className="users-bucket-stepper__input"
                                min={1}
                                value={ratingBucket}
                                onChange={e => onBucketChange(Math.max(1, Number(e.target.value)), expBucket)}
                            />
                            <button className="users-bucket-stepper__btn" onClick={() => onBucketChange(ratingBucket + 1, expBucket)}>+</button>
                        </div>
                    </div>
                    <div className="users-bucket-row">
                        <span className="users-bucket-label">Шаг опыта</span>
                        <div className="users-bucket-presets">
                            {EXP_PRESETS.map(v => (
                                <button
                                    key={v}
                                    className={`users-preset-btn${expBucket === v ? ' users-preset-btn--active' : ''}`}
                                    onClick={() => onBucketChange(ratingBucket, v)}
                                >{v}</button>
                            ))}
                        </div>
                        <div className="users-bucket-stepper">
                            <button className="users-bucket-stepper__btn" onClick={() => onBucketChange(ratingBucket, Math.max(1, expBucket - 1))}>−</button>
                            <input
                                type="number"
                                className="users-bucket-stepper__input"
                                min={1}
                                value={expBucket}
                                onChange={e => onBucketChange(ratingBucket, Math.max(1, Number(e.target.value)))}
                            />
                            <button className="users-bucket-stepper__btn" onClick={() => onBucketChange(ratingBucket, expBucket + 1)}>+</button>
                        </div>
                    </div>
                </div>
            </section>

            {}
            {distributions && distributions.rating.length > 0 && (
                <section className="users-section">
                    <div className="users-section__header">
                        <div className="users-section__accent" />
                        <h2 className="users-section__title">Распределение рейтинга (шаг {ratingBucket})</h2>
                    </div>
                    <div className="users-card">
                        <div className="users-card__label">Рейтинг пользователей</div>
                        <RatingDistributionChart data={distributions.rating} />
                    </div>
                </section>
            )}

            {}
            {distributions && distributions.experience.length > 0 && (
                <section className="users-section">
                    <div className="users-section__header">
                        <div className="users-section__accent" />
                        <h2 className="users-section__title">Распределение опыта (шаг {expBucket})</h2>
                    </div>
                    <div className="users-card">
                        <div className="users-card__label">Опыт пользователей</div>
                        <ExperienceDistributionChart data={distributions.experience} />
                    </div>
                </section>
            )}
        </>
    );
}
