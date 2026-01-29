const { spawn } = require('child_process');

class DockerRunner {
    async run(langConfig, userCode, harnessCode) {
        const cleanUserCode = userCode.trimStart();
        const fullScript = this._prepareFullScript(langConfig, cleanUserCode, harnessCode);
        const userCodeLines = cleanUserCode.split('\n').length;

        return new Promise((resolve) => {
            const dockerProcess = spawn('docker', [
                'run', '-i', '--rm',
                '--memory=128m',
                '--network', 'none',
                langConfig.image,
                'sh', '-c', langConfig.runCmd
            ]);

            let stdout = '';
            let stderr = '';

            dockerProcess.stdin.write(fullScript);
            dockerProcess.stdin.end();

            dockerProcess.stdout.on('data', (data) => stdout += data.toString());
            dockerProcess.stderr.on('data', (data) => stderr += data.toString());

            dockerProcess.on('close', (code) => {
                if (stderr.trim()) {
                    this._printPrettyError(stderr, fullScript, langConfig.image);
                    const cleanedError = this._filterStackTrace(stderr.trim());

                    return resolve({
                        success: false,
                        executionTimeMs: 0,
                        error: {
                            type: 'runtime_error',
                            message: "Ошибка выполнения кода",
                            details: cleanedError,
                            userCodeLines: userCodeLines
                        }
                    });
                }

                try {
                    const jsonMatch = stdout.match(/\{.*\}/s);
                    if (jsonMatch) {
                        const output = JSON.parse(jsonMatch[0]);
                        const results = output.results || [];
                        const executionTimeMs = output.executionTimeMs || 0;

                        const runtimeErr = results.find(r => r.status === 'error');
                        if (runtimeErr) {
                            return resolve({
                                success: false,
                                executionTimeMs,
                                error: {
                                    type: 'runtime_error',
                                    message: "Ошибка выполнения",
                                    details: this._filterStackTrace(runtimeErr.actual),
                                    userCodeLines
                                },
                                testResults: results
                            });
                        }

                        resolve({
                            success: true,
                            testResults: results,
                            executionTimeMs
                        });
                    } else {
                        throw new Error("No JSON output found");
                    }
                } catch (err) {
                    resolve({
                        success: false,
                        executionTimeMs: 0,
                        error: {
                            type: 'parse_error',
                            message: "Ошибка парсинга результатов",
                            details: stdout.trim()
                        }
                    });
                }
            });
        });
    }

    _filterStackTrace(stack) {
        if (!stack) return "";
        const lines = stack.split('\n');
        const filteredLines = lines.filter(line => {
            const l = line.toLowerCase();
            return !(l.includes('<module>') || l.includes('at [stdin]') || l.includes('harness'));
        });
        return filteredLines.join('\n').trim();
    }

    _prepareFullScript(config, userCode, harnessCode) {
        return `${userCode}\n\n${harnessCode}`;
    }

    _printPrettyError(stderr, fullScript, image) {
        console.log('\x1b[31m%s\x1b[0m', `[DOCKER ERROR]`);
        console.log(stderr);
    }
}

module.exports = DockerRunner;