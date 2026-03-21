'use client';

import React from 'react';
import './AnalysisTab.css';

interface Topic    { name: string; attempted: number; solved: number; rate: number }
interface LangStat { lang: string; count: number }
interface Stats    { totalAttempts: number; solvedCount: number; successRate: number; avgTime: number | null; solvedToday: number }

interface Props {
    stats:     Stats;
    topics:    Topic[];
    languages: LangStat[];
    allTopics: string[];
}

interface TopicGuide {
    label:    string;
    concepts: string[];
    path:     string[];
}

const TOPIC_GUIDES: Array<{ match: string[]; guide: TopicGuide }> = [
    {
        match: ['array', 'массив', 'arrays'],
        guide: {
            label: 'Arrays',
            concepts: ['Двух-указатели (Two Pointers)', 'Скользящее окно (Sliding Window)', 'Prefix Sum / Suffix Sum', 'Бинарный поиск в массивах'],
            path: [
                'Изучи паттерн "два указателя" — реши Two Sum, 3Sum, Container With Most Water',
                'Освой скользящее окно — Maximum Subarray, Longest Substring Without Repeating',
                'Разберись с prefix sum — Range Sum Query, Subarray Sum Equals K',
                'Переходи к задачам на сортировку: Merge Intervals, Sort Colors',
            ],
        },
    },
    {
        match: ['string', 'строк', 'strings'],
        guide: {
            label: 'Strings',
            concepts: ['Хэш-таблица для подсчёта символов', 'Скользящее окно для подстрок', 'Двух-указатели для палиндромов', 'KMP / Z-функция для поиска подстрок'],
            path: [
                'Начни с анаграмм и счётчиков символов — Valid Anagram, Group Anagrams',
                'Изучи задачи на палиндромы — Valid Palindrome, Longest Palindromic Substring',
                'Практикуй скользящее окно — Minimum Window Substring, Permutation in String',
                'Разбери алгоритмы поиска подстрок (KMP) для сложных задач',
            ],
        },
    },
    {
        match: ['sort', 'сортир', 'sorting'],
        guide: {
            label: 'Sorting',
            concepts: ['Merge Sort — O(n log n)', 'Quick Sort и выбор pivot', 'Counting Sort / Radix Sort', 'Custom Comparator, Partial Sort (Quick Select)'],
            path: [
                'Реализуй Merge Sort и Quick Sort с нуля — понимание сложности обязательно',
                'Практикуй задачи на интервалы — Merge Intervals, Meeting Rooms',
                'Освой Custom Comparator — Sort Colors (Dutch flag), Largest Number',
                'Изучи Quick Select для нахождения K-го наибольшего элемента',
            ],
        },
    },
    {
        match: ['math', 'матем', 'числ'],
        guide: {
            label: 'Math',
            concepts: ['Простые числа: решето Эратосфена', 'НОД/НОК (алгоритм Евклида)', 'Модульная арифметика', 'Битовые операции (XOR, AND, shift)'],
            path: [
                'Изучи алгоритм Евклида и решето Эратосфена',
                'Освой модульную арифметику — часто нужна в задачах на большие числа',
                'Изучи битовые операции — Single Number (XOR), Power of Two (AND)',
                'Практикуй комбинаторику — Pascal\'s Triangle, Unique Paths',
            ],
        },
    },
    {
        match: ['algorithm', 'алгоритм'],
        guide: {
            label: 'Algorithms',
            concepts: ['Сложность алгоритмов: O(n), O(n log n), O(n²)', 'Жадные алгоритмы (Greedy)', 'Разделяй и властвуй (Divide & Conquer)', 'Бинарный поиск, Two Pointers, Sliding Window'],
            path: [
                'Разберись с нотацией Big-O: умей оценивать сложность каждого решения по времени и памяти',
                'Изучи жадные алгоритмы — Jump Game, Gas Station, Assign Cookies',
                'Освой Divide & Conquer — Merge Sort, Maximum Subarray (Kadane\'s)',
                'Практикуй смешанные задачи: чередуй темы каждый день, чтобы научиться выбирать правильный подход',
            ],
        },
    },
    {
        match: ['object', 'объект'],
        guide: {
            label: 'Objects',
            concepts: ['Структуры данных: HashMap, HashSet, стек, очередь', 'Проектирование классов и интерфейсов', 'LRU Cache, LFU Cache', 'Сериализация / десериализация объектов'],
            path: [
                'Начни с базовых структур — реализуй Stack, Queue, HashMap на базе массива',
                'Изучи паттерн Two Sum через HashMap — основа большинства Object-задач',
                'Освой проектирование кэшей — LRU Cache (двусвязный список + HashMap)',
                'Практикуй задачи на моделирование: Design Twitter, Design Hit Counter',
            ],
        },
    },
    {
        match: ['recursion', 'рекурс', 'backtrack'],
        guide: {
            label: 'Recursion',
            concepts: ['Базовый случай и рекурсивный вызов', 'Дерево вариантов (decision tree)', 'Backtracking с откатом', 'Pruning — сокращение пространства поиска'],
            path: [
                'Начни с базовой рекурсии — Reverse String, Power(x, n), Flatten Nested List',
                'Изучи паттерн подмножеств — Subsets, Combinations, Permutations',
                'Освой бэктрекинг с отсечением — N-Queens, Sudoku Solver, Word Search',
                'Запомни шаблон: choose → explore → unchoose (выбор → рекурсия → отмена выбора)',
            ],
        },
    },
    {
        match: ['general', 'общ'],
        guide: {
            label: 'General',
            concepts: ['Анализ задачи: edge cases, constraints', 'Выбор структуры данных под задачу', 'Тестирование решения на граничных случаях', 'Читаемость и чистота кода'],
            path: [
                'Перед решением всегда задай себе: какие крайние случаи могут быть? (пустой массив, один элемент, отрицательные числа)',
                'Научись выбирать структуру данных: массив → когда нужен индекс; хэш → когда нужна скорость поиска; стек → когда нужен LIFO',
                'Пиши решение поэтапно: brute force → оптимизация → тест на примерах',
                'Разбирай чужие решения: за одну задачу можно найти 3–5 разных подходов разной сложности',
            ],
        },
    },
    {
        match: ['linked', 'list', 'связн', 'список'],
        guide: {
            label: 'Linked List',
            concepts: ['Fast/slow pointer', 'Разворот списка (iteratively / recursively)', 'Обнаружение цикла (Floyd\'s algorithm)', 'Dummy node техника'],
            path: [
                'Освой разворот списка — Reverse Linked List (итеративно и рекурсивно)',
                'Изучи fast/slow pointer — Linked List Cycle, Middle of Linked List',
                'Практикуй слияние — Merge Two Sorted Lists',
                'Реши задачи с dummy node — Remove Nth Node From End',
            ],
        },
    },
    {
        match: ['tree', 'дерев', 'bst'],
        guide: {
            label: 'Trees',
            concepts: ['DFS: preorder / inorder / postorder', 'BFS: обход по уровням', 'BST: вставка, поиск, удаление', 'Высота и диаметр дерева'],
            path: [
                'Отработай три вида DFS-обхода — Inorder, Preorder, Postorder Traversal',
                'Изучи BFS — Level Order Traversal, Zigzag Level Order',
                'Практикуй рекурсию — Maximum Depth, Symmetric Tree, Path Sum',
                'Разбери BST — Validate BST, Lowest Common Ancestor',
            ],
        },
    },
    {
        match: ['graph', 'граф'],
        guide: {
            label: 'Graphs',
            concepts: ['BFS и DFS на графе', 'Топологическая сортировка', 'Алгоритм Дейкстры', 'Union-Find (DSU)'],
            path: [
                'Начни с BFS/DFS на матрицах — Number of Islands, Flood Fill',
                'Изучи обход из списка смежности — Clone Graph, Course Schedule',
                'Освой топологическую сортировку — Course Schedule II',
                'Изучи Dijkstra и Union-Find для задач со связностью и весами',
            ],
        },
    },
    {
        match: ['dynamic', 'dp', 'динамическ'],
        guide: {
            label: 'Dynamic Programming',
            concepts: ['Memoization (top-down DP)', 'Tabulation (bottom-up DP)', '1D DP паттерны', '2D DP таблицы, Knapsack'],
            path: [
                'Начни с 1D DP — Climbing Stairs, House Robber, Coin Change',
                'Перейди к строкам — Longest Common Subsequence, Edit Distance',
                'Изучи паттерн рюкзака — 0/1 Knapsack, Partition Equal Subset Sum',
                'Осваивай 2D DP таблицы — Unique Paths, Maximal Square',
            ],
        },
    },
];

