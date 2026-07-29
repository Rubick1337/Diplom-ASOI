import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AdminApiService, {
    AdminOverview,
    ActivityPoint,
    ChallengeStats,
    TopUser,
    ReportsStats,
    HeatmapPoint,
    FunnelStage,
    UserDistributions,
    TestStats,
} from '@/shared/services/AdminApiService';

interface AdminState {
    overview: AdminOverview | null;
    activity: ActivityPoint[];
    challengeStats: ChallengeStats | null;
    topUsers: TopUser[];
    reportsStats: ReportsStats | null;
    heatmap: HeatmapPoint[];
    funnel: FunnelStage[];
    distributions: UserDistributions | null;
    testStats: TestStats | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AdminState = {
    overview: null,
    activity: [],
    challengeStats: null,
    topUsers: [],
    reportsStats: null,
    heatmap: [],
    funnel: [],
    distributions: null,
    testStats: null,
    isLoading: false,
    error: null,
};

export const fetchAdminOverview = createAsyncThunk<AdminOverview, void, { rejectValue: string }>(
    'admin/fetchOverview',
    async (_, { rejectWithValue }) => {
        try { return await AdminApiService.getOverview(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

type ActivityArgs = { from: string; to: string };

export const fetchAdminActivity = createAsyncThunk<ActivityPoint[], ActivityArgs, { rejectValue: string }>(
    'admin/fetchActivity',
    async ({ from, to }, { rejectWithValue }) => {
        try { return await AdminApiService.getActivity(from, to); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

export const fetchAdminChallengeStats = createAsyncThunk<ChallengeStats, void, { rejectValue: string }>(
    'admin/fetchChallengeStats',
    async (_, { rejectWithValue }) => {
        try { return await AdminApiService.getChallengeStats(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

export const fetchAdminTopUsers = createAsyncThunk<TopUser[], number, { rejectValue: string }>(
    'admin/fetchTopUsers',
    async (limit, { rejectWithValue }) => {
        try { return await AdminApiService.getTopUsers(limit); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

export const fetchAdminReportsStats = createAsyncThunk<ReportsStats, void, { rejectValue: string }>(
    'admin/fetchReportsStats',
    async (_, { rejectWithValue }) => {
        try { return await AdminApiService.getReportsStats(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

export const fetchAdminHeatmap = createAsyncThunk<HeatmapPoint[], void, { rejectValue: string }>(
    'admin/fetchHeatmap',
    async (_, { rejectWithValue }) => {
        try { return await AdminApiService.getActivityHeatmap(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

export const fetchAdminFunnel = createAsyncThunk<FunnelStage[], void, { rejectValue: string }>(
    'admin/fetchFunnel',
    async (_, { rejectWithValue }) => {
        try { return await AdminApiService.getChallengeFunnel(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

export const fetchAdminTestStats = createAsyncThunk<TestStats, void, { rejectValue: string }>(
    'admin/fetchTestStats',
    async (_, { rejectWithValue }) => {
        try { return await AdminApiService.getTestStats(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

type DistributionArgs = { ratingBucket: number; expBucket: number };

export const fetchAdminDistributions = createAsyncThunk<UserDistributions, DistributionArgs | void, { rejectValue: string }>(
    'admin/fetchDistributions',
    async (args, { rejectWithValue }) => {
        try {
            return await AdminApiService.getUserDistributions(
                (args as DistributionArgs)?.ratingBucket ?? 50,
                (args as DistributionArgs)?.expBucket    ?? 100,
            );
        } catch (e: any) { return rejectWithValue(e.message || 'Ошибка загрузки'); }
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        resetAdmin(state) {
            Object.assign(state, initialState);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminOverview.pending,  (state) => { state.isLoading = true;  state.error = null; })
            .addCase(fetchAdminOverview.fulfilled, (state, action) => { state.isLoading = false; state.overview = action.payload; })
            .addCase(fetchAdminOverview.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; })

            .addCase(fetchAdminActivity.fulfilled,       (state, action) => { state.activity       = action.payload; })
            .addCase(fetchAdminChallengeStats.fulfilled, (state, action) => { state.challengeStats = action.payload; })
            .addCase(fetchAdminTopUsers.fulfilled,       (state, action) => { state.topUsers       = action.payload; })
            .addCase(fetchAdminReportsStats.fulfilled,   (state, action) => { state.reportsStats   = action.payload; })
            .addCase(fetchAdminHeatmap.fulfilled,        (state, action) => { state.heatmap        = action.payload; })
            .addCase(fetchAdminFunnel.fulfilled,         (state, action) => { state.funnel         = action.payload; })
            .addCase(fetchAdminDistributions.fulfilled,  (state, action) => { state.distributions  = action.payload; })
            .addCase(fetchAdminTestStats.fulfilled,      (state, action) => { state.testStats       = action.payload; })

            .addCase(fetchAdminChallengeStats.rejected, (_, action) => { console.log('challengeStats FAILED:', action.payload, action.error); })
            .addCase(fetchAdminTopUsers.rejected,       (_, action) => { console.log('topUsers FAILED:', action.payload, action.error); });
    },
});

export const { resetAdmin } = adminSlice.actions;
export default adminSlice.reducer;
