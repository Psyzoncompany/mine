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
        this.seedX = Math.random() * 10000;
        this.seedZ = Math.random() * 10000;

        this.heightMap = new Map(); // Armazena a altura máxima (Y) para cada x,z
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
            if (!this.mundo.has(`${x},${y + i},${z}`)) {
                this.mundo.set(`${x},${y + i},${z}`, 4);
                // Update heightmap
                const hKey = `${x},${z}`;
                const cm = this.heightMap.get(hKey);
                if (cm === undefined || (y + i) > cm) this.heightMap.set(hKey, y + i);
            }
        }
        for (let fx = -2; fx <= 2; fx++) {
            for (let fz = -2; fz <= 2; fz++) {
                for (let fy = altura - 2; fy <= altura + 1; fy++) {
                    const dist = Math.abs(fx) + Math.abs(fy - altura) + Math.abs(fz);
                    const tx = x + fx; const ty = y + fy; const tz = z + fz;
                    if (dist < 4 && !this.mundo.has(`${tx},${ty},${tz}`)) {
                        this.mundo.set(`${tx},${ty},${tz}`, 5);
                        // Update heightmap
                        const hKey = `${tx},${tz}`;
                        const cm = this.heightMap.get(hKey);
                        if (cm === undefined || ty > cm) this.heightMap.set(hKey, ty);
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
                
                const nx = x / 30 + this.seedX;
                const nz = z / 30 + this.seedZ;
                let alt = Math.floor(this.noise.noise(nx, 0, nz) * 8);
                
                // Biome noise para decidir se é praia ou rio (praias em terrenos mais abertos/oceanos, rios mais estreitos)
                const isBeach = this.noise.noise(nx / 3, 0, nz / 3) > 0.1 && alt <= 2 && alt >= -2;

                for (let y = -15; y <= alt; y++) {
                    let buraco = this.noise.noise((x + this.seedX) / 12, y / 12, (z + this.seedZ) / 12);
                    if (y < alt - 2 && buraco > 0.4) continue;
                    let tipo = 3; // Pedra por padrão
                    
                    // Adicionar minérios aleatoriamente na pedra
                    if (tipo === 3 && y < alt - 4) {
                        const prob = Math.random();
                        if (y < -10 && prob < 0.01) tipo = 13; // Diamante
                        else if (y < 0 && prob < 0.03) tipo = 12; // Ouro
                        else if (y < 10 && prob < 0.05) tipo = 11; // Ferro
                        else if (prob < 0.06) tipo = 10; // Carvão
                    }

                    if (y === alt) {
                        tipo = 1; // Grama
                        if (y <= 2) {
                            if (isBeach) {
                                tipo = 7; // Areia apenas nas praias
                            } else if (y < 0) {
                                tipo = 2; // Terra em rios/baixo d'água
                            }
                        }
                    }
                    else if (y > alt - 3 && tipo === 3) {
                        tipo = (isBeach && y <= 2) ? 7 : 2; // Areia debaixo da superfície da praia ou Terra
                    }

                    // Se preencher um buraco e não tiver nada pode colocar água se for nivel baixo
                    if (!this.mundo.has(`${x},${y},${z}`)) {
                        this.mundo.set(`${x},${y},${z}`, tipo);
                        
                        // Atualiza heightmap (considerando apenas a geração inicial por enquanto)
                        const hKey = `${x},${z}`;
                        const currentMax = this.heightMap.get(hKey);
                        if (currentMax === undefined || y > currentMax) {
                            this.heightMap.set(hKey, y);
                        }
                    }
                }
                
                // Gerar Água em vales
                if (alt < 0) {
                    for (let y = alt + 1; y <= 0; y++) {
                        if (!this.mundo.has(`${x},${y},${z}`)) {
                            this.mundo.set(`${x},${y},${z}`, 6); // Água
                        }
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
                    if (tipo !== 5 && tipo !== 6) { // Não nasce na Folha nem na Água
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
        const blocosChunk = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [], 13: [], 14: [] };

        for (let lx = 0; lx < this.TAMANHO_CHUNK; lx++) {
            for (let lz = 0; lz < this.TAMANHO_CHUNK; lz++) {
                const x = cx * this.TAMANHO_CHUNK + lx;
                const z = cz * this.TAMANHO_CHUNK + lz;
                for (let y = -15; y < 25; y++) {
                    const tipo = this.mundo.get(`${x},${y},${z}`);
                    if (tipo) {
                        const tBlock = (bx, by, bz) => {
                            const val = this.mundo.get(`${bx},${by},${bz}`);
                            return !val || (val === 5 && tipo !== 5) || (val === 6 && tipo !== 6);
                        };
                        
                        const exposto = tBlock(x + 1, y, z) ||
                            tBlock(x - 1, y, z) ||
                            tBlock(x, y + 1, z) ||
                            tBlock(x, y - 1, z) ||
                            tBlock(x, y, z + 1) ||
                            tBlock(x, y, z - 1);
                        if (exposto && blocosChunk[tipo]) blocosChunk[tipo].push(new THREE.Vector3(x, y, z));
                    }
                }
            }
        }

        for (let tipo in blocosChunk) {
            const pos = blocosChunk[tipo];
            if (pos.length === 0) continue;
            const mat = this.materiais[tipo] || this.materiais[3];

            // Special handling for water (only top plane)
            // Lógica de iluminação Voxel (Sunlight simples)
            if (tipo == 6) {
                const waterGeo = new THREE.PlaneGeometry(1, 1); 
                waterGeo.rotateX(-Math.PI / 2); // horizontal
                const waterMesh = new THREE.InstancedMesh(waterGeo, mat instanceof Array ? mat[2] : mat, pos.length);
                const matriz = new THREE.Matrix4();
                
                const c = new THREE.Color();
                
                pos.forEach((p, index) => {
                    matriz.setPosition(p.x, p.y + 0.45, p.z);
                    waterMesh.setMatrixAt(index, matriz);
                    
                    // Water light logic: 
                    const hKey = `${p.x},${p.z}`;
                    const maxY = this.heightMap.get(hKey);
                    let light = 1.0;
                    if (maxY !== undefined && maxY > p.y) {
                         light = 0.4;
                    }
                    c.setScalar(light);
                    waterMesh.setColorAt(index, c);
                });
                
                waterMesh.instanceColor.needsUpdate = true;
                waterMesh.castShadow = false;
                waterMesh.receiveShadow = true;
                grupo.add(waterMesh);
                continue;
            }

            const instancedMesh = new THREE.InstancedMesh(this.geometriaBloco, mat, pos.length);
            const matriz = new THREE.Matrix4();
            const c = new THREE.Color();
            
            pos.forEach((p, index) => {
                matriz.setPosition(p.x, p.y, p.z);
                instancedMesh.setMatrixAt(index, matriz);
                
                // Calcular luz Baseada em Coluna (SkyLight Vertical)
                const hKey = `${p.x},${p.z}`;
                const maxY = this.heightMap.get(hKey);
                
                let light = 1.0; // Sun default
                
                if (maxY !== undefined && p.y < maxY) {
                     // Bloco está abaixo do topo -> Sombra
                     // Verificar se algum lado está exposto ao sol
                     let exposed = false;
                     // Vizinhos laterais
                     const neighbors = [
                        [p.x+1, p.z], [p.x-1, p.z], [p.x, p.z+1], [p.x, p.z-1]
                     ];
                     
                     for(let n of neighbors) {
                         const nH = this.heightMap.get(`${n[0]},${n[1]}`);
                         // Se a coluna vizinha é mais baixa que o bloco atual, então a lateral recebe sol
                         if (nH === undefined || nH <= p.y) {
                             exposed = true; 
                             break;
                         }
                     }
                     // Penumbra (perto da entrada) vs Caverna profunda
                     // Como não temos FloodFill ainda, usamos 0.6 para exposto lateralmente e 0.15 para coberto total
                     light = exposed ? 0.6 : 0.15; 
                }
                
                c.setScalar(light);
                instancedMesh.setColorAt(index, c);
            });
            instancedMesh.instanceColor.needsUpdate = true;
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
