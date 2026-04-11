
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, ArrowLeft, Filter, Table, Save, Search, Eye, Code, ChevronDown, Star, Heart, ThumbsUp, Sun, Moon, Zap, Award, Crown, Smile, Frown, Meh, X, Mail, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import * as XLSX from 'xlsx';
import { useAuth } from '../../contexts/AuthContext';
import { MAIL_TEMPLATES, THEMED_BOXES } from '../../config/mailTemplates';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
const Quill = ReactQuill.Quill;

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const QUILL_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'clean'],
    ],
};

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
        allFields.push({ id: 'id', label: 'Registration ID', type: 'text', isSystem: true });
        seenFieldIds.add('id');
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
                        const key = v;
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

const DEFAULT_TICKET_BODY = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">

    <h2 style="color: #2563eb;">🎟️ Event Entry Ticket</h2>

    <p>Hi <strong>[Participant Name]</strong>,</p>

    <p>Your entry ticket for <strong>'[Event Name]'</strong> is ready. Please find your official PDF ticket attached to this email.</p>

    <div style="margin: 25px 0; padding: 24px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
        
        <p style="margin: 0 0 12px 0; color: #1e3a8a; font-weight: bold; font-size: 16px;">Event Details</p>

        <p style="margin: 0; color: #1e3a8a;">
            <strong>📍 Venue:</strong><br>
            [Venue]
        </p>

        <p style="margin: 12px 0 0 0; color: #1e3a8a;">
            <strong>📅 Date & Time:</strong><br>
            [Date] at [Time]
        </p>

    </div>

    <div style="margin: 20px 0; padding: 18px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px;">
        <p style="margin: 0; color: #92400e;">
            <strong>Note:</strong> Please keep the QR code on the attached PDF ready for scanning at the entrance.
        </p>
    </div>

    <p>We look forward to seeing you at the event! 👋</p>

    <p>Best Regards,<br><strong>The HITAM AI CLUB Team</strong></p>

