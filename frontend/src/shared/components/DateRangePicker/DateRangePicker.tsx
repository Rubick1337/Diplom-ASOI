'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import './DateRangePicker.css';

const MONTHS_RU = [
    'Январь','Февраль','Март','Апрель','Май','Июнь',
    'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];
const DAYS_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function toDateStr(d: Date) {
    return d.toISOString().split('T')[0];
}

function parseDate(s: string) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function formatDisplay(s: string) {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}.${m}.${y}`;
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {

    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

interface CalendarProps {
    year: number;
    month: number;
    from: string;
    to: string;
    hovered: string;
    selecting: 'from' | 'to';
    onDayClick: (d: string) => void;
    onDayHover: (d: string) => void;
    onPrev: () => void;
    onNext: () => void;
}

function Calendar({ year, month, from, to, hovered, selecting, onDayClick, onDayHover, onPrev, onNext }: CalendarProps) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = toDateStr(new Date());

    const fromDate = from ? parseDate(from) : null;
    const toDate   = to   ? parseDate(to)   : null;
    const hoverDate = hovered ? parseDate(hovered) : null;

    const rangeEnd = selecting === 'to'
        ? (hoverDate ?? toDate)
        : toDate;

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="drp-cal">
            <div className="drp-cal__nav">
                <button className="drp-cal__arrow" onClick={onPrev}>‹</button>
                <span className="drp-cal__title">{MONTHS_RU[month]} {year}</span>
                <button className="drp-cal__arrow" onClick={onNext}>›</button>
            </div>
            <div className="drp-cal__grid">
                {DAYS_RU.map(d => (
                    <div key={d} className="drp-cal__dow">{d}</div>
                ))}
                {cells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} />;

                    const date = new Date(year, month, day);
                    const dateStr = toDateStr(date);
                    const isToday   = dateStr === today;
                    const isFrom    = fromDate && isSameDay(date, fromDate);
                    const isTo      = toDate   && isSameDay(date, toDate);
                    const isHovered = hoverDate && selecting === 'to' && isSameDay(date, hoverDate);

                    const inRange = fromDate && rangeEnd
                        ? date > fromDate && date < rangeEnd
                        : false;

                    const isStart = isFrom;
                    const isEnd   = selecting === 'to' ? isHovered || isTo : isTo;

                    let cls = 'drp-cal__day';
                    if (isToday)  cls += ' drp-cal__day--today';
                    if (isStart)  cls += ' drp-cal__day--start';
                    if (isEnd && to) cls += ' drp-cal__day--end';
                    if (inRange)  cls += ' drp-cal__day--range';
                    if (isHovered && selecting === 'to') cls += ' drp-cal__day--hover';

                    return (
                        <button
                            key={dateStr}
                            className={cls}
                            onClick={() => onDayClick(dateStr)}
                            onMouseEnter={() => onDayHover(dateStr)}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface Props {
    from: string;
    to: string;
    onChange: (from: string, to: string) => void;
}

export default function DateRangePicker({ from, to, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const [selecting, setSelecting] = useState<'from' | 'to'>('from');
    const [hovered, setHovered] = useState('');
    const [tempFrom, setTempFrom] = useState(from);
    const [tempTo, setTempTo] = useState(to);
    const [flipLeft, setFlipLeft] = useState(false);

    const initDate = from ? parseDate(from) : new Date();
    const [leftYear,  setLeftYear]  = useState(initDate.getFullYear());
    const [leftMonth, setLeftMonth] = useState(initDate.getMonth());

    const rightYear  = leftMonth === 11 ? leftYear + 1 : leftYear;
    const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;

    const ref    = useRef<HTMLDivElement>(null);
    const popRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open && popRef.current) {
            const rect = popRef.current.getBoundingClientRect();
            setFlipLeft(rect.left < 8);
        }
    }, [open]);

    const handleDayClick = (dateStr: string) => {
        if (selecting === 'from') {
            setTempFrom(dateStr);
            setTempTo('');
            setSelecting('to');
        } else {

            if (tempFrom && dateStr < tempFrom) {
                setTempFrom(dateStr);
                setTempTo(tempFrom);
            } else {
                setTempTo(dateStr);
            }
            setSelecting('from');
        }
    };

    const handleApply = () => {
        if (tempFrom && tempTo) {
            onChange(tempFrom, tempTo);
            setOpen(false);
        }
    };

    const handleClear = () => {
        setTempFrom('');
        setTempTo('');
        setSelecting('from');
    };

    const handleToday = () => {
        const t = toDateStr(new Date());
        onChange(t, t);
        setOpen(false);
    };

    const prevMonth = () => {
        if (leftMonth === 0) { setLeftMonth(11); setLeftYear(y => y - 1); }
        else setLeftMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (leftMonth === 11) { setLeftMonth(0); setLeftYear(y => y + 1); }
        else setLeftMonth(m => m + 1);
    };

    const label = (tempFrom || from) && (tempTo || to)
        ? `${formatDisplay(tempFrom || from)} — ${formatDisplay(tempTo || to)}`
        : tempFrom
            ? `${formatDisplay(tempFrom)} — ...`
            : 'Выбрать период';

    return (
        <div className="drp" ref={ref}>
            {}
            <button
                className={`drp-trigger${open ? ' drp-trigger--open' : ''}`}
                onClick={() => { setOpen(o => !o); setTempFrom(from); setTempTo(to); setSelecting('from'); }}
            >
                <Image src="/images/Admin/calendar.png" alt="calendar" width={16} height={16} className="drp-trigger__icon" />
                <span className="drp-trigger__label">{label}</span>
                <span className="drp-trigger__caret">▾</span>
            </button>

            {}
            {open && (
                <div ref={popRef} className={`drp-popup${flipLeft ? ' drp-popup--left' : ''}`}>
                    {}
                    <div className="drp-steps">
                        <div className={`drp-step${selecting === 'from' ? ' drp-step--active' : tempFrom ? ' drp-step--done' : ''}`}>
                            <span className="drp-step__num">1</span>
                            <span className="drp-step__text">Начало{tempFrom ? `: ${formatDisplay(tempFrom)}` : ''}</span>
                        </div>
                        <div className="drp-step__line" />
                        <div className={`drp-step${selecting === 'to' ? ' drp-step--active' : tempTo ? ' drp-step--done' : ''}`}>
                            <span className="drp-step__num">2</span>
                            <span className="drp-step__text">Конец{tempTo ? `: ${formatDisplay(tempTo)}` : ''}</span>
                        </div>
                    </div>

                    {}
                    <div className="drp-calendars">
                        <Calendar
                            year={leftYear} month={leftMonth}
                            from={tempFrom} to={tempTo}
                            hovered={hovered} selecting={selecting}
                            onDayClick={handleDayClick}
                            onDayHover={setHovered}
                            onPrev={prevMonth} onNext={nextMonth}
                        />
                        <div className="drp-divider" />
                        <Calendar
                            year={rightYear} month={rightMonth}
                            from={tempFrom} to={tempTo}
                            hovered={hovered} selecting={selecting}
                            onDayClick={handleDayClick}
                            onDayHover={setHovered}
                            onPrev={prevMonth} onNext={nextMonth}
                        />
                    </div>

                    {}
                    <div className="drp-footer">
                        <button className="drp-footer__btn drp-footer__btn--ghost" onClick={handleClear}>Очистить</button>
                        <button className="drp-footer__btn drp-footer__btn--ghost" onClick={handleToday}>Сегодня</button>
                        <button
                            className="drp-footer__btn drp-footer__btn--primary"
                            onClick={handleApply}
                            disabled={!tempFrom || !tempTo}
                        >
                            Применить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
