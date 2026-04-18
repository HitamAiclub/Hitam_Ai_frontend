import React, { useRef, useMemo, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, PerspectiveCamera, OrbitControls, Box, RoundedBox } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const GlobeCell = ({ model, position, rotation, isEmpty }) => {
  const [hovered, setHovered] = useState(false);
  
  const getColorScheme = () => {
    if (isEmpty) return { core: "#0ea5e9", emissive: "#0ea5e9" }; 
    if (model.type === 'news') return { core: "#059669", emissive: "#10b981" };
    
    const text = (model.text || "").toLowerCase();
    if (text.includes("hf") || text.includes("hugging")) return { core: "#7c3aed", emissive: "#a78bfa" }; 
    if (text.includes("openai") || text.includes("gpt")) return { core: "#2563eb", emissive: "#3b82f6" }; 
    if (text.includes("google") || text.includes("gemini")) return { core: "#1d4ed8", emissive: "#60a5fa" }; 
    if (text.includes("anthropic") || text.includes("claude")) return { core: "#ea580c", emissive: "#f97316" }; 
    if (text.includes("meta") || text.includes("llama")) return { core: "#0668e1", emissive: "#0668e1" }; 
    if (text.includes("mistral")) return { core: "#fbbf24", emissive: "#fbbf24" }; 
    if (text.includes("nvidia")) return { core: "#76b900", emissive: "#76b900" }; 

    return { core: "#334155", emissive: "#475569" }; 
  };

  const colors = getColorScheme();

  return (
    <group 
        position={position} 
        rotation={rotation}
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
        onClick={() => !isEmpty && window.open(model.link, '_blank')}
    >
      <RoundedBox args={[1.1, 1.1, 0.5]} radius={0.06} smoothness={4}>
        <meshStandardMaterial 
          color={colors.core} 
          emissive={colors.emissive}
          emissiveIntensity={hovered ? 3.5 : (isEmpty ? 1.0 : 1.5)}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={isEmpty ? 0.4 : 0.95}
        />
        {!isEmpty && (
            <Text
              position={[0, 0, 0.26]}
              fontSize={0.14}
              color="white"
              anchorX="center"
              anchorY="middle"
              maxWidth={0.8}
              textAlign="center"
              fontStyle="bold"
            >
              {model.text}
            </Text>
        )}
      </RoundedBox>
    </group>
  );
};

const SolidGlobe = ({ mergedData, velocity }) => {
  const groupRef = useRef();
  const FRICTION = 0.96;

  const nodeCount = 180; 
  const radius = 5.2;

  const globePositions = useMemo(() => {
    const list = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); 
    const fallbacks = [
        { text: "NVIDIA H100", provider: "nvidia", link: "https://nvidia.com" },
        { text: "CUDA v12", provider: "nvidia", link: "https://nvidia.com" },
        { text: "NEURAL HUB", link: "https://google.ai" },
        { text: "META CORE", provider: "meta", link: "#" },
        { text: "MISTRAL 7B", provider: "mistral", link: "#" }
    ];

    for (let i = 0; i < nodeCount; i++) {
        const y = 1 - (i / (nodeCount - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;

        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        const m = mergedData[i] || (i % 5 === 0 ? fallbacks[Math.floor(i/5) % fallbacks.length] : null);
        
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(new THREE.Vector3(x, y, z), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
        const rotation = new THREE.Euler().setFromRotationMatrix(lookAtMatrix);

        list.push({
            pos: [x * radius, y * radius, z * radius],
            rot: [rotation.x, rotation.y, rotation.z],
            model: m,
            isEmpty: !m
        });
    }
    return list;
  }, [mergedData, radius, nodeCount]);

  useFrame(() => {
    if (groupRef.current) {
        // Apply velocity-based kinetic rotation
        groupRef.current.rotation.y += velocity.current.y;
        groupRef.current.rotation.x += velocity.current.x;
        
        // Add slow idle rotation
        groupRef.current.rotation.y += 0.002;
        groupRef.current.rotation.x += 0.0005;

        // Apply friction
        velocity.current.x *= FRICTION;
        velocity.current.y *= FRICTION;
    }
  });

  return (
    <group ref={groupRef}>
      {globePositions.map((data, i) => (
        <GlobeCell 
            key={i} 
            position={data.pos} 
            rotation={data.rot}
            model={data.model} 
            isEmpty={data.isEmpty} 
        />
      ))}
      
      {/* Inner Light Blue Core */}
      <mesh>
        <sphereGeometry args={[radius * 0.96, 32, 32]} />
        <meshStandardMaterial 
            color="#0ea5e9" 
            emissive="#0ea5e9"
            emissiveIntensity={0.3}
            transparent 
            opacity={0.15}
        />
      </mesh>
    </group>
  );
};

const TrendingGlobe = ({ items = [], models = [] }) => {
  const containerRef = useRef();
  const velocity = useRef({ x: 0, y: 0 });

  const mergedData = useMemo(() => {
    return [
        ...(models.map(m => ({ 
            id: m.id, 
            text: m.name.split(':')[1]?.trim() || m.name.split('/')[1] || m.name, 
            link: m.link || '#',
            type: 'model'
        }))),
        ...(items.slice(0, 40).map(n => ({ 
            id: n.link, 
            text: n.source, 
            link: n.link,
            type: 'news'
        })))
    ];
  }, [items, models]);

  // CAPTURE TOUCHPAD GESTURES & ISOLATE SCROLL
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Prevent page scroll
      e.preventDefault();
      
      // Direct mapping: rotate exactly as the finger moves
      // No momentum (not kinetic)
      if (velocity.current) {
        // We use the velocity ref as a direct rotation offset for the next frame
        // but reset it immediately after applying to ensure no momentum
        velocity.current.y = e.deltaX * 0.008;
        velocity.current.x = e.deltaY * 0.008;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <motion.div 
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-[650px] md:h-[850px] relative mt-16 overflow-hidden cursor-move"
    >
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [0, 0, 16], fov: 36 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
            <OrbitControls enableZoom={false} enablePan={false} />
            <ambientLight intensity={1.5} />
            <spotLight position={[20, 20, 20]} angle={0.2} intensity={2} />
            <pointLight position={[-20, -20, -20]} color="#0ea5e9" intensity={3} />
            <SolidGlobe mergedData={mergedData} velocity={velocity} />
        </Suspense>
      </Canvas>
      
      {/* Direct Control UI Feedback */}
      <div className="absolute inset-x-0 bottom-10 pointer-events-none flex flex-col items-center gap-6">
        <div className="bg-black/40 border border-white/5 px-12 py-5 rounded-full backdrop-blur-3xl shadow-2xl flex items-center gap-10">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.5em]">Direct Sensor Mode</p>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <p className="text-white/40 font-black text-[9px] uppercase tracking-[0.4em]">Follows Finger Direction</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TrendingGlobe;
