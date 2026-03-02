export class GolemSystem {
    constructor() {
        this.golems = [];
        this.hostileTypes = ['cavaleiro', 'cavaleirotrevas', 'monstrovazio'];
        this.ATTACK_DAMAGE = 7;
    }

    registerGolem(golem, villageData) {
        this.golems.push(golem);
        golem.villageCenter = { x: villageData.centerX, z: villageData.centerZ };
        golem.villageRadius = villageData.radius || 32;
        golem.patrolTarget = null;
        golem.isAggro = false;
        golem.aggroTarget = null;
        golem._patrolTimer = 0;
        golem._attackCooldown = 0;
    }

    update(delta, mundo, animais, camera) {
        for (const golem of this.golems) {
            if (!golem.mesh) continue;

            const pos = golem.mesh.position;
            const center = golem.villageCenter;
            const radius = golem.villageRadius;

            golem._attackCooldown = Math.max(0, golem._attackCooldown - delta);

            // Scan for hostiles within village bounds and golem detection range
            let nearestHostile = null;
            let nearestDist = Infinity;

            for (const mob of animais) {
                if (!mob.mesh || mob.estado === 'morrer') continue;
                if (!this.hostileTypes.includes(mob.type)) continue;

                const mPos = mob.mesh.position;
                const dxV = mPos.x - center.x;
                const dzV = mPos.z - center.z;
                const distToVillage = Math.sqrt(dxV * dxV + dzV * dzV);
                if (distToVillage > radius) continue;

                const dist = this._distanceTo(golem, mPos.x, mPos.z);
                if (dist < 16 && dist < nearestDist) {
                    nearestDist = dist;
                    nearestHostile = mob;
                }
            }

            if (nearestHostile) {
                // Aggro mode — pursue and attack hostile
                golem.isAggro = true;
                golem.aggroTarget = nearestHostile;

                const target = nearestHostile.mesh.position;
                this._moveToward(golem, target.x, target.z);

                if (nearestDist <= 2.5 && golem._attackCooldown <= 0) {
                    const dx = target.x - pos.x;
                    const dz = target.z - pos.z;
                    const len = Math.sqrt(dx * dx + dz * dz) || 1;
                    const pushX = (dx / len) * 5;
                    const pushZ = (dz / len) * 5;
                    nearestHostile.sofrerDano(this.ATTACK_DAMAGE, null, pushX, pushZ);
                    golem._attackCooldown = 1.0;
                }
            } else {
                golem.isAggro = false;
                golem.aggroTarget = null;

                // Stay in bounds
                if (center && radius > 0) {
                    const dx = pos.x - center.x;
                    const dz = pos.z - center.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);
                    if (dist > radius) {
                        this._moveToward(golem, center.x, center.z);
                        golem.patrolTarget = null;
                        continue;
                    }
                }

                // Patrol behavior
                golem._patrolTimer -= delta;

                if (golem.patrolTarget) {
                    const dist = this._distanceTo(golem, golem.patrolTarget.x, golem.patrolTarget.z);
                    if (dist < 2) {
                        golem.andando = false;
                        golem.patrolTarget = null;
                        golem._patrolTimer = 3 + Math.random() * 4;
                    } else {
                        this._moveToward(golem, golem.patrolTarget.x, golem.patrolTarget.z);
                    }
                } else if (golem._patrolTimer <= 0) {
                    // Pick new patrol point within village radius
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * radius * 0.8;
                    golem.patrolTarget = {
                        x: center.x + Math.cos(angle) * dist,
                        z: center.z + Math.sin(angle) * dist
                    };
                    golem._patrolTimer = 5;
                }
            }
        }
    }

    _moveToward(golem, targetX, targetZ) {
        const pos = golem.mesh.position;
        const dx = targetX - pos.x;
        const dz = targetZ - pos.z;
        golem.direcao = Math.atan2(dx, dz);
        golem.andando = true;
    }

    _distanceTo(golem, x, z) {
        const pos = golem.mesh.position;
        const dx = pos.x - x;
        const dz = pos.z - z;
        return Math.sqrt(dx * dx + dz * dz);
    }
}
