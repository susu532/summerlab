import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  settingsManager,
  GameSettings,
  DEFAULT_SETTINGS,
} from "../game/Settings";
import { networkManager } from "../game/NetworkManager";
import { useGameStore } from "../store/gameStore";
import {
  X,
  Settings as SettingsIcon,
  Monitor,
  MousePointer2,
  Volume2,
  Globe,
  Bug,
} from "lucide-react";

interface MobileLandscapeSettingsUIProps {
  isOpen: boolean;
  onClose: () => void;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    settingsTitle: "Settings",
    graphics: "Graphics",
    renderDistance: "Render Distance",
    fov: "FOV",
    performanceMode: "Performance Mode",
    premiumShaders: "Premium Shaders",
    controls: "Controls",
    sensitivity: "Sensitivity",
    invertMouse: "Invert Look",
    audio: "Audio",
    masterVolume: "Volume",
    debug: "Debug",
    showDebug: "Show Info",
    resetButton: "Reset",
    doneButton: "Done",
    serverRegion: "Server Region",
    network: "Network",
  },
};

export const MobileLandscapeSettingsUI: React.FC<MobileLandscapeSettingsUIProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<GameSettings>(
    settingsManager.getSettings()
  );
  
  const [initialRegion] = useState(settings.serverRegion);
  const [activeTab, setActiveTab] = useState<"network" | "graphics" | "controls" | "audio" | "debug">("network");
  
  // Use a listener if settings manager supports it
  useEffect(() => {
    let active = true;
    const interval = setInterval(() => {
      if (active) {
        setSettings({ ...settingsManager.getSettings() });
      }
    }, 100);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const updateSetting = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    settingsManager.updateSettings(newSettings);
    setSettings(newSettings);
  };

  const handleReset = () => {
    settingsManager.updateSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  };

  const handleClose = () => {
    if (initialRegion !== settingsManager.getSettings().serverRegion) {
      networkManager.initMatchmaking(useGameStore.getState().currentMode);
    }
    onClose();
  };

  const t = translations["en"] || translations.en;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm landscape:flex portrait:hidden mc-font pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="w-full max-w-4xl h-full max-h-[90vh] mc-panel flex flex-col shadow-2xl relative bg-[#C6C6C6] border-[4px] border-t-white border-l-white border-b-[#555555] border-r-[#555555]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 pb-1 border-b-[4px] border-[#555555]">
          <div className="flex items-center gap-2 px-2">
            <SettingsIcon className="w-5 h-5 text-[#333]" />
            <h2 className="text-[#333] text-lg font-bold mc-text-shadow-none">
              {t.settingsTitle}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center bg-[#8B8B8B] border-[2px] border-t-white border-l-white border-b-[#373737] border-r-[#373737] hover:bg-[#A0A0A0] active:border-t-[#373737] active:border-l-[#373737] active:border-b-white active:border-r-white group"
          >
            <X className="w-5 h-5 text-white group-active:translate-y-[1px]" />
          </button>
        </div>

        {/* Content Body - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 flex flex-col p-2 gap-2 border-r-[4px] border-[#555555] bg-[#A0A0A0] overflow-y-auto custom-scrollbar">
            <TabButton 
              active={activeTab === "network"} 
              onClick={() => setActiveTab("network")} 
              icon={<Globe />} 
              label={t.network} 
            />
            <TabButton 
              active={activeTab === "graphics"} 
              onClick={() => setActiveTab("graphics")} 
              icon={<Monitor />} 
              label={t.graphics} 
            />
            <TabButton 
              active={activeTab === "controls"} 
              onClick={() => setActiveTab("controls")} 
              icon={<MousePointer2 />} 
              label={t.controls} 
            />
            <TabButton 
              active={activeTab === "audio"} 
              onClick={() => setActiveTab("audio")} 
              icon={<Volume2 />} 
              label={t.audio} 
            />
            <TabButton 
              active={activeTab === "debug"} 
              onClick={() => setActiveTab("debug")} 
              icon={<Bug />} 
              label={t.debug} 
            />
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <div className="max-w-xl mx-auto flex flex-col gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {activeTab === "network" && (
                    <div className="space-y-4">
                      {/* Server Region Selection */}
                      <div className="p-3 bg-[#8B8B8B] border-[2px] border-t-[#373737] border-l-[#373737] border-b-white border-r-white">
                        <label className="text-white font-bold mc-text-shadow block mb-2">
                          {t.serverRegion}
                        </label>
                        <select
                          value={settings.serverRegion || 'auto'}
                          onChange={(e) => updateSetting("serverRegion", e.target.value)}
                          className="w-full bg-[#373737] text-white font-bold p-2 outline-none border-[2px] border-t-[#111] border-l-[#111] border-b-[#666] border-r-[#666]"
                        >
                          <option value="auto">US East</option>
                          
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === "graphics" && (
                    <div className="space-y-4">
                      
                      {/* Render Distance */}
                      <div className="p-3 bg-[#8B8B8B] border-[2px] border-t-[#373737] border-l-[#373737] border-b-white border-r-white">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-white font-bold mc-text-shadow">
                            {t.renderDistance}: {settings.renderDistance}
                          </label>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="32"
                          step="1"
                          value={settings.renderDistance}
                          onChange={(e) => updateSetting("renderDistance", parseInt(e.target.value))}
                          className="w-full accent-white h-2 bg-[#373737] rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* FOV */}
                      <div className="p-3 bg-[#8B8B8B] border-[2px] border-t-[#373737] border-l-[#373737] border-b-white border-r-white">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-white font-bold mc-text-shadow">
                            {t.fov}: {settings.fov}°
                          </label>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="120"
                          step="1"
                          value={settings.fov}
                          onChange={(e) => updateSetting("fov", parseInt(e.target.value))}
                          className="w-full accent-white h-2 bg-[#373737] rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      {/* Toggles */}
                      <ToggleSetting 
                        label={t.performanceMode} 
                        checked={settings.performanceMode} 
                        onChange={(v) => updateSetting("performanceMode", v)} 
                      />
                      <ToggleSetting 
                        label={t.premiumShaders} 
                        checked={settings.premiumShaders} 
                        onChange={(v) => updateSetting("premiumShaders", v)} 
                      />
                    </div>
                  )}

                  {activeTab === "controls" && (
                    <div className="space-y-4">
                      {/* Sensitivity */}
                      <div className="p-3 bg-[#8B8B8B] border-[2px] border-t-[#373737] border-l-[#373737] border-b-white border-r-white">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-white font-bold mc-text-shadow">
                            {t.sensitivity}: {(settings.sensitivity * 100).toFixed(0)}%
                          </label>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={settings.sensitivity}
                          onChange={(e) => updateSetting("sensitivity", parseFloat(e.target.value))}
                          className="w-full accent-white h-2 bg-[#373737] rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <ToggleSetting 
                        label={t.invertMouse} 
                        checked={settings.invertMouse} 
                        onChange={(v) => updateSetting("invertMouse", v)} 
                      />
                    </div>
                  )}

                  {activeTab === "audio" && (
                    <div className="space-y-4">
                       <div className="p-3 bg-[#8B8B8B] border-[2px] border-t-[#373737] border-l-[#373737] border-b-white border-r-white">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-white font-bold mc-text-shadow">
                            {t.masterVolume}: {(settings.volume * 100).toFixed(0)}%
                          </label>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={settings.volume}
                          onChange={(e) => updateSetting("volume", parseFloat(e.target.value))}
                          className="w-full accent-white h-2 bg-[#373737] rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === "debug" && (
                    <div className="space-y-4">
                      <ToggleSetting 
                        label={t.showDebug} 
                        checked={settings.showDebug} 
                        onChange={(v) => updateSetting("showDebug", v)} 
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-2 border-t-[4px] border-[#555555] flex justify-between bg-[#A0A0A0]">
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-[#8B8B8B] border-[2px] border-t-white border-l-white border-b-[#373737] border-r-[#373737] text-white font-bold mc-text-shadow hover:bg-[#A0A0A0] active:border-t-[#373737] active:border-l-[#373737] active:border-b-white active:border-r-white active:pl-7 active:pr-5 select-none"
          >
            {t.resetButton}
          </button>
          
          <button
            onClick={handleClose}
            className="px-8 py-2 bg-[#55FF55] border-[2px] border-t-white border-l-white border-b-[#339933] border-r-[#339933] text-[#333] font-bold mc-text-shadow-none hover:bg-[#66FF66] active:border-t-[#339933] active:border-l-[#339933] active:border-b-white active:border-r-white active:pl-9 active:pr-7 select-none"
          >
            {t.doneButton}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 p-3 font-bold select-none text-left w-full
      ${active 
        ? "bg-[#C6C6C6] border-[2px] border-t-[#373737] border-l-[#373737] border-b-white border-r-white text-[#333]" 
        : "bg-[#8B8B8B] border-[2px] border-t-white border-l-white border-b-[#373737] border-r-[#373737] text-white hover:bg-[#969696]"}
    `}
  >
    <div className={`w-5 h-5 ${active ? "text-[#333]" : "text-white"}`}>{icon}</div>
    <span className={active ? "mc-text-shadow-none" : "mc-text-shadow"}>{label}</span>
  </button>
);

const ToggleSetting = ({ label, checked, onChange }: any) => (
  <button
    onClick={() => onChange(!checked)}
    className="w-full flex justify-between items-center p-3 bg-[#8B8B8B] border-[2px] border-t-white border-l-white border-b-[#373737] border-r-[#373737] hover:bg-[#969696] active:border-t-[#373737] active:border-l-[#373737] active:border-b-white active:border-r-white text-left select-none"
  >
    <span className="text-white font-bold mc-text-shadow">{label}</span>
    <div className={`
      w-12 h-6 border-[2px] border-t-[#373737] border-l-[#373737] border-b-white border-r-white relative
      ${checked ? "bg-[#55FF55]" : "bg-red-500"}
    `}>
      <div className={`
        absolute top-0 w-5 h-full bg-[#C6C6C6] border-[2px] border-t-white border-l-white border-b-[#373737] border-r-[#373737] transition-all
        ${checked ? "right-0" : "left-0"}
      `} />
    </div>
  </button>
);
