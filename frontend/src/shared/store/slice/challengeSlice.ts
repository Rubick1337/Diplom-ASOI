'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ChallengeService, {
    ExecuteResponse,
    TestResult,
    SystemError,
    ChallengeHistory,
    Review
} from '@/shared/services/ChallengeService';
import { Challenge } from '@/shared/types/challenge';

interface ChallengeState {
    items: Challenge[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    isLoading: boolean;
    error: string | null;

    currentChallenge: Challenge | null;
    isCurrentLoading: boolean;
    currentError: string | null;

    testResults: TestResult[];
    systemError: SystemError | null;
    isExecuting: boolean;
    executionError: string | null;
    executionTimeMs: number | null;
    isTimeLimitExceeded: boolean;

    history: ChallengeHistory[];
    isHistoryLoading: boolean;

    // ОБНОВЛЕННЫЕ ПОЛЯ ДЛЯ РЕШЕНИЙ
    solutions: any[];
    solutionsTotalPages: number;
    solutionsCurrentPage: number;
    isSolutionsLoading: boolean;

    reviews: Review[];
    avgRating: number;
    isReviewsLoading: boolean;

    isFormatting: boolean;
}

const initialState: ChallengeState = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    isLoading: false,
    error: null,

    currentChallenge: null,
    isCurrentLoading: false,
    currentError: null,

    testResults: [],
    systemError: null,
    isExecuting: false,
    executionError: null,
    executionTimeMs: null,
    isTimeLimitExceeded: false,

    history: [],
    isHistoryLoading: false,

    // Инициализация новых полей
    solutions: [],
    solutionsTotalPages: 1,
    solutionsCurrentPage: 1,
    isSolutionsLoading: false,

    reviews: [],
    avgRating: 0,
    isReviewsLoading: false,

    isFormatting: false,
};

export const fetchChallenges = createAsyncThunk<
    { items: Challenge[]; total: number; page: number; pageSize: number; totalPages: number },
    { page?: number; pageSize?: number; search?: string },
    { rejectValue: string }
>('challenges/fetchAll', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.getChallenges(payload);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка загрузки списка задач');
    }
});

export const fetchChallengeById = createAsyncThunk<
    Challenge,
    number,
    { rejectValue: string }
>('challenges/fetchOne', async (id, { rejectWithValue }) => {
    try {
        return await ChallengeService.getChallengeById(id);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка загрузки задачи');
    }
});

export const runChallengeTests = createAsyncThunk<
    ExecuteResponse,
    { id: number; code: string; language: string; userId?: number },
    { rejectValue: string }
>('challenges/execute', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.executeChallenge(payload.id, payload.code, payload.language, payload.userId);
    } catch (error: any) {
        const message = error.response?.data?.message || 'Сервер не смог обработать запрос';
        return rejectWithValue(message);
    }
});

export const fetchChallengeHistory = createAsyncThunk<
    ChallengeHistory[],
    { challengeId: number; userId: number },
    { rejectValue: string }
>('challenges/fetchHistory', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.getHistory(payload.challengeId, payload.userId);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки истории');
    }
});

// ОБНОВЛЕННЫЙ THUNK ДЛЯ ПАГИНАЦИИ РЕШЕНИЙ
export const fetchCommunitySolutions = createAsyncThunk<
    { items: any[]; totalPages: number; currentPage: number },
    { challengeId: number; userId: number; page?: number; pageSize?: number },
    { rejectValue: string }
>('challenges/fetchSolutions', async (payload, { rejectWithValue }) => {
    try {
        console.log(payload.page,payload.pageSize)
        return await ChallengeService.getSolutions(
            payload.challengeId,
            payload.userId,
            payload.page,
            payload.pageSize
        );
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Решения доступны только после успешного прохождения');
    }
});

export const fetchReviews = createAsyncThunk<
    { reviews: Review[]; avgRating: number },
    number,
    { rejectValue: string }
>('challenges/fetchReviews', async (challengeId, { rejectWithValue }) => {
    try {
        return await ChallengeService.getReviews(challengeId);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки отзывов');
    }
});

export const addReview = createAsyncThunk<
    Review,
    { challengeId: number; userId: number; content: string; rating: number },
    { rejectValue: string }
>('challenges/addReview', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.createReview(payload.challengeId, payload.userId, payload.content, payload.rating);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Не удалось оставить отзыв');
    }
});

export const formatChallengeCode = createAsyncThunk<
    string,
    { code: string; language: string },
    { rejectValue: string }
>('challenges/format', async (payload, { rejectWithValue }) => {
    try {
        console.log(payload);
        return await ChallengeService.formatCode(payload.code, payload.language);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка форматирования');
    }
});

