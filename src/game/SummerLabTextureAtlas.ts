import * as THREE from 'three';
import { BLOCK_UVS } from "./TextureAtlasData";
import { ITEM_COLORS } from './Constants';
import { ItemType } from './Inventory';
import { createTextureAtlas } from './TextureAtlas';
export const ATLAS_TILES = 32;

let cachedSummerLabTexture: THREE.Texture | null = null;

export function createSummerLabTextureAtlas(): THREE.Texture {
  if (cachedSummerLabTexture) return cachedSummerLabTexture;

  let stdCanvas: HTMLCanvasElement | null = null;
  try {
    const stdTexture = createTextureAtlas();
    stdCanvas = stdTexture.image as HTMLCanvasElement;
  } catch (e) {
    console.error("Failed to load standard texture atlas in SummerLab:", e);
  }

  const canvas = document.createElement('canvas');
  const size = 16;
  const tiles = ATLAS_TILES;
  canvas.width = size * tiles;
  canvas.height = size * tiles;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rgbToHex = (r: number, g: number, b: number) => `#${((1 << 24) + (Math.max(0, Math.min(255, r)) << 16) + (Math.max(0, Math.min(255, g)) << 8) + Math.max(0, Math.min(255, b))).toString(16).slice(1)}`;
  const hexToRgb = (hex: string) => {
      let r = 255, g = 0, b = 255;
      if (typeof hex === 'string') {
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length >= 7) {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
      }
      return { r: isNaN(r) ? 255 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 255 : b };
  };

  const drawBeveledTile = (x: number, y: number, colorHex: string, hasFace: boolean = false) => {
    let { r, g, b } = hexToRgb(colorHex);
    // Be a bit more vibrant
    r = Math.min(255, r * 1.1);
    g = Math.min(255, g * 1.1);
    b = Math.min(255, b * 1.1);
    const color = rgbToHex(Math.round(r), Math.round(g), Math.round(b));

    const outline = rgbToHex(Math.round(r * 0.4), Math.round(g * 0.4), Math.round(b * 0.4));
    const shadow = rgbToHex(Math.round(r * 0.7), Math.round(g * 0.7), Math.round(b * 0.7));
    const highlight = rgbToHex(
      Math.min(255, Math.max(40, Math.round(r * 1.5))), 
      Math.min(255, Math.max(40, Math.round(g * 1.5))), 
      Math.min(255, Math.max(40, Math.round(b * 1.5)))
    );

    // Outer outline (cel-shaded toy look)
    ctx.fillStyle = outline;
    ctx.fillRect(x * size, y * size, size, size);

    // Main fill
    ctx.fillStyle = color;
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);

    // Bevel highlights & shadows for plastic look
    ctx.fillStyle = highlight;
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, 1); // Top inner
    ctx.fillRect(x * size + 1, y * size + 2, 1, size - 3); // Left inner

    ctx.fillStyle = shadow;
    ctx.fillRect(x * size + 1, y * size + size - 2, size - 2, 1); // Bottom inner
    ctx.fillRect(x * size + size - 2, y * size + 2, 1, size - 3); // Right inner

    if (hasFace) {
       // Kawaii Face
       ctx.fillStyle = '#000000';
       // Eyes
       ctx.fillRect(x * size + 4, y * size + 6, 2, 2);
       ctx.fillRect(x * size + 10, y * size + 6, 2, 2);
       // Mouth
       ctx.fillRect(x * size + 6, y * size + 9, 1, 1);
       ctx.fillRect(x * size + 9, y * size + 9, 1, 1);
       ctx.fillRect(x * size + 7, y * size + 10, 2, 1);
       // Blush
       ctx.fillStyle = '#ff88aa';
       ctx.fillRect(x * size + 2, y * size + 7, 2, 1);
       ctx.fillRect(x * size + 12, y * size + 7, 2, 1);
    }
  };

  const SUMMERLAB_PALETTE = [
    '#FF69B4', // hotpink
    '#000000', // black
    '#FFFFFF', // white
    '#800080', // purple
    '#32CD32', // limegreen
    '#00FFFF', // cyan
    '#FF00FF'  // magenta
  ];

  const GLASS_COLORS_SUMMERLAB = [
    '#FFFFFF', // GLASS_WHITE
    '#F07613', // GLASS_ORANGE
    '#BD44B3', // GLASS_MAGENTA
    '#3AAfd9', // GLASS_LIGHT_BLUE
    '#F8C627', // GLASS_YELLOW
    '#70B919', // GLASS_LIME
    '#ED8DAC', // GLASS_PINK
    '#3E4447', // GLASS_GRAY
    '#8E8E86', // GLASS_LIGHT_GRAY
    '#158991', // GLASS_CYAN
    '#792AAC', // GLASS_PURPLE
    '#35399D', // GLASS_BLUE
    '#724728', // GLASS_BROWN
    '#546D1B', // GLASS_GREEN
    '#A12722', // GLASS_RED
    '#141519'  // GLASS_BLACK
  ];

  for (let blockId=0; blockId<BLOCK_UVS.length; blockId++) {
    const uvs = BLOCK_UVS[blockId];
    if (!uvs) continue;
    
    let color = SUMMERLAB_PALETTE[blockId % SUMMERLAB_PALETTE.length];
    
    if (blockId === ItemType.CONCRETE_WHITE) color = '#FFFFFF';
    else if (blockId === ItemType.CONCRETE_BLACK) color = '#000000';
    else if (blockId === ItemType.CONCRETE_PINK) color = '#FF69B4'; // hotpink
    else if (blockId === ItemType.CONCRETE_PURPLE) color = '#800080'; // purple
    else if (blockId === ItemType.CONCRETE_LIME) color = '#32CD32'; // limegreen
    else if (blockId === ItemType.CONCRETE_MAGENTA) color = '#FF00FF'; // magenta
    else if (blockId === ItemType.CONCRETE_ORANGE) color = '#F07613'; // orange
    else if (blockId === ItemType.CONCRETE_LIGHT_BLUE) color = '#3AAfd9'; // light blue
    else if (blockId === ItemType.CONCRETE_YELLOW) color = '#F8C627'; // yellow
    else if (blockId === ItemType.CONCRETE_GRAY) color = '#3E4447'; // gray
    else if (blockId === ItemType.CONCRETE_LIGHT_GRAY) color = '#8E8E86'; // light gray
    else if (blockId === ItemType.CONCRETE_CYAN) color = '#158991'; // cyan
    else if (blockId === ItemType.CONCRETE_BLUE) color = '#35399D'; // blue
    else if (blockId === ItemType.CONCRETE_BROWN) color = '#724728'; // brown
    else if (blockId === ItemType.CONCRETE_GREEN) color = '#546D1B'; // green
    else if (blockId === ItemType.CONCRETE_RED) color = '#A12722'; // red
    else if (blockId === ItemType.CONCRETE_PASTEL_PINK) color = '#FFB6C1';
    else if (blockId === ItemType.CONCRETE_PASTEL_PURPLE) color = '#E1BEE7';
    else if (blockId === ItemType.CONCRETE_NEON_PINK) color = '#FF1493';
    else if (blockId === ItemType.CONCRETE_NEON_GREEN) color = '#39FF14';
    else if (blockId === ItemType.CONCRETE_NEON_ORANGE) color = '#FF5F1F';
    else if (blockId === ItemType.CONCRETE_NEON_YELLOW) color = '#CCFF00';
    else if (blockId === ItemType.CONCRETE_AQUAMARINE) color = '#7FFFD4';
    else if (blockId === ItemType.CONCRETE_MINT_CREAM) color = '#A3E4D7';
    else if (blockId === ItemType.CONCRETE_CORAL_RED) color = '#FF7F50';
    else if (blockId === ItemType.CONCRETE_SUNSET_GOLD) color = '#FFD700';
    else if (blockId === ItemType.CONCRETE_LAVENDER) color = '#C3B1E1';
    else if (blockId === ItemType.CONCRETE_SKY_BLUE) color = '#87CEEB';
    else if (blockId === ItemType.CONCRETE_TEAL) color = '#008080';
    else if (blockId === ItemType.CONCRETE_SANDY_BEIGE) color = '#E5C49F';
    else if (blockId === ItemType.CONCRETE_CHOCOLATE) color = '#5C3A21';
    else if (blockId === ItemType.CONCRETE_DEEP_BLUE) color = '#1B4F72';
    else if (blockId === ItemType.CONCRETE_RAINBOW_RED) color = '#FF0000';
    else if (blockId === ItemType.CONCRETE_RAINBOW_ORANGE) color = '#FFA500';
    else if (blockId === ItemType.CONCRETE_RAINBOW_YELLOW) color = '#FFFF00';
    else if (blockId === ItemType.CONCRETE_RAINBOW_GREEN) color = '#00FF00';
    else if (blockId === ItemType.CONCRETE_RAINBOW_BLUE) color = '#0000FF';
    else if (blockId === ItemType.CONCRETE_RAINBOW_INDIGO) color = '#4B0082';
    else if (blockId === ItemType.CONCRETE_RAINBOW_VIOLET) color = '#EE82EE';

    const drawnOptions = new Set<string>();
    for (let face = 0; face < 6; face++) {
       const [tx, ty] = uvs[face];
       const key = `${tx},${ty}`;
       if (drawnOptions.has(key)) continue;
       drawnOptions.add(key);

       let hasFace = false;
       if (blockId === ItemType.GLOWSTONE || blockId === ItemType.BLUE_STONE) hasFace = true;
       // We can give the kawaii face to "special" interactable blocks 
       if (blockId === ItemType.CRAFTING_TABLE || blockId === ItemType.FURNACE) hasFace = true;

       if (blockId === ItemType.CONCRETE_RAINBOW_MULTICOLOR) {
          ctx.clearRect(tx*size, ty*size, size, size);
          const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];
          const stripeW = size / rainbowColors.length;
          for (let i = 0; i < rainbowColors.length; i++) {
             ctx.fillStyle = rainbowColors[i];
             ctx.fillRect(tx*size + i * stripeW, ty*size, Math.ceil(stripeW), size);
          }
          // Shiny reflex gloss overlay
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(tx*size + 1, ty*size + 1, size - 2, 2);
          ctx.fillRect(tx*size + 1, ty*size + 3, 2, size - 4);
          
          // Outer black outline cel-shaded border
          ctx.strokeStyle = '#220022';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx*size + 0.5, ty*size + 0.5, size - 1, size - 1);
       } else if (tx === 0 && ty === 2) { // Water
          ctx.clearRect(tx*size, ty*size, size, size);
          ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
          ctx.fillRect(tx*size, ty*size, size, size);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillRect(tx*size + 3, ty*size + 3, 4, 1);
          ctx.fillRect(tx*size + 2, ty*size + 4, 1, 2);
       } else if (ty === 11 && tx >= 0 && tx < 16) { // Colored Glass blocks
          ctx.clearRect(tx*size, ty*size, size, size);
          const glassCol = GLASS_COLORS_SUMMERLAB[tx] || '#FFFFFF';
          ctx.fillStyle = glassCol + '44'; 
          ctx.fillRect(tx*size, ty*size, size, size);
          ctx.strokeStyle = glassCol + '88';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx*size + 0.5, ty*size + 0.5, size - 1, size - 1);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.moveTo(tx * size + 4, ty * size + 4); ctx.lineTo(tx * size + 6, ty * size + 6);
          ctx.moveTo(tx * size + 10, ty * size + 10); ctx.lineTo(tx * size + 12, ty * size + 12);
          ctx.stroke();
       } else if (tx === 1 && ty === 2) { // Glass
          ctx.clearRect(tx*size, ty*size, size, size);
          ctx.fillStyle = 'rgba(200, 255, 255, 0.3)';
          ctx.fillRect(tx*size, ty*size, size, size);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(tx*size + 2, ty*size + 2, 4, 1);
          ctx.fillRect(tx*size + 2, ty*size + 3, 1, 3);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.strokeRect(tx*size + 1, ty*size + 1, size - 2, size - 2);
       } else {
          if (ty >= 27 && stdCanvas) {
              ctx.clearRect(tx * size, ty * size, size, size);
              ctx.drawImage(stdCanvas, tx * size, ty * size, size, size, tx * size, ty * size, size, size);
           } else {
              drawBeveledTile(tx, ty, color, hasFace);
           }
       }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedSummerLabTexture = texture;
  return texture;
}
