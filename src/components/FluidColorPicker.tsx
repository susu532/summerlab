import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { Droplet, Palette } from 'lucide-react';
import { ItemType } from '../game/Inventory';
import { settingsManager } from '../game/Settings';

export function FluidColorPicker({ game }: { game?: any }) {
  const isOpen = useGameStore((state) => state.isFluidColorPickerOpen);
  const setIsOpen = useGameStore((state) => state.setIsFluidColorPickerOpen);
  const fluidColor = useGameStore((state) => state.fluidColor);
  const setFluidColor = useGameStore((state) => state.setFluidColor);
  const hotbarIndex = useGameStore((state) => state.hotbarIndex);
  
  const inventoryVersion = useGameStore((state) => state.inventoryVersion);
  
  const [fluidKey, setFluidKey] = useState(settingsManager.getSettings().keybinds.openFluidColorPicker);

  useEffect(() => {
    const unsubscribe = settingsManager.subscribe((s) => {
      setFluidKey(s.keybinds.openFluidColorPicker);
    });
    return unsubscribe;
  }, []);

  const equippedItem = game?.player.inventory.slots[hotbarIndex];
  const hasHose = equippedItem?.type === ItemType.FLUID_CHOCOLATE_HOSE;
  
  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (!hasHose && isOpen) {
        setIsOpen(false);
    }
  }, [hasHose, isOpen, setIsOpen]);

  if (!game || !hasHose) return null;

  return (
    <div 
      className="absolute top-20 right-4 landscape:top-4 landscape:right-[30%] pointer-events-auto z-[200]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <button
          onClick={() => {
            const nextState = !isOpen;
            setIsOpen(nextState);
            if (nextState && !isMobile) {
              game.controls.unlock();
            } else if (nextState && isMobile) {
              // Ensure we stop attacking
              if (window.mobileInputs) {
                window.mobileInputs.isAttacking = false;
                window.mobileInputs.isInteracting = false;
              }
            }
          }}
          className="bg-black/50 hover:bg-black/70 text-white p-3 landscape:p-2 sm:p-4 rounded-full backdrop-blur-sm border border-white/10 transition-colors shadow-lg flex items-center justify-center"
          title="Change Fluid Color"
        >
          {isMobile ? <Palette size={32} color={fluidColor} /> : <Droplet size={48} color={fluidColor} fill={fluidColor} />}
        </button>
        {!isMobile && (
          <div className="absolute top-0 right-0 z-30 bg-black/70 border-2 border-white/40 rounded-md px-2 py-0.5 min-w-[28px] sm:min-w-[32px] text-center text-white text-[16px] sm:text-[20px] font-bold mc-text-shadow translate-x-2 -translate-y-2">
            {fluidKey?.replace('Key', '').replace('Digit', '') || 'F'}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-16 right-0 bg-gray-900 rounded-xl p-3 shadow-2xl border border-white/10 filter drop-shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Fluid Color
          </div>
          <HexColorPicker
            color={fluidColor}
            onChange={setFluidColor}
            style={isMobile ? { width: '150px', height: '150px' } : undefined}
          />
          <div className="mt-3 flex gap-2 flex-wrap max-w-[150px] sm:max-w-none">
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
                className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                style={{ backgroundColor: preset }}
                onClick={() => setFluidColor(preset)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
