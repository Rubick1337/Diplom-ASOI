'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks';
import { RootState } from '@/shared/store/store';
import { fetchVotes, castVote } from '@/shared/store/slice/solutionSlice';
import './SolutionVoteButtons.css';

interface Props {
    solutionId: number;
    userId: number | undefined;
}

export const SolutionVoteButtons: React.FC<Props> = ({ solutionId, userId }) => {
    const dispatch = useAppDispatch();
    const voteState = useAppSelector((s: RootState) => s.solutions.votes[solutionId]);

    useEffect(() => {
        dispatch(fetchVotes({ solutionId, userId }));
    }, [solutionId, userId, dispatch]);

    const handleVote = (vote: 1 | -1) => {
        if (!userId) return;
        dispatch(castVote({ solutionId, userId, vote }));
    };

    const likes    = voteState?.likes    ?? 0;
    const dislikes = voteState?.dislikes ?? 0;
    const myVote   = voteState?.myVote   ?? null;

    return (
        <div className="vote-buttons">
            <button
                className={`vote-btn like-btn ${myVote === 1 ? 'active' : ''}`}
                onClick={() => handleVote(1)}
                disabled={!userId}
                title="Нравится"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
                <span>{likes}</span>
            </button>
            <button
                className={`vote-btn dislike-btn ${myVote === -1 ? 'active' : ''}`}
                onClick={() => handleVote(-1)}
                disabled={!userId}
                title="Не нравится"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                </svg>
                <span>{dislikes}</span>
            </button>
        </div>
    );
};