const challengeSlice = createSlice({
    name: 'challenges',
    initialState,
    reducers: {
        resetChallenges(state) {
            state.items = [];
            state.total = 0;
            state.page = 1;
            state.error = null;
        },
        clearCurrentChallenge(state) {
            state.currentChallenge = null;
            state.currentError = null;
            state.testResults = [];
            state.systemError = null;
            state.executionError = null;
            state.executionTimeMs = null;
            state.isTimeLimitExceeded = false;
            state.history = [];
            state.solutions = [];
            state.reviews = [];
            state.solutionsCurrentPage = 1;
            state.solutionsTotalPages = 1;
        },
        resetTestResults(state) {
            state.testResults = [];
            state.systemError = null;
            state.executionError = null;
            state.executionTimeMs = null;
            state.isTimeLimitExceeded = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChallenges.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchChallenges.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload.items;
                state.total = action.payload.total;
                state.page = action.payload.page;
                state.pageSize = action.payload.pageSize;
                state.totalPages = action.payload.totalPages;
            })
            .addCase(fetchChallenges.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload ?? 'Error';
            })
            .addCase(fetchChallengeById.pending, (state) => {
                state.isCurrentLoading = true;
                state.currentError = null;
            })
            .addCase(fetchChallengeById.fulfilled, (state, action) => {
                state.isCurrentLoading = false;
                state.currentChallenge = action.payload;
            })
            .addCase(fetchChallengeById.rejected, (state, action) => {
                state.isCurrentLoading = false;
                state.currentError = action.payload ?? 'Error';
            })
            .addCase(runChallengeTests.pending, (state) => {
                state.isExecuting = true;
                state.executionError = null;
                state.systemError = null;
                state.testResults = [];
                state.executionTimeMs = null;
                state.isTimeLimitExceeded = false;
            })
            .addCase(runChallengeTests.fulfilled, (state, action: PayloadAction<ExecuteResponse>) => {
                state.isExecuting = false;
                state.executionTimeMs = action.payload.executionTimeMs ?? null;
                state.isTimeLimitExceeded = !!action.payload.isTimeLimitExceeded;
                state.testResults = action.payload.testResults || [];
                if (!action.payload.success) {
                    state.systemError = action.payload.error || null;
                }
            })
            .addCase(runChallengeTests.rejected, (state, action) => {
                state.isExecuting = false;
                state.executionError = action.payload ?? 'Ошибка запуска';
            })
            .addCase(fetchChallengeHistory.pending, (state) => {
                state.isHistoryLoading = true;
            })
            .addCase(fetchChallengeHistory.fulfilled, (state, action) => {
                state.isHistoryLoading = false;
                state.history = action.payload;
            })
            .addCase(fetchChallengeHistory.rejected, (state) => {
                state.isHistoryLoading = false;
            })
            .addCase(fetchCommunitySolutions.pending, (state) => {
                state.isSolutionsLoading = true;
                state.executionError = null;
            })
            .addCase(fetchCommunitySolutions.fulfilled, (state, action) => {
                state.isSolutionsLoading = false;
                state.solutions = action.payload.items;
                state.solutionsTotalPages = action.payload.totalPages;
                state.solutionsCurrentPage = action.payload.currentPage;
            })
            .addCase(fetchCommunitySolutions.rejected, (state, action) => {
                state.isSolutionsLoading = false;
                state.executionError = action.payload || 'Доступ закрыт';
                state.solutions = [];
            })
            .addCase(fetchReviews.pending, (state) => {
                state.isReviewsLoading = true;
            })
            .addCase(fetchReviews.fulfilled, (state, action) => {
                state.isReviewsLoading = false;
                state.reviews = action.payload.reviews;
                state.avgRating = action.payload.avgRating;
            })
            .addCase(fetchReviews.rejected, (state) => {
                state.isReviewsLoading = false;
            })
            .addCase(addReview.fulfilled, (state, action: PayloadAction<Review>) => {
                const newReview = action.payload;
                const existingIndex = state.reviews.findIndex(
                    r => r.userId === newReview.userId && r.challengeId === newReview.challengeId
                );
                if (existingIndex !== -1) {
                    state.reviews[existingIndex] = newReview;
                } else {
                    state.reviews.unshift(newReview);
                }
                const totalRating = state.reviews.reduce((sum, review) => sum + review.rating, 0);
                state.avgRating = state.reviews.length > 0 ? totalRating / state.reviews.length : 0;
                state.isReviewsLoading = false;
            })
            .addCase(formatChallengeCode.pending, (state) => {
                state.isFormatting = true;
            })
            .addCase(formatChallengeCode.fulfilled, (state) => {
                state.isFormatting = false;
            })
            .addCase(formatChallengeCode.rejected, (state) => {
                state.isFormatting = false;
            });
    },
});

export const { resetChallenges, clearCurrentChallenge, resetTestResults } = challengeSlice.actions;
export default challengeSlice.reducer;