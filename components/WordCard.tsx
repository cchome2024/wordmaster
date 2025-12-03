import React from 'react';
import { WordItem } from '../types';

interface WordCardProps {
  item: WordItem;
  isPlaying: boolean;
}

export const WordCard: React.FC<WordCardProps> = ({ item, isPlaying }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-2xl transition-all duration-300 transform hover:scale-[1.01]">
      {/* ID Badge */}
      <div className="mb-6">
        <span className="px-3 py-1 bg-indigo-600 rounded-full text-xs font-bold tracking-widest text-indigo-100 uppercase">
          Word #{item.id}
        </span>
      </div>

      {/* Main Word */}
      <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4 text-center tracking-tight">
        {item.word}
      </h1>

      {/* Phonetic & POS */}
      <div className="flex items-center space-x-4 mb-8 text-xl text-gray-400">
        <span className="font-mono bg-gray-900 px-3 py-1 rounded-lg border border-gray-700 text-yellow-500">
          {item.phonetic}
        </span>
        <span className="italic text-gray-500">{item.partOfSpeech}</span>
      </div>

      {/* Meaning */}
      <div className="text-center">
        <p className="text-2xl md:text-3xl text-gray-200 font-medium leading-relaxed">
          {item.meaning}
        </p>
        <p className="mt-2 text-sm text-gray-500">
            Frequency Info: {item.frequencyRaw}
        </p>
      </div>

      {/* Visualizer */}
      <div className="h-12 mt-8 flex items-end justify-center space-x-1 w-full">
        {isPlaying ? (
          <>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 bg-indigo-500 rounded-t-sm animate-pulse"
                style={{
                  height: '100%',
                  animationDuration: `${0.4 + i * 0.1}s`,
                  animationName: 'bounce' 
                }}
              />
            ))}
            <style>{`
              @keyframes bounce {
                0%, 100% { height: 20%; opacity: 0.5; }
                50% { height: 100%; opacity: 1; }
              }
            `}</style>
          </>
        ) : (
           <div className="text-gray-600 text-sm">Ready to play</div>
        )}
      </div>
    </div>
  );
};