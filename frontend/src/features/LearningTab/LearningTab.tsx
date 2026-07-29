'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LearningPlan, TopicGuide, LearningTest } from '@/shared/services/ProfileService';
import ProfileService from '@/shared/services/ProfileService';
import './LearningTab.css';

const MAX_SCORE = 200;

const DIFF: Record<number, { label: string; color: string }> = {
    1: { label: 'Easy',   color: '#4ade80' },
    2: { label: 'Medium', color: '#fbbf24' },
    3: { label: 'Hard',   color: '#f87171' },
};
function diffInfo(d: number) {
    return DIFF[d] ?? DIFF[Math.min(3, Math.max(1, Math.ceil(d / 3.33)))] ?? { label: `Lv${d}`, color: '#888' };
}

const REC_CONFIG: Record<string, { tag: string; label: string; color: string; dim: string }> = {
    improve:  { tag: 'WARN',   label: 'Нужна практика', color: '#f87171', dim: '#7a2020' },
    continue: { tag: 'INFO',   label: 'Продолжай',       color: '#4ade80', dim: '#1a4a2a' },
    start:    { tag: 'NEW',    label: 'Новая тема',       color: '#FF6B35', dim: '#3a1a0a' },
    review:   { tag: 'REVIEW', label: 'Повторение',       color: '#a78bfa', dim: '#2e1a5a' },
};

