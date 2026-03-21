'use client';

import React from 'react';
import './ActivityHeatmap.css';

const DAYS_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
    heatmap: { day: number; hour: number; count: number }[];
}

export default function ActivityHeatmap({ heatmap }: Props) {
    if (!heatmap.length) return null;

    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxCount = 0;
    heatmap.forEach(({ day, hour, count }) => {
        matrix[day][hour] = count;
        if (count > maxCount) maxCount = count;
    });

    const getColor = (count: number) => {
        if (count === 0) return '#1a1a1a';
        const intensity = Math.sqrt(count / Math.max(maxCount, 1));

        const r = Math.round(240 + (255 - 240) * intensity);
        const g = Math.round(73  + (107 - 73)  * intensity);
        const b = Math.round(73  * (1 - intensity));
        const alpha = 0.15 + intensity * 0.85;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <div className="insights-card">
            <div className="heatmap-scroll">
                <div className="heatmap-wrap">
                    <div className="heatmap-hours-row">
                        <div className="heatmap-day-label" />
                        {HOURS.map(h => (
                            <div key={h} className="heatmap-hour-label">{h}</div>
                        ))}
                    </div>
                    {DAYS_LABELS.map((dayLabel, dayIdx) => (
                        <div key={dayIdx} className="heatmap-row">
                            <div className="heatmap-day-label">{dayLabel}</div>
                            {HOURS.map(hour => {
                                const count = matrix[dayIdx][hour];
                                return (
                                    <div
                                        key={hour}
                                        className="heatmap-cell"
                                        style={{ background: getColor(count) }}
                                        title={`${dayLabel} ${hour}:00 — ${count} попыток`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                    <div className="heatmap-legend">
                        <span className="heatmap-legend__label">Меньше</span>
                        {[0, 0.2, 0.4, 0.6, 0.8, 1].map(v => (
                            <div
                                key={v}
                                className="heatmap-legend__cell"
                                style={{ background: getColor(v * maxCount) }}
                            />
                        ))}
                        <span className="heatmap-legend__label">Больше</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
