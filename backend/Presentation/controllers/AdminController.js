const AdminService = require('../../Application/services/AdminService');
const adminService = new AdminService();

class AdminController {

    async getOverview(req, res, next) {
        try {
            const data = await adminService.getOverview();
            res.json(data);
        } catch (e) { next(e); }
    }

    async getActivity(req, res, next) {
        try {
            const { from, to } = req.query;
            const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const dateTo = to || new Date().toISOString();
            const data = await adminService.getActivity({ from: dateFrom, to: dateTo });
            res.json(data);
        } catch (e) { next(e); }
    }

    async getChallengeStats(req, res, next) {
        try {
            const data = await adminService.getChallengeStats();
            res.json(data);
        } catch (e) {
            console.error('getChallengeStats ERROR:', e);
            next(e);
        }
    }

    async getTopUsers(req, res, next) {
        try {
            const { limit = 10 } = req.query;
            const data = await adminService.getTopUsers({ limit });
            res.json(data);
        } catch (e) {
            console.error('getTopUsers ERROR:', e);
            next(e);
        }
    }

    getLeaderboard = async (req, res) => {
        try {
            const { page = 1, limit = 20, search = '', sortBy = 'solved', sortDir = 'DESC' } = req.query;
            const data = await adminService.getLeaderboard({ page, limit, search, sortBy, sortDir });
            return res.json(data);
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    };

    async getReportsStats(req, res, next) {
        try {
            const data = await adminService.getReportsStats();
            res.json(data);
        } catch (e) { next(e); }
    }

    async getRecentReports(req, res, next) {
        try {
            const { page, limit, status, challenge, reporter, dateFrom, dateTo } = req.query;
            const data = await adminService.getRecentReports({ page, limit, status, challenge, reporter, dateFrom, dateTo });
            res.json(data);
        } catch (e) { next(e); }
    }

    async getReportReasons(req, res, next) {
        try {
            const data = await adminService.getReportReasons();
            res.json(data);
        } catch (e) { next(e); }
    }

    async getActivityHeatmap(req, res, next) {
        try {
            const data = await adminService.getActivityHeatmap();
            res.json(data);
        } catch (e) { next(e); }
    }

    async  getChallengeFunnel(req, res, next) {
        try {
            const data = await adminService.getChallengeFunnel();
            res.json(data);
        } catch (e) { next(e); }
    }

    async getUserDistributions(req, res, next) {
        try {
            const { ratingBucket = 50, expBucket = 100 } = req.query;
            const data = await adminService.getUserDistributions({ ratingBucket, expBucket });
            res.json(data);
        } catch (e) { next(e); }
    }

    async updateReportStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, adminMessage } = req.body;
            if (!['Pending', 'Resolved', 'Dismissed'].includes(status))
                return res.status(400).json({ message: 'Недопустимый статус' });
            const TokenService = require('../../Application/services/TokenService');
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            const adminId = payload?.id || null;
            const data = await adminService.updateReportStatus(id, status, adminId, adminMessage);
            res.json(data);
        } catch (e) { next(e); }
    }

    async getChallengesManage(req, res, next) {
        try {
            const { page, limit, search, topicId } = req.query;
            const data = await adminService.getChallengesManage({ page, limit, search, topicId });
            res.json(data);
        } catch (e) { next(e); }
    }

    async updateChallengeAdmin(req, res, next) {
        try {
            const { id } = req.params;
            const { name, topicIds, difficulty, isHidden } = req.body;
            const data = await adminService.updateChallengeAdmin(id, { name, topicIds, difficulty, isHidden });
            res.json(data);
        } catch (e) { next(e); }
    }

    async toggleChallengeHidden(req, res, next) {
        try {
            const { id } = req.params;
            const { isHidden } = req.body;
            const data = await adminService.toggleChallengeHidden(id, !!isHidden);
            res.json(data);
        } catch (e) { next(e); }
    }

    async deleteChallengeAdmin(req, res, next) {
        try {
            const data = await adminService.deleteChallengeAdmin(req.params.id);
            res.json(data);
        } catch (e) { next(e); }
    }

    async getChallengeDetail(req, res, next) {
        try {
            const data = await adminService.getChallengeDetail(req.params.id);
            res.json(data);
        } catch (e) { next(e); }
    }

    async updateChallengeDifficulty(req, res, next) {
        try {
            const { difficulty } = req.body;
            if (!difficulty) return res.status(400).json({ message: 'difficulty обязателен' });
            const data = await adminService.updateChallengeDifficulty(req.params.id, difficulty);
            res.json(data);
        } catch (e) { next(e); }
    }

    async getAllTopics(req, res, next) {
        try { res.json(await adminService.getAllTopics()); } catch (e) { next(e); }
    }

    async createTopic(req, res, next) {
        try {
            const { name } = req.body;
            if (!name?.trim()) return res.status(400).json({ message: 'Название темы обязательно' });
            res.json(await adminService.createTopic(name.trim()));
        } catch (e) { next(e); }
    }

    async updateTopic(req, res, next) {
        try {
            const { name } = req.body;
            if (!name?.trim()) return res.status(400).json({ message: 'Название темы обязательно' });
            res.json(await adminService.updateTopic(req.params.id, name.trim()));
        } catch (e) { next(e); }
    }

    async deleteTopic(req, res, next) {
        try { res.json(await adminService.deleteTopic(req.params.id)); } catch (e) { next(e); }
    }
}

module.exports = new AdminController();
