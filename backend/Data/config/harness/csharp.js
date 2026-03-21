
const TLE_MS    = 5000;
const TRUNC_LEN = 2000;

const { toCSharpLiteral } = require('./helpers');

const template = (funcName, tests, paramTypes = []) => {
    const testCases = tests.map((t) => {
        const argsLiteral = t.args.map((arg, idx) => {
            const lit = toCSharpLiteral(arg);
            if (typeof arg === 'number') {
                const pt = paramTypes[idx] || '';
                if (pt === 'int')   return `((int)(${lit}))`;
                if (pt === 'float') return `((double)(${lit}))`;
            }
            return lit;
        }).join(', ');
        const expectedLiteral  = toCSharpLiteral(t.expected);
        const unorderedLiteral = t.unordered        ? 'true'              : 'false';
        const toleranceLiteral = t.tolerance != null ? String(t.tolerance) : '-1';
        return `        // test id=${t.id}
        {
            object __actual_${t.id}   = null;
            Exception __ex_${t.id}    = null;
            bool __tle_${t.id}        = false;
            var __task_${t.id} = System.Threading.Tasks.Task.Run(() => {
                __actual_${t.id} = __UserCode.${funcName}(${argsLiteral});
            });
            if (!__task_${t.id}.Wait(${TLE_MS})) {
                __tle_${t.id} = true;
            } else if (__task_${t.id}.IsFaulted) {
                __ex_${t.id} = __task_${t.id}.Exception?.InnerException ?? __task_${t.id}.Exception;
            }
            if (__tle_${t.id}) {
                __results.Add("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"tle\\",\\"actual\\":\\"Time Limit Exceeded\\"}");
            } else if (__ex_${t.id} != null) {
                var __msg_${t.id} = __ex_${t.id}.Message.Replace("\\"", "'");
                __results.Add("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"error\\",\\"actual\\":\\"" + __msg_${t.id} + "\\"}");\
            } else {
                var __expected_${t.id} = ${expectedLiteral};
                bool __ok_${t.id} = __Compare(__JsonVal(__actual_${t.id}), __JsonVal((object)__expected_${t.id}), ${unorderedLiteral}, ${toleranceLiteral});
                __results.Add("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"" + (__ok_${t.id} ? "success" : "fail") +
                    "\\",\\"actual\\":" + __Trunc(__JsonVal(__actual_${t.id})) + ",\\"expected\\":" + __Trunc(__JsonVal((object)__expected_${t.id})) + "}");
            }
        }`;
    }).join('\n\n');

    return `using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;

// ##USER_CODE##

class __HarnessRunner {
    static string __JsonVal(object v) {
        if (v == null) return "null";
        if (v is bool b)   return b ? "true" : "false";
        if (v is string s) return "\\"" + s.Replace("\\\\", "\\\\\\\\").Replace("\\"", "\\\\\\"") + "\\"";
        if (v is int || v is long || v is float || v is double)
            return Convert.ToString(v, System.Globalization.CultureInfo.InvariantCulture);
        if (v is IEnumerable arr) {
            var parts = new List<string>();
            foreach (var item in arr) parts.Add(__JsonVal(item));
            return "[" + string.Join(",", parts) + "]";
        }
        return "\\"" + v.ToString().Replace("\\"", "\\\\\\"") + "\\"";
    }

    // Truncate: if the JSON string is too long, wrap in a quoted truncated string
    static string __Trunc(string s) {
        if (s.Length <= ${TRUNC_LEN}) return s;
        return "\\"" + s.Substring(0, ${TRUNC_LEN}).Replace("\\"", "'") + "...[truncated]\\"";
    }

    // Split a JSON array string into its top-level elements
    static List<string> __SplitJson(string json) {
        var parts = new List<string>();
        if (!json.StartsWith("[")) { parts.Add(json); return parts; }
        var body  = json.Substring(1, json.Length - 2);
        int depth = 0, start = 0;
        for (int i = 0; i < body.Length; i++) {
            char c = body[i];
            if (c == '[' || c == '{') depth++;
            else if (c == ']' || c == '}') depth--;
            else if (c == ',' && depth == 0) {
                parts.Add(body.Substring(start, i - start).Trim());
                start = i + 1;
            }
        }
        if (start < body.Length) parts.Add(body.Substring(start).Trim());
        return parts;
    }

    static bool __Compare(string a, string b, bool unordered, double tolerance = -1) {
        if (tolerance >= 0) {
            double av, bv;
            var ic = System.Globalization.CultureInfo.InvariantCulture;
            if (double.TryParse(a, System.Globalization.NumberStyles.Any, ic, out av) &&
                double.TryParse(b, System.Globalization.NumberStyles.Any, ic, out bv))
                return Math.Abs(av - bv) <= tolerance;
        }
        if (!unordered) return a == b;
        // Sort JSON array elements (handles multi-digit numbers correctly)
        var ae = __SplitJson(a); var be = __SplitJson(b);
        ae.Sort(StringComparer.Ordinal);
        be.Sort(StringComparer.Ordinal);
        return string.Join(",", ae) == string.Join(",", be);
    }

    static void Main() {
        var __realOut = Console.Out;
        Console.SetOut(System.IO.TextWriter.Null);   // suppress user Console.Write*

        var __sw      = Stopwatch.StartNew();
        var __results = new List<string>();
        var __methodExists = typeof(__UserCode).GetMethod("${funcName}") != null;
        if (!__methodExists) {
            for (int __i = 0; __i < ${tests.length}; __i++)
                __results.Add("{\\"id\\":\\"" + __i + "\\",\\"status\\":\\"error\\",\\"actual\\":\\"Метод '${funcName}' не найден. Убедитесь, что название функции совпадает с заданием.\\"}");
        } else {

${testCases}

        }
        __sw.Stop();
        Console.SetOut(__realOut);
        Console.WriteLine("{\\"results\\":[" + string.Join(",", __results) + "],\\"executionTimeMs\\":" + __sw.ElapsedMilliseconds + "}");
    }
}
`;
};

const prepareScript = (userCode, harnessCode) => {
    const wrapped = `public partial class __UserCode {\n${userCode}\n}`;
    return harnessCode.replace('// ##USER_CODE##', wrapped);
};

module.exports = {
    csharp: {
        image:  'mono:latest',
        runCmd: "sh -c 'cat > /tmp/prog.cs && mcs /tmp/prog.cs -out:/tmp/prog.exe 2>&1 && mono /tmp/prog.exe'",
        template,
        prepareScript,
    }
};
