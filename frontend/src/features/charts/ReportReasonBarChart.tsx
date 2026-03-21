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

export default function ReportReasonBarChart({ data }: Props) {
    return (
        <div className="chart-scroll">
            <div className="chart-inner" style={{ minWidth: 340 }}>
                <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" horizontal={false} />
                        <XAxis type="number" stroke="#3d5470" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="reason" type="category" stroke="#3d5470" tick={{ fontSize: 10 }} width={115} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="total" name="Кол-во" fill="#fb7185" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
