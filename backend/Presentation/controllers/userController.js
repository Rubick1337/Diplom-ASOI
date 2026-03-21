const UserRepositorySequelize = require('../../Data/repository/UserRepositorySequelize');
const UserService = require('../../Application/services/UserService');
const TokenService = require('../../Application/services/TokenService');
const sequelize = require('../../Data/config/dbConfig');
const {
    HistoryChallenges,
    Challenge,
    Topic,
    User,
    ReportChallenge,
    ReportReason,
    Notification,
} = require('../../Data/models');
const { fn, col, literal, Op } = require('sequelize');

const ApiError = require('../ErrorExtend/ApiError');
const AIService = require('../../Application/services/AIService');
const { client: redisClient } = require('../../Data/config/redisConfig');

const userRepository = new UserRepositorySequelize();
const userService = new UserService(userRepository);

const GUIDE_TTL = 60 * 60 * 24 * 30;

async function getTopicGuide(topicName) {
    const key = `topic_guide:${topicName.toLowerCase()}`;
    try {
        const cached = await redisClient.get(key);
        if (cached) return JSON.parse(cached);
    } catch (_) {}

    try {
        const guide = await AIService.generateTopicGuide(topicName);
        try { await redisClient.setEx(key, GUIDE_TTL, JSON.stringify(guide)); } catch (_) {}
        return guide;
    } catch (e) {
        console.error(`generateTopicGuide failed for "${topicName}":`, e.message);
        return null;
    }
}

