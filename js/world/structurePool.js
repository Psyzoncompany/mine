export class StructurePool {
    constructor(noise, seedX, seedZ) {
        this.noise = noise;
        this.seedX = seedX;
        this.seedZ = seedZ;

        this.templates = {
            small_house:  { width: 5, depth: 5, beds: 1, workstations: [] },
            medium_house: { width: 7, depth: 7, beds: 2, workstations: [] },
            farm:         { width: 7, depth: 7, beds: 0, workstations: [{ type: 'composter' }] },
            blacksmith:   { width: 7, depth: 7, beds: 1, workstations: [{ type: 'smithing_table' }] },
            library:      { width: 7, depth: 5, beds: 1, workstations: [{ type: 'lectern' }] },
            stable:       { width: 9, depth: 5, beds: 0, workstations: [] },
            market_stall: { width: 3, depth: 3, beds: 0, workstations: [{ type: 'smoker' }] }
        };

        // Cumulative probability thresholds for structure selection
        this.structureWeights = [
            { type: 'small_house',  threshold: 0.30 },
            { type: 'medium_house', threshold: 0.50 },
            { type: 'farm',         threshold: 0.65 },
            { type: 'blacksmith',   threshold: 0.75 },
            { type: 'library',      threshold: 0.85 },
            { type: 'stable',       threshold: 0.95 },
            { type: 'market_stall', threshold: 1.00 }
        ];

        this.MIN_SPACING = 12;
    }

    _seededRandom(x, z, salt) {
        const v = this.noise.noise(
            x * 0.7631 + this.seedX + salt,
            salt * 0.3179,
            z * 0.8317 + this.seedZ + salt
        );
        return (v + 1) / 2;
    }

    _selectStructureType(x, z) {
        const roll = this._seededRandom(x, z, 777);
        for (const entry of this.structureWeights) {
            if (roll < entry.threshold) return entry.type;
        }
        return 'market_stall';
    }

    _hasOverlap(newX, newZ, newW, newD, placed) {
        for (const s of placed) {
            const dx = Math.abs(newX - s.x);
            const dz = Math.abs(newZ - s.z);
            if (dx < (newW + s.width) / 2 + 2 && dz < (newD + s.depth) / 2 + 2) {
                return true;
            }
        }
        return false;
    }

    _tooCloseToRoads(sx, sz, width, depth, roads) {
        const halfW = width / 2;
        const halfD = depth / 2;
        for (const block of roads) {
            if (block.x >= sx - halfW && block.x <= sx + halfW &&
                block.z >= sz - halfD && block.z <= sz + halfD) {
                return true;
            }
        }
        return false;
    }

    _buildStructure(type, x, z, baseY) {
        const tmpl = this.templates[type];
        const w = tmpl.width;
        const d = tmpl.depth;

        const beds = [];
        for (let i = 0; i < tmpl.beds; i++) {
            beds.push({
                x: x + 1 + i * 2,
                y: baseY + 1,
                z: z + 1
            });
        }

        const workstations = [];
        for (let i = 0; i < tmpl.workstations.length; i++) {
            workstations.push({
                x: x + w - 2,
                y: baseY + 1,
                z: z + 1 + i * 2,
                type: tmpl.workstations[i].type
            });
        }

        return { type, x, z, width: w, depth: d, beds, workstations };
    }

    placeStructures(centerX, centerZ, baseY, radius, roads, biome) {
        const placed = [];

        // Collect candidate positions from road blocks at intervals
        const candidates = [];
        const seen = new Set();
        const step = this.MIN_SPACING;

        for (const block of roads) {
            // Quantize to grid so we don't test every single road block
            const gx = Math.round(block.x / step) * step;
            const gz = Math.round(block.z / step) * step;
            const key = `${gx},${gz}`;
            if (seen.has(key)) continue;
            seen.add(key);

            // Offset building from road using seeded direction
            const offsetRand = this._seededRandom(gx, gz, 123);
            const offsetDist = 4 + offsetRand * 2; // 4-6 blocks
            const sideRand = this._seededRandom(gx, gz, 456);
            const angle = sideRand * Math.PI * 2;
            const bx = Math.round(gx + Math.cos(angle) * offsetDist);
            const bz = Math.round(gz + Math.sin(angle) * offsetDist);

            // Must be within village radius
            const dx = bx - centerX;
            const dz = bz - centerZ;
            if (dx * dx + dz * dz > radius * radius) continue;

            candidates.push({ x: bx, z: bz });
        }

        for (const cand of candidates) {
            const type = this._selectStructureType(cand.x, cand.z);
            const tmpl = this.templates[type];

            // Check minimum spacing against already placed structures
            let tooClose = false;
            for (const s of placed) {
                const dx = cand.x - s.x;
                const dz = cand.z - s.z;
                if (dx * dx + dz * dz < this.MIN_SPACING * this.MIN_SPACING) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            // Check for overlap with other structures and roads
            if (this._hasOverlap(cand.x, cand.z, tmpl.width, tmpl.depth, placed)) continue;
            if (this._tooCloseToRoads(cand.x, cand.z, tmpl.width, tmpl.depth, roads)) continue;

            placed.push(this._buildStructure(type, cand.x, cand.z, baseY));
        }

        return placed;
    }
}
