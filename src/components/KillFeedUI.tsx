import React from "react";
import { useGameStore } from "../store/gameStore";
import { motion, AnimatePresence } from "motion/react";
import { Skull } from "lucide-react";

export const KillFeedUI: React.FC = () => {
  const killFeedMessages = useGameStore((state) => state.killFeedMessages);

  return (
    <div className="absolute top-2 left-4 md:top-24 md:left-auto md:right-6 lg:right-8 z-[60] flex flex-col items-start md:items-end gap-1.5 pointer-events-none w-max max-w-[250px] sm:max-w-[300px]">
      <AnimatePresence>
        {killFeedMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 bg-black/60 border border-red-500/30 backdrop-blur-sm px-2.5 py-1 rounded shadow-md w-fit"
          >
            <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 opacity-80 shrink-0" />
            <span className="text-white drop-shadow-[1px_1px_0_rgba(0,0,0,1)] text-[12px] sm:text-[13px] md:text-[14px]">
              {msg.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
