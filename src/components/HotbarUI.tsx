import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { Game } from '../game/Game';
import { ITEM_NAMES } from '../game/Constants';
import { ItemIcon } from './inventory/Slot';
import { Mail, X, Smile, Send } from 'lucide-react';
import { settingsManager } from '../game/Settings';
import { getSecureBackendUrl } from '../utils/security';
import { motion, AnimatePresence } from 'motion/react';

const EMOJIS = ['👋', '🤣', '😭', '❤️', '🔥', '💀', '👍', '👎'];

export const HotbarUI: React.FC<{ game: Game | null }> = ({ game }) => {
  const inventoryVersion = useGameStore(state => state.inventoryVersion);
  const globalHotbarIndex = useGameStore(state => state.hotbarIndex);
  const setGlobalHotbarIndex = useGameStore(state => state.setHotbarIndex);
  const isEmojiWheelOpen = useUIStore(state => state.isEmojiWheelOpen);
  const setEmojiWheelOpen = useUIStore(state => state.setEmojiWheelOpen);
  
  const [hotbarItems, setHotbarItems] = useState<(any | null)[]>(new Array(9).fill(null));

  const [dropProgress, setDropProgress] = useState<{ index: number, progress: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackKeybind, setFeedbackKeybind] = useState(() => settingsManager.getSettings().keybinds.feedback || 'KeyG');

  useEffect(() => {
    return settingsManager.subscribe((settings) => {
      if (settings.keybinds.feedback) {
        setFeedbackKeybind(settings.keybinds.feedback);
      }
    });
  }, []);

  useEffect(() => {
    if (game) {
      setHotbarItems([...game.player.inventory.slots.slice(0, 9)]);
    }
  }, [game, inventoryVersion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.code === feedbackKeybind) {
        setShowFeedbackModal(prev => {
          const next = !prev;
          if (next) {
            document.exitPointerLock();
            if (game && game.controls) {
              game.controls.unlock();
            }
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game, feedbackKeybind]);

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

  const sendFeedback = async () => {
    if (!feedbackText.trim()) return;
    try {
      const baseUrl = getSecureBackendUrl(import.meta.env.VITE_BACKEND_URL as string);
      const resp = await fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackText })
      });
      const data = await resp.json();
      if (data.warning) {
        alert("Feedback left locally.\nNotice: " + data.warning + "\n(To forward to Discord, set up a proper Webhook URL in AI Studio variables.)");
      } else {
        alert("Feedback sent successfully!");
      }
    } catch (e) {
      console.error('Failed to send feedback', e);
      alert("Failed to send feedback.");
    }
    setShowFeedbackModal(false);
    setFeedbackText("");
  };

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
                     onPointerDown={(e) => e.stopPropagation()}
                  >
                     <span className="text-3xl">{emoji}</span>
                  </button>
               );
            })}
         </div>
      )}

      <div className="flex items-end gap-2">
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
          onClick={(e) => {
             e.stopPropagation();
             const newState = !isEmojiWheelOpen;
             setEmojiWheelOpen(newState);
             if (newState && document.pointerLockElement) {
                 (window as any).suppressPauseMenu = true;
                 document.exitPointerLock();
             }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-[#C6C6C6] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#555555] p-2 hover:bg-[#8B8B8B] transition-colors rounded-sm group relative flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center"
          title="Open Emoji Wheel (Key: H)"
        >
           <Smile className="w-6 h-6 sm:w-8 sm:h-8 text-[#555555] group-hover:text-white" />
           <span className="absolute -top-3 right-0 bg-black/60 text-white text-[10px] px-1 rounded">H</span>
        </button>

        <button
          onClick={(e) => {
             e.stopPropagation();
             setShowFeedbackModal(true);
             (window as any).suppressPauseMenu = true;
             document.exitPointerLock();
             if (game && game.controls) game.controls.unlock();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-[#C6C6C6] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#555555] p-2 hover:bg-[#8B8B8B] transition-colors rounded-sm group relative flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center"
          title={`Send suggestions (Key: ${feedbackKeybind.replace('Key', '')})`}
        >
          <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-[#555555] group-hover:text-white" />
          <span className="absolute -top-3 right-0 bg-black/60 text-white text-[10px] px-1 rounded">{feedbackKeybind.replace('Key', '')}</span>
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {showFeedbackModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 pointer-events-auto cursor-default"
              onPointerDown={(e) => {
                e.stopPropagation();
                setShowFeedbackModal(false);
              }}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#C6C6C6] border-t-4 border-l-4 border-white border-b-4 border-r-4 border-[#555555] max-w-md w-full relative shadow-2xl overflow-hidden"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-[#8B8B8B] p-4 flex items-center justify-between border-b-4 border-[#555555]">
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" />
                    <h2 className="text-xl font-bold text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase tracking-wider">
                      Feedback
                    </h2>
                  </div>
                  <button 
                    onClick={() => setShowFeedbackModal(false)}
                    className="p-1 hover:bg-white/20 transition-colors rounded"
                  >
                    <X className="w-6 h-6 text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-[#333] text-sm font-bold uppercase tracking-wide">
                    Have ideas or found a bug? Let us know!
                  </p>
                  
                  <div className="relative group">
                    <textarea
                      className="w-full h-32 bg-[#A0A0A0] border-2 border-[#555555] p-3 text-black font-bold resize-none focus:outline-none focus:border-white focus:bg-[#C6C6C6] transition-colors shadow-inner placeholder:text-[#555555] custom-scrollbar"
                      placeholder="Type your suggestions here..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <button 
                    onClick={sendFeedback}
                    className="w-full flex items-center justify-center gap-2 bg-[#8B8B8B] hover:bg-[#A0A0A0] text-white font-bold py-3 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#555555] active:border-t-2 active:border-l-2 active:border-[#555555] active:border-b-white active:border-r-white transition-all uppercase tracking-widest shadow-lg"
                  >
                    <Send className="w-5 h-5 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]" />
                    <span className="drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">Submit</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
