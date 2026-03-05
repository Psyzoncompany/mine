export class UIBuilder {
    constructor() {
        this.STACK_MAX = 64;

        // Dados brutos transferidos da classe master do HTML
        this.urlTransparente = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')";
        this.svgPicareta = "url('java/textures/item/wooden_pickaxe.png')";
        this.svgMachado = "url('java/textures/item/wooden_axe.png')";
        this.svgPicaretaPd = "url('java/textures/item/stone_pickaxe.png')";
        this.svgMachadoPd = "url('java/textures/item/stone_axe.png')";
        this.svgPicaretaFe = "url('java/textures/item/iron_pickaxe.png')";
        this.svgMachadoFe = "url('java/textures/item/iron_axe.png')";
        this.svgPicaretaDi = "url('java/textures/item/diamond_pickaxe.png')";
        this.svgMachadoDi = "url('java/textures/item/diamond_axe.png')";
        this.svgGraveto = "url('java/textures/item/stick.png')";

        this.itemDefs = {
            1: { id: 1, nome: "Grama", svgBase: this.urlTransparente, type: "block" },
            2: { id: 2, nome: "Terra", svgBase: this.urlTransparente, type: "block" },
            3: { id: 3, nome: "Pedra", svgBase: this.urlTransparente, type: "block" },
            4: { id: 4, nome: "Mad.", svgBase: this.urlTransparente, type: "block" },
            5: { id: 5, nome: "Folha", svgBase: this.urlTransparente, type: "block" },
            7: { id: 7, nome: "Areia", svgBase: this.urlTransparente, type: "block" }, // Added Areia
            8: { id: 8, nome: "Tábua", svgBase: this.urlTransparente, type: "block" }, // Tábua de Madeira
            9: { id: 9, nome: "Bancada", svgBase: this.urlTransparente, type: "block" }, // Crafting Table
            10: { id: 10, nome: "Min.Carvão", svgBase: this.urlTransparente, type: "block" },
            11: { id: 11, nome: "Min.Ferro", svgBase: this.urlTransparente, type: "block" },
            12: { id: 12, nome: "Min.Ouro", svgBase: this.urlTransparente, type: "block" },
            13: { id: 13, nome: "Min.Diamante", svgBase: this.urlTransparente, type: "block" },
            14: { id: 14, nome: "Pedregulho", svgBase: this.urlTransparente, type: "block" },
            25: { id: 25, nome: "Neve", svgBase: "url('java/textures/block/snow.png')", type: "block" },
            15: { id: 15, nome: "Grav.", svgBase: this.svgGraveto, type: "item" }, // Graveto
            18: { id: 18, nome: "Grama C.", svgBase: "url('java/textures/block/short_grass.png')", type: "item" },
            19: { id: 19, nome: "Papoula", svgBase: "url('java/textures/block/poppy.png')", type: "item" },
            20: { id: 20, nome: "Dente-leão", svgBase: "url('java/textures/block/dandelion.png')", type: "item" },
            21: { id: 21, nome: "Centáurea", svgBase: "url('java/textures/block/cornflower.png')", type: "item" },
            "picareta": { id: "picareta", nome: "Pic.", svgBase: this.svgPicareta, type: "tool" },
            "machado": { id: "machado", nome: "Mach.", svgBase: this.svgMachado, type: "tool" },
            "picareta_pedra": { id: "picareta_pedra", nome: "Pic.Pd", svgBase: this.svgPicaretaPd, type: "tool" },
            "machado_pedra": { id: "machado_pedra", nome: "Mach.Pd", svgBase: this.svgMachadoPd, type: "tool" },
            "picareta_ferro": { id: "picareta_ferro", nome: "Pic.Fe", svgBase: this.svgPicaretaFe, type: "tool" },
            "machado_ferro": { id: "machado_ferro", nome: "Mach.Fe", svgBase: this.svgMachadoFe, type: "tool" },
            "picareta_diamante": { id: "picareta_diamante", nome: "Pic.Di", svgBase: this.svgPicaretaDi, type: "tool" },
            "machado_diamante": { id: "machado_diamante", nome: "Mach.Di", svgBase: this.svgMachadoDi, type: "tool" },
            "pa": { id: "pa", nome: "Pá", svgBase: "url('java/textures/item/wooden_shovel.png')", type: "tool" },
            "pa_pedra": { id: "pa_pedra", nome: "Pá Pd", svgBase: "url('java/textures/item/stone_shovel.png')", type: "tool" },
            "pa_ferro": { id: "pa_ferro", nome: "Pá Fe", svgBase: "url('java/textures/item/iron_shovel.png')", type: "tool" },
            "pa_diamante": { id: "pa_diamante", nome: "Pá Di", svgBase: "url('java/textures/item/diamond_shovel.png')", type: "tool" },
            "tesoura": { id: "tesoura", nome: "Tesoura", svgBase: "url('java/textures/item/shears.png')", type: "tool" },
            
            // Novos Itens (Fornalha e Comida)
            22: { id: 22, nome: "Fornalha", svgBase: "url('java/textures/block/furnace_front.png')", type: "block" },
            23: { id: 23, nome: "Bloco Carvão", svgBase: "url('java/textures/block/coal_block.png')", type: "block" },
            "carvao": { id: "carvao", nome: "Carvão", svgBase: "url('java/textures/item/coal.png')", type: "item" },
            "carne_vaca": { id: "carne_vaca", nome: "Carne Crua", svgBase: "url('java/textures/item/beef.png')", type: "food", foodValue: 3 },
            "carne_vaca_assada": { id: "carne_vaca_assada", nome: "Bife", svgBase: "url('java/textures/item/cooked_beef.png')", type: "food", foodValue: 8 },
            "carne_porco": { id: "carne_porco", nome: "Porco Cru", svgBase: "url('java/textures/item/porkchop.png')", type: "food", foodValue: 3 },
            "carne_porco_assada": { id: "carne_porco_assada", nome: "Porco Assado", svgBase: "url('java/textures/item/cooked_porkchop.png')", type: "food", foodValue: 8 },
            "frango": { id: "frango", nome: "Frango Cru", svgBase: "url('java/textures/item/chicken.png')", type: "food", foodValue: 2 },
            "frango_assado": { id: "frango_assado", nome: "Frango Assado", svgBase: "url('java/textures/item/cooked_chicken.png')", type: "food", foodValue: 6 },
            "carneirinho": { id: "carneirinho", nome: "Carneiro Cru", svgBase: "url('java/textures/item/mutton.png')", type: "food", foodValue: 2 },
            "carneirinho_assado": { id: "carneirinho_assado", nome: "Mutton Assado", svgBase: "url('java/textures/item/cooked_mutton.png')", type: "food", foodValue: 6 },
            "barra_ferro": { id: "barra_ferro", nome: "Barra Fer.", svgBase: "url('java/textures/item/iron_ingot.png')", type: "item" },
            "barra_ouro": { id: "barra_ouro", nome: "Barra Ouro", svgBase: "url('java/textures/item/gold_ingot.png')", type: "item" },
            // 🐑 Blocos de Lã (16 cores)
            40: { id: 40, nome: "Lã Branca", svgBase: "url('java/textures/block/white_wool.png')", type: "block" },
            41: { id: 41, nome: "Lã Laranja", svgBase: "url('java/textures/block/orange_wool.png')", type: "block" },
            42: { id: 42, nome: "Lã Magenta", svgBase: "url('java/textures/block/magenta_wool.png')", type: "block" },
            43: { id: 43, nome: "Lã Azul C.", svgBase: "url('java/textures/block/light_blue_wool.png')", type: "block" },
            44: { id: 44, nome: "Lã Amarela", svgBase: "url('java/textures/block/yellow_wool.png')", type: "block" },
            45: { id: 45, nome: "Lã Lima", svgBase: "url('java/textures/block/lime_wool.png')", type: "block" },
            46: { id: 46, nome: "Lã Rosa", svgBase: "url('java/textures/block/pink_wool.png')", type: "block" },
            47: { id: 47, nome: "Lã Cinza", svgBase: "url('java/textures/block/gray_wool.png')", type: "block" },
            48: { id: 48, nome: "Lã Cinza C.", svgBase: "url('java/textures/block/light_gray_wool.png')", type: "block" },
            49: { id: 49, nome: "Lã Ciano", svgBase: "url('java/textures/block/cyan_wool.png')", type: "block" },
            50: { id: 50, nome: "Lã Roxa", svgBase: "url('java/textures/block/purple_wool.png')", type: "block" },
            51: { id: 51, nome: "Lã Azul", svgBase: "url('java/textures/block/blue_wool.png')", type: "block" },
            52: { id: 52, nome: "Lã Marrom", svgBase: "url('java/textures/block/brown_wool.png')", type: "block" },
            53: { id: 53, nome: "Lã Verde", svgBase: "url('java/textures/block/green_wool.png')", type: "block" },
            54: { id: 54, nome: "Lã Vermelha", svgBase: "url('java/textures/block/red_wool.png')", type: "block" },
            55: { id: 55, nome: "Lã Preta", svgBase: "url('java/textures/block/black_wool.png')", type: "block" },

            // ── Redstone ──────────────────────────────────────────────────────
            56: { id: 56, nome: "Min.Redstone", svgBase: "url('java/textures/block/redstone_ore.png')", type: "block" },
            57: { id: 57, nome: "Bloco Redstone", svgBase: "url('java/textures/block/redstone_block.png')", type: "block" },
            58: { id: 58, nome: "Po Redstone (bloco)", svgBase: "url('java/textures/item/redstone.png')", type: "block" },
            59: { id: 59, nome: "Tocha Redstone", svgBase: "url('java/textures/block/redstone_torch.png')", type: "block" },
            60: { id: 60, nome: "Tocha Redstone (apag.)", svgBase: "url('java/textures/block/redstone_torch_off.png')", type: "block" },
            61: { id: 61, nome: "Lampada Redstone", svgBase: "url('java/textures/block/redstone_lamp.png')", type: "block" },
            62: { id: 62, nome: "Lampada Ligada", svgBase: "url('java/textures/block/redstone_lamp_on.png')", type: "block" },
            63: { id: 63, nome: "Alavanca", svgBase: "url('java/textures/block/lever.png')", type: "block" },
            64: { id: 64, nome: "Alavanca (lig.)", svgBase: "url('java/textures/block/lever.png')", type: "block" },
            65: { id: 65, nome: "Repetidor", svgBase: "url('java/textures/item/repeater.png')", type: "block" },
            66: { id: 66, nome: "Repetidor (lig.)", svgBase: "url('java/textures/block/repeater_on.png')", type: "block" },
            67: { id: 67, nome: "Comparador", svgBase: "url('java/textures/item/comparator.png')", type: "block" },
            68: { id: 68, nome: "Comparador (lig.)", svgBase: "url('java/textures/block/comparator_on.png')", type: "block" },
            69: { id: 69, nome: "Pistao", svgBase: "url('java/textures/block/piston_top.png')", type: "block" },
            70: { id: 70, nome: "Pistao Pegajoso", svgBase: "url('java/textures/block/piston_top_sticky.png')", type: "block" },
            71: { id: 71, nome: "Distribuidor", svgBase: "url('java/textures/block/dispenser_front.png')", type: "block" },
            72: { id: 72, nome: "Dropador", svgBase: "url('java/textures/block/dropper_front.png')", type: "block" },
            "redstone": { id: "redstone", nome: "Po Redstone", svgBase: "url('java/textures/item/redstone.png')", type: "item" },
        };

        this.furnaceRecipes = {
            "carne_vaca": { id: "carne_vaca_assada", count: 1 },
            "carne_porco": { id: "carne_porco_assada", count: 1 },
            "frango": { id: "frango_assado", count: 1 },
            "carneirinho": { id: "carneirinho_assado", count: 1 },
            11: { id: "barra_ferro", count: 1 },
            12: { id: "barra_ouro", count: 1 }
        };

        this.fuelValues = {
            "carvao": 1600,
            23: 16000,
            4: 300,
            8: 300,
            15: 100
        };

        this.inventory = new Array(36).fill(null); // 0-8 Hotbar, 9-35 Inventory
        this.craftInput = new Array(9).fill(null); // Agora suporta até 3x3 na bancada
        this.craftOutput = null; // Slot de Resultado
        this.mouseSlot = null; // Item sendo arrastado
        
        this.furnaceInput = new Array(1).fill(null);
        this.furnaceFuel = new Array(1).fill(null);
        this.furnaceOutput = new Array(1).fill(null);
        this.furnaceProgress = 0;
        this.furnaceFuelTime = 0;
        this.furnaceMaxFuel = 0;

        this.selectedHotbarIndex = 0;
    }

    setupTextures(matList) {
        this.itemDefs[1].svgBase = matList.GramaLado;
        this.itemDefs[2].svgBase = matList.Terra;
        this.itemDefs[3].svgBase = matList.Pedra;
        this.itemDefs[4].svgBase = matList.Madeira;
        this.itemDefs[5].svgBase = matList.Folhas;
        this.itemDefs[7].svgBase = matList.Areia;
        this.itemDefs[8].svgBase = matList.Tabua;
        this.itemDefs[9].svgBase = matList.Bancada;
        this.itemDefs[10].svgBase = matList.Carvao;
        this.itemDefs[11].svgBase = matList.Ferro;
        this.itemDefs[12].svgBase = matList.Ouro;
        this.itemDefs[13].svgBase = matList.Diamante;
        this.itemDefs[14].svgBase = matList.Pedregulho;
        if (this.itemDefs[31]) this.itemDefs[31].svgBase = matList.Granito;
        if (this.itemDefs[32]) this.itemDefs[32].svgBase = matList.Diorito;
        if (this.itemDefs[33]) this.itemDefs[33].svgBase = matList.Andesito;
        if (this.itemDefs[34]) this.itemDefs[34].svgBase = matList.Ardosia;
        if (this.itemDefs[35]) this.itemDefs[35].svgBase = matList.Cobre;
        // Lã
        if (matList.LaBranca) {
            this.itemDefs[40].svgBase = matList.LaBranca;
            this.itemDefs[41].svgBase = matList.LaLaranja;
            this.itemDefs[42].svgBase = matList.LaMagenta;
            this.itemDefs[43].svgBase = matList.LaAzulClaro;
            this.itemDefs[44].svgBase = matList.LaAmarela;
            this.itemDefs[45].svgBase = matList.LaLima;
            this.itemDefs[46].svgBase = matList.LaRosa;
            this.itemDefs[47].svgBase = matList.LaCinza;
            this.itemDefs[48].svgBase = matList.LaCinzaClaro;
            this.itemDefs[49].svgBase = matList.LaCiano;
            this.itemDefs[50].svgBase = matList.LaRoxa;
            this.itemDefs[51].svgBase = matList.LaAzul;
            this.itemDefs[52].svgBase = matList.LaMarrom;
            this.itemDefs[53].svgBase = matList.LaVerde;
            this.itemDefs[54].svgBase = matList.LaVermelha;
            this.itemDefs[55].svgBase = matList.LaPreta;
        }
        // Redstone
        if (matList.RedstoneOre) {
            this.itemDefs[56].svgBase = matList.RedstoneOre;
            this.itemDefs[57].svgBase = matList.RedstoneBlock;
            this.itemDefs[58].svgBase = matList.RedstoneDust;
            this.itemDefs[59].svgBase = matList.RedstoneTorchOn;
            this.itemDefs[60].svgBase = matList.RedstoneTorchOff;
            this.itemDefs[61].svgBase = matList.RedstoneLampOff;
            this.itemDefs[62].svgBase = matList.RedstoneLampOn;
            this.itemDefs[63].svgBase = matList.Lever;
            this.itemDefs[64].svgBase = matList.Lever;
            this.itemDefs[65].svgBase = matList.RepeaterOff;
            this.itemDefs[66].svgBase = matList.RepeaterOn;
            this.itemDefs[67].svgBase = matList.ComparatorOff;
            this.itemDefs[68].svgBase = matList.ComparatorOn;
            this.itemDefs[69].svgBase = matList.PistonTop;
            this.itemDefs[70].svgBase = matList.PistonTopSticky;
            this.itemDefs[71].svgBase = matList.DispenserFront;
            this.itemDefs[72].svgBase = matList.DropperFront;
        }
    }

    // Busca primeiro slot que tenha o mesmo item e não esteja cheio. Depois busca slot vazio.
    addItem(itemId, amount = 1) {
        let remaining = amount;

        // 1. Tenta preencher stacks existentes
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i] && this.inventory[i].id === itemId && this.inventory[i].count < this.STACK_MAX) {
                const space = this.STACK_MAX - this.inventory[i].count;
                if (remaining <= space) {
                    this.inventory[i].count += remaining;
                    return true;
                } else {
                    this.inventory[i].count = this.STACK_MAX;
                    remaining -= space;
                }
            }
        }

        // 2. Procura slot vazio se sobrou
        if (remaining > 0) {
            for (let i = 0; i < this.inventory.length; i++) {
                if (!this.inventory[i]) {
                    this.inventory[i] = { id: itemId, count: remaining };
                    return true;
                }
            }
        }

        return false; // Inventário Cheio
    }

    // Remove do hotbar selecionado, ou do primeiro que achar se não especificado
    removeItem(itemId, amount = 1) {
        let remaining = amount;
        const checkSlot = (slot) => {
            if (slot && slot.id === itemId) {
                if (slot.count >= remaining) {
                    slot.count -= remaining;
                    if (slot.count === 0) return true; // Slot vai ser limpado logo
                    remaining = 0;
                    return true;
                } else {
                    remaining -= slot.count;
                    slot.count = 0; // Limpar slot depois
                }
            }
            return false;
        };

        // Tenta remover primeiro da Hotbar selecionada
        const selectedSlot = this.inventory[this.selectedHotbarIndex];
        if (checkSlot(selectedSlot)) {
            if (selectedSlot.count === 0) this.inventory[this.selectedHotbarIndex] = null;
            return true;
        }

        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i] && this.inventory[i].id === itemId) {
                checkSlot(this.inventory[i]);
                if (this.inventory[i].count === 0) this.inventory[i] = null;
                if (remaining <= 0) return true;
            }
        }

        return false; // Não tem itens suficientes
    }

    getItemCount(itemId) {
        let total = 0;
        for (let s of this.inventory) {
            if (s && s.id === itemId) total += s.count;
        }
        return total;
    }

    renderUI(playerHP, cbAtualizarMao, playerOxygen = 15, playerFood = 20, playerXP = 0, playerXPLevel = 0) {
        // Hotbar Overlay (Tela normal do jogo)
        for (let i = 0; i < 9; i++) {
            const el = document.getElementById(`hotbar-slot-${i}`);
            // Fallback para IDs antigas para não quebrar antes de att HTML
            const oldEl = document.getElementById(`slot-${i}`);
            const targetEl = el || oldEl;

            if (!targetEl) continue;

            targetEl.classList.toggle('active', i === this.selectedHotbarIndex);

            const slot = this.inventory[i];
            const qtyEl = targetEl.querySelector('.qty');

            if (slot) {
                if (qtyEl) qtyEl.innerText = slot.count > 1 ? slot.count : "";
                targetEl.style.backgroundImage = this.itemDefs[slot.id]?.svgBase || "none";
                targetEl.classList.remove('empty');
            } else {
                if (qtyEl) qtyEl.innerText = "";
                targetEl.style.backgroundImage = "none";
                targetEl.classList.add('empty');
            }
        }

        // Renderiza Slots de Inventário Completo
        const renderSlotHtml = (slotElement, slotData) => {
            if (!slotElement) return;
            const bgStr = slotData ? (this.itemDefs[slotData.id]?.svgBase || "none") : "none";
            slotElement.style.backgroundImage = bgStr;
            const q = slotElement.querySelector('.qty');
            if (q) q.innerText = slotData && slotData.count > 1 ? slotData.count : "";
        };

        for (let i = 0; i < 36; i++) {
            renderSlotHtml(document.getElementById(`inv-slot-${i}`), this.inventory[i]);
            renderSlotHtml(document.getElementById(`furnace-inv-slot-${i}`), this.inventory[i]);
        }
        for (let i = 0; i < 9; i++) {
            renderSlotHtml(document.getElementById(`craft-in-${i}`), this.craftInput[i]);
        }
        renderSlotHtml(document.getElementById(`craft-out`), this.craftOutput);

        renderSlotHtml(document.getElementById(`furnace-in`), this.furnaceInput[0]);
        renderSlotHtml(document.getElementById(`furnace-fuel`), this.furnaceFuel[0]);
        renderSlotHtml(document.getElementById(`furnace-out`), this.furnaceOutput[0]);

        const arrowElement = document.getElementById('furnace-arrow-progress');
        if (arrowElement) arrowElement.style.width = `${Math.min(100, Math.max(0, (this.furnaceProgress / 200) * 100))}%`;
        const fireElement = document.getElementById('furnace-fire-icon');
        if (fireElement) fireElement.style.opacity = this.furnaceFuelTime > 0 ? "1" : "0.2";

        // Atualiza Mouse Drag Icon
        const mouseIcon = document.getElementById('mouse-drag-icon');
        if (mouseIcon) {
            if (this.mouseSlot) {
                mouseIcon.style.display = 'flex'; // Exibe centralizado
                mouseIcon.style.backgroundImage = this.itemDefs[this.mouseSlot.id]?.svgBase || "none";
                mouseIcon.innerHTML = `<span class="qty">${this.mouseSlot.count > 1 ? this.mouseSlot.count : ""}</span>`;
            } else {
                mouseIcon.style.display = 'none';
                mouseIcon.innerHTML = '';
            }
        }

        // Atualiza Corações (Estilo Minecraft com metades)
        const hpContainer = document.getElementById('vida-player');
        if (hpContainer) {
            hpContainer.innerHTML = '';
            for (let i = 0; i < 10; i++) {
                const h = document.createElement('div');
                h.className = 'heart';
                const hpRelativo = playerHP - (i * 2);
                if (hpRelativo >= 2) {
                    h.style.backgroundImage = "url('java/textures/gui/sprites/hud/heart/full.png')";
                } else if (hpRelativo === 1) {
                    h.style.backgroundImage = "url('java/textures/gui/sprites/hud/heart/half.png')";
                } else {
                    h.style.backgroundImage = "url('java/textures/gui/sprites/hud/heart/container.png')";
                }
                hpContainer.appendChild(h);
            }
        }

        const bubblesContainer = document.getElementById('bubbles-player');
        if (bubblesContainer) {
            bubblesContainer.innerHTML = '';
            if (playerOxygen < 15) {
                const totalBubbles = Math.ceil((Math.max(0, playerOxygen) / 15) * 10);
                for (let i = 0; i < 10; i++) {
                    const b = document.createElement('div');
                    b.className = 'bubble-icon';
                    if (i < totalBubbles) {
                        b.style.backgroundImage = "url('java/textures/gui/sprites/hud/air.png')";
                    } else {
                        b.style.backgroundImage = "url('java/textures/gui/sprites/hud/air_empty.png')";
                    }
                    bubblesContainer.appendChild(b);
                }
            }
        }

        // ── Barra de Fome ── (10 ícones de coxa de frango, direita para esquerda)
        const hungerContainer = document.getElementById('hunger-bar');
        if (hungerContainer) {
            hungerContainer.innerHTML = '';
            // SVGs: coxa cheia, meia coxa, vazia
            const svgFull  = "url('java/textures/gui/sprites/hud/food_full.png')";
            const svgHalf  = "url('java/textures/gui/sprites/hud/food_half.png')";
            const svgEmpty = "url('java/textures/gui/sprites/hud/food_empty.png')";
            for (let i = 0; i < 10; i++) {
                const f = document.createElement('div');
                f.className = 'food-icon';
                const rel = playerFood - i * 2;
                
                // Precisamos adicionar o container (fundo vazio) independentemente 
                // e a imagem por cima ou no lugar.
                // Como não estamos usando múltiplas imagens no mesmo elemento, vamos colocar food_empty
                // para todos, e os que estiverem cheios a gente usa o food_full/half.
                // Na versão HTML original era só SVG e estava sendo substituído.
                f.style.backgroundImage = rel >= 2 ? svgFull : rel === 1 ? svgHalf : svgEmpty;
                hungerContainer.appendChild(f);
            }
        }

        // ── Barra de XP ──
        const xpFill = document.getElementById('xp-bar-fill');
        if (xpFill) {
            const xpPerLevel = playerXPLevel <= 15 ? 7 : playerXPLevel <= 30 ? (3 * playerXPLevel + 37) : (5 * playerXPLevel + 7);
            xpFill.style.width = playerXP > 0 ? `${Math.min(100, (playerXP / xpPerLevel) * 100)}%` : '0%';
        }
        const xpDisplay = document.getElementById('xp-level-display');
        if (xpDisplay) {
            if (playerXPLevel > 0) {
                xpDisplay.textContent = playerXPLevel;
                xpDisplay.style.display = 'block';
            } else {
                xpDisplay.style.display = 'none';
            }
        }

        const btnPic = document.getElementById('btn-craft-picareta');
        if (btnPic) btnPic.disabled = this.getItemCount(4) < 5;
        const btnMac = document.getElementById('btn-craft-machado');
        if (btnMac) btnMac.disabled = this.getItemCount(4) < 5;

        if (cbAtualizarMao) cbAtualizarMao();
    }
}
