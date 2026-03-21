'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ChallengeService, {
    ExecuteResponse,
    TestResult,
    SystemError,
    ChallengeHistory,
    Review,
    GetReviewsParams,
    GetSolutionsParams,
    GetChallengesParams, Topic,
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
    solutions: any[];
    solutionsTotalPages: number;
    solutionsCurrentPage: number;
    isSolutionsLoading: boolean;
    reviews: Review[];
    avgRating: number;
    reviewsTotalPages: number;
    reviewsCurrentPage: number;
    reviewsTotalCount: number;
    isReviewsLoading: boolean;
    isFormatting: boolean;
    competitiveTestResults: TestResult[];
    competitiveSystemError: SystemError | null;
    competitiveIsExecuting: boolean;
    topics: Topic[];
    isTopicsLoading: boolean;
    xpGained: number | null;
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
    solutions: [],
    solutionsTotalPages: 1,
    solutionsCurrentPage: 1,
    isSolutionsLoading: false,
    reviews: [],
    avgRating: 0,
    reviewsTotalPages: 1,
    reviewsCurrentPage: 1,
    reviewsTotalCount: 0,
    isReviewsLoading: false,
    isFormatting: false,
    competitiveTestResults: [],
    competitiveSystemError: null,
    competitiveIsExecuting: false,
    topics: [],
    isTopicsLoading: false,
    xpGained: null,
};

export const fetchChallenges = createAsyncThunk<
    { items: Challenge[]; total: number; page: number; pageSize: number; totalPages: number },
    GetChallengesParams,
    { rejectValue: string }
>('challenges/fetchAll', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.getChallenges(payload);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка загрузки списка задач');
    }
});

export const fetchChallengeById = createAsyncThunk<Challenge, number, { rejectValue: string }>(
    'challenges/fetchOne',
    async (id, { rejectWithValue }) => {
        try {
            return await ChallengeService.getChallengeById(id);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Ошибка загрузки задачи');
        }
    }
);

export const runChallengeTests = createAsyncThunk<
    ExecuteResponse,
    { id: number; code: string; language: string; userId?: number },
    { rejectValue: string }
>('challenges/execute', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.executeChallenge(payload.id, payload.code, payload.language, payload.userId);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Сервер не смог обработать запрос');
    }
});

export const runCompetitiveTests = createAsyncThunk<
    ExecuteResponse,
    { id: number; code: string; language: string; userId?: number },
    { rejectValue: string }
>('challenges/executeCompetitive', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.executeChallenge(payload.id, payload.code, payload.language, payload.userId);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка выполнения');
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
        return rejectWithValue(error.response?.data?.message || 'Ошибка истории');
    }
});

export const fetchCommunitySolutions = createAsyncThunk<
    { items: any[]; totalPages: number; currentPage: number },
    { challengeId: number; userId: number; params?: GetSolutionsParams },
    { rejectValue: string }
>('challenges/fetchSolutions', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.getSolutions(payload.challengeId, payload.userId, payload.params);
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Ошибка загрузки решений');
    }
});

export const fetchReviews = createAsyncThunk<
    { reviews: Review[]; avgRating: number; pagination: any },
    { challengeId: number; params?: GetReviewsParams },
    { rejectValue: string }
>('challenges/fetchReviews', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.getReviews(payload.challengeId, payload.params);
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

export const formatChallengeCode = createAsyncThunk<string, { code: string; language: string }, { rejectValue: string }>(
    'challenges/format',
    async (payload, { rejectWithValue }) => {
        try {
            return await ChallengeService.formatCode(payload.code, payload.language);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Ошибка форматирования');
        }
    }
);

export const fetchTopics = createAsyncThunk<Topic[], void, { rejectValue: string }>(
    'challenges/fetchTopics',
    async (_, { rejectWithValue }) => {
        try {
            return await ChallengeService.getTopics();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Ошибка загрузки тем');
        }
    }
);
const challengeSlice = createSlice({
    name: 'challenges',
    initialState,
    reducers: {
        resetChallenges(state) {
            state.items = [];
            state.total = 0;
            state.page = 1;
        },
        clearCurrentChallenge(state) {
            state.currentChallenge = null;
            state.testResults = [];
            state.systemError = null;
            state.currentError = null;
        },
        resetTestResults(state) {
            state.testResults = [];
            state.systemError = null;
            state.xpGained = null;
        },
        resetCompetitiveResults(state) {
            state.competitiveTestResults = [];
            state.competitiveSystemError = null;
        },
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
                state.error = action.payload || 'Ошибка загрузки';
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
                state.currentError = action.payload || 'Задача не найдена';
            })

            .addCase(runChallengeTests.pending, (state) => {
                state.isExecuting = true;
                state.testResults = [];
                state.systemError = null;
            })
            .addCase(runChallengeTests.fulfilled, (state, action: PayloadAction<ExecuteResponse>) => {
                state.isExecuting = false;
                state.testResults = action.payload.testResults || [];
                state.executionTimeMs = action.payload.executionTimeMs ?? null;
                state.isTimeLimitExceeded = action.payload.isTimeLimitExceeded ?? false;
                state.xpGained = action.payload.xpGained ?? null;
                if (!action.payload.success) state.systemError = action.payload.error || null;
            })
            .addCase(runChallengeTests.rejected, (state) => {
                state.isExecuting = false;
            })

            .addCase(runCompetitiveTests.pending, (state) => {
                state.competitiveIsExecuting = true;
                state.competitiveTestResults = [];
                state.competitiveSystemError = null;
            })
            .addCase(runCompetitiveTests.fulfilled, (state, action: PayloadAction<ExecuteResponse>) => {
                state.competitiveIsExecuting = false;
                state.competitiveTestResults = action.payload.testResults || [];
                if (!action.payload.success) {
                    state.competitiveSystemError = action.payload.error || null;
                }
            })
            .addCase(runCompetitiveTests.rejected, (state, action) => {
                state.competitiveIsExecuting = false;
                state.competitiveSystemError = {
                    type: 'runtime_error',
                    message: action.payload || 'Ошибка выполнения',
                    details: ''
                };
            })

            .addCase(fetchCommunitySolutions.pending, (state) => {
                state.isSolutionsLoading = true;
            })
            .addCase(fetchCommunitySolutions.fulfilled, (state, action) => {
                state.isSolutionsLoading = false;
                state.solutions = action.payload.items;
                state.solutionsTotalPages = action.payload.totalPages;
                state.solutionsCurrentPage = action.payload.currentPage;
            })
            .addCase(fetchCommunitySolutions.rejected, (state) => {
                state.isSolutionsLoading = false;
            })

            .addCase(fetchReviews.pending, (state) => {
                state.isReviewsLoading = true;
            })
            .addCase(fetchReviews.fulfilled, (state, action) => {
                state.isReviewsLoading = false;
                state.reviews = action.payload.reviews;
                state.avgRating = action.payload.avgRating;
                state.reviewsTotalPages = action.payload.pagination.totalPages;
                state.reviewsCurrentPage = action.payload.pagination.page;
                state.reviewsTotalCount = action.payload.pagination.total;
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
            })

            .addCase(fetchTopics.pending, (state) => {
                state.isTopicsLoading = true;
            })
            .addCase(fetchTopics.fulfilled, (state, action) => {
                state.isTopicsLoading = false;
                state.topics = action.payload;
            })
            .addCase(fetchTopics.rejected, (state) => {
                state.isTopicsLoading = false;
            });
    },
});

export const {
    resetChallenges,
    clearCurrentChallenge,
    resetTestResults,
    resetCompetitiveResults
} = challengeSlice.actions;

export default challengeSlice.reducer;
