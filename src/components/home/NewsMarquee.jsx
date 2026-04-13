import React from "react";
import { motion } from "framer-motion";
import ArticleImage from "../news/ArticleImage";
import { ExternalLink, Calendar, TrendingUp, Cpu, Info } from "lucide-react";

/**
 * NewsMarquee
 * An infinite horizontal auto-scrolling row.
 * items: Array of news or model items
 * speed: Duration of one full loop in seconds
 * direction: "left" or "right"
 * title: Section title (e.g., "India AI", "Elite Ranks")
 */
const NewsMarquee = ({ items = [], speed = 60, direction = "left", title, type = "news" }) => {
    if (items.length === 0) return null;

    // Duplicate 4 times to ensure a very long buffer for a true "circular queue" feel
    const displayItems = [...items, ...items, ...items, ...items];

    return (
        <div className="py-10 group/marquee overflow-hidden">
            {title && (
                <div className="max-w-7xl mx-auto px-6 mb-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        <span className="w-10 h-1 bg-blue-600 rounded-full"></span>
                        {title}
                    </h3>
                </div>
            )}

            <div className="relative mask-fade cursor-grab active:cursor-grabbing px-10">
                <motion.div
                    className="flex gap-6"
                    drag="x"
                    // Allow dragging across a large range to mimic circularity
                    dragConstraints={{ left: -2000, right: 2000 }}
                    dragElastic={0.05}
                    animate={{
                        x: direction === "left" ? ["0%", "-25%"] : ["-25%", "0%"],
                    }}
                    transition={{
                        duration: speed,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                    whileHover={{ transition: { duration: speed * 4 } }}
                    whileTap={{ scale: 0.995 }}
                >
                    {displayItems.map((item, idx) => (
                        <div 
                            key={`${item.id || item.title || item.name}-${idx}`} 
                            className="w-[300px] md:w-[350px] shrink-0"
                        >
                            <MarqueeCard item={item} type={item.type || type} index={idx % (items.length || 1)} />
                        </div>
                    ))}
                </motion.div>
            </div>

            <style>{`
                .mask-fade {
                    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                }
            `}</style>
        </div>
    );
};

const MarqueeCard = ({ item, type, index }) => {
    if (type === "model" || item.type === "model") {
        const rank = index + 1;
        const isTop3 = rank <= 3;

        return (
            <div className={`h-full relative overflow-hidden p-6 rounded-[2.5rem] transition-all duration-500 group/card bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border ${isTop3 ? 'border-blue-500/30' : 'border-gray-200/50 dark:border-gray-800/10'} hover:border-blue-500/50`}>
                {/* Elite Background Atmospheric Glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Rank Badge */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                            rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/20' :
                            rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-500/20' :
                            rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-800/20' :
                            'bg-blue-600/10 text-blue-600'
                        }`}>
                            {rank}
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                {item.name.split(':')[1]?.trim() || item.name}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.provider}</span>
                                {item.isNew && <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded-full">NEW</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Analytics Visualization */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Market Dominance</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{item.usage}%</span>
                        </div>
                        <div className="w-20 h-8 flex items-end gap-1 px-2 pb-1 bg-blue-500/5 rounded-lg border border-blue-500/10">
                            {[0.4, 0.7, 0.5, 0.9, 0.6, 1.0].map((h, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h * 100}%` }}
                                    transition={{ delay: i * 0.1, duration: 1 }}
                                    className="flex-1 bg-blue-500/40 rounded-t-sm" 
                                />
                            ))}
                        </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden p-0.5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.usage}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-full"
                        />
                    </div>
                </div>

                {/* Efficiency Stats */}
                <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-gray-800/30">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-blue-600">
                            <Cpu size={12} />
                            <span className="text-[10px] font-black uppercase">Efficiency</span>
                        </div>
                        <span className="text-sm font-black text-gray-900 dark:text-white mt-1">
                            ${(parseFloat(item.pricing?.prompt || 0) * 1000000).toFixed(2)}
                            <span className="text-[9px] text-gray-400 font-bold ml-1">/ 1M Tokens</span>
                        </span>
                    </div>
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
                        <TrendingUp size={18} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/10 rounded-[2.5rem] overflow-hidden group/card hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col">
            {/* Compact Image Header */}
            <div className="relative h-32 overflow-hidden shrink-0">
                <ArticleImage 
                    articleUrl={item.link}
                    fallback={item.category === "Startups" ? "/ai-startup-fallback.png" : "/ai-news-fallback.png"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-10" />
                <div className="absolute bottom-2 left-4 z-20">
                    <span className="text-[8px] font-black text-white bg-blue-600/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/20 uppercase tracking-tighter">
                        {item.category}
                    </span>
                </div>
            </div>

            {/* Tight Content Section */}
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2 text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-1">
                        <Calendar size={10} className="text-blue-500" />
                        {(() => {
                            const date = new Date(item.pubDate);
                            return isNaN(date.getTime()) ? "Today" : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        })()}
                    </div>
                    <span>{item.source}</span>
                </div>

                <h4 className="text-[13px] font-black text-gray-900 dark:text-white leading-snug mb-3 line-clamp-2 group-hover/card:text-blue-600 transition-colors">
                    {item.title}
                </h4>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800/30">
                    <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 group/link"
                    >
                        Intel Source <ExternalLink size={10} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default NewsMarquee;
