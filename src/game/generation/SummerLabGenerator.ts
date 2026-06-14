import { ItemType } from '../Inventory';

export function generateSummerLabColumn(chunk: any, x: number, z: number, worldX: number, worldZ: number): void {
  const distSq = worldX * worldX + worldZ * worldZ;
  const parkourX = worldX - 4;
  const parkourZ = worldZ - 62;
  const parkourDistSq = parkourX * parkourX + parkourZ * parkourZ;
  const poolX = worldX - 30;
  const poolZ = worldZ - 62;
  const poolDistSq = poolX * poolX + poolZ * poolZ;

  const inCastleBox = Math.abs(worldX) <= 40 && Math.abs(worldZ) <= 40;
  let inKeep = false;
  let isOuterWall = false;
  let tdistSq = 0;
  let isGate = false;
  let r1 = 6;
  let cx = 0;
  let cz = 0;
  let isKeepWall = false;
  let isKeepGate = false;
  let isPathLightArea = Math.abs(worldX) < 5 && Math.abs(worldZ) < 5 && (Math.abs(worldX) === 4 || Math.abs(worldZ) === 4) && Math.abs(worldX + worldZ) % 6 === 0;

  if (inCastleBox) {
    inKeep = Math.abs(worldX) <= 20 && Math.abs(worldZ) <= 20;
    isOuterWall = (Math.abs(worldX) >= 36 && Math.abs(worldX) <= 40) || (Math.abs(worldZ) >= 36 && Math.abs(worldZ) <= 40);
    cx = worldX > 0 ? 35 : -35;
    cz = worldZ > 0 ? 35 : -35;
    tdistSq = (worldX - cx)**2 + (worldZ - cz)**2;
    isGate = Math.abs(worldX) < 4 || Math.abs(worldZ) < 4;
    if (inKeep) {
      isKeepWall = Math.abs(worldX) === 20 || Math.abs(worldZ) === 20;
      isKeepGate = Math.abs(worldX) < 3 || Math.abs(worldZ) < 3;
    }
  }

  const gX = Math.floor(worldX / 2);
  const gZ = Math.floor(worldZ / 2);

  // Instead of scanning to 384, we just check bounds: -20 to 350
  for (let fy = -20; fy <= 350; fy++) {
    const y = fy - (-60); // WORLD_Y_OFFSET
    if (y < 0 || y >= 384) continue;

    let baseBlock: number = ItemType.AIR;

    if (worldX === 4 && fy === 301 && worldZ === 62) {
      chunk.setBlockFast(x, y, z, ItemType.CHEST);
      continue;
    }
    
    if (worldX === 30 && fy === -9 && worldZ === 62) {
      chunk.setBlockFast(x, y, z, ItemType.CHEST);
      continue;
    }
    
    // Floor / Island
    if (fy <= 0 && fy >= -10) {
       const maxR = 80 + fy; 
       if (distSq <= maxR * maxR) {
          if (fy === 0) {
             if (Math.abs(worldX) < 5 || Math.abs(worldZ) < 5) baseBlock = ItemType.STONE;
             else baseBlock = ItemType.GRASS;
          } else if (fy > -3) {
              baseBlock = ItemType.DIRT;
          } else {
              baseBlock = ItemType.STONE;
          }
       }
    }

    // Large water pool overrides floor
    if (poolDistSq <= 600 && fy <= 5 && fy >= -10) {
        if (fy === -10) {
            baseBlock = ItemType.STONE;
        } else if (fy <= 0 && poolDistSq >= 500) {
            baseBlock = ItemType.STONE; 
        } else if (fy < 0) {
            baseBlock = ItemType.WATER;
        } else if (fy === 0) {
            baseBlock = ItemType.AIR; 
        }
    }

    if (baseBlock === ItemType.AIR && fy >= 0) {
        // Spiral vertical parkour
        if (parkourDistSq <= 4 && fy <= 300) {
            baseBlock = ItemType.BLUE_STONE;
        }
        
        if (baseBlock === ItemType.AIR && fy > 0 && fy <= 300 && parkourDistSq <= 25) { // broadphase check
            const angle = fy * Math.PI / 4; 
            const dirX = Math.cos(angle);
            const dirZ = Math.sin(angle);
            const dot = parkourX * dirX + parkourZ * dirZ;
            const perpDistSq = parkourDistSq - dot * dot;
            if (dot > 2 && dot <= 5 && perpDistSq <= 0.5) {
                baseBlock = ItemType.WOOD;
            }
        }
        
        // Castle Bounding Box
        if (inCastleBox) {
          const r1 = 6;
          const r2 = 4;
          if (tdistSq <= r1 * r1) {
            if (fy <= 30) {
              if (tdistSq >= r2 * r2) {
                 if (fy > 0 && fy % 5 === 0 && (worldX === cx || worldZ === cz)) baseBlock = ItemType.GLASS;
                 else baseBlock = ItemType.STONE;
              } else {
                 if (fy === 30) baseBlock = ItemType.STONE; 
                 else if (fy % 10 === 0) baseBlock = ItemType.PLANKS; 
                 else {
                   const angle = Math.atan2(worldZ - cz, worldX - cx);
                   const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
                   const heightMod = (fy % 10) / 10;
                   if (Math.abs(normalizedAngle - heightMod) < 0.15) {
                       baseBlock = ItemType.WOOD;
                   }
                 }
              }
            } else if (fy > 30 && fy <= 45) { 
              const spR = 6 - (fy - 30) * 0.4;
              if (tdistSq <= spR * spR) {
                baseBlock = ItemType.BLUE_STONE;
              }
            }
          }

          if (baseBlock === ItemType.AIR && isOuterWall && tdistSq > r1 * r1) {
             if (fy <= 12) {
                if (!(isGate && fy <= 8)) baseBlock = ItemType.STONE;
             } else if (fy === 13) {
                if (!isGate && (Math.abs(worldX) + Math.abs(worldZ)) % 2 === 0) baseBlock = ItemType.STONE;
             }
          }

          if (baseBlock === ItemType.AIR && inKeep) {
            if (fy <= 40) {
               if (isKeepWall) {
                  if (!(isKeepGate && fy <= 6)) {
                     if (fy > 0 && fy % 10 === 5 && Math.abs(Math.abs(worldX) - 10) < 3) baseBlock = ItemType.GLASS;
                     else if (fy > 0 && fy % 10 === 5 && Math.abs(Math.abs(worldZ) - 10) < 3) baseBlock = ItemType.GLASS;
                     else baseBlock = ItemType.BRICK;
                  }
               } else if (fy > 0 && fy % 10 === 0) {
                  if (!(Math.abs(worldX) < 4 && Math.abs(worldZ) < 10)) baseBlock = ItemType.PLANKS;
               } else if (Math.abs(worldX) < 4 && Math.abs(worldZ) < 10) { 
                 const stairY = 10 - Math.abs(worldZ); 
                 if (fy % 10 === stairY) baseBlock = ItemType.WOOD;
               } else if (fy % 10 === 9 && worldX === 0 && worldZ === 0) {
                 baseBlock = ItemType.GLOWSTONE;
               }
             } else if (fy > 40 && fy <= 55) { 
               const roofScale = 20 - (fy - 40) * 1.33;
               if (Math.abs(worldX) <= roofScale && Math.abs(worldZ) <= roofScale) {
                 if (Math.abs(worldX) >= roofScale - 1 || Math.abs(worldZ) >= roofScale - 1) {
                   baseBlock = ItemType.OBSIDIAN;
                 }
               }
             } else if (Math.abs(worldX) <= 4 && Math.abs(worldZ) <= 4 && fy > 40 && fy <= 80) { 
               const spireR = 4 - (fy - 55) * 0.15;
               if (Math.max(Math.abs(worldX), Math.abs(worldZ)) <= spireR) {
                  if ((worldX + worldZ + fy) % 4 === 0) baseBlock = ItemType.GLOWSTONE;
                  else baseBlock = ItemType.BLUE_STONE;
               }
             }
          }

          if (baseBlock === ItemType.AIR && fy <= 6 && !inKeep && !isOuterWall && tdistSq > r1*r1) { 
             const cX = [28, -28];
             const cZ = [28, -28];
             for(let fX of cX) {
               for(let fZ of cZ) {
                  if (Math.abs(worldX - fX) <= 3 && Math.abs(worldZ - fZ) <= 3) {
                     if (fy === 0) baseBlock = ItemType.STONE;
                     else if (fy === 1) {
                        if (Math.abs(worldX - fX) >= 2 || Math.abs(worldZ - fZ) >= 2) baseBlock = ItemType.SLAB_STONE;
                        else baseBlock = ItemType.WATER;
                     }
                     else if (fy <= 5 && worldX === fX && worldZ === fZ) baseBlock = ItemType.STONE;
                     else if (fy === 5 && Math.abs(worldX - fX) <= 1 && Math.abs(worldZ - fZ) <= 1) baseBlock = ItemType.WATER;
                  }
               }
             }
          }
        }
        
        if (baseBlock === ItemType.AIR && fy === 1 && isPathLightArea) {
            if (Math.abs(worldX) > 20 || Math.abs(worldZ) > 20) {
                baseBlock = ItemType.TORCH;
            }
        }
    }

    if (baseBlock !== ItemType.AIR) {
      if (
          baseBlock === ItemType.WATER || 
          baseBlock === ItemType.GLASS || 
          baseBlock === ItemType.GLOWSTONE || 
          baseBlock === ItemType.TORCH || 
          baseBlock === ItemType.WATER_1
      ) {
          chunk.setBlockFast(x, y, z, baseBlock);
      } else {
        const gY = Math.floor(fy / 2);
        const hash = Math.abs(Math.sin(gX * 12.9898 + gY * 78.233 + gZ * 37.719) * 43758.5453) % 1;
        
        if (hash < 0.60) chunk.setBlockFast(x, y, z, ItemType.CONCRETE_WHITE);
        else if (hash < 0.80) chunk.setBlockFast(x, y, z, ItemType.CONCRETE_PINK);
        else if (hash < 0.90) chunk.setBlockFast(x, y, z, ItemType.CONCRETE_PURPLE);
        else if (hash < 0.95) chunk.setBlockFast(x, y, z, ItemType.CONCRETE_RAINBOW_GREEN);
        else chunk.setBlockFast(x, y, z, ItemType.CONCRETE_MAGENTA);
      }
    }
  }
}

