export class InputManager {
    constructor({ toggleKey = 'e', onToggleInventory = null }) {
        this.toggleKey = toggleKey.toLowerCase();
        this.onToggleInventory = onToggleInventory;
        this._boundKeydown = (e) => this._handleKeydown(e);
    }

    bindKeyboard() {
        document.addEventListener('keydown', this._boundKeydown);
    }

    unbindKeyboard() {
        document.removeEventListener('keydown', this._boundKeydown);
    }

    bindMobileToggle(buttonEl) {
        if (!buttonEl) return;
        const invoke = (e) => {
            if (e) e.preventDefault();
            if (typeof this.onToggleInventory === 'function') this.onToggleInventory();
        };
        buttonEl.addEventListener('touchstart', invoke, { passive: false });
        buttonEl.addEventListener('click', invoke);
    }

    _handleKeydown(event) {
        if (event.repeat) return;
        if ((event.key || '').toLowerCase() !== this.toggleKey) return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (typeof this.onToggleInventory === 'function') {
            event.preventDefault();
            this.onToggleInventory();
        }
    }
}
