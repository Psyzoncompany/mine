export class HotbarManager {
    constructor({ uiBuilder, slotsCount = 9, onUpdate = null, onSelect = null }) {
        this.uiBuilder = uiBuilder;
        this.slotsCount = slotsCount;
        this.onUpdate = onUpdate;
        this.onSelect = onSelect;
    }

    setSlot(index, item) {
        if (index < 0 || index >= this.slotsCount) return false;
        this.uiBuilder.inventory[index] = item ? { id: item.id, count: item.count } : null;
        if (this.onUpdate) this.onUpdate();
        return true;
    }

    swapSlots(indexA, indexB) {
        if (indexA < 0 || indexA >= this.slotsCount) return false;
        if (indexB < 0 || indexB >= this.slotsCount) return false;
        const temp = this.uiBuilder.inventory[indexA];
        this.uiBuilder.inventory[indexA] = this.uiBuilder.inventory[indexB];
        this.uiBuilder.inventory[indexB] = temp;
        if (this.onUpdate) this.onUpdate();
        return true;
    }

    clearSlot(index) {
        return this.setSlot(index, null);
    }

    selectSlot(index) {
        if (index < 0 || index >= this.slotsCount) return false;
        this.uiBuilder.selectedHotbarIndex = index;
        if (this.onSelect) this.onSelect(index);
        if (this.onUpdate) this.onUpdate();
        return true;
    }

    getSelectedItem() {
        return this.uiBuilder.inventory[this.uiBuilder.selectedHotbarIndex] || null;
    }
}
