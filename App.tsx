import React, { useState, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { GameCanvas } from './components/GameCanvas';
import { StartScreen, Toolbar, ErrorDisplay } from './components/UIOverlay';
import { CategoryType } from './types';

const PixelPyroApp: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentType, setCurrentType] = useState('rocket');
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null); 
  const [showInstruction, setShowInstruction] = useState(false);

  const handleStart = useCallback(() => {
    setGameStarted(true);
    setShowInstruction(true);
    setTimeout(() => setShowInstruction(false), 3000);
  }, []);

  const handleMoonHit = useCallback(() => {
    // Optional: Add analytics event here if backend existed
    console.log('Moon event triggered');
  }, []);

  return (
    <div className="h-[100dvh] w-screen relative bg-[#050510] flex flex-col font-sans select-none overflow-hidden">
      {/* Game Layer */}
      <GameCanvas 
        gameStarted={gameStarted} 
        currentType={currentType}
        onMoonHit={handleMoonHit}
      />

      {/* UI Overlay Layer */}
      {!gameStarted && <StartScreen onStart={handleStart} />}
      
      {/* HUD */}
      {gameStarted && (
        <div 
          className="absolute top-0 left-0 w-full pointer-events-none z-20 p-4"
          style={{ 
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
        >
          <div className="flex flex-col items-start pointer-events-auto">
            <h1 className="text-lg md:text-xl text-yellow-400 pixel-text opacity-50 drop-shadow-md">PIXEL PYRO</h1>
            <button 
              onClick={() => setGameStarted(false)} 
              className="mt-2 w-fit bg-red-500 text-white text-[10px] px-2 py-1 border border-white shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000] pixel-text hover:bg-red-400"
            >
              EXIT
            </button>
          </div>
        </div>
      )}

      {/* Instruction Overlay */}
      {gameStarted && (
        <div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-1000 z-20 ${showInstruction ? 'opacity-100' : 'opacity-0'}`}
        >
          <p className="text-sm text-white pixel-text bg-black/50 p-2 border border-white whitespace-nowrap">
            TAP OR DRAG TO IGNITE
          </p>
        </div>
      )}

      {/* Controls */}
      <Toolbar 
        activeCategory={activeCategory}
        currentType={currentType}
        onCategorySelect={setActiveCategory}
        onTypeSelect={setCurrentType}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorDisplay}>
      <PixelPyroApp />
    </ErrorBoundary>
  );
};

export default App;