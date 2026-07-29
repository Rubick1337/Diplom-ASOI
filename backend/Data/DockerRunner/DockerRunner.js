const { spawn } = require('child_process');

class DockerRunner {
    async run(langConfig, userCode, harnessCode, timeLimitMs = 10000) {
        const cleanUserCode = userCode.trimStart();
        const { fullScript, userCodeOffset } = this._prepareFullScript(langConfig, cleanUserCode, harnessCode);
        const userCodeLines = cleanUserCode.split('\n').length;

        const hardKillMs = timeLimitMs + 3000;

        return new Promise((resolve) => {
            const dockerProcess = spawn('docker', [
                'run', '-i', '--rm',
                '--memory=128m',
                '--cpus=0.5',
                '--pids-limit', '50',
                '--network', 'none',
                langConfig.image,
                'sh', '-c', langConfig.runCmd
            ]);

            let stdout = '';
            let stderr = '';
            let resolved = false;

            const killTimer = setTimeout(() => {
                if (!resolved) {
                    dockerProcess.kill('SIGKILL');
                    resolved = true;
                    resolve({
                        success: false,
                        executionTimeMs: timeLimitMs,
                        error: {
                            type: 'time_limit_exceeded',
                            message: 'Time Limit Exceeded',
                            details: `Execution was stopped after ${hardKillMs}ms (limit: ${timeLimitMs}ms). Possible infinite loop.`,
                            userCodeLines
                        }
                    });
                }
            }, hardKillMs);

            dockerProcess.stdin.write(fullScript);
            dockerProcess.stdin.end();

            dockerProcess.stdout.on('data', (data) => stdout += data.toString());
            dockerProcess.stderr.on('data', (data) => stderr += data.toString());

            dockerProcess.on('close', () => {
                clearTimeout(killTimer);
                if (resolved) return;
                resolved = true;

                const hasValidOutput = /\{.*"results".*\}/s.test(stdout);

                if (!hasValidOutput && stderr.trim()) {
                    this._printPrettyError(stderr, langConfig.image);
                    const cleanedError = this._filterStackTrace(stderr.trim(), langConfig.image, userCodeOffset, userCodeLines);
                    return resolve({
                        success: false,
                        executionTimeMs: 0,
                        error: { type: 'runtime_error', message: 'Ошибка выполнения кода', details: cleanedError, userCodeLines }
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
                            let errorLine = null;
                            let errorCol = 1;
                            let errorEndCol = null;
                            if (runtimeErr.errorLoc) {
                                errorLine = runtimeErr.errorLoc.line - userCodeOffset;
                                if (errorLine < 1) errorLine = 1;
                                errorCol = runtimeErr.errorLoc.col || 1;
                                errorEndCol = runtimeErr.errorLoc.endCol || null;
                            }
                            return resolve({
                                success: false,
                                executionTimeMs,
                                error: {
                                    type: 'runtime_error',
                                    message: 'Ошибка выполнения',
                                    details: this._filterStackTrace(String(runtimeErr.actual), langConfig.image, userCodeOffset, userCodeLines),
                                    errorLine,
                                    errorCol,
                                    errorEndCol,
                                    userCodeLines
                                },
                                testResults: results
                            });
                        }

                        resolve({ success: true, testResults: results, executionTimeMs });
                    } else {
                        const rawError = stderr.trim() || stdout.trim() || 'Нет вывода от программы';
                        const cleanedError = this._filterStackTrace(rawError, langConfig.image, userCodeOffset, userCodeLines);
                        resolve({
                            success: false,
                            executionTimeMs: 0,
                            error: { type: 'runtime_error', message: 'Ошибка выполнения кода', details: cleanedError, userCodeLines }
                        });
                    }
                } catch {
                    resolve({
                        success: false,
                        executionTimeMs: 0,
                        error: { type: 'parse_error', message: 'Ошибка парсинга результатов', details: stdout.trim(), userCodeLines }
                    });
                }
            });
        });
    }

