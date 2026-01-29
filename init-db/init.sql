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
    CONSTRAINT fk_challenge_user
    FOREIGN KEY ("createdByUserId")
    REFERENCES "Users"(id)
    ON DELETE SET NULL
    );

CREATE TABLE IF NOT EXISTS "ChallengeParameters" (
                                                     id SERIAL PRIMARY KEY,
                                                     "challengeId" INTEGER NOT NULL,
                                                     name VARCHAR(255) NOT NULL,
    "dataType" VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_parameter_challenge
    FOREIGN KEY ("challengeId")
    REFERENCES "Challenges"(id)
    ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS "ChallengeTestCases" (
                                                    id SERIAL PRIMARY KEY,
                                                    "challengeId" INTEGER NOT NULL,
                                                    title VARCHAR(255) NOT NULL DEFAULT 'Test Case',
    "expectedOutput" TEXT NOT NULL,
    CONSTRAINT fk_testcase_challenge
    FOREIGN KEY ("challengeId")
    REFERENCES "Challenges"(id)
    ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS "TestCaseArguments" (
                                                   id SERIAL PRIMARY KEY,
                                                   "testCaseId" INTEGER NOT NULL,
                                                   value TEXT NOT NULL,
                                                   "order" INTEGER NOT NULL DEFAULT 0,
                                                   CONSTRAINT fk_argument_testcase
                                                   FOREIGN KEY ("testCaseId")
    REFERENCES "ChallengeTestCases"(id)
    ON DELETE CASCADE
    );

INSERT INTO "Users" (username, password, email, role, experience)
VALUES (
           'admin',
           '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy',
           'admin@example.com',
           1,
           0
       ) ON CONFLICT (email) DO NOTHING;

-- 1) Hello World
INSERT INTO "Challenges" (id, name, description, topic, "funcName", "sampleInput", "sampleOutput", "createdByUserId")
VALUES (1, 'hello-world', 'Напишите функцию solution(), которая возвращает строку "Hello, World!"', 'Strings', 'solution', '()', '"Hello, World!"', 1)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO "ChallengeTestCases" (id, "challengeId", title, "expectedOutput")
VALUES (1, 1, 'Basic Test', '"Hello, World!"')
    ON CONFLICT DO NOTHING;

-- 2) Сумма двух чисел
INSERT INTO "Challenges" (id, name, description, topic, "funcName", "sampleInput", "sampleOutput", "createdByUserId")
VALUES (2, 'sum-two-numbers', 'Напишите функцию solution(a, b), которая возвращает сумму двух чисел a и b.', 'Algorithms', 'solution', '1, 2', '3', 1)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO "ChallengeParameters" ("challengeId", name, "dataType", "order")
VALUES
    (2, 'a', 'int', 0),
    (2, 'b', 'int', 1)
    ON CONFLICT DO NOTHING;

INSERT INTO "ChallengeTestCases" (id, "challengeId", title, "expectedOutput")
VALUES
    (2, 2, 'Positive numbers', '3'),
    (3, 2, 'Large numbers', '15'),
    (4, 2, 'Negative numbers', '-3')
    ON CONFLICT DO NOTHING;

INSERT INTO "TestCaseArguments" ("testCaseId", value, "order")
VALUES
    (2, '1', 0), (2, '2', 1),
    (3, '10', 0), (3, '5', 1),
    (4, '-7', 0), (4, '4', 1)
    ON CONFLICT DO NOTHING;

-- 3) Разворот строки
INSERT INTO "Challenges" (id, name, description, topic, "funcName", "sampleInput", "sampleOutput", "createdByUserId")
VALUES (3, 'reverse-string', 'Напишите функцию solution(str), которая возвращает строку str в обратном порядке.', 'Strings', 'solution', '"hello"', '"olleh"', 1)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO "ChallengeParameters" ("challengeId", name, "dataType", "order")
VALUES (3, 'str', 'string', 0)
    ON CONFLICT DO NOTHING;

-- 4) Палиндром
INSERT INTO "Challenges" (id, name, description, topic, "funcName", "sampleInput", "sampleOutput", "createdByUserId")
VALUES (4, 'is-palindrome', 'Напишите функцию solution(str), которая возвращает true, если строка является палиндромом.', 'Algorithms', 'solution', '"level"', 'true', 1)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO "ChallengeParameters" ("challengeId", name, "dataType", "order")
VALUES (4, 'str', 'string', 0)
    ON CONFLICT DO NOTHING;

-- 5) Сумма элементов массива
INSERT INTO "Challenges" (id, name, description, topic, "funcName", "sampleInput", "sampleOutput", "createdByUserId")
VALUES (5, 'array-sum', 'Напишите функцию solution(arr), которая возвращает сумму всех чисел массива arr.', 'Arrays', 'solution', '[1, 2, 3]', '6', 1)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO "ChallengeParameters" ("challengeId", name, "dataType", "order")
VALUES (5, 'arr', 'array', 0)
    ON CONFLICT DO NOTHING;

-- 6) Факториал
INSERT INTO "Challenges" (id, name, description, topic, "funcName", "sampleInput", "sampleOutput", "createdByUserId")
VALUES (6, 'factorial', 'Напишите функцию solution(n), которая возвращает факториал числа n (n!); 0! = 1.', 'Math', 'solution', '5', '120', 1)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO "ChallengeParameters" ("challengeId", name, "dataType", "order")
VALUES (6, 'n', 'int', 0)
    ON CONFLICT DO NOTHING;