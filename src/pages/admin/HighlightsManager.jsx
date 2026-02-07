import React, { useState, useEffect } from 'react';
import { format, differenceInDays, parseISO, isAfter, subDays } from 'date-fns';
import { FiPlus, FiImage, FiVideo, FiTrash2, FiCalendar, FiRefreshCw, FiExternalLink } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import CloudinaryUpload from '../../components/ui/CloudinaryUpload';
import { deleteFromCloudinary } from '../../utils/cloudinary';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ROOT_FOLDER = 'hitam_ai/highlites';

const HighlightsManager = () => {
    const [weeks, setWeeks] = useState([]);
    const [activeWeek, setActiveWeek] = useState(null);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [description, setDescription] = useState("");

    useEffect(() => {
        fetchWeeks();
    }, []);

    useEffect(() => {
        if (activeWeek) {
            fetchMedia(activeWeek);
        } else {
            setMediaFiles([]);
        }
    }, [activeWeek]);

    const fetchWeeks = async () => {
        setLoading(true);
        try {
            // Fetch folders inside hitam_ai/highlites
            const res = await fetch(`${API_URL}/api/cloudinary/folders?parent=${encodeURIComponent(ROOT_FOLDER)}`);
            if (res.ok) {
                const folders = await res.json();
                const sorted = folders.sort((a, b) => b.name.localeCompare(a.name));
                setWeeks(sorted);

                if (sorted.length > 0 && !activeWeek) {
                    setActiveWeek(sorted[0].name);
                }
            } else {
                setWeeks([]);
            }
        } catch (error) {
            console.error("Failed to fetch highlight weeks", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMedia = async (weekDate) => {
        setLoadingFiles(true);
        try {
            // Fetch from Firestore
            const q = query(
                collection(db, "highlights"),
                where("week", "==", weekDate)
            );
            const querySnapshot = await getDocs(q);
            const files = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setMediaFiles(files);
        } catch (error) {
            console.error("Failed to fetch media", error);
        } finally {
            setLoadingFiles(false);
        }
    };

    const handleCreateNewWeek = async () => {
        const today = format(new Date(), 'yyyy-MM-dd');

        if (weeks.find(w => w.name === today)) {
            alert("Highlight folder for today already exists!");
            setActiveWeek(today);
            return;
        }

        try {
            setLoading(true);
            const targetPath = `${ROOT_FOLDER}/${today}`;

            await fetch(`${API_URL}/api/cloudinary/create-folder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folderPath: targetPath,
                    folderName: 'media'
                })
            });

            await fetchWeeks();
            setActiveWeek(today);
            alert(`Created highlight week for ${today}`);

        } catch (error) {
            console.error(error);
            alert("Failed to create new highlight week");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = async (uploadResult) => {
        try {
            // Handle both single (object) and multiple (array) uploads
            const results = Array.isArray(uploadResult) ? uploadResult : [uploadResult];

            const promises = results.map(result =>
                addDoc(collection(db, "highlights"), {
                    week: activeWeek,
                    url: result.url,
                    publicId: result.publicId,
                    resourceType: result.resourceType,
                    format: result.format,
                    name: result.originalName,
                    description: description,
                    createdAt: new Date().toISOString()
                })
            );

            await Promise.all(promises);

            setDescription("");
            fetchMedia(activeWeek);
        } catch (error) {
            console.error("Failed to save highlight metadata", error);
            alert("Upload successful but failed to save description.");
        }
    };

    const handleDeleteFile = async (docId, publicId, resourceType) => {
        if (!confirm("Delete this highlight?")) return;
        try {
            await deleteFromCloudinary(publicId, resourceType);
            await deleteDoc(doc(db, "highlights", docId));

            fetchMedia(activeWeek);
        } catch (error) {
            console.error(error);
            alert("Failed to delete file");
        }
    };

    const handleDeleteWeek = async (weekName) => {
        if (!confirm(`Are you sure you want to delete ALL highlights for ${weekName}? This cannot be undone.`)) return;
        try {
            const folderPath = `${ROOT_FOLDER}/${weekName}`;
            await fetch(`${API_URL}/api/cloudinary/delete-folder`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderPath })
            });

            // Delete firestore docs
            const q = query(collection(db, "highlights"), where("week", "==", weekName));
            const querySnapshot = await getDocs(q);
            const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, "highlights", d.id)));
            await Promise.all(deletePromises);

            await fetchWeeks();
            if (activeWeek === weekName) setActiveWeek(null);

        } catch (error) {
            console.error(error);
            alert("Failed to delete week");
        }
    };

    const isWeekActive = (weekName) => {
        try {
            const date = parseISO(weekName);
            const daysDiff = differenceInDays(new Date(), date);
            return daysDiff < 7 && daysDiff >= 0;
        } catch {
            return false;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pt-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiCalendar className="text-purple-500" />
                        Weekly Highlights Manager
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage homepage highlights. Highlights are visible for 7 days from creation.
                    </p>
                </div>
                <Button onClick={handleCreateNewWeek} disabled={loading}>
                    <FiPlus className="mr-2" /> Start New Week
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-1 p-0 overflow-hidden h-fit">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">History</h3>
                        <button onClick={() => fetchWeeks()} className="text-gray-400 hover:text-blue-500">
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {weeks.length === 0 && !loading && (
                            <div className="p-4 text-center text-gray-400 text-sm">No highlights found</div>
                        )}
                        {weeks.map(week => {
                            const active = isWeekActive(week.name);
                            return (
                                <div
                                    key={week.name}
                                    onClick={() => setActiveWeek(week.name)}
                                    className={`
                                        p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors
                                        flex items-center justify-between group
                                        ${activeWeek === week.name ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-l-transparent'}
                                    `}
                                >
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{week.name}</div>
                                        <div className={`text-xs mt-1 inline-flex px-2 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                            {active ? 'Active on Home' : 'Expired'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteWeek(week.name); }}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <div className="lg:col-span-3 space-y-6">
                    {activeWeek ? (
                        <>
                            <Card className="p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                        Managing Week: {activeWeek}
                                    </h2>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 space-y-4">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add New Highlight</h4>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Description (Optional)</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Enter a description for this highlight..."
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                                        />
                                    </div>

                                    <CloudinaryUpload
                                        folder={`${ROOT_FOLDER}/${activeWeek}/media`}
                                        onUpload={handleUploadSuccess}
                                        buttonLabel="Upload & Save Highlight"
                                        showPreview={false}
                                        allowMultiple={true}
                                    />
                                    <p className="text-xs text-gray-400">
                                        Max size 10MB. Images and Videos supported.
                                    </p>
                                </div>
                            </Card>

                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                                    <FiImage /> Gallery ({mediaFiles.length})
                                </h3>
                                {loadingFiles ? (
                                    <div className="flex justify-center py-12">
                                        <FiRefreshCw className="animate-spin w-8 h-8 text-blue-500" />
                                    </div>
                                ) : mediaFiles.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="text-gray-400">No media uploaded for this week yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {mediaFiles.map(file => (
                                            <div key={file.id} className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                {file.resourceType === 'video' ? (
                                                    <video src={file.url} className="w-full h-full object-cover" controls />
                                                ) : (
                                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                )}

                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => window.open(file.url, '_blank')}
                                                        className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm"
                                                        title="View Original"
                                                    >
                                                        <FiExternalLink />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFile(file.id, file.publicId, file.resourceType)}
                                                        className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                                    {file.description && (
                                                        <p className="text-xs text-white font-medium line-clamp-2 mb-1" title={file.description}>
                                                            {file.description}
                                                        </p>
                                                    )}
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-gray-300 truncate opacity-70">{file.name}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase">{file.format}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                            <FiCalendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">Select a week to manage</p>
                            <Button variant="link" onClick={handleCreateNewWeek} className="mt-2 text-blue-500">
                                Or start a new one
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HighlightsManager;
