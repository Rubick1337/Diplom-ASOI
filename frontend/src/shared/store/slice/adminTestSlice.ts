import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import TestApiService, {
    TestListItem,
    TestFull,
    Question,
    QuestionType,
    QuestionInput,
    ImportResult,
} from '@/shared/services/TestApiService';

// ─── State ────────────────────────────────────────────────────────────────────

interface AdminTestState {
    tests:         TestListItem[];
    currentTest:   TestFull | null;
    questionTypes: QuestionType[];
    isLoading:     boolean;
    isSaving:      boolean;
    error:         string | null;
    importResult:  ImportResult | null;
}

const initialState: AdminTestState = {
    tests:         [],
    currentTest:   null,
    questionTypes: [],
    isLoading:     false,
    isSaving:      false,
    error:         null,
    importResult:  null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchQuestionTypes = createAsyncThunk<QuestionType[], void, { rejectValue: string }>(
    'adminTest/fetchQuestionTypes',
    async (_, { rejectWithValue }) => {
        try { return await TestApiService.getQuestionTypes(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const fetchAdminTests = createAsyncThunk<TestListItem[], void, { rejectValue: string }>(
    'adminTest/fetchTests',
    async (_, { rejectWithValue }) => {
        try { return await TestApiService.getAdminTests(); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const fetchAdminTest = createAsyncThunk<TestFull, number, { rejectValue: string }>(
    'adminTest/fetchTest',
    async (id, { rejectWithValue }) => {
        try { return await TestApiService.getAdminTest(id); }
        catch (e: any) { return rejectWithValue(e.message || 'Ошибка'); }
    }
);

export const adminCreateTest = createAsyncThunk<
    TestListItem,
    { title: string; description?: string; timeLimitMinutes?: number | null; topicId?: number | null; difficulty?: number | null },
    { rejectValue: string }
>('adminTest/createTest', async (payload, { rejectWithValue }) => {
    try { return await TestApiService.createTest(payload); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const adminUpdateTest = createAsyncThunk<
    TestListItem,
    { id: number; title?: string; description?: string; timeLimitMinutes?: number | null; topicId?: number | null; difficulty?: number | null; shuffleQuestions?: boolean; shuffleOptions?: boolean; questionPoolSize?: number | null; showCorrectAnswers?: boolean },
    { rejectValue: string }
>('adminTest/updateTest', async ({ id, ...payload }, { rejectWithValue }) => {
    try { return await TestApiService.updateTest(id, payload); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const adminPublishTest = createAsyncThunk<
    { id: number; isPublished: boolean },
    { id: number; isPublished: boolean },
    { rejectValue: string }
>('adminTest/publishTest', async ({ id, isPublished }, { rejectWithValue }) => {
    try { return await TestApiService.publishTest(id, isPublished); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const adminDeleteTest = createAsyncThunk<{ id: number }, number, { rejectValue: string }>(
    'adminTest/deleteTest',
    async (id, { rejectWithValue }) => {
        try { await TestApiService.deleteTest(id); return { id }; }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
    }
);

export const adminCreateQuestion = createAsyncThunk<
    Question,
    { testId: number; payload: QuestionInput },
    { rejectValue: string }
>('adminTest/createQuestion', async ({ testId, payload }, { rejectWithValue }) => {
    try { return await TestApiService.createQuestion(testId, payload); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const adminUpdateQuestion = createAsyncThunk<
    Question,
    { testId: number; questionId: number; payload: Partial<QuestionInput> },
    { rejectValue: string }
>('adminTest/updateQuestion', async ({ testId, questionId, payload }, { rejectWithValue }) => {
    try { return await TestApiService.updateQuestion(testId, questionId, payload); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const adminDeleteQuestion = createAsyncThunk<
    { questionId: number },
    { testId: number; questionId: number },
    { rejectValue: string }
>('adminTest/deleteQuestion', async ({ testId, questionId }, { rejectWithValue }) => {
    try { await TestApiService.deleteQuestion(testId, questionId); return { questionId }; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const adminReorderQuestions = createAsyncThunk<
    { orderedIds: number[] },
    { testId: number; orderedIds: number[] },
    { rejectValue: string }
>('adminTest/reorderQuestions', async ({ testId, orderedIds }, { rejectWithValue }) => {
    try { await TestApiService.reorderQuestions(testId, orderedIds); return { orderedIds }; }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

export const adminImportMoodle = createAsyncThunk<ImportResult, File, { rejectValue: string }>(
    'adminTest/importMoodle',
    async (file, { rejectWithValue }) => {
        try { return await TestApiService.importMoodle(file); }
        catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
    }
);

export const adminImportQuizApi = createAsyncThunk<
    ImportResult,
    { tags?: string; difficulty?: string; limit?: number; title?: string },
    { rejectValue: string }
>('adminTest/importQuizApi', async (params, { rejectWithValue }) => {
    try { return await TestApiService.importQuizApi(params); }
    catch (e: any) { return rejectWithValue(e.response?.data?.message || e.message || 'Ошибка'); }
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const adminTestSlice = createSlice({
    name: 'adminTest',
    initialState,
    reducers: {
        clearCurrentTest(state) { state.currentTest = null; },
        clearImportResult(state) { state.importResult = null; },
        clearError(state) { state.error = null; },
    },
    extraReducers: (builder) => {
        builder

            // questionTypes
            .addCase(fetchQuestionTypes.fulfilled, (state, action) => {
                state.questionTypes = action.payload;
            })

            // fetchAdminTests
            .addCase(fetchAdminTests.pending,   (state) => { state.isLoading = true; state.error = null; })
            .addCase(fetchAdminTests.fulfilled, (state, action) => { state.isLoading = false; state.tests = action.payload; })
            .addCase(fetchAdminTests.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; })

            // fetchAdminTest
            .addCase(fetchAdminTest.pending,   (state) => { state.isLoading = true; state.error = null; state.currentTest = null; })
            .addCase(fetchAdminTest.fulfilled, (state, action) => { state.isLoading = false; state.currentTest = action.payload; })
            .addCase(fetchAdminTest.rejected,  (state, action) => { state.isLoading = false; state.error = action.payload || 'Ошибка'; })

            // createTest
            .addCase(adminCreateTest.pending,   (state) => { state.isSaving = true; state.error = null; })
            .addCase(adminCreateTest.fulfilled, (state, action) => {
                state.isSaving = false;
                state.tests.unshift(action.payload);
            })
            .addCase(adminCreateTest.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload || 'Ошибка'; })

            // updateTest
            .addCase(adminUpdateTest.pending,   (state) => { state.isSaving = true; state.error = null; })
            .addCase(adminUpdateTest.fulfilled, (state, action) => {
                state.isSaving = false;
                state.tests = state.tests.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t);
                if (state.currentTest?.id === action.payload.id)
                    Object.assign(state.currentTest, action.payload);
            })
            .addCase(adminUpdateTest.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload || 'Ошибка'; })

            // publishTest
            .addCase(adminPublishTest.fulfilled, (state, action) => {
                const { id, isPublished } = action.payload;
                state.tests = state.tests.map(t => t.id === id ? { ...t, isPublished } : t);
                if (state.currentTest?.id === id) state.currentTest.isPublished = isPublished;
            })

            // deleteTest
            .addCase(adminDeleteTest.fulfilled, (state, action) => {
                state.tests = state.tests.filter(t => t.id !== action.payload.id);
                if (state.currentTest?.id === action.payload.id) state.currentTest = null;
            })

            // createQuestion
            .addCase(adminCreateQuestion.pending,   (state) => { state.isSaving = true; state.error = null; })
            .addCase(adminCreateQuestion.fulfilled, (state, action) => {
                state.isSaving = false;
                if (state.currentTest) {
                    state.currentTest.questions.push(action.payload);
                }
            })
            .addCase(adminCreateQuestion.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload || 'Ошибка'; })

            // updateQuestion
            .addCase(adminUpdateQuestion.pending,   (state) => { state.isSaving = true; state.error = null; })
            .addCase(adminUpdateQuestion.fulfilled, (state, action) => {
                state.isSaving = false;
                if (state.currentTest) {
                    state.currentTest.questions = state.currentTest.questions.map(q =>
                        q.id === action.payload.id ? action.payload : q
                    );
                }
            })
            .addCase(adminUpdateQuestion.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload || 'Ошибка'; })

            // deleteQuestion
            .addCase(adminDeleteQuestion.fulfilled, (state, action) => {
                if (state.currentTest) {
                    state.currentTest.questions = state.currentTest.questions.filter(
                        q => q.id !== action.payload.questionId
                    );
                }
            })

            // reorderQuestions — применяем порядок оптимистично
            .addCase(adminReorderQuestions.fulfilled, (state, action) => {
                const { orderedIds } = action.payload;
                if (state.currentTest) {
                    const map = new Map(state.currentTest.questions.map(q => [q.id, q]));
                    state.currentTest.questions = orderedIds
                        .map((id, i) => map.get(id) ? { ...map.get(id)!, order: i } : null)
                        .filter(Boolean) as Question[];
                }
            })

            // importMoodle
            .addCase(adminImportMoodle.pending,   (state) => { state.isSaving = true; state.error = null; state.importResult = null; })
            .addCase(adminImportMoodle.fulfilled, (state, action) => {
                state.isSaving = false;
                state.importResult = action.payload;
            })
            .addCase(adminImportMoodle.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload || 'Ошибка'; })

            // importQuizApi
            .addCase(adminImportQuizApi.pending,   (state) => { state.isSaving = true; state.error = null; state.importResult = null; })
            .addCase(adminImportQuizApi.fulfilled, (state, action) => {
                state.isSaving = false;
                state.importResult = action.payload;
            })
            .addCase(adminImportQuizApi.rejected,  (state, action) => { state.isSaving = false; state.error = action.payload || 'Ошибка'; });
    },
});

export const { clearCurrentTest, clearImportResult, clearError } = adminTestSlice.actions;
export default adminTestSlice.reducer;