    async runRaw(langConfig, code, timeLimitMs = 10000, stdinInput = null) {
        const hasInput = stdinInput !== null && stdinInput !== undefined && stdinInput !== '';
        const runCmd   = hasInput && langConfig.inputRunCmd ? langConfig.inputRunCmd : langConfig.runCmd;
        const stdinData = hasInput && langConfig.inputRunCmd
            ? Buffer.from(stdinInput).toString('base64') + '\n' + code
            : code;

        return new Promise((resolve) => {
            const proc = spawn('docker', [
                'run', '-i', '--rm',
                '--memory=128m', '--cpus=0.5', '--pids-limit', '50',
                '--network', 'none',
                langConfig.image,
                'sh', '-c', runCmd,
            ]);

            let stdout = '';
            let stderr = '';
            let resolved = false;

            const hardKill = setTimeout(() => {
                if (!resolved) {
                    proc.kill('SIGKILL');
                    resolved = true;
                    resolve({ output: '', error: 'Превышен лимит времени (TLE)', timedOut: true });
                }
            }, timeLimitMs + 3000);

            proc.stdin.write(stdinData);
            proc.stdin.end();

            proc.stdout.on('data', d => { stdout += d.toString(); });
            proc.stderr.on('data', d => { stderr += d.toString(); });

            proc.on('close', (exitCode) => {
                clearTimeout(hardKill);
                if (resolved) return;
                resolved = true;
                if (exitCode !== 0 && stderr.trim()) {
                    resolve({ output: stdout.trim(), error: stderr.trim(), timedOut: false });
                } else {
                    resolve({ output: stdout.trim(), error: null, timedOut: false });
                }
            });
        });
    }

    _prepareFullScript(config, userCode, harnessCode) {
        let fullScript;
        if (typeof config.prepareScript === 'function') {
            fullScript = config.prepareScript(userCode, harnessCode);
        } else {
            fullScript = `${userCode}\n\n${harnessCode}`;
        }

        const userFirstLine = userCode.trimStart().split('\n').find(l => l.trim());
        let userCodeOffset = 0;

        if (userFirstLine) {
            const needle = userFirstLine.trim();
            const scriptLines = fullScript.split('\n');
            for (let i = 0; i < scriptLines.length; i++) {
                if (scriptLines[i].trim() === needle) {
                    userCodeOffset = i;
                    break;
                }
            }
        }

        return { fullScript, userCodeOffset };
    }

    _filterStackTrace(stack, image = '', userCodeOffset = 0, userCodeLines = 9999) {
        if (!stack) return '';

        if (image.includes('node')) {
            return this._filterNodeStack(stack, userCodeLines, userCodeOffset);
        }

        if (image.includes('python')) {
            return this._filterPythonStack(stack, userCodeLines, userCodeOffset);
        }

        if (image.includes('gcc')) {
            return this._filterCppStack(stack, userCodeOffset);
        }

        if (image.includes('mono')) {
            return this._filterCsharpStack(stack, userCodeOffset);
        }

        if (image.includes('php')) {
            return this._filterPhpStack(stack, userCodeOffset);
        }

        if (image.includes('openjdk') || image.includes('java')) {
            return this._filterJavaStack(stack);
        }

        return stack.trim();
    }

    _filterNodeStack(stack, userCodeLines, userCodeOffset = 0) {
        const lines = stack.split('\n');
        const result = lines.filter(line => {
            const l = line.trim();

            if (!l.startsWith('at ')) return true;

            if (l.startsWith('at node:') || l.includes('runMicrotask') || l.includes('processImmediate')) return false;

            if (/^at \[stdin\]:\d+/.test(l)) return false;
            if (/^at (Array|Object)\.(map|forEach|filter|reduce|<anonymous>)/.test(l)) return false;
            if (l.startsWith('at __HarnessRunner') || l.includes('__harness')) return false;

            const frameMatch = l.match(/^at .+ \(\[stdin\]:(\d+):\d+\)/);
            if (frameMatch) {
                const frameLine = parseInt(frameMatch[1]);
                return frameLine <= userCodeLines;
            }
            return false;
        });

        let output = result.join('\n').trim();
        if (userCodeOffset > 0) {
            output = output.replace(/\[stdin\]:(\d+)/g, (_, n) => {
                const adj = parseInt(n) - userCodeOffset;
                return `[stdin]:${adj > 0 ? adj : 1}`;
            });
        }
        return output;
    }

