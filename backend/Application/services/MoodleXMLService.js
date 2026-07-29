/**
 * MoodleXMLService
 * Экспорт тестов в Moodle XML и импорт обратно.
 * Использует xml2js для парсинга.
 */

const xml2js = require('xml2js');
const fs     = require('fs');
const path   = require('path');
const JSZip  = require('jszip');
const { Test, Question, QuestionOption, QuestionType } = require('../../Data/models');
const ApiError = require('../../Presentation/ErrorExtend/ApiError');

const PUBLIC_DIR = path.join(__dirname, '../../public');

// Русское имя типа → ключ Moodle XML
const MOODLE_KEY = {
    'Множественный выбор':  'multichoice',
    'Да / Нет':             'truefalse',
    'Короткий ответ':       'shortanswer',
    'Числовой ответ':       'numerical',
    'Заполни пропуск':      'cloze',
    'Сопоставление':        'matching',
    'Информационный блок':  'description',
    'Выполнение кода':      'code',
};

// Ключ Moodle XML → русское имя типа (для импорта)
const MOODLE_RU = Object.fromEntries(Object.entries(MOODLE_KEY).map(([ru, key]) => [key, ru]));
// essay → Множественный выбор (fallback при импорте)
MOODLE_RU.essay = 'Множественный выбор';

const xmlBuilder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    cdata:  true,
    renderOpts: { pretty: true, indent: '  ' },
});

// ─── Вспомогательные функции ──────────────────────────────────────────────────

const TRANSLIT_MAP = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};

function transliterate(str) {
    return str
        .toLowerCase()
        .split('')
        .map(c => TRANSLIT_MAP[c] ?? c)
        .join('')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 60);
}

// Извлечь текст из поля xml2js (может быть строкой, массивом или { _: '...' })
function getText(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return getText(val[0]);
    if (typeof val === 'object') return getText(val._ ?? val.text ?? '');
    return String(val);
}

// Получить атрибут из xml2js-объекта (хранится в поле $)
function getAttr(obj, attr) {
    return obj?.$ ?.[attr] ?? null;
}

// ─── ЭКСПОРТ ─────────────────────────────────────────────────────────────────

// Допустимые значения fraction в Moodle (точные строки, которые принимает импорт)
const MOODLE_POSITIVE_FRACTIONS = {
    1: '100', 2: '50', 3: '33.33333', 4: '25', 5: '20',
    6: '16.66667', 7: '14.28571', 8: '12.5', 9: '11.11111', 10: '10',
};

function buildMultichoice(q) {
    const isCorrectCount = q.options.filter(o => o.isCorrect).length || 1;
    const positiveFraction = q.allowMultiple
        ? (MOODLE_POSITIVE_FRACTIONS[isCorrectCount] ?? '100')
        : '100';
    return {
        single:         [String(!q.allowMultiple)],
        shuffleanswers: ['1'],
        answer: q.options.map(o => ({
            $:    { fraction: o.isCorrect ? positiveFraction : '0', format: 'html' },
            text: [{ _: o.text }],
        })),
    };
}

function buildTrueFalse(q) {
    const correct = q.options.find(o => o.isCorrect);
    const isTrue  = correct?.text?.toLowerCase().includes('верно') || correct?.text?.toLowerCase() === 'true';
    return {
        answer: [
            { $: { fraction: String(isTrue ? 100 : 0) }, text: ['true']  },
            { $: { fraction: String(isTrue ? 0 : 100) }, text: ['false'] },
        ],
    };
}

function buildShortAnswer(q) {
    const correct = q.options.filter(o => o.isCorrect);
    return {
        usecase: [q.caseSensitive ? '1' : '0'],
        answer:  correct.map(o => ({
            $:    { fraction: '100' },
            text: [o.text],
        })),
    };
}

function buildNumerical(q) {
    const correct   = q.options.find(o => o.isCorrect);
    const tolerance = q.tolerance ?? 0;
    return {
        answer: [{
            $:         { fraction: '100' },
            text:      [correct?.text ?? '0'],
            tolerance: [String(tolerance)],
        }],
    };
}

function buildEssay() {
    return {
        responseformat:     ['editor'],
        responserequired:   ['1'],
        responsefieldlines: ['15'],
    };
}

function buildCode(q) {
    return {
        responseformat:     ['monospaced'],
        responserequired:   ['0'],
        responsefieldlines: ['20'],
        // Подсказка для преподавателя внутри description
        generalfeedback: [{
            $:    { format: 'html' },
            text: [{ _: `[Вопрос с кодом. Язык: ${q.codeLanguage ?? 'не указан'}. Код не выполняется в Moodle.]${q.starterCode ? '\nНачальный код:\n' + q.starterCode : ''}` }],
        }],
    };
}

