import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Users, Send, CheckCircle, AlertCircle, Search, Filter, Loader2, ChevronRight, Info, X, Edit3, Paperclip, FileText, Trash2, Eye, Code, ArrowLeft, Star, Archive, Trash, Mail as MailIcon, MoreVertical, ChevronDown, Smile, Zap } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean'],
  ],
};

const THEMED_BOXES = {
  green: {
    name: 'Next Steps (Green)',
    class: 'bg-green-50 text-green-800 border-green-200',
    html: `<div style="margin: 25px 0; padding: 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
        <p style="margin: 0 0 10px 0; color: #166534; font-weight: bold; font-size: 16px;">What's Next?</p>
        <ul style="margin: 0; color: #166534; padding-left: 20px;">
            <li>Step 1 description here...</li>
            <li>Step 2 description here...</li>
        </ul>
    </div>`
  },
  blue: {
    name: 'General Info (Blue)',
    class: 'bg-blue-50 text-blue-800 border-blue-200',
    html: `<div style="margin: 25px 0; padding: 24px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
        <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: bold; font-size: 16px;">Important Information</p>
        <p style="margin: 0; color: #1e40af; font-size: 14px;">Enter your informational text about the event details or logistics here.</p>
    </div>`
  },
  orange: {
    name: 'Quick Note (Orange)',
    class: 'bg-orange-50 text-orange-800 border-orange-200',
    html: `<div style="margin: 25px 0; padding: 20px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; text-align: center; color: #c2410c; font-size: 14px;">
        <strong>Note:</strong> Enter a quick disclaimer or rule here.
    </div>`
  }
};

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useClubMembers, useCommunityMembers } from '../../hooks/useFirebaseData';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const MailPage = () => {
    // Member Data
    const { data: clubMembers, loading: clubLoading } = useClubMembers();
    const { data: communityMembers, loading: communityLoading } = useCommunityMembers();
    const [activities, setActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [activityParticipants, setActivityParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    // Form State
    const [audienceType, setAudienceType] = useState('club'); // club, activity, custom
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('<div style="font-family: sans-serif; line-height: 1.6; color: #333;">\n  <h2>Hello [Name],</h2>\n  <p>Update from HITAM AI CLUB...</p>\n</div>');
    const [emailCc, setEmailCc] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [customEmailsRaw, setCustomEmailsRaw] = useState(''); // New state for manual entry
    const [attachments, setAttachments] = useState([]); // New state for file attachments
    const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'html'

    // Sending State
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
    const [sendResults, setSendResults] = useState(null);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const q = query(collection(db, 'upcomingActivities'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActivities(list);
        } catch (err) {
            console.error("Error fetching activities:", err);
        }
    };

    const fetchParticipants = async (activityId) => {
        setLoadingParticipants(true);
        try {
            const q = collection(db, 'upcomingActivities', activityId, 'registrations');
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActivityParticipants(list);
            
            // Auto-select all participants initially
            const targets = list.map(p => ({
                id: p.id,
                email: p.email || p.email_address || p.Email_Address || '',
                name: p.name || p.full_name || p.Full_Name || 'Participant'
            })).filter(p => p.email);
            
            setSelectedRecipients(targets);
        } catch (err) {
            console.error("Error fetching participants:", err);
        } finally {
            setLoadingParticipants(false);
        }
    };

    useEffect(() => {
        if (audienceType === 'activity' && selectedActivity) {
            fetchParticipants(selectedActivity);
        } else if (audienceType === 'club' && clubMembers) {
            const targets = Object.values(clubMembers).map(m => ({
                id: m.id,
                email: m.email,
                name: m.name
            })).filter(m => m.email);
            setSelectedRecipients(targets);
        } else if (audienceType === 'custom') {
            // Parsing logic for Name <email@example.com>, email@example.com, etc.
            const lines = customEmailsRaw.split(/[\n,]+/).map(line => line.trim()).filter(line => line);
            const parsed = lines.map((line, index) => {
                const match = line.match(/^([^<]+)<([^>]+)>$/) || line.match(/^<([^>]+)>$/);
                if (match) {
                    return { id: `manual-${index}`, name: (match[1] || '').trim(), email: match[2].trim() };
                }
                return { id: `manual-${index}`, name: 'Recipient', email: line };
            }).filter(p => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email));
            
            setSelectedRecipients(parsed);
        }
    }, [audienceType, selectedActivity, clubMembers, communityMembers, customEmailsRaw]);

    const handleSendBulk = async () => {
        if (!emailSubject || !emailBody) return alert("Please fill subject and body.");
        if (selectedRecipients.length === 0) return alert("No recipients selected.");

        const confirm = window.confirm(`Ready to send email to ${selectedRecipients.length} recipients?`);
        if (!confirm) return;

        setIsSending(true);
        setSendProgress({ current: 0, total: selectedRecipients.length });

        try {
            const formData = new FormData();
            formData.append('recipients', JSON.stringify(selectedRecipients));
            formData.append('subject', emailSubject);
            formData.append('body', emailBody);
            formData.append('cc', emailCc);
            
            attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/send-bulk`, {
                method: 'POST',
                body: formData // No headers needed for FormData
            });

            const result = await response.json();
            setSendResults(result.results);
            
            if (response.ok) {
                alert(`Successfully processed. Sent: ${result.results.success}, Failed: ${result.results.failed}`);
            } else {
                throw new Error(result.error || "Failed to send bulk mail");
            }
        } catch (err) {
            console.error("Bulk send failed:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const filteredRecipients = selectedRecipients.filter(r => 
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900 pb-12 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            Mail Center
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Centralized dashboard for administrative communications.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {selectedRecipients.length} Recipients Selected
                            </span>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Panel: Configuration */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Audience Selection */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-blue-500" />
                                Selection & Audience
                            </h3>
                            
                            <div className="space-y-3">
                                {[
                                    { id: 'club', label: 'Club Members Only', icon: Users },
                                    { id: 'activity', label: 'Event Participants', icon: CalendarIcon },
                                    { id: 'custom', label: 'Custom List (Manual)', icon: Edit3 }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setAudienceType(type.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            audienceType === type.id 
                                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm' 
                                            : 'bg-gray-50 border-transparent dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <span className="font-medium text-sm">{type.label}</span>
                                        {audienceType === type.id && <CheckCircle className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>

                            {audienceType === 'activity' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
                                >
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Select Activity
                                    </label>
                                    <select
                                        value={selectedActivity || ''}
                                        onChange={(e) => setSelectedActivity(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Choose an activity...</option>
                                        {activities.map(act => (
                                            <option key={act.id} value={act.id}>{act.title}</option>
                                        ))}
                                    </select>
                                    {loadingParticipants && (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-blue-500">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Loading participants...
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {audienceType === 'custom' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
                                >
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Manual Email Entry
                                    </label>
                                    <textarea
                                        rows={8}
                                        value={customEmailsRaw}
                                        onChange={(e) => setCustomEmailsRaw(e.target.value)}
                                        placeholder="Arif <arif@hitam.ai>&#10;test@gmail.com, person@company.com"
                                        className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-mono"
                                    />
                                    <p className="mt-2 text-[10px] text-gray-400 italic">
                                        Separate emails by commas or newlines.
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Recipient List Preview */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 h-[400px] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Recipient List
                                </h3>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500 dark:text-gray-400">
                                    {filteredRecipients.length} visible
                                </span>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex-grow overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {filteredRecipients.map((recipient, idx) => (
                                    <div 
                                        key={idx}
                                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all flex items-center justify-between group"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {recipient.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {recipient.email}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedRecipients(prev => prev.filter(r => r.email !== recipient.email))}
                                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {filteredRecipients.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-400">No recipients found.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Panel: Composition */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 relative overflow-hidden"
                        >
                            {/* Gradient Accent */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Compose Broadast
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 px-2 py-0.5 rounded-full font-medium">New</span>
                                </h2>
                                
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Info size={14} />
                                    <span>Placeholders: [Name]</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <Input
                                    label="Subject"
                                    placeholder="Enter email subject..."
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="!rounded-xl"
                                />

                                <Input
                                    label="CC Emails (optional)"
                                    placeholder="e.g. admin@hitam.ai, info@hitam.ai"
                                    value={emailCc}
                                    onChange={(e) => setEmailCc(e.target.value)}
                                    className="!rounded-xl"
                                />

                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Attachments (Max 10MB total)
                                    </label>
                                    
                                    <div 
                                        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all group relative cursor-pointer"
                                        onClick={() => document.getElementById('file-upload').click()}
                                    >
                                        <input
                                            id="file-upload"
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files);
                                                setAttachments(prev => [...prev, ...files]);
                                            }}
                                        />
                                        <Paperclip className="w-10 h-10 text-gray-300 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Click to attach files or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            PDF, Images, Documents up to 10MB
                                        </p>
                                    </div>

                                    {attachments.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            {attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm font-bold text-blue-500 text-[10px] uppercase">
                                                            FILE
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400">
                                                                {(file.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                        <span>Email Content Body</span>
                                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={() => setEditorMode('visual')}
                                                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                                editorMode === 'visual' 
                                                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <Eye size={12} /> VISUAL
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditorMode('html')}
                                                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                                editorMode === 'html' 
                                                ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <Code size={12} /> HTML
                                            </button>
                                        </div>
                                    </label>
                                    <p className="text-[10px] text-gray-400 italic mb-4">
                                        Use <strong>[Name]</strong> to personalize each email.
                                    </p>

                                    {/* Element Inserter */}
                                    <div className="mb-6">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Insert Elements</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(THEMED_BOXES).map(([key, box]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setEmailBody(prev => prev + box.html)}
                                                    className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-all hover:shadow-md active:scale-95 ${box.class}`}
                                                >
                                                    + {box.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {editorMode === 'visual' ? (
                                        <div className="bg-[#fceef0] dark:bg-gray-950 p-4 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl relative min-h-[700px] flex flex-col">
                                            {/* Mock Mobile App Header */}
                                            <div className="flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300">
                                                <div className="flex items-center gap-6">
                                                    <ArrowLeft size={20} />
                                                    <div className="w-8 h-8 flex items-center justify-center">
                                                        <Zap size={22} className="text-gray-400" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <Archive size={18} />
                                                    <Trash size={18} />
                                                    <MailIcon size={18} />
                                                    <MoreVertical size={18} />
                                                </div>
                                            </div>

                                            {/* Sender Info Row */}
                                            <div className="px-5 py-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                                                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm font-bold text-gray-900 dark:text-white">HITAM AI CLUB</span>
                                                            <span className="text-xs text-gray-400">6:16 PM</span>
                                                        </div>
                                                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                                                            to me <ChevronDown size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-5 text-gray-400">
                                                    <Smile size={18} />
                                                    <ArrowLeft size={18} className="rotate-180" />
                                                    <MoreVertical size={18} />
                                                </div>
                                            </div>

                                            {/* The Email Card (600px) */}
                                            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
                                                <div className="max-w-[600px] mx-auto bg-white shadow-xl rounded-[24px] overflow-hidden border border-gray-100/50">
                                                    <div className="min-h-[500px]">
                                                        <style>
                                                            {`.ql-container.ql-snow { border: none !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                                                            .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #f9fafb !important; background: #fff !important; padding: 12px 20px !important; }
                                                            .ql-editor { min-height: 500px; padding: 35px !important; color: #111827 !important; line-height: 1.6; }
                                                            .ql-editor p { margin-bottom: 14px; }
                                                            .ql-editor h2 { color: #10b981 !important; font-weight: 700 !important; font-size: 24px !important; margin-bottom: 20px !important; }`}
                                                        </style>
                                                        <ReactQuill
                                                            theme="snow"
                                                            value={emailBody}
                                                            onChange={setEmailBody}
                                                            modules={QUILL_MODULES}
                                                            className="dark:text-gray-900"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                                <div className="w-8 h-1 bg-gray-400/20 rounded-full" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#fceef0] dark:bg-gray-900 p-4 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-2xl relative min-h-[700px] flex flex-col">
                                             <div className="max-w-[600px] mx-auto bg-white shadow-xl rounded-[24px] overflow-hidden border border-gray-100/50 flex-1 flex flex-col">
                                                <textarea
                                                    value={emailBody}
                                                    onChange={(e) => setEmailBody(e.target.value)}
                                                    rows={16}
                                                    className="w-full p-8 text-sm font-mono bg-white text-gray-900 outline-none border-0 flex-1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Preview Button/Section */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        <strong>Pro Tip:</strong> Use the <code>[Name]</code> tag to personalize your email. 
                                        Emails are sent sequentially to avoid spam filters. CC'd addresses will receive a copy of every email sent.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (window.confirm("Clear all composition?")) {
                                                setEmailSubject('');
                                                setEmailBody('');
                                                setEmailCc('');
                                            }
                                        }}
                                        disabled={isSending}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={handleSendBulk}
                                        loading={isSending}
                                        icon={<Send className="w-4 h-4" />}
                                        className="shadow-lg shadow-blue-500/20"
                                    >
                                        Launch Broadast
                                    </Button>
                                </div>
                            </div>

                            {/* Sending Overlay */}
                            <AnimatePresence>
                                {isSending && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-white/90 dark:bg-gray-800/95 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-sm"
                                    >
                                        <div className="relative">
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Mail className="w-8 h-8 text-blue-600" />
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-2xl font-bold mt-8 text-gray-900 dark:text-white">
                                            Dispatching Envelopes
                                        </h3>
                                        <p className="text-gray-500 text-center mt-2 max-w-xs">
                                            Hand-delivering your message to {selectedRecipients.length} members. Do not close this tab.
                                        </p>
                                        
                                        <div className="w-full max-w-md mt-10">
                                            <div className="flex items-center justify-between text-xs font-semibold uppercase text-gray-400 mb-2 tracking-widest">
                                                <span>Progress</span>
                                                <span>{sendProgress.total > 0 ? Math.round((sendProgress.current / sendProgress.total) * 100) : 0}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                                />
                                            </div>
                                            <p className="text-center mt-4 text-sm font-medium text-blue-600">
                                                Processed {sendProgress.current} of {sendProgress.total} 
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Recent Results Summary */}
                        {sendResults && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">Last Broadcast Successful</h4>
                                        <p className="text-sm text-gray-500">{sendResults.success} sent, {sendResults.failed} failed</p>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSendResults(null)}
                                >
                                    Dismiss
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                }
            `}</style>
        </div>
    );
};

const CalendarIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

export default MailPage;
