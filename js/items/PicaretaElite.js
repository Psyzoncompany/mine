import * as THREE from 'three';

export function criarPicaretaElite() {
    const grupo = new THREE.Group();
    const matIron = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 1.0, roughness: 0.2 });
    const matDarkIron = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.9, roughness: 0.4 });
    const matGlow = new THREE.MeshStandardMaterial({ color: 0x00f2ff, emissive: 0x00f2ff, emissiveIntensity: 2 });
    const s = 0.25;

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 3 * s, 0.1 * s), matDarkIron);
    grupo.add(handle);

    const head = new THREE.Group();
    head.position.y = 1.3 * s;
    const centerBlock = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.4 * s, 0.3 * s), matIron);
    head.add(centerBlock);

    const bladeL = new THREE.Group();
    const part1L = new THREE.Mesh(new THREE.BoxGeometry(1.2 * s, 0.3 * s, 0.2 * s), matIron);
    part1L.position.x = 0.6 * s; part1L.rotation.z = 0.2;
    const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.2 * s, 0.2 * s), matIron);
    tipL.position.set(1.4 * s, -0.2 * s, 0); tipL.rotation.z = 0.5;
    bladeL.add(part1L, tipL);
    head.add(bladeL);

    const bladeR = bladeL.clone(); bladeR.scale.x = -1;
    head.add(bladeR);

    const crystal = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.2 * s, 0.3 * s), matGlow);
    head.add(crystal);
    grupo.add(head);

    // 🔄 Picareta perfeitamente vertical 
    // Como ela foi construída apontando para cima (y positivo), 
    // não precisamos de rotações drásticas. Apenas um leve ajuste
    // para incliná-la na diagonal da mão, "batendo" para frente.
    // Vamos deixar a rotação padrão reta, o ajuste fino na mão será feito lá.
    // grupo.rotation.x = -Math.PI / 2;
    // grupo.rotation.y = Math.PI / 2;

    return grupo;
}
