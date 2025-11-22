import React from 'react';
import { ArrowLeft, Play, AlertCircle } from 'lucide-react';
import { CATEGORIES, FIRECRACKER_TYPES } from '../constants';
import { CategoryType } from '../types';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => (
  <div className="absolute top-0 left-0 w-full h-full z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
    <div className="bg-[#1a1a2e] border-4 border-white shadow-[6px_6px_0px_#000] p-8 md:p-12 flex flex-col items-center text-center max-w-lg mx-4">
      <h1 className="text-3xl md:text-5xl mb-6 text-yellow-400 pixel-text animate-pulse shadow-black drop-shadow-md">PIXEL PYRO</h1>
      <p className="text-xs md:text-sm text-gray-300 mb-8 leading-6 pixel-text">
        Tap anywhere to launch fireworks.<br/>
        Don't annoy the neighbors!<br/>
        Hit the moon for a surprise.
      </p>
      <button 
        onClick={onStart}
        className="bg-green-500 text-white px-8 py-4 text-sm md:text-base hover:bg-green-400 border-2 border-white shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000] transition-all pixel-text flex items-center gap-2"
      >
        <Play size={16} /> IGNITE
      </button>
    </div>
  </div>
);

interface ToolbarProps {
  activeCategory: CategoryType | null;
  currentType: string;
  onCategorySelect: (cat: CategoryType | null) => void;
  onTypeSelect: (id: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeCategory, currentType, onCategorySelect, onTypeSelect }) => {
  return (
    <div 
      className="h-auto min-h-[110px] bg-[#1a1a2e] w-full flex flex-col justify-center items-center py-2 z-10 relative shadow-[0_-4px_10px_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 border-2 border-[#1a1a2e]">
        <p className="text-[9px] text-black font-bold uppercase pixel-text tracking-widest">
          {activeCategory ? activeCategory : 'Categories'}
        </p>
      </div>
      
      <div className="flex gap-3 justify-start overflow-x-auto no-scrollbar w-full px-4 pt-4 pb-2 scroll-smooth touch-pan-x">
        {activeCategory === null ? (
          CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className="flex-shrink-0 w-16 h-16 flex flex-col items-center justify-center gap-1 rounded border-2 border-white transition-all duration-75 pixel-text shadow-[4px_4px_0px_#000] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000]"
              style={{ backgroundColor: cat.color }}
            >
              <div className="p-1 bg-black/20 rounded-full">
                <cat.icon size={20} color="white" strokeWidth={2.5} />
              </div>
              <span className="text-[8px] font-bold text-black leading-tight text-center uppercase px-1">
                {cat.name}
              </span>
            </button>
          ))
        ) : (
          <>
            <button
              onClick={() => onCategorySelect(null)}
              className="flex-shrink-0 w-12 h-16 flex flex-col items-center justify-center gap-1 rounded border-2 border-white bg-gray-700 transition-all duration-75 pixel-text shadow-[4px_4px_0px_#000] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000]"
            >
              <ArrowLeft size={20} color="white" />
              <span className="text-[8px] font-bold text-white leading-tight text-center uppercase">Back</span>
            </button>
            
            {FIRECRACKER_TYPES.filter(t => t.category === activeCategory).map((type) => (
              <button
                key={type.id}
                onClick={() => onTypeSelect(type.id)}
                className={`flex-shrink-0 w-16 h-16 flex flex-col items-center justify-center gap-1 rounded border-2 border-white transition-all duration-75 pixel-text
                  ${currentType === type.id 
                    ? 'translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_#000] brightness-110 ring-2 ring-white' 
                    : 'shadow-[4px_4px_0px_#000] hover:brightness-110'
                  }
                `}
                style={{ backgroundColor: type.color }}
              >
                <div className="p-1 bg-black/20 rounded-full">
                  <type.icon size={18} color="white" strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-bold text-black leading-tight text-center uppercase px-1">
                  {type.name}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export const ErrorDisplay: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center h-screen w-screen bg-red-900 text-white p-6">
    <AlertCircle size={48} className="mb-4" />
    <h1 className="text-2xl pixel-text mb-4">CRITICAL FAILURE</h1>
    <p className="mb-4 font-mono text-sm bg-black/50 p-4 rounded">{error.message}</p>
    <button 
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-white text-red-900 font-bold pixel-text hover:bg-gray-200"
    >
      REBOOT SYSTEM
    </button>
  </div>
);