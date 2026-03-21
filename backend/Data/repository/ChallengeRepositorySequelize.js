const { Op } = require('sequelize');
const sequelize = require('../config/dbConfig');
const IChallengeRepository = require('../../Domain/repository/IChallengeRepository');
const ChallengeEntity = require('../../Domain/entities/Challenge');
const ChallengeParameterEntity = require('../../Domain/entities/ChallengeParameter');
const ChallengeTestCaseEntity = require('../../Domain/entities/ChallengeTestCase');
const TestCaseArgumentEntity = require('../../Domain/entities/TestCaseArgument');

const {
    Challenge: ChallengeModel,
    ChallengeTestCase: ChallengeTestCaseModel,
    ChallengeParameter: ChallengeParameterModel,
    TestCaseArgument: TestCaseArgumentModel,
    User: UserModel,
    Topic: TopicModel,
    ChallengeTopic: ChallengeTopicModel,
    HistoryChallenges: HistoryChallengesModel,
    ReviewChallenges: ReviewChallengesModel
} = require('../models');

class ChallengeRepositorySequelize extends IChallengeRepository {

    mapChallengeRow(row) {
        if (!row) return null;
        const data = row.toJSON ? row.toJSON() : row;

        const parameters = (data.parameters || []).map(p => new ChallengeParameterEntity({
            id: p.id,
            challengeId: p.challengeId,
            name: p.name,
            dataType: p.dataType,
            order: p.order
        }));

        const testCases = (data.testCases || []).map(tc => new ChallengeTestCaseEntity({
            id: tc.id,
            challengeId: tc.challengeId,
            title: tc.title,
            expectedOutput: tc.expectedOutput,
            testArgs: (tc.testArgs || []).map(arg => new TestCaseArgumentEntity({
                id: arg.id,
                testCaseId: arg.testCaseId,
                value: arg.value,
                order: arg.order
            }))
        }));

        const challenge = new ChallengeEntity({
            id: data.id,
            name: data.name,
            description: data.description,
            topics: (data.topics || []).map(t => ({ id: t.id, name: t.name })),
            difficulty: data.difficulty,
            mode: data.mode,
            funcName: data.funcName,
            timeLimitMs: data.timeLimitMs,
            createdByUserId: data.createdByUserId,
            sampleInput: data.sampleInput,
            sampleOutput: data.sampleOutput,
            isHidden: data.isHidden,
            solvedCount: data.solvedCount,
            averageRating: data.averageRating,
            parameters,
            testCases
        });

        if (data.solvedCount !== undefined) challenge.solvedCount = Number(data.solvedCount);
        if (data.averageRating !== undefined) challenge.averageRating = Number(data.averageRating);

        if (data.author) {
            challenge.author = {
                id: data.author.id,
                username: data.author.username,
            };
        }

        return challenge;
    }

    get defaultInclude() {
        return [
            { model: ChallengeParameterModel, as: 'parameters' },
            {
                model: ChallengeTestCaseModel,
                as: 'testCases',
                include: [{ model: TestCaseArgumentModel, as: 'testArgs' }]
            },
            { model: UserModel,  as: 'author', attributes: ['id', 'username', 'email'] },
            { model: TopicModel, as: 'topics', attributes: ['id', 'name'], through: { attributes: [] } },
        ];
    }

