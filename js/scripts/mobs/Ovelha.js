import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Ovelha extends Mob {
    // Cores da lã: [corId (block ID), peso] — branca é mais comum
    static WOOL_COLORS = [
        { id: 40, peso: 80, cor: [0.88, 0.88, 0.88] },   // Branca
        { id: 48, peso: 5, cor: [0.6, 0.6, 0.6] },        // Cinza Claro
        { id: 47, peso: 5, cor: [0.32, 0.32, 0.32] },     // Cinza
        { id: 55, peso: 3, cor: [0.13, 0.13, 0.13] },     // Preta
        { id: 52, peso: 3, cor: [0.42, 0.25, 0.19] },     // Marrom
        { id: 46, peso: 4, cor: [0.94, 0.63, 0.69] },     // Rosa
    ];

    static sortearCor() {
        const total = Ovelha.WOOL_COLORS.reduce((s, c) => s + c.peso, 0);
        let r = Math.random() * total;
        for (const c of Ovelha.WOOL_COLORS) {
            r -= c.peso;
            if (r <= 0) return c;
        }
        return Ovelha.WOOL_COLORS[0];
    }

    constructor(scene, x, y, z, chunkId) {
        super(scene, 'ovelha', x, y, z, chunkId);
        this.woolColor = Ovelha.sortearCor();
        this.tosada = false;      // Se já foi tosada
        this.regrowTimer = 0;     // Tempo para a lã crescer de volta
        this.REGROW_TIME = 60;    // 60 segundos para a lã crescer de volta
        this.construirModelo();
    }

    construirModelo() {
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
            const [cr, cg, cb] = this.woolColor.cor;
            for (let x = 0; x < 16; x++) {
                for (let y = 0; y < 16; y++) {
                    let v = 200 + Math.random() * 55;
                    ctx.fillStyle = `rgb(${Math.floor(v * cr)},${Math.floor(v * cg)},${Math.floor(v * cb)})`;
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

        const s = 0.4;
        this.woolMeshes = []; // Referências a todas as meshes de lã

        // Corpo
        const corpo = new THREE.Group();
        corpo.position.set(0, 2.0 * s, 0);

        // Corpo interno (pele, visível quando tosada)
        const corpoInterno = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 1.2 * s, 2.0 * s), matPele);
        corpoInterno.castShadow = true;
        corpo.add(corpoInterno);

        const corpoBase = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.6 * s, 2.4 * s), matLa);
        corpoBase.castShadow = true;
        corpo.add(corpoBase);
        this.woolMeshes.push(corpoBase);

        const laExtra1 = new THREE.Mesh(new THREE.BoxGeometry(1.8 * s, 1.2 * s, 2.0 * s), matLa);
        laExtra1.castShadow = true;
        corpo.add(laExtra1);
        this.woolMeshes.push(laExtra1);

        const laExtra2 = new THREE.Mesh(new THREE.BoxGeometry(1.4 * s, 1.8 * s, 2.0 * s), matLa);
        laExtra2.castShadow = true;
        corpo.add(laExtra2);
        this.woolMeshes.push(laExtra2);

        const rabo = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.6 * s, 0.4 * s), matLa);
        rabo.position.set(0, 0.2 * s, -1.3 * s);
        rabo.rotation.x = -Math.PI / 8;
        rabo.castShadow = true;
        corpo.add(rabo);
        this.woolMeshes.push(rabo);

        this.mesh.add(corpo);
        this.corpoMesh = corpo;

        // Cabeça
        const cabecaGrupo = new THREE.Group();
        cabecaGrupo.position.set(0, 2.4 * s, 1.2 * s);

        const cabeca = new THREE.Mesh(new THREE.BoxGeometry(1.0 * s, 1.0 * s, 1.2 * s), matPele);
        cabeca.position.set(0, 0.3 * s, 0.6 * s);
        cabeca.castShadow = true;
        cabecaGrupo.add(cabeca);

        const laCabeca = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 0.6 * s, 1.0 * s), matLa);
        laCabeca.position.set(0, 1.0 * s, 0.6 * s);
        laCabeca.castShadow = true;
        cabecaGrupo.add(laCabeca);
        this.woolMeshes.push(laCabeca);

        const bochechaEsq = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.6 * s, 0.6 * s), matLa);
        bochechaEsq.position.set(0.6 * s, 0.5 * s, 0.6 * s);
        cabecaGrupo.add(bochechaEsq);
        this.woolMeshes.push(bochechaEsq);

        const bochechaDir = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.6 * s, 0.6 * s), matLa);
        bochechaDir.position.set(-0.6 * s, 0.5 * s, 0.6 * s);
        cabecaGrupo.add(bochechaDir);
        this.woolMeshes.push(bochechaDir);

        const orelhaEsq = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.2 * s, 0.2 * s), matPele);
        orelhaEsq.position.set(0.8 * s, 0.5 * s, 0.4 * s);
        orelhaEsq.rotation.z = -Math.PI / 8;
        cabecaGrupo.add(orelhaEsq);

        const orelhaDir = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.2 * s, 0.2 * s), matPele);
        orelhaDir.position.set(-0.8 * s, 0.5 * s, 0.4 * s);
        orelhaDir.rotation.z = Math.PI / 8;
        cabecaGrupo.add(orelhaDir);

        const focinho = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.4 * s, 0.2 * s), matFocinho);
        focinho.position.set(0, 0.1 * s, 1.3 * s);
        cabecaGrupo.add(focinho);

        const olhoZ = 1.21 * s;
        const olhoEsqB = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.2 * s, 0.05 * s), matOlhoB);
        olhoEsqB.position.set(0.35 * s, 0.5 * s, olhoZ);
        cabecaGrupo.add(olhoEsqB);

        const olhoEsqP = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.2 * s, 0.06 * s), matOlhoP);
        olhoEsqP.position.set(0.32 * s, 0.5 * s, olhoZ);
        cabecaGrupo.add(olhoEsqP);

        const olhoDirB = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.2 * s, 0.05 * s), matOlhoB);
        olhoDirB.position.set(-0.35 * s, 0.5 * s, olhoZ);
        cabecaGrupo.add(olhoDirB);

        const olhoDirP = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.2 * s, 0.06 * s), matOlhoP);
        olhoDirP.position.set(-0.32 * s, 0.5 * s, olhoZ);
        cabecaGrupo.add(olhoDirP);

        this.mesh.add(cabecaGrupo);
        this.cabecaGrupo = cabecaGrupo;
        this.cabeca = cabecaGrupo;

        const criarPerna = (x, z) => {
            const pernaG = new THREE.Group();
            pernaG.position.set(x * s, 1.2 * s, z * s);
            const perna = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 1.0 * s, 0.4 * s), matPele);
            perna.position.set(0, -0.5 * s, 0);
            perna.castShadow = true;
            pernaG.add(perna);
            const casco = new THREE.Mesh(new THREE.BoxGeometry(0.45 * s, 0.2 * s, 0.45 * s), matCasco);
            casco.position.set(0, -1.1 * s, 0);
            casco.castShadow = true;
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

    /** Tosa a ovelha, retorna o ID do bloco de lã (ou null se já tosada) */
    tosquiar() {
        if (this.tosada) return null;
        this.tosada = true;
        this.regrowTimer = 0;
        // Esconde todas as meshes de lã
        for (const m of this.woolMeshes) {
            m.visible = false;
        }
        return this.woolColor.id;
    }

    /** Faz a lã crescer de volta */
    regrowWool() {
        this.tosada = false;
        this.regrowTimer = 0;
        for (const m of this.woolMeshes) {
            m.visible = true;
        }
    }

    update(delta, world, camera) {
        super.update(delta, world, camera);
        // Regenerar lã depois de um tempo
        if (this.tosada && this.estado !== 'morrer') {
            this.regrowTimer += delta;
            if (this.regrowTimer >= this.REGROW_TIME) {
                this.regrowWool();
            }
        }
    }
}
