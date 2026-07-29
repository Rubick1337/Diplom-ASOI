'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import {
    fetchProfile,
    fetchMyHistory,
    fetchMyTestHistory,
    fetchMyReports,
    fetchLearningPlan,
    fetchActivityHeatmap,
} from '@/shared/store/slice/profileSlice';
import dynamic from 'next/dynamic';

// SyntaxHighlighter использует refractor (ESM-only) — загружаем только на клиенте
// чтобы избежать ERR_REQUIRE_ESM во время SSR-сборки Next.js Pages Router.
const SyntaxHighlighter = dynamic(
    () => import('@/shared/components/ClientSyntaxHighlighter/ClientSyntaxHighlighter'),
    { ssr: false, loading: () => <pre style={{ padding: 16, background: '#0d0d0d' }} /> }
) as any;

import { useTheme } from '@/shared/context/ThemeContext';
import CustomSelect from '@/shared/components/CustomSelect/CustomSelect';
import AnalysisTab from '@/features/AnalysisTab/AnalysisTab';
import LearningTab from '@/features/LearningTab/LearningTab';
import AchievementsTab from '@/features/AchievementsTab/AchievementsTab';
import ActivityHeatmap from '@/features/ActivityHeatmap/ActivityHeatmap';
import Header from '@/widgets/Header/Header';
import './ProfilePage.css';

const PRISM_LANG: Record<string, string> = {
    javascript: 'javascript', typescript: 'typescript',
    python: 'python', cpp: 'cpp', csharp: 'csharp',
    php: 'php', coffeescript: 'coffeescript',
};

const XP_PER_LEVEL = 500;
const PAGE_SIZE    = 10;

const LANG_COLORS: Record<string, string> = {
    javascript:   '#f7df1e',
    typescript:   '#3178c6',
    python:       '#3572A5',
    cpp:          '#f34b7d',
    csharp:       '#178600',
    php:          '#4F5D95',
    coffeescript: '#244776',
};

const DIFF_INFO: Record<number, { label: string; color: string }> = {
    1: { label: 'Easy',   color: '#4ade80' },
    2: { label: 'Medium', color: '#fbbf24' },
    3: { label: 'Hard',   color: '#f87171' },
};

