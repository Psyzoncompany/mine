export class UIBuilder {
    constructor() {
        this.STACK_MAX = 64;

        // Dados brutos transferidos da classe master do HTML
        this.urlTransparente = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')";
        this.svgPicareta = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path d=%22M15 1 L9 1 L1 9 L3 11 L11 3 L15 3 Z%22 fill=%22%23BDBDBD%22 stroke=%22%23000%22/><path d=%22M10 6 L2 14 L4 16 L12 8 Z%22 fill=%22%23795548%22 stroke=%22%23000%22/></svg>')";
        this.svgMachado = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path d=%22M14 2 L8 2 L6 6 L12 8 Z%22 fill=%22%23BDBDBD%22 stroke=%22%23000%22/><path d=%22M10 6 L2 14 L4 16 L12 8 Z%22 fill=%22%23795548%22 stroke=%22%23000%22/></svg>')";

        this.itemDefs = {
            1: { id: 1, nome: "Grama", svgBase: this.urlTransparente, type: "block" },
            2: { id: 2, nome: "Terra", svgBase: this.urlTransparente, type: "block" },
            3: { id: 3, nome: "Pedra", svgBase: this.urlTransparente, type: "block" },
            4: { id: 4, nome: "Mad.", svgBase: this.urlTransparente, type: "block" },
            5: { id: 5, nome: "Folha", svgBase: this.urlTransparente, type: "block" }
        };

        this.inventory = new Map();

        this.HOTBAR_SIZE = 7;
        this.hotbar = [
            { kind: "block", itemId: 1 },
            { kind: "block", itemId: 2 },
            { kind: "block", itemId: 3 },
            { kind: "block", itemId: 4 },
            { kind: "block", itemId: 5 },
            { kind: "tool", toolId: "picareta", unlocked: false },
            { kind: "tool", toolId: "machado", unlocked: false }
        ];
        this.selectedHotbarIndex = 0;
    }

    // Call this inside `renderUI()` hook from the World
    setupTextures(matList) {
        this.itemDefs[1].svgBase = matList.GramaLado;
        this.itemDefs[2].svgBase = matList.Terra;
        this.itemDefs[3].svgBase = matList.Pedra;
        this.itemDefs[4].svgBase = matList.Madeira;
        this.itemDefs[5].svgBase = matList.Folhas;
    }

    addItem(itemId, amount = 1) {
        let current = this.inventory.get(itemId) || 0;
        if (current >= this.STACK_MAX) return false;
        this.inventory.set(itemId, Math.min(this.STACK_MAX, current + amount));
        // A UI deve ser atualizada externamente num callback ou evento
        return true;
    }

    removeItem(itemId, amount = 1) {
        let current = this.inventory.get(itemId) || 0;
        if (current < amount) return false;
        this.inventory.set(itemId, current - amount);
        return true;
    }

    getItemCount(itemId) {
        return this.inventory.get(itemId) || 0;
    }

    renderUI(playerHP, cbAtualizarMao) {
        // Hotbar
        this.hotbar.forEach((slot, i) => {
            const el = document.getElementById(`slot-${i}`);
            el.classList.toggle('active', i === this.selectedHotbarIndex);
            const qtyEl = el.querySelector('.qty');

            if (slot.kind === "block") {
                const count = this.getItemCount(slot.itemId);
                qtyEl.innerText = count > 0 ? count : "";
                el.classList.toggle('empty', count === 0);
                el.style.backgroundImage = count > 0 ? this.itemDefs[slot.itemId].svgBase : "none";
            } else {
                el.classList.toggle('empty', !slot.unlocked);
                qtyEl.innerText = "";
                if (slot.toolId === "picareta") el.style.backgroundImage = slot.unlocked ? this.svgPicareta : "none";
                if (slot.toolId === "machado") el.style.backgroundImage = slot.unlocked ? this.svgMachado : "none";
            }
        });

        // Menu Inventário
        const grid = document.getElementById('inv-grid');
        grid.innerHTML = "";
        Object.values(this.itemDefs).forEach(item => {
            const count = this.getItemCount(item.id);
            const div = document.createElement('div');
            div.className = "inv-item";
            div.innerHTML = `<span class="icon" style="background-image: ${item.svgBase};"></span><span class="name">${item.nome}</span><span class="qty">${count}</span>`;
            grid.appendChild(div);
        });

        // Atualiza Vida (10 Corações)
        const hpContainer = document.getElementById('vida-player');
        hpContainer.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const h = document.createElement('div');
            h.className = 'heart';
            const hpRelativo = playerHP - (i * 2);
            if (hpRelativo >= 2) {
                h.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 10%22><path d=%22M5 9 L1 5 Q0 3 2 1 Q4 0 5 2 Q6 0 8 1 Q10 3 9 5 Z%22 fill=%22red%22 stroke=%22black%22 stroke-width=%221%22/></svg>')";
            } else if (hpRelativo === 1) {
                h.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 10%22><path d=%22M5 9 L1 5 Q0 3 2 1 Q4 0 5 2 Q6 0 8 1 Q10 3 9 5 Z%22 fill=%22none%22 stroke=%22black%22 stroke-width=%221%22/><path d=%22M5 9 L1 5 Q0 3 2 1 Q4 0 5 2 V9 Z%22 fill=%22red%22/></svg>')";
            } else {
                h.style.backgroundImage = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 10%22><path d=%22M5 9 L1 5 Q0 3 2 1 Q4 0 5 2 Q6 0 8 1 Q10 3 9 5 Z%22 fill=%22none%22 stroke=%22black%22 stroke-width=%221.5%22/></svg>')";
            }
            hpContainer.appendChild(h);
        }

        document.getElementById('btn-craft-picareta').disabled = this.getItemCount(4) < 5 || this.hotbar[5].unlocked;
        document.getElementById('btn-craft-machado').disabled = this.getItemCount(4) < 5 || this.hotbar[6].unlocked;

        if (cbAtualizarMao) cbAtualizarMao();
    }
}
