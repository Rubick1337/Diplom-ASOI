CREATE TABLE IF NOT EXISTS "Users" (
                                       id SERIAL PRIMARY KEY,
                                       username VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    role INTEGER NOT NULL,
    "refreshToken" VARCHAR(255),
    "googleId" VARCHAR(255) UNIQUE,
    "githubId" VARCHAR(255) UNIQUE,
    experience INTEGER NOT NULL DEFAULT 0
    );

CREATE TABLE IF NOT EXISTS "Challenges" (
                                            id SERIAL PRIMARY KEY,
                                            name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    topic VARCHAR(255) NOT NULL DEFAULT 'General',
    mode VARCHAR(255) NOT NULL DEFAULT 'harness',
    "funcName" VARCHAR(255) NOT NULL,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "createdByUserId" INTEGER,
    "sampleInput" TEXT DEFAULT '',
    "sampleOutput" TEXT DEFAULT '',
    "isHidden" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_challenge_user FOREIGN KEY ("createdByUserId") REFERENCES "Users"(id) ON DELETE SET NULL
    );

CREATE TABLE IF NOT EXISTS "ChallengeParameters" (
                                                     id SERIAL PRIMARY KEY,
                                                     "challengeId" INTEGER NOT NULL,
                                                     name VARCHAR(255) NOT NULL,
    "dataType" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_parameter_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS "ChallengeTestCases" (
                                                    id SERIAL PRIMARY KEY,
                                                    "challengeId" INTEGER NOT NULL,
                                                    title VARCHAR(255) NOT NULL DEFAULT 'Test Case',
    "expectedOutput" TEXT NOT NULL,
    CONSTRAINT fk_testcase_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS "TestCaseArguments" (
                                                   id SERIAL PRIMARY KEY,
                                                   "testCaseId" INTEGER NOT NULL,
                                                   value TEXT NOT NULL,
                                                   "order" INTEGER NOT NULL DEFAULT 0,
                                                   CONSTRAINT fk_argument_testcase FOREIGN KEY ("testCaseId") REFERENCES "ChallengeTestCases"(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS "HistoryChallenges" (
                                                   id SERIAL PRIMARY KEY,
                                                   "userId" INTEGER NOT NULL,
                                                   "challengeId" INTEGER NOT NULL,
                                                   code TEXT NOT NULL,
                                                   language VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    "executionTimeMs" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_user FOREIGN KEY ("userId") REFERENCES "Users"(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS "ReviewChallenges" (
                                                  id SERIAL PRIMARY KEY,
                                                  "userId" INTEGER NOT NULL,
                                                  "challengeId" INTEGER NOT NULL,
                                                  content TEXT NOT NULL,
                                                  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_user FOREIGN KEY ("userId") REFERENCES "Users"(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_challenge FOREIGN KEY ("challengeId") REFERENCES "Challenges"(id) ON DELETE CASCADE
    );

INSERT INTO "Users" (id, username, password, email, role, experience)
VALUES
    (1, 'admin', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'admin@example.com', 1, 1000),
    (2, 'codemaster', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'user1@example.com', 2, 450),
    (3, 'junior_dev', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'user2@example.com', 2, 120),
    (4, 'backend_hero', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'user3@example.com', 2, 800),
    (5, 'frontend_ninja', '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', 'user4@example.com', 2, 300)
    ON CONFLICT (id) DO NOTHING;

INSERT INTO "Challenges" (id, name, description, topic, "funcName", "sampleInput", "sampleOutput", "createdByUserId")
VALUES
    (1, 'Hello World', 'Верните строку "Hello, World!"', 'Strings', 'solution', '()', '"Hello, World!"', 1),
    (2, 'Sum of Two', 'Сложите два числа a и b', 'Algorithms', 'solution', '(5, 10)', '15', 1),
    (3, 'Palindrome Check', 'Проверьте, является ли строка палиндромом', 'Strings', 'isPalindrome', '("Racecar")', 'true', 1),
    (4, 'Factorial', 'Вычислите факториал числа n', 'Math', 'factorial', '(5)', '120', 2),
    (5, 'Find Max', 'Найдите максимальное число в массиве', 'Arrays', 'findMax', '([1, 5, 3])', '5', 2),
    (6, 'Reverse String', 'Разверните входящую строку', 'Strings', 'reverse', '("hello")', '"olleh"', 1)
    ON CONFLICT (id) DO NOTHING;

INSERT INTO "ChallengeParameters" ("challengeId", name, "dataType", "order")
VALUES
    (2, 'a', 'number', 0), (2, 'b', 'number', 1),
    (3, 'str', 'string', 0),
    (4, 'n', 'number', 0),
    (5, 'nums', 'array', 0),
    (6, 'text', 'string', 0)
    ON CONFLICT DO NOTHING;

INSERT INTO "ChallengeTestCases" (id, "challengeId", title, "expectedOutput")
VALUES
    (1, 1, 'Base Test', '"Hello, World!"'),
    (2, 2, 'Positive Sum', '15'),
    (3, 2, 'Negative Sum', '-5'),
    (4, 3, 'Pal True', 'true'),
    (5, 3, 'Pal False', 'false'),
    (6, 4, 'Fact 5', '120'),
    (7, 4, 'Fact 0', '1'),
    (8, 5, 'Max 10', '10'),
    (9, 6, 'Rev JS', '"tpircsavaj"')
    ON CONFLICT (id) DO NOTHING;

INSERT INTO "TestCaseArguments" ("testCaseId", value, "order")
VALUES
    (2, '5', 0), (2, '10', 1),
    (3, '10', 0), (3, '-15', 1),
    (4, '"Racecar"', 0),
    (5, '"hello"', 0),
    (6, '5', 0),
    (7, '0', 0),
    (8, '[1, 10, 2, 5]', 0),
    (9, '"javascript"', 0)
    ON CONFLICT DO NOTHING;

INSERT INTO "HistoryChallenges" ("userId", "challengeId", code, language, status, "executionTimeMs")
VALUES
    (2, 1, 'function solution() { return "Hello, World!"; }', 'javascript', 'success', 42),
    (3, 1, 'function solution() { return "Hi!"; }', 'javascript', 'fail', 35),
    (4, 2, 'def solution(a, b): return a + b', 'python', 'success', 12),
    (2, 3, 'const isPalindrome = s => s.toLowerCase() === s.toLowerCase().split("").reverse().join("");', 'javascript', 'success', 55),
    (5, 2, 'function solution(a, b) { return a - b; }', 'javascript', 'fail', 20)
    ON CONFLICT DO NOTHING;

INSERT INTO "ReviewChallenges" ("userId", "challengeId", content, rating)
VALUES
    (2, 1, 'Отличная задача!', 5),
    (4, 2, 'Слишком просто', 3),
    (3, 3, 'Хороший таск', 4),
    (5, 5, 'Мало тестов', 4)
    ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Users"', 'id'), (SELECT MAX(id) FROM "Users"));
SELECT setval(pg_get_serial_sequence('"Challenges"', 'id'), (SELECT MAX(id) FROM "Challenges"));
SELECT setval(pg_get_serial_sequence('"ChallengeParameters"', 'id'), (SELECT MAX(id) FROM "ChallengeParameters"));
SELECT setval(pg_get_serial_sequence('"ChallengeTestCases"', 'id'), (SELECT MAX(id) FROM "ChallengeTestCases"));
SELECT setval(pg_get_serial_sequence('"TestCaseArguments"', 'id'), (SELECT MAX(id) FROM "TestCaseArguments"));
SELECT setval(pg_get_serial_sequence('"HistoryChallenges"', 'id'), (SELECT MAX(id) FROM "HistoryChallenges"));
SELECT setval(pg_get_serial_sequence('"ReviewChallenges"', 'id'), (SELECT MAX(id) FROM "ReviewChallenges"));