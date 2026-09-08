import React from 'react';
import { Card as CardType } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isBack?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, isBack, className }) => {
  const colorStyles = {
    red: {
      bg: 'bg-red-600',
      border: 'border-red-400',
      text: 'text-white',
      shadow: 'shadow-[0_4px_15px_rgba(220,38,38,0.45)]',
      ovalBg: 'bg-white/15 border border-white/10',
      ovalText: 'text-white'
    },
    blue: {
      bg: 'bg-blue-600',
      border: 'border-blue-400',
      text: 'text-white',
      shadow: 'shadow-[0_4px_15px_rgba(37,99,235,0.45)]',
      ovalBg: 'bg-white/15 border border-white/10',
      ovalText: 'text-white'
    },
    green: {
      bg: 'bg-emerald-600',
      border: 'border-emerald-400',
      text: 'text-white',
      shadow: 'shadow-[0_4px_15px_rgba(5,150,105,0.45)]',
      ovalBg: 'bg-white/15 border border-white/10',
      ovalText: 'text-white'
    },
    yellow: {
      bg: 'bg-yellow-400',
      border: 'border-yellow-300',
      text: 'text-zinc-950',
      shadow: 'shadow-[0_4px_15px_rgba(234,179,8,0.45)]',
      ovalBg: 'bg-black/10 border border-black/5',
      ovalText: 'text-zinc-950'
    },
    wild: {
      bg: 'bg-zinc-950',
      border: 'border-zinc-800',
      text: 'text-white',
      shadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
      ovalBg: 'bg-zinc-900 border border-zinc-700 shadow-md',
      ovalText: 'text-white font-black'
    }
  };

  const renderValue = (val: string) => {
    switch (val) {
      case 'skip': return '⊘';
      case 'reverse': return '⇄';
      case 'draw2': return '+2';
      case 'wild': return 'W';
      case 'wild4': return '+4';
      default: return val;
    }
  };

  if (isBack) {
    return (
      <div className={cn(
        "w-20 h-32 rounded-xl border-4 border-white shadow-lg bg-zinc-950 flex items-center justify-center relative overflow-hidden select-none",
        className
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 opacity-95" />
        <div className="absolute inset-2 border-2 border-white/30 rounded-lg" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-zinc-950 -rotate-12 flex items-center justify-center border-y-2 border-yellow-400 shadow-xl">
          <span className="text-yellow-400 font-extrabold text-lg italic tracking-wider">UNO</span>
        </div>
      </div>
    );
  }

  const styles = colorStyles[card.color] || colorStyles.wild;
  const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  return (
    <motion.div
      whileHover={!disabled && supportsHover ? { scale: 1.08, y: -10 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "w-20 h-32 rounded-xl border-4 border-white shadow-xl flex flex-col items-center justify-between p-2 cursor-pointer relative overflow-hidden transition-all select-none",
        styles.bg,
        styles.border,
        styles.shadow,
        disabled && "opacity-45 grayscale-[20%] cursor-not-allowed",
        className
      )}
    >
      {/* Wild overlay */}
      {card.color === 'wild' && (
        <div className="absolute inset-0 pointer-events-none flex flex-wrap opacity-100">
          <div className="w-1/2 h-1/2 bg-red-600" />
          <div className="w-1/2 h-1/2 bg-blue-600" />
          <div className="w-1/2 h-1/2 bg-yellow-400" />
          <div className="w-1/2 h-1/2 bg-emerald-600" />
        </div>
      )}

      {/* Top Left Symbol */}
      <div className={cn(
        "self-start font-extrabold text-sm leading-none z-10 drop-shadow-sm", 
        styles.text
      )}>
        {renderValue(card.value)}
      </div>
      
      {/* Center Oval / Badge */}
      <div className={cn(
        "w-14 h-20 rounded-[50%] flex items-center justify-center rotate-12 shadow-inner z-10",
        styles.ovalBg
      )}>
        <span className={cn(
          "font-black text-2xl italic drop-shadow-sm", 
          styles.ovalText
        )}>
          {renderValue(card.value)}
        </span>
      </div>

      {/* Bottom Right Symbol */}
      <div className={cn(
        "self-end font-extrabold text-sm leading-none rotate-180 z-10 drop-shadow-sm", 
        styles.text
      )}>
        {renderValue(card.value)}
      </div>
    </motion.div>
  );
};
