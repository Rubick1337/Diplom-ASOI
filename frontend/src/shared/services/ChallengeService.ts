'use client';

import $api from '@/http/apiClient';
import { API_ENDPOINTS } from '@/http/apiEndpoints';
import { Challenge, ChallengeTestCase, ChallengeParameter } from '@/shared/types/challenge';

export interface TestResult {
    id: number | string;
    status: 'success' | 'fail' | 'error';
    actual: any;
    expected: any;
    duration?: number;
    message?: string;
}

export interface ChallengeHistory {
    id: number;
    code: string;
    language: string;
    status: string;
    executionTimeMs: number;
    createdAt: string;
}

export interface Review {
    userId: number;
    challengeId: number;
    content: string;
    rating: number;
    createdAt: string;
    user?: { username: string };
}

export interface ChallengeListResult {
    items: Challenge[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface SystemError {
    type: 'runtime_error' | 'parse_error';
    message: string;
    details: string;
}

export interface GetReviewsParams {
    page?: number;
    pageSize?: number;
    sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
}

export interface ExecuteResponse {
    challengeId: number;
    language: string;
    success: boolean;
    testResults?: TestResult[];
    error?: SystemError;
    executionTimeMs?: number;
    isTimeLimitExceeded?: boolean;
    xpGained?: number;
}

export interface GetSolutionsParams {
    page?: number;
    pageSize?: number;
    language?: string;
    sort?: 'newest' | 'oldest';
}

export interface GetChallengesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    topicId?: number;
    difficulty?: number | 'all';
    sort?: string;
}

export interface Topic {
    id: number;
    name: string;
}

export default class ChallengeService {
    private static mapDto(dto: any): Challenge {
        const data = dto.dataValues ? dto.dataValues : dto;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            topics: Array.isArray(data.topics) ? data.topics : [],
            mode: data.mode || 'harness',
            funcName: data.funcName || 'solution',
            timeLimitMs: data.timeLimitMs,
            difficulty: data.difficulty !== null && data.difficulty !== undefined
                ? Number(data.difficulty)
                : null,
            solvedCount: data.solvedCount !== undefined ? Number(data.solvedCount) : 0,
            averageRating: data.averageRating !== undefined ? Number(data.averageRating) : 0,
            sampleInput: data.sampleInput || '',
            sampleOutput: data.sampleOutput || '',
            author: data.author ? {
                id: data.author.id,
                username: data.author.username,
                email: data.author.email
            } : undefined,
            parameters: (data.parameters || []).map((p: any): ChallengeParameter => ({
                name: p.name,
                type: (p.dataType || p.type || 'string') as ChallengeParameter['type']
            })),
            testCases: (data.testCases || []).map((tc: any): ChallengeTestCase => ({
                id: tc.id,
                challengeId: tc.challengeId,
                title: tc.title || `Test ${tc.id}`,
                expectedOutput: tc.expectedOutput,
                inputArgs: (tc.testArgs || []).map((arg: any) => arg.value)
            })),
        };
    }

    static async getChallenges(params: GetChallengesParams): Promise<ChallengeListResult> {
        const query: Record<string, any> = {};

        if (params.page) query.page = params.page;
        if (params.pageSize) query.pageSize = params.pageSize;
        if (params.search?.trim()) query.search = params.search.trim();
        if (params.topicId) query.topicId = params.topicId;
        if (params.difficulty && params.difficulty !== 'all') query.difficulty = params.difficulty;
        if (params.sort) query.sort = params.sort;

        const { data } = await $api.get<any>(API_ENDPOINTS.CHALLENGE.GET_ALL, { params: query });

        return {
            items: data.items.map((dto: any) => this.mapDto(dto)),
            total: data.total,
            page: data.page,
            pageSize: data.pageSize,
            totalPages: data.totalPages,
        };
    }

