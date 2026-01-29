const ChallengeService = require('../../Application/services/ChallengeService');
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
        } catch (e) {
            next(e);
        }
    }

    async execute(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { code, language } = req.body;

            if (!code || !language) {
                return res.status(400).json({ message: 'Code and language are required' });
            }

            const results = await challengeService.executeChallenge(id, code, language);
            return res.json(results);
        } catch (e) {
            next(e);
        }
    }

    async create(req, res, next) {
        try {
            const userId = req.user?.id ?? null;
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
}

module.exports = new ChallengeController();