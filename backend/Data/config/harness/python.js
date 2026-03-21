
const TLE_SECONDS = 5;
const TRUNC_CHARS  = 2000;

const template = (funcName, tests) => {
    const dotIdx     = funcName.indexOf('.');
    const className  = dotIdx >= 0 ? funcName.slice(0, dotIdx) : null;
    const methodName = dotIdx >= 0 ? funcName.slice(dotIdx + 1) : funcName;

    const callBlock = className
        ? [
            `            __cls = globals().get('${className}')`,
            `            if not (callable(__cls) and hasattr(__cls, '${methodName}')):`,
            `                __results.append({'id': t['id'], 'status': 'error', 'actual': "Метод '${methodName}' класса '${className}' не найден."})`,
            `                continue`,
            `            __raw = getattr(__cls(), '${methodName}')(*t['args'])`,
            `            actual = asyncio.run(__raw) if asyncio.iscoroutine(__raw) else __raw`,
          ].join('\n')
        : [
            `            __fn = globals().get('${methodName}')`,
            `            if not callable(__fn):`,
            `                __results.append({'id': t['id'], 'status': 'error', 'actual': "Функция '${methodName}' не найдена. Убедитесь, что название функции совпадает с заданием."})`,
            `                continue`,
            `            __raw = __fn(*t['args'])`,
            `            actual = asyncio.run(__raw) if asyncio.iscoroutine(__raw) else __raw`,
          ].join('\n');

    return `import json, traceback, time, asyncio, signal

# ── TLE ─────────────────────────────────────────────────────────────────────
class __TLE(Exception): pass
def __tle_handler(signum, frame): raise __TLE()

# ── helpers ──────────────────────────────────────────────────────────────────
def __sort_deep(v):
    if isinstance(v, list):
        return sorted([__sort_deep(x) for x in v], key=lambda x: json.dumps(x, ensure_ascii=False, sort_keys=True))
    return v

def __compare(a, b, unordered=False, tolerance=None):
    if tolerance is not None and isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(a - b) <= tolerance
    if unordered:
        return json.dumps(__sort_deep(a), ensure_ascii=False) == json.dumps(__sort_deep(b), ensure_ascii=False)
    return json.dumps(a, ensure_ascii=False) == json.dumps(b, ensure_ascii=False)

def __filter_tb(tb_str):
    """Remove harness-internal frames so the user only sees their own code."""
    lines = tb_str.split('\\n')
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        # A traceback frame is two lines: "  File ..., line N, in name" + "    code"
        # Skip frames whose code line references harness internals
        next_ln = lines[i + 1] if i + 1 < len(lines) else ''
        if any(m in next_ln for m in ('__raw = ', '__fn(', '__fn *', 'getattr(__cls')):
            i += 2  # skip header + code line
            continue
        out.append(ln)
        i += 1
    return '\\n'.join(out).strip()

def __trunc(v):
    """Return v as-is if JSON is short, else a truncated string."""
    s = json.dumps(v, ensure_ascii=False)
    if len(s) > ${TRUNC_CHARS}:
        return s[:${TRUNC_CHARS}] + '...[truncated]'
    return v

__tests   = ${JSON.stringify(tests)}
__results = []
__start   = time.perf_counter()

try:
    for t in __tests:
        signal.signal(signal.SIGALRM, __tle_handler)
        signal.alarm(${TLE_SECONDS})
        try:
${callBlock}
            signal.alarm(0)
            status = 'success' if __compare(actual, t['expected'], t.get('unordered', False), t.get('tolerance')) else 'fail'
            __results.append({'id': t['id'], 'status': status, 'actual': __trunc(actual), 'expected': __trunc(t['expected'])})
        except __TLE:
            signal.alarm(0)
            __results.append({'id': t['id'], 'status': 'tle', 'actual': 'Time Limit Exceeded'})
        except Exception:
            signal.alarm(0)
            __results.append({'id': t['id'], 'status': 'error', 'actual': __filter_tb(traceback.format_exc())})
finally:
    __sys.stdout = __real_stdout
    __ms = int((time.perf_counter() - __start) * 1000)
    print(json.dumps({'results': __results, 'executionTimeMs': __ms}))
`;
};

const prepareScript = (userCode, harnessCode) => {
    const preamble = [
        'import sys as __sys, io as __io',
        '__real_stdout = __sys.stdout',
        '__sys.stdout  = __io.StringIO()',
        "__sys.stdin   = open('/dev/null', 'r')",
    ].join('\n');
    return `${preamble}\n${userCode}\n\n${harnessCode}`;
};

module.exports = {
    python: {
        image:  'python:3.10-slim',
        runCmd: 'python3 -',
        template,
        prepareScript,
    }
};
