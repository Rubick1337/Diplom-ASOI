'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ProfileService, {
    ProfileData,
    MySubmission,
    MyTestAttempt,
    MyReport,
    LearningPlan,
    PagedResult,
    HistoryParams,
    TestHistoryParams,
    ReportsParams,
} from '@/shared/services/ProfileService';

interface PagedState<T> {
    items: T[];
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
}

function emptyPaged<T>(): PagedState<T> {
    return { items: [], total: 0, page: 1, totalPages: 1, isLoading: false };
}

interface ProfileState {
    data:            ProfileData | null;
    isLoading:       boolean;
    history:         PagedState<MySubmission>;
    testHistory:     PagedState<MyTestAttempt>;
    reports:         PagedState<MyReport>;
    learningPlan:    LearningPlan | null;
    learningLoading: boolean;
    heatmap:         Record<string, number> | null;
}

const initialState: ProfileState = {
    data:            null,
    isLoading:       false,
    history:         emptyPaged(),
    testHistory:     emptyPaged(),
    reports:         emptyPaged(),
    learningPlan:    null,
    learningLoading: false,
    heatmap:         null,
};

export const fetchProfile = createAsyncThunk<ProfileData, void, { rejectValue: string }>(
    'profile/fetchProfile',
    async (_, { rejectWithValue }) => {
        try { return await ProfileService.getProfile(); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Ошибка загрузки профиля'); }
    }
);

export const fetchMyTestHistory = createAsyncThunk<PagedResult<MyTestAttempt>, TestHistoryParams, { rejectValue: string }>(
    'profile/fetchTestHistory',
    async (params, { rejectWithValue }) => {
        try { return await ProfileService.getMyTestHistory(params); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Ошибка загрузки истории тестов'); }
    }
);

export const fetchMyHistory = createAsyncThunk<PagedResult<MySubmission>, HistoryParams, { rejectValue: string }>(
    'profile/fetchHistory',
    async (params, { rejectWithValue }) => {
        try { return await ProfileService.getMyHistory(params); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Ошибка загрузки истории'); }
    }
);

export const fetchActivityHeatmap = createAsyncThunk<Record<string, number>, void, { rejectValue: string }>(
    'profile/fetchActivityHeatmap',
    async (_, { rejectWithValue }) => {
        try { const r = await ProfileService.getActivityHeatmap(); return r.days; }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Ошибка'); }
    }
);

export const fetchLearningPlan = createAsyncThunk<LearningPlan, void, { rejectValue: string }>(
    'profile/fetchLearningPlan',
    async (_, { rejectWithValue }) => {
        try { return await ProfileService.getLearningPlan(); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Ошибка загрузки плана обучения'); }
    }
);

export const fetchMyReports = createAsyncThunk<PagedResult<MyReport>, ReportsParams, { rejectValue: string }>(
    'profile/fetchReports',
    async (params, { rejectWithValue }) => {
        try { return await ProfileService.getMyReports(params); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || 'Ошибка загрузки жалоб'); }
    }
);

function applyPaged<T>(state: PagedState<T>, payload: PagedResult<T>) {
    state.items      = payload.items;
    state.total      = payload.total;
    state.page       = payload.page;
    state.totalPages = payload.totalPages;
    state.isLoading  = false;
}

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            .addCase(fetchProfile.pending,   (s) => { s.isLoading = true; })
            .addCase(fetchProfile.fulfilled,  (s, a) => { s.isLoading = false; s.data = a.payload; })
            .addCase(fetchProfile.rejected,   (s) => { s.isLoading = false; })

            .addCase(fetchMyHistory.pending,   (s) => { s.history.isLoading = true; })
            .addCase(fetchMyHistory.fulfilled,  (s, a) => applyPaged(s.history, a.payload))
            .addCase(fetchMyHistory.rejected,   (s) => { s.history.isLoading = false; })

            .addCase(fetchMyTestHistory.pending,   (s) => { s.testHistory.isLoading = true; })
            .addCase(fetchMyTestHistory.fulfilled,  (s, a) => applyPaged(s.testHistory, a.payload))
            .addCase(fetchMyTestHistory.rejected,   (s) => { s.testHistory.isLoading = false; })

            .addCase(fetchMyReports.pending,   (s) => { s.reports.isLoading = true; })
            .addCase(fetchMyReports.fulfilled,  (s, a) => applyPaged(s.reports, a.payload))
            .addCase(fetchMyReports.rejected,   (s) => { s.reports.isLoading = false; })

            .addCase(fetchActivityHeatmap.fulfilled, (s, a) => { s.heatmap = a.payload; })

            .addCase(fetchLearningPlan.pending,   (s) => { s.learningLoading = true; })
            .addCase(fetchLearningPlan.fulfilled,  (s, a) => { s.learningLoading = false; s.learningPlan = a.payload; })
            .addCase(fetchLearningPlan.rejected,   (s) => { s.learningLoading = false; });
    },
});

export default profileSlice.reducer;
