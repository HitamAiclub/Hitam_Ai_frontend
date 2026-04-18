import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  ExternalLink, 
  Cpu, 
  Newspaper, 
  Zap, 
  Globe, 
  Layout, 
  Search,
  ArrowUpRight,
  Filter,
  Sparkles,
  Blocks,
  Rocket,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Fingerprint,
  Calendar,
  Copy,
  Clock,
  Type,
  Video,
  Image as ImageIcon,
  Music,
  Code as CodeIcon,
  Bot
} from 'lucide-react';

const CapabilityBadge = ({ type }) => {
  const getTooling = (t) => {
    const low = t.toLowerCase();
    if (low.includes('text')) return { icon: Type, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (low.includes('video')) return { icon: Video, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    if (low.includes('image')) return { icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (low.includes('audio') || low.includes('music')) return { icon: Music, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    if (low.includes('code')) return { icon: CodeIcon, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
    if (low.includes('agent')) return { icon: Bot, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
    return { icon: Zap, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
  };

  const tool = getTooling(type);
  const Icon = tool.icon;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${tool.bg} ${tool.color} border ${tool.border} transition-all`}>
      <Icon size={12} />
      <span className="text-[10px] font-black uppercase tracking-wider">{type}</span>
    </div>
  );
};

const GridCard = ({ item, index, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Per-card 3D hover effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const cardRotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const cardRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });
  const cardTranslateZ = useSpring(isHovered ? 60 : 0, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const getTheme = () => {
    if (item.type === 'model') return {
      icon: Cpu,
      color: 'from-blue-600 to-cyan-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      label: 'AI Platform'
    };
    return {
      icon: Newspaper,
      color: 'from-fuchsia-600 to-purple-500',
      bg: 'bg-fuchsia-500/10',
      border: 'border-fuchsia-500/20',
      text: 'text-fuchsia-400',
      label: 'Intelligence'
    };
  };

  const theme = getTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.6 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        mouseX.set(0);
        mouseY.set(0);
      }}
      style={{
        perspective: 1000,
        rotateX: cardRotateX,
        rotateY: cardRotateY,
        z: cardTranslateZ,
      }}
      className="relative z-10"
      onClick={() => onSelect(item)}
    >
      <div className={`relative h-full flex flex-col group cursor-pointer transition-all duration-500 ${isHovered ? 'z-50' : 'z-10'}`}>
        
        {/* Futuristic Card Shell */}
        <div className={`relative flex-grow flex flex-col rounded-[2.5rem] bg-gray-100/40 dark:bg-gray-900/40 backdrop-blur-3xl border-2 transition-all duration-500 ${isHovered ? 'border-blue-500/30 dark:border-white/30 bg-white/60 dark:bg-gray-800/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] dark:shadow-[0_0_50px_rgba(59,130,246,0.3)]' : 'border-gray-200/50 dark:border-white/5 shadow-xl'}`}>
          
          {/* Card Content */}
          <div className="p-8 flex flex-col gap-6 h-full">
            <div className="flex items-start justify-between">
              <div className={`p-4 rounded-2xl ${theme.bg} ${theme.text} border ${theme.border} group-hover:scale-110 transition-transform duration-500`}>
                <theme.icon size={22} />
              </div>
              
              <div className="flex flex-col items-end gap-1">
                 <div className="flex items-center gap-2">
                    {item.isNew && (
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)] animate-pulse border border-white/20">
                         New Model
                      </div>
                    )}
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono opacity-20`}>{item.id ? item.id.split('/').pop().substring(0, 3).toUpperCase() : `00${index + 1}`}</span>
              </div>
            </div>

            <div className="space-y-4 flex-grow">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 dark:text-white/20 group-hover:text-blue-500 dark:group-hover:text-white/40 transition-colors">
                     <Fingerprint size={10} />
                     IDENTITY SCAN
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-[1.1] uppercase tracking-tighter group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500 dark:group-hover:from-white dark:group-hover:to-white/60 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {item.text}
                    {item.version && <span className="ml-2 text-[10px] font-bold text-blue-500/50 align-middle tracking-normal normal-case">{item.version}</span>}
                  </h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                     {item.provider || "INTELLIGENCE"}
                  </p>
               </div>

                {/* Capability Matrix in Card */}
                <div className="flex flex-wrap gap-2 pt-2">
                   {item.types?.slice(0, 3).map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                         <span className={`w-1 h-1 rounded-full ${
                           t.toLowerCase().includes('text') ? 'bg-blue-400' : 
                           t.toLowerCase().includes('video') ? 'bg-amber-400' :
                           t.toLowerCase().includes('image') ? 'bg-emerald-400' :
                           t.toLowerCase().includes('audio') || t.toLowerCase().includes('music') ? 'bg-purple-400' :
                           t.toLowerCase().includes('code') ? 'bg-rose-400' : 'bg-gray-400'
                         }`} />
                         <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">
                           {t}
                         </span>
                      </div>
                   ))}
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
               <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-xl group-hover:bg-blue-600 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-500 font-bold border border-gray-200/50 dark:border-transparent">
                  <span className="text-[10px] font-black uppercase tracking-widest">Details</span>
                  <ArrowUpRight size={14} />
               </div>
               
               <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  Live
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DetailModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
    >
      <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="p-8 md:p-14">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-12">
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <Cpu size={28} />
                     </div>
                     <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
                        {item.name || `${item.text} ${item.version}`}
                     </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 ml-1">
                     <div className="flex items-center gap-2 group cursor-pointer">
                        <code className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10 group-hover:text-blue-400 transition-colors">
                           {item.id || 'discovered.node.001'}
                        </code>
                        <Copy size={10} className="text-gray-400 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                     </div>
                     <div className="w-px h-3 bg-gray-200 dark:bg-white/10 mx-2" />
                     <div className="flex items-center gap-2">
                        {item.types?.map((t, idx) => (
                           <CapabilityBadge key={idx} type={t} />
                        ))}
                     </div>
                  </div>
               </div>
               
               <button 
                 onClick={onClose}
                 className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-white hover:bg-red-500 transition-all shadow-inner"
               >
                 ✕
               </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-10 gap-y-6 mb-12 pb-10 border-b border-gray-100 dark:border-white/5">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Released</span>
                  <span className="text-sm font-black text-gray-800 dark:text-gray-200">
                     {item.releaseDate || 'Jan 2024'}
                  </span>
               </div>
               <div className="flex flex-col border-l border-gray-100 dark:border-white/5 pl-10">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Context window</span>
                     {item.isLive && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[7px] font-black animate-pulse border border-emerald-500/20">LIVE</span>
                     )}
                  </div>
                  <span className="text-sm font-black text-gray-800 dark:text-gray-200">
                     {item.context_length > 0 ? `${(item.context_length).toLocaleString()} context` : 'Dynamic context'}
                  </span>
               </div>
               <div className="flex flex-col border-l border-gray-100 dark:border-white/5 pl-10">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Input tokens</span>
                     {item.isLive && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[7px] font-black animate-pulse border border-emerald-500/20">LIVE</span>
                     )}
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                     ${item.pricing?.prompt || "0.00"}/M tokens
                  </span>
               </div>
               <div className="flex flex-col border-l border-gray-100 dark:border-white/5 pl-10">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Output tokens</span>
                     {item.isLive && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[7px] font-black animate-pulse border border-emerald-500/20">LIVE</span>
                     )}
                  </div>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                     ${item.pricing?.completion || "0.00"}/M tokens
                  </span>
               </div>
            </div>

            {/* Intelligence Narrative */}
            <div className="mb-14">
               <p className="text-xl font-medium text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                  {item.description || "A high-performance intelligence node specialized in advanced reasoning, multimodal perception, and complex problem-solving. Built for production-grade exploration and high-fidelity task execution."}
               </p>
            </div>

            {/* Action Matrix */}
            <div className="flex flex-col md:flex-row gap-4">
               <button 
                 onClick={() => window.open(item.link, '_blank')}
                 className="flex-grow py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30"
               >
                  Launch Platform
                  <ArrowUpRight size={22} />
               </button>
               <button 
                 onClick={onClose}
                 className="px-10 py-6 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-white rounded-3xl transition-all font-black uppercase tracking-[0.2em] border border-gray-200 dark:border-white/5"
               >
                  Return
               </button>
            </div>
        </div>
        
        {/* Holographic Border */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />
      </motion.div>
    </motion.div>
  );
};

const IntelligenceGrid = ({ items = [], models = [] }) => {
  const [filter, setFilter] = useState('model');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const safeOnly = true;

  // Global mouse parallax effect
  const gridX = useMotionValue(0);
  const gridY = useMotionValue(0);

  const gridRotateX = useSpring(useTransform(gridY, [-1, 1], [5, -5]), { stiffness: 100, damping: 30 });
  const gridRotateY = useSpring(useTransform(gridX, [-1, 1], [-5, 5]), { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (selectedItem) {
        gridX.set(0);
        gridY.set(0);
        return;
      }
      gridX.set((e.clientX / window.innerWidth - 0.5) * 2);
      gridY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [selectedItem]);

  const mergedData = useMemo(() => {
    const list = [
        ...(models.map(m => ({ 
            id: m.id, 
            name: m.name,
            text: m.name.includes(':') ? m.name.split(':')[0].trim() : (m.name.includes('/') ? m.name.split('/')[1] : m.name), 
            version: m.name.includes(':') ? m.name.split(':')[1]?.trim() : '',
            provider: m.provider,
            link: m.link || '#',
            type: 'model',
            types: m.types || [],
            description: m.description,
            context_length: m.context_length,
            pricing: m.pricing,
            releaseDate: m.releaseDate,
            isSafe: m.isSafe,
            isNew: m.isNew,
            isLive: m.isLive,
            created: m.created || 0
        }))),
        ...(items.slice(0, 50).map(n => ({ 
            id: n.link, 
            text: n.source, 
            provider: n.source,
            link: n.link,
            type: 'news',
            types: ['Insight'],
            isSafe: n.isSafe,
            isNew: false,
            releaseDate: 'Apr 2026', // Keep news at the top chronological tier
            created: Date.now() - 86400000
        })))
    ];

    // Chronological Sort Helper
    const parseReleaseDate = (ds) => {
      if (!ds) return 0;
      const parts = ds.split(' ');
      if (parts.length < 2) return parseInt(parts[0]) || 0;
      const months = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
      return parseInt(parts[1]) * 100 + (months[parts[0]] || 0);
    };

    // Priority Sort: Strict Chronology (Newest First)
    return list.sort((a, b) => {
      const dateA = parseReleaseDate(a.releaseDate);
      const dateB = parseReleaseDate(b.releaseDate);
      if (dateB !== dateA) return dateB - dateA;
      return b.created - a.created;
    });
  }, [items, models]);

  const handleSelect = (item) => {
    if (item.type === 'news') {
      window.open(item.link, '_blank');
    } else {
      setSelectedItem(item);
    }
  };

  const filteredData = mergedData.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSafe = !safeOnly || item.isSafe;
    return matchesFilter && matchesSearch && matchesSafe;
  });

  return (
    <div className="relative py-20 overflow-hidden">
      
      {/* Decorative Parallax Background Elements */}
      <motion.div 
        style={{ x: useTransform(gridX, [-1, 1], [-100, 100]), y: useTransform(gridY, [-1, 1], [-100, 100]) }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none"
      />

      <div className="max-w-[1600px] mx-auto px-6 space-y-16">
        
        {/* Premium Control Center */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-black uppercase tracking-[0.5em] text-[10px]">
                   <TrendingUp size={14} />
                   Neural Discovery Engine
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full group cursor-default">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Market Live</span>
                </div>
             </div>
             <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-500 dark:to-cyan-400">Sphere</span>
             </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
             {/* Mode Selector */}
             <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-1.5 rounded-2xl backdrop-blur-3xl shadow-inner">
                {[
                  { id: 'all', label: 'All', icon: Layout },
                  { id: 'model', label: 'Platforms', icon: Cpu },
                  { id: 'news', label: 'Intel', icon: Newspaper }
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setFilter(btn.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filter === btn.id 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                      : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <btn.icon size={12} />
                    {btn.label}
                  </button>
                ))}
             </div>


             {/* Search */}
             <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Scan nodes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-14 pr-8 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none w-72 focus:border-blue-500/50 transition-all shadow-inner"
                />
             </div>
          </div>
        </div>

        {/* The Interactive 3D Grid */}
        <motion.div 
          style={{ rotateX: gridRotateX, rotateY: gridRotateY, perspective: 2000 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32"
        >
          <AnimatePresence mode="popLayout">
            {filteredData.map((item, idx) => (
              <GridCard key={item.id} item={item} index={idx} onSelect={handleSelect} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Global Modal Layer */}
        <AnimatePresence>
           {selectedItem && (
             <DetailModal 
               item={selectedItem} 
               onClose={() => setSelectedItem(null)} 
             />
           )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default IntelligenceGrid;