export function getSummerLabBlock(x: number, y: number, z: number): number {
  if (y < -20 || y > 350) return ItemType.AIR;
  
  const fy = Math.floor(y);
  
  let baseBlock: number = ItemType.AIR;

  if (x === 4 && fy === 301 && z === 62) {
    return ItemType.CHEST;
  }
  
  if (x === 30 && fy === -9 && z === 62) {
      return ItemType.CHEST;
  }
  
  // Floor / Island
  const distSq = x * x + z * z;
  if (fy <= 0 && fy >= -10) {
     const maxR = 80 + fy; // Taper off (70 to 80)
     if (distSq <= maxR * maxR) {
        if (fy === 0) {
           // Paths
           if (Math.abs(x) < 5 || Math.abs(z) < 5) baseBlock = ItemType.STONE;
           else baseBlock = ItemType.GRASS;
        } else if (fy > -3) {
            baseBlock = ItemType.DIRT;
        } else {
            baseBlock = ItemType.STONE;
        }
     }
  }

  // Spiral vertical parkour near x=4, z=-62
  const parkourX = x - 4;
  const parkourZ = z - 62;
  const parkourDistSq = parkourX * parkourX + parkourZ * parkourZ;

  // Large water pool next to it, centered at x=30, z=-62
  const poolX = x - 30;
  const poolZ = z - 62;
  const poolDistSq = poolX * poolX + poolZ * poolZ;

  // Large water pool overrides floor
  if (poolDistSq <= 600 && fy <= 5 && fy >= -10) {
      if (fy === -10) {
          baseBlock = ItemType.STONE;
      } else if (fy <= 0 && poolDistSq >= 500) {
          baseBlock = ItemType.STONE; // border
      } else if (fy < 0) {
          baseBlock = ItemType.WATER;
      } else if (fy === 0) {
          baseBlock = ItemType.AIR; // hole top
      }
  }

  if (baseBlock === ItemType.AIR && fy >= 0) {
      // Spiral vertical parkour
      // Central pillar for the parkour
      if (parkourDistSq <= 4 && fy <= 300) {
          baseBlock = ItemType.BLUE_STONE;
      }
      
      // Platforms spiraling up the pillar
      if (baseBlock === ItemType.AIR && fy > 0 && fy <= 300) {
          // One platform every block vertically so it's jumpable
          const platformIndex = fy;
          // To require more jumping, we can space them out or make angle jumps harder
          // We will use one block every vertical step, but spread the angle slightly.
          const angle = platformIndex * Math.PI / 4; // 45 degrees rotation per block
          
          // Direction of the 2x1 platform
          const dirX = Math.cos(angle);
          const dirZ = Math.sin(angle);
          
          // Check if block is on the platform (extends outward from pillar)
          const dot = parkourX * dirX + parkourZ * dirZ;
          const perpDistSq = parkourDistSq - dot * dot;
          
          // Make platforms 1 block wide and 3 blocks long, starting at dist=2
          if (dot > 2 && dot <= 5 && perpDistSq <= 0.5) {
              baseBlock = ItemType.WOOD;
          }
      }
      
      // Castle Bounding Box
      if (Math.abs(x) <= 40 && Math.abs(z) <= 40) {
        const inKeep = Math.abs(x) <= 20 && Math.abs(z) <= 20;
        const isOuterWall = (Math.abs(x) >= 36 && Math.abs(x) <= 40) || (Math.abs(z) >= 36 && Math.abs(z) <= 40);

        // 4 Corner Towers
        const cx = x > 0 ? 35 : -35;
        const cz = z > 0 ? 35 : -35;
        const tdistSq = (x - cx)**2 + (z - cz)**2;
        const r1 = 6;
        const r2 = 4;

        if (tdistSq <= r1 * r1) {
          if (fy <= 30) {
            if (tdistSq >= r2 * r2) {
               if (fy > 0 && fy % 5 === 0 && (x === cx || z === cz)) baseBlock = ItemType.GLASS;
               else baseBlock = ItemType.STONE;
            } else {
               if (fy === 30) baseBlock = ItemType.STONE; // roof of tower
               else if (fy % 10 === 0) baseBlock = ItemType.PLANKS; // floors in tower
               else {
                 // Spiral staircase logic
                 const angle = Math.atan2(z - cz, x - cx);
                 const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
                 const heightMod = (fy % 10) / 10;
                 if (Math.abs(normalizedAngle - heightMod) < 0.15) {
                     baseBlock = ItemType.WOOD;
                 }
               }
            }
          } else if (fy > 30 && fy <= 45) { // Spires on towers
            const spR = 6 - (fy - 30) * 0.4;
            if (tdistSq <= spR * spR) {
              baseBlock = ItemType.BLUE_STONE;
            }
          }
        }

        // Outer Walls (excluding towers)
        if (baseBlock === ItemType.AIR && isOuterWall && tdistSq > r1 * r1) {
           const isGate = Math.abs(x) < 4 || Math.abs(z) < 4;
           if (fy <= 12) {
              if (!(isGate && fy <= 8)) baseBlock = ItemType.STONE;
           } else if (fy === 13) {
              if (!isGate && (Math.abs(x) + Math.abs(z)) % 2 === 0) baseBlock = ItemType.STONE;
           }
        }

        // Central Keep
        if (baseBlock === ItemType.AIR && inKeep) {
          const isKeepWall = Math.abs(x) === 20 || Math.abs(z) === 20;
          if (fy <= 40) {
             if (isKeepWall) {
                const isKeepGate = Math.abs(x) < 3 || Math.abs(z) < 3;
                if (!(isKeepGate && fy <= 6)) {
                   if (fy > 0 && fy % 10 === 5 && Math.abs(Math.abs(x) - 10) < 3) baseBlock = ItemType.GLASS;
                   else if (fy > 0 && fy % 10 === 5 && Math.abs(Math.abs(z) - 10) < 3) baseBlock = ItemType.GLASS;
                   else baseBlock = ItemType.BRICK;
                }
             } else if (fy > 0 && fy % 10 === 0) {
                // Leave hole for stairs
                if (!(Math.abs(x) < 4 && Math.abs(z) < 10)) baseBlock = ItemType.PLANKS;
             } else if (Math.abs(x) < 4 && Math.abs(z) < 10) { // Grand staircase
               const stairY = 10 - Math.abs(z); // slope up towards center
               if (fy % 10 === stairY) baseBlock = ItemType.WOOD;
             } else if (fy % 10 === 9 && x === 0 && z === 0) {
               // Chandeliers
               baseBlock = ItemType.GLOWSTONE;
             }
           } else if (fy > 40 && fy <= 55) { // Keep Roof (Pyramid)
             const roofScale = 20 - (fy - 40) * 1.33;
             if (Math.abs(x) <= roofScale && Math.abs(z) <= roofScale) {
               if (Math.abs(x) >= roofScale - 1 || Math.abs(z) >= roofScale - 1) {
                 baseBlock = ItemType.OBSIDIAN;
               }
             }
           } else if (Math.abs(x) <= 4 && Math.abs(z) <= 4 && fy > 40 && fy <= 80) { // Central Spire Structure
             const spireR = 4 - (fy - 55) * 0.15;
             if (Math.max(Math.abs(x), Math.abs(z)) <= spireR) {
                if ((x + z + fy) % 4 === 0) baseBlock = ItemType.GLOWSTONE;
                else baseBlock = ItemType.BLUE_STONE;
             }
           }
        }

        // Fountains in Courtyard
        if (baseBlock === ItemType.AIR && fy <= 6 && !inKeep && !isOuterWall && tdistSq > r1*r1) { 
           const cX = [28, -28];
           const cZ = [28, -28];
           for(let fX of cX) {
             for(let fZ of cZ) {
                if (Math.abs(x - fX) <= 3 && Math.abs(z - fZ) <= 3) {
                   if (fy === 0) baseBlock = ItemType.STONE;
                   else if (fy === 1) {
                      if (Math.abs(x - fX) >= 2 || Math.abs(z - fZ) >= 2) baseBlock = ItemType.SLAB_STONE;
                      else baseBlock = ItemType.WATER;
                   }
                   else if (fy <= 5 && x === fX && z === fZ) baseBlock = ItemType.STONE;
                   else if (fy === 5 && Math.abs(x - fX) <= 1 && Math.abs(z - fZ) <= 1) baseBlock = ItemType.WATER;
                }
             }
           }
        }
      }
      
      // Path lights
      if (baseBlock === ItemType.AIR && fy === 1 && Math.abs(x) < 5 && Math.abs(z) < 5 && (Math.abs(x) === 4 || Math.abs(z) === 4) && Math.abs(x+z) % 6 === 0) {
          if (Math.abs(x) > 20 || Math.abs(z) > 20) {
              baseBlock = ItemType.TORCH;
          }
      }
  }

  if (baseBlock !== ItemType.AIR) {
    if (
        baseBlock === ItemType.WATER || 
        baseBlock === ItemType.GLASS || 
        baseBlock === ItemType.GLOWSTONE || 
        baseBlock === ItemType.TORCH || 
        baseBlock === ItemType.WATER_1
    ) {
        return baseBlock;
    }

    // Determine random color
    // white: 60%, black: 5%, hotpink: 15%, purple: 10%, limegreen: 5%, magenta: 5%
    // To make it consistent per 2x2x2 block area, floor coordinates divided by 2
    const gX = Math.floor(x / 2);
    const gY = Math.floor(y / 2);
    const gZ = Math.floor(z / 2);
    const hash = Math.abs(Math.sin(gX * 12.9898 + gY * 78.233 + gZ * 37.719) * 43758.5453) % 1;
    
    if (hash < 0.60) return ItemType.CONCRETE_WHITE;
    if (hash < 0.80) return ItemType.CONCRETE_PINK;
    if (hash < 0.90) return ItemType.CONCRETE_PURPLE;
    if (hash < 0.95) return ItemType.CONCRETE_RAINBOW_GREEN;
    return ItemType.CONCRETE_MAGENTA;
  }

  return ItemType.AIR;
}