const getAvatarColor = (name: string) => {
    const palette = ['#FF6B35', '#F04949', '#4ade80', '#a78bfa', '#38bdf8', '#fb923c'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
};

const getLevelInfo = (lvl: number) => {
    if (lvl >= 20) return { label: 'Legend',      color: '#866cc7' };
    if (lvl >= 15) return { label: 'Expert',       color: '#3c7ebe' };
    if (lvl >= 10) return { label: 'Advanced',     color: '#ecb613' };
    if (lvl >= 5)  return { label: 'Intermediate', color: '#FF6B35' };
    return                 { label: 'Beginner',     color: '#888'    };
};

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

const getReportStatus = (status: string) => {
    switch (status) {
        case 'Pending':  return { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   label: 'Ожидает' };
        case 'Reviewed': return { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',   label: 'На рассмотрении' };
        case 'Resolved': return { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   label: 'Решено' };
        case 'Rejected': return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Отклонено' };
        default:         return { color: '#888',    bg: '#1a1a1a',                label: status };
    }
};

type ActiveTab = 'history' | 'testHistory' | 'reports' | 'analysis' | 'learning' | 'achievements';

export default function ProfilePage() {
    const router   = useRouter();
    const dispatch = useAppDispatch();
    const { theme } = useTheme();

    const { data: profile, isLoading, history, testHistory, reports, learningPlan, learningLoading, heatmap } = useAppSelector(s => s.profile);
    const { isInitialized, isAuth } = useAppSelector(s => s.auth);

    const [activeTab,      setActiveTab]      = useState<ActiveTab>('history');
    const [confettiOff,    setConfettiOff]    = useState(() =>
        typeof window !== 'undefined' && localStorage.getItem('confetti_disabled') === '1'
    );
    const [achSoundOff,    setAchSoundOff]    = useState(() =>
        typeof window !== 'undefined' && localStorage.getItem('achievement_sound_disabled') === '1'
    );

    const [histSearch,   setHistSearch]   = useState('');
    const [histStatus,   setHistStatus]   = useState('all');
    const [histLang,     setHistLang]     = useState('all');
    const [histPage,     setHistPage]     = useState(1);
    const [expandedId,   setExpandedId]   = useState<number | null>(null);

    const [testHistSearch,  setTestHistSearch]  = useState('');
    const [testHistStatus,  setTestHistStatus]  = useState('all');
    const [testHistPage,    setTestHistPage]    = useState(1);

    const [repSearch,    setRepSearch]    = useState('');
    const [repStatus,    setRepStatus]    = useState('all');
    const [repPage,      setRepPage]      = useState(1);

    const histDebounce     = useRef<ReturnType<typeof setTimeout> | null>(null);
    const testHistDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const repDebounce      = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isInitialized) return;
        if (!isAuth) { router.push('/auth/login'); return; }
        dispatch(fetchProfile()).unwrap().catch(() => router.push('/auth/login'));
        dispatch(fetchActivityHeatmap());
    }, [isInitialized, isAuth]);

    useEffect(() => {
        if (activeTab !== 'history') return;
        if (histDebounce.current) clearTimeout(histDebounce.current);
        histDebounce.current = setTimeout(() => {
            dispatch(fetchMyHistory({ page: histPage, pageSize: PAGE_SIZE, search: histSearch || undefined, status: histStatus, language: histLang }));
        }, 300);
    }, [activeTab, histSearch, histStatus, histLang, histPage]);

    useEffect(() => {
        if (activeTab !== 'testHistory') return;
        if (testHistDebounce.current) clearTimeout(testHistDebounce.current);
        testHistDebounce.current = setTimeout(() => {
            dispatch(fetchMyTestHistory({ page: testHistPage, pageSize: PAGE_SIZE, search: testHistSearch || undefined, status: testHistStatus }));
        }, 300);
    }, [activeTab, testHistSearch, testHistStatus, testHistPage]);

    useEffect(() => {
        if (activeTab !== 'learning') return;
        if (learningPlan) return;
        dispatch(fetchLearningPlan());
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'reports') return;
        if (repDebounce.current) clearTimeout(repDebounce.current);
        repDebounce.current = setTimeout(() => {
            dispatch(fetchMyReports({ page: repPage, pageSize: PAGE_SIZE, search: repSearch || undefined, status: repStatus }));
        }, 300);
    }, [activeTab, repSearch, repStatus, repPage]);

    const setHistFilter     = (fn: () => void) => { setHistPage(1); fn(); };
    const setTestHistFilter = (fn: () => void) => { setTestHistPage(1); fn(); };
    const setRepFilter      = (fn: () => void) => { setRepPage(1); fn(); };

    if (isLoading) return <LoadingSkeleton />;
    if (!profile)  return null;

    const { user, stats, languages, topics, allTopics } = profile;
    const level     = Math.floor(user.experience / XP_PER_LEVEL) + 1;
    const xpIn      = user.experience % XP_PER_LEVEL;
    const xpPct     = (xpIn / XP_PER_LEVEL) * 100;
    const initials  = user.username.slice(0, 2).toUpperCase();
    const avatarBg  = getAvatarColor(user.username);
    const lvl       = getLevelInfo(level);
    const totalLang = languages.reduce((s, l) => s + l.count, 0);
    const ringFill  = stats.totalAttempts > 0 ? (stats.solvedCount / stats.totalAttempts) * 213.6 : 0;

    const TABS: { key: ActiveTab; label: string; count?: number }[] = [
        { key: 'history',     label: 'История задач', count: history.total     || undefined },
        { key: 'testHistory', label: 'История тестов', count: testHistory.total || undefined },
        { key: 'reports',  label: 'Жалобы',     count: reports.total  || undefined },
        { key: 'analysis', label: 'Статистика' },
        { key: 'learning',      label: 'Обучение'    },
        { key: 'achievements',  label: 'Достижения'  },
    ];

    return (
        <>
        <Header />
        <div className="p-page">
            <div className="p-layout">

                {}
                <aside className="p-sidebar">
                    <div className="p-user-card">
                        <div className="p-avatar-wrap">
                            <div className="p-avatar" style={{ background: avatarBg }}>
                                {initials}
                                <div className="p-avatar-shine" />
                            </div>
                        </div>
                        <h1 className="p-username">{user.username}</h1>
                        <div className="p-email">{user.email}</div>
                        <span className="p-level-chip" style={{ color: lvl.color, borderColor: lvl.color }}>
                            LVL {level} · {lvl.label}
                        </span>
                        <div className="p-xp-bar-wrap">
                            <div className="p-xp-track">
                                <div className="p-xp-fill" style={{ width: `${xpPct}%`, background: lvl.color }} />
                            </div>
                            <span className="p-xp-label">{xpIn} / {XP_PER_LEVEL} XP до LVL {level + 1}</span>
                        </div>
                    </div>

                    <div className="p-sidebar-card">
                        <div className="p-sidebar-card-title">Статистика решений</div>
                        <div className="p-solved-ring-wrap">
                            <div className="p-solved-ring">
                                <svg viewBox="0 0 80 80" fill="none">
                                    <circle cx="40" cy="40" r="34" stroke="#1e1e1e" strokeWidth="7" />
                                    <circle cx="40" cy="40" r="34"
                                        stroke="#FF6B35" strokeWidth="7"
                                        strokeLinecap="round"
                                        strokeDasharray={`${ringFill} 213.6`}
                                        transform="rotate(-90 40 40)"
                                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                                    />
                                </svg>
                                <div className="p-solved-ring-center">
                                    <span className="p-solved-ring-num">{stats.solvedCount}</span>
                                    <span className="p-solved-ring-sub">решено</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-stat-rows">
                            {[
                                { label: 'Всего попыток',  val: stats.totalAttempts },
                                { label: 'Успешность',     val: `${stats.successRate}%` },
                                { label: 'Среднее время',  val: stats.avgTime != null ? `${stats.avgTime}ms` : '—' },
                                { label: 'Рейтинг',        val: user.rating ?? '—' },
                            ].map(({ label, val }) => (
                                <div key={label} className="p-stat-row">
                                    <span className="p-stat-label">{label}</span>
                                    <span className="p-stat-val">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {languages.length > 0 && (
                        <div className="p-sidebar-card">
                            <div className="p-sidebar-card-title">Языки</div>
                            <div className="p-lang-stacked">
                                {languages.map(l => (
                                    <div key={l.lang} className="p-lang-seg"
                                        style={{ width: `${(l.count / totalLang) * 100}%`, background: LANG_COLORS[l.lang] ?? '#555' }}
                                        title={`${l.lang}: ${l.count}`}
                                    />
                                ))}
                            </div>
                            <div className="p-lang-rows">
                                {languages.map(l => (
                                    <div key={l.lang} className="p-lang-row">
                                        <div className="p-lang-left">
                                            <span className="p-lang-dot" style={{ background: LANG_COLORS[l.lang] ?? '#555' }} />
                                            <span className="p-lang-name">{l.lang}</span>
                                        </div>
                                        <div className="p-lang-bar-bg">
                                            <div className="p-lang-bar" style={{
                                                width: `${(l.count / (languages[0]?.count || 1)) * 100}%`,
                                                background: LANG_COLORS[l.lang] ?? '#555',
                                            }} />
                                        </div>
                                        <span className="p-lang-count">{l.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="p-sidebar-card">
                        <div className="p-sidebar-card-title">Настройки</div>
                        <label className="p-setting-row">
                            <input
                                type="checkbox"
                                checked={confettiOff}
                                onChange={e => {
                                    const v = e.target.checked;
                                    setConfettiOff(v);
                                    localStorage.setItem('confetti_disabled', v ? '1' : '0');
                                }}
                            />
                            <span className="p-setting-label">Отключить эффект конфетти</span>
                        </label>
                        <label className="p-setting-row">
                            <input
                                type="checkbox"
                                checked={achSoundOff}
                                onChange={e => {
                                    const v = e.target.checked;
                                    setAchSoundOff(v);
                                    localStorage.setItem('achievement_sound_disabled', v ? '1' : '0');
                                }}
                            />
                            <span className="p-setting-label">Отключить звук достижений</span>
                        </label>
                    </div>

                </aside>

                {}
                <main className="p-main">
                    {heatmap && (
                        <div style={{ marginBottom: '20px' }}>
                            <ActivityHeatmap days={heatmap} />
                        </div>
                    )}
                    <div className="p-tabs-bar">
                        {TABS.map(t => (
                            <button key={t.key}
                                className={`p-tab ${activeTab === t.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                {t.label}
                                {t.count !== undefined && t.count > 0 && (
                                    <span className="p-tab-badge">{t.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-content">

                        {}
                        {activeTab === 'history' && (
                            <>
                                <div className="p-filters-row">
                                    <div className="p-search-wrap">
                                        <svg className="p-search-icon" viewBox="0 0 16 16" fill="none">
                                            <circle cx="6.5" cy="6.5" r="5" stroke="#3a3a3a" strokeWidth="1.5"/>
                                            <path d="M10.5 10.5L14 14" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                        <input
                                            className="p-search"
                                            placeholder="Поиск по задаче…"
                                            value={histSearch}
                                            onChange={e => setHistFilter(() => setHistSearch(e.target.value))}
                                        />
                                    </div>
                                    <div className="p-select-wrap">
                                        <CustomSelect
                                            value={histStatus}
                                            onChange={v => setHistFilter(() => setHistStatus(v))}
                                            options={[
                                                { value: 'all',     label: 'Все статусы' },
                                                { value: 'success', label: 'Успех' },
                                                { value: 'error',   label: 'Ошибка' },
                                            ]}
                                        />
                                    </div>
                                    <div className="p-select-wrap">
                                        <CustomSelect
                                            value={histLang}
                                            onChange={v => setHistFilter(() => setHistLang(v))}
                                            options={[
                                                { value: 'all', label: 'Все языки' },
                                                ...Object.keys(LANG_COLORS).map(l => ({ value: l, label: l })),
                                            ]}
                                        />
                                    </div>
                                </div>

                                {history.isLoading && history.items.length === 0 ? <TabSpinner /> : history.items.length === 0 ? (
                                    <EmptyState msg="Ничего не найдено" />
                                ) : (
                                    <>
                                        <div className="p-hist-list">
                                            <div className="p-hist-header">
                                                <span>Задача</span><span>Язык</span><span>Статус</span><span>Тесты</span><span>Время</span><span>Дата</span><span/>
                                            </div>
                                            {history.items.map(h => {
                                                const ok       = h.status === 'success';
                                                const expanded = expandedId === h.id;
                                                return (
                                                    <div key={h.id} className="p-hist-item">
                                                        <div className="p-hist-row">
                                                            <span
                                                                className={`p-hist-name ${h.challenge ? 'clickable' : ''}`}
                                                                onClick={() => h.challenge && router.push(`/challenges/${h.challengeId}`)}
                                                            >
                                                                {h.challenge?.name ?? `Задача #${h.challengeId}`}
                                                            </span>
                                                            <span className="p-hist-lang" style={{ color: LANG_COLORS[h.language] ?? '#888' }}>
                                                                {h.language}
                                                            </span>
                                                            <span className="p-hist-status" style={{
                                                                color:      ok ? '#4ade80' : '#f87171',
                                                                background: ok ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                                                            }}>
                                                                {ok ? 'Успех' : 'Ошибка'}
                                                            </span>
                                                            <span className="p-hist-tests" style={{
                                                                color: h.testsPassed != null && h.testsTotal != null
                                                                    ? h.testsPassed === h.testsTotal ? '#4ade80' : '#fbbf24'
                                                                    : '#555'
                                                            }}>
                                                                {h.testsPassed != null && h.testsTotal != null
                                                                    ? `${h.testsPassed}/${h.testsTotal}`
                                                                    : '—'}
                                                            </span>
                                                            <span className="p-hist-time">
                                                                {h.executionTimeMs != null ? `${h.executionTimeMs}ms` : '—'}
                                                            </span>
                                                            <span className="p-hist-date">{fmtDate(h.createdAt)}</span>
                                                            <button
                                                                className={`p-hist-code-btn ${expanded ? 'active' : ''}`}
                                                                onClick={() => setExpandedId(expanded ? null : h.id)}
                                                                title={expanded ? 'Скрыть код' : 'Показать код'}
                                                            >
                                                                <svg viewBox="0 0 16 16" fill="none">
                                                                    <path d="M5 4L2 8L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    <path d="M11 4L14 8L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                                {expanded ? 'Скрыть' : 'Код'}
                                                            </button>
                                                        </div>

                                                        <div className={`p-hist-code-block ${expanded ? 'open' : ''}`}>
                                                            {}
                                                            <div>
                                                                {h.code && (
                                                                    <>
                                                                        <div className="p-hist-code-header">
                                                                            <span className="p-hist-code-lang" style={{ color: LANG_COLORS[h.language] ?? '#888' }}>
                                                                                {h.language}
                                                                            </span>
                                                                            <button
                                                                                className="p-hist-copy-btn"
                                                                                onClick={() => navigator.clipboard.writeText(h.code!)}
                                                                            >
                                                                                Копировать
                                                                            </button>
                                                                        </div>
                                                                        <SyntaxHighlighter
                                                                            language={PRISM_LANG[h.language] ?? 'text'}
                                                                            isDarkTheme={theme !== 'light'}
                                                                            showLineNumbers
                                                                            wrapLongLines={false}
                                                                            customStyle={{
                                                                                margin: 0,
                                                                                padding: '16px',
                                                                                background: theme === 'light' ? '#ddd8ce' : '#0d0d0d',
                                                                                fontSize: '12px',
                                                                                lineHeight: '1.65',
                                                                                maxHeight: '380px',
                                                                                overflowY: 'auto',
                                                                                overflowX: 'auto',
                                                                                borderRadius: 0,
                                                                            }}
                                                                            lineNumberStyle={{
                                                                                color: theme === 'light' ? '#999' : '#2e2e2e',
                                                                                minWidth: '2.5em',
                                                                                paddingRight: '1em',
                                                                                userSelect: 'none',
                                                                            }}
                                                                        >
                                                                            {h.code}
                                                                        </SyntaxHighlighter>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <Pagination page={histPage} totalPages={history.totalPages} onPage={setHistPage} />
                                    </>
                                )}
                            </>
                        )}

                        {}
                        {activeTab === 'testHistory' && (
                            <>
                                <div className="p-filters-row">
                                    <div className="p-search-wrap">
                                        <svg className="p-search-icon" viewBox="0 0 16 16" fill="none">
                                            <circle cx="6.5" cy="6.5" r="5" stroke="#3a3a3a" strokeWidth="1.5"/>
                                            <path d="M10.5 10.5L14 14" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                        <input
                                            className="p-search"
                                            placeholder="Поиск по тесту…"
                                            value={testHistSearch}
                                            onChange={e => setTestHistFilter(() => setTestHistSearch(e.target.value))}
                                        />
                                    </div>
                                    <div className="p-select-wrap">
                                        <CustomSelect
                                            value={testHistStatus}
                                            onChange={v => setTestHistFilter(() => setTestHistStatus(v))}
                                            options={[
                                                { value: 'all',       label: 'Все статусы' },
                                                { value: 'completed', label: 'Завершён' },
                                                { value: 'timed_out', label: 'Время вышло' },
                                                { value: 'active',    label: 'Активный' },
                                            ]}
                                        />
                                    </div>
                                </div>

                                {testHistory.isLoading && testHistory.items.length === 0 ? <TabSpinner /> : testHistory.items.length === 0 ? (
                                    <EmptyState msg="Ничего не найдено" />
                                ) : (
                                    <>
                                        <div className="p-hist-list">
                                            <div className="p-hist-header">
                                                <span>Тест</span><span>Статус</span><span>Счёт</span><span>%</span><span>Дата</span><span/>
                                            </div>
                                            {testHistory.items.map(a => {
                                                const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                                                    completed: { label: 'Завершён',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
                                                    timed_out: { label: 'Время вышло', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
                                                    active:    { label: 'Активный',    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                                                };
                                                const st  = statusMap[a.status] ?? { label: a.status, color: '#888', bg: 'rgba(128,128,128,0.1)' };
                                                const pct = a.maxScore > 0 && a.score != null ? Math.round((a.score / a.maxScore) * 100) : null;
                                                return (
                                                    <div key={a.id} className="p-hist-item">
                                                        <div className="p-hist-row">
                                                            <span
                                                                className={`p-hist-name ${a.test ? 'clickable' : ''}`}
                                                                onClick={() => a.test && router.push(`/tests/${a.testId}/take`)}
                                                            >
                                                                {a.test?.title ?? `Тест #${a.testId}`}
                                                            </span>
                                                            <span className="p-hist-status" style={{ color: st.color, background: st.bg }}>
                                                                {st.label}
                                                            </span>
                                                            <span className="p-hist-tests" style={{ color: a.score != null ? '#4ade80' : '#555' }}>
                                                                {a.score != null ? `${a.score}/${a.maxScore}` : '—'}
                                                            </span>
                                                            <span className="p-hist-time">
                                                                {pct != null ? `${pct}%` : '—'}
                                                            </span>
                                                            <span className="p-hist-date">{fmtDate(a.startedAt)}</span>
                                                            {(a.status === 'completed' || a.status === 'timed_out') ? (
                                                                <button
                                                                    className="p-hist-code-btn"
                                                                    onClick={() => router.push(`/tests/attempts/${a.id}/result`)}
                                                                    title="Результат"
                                                                >
                                                                    <svg viewBox="0 0 16 16" fill="none">
                                                                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                                                    </svg>
                                                                    Итог
                                                                </button>
                                                            ) : <span />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <Pagination page={testHistPage} totalPages={testHistory.totalPages} onPage={setTestHistPage} />
                                    </>
                                )}
                            </>
                        )}

                        {}
                        {activeTab === 'reports' && (
                            <>
                                <div className="p-filters-row">
                                    <div className="p-search-wrap">
                                        <svg className="p-search-icon" viewBox="0 0 16 16" fill="none">
                                            <circle cx="6.5" cy="6.5" r="5" stroke="#3a3a3a" strokeWidth="1.5"/>
                                            <path d="M10.5 10.5L14 14" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                        <input
                                            className="p-search"
                                            placeholder="Поиск по задаче…"
                                            value={repSearch}
                                            onChange={e => setRepFilter(() => setRepSearch(e.target.value))}
                                        />
                                    </div>
                                    <div className="p-select-wrap">
                                        <CustomSelect
                                            value={repStatus}
                                            onChange={v => setRepFilter(() => setRepStatus(v))}
                                            options={[
                                                { value: 'all',      label: 'Все статусы' },
                                                { value: 'Pending',  label: 'Ожидает' },
                                                { value: 'Reviewed', label: 'На рассмотрении' },
                                                { value: 'Resolved', label: 'Решено' },
                                                { value: 'Rejected', label: 'Отклонено' },
                                            ]}
                                        />
                                    </div>
                                </div>

                                {reports.isLoading && reports.items.length === 0 ? <TabSpinner /> : reports.items.length === 0 ? (
                                    <EmptyState msg="Жалобы не найдены" />
                                ) : (
                                    <>
                                        <div className="p-rep-list">
                                            {reports.items.map(r => {
                                                const st = getReportStatus(r.status);
                                                return (
                                                    <div key={r.id} className="p-rep-row">
                                                        <div className={`p-rep-left ${r.challenge ? 'clickable' : ''}`}
                                                            onClick={() => r.challenge && router.push(`/challenges/${r.challengeId}`)}>
                                                            <span className="p-rep-name">
                                                                {r.challenge?.name ?? `Задача #${r.challengeId}`}
                                                            </span>
                                                            {r.reason && <span className="p-rep-reason">{r.reason.name}</span>}
                                                            {r.reasonText && <span className="p-rep-text">«{r.reasonText}»</span>}
                                                        </div>
                                                        <div className="p-rep-right">
                                                            <span className="p-rep-status" style={{ color: st.color, background: st.bg }}>
                                                                {st.label}
                                                            </span>
                                                            <span className="p-rep-date">{fmtDate(r.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <Pagination page={repPage} totalPages={reports.totalPages} onPage={setRepPage} />
                                    </>
                                )}
                            </>
                        )}

                        {}
                        {activeTab === 'analysis' && (
                            <AnalysisTab
                                stats={stats}
                                topics={topics}
                                languages={languages}
                                allTopics={allTopics}
                            />
                        )}

                        {}
                        {activeTab === 'learning' && (
                            learningLoading
                                ? <div className="p-spinner-wrap"><div className="p-spinner" /></div>
                                : learningPlan
                                    ? <LearningTab plan={learningPlan} />
                                    : <div className="p-empty"><div className="p-empty-icon">◎</div><p>Не удалось загрузить план обучения</p></div>
                        )}

                        {activeTab === 'achievements' && <AchievementsTab />}

                    </div>
                </main>
            </div>

        </div>
        </>
    );
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
    if (totalPages <= 1) return null;

    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push('…');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push('…');
        pages.push(totalPages);
    }

    return (
        <div className="p-pagination">
            <button className="p-pag-btn" disabled={page === 1} onClick={() => onPage(page - 1)}><img src="/images/left-arrow.png" alt="←" style={{width:'14px',height:'14px',verticalAlign:'middle'}} /></button>
            {pages.map((p, i) =>
                p === '…'
                    ? <span key={`e${i}`} className="p-pag-ellipsis">…</span>
                    : <button key={p} className={`p-pag-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p as number)}>{p}</button>
            )}
            <button className="p-pag-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}><img src="/images/right-arrow.png" alt="→" style={{width:'14px',height:'14px',verticalAlign:'middle'}} /></button>
        </div>
    );
}

function EmptyState({ msg, action, onClick }: { msg: string; action?: string; onClick?: () => void }) {
    return (
        <div className="p-empty">
            <div className="p-empty-icon">◎</div>
            <p>{msg}</p>
            {action && onClick && <button onClick={onClick}>{action} →</button>}
        </div>
    );
}

function TabSpinner() {
    return <div className="p-spinner-wrap"><div className="p-spinner" /></div>;
}

function LoadingSkeleton() {
    return (
        <div className="p-page">
            <div className="p-layout">
                <div className="p-skeleton-sidebar" />
                <div className="p-skeleton-main">
                    <div className="p-skeleton-tabs" />
                    {[1, 2, 3].map(i => <div key={i} className="p-skeleton-row-item" />)}
                </div>
            </div>
        </div>
    );
}
