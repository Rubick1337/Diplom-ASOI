const { fn, col } = require('sequelize');
const sequelize = require('../config/dbConfig');
const ITestRepository = require('../../Domain/repository/ITestRepository');

const {
    Test,
    Question,
    QuestionOption,
    QuestionTestCase,
    QuestionType,
    TestAttempt,
    AttemptQuestion,
    AttemptAnswer,
    AnswerSelectedOption,
    AnswerMatchingPair,
    AnswerTestCaseResult,
    Report,
    ReportReason,
    Review,
    Topic,
    User,
} = require('../models');

const QUESTION_INCLUDE = [
    { model: QuestionType,    as: 'type',      attributes: ['id', 'name'] },
    { model: QuestionOption,  as: 'options',   attributes: ['id', 'text', 'isCorrect', 'matchPair', 'blankIndex', 'order'] },
    { model: QuestionTestCase, as: 'testCases', attributes: ['id', 'input', 'expectedOutput', 'isHidden', 'order'] },
];

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

class TestRepositorySequelize extends ITestRepository {

    // ── Типы вопросов ──────────────────────────────────────────────────────────

    async getQuestionTypes() {
        const rows = await QuestionType.findAll({ order: [['id', 'ASC']] });
        return rows.map(r => r.toJSON());
    }

    // ── Тесты (CRUD) ──────────────────────────────────────────────────────────

    async findAllAdmin() {
        const tests = await Test.findAll({
            include: [
                { model: User,     as: 'author',    attributes: ['id', 'username'] },
                { model: Question, as: 'questions', attributes: ['id'] },
                { model: Topic,    as: 'topic',     attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        return tests.map(t => ({
            id:               t.id,
            title:            t.title,
            description:      t.description,
            timeLimitMinutes: t.timeLimitMinutes,
            isPublished:      t.isPublished,
            questionCount:    t.questions.length,
            author:           t.author?.username ?? null,
            createdAt:        t.createdAt,
            topicId:          t.topicId,
            difficulty:       t.difficulty,
            topic:            t.topic ? { id: t.topic.id, name: t.topic.name } : null,
        }));
    }

    async findByIdAdmin(id) {
        const test = await Test.findByPk(id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'username'] },
                { model: Question, as: 'questions', include: QUESTION_INCLUDE, order: [['order', 'ASC']] },
            ],
        });
        return test ? (test.toJSON ? test.toJSON() : test) : null;
    }

    async create(data, adminId) {
        const row = await Test.create({
            title:            data.title,
            description:      data.description      ?? null,
            timeLimitMinutes: data.timeLimitMinutes  ?? null,
            topicId:          data.topicId           ?? null,
            difficulty:       data.difficulty        ?? null,
            isPublished:      false,
            createdBy:        adminId,
        });
        return row.toJSON();
    }

    async update(id, data) {
        const test = await Test.findByPk(id);
        if (!test) return null;
        await test.update({
            title:             data.title             ?? test.title,
            description:       data.description       ?? test.description,
            timeLimitMinutes:  data.timeLimitMinutes  !== undefined ? data.timeLimitMinutes  : test.timeLimitMinutes,
            topicId:           data.topicId           !== undefined ? data.topicId           : test.topicId,
            difficulty:        data.difficulty        !== undefined ? data.difficulty        : test.difficulty,
            shuffleQuestions:  data.shuffleQuestions  !== undefined ? data.shuffleQuestions  : test.shuffleQuestions,
            shuffleOptions:    data.shuffleOptions    !== undefined ? data.shuffleOptions    : test.shuffleOptions,
            questionPoolSize:  data.questionPoolSize  !== undefined ? data.questionPoolSize  : test.questionPoolSize,
            showCorrectAnswers:data.showCorrectAnswers!== undefined ? data.showCorrectAnswers: test.showCorrectAnswers,
        });
        return test.toJSON();
    }

    async publish(id, isPublished) {
        const test = await Test.findByPk(id);
        if (!test) return null;
        await test.update({ isPublished });
        return { id: test.id, isPublished: test.isPublished };
    }

    async delete(id) {
        const deleted = await Test.destroy({ where: { id } });
        return deleted > 0;
    }

    // ── Вопросы ───────────────────────────────────────────────────────────────

    async createQuestion(testId, data) {
        const maxOrder = await Question.max('order', { where: { testId } }) ?? -1;

        const question = await Question.create({
            testId,
            typeId:        data.typeId,
            text:          data.text,
            points:        data.points        ?? 1,
            order:         data.order         ?? maxOrder + 1,
            allowMultiple: data.allowMultiple ?? false,
            caseSensitive: data.caseSensitive ?? false,
            tolerance:     data.tolerance     ?? null,
            codeLanguage:  data.codeLanguage  ?? null,
            starterCode:   data.starterCode   ?? null,
            funcName:      data.funcName      ?? null,
        });

        if (Array.isArray(data.options) && data.options.length > 0) {
            await QuestionOption.bulkCreate(data.options.map((o, i) => ({
                questionId: question.id, text: o.text, isCorrect: o.isCorrect ?? false,
                matchPair: o.matchPair ?? null, blankIndex: o.blankIndex ?? null, order: o.order ?? i,
            })));
        }

        if (Array.isArray(data.testCases) && data.testCases.length > 0) {
            await QuestionTestCase.bulkCreate(data.testCases.map((tc, i) => ({
                questionId: question.id, input: tc.input ?? null,
                expectedOutput: tc.expectedOutput, isHidden: tc.isHidden ?? false, order: tc.order ?? i,
            })));
        }

        return this._findQuestionById(question.id);
    }

