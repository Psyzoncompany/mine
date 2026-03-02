export class RoadGenerator {
    constructor(noise, seedX, seedZ) {
        this.noise = noise;
        this.seedX = seedX;
        this.seedZ = seedZ;
        this.placed = new Map();
        this.nodes = [];
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
        return (v + 1) / 2;
    }

    /**
     * Generate a road network radiating from center.
     * Returns array of {x, y, z, type} block objects.
     */
    generate(centerX, centerZ, baseY, radius, pathBlockId) {
        this.placed.clear();
        this.nodes.length = 0;
        this.centerX = centerX;
        this.centerZ = centerZ;

        const numRoads = 3 + Math.floor(this._seededRandom(centerX, centerZ, 100) * 3); // 3-5

        for (let i = 0; i < numRoads; i++) {
            const angle = (i / numRoads) * Math.PI * 2
                + (this._seededRandom(i, centerZ, 200 + i) - 0.5) * 0.4;
            const length = 10 + Math.floor(this._seededRandom(centerX + i, centerZ, 300 + i) * 21); // 10-30
            this._buildRoad(centerX, centerZ, baseY, angle, length, radius, pathBlockId, 0, i * 1000);
        }

        const blocks = [];
        for (const [key, type] of this.placed) {
            const [x, y, z] = key.split(',').map(Number);
            blocks.push({ x, y, z, type });
        }
        return blocks;
    }

    /**
     * Build a single road segment with optional branching.
     */
    _buildRoad(startX, startZ, baseY, angle, length, radius, pathBlockId, depth, saltBase) {
        let cx = startX;
        let cz = startZ;
        let dir = angle;
        let stepsSinceNode = 0;

        for (let step = 0; step < length; step++) {
            // Gentle turn: adjust direction slightly
            const turnAmount = (this._seededRandom(cx, cz, saltBase + step * 7) - 0.5) * 0.3;
            dir += turnAmount;

            cx += Math.cos(dir);
            cz += Math.sin(dir);

            const bx = Math.round(cx);
            const bz = Math.round(cz);

            // Stay within radius of village center
            const distSq = (bx - this.centerX) * (bx - this.centerX) + (bz - this.centerZ) * (bz - this.centerZ);
            if (distSq > radius * radius) break;

            // Place road blocks (2 blocks wide perpendicular to direction)
            const perpX = -Math.sin(dir);
            const perpZ = Math.cos(dir);
            const width = 2;
            for (let w = 0; w < width; w++) {
                const offset = w - (width - 1) / 2;
                const px = Math.round(bx + perpX * offset);
                const pz = Math.round(bz + perpZ * offset);
                const key = `${px},${baseY},${pz}`;
                if (!this.placed.has(key)) {
                    this.placed.set(key, pathBlockId);
                }
            }

            // Building attachment nodes every 8-12 blocks
            stepsSinceNode++;
            const nodeInterval = 8 + Math.floor(this._seededRandom(bx, bz, saltBase + 500) * 5); // 8-12
            if (stepsSinceNode >= nodeInterval) {
                stepsSinceNode = 0;
                // Place node on one side of the road
                const side = this._seededRandom(bx, bz, saltBase + 600) > 0.5 ? 1 : -1;
                this.nodes.push({
                    x: Math.round(bx + perpX * side * 3),
                    z: Math.round(bz + perpZ * side * 3),
                    direction: Math.atan2(perpZ * side, perpX * side)
                });
            }

            // Branching: ~20% chance, max depth 2
            if (depth < 2 && step > 3) {
                const branchChance = this._seededRandom(bx, bz, saltBase + step * 13 + 900);
                if (branchChance < 0.20) {
                    const branchDir = dir + (this._seededRandom(bx, bz, saltBase + step * 17 + 950) > 0.5 ? 1 : -1) * (Math.PI / 2);
                    const branchLen = 6 + Math.floor(this._seededRandom(bx, bz, saltBase + step * 19 + 970) * 12);
                    this._buildRoad(bx, bz, baseY, branchDir, branchLen, radius, pathBlockId, depth + 1, saltBase + step * 100 + 10000);
                }
            }
        }
    }

    /**
     * Returns building attachment points along generated roads.
     * Each node: {x, z, direction} where direction indicates facing angle.
     */
    getNodes() {
        return this.nodes;
    }
}
