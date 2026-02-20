import * as THREE from 'three';
import { Mob } from './Mob.js';

export class CavaleiroTrevas extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'cavaleirotrevas', x, y + 2, z, chunkId);
        this.vida = 100;
        this.vidaMax = 100;
        this.construirModelo();
    }

    construirModelo() {
        // 🎨 TEXTURAS
        const criarTex = (c1, c2, n) => {
            const c = document.createElement('canvas'); c.width = 16; c.height = 16;
            const ctx = c.getContext('2d');
            ctx.fillStyle = c1; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = c2;
            for (let i = 0; i < n; i++) ctx.fillRect(Math.random() * 16, Math.random() * 16, 1, 1);
            const t = new THREE.CanvasTexture(c);
            t.magFilter = t.minFilter = THREE.NearestFilter;
            return t;
        };

        // 🧱 MATERIAIS
        const matArmor = new THREE.MeshStandardMaterial({ map: criarTex('#0a0a0a', '#1a1a1a', 60), metalness: 0.95, roughness: 0.15 });
        const matSilver = new THREE.MeshStandardMaterial({ map: criarTex('#444', '#777', 40), metalness: 1.0, roughness: 0.1 });
        const matCape = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, side: THREE.DoubleSide });
        const matEye = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 5 });
        const matGlow = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3 });

        this.materials.push(matArmor, matSilver, matCape, matEye, matGlow);

        const s = 0.5; // Escala geral para caber no mundo

        this.knight = new THREE.Group();
        this.knight.scale.set(s, s, s);

        const torso = new THREE.Group();
        torso.position.y = 2.6;
        torso.add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.7), matArmor)); // Abdome
        const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.0), matArmor);
        plate.position.set(0, 0.6, 0.1);
        const belt = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.8), matSilver);
        belt.position.y = -0.6;
        torso.add(plate, belt);

        this.cape = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.0, 0.1), matCape);
        this.cape.geometry.translate(0, -2, 0);
        this.cape.position.set(0, 1.4, -0.4);
        torso.add(this.cape);
        this.knight.add(torso);
        this.torso = torso;

        this.headG = new THREE.Group();
        this.headG.position.y = 4.0;
        const helm = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.4, 1.3), matArmor);
        helm.position.y = 0.6;
        this.headG.add(helm);
        const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), matSilver);
        hornL.position.set(0.7, 1.2, 0); hornL.rotation.z = 0.4;
        const hornR = hornL.clone(); hornR.position.x = -0.7; hornR.rotation.z = -0.4;
        this.headG.add(hornL, hornR);
        const eyes = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.1), matEye);
        eyes.position.set(0, 0.8, 0.66);
        this.headG.add(eyes);
        this.knight.add(this.headG);

        const createArm = (side) => {
            const g = new THREE.Group();
            g.position.set(side * 1.0, 3.8, 0);
            const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), matArmor);
            shoulder.position.set(side * 0.1, 0.1, 0);
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 0.7), matArmor);
            arm.position.y = -1.2;
            g.add(shoulder, arm);
            return g;
        };
        this.armL = createArm(1);
        this.armR = createArm(-1);
        this.knight.add(this.armL, this.armR);

        // ⛏️ PICARETA DARK MODERNA
        this.pickaxe = new THREE.Group();
        this.pickaxe.position.set(-0.2, -2.2, 0.4);
        this.pickaxe.rotation.x = Math.PI / 2;

        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.5, 0.25), matArmor);
        this.pickaxe.add(handle);

        const topPart = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), matSilver);
        topPart.position.y = 1.25;
        this.pickaxe.add(topPart);

        const bladeL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.2), matArmor);
        bladeL.position.set(0.6, 1.25, 0);
        bladeL.rotation.z = 0.2;
        this.pickaxe.add(bladeL);

        const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.22), matSilver);
        tipL.position.set(1.4, 1.1, 0);
        tipL.rotation.z = 0.5;
        this.pickaxe.add(tipL);

        const bladeR = bladeL.clone();
        bladeR.position.x = -0.6;
        bladeR.rotation.z = -0.2;
        this.pickaxe.add(bladeR);

        const tipR = tipL.clone();
        tipR.position.x = -1.4;
        tipR.rotation.z = -0.5;
        this.pickaxe.add(tipR);

        this.core = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.45), matGlow);
        this.core.position.y = 1.25;
        this.pickaxe.add(this.core);

        this.armR.add(this.pickaxe);

        const createLeg = (x) => {
            const g = new THREE.Group();
            g.position.set(x, 1.3, 0);
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 0.8), matArmor);
            leg.position.y = -1.2;
            const knee = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.9), matSilver);
            knee.position.y = -0.8;
            g.add(leg, knee);
            return g;
        };
        this.legL = createLeg(0.45);
        this.legR = createLeg(-0.45);
        this.knight.add(this.legL, this.legR);

        this.mesh.add(this.knight);

        // Habilitar simulação de danos materiais
        this.materiaisDano = [matArmor, matSilver, matCape];
    }

    update(delta, world, camera) {
        super.update(delta, world, camera);
        const l = THREE.MathUtils.lerp;
        const t = this.animTimer;

        // Soft reset de pose
        this.knight.rotation.x = l(this.knight.rotation.x, 0, 0.1);
        this.headG.rotation.x = l(this.headG.rotation.x, 0, 0.1);
        this.armL.rotation.x = l(this.armL.rotation.x, 0, 0.1);
        this.armR.rotation.x = l(this.armR.rotation.x, 0, 0.1);
        this.legL.rotation.x = l(this.legL.rotation.x, 0, 0.1);
        this.legR.rotation.x = l(this.legR.rotation.x, 0, 0.1);
        this.pickaxe.rotation.x = l(this.pickaxe.rotation.x, Math.PI / 2, 0.1);

        if (this.estado === 'andar') {
            const s = Math.sin(t * 5);
            this.legL.rotation.x = s * 0.8; this.legR.rotation.x = -s * 0.8;
            this.armL.rotation.x = -s * 0.5; this.armR.rotation.x = s * 0.5;
            this.cape.rotation.x = 0.4 + Math.abs(s) * 0.3;
        } else if (this.estado === 'atacar') {
            const at = Math.abs(this.tempoAcao);
            if (at < 0.4) {
                this.armR.rotation.x = l(this.armR.rotation.x, -Math.PI * 0.8, 0.3);
                this.pickaxe.rotation.x = 0.5;
            } else if (at < 0.8) {
                this.armR.rotation.x = l(this.armR.rotation.x, Math.PI / 1.5, 0.5);
                this.pickaxe.rotation.x = Math.PI / 1.5;
            }
        } else if (this.estado === 'dano') {
            const at = Math.abs(this.tempoAcao);
            if (at < 0.5 && this.materiaisDano) {
                this.materiaisDano.forEach(m => {
                    if (m.emissive) m.emissive.setHex(at * 10 % 2 < 1 ? 0x550000 : 0);
                });
            } else {
                if (this.materiaisDano) this.materiaisDano.forEach(m => { if (m.emissive) m.emissive.setHex(0); });
            }
        } else {
            this.torso.scale.y = 1 + Math.sin(t * 2) * 0.01;
            this.cape.rotation.x = 0.1 + Math.sin(t) * 0.1;
            this.core.scale.setScalar(1 + Math.sin(t * 4) * 0.1);
        }
    }
}
