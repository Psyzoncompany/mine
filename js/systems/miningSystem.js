// miningSystem.js – Improved block breaking system
// Hold-to-break, crack animation stages, block hardness, cancel on aim change

export class MiningSystem {
    constructor() {
        this.isBreaking = false;
        this.breakProgress = 0;
        this.breakTarget = null; // {x,y,z} block position key
        this.breakTime = 1.0; // total time to break current block
        this._overlay = null;
        this._crackCanvas = null;
        this._crackCtx = null;
        this._currentStage = -1;
        this._initOverlay();
    }

    static UNBREAKABLE = 999;
    // Block hardness (seconds to break by hand)
    static HARDNESS = {
        1: 0.6,   // grass
        2: 0.7,   // dirt
        3: 1.4,   // stone
        4: 1.0,   // wood
        5: 0.3,   // leaves
        6: MiningSystem.UNBREAKABLE, // water (unbreakable by hand)
        7: 0.6,   // sand
        9: 1.2,   // crafting table (bancada)
        10: 1.5,  // coal ore
        11: 2.0,  // iron ore
        12: 2.5,  // gold ore
        13: 3.0,  // diamond ore
        14: 0.8,  // planks
        15: 0.1,  // short grass (instant)
        22: 1.4,  // furnace
        30: 0.1,  // flower
        31: 1.4,  // granite
        32: 1.4,  // diorite
        33: 1.4,  // andesite
        34: 2.0,  // deepslate
        35: 2.0,  // copper ore
        // Lã (todas as cores)
        40: 0.4, 41: 0.4, 42: 0.4, 43: 0.4, 44: 0.4, 45: 0.4, 46: 0.4, 47: 0.4,
        48: 0.4, 49: 0.4, 50: 0.4, 51: 0.4, 52: 0.4, 53: 0.4, 54: 0.4, 55: 0.4,
        25: 0.5,  // snow block
        // Redstone
        56: 3.0,  // redstone ore
        57: 0.5,  // redstone block
        58: 0,    // redstone dust (instant)
        59: 0,    // redstone torch on (instant)
        60: 0,    // redstone torch off (instant)
        61: 0.3,  // redstone lamp off
        62: 0.3,  // redstone lamp on
        63: 0,    // lever (instant)
        64: 0,    // lever on (instant)
        65: 0,    // repeater off (instant)
        66: 0,    // repeater on (instant)
        67: 0,    // comparator off (instant)
        68: 0,    // comparator on (instant)
        69: 0.5,  // piston
        70: 0.5,  // sticky piston
        71: 3.5,  // dispenser
        72: 3.5,  // dropper
    };

    // Tool speed multipliers: { toolCategory: { blockType: multiplier } }
    static TOOL_SPEED = {
        pickaxe: { 3: 3, 10: 3, 11: 4, 12: 4, 13: 5, 22: 3, 31: 3, 32: 3, 33: 3, 34: 4, 35: 4, 56: 3, 57: 3, 61: 3, 62: 3, 69: 3, 70: 3, 71: 3, 72: 3 },
        axe: { 4: 3, 5: 3, 9: 3, 14: 3 },
        shovel: { 1: 3, 2: 3, 7: 3, 25: 3 }
    };

    getBreakTime(blockType, toolCategory, isCreative) {
        if (isCreative) return 0; // instant in creative
        const base = MiningSystem.HARDNESS[blockType] ?? 1.0;
        let mult = 1;
        if (toolCategory && MiningSystem.TOOL_SPEED[toolCategory]) {
            mult = MiningSystem.TOOL_SPEED[toolCategory][blockType] || 1;
        }
        return base / mult;
    }

    startBreaking(blockKey, blockType, toolCategory, isCreative) {
        this.breakTarget = blockKey;
        this.breakProgress = 0;
        this.breakTime = this.getBreakTime(blockType, toolCategory, isCreative);
        this.isBreaking = true;
        this._currentStage = -1;
    }

    updateBreaking(delta, currentBlockKey) {
        if (!this.isBreaking) return { done: false, stage: -1 };

        // Cancel if aim changed
        if (currentBlockKey !== this.breakTarget) {
            this.cancelBreaking();
            return { done: false, stage: -1, cancelled: true };
        }

        this.breakProgress += delta;
        const progress = Math.min(1, this.breakProgress / this.breakTime);
        const stage = Math.floor(progress * 10);

        if (stage !== this._currentStage) {
            this._currentStage = stage;
            this._drawCrackStage(stage);
        }

        if (progress >= 1) {
            this.cancelBreaking();
            return { done: true, stage: 10 };
        }

        return { done: false, stage, progress };
    }

    cancelBreaking() {
        this.isBreaking = false;
        this.breakProgress = 0;
        this.breakTarget = null;
        this._currentStage = -1;
        this._hideCrackOverlay();
    }

    // Show crack overlay at screen position
    showCrackAt(screenX, screenY, size) {
        if (!this._overlay) return;
        this._overlay.style.display = 'block';
        this._overlay.style.left = (screenX - size / 2) + 'px';
        this._overlay.style.top = (screenY - size / 2) + 'px';
        this._overlay.style.width = size + 'px';
        this._overlay.style.height = size + 'px';
    }

    _initOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'crack-overlay';
        overlay.style.cssText = `
            display:none; position:fixed; pointer-events:none; z-index:10;
        `;
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        canvas.style.cssText = 'width:100%;height:100%;image-rendering:pixelated;';
        overlay.appendChild(canvas);
        document.body.appendChild(overlay);
        this._overlay = overlay;
        this._crackCanvas = canvas;
        this._crackCtx = canvas.getContext('2d');
    }

    _drawCrackStage(stage) {
        const ctx = this._crackCtx;
        if (!ctx) return;
        const s = 64;
        ctx.clearRect(0, 0, s, s);
        if (stage < 0) return;

        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2;

        // Procedural crack lines based on stage (0-9)
        const lines = [
            [[32, 0], [32, 20]],
            [[10, 10], [40, 30]],
            [[50, 5], [20, 50]],
            [[5, 40], [60, 40]],
            [[0, 20], [64, 50]],
            [[20, 0], [50, 64]],
            [[40, 10], [10, 60]],
            [[0, 50], [64, 20]],
            [[15, 0], [45, 64]],
            [[0, 0], [64, 64]],
        ];

        for (let i = 0; i <= Math.min(stage, lines.length - 1); i++) {
            const [start, end] = lines[i];
            ctx.beginPath();
            ctx.moveTo(start[0], start[1]);
            ctx.lineTo(end[0], end[1]);
            ctx.stroke();
        }

        // Darken as progress increases
        ctx.fillStyle = `rgba(0,0,0,${stage * 0.03})`;
        ctx.fillRect(0, 0, s, s);
    }

    _hideCrackOverlay() {
        if (this._overlay) this._overlay.style.display = 'none';
        if (this._crackCtx) this._crackCtx.clearRect(0, 0, 64, 64);
    }
}
