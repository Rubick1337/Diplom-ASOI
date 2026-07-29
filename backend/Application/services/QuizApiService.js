const https = require('https');
const { Mistral } = require('@mistralai/mistralai');
const { Test, Question, QuestionOption, QuestionType } = require('../../Data/models');
const ApiError = require('../../Presentation/ErrorExtend/ApiError');

const QUIZ_API_BASE = 'https://quizapi.io/api/v1/questions';

function fetchRaw(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (res.statusCode !== 200) {
                        reject(new Error(data?.error || data?.message || `HTTP ${res.statusCode}`));
                    } else {
                        resolve(data);
                    }
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function translateQuestions(questions) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return questions;

    const mistral = new Mistral({ apiKey });

    const payload = questions.map(q => ({
        text:    q.text,
        answers: (q.answers || []).filter(a => a.text).map(a => a.text),
    }));

    const prompt = `Переведи вопросы теста по программированию с английского на русский.
Верни ТОЛЬКО валидный JSON-массив в точно таком же формате — без markdown, без пояснений.
Каждый объект: {"text": "...", "answers": ["...", ...]}.

${JSON.stringify(payload)}`;

    try {
        const response = await mistral.chat.complete({
            model:    'mistral-small-latest',
            messages: [{ role: 'user', content: prompt }],
        });

        const raw = (response.choices[0]?.message?.content ?? '').trim().replace(/^```json\s*/i, '').replace(/```$/,'');
        const translated = JSON.parse(raw);

        // Мёржим переведённые тексты обратно в оригинальные объекты
        return questions.map((q, i) => {
            const tr = translated[i];
            if (!tr) return q;
            const answersRu = tr.answers || [];
            return {
                ...q,
                text: tr.text || q.text,
                answers: (q.answers || []).map((a, j) => ({
                    ...a,
                    text: answersRu[j] || a.text,
                })),
            };
        });
    } catch (e) {
        console.warn('[QuizAPI] Перевод не удался, используем оригинал:', e.message);
        return questions;
    }
}

function mapQuestion(raw, questionTypes, order) {
    const answers = Array.isArray(raw.answers) ? raw.answers : [];
    const text    = raw.text || raw.question || 'Вопрос';

    if (raw.type === 'TRUE_FALSE') {
        const truefalseType = questionTypes.find(t => t.name === 'Да / Нет')
            || questionTypes.find(t => t.name === 'Множественный выбор');
        const options = answers
            .filter(a => a.text)
            .map((a, i) => ({
                text:      a.text.toLowerCase() === 'true' ? 'Верно' : 'Неверно',
                isCorrect: !!a.isCorrect,
                order:     i,
            }));
        return { typeId: truefalseType.id, text, points: 1, order, options };
    }

    // MULTIPLE_CHOICE и всё остальное → Множественный выбор
    const multichoiceType = questionTypes.find(t => t.name === 'Множественный выбор')
        || questionTypes[0];
    const correctCount = answers.filter(a => a.isCorrect).length;
    const options = answers
        .filter(a => a.text)
        .map((a, i) => ({ text: a.text, isCorrect: !!a.isCorrect, order: i }));

    return {
        typeId:        multichoiceType.id,
        text,
        points:        1,
        order,
        allowMultiple: correctCount > 1,
        options,
    };
}

async function importFromQuizApi({ apiKey, tags, difficulty, limit, title, adminId }) {
    if (!apiKey) throw ApiError.badRequest('QUIZ_API_KEY не задан в .env');

    const params = new URLSearchParams({ api_key: apiKey, limit: String(Math.min(Number(limit) || 10, 20)) });
    if (tags)       params.append('tags', tags);
    if (difficulty) params.append('difficulty', difficulty);

    let rawQuestions;
    try {
        rawQuestions = await fetchRaw(`${QUIZ_API_BASE}?${params}`);
    } catch (e) {
        throw ApiError.badRequest(`Ошибка Quiz API: ${e.message}`);
    }

    // Ответ может быть оёрнут в { success, data: [...] }
    if (rawQuestions && !Array.isArray(rawQuestions) && Array.isArray(rawQuestions.data)) {
        rawQuestions = rawQuestions.data;
    }

    if (!Array.isArray(rawQuestions)) {
        const msg = rawQuestions?.error || rawQuestions?.message || JSON.stringify(rawQuestions).slice(0, 300);
        throw ApiError.badRequest(`Quiz API вернул неожиданный ответ: ${msg}`);
    }
    if (rawQuestions.length === 0) {
        throw ApiError.badRequest('Quiz API не вернул вопросы — попробуйте другой тег или уберите фильтр сложности.');
    }

    rawQuestions = await translateQuestions(rawQuestions);

    const questionTypes = await QuestionType.findAll();
    if (!questionTypes.length) throw new Error('Типы вопросов не загружены в БД');

    const testTitle = title?.trim()
        || `Quiz API: ${tags || 'programming'} (${new Date().toLocaleDateString('ru-RU')})`;

    const test     = await Test.create({ title: testTitle, isPublished: false, createdBy: adminId });
    const imported = [];
    const skipped  = [];

    for (let i = 0; i < rawQuestions.length; i++) {
        try {
            const mapped  = mapQuestion(rawQuestions[i], questionTypes, i);
            const options = mapped.options;
            delete mapped.options;

            const question = await Question.create({ testId: test.id, ...mapped });

            if (options.length > 0) {
                await QuestionOption.bulkCreate(options.map(o => ({ ...o, questionId: question.id })));
            }
            imported.push(question.id);
        } catch (e) {
            skipped.push({ index: i, error: e.message });
        }
    }

    return {
        testId:         test.id,
        title:          testTitle,
        imported:       imported.length,
        skipped:        skipped.length,
        skippedDetails: skipped,
    };
}

module.exports = { importFromQuizApi };
