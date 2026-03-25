import React from 'react';
import { motion } from 'motion/react';

interface VisualizerProps {
  isPlaying: boolean;
  isBuffering: boolean;
  color?: string; // CSS variable name or color class
  barCount?: number;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  isPlaying, 
  isBuffering, 
  color = 'var(--accent-primary)', 
  barCount = 20 
}) => {
  const bars = Array.from({ length: barCount });

  return (
    <div className="flex items-end justify-center gap-[2px] h-full w-full overflow-hidden opacity-20 pointer-events-none">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          animate={isPlaying && !isBuffering ? {
            height: [
              `${Math.random() * 40 + 10}%`,
              `${Math.random() * 80 + 20}%`,
              `${Math.random() * 50 + 15}%`,
              `${Math.random() * 90 + 10}%`,
              `${Math.random() * 40 + 10}%`,
            ]
          } : {
            height: '10%'
          }}
          transition={{
            duration: Math.random() * 0.5 + 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05
          }}
          style={{ backgroundColor: color.startsWith('var') ? color : undefined }}
          className={`w-1 rounded-full ${!color.startsWith('var') ? color : ''} min-h-[2px]`}
        />
      ))}
    </div>
  );
};

export default Visualizer;
