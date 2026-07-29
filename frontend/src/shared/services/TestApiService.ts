import $api from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/apiEndpoints';

// ─── Типы ────────────────────────────────────────────────────────────────────

export interface QuestionType {
    id:   number;
    name: string;
}

export interface QuestionOption {
    id:         number;
    text:       string;
    isCorrect?: boolean;        // отсутствует когда отдаётся пользователю
    matchPair?: string | null;
    blankIndex?: number | null;
    order:      number;
}

export interface QuestionTestCase {
    id:             number;
    input:          string | null;
    expectedOutput: string;
    isHidden:       boolean;
    order:          number;
}

export interface TestCaseResult {
    input:          string | null;
    expectedOutput: string;
    actualOutput:   string | null;
    passed:         boolean;
    isHidden:       boolean;
    timedOut:       boolean;
    error:          string | null;
}

export interface Question {
    id:            number;
    testId:        number;
    typeId:        number;
    type:          QuestionType;
    text:          string;
    points:        number;
    order:         number;
    allowMultiple?: boolean;
    caseSensitive?: boolean;
    tolerance?:    number | null;
    codeLanguage?: string | null;
    starterCode?:  string | null;
    funcName?:     string | null;
    options:       QuestionOption[];
    testCases?:    QuestionTestCase[];
    imageUrl?:     string | null;
}

export interface TestListItem {
    id:               number;
    title:            string;
    description:      string | null;
    timeLimitMinutes:  number | null;
    questionCount:     number;
    isPublished?:      boolean;
    author?:           string | null;
    createdAt?:        string;
    topicId?:          number | null;
    difficulty?:       number | null;
    topic?:            { id: number; name: string } | null;
    shuffleQuestions?:    boolean;
    shuffleOptions?:      boolean;
    questionPoolSize?:    number | null;
    showCorrectAnswers?:  boolean;
}

export interface TestFull extends TestListItem {
    questions: Question[];
}

export interface AttemptStartResult {
    attemptId:        number;
    startedAt:        string;
    timeLimitMinutes: number | null;
    maxScore:         number;
    questionIds?:     number[];
    shuffleOptions?:  boolean;
}

export interface SubmitAnswer {
    questionId:        number;
    selectedOptionIds?: number[];
    answerText?:       string;
    codeAnswer?:       string;
    matchingAnswer?:   Record<string, string>;  // { optionId: matchPair }
}

export interface SubmitResult {
    attemptId: number;
    status:    'completed' | 'timed_out';
    score:     number;
    maxScore:  number;
    percent:   number;
}

export interface AttemptSummary {
    id:         number;
    startedAt:  string;
    finishedAt: string | null;
    status:     string;
    score:      number | null;
    maxScore:   number;
}

export interface AttemptAnswer {
    id:                number;
    questionId:        number;
    selectedOptionIds: number[] | null;
    answerText:        string | null;
    codeAnswer:        string | null;
    matchingAnswer:    Record<string, string> | null;
    isCorrect:         boolean | null;
    pointsEarned:      number;
    testCaseResults:   TestCaseResult[] | null;
    question:          Question;
}

export interface AttemptResult {
    id:         number;
    status:     string;
    score:      number;
    maxScore:   number;
    startedAt:  string;
    finishedAt: string | null;
    test:       { id: number; title: string; timeLimitMinutes: number | null; showCorrectAnswers: boolean };
    answers:    AttemptAnswer[];
}

export interface QuestionInput {
    typeId:        number;
    text:          string;
    points?:       number;
    order?:        number;
    allowMultiple?: boolean;
    caseSensitive?: boolean;
    tolerance?:    number | null;
    codeLanguage?: string | null;
    starterCode?:  string | null;
    funcName?:     string | null;
    options?:      Omit<QuestionOption, 'id'>[];
    testCases?:    Omit<QuestionTestCase, 'id'>[];
}

export interface TestReview {
    userId:    number;
    testId:    number;
    content:   string | null;
    rating:    number;
    createdAt: string;
    user:      { id: number; username: string } | null;
}

export interface TestReviewsResult {
    reviews:    TestReview[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
    avgRating:  number;
}

export interface ImportResult {
    testId:         number;
    title:          string;
    imported:       number;
    skipped:        number;
    skippedDetails: { index: number; error: string }[];
}

// ─── Сервис ───────────────────────────────────────────────────────────────────

export default class TestApiService {

    // ── Справочник ─────────────────────────────────────────────────────────────

