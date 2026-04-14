import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ExternalLink, 
    Calendar, 
    Newspaper, 
    ChevronRight, 
    Search, 
    RefreshCw,
    TrendingUp,
    Globe,
    Building2,
    Cpu,
    Rocket,
    Zap,
    CheckCircle2,
    Video,
    Wand2,
    Layout,
    Clock,
    Activity,
    Signal
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import AILadder from "../components/news/AILadder";
import ArticleImage from "../components/news/ArticleImage";

const REFRESH_INTERVAL = 5 * 60; // 5 minutes in seconds

const NewsPage = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

    const fetchNews = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai-news`);
            const data = await response.json();
            if (data.items) {
                setNews(data.items);
                setLastUpdated(new Date());
                setCountdown(REFRESH_INTERVAL);
            }
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setLoading(false);
            if (!silent) setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => fetchNews(true), REFRESH_INTERVAL * 1000);
        return () => clearInterval(interval);
    }, [fetchNews]);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        return () => clearInterval(timer);
    }, []);

    const categories = [
        { name: "All",           icon: Zap },
        { name: "Market Ladder", icon: TrendingUp, label: "Market Ladder 📈" },
        { name: "India",         icon: Globe,      label: "India 🇮🇳" },
        { name: "Global",        icon: Globe,      label: "Global 🌍" },
        { name: "AI Models",     icon: Cpu,        label: "AI Models 🧪" },
        { name: "AI Tools",      icon: Wand2,      label: "AI Tools 🧠" },
        { name: "Visual AI",     icon: Video,      label: "Visual AI 🎥" },
        { name: "Startups",      icon: Rocket,     label: "Startups 🚀" },
        { name: "Big Tech",      icon: Building2,  label: "Big Tech 🏢" },
    ];

    const filteredNews = news.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === "All") return matchesSearch;
        if (activeTab === "India") return matchesSearch && item.region === "India";
        if (activeTab === "Global") return matchesSearch && item.region === "Global";
        if (activeTab === "AI Models") return matchesSearch && item.categories?.includes("AI Models");
        if (activeTab === "Visual AI") return matchesSearch && item.categories?.includes("Visual AI");
        if (activeTab === "AI Tools") return matchesSearch && (item.categories?.includes("AI Tools") || item.categories?.includes("AI Apps"));
        if (activeTab === "Startups") return matchesSearch && item.categories?.includes("Startups");
        if (activeTab === "Big Tech") return matchesSearch && item.categories?.includes("Big Tech");
        if (activeTab === "AI Apps") return matchesSearch && item.categories?.includes("AI Apps");
        return matchesSearch;
    });

    const featuredNews = filteredNews[0];
    const regularNews = filteredNews.slice(activeTab === "All" && !searchTerm ? 1 : 0);

    const formatTime = (date) => {
        if (!date) return "";
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatCountdown = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen pt-20 md:pt-28 pb-20 px-4 bg-transparent relative overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <header className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-sm mb-4"
                    >
                        {/* LIVE Pill */}
                        <span className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-1.5 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Live 24h Feed
                        </span>
                        <span className="text-gray-400 font-medium tracking-normal text-xs">
                            Intelligence Hub v3
                        </span>
                    </motion.div>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter"
                            >
                                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Intelligence</span>
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed"
                            >
                                Live AI & Tech news from the last 24 hours. Auto-refreshes every 5 minutes.
                            </motion.p>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-3"
                        >
                            {/* Search + Refresh */}
                            <div className="flex items-center gap-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-2 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search intelligence..." 
                                        className="bg-transparent border-none outline-none pl-10 pr-4 py-2 w-full md:w-64 text-gray-900 dark:text-white font-medium"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => fetchNews(false)}
                                    className={refreshing ? "animate-spin" : ""}
                                >
                                    <RefreshCw size={18} />
                                </Button>
                            </div>
                            {/* Last updated + countdown */}
                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-2">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Connecting..."}
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-500">
                                    <Signal size={12} className="animate-pulse" />
                                    Refresh in {formatCountdown(countdown)}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                        {categories.map((cat, idx) => (
                            <motion.button
                                key={cat.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setActiveTab(cat.name)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 whitespace-nowrap border-2 ${
                                    activeTab === cat.name 
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/30" 
                                    : "bg-white/40 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-800/50 hover:border-blue-500/50"
                                }`}
                            >
                                <cat.icon size={18} />
                                {cat.label || cat.name}
                                {cat.name === "All" && news.length > 0 && (
                                    <span className="ml-1 text-[10px] bg-white/20 dark:bg-gray-800/50 px-2 py-0.5 rounded-full">
                                        {news.length}
                                    </span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[400px] bg-gray-100 dark:bg-gray-800/40 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Tab: Market Ladder */}
                        {activeTab === "Market Ladder" ? (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-6"
                            >
                                <AILadder />
                            </motion.div>
                        ) : (
                            <>
                                {/* Featured News */}
                                {activeTab === "All" && !searchTerm && featuredNews && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-16 overflow-hidden rounded-[3rem] border border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl shadow-2xl group"
                                    >
                                        <div className="flex flex-col lg:flex-row">
                                            <div className="w-full lg:w-1/2 p-12 md:p-20 flex flex-col justify-center relative z-20">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <span className="px-5 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                                        <span className="relative flex h-1.5 w-1.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                                        </span>
                                                        Latest
                                                    </span>
                                                    <span className="px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                                        {featuredNews.region}
                                                    </span>
                                                    {featuredNews.publishedAgo && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                                            <Clock size={12} />
                                                            {featuredNews.publishedAgo}
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-8 leading-[1.05] tracking-tighter">
                                                    <a href={featuredNews.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                        {featuredNews.title}
                                                    </a>
                                                </h2>
                                                
                                                {/* Real short description if available */}
                                                {featuredNews.shortDesc && (
                                                    <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mb-6 leading-relaxed">
                                                        {featuredNews.shortDesc}
                                                    </p>
                                                )}

                                                {/* Context-aware bullets — never the title */}
                                                <div className="space-y-4 mb-10">
                                                    {(featuredNews.bullets || []).map((bullet, i) => (
                                                        <div key={i} className="flex items-start gap-4">
                                                            <CheckCircle2 size={24} className="text-blue-600 shrink-0 mt-0.5" />
                                                            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-normal">{bullet}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-8">
                                                    <a 
                                                        href={featuredNews.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="group flex items-center gap-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-all"
                                                    >
                                                        Explore Story
                                                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                                    </a>
                                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">{featuredNews.source}</span>
                                                </div>
                                            </div>
                                            <div className="w-full lg:w-1/2 relative aspect-[16/10] md:aspect-[16/9] lg:aspect-auto lg:min-h-auto overflow-hidden bg-gray-900 shadow-inner">
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/40 dark:from-gray-900/40 via-transparent to-transparent z-10 hidden lg:block"></div>
                                                <ArticleImage
                                                    key={featuredNews.link}
                                                    articleUrl={featuredNews.link}
                                                    fallback={featuredNews.imageUrl}
                                                    alt={featuredNews.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110 z-0"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* News Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <AnimatePresence mode="popLayout">
                                        {regularNews.map((item, index) => (
                                            <motion.div
                                                key={`${item.title}-${index}`}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ delay: Math.min(index * 0.04, 0.5) }}
                                            >
                                                <Card className="h-full flex flex-col bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 group overflow-hidden">
                                                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-900 to-blue-950">
                                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-transparent z-10"></div>
                                                        <ArticleImage
                                                            key={item.link}
                                                            articleUrl={item.link}
                                                            fallback={item.imageUrl}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 relative z-0"
                                                        />
                                                        <div className="absolute top-4 left-5 z-20 flex gap-2 flex-wrap">
                                                            <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                                {item.category}
                                                            </span>
                                                            <span className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                                                                {item.region === "India" ? "🇮🇳 India" : "🌍 Global"}
                                                            </span>
                                                        </div>
                                                        {/* Time ago badge */}
                                                        {item.publishedAgo && (
                                                            <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10">
                                                                <Clock size={10} />
                                                                {item.publishedAgo}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-8 flex flex-col flex-grow">
                                                        <div className="flex items-center justify-between mb-5">
                                                            <span className="text-[11px] font-black text-gray-500 flex items-center gap-1.5">
                                                                <Calendar size={13} className="text-blue-500" />
                                                                {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[120px]">{item.source}</span>
                                                        </div>

                                                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-5 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                                                                {item.title}
                                                            </a>
                                                        </h3>

                                                        <div className="mb-6 flex-grow">
                                                            {/* Description: only show if genuinely different from title */}
                                                            {item.shortDesc && item.shortDesc.trim() !== item.title.trim() ? (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium line-clamp-3 leading-relaxed">
                                                                    {item.shortDesc}
                                                                </p>
                                                            ) : item.points?.[1] ? (
                                                                <div className="flex items-start gap-2.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium line-clamp-3">{item.points[1]}</p>
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        <div className="mt-auto pt-5 border-t border-gray-100 dark:border-gray-800">
                                                            <a 
                                                                href={item.link} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all group/btn"
                                                            >
                                                                Explore Story
                                                                <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </>
                )}

                {!loading && filteredNews.length === 0 && activeTab !== "Market Ladder" && (
                    <div className="text-center py-40">
                        <Newspaper size={80} className="mx-auto text-gray-200 dark:text-gray-800 mb-6" />
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">No Live Signals Detected</h3>
                        <p className="text-gray-500 font-medium text-lg mb-8">No news in the last 24h matches this filter.</p>
                        <button 
                            onClick={() => { setSearchTerm(""); setActiveTab("All"); }}
                            className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors"
                        >
                            Reset Intelligence Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsPage;
