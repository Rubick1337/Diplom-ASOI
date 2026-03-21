'use client';

import React from 'react';
import './ChallengeFunnel.css';

interface Props {
    funnel: { stage: string; value: number }[];
}

export default function ChallengeFunnel({ funnel }: Props) {
    if (!funnel.length) return null;

    const funnelMax = funnel[0]?.value || 1;
    const colors = ['#67e8f9', '#00e5b0', '#fbbf24', '#c084fc'];

    return (
        <div className="insights-card insights-card--funnel">
            {funnel.map((stage, i) => {
                const pct = Math.round((stage.value / funnelMax) * 100);
                const dropPct = i > 0
                    ? Math.round(((funnel[i - 1].value - stage.value) / Math.max(funnel[i - 1].value, 1)) * 100)
                    : null;
                return (
                    <div key={i} className="funnel-stage">
                        <div className="funnel-stage__meta">
                            <span className="funnel-stage__label">{stage.stage}</span>
                            <span className="funnel-stage__value">{stage.value.toLocaleString()}</span>
                            {dropPct !== null && (
                                <span className="funnel-stage__drop">−{dropPct}%</span>
                            )}
                        </div>
                        <div className="funnel-stage__bar-wrap">
                            <div
                                className="funnel-stage__bar"
                                style={{ width: `${Math.max(pct, 2)}%`, background: colors[i] }}
                            />
                            <span className="funnel-stage__pct">{pct}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
