
const TLE_MS    = 5000;
const TRUNC_LEN = 2000;

const HARNESS = (funcName, tests) => {
    const dotIdx     = funcName.indexOf('.');
    const className  = dotIdx >= 0 ? funcName.slice(0, dotIdx) : null;
    const methodName = dotIdx >= 0 ? funcName.slice(dotIdx + 1) : funcName;

    const resolveCall = className
        ? `(typeof ${className} === 'function' && typeof ${className}.prototype['${methodName}'] === 'function')
            ? (...__a) => new ${className}()['${methodName}'](...__a) : null`
        : `typeof ${methodName} === 'function' ? ${methodName} : null`;

    const errorMsg = className
        ? `Метод '${methodName}' класса '${className}' не найден.`
        : `Функция '${methodName}' не найдена. Убедитесь, что название функции совпадает с заданием.`;

    return `function __sortDeep(v) {
    if (!Array.isArray(v)) return v;
    return [...v].map(__sortDeep).sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
}
function __compare(a, b, unordered, tol) {
    if (tol != null && typeof a === 'number' && typeof b === 'number')
        return Math.abs(a - b) <= tol;
    if (unordered) return JSON.stringify(__sortDeep(a)) === JSON.stringify(__sortDeep(b));
    return JSON.stringify(a) === JSON.stringify(b);
}
function __trunc(v) {
    const s = JSON.stringify(v);
    if (s === undefined) return '"[unserializable]"';
    if (s.length > ${TRUNC_LEN}) return JSON.stringify(s.slice(0, ${TRUNC_LEN}) + '...[truncated]');
    return s;
}
function __tleRace(promise, ms) {
    let __timer;
    const __tleP = new Promise((_, reject) => {
        __timer = setTimeout(() => reject(Object.assign(new Error('Time Limit Exceeded'), { __isTLE: true })), ms);
    });
    // Clear the timer as soon as the user promise settles — prevents Node from waiting 5s on fast functions
    const __raceP = promise.then(
        v => { clearTimeout(__timer); return v; },
        e => { clearTimeout(__timer); throw e; }
    );
    return Promise.race([__raceP, __tleP]);
}

const __tests     = ${JSON.stringify(tests)};
const __startTime = performance.now();
const __results   = [];

(async () => {
    for (const t of __tests) {
        try {
            const __fn = ${resolveCall};
            if (!__fn) {
                __results.push({ id: t.id, status: 'error', actual: ${JSON.stringify(errorMsg)} });
                continue;
            }
            const __raw = __fn(...t.args);
            // Wrap in Promise so async TLE race works; sync functions resolve immediately
            const actual = await __tleRace(
                Promise.resolve(__raw).then(v => (__raw && typeof __raw.then === 'function') ? v : v),
                ${TLE_MS}
            );
            const __ok = __compare(actual, t.expected, !!t.unordered, t.tolerance ?? null);
            __results.push({ id: t.id, status: __ok ? 'success' : 'fail',
                actual: JSON.parse(__trunc(actual)), expected: JSON.parse(__trunc(t.expected)) });
        } catch (e) {
            if (e && e.__isTLE) {
                __results.push({ id: t.id, status: 'tle', actual: 'Time Limit Exceeded' });
            } else {
                __results.push({ id: t.id, status: 'error', actual: e.stack || e.message });
            }
        }
    }
    const __endTime = performance.now();
    __origLog(JSON.stringify({ results: __results, executionTimeMs: Math.round(__endTime - __startTime) }));
})().catch(e => {
    __origLog(JSON.stringify({ results: [{ id: 0, status: 'error', actual: String(e.message) }], executionTimeMs: 0 }));
});
`;
};

const PREPARE = (userCode, harnessCode) =>
    `const __origLog = console.log;\nconsole.log = console.error = console.warn = console.info = console.debug = () => {};\n${userCode}\n\n${harnessCode}`;

const NODE_CONFIG = {
    image:        'node:18-alpine',
    runCmd:       'node -',
    inputRunCmd:  'head -1 | base64 -d > /tmp/__in; cat > /tmp/__s.js && node /tmp/__s.js < /tmp/__in',
    template:      HARNESS,
    prepareScript: PREPARE,
};

module.exports = {
    javascript:  { ...NODE_CONFIG },
    typescript:  { ...NODE_CONFIG, transpileWith: 'typescript' },
    coffeescript:{ ...NODE_CONFIG, transpileWith: 'coffeescript' },
};
