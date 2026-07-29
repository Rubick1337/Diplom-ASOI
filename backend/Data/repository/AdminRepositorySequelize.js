const { Op, fn, col, literal } = require('sequelize');
const IAdminRepository = require('../../Domain/repository/IAdminRepository');
const {
    User: UserModel,
    Challenge: ChallengeModel,
    HistoryChallenges: HistoryModel,
    Review: ReviewModel,
    Report: ReportModel,
    ReportReason: ReportReasonModel,
    Topic: TopicModel,
    ChallengeTopic: ChallengeTopicModel,
    Notification: NotificationModel,
    Test: TestModel,
    TestAttempt: TestAttemptModel,
    ChallengeParameter: ChallengeParameterModel,
    ChallengeTestCase: ChallengeTestCaseModel,
    TestCaseArgument: TestCaseArgumentModel,
} = require('../models');

class AdminRepositorySequelize extends IAdminRepository {

    async getOverview() {
        const [
            totalUsers,
            totalChallenges,
            totalSubmissions,
            successCount,
            avgRatingRow,
            pendingReports,
        ] = await Promise.all([
            UserModel.count(),
            ChallengeModel.count({ where: { isHidden: false } }),
            HistoryModel.count(),
            HistoryModel.count({ where: { status: 'success' } }),
            ReviewModel.findOne({
                attributes: [[fn('AVG', col('rating')), 'avg']],
                raw: true,
            }),
            ReportModel.count({ where: { status: 'Pending' } }),
        ]);

        const successRate = totalSubmissions > 0
            ? Math.round((successCount / totalSubmissions) * 1000) / 10
            : 0;

        return {
            totalUsers,
            totalChallenges,
            totalSubmissions,
            successRate,
            avgRating: Math.round((parseFloat(avgRatingRow?.avg) || 0) * 100) / 100,
            pendingReports,
        };
    }

    async getActivity(from, to) {
        const rows = await HistoryModel.findAll({
            attributes: [
                [fn('DATE', col('createdAt')), 'date'],
                [fn('COUNT', col('id')), 'submissions'],
                [fn('SUM', literal(`CASE WHEN status = 'success' THEN 1 ELSE 0 END`)), 'successes'],
                [fn('SUM', literal(`CASE WHEN status = 'fail' THEN 1 ELSE 0 END`)), 'failures'],
            ],
            where: {
                createdAt: { [Op.between]: [new Date(from), new Date(to)] },
            },
            group: [fn('DATE', col('createdAt'))],
            order: [[fn('DATE', col('createdAt')), 'ASC']],
            raw: true,
        });

        return rows.map(r => ({
            date: r.date,
            submissions: Number(r.submissions),
            successes: Number(r.successes),
            failures: Number(r.failures),
        }));
    }

    async getChallengesByTopic() {
        const rows = await TopicModel.findAll({
            attributes: [
                'id',
                'name',
                [fn('COUNT', fn('DISTINCT', col('challenges.id'))), 'total'],
                [fn('COUNT', col('challenges->submissions.id')), 'submissions'],
                [
                    fn('SUM', literal(`CASE WHEN "challenges->submissions"."status" = 'success' THEN 1 ELSE 0 END`)),
                    'successes'
                ],
            ],
            include: [
                {
                    model: ChallengeModel,
                    as: 'challenges',
                    attributes: [],
                    through: { attributes: [] },
                    where: { isHidden: false },
                    required: false,
                    include: [{
                        model: HistoryModel,
                        as: 'submissions',
                        attributes: [],
                        required: false,
                    }],
                },
            ],
            group: ['Topic.id', 'Topic.name'],
            order: [[fn('COUNT', col('challenges->submissions.id')), 'DESC']],
            raw: true,
            nest: true,
            subQuery: false,
        });

        return rows.map(r => ({
            topic: r.name || 'Без темы',
            total: Number(r.total),
            submissions: Number(r.submissions),
            successes: Number(r.successes),
        }));
    }

