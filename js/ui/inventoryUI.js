// inventoryUI.js — Mobile-friendly inventory modal helpers
export class InventoryUI {
    constructor() {
        this.hotbarPage = 0;
        this.hotbarPageCount = 1; // updated dynamically
        this.slotsPerPage = 8; // 8 visible + 1 "..." button
    }

    /**
     * Calculate which inventory slots are visible on the current hotbar page
     * Returns array of slot indices (0-8) to show, plus whether "..." is last slot
     */
    getVisibleHotbarSlots() {
        const start = this.hotbarPage * this.slotsPerPage;
        const slots = [];
        for (let i = start; i < Math.min(start + this.slotsPerPage, 9); i++) {
            slots.push(i);
        }
        return slots;
    }

    nextPage() {
        this.hotbarPage = (this.hotbarPage + 1) % this.hotbarPageCount;
    }

    prevPage() {
        this.hotbarPage = (this.hotbarPage - 1 + this.hotbarPageCount) % this.hotbarPageCount;
    }

    /**
     * Setup swipe detection on the hotbar element
     */
    setupHotbarSwipe(hotbarEl, onPageChange) {
        let startX = 0;
        let startY = 0;
        const SWIPE_THRESHOLD = 40;

        hotbarEl.addEventListener('touchstart', (e) => {
            // Don't interfere with slot taps
            if (e.target.closest('.slot')) return;
            const t = e.changedTouches[0];
            startX = t.clientX;
            startY = t.clientY;
        }, { passive: true });

        hotbarEl.addEventListener('touchend', (e) => {
            if (e.target.closest('.slot')) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
                if (dx < 0) this.nextPage();
                else this.prevPage();
                if (onPageChange) onPageChange(this.hotbarPage);
            }
        }, { passive: true });
    }
}
