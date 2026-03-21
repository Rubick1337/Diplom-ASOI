
const TLE_SEC   = 5;
const TRUNC_LEN = 2000;

const { toPhpLiteral } = require('./helpers');

const template = (funcName, tests) => {
    const dotIdx     = funcName.indexOf('.');
    const className  = dotIdx >= 0 ? funcName.slice(0, dotIdx) : null;
    const methodName = dotIdx >= 0 ? funcName.slice(dotIdx + 1) : funcName;

    const testsPhp = tests.map(t => {
        const argsPhp      = t.args.map(toPhpLiteral).join(', ');
        const expectedPhp  = toPhpLiteral(t.expected);
        const unorderedPhp = t.unordered        ? 'true'              : 'false';
        const tolerancePhp = t.tolerance != null ? String(t.tolerance) : 'null';

        if (className) {
            return `    // test id=${t.id}
    if (!class_exists('${className}') || !method_exists('${className}', '${methodName}')) {
        $__results[] = ['id' => '${t.id}', 'status' => 'error', 'actual' => "Метод '${methodName}' класса '${className}' не найден."];
    } else {
        set_time_limit(${TLE_SEC});
        try {
            $__obj    = new ${className}();
            $__actual = $__obj->${methodName}(${argsPhp});
            $__expected = ${expectedPhp};
            $__status = __compare($__actual, $__expected, ${unorderedPhp}, ${tolerancePhp}) ? 'success' : 'fail';
            $__results[] = ['id' => '${t.id}', 'status' => $__status, 'actual' => __trunc($__actual), 'expected' => __trunc($__expected)];
        } catch (\\Throwable $__e) {
            $__results[] = ['id' => '${t.id}', 'status' => 'error', 'actual' => $__e->getMessage()];
        }
    }`;
        } else {
            return `    // test id=${t.id}
    if (!function_exists('${methodName}')) {
        $__results[] = ['id' => '${t.id}', 'status' => 'error', 'actual' => "Функция '${methodName}' не найдена. Убедитесь, что название функции совпадает с заданием."];
    } else {
        set_time_limit(${TLE_SEC});
        try {
            $__actual   = ${methodName}(${argsPhp});
            $__expected = ${expectedPhp};
            $__status = __compare($__actual, $__expected, ${unorderedPhp}, ${tolerancePhp}) ? 'success' : 'fail';
            $__results[] = ['id' => '${t.id}', 'status' => $__status, 'actual' => __trunc($__actual), 'expected' => __trunc($__expected)];
        } catch (\\Throwable $__e) {
            $__results[] = ['id' => '${t.id}', 'status' => 'error', 'actual' => $__e->getMessage()];
        }
    }`;
        }
    }).join('\n\n');

    return `// ##USER_CODE##
function __sortRecursive($v) {
    if (!is_array($v)) return $v;
    $v = array_map('__sortRecursive', $v);
    sort($v);
    return $v;
}
function __compare($a, $b, $unordered = false, $tolerance = null) {
    if ($tolerance !== null && is_numeric($a) && is_numeric($b)) {
        return abs((float)$a - (float)$b) <= $tolerance;
    }
    if ($unordered && is_array($a) && is_array($b)) {
        return json_encode(__sortRecursive($a)) === json_encode(__sortRecursive($b));
    }
    return json_encode($a) === json_encode($b);
}
function __trunc($v) {
    $s = json_encode($v, JSON_UNESCAPED_UNICODE);
    if (strlen($s) > ${TRUNC_LEN}) {
        return substr($s, 0, ${TRUNC_LEN}) . '...[truncated]';
    }
    return $v;
}
$__results  = [];
$__startMs  = (int)(microtime(true) * 1000);

${testsPhp}

$__endMs = (int)(microtime(true) * 1000);
ob_end_clean();
echo json_encode(['results' => $__results, 'executionTimeMs' => $__endMs - $__startMs]);
`;
};

const prepareScript = (userCode, harnessCode) => {

    let cleanCode = userCode.replace(/^<\?php\s*/i, '').replace(/\?>\s*$/i, '').trim();

    let declareStmt = '';
    cleanCode = cleanCode.replace(/^declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/m, (m) => {
        declareStmt = m;
        return '';
    }).trim();

    const declare = declareStmt ? `${declareStmt}\n` : '';

    return `<?php\n${declare}ob_start();\n${harnessCode.replace('// ##USER_CODE##', cleanCode)}`;
};

module.exports = {
    php: {
        image:  'php:8.2-cli-alpine',
        runCmd: "sh -c 'cat > /tmp/code.php && php /tmp/code.php 2>&1'",
        template,
        prepareScript,
    }
};
