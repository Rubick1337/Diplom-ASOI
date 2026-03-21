-- ─── DROP OLD TABLES ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "TestQuestions" CASCADE;
DROP TABLE IF EXISTS "QuestionAnswers" CASCADE;
DROP TABLE IF EXISTS "Questions" CASCADE;
DROP TABLE IF EXISTS "Tests" CASCADE;
DROP TABLE IF EXISTS "ReportChallenges" CASCADE;
DROP TABLE IF EXISTS "Notifications" CASCADE;
DROP TABLE IF EXISTS "ReportReasons" CASCADE;
DROP TABLE IF EXISTS "ReviewChallenges" CASCADE;
DROP TABLE IF EXISTS "HistoryChallenges" CASCADE;
DROP TABLE IF EXISTS "TestCaseArguments" CASCADE;
DROP TABLE IF EXISTS "ChallengeTestCases" CASCADE;
DROP TABLE IF EXISTS "ChallengeParameters" CASCADE;
DROP TABLE IF EXISTS "ChallengeTopics" CASCADE;
DROP TABLE IF EXISTS "Challenges" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;
DROP TABLE IF EXISTS "Topics" CASCADE;

-- ─── ROLES ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Roles" (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- ─── TOPICS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Topics" (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Users" (
    id             SERIAL PRIMARY KEY,
    username       VARCHAR(255) NOT NULL,
    password       VARCHAR(255),
    email          VARCHAR(255) NOT NULL UNIQUE,
    "roleId"       INTEGER NOT NULL DEFAULT 3,
    "refreshToken" VARCHAR(255),
    "googleId"     VARCHAR(255) UNIQUE,
    "githubId"     VARCHAR(255) UNIQUE,
    experience     INTEGER NOT NULL DEFAULT 0,
    rating         INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_user_role FOREIGN KEY ("roleId") REFERENCES "Roles"(id) ON DELETE SET DEFAULT
);

-- ─── CHALLENGES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Challenges" (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(255) NOT NULL UNIQUE,
    description       TEXT NOT NULL,
    difficulty        INTEGER NOT NULL DEFAULT 1,
    mode              VARCHAR(255) NOT NULL DEFAULT 'harness',
    "funcName"        VARCHAR(255) NOT NULL,
    "timeLimitMs"     INTEGER NOT NULL DEFAULT 2000,
    "createdByUserId" INTEGER,
    "sampleInput"     TEXT DEFAULT '',
    "sampleOutput"    TEXT DEFAULT '',
    "isHidden"        BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_challenge_user FOREIGN KEY ("createdByUserId") REFERENCES "Users"(id) ON DELETE SET NULL,
    CONSTRAINT check_difficulty  CHECK (difficulty >= 1 AND difficulty <= 10)
);

-- ─── CHALLENGE TOPICS (M2M) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ChallengeTopics" (
    "challengeId" INTEGER NOT NULL,
    "topicId"     INTEGER NOT NULL,
    PRIMARY KEY ("challengeId", "topicId"),
    CONSTRAINT fk_ct_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE,
    CONSTRAINT fk_ct_topic     FOREIGN KEY ("topicId")     REFERENCES "Topics"(id)     ON DELETE CASCADE
);

-- ─── CHALLENGE PARAMETERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ChallengeParameters" (
    id            SERIAL PRIMARY KEY,
    "challengeId" INTEGER NOT NULL,
    name          VARCHAR(255) NOT NULL,
    "dataType"    VARCHAR(255) NOT NULL,
    CONSTRAINT fk_parameter_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE
);

-- ─── CHALLENGE TEST CASES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ChallengeTestCases" (
    id               SERIAL PRIMARY KEY,
    "challengeId"    INTEGER NOT NULL,
    title            VARCHAR(255) NOT NULL DEFAULT 'Test Case',
    "expectedOutput" TEXT NOT NULL,
    CONSTRAINT fk_testcase_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE
);

-- ─── TEST CASE ARGUMENTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TestCaseArguments" (
    id           SERIAL PRIMARY KEY,
    "testCaseId" INTEGER NOT NULL,
    value        TEXT NOT NULL,
    "order"      INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_argument_testcase FOREIGN KEY ("testCaseId") REFERENCES "ChallengeTestCases"(id) ON DELETE CASCADE
);

-- ─── HISTORY ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "HistoryChallenges" (
    id                SERIAL PRIMARY KEY,
    "userId"          INTEGER NOT NULL,
    "challengeId"     INTEGER NOT NULL,
    code              TEXT NOT NULL,
    language          VARCHAR(50) NOT NULL,
    status            VARCHAR(50) NOT NULL,
    "executionTimeMs" INTEGER DEFAULT 0,
    "testsPassed"     INTEGER DEFAULT NULL,
    "testsTotal"      INTEGER DEFAULT NULL,
    "createdAt"       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_user      FOREIGN KEY ("userId")      REFERENCES "Users"(id)      ON DELETE CASCADE,
    CONSTRAINT fk_history_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE
);

-- ─── REVIEWS (composite PK: one review per user per challenge) ────────────────
CREATE TABLE IF NOT EXISTS "ReviewChallenges" (
    "userId"      INTEGER NOT NULL,
    "challengeId" INTEGER NOT NULL,
    content       TEXT,
    rating        INTEGER CHECK (rating >= 1 AND rating <= 5),
    "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "challengeId"),
    CONSTRAINT fk_review_user      FOREIGN KEY ("userId")      REFERENCES "Users"(id)      ON DELETE CASCADE,
    CONSTRAINT fk_review_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE
);

