const { Op, fn, col } = require('sequelize');

function _models() { return require('../../Data/models'); }

// IDs соответствуют seed-данным в init.sql
const A = {
    FIRST_SOLVE:    1,
    SOLVE_5:        2,
    SOLVE_25:       3,
    SOLVE_100:      4,
    SOLVE_500:      5,
    HARD_CHALLENGE: 6,
    NIGHTMARE:      7,
    SPEED_DEMON:    8,
    POLYGLOT:       9,
    MULTILINGUAL:   10,
    JS_MASTER:      11,
    PY_MASTER:      12,
    NIGHT_OWL:      13,
    SPEED_RUN:      14,
};

async function _unlock(userId, achievementId) {
    const { UserAchievement, Notification, Achievement } = _models();
    const [, created] = await UserAchievement.findOrCreate({
        where: { userId, achievementId }, defaults: { userId, achievementId },
    });
    if (!created) return null;

    const def = await Achievement.findByPk(achievementId, { raw: true });
    if (!def) return null;

    await Notification.create({
        userId,
        title:   `Достижение: ${def.title}`,
        message: JSON.stringify({ desc: def.desc, rarity: def.rarity, imageFilename: def.imageFilename }),
        type:    'achievement',
    }).catch(e => console.error('[Achievement] notification error:', e.message));

    return def;
}

async function check(userId, { difficulty, executionTimeMs, language }) {
    try {
        const { HistoryChallenges } = _models();
        const unlocked = [];

        const solvedCount = await HistoryChallenges.count({
            where: { userId, status: 'success' }, distinct: true, col: 'challengeId',
        });

        for (const { count, id } of [
            { count: 1,   id: A.FIRST_SOLVE },
            { count: 5,   id: A.SOLVE_5     },
            { count: 25,  id: A.SOLVE_25    },
            { count: 100, id: A.SOLVE_100   },
            { count: 500, id: A.SOLVE_500   },
        ]) {
            if (solvedCount >= count) { const a = await _unlock(userId, id); if (a) unlocked.push(a); }
        }

        if (difficulty >= 8)  { const a = await _unlock(userId, A.HARD_CHALLENGE); if (a) unlocked.push(a); }
        if (difficulty >= 10) { const a = await _unlock(userId, A.NIGHTMARE);      if (a) unlocked.push(a); }

        if (executionTimeMs !== undefined && executionTimeMs < 100) {
            const a = await _unlock(userId, A.SPEED_DEMON); if (a) unlocked.push(a);
        }

        const langRows = await HistoryChallenges.findAll({
            where: { userId, status: 'success' }, attributes: ['language'], group: ['language'], raw: true,
        });
        const langs = langRows.map(r => r.language);

        if (langs.length >= 3) { const a = await _unlock(userId, A.POLYGLOT); if (a) unlocked.push(a); }
        if (['javascript','typescript','python','cpp','csharp','php','coffeescript'].every(l => langs.includes(l))) {
            const a = await _unlock(userId, A.MULTILINGUAL); if (a) unlocked.push(a);
        }

        const langCount = await HistoryChallenges.count({
            where: { userId, status: 'success', language }, distinct: true, col: 'challengeId',
        });
        if (language === 'javascript' && langCount >= 10) { const a = await _unlock(userId, A.JS_MASTER); if (a) unlocked.push(a); }
        if (language === 'python'     && langCount >= 10) { const a = await _unlock(userId, A.PY_MASTER); if (a) unlocked.push(a); }

        const hour = new Date().getHours();
        if (hour >= 2 && hour < 4) { const a = await _unlock(userId, A.NIGHT_OWL); if (a) unlocked.push(a); }

        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todaySolves = await HistoryChallenges.count({
            where: { userId, status: 'success', createdAt: { [Op.gte]: todayStart } }, distinct: true, col: 'challengeId',
        });
        if (todaySolves >= 5) { const a = await _unlock(userId, A.SPEED_RUN); if (a) unlocked.push(a); }

        return unlocked;
    } catch (e) {
        console.error('[AchievementService] check error:', e.message);
        return [];
    }
}

async function getUserAchievements(userId) {
    const { Achievement, UserAchievement, User } = _models();
    const [allDefs, userRows, totalUsers, countRows] = await Promise.all([
        Achievement.findAll({ order: [['id', 'ASC']], raw: true }),
        UserAchievement.findAll({ where: { userId }, raw: true }),
        User.count(),
        UserAchievement.findAll({
            attributes: ['achievementId', [fn('COUNT', col('id')), 'cnt']],
            group: ['achievementId'], raw: true,
        }),
    ]);
    const byId     = Object.fromEntries(userRows.map(r => [r.achievementId, r]));
    const countMap = Object.fromEntries(countRows.map(c => [c.achievementId, Number(c.cnt)]));
    return allDefs.map(def => {
        const row     = byId[def.id];
        const holders = countMap[def.id] || 0;
        const percent = totalUsers > 0 ? Math.round((holders / totalUsers) * 100) : 0;
        return { ...def, unlockedAt: row ? row.unlockedAt : null, percent, holders };
    });
}

