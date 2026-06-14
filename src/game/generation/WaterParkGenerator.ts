import { ItemType } from '../Inventory';

export function getWaterParkBlock(worldX: number, worldY: number, worldZ: number): number {
  const localY = Math.floor(worldY);
  if (localY < -20 || localY > 100) return ItemType.AIR;
  
  let capturedBlock = ItemType.AIR;
  const dummyChunk = {
     setBlockFast: (cx: number, cy: number, cz: number, block: number) => {
         if (cy === localY - (-60)) capturedBlock = block;
     }
  };
  generateWaterParkColumn(dummyChunk, 0, 0, worldX, worldZ);
  return capturedBlock;
}

export function generateWaterParkColumn(chunk: any, x: number, z: number, worldX: number, worldZ: number): void {
  const distSq = worldX * worldX + worldZ * worldZ;
  const dist = Math.sqrt(distSq);
  
  if (dist > 60) return;

  const cx = Math.floor(worldX / 5);
  const cz = Math.floor(worldZ / 5);
  
  const colors = [
      ItemType.CONCRETE_RAINBOW_RED,
      ItemType.CONCRETE_RAINBOW_ORANGE,
      ItemType.CONCRETE_RAINBOW_YELLOW,
      ItemType.CONCRETE_RAINBOW_GREEN,
      ItemType.CONCRETE_RAINBOW_BLUE,
      ItemType.CONCRETE_RAINBOW_INDIGO,
      ItemType.CONCRETE_RAINBOW_VIOLET,
      ItemType.CONCRETE_WHITE
  ];
  const partition = Math.abs(cx + cz) % colors.length;
  
  const inInnerPool = (
      (Math.abs(worldX - 25) <= 13 && Math.abs(worldZ - 25) <= 9) || 
      (Math.abs(worldX + 25) <= 9 && Math.abs(worldZ - 25) <= 9) || 
      (Math.abs(worldX + 25) <= 14 && Math.abs(worldZ + 25) <= 14) || 
      (Math.abs(worldX - 25) <= 9 && Math.abs(worldZ + 25) <= 13) 
  );
  const inLazyRiver = dist >= 45 && dist <= 52 && (Math.abs(worldX) > 4 && Math.abs(worldZ) > 4);
  const isInsideWater = inInnerPool || inLazyRiver;
  const isBridge = Math.abs(worldX) <= 4 || Math.abs(worldZ) <= 4;
  const isOuterWall = dist > 58;

  for (let fy = -3; fy <= 40; fy++) {
    const worldY = fy - (-60);
    if (worldY < 0 || worldY >= 384) continue;

    let baseBlock: number = ItemType.AIR;
    // Base Foundations and Pools
    if (fy <= 0 && fy >= -5) {
      if (fy === 0) {
          if (Math.abs(worldX) <= 4 || Math.abs(worldZ) <= 4) {
              baseBlock = colors[Math.abs(worldX + worldZ) % colors.length]; // Main walkways
          } else if (dist > 8 && dist < 45) {
              // The main zones are partitioned by color
              baseBlock = colors[partition];
              
              // Add some small grass/wood patches
              if (Math.abs(worldX + worldZ) % 15 === 0 && Math.abs(worldX - worldZ) % 15 === 0) {
                 baseBlock = ItemType.WOOD;
              }
          }

          // Lazy River: R=45 to 52
          const isBridge = Math.abs(worldX) <= 4 || Math.abs(worldZ) <= 4;
          if (dist >= 45 && dist <= 52) {
              if (!isBridge) {
                  baseBlock = ItemType.AIR; // River surface
              } else {
                  baseBlock = colors[partition]; // Bridge
              }
          } else if (dist >= 44 && dist <= 53) {
              if (dist < 45 || dist > 52) baseBlock = colors[(Math.abs(worldX) + Math.abs(worldZ)) % colors.length]; // Borders
          }

          // Pools layout
          const isPool = (px: number, pz: number, dx: number, dz: number) => Math.abs(worldX - px) <= dx && Math.abs(worldZ - pz) <= dz;
          const isPoolInner = (px: number, pz: number, dx: number, dz: number) => Math.abs(worldX - px) <= dx - 1 && Math.abs(worldZ - pz) <= dz - 1;

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
          
          if (Math.abs(worldX) <= 12 && Math.abs(worldZ) <= 12) {
              baseBlock = colors[(Math.abs(worldX) + Math.abs(worldZ)) % colors.length]; // Colorful center plaza
          }
      } else if (fy < 0) {
          // Bottom fills: continue the partitioned colors down
          baseBlock = colors[partition];

          // Lazy River water
          if (dist >= 45 && dist <= 52 && fy >= -2) {
              baseBlock = ItemType.WATER;
          }

          const checkPoolWater = (px: number, pz: number, dx: number, dz: number) => Math.abs(worldX - px) <= dx - 1 && Math.abs(worldZ - pz) <= dz - 1;
          
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
              const progX = worldX - 15; // 0 to 20
              if (fy >= -3 + Math.floor(progX / 6)) baseBlock = ItemType.WATER;
              else baseBlock = colors[5];
          }
      }
  }

  // Structures (y >= 0)
  if (baseBlock === ItemType.AIR && fy >= 0) {
      // 1. Cabanas (Leisure Pool Q1: around 25, 25)
      const isCabana = (cx: number, cz: number) => !isInsideWater && Math.abs(worldX - cx) <= 2 && Math.abs(worldZ - cz) <= 2;
      const cabanas = [[15, 39], [25, 39], [35, 39], [42, 25], [42, 15]];
      for (const [cx, cz] of cabanas) {
          if (isCabana(cx, cz) && fy <= 4) {
               if (fy === 4) {
                   baseBlock = colors[(cx + cz) % colors.length]; // specific color roof
               } else if (Math.abs(worldX - cx) === 2 && Math.abs(worldZ - cz) === 2) {
                   baseBlock = ItemType.WOOD; // Support posts
               } else if (fy === 1 && Math.abs(worldX - cx) <= 1 && Math.abs(worldZ - cz) <= 1) {
                   baseBlock = ItemType.SLAB_WOOD; // Floor/Seat
               }
          }
      }

      // 2. Lifeguard Stands
      const stands = [[10, 25], [-10, 25], [25, -10], [-9, -26]];
      if (!isInsideWater) {
          for (const [sx, sz] of stands) {
              if (Math.abs(worldX - sx) <= 1 && Math.abs(worldZ - sz) <= 1 && fy <= 5) {
                  if (fy <= 3) {
                      if (Math.abs(worldX - sx) === 1 && Math.abs(worldZ - sz) === 1) baseBlock = ItemType.PLANKS; // stilts
                      if (fy === 3 && worldX === sx && worldZ === sz) baseBlock = ItemType.PLANKS;
                  } else if (fy === 4) {
                      if (worldX === sx && worldZ === sz) baseBlock = colors[0]; // seat
                      else if (Math.abs(worldX - sx) === 1 || Math.abs(worldZ - sz) === 1) baseBlock = ItemType.PLANKS; // railing
                  } else if (fy === 5 && worldX === sx && worldZ === sz) {
                      baseBlock = colors[0]; // Top umbrella
                  }
              }
          }
      }

      // 3. Lockers & Changing Rooms (Near entrance/lazy river edge)
      if (dist >= 53 && dist <= 58) {
          // Lockers structure
          if (worldX >= -40 && worldX <= -20 && worldZ >= 53 && worldZ <= 56) {
              if (fy <= 4) {
                  if (fy === 4) baseBlock = colors[3]; // roof
                  else if (Math.abs(worldX) % 2 === 0 && fy <= 2 && worldZ === 54) baseBlock = colors[(Math.abs(worldX)) % colors.length]; // colorful locker doors
                  else baseBlock = colors[(Math.abs(worldX)+fy) % colors.length]; // walls
              }
          }
          // Changing Rooms
          if (worldX >= 20 && worldX <= 40 && worldZ >= 53 && worldZ <= 56) {
               if (fy <= 4) {
                   if (fy === 4) baseBlock = ItemType.WOOD; // roof
                   else if (worldZ === 53 && worldX % 4 !== 0 && fy <= 2) baseBlock = ItemType.AIR; // doors
                   else baseBlock = colors[Math.abs(Math.floor(worldX / 4)) % colors.length]; // divided colorful rooms
               }
          }
          // Rainbow Snack & Ice Cream Stand
          if (worldX >= 53 && worldX <= 56 && worldZ >= -10 && worldZ <= 10) {
               if (fy <= 4) {
                   if (fy === 4) baseBlock = colors[Math.abs(worldZ) % colors.length]; // Rainbow striped awning
                   else if (worldX === 53 && fy === 1) baseBlock = colors[1]; // counter base
                   else if (worldX === 53 && fy === 2 && worldZ % 3 === 0) baseBlock = ItemType.WOOD; // awning posts
                   else if (worldX === 54 && fy === 2 && worldZ % 2 === 0) baseBlock = colors[(Math.abs(worldZ) + 10) % colors.length]; // ice cream flavors display
                   else if (worldX > 53) baseBlock = colors[0]; // back kitchen walls
               }
          }
      }

      // 4. Ticket Booths (Entrance)
      if (Math.abs(worldX) <= 8 && worldZ >= 53 && worldZ <= 58 && fy <= 5) {
           if (worldX >= -6 && worldX <= -2 || worldX >= 2 && worldX <= 6) {
               if (fy === 5) baseBlock = colors[Math.abs(worldX) % colors.length];
               else if (fy === 2 && worldZ === 53 && Math.abs(worldX) !== 4) baseBlock = ItemType.GLASS; // windows
               else baseBlock = colors[(Math.abs(worldX)+fy) % colors.length];
           }
      }

      // 5. Diving Boards (Q2: Diving Pool edge is at worldX = -15, worldZ = 15..35)
      if (worldX >= -16 && worldX <= -10 && worldZ >= 22 && worldZ <= 26 && fy <= 10) {
          // 3m board
          if (worldX === -12 && worldZ === 25 && fy <= 3) baseBlock = colors[3]; // ladder/support
          if (worldX >= -16 && worldX <= -12 && worldZ === 25 && fy === 3) baseBlock = ItemType.SLAB_WOOD; // board extends to -16 (inside pool)
          // 5m board
          if (worldX === -12 && worldZ === 22 && fy <= 5) baseBlock = colors[4];
          if (worldX >= -16 && worldX <= -12 && worldZ === 22 && fy === 5) baseBlock = ItemType.SLAB_WOOD;
          // 10m platform tower
          if (worldX >= -12 && worldX <= -10 && worldZ >= 23 && worldZ <= 26) {
              if (fy <= 10) {
                  if (Math.abs(worldX) === 10 || Math.abs(worldX) === 12) baseBlock = colors[5]; // legs
                  if (fy === 10) baseBlock = colors[2]; // platform
                  if (fy < 10 && worldX === -11 && worldZ === 26) baseBlock = ItemType.WOOD; // ladder
              }
          }
          if (worldX >= -16 && worldX <= -12 && worldZ >= 24 && worldZ <= 25 && fy === 10) baseBlock = ItemType.SLAB_WOOD; // jumping off 10m
      }

      // 6. Central Hub Tower (more detailed)
      if (Math.abs(worldX) <= 8 && Math.abs(worldZ) <= 8) {
          if (fy <= 30) {
              // Structural pillars
              if (Math.abs(worldX) === 8 && Math.abs(worldZ) === 8) baseBlock = colors[fy % colors.length];
              // Glass walls
              else if (Math.abs(worldX) === 8 || Math.abs(worldZ) === 8) {
                  if (fy % 5 !== 0) {
                      if ((worldX + worldZ) % 3 === 0) baseBlock = ItemType.GLASS;
                      else baseBlock = colors[(Math.abs(worldX) + Math.abs(worldZ)) % colors.length];
                  } else {
                      baseBlock = colors[(fy+1) % colors.length]; // bands
                  }
              }
              // Intermediary floors
              else if (fy % 10 === 0) {
                  baseBlock = ItemType.PLANKS; // tower floors
              }
              // Spiral staircase
              else if (Math.abs(worldX) <= 7 && Math.abs(worldZ) <= 7) {
                  const sAngle = Math.atan2(worldZ, worldX);
                  const normSAngle = (sAngle + Math.PI) / (Math.PI * 2);
                  const heightMod = (fy % 10) / 10;
                  if (Math.abs(normSAngle - heightMod) < 0.2) {
                      baseBlock = ItemType.WOOD;
                  } else if (Math.abs(worldX) <= 2 && Math.abs(worldZ) <= 2) {
                      baseBlock = colors[2]; // central core
                  }
              }
          } else if (fy <= 38) {
              // Impressive Spire Roof (Rainbow colored)
              const roofR = Math.max(0, 8 - (fy - 30));
              if (Math.abs(worldX) <= roofR && Math.abs(worldZ) <= roofR) {
                 baseBlock = colors[(fy - 30) % colors.length];
              }
          } else if (fy <= 45 && Math.abs(worldX) <= 1 && Math.abs(worldZ) <= 1) {
              baseBlock = colors[4]; // antenna
          }
      }

      // 7. Elaborate Slides
      
      // 1. Classic Spiral Tube Slide (starts at y=30, spirals to Leisure Pool)
      const slide1Angle = (fy * 0.25) % (Math.PI * 2);
      const slide1R = 9 + (30 - fy) * 0.5; // Moves outward
      const s1x = Math.cos(slide1Angle) * slide1R;
      const s1z = Math.sin(slide1Angle) * slide1R;
      
      const distToS1Sq = (worldX - s1x)**2 + (worldZ - s1z)**2;
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
      if (worldX > 8 && worldX < 25 && worldZ < -8 && worldZ > -25) {
          const slideLen = 25 - 8;
          const progX = worldX - 8;
          const progZ = -8 - worldZ; // positive
          
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
      if (worldX < -8 && worldX > -25 && worldZ < -8 && worldZ > -25) {
          const progX = -8 - worldX;
          const progZ = -8 - worldZ;
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
      if (fy >= 0 && fy <= 15 && worldX > -35 && worldX < -15 && worldZ > -35 && worldZ < -15) {
          // Play structure
          if (Math.abs(worldX + 25) <= 4 && Math.abs(worldZ + 25) <= 4) {
             if (fy <= 4) {
                if (Math.abs(worldX + 25) === 4 || Math.abs(worldZ + 25) === 4) {
                   if ((worldX + worldZ + fy) % 2 === 0) baseBlock = colors[Math.abs(worldX + worldZ) % colors.length]; // Rainbow nets
                   else if (fy > 0) baseBlock = ItemType.AIR; // safety net holes
                } else if (fy === 4) baseBlock = ItemType.PLANKS; // floor 2
             } else if (fy <= 9) {
                 if (Math.abs(worldX + 25) <= 2 && Math.abs(worldZ + 25) <= 2) {
                     if (Math.abs(worldX + 25) === 2 || Math.abs(worldZ + 25) === 2) {
                         if ((worldX + worldZ + fy) % 2 === 0) baseBlock = colors[fy % colors.length]; // upper tower walls
                     } else if (fy === 9) {
                         baseBlock = ItemType.PLANKS; // bucket platform
                     }
                 }
                 if (fy === 5 && Math.abs(worldX + 25) === 0 && Math.abs(worldZ + 25) === 0) baseBlock = ItemType.WATER; // falling water
             } else if (fy >= 10 && fy <= 12) {
                 // The Giant Rainbow Tipping Bucket!
                 if (Math.abs(worldX + 25) <= 2 && Math.abs(worldZ + 25) <= 2) {
                     if (fy === 10) baseBlock = colors[0]; // bottom of bucket
                     else if (Math.abs(worldX + 25) === 2 || Math.abs(worldZ + 25) === 2) baseBlock = colors[1]; // sides
                     else baseBlock = ItemType.WATER; // filled with water
                 }
             } else if (fy === 13) {
                // water spilling over
                if (Math.abs(worldX + 25) <= 1 && Math.abs(worldZ + 25) <= 1 && (worldX + worldZ) % 2 === 0) baseBlock = ItemType.WATER;
             }
          }
      }
      
      // 5. Sun Loungers and Umbrellas
      if (!isInsideWater && dist >= 35 && dist <= 43) {
          // Every 4 units place a lounger or umbrella
          const gridX = Math.round(worldX / 4) * 4;
          const gridZ = Math.round(worldZ / 4) * 4;
          const isGrid = Math.abs(worldX - gridX) <= 1 && Math.abs(worldZ - gridZ) <= 1;
          
          if (isGrid && dist >= 37) {
             const uAngle = Math.atan2(gridZ, gridX);
             const normUAngle = uAngle >= 0 ? uAngle : uAngle + Math.PI * 2;
             const pC = colors[Math.floor((normUAngle / (Math.PI * 2)) * colors.length) % colors.length];
             
             if (Math.abs(worldX - gridX) === 0 && Math.abs(worldZ - gridZ) === 0) {
                 if (fy > 0 && fy <= 3) baseBlock = ItemType.WOOD; // pole
                 else if (fy === 4) baseBlock = pC; // umbrella center
             } else if (fy === 4 && Math.abs(worldX - gridX) <= 1 && Math.abs(worldZ - gridZ) <= 1) {
                 if (Math.abs(worldX - gridX) + Math.abs(worldZ - gridZ) <= 1 || (Math.abs(worldX - gridX) === 1 && Math.abs(worldZ - gridZ) === 1 && (worldX+worldZ)%2===0)) {
                     baseBlock = pC; // umbrella canopy
                 } else baseBlock = ItemType.AIR;
             } else if (fy === 1 && Math.abs(worldX - gridX) === 1 && Math.abs(worldZ - gridZ) === 1) {
                 baseBlock = ItemType.SLAB_WOOD; // loungers under umbrella
             }
          }
      }
      
      // 6. Lazy River arch bridges, railings, and floating tubes
      if (dist >= 45 && dist <= 52) {
          if (Math.abs(worldX) <= 4 || Math.abs(worldZ) <= 4) {
              if (fy === 1 && (Math.abs(worldX) === 4 || Math.abs(worldZ) === 4)) {
                 baseBlock = ItemType.WOOD; // fence / railing
              } else if (fy > 1 && fy <= 4 && (Math.abs(worldX) === 4 || Math.abs(worldZ) === 4)) {
                 // Arches over the river
                 const ringProg = Math.abs(worldX) <= 4 ? worldZ : worldX;
                 if (Math.abs(ringProg) === 48 && fy > 1) baseBlock = ItemType.WOOD;
              } else if (fy === 5 && dist >= 47 && dist <= 49) {
                 baseBlock = ItemType.WOOD; // bridge roof
              }
          } else {
              // Floating tubes in the river
              // space them every ~10 units along the circle
              const riverAngle = Math.atan2(worldZ, worldX);
              const totalAngle = riverAngle >= 0 ? riverAngle : riverAngle + Math.PI * 2;
              const tubeSlots = 24; // 24 tubes total
              const tubeIndex = Math.floor((totalAngle / (Math.PI * 2)) * tubeSlots);
              const tubeObjAngle = (tubeIndex + 0.5) * ((Math.PI * 2) / tubeSlots);
              const tubeCx = Math.round(Math.cos(tubeObjAngle) * 48.5);
              const tubeCz = Math.round(Math.sin(tubeObjAngle) * 48.5);
              
              if (fy === 0 && Math.abs(worldX - tubeCx) <= 1 && Math.abs(worldZ - tubeCz) <= 1) {
                 if (Math.abs(worldX - tubeCx) === 1 || Math.abs(worldZ - tubeCz) === 1) {
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
              const fGridX = Math.round(worldX / 8) * 8;
              const fGridZ = Math.round(worldZ / 8) * 8;
              if (Math.abs(worldX - fGridX) <= 1 && Math.abs(worldZ - fGridZ) <= 1) {
                  if (Math.abs(worldX - fGridX) + Math.abs(worldZ - fGridZ) === 1) {
                      baseBlock = colors[Math.abs(fGridX + fGridZ) % colors.length];
                  }
              }
          }
      }

      if (baseBlock !== ItemType.AIR) {
          chunk.setBlockFast(x, worldY, z, baseBlock);
      }
    }
  }
}
