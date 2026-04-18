import React, { useRef, useMemo, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Float, MeshDistortMaterial, PerspectiveCamera, OrbitControls, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { 
  Cpu, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Search,
  Layout,
  Newspaper,
  ArrowRight
} from 'lucide-react';

const Card3D = ({ item, position, index, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  const getTheme = () => {
    if (item.type === 'model') return { color: "#7c3aed", icon: Cpu, label: "Model" };
    return { color: "#059669", icon: Newspaper, label: "Intel" };
  };
  const theme = getTheme();

  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh 
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => onSelect(item)}
        >
          <planeGeometry args={[3.2, 2.2]} />
          <meshStandardMaterial 
            color={hovered ? "#ffffff" : "#1e293b"} 
            transparent 
            opacity={0.8}
            metalness={0.8}
            roughness={0.2}
          />
          
          {/* Border Glow */}
          {hovered && (
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[3.3, 2.3]} />
              <meshBasicMaterial color={theme.color} />
            </mesh>
          )}

          {/* Content via Html component for high interaction */}
          <Html
            transform
            distanceFactor={4}
            position={[0, 0, 0.05]}
            pointerEvents="none"
          >
            <div className={`w-64 h-44 p-4 flex flex-col justify-between rounded-xl bg-gray-900/60 backdrop-blur-md border border-white/10 text-white select-none transition-all duration-500 ${hovered ? 'scale-110 border-white/40 ring-4 ring-white/10' : ''}`}>
               <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${hovered ? 'text-white' : 'text-gray-400'}`}>
                     <theme.icon size={16} />
                  </div>
                  {item.isSafe && (
                    <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-2 py-1 rounded-full border border-emerald-500/20">
                       <ShieldCheck size={10} /> Safe
                    </div>
                  )}
               </div>

               <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-tighter truncate leading-none">
                    {item.text}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.provider || "Intelligence"}</p>
               </div>

               <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[8px] font-black tracking-[0.2em] text-white/40 uppercase">Ready to Play</div>
                  <ArrowRight size={12} className={hovered ? "text-white translate-x-1 transition-transform" : "text-white/20"} />
               </div>
            </div>
          </Html>
        </mesh>
      </Float>
    </group>
  );
};

const CockpitWall = ({ data, onSelect }) => {
  const radius = 18;
  const cardSpacing = 4.5;
  const cardsPerRow = 8;

  const positions = useMemo(() => {
    return data.map((_, i) => {
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      const angle = (col - (cardsPerRow - 1) / 2) * (cardSpacing / radius);
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - radius;
      const y = (row - 1.5) * -3; 
      return [x, y, z];
    });
  }, [data]);

  return (
    <group>
      {data.map((item, i) => (
        <Card3D 
          key={item.id} 
          item={item} 
          position={positions[i]} 
          index={i} 
          onSelect={onSelect}
        />
      ))}
    </group>
  );
};

const Intelligence3D = ({ items = [], models = [] }) => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [safeOnly, setSafeOnly] = useState(false);

  const mergedData = useMemo(() => {
    // Fuse and sort data
    const list = [
        ...(models.map(m => ({ 
            id: m.id, 
            text: m.name.split(':')[1]?.trim() || m.name.split('/')[1] || m.name, 
            provider: m.provider,
            link: m.link || '#',
            type: 'model',
            isSafe: m.isSafe,
            isNew: m.isNew
        }))),
        ...(items.slice(0, 40).map(n => ({ 
            id: n.link, 
            text: n.source, 
            provider: n.source,
            link: n.link,
            type: 'news',
            isSafe: true 
        })))
    ];
    return list;
  }, [items, models]);

  const filteredData = mergedData.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSafe = !safeOnly || item.isSafe;
    return matchesFilter && matchesSearch && matchesSafe;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-[700px] md:h-[900px] relative mt-8 rounded-[3rem] overflow-hidden bg-gray-950/20 border border-white/5"
    >
      {/* UI Controls Overlay */}
      <div className="absolute inset-x-8 top-8 z-20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-3xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
           <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>All</button>
           <button onClick={() => setFilter('model')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'model' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>AI Platforms</button>
           <button onClick={() => setFilter('news')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'news' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}>Intel</button>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-3xl border border-white/10 px-4 py-2 rounded-2xl">
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Verified Safe</span>
               <button 
                 onClick={() => setSafeOnly(!safeOnly)}
                 className={`w-10 h-5 rounded-full p-1 transition-colors ${safeOnly ? 'bg-emerald-500' : 'bg-gray-800'}`}
               >
                 <motion.div 
                   animate={{ x: safeOnly ? 20 : 0 }}
                   className="w-3 h-3 bg-white rounded-full shadow-lg"
                 />
               </button>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search Cockpit..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl pl-12 pr-6 py-2.5 text-sm font-bold text-white outline-none w-64 focus:border-blue-500/50 transition-all shadow-2xl"
              />
            </div>
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={2} />
          
          <CockpitWall data={filteredData} onSelect={(item) => window.open(item.link, '_blank')} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={true} 
            maxDistance={25} 
            minDistance={5}
            dampingFactor={0.05}
            autoRotate={true}
            autoRotateSpeed={0.2}
          />
        </Suspense>
      </Canvas>

      {/* Control Hint */}
      <div className="absolute inset-x-0 bottom-10 pointer-events-none flex justify-center">
        <div className="bg-black/40 backdrop-blur-3xl border border-white/5 px-8 py-3 rounded-full flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
          <Zap size={14} className="text-blue-500 animate-pulse" />
          Drag to Navigate the Cockpit
        </div>
      </div>
    </motion.div>
  );
};

export default Intelligence3D;