export default function LearningTab({ plan }: { plan: LearningPlan }) {
    const router = useRouter();
    const [expandedTopic,   setExpandedTopic]   = useState<number | null>(null);
    const [expandedFactors, setExpandedFactors] = useState<number | null>(null);

    const [aiGuides,      setAiGuides]      = useState<Record<number, TopicGuide>>({});
    const [guideLoading,  setGuideLoading]  = useState<Record<number, boolean>>({});
    const [guideError,    setGuideError]    = useState<Record<number, string>>({});
    const [preferences,   setPreferences]   = useState<Record<number, string>>({});
    const [showPrefInput, setShowPrefInput] = useState<Record<number, boolean>>({});

    const handleGenerateGuide = async (topicId: number, topicName: string, forceRegenerate = false) => {
        setGuideLoading(p => ({ ...p, [topicId]: true }));
        setGuideError(p => ({ ...p, [topicId]: '' }));
        try {
            const guide = await ProfileService.generateTopicGuide(topicName, preferences[topicId], forceRegenerate);
            setAiGuides(p => ({ ...p, [topicId]: guide }));
            setShowPrefInput(p => ({ ...p, [topicId]: false }));
        } catch {
            setGuideError(p => ({ ...p, [topicId]: 'AI недоступен. Попробуйте позже.' }));
        } finally {
            setGuideLoading(p => ({ ...p, [topicId]: false }));
        }
    };

    const { topicProgress, recommendations, overallProgress } = plan;

    const total       = overallProgress.total;
    const masteredPct = total > 0 ? Math.round((overallProgress.mastered   / total) * 100) : 0;
    const progressPct = total > 0 ? Math.round((overallProgress.inProgress / total) * 100) : 0;

    const topicMap = new Map(topicProgress.map(t => [t.id, t]));

    const sortedTopics = [...topicProgress].sort((a, b) => {
        const order = { in_progress: 0, not_started: 1, mastered: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        if (a.status === 'in_progress') return a.rate - b.rate;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="lt-root">

            {}
            <div className="lt-overview">
                <div className="lt-overview-title">Общий прогресс по темам</div>
                <div className="lt-progress-bar-wrap">
                    <div className="lt-progress-bar">
                        {overallProgress.mastered > 0 && (
                            <div className="lt-bar-seg" style={{ width: `${masteredPct}%`, background: '#4ade80' }}
                                title={`Освоено: ${overallProgress.mastered}`} />
                        )}
                        {overallProgress.inProgress > 0 && (
                            <div className="lt-bar-seg" style={{ width: `${progressPct}%`, background: '#fbbf24' }}
                                title={`В процессе: ${overallProgress.inProgress}`} />
                        )}
                    </div>
                </div>
                <div className="lt-overview-stats">
                    {[
                        { dot: '#4ade80', num: overallProgress.mastered,   lbl: 'освоено'    },
                        { dot: '#fbbf24', num: overallProgress.inProgress, lbl: 'в процессе' },
                        { dot: '#555',    num: overallProgress.notStarted, lbl: 'не начато'  },
                        { dot: '#FF6B35', num: total,                      lbl: 'всего тем'  },
                    ].map(({ dot, num, lbl }) => (
                        <div key={lbl} className="lt-ov-stat">
                            <span className="lt-ov-dot" style={{ background: dot }} />
                            <span className="lt-ov-num" style={{ color: dot }}>{num}</span>
                            <span className="lt-ov-lbl">{lbl}</span>
                        </div>
                    ))}
                </div>
            </div>

            {}
            {recommendations.length > 0 && (
                <div className="lt-section">
                    <div className="lt-section-title">Рекомендации — что делать сейчас</div>
                    <div className="lt-rec-list">
                        {recommendations.map((rec, i) => {
                            const cfg   = REC_CONFIG[rec.type];
                            const priorityLabel = i === 0 ? 'Начни отсюда' : i === 1 ? 'Следующее' : `Приоритет ${i + 1}`;
                            return (
                                <div key={i} className="lt-term-card" style={{ '--term-color': cfg.color, '--term-dim': cfg.dim } as React.CSSProperties}>

                                    {}
                                    <div className="lt-term-bar">
                                        <div className="lt-term-dots">
                                            <span className="lt-dot lt-dot-red" />
                                            <span className="lt-dot lt-dot-yellow" />
                                            <span className="lt-dot lt-dot-green" />
                                        </div>
                                        <span className="lt-term-title">
                                            user@learning:~/{rec.topicName.toLowerCase().replace(/\s+/g, '-')}
                                        </span>
                                        <span className="lt-priority-badge" style={{
                                            color:       i === 0 ? cfg.color : '#555',
                                            borderColor: i === 0 ? cfg.color : '#2a2a2a',
                                            background:  i === 0 ? `color-mix(in srgb, ${cfg.color} 10%, transparent)` : 'transparent',
                                        }}>
                                            #{i + 1} {priorityLabel}
                                        </span>
                                        <span className="lt-term-tag" style={{ color: cfg.color, borderColor: cfg.color }}>
                                            {cfg.tag}
                                        </span>
                                    </div>

                                    {}
                                    <div className="lt-term-body">

                                        {}
                                        <div className="lt-term-line">
                                            <span className="lt-prompt" style={{ color: cfg.color }}>$</span>
                                            <span className="lt-cmd-ru" style={{ color: cfg.color }}>{cfg.label}</span>
                                            <span className="lt-cmd-topic">— {rec.topicName}</span>
                                        </div>
                                        <div className="lt-term-output">
                                            <span className="lt-out-text">{rec.reason}</span>
                                        </div>

                                        {}
                                        {rec.challenges.length > 0 && (
                                            <>
                                                <div className="lt-term-line lt-term-line--mt">
                                                    <span className="lt-prompt" style={{ color: '#555' }}>$</span>
                                                    <span className="lt-cmd-section">Попробуй решить:</span>
                                                </div>
                                                {rec.challenges.map((ch, ci) => {
                                                    const d = diffInfo(ch.difficulty);
                                                    return (
                                                        <button key={ch.id} className="lt-term-challenge"
                                                            onClick={() => router.push(`/challenges/${ch.id}`)}>
                                                            <span className="lt-term-idx" style={{ color: cfg.color }}>{ci + 1}.</span>
                                                            <span className="lt-term-ch-name">{ch.name}</span>
                                                            <span className="lt-term-ch-diff" style={{ color: d.color }}>{d.label}</span>
                                                            <span className="lt-term-arrow">→</span>
                                                        </button>
                                                    );
                                                })}
                                            </>
                                        )}

                                        {}
                                        {rec.tests?.length > 0 && (
                                            <>
                                                <div className="lt-term-line lt-term-line--mt">
                                                    <span className="lt-prompt" style={{ color: '#555' }}>$</span>
                                                    <span className="lt-cmd-section">Пройди тест по теме:</span>
                                                </div>
                                                {rec.tests.map((t: LearningTest, ti: number) => (
                                                    <button key={t.id} className="lt-term-challenge"
                                                        onClick={() => router.push(`/tests/${t.id}/take`)}>
                                                        <span className="lt-term-idx" style={{ color: cfg.color }}>{ti + 1}.</span>
                                                        <span className="lt-term-ch-name">{t.title}</span>
                                                        <span className="lt-term-ch-diff" style={{ color: '#38bdf8' }}>Тест</span>
                                                        <span className="lt-term-arrow">→</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}

                                        {}
                                        {rec.factors?.length > 0 && (
                                            <div className="lt-why-wrap">
                                                <button
                                                    className="lt-why-btn"
                                                    onClick={() => setExpandedFactors(expandedFactors === i ? null : i)}
                                                >
                                                    <span style={{ color: '#555' }}>$</span>
                                                    <span className="lt-why-label">
                                                        Почему эта тема?
                                                        <span className="lt-why-arrow">{expandedFactors === i ? '▲' : '▼'}</span>
                                                    </span>
                                                </button>
                                                <div className={`lt-factors-body ${expandedFactors === i ? 'open' : ''}`}>
                                                    <div className="lt-factors-inner">
                                                        {rec.factors.map((f, fi) => (
                                                            <div key={fi} className="lt-factor">
                                                                <span className="lt-factor-icon" style={{ color: f.positive ? '#4ade80' : '#f87171' }}>
                                                                    {f.positive ? '✓' : '✗'}
                                                                </span>
                                                                <span className="lt-factor-text">{f.text}</span>
                                                            </div>
                                                        ))}
                                                        <div className="lt-score-row">
                                                            <span className="lt-score-label">Итоговый балл:</span>
                                                            <div className="lt-score-bar-wrap">
                                                                <div className="lt-score-bar-bg">
                                                                    <div
                                                                        className="lt-score-bar-fill"
                                                                        style={{
                                                                            width: `${Math.min(100, Math.round((rec.score / MAX_SCORE) * 100))}%`,
                                                                            background: cfg.color,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <span className="lt-score-val" style={{ color: cfg.color }}>{rec.score}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {}
            <div className="lt-section">
                <div className="lt-section-title">Все темы</div>
                <div className="lt-topics-list">
                    {sortedTopics.map(topic => {
                        const expanded = expandedTopic === topic.id;

                        const statusColor =
                            topic.status === 'mastered'    ? '#4ade80' :
                            topic.status === 'in_progress' ? (topic.rate < 50 ? '#f87171' : '#fbbf24') :
                            '#555';
                        const statusLabel =
                            topic.status === 'mastered'    ? 'Освоено' :
                            topic.status === 'in_progress' ? 'В процессе' :
                            'Не начато';

                        return (
                            <div key={topic.id} className="lt-topic-item">
                                <button
                                    className={`lt-topic-header ${expanded ? 'expanded' : ''}`}
                                    onClick={() => setExpandedTopic(expanded ? null : topic.id)}
                                >
                                    <div className="lt-topic-left">
                                        <span className="lt-topic-dot" style={{ background: statusColor }} />
                                        <span className="lt-topic-name">{topic.name}</span>
                                    </div>
                                    <div className="lt-topic-meta">
                                        <div className="lt-topic-bar-wrap">
                                            <div className="lt-topic-bar-bg">
                                                <div className="lt-topic-bar-fill"
                                                    style={{ width: `${topic.masteryRate}%`, background: statusColor }} />
                                            </div>
                                            <span className="lt-topic-pct" style={{ color: statusColor }}>
                                                {topic.masteryRate}%
                                            </span>
                                        </div>
                                        <span className="lt-topic-frac">{topic.solved}/{topic.total}</span>
                                        <span className="lt-topic-status"
                                            style={{ color: statusColor, borderColor: `${statusColor}40` }}>
                                            {statusLabel}
                                        </span>
                                        <span className={`lt-topic-chevron ${expanded ? 'open' : ''}`}>›</span>
                                    </div>
                                </button>

                                <div className={`lt-topic-body ${expanded ? 'open' : ''}`}>
                                    <div className="lt-topic-body-inner">

                                        {topic.nextChallenges.length > 0 ? (
                                            <div className="lt-topic-section">
                                                <div className="lt-sub-lbl">Следующие задачи:</div>
                                                <div className="lt-topic-challenges">
                                                    {topic.nextChallenges.map(ch => {
                                                        const d = diffInfo(ch.difficulty);
                                                        return (
                                                            <button key={ch.id} className="lt-challenge-pill"
                                                                onClick={() => router.push(`/challenges/${ch.id}`)}>
                                                                <span className="lt-pill-dot" style={{ background: d.color }} />
                                                                <span className="lt-pill-name">{ch.name}</span>
                                                                <span className="lt-pill-diff" style={{ color: d.color }}>{d.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : topic.status === 'mastered' ? (
                                            <div className="lt-mastered-msg">
                                                Все задачи решены — отличная работа! Попробуй Hard-уровень.
                                            </div>
                                        ) : null}

                                        {}
                                        {(() => {
                                            const aiGuide = aiGuides[topic.id];
                                            const loading = guideLoading[topic.id];
                                            const error   = guideError[topic.id];
                                            const showPref = showPrefInput[topic.id];

                                            if (aiGuide) return (
                                                <div className="lt-topic-section">
                                                    <div className="lt-ai-guide-header">
                                                        <div className="lt-sub-lbl">Гайд от AI:</div>
                                                        <button
                                                            className="lt-regen-btn"
                                                            onClick={() => setShowPrefInput(p => ({ ...p, [topic.id]: !p[topic.id] }))}
                                                        >
                                                            ↺ Обновить
                                                        </button>
                                                    </div>
                                                    {showPref && (
                                                        <div className="lt-pref-row">
                                                            <input
                                                                className="lt-pref-input"
                                                                placeholder="Пожелания (необязательно): для собеседования, с примерами на Python..."
                                                                value={preferences[topic.id] || ''}
                                                                onChange={e => setPreferences(p => ({ ...p, [topic.id]: e.target.value }))}
                                                                onKeyDown={e => e.key === 'Enter' && handleGenerateGuide(topic.id, topic.name, true)}
                                                            />
                                                            <button className="lt-pref-go" onClick={() => handleGenerateGuide(topic.id, topic.name, true)}>
                                                                Сгенерировать
                                                            </button>
                                                        </div>
                                                    )}
                                                    <ol className="lt-guide-path">
                                                        {aiGuide.path.map((step, i) => (
                                                            <li key={i} className="lt-guide-step">{step}</li>
                                                        ))}
                                                    </ol>
                                                    <div className="lt-sub-lbl" style={{ marginTop: '10px' }}>Что ещё полезно знать:</div>
                                                    <div className="lt-concepts">
                                                        {aiGuide.concepts.map(c => (
                                                            <span key={c} className="lt-concept-tag">{c}</span>
                                                        ))}
                                                    </div>
                                                    {aiGuide.related.length > 0 && (
                                                        <div className="lt-related" style={{ marginTop: '8px' }}>
                                                            Смежные темы: {aiGuide.related.join(' · ')}
                                                        </div>
                                                    )}
                                                </div>
                                            );

                                            if (loading) return (
                                                <div className="lt-guide-loading">
                                                    <span className="lt-guide-spinner" />
                                                    <span>AI генерирует гайд...</span>
                                                </div>
                                            );

                                            return (
                                                <div className="lt-guide-gen-wrap">
                                                    {error && <div className="lt-guide-error">{error}</div>}
                                                    {showPref ? (
                                                        <div className="lt-pref-row">
                                                            <input
                                                                className="lt-pref-input"
                                                                placeholder="Пожелания (необязательно): для собеседования, с примерами на Python..."
                                                                value={preferences[topic.id] || ''}
                                                                onChange={e => setPreferences(p => ({ ...p, [topic.id]: e.target.value }))}
                                                                onKeyDown={e => e.key === 'Enter' && handleGenerateGuide(topic.id, topic.name)}
                                                                autoFocus
                                                            />
                                                            <button className="lt-pref-go" onClick={() => handleGenerateGuide(topic.id, topic.name)}>
                                                                Сгенерировать
                                                            </button>
                                                            <button className="lt-pref-cancel" onClick={() => setShowPrefInput(p => ({ ...p, [topic.id]: false }))}>
                                                                Отмена
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="lt-guide-actions">
                                                            <button className="lt-gen-btn" onClick={() => handleGenerateGuide(topic.id, topic.name)}>
                                                                <span className="lt-ai-avatar">AI</span>
                                                                Сгенерировать гайд
                                                            </button>
                                                            <button className="lt-gen-btn-pref" onClick={() => setShowPrefInput(p => ({ ...p, [topic.id]: true }))}>
                                                                С пожеланиями
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
