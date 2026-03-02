// hudScaler.js – Auto HUD Scaling System
// Detects screen size, aspect ratio, and applies global HUD scale
// Handles resize, orientation change, and fullscreen change

export class HudScaler {
    constructor() {
        this.scale = 1;
        this.debugEnabled = false;
        this._debugOverlays = [];
        this._boundUpdate = this._update.bind(this);

        this._update();
        window.addEventListener('resize', this._boundUpdate);
        window.addEventListener('orientationchange', () => {
            setTimeout(this._boundUpdate, 150);
        });
        document.addEventListener('fullscreenchange', this._boundUpdate);
    }

    _update() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (w < 500) this.scale = 0.70;
        else if (w < 700) this.scale = 0.85;
        else if (w < 1024) this.scale = 0.95;
        else this.scale = 1.0;

        // Apply global scale to HUD container
        const hud = document.getElementById('hud-wrapper');
        if (hud) {
            hud.style.transform = `scale(${this.scale})`;
            hud.style.transformOrigin = 'bottom center';
        }

        // Clamp all draggable HUD elements inside viewport
        this._clampAllElements();

        if (this.debugEnabled) this._drawDebug();
    }

    _clampAllElements() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        document.querySelectorAll('[data-hud-draggable]').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > w) el.style.left = (w - rect.width) + 'px';
            if (rect.bottom > h) el.style.top = (h - rect.height) + 'px';
            if (rect.left < 0) el.style.left = '0px';
            if (rect.top < 0) el.style.top = '0px';
        });
    }

    getScale() { return this.scale; }

    toggleDebug(enabled) {
        this.debugEnabled = enabled;
        if (!enabled) {
            this._debugOverlays.forEach(o => o.remove());
            this._debugOverlays = [];
        } else {
            this._drawDebug();
        }
    }

    _drawDebug() {
        this._debugOverlays.forEach(o => o.remove());
        this._debugOverlays = [];
        const selectors = [
            '#hotbar', '#mobile-controls', '#hud-bottom',
            '#inventory-menu', '#settings-panel', '#crosshair',
            '.dpad', '.action-btns', '.btn-pause'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position:absolute; pointer-events:none; z-index:99999;
                    border:2px solid red; background:rgba(255,0,0,0.1);
                `;
                const rect = el.getBoundingClientRect();
                overlay.style.left = rect.left + 'px';
                overlay.style.top = rect.top + 'px';
                overlay.style.width = rect.width + 'px';
                overlay.style.height = rect.height + 'px';
                document.body.appendChild(overlay);
                this._debugOverlays.push(overlay);
            });
        });
    }
}
