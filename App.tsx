import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RAW_WORD_LIST } from './constants';
import { WordItem } from './types';
import { WordCard } from './components/WordCard';
import { WordList } from './components/WordList';

// --- Parser ---
const parseWordList = (raw: string): WordItem[] => {
  const lines = raw.split('\n').filter(line => line.trim() !== '');
  const regex = /^(\d+)\.\s+([a-zA-Z]+)\s+\((.*?)\)\s+\/(.*?)\/\s+(.*?)\.\s+(.*)$/;

  return lines.map((line) => {
    const match = line.match(regex);
    if (!match) {
        // Fallback for slightly malformed lines if any
        const parts = line.split(' ');
        if(parts.length > 2) {
             return {
                id: parseInt(parts[0].replace('.', '')) || 0,
                word: parts[1],
                frequencyRaw: 'Unknown',
                phonetic: 'Unknown',
                partOfSpeech: '',
                meaning: parts.slice(2).join(' '),
                rawLine: line
            };
        }
        return {
            id: 0,
            word: "Error",
            frequencyRaw: "",
            phonetic: "",
            partOfSpeech: "",
            meaning: line,
            rawLine: line
        };
    }
    return {
      id: parseInt(match[1]),
      word: match[2],
      frequencyRaw: match[3],
      phonetic: `/${match[4]}/`,
      partOfSpeech: match[5],
      meaning: match[6],
      rawLine: line
    };
  });
};

const words = parseWordList(RAW_WORD_LIST);

// --- App Component ---

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2000); // 2 seconds delay between words

  // TTS Refs
  const timerRef = useRef<number | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef(isPlaying);

  // Sync ref with state to handle closure issues in callbacks
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Initialize voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const loadVoices = () => {
        const vs = window.speechSynthesis.getVoices();
        setVoices(vs);
    };
    loadVoices();
    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Cleanup on unmount
    return () => {
        window.speechSynthesis.cancel();
        if(timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const playWord = useCallback((index: number) => {
    if (index >= words.length) {
      setIsPlaying(false);
      return;
    }

    const wordItem = words[index];
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    if (timerRef.current) clearTimeout(timerRef.current);

    const utterance = new SpeechSynthesisUtterance(wordItem.word);
    
    // Configure Voice (English)
    utterance.lang = 'en-US';
    utterance.rate = 0.9; 
    
    // Try to pick a good voice
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) 
                        || voices.find(v => v.lang === 'en-US' && !v.name.includes("Microsoft")); 
    
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    } else {
        // Fallback to any en-US
        const anyEnglish = voices.find(v => v.lang === 'en-US');
        if(anyEnglish) utterance.voice = anyEnglish;
    }

    utterance.onend = () => {
       // When finished speaking, wait for delay then move next
       // Check ref because closure capture might have old isPlaying value if it wasn't a ref
       if (isPlayingRef.current) {
         timerRef.current = window.setTimeout(() => {
           setCurrentIndex(prev => {
             const next = prev + 1;
             if (next < words.length) {
               return next;
             } else {
               setIsPlaying(false);
               return prev;
             }
           });
         }, playbackSpeed);
       }
    };

    utterance.onerror = (e) => {
        console.error("TTS Error", e);
        setIsPlaying(false);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

  }, [voices, playbackSpeed]);

  // Effect to drive the loop
  useEffect(() => {
    if (isPlaying) {
      playWord(currentIndex);
    }
  }, [currentIndex, isPlaying, playWord]);

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    
    if (!nextState) {
        // Stopping
        window.speechSynthesis.cancel();
        if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
        if (timerRef.current) clearTimeout(timerRef.current);
        window.speechSynthesis.cancel();
        setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        window.speechSynthesis.cancel();
        setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSelectWord = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    window.speechSynthesis.cancel();
    setCurrentIndex(index);
    // Note: If isPlaying is true, the useEffect will trigger playWord for the new index
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Left Panel: Content */}
      <div className="flex-[2] flex flex-col relative bg-gray-900">
        
        {/* Header */}
        <div className="absolute top-0 left-0 p-6">
            <h1 className="text-2xl font-bold tracking-tighter text-white">
                <span className="text-indigo-500">Word</span> Master
            </h1>
        </div>

        {/* Main Card Area */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
             <WordCard 
                item={words[currentIndex]} 
                isPlaying={isPlaying} 
             />
        </div>

        {/* Controls Bar */}
        <div className="p-6 md:px-12 md:pb-12 bg-gray-900 z-20">
            <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-700 shadow-xl">
                
                {/* Playback Buttons */}
                <div className="flex items-center space-x-4">
                    <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 rounded-full hover:bg-gray-700 text-gray-300 disabled:opacity-30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                    </button>
                    
                    <button 
                        onClick={togglePlay} 
                        className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-lg hover:scale-105 ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                    >
                        {isPlaying ? (
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        )}
                    </button>

                    <button onClick={handleNext} disabled={currentIndex === words.length - 1} className="p-3 rounded-full hover:bg-gray-700 text-gray-300 disabled:opacity-30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                    </button>
                </div>

                {/* Speed Control */}
                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Interval</span>
                    <input 
                        type="range" 
                        min="500" 
                        max="5000" 
                        step="500" 
                        value={playbackSpeed} 
                        onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                        className="w-full md:w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-sm font-mono text-indigo-400 w-12 text-right">
                        {playbackSpeed / 1000}s
                    </span>
                </div>

            </div>
        </div>
      </div>

      {/* Right Panel: List */}
      <div className="h-64 md:h-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col">
        <WordList 
            words={words} 
            currentIndex={currentIndex} 
            onSelect={handleSelectWord} 
        />
      </div>
    </div>
  );
}