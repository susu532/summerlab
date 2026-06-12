import { ItemType } from '../Inventory';
import { noise2D, noise3D } from '../TerrainGenerator';
import { Chunk, CHUNK_HEIGHT, WORLD_Y_OFFSET } from '../Chunk';

const SEA_LEVEL = 2;
const ISLAND_RADIUS = 70;

function getVillageBlock(worldX: number, worldY: number, worldZ: number, defaultTerrainY: number): number | null {
  const houses = [
    { x: 10, z: 10, w: 7, d: 7, h: 5 },
    { x: -15, z: 5, w: 6, d: 8, h: 5 },
    { x: 5, z: -20, w: 9, d: 6, h: 6 },
    { x: -20, z: -20, w: 7, d: 7, h: 5 },
    { x: 15, z: -5, w: 5, d: 5, h: 5 }
  ];

  for (const house of houses) {
    const hx = house.x;
    const hz = house.z;
    if (worldX >= hx && worldX < hx + house.w && worldZ >= hz && worldZ < hz + house.d) {
      const centerX = hx + house.w / 2;
      const centerZ = hz + house.d / 2;
      const cDist = Math.sqrt(centerX*centerX + centerZ*centerZ);
      const cY = Math.floor(SEA_LEVEL + Math.max(0, ISLAND_RADIUS - cDist) * 0.15 + noise2D(centerX * 0.05, centerZ * 0.05) * 4);
      
      const houseBaseY = cY;

      if (worldY < houseBaseY) {
         if (worldX === hx || worldX === hx + house.w - 1 || worldZ === hz || worldZ === hz + house.d - 1) return ItemType.COBBLESTONE;
         return ItemType.DIRT;
      }
      if (worldY === houseBaseY) return ItemType.PLANKS;

      if (worldY > houseBaseY && worldY < houseBaseY + house.h) {
        if (worldX > hx && worldX < hx + house.w - 1 && worldZ > hz && worldZ < hz + house.d - 1) {
          return ItemType.AIR;
        }
        if (worldX === hx + Math.floor(house.w/2) && worldZ === hz && worldY <= houseBaseY + 2) {
          return ItemType.AIR;
        }
        if (worldY === houseBaseY + 2 && (worldX === hx + 1 || worldX === hx + house.w - 2 || worldZ === hz + 1 || worldZ === hz + house.d - 2)) {
          return ItemType.GLASS;
        }
        if ((worldX === hx || worldX === hx + house.w - 1) && (worldZ === hz || worldZ === hz + house.d - 1)) {
          return ItemType.WOOD;
        }
        return ItemType.PLANKS;
      }
      
      if (worldY === houseBaseY + house.h) {
        return ItemType.STONE_BRICKS;
      }
    }
  }

  if (worldY === defaultTerrainY && Math.abs(worldX) < 30 && Math.abs(worldZ) < 30) {
     const pNoise = noise2D(worldX * 0.1, worldZ * 0.1);
     if (pNoise > 0.3) return ItemType.DIRT_PATH; 
  }

  return null;
}

