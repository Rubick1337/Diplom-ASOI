import React from 'react';
import './Pagination.css';

interface ChallengePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const ChallengePagination: React.FC<ChallengePaginationProps> = ({
                                                                     currentPage,
                                                                     totalPages,
                                                                     onPageChange,
                                                                 }) => {
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    for (let p = 1; p <= totalPages; p++) {
        pages.push(p);
    }

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <div className="challenge-pagination">
            <button
                className="pagination-btn pagination-btn-nav"
                onClick={handlePrev}
                disabled={currentPage === 1}
            >
                ‹
            </button>

            <div className="pagination-pages">
                {pages.map((pageNum) => (
                    <button
                        key={pageNum}
                        className={
                            'pagination-btn pagination-page' +
                            (pageNum === currentPage ? ' pagination-page-active' : '')
                        }
                        onClick={() => onPageChange(pageNum)}
                    >
                        {pageNum}
                    </button>
                ))}
            </div>

            <button
                className="pagination-btn pagination-btn-nav"
                onClick={handleNext}
                disabled={currentPage === totalPages}
            >
                ›
            </button>
        </div>
    );
};

export default ChallengePagination;
