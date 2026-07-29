'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './LeaderboardPage.css';
import Header from '@/widgets/Header/Header';
import CustomSelect from '@/shared/components/CustomSelect/CustomSelect';
import AdminApiService, { LeaderboardRow, type LeaderboardPage } from '@/shared/services/AdminApiService';

const PAGE_SIZES = [10, 20, 50];

const SORT_OPTIONS = [
    { value: 'solved',       label: 'Решено задач' },
    { value: 'uniqueSolved', label: 'Уникальных задач' },
    { value: 'rating',       label: 'Рейтинг' },
    { value: 'experience',   label: 'Опыт' },
    { value: 'submissions',  label: 'Попыток' },
];

const AVATAR_COLORS = ['#FF6B35', '#F04949', '#4ade80', '#fbbf24', '#8b5cf6', '#3b82f6', '#ec4899'];
function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
}
function fmtNum(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n); }

function Avatar({ username, size = 48, glow }: { username: string; size?: number; glow?: string }) {
    const color = getAvatarColor(username);
    return (
        <div
            className="lb-avatar"
            style={{
                width: size, height: size, fontSize: size * 0.36, background: color,
                boxShadow: glow ? `0 0 0 3px ${glow}60, 0 0 24px ${glow}40` : undefined,
            }}
        >
            {getInitials(username)}
        </div>
    );
}

const RANK_GLOWS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_LABELS = ['1ST', '2ND', '3RD'];

function CrownIcon() {
    return (

        <img src="/images/goose-winer.png" alt="winner goose" className="lb-crown-icon" />
    );
}

const PODIUM_ORDER_IDX = [1, 0, 2];

const GOOSE_PHRASES = [
    'Поздравляю лидеров! 🎉',
    'Так держать, чемпионы!',
    'Вы лучшие на платформе!',
    '1-е место — просто огонь! 🔥',
    'Горжусь вами! 🦢',
    'Вперёд к новым победам!',
];

function GooseCelebration() {
    const [phraseIdx, setPhraseIdx] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;
        const show = () => {
            setPhraseIdx(i => (i + 1) % GOOSE_PHRASES.length);
            setVisible(true);
            setTimeout(() => setVisible(false), 2200);
        };
        const t = setTimeout(() => {
            show();
            intervalId = setInterval(show, 4000);
        }, 1200);
        return () => { clearTimeout(t); clearInterval(intervalId); };
    }, []);

    return (
        <div className="lb-goose-stage">
            <div className="lb-goose-walker">
                {visible && (
                    <div className="lb-speech-bubble">{GOOSE_PHRASES[phraseIdx]}</div>
                )}
                {}
                <img src="/images/goose-leader.gif" alt="" className="lb-goose-gif" />
            </div>
        </div>
    );
}

function Podium({ top3 }: { top3: LeaderboardRow[] }) {
    if (top3.length === 0) return null;
    const slots = PODIUM_ORDER_IDX.map(i => top3[i]).filter(Boolean);
    const posClass = ['second', 'first', 'third'];

    return (
        <div className="lb-podium-wrap">
        <div className="lb-podium">
            {slots.map((user, vi) => {
                const rank = user.rank;
                const glow = RANK_GLOWS[rank - 1];
                const isFirst = rank === 1;
                return (
                    <div key={user.id} className={`lb-podium__card lb-podium__card--${posClass[vi]}`}>
                        {isFirst && <CrownIcon />}
                        <div className="lb-podium__rank-badge lb-podium__rank-badge--rank${rank}"
                            style={{ background: `${glow}22`, border: `1px solid ${glow}60`, color: glow }}>
                            {RANK_LABELS[rank - 1]}
                        </div>
                        <Avatar username={user.username} size={isFirst ? 80 : 60} glow={glow} />
                        <span className="lb-podium__name">{user.username}</span>
                        <div className="lb-podium__stats-row">
                            <div className="lb-podium__stat-pill lb-podium__stat-pill--green">
                                <span>✓</span> {user.solved}
                            </div>
                            <div className="lb-podium__stat-pill lb-podium__stat-pill--orange">
                                <span>★</span> {user.rating}
                            </div>
                        </div>
                        <div className="lb-podium__bar" style={{ background: `linear-gradient(180deg, ${glow}30, ${glow}08)`, borderColor: `${glow}40` }} />
                    </div>
                );
            })}
        </div>
        <GooseCelebration />
        </div>
    );
}

