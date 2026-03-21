'use client';

import React from 'react';
import './charts.css';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { TOOLTIP_STYLE } from './chartConfig';

interface Props {
    data: any[];
}

export default function TopicBarChart({ data }: Props) {
    return (
        <div className="chart-scroll">
            <div className="chart-inner" style={{ minWidth: 320 }}>
                <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
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
    );
}
