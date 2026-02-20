import * as THREE from 'three';

export class Mob {
    constructor(scene, type, x, y, z, chunkId) {
        this.scene = scene;
        this.type = type;
        this.chunkId = chunkId;

        this.mesh = new THREE.Group();
        this.mesh.position.set(x, y, z);

        this.pernas = [];
        this.vy = 0;
        this.chaoEncontrado = false;
        this.direcao = Math.random() * Math.PI * 2;
        this.tempoAcao = Math.random() * 3;
        this.andando = true;
        this.animTimer = 0;
        this.estado = 'parado'; // parado, andar, dano, morrer, comer
        this.vida = 10;

        // 🐄 Sistema de comer grama (tipo Minecraft)
        this.eatTimer = 15 + Math.random() * 15; // Cada 15-30 segundos
        this.eating = false;
        this.eatProgress = 0;
        this.cabeca = null; // Referência à cabeça (definida nas subclasses)

        this.materials = [];

        // 🎯 HITBOX E BARRA DE VIDA (proporcional ao corpo, estilo Minecraft)
        const isSmall = (type === 'porco');
        const hbW = isSmall ? 0.6 : 0.9;
        const hbH = isSmall ? 0.8 : 1.2;
        const hbD = isSmall ? 0.9 : 1.4;
        this.hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(hbW, hbH, hbD),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this.hitbox.position.y = isSmall ? 0.4 : 0.6;
        this.mesh.add(this.hitbox);

        const lifeGeo = new THREE.PlaneGeometry(1.2, 0.15);
        const lifeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.lifeBar = new THREE.Mesh(lifeGeo, lifeMat);
        this.lifeBar.position.y = isSmall ? 1.5 : 2.2;
        this.lifeBar.visible = false;
        this.mesh.add(this.lifeBar);

        this.scene.add(this.mesh);
    }

    resetarCores() {
        this.materials.forEach(mat => {
            if (mat.emissive) mat.emissive.setHex(0x000000);
        });
    }

    sofrerDano(quantidade, SoundManager) {
        if (this.estado === 'morrer') return;

        this.vida -= quantidade;
        this.estado = 'dano';
        this.tempoAcao = 0;
        this.eating = false; // Cancela comer se levar dano

        if (this.lifeBar) {
            this.lifeBar.visible = true;
            this.lifeBar.scale.x = Math.max(0, this.vida / 10);
        }

        if (SoundManager) SoundManager.playSound('hit');

        if (this.vida <= 0) {
            this.estado = 'morrer';
        }
    }