function buildMatching(q) {
    return {
        subquestion: q.options.filter(o => o.matchPair).map(o => ({
            $:      { format: 'html' },
            text:   [{ _: o.text }],
            answer: [{ text: [o.matchPair] }],
        })),
    };
}

function buildCloze(q) {
    // Превращаем [[N]] → {N:SHORTANSWER:~=answer1~=answer2}
    const byBlank = {};
    for (const opt of q.options.filter(o => o.isCorrect)) {
        const idx = String(opt.blankIndex);
        if (!byBlank[idx]) byBlank[idx] = [];
        byBlank[idx].push(opt.text);
    }
    const text = q.text.replace(/\[\[(\d+)\]\]/g, (_, n) => {
        const answers = (byBlank[n] || ['']).map(a => `~=${a}`).join('');
        return `{${n}:SHORTANSWER:${answers}}`;
    });
    // Для cloze questiontext переопределяется ниже
    return { __clozeText: text };
}

function questionToXmlObj(q, imageData) {
    const typeName = q.type?.name ?? '';
    let moodleType = MOODLE_KEY[typeName] ?? 'essay';
    let extra = {};
    let questionText = q.text;

    switch (typeName) {
        case 'Множественный выбор': extra = buildMultichoice(q); break;
        case 'Да / Нет':            extra = buildTrueFalse(q);   break;
        case 'Короткий ответ':      extra = buildShortAnswer(q); break;
        case 'Числовой ответ':      extra = buildNumerical(q);   break;
        case 'Сопоставление':       extra = buildMatching(q);    break;
        case 'Информационный блок': break;
        case 'Выполнение кода':
            moodleType = 'essay';
            extra = buildCode(q);
            break;
        case 'Заполни пропуск': {
            moodleType = 'cloze';
            const res = buildCloze(q);
            questionText = res.__clozeText;
            break;
        }
        default:
            moodleType = 'essay';
            extra = buildEssay();
    }

    // Если есть картинка — добавляем в текст вопроса и вставляем base64-файл
    const questiontextNode = { $: { format: 'html' }, text: [{ _: questionText }] };
    if (imageData) {
        const { filename, base64 } = imageData;
        questiontextNode.text = [{ _: `${questionText}<br/><img src="@@PLUGINFILE@@/${filename}" alt=""/>` }];
        questiontextNode.file = [{ $: { name: filename, path: '/', encoding: 'base64' }, _: base64 }];
    }

    return {
        $:            { type: moodleType },
        name:         [{ text: [q.text.slice(0, 80)] }],
        questiontext: [questiontextNode],
        defaultgrade: [String(q.points)],
        ...extra,
    };
}

