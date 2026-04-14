import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, ChevronUp, AlertCircle,
    Video, Music, Image as ImageIcon, Type, CircleDot,
    Activity, Search, Cpu, RefreshCw,
    BarChart3, Trophy, Gauge, BookOpen
} from "lucide-react";

const LADDER_REFRESH = 30 * 60;
const LADDER_REFRESH_MS = LADDER_REFRESH * 1000;

const computePerfScore = (m) => {
    const contextScore = Math.min(100, (m.context_length / 20000));
    const promptCost   = parseFloat(m.pricing?.prompt || 0) * 1_000_000;
    const valueScore   = promptCost > 0 ? Math.min(100, 10 / promptCost * 50) : 50;
    const eliteBonus   = m.isExternal ? 20 : 0;
    return Math.round((contextScore * 0.5) + (valueScore * 0.3) + eliteBonus);
};

const getMarketIntel = (p) => {
    const provider = p.toLowerCase();
    if (provider.includes('openai'))    return { ticker: "$MSFT",   cap: "3.1T",  price: "415.20", trend: "+1.2%", margin: "34%" };
    if (provider.includes('google'))    return { ticker: "$GOOGL",  cap: "1.9T",  price: "154.30", trend: "+0.8%", margin: "28%" };
    if (provider.includes('meta'))      return { ticker: "$META",   cap: "1.3T",  price: "510.45", trend: "-0.4%", margin: "41%" };
    if (provider.includes('anthropic')) return { ticker: "PRIVATE", cap: "18.4B", price: "N/A",    trend: "UP",    margin: "N/A" };
    return { ticker: "UNLISTED", cap: "N/A", price: "N/A", trend: "NEW", margin: "N/A" };
};

const ModalityIcon = ({ types, size = 18 }) => {
    if (types.includes('Video'))  return <Video  size={size} className="text-purple-500" />;
    if (types.includes('Image'))  return <ImageIcon size={size} className="text-indigo-500" />;
    if (types.includes('Audio') || types.includes('Music')) return <Music size={size} className="text-pink-500" />;
    return <Cpu size={size} className="text-blue-500" />;
};

/* Lightweight CSS-only progress bar */
const Bar = ({ pct, color }) => (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
            style={{ width: `${pct}%` }}
        />
    </div>
);

const MODALITIES = [
    { name: "All",    icon: Activity },
    { name: "Text",   icon: Type },
    { name: "Vision", icon: CircleDot },
    { name: "Image",  icon: ImageIcon },
    { name: "Video",  icon: Video },
    { name: "Music",  icon: Music },
];

const fmt = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

