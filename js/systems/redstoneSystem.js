// redstoneSystem.js – Redstone signal propagation and block state management
// Supports: Redstone Ore, Redstone Block, Redstone Dust, Redstone Torch,
//           Redstone Lamp, Lever, Repeater, Comparator, Piston, Sticky Piston,
//           Dispenser, Dropper

export class RedstoneSystem {
    // ── Block IDs ────────────────────────────────────────────────────
    static REDSTONE_ORE       = 56;
    static REDSTONE_BLOCK     = 57;
    static REDSTONE_DUST      = 58;
    static REDSTONE_TORCH_ON  = 59;
    static REDSTONE_TORCH_OFF = 60;
    static REDSTONE_LAMP_OFF  = 61;
    static REDSTONE_LAMP_ON   = 62;
    static LEVER_OFF          = 63;
    static LEVER_ON           = 64;
    static REPEATER_OFF       = 65;
    static REPEATER_ON        = 66;
    static COMPARATOR_OFF     = 67;
    static COMPARATOR_ON      = 68;
    static PISTON             = 69;
    static STICKY_PISTON      = 70;
    static DISPENSER          = 71;
    static DROPPER            = 72;

    // Set of IDs that are Redstone-related
    static REDSTONE_IDS = new Set([
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72
    ]);

    // IDs that can be powered/activated by Redstone signal
    static ACTIVATABLE_IDS = new Set([61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]);

    constructor(mundo, recriarChunkVisualFn) {
        this.mundo = mundo;
        this.recriarChunkVisual = recriarChunkVisualFn;
        // powerMap: blockKey -> power level (0–15) received at that position
        this.powerMap = new Map();
        this._pendingRecompute = false;
        this.CHUNK_SIZE = 16;
    }

    // ── Public API ───────────────────────────────────────────────────

    /** Notify system that a block changed at (x,y,z). */
    notifyChange(x, y, z) {
        this._scheduleRecompute();
    }

    /** Toggle lever at (x,y,z). Returns new state (true = ON). */
    toggleLever(x, y, z) {
        const key = `${x},${y},${z}`;
        const type = this.mundo.get(key);
        const RS = RedstoneSystem;
        if (type === RS.LEVER_OFF) {
            this.mundo.set(key, RS.LEVER_ON);
        } else if (type === RS.LEVER_ON) {
            this.mundo.set(key, RS.LEVER_OFF);
        } else {
            return false;
        }
        this._recompute();
        this.recriarChunkVisual(x, y, z);
        return this.mundo.get(key) === RS.LEVER_ON;
    }

    /** Get power level received at (x,y,z). 0 = off, 1–15 = on. */
    getPower(x, y, z) {
        return this.powerMap.get(`${x},${y},${z}`) || 0;
    }

    /** Returns true if the block at (x,y,z) receives any Redstone power. */
    isPowered(x, y, z) {
        return this.getPower(x, y, z) > 0;
    }

    /** Returns true if the block type ID is a Redstone component. */
    isRedstoneBlock(id) {
        return RedstoneSystem.REDSTONE_IDS.has(id);
    }

    // ── Internal logic ───────────────────────────────────────────────

    _scheduleRecompute() {
        if (this._pendingRecompute) return;
        this._pendingRecompute = true;
        setTimeout(() => {
            this._pendingRecompute = false;
            this._recompute();
        }, 50);
    }

