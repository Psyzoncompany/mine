// hudEditMode.js – Movable HUD Edit Mode (Drag & Drop)
// Allows repositioning HUD elements with touch/pointer drag
// Saves positions in localStorage, provides reset

const STORAGE_KEY = 'meucraft_hud_positions';

const DRAGGABLE_IDS = [
    'hotbar',
    'mobile-controls',
    'crosshair',
    'hud-bottom',
    'btn-mobile-pause'
];

export class HudEditMode {
    constructor() {
        this.enabled = false;
        this._handles = [];
        this._dragState = null;
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
    }

    toggle(enabled) {
        this.enabled = enabled;
        if (enabled) {
            this._showHandles();
            document.addEventListener('pointerdown', this._onPointerDown, { passive: false });
            document.addEventListener('pointermove', this._onPointerMove, { passive: false });
            document.addEventListener('pointerup', this._onPointerUp);
        } else {
            this._hideHandles();
            document.removeEventListener('pointerdown', this._onPointerDown);
            document.removeEventListener('pointermove', this._onPointerMove);
            document.removeEventListener('pointerup', this._onPointerUp);
        }
    }

    _showHandles() {
        this._hideHandles();
        DRAGGABLE_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.setAttribute('data-hud-draggable', 'true');
            const handle = document.createElement('div');
            handle.className = 'hud-edit-handle';
            handle.dataset.targetId = id;
            handle.style.cssText = `
                position:absolute; top:-8px; left:-8px; right:-8px; bottom:-8px;
                border:2px dashed rgba(255,255,0,0.8);
                background:rgba(255,255,0,0.08);
                pointer-events:auto; cursor:move; z-index:99999;
                border-radius:4px;
            `;
            handle.innerHTML = `<span style="position:absolute;top:2px;left:2px;font-size:7px;color:#ff0;font-family:monospace;text-shadow:1px 1px #000;">⊞ ${id}</span>`;
            el.style.position = el.style.position || 'absolute';
            el.appendChild(handle);
            this._handles.push(handle);
        });
    }

    _hideHandles() {
        this._handles.forEach(h => h.remove());
        this._handles = [];
        DRAGGABLE_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.removeAttribute('data-hud-draggable');
        });
    }

    _onPointerDown(e) {
        if (!this.enabled) return;
        const handle = e.target.closest('.hud-edit-handle');
        if (!handle) return;
        e.preventDefault();
        e.stopPropagation();
        const targetId = handle.dataset.targetId;
        const el = document.getElementById(targetId);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        this._dragState = {
            el,
            startX: e.clientX,
            startY: e.clientY,
            origLeft: rect.left,
            origTop: rect.top,
            id: targetId
        };
        el.setPointerCapture?.(e.pointerId);
    }

    _onPointerMove(e) {
        if (!this._dragState) return;
        e.preventDefault();
        const { el, startX, startY, origLeft, origTop } = this._dragState;
        let newLeft = origLeft + (e.clientX - startX);
        let newTop = origTop + (e.clientY - startY);

        // Clamp inside viewport
        const w = window.innerWidth;
        const h = window.innerHeight;
        const rect = el.getBoundingClientRect();
        newLeft = Math.max(0, Math.min(newLeft, w - rect.width));
        newTop = Math.max(0, Math.min(newTop, h - rect.height));

        // Snap to edges (8px threshold)
        if (newLeft < 8) newLeft = 0;
        if (newTop < 8) newTop = 0;
        if (newLeft + rect.width > w - 8) newLeft = w - rect.width;
        if (newTop + rect.height > h - 8) newTop = h - rect.height;

        el.style.position = 'fixed';
        el.style.left = newLeft + 'px';
        el.style.top = newTop + 'px';
        el.style.transform = 'none';
        el.style.bottom = 'auto';
        el.style.right = 'auto';
    }

    _onPointerUp() {
        if (!this._dragState) return;
        this._savePosition(this._dragState.id, this._dragState.el);
        this._dragState = null;
    }

    _savePosition(id, el) {
        const positions = this._loadAll();
        const rect = el.getBoundingClientRect();
        positions[id] = {
            left: rect.left / window.innerWidth,
            top: rect.top / window.innerHeight
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    }

    _loadAll() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch { return {}; }
    }

    restorePositions() {
        const positions = this._loadAll();
        Object.entries(positions).forEach(([id, pos]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.position = 'fixed';
            el.style.left = (pos.left * window.innerWidth) + 'px';
            el.style.top = (pos.top * window.innerHeight) + 'px';
            el.style.transform = 'none';
            el.style.bottom = 'auto';
            el.style.right = 'auto';
        });
    }

    resetPositions() {
        localStorage.removeItem(STORAGE_KEY);
        DRAGGABLE_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';
            el.style.transform = '';
            el.style.bottom = '';
            el.style.right = '';
        });
    }
}
