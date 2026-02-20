import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Porco extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'porco', x, y, z, chunkId);
        this.construirModelo();
    }

    construirModelo() {
        // 🎨 Textura procedural de pele de porco com pintinhas
        const criarTexturaPorco = (cor1, cor2, pontos) => {
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = cor1;
            ctx.fillRect(0, 0, 32, 32);
            ctx.fillStyle = cor2;
            for (let i = 0; i < pontos; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 32, Math.random() * 32, Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            return tex;
        };

        const matPele = new THREE.MeshStandardMaterial({ map: criarTexturaPorco('#fbcfe8', '#f472b6', 15), roughness: 0.8 });
        const matFocinho = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.6 });
        const matCasco = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
        const matOlhoP = new THREE.MeshStandardMaterial({ color: 0x0f172a });
        const matOlhoB = new THREE.MeshStandardMaterial({ color: 0xffffff });

        this.materials.push(matPele, matFocinho);

        const s = 0.45; // Escala geral para encaixar no mundo

        // CORPO
        const corpoGrupo = new THREE.Group();
        corpoGrupo.position.y = 0.7 * s;
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.4 * s, 2.4 * s), matPele);
        corpo.castShadow = true;
        corpoGrupo.add(corpo);

        // RABINHO enrolado
        const rabo = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.4 * s, 0.2 * s), matPele);
        rabo.position.set(0, 0.2 * s, -1.3 * s);
        rabo.rotation.x = -Math.PI / 4;
        corpoGrupo.add(rabo);
        this.mesh.add(corpoGrupo);

        // CABEÇA
        const cabecaGrupo = new THREE.Group();
        cabecaGrupo.position.set(0, 0.9 * s, 1.3 * s);

        const cabecaBase = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 1.2 * s, 1.0 * s), matPele);
        cabecaBase.castShadow = true;
        cabecaGrupo.add(cabecaBase);

        // FOCINHO 3D com narinhas
        const focinho = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 0.5 * s, 0.4 * s), matFocinho);
        focinho.position.set(0, -0.1 * s, 0.6 * s);
        cabecaGrupo.add(focinho);

        // Narinhas (dois quadradinhos escuros no focinho)
        const matNarina = new THREE.MeshStandardMaterial({ color: 0x4a3535 });
        const narinaE = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 0.15 * s, 0.05 * s), matNarina);
        narinaE.position.set(0.15 * s, -0.05 * s, 0.81 * s);
        cabecaGrupo.add(narinaE);
        const narinaD = narinaE.clone();
        narinaD.position.x = -0.15 * s;
        cabecaGrupo.add(narinaD);

        // ORELHAS floppy
        const orelhaE = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.5 * s, 0.2 * s), matPele);
        orelhaE.position.set(0.5 * s, 0.7 * s, 0);
        orelhaE.rotation.z = -0.3;
        orelhaE.rotation.x = 0.2;
        orelhaE.castShadow = true;
        const orelhaD = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.5 * s, 0.2 * s), matPele);
        orelhaD.position.set(-0.5 * s, 0.7 * s, 0);
        orelhaD.rotation.z = 0.3;
        orelhaD.rotation.x = 0.2;
        orelhaD.castShadow = true;
        cabecaGrupo.add(orelhaE, orelhaD);

        // OLHOS (com branco + pupila)
        const olhoEB = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.2 * s, 0.05 * s), matOlhoB);
        olhoEB.position.set(0.35 * s, 0.3 * s, 0.51 * s);
        cabecaGrupo.add(olhoEB);
        const olhoEP = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.15 * s, 0.06 * s), matOlhoP);
        olhoEP.position.set(0.33 * s, 0.3 * s, 0.52 * s);
        cabecaGrupo.add(olhoEP);

        const olhoDB = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.2 * s, 0.05 * s), matOlhoB);
        olhoDB.position.set(-0.35 * s, 0.3 * s, 0.51 * s);
        cabecaGrupo.add(olhoDB);
        const olhoDP = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.15 * s, 0.06 * s), matOlhoP);
        olhoDP.position.set(-0.33 * s, 0.3 * s, 0.52 * s);
        cabecaGrupo.add(olhoDP);

        this.mesh.add(cabecaGrupo);
        this.cabeca = cabecaGrupo; // Para animação de comer

        // PERNAS (pivô no topo para girar corretamente)
        const criarPerna = (px, pz) => {
            const g = new THREE.Group();
            g.position.set(px * s, 0.1 * s, pz * s);
            const perna = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.8 * s, 0.4 * s), matPele);
            perna.position.y = -0.4 * s;
            perna.castShadow = true;
            const casco = new THREE.Mesh(new THREE.BoxGeometry(0.45 * s, 0.2 * s, 0.45 * s), matCasco);
            casco.position.y = -0.9 * s;
            casco.castShadow = true;
            g.add(perna, casco);
            return g;
        };

        const pernaFE = criarPerna(0.5, 0.8);
        const pernaFD = criarPerna(-0.5, 0.8);
        const pernaTE = criarPerna(0.5, -0.8);
        const pernaTD = criarPerna(-0.5, -0.8);
        this.pernas = [pernaFE, pernaFD, pernaTE, pernaTD];
        this.mesh.add(pernaFE, pernaFD, pernaTE, pernaTD);
    }
}
