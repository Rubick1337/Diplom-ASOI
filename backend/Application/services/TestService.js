const { Test, Question, QuestionOption, QuestionTestCase, QuestionType, TestAttempt, AttemptQuestion, AttemptAnswer, AnswerSelectedOption, AnswerMatchingPair, AnswerTestCaseResult, User, Topic } = require('../../Data/models');
const { Op, fn, col } = require('sequelize');
const ApiError      = require('../../Presentation/ErrorExtend/ApiError');
const DockerRunner  = require('../../Data/DockerRunner/DockerRunner');
const harnessConfig = require('../../Data/config/HarnessConfig');
const CacheUtils = require('../../Data/utils/cacheUtils');

const TTL = { PUBLISHED_TESTS: 120, TEST: 300, QUESTION_TYPES: 86400 };

function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Вложения для полного теста с вопросами и вариантами
const QUESTION_INCLUDE = [
    {
        model: QuestionType,
        as: 'type',
        attributes: ['id', 'name'],
    },
    {
        model: QuestionOption,
        as: 'options',
        attributes: ['id', 'text', 'isCorrect', 'matchPair', 'blankIndex', 'order'],
    },
    {
        model: QuestionTestCase,
        as: 'testCases',
        attributes: ['id', 'input', 'expectedOutput', 'isHidden', 'order'],
    },
];

function safeParse(val) {
    try { return JSON.parse(val); } catch { return val; }
}

// ─── Вспомогательные функции оценки ─────────────────────────────────────────

function scoreMultichoice(question, answer) {
    const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id);
    const selected   = Array.isArray(answer.selectedOptionIds) ? answer.selectedOptionIds : [];

    if (!question.allowMultiple) {
        // Одиночный выбор: всё или ничего
        const isCorrect = selected.length === 1 && correctIds.includes(selected[0]);
        return { isCorrect, points: isCorrect ? question.points : 0 };
    }

    // Множественный выбор: частичные баллы
    const correctSet = new Set(correctIds);
    const selectedSet = new Set(selected);
    const correctHits  = selected.filter(id => correctSet.has(id)).length;
    const wrongHits    = selected.filter(id => !correctSet.has(id)).length;
    const isCorrect    = correctHits === correctIds.length && wrongHits === 0;
    const ratio        = correctIds.length > 0
        ? Math.max(0, (correctHits - wrongHits) / correctIds.length)
        : 0;
    return { isCorrect, points: parseFloat((ratio * question.points).toFixed(4)) };
}

function scoreTrueFalse(question, answer) {
    const correctOption = question.options.find(o => o.isCorrect);
    if (!correctOption) return { isCorrect: false, points: 0 };
    const selected = Array.isArray(answer.selectedOptionIds) ? answer.selectedOptionIds : [];
    const isCorrect = selected.length === 1 && selected[0] === correctOption.id;
    return { isCorrect, points: isCorrect ? question.points : 0 };
}

function scoreShortAnswer(question, answer) {
    const correctOptions = question.options.filter(o => o.isCorrect);
    const userAnswer     = (answer.answerText || '').trim();
    const compare        = (a, b) => question.caseSensitive ? a === b : a.toLowerCase() === b.toLowerCase();
    const isCorrect      = correctOptions.some(o => compare(userAnswer, o.text.trim()));
    return { isCorrect, points: isCorrect ? question.points : 0 };
}

function scoreNumerical(question, answer) {
    const correctOption = question.options.find(o => o.isCorrect);
    if (!correctOption) return { isCorrect: false, points: 0 };
    const correct   = parseFloat(correctOption.text);
    const userVal   = parseFloat(answer.answerText || '');
    const tolerance = question.tolerance ?? 0;
    if (isNaN(userVal) || isNaN(correct)) return { isCorrect: false, points: 0 };
    const isCorrect = Math.abs(userVal - correct) <= tolerance;
    return { isCorrect, points: isCorrect ? question.points : 0 };
}

