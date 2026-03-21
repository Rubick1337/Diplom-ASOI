'use client';

import React from 'react';
import './charts.css';
import {
    PieChart, Pie, Cell,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { TOOLTIP_STYLE } from './chartConfig';

const PIE_COLORS = ['#00e5b0', '#38bdf8', '#c084fc', '#fbbf24', '#fb7185', '#67e8f9', '#86efac', '#fca5a5'];

interface Props {
    data: any[];
    colorMap: Record<string, string>;
}

export default function LanguagePieChart({ data, colorMap }: Props) {
    return (
        <div className="chart-scroll">
            <div className="chart-inner" style={{ minWidth: 260 }}>
                <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="total" nameKey="language"
                            cx="50%" cy="50%"
                            outerRadius={90} innerRadius={40}
                            paddingAngle={3}
                            label={({ name, percent }) => `${name ?? ''} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
                            labelLine={{ stroke: '#3d5470' }}
                        >
                            {data.map((r, i) => (
                                <Cell key={i} fill={colorMap[r.language] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
