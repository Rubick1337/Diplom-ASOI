const solutionService = require('../../Application/services/SolutionService');

class SolutionController {

    // POST /api/solutions/:id/votes  { userId, vote: 1|-1 }
    async vote(req, res, next) {
        try {
            const solutionId = Number(req.params.id);
            const { userId, vote } = req.body;
            if (!userId) return res.status(400).json({ message: 'userId обязателен' });
            if (vote !== 1 && vote !== -1) return res.status(400).json({ message: 'vote должен быть 1 или -1' });
            const result = await solutionService.vote(solutionId, Number(userId), vote);
            res.json(result);
        } catch (e) { next(e); }
    }

    // DELETE /api/solutions/:id/votes  { userId }
    async removeVote(req, res, next) {
        try {
            const solutionId = Number(req.params.id);
            const userId = Number(req.body.userId);
            if (!userId) return res.status(400).json({ message: 'userId обязателен' });
            const result = await solutionService.removeVote(solutionId, userId);
            res.json(result);
        } catch (e) { next(e); }
    }

    // GET /api/solutions/:id/votes?userId=...
    async getVotes(req, res, next) {
        try {
            const solutionId = Number(req.params.id);
            const userId = req.query.userId ? Number(req.query.userId) : null;
            const result = await solutionService.getVotes(solutionId, userId);
            res.json(result);
        } catch (e) { next(e); }
    }

    // POST /api/solutions/:id/comments  { userId, content }
    async addComment(req, res, next) {
        try {
            const solutionId = Number(req.params.id);
            const { userId, content } = req.body;
            if (!userId) return res.status(400).json({ message: 'userId обязателен' });
            const comment = await solutionService.addComment(solutionId, Number(userId), content);
            res.status(201).json(comment);
        } catch (e) { next(e); }
    }

    // GET /api/solutions/:id/comments?page=1&pageSize=20
    async getComments(req, res, next) {
        try {
            const solutionId = Number(req.params.id);
            const page     = Number(req.query.page)     || 1;
            const pageSize = Number(req.query.pageSize) || 20;
            const result = await solutionService.getComments(solutionId, { page, pageSize });
            res.json(result);
        } catch (e) { next(e); }
    }

    // DELETE /api/solutions/:id/comments/:commentId  { userId }
    async deleteComment(req, res, next) {
        try {
            const commentId = Number(req.params.commentId);
            const userId    = Number(req.body.userId);
            if (!userId) return res.status(400).json({ message: 'userId обязателен' });
            await solutionService.deleteComment(commentId, userId);
            res.json({ message: 'Комментарий удалён' });
        } catch (e) { next(e); }
    }
}

module.exports = new SolutionController();
