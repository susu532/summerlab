import { useUI } from "../store/uiStore";
import { useGameStore } from "../store/gameStore";
import { TopObjectiveHUD } from "./TopObjectiveHUD";
import { HubTitleUI } from "./HubTitleUI";
import { DebugInfo } from "./DebugInfo";
import { ChatUI } from "./ChatUI";
import { EntityTags } from "./EntityTags";
import { KillFeedUI } from "./KillFeedUI";
import { MobileControlsUI } from "./MobileControlsUI";
import { SkyBridgeSidebar } from "./SkyBridgeSidebar";
import { SkyCastlesSidebar } from "./SkyCastlesSidebar";
import { BattleRoyaleSidebar } from "./BattleRoyaleSidebar";
import { DungeonDelverSidebar } from "./DungeonDelverSidebar";
import { DungeonDelverTitleUI } from "./DungeonDelverTitleUI";
import { SummerLabTitleUI } from "./SummerLabTitleUI";
import { SkyBridgeActionBar } from "./SkyBridgeActionBar";
import { DungeonDelverActionBar } from "./DungeonDelverActionBar";
import { SkyBridgeXPPopup } from "./SkyBridgeXPPopup";
import { DamageOverlay } from "./DamageOverlay";
import { DamageNumbers } from "./DamageNumbers";
import { GameMessages } from "./GameMessages";
import { LevelUpUI } from "./LevelUpUI";
import { HotbarUI } from "./HotbarUI";
import { KillCelebrationUI } from "./KillCelebrationUI";
import { FluidColorPicker } from "./FluidColorPicker";
import { Game } from "../game/Game";
import { Perspective } from "../game/Player";
import { Maximize, Settings as SettingsIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useState, useEffect } from "react";
import { ITEM_NAMES } from "../game/Constants";

function CrosshairTargetInfo({
  currentMode,
  game,
}: {
  currentMode: string;
  game?: Game;
}) {
  const [targetInfo, setTargetInfo] = useState<{
    type: string | null;
    name: string | null;
    id?: string;
  }>({ type: null, name: null });

  useEffect(() => {
    if (!game) return;
    let afId: number;
    let lastTime = 0;
    const update = (time: number) => {
      if (time - lastTime > 100) {
        lastTime = time;
        let newType: string | null = null;
        let newName: string | null = null;
        let newId: string | undefined = undefined;

        if (game.lastRaycast) {
          if (game.lastRaycast.npc) {
            newType = "npc";
            newName = game.lastRaycast.npc.name;
            newId = game.lastRaycast.npc.id;
          } else if (game.lastRaycast.block) {
            newType = "block";
            newName = ITEM_NAMES[game.lastRaycast.block.blockType] || "Block";
          }
        }

        setTargetInfo((prev) => {
          if (
            prev.type !== newType ||
            prev.name !== newName ||
            prev.id !== newId
          ) {
            return { type: newType, name: newName, id: newId };
          }
          return prev;
        });
      }
      afId = requestAnimationFrame(update);
    };
    afId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(afId);
  }, [game]);

  if (!targetInfo.type) return null;

  return (
    <div className="absolute top-6 px-2 py-1 bg-black/80 text-[12px] text-white font-sans drop-shadow-[1px_1px_0_rgba(0,0,0,1)] whitespace-nowrap">
      {targetInfo.name}
      {targetInfo.type === "npc" &&
        targetInfo.id?.startsWith("hub_npc_") &&
        currentMode === "hub" && (
          <span className="ml-2 text-[#FFFF55]">[Right Click to Join]</span>
        )}
      {targetInfo.type === "npc" && !targetInfo.id?.startsWith("hub_npc_") && (
        <span className="ml-2 text-[#FFFF55]">[Right Click to Talk]</span>
      )}
    </div>
  );
}

