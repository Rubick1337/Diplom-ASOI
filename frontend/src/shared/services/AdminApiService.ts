import $api from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/apiEndpoints';

export interface AdminOverview {
    totalUsers: number;
    totalChallenges: number;
    totalSubmissions: number;
    successRate: number;
    avgRating: number;
    pendingReports: number;
}

export interface ActivityPoint {
    date: string;
    submissions: number;
    successes: number;
    failures: number;
}

export interface ChallengeStats {
    byTopic: { topic: string; total: number; submissions: number; successes: number }[];
    byDifficulty: { difficulty: number; total: number; submissions: number }[];
    byLanguage: { language: string; total: number }[];
    lowestRated: { name: string; reviewCount: number; avgRating: number }[];
}

export interface TopUser {
    rank: number;
    id: number;
    username: string;
    experience: number;
    rating: number;
    submissions: number;
    solved: number;
    uniqueSolved: number;
    successRate: number;
}

export interface ReportReason {
    id: number;
    name: string;
}

export interface ReportRow {
    id: number;
    challengeId: number | null;
    reason: string;
    reasonText: string | null;
    status: string;
    createdAt: string;
    reporter: string;
    challenge: string;
    resolvedBy?: string | null;
    resolvedAt?: string | null;
}

export interface ChallengeDetail {
    id: number;
    name: string;
    difficulty: number;
    authorId: number | null;
    authorUsername: string;
}

export interface ReportsStats {
    byStatus: { status: string; total: number }[];
    byReason: { reason: string; total: number }[];
    recent?: { createdAt: string; reporter: string; challenge: string; reason: string; status: string }[];
}

export interface ReportsPage {
    total: number;
    page: number;
    limit: number;
    rows: ReportRow[];
}

