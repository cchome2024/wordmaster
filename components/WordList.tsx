import React, { useEffect, useRef } from 'react';
import { WordItem } from '../types';

interface WordListProps {
  words: WordItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export const WordList: React.FC<WordListProps> = ({ words, currentIndex, onSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto bg-gray-900 border-l border-gray-800 relative"
    >
      <div className="sticky top-0 bg-gray-900/90 backdrop-blur-sm p-4 border-b border-gray-800 z-10 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-300">Word List</h2>
        <span className="text-xs text-gray-500">{currentIndex + 1} / {words.length}</span>
      </div>
      
      <div className="p-4 space-y-2 pb-24">
        {words.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={item.id}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelect(index)}
              className={`
                p-3 rounded-xl cursor-pointer transition-all duration-200 border
                ${isActive 
                  ? 'bg-gray-800 border-indigo-500 shadow-lg shadow-indigo-500/10 active-item-scroll' 
                  : 'bg-gray-800/40 border-transparent hover:bg-gray-800 hover:border-gray-700'
                }
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {item.word}
                </span>
                <span className="text-xs text-gray-600 font-mono">#{item.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{item.phonetic}</span>
                <span className={`truncate max-w-[120px] text-right ${isActive ? 'text-indigo-300' : 'text-gray-600'}`}>
                    {item.meaning}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
