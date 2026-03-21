'use client';

import React from 'react';
import './Pagination.css';

interface ChallengePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function ChallengePagination({
                                                currentPage,
                                                totalPages,
                                                onPageChange,
                                            }: ChallengePaginationProps) {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        const range = 2;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - range && i <= currentPage + range)
            ) {
                pages.push(i);
            } else if (
                i === currentPage - range - 1 ||
                i === currentPage + range + 1
            ) {
                pages.push('...');
            }
        }

        return pages.filter((item, index) => pages.indexOf(item) === index);
    };

    return (
        <div className="challenge-pagination">
            <button
                className="pagination-btn pagination-btn-nav"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                ‹
            </button>

            <div className="pagination-pages">
                {getVisiblePages().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span className="pagination-ellipsis">...</span>
                        ) : (
                            <button
                                className={`pagination-btn pagination-page ${
                                    page === currentPage ? 'pagination-page-active' : ''
                                }`}
                                onClick={() => onPageChange(page as number)}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <button
                className="pagination-btn pagination-btn-nav"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                ›
            </button>
        </div>
    );
}
