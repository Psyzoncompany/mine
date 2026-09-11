import * as THREE from 'three';

const CHUNK_SIZE = 64;
const VIEW_DISTANCE = 2;
const UNLOAD_DISTANCE = 3;
const PLAYER_HEIGHT = 5;
const WORLD_SEED = 48317;

let scene, camera, renderer, clock;
let yaw = 0, pitch = 0, isPlaying = false;
let chunks = new Map(), enemies = [], projectiles = [], collectibles = [];
let health = 100, energy = 100, fragments = 0, kills = 0;
let damageCooldown = 0, shootCooldown = 0;
const keys = new Set();
const player = { position: new THREE.Vector3(0, PLAYER_HEIGHT, 0), velocity: new THREE.Vector3() };
const mouse = { sensitivity: 0.0022 };

const hud = {
  root: document.getElementById('hud'), health: document.getElementById('health'), energy: document.getElementById('energy'),
  fragments: document.getElementById('fragments'), kills: document.getElementById('kills'), chunk: document.getElementById('chunk')
};

const materials = {};
const geometries = {};

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020709);
  scene.fog = new THREE.FogExp2(0x071114, 0.018);

  camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 520);
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);
  clock = new THREE.Clock();

  createSharedAssets();
  scene.add(new THREE.HemisphereLight(0x3c6c78, 0x020202, 1.15));
  const moon = new THREE.DirectionalLight(0x91e7ff, 0.72);
  moon.position.set(-80, 160, 35);
  scene.add(moon);

  addEvents();
  resetGame(false);
  animate();
}

function createSharedAssets() {
  materials.concrete = new THREE.MeshLambertMaterial({ color: 0x25292b, flatShading: true });
  materials.dark = new THREE.MeshLambertMaterial({ color: 0x111719, flatShading: true });
  materials.neon = new THREE.MeshBasicMaterial({ color: 0x31f3ff });
  materials.alert = new THREE.MeshBasicMaterial({ color: 0xff1838 });
  materials.enemy = new THREE.MeshLambertMaterial({ color: 0x32383b, flatShading: true });
  materials.energy = new THREE.MeshBasicMaterial({ color: 0x65fff2, wireframe: true });
  materials.projectile = new THREE.MeshBasicMaterial({ color: 0x79ffff });
  geometries.box = new THREE.BoxGeometry(1, 1, 1);
  geometries.enemy = new THREE.IcosahedronGeometry(2.1, 0);
  geometries.eye = new THREE.BoxGeometry(1.15, .28, .18);
  geometries.collectible = new THREE.OctahedronGeometry(1.45, 0);
  geometries.projectile = new THREE.SphereGeometry(.32, 8, 6);
}

function addEvents() {
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  document.addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'KeyR') resetGame(true); });
  document.addEventListener('keyup', e => keys.delete(e.code));
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement !== renderer.domElement || !isPlaying) return;
    yaw -= e.movementX * mouse.sensitivity;
    pitch = Math.max(-1.45, Math.min(1.45, pitch - e.movementY * mouse.sensitivity));
  });
  document.addEventListener('mousedown', e => { if (e.button === 0 && isPlaying) shoot(); });
  document.getElementById('start-button').onclick = () => startGame();
  document.getElementById('restart-button').onclick = () => resetGame(true);
}

function startGame() {
  isPlaying = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('crosshair').classList.remove('hidden');
  hud.root.classList.remove('hidden');
  renderer.domElement.requestPointerLock();
}

