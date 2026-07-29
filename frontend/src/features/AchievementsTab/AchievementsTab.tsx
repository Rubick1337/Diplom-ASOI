'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProfileService, { Achievement, AchievementRarity } from '@/shared/services/ProfileService';
import './AchievementsTab.css';
import '../SortSelect/SortSelect.css';

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:9005/api').replace(/\/api$/, '');
const PAGE_SIZE = 8;

const RARITY_ORDER: Record<AchievementRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
const RM: Record<AchievementRarity, { label: string; color: string; glow: string }> = {
    common:    { label: 'Common',    color: '#9ca3af', glow: 'rgba(156,163,175,.25)' },
    uncommon:  { label: 'Uncommon',  color: '#4ade80', glow: 'rgba(74,222,128,.30)'  },
    rare:      { label: 'Rare',      color: '#60a5fa', glow: 'rgba(96,165,250,.30)'  },
    epic:      { label: 'Epic',      color: '#c084fc', glow: 'rgba(192,132,252,.35)' },
    legendary: { label: 'Legendary', color: '#fbbf24', glow: 'rgba(251,191,36,.40)'  },
};

type SortKey = 'rarity_asc' | 'rarity_desc' | 'unlocked_first' | 'locked_first' | 'date_desc' | 'date_asc';

const SORT_OPTIONS: { value: SortKey; label: string; icon: string }[] = [
    { value: 'unlocked_first', label: 'Сначала полученные',    icon: '🏆' },
    { value: 'locked_first',   label: 'Сначала не полученные', icon: '🔒' },
    { value: 'rarity_desc',    label: 'Редкость: от высшей',   icon: '⬆' },
    { value: 'rarity_asc',     label: 'Редкость: от низшей',   icon: '⬇' },
    { value: 'date_desc',      label: 'Дата: новые сначала',   icon: '🕐' },
    { value: 'date_asc',       label: 'Дата: старые сначала',  icon: '🕰' },
];

function sortAchievements(list: Achievement[], sort: SortKey): Achievement[] {
    return [...list].sort((a, b) => {
        const aU = a.unlockedAt !== null, bU = b.unlockedAt !== null;
        if (sort === 'unlocked_first') { if (aU !== bU) return aU ? -1 : 1; return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]; }
        if (sort === 'locked_first')   { if (aU !== bU) return aU ? 1 : -1; return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]; }
        if (sort === 'rarity_desc') return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
        if (sort === 'rarity_asc')  return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
        if (sort === 'date_desc') { if (!aU && !bU) return 0; if (!aU) return 1; if (!bU) return -1; return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime(); }
        if (sort === 'date_asc')  { if (!aU && !bU) return 0; if (!aU) return 1; if (!bU) return -1; return new Date(a.unlockedAt!).getTime() - new Date(b.unlockedAt!).getTime(); }
        return 0;
    });
}

// ─── Custom Select ────────────────────────────────────────────────────────────
function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = SORT_OPTIONS.find(o => o.value === value)!;

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div className="custom-select-container" ref={ref}>
            <div className={`custom-select-trigger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)}>
                <span>{current.label}</span>
                <svg className="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            {open && (
                <div className="custom-options">
                    {SORT_OPTIONS.map(o => (
                        <div
                            key={o.value}
                            className={`custom-option${o.value === value ? ' selected' : ''}`}
                            onClick={() => { onChange(o.value); setOpen(false); }}
                        >
                            {o.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function AchievementCard({ a }: { a: Achievement }) {
    const rm = RM[a.rarity] ?? RM.common;
    const unlocked = a.unlockedAt !== null;
    return (
        <div
            className={`ach-card${unlocked ? ' ach-card--unlocked' : ' ach-card--locked'}`}
            style={unlocked ? { '--glow': rm.glow, '--color': rm.color } as React.CSSProperties : undefined}
        >
            <div className="ach-card__icon-wrap" style={unlocked ? { borderColor: rm.color } : undefined}>
                {a.imageFilename ? (
                    <img src={`${BACKEND_BASE}/achievements/${a.imageFilename}`} alt={a.title}
                        className="ach-card__img"
                        onError={e => { e.currentTarget.style.display = 'none'; const fb = e.currentTarget.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = 'inline'; }}
                    />
                ) : null}
                <span className="ach-card__icon" style={{ display: a.imageFilename ? 'none' : undefined }}>🏅</span>
                {unlocked && <div className="ach-card__glow" style={{ background: rm.glow }} />}
            </div>
            <div className="ach-card__body">
                <div className="ach-card__top">
                    <span className="ach-card__title">{a.title}</span>
                    <span className="ach-card__rarity" style={{ color: rm.color, borderColor: `${rm.color}40` }}>{rm.label}</span>
                </div>
                <p className="ach-card__desc">{a.desc}</p>
                <div className="ach-card__footer">
                    {unlocked && a.unlockedAt && (
                        <span className="ach-card__date">🗓 {new Date(a.unlockedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    )}
                    <span className="ach-card__pct">{a.percent}% игроков</span>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AchievementsTab() {
    const [all, setAll]         = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort]       = useState<SortKey>('unlocked_first');
    const [page, setPage]       = useState(1);
    const [animKey, setAnimKey] = useState(0);

    useEffect(() => {
        ProfileService.getAchievements().then(setAll).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const sorted     = useMemo(() => sortAchievements(all, sort), [all, sort]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const unlocked   = all.filter(a => a.unlockedAt !== null);

    const handleSort = (s: SortKey) => { setSort(s); setPage(1); setAnimKey(k => k + 1); };
    const handlePage = (p: number) => { setPage(p); setAnimKey(k => k + 1); };

    if (loading) return (
        <div className="ach-loading">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <div key={i} className="ach-skeleton" />)}
        </div>
    );

    return (
        <div className="ach-tab">
            {/* Header */}
            <div className="ach-header">
                <div className="ach-summary">
                    <span className="ach-summary__count">{unlocked.length}</span>
                    <span className="ach-summary__sep">/</span>
                    <span className="ach-summary__total">{all.length}</span>
                    <span className="ach-summary__label">достижений</span>
                </div>
                <div className="ach-rarity-bar">
                    {(Object.entries(RM) as [AchievementRarity, typeof RM[AchievementRarity]][]).map(([r, m]) => {
                        const cnt = unlocked.filter(a => a.rarity === r).length;
                        return (
                            <div key={r} className="ach-rarity-item">
                                <span className="ach-rarity-dot" style={{ background: m.color }} />
                                <span className="ach-rarity-name" style={{ color: m.color }}>{m.label}</span>
                                <span className="ach-rarity-cnt">{cnt}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Toolbar */}
            <div className="ach-toolbar">
                <SortSelect value={sort} onChange={handleSort} />
                <span className="ach-count-label">{sorted.length} достижений</span>
            </div>

            {/* Grid с анимацией при смене страницы */}
            <div className="ach-grid" key={animKey}>
                {paginated.map(a => <AchievementCard key={a.id} a={a} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="ach-pagination">
                    <button className="ach-page-btn ach-page-btn--nav" disabled={page === 1} onClick={() => handlePage(page - 1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            className={`ach-page-btn${p === page ? ' ach-page-btn--active' : ''}`}
                            onClick={() => handlePage(p)}
                        >{p}</button>
                    ))}
                    <button className="ach-page-btn ach-page-btn--nav" disabled={page === totalPages} onClick={() => handlePage(page + 1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                </div>
            )}
        </div>
    );
}
