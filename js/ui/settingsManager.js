// settingsManager.js — Persistent game settings via localStorage
export class SettingsManager {
    constructor() {
        this.STORAGE_KEY = 'meucraft_settings';
        this.defaults = {
            sensitivity: 1.0,
            movementType: 'buttons', // 'buttons' | 'joystick'
            interactionMode: 'crosshair', // 'crosshair' | 'touchAnywhere'
            renderDistance: 2, // chunks radius (2–6)
        };
        this.settings = { ...this.defaults };
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.settings = { ...this.defaults, ...parsed };
            }
        } catch (e) {
            console.warn('Settings load failed, using defaults', e);
        }
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Settings save failed', e);
        }
    }

    get(key) {
        return this.settings[key] ?? this.defaults[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    reset() {
        this.settings = { ...this.defaults };
        this.save();
    }
}
