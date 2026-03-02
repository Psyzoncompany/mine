// addToHomeScreen.js – PWA Add to Home Screen button (Android + iOS)

export class AddToHomeScreen {
    constructor() {
        this._deferredPrompt = null;
        this._button = null;
        this._modal = null;
        this._init();
    }

    _init() {
        this._createButton();
        this._createIOSModal();

        // Android/Chrome beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this._deferredPrompt = e;
            this._button.style.display = 'flex';
        });

        // If iOS Safari, show the button with instruction modal
        if (this._isIOSSafari()) {
            // Only show if not already in standalone mode
            if (!window.navigator.standalone) {
                this._button.style.display = 'flex';
            }
        }

        this._button.addEventListener('click', () => this._handleClick());
    }

    _isIOSSafari() {
        const ua = navigator.userAgent;
        return /iP(hone|od|ad)/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
    }

    _createButton() {
        const btn = document.createElement('button');
        btn.id = 'btn-add-home';
        btn.title = 'Add to Home Screen';
        btn.style.cssText = `
            display:none; position:fixed; top:10px; left:10px;
            width:40px; height:40px; border-radius:8px; z-index:200;
            background:rgba(255,255,255,0.2); border:2px solid rgba(255,255,255,0.4);
            cursor:pointer; align-items:center; justify-content:center;
            pointer-events:auto; touch-action:none; padding:0;
        `;
        btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>`;
        document.body.appendChild(btn);
        this._button = btn;
    }

    _createIOSModal() {
        const modal = document.createElement('div');
        modal.id = 'ios-install-modal';
        modal.style.cssText = `
            display:none; position:fixed; top:0; left:0; width:100vw; height:100vh;
            background:rgba(0,0,0,0.7); z-index:10000;
            align-items:center; justify-content:center;
        `;
        modal.innerHTML = `
            <div style="background:#c6c6c6; border-top:3px solid #fff; border-left:3px solid #fff;
                border-bottom:3px solid #555; border-right:3px solid #555; padding:20px;
                max-width:340px; width:90%; font-family:'Press Start 2P',monospace; text-align:center;">
                <p style="font-size:11px; color:#404040; margin:0 0 16px;">Add to Home Screen</p>
                <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:16px;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    <span style="font-size:9px; color:#404040;">Tap Share</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#404040" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                    <span style="font-size:9px; color:#404040;">Add to Home</span>
                </div>
                <button id="btn-close-ios-modal" style="padding:8px 16px; font-size:9px; cursor:pointer;
                    background:#8b8b8b; border-top:2px solid #d4d4d4; border-left:2px solid #d4d4d4;
                    border-bottom:2px solid #373737; border-right:2px solid #373737; color:#fff;
                    font-family:'Press Start 2P',monospace;">OK</button>
            </div>
        `;
        document.body.appendChild(modal);
        this._modal = modal;

        modal.querySelector('#btn-close-ios-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    _handleClick() {
        if (this._deferredPrompt) {
            this._deferredPrompt.prompt();
            this._deferredPrompt.userChoice.then((result) => {
                if (result.outcome === 'accepted') {
                    this._button.style.display = 'none';
                }
                this._deferredPrompt = null;
            });
        } else if (this._isIOSSafari()) {
            this._modal.style.display = 'flex';
        }
    }
}