    buildWhere(filter = {}) {
        const where = {};
        if (filter.id !== undefined) where.id = filter.id;
        if (filter.difficulty) where.difficulty = filter.difficulty;
        if (filter.showHidden === undefined || filter.showHidden === false) {
            where.isHidden = false;
        }
        if (filter.nameLike) where.name = { [Op.iLike]: `%${filter.nameLike}%` };
        if (filter.createdByUserId !== undefined) where.createdByUserId = filter.createdByUserId;
        if (filter.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${filter.search}%` } },
                { description: { [Op.iLike]: `%${filter.search}%` } },
            ];
        }
        return where;
    }

    async findByIdWithTestCases(id) {
        const row = await ChallengeModel.scope('withStats').findOne({
            where: this.buildWhere({ id, showHidden: true }),
            include: this.defaultInclude
        });
        return this.mapChallengeRow(row);
    }

    async findManyWithTestCases(filter = {}, options = {}) {
        const { page = 1, pageSize = 6, orderBy = 'id', orderDirection = 'ASC' } = options;
        const where = this.buildWhere(filter);
        const offset = (page - 1) * pageSize;

        let orderClause;
        if (['solvedCount', 'averageRating'].includes(orderBy)) {
            orderClause = [[sequelize.literal(`"${orderBy}"`), orderDirection]];
        } else {
            orderClause = [[orderBy, orderDirection]];
        }

        const topicInclude = {
            model: TopicModel,
            as: 'topics',
            attributes: ['id', 'name'],
            through: { attributes: [] },
            ...(filter.topicId ? { where: { id: filter.topicId }, required: true } : { required: false }),
        };

        const { rows, count } = await ChallengeModel.scope('withStats').findAndCountAll({
            where,
            limit: pageSize,
            offset,
            order: orderClause,
            include: [
                { model: UserModel, as: 'author', attributes: ['id', 'username'] },
                topicInclude,
            ],
            distinct: true,
            subQuery: false
        });

        return {
            items: rows.map(r => this.mapChallengeRow(r)),
            total: count,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(count / pageSize)
        };
    }

    async createWithTestCases(challengeData, testCasesData = []) {
        const t = await sequelize.transaction();
        try {
            const { topicIds, ...rest } = challengeData;
            const challengeRow = await ChallengeModel.create(rest, { transaction: t });
            const challengeId = challengeRow.id;

            if (Array.isArray(topicIds) && topicIds.length > 0) {
                const rows = topicIds.map(tid => ({ challengeId, topicId: tid }));
                await ChallengeTopicModel.bulkCreate(rows, { transaction: t, ignoreDuplicates: true });
            }

            if (challengeData.parameters && challengeData.parameters.length > 0) {
                const paramsToCreate = challengeData.parameters.map((p, index) => ({
                    ...p, challengeId, order: p.order ?? index
                }));
                await ChallengeParameterModel.bulkCreate(paramsToCreate, { transaction: t });
            }

            if (testCasesData && testCasesData.length > 0) {
                for (const tc of testCasesData) {
                    const createdTestCase = await ChallengeTestCaseModel.create({
                        challengeId, title: tc.title, expectedOutput: tc.expectedOutput
                    }, { transaction: t });

                    if (tc.testArgs && tc.testArgs.length > 0) {
                        const argsToCreate = tc.testArgs.map((arg, index) => ({
                            ...arg, testCaseId: createdTestCase.id, order: arg.order ?? index
                        }));
                        await TestCaseArgumentModel.bulkCreate(argsToCreate, { transaction: t });
                    }
                }
            }
            await t.commit();
            return this.findByIdWithTestCases(challengeId);
        } catch (err) { await t.rollback(); throw err; }
    }

    async updateWithTestCases(id, challengeData, testCasesData = null) {
        const t = await sequelize.transaction();
        try {
            const challengeRow = await ChallengeModel.findByPk(id, { transaction: t });
            if (!challengeRow) { await t.rollback(); return null; }

            const { topicIds, ...rest } = challengeData;
            await challengeRow.update(rest, { transaction: t });

            if (Array.isArray(topicIds)) {
                await ChallengeTopicModel.destroy({ where: { challengeId: id }, transaction: t });
                if (topicIds.length > 0) {
                    const rows = topicIds.map(tid => ({ challengeId: id, topicId: tid }));
                    await ChallengeTopicModel.bulkCreate(rows, { transaction: t, ignoreDuplicates: true });
                }
            }

            if (challengeData.parameters) {
                await ChallengeParameterModel.destroy({ where: { challengeId: id }, transaction: t });
                const paramsToCreate = challengeData.parameters.map((p, index) => ({
                    ...p, challengeId: id, order: p.order ?? index
                }));
                await ChallengeParameterModel.bulkCreate(paramsToCreate, { transaction: t });
            }

            if (testCasesData !== null) {
                await ChallengeTestCaseModel.destroy({ where: { challengeId: id }, transaction: t });
                for (const tc of testCasesData) {
                    const createdTestCase = await ChallengeTestCaseModel.create({
                        challengeId: id, title: tc.title, expectedOutput: tc.expectedOutput
                    }, { transaction: t });
                    if (tc.testArgs && tc.testArgs.length > 0) {
                        const argsToCreate = tc.testArgs.map((arg, index) => ({
                            ...arg, testCaseId: createdTestCase.id, order: arg.order ?? index
                        }));
                        await TestCaseArgumentModel.bulkCreate(argsToCreate, { transaction: t });
                    }
                }
            }
            await t.commit();
            return this.findByIdWithTestCases(id);
        } catch (err) { await t.rollback(); throw err; }
    }

    async delete(id) {
        const deletedCount = await ChallengeModel.destroy({ where: { id } });
        return deletedCount > 0;
    }

    async createSubmission(submissionData) {
        const { userId, challengeId, code, status, executionTimeMs, testsPassed, testsTotal } = submissionData;
        const duplicate = await HistoryChallengesModel.findOne({ where: { userId, challengeId, code } });
        if (duplicate) {
            await duplicate.update({ executionTimeMs, status, testsPassed, testsTotal, createdAt: new Date() });
            return duplicate.toJSON();
        }
        const row = await HistoryChallengesModel.create(submissionData);
        return row.toJSON();
    }

    async findUserHistory(userId, challengeId) {
        const rows = await HistoryChallengesModel.findAll({
            where: { userId, challengeId }, order: [['createdAt', 'DESC']]
        });
        return rows.map(r => r.toJSON());
    }

    async hasUserSolvedChallenge(userId, challengeId) {
        const solved = await HistoryChallengesModel.findOne({
            where: { userId, challengeId, status: 'success' }
        });
        return !!solved;
    }

    async findCommunitySolutions(challengeId, options = {}) {
        const { page = 1, pageSize = 10, language, sort = 'newest' } = options;
        const offset = (page - 1) * pageSize;
        const whereClause = { challengeId, status: 'success' };
        if (language && language !== 'all') whereClause.language = language;

        const userGroups = await HistoryChallengesModel.findAll({
            where: whereClause,
            attributes: [[sequelize.fn('MAX', sequelize.col('id')), 'latestId']],
            group: ['userId'],
            raw: true
        });
        const allIds = userGroups.map(g => g.latestId);
        if (allIds.length === 0) return { items: [], total: 0, totalPages: 0 };

        const orderDirection = sort === 'oldest' ? 'ASC' : 'DESC';
        const { rows } = await HistoryChallengesModel.findAndCountAll({
            where: { id: allIds },
            include: [{ model: UserModel, as: 'user', attributes: ['username'] }],
            order: [['createdAt', orderDirection]],
            limit: Number(pageSize),
            offset
        });
        return {
            items: rows.map(r => r.toJSON()),
            total: allIds.length,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(allIds.length / pageSize)
        };
    }

    async findReviewsByChallengeId(challengeId, options = {}) {
        const { page = 1, pageSize = 5, sort = 'newest' } = options;
        const offset = (page - 1) * pageSize;
        let order = [];
        switch (sort) {
            case 'oldest':  order = [['createdAt', 'ASC']]; break;
            case 'highest': order = [['rating', 'DESC'], ['createdAt', 'DESC']]; break;
            case 'lowest':  order = [['rating', 'ASC'],  ['createdAt', 'DESC']]; break;
            default:        order = [['createdAt', 'DESC']]; break;
        }
        const { rows, count } = await ReviewChallengesModel.findAndCountAll({
            where: { challengeId },
            include: [{ model: UserModel, as: 'user', attributes: ['id', 'username'] }],
            order,
            limit: Number(pageSize),
            offset,
            distinct: true
        });
        return {
            items: rows.map(r => r.toJSON()),
            total: count,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(count / Number(pageSize))
        };
    }

    async getAverageRating(challengeId) {
        const result = await ReviewChallengesModel.findOne({
            where: { challengeId },
            attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
            raw: true
        });
        return parseFloat(result.avgRating) || 0;
    }

    async findReviewByIdWithUser(userId, challengeId) {
        const row = await ReviewChallengesModel.findOne({
            where: { userId, challengeId },
            include: [{ model: UserModel, as: 'user', attributes: ['id', 'username'] }]
        });
        return row ? row.toJSON() : null;
    }

    async upsertReview(reviewData) {
        const { userId, challengeId, content, rating } = reviewData;
        const existingReview = await ReviewChallengesModel.findOne({ where: { userId, challengeId } });
        if (existingReview) {
            await existingReview.update({
                content: content || existingReview.content,
                rating: rating || existingReview.rating,
                createdAt: new Date()
            });
        } else {
            await ReviewChallengesModel.create({
                userId, challengeId, content: content || '', rating: rating || 0, createdAt: new Date()
            });
        }
        return await this.findReviewByIdWithUser(userId, challengeId);
    }
    async findAllTopics() {
        const rows = await TopicModel.findAll({ order: [['name', 'ASC']] });
        return rows.map(r => ({ id: r.id, name: r.name }));
    }

    async findOrCreateTopic(name) {
        const [topic] = await TopicModel.findOrCreate({
            where: { name: name.trim() },
            defaults: { name: name.trim() }
        });
        return topic.id;
    }

    async findAllReportReasons() {
        const { ReportReason } = require('../models');
        const rows = await ReportReason.findAll({ order: [['id', 'ASC']] });
        return rows.map(r => ({ id: r.id, name: r.name }));
    }

    async isFirstSolve(userId, challengeId) {
        const existing = await HistoryChallengesModel.findOne({
            where: { userId, challengeId, status: 'success' }
        });
        return !existing;
    }

    async awardExperience(userId, xp) {
        await UserModel.increment('experience', { by: xp, where: { id: userId } });
    }

    async createReport({ userId, challengeId, reasonId, reasonText }) {
        const { ReportChallenge } = require('../models');
        return await ReportChallenge.create({
            userId,
            challengeId,
            reasonId: reasonId || null,
            reasonText: reasonText || null,
            status: 'Pending',
            createdAt: new Date()
        });
    }
}

module.exports = ChallengeRepositorySequelize;
