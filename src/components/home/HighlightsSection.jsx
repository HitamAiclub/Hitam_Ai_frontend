import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiImage, FiVideo, FiX } from 'react-icons/fi';
import { differenceInDays, parseISO } from 'date-fns';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const HighlightsSection = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedMedia, setSelectedMedia] = useState(null);

    useEffect(() => {
        fetchActiveHighlights();
    }, []);

    const fetchActiveHighlights = async () => {
        try {
            // 1. Get all unique week names from Firestore to find the active one
            // Ideally we'd scan folders in Cloudinary, but we are moving to Firestore source of truth for descriptions
            // Let's query all known highlights and find the active week
            const allHighlightsQuery = query(collection(db, "highlights"), orderBy("week", "desc"));
            const allHighlightsSnapshot = await getDocs(allHighlightsQuery);

            const uniqueWeeks = new Set();
            allHighlightsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.week) {
                    uniqueWeeks.add(data.week);
                }
            });

            // Convert to array and sort desc
            const sortedWeeks = Array.from(uniqueWeeks).sort((a, b) => b.localeCompare(a));

            // 2. Find ALL active weeks (within 7 days)
            const activeWeeks = [];
            for (const week of sortedWeeks) {
                try {
                    const diff = differenceInDays(new Date(), parseISO(week));
                    if (diff >= 0 && diff < 7) {
                        activeWeeks.push(week);
                    }
                } catch (e) {
                    console.warn(`Could not parse week name as date: ${week}`, e);
                }
            }

            if (activeWeeks.length === 0) {
                setLoading(false);
                return;
            }

            // 3. Fetch media from Firestore for ALL active weeks
            // Firestore 'in' query supports up to 10 values, which is plenty for 7 days
            const q = query(
                collection(db, "highlights"),
                where("week", "in", activeWeeks)
            );
            const querySnapshot = await getDocs(q);
            const files = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            setMedia(files);
            setLoading(false);

        } catch (error) {
            console.error("Error loading highlights:", error);
            setLoading(false);
        }
    };

    // Auto-advance slideshow
    useEffect(() => {
        if (media.length <= 1) return;

        const timer = setInterval(() => {
            if (!selectedMedia) {
                setCurrentIndex(prev => (prev + 1) % media.length);
            }
        }, 5000);

        return () => clearInterval(timer);
    }, [media.length, selectedMedia]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % media.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);

    if (loading || media.length === 0) return null;

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent inline-block mb-4">
                            Weekly Highlights
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto rounded-full"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">
                            Catch up on this week's top moments!
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="w-full relative group h-[80vh] min-h-[600px]">
                {/* Main Showcase */}
                <div className="relative w-full h-full bg-black overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center cursor-pointer"
                            onClick={() => setSelectedMedia(media[currentIndex])}
                        >
                            {media[currentIndex].resourceType === 'video' ? (
                                <video
                                    src={media[currentIndex].url}
                                    className="w-full h-full object-contain bg-black"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={media[currentIndex].url}
                                    alt={media[currentIndex].name}
                                    className="w-full h-full object-contain transform transition-transform duration-700 group-hover:scale-110"
                                />
                            )}

                            {/* Overlay / Description */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 transition-opacity flex flex-col justify-end p-8 md:p-12">
                                {media[currentIndex].description && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={`desc-${currentIndex}`}
                                        className="max-w-4xl mx-auto w-full"
                                    >
                                        <p className="text-white text-lg md:text-3xl font-semibold leading-relaxed drop-shadow-md text-center">
                                            {media[currentIndex].description}
                                        </p>
                                    </motion.div>
                                )}
                                <div className="mt-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white/80 text-sm bg-black/40 px-6 py-2 rounded-full border border-white/10 hover:bg-black/60 transition-colors cursor-pointer">
                                        Click to Expand
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    {media.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
                            >
                                <FiChevronLeft size={32} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
                            >
                                <FiChevronRight size={32} />
                            </button>
                        </>
                    )}

                    {/* Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                        {media.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedMedia && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                        onClick={() => setSelectedMedia(null)}
                    >
                        <button
                            className="absolute top-4 right-4 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md z-50 flex items-center gap-2 transition-all pointer-events-auto"
                            onClick={() => setSelectedMedia(null)}
                        >
                            <span className="text-sm font-medium">Close</span>
                            <FiX size={20} />
                        </button>

                        <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-6 pointer-events-none">
                            <div className="relative w-full max-w-7xl max-h-[80vh] flex justify-center pointer-events-auto" onClick={e => e.stopPropagation()}>
                                {selectedMedia.resourceType === 'video' ? (
                                    <video
                                        src={selectedMedia.url}
                                        className="w-full h-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                        controls
                                        autoPlay
                                    />
                                ) : (
                                    <img
                                        src={selectedMedia.url}
                                        alt={selectedMedia.name}
                                        className="w-full h-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                    />
                                )}
                            </div>
                            {selectedMedia.description && (
                                <p
                                    className="text-white text-center text-xl md:text-2xl max-w-4xl bg-black/50 p-6 rounded-2xl backdrop-blur-md pointer-events-auto"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {selectedMedia.description}
                                </p>
                            )}

                            <button
                                onClick={() => setSelectedMedia(null)}
                                className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm transition-colors pointer-events-auto flex items-center gap-2"
                            >
                                <FiX /> Close Expanded View
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default HighlightsSection;
