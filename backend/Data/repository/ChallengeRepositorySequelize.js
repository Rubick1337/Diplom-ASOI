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
            topic: data.topic,
            mode: data.mode,
            funcName: data.funcName,
            timeLimitMs: data.timeLimitMs,
            createdByUserId: data.createdByUserId,
            sampleInput: data.sampleInput,
            sampleOutput: data.sampleOutput,
            isHidden: data.isHidden,
            parameters,
            testCases
        });

        if (data.author) {
            challenge.author = {
                id: data.author.id,
                username: data.author.username,
                role: data.author.role,
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
            { model: UserModel, as: 'author', attributes: ['id', 'username', 'email', 'role'] },
        ];
    }

    buildWhere(filter = {}) {
        const where = {};
        if (filter.id !== undefined) where.id = filter.id;
        if (filter.name) where.name = filter.name;
        if (filter.topic) where.topic = filter.topic;
        if (filter.showHidden === undefined || filter.showHidden === false) {
            where.isHidden = false;
        }
        if (filter.nameLike) where.name = { [Op.like]: `%${filter.nameLike}%` };
        if (filter.createdByUserId !== undefined) where.createdByUserId = filter.createdByUserId;
        if (filter.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filter.search}%` } },
                { description: { [Op.like]: `%${filter.search}%` } },
                { topic: { [Op.like]: `%${filter.search}%` } }
            ];
        }
        return where;
    }

    async findOne(filter = {}) {
        const where = this.buildWhere(filter);
        const row = await ChallengeModel.findOne({
            where,
            include: this.defaultInclude,
            order: [
                [{ model: ChallengeParameterModel, as: 'parameters' }, 'order', 'ASC'],
                [{ model: ChallengeTestCaseModel, as: 'testCases' }, 'id', 'ASC'],
                [{ model: ChallengeTestCaseModel, as: 'testCases' }, { model: TestCaseArgumentModel, as: 'testArgs' }, 'order', 'ASC']
            ]
        });
        return this.mapChallengeRow(row);
    }

    async findByIdWithTestCases(id) {
        return this.findOne({ id, showHidden: true });
    }

    async findManyWithTestCases(filter = {}, options = {}) {
        const { page = 1, pageSize = 10, orderBy = 'id', orderDirection = 'ASC' } = options;
        const where = this.buildWhere(filter);
        const offset = (page - 1) * pageSize;

        const { rows, count } = await ChallengeModel.findAndCountAll({
            where,
            limit: pageSize,
            offset,
            order: [[orderBy, orderDirection]],
            include: this.defaultInclude,
            distinct: true
        });

        return {
            items: rows.map(r => this.mapChallengeRow(r)),
            total: count,
            page,
            pageSize,
            totalPages: Math.ceil(count / pageSize)
        };
    }

    async createWithTestCases(challengeData, testCasesData = []) {
        const t = await sequelize.transaction();
        try {
            const challengeRow = await ChallengeModel.create(challengeData, { transaction: t });
            const challengeId = challengeRow.id;

            if (challengeData.parameters && challengeData.parameters.length > 0) {
                const paramsToCreate = challengeData.parameters.map((p, index) => ({
                    ...p,
                    challengeId,
                    order: p.order ?? index
                }));
                await ChallengeParameterModel.bulkCreate(paramsToCreate, { transaction: t });
            }

            if (testCasesData && testCasesData.length > 0) {
                for (const tc of testCasesData) {
                    const createdTestCase = await ChallengeTestCaseModel.create({
                        challengeId,
                        title: tc.title,
                        expectedOutput: tc.expectedOutput
                    }, { transaction: t });

                    if (tc.testArgs && tc.testArgs.length > 0) {
                        const argsToCreate = tc.testArgs.map((arg, index) => ({
                            ...arg,
                            testCaseId: createdTestCase.id,
                            order: arg.order ?? index
                        }));
                        await TestCaseArgumentModel.bulkCreate(argsToCreate, { transaction: t });
                    }
                }
            }

            await t.commit();
            return this.findByIdWithTestCases(challengeId);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async updateWithTestCases(id, challengeData, testCasesData = null) {
        const t = await sequelize.transaction();
        try {
            const challengeRow = await ChallengeModel.findByPk(id, { transaction: t });
            if (!challengeRow) {
                await t.rollback();
                return null;
            }

            await challengeRow.update(challengeData, { transaction: t });

            if (challengeData.parameters) {
                await ChallengeParameterModel.destroy({ where: { challengeId: id }, transaction: t });
                const paramsToCreate = challengeData.parameters.map((p, index) => ({
                    ...p,
                    challengeId: id,
                    order: p.order ?? index
                }));
                await ChallengeParameterModel.bulkCreate(paramsToCreate, { transaction: t });
            }

            if (testCasesData !== null) {
                await ChallengeTestCaseModel.destroy({ where: { challengeId: id }, transaction: t });
                for (const tc of testCasesData) {
                    const createdTestCase = await ChallengeTestCaseModel.create({
                        challengeId: id,
                        title: tc.title,
                        expectedOutput: tc.expectedOutput
                    }, { transaction: t });

                    if (tc.testArgs && tc.testArgs.length > 0) {
                        const argsToCreate = tc.testArgs.map((arg, index) => ({
                            ...arg,
                            testCaseId: createdTestCase.id,
                            order: arg.order ?? index
                        }));
                        await TestCaseArgumentModel.bulkCreate(argsToCreate, { transaction: t });
                    }
                }
            }

            await t.commit();
            return this.findByIdWithTestCases(id);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async delete(id) {
        const deletedCount = await ChallengeModel.destroy({ where: { id } });
        return deletedCount > 0;
    }

    async createSubmission(submissionData) {
        const { userId, challengeId, code, status, executionTimeMs } = submissionData;

        const duplicate = await HistoryChallengesModel.findOne({
            where: { userId, challengeId, code }
        });

        if (duplicate) {
            await duplicate.update({
                executionTimeMs,
                status,
                createdAt: new Date()
            });
            return duplicate.toJSON();
        }

        const row = await HistoryChallengesModel.create(submissionData);
        return row.toJSON();
    }

    async findUserHistory(userId, challengeId) {
        const rows = await HistoryChallengesModel.findAll({
            where: { userId, challengeId },
            order: [['createdAt', 'DESC']]
        });
        return rows.map(r => r.toJSON());
    }

    async hasUserSolvedChallenge(userId, challengeId) {
        const solved = await HistoryChallengesModel.findOne({
            where: {
                userId,
                challengeId,
                status: 'success'
            }
        });
        return !!solved;
    }

    async findCommunitySolutions(challengeId, options = { page, pageSize}) {
        const { page, pageSize } = options;
        const offset = (page - 1) * pageSize;
        const userGroups = await HistoryChallengesModel.findAll({
            where: { challengeId, status: 'success' },
            attributes: [
                [sequelize.fn('MAX', sequelize.col('id')), 'latestId']
            ],
            group: ['userId'],
            raw: true
        });

        const allIds = userGroups.map(g => g.latestId);
        const totalItems = allIds.length;

        if (totalItems === 0) return { items: [], total: 0, totalPages: 0 };

        const rows = await HistoryChallengesModel.findAll({
            where: { id: allIds },
            include: [{ model: UserModel, as: 'user', attributes: ['username'] }],
            order: [['createdAt', 'DESC']],
            limit: pageSize,
            offset: offset
        });

        return {
            items: rows.map(r => r.toJSON()),
            total: totalItems,
            page: Number(page),
            pageSize: Number(pageSize),
            totalPages: Math.ceil(totalItems / pageSize)
        };
    }

    async createReview(reviewData) {
        const row = await ReviewChallengesModel.create(reviewData);
        return row.toJSON();
    }

    async findReviewsByChallengeId(challengeId) {
        const rows = await ReviewChallengesModel.findAll({
            where: { challengeId },
            include: [{ model: UserModel, as: 'user', attributes: ['id', 'username'] }],
            order: [['createdAt', 'DESC']]
        });
        return rows.map(r => r.toJSON());
    }

    async getAverageRating(challengeId) {
        const result = await ReviewChallengesModel.findOne({
            where: { challengeId },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
            ],
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
        await ReviewChallengesModel.upsert({
            userId,
            challengeId,
            content,
            rating,
            createdAt: new Date()
        });
        return await this.findReviewByIdWithUser(userId, challengeId);
    }
}

module.exports = ChallengeRepositorySequelize;