async function getAllAchievements() {
    const { Achievement, UserAchievement, User } = _models();
    const defs = await Achievement.findAll({ order: [['id', 'ASC']], raw: true });
    const totalUsers = await User.count();
    const counts = await UserAchievement.findAll({
        attributes: ['achievementId', [fn('COUNT', col('userId')), 'holders']],
        group: ['achievementId'],
        raw: true,
    });
    const countMap = {};
    for (const c of counts) countMap[c.achievementId] = Number(c.holders);
    return defs.map(d => {
        const holders = countMap[d.id] ?? 0;
        return { ...d, unlockedCount: holders, percent: totalUsers > 0 ? Math.round((holders / totalUsers) * 100) : 0 };
    });
}

async function createAchievement(data) {
    return _models().Achievement.create(data);
}

async function updateAchievement(id, data) {
    const row = await _models().Achievement.findByPk(id);
    if (!row) throw new Error('Not found');
    return row.update(data);
}

async function deleteAchievement(id) {
    const row = await _models().Achievement.findByPk(id);
    if (!row) throw new Error('Not found');
    await row.destroy();
}

const SEED = [
    { id: 1,  title: 'Первая кровь',    desc: 'Решите свою первую задачу',             rarity: 'common',   imageFilename: 'first_solve.svg'   },
    { id: 2,  title: 'Пятёрка',         desc: 'Решите 5 задач',                        rarity: 'common',   imageFilename: 'solve_5.svg'       },
    { id: 3,  title: 'Дробитель задач', desc: 'Решите 25 задач',                       rarity: 'uncommon', imageFilename: 'solve_25.svg'      },
    { id: 4,  title: 'Клуб сотни',      desc: 'Решите 100 задач',                      rarity: 'rare',     imageFilename: 'solve_100.svg'     },
    { id: 5,  title: 'Легенда',         desc: 'Решите 500 задач',                      rarity: 'epic',     imageFilename: 'solve_500.svg'     },
    { id: 6,  title: 'Закалённый',      desc: 'Решите задачу со сложностью 8+',        rarity: 'uncommon', imageFilename: 'hard_challenge.svg'},
    { id: 7,  title: 'Кошмар',          desc: 'Решите задачу максимальной сложности',  rarity: 'rare',     imageFilename: 'nightmare.svg'     },
    { id: 8,  title: 'Демон скорости',  desc: 'Решите задачу менее чем за 100 мс',     rarity: 'uncommon', imageFilename: 'speed_demon.svg'   },
    { id: 9,  title: 'Полиглот',        desc: 'Решите задачи на 3 разных языках',      rarity: 'uncommon', imageFilename: 'polyglot.svg'      },
    { id: 10, title: 'Мультилингв',     desc: 'Решите задачи на всех 7 языках',        rarity: 'rare',     imageFilename: 'multilingual.svg'  },
    { id: 11, title: 'JS-мастер',       desc: 'Решите 10 задач на JavaScript',         rarity: 'common',   imageFilename: 'js_master.svg'     },
    { id: 12, title: 'Питонист',        desc: 'Решите 10 задач на Python',             rarity: 'common',   imageFilename: 'py_master.svg'     },
    { id: 13, title: 'Ночная сова',     desc: 'Решите задачу между 2:00 и 4:00 ночи', rarity: 'uncommon', imageFilename: 'night_owl.svg'     },
    { id: 14, title: 'Спидран',         desc: 'Решите 5 задач за один день',           rarity: 'rare',     imageFilename: 'speed_run.svg'     },
];

async function seedDefaultAchievements() {
    try {
        const { Achievement } = _models();
        if ((await Achievement.count()) > 0) return;
        await Achievement.bulkCreate(SEED, { ignoreDuplicates: true });
        const db = require('../../Data/config/dbConfig');
        await db.query(`SELECT setval('"Achievements_id_seq"', 14)`);
        console.log('[AchievementService] seeded 14 achievements');
    } catch (e) {
        console.error('[AchievementService] seed error:', e.message);
    }
}

module.exports = { check, getUserAchievements, getAllAchievements, createAchievement, updateAchievement, deleteAchievement, seedDefaultAchievements };
