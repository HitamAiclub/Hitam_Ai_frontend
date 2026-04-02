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
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[70%] rounded-full blur-[100px] md:blur-[180px] bg-blue-600/20 dark:bg-blue-500/15"
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
        className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[70%] rounded-full blur-[100px] md:blur-[180px] bg-purple-600/20 dark:bg-purple-600/15"
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[120px] md:blur-[220px] bg-gradient-to-tr from-cyan-400/10 via-transparent to-pink-500/10 opacity-30"
      />

      {/* Static Noise Texture Overlay (Premium Detail) */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default LocalEnergyBackground;
