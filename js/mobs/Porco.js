import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Porco extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'porco', x, y, z, chunkId);
        this.construirModelo();
    }

    construirModelo() {
        const criarTexturaPorco = () => {
            const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16; const ctx = canvas.getContext('2d');
            for (let x = 0; x < 16; x++) { for (let y = 0; y < 16; y++) { const r = Math.random() * 20 - 10; ctx.fillStyle = `rgb(${255 + r}, ${182 + r}, ${193 + r})`; ctx.fillRect(x, y, 1, 1); } }
            const tex = new THREE.CanvasTexture(canvas); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; return tex;
        }
        const matPorco = new THREE.MeshLambertMaterial({ map: criarTexturaPorco() });
        this.materials.push(matPorco);

        const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.9), matPorco); corpo.position.y = 0.4; corpo.castShadow = true; this.mesh.add(corpo);
        const cabeca = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), matPorco); cabeca.position.set(0, 0.5, 0.5); cabeca.castShadow = true; this.mesh.add(cabeca);
        this.pernas = []; const pos = [[-0.2, 0.15, 0.3], [0.2, 0.15, 0.3], [-0.2, 0.15, -0.3], [0.2, 0.15, -0.3]];
        pos.forEach(p => { const perna = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), matPorco); perna.position.set(p[0], p[1], p[2]); perna.castShadow = true; this.mesh.add(perna); this.pernas.push(perna); });
    }
}
