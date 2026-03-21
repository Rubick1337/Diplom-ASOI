'use client';

import React from 'react';
import './charts.css';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TOOLTIP_STYLE } from './chartConfig';

interface Props {
    data: any[];
    diffRange: [number, number];
    setDiffRange: (v: [number, number]) => void;
}

export default function DifficultyBarChart({ data, diffRange, setDiffRange }: Props) {
    return (
        <>
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
            <div className="chart-scroll">
                <div className="chart-inner" style={{ minWidth: 280 }}>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={data} margin={{ left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" />
                            <XAxis dataKey="difficulty" stroke="#3d5470" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#3d5470" tick={{ fontSize: 10 }} />
                            <Tooltip {...TOOLTIP_STYLE} />
                            <Bar dataKey="submissions" name="Решений" radius={[4, 4, 0, 0]}>
                                {data.map((entry, i) => (
                                    <Cell key={i} fill={entry.difficulty <= 3 ? '#00e5b0' : entry.difficulty <= 7 ? '#fbbf24' : '#fb7185'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}
