-- ─── DROP OLD TABLES ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "SolutionComments"  CASCADE;
DROP TABLE IF EXISTS "SolutionVotes"     CASCADE;
DROP TABLE IF EXISTS "AttemptAnswers"    CASCADE;
DROP TABLE IF EXISTS "QuestionTestCases" CASCADE;
DROP TABLE IF EXISTS "TestAttempts"      CASCADE;
DROP TABLE IF EXISTS "QuestionOptions"   CASCADE;
DROP TABLE IF EXISTS "Questions"         CASCADE;
DROP TABLE IF EXISTS "Tests"             CASCADE;
DROP TABLE IF EXISTS "QuestionTypes"     CASCADE;
DROP TABLE IF EXISTS "TestQuestions"   CASCADE;
DROP TABLE IF EXISTS "QuestionAnswers" CASCADE;
DROP TABLE IF EXISTS "UserAchievements" CASCADE;
DROP TABLE IF EXISTS "Achievements" CASCADE;
DROP TABLE IF EXISTS "Reports" CASCADE;
DROP TABLE IF EXISTS "Notifications" CASCADE;
DROP TABLE IF EXISTS "ReportReasons" CASCADE;
DROP TABLE IF EXISTS "Reviews" CASCADE;
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

-- ─── SOLUTION VOTES (лайки/дизлайки к решениям) ─────────────────────────────
-- vote: 1 = лайк, -1 = дизлайк; один голос на пользователя на решение (3НФ)
CREATE TABLE IF NOT EXISTS "SolutionVotes" (
    id            SERIAL PRIMARY KEY,
    "solutionId"  INTEGER  NOT NULL,
    "userId"      INTEGER  NOT NULL,
    vote          SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
    "createdAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("solutionId", "userId"),
    CONSTRAINT fk_sv_solution FOREIGN KEY ("solutionId") REFERENCES "HistoryChallenges"(id) ON DELETE CASCADE,
    CONSTRAINT fk_sv_user     FOREIGN KEY ("userId")     REFERENCES "Users"(id)             ON DELETE CASCADE
);

-- ─── SOLUTION COMMENTS (комментарии к решениям) ──────────────────────────────
-- Каждый комментарий независимо хранит solutionId и userId — нет транзитивных
-- зависимостей, все атрибуты зависят только от PK (id). 3НФ соблюдена.
CREATE TABLE IF NOT EXISTS "SolutionComments" (
    id            SERIAL PRIMARY KEY,
    "solutionId"  INTEGER   NOT NULL,
    "userId"      INTEGER   NOT NULL,
    content       TEXT      NOT NULL,
    "createdAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sc_solution FOREIGN KEY ("solutionId") REFERENCES "HistoryChallenges"(id) ON DELETE CASCADE,
    CONSTRAINT fk_sc_user     FOREIGN KEY ("userId")     REFERENCES "Users"(id)             ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sv_solution ON "SolutionVotes"    ("solutionId");
CREATE INDEX IF NOT EXISTS idx_sc_solution ON "SolutionComments" ("solutionId");

-- ─── QUESTION TYPES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "QuestionTypes" (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- ─── TESTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Tests" (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    "timeLimitMinutes"  INTEGER,
    "isPublished"       BOOLEAN      NOT NULL DEFAULT FALSE,
    "createdBy"         INTEGER,
    "topicId"           INTEGER,
    difficulty          INTEGER,
    "shuffleQuestions"  BOOLEAN      NOT NULL DEFAULT FALSE,
    "shuffleOptions"      BOOLEAN      NOT NULL DEFAULT FALSE,
    "questionPoolSize"    INTEGER,
    "showCorrectAnswers"  BOOLEAN      NOT NULL DEFAULT TRUE,
    "createdAt"         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_user  FOREIGN KEY ("createdBy") REFERENCES "Users"(id) ON DELETE SET NULL,
    CONSTRAINT fk_test_topic FOREIGN KEY ("topicId")   REFERENCES "Topics"(id) ON DELETE SET NULL,
    CONSTRAINT check_test_difficulty CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 10))
);

