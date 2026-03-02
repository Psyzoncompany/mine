// InputRouter.js — Global mobile input router
// ALL touch input passes through this system.
// Priority: 1) UI elements  2) Joystick  3) Game world (combat/mining/placing)

export class InputRouter {
    constructor() {
        // Touch state tracking
        this.activeTouchId = null;
        this.touchState = 'none'; // 'none' | 'tap' | 'hold' | 'drag'
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchLastX = 0;
        this.touchLastY = 0;
        this.touchStartTime = 0;
        this.totalMovement = 0;

        // Gesture thresholds
        this.TAP_MAX_DURATION = 180;   // ms — tap detection
        this.TAP_MAX_MOVEMENT = 12;    // px — tap detection
        this.HOLD_THRESHOLD = 300;     // ms — hold-to-mine start
        this.DRAG_THRESHOLD = 12;      // px — camera drag start

        // Mutual exclusion states
        this.isDraggingCamera = false;
        this.isMining = false;
        this.isAttacking = false;

        // Mining tolerance (Bedrock-style)
        this.miningAngleTolerance = 6;       // degrees
        this.miningPositionTolerance = 0.15; // units
        this.miningBlockChangeTimeout = 120; // ms
        this._miningBlockChangedAt = 0;
        this._lastMiningTarget = null;

        // Hold timer
        this._holdTimer = null;

        // Callbacks
        this.onTap = null;          // (x, y) => {}  — attack
        this.onHoldStart = null;    // (x, y) => {}  — start mining
        this.onHoldEnd = null;      // () => {}       — stop mining
        this.onDrag = null;         // (dx, dy) => {} — camera look
        this.onTouchStart = null;   // (x, y) => {}   — any touch start on canvas
        this.onTouchEnd = null;     // () => {}        — any touch end on canvas
    }

    /**
     * Check if a touch event targets a UI element.
     * UI elements have data-ui="true" or are inside a [data-ui="true"] parent.
     */
    isUIElement(x, y) {
        const el = document.elementFromPoint(x, y);
        if (!el) return false;
        // Check element and ancestors for data-ui attribute
        const uiEl = el.closest('[data-ui="true"]');
        if (uiEl) return true;
        // Also block if touching known UI containers
        const uiSelectors = '#mobile-controls, #hotbar, #inventory-menu, #furnace-menu, #creative-menu, #menu, #settings-panel, #gamemode-selector, #recipe-book-modal, #hud-bottom';
        if (el.closest(uiSelectors)) return true;
        return false;
    }

    /**
     * Check if a touch targets the joystick zone
     */
    isJoystickZone(x, y) {
        const el = document.elementFromPoint(x, y);
        if (!el) return false;
        return !!el.closest('.joystick-zone, .dpad, .dpad-btn');
    }

    /**
     * Attach to the game canvas for touch routing
     */
    attach(canvas) {
        this._canvas = canvas;

        canvas.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', (e) => this._onTouchEnd(e), { passive: false });
    }

    _onTouchStart(e) {
        e.preventDefault();

        // Only track first touch — ignore secondary touches (pointer safety)
        if (this.activeTouchId !== null) return;

        const t = e.changedTouches[0];

        // Priority 1: UI elements — don't intercept
        if (this.isUIElement(t.clientX, t.clientY)) return;

        // Priority 2: Joystick — don't intercept
        if (this.isJoystickZone(t.clientX, t.clientY)) return;

        // Priority 3: Game world input
        this.activeTouchId = t.identifier;
        this.touchStartX = this.touchLastX = t.clientX;
        this.touchStartY = this.touchLastY = t.clientY;
        this.touchStartTime = performance.now();
        this.totalMovement = 0;
        this.touchState = 'pending';
        this.isDraggingCamera = false;
        this.isMining = false;
        this.isAttacking = false;

        if (this.onTouchStart) this.onTouchStart(t.clientX, t.clientY);

        // Start hold timer for mining
        this._clearHoldTimer();
        this._holdTimer = setTimeout(() => {
            if (this.touchState === 'pending' && this.totalMovement < this.DRAG_THRESHOLD) {
                this.touchState = 'hold';
                this.isMining = true;
                if (this.onHoldStart) this.onHoldStart(this.touchStartX, this.touchStartY);
            }
        }, this.HOLD_THRESHOLD);
    }

