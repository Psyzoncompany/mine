import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Vaca extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'vaca', x, y, z, chunkId);
        this.construirModelo();
    }

    construirModelo() {
        const criarTextura = (desenhar) => {
            const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16;
            const ctx = canvas.getContext('2d'); desenhar(ctx);
            const textura = new THREE.CanvasTexture(canvas); textura.magFilter = THREE.NearestFilter; textura.minFilter = THREE.NearestFilter; return textura;
        };

        const texCorpoVaca = criarTextura(ctx => { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, 16, 16); ctx.fillStyle = '#1c1c1c'; ctx.fillRect(2, 2, 5, 6); ctx.fillRect(10, 8, 6, 8); ctx.fillRect(0, 12, 4, 4); ctx.fillRect(12, 0, 4, 3); });
        const texCabecaVaca = criarTextura(ctx => { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, 16, 16); ctx.fillStyle = '#1c1c1c'; ctx.fillRect(0, 0, 8, 6); ctx.fillRect(8, 10, 8, 6); });
        const texPernaVaca = criarTextura(ctx => { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, 16, 16); ctx.fillStyle = '#1c1c1c'; ctx.fillRect(0, 0, 6, 8); ctx.fillStyle = '#333333'; ctx.fillRect(0, 12, 16, 4); });
        const texFocinhoVaca = criarTextura(ctx => { ctx.fillStyle = '#d1a3a3'; ctx.fillRect(0, 0, 16, 16); ctx.fillStyle = '#4a3535'; ctx.fillRect(2, 4, 4, 6); ctx.fillRect(10, 4, 4, 6); });
        const texTetaVaca = criarTextura(ctx => { ctx.fillStyle = '#e8a5b0'; ctx.fillRect(0, 0, 16, 16); ctx.fillStyle = '#d68a97'; ctx.fillRect(2, 2, 4, 4); ctx.fillRect(10, 2, 4, 4); ctx.fillRect(2, 10, 4, 4); ctx.fillRect(10, 10, 4, 4); });

        const matCorpoV = new THREE.MeshStandardMaterial({ map: texCorpoVaca }); const matCabecaV = new THREE.MeshStandardMaterial({ map: texCabecaVaca });
        const matPernaV = new THREE.MeshStandardMaterial({ map: texPernaVaca }); const matRosaV = new THREE.MeshStandardMaterial({ color: 0xd1a3a3 });
        const matRosaClaroV = new THREE.MeshStandardMaterial({ color: 0xe8a5b0 }); const matChifreV = new THREE.MeshStandardMaterial({ color: 0xdcdcdc });
        const matOlhoPV = new THREE.MeshStandardMaterial({ color: 0x0f0f0f }); const matOlhoBV = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const matsFocinhoV = [matRosaV, matRosaV, matRosaV, matRosaV, new THREE.MeshStandardMaterial({ map: texFocinhoVaca }), matRosaV];
        const matsTetaV = [matRosaClaroV, matRosaClaroV, matRosaClaroV, new THREE.MeshStandardMaterial({ map: texTetaVaca }), matRosaClaroV, matRosaClaroV];

        this.materials.push(matCorpoV, matCabecaV, matPernaV, matRosaV, matRosaClaroV, matChifreV, matOlhoPV, matOlhoBV);

        const s = 0.4;
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.4 * s, 2.6 * s), matCorpoV); corpo.position.y = 1.0 * s; corpo.castShadow = true; this.mesh.add(corpo);
        const teta = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.4 * s, 1.0 * s), matsTetaV); teta.position.set(0, 0.9 * s, 0.2 * s); teta.castShadow = true; this.mesh.add(teta);
        const cabeca = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 1.2 * s, 1.0 * s), matCabecaV); cabeca.position.set(0, 1.5 * s, 1.5 * s); cabeca.castShadow = true; this.mesh.add(cabeca);
        this.cabeca = cabeca;
        const focinho = new THREE.Mesh(new THREE.BoxGeometry(1.0 * s, 0.6 * s, 0.4 * s), matsFocinhoV); focinho.position.set(0, 1.2 * s, 2.2 * s); focinho.castShadow = true; this.mesh.add(focinho);
        const chifreEsq = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.6 * s, 0.2 * s), matChifreV); chifreEsq.position.set(0.5 * s, 2.3 * s, 1.3 * s); this.mesh.add(chifreEsq);
        const chifreDir = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.6 * s, 0.2 * s), matChifreV); chifreDir.position.set(-0.5 * s, 2.3 * s, 1.3 * s); this.mesh.add(chifreDir);

        this.pernas = []; const posPernas = [[-0.5 * s, 0.2 * s, 0.9 * s], [0.5 * s, 0.2 * s, 0.9 * s], [-0.5 * s, 0.2 * s, -0.9 * s], [0.5 * s, 0.2 * s, -0.9 * s]];
        posPernas.forEach(pos => { const perna = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 1.2 * s, 0.6 * s), matPernaV); perna.position.set(pos[0], pos[1], pos[2]); perna.castShadow = true; this.mesh.add(perna); this.pernas.push(perna); });

        const olhoEsqP = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.15 * s, 0.05 * s), matOlhoPV); olhoEsqP.position.set(0.4 * s, 1.7 * s, 2.01 * s); this.mesh.add(olhoEsqP);
        const olhoEsqB = new THREE.Mesh(new THREE.BoxGeometry(0.05 * s, 0.15 * s, 0.06 * s), matOlhoBV); olhoEsqB.position.set(0.45 * s, 1.7 * s, 2.01 * s); this.mesh.add(olhoEsqB);
        const olhoDirP = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.15 * s, 0.05 * s), matOlhoPV); olhoDirP.position.set(-0.4 * s, 1.7 * s, 2.01 * s); this.mesh.add(olhoDirP);
        const olhoDirB = new THREE.Mesh(new THREE.BoxGeometry(0.05 * s, 0.15 * s, 0.06 * s), matOlhoBV); olhoDirB.position.set(-0.35 * s, 1.7 * s, 2.01 * s); this.mesh.add(olhoDirB);
    }
}
