'use client';

import React from 'react';
import Image from 'next/image';
import './Kpicard.css';

interface Props {
    label: string;
    value: string | number;
    sub?: string;
    color: string;
    icon: string;
}

export default function KpiCard({ label, value, sub, color, icon }: Props) {
    return (
        <div className="kpi-card" style={{ borderTopColor: color }}>
            <div className="kpi-card__icon-wrap" style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
                <Image src={icon} alt={label} width={28} height={28} className="kpi-card__icon" />
            </div>
            <span className="kpi-card__label">{label}</span>
            <span className="kpi-card__value">{value}</span>
            {sub && <span className="kpi-card__sub" style={{ color }}>{sub}</span>}
        </div>
    );
}
