import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Lobo extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'lobo', x, y, z, chunkId);
        this.vida = 8;
        this.agressivo = false;
        this.cauda = null;
        this.caudaAngle = 0;
        this.construirModelo();
    }

    sofrerDano(quantidade, SoundManager, pushX = 0, pushZ = 0) {
        super.sofrerDano(quantidade, SoundManager, pushX, pushZ);
        this.agressivo = true;
    }

    construirModelo() {
        const s = 0.14;

        // Cores do lobo (wolf) estilo Minecraft
        const colors = {
            fur:      0x9D9D9D, // Cinza principal do pelo
            furDark:  0x696969, // Cinza mais escuro (topo/costas)
            belly:    0xD4D4D4, // Barriga / parte de baixo mais clara
            nose:     0x2B2B2B, // Focinho escuro
            noseTop:  0x555555, // Topo do focinho
            eye:      0x1A1A1A, // Olho preto
            eyeWhite: 0xEEEEEE, // Fundo branco do olho
            ear:      0x7A7A7A, // Orelha cinza
            earInner: 0xBB8888, // Interior da orelha (rosado)
            paw:      0xAAAAAA, // Patas
            tail:     0x8A8A8A  // Cauda
        };

        const matFur = new THREE.MeshLambertMaterial({ color: colors.fur });
        const matFurDark = new THREE.MeshLambertMaterial({ color: colors.furDark });
        const matBelly = new THREE.MeshLambertMaterial({ color: colors.belly });
        const matNose = new THREE.MeshLambertMaterial({ color: colors.nose });
        const matNoseTop = new THREE.MeshLambertMaterial({ color: colors.noseTop });
        const matEye = new THREE.MeshLambertMaterial({ color: colors.eye });
        const matEyeWhite = new THREE.MeshLambertMaterial({ color: colors.eyeWhite });
        const matEar = new THREE.MeshLambertMaterial({ color: colors.ear });
        const matEarInner = new THREE.MeshLambertMaterial({ color: colors.earInner });
        const matPaw = new THREE.MeshLambertMaterial({ color: colors.paw });
        const matTail = new THREE.MeshLambertMaterial({ color: colors.tail });

        this.materials.push(matFur, matFurDark, matBelly, matNose, matNoseTop, matEye, matEyeWhite, matEar, matEarInner, matPaw, matTail);

        const createBox = (w, h, d, mat, x, y, z) => {
            const geo = new THREE.BoxGeometry(w * s, h * s, d * s);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x * s, y * s, z * s);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        };

        const baseY = 3;

        // --- CORPO ---
        // Corpo principal (tronco)
        const corpoGrupo = new THREE.Group();
        corpoGrupo.position.set(0, (baseY + 3) * s, 0);
        this.mesh.add(corpoGrupo);

        // Corpo - parte principal
        const corpo = createBox(5, 4.5, 9, matFur, 0, 0, 0);
        corpoGrupo.add(corpo);

        // Costas (dorso mais escuro)
        const costas = createBox(5.1, 1, 9.1, matFurDark, 0, 2.3, 0);
        corpoGrupo.add(costas);

        // Barriga (mais clara)
        const barriga = createBox(4, 1, 8, matBelly, 0, -2.0, 0);
        corpoGrupo.add(barriga);

        // --- CABEÇA ---
        const cabecaGrupo = new THREE.Group();
        cabecaGrupo.position.set(0, (baseY + 5) * s, 5.5 * s);
        this.mesh.add(cabecaGrupo);
        this.cabeca = cabecaGrupo;

        // Cabeça principal
        const cabeca = createBox(4, 4, 4, matFur, 0, 0, 0);
        cabecaGrupo.add(cabeca);

        // Topo da cabeça (mais escuro)
        const topoCabeca = createBox(4.1, 1, 4.1, matFurDark, 0, 2.1, 0);
        cabecaGrupo.add(topoCabeca);

        // Focinho (snout) - projeta para frente
        const focinho = createBox(2.5, 2, 3, matNoseTop, 0, -0.5, 3);
        cabecaGrupo.add(focinho);

        // Parte de baixo do focinho (mais clara)
        const focinhoBaixo = createBox(2.3, 0.8, 2.8, matBelly, 0, -1.2, 3);
        cabecaGrupo.add(focinhoBaixo);

        // Nariz (ponta do focinho)
        const nariz = createBox(1.2, 1, 0.5, matNose, 0, 0.1, 4.6);
        cabecaGrupo.add(nariz);

        // Olhos
        const olhoEsqB = createBox(0.7, 0.7, 0.3, matEyeWhite, 1.5, 0.8, 2.1);
        cabecaGrupo.add(olhoEsqB);
        const olhoEsqP = createBox(0.4, 0.5, 0.35, matEye, 1.5, 0.8, 2.2);
        cabecaGrupo.add(olhoEsqP);

        const olhoDirB = createBox(0.7, 0.7, 0.3, matEyeWhite, -1.5, 0.8, 2.1);
        cabecaGrupo.add(olhoDirB);
        const olhoDirP = createBox(0.4, 0.5, 0.35, matEye, -1.5, 0.8, 2.2);
        cabecaGrupo.add(olhoDirP);

        // Orelhas
        const orelhaEsq = createBox(1.2, 2, 0.8, matEar, 1.6, 3, -0.2);
        cabecaGrupo.add(orelhaEsq);
        const orelhaEsqInner = createBox(0.8, 1.2, 0.3, matEarInner, 1.6, 3.2, 0.1);
        cabecaGrupo.add(orelhaEsqInner);

        const orelhaDir = createBox(1.2, 2, 0.8, matEar, -1.6, 3, -0.2);
        cabecaGrupo.add(orelhaDir);
        const orelhaDirInner = createBox(0.8, 1.2, 0.3, matEarInner, -1.6, 3.2, 0.1);
        cabecaGrupo.add(orelhaDirInner);

        // --- PERNAS ---
        const legGeo = new THREE.BoxGeometry(1.8 * s, 5 * s, 1.8 * s);
        legGeo.translate(0, -2.5 * s, 0); // Pivô no topo

        const posicoesPernas = [
            [-1.5, baseY + 1.5, 3],    // Frente esquerda
            [1.5, baseY + 1.5, 3],     // Frente direita
            [-1.5, baseY + 1.5, -3],   // Trás esquerda
            [1.5, baseY + 1.5, -3]     // Trás direita
        ];

        posicoesPernas.forEach(pos => {
            const perna = new THREE.Mesh(legGeo, matPaw);
            perna.position.set(pos[0] * s, pos[1] * s, pos[2] * s);
            perna.castShadow = true;
            perna.receiveShadow = true;
            this.mesh.add(perna);
            this.pernas.push(perna);
        });

        // --- CAUDA ---
        const caudaGrupo = new THREE.Group();
        caudaGrupo.position.set(0, (baseY + 4.5) * s, -5 * s);
        this.mesh.add(caudaGrupo);
        this.cauda = caudaGrupo;

        const cauda = createBox(1.2, 1.2, 5, matTail, 0, 0, -2.5);
        caudaGrupo.add(cauda);

        // Ponta da cauda (mais clara)
        const pontaCauda = createBox(1, 1, 1.5, matBelly, 0, 0, -5);
        caudaGrupo.add(pontaCauda);

        // Rotação inicial da cauda (levemente para cima)
        caudaGrupo.rotation.x = -0.3;
    }

    update(delta, world, camera) {
        super.update(delta, world, camera);

        // Animação da cauda
        if (this.cauda && this.estado !== 'morrer') {
            if (this.andando) {
                // Cauda balança rápido enquanto anda
                this.caudaAngle += delta * 6;
                this.cauda.rotation.z = Math.sin(this.caudaAngle) * 0.4;
                this.cauda.rotation.x = -0.2;
            } else {
                // Parado: cauda abana devagar (feliz)
                this.caudaAngle += delta * 3;
                this.cauda.rotation.z = Math.sin(this.caudaAngle) * 0.25;
                this.cauda.rotation.x = -0.3;
            }

            // Se agressivo, cauda fica reta e rígida
            if (this.agressivo) {
                this.cauda.rotation.z = 0;
                this.cauda.rotation.x = 0.1; // Levemente para cima, rígida
            }
        }
    }
}
