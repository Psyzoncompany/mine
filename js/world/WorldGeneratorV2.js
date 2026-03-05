import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

// ─── Block type constants ────────────────────────────────────────────
const BLOCK = Object.freeze({
    AIR:           0,
    GRASS:         1,
    DIRT:          2,
    STONE:         3,
    OAK_LOG:       4,
    OAK_LEAVES:    5,
    WATER:         6,
    SAND:          7,
    COAL_ORE:     10,
    IRON_ORE:     11,
    GOLD_ORE:     12,
    DIAMOND_ORE:  13,
    SHORT_GRASS:  18,
    POPPY:        19,
    DANDELION:    20,
    CORNFLOWER:   21,
    SANDSTONE:    24,
    SNOW_BLOCK:   25,
    GRAVEL:       26,
    LAVA:         27,
    BEDROCK:      28,
    SPRUCE_LOG:   29,
    SPRUCE_LEAVES:30,
    GRANITE:      31,
    DIORITE:      32,
    ANDESITE:     33,
    DEEPSLATE:    34,
    COPPER_ORE:    35,
    REDSTONE_ORE:  56,
});

const CHUNK_SIZE = 16;
const Y_MIN = -64;
const Y_MAX = 50;

// ─── Biome identifiers ──────────────────────────────────────────────
const BIOME = Object.freeze({
    OCEAN:     'ocean',
    BEACH:     'beach',
    DESERT:    'desert',
    PLAINS:    'plains',
    FOREST:    'forest',
    TAIGA:     'taiga',
    MOUNTAINS: 'mountains',
});

// ─── Deterministic hash functions ────────────────────────────────────

/**
 * Fast 2D deterministic hash → [0, 1).
 * @param {number} x
 * @param {number} z
 * @param {number} seed
 * @returns {number}
 */
