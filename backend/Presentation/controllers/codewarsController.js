const CODEWARS_BASE = 'https://www.codewars.com/api/v1';

/** Курированный каталог популярных kata (статические данные) */
const CATALOG = [
    // 8 kyu — Beginner
    { slug:'multiply',                              name:'Multiply',                                    rankId:-8, rankName:'8 kyu', rankColor:'white',  tags:['Fundamentals','Mathematics'],               languages:['javascript','python','java','cpp','csharp','php'] },
    { slug:'even-or-odd',                           name:'Even or Odd',                                 rankId:-8, rankName:'8 kyu', rankColor:'white',  tags:['Fundamentals','Mathematics'],               languages:['javascript','python','java','cpp','csharp'] },
    { slug:'opposite-number',                       name:'Opposite number',                             rankId:-8, rankName:'8 kyu', rankColor:'white',  tags:['Fundamentals','Mathematics'],               languages:['javascript','python','java','cpp'] },
    { slug:'convert-a-number-to-a-string',          name:'Convert a Number to a String!',               rankId:-8, rankName:'8 kyu', rankColor:'white',  tags:['Fundamentals'],                             languages:['javascript','python','java','cpp'] },
    { slug:'grasshopper-summation',                 name:'Grasshopper - Summation',                     rankId:-8, rankName:'8 kyu', rankColor:'white',  tags:['Fundamentals','Mathematics'],               languages:['javascript','python','java','cpp','csharp'] },
    { slug:'remove-string-spaces',                  name:'Remove String Spaces',                        rankId:-8, rankName:'8 kyu', rankColor:'white',  tags:['Fundamentals','Strings'],                   languages:['javascript','python','java','cpp','csharp'] },

    // 7 kyu — Easy
    { slug:'sum-of-positive',                       name:'Sum of positive',                             rankId:-7, rankName:'7 kyu', rankColor:'white',  tags:['Fundamentals','Arrays'],                    languages:['javascript','python','java','cpp','csharp'] },
    { slug:'vowel-count',                           name:'Vowel Count',                                 rankId:-7, rankName:'7 kyu', rankColor:'white',  tags:['Fundamentals','Strings'],                   languages:['javascript','python','java','cpp','csharp'] },
    { slug:'mumbling',                              name:'Mumbling',                                    rankId:-7, rankName:'7 kyu', rankColor:'white',  tags:['Fundamentals','Strings'],                   languages:['javascript','python','java','cpp'] },
    { slug:'is-a-number-prime',                     name:'Is a number prime?',                          rankId:-7, rankName:'7 kyu', rankColor:'white',  tags:['Mathematics','Algorithms'],                 languages:['javascript','python','java','cpp','csharp'] },
    { slug:'sum-of-odd-numbers',                    name:'Sum of odd numbers',                          rankId:-7, rankName:'7 kyu', rankColor:'white',  tags:['Fundamentals','Mathematics'],               languages:['javascript','python','java','cpp'] },
    { slug:'two-to-one',                            name:'Two to One',                                  rankId:-7, rankName:'7 kyu', rankColor:'white',  tags:['Fundamentals','Strings'],                   languages:['javascript','python','java','cpp','csharp'] },
    { slug:'string-ends-with',                      name:'String ends with?',                           rankId:-7, rankName:'7 kyu', rankColor:'white',  tags:['Fundamentals','Strings'],                   languages:['javascript','python','java','cpp'] },
    { slug:'largest-elements',                      name:'Largest Elements',                            rankId:-7, rankName:'7 kyu', rankColor:'white',  tags:['Fundamentals','Arrays','Sorting'],           languages:['javascript','python','java','cpp'] },

    // 6 kyu — Medium
    { slug:'find-the-odd-int',                      name:'Find the odd int',                            rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Fundamentals','Arrays','Bits'],             languages:['javascript','python','java','cpp','csharp'] },
    { slug:'disemvowel-trolls',                     name:'Disemvowel Trolls',                           rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Fundamentals','Strings'],                   languages:['javascript','python','java','cpp','csharp'] },
    { slug:'persistent-bugger',                     name:'Persistent Bugger',                           rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Fundamentals','Mathematics'],               languages:['javascript','python','java','cpp'] },
    { slug:'your-order-please',                     name:'Your Order, Please',                          rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Sorting','Strings'],                        languages:['javascript','python','java','cpp','csharp'] },
    { slug:'count-the-number-of-duplicates',        name:'Count the number of duplicates',              rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Fundamentals','Strings'],                   languages:['javascript','python','java','cpp'] },
    { slug:'moving-zeros-to-the-end',               name:'Moving Zeros To The End',                     rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Arrays','Fundamentals'],                    languages:['javascript','python','java','cpp','csharp'] },
    { slug:'valid-parentheses',                     name:'Valid Parentheses',                           rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Algorithms','Strings','Data Structures'],   languages:['javascript','python','java','cpp'] },
    { slug:'equal-sides-of-an-array',               name:'Equal Sides Of An Array',                     rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Fundamentals','Arrays'],                    languages:['javascript','python','java','cpp','csharp'] },
    { slug:'find-the-parity-outlier',               name:'Find The Parity Outlier',                     rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Arrays','Fundamentals'],                    languages:['javascript','python','java','cpp'] },
    { slug:'digital-root',                          name:'Sum of Digits / Digital Root',                rankId:-6, rankName:'6 kyu', rankColor:'yellow', tags:['Mathematics','Algorithms'],                 languages:['javascript','python','java','cpp','csharp'] },

    // 5 kyu — Medium-Hard
    { slug:'rgb-to-hex-conversion',                 name:'RGB To Hex Conversion',                       rankId:-5, rankName:'5 kyu', rankColor:'yellow', tags:['Algorithms','Mathematics'],                 languages:['javascript','python','java','cpp'] },
    { slug:'the-hashtag-generator',                 name:'The Hashtag Generator',                       rankId:-5, rankName:'5 kyu', rankColor:'yellow', tags:['Strings','Algorithms'],                     languages:['javascript','python','java','cpp'] },
    { slug:'maximum-subarray-sum',                  name:'Maximum subarray sum',                        rankId:-5, rankName:'5 kyu', rankColor:'yellow', tags:['Algorithms','Dynamic Programming'],         languages:['javascript','python','java','cpp','csharp'] },
    { slug:'first-non-repeating-character',         name:'First non-repeating character',               rankId:-5, rankName:'5 kyu', rankColor:'yellow', tags:['Strings','Fundamentals'],                   languages:['javascript','python','java','cpp','csharp'] },
    { slug:'pete-the-baker',                        name:'Pete, the baker',                             rankId:-5, rankName:'5 kyu', rankColor:'yellow', tags:['Fundamentals','Arrays'],                    languages:['javascript','python','java','cpp'] },

    // 4 kyu — Hard
    { slug:'two-sum',                               name:'Two Sum',                                     rankId:-4, rankName:'4 kyu', rankColor:'blue',   tags:['Algorithms','Arrays','Search'],             languages:['javascript','python','java','cpp','csharp'] },
    { slug:'next-bigger-number-with-the-same-digits',name:'Next bigger number with the same digits',   rankId:-4, rankName:'4 kyu', rankColor:'blue',   tags:['Algorithms','Mathematics'],                 languages:['javascript','python','java','cpp'] },
    { slug:'build-a-pile-of-cubes',                 name:'Build a pile of Cubes',                       rankId:-4, rankName:'4 kyu', rankColor:'blue',   tags:['Algebra','Mathematics'],                    languages:['javascript','python','java','cpp','csharp'] },
    { slug:'human-readable-duration-format',        name:'Human Readable Duration Format',              rankId:-4, rankName:'4 kyu', rankColor:'blue',   tags:['Algorithms','Strings','Formatting'],        languages:['javascript','python','java','cpp'] },

    // 3 kyu — Very Hard
    { slug:'make-a-spiral',                         name:'Make a spiral',                               rankId:-3, rankName:'3 kyu', rankColor:'blue',   tags:['Puzzles','Algorithms','Arrays'],             languages:['javascript','python','java','cpp'] },
    { slug:'strip-comments',                        name:'Strip Comments',                              rankId:-3, rankName:'3 kyu', rankColor:'blue',   tags:['Algorithms','Strings','Regular Expressions'],languages:['javascript','python','java','cpp'] },
];

/** Codewars rank.id (-8..−1) → наша сложность (1..10) */
function rankToDifficulty(rankId) {
    if (!rankId) return 5;
    const base = 9 + rankId; // -8→1, -7→2, … -1→8
    return Math.max(1, Math.min(10, base));
}

/** two-sum → twoSum */
function slugToFuncName(slug) {
    if (!slug) return 'solution';
    return slug
        .split('-')
        .filter(Boolean)
        .map((w, i) => i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
}

/**
 * Пробуем вытащить sampleInput / sampleOutput из markdown-описания.
 * Codewars не даёт структурированные примеры через API, но в тексте
 * они встречаются в нескольких стандартных форматах.
 */
function extractSamples(description) {
    if (!description) return { sampleInput: '', sampleOutput: '' };

    // Формат 1: строки вида  Input: ...  /  Output: ...  (любой регистр)
    const inLine  = description.match(/(?:^|[\r\n])[ \t]*(?:##\s*)?(?:Input|STDIN)[:\s]+`?([^\n`\r]+)`?/im);
    const outLine = description.match(/(?:^|[\r\n])[ \t]*(?:##\s*)?(?:Output|Return(?:s)?|Result|STDOUT)[:\s]+`?([^\n`\r]+)`?/im);
    if (inLine && outLine) {
        return { sampleInput: inLine[1].trim(), sampleOutput: outLine[1].trim() };
    }

    // Формат 2: вызов функции в инлайн-коде  `func(arg1, arg2) == expected`
    // или  `func(arg1, arg2) => expected`  или  `func(arg1, arg2) # expected`
    const callMatch = description.match(/`([A-Za-z_]\w*)\(([^)]*)\)\s*(?:==|=>|→|#|-->)\s*([^`\n\r]+)`/);
    if (callMatch) {
        return { sampleInput: callMatch[2].trim(), sampleOutput: callMatch[3].trim() };
    }

    // Формат 3: таблица-пример  | input | output |
    const tableIn  = description.match(/\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|[\r\n]/);
    if (tableIn) {
        // Пропускаем заголовок (содержит слова "input/output")
        const allRows = [...description.matchAll(/\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*\|/g)];
        const dataRow = allRows.find(r =>
            !/input|output|example|param/i.test(r[1]) && !/---/.test(r[1]));
        if (dataRow) {
            return { sampleInput: dataRow[1].trim(), sampleOutput: dataRow[2].trim() };
        }
    }

    return { sampleInput: '', sampleOutput: '' };
}

async function codewarsGet(path) {
    const res = await fetch(`${CODEWARS_BASE}${path}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
        const err = Object.assign(new Error(`Codewars вернул ${res.status}`), { status: res.status });
        throw err;
    }
    return res.json();
}

class CodewarsController {
    /**
     * GET /admin/codewars/catalog?q=&rankId=&tag=&page=&limit=
     * Курированный каталог — без внешних запросов, мгновенно
     */
    catalog(req, res) {
        const { q = '', rankId, tag, page = 0, limit = 12 } = req.query;
        const qLow = q.toLowerCase();

        let items = CATALOG.map(k => ({
            ...k,
            rank:       { id: k.rankId, name: k.rankName, color: k.rankColor },
            difficulty: rankToDifficulty(k.rankId),
            url:        `https://www.codewars.com/kata/${k.slug}`,
            // funcName/sampleInput/sampleOutput загружаются при реальном импорте
            funcName: '', sampleInput: '', sampleOutput: '', description: '', totalCompleted: 0,
        }));

        if (qLow)   items = items.filter(k => k.name.toLowerCase().includes(qLow) || k.tags.some(t => t.toLowerCase().includes(qLow)));
        if (rankId) items = items.filter(k => k.rankId === Number(rankId));
        if (tag)    items = items.filter(k => k.tags.some(t => t.toLowerCase() === tag.toLowerCase()));

        const total   = items.length;
        const pg      = Number(page);
        const lm      = Number(limit);
        const paged   = items.slice(pg * lm, pg * lm + lm);

        return res.json({ data: paged, total, page: pg, limit: lm, totalPages: Math.ceil(total / lm) });
    }


    /**
     * GET /admin/codewars/kata/:id
     * Получить kata по slug или hex-id
     */
    async getKata(req, res) {
        try {
            const { id } = req.params;
            const data = await codewarsGet(`/code-challenges/${encodeURIComponent(id)}`);

            const { sampleInput, sampleOutput } = extractSamples(data.description);

            return res.json({
                id:             data.id,
                name:           data.name,
                slug:           data.slug,
                description:    data.description || '',
                rank:           data.rank || null,
                difficulty:     rankToDifficulty(data.rank?.id),
                tags:           data.tags || [],
                languages:      data.languages || [],
                url:            `https://www.codewars.com/kata/${data.slug}`,
                totalCompleted: data.totalCompleted || 0,
                funcName:       slugToFuncName(data.slug),
                sampleInput,
                sampleOutput,
            });
        } catch (e) {
            const status = e.status || 500;
            return res.status(status).json({ message: e.message || 'Kata не найдена' });
        }
    }
}

module.exports = new CodewarsController();
