'use client';

import React from 'react';
import './charts.css';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TOOLTIP_STYLE } from './chartConfig';
import FilterPills from '@/features/Filterpills/Filterpills';

interface Props {
    activity: any[];
    activityLines: Set<string>;
    setActivityLines: (v: Set<string>) => void;
}

export default function ActivityLineChart({ activity, activityLines, setActivityLines }: Props) {
    if (!activity.length) return null;
    return (
        <div className="overview-card">
            <div className="chart-scroll">
                <div className="chart-inner" style={{ minWidth: 320 }}>
                    <ResponsiveContainer width="100%" height={290}>
                        <LineChart data={activity} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a2b42" />
                            <XAxis dataKey="date" stroke="#3d5470" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                            <YAxis stroke="#3d5470" tick={{ fontSize: 10 }} />
                            <Tooltip {...TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ color: '#3d5470', fontSize: 11 }} />
                            {activityLines.has('submissions') && <Line type="monotone" dataKey="submissions" name="Всего"     stroke="#67e8f9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                            {activityLines.has('successes')   && <Line type="monotone" dataKey="successes"   name="Успешных"  stroke="#00e5b0" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                            {activityLines.has('failures')    && <Line type="monotone" dataKey="failures"    name="Неудачных" stroke="#fb7185" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