/* ─── MOBILE LADDER CARD ─── */
const LadderCard = React.memo(({ model, idx, growth }) => {
    const market = useMemo(() => getMarketIntel(model.provider), [model.provider]);
    return (
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800/50">
            <div className="flex flex-col items-center w-7 shrink-0">
                <span className="text-lg font-black text-gray-800 dark:text-white tabular-nums leading-none">
                    {String(idx + 1).padStart(2, '0')}
                </span>
                <ChevronUp size={11} className="text-green-500 mt-0.5" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow shrink-0">
                <ModalityIcon types={model.types} size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight">
                        {model.name.split(':')[1]?.trim() || model.name}
                    </span>
                    {model.isNew && (
                        <span className="text-[7px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full shrink-0">NEW</span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[9px] font-black text-white bg-gray-900 dark:bg-blue-600 px-1.5 py-0.5 rounded font-mono">{market.ticker}</span>
                    <span className="text-[9px] text-gray-400 truncate">{model.provider}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <Bar pct={model.usage} color="bg-gradient-to-r from-blue-600 to-purple-600" />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 shrink-0 tabular-nums">{model.usage}%</span>
                </div>
            </div>
        </div>
    );
});

/* ─── MOBILE PERFORMANCE CARD ─── */
const PerfCard = React.memo(({ model, idx }) => {
    const score = useMemo(() => computePerfScore(model), [model]);
    const tier = score >= 80
        ? { label: "Elite", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", bar: "bg-gradient-to-r from-yellow-500 to-amber-500" }
        : score >= 55
        ? { label: "Pro",   color: "text-blue-500 bg-blue-500/10 border-blue-500/20",       bar: "bg-gradient-to-r from-emerald-500 to-teal-500" }
        : { label: "Base",  color: "text-gray-500 bg-gray-500/10 border-gray-500/20",        bar: "bg-gradient-to-r from-gray-400 to-gray-500" };

    return (
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800/50">
            <div className="w-7 shrink-0 flex items-center justify-center">
                {idx === 0 && <Trophy size={18} className="text-yellow-500" />}
                {idx === 1 && <Trophy size={16} className="text-gray-400" />}
                {idx === 2 && <Trophy size={14} className="text-amber-600" />}
                {idx > 2 && (
                    <span className="text-lg font-black text-gray-800 dark:text-white tabular-nums leading-none">
                        {String(idx + 1).padStart(2, '0')}
                    </span>
                )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow shrink-0">
                <ModalityIcon types={model.types} size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-black text-gray-900 dark:text-white truncate leading-tight">
                        {model.name.split(':')[1]?.trim() || model.name}
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border shrink-0 ${tier.color}`}>{tier.label}</span>
                </div>
                <span className="text-[9px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                    {model.provider}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1">
                        <Bar pct={score} color={tier.bar} />
                    </div>
                    <span className="text-[10px] font-black text-gray-900 dark:text-white shrink-0 tabular-nums">
                        {score}<span className="text-gray-400 font-bold">/100</span>
                    </span>
                </div>
            </div>
        </div>
    );
});

/* ─── MAIN COMPONENT ─── */
const AILadder = ({ defaultView = "ladder" }) => {
    const [models, setModels]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [modalityFilter, setModFilter]  = useState("All");
    const [viewMode, setViewMode]         = useState(defaultView);
    const [searchTerm, setSearchTerm]     = useState("");
    const [lastUpdated, setLastUpdated]   = useState(null);
    const [countdown, setCountdown]       = useState(LADDER_REFRESH);
    const [refreshing, setRefreshing]     = useState(false);

    /* Stable growth values — never re-randomise on render */
    const growthRef = useRef({});
    const getGrowth = (id, usage) => {
        if (!growthRef.current[id]) {
            growthRef.current[id] = Math.floor((usage / 2) + (Math.random() * 10));
        }
        return growthRef.current[id];
    };

    const fetchModels = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const res  = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai-models`);
            const data = await res.json();
            if (data.models) { setModels(data.models); setLastUpdated(new Date()); setCountdown(LADDER_REFRESH); }
        } catch { setError("Failed to load rankings"); }
        finally { setLoading(false); if (!silent) setRefreshing(false); }
    }, []);

    useEffect(() => { fetchModels(); }, [fetchModels]);
    useEffect(() => { setViewMode(defaultView); }, [defaultView]);
    useEffect(() => {
        const i = setInterval(() => fetchModels(true), LADDER_REFRESH_MS);
        return () => clearInterval(i);
    }, [fetchModels]);
    useEffect(() => {
        const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
        return () => clearInterval(t);
    }, []);

    const filtered = useMemo(() => models.filter(m => {
        const q = searchTerm.toLowerCase();
        if (q && !m.name.toLowerCase().includes(q) && !m.provider.toLowerCase().includes(q)) return false;
        if (modalityFilter === "All") return true;
        if (modalityFilter === "Music") return m.types.includes("Audio") || m.types.includes("Music");
        return m.types.includes(modalityFilter);
    }), [models, searchTerm, modalityFilter]);

    const perfSorted = useMemo(
        () => [...filtered].sort((a, b) => computePerfScore(b) - computePerfScore(a)),
        [filtered]
    );

    if (loading) return (
        <div className="p-4 md:p-8 space-y-3">
            {[1,2,3,4,5].map(i => (
                <div key={i} className="h-14 md:h-20 bg-gray-100 dark:bg-gray-800/30 rounded-2xl animate-pulse" />
            ))}
        </div>
    );
    if (error) return (
        <div className="p-12 text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 font-bold">{error}</p>
        </div>
    );

    return (
        <div className="space-y-5 md:space-y-8">

            {/* ── HEADER ── */}
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 px-1">
                <div className="space-y-3">
                    {/* Badge + refresh */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest bg-blue-500/5 px-3 py-2 rounded-full border border-blue-500/10">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-75" />
                                <span className="relative rounded-full h-2 w-2 bg-blue-600" />
                            </span>
                            Live Intelligence Stream
                        </div>
                        <button
                            onClick={() => fetchModels(false)}
                            className={`flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-gray-900 px-3 py-2 rounded-full border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:text-blue-600 transition-colors ${refreshing ? 'opacity-60' : ''}`}
                            disabled={refreshing}
                        >
                            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Syncing…' : `Refresh ${fmt(countdown)}`}
                        </button>
                        {lastUpdated && (
                            <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>

                    <div>
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-2">
                            {viewMode === "ladder"
                                ? <>Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">Ladder</span></>
                                : <>Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Board</span></>
                            }
                        </h2>
                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                            {viewMode === "ladder"
                                ? "Real-world usage share and pricing across all modalities."
                                : "Capability score: context window, efficiency, and intelligence."}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5 w-full xl:w-auto">
                    {/* View toggle */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full sm:w-fit">
                        {[
                            { key: "ladder",      label: "Market Ladder",  Icon: TrendingUp, active: "bg-blue-600 shadow-blue-500/30" },
                            { key: "performance", label: "Performance",    Icon: BarChart3,  active: "bg-emerald-600 shadow-emerald-500/30" },
                        ].map(({ key, label, Icon, active }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setViewMode(key)}
                                onTouchEnd={(e) => { e.preventDefault(); setViewMode(key); }}
                                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-1 sm:flex-none cursor-pointer ${
                                    viewMode === key ? `${active} text-white shadow-lg` : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                        <input
                            type="text"
                            placeholder="Search models or providers…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full xl:w-72 bg-white/60 dark:bg-gray-900/60 border-2 border-gray-200 dark:border-gray-800 focus:border-blue-600 rounded-2xl py-2.5 pl-10 pr-4 outline-none font-semibold text-sm text-gray-900 dark:text-white transition-colors"
                        />
                    </div>

                    {/* Modality pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                        {MODALITIES.map(({ name, icon: Icon }) => {
                            const active = modalityFilter === name;
                            const activeClass = viewMode === "ladder"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-emerald-600 text-white border-emerald-600";
                            return (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setModFilter(name)}
                                    onTouchEnd={(e) => { e.preventDefault(); setModFilter(name); }}
                                    className={`cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 border-2 whitespace-nowrap shrink-0 ${
                                        active ? activeClass : 'bg-white/50 dark:bg-gray-900/50 text-gray-500 border-gray-200 dark:border-gray-800'
                                    }`}
                                >
                                    <Icon size={11} />
                                    {name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* ── TABLE / CARDS ── */}
            <div className="rounded-3xl md:rounded-[2.5rem] border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md shadow-xl overflow-hidden mt-2">
                    {viewMode === "ladder" ? (
                        <>
                            {/* ── MOBILE LADDER CARDS ── */}
                            <div className="block md:hidden">
                                {filtered.slice(0, 50).map((model, idx) => (
                                    <LadderCard key={model.id} model={model} idx={idx} growth={getGrowth(model.id, model.usage)} />
                                ))}
                            </div>
                            
                            {/* ── DESKTOP LADDER TABLE ── */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[860px]">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
                                            {["Rank","AI Model","Usage Dominance","Market Intel","Profit & Growth"].map(h => (
                                                <th key={h} className="py-6 px-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.slice(0, 50).map((model, idx) => {
                                            const market = getMarketIntel(model.provider);
                                            const growth = getGrowth(model.id, model.usage);
                                            return (
                                                <tr key={model.id} className="group hover:bg-blue-600/5 border-b border-gray-100 dark:border-gray-800/40 transition-colors">
                                                    <td className="py-6 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums group-hover:text-blue-600 transition-colors">
                                                                {String(idx + 1).padStart(2, '0')}
                                                            </span>
                                                            <ChevronUp size={14} className="text-green-500" />
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4 min-w-[240px]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                                                                <ModalityIcon types={model.types} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="text-base font-black text-gray-900 dark:text-white leading-none">
                                                                        {model.name.split(':')[1]?.trim() || model.name}
                                                                    </h4>
                                                                    {model.isNew && <span className="text-[8px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full">NEW</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] font-black text-white bg-gray-900 dark:bg-blue-600 px-2 py-0.5 rounded font-mono">{market.ticker}</span>
                                                                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">{model.provider}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <div className="w-44 space-y-1.5">
                                                            <div className="flex justify-between text-[11px] font-black">
                                                                <span className="text-gray-900 dark:text-white">{model.usage}%</span>
                                                                <span className="text-blue-600">Usage</span>
                                                            </div>
                                                            <Bar pct={model.usage} color="bg-gradient-to-r from-blue-600 to-purple-600" />
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-black text-gray-900 dark:text-white tabular-nums">${market.price}</span>
                                                                <span className={`text-[10px] font-black ${market.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{market.trend}</span>
                                                            </div>
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Val: {market.cap}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6">
                                                        <div className="flex items-center justify-end gap-5">
                                                            <div className="text-right">
                                                                <div className="text-base font-black text-gray-900 dark:text-white">{market.margin}</div>
                                                                <div className="text-[9px] text-gray-400 uppercase tracking-wider">Net Margin</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-base font-black text-blue-600">+{growth}%</div>
                                                                <div className="text-[9px] text-gray-400 uppercase tracking-wider">Growth</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* ── MOBILE PERF CARDS ── */}
                            <div className="block md:hidden">
                                {perfSorted.slice(0, 50).map((model, idx) => (
                                    <PerfCard key={model.id} model={model} idx={idx} />
                                ))}
                            </div>
                            
                            {/* ── DESKTOP PERF TABLE ── */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[860px]">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
                                            {["#","AI Model","Perf Score","Context Window","Value (Score/$)"].map(h => (
                                                <th key={h} className="py-6 px-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {perfSorted.slice(0, 50).map((model, idx) => {
                                            const score = computePerfScore(model);
                                            const promptCost = parseFloat(model.pricing?.prompt || 0) * 1_000_000;
                                            const valuePer$  = promptCost > 0 ? (score / promptCost).toFixed(1) : "∞";
                                            const tier = score >= 80
                                                ? { label: "Elite", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", bar: "bg-gradient-to-r from-yellow-500 to-amber-500" }
                                                : score >= 55
                                                ? { label: "Pro",   color: "text-blue-500 bg-blue-500/10 border-blue-500/20",       bar: "bg-gradient-to-r from-emerald-500 to-teal-500" }
                                                : { label: "Base",  color: "text-gray-500 bg-gray-500/10 border-gray-500/20",        bar: "bg-gradient-to-r from-gray-400 to-gray-500" };
                                            return (
                                                <tr key={model.id} className="group hover:bg-emerald-600/5 border-b border-gray-100 dark:border-gray-800/40 transition-colors">
                                                    <td className="py-6 px-6">
                                                        <div className="flex items-center gap-2">
                                                            {idx === 0 && <Trophy size={20} className="text-yellow-500" />}
                                                            {idx === 1 && <Trophy size={18} className="text-gray-400" />}
                                                            {idx === 2 && <Trophy size={16} className="text-amber-600" />}
                                                            {idx > 2   && <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums group-hover:text-emerald-600">{String(idx+1).padStart(2,'0')}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4 min-w-[260px]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                                                                <ModalityIcon types={model.types} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="text-base font-black text-gray-900 dark:text-white leading-none">{model.name.split(':')[1]?.trim() || model.name}</h4>
                                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${tier.color}`}>{tier.label}</span>
                                                                </div>
                                                                <span className="text-[9px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">{model.provider}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <div className="w-44 space-y-1.5">
                                                            <div className="flex items-end justify-between">
                                                                <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{score}</span>
                                                                <span className="text-[10px] text-gray-400">/ 100</span>
                                                            </div>
                                                            <Bar pct={score} color={tier.bar} />
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen size={16} className="text-gray-400 shrink-0" />
                                                            <div>
                                                                <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                                                                    {model.context_length > 0
                                                                        ? model.context_length >= 1_048_576 ? `${(model.context_length/1_048_576).toFixed(1)}M` : `${Math.round(model.context_length/1024)}K`
                                                                        : "Static"}
                                                                </div>
                                                                <div className="text-[9px] text-gray-400 uppercase tracking-wider">Context</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Gauge size={16} className="text-emerald-500 shrink-0" />
                                                            <div>
                                                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{valuePer$}</div>
                                                                <div className="text-[9px] text-gray-400 uppercase tracking-wider">pts per $</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                    <AlertCircle size={40} className="mx-auto text-gray-200 dark:text-gray-800 mb-4" />
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">No Models Found</h3>
                    <p className="text-gray-500 text-sm">Try changing the filter or search term.</p>
                </div>
            )}

            {/* Footer */}
            <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-5 border-t border-gray-200 dark:border-gray-800 text-[11px] font-bold text-gray-400 text-center sm:text-left">
                <p>Rankings update every 30 min via OpenRouter. Score = context (50%) + value (30%) + tier (20%).</p>
                <div className="flex gap-6 shrink-0">
                    <button className="text-blue-600 hover:tracking-widest transition-all">Export</button>
                    <button className="hover:text-gray-900 dark:hover:text-white transition-colors">Docs</button>
                </div>
            </footer>
        </div>
    );
};

export default AILadder;
