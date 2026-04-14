import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NewsMarquee from "./NewsMarquee";
import { Signal, Zap, Activity } from "lucide-react";

/**
 * IntelligenceStream
 * Container for the dynamic home page news rows.
 * Fetches news and models, groups news by category, and renders NewsMarquee for each.
 */
const IntelligenceStream = () => {
    const [newsGroups, setNewsGroups] = useState({});
    const [topModels, setTopModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch
                const [newsRes, modelsRes] = await Promise.all([
                    fetch(`${API}/api/ai-news`),
                    fetch(`${API}/api/ai-models`)
                ]);

                const newsData = await newsRes.json();
                const modelsData = await modelsRes.json();

                if (newsData.items) {
                    // Group news by category
                    const groups = newsData.items.reduce((acc, item) => {
                        const cat = item.category || "General";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item);
                        return acc;
                    }, {});
                    setNewsGroups(groups);
                }

                if (modelsData.models) {
                    // Get top 10 models by usage for modeling row
                    setTopModels(modelsData.models.slice(0, 10));
                }
            } catch (err) {
                console.error("Stream Fetch Error:", err);
                setError("Network failure in intelligence stream");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="py-20 space-y-12">
                {[1, 2, 3].map(i => (
                    <div key={i} className="max-w-7xl mx-auto px-6">
                        <div className="h-6 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-6" />
                        <div className="flex gap-6 overflow-hidden">
                            {[1, 2, 3, 4].map(j => (
                                <div key={j} className="w-[320px] h-64 bg-gray-50 dark:bg-gray-800/40 rounded-[2rem] shrink-0 animate-pulse" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) return null;

    // Define a priority order for categories to show first
    const priority = ["India", "Global", "AI Models", "AI Tools", "Startups", "Visual AI", "Big Tech"];
    
    // Sort keys based on priority, then alphabetical
    const categories = Object.keys(newsGroups).sort((a, b) => {
        const indexA = priority.indexOf(a);
        const indexB = priority.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    // Extract the latest tools from the live feed
    const liveTools = Object.values(newsGroups)
        .flat()
        .filter(n => n.category === "AI Tools" || n.category === "AI Apps")
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 3) // Get top 3 latest tools
        .map(n => ({ ...n, type: "news" }));

    // Create a curated mixed stream
    const marketModels = topModels.slice(0, 2).map(m => ({ ...m, type: "model", subtype: "market" }));
    const performanceModels = topModels
        .filter(m => !marketModels.find(market => market.id === m.id))
        .sort((a, b) => (b.context_length || 0) - (a.context_length || 0))
        .slice(0, 2)
        .map(m => ({ ...m, type: "model", subtype: "performance" }));

    const shuffle = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    const mixedStream = shuffle([
        ...marketModels,
        ...liveTools, 
        ...performanceModels,
        ...Object.values(newsGroups)
            .flat()
            .filter(n => 
                n.category !== "AI Tools" && 
                n.category !== "AI Apps" &&
                !liveTools.find(tool => tool.link === n.link)
            ) 
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, 5) 
            .map(n => ({ ...n, type: "news" }))
    ]);

    return (
        <section className="py-24 relative overflow-hidden bg-white/30 dark:bg-transparent">
            {/* Header Content */}
            <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Intelligence Stream</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-none tracking-tighter mb-4">
                    The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Universal AI Feed</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium tracking-wide uppercase">
                    Real-time updates across Models • Tools • News • Startups
                </p>
            </div>

            {/* The One Single Unified Marquee */}
            <div className="relative">
                {mixedStream.length > 0 && (
                    <NewsMarquee 
                        items={mixedStream} 
                        type="mixed" // MarqueeCard will check item.type
                        speed={80} // Slower speed for a long single row
                        direction="left" 
                    />
                )}
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-t from-blue-500/5 to-transparent blur-3xl pointer-events-none" />
        </section>
    );
};

export default IntelligenceStream;
