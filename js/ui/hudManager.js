// hudManager.js — Landscape overlay and HUD management for mobile
export class HudManager {
    constructor() {
        this.landscapeOverlay = null;
        this.isPortrait = false;
        this.onOrientationChange = null; // callback: (isPortrait) => {}
        this._init();
    }

    _init() {
        this._createLandscapeOverlay();
        this._bindOrientationEvents();
        this._checkOrientation();
        this._tryLockLandscape();
    }

    _createLandscapeOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'landscape-overlay';
        overlay.innerHTML = `
            <div class="landscape-overlay-content">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12" y2="18.01"/>
                    <path d="M7 22l3-3m0 0l3 3m-3-3v3" transform="translate(12,12) rotate(90) translate(-12,-12)" opacity="0.6"/>
                </svg>
                <svg class="rotate-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 2v6h-6"/>
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                </svg>
                <p>Gire o dispositivo para jogar</p>
                <p class="landscape-sub">Rotate device to play</p>
            </div>
        `;
        document.body.appendChild(overlay);
        this.landscapeOverlay = overlay;
    }

    _tryLockLandscape() {
        try {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        } catch (e) {
            // Fallback handled via CSS + listener
        }
    }

    _bindOrientationEvents() {
        window.addEventListener('resize', () => this._checkOrientation());
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => this._checkOrientation());
        }
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this._checkOrientation(), 100);
        });
    }

    _checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait !== this.isPortrait) {
            this.isPortrait = isPortrait;
            if (this.landscapeOverlay) {
                this.landscapeOverlay.classList.toggle('visible', isPortrait);
            }
            if (this.onOrientationChange) {
                this.onOrientationChange(isPortrait);
            }
        }
    }

    get shouldPauseRendering() {
        return this.isPortrait;
    }
}
