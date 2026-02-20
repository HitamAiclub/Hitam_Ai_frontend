
const computeAnalytics = (data, formSections, existingFields = null) => {
    // simplified version of existing logic for context
    let allFields = [];
    if (existingFields) {
        allFields = existingFields;
    } else {
        const excludedKeys = ['id', 'timestamp', 'submittedAt', 'status', 'userId', 'activityId', 'activityTitle', 'files', '_fieldMapping', 'adminNote'];
        if (data && data.length > 0) {
            data.forEach(sub => {
                Object.keys(sub).forEach(key => {
                    if (!excludedKeys.includes(key)) {
                        allFields.push({ id: key, label: key, type: 'text' });
                    }
                });
            });
        }
    }
    return { formFields: allFields };
};

const handleExport = (format, data, activityTitle, fields) => {
    const exportFormat = typeof format === 'string' ? format : 'csv';
    const dataToExport = data;

    // Mock baseAnalytics
    const baseAnalytics = { formFields: fields };
    const selectedExportColumns = fields.map(f => f.id);

    const fieldsToExport = baseAnalytics.formFields.filter(f => selectedExportColumns.includes(f.id));

    const headers = ['ID', 'Date', ...fieldsToExport.map(f => f.label), 'Admin Note', 'Status'];
    const csvRows = [headers.join(',')];

    try {
        dataToExport.forEach(sub => {
            const row = [
                sub.id,
                sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '',
                ...fieldsToExport.map(f => {
                    let val = sub[f.id];

                    if (f.type === 'file') {
                        if (Array.isArray(val)) {
                            return `"${val.map(v => (v.url || v)).join('; ')}"`;
                        } else if (val && typeof val === 'object' && val.url) {
                            if (exportFormat === 'excel') {
                                const label = (val.originalName || val.name || 'View File').replace(/"/g, '""');
                                const url = val.url.replace(/"/g, '""');
                                return `"=HYPERLINK(""${url}"", ""${label}"")"`;
                            }
                            return `"${val.url}"`;
                        } else if (val && typeof val === 'string' && val.startsWith('http')) {
                            if (exportFormat === 'excel') {
                                return `"=HYPERLINK(""${val.replace(/"/g, '""')}"", ""View File"")"`;
                            }
                            return `"${val}"`;
                        } else {
                            return `"${val || ''}"`;
                        }
                    }

                    return `"${String(Array.isArray(val) ? val.join('; ') : (val || '')).replace(/"/g, '""')}"`;
                }),
                `"${(sub.adminNote || '').replace(/"/g, '""')}"`,
                sub.status || 'pending'
            ];
            csvRows.push(row.join(','));
        });

        console.log("CSV Generation Successful");
        console.log("Rows generated:", csvRows.length);
        console.log("Sample Row:", csvRows[1]);

        // return the content for inspection
        return csvRows.join('\n');

    } catch (error) {
        console.error("Export Failed:", error);
        return null;
    }
};

// Test Data
const mockData = [
    {
        id: "sub1",
        submittedAt: new Date().toISOString(),
        name: "Test User",
        email: "test@example.com",
        resume: { url: "http://example.com/resume.pdf", originalName: "My Resume.pdf" },
        status: "approved"
    }
];

const mockFields = [
    { id: "name", label: "Name", type: "text" },
    { id: "email", label: "Email", type: "email" },
    { id: "resume", label: "Resume", type: "file" }
];

console.log("Testing Standard CSV Export:");
handleExport('csv', mockData, "Test Activity", mockFields);

console.log("\nTesting Excel Format Export:");
const excelOutput = handleExport('excel', mockData, "Test Activity", mockFields);
console.log("Excel Output:\n", excelOutput);
