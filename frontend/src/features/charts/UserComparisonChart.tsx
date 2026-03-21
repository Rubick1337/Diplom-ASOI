'use client';

import React from 'react';
import './charts.css';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TOOLTIP_STYLE } from './chartConfig';

interface Props {
    users: any[];
}

export default function UserComparisonChart({ users }: Props) {
    if (!users.length) return null;
    return (
        <div className="users-card">
            <div className="users-chart-scroll">
                <div
                    className="users-chart-inner"
                    style={{ minWidth: Math.max(320, users.length * 90) }}
                >
                    <ResponsiveContainer width="100%" height={270}>
                        <BarChart data={users} margin={{ left: -10 }}>
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
    );
}
