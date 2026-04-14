import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimationFrame } from "framer-motion";
import ArticleImage from "../news/ArticleImage";
import { ExternalLink, Calendar, TrendingUp, Cpu, Info, Activity } from "lucide-react";

/**
 * NewsMarquee - Pure Loop Terminal Logic
 * High-Density, Solid Background, Reduced Height.
 */
const NewsMarquee = ({ items = [], speed = 60, direction = "left", title, type = "news" }) => {
    const x = useMotionValue(0);
    const [isInteracting, setIsInteracting] = useState(false);

    // Industrial loop configuration
    const duplicationFactor = 12;
    const baseItems = items.length > 0 ? items : [];

    const resumeTimerRef = useRef(null);
    const lastTimeRef = useRef(null);
    const trackRef = useRef(null);

    // Animation Frame Loop: Constant velocity driver
    useAnimationFrame((time) => {
        if (isInteracting) {
            lastTimeRef.current = null;
            return;
        }

        if (lastTimeRef.current === null) {
            lastTimeRef.current = time;
            return;
        }

        const delta = time - lastTimeRef.current;
        lastTimeRef.current = time;

        const move = (delta * speed) / 1200; // Calibrated for optimal readability

        const currentX = x.get();
        const nextX = direction === "left" ? currentX - move : currentX + move;

        if (trackRef.current && baseItems.length > 0) {
            const trackWidth = trackRef.current.scrollWidth / (duplicationFactor / 2);
            x.set(nextX % trackWidth);
        } else {
            x.set(nextX);
        }
    });

    if (items.length === 0) return null;

    const displayItems = Array(duplicationFactor).fill([...baseItems]).flat();

    const handleInteractionStart = () => {
        setIsInteracting(true);
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };

    const handleInteractionEnd = () => {
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
            setIsInteracting(false);
        }, 2000); // 2 seconds pause on click/scroll/drag
    };

    const handleDrag = (_, info) => {
        const currentX = x.get();
        x.set(currentX + info.delta.x * 1.5);
    };

    const handleWheel = (e) => {
        const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        const delta = isHorizontal ? e.deltaX : e.deltaY;

        if (isHorizontal) e.preventDefault();

        handleInteractionStart();

        const currentX = x.get();
        const boostedDelta = delta * -1.8;

        if (trackRef.current) {
            const trackWidth = trackRef.current.scrollWidth / (duplicationFactor / 2);
            x.set((currentX + boostedDelta) % trackWidth);
        } else {
            x.set(currentX + boostedDelta);
        }

        handleInteractionEnd();
    };

    return (
        <div className="py-6 group/marquee overflow-hidden" onWheel={handleWheel}>
            {title && (
                <div className="max-w-7xl mx-auto px-6 mb-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="w-8 h-1 bg-blue-600 rounded-full"></span>
                        {title}
                    </h3>
                </div>
            )}

            <div className="relative mask-fade cursor-grab active:cursor-grabbing">
                <motion.div
                    ref={trackRef}
                    className="flex gap-6"
                    style={{ x }}
                    drag="x"
                    dragElastic={0}
                    dragMomentum={false}
                    onDragStart={handleInteractionStart}
                    onDrag={handleDrag}
                    onDragEnd={handleInteractionEnd}
                    onMouseDown={handleInteractionStart}
                    onMouseUp={handleInteractionEnd}
                    onTouchStart={handleInteractionStart}
                    onTouchEnd={handleInteractionEnd}
                >
                    {displayItems.map((item, idx) => (
                        <div
                            key={`${item.id || item.title || item.name}-${idx}`}
                            className="w-[280px] md:w-[320px] shrink-0"
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
        const isMarket = item.subtype === "market";

        return (
            <div className="h-[140px] relative overflow-hidden p-5 rounded-[2rem] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl group/card transition-all duration-300 hover:border-blue-500/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${isMarket ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            }`}>
                            {isMarket ? <TrendingUp size={20} /> : <Cpu size={20} />}
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-tighter line-clamp-1">
                                {item.name.split(':')[1]?.trim() || item.name}
                            </h4>
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{item.provider}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            {isMarket ? 'Dominance' : 'Velocity'}
                        </span>
                        <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                            {isMarket ? `${item.usage}%` : `${Math.floor((item.context_length / 10000) + (Math.random() * 50))} t/s`}
                        </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            {isMarket ? 'Tier' : 'Grade'}
                        </span>
                        <span className={`text-xs font-black ${isMarket ? 'text-blue-600' : 'text-emerald-600'}`}>
                            {isMarket ? `RANK #${(index % 5) + 1}` : `${95 + (index % 4)}% AI`}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[140px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-5 flex flex-col justify-between group/card hover:border-blue-500/50 shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black text-blue-600 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">
                    {item.category}
                </span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.source}</span>
            </div>

            <h4 className="text-sm font-black text-gray-900 dark:text-white leading-[1.2] line-clamp-2 tracking-tight transition-colors group-hover/card:text-blue-600">
                {item.title}
            </h4>

            <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-[8px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
                    </span>
                    {item.publishedAgo || "Live • Today"}
                </span>
                <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-500 hover:bg-blue-600 hover:text-white transition-all"
                >
                    <ExternalLink size={12} />
                </a>
            </div>
        </div>
    );
};

export default NewsMarquee;
