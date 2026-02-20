import * as THREE from 'three';
import { Mob } from './Mob.js';

export class MonstroVazio extends Mob {
    constructor(scene, x, y, z, chunkId) {
        super(scene, 'monstrovazio', x, y, z, chunkId);
        this.vida = 40;
        this.vidaMax = 40;
        this.construirModelo();
    }

    construirModelo() {
        const criarTextura = (desenhar) => {
            const canvas = document.createElement('canvas');
            canvas.width = 16; canvas.height = 16;
            const ctx = canvas.getContext('2d');
            desenhar(ctx);
            const textura = new THREE.CanvasTexture(canvas);
            textura.magFilter = THREE.NearestFilter;
            textura.minFilter = THREE.NearestFilter;
            return textura;
        }

        const texPele = criarTextura(ctx => {
            ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 80; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#2a2a2a' : '#0a0a0a';
                ctx.fillRect(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1);
            }
            ctx.fillStyle = '#ff0055';
            if (Math.random() > 0.3) {
                ctx.fillRect(Math.random() * 14, 0, 1, 16);
                ctx.fillRect(0, Math.random() * 14, 16, 1);
            }
        });

        const texRosto = criarTextura(ctx => {
            ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(2, 4, 3, 2); ctx.fillRect(11, 4, 3, 2);
            ctx.fillRect(4, 8, 2, 1); ctx.fillRect(10, 8, 2, 1);
            ctx.fillRect(6, 11, 1, 1); ctx.fillRect(9, 11, 1, 1);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(3, 4, 1, 1); ctx.fillRect(12, 4, 1, 1);
        });

        const texDentes = criarTextura(ctx => {
            ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#dddddd';
            for (let i = 1; i < 15; i += 3) {
                ctx.fillRect(i, 0, 1, 3);
                ctx.fillRect(i + 1, 13, 1, 3);
            }
        });

        const texCristal = criarTextura(ctx => {
            ctx.fillStyle = '#ff0055'; ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#ff6699'; ctx.fillRect(4, 4, 8, 8);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(6, 6, 2, 2);
        });

        const matPele = new THREE.MeshStandardMaterial({ map: texPele, roughness: 0.9 });
        const matRosto = new THREE.MeshStandardMaterial({ map: texRosto, roughness: 0.5, emissive: 0x550011 });
        const matDentes = new THREE.MeshStandardMaterial({ map: texDentes });
        const matCristal = new THREE.MeshStandardMaterial({ map: texCristal, emissive: 0xff0055, emissiveIntensity: 0.8 });
        const matGarras = new THREE.MeshStandardMaterial({ color: 0x555555 });

        this.materials.push(matPele, matRosto, matDentes, matCristal, matGarras);

        const s = 0.4;

        // Tronco Superior
        const peito = new THREE.Mesh(new THREE.BoxGeometry(2.4 * s, 1.8 * s, 1.6 * s), matPele);
        peito.position.set(0, 3.5 * s, 0);
        peito.castShadow = true;
        this.mesh.add(peito);
        this.peito = peito;