    _filterPythonStack(stack, userCodeLines, userCodeOffset = 0) {
        const lines = stack.split('\n');
        const result = lines.map(line => {
            const l = line.trim();

            if (l.startsWith('Traceback') || l.startsWith('During')) return null;

            const fileMatch = l.match(/^File ".*", line (\d+)/);
            if (fileMatch) {
                const frameLine = parseInt(fileMatch[1]);
                const userLine = frameLine - userCodeOffset;
                if (userLine < 1 || userLine > userCodeLines) return null;
                return userCodeOffset > 0
                    ? line.replace(`line ${frameLine}`, `line ${userLine}`)
                    : line;
            }
            return line;
        }).filter(l => l !== null);
        return result.join('\n').trim();
    }

    _filterCppStack(stack, userCodeOffset) {

        let result = stack
            .replace(/\bsolution:(\d+):(\d+):/g, 'code:$1:$2:')
            .replace(/\/tmp\/\w+\.cpp:/g, '__harness:')
            .replace(/\/tmp\/\w+\.exe/g, '__exe');

        result = result.split('\n')
            .filter(l => {
                if (l.startsWith('__harness:') || l.startsWith('__exe')) return false;
                const t = l.toLowerCase();
                if (t.includes('__tojson') || t.includes('__escstr')) return false;
                if (/^(?:code|solution):\s*In (function|method|constructor|destructor)/i.test(l.trim())) return false;
                if (/^(?:code|solution):\s*At global scope/i.test(l.trim())) return false;
                return true;
            })
            .join('\n');

        result = result.replace(/\\U([0-9A-Fa-f]{8})/g, (_, hex) => {
            try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return _; }
        });

        return result.trim();
    }

    _filterCsharpStack(stack, userCodeOffset) {
        let result = stack
            .replace(/\/tmp\/\w+\.cs\(/g, 'code(')
            .replace(/\/tmp\/\w+\.exe/g, 'code')
            .replace(/\/tmp\/\w+\.cs:/g, 'code:');

        result = result.split('\n')
            .filter(l => !l.includes('__HarnessRunner') && !l.includes('__harness'))
            .join('\n');

        if (userCodeOffset > 0) {
            result = result
                .replace(/code\((\d+),(\d+)\)/g, (_, line, col) => {
                    const adj = parseInt(line) - userCodeOffset;
                    return adj > 0 ? `code(${adj},${col})` : `code(${line},${col})`;
                })
                .replace(/code:(\d+):(\d+):/g, (_, line, col) => {
                    const adj = parseInt(line) - userCodeOffset;
                    return adj > 0 ? `code:${adj}:${col}:` : `code:${line}:${col}:`;
                });
        }
        return result.trim();
    }

    _filterPhpStack(stack, userCodeOffset) {
        let result = stack
            .replace(/\/tmp\/\w+\.php/g, 'code.php')

            .replace(/\nStack trace:[\s\S]*/m, '')
            .trim();

        if (userCodeOffset > 0) {
            result = result.replace(/\bon line (\d+)/gi, (_, line) => {
                const adj = parseInt(line) - userCodeOffset;
                return adj > 0 ? `on line ${adj}` : `on line ${line}`;
            });
        }
        return result.trim();
    }

    _filterJavaStack(stack) {

        const lines = stack.split('\n');
        const result = lines.filter(line => {
            const l = line.trim();

            if (l.startsWith('at Main.main') || l.startsWith('at Main.__')) return false;
            if (l.includes('__toJson') || l.includes('__compare') || l.includes('__HarnessRunner')) return false;

            return true;
        });

        return result.join('\n').replace(/\/tmp\/Main\.java/g, 'solution.java').trim();
    }

    _printPrettyError(stderr, image) {
        console.log('\x1b[31m%s\x1b[0m', `[DOCKER ERROR] image=${image}`);
        console.log(stderr);
    }
}

module.exports = DockerRunner;
