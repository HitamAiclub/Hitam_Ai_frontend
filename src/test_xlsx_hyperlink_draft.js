
import * as XLSX from 'xlsx';

try {
    const wb = XLSX.utils.book_new();
    const rows = [
        ["ID", "Link"],
        ["1", { t: 's', v: "Click Me", l: { Target: "https://google.com" } }],
        ["2", "Plain Text"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Test");

    // In node we can't write file easily with client side code usually, 
    // but this is running with 'node' in terminal, so we can use writeFile if we use commonjs require.
    // But the project is using ES modules (import).
    // The previous script 'src/reproduce_export.js' used commonjs? No it used 'import' but ran with node?
    // Wait, 'src/reproduce_export.js' was:
    // "const computeAnalytics..."
    // It didn't use imports at top.

    // I will write a CommonJS script for testing in node.
} catch (e) {
    console.error(e);
}
