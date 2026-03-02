import { RoadGenerator } from './roadGenerator.js';
import { StructurePool } from './structurePool.js';

// Block type constants
const BLOCK_GRASS = 1;
const BLOCK_DIRT = 2;
const BLOCK_WATER = 6;
const BLOCK_SAND = 7;
const MAX_TERRAIN_BLOCK_ID = 7; // block IDs <= 7 are natural terrain

export class VillageGenerator {
    constructor(noise, seedX, seedZ) {
        this.noise = noise;
        this.seedX = seedX;
        this.seedZ = seedZ;
        this.CELL_SIZE = 48; // chunks per cell (768 blocks)
        this.VILLAGE_RADIUS = 40;
        this.generatedVillages = new Map();
    }

    /**
     * Seeded hash from noise - returns value in [0, 1).
     */
    _seededRandom(x, z, salt) {
        const v = this.noise.noise(
            x * 0.7631 + this.seedX + salt,
            salt * 0.3179,
            z * 0.8317 + this.seedZ + salt
        );
        return (v + 1) / 2; // normalize from [-1,1] to [0,1)
    }

    getVillageAt(cx, cz) {
        // Determine which grid cell this chunk falls in
        const cellX = Math.floor(cx / this.CELL_SIZE);
        const cellZ = Math.floor(cz / this.CELL_SIZE);

        // Check the current cell and all 8 neighbors
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const village = this._getVillageForCell(cellX + dx, cellZ + dz);
                if (!village) continue;

                // Check if our chunk is within the village radius
                const chunkWorldX = cx * 16 + 8;
                const chunkWorldZ = cz * 16 + 8;
                const distX = Math.abs(chunkWorldX - village.centerX);
                const distZ = Math.abs(chunkWorldZ - village.centerZ);
                if (distX <= village.radius + 16 && distZ <= village.radius + 16) {
                    return village;
                }
            }
        }
        return null;
    }

    _getVillageForCell(cellX, cellZ) {
        const key = `${cellX},${cellZ}`;
        if (this.generatedVillages.has(key)) {
            return this.generatedVillages.get(key);
        }

        // Use noise to pick a location within the cell
        const offsetX = this._seededRandom(cellX, cellZ, 137.0);
        const offsetZ = this._seededRandom(cellX, cellZ, 259.0);

        // Village center in world coordinates (keep away from cell edges)
        const margin = 8; // chunks margin from cell edge
        const rangeChunks = this.CELL_SIZE - margin * 2;
        const villageCX = cellX * this.CELL_SIZE + margin + Math.floor(offsetX * rangeChunks);
        const villageCZ = cellZ * this.CELL_SIZE + margin + Math.floor(offsetZ * rangeChunks);

        const centerX = villageCX * 16 + 8;
        const centerZ = villageCZ * 16 + 8;

        // Determine if this cell actually has a village (~60% spawn rate per cell)
        const spawnChance = this._seededRandom(cellX, cellZ, 419.0);
        if (spawnChance > 0.6) {
            this.generatedVillages.set(key, null);
            return null;
        }

        if (!this.isValidVillageLocation(centerX, centerZ)) {
            this.generatedVillages.set(key, null);
            return null;
        }

        const biome = this.getBiomeAt(centerX, centerZ);
        const radius = this.VILLAGE_RADIUS;

        const village = { centerX, centerZ, biome, radius };
        this.generatedVillages.set(key, village);
        return village;
    }

    getBiomeAt(x, z) {
        const tempNoise = this.noise.noise(
            x / 300 + this.seedX + 1000,
            0,
            z / 300 + this.seedZ + 1000
        );
        const humidNoise = this.noise.noise(
            x / 300 + this.seedX + 2000,
            0,
            z / 300 + this.seedZ + 2000
        );

        // Temperature: -1 to 1 (cold to hot)
        // Humidity: -1 to 1 (dry to wet)
        if (tempNoise < -0.3) {
            return humidNoise < 0 ? 'snow' : 'taiga';
        }
        if (tempNoise > 0.4) {
            return humidNoise < 0 ? 'desert' : 'savanna';
        }
        return 'plains';
    }

    getBiomeMaterials(biome) {
        const materials = {
            plains:  { wall: 8, foundation: 14, log: 4, roof: 8, path: 14, fence: 4 },
            desert:  { wall: 7, foundation: 7, log: 7, roof: 7, path: 7, fence: 7 },
            savanna: { wall: 8, foundation: 14, log: 4, roof: 8, path: 2, fence: 4 },
            taiga:   { wall: 8, foundation: 14, log: 4, roof: 8, path: 14, fence: 4 },
            snow:    { wall: 8, foundation: 14, log: 4, roof: 8, path: 14, fence: 4 },
        };
        return materials[biome] || materials.plains;
    }

    getTerrainHeight(x, z) {
        let alt = 0;
        alt += this.noise.noise(x / 100 + this.seedX, 0, z / 100 + this.seedZ) * 20;
        alt += this.noise.noise(x / 40 + this.seedX, 0, z / 40 + this.seedZ) * 8;
        alt += this.noise.noise(x / 15 + this.seedX, 0, z / 15 + this.seedZ) * 3;
        return Math.floor(alt);
    }

    isValidVillageLocation(x, z) {
        const height = this.getTerrainHeight(x, z);
        if (height <= 0) return false;

        // Check terrain slope across the village area
        const sampleDist = 16;
        const offsets = [
            [sampleDist, 0], [-sampleDist, 0],
            [0, sampleDist], [0, -sampleDist],
        ];
        for (const [dx, dz] of offsets) {
            const sampleH = this.getTerrainHeight(x + dx, z + dz);
            if (sampleH <= 0) return false;
            if (Math.abs(sampleH - height) > 6) return false;
        }
        return true;
    }

    flattenTerrain(mundo, centerX, centerZ, radius, baseY) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius) continue;

                const wx = centerX + dx;
                const wz = centerZ + dz;

                // Smooth blend at edges
                const edgeFade = Math.min(1, (radius - dist) / 6);
                const targetY = Math.round(baseY + (1 - edgeFade) *
                    (this.getTerrainHeight(wx, wz) - baseY));

                // Clear blocks above target
                for (let y = targetY + 1; y <= targetY + 20; y++) {
                    const key = `${wx},${y},${wz}`;
                    if (mundo.has(key)) {
                        const blockType = mundo.get(key);
                        // Keep structures already placed (don't remove non-terrain)
                        if (blockType <= MAX_TERRAIN_BLOCK_ID) {
                            mundo.delete(key);
                        }
                    }
                }

                // Fill gaps below target to create flat ground
                for (let y = targetY; y >= targetY - 5; y--) {
                    const key = `${wx},${y},${wz}`;
                    if (!mundo.has(key)) {
                        mundo.set(key, y === targetY ? BLOCK_GRASS : BLOCK_DIRT);
                    }
                }
            }
        }
    }

    generateVillage(mundo, centerX, centerZ, biome) {
        const mat = this.getBiomeMaterials(biome);
        const baseY = this.getTerrainHeight(centerX, centerZ);
        const radius = this.VILLAGE_RADIUS;

        const villageData = {
            centerX,
            centerZ,
            biome,
            radius,
            beds: [],
            workstations: [],
            structures: [],
        };

        // Flatten the terrain first
        this.flattenTerrain(mundo, centerX, centerZ, radius, baseY);

        // Generate town center: 5x5 cobblestone plaza with a 3-block tall post
        this._buildTownCenter(mundo, centerX, centerZ, baseY, mat);

        // Generate roads from the center
        const roadGen = new RoadGenerator(this.noise, this.seedX, this.seedZ);
        const roads = roadGen.generate(centerX, centerZ, baseY, radius, mat.path);
        for (const block of roads) {
            mundo.set(`${block.x},${block.y},${block.z}`, block.type);
        }

        // Place structures along roads
        const structurePool = new StructurePool(this.noise, this.seedX, this.seedZ);
        const structurePlacements = structurePool.placeStructures(
            centerX, centerZ, baseY, radius, roads, biome
        );

        for (const structure of structurePlacements) {
            this._buildStructure(mundo, structure, mat, baseY);
            villageData.structures.push({
                type: structure.type,
                x: structure.x,
                z: structure.z,
            });

            if (structure.beds) {
                for (const bed of structure.beds) {
                    villageData.beds.push({ x: bed.x, y: bed.y, z: bed.z });
                }
            }
            if (structure.workstations) {
                for (const ws of structure.workstations) {
                    villageData.workstations.push({ x: ws.x, y: ws.y, z: ws.z });
                }
            }
        }

        return villageData;
    }

    _buildTownCenter(mundo, cx, cz, baseY, mat) {
        // 5x5 cobblestone platform
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                mundo.set(`${cx + dx},${baseY},${cz + dz}`, mat.foundation);
            }
        }
        // 3-block tall post in the center
        for (let dy = 1; dy <= 3; dy++) {
            mundo.set(`${cx},${baseY + dy},${cz}`, mat.log);
        }
    }

    _buildStructure(mundo, structure, mat, villageBaseY) {
        const { x, z, type, width, depth } = structure;
        const y = villageBaseY;
        const hw = Math.floor(width / 2);
        const hd = Math.floor(depth / 2);
        const wallHeight = 4;

        // Foundation
        for (let dx = -hw; dx <= hw; dx++) {
            for (let dz = -hd; dz <= hd; dz++) {
                mundo.set(`${x + dx},${y},${z + dz}`, mat.foundation);
            }
        }

        // Floor
        for (let dx = -hw + 1; dx < hw; dx++) {
            for (let dz = -hd + 1; dz < hd; dz++) {
                mundo.set(`${x + dx},${y + 1},${z + dz}`, mat.wall);
            }
        }

        // Walls
        for (let dy = 1; dy <= wallHeight; dy++) {
            for (let dx = -hw; dx <= hw; dx++) {
                mundo.set(`${x + dx},${y + dy},${z - hd}`, mat.wall);
                mundo.set(`${x + dx},${y + dy},${z + hd}`, mat.wall);
            }
            for (let dz = -hd; dz <= hd; dz++) {
                mundo.set(`${x - hw},${y + dy},${z + dz}`, mat.wall);
                mundo.set(`${x + hw},${y + dy},${z + dz}`, mat.wall);
            }
        }

        // Corner logs for structural support
        for (let dy = 1; dy <= wallHeight + 1; dy++) {
            mundo.set(`${x - hw},${y + dy},${z - hd}`, mat.log);
            mundo.set(`${x + hw},${y + dy},${z - hd}`, mat.log);
            mundo.set(`${x - hw},${y + dy},${z + hd}`, mat.log);
            mundo.set(`${x + hw},${y + dy},${z + hd}`, mat.log);
        }

        // Door opening (front wall, center)
        mundo.delete(`${x},${y + 1},${z - hd}`);
        mundo.delete(`${x},${y + 2},${z - hd}`);

        // Window openings on side walls
        if (width >= 5) {
            mundo.delete(`${x - hw},${y + 2},${z}`);
            mundo.delete(`${x + hw},${y + 2},${z}`);
        }

        // Roof (flat slab style)
        for (let dx = -hw - 1; dx <= hw + 1; dx++) {
            for (let dz = -hd - 1; dz <= hd + 1; dz++) {
                mundo.set(`${x + dx},${y + wallHeight + 1},${z + dz}`, mat.roof);
            }
        }
    }
}
