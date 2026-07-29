const AdminRepositorySequelize = require('../../Data/repository/AdminRepositorySequelize');
const CacheUtils = require('../../Data/utils/cacheUtils');
const ChallengeRepositorySequelize = require('../../Data/repository/ChallengeRepositorySequelize');
const AIService = require('./AIService');

const TTL_STATS = 300;
const TTL_TOPICS = 3600;
const TTL_LEADERBOARD = 120;

class AdminService {
    constructor(adminRepository) {
        this.adminRepository = adminRepository || new AdminRepositorySequelize();
    }

    async getOverview() {
        const key = CacheUtils.generateCacheKey('admin', 'overview', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getOverview();
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }

    async getActivity({ from, to }) {
        const key = CacheUtils.generateCacheKey('admin', 'activity', { from, to });
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getActivity(from, to);
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }

    async getChallengeStats() {
        const key = CacheUtils.generateCacheKey('admin', 'challengeStats', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const [byTopic, byDifficulty, byLanguage, lowestRated] = await Promise.all([
            this.adminRepository.getChallengesByTopic(),
            this.adminRepository.getChallengesByDifficulty(),
            this.adminRepository.getSubmissionsByLanguage(),
            this.adminRepository.getLowestRatedChallenges(),
        ]);
        const result = { byTopic, byDifficulty, byLanguage, lowestRated };
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }

    async getTopUsers({ limit }) {
        const n = Number(limit) || 10;
        const key = CacheUtils.generateCacheKey('admin', 'topUsers', { limit: n });
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getTopUsers(n);
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }

    async getLeaderboard(params = {}) {
        const { page = 1, limit = 20, search = '', sortBy = 'solved', sortDir = 'DESC' } = params;
        const key = CacheUtils.generateCacheKey('admin', 'leaderboard', { page, limit, search, sortBy, sortDir });
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getLeaderboard(params);
        await CacheUtils.setCache(key, TTL_LEADERBOARD, result);
        return result;
    }

    async getReportsStats() {
        const key = CacheUtils.generateCacheKey('admin', 'reportsStats', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const [byStatus, byReason] = await Promise.all([
            this.adminRepository.getReportsByStatus(),
            this.adminRepository.getReportsByReason(),
        ]);
        const result = { byStatus, byReason };
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }

    async getRecentReports(params = {}) {
        return await this.adminRepository.getRecentReports(params);
    }

    async getReportReasons() {
        return await this.adminRepository.getReportReasons();
    }

    async getActivityHeatmap() {
        const key = CacheUtils.generateCacheKey('admin', 'activityHeatmap', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getActivityHeatmap();
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }

    async getChallengeFunnel() {
        const key = CacheUtils.generateCacheKey('admin', 'challengeFunnel', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getChallengeFunnel();
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }

    async getUserDistributions({ ratingBucket = 50, expBucket = 100 } = {}) {
        const key = CacheUtils.generateCacheKey('admin', 'userDistributions', { ratingBucket, expBucket });
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getUserDistributions(ratingBucket, expBucket);
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }

    async updateReportStatus(id, status, adminId, adminMessage) {
        const result = await this.adminRepository.updateReportStatus(id, status, adminId);
        if (status !== 'Pending') {
            const isResolved = status === 'Resolved';
            const baseMsg = isResolved
                ? `Ваша жалоба на задачу «${result.challengeName}» рассмотрена и принята.`
                : `Ваша жалоба на задачу «${result.challengeName}» была отклонена.`;
            const message = adminMessage
                ? `${baseMsg}\n\nКомментарий администратора: ${adminMessage}`
                : baseMsg;
            await this.adminRepository.createNotification(result.userId, {
                title: 'Ваша жалоба рассмотрена',
                message,
                type: 'report',
                challengeId: null,
            });
        }
        const { userId, challengeName, ...frontendResult } = result;
        return frontendResult;
    }

    async getChallengesManage(params) {
        return await this.adminRepository.getChallengesManage(params);
    }

    async updateChallengeAdmin(id, data) {
        const result = await this.adminRepository.updateChallengeAdmin(id, data);
        await Promise.all([
            CacheUtils.invalidateCache('challenge:byId'),
            CacheUtils.invalidateCache('challenge:list'),
            CacheUtils.invalidateCache('admin'),
        ]);
        return result;
    }

    async toggleChallengeHidden(id, isHidden) {
        const result = await this.adminRepository.toggleChallengeHidden(id, isHidden);
        await Promise.all([
            CacheUtils.invalidateCache('challenge:byId'),
            CacheUtils.invalidateCache('challenge:list'),
        ]);
        return result;
    }

    async deleteChallengeAdmin(id) {
        const result = await this.adminRepository.deleteChallengeAdmin(id);
        await Promise.all([
            CacheUtils.invalidateCache('challenge:byId'),
            CacheUtils.invalidateCache('challenge:list'),
            CacheUtils.invalidateCache('admin'),
        ]);
        return result;
    }

    async getChallengeDetail(challengeId)           { return await this.adminRepository.getChallengeDetail(challengeId); }

    async updateChallengeDifficulty(id, difficulty) {
        const result = await this.adminRepository.updateChallengeDifficulty(id, difficulty);
        await Promise.all([
            CacheUtils.invalidateCache('challenge:byId'),
            CacheUtils.invalidateCache('challenge:list'),
        ]);
        return result;
    }

    async createNotification(userId, data)  { return await this.adminRepository.createNotification(userId, data); }
    async getUserNotifications(userId)      { return await this.adminRepository.getUserNotifications(userId); }
    async markNotificationRead(id, userId)  { return await this.adminRepository.markNotificationRead(id, userId); }

    async getAllTopics() {
        const key = CacheUtils.generateCacheKey('topics', 'all', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getAllTopics();
        await CacheUtils.setCache(key, TTL_TOPICS, result);
        return result;
    }

    async createTopic(name) {
        const result = await this.adminRepository.createTopic(name);
        await Promise.all([
            CacheUtils.invalidateCache('topics'),
            CacheUtils.invalidateCache('challenge:list'),
        ]);
        return result;
    }

    async updateTopic(id, name) {
        const result = await this.adminRepository.updateTopic(id, name);
        await Promise.all([
            CacheUtils.invalidateCache('topics'),
            CacheUtils.invalidateCache('challenge:list'),
        ]);
        return result;
    }

    async deleteTopic(id) {
        const result = await this.adminRepository.deleteTopic(id);
        await Promise.all([
            CacheUtils.invalidateCache('topics'),
            CacheUtils.invalidateCache('challenge:list'),
        ]);
        return result;
    }

    async exportChallenges(ids) {
        if (!Array.isArray(ids) || ids.length === 0) throw new Error('Список ID задач не может быть пустым');
        return await this.adminRepository.getChallengesForExport(ids);
    }

    async importChallenges(challenges) {
        if (!Array.isArray(challenges) || challenges.length === 0) throw new Error('Список задач пуст');
        const repo = new ChallengeRepositorySequelize();
        const results = [];

        for (const ch of challenges) {
            try {
                const topicIds = [];
                if (Array.isArray(ch.topics)) {
                    for (const name of ch.topics) {
                        if (name?.trim()) {
                            const id = await repo.findOrCreateTopic(name.trim());
                            topicIds.push(id);
                        }
                    }
                }
                const challengeData = {
                    name:            ch.name,
                    description:     ch.description,
                    topicIds,
                    difficulty:      ch.difficulty ? Number(ch.difficulty) : 1,
                    mode:            ch.mode || 'harness',
                    funcName:        ch.funcName,
                    timeLimitMs:     ch.timeLimitMs || 2000,
                    createdByUserId: null,
                    sampleInput:     ch.sampleInput  || '',
                    sampleOutput:    ch.sampleOutput || '',
                    isHidden:        ch.isHidden ?? false,
                    parameters:      Array.isArray(ch.parameters) ? ch.parameters : [],
                };
                const created = await repo.createWithTestCases(challengeData, ch.testCases || []);
                results.push({ name: ch.name, status: 'created', id: created.id });
            } catch (e) {
                results.push({ name: ch.name, status: 'error', error: e.message });
            }
        }

        await Promise.all([
            CacheUtils.invalidateCache('challenge:byId'),
            CacheUtils.invalidateCache('challenge:list'),
            CacheUtils.invalidateCache('admin'),
        ]);
        return results;
    }

    async generateChallengesAI(prompt, count) {
        return await AIService.generateChallengesBatch(prompt, count);
    }

    async getTestStats() {
        const key = CacheUtils.generateCacheKey('admin', 'testStats', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await this.adminRepository.getTestStats();
        await CacheUtils.setCache(key, TTL_STATS, result);
        return result;
    }
}

module.exports = AdminService;
