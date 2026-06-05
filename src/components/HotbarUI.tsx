import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { Game } from '../game/Game';
import { ITEM_NAMES } from '../game/Constants';
import { ItemIcon } from './inventory/Slot';
import { settingsManager } from '../game/Settings';
import { ItemType } from '../game/Inventory';
import { Smile, Palette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

const EMOJIS = ['👋', '🤣', '😭', '❤️', '🔥', '💀', '👍', '👎'];

export const HotbarUI: React.FC<{ game: Game | null }> = ({ game }) => {
  const inventoryVersion = useGameStore(state => state.inventoryVersion);
  const globalHotbarIndex = useGameStore(state => state.hotbarIndex);
  const setGlobalHotbarIndex = useGameStore(state => state.setHotbarIndex);
  const isEmojiWheelOpen = useUIStore(state => state.isEmojiWheelOpen);
  const setEmojiWheelOpen = useUIStore(state => state.setEmojiWheelOpen);
  
  const fluidColor = useGameStore((state) => state.fluidColor);
  const setFluidColor = useGameStore((state) => state.setFluidColor);
  const isFluidColorPickerOpen = useGameStore((state) => state.isFluidColorPickerOpen);
  const setIsFluidColorPickerOpen = useGameStore((state) => state.setIsFluidColorPickerOpen);

  const hasHose = game?.player.inventory.slots[globalHotbarIndex]?.type === ItemType.FLUID_CHOCOLATE_HOSE;

  const [hotbarItems, setHotbarItems] = useState<(any | null)[]>(new Array(9).fill(null));

  const [dropProgress, setDropProgress] = useState<{ index: number, progress: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (game) {
      setHotbarItems([...game.player.inventory.slots.slice(0, 9)]);
    }
  }, [game, inventoryVersion]);

  const handlePointerDown = (e: React.PointerEvent, i: number) => {
    e.stopPropagation();
    
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    setDropProgress({ index: i, progress: 0 });
    
    const startTime = Date.now();
    const duration = 1000; // 1 second to drop
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setDropProgress({ index: i, progress });
    }, 50);

    longPressTimer.current = setTimeout(() => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setDropProgress(null);
      if (window.mobileInputs) {
        window.mobileInputs.triggerDrop = true;
      }
    }, duration);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    setDropProgress(null);
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  if (!game) return null;

  return (
    <div className="absolute bottom-0 sm:bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 pointer-events-none safe-mb z-[60] scale-[0.65] sm:scale-85 md:scale-100 landscape:scale-[0.65] sm:landscape:scale-85 md:landscape:scale-90 lg:landscape:scale-100 origin-bottom">
      
      {/* Emoji Wheel */}
      {isEmojiWheelOpen && (
         <div 
           className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 h-64 bg-black/60 rounded-full border-4 border-white/20 backdrop-blur-sm pointer-events-auto"
           onPointerDown={e => e.stopPropagation()}
           onClick={e => e.stopPropagation()}
         >
            {EMOJIS.map((emoji, index) => {
               const angle = (index / EMOJIS.length) * Math.PI * 2 - Math.PI / 2;
               const radius = 90;
               const x = Math.cos(angle) * radius;
               const y = Math.sin(angle) * radius;
               
               return (
                  <button
                     key={index}
                     className="absolute flex items-center justify-center w-14 h-14 bg-white/10 hover:bg-white/30 rounded-full transition-transform hover:scale-125 hover:z-10"
                     style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)'
                     }}
                     onClick={(e) => {
                        e.stopPropagation();
                        if (game) {
                           game.player.currentEmoji = emoji;
                           // clear emoji after 4 seconds
                           setTimeout(() => {
                               if (game.player.currentEmoji === emoji) {
                                   game.player.currentEmoji = undefined;
                               }
                           }, 4000);
                        }
                        setEmojiWheelOpen(false);
                     }}
                     onPointerDown={(e) => {
                        e.stopPropagation();
                        if (game) {
                           game.player.currentEmoji = emoji;
                           // clear emoji after 4 seconds
                           setTimeout(() => {
                               if (game.player.currentEmoji === emoji) {
                                   game.player.currentEmoji = undefined;
                               }
                           }, 4000);
                        }
                        setEmojiWheelOpen(false);
                     }}
                  >
                     <span className="text-3xl">{emoji}</span>
                  </button>
               );
            })}
         </div>
      )}

      <div className="flex items-end gap-2">
        {hasHose && (
          <div className="relative hidden max-md:landscape:flex focus-within:z-[100]">
            {isFluidColorPickerOpen && (
              <div 
                className="absolute bottom-full mb-2 left-0 z-50 bg-gray-900 rounded-xl p-3 flex flex-col gap-2 shadow-2xl border border-white/10 pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <HexColorPicker color={fluidColor} onChange={setFluidColor} style={{ width: '120px', height: '120px' }} />
                <div className="mt-2 flex gap-1 flex-wrap w-[120px]">
                  {[
                    '#3d1c04', // Chocolate
                    '#1e90ff', // Water
                    '#ff4500', // Lava
                    '#32cd32', // Slime
                    '#a24cbf', // Poison
                    '#ffcc00', // Honey
                  ].map((preset) => (
                    <button
                      key={preset}
                      className="w-5 h-5 rounded-full border border-white/20"
                      style={{ backgroundColor: preset }}
                      onClick={(e) => { e.stopPropagation(); setFluidColor(preset); }}
                    />
                  ))}
                </div>
              </div>
            )}
            <button
               className="relative flex justify-center items-center flex-shrink-0 transition-all w-12 h-12 bg-[#8B8B8B] border-[3px] border-l-white border-t-white border-r-[#373737] border-b-[#373737] hover:bg-[#A0A0A0] shadow-xl pointer-events-auto"
               onClick={(e) => {
                 e.stopPropagation();
                 setIsFluidColorPickerOpen(!isFluidColorPickerOpen);
               }}
               onPointerDown={(e) => {
                 e.stopPropagation();
                 setIsFluidColorPickerOpen(!isFluidColorPickerOpen);
               }}
            >
              <Palette size={24} color={fluidColor} className="text-white" />
            </button>
          </div>
        )}
        <div 
          className="flex items-center gap-0.5 sm:gap-0 p-1 bg-[#C6C6C6] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#555555] shadow-2xl pointer-events-auto max-w-[100vw] sm:max-w-none overflow-x-auto custom-scrollbar rounded-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
        {hotbarItems.map((item, i) => {
          const isSelected = i === globalHotbarIndex;
          const showProgress = dropProgress?.index === i && dropProgress.progress > 0 && dropProgress.progress < 100;
          return (
            <button
              key={i}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onClick={(e) => {
                e.stopPropagation();
                if (game) {
                  game.player.hotbarIndex = i;
                  setGlobalHotbarIndex(i);
                }
              }}
              title={item ? `${ITEM_NAMES[item.type]} x${item.count}` : undefined}
              className={`
                relative flex items-center justify-center flex-shrink-0 transition-all overflow-hidden
                w-10 h-10 sm:w-12 sm:h-12
                ${isSelected 
                  ? 'bg-[#8B8B8B] border-[3px] sm:border-4 border-white z-10 scale-105 sm:scale-110 shadow-xl rounded-sm' 
                  : 'bg-[#8B8B8B] border-2 border-black/20 hover:bg-[#A0A0A0]'
                }
              `}
            >
              {showProgress && (
                <div 
                  className="absolute bottom-0 left-0 h-1.5 bg-green-500 z-20"
                  style={{ width: `${dropProgress.progress}%` }}
                />
              )}
              {item ? (
                <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center relative">
                  <ItemIcon item={item} />
                  {showProgress && (
                    <div 
                      className="absolute inset-0 bg-green-500/30 z-10"
                      style={{ 
                         clipPath: `polygon(0 0, ${dropProgress.progress}% 0, ${dropProgress.progress}% 100%, 0 100%)`
                      }}
                    />
                  )}
                </div>
              ) : null}
              <span className="absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-bold text-white/20">
                {i + 1}
              </span>
            </button>
          );
        })}
        </div>
        
        {/* Separated Emoji Button */}
        <button
          className="relative flex justify-center items-center flex-shrink-0 transition-all w-12 h-12 bg-[#8B8B8B] border-[3px] border-l-white border-t-white border-r-[#373737] border-b-[#373737] hover:bg-[#A0A0A0] shadow-xl pointer-events-auto"
          onClick={(e) => {
             e.stopPropagation();
             const newState = !isEmojiWheelOpen;
             setEmojiWheelOpen(newState);
             if (newState && document.pointerLockElement) {
                 document.exitPointerLock();
             }
          }}
          onPointerDown={(e) => {
             e.stopPropagation();
             const newState = !isEmojiWheelOpen;
             setEmojiWheelOpen(newState);
             if (newState && document.pointerLockElement) {
                 document.exitPointerLock();
             }
          }}
        >
           <Smile size={24} className="text-white" />
           <span className="absolute -top-3 -right-2 text-xs font-bold text-white bg-black/50 px-1 py-0.5 rounded shadow">
              [H]
           </span>
        </button>
      </div>
    </div>
  );
};
