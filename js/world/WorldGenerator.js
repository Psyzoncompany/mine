import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

export class WorldGenerator {
    constructor(scene, uiBuilder, getAnimalFactory) {
        this.scene = scene;
        this.uiBuilder = uiBuilder;
        this.getAnimalFactory = getAnimalFactory;

        this.mundo = new Map();
        this.chunksGerados = new Set();
        this.chunksVisuais = new Map();

        this.TAMANHO_CHUNK = 16;
        this.DISTANCIA_RENDER = 2;
        this.chunkAtualX = -999;
        this.chunkAtualZ = -999;
        this.noise = new ImprovedNoise();

        this.materiais = {};
        this.animais = [];
        this.geometriaBloco = new THREE.BoxGeometry(1, 1, 1);
    }

    setMateriais(materiais) {
        this.materiais = materiais;
    }

    obterIdChunk(cx, cz) {
        return `${cx},${cz}`;
    }

    gerarArvore(x, y, z) {
        const altura = Math.floor(Math.random() * 3) + 4;
        for (let i = 0; i < altura; i++) {
            if (!this.mundo.has(`${x},${y + i},${z}`)) this.mundo.set(`${x},${y + i},${z}`, 4);
        }
        for (let fx = -2; fx <= 2; fx++) {
            for (let fz = -2; fz <= 2; fz++) {
                for (let fy = altura - 2; fy <= altura + 1; fy++) {
                    const dist = Math.abs(fx) + Math.abs(fy - altura) + Math.abs(fz);
                    if (dist < 4 && !this.mundo.has(`${x + fx},${y + fy},${z + fz}`)) {
                        this.mundo.set(`${x + fx},${y + fy},${z + fz}`, 5);
                    }
                }
            }
        }
    }

    gerarDadosChunk(cx, cz) {
        const id = this.obterIdChunk(cx, cz);
        if (this.chunksGerados.has(id)) return;
        this.chunksGerados.add(id);

        for (let lx = 0; lx < this.TAMANHO_CHUNK; lx++) {
            for (let lz = 0; lz < this.TAMANHO_CHUNK; lz++) {
                const x = cx * this.TAMANHO_CHUNK + lx;
                const z = cz * this.TAMANHO_CHUNK + lz;
                let alt = Math.floor(this.noise.noise(x / 30, 0, z / 30) * 8);

                for (let y = -15; y <= alt; y++) {
                    let buraco = this.noise.noise(x / 12, y / 12, z / 12);
                    if (y < alt - 2 && buraco > 0.4) continue;
                    let tipo = 3;
                    if (y === alt) tipo = 1;
                    else if (y > alt - 3) tipo = 2;

                    if (!this.mundo.has(`${x},${y},${z}`)) {
                        this.mundo.set(`${x},${y},${z}`, tipo);
                    }
                }

                if (Math.random() < 0.02 && this.mundo.get(`${x},${alt},${z}`) === 1) {
                    this.gerarArvore(x, alt + 1, z);
                }
            }
        }

        // Spawn de monstros e animais no chunk
        if (Math.random() < 0.4 && this.getAnimalFactory) {
            const ax = cx * this.TAMANHO_CHUNK + Math.floor(Math.random() * this.TAMANHO_CHUNK);
            const az = cz * this.TAMANHO_CHUNK + Math.floor(Math.random() * this.TAMANHO_CHUNK);
            for (let y = 25; y >= -15; y--) {
                const tipo = this.mundo.get(`${ax},${y},${az}`);
                if (tipo) {
                    if (tipo !== 5) { // Não nasce na Folha
                        const animalFactory = this.getAnimalFactory();
                        const novoMob = animalFactory(ax, y + 1.62, az, cx, cz);
                        if (novoMob) this.animais.push(...novoMob);
                    }
                    break;
                }
            }
        }
    }

