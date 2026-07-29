const { SolutionVote, SolutionComment, User, HistoryChallenges } = require('../../Data/models');
const { Op } = require('sequelize');

class SolutionService {

    // ─── Votes ────────────────────────────────────────────────────────────────

    async vote(solutionId, userId, vote) {
        const solution = await HistoryChallenges.findByPk(solutionId);
        if (!solution) throw Object.assign(new Error('Решение не найдено'), { status: 404 });

        const [row, created] = await SolutionVote.findOrCreate({
            where:    { solutionId, userId },
            defaults: { vote },
        });

        if (!created) {
            if (row.vote === vote) {
                await row.destroy();
                return this._voteSummary(solutionId, userId);
            }
            row.vote = vote;
            await row.save();
        }

        return this._voteSummary(solutionId, userId);
    }

    async removeVote(solutionId, userId) {
        await SolutionVote.destroy({ where: { solutionId, userId } });
        return this._voteSummary(solutionId, userId);
    }

    async getVotes(solutionId, userId) {
        const solution = await HistoryChallenges.findByPk(solutionId);
        if (!solution) throw Object.assign(new Error('Решение не найдено'), { status: 404 });
        return this._voteSummary(solutionId, userId);
    }

    async _voteSummary(solutionId, userId) {
        const all = await SolutionVote.findAll({ where: { solutionId } });
        const likes    = all.filter(v => v.vote === 1).length;
        const dislikes = all.filter(v => v.vote === -1).length;
        const myVote   = userId ? (all.find(v => v.userId === userId)?.vote ?? null) : null;
        return { likes, dislikes, myVote };
    }

    // ─── Comments ─────────────────────────────────────────────────────────────

    async addComment(solutionId, userId, content) {
        const solution = await HistoryChallenges.findByPk(solutionId);
        if (!solution) throw Object.assign(new Error('Решение не найдено'), { status: 404 });
        if (!content?.trim()) throw Object.assign(new Error('Комментарий не может быть пустым'), { status: 400 });

        const comment = await SolutionComment.create({ solutionId, userId, content: content.trim() });
        return this._commentWithAuthor(comment.id);
    }

    async getComments(solutionId, { page = 1, pageSize = 20 } = {}) {
        const solution = await HistoryChallenges.findByPk(solutionId);
        if (!solution) throw Object.assign(new Error('Решение не найдено'), { status: 404 });

        const offset = (page - 1) * pageSize;
        const { count, rows } = await SolutionComment.findAndCountAll({
            where:   { solutionId },
            include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
            order:   [['createdAt', 'ASC']],
            limit:   pageSize,
            offset,
        });

        return { total: count, page, pageSize, comments: rows };
    }

    async deleteComment(commentId, userId) {
        const comment = await SolutionComment.findByPk(commentId);
        if (!comment) throw Object.assign(new Error('Комментарий не найден'), { status: 404 });
        if (comment.userId !== userId) throw Object.assign(new Error('Нет доступа'), { status: 403 });
        await comment.destroy();
    }

    async _commentWithAuthor(commentId) {
        return SolutionComment.findByPk(commentId, {
            include: [{ model: User, as: 'author', attributes: ['id', 'username'] }],
        });
    }
}

module.exports = new SolutionService();
