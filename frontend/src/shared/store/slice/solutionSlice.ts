'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import SolutionService, { VoteSummary, SolutionComment, CommentsPage } from '@/shared/services/SolutionService';

interface SolutionVoteState {
    likes: number;
    dislikes: number;
    myVote: 1 | -1 | null;
    loading: boolean;
}

interface SolutionCommentsState {
    items: SolutionComment[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    submitting: boolean;
}

interface SolutionState {
    votes:    Record<number, SolutionVoteState>;
    comments: Record<number, SolutionCommentsState>;
}

const initialState: SolutionState = {
    votes:    {},
    comments: {},
};

// ─── Votes ────────────────────────────────────────────────────────────────────

export const fetchVotes = createAsyncThunk<
    { solutionId: number } & VoteSummary,
    { solutionId: number; userId?: number }
>('solutions/fetchVotes', async ({ solutionId, userId }) => {
    const data = await SolutionService.getVotes(solutionId, userId);
    return { solutionId, ...data };
});

export const castVote = createAsyncThunk<
    { solutionId: number } & VoteSummary,
    { solutionId: number; userId: number; vote: 1 | -1 }
>('solutions/castVote', async ({ solutionId, userId, vote }) => {
    const data = await SolutionService.vote(solutionId, userId, vote);
    return { solutionId, ...data };
});

// ─── Comments ─────────────────────────────────────────────────────────────────

export const fetchComments = createAsyncThunk<
    { solutionId: number } & CommentsPage,
    { solutionId: number; page?: number; pageSize?: number }
>('solutions/fetchComments', async ({ solutionId, page = 1, pageSize = 20 }) => {
    const data = await SolutionService.getComments(solutionId, page, pageSize);
    return { solutionId, ...data };
});

export const postComment = createAsyncThunk<
    { solutionId: number; comment: SolutionComment },
    { solutionId: number; userId: number; content: string }
>('solutions/postComment', async ({ solutionId, userId, content }) => {
    const comment = await SolutionService.addComment(solutionId, userId, content);
    return { solutionId, comment };
});

export const removeComment = createAsyncThunk<
    { solutionId: number; commentId: number },
    { solutionId: number; commentId: number; userId: number }
>('solutions/removeComment', async ({ solutionId, commentId, userId }) => {
    await SolutionService.deleteComment(solutionId, commentId, userId);
    return { solutionId, commentId };
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const solutionSlice = createSlice({
    name: 'solutions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // votes
        builder
            .addCase(fetchVotes.pending, (state, { meta }) => {
                const id = meta.arg.solutionId;
                state.votes[id] = state.votes[id] ?? { likes: 0, dislikes: 0, myVote: null, loading: true };
                state.votes[id].loading = true;
            })
            .addCase(fetchVotes.fulfilled, (state, { payload }) => {
                const { solutionId, likes, dislikes, myVote } = payload;
                state.votes[solutionId] = { likes, dislikes, myVote, loading: false };
            })
            .addCase(fetchVotes.rejected, (state, { meta }) => {
                const id = meta.arg.solutionId;
                if (state.votes[id]) state.votes[id].loading = false;
            })
            .addCase(castVote.fulfilled, (state, { payload }) => {
                const { solutionId, likes, dislikes, myVote } = payload;
                state.votes[solutionId] = { likes, dislikes, myVote, loading: false };
            });

        // comments
        builder
            .addCase(fetchComments.pending, (state, { meta }) => {
                const id = meta.arg.solutionId;
                state.comments[id] = state.comments[id] ?? { items: [], total: 0, page: 1, pageSize: 20, loading: true, submitting: false };
                state.comments[id].loading = true;
            })
            .addCase(fetchComments.fulfilled, (state, { payload }) => {
                const { solutionId, comments, total, page, pageSize } = payload;
                state.comments[solutionId] = { items: comments, total, page, pageSize, loading: false, submitting: false };
            })
            .addCase(fetchComments.rejected, (state, { meta }) => {
                const id = meta.arg.solutionId;
                if (state.comments[id]) state.comments[id].loading = false;
            })
            .addCase(postComment.pending, (state, { meta }) => {
                const id = meta.arg.solutionId;
                if (state.comments[id]) state.comments[id].submitting = true;
            })
            .addCase(postComment.fulfilled, (state, { payload }) => {
                const { solutionId, comment } = payload;
                if (state.comments[solutionId]) {
                    state.comments[solutionId].items.push(comment);
                    state.comments[solutionId].total += 1;
                    state.comments[solutionId].submitting = false;
                }
            })
            .addCase(postComment.rejected, (state, { meta }) => {
                const id = meta.arg.solutionId;
                if (state.comments[id]) state.comments[id].submitting = false;
            })
            .addCase(removeComment.fulfilled, (state, { payload }) => {
                const { solutionId, commentId } = payload;
                if (state.comments[solutionId]) {
                    state.comments[solutionId].items = state.comments[solutionId].items.filter(c => c.id !== commentId);
                    state.comments[solutionId].total -= 1;
                }
            });
    },
});

export default solutionSlice.reducer;