export function generateHappyIslandColumn(
  chunk: Chunk,
  x: number,
  z: number,
  worldX: number,
  worldZ: number
) {
  const distSq = worldX * worldX + worldZ * worldZ;
  const dist = Math.sqrt(distSq);

  const islandHeight =
    SEA_LEVEL + Math.max(0, ISLAND_RADIUS - dist) * 0.15 + noise2D(worldX * 0.05, worldZ * 0.05) * 4;

  const islandBaseSlope = SEA_LEVEL - Math.max(0, dist - ISLAND_RADIUS) * 0.5 + noise2D(worldX * 0.05, worldZ * 0.05) * 4;
  const terrainHeightBase = dist < ISLAND_RADIUS ? islandHeight : islandBaseSlope;
  const finalTerrainHeight = Math.max(-15, terrainHeightBase);
  const blockTerrainY = Math.floor(finalTerrainHeight);

  const surfaceNoise = noise2D(worldX * 0.2, worldZ * 0.2);

  const localX = ((worldX % 5) + 5) % 5;
  const localZ = ((worldZ % 5) + 5) % 5;
  const cellX = Math.floor(worldX / 5);
  const cellZ = Math.floor(worldZ / 5);

  const treeChance = noise2D(cellX * 13.37, cellZ * 13.37);
  let treeHeight = 0;
  let treeBaseY = 0;
  if (dist < ISLAND_RADIUS - 5 && treeChance > 0.7) {
    treeHeight = 5 + Math.floor((treeChance * 10) % 3);
    const cellDist = Math.sqrt(
      (cellX * 5 + 2) * (cellX * 5 + 2) + (cellZ * 5 + 2) * (cellZ * 5 + 2)
    );
    treeBaseY = Math.floor(
      SEA_LEVEL +
        Math.max(0, ISLAND_RADIUS - cellDist) * 0.15 +
        noise2D((cellX * 5 + 2) * 0.05, (cellZ * 5 + 2) * 0.05) * 4
    );
  }

  const detailNoise = noise2D(worldX * 1.5, worldZ * 1.5);

  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    const worldY = y + WORLD_Y_OFFSET;
    if (worldY < -20 || worldY > 100) continue;

    const fy = Math.floor(worldY);
    
    // Check village first
    const vBlock = getVillageBlock(worldX, fy, worldZ, blockTerrainY);
    if (vBlock !== null) {
        chunk.setBlockFast(x, y, z, vBlock);
        continue;
    }

    let block = ItemType.AIR;

    if (dist < ISLAND_RADIUS + 25 && fy <= blockTerrainY) {
      if (fy === blockTerrainY) {
        if (fy <= SEA_LEVEL + 1) block = ItemType.SAND;
        else block = surfaceNoise > 0.7 ? ItemType.PODZOL : ItemType.GRASS;
      } else if (fy > blockTerrainY - 3) {
        if (fy <= SEA_LEVEL + 1) block = ItemType.SAND;
        else block = ItemType.DIRT;
      } else if (fy > -15) {
        const oreNoiseVal = noise3D(worldX * 0.1, fy * 0.1, worldZ * 0.1);
        if (oreNoiseVal > 0.85) block = ItemType.DIAMOND_ORE;
        else if (oreNoiseVal > 0.75) block = ItemType.GOLD_ORE;
        else if (oreNoiseVal > 0.65) block = ItemType.EMERALD_ORE;
        else if (oreNoiseVal > 0.55) block = ItemType.REDSTONE_ORE;
        else if (oreNoiseVal > 0.45) block = ItemType.LAPIS_ORE;
        else if (oreNoiseVal > 0.35) block = ItemType.IRON_ORE;
        else if (oreNoiseVal > 0.25) block = ItemType.COAL_ORE;
        else if (oreNoiseVal > 0.15) block = ItemType.COPPER_ORE;
        else block = ItemType.STONE;
      } else {
        block = ItemType.SAND;
      }
    } else if (dist < ISLAND_RADIUS + 5 && fy > blockTerrainY && fy > SEA_LEVEL) {
      if (dist < ISLAND_RADIUS - 5 && treeChance > 0.7) {
        if (localX === 2 && localZ === 2) {
          if (fy > treeBaseY && fy <= treeBaseY + treeHeight) {
            block = ItemType.WOOD;
          }
        }
        if (block === ItemType.AIR && fy >= treeBaseY + treeHeight - 2 && fy <= treeBaseY + treeHeight + 1) {
          const isTop = fy === treeBaseY + treeHeight + 1;
          const radius = isTop ? 1 : 2;
          if (Math.abs(localX - 2) <= radius && Math.abs(localZ - 2) <= radius) {
            if (!(Math.abs(localX - 2) === radius && Math.abs(localZ - 2) === radius && treeChance < 0.9)) {
              if (localX !== 2 || localZ !== 2 || fy > treeBaseY + treeHeight) {
                block = ItemType.LEAVES;
              }
            }
          }
        }
      }

      if (
        block === ItemType.AIR &&
        fy === blockTerrainY + 1 &&
        dist < ISLAND_RADIUS - 5 &&
        treeChance <= 0.7
      ) {
        if (detailNoise > 0.7) block = ItemType.FLOWER_RED;
        else if (detailNoise < -0.7) block = ItemType.FLOWER_YELLOW;
        else if (detailNoise > 0.4 && detailNoise < 0.5) block = ItemType.TALL_GRASS;
      }
    }

    if (block === ItemType.AIR) {
      if (dist >= 110 && dist <= 113 && fy >= -20 && fy <= 40) block = ItemType.BARRIER;
      else if (fy >= -20 && fy <= -15) block = ItemType.SAND;
      else if (fy <= SEA_LEVEL) block = ItemType.WATER;
    }

    if (block !== ItemType.AIR) {
      chunk.setBlockFast(x, y, z, block);
    }
  }
}