function seededRandom(x, z, salt = 0) {
  const n = Math.sin((x * 127.1 + z * 311.7 + salt * 74.7 + WORLD_SEED) * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

function chunkKey(cx, cz) { return `${cx},${cz}`; }

function generateChunk(cx, cz) {
  const group = new THREE.Group();
  group.userData = { cx, cz };
  const ox = cx * CHUNK_SIZE, oz = cz * CHUNK_SIZE;
  const floor = mesh(geometries.box, materials.concrete, [CHUNK_SIZE, 2, CHUNK_SIZE], [ox, -1, oz]);
  group.add(floor);
  const ceilingH = 34 + Math.floor(seededRandom(cx, cz, 9) * 34);
  group.add(mesh(geometries.box, materials.dark, [CHUNK_SIZE, 2, CHUNK_SIZE], [ox, ceilingH, oz]));

  // Corredores centrais ficam livres para garantir exploração contínua.
  for (let i = 0; i < 14; i++) {
    const r = seededRandom(cx, cz, i);
    const x = ox - 28 + seededRandom(cx, cz, i + 20) * 56;
    const z = oz - 28 + seededRandom(cx, cz, i + 40) * 56;
    if (Math.abs(x - ox) < 9 || Math.abs(z - oz) < 9) continue;
    const h = 8 + seededRandom(cx, cz, i + 60) * 26;
    const sx = r > .55 ? 4 : 10 + r * 18;
    const sz = r > .55 ? 10 + r * 16 : 4;
    group.add(mesh(geometries.box, materials.concrete, [sx, h, sz], [x, h / 2, z]));
  }

  for (let i = 0; i < 6; i++) {
    const x = ox - 26 + seededRandom(cx, cz, i + 90) * 52;
    const z = oz - 26 + seededRandom(cx, cz, i + 100) * 52;
    group.add(mesh(geometries.box, materials.dark, [3, ceilingH - 4, 3], [x, (ceilingH - 4) / 2, z]));
  }

  for (let i = 0; i < 3; i++) {
    const panel = mesh(geometries.box, (seededRandom(cx, cz, i + 130) > .25 ? materials.neon : materials.alert), [10, .35, .5], [ox - 22 + i * 22, 8 + i * 3, oz - 31]);
    panel.userData.blink = seededRandom(cx, cz, i + 140) * 8;
    group.add(panel);
  }

  if (Math.hypot(cx, cz) > 1) {
    for (let i = 0; i < 1 + Math.floor(seededRandom(cx, cz, 200) * 3); i++) createEnemy(group, ox, oz, cx, cz, i);
  }
  if (seededRandom(cx, cz, 300) > .28) createCollectible(group, ox, oz, cx, cz);
  if (seededRandom(cx, cz, 400) > .78) group.add(mesh(geometries.box, materials.dark, [12, 85, 12], [ox + 23, 42, oz + 23]));

  scene.add(group);
  chunks.set(chunkKey(cx, cz), group);
}

function mesh(geo, mat, scale, pos) { const m = new THREE.Mesh(geo, mat); m.scale.set(...scale); m.position.set(...pos); return m; }

function createEnemy(group, ox, oz, cx, cz, i) {
  const body = new THREE.Mesh(geometries.enemy, materials.enemy);
  body.position.set(ox - 24 + seededRandom(cx, cz, 500 + i) * 48, 6 + seededRandom(cx, cz, 510 + i) * 8, oz - 24 + seededRandom(cx, cz, 520 + i) * 48);
  const eye = new THREE.Mesh(geometries.eye, materials.alert); eye.position.set(0, .35, -2); body.add(eye);
  body.userData = { hp: 3, speed: 9 + seededRandom(cx, cz, 540 + i) * 4, home: body.position.clone(), cooldown: 0 };
  enemies.push(body); group.add(body);
}

function createCollectible(group, ox, oz, cx, cz) {
  const c = new THREE.Mesh(geometries.collectible, materials.energy);
  c.position.set(ox - 22 + seededRandom(cx, cz, 600) * 44, 5, oz - 22 + seededRandom(cx, cz, 610) * 44);
  collectibles.push(c); group.add(c);
}

function updateWorld() {
  const cx = Math.floor((player.position.x + CHUNK_SIZE / 2) / CHUNK_SIZE);
  const cz = Math.floor((player.position.z + CHUNK_SIZE / 2) / CHUNK_SIZE);
  for (let x = cx - VIEW_DISTANCE; x <= cx + VIEW_DISTANCE; x++) for (let z = cz - VIEW_DISTANCE; z <= cz + VIEW_DISTANCE; z++) if (!chunks.has(chunkKey(x, z))) generateChunk(x, z);
  for (const [key, group] of chunks) if (Math.abs(group.userData.cx - cx) > UNLOAD_DISTANCE || Math.abs(group.userData.cz - cz) > UNLOAD_DISTANCE) removeChunk(key, group);
  hud.chunk.textContent = `${cx}, ${cz}`;
}

function removeChunk(key, group) {
  enemies = enemies.filter(e => !group.children.includes(e)); collectibles = collectibles.filter(c => !group.children.includes(c));
  scene.remove(group); chunks.delete(key);
}

function movePlayer(dt) {
  const speed = keys.has('ShiftLeft') ? 23 : 13;
  const dir = new THREE.Vector3((keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0), 0, (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0));
  if (dir.lengthSq()) dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  player.position.addScaledVector(dir, speed * dt);
  player.position.y = PLAYER_HEIGHT;
  camera.position.copy(player.position);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
}

function updateEnemies(dt) {
  damageCooldown -= dt;
  for (const e of enemies) {
    e.rotation.y += dt; e.position.y += Math.sin(performance.now() * .002 + e.id) * dt * .8;
    const toPlayer = player.position.clone().sub(e.position); const d = toPlayer.length();
    if (d < 44) e.position.addScaledVector(toPlayer.normalize(), e.userData.speed * dt);
    if (d < 3.2 && damageCooldown <= 0) { health = Math.max(0, health - 12); damageCooldown = .8; flashDamage(); if (health <= 0) gameOver(); }
  }
}

function shoot() {
  if (energy < 8 || shootCooldown > 0) return;
  energy -= 8; shootCooldown = .16;
  const p = new THREE.Mesh(geometries.projectile, materials.projectile);
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
  p.position.copy(camera.position).addScaledVector(dir, 2);
  p.userData = { dir, life: 1.6 };
  projectiles.push(p); scene.add(p);
}

function updateProjectiles(dt) {
  shootCooldown -= dt;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]; p.position.addScaledVector(p.userData.dir, 82 * dt); p.userData.life -= dt;
    for (const e of enemies) if (p.position.distanceTo(e.position) < 2.4) { e.userData.hp--; p.userData.life = 0; if (e.userData.hp <= 0) { e.parent.remove(e); enemies.splice(enemies.indexOf(e), 1); kills++; } break; }
    if (p.userData.life <= 0) { scene.remove(p); projectiles.splice(i, 1); }
  }
}

