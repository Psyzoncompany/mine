import * as THREE from 'three';
import { Mob } from './Mob.js';

export class IronGolem extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'iron_golem', x, y, z, chunkId);

        this.vida = 100;

        this.villageCenter = null; // {x, z}
        this.villageRadius = 0;
        this.patrolTarget = null; // {x, z}
        this.isAggro = false;
        this.aggroTarget = null;

        this.construirModelo();
    }

    construirModelo() {
        const matBody = new THREE.MeshStandardMaterial({ color: 0xD4D4D4 });
        const matHead = new THREE.MeshStandardMaterial({ color: 0xBBBBBB });
        const matEye = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
        const matVine = new THREE.MeshStandardMaterial({ color: 0x228B22 });

        this.materials.push(matBody, matHead, matEye, matVine);

        const s = 0.55;

        // Body (wide and bulky)
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 2.0 * s, 0.8 * s), matBody);
        body.position.y = 1.8 * s;
        body.castShadow = true;
        this.mesh.add(body);

        // Head (small relative to body)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.6 * s, 0.8 * s), matHead);
        head.position.set(0, 3.1 * s, 0);
        head.castShadow = true;
        this.mesh.add(head);
        this.cabeca = head;

        // Eyes
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.1 * s, 0.05 * s), matEye);
        eyeL.position.set(0.2 * s, 3.15 * s, 0.41 * s);
        this.mesh.add(eyeL);

        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.1 * s, 0.05 * s), matEye);
        eyeR.position.set(-0.2 * s, 3.15 * s, 0.41 * s);
        this.mesh.add(eyeR);

        // Left arm (very long, hanging down)
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 1.6 * s, 0.5 * s), matBody);
        armL.position.set(1.05 * s, 1.2 * s, 0);
        armL.castShadow = true;
        this.mesh.add(armL);

        // Right arm
        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 1.6 * s, 0.5 * s), matBody);
        armR.position.set(-1.05 * s, 1.2 * s, 0);
        armR.castShadow = true;
        this.mesh.add(armR);

        // Vine decoration on left shoulder
        const vine = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.15 * s, 0.15 * s), matVine);
        vine.position.set(0.85 * s, 2.9 * s, 0.3 * s);
        this.mesh.add(vine);

        // Legs
        this.pernas = [];
        const legPositions = [[-0.35 * s, 0.5 * s, 0], [0.35 * s, 0.5 * s, 0]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 1.0 * s, 0.6 * s), matBody);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            this.mesh.add(leg);
            this.pernas.push(leg);
        });
    }
}
