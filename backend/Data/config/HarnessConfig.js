module.exports = {
    javascript: {
        image: 'node:18-alpine',
        runCmd: 'node -',
        template: (funcName, tests) => `
const tests = ${JSON.stringify(tests)};
const startTime = performance.now();
let results = [];
try {
    results = tests.map(t => {
        try {
            const actual = typeof ${funcName} === 'function' ? ${funcName}(...t.args) : undefined;
            return { 
                id: t.id, 
                status: JSON.stringify(actual) === JSON.stringify(t.expected) ? 'success' : 'fail', 
                actual, 
                expected: t.expected 
            };
        } catch (e) {
            return { id: t.id, status: 'error', actual: e.stack || e.message };
        }
    });
} finally {
    const endTime = performance.now();
    console.log(JSON.stringify({
        results,
        executionTimeMs: Math.round(endTime - startTime)
    }));
}
        `
    },

    typescript: {
        image: 'node:18-alpine',
        runCmd: 'node -e "require(\'ts-node/register\'); require(\'fs\').readFileSync(0).toString();"',
        template: (funcName, tests) => `
const tests: any[] = ${JSON.stringify(tests)};
const { performance } = require('perf_hooks');
const startTime = performance.now();
let results: any[] = [];
try {
    results = tests.map(t => {
        try {
            // @ts-ignore
            const actual = ${funcName}(...t.args);
            return { 
                id: t.id, 
                status: JSON.stringify(actual) === JSON.stringify(t.expected) ? 'success' : 'fail', 
                actual, 
                expected: t.expected 
            };
        } catch (e: any) {
            return { id: t.id, status: 'error', actual: e.stack || e.message };
        }
    });
} finally {
    const endTime = performance.now();
    console.log(JSON.stringify({
        results,
        executionTimeMs: Math.round(endTime - startTime)
    }));
}
        `
    },

    python: {
        image: 'python:3.10-slim',
        runCmd: 'python3 -',
        template: (funcName, tests) => `
import json
import traceback
import time

tests = ${JSON.stringify(tests)}
results = []
start_time = time.perf_counter()

try:
    for t in tests:
        try:
            actual = globals()['${funcName}'](*t['args'])
            status = 'success' if json.dumps(actual) == json.dumps(t['expected']) else 'fail'
            results.append({
                'id': t['id'], 
                'status': status, 
                'actual': actual, 
                'expected': t['expected']
            })
        except Exception:
            results.append({
                'id': t['id'], 
                'status': 'error', 
                'actual': traceback.format_exc()
            })
finally:
    end_time = time.perf_counter()
    execution_time_ms = int((end_time - start_time) * 1000)
    print(json.dumps({
        'results': results,
        'executionTimeMs': execution_time_ms
    }))
        `
    },

    cpp: {
        image: 'gcc:latest',
        runCmd: "sh -c 'cat > /tmp/code.cpp && g++ -std=c++17 /tmp/code.cpp -o /tmp/exe && /tmp/exe'",
        template: (funcName, tests) => {
            const formattedTests = tests.map(t => {
                const expected = typeof t.expected === 'string' ? `std::string("${t.expected}")` : t.expected;
                const args = t.args.map(arg => typeof arg === 'string' ? `std::string("${arg}")` : arg).join(', ');
                return { ...t, cppExpected: expected, cppArgs: args };
            });

            return `
#include <iostream>
#include <string>
#include <vector>
#include <stdexcept>
#include <chrono>

int main() {
    auto start = std::chrono::high_resolution_clock::now();
    std::vector<std::string> results;
    
    try {
        ${formattedTests.map((t, i) => `
        {
            try {
                auto result = ${funcName}(${t.cppArgs});
                auto expected = ${t.cppExpected};
                std::string status = (result == expected) ? "success" : "fail";
                results.push_back("{\\"id\\": \\"${t.id}\\", \\"status\\": \\"" + status + "\\", \\"actual\\": \\"" + std::to_string(result) + "\\", \\"expected\\": \\"${t.expected}\\"}");
            } catch (const std::exception& e) {
                results.push_back("{\\"id\\": \\"${t.id}\\", \\"status\\": \\"error\\", \\"actual\\": \\"Runtime Error: " + std::string(e.what()) + "\\"}");
            } catch (...) {
                results.push_back("{\\"id\\": \\"${t.id}\\", \\"status\\": \\"error\\", \\"actual\\": \\"Unknown Fatal Error\\"}");
            }
        }`).join('\n')}
    } catch (...) {}

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

    std::cout << "{\\"results\\": [";
    for (size_t i = 0; i < results.size(); ++i) {
        std::cout << results[i] << (i < results.size() - 1 ? "," : "");
    }
    std::cout << "], \\"executionTimeMs\\": " << duration << "}" << std::endl;
    return 0;
}
            `;
        }
    }
};