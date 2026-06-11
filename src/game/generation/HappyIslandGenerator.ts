import { ItemType } from '../Inventory';
import { noise2D } from '../TerrainGenerator';
import { Chunk, CHUNK_HEIGHT, WORLD_Y_OFFSET } from '../Chunk';

const SEA_LEVEL = 2;
const ISLAND_RADIUS = 35;

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
    let block = ItemType.AIR;

    if (dist < ISLAND_RADIUS + 25 && fy <= blockTerrainY) {
      if (fy === blockTerrainY) {
        if (fy <= SEA_LEVEL + 1) block = ItemType.SAND;
        else block = surfaceNoise > 0.7 ? ItemType.PODZOL : ItemType.GRASS;
      } else if (fy > blockTerrainY - 3) {
        if (fy <= SEA_LEVEL + 1) block = ItemType.SAND;
        else block = ItemType.DIRT;
      } else if (fy > -15) {
        block = ItemType.STONE;
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
      if (dist >= 60 && dist <= 63 && fy >= -20 && fy <= 40) block = ItemType.BARRIER;
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

  if (dist < ISLAND_RADIUS + 25 && fy <= blockTerrainY) {
    if (fy === blockTerrainY) {
      if (fy <= SEA_LEVEL + 1) return ItemType.SAND;
      const surfaceNoise = noise2D(x * 0.2, z * 0.2);
      return surfaceNoise > 0.7 ? ItemType.PODZOL : ItemType.GRASS;
    } else if (fy > blockTerrainY - 3) {
      if (fy <= SEA_LEVEL + 1) return ItemType.SAND;
      return ItemType.DIRT;
    } else if (fy > -15) {
      return ItemType.STONE;
    } else {
      return ItemType.SAND;
    }
  }

  if (dist >= 60 && dist <= 63 && fy >= -20 && fy <= 40) return ItemType.BARRIER;
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