    static async getChallengeById(id: number): Promise<Challenge> {
        const { data } = await $api.get<any>(API_ENDPOINTS.CHALLENGE.GET_ONE(id));
        return this.mapDto(data);
    }

    static async executeChallenge(id: number, code: string, language: string, userId?: number): Promise<ExecuteResponse> {
        const { data } = await $api.post<ExecuteResponse>(
            API_ENDPOINTS.CHALLENGE.EXECUTE(id),
            { code, language, userId }
        );
        return data;
    }

    static async formatCode(code: string, language: string): Promise<string> {
        const { data } = await $api.post<{ formattedCode: string }>(
            API_ENDPOINTS.CHALLENGE.FORMAT,
            { code, language }
        );
        return data.formattedCode;
    }

    static async getHistory(challengeId: number, userId: number): Promise<ChallengeHistory[]> {
        const { data } = await $api.get<ChallengeHistory[]>(
            API_ENDPOINTS.CHALLENGE.GET_HISTORY(challengeId),
            { params: { userId } }
        );
        return data;
    }

    static async getSolutions(
        challengeId: number,
        userId: number,
        params: GetSolutionsParams = {}
    ): Promise<{ items: any[], totalPages: number, currentPage: number }> {
        const { data } = await $api.get<any>(
            API_ENDPOINTS.CHALLENGE.GET_SOLUTIONS(challengeId),
            {
                params: {
                    userId,
                    page: params.page || 1,
                    pageSize: params.pageSize || 6,
                    language: params.language === 'all' ? undefined : params.language,
                    sort: params.sort || 'newest'
                }
            }
        );
        return {
            items: data.items,
            totalPages: data.totalPages,
            currentPage: data.page
        };
    }

    static async getReviews(challengeId: number, params: GetReviewsParams = {}): Promise<{
        reviews: Review[],
        avgRating: number,
        pagination: { total: number, page: number, totalPages: number }
    }> {
        const { data } = await $api.get<any>(
            API_ENDPOINTS.CHALLENGE.GET_REVIEWS(challengeId),
            { params }
        );
        return data;
    }

    static async createReview(challengeId: number, userId: number, content: string, rating: number): Promise<Review> {
        const { data } = await $api.post<Review>(
            API_ENDPOINTS.CHALLENGE.CREATE_REVIEW(challengeId),
            { userId, content, rating }
        );
        return data;
    }

    static async generateChallenge(prompt: string): Promise<any> {
        const { data } = await $api.post(API_ENDPOINTS.CHALLENGE.AI_GENERATE, { prompt });
        return data;
    }

    static async createChallenge(data: any): Promise<Challenge> {
        const response = await $api.post(API_ENDPOINTS.CHALLENGE.CREATE, data);
        return response.data;
    }

    static async verifyChallenge(payload: {
        funcName: string;
        timeLimitMs: number;
        testCases: any[];
        code: string;
        language: string;
        parameters?: any[];
    }): Promise<ExecuteResponse> {
        const { data } = await $api.post<ExecuteResponse>(API_ENDPOINTS.CHALLENGE.VERIFY, payload);
        return data;
    }

    static async getTopics(): Promise<Topic[]> {
        const { data } = await $api.get<Topic[]>(API_ENDPOINTS.CHALLENGE.GET_TOPICS);
        return data;
    }

    static async createTopic(name: string): Promise<Topic> {
        const { data } = await $api.post<Topic>(API_ENDPOINTS.CHALLENGE.CREATE_TOPIC, { name });
        return data;
    }

    static async getReportReasons(challengeId: number): Promise<{ id: number; name: string }[]> {
        const { data } = await $api.get(API_ENDPOINTS.CHALLENGE.GET_REPORT_REASONS(challengeId));
        return data;
    }

    static async createReport(challengeId: number, userId: number, reasonId: number | null, reasonText: string): Promise<void> {
        await $api.post(API_ENDPOINTS.CHALLENGE.CREATE_REPORT(challengeId), { userId, reasonId, reasonText });
    }
}