export function getHappyIslandBlock(x: number, y: number, z: number): number {
  if (y < -20 || y > 100) return ItemType.AIR;
  
  const distSq = x * x + z * z;
  const dist = Math.sqrt(distSq);
  const fy = Math.floor(y);

  const islandHeight =
    SEA_LEVEL + Math.max(0, ISLAND_RADIUS - dist) * 0.15 + noise2D(x * 0.05, z * 0.05) * 4;

  const islandBaseSlope = SEA_LEVEL - Math.max(0, dist - ISLAND_RADIUS) * 0.5 + noise2D(x * 0.05, z * 0.05) * 4;
  const terrainHeightBase = dist < ISLAND_RADIUS ? islandHeight : islandBaseSlope;
  const finalTerrainHeight = Math.max(-15, terrainHeightBase);
  const blockTerrainY = Math.floor(finalTerrainHeight);

  const vBlock = getVillageBlock(x, fy, z, blockTerrainY);
  if (vBlock !== null) return vBlock;

  if (dist < ISLAND_RADIUS + 25 && fy <= blockTerrainY) {
    if (fy === blockTerrainY) {
      if (fy <= SEA_LEVEL + 1) return ItemType.SAND;
      const surfaceNoise = noise2D(x * 0.2, z * 0.2);
      return surfaceNoise > 0.7 ? ItemType.PODZOL : ItemType.GRASS;
    } else if (fy > blockTerrainY - 3) {
      if (fy <= SEA_LEVEL + 1) return ItemType.SAND;
      return ItemType.DIRT;
    } else if (fy > -15) {
      const oreNoiseVal = noise3D(x * 0.1, fy * 0.1, z * 0.1);
      if (oreNoiseVal > 0.85) return ItemType.DIAMOND_ORE;
      if (oreNoiseVal > 0.75) return ItemType.GOLD_ORE;
      if (oreNoiseVal > 0.65) return ItemType.EMERALD_ORE;
      if (oreNoiseVal > 0.55) return ItemType.REDSTONE_ORE;
      if (oreNoiseVal > 0.45) return ItemType.LAPIS_ORE;
      if (oreNoiseVal > 0.35) return ItemType.IRON_ORE;
      if (oreNoiseVal > 0.25) return ItemType.COAL_ORE;
      if (oreNoiseVal > 0.15) return ItemType.COPPER_ORE;
      return ItemType.STONE;
    } else {
      return ItemType.SAND;
    }
  }

  if (dist >= 110 && dist <= 113 && fy >= -20 && fy <= 40) return ItemType.BARRIER;
  if (fy >= -20 && fy <= -15) return ItemType.SAND;
  if (fy <= SEA_LEVEL) return ItemType.WATER;

  if (fy > blockTerrainY && fy > SEA_LEVEL && dist < ISLAND_RADIUS + 5) {
    const localX = ((x % 5) + 5) % 5;
    const localZ = ((z % 5) + 5) % 5;
    const cellX = Math.floor(x / 5);
    const cellZ = Math.floor(z / 5);

    const treeChance = noise2D(cellX * 13.37, cellZ * 13.37);
    if (dist < ISLAND_RADIUS - 5 && treeChance > 0.7) {
      let treeHeight = 5 + Math.floor((treeChance * 10) % 3);
      const cellDist = Math.sqrt(
        (cellX * 5 + 2) * (cellX * 5 + 2) + (cellZ * 5 + 2) * (cellZ * 5 + 2)
      );
      let treeBaseY = Math.floor(
        SEA_LEVEL +
          Math.max(0, ISLAND_RADIUS - cellDist) * 0.15 +
          noise2D((cellX * 5 + 2) * 0.05, (cellZ * 5 + 2) * 0.05) * 4
      );

      if (localX === 2 && localZ === 2) {
        if (fy > treeBaseY && fy <= treeBaseY + treeHeight) {
          return ItemType.WOOD;
        }
      }
      if (fy >= treeBaseY + treeHeight - 2 && fy <= treeBaseY + treeHeight + 1) {
        const isTop = fy === treeBaseY + treeHeight + 1;
        const radius = isTop ? 1 : 2;
        if (Math.abs(localX - 2) <= radius && Math.abs(localZ - 2) <= radius) {
          if (!(Math.abs(localX - 2) === radius && Math.abs(localZ - 2) === radius && treeChance < 0.9)) {
            if (localX !== 2 || localZ !== 2 || fy > treeBaseY + treeHeight) {
              return ItemType.LEAVES;
            }
          }
        }
      }
    }

    if (
      fy === blockTerrainY + 1 &&
      dist < ISLAND_RADIUS - 5 &&
      treeChance <= 0.7
    ) {
      const detailNoise = noise2D(x * 1.5, z * 1.5);
      if (detailNoise > 0.7) return ItemType.FLOWER_RED;
      else if (detailNoise < -0.7) return ItemType.FLOWER_YELLOW;
      else if (detailNoise > 0.4 && detailNoise < 0.5) return ItemType.TALL_GRASS;
    }
  }

  return ItemType.AIR;
}
