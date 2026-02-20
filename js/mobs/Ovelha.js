import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Ovelha extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'ovelha', x, y, z, chunkId);
        this.construirModelo();
    }

    construirModelo() {
        // Funo Geradora de Texturas (Pxeis)
        const criarTextura = (gerarPixels) => {
            const canvas = document.createElement('canvas');
            canvas.width = 16; canvas.height = 16;
            const ctx = canvas.getContext('2d');
            gerarPixels(ctx);
            const textura = new THREE.CanvasTexture(canvas);
            textura.magFilter = THREE.NearestFilter;
            textura.minFilter = THREE.NearestFilter;
            return textura;
        };

        const texLa = criarTextura(ctx => {
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    let v = 200 + Math.random() * 55;
                    ctx.fillStyle = `rgb(${v},${v},${v})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        const texPele = criarTextura(ctx => {
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    let r = 210 + Math.random() * 30;
                    let g = 170 + Math.random() * 30;
                    let b = 150 + Math.random() * 30;
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });

        const matLa = new THREE.MeshStandardMaterial({ map: texLa });
        const matPele = new THREE.MeshStandardMaterial({ map: texPele });
        const matCasco = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const matFocinho = new THREE.MeshStandardMaterial({ color: 0xe57b89 });
        const matOlhoB = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const matOlhoP = new THREE.MeshStandardMaterial({ color: 0x0f0f0f });

        this.materials.push(matLa, matPele, matCasco, matFocinho, matOlhoB, matOlhoP);

        // Corpo
        const corpo = new THREE.Group();
        corpo.position.set(0, 0.4, 0);
        const s = 0.4; // Escala para combinar com o jogo antigo

        const corpoBase = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.6 * s, 2.4 * s), matLa);
        corpoBase.castShadow = true;
        corpo.add(corpoBase);

        const laExtra1 = new THREE.Mesh(new THREE.BoxGeometry(1.8 * s, 1.2 * s, 2.0 * s), matLa);
        corpo.add(laExtra1);

        const rabo = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.6 * s, 0.4 * s), matLa);
        rabo.position.set(0, 0.2 * s, -1.3 * s);
        corpo.add(rabo);
        this.mesh.add(corpo);
        this.corpoMesh = corpo;

        // Cabea
        const cabecaGrupo = new THREE.Group();
        cabecaGrupo.position.set(0, 0.6, 0.5);

        const cabeca = new THREE.Mesh(new THREE.BoxGeometry(1.0 * s, 1.0 * s, 1.2 * s), matPele);
        cabeca.position.set(0, 0.1, 0.2);
        cabeca.castShadow = true;
        cabecaGrupo.add(cabeca);

        const laCabeca = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 0.6 * s, 1.0 * s), matLa);
        laCabeca.position.set(0, 0.4 * s, 0.2 * s);
        cabecaGrupo.add(laCabeca);

        const orelhaEsq = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.2 * s, 0.2 * s), matPele);
        orelhaEsq.position.set(0.3, 0.2, 0.1);
        cabecaGrupo.add(orelhaEsq);

        const orelhaDir = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.2 * s, 0.2 * s), matPele);
        orelhaDir.position.set(-0.3, 0.2, 0.1);
        cabecaGrupo.add(orelhaDir);

        const focinho = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.4 * s, 0.2 * s), matFocinho);
        focinho.position.set(0, 0.05, 0.45 * s);
        cabecaGrupo.add(focinho);

        // Olhos
        const olhoEsqB = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.2 * s, 0.05 * s), matOlhoB);
        olhoEsqB.position.set(0.15, 0.2, 0.4 * s);
        cabecaGrupo.add(olhoEsqB);
        const olhoDirB = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.2 * s, 0.05 * s), matOlhoB);
        olhoDirB.position.set(-0.15, 0.2, 0.4 * s);
        cabecaGrupo.add(olhoDirB);

        this.mesh.add(cabecaGrupo);
        this.cabecaGrupo = cabecaGrupo;

        // Pernas
        const criarPerna = (x, z) => {
            const pernaG = new THREE.Group();
            pernaG.position.set(x * s, 0.3, z * s);

            const perna = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 1.0 * s, 0.4 * s), matPele);
            perna.position.set(0, -0.2, 0);
            perna.castShadow = true;
            pernaG.add(perna);

            const casco = new THREE.Mesh(new THREE.BoxGeometry(0.45 * s, 0.2 * s, 0.45 * s), matCasco);
            casco.position.set(0, -0.4, 0);
            pernaG.add(casco);

            return pernaG;
        };

        this.pernaFE = criarPerna(0.4, 0.8);
        this.pernaFD = criarPerna(-0.4, 0.8);
        this.pernaTE = criarPerna(0.4, -0.8);
        this.pernaTD = criarPerna(-0.4, -0.8);
        this.pernas = [this.pernaFE, this.pernaFD, this.pernaTE, this.pernaTD];

        this.mesh.add(...this.pernas);
    }

    update(delta, world) {
        super.update(delta, world);

        // Respirao suave se parado
        if (this.estado === 'parado') {
            const tempo = Date.now() * 0.002;
            this.corpoMesh.scale.y = 1 + Math.sin(tempo) * 0.02;
            this.cabecaGrupo.rotation.x = Math.sin(tempo * 0.5) * 0.05;
        }
    }
}