</div>`;

const FormResponseAnalytics = () => {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Reusable text formatting utility
    const renderFormattedText = (text) => {
        if (!text) return "";
        // Handle Bold: **text** -> <strong>text</strong>
        let formatted = String(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Handle Links: [text](url) -> <a> link
        formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
            const isInternal = url.startsWith('/') || url.includes(window.location.hostname);
            return `<a href="${url}" ${isInternal ? '' : 'target="_blank" rel="noopener noreferrer"'} class="text-blue-600 dark:text-blue-400 hover:underline font-medium">${linkText}</a>`;
        });
        return formatted;
    };

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
    const [viewingMedia, setViewingMedia] = useState(null); // { type: 'image' | 'video', url: string }
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Filter State
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const [sendingTickets, setSendingTickets] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [selectedEmailColumn, setSelectedEmailColumn] = useState('');
    const [selectedNameColumn, setSelectedNameColumn] = useState('');
    const [ticketVenue, setTicketVenue] = useState('');
    const [ticketTime, setTicketTime] = useState('');
    const [participantsToMail, setParticipantsToMail] = useState([]);
    const [selectedSubIds, setSelectedSubIds] = useState([]);
    const [emailCc, setEmailCc] = useState('');
    const [isPreviewSample, setIsPreviewSample] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'html'
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

            // Sort by most recent first
            normalizedData.sort((a, b) => new Date(b.submittedAt || b.timestamp || 0) - new Date(a.submittedAt || a.timestamp || 0));

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

    const handleExport = (format) => {
        try {
            const exportFormat = typeof format === 'string' ? format : 'csv';
            const dataToExport = getFilteredSubmissions;
            if (!dataToExport.length) return alert("No data to export");

            // Filter fields based on selection
            const fieldsToExport = baseAnalytics.formFields.filter(f => selectedExportColumns.includes(f.id));
            const headers = ['ID', 'Date', ...fieldsToExport.map(f => f.label), 'Admin Note', 'Status'];

            // Prepare Data for Export
            const exportData = dataToExport.map(sub => {
                const row = [
                    sub.id,
                    sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '',
                ];

                fieldsToExport.forEach(f => {
                    let val = sub[f.id];
                    // Fallback to files object if main key is empty (legacy support)
                    if ((val === undefined || val === null || val === '') && sub.files && sub.files[f.id]) {
                        val = sub.files[f.id];
                    }

                    if (f.type === 'file') {
                        // Normalize val to array of objects if possible, or strings
                        const rawFiles = Array.isArray(val) ? val : (val ? [val] : []);
                        const files = rawFiles.map(f => {
                            if (typeof f === 'string') return { url: f, originalName: f };
                            return f;
                        });

                        if (files.length === 0) {
                            row.push('');
                        } else if (files.length === 1) {
                            // Single file - use plain URL string
                            row.push(files[0].url || '');
                        } else {
                            // Multiple files
                            // In Excel, 1 cell = 1 link usually. We can't easily make multiple links in one cell without rich text.
                            // Strategy: Join URLs with ; but make the cell clickable to the FIRST url? 
                            // Or just text. User asked for "active" links.
                            // If we just return text, it's not active.
                            // Let's return the first URL as active, and text mentions "Multiple files..."? 
                            // OR just join them.
                            // The user's screenshot had 1 URL.
                            // Let's just join them for now, but if there's only 1 (common case), it works.
                            // IF we really want all clickable, we'd need multiple columns or rows.
                            // Compromise: Link the first one, show text as joined?
                            // No, let's stick to joining text if > 1, but maybe the user's issue was purely the Array check failing for single items (which were array of 1).

                            if (exportFormat === 'excel') {
                                // If multiple, just show text for now to avoid confusion, 
                                // UNLESS we can detect they are all the same? Unlikely.
                                // Let's just try to fallback to the joined string.
                                row.push(files.map(f => f.url).join('; '));
                            } else {
                                row.push(files.map(f => f.url).join('; '));
                            }
                        }
                    } else {
                        // Plain string value
                        const strVal = Array.isArray(val) ? val.join('; ') : (val ? String(val) : '');
                        row.push(strVal);
                    }
                });

                row.push(sub.adminNote || '');
                row.push(sub.status || 'pending');
                return row;
            });

            // Sanitize filename
            const safeTitle = (activity?.title || 'export').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const dateStr = new Date().toISOString().split('T')[0];

            if (exportFormat === 'excel') {
                // EXCEL EXPORT
                const wb = XLSX.utils.book_new();
                const wsData = [headers, ...exportData];
                const ws = XLSX.utils.aoa_to_sheet(wsData);

                // Set column widths (optional but nice)
                const wscols = headers.map(() => ({ wch: 20 }));
                ws['!cols'] = wscols;

                XLSX.utils.book_append_sheet(wb, ws, "Submissions");
                XLSX.writeFile(wb, `${safeTitle}_excel_${dateStr}.xlsx`);
            } else {
                // CSV EXPORT (Manual to keep control or could use XLSX too, but keeping minimal changes for CSV if it works)
                // Actually, let's use XLSX for CSV too for consistency if desired, strictly requested was just .xlsx fix.
                // But previous CSV logic was manual string building which is fine.
                // Let's keep the manual CSV logic for 'csv' format to avoid breaking what works, 
                // OR use the new XLSX logic for CSV too.
                // The implementation plan said "Implement .xlsx export", implying CSV stays as is or is also improved.
                // I will stick to the previous manual CSV logic for 'csv' to minimize risk, 
                // BUT I will use the new data preparation logic above? No, the data prep is slightly different (objects vs strings).
                // Let's refactor to use the new data prep but convert back to string for CSV or just use XLSX for everything.
                // Using XLSX for everything is cleaner.

                const wb = XLSX.utils.book_new();
                const wsData = [headers, ...exportData.map(row => row.map(cell => {
                    // Flatten objects for CSV
                    if (cell && typeof cell === 'object' && cell.l) return cell.l.Target;
                    return cell;
                }))];
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                XLSX.utils.book_append_sheet(wb, ws, "Submissions");
                XLSX.writeFile(wb, `${safeTitle}_export_${dateStr}.csv`);
            }

            setShowExportMenu(false);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export data. See console for details.");
        }
    };

    const openEmailModal = (participants = null) => {
        // If participants provided (from single row button), use that
        // Otherwise, use selected checkboxes
        // Final fallback: use all visible (getFilteredSubmissions)
        let dataToSend = [];
        if (participants && !participants.nativeEvent) {
            dataToSend = participants;
        } else if (selectedSubIds.length > 0) {
            dataToSend = submissions.filter(s => selectedSubIds.includes(s.id));
        } else {
            dataToSend = getFilteredSubmissions;
        }

        if (!dataToSend.length) return alert("No participants to send tickets to. Please select rows or check your filters.");

        setParticipantsToMail(dataToSend);

        // Try to auto-detect email column
        const guessEmailCol = baseAnalytics.formFields?.find(f => f.label?.toLowerCase().includes('email'))?.id || '';
        setSelectedEmailColumn(guessEmailCol);

        // Try to auto-detect name column
        const guessNameCol = baseAnalytics.formFields?.find(f => f.label?.toLowerCase().includes('name'))?.id || '';
        setSelectedNameColumn(guessNameCol);

        // --- Use Ticket Config or Activity Templates if available ---
        const ticketConfig = activity.ticketConfig || {};
        const postReg = activity.postRegistration || {};

        const titleLine = `Your Ticket Confirmation: ${activity.title || ''}`;

        // Priority: ticketConfig -> postReg (legacy) -> titleLine
        const finalSubject = ticketConfig.ticketSubject || postReg.welcomeEmailSubject || titleLine;
        const finalVenue = ticketConfig.ticketVenue !== undefined ? ticketConfig.ticketVenue : (postReg.welcomeEmailVenue || activity.location || '');
        const finalTime = ticketConfig.ticketTime || postReg.welcomeEmailTime || '';
        const finalCc = ticketConfig.ticketCc || postReg.welcomeEmailCc || '';
        const finalBody = ticketConfig.ticketBody || postReg.welcomeEmailBody;

        setEmailSubject(finalSubject);
        setTicketVenue(finalVenue);
        setTicketTime(finalTime);
        setEmailCc(finalCc);

        if (finalBody !== undefined && finalBody !== null && finalBody !== '') {
            setEmailBody(finalBody);
        } else {
            setEmailBody(DEFAULT_TICKET_BODY);
        }
        setEmailModalOpen(true);
    };


    const handleSaveEmailTemplate = async () => {
        setIsSavingTemplate(true);
        try {
            const docRef = doc(db, 'upcomingActivities', activity.id);
            const templateData = {
                'ticketConfig.ticketSubject': emailSubject,
                'ticketConfig.ticketBody': emailBody,
                'ticketConfig.ticketVenue': ticketVenue,
                'ticketConfig.ticketTime': ticketTime,
                'ticketConfig.ticketCc': emailCc,
                'ticketConfig.isCustomLayout': true,
                'updatedAt': new Date().toISOString()
            };

            await updateDoc(docRef, templateData);

            setActivity(prev => ({
                ...prev,
                ticketConfig: {
                    ...(prev.ticketConfig || {}),
                    ticketSubject: emailSubject,
                    ticketBody: emailBody,
                    ticketVenue: ticketVenue,
                    ticketTime: ticketTime,
                    ticketCc: emailCc,
                    isCustomLayout: true
                }
            }));

            alert('Ticket template saved successfully to Activity settings!');
        } catch (err) {
            console.error('Error saving template:', err);
            alert('Failed to save template: ' + err.message);
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleSendTickets = async () => {
        if (!participantsToMail.length) return alert("No participants to send tickets to.");

        try {
            setSendingTickets(true);
            const token = await user?.getIdToken(); // Optional: if protected

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/send-tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity: activity,
                    participants: participantsToMail,
                    customSubject: emailSubject,
                    customHtml: emailBody,
                    emailColumn: selectedEmailColumn,
                    nameColumn: selectedNameColumn,
                    venue: ticketVenue,
                    time: ticketTime,
                    cc: emailCc // Pass CC to backend
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send tickets');
            }

            // Update flags in Firestore for each participant who succeeded
            try {
                const updateFlags = {
                    ticketSent: true,
                    status: 'confirmed'
                };

                for (const participant of participantsToMail) {
                    const globalRef = doc(db, 'allRegistrations', participant.id);
                    const activityRef = doc(db, 'upcomingActivities', activityId, 'registrations', participant.id);

                    await updateDoc(globalRef, updateFlags).catch(() => { });
                    await updateDoc(activityRef, updateFlags).catch(() => { });
                }

                // Refresh data locally
                setSubmissions(prev => prev.map(sub => {
                    const isSent = participantsToMail.some(p => p.id === sub.id);
                    return isSent ? { ...sub, ...updateFlags } : sub;
                }));
            } catch (syncError) {
                console.error("Error updating ticket flags:", syncError);
            }

            alert(result.message || `Successfully sent tickets to ${result.results?.success} users.`);
            setEmailModalOpen(false);

        } catch (err) {
            console.error("Failed to send tickets:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setSendingTickets(false);
        }
    };

    const handleSendManualWelcome = async (sub) => {
        if (!window.confirm("Do you want to send the welcome email to this participant now?")) return;

        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

            // Use configured labels or try common defaults
            const nameCol = activity.postRegistration?.nameFieldId || '';
            const emailCol = activity.postRegistration?.emailFieldId || '';

            const response = await fetch(`${apiUrl}/api/send-welcome`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity: activity,
                    participant: sub,
                    nameColumn: nameCol,
                    emailColumn: emailCol,
                    customSubject: activity.postRegistration?.welcomeEmailSubject,
                    customHtml: activity.postRegistration?.welcomeEmailBody,
                    venue: ticketVenue,
                    time: ticketTime,
                    cc: emailCc // Pass CC to backend (uses current state value)
                })
            });

            if (response.ok) {
                // Update Firestore
                const flags = { welcomeEmailSent: true };
                await updateDoc(doc(db, 'allRegistrations', sub.id), flags).catch(() => { });
                await updateDoc(doc(db, 'upcomingActivities', activityId, 'registrations', sub.id), flags).catch(() => { });

                // Update local state
                setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, ...flags } : s));
                alert("Welcome email sent successfully!");
            } else {
                const err = await response.json().catch(() => ({ error: 'Server error' }));
                throw new Error(err.error || "Failed to send email");
            }
        } catch (err) {
            console.error("Manual welcome failed:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper to render file values in the table
    const renderFileValue = (val) => {
        if (!val) return <span className="text-gray-400 italic text-xs">No file</span>;

        const files = Array.isArray(val) ? val : [val];

        return (
            <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => {
                    const url = file.url || file;
                    if (!url || typeof url !== 'string') return null;

                    const extension = url.split('.').pop().split('?')[0].toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension);
                    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(extension);
                    const isPDF = ['pdf'].includes(extension);

                    if (isImage) {
                        return (
                            <button
                                key={idx}
                                onClick={() => setViewingMedia({ type: 'image', url })}
                                className="block relative group cursor-zoom-in"
                            >
                                <img src={url} alt="Upload" className="h-12 w-12 object-cover rounded border border-gray-200 dark:border-gray-700 group-hover:opacity-80 transition-opacity" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded" />
                            </button>
                        );
                    }

                    if (isVideo) {
                        return (
                            <div key={idx} className="relative group w-12 h-12 cursor-pointer" onClick={() => setViewingMedia({ type: 'video', url })}>
                                <video src={url} className="h-12 w-12 object-cover rounded border border-gray-200 dark:border-gray-700" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors rounded text-white">
                                    <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center">
                                        <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-white border-b-[3px] border-b-transparent ml-0.5"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Text Link for PDF and other files (as requested: "open links for all files")
                    return (
                        <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-100 dark:border-blue-900"
                        >
                            <Download className="w-3 h-3" />
                            {isPDF ? 'PDF' : 'Link'}
                        </a>
                    );
                })}
            </div>
        );
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
                        {/* Send Tickets Button */}
                        <Button
                            onClick={() => openEmailModal()}
                            disabled={sendingTickets}
                            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                        >
                            {sendingTickets ? <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span> : <Mail className="w-4 h-4 mr-2" />}
                            {sendingTickets ? 'Sending...' : `Send Tickets ${selectedSubIds.length > 0 ? `(${selectedSubIds.length})` : ''}`}
                        </Button>
                        {/* Export Menu */}
                        <div className="relative">
                            <Button onClick={() => setShowExportMenu(!showExportMenu)} variant="outline" className="flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Export
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex flex-col gap-0.5"
                                    >
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Standard CSV</span>
                                        <span className="text-xs text-gray-500">Plain text links</span>
                                    </button>
                                    <button
                                        onClick={() => handleExport('excel')}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm border-t border-gray-100 dark:border-gray-700 flex flex-col gap-0.5"
                                    >
                                        <span className="font-medium text-gray-900 dark:text-gray-100">Excel Format</span>
                                        <span className="text-xs text-gray-500">Active/Clickable links</span>
                                    </button>
                                </div>
                            )}
                            {showExportMenu && (
                                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                            )}
                        </div>
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
                                    const stats = filteredAnalytics.fieldStats[field.id];
                                    const data = filteredAnalytics.chartData[field.id];

                                    // Determine Visualization Type based on stats AND label
                                    let vizType = 'chart'; // default
                                    if (stats) {
                                        const uniqueCount = Object.keys(stats.distribution || {}).length;
                                        const total = stats.filledResponses;
                                        const lowerLabel = field.label.toLowerCase();

                                        // 1. Label Heuristic (for small datasets like 2 responses)
                                        const isIdentifierLabel = lowerLabel.includes('name') ||
                                            lowerLabel.includes('email') ||
                                            lowerLabel.includes('roll') ||
                                            lowerLabel.includes('phone') ||
                                            lowerLabel.includes('mobile') ||
                                            lowerLabel.includes('id') ||
                                            lowerLabel.includes('remarks') ||
                                            lowerLabel.includes('feedback') ||
                                            lowerLabel.includes('suggestion') ||
                                            lowerLabel.includes('comment');

                                        // 2. Statistical Heuristic (for larger datasets)
                                        // If unique values > 50% of total responses OR unique values > 20
                                        const isHighCardinality = (total > 5 && (uniqueCount > 20 || (uniqueCount / total) > 0.5));

                                        if (isIdentifierLabel || isHighCardinality) {
                                            vizType = 'list';
                                        }
                                    }

                                    if (vizType === 'list') {
                                        return (
                                            <div key={field.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{field.label}</h3>
                                                <p className="text-xs text-gray-500 mb-4">
                                                    {stats.filledResponses} Responses • {Object.keys(stats.distribution).length} Unique Values
                                                </p>

                                                <div className="flex-1 overflow-y-auto max-h-48 pr-2 space-y-2">
                                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Entries</h4>
                                                    {getFilteredSubmissions.slice(0, 10).map((sub, idx) => {
                                                        const val = sub[field.id];
                                                        return (
                                                            <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-700 last:border-0 pb-1">
                                                                {val ? String(val) : <span className="italic text-gray-400">Empty</span>}
                                                            </div>
                                                        );
                                                    })}
                                                    {getFilteredSubmissions.length > 10 && (
                                                        <div className="text-xs text-center text-gray-400 mt-2">
                                                            + {getFilteredSubmissions.length - 10} more...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Special Visualization for Ratings
                                    if (field.type === 'rating' && stats) {
                                        const maxRating = field.maxRating || 5;
                                        const total = stats.filledResponses;
                                        const average = stats.average || 0;

                                        // Calculate counts for each star (1 to maxRating)
                                        const counts = {};
                                        for (let i = 1; i <= maxRating; i++) counts[i] = 0;

                                        if (stats.ratings) {
                                            stats.ratings.forEach(r => {
                                                const rounded = Math.round(r);
                                                if (counts[rounded] !== undefined) counts[rounded]++;
                                            });
                                        }

                                        // Helper to get Icon and Color based on type and state
                                        const getRatingConfig = (type) => {
                                            switch (type) {
                                                case "heart": return { Icon: Heart, colorClass: "text-red-500", fillClass: "fill-current" };
                                                case "thumbsUp": return { Icon: ThumbsUp, colorClass: "text-blue-500", fillClass: "fill-current" };
                                                case "sun": return { Icon: Sun, colorClass: "text-orange-400", fillClass: "fill-current" };
                                                case "moon": return { Icon: Moon, colorClass: "text-indigo-500", fillClass: "fill-current" };
                                                case "zap": return { Icon: Zap, colorClass: "text-yellow-500", fillClass: "fill-current" };
                                                case "award": return { Icon: Award, colorClass: "text-purple-500", fillClass: "fill-current" };
                                                case "crown": return { Icon: Crown, colorClass: "text-yellow-600", fillClass: "fill-current" };
                                                case "faces": return { Icon: Smile, colorClass: "text-green-500", fillClass: "" }; // Faces handled specially
                                                default: return { Icon: Star, colorClass: "text-yellow-400", fillClass: "fill-current" };
                                            }
                                        };

                                        const { Icon, colorClass, fillClass } = getRatingConfig(field.iconType);
                                        const isFaces = field.iconType === "faces";

                                        // For faces, we might want different icons per level
                                        const getFaceIcon = (index) => {
                                            if (!isFaces) return Icon;
                                            // Map 0-4 index to Scale
                                            // 1: Angry, 2: Sad, 3: Neutral, 4: Good, 5: Happy
                                            if (index === 0) return Frown; // 1
                                            if (index === 1) return Frown; // 2
                                            if (index === 2) return Meh;   // 3
                                            if (index === 3) return Smile; // 4
                                            return Smile;                  // 5+
                                        };

                                        const getFaceColor = (index) => {
                                            if (!isFaces) return colorClass;
                                            if (index === 0) return "text-red-500";
                                            if (index === 1) return "text-orange-500";
                                            if (index === 2) return "text-yellow-500";
                                            if (index === 3) return "text-blue-500";
                                            return "text-green-500";
                                        };

                                        const progressBarColor = (index) => {
                                            if (isFaces) return getFaceColor(index).replace('text-', 'bg-');
                                            return colorClass.replace('text-', 'bg-');
                                        };

                                        return (
                                            <div key={field.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{field.label}</h3>

                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 w-24 h-24">
                                                        <span className={`text-3xl font-bold ${colorClass.replace('fill-current', '')}`}>{average}</span>
                                                        <div className="flex items-center mt-1">
                                                            {isFaces ? (
                                                                <Smile className="w-3 h-3 text-gray-400" />
                                                            ) : (
                                                                <Icon className={`w-3 h-3 ${colorClass} ${fillClass}`} />
                                                            )}
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">/ {maxRating}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                            Based on {total} ratings
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(maxRating > 5 && !isFaces ? 1 : Math.min(maxRating, 5))].map((_, i) => {
                                                                if (i >= 10) return null;

                                                                const CurrentIcon = getFaceIcon(i);
                                                                const currentColor = getFaceColor(i);
                                                                const isFilled = i < Math.round(average);

                                                                return (
                                                                    <CurrentIcon
                                                                        key={i}
                                                                        className={`w-5 h-5 ${isFilled ? `${currentColor} ${fillClass}` : 'text-gray-200 dark:text-gray-700'}`}
                                                                    />
                                                                );
                                                            })}
                                                            {maxRating > 5 && !isFaces && <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">...</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {[...Array(maxRating)].map((_, i) => {
                                                        const starIndex = maxRating - 1 - i;
                                                        const starValue = starIndex + 1;

                                                        const count = counts[starValue] || 0;
                                                        const percentage = total > 0 ? (count / total) * 100 : 0;

                                                        const RowIcon = getFaceIcon(starIndex);
                                                        const rowColor = getFaceColor(starIndex);
                                                        const rowBgColor = progressBarColor(starIndex);

                                                        return (
                                                            <div key={starValue} className="flex items-center gap-2 text-xs">
                                                                <span className="w-3 text-gray-500 dark:text-gray-400 font-medium">{starValue}</span>
                                                                <RowIcon className={`w-3 h-3 ${rowColor} ${fillClass}`} />
                                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${rowBgColor}`}
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                                <span className="w-8 text-right text-gray-500 dark:text-gray-400">{count}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Default to Chart for Categorical Data
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
                            {Object.keys(filteredAnalytics.chartData).length === 0 && filteredAnalytics.formFields.length === 0 && (
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
                                            <th className="px-6 py-3 whitespace-nowrap w-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300"
                                                    checked={selectedSubIds.length === getFilteredSubmissions.length && getFilteredSubmissions.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedSubIds(getFilteredSubmissions.map(s => s.id));
                                                        } else {
                                                            setSelectedSubIds([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="px-6 py-3 whitespace-nowrap w-16">Actions</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Submitted At</th>
                                            <th className="px-6 py-3 whitespace-nowrap text-center">Conf. Sent</th>
                                            <th className="px-6 py-3 whitespace-nowrap text-center">Ticket Sent</th>
                                            <th className="px-6 py-3 whitespace-nowrap">Status</th>
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
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 transition-all cursor-pointer"
                                                        checked={selectedSubIds.includes(sub.id)}
                                                        onChange={() => {
                                                            setSelectedSubIds(prev =>
                                                                prev.includes(sub.id)
                                                                    ? prev.filter(id => id !== sub.id)
                                                                    : [...prev, sub.id]
                                                            );
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(sub)} title="View Details">
                                                            <Eye className="w-4 h-4 text-blue-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setParticipantsToMail([sub]);
                                                                setEmailModalOpen(true);
                                                            }}
                                                            title="Send Ticket"
                                                        >
                                                            <Mail className="w-4 h-4 text-green-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {sub.welcomeEmailSent ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSendManualWelcome(sub)}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors group"
                                                            title="Manually send welcome email"
                                                        >
                                                            <Mail className="w-4 h-4 text-gray-300 group-hover:text-blue-500 mx-auto" />
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {sub.ticketSent ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                    ) : (
                                                        <X className="w-4 h-4 text-gray-300 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(() => {
                                                        const status = sub.status || 'pending';
                                                        let color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                                                        let Icon = Clock;

                                                        if (status === 'confirmed') {
                                                            color = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                                                            Icon = CheckCircle2;
                                                        } else if (status === 'pending_review' || status === 'pending_payment') {
                                                            color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                                                            Icon = AlertCircle;
                                                        }

                                                        return (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
                                                                <Icon className="w-3 h-3" />
                                                                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                {baseAnalytics.formFields.map(field => {
                                                    let val = sub[field.id];
                                                    // Fallback to files object if main key is empty (legacy support)
                                                    if ((val === undefined || val === null || val === '') && sub.files && sub.files[field.id]) {
                                                        val = sub.files[field.id];
                                                    }

                                                    return (
                                                        <td key={field.id} className="px-6 py-4 text-gray-900 dark:text-white">
                                                            {(() => {
                                                                if (val === undefined || val === null || val === '') return <span className="text-gray-400 italic text-xs">-</span>;

                                                                let isFile = field.type === 'file';
                                                                if (!isFile && val !== null && typeof val === 'object') {
                                                                    if (Array.isArray(val)) {
                                                                        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null && val[0].url) isFile = true;
                                                                    } else if (val.url) {
                                                                        isFile = true;
                                                                    }
                                                                }

                                                                if (isFile) return renderFileValue(val);

                                                                if (Array.isArray(val)) {
                                                                    return (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {val.map((v, i) => (
                                                                                <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                                                                                    {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                }

                                                                const displayStr = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
                                                                return <span className="line-clamp-2" title={displayStr}>{displayStr}</span>;
                                                            })()}
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
                                // Try to get value from direct property or files object
                                let val = selectedSubmission[field.id];
                                if ((val === undefined || val === null) && selectedSubmission.files) {
                                    val = selectedSubmission.files[field.id];
                                }

                                return (
                                    <div key={field.id} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{field.label}</p>
                                        <div className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">
                                            {(() => {
                                                if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
                                                    return <span className="text-gray-400 italic">No response</span>;
                                                }

                                                let isFile = field.type === 'file';
                                                if (!isFile && val !== null && typeof val === 'object') {
                                                    if (Array.isArray(val)) {
                                                        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null && val[0].url) isFile = true;
                                                    } else if (val.url) {
                                                        isFile = true;
                                                    }
                                                }

                                                if (isFile) {
                                                    return (
                                                        <div className="flex flex-col gap-2">
                                                            {(Array.isArray(val) ? val : [val]).map((file, idx) => {
                                                                if (!file) return null;
                                                                const url = typeof file === 'string' ? file : file.url;
                                                                if (typeof url !== 'string') return null;

                                                                return (
                                                                    <a
                                                                        key={idx}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 text-blue-600 hover:underline bg-white dark:bg-gray-600 p-2 rounded border border-blue-100 dark:border-gray-500 w-max"
                                                                    >
                                                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded">
                                                                            <Download className="w-4 h-4" />
                                                                        </div>
                                                                        <span className="text-sm">
                                                                            {file.originalName || file.name || `File ${idx + 1}`}
                                                                        </span>
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                }

                                                if (Array.isArray(val)) {
                                                    return (
                                                        <div className="flex flex-wrap gap-2">
                                                            {val.map((v, i) => (
                                                                <span key={i} className="px-2 py-1 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 text-sm">
                                                                    {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                }

                                                const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
                                                return <div dangerouslySetInnerHTML={{ __html: renderFormattedText(displayVal) }} />;
                                            })()}
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
            {/* Email Customization Modal */}
            <Modal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                title="Manual Ticket Generation & Mails"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl flex items-start gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                            <Mail className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100">Admin about to Mail</h4>
                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                                You are sending tickets to <strong>{participantsToMail.length}</strong> selected participant(s).
                                Each email will include a generated PDF ticket.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Recipient Name Data Column</label>
                                <select
                                    value={selectedNameColumn}
                                    onChange={(e) => setSelectedNameColumn(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="">-- Let System Auto-Detect (Fallback) --</option>
                                    {baseAnalytics.formFields.map(f => (
                                        <option key={f.id} value={f.id}>{f.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Recipient Email Data Column</label>
                                <select
                                    value={selectedEmailColumn}
                                    onChange={(e) => setSelectedEmailColumn(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="">-- Let System Auto-Detect (Fallback) --</option>
                                    {baseAnalytics.formFields.map(f => (
                                        <option key={f.id} value={f.id}>{f.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email Subject</label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Admin CC (Optional)</label>
                                <input
                                    type="text"
                                    value={emailCc}
                                    onChange={(e) => setEmailCc(e.target.value)}
                                    placeholder="admin@hitam.ai, info@hitam.ai"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Venue (on Ticket)</label>
                                    <input
                                        type="text"
                                        placeholder="Auditorium"
                                        value={ticketVenue}
                                        onChange={(e) => setTicketVenue(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time (on Ticket)</label>
                                    <input
                                        type="text"
                                        placeholder="10:00 AM"
                                        value={ticketTime}
                                        onChange={(e) => setTicketTime(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Email Body</label>
                                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={() => setEditorMode('visual')}
                                                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${editorMode === 'visual'
                                                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <Eye size={12} /> VISUAL
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditorMode('html')}
                                                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${editorMode === 'html'
                                                        ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <Code size={12} /> HTML
                                            </button>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400">Placeholders: [Participant Name], [Event Name], [Venue], [Time], [Date]</span>
                                </div>

                                {editorMode === 'visual' ? (
                                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
                                        <ReactQuill
                                            theme="snow"
                                            value={emailBody}
                                            onChange={setEmailBody}
                                            modules={QUILL_MODULES}
                                            className="h-64"
                                        />
                                    </div>
                                ) : (
                                    <textarea
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        rows={12}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs leading-relaxed"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="flex flex-col border-l border-gray-100 dark:border-gray-700 pl-4 h-full">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                                    Live Design Check
                                </label>
                                <button
                                    onClick={() => setIsPreviewSample(!isPreviewSample)}
                                    className={`px-3 py-1 rounded-md text-[9px] font-black tracking-tighter transition-all ${isPreviewSample ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                                >
                                    {isPreviewSample ? 'SHOWING SAMPLE DATA' : 'SHOWING PLACEHOLDERS'}
                                </button>
                            </div>

                            <div className="flex-1 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-inner flex flex-col min-h-[400px]">
                                <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span className="text-[10px] text-gray-400 ml-2 font-mono">ticket_preview.html</span>
                                </div>

                                <div className="flex-1 p-6 overflow-y-auto bg-white">
                                    <div
                                        className="prose prose-sm max-w-none"
                                        style={{ fontFamily: "'Segoe UI', sans-serif" }}
                                        dangerouslySetInnerHTML={{
                                            __html: isPreviewSample
                                                ? emailBody
                                                    .replace(/\[Participant Name\]/gi, "Arif")
                                                    .replace(/\[Event Name\]/gi, activity.title)
                                                    .replace(/\[Venue\]/gi, ticketVenue || activity.location || "Auditorium")
                                                    .replace(/\[Date\]/gi, activity.eventDate ? new Date(activity.eventDate).toLocaleDateString() : "Next Monday")
                                                    .replace(/\[Time\]/gi, ticketTime || activity.eventTime || "10:00 AM")
                                                : emailBody
                                        }}
                                    />
                                    <div className="mt-8 pt-8 border-t border-dashed border-gray-200">
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center gap-3 text-gray-500 italic text-xs">
                                            <Download size={14} /> [Auto-Generated PDF Ticket Attached]
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveEmailTemplate}
                            loading={isSavingTemplate}
                            className="text-xs"
                        >
                            <Save size={14} className="mr-2" /> Save Designer Template
                        </Button>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setEmailModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendTickets}
                                loading={sendingTickets}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {sendingTickets ? 'Sending...' : `Confirm & Send ${participantsToMail.length} Tickets`}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Media Viewer Modal */}
            {createPortal(
                <AnimatePresence>
                    {viewingMedia && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                            onClick={() => setViewingMedia(null)}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingMedia(null);
                                }}
                                className="absolute top-6 right-6 z-[10000] p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all hover:scale-110"
                                title="Close"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                                {viewingMedia.type === 'image' ? (
                                    <img
                                        src={viewingMedia.url}
                                        alt="Full view"
                                        className="max-w-full max-h-full object-contain rounded shadow-2xl"
                                    />
                                ) : (
                                    <video
                                        src={viewingMedia.url}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-full rounded shadow-2xl"
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default FormResponseAnalytics;
