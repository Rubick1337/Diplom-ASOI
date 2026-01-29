'use client';

import React from 'react';
import Image from 'next/image';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: () => void;
    type?: 'warning' | 'danger' | 'info' | 'success';
}

export const ConfirmationModal = ({
                                      isOpen,
                                      title,
                                      message,
                                      confirmText = 'Подтвердить',
                                      cancelText = 'Отмена',
                                      onConfirm,
                                      onClose,
                                      type = 'warning'
                                  }: ConfirmationModalProps) => {
    if (!isOpen) return null;

    const getIconPath = () => {
        switch (type) {
            case 'warning':
                return '/images/modal/attention.png';
            case 'success':
                return '/images/modal/great.png';
            default:
                return '/images/modal/attention.png';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-icon-container">
                    <Image
                        src={getIconPath()}
                        alt={type}
                        width={64}
                        height={64}
                        priority
                    />
                </div>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className={`btn-primary ${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};