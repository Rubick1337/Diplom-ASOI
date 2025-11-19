'use client';

import { useEffect } from 'react';
import './Alert.css';

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose: () => void;
    duration?: number; 
}

export default function Alert({ type, message, onClose, duration = 3000 }: AlertProps) {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`custom-alert custom-alert_${type}`}>
            <span>{message}</span>
            <button className="custom-alert-close" onClick={onClose}>
                ✕
            </button>
        </div>
    );
}
