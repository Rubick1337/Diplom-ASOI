'use client';

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ChallengeService, { ExecuteResponse, TestResult, SystemError } from '@/shared/services/ChallengeService';
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
    { id: number; code: string; language: string },
    { rejectValue: string }
>('challenges/execute', async (payload, { rejectWithValue }) => {
    try {
        return await ChallengeService.executeChallenge(payload.id, payload.code, payload.language);
    } catch (error: any) {
        const message = error.response?.data?.message || 'Сервер не смог обработать запрос';
        return rejectWithValue(message);
    }
});

export const formatChallengeCode = createAsyncThunk<
    string,
    { code: string; language: string },
    { rejectValue: string }
>('challenges/format', async (payload, { rejectWithValue }) => {
    try {
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
                console.log("REDUX RECEIVE:", action.payload);
                state.executionTimeMs = action.payload.executionTimeMs ?? null;
                state.isTimeLimitExceeded = !!action.payload.isTimeLimitExceeded;

                state.testResults = action.payload.testResults || [];

                if (action.payload.success) {
                    state.systemError = null;
                } else {
                    state.systemError = action.payload.error || null;
                }
            })
            .addCase(runChallengeTests.rejected, (state, action) => {
                state.isExecuting = false;
                state.executionError = action.payload ?? 'Ошибка запуска';
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