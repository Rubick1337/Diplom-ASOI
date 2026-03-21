
const TLE_SEC   = 5;
const TRUNC_LEN = 2000;

const template = (funcName, tests, paramTypes = []) => {
    const toCppLiteral = (v) => {
        if (typeof v === 'string')  return `std::string("${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (Array.isArray(v))       return `{${v.map(toCppLiteral).join(', ')}}`;
        return String(v);
    };

    const testBlocks = tests.map((t) => {
        const args = t.args.map((a, idx) => {
            const lit = toCppLiteral(a);
            if (typeof a === 'number') {
                const pt = paramTypes[idx] || '';
                if (pt === 'int')   return `static_cast<int>(${lit})`;
                if (pt === 'float') return `static_cast<double>(${lit})`;
            }
            return lit;
        }).join(', ');

        const expected     = toCppLiteral(t.expected);
        const needsSort    = !!t.unordered && Array.isArray(t.expected);
        const hasTolerance = t.tolerance != null;

        return `    // test id=${t.id}
    if (sigsetjmp(__tle_env, 1) == 0) {
        alarm(${TLE_SEC});
        try {
            auto __actual   = ${funcName}(${args});
            auto __expected = ${expected};
            alarm(0);
${needsSort ? `            std::sort(__actual.begin(), __actual.end());
            std::sort(__expected.begin(), __expected.end());
` : ''}\
${hasTolerance
    ? `            bool __ok = std::abs((double)__actual - (double)__expected) <= ${t.tolerance};
            std::string __status = __ok ? "success" : "fail";`
    : `            std::string __status = (__toJson(__actual) == __toJson(__expected)) ? "success" : "fail";`}
            __results.push_back("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"" + __status + "\\",\\"actual\\":" + __trunc(__toJson(__actual)) + ",\\"expected\\":" + __trunc(__toJson(__expected)) + "}");
        } catch (const std::exception& e) {
            alarm(0);
            __results.push_back("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"error\\",\\"actual\\":\\"" + __escStr(std::string(e.what())) + "\\"}");\
        } catch (...) {
            alarm(0);
            __results.push_back("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"error\\",\\"actual\\":\\"Unknown runtime error\\"}");
        }
    } else {
        alarm(0);
        __results.push_back("{\\"id\\":\\"${t.id}\\",\\"status\\":\\"tle\\",\\"actual\\":\\"Time Limit Exceeded\\"}");
    }`;
    }).join('\n\n');

    return `
#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <utility>
#include <algorithm>
#include <sstream>
#include <cmath>
#include <cstdio>
#include <csetjmp>
#include <csignal>
#include <stdexcept>
#include <chrono>

// ── TLE ─────────────────────────────────────────────────────────────────────
static sigjmp_buf __tle_env;
static void __tle_handler(int) { siglongjmp(__tle_env, 1); }

// ── output truncation ────────────────────────────────────────────────────────
static std::string __trunc(const std::string& s) {
    if (s.size() <= ${TRUNC_LEN}) return s;
    return "\\"" + s.substr(0, ${TRUNC_LEN}) + "...[truncated]\\"";
}

// ── JSON helpers ─────────────────────────────────────────────────────────────
template<typename T>
std::string __toJson(T v) { return std::to_string(v); }

std::string __toJson(std::string v) {
    std::string r = "\\"";
    for (char c : v) {
        if (c == '"') r += "\\\\\\""; else if (c == '\\\\') r += "\\\\\\\\"; else r += c;
    }
    return r + "\\"";
}
std::string __toJson(bool v) { return v ? "true" : "false"; }

// char → JSON string (avoids std::to_string returning ASCII code)
std::string __toJson(char v) {
    if (v == '"')  return "\\"\\\\\\"\\"";
    if (v == '\\\\') return "\\"\\\\\\\\\\"\\"";
    return std::string("\\"") + v + "\\"";
}

// double/float → integer string when no fractional part (5.0 → "5")
std::string __toJson(double v) {
    long long vi = (long long)v;
    if ((double)vi == v) return std::to_string(vi);
    std::string s = std::to_string(v);
    s.erase(s.find_last_not_of('0') + 1, std::string::npos);
    if (!s.empty() && s.back() == '.') s.pop_back();
    return s;
}
std::string __toJson(float v) { return __toJson((double)v); }

template<typename T>
std::string __toJson(std::vector<T> v) {
    std::string r = "[";
    for (size_t i = 0; i < v.size(); ++i) { if (i) r += ","; r += __toJson(v[i]); }
    return r + "]";
}

template<typename A, typename B>
std::string __toJson(std::pair<A, B> p) {
    return "[" + __toJson(p.first) + "," + __toJson(p.second) + "]";
}

template<typename K, typename V>
std::string __toJson(std::map<K, V> m) {
    std::string r = "{";
    bool first = true;
    for (auto& kv : m) {
        if (!first) r += ","; first = false;
        // keys serialized as JSON strings regardless of type
        std::string ks = __toJson(kv.first);
        if (ks.empty() || ks[0] != '"') ks = "\\"" + ks + "\\"";
        r += ks + ":" + __toJson(kv.second);
    }
    return r + "}";
}

template<typename T>
std::string __toJson(std::set<T> s) {
    std::string r = "[";
    bool first = true;
    for (auto& v : s) { if (!first) r += ","; first = false; r += __toJson(v); }
    return r + "]";
}

std::string __escStr(const std::string& s) {
    std::string r;
    for (char c : s) {
        if (c == '"') r += "\\\\\\""; else if (c == '\\\\') r += "\\\\\\\\"; else if (c == '\\n') r += "\\\\n"; else r += c;
    }
    return r;
}

// ── user function ────────────────────────────────────────────
// ── harness ──────────────────────────────────────────────────
int main() {
    freopen("/dev/null", "r", stdin);   // prevent cin blocking
    signal(SIGALRM, __tle_handler);

    // Redirect cout to sink; restore after tests to write JSON
    std::streambuf* __origBuf = std::cout.rdbuf();
    std::ostringstream __sink;
    std::cout.rdbuf(__sink.rdbuf());

    auto __start = std::chrono::high_resolution_clock::now();
    std::vector<std::string> __results;

${testBlocks}

    auto __end = std::chrono::high_resolution_clock::now();
    auto __ms  = std::chrono::duration_cast<std::chrono::milliseconds>(__end - __start).count();

    std::cout.rdbuf(__origBuf);
    std::cout << "{\\"results\\":[";
    for (size_t i = 0; i < __results.size(); ++i) {
        if (i) std::cout << ",";
        std::cout << __results[i];
    }
    std::cout << "],\\"executionTimeMs\\":" << __ms << "}" << std::endl;
    return 0;
}
`;
};

const prepareScript = (userCode, harnessCode) => {
    const codeWithDirective = `#line 1 "solution"\n${userCode}`;
    return harnessCode.replace('// ── user function ────────────────────────────────────────────', codeWithDirective);
};

module.exports = {
    cpp: {
        image:  'gcc:latest',
        runCmd: "sh -c 'cat > /tmp/code.cpp && g++ -std=c++17 -O2 /tmp/code.cpp -o /tmp/exe 2>&1 && /tmp/exe'",
        template,
        prepareScript,
    }
};
