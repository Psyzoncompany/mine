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
        this.direcao = Math.random() * Math.PI * 2;
        this.tempoAcao = Math.random() * 3;
        this.andando = true;
        this.animTimer = 0;
        this.estado = 'parado'; // parado, andar, dano, morrer
        this.vida = 10;

        this.materials = [];

        // 🎯 HITBOX E BARRA DE VIDA
        this.hitbox = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2.5, 1.5),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this.hitbox.position.y = 0.5;
        this.mesh.add(this.hitbox);

        const lifeGeo = new THREE.PlaneGeometry(1.5, 0.2);
        const lifeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.lifeBar = new THREE.Mesh(lifeGeo, lifeMat);
        this.lifeBar.position.y = 3.5; // Acima da cabeça na maioria
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

        if (this.lifeBar) {
            this.lifeBar.visible = true;
            this.lifeBar.scale.x = Math.max(0, this.vida / 10); // Normalizado para a base (animais e monstros menores)
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

        if (this.tempoAcao <= 0 && this.estado !== 'dano') {
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

        if (this.andando && this.estado !== 'dano' && this.estado !== 'atacar') {
            const velMult = this.type === 'cavaleirotrevas' ? 3.0 : (this.type === 'cavaleiro' ? 2.5 : 1.0);
            const vel = velMult * delta;
            const nextX = this.mesh.position.x + Math.sin(this.direcao) * vel;
            const nextZ = this.mesh.position.z + Math.cos(this.direcao) * vel;

            this.mesh.position.x = nextX;
            this.mesh.position.z = nextZ;
            this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, this.direcao, 0.1);

            this.animTimer += delta * 10;
            if (this.pernas.length >= 2) {
                this.pernas.forEach((p, i) => {
                    p.rotation.x = Math.sin(this.animTimer) * (i % 2 === 0 ? 0.5 : -0.5);
                });
            }

            if (world.has(`${Math.floor(this.mesh.position.x)},${Math.floor(this.mesh.position.y)},${Math.floor(this.mesh.position.z)}`)) {
                this.direcao += Math.PI;
                this.mesh.position.x -= Math.sin(this.direcao) * vel * 2;
                this.mesh.position.z -= Math.cos(this.direcao) * vel * 2;
            }
        } else if (this.estado === 'parado') {
            this.pernas.forEach(p => p.rotation.x = 0);
        }

        this.vy -= 0.5 * delta;
        this.mesh.position.y += this.vy;
        const blocoBaixo = Math.floor(this.mesh.position.y - 0.4);
        if (world.has(`${Math.floor(this.mesh.position.x)},${blocoBaixo},${Math.floor(this.mesh.position.z)}`)) {
            this.mesh.position.y = blocoBaixo + 1.4;
            this.vy = 0;
            if (this.andando && Math.random() < 0.05) this.vy = 0.15;
        }
    }

    dispose() {
        this.scene.remove(this.mesh);
        // Opcional: dispose das geometries e materials
    }
}
