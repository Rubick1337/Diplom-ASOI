
function toCSharpLiteral(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v.toString().toLowerCase();
    if (typeof v === 'number') return v.toString();
    if (typeof v === 'string') return '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    if (Array.isArray(v)) {
        if (v.length === 0) return 'new object[0]';
        return 'new object[] { ' + v.map(toCSharpLiteral).join(', ') + ' }';
    }
    return '"' + String(v) + '"';
}

function toPhpLiteral(v) {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return v.toString();
    if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    if (Array.isArray(v)) return '[' + v.map(toPhpLiteral).join(', ') + ']';
    return "'" + String(v) + "'";
}

function toJavaLiteral(v, type = '') {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return String(v);
    if (typeof v === 'number') {
        if (type === 'long')                    return v + 'L';
        if (type === 'double' || type === 'float') return String(v) + (Number.isInteger(v) ? '.0' : '');
        return String(Math.trunc(v));
    }
    if (typeof v === 'string') return '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    if (Array.isArray(v)) {
        if (v.length === 0) {
            if (type === 'int[]')    return 'new int[0]';
            if (type === 'long[]')   return 'new long[0]';
            if (type === 'double[]') return 'new double[0]';
            if (type === 'String[]') return 'new String[0]';
            if (type.startsWith('List')) return 'new java.util.ArrayList<>()';
            return 'new Object[0]';
        }
        const inner = v.map(x => toJavaLiteral(x, '')).join(', ');
        if (type === 'int[]'    || (!type && v.every(x => typeof x === 'number'))) return `new int[]{${inner}}`;
        if (type === 'long[]')   return `new long[]{${v.map(x => toJavaLiteral(x, 'long')).join(', ')}}`;
        if (type === 'double[]' || type === 'float[]') return `new double[]{${v.map(x => toJavaLiteral(x, 'double')).join(', ')}}`;
        if (type === 'String[]' || (!type && v.every(x => typeof x === 'string'))) return `new String[]{${inner}}`;
        if (type === 'int[][]') {
            const rows = v.map(r => Array.isArray(r) ? `new int[]{${r.map(x => String(Math.trunc(x))).join(', ')}}` : 'new int[0]');
            return `new int[][]{${rows.join(', ')}}`;
        }
        if (type.startsWith('List')) return `java.util.Arrays.asList(${inner})`;
        if (Array.isArray(v[0])) {
            const rows = v.map(r => Array.isArray(r) ? `new int[]{${r.map(x => String(Math.trunc(x))).join(', ')}}` : 'new int[0]');
            return `new int[][]{${rows.join(', ')}}`;
        }
        if (v.every(x => typeof x === 'number')) return `new int[]{${inner}}`;
        if (v.every(x => typeof x === 'string')) return `new String[]{${inner}}`;
        return `new Object[]{${inner}}`;
    }
    return '"' + String(v) + '"';
}

// Produce a Java string literal from a plain JS string (for embedding in generated code)
function toJavaStringLiteral(str) {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

module.exports = { toCSharpLiteral, toPhpLiteral, toJavaLiteral, toJavaStringLiteral };