    async getChallengesByDifficulty() {
        const rows = await ChallengeModel.findAll({
            attributes: [
                'difficulty',
                [fn('COUNT', col('Challenge.id')), 'total'],
                [fn('COUNT', col('submissions.id')), 'submissions'],
            ],
            include: [
                {
                    model: HistoryModel,
                    as: 'submissions',
                    attributes: [],
                    required: false,
                },
            ],
            where: { isHidden: false },
            group: ['Challenge.difficulty'],
            order: [['difficulty', 'ASC']],
            raw: true,
        });

        return rows.map(r => ({
            difficulty: Number(r.difficulty),
            total: Number(r.total),
            submissions: Number(r.submissions),
        }));
    }

    async getSubmissionsByLanguage() {
        const rows = await HistoryModel.findAll({
            attributes: [
                'language',
                [fn('COUNT', col('id')), 'total'],
            ],
            group: ['language'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            raw: true,
        });

        return rows.map(r => ({
            language: r.language,
            total: Number(r.total),
        }));
    }

    async getLowestRatedChallenges(limit = 10) {
        const rows = await ChallengeModel.findAll({
            attributes: [
                'name',
                [fn('COUNT', col('reviews.id')), 'reviewCount'],
                [literal(`ROUND(AVG("reviews"."rating")::numeric, 1)`), 'avgRating'],
            ],
            include: [{
                model: ReviewModel,
                as: 'reviews',
                attributes: [],
                required: true,
            }],
            where: { isHidden: false },
            group: ['Challenge.id', 'Challenge.name'],
            having: literal('COUNT("reviews"."id") >= 1'),
            order: [[literal(`AVG("reviews"."rating")`), 'ASC']],
            limit,
            subQuery: false,
            raw: true,
        });

        return rows.map(r => ({
            name: r.name,
            reviewCount: Number(r.reviewCount),
            avgRating: parseFloat(r.avgRating) || 0,
        }));
    }

    async getTopUsers(limit = 10) {
        const rows = await UserModel.findAll({
            attributes: [
                'id',
                'username',
                'experience',
                'rating',
                [fn('COUNT', col('submissions.id')), 'submissions'],
                [fn('SUM', literal(`CASE WHEN "submissions"."status" = 'success' THEN 1 ELSE 0 END`)), 'solved'],
                [fn('COUNT', fn('DISTINCT', col('submissions.challengeId'))), 'uniqueSolved'],
            ],
            include: [{
                model: HistoryModel,
                as: 'submissions',
                attributes: [],
                required: false,
            }],
            group: ['User.id', 'User.username', 'User.experience', 'User.rating'],
            order: [[
                literal(`COALESCE(SUM(CASE WHEN "submissions"."status" = 'success' THEN 1 ELSE 0 END), 0)`),
                'DESC',
            ]],
            limit: Number(limit),
            subQuery: false,
            raw: true,
        });

        return rows.map((r, i) => {
            const submissions = Number(r.submissions);
            const solved = Number(r.solved);
            return {
                rank: i + 1,
                id: r.id,
                username: r.username,
                experience: Number(r.experience),
                rating: Number(r.rating),
                submissions,
                solved,
                uniqueSolved: Number(r.uniqueSolved),
                successRate: submissions > 0
                    ? Math.round((solved / submissions) * 1000) / 10
                    : 0,
            };
        });
    }

    async getLeaderboard({ page = 1, limit = 20, search = '', sortBy = 'solved', sortDir = 'DESC' } = {}) {
        const VALID_SORTS = new Set(['solved', 'uniqueSolved', 'submissions', 'rating', 'experience']);
        const safeSortBy  = VALID_SORTS.has(sortBy) ? sortBy : 'solved';
        const safeDir     = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const offset      = (Number(page) - 1) * Number(limit);

        const where = search ? { username: { [Op.iLike]: `%${search}%` } } : {};

        const solvedExpr      = literal(`COALESCE(SUM(CASE WHEN "submissions"."status" = 'success' THEN 1 ELSE 0 END), 0)`);
        const uniqueSolvedExpr = literal(`COUNT(DISTINCT "submissions"."challengeId")`);
        const submissionsExpr  = literal(`COUNT("submissions"."id")`);
        const successRateExpr  = literal(`CASE WHEN COUNT("submissions"."id") > 0 THEN ROUND(SUM(CASE WHEN "submissions"."status" = 'success' THEN 1 ELSE 0 END) * 1000.0 / COUNT("submissions"."id")) / 10 ELSE 0 END`);

        const orderMap = {
            solved:       [solvedExpr, safeDir],
            uniqueSolved: [uniqueSolvedExpr, safeDir],
            submissions:  [submissionsExpr, safeDir],
            rating:       [col('User.rating'), safeDir],
            experience:   [col('User.experience'), safeDir],
        };

        const [rows, total] = await Promise.all([
            UserModel.findAll({
                attributes: [
                    'id', 'username', 'experience', 'rating',
                    [submissionsExpr,  'submissions'],
                    [solvedExpr,       'solved'],
                    [uniqueSolvedExpr, 'uniqueSolved'],
                    [successRateExpr,  'successRate'],
                ],
                include: [{ model: HistoryModel, as: 'submissions', attributes: [], required: false }],
                where,
                group: ['User.id', 'User.username', 'User.experience', 'User.rating'],
                order: [orderMap[safeSortBy]],
                limit: Number(limit),
                offset,
                subQuery: false,
                raw: true,
            }),
            UserModel.count({ where }),
        ]);

        return {
            total,
            page: Number(page),
            limit: Number(limit),
            rows: rows.map((r, i) => ({
                rank:        offset + i + 1,
                id:          r.id,
                username:    r.username,
                experience:  Number(r.experience),
                rating:      Number(r.rating),
                submissions: Number(r.submissions),
                solved:      Number(r.solved),
                uniqueSolved: Number(r.uniqueSolved),
                successRate: Number(r.successRate),
            })),
        };
    }

    async getReportsByStatus() {
        const rows = await ReportModel.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'total'],
            ],
            group: ['status'],
            raw: true,
        });

        return rows.map(r => ({
            status: r.status,
            total: Number(r.total),
        }));
    }

    async getReportsByReason() {
        const rows = await ReportModel.findAll({
            attributes: [
                [fn('COUNT', col('Report.id')), 'total'],
                [literal('COALESCE("reason"."name", \'Иное\')'), 'reasonName'],
            ],
            include: [{
                model: ReportReasonModel,
                as: 'reason',
                attributes: [],
                required: false,
            }],
            group: [literal('"reason"."id"'), literal('"reason"."name"')],
            order: [[fn('COUNT', col('Report.id')), 'DESC']],
            limit: 10,
            subQuery: false,
            raw: true,
        });

        return rows.map(r => ({
            reason: r.reasonName || 'Иное',
            total: Number(r.total),
        }));
    }

    async getReportReasons() {
        return await ReportReasonModel.findAll({ order: [['id', 'ASC']], raw: true });
    }

    async getRecentReports({ page = 1, limit = 15, status, challenge, reporter, dateFrom, dateTo } = {}) {
        const where = {};
        if (status)  where.status = status;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
            if (dateTo)   where.createdAt[Op.lte] = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
        }

        const reporterInclude  = { model: UserModel,         as: 'reporter',  attributes: ['username'], required: false };
        const challengeInclude = { model: ChallengeModel,    as: 'challenge', attributes: ['name'],     required: false };
        const reasonInclude    = { model: ReportReasonModel, as: 'reason',    attributes: ['name'],     required: false };
        const resolverInclude  = { model: UserModel,         as: 'resolver',  attributes: ['username'], required: false };

        if (reporter)  { reporterInclude.where  = { username: { [Op.iLike]: `%${reporter}%`  } }; reporterInclude.required  = true; }
        if (challenge) { challengeInclude.where = { name:     { [Op.iLike]: `%${challenge}%` } }; challengeInclude.required = true; }

        const { count, rows } = await ReportModel.findAndCountAll({
            where,
            include: [reporterInclude, challengeInclude, reasonInclude, resolverInclude],
            order: [['createdAt', 'DESC']],
            limit:  Number(limit),
            offset: (Number(page) - 1) * Number(limit),
            distinct: true,
        });

        return {
            total: count,
            page:  Number(page),
            limit: Number(limit),
            rows: rows.map(r => ({
                id:          r.id,
                challengeId: r.challengeId,
                reason:      r.reason?.name || 'Иное',
                reasonText:  r.reasonText,
                status:      r.status,
                createdAt:   r.createdAt,
                reporter:    r.reporter?.username || '—',
                challenge:   r.challenge?.name    || '—',
                resolvedBy:  r.resolver?.username || null,
                resolvedAt:  r.resolvedAt || null,
            })),
        };
    }

    async getActivityHeatmap() {
        const [rows, earliest] = await Promise.all([
            HistoryModel.findAll({
                attributes: [
                    [literal('EXTRACT(DOW FROM "HistoryChallenges"."createdAt")'), 'day'],
                    [literal('EXTRACT(HOUR FROM "HistoryChallenges"."createdAt")'), 'hour'],
                    [fn('COUNT', col('id')), 'count'],
                ],
                group: [
                    literal('EXTRACT(DOW FROM "HistoryChallenges"."createdAt")'),
                    literal('EXTRACT(HOUR FROM "HistoryChallenges"."createdAt")'),
                ],
                order: [
                    [literal('EXTRACT(DOW FROM "HistoryChallenges"."createdAt")'), 'ASC'],
                    [literal('EXTRACT(HOUR FROM "HistoryChallenges"."createdAt")'), 'ASC'],
                ],
                raw: true,
            }),
            HistoryModel.min('createdAt'),
        ]);

        const totalWeeks = earliest
            ? Math.max(1, Math.ceil((Date.now() - new Date(earliest)) / (7 * 24 * 60 * 60 * 1000)))
            : 1;

        return rows.map(r => ({
            day: Number(r.day),
            hour: Number(r.hour),

            count: Math.round((Number(r.count) / totalWeeks) * 10) / 10,
        }));
    }

    async getChallengeFunnel() {
        const [total, withAttempts, withSuccess, firstTryRows] = await Promise.all([
            ChallengeModel.count({ where: { isHidden: false } }),
            HistoryModel.count({ distinct: true, col: 'challengeId' }),
            HistoryModel.count({ distinct: true, col: 'challengeId', where: { status: 'success' } }),
            HistoryModel.findAll({
                attributes: ['userId', 'challengeId'],
                group: ['userId', 'challengeId'],
                having: literal(
                    `COUNT(id) = 1 AND SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) = 1`
                ),
                raw: true,
            }),
        ]);

        return [
            { stage: 'Опубликовано',     value: total },
            { stage: 'Есть попытки',     value: withAttempts },
            { stage: 'Решено хоть раз',  value: withSuccess },
            { stage: 'С первой попытки', value: firstTryRows.length },
        ];
    }

    async updateReportStatus(id, status, adminId) {
        const report = await ReportModel.findByPk(id, {
            include: [
                { model: ChallengeModel, as: 'challenge', attributes: ['name'], required: false },
            ],
        });
        if (!report) throw new Error('Report not found');
        await report.update({ status, resolvedById: adminId || null, resolvedAt: new Date() });
        let resolvedBy = null;
        if (adminId) {
            const admin = await UserModel.findByPk(adminId, { attributes: ['username'] });
            resolvedBy = admin?.username || null;
        }
        return {
            id:            report.id,
            status:        report.status,
            resolvedBy,
            resolvedAt:    report.resolvedAt,
            userId:        report.userId,
            challengeName: report.challenge?.name || 'задачу',
        };
    }

    async getChallengesManage({ page = 1, limit = 20, search, topicId } = {}) {
        const where = {};
        if (search) where.name = { [Op.iLike]: `%${search}%` };

        const topicInclude = {
            model: TopicModel,
            as: 'topics',
            attributes: ['id', 'name'],
            through: { attributes: [] },
            required: false,
            ...(topicId ? { where: { id: topicId }, required: true } : {}),
        };

        const { count, rows } = await ChallengeModel.findAndCountAll({
            where,
            include: [
                topicInclude,
                { model: UserModel, as: 'author', attributes: ['username'], required: false },
            ],
            attributes: ['id', 'name', 'difficulty', 'mode', 'isHidden', 'funcName'],
            order: [['id', 'DESC']],
            limit:  Number(limit),
            offset: (Number(page) - 1) * Number(limit),
            distinct: true,
        });

        return {
            total: count,
            page:  Number(page),
            limit: Number(limit),
            rows: rows.map(r => ({
                id:         r.id,
                name:       r.name,
                topics:     (r.topics || []).map(t => ({ id: t.id, name: t.name })),
                difficulty: r.difficulty,
                mode:       r.mode,
                isHidden:   r.isHidden,
                author:     r.author?.username || '—',
                funcName:   r.funcName,
            })),
        };
    }

    async updateChallengeAdmin(id, { name, topicIds, difficulty, isHidden } = {}) {
        const challenge = await ChallengeModel.findByPk(id);
        if (!challenge) throw new Error('Challenge not found');
        const updates = {};
        if (name       !== undefined) updates.name       = name;
        if (difficulty !== undefined) updates.difficulty = difficulty;
        if (isHidden   !== undefined) updates.isHidden   = isHidden;
        if (Object.keys(updates).length > 0) await challenge.update(updates);

        if (Array.isArray(topicIds)) {
            await ChallengeTopicModel.destroy({ where: { challengeId: id } });
            if (topicIds.length > 0) {
                await ChallengeTopicModel.bulkCreate(
                    topicIds.map(tid => ({ challengeId: id, topicId: tid })),
                    { ignoreDuplicates: true }
                );
            }
        }

        const updated = await ChallengeModel.findByPk(id, {
            include: [
                { model: TopicModel, as: 'topics', attributes: ['id', 'name'], through: { attributes: [] } },
                { model: UserModel,  as: 'author',  attributes: ['username'], required: false },
            ],
            attributes: ['id', 'name', 'difficulty', 'mode', 'isHidden', 'funcName'],
        });
        return {
            id:         updated.id,
            name:       updated.name,
            topics:     (updated.topics || []).map(t => ({ id: t.id, name: t.name })),
            difficulty: updated.difficulty,
            mode:       updated.mode,
            isHidden:   updated.isHidden,
            author:     updated.author?.username || '—',
            funcName:   updated.funcName,
        };
    }

    async toggleChallengeHidden(id, isHidden) {
        const challenge = await ChallengeModel.findByPk(id);
        if (!challenge) throw new Error('Challenge not found');
        await challenge.update({ isHidden });
        return { id: challenge.id, isHidden: challenge.isHidden };
    }

    async deleteChallengeAdmin(id) {
        const challenge = await ChallengeModel.findByPk(id);
        if (!challenge) throw new Error('Challenge not found');
        await challenge.destroy();
        return { success: true };
    }

    async getAllTopics() {
        return await TopicModel.findAll({ order: [['name', 'ASC']], raw: true });
    }

    async createTopic(name) {
        const existing = await TopicModel.findOne({ where: { name } });
        if (existing) throw new Error('Тема с таким названием уже существует');
        const topic = await TopicModel.create({ name });
        return topic.get({ plain: true });
    }

    async updateTopic(id, name) {
        const topic = await TopicModel.findByPk(id);
        if (!topic) throw new Error('Topic not found');
        const dup = await TopicModel.findOne({ where: { name, id: { [Op.ne]: id } } });
        if (dup) throw new Error('Тема с таким названием уже существует');
        await topic.update({ name });
        return topic.get({ plain: true });
    }

    async deleteTopic(id) {
        const topic = await TopicModel.findByPk(id);
        if (!topic) throw new Error('Topic not found');
        const usedBy = await ChallengeTopicModel.count({ where: { topicId: id } });
        if (usedBy > 0) throw new Error(`Невозможно удалить: ${usedBy} задач(и) используют эту тему`);
        await topic.destroy();
        return { success: true };
    }

    async getChallengeDetail(challengeId) {
        const challenge = await ChallengeModel.findByPk(challengeId, {
            attributes: ['id', 'name', 'difficulty', 'createdByUserId'],
            include: [{ model: UserModel, as: 'author', attributes: ['id', 'username'] }],
        });
        if (!challenge) throw new Error('Challenge not found');
        return {
            id:             challenge.id,
            name:           challenge.name,
            difficulty:     challenge.difficulty,
            authorId:       challenge.createdByUserId,
            authorUsername: challenge.author?.username || '—',
        };
    }

    async updateChallengeDifficulty(challengeId, difficulty) {
        const d = parseInt(difficulty, 10);
        if (d < 1 || d > 10) throw new Error('Сложность должна быть от 1 до 10');
        const challenge = await ChallengeModel.findByPk(challengeId);
        if (!challenge) throw new Error('Challenge not found');
        await challenge.update({ difficulty: d });
        return { id: challenge.id, difficulty: challenge.difficulty };
    }

    async createNotification(userId, { title, message, type = 'admin', challengeId = null }) {
        const notif = await NotificationModel.create({ userId, title, message, type, challengeId });
        return notif.get({ plain: true });
    }

    async getUserNotifications(userId) {
        return await NotificationModel.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 50,
            raw: true,
        });
    }

    async markNotificationRead(id, userId) {
        const notif = await NotificationModel.findOne({ where: { id, userId } });
        if (!notif) throw new Error('Notification not found');
        await notif.update({ isRead: true });
        return { id: notif.id, isRead: true };
    }

    async getUserDistributions(ratingBucket = 50, expBucket = 100) {
        const rb = Math.max(1, parseInt(ratingBucket, 10));
        const eb = Math.max(1, parseInt(expBucket, 10));
        const [ratingRows, expRows] = await Promise.all([
            UserModel.findAll({
                attributes: [
                    [literal(`FLOOR(rating / ${rb}) * ${rb}`), 'bucket'],
                    [fn('COUNT', col('id')), 'count'],
                ],
                group: [literal(`FLOOR(rating / ${rb}) * ${rb}`)],
                order: [[literal(`FLOOR(rating / ${rb}) * ${rb}`), 'ASC']],
                raw: true,
            }),
            UserModel.findAll({
                attributes: [
                    [literal(`FLOOR(experience / ${eb}) * ${eb}`), 'bucket'],
                    [fn('COUNT', col('id')), 'count'],
                ],
                group: [literal(`FLOOR(experience / ${eb}) * ${eb}`)],
                order: [[literal(`FLOOR(experience / ${eb}) * ${eb}`), 'ASC']],
                raw: true,
            }),
        ]);

        return {
            rating: ratingRows.map(r => ({
                label: `${Number(r.bucket)}–${Number(r.bucket) + rb - 1}`,
                count: Number(r.count),
            })),
            experience: expRows.map(r => ({
                label: `${Number(r.bucket)}–${Number(r.bucket) + eb - 1}`,
                count: Number(r.count),
            })),
        };
    }

    async getTestStats() {
        const [
            totalTests,
            publishedTests,
            totalAttempts,
            completedAttempts,
        ] = await Promise.all([
            TestModel.count(),
            TestModel.count({ where: { isPublished: true } }),
            TestAttemptModel.count({ where: { status: { [Op.ne]: 'active' } } }),
            TestAttemptModel.count({ where: { status: 'completed' } }),
        ]);

        const avgRow = await TestAttemptModel.findOne({
            attributes: [[
                literal(`ROUND(AVG(CASE WHEN "maxScore" > 0 THEN "score" * 100.0 / "maxScore" ELSE 0 END)::numeric, 1)`),
                'avgPct',
            ]],
            where: { status: { [Op.ne]: 'active' }, score: { [Op.ne]: null } },
            raw: true,
        });
        const avgScore = parseFloat(avgRow?.avgPct) || 0;

        const byStatusRows = await TestAttemptModel.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'total'],
            ],
            group: ['status'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            raw: true,
        });

        const byTopicRows = await TopicModel.findAll({
            attributes: [
                'id',
                'name',
                [fn('COUNT', fn('DISTINCT', col('testsInTopic.id'))), 'totalTests'],
                [fn('COUNT', col('testsInTopic->attempts.id')), 'totalAttempts'],
                [
                    literal(`ROUND(AVG(CASE WHEN "testsInTopic->attempts"."maxScore" > 0 THEN "testsInTopic->attempts"."score" * 100.0 / "testsInTopic->attempts"."maxScore" ELSE NULL END)::numeric, 1)`),
                    'avgPct',
                ],
            ],
            include: [{
                model: TestModel,
                as: 'testsInTopic',
                attributes: [],
                required: false,
                where: { isPublished: true },
                include: [{
                    model: TestAttemptModel,
                    as: 'attempts',
                    attributes: [],
                    required: false,
                    where: { status: { [Op.ne]: 'active' }, score: { [Op.ne]: null } },
                }],
            }],
            group: ['Topic.id', 'Topic.name'],
            order: [[fn('COUNT', col('testsInTopic->attempts.id')), 'DESC']],
            raw: true,
            subQuery: false,
        });

        const lowestRatedRows = await TestModel.findAll({
            attributes: [
                'id',
                'title',
                [fn('COUNT', col('reviews.id')), 'reviewCount'],
                [literal(`ROUND(AVG("reviews"."rating")::numeric, 1)`), 'avgRating'],
            ],
            include: [{
                model: ReviewModel,
                as: 'reviews',
                attributes: [],
                required: true,
            }],
            where: { isPublished: true },
            group: ['Test.id', 'Test.title'],
            having: literal('COUNT("reviews"."id") >= 1'),
            order: [[literal(`AVG("reviews"."rating")`), 'ASC']],
            limit: 10,
            subQuery: false,
            raw: true,
        });

        return {
            totalTests,
            publishedTests,
            totalAttempts,
            completedAttempts,
            avgScore,
            byStatus: byStatusRows.map(r => ({ status: r.status, total: Number(r.total) })),
            byTopic: byTopicRows.map(r => ({
                topic: r.name || 'Без темы',
                totalTests: Number(r.totalTests),
                totalAttempts: Number(r.totalAttempts),
                avgPct: parseFloat(r.avgPct) || 0,
            })),
            lowestRated: lowestRatedRows.map(r => ({
                id: r.id,
                title: r.title,
                reviewCount: Number(r.reviewCount),
                avgRating: parseFloat(r.avgRating) || 0,
            })),
        };
    }
    async getChallengesForExport(ids) {
        const rows = await ChallengeModel.findAll({
            where: { id: ids },
            include: [
                { model: ChallengeParameterModel, as: 'parameters' },
                {
                    model: ChallengeTestCaseModel,
                    as: 'testCases',
                    include: [{ model: TestCaseArgumentModel, as: 'testArgs' }],
                },
                { model: TopicModel, as: 'topics', attributes: ['id', 'name'], through: { attributes: [] } },
            ],
        });

        return rows.map(r => {
            const d = r.toJSON();
            return {
                name:        d.name,
                description: d.description,
                difficulty:  d.difficulty,
                mode:        d.mode,
                funcName:    d.funcName,
                timeLimitMs: d.timeLimitMs,
                sampleInput: d.sampleInput,
                sampleOutput:d.sampleOutput,
                isHidden:    d.isHidden,
                topics:      (d.topics || []).map(t => t.name),
                parameters:  (d.parameters || []).map(p => ({ name: p.name, dataType: p.dataType, order: p.order })),
                testCases:   (d.testCases || []).map(tc => ({
                    title:          tc.title,
                    expectedOutput: tc.expectedOutput,
                    testArgs:       (tc.testArgs || []).map(a => ({ value: a.value, order: a.order })),
                })),
            };
        });
    }
}

module.exports = AdminRepositorySequelize;
