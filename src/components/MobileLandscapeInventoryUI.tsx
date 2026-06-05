import React from 'react';
import { motion } from 'motion/react';
import { Inventory, ItemStack } from '../game/Inventory';
import { Slot, ItemIcon } from './inventory/Slot';
import { CraftingGrid } from './inventory/CraftingGrid';
import { PlayerGrid } from './inventory/PlayerGrid';
import { HotbarGrid } from './inventory/HotbarGrid';
import { PlayerPreview } from './inventory/PlayerPreview';
import { ITEM_NAMES } from '../game/Constants';
import { RARITY_COLORS, Rarity } from '../game/SkyBridgeManager';

interface MobileLandscapeInventoryUIProps {
  inventory: Inventory;
  onClose: () => void;
  craftingGrid: (ItemStack | null)[];
  craftingResult: ItemStack | null;
  heldItem: ItemStack | null;
  hoveredItem: ItemStack | null;
  setHoveredItem: (item: ItemStack | null) => void;
  dragState: { isDragging: boolean; button: number; visitedSlots: Set<string> };
  handleSlotInteraction: any;
  handleResultClick: any;
  handleDoubleClick: any;
  skycoins: number;
}

export const MobileLandscapeInventoryUI: React.FC<MobileLandscapeInventoryUIProps> = ({
  inventory,
  onClose,
  craftingGrid,
  craftingResult,
  heldItem,
  hoveredItem,
  setHoveredItem,
  dragState,
  handleSlotInteraction,
  handleResultClick,
  handleDoubleClick,
  skycoins
}) => {
  // Mobile landscape UI is a horizontal layout.
  // Left side: Player Preview & Armor, Secondary stats like balance
  // Center: Hotbar + Main Inventory Grid
  // Right side: Item info panel (when hovering/holding) OR Crafting Grid

  const showItemInfo = hoveredItem || heldItem;
  const displayItem = hoveredItem || heldItem;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="mc-panel shadow-2xl relative mc-font flex gap-2 w-[98vw] h-[95vh] p-2"
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-[#373737] hover:text-red-600 font-bold px-2 text-xl z-10">✕</button>

      {/* LEFT COLUMN: Player & Stats */}
      <div className="flex flex-col h-full bg-[#8B8B8B] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white p-2 min-w-[120px] items-center shrink-0">
        <span className="font-bold text-xs px-1 py-1 text-[#373737] mb-1 leading-tight text-center">
          Inventory
        </span>
        <div className="scale-75 origin-top mb-1">
          <PlayerPreview />
        </div>
        
        <div className="flex flex-col items-center gap-1 justify-center mt-[-30px]">
          <span className="text-[10px] uppercase opacity-60 font-bold text-[#373737]">Off-hand</span>
          <Slot 
            item={inventory.slots[Inventory.OFF_HAND_SLOT]}
            onClick={(item, button, isShift) => handleSlotInteraction('inv', Inventory.OFF_HAND_SLOT, true, button, isShift, false)}
            onDoubleClick={handleDoubleClick}
            onHover={setHoveredItem}
            isDragging={dragState.isDragging}
            dragButton={dragState.button}
          />
        </div>

        <div className="mt-auto mb-2 flex flex-col items-center bg-yellow-400/20 border border-yellow-400/40 rounded-sm p-1 w-full text-center">
          <span className="text-[8px] uppercase tracking-wider opacity-60 text-yellow-800">Skycoins</span>
          <span className="text-yellow-900 font-bold text-xs">{skycoins.toLocaleString()}</span>
        </div>
      </div>

      {/* CENTER COLUMN: Inventory Grid */}
      <div className="flex flex-col h-full grow items-center justify-center p-1 gap-2 overflow-y-auto custom-scrollbar">
        <div className="scale-90 origin-center space-y-2">
          <PlayerGrid 
            inventory={inventory}
            handleSlotInteraction={handleSlotInteraction}
            handleDoubleClick={handleDoubleClick}
            setHoveredItem={setHoveredItem}
            dragState={dragState}
          />
          <HotbarGrid 
            inventory={inventory}
            handleSlotInteraction={handleSlotInteraction}
            handleDoubleClick={handleDoubleClick}
            setHoveredItem={setHoveredItem}
            dragState={dragState}
          />
        </div>
      </div>

      {/* RIGHT COLUMN: Crafting / Item Info */}
      <div className="flex flex-col h-full w-[200px] shrink-0 gap-2">
        <div className="bg-[#8B8B8B] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white p-2 flex flex-col justify-center items-center">
          <CraftingGrid 
            craftingGrid={craftingGrid}
            craftingResult={craftingResult}
            handleSlotInteraction={handleSlotInteraction}
            handleResultClick={handleResultClick}
            handleDoubleClick={handleDoubleClick}
            setHoveredItem={setHoveredItem}
            dragState={dragState}
          />
        </div>

        {/* Item details pane */}
        <div className="bg-[#8B8B8B] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white p-2 flex-grow overflow-y-auto custom-scrollbar text-xs h-0">
          {displayItem ? (
            <div className="flex flex-col text-[#373737]">
              <div 
                className="font-bold text-sm mb-1 mc-text-shadow leading-tight" 
                style={{ color: RARITY_COLORS[displayItem.metadata?.rarity || Rarity.COMMON] }}
              >
                {ITEM_NAMES[displayItem.type]}
              </div>
              
              {displayItem.metadata?.stats && (
                <div className="space-y-0.5 mb-2 border-b border-[#373737]/30 pb-2">
                  {Object.entries(displayItem.metadata.stats).map(([stat, value]) => {
                    const isBaseStat = stat === 'damage' || stat === 'health' || stat === 'intelligence' || stat === 'defense';
                    const color = stat === 'damage' ? '#880000' : (stat === 'strength' ? '#CC5500' : '#005500');
                    return (
                      <div key={stat} className="flex justify-between">
                        <span className="capitalize">{stat.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-bold" style={{ color }}>{isBaseStat ? "" : "+"}{value}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {displayItem.metadata?.description && (
                <div className="mb-2 italic leading-tight text-[10px]">
                  {displayItem.metadata.description}
                </div>
              )}

              {displayItem.metadata?.ability && (
                <div className="mb-2 border-t border-[#373737]/30 pt-2">
                  <div className="text-[#880088] font-bold uppercase text-[10px]">Ability: {displayItem.metadata.ability.name}</div>
                  <div className="text-[10px] leading-tight mt-0.5">{displayItem.metadata.ability.description}</div>
                  {displayItem.metadata.ability.manaCost && (
                    <div className="text-[#005555] text-[9px] mt-1">Mana Cost: {displayItem.metadata.ability.manaCost}</div>
                  )}
                </div>
              )}

              <div 
                className="font-bold uppercase tracking-widest mt-1 text-[10px] text-center border-t border-[#373737]/30 pt-1"
                style={{ color: RARITY_COLORS[displayItem.metadata?.rarity || Rarity.COMMON] }}
              >
                {displayItem.metadata?.rarity || Rarity.COMMON}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#373737]/50 text-center italic text-xs leading-tight">
              Select or hover over an item to view its details.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