function findTopicGuide(topicName: string): TopicGuide | null {
    const lower = topicName.toLowerCase();
    for (const entry of TOPIC_GUIDES) {
        if (entry.match.some(kw => lower.includes(kw))) return entry.guide;
    }
    return null;
}

const MASTERY_MIN_ATTEMPTS = 5;
const MASTERY_MIN_RATE     = 75;

function isMastered(t: Topic): boolean {
    return t.attempted >= MASTERY_MIN_ATTEMPTS && t.rate >= MASTERY_MIN_RATE;
}

function overallScore(stats: Stats, topics: Topic[], totalTopics: number): number {
    const rateScore  = stats.successRate * 0.4;
    const solveScore = Math.min(stats.solvedCount / 50 * 100, 100) * 0.3;

    const coverageScore = totalTopics > 0 ? (topics.length / totalTopics) * 100 : 0;

    const weightedTopicRate = topics.length > 0
        ? topics.reduce((s, t) => s + t.rate * Math.min(t.attempted / MASTERY_MIN_ATTEMPTS, 1), 0) / topics.length
        : 0;

    const topicScore = (coverageScore * 0.15 + weightedTopicRate * 0.15);
    return Math.round(rateScore + solveScore + topicScore);
}

function scoreLabel(score: number): { label: string; color: string } {
    if (score >= 80) return { label: 'Отлично',        color: '#4ade80' };
    if (score >= 60) return { label: 'Хорошо',         color: '#a3e635' };
    if (score >= 40) return { label: 'Средне',         color: '#fbbf24' };
    if (score >= 20) return { label: 'Нужна практика', color: '#fb923c' };
    return                   { label: 'Начинающий',    color: '#f87171' };
}

