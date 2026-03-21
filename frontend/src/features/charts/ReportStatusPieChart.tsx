'use client';

import React from 'react';
import './charts.css';
import {
    PieChart, Pie, Cell,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import { TOOLTIP_STYLE } from './chartConfig';

const STATUS_COLOR_MAP: Record<string, string> = {
    Pending: '#fbbf24',
    Resolved: '#00e5b0',
    Dismissed: '#3d5470',
};

interface Props {
    data: any[];
}

export default function ReportStatusPieChart({ data }: Props) {
    return (
        <div className="chart-scroll">
            <div className="chart-inner" style={{ minWidth: 260 }}>
                <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="total" nameKey="status"
                            cx="50%" cy="50%"
                            outerRadius={82} innerRadius={36}
                            paddingAngle={4}
                            label={({ name, value }) => `${name ?? ''}: ${value ?? ''}`}
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={STATUS_COLOR_MAP[entry.status] ?? '#3d5470'} />
                            ))}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
