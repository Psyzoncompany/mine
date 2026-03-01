// 🔊 SoundManager - Sistema de Áudio com arquivos .ogg reais
// Base path: js/systems/SONS/

export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);

        this.activeLoops = {};
        this.bufferCache = {};
        this.loadingPromises = {};

        this._lastStepTime = 0;
        this._stepInterval = 0.4;
        this._lastCaveTime = 0;
        this._caveInterval = 30 + Math.random() * 60;

        this.basePath = 'js/systems/SONS/';

        // ═══════════════════════════════════════════
        // 📋 MAPEAMENTO DE SONS
        // ═══════════════════════════════════════════

        this.stepSounds = {
            grass:  this._range('step/grass', 1, 6),
            stone:  this._range('step/stone', 1, 6),
            wood:   this._range('step/wood', 1, 6),
            sand:   this._range('step/sand', 1, 5),
            gravel: this._range('step/gravel', 1, 4),
            snow:   this._range('step/snow', 1, 4),
            cloth:  this._range('step/cloth', 1, 4),
        };

        this.digSounds = {
            grass:  this._range('dig/grass', 1, 4),
            stone:  this._range('dig/stone', 1, 4),
            wood:   this._range('dig/wood', 1, 4),
            sand:   this._range('dig/sand', 1, 4),
            gravel: this._range('dig/gravel', 1, 4),
            cloth:  this._range('dig/cloth', 1, 4),
            snow:   this._range('dig/snow', 1, 4),
        };

        this.damageSounds = {
            hit: this._range('damage/hit', 1, 3),
            fallbig: ['damage/fallbig'],
            fallsmall: ['damage/fallsmall'],
        };

        this.liquidSounds = {
            splash: ['liquid/splash', 'liquid/splash2'],
            swim:   this._range('liquid/swim', 1, 4),
            water:  ['liquid/water'],
        };

        this.randomSounds = {
            pop:            ['random/pop'],
            click:          ['random/click'],
            wood_click:     ['random/wood_click'],
            explode:        this._range('random/explode', 1, 4),
            levelup:        ['random/levelup'],
            orb:            ['random/orb'],
            glass:          this._range('random/glass', 1, 3),
            eat:            this._range('random/eat', 1, 3),
            drink:          ['random/drink'],
            burp:           ['random/burp'],
            chestopen:      ['random/chestopen'],
            chestclosed:    ['random/chestclosed'],
            door_open:      ['random/door_open'],
            door_close:     ['random/door_close'],
            anvil_use:      ['random/anvil_use'],
            anvil_land:     ['random/anvil_land'],
            bow:            ['random/bow'],
            bowhit:         this._range('random/bowhit', 1, 4),
            successful_hit: ['random/successful_hit'],
            splash:         ['random/splash'],
            breath:         ['random/breath'],
            fuse:           ['random/fuse'],
            fizz:           ['random/fizz'],
            classic_hurt:   ['random/classic_hurt'],
        };

        this.mobSounds = {
            cow_say:      this._range('mob/cow/say', 1, 4),
            cow_hurt:     this._range('mob/cow/hurt', 1, 3),
            chicken_say:  this._range('mob/chicken/say', 1, 3),
            chicken_hurt: this._range('mob/chicken/hurt', 1, 2),
            pig_say:      this._range('mob/pig/say', 1, 3),
            pig_death:    ['mob/pig/death'],
            sheep_say:    this._range('mob/sheep/say', 1, 3),
            zombie_say:   this._range('mob/zombie/say', 1, 3),
            zombie_hurt:  this._range('mob/zombie/hurt', 1, 2),
            zombie_death: ['mob/zombie/death'],
            skeleton_say:   this._range('mob/skeleton/say', 1, 3),
            skeleton_hurt:  this._range('mob/skeleton/hurt', 1, 4),
            skeleton_death: ['mob/skeleton/death'],
            spider_say:   this._range('mob/spider/say', 1, 4),
            spider_death: ['mob/spider/death'],
            creeper_death: ['mob/creeper/death'],
            endermen_idle:   this._range('mob/endermen/idle', 1, 5),
            endermen_scream: this._range('mob/endermen/scream', 1, 4),
            endermen_death:  ['mob/endermen/death'],
            wolf_bark:  this._range('mob/wolf/bark', 1, 3),
            wolf_hurt:  this._range('mob/wolf/hurt', 1, 3),
            wolf_death: ['mob/wolf/death'],
            ghast_moan: this._range('mob/ghast/moan', 1, 7),
        };

        this.ambientSounds = {
            cave:    this._range('ambient/cave/cave', 1, 13),
            rain:    this._range('ambient/weather/rain', 1, 4),
            thunder: this._range('ambient/weather/thunder', 1, 3),
        };

        // Block ID -> Material de som
        // 1=Grama, 2=Terra, 3=Pedra, 4=Madeira, 5=Folhas, 6=Água, 7=Areia, 8=Tábua, 9=Bancada
        this.blockMaterial = {
            1: 'grass',   2: 'gravel',  3: 'stone',
            4: 'wood',    5: 'grass',   6: 'stone',
            7: 'sand',    8: 'wood',    9: 'wood',
            10: 'stone',  11: 'stone',  12: 'stone',
            13: 'stone',  14: 'stone'
        };
    }

    // ═══════════════════════════════════════════
    // 🔧 UTILITÁRIOS
    // ═══════════════════════════════════════════

    _range(prefix, start, end) {
        const arr = [];
        for (let i = start; i <= end; i++) arr.push(`${prefix}${i}`);
        return arr;
    }

    _pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    async _loadBuffer(relativePath) {
        const fullPath = this.basePath + relativePath + '.ogg';
        if (this.bufferCache[fullPath]) return this.bufferCache[fullPath];
        if (this.loadingPromises[fullPath]) return this.loadingPromises[fullPath];

        this.loadingPromises[fullPath] = fetch(fullPath)
            .then(res => {
                if (!res.ok) throw new Error(`404: ${fullPath}`);
                return res.arrayBuffer();
            })
            .then(data => this.ctx.decodeAudioData(data))
            .then(buffer => {
                this.bufferCache[fullPath] = buffer;
                delete this.loadingPromises[fullPath];
                return buffer;
            })
            .catch(() => {
                delete this.loadingPromises[fullPath];
                return null;
            });

        return this.loadingPromises[fullPath];
    }

    _playBuffer(buffer, volume = 1.0, pitch = 1.0) {
        if (!buffer || !this.enabled) return;
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = pitch;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        src.connect(gain);
        gain.connect(this.masterGain);
        src.start(0);
        return src;
    }

    async _playRandom(soundList, volume = 1.0, pitch = 1.0) {
        if (!soundList || soundList.length === 0) return;
        const path = this._pick(soundList);
        const buffer = await this._loadBuffer(path);
        this._playBuffer(buffer, volume, pitch);
    }

    _randomPitch(base = 1.0, variance = 0.15) {
        return base + (Math.random() - 0.5) * variance * 2;
    }

    // ═══════════════════════════════════════════
    // 🎮 API PÚBLICA
    // ═══════════════════════════════════════════

    playSound(type, options = {}) {
        if (!this.enabled) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const vol = options.volume ?? 1.0;
        const blockId = options.blockType;

        switch (type) {
            // ── Quebrar bloco ──
            case 'pop':
            case 'break':
            case 'dig': {
                const mat = blockId ? (this.blockMaterial[blockId] || 'stone') : 'stone';
                const sounds = this.digSounds[mat] || this.digSounds.stone;
                this._playRandom(sounds, vol * 0.8, this._randomPitch(0.9, 0.1));
                break;
            }

            // ── Colocar bloco ──
            case 'place': {
                const mat = blockId ? (this.blockMaterial[blockId] || 'stone') : 'stone';
                const sounds = this.digSounds[mat] || this.digSounds.stone;
                this._playRandom(sounds, vol * 0.7, this._randomPitch(0.8, 0.05));
                break;
            }

            // ── Hit em mob ──
            case 'hit':
                this._playRandom(this.randomSounds.successful_hit, vol * 0.7, this._randomPitch());
                break;

            // ── Player recebe dano ──
            case 'hurt':
            case 'player_hurt':
                this._playRandom(this.damageSounds.hit, vol * 0.8, this._randomPitch());
                break;

            // ── Quedas ──
            case 'fall_big':
                this._playRandom(this.damageSounds.fallbig, vol * 0.9);
                break;
            case 'fall_small':
                this._playRandom(this.damageSounds.fallsmall, vol * 0.6);
                break;

            // ── Pular ──
            case 'jump': {
                const mat = blockId ? (this.blockMaterial[blockId] || 'grass') : 'grass';
                const sounds = this.stepSounds[mat] || this.stepSounds.grass;
                this._playRandom(sounds, vol * 0.4, this._randomPitch(0.7, 0.1));
                break;
            }

            // ── Coletar item ──
            case 'collect':
                this._playRandom(this.randomSounds.pop, vol * 0.6, this._randomPitch(1.2, 0.3));
                break;

            // ── XP ──
            case 'orb':
                this._playRandom(this.randomSounds.orb, vol * 0.4, this._randomPitch(1.0, 0.4));
                break;
            case 'levelup':
                this._playRandom(this.randomSounds.levelup, vol);
                break;

            // ── Água ──
            case 'splash':
                this._playRandom(this.liquidSounds.splash, vol * 0.7, this._randomPitch());
                break;
            case 'water_enter':
                this._playRandom(this.liquidSounds.splash, vol * 0.6, this._randomPitch(0.8, 0.1));
                break;
            case 'water_exit':
                this._playRandom(this.liquidSounds.splash, vol * 0.4, this._randomPitch(1.2, 0.1));
                break;
            case 'swim':
                this._playRandom(this.liquidSounds.swim, vol * 0.4, this._randomPitch());
                break;

            // ── Comer / Beber ──
            case 'eat':
                this._playRandom(this.randomSounds.eat, vol * 0.6, this._randomPitch());
                break;
            case 'burp':
                this._playRandom(this.randomSounds.burp, vol * 0.5);
                break;

            // ── Baú ──
            case 'chest_open':
                this._playRandom(this.randomSounds.chestopen, vol * 0.6);
                break;
            case 'chest_close':
                this._playRandom(this.randomSounds.chestclosed, vol * 0.6);
                break;

            // ── Explosão ──
            case 'explode':
                this._playRandom(this.randomSounds.explode, vol);
                break;

            // ── Click UI ──
            case 'click':
                this._playRandom(this.randomSounds.click, vol * 0.4, this._randomPitch());
                break;

            // ── Vidro ──
            case 'glass':
                this._playRandom(this.randomSounds.glass, vol * 0.7, this._randomPitch());
                break;

            // ══════════════════════
            // 🐄 MOBS
            // ══════════════════════
            case 'cow_say':      this._playRandom(this.mobSounds.cow_say, vol * 0.5, this._randomPitch()); break;
            case 'cow_hurt':     this._playRandom(this.mobSounds.cow_hurt, vol * 0.6, this._randomPitch()); break;
            case 'chicken_say':  this._playRandom(this.mobSounds.chicken_say, vol * 0.4, this._randomPitch()); break;
            case 'chicken_hurt': this._playRandom(this.mobSounds.chicken_hurt, vol * 0.5, this._randomPitch()); break;
            case 'pig_say':      this._playRandom(this.mobSounds.pig_say, vol * 0.4, this._randomPitch()); break;
            case 'pig_death':    this._playRandom(this.mobSounds.pig_death, vol * 0.6); break;
            case 'sheep_say':    this._playRandom(this.mobSounds.sheep_say, vol * 0.4, this._randomPitch()); break;
            case 'zombie_say':   this._playRandom(this.mobSounds.zombie_say, vol * 0.5, this._randomPitch(0.8, 0.2)); break;
            case 'zombie_hurt':  this._playRandom(this.mobSounds.zombie_hurt, vol * 0.6, this._randomPitch()); break;
            case 'zombie_death': this._playRandom(this.mobSounds.zombie_death, vol * 0.7); break;
            case 'skeleton_say':   this._playRandom(this.mobSounds.skeleton_say, vol * 0.5, this._randomPitch()); break;
            case 'skeleton_hurt':  this._playRandom(this.mobSounds.skeleton_hurt, vol * 0.6, this._randomPitch()); break;
            case 'skeleton_death': this._playRandom(this.mobSounds.skeleton_death, vol * 0.7); break;
            case 'endermen_idle':   this._playRandom(this.mobSounds.endermen_idle, vol * 0.4, this._randomPitch()); break;
            case 'endermen_scream': this._playRandom(this.mobSounds.endermen_scream, vol * 0.6, this._randomPitch()); break;
            case 'endermen_death':  this._playRandom(this.mobSounds.endermen_death, vol * 0.7); break;
            case 'spider_say':   this._playRandom(this.mobSounds.spider_say, vol * 0.4, this._randomPitch()); break;
            case 'spider_death': this._playRandom(this.mobSounds.spider_death, vol * 0.6); break;
            case 'creeper_death': this._playRandom(this.mobSounds.creeper_death, vol * 0.7); break;
            case 'wolf_bark':    this._playRandom(this.mobSounds.wolf_bark, vol * 0.5, this._randomPitch()); break;
            case 'wolf_hurt':    this._playRandom(this.mobSounds.wolf_hurt, vol * 0.6, this._randomPitch()); break;
            case 'ghast_moan':   this._playRandom(this.mobSounds.ghast_moan, vol * 0.3, this._randomPitch(0.8, 0.2)); break;

            // ══════════════════════
            // 🌿 AMBIENT
            // ══════════════════════
            case 'cave':
                this._playRandom(this.ambientSounds.cave, vol * 0.3, this._randomPitch(1.0, 0.1));
                break;
            case 'thunder':
                this._playRandom(this.ambientSounds.thunder, vol * 0.8);
                break;

            default:
                if (this.mobSounds[type]) {
                    this._playRandom(this.mobSounds[type], vol * 0.5, this._randomPitch());
                }
                break;
        }
    }

    // ═══════════════════════════════════════════
    // 👣 FOOTSTEPS
    // ═══════════════════════════════════════════

    playFootstep(blockType, sprinting = false) {
        if (!this.enabled) return;
        const now = performance.now() / 1000;
        const interval = sprinting ? this._stepInterval * 0.65 : this._stepInterval;
        if (now - this._lastStepTime < interval) return;
        this._lastStepTime = now;

        const mat = this.blockMaterial[blockType] || 'grass';
        const sounds = this.stepSounds[mat] || this.stepSounds.grass;
        this._playRandom(sounds, 0.35, this._randomPitch(1.0, 0.15));
    }

    playSwimStep() {
        if (!this.enabled) return;
        const now = performance.now() / 1000;
        if (now - this._lastStepTime < 0.6) return;
        this._lastStepTime = now;
        this._playRandom(this.liquidSounds.swim, 0.3, this._randomPitch());
    }

    // ═══════════════════════════════════════════
    // 🔁 LOOPS
    // ═══════════════════════════════════════════

    async startLoop(type) {
        if (!this.enabled) return;
        if (this.activeLoops[type]) return;

        if (type === 'underwater') {
            const buffer = await this._loadBuffer('liquid/water');
            if (!buffer) return;

            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 300;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.5);

            src.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            src.start(0);

            this.activeLoops[type] = { src, gain };
        }
    }

    stopLoop(type) {
        if (this.activeLoops[type]) {
            const loop = this.activeLoops[type];
            const now = this.ctx.currentTime;
            loop.gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
            loop.src.stop(now + 0.6);
            delete this.activeLoops[type];
        }
    }

    // ═══════════════════════════════════════════
    // 🌙 AMBIENT CAVE
    // ═══════════════════════════════════════════

    updateAmbient(playerY) {
        if (!this.enabled) return;
        const now = performance.now() / 1000;
        if (now - this._lastCaveTime < this._caveInterval) return;
        if (playerY < 20) {
            this._lastCaveTime = now;
            this._caveInterval = 30 + Math.random() * 90;
            this.playSound('cave', { volume: 0.25 });
        }
    }

    // ═══════════════════════════════════════════
    // 🐮 MOB SOUNDS (API de alto nível)
    // ═══════════════════════════════════════════

    playMobAmbient(mobType) {
        if (!this.enabled) return;
        const map = {
            vaca: 'cow_say', galinha: 'chicken_say', porco: 'pig_say',
            ovelha: 'sheep_say', cavaleiro: 'zombie_say',
            cavaleirotrevas: 'skeleton_say', monstrovazio: 'endermen_idle',
            leopardo: 'spider_say',
        };
        if (map[mobType]) this.playSound(map[mobType]);
    }

    playMobHurt(mobType) {
        if (!this.enabled) return;
        const map = {
            vaca: 'cow_hurt', galinha: 'chicken_hurt', porco: 'pig_say',
            ovelha: 'sheep_say', cavaleiro: 'zombie_hurt',
            cavaleirotrevas: 'skeleton_hurt', monstrovazio: 'endermen_scream',
            leopardo: 'spider_say',
        };
        if (map[mobType]) this.playSound(map[mobType], { volume: 0.8 });
    }

    playMobDeath(mobType) {
        if (!this.enabled) return;
        const map = {
            vaca: 'cow_hurt', galinha: 'chicken_hurt', porco: 'pig_death',
            ovelha: 'sheep_say', cavaleiro: 'zombie_death',
            cavaleirotrevas: 'skeleton_death', monstrovazio: 'endermen_death',
            leopardo: 'spider_death',
        };
        if (map[mobType]) this.playSound(map[mobType]);
    }

    // ═══════════════════════════════════════════
    // 🎚️ CONTROLES
    // ═══════════════════════════════════════════

    setMasterVolume(value) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) Object.keys(this.activeLoops).forEach(k => this.stopLoop(k));
    }

    async preload() {
        const critical = [
            'step/grass1', 'step/grass2', 'step/stone1', 'step/stone2',
            'step/wood1', 'step/sand1',
            'dig/grass1', 'dig/stone1', 'dig/wood1', 'dig/sand1',
            'damage/hit1', 'damage/hit2',
            'random/pop', 'random/click', 'random/successful_hit',
            'liquid/splash', 'liquid/swim1', 'liquid/water',
            'mob/cow/say1', 'mob/chicken/say1', 'mob/pig/say1', 'mob/sheep/say1',
            'mob/zombie/say1', 'mob/skeleton/say1',
        ];
        await Promise.all(critical.map(p => this._loadBuffer(p)));
    }
}
