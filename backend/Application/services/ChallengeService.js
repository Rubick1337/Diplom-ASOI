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
                console.log(`[Formatter] Запуск Ruff NodeJS для Python`);
                const workspace = new ruff.Workspace({});
                return workspace.format(code, {});
            } catch (e) {
                console.warn("[Ruff Info] Код содержит синтаксические ошибки, форматирование пропущено:", e.message);
                return code;
            }
        }
        return new Promise((resolve, reject) => {
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

            console.log(`[Formatter] Запуск: ${command} для языка ${language}`);
            const proc = spawn(command, args, { shell: true });

            let output = '';
            let errorOutput = '';

            proc.stdout.on('data', (data) => { output += data.toString(); });
            proc.stderr.on('data', (data) => { errorOutput += data.toString(); });

            proc.on('error', (err) => {
                console.error(`[Formatter Error] Не удалось запустить процесс:`, err);
                resolve(code);
            });

            proc.on('close', (exitCode) => {
                if (exitCode === 0) {
                    resolve(output || code);
                } else {
                    console.error(`[Formatter Exit] Код: ${exitCode}, Ошибка: ${errorOutput}`);
                    resolve(code);
                }
            });

            try {
                proc.stdin.write(code);
                proc.stdin.end();
            } catch (e) {
                console.error("[Formatter Stdin Error]", e);
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
            throw new Error('Поля name, description и funcName обязательны для заполнения');
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
        if (!challenge) throw new Error('Задача не найдена');
        return challenge;
    }

    async updateChallenge(id, rawData) {
        const { name, description, topic, mode, funcName, timeLimitMs, testCases, sampleInput, sampleOutput, isHidden, parameters } = rawData;
        const challengeData = {
            name, description, topic, mode, funcName, timeLimitMs, sampleInput, sampleOutput, isHidden,
            parameters: Array.isArray(parameters) ? parameters : undefined,
        };

        const updated = await this.challengeRepository.updateWithTestCases(id, challengeData, testCases);
        if (!updated) throw new Error('Задача для обновления не найдена');
        return updated;
    }

    async deleteChallenge(id) {
        const ok = await this.challengeRepository.delete(id);
        if (!ok) throw new Error('Задача для удаления не найдена');
        return true;
    }

    async executeChallenge(challengeId, code, language) {
        const challenge = await this.challengeRepository.findByIdWithTestCases(challengeId);
        if (!challenge) throw new Error('Challenge not found');

        const config = harnessConfigs[language];
        if (!config) throw new Error(`Language "${language}" is not supported`);

        const formattedTests = challenge.testCases.map(tc => ({
            id: tc.id,
            title: tc.title,
            expected: this._safeParse(tc.expectedOutput),
            args: tc.testArgs
                ? tc.testArgs.sort((a, b) => a.order - b.order).map(arg => this._safeParse(arg.value))
                : []
        }));

        const harnessCode = config.template(challenge.funcName, formattedTests);

        const executionResult = await this.dockerRunner.run(config, code, harnessCode);

        const isTimeLimitExceeded = executionResult.executionTimeMs > challenge.timeLimitMs;

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
                details: `Ваше решение выполнялось ${executionResult.executionTimeMs}ms, что превышает лимит ${challenge.timeLimitMs}ms. Попробуйте оптимизировать алгоритм.`
            };
        }
        console.log(finalResponse);
        return finalResponse;
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