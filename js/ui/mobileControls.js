// mobileControls.js — Mobile movement system (buttons/joystick) with runtime switching
export class MobileControls {
    constructor(settingsManager) {
        this.settings = settingsManager;
        this.teclas = null; // reference to main game teclas object
        this.container = null;
        this.joystickData = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, touchId: null };
        this.joystickEl = null;
        this.joystickKnob = null;
        this.dpadEl = null;
        this._currentMode = null;
    }

    init(teclasRef, containerId) {
        this.teclas = teclasRef;
        this.container = document.getElementById(containerId);
        this._buildJoystick();
        this.applyMode(this.settings.get('movementType'));
    }

    applyMode(mode) {
        if (this._currentMode === mode) return;
        this._currentMode = mode;
        this.settings.set('movementType', mode);

        const dpad = this.container.querySelector('.dpad');
        const joystick = this.container.querySelector('.joystick-zone');

        if (mode === 'joystick') {
            if (dpad) dpad.style.display = 'none';
            if (joystick) joystick.style.display = 'block';
        } else {
            if (dpad) dpad.style.display = '';
            if (joystick) joystick.style.display = 'none';
        }
    }

    _buildJoystick() {
        const zone = document.createElement('div');
        zone.className = 'joystick-zone';
        zone.style.display = 'none';

        const base = document.createElement('div');
        base.className = 'joystick-base';

        const knob = document.createElement('div');
        knob.className = 'joystick-knob';

        base.appendChild(knob);
        zone.appendChild(base);

        this.joystickEl = base;
        this.joystickKnob = knob;

        const DEADZONE = 12;
        const MAX_DIST = 50;

        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.joystickData.active) return;
            const t = e.changedTouches[0];
            this.joystickData.active = true;
            this.joystickData.touchId = t.identifier;
            this.joystickData.startX = t.clientX;
            this.joystickData.startY = t.clientY;
            this.joystickData.dx = 0;
            this.joystickData.dy = 0;

            // Position joystick base at touch point
            base.style.left = t.clientX + 'px';
            base.style.top = t.clientY + 'px';
            base.style.display = 'block';
            knob.style.transform = 'translate(-50%, -50%)';
        }, { passive: false });

        zone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                if (t.identifier !== this.joystickData.touchId) continue;
                let dx = t.clientX - this.joystickData.startX;
                let dy = t.clientY - this.joystickData.startY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > MAX_DIST) {
                    dx = (dx / dist) * MAX_DIST;
                    dy = (dy / dist) * MAX_DIST;
                }

                this.joystickData.dx = dx;
                this.joystickData.dy = dy;
                knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

                // Map to keys with deadzone
                if (this.teclas) {
                    this.teclas.w = dy < -DEADZONE;
                    this.teclas.s = dy > DEADZONE;
                    this.teclas.a = dx < -DEADZONE;
                    this.teclas.d = dx > DEADZONE;
                }
            }
        }, { passive: false });

        const endJoystick = (e) => {
            for (const t of e.changedTouches) {
                if (t.identifier !== this.joystickData.touchId) continue;
                this.joystickData.active = false;
                this.joystickData.touchId = null;
                this.joystickData.dx = 0;
                this.joystickData.dy = 0;
                knob.style.transform = 'translate(-50%, -50%)';
                base.style.display = 'none';
                if (this.teclas) {
                    this.teclas.w = false;
                    this.teclas.s = false;
                    this.teclas.a = false;
                    this.teclas.d = false;
                }
            }
        };

        zone.addEventListener('touchend', endJoystick);
        zone.addEventListener('touchcancel', endJoystick);

        // Insert after dpad
        const dpad = this.container.querySelector('.dpad');
        if (dpad) {
            dpad.parentNode.insertBefore(zone, dpad.nextSibling);
        } else {
            this.container.appendChild(zone);
        }
    }

    getAnalogInput() {
        if (this._currentMode !== 'joystick' || !this.joystickData.active) return null;
        const DEADZONE = 12;
        const MAX_DIST = 50;
        let { dx, dy } = this.joystickData;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < DEADZONE) return { x: 0, z: 0 };
        const norm = Math.min(dist, MAX_DIST) / MAX_DIST;
        return {
            x: -(dx / dist) * norm,
            z: -(dy / dist) * norm
        };
    }
}
