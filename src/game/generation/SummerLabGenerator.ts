import { ItemType } from '../Inventory';

export function isWaterParkPhase(now: number = Date.now()): boolean {
   if (typeof window !== "undefined" && (window as any).__FORCE_WATER_PARK !== undefined) {
      return (window as any).__FORCE_WATER_PARK;
   }
   return Math.floor(now / 1200000) % 2 === 1;
}

export function getWaterParkBlock(x: number, y: number, z: number): number {
  if (y < -20 || y > 100) return ItemType.AIR;
  
  const fy = Math.floor(y);
  let baseBlock: number = ItemType.AIR;

  // Colors
  const colors = [
      ItemType.CONCRETE_RAINBOW_RED,
      ItemType.CONCRETE_RAINBOW_ORANGE,
      ItemType.CONCRETE_RAINBOW_YELLOW,
      ItemType.CONCRETE_RAINBOW_GREEN,
      ItemType.CONCRETE_RAINBOW_BLUE,
      ItemType.CONCRETE_RAINBOW_INDIGO,
      ItemType.CONCRETE_RAINBOW_VIOLET
  ];

  const distSq = x * x + z * z;
  const dist = Math.sqrt(distSq);
  
  if (dist > 60) return ItemType.AIR;

  const angle = Math.atan2(z, x);
  const normalizedAngle = angle >= 0 ? angle : angle + Math.PI * 2;
  const partition = Math.floor((normalizedAngle / (Math.PI * 2)) * colors.length) % colors.length;
  
  const inInnerPool = (
      (Math.abs(x - 25) <= 13 && Math.abs(z - 25) <= 9) || // Leisure
      (Math.abs(x + 25) <= 9 && Math.abs(z - 25) <= 9) || // Diving
      (Math.abs(x + 25) <= 14 && Math.abs(z + 25) <= 14) || // Kiddy
      (Math.abs(x - 25) <= 9 && Math.abs(z + 25) <= 13) // Wave
  );
  // River excludes bridges
  const inLazyRiver = dist >= 45 && dist <= 52 && (Math.abs(x) > 4 && Math.abs(z) > 4);
  const isInsideWater = inInnerPool || inLazyRiver;
  
  // Base Foundations and Pools
  if (fy <= 0 && fy >= -5) {
      if (fy === 0) {
          if (Math.abs(x) <= 4 || Math.abs(z) <= 4) {
              baseBlock = colors[Math.abs(x + z) % colors.length]; // Main walkways
          } else if (dist > 8 && dist < 45) {
              // The main zones are partitioned by color
              baseBlock = colors[partition];
              
              // Add some small grass/wood patches
              if (Math.abs(x + z) % 15 === 0 && Math.abs(x - z) % 15 === 0) {
                 baseBlock = ItemType.WOOD;
              }
          }

          // Lazy River: R=45 to 52
          const isBridge = Math.abs(x) <= 4 || Math.abs(z) <= 4;
          if (dist >= 45 && dist <= 52) {
              if (!isBridge) {
                  baseBlock = ItemType.AIR; // River surface
              } else {
                  baseBlock = colors[partition]; // Bridge
              }
          } else if (dist >= 44 && dist <= 53) {
              if (dist < 45 || dist > 52) baseBlock = colors[(Math.abs(x) + Math.abs(z)) % colors.length]; // Borders
          }

          // Pools layout
          const isPool = (px: number, pz: number, dx: number, dz: number) => Math.abs(x - px) <= dx && Math.abs(z - pz) <= dz;
          const isPoolInner = (px: number, pz: number, dx: number, dz: number) => Math.abs(x - px) <= dx - 1 && Math.abs(z - pz) <= dz - 1;

          // Q1 Leisure Pool (organic look, approximated with rectangles)
          if (isPool(25, 25, 14, 10)) {
              if (isPoolInner(25, 25, 14, 10)) baseBlock = ItemType.AIR;
              else baseBlock = colors[0]; // Red border
          }
          // Q2 Diving/Deep Pool
          else if (isPool(-25, 25, 10, 10)) {
              if (isPoolInner(-25, 25, 10, 10)) baseBlock = ItemType.AIR;
              else baseBlock = colors[4]; // Blue border
          }
          // Q3 Kiddy Splash Zone
          else if (isPool(-25, -25, 15, 15)) {
              if (isPoolInner(-25, -25, 15, 15)) baseBlock = ItemType.AIR;
              else baseBlock = colors[6]; // Violet border
          }
          // Q4 Wave Pool
          else if (isPool(25, -25, 10, 14)) {
              if (isPoolInner(25, -25, 10, 14)) baseBlock = ItemType.AIR;
              else baseBlock = colors[2]; // Yellow border
          }
          
          if (Math.abs(x) <= 12 && Math.abs(z) <= 12) {
              baseBlock = colors[(Math.abs(x) + Math.abs(z)) % colors.length]; // Colorful center plaza
          }
      } else if (fy < 0) {
          // Bottom fills: continue the partitioned colors down
          baseBlock = colors[partition];

          // Lazy River water
          if (dist >= 45 && dist <= 52 && fy >= -2) {
              baseBlock = ItemType.WATER;
          }

          const checkPoolWater = (px: number, pz: number, dx: number, dz: number) => Math.abs(x - px) <= dx - 1 && Math.abs(z - pz) <= dz - 1;
          
          if (checkPoolWater(25, 25, 14, 10)) { // Leisure Pool
              if (fy >= -2) baseBlock = ItemType.WATER;
              else baseBlock = colors[1];
          } else if (checkPoolWater(-25, 25, 10, 10)) { // Diving Pool
              if (fy >= -4) baseBlock = ItemType.WATER;
              else baseBlock = colors[4]; // Deep blue bottom
          } else if (checkPoolWater(-25, -25, 15, 15)) { // Kiddy Pool
              if (fy === -1) baseBlock = ItemType.WATER_1; // Shallow water
              else baseBlock = colors[partition]; // Colorful bottom
          } else if (checkPoolWater(25, -25, 10, 14)) { // Wave Pool
              // Wave pool slope
              const progX = x - 15; // 0 to 20
              if (fy >= -3 + Math.floor(progX / 6)) baseBlock = ItemType.WATER;
              else baseBlock = colors[5];
          }
      }
  }

  // Structures (y >= 0)
  if (baseBlock === ItemType.AIR && fy >= 0) {
      // 1. Cabanas (Leisure Pool Q1: around 25, 25)
      const isCabana = (cx: number, cz: number) => !isInsideWater && Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2;
      const cabanas = [[15, 39], [25, 39], [35, 39], [42, 25], [42, 15]];
      for (const [cx, cz] of cabanas) {
          if (isCabana(cx, cz) && fy <= 4) {
               if (fy === 4) {
                   baseBlock = colors[(cx + cz) % colors.length]; // specific color roof
               } else if (Math.abs(x - cx) === 2 && Math.abs(z - cz) === 2) {
                   baseBlock = ItemType.WOOD; // Support posts
               } else if (fy === 1 && Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
                   baseBlock = ItemType.SLAB_WOOD; // Floor/Seat
               }
          }
      }

      // 2. Lifeguard Stands
      const stands = [[10, 25], [-10, 25], [25, -10], [-9, -26]];
      if (!isInsideWater) {
          for (const [sx, sz] of stands) {
              if (Math.abs(x - sx) <= 1 && Math.abs(z - sz) <= 1 && fy <= 5) {
                  if (fy <= 3) {
                      if (Math.abs(x - sx) === 1 && Math.abs(z - sz) === 1) baseBlock = ItemType.PLANKS; // stilts
                      if (fy === 3 && x === sx && z === sz) baseBlock = ItemType.PLANKS;
                  } else if (fy === 4) {
                      if (x === sx && z === sz) baseBlock = colors[0]; // seat
                      else if (Math.abs(x - sx) === 1 || Math.abs(z - sz) === 1) baseBlock = ItemType.PLANKS; // railing
                  } else if (fy === 5 && x === sx && z === sz) {
                      baseBlock = colors[0]; // Top umbrella
                  }
              }
          }
      }

      // 3. Lockers & Changing Rooms (Near entrance/lazy river edge)
      if (dist >= 53 && dist <= 58) {
          // Lockers structure
          if (x >= -40 && x <= -20 && z >= 53 && z <= 56) {
              if (fy <= 4) {
                  if (fy === 4) baseBlock = colors[3]; // roof
                  else if (Math.abs(x) % 2 === 0 && fy <= 2 && z === 54) baseBlock = colors[(Math.abs(x)) % colors.length]; // colorful locker doors
                  else baseBlock = colors[(Math.abs(x)+fy) % colors.length]; // walls
              }
          }
          // Changing Rooms
          if (x >= 20 && x <= 40 && z >= 53 && z <= 56) {
               if (fy <= 4) {
                   if (fy === 4) baseBlock = ItemType.WOOD; // roof
                   else if (z === 53 && x % 4 !== 0 && fy <= 2) baseBlock = ItemType.AIR; // doors
                   else baseBlock = colors[Math.abs(Math.floor(x / 4)) % colors.length]; // divided colorful rooms
               }
          }
          // Rainbow Snack & Ice Cream Stand
          if (x >= 53 && x <= 56 && z >= -10 && z <= 10) {
               if (fy <= 4) {
                   if (fy === 4) baseBlock = colors[Math.abs(z) % colors.length]; // Rainbow striped awning
                   else if (x === 53 && fy === 1) baseBlock = colors[1]; // counter base
                   else if (x === 53 && fy === 2 && z % 3 === 0) baseBlock = ItemType.WOOD; // awning posts
                   else if (x === 54 && fy === 2 && z % 2 === 0) baseBlock = colors[(Math.abs(z) + 10) % colors.length]; // ice cream flavors display
                   else if (x > 53) baseBlock = colors[0]; // back kitchen walls
               }
          }
      }

      // 4. Ticket Booths (Entrance)
      if (Math.abs(x) <= 8 && z >= 53 && z <= 58 && fy <= 5) {
           if (x >= -6 && x <= -2 || x >= 2 && x <= 6) {
               if (fy === 5) baseBlock = colors[Math.abs(x) % colors.length];
               else if (fy === 2 && z === 53 && Math.abs(x) !== 4) baseBlock = ItemType.GLASS; // windows
               else baseBlock = colors[(Math.abs(x)+fy) % colors.length];
           }
      }

      // 5. Diving Boards (Q2: Diving Pool edge is at x = -15, z = 15..35)
      if (x >= -16 && x <= -10 && z >= 22 && z <= 26 && fy <= 10) {
          // 3m board
          if (x === -12 && z === 25 && fy <= 3) baseBlock = colors[3]; // ladder/support
          if (x >= -16 && x <= -12 && z === 25 && fy === 3) baseBlock = ItemType.SLAB_WOOD; // board extends to -16 (inside pool)
          // 5m board
          if (x === -12 && z === 22 && fy <= 5) baseBlock = colors[4];
          if (x >= -16 && x <= -12 && z === 22 && fy === 5) baseBlock = ItemType.SLAB_WOOD;
          // 10m platform tower
          if (x >= -12 && x <= -10 && z >= 23 && z <= 26) {
              if (fy <= 10) {
                  if (Math.abs(x) === 10 || Math.abs(x) === 12) baseBlock = colors[5]; // legs
                  if (fy === 10) baseBlock = colors[2]; // platform
                  if (fy < 10 && x === -11 && z === 26) baseBlock = ItemType.WOOD; // ladder
              }
          }
          if (x >= -16 && x <= -12 && z >= 24 && z <= 25 && fy === 10) baseBlock = ItemType.SLAB_WOOD; // jumping off 10m
      }

      // 6. Central Hub Tower (more detailed)
      if (Math.abs(x) <= 8 && Math.abs(z) <= 8) {
          if (fy <= 30) {
              // Structural pillars
              if (Math.abs(x) === 8 && Math.abs(z) === 8) baseBlock = colors[fy % colors.length];
              // Glass walls
              else if (Math.abs(x) === 8 || Math.abs(z) === 8) {
                  if (fy % 5 !== 0) {
                      if ((x + z) % 3 === 0) baseBlock = ItemType.GLASS;
                      else baseBlock = colors[(Math.abs(x) + Math.abs(z)) % colors.length];
                  } else {
                      baseBlock = colors[(fy+1) % colors.length]; // bands
                  }
              }
              // Intermediary floors
              else if (fy % 10 === 0) {
                  baseBlock = ItemType.PLANKS; // tower floors
              }
              // Spiral staircase
              else if (Math.abs(x) <= 7 && Math.abs(z) <= 7) {
                  const sAngle = Math.atan2(z, x);
                  const normSAngle = (sAngle + Math.PI) / (Math.PI * 2);
                  const heightMod = (fy % 10) / 10;
                  if (Math.abs(normSAngle - heightMod) < 0.2) {
                      baseBlock = ItemType.WOOD;
                  } else if (Math.abs(x) <= 2 && Math.abs(z) <= 2) {
                      baseBlock = colors[2]; // central core
                  }
              }
          } else if (fy <= 38) {
              // Impressive Spire Roof (Rainbow colored)
              const roofR = Math.max(0, 8 - (fy - 30));
              if (Math.abs(x) <= roofR && Math.abs(z) <= roofR) {
                 baseBlock = colors[(fy - 30) % colors.length];
              }
          } else if (fy <= 45 && Math.abs(x) <= 1 && Math.abs(z) <= 1) {
              baseBlock = colors[4]; // antenna
          }
      }

      // 7. Elaborate Slides
      
      // 1. Classic Spiral Tube Slide (starts at y=30, spirals to Leisure Pool)
      const slide1Angle = (fy * 0.25) % (Math.PI * 2);
      const slide1R = 9 + (30 - fy) * 0.5; // Moves outward
      const s1x = Math.cos(slide1Angle) * slide1R;
      const s1z = Math.sin(slide1Angle) * slide1R;
      
      const distToS1Sq = (x - s1x)**2 + (z - s1z)**2;
      if (fy <= 30 && distToS1Sq <= 12) {
          if (distToS1Sq >= 6) {
              // Tube coloring
              if (fy % 4 === 0) baseBlock = colors[6]; // Rings
              else baseBlock = colors[Math.floor(fy / 5) % 6];
          } else if (fy === 1) {
              baseBlock = ItemType.WATER;
          } else {
              baseBlock = ItemType.AIR; // inside tube
          }
      }

      // 2. Twin Speed Drops (from Tower y=20 down to Splash Pool Q4: 25, -25)
      if (x > 8 && x < 25 && z < -8 && z > -25) {
          const slideLen = 25 - 8;
          const progX = x - 8;
          const progZ = -8 - z; // positive
          
          if (Math.abs(progX - progZ) <= 3) {
              const expectedY = 20 - (progX * (19 / slideLen));
              if (Math.abs(expectedY - fy) <= 1) {
                  // Two distinct lanes
                  if (Math.abs(progX - progZ) === 1) baseBlock = colors[1]; // divider
                  else if (Math.abs(progX - progZ) === 3) baseBlock = colors[4]; // outer walls
                  else {
                      if (expectedY - fy > 0) baseBlock = ItemType.WATER;
                      else baseBlock = colors[0];
                  }
              }
              // Support pillars
              if (Math.abs(progX - progZ) <= 1 && progX % 5 === 0 && fy < expectedY - 2 && baseBlock === ItemType.AIR) {
                  baseBlock = ItemType.WOOD;
              }
          }
      }
      
      // 3. Wide wavy family slide (from Tower y=10 down to Kiddy pool Q3: -25,-25)
      if (x < -8 && x > -25 && z < -8 && z > -25) {
          const progX = -8 - x;
          const progZ = -8 - z;
          if (Math.abs(progX - progZ) <= 4) {
              const slideLen = 17;
              const dropY = 10 - (progX * (9 / slideLen));
              const waveY = dropY + Math.sin(progX)*1.5;
              
              if (Math.abs(waveY - fy) <= 1) {
                  if (waveY - fy > 0) baseBlock = ItemType.WATER;
                  else baseBlock = colors[3];
              } else if (Math.abs(waveY - fy) <= 2 && Math.abs(progX - progZ) === 4) {
                  baseBlock = colors[2];
              }
              if (Math.abs(progX - progZ) === 0 && progX % 5 === 0 && fy < waveY - 2 && baseBlock === ItemType.AIR) {
                  baseBlock = colors[4];
              }
          }
      }
      
      // 4. Kiddy Pool interactive playhouse & Giant Tipping Bucket
      if (fy >= 0 && fy <= 15 && x > -35 && x < -15 && z > -35 && z < -15) {
          // Play structure
          if (Math.abs(x + 25) <= 4 && Math.abs(z + 25) <= 4) {
             if (fy <= 4) {
                if (Math.abs(x + 25) === 4 || Math.abs(z + 25) === 4) {
                   if ((x + z + fy) % 2 === 0) baseBlock = colors[Math.abs(x + z) % colors.length]; // Rainbow nets
                   else if (fy > 0) baseBlock = ItemType.AIR; // safety net holes
                } else if (fy === 4) baseBlock = ItemType.PLANKS; // floor 2
             } else if (fy <= 9) {
                 if (Math.abs(x + 25) <= 2 && Math.abs(z + 25) <= 2) {
                     if (Math.abs(x + 25) === 2 || Math.abs(z + 25) === 2) {
                         if ((x + z + fy) % 2 === 0) baseBlock = colors[fy % colors.length]; // upper tower walls
                     } else if (fy === 9) {
                         baseBlock = ItemType.PLANKS; // bucket platform
                     }
                 }
                 if (fy === 5 && Math.abs(x + 25) === 0 && Math.abs(z + 25) === 0) baseBlock = ItemType.WATER; // falling water
             } else if (fy >= 10 && fy <= 12) {
                 // The Giant Rainbow Tipping Bucket!
                 if (Math.abs(x + 25) <= 2 && Math.abs(z + 25) <= 2) {
                     if (fy === 10) baseBlock = colors[0]; // bottom of bucket
                     else if (Math.abs(x + 25) === 2 || Math.abs(z + 25) === 2) baseBlock = colors[1]; // sides
                     else baseBlock = ItemType.WATER; // filled with water
                 }
             } else if (fy === 13) {
                // water spilling over
                if (Math.abs(x + 25) <= 1 && Math.abs(z + 25) <= 1 && (x + z) % 2 === 0) baseBlock = ItemType.WATER;
             }
          }
      }
      
      // 5. Sun Loungers and Umbrellas
      if (!isInsideWater && dist >= 35 && dist <= 43) {
          // Every 4 units place a lounger or umbrella
          const gridX = Math.round(x / 4) * 4;
          const gridZ = Math.round(z / 4) * 4;
          const isGrid = Math.abs(x - gridX) <= 1 && Math.abs(z - gridZ) <= 1;
          
          if (isGrid && dist >= 37) {
             const uAngle = Math.atan2(gridZ, gridX);
             const normUAngle = uAngle >= 0 ? uAngle : uAngle + Math.PI * 2;
             const pC = colors[Math.floor((normUAngle / (Math.PI * 2)) * colors.length) % colors.length];
             
             if (Math.abs(x - gridX) === 0 && Math.abs(z - gridZ) === 0) {
                 if (fy > 0 && fy <= 3) baseBlock = ItemType.WOOD; // pole
                 else if (fy === 4) baseBlock = pC; // umbrella center
             } else if (fy === 4 && Math.abs(x - gridX) <= 1 && Math.abs(z - gridZ) <= 1) {
                 if (Math.abs(x - gridX) + Math.abs(z - gridZ) <= 1 || (Math.abs(x - gridX) === 1 && Math.abs(z - gridZ) === 1 && (x+z)%2===0)) {
                     baseBlock = pC; // umbrella canopy
                 } else baseBlock = ItemType.AIR;
             } else if (fy === 1 && Math.abs(x - gridX) === 1 && Math.abs(z - gridZ) === 1) {
                 baseBlock = ItemType.SLAB_WOOD; // loungers under umbrella
             }
          }
      }
      
      // 6. Lazy River arch bridges, railings, and floating tubes
      if (dist >= 45 && dist <= 52) {
          if (Math.abs(x) <= 4 || Math.abs(z) <= 4) {
              if (fy === 1 && (Math.abs(x) === 4 || Math.abs(z) === 4)) {
                 baseBlock = ItemType.WOOD; // fence / railing
              } else if (fy > 1 && fy <= 4 && (Math.abs(x) === 4 || Math.abs(z) === 4)) {
                 // Arches over the river
                 const ringProg = Math.abs(x) <= 4 ? z : x;
                 if (Math.abs(ringProg) === 48 && fy > 1) baseBlock = ItemType.WOOD;
              } else if (fy === 5 && dist >= 47 && dist <= 49) {
                 baseBlock = ItemType.WOOD; // bridge roof
              }
          } else {
              // Floating tubes in the river
              // space them every ~10 units along the circle
              const riverAngle = Math.atan2(z, x);
              const totalAngle = riverAngle >= 0 ? riverAngle : riverAngle + Math.PI * 2;
              const tubeSlots = 24; // 24 tubes total
              const tubeIndex = Math.floor((totalAngle / (Math.PI * 2)) * tubeSlots);
              const tubeObjAngle = (tubeIndex + 0.5) * ((Math.PI * 2) / tubeSlots);
              const tubeCx = Math.round(Math.cos(tubeObjAngle) * 48.5);
              const tubeCz = Math.round(Math.sin(tubeObjAngle) * 48.5);
              
              if (fy === 0 && Math.abs(x - tubeCx) <= 1 && Math.abs(z - tubeCz) <= 1) {
                 if (Math.abs(x - tubeCx) === 1 || Math.abs(z - tubeCz) === 1) {
                     // Make it rainbow colored!
                     baseBlock = colors[tubeIndex % colors.length];
                 }
              }
          }
      }
      
      // 7. Floaties / Inflatables in the Pools
      if (fy === 0 && dist < 45 && dist > 10) {
          // Check if we are over water by looking at base partition and distance
          // Actually, we can just distribute floaties on a grid and check if we are in a pool zone
          if (inInnerPool) {
              const fGridX = Math.round(x / 8) * 8;
              const fGridZ = Math.round(z / 8) * 8;
              if (Math.abs(x - fGridX) <= 1 && Math.abs(z - fGridZ) <= 1) {
                  if (Math.abs(x - fGridX) + Math.abs(z - fGridZ) === 1) {
                      baseBlock = colors[Math.abs(fGridX + fGridZ) % colors.length];
                  }
              }
          }
      }
  }

  return baseBlock;
}

export function getSummerLabBlock(x: number, y: number, z: number): number {
  if (isWaterParkPhase()) {
      return getWaterParkBlock(x, y, z);
  }

  if (y < -20 || y > 100) return ItemType.AIR;

  
  const fy = Math.floor(y);
  
  let baseBlock: number = ItemType.AIR;

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

  if (baseBlock === ItemType.AIR && fy >= 0) {
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
