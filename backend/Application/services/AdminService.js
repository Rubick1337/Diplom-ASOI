const AdminRepositorySequelize = require('../../Data/repository/AdminRepositorySequelize');

class AdminService {
    constructor(adminRepository) {
        this.adminRepository = adminRepository || new AdminRepositorySequelize();
    }

    async getOverview() {
        return await this.adminRepository.getOverview();
    }

    async getActivity({ from, to }) {
        return await this.adminRepository.getActivity(from, to);
    }

    async getChallengeStats() {
        const [byTopic, byDifficulty, byLanguage, hardest] = await Promise.all([
            this.adminRepository.getChallengesByTopic(),
            this.adminRepository.getChallengesByDifficulty(),
            this.adminRepository.getSubmissionsByLanguage(),
            this.adminRepository.getHardestChallenges(),
        ]);
        return { byTopic, byDifficulty, byLanguage, hardest };
    }

    async getTopUsers({ limit }) {
        return await this.adminRepository.getTopUsers(Number(limit) || 10);
    }

    async getLeaderboard(params = {}) {
        return await this.adminRepository.getLeaderboard(params);
    }

    async getReportsStats() {
        const [byStatus, byReason] = await Promise.all([
            this.adminRepository.getReportsByStatus(),
            this.adminRepository.getReportsByReason(),
        ]);
        return { byStatus, byReason };
    }

    async getRecentReports(params = {}) {
        return await this.adminRepository.getRecentReports(params);
    }

    async getReportReasons() {
        return await this.adminRepository.getReportReasons();
    }

    async getActivityHeatmap() {
        return await this.adminRepository.getActivityHeatmap();
    }

    async getChallengeFunnel() {
        return await this.adminRepository.getChallengeFunnel();
    }

    async getUserDistributions({ ratingBucket = 50, expBucket = 100 } = {}) {
        return await this.adminRepository.getUserDistributions(ratingBucket, expBucket);
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
        return await this.adminRepository.updateChallengeAdmin(id, data);
    }
    async toggleChallengeHidden(id, isHidden) {
        return await this.adminRepository.toggleChallengeHidden(id, isHidden);
    }
    async deleteChallengeAdmin(id) {
        return await this.adminRepository.deleteChallengeAdmin(id);
    }

    async getChallengeDetail(challengeId)              { return await this.adminRepository.getChallengeDetail(challengeId); }
    async updateChallengeDifficulty(id, difficulty)    { return await this.adminRepository.updateChallengeDifficulty(id, difficulty); }
    async createNotification(userId, data)             { return await this.adminRepository.createNotification(userId, data); }
    async getUserNotifications(userId)                 { return await this.adminRepository.getUserNotifications(userId); }
    async markNotificationRead(id, userId)             { return await this.adminRepository.markNotificationRead(id, userId); }

    async getAllTopics()         { return await this.adminRepository.getAllTopics(); }
    async createTopic(name)     { return await this.adminRepository.createTopic(name); }
    async updateTopic(id, name) { return await this.adminRepository.updateTopic(id, name); }
    async deleteTopic(id)       { return await this.adminRepository.deleteTopic(id); }
}

module.exports = AdminService;
