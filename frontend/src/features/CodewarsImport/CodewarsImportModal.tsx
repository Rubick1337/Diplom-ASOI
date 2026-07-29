'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ExternalLink, Download, AlertTriangle, Loader2, BookOpen, History, ArrowRight } from 'lucide-react';
import AdminApiService, { CodewarsKata } from '@/shared/services/AdminApiService';
import './CodewarsImportModal.css';

const HISTORY_KEY = 'cw_import_history';
const MAX_HISTORY = 8;
function loadHistory(): CodewarsKata[] {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(kata: CodewarsKata) {
    const prev = loadHistory().filter(k => k.id !== kata.id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([kata, ...prev].slice(0, MAX_HISTORY)));
}

const RANK_COLORS: Record<string, string> = {
    white: '#9b9b9b', yellow: '#ecb613', blue: '#3c7ebb', purple: '#866cc7', red: '#c33c3c',
};

function RankBadge({ rank }: { rank: CodewarsKata['rank'] }) {
    if (!rank) return null;
    const color = RANK_COLORS[rank.color] ?? '#9b9b9b';
    return <span className="cw-rank-badge" style={{ borderColor: color, color }}>{rank.name}</span>;
}

function DiffDots({ value }: { value: number }) {
    const level = value <= 3 ? 'easy' : value <= 7 ? 'med' : 'hard';
    return (
        <span className="cw-diff-dots" title={`Сложность ${value}/10`}>
            {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className="cw-diff-dot" data-active={String(i < value)} data-level={level} />
            ))}
        </span>
    );
}

function KataCard({ kata, onImport }: { kata: CodewarsKata; onImport: (k: CodewarsKata) => void }) {
    return (
        <div className="cw-kata-card">
            <div className="cw-kata-card-top">
                <div className="cw-kata-card-name">{kata.name}</div>
                <div className="cw-kata-card-badges">
                    <RankBadge rank={kata.rank} />
                    <DiffDots value={kata.difficulty} />
                </div>
            </div>
            {kata.tags.length > 0 && (
                <div className="cw-kata-card-tags">
                    {kata.tags.slice(0, 5).map(t => <span key={t} className="cw-tag">{t}</span>)}
                </div>
            )}
            <div className="cw-kata-card-langs">
                {kata.languages.slice(0, 6).join(' · ')}
                {kata.languages.length > 6 && ` +${kata.languages.length - 6}`}
            </div>
            {kata.funcName && (
                <div className="cw-kata-card-func">
                    <span className="cw-kata-card-func-label">функция</span>
                    <code className="cw-kata-card-func-name">{kata.funcName}(…)</code>
                </div>
            )}
            {(kata.sampleInput || kata.sampleOutput) && (
                <div className="cw-kata-card-samples">
                    {kata.sampleInput  && <span className="cw-sample"><span className="cw-sample-label">вход:</span>  <code>{kata.sampleInput}</code></span>}
                    {kata.sampleOutput && <span className="cw-sample"><span className="cw-sample-label">выход:</span> <code>{kata.sampleOutput}</code></span>}
                </div>
            )}
            {!!kata.totalCompleted && (
                <div className="cw-kata-card-solved">{kata.totalCompleted.toLocaleString()} решений</div>
            )}
            <div className="cw-kata-card-actions">
                <a href={kata.url} target="_blank" rel="noreferrer" className="cw-btn-link">
                    <ExternalLink size={13} /> Открыть на Codewars
                </a>
                <button className="cw-btn-import" onClick={() => onImport(kata)}>
                    <Download size={13} /> Импортировать
                </button>
            </div>
        </div>
    );
}

export interface CodewarsImportData {
    name: string; description: string; difficulty: number;
    tags: string[]; sourceUrl: string;
    funcName: string; sampleInput: string; sampleOutput: string;
}

interface Props { onImport: (data: CodewarsImportData) => void; onClose: () => void; }

