import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Galinha extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'galinha', x, y, z, chunkId);
        this.vida = 4; // Galinha tem menos vida
        this.construirModelo();
    }

    construirModelo() {
        const s = 0.12; // Menor que ovelha, cabendo em 1 bloco +-

        const colors = {
            body: 0xC67120,    // Laranja/Dourado escuro
            neck: 0xD98A36,    // Laranja mais claro
            red: 0xE32619,     // Crista e papo
            beak: 0xE8AD31,    // Bico e pernas amarelas
            eye: 0x000000,     // Olho preto
            white: 0xFFFFFF    // Fundo do olho
        };

        const createVoxel = (w, h, d, color, x, y, z) => {
            const geo = new THREE.BoxGeometry(w * s, h * s, d * s);
            const mat = new THREE.MeshLambertMaterial({ color: color });
            this.materials.push(mat);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x * s, y * s, z * s);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        const corpoGrupo = new THREE.Group();
        corpoGrupo.position.y = 5.5 * s;

        // Corpo principal
        const body = createVoxel(6, 5, 8, colors.body, 0, 0, 0);
        corpoGrupo.add(body);

        // Rabo (cauda)
        const tail = createVoxel(4, 4, 2, colors.body, 0, 1, -4.5);
        corpoGrupo.add(tail);

        // Peito / Pescoço
        const neck = createVoxel(4, 5, 4, colors.neck, 0, 2.5, 3);
        corpoGrupo.add(neck);

        // Cabeça
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 5 * s, 4 * s);
        corpoGrupo.add(headGroup);
        this.cabeca = headGroup;

        const head = createVoxel(3, 3, 3, colors.neck, 0, 0, 0);
        headGroup.add(head);

        // Crista (Top)
        const comb = createVoxel(1, 1.5, 3, colors.red, 0, 2.25, 0);
        headGroup.add(comb);

        // Bico
        const beak = createVoxel(1, 1, 2, colors.beak, 0, -0.5, 2.5);
        headGroup.add(beak);

        // Papo (Wattle)
        const wattle = createVoxel(1, 1.5, 1, colors.red, 0, -2, 1.5);
        headGroup.add(wattle);

        // Olhos
        const eyeR = createVoxel(0.5, 0.5, 0.5, colors.eye, -1.6, 0.5, 0.5);
        const eyeL = createVoxel(0.5, 0.5, 0.5, colors.eye, 1.6, 0.5, 0.5);
        headGroup.add(eyeR);
        headGroup.add(eyeL);

        // Asas
        const wingR = createVoxel(1, 3, 5, colors.neck, -3.5, 0, 0.5);
        const wingL = createVoxel(1, 3, 5, colors.neck, 3.5, 0, 0.5);
        corpoGrupo.add(wingR);
        corpoGrupo.add(wingL);

        this.mesh.add(corpoGrupo);

        // Pernas (Criando pivô no topo para rotacionar certo)
        const legGeo = new THREE.BoxGeometry(1 * s, 3 * s, 1 * s);
        legGeo.translate(0, -1.5 * s, 0); // Move o centro para o topo da perna
        const legMat = new THREE.MeshLambertMaterial({ color: colors.beak });
        this.materials.push(legMat);

        const legR = new THREE.Mesh(legGeo, legMat);
        legR.position.set(-1.5 * s, 3.5 * s, 0);
        legR.castShadow = true;
        this.mesh.add(legR);

        const legL = new THREE.Mesh(legGeo, legMat);
        legL.position.set(1.5 * s, 3.5 * s, 0);
        legL.castShadow = true;
        this.mesh.add(legL);

        // Pés
        const footGeo = new THREE.BoxGeometry(1.5 * s, 0.5 * s, 2 * s);
        footGeo.translate(0, -0.25 * s, 0.5 * s);
        const footR = new THREE.Mesh(footGeo, legMat);
        footR.position.set(0, -3 * s, 0); // Relativo à perna
        legR.add(footR);

        const footL = new THREE.Mesh(footGeo, legMat);
        footL.position.set(0, -3 * s, 0);
        legL.add(footL);

        this.pernas = [legR, legL];
    }
}