function FirstPersonEmojiOverlay({ game }: { game: Game | null }) {
  const [emoji, setEmoji] = useState<string | null>(null);

  useEffect(() => {
    if (!game) return;
    let afId: number;
    const update = () => {
      const player = game.player;
      if (player) {
        const isFirstPerson = player.perspective === Perspective.FIRST_PERSON;
        const currentEmoji = isFirstPerson ? player.currentEmoji || null : null;
        setEmoji(currentEmoji);
      }
      afId = requestAnimationFrame(update);
    };
    afId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(afId);
  }, [game]);

  return (
    <AnimatePresence>
      {emoji && (
        <div className="fixed right-6 sm:right-12 top-1/2 -translate-y-1/2 pointer-events-none z-[100] flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.3, x: 50, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 50, rotate: 15 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-20 h-20 sm:w-28 sm:h-28 bg-black/60 border-2 border-white/20 rounded-2xl backdrop-blur-md shadow-2xl flex items-center justify-center text-5xl sm:text-7xl select-none"
          >
            {emoji}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function GameHUD({ game, isMobile, showDebug, setPauseMenuOpen }: any) {
  const isHUDVisible = useUI((state) => state.isHUDVisible);
  const isLocked = useUI((state) => state.isLocked);
  const isTyping = useUI((state) => state.isTyping);
  const setTyping = useUI((state) => state.setTyping);
  const currentMode = useGameStore((state) => state.currentMode);

  const isInventoryOpen = useUI((state) => state.isInventoryOpen);

  return (
    <>
      {/* Top HUD */}
      {isHUDVisible && currentMode === "skycastles" && <TopObjectiveHUD />}

      {/* Hub Title */}
      {currentMode === "hub" && <HubTitleUI />}

      {/* Dungeon Delver Title */}
      {/* {currentMode === 'dungeondelver' && <DungeonDelverTitleUI />} */}

      {/* Summer Lab Title */}
      {currentMode === "summerlab" && <SummerLabTitleUI />}

      {/* Debug Menu */}
      <DebugInfo game={game} showDebug={showDebug} />

      {/* Settings/Pause Button */}
      {isHUDVisible && !isMobile && (
        <>
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch((err) => {
                    console.warn(
                      `Error attempting to enable fullscreen mode: ${err.message}`,
                    );
                  });
                } else {
                  if (document.exitFullscreen) {
                    document.exitFullscreen();
                  }
                }
              }}
              className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-md border border-white/20 transition-all group"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-6 h-6" />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (game) game.controls.unlock();
                setPauseMenuOpen(true);
              }}
              className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-md border border-white/20 transition-all group"
              title="Menu (Esc)"
            >
              <SettingsIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
          <FluidColorPicker game={game} />
        </>
      )}

      {/* Crosshair */}
      {isHUDVisible && (
        <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 pointer-events-none flex items-center justify-center">
          {!isMobile && (
            <>
              <div className="w-full h-[2px] bg-white mix-blend-difference" />
              <div className="h-full w-[2px] bg-white mix-blend-difference absolute" />
            </>
          )}
          <CrosshairTargetInfo
            currentMode={currentMode}
            game={game || undefined}
          />
        </div>
      )}

      {/* Chat */}
      {isHUDVisible && (
        <ChatUI
          isLocked={isLocked}
          isTyping={isTyping}
          setIsTyping={setTyping}
          isMobile={isMobile}
        />
      )}

      {/* Kill Feed */}
      {isHUDVisible && <KillFeedUI />}

      {/* Mob Tags */}
      {isHUDVisible && <EntityTags game={game} />}

      {/* First Person Emoji Overlay */}
      {isHUDVisible && <FirstPersonEmojiOverlay game={game} />}

      {/* Mobile Controls */}
      {isHUDVisible && isMobile && <MobileControlsUI game={game} />}

      {/* Sidebars */}
      {/* {isHUDVisible && currentMode === 'skybridge' && <SkyBridgeSidebar isMobile={isMobile} />} */}
      {/* {isHUDVisible && currentMode === 'skycastles' && <SkyCastlesSidebar isMobile={isMobile} />} */}
      {/* {isHUDVisible && currentMode === 'battleroyale' && <BattleRoyaleSidebar isMobile={isMobile} />} */}
      {/* {isHUDVisible && currentMode === 'dungeondelver' && <DungeonDelverSidebar isMobile={isMobile} />} */}

      {/* SkyBridge UI */}
      {/* {isHUDVisible && (currentMode === 'skybridge' || currentMode === 'skycastles') && <SkyBridgeActionBar />} */}
      {/* {isHUDVisible && currentMode === 'dungeondelver' && <DungeonDelverActionBar isMobile={isMobile} />} */}
      {/* {isHUDVisible && currentMode === 'skybridge' && <SkyBridgeXPPopup />} */}

      {isHUDVisible && (
        <>
          <DamageOverlay game={game || undefined} />
          <DamageNumbers />
          <GameMessages />
          <LevelUpUI />
          <KillCelebrationUI />
        </>
      )}

      {/* Toolbar */}
      {isHUDVisible && currentMode !== "hub" && !isInventoryOpen && <HotbarUI game={game} />}
    </>
  );
}
