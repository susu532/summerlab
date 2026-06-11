import React, { useState, useEffect } from 'react';

export function SummerLabTitleUI() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isWaterPark, setIsWaterPark] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
       const now = Date.now();
       const phaseLength = 10 * 60 * 1000;
       const remaining = phaseLength - (now % phaseLength);
       setTimeLeft(remaining);
       
       const forcedPhase = typeof window !== 'undefined' ? (window as any).__FORCE_WATER_PARK : undefined;
       setIsWaterPark(forcedPhase !== undefined ? forcedPhase : (Math.floor(now / phaseLength) % 2 === 1));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const timerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="absolute top-[2%] left-1/2 -translate-x-1/2 pointer-events-none z-10 w-full flex flex-col justify-center items-center safe-pl safe-pr origin-top [@media(orientation:landscape)_and_(max-height:500px)]:scale-[0.6] [@media(orientation:landscape)_and_(max-height:500px)]:-mt-2">
      <h1
        className="font-black text-center uppercase flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap whitespace-nowrap"
        style={{
          fontFamily: "'Pixelify Sans', sans-serif",
          fontSize: "clamp(1.5rem, 5vw, 3rem)",
          margin: 0,
        }}
      >
        <span 
          style={{ 
            color: "#FFFF55", // Light lavender/violet prefix
            textShadow: "1.5px 1.5px 0px #3B0764, 2px 2px 4px rgba(0,0,0,0.8)",
            letterSpacing: "0.08em",
            fontWeight: "bold",
            fontSize: "0.55em",
          }}
        >
          starplex.io
        </span>
        <span 
          style={{ 
            color: "#C084FC",
            textShadow: "1.5px 1.5px 0px #2E0854, 2px 2px 4px rgba(0,0,0,0.8)",
            fontWeight: "bold",
            fontSize: "0.55em",
          }}
        >
          -
        </span>
        <span style={{ letterSpacing: "0.12em" }}>
        {isWaterPark ? (
            "Water Park".split("").map((char, index) => {
              if (char === " ") return <span key={index}> </span>;
              const rainbowColors = ["#FF3333", "#FFAA33", "#FFFF33", "#33FF33", "#33AAFF", "#9933FF", "#FF33DD"];
              const cidx = index > 5 ? index - 1 : index; // skip space
              return (
                <span
                  key={index}
                  style={{
                    color: rainbowColors[cidx % rainbowColors.length],
                    WebkitTextStroke: "1px rgba(0,0,0,0.8)",
                    filter: "drop-shadow(1px 1px 0px #000) drop-shadow(1px 2px 0px #000) drop-shadow(3px 4px 8px rgba(0,0,0,0.6))"
                  }}
                >
                  {char}
                </span>
              );
            })
        ) : (
          <span
            style={{
              background: "linear-gradient(to bottom, #f472b6, #a855f7)", 
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              WebkitTextStroke: "1px rgba(50,0,60,0.8)",
              filter: "drop-shadow(1px 1px 0px #581c87) drop-shadow(1px 2px 0px #3b0764) drop-shadow(3px 4px 8px rgba(0,0,0,0.6))",
            }}
          >
            Summer Lab
          </span>
        )}
        </span>
      </h1>
      
      {/* Big Timer */}
      <div 
        className="mt-1 font-mono text-xl sm:text-2xl md:text-3xl font-black tracking-wider"
        style={{
           color: '#FFF',
           textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 4px 4px 8px rgba(0,0,0,0.5)',
        }}
      >
        NEW MAP IN: <span style={{ color: isWaterPark ? '#ff7bee' : '#00ffd0' }}>{timerText}</span>
      </div>
      
      {/* Paint the world text */}
      <div
        className="mt-1.5 sm:mt-2.5 font-semibold uppercase tracking-wider text-[10px] sm:text-xs md:text-sm flex items-center justify-center gap-1 sm:gap-2 flex-wrap"
        style={{
           color: '#FFFFFF',
           textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)',
           fontFamily: "Inter, system-ui, -apple-system, sans-serif"
        }}
      >
        <span className="opacity-95 text-center leading-tight">Clean up the mess and paint the world with</span>
        {(() => {
           const phaseLength = 10 * 60 * 1000;
           const phaseIdx = Math.floor(Date.now() / phaseLength);
           const paintColors = [
              { name: "RED", hex: "#FF3333", glow: "rgba(255,51,51,0.5)" },
              { name: "ORANGE", hex: "#FFAA33", glow: "rgba(255,170,51,0.5)" },
              { name: "YELLOW", hex: "#FFFF33", glow: "rgba(255,255,51,0.5)" },
              { name: "GREEN", hex: "#33FF33", glow: "rgba(51,255,51,0.5)" },
              { name: "CYAN", hex: "#33FFFF", glow: "rgba(51,255,255,0.5)" },
              { name: "BLUE", hex: "#3355FF", glow: "rgba(51,85,255,0.5)" },
              { name: "PURPLE", hex: "#AA33FF", glow: "rgba(170,51,255,0.5)" },
              { name: "PINK", hex: "#FF33AA", glow: "rgba(255,51,170,0.5)" },
              { name: "WHITE", hex: "#FFFFFF", glow: "rgba(255,255,255,0.4)" }
           ];
           const colorObj = paintColors[phaseIdx % paintColors.length];
           return (
             <span 
               className="px-2.5 py-0.5 rounded-md bg-stone-900/90 border border-white/20 inline-flex items-center justify-center font-black tracking-widest text-xs sm:text-sm shadow-md"
               style={{ 
                 color: colorObj.hex,
                 boxShadow: `0 0 12px ${colorObj.glow}`
               }}
             >
               {colorObj.name}
             </span>
           );
        })()}
        <span className="opacity-95">!</span>
      </div>
    </div>
  );
}
