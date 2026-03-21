import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AdminApiService, {
    ChallengeManageRow,
    ChallengeDetail,
    ReportsPage,
    ReportFilters,
    Topic,
} from '@/shared/services/AdminApiService';

interface ChallengesManagePage {
    total: number;
    page: number;
    limit: number;
    rows: ChallengeManageRow[];
}

interface AdminManageState {
    reportsPage: ReportsPage;
    challengesManage: ChallengesManagePage;
    topics: Topic[];
    challengeDetail: ChallengeDetail | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AdminManageState = {
    reportsPage:      { total: 0, page: 1, limit: 15, rows: [] },
    challengesManage: { total: 0, page: 1, limit: 20, rows: [] },
    topics: [],
    challengeDetail: null,
    isLoading: false,
    error: null,
};

export const fetchAdminReportsPage = createAsyncThunk<ReportsPage, ReportFilters | void, { rejectValue: string }>(
    'adminManage/fetchReportsPage',
    async (filters, { rejectWithValue }) => {
        try { return await AdminApiService.getRecentReports((filters as ReportFilters) ?? {}); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const adminUpdateReportStatus = createAsyncThunk<
    { id: number; status: string; resolvedBy?: string | null; resolvedAt?: string | null },
    { id: number; status: string; adminMessage?: string },
    { rejectValue: string }
>('adminManage/updateReportStatus', async ({ id, status, adminMessage }, { rejectWithValue }) => {
    try { return await AdminApiService.updateReportStatus(id, status, adminMessage); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

type ManageParams = { page?: number; limit?: number; search?: string; topicId?: number };

export const fetchChallengesManage = createAsyncThunk<ChallengesManagePage, ManageParams | void, { rejectValue: string }>(
    'adminManage/fetchChallengesManage',
    async (params, { rejectWithValue }) => {
        try { return await AdminApiService.getChallengesManage((params as ManageParams) ?? {}); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const adminUpdateChallenge = createAsyncThunk<
    ChallengeManageRow,
    { id: number; name?: string; topicIds?: number[]; difficulty?: number; isHidden?: boolean },
    { rejectValue: string }
>('adminManage/updateChallenge', async ({ id, ...data }, { rejectWithValue }) => {
    try { return await AdminApiService.updateChallengeAdmin(id, data); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const adminToggleChallengeHidden = createAsyncThunk<
    { id: number; isHidden: boolean }, { id: number; isHidden: boolean }, { rejectValue: string }
>('adminManage/toggleChallengeHidden', async ({ id, isHidden }, { rejectWithValue }) => {
    try { return await AdminApiService.toggleChallengeHidden(id, isHidden); }
    catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
});

export const adminDeleteChallenge = createAsyncThunk<{ id: number }, number, { rejectValue: string }>(
    'adminManage/deleteChallenge',
    async (id, { rejectWithValue }) => {
        try { await AdminApiService.deleteChallengeAdmin(id); return { id }; }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const fetchChallengeDetail = createAsyncThunk<ChallengeDetail, number, { rejectValue: string }>(
    'adminManage/fetchChallengeDetail',
    async (challengeId, { rejectWithValue }) => {
        try { return await AdminApiService.getChallengeDetail(challengeId); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const adminUpdateDifficulty = createAsyncThunk<
    { id: number; difficulty: number }, { challengeId: number; difficulty: number }, { rejectValue: string }
>('adminManage/updateDifficulty', async ({ challengeId, difficulty }, { rejectWithValue }) => {
    try { return await AdminApiService.updateChallengeDifficulty(challengeId, difficulty); }
    catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
});

export const fetchAdminTopics = createAsyncThunk<Topic[], void, { rejectValue: string }>(
    'adminManage/fetchTopics',
    async (_, { rejectWithValue }) => {
        try { return await AdminApiService.getTopics(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const adminCreateTopic = createAsyncThunk<Topic, string, { rejectValue: string }>(
    'adminManage/createTopic',
    async (name, { rejectWithValue }) => {
        try { return await AdminApiService.createTopic(name); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
    }
);

export const adminUpdateTopic = createAsyncThunk<Topic, { id: number; name: string }, { rejectValue: string }>(
    'adminManage/updateTopic',
    async ({ id, name }, { rejectWithValue }) => {
        try { return await AdminApiService.updateTopic(id, name); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
    }
);

export const adminDeleteTopic = createAsyncThunk<{ id: number }, number, { rejectValue: string }>(
    'adminManage/deleteTopic',
    async (id, { rejectWithValue }) => {
        try { await AdminApiService.deleteTopic(id); return { id }; }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
    }
);

const adminManageSlice = createSlice({
    name: 'adminManage',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            .addCase(fetchAdminReportsPage.pending, (state) => { state.isLoading = true; state.error = null; })
            .addCase(fetchAdminReportsPage.fulfilled, (state, action) => { state.isLoading = false; state.reportsPage = action.payload; })
            .addCase(fetchAdminReportsPage.rejected, (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; })

            .addCase(adminUpdateReportStatus.fulfilled, (state, action) => {
                const { id, status, resolvedBy, resolvedAt } = action.payload;
                state.reportsPage.rows = state.reportsPage.rows.map(r =>
                    r.id === id ? { ...r, status, resolvedBy: resolvedBy ?? r.resolvedBy, resolvedAt: resolvedAt ?? r.resolvedAt } : r
                );
            })

            .addCase(fetchChallengesManage.pending, (state) => { state.isLoading = true; state.error = null; })
            .addCase(fetchChallengesManage.fulfilled, (state, action) => { state.isLoading = false; state.challengesManage = action.payload; })
            .addCase(fetchChallengesManage.rejected, (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; })

            .addCase(adminUpdateChallenge.fulfilled, (state, action) => {
                state.challengesManage.rows = state.challengesManage.rows.map(r =>
                    r.id === action.payload.id ? action.payload : r
                );
            })

            .addCase(adminToggleChallengeHidden.fulfilled, (state, action) => {
                const { id, isHidden } = action.payload;
                state.challengesManage.rows = state.challengesManage.rows.map(r => r.id === id ? { ...r, isHidden } : r);
            })
            .addCase(adminDeleteChallenge.fulfilled, (state, action) => {
                state.challengesManage.rows = state.challengesManage.rows.filter(r => r.id !== action.payload.id);
                state.challengesManage.total -= 1;
            })

            .addCase(fetchChallengeDetail.pending,   (state) => { state.challengeDetail = null; })
            .addCase(fetchChallengeDetail.fulfilled, (state, action) => { state.challengeDetail = action.payload; })
            .addCase(adminUpdateDifficulty.fulfilled, (state, action) => {
                if (state.challengeDetail?.id === action.payload.id)
                    state.challengeDetail.difficulty = action.payload.difficulty;
                state.challengesManage.rows = state.challengesManage.rows.map(r =>
                    r.id === action.payload.id ? { ...r, difficulty: action.payload.difficulty } : r
                );
            })

            .addCase(fetchAdminTopics.fulfilled, (state, action) => { state.topics = action.payload; })
            .addCase(adminCreateTopic.fulfilled, (state, action) => {
                state.topics = [...state.topics, action.payload].sort((a, b) => a.name.localeCompare(b.name));
            })
            .addCase(adminUpdateTopic.fulfilled, (state, action) => {
                state.topics = state.topics.map(t => t.id === action.payload.id ? action.payload : t)
                    .sort((a, b) => a.name.localeCompare(b.name));
            })
            .addCase(adminDeleteTopic.fulfilled, (state, action) => {
                state.topics = state.topics.filter(t => t.id !== action.payload.id);
            });
    },
});

export default adminManageSlice.reducer;
