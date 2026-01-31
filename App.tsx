import React, { useState, useEffect, useCallback } from 'react';
import { GameState, LetterStatus, WordItem } from './types';
import { generateWordList, generateImageForWord, generateSpeech } from './services/geminiService';
import { playPcmAudio } from './services/audioService';
import { LetterButton } from './components/LetterButton';
import { CategoryCard } from './components/CategoryCard';
import { ArrowLeft, RefreshCcw, Star, Volume2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'animals', label: 'Animals', icon: '🦁', color: 'bg-candy-pink' },
  { id: 'fruits', label: 'Fruits', icon: '🍎', color: 'bg-candy-green' },
  { id: 'colors', label: 'Colors', icon: '🎨', color: 'bg-candy-blue' },
  { id: 'body', label: 'Body', icon: '👂', color: 'bg-candy-yellow' },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    category: null,
    words: [],
    currentIndex: 0,
    score: 0,
    mode: 'MENU'
  });

  // Level State
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scrambledLetters, setScrambledLetters] = useState<LetterStatus[]>([]);
  const [placedLetters, setPlacedLetters] = useState<(LetterStatus | null)[]>([]);
  const [isWordComplete, setIsWordComplete] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  // Sound cache to avoid regenerating same audio repeatedly in a session (optional optimization)
  // For simplicity, we regenerate or just trust browser cache if we were using URLs, but here we use raw data.

  const playSound = async (text: string) => {
    try {
      const audioData = await generateSpeech(text);
      if (audioData) {
        await playPcmAudio(audioData);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const startCategory = async (categoryId: string) => {
    setGameState(prev => ({ ...prev, mode: 'LOADING_CATEGORY', category: categoryId, score: 0, currentIndex: 0 }));
    setIsLoading(true);
    
    const words = await generateWordList(categoryId);
    
    setGameState(prev => ({ 
      ...prev, 
      words: words, 
      mode: 'PLAYING',
      currentIndex: 0
    }));
    
    setIsLoading(false);
  };

  const loadLevel = useCallback(async () => {
    const wordItem = gameState.words[gameState.currentIndex];
    if (!wordItem) return;

    setIsLoading(true);
    setIsWordComplete(false);
    setCurrentImage(null);
    setFeedbackMessage("");

    // Prepare letters
    const word = wordItem.word.toUpperCase();
    const letters = word.split('').map((char, i) => ({
      char,
      id: `${char}-${i}-${Date.now()}`,
      isPlaced: false
    }));
    
    // Shuffle for the bottom tray
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    setScrambledLetters(shuffled);
    
    // Empty slots
    setPlacedLetters(new Array(word.length).fill(null));

    // Parallel fetch image and audio
    try {
        const [imgData, _] = await Promise.all([
            generateImageForWord(wordItem.word),
            playSound(`Spell the word, ${wordItem.word}`)
        ]);
        setCurrentImage(imgData || `https://picsum.photos/400/400?random=${Date.now()}`); // Fallback
    } catch (e) {
        console.error(e);
        setCurrentImage(`https://picsum.photos/400/400?random=${Date.now()}`);
    } finally {
        setIsLoading(false);
    }
  }, [gameState.words, gameState.currentIndex]);

  useEffect(() => {
    if (gameState.mode === 'PLAYING' && gameState.words.length > 0) {
      loadLevel();
    }
  }, [gameState.mode, gameState.currentIndex, loadLevel]);

  const handleLetterClick = async (letter: LetterStatus) => {
    if (isWordComplete || isLoading) return;

    const currentWord = gameState.words[gameState.currentIndex].word.toUpperCase();
    const nextIndex = placedLetters.findIndex(l => l === null);
    
    if (nextIndex === -1) return; // Full

    // Check if correct letter for this slot (Strict ordering for 3yo)
    const expectedChar = currentWord[nextIndex];

    if (letter.char === expectedChar) {
      // Correct!
      const newPlaced = [...placedLetters];
      newPlaced[nextIndex] = letter;
      setPlacedLetters(newPlaced);

      setScrambledLetters(prev => prev.map(l => l.id === letter.id ? { ...l, isPlaced: true } : l));

      // Say the letter with a clearer prompt to avoid API errors
      playPcmAudio(await generateSpeech(`The letter ${letter.char}`) || '');

      // Check win
      if (nextIndex === currentWord.length - 1) {
        handleWin();
      }
    } else {
      // Wrong letter
      setFeedbackMessage("Try again!");
      setTimeout(() => setFeedbackMessage(""), 1000);
      // Play a gentle "boop" or wrong sound (could use TTS "Oops")
    }
  };

  const handleWin = async () => {
    setIsWordComplete(true);
    setGameState(prev => ({ ...prev, score: prev.score + 1 }));
    const wordItem = gameState.words[gameState.currentIndex];
    
    // Confetti or visual cue handled by UI state
    await playSound(`Good job! ${wordItem.word}! ${wordItem.sentence}`);

    setTimeout(() => {
      if (gameState.currentIndex < gameState.words.length - 1) {
        setGameState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      } else {
        setGameState(prev => ({ ...prev, mode: 'VICTORY' }));
        playSound("You finished the whole set! Amazing!");
      }
    }, 4000);
  };

  const resetGame = () => {
    setGameState({
      category: null,
      words: [],
      currentIndex: 0,
      score: 0,
      mode: 'MENU'
    });
  };

  // --- RENDERERS ---

  if (gameState.mode === 'MENU') {
    return (
      <div className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col justify-center">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-black text-candy-blue drop-shadow-lg tracking-wider mb-4 font-[Comic Sans MS]">
            KindySpell
          </h1>
          <p className="text-xl text-slate-500 font-medium">Pick a topic to start!</p>
        </header>

        <div className="grid grid-cols-2 gap-6">
          {CATEGORIES.map(cat => (
            <CategoryCard 
              key={cat.id} 
              {...cat} 
              onClick={() => startCategory(cat.id)} 
            />
          ))}
        </div>
      </div>
    );
  }

  if (gameState.mode === 'LOADING_CATEGORY') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-8xl animate-bounce mb-8">🎈</div>
        <h2 className="text-3xl font-bold text-slate-400 animate-pulse">Making magic...</h2>
      </div>
    );
  }

  if (gameState.mode === 'VICTORY') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-candy-yellow/20">
        <div className="text-9xl mb-6 animate-wiggle">🏆</div>
        <h1 className="text-5xl font-black text-slate-800 mb-4">You did it!</h1>
        <p className="text-2xl text-slate-600 mb-12">Score: {gameState.score} Stars!</p>
        
        <button 
          onClick={resetGame}
          className="bg-candy-blue hover:bg-blue-300 text-white text-3xl font-bold py-6 px-12 rounded-full shadow-xl transform transition hover:scale-105 active:scale-95"
        >
          Play Again
        </button>
      </div>
    );
  }

  // PLAYING MODE
  const currentWordItem = gameState.words[gameState.currentIndex];

  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto bg-white shadow-2xl overflow-hidden sm:rounded-xl my-0 sm:my-4">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-50 border-b-2 border-slate-100">
        <button onClick={resetGame} className="p-2 rounded-full hover:bg-slate-200">
          <ArrowLeft className="w-8 h-8 text-slate-500" />
        </button>
        <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <span className="text-xl font-bold text-yellow-700">{gameState.score}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center p-6 relative">
        
        {/* Feedback Overlay */}
        {feedbackMessage && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
             <span className="text-6xl font-black text-red-400 drop-shadow-xl animate-bounce">
               {feedbackMessage}
             </span>
           </div>
        )}

        {/* Image Area */}
        <div className="w-64 h-64 mb-8 bg-slate-100 rounded-3xl shadow-inner flex items-center justify-center overflow-hidden border-4 border-white ring-4 ring-slate-50">
          {isLoading ? (
             <RefreshCcw className="w-12 h-12 text-slate-300 animate-spin" />
          ) : (
            currentImage ? (
              <img src={currentImage} alt={currentWordItem?.word} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">🖼️</span>
            )
          )}
        </div>

        {/* Target Slots */}
        <div className="flex gap-2 mb-12">
          {placedLetters.map((letter, idx) => (
            <div 
              key={idx} 
              className={`
                w-16 h-16 border-b-4 rounded-xl flex items-center justify-center text-4xl font-black transition-all
                ${letter 
                  ? 'bg-candy-blue border-blue-400 text-white shadow-lg scale-100' 
                  : 'bg-slate-100 border-slate-200 text-transparent scale-95'
                }
              `}
            >
              {letter ? letter.char : ''}
            </div>
          ))}
        </div>

        {/* Word Replay Button */}
        {!isLoading && !isWordComplete && (
           <button 
             onClick={() => playSound(currentWordItem.word)}
             className="mb-8 flex items-center gap-2 text-slate-400 hover:text-candy-blue font-bold"
           >
             <Volume2 className="w-6 h-6" /> Hear Word
           </button>
        )}

        {/* Letter Tray */}
        <div className="w-full mt-auto">
          <div className="flex flex-wrap justify-center gap-4 p-4 bg-slate-50 rounded-3xl border-2 border-slate-100">
             {scrambledLetters.map((l) => (
               <div key={l.id} className={l.isPlaced ? 'opacity-0 pointer-events-none' : ''}>
                 <LetterButton 
                   char={l.char} 
                   onClick={() => handleLetterClick(l)}
                   disabled={l.isPlaced}
                 />
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
