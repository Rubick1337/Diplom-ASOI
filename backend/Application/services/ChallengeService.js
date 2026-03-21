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

        if (language === 'python') {
            try {
                const workspace = new ruff.Workspace({});
                return workspace.format(code, {});
            } catch (e) { return code; }
        }

        if (language === 'php') {
            try {
                const prettier = require('prettier');
                const phpPlugin = require('@prettier/plugin-php');
                return await prettier.format(code, {
                    parser: 'php',
                    plugins: [phpPlugin],
                    tabWidth: 4,
                    printWidth: 100,
                    braceStyle: '1tbs',
                    singleQuote: true,
                });
            } catch (e) { return code; }
        }

        if (language === 'coffeescript') {
            try {
                const coffee = require('coffeescript');

                return code;
            } catch (e) { return code; }
        }

        return new Promise((resolve) => {
            let command = '';
            let args = [];
            if (['cpp', 'csharp', 'java', 'c'].includes(language)) {
                command = clangFormat.location;
                if (command.endsWith('.js')) {
                    args = [command, '-style=Google'];
                    command = 'node';
                } else { args = ['-style=Google']; }
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
            } catch (e) { resolve(code); }
            setTimeout(() => {
                if (!proc.killed) proc.kill();
                resolve(code);
            }, 3000);
        });
    }

    async createChallenge(rawData) {
        const {
            name, description, topicIds, topicId, topicName, mode, funcName,
            timeLimitMs, testCases, sampleInput, sampleOutput,
            isHidden, parameters, difficulty,
            showAuthor, userId
        } = rawData;

        if (!name || !description || !funcName) {
            throw new Error('Required fields missing');
        }

        let resolvedTopicIds = Array.isArray(topicIds) ? topicIds.map(Number).filter(Boolean) : [];
        if (resolvedTopicIds.length === 0 && topicId) {
            resolvedTopicIds = [Number(topicId)];
        }
        if (resolvedTopicIds.length === 0 && topicName && topicName.trim()) {
            const id = await this.challengeRepository.findOrCreateTopic(topicName.trim());
            resolvedTopicIds = [id];
        }

        const challengeData = {
            name,
            description,
            topicIds: resolvedTopicIds,
            difficulty: difficulty ? Number(difficulty) : 1,
            mode: mode || 'harness',
            funcName,
            timeLimitMs: timeLimitMs || 2000,
            createdByUserId: showAuthor === false ? null : (userId ?? null),
            sampleInput: sampleInput || '',
            sampleOutput: sampleOutput || '',
            isHidden: isHidden ?? false,
            parameters: Array.isArray(parameters) ? parameters : [],
        };

        return await this.challengeRepository.createWithTestCases(challengeData, testCases || []);
    }

    async getAllChallenges(query) {
        const { page, pageSize, search, nameLike, topicId, createdByUserId, showHidden, sort, difficulty } = query;
        const filter = { search, nameLike };

        if (topicId) filter.topicId = Number(topicId);
        if (showHidden !== undefined) filter.showHidden = showHidden === 'true' || showHidden === true;
        if (createdByUserId) filter.createdByUserId = Number(createdByUserId);
        if (difficulty) filter.difficulty = Number(difficulty);

        let orderBy = 'id';
        let orderDirection = 'ASC';

        switch (sort) {
            case 'hardest':     orderBy = 'difficulty';    orderDirection = 'DESC'; break;
            case 'easiest':     orderBy = 'difficulty';    orderDirection = 'ASC';  break;
            case 'popular':     orderBy = 'solvedCount';   orderDirection = 'DESC'; break;
            case 'rating_high': orderBy = 'averageRating'; orderDirection = 'DESC'; break;
            case 'rating_low':  orderBy = 'averageRating'; orderDirection = 'ASC';  break;
            case 'newest':      orderBy = 'id';            orderDirection = 'DESC'; break;
            default:            orderBy = 'id';            orderDirection = 'ASC';
        }

        const options = {
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 6,
            orderBy,
            orderDirection,
        };

        return await this.challengeRepository.findManyWithTestCases(filter, options);
    }

    async getChallengeById(id) {
        const challenge = await this.challengeRepository.findByIdWithTestCases(id);
        if (!challenge) throw new Error('Not found');
        return challenge;
    }

    async updateChallenge(id, rawData) {
        const {
            name, description, topicIds, topicId, mode, funcName,
            timeLimitMs, testCases, sampleInput, sampleOutput,
            isHidden, parameters, difficulty
        } = rawData;

        let resolvedTopicIds = undefined;
        if (Array.isArray(topicIds)) {
            resolvedTopicIds = topicIds.map(Number).filter(Boolean);
        } else if (topicId !== undefined) {
            resolvedTopicIds = topicId ? [Number(topicId)] : [];
        }

        const challengeData = {
            name,
            description,
            topicIds: resolvedTopicIds,
            mode,
            funcName,
            timeLimitMs,
            sampleInput,
            sampleOutput,
            isHidden,
            parameters: Array.isArray(parameters) ? parameters : undefined,
            difficulty: difficulty ? Number(difficulty) : undefined
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
        const challenge = await this.challengeRepository.findByIdWithTestCases(challengeId);
        if (!challenge) throw new Error('Challenge not found');

        let execCode = code;
        let execLanguage = language;

        if (language === 'typescript') {
            try {
                const ts = require('typescript');
                const result = ts.transpileModule(code, {
                    compilerOptions: {
                        module: ts.ModuleKind.CommonJS,
                        target: ts.ScriptTarget.ES2020,
                        strict: false,
                        esModuleInterop: true
                    }
                });
                execCode = result.outputText;
                execLanguage = 'javascript';
            } catch (e) {
                throw new Error(`TypeScript compile error: ${e.message}`);
            }
        }

        if (language === 'coffeescript') {
            try {
                const coffee = require('coffeescript');
                execCode = coffee.compile(code, { bare: true });
                execLanguage = 'javascript';
            } catch (e) {
                throw new Error(`CoffeeScript compile error: ${e.message}`);
            }
        }

        const config = harnessConfigs[execLanguage];
        if (!config) throw new Error(`Language "${language}" not supported`);

        const formattedTests = challenge.testCases.map(tc => ({
            id: tc.id,
            title: tc.title,
            expected: this._safeParse(tc.expectedOutput),
            args: tc.testArgs
                ? tc.testArgs.sort((a, b) => a.order - b.order).map(arg => this._safeParse(arg.value))
                : []
        }));

        const paramTypes = (challenge.parameters || []).map(p => p.dataType || '');
        const harnessCode = config.template(challenge.funcName, formattedTests, paramTypes);
        const executionResult = await this.dockerRunner.run(config, execCode, harnessCode, challenge.timeLimitMs);
        const isTimeLimitExceeded = executionResult.executionTimeMs > challenge.timeLimitMs;
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

        let xpGained = 0;

        if (userId) {
            const allTestsPassed = results.length > 0 && results.every(r => r.status === 'success');
            const isNewSolve = allTestsPassed && !isTimeLimitExceeded;
            const status = isNewSolve ? 'success' : 'fail';

            const hasRuntimeError = results.some(r => r.status === 'error') || (executionResult.error && results.length === 0);
            const testsReached = results.length > 0 && !hasRuntimeError;

            if (isNewSolve) {
                const firstSolve = await this.challengeRepository.isFirstSolve(Number(userId), Number(challengeId));
                if (firstSolve) {
                    const difficulty = challenge.difficulty || 1;
                    xpGained = difficulty * 100;
                    await this.challengeRepository.awardExperience(Number(userId), xpGained);
                }
            }

            if (testsReached) {
                try {
                    const testsPassed = results.filter(r => r.status === 'success').length;
                    const testsTotal  = results.length;
                    await this.challengeRepository.createSubmission({
                        userId: Number(userId),
                        challengeId: Number(challengeId),
                        code,
                        language,
                        status,
                        executionTimeMs: executionResult.executionTimeMs,
                        testsPassed,
                        testsTotal,
                    });
                } catch (e) {
                    console.error('Failed to save submission:', e.message);
                }
            }
        }

        return { ...finalResponse, xpGained };
    }

    async verifyChallenge({ funcName, timeLimitMs, testCases, parameters = [] }, code, language) {
        let execCode = code;
        let execLanguage = language;

        if (language === 'typescript') {
            try {
                const ts = require('typescript');
                const result = ts.transpileModule(code, {
                    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, strict: false }
                });
                execCode = result.outputText;
                execLanguage = 'javascript';
            } catch (e) { throw new Error(`TypeScript compile error: ${e.message}`); }
        }

        if (language === 'coffeescript') {
            try {
                const coffee = require('coffeescript');
                execCode = coffee.compile(code, { bare: true });
                execLanguage = 'javascript';
            } catch (e) { throw new Error(`CoffeeScript compile error: ${e.message}`); }
        }

        const config = harnessConfigs[execLanguage];
        if (!config) throw new Error(`Language "${language}" not supported`);

        const limit = Number(timeLimitMs) || 2000;

        const formattedTests = testCases.map((tc, idx) => ({
            id: idx + 1,
            title: tc.title || `Test ${idx + 1}`,
            expected: this._safeParse(tc.expectedOutput),
            args: (tc.testArgs || [])
                .sort((a, b) => a.order - b.order)
                .map(arg => this._safeParse(arg.value))
        }));

        const paramTypes = parameters.map(p => p.dataType || '');
        const harnessCode = config.template(funcName, formattedTests, paramTypes);
        const executionResult = await this.dockerRunner.run(config, execCode, harnessCode, limit);

        return {
            success: executionResult.success,
            testResults: executionResult.testResults || [],
            error: executionResult.error || null,
            executionTimeMs: executionResult.executionTimeMs,
            isTimeLimitExceeded: executionResult.executionTimeMs > limit,
        };
    }

    async getCommunitySolutions(challengeId, userId, options = {}) {
        const hasSolved = await this.challengeRepository.hasUserSolvedChallenge(userId, challengeId);
        if (!hasSolved) throw new Error('Solve the challenge first to view community solutions.');
        return await this.challengeRepository.findCommunitySolutions(challengeId, {
            page: options.page || 1,
            pageSize: options.pageSize || 10,
            language: options.language,
            sort: options.sort || 'newest'
        });
    }

    async getUserSubmissionHistory(userId, challengeId) {
        return await this.challengeRepository.findUserHistory(userId, challengeId);
    }

    async leaveReview(userId, challengeId, content, rating) {
        return await this.challengeRepository.upsertReview({ userId, challengeId, content, rating });
    }

    async getChallengeReviews(challengeId, query = {}) {
        const options = {
            page: query.page ? Number(query.page) : 1,
            pageSize: query.pageSize ? Number(query.pageSize) : 5,
            sort: query.sort || 'newest'
        };
        const reviewsData = await this.challengeRepository.findReviewsByChallengeId(challengeId, options);
        const avgRating = await this.challengeRepository.getAverageRating(challengeId);
        return {
            reviews: reviewsData.items,
            pagination: {
                total: reviewsData.total,
                page: reviewsData.page,
                pageSize: reviewsData.pageSize,
                totalPages: reviewsData.totalPages
            },
            avgRating
        };
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
    async getTopics() {
        return await this.challengeRepository.findAllTopics();
    }

    async createTopic(name) {
        const id = await this.challengeRepository.findOrCreateTopic(name);
        return { id, name: name.trim() };
    }

    async getReportReasons() {
        return await this.challengeRepository.findAllReportReasons();
    }

    async reportChallenge(userId, challengeId, reasonId, reasonText) {
        if (!userId || !challengeId) throw new Error('userId and challengeId are required');
        return await this.challengeRepository.createReport({ userId, challengeId, reasonId, reasonText });
    }
}

module.exports = ChallengeService;
