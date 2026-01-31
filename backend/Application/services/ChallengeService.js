const { spawn } = require('child_process');
const clangFormat = require('clang-format');
const ChallengeRepositorySequelize = require('../../Data/repository/ChallengeRepositorySequelize');
const DockerRunner = require('../../Data/DockerRunner/DockerRunner');
const harnessConfigs = require('../../Data/config/harnessConfig');
const ruff = require("@astral-sh/ruff-wasm-nodejs");

class ChallengeService {
    constructor(challengeRepository, dockerRunner) {
        this.challengeRepository = challengeRepository || new ChallengeRepositorySequelize();
        this.dockerRunner = dockerRunner || new DockerRunner();
    }

    async formatCode(code, language) {
        console.log(code);
        console.log(language);
        if (language === 'python') {
            try {
                const workspace = new ruff.Workspace({});
                return workspace.format(code, {});
            } catch (e) {
                return code;
            }
        }
        return new Promise((resolve) => {
            let command = '';
            let args = [];

            if (['cpp', 'csharp', 'java', 'c'].includes(language)) {
                command = clangFormat.location;
                if (command.endsWith('.js')) {
                    args = [command, '-style=Google'];
                    command = 'node';
                } else {
                    args = ['-style=Google'];
                }
            }

            const proc = spawn(command, args, { shell: true });

            let output = '';
            proc.stdout.on('data', (data) => { output += data.toString(); });
            proc.on('error', () => resolve(code));
            proc.on('close', (exitCode) => {
                if (exitCode === 0) resolve(output || code);
                else resolve(code);
            });

            try {
                proc.stdin.write(code);
                proc.stdin.end();
            } catch (e) {
                resolve(code);
            }

            setTimeout(() => {
                if (!proc.killed) proc.kill();
                resolve(code);
            }, 3000);
        });
    }

    async createChallenge(rawData, userId) {
        const {
            name, description, topic, mode, funcName,
            timeLimitMs, testCases, sampleInput, sampleOutput, isHidden, parameters
        } = rawData;

        if (!name || !description || !funcName) {
            throw new Error('Required fields missing');
        }

        const challengeData = {
            name, description, topic: topic || 'General',
            mode: mode || 'harness', funcName,
            timeLimitMs: timeLimitMs || 2000,
            createdByUserId: userId ?? null,
            sampleInput: sampleInput || '',
            sampleOutput: sampleOutput || '',
            isHidden: isHidden ?? false,
            parameters: Array.isArray(parameters) ? parameters : [],
        };

        return await this.challengeRepository.createWithTestCases(challengeData, testCases || []);
    }

    async getAllChallenges(query) {
        const { page, pageSize, search, nameLike, topic, createdByUserId, showHidden, orderBy, orderDirection } = query;
        const filter = { search, nameLike, topic };

        if (showHidden !== undefined) filter.showHidden = showHidden === 'true' || showHidden === true;
        if (createdByUserId) filter.createdByUserId = Number(createdByUserId);

        const options = {
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 10,
            orderBy: orderBy || 'id',
            orderDirection: orderDirection || 'ASC',
        };

        return await this.challengeRepository.findManyWithTestCases(filter, options);
    }

    async getChallengeById(id) {
        const challenge = await this.challengeRepository.findByIdWithTestCases(id);
        if (!challenge) throw new Error('Not found');
        return challenge;
    }

    async updateChallenge(id, rawData) {
        const { name, description, topic, mode, funcName, timeLimitMs, testCases, sampleInput, sampleOutput, isHidden, parameters } = rawData;
        const challengeData = {
            name, description, topic, mode, funcName, timeLimitMs, sampleInput, sampleOutput, isHidden,
            parameters: Array.isArray(parameters) ? parameters : undefined,
        };

        const updated = await this.challengeRepository.updateWithTestCases(id, challengeData, testCases);
        if (!updated) throw new Error('Not found');
        return updated;
    }

    async deleteChallenge(id) {
        const ok = await this.challengeRepository.delete(id);
        if (!ok) throw new Error('Not found');
        return true;
    }

