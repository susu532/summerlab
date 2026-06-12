import { ItemType } from '../Inventory';
import { noise2D } from '../TerrainGenerator';
import { Chunk, CHUNK_HEIGHT, WORLD_Y_OFFSET } from '../Chunk';

export function generateBackroomsColumn(
  chunk: Chunk,
  x: number,
  z: number,
  worldX: number,
  worldZ: number
) {
  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    const worldY = y + WORLD_Y_OFFSET;
    const block = getBackroomsBlock(worldX, worldY, worldZ);
    if (block !== ItemType.AIR) {
      chunk.setBlockFast(x, y, z, block);
    }
  }
}

export function getBackroomsBlock(worldX: number, worldY: number, worldZ: number): number {
  const y = Math.floor(worldY);
  
  const MAP_SIZE = 80; // 160x160 total size

  // Barrier floor to prevent falling out
  if (y === -1 && Math.abs(worldX) <= MAP_SIZE + 2 && Math.abs(worldZ) <= MAP_SIZE + 2) {
      return ItemType.BARRIER;
  }
  // Barrier ceiling to prevent climbing over
  if (y === 6 && Math.abs(worldX) <= MAP_SIZE + 2 && Math.abs(worldZ) <= MAP_SIZE + 2) {
      return ItemType.BARRIER;
  }

  // The Backrooms layout: 6-block height
  if (y < 0 || y > 5) return ItemType.AIR;

  // Outer bounds barrier
  if (Math.abs(worldX) > MAP_SIZE || Math.abs(worldZ) > MAP_SIZE) {
      if (Math.abs(worldX) <= MAP_SIZE + 2 && Math.abs(worldZ) <= MAP_SIZE + 2) {
          return ItemType.BARRIER;
      }
      return ItemType.AIR;
  }
  
  // Boundary walls
  if (Math.abs(worldX) === MAP_SIZE || Math.abs(worldZ) === MAP_SIZE) {
      if (y >= 0 && y <= 5) return ItemType.CONCRETE_YELLOW;
  }
  
  // The moist yellow carpet
  if (y === 0) return ItemType.WOOL_YELLOW;
  
  // The smooth fluorescent ceiling with irregular lighting
  if (y === 5) {
     const ix = ((Math.floor(worldX) % 8) + 8) % 8;
     const iz = ((Math.floor(worldZ) % 8) + 8) % 8;
     // Shifted light so it's not directly above pillars
     const isLight = (ix === 2) && (iz === 2);
     if (isLight) {
         // Some lights are broken/missing
         if (noise2D(Math.floor(worldX / 8), Math.floor(worldZ / 8)) > -0.2) {
             return ItemType.GLOWSTONE; // emits light, looks like a fluorescent light panel
         }
     }
     return ItemType.CONCRETE_YELLOW; // yellow ceiling tiles
  }
  
  // Walls
  const wx = Math.floor(worldX / 8);
  const wz = Math.floor(worldZ / 8);
  const ix = ((Math.floor(worldX) % 8) + 8) % 8;
  const iz = ((Math.floor(worldZ) % 8) + 8) % 8;
  
  let isWall = false;
  
  // Create an extensive maze using noise with wider corridors
  if (ix <= 1 && noise2D(wx * 2, wz * 2) > -0.2) isWall = true;
  if (iz <= 1 && noise2D(wx * 2 - 100, wz * 2) > -0.2) isWall = true;
  
  // Fill the corners of the grid
  if (ix <= 1 && iz <= 1) isWall = true;
  
  // Occasional thick pillars in the middle
  if (ix >= 4 && ix <= 5 && iz >= 4 && iz <= 5 && noise2D(wx * 3.5, wz * 3.5) > 0.4) isWall = true;
  
  // Make large rooms
  const roomNoise = noise2D(wx * 0.5, wz * 0.5);
  if (roomNoise > 0.3) {
      isWall = false; // large open areas
  }
  
  // Create organic chaotic blocks inside rooms, but keep scale appropriate
  if (noise2D(Math.floor(worldX * 0.4), Math.floor(worldZ * 0.4)) > 0.65) {
      isWall = true;
  }
  
  // Ensure the spawn and a significant cross-path is mostly clear
  if (Math.abs(worldX) <= 4 && Math.abs(worldZ) <= 4) {
      isWall = false; // clear spawn room
  }
  
  // Guarantee an exit corridor to prevent being enclosed at spawn
  if (Math.abs(worldX) <= 2 && Math.abs(worldZ) <= 15) {
      isWall = false;
  }
  if (Math.abs(worldZ) <= 2 && Math.abs(worldX) <= 15) {
      isWall = false;
  }
  
  if (isWall) {
      return ItemType.CONCRETE_YELLOW; // yellow mono-yellow wallpaper texture using procedural shading
  }
  
  return ItemType.AIR;
}
