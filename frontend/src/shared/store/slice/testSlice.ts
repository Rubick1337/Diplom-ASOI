import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import TestApiService, {
    TestListItem,
    TestFull,
    AttemptStartResult,
    SubmitAnswer,
    SubmitResult,
    AttemptSummary,
    AttemptResult,
} from '@/shared/services/TestApiService';

// ─── State ────────────────────────────────────────────────────────────────────

interface TestState {
    tests:        TestListItem[];
    topics:       { id: number; name: string }[];
    currentTest:  TestFull | null;
    attempt:      AttemptStartResult | null;
    submitResult: SubmitResult | null;
    myAttempts:   AttemptSummary[];
    attemptResult: AttemptResult | null;
    isLoading:    boolean;
    isSubmitting: boolean;
    error:        string | null;
}

const initialState: TestState = {
    tests:         [],
    topics:        [],
    currentTest:   null,
    attempt:       null,
    submitResult:  null,
    myAttempts:    [],
    attemptResult: null,
    isLoading:     false,
    isSubmitting:  false,
    error:         null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchTests = createAsyncThunk<TestListItem[], void, { rejectValue: string }>(
    'test/fetchTests',
    async (_, { rejectWithValue }) => {
        try { return await TestApiService.getPublishedTests(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const fetchTestTopics = createAsyncThunk<{ id: number; name: string }[], void, { rejectValue: string }>(
    'test/fetchTopics',
    async (_, { rejectWithValue }) => {
        try { return await TestApiService.getTopics(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const fetchTest = createAsyncThunk<TestFull, number, { rejectValue: string }>(
    'test/fetchTest',
    async (id, { rejectWithValue }) => {
        try { return await TestApiService.getPublishedTest(id); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const startAttempt = createAsyncThunk<AttemptStartResult, number, { rejectValue: string }>(
    'test/startAttempt',
    async (testId, { rejectWithValue }) => {
        try { return await TestApiService.startAttempt(testId); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
    }
);

export const submitAttempt = createAsyncThunk<
    SubmitResult,
    { attemptId: number; answers: SubmitAnswer[] },
    { rejectValue: string }
>('test/submitAttempt', async ({ attemptId, answers }, { rejectWithValue }) => {
    try { return await TestApiService.submitAttempt(attemptId, answers); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const fetchMyAttempts = createAsyncThunk<AttemptSummary[], number, { rejectValue: string }>(
    'test/fetchMyAttempts',
    async (testId, { rejectWithValue }) => {
        try { return await TestApiService.getMyAttempts(testId); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const fetchAttemptResult = createAsyncThunk<AttemptResult, number, { rejectValue: string }>(
    'test/fetchAttemptResult',
    async (attemptId, { rejectWithValue }) => {
        try { return await TestApiService.getAttemptResult(attemptId); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const testSlice = createSlice({
    name: 'test',
    initialState,
    reducers: {
        clearAttempt(state) {
            state.attempt      = null;
            state.submitResult = null;
        },
        clearCurrentTest(state) {
            state.currentTest = null;
        },
        clearAttemptResult(state) {
            state.attemptResult = null;
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder

            // fetchTests
            .addCase(fetchTests.pending,   (state) => { state.isLoading = true; state.error = null; })
            .addCase(fetchTests.fulfilled, (state, action) => { state.isLoading = false; state.tests = action.payload; })
            .addCase(fetchTests.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; })

            // fetchTestTopics
            .addCase(fetchTestTopics.fulfilled, (state, action) => { state.topics = action.payload; })

            // fetchTest
            .addCase(fetchTest.pending,   (state) => { state.isLoading = true; state.error = null; state.currentTest = null; })
            .addCase(fetchTest.fulfilled, (state, action) => { state.isLoading = false; state.currentTest = action.payload; })
            .addCase(fetchTest.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; })

            // startAttempt
            .addCase(startAttempt.pending,   (state) => { state.isLoading = true; state.error = null; })
            .addCase(startAttempt.fulfilled, (state, action) => {
                state.isLoading   = false;
                state.attempt     = action.payload;
                state.submitResult = null;
            })
            .addCase(startAttempt.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; })

            // submitAttempt
            .addCase(submitAttempt.pending,   (state) => { state.isSubmitting = true; state.error = null; })
            .addCase(submitAttempt.fulfilled, (state, action) => {
                state.isSubmitting = false;
                state.submitResult = action.payload;
                state.attempt      = null;
            })
            .addCase(submitAttempt.rejected,  (state, action) => { state.isSubmitting = false; state.error = action.payload || 'Ошибка'; })

            // fetchMyAttempts
            .addCase(fetchMyAttempts.fulfilled, (state, action) => { state.myAttempts = action.payload; })

            // fetchAttemptResult
            .addCase(fetchAttemptResult.pending,   (state) => { state.isLoading = true; state.attemptResult = null; })
            .addCase(fetchAttemptResult.fulfilled, (state, action) => { state.isLoading = false; state.attemptResult = action.payload; })
            .addCase(fetchAttemptResult.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; });
    },
});

export const { clearAttempt, clearCurrentTest, clearAttemptResult, clearError } = testSlice.actions;
export default testSlice.reducer;
