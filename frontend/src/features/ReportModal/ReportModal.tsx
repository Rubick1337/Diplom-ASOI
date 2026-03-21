'use client';

import React, { useEffect, useRef, useState } from 'react';
import ChallengeService from '@/shared/services/ChallengeService';
import './ReportModal.css';

interface Props {
    challengeId: number;
    userId: number;
    onClose: () => void;
}

export default function ReportModal({ challengeId, userId, onClose }: Props) {
    const [reasons, setReasons] = useState<{ id: number; name: string }[]>([]);
    const [selectedReasonId, setSelectedReasonId] = useState<number | ''>('');
    const [reasonText, setReasonText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [selectOpen, setSelectOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ChallengeService.getReportReasons(challengeId).then(setReasons).catch(() => {});
    }, [challengeId]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
                setSelectOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedReason = reasons.find(r => r.id === selectedReasonId);

    const handleSubmit = async () => {
        if (!selectedReasonId && !reasonText.trim()) {
            setError('Выберите причину или опишите проблему');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            await ChallengeService.createReport(
                challengeId,
                userId,
                selectedReasonId || null,
                reasonText.trim()
            );
            setSubmitted(true);
        } catch {
            setError('Не удалось отправить жалобу. Попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rm-overlay" onClick={onClose}>
            <div className="rm-modal" onClick={e => e.stopPropagation()}>

                {}
                <div className="rm-header">
                    <div className="rm-header-left">
                        <span className="rm-icon">⚑</span>
                        <div>
                            <h2 className="rm-title">Жалоба на задачу</h2>
                            <p className="rm-subtitle">Помогите нам улучшить качество задач</p>
                        </div>
                    </div>
                    <button className="rm-close" onClick={onClose} aria-label="Закрыть">✕</button>
                </div>

                <div className="rm-divider" />

                {submitted ? (

                    <div className="rm-success">
                        <div className="rm-success-circle">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M5 13l4 4L19 7" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h3 className="rm-success-title">Жалоба отправлена</h3>
                        <p className="rm-success-text">Мы рассмотрим её в ближайшее время и примем необходимые меры.</p>
                        <button className="rm-btn-primary" onClick={onClose}>Закрыть</button>
                    </div>
                ) : (

                    <div className="rm-body">
                        <div className="rm-field">
                            <label className="rm-label">Причина жалобы</label>
                            <div className="rm-select-wrapper" ref={selectRef}>
                                <button
                                    className={`rm-select-trigger ${selectOpen ? 'open' : ''}`}
                                    onClick={() => setSelectOpen(prev => !prev)}
                                    type="button"
                                >
                                    <span className={selectedReason ? 'rm-select-value' : 'rm-select-placeholder'}>
                                        {selectedReason ? selectedReason.name : 'Выберите причину...'}
                                    </span>
                                    <svg
                                        className={`rm-chevron ${selectOpen ? 'rotated' : ''}`}
                                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    >
                                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>

                                {selectOpen && (
                                    <div className="rm-dropdown">
                                        <div
                                            className={`rm-option rm-option-none ${selectedReasonId === '' ? 'selected' : ''}`}
                                            onClick={() => { setSelectedReasonId(''); setSelectOpen(false); }}
                                        >
                                            Не выбрано
                                        </div>
                                        {reasons.map(r => (
                                            <div
                                                key={r.id}
                                                className={`rm-option ${selectedReasonId === r.id ? 'selected' : ''}`}
                                                onClick={() => { setSelectedReasonId(r.id); setSelectOpen(false); }}
                                            >
                                                {selectedReasonId === r.id && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="rm-option-check">
                                                        <path d="M5 13l4 4L19 7" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                )}
                                                {r.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rm-field">
                            <label className="rm-label">
                                Описание
                                <span className="rm-label-optional"> — необязательно</span>
                            </label>
                            <textarea
                                className="rm-textarea"
                                placeholder="Опишите проблему подробнее..."
                                value={reasonText}
                                onChange={e => setReasonText(e.target.value)}
                                maxLength={500}
                                rows={4}
                            />
                            <span className="rm-char-count">{reasonText.length} / 500</span>
                        </div>

                        {error && (
                            <div className="rm-error">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#ff5555" strokeWidth="2"/>
                                    <path d="M12 8v4M12 16h.01" stroke="#ff5555" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="rm-footer">
                            <button className="rm-btn-ghost" onClick={onClose} disabled={isSubmitting}>
                                Отмена
                            </button>
                            <button
                                className="rm-btn-primary"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="rm-spinner" />
                                ) : (
                                    'Отправить жалобу'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