    /**
     * Full recompute of Redstone power across the world.
     * Uses BFS from all power sources through Redstone dust.
     * Then updates lamp and torch states.
     */
    _recompute() {
        const RS = RedstoneSystem;
        const newPowerMap = new Map();
        const queue = []; // {x, y, z, power}

        // ── Phase 1: Collect power sources ──────────────────────────
        this.mundo.forEach((type, key) => {
            const [x, y, z] = key.split(',').map(Number);
            let sourcePower = 0;

            if (type === RS.REDSTONE_BLOCK) {
                sourcePower = 15;
            } else if (type === RS.LEVER_ON) {
                sourcePower = 15;
            } else if (type === RS.REDSTONE_TORCH_ON) {
                sourcePower = 15;
            }

            if (sourcePower > 0) {
                newPowerMap.set(key, sourcePower);
                queue.push({ x, y, z, power: sourcePower });
            }
        });

        // ── Phase 2: BFS propagation through dust / repeaters ───────
        let head = 0;
        while (head < queue.length) {
            const { x, y, z, power } = queue[head++];
            if (power <= 0) continue;

            for (const [nx, ny, nz] of this._neighbors(x, y, z)) {
                const nKey = `${nx},${ny},${nz}`;
                const nType = this.mundo.get(nKey);
                if (!nType) continue;

                let nextPower = 0;
                if (nType === RS.REDSTONE_DUST) {
                    nextPower = power - 1; // Dust loses 1 per block
                } else if (nType === RS.REPEATER_OFF || nType === RS.REPEATER_ON) {
                    nextPower = 15; // Repeater amplifies to full strength
                } else if (nType === RS.COMPARATOR_OFF || nType === RS.COMPARATOR_ON) {
                    nextPower = power; // Comparator passes through (simplified)
                } else {
                    // Solid blocks adjacent to sources get weak power
                    nextPower = power;
                }

                if (nextPower > 0 && nextPower > (newPowerMap.get(nKey) || 0)) {
                    newPowerMap.set(nKey, nextPower);
                    queue.push({ x: nx, y: ny, z: nz, power: nextPower });
                }
            }
        }

        this.powerMap = newPowerMap;

        // ── Phase 3: Update stateful block IDs based on power ────────
        const changedChunks = new Set();

        this.mundo.forEach((type, key) => {
            const [x, y, z] = key.split(',').map(Number);

            // Redstone Lamp: on ↔ off
            if (type === RS.REDSTONE_LAMP_OFF || type === RS.REDSTONE_LAMP_ON) {
                const powered = this._anyNeighborPowered(x, y, z, newPowerMap) ||
                                (newPowerMap.get(key) || 0) > 0;
                const wasOn = type === RS.REDSTONE_LAMP_ON;
                if (powered !== wasOn) {
                    this.mundo.set(key, powered ? RS.REDSTONE_LAMP_ON : RS.REDSTONE_LAMP_OFF);
                    this._markChunkDirty(x, z, changedChunks);
                }
            }

            // Redstone Torch: turns off when its host block is powered
            if (type === RS.REDSTONE_TORCH_ON || type === RS.REDSTONE_TORCH_OFF) {
                // The block a wall torch is attached to is the block below it
                const belowKey = `${x},${y - 1},${z}`;
                const hostPowered = (newPowerMap.get(belowKey) || 0) > 0;
                const wasOn = type === RS.REDSTONE_TORCH_ON;
                if (hostPowered && wasOn) {
                    this.mundo.set(key, RS.REDSTONE_TORCH_OFF);
                    this._markChunkDirty(x, z, changedChunks);
                } else if (!hostPowered && !wasOn) {
                    this.mundo.set(key, RS.REDSTONE_TORCH_ON);
                    this._markChunkDirty(x, z, changedChunks);
                }
            }

            // Repeater: update visual state
            if (type === RS.REPEATER_OFF || type === RS.REPEATER_ON) {
                const powered = (newPowerMap.get(key) || 0) > 0;
                const wasOn = type === RS.REPEATER_ON;
                if (powered !== wasOn) {
                    this.mundo.set(key, powered ? RS.REPEATER_ON : RS.REPEATER_OFF);
                    this._markChunkDirty(x, z, changedChunks);
                }
            }

            // Comparator: update visual state
            if (type === RS.COMPARATOR_OFF || type === RS.COMPARATOR_ON) {
                const powered = (newPowerMap.get(key) || 0) > 0;
                const wasOn = type === RS.COMPARATOR_ON;
                if (powered !== wasOn) {
                    this.mundo.set(key, powered ? RS.COMPARATOR_ON : RS.COMPARATOR_OFF);
                    this._markChunkDirty(x, z, changedChunks);
                }
            }
        });

        // ── Phase 4: Rebuild changed chunks ─────────────────────────
        for (const chunkKey of changedChunks) {
            const [cx, cz] = chunkKey.split(',').map(Number);
            this.recriarChunkVisual(cx * this.CHUNK_SIZE, 0, cz * this.CHUNK_SIZE);
        }
    }

    _anyNeighborPowered(x, y, z, powerMap) {
        for (const [nx, ny, nz] of this._neighbors(x, y, z)) {
            if ((powerMap.get(`${nx},${ny},${nz}`) || 0) > 0) return true;
        }
        return false;
    }

    _markChunkDirty(x, z, set) {
        const cx = Math.floor(x / this.CHUNK_SIZE);
        const cz = Math.floor(z / this.CHUNK_SIZE);
        set.add(`${cx},${cz}`);
    }

    _neighbors(x, y, z) {
        return [
            [x + 1, y, z], [x - 1, y, z],
            [x, y + 1, z], [x, y - 1, z],
            [x, y, z + 1], [x, y, z - 1],
        ];
    }
}
