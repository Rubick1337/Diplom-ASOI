'use client';

import React from 'react';
import './SkeletonCard.css';

export const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-header">
                <div className="skeleton-title" />
                <div className="skeleton-badge" />
            </div>
            <div className="skeleton-content">
                <div className="skeleton-line full" />
                <div className="skeleton-line partial" />
            </div>
            <div className="skeleton-footer">
                <div className="skeleton-meta" />
                <div className="skeleton-meta" />
                <div className="skeleton-meta" />
            </div>
        </div>
    );
};