type Stage = 'beginner' | 'growing' | 'intermediate' | 'advanced';

function getStage(stats: Stats): Stage {
    if (stats.solvedCount === 0)  return 'beginner';
    if (stats.solvedCount < 10)   return 'beginner';
    if (stats.solvedCount < 30)   return 'growing';
    if (stats.solvedCount < 80)   return 'intermediate';
    return 'advanced';
}

interface Rec {
    icon:    string;
    title:   string;
    text:    string;
    steps?:  string[];
    accent?: boolean;
    type:    'roadmap' | 'topic' | 'tip' | 'win';
}

function buildRecs(stats: Stats, topics: Topic[], languages: LangStat[]): Rec[] {
    const recs: Rec[]  = [];
    const stage        = getStage(stats);
    const weak         = topics.filter(t => t.rate < 50).sort((a, b) => a.rate - b.rate);
    const untouched    = topics.filter(t => t.attempted < 2);

    if (stats.solvedCount === 0) {
        recs.push({
            icon: '🗺️', type: 'roadmap', accent: true,
            title: 'С чего начать',
            text: 'Вы ещё не решили ни одной задачи. Вот чёткий план старта:',
            steps: [
                'Выберите язык, который знаете лучше всего — сосредоточьтесь на алгоритмах, а не на синтаксисе',
                'Начните с темы "Массивы" и решите 3 задачи уровня Easy: Two Sum, Best Time to Buy Stock, Contains Duplicate',
                'После первых 5 задач разберите каждое решение и поймите его временную сложность (O(n), O(n²))',
                'Перед каждой задачей потратьте 5 минут на обдумывание — не торопитесь сразу кодировать',
            ],
        });
        return recs;
    }

    if (stage === 'beginner') {
        recs.push({
            icon: '🗺️', type: 'roadmap', accent: true,
            title: 'Ваш план на ближайшие 2 недели',
            text: `Вы решили ${stats.solvedCount} задач${stats.successRate < 40 ? ` с успешностью ${stats.successRate}% — это нормально для старта` : ''}. Вот конкретный план роста:`,
            steps: [
                'Цель: доведите общее число решённых задач до 20 (по 1–2 задачи в день)',
                'Фокус на 2 темах: Массивы и Хэш-таблицы — они дают 40% задач на интервью',
                'Алгоритм работы: прочитай → подумай 10 мин → попробуй решить → если не вышло, изучи подход → реши самостоятельно заново',
                'Разбирай сложность: для каждого решения записывай O(?) по времени и памяти',
                'После 20 задач добавьте тему "Строки" и "Бинарный поиск"',
            ],
        });
    } else if (stage === 'growing') {
        recs.push({
            icon: '🗺️', type: 'roadmap', accent: true,
            title: 'План перехода на следующий уровень',
            text: `${stats.solvedCount} задач решено — хорошая база. Теперь важно выстроить систему:`,
            steps: [
                'Освойте ключевые паттерны: Two Pointers, Sliding Window, Fast/Slow Pointers — это фундамент',
                'Начните изучать Деревья и Графы — без них невозможно решать Medium задачи',
                'Практикуйте "тематическими спринтами": 5 дней на одну тему, потом смешанные задачи',
                'Цель: довести successRate до 60%+ — это значит, что вы понимаете паттерны, а не угадываете',
                'Введите разбор неудачных попыток: после провала — обязательно прочитай решение и реши заново через день',
            ],
        });
    } else if (stage === 'intermediate') {
        recs.push({
            icon: '🗺️', type: 'roadmap',
            title: 'План для среднего уровня',
            text: `${stats.solvedCount} задач — отличный прогресс. Переходите к системным улучшениям:`,
            steps: [
                'Освойте Динамическое программирование — это самая "тяжёлая" тема, но открывает Hard задачи',
                'Изучите Графовые алгоритмы: BFS/DFS, Dijkstra, Union-Find (DSU), топологическая сортировка',
                'Практикуйте задачи с ограничением по времени (30 мин на задачу) — имитируйте реальное интервью',
                'Анализируйте своё решение после решения: можно ли сделать проще? Лучше по памяти?',
                'Цель: решать Medium задачи с первой попытки за 20–25 минут',
            ],
        });
    } else {
        recs.push({
            icon: '🗺️', type: 'roadmap',
            title: 'Уровень: продвинутый',
            text: `${stats.solvedCount} задач — впечатляющий результат. Фокус на качестве и сложных паттернах:`,
            steps: [
                'Решайте Hard задачи на темы, где successRate < 70%',
                'Изучите продвинутые структуры данных: Trie, Segment Tree, Fenwick Tree',
                'Практикуйте System Design в контексте алгоритмов (LRU Cache, rate limiter)',
                'Участвуйте в контестах и решайте задачи под давлением времени',
            ],
        });
    }

    const allTopicsSorted = [...topics].sort((a, b) => a.rate - b.rate);

    for (const topic of allTopicsSorted) {
        const guide = findTopicGuide(topic.name);
        const isWeak      = topic.rate < 50;
        const topicMastered = isMastered(topic);

        const icon    = isWeak ? '📚' : topicMastered ? '🏅' : '📖';
        const status  = isWeak
            ? `нужно подтянуть — ${topic.rate}% успеха (${topic.solved}/${topic.attempted})`
            : topicMastered
                ? `освоено — ${topic.rate}% успеха (${topic.solved}/${topic.attempted})`
                : `в процессе — ${topic.rate}% успеха (${topic.solved}/${topic.attempted})`;

        if (guide) {
            const stepsForLevel = topicMastered
                ? [
                    `Тема хорошо освоена — переходи к задачам Hard или с доп. ограничениями по памяти`,
                    `Изучи продвинутые концепции: ${guide.concepts[guide.concepts.length - 1]}`,
                    `Попробуй решить задачи на время (20 мин) — имитация реального интервью`,
                    `Помоги другим: объясни решение простыми словами — это лучший способ закрепить знания`,
                ]
                : guide.path;

            recs.push({
                icon, type: 'topic', accent: isWeak,
                title: `${topic.name} — ${status}`,
                text: `Концепции: ${guide.concepts.slice(0, 3).join(' · ')}`,
                steps: stepsForLevel,
            });
        } else {
            recs.push({
                icon, type: 'topic', accent: isWeak,
                title: `${topic.name} — ${status}`,
                text: isWeak ? 'План улучшения:' : topicMastered ? 'Как двигаться дальше:' : 'Как закрепить:',
                steps: isWeak
                    ? [
                        `Реши 3–5 задач Easy по теме "${topic.name}" для формирования базового понимания`,
                        'Разбери каждый провал: что не вышло — выбор структуры данных или сам алгоритм?',
                        'Вернись к тем же задачам через 2 дня без подсказок — это закрепляет паттерн',
                        'После 5 успешных решений переходи к Medium задачам по этой теме',
                      ]
                    : topicMastered
                    ? [
                        `Переходи к Hard задачам по теме "${topic.name}"`,
                        'Реши задачи с ограничением по памяти (O(1) space) — это следующий уровень',
                        'Попробуй решать на время: 20–25 минут на задачу Medium',
                      ]
                    : [
                        `Реши ещё 3–5 задач Medium по теме "${topic.name}" для уверенного закрепления`,
                        'Анализируй время и память каждого решения — ищи способ оптимизировать',
                        'Чередуй эту тему с другими: смешанная практика улучшает перенос знаний',
                      ],
            });
        }
    }

    if (stats.avgTime !== null && stats.avgTime > 500) {
        recs.push({
            icon: '⚡', type: 'tip',
            title: `Производительность кода: среднее время ${stats.avgTime}ms`,
            text: 'Ваши решения работают медленнее оптимума. Что это обычно означает:',
            steps: [
                'Вложенные циклы O(n²) — ищите замену на хэш-таблицу или сортировку: O(n log n)',
                'Рекурсия без мемоизации — добавьте кэш (Map/object) или перепишите на DP',
                'Лишние проходы по массиву — попробуйте решить за один проход (one-pass)',
                'Частая проверка includes() на массиве — замените на Set для O(1) lookup',
            ],
        });
    }

    if (stats.successRate < 35 && stats.solvedCount > 3) {
        recs.push({
            icon: '🎯', type: 'tip', accent: true,
            title: `Успешность ${stats.successRate}%: как исправить`,
            text: 'Низкий процент успеха — это не провал, это сигнал. Причины и как их устранить:',
            steps: [
                'Перед кодированием всегда составляйте план на бумаге: входные данные → шаги → результат',
                'Решайте задачи своего уровня: начните с Easy, не переходите к Medium пока Easy не идёт >70%',
                'Не смотрите подсказку быстрее чем через 20 минут — важно тренировать мышление, а не запоминание',
                'После каждой неудачи: запишите, что именно не поняли — структура данных, рекуррентность или крайние случаи',
            ],
        });
    }

    if (untouched.length > 0) {
        const names = untouched.slice(0, 3).map(t => t.name).join(', ');
        recs.push({
            icon: '🔍', type: 'win',
            title: 'Неохваченные темы',
            text: `Темы с менее чем 2 попытками: ${names}. Возможно, именно там скрыты ваши сильные стороны — иногда "непривычная" тема оказывается проще всего ожидаемого.`,
        });
    }

    if (languages.length === 1) {
        recs.push({
            icon: '🌐', type: 'tip',
            title: `Только один язык: ${languages[0].lang}`,
            text: 'Решать знакомые задачи на другом языке — один из лучших способов углубить понимание алгоритмов. Попробуйте взять решённую задачу и переписать её на Python или JavaScript — синтаксис различается, но паттерн остаётся тем же.',
        });
    }

    return recs;
}

