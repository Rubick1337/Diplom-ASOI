const { Mistral } = require('@mistralai/mistralai');

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
const MODEL = 'mistral-small-latest';

async function complete(messages, maxTokens = 2048) {
    const response = await client.chat.complete({
        model: MODEL,
        messages,
        maxTokens,
    });
    return response.choices[0]?.message?.content ?? '';
}

class AIService {
    async analyzeCode({ code, language, challengeTitle, challengeDescription, testResults, isSolved }) {
        let testResultsText = '';
        if (testResults && testResults.length > 0) {
            const lines = testResults.map((r, i) => {
                if (r.status === 'success') return `Тест ${i + 1}: ✓ Пройден`;
                const detail = r.actual !== undefined
                    ? ` — ожидалось: ${r.expected}, получено: ${r.actual}`
                    : (r.error ? ` — ошибка: ${r.error}` : '');
                return `Тест ${i + 1}: ✗ Провален${detail}`;
            });
            testResultsText = `\n\nРезультаты тест-кейсов:\n${lines.join('\n')}`;
        }

        const codeBlock = `\`\`\`${language}\n${code}\n\`\`\``;

        const prompt = isSolved
            ? `Ты опытный наставник по программированию.

Задача: ${challengeTitle}
Описание: ${challengeDescription}
Язык: ${language}

Решение пользователя (все тесты пройдены):
${codeBlock}

Пользователь успешно решил задачу. Сделай полный разбор:

1. **Анализ решения** — что хорошо, что можно улучшить (читаемость, производительность, стиль)
2. **Альтернативный подход** — покажи другой вариант решения этой же задачи на ${language}, если он более элегантный или эффективный. Объясни чем он отличается.
3. **Темы для изучения** — перечисли конкретные темы, концепции или алгоритмы, которые стоит изучить глубже, чтобы лучше освоить этот класс задач. Для каждой темы кратко объясни зачем она нужна.`
            : `Ты опытный ментор по программированию.

Задача: ${challengeTitle}
Описание: ${challengeDescription}
Язык: ${language}

Код пользователя:
${codeBlock}
${testResultsText}

Проанализируй код и дай обратную связь. Строгие правила:
- НЕ пиши готовое решение и НЕ показывай правильный код
- Укажи конкретные логические ошибки или проблемы в коде
- Дай направление мышления — что стоит пересмотреть
- Если есть результаты тестов — объясни почему конкретные тесты провалились
- Максимум 4-5 пунктов, будь лаконичным`;

        return complete([{ role: 'user', content: prompt }]);
    }

    async generateTopicGuide(topicName, preferences = null) {
        const preferencesBlock = preferences
            ? `\nПожелания пользователя: "${preferences}"\nУчти их при составлении гайда.\n`
            : '';

        const prompt = `Ты эксперт по алгоритмам и структурам данных.

Тема программирования: "${topicName}"
${preferencesBlock}
Верни ТОЛЬКО валидный JSON без лишнего текста, строго в формате:
{
  "concepts": ["Концепция 1", "Концепция 2", "Концепция 3", "Концепция 4"],
  "path": ["Шаг 1: ...", "Шаг 2: ...", "Шаг 3: ...", "Шаг 4: ..."],
  "related": ["Смежная тема 1", "Смежная тема 2", "Смежная тема 3"]
}

Требования:
- concepts: 4 ключевых концепции или паттерна для этой темы, от простого к сложному
- path: 4 конкретных шага изучения с примерами известных задач (Two Sum, LCS и т.п.)
- related: 3 смежные темы для дальнейшего развития
- Всё строго на русском языке`;

        const text = (await complete([{ role: 'user', content: prompt }])).trim();
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('AI вернул невалидный JSON для гайда');
        return JSON.parse(match[0]);
    }

