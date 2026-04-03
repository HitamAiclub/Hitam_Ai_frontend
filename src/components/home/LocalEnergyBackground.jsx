import React from "react";
import { motion } from "framer-motion";

const LocalEnergyBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-transparent">
      {/* Primary Energy Layer - Divine Blue/Teal Node */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -50, 100, 0],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[70%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.2)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)] blur-2xl md:blur-[180px] will-change-transform"
      />

      {/* Secondary Energy Layer - Divine Purple/Pink Node */}
      <motion.div
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 50, -100, 0],
          scale: [1.1, 1.3, 1.1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[70%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(147,51,234,0.2)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle_at_center,_rgba(147,51,234,0.15)_0%,_transparent_70%)] blur-2xl md:blur-[180px] will-change-transform"
      />

      {/* Accent Layer - Intense Energy Core */}
      <motion.div
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.1)_0%,_rgba(236,72,153,0.05)_40%,_transparent_70%)] blur-2xl md:blur-[220px] mix-blend-screen will-change-transform opacity-50"
      />

      {/* Static Noise Texture Overlay (Premium Detail) */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default LocalEnergyBackground;