        // Tronco Inferior
        const abdomen = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.4 * s, 1.2 * s), matPele);
        abdomen.position.set(0, 2.0 * s, 0.1 * s);
        abdomen.castShadow = true;
        this.mesh.add(abdomen);

        // Cabeça
        const cabeca = new THREE.Mesh(new THREE.BoxGeometry(1.4 * s, 1.4 * s, 1.4 * s), [matPele, matPele, matPele, matPele, matRosto, matPele]);
        cabeca.position.set(0, 4.8 * s, 0.4 * s);
        cabeca.castShadow = true;
        this.mesh.add(cabeca);
        this.cabeca = cabeca;

        // Maxilar
        const maxilarGeo = new THREE.BoxGeometry(1.4 * s, 0.6 * s, 1.6 * s);
        maxilarGeo.translate(0, -0.3 * s, 0.6 * s);
        const maxilar = new THREE.Mesh(maxilarGeo, matDentes);
        maxilar.position.set(0, 4.3 * s, 0);
        maxilar.castShadow = true;
        this.mesh.add(maxilar);
        this.maxilar = maxilar;

        // Cristais
        for (let i = 0; i < 3; i++) {
            const espinho = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 1.2 * s, 0.4 * s), matCristal);
            espinho.position.set(0, 4.0 * s - (i * 0.8 * s), -0.8 * s - (i * 0.2 * s));
            espinho.rotation.x = -Math.PI / 4;
            this.mesh.add(espinho);
        }

        // Braço Direito
        const bracoDirGrupo = new THREE.Group();
        bracoDirGrupo.position.set(-1.6 * s, 4.5 * s, 0);
        const ombroDir = new THREE.Mesh(new THREE.BoxGeometry(1.0 * s, 1.0 * s, 1.0 * s), matPele);
        ombroDir.position.set(0, -0.5 * s, 0);
        bracoDirGrupo.add(ombroDir);
        const antebracoDir = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 2.2 * s, 0.8 * s), matPele);
        antebracoDir.position.set(-0.2 * s, -2.0 * s, 0.4 * s);
        antebracoDir.rotation.x = -Math.PI / 6;
        bracoDirGrupo.add(antebracoDir);
        const garraDir = new THREE.Mesh(new THREE.BoxGeometry(1.0 * s, 1.2 * s, 1.0 * s), matGarras);
        garraDir.position.set(-0.2 * s, -3.5 * s, 1.0 * s);
        bracoDirGrupo.add(garraDir);
        this.mesh.add(bracoDirGrupo);
        this.bracoDirGrupo = bracoDirGrupo;

        // Braço Esquerdo
        const bracoEsqGeo = new THREE.BoxGeometry(0.6 * s, 2.0 * s, 0.6 * s);
        bracoEsqGeo.translate(0, -1.0 * s, 0);
        const bracoEsq = new THREE.Mesh(bracoEsqGeo, matPele);
        bracoEsq.position.set(1.4 * s, 4.2 * s, 0);
        bracoEsq.rotation.z = -Math.PI / 8;
        this.mesh.add(bracoEsq);
        this.bracoEsq = bracoEsq;

        // Pernas
        const pernaGeo = new THREE.BoxGeometry(0.8 * s, 1.8 * s, 0.8 * s);
        pernaGeo.translate(0, -0.9 * s, 0);
        const pernaDir = new THREE.Mesh(pernaGeo, matPele);
        pernaDir.position.set(-0.6 * s, 1.8 * s, 0.2 * s);
        this.mesh.add(pernaDir);
        this.pernaDir = pernaDir;
        const pernaEsq = new THREE.Mesh(pernaGeo, matPele);
        pernaEsq.position.set(0.6 * s, 1.8 * s, 0.2 * s);
        this.mesh.add(pernaEsq);
        this.pernaEsq = pernaEsq;
        this.pernas = [pernaDir, pernaEsq];

        // Barra de Vida
        const lifeGeo = new THREE.PlaneGeometry(1, 0.1);
        const lifeMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        this.lifeBar = new THREE.Mesh(lifeGeo, lifeMat);
        this.lifeBar.position.y = 6.5 * s;
        this.mesh.add(this.lifeBar);
        this.lifeBar.visible = false;
    }

    update(delta, world, camera) {
        super.update(delta, world, camera);
        const l = THREE.MathUtils.lerp;
        const t = this.animTimer;
        const rt = Date.now() * 0.002;

        // Respiração
        this.peito.scale.x = 1 + Math.sin(rt) * 0.03;
        this.peito.scale.y = 1 + Math.sin(rt) * 0.03;

        // Reset suave
        this.pernaDir.rotation.x = l(this.pernaDir.rotation.x, 0, 0.1);
        this.pernaEsq.rotation.x = l(this.pernaEsq.rotation.x, 0, 0.1);
        this.bracoEsq.rotation.x = l(this.bracoEsq.rotation.x, 0, 0.1);
        this.bracoDirGrupo.rotation.x = l(this.bracoDirGrupo.rotation.x, 0, 0.1);
        this.maxilar.rotation.x = l(this.maxilar.rotation.x, Math.PI / 12, 0.1);

        if (this.estado === 'andar') {
            const s = Math.sin(t * 0.5);
            this.pernaDir.rotation.x = s * 0.6;
            this.pernaEsq.rotation.x = -s * 0.6;
            this.bracoEsq.rotation.x = -s * 0.5;
            this.bracoDirGrupo.rotation.x = -s * 0.2;
        } else if (this.estado === 'atacar') {
            const at = Math.abs(this.tempoAcao);
            this.bracoDirGrupo.rotation.x = -Math.abs(Math.sin(at * 10)) * 2;
            this.maxilar.rotation.x = Math.PI / 12 + Math.abs(Math.sin(at * 10)) * 0.8;
        }

        if (this.vida < this.vidaMax) {
            this.lifeBar.visible = true;
            this.lifeBar.scale.x = Math.max(0, this.vida / this.vidaMax);
        }
    }
}