    update(delta, world, camera) {
        this.tempoAcao -= delta;

        if (this.estado === 'morrer') {
            this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, Math.PI / 2, 0.05);
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, -0.6, 0.05);
            if (this.lifeBar) this.lifeBar.visible = false;
            return;
        }

        // Rotacionar barra de vida para a câmara
        if (this.lifeBar && this.lifeBar.visible && camera) {
            this.lifeBar.quaternion.copy(camera.quaternion);
        }

        if (this.estado === 'dano') {
            if (this.tempoAcao > -0.5) {
                const t = Math.abs(this.tempoAcao);
                if (Math.floor(t * 15) % 2 === 0) {
                    this.materials.forEach(m => m.emissive && m.emissive.setHex(0xff0000));
                } else {
                    this.resetarCores();
                }
            } else {
                this.estado = 'parado';
                this.resetarCores();
            }
        }

        // 🐄 SISTEMA DE COMER GRAMA (só animais passivos)
        const isPassive = this.type !== 'cavaleiro' && this.type !== 'cavaleirotrevas' && this.type !== 'monstrovazio';
        if (isPassive && this.chaoEncontrado && !this.eating && this.estado !== 'dano') {
            this.eatTimer -= delta;
            if (this.eatTimer <= 0) {
                // Checa se tem grama embaixo
                const bx = Math.round(this.mesh.position.x);
                const bz = Math.round(this.mesh.position.z);
                const by = Math.round(this.mesh.position.y - 0.9);
                const key = `${bx},${by},${bz}`;
                if (world.has(key) && world.get(key) === 1) {
                    this.eating = true;
                    this.eatProgress = 0;
                    this.andando = false;
                    this.estado = 'comer';
                    this._eatKey = key;
                    this._eatBx = bx;
                    this._eatBy = by;
                    this._eatBz = bz;
                } else {
                    this.eatTimer = 5 + Math.random() * 10; // Tenta de novo mais cedo
                }
            }
        }

        // Animação de comer
        if (this.eating) {
            this.eatProgress += delta;
            // Abaixa a cabeça por 2 segundos
            if (this.cabeca) {
                this.cabeca.rotation.x = Math.sin(this.eatProgress * 4) * 0.3 + 0.5;
            }
            if (this.eatProgress >= 2.0) {
                // Terminou de comer! Transforma grama em terra
                if (this._eatKey && world.has(this._eatKey) && world.get(this._eatKey) === 1) {
                    world.set(this._eatKey, 2); // Grama vira terra
                    // Dispara evento para recriar chunk visual
                    window.dispatchEvent(new CustomEvent('blockChanged', {
                        detail: { x: this._eatBx, y: this._eatBy, z: this._eatBz }
                    }));
                }
                this.eating = false;
                this.eatTimer = 20 + Math.random() * 20; // Próxima refeição
                this.estado = 'parado';
                if (this.cabeca) this.cabeca.rotation.x = 0;
            }
            // Não anda enquanto come
            this.pernas.forEach(p => p.rotation.x = 0);
        }

        if (!this.eating && this.tempoAcao <= 0 && this.estado !== 'dano') {
            this.direcao = Math.random() * Math.PI * 2;
            this.andando = Math.random() > 0.3;
            this.tempoAcao = 1 + Math.random() * 3;

            // IA Agressiva do Cavaleiro / CavaleiroTrevas
            if ((this.type === 'cavaleiro' || this.type === 'cavaleirotrevas') && camera) {
                const dist = this.mesh.position.distanceTo(camera.position);
                if (dist < 10) { // Raio de aggro de 10 blocos
                    this.direcao = Math.atan2(camera.position.x - this.mesh.position.x, camera.position.z - this.mesh.position.z);
                    this.andando = true;
                    if (dist < 2.5) {
                        this.estado = 'atacar';
                        this.tempoAcao = 1.0;
                        this.andando = false;
                        // O trevas tira 2 de dano, cavaleiro normal tira 1
                        window.dispatchEvent(new CustomEvent('playerDamage', { detail: { amount: this.type === 'cavaleirotrevas' ? 2 : 1 } }));
                    } else {
                        this.estado = 'andar';
                    }
                } else {
                    this.estado = this.andando ? 'andar' : 'parado';
                }
            } else {
                this.estado = this.andando ? 'andar' : 'parado';
            }
        }

        if (this.andando && this.estado !== 'dano' && this.estado !== 'atacar' && this.estado !== 'comer') {
            const velMult = this.type === 'cavaleirotrevas' ? 3.0 : (this.type === 'cavaleiro' ? 2.5 : 1.0);
            const vel = velMult * delta;
            const nextX = this.mesh.position.x + Math.sin(this.direcao) * vel;
            const nextZ = this.mesh.position.z + Math.cos(this.direcao) * vel;

            this.mesh.position.x = nextX;
            this.mesh.position.z = nextZ;

            let diff = this.direcao - this.mesh.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.mesh.rotation.y += diff * 0.1;

            this.animTimer += delta * 10;
            if (this.pernas.length >= 2) {
                this.pernas.forEach((p, i) => {
                    p.rotation.x = Math.sin(this.animTimer) * (i % 2 === 0 ? 0.5 : -0.5);
                });
            }

            // Pulo inteligente: só pula quando tem bloco à frente E nada em cima
            const targetX = Math.round(nextX);
            const targetY = Math.round(this.mesh.position.y - 0.2);
            const targetZ = Math.round(nextZ);

            if (world.has(`${targetX},${targetY},${targetZ}`)) {
                // Tem bloco na frente: checa se pode pular (nada em cima)
                if (!world.has(`${targetX},${targetY + 1},${targetZ}`) && this.chaoEncontrado) {
                    this.vy = 0.25; // Pula um bloco
                    this.chaoEncontrado = false;
                } else {
                    // Bloco impedindo + teto: vira pro outro lado
                    this.direcao += Math.PI;
                    this.mesh.position.x -= Math.sin(this.direcao) * vel;
                    this.mesh.position.z -= Math.cos(this.direcao) * vel;
                }
            }
        } else if (this.estado === 'parado') {
            this.pernas.forEach(p => p.rotation.x = 0);
        }

        this.vy -= 0.5 * delta;
        this.mesh.position.y += this.vy;

        const blockX = Math.round(this.mesh.position.x);
        const blockZ = Math.round(this.mesh.position.z);
        const baseOffset = 0.4;

        for (let y = Math.floor(this.mesh.position.y - baseOffset); y >= Math.floor(this.mesh.position.y - baseOffset - 1); y--) {
            if (world.has(`${blockX},${y},${blockZ}`)) {
                const alturaBloco = y + 0.5; // Topo do bloco
                const peMob = this.mesh.position.y - baseOffset;

                // Se o pé do mob passou do topo do bloco
                if (peMob <= alturaBloco) {
                    this.mesh.position.y = alturaBloco + baseOffset;
                    this.vy = 0;
                    this.chaoEncontrado = true;
                    break;
                }
            }
        }
    }

    dispose() {
        this.scene.remove(this.mesh);
        // Opcional: dispose das geometries e materials
    }
}