    construirChunkVisual(cx, cz) {
        const id = this.obterIdChunk(cx, cz);
        if (this.chunksVisuais.has(id)) return;

        const grupo = new THREE.Group();
        const blocosChunk = { 1: [], 2: [], 3: [], 4: [], 5: [] };

        for (let lx = 0; lx < this.TAMANHO_CHUNK; lx++) {
            for (let lz = 0; lz < this.TAMANHO_CHUNK; lz++) {
                const x = cx * this.TAMANHO_CHUNK + lx;
                const z = cz * this.TAMANHO_CHUNK + lz;
                for (let y = -15; y < 25; y++) {
                    const tipo = this.mundo.get(`${x},${y},${z}`);
                    if (tipo) {
                        const exposto = !this.mundo.has(`${x + 1},${y},${z}`) ||
                            !this.mundo.has(`${x - 1},${y},${z}`) ||
                            !this.mundo.has(`${x},${y + 1},${z}`) ||
                            !this.mundo.has(`${x},${y - 1},${z}`) ||
                            !this.mundo.has(`${x},${y},${z + 1}`) ||
                            !this.mundo.has(`${x},${y},${z - 1}`);
                        if (exposto) blocosChunk[tipo].push(new THREE.Vector3(x, y, z));
                    }
                }
            }
        }

        for (let tipo in blocosChunk) {
            const pos = blocosChunk[tipo];
            if (pos.length === 0) continue;
            const instancedMesh = new THREE.InstancedMesh(this.geometriaBloco, this.materiais[tipo], pos.length);
            const matriz = new THREE.Matrix4();
            pos.forEach((p, index) => {
                matriz.setPosition(p.x, p.y, p.z);
                instancedMesh.setMatrixAt(index, matriz);
            });
            instancedMesh.castShadow = true;
            instancedMesh.receiveShadow = true;
            grupo.add(instancedMesh);
        }

        this.scene.add(grupo);
        this.chunksVisuais.set(id, grupo);
    }

    recriarChunkVisual(x, z) {
        const cx = Math.floor(x / this.TAMANHO_CHUNK);
        const cz = Math.floor(z / this.TAMANHO_CHUNK);
        const id = this.obterIdChunk(cx, cz);
        if (this.chunksVisuais.has(id)) {
            const grupo = this.chunksVisuais.get(id);
            this.scene.remove(grupo);
            grupo.children.forEach(m => m.dispose());
            this.chunksVisuais.delete(id);
            this.construirChunkVisual(cx, cz);
        }
    }

    atualizarChunks(camera, callbackTeleportSpawn) {
        const px = Math.floor(camera.position.x / this.TAMANHO_CHUNK);
        const pz = Math.floor(camera.position.z / this.TAMANHO_CHUNK);

        if (px !== this.chunkAtualX || pz !== this.chunkAtualZ || this.chunksVisuais.size === 0) {
            document.getElementById('loading').innerText = "Carregando área...";
            this.chunkAtualX = px;
            this.chunkAtualZ = pz;

            // Gera dados
            for (let cx = px - this.DISTANCIA_RENDER; cx <= px + this.DISTANCIA_RENDER; cx++) {
                for (let cz = pz - this.DISTANCIA_RENDER; cz <= pz + this.DISTANCIA_RENDER; cz++) {
                    this.gerarDadosChunk(cx, cz);
                }
            }

            // Constrói visual
            for (let cx = px - this.DISTANCIA_RENDER; cx <= px + this.DISTANCIA_RENDER; cx++) {
                for (let cz = pz - this.DISTANCIA_RENDER; cz <= pz + this.DISTANCIA_RENDER; cz++) {
                    this.construirChunkVisual(cx, cz);
                }
            }

            // Limpeza
            for (const [id, grupo] of this.chunksVisuais.entries()) {
                const [cx, cz] = id.split(',').map(Number);
                if (Math.abs(cx - px) > this.DISTANCIA_RENDER || Math.abs(cz - pz) > this.DISTANCIA_RENDER) {
                    this.scene.remove(grupo);
                    grupo.children.forEach(m => m.dispose());
                    this.chunksVisuais.delete(id);

                    // Remove mobs também
                    this.animais = this.animais.filter(a => {
                        if (a.chunkId === id) {
                            this.scene.remove(a.mesh);
                            return false;
                        }
                        return true;
                    });
                }
            }

            document.getElementById('loading').innerText = `Chunks ativos: ${this.chunksVisuais.size}`;

            if (!window.playerSpawned && this.chunksVisuais.size > 0 && callbackTeleportSpawn) {
                callbackTeleportSpawn(this.mundo);
                window.playerSpawned = true;
            }
        }
    }

    deleteBlock(x, y, z) {
        this.mundo.delete(`${x},${y},${z}`);
    }

    placeBlock(x, y, z, id) {
        this.mundo.set(`${x},${y},${z}`, id);
    }

    hasBlock(x, y, z) {
        return this.mundo.has(`${x},${y},${z}`);
    }

    getBlock(x, y, z) {
        return this.mundo.get(`${x},${y},${z}`);
    }
}
