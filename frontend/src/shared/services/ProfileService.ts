import $api from '@/http/apiClient';
import { API_ENDPOINTS } from '@/http/apiEndpoints';

export interface ProfileData {
    user:      { id: number; username: string; email: string; experience: number; rating: number };
    stats:     { totalAttempts: number; solvedCount: number; successRate: number; avgTime: number | null; solvedToday: number };
    languages: { lang: string; count: number }[];
    topics:    { name: string; attempted: number; solved: number; rate: number }[];
    allTopics: string[];
}

export interface MySubmission {
    id: number;
    challengeId: number;
    status: string;
    language: string;
    executionTimeMs: number | null;
    testsPassed: number | null;
    testsTotal:  number | null;
    createdAt: string;
    code: string | null;
    challenge: { id: number; name: string } | null;
}

export interface MyReport {
    id: number;
    challengeId: number;
    reasonText: string | null;
    status: string;
    createdAt: string;
    challenge: { id: number; name: string } | null;
    reason:    { id: number; name: string } | null;
}

export interface LearningChallenge {
    id: number;
    name: string;
    difficulty: number;
}

export interface TopicGuide {
    concepts: string[];
    path: string[];
    related: string[];
}

export interface TopicProgress {
    id: number;
    name: string;
    total: number;
    attempted: number;
    solved: number;
    rate: number;
    masteryRate: number;
    status: 'not_started' | 'in_progress' | 'mastered';
    nextChallenges: LearningChallenge[];
    guide: TopicGuide | null;
}

export interface RecommendationFactor {
    positive: boolean;
    text: string;
}

export interface LearningRecommendation {
    type: 'improve' | 'continue' | 'start' | 'review';
    topicId: number;
    topicName: string;
    reason: string;
    score: number;
    factors: RecommendationFactor[];
    challenges: LearningChallenge[];
}

export interface LearningPlan {
    topicProgress: TopicProgress[];
    recommendations: LearningRecommendation[];
    overallProgress: { mastered: number; inProgress: number; notStarted: number; total: number };
}

export interface PagedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface HistoryParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    language?: string;
}

export interface ReportsParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
}

const ProfileService = {
    getProfile: async (): Promise<ProfileData> => {
        const { data } = await $api.get(API_ENDPOINTS.USER.GET_PROFILE);
        return data;
    },

    getMyHistory: async (params: HistoryParams = {}): Promise<PagedResult<MySubmission>> => {
        const { data } = await $api.get(API_ENDPOINTS.USER.GET_MY_HISTORY, { params });
        return data;
    },

    getMyReports: async (params: ReportsParams = {}): Promise<PagedResult<MyReport>> => {
        const { data } = await $api.get(API_ENDPOINTS.USER.GET_MY_REPORTS, { params });
        return data;
    },

    getActivityHeatmap: async (year?: number): Promise<{ days: Record<string, number> }> => {
        const { data } = await $api.get(API_ENDPOINTS.USER.GET_ACTIVITY_HEATMAP, { params: year ? { year } : {} });
        return data;
    },

    getLearningPlan: async (): Promise<LearningPlan> => {
        const { data } = await $api.get(API_ENDPOINTS.USER.GET_LEARNING_PLAN);
        return data;
    },

    generateTopicGuide: async (topicName: string, preferences?: string, forceRegenerate?: boolean): Promise<TopicGuide> => {
        const { data } = await $api.post(API_ENDPOINTS.USER.GENERATE_TOPIC_GUIDE, {
            topicName,
            preferences: preferences || undefined,
            forceRegenerate: forceRegenerate || undefined,
        });
        return data;
    },
};

export default ProfileService;