    async updateQuestion(id, data) {
        const question = await Question.findByPk(id);
        if (!question) return null;

        await question.update({
            typeId:        data.typeId        ?? question.typeId,
            text:          data.text          ?? question.text,
            points:        data.points        ?? question.points,
            order:         data.order         ?? question.order,
            allowMultiple: data.allowMultiple ?? question.allowMultiple,
            caseSensitive: data.caseSensitive ?? question.caseSensitive,
            tolerance:     data.tolerance     !== undefined ? data.tolerance     : question.tolerance,
            codeLanguage:  data.codeLanguage  !== undefined ? data.codeLanguage  : question.codeLanguage,
            starterCode:   data.starterCode   !== undefined ? data.starterCode   : question.starterCode,
            funcName:      data.funcName      !== undefined ? data.funcName      : question.funcName,
        });

        if (Array.isArray(data.options)) {
            await QuestionOption.destroy({ where: { questionId: id } });
            if (data.options.length > 0) {
                await QuestionOption.bulkCreate(data.options.map((o, i) => ({
                    questionId: id, text: o.text, isCorrect: o.isCorrect ?? false,
                    matchPair: o.matchPair ?? null, blankIndex: o.blankIndex ?? null, order: o.order ?? i,
                })));
            }
        }

        if (Array.isArray(data.testCases)) {
            await QuestionTestCase.destroy({ where: { questionId: id } });
            if (data.testCases.length > 0) {
                await QuestionTestCase.bulkCreate(data.testCases.map((tc, i) => ({
                    questionId: id, input: tc.input ?? null,
                    expectedOutput: tc.expectedOutput, isHidden: tc.isHidden ?? false, order: tc.order ?? i,
                })));
            }
        }

        return this._findQuestionById(id);
    }

    async deleteQuestion(id) {
        const deleted = await Question.destroy({ where: { id } });
        return deleted > 0;
    }

    async reorderQuestions(testId, orderedIds) {
        await Promise.all(
            orderedIds.map((qId, idx) => Question.update({ order: idx }, { where: { id: qId, testId } }))
        );
        return true;
    }

    // ── Публичные: список и прохождение ───────────────────────────────────────

