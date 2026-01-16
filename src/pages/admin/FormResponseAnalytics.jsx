import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, ArrowLeft, Filter, Table, Save, Search, Eye, ChevronDown } from 'lucide-react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Helper: Compute analytics from data (Pure function)
const computeAnalytics = (data, formSections, existingFields = null) => {
    if (!data) return { totalSubmissions: 0, fieldStats: {}, chartData: {}, formFields: [] };

    // Helper to sanitize labels
    const sanitizeKey = (label) => {
        return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    };

    // 1. Determine Fields
    // 1. Determine Fields
    let allFields = [];
    const seenFieldIds = new Set(); // Stores LOWERCASE IDs to prevent case duplicates

    if (existingFields) {
        allFields = existingFields;
        existingFields.forEach(f => seenFieldIds.add(f.id.toLowerCase()));
    } else {
        // Discovery Mode (for Base Analytics)
        if (formSections && Array.isArray(formSections)) {
            formSections.forEach(section => {
                if (section.fields) {
                    section.fields.forEach(field => {
                        if (!['label', 'image', 'link', 'paragraph', 'header'].includes(field.type)) {
                            let effectiveId = field.id || field.label;
                            // Check if effectiveId (or sanitized) exists in data
                            const hasDataWithId = data.some(sub => sub[effectiveId] !== undefined);
                            if (!hasDataWithId && field.label) {
                                const sanitized = sanitizeKey(field.label);
                                if (data.some(sub => sub[sanitized] !== undefined)) effectiveId = sanitized;
                            }

                            const lowerId = effectiveId.toLowerCase();
                            if (!seenFieldIds.has(lowerId)) {
                                allFields.push({ ...field, id: effectiveId });
                                seenFieldIds.add(lowerId);
                                if (field.label) {
                                    seenFieldIds.add(field.label.toLowerCase());
                                    const sanitized = sanitizeKey(field.label).toLowerCase();
                                    seenFieldIds.add(sanitized);
                                }
                            }
                        }
                    });
                }
            });
        }

        const excludedKeys = ['id', 'timestamp', 'submittedAt', 'status', 'userId', 'activityId', 'activityTitle', 'files', '_fieldMapping', 'adminNote'];
        data.forEach(sub => {
            Object.keys(sub).forEach(key => {
                if (!excludedKeys.includes(key)) {
                    const lowerKey = key.toLowerCase();
                    if (!seenFieldIds.has(lowerKey)) {
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (str) => str.toUpperCase()).trim();
                        allFields.push({ id: key, label: label, type: 'text', isDynamic: true });
                        seenFieldIds.add(lowerKey);
                    }
                }
            });
        });
    }

    // 2. Compute Stats
    const fieldStats = {};
    const chartData = {};

    allFields.forEach(field => {
        const stats = {
            label: field.label,
            type: field.type,
            filledResponses: 0,
            totalResponses: 0,
            distribution: {},
            ratings: [],
            average: null
        };

        data.forEach(sub => {
            const val = sub[field.id];
            stats.totalResponses++;
            if (val !== undefined && val !== null && val !== '') {
                stats.filledResponses++;
                if (field.type !== 'file') {
                    const vals = Array.isArray(val) ? val : [String(val)];
                    vals.forEach(v => {
                        const key = v.length > 30 ? v.substring(0, 30) + '...' : v;
                        stats.distribution[key] = (stats.distribution[key] || 0) + 1;
                    });
                }
                if (['rating', 'number'].includes(field.type)) {
                    const num = parseFloat(val);
                    if (!isNaN(num)) stats.ratings.push(num);
                }
            }
        });

        if (stats.ratings.length) {
            stats.average = (stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length).toFixed(2);
        }

        if (Object.keys(stats.distribution).length > 0) {
            let entries = Object.entries(stats.distribution)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);

            if (entries.length > 10) {
                const top10 = entries.slice(0, 10);
                const othersCount = entries.slice(10).reduce((sum, item) => sum + item.value, 0);
                entries = [...top10, { name: `Others (${entries.length - 10} more)`, value: othersCount }];
            }

            chartData[field.id] = entries.map(entry => ({
                ...entry,
                percentage: ((entry.value / stats.filledResponses) * 100).toFixed(1)
            }));
        }
        fieldStats[field.id] = stats;
    });

    return {
        totalSubmissions: data.length,
        fieldStats,
        chartData,
        formFields: allFields
    };
};

