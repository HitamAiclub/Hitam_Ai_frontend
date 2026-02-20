
const XLSX = require('xlsx');

try {
    console.log("Creating workbook...");
    const wb = XLSX.utils.book_new();
    const rows = [
        ["ID", "Link"],
        ["1", { t: 's', v: "Click Me", l: { Target: "https://google.com" } }],
        ["2", "Plain Text"]
    ];
    console.log("Converting to sheet...");
    const ws = XLSX.utils.aoa_to_sheet(rows);

    console.log("Cell A2:", ws['A2']);
    console.log("Cell B2:", ws['B2']); // Should have .l property

    XLSX.utils.book_append_sheet(wb, ws, "Test");

    console.log("Writing file...");
    XLSX.writeFile(wb, "test_hyperlink.xlsx");
    console.log("Done. Check test_hyperlink.xlsx");
} catch (e) {
    console.error("Error:", e);
}