-- ─── REPORT REASONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReportReasons" (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- ─── REPORTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReportChallenges" (
    id               SERIAL PRIMARY KEY,
    "userId"         INTEGER NOT NULL,
    "challengeId"    INTEGER NOT NULL,
    "reasonId"       INTEGER,
    "reasonText"     TEXT,
    status           VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "createdAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "resolvedById"   INTEGER,
    "resolvedAt"     TIMESTAMP,
    CONSTRAINT fk_report_user      FOREIGN KEY ("userId")        REFERENCES "Users"(id)         ON DELETE CASCADE,
    CONSTRAINT fk_report_challenge FOREIGN KEY ("challengeId")   REFERENCES "Challenges"(id)    ON DELETE CASCADE,
    CONSTRAINT fk_report_reason    FOREIGN KEY ("reasonId")      REFERENCES "ReportReasons"(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_resolver  FOREIGN KEY ("resolvedById")  REFERENCES "Users"(id)         ON DELETE SET NULL
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Notifications" (
    id            SERIAL PRIMARY KEY,
    "userId"      INTEGER NOT NULL,
    title         VARCHAR(255) NOT NULL,
    message       TEXT NOT NULL,
    type          VARCHAR(50) NOT NULL DEFAULT 'admin',
    "isRead"      BOOLEAN NOT NULL DEFAULT FALSE,
    "challengeId" INTEGER,
    "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY ("userId") REFERENCES "Users"(id) ON DELETE CASCADE
);

-- ════════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ════════════════════════════════════════════════════════════════════════════

-- ─── ROLES ───────────────────────────────────────────────────────────────────
INSERT INTO "Roles" (id, name) VALUES
    (1, 'owner'),
    (2, 'admin'),
    (3, 'user')
ON CONFLICT (id) DO NOTHING;

-- ─── TOPICS ──────────────────────────────────────────────────────────────────
INSERT INTO "Topics" (id, name) VALUES
    (1,  'Strings'),
    (2,  'Arrays'),
    (3,  'Math'),
    (4,  'Algorithms'),
    (5,  'Objects'),
    (6,  'Recursion'),
    (7,  'Sorting'),
    (8,  'General'),
    (9,  'Trees'),
    (10, 'Dynamic Programming')
ON CONFLICT (id) DO NOTHING;

-- ─── USERS (25 пользователей, пароль для всех: "password123") ────────────────
INSERT INTO "Users" (id, username, password, email, "roleId", experience, rating) VALUES
    (1,  'admin',          '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'admin@example.com',        1, 9999, 9999),
    (2,  'codemaster',     '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'codemaster@example.com',   2, 5200, 3800),
    (3,  'algo_queen',     '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'alqueen@example.com',      2, 4700, 3300),
    (4,  'backend_hero',   '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'backend@example.com',      2, 4100, 2900),
    (5,  'recursion_rex',  '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'rex@example.com',          2, 3700, 2600),
    (6,  'byte_wizard',    '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'wizard@example.com',       2, 3300, 2300),
    (7,  'loop_lord',      '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'loop@example.com',         2, 2900, 2000),
    (8,  'stack_overflow', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'stack@example.com',        2, 2600, 1800),
    (9,  'null_pointer',   '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'null@example.com',         2, 2300, 1600),
    (10, 'debug_master',   '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'debug@example.com',        2, 2000, 1400),
    (11, 'frontend_ninja', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'ninja@example.com',        2, 1700, 1200),
    (12, 'junior_dev',     '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'junior@example.com',       2, 1100,  750),
    (13, 'syntax_error',   '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'syntax@example.com',       2,  850,  580),
    (14, 'bit_shifter',    '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'bit@example.com',          2,  700,  460),
    (15, 'coffee_coder',   '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'coffee@example.com',       2,  550,  370),
    (16, 'lazy_eval',      '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'lazy@example.com',         2,  440,  290),
    (17, 'grep_king',      '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'grep@example.com',         2,  360,  240),
    (18, 'type_safe',      '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'typesafe@example.com',     2,  280,  180),
    (19, 'newbie_99',      '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'newbie@example.com',       2,  140,   90),
    (20, 'ghost_coder',    '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'ghost@example.com',        2,   60,   35),
    (21, 'pro_hacker',     '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'prohacker@example.com',    2, 4500, 3100),
    (22, 'code_ninja',     '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'codeninja@example.com',    2, 3900, 2700),
    (23, 'data_wizard',    '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'datawiz@example.com',      2, 3200, 2200),
    (24, 'pixel_pusher',   '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'pixel@example.com',        2, 1800, 1250),
    (25, 'hash_table',     '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'hashtable@example.com',    2,  900,  620)
ON CONFLICT (id) DO NOTHING;

-- ─── CHALLENGES (25 задач) ────────────────────────────────────────────────────
INSERT INTO "Challenges" (id, name, description, difficulty, "funcName", "timeLimitMs", "sampleInput", "sampleOutput", "createdByUserId") VALUES
    (1,  'Hello World',          'Напишите функцию, которая возвращает строку "Hello, World!".',                                                                           1,  'solution',         2000, '()',                    '"Hello, World!"',   1),
    (2,  'Sum of Two',           'Напишите функцию, принимающую два числа a и b, и возвращающую их сумму.',                                                                1,  'solution',         2000, '(5, 10)',               '15',                1),
    (3,  'Reverse String',       'Напишите функцию, которая принимает строку и возвращает её в обратном порядке.',                                                         1,  'reverse',          2000, '("hello")',             '"olleh"',           1),
    (4,  'Palindrome Check',     'Верните true, если строка является палиндромом (без учёта регистра), иначе false.',                                                     2,  'isPalindrome',     2000, '("Racecar")',           'true',              1),
    (5,  'Find Max',             'Верните максимальный элемент числового массива.',                                                                                         2,  'findMax',          2000, '([3, 1, 4, 1, 5])',    '5',                 2),
    (6,  'Factorial',            'Вычислите факториал неотрицательного числа n.',                                                                                           3,  'factorial',        2000, '(5)',                   '120',               2),
    (7,  'Fibonacci',            'Верните n-е число Фибоначчи (0-индексированное). fibonacci(0)=0, fibonacci(1)=1.',                                                     3,  'fibonacci',        3000, '(7)',                   '13',                2),
    (8,  'Two Sum',              'Дан массив nums и число target. Верните индексы двух чисел, сумма которых равна target.',                                               4,  'twoSum',           2000, '([2, 7, 11], 9)',      '[0,1]',             3),
    (9,  'Merge Sort',           'Реализуйте алгоритм сортировки слиянием. Верните отсортированный массив.',                                                               5,  'mergeSort',        3000, '([3, 1, 4, 1, 5])',    '[1,1,3,4,5]',       3),
    (10, 'Binary Search',        'Дан отсортированный массив и target. Верните индекс target или -1, если не найден.',                                                    4,  'binarySearch',     2000, '([1, 3, 5, 7], 5)',    '2',                 4),
    (11, 'Valid Brackets',       'Проверьте корректность вложенности скобок (), [], {}. Верните true/false.',                                                              4,  'isValid',          2000, '"([{}])"',              'true',              4),
    (12, 'Flatten Array',        'Принимает вложенный массив любой глубины, возвращает плоский массив.',                                                                   3,  'flatten',          2000, '([[1, [2]], 3])',       '[1,2,3]',           3),
    (13, 'Deep Clone',           'Создайте глубокую копию объекта (без циклических ссылок).',                                                                              6,  'deepClone',        2000, '({a: {b: 1}})',         '{"a":{"b":1}}',     1),
    (14, 'LRU Cache',            'Реализуйте LRU-кэш с методами get(key) и put(key, value). Задача проверяет структуру объекта.',                                        8,  'LRUCache',         4000, '(2)',                   'null',              1),
    (15, 'Red-Black Tree Insert','Вставьте элемент в красно-чёрное дерево и верните null (мутация структуры).',                                                            10, 'rbInsert',         5000, '(5)',                   'null',              1),
    (16, 'FizzBuzz',             'Для числа n: верните "FizzBuzz" если делится на 3 и 5, "Fizz" если на 3, "Buzz" если на 5, иначе строку числа.',                      1,  'solution',         2000, '(15)',                  '"FizzBuzz"',        2),
    (17, 'Count Vowels',         'Подсчитайте количество гласных (a, e, i, o, u) в строке без учёта регистра.',                                                           1,  'solution',         2000, '("hello")',             '2',                 2),
    (18, 'Is Prime',             'Верните true, если число является простым, иначе false.',                                                                                2,  'solution',         2000, '(7)',                   'true',              3),
    (19, 'Remove Duplicates',    'Удалите дубликаты из массива, сохраняя порядок первого вхождения.',                                                                     2,  'removeDuplicates', 2000, '([1, 2, 2, 3, 3])',    '[1,2,3]',           3),
    (20, 'String Compression',   'Сожмите строку: заменяйте повторяющиеся символы на символ+количество. "aabccc" → "a2b1c3".',                                           4,  'compress',         2000, '("aabccc")',            '"a2b1c3"',          4),
    (21, 'Matrix Transpose',     'Транспонируйте двумерную матрицу (строки становятся столбцами).',                                                                        4,  'transpose',        2000, '([[1,2],[3,4]])',       '[[1,3],[2,4]]',     4),
    (22, 'Valid Anagram',        'Верните true, если строки s и t являются анаграммами друг друга.',                                                                      2,  'isAnagram',        2000, '("anagram","nagaram")', 'true',              2),
    (23, 'Power Function',       'Реализуйте функцию power(base, exp), вычисляющую base в степени exp (exp ≥ 0).',                                                       2,  'power',            2000, '(2, 3)',                '8',                 3),
    (24, 'Roman to Integer',     'Конвертируйте строку с римскими цифрами в целое число.',                                                                                 3,  'romanToInt',       2000, '("III")',               '3',                 4),
    (25, 'Quick Sort',           'Реализуйте алгоритм быстрой сортировки. Верните отсортированный массив.',                                                               5,  'quickSort',        3000, '([3, 1, 2, 5, 8])',    '[1,2,3,5,8]',       3)
ON CONFLICT (id) DO NOTHING;

-- ─── CHALLENGE TOPICS (M2M seed) ─────────────────────────────────────────────
INSERT INTO "ChallengeTopics" ("challengeId", "topicId") VALUES
    (1,  8),  -- Hello World → General
    (2,  3),  -- Sum of Two → Math
    (3,  1),  -- Reverse String → Strings
    (4,  1),  -- Palindrome Check → Strings
    (5,  2),  -- Find Max → Arrays
    (6,  3),  -- Factorial → Math
    (6,  6),  -- Factorial → Recursion
    (7,  6),  -- Fibonacci → Recursion
    (7,  10), -- Fibonacci → Dynamic Programming
    (8,  2),  -- Two Sum → Arrays
    (9,  7),  -- Merge Sort → Sorting
    (10, 4),  -- Binary Search → Algorithms
    (11, 1),  -- Valid Brackets → Strings
    (12, 2),  -- Flatten Array → Arrays
    (13, 5),  -- Deep Clone → Objects
    (14, 4),  -- LRU Cache → Algorithms
    (15, 9),  -- Red-Black Tree Insert → Trees
    (16, 3),  -- FizzBuzz → Math
    (17, 1),  -- Count Vowels → Strings
    (18, 3),  -- Is Prime → Math
    (19, 2),  -- Remove Duplicates → Arrays
    (20, 1),  -- String Compression → Strings
    (21, 2),  -- Matrix Transpose → Arrays
    (22, 1),  -- Valid Anagram → Strings
    (23, 3),  -- Power Function → Math
    (24, 1),  -- Roman to Integer → Strings
    (25, 7)   -- Quick Sort → Sorting
ON CONFLICT DO NOTHING;

-- ─── CHALLENGE PARAMETERS ────────────────────────────────────────────────────
-- ch1 (Hello World): без параметров
INSERT INTO "ChallengeParameters" ("challengeId", name, "dataType") VALUES
    (2,  'a',        'int'),
    (2,  'b',        'int'),
    (3,  'str',      'string'),
    (4,  'str',      'string'),
    (5,  'nums',     'array'),
    (6,  'n',        'int'),
    (7,  'n',        'int'),
    (8,  'nums',     'array'),
    (8,  'target',   'int'),
    (9,  'arr',      'array'),
    (10, 'arr',      'array'),
    (10, 'target',   'int'),
    (11, 's',        'string'),
    (12, 'arr',      'array'),
    (13, 'obj',      'object'),
    (14, 'capacity', 'int'),
    (15, 'val',      'int'),
    (16, 'n',        'int'),
    (17, 'str',      'string'),
    (18, 'n',        'int'),
    (19, 'arr',      'array'),
    (20, 'str',      'string'),
    (21, 'matrix',   'array2d'),
    (22, 's',        'string'),
    (22, 't',        'string'),
    (23, 'base',     'int'),
    (23, 'exp',      'int'),
    (24, 's',        'string'),
    (25, 'arr',      'array')
ON CONFLICT DO NOTHING;

-- ─── TEST CASES (53 теста) ────────────────────────────────────────────────────
INSERT INTO "ChallengeTestCases" (id, "challengeId", title, "expectedOutput") VALUES
    -- ch1: Hello World
    (1,  1,  'Base',            '"Hello, World!"'),
    -- ch2: Sum of Two
    (2,  2,  'Pos + Pos',       '15'),
    (3,  2,  'Pos + Neg',       '-5'),
    (4,  2,  'Zero',            '0'),
    -- ch3: Reverse String
    (5,  3,  'Lowercase',       '"olleh"'),
    (6,  3,  'Uppercase',       '"DLROW"'),
    -- ch4: Palindrome
    (7,  4,  'Is Palindrome',   'true'),
    (8,  4,  'Not Palindrome',  'false'),
    (9,  4,  'Single Char',     'true'),
    -- ch5: Find Max
    (10, 5,  'Mixed Nums',      '10'),
    (11, 5,  'All Negative',    '-1'),
    -- ch6: Factorial
    (12, 6,  'Fact 5',          '120'),
    (13, 6,  'Fact 0',          '1'),
    (14, 6,  'Fact 1',          '1'),
    -- ch7: Fibonacci
    (15, 7,  'Fib 0',           '0'),
    (16, 7,  'Fib 7',           '13'),
    (17, 7,  'Fib 10',          '55'),
    -- ch8: Two Sum
    (18, 8,  'Standard',        '[0,1]'),
    (19, 8,  'Alt Pair',        '[1,2]'),
    -- ch9: Merge Sort
    (20, 9,  'Mixed',           '[1,1,3,4,5]'),
    (21, 9,  'With Negatives',  '[-3,-1,0,2,8]'),
    -- ch10: Binary Search
    (22, 10, 'Found',           '2'),
    (23, 10, 'Not Found',       '-1'),
    -- ch11: Valid Brackets
    (24, 11, 'Valid Mixed',     'true'),
    (25, 11, 'Invalid',         'false'),
    (26, 11, 'Empty String',    'true'),
    -- ch12: Flatten
    (27, 12, 'Nested 2 lvl',    '[1,2,3]'),
    (28, 12, 'Nested 3 lvl',    '[1,2,3,4,5]'),
    -- ch13: Deep Clone
    (29, 13, 'Nested Obj',      '{"a":{"b":1}}'),
    -- ch14: LRU Cache
    (30, 14, 'Init',            'null'),
    -- ch15: Red-Black Tree
    (31, 15, 'Insert',          'null'),
    -- ch16: FizzBuzz
    (32, 16, 'Fizz (9)',        '"Fizz"'),
    (33, 16, 'Buzz (10)',       '"Buzz"'),
    (34, 16, 'FizzBuzz (15)',   '"FizzBuzz"'),
    -- ch17: Count Vowels
    (35, 17, 'hello',           '2'),
    (36, 17, 'programming',     '3'),
    -- ch18: Is Prime
    (37, 18, 'Prime 7',         'true'),
    (38, 18, 'Not Prime 9',     'false'),
    (39, 18, 'Min Prime 2',     'true'),
    -- ch19: Remove Duplicates
    (40, 19, 'Has Dups',        '[1,2,3]'),
    (41, 19, 'All Dups',        '[5,7]'),
    -- ch20: String Compression
    (42, 20, 'Mixed Runs',      '"a2b1c3"'),
    (43, 20, 'All Unique',      '"a1b1c1d1"'),
    -- ch21: Matrix Transpose
    (44, 21, '2x2',             '[[1,3],[2,4]]'),
    (45, 21, '2x3 to 3x2',     '[[1,4],[2,5],[3,6]]'),
    -- ch22: Valid Anagram
    (46, 22, 'Anagram',         'true'),
    (47, 22, 'Not Anagram',     'false'),
    -- ch23: Power Function
    (48, 23, '2 pow 3',         '8'),
    (49, 23, '5 pow 0',         '1'),
    -- ch24: Roman to Integer
    (50, 24, 'III',             '3'),
    (51, 24, 'LVIII',           '58'),
    -- ch25: Quick Sort
    (52, 25, 'Mixed',           '[1,2,3,5,8]'),
    (53, 25, 'With Negatives',  '[-5,-2,0,1,3]')
ON CONFLICT (id) DO NOTHING;

-- ─── TEST CASE ARGUMENTS ─────────────────────────────────────────────────────
-- TC1 (Hello World) не имеет аргументов
INSERT INTO "TestCaseArguments" ("testCaseId", value, "order") VALUES
    -- TC2: 5 + 10 = 15
    (2,  '5',              0), (2,  '10',           1),
    -- TC3: 10 + (-15) = -5
    (3,  '10',             0), (3,  '-15',           1),
    -- TC4: 0 + 0 = 0
    (4,  '0',              0), (4,  '0',             1),
    -- TC5: reverse "hello"
    (5,  '"hello"',        0),
    -- TC6: reverse "WORLD"
    (6,  '"WORLD"',        0),
    -- TC7: "Racecar" - palindrome
    (7,  '"Racecar"',      0),
    -- TC8: "hello" - not palindrome
    (8,  '"hello"',        0),
    -- TC9: "a" - single char palindrome
    (9,  '"a"',            0),
    -- TC10: findMax([1,10,2,5,3]) = 10
    (10, '[1,10,2,5,3]',  0),
    -- TC11: findMax([-5,-1,-3,-7]) = -1
    (11, '[-5,-1,-3,-7]', 0),
    -- TC12: factorial(5) = 120
    (12, '5',              0),
    -- TC13: factorial(0) = 1
    (13, '0',              0),
    -- TC14: factorial(1) = 1
    (14, '1',              0),
    -- TC15: fibonacci(0) = 0
    (15, '0',              0),
    -- TC16: fibonacci(7) = 13
    (16, '7',              0),
    -- TC17: fibonacci(10) = 55
    (17, '10',             0),
    -- TC18: twoSum([2,7,11,15], 9) = [0,1]
    (18, '[2,7,11,15]',   0), (18, '9',             1),
    -- TC19: twoSum([3,2,4], 6) = [1,2]
    (19, '[3,2,4]',        0), (19, '6',             1),
    -- TC20: mergeSort([3,1,4,1,5])
    (20, '[3,1,4,1,5]',   0),
    -- TC21: mergeSort([-3,8,0,-1,2])
    (21, '[-3,8,0,-1,2]', 0),
    -- TC22: binarySearch([1,3,5,7,9], 5) = 2
    (22, '[1,3,5,7,9]',   0), (22, '5',             1),
    -- TC23: binarySearch([1,3,5,7,9], 4) = -1
    (23, '[1,3,5,7,9]',   0), (23, '4',             1),
    -- TC24: isValid("([{}])") = true
    (24, '"([{}])"',       0),
    -- TC25: isValid("(]") = false
    (25, '"(]"',           0),
    -- TC26: isValid("") = true
    (26, '""',             0),
    -- TC27: flatten([[1,[2]],3])
    (27, '[[1,[2]],3]',   0),
    -- TC28: flatten([[1,2],[3,[4,5]]])
    (28, '[[1,2],[3,[4,5]]]', 0),
    -- TC29: deepClone({a:{b:1}})
    (29, '{"a":{"b":1}}', 0),
    -- TC30: LRUCache(2)
    (30, '2',              0),
    -- TC31: rbInsert(5)
    (31, '5',              0),
    -- TC32: fizzbuzz(9) = "Fizz"
    (32, '9',              0),
    -- TC33: fizzbuzz(10) = "Buzz"
    (33, '10',             0),
    -- TC34: fizzbuzz(15) = "FizzBuzz"
    (34, '15',             0),
    -- TC35: countVowels("hello") = 2
    (35, '"hello"',        0),
    -- TC36: countVowels("programming") = 3
    (36, '"programming"',  0),
    -- TC37: isPrime(7) = true
    (37, '7',              0),
    -- TC38: isPrime(9) = false
    (38, '9',              0),
    -- TC39: isPrime(2) = true
    (39, '2',              0),
    -- TC40: removeDuplicates([1,2,2,3,3])
    (40, '[1,2,2,3,3]',   0),
    -- TC41: removeDuplicates([5,5,7,7])
    (41, '[5,5,7,7]',     0),
    -- TC42: compress("aabccc")
    (42, '"aabccc"',       0),
    -- TC43: compress("abcd")
    (43, '"abcd"',         0),
    -- TC44: transpose([[1,2],[3,4]])
    (44, '[[1,2],[3,4]]',  0),
    -- TC45: transpose([[1,2,3],[4,5,6]])
    (45, '[[1,2,3],[4,5,6]]', 0),
    -- TC46: isAnagram("anagram","nagaram")
    (46, '"anagram"',      0), (46, '"nagaram"',     1),
    -- TC47: isAnagram("rat","car")
    (47, '"rat"',          0), (47, '"car"',          1),
    -- TC48: power(2, 3) = 8
    (48, '2',              0), (48, '3',              1),
    -- TC49: power(5, 0) = 1
    (49, '5',              0), (49, '0',              1),
    -- TC50: romanToInt("III") = 3
    (50, '"III"',          0),
    -- TC51: romanToInt("LVIII") = 58
    (51, '"LVIII"',        0),
    -- TC52: quickSort([3,1,2,5,8])
    (52, '[3,1,2,5,8]',   0),
    -- TC53: quickSort([-5,3,0,1,-2])
    (53, '[-5,3,0,1,-2]', 0)
ON CONFLICT DO NOTHING;

-- ─── HISTORY (основной массив за 90 дней) ────────────────────────────────────
-- total = количество тестов в задаче; testsPassed = total при success, random при fail
INSERT INTO "HistoryChallenges" ("userId", "challengeId", code, language, status, "executionTimeMs", "testsPassed", "testsTotal", "createdAt")
SELECT
    uid, cid,
    CASE lang
        WHEN 'javascript' THEN 'function solution(a, b) { return a + b; }'
        WHEN 'python'     THEN 'def solution(a, b):\n    return a + b'
        WHEN 'cpp'        THEN 'auto solution(int a, int b) { return a + b; }'
        WHEN 'typescript' THEN 'function solution(a: number, b: number): number { return a + b; }'
        WHEN 'java'       THEN 'public static int solution(int a, int b) { return a + b; }'
        ELSE 'function solution() { return null; }'
    END,
    lang, stat,
    (30 + floor(random() * 970))::INTEGER,
    CASE WHEN stat = 'success' THEN total ELSE (floor(random() * total))::INTEGER END,
    total,
    NOW() - ((floor(random() * 83) + 5) || ' days')::INTERVAL
        - (floor(random() * 23) || ' hours')::INTERVAL
FROM (VALUES
    -- user 2: codemaster
    (2,  1,  'javascript', 'success', 1),
    (2,  2,  'javascript', 'success', 3),
    (2,  3,  'javascript', 'success', 2),
    (2,  4,  'javascript', 'success', 3),
    (2,  5,  'javascript', 'success', 2),
    (2,  6,  'javascript', 'success', 3),
    (2,  7,  'javascript', 'success', 3),
    (2,  8,  'javascript', 'success', 2),
    (2,  9,  'javascript', 'fail',    2),
    (2,  10, 'javascript', 'success', 2),
    (2,  11, 'javascript', 'success', 3),
    (2,  12, 'javascript', 'success', 2),
    (2,  13, 'python',     'success', 1),
    (2,  14, 'python',     'fail',    1),
    (2,  16, 'javascript', 'success', 3),
    (2,  17, 'javascript', 'success', 2),
    (2,  18, 'javascript', 'success', 3),
    (2,  19, 'javascript', 'success', 2),
    (2,  22, 'javascript', 'success', 2),
    -- user 3: algo_queen
    (3,  1,  'javascript', 'success', 1),
    (3,  2,  'javascript', 'success', 3),
    (3,  3,  'javascript', 'success', 2),
    (3,  4,  'javascript', 'success', 3),
    (3,  5,  'javascript', 'success', 2),
    (3,  6,  'python',     'success', 3),
    (3,  7,  'python',     'success', 3),
    (3,  8,  'python',     'fail',    2),
    (3,  9,  'python',     'fail',    2),
    (3,  10, 'python',     'success', 2),
    (3,  11, 'javascript', 'success', 3),
    (3,  12, 'javascript', 'fail',    2),
    (3,  16, 'python',     'success', 3),
    (3,  22, 'javascript', 'success', 2),
    (3,  24, 'javascript', 'success', 2),
    -- user 4: backend_hero (C++)
    (4,  1,  'javascript', 'success', 1),
    (4,  2,  'javascript', 'success', 3),
    (4,  3,  'cpp',        'success', 2),
    (4,  4,  'cpp',        'success', 3),
    (4,  5,  'cpp',        'success', 2),
    (4,  6,  'cpp',        'success', 3),
    (4,  7,  'cpp',        'fail',    3),
    (4,  8,  'cpp',        'success', 2),
    (4,  9,  'cpp',        'fail',    2),
    (4,  10, 'cpp',        'success', 2),
    (4,  11, 'javascript', 'success', 3),
    (4,  13, 'javascript', 'fail',    1),
    (4,  14, 'javascript', 'fail',    1),
    (4,  18, 'cpp',        'success', 3),
    (4,  20, 'cpp',        'fail',    2),
    (4,  25, 'cpp',        'success', 2),
    -- user 5: recursion_rex
    (5,  1,  'javascript', 'success', 1),
    (5,  2,  'javascript', 'success', 3),
    (5,  3,  'javascript', 'success', 2),
    (5,  4,  'javascript', 'success', 3),
    (5,  5,  'javascript', 'success', 2),
    (5,  6,  'javascript', 'success', 3),
    (5,  7,  'python',     'success', 3),
    (5,  8,  'python',     'success', 2),
    (5,  9,  'python',     'fail',    2),
    (5,  10, 'python',     'success', 2),
    (5,  11, 'python',     'success', 3),
    (5,  16, 'javascript', 'success', 3),
    (5,  17, 'javascript', 'success', 2),
    (5,  23, 'python',     'success', 2),
    -- user 6: byte_wizard (Java)
    (6,  1,  'javascript', 'success', 1),
    (6,  2,  'javascript', 'success', 3),
    (6,  3,  'java',       'success', 2),
    (6,  4,  'java',       'success', 3),
    (6,  5,  'java',       'success', 2),
    (6,  6,  'java',       'fail',    3),
    (6,  7,  'java',       'success', 3),
    (6,  8,  'java',       'success', 2),
    (6,  9,  'java',       'fail',    2),
    (6,  10, 'java',       'success', 2),
    (6,  16, 'java',       'success', 3),
    (6,  19, 'java',       'success', 2),
    (6,  21, 'java',       'fail',    2),
    -- user 7: loop_lord
    (7,  1,  'python',     'success', 1),
    (7,  2,  'python',     'success', 3),
    (7,  3,  'python',     'success', 2),
    (7,  4,  'python',     'success', 3),
    (7,  5,  'python',     'success', 2),
    (7,  6,  'python',     'fail',    3),
    (7,  7,  'python',     'success', 3),
    (7,  8,  'javascript', 'fail',    2),
    (7,  9,  'javascript', 'fail',    2),
    (7,  16, 'python',     'success', 3),
    (7,  17, 'python',     'success', 2),
    -- user 8: stack_overflow
    (8,  1,  'javascript', 'success', 1),
    (8,  2,  'javascript', 'success', 3),
    (8,  3,  'javascript', 'success', 2),
    (8,  4,  'javascript', 'fail',    3),
    (8,  5,  'cpp',        'success', 2),
    (8,  6,  'cpp',        'success', 3),
    (8,  7,  'cpp',        'fail',    3),
    (8,  16, 'javascript', 'success', 3),
    (8,  18, 'javascript', 'success', 3),
    -- user 9: null_pointer
    (9,  1,  'python',     'success', 1),
    (9,  2,  'python',     'success', 3),
    (9,  3,  'python',     'success', 2),
    (9,  4,  'python',     'fail',    3),
    (9,  5,  'python',     'success', 2),
    (9,  6,  'python',     'fail',    3),
    (9,  16, 'python',     'success', 3),
    -- user 10: debug_master
    (10, 1,  'javascript', 'success', 1),
    (10, 2,  'javascript', 'success', 3),
    (10, 3,  'javascript', 'success', 2),
    (10, 4,  'javascript', 'success', 3),
    (10, 5,  'javascript', 'fail',    2),
    (10, 16, 'javascript', 'success', 3),
    (10, 17, 'javascript', 'success', 2),
    -- user 11: frontend_ninja
    (11, 1,  'javascript', 'success', 1),
    (11, 2,  'javascript', 'success', 3),
    (11, 3,  'javascript', 'success', 2),
    (11, 4,  'javascript', 'fail',    3),
    (11, 16, 'javascript', 'success', 3),
    -- user 12: junior_dev
    (12, 1,  'javascript', 'success', 1),
    (12, 2,  'javascript', 'fail',    3),
    (12, 3,  'javascript', 'fail',    2),
    (12, 16, 'javascript', 'fail',    3),
    -- user 13: syntax_error
    (13, 1,  'python',     'success', 1),
    (13, 2,  'python',     'success', 3),
    (13, 3,  'python',     'fail',    2),
    -- user 14: bit_shifter
    (14, 1,  'javascript', 'success', 1),
    (14, 2,  'javascript', 'success', 3),
    -- user 15: coffee_coder
    (15, 1,  'cpp',        'success', 1),
    (15, 2,  'cpp',        'fail',    3),
    -- user 16: lazy_eval
    (16, 1,  'python',     'success', 1),
    (16, 2,  'python',     'fail',    3),
    -- user 17: grep_king
    (17, 1,  'javascript', 'success', 1),
    (17, 16, 'javascript', 'success', 3),
    -- user 18: type_safe
    (18, 1,  'typescript', 'success', 1),
    (18, 2,  'typescript', 'success', 3),
    -- user 19: newbie_99
    (19, 1,  'javascript', 'fail',    1),
    (19, 16, 'javascript', 'fail',    3),
    -- user 20: ghost_coder
    (20, 1,  'python',     'fail',    1),
    -- user 21: pro_hacker
    (21, 1,  'javascript', 'success', 1),
    (21, 2,  'javascript', 'success', 3),
    (21, 3,  'javascript', 'success', 2),
    (21, 4,  'javascript', 'success', 3),
    (21, 5,  'javascript', 'success', 2),
    (21, 6,  'javascript', 'success', 3),
    (21, 7,  'javascript', 'success', 3),
    (21, 8,  'javascript', 'success', 2),
    (21, 9,  'javascript', 'success', 2),
    (21, 10, 'javascript', 'success', 2),
    (21, 16, 'javascript', 'success', 3),
    (21, 22, 'javascript', 'success', 2),
    (21, 24, 'javascript', 'success', 2),
    (21, 25, 'javascript', 'success', 2),
    -- user 22: code_ninja
    (22, 1,  'python',     'success', 1),
    (22, 2,  'python',     'success', 3),
    (22, 3,  'python',     'success', 2),
    (22, 4,  'python',     'success', 3),
    (22, 5,  'python',     'success', 2),
    (22, 6,  'python',     'success', 3),
    (22, 7,  'python',     'success', 3),
    (22, 9,  'python',     'success', 2),
    (22, 16, 'python',     'success', 3),
    (22, 19, 'python',     'success', 2),
    (22, 25, 'python',     'fail',    2),
    -- user 23: data_wizard
    (23, 1,  'javascript', 'success', 1),
    (23, 2,  'javascript', 'success', 3),
    (23, 5,  'javascript', 'success', 2),
    (23, 6,  'javascript', 'success', 3),
    (23, 8,  'javascript', 'success', 2),
    (23, 10, 'javascript', 'success', 2),
    (23, 13, 'javascript', 'success', 1),
    (23, 16, 'javascript', 'success', 3),
    (23, 20, 'javascript', 'success', 2),
    -- user 24: pixel_pusher
    (24, 1,  'javascript', 'success', 1),
    (24, 2,  'javascript', 'success', 3),
    (24, 3,  'javascript', 'success', 2),
    (24, 16, 'javascript', 'success', 3),
    (24, 17, 'javascript', 'success', 2),
    -- user 25: hash_table
    (25, 1,  'javascript', 'success', 1),
    (25, 2,  'javascript', 'success', 3),
    (25, 3,  'javascript', 'fail',    2),
    (25, 16, 'python',     'success', 3)
) AS t(uid, cid, lang, stat, total)
ON CONFLICT DO NOTHING;

-- ─── HISTORY (активность за последние 7 дней) ────────────────────────────────
INSERT INTO "HistoryChallenges" ("userId", "challengeId", code, language, status, "executionTimeMs", "testsPassed", "testsTotal", "createdAt")
SELECT
    uid, cid, 'function solution() { return 42; }', lang, stat,
    (20 + floor(random() * 300))::INTEGER,
    CASE WHEN stat = 'success' THEN total ELSE (floor(random() * total))::INTEGER END,
    total,
    NOW() - (floor(random() * 7)  || ' days')::INTERVAL
        - (floor(random() * 22) || ' hours')::INTERVAL
FROM (VALUES
    (2,  1,  'javascript', 'success', 1),
    (2,  5,  'javascript', 'success', 2),
    (2,  16, 'javascript', 'success', 3),
    (2,  20, 'javascript', 'success', 2),
    (2,  22, 'javascript', 'success', 2),
    (3,  2,  'python',     'success', 3),
    (3,  6,  'python',     'fail',    3),
    (3,  18, 'python',     'success', 3),
    (3,  19, 'python',     'success', 2),
    (4,  3,  'cpp',        'success', 2),
    (4,  8,  'cpp',        'fail',    2),
    (4,  23, 'cpp',        'success', 2),
    (4,  25, 'cpp',        'success', 2),
    (5,  4,  'javascript', 'success', 3),
    (5,  9,  'python',     'fail',    2),
    (5,  19, 'javascript', 'success', 2),
    (5,  24, 'javascript', 'success', 2),
    (6,  5,  'java',       'success', 2),
    (6,  7,  'java',       'success', 3),
    (6,  21, 'java',       'success', 2),
    (6,  25, 'java',       'fail',    2),
    (7,  1,  'python',     'success', 1),
    (7,  3,  'python',     'fail',    2),
    (7,  17, 'python',     'success', 2),
    (8,  2,  'javascript', 'success', 3),
    (8,  6,  'cpp',        'success', 3),
    (8,  22, 'javascript', 'success', 2),
    (9,  1,  'python',     'success', 1),
    (9,  4,  'python',     'fail',    3),
    (10, 3,  'javascript', 'success', 2),
    (10, 7,  'javascript', 'fail',    3),
    (11, 2,  'javascript', 'success', 3),
    (11, 11, 'javascript', 'success', 3),
    (12, 1,  'javascript', 'fail',    1),
    (13, 1,  'python',     'success', 1),
    (14, 2,  'javascript', 'success', 3),
    (15, 1,  'cpp',        'success', 1),
    (16, 1,  'python',     'fail',    1),
    (17, 2,  'javascript', 'success', 3),
    (18, 1,  'typescript', 'success', 1),
    (21, 11, 'javascript', 'success', 3),
    (21, 20, 'javascript', 'success', 2),
    (22, 16, 'python',     'success', 3),
    (22, 22, 'python',     'success', 2),
    (23, 18, 'javascript', 'success', 3),
    (23, 21, 'javascript', 'success', 2),
    (24, 5,  'javascript', 'success', 2),
    (24, 22, 'javascript', 'success', 2),
    (25, 16, 'python',     'fail',    3),
    (25, 17, 'javascript', 'success', 2)
) AS t(uid, cid, lang, stat, total)
ON CONFLICT DO NOTHING;

-- ─── HISTORY (провальные попытки перед успехом, реализм) ─────────────────────
INSERT INTO "HistoryChallenges" ("userId", "challengeId", code, language, status, "executionTimeMs", "testsPassed", "testsTotal", "createdAt")
SELECT
    uid, cid,
    'function solution() { /* buggy attempt */ return undefined; }',
    lang, 'fail',
    (50 + floor(random() * 500))::INTEGER,
    (floor(random() * total))::INTEGER,
    total,
    NOW() - ((floor(random() * 60) + 1) || ' days')::INTERVAL
FROM (VALUES
    (2,  9,  'javascript', 2), (2,  14, 'python',     1), (2,  15, 'javascript', 1),
    (3,  8,  'python',     2), (3,  9,  'python',     2), (3,  15, 'python',     1),
    (4,  7,  'cpp',        3), (4,  13, 'javascript', 1), (4,  14, 'cpp',        1),
    (4,  15, 'cpp',        1),
    (5,  9,  'python',     2), (5,  13, 'javascript', 1), (5,  14, 'javascript', 1),
    (5,  15, 'python',     1),
    (6,  6,  'java',       3), (6,  9,  'java',       2), (6,  14, 'java',       1),
    (6,  15, 'java',       1),
    (7,  6,  'python',     3), (7,  8,  'javascript', 2), (7,  9,  'javascript', 2),
    (7,  14, 'python',     1), (7,  15, 'python',     1),
    (8,  4,  'javascript', 3), (8,  7,  'cpp',        3), (8,  9,  'javascript', 2),
    (8,  14, 'cpp',        1), (8,  15, 'cpp',        1),
    (9,  4,  'python',     3), (9,  6,  'python',     3), (9,  9,  'python',     2),
    (9,  14, 'python',     1), (9,  15, 'python',     1),
    (10, 5,  'javascript', 2), (10, 9,  'javascript', 2), (10, 14, 'javascript', 1),
    (11, 4,  'javascript', 3), (11, 9,  'javascript', 2),
    (12, 2,  'javascript', 3), (12, 3,  'javascript', 2), (12, 9,  'javascript', 2),
    (13, 3,  'python',     2), (13, 9,  'python',     2),
    (14, 9,  'javascript', 2),
    (15, 2,  'cpp',        3), (16, 2,  'python',     3),
    (17, 9,  'javascript', 2), (18, 9,  'typescript', 2),
    (19, 1,  'javascript', 1), (20, 1,  'python',     1),
    (21, 14, 'javascript', 1), (21, 15, 'javascript', 1),
    (22, 9,  'python',     2), (22, 15, 'python',     1),
    (23, 9,  'javascript', 2), (23, 14, 'javascript', 1),
    (24, 9,  'javascript', 2), (25, 9,  'python',     2)
) AS t(uid, cid, lang, total)
ON CONFLICT DO NOTHING;

-- ─── REVIEWS (один отзыв на пользователя на задачу — composite PK) ───────────
INSERT INTO "ReviewChallenges" ("userId", "challengeId", content, rating, "createdAt") VALUES
    (2,  1,  'Отличная задача для начинающих!',                            5, NOW() - '85 days'::INTERVAL),
    (2,  2,  'Хорошее введение в математику.',                             4, NOW() - '80 days'::INTERVAL),
    (2,  5,  'Интересная задача на массивы.',                              5, NOW() - '70 days'::INTERVAL),
    (2,  8,  'Two Sum — классика! Обязательна к решению.',                 5, NOW() - '30 days'::INTERVAL),
    (2,  14, 'LRU кэш — очень сложная, но реальная задача!',              5, NOW() -  '3 days'::INTERVAL),
    (2,  16, 'FizzBuzz — просто и понятно, отлично для разминки.',         4, NOW() - '15 days'::INTERVAL),
    (2,  17, 'Подсчёт гласных — хорошая лёгкая задача.',                  4, NOW() -  '8 days'::INTERVAL),
    (3,  1,  'Слишком просто, но нужна для старта.',                       3, NOW() - '75 days'::INTERVAL),
    (3,  4,  'Хорошая проверка на понимание строк.',                       4, NOW() - '65 days'::INTERVAL),
    (3,  6,  'Рекурсия раскрыта хорошо.',                                  5, NOW() - '50 days'::INTERVAL),
    (3,  9,  'Сложная, но очень полезная задача.',                         4, NOW() - '20 days'::INTERVAL),
    (3,  16, 'FizzBuzz — отличная задача для собеседований.',              5, NOW() - '10 days'::INTERVAL),
    (3,  22, 'Анаграммы — интересная задача на хэш-таблицы.',              4, NOW() -  '5 days'::INTERVAL),
    (4,  3,  'Хорошая задача на строки.',                                  4, NOW() - '82 days'::INTERVAL),
    (4,  7,  'Фибоначчи — must have!',                                     5, NOW() - '60 days'::INTERVAL),
    (4,  10, 'Бинарный поиск через практику — супер.',                     5, NOW() - '40 days'::INTERVAL),
    (4,  13, 'Глубокое клонирование — сложная, но полезная.',              4, NOW() - '15 days'::INTERVAL),
    (4,  15, 'Красно-чёрное дерево — это монстр. 10/10.',                  5, NOW() -  '2 days'::INTERVAL),
    (4,  18, 'Is Prime — классическая задача, хорошо объяснена.',          5, NOW() -  '7 days'::INTERVAL),
    (5,  1,  'Простая, но нужна.',                                         3, NOW() - '88 days'::INTERVAL),
    (5,  5,  'Хорошая задача на поиск максимума.',                         4, NOW() - '55 days'::INTERVAL),
    (5,  8,  'Отличная задача!',                                           5, NOW() - '25 days'::INTERVAL),
    (5,  11, 'Скобки — интересная задача на стек.',                        5, NOW() - '10 days'::INTERVAL),
    (5,  16, 'FizzBuzz решается быстро, но полезно.',                      4, NOW() - '12 days'::INTERVAL),
    (6,  2,  'Простовато, но ок.',                                         3, NOW() - '78 days'::INTERVAL),
    (6,  6,  'Хорошая рекурсия.',                                          4, NOW() - '62 days'::INTERVAL),
    (6,  9,  'Merge Sort — сложно, но теперь понял!',                      5, NOW() - '35 days'::INTERVAL),
    (6,  16, 'FizzBuzz для Java немного отличается — осторожно с типами.', 4, NOW() -  '9 days'::INTERVAL),
    (7,  4,  'Интересная задача на строки.',                               4, NOW() - '72 days'::INTERVAL),
    (7,  7,  'Фибоначчи написан хорошо.',                                  4, NOW() - '48 days'::INTERVAL),
    (7,  16, 'Простая задача, быстро решается.',                           3, NOW() - '20 days'::INTERVAL),
    (7,  17, 'Подсчёт гласных — хорошо для Python.',                      4, NOW() - '11 days'::INTERVAL),
    (8,  5,  'Хорошая задача.',                                            4, NOW() - '68 days'::INTERVAL),
    (8,  6,  'Факториал объяснён понятно.',                                5, NOW() - '45 days'::INTERVAL),
    (8,  16, 'Просто и приятно.',                                          4, NOW() - '14 days'::INTERVAL),
    (9,  1,  'ОК для новичков.',                                           3, NOW() - '90 days'::INTERVAL),
    (9,  3,  'Простая и понятная.',                                        4, NOW() - '58 days'::INTERVAL),
    (9,  16, 'FizzBuzz — хорошая разминка.',                               4, NOW() - '16 days'::INTERVAL),
    (10, 2,  'Хорошее начало.',                                            4, NOW() - '83 days'::INTERVAL),
    (10, 4,  'Хорошая задача.',                                            4, NOW() - '52 days'::INTERVAL),
    (11, 1,  'Отличный старт!',                                            5, NOW() - '77 days'::INTERVAL),
    (11, 3,  'Понравилась.',                                               4, NOW() - '42 days'::INTERVAL),
    (12, 1,  'Слишком лёгкая.',                                            2, NOW() - '86 days'::INTERVAL),
    (13, 2,  'Хорошая.',                                                   4, NOW() - '66 days'::INTERVAL),
    (14, 1,  'Отлично!',                                                   5, NOW() -  '5 days'::INTERVAL),
    (15, 2,  'Понравилось.',                                               4, NOW() -  '8 days'::INTERVAL),
    (21, 1,  'Hello World — приятное начало.',                             5, NOW() - '40 days'::INTERVAL),
    (21, 8,  'Two Sum — мастхэв для собеседований.',                       5, NOW() - '18 days'::INTERVAL),
    (21, 16, 'FizzBuzz прост, но популярен на интервью.',                  4, NOW() - '13 days'::INTERVAL),
    (21, 22, 'Анаграммы — элегантная задача.',                             5, NOW() -  '6 days'::INTERVAL),
    (22, 1,  'Хорошо для старта.',                                         4, NOW() - '35 days'::INTERVAL),
    (22, 6,  'Рекурсия через факториал — классика.',                       5, NOW() - '22 days'::INTERVAL),
    (22, 16, 'Быстро решается на Python.',                                 4, NOW() -  '7 days'::INTERVAL),
    (23, 1,  'Всегда приятно начать с Hello World.',                       5, NOW() - '30 days'::INTERVAL),
    (23, 8,  'Two Sum — одна из моих любимых задач.',                      5, NOW() - '19 days'::INTERVAL),
    (24, 1,  'Простая, подходит для разминки.',                            4, NOW() - '20 days'::INTERVAL),
    (24, 16, 'FizzBuzz объяснён доступно.',                                4, NOW() -  '4 days'::INTERVAL),
    (25, 1,  'Хорошая первая задача.',                                     4, NOW() - '15 days'::INTERVAL),
    (3,  15, 'Невозможно сложно для меня пока.',                           2, NOW() -  '1 days'::INTERVAL)
ON CONFLICT ("userId", "challengeId") DO NOTHING;

-- ─── REPORT REASONS ──────────────────────────────────────────────────────────
INSERT INTO "ReportReasons" (id, name) VALUES
    (1, 'Некорректное условие'),
    (2, 'Неправильные тесты'),
    (3, 'Спам / дубликат'),
    (4, 'Оскорбительный контент'),
    (5, 'Неверная сложность')
ON CONFLICT (id) DO NOTHING;

-- ─── REPORTS ─────────────────────────────────────────────────────────────────
INSERT INTO "ReportChallenges" ("userId", "challengeId", "reasonId", "reasonText", status, "createdAt") VALUES
    (3,  2,  2,    'При вводе отрицательных чисел система выдаёт ошибку округления.',      'Pending',   NOW() - '60 days'::INTERVAL),
    (5,  3,  3,    'Эта задача скопирована с LeetCode без изменений.',                     'Pending',   NOW() - '55 days'::INTERVAL),
    (7,  9,  1,    'В описании Merge Sort не указано, должен ли алгоритм быть in-place.',  'Resolved',  NOW() - '50 days'::INTERVAL),
    (9,  14, 2,    'LRU Cache: тест не проверяет граничный случай capacity=1.',            'Pending',   NOW() - '45 days'::INTERVAL),
    (11, 4,  NULL, 'В описании задачи опечатка в слове "палиндром".',                      'Resolved',  NOW() - '40 days'::INTERVAL),
    (12, 15, 5,    'Задача не соответствует заявленному уровню — это не для платформы.',   'Dismissed', NOW() - '35 days'::INTERVAL),
    (13, 7,  2,    'Для n=0 Фибоначчи должен быть 0, но тест ожидает 1.',                 'Pending',   NOW() - '30 days'::INTERVAL),
    (14, 8,  3,    'Two Sum — прямая копия с LeetCode #1 без адаптации.',                  'Pending',   NOW() - '25 days'::INTERVAL),
    (16, 11, 2,    'Valid Brackets: тест падает на пустой строке.',                        'Resolved',  NOW() - '20 days'::INTERVAL),
    (17, 6,  NULL, 'В примере написано factorial(5)=20, должно быть 120.',                 'Resolved',  NOW() - '18 days'::INTERVAL),
    (18, 13, 1,    'Deep Clone не уточняет поведение с циклическими ссылками.',            'Pending',   NOW() - '14 days'::INTERVAL),
    (19, 5,  2,    'Find Max падает на массиве из одного элемента.',                       'Pending',   NOW() - '10 days'::INTERVAL),
    (20, 10, 2,    'Binary Search должен возвращать -1 при отсутствии, а не null.',        'Pending',   NOW() -  '7 days'::INTERVAL),
    (12, 12, 3,    'Flatten Array скопирована с MDN документации.',                        'Dismissed', NOW() -  '5 days'::INTERVAL),
    (15, 3,  NULL, 'В примере reverse("hello") написан неправильный результат.',           'Pending',   NOW() -  '3 days'::INTERVAL),
    (8,  1,  5,    'Hello World не имеет смысла как задача — нужно удалить.',              'Dismissed', NOW() -  '1 days'::INTERVAL),
    (21, 16, 2,    'FizzBuzz: тест не проверяет отрицательные числа.',                     'Pending',   NOW() -  '4 days'::INTERVAL),
    (22, 25, 1,    'Quick Sort: описание не уточняет поведение с дублями.',                'Pending',   NOW() -  '2 days'::INTERVAL),
    (23, 21, 5,    'Matrix Transpose отмечена как 4/10, но ощущается как 5/10.',           'Pending',   NOW() -  '6 days'::INTERVAL),
    (24, 22, NULL, 'Valid Anagram: не ясно, учитывать ли пробелы.',                        'Pending',   NOW() -  '9 days'::INTERVAL)
ON CONFLICT DO NOTHING;

-- Проставляем resolvedById и resolvedAt для уже закрытых жалоб (admin = id 1)
UPDATE "ReportChallenges"
SET "resolvedById" = 1,
    "resolvedAt"   = "createdAt" + INTERVAL '2 days'
WHERE status IN ('Resolved', 'Dismissed')
  AND "resolvedById" IS NULL;

SELECT setval(pg_get_serial_sequence('"Notifications"', 'id'), COALESCE((SELECT MAX(id) FROM "Notifications"), 1));

-- ─── RESET SEQUENCES ─────────────────────────────────────────────────────────
SELECT setval(pg_get_serial_sequence('"Roles"',              'id'), (SELECT MAX(id) FROM "Roles"));
SELECT setval(pg_get_serial_sequence('"Topics"',             'id'), (SELECT MAX(id) FROM "Topics"));
SELECT setval(pg_get_serial_sequence('"Users"',              'id'), (SELECT MAX(id) FROM "Users"));
SELECT setval(pg_get_serial_sequence('"Challenges"',         'id'), (SELECT MAX(id) FROM "Challenges"));
SELECT setval(pg_get_serial_sequence('"ChallengeParameters"','id'), (SELECT MAX(id) FROM "ChallengeParameters"));
SELECT setval(pg_get_serial_sequence('"ChallengeTestCases"', 'id'), (SELECT MAX(id) FROM "ChallengeTestCases"));
SELECT setval(pg_get_serial_sequence('"TestCaseArguments"',  'id'), (SELECT MAX(id) FROM "TestCaseArguments"));
SELECT setval(pg_get_serial_sequence('"HistoryChallenges"',  'id'), (SELECT MAX(id) FROM "HistoryChallenges"));
SELECT setval(pg_get_serial_sequence('"ReportReasons"',      'id'), (SELECT MAX(id) FROM "ReportReasons"));
SELECT setval(pg_get_serial_sequence('"ReportChallenges"',   'id'), (SELECT MAX(id) FROM "ReportChallenges"));
-- ReviewChallenges использует составной PK — sequence не нужен

