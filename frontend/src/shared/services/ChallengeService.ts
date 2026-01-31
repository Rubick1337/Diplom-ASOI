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
    id?: number;
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

export interface ExecuteResponse {
    challengeId: number;
    language: string;
    success: boolean;
    testResults?: TestResult[];
    error?: SystemError;
    executionTimeMs?: number;
    isTimeLimitExceeded?: boolean;
}

export default class ChallengeService {
    private static mapDto(dto: any): Challenge {
        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            topic: dto.topic || 'General',
            mode: dto.mode || 'harness',
            funcName: dto.funcName || 'solution',
            timeLimitMs: dto.timeLimitMs ?? 2000,
            sampleInput: dto.sampleInput || '',
            sampleOutput: dto.sampleOutput || '',
            difficulty: dto.difficulty ?? null,
            author: dto.author,
            parameters: (dto.parameters || []).map((p: any): ChallengeParameter => ({
                name: p.name,
                type: (p.dataType || p.type || 'string') as ChallengeParameter['type']
            })),
            testCases: (dto.testCases || []).map((tc: any): ChallengeTestCase => ({
                id: tc.id,
                challengeId: tc.challengeId,
                title: tc.title || `Test ${tc.id}`,
                expectedOutput: tc.expectedOutput,
                inputArgs: (tc.testArgs || [])
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((arg: any) => arg.value)
            })),
        };
    }

    static async getChallenges(params: {
        page?: number;
        pageSize?: number;
        search?: string;
    }): Promise<ChallengeListResult> {
        const query: Record<string, string | number> = {};
        if (params.page) query.page = params.page;
        if (params.pageSize) query.pageSize = params.pageSize;
        if (params.search?.trim()) query.search = params.search.trim();

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
        console.log(userId);
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

    static async getSolutions(challengeId: number, userId: number, page: number = 1, pageSize: number = 6
    ): Promise<{ items: any[], totalPages: number, currentPage: number }> {
        console.log(page)
        console.log(pageSize)
        const { data } = await $api.get<any>(
            API_ENDPOINTS.CHALLENGE.GET_SOLUTIONS(challengeId),
            { params: { userId, page, pageSize } }
        );
        return {
            items: data.items,
            totalPages: data.totalPages,
            currentPage: data.page
        };
    }

    static async getReviews(challengeId: number): Promise<{ reviews: Review[], avgRating: number }> {
        const { data } = await $api.get<{ reviews: Review[], avgRating: number }>(
            API_ENDPOINTS.CHALLENGE.GET_REVIEWS(challengeId)
        );
        console.log(data)
        return data;
    }

    static async createReview(challengeId: number, userId: number, content: string, rating: number): Promise<Review> {
        const { data } = await $api.post<Review>(
            API_ENDPOINTS.CHALLENGE.CREATE_REVIEW(challengeId),
            { userId, content, rating }
        );
        return data;
    }
}