    async executeChallenge(challengeId, code, language, userId = null) {
        try {
            console.log(`[EXECUTE] Start: Challenge ${challengeId}, User ${userId || 'Guest'}`);

            // 1. Получаем данные задачи
            const challenge = await this.challengeRepository.findByIdWithTestCases(challengeId);
            if (!challenge) {
                console.error(`[EXECUTE ERROR] Challenge ${challengeId} not found`);
                throw new Error('Challenge not found');
            }

            // 2. Получаем конфиг языка
            const config = harnessConfigs[language];
            if (!config) {
                console.error(`[EXECUTE ERROR] Language "${language}" not supported`);
                throw new Error(`Language "${language}" not supported`);
            }

            // 3. Форматируем тест-кейсы для шаблона
            const formattedTests = challenge.testCases.map(tc => ({
                id: tc.id,
                title: tc.title,
                expected: this._safeParse(tc.expectedOutput),
                args: tc.testArgs
                    ? tc.testArgs.sort((a, b) => a.order - b.order).map(arg => this._safeParse(arg.value))
                    : []
            }));

            // 4. Генерируем код обертки (harness) и запускаем в Docker
            const harnessCode = config.template(challenge.funcName, formattedTests);
            console.log(`[DOCKER] Running code for challenge ${challengeId}...`);

            const executionResult = await this.dockerRunner.run(config, code, harnessCode);

            // 5. Проверяем лимиты и результаты
            const isTimeLimitExceeded = executionResult.executionTimeMs > challenge.timeLimitMs;

            // ВАЖНО: берем testResults, так как DockerRunner возвращает именно этот ключ
            const results = executionResult.testResults || [];

            let finalResponse = {
                challengeId: challenge.id,
                language,
                timeLimitMs: challenge.timeLimitMs,
                isTimeLimitExceeded,
                ...executionResult
            };

            if (isTimeLimitExceeded) {
                finalResponse.success = false;
                finalResponse.error = {
                    type: 'runtime_error',
                    message: "Time Limit Exceeded",
                    details: `Execution took ${executionResult.executionTimeMs}ms (limit: ${challenge.timeLimitMs}ms).`
                };
            }

            // 6. Сохранение в историю (Submissions / HistoryChallenges)
            if (userId) {
                // Исправленная логика проверки: используем 'results'
                const allTestsPassed = results.length > 0 && results.every(r => r.status === 'success');
                const status = (allTestsPassed && !isTimeLimitExceeded) ? 'success' : 'fail';

                console.log(`[DB] Saving submission: User ${userId}, Status: ${status}, Time: ${executionResult.executionTimeMs}ms`);

                try {
                    await this.challengeRepository.createSubmission({
                        userId: Number(userId),
                        challengeId: Number(challengeId),
                        code,
                        language,
                        status,
                        executionTimeMs: executionResult.executionTimeMs
                    });
                    console.log(`[DB] Submission saved successfully`);
                } catch (dbError) {
                    console.error(`[DB ERROR] Failed to save submission:`, dbError.message);
                }
            }

            return finalResponse;

        } catch (error) {
            console.error(`[EXECUTE CRITICAL ERROR]:`, error.stack);
            throw error;
        }
    }

    async getCommunitySolutions(challengeId, userId, options = { page: 1, pageSize: 10 }) {
        const hasSolved = await this.challengeRepository.hasUserSolvedChallenge(userId, challengeId);
        if (!hasSolved) {
            throw new Error('Solve the challenge first to view community solutions.');
        }
        return await this.challengeRepository.findCommunitySolutions(challengeId, options);
    }

    async getUserSubmissionHistory(userId, challengeId) {
        return await this.challengeRepository.findUserHistory(userId, challengeId);
    }

    async leaveReview(userId, challengeId, content, rating) {
        return await this.challengeRepository.upsertReview({
            userId,
            challengeId,
            content,
            rating
        });
    }

    async getChallengeReviews(challengeId) {
        try {

            const reviews = await this.challengeRepository.findReviewsByChallengeId(challengeId);
            const avgRating = await this.challengeRepository.getAverageRating(challengeId);
            return { reviews, avgRating };
        }
        catch (error) {
            console.log(`[EXECUTE CRITICAL ERROR]:`, error);
        }
    }

    _safeParse(val) {
        if (val === null || val === undefined) return val;
        if (typeof val !== 'string') return val;

        const trimmed = val.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try { return JSON.parse(val); } catch (e) { return val; }
        }

        if (val === 'true') return true;
        if (val === 'false') return false;
        if (!isNaN(val) && val !== '') return Number(val);

        return val;
    }
}

module.exports = ChallengeService;