const RING_R = 34;
const CIRC   = 2 * Math.PI * RING_R;

const LANG_COLORS: Record<string, string> = {
    javascript: '#f7df1e', typescript: '#3178c6', python: '#3572A5',
    cpp: '#f34b7d', csharp: '#178600', php: '#4F5D95', coffeescript: '#244776',
};

export default function AnalysisTab({ stats, topics, languages, allTopics }: Props) {
    const score    = overallScore(stats, topics, allTopics.length);
    const { label: scoreText, color: scoreColor } = scoreLabel(score);
    const ringDash = (score / 100) * CIRC;

    const masteredTopics = topics.filter(isMastered);
    const totalLang      = languages.reduce((s, l) => s + l.count, 0);

    const topicMap = new Map(topics.map(t => [t.name, t]));
    const allTopicsView = allTopics.map(name => topicMap.get(name) ?? { name, attempted: 0, solved: 0, rate: 0 });

    return (
        <div className="an-root">

            {}
            <div className="an-top">
                <div className="an-score-card">
                    <div className="an-score-ring">
                        <svg viewBox="0 0 80 80" fill="none">
                            <circle cx="40" cy="40" r={RING_R} stroke="#1e1e1e" strokeWidth="7" />
                            <circle cx="40" cy="40" r={RING_R}
                                stroke={scoreColor} strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={`${ringDash} ${CIRC}`}
                                transform="rotate(-90 40 40)"
                                style={{ transition: 'stroke-dasharray 1s ease' }}
                            />
                        </svg>
                        <div className="an-score-center">
                            <span className="an-score-num" style={{ color: scoreColor }}>{score}</span>
                            <span className="an-score-sub">из 100</span>
                        </div>
                    </div>
                    <div className="an-score-info">
                        <div className="an-score-label" style={{ color: scoreColor }}>{scoreText}</div>
                        <div className="an-score-desc">Оценка на основе успешности, числа решённых задач и охвата тем. Тема считается освоенной при ≥{MASTERY_MIN_ATTEMPTS} попытках и ≥{MASTERY_MIN_RATE}% успеха.</div>
                    </div>
                </div>

                <div className="an-kpi-row">
                    {[
                        { val: stats.solvedCount,
                          label: 'Решено задач',
                          color: '#FF6B35' },
                        { val: stats.solvedToday,
                          label: 'Решено сегодня',
                          color: stats.solvedToday > 0 ? '#38bdf8' : '#555' },
                        { val: `${topics.length} / ${allTopics.length}`,
                          label: 'Охвачено тем',
                          color: topics.length >= allTopics.length ? '#4ade80' : topics.length >= Math.floor(allTopics.length / 2) ? '#fbbf24' : '#888' },
                        { val: masteredTopics.length > 0 ? masteredTopics.length : '—',
                          label: `Освоено тем (≥${MASTERY_MIN_ATTEMPTS} задач)`,
                          color: masteredTopics.length > 0 ? '#4ade80' : '#2e2e2e' },
                    ].map(({ val, label, color }) => (
                        <div key={label} className="an-kpi">
                            <span className="an-kpi-val" style={{ color }}>{val}</span>
                            <span className="an-kpi-label">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {}
            <div className="an-section">
                <div className="an-section-title">Обзор тем</div>
                <div className="an-topic-overview-note">
                    Успешность = доля уникальных задач, где хотя бы одна попытка прошла все тесты.
                    Ниже 100% — значит есть задачи, которые вы пробовали, но так и не решили.
                </div>
                <div className="an-topic-ov-header">
                    <span>Тема</span>
                    <span />
                    <span className="an-topic-ov-col-label">Решено / Попыток</span>
                    <span className="an-topic-ov-col-label">Успех</span>
                    <span className="an-topic-ov-col-label">Статус</span>
                </div>
                <div className="an-topic-overview">
                    {allTopicsView.map(t => {
                        const untouched = t.attempted === 0;
                        const mastered  = isMastered(t);
                        const barColor  = untouched ? '#252525'
                            : mastered     ? '#4ade80'
                            : t.rate >= 50 ? '#fbbf24'
                            :                '#f87171';
                        const statusLabel = untouched ? 'Не начато'
                            : mastered     ? 'Освоено'
                            : t.rate >= 50 ? 'Изучается'
                            :                'Слабо';
                        const statusBg   = untouched ? 'rgba(255,255,255,0.04)'
                            : mastered     ? 'rgba(74,222,128,0.12)'
                            : t.rate >= 50 ? 'rgba(251,191,36,0.12)'
                            :                'rgba(248,113,113,0.12)';
                        const statusTxt  = untouched ? '#555'
                            : mastered     ? '#4ade80'
                            : t.rate >= 50 ? '#fbbf24'
                            :                '#f87171';
                        return (
                            <div key={t.name} className="an-topic-ov-row">
                                <div className="an-topic-ov-left">
                                    <span className="an-topic-ov-dot" style={{ background: barColor }} />
                                    <span className="an-topic-ov-name" style={{ color: untouched ? '#444' : '#bbb' }}>{t.name}</span>
                                </div>
                                <div className="an-topic-ov-bar-wrap">
                                    <div className="an-topic-ov-bar-bg">
                                        <div className="an-topic-ov-bar-fill" style={{ width: `${t.rate}%`, background: barColor }} />
                                    </div>
                                </div>
                                <span className="an-topic-ov-frac" style={{ color: untouched ? '#333' : '#555' }}>
                                    {untouched ? '— / —' : `${t.solved} / ${t.attempted}`}
                                </span>
                                <span className="an-topic-ov-pct" style={{ color: untouched ? '#333' : barColor }}>
                                    {untouched ? '—' : `${t.rate}%`}
                                </span>
                                <span className="an-topic-ov-status" style={{ background: statusBg, color: statusTxt }}>
                                    {statusLabel}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {}
            {languages.length > 0 && (
                <div className="an-section">
                    <div className="an-section-title">Языковая активность</div>
                    <div className="an-lang-grid">
                        {languages.map(l => {
                            const pct   = Math.round((l.count / totalLang) * 100);
                            const color = LANG_COLORS[l.lang] ?? '#555';
                            return (
                                <div key={l.lang} className="an-lang-card">
                                    <div className="an-lang-top">
                                        <span className="an-lang-dot" style={{ background: color }} />
                                        <span className="an-lang-name">{l.lang}</span>
                                        <span className="an-lang-pct" style={{ color }}>{pct}%</span>
                                    </div>
                                    <div className="an-lang-bar-bg">
                                        <div className="an-lang-bar" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                    <span className="an-lang-count">{l.count} попыток</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

        </div>
    );
}

function TopicBar({ topic, color }: { topic: Topic; color: string }) {
    return (
        <div className="an-topic-bar-row">
            <div className="an-topic-bar-top">
                <span className="an-topic-bar-name">{topic.name}</span>
                <span className="an-topic-bar-meta">
                    <span className="an-topic-bar-frac">{topic.solved}/{topic.attempted}</span>
                    <span className="an-topic-bar-pct" style={{ color }}>{topic.rate}%</span>
                </span>
            </div>
            <div className="an-topic-bar-bg">
                <div className="an-topic-bar-fill" style={{ width: `${topic.rate}%`, background: color }} />
            </div>
        </div>
    );
}