function scoreCloze(question, answer) {
    // answerText хранится как JSON: { "1": "Париж", "2": "столица" }
    let userBlanks = {};
    try { userBlanks = JSON.parse(answer.answerText || '{}'); } catch { }

    const blanks = {};
    for (const opt of question.options.filter(o => o.isCorrect)) {
        const idx = String(opt.blankIndex);
        if (!blanks[idx]) blanks[idx] = [];
        blanks[idx].push(opt.text.trim().toLowerCase());
    }

    const total   = Object.keys(blanks).length;
    if (total === 0) return { isCorrect: false, points: 0 };

    let correct = 0;
    for (const [idx, correctAnswers] of Object.entries(blanks)) {
        const userAns = (userBlanks[idx] || '').trim().toLowerCase();
        if (correctAnswers.includes(userAns)) correct++;
    }

    const ratio     = correct / total;
    const isCorrect = ratio === 1;
    return { isCorrect, points: parseFloat((ratio * question.points).toFixed(4)) };
}

function scoreMatching(question, answer) {
    // matchingAnswer: { optionId: введённый matchPair }
    let userPairs = {};
    try { userPairs = answer.matchingAnswer || {}; } catch { }

    const options = question.options.filter(o => o.isCorrect && o.matchPair);
    if (options.length === 0) return { isCorrect: false, points: 0 };

    let correct = 0;
    for (const opt of options) {
        const userPair = (userPairs[opt.id] || '').trim().toLowerCase();
        if (userPair === opt.matchPair.trim().toLowerCase()) correct++;
    }

    const ratio     = correct / options.length;
    const isCorrect = ratio === 1;
    return { isCorrect, points: parseFloat((ratio * question.points).toFixed(4)) };
}

async function scoreCode(question, answer) {
    const testCases = (question.testCases ?? []).slice().sort((a, b) => a.order - b.order);
    if (testCases.length === 0) return { isCorrect: null, points: 0, testCaseResults: null };

    let langConfig = harnessConfig[question.codeLanguage];
    let code = answer.codeAnswer ?? '';
    if (!langConfig) return { isCorrect: null, points: 0, testCaseResults: null };

    const makeCompileErr = (err) =>
        ({ isCorrect: false, points: 0, testCaseResults: testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: null, passed: false, isHidden: tc.isHidden, error: err })) });

    if (question.codeLanguage === 'typescript') {
        try {
            const ts = require('typescript');
            code = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
            langConfig = harnessConfig.javascript;
        } catch (e) { return makeCompileErr(`Ошибка TypeScript: ${e.message}`); }
    }
    if (question.codeLanguage === 'coffeescript') {
        try {
            const coffee = require('coffeescript');
            code = coffee.compile(code, { bare: true });
            langConfig = harnessConfig.javascript;
        } catch (e) { return makeCompileErr(`Ошибка CoffeeScript: ${e.message}`); }
    }

    const runner = new DockerRunner();
    let passed = 0;
    let results;

    if (question.funcName) {
        // Харнесс-режим: вызов функции с JSON-аргументами
        const formattedTests = testCases.map((tc, idx) => ({
            id:       tc.id,
            title:    `Test ${idx + 1}`,
            expected: safeParse(tc.expectedOutput),
            args:     safeParse(tc.input ?? '[]'),
        }));
        const harnessCode   = langConfig.template(question.funcName, formattedTests, []);
        const execResult    = await runner.run(langConfig, code, harnessCode, 10000);
        const testResults   = execResult.testResults ?? [];

        results = testCases.map((tc, idx) => {
            const tr  = testResults.find(r => r.id === tc.id) ?? testResults[idx];
            const ok  = tr?.status === 'success';
            if (ok) passed++;
            return {
                input:          tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput:   tr ? JSON.stringify(tr.actual) : null,
                passed:         ok,
                isHidden:       tc.isHidden,
                timedOut:       false,
                error:          tr?.status === 'error' ? tr.actual : (execResult.error?.details ?? null),
            };
        });

        if (!execResult.success && testResults.length === 0) {
            results = testCases.map(tc => ({
                input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: null,
                passed: false, isHidden: tc.isHidden, timedOut: false,
                error: execResult.error?.details ?? 'Ошибка выполнения',
            }));
        }
    } else {
        // Stdin-режим: обратная совместимость
        results = [];
        for (const tc of testCases) {
            const result   = await runner.runRaw(langConfig, code, 10000, tc.input ?? null);
            const actual   = (result.output ?? '').trim();
            const expected = (tc.expectedOutput ?? '').trim();
            const ok       = !result.timedOut && !result.error && actual === expected;
            results.push({ input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: result.output, passed: ok, isHidden: tc.isHidden, timedOut: result.timedOut ?? false, error: result.error ?? null });
            if (ok) passed++;
        }
    }

    const ratio = passed / testCases.length;
    return {
        isCorrect:       ratio === 1,
        points:          parseFloat((ratio * question.points).toFixed(4)),
        testCaseResults: results,
    };
}

