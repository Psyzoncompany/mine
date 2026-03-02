// combatSystem.js – Bedrock-like basic combat system
// Attack button, raycast, entity damage, cooldown, knockback, hit flash

export class CombatSystem {
    constructor(scene, camera, animals, soundManager) {
        this.scene = scene;
        this.camera = camera;
        this.animals = animals; // reference to the game's animals array
        this.soundManager = soundManager;
        this.cooldown = 0.35; // seconds between hits
        this.lastAttackTime = 0;
        this.reach = 4.5; // attack reach in blocks
        this._raycaster = null;
        this._cooldownRing = null;
    }

    setRaycaster(raycaster) {
        this._raycaster = raycaster;
    }

    canAttack() {
        return (performance.now() / 1000) - this.lastAttackTime >= this.cooldown;
    }

    getCooldownProgress() {
        const elapsed = (performance.now() / 1000) - this.lastAttackTime;
        return Math.min(1, elapsed / this.cooldown);
    }

    attack(playerPosition) {
        if (!this.canAttack()) return { hit: false, reason: 'cooldown' };
        this.lastAttackTime = performance.now() / 1000;

        if (!this._raycaster) return { hit: false, reason: 'no_raycaster' };

        // Check for entities in reach
        const hitAnimal = this._findTargetAnimal(playerPosition);
        if (hitAnimal) {
            return this._damageAnimal(hitAnimal, playerPosition);
        }

        return { hit: false, reason: 'no_target' };
    }

    _findTargetAnimal(playerPosition) {
        if (!this.animals || this.animals.length === 0) return null;

        // Cast ray from camera center
        const dir = new (this._getThree()).Vector3();
        this.camera.getWorldDirection(dir);

        let closest = null;
        let closestDist = this.reach;

        for (const animal of this.animals) {
            if (!animal || !animal.mesh || animal.isDead) continue;
            const pos = animal.mesh.position;
            const dist = playerPosition.distanceTo(pos);
            if (dist > this.reach) continue;

            // Simple box check: is the animal roughly in our crosshair direction?
            const toAnimal = pos.clone().sub(playerPosition).normalize();
            const dot = dir.dot(toAnimal);
            if (dot > 0.85 && dist < closestDist) { // ~30 degree cone
                closestDist = dist;
                closest = animal;
            }
        }
        return closest;
    }

    _damageAnimal(animal, playerPosition) {
        const damage = 5;
        const animalPos = animal.mesh.position;
        const pushDir = animalPos.clone().sub(playerPosition).normalize();

        // Apply damage via the mob's built-in method if available
        if (typeof animal.sofrerDano === 'function') {
            animal.sofrerDano(damage, this.soundManager, pushDir.x * 0.20, pushDir.z * 0.20);
        } else {
            // Fallback: directly reduce HP
            if (animal.hp !== undefined) animal.hp -= damage;
        }

        // Hit flash effect
        this._hitFlash(animal);

        // Play hit sound
        if (this.soundManager && typeof this.soundManager.playSound === 'function') {
            this.soundManager.playSound('dano_hit', { volume: 0.5 });
        }

        return {
            hit: true,
            target: animal,
            damage,
            killed: animal.hp !== undefined && animal.hp <= 0
        };
    }

    _hitFlash(animal) {
        if (!animal.mesh) return;
        const meshes = [];
        animal.mesh.traverse(child => {
            if (child.isMesh && child.material) meshes.push(child);
        });
        meshes.forEach(m => {
            const origColor = m.material.emissive ? m.material.emissive.clone() : null;
            if (m.material.emissive) {
                m.material.emissive.setHex(0xff4444);
                setTimeout(() => {
                    if (m.material.emissive && origColor) m.material.emissive.copy(origColor);
                }, 150);
            }
        });
    }

    _getThree() {
        // Access THREE from the global scope or import
        if (typeof THREE !== 'undefined') return THREE;
        return { Vector3: class { constructor() { this.x = 0; this.y = 0; this.z = 0; } } };
    }
}