async function exportTest(testId) {
    const test = await Test.findByPk(testId, {
        include: [{
            model: Question,
            as: 'questions',
            include: [
                { model: QuestionType,   as: 'type'    },
                { model: QuestionOption, as: 'options', order: [['order', 'ASC']] },
            ],
        }],
    });
    if (!test) throw ApiError.notFound('Тест не найден');

    const sorted  = [...test.questions].sort((a, b) => a.order - b.order);
    const hasCode = sorted.some(q => q.type?.name === 'Выполнение кода');
    const hasImages = sorted.some(q => q.imageUrl);

    // Читаем картинки с диска и кодируем в base64
    const imageDataMap = {};
    for (const q of sorted) {
        if (!q.imageUrl) continue;
        try {
            const filePath = path.join(PUBLIC_DIR, q.imageUrl.replace(/^\//, ''));
            const buffer   = fs.readFileSync(filePath);
            imageDataMap[q.id] = {
                filename: path.basename(filePath),
                base64:   buffer.toString('base64'),
            };
        } catch (_) { /* файл не найден — пропускаем */ }
    }

    const quizObj = {
        quiz: {
            question: sorted.map(q => questionToXmlObj(q, imageDataMap[q.id] ?? null)),
        },
    };

    const xml      = xmlBuilder.buildObject(quizObj);
    const slug     = transliterate(test.title) || `test_${testId}`;
    const basename = `${slug}_${Date.now()}`;

    // Всегда отдаём ZIP: внутри questions.xml с embedded base64 картинками
    const zip = new JSZip();
    zip.file('questions.xml', xml);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    return { zipBuffer, hasCode, hasImages, filename: `${basename}.zip` };
}

// ─── ИМПОРТ ───────────────────────────────────────────────────────────────────

function parseClozeText(rawText) {
    // {N:SHORTANSWER:~=answer1~=answer2} → [[N]] + options[]
    const options = [];
    let order = 0;
    const text = rawText.replace(/\{(\d+):SHORTANSWER:([^}]+)\}/gi, (_, n, answers) => {
        const blankIndex = parseInt(n, 10);
        for (const a of answers.split('~=').filter(Boolean)) {
            options.push({ text: a.trim(), isCorrect: true, blankIndex, order: order++ });
        }
        return `[[${n}]]`;
    });
    return { text, options };
}

function parseQuestionNode(node, questionTypes, order) {
    const type   = getAttr(node, 'type') ?? 'essay';
    const text   = getText(node.questiontext?.[0]?.text ?? node.questiontext);
    const points = parseFloat(getText(node.defaultgrade)) || 1;

    const ruName     = MOODLE_RU[type] ?? 'Множественный выбор';
    const typeRecord = questionTypes.find(t => t.name === ruName)
        ?? questionTypes.find(t => t.name === 'Множественный выбор');

    const base = { typeId: typeRecord.id, text, points, order, options: [] };

    switch (type) {
        case 'multichoice': {
            base.allowMultiple = getText(node.single) === 'false';
            base.options = (node.answer || []).map((a, i) => ({
                text:      getText(a.text),
                isCorrect: parseFloat(getAttr(a, 'fraction') ?? '0') > 0,
                order:     i,
            }));
            break;
        }

        case 'truefalse': {
            base.options = (node.answer || []).map((a, i) => {
                const rawText = getText(a.text);
                const labelRu = rawText.toLowerCase() === 'true' ? 'Верно' : 'Неверно';
                return { text: labelRu, isCorrect: parseFloat(getAttr(a, 'fraction') ?? '0') > 0, order: i };
            });
            break;
        }

        case 'shortanswer': {
            base.caseSensitive = getText(node.usecase) === '1';
            base.options = (node.answer || [])
                .filter(a => parseFloat(getAttr(a, 'fraction') ?? '0') > 0)
                .map((a, i) => ({ text: getText(a.text), isCorrect: true, order: i }));
            break;
        }

        case 'numerical': {
            const correct = (node.answer || []).find(a => parseFloat(getAttr(a, 'fraction') ?? '0') > 0);
            if (correct) {
                base.tolerance = parseFloat(getText(correct.tolerance)) || 0;
                base.options   = [{ text: getText(correct.text), isCorrect: true, order: 0 }];
            }
            break;
        }

        case 'cloze': {
            const { text: parsedText, options } = parseClozeText(text);
            base.text    = parsedText;
            base.options = options;
            break;
        }

        case 'matching': {
            base.options = (node.subquestion || []).map((sub, i) => ({
                text:      getText(sub.text),
                matchPair: getText(sub.answer?.[0]?.text ?? sub.answer),
                isCorrect: true,
                order:     i,
            }));
            break;
        }

        // essay, description, code (импортируется как essay) — без опций
        default: break;
    }

    return base;
}

async function importTest(xmlString, adminId) {
    let parsed;
    try {
        parsed = await xml2js.parseStringPromise(xmlString, {
            explicitArray: true,
            trim:          true,
            explicitCharkey: false,
        });
    } catch (e) {
        throw ApiError.badRequest(`Невалидный XML: ${e.message}`);
    }

    const root = parsed?.quiz;
    if (!root) throw ApiError.badRequest('Файл не является Moodle Quiz XML (нет тега <quiz>)');

    const questionNodes = root.question || [];
    if (!questionNodes.length) throw ApiError.badRequest('В файле не найдено ни одного вопроса');

    const questionTypes = await QuestionType.findAll();
    if (!questionTypes.length) throw ApiError.Internal('Типы вопросов не загружены');

    const title = `Импорт ${new Date().toLocaleDateString('ru-RU')}`;

    const test = await Test.create({ title, isPublished: false, createdBy: adminId });

    const imported = [];
    const skipped  = [];

    for (let i = 0; i < questionNodes.length; i++) {
        try {
            const parsed  = parseQuestionNode(questionNodes[i], questionTypes, i);
            const options = parsed.options;
            delete parsed.options;

            const question = await Question.create({ testId: test.id, ...parsed });

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
        title:          test.title,
        imported:       imported.length,
        skipped:        skipped.length,
        skippedDetails: skipped,
    };
}

module.exports = { exportTest, importTest };