export default function CodewarsImportModal({ onImport, onClose }: Props) {
    const [input,   setInput]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [result,  setResult]  = useState<CodewarsKata | null>(null);
    const [history, setHistory] = useState<CodewarsKata[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setHistory(loadHistory());
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    function parseSlug(raw: string): string {
        raw = raw.trim();
        const m = raw.match(/\/kata\/([^/\s?#]+)/);
        return m ? m[1] : raw;
    }

    const handleLookup = async () => {
        const slug = parseSlug(input);
        if (!slug) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const kata = await AdminApiService.codewarsGetKata(slug);
            setResult(kata);
            saveHistory(kata);
            setHistory(loadHistory());
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || '';
            setError(msg.includes('404') || msg.includes('Not Found')
                ? 'Kata не найдена. Проверьте slug или URL.'
                : msg || 'Ошибка');
        } finally { setLoading(false); }
    };

    const handleImportKata = (kata: CodewarsKata) => {
        onImport({
            name: kata.name, description: kata.description, difficulty: kata.difficulty,
            tags: kata.tags, sourceUrl: kata.url,
            funcName: kata.funcName, sampleInput: kata.sampleInput, sampleOutput: kata.sampleOutput,
        });
        onClose();
    };

    return (
        <div className="cw-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="cw-modal">
                <div className="cw-header">
                    <div className="cw-header-left">
                        <BookOpen size={17} className="cw-header-icon" />
                        <span className="cw-header-title">Импорт из Codewars</span>
                    </div>
                    <button className="cw-close" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="cw-body">
                    <p className="cw-hint">
                        Вставьте <strong>slug</strong> (напр. <code>two-sum</code>) или полную ссылку на kata.
                        Название, описание и сложность заполнятся автоматически — тест-кейсы и решение добавите сами.
                    </p>

                    <div className="cw-input-row">
                        <div className="cw-input-wrap">
                            <Search size={15} className="cw-input-icon" />
                            <input
                                ref={inputRef}
                                className="cw-input"
                                placeholder="two-sum  или  https://www.codewars.com/kata/two-sum"
                                value={input}
                                onChange={e => { setInput(e.target.value); setError(''); setResult(null); }}
                                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                            />
                            {input && (
                                <button className="cw-input-clear" onClick={() => { setInput(''); setResult(null); setError(''); }}>
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                        <button className="cw-lookup-btn" onClick={handleLookup} disabled={!input.trim() || loading}>
                            {loading ? <Loader2 size={14} className="cw-spin" /> : <ArrowRight size={14} />}
                            Найти
                        </button>
                    </div>

                    <div className="cw-browse-hint">
                        Нет slug?{' '}
                        <a href="https://www.codewars.com/kata/search" target="_blank" rel="noreferrer" className="cw-browse-link">
                            Найдите kata на Codewars <ExternalLink size={11} />
                        </a>
                        {' '}— скопируйте slug из URL и вставьте сюда.
                    </div>

                    {error && (
                        <div className="cw-error"><AlertTriangle size={14} /> {error}</div>
                    )}

                    {result && (
                        <div className="cw-section">
                            <div className="cw-section-label">Результат</div>
                            <KataCard kata={result} onImport={handleImportKata} />
                        </div>
                    )}

                    {!result && history.length > 0 && (
                        <div className="cw-section">
                            <div className="cw-section-label"><History size={12} /> Недавние</div>
                            <div className="cw-history-list">
                                {history.map(kata => (
                                    <div key={kata.id} className="cw-history-row">
                                        <button className="cw-history-name" onClick={() => { setInput(kata.slug); setResult(kata); }}>
                                            {kata.name}
                                        </button>
                                        <RankBadge rank={kata.rank} />
                                        <div className="cw-history-actions">
                                            <a href={kata.url} target="_blank" rel="noreferrer" className="cw-btn-link-sm">
                                                <ExternalLink size={12} />
                                            </a>
                                            <button className="cw-btn-import-sm" onClick={() => handleImportKata(kata)}>
                                                <Download size={12} /> Импорт
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