-- ─── REVIEWS (composite PK: one review per user per challenge) ────────────────
CREATE TABLE IF NOT EXISTS "Reviews" (
    id            SERIAL PRIMARY KEY,
    "userId"      INTEGER NOT NULL,
    "challengeId" INTEGER,
    "testId"      INTEGER,
    content       TEXT,
    rating        INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    "createdAt"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_user      FOREIGN KEY ("userId")      REFERENCES "Users"(id)      ON DELETE CASCADE,
    CONSTRAINT fk_review_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_test      FOREIGN KEY ("testId")      REFERENCES "Tests"(id)      ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_challenge ON "Reviews" ("userId", "challengeId") WHERE "challengeId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_test      ON "Reviews" ("userId", "testId")      WHERE "testId"      IS NOT NULL;

-- ─── REPORT REASONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReportReasons" (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- ─── REPORTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Reports" (
    id               SERIAL PRIMARY KEY,
    "userId"         INTEGER NOT NULL,
    "challengeId"    INTEGER,
    "testId"         INTEGER,
    "reasonId"       INTEGER,
    "reasonText"     TEXT,
    status           VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "createdAt"      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "resolvedById"   INTEGER,
    "resolvedAt"     TIMESTAMP,
    CONSTRAINT fk_report_user      FOREIGN KEY ("userId")        REFERENCES "Users"(id)         ON DELETE CASCADE,
    CONSTRAINT fk_report_challenge FOREIGN KEY ("challengeId")   REFERENCES "Challenges"(id)    ON DELETE CASCADE,
    CONSTRAINT fk_report_test      FOREIGN KEY ("testId")        REFERENCES "Tests"(id)         ON DELETE CASCADE,
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

-- ─── QUESTIONS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Questions" (
    id              SERIAL PRIMARY KEY,
    "testId"        INTEGER       NOT NULL,
    "typeId"        INTEGER       NOT NULL,
    text            TEXT          NOT NULL,
    points          REAL          NOT NULL DEFAULT 1,
    "order"         INTEGER       NOT NULL DEFAULT 0,
    "allowMultiple" BOOLEAN       DEFAULT FALSE,
    "caseSensitive" BOOLEAN       DEFAULT FALSE,
    tolerance       REAL,
    "codeLanguage"  VARCHAR(255),
    "starterCode"   TEXT,
    "funcName"      VARCHAR(255),
    "imageUrl"      VARCHAR(500),
    CONSTRAINT fk_question_test FOREIGN KEY ("testId") REFERENCES "Tests"(id)         ON DELETE CASCADE,
    CONSTRAINT fk_question_type FOREIGN KEY ("typeId") REFERENCES "QuestionTypes"(id)
);

-- ─── QUESTION OPTIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "QuestionOptions" (
    id           SERIAL PRIMARY KEY,
    "questionId" INTEGER  NOT NULL,
    text         TEXT     NOT NULL,
    "isCorrect"  BOOLEAN  NOT NULL DEFAULT FALSE,
    "matchPair"  TEXT,
    "blankIndex" INTEGER,
    "order"      INTEGER  NOT NULL DEFAULT 0,
    CONSTRAINT fk_option_question FOREIGN KEY ("questionId") REFERENCES "Questions"(id) ON DELETE CASCADE
);

-- ─── TEST ATTEMPTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TestAttempts" (
    id           SERIAL PRIMARY KEY,
    "testId"     INTEGER       NOT NULL,
    "userId"     INTEGER       NOT NULL,
    "startedAt"  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP,
    status       VARCHAR(50)   NOT NULL DEFAULT 'active',
    score        REAL,
    "maxScore"   REAL          NOT NULL DEFAULT 0,
    CONSTRAINT fk_attempt_test FOREIGN KEY ("testId") REFERENCES "Tests"(id)  ON DELETE CASCADE,
    CONSTRAINT fk_attempt_user FOREIGN KEY ("userId") REFERENCES "Users"(id)  ON DELETE CASCADE
);

-- ─── ATTEMPT QUESTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AttemptQuestions" (
    id           SERIAL PRIMARY KEY,
    "attemptId"  INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    position     INTEGER NOT NULL,
    CONSTRAINT fk_aq_attempt  FOREIGN KEY ("attemptId")  REFERENCES "TestAttempts"(id) ON DELETE CASCADE,
    CONSTRAINT fk_aq_question FOREIGN KEY ("questionId") REFERENCES "Questions"(id)    ON DELETE CASCADE
);

-- ─── ATTEMPT ANSWERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AttemptAnswers" (
    id            SERIAL PRIMARY KEY,
    "attemptId"   INTEGER NOT NULL,
    "questionId"  INTEGER NOT NULL,
    "answerText"  TEXT,
    "codeAnswer"  TEXT,
    "isCorrect"   BOOLEAN,
    "pointsEarned" REAL   NOT NULL DEFAULT 0,
    CONSTRAINT fk_answer_attempt  FOREIGN KEY ("attemptId")  REFERENCES "TestAttempts"(id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_question FOREIGN KEY ("questionId") REFERENCES "Questions"(id)    ON DELETE CASCADE
);

-- ─── ANSWER SELECTED OPTIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AnswerSelectedOptions" (
    id         SERIAL PRIMARY KEY,
    "answerId" INTEGER NOT NULL,
    "optionId" INTEGER NOT NULL,
    CONSTRAINT fk_aso_answer FOREIGN KEY ("answerId") REFERENCES "AttemptAnswers"(id)   ON DELETE CASCADE,
    CONSTRAINT fk_aso_option FOREIGN KEY ("optionId") REFERENCES "QuestionOptions"(id)  ON DELETE CASCADE
);

-- ─── ANSWER MATCHING PAIRS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AnswerMatchingPairs" (
    id          SERIAL PRIMARY KEY,
    "answerId"  INTEGER NOT NULL,
    "optionId"  INTEGER NOT NULL,
    "matchPair" TEXT    NOT NULL,
    CONSTRAINT fk_amp_answer FOREIGN KEY ("answerId") REFERENCES "AttemptAnswers"(id)   ON DELETE CASCADE,
    CONSTRAINT fk_amp_option FOREIGN KEY ("optionId") REFERENCES "QuestionOptions"(id)  ON DELETE CASCADE
);

-- ─── ANSWER TEST CASE RESULTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AnswerTestCaseResults" (
    id               SERIAL  PRIMARY KEY,
    "answerId"       INTEGER NOT NULL,
    position         INTEGER NOT NULL,
    input            TEXT,
    "expectedOutput" TEXT    NOT NULL,
    "actualOutput"   TEXT,
    passed           BOOLEAN NOT NULL DEFAULT FALSE,
    "isHidden"       BOOLEAN NOT NULL DEFAULT FALSE,
    "timedOut"       BOOLEAN NOT NULL DEFAULT FALSE,
    error            TEXT,
    CONSTRAINT fk_atcr_answer FOREIGN KEY ("answerId") REFERENCES "AttemptAnswers"(id) ON DELETE CASCADE
);