    static async getQuestionTypes(): Promise<QuestionType[]> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.QUESTION_TYPES);
        return data;
    }

    // ── Пользователь ───────────────────────────────────────────────────────────

    static async getPublishedTests(): Promise<TestListItem[]> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.LIST);
        return data;
    }

    static async getTopics(): Promise<{ id: number; name: string }[]> {
        const { data } = await $api.get(API_ENDPOINTS.CHALLENGE.GET_TOPICS);
        return data;
    }

    static async getPublishedTest(id: number): Promise<TestFull> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.ONE(id));
        return data;
    }

    static async startAttempt(testId: number): Promise<AttemptStartResult> {
        const { data } = await $api.post(API_ENDPOINTS.TESTS.START(testId));
        return data;
    }

    static async submitAttempt(attemptId: number, answers: SubmitAnswer[]): Promise<SubmitResult> {
        const { data } = await $api.post(API_ENDPOINTS.TESTS.SUBMIT(attemptId), { answers });
        return data;
    }

    static async getMyAttempts(testId: number): Promise<AttemptSummary[]> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.MY_ATTEMPTS(testId));
        return data;
    }

    static async getAttemptResult(attemptId: number): Promise<AttemptResult> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.ATTEMPT_RESULT(attemptId));
        return data;
    }

    static async getTestReportReasons(testId: number): Promise<{ id: number; name: string }[]> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.REPORT_REASONS(testId));
        return data;
    }

    static async createTestReport(testId: number, reasonId: number | null, reasonText: string): Promise<void> {
        await $api.post(API_ENDPOINTS.TESTS.REPORT(testId), { reasonId, reasonText });
    }

    static async getTestReviews(testId: number, params?: { page?: number; pageSize?: number; sort?: string }): Promise<TestReviewsResult> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.REVIEWS(testId), { params });
        return data;
    }

    static async createTestReview(testId: number, content: string, rating: number): Promise<TestReview> {
        const { data } = await $api.post(API_ENDPOINTS.TESTS.REVIEWS(testId), { content, rating });
        return data;
    }

    // ── Админ: тесты ───────────────────────────────────────────────────────────

    static async getAdminTests(): Promise<TestListItem[]> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.ADMIN_LIST);
        return data;
    }

    static async getAdminTest(id: number): Promise<TestFull> {
        const { data } = await $api.get(API_ENDPOINTS.TESTS.ADMIN_ONE(id));
        return data;
    }

    static async createTest(payload: { title: string; description?: string; timeLimitMinutes?: number | null; topicId?: number | null; difficulty?: number | null }): Promise<TestListItem> {
        const { data } = await $api.post(API_ENDPOINTS.TESTS.ADMIN_CREATE, payload);
        return data;
    }

    static async updateTest(id: number, payload: { title?: string; description?: string; timeLimitMinutes?: number | null; topicId?: number | null; difficulty?: number | null }): Promise<TestListItem> {
        const { data } = await $api.put(API_ENDPOINTS.TESTS.ADMIN_UPDATE(id), payload);
        return data;
    }

    static async publishTest(id: number, isPublished: boolean): Promise<{ id: number; isPublished: boolean }> {
        const { data } = await $api.patch(API_ENDPOINTS.TESTS.ADMIN_PUBLISH(id), { isPublished });
        return data;
    }

    static async deleteTest(id: number): Promise<{ success: boolean }> {
        const { data } = await $api.delete(API_ENDPOINTS.TESTS.ADMIN_DELETE(id));
        return data;
    }

    // ── Админ: вопросы ─────────────────────────────────────────────────────────

    static async createQuestion(testId: number, payload: QuestionInput): Promise<Question> {
        const { data } = await $api.post(API_ENDPOINTS.TESTS.QUESTION_CREATE(testId), payload);
        return data;
    }

    static async updateQuestion(testId: number, questionId: number, payload: Partial<QuestionInput>): Promise<Question> {
        const { data } = await $api.put(API_ENDPOINTS.TESTS.QUESTION_UPDATE(testId, questionId), payload);
        return data;
    }

    static async deleteQuestion(testId: number, questionId: number): Promise<{ success: boolean }> {
        const { data } = await $api.delete(API_ENDPOINTS.TESTS.QUESTION_DELETE(testId, questionId));
        return data;
    }

    static async reorderQuestions(testId: number, orderedIds: number[]): Promise<{ success: boolean }> {
        const { data } = await $api.patch(API_ENDPOINTS.TESTS.QUESTION_REORDER(testId), { orderedIds });
        return data;
    }

    // ── Moodle XML ─────────────────────────────────────────────────────────────

    static async exportMoodle(testId: number, testTitle?: string): Promise<{ blob: Blob; filename: string; hasCode: boolean }> {
        const response = await $api.get(API_ENDPOINTS.TESTS.ADMIN_EXPORT(testId), { responseType: 'blob' });
        const hasCode  = response.headers['x-has-code-questions'] === 'true';
        const disposition = response.headers['content-disposition'] ?? '';
        const match    = disposition.match(/filename="([^"]+)"/);
        const fallback = testTitle
            ? `${testTitle.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60)}.zip`
            : `test_${testId}.zip`;
        const filename = match ? match[1] : fallback;
        return { blob: response.data, filename, hasCode };
    }

    static async importMoodle(file: File): Promise<ImportResult> {
        const form = new FormData();
        form.append('file', file);
        const { data } = await $api.post(API_ENDPOINTS.TESTS.ADMIN_IMPORT, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    static async importQuizApi(params: {
        tags?: string;
        difficulty?: string;
        limit?: number;
        title?: string;
    }): Promise<ImportResult> {
        const { data } = await $api.post(API_ENDPOINTS.TESTS.ADMIN_IMPORT_QUIZ, params);
        return data;
    }
}