function updateCollectibles(dt) {
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i]; c.rotation.x += dt * 1.4; c.rotation.y += dt * 2.1;
    if (c.position.distanceTo(player.position) < 3.4) { fragments++; energy = Math.min(100, energy + 28); c.parent.remove(c); collectibles.splice(i, 1); }
  }
}

function updateHUD() { hud.health.textContent = Math.ceil(health); hud.energy.textContent = Math.floor(energy); hud.fragments.textContent = fragments; hud.kills.textContent = kills; }
function flashDamage() { const el = document.getElementById('damage-flash'); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 120); }
function gameOver() { isPlaying = false; document.exitPointerLock(); document.getElementById('game-over').classList.remove('hidden'); }

function resetGame(lock = true) {
  for (const g of chunks.values()) scene?.remove(g); chunks.clear(); enemies = []; collectibles = []; projectiles.forEach(p => scene.remove(p)); projectiles = [];
  health = 100; energy = 100; fragments = 0; kills = 0; yaw = 0; pitch = 0; player.position.set(0, PLAYER_HEIGHT, 0);
  document.getElementById('game-over').classList.add('hidden'); updateWorld(); updateHUD();
  if (lock) { isPlaying = true; document.getElementById('start-screen').classList.add('hidden'); hud.root.classList.remove('hidden'); document.getElementById('crosshair').classList.remove('hidden'); renderer.domElement.requestPointerLock(); }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  if (isPlaying) { energy = Math.min(100, energy + dt * 7); movePlayer(dt); updateWorld(); updateEnemies(dt); updateProjectiles(dt); updateCollectibles(dt); updateHUD(); }
  for (const group of chunks.values()) for (const o of group.children) if (o.userData.blink !== undefined) o.visible = Math.sin(performance.now() * .004 + o.userData.blink) > -.35;
  renderer.render(scene, camera);
}
