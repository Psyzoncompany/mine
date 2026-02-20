import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Cavaleiro extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'cavaleiro', x, y, z, chunkId);
        this.vida = 50; // Mais resistente que animais
        this.vidaMax = 50;
        this.construirModelo();
    }

    construirModelo() {
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

        const matArmor = new THREE.MeshStandardMaterial({ map: criarTex('#0a0a0a', '#1a1a1a', 60), metalness: 0.95, roughness: 0.15 });
        const matSilver = new THREE.MeshStandardMaterial({ map: criarTex('#444', '#777', 40), metalness: 1.0, roughness: 0.1 });
        const matCape = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, side: THREE.DoubleSide });
        const matEye = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 5 });
        const matGlow = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3 });

        this.materials.push(matArmor, matSilver, matCape, matEye, matGlow);

        const s = 0.4; // Escala compatível com o jogo

        // Torso
        const torso = new THREE.Group();
        torso.position.y = 2.6 * s;
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.4 * s, 2.6 * s, 0.7 * s), matArmor);
        body.castShadow = true;
        torso.add(body);

        const plate = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.4 * s, 1.0 * s), matArmor);
        plate.position.set(0, 0.6 * s, 0.1 * s);
        const belt = new THREE.Mesh(new THREE.BoxGeometry(1.5 * s, 0.3 * s, 0.8 * s), matSilver);
        belt.position.y = -0.6 * s;
        torso.add(plate, belt);

        const cape = new THREE.Mesh(new THREE.BoxGeometry(1.8 * s, 4.0 * s, 0.1 * s), matCape);
        cape.geometry.translate(0, -2 * s, 0);
        cape.position.set(0, 1.4 * s, -0.4 * s);
        torso.add(cape);
        this.mesh.add(torso);
        this.torso = torso;
        this.cape = cape;

        // Cabeça
        const headG = new THREE.Group();
        headG.position.y = 4.0 * s;
        const helm = new THREE.Mesh(new THREE.BoxGeometry(1.3 * s, 1.4 * s, 1.3 * s), matArmor);
        helm.position.y = 0.6 * s;
        headG.add(helm);
        const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.8 * s, 0.2 * s), matSilver);
        hornL.position.set(0.7 * s, 1.2 * s, 0); hornL.rotation.z = 0.4;
        const hornR = hornL.clone(); hornR.position.x = -0.7 * s; hornR.rotation.z = -0.4;
        headG.add(hornL, hornR);
        const eyes = new THREE.Mesh(new THREE.BoxGeometry(1.0 * s, 0.1 * s, 0.1 * s), matEye);
        eyes.position.set(0, 0.8 * s, 0.66 * s);
        headG.add(eyes);
        this.mesh.add(headG);
        this.head = headG;

        // Braços
        const createArm = (side) => {
            const g = new THREE.Group();
            g.position.set(side * 1.0 * s, 3.8 * s, 0);
            const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 1.1 * s, 1.2 * s), matArmor);
            shoulder.position.set(side * 0.1 * s, 0.1 * s, 0);
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 2.4 * s, 0.7 * s), matArmor);
            arm.position.y = -1.2 * s;
            g.add(shoulder, arm);
            return g;
        };
        this.armL = createArm(1); this.armR = createArm(-1);
        this.mesh.add(this.armL, this.armR);

        // Picareta
        const pickaxe = new THREE.Group();
        pickaxe.position.set(-0.2 * s, -2.2 * s, 0.4 * s);
        pickaxe.rotation.x = Math.PI / 2;
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.25 * s, 2.5 * s, 0.25 * s), matArmor);
        pickaxe.add(handle);
        const topPart = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.5 * s, 0.4 * s), matSilver);
        topPart.position.y = 1.25 * s;
        pickaxe.add(topPart);
        const bladeL = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 0.3 * s, 0.2 * s), matArmor);
        bladeL.position.set(0.6 * s, 1.25 * s, 0); bladeL.rotation.z = 0.2;
        pickaxe.add(bladeL);
        const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.25 * s, 0.22 * s), matSilver);
        tipL.position.set(1.4 * s, 1.1 * s, 0); tipL.rotation.z = 0.5;
        pickaxe.add(tipL);
        const bladeR = bladeL.clone(); bladeR.position.x = -0.6 * s; bladeR.rotation.z = -0.2;
        pickaxe.add(bladeR);
        const tipR = tipL.clone(); tipR.position.x = -1.4 * s; tipR.rotation.z = -0.5;
        pickaxe.add(tipR);
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.35 * s, 0.35 * s, 0.45 * s), matGlow);
        core.position.y = 1.25 * s;
        pickaxe.add(core);
        this.armR.add(pickaxe);
        this.pickaxe = pickaxe;
        this.core = core;

        // Pernas
        const createLeg = (x) => {
            const g = new THREE.Group();
            g.position.set(x * s, 1.3 * s, 0);
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 2.4 * s, 0.8 * s), matArmor);
            leg.position.y = -1.2 * s;
            const knee = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 0.4 * s, 0.9 * s), matSilver);
            knee.position.y = -0.8 * s;
            g.add(leg, knee);
            return g;
        };
        this.legL = createLeg(0.45 * s); this.legR = createLeg(-0.45 * s);
        this.mesh.add(this.legL, this.legR);
        this.pernas = [this.legL, this.legR];

        // Barra de Vida
        const lifeGeo = new THREE.PlaneGeometry(1, 0.1);
        const lifeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.lifeBar = new THREE.Mesh(lifeGeo, lifeMat);
        this.lifeBar.position.y = 6 * s;
        this.mesh.add(this.lifeBar);
        this.lifeBar.visible = false;
    }

    update(delta, world, camera) {
        super.update(delta, world, camera);
        const l = THREE.MathUtils.lerp;
        const t = this.animTimer;

        // Reset rotations suave
        this.head.rotation.x = l(this.head.rotation.x, 0, 0.1);
        this.armL.rotation.x = l(this.armL.rotation.x, 0, 0.1);
        this.armR.rotation.x = l(this.armR.rotation.x, 0, 0.1);
        this.pickaxe.rotation.x = l(this.pickaxe.rotation.x, Math.PI / 2, 0.1);

        if (this.estado === 'andar') {
            const s = Math.sin(t * 0.5);
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
        } else if (this.estado === 'parado') {
            this.torso.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.01;
            this.cape.rotation.x = 0.1 + Math.sin(Date.now() * 0.001) * 0.1;
            this.core.scale.setScalar(1 + Math.sin(Date.now() * 0.004) * 0.1);
        }

        // Atualiza barra de vida
        if (this.vida < this.vidaMax) {
            this.lifeBar.visible = true;
            this.lifeBar.scale.x = Math.max(0, this.vida / this.vidaMax);
        }
    }
}
