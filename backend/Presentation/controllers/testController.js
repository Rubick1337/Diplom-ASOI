const path           = require('path');
const fs             = require('fs');
const testService    = require('../../Application/services/TestService');
const moodleService  = require('../../Application/services/MoodleXMLService');
const quizApiService = require('../../Application/services/QuizApiService');
const TokenService   = require('../../Application/services/TokenService');
const ApiError       = require('../ErrorExtend/ApiError');
const { Question }   = require('../../Data/models');

function getUser(req) {
    const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
    return TokenService.validateAccessToken(token);
}

class TestController {

    // ── Типы вопросов ──────────────────────────────────────────────────────────

    async getQuestionTypes(req, res, next) {
        try {
            const types = await testService.getQuestionTypes();
            res.json(types);
        } catch (e) { next(e); }
    }

    async runCode(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const { code, language, stdinInput } = req.body;
            if (!code || !language) return res.status(400).json({ message: 'code и language обязательны' });
            const result = await testService.runTestCode(code, language, stdinInput ?? null);
            res.json(result);
        } catch (e) { next(e); }
    }

    async previewCode(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const { code, language, questionId } = req.body;
            if (!code || !language || !questionId) return res.status(400).json({ message: 'code, language и questionId обязательны' });
            const result = await testService.previewCodeQuestion(questionId, code, language);
            res.json(result);
        } catch (e) { next(e); }
    }

    // ── Админ: тесты ──────────────────────────────────────────────────────────

    async getAdminTests(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const tests = await testService.getAdminTests();
            res.json(tests);
        } catch (e) { next(e); }
    }

    async getAdminTest(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const test = await testService.getAdminTestById(Number(req.params.id));
            res.json(test);
        } catch (e) { next(e); }
    }

    async createTest(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            if (!req.body.title?.trim()) return res.status(400).json({ message: 'Название обязательно' });
            const test = await testService.createTest(req.body, user.id);
            res.status(201).json(test);
        } catch (e) { next(e); }
    }

    async updateTest(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const test = await testService.updateTest(Number(req.params.id), req.body);
            res.json(test);
        } catch (e) { next(e); }
    }

    async publishTest(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const { isPublished } = req.body;
            const result = await testService.publishTest(Number(req.params.id), !!isPublished);
            res.json(result);
        } catch (e) { next(e); }
    }

    async deleteTest(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const result = await testService.deleteTest(Number(req.params.id));
            res.json(result);
        } catch (e) { next(e); }
    }

    // ── Админ: вопросы ────────────────────────────────────────────────────────

    async createQuestion(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            if (!req.body.typeId) return res.status(400).json({ message: 'typeId обязателен' });
            if (!req.body.text?.trim()) return res.status(400).json({ message: 'Текст вопроса обязателен' });
            const question = await testService.createQuestion(Number(req.params.id), req.body);
            res.status(201).json(question);
        } catch (e) { next(e); }
    }

    async updateQuestion(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const question = await testService.updateQuestion(Number(req.params.questionId), req.body);
            res.json(question);
        } catch (e) { next(e); }
    }

    async deleteQuestion(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const result = await testService.deleteQuestion(Number(req.params.questionId));
            res.json(result);
        } catch (e) { next(e); }
    }

    async exportMoodle(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const { zipBuffer, hasCode, hasImages, filename } = await moodleService.exportTest(Number(req.params.id));
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            if (hasCode)   res.setHeader('X-Has-Code-Questions', 'true');
            if (hasImages) res.setHeader('X-Has-Images', 'true');
            res.send(zipBuffer);
        } catch (e) { next(e); }
    }

    async uploadQuestionImage(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });

            const questionId = Number(req.params.questionId);
            const question   = await Question.findByPk(questionId);
            if (!question) return res.status(404).json({ message: 'Вопрос не найден' });

            // Удаляем старое изображение если было
            if (question.imageUrl) {
                const oldPath = path.join(__dirname, '../../../public', question.imageUrl.replace(/^\//, ''));
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }

            const imageUrl = `/question-images/${req.file.filename}`;
            await question.update({ imageUrl });
            res.json({ imageUrl });
        } catch (e) { next(e); }
    }

    async deleteQuestionImage(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });

            const questionId = Number(req.params.questionId);
            const question   = await Question.findByPk(questionId);
            if (!question) return res.status(404).json({ message: 'Вопрос не найден' });

            if (question.imageUrl) {
                const filePath = path.join(__dirname, '../../../public', question.imageUrl.replace(/^\//, ''));
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                await question.update({ imageUrl: null });
            }
            res.json({ ok: true });
        } catch (e) { next(e); }
    }

    async importMoodle(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            if (!req.file) return res.status(400).json({ message: 'XML-файл обязателен' });
            const xmlString = req.file.buffer.toString('utf-8');
            const result = await moodleService.importTest(xmlString, user.id);
            res.status(201).json(result);
        } catch (e) { next(e); }
    }

    async importQuizApi(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const { tags, difficulty, limit, title } = req.body;
            const apiKey = process.env.QUIZ_API_KEY;
            if (!apiKey) return res.status(500).json({ message: 'QUIZ_API_KEY не настроен на сервере' });
            const result = await quizApiService.importFromQuizApi({ apiKey, tags, difficulty, limit, title, adminId: user.id });
            res.status(201).json(result);
        } catch (e) { next(e); }
    }

    async reorderQuestions(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const { orderedIds } = req.body;
            if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds должен быть массивом' });
            const result = await testService.reorderQuestions(Number(req.params.id), orderedIds);
            res.json(result);
        } catch (e) { next(e); }
    }

    // ── Пользователь ──────────────────────────────────────────────────────────

    async getPublishedTests(req, res, next) {
        try {
            const tests = await testService.getPublishedTests();
            res.json(tests);
        } catch (e) { next(e); }
    }

    async getPublishedTest(req, res, next) {
        try {
            const test = await testService.getPublishedTestById(Number(req.params.id));
            res.json(test);
        } catch (e) { next(e); }
    }

    async startAttempt(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const result = await testService.startAttempt(Number(req.params.id), user.id);
            res.status(201).json(result);
        } catch (e) { next(e); }
    }

    async submitAttempt(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const { answers } = req.body;
            const result = await testService.submitAttempt(Number(req.params.attemptId), user.id, answers);
            res.json(result);
        } catch (e) { next(e); }
    }

    async getMyAttempts(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const attempts = await testService.getMyAttempts(Number(req.params.id), user.id);
            res.json(attempts);
        } catch (e) { next(e); }
    }

    async getAttemptResult(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const result = await testService.getAttemptResult(Number(req.params.attemptId), user.id);
            res.json(result);
        } catch (e) { next(e); }
    }

    async getReportReasons(req, res, next) {
        try {
            const reasons = await testService.getReportReasons();
            res.json(reasons);
        } catch (e) { next(e); }
    }

    async createReport(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const testId = Number(req.params.id);
            const { reasonId, reasonText } = req.body;
            const report = await testService.reportTest(user.id, testId, reasonId, reasonText);
            res.status(201).json(report);
        } catch (e) { next(e); }
    }

    async getReviews(req, res, next) {
        try {
            const data = await testService.getTestReviews(Number(req.params.id), req.query);
            res.json(data);
        } catch (e) { next(e); }
    }

    async createReview(req, res, next) {
        try {
            const user = getUser(req);
            if (!user) return res.status(401).json({ message: 'Не авторизован' });
            const { content, rating } = req.body;
            const review = await testService.leaveTestReview(user.id, Number(req.params.id), content, rating);
            res.status(201).json(review);
        } catch (e) { next(e); }
    }
}

module.exports = new TestController();
