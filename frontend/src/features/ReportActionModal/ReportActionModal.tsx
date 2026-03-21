'use client';

import React, { useEffect, useState } from 'react';
import './ReportActionModal.css';
import { useAppDispatch } from '@/shared/store/hooks';
import { adminUpdateReportStatus } from '@/shared/store/slice/adminManageSlice';

interface Props {
    reportId: number;
    challengeId: number | null;
    reportReason: string;
    reportReasonText: string | null;
    reportStatus: string;
    reporterName: string;
    challengeName: string;
    resolvedBy?: string | null;
    resolvedAt?: string | null;
    onClose: () => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    Pending:   { label: 'Ожидает',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
    Resolved:  { label: 'Решена',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
    Dismissed: { label: 'Отклонена', color: '#8b949e', bg: 'rgba(139,148,158,0.12)' },
};

export default function ReportActionModal({
    reportId, challengeId, reportReason, reportReasonText,
    reportStatus, reporterName, challengeName,
    resolvedBy, resolvedAt, onClose,
}: Props) {
    const dispatch = useAppDispatch();
    const isPending = reportStatus === 'Pending';
    const meta = STATUS_META[reportStatus] ?? STATUS_META.Pending;
    const [adminMessage, setAdminMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const handleStatus = async (status: 'Resolved' | 'Dismissed') => {
        setLoading(true);
        await dispatch(adminUpdateReportStatus({ id: reportId, status, adminMessage: adminMessage.trim() || undefined }));
        setLoading(false);
        onClose();
    };

    const fmtDate = (d: string) => {
        const normalized = d.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(d) ? d : d + 'Z';
        return new Date(normalized).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="ram-overlay" onClick={onClose}>
            <div className="ram-modal" onClick={e => e.stopPropagation()}>

                {}
                <div className="ram-header">
                    <div className="ram-header-left">
                        <div className="ram-header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="4" y1="22" x2="4" y2="15" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="ram-title">Жалоба #{reportId}</h2>
                            <p className="ram-subtitle">Рассмотрение и принятие решения</p>
                        </div>
                    </div>
                    <button className="ram-close" onClick={onClose}>✕</button>
                </div>

                <div className="ram-divider" />

                <div className="ram-body">
                    {}
                    <div className="ram-info-card">
                        <div className="ram-info-row">
                            <span className="ram-info-key">Задача</span>
                            <div className="ram-info-val-wrap">
                                <span className="ram-info-val ram-info-val--strong">{challengeName}</span>
                                {challengeId && (
                                    <a className="ram-open-link" href={`/challenge/edit/${challengeId}`} target="_blank" rel="noopener noreferrer">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        Открыть
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="ram-info-row">
                            <span className="ram-info-key">Репортер</span>
                            <span className="ram-info-val">{reporterName}</span>
                        </div>
                        <div className="ram-info-row">
                            <span className="ram-info-key">Причина</span>
                            <span className="ram-info-val">{reportReason}</span>
                        </div>
                        <div className="ram-info-row">
                            <span className="ram-info-key">Статус</span>
                            <span className="ram-status-pill" style={{ color: meta.color, background: meta.bg }}>
                                {meta.label}
                            </span>
                        </div>
                    </div>

                    {}
                    {reportReasonText && (
                        <div className="ram-field">
                            <label className="ram-field-label">Комментарий к жалобе</label>
                            <div className="ram-comment-box">{reportReasonText}</div>
                        </div>
                    )}

                    {}
                    {isPending && (
                        <div className="ram-field">
                            <label className="ram-field-label">Ответ пользователю</label>
                            <textarea
                                className="ram-feedback-textarea"
                                placeholder="Напишите пояснение для пользователя — оно придёт ему в уведомлении (необязательно)"
                                value={adminMessage}
                                onChange={e => setAdminMessage(e.target.value)}
                                rows={3}
                                maxLength={500}
                            />
                            {adminMessage.length > 0 && (
                                <span className="ram-char-count">{adminMessage.length}/500</span>
                            )}
                        </div>
                    )}

                    {}
                    {!isPending && (resolvedBy || resolvedAt) && (
                        <div className="ram-reviewed">
                            <div className="ram-reviewed__header">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Рассмотрено
                            </div>
                            <div className="ram-reviewed__body">
                                {resolvedBy && (
                                    <div className="ram-info-row">
                                        <span className="ram-info-key">Администратор</span>
                                        <span className="ram-admin-tag">{resolvedBy}</span>
                                    </div>
                                )}
                                {resolvedAt && (
                                    <div className="ram-info-row">
                                        <span className="ram-info-key">Дата решения</span>
                                        <span className="ram-info-val">{fmtDate(resolvedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="ram-divider" />

                {}
                <div className="ram-footer">
                    {isPending ? (
                        <>
                            <button
                                className="ram-action-btn ram-action-btn--dismiss"
                                onClick={() => handleStatus('Dismissed')}
                                disabled={loading}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                Отклонить
                            </button>
                            <button
                                className="ram-action-btn ram-action-btn--resolve"
                                onClick={() => handleStatus('Resolved')}
                                disabled={loading}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Принять жалобу
                            </button>
                        </>
                    ) : (
                        <button className="ram-action-btn ram-action-btn--close" onClick={onClose}>
                            Закрыть
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
