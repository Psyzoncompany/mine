import * as THREE from 'three';
import { Mob } from './Mob.js';

export class Leopardo extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'leopardo', x, y, z, chunkId);
        this.vida = 15;
        this.agressivo = false;
        this.construirModelo();
    }

    sofrerDano(quantidade, SoundManager, pushX = 0, pushZ = 0) {
        super.sofrerDano(quantidade, SoundManager, pushX, pushZ);
        this.agressivo = true; // Aqui ele se revolta e começa a atacar
    }

    construirModelo() {
        const s = 0.15; // Tamanho reduzido para mundo do Minecraft

        // Cores
        const colors = {
            base: 0xD4B07A,    // Amarelo queimado/Bege
            belly: 0xE8D5B7,   // Barriga branca/creme
            spot: 0x2A1D17,    // Manchas escuras
            nose: 0x1A110D,    // Focinho
            eye: 0x8DA359     // Olho verde/amarelado
        };

        const matBase = new THREE.MeshLambertMaterial({ color: colors.base });
        const matBelly = new THREE.MeshLambertMaterial({ color: colors.belly });
        const matSpot = new THREE.MeshLambertMaterial({ color: colors.spot });
        const matNose = new THREE.MeshLambertMaterial({ color: colors.nose });
        const matEye = new THREE.MeshLambertMaterial({ color: colors.eye });

        // Compartilha os mesmos materiais para ficarem vermelhos na classe Mob
        this.materials.push(matBase, matBelly, matSpot, matEye, matNose);

        const createMesh = (w, h, d, mat, x, y, z) => {
            const geo = new THREE.BoxGeometry(w * s, h * s, d * s);
            const mesh = new THREE.Mesh(geo, mat); // Aqui não clona, usa a ref pra puxar efeito de dano
            mesh.position.set(x * s, y * s, z * s);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        const addRandomSpots = (parent, count, w, h, d) => {
            for (let i = 0; i < count; i++) {
                const spotSize = (0.6 + Math.random() * 0.4);
                const spot = createMesh(spotSize, spotSize, spotSize, matSpot, 0, 0, 0);

                const face = Math.floor(Math.random() * 3);
                if (face === 0) { // Topo
                    spot.position.set((Math.random() - 0.5) * w * s, h * s / 2, (Math.random() - 0.5) * d * s);
                } else if (face === 1) { // Lado Direito
                    spot.position.set(w * s / 2, (Math.random() - 0.5) * h * s, (Math.random() - 0.5) * d * s);
                } else { // Lado Esquerdo
                    spot.position.set(-w * s / 2, (Math.random() - 0.5) * h * s, (Math.random() - 0.5) * d * s);
                }
                parent.add(spot);
            }
        }

        const baseY = 3;

        // --- CORPO ---
        // Peito (Frente)
        const chestGroup = new THREE.Group();
        chestGroup.position.set(0, baseY * s, 3 * s);
        this.mesh.add(chestGroup);

        const chest = createMesh(4, 5, 6, matBase, 0, 0, 0);
        chestGroup.add(chest);
        const chestBelly = createMesh(3.8, 1, 5.8, matBelly, 0, -2.2, 0);
        chestGroup.add(chestBelly);
        addRandomSpots(chestGroup, 15, 4, 5, 6);

        // Quadril (Trás)
        const hipsGroup = new THREE.Group();
        hipsGroup.position.set(0, (baseY - 0.2) * s, -3 * s);
        this.mesh.add(hipsGroup);

        const hips = createMesh(3.8, 4.5, 6, matBase, 0, 0, 0);
        hipsGroup.add(hips);
        const hipsBelly = createMesh(3.6, 1, 5.8, matBelly, 0, -2, 0);
        hipsGroup.add(hipsBelly);
        addRandomSpots(hipsGroup, 15, 3.8, 4.5, 6);

        // --- CABEÇA E PESCOÇO ---
        const neckGroup = new THREE.Group();
        neckGroup.position.set(0, 1.5 * s, 3 * s);
        chestGroup.add(neckGroup);
        this.cabeca = neckGroup;

        const neck = createMesh(2.5, 3, 3, matBase, 0, 1, 1);
        neckGroup.add(neck);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 2.5 * s, 2 * s);
        neckGroup.add(headGroup);

        const head = createMesh(3.5, 3.5, 3.5, matBase, 0, 0, 0);
        headGroup.add(head);

        // Focinho
        const snout = createMesh(2, 2, 2, matBelly, 0, -0.5, 2.5);
        headGroup.add(snout);
        const nose = createMesh(1, 0.5, 0.5, matNose, 0, 0.5, 1);
        snout.add(nose);

        // Olhos
        const eyeL = createMesh(0.6, 0.6, 0.6, matEye, 1.2, 0.5, 1.6);
        const eyeR = createMesh(0.6, 0.6, 0.6, matEye, -1.2, 0.5, 1.6);
        headGroup.add(eyeL);
        headGroup.add(eyeR);

        // Orelhas
        const earL = createMesh(1, 1, 0.5, matSpot, 1.2, 2, 0);
        const earR = createMesh(1, 1, 0.5, matSpot, -1.2, 2, 0);
        headGroup.add(earL);
        headGroup.add(earR);

        // --- PATAS --- (Pivô no topo para rotação correta)
        const createLeg = (px, pz, parentGroup) => {
            const legGroup = new THREE.Group();
            legGroup.position.set(px * s, -1 * s, pz * s);
            parentGroup.add(legGroup);

            const leg = createMesh(1.5, 5, 1.5, matBase, 0, -2.5, 0);
            legGroup.add(leg);

            const paw = createMesh(1.6, 1, 1.6, matBelly, 0, -4.5, 0.2);
            legGroup.add(paw);

            addRandomSpots(legGroup, 4, 1.5, 4, 1.5); // 4 blocos de mancha por pata
            return legGroup;
        }

        const legFrontL = createLeg(1.5, 1.5, chestGroup);
        const legFrontR = createLeg(-1.5, 1.5, chestGroup);
        const legBackL = createLeg(1.4, -1.5, hipsGroup);
        const legBackR = createLeg(-1.4, -1.5, hipsGroup);
        this.pernas = [legFrontL, legFrontR, legBackL, legBackR];
        this.chestGroup = chestGroup;
        this.hipsGroup = hipsGroup;
        this.baseY = baseY;

        // --- CAUDA --- (Articulada com 4 segmentos)
        const tailGroupBase = new THREE.Group();
        tailGroupBase.position.set(0, 1.5 * s, -3 * s);
        hipsGroup.add(tailGroupBase);

        const tail1 = createMesh(1, 1, 2.5, matBase, 0, 0, -1);
        tailGroupBase.add(tail1);

        const tailGroupMid1 = new THREE.Group();
        tailGroupMid1.position.set(0, 0, -2 * s);
        tailGroupBase.add(tailGroupMid1);
        const tail2 = createMesh(1, 1, 2.5, matBase, 0, 0, -1);
        tailGroupMid1.add(tail2);

        const tailGroupMid2 = new THREE.Group();
        tailGroupMid2.position.set(0, 0, -2 * s);
        tailGroupMid1.add(tailGroupMid2);
        const tail3 = createMesh(1, 1, 2.5, matBase, 0, 0, -1);
        tailGroupMid2.add(tail3);

        const tailGroupEnd = new THREE.Group();
        tailGroupEnd.position.set(0, 0, -2 * s);
        tailGroupMid2.add(tailGroupEnd);
        const tail4 = createMesh(1, 1, 2.5, matSpot, 0, 0, -1); // Ponta escura
        tailGroupEnd.add(tail4);

        this.tailBase = tailGroupBase;
        this.tailMid1 = tailGroupMid1;
        this.tailMid2 = tailGroupMid2;
        this.tailEnd = tailGroupEnd;
    }

    update(delta, world, camera) {
        // Chamada super garante colisão e andar genérico
        super.update(delta, world, camera);

        // Movimentação procedural exclusiva
        const isDead = this.estado === 'morrer';
        const isWalking = this.andando && !isDead && this.estado !== 'dano' && this.estado !== 'comer';

        // Atualização fina do andar do leopardo (animação extra)
        if (isWalking) {
            const walkSpeed = this.animTimer * 1.5; // Do próprio tempo do Mob

            // Reajusta corpo bobbing
            this.chestGroup.position.y = (this.baseY + Math.abs(Math.sin(walkSpeed)) * 0.4) * 0.15;
            this.hipsGroup.position.y = (this.baseY - 0.2 + Math.abs(Math.sin(walkSpeed + Math.PI / 2)) * 0.4) * 0.15;

            // Rabo mechendo
            this.tailBase.rotation.y = Math.sin(walkSpeed) * 0.3;
            this.tailMid1.rotation.y = Math.sin(walkSpeed - 0.5) * 0.3;
            this.tailMid2.rotation.y = Math.sin(walkSpeed - 1.0) * 0.3;
            this.tailEnd.rotation.y = Math.sin(walkSpeed - 1.5) * 0.3;
        } else if (!isDead && this.estado === 'parado') {
            // Respiração
            const t = performance.now() * 0.005;
            this.chestGroup.position.y = (this.baseY + Math.sin(t * 0.5) * 0.15) * 0.15;
            this.hipsGroup.position.y = (this.baseY - 0.2 + Math.sin(t * 0.5 - 0.5) * 0.1) * 0.15;

            this.tailBase.rotation.y = Math.sin(t * 0.3) * 0.2;
            this.tailMid1.rotation.y = Math.sin(t * 0.3 - 0.5) * 0.2;
        }
    }
}
