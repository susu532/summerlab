import * as THREE from 'three';
import { Game } from './Game';
import { networkManager } from './NetworkManager';

function seededRandom(x: number, y: number, z: number, seed: number) {
    const qx = Math.round(x * 10);
    const qy = Math.round(y * 10);
    const qz = Math.round(z * 10);
    const dot = qx * 12.9898 + qy * 78.233 + qz * 37.719 + seed * 13.37;
    const sin = Math.sin(dot) * 43758.5453;
    return sin - Math.floor(sin);
}

export class ChocolateFluidSystem {

  game: Game;
  
  // Projectiles (air particles)
  maxProjectiles: number;
  projectileMesh!: THREE.InstancedMesh;
  projectilePositions: THREE.Vector3[] = [];
  projectileVelocities: THREE.Vector3[] = [];
  projectileLifetimes: number[] = [];
  projectileAges: number[] = [];
  projectileInitialScales: number[] = [];
  projectileColors: THREE.Color[] = [];
  projectileWriteIdx = 0;
  
  // Splats (painted decays)
  maxSplats: number;
  splatCount = 0;
  splatMesh!: THREE.InstancedMesh;
  squareSplatMesh!: THREE.InstancedMesh;
  splatDummy = new THREE.Object3D();
  
  splatUpdated = false;
  minSplatIdx = 0; // Will be set to maxSplats in constructor
  maxSplatIdx = -1;
  lastSplatEmitTime = 0;
  lastCleanEmitTime = 0;
  
  projectileUpdated = false;
  minProjIdx = 0; // Will be set to maxProjectiles in constructor
  maxProjIdx = -1;

  emitRequests: { origin: THREE.Vector3, dir: THREE.Vector3, isSpray: boolean, color: THREE.Color, velocity: THREE.Vector3, lastOrigin?: THREE.Vector3 }[] = [];

  splatGrid = new Map<string, { idx: number, timestamp: number, colorHex: number }>();
  splatKeys: string[] = [];

  
  emitOrigin = new THREE.Vector3();
  emitDir = new THREE.Vector3();
  lastEmitOrigin = new THREE.Vector3();
  lastEmitDir = new THREE.Vector3();
  emitActive = 0;
  currentPumpTime = 0;
  didEmitThisFrame = false;
  isSprayThisFrame = false;
  emitColor = new THREE.Color(0x3d1c04);
  
  pendingSplats: any[][] = [];
  pendingCleanSplats: string[] = [];

  constructor(game: Game) {
    this.game = game;
    const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    this.maxProjectiles = isMobile ? 1500 : 3000;
    this.maxSplats = isMobile ? 30000 : 200000;
    
    this.minProjIdx = this.maxProjectiles;
    this.minSplatIdx = this.maxSplats;

    this.initProjectiles();
    this.initSplats();
  }

