'use client';

import React from 'react';
import './ExperienceDistributionChart.css';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const TOOLTIP_STYLE = {
    contentStyle: { background: '#0b1120', border: '1px solid #223355', borderRadius: 10, color: '#dde6f0', fontSize: 12, fontFamily: 'inherit' },
    labelStyle: { color: '#dde6f0', fontWeight: 700, marginBottom: 4 },
    itemStyle: { color: '#dde6f0' },
    cursor: { fill: '#ffffff08' },
};

interface Props {
    data: { label: string; count: number }[];
}

export default function ExperienceDistributionChart({ data }: Props) {
    if (!data.length) return null;
    return (
        <div className="exp-dist-scroll">
            <div className="exp-dist-inner" style={{ minWidth: Math.max(280, data.length * 60) }}>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data} margin={{ left: -10, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" />
                        <XAxis dataKey="label" stroke="#3d5470" tick={{ fontSize: 9 }} interval={0} />
                        <YAxis stroke="#3d5470" tick={{ fontSize: 10 }} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="count" name="Пользователей" radius={[4, 4, 0, 0]}>
                            {data.map((_, i) => (
                                <Cell key={i} fill={`hsl(${260 + i * 10}, 70%, 60%)`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
