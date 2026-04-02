import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = true, 
  delay = 0, 
  direction = 'up',
  ...props 
}) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const hoverVariants = hover ? {
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 10,
    },
  } : {};

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      whileHover={hoverVariants}
      variants={variants}
      className={`
        bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl 
        border border-white/20 dark:border-white/10 
        rounded-2xl shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] 
        overflow-hidden
        hover:bg-white/80 dark:hover:bg-gray-900/80
        transition-all duration-300
        relative z-10
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;