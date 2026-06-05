import { useState, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useGameStore } from '../store/gameStore';
import { ItemType } from '../game/Inventory';
import { Game } from '../game/Game';

export function LoadoutUI({ game }: { game: Game | null }) {
  const isOpen = useUIStore(state => state.isLoadoutOpen);
  const setIsOpen = useUIStore(state => state.setLoadoutOpen);
  const isMapLoading = useGameStore(state => state.isMapLoading);
  const currentMode = useGameStore(state => state.currentMode);

  // We should track locally if they picked for this connection.
  // When isMapLoading becomes false, we show if haven't picked.
  const [hasPicked, setHasPicked] = useState(true);

  useEffect(() => {
    if (isMapLoading) {
      setHasPicked(false);
    } else if (!hasPicked && currentMode !== 'hub' && currentMode !== 'dungeondelver') {
      setIsOpen(true);
      // Ensure controls unlocked to click
      if (game) {
        document.exitPointerLock?.();
      }
    }
  }, [isMapLoading, hasPicked, currentMode, game, setIsOpen]);

  useEffect(() => {
    const handleTrigger = () => {
      setHasPicked(false);
      setIsOpen(true);
      if (game) {
        document.exitPointerLock?.();
      }
    };
    window.addEventListener("triggerChooseRole", handleTrigger);
    return () => {
      window.removeEventListener("triggerChooseRole", handleTrigger);
    };
  }, [game, setIsOpen]);

  const selectLoadout = (type: 'bow' | 'painter' | 'washer' | 'builder') => {
    if (!game) return;
    
    // Clear inventory entirely to guarantee they ONLY receive the chosen item
    game.player.inventory.clear();
    game.player.inventory.isBuilder = false;
    
    if (type === 'bow') {
      game.player.inventory.addItem(ItemType.BOW, 1);
    } else if (type === 'painter') {
      game.player.inventory.addItem(ItemType.FLUID_CHOCOLATE_HOSE, 1);
    } else if (type === 'washer') {
      game.player.inventory.addItem(ItemType.WASHING_HOSE, 1);
    } else if (type === 'builder') {
      game.player.inventory.isBuilder = true;
      // Add a variety of colored blocks
      const builderBlocks = [
        ItemType.CONCRETE_WHITE, ItemType.CONCRETE_ORANGE, ItemType.CONCRETE_MAGENTA,
        ItemType.CONCRETE_LIGHT_BLUE, ItemType.CONCRETE_YELLOW, ItemType.CONCRETE_LIME,
        ItemType.CONCRETE_PINK, ItemType.CONCRETE_GRAY, ItemType.CONCRETE_CYAN,
        ItemType.CONCRETE_PURPLE, ItemType.CONCRETE_BLUE, ItemType.CONCRETE_BROWN,
        ItemType.CONCRETE_GREEN, ItemType.CONCRETE_RED, ItemType.CONCRETE_BLACK,
        ItemType.GLASS_WHITE,
        ItemType.CONCRETE_PASTEL_PINK, ItemType.CONCRETE_PASTEL_PURPLE,
        ItemType.CONCRETE_NEON_PINK, ItemType.CONCRETE_NEON_GREEN, ItemType.CONCRETE_NEON_ORANGE,
        ItemType.CONCRETE_NEON_YELLOW, ItemType.CONCRETE_AQUAMARINE, ItemType.CONCRETE_MINT_CREAM,
        ItemType.CONCRETE_CORAL_RED, ItemType.CONCRETE_SUNSET_GOLD, ItemType.CONCRETE_LAVENDER,
        ItemType.CONCRETE_SKY_BLUE, ItemType.CONCRETE_TEAL, ItemType.CONCRETE_SANDY_BEIGE,
        ItemType.CONCRETE_CHOCOLATE, ItemType.CONCRETE_DEEP_BLUE
      ];
      builderBlocks.forEach(blockType => {
        game.player.inventory.addItem(blockType, 1);
      });
    }

    game.player.hotbarIndex = 0;
    useGameStore.getState().incrementInventoryVersion();

    setHasPicked(true);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="mc-panel p-6 flex flex-col items-center gap-6 animate-[slideUpFade_0.3s_ease-out_reverse]">
        <h2 className="text-2xl mc-font text-white mc-text-shadow">Choose Your Role</h2>
        
        <div className="flex flex-wrap items-center justify-center gap-6">
          <button
            onClick={() => selectLoadout('painter')}
            className="flex flex-col items-center gap-4 bg-[#7B7B7B] border-[3px] border-t-white border-l-white border-b-[#555555] border-r-[#555555] p-6 hover:brightness-110 active:mc-button-shadow transition-all"
          >
            <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center border-2 border-black/50 shadow-inner">
              <span className="text-4xl">🎨</span>
            </div>
            <span className="text-white font-bold mc-text-shadow text-lg">Painter</span>
            <span className="text-zinc-300 text-sm max-w-[120px] text-center">Starts with a Fluid Hose</span>
          </button>

          <button
            onClick={() => selectLoadout('bow')}
            className="flex flex-col items-center gap-4 bg-[#7B7B7B] border-[3px] border-t-white border-l-white border-b-[#555555] border-r-[#555555] p-6 hover:brightness-110 active:mc-button-shadow transition-all"
          >
            <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center border-2 border-black/50 shadow-inner">
               <span className="text-4xl" style={{ transform: 'rotate(45deg)' }}>🏹</span>
            </div>
            <span className="text-white font-bold mc-text-shadow text-lg">Archer</span>
            <span className="text-zinc-300 text-sm max-w-[120px] text-center">Starts with a Bow</span>
          </button>
          <button
            onClick={() => selectLoadout('washer')}
            className="flex flex-col items-center gap-4 bg-[#7B7B7B] border-[3px] border-t-white border-l-white border-b-[#555555] border-r-[#555555] p-6 hover:brightness-110 active:mc-button-shadow transition-all"
          >
            <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center border-2 border-black/50 shadow-inner">
               <span className="text-4xl text-blue-400">💧</span>
            </div>
            <span className="text-white font-bold mc-text-shadow text-lg">Washer Worker</span>
            <span className="text-zinc-300 text-sm max-w-[120px] text-center">Starts with a Washer Hose</span>
          </button>
          <button
            onClick={() => selectLoadout('builder')}
            className="flex flex-col items-center gap-4 bg-[#7B7B7B] border-[3px] border-t-white border-l-white border-b-[#555555] border-r-[#555555] p-6 hover:brightness-110 active:mc-button-shadow transition-all"
          >
            <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center border-2 border-black/50 shadow-inner">
               <span className="text-4xl">🧱</span>
            </div>
            <span className="text-white font-bold mc-text-shadow text-lg">Builder</span>
            <span className="text-zinc-300 text-sm max-w-[120px] text-center">Starts with infinite blocks</span>
          </button>
        </div>
      </div>
    </div>
  );
}