    async findAllPublished() {
        const tests = await Test.findAll({
            where: { isPublished: true },
            include: [
                { model: Question, as: 'questions', attributes: ['id'] },
                { model: Topic,    as: 'topic',     attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        return tests.map(t => ({
            id:               t.id,
            title:            t.title,
            description:      t.description,
            timeLimitMinutes: t.timeLimitMinutes,
            questionCount:    t.questions.length,
            topicId:          t.topicId,
            difficulty:       t.difficulty,
            topic:            t.topic ? { id: t.topic.id, name: t.topic.name } : null,
            createdAt:        t.createdAt,
        }));
    }

    async findPublishedById(id) {
        const test = await Test.findOne({
            where: { id, isPublished: true },
            include: [{
                model: Question,
                as: 'questions',
                include: [
                    { model: QuestionType,   as: 'type',    attributes: ['id', 'name'] },
                    { model: QuestionOption, as: 'options', attributes: ['id', 'text', 'matchPair', 'blankIndex', 'order'] },
                ],
            }],
        });
        return test ? (test.toJSON ? test.toJSON() : test) : null;
    }

    async startAttempt(testId, userId) {
        const test = await Test.findOne({ where: { id: testId, isPublished: true } });
        if (!test) return null;

        let questions = await Question.findAll({
            where: { testId },
            attributes: ['id', 'points'],
            order: [['order', 'ASC']],
        });

        if (test.questionPoolSize && test.questionPoolSize < questions.length) {
            questions = shuffle(questions).slice(0, test.questionPoolSize);
        }
        if (test.shuffleQuestions) {
            questions = shuffle(questions);
        }

        const questionIds = questions.map(q => q.id);
        const maxScore    = questions.reduce((sum, q) => sum + (q.points || 1), 0);

        const attempt = await TestAttempt.create({
            testId, userId,
            startedAt: new Date(),
            status:    'active',
            maxScore,
        });

        await AttemptQuestion.bulkCreate(
            questionIds.map((id, i) => ({ attemptId: attempt.id, questionId: id, position: i }))
        );

        return {
            attemptId:        attempt.id,
            startedAt:        attempt.startedAt,
            timeLimitMinutes: test.timeLimitMinutes,
            maxScore,
            questionIds,
            shuffleOptions:   test.shuffleOptions,
        };
    }

    async findAttemptForSubmit(attemptId, userId) {
        return TestAttempt.findOne({
            where: { id: attemptId, userId },
            include: [{ model: Test, as: 'test' }],
        });
    }

    async findQuestionsForScoring(testId) {
        return Question.findAll({
            where: { testId },
            include: QUESTION_INCLUDE,
        });
    }

    async saveAttemptResult(attemptId, { status, finishedAt, score, answerRows, selectedOptionRows, matchingPairRows, testCaseResultRows }) {
        const t = await sequelize.transaction();
        try {
            const createdAnswers = await AttemptAnswer.bulkCreate(answerRows, { returning: true, transaction: t });

            const selRows  = [];
            const matchRows = [];
            const tcRows    = [];

            for (let i = 0; i < createdAnswers.length; i++) {
                const answerId = createdAnswers[i].id;

                (selectedOptionRows[i] || []).forEach(optionId => {
                    selRows.push({ answerId, optionId });
                });

                (matchingPairRows[i] || []).forEach(([optionId, matchPair]) => {
                    matchRows.push({ answerId, optionId: Number(optionId), matchPair });
                });

                (testCaseResultRows[i] || []).forEach((tc, j) => {
                    tcRows.push({ answerId, position: j, ...tc });
                });
            }

            await Promise.all([
                selRows.length   ? AnswerSelectedOption.bulkCreate(selRows,   { transaction: t }) : null,
                matchRows.length ? AnswerMatchingPair.bulkCreate(matchRows,   { transaction: t }) : null,
                tcRows.length    ? AnswerTestCaseResult.bulkCreate(tcRows,    { transaction: t }) : null,
                TestAttempt.update({ status, finishedAt, score }, { where: { id: attemptId }, transaction: t }),
            ]);

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async findAttemptsByUser(testId, userId) {
        const rows = await TestAttempt.findAll({
            where: { testId, userId },
            attributes: ['id', 'startedAt', 'finishedAt', 'status', 'score', 'maxScore'],
            order: [['startedAt', 'DESC']],
        });
        return rows.map(r => r.toJSON());
    }

    async findAttemptResult(attemptId, userId) {
        const attempt = await TestAttempt.findOne({
            where: { id: attemptId, userId },
            include: [
                { model: Test, as: 'test', attributes: ['id', 'title', 'timeLimitMinutes', 'showCorrectAnswers'] },
                {
                    model: AttemptAnswer,
                    as: 'answers',
                    include: [
                        { model: Question,             as: 'question',          include: QUESTION_INCLUDE },
                        { model: AnswerSelectedOption, as: 'selectedOptions',   attributes: ['optionId'] },
                        { model: AnswerMatchingPair,   as: 'matchingPairs',    attributes: ['optionId', 'matchPair'] },
                        { model: AnswerTestCaseResult, as: 'testCaseResultRows', attributes: { exclude: ['id', 'answerId'] } },
                    ],
                },
            ],
        });
        return attempt ? (attempt.toJSON ? attempt.toJSON() : attempt) : null;
    }

    // ── Жалобы ────────────────────────────────────────────────────────────────

    async getReportReasons() {
        const rows = await ReportReason.findAll({ order: [['id', 'ASC']] });
        return rows.map(r => ({ id: r.id, name: r.name }));
    }

    async createReport(userId, testId, reasonId, reasonText) {
        const row = await Report.create({
            userId,
            testId,
            challengeId: null,
            reasonId:    reasonId   ?? null,
            reasonText:  reasonText ?? null,
        });
        return row.toJSON();
    }

    // ── Отзывы ────────────────────────────────────────────────────────────────

    async findReviews(testId, options = {}) {
        const { page = 1, pageSize = 5, sort = 'newest' } = options;
        const offset = (page - 1) * pageSize;

        const order = {
            oldest:  [['createdAt', 'ASC']],
            highest: [['rating', 'DESC'], ['createdAt', 'DESC']],
            lowest:  [['rating', 'ASC'],  ['createdAt', 'DESC']],
        }[sort] ?? [['createdAt', 'DESC']];

        const { rows, count } = await Review.findAndCountAll({
            where: { testId },
            include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
            order,
            limit:    pageSize,
            offset,
            distinct: true,
        });

        const avgResult = await Review.findOne({
            where: { testId },
            attributes: [[fn('AVG', col('rating')), 'avgRating']],
            raw: true,
        });

        return {
            reviews:    rows.map(r => r.toJSON()),
            pagination: { total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) },
            avgRating:  parseFloat(avgResult?.avgRating) || 0,
        };
    }

    async upsertReview(userId, testId, content, rating) {
        const existing = await Review.findOne({ where: { userId, testId } });
        if (existing) {
            await existing.update({
                content:   content || existing.content,
                rating:    rating  || existing.rating,
                createdAt: new Date(),
            });
        } else {
            await Review.create({ userId, testId, content: content || '', rating: rating || 5, createdAt: new Date() });
        }
        const row = await Review.findOne({
            where: { userId, testId },
            include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
        });
        return row.toJSON();
    }

    // ── Приватный хелпер ──────────────────────────────────────────────────────

    async _findQuestionById(id) {
        return Question.findByPk(id, { include: QUESTION_INCLUDE });
    }
}

module.exports = TestRepositorySequelize;