function scoreAnswer(question, answer) {
    const typeName = question.type?.name;
    switch (typeName) {
        case 'Множественный выбор': return scoreMultichoice(question, answer);
        case 'Да / Нет':            return scoreTrueFalse(question, answer);
        case 'Короткий ответ':      return scoreShortAnswer(question, answer);
        case 'Числовой ответ':      return scoreNumerical(question, answer);
        case 'Заполни пропуск':     return scoreCloze(question, answer);
        case 'Сопоставление':       return scoreMatching(question, answer);
        case 'Информационный блок':
        default:             return { isCorrect: null, points: 0, testCaseResults: null };
    }
}

// ─── Сервис ──────────────────────────────────────────────────────────────────

class TestService {

    // ── Типы вопросов ──────────────────────────────────────────────────────────

    async getQuestionTypes() {
        const key = CacheUtils.generateCacheKey('questionTypes', 'all', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;
        const result = await QuestionType.findAll({ order: [['id', 'ASC']] });
        const plain = result.map(r => r.toJSON ? r.toJSON() : r);
        await CacheUtils.setCache(key, TTL.QUESTION_TYPES, plain);
        return plain;
    }

    // ── Админ: тесты ──────────────────────────────────────────────────────────

    async getAdminTests() {
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

    async getAdminTestById(id) {
        const test = await Test.findByPk(id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'username'] },
                {
                    model: Question,
                    as: 'questions',
                    include: QUESTION_INCLUDE,
                    order: [['order', 'ASC']],
                },
            ],
        });
        if (!test) throw ApiError.notFound('Тест не найден');
        return test;
    }

    async createTest(data, adminId) {
        return Test.create({
            title:            data.title,
            description:      data.description ?? null,
            timeLimitMinutes: data.timeLimitMinutes ?? null,
            topicId:          data.topicId    ?? null,
            difficulty:       data.difficulty ?? null,
            isPublished:      false,
            createdBy:        adminId,
        });
    }

    async updateTest(id, data) {
        const test = await Test.findByPk(id);
        if (!test) throw ApiError.notFound('Тест не найден');
        await test.update({
            title:            data.title            ?? test.title,
            description:      data.description      ?? test.description,
            timeLimitMinutes: data.timeLimitMinutes  !== undefined ? data.timeLimitMinutes : test.timeLimitMinutes,
            topicId:          data.topicId          !== undefined ? data.topicId          : test.topicId,
            difficulty:       data.difficulty       !== undefined ? data.difficulty       : test.difficulty,
            shuffleQuestions: data.shuffleQuestions !== undefined ? data.shuffleQuestions : test.shuffleQuestions,
            shuffleOptions:      data.shuffleOptions      !== undefined ? data.shuffleOptions      : test.shuffleOptions,
            questionPoolSize:    data.questionPoolSize    !== undefined ? data.questionPoolSize    : test.questionPoolSize,
            showCorrectAnswers:  data.showCorrectAnswers  !== undefined ? data.showCorrectAnswers  : test.showCorrectAnswers,
        });
        await CacheUtils.invalidateCache('tests');
        return test;
    }

    async publishTest(id, isPublished) {
        const test = await Test.findByPk(id);
        if (!test) throw ApiError.notFound('Тест не найден');
        await test.update({ isPublished });
        await CacheUtils.invalidateCache('tests');
        return { id: test.id, isPublished: test.isPublished };
    }

    async deleteTest(id) {
        const test = await Test.findByPk(id);
        if (!test) throw ApiError.notFound('Тест не найден');
        await test.destroy();
        await CacheUtils.invalidateCache('tests');
        return { success: true };
    }

    // ── Админ: вопросы ────────────────────────────────────────────────────────

    async createQuestion(testId, data) {
        const test = await Test.findByPk(testId);
        if (!test) throw ApiError.notFound('Тест не найден');

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

        return this._getQuestionWithOptions(question.id);
    }

    async updateQuestion(id, data) {
        const question = await Question.findByPk(id);
        if (!question) throw ApiError.notFound('Вопрос не найден');

        await question.update({
            typeId:        data.typeId        ?? question.typeId,
            text:          data.text          ?? question.text,
            points:        data.points        ?? question.points,
            order:         data.order         ?? question.order,
            allowMultiple: data.allowMultiple ?? question.allowMultiple,
            caseSensitive: data.caseSensitive ?? question.caseSensitive,
            tolerance:     data.tolerance     !== undefined ? data.tolerance : question.tolerance,
            codeLanguage:  data.codeLanguage  !== undefined ? data.codeLanguage : question.codeLanguage,
            starterCode:   data.starterCode   !== undefined ? data.starterCode  : question.starterCode,
            funcName:      data.funcName      !== undefined ? data.funcName     : question.funcName,
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

        return this._getQuestionWithOptions(id);
    }

    async deleteQuestion(id) {
        const question = await Question.findByPk(id);
        if (!question) throw ApiError.notFound('Вопрос не найден');
        await question.destroy();
        return { success: true };
    }

    async reorderQuestions(testId, orderedIds) {
        // orderedIds: [5, 3, 1, 7] — новый порядок id вопросов
        const updates = orderedIds.map((qId, idx) =>
            Question.update({ order: idx }, { where: { id: qId, testId } })
        );
        await Promise.all(updates);
        return { success: true };
    }

    // ── Пользователь: список и прохождение ───────────────────────────────────

    async getPublishedTests() {
        const key = CacheUtils.generateCacheKey('tests', 'published', {});
        const cached = await CacheUtils.getCache(key);
        if (cached) return cached;

        const tests = await Test.findAll({
            where: { isPublished: true },
            include: [
                { model: Question, as: 'questions', attributes: ['id'] },
                { model: Topic,    as: 'topic',     attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        const result = tests.map(t => ({
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
        await CacheUtils.setCache(key, TTL.PUBLISHED_TESTS, result);
        return result;
    }

    async getPublishedTestById(id) {
        const cacheKey = CacheUtils.generateCacheKey('tests', 'byId', { id });
        const cached = await CacheUtils.getCache(cacheKey);
        if (cached) return cached;

        const test = await Test.findOne({
            where: { id, isPublished: true },
            include: [{
                model: Question,
                as: 'questions',
                include: [
                    { model: QuestionType, as: 'type', attributes: ['id', 'name'] },
                    {
                        model: QuestionOption,
                        as: 'options',
                        // Не отдаём isCorrect пользователю!
                        attributes: ['id', 'text', 'matchPair', 'blankIndex', 'order'],
                    },
                ],
            }],
        });
        if (!test) throw ApiError.notFound('Тест не найден');

        const plain = test.toJSON ? test.toJSON() : test;
        await CacheUtils.setCache(cacheKey, TTL.TEST, plain);
        return plain;
    }

    async startAttempt(testId, userId) {
        const test = await Test.findOne({ where: { id: testId, isPublished: true } });
        if (!test) throw ApiError.notFound('Тест не найден');

        let questions = await Question.findAll({
            where: { testId },
            attributes: ['id', 'points'],
            order: [['order', 'ASC']],
        });

        if (test.questionPoolSize && test.questionPoolSize < questions.length) {
            questions = _shuffle(questions).slice(0, test.questionPoolSize);
        }

        if (test.shuffleQuestions) {
            questions = _shuffle(questions);
        }

        const questionIds = questions.map(q => q.id);
        const maxScore    = questions.reduce((sum, q) => sum + (q.points || 1), 0);

        const attempt = await TestAttempt.create({
            testId,
            userId,
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

    async submitAttempt(attemptId, userId, answers) {
        const attempt = await TestAttempt.findOne({
            where: { id: attemptId, userId },
            include: [{ model: Test, as: 'test' }],
        });
        if (!attempt) throw ApiError.notFound('Попытка не найдена');
        if (attempt.status !== 'active') throw ApiError.badRequest('Попытка уже завершена');

        const now = new Date();

        // Проверяем таймер на бэке
        let status = 'completed';
        if (attempt.test.timeLimitMinutes) {
            const elapsed = (now - new Date(attempt.startedAt)) / 1000 / 60;
            if (elapsed > attempt.test.timeLimitMinutes) status = 'timed_out';
        }

        // Загружаем вопросы с правильными ответами для проверки
        const questions = await Question.findAll({
            where: { testId: attempt.testId },
            include: QUESTION_INCLUDE,
        });

        const questionMap = {};
        for (const q of questions) questionMap[q.id] = q;

        let totalScore = 0;
        const answerRows   = [];
        const answerExtras = []; // selectedOptionIds, matchingAnswer, testCaseResults per answer

        for (const ans of (answers || [])) {
            const question = questionMap[ans.questionId];
            if (!question) continue;

            let isCorrect, points, tcResults = null;
            if (question.type?.name === 'Выполнение кода') {
                const r = await scoreCode(question, ans);
                isCorrect = r.isCorrect; points = r.points; tcResults = r.testCaseResults;
            } else {
                const r = scoreAnswer(question, ans);
                isCorrect = r.isCorrect; points = r.points;
            }
            totalScore += points;

            answerRows.push({
                attemptId,
                questionId:   ans.questionId,
                answerText:   ans.answerText ?? null,
                codeAnswer:   ans.codeAnswer ?? null,
                isCorrect,
                pointsEarned: points,
            });
            answerExtras.push({
                selectedOptionIds: ans.selectedOptionIds ?? null,
                matchingAnswer:    ans.matchingAnswer    ?? null,
                tcResults,
            });
        }

        const createdAnswers = await AttemptAnswer.bulkCreate(answerRows, { returning: true });

        const selectedOptionRows  = [];
        const matchingPairRows    = [];
        const testCaseResultRows  = [];

        for (let i = 0; i < createdAnswers.length; i++) {
            const answerId = createdAnswers[i].id;
            const extra    = answerExtras[i];

            if (extra.selectedOptionIds?.length) {
                extra.selectedOptionIds.forEach(optionId => {
                    selectedOptionRows.push({ answerId, optionId });
                });
            }

            if (extra.matchingAnswer) {
                Object.entries(extra.matchingAnswer).forEach(([optionId, matchPair]) => {
                    matchingPairRows.push({ answerId, optionId: Number(optionId), matchPair });
                });
            }

            if (extra.tcResults?.length) {
                extra.tcResults.forEach((tc, j) => {
                    testCaseResultRows.push({
                        answerId,
                        position:       j,
                        input:          tc.input          ?? null,
                        expectedOutput: tc.expectedOutput,
                        actualOutput:   tc.actualOutput   ?? null,
                        passed:         tc.passed,
                        isHidden:       tc.isHidden,
                        timedOut:       tc.timedOut,
                        error:          tc.error          ?? null,
                    });
                });
            }
        }

        await Promise.all([
            selectedOptionRows.length ? AnswerSelectedOption.bulkCreate(selectedOptionRows)   : null,
            matchingPairRows.length   ? AnswerMatchingPair.bulkCreate(matchingPairRows)       : null,
            testCaseResultRows.length ? AnswerTestCaseResult.bulkCreate(testCaseResultRows)   : null,
        ]);
        await attempt.update({ status, finishedAt: now, score: parseFloat(totalScore.toFixed(4)) });

        return {
            attemptId,
            status,
            score:    attempt.score,
            maxScore: attempt.maxScore,
            percent:  attempt.maxScore > 0
                ? Math.round((attempt.score / attempt.maxScore) * 100)
                : 0,
        };
    }

    async getMyAttempts(testId, userId) {
        return TestAttempt.findAll({
            where: { testId, userId },
            attributes: ['id', 'startedAt', 'finishedAt', 'status', 'score', 'maxScore'],
            order: [['startedAt', 'DESC']],
        });
    }

    async getAttemptResult(attemptId, userId) {
        const attempt = await TestAttempt.findOne({
            where: { id: attemptId, userId },
            include: [
                { model: Test, as: 'test', attributes: ['id', 'title', 'timeLimitMinutes', 'showCorrectAnswers'] },
                {
                    model: AttemptAnswer,
                    as: 'answers',
                    include: [
                        { model: Question,            as: 'question',         include: QUESTION_INCLUDE },
                        { model: AnswerSelectedOption, as: 'selectedOptions',  attributes: ['optionId'] },
                        { model: AnswerMatchingPair,   as: 'matchingPairs',   attributes: ['optionId', 'matchPair'] },
                        { model: AnswerTestCaseResult, as: 'testCaseResultRows', attributes: { exclude: ['id', 'answerId'] } },
                    ],
                },
            ],
        });
        if (!attempt) throw ApiError.notFound('Попытка не найдена');

        const result = attempt.toJSON();
        result.answers = result.answers.map(ans => ({
            id:           ans.id,
            questionId:   ans.questionId,
            answerText:   ans.answerText,
            codeAnswer:   ans.codeAnswer,
            isCorrect:    ans.isCorrect,
            pointsEarned: ans.pointsEarned,
            question:     ans.question,
            selectedOptionIds: ans.selectedOptions?.length
                ? ans.selectedOptions.map(o => o.optionId)
                : null,
            matchingAnswer: ans.matchingPairs?.length
                ? Object.fromEntries(ans.matchingPairs.map(p => [String(p.optionId), p.matchPair]))
                : null,
            testCaseResults: ans.testCaseResultRows?.length
                ? [...ans.testCaseResultRows]
                    .sort((a, b) => a.position - b.position)
                    .map(({ position, ...rest }) => rest)
                : null,
        }));

        return result;
    }

    // ── Запуск кода вопроса ───────────────────────────────────────────────────

    async previewCodeQuestion(questionId, code, language) {
        const question = await this._getQuestionWithOptions(questionId);
        if (!question) throw ApiError.notFound('Вопрос не найден');

        const testCases = (question.testCases ?? [])
            .filter(tc => !tc.isHidden)
            .sort((a, b) => a.order - b.order);

        if (testCases.length === 0) return { results: [] };

        let langConfig = harnessConfig[language];
        let runCode    = code;

        if (!langConfig) throw ApiError.badRequest(`Язык '${language}' не поддерживается`);

        const compileError = (msg) =>
            ({ results: testCases.map(tc => ({ id: tc.id, input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: null, passed: false, timedOut: false, error: msg })) });

        if (language === 'typescript') {
            try {
                const ts = require('typescript');
                runCode    = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
                langConfig = harnessConfig.javascript;
            } catch (e) { return compileError(`Ошибка TypeScript: ${e.message}`); }
        }

        if (language === 'coffeescript') {
            try {
                const coffee = require('coffeescript');
                runCode    = coffee.compile(code, { bare: true });
                langConfig = harnessConfig.javascript;
            } catch (e) { return compileError(`Ошибка CoffeeScript: ${e.message}`); }
        }

        const runner = new DockerRunner();

        if (question.funcName) {
            // Харнесс-режим
            const formattedTests = testCases.map((tc, idx) => ({
                id:       tc.id,
                title:    `Test ${idx + 1}`,
                expected: safeParse(tc.expectedOutput),
                args:     safeParse(tc.input ?? '[]'),
            }));
            const harnessCode = langConfig.template(question.funcName, formattedTests, []);
            const execResult  = await runner.run(langConfig, runCode, harnessCode, 10000);
            const testResults = execResult.testResults ?? [];

            if (!execResult.success && testResults.length === 0) {
                return compileError(execResult.error?.details ?? 'Ошибка выполнения');
            }

            const results = testCases.map((tc, idx) => {
                const tr  = testResults.find(r => r.id === tc.id) ?? testResults[idx];
                const ok  = tr?.status === 'success';
                return {
                    id:             tc.id,
                    input:          tc.input,
                    expectedOutput: tc.expectedOutput,
                    actualOutput:   tr ? JSON.stringify(tr.actual) : null,
                    passed:         ok,
                    timedOut:       false,
                    error:          tr?.status === 'error' ? tr.actual : null,
                };
            });
            return { results };
        }

        // Stdin-режим
        const results = [];
        for (const tc of testCases) {
            const result   = await runner.runRaw(langConfig, runCode, 10000, tc.input ?? null);
            const actual   = (result.output ?? '').trim();
            const expected = (tc.expectedOutput ?? '').trim();
            const ok       = !result.timedOut && !result.error && actual === expected;
            results.push({
                id:             tc.id,
                input:          tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput:   result.output,
                passed:         ok,
                timedOut:       result.timedOut ?? false,
                error:          result.error ?? null,
            });
        }
        return { results };
    }

    async runTestCode(code, language, stdinInput = null) {
        let langConfig = harnessConfig[language];
        let runCode    = code;

        if (!langConfig) throw ApiError.badRequest(`Язык '${language}' не поддерживается`);

        if (language === 'typescript') {
            try {
                const ts = require('typescript');
                runCode    = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
                langConfig = harnessConfig.javascript;
            } catch (e) {
                return { output: '', error: `Ошибка компиляции TypeScript: ${e.message}`, timedOut: false };
            }
        }

        if (language === 'coffeescript') {
            try {
                const coffee = require('coffeescript');
                runCode    = coffee.compile(code, { bare: true });
                langConfig = harnessConfig.javascript;
            } catch (e) {
                return { output: '', error: `Ошибка компиляции CoffeeScript: ${e.message}`, timedOut: false };
            }
        }

        const runner = new DockerRunner();
        return runner.runRaw(langConfig, runCode, 10000, stdinInput);
    }

    // ── Жалобы ────────────────────────────────────────────────────────────────

    async getReportReasons() {
        const { ReportReason } = require('../models');
        const rows = await ReportReason.findAll({ order: [['id', 'ASC']] });
        return rows.map(r => ({ id: r.id, name: r.name }));
    }

    async reportTest(userId, testId, reasonId, reasonText) {
        const { Report } = require('../models');
        return await Report.create({
            userId,
            testId,
            challengeId: null,
            reasonId:    reasonId    || null,
            reasonText:  reasonText  || null,
        });
    }

    // ── Отзывы ────────────────────────────────────────────────────────────────

    async getTestReviews(testId, query = {}) {
        const { Review } = require('../models');
        const page     = query.page     ? Number(query.page)     : 1;
        const pageSize = query.pageSize ? Number(query.pageSize) : 5;
        const sort     = query.sort     || 'newest';
        const offset   = (page - 1) * pageSize;

        let order = [];
        switch (sort) {
            case 'oldest':  order = [['createdAt', 'ASC']];  break;
            case 'highest': order = [['rating', 'DESC'], ['createdAt', 'DESC']]; break;
            case 'lowest':  order = [['rating', 'ASC'],  ['createdAt', 'DESC']]; break;
            default:        order = [['createdAt', 'DESC']]; break;
        }

        const { rows, count } = await Review.findAndCountAll({
            where: { testId },
            include: [{ model: User, as: 'user', attributes: ['id', 'username'] }],
            order,
            limit: pageSize,
            offset,
            distinct: true,
        });

        const avgResult = await Review.findOne({
            where: { testId },
            attributes: [[fn('AVG', col('rating')), 'avgRating']],
            raw: true,
        });

        return {
            reviews: rows.map(r => r.toJSON()),
            pagination: { total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) },
            avgRating: parseFloat(avgResult?.avgRating) || 0,
        };
    }

    async leaveTestReview(userId, testId, content, rating) {
        const { Review } = require('../models');
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

    // ── Приватные хелперы ─────────────────────────────────────────────────────

    async _getQuestionWithOptions(id) {
        return Question.findByPk(id, { include: QUESTION_INCLUDE });
    }
}

module.exports = new TestService();
