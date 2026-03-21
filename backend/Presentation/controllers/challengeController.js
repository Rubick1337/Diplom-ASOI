const ChallengeService = require('../../Application/services/ChallengeService');
const aiService = require('../../Application/services/AIService');
const challengeService = new ChallengeService();

class ChallengeController {

    async format(req, res, next) {
        try {
            const { code, language } = req.body;
            if (!code || !language) {
                return res.status(400).json({ message: 'Code and language are required' });
            }
            const formattedCode = await challengeService.formatCode(code, language);
            return res.json({ formattedCode });
        } catch (e) { next(e); }
    }

    async verify(req, res, next) {
        try {
            const { funcName, timeLimitMs, testCases, code, language, parameters } = req.body;
            if (!code || !language || !funcName || !testCases) {
                return res.status(400).json({ message: 'funcName, testCases, code and language are required' });
            }
            const result = await challengeService.verifyChallenge({ funcName, timeLimitMs, testCases, parameters: parameters || [] }, code, language);
            return res.json(result);
        } catch (e) { next(e); }
    }

    async execute(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { code, language, userId } = req.body;
            if (!code || !language) {
                return res.status(400).json({ message: 'Code and language are required' });
            }
            const results = await challengeService.executeChallenge(id, code, language, userId);
            return res.json(results);
        } catch (e) { next(e); }
    }

    async getHistory(req, res, next) {
        try {
            const challengeId = Number(req.params.id);
            const userId = Number(req.query.userId);
            if (!userId) return res.status(400).json({ message: 'userId is required' });
            const history = await challengeService.getUserSubmissionHistory(userId, challengeId);
            res.json(history);
        } catch (e) { next(e); }
    }

    async getSolutions(req, res, next) {
        try {
            const challengeId = Number(req.params.id);
            const userId = Number(req.query.userId);
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 10;
            const language = req.query.language;
            const sort = req.query.sort || 'newest';
            if (!userId) return res.status(400).json({ message: 'userId is required' });
            const solutions = await challengeService.getCommunitySolutions(challengeId, userId, {
                page,
                pageSize,
                language,
                sort
            });
            res.json(solutions);
        } catch (e) { next(e); }
    }

    async createReview(req, res, next) {
        try {
            const challengeId = Number(req.params.id);
            const { content, rating, userId } = req.body;
            if (!userId) return res.status(400).json({ message: 'userId is required' });
            const review = await challengeService.leaveReview(userId, challengeId, content, rating);
            res.status(201).json(review);
        } catch (e) { next(e); }
    }

    async getReviews(req, res, next) {
        try {
            const challengeId = Number(req.params.id);
            const data = await challengeService.getChallengeReviews(challengeId, req.query);
            res.json(data);
        } catch (e) { next(e); }
    }

    async create(req, res, next) {
        try {
            const { userId } = req.body;
            const challenge = await challengeService.createChallenge(req.body, userId);
            res.status(201).json(challenge);
        } catch (e) { next(e); }
    }

    async getOne(req, res, next) {
        try {
            const challenge = await challengeService.getChallengeById(Number(req.params.id));
            res.json(challenge);
        } catch (e) { next(e); }
    }

    async getAll(req, res, next) {
        try {
            const result = await challengeService.getAllChallenges(req.query);
            res.json(result);
        } catch (e) { next(e); }
    }

    async update(req, res, next) {
        try {
            const updated = await challengeService.updateChallenge(Number(req.params.id), req.body);
            res.json(updated);
        } catch (e) { next(e); }
    }

    async delete(req, res, next) {
        try {
            await challengeService.deleteChallenge(Number(req.params.id));
            res.json({ message: 'Deleted' });
        } catch (e) { next(e); }
    }
    async createTopic(req, res, next) {
        try {
            const { name } = req.body;
            if (!name || !name.trim()) return res.status(400).json({ message: 'name is required' });
            const topic = await challengeService.createTopic(name.trim());
            res.json(topic);
        } catch (e) { next(e); }
    }

    async getTopics(req, res) {
        try {
            const topics = await challengeService.getTopics();
            console.log("dasdasdasda"+ topics);
            res.json(topics);
        } catch (err) {
            console.error('getTopics error:', err);
            res.status(500).json({ message: err.message });
        }
    }

    async getReportReasons(req, res, next) {
        try {
            const reasons = await challengeService.getReportReasons();
            res.json(reasons);
        } catch (e) { next(e); }
    }

    async createReport(req, res, next) {
        try {
            const challengeId = Number(req.params.id);
            const { userId, reasonId, reasonText } = req.body;
            if (!userId) return res.status(400).json({ message: 'userId is required' });
            const report = await challengeService.reportChallenge(userId, challengeId, reasonId, reasonText);
            res.status(201).json(report);
        } catch (e) { next(e); }
    }

    async aiAnalyze(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { code, language, testResults, isSolved } = req.body;
            if (!code || !language) {
                return res.status(400).json({ message: 'code and language are required' });
            }
            const challenge = await challengeService.getChallengeById(id);
            if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

            const analysis = await aiService.analyzeCode({
                code,
                language,
                challengeTitle: challenge.name,
                challengeDescription: challenge.description,
                testResults: testResults || [],
                isSolved: !!isSolved,
            });
            res.json({ analysis });
        } catch (e) { console.error('[AI analyze]', e.message); next(e); }
    }

    async aiGenerateChallenge(req, res, next) {
        try {
            const { prompt } = req.body;
            if (!prompt || !prompt.trim()) {
                return res.status(400).json({ message: 'prompt is required' });
            }
            const challenge = await aiService.generateChallenge(prompt.trim());
            res.json(challenge);
        } catch (e) {
            console.error('[AI generate]', e.message);
            next(e);
        }
    }

    async aiChat(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { message, code, language, history } = req.body;
            if (!message || !code || !language) {
                return res.status(400).json({ message: 'message, code and language are required' });
            }
            const challenge = await challengeService.getChallengeById(id);
            if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

            const reply = await aiService.chat({
                message,
                code,
                language,
                challengeTitle: challenge.name,
                challengeDescription: challenge.description,
                history: history || [],
            });
            res.json({ reply });
        } catch (e) { next(e); }
    }
}

module.exports = new ChallengeController();