export interface ReportFilters {
    page?: number;
    limit?: number;
    status?: string;
    challenge?: string;
    reporter?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface HeatmapPoint {
    day: number;
    hour: number;
    count: number;
}

export interface FunnelStage {
    stage: string;
    value: number;
}

export interface UserDistributions {
    rating:     { label: string; count: number }[];
    experience: { label: string; count: number }[];
}

export interface LeaderboardRow {
    rank: number;
    id: number;
    username: string;
    experience: number;
    rating: number;
    submissions: number;
    solved: number;
    uniqueSolved: number;
    successRate: number;
}

export interface LeaderboardPage {
    total: number;
    page: number;
    limit: number;
    rows: LeaderboardRow[];
}

export interface TestStats {
    totalTests: number;
    publishedTests: number;
    totalAttempts: number;
    completedAttempts: number;
    avgScore: number;
    byStatus: { status: string; total: number }[];
    byTopic: { topic: string; totalTests: number; totalAttempts: number; avgPct: number }[];
    lowestRated: { id: number; title: string; reviewCount: number; avgRating: number }[];
}

export default class AdminApiService {
    static async getOverview(): Promise<AdminOverview> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.OVERVIEW);
        return data;
    }

    static async getActivity(from: string, to: string): Promise<ActivityPoint[]> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.ACTIVITY, { params: { from, to } });
        return data;
    }

    static async getChallengeStats(): Promise<ChallengeStats> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.CHALLENGES);
        return data;
    }

    static async getTopUsers(limit: number = 10): Promise<TopUser[]> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.USERS, { params: { limit } });
        return data;
    }

    static async getReportsStats(): Promise<ReportsStats> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.REPORTS);
        return data;
    }

    static async getRecentReports(filters: ReportFilters = {}): Promise<ReportsPage> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.REPORTS_RECENT, { params: filters });
        return data;
    }

    static async getReportReasons(): Promise<ReportReason[]> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.REPORT_REASONS);
        return data;
    }

    static async getActivityHeatmap(): Promise<HeatmapPoint[]> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.HEATMAP);
        return data;
    }

    static async getChallengeFunnel(): Promise<FunnelStage[]> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.FUNNEL);
        return data;
    }

    static async getUserDistributions(ratingBucket = 50, expBucket = 100): Promise<UserDistributions> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.DISTRIBUTIONS, { params: { ratingBucket, expBucket } });
        return data;
    }

    static async getLeaderboard(params: {
        page?: number; limit?: number; search?: string; sortBy?: string; sortDir?: string;
    } = {}): Promise<LeaderboardPage> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.LEADERBOARD, { params });
        return data;
    }

    static async updateReportStatus(id: number, status: string, adminMessage?: string): Promise<{ id: number; status: string; resolvedBy?: string | null; resolvedAt?: string | null }> {
        const { data } = await $api.patch(API_ENDPOINTS.ADMIN.UPDATE_REPORT(id), { status, adminMessage });
        return data;
    }

    static async getChallengesManage(params: {
        page?: number; limit?: number; search?: string; topicId?: number;
    } = {}): Promise<{ total: number; page: number; limit: number; rows: ChallengeManageRow[] }> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.CHALLENGES_MANAGE, { params });
        return data;
    }

    static async updateChallengeAdmin(id: number, data: {
        name?: string; topicIds?: number[]; difficulty?: number; isHidden?: boolean;
    }): Promise<ChallengeManageRow> {
        const { data: res } = await $api.patch(API_ENDPOINTS.ADMIN.CHALLENGE_UPDATE(id), data);
        return res;
    }

    static async toggleChallengeHidden(id: number, isHidden: boolean): Promise<{ id: number; isHidden: boolean }> {
        const { data } = await $api.patch(API_ENDPOINTS.ADMIN.CHALLENGE_HIDDEN(id), { isHidden });
        return data;
    }

    static async deleteChallengeAdmin(id: number): Promise<{ success: boolean }> {
        const { data } = await $api.delete(API_ENDPOINTS.ADMIN.CHALLENGE_DELETE(id));
        return data;
    }

    static async getChallengeDetail(challengeId: number): Promise<ChallengeDetail> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.CHALLENGE_DETAIL(challengeId));
        return data;
    }

    static async updateChallengeDifficulty(challengeId: number, difficulty: number): Promise<{ id: number; difficulty: number }> {
        const { data } = await $api.patch(API_ENDPOINTS.ADMIN.CHALLENGE_DIFFICULTY(challengeId), { difficulty });
        return data;
    }

    static async getTopics(): Promise<Topic[]> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.TOPICS);
        return data;
    }

    static async createTopic(name: string): Promise<Topic> {
        const { data } = await $api.post(API_ENDPOINTS.ADMIN.TOPICS, { name });
        return data;
    }

    static async updateTopic(id: number, name: string): Promise<Topic> {
        const { data } = await $api.put(API_ENDPOINTS.ADMIN.TOPIC(id), { name });
        return data;
    }

    static async deleteTopic(id: number): Promise<{ success: boolean }> {
        const { data } = await $api.delete(API_ENDPOINTS.ADMIN.TOPIC(id));
        return data;
    }

    static async getAdminAchievements(): Promise<AdminAchievement[]> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.ACHIEVEMENTS);
        return data;
    }

    static async createAdminAchievement(form: FormData): Promise<AdminAchievement> {
        const { data } = await $api.post(API_ENDPOINTS.ADMIN.ACHIEVEMENTS, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    static async updateAdminAchievement(id: number, form: FormData): Promise<AdminAchievement> {
        const { data } = await $api.put(API_ENDPOINTS.ADMIN.ACHIEVEMENT(id), form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    static async deleteAdminAchievement(id: number): Promise<{ ok: boolean }> {
        const { data } = await $api.delete(API_ENDPOINTS.ADMIN.ACHIEVEMENT(id));
        return data;
    }

    static async codewarsGetKata(id: string): Promise<CodewarsKata> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.CODEWARS_KATA(id));
        return data;
    }

    static async getTestStats(): Promise<TestStats> {
        const { data } = await $api.get(API_ENDPOINTS.ADMIN.TEST_STATS);
        return data;
    }

    static async exportChallenges(ids: number[]): Promise<ChallengeImportItem[]> {
        const { data } = await $api.post(API_ENDPOINTS.ADMIN.CHALLENGES_EXPORT, { ids });
        return data;
    }

    static async importChallenges(challenges: ChallengeImportItem[]): Promise<{ results: ImportResult[] }> {
        const { data } = await $api.post(API_ENDPOINTS.ADMIN.CHALLENGES_IMPORT, { challenges });
        return data;
    }

    static async generateChallengesAI(prompt: string, count: number): Promise<ChallengeImportItem[]> {
        const { data } = await $api.post(API_ENDPOINTS.ADMIN.CHALLENGES_GENERATE_AI, { prompt, count });
        return data;
    }
}

export interface ChallengeManageRow {
    id: number;
    name: string;
    topics: { id: number; name: string }[];
    difficulty: number;
    mode: string;
    isHidden: boolean;
    author: string;
    funcName: string;
}

export interface Topic {
    id: number;
    name: string;
}

export interface CodewarsKata {
    id: string;
    name: string;
    slug: string;
    description: string;
    rank: { id: number; name: string; color: string } | null;
    difficulty: number;
    tags: string[];
    languages: string[];
    url: string;
    funcName: string;
    sampleInput: string;
    sampleOutput: string;
    totalCompleted?: number;
}

export interface ChallengeImportItem {
    name: string;
    description: string;
    difficulty: number;
    mode?: string;
    funcName: string;
    timeLimitMs?: number;
    sampleInput?: string;
    sampleOutput?: string;
    isHidden?: boolean;
    topics?: string[];
    parameters: { name: string; dataType: string; order: number }[];
    testCases: {
        title: string;
        expectedOutput: string;
        testArgs: { value: string; order: number }[];
    }[];
}

export interface ImportResult {
    name: string;
    status: 'created' | 'error';
    id?: number;
    error?: string;
}

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AdminAchievement {
    id: number;
    title: string;
    desc: string;
    rarity: AchievementRarity;
    imageFilename: string | null;
    percent: number;
    unlockedCount: number;
}
