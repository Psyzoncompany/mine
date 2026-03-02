import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Villager extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'villager', x, y, z, chunkId);

        this.profession = null;
        this.linkedBed = null;
        this.linkedWorkstation = null;

        this.villageCenter = null; // {x, z} position
        this.villageRadius = 0;

        this.construirModelo();
    }

    construirModelo() {
        const matRobe = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const matSkin = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
        const matNose = new THREE.MeshStandardMaterial({ color: 0xC9A37B });
        const matEye = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

        this.materials.push(matRobe, matSkin, matNose, matEye);

        const s = 0.4;

        // Body (brown robe)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 1.0 * s, 0.4 * s), matRobe);
        body.position.y = 0.9 * s;
        body.castShadow = true;
        this.mesh.add(body);

        // Head (large, Minecraft villager style)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.7 * s, 0.6 * s), matSkin);
        head.position.set(0, 1.75 * s, 0);
        head.castShadow = true;
        this.mesh.add(head);
        this.cabeca = head;

        // Nose (the characteristic big villager nose)
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.3 * s, 0.25 * s), matNose);
        nose.position.set(0, 1.65 * s, 0.4 * s);
        nose.castShadow = true;
        this.mesh.add(nose);

        // Eyes
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.1 * s, 0.05 * s), matEye);
        eyeL.position.set(0.15 * s, 1.8 * s, 0.31 * s);
        this.mesh.add(eyeL);

        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.1 * s, 0.05 * s), matEye);
        eyeR.position.set(-0.15 * s, 1.8 * s, 0.31 * s);
        this.mesh.add(eyeR);

        // Arms (crossed in front, Minecraft villager style)
        const armL = new THREE.Mesh(new THREE.BoxGeometry(0.25 * s, 0.7 * s, 0.25 * s), matRobe);
        armL.position.set(0.1 * s, 1.0 * s, 0.25 * s);
        armL.rotation.x = -0.5;
        armL.castShadow = true;
        this.mesh.add(armL);

        const armR = new THREE.Mesh(new THREE.BoxGeometry(0.25 * s, 0.7 * s, 0.25 * s), matRobe);
        armR.position.set(-0.1 * s, 1.0 * s, 0.25 * s);
        armR.rotation.x = -0.5;
        armR.castShadow = true;
        this.mesh.add(armR);

        // Legs
        this.pernas = [];
        const legPositions = [[-0.12 * s, 0.2 * s, 0], [0.12 * s, 0.2 * s, 0]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.5 * s, 0.3 * s), matRobe);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            this.mesh.add(leg);
            this.pernas.push(leg);
        });
    }
}