function LeaderboardContent() {
    const [data,    setData]    = useState<LeaderboardPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    const [sortBy,  setSortBy]  = useState('solved');
    const [sortDir, setSortDir] = useState<'DESC' | 'ASC'>('DESC');
    const [page,    setPage]    = useState(1);
    const [limit,   setLimit]   = useState(20);
    const [top3,    setTop3]    = useState<LeaderboardRow[]>([]);
    const top3Fetched = useRef(false);

    const load = useCallback(async (p = page, s = search, sb = sortBy, sd = sortDir, lim = limit) => {
        setLoading(true);
        try {
            const res = await AdminApiService.getLeaderboard({ page: p, limit: lim, search: s, sortBy: sb, sortDir: sd });
            setData(res);
        } finally {
            setLoading(false);
        }
    }, [page, search, sortBy, sortDir, limit]);

    useEffect(() => {
        load(1, '', 'solved', 'DESC', limit);
        if (!top3Fetched.current) {
            top3Fetched.current = true;
            AdminApiService.getLeaderboard({ page: 1, limit: 3, search: '', sortBy: 'solved', sortDir: 'DESC' })
                .then(res => setTop3(res.rows));
        }

    }, []);

    const applySort = (newSortBy: string) => {
        const newDir = newSortBy === sortBy ? (sortDir === 'DESC' ? 'ASC' : 'DESC') : 'DESC';
        setSortBy(newSortBy);
        setSortDir(newDir);
        setPage(1);
        load(1, search, newSortBy, newDir, limit);
    };

    const applySearch = () => { setPage(1); load(1, search, sortBy, sortDir, limit); };
    const goTo = (p: number) => { setPage(p); load(p, search, sortBy, sortDir, limit); };
    const handleLimit = (v: string) => { const n = Number(v); setLimit(n); setPage(1); load(1, search, sortBy, sortDir, n); };

    const totalPages = data ? Math.ceil(data.total / limit) || 1 : 1;

    const SortTh = ({ col, label }: { col: string; label: string }) => (
        <th className={`lb-th lb-th--sortable${sortBy === col ? ' lb-th--active' : ''}`} onClick={() => applySort(col)}>
            <span className="lb-th-inner">
                {label}
                <span className="lb-sort-arr">{sortBy === col ? (sortDir === 'DESC' ? '↓' : '↑') : '↕'}</span>
            </span>
        </th>
    );

    return (
        <main className="lb-main app-main-page">
            <div className="lb-container">

                {}
                <div className="lb-page-header">
                    <div className="lb-page-header__left">
                        <h1 className="lb-page-header__title">
                            <span className="lb-page-header__title-accent">Таблица</span> лидеров
                        </h1>
                        <p className="lb-page-header__sub">Лучшие решатели на платформе</p>
                    </div>
                    {data && (
                        <div className="lb-page-header__right">
                            <span className="lb-page-header__badge">{data.total.toLocaleString()}</span>
                            <span className="lb-page-header__badge-label">участников</span>
                        </div>
                    )}
                </div>

                {}
                <Podium top3={top3} />

                {}
                <div className="lb-filters">
                    <div className="lb-filters__search">
                        <div className="lb-search-wrap">
                            <span className="lb-search-icon">⌕</span>
                            <input
                                className="lb-search-input"
                                placeholder="Поиск по нику..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applySearch()}
                            />
                        </div>
                        <button className="lb-search-btn" onClick={applySearch}>Найти</button>
                    </div>
                    <div className="lb-filters__right">
                        <div className="lb-filter-group">
                            <span className="lb-filter-label">Сортировка</span>
                            <CustomSelect
                                small
                                value={sortBy}
                                onChange={v => applySort(v)}
                                options={SORT_OPTIONS}
                            />
                        </div>
                        <button
                            className="lb-dir-btn"
                            onClick={() => applySort(sortBy)}
                            title={sortDir === 'DESC' ? 'По убыванию' : 'По возрастанию'}
                        >
                            {sortDir === 'DESC' ? '↓' : '↑'}
                        </button>
                        <div className="lb-filter-group">
                            <span className="lb-filter-label">На странице</span>
                            <CustomSelect small value={String(limit)} onChange={handleLimit}
                                options={PAGE_SIZES.map(n => ({ value: String(n), label: `${n}` }))} />
                        </div>
                    </div>
                </div>

                {}
                <div className="lb-card">
                    {loading ? (
                        <div className="lb-spinner-wrap"><div className="lb-spinner" /></div>
                    ) : (
                        <div key={page} className="lb-table-scroll">
                            <table className="lb-table">
                                <thead>
                                    <tr className="lb-thead-row">
                                        <th className="lb-th lb-th--rank">#</th>
                                        <th className="lb-th lb-th--player">Игрок</th>
                                        <SortTh col="solved"       label="Решено" />
                                        <SortTh col="uniqueSolved" label="Уникальных" />
                                        <SortTh col="submissions"  label="Попыток" />
                                        <SortTh col="rating"       label="Рейтинг" />
                                        <SortTh col="experience"   label="Опыт" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {!data || data.rows.length === 0 ? (
                                        <tr><td colSpan={7} className="lb-td lb-empty">Игроки не найдены</td></tr>
                                    ) : data.rows.map((row, idx) => (
                                        <tr key={row.id} className={`lb-row${row.rank <= 3 ? ` lb-row--top${row.rank}` : idx % 2 === 1 ? ' lb-row--alt' : ''}`}>
                                            <td className="lb-td lb-td--rank">
                                                {row.rank === 1 && <span className="lb-rank-badge lb-rank-badge--gold">1</span>}
                                                {row.rank === 2 && <span className="lb-rank-badge lb-rank-badge--silver">2</span>}
                                                {row.rank === 3 && <span className="lb-rank-badge lb-rank-badge--bronze">3</span>}
                                                {row.rank > 3 && <span className="lb-rank-num">{row.rank}</span>}
                                            </td>
                                            <td className="lb-td lb-td--player">
                                                <div className="lb-player">
                                                    <Avatar username={row.username} size={34} />
                                                    <div className="lb-player__info">
                                                        <span className="lb-player__name">{row.username}</span>
                                                        <span className="lb-player__xp">{fmtNum(row.experience)} XP</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="lb-td lb-td--num">
                                                <span className="lb-val lb-val--green">{row.solved}</span>
                                            </td>
                                            <td className="lb-td lb-td--num">
                                                <span className="lb-val lb-val--muted">{row.uniqueSolved}</span>
                                            </td>
                                            <td className="lb-td lb-td--num">
                                                <span className="lb-val lb-val--muted">{fmtNum(row.submissions)}</span>
                                            </td>
                                            <td className="lb-td lb-td--num">
                                                <span className="lb-val lb-val--orange">{row.rating}</span>
                                            </td>
                                            <td className="lb-td lb-td--num">
                                                <span className="lb-val lb-val--muted">{fmtNum(row.experience)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {}
                    {!loading && totalPages > 1 && (
                        <div className="lb-pagination">
                            <button className="lb-page-btn" disabled={page === 1} onClick={() => goTo(1)}>«</button>
                            <button className="lb-page-btn" disabled={page === 1} onClick={() => goTo(page - 1)}>‹</button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                    acc.push(p); return acc;
                                }, [])
                                .map((p, i) => p === '...'
                                    ? <span key={`e${i}`} className="lb-page-ellipsis">…</span>
                                    : <button key={p} className={`lb-page-btn${page === p ? ' lb-page-btn--active' : ''}`} onClick={() => goTo(p as number)}>{p}</button>
                                )}
                            <button className="lb-page-btn" disabled={page === totalPages} onClick={() => goTo(page + 1)}>›</button>
                            <button className="lb-page-btn" disabled={page === totalPages} onClick={() => goTo(totalPages)}>»</button>
                            <span className="lb-page-info">{(page - 1) * limit + 1}–{Math.min(page * limit, data?.total ?? 0)} из {data?.total}</span>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function LeaderboardPage() {
    return (
        <>
            <Header />
            <LeaderboardContent />
        </>
    );
}