  initProjectiles() {
    // 6-sided cylinder for streaming fluid look instead of bubbles
    const geo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 6);
    // Orient the cylinder along Y so that lookAt works perfectly when scaled
    // Align base to origin so it scales away from the nozzle, not backwards into it.
    geo.translate(0, 0.5, 0); 
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, // White base color for instanceColor tinting
      transparent: true,
      depthWrite: false, // Prevents z-fighting for translucent overlapped streams
    });
    
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float instanceAlpha;
        varying float vInstanceAlpha;
      ` + shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vInstanceAlpha = instanceAlpha;`
      );
      
      shader.fragmentShader = `
        varying float vInstanceAlpha;
      ` + shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        'vec4 diffuseColor = vec4( diffuse, opacity * vInstanceAlpha );'
      );
    };

    this.projectileMesh = new THREE.InstancedMesh(geo, mat, this.maxProjectiles);
    this.projectileMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.projectileMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.maxProjectiles * 3), 3);
    this.projectileMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    
    const alphaAttrib = new THREE.InstancedBufferAttribute(new Float32Array(this.maxProjectiles).fill(1.0), 1);
    alphaAttrib.setUsage(THREE.DynamicDrawUsage);
    this.projectileMesh.geometry.setAttribute('instanceAlpha', alphaAttrib);
    
    this.projectileMesh.frustumCulled = false;
    this.projectileMesh.renderOrder = 2; // rendered after splats
    
    // Hide them initially
    const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    const defaultColor = new THREE.Color(0x3d1c04);
    for (let i = 0; i < this.maxProjectiles; i++) {
      this.projectileMesh.setMatrixAt(i, hiddenMatrix);
      this.projectileMesh.setColorAt(i, defaultColor);
      this.projectilePositions.push(new THREE.Vector3());
      this.projectileVelocities.push(new THREE.Vector3());
      this.projectileLifetimes.push(0);
      this.projectileAges.push(0);
      this.projectileInitialScales.push(1.35);
      this.projectileColors.push(defaultColor.clone());
    }
    this.projectileMesh.instanceMatrix.needsUpdate = true;
    this.projectileMesh.instanceColor.needsUpdate = true;
    
    this.game.world.scene.add(this.projectileMesh);
  }

  initSplats() {
    // Generate a round texture procedurally via Canvas
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    
    const cx = 64, cy = 64;
    ctx.fillStyle = "white";
    ctx.beginPath();
    // Central blob
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    // Outer random drips
    for (let i=0; i<8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 25;
      const sr = 10 + Math.random() * 15;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.arc(x, y, sr, 0, Math.PI * 2);
    }
    ctx.fill();
    // Blur to soften
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'blur(4px)';
    ctx.drawImage(canvas, 0, 0);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = this.game.renderer.capabilities.getMaxAnisotropy();
    
    const geo = new THREE.PlaneGeometry(1.0, 1.0);
    // Move slightly forward so it sits on top of the block
    geo.translate(0, 0, 0.05); // more offset to avoid z-fighting

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, // White base color for instanceColor tinting
      map: tex,
      transparent: true,
      alphaTest: 0.1,    // Good for cheap shadows / overdraw filtering
      depthWrite: false, // Don't write to depth buffer to prevent z-fighting among overlapping splats
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -1.0,
    });
    
    const squareMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, // White base color for instanceColor tinting
      transparent: true,
      alphaTest: 0.1,    // Good for cheap shadows / overdraw filtering
      depthWrite: false, // Don't write to depth buffer to prevent z-fighting among overlapping splats
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -1.0,
    });
    
    this.splatMesh = new THREE.InstancedMesh(geo, mat, this.maxSplats);
    this.splatMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.splatMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.maxSplats * 3), 3);
    this.splatMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.splatMesh.frustumCulled = false;
    this.splatMesh.renderOrder = 1;

    this.squareSplatMesh = new THREE.InstancedMesh(geo, squareMat, this.maxSplats);
    this.squareSplatMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.squareSplatMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.maxSplats * 3), 3);
    this.squareSplatMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.squareSplatMesh.frustumCulled = false;
    this.squareSplatMesh.renderOrder = 1;
    
    this.splatKeys = new Array<string>(this.maxSplats).fill('');
    
    const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    const defaultColor = new THREE.Color(0x3d1c04);
    for (let i = 0; i < this.maxSplats; i++) {
        this.splatMesh.setMatrixAt(i, hiddenMatrix);
        this.splatMesh.setColorAt(i, defaultColor);
        this.squareSplatMesh.setMatrixAt(i, hiddenMatrix);
        this.squareSplatMesh.setColorAt(i, defaultColor);
    }
    this.splatMesh.instanceMatrix.needsUpdate = true;
    this.splatMesh.instanceColor.needsUpdate = true;
    this.squareSplatMesh.instanceMatrix.needsUpdate = true;
    this.squareSplatMesh.instanceColor.needsUpdate = true;
    
    this.game.world.scene.add(this.splatMesh);
    this.game.world.scene.add(this.squareSplatMesh);
  }

  update(delta: number) {
    if (delta > 0.1) delta = 0.1; // clamp delta to prevent huge jumps

    // Manage pump duration timing for thickness
    if (this.emitRequests.length > 0) {
      this.currentPumpTime += delta;
    } else {
      this.currentPumpTime = Math.max(0, this.currentPumpTime - delta * 2.0);
    }
    
    // Calculate current thickness based on how long we've been pumping
    const pumpAlpha = Math.min(1.0, this.currentPumpTime / 1.2);

    // 1. Process all active emitters from this frame
    const spawnRate = 1200; // reduced spawn rate to avoid overwriting 40,000 max splats instantly
    
    for (const req of this.emitRequests) {
      const lastOrigin = req.lastOrigin || req.origin;
      const originSeedX = (lastOrigin.x + req.origin.x) * 0.5;
      const originSeedY = (lastOrigin.y + req.origin.y) * 0.5;
      const originSeedZ = (lastOrigin.z + req.origin.z) * 0.5;
      
      const toSpawnRand = seededRandom(originSeedX, originSeedY, originSeedZ, 0);
      const toSpawn = Math.floor(spawnRate * delta) + (toSpawnRand < ((spawnRate * delta) % 1) ? 1 : 0);
      
      for (let i = 0; i < toSpawn; i++) {
        // Interpolate to create a continuous unbroken line across frames
        const t = toSpawn > 1 ? i / (toSpawn - 1) : 1; 
        const interpOrigin = new THREE.Vector3().lerpVectors(lastOrigin, req.origin, t);
        const interpDir = req.dir.clone();

        const qt = Math.round(t * 10);
        const randSeedBase = qt * 10 + 1;
        const rand1 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase);
        const rand2 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase + 1);
        const rand3 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase + 2);
        const rand4 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase + 3);
        const rand5 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase + 4);
        
        const spawnThickness = req.isSpray ? (0.4 + rand1 * 0.4) : THREE.MathUtils.lerp(0.4, 1.45, pumpAlpha);
        
        const idx = this.projectileWriteIdx;
        this.projectileWriteIdx = (this.projectileWriteIdx + 1) % this.maxProjectiles;
        
        this.projectileLifetimes[idx] = 1.2 + rand2 * 0.4; // slightly longer lifespan
        this.projectileAges[idx] = 0; // reset age
        this.projectileInitialScales[idx] = spawnThickness; // Store thickness at spawn time
        this.projectileMesh.setColorAt(idx, req.color);
        this.projectileColors[idx].copy(req.color);
        
        const alpha = req.color.getHex() === 0x3889f0 ? 0.25 : 1.0;
        this.projectileMesh.geometry.attributes.instanceAlpha.setX(idx, alpha);
        
        this.projectileUpdated = true;
        if (idx < this.minProjIdx) this.minProjIdx = idx;
        if (idx > this.maxProjIdx) this.maxProjIdx = idx;
          
          // Tight origin spread for cohesive stream, wider for spray
          const originSpreadAmount = req.isSpray ? 0.08 : 0.0;
          this.projectilePositions[idx].copy(interpOrigin).add(
            new THREE.Vector3((rand3-0.5)*originSpreadAmount, (rand4-0.5)*originSpreadAmount, (rand5-0.5)*originSpreadAmount)
          );
          
          // Velocity spread
          const spreadAmount = req.isSpray ? 4.0 : 0.1;
          const spreadRand1 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase + 5);
          const spreadRand2 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase + 6);
          const spreadRand3 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase + 7);
          const spreadRand4 = seededRandom(interpOrigin.x, interpOrigin.y, interpOrigin.z, randSeedBase + 8);
          
          const spread = new THREE.Vector3((spreadRand1-0.5)*spreadAmount, (spreadRand2-0.5)*spreadAmount, (spreadRand3-0.5)*spreadAmount);
          
          // Include emitter's base velocity if available
          this.projectileVelocities[idx].copy(interpDir).multiplyScalar(req.isSpray ? (20.0 + spreadRand4 * 8.0) : 26.0).add(spread).add(req.velocity);
          
          // Precise backdating for sub-frame continuity
          this.projectilePositions[idx].addScaledVector(this.projectileVelocities[idx], -t * delta);
          this.projectileAges[idx] = (1.0 - t) * delta;
      }
    }
    
    // Store origins for interpolation on next frame
    this.emitRequests.forEach(req => req.lastOrigin = req.origin.clone());
    
    // Important: we leave emitRequests up to the callers to clear? 
    // No, emit() is called PER frame. We clear it here so it must be requested every frame.
    this.emitRequests = [];

    // 2. Update existing projectiles
    this.projectileUpdated = false;
    this.minProjIdx = this.maxProjectiles;
    this.maxProjIdx = -1;
    
    for (let i = 0; i < this.maxProjectiles; i++) {
      if (this.projectileLifetimes[i] > 0) {
        this.projectileLifetimes[i] -= delta;
        this.projectileAges[i] += delta;
        
        let hideNow = false;
        if (this.projectileLifetimes[i] <= 0) {
            hideNow = true;
        }

        const pos = this.projectilePositions[i];
        const vel = this.projectileVelocities[i];
        
        if (!hideNow) {
            // Next position
            const nextPos = pos.clone().add(vel.clone().multiplyScalar(delta));
            
            // Raycast voxel world (DDA)
            const rayDir = nextPos.clone().sub(pos);
            const dist = rayDir.length();
            
            if (dist > 0.0001) {
                rayDir.normalize();
                
                const hitInfo = this.game.world.raycast(pos, rayDir, dist);
                if (hitInfo.hit && hitInfo.hitPoint) {
                    // It hit a block!
                    this.projectileLifetimes[i] = 0;
                    
                    // Spawn a Splat!
                    const hitNorm = hitInfo.prevPos.clone().sub(hitInfo.blockPos).normalize();
                    // Prevent zero normal
                    if (hitNorm.lengthSq() < 0.1) hitNorm.set(0, 1, 0);

                    this.spawnSplat(hitInfo.hitPoint, hitNorm, this.projectileColors[i]);
                    
                    hideNow = true;
                } else if (nextPos.y <= -50) { 
                    this.projectileLifetimes[i] = 0;
                    hideNow = true;
                }
            }
            
            if (!hideNow) {
                // Gravity & Drag
                vel.y -= 16.0 * delta; // slightly more gravity for arc
                vel.multiplyScalar(Math.max(0, 1.0 - 0.45 * delta)); // slightly less drag

                // Apply new pos
                pos.copy(nextPos);
                
                // Update mesh
                this.splatDummy.position.copy(pos);
                // Stretchy projectiles using lookAt to velocity
                const speed = vel.length();
                if (speed > 0.1) {
                    this.splatDummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), vel.clone().normalize());
                }
                
                // Rope-like thickness: starts at individual initial scale, gets slightly thicker with age
                const age = this.projectileAges[i];
                const baseThickness = Math.min(3.0, (this.projectileInitialScales[i] || 1.35) + age * 2.0);
                // Ensure length is enough to cover the distance traveled plus overlap
                const stretch = Math.max(1.5, speed * delta * 1.5);
                this.splatDummy.scale.set(baseThickness, stretch, baseThickness); 
                this.splatDummy.updateMatrix();
                this.projectileMesh.setMatrixAt(i, this.splatDummy.matrix);
                this.projectileUpdated = true;
                if (i < this.minProjIdx) this.minProjIdx = i;
                if (i > this.maxProjIdx) this.maxProjIdx = i;
            }
        }
        
        if (hideNow) {
             // Hide dead projectile immediately
             this.splatDummy.scale.set(0,0,0);
             this.splatDummy.updateMatrix();
             this.projectileMesh.setMatrixAt(i, this.splatDummy.matrix);
             this.projectileUpdated = true;
             if (i < this.minProjIdx) this.minProjIdx = i;
             if (i > this.maxProjIdx) this.maxProjIdx = i;
        }
      }
    }
    
    if (this.projectileUpdated) {
      this.projectileMesh.instanceMatrix.needsUpdate = true;
      if (this.projectileMesh.instanceColor) this.projectileMesh.instanceColor.needsUpdate = true;
      if (this.projectileMesh.geometry.attributes.instanceAlpha) this.projectileMesh.geometry.attributes.instanceAlpha.needsUpdate = true;
    }
    
    if (this.splatUpdated) {
        if (this.maxSplatIdx >= this.minSplatIdx) {
            const count = this.maxSplatIdx - this.minSplatIdx + 1;
            const offsetMat = this.minSplatIdx * 16;
            const countMat = count * 16;
            
            (this.splatMesh.instanceMatrix as any).updateRange = { offset: offsetMat, count: countMat };
            (this.squareSplatMesh.instanceMatrix as any).updateRange = { offset: offsetMat, count: countMat };
            this.splatMesh.instanceMatrix.needsUpdate = true;
            this.squareSplatMesh.instanceMatrix.needsUpdate = true;

            const offsetCol = this.minSplatIdx * 3;
            const countCol = count * 3;
            if (this.splatMesh.instanceColor) {
                (this.splatMesh.instanceColor as any).updateRange = { offset: offsetCol, count: countCol };
                this.splatMesh.instanceColor.needsUpdate = true;
            }
            if (this.squareSplatMesh.instanceColor) {
                (this.squareSplatMesh.instanceColor as any).updateRange = { offset: offsetCol, count: countCol };
                this.squareSplatMesh.instanceColor.needsUpdate = true;
            }
        }
        
        this.splatUpdated = false;
        this.minSplatIdx = this.maxSplats;
        this.maxSplatIdx = -1;
    }
    
    if (this.pendingSplats.length > 0) {
        if (!this.lastSplatEmitTime || Date.now() - this.lastSplatEmitTime > 100) {
           networkManager.socket.emit("splats", this.pendingSplats);
           this.pendingSplats = [];
           this.lastSplatEmitTime = Date.now();
        }
    }
    
    if (this.pendingCleanSplats.length > 0) {
        if (!this.lastCleanEmitTime || Date.now() - this.lastCleanEmitTime > 100) {
           networkManager.socket.emit("cleanSplats", this.pendingCleanSplats);
           this.pendingCleanSplats = [];
           this.lastCleanEmitTime = Date.now();
        }
    }
  }

  spawnSplat(position: THREE.Vector3, normal: THREE.Vector3, color: THREE.Color, fromNetwork = false) {
    const gridScale = 5; // 0.2 block resolution (approx 20cm grid)
    const px = Math.round(position.x * gridScale);
    const py = Math.round(position.y * gridScale);
    const pz = Math.round(position.z * gridScale);
    const gridKey = `${px},${py},${pz}`;
    const now = Date.now();
    const colorHex = color.getHex();

    if (colorHex === 0x3889f0) {
      if (fromNetwork) return; // Clean is handled by removeSplat
      // It's the washer hose's water stream. Remove nearby splats to "clean" them!
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dz = -2; dz <= 2; dz++) {
            const washKey = `${px+dx},${py+dy},${pz+dz}`;
            this.removeSplat(washKey);
          }
        }
      }
      return;
    }

    const existing = this.splatGrid.get(gridKey);

    if (existing) {
        // Splat already exists at this approximate location!
        const existingAge = now - existing.timestamp;
        if (existing.colorHex === colorHex && existingAge < 15000 && !fromNetwork) {
            // Same color and painted recently. Skip to save buffer space & avoid disappearing splats!
            return;
        } else {
            // Different color, or it is getting old. Just change the color in-place!
            this.splatMesh.setColorAt(existing.idx, color);
            this.squareSplatMesh.setColorAt(existing.idx, color);
            existing.timestamp = now;
            existing.colorHex = colorHex;
            this.splatUpdated = true;
            if (existing.idx < this.minSplatIdx) this.minSplatIdx = existing.idx;
            if (existing.idx > this.maxSplatIdx) this.maxSplatIdx = existing.idx;
            
            if (!fromNetwork) {
               this.pendingSplats.push([position.x, position.y, position.z, normal.x, normal.y, normal.z, colorHex]);
            }
            return;
        }
    }

    // New unique splat spot. We spawn a splat!
    this.splatDummy.position.copy(position);
    
    // Align to normal
    if (normal.lengthSq() > 0.1) {
        this.splatDummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), normal);
    } else {
        this.splatDummy.quaternion.identity();
    }
    
    const isDefaultSplat = (colorHex === 0x3d1c05);

    if (isDefaultSplat) {
        // Expand to cover the block fully with the grid texture
        this.splatDummy.scale.set(1.05, 1.05, 1);
    } else {
        const spinRand = seededRandom(position.x, position.y, position.z, 10);
        this.splatDummy.rotateZ(spinRand * Math.PI * 2);
        
        const scaleRand = seededRandom(position.x, position.y, position.z, 11);
        const s = 0.5 + scaleRand * 0.5;
        this.splatDummy.scale.set(s, s, 1);
    }
    
    this.splatDummy.updateMatrix();
    
    // Cycle splat buffer
    const splatIdx = this.splatCount % this.maxSplats;
    
    // Clean up old key associated with this slot
    const oldKey = this.splatKeys[splatIdx];
    if (oldKey) {
        this.splatGrid.delete(oldKey);
    }
    
    // Write new mapping
    this.splatKeys[splatIdx] = gridKey;
    this.splatGrid.set(gridKey, { idx: splatIdx, timestamp: now, colorHex: colorHex });

    const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

    if (isDefaultSplat) {
        this.squareSplatMesh.setMatrixAt(splatIdx, this.splatDummy.matrix);
        this.squareSplatMesh.setColorAt(splatIdx, color);
        this.splatMesh.setMatrixAt(splatIdx, hiddenMatrix);
    } else {
        this.splatMesh.setMatrixAt(splatIdx, this.splatDummy.matrix);
        this.splatMesh.setColorAt(splatIdx, color);
        this.squareSplatMesh.setMatrixAt(splatIdx, hiddenMatrix);
    }
    
    this.splatCount++;
    
    this.splatUpdated = true;
    if (splatIdx < this.minSplatIdx) this.minSplatIdx = splatIdx;
    if (splatIdx > this.maxSplatIdx) this.maxSplatIdx = splatIdx;

    if (!fromNetwork) {
       this.pendingSplats.push([position.x, position.y, position.z, normal.x, normal.y, normal.z, colorHex]);
    }
  }

  clearAllSplats() {
    this.splatGrid.clear();
    this.splatKeys.fill('');
    this.splatCount = 0;
    this.minSplatIdx = 0;
    this.maxSplatIdx = this.maxSplats - 1;
    this.splatDummy.scale.set(0, 0, 0);
    this.splatDummy.updateMatrix();
    if (this.splatMesh && this.squareSplatMesh) {
       for (let i = 0; i < this.maxSplats; i++) {
           this.splatMesh.setMatrixAt(i, this.splatDummy.matrix);
           this.squareSplatMesh.setMatrixAt(i, this.splatDummy.matrix);
       }
    }
    this.splatUpdated = true;
    this.pendingSplats = [];
    this.pendingCleanSplats = [];
  }

  removeSplat(key: string, fromNetwork = false) {
     const target = this.splatGrid.get(key);
     if (target) {
       this.splatDummy.scale.set(0, 0, 0);
       this.splatDummy.updateMatrix();
       this.splatMesh.setMatrixAt(target.idx, this.splatDummy.matrix);
       this.squareSplatMesh.setMatrixAt(target.idx, this.splatDummy.matrix);
       this.splatGrid.delete(key);
       this.splatKeys[target.idx] = '';
       this.splatUpdated = true;
       if (target.idx < this.minSplatIdx) this.minSplatIdx = target.idx;
       if (target.idx > this.maxSplatIdx) this.maxSplatIdx = target.idx;
       if (!fromNetwork) {
          this.pendingCleanSplats.push(key);
       }
     }
  }

  emit(origin: THREE.Vector3, direction: THREE.Vector3, isSpray: boolean = false, color?: THREE.Color, velocity?: THREE.Vector3) {
    // Find if this specific emitter (like local player) is already emitting so we can interpolate origin
    // For simplicity, we just use a basic distance check to link origins, or let callers pass their lastOrigin.
    // To make it fully robust for multiple emitters, we should let them pass their ID, but this is a lightweight approach.
    this.emitRequests.push({
        origin: origin.clone(),
        dir: direction.clone(),
        isSpray: isSpray,
        color: color ? color.clone() : new THREE.Color('#3d1c04'),
        velocity: velocity ? velocity.clone() : new THREE.Vector3(),
    });
  }

  destroy() {
    if (this.projectileMesh) {
      this.game.world.scene.remove(this.projectileMesh);
      this.projectileMesh.geometry.dispose();
      (this.projectileMesh.material as THREE.Material).dispose();
    }
    if (this.splatMesh) {
      this.game.world.scene.remove(this.splatMesh);
      this.splatMesh.geometry.dispose();
      const splatMat = this.splatMesh.material as THREE.MeshPhongMaterial;
      splatMat.dispose();
      if (splatMat.map) splatMat.map.dispose();
    }
    if (this.squareSplatMesh) {
      this.game.world.scene.remove(this.squareSplatMesh);
      this.squareSplatMesh.geometry.dispose();
      const squareMat = this.squareSplatMesh.material as THREE.Material;
      squareMat.dispose();
    }
  }
}
