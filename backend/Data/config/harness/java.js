
const TLE_MS    = 5000;
const TRUNC_LEN = 2000;

const { toJavaLiteral, toJavaStringLiteral } = require('./helpers');

const template = (funcName, tests, paramTypes = []) => {
    const dotIdx     = funcName.indexOf('.');
    const className  = dotIdx >= 0 ? funcName.slice(0, dotIdx) : 'Solution';
    const methodName = dotIdx >= 0 ? funcName.slice(dotIdx + 1) : funcName;

    const testCases = tests.map(t => {
        const args            = t.args.map((a, idx) => toJavaLiteral(a, paramTypes[idx] || '')).join(', ');
        const expectedJsonLit = toJavaStringLiteral(JSON.stringify(t.expected));
        const unorderedLit    = t.unordered        ? 'true'              : 'false';
        const toleranceLit    = t.tolerance != null ? String(t.tolerance) : '-1';
        return `        // test id=${t.id}
        __blk_${t.id}: {
            try {
                java.util.concurrent.Future<Object> __fut_${t.id} =
                    __exec.submit(() -> (Object) new ${className}().${methodName}(${args}));
                Object __actual_${t.id};
                try {
                    __actual_${t.id} = __fut_${t.id}.get(${TLE_MS}, java.util.concurrent.TimeUnit.MILLISECONDS);
                } catch (java.util.concurrent.TimeoutException __ignored_${t.id}) {
                    __fut_${t.id}.cancel(true);
                    __results.add("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"tle\\",\\"actual\\":\\"Time Limit Exceeded\\"}");
                    break __blk_${t.id};
                }
                String __raw_aj_${t.id}    = __toJson(__actual_${t.id});
                String __raw_ej_${t.id}    = ${expectedJsonLit};
                boolean __ok_${t.id}       = __compare(__raw_aj_${t.id}, __raw_ej_${t.id}, ${unorderedLit}, ${toleranceLit});
                __results.add("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"" + (__ok_${t.id} ? "success" : "fail") +
                    "\\",\\"actual\\":" + __trunc(__raw_aj_${t.id}) + ",\\"expected\\":" + __trunc(__raw_ej_${t.id}) + "}");
            } catch (java.util.concurrent.ExecutionException __ee_${t.id}) {
                Throwable __c_${t.id} = __ee_${t.id}.getCause() != null ? __ee_${t.id}.getCause() : __ee_${t.id};
                String __em_${t.id}   = __c_${t.id}.getMessage() != null
                    ? __c_${t.id}.getMessage().replace("\\"", "'") : __c_${t.id}.getClass().getSimpleName();
                __results.add("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"error\\",\\"actual\\":\\"" + __em_${t.id} + "\\"}");\
            } catch (Exception __e_${t.id}) {
                String __em_${t.id} = __e_${t.id}.getMessage() != null
                    ? __e_${t.id}.getMessage().replace("\\"", "'") : "Exception";
                __results.add("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"error\\",\\"actual\\":\\"" + __em_${t.id} + "\\"}");\
            }
        }`;
    }).join('\n\n');

    return `// ##USER_CODE##

public class Main {
    // ── JSON serializers ─────────────────────────────────────────
    static String __toJson(int v)     { return String.valueOf(v); }
    static String __toJson(long v)    { return String.valueOf(v); }
    static String __toJson(boolean v) { return String.valueOf(v); }
    static String __toJson(char v)    { return "\\"" + v + "\\""; }

    // Normalize: 5.0 → "5"  (String.valueOf(5.0) gives "5.0")
    static String __toJson(double v) {
        long lv = (long) v;
        if ((double) lv == v) return String.valueOf(lv);
        return String.valueOf(v);
    }
    static String __toJson(float v) { return __toJson((double) v); }

    static String __toJson(String v) {
        if (v == null) return "null";
        return "\\"" + v.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") + "\\"";
    }
    static String __toJson(int[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(v[i]); }
        return sb.append("]").toString();
    }
    static String __toJson(long[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(v[i]); }
        return sb.append("]").toString();
    }
    static String __toJson(double[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(__toJson(v[i])); }
        return sb.append("]").toString();
    }
    static String __toJson(boolean[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(v[i]); }
        return sb.append("]").toString();
    }
    static String __toJson(char[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(__toJson(v[i])); }
        return sb.append("]").toString();
    }
    static String __toJson(String[] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(__toJson(v[i])); }
        return sb.append("]").toString();
    }
    static String __toJson(int[][] v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) { if (i > 0) sb.append(","); sb.append(__toJson(v[i])); }
        return sb.append("]").toString();
    }
    static String __toJson(java.util.List<?> v) {
        if (v == null) return "null";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < v.size(); i++) { if (i > 0) sb.append(","); sb.append(__toJson(v.get(i))); }
        return sb.append("]").toString();
    }
    static String __toJson(Object v) {
        if (v == null) return "null";
        if (v instanceof Boolean)   return v.toString();
        if (v instanceof Double || v instanceof Float) return __toJson(((Number) v).doubleValue());
        if (v instanceof Number)    return v.toString();
        if (v instanceof String)    return __toJson((String) v);
        if (v instanceof int[])     return __toJson((int[]) v);
        if (v instanceof long[])    return __toJson((long[]) v);
        if (v instanceof double[])  return __toJson((double[]) v);
        if (v instanceof boolean[]) return __toJson((boolean[]) v);
        if (v instanceof char[])    return __toJson((char[]) v);
        if (v instanceof String[])  return __toJson((String[]) v);
        if (v instanceof int[][])   return __toJson((int[][]) v);
        if (v instanceof java.util.List) return __toJson((java.util.List<?>) v);
        return "\\"" + v.toString().replace("\\"", "\\\\\\"") + "\\"";
    }

    // ── Output truncation ────────────────────────────────────────
    // Returns the JSON string as-is if short; wraps in a JSON string if truncated
    static String __trunc(String s) {
        if (s.length() <= ${TRUNC_LEN}) return s;
        return "\\"" + s.substring(0, ${TRUNC_LEN}).replace("\\"", "'") + "...[truncated]\\"";
    }

    // ── JSON array element splitter ──────────────────────────────
    static java.util.List<String> __splitJson(String json) {
        java.util.List<String> parts = new java.util.ArrayList<>();
        if (!json.startsWith("[")) { parts.add(json); return parts; }
        String body = json.substring(1, json.length() - 1);
        int depth = 0, start = 0;
        for (int i = 0; i < body.length(); i++) {
            char c = body.charAt(i);
            if (c == '[' || c == '{') depth++;
            else if (c == ']' || c == '}') depth--;
            else if (c == ',' && depth == 0) {
                parts.add(body.substring(start, i).trim());
                start = i + 1;
            }
        }
        if (start < body.length()) parts.add(body.substring(start).trim());
        return parts;
    }

    static boolean __compare(String a, String b, boolean unordered, double tolerance) {
        if (tolerance >= 0) {
            try {
                double av = Double.parseDouble(a), bv = Double.parseDouble(b);
                return Math.abs(av - bv) <= tolerance;
            } catch (NumberFormatException ignored) {}
        }
        if (!unordered) return a.equals(b);
        java.util.List<String> ae = __splitJson(a), be = __splitJson(b);
        java.util.Collections.sort(ae);
        java.util.Collections.sort(be);
        return ae.equals(be);
    }

    static final java.util.concurrent.ExecutorService __exec =
        java.util.concurrent.Executors.newCachedThreadPool();

    public static void main(String[] args) throws Exception {
        java.io.PrintStream __realOut = System.out;
        System.setOut(new java.io.PrintStream(java.io.OutputStream.nullOutputStream()));
        System.setIn(java.io.InputStream.nullInputStream());

        long __start = System.currentTimeMillis();
        java.util.List<String> __results = new java.util.ArrayList<>();

${testCases}

        __exec.shutdownNow();
        long __end = System.currentTimeMillis();
        System.setOut(__realOut);
        __realOut.println("{\\"results\\":[" + String.join(",", __results) + "],\\"executionTimeMs\\":" + (__end - __start) + "}");
    }
}
`;
};

const prepareScript = (userCode, harnessCode) => {
    const cleanCode = userCode.replace(/\bpublic\s+(class|interface|enum)\b/g, '$1');
    return harnessCode.replace('// ##USER_CODE##', cleanCode);
};

module.exports = {
    java: {
        image:  'openjdk:17-slim',
        runCmd: "sh -c 'cat > /tmp/Main.java && cd /tmp && javac Main.java 2>&1 && java -cp /tmp Main'",
        template,
        prepareScript,
    }
};
