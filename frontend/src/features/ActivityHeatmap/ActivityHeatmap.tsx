'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import ProfileService from '@/shared/services/ProfileService';
import './ActivityHeatmap.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

interface Props {
    days: Record<string, number>;
}

const MONTHS_RU  = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const WEEKDAYS   = ['', 'пн', '', 'ср', '', 'пт', ''];

const CELL  = 10;
const GAP   =  3;
const STEP  = CELL + GAP;

function level(count: number) {
    if (count === 0) return 0;
    if (count <= 2)  return 1;
    if (count <= 4)  return 2;
    if (count <= 7)  return 3;
    return 4;
}

const COLORS = ['#1a1a1a', '#4a1f0a', '#8a3815', '#c45520', '#FF6B35'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function dateKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function pluralTry(n: number) {
    if (n % 10 === 1 && n % 100 !== 11) return 'попытка';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'попытки';
    return 'попыток';
}

export default function ActivityHeatmap({ days: defaultDays }: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [tooltip,      setTooltip]      = useState<{ x: number; y: number; text: string } | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [yearDays,     setYearDays]     = useState<Record<string, number> | null>(null);
    const [loadingYear,  setLoadingYear]  = useState(false);

    const days = (selectedYear === CURRENT_YEAR && yearDays === null) ? defaultDays : (yearDays ?? {});

    useEffect(() => {
        if (selectedYear === CURRENT_YEAR) { setYearDays(null); return; }
        setLoadingYear(true);
        ProfileService.getActivityHeatmap(selectedYear)
            .then(r => setYearDays(r.days))
            .catch(() => setYearDays({}))
            .finally(() => setLoadingYear(false));
    }, [selectedYear]);

    const { weeks, monthLabels, total, streak, maxStreak, todayKey } = useMemo(() => {
        const year = selectedYear;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yearEnd = new Date(year, 11, 31);

        const jan1 = new Date(year, 0, 1);
        const start = new Date(jan1);
        start.setDate(jan1.getDate() - jan1.getDay());

        const weeksArr: { date: string; count: number; future: boolean }[][] = [];
        const cur = new Date(start);
        while (cur <= yearEnd || weeksArr[weeksArr.length - 1]?.length < 7) {
            if (!weeksArr.length || weeksArr[weeksArr.length - 1].length === 7) {
                weeksArr.push([]);
            }
            const future = cur > today;
            const beforeYear = cur < jan1;
            weeksArr[weeksArr.length - 1].push({
                date:   dateKey(cur),
                count:  (future || beforeYear) ? 0 : (days[dateKey(cur)] || 0),
                future: future || beforeYear,
            });
            cur.setDate(cur.getDate() + 1);
        }

        const labels: { label: string; x: number }[] = [];
        let lastMonth = -1;
        weeksArr.forEach((week, wi) => {

            const firstInYear = week.find(d => new Date(d.date + 'T00:00:00').getFullYear() === year);
            if (!firstInYear) return;
            const m = new Date(firstInYear.date + 'T00:00:00').getMonth();
            if (m !== lastMonth) {
                labels.push({ label: MONTHS_RU[m], x: wi * STEP });
                lastMonth = m;
            }
        });

        let tot = 0;
        for (const v of Object.values(days)) tot += v;

        let st = 0;
        const d = new Date(today);
        while (true) {
            const k = dateKey(d);
            if ((days[k] || 0) > 0) { st++; d.setDate(d.getDate() - 1); }
            else break;
        }

        let maxSt = 0, tmp = 0;
        const allKeys = Object.keys(days).sort();
        for (const k of allKeys) {
            if ((days[k] || 0) > 0) { tmp++; maxSt = Math.max(maxSt, tmp); }
            else tmp = 0;
        }

        const todayKey = dateKey(today);

        return { weeks: weeksArr, monthLabels: labels, total: tot, streak: st, maxStreak: maxSt, todayKey };
    }, [days, selectedYear]);

    const gridWidth  = weeks.length * STEP - GAP;
    const gridHeight = 7 * STEP - GAP;
    const LEFT_PAD   = 26;

    const handleMouseEnter = (e: React.MouseEvent<SVGRectElement>, date: string, count: number, future: boolean) => {
        if (future) return;
        const root = rootRef.current!.getBoundingClientRect();
        const cell = (e.target as SVGRectElement).getBoundingClientRect();
        const x    = cell.left - root.left + CELL / 2;
        const y    = cell.top  - root.top;
        const d    = new Date(date + 'T00:00:00');
        const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        const text  = count === 0
            ? `${label} — нет активности`
            : `${label} — ${count} ${pluralTry(count)}`;
        setTooltip({ x, y, text });
    };

    const svgW = LEFT_PAD + gridWidth;
    const svgH = 16 + gridHeight;

    return (
        <div className="ahm-root" ref={rootRef} style={{ position: 'relative' }}>

            {}
            {tooltip && (
                <div className="ahm-tooltip" style={{ left: tooltip.x, top: tooltip.y - 38 }}>
                    {tooltip.text}
                    <span className="ahm-tooltip-arrow" />
                </div>
            )}

            {}
            <div className="ahm-header">
                <div className="ahm-title-row">
                    <span className="ahm-title">Активность</span>
                    <div className="ahm-year-tabs">
                        {YEARS.map(y => (
                            <button
                                key={y}
                                className={`ahm-year-btn${selectedYear === y ? ' active' : ''}`}
                                onClick={() => setSelectedYear(y)}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="ahm-stats">
                    {loadingYear ? (
                        <span className="ahm-dim">Загрузка...</span>
                    ) : (
                        <>
                            <span className="ahm-stat">
                                <b style={{ color: '#FF6B35' }}>{total}</b> попыток за год
                            </span>
                            {streak > 0 && selectedYear === CURRENT_YEAR && (
                                <span className="ahm-stat">
                                    <b style={{ color: '#fbbf24' }}>{streak}</b> дней подряд
                                </span>
                            )}
                            {maxStreak > 1 && (
                                <span className="ahm-stat ahm-dim">лучший стрик: {maxStreak} дн.</span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {}
            <div className="ahm-wrap" ref={wrapRef} onMouseLeave={() => setTooltip(null)}>

                <svg width={svgW} height={svgH} style={{ overflow: 'visible', display: 'block' }}>

                    {}
                    {monthLabels.map(({ label, x }) => (
                        <text key={label + x}
                            x={LEFT_PAD + x}
                            y={11}
                            className="ahm-month-text">
                            {label}
                        </text>
                    ))}

                    {}
                    {WEEKDAYS.map((d, i) => d && (
                        <text key={i}
                            x={LEFT_PAD - 6}
                            y={16 + i * STEP + CELL - 1}
                            className="ahm-day-text">
                            {d}
                        </text>
                    ))}

                    {}
                    {weeks.map((week, wi) =>
                        week.map(({ date, count, future }, di) => (
                            <rect
                                key={date}
                                x={LEFT_PAD + wi * STEP}
                                y={16 + di * STEP}
                                width={CELL}
                                height={CELL}
                                rx={2}
                                ry={2}
                                fill={future ? 'transparent' : COLORS[level(count)]}
                                stroke={date === todayKey ? '#FF6B35' : 'none'}
                                strokeWidth={date === todayKey ? 1.5 : 0}
                                className={future ? '' : 'ahm-cell-rect'}
                                onMouseEnter={e => handleMouseEnter(e, date, count, future)}
                            />
                        ))
                    )}
                </svg>

                {}
                <div className="ahm-legend">
                    <span className="ahm-dim">меньше</span>
                    {COLORS.map((c, i) => (
                        <svg key={i} width={CELL} height={CELL}>
                            <rect x={0} y={0} width={CELL} height={CELL} rx={2} fill={c} />
                        </svg>
                    ))}
                    <span className="ahm-dim">больше</span>
                </div>
            </div>

        </div>
    );
}