    _onTouchMove(e) {
        e.preventDefault();

        for (const t of e.changedTouches) {
            if (t.identifier !== this.activeTouchId) continue;

            const dx = t.clientX - this.touchLastX;
            const dy = t.clientY - this.touchLastY;
            const moveDist = Math.sqrt(
                (t.clientX - this.touchStartX) ** 2 +
                (t.clientY - this.touchStartY) ** 2
            );
            this.totalMovement = moveDist;

            // Determine if this is a drag
            if (this.touchState === 'pending' && moveDist > this.DRAG_THRESHOLD) {
                this._clearHoldTimer();
                this.touchState = 'drag';
                this.isDraggingCamera = true;
            }

            // If already mining (hold state), allow camera movement while mining continues
            if (this.touchState === 'hold') {
                // Camera drag during mining is allowed (Bedrock behavior)
                if (this.onDrag) this.onDrag(dx, dy);
            }

            // If dragging camera
            if (this.touchState === 'drag') {
                if (this.onDrag) this.onDrag(dx, dy);
            }

            this.touchLastX = t.clientX;
            this.touchLastY = t.clientY;
        }
    }

    _onTouchEnd(e) {
        for (const t of e.changedTouches) {
            if (t.identifier !== this.activeTouchId) continue;

            this._clearHoldTimer();
            const elapsed = performance.now() - this.touchStartTime;

            // Tap detection: short duration + minimal movement
            if (this.touchState === 'pending' &&
                elapsed < this.TAP_MAX_DURATION &&
                this.totalMovement < this.TAP_MAX_MOVEMENT) {
                this.touchState = 'tap';
                this.isAttacking = true;
                if (this.onTap) this.onTap(this.touchStartX, this.touchStartY);
            }

            // End mining if was holding
            if (this.isMining) {
                if (this.onHoldEnd) this.onHoldEnd();
            }

            if (this.onTouchEnd) this.onTouchEnd();

            // Reset state
            this.activeTouchId = null;
            this.touchState = 'none';
            this.isDraggingCamera = false;
            this.isMining = false;
            this.isAttacking = false;
        }
    }

    _clearHoldTimer() {
        if (this._holdTimer) {
            clearTimeout(this._holdTimer);
            this._holdTimer = null;
        }
    }

    /**
     * Check if a mining target change should cancel mining.
     * Returns true if mining should persist (within tolerance).
     */
    shouldPersistMining(prevTarget, newTarget, angleDiff) {
        if (!prevTarget || !newTarget) return false;

        // Same block — always persist
        if (prevTarget.x === newTarget.x &&
            prevTarget.y === newTarget.y &&
            prevTarget.z === newTarget.z) {
            this._miningBlockChangedAt = 0;
            return true;
        }

        // Angle tolerance check
        if (angleDiff !== undefined && angleDiff < this.miningAngleTolerance) {
            return true;
        }

        // Position delta check
        const dx = newTarget.x - prevTarget.x;
        const dy = newTarget.y - prevTarget.y;
        const dz = newTarget.z - prevTarget.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < this.miningPositionTolerance) {
            return true;
        }

        // Different block — start timeout
        if (this._miningBlockChangedAt === 0) {
            this._miningBlockChangedAt = performance.now();
            return true; // Grace period
        }

        // Cancel if different block for too long
        if (performance.now() - this._miningBlockChangedAt > this.miningBlockChangeTimeout) {
            this._miningBlockChangedAt = 0;
            return false;
        }

        return true; // Still in grace period
    }

    /**
     * Reset mining persistence tracking
     */
    resetMiningPersistence() {
        this._miningBlockChangedAt = 0;
        this._lastMiningTarget = null;
    }
}
