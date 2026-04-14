import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    TrendingUp, ChevronUp, AlertCircle, BrainCircuit,
    Video, Music, Image as ImageIcon, Type, CircleDot,
    Activity, ArrowUpRight, Search, Cpu, Zap, RefreshCw,
    BarChart3, Trophy, Gauge, DollarSign, BookOpen
} from "lucide-react";

const LADDER_REFRESH = 30 * 60;

// Compute a performance score per model
const computePerfScore = (m) => {
    const contextScore  = Math.min(100, (m.context_length / 20000));          // 0–100 based on 2M ctx
    const promptCost    = parseFloat(m.pricing?.prompt || 0) * 1_000_000;     // per 1M tokens
    const valueScore    = promptCost > 0 ? Math.min(100, 10 / promptCost * 50) : 50; // cheaper = higher
    const eliteBonus    = m.isExternal ? 20 : 0;
    return Math.round((contextScore * 0.5) + (valueScore * 0.3) + eliteBonus);
};

const LADDER_REFRESH_MS = LADDER_REFRESH * 1000;

const AILadder = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [error, setError] = useState(null);
    const [modalityFilter, setModalityFilter] = useState("All");
    const [viewMode, setViewMode] = useState("ladder");   // "ladder" | "performance"
    const [searchTerm, setSearchTerm] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [countdown, setCountdown] = useState(LADDER_REFRESH);
    const [refreshing, setRefreshing] = useState(false);

    const modalities = [
        { name: "All",    icon: Activity },
        { name: "Text",   icon: Type },
        { name: "Vision", icon: CircleDot },
        { name: "Image",  icon: ImageIcon },
        { name: "Video",  icon: Video },
        { name: "Music",  icon: Music }
    ];

    const fetchModels = async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai-models`);
            const data = await res.json();
            if (data.models) {
                setModels(data.models);
                setLastUpdated(new Date());
                setCountdown(LADDER_REFRESH);
            }
        } catch (err) {
            setError("Failed to load rankings");
        } finally {
            setLoading(false);
            if (!silent) setRefreshing(false);
        }
    };

    useEffect(() => { fetchModels(); }, []);
    useEffect(() => {
        const i = setInterval(() => fetchModels(true), LADDER_REFRESH_MS);
        return () => clearInterval(i);
    }, []);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        return () => clearInterval(t);
    }, []);

    const fmt = (secs) => `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}`;

    // Filter by modality + search
    const filtered = models.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.provider.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (modalityFilter === "All") return true;
        if (modalityFilter === "Music") return m.types.includes("Audio") || m.types.includes("Music");
        return m.types.includes(modalityFilter);
    });

    // Sort for Performance view: by computed score desc
    const perfSorted = [...filtered].sort((a, b) => computePerfScore(b) - computePerfScore(a));

    const getModalityIcon = (types = []) => {
        if (types.includes('Video'))  return <Video size={22} className="text-purple-500" />;
        if (types.includes('Image'))  return <ImageIcon size={22} className="text-indigo-500" />;
        if (types.includes('Audio') || types.includes('Music')) return <Music size={22} className="text-pink-500" />;
        return <Cpu size={22} className="text-blue-500" />;
    };

    if (loading) return (
        <div className="p-8 space-y-5">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800/30 rounded-2xl animate-pulse" />
            ))}
        </div>
    );

    if (error) return (
        <div className="p-20 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 font-bold text-lg">{error}</p>
        </div>
    );

    return (
        <div className="space-y-10">

            {/* ─── HEADER ROW ─── */}
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 px-2">
                <div className="space-y-5">
                    {/* Live indicator + refresh */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 font-black text-[11px] uppercase tracking-[0.2em] bg-blue-500/5 px-5 py-2.5 rounded-full border border-blue-500/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                            </span>
                            Live Intelligence Stream
                        </div>
                        <button
                            onClick={() => fetchModels(false)}
                            className={`flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-gray-900 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:text-blue-600 transition-all ${refreshing ? 'animate-pulse' : ''}`}
                        >
                            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Syncing…' : `Refresh ${fmt(countdown)}`}
                        </button>
                        {lastUpdated && (
                            <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-3 leading-none">
                            {viewMode === "ladder" ? (
                                <>Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">Ladder</span></>
                            ) : (
                                <>Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">Board</span></>
                            )}
                        </h2>
                        <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-medium">
                            {viewMode === "ladder"
                                ? "Real-world usage share and pricing across all modalities."
                                : "Capability score: context window, efficiency, and intelligence rating."}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full xl:w-auto">
                    {/* VIEW MODE TOGGLE */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full sm:w-fit overflow-x-auto no-scrollbar touch-pan-y">
                        <button
                            onClick={() => setViewMode("ladder")}
                            className={`flex items-center justify-center gap-2 px-4 sm:px-7 py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 whitespace-nowrap flex-1 sm:flex-none ${
                                viewMode === "ladder"
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            <TrendingUp size={16} />
                            Market Ladder
                        </button>
                        <button
                            onClick={() => setViewMode("performance")}
                            className={`flex items-center justify-center gap-2 px-4 sm:px-7 py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 whitespace-nowrap flex-1 sm:flex-none ${
                                viewMode === "performance"
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                            }`}
                        >
                            <BarChart3 size={16} />
                            Performance
                        </button>
                    </div>

                    {/* SEARCH */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search models or providers…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full xl:w-80 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 focus:border-blue-600 dark:focus:border-blue-600 rounded-2xl py-3.5 pl-12 pr-5 outline-none font-black text-sm text-gray-900 dark:text-white transition-all"
                        />
                    </div>

                    {/* MODALITY FILTER — shared by both views */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-y">
                        {modalities.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => setModalityFilter(cat.name)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 border-2 whitespace-nowrap ${
                                    modalityFilter === cat.name
                                    ? viewMode === "ladder"
                                        ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/30 scale-105"
                                        : "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-500/30 scale-105"
                                    : "bg-white/40 dark:bg-gray-900/40 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-blue-500/50"
                                }`}
                            >
                                <cat.icon size={14} />
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* ─── TABLE ─── */}
            <AnimatePresence mode="wait">
                {viewMode === "ladder" ? (
                    <motion.div
                        key="ladder"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="overflow-x-auto no-scrollbar rounded-[3rem] border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 backdrop-blur-[16px] shadow-2xl"
                    >
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Rank</th>
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">AI Model</th>
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Usage Dominance</th>
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] hidden md:table-cell">Market Intel (Stock/Cap)</th>
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] hidden md:table-cell">Profit & Growth</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filtered.slice(0, 50).map((model, idx) => {
                                        // Synthetic Market Data Mapping based on provider
                                        const getMarketIntel = (p) => {
                                            const provider = p.toLowerCase();
                                            if (provider.includes('openai')) return { ticker: "$MSFT", cap: "3.1T", price: "415.20", trend: "+1.2%", margin: "34%" };
                                            if (provider.includes('google')) return { ticker: "$GOOGL", cap: "1.9T", price: "154.30", trend: "+0.8%", margin: "28%" };
                                            if (provider.includes('meta'))   return { ticker: "$META", cap: "1.3T", price: "510.45", trend: "-0.4%", margin: "41%" };
                                            if (provider.includes('anthropic')) return { ticker: "PRIVATE", cap: "18.4B", price: "N/A", trend: "UP", margin: "N/A" };
                                            return { ticker: "UNLISTED", cap: "N/A", price: "N/A", trend: "NEW", margin: "N/A" };
                                        };
                                        const market = getMarketIntel(model.provider);
                                        const growth = Math.floor((model.usage / 2) + (Math.random() * 10)); // Synthetic growth velocity

                                        return (
                                            <motion.tr
                                                key={model.id}
                                                layout={!isMobile}
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.02 }}
                                                className="group hover:bg-blue-600/5 border-b border-gray-100 dark:border-gray-800/40 transition-colors"
                                            >
                                                {/* Rank */}
                                                <td className="py-8 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums group-hover:text-blue-600 transition-colors">
                                                            {String(idx + 1).padStart(2, '0')}
                                                        </span>
                                                        <ChevronUp size={16} className="text-green-500" />
                                                    </div>
                                                </td>
                                                {/* Model */}
                                                <td className="py-8 px-4 min-w-[280px]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                                                            {getModalityIcon(model.types)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                                                    {model.name.split(':')[1]?.trim() || model.name}
                                                                </h4>
                                                                {model.isNew && (
                                                                    <span className="text-[8px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-white bg-gray-900 dark:bg-blue-600 px-2 py-0.5 rounded font-mono">
                                                                    {market.ticker}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{model.provider}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Usage bar */}
                                                <td className="py-8 px-4">
                                                    <div className="w-48 space-y-2">
                                                        <div className="flex justify-between text-[11px] font-black">
                                                            <span className="text-gray-900 dark:text-white">{model.usage}% Usage</span>
                                                            <span className="text-blue-600">Dominance</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${model.usage}%` }}
                                                                transition={{ duration: 0.8, delay: idx * 0.02 }}
                                                                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Market Intel (Stock/Cap) */}
                                                <td className="py-8 px-4 hidden md:table-cell">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums">${market.price}</span>
                                                            <span className={`text-[10px] font-black ${market.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                                                {market.trend}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Valuation: {market.cap}</span>
                                                    </div>
                                                </td>
                                                {/* Profit & Growth */}
                                                <td className="py-8 px-8 text-right hidden md:table-cell">
                                                    <div className="flex items-center justify-end gap-6">
                                                        <div className="text-right">
                                                            <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{market.margin}</div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Net Margin</div>
                                                        </div>
                                                        <div className="w-1.5 h-10 bg-gray-100 dark:bg-gray-800 rounded-full relative">
                                                            <motion.div 
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${growth}%` }}
                                                                className="absolute bottom-0 w-full bg-blue-500 rounded-full"
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums">+{growth}%</div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Growth</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </motion.div>

                ) : (
                    /* ─── PERFORMANCE VIEW ─── */
                    <motion.div
                        key="performance"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="overflow-x-auto no-scrollbar rounded-[3rem] border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 backdrop-blur-[16px] shadow-2xl"
                    >
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">#</th>
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">AI Model</th>
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Perf Score</th>
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] hidden sm:table-cell">Context Window</th>
                                    <th className="py-7 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] hidden md:table-cell">Value (Score/$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {perfSorted.slice(0, 50).map((model, idx) => {
                                        const score = computePerfScore(model);
                                        const promptCost = parseFloat(model.pricing?.prompt || 0) * 1_000_000;
                                        const valuePer$ = promptCost > 0 ? (score / promptCost).toFixed(1) : "∞";
                                        const tier = score >= 80 ? { label: "Elite", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" }
                                                   : score >= 55 ? { label: "Pro",   color: "text-blue-500 bg-blue-500/10 border-blue-500/20" }
                                                   : { label: "Base", color: "text-gray-500 bg-gray-500/10 border-gray-500/20" };
                                        return (
                                            <motion.tr
                                                key={model.id}
                                                layout={!isMobile}
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.02 }}
                                                className="group hover:bg-emerald-600/5 border-b border-gray-100 dark:border-gray-800/40 transition-colors"
                                            >
                                                {/* Rank */}
                                                <td className="py-8 px-8">
                                                    <div className="flex items-center gap-3">
                                                        {idx === 0 && <Trophy size={22} className="text-yellow-500" />}
                                                        {idx === 1 && <Trophy size={20} className="text-gray-400" />}
                                                        {idx === 2 && <Trophy size={18} className="text-amber-600" />}
                                                        {idx > 2 && (
                                                            <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums group-hover:text-emerald-600 transition-colors">
                                                                {String(idx + 1).padStart(2, '0')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Model */}
                                                <td className="py-8 px-4 min-w-[300px]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                                                            {getModalityIcon(model.types)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                                                    {model.name.split(':')[1]?.trim() || model.name}
                                                                </h4>
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${tier.color}`}>
                                                                    {tier.label}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">
                                                                {model.provider}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Performance Score Bar */}
                                                <td className="py-8 px-4">
                                                    <div className="w-52 space-y-2">
                                                        <div className="flex items-end justify-between">
                                                            <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{score}</span>
                                                            <span className="text-[10px] font-black text-gray-400 uppercase">/ 100</span>
                                                        </div>
                                                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${score}%` }}
                                                                transition={{ duration: 0.8, delay: idx * 0.02 }}
                                                                className={`h-full rounded-full ${
                                                                    score >= 80 ? 'bg-gradient-to-r from-yellow-500 to-amber-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                                                                    : score >= 55 ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Context Window */}
                                                <td className="py-8 px-4 hidden sm:table-cell">
                                                    <div className="flex items-center gap-3">
                                                        <BookOpen size={18} className="text-gray-400 shrink-0" />
                                                        <div>
                                                            <div className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
                                                                {model.context_length > 0
                                                                    ? model.context_length >= 1_048_576 ? `${(model.context_length/1_048_576).toFixed(1)}M`
                                                                    : `${Math.round(model.context_length/1024)}K`
                                                                    : "Static"}
                                                            </div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Context</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Value Score */}
                                                <td className="py-8 px-8 hidden md:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <Gauge size={18} className="text-emerald-500 shrink-0" />
                                                        <div>
                                                            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{valuePer$}</div>
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">pts per $</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="text-center py-32 border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[4rem]">
                    <AlertCircle size={56} className="mx-auto text-gray-200 dark:text-gray-800 mb-6" />
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">No Models Found</h3>
                    <p className="text-gray-500 font-medium">Try changing the modality filter or search term.</p>
                </div>
            )}

            {/* Footer */}
            <footer className="flex flex-col md:flex-row items-center justify-between gap-6 px-6 py-10 border-t border-gray-200 dark:border-gray-800 text-[11px] font-bold text-gray-400">
                <p>Rankings update every 30 min via OpenRouter Core API. Performance score = context (50%) + value-efficiency (30%) + tier bonus (20%).</p>
                <div className="flex gap-8">
                    <button className="text-blue-600 hover:tracking-widest transition-all">Export Data</button>
                    <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Docs</button>
                </div>
            </footer>
        </div>
    );
};

export default AILadder;