-- ─── QUESTION TEST CASES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "QuestionTestCases" (
    id               SERIAL PRIMARY KEY,
    "questionId"     INTEGER NOT NULL,
    input            TEXT,
    "expectedOutput" TEXT    NOT NULL,
    "isHidden"       BOOLEAN NOT NULL DEFAULT FALSE,
    "order"          INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_qtc_question FOREIGN KEY ("questionId") REFERENCES "Questions"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_qtc_question ON "QuestionTestCases" ("questionId");

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

-- ─── USERS (6 тестовых пользователей, пароль для всех: "password123") ─────────
-- roleId: 1 = owner, 2 = admin, 3 = user
INSERT INTO "Users" (id, username, password, email, "roleId", experience, rating) VALUES
    (1, 'owner',  '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'owner@example.com',  1, 9999, 9999),
    (2, 'admin1', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'admin1@example.com', 2, 5200, 3800),
    (3, 'admin2', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'admin2@example.com', 2, 4700, 3300),
    (4, 'user1',  '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'user1@example.com',  3, 1800, 1200),
    (5, 'user2',  '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'user2@example.com',  3,  850,  580),
    (6, 'user3',  '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'user3@example.com',  3,  200,  120)
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
INSERT INTO "HistoryChallenges" ("userId", "challengeId", code, language, status, "executionTimeMs", "testsPassed", "testsTotal", "createdAt")
SELECT
    uid, cid,
    CASE lang
        WHEN 'javascript' THEN 'function solution(a, b) { return a + b; }'
        WHEN 'python'     THEN 'def solution(a, b):\n    return a + b'
        WHEN 'cpp'        THEN 'auto solution(int a, int b) { return a + b; }'
        WHEN 'typescript' THEN 'function solution(a: number, b: number): number { return a + b; }'
        ELSE 'function solution() { return null; }'
    END,
    lang, stat,
    (30 + floor(random() * 970))::INTEGER,
    CASE WHEN stat = 'success' THEN total ELSE (floor(random() * total))::INTEGER END,
    total,
    NOW() - ((floor(random() * 83) + 5) || ' days')::INTERVAL
        - (floor(random() * 23) || ' hours')::INTERVAL
FROM (VALUES
    -- user 2: admin1
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
    -- user 3: admin2
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
    -- user 4: user1 (C++)
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
    -- user 5: user2
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
    -- user 6: user3
    (6,  1,  'javascript', 'success', 1),
    (6,  2,  'javascript', 'success', 3),
    (6,  3,  'javascript', 'success', 2),
    (6,  4,  'javascript', 'success', 3),
    (6,  5,  'javascript', 'success', 2),
    (6,  16, 'javascript', 'success', 3),
    (6,  17, 'javascript', 'success', 2),
    (6,  18, 'javascript', 'fail',    3)
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
    (6,  1,  'javascript', 'success', 1),
    (6,  2,  'javascript', 'success', 3),
    (6,  16, 'javascript', 'success', 3),
    (6,  19, 'javascript', 'fail',    2)
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
    (6,  9,  'javascript', 2), (6,  14, 'javascript', 1), (6,  15, 'javascript', 1)
) AS t(uid, cid, lang, total)
ON CONFLICT DO NOTHING;

-- ─── REVIEWS (один отзыв на пользователя на задачу — composite PK) ───────────
INSERT INTO "Reviews" ("userId", "challengeId", content, rating, "createdAt") VALUES
    (2,  1,  'Отличная задача для начинающих!',                   5, NOW() - '85 days'::INTERVAL),
    (2,  2,  'Хорошее введение в математику.',                    4, NOW() - '80 days'::INTERVAL),
    (2,  5,  'Интересная задача на массивы.',                     5, NOW() - '70 days'::INTERVAL),
    (2,  8,  'Two Sum — классика! Обязательна к решению.',        5, NOW() - '30 days'::INTERVAL),
    (2,  14, 'LRU кэш — очень сложная, но реальная задача!',     5, NOW() -  '3 days'::INTERVAL),
    (2,  16, 'FizzBuzz — просто и понятно, отлично для разминки.',4, NOW() - '15 days'::INTERVAL),
    (2,  17, 'Подсчёт гласных — хорошая лёгкая задача.',         4, NOW() -  '8 days'::INTERVAL),
    (3,  1,  'Слишком просто, но нужна для старта.',              3, NOW() - '75 days'::INTERVAL),
    (3,  4,  'Хорошая проверка на понимание строк.',              4, NOW() - '65 days'::INTERVAL),
    (3,  6,  'Рекурсия раскрыта хорошо.',                         5, NOW() - '50 days'::INTERVAL),
    (3,  9,  'Сложная, но очень полезная задача.',                4, NOW() - '20 days'::INTERVAL),
    (3,  16, 'FizzBuzz — отличная задача для собеседований.',     5, NOW() - '10 days'::INTERVAL),
    (3,  15, 'Невозможно сложно для меня пока.',                  2, NOW() -  '1 days'::INTERVAL),
    (4,  3,  'Хорошая задача на строки.',                         4, NOW() - '82 days'::INTERVAL),
    (4,  7,  'Фибоначчи — must have!',                            5, NOW() - '60 days'::INTERVAL),
    (4,  10, 'Бинарный поиск через практику — супер.',            5, NOW() - '40 days'::INTERVAL),
    (4,  13, 'Глубокое клонирование — сложная, но полезная.',     4, NOW() - '15 days'::INTERVAL),
    (4,  18, 'Is Prime — классическая задача, хорошо объяснена.', 5, NOW() -  '7 days'::INTERVAL),
    (5,  1,  'Простая, но нужна.',                                3, NOW() - '88 days'::INTERVAL),
    (5,  5,  'Хорошая задача на поиск максимума.',                4, NOW() - '55 days'::INTERVAL),
    (5,  8,  'Отличная задача!',                                  5, NOW() - '25 days'::INTERVAL),
    (5,  11, 'Скобки — интересная задача на стек.',               5, NOW() - '10 days'::INTERVAL),
    (5,  16, 'FizzBuzz решается быстро, но полезно.',             4, NOW() - '12 days'::INTERVAL),
    (6,  1,  'Хорошее начало, мне понравилось.',                  4, NOW() - '78 days'::INTERVAL),
    (6,  2,  'Простая, но полезная для старта.',                  3, NOW() - '62 days'::INTERVAL),
    (6,  16, 'FizzBuzz — быстро решил, приятно.',                 4, NOW() -  '9 days'::INTERVAL)
ON CONFLICT DO NOTHING;

-- ─── REPORT REASONS ──────────────────────────────────────────────────────────
INSERT INTO "ReportReasons" (id, name) VALUES
    (1, 'Некорректное условие'),
    (2, 'Неправильные тесты'),
    (3, 'Спам / дубликат'),
    (4, 'Оскорбительный контент'),
    (5, 'Неверная сложность')
ON CONFLICT (id) DO NOTHING;

-- ─── REPORTS ─────────────────────────────────────────────────────────────────
INSERT INTO "Reports" ("userId", "challengeId", "reasonId", "reasonText", status, "createdAt") VALUES
    (3, 2,  2,    'При вводе отрицательных чисел система выдаёт ошибку округления.',    'Pending',   NOW() - '60 days'::INTERVAL),
    (5, 3,  3,    'Эта задача скопирована с LeetCode без изменений.',                   'Pending',   NOW() - '55 days'::INTERVAL),
    (4, 9,  1,    'В описании Merge Sort не указано, должен ли алгоритм быть in-place.','Resolved',  NOW() - '50 days'::INTERVAL),
    (6, 14, 2,    'LRU Cache: тест не проверяет граничный случай capacity=1.',          'Pending',   NOW() - '45 days'::INTERVAL),
    (5, 4,  NULL, 'В описании задачи опечатка в слове "палиндром".',                    'Resolved',  NOW() - '40 days'::INTERVAL),
    (4, 15, 5,    'Задача не соответствует заявленному уровню — это не для платформы.', 'Dismissed', NOW() - '35 days'::INTERVAL),
    (3, 7,  2,    'Для n=0 Фибоначчи должен быть 0, но тест ожидает 1.',               'Pending',   NOW() - '30 days'::INTERVAL),
    (6, 11, 2,    'Valid Brackets: тест падает на пустой строке.',                      'Resolved',  NOW() - '20 days'::INTERVAL),
    (5, 13, 1,    'Deep Clone не уточняет поведение с циклическими ссылками.',          'Pending',   NOW() - '14 days'::INTERVAL),
    (2, 1,  5,    'Hello World не имеет смысла как задача — нужно удалить.',            'Dismissed', NOW() -  '1 days'::INTERVAL),
    (3, 16, 2,    'FizzBuzz: тест не проверяет отрицательные числа.',                   'Pending',   NOW() -  '4 days'::INTERVAL)
ON CONFLICT DO NOTHING;

-- Проставляем resolvedById и resolvedAt для уже закрытых жалоб (admin = id 1)
UPDATE "Reports"
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
SELECT setval(pg_get_serial_sequence('"Reports"',            'id'), (SELECT MAX(id) FROM "Reports"));
SELECT setval(pg_get_serial_sequence('"Reviews"', 'id'), COALESCE((SELECT MAX(id) FROM "Reviews"), 1));

-- ─── QUESTION TYPES SEED ─────────────────────────────────────────────────────
INSERT INTO "QuestionTypes" (id, name) VALUES
    (1, 'Множественный выбор'),
    (2, 'Да / Нет'),
    (3, 'Короткий ответ'),
    (4, 'Числовой ответ'),
    (5, 'Сопоставление'),
    (6, 'Заполни пропуск'),
    (8, 'Выполнение кода'),
    (9, 'Информационный блок')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"QuestionTypes"', 'id'), (SELECT MAX(id) FROM "QuestionTypes"));

-- ─── TESTS SEED ──────────────────────────────────────────────────────────────
INSERT INTO "Tests" (id, title, description, "timeLimitMinutes", "isPublished", "topicId", difficulty, "createdAt", "updatedAt") VALUES
    (1, 'Основы Python',         'Проверка базовых знаний синтаксиса Python: типы данных, условия, циклы.',         30,   TRUE, 1,  2, NOW(), NOW()),
    (2, 'Алгоритмы сортировки',  'Тест на знание алгоритмов сортировки: пузырёк, merge sort, quick sort.',          20,   TRUE, 7,  5, NOW(), NOW()),
    (3, 'Работа с массивами',    'Задания на манипуляцию массивами, поиск элементов и сложность операций.',         NULL, TRUE, 2,  3, NOW(), NOW()),
    (4, 'JavaScript для начинающих', 'Основы JS: переменные, функции, события, базовый DOM.',                      25,   TRUE, 8,  2, NOW(), NOW()),
    (5, 'Теория алгоритмов',     'Вопросы по сложности алгоритмов, нотации O, структурам данных.',                 40,   TRUE, 4,  7, NOW(), NOW()),
    (6, 'Строки и регулярные выражения', 'Работа со строками, шаблонами и регулярными выражениями.',               15,   TRUE, 1,  4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Tests"', 'id'), (SELECT MAX(id) FROM "Tests"));

-- ─── QUESTIONS SEED ──────────────────────────────────────────────────────────
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order") VALUES
-- Test 1: Основы Python
(1,  1, 1, 'Какой тип данных используется для целых чисел в Python?',                      1, 1),
(2,  1, 2, 'Python чувствителен к регистру?',                                               1, 2),
(3,  1, 1, 'Что выведет выражение print(2 ** 3)?',                                          1, 3),
(4,  1, 3, 'Как называется встроенная функция вывода текста на экран в Python?',             1, 4),
(5,  1, 1, 'Какой оператор используется для целочисленного деления в Python?',               1, 5),
-- Test 2: Алгоритмы сортировки
(6,  2, 1, 'Какова средняя временная сложность алгоритма Quick Sort?',                      1, 1),
(7,  2, 2, 'Bubble Sort является стабильным алгоритмом сортировки?',                        1, 2),
(8,  2, 1, 'Какой алгоритм сортировки основан на принципе «разделяй и властвуй»?',          1, 3),
(9,  2, 1, 'Какова сложность сортировки вставками (Insertion Sort) в лучшем случае?',       1, 4),
(10, 2, 1, 'Какова сложность Heap Sort в худшем случае?',                                   1, 5),
-- Test 3: Работа с массивами
(11, 3, 1, 'Какова временная сложность доступа к элементу массива по индексу?',              1, 1),
(12, 3, 2, 'В Python список (list) может хранить элементы разных типов данных?',             1, 2),
(13, 3, 1, 'Что делает метод append() в Python?',                                            1, 3),
(14, 3, 1, 'Какова сложность линейного поиска в несортированном массиве?',                   1, 4),
(15, 3, 3, 'Какой встроенной функцией Python можно получить длину списка?',                  1, 5),
-- Test 4: JavaScript для начинающих
(16, 4, 1, 'Что из перечисленного НЕ является примитивным типом в JavaScript?',              1, 1),
(17, 4, 2, 'Выражение typeof null === ''object'' в JavaScript равно true?',                 1, 2),
(18, 4, 1, 'Чем отличается let от var в JavaScript?',                                       1, 3),
(19, 4, 1, 'Что выведет console.log(typeof undefined)?',                                    1, 4),
(20, 4, 1, 'Как правильно объявить стрелочную функцию в JavaScript?',                       1, 5),
-- Test 5: Теория алгоритмов
(21, 5, 1, 'Что означает нотация O(1) в оценке сложности алгоритмов?',                      1, 1),
(22, 5, 1, 'Какова временная сложность бинарного поиска?',                                  1, 2),
(23, 5, 2, 'Структура данных «стек» работает по принципу LIFO?',                            1, 3),
(24, 5, 1, 'Какая структура данных используется при обходе графа в ширину (BFS)?',           1, 4),
(25, 5, 1, 'Что такое рекурсия?',                                                           1, 5),
-- Test 6: Строки и регулярные выражения
(26, 6, 1, 'Что означает метасимвол \d в регулярных выражениях?',                           1, 1),
(27, 6, 2, 'Строки в Python являются неизменяемыми (immutable)?',                           1, 2),
(28, 6, 1, 'Что делает метод split() в Python?',                                            1, 3),
(29, 6, 1, 'Что означает символ ^ в начале регулярного выражения?',                         1, 4),
(30, 6, 3, 'Какой функцией Python можно получить длину строки s?',                          1, 5)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Questions"', 'id'), (SELECT MAX(id) FROM "Questions"));

-- ─── QUESTION OPTIONS SEED ───────────────────────────────────────────────────
INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
-- Q1: тип целых чисел в Python
(1,  1, 'int',     TRUE,  1),
(2,  1, 'float',   FALSE, 2),
(3,  1, 'integer', FALSE, 3),
(4,  1, 'num',     FALSE, 4),
-- Q2: Python чувствителен к регистру
(5,  2, 'Верно',   TRUE,  1),
(6,  2, 'Неверно', FALSE, 2),
-- Q3: print(2 ** 3)
(7,  3, '8',  TRUE,  1),
(8,  3, '6',  FALSE, 2),
(9,  3, '9',  FALSE, 3),
(10, 3, '16', FALSE, 4),
-- Q4: функция вывода (shortanswer — правильный ответ)
(11, 4, 'print', TRUE, 1),
-- Q5: целочисленное деление
(12, 5, '//',  TRUE,  1),
(13, 5, '/',   FALSE, 2),
(14, 5, '%',   FALSE, 3),
(15, 5, '**',  FALSE, 4),
-- Q6: сложность QuickSort
(16, 6, 'O(n log n)', TRUE,  1),
(17, 6, 'O(n²)',      FALSE, 2),
(18, 6, 'O(n)',       FALSE, 3),
(19, 6, 'O(log n)',   FALSE, 4),
-- Q7: Bubble Sort стабильный
(20, 7, 'Верно',   TRUE,  1),
(21, 7, 'Неверно', FALSE, 2),
-- Q8: разделяй и властвуй
(22, 8, 'Merge Sort',     TRUE,  1),
(23, 8, 'Bubble Sort',    FALSE, 2),
(24, 8, 'Insertion Sort', FALSE, 3),
(25, 8, 'Selection Sort', FALSE, 4),
-- Q9: Insertion Sort лучший случай
(26, 9, 'O(n)',       TRUE,  1),
(27, 9, 'O(n log n)', FALSE, 2),
(28, 9, 'O(n²)',      FALSE, 3),
(29, 9, 'O(1)',       FALSE, 4),
-- Q10: Heap Sort худший случай
(30, 10, 'O(n log n)', TRUE,  1),
(31, 10, 'O(n²)',      FALSE, 2),
(32, 10, 'O(n)',       FALSE, 3),
(33, 10, 'O(log n)',   FALSE, 4),
-- Q11: доступ по индексу
(34, 11, 'O(1)',       TRUE,  1),
(35, 11, 'O(n)',       FALSE, 2),
(36, 11, 'O(log n)',   FALSE, 3),
(37, 11, 'O(n²)',      FALSE, 4),
-- Q12: список разных типов
(38, 12, 'Верно',   TRUE,  1),
(39, 12, 'Неверно', FALSE, 2),
-- Q13: append()
(40, 13, 'Добавляет элемент в конец списка', TRUE,  1),
(41, 13, 'Удаляет последний элемент',        FALSE, 2),
(42, 13, 'Добавляет элемент в начало',       FALSE, 3),
(43, 13, 'Сортирует список',                 FALSE, 4),
-- Q14: линейный поиск
(44, 14, 'O(n)',       TRUE,  1),
(45, 14, 'O(1)',       FALSE, 2),
(46, 14, 'O(log n)',   FALSE, 3),
(47, 14, 'O(n log n)', FALSE, 4),
-- Q15: len() (shortanswer)
(48, 15, 'len', TRUE, 1),
-- Q16: не примитивный тип JS
(49, 16, 'Object',  TRUE,  1),
(50, 16, 'string',  FALSE, 2),
(51, 16, 'number',  FALSE, 3),
(52, 16, 'boolean', FALSE, 4),
-- Q17: typeof null
(53, 17, 'Верно',   TRUE,  1),
(54, 17, 'Неверно', FALSE, 2),
-- Q18: let vs var
(55, 18, 'let имеет блочную область видимости, var — функциональную', TRUE,  1),
(56, 18, 'Нет разницы между let и var',                                FALSE, 2),
(57, 18, 'let создаёт глобальную переменную',                          FALSE, 3),
(58, 18, 'var имеет блочную область видимости',                        FALSE, 4),
-- Q19: typeof undefined
(59, 19, '"undefined"', TRUE,  1),
(60, 19, '"null"',      FALSE, 2),
(61, 19, '"object"',    FALSE, 3),
(62, 19, '"error"',     FALSE, 4),
-- Q20: стрелочная функция
(63, 20, 'const fn = () => {}', TRUE,  1),
(64, 20, 'function fn() {}',    FALSE, 2),
(65, 20, 'def fn():',           FALSE, 3),
(66, 20, 'fn := func(){}',      FALSE, 4),
-- Q21: O(1)
(67, 21, 'Константное время выполнения', TRUE,  1),
(68, 21, 'Линейное время',               FALSE, 2),
(69, 21, 'Логарифмическое время',        FALSE, 3),
(70, 21, 'Квадратичное время',           FALSE, 4),
-- Q22: бинарный поиск
(71, 22, 'O(log n)', TRUE,  1),
(72, 22, 'O(n)',     FALSE, 2),
(73, 22, 'O(n²)',    FALSE, 3),
(74, 22, 'O(1)',     FALSE, 4),
-- Q23: стек LIFO
(75, 23, 'Верно',   TRUE,  1),
(76, 23, 'Неверно', FALSE, 2),
-- Q24: BFS
(77, 24, 'Очередь (Queue)', TRUE,  1),
(78, 24, 'Стек (Stack)',    FALSE, 2),
(79, 24, 'Дерево',          FALSE, 3),
(80, 24, 'Связный список',  FALSE, 4),
-- Q25: рекурсия
(81, 25, 'Функция, которая вызывает саму себя', TRUE,  1),
(82, 25, 'Бесконечный цикл',                    FALSE, 2),
(83, 25, 'Итератор',                            FALSE, 3),
(84, 25, 'Декоратор функции',                   FALSE, 4),
-- Q26: \d в regex
(85, 26, 'Любая цифра (0–9)',   TRUE,  1),
(86, 26, 'Любая буква',         FALSE, 2),
(87, 26, 'Любой пробел',        FALSE, 3),
(88, 26, 'Конец строки',        FALSE, 4),
-- Q27: строки immutable
(89, 27, 'Верно',   TRUE,  1),
(90, 27, 'Неверно', FALSE, 2),
-- Q28: split()
(91, 28, 'Разбивает строку на список подстрок', TRUE,  1),
(92, 28, 'Объединяет элементы списка в строку', FALSE, 2),
(93, 28, 'Удаляет пробелы в начале и конце',    FALSE, 3),
(94, 28, 'Ищет подстроку в строке',             FALSE, 4),
-- Q29: ^ в regex
(95, 29, 'Начало строки',            TRUE,  1),
(96, 29, 'Конец строки',             FALSE, 2),
(97, 29, 'Любой символ',             FALSE, 3),
(98, 29, 'Отрицание класса символов',FALSE, 4),
-- Q30: len(s) (shortanswer)
(99, 30, 'len(s)', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"QuestionOptions"', 'id'), (SELECT MAX(id) FROM "QuestionOptions"));


-- ─── DEMO TEST: Все типы вопросов ────────────────────────────────────────────

INSERT INTO "Tests" (id, title, description, "timeLimitMinutes", "isPublished", difficulty, "createdAt", "updatedAt") VALUES
    (7, 'Демо: Все типы вопросов',
     'Тест демонстрирует все доступные типы вопросов: описание, одиночный и множественный выбор, верно/неверно, короткий ответ, числовой, эссе, пропуски, сопоставление и код.',
     NULL, TRUE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 1. Описание (description, typeId=9)
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order") VALUES
    (31, 7, 9, 'Добро пожаловать! Этот тест демонстрирует все типы вопросов. Внимательно читайте условие каждого задания.', 0, 1)
ON CONFLICT (id) DO NOTHING;

-- 2. Одиночный выбор (multichoice, typeId=1, allowMultiple=false)
-- 3. Множественный выбор (multichoice, typeId=1, allowMultiple=true)
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order", "allowMultiple") VALUES
    (32, 7, 1, 'Какой из языков является интерпретируемым?',                                                     1, 2, FALSE),
    (33, 7, 1, 'Выберите все языки, поддерживающие объектно-ориентированное программирование:',                  2, 3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Верно/Неверно (truefalse, typeId=2)
-- 5. Короткий ответ (shortanswer, typeId=3)
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order") VALUES
    (34, 7, 2, 'Python является компилируемым языком программирования.',                                          1, 4),
    (35, 7, 3, 'Как называется встроенная структура данных Python для хранения пар ключ-значение?',              1, 5)
ON CONFLICT (id) DO NOTHING;

-- 6. Числовой ответ (numerical, typeId=4)
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order", tolerance) VALUES
    (36, 7, 4, 'Сколько бит в одном байте?', 1, 6, 0)
ON CONFLICT (id) DO NOTHING;

-- 8. Текст с пропусками (cloze, typeId=6)
-- 9. Сопоставление (matching, typeId=5)
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order") VALUES
    (38, 7, 6, 'В языке Python для объявления функции используется ключевое слово [[1]], а для объявления класса — [[2]].',         2, 7),
    (39, 7, 5, 'Сопоставьте язык программирования с его основной парадигмой:',                                                     2, 8)
ON CONFLICT (id) DO NOTHING;

-- 10. Задача с кодом (code, typeId=8, автопроверка через тест-кейсы)
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order", "codeLanguage", "starterCode", "funcName") VALUES
    (40, 7, 8,
     E'Напишите функцию **solve(n)**, которая принимает целое число N и возвращает сумму всех чисел от 1 до N включительно.\n\nПример: solve(5) → 15',
     3, 10, 'python',
     E'def solve(n):\n    # ваш код здесь\n    pass',
     'solve')
ON CONFLICT (id) DO NOTHING;

-- Варианты ответов ─────────────────────────────────────────────────────────────

-- Q32: одиночный выбор
INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
    (100, 32, 'Python', TRUE,  1),
    (101, 32, 'C++',    FALSE, 2),
    (102, 32, 'Go',     FALSE, 3),
    (103, 32, 'Rust',   FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Q33: множественный выбор
INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
    (104, 33, 'Java',      TRUE,  1),
    (105, 33, 'Python',    TRUE,  2),
    (106, 33, 'Brainfuck', FALSE, 3),
    (107, 33, 'C#',        TRUE,  4),
    (108, 33, 'SQL',       FALSE, 5)
ON CONFLICT (id) DO NOTHING;

-- Q34: верно/неверно
INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
    (109, 34, 'Верно',   FALSE, 1),
    (110, 34, 'Неверно', TRUE,  2)
ON CONFLICT (id) DO NOTHING;

-- Q35: короткий ответ (несколько допустимых вариантов)
INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
    (111, 35, 'словарь',    TRUE, 1),
    (112, 35, 'dict',       TRUE, 2),
    (113, 35, 'dictionary', TRUE, 3)
ON CONFLICT (id) DO NOTHING;

-- Q36: числовой ответ
INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
    (114, 36, '8', TRUE, 1)
ON CONFLICT (id) DO NOTHING;

-- Q38: пропуски (cloze) — blankIndex указывает номер пропуска [[N]]
INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "blankIndex", "order") VALUES
    (115, 38, 'def',   TRUE, 1, 1),
    (116, 38, 'class', TRUE, 2, 2)
ON CONFLICT (id) DO NOTHING;

-- Q39: сопоставление (matching) — matchPair — правая часть пары
INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "matchPair", "order") VALUES
    (117, 39, 'Python',  TRUE, 'Мультипарадигменный',        1),
    (118, 39, 'Haskell', TRUE, 'Функциональный',             2),
    (119, 39, 'SQL',     TRUE, 'Декларативный',              3),
    (120, 39, 'Java',    TRUE, 'Объектно-ориентированный',   4)
ON CONFLICT (id) DO NOTHING;

-- ─── QUESTION TEST CASES SEED (для Q40 — задача с кодом) ────────────────────
-- input = JSON-массив аргументов для функции solve(n)
-- expectedOutput = JSON-значение ожидаемого результата
-- 2 открытых + 2 скрытых тест-кейса
INSERT INTO "QuestionTestCases" (id, "questionId", input, "expectedOutput", "isHidden", "order") VALUES
    (1, 40, '[5]',   '15',   FALSE, 1),
    (2, 40, '[10]',  '55',   FALSE, 2),
    (3, 40, '[1]',   '1',    TRUE,  3),
    (4, 40, '[100]', '5050', TRUE,  4)
ON CONFLICT (id) DO NOTHING;

-- ─── DEMO TEST: Вопросы с изображениями ─────────────────────────────────────
-- imageUrl ссылается на уже существующие файлы из /achievements/ для быстрого
-- демо без загрузки реальных картинок через UI.
-- Формат хранения: абсолютный путь от корня сервера (/question-images/... или /achievements/...)
-- Frontend строит URL как: BACKEND_BASE + imageUrl

INSERT INTO "Tests" (id, title, description, "timeLimitMinutes", "isPublished", difficulty, "createdAt", "updatedAt") VALUES
    (8, 'Демо: Вопросы с картинками',
     'Тест для проверки отображения изображений в вопросах. Некоторые вопросы содержат иллюстрации. Также можно использовать для тестирования экспорта в Moodle XML (ZIP с base64-картинками).',
     10, TRUE, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Вопрос 1: Информационный блок с иконкой достижения как демо-картинка
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order", "imageUrl") VALUES
    (41, 8, 9,
     'Это информационный блок с изображением. Картинка прикреплена к вопросу и отображается ниже текста. При экспорте в Moodle она будет встроена в XML как base64.',
     0, 1, '/achievements/first_solve.png')
ON CONFLICT (id) DO NOTHING;

-- Вопрос 2: Одиночный выбор с изображением (иллюстрация к вопросу)
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order", "imageUrl") VALUES
    (42, 8, 1,
     'На изображении показан значок достижения "Первая кровь". Что оно означает?',
     1, 2, '/achievements/first_solve.png')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
    (121, 42, 'Решить первую задачу на платформе',  TRUE,  1),
    (122, 42, 'Победить в соревновании',             FALSE, 2),
    (123, 42, 'Зарегистрироваться на платформе',     FALSE, 3),
    (124, 42, 'Набрать 1000 опыта',                  FALSE, 4)
ON CONFLICT (id) DO NOTHING;

-- Вопрос 3: Короткий ответ без изображения — для контраста
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order") VALUES
    (43, 8, 3,
     'Вопрос без изображения (для сравнения). Назовите формат файла, в котором платформа экспортирует тесты для Moodle:',
     1, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
    (125, 43, 'zip', TRUE, 1),
    (126, 43, 'ZIP', TRUE, 2)
ON CONFLICT (id) DO NOTHING;

-- Вопрос 4: Да/Нет с изображением-иконкой
INSERT INTO "Questions" (id, "testId", "typeId", text, points, "order", "imageUrl") VALUES
    (44, 8, 2,
     'На изображении — значок достижения. Изображения к вопросам сохраняются на сервере и встраиваются в Moodle XML как base64?',
     1, 4, '/achievements/solve_5.png')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "QuestionOptions" (id, "questionId", text, "isCorrect", "order") VALUES
    (127, 44, 'Верно',   TRUE,  1),
    (128, 44, 'Неверно', FALSE, 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Tests"',            'id'), (SELECT MAX(id) FROM "Tests"));
SELECT setval(pg_get_serial_sequence('"Questions"',        'id'), (SELECT MAX(id) FROM "Questions"));
SELECT setval(pg_get_serial_sequence('"QuestionOptions"',  'id'), (SELECT MAX(id) FROM "QuestionOptions"));
SELECT setval(pg_get_serial_sequence('"QuestionTestCases"','id'), (SELECT MAX(id) FROM "QuestionTestCases"));


-- ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Achievements" (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    "desc"          TEXT         NOT NULL,
    rarity          VARCHAR(20)  NOT NULL DEFAULT 'common',
    "imageFilename" VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "UserAchievements" (
    id               SERIAL PRIMARY KEY,
    "userId"         INTEGER NOT NULL,
    "achievementId"  INTEGER NOT NULL,
    "unlockedAt"     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", "achievementId"),
    CONSTRAINT fk_ua_user        FOREIGN KEY ("userId")        REFERENCES "Users"(id)        ON DELETE CASCADE,
    CONSTRAINT fk_ua_achievement FOREIGN KEY ("achievementId") REFERENCES "Achievements"(id) ON DELETE CASCADE
);

INSERT INTO "Achievements" (id, title, "desc", rarity, "imageFilename") VALUES
    (1,  'Первая кровь',    'Решите свою первую задачу',             'common',   'first_solve.png'),
    (2,  'Пятёрка',         'Решите 5 задач',                        'common',   'solve_5.png'),
    (3,  'Дробитель задач', 'Решите 25 задач',                       'uncommon', 'solve_25.png'),
    (4,  'Клуб сотни',      'Решите 100 задач',                      'rare',     'solve_100.png'),
    (5,  'Легенда',         'Решите 500 задач',                      'epic',     'solve_500.png'),
    (6,  'Закалённый',      'Решите задачу со сложностью 8+',        'uncommon', 'hard_challenge.png'),
    (7,  'Кошмар',          'Решите задачу максимальной сложности',  'rare',     'nightmare.png'),
    (8,  'Демон скорости',  'Решите задачу менее чем за 100 мс',     'uncommon', 'speed_demon.png'),
    (9,  'Полиглот',        'Решите задачи на 3 разных языках',      'uncommon', 'polyglot.png'),
    (10, 'Мультилингв',     'Решите задачи на всех 7 языках',        'rare',     'multipoliglot.png'),
    (11, 'JS-мастер',       'Решите 10 задач на JavaScript',         'common',   'js_master.png'),
    (12, 'Питонист',        'Решите 10 задач на Python',             'common',   'py_master.png'),
    (13, 'Ночная сова',     'Решите задачу между 2:00 и 4:00 ночи', 'uncommon', NULL),
    (14, 'Спидран',         'Решите 5 задач за один день',           'rare',     NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval('"Achievements_id_seq"', 14);

SELECT setval(pg_get_serial_sequence('"SolutionVotes"',    'id'), COALESCE((SELECT MAX(id) FROM "SolutionVotes"),    1));
SELECT setval(pg_get_serial_sequence('"SolutionComments"', 'id'), COALESCE((SELECT MAX(id) FROM "SolutionComments"), 1));
