-- ===========================
-- Таблица Users (по UserModel)
-- ===========================
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

-- ===========================
-- Таблица Challenges (по ChallengeModel)
-- ===========================
CREATE TABLE IF NOT EXISTS "Challenges" (
                                            id SERIAL PRIMARY KEY,
                                            name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    mode VARCHAR(255) NOT NULL DEFAULT 'harness',
    "funcName" VARCHAR(255) NOT NULL,
    properties JSONB,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 2000,
    "createdByUserId" INTEGER,
    CONSTRAINT fk_challenge_user
    FOREIGN KEY ("createdByUserId")
    REFERENCES "Users"(id)
    ON DELETE SET NULL
    );

-- ===========================
-- Таблица ChallengeTestCases (по ChallengeTestCaseModel)
-- ===========================
CREATE TABLE IF NOT EXISTS "ChallengeTestCases" (
                                                    id SERIAL PRIMARY KEY,
                                                    "challengeId" INTEGER NOT NULL,
                                                    "inputArgs" JSONB NOT NULL DEFAULT '[]'::jsonb,
                                                    "expectedOutput" JSONB NOT NULL,
                                                    "order" INTEGER NOT NULL DEFAULT 0,
                                                    weight INTEGER NOT NULL DEFAULT 1,
                                                    "isHidden" BOOLEAN NOT NULL DEFAULT TRUE,
                                                    CONSTRAINT fk_testcase_challenge
                                                    FOREIGN KEY ("challengeId")
    REFERENCES "Challenges"(id)
    ON DELETE CASCADE
    );

-- ===========================
-- Тестовый пользователь (admin)
-- пароль: admin123
-- ===========================
INSERT INTO "Users" (username, password, email, role, experience)
VALUES (
           'admin',
           '$2a$05$tpH07Hqk0VnMw6ABoR7mfO5S2bXq5FXjZ/5f2pHWlvpM76uDzvGqy', -- bcrypt hash admin123
           'admin@example.com',
           1,
           0
       )
    ON CONFLICT (email) DO NOTHING;

-- ===========================
-- Тестовая задача (hello-world)
-- ===========================
INSERT INTO "Challenges" (
    name,
    description,
    mode,
    "funcName",
    properties,
    "timeLimitMs",
    "createdByUserId"
)
VALUES (
           'hello-world',
           'Напишите функцию solution(), которая возвращает строку "Hello, World!"',
           'harness',
           'solution',
           NULL,
           2000,
           1
       )
    ON CONFLICT (name) DO NOTHING;

-- ===========================
-- Тесткейсы для hello-world
-- ===========================
-- найдём id задачи hello-world (на случай, если это не 1)
WITH hw AS (
    SELECT id FROM "Challenges" WHERE name = 'hello-world' LIMIT 1
    )
INSERT INTO "ChallengeTestCases" (
    "challengeId",
    "inputArgs",
    "expectedOutput",
    "order",
    weight,
    "isHidden"
)
SELECT
    hw.id,
    '[]'::jsonb,
        '"Hello, World!"'::jsonb,
        0,
    1,
    FALSE
FROM hw
    ON CONFLICT DO NOTHING;
