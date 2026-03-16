import React from 'react';
import { motion } from 'motion/react';
import { Smile, Frown, X } from 'lucide-react';

interface ResultModalProps {
  type: 'goal' | 'stop';
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ type, onClose }) => {
  const isGoal = type === 'goal';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className={`relative w-full max-w-sm bg-zinc-900 border-2 ${isGoal ? 'border-[#00FF00]' : 'border-red-500'} rounded-[40px] p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]`}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6 flex justify-center">
          <motion.div
            animate={isGoal ? {
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {
              y: [0, 10, 0]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {isGoal ? (
              <Smile className="w-24 h-24 text-[#00FF00]" />
            ) : (
              <Frown className="w-24 h-24 text-red-500" />
            )}
          </motion.div>
        </div>

        <h2 className={`text-3xl font-black mb-2 tracking-tighter ${isGoal ? 'text-[#00FF00]' : 'text-red-500'}`}>
          {isGoal ? 'META ATINGIDA!' : 'STOP ATINGIDO!'}
        </h2>
        
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          {isGoal 
            ? 'Parabéns! Você alcançou seu objetivo diário. O robô foi pausado para proteger seu lucro.' 
            : 'O limite de perda diária foi atingido. O robô parou automaticamente para preservar seu capital.'}
        </p>

        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl font-bold transition-all ${
            isGoal 
              ? 'bg-[#00FF00] text-black hover:bg-[#00CC00]' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {isGoal ? 'VAMOS COMEMORAR!' : 'ENTENDIDO'}
        </button>
      </motion.div>
    </div>
  );
};