const FormResponseAnalytics = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();

    // Data State
    const [activity, setActivity] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ANALYTICS STATE
    const [baseAnalytics, setBaseAnalytics] = useState({
        totalSubmissions: 0,
        fieldStats: {},
        chartData: {},
        formFields: []
    });

    // UI State
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'responses'
    const [savingNote, setSavingNote] = useState(null); // submission ID being saved
    const [selectedSubmission, setSelectedSubmission] = useState(null); // For modal view

    // Filter State
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Export State
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [selectedExportColumns, setSelectedExportColumns] = useState([]);

    // Initialize export columns when fields change
    useEffect(() => {
        if (baseAnalytics.formFields.length > 0) {
            setSelectedExportColumns(baseAnalytics.formFields.map(f => f.id));
        }
    }, [baseAnalytics.formFields]);

    const toggleExportColumn = (fieldId) => {
        setSelectedExportColumns(prev => {
            if (prev.includes(fieldId)) {
                return prev.filter(id => id !== fieldId);
            } else {
                return [...prev, fieldId];
            }
        });
    };

    // Helper: Normalize keys in submissions to match schema
    const normalizeSubmissions = (data, formSections) => {
        if (!data || !formSections) return data;

        // map of potential keys -> canonical key
        const keyMap = {};

        // Helper to sanitize labels (same as in computeAnalytics)
        const sanitizeKey = (label) => {
            return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        };

        formSections.forEach(section => {
            if (section.fields) {
                section.fields.forEach(field => {
                    if (!['label', 'image', 'link', 'paragraph', 'header'].includes(field.type)) {
                        const canonical = field.id;
                        // Add alternatives to the map
                        keyMap[field.id] = canonical;
                        if (field.label) {
                            keyMap[field.label] = canonical;
                            keyMap[sanitizeKey(field.label)] = canonical;
                        }
                    }
                });
            }
        });

        return data.map(sub => {
            const newSub = { ...sub };
            Object.entries(keyMap).forEach(([altKey, canonicalKey]) => {
                // If canonical is missing or empty, but alternative exists, copy it
                if ((newSub[canonicalKey] === undefined || newSub[canonicalKey] === "") &&
                    newSub[altKey] !== undefined && newSub[altKey] !== "") {
                    newSub[canonicalKey] = newSub[altKey];
                }
            });
            return newSub;
        });
    };

    useEffect(() => {
        fetchData();
    }, [activityId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Activity Metadata
            const activityDoc = await getDoc(doc(db, 'upcomingActivities', activityId));
            if (!activityDoc.exists()) {
                throw new Error("Activity not found");
            }
            const activityData = { id: activityDoc.id, ...activityDoc.data() };
            setActivity(activityData);

            // 2. Fetch Submissions (Registrations)
            const submissionsSnapshot = await getDocs(
                collection(db, 'upcomingActivities', activityId, 'registrations')
            );

            let submissionsData = submissionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // If empty, falling back to global 'allRegistrations' (legacy support)
            if (submissionsData.length === 0) {
                // In real app, query 'allRegistrations' where activityId == id
            }

            // Normalize Data Keys (Merge Legacy/Alternates)
            const normalizedData = normalizeSubmissions(submissionsData, activityData.formSections);

            setSubmissions(normalizedData);

            // COMPUTE INITIAL ANALYTICS
            const base = computeAnalytics(normalizedData, activityData.formSections);
            setBaseAnalytics(base);

        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Derived Analytics based on Filters
    const getFilteredSubmissions = useMemo(() => {
        return submissions.filter(sub => {
            // 1. Global Search
            const searchStr = searchTerm.toLowerCase();
            const matchesSearch = searchStr === '' || Object.values(sub).some(val =>
                String(val).toLowerCase().includes(searchStr)
            );
            if (!matchesSearch) return false;

            // 2. Column Filters
            // filters = { [fieldId]: 'value' }
            for (const [key, filterVal] of Object.entries(filters)) {
                if (!filterVal || filterVal === '') continue; // Skip empty filters (All)

                const subVal = String(sub[key] || '');
                const subValLower = subVal.toLowerCase();
                const filterValLower = filterVal.toLowerCase();

                // Determine match type (Exact for categorical, fuzzy for text)
                const field = baseAnalytics.formFields.find(f => f.id === key);
                const stats = baseAnalytics.fieldStats[key];

                const isCategorical = field && (
                    ['select', 'radio', 'checkbox', 'payment_status'].includes(field.type) ||
                    (stats && Object.keys(stats.distribution || {}).length > 0 && Object.keys(stats.distribution || {}).length < 15)
                );

                if (isCategorical) {
                    // Exact match for dropdowns (Case Sensitive)
                    if (subVal !== filterVal) return false;
                } else {
                    // Fuzzy match for text inputs
                    if (!subValLower.includes(filterValLower)) return false;
                }
            }

            return true;
        });
    }, [submissions, searchTerm, filters, baseAnalytics]);

    // Compute analytics for the filtered subset
    // We pass 'baseAnalytics.formFields' to ensure the columns/charts structure matches the full view
    const filteredAnalytics = useMemo(() => {
        if (getFilteredSubmissions.length === 0) {
            return { totalSubmissions: 0, fieldStats: {}, chartData: {}, formFields: baseAnalytics.formFields };
        }
        return computeAnalytics(
            getFilteredSubmissions,
            null,
            baseAnalytics.formFields
        );
    }, [getFilteredSubmissions, baseAnalytics.formFields]);


    // --- Actions ---

    const handleUpdateNote = async (submissionId, newNote) => {
        setSavingNote(submissionId);
        try {
            // Update in subcollection
            const ref = doc(db, 'upcomingActivities', activityId, 'registrations', submissionId);
            await updateDoc(ref, { adminNote: newNote });

            // Update local state
            setSubmissions(prev => prev.map(sub =>
                sub.id === submissionId ? { ...sub, adminNote: newNote } : sub
            ));
        } catch (err) {
            console.error("Failed to update note", err);
            alert("Failed to save note");
        } finally {
            setSavingNote(null);
        }
    };

    const handleExport = () => {
        const dataToExport = getFilteredSubmissions;
        if (!dataToExport.length) return alert("No data to export");

        // Filter fields based on selection
        const fieldsToExport = baseAnalytics.formFields.filter(f => selectedExportColumns.includes(f.id));

        const headers = ['ID', 'Date', ...fieldsToExport.map(f => f.label), 'Admin Note', 'Status'];
        const csvRows = [headers.join(',')];

        dataToExport.forEach(sub => {
            const row = [
                sub.id,
                sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '',
                ...fieldsToExport.map(f => {
                    const val = sub[f.id];
                    return `"${String(Array.isArray(val) ? val.join('; ') : (val || '')).replace(/"/g, '""')}"`;
                }),
                `"${(sub.adminNote || '').replace(/"/g, '""')}"`,
                sub.status || 'pending'
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activity.title}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
    if (!activity) return <div className="p-8">Activity not found</div>;

    // Use filteredAnalytics for Summary View
    // Use baseAnalytics for Table Headers and Filter Options (to keep choices available)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate('/admin/submissions')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Forms
                </Button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{activity.title}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Save className="w-4 h-4" /> {baseAnalytics.totalSubmissions} Responses
                            </span>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                {activity.isPaid ? 'Paid Event' : 'Free Event'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExport} variant="outline" className="gap-2">
                            <Download className="w-4 h-4" /> Export CSV
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'summary'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <PieChart className="w-4 h-4" /> Summary
                        </div>
                        {activeTab === 'summary' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('responses')}
                        className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'responses'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Table className="w-4 h-4" /> Individual Responses
                        </div>
                        {activeTab === 'responses' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'summary' ? (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Filter Banner */}
                            {Object.keys(filters).length > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                    <Filter className="w-4 h-4" />
                                    <span>
                                        Showing analytics for <strong>{filteredAnalytics.totalSubmissions}</strong> of <strong>{baseAnalytics.totalSubmissions}</strong> filtered responses.
                                    </span>
                                    <button
                                        onClick={() => setFilters({})}
                                        className="ml-auto text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}

                            {/* Summary View Reuse - Using FILTERED analytics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredAnalytics.formFields.map(field => {
                                    const data = filteredAnalytics.chartData[field.id];
                                    if (!data) return null;
                                    return (
                                        <div key={field.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{field.label}</h3>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data}
                                                            innerRadius={50}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {data.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                                            itemStyle={{ color: '#fff' }}
                                                        />
                                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {Object.keys(filteredAnalytics.chartData).length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No chart data available for this view.
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="responses"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                        >
                            {/* Filter Bar */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-wrap gap-4 items-center">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search all fields..."
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {/* Add more filter dropdowns here if needed */}
                                    <div className="text-sm text-gray-500 dark:text-gray-400 self-center">
                                        Showing {getFilteredSubmissions.length} of {baseAnalytics.totalSubmissions}
                                    </div>
                                </div>
                            </div>

                            {/* Table - Using BASE Analytics for Headers (Global Options) and Filtered Submissions for rows */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3 whitespace-nowrap w-16">Actions</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Submitted At</th>
                                            {baseAnalytics.formFields.map(field => {
                                                const stats = baseAnalytics.fieldStats[field.id]; // Use GLOBAL stats for filter options
                                                const isCategorical = ['select', 'radio', 'checkbox', 'payment_status'].includes(field.type) ||
                                                    (stats && Object.keys(stats.distribution || {}).length > 0 && Object.keys(stats.distribution || {}).length < 15);

                                                return (
                                                    <th key={field.id} className="px-6 py-3 min-w-[150px]">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                                                    checked={selectedExportColumns.includes(field.id)}
                                                                    onChange={() => toggleExportColumn(field.id)}
                                                                    title="Include in CSV Export"
                                                                />
                                                                <span>{field.label}</span>
                                                            </div>
                                                            {isCategorical && stats ? (
                                                                <select
                                                                    className="w-full px-2 py-1 text-xs font-normal rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                                                                    value={filters[field.id] || ''}
                                                                    onChange={(e) => setFilters({ ...filters, [field.id]: e.target.value })}
                                                                >
                                                                    <option value="">All</option>
                                                                    {Object.keys(stats.distribution).sort().map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    placeholder="Filter..."
                                                                    className="w-full px-2 py-1 text-xs font-normal capitalize rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                                                                    value={filters[field.id] || ''}
                                                                    onChange={(e) => setFilters({ ...filters, [field.id]: e.target.value })}
                                                                />
                                                            )}
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                            <th className="px-6 py-3 min-w-[200px]">Admin Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {getFilteredSubmissions.map((sub) => (
                                            <tr key={sub.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(sub)}>
                                                        <Eye className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '-'}
                                                </td>
                                                {baseAnalytics.formFields.map(field => {
                                                    const val = sub[field.id];
                                                    return (
                                                        <td key={field.id} className="px-6 py-4 text-gray-900 dark:text-white">
                                                            {Array.isArray(val) ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {val.map(v => (
                                                                        <span key={v} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">{v}</span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="line-clamp-2" title={val}>{val}</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            defaultValue={sub.adminNote || ''}
                                                            onBlur={(e) => {
                                                                if (e.target.value !== sub.adminNote) {
                                                                    handleUpdateNote(sub.id, e.target.value);
                                                                }
                                                            }}
                                                            className="w-full px-3 py-1 text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all placeholder-yellow-800/50"
                                                            placeholder="Add note..."
                                                        />
                                                        {savingNote === sub.id && (
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600">
                                                                Saving...
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {getFilteredSubmissions.length === 0 && (
                                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                    No responses match your filters.
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Individual Response Modal */}
            <Modal
                isOpen={!!selectedSubmission}
                onClose={() => setSelectedSubmission(null)}
                title="Response Details"
                size="lg"
            >
                {selectedSubmission && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Submission ID</p>
                                <p className="font-mono text-xs">{selectedSubmission.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Submitted At</p>
                                <p className="font-medium">
                                    {selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {baseAnalytics.formFields.map(field => {
                                const val = selectedSubmission[field.id];
                                return (
                                    <div key={field.id} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{field.label}</p>
                                        <div className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">
                                            {val === undefined || val === null || val === '' ? (
                                                <span className="text-gray-400 italic">No response</span>
                                            ) : Array.isArray(val) ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {val.map(v => (
                                                        <span key={v} className="px-2 py-1 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 text-sm">
                                                            {v}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                val
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-1 font-semibold">Admin Note</p>
                                <p className="text-gray-900 dark:text-white">
                                    {selectedSubmission.adminNote || <span className="text-gray-400 italic font-normal">No notes added</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FormResponseAnalytics;