class UserController {
    async registration(req, res, next) {
        try {
            const rawData = {
                username: req.body.username,
                password: req.body.password,
                email: req.body.email,
                role: req.body.role ?? 3,
            };

            const result = await userService.register(rawData);

            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 30 * 60 * 1000
            });

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 10 * 24 * 60 * 60 * 1000
            });

            return res.status(201).json({
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            });
        } catch (e) {
            console.error('registration error:', e);

            if (e.details) {
                return res.status(400).json({ message: 'Validation error', errors: e.details });
            }

            if (e.message && e.message.includes('почтой')) {
                return res.status(409).json({ message: e.message });
            }

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async login(req, res, next) {
        try {
            const loginValue = req.body.login || req.body.email || req.body.username;

            const rawData = {
                login: loginValue,
                password: req.body.password
            };

            const result = await userService.login(rawData);

            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 30 * 60 * 1000
            });

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 10 * 24 * 60 * 60 * 1000
            });

            return res.json({
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            });
        } catch (e) {
            console.error('login error:', e);

            if (e.details) {
                return res.status(400).json({ message: 'Validation error', errors: e.details });
            }

            if (e.message && e.message.includes('Неверный логин или пароль')) {
                return res.status(401).json({ message: e.message });
            }

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            const result = await userService.refresh({ refreshToken });

            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 30 * 60 * 1000
            });

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 10 * 24 * 60 * 60 * 1000
            });

            return res.json({
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            });
        } catch (e) {
            console.error('refresh error:', e);

            if (e.message && e.message.toLowerCase().includes('refresh token')) {
                return res.status(401).json({ message: e.message });
            }

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async logout(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            await userService.logout(refreshToken);

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            return res.json({ message: 'Logged out' });
        } catch (e) {
            console.error('logout error:', e);

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await userService.getAll(req.query);

            return res.json(result);
        } catch (e) {
            console.error('getAll error:', e);

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getProfile(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });

            const userId = payload.id;
            const user = await User.findByPk(userId, { attributes: ['id', 'username', 'email', 'experience', 'rating'] });
            if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

            const allAttempts = await HistoryChallenges.findAll({
                where: { userId },
                attributes: ['challengeId', 'status', 'executionTimeMs', 'language', 'createdAt'],
                include: [{ model: Challenge, as: 'challenge', attributes: ['id'], include: [{ model: Topic, as: 'topics', through: { attributes: [] }, attributes: ['name'] }] }],
                raw: true,
                nest: true,
            });

            const totalAttempts = allAttempts.length;

            const solvedIds = new Set(
                allAttempts.filter(r => r.status === 'success').map(r => r.challengeId)
            );
            const solvedCount = solvedIds.size;

            const attemptedIds = new Set(allAttempts.map(r => r.challengeId));
            const successRate = attemptedIds.size > 0
                ? Math.round((solvedCount / attemptedIds.size) * 100)
                : 0;

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const solvedTodayIds = new Set(
                allAttempts
                    .filter(r => r.status === 'success' && new Date(r.createdAt) >= todayStart)
                    .map(r => r.challengeId)
            );
            const solvedToday = solvedTodayIds.size;

            const successTimes = allAttempts
                .filter(r => r.status === 'success' && r.executionTimeMs != null)
                .map(r => r.executionTimeMs);
            const avgTime = successTimes.length > 0
                ? Math.round(successTimes.reduce((a, b) => a + b, 0) / successTimes.length)
                : null;

            const langMap = {};
            for (const r of allAttempts) {
                langMap[r.language] = (langMap[r.language] || 0) + 1;
            }
            const languages = Object.entries(langMap)
                .map(([lang, count]) => ({ lang, count }))
                .sort((a, b) => b.count - a.count);

            const allTopics = await Topic.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] });

            const topicMap = {};
            for (const r of allAttempts) {
                const topicName = r.challenge?.topic?.name;
                if (!topicName) continue;
                const cId = r.challengeId;
                if (!topicMap[topicName]) topicMap[topicName] = { attempted: new Set(), solved: new Set() };
                topicMap[topicName].attempted.add(cId);
                if (r.status === 'success') topicMap[topicName].solved.add(cId);
            }
            const topics = Object.entries(topicMap).map(([name, { attempted, solved }]) => ({
                name,
                attempted: attempted.size,
                solved: solved.size,
                rate: Math.round((solved.size / attempted.size) * 100),
            })).sort((a, b) => b.attempted - a.attempted);

            return res.json({
                user: user.toJSON(),
                stats: { totalAttempts, solvedCount, successRate, avgTime, solvedToday },
                languages,
                topics,
                allTopics: allTopics.map(t => t.name),
            });
        } catch (e) {
            console.error('getProfile error:', e);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getMyHistory(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;

            const { Op } = require('sequelize');
            const page     = Math.max(1, parseInt(req.query.page)     || 1);
            const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
            const offset   = (page - 1) * pageSize;

            const where = { userId };
            if (req.query.status   && req.query.status   !== 'all') where.status   = req.query.status;
            if (req.query.language && req.query.language !== 'all') where.language = req.query.language;

            const challengeWhere = req.query.search
                ? { name: { [Op.iLike]: `%${req.query.search}%` } }
                : undefined;

            const { rows, count } = await HistoryChallenges.findAndCountAll({
                where,
                attributes: ['id', 'challengeId', 'status', 'language', 'executionTimeMs', 'testsPassed', 'testsTotal', 'code', 'createdAt'],
                include: [{
                    model: Challenge,
                    as: 'challenge',
                    attributes: ['id', 'name'],
                    ...(challengeWhere ? { where: challengeWhere, required: true } : { required: false }),
                }],
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset,
                distinct: true,
            });

            return res.json({
                items: rows.map(r => r.toJSON()),
                total: count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
            });
        } catch (e) {
            console.error('getMyHistory error:', e);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getMyChallenges(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;

            const page     = Math.max(1, parseInt(req.query.page)     || 1);
            const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
            const offset   = (page - 1) * pageSize;

            const where = { createdByUserId: userId };
            if (req.query.difficulty && req.query.difficulty !== 'all') {
                where.difficulty = parseInt(req.query.difficulty);
            }
            if (req.query.search) {
                where.name = { [Op.iLike]: `%${req.query.search}%` };
            }

            const { rows, count } = await Challenge.findAndCountAll({
                where,
                attributes: ['id', 'name', 'description', 'difficulty', 'isHidden', 'createdAt'],
                include: [{ model: Topic, as: 'topics', through: { attributes: [] }, attributes: ['id', 'name'] }],
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset,
                distinct: true,
            });

            return res.json({
                items: rows.map(r => r.toJSON()),
                total: count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
            });
        } catch (e) {
            console.error('getMyChallenges error:', e);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getMyReports(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;

            const page     = Math.max(1, parseInt(req.query.page)     || 1);
            const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
            const offset   = (page - 1) * pageSize;

            const where = { userId };
            if (req.query.status && req.query.status !== 'all') {
                where.status = req.query.status;
            }

            const challengeWhere = req.query.search
                ? { name: { [Op.iLike]: `%${req.query.search}%` } }
                : undefined;

            const { rows, count } = await ReportChallenge.findAndCountAll({
                where,
                include: [
                    {
                        model: Challenge,
                        as: 'challenge',
                        attributes: ['id', 'name'],
                        ...(challengeWhere ? { where: challengeWhere, required: true } : { required: false }),
                    },
                    { model: ReportReason, as: 'reason', attributes: ['id', 'name'] },
                ],
                order: [['createdAt', 'DESC']],
                limit: pageSize,
                offset,
                distinct: true,
            });

            return res.json({
                items: rows.map(r => r.toJSON()),
                total: count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
            });
        } catch (e) {
            console.error('getMyReports error:', e);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async updateUser(req, res, next) {
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res.status(400).json({ message: "Некорректный [id] пользователя" });
            }

            const updatedUser = await userService.updateUser(id, req.body);

            return res.json(updatedUser);
        } catch (e) {
            console.error('updateUser error:', e);

            if (e.details) {
                return res.status(400).json({ message: 'Validation error', errors: e.details });
            }

            if (e.message === 'Пользователь не найден') {
                return res.status(404).json({ message: e.message });
            }

            if (ApiError && ApiError.Internal) {
                return next(ApiError.Internal(e.message));
            }

            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getActivityHeatmap(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;

            const year = parseInt(req.query.year) || new Date().getFullYear();
            const since = new Date(year, 0, 1);
            const until = new Date(year, 11, 31, 23, 59, 59);

            const rows = await HistoryChallenges.findAll({
                where: { userId, createdAt: { [Op.gte]: since, [Op.lte]: until } },
                attributes: ['createdAt'],
                raw: true,
            });

            const countMap = {};
            for (const r of rows) {
                const date = new Date(r.createdAt).toISOString().slice(0, 10);
                countMap[date] = (countMap[date] || 0) + 1;
            }

            return res.json({ days: countMap });
        } catch (e) {
            console.error('getActivityHeatmap error:', e);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getLearningPlan(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;

            const allTopics = await Topic.findAll({ order: [['name', 'ASC']] });

            const allChallenges = await Challenge.findAll({
                where: { isHidden: false },
                attributes: ['id', 'name', 'difficulty'],
                include: [{ model: Topic, as: 'topics', attributes: ['id'], through: { attributes: [] } }],
            });

            const history = await HistoryChallenges.findAll({
                where: { userId },
                attributes: ['challengeId', 'status', 'createdAt'],
                raw: true,
            });

            const solvedIds    = new Set(history.filter(h => h.status === 'success').map(h => h.challengeId));
            const attemptedIds = new Set(history.map(h => h.challengeId));

            const lastAttemptByChallenge = {};
            for (const h of history) {
                const t = new Date(h.createdAt).getTime();
                if (!lastAttemptByChallenge[h.challengeId] || t > lastAttemptByChallenge[h.challengeId]) {
                    lastAttemptByChallenge[h.challengeId] = t;
                }
            }

            const solvedChallenges = allChallenges.filter(c => solvedIds.has(c.id));
            const avgDifficulty = solvedChallenges.length > 0
                ? solvedChallenges.reduce((sum, c) => sum + (c.difficulty || 1), 0) / solvedChallenges.length
                : 2;

            const diffLow  = Math.max(1,  Math.round(avgDifficulty) - 1);
            const diffHigh = Math.min(10, Math.round(avgDifficulty) + 2);

            const topicChallengesMap = {};
            for (const c of allChallenges) {
                const cData = c.toJSON ? c.toJSON() : c;
                for (const t of (cData.topics || [])) {
                    if (!topicChallengesMap[t.id]) topicChallengesMap[t.id] = [];
                    topicChallengesMap[t.id].push(cData);
                }
            }

            const now = Date.now();

            const attemptCountByChallenge = {};
            for (const h of history) {
                attemptCountByChallenge[h.challengeId] = (attemptCountByChallenge[h.challengeId] || 0) + 1;
            }

            const topicProgress = allTopics.map(topic => {
                const challenges = topicChallengesMap[topic.id] || [];
                if (challenges.length === 0) return null;

                const total       = challenges.length;
                const attempted   = challenges.filter(c => attemptedIds.has(c.id)).length;
                const solved      = challenges.filter(c => solvedIds.has(c.id)).length;
                const rate        = attempted > 0 ? Math.round((solved / attempted) * 100) : 0;
                const masteryRate = Math.round((solved / total) * 100);

                let status;
                if (solved === 0 && attempted === 0) status = 'not_started';
                else if (masteryRate >= 80)          status = 'mastered';
                else                                 status = 'in_progress';

                const nextChallenges = challenges
                    .filter(c => !solvedIds.has(c.id))
                    .sort((a, b) => {
                        const aIn = a.difficulty >= diffLow && a.difficulty <= diffHigh ? 0 : 1;
                        const bIn = b.difficulty >= diffLow && b.difficulty <= diffHigh ? 0 : 1;
                        if (aIn !== bIn) return aIn - bIn;
                        return a.difficulty - b.difficulty;
                    })
                    .slice(0, 3)
                    .map(c => ({ id: c.id, name: c.name, difficulty: c.difficulty }));

                const inRangeCount = challenges
                    .filter(c => !solvedIds.has(c.id) && c.difficulty >= diffLow && c.difficulty <= diffHigh)
                    .length;

                const lastMs = challenges
                    .map(c => lastAttemptByChallenge[c.id] || 0)
                    .reduce((a, b) => Math.max(a, b), 0);
                const daysSinceLastAttempt = lastMs > 0
                    ? Math.floor((now - lastMs) / (1000 * 60 * 60 * 24))
                    : null;

                const failedHardCount = challenges.filter(c =>
                    !solvedIds.has(c.id) &&
                    (attemptCountByChallenge[c.id] || 0) >= 3
                ).length;

                return {
                    id: topic.id, name: topic.name,
                    total, attempted, solved, rate, masteryRate, status,
                    nextChallenges, inRangeCount, daysSinceLastAttempt, failedHardCount,
                };
            }).filter(Boolean);

            const activeScored = topicProgress
                .filter(t => t.status !== 'mastered' && t.nextChallenges.length > 0)
                .map(t => {
                    let score = 0;
                    let type, reason;
                    const factors = [];

                    if (t.status === 'in_progress') {
                        if (t.rate < 60) {
                            type   = 'improve';
                            score  = 100 + (60 - t.rate);
                            reason = `Успешность ${t.rate}% — нужна практика. Решено ${t.solved} из ${t.total} задач`;
                            factors.push({ positive: false, text: `Успешность ${t.rate}% — низкая, нужна практика` });
                            factors.push({ positive: false, text: `Решено ${t.solved} из ${t.total} задач` });
                        } else {
                            type   = 'continue';
                            score  = 70 + Math.round(t.rate * 0.3);
                            reason = `Хороший прогресс ${t.rate}%! Осталось ${t.total - t.solved} задач до освоения`;
                            factors.push({ positive: true,  text: `Успешность ${t.rate}% — хороший прогресс` });
                            factors.push({ positive: false, text: `Осталось ${t.total - t.solved} задач до освоения` });
                        }
                    } else {
                        type   = 'start';
                        score  = 40;
                        reason = `Новая тема — ${t.total} задач доступно`;
                        factors.push({ positive: true, text: `Новая тема — ${t.total} задач доступно` });
                    }

                    if (t.inRangeCount > 0) {
                        const diffBonus = Math.min(t.inRangeCount * 8, 24);
                        score += diffBonus;
                        factors.push({ positive: true, text: `${t.inRangeCount} задач подходящей сложности (${diffLow}–${diffHigh})` });
                    } else {
                        factors.push({ positive: false, text: `Нет задач в вашем диапазоне сложности (${diffLow}–${diffHigh})` });
                    }

                    if (t.status === 'in_progress' && t.daysSinceLastAttempt !== null) {
                        if (t.daysSinceLastAttempt > 7) {
                            const recencyBonus = Math.min(Math.floor(t.daysSinceLastAttempt / 7) * 5, 20);
                            score += recencyBonus;
                            reason += `. Не решал ${t.daysSinceLastAttempt} дней — самое время вернуться`;
                            factors.push({ positive: false, text: `Не решал ${t.daysSinceLastAttempt} дней — пора вернуться` });
                        } else if (t.daysSinceLastAttempt <= 3) {
                            factors.push({ positive: true, text: `Недавно решал — тема ещё свежа в памяти` });
                        }
                    }

                    if (t.masteryRate >= 70 && t.masteryRate < 80) {
                        const almostBonus = 30 + Math.round((t.masteryRate - 70) * 2);
                        score += almostBonus;
                        reason += `. Осталось совсем немного — ${t.total - t.solved} задач до освоения!`;
                        factors.push({ positive: true, text: `Почти освоено (${t.masteryRate}%) — дожми до конца!` });
                    }

                    if (t.failedHardCount >= 3) {
                        const penalty = Math.min(t.failedHardCount * 15, 45);
                        score -= penalty;
                        factors.push({ positive: false, text: `${t.failedHardCount} задач с многократными неудачами — тема пока слишком тяжёлая` });
                    } else if (t.failedHardCount > 0) {
                        factors.push({ positive: false, text: `${t.failedHardCount} задач с повторными неудачами — стоит повторить основы` });
                    }

                    return { type, topicId: t.id, topicName: t.name, reason, score, factors, challenges: t.nextChallenges.slice(0, 2) };
                })
                .sort((a, b) => b.score - a.score);

            const REVIEW_THRESHOLD = 7;
            const reviewScored = topicProgress
                .filter(t => t.status === 'mastered' && t.daysSinceLastAttempt !== null && t.daysSinceLastAttempt >= REVIEW_THRESHOLD)
                .map(t => {
                    const days  = t.daysSinceLastAttempt;

                    const score = Math.min(45 + Math.floor(days / 7) * 5, 55);
                    const factors = [
                        { positive: true,  text: `Тема освоена — закрепи результат` },
                        { positive: false, text: `Не решал ${days} дней — материал начинает забываться` },
                    ];

                    const reviewChallenges = (topicChallengesMap[t.id] || [])
                        .filter(c => solvedIds.has(c.id))
                        .sort((a, b) => b.difficulty - a.difficulty)
                        .slice(0, 2)
                        .map(c => ({ id: c.id, name: c.name, difficulty: c.difficulty }));
                    return {
                        type: 'review',
                        topicId: t.id,
                        topicName: t.name,
                        reason: `Освоена, но не решал ${days} дней — время повторить, чтобы не забыть`,
                        score,
                        factors,
                        challenges: reviewChallenges,
                    };
                })
                .sort((a, b) => b.score - a.score);

            const recommendations = [
                ...activeScored.slice(0, 4),
                ...reviewScored.slice(0, 1),
            ].sort((a, b) => b.score - a.score).slice(0, 5);

            const mastered   = topicProgress.filter(t => t.status === 'mastered').length;
            const inProgress = topicProgress.filter(t => t.status === 'in_progress').length;
            const notStarted = topicProgress.filter(t => t.status === 'not_started').length;

            return res.json({
                topicProgress,
                recommendations,
                overallProgress: { mastered, inProgress, notStarted, total: topicProgress.length },
            });
        } catch (e) {
            console.error('getLearningPlan error:', e);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async generateTopicGuide(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });

            const { topicName, preferences, forceRegenerate } = req.body;
            if (!topicName?.trim()) return res.status(400).json({ message: 'topicName обязателен' });

            const key = `topic_guide:${topicName.toLowerCase()}`;

            if (forceRegenerate) {
                try { await redisClient.del(key); } catch (_) {}
            } else {

                try {
                    const cached = await redisClient.get(key);
                    if (cached) return res.json(JSON.parse(cached));
                } catch (_) {}
            }

            const guide = await AIService.generateTopicGuide(topicName, preferences?.trim() || null);
            if (!guide) return res.status(503).json({ message: 'AI недоступен, попробуйте позже' });

            if (!preferences?.trim()) {
                try { await redisClient.setEx(key, GUIDE_TTL, JSON.stringify(guide)); } catch (_) {}
            }

            return res.json(guide);
        } catch (e) {
            console.error('generateTopicGuide error:', e);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getNotifications(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;
            const notifications = await Notification.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
                limit: 50,
                raw: true,
            });
            res.json(notifications);
        } catch (e) { next(e); }
    }

    async markNotificationRead(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;
            const notif = await Notification.findOne({ where: { id: req.params.id, userId } });
            if (!notif) return res.status(404).json({ message: 'Not found' });
            await notif.update({ isRead: true });
            res.json({ id: notif.id, isRead: true });
        } catch (e) { next(e); }
    }

    async deleteNotification(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;
            const notif = await Notification.findOne({ where: { id: req.params.id, userId } });
            if (!notif) return res.status(404).json({ message: 'Not found' });
            await notif.destroy();
            res.json({ success: true });
        } catch (e) { next(e); }
    }

    async deleteAllNotifications(req, res, next) {
        try {
            const token = req.cookies?.accessToken || (req.headers.authorization || '').replace('Bearer ', '');
            const payload = TokenService.validateAccessToken(token);
            if (!payload) return res.status(401).json({ message: 'Не авторизован' });
            const userId = payload.id;
            await Notification.destroy({ where: { userId } });
            res.json({ success: true });
        } catch (e) { next(e); }
    }
}

module.exports = new UserController();
