export class VillagerAI {
    constructor() {
        this.villagers = [];
        this.professionMap = {
            composter: 'farmer',
            lectern: 'librarian',
            smithing_table: 'blacksmith',
            smoker: 'butcher'
        };
        this.timeOfDay = 0;
        this.dayLength = 120; // seconds for a full day cycle
        // Day phases (in seconds): gather, work, sleep
        this.GATHER_PHASE_END = 30;
        this.WORK_PHASE_END = 90;
    }

    registerVillager(villager, villageData) {
        this.villagers.push(villager);

        villager.villageCenter = { x: villageData.centerX, z: villageData.centerZ };
        villager.villageRadius = 32;

        // Link to nearest unlinked bed
        if (villageData.beds) {
            let bestDist = Infinity;
            let bestBed = null;
            for (const bed of villageData.beds) {
                if (bed._linked) continue;
                const distance = this._distanceTo(villager, bed.x, bed.z);
                if (distance < bestDist) {
                    bestDist = distance;
                    bestBed = bed;
                }
            }
            if (bestBed) {
                bestBed._linked = true;
                villager.linkedBed = { x: bestBed.x, y: bestBed.y, z: bestBed.z };
            }
        }

        // Link to nearest unlinked workstation
        if (villageData.workstations) {
            let bestDist = Infinity;
            let bestWorkstation = null;
            for (const ws of villageData.workstations) {
                if (ws._linked) continue;
                const distance = this._distanceTo(villager, ws.x, ws.z);
                if (distance < bestDist) {
                    bestDist = distance;
                    bestWorkstation = ws;
                }
            }
            if (bestWorkstation) {
                bestWorkstation._linked = true;
                villager.linkedWorkstation = { x: bestWorkstation.x, y: bestWorkstation.y, z: bestWorkstation.z };
                villager.profession = this.professionMap[bestWorkstation.type] || null;
            }
        }
    }

    update(delta, mundo, camera) {
        this.timeOfDay = (this.timeOfDay + delta) % this.dayLength;

        for (const villager of this.villagers) {
            if (!villager.mesh) continue;

            const phase = this.timeOfDay;
            const pos = villager.mesh.position;
            const center = villager.villageCenter;
            const radius = villager.villageRadius;

            // Keep villager within village radius
            if (center && radius > 0) {
                const dx = pos.x - center.x;
                const dz = pos.z - center.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius) {
                    this._moveToward(villager, center.x, center.z);
                    continue;
                }
            }

            if (phase < this.GATHER_PHASE_END) {
                // Gather at village center
                if (center) {
                    const distance = this._distanceTo(villager, center.x, center.z);
                    if (distance > 3) {
                        this._moveToward(villager, center.x, center.z);
                    } else {
                        villager.andando = false;
                    }
                } else {
                    this._wander(villager);
                }
            } else if (phase < this.WORK_PHASE_END) {
                // Work phase
                if (villager.linkedWorkstation) {
                    const ws = villager.linkedWorkstation;
                    const distance = this._distanceTo(villager, ws.x, ws.z);
                    if (distance > 2) {
                        this._moveToward(villager, ws.x, ws.z);
                    } else {
                        villager.andando = false;
                    }
                } else {
                    this._wander(villager);
                }
            } else {
                // Night — go to bed
                if (villager.linkedBed) {
                    const bed = villager.linkedBed;
                    const distance = this._distanceTo(villager, bed.x, bed.z);
                    if (distance > 2) {
                        this._moveToward(villager, bed.x, bed.z);
                    } else {
                        villager.andando = false;
                    }
                } else {
                    this._wander(villager);
                }
            }
        }
    }

    _moveToward(villager, targetX, targetZ) {
        const pos = villager.mesh.position;
        const dx = targetX - pos.x;
        const dz = targetZ - pos.z;
        villager.direcao = Math.atan2(dx, dz);
        villager.andando = true;
    }

    _wander(villager) {
        if (!villager.andando) {
            villager.direcao = Math.random() * Math.PI * 2;
            villager.andando = true;
        }
    }

    _distanceTo(villager, x, z) {
        const pos = villager.mesh.position;
        const dx = pos.x - x;
        const dz = pos.z - z;
        return Math.sqrt(dx * dx + dz * dz);
    }
}