function hash2D(x, z, seed) {
    let h = seed ^ (x * 374761393) ^ (z * 668265263);
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * 3D deterministic hash → [0, 1).
 */
function hash3D(x, y, z, seed) {
    let h = seed ^ (x * 374761393) ^ (y * 668265263) ^ (z * 1274126177);
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Salted 2D hash for different random streams at the same position.
 */
function hash2DSalted(x, z, seed, salt) {
    return hash2D(x ^ salt, z ^ (salt * 7), seed);
}

// ─── Noise helpers ───────────────────────────────────────────────────

/**
 * Fractional Brownian motion (fBm) for 2D terrain / biome noise.
 * @param {ImprovedNoise} noise
 * @param {number} x  - world coordinate (pre-scaled by caller)
 * @param {number} z
 * @param {number} octaves
 * @param {number} lacunarity  - frequency multiplier per octave
 * @param {number} persistence - amplitude multiplier per octave
 * @returns {number} value roughly in [-1, 1]
 */
function fbm2D(noise, x, z, octaves = 4, lacunarity = 2.0, persistence = 0.5) {
    let value = 0;
    let amp   = 1;
    let freq  = 1;
    let max   = 0;
    for (let i = 0; i < octaves; i++) {
        value += noise.noise(x * freq, 0, z * freq) * amp;
        max   += amp;
        amp   *= persistence;
        freq  *= lacunarity;
    }
    return value / max; // normalised to roughly [-0.5, 0.5]; callers scale ×2 for [-1,1]
}

/**
 * fBm for 3D (caves, ores).
 */
function fbm3D(noise, x, y, z, octaves = 3, lacunarity = 2.0, persistence = 0.5) {
    let value = 0;
    let amp   = 1;
    let freq  = 1;
    let max   = 0;
    for (let i = 0; i < octaves; i++) {
        value += noise.noise(x * freq, y * freq, z * freq) * amp;
        max   += amp;
        amp   *= persistence;
        freq  *= lacunarity;
    }
    return value / max;
}

// ═════════════════════════════════════════════════════════════════════
//  WorldGeneratorV2
// ═════════════════════════════════════════════════════════════════════

export class WorldGeneratorV2 {
    /**
     * @param {object} config
     * @param {number}  [config.seed]             - integer seed (random if omitted)
     * @param {number}  [config.seaLevel=5]       - water surface Y
     * @param {boolean} [config.enableCaves=true]
     * @param {boolean} [config.enableAquifers=true]
     * @param {boolean} [config.enableOres=true]
     * @param {boolean} [config.enableTrees=true]
     * @param {boolean} [config.enableStructures=true]
     */
    constructor(config = {}) {
        this.seaLevel         = config.seaLevel ?? 5;
        this.enableCaves      = config.enableCaves ?? true;
        this.enableAquifers   = config.enableAquifers ?? true;
        this.enableOres       = config.enableOres ?? true;
        this.enableTrees      = config.enableTrees ?? true;
        this.enableStructures = config.enableStructures ?? true;

        this.noise = new ImprovedNoise();
        this.setSeed(config.seed ?? Math.floor(Math.random() * 2147483647));
    }

    // ─── Seed management ─────────────────────────────────────────────

    /**
     * (Re)initialise all seed-derived offsets.
     * @param {number} seed
     */
    setSeed(seed) {
        this.seed  = seed | 0;
        // Derive per-layer offsets so each noise layer samples a unique region.
        this.seedX = hash2D(seed, 0, 123456)  * 10000;
        this.seedZ = hash2D(0, seed, 654321)  * 10000;
        this._offsets = {
            temperature:     { x: hash2D(seed, 1, 111) * 10000, z: hash2D(1, seed, 222) * 10000 },
            humidity:        { x: hash2D(seed, 2, 333) * 10000, z: hash2D(2, seed, 444) * 10000 },
            continentalness: { x: hash2D(seed, 3, 555) * 10000, z: hash2D(3, seed, 666) * 10000 },
            erosion:         { x: hash2D(seed, 4, 777) * 10000, z: hash2D(4, seed, 888) * 10000 },
            weirdness:       { x: hash2D(seed, 5, 999) * 10000, z: hash2D(5, seed, 101) * 10000 },
            cave1:           { x: hash2D(seed, 6, 202) * 10000, z: hash2D(6, seed, 303) * 10000 },
            cave2:           { x: hash2D(seed, 7, 404) * 10000, z: hash2D(7, seed, 505) * 10000 },
            cave3:           { x: hash2D(seed, 8, 606) * 10000, z: hash2D(8, seed, 707) * 10000 },
        };
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 1 – Biome noise sampling
    // ═════════════════════════════════════════════════════════════════

    /** @private */
    _sampleBiomeNoise(worldX, worldZ) {
        const n  = this.noise;
        const o  = this._offsets;
        const temperature     = fbm2D(n, (worldX + o.temperature.x) / 200,     (worldZ + o.temperature.z) / 200,     3);
        const humidity        = fbm2D(n, (worldX + o.humidity.x) / 200,         (worldZ + o.humidity.z) / 200,         3);
        const continentalness = fbm2D(n, (worldX + o.continentalness.x) / 300,  (worldZ + o.continentalness.z) / 300,  4);
        const erosion         = fbm2D(n, (worldX + o.erosion.x) / 150,          (worldZ + o.erosion.z) / 150,          3);
        const weirdness       = fbm2D(n, (worldX + o.weirdness.x) / 100,        (worldZ + o.weirdness.z) / 100,        2);

        // Normalise from ~[-0.5,0.5] to [-1,1]
        return {
            temperature:     temperature * 2,
            humidity:        humidity * 2,
            continentalness: continentalness * 2,
            erosion:         erosion * 2,
            weirdness:       weirdness * 2,
        };
    }

    /**
     * Classify a biome from noise parameters.
     * @param {object} params  output of _sampleBiomeNoise
     * @returns {string} biome id
     */
    _classifyBiome(params) {
        const { temperature, humidity, continentalness, erosion, weirdness } = params;

        if (continentalness < -0.3) return BIOME.OCEAN;
        if (continentalness < -0.1) return BIOME.BEACH;
        if (erosion < -0.3 && weirdness > 0.1) return BIOME.MOUNTAINS;
        if (temperature > 0.3 && humidity < -0.1) return BIOME.DESERT;
        if (temperature < -0.2) return BIOME.TAIGA;
        if (humidity > 0.2) return BIOME.FOREST;
        return BIOME.PLAINS;
    }

    /**
     * Public API – get biome name at a world column.
     * @param {number} worldX
     * @param {number} worldZ
     * @returns {string}
     */
    getBiomeAt(worldX, worldZ) {
        return this._classifyBiome(this._sampleBiomeNoise(worldX, worldZ));
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 2 – Terrain heightmap
    // ═════════════════════════════════════════════════════════════════

    /**
     * Compute terrain surface height at (worldX, worldZ).
     * @param {number} worldX
     * @param {number} worldZ
     * @returns {number} integer height
     */
    getHeightAt(worldX, worldZ) {
        const params = this._sampleBiomeNoise(worldX, worldZ);
        return this._calcHeight(worldX, worldZ, params);
    }

    /** @private */
    _calcHeight(worldX, worldZ, params) {
        const { continentalness, erosion, weirdness } = params;
        const n = this.noise;

        // Base elevation driven by continentalness
        let h = this.seaLevel + continentalness * 12;

        // Erosion adds rolling hills / flats
        h += erosion * 6;

        // Medium & fine detail noise
        const ox = worldX + this.seedX;
        const oz = worldZ + this.seedZ;
        // Medium detail: rolling hills (scale 40, amplitude 4 blocks)
        h += n.noise(ox / 40, 0, oz / 40) * 4 * 2;   // ×2 because noise ∈ [-0.5,0.5]
        // Fine detail: small bumps (scale 15, amplitude 2 blocks)
        h += n.noise(ox / 15, 0, oz / 15) * 2 * 2;

        // Mountain peaks
        if (erosion < -0.3) {
            const peakFactor = Math.min(1, (-0.3 - erosion) / 0.4); // 0‥1
            const weirdClamp = Math.max(0, weirdness);
            h += peakFactor * weirdClamp * 35;
        }

        // Ocean floor clamping
        if (continentalness < -0.3) {
            const depth = Math.min(1, (-0.3 - continentalness) / 0.5);
            const floor = this.seaLevel - 3 - depth * 5; // seaLevel-3 .. seaLevel-8
            h = Math.min(h, floor);
        }

        return Math.floor(h);
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 3 – Surface rules
    // ═════════════════════════════════════════════════════════════════

    /**
     * Determine block type for a position in the surface layer.
     * @private
     * @param {string} biome
     * @param {number} y          current Y
     * @param {number} height     terrain surface Y
     * @returns {number} block type
     */
    _surfaceBlock(biome, y, height) {
        const depth = height - y; // 0 = surface, 1 = one below, …

        switch (biome) {
            case BIOME.DESERT:
            case BIOME.BEACH:
                if (depth === 0) return BLOCK.SAND;
                if (depth <= 4)  return BLOCK.SANDSTONE;
                return BLOCK.STONE;

            case BIOME.TAIGA:
                if (depth === 0) return BLOCK.SNOW_BLOCK;
                if (depth <= 2)  return BLOCK.DIRT;
                return BLOCK.STONE;

            case BIOME.MOUNTAINS:
                if (height > 30) {
                    if (depth === 0) return BLOCK.SNOW_BLOCK;
                    return BLOCK.STONE;
                }
                if (height > 25) return BLOCK.STONE; // exposed stone
                // lower mountains get grass/dirt
                if (depth === 0) return BLOCK.GRASS;
                if (depth <= 3)  return BLOCK.DIRT;
                return BLOCK.STONE;

            // PLAINS, FOREST, OCEAN (ocean floor = dirt/stone)
            default:
                if (depth === 0) return BLOCK.GRASS;
                if (depth <= 3)  return BLOCK.DIRT;
                return BLOCK.STONE;
        }
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 4 – Caves
    // ═════════════════════════════════════════════════════════════════

    /**
     * Returns true if the block at (wx,y,wz) should be carved out.
     * @private
     */
    _isCave(wx, y, wz, terrainHeight) {
        if (y <= Y_MIN) return false; // never carve bedrock layer

        // Fade near surface – reduce probability within 5 blocks of terrain
        const surfaceDist = terrainHeight - y;
        if (surfaceDist <= 1) return false;          // never carve top 1 block
        const fadeFactor = surfaceDist < 5 ? (surfaceDist - 1) / 4 : 1;

        const n = this.noise;
        const o = this._offsets;

        const cheese    = fbm3D(n, (wx + o.cave1.x) / 60, y / 40, (wz + o.cave1.z) / 60, 2);
        const spaghetti = Math.abs(fbm3D(n, (wx + o.cave2.x) / 30, y / 30, (wz + o.cave2.z) / 30, 2));
        const noodle    = Math.abs(fbm3D(n, (wx + o.cave3.x) / 20, y / 20, (wz + o.cave3.z) / 20, 2));

        const cheeseThreshold    = 0.35 / fadeFactor;
        const spaghettiThreshold = 0.04 * fadeFactor;
        const noodleThreshold    = 0.025 * fadeFactor;

        return (cheese > cheeseThreshold) ||
               (spaghetti < spaghettiThreshold) ||
               (noodle < noodleThreshold);
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 5 – Water & Aquifers
    // ═════════════════════════════════════════════════════════════════

    /** @private – local aquifer water level at column */
    _aquiferLevel(wx, wz) {
        const n = this.noise;
        const o = this._offsets;
        return this.seaLevel - 12 + n.noise((wx + o.cave1.x) / 80, 0, (wz + o.cave1.z) / 80) * 3;
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 6 – Ores
    // ═════════════════════════════════════════════════════════════════

    /**
     * Ore generation table: [blockType, yMin, yMax, noiseThreshold, noiseScale].
     * A negative yMax value is relative to the column's terrain height
     * (e.g. -5 → terrainHeight - 5).
     */
    static ORE_TABLE = [
        [BLOCK.COAL_ORE,      Y_MIN,  -3,  0.55,  9],
        [BLOCK.IRON_ORE,      Y_MIN,  20,  0.60,  8],
        [BLOCK.COPPER_ORE,    Y_MIN,  25,  0.62,  8],
        [BLOCK.GOLD_ORE,      Y_MIN,   5,  0.65,  7],
        [BLOCK.DIAMOND_ORE,   Y_MIN,  -3,  0.72,  5],
        [BLOCK.REDSTONE_ORE,  Y_MIN,  16,  0.68,  6],
    ];

    /** @private */
    _oreAt(wx, y, wz, heightAtColumn) {
        for (const [type, yMin, yMaxRaw, threshold, scale] of WorldGeneratorV2.ORE_TABLE) {
            const yMax = yMaxRaw < 0 ? heightAtColumn + yMaxRaw : yMaxRaw;
            if (y < yMin || y > yMax) continue;
            // Each ore uses a unique offset derived from its type
            const val = Math.abs(fbm3D(this.noise,
                (wx + this.seedX + type * 1337) / scale,
                (y  + type * 7919) / scale,
                (wz + this.seedZ + type * 4919) / scale,
                2));
            if (val > threshold) return type;
        }
        return BLOCK.STONE; // unchanged
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 6b – Stone variety (granite, diorite, andesite, deepslate)
    // ═════════════════════════════════════════════════════════════════

    /**
     * Returns a stone variant for underground variety patches.
     * Deepslate replaces stone below Y = -5.
     * Granite, diorite, andesite appear as scattered patches.
     * @private
     */
    _stoneVariant(wx, y, wz) {
        // Deepslate in deep areas (below Y=0, like Minecraft)
        if (y <= 0) return BLOCK.DEEPSLATE;

        const n = this.noise;
        // Granite patches
        const g = Math.abs(fbm3D(n, (wx + this.seedX + 5000) / 16, (y + 5000) / 16, (wz + this.seedZ + 5000) / 16, 2));
        if (g > 0.55) return BLOCK.GRANITE;
        // Diorite patches
        const d = Math.abs(fbm3D(n, (wx + this.seedX + 9000) / 16, (y + 9000) / 16, (wz + this.seedZ + 9000) / 16, 2));
        if (d > 0.55) return BLOCK.DIORITE;
        // Andesite patches
        const a = Math.abs(fbm3D(n, (wx + this.seedX + 13000) / 16, (y + 13000) / 16, (wz + this.seedZ + 13000) / 16, 2));
        if (a > 0.55) return BLOCK.ANDESITE;

        return BLOCK.STONE;
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 7 – Vegetation (trees, flowers, grass)
    // ═════════════════════════════════════════════════════════════════

    /** @private – Generate an oak tree into mundo */
    _placeOakTree(mundo, x, baseY, z) {
        const height = 4 + (hash2D(x, z, this.seed + 17) * 3) | 0; // 4‥6
        // Trunk
        for (let i = 0; i < height; i++) {
            const key = `${x},${baseY + i},${z}`;
            if (!mundo.has(key)) mundo.set(key, BLOCK.OAK_LOG);
        }
        // Canopy (rounded sphere-ish)
        const leafStart = height - 2;
        for (let dy = leafStart; dy <= height + 1; dy++) {
            const radius = dy <= height - 1 ? 2 : 1;
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (dx === 0 && dz === 0 && dy < height) continue; // trunk column
                    const dist = Math.abs(dx) + Math.abs(dy - height) + Math.abs(dz);
                    if (dist < 4) {
                        const key = `${x + dx},${baseY + dy},${z + dz}`;
                        if (!mundo.has(key)) mundo.set(key, BLOCK.OAK_LEAVES);
                    }
                }
            }
        }
    }

    /** @private – Generate a spruce tree into mundo */
    _placeSpruceTree(mundo, x, baseY, z) {
        const height = 5 + (hash2D(x, z, this.seed + 31) * 4) | 0; // 5‥8
        // Trunk
        for (let i = 0; i < height; i++) {
            const key = `${x},${baseY + i},${z}`;
            if (!mundo.has(key)) mundo.set(key, BLOCK.SPRUCE_LOG);
        }
        // Conical canopy
        for (let dy = 2; dy <= height; dy++) {
            const layerFromTop = height - dy;
            const radius = Math.min(1 + Math.floor(layerFromTop / 2), 3);
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (dx === 0 && dz === 0 && dy < height) continue;
                    if (Math.abs(dx) + Math.abs(dz) > radius + 1) continue;
                    const key = `${x + dx},${baseY + dy},${z + dz}`;
                    if (!mundo.has(key)) mundo.set(key, BLOCK.SPRUCE_LEAVES);
                }
            }
        }
        // Tip
        const tipKey = `${x},${baseY + height},${z}`;
        if (!mundo.has(tipKey)) mundo.set(tipKey, BLOCK.SPRUCE_LEAVES);
    }

    /** @private – Place vegetation on a column */
    _placeVegetation(mundo, wx, surfaceY, wz, biome) {
        const surfaceBlock = mundo.get(`${wx},${surfaceY},${wz}`);

        // Tree thresholds per biome
        const treeThresholds = {
            [BIOME.FOREST]: 0.02,
            [BIOME.TAIGA]:  0.015,
            [BIOME.PLAINS]: 0.005,
        };

        const treeChance = treeThresholds[biome];
        if (treeChance) {
            const roll = hash2D(wx, wz, this.seed + 50);
            if (roll < treeChance) {
                // Ensure surface is plantable
                const plantable = (biome === BIOME.TAIGA)
                    ? (surfaceBlock === BLOCK.SNOW_BLOCK || surfaceBlock === BLOCK.GRASS)
                    : (surfaceBlock === BLOCK.GRASS);
                if (plantable) {
                    if (biome === BIOME.TAIGA) {
                        this._placeSpruceTree(mundo, wx, surfaceY + 1, wz);
                    } else {
                        this._placeOakTree(mundo, wx, surfaceY + 1, wz);
                    }
                    return; // no flowers on tree columns
                }
            }
        }

        // Flowers & short grass – only on grass blocks
        if (surfaceBlock !== BLOCK.GRASS) return;

        const floraRoll = hash2DSalted(wx, wz, this.seed, 9001);
        if (floraRoll < 0.01) {
            this._setIfEmpty(mundo, wx, surfaceY + 1, wz, BLOCK.CORNFLOWER);
        } else if (floraRoll < 0.03) {
            this._setIfEmpty(mundo, wx, surfaceY + 1, wz, BLOCK.DANDELION);
        } else if (floraRoll < 0.05) {
            this._setIfEmpty(mundo, wx, surfaceY + 1, wz, BLOCK.POPPY);
        } else if (floraRoll < 0.18) {
            this._setIfEmpty(mundo, wx, surfaceY + 1, wz, BLOCK.SHORT_GRASS);
        }
    }

    // ═════════════════════════════════════════════════════════════════
    //  Pass 8 – Bedrock
    // ═════════════════════════════════════════════════════════════════

    /** @private – bedrock layer with deterministic roughness */
    _bedrockAt(wx, y, wz) {
        if (y === Y_MIN) return true;
        if (y === Y_MIN + 1) return hash3D(wx, y, wz, this.seed + 77) < 0.5;
        if (y === Y_MIN + 2) return hash3D(wx, y, wz, this.seed + 77) < 0.25;
        return false;
    }

    // ═════════════════════════════════════════════════════════════════
    //  Helpers
    // ═════════════════════════════════════════════════════════════════

    /** @private – set block only if no existing block at key */
    _setIfEmpty(mundo, x, y, z, type) {
        const key = `${x},${y},${z}`;
        if (!mundo.has(key)) mundo.set(key, type);
    }

    // ═════════════════════════════════════════════════════════════════
    //  Main entry – generateChunk
    // ═════════════════════════════════════════════════════════════════

    /**
     * Generate block data for chunk (cx, cz) into the provided mundo Map.
     * Supports top-only generation to reduce deep-cave work for distant chunks.
     * @param {Map<string, number>} mundo - shared world block map
     * @param {number} cx - chunk X coordinate
     * @param {number} cz - chunk Z coordinate
     * @param {{topOnlyDepth?: number}} [options]
     */
    generateChunk(mundo, cx, cz, options = {}) {
        const maxTopOnlyDepth = Y_MAX - Y_MIN;
        const topOnlyDepth = Number.isFinite(options.topOnlyDepth)
            ? Math.min(maxTopOnlyDepth, Math.max(1, options.topOnlyDepth))
            : null;
        const isTopOnly = topOnlyDepth !== null;

        // Pre-compute per-column data (biome params, height, biome id)
        const columns = new Array(CHUNK_SIZE * CHUNK_SIZE);

        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            for (let lz = 0; lz < CHUNK_SIZE; lz++) {
                const wx = cx * CHUNK_SIZE + lx;
                const wz = cz * CHUNK_SIZE + lz;
                const params = this._sampleBiomeNoise(wx, wz);
                const biome  = this._classifyBiome(params);
                const height = this._calcHeight(wx, wz, params);
                const minY = isTopOnly ? Math.max(Y_MIN, height - topOnlyDepth) : Y_MIN;
                columns[lx * CHUNK_SIZE + lz] = { wx, wz, biome, height, minY };
            }
        }

        // ──────────────────────────────────────────────────────────
        // Passes 2+3: Fill terrain & surface
        // ──────────────────────────────────────────────────────────
        for (let idx = 0; idx < columns.length; idx++) {
            const { wx, wz, biome, height, minY } = columns[idx];
            for (let y = minY; y <= Math.min(height, Y_MAX); y++) {
                const key = `${wx},${y},${wz}`;
                if (mundo.has(key)) continue;
                mundo.set(key, this._surfaceBlock(biome, y, height));
            }
        }

        // ──────────────────────────────────────────────────────────
        // Pass 4: Caves
        // ──────────────────────────────────────────────────────────
        if (this.enableCaves) {
            for (let idx = 0; idx < columns.length; idx++) {
                const { wx, wz, height, minY } = columns[idx];
                for (let y = Math.max(minY, Y_MIN + 1); y <= Math.min(height, Y_MAX); y++) {
                    const key = `${wx},${y},${wz}`;
                    const block = mundo.get(key);
                    if (block === undefined) continue;
                    // Only carve solid non-bedrock blocks
                    if (block === BLOCK.BEDROCK) continue;
                    if (this._isCave(wx, y, wz, height)) {
                        mundo.delete(key);
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────
        // Pass 5: Water & aquifers
        // ──────────────────────────────────────────────────────────
        for (let idx = 0; idx < columns.length; idx++) {
            const { wx, wz, biome, height, minY } = columns[idx];

            // Ocean / surface water: fill air above ocean floor up to sea level
            if (biome === BIOME.OCEAN || height < this.seaLevel) {
                for (let y = height + 1; y <= this.seaLevel; y++) {
                    this._setIfEmpty(mundo, wx, y, wz, BLOCK.WATER);
                }
            }

            // Aquifer filling in caves – only lava in deep areas
            // Small puddles in caves (very rare, single-block)
            if (this.enableAquifers) {
                for (let y = Math.max(minY, Y_MIN + 1); y <= Math.min(height, Y_MAX); y++) {
                    const key = `${wx},${y},${wz}`;
                    if (!mundo.has(key)) { // air pocket (cave)
                        if (y < -50) {
                            mundo.set(key, BLOCK.LAVA);
                        } else {
                            // Small puddles only: rare single-block water on cave floor
                            const below = mundo.get(`${wx},${y - 1},${wz}`);
                            if (below && below !== BLOCK.AIR && below !== BLOCK.WATER && below !== BLOCK.LAVA) {
                                const puddleRoll = hash3D(wx, y, wz, this.seed + 999);
                                if (puddleRoll < 0.008) { // 0.8% chance for small puddle
                                    mundo.set(key, BLOCK.WATER);
                                }
                            }
                        }
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────
        // Pass 6: Ores
        // ──────────────────────────────────────────────────────────
        if (this.enableOres) {
            for (let idx = 0; idx < columns.length; idx++) {
                const { wx, wz, height, minY } = columns[idx];
                for (let y = minY; y <= Math.min(height, Y_MAX); y++) {
                    const key = `${wx},${y},${wz}`;
                    if (mundo.get(key) !== BLOCK.STONE) continue;
                    const ore = this._oreAt(wx, y, wz, height);
                    if (ore !== BLOCK.STONE) mundo.set(key, ore);
                }
            }
        }

        // ──────────────────────────────────────────────────────────
        // Pass 6b: Stone variety (granite, diorite, andesite, deepslate)
        // ──────────────────────────────────────────────────────────
        for (let idx = 0; idx < columns.length; idx++) {
            const { wx, wz, height, minY } = columns[idx];
            for (let y = minY; y <= Math.min(height - 3, Y_MAX); y++) {
                const key = `${wx},${y},${wz}`;
                if (mundo.get(key) !== BLOCK.STONE) continue;
                const variant = this._stoneVariant(wx, y, wz);
                if (variant !== BLOCK.STONE) mundo.set(key, variant);
            }
        }

        // ──────────────────────────────────────────────────────────
        // Pass 7: Bedrock (executed before vegetation to ensure solidity)
        // ──────────────────────────────────────────────────────────
        if (!isTopOnly) {
            for (let idx = 0; idx < columns.length; idx++) {
                const { wx, wz } = columns[idx];
                for (let y = Y_MIN; y <= Y_MIN + 2; y++) {
                    if (this._bedrockAt(wx, y, wz)) {
                        mundo.set(`${wx},${y},${wz}`, BLOCK.BEDROCK);
                    }
                }
            }
        }

        // ──────────────────────────────────────────────────────────
        // Pass 8: Vegetation (trees, flowers, grass)
        // ──────────────────────────────────────────────────────────
        if (this.enableTrees) {
            for (let idx = 0; idx < columns.length; idx++) {
                const { wx, wz, biome, height } = columns[idx];
                if (height < this.seaLevel) continue; // skip underwater columns
                this._placeVegetation(mundo, wx, height, wz, biome);
            }
        }
    }
}

export { BLOCK };