    async generateChallenge(prompt) {
        const systemPrompt = `Ты — создатель задач по программированию в стиле LeetCode.

ЗАПРОС ПОЛЬЗОВАТЕЛЯ: "${prompt}"

ВАЖНО: Создай задачу СТРОГО по запросу пользователя. Не придумывай другую задачу — реализуй именно то, о чём попросили.

Верни ТОЛЬКО валидный JSON без markdown-блоков, без пояснений, строго в формате:
{
  "name": "Название задачи",
  "difficulty": 3,
  "funcName": "camelCaseName",
  "description": "Подробное условие на русском: что принимает функция, что возвращает, ограничения, примеры",
  "sampleInput": "a=5, b=10",
  "sampleOutput": "15",
  "parameters": [
    {"name": "a", "dataType": "int"},
    {"name": "b", "dataType": "int"}
  ],
  "testCases": [
    {
      "title": "Test 1",
      "expectedOutput": "15",
      "testArgs": [{"value": "5", "order": 0}, {"value": "10", "order": 1}]
    },
    {
      "title": "Test 2",
      "expectedOutput": "30",
      "testArgs": [{"value": "15", "order": 0}, {"value": "15", "order": 1}]
    },
    {
      "title": "Test 3",
      "expectedOutput": "0",
      "testArgs": [{"value": "0", "order": 0}, {"value": "0", "order": 1}]
    }
  ],
  "solution": "function camelCaseName(a, b) {\\n    return a + b;\\n}"
}

Строгие правила:
- Задача должна ТОЧНО соответствовать запросу пользователя
- difficulty: целое число от 1 до 10
- funcName: camelCase, только латинские буквы и цифры, без пробелов
- dataType: только одно из: int, float, string, bool, array, array2d, object
- testCases: минимум 3, максимум 6 тест-кейсов
- значения testArgs для array/array2d/object — валидный JSON-строкой (например "[1,2,3]")
- значения testArgs для int/float/bool/string — просто строка ("42", "3.14", "true", "hello")
- expectedOutput — всегда строка (результат как строка: "42", "true", "[1,2,3]")
- solution — рабочий JavaScript-код функции с именем funcName, который проходит ВСЕ тест-кейсы. Переносы строк экранировать как \\n
- Весь текст (name, description, sampleInput, sampleOutput, title тестов, topics) на русском языке (кроме funcName и имён параметров)`;

        const text = (await complete([{ role: 'user', content: systemPrompt }], 4096)).trim();
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('AI вернул невалидный JSON');
        return JSON.parse(match[0]);
    }

    async generateChallengesBatch(prompt, count = 3) {
        const n = Math.min(Math.max(Number(count) || 3, 1), 10);
        const systemPrompt = `Ты — создатель задач по программированию в стиле LeetCode.

ЗАПРОС ПОЛЬЗОВАТЕЛЯ: "${prompt}"
КОЛИЧЕСТВО ЗАДАЧ: ${n}

Создай РОВНО ${n} разных задач по запросу пользователя.

Верни ТОЛЬКО валидный JSON-массив без markdown-блоков и без пояснений:
[
  {
    "name": "Название задачи",
    "difficulty": 3,
    "funcName": "camelCaseName",
    "description": "Подробное условие на русском: что принимает функция, что возвращает, ограничения, примеры",
    "sampleInput": "a=5, b=10",
    "sampleOutput": "15",
    "topics": ["Математика"],
    "parameters": [
      {"name": "a", "dataType": "int", "order": 0},
      {"name": "b", "dataType": "int", "order": 1}
    ],
    "testCases": [
      {
        "title": "Тест 1",
        "expectedOutput": "15",
        "testArgs": [{"value": "5", "order": 0}, {"value": "10", "order": 1}]
      }
    ]
  }
]

Строгие правила:
- Каждая задача должна быть УНИКАЛЬНОЙ и относиться к теме запроса
- difficulty: целое число от 1 до 10
- funcName: camelCase, только латинские буквы и цифры
- dataType: только одно из: int, float, string, bool, array, array2d, object
- testCases: минимум 3, максимум 6 на задачу
- testArgs для array/array2d/object — валидный JSON строкой ("[1,2,3]")
- expectedOutput — всегда строка ("42", "true", "[1,2,3]")
- topics — массив строк с названиями тем на русском
- Весь текст на русском (кроме funcName и имён параметров)`;

        const text = (await complete([{ role: 'user', content: systemPrompt }], 8192)).trim();
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('AI вернул невалидный JSON');
        return JSON.parse(match[0]);
    }

    async chat({ message, code, language, challengeTitle, challengeDescription, history }) {
        const systemContent = `Ты опытный ментор по программированию. Отвечай ТОЛЬКО на русском языке. НЕ давай готовые решения — только направляй рассуждения.

Контекст задачи: "${challengeTitle}"
Описание: ${challengeDescription}
Язык: ${language}

Текущий код пользователя:
\`\`\`${language}
${code}
\`\`\``;

        const messages = [
            { role: 'system', content: systemContent },
            ...(history || []).map(m => ({
                role: m.role === 'model' ? 'assistant' : m.role,
                content: m.text,
            })),
            { role: 'user', content: message },
        ];

        return complete(messages);
    }
}

module.exports = new AIService();
