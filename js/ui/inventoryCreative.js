import { CREATIVE_CATEGORIES, resolveItemsWithIcons, explainItemsDBExtension } from '../data/itemsDB.js';

const RECENT_STORAGE_KEY = 'meucraft_creative_recent';
const CREATIVE_MANUAL_CHECKLIST = [
    'Abrir/fechar inventario criativo no PC (tecla E)',
    'Abrir/fechar inventario criativo no mobile (botao ...)',
    'Trocar abas de categoria e validar filtragem',
    'Buscar item por nome e tags',
    'Arrastar item do grid para hotbar 1..9',
    'Arrastar item entre slots da hotbar',
    'Selecionar item e posicionar bloco no mundo em modo criativo',
    'Trocar itens rapidamente sem travar a UI',
    'Validar scroll suave sem lag com lista extensa (virtualizacao)'
];

export class InventoryCreative {
    constructor({ uiBuilder, itemsDb, uiState, gameState, controls, inventoryMenu, menu, hotbarManager, onRenderUI, onUpdateHand, isMobileDevice, soundManager }) {
        this.uiBuilder = uiBuilder;
        this.itemsDb = itemsDb;
        this.uiState = uiState;
        this.gameState = gameState;
        this.controls = controls;
        this.inventoryMenu = inventoryMenu;
        this.menu = menu;
        this.hotbarManager = hotbarManager;
        this.onRenderUI = onRenderUI;
        this.onUpdateHand = onUpdateHand;
        this.isMobileDevice = isMobileDevice;
        this.soundManager = soundManager;

        this.menuEl = document.getElementById('creative-menu');
        this.gridEl = document.getElementById('creative-grid');
        this.tabsEl = document.getElementById('creative-tabs');
        this.searchEl = document.getElementById('creative-search');
        this.closeBtnEl = document.getElementById('btn-close-creative');
        this.mobileActionEl = document.getElementById('creative-mobile-action');
        this.mobileActionBtnEl = document.getElementById('creative-add-hotbar');
        this.mobileRemoveBtnEl = document.getElementById('creative-remove-hotbar');
        this.tooltipEl = document.getElementById('creative-tooltip');

        this.fullItems = resolveItemsWithIcons(this.uiBuilder.itemDefs, this.itemsDb)
            .filter((item) => this.uiBuilder.itemDefs[item.id]);
        this.filteredItems = this.fullItems;

        this.searchDebounce = null;
        this.virtual = {
            itemSize: 84,
            rowHeight: 96,
            columns: 1,
            bufferRows: 4
        };

        this.virtualSpacer = document.createElement('div');
        this.virtualSpacer.className = 'creative-grid-spacer';
        this.virtualContent = document.createElement('div');
        this.virtualContent.className = 'creative-grid-content';
        this.gridEl.innerHTML = '';
        this.gridEl.appendChild(this.virtualSpacer);
        this.gridEl.appendChild(this.virtualContent);

        this.dragTouch = {
            active: false,
            item: null,
            ghost: null,
            pointerId: null,
            pressTimer: null,
            startX: 0,
            startY: 0,
            moved: false
        };

        this.uiState.lastRecentIds = this._loadRecentItems();
        this.uiState.creativeCategory = this.uiState.creativeCategory || 'all';

        window.getCreativeItemsDBHelp = explainItemsDBExtension;
        window.getCreativeManualChecklist = () => CREATIVE_MANUAL_CHECKLIST.slice();
    }

    init() {
        this._renderTabs();
        this._bindEvents();
        this._runAutomatedChecks();
        this._applyFilters();
    }

    _bindEvents() {
        if (this.closeBtnEl) this.closeBtnEl.addEventListener('click', () => this.close());

        if (this.searchEl) {
            this.searchEl.addEventListener('input', () => {
                clearTimeout(this.searchDebounce);
                this.searchDebounce = setTimeout(() => {
                    this.uiState.creativeSearch = this.searchEl.value.trim().toLowerCase();
                    this._applyFilters();
                }, 150);
            });
        }

        this.gridEl.addEventListener('scroll', () => this._renderVirtualized());
        window.addEventListener('resize', () => this._renderVirtualized());

        if (this.mobileActionBtnEl) {
            this.mobileActionBtnEl.addEventListener('click', () => {
                if (!this.uiState.cursorItem) return;
                const slotIndex = this.uiBuilder.selectedHotbarIndex;
                this.hotbarManager.setSlot(slotIndex, this.uiState.cursorItem);
                this.hotbarManager.selectSlot(slotIndex);
                this._playUiSound();
            });
        }

        if (this.mobileRemoveBtnEl) {
            this.mobileRemoveBtnEl.addEventListener('click', () => {
                const slotIndex = this.uiBuilder.selectedHotbarIndex;
                this.hotbarManager.clearSlot(slotIndex);
                if (this.onUpdateHand) this.onUpdateHand();
            });
        }

        for (let i = 0; i < 9; i++) {
            const slot = document.getElementById(`hotbar-slot-${i}`);
            if (!slot) continue;
            slot.draggable = true;
            slot.addEventListener('dragstart', (e) => {
                if (!this.uiState.inventoryOpen) return;
                const slotItem = this.uiBuilder.inventory[i];
                if (!slotItem) {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer?.setData('application/x-hotbar-slot', String(i));
                e.dataTransfer.effectAllowed = 'move';
            });
            slot.addEventListener('dragover', (e) => {
                if (!this.uiState.inventoryOpen) return;
                e.preventDefault();
                slot.classList.add('creative-hotbar-target');
            });
            slot.addEventListener('dragleave', () => slot.classList.remove('creative-hotbar-target'));
            slot.addEventListener('drop', (e) => {
                if (!this.uiState.inventoryOpen) return;
                e.preventDefault();
                slot.classList.remove('creative-hotbar-target');
                const fromHotbar = e.dataTransfer?.getData('application/x-hotbar-slot');
                if (fromHotbar !== '' && fromHotbar !== undefined && fromHotbar !== null) {
                    const fromIndex = parseInt(fromHotbar, 10);
                    if (!Number.isNaN(fromIndex) && fromIndex !== i) {
                        this.hotbarManager.swapSlots(fromIndex, i);
                        if (this.onUpdateHand) this.onUpdateHand();
                    }
                    return;
                }
                const raw = e.dataTransfer?.getData('application/x-creative-item');
                if (!raw) return;
                try {
                    const item = JSON.parse(raw);
                    this._setHotbarItem(i, item.id, item.stackSize || 64);
                } catch (_) {
                    // ignore invalid drops
                }
            });
        }
    }

    _renderTabs() {
        if (!this.tabsEl) return;
        this.tabsEl.innerHTML = '';
        CREATIVE_CATEGORIES.forEach((category) => {
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'creative-tab';
            tab.textContent = category.label;
            tab.setAttribute('data-category', category.id);
            tab.setAttribute('role', 'tab');
            tab.tabIndex = 0;
            tab.addEventListener('click', () => {
                this.uiState.creativeCategory = category.id;
                this._applyFilters();
            });
            this.tabsEl.appendChild(tab);
        });
        this._updateTabState();
    }

    _updateTabState() {
        const tabs = this.tabsEl?.querySelectorAll('.creative-tab') || [];
        tabs.forEach((tab) => {
            const isActive = tab.dataset.category === this.uiState.creativeCategory;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    _applyFilters() {
        this._updateTabState();
        const searchText = (this.uiState.creativeSearch || '').trim();
        const currentCategory = this.uiState.creativeCategory;

        let baseList = this.fullItems;
        if (!searchText) {
            if (currentCategory === 'recent') {
                const recentSet = new Set(this.uiState.lastRecentIds || []);
                baseList = this.fullItems.filter((item) => recentSet.has(String(item.id)));
            } else if (currentCategory !== 'all') {
                baseList = this.fullItems.filter((item) => item.category === currentCategory);
            }
        }

        if (searchText) {
            this.filteredItems = this.fullItems.filter((item) => {
                const name = item.name.toLowerCase();
                if (name.includes(searchText)) return true;
                return (item.tags || []).some((tag) => tag.toLowerCase().includes(searchText));
            });
        } else {
            this.filteredItems = baseList;
        }

        this.gridEl.scrollTop = 0;
        this._renderVirtualized();
    }

    _calcVirtualMetrics() {
        const width = this.gridEl.clientWidth || 320;
        const minCard = this.isMobileDevice ? 66 : 74;
        this.virtual.columns = Math.max(1, Math.floor(width / minCard));
        this.virtual.itemSize = Math.floor(width / this.virtual.columns) - 8;
        this.virtual.rowHeight = this.virtual.itemSize + 22;
    }

    _renderVirtualized() {
        this._calcVirtualMetrics();

        const totalItems = this.filteredItems.length;
        const totalRows = Math.ceil(totalItems / this.virtual.columns);
        const viewportHeight = this.gridEl.clientHeight || 300;
        const scrollTop = this.gridEl.scrollTop;
        const visibleRows = Math.ceil(viewportHeight / this.virtual.rowHeight);
        const startRow = Math.max(0, Math.floor(scrollTop / this.virtual.rowHeight) - this.virtual.bufferRows);
        const endRow = Math.min(totalRows, startRow + visibleRows + this.virtual.bufferRows * 2);

        const startIndex = startRow * this.virtual.columns;
        const endIndex = Math.min(totalItems, endRow * this.virtual.columns);

        this.virtualSpacer.style.height = `${totalRows * this.virtual.rowHeight}px`;
        this.virtualContent.style.transform = `translateY(${startRow * this.virtual.rowHeight}px)`;
        this.virtualContent.style.gridTemplateColumns = `repeat(${this.virtual.columns}, minmax(0, 1fr))`;

        this.virtualContent.innerHTML = '';
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.filteredItems[i];
            this.virtualContent.appendChild(this._buildItemCard(item));
        }
    }

    _buildItemCard(item) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'creative-slot';
        button.style.backgroundImage = item.icon || 'none';
        button.draggable = true;
        button.setAttribute('aria-label', item.name);
        button.setAttribute('data-item-id', String(item.id));
        button.setAttribute('data-ui', 'true');

        const label = document.createElement('span');
        label.className = 'creative-label';
        label.textContent = item.name;
        button.appendChild(label);

        button.addEventListener('mouseenter', () => this._showTooltip(item.name, button));
        button.addEventListener('mouseleave', () => this._hideTooltip());

        button.addEventListener('click', (e) => {
            e.preventDefault();
            this._pickToCursor(item);
            if (this.isMobileDevice) this._showMobileAction(item);
        });

        button.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setData('application/x-creative-item', JSON.stringify(item));
            e.dataTransfer.effectAllowed = 'copyMove';
            this._pickToCursor(item);
        });

        button.addEventListener('pointerdown', (e) => this._onTouchPointerDown(e, item));
        button.addEventListener('pointermove', (e) => this._onTouchPointerMove(e));
        button.addEventListener('pointerup', (e) => this._onTouchPointerUp(e));
        button.addEventListener('pointercancel', () => this._cancelTouchDrag());

        return button;
    }

    _pickToCursor(item) {
        const stack = item.stackSize || 64;
        if (!this.uiState.cursorItem) {
            this.uiState.cursorItem = { id: item.id, count: stack };
        } else {
            this.uiState.cursorItem = { id: item.id, count: stack };
        }
        this.uiBuilder.mouseSlot = { ...this.uiState.cursorItem };
        if (this.onRenderUI) this.onRenderUI();
        this._rememberRecent(item.id);
        this._playUiSound();
    }

    _showMobileAction(item) {
        if (!this.mobileActionEl) return;
        this.mobileActionEl.style.display = 'flex';
        this.mobileActionBtnEl.textContent = `Adicionar ${item.name} na Hotbar`;
    }

    _setHotbarItem(index, itemId, count) {
        this.hotbarManager.setSlot(index, { id: itemId, count });
        this.hotbarManager.selectSlot(index);
        this.uiState.cursorItem = null;
        this.uiBuilder.mouseSlot = null;
        if (this.onRenderUI) this.onRenderUI();
        if (this.onUpdateHand) this.onUpdateHand();
        this._playUiSound();
        this._rememberRecent(itemId);
    }

    _getHotbarIndexFromPoint(x, y) {
        const el = document.elementFromPoint(x, y);
        const slotEl = el?.closest('[id^="hotbar-slot-"]');
        if (!slotEl) return -1;
        return parseInt(slotEl.id.replace('hotbar-slot-', ''), 10);
    }

    _onTouchPointerDown(e, item) {
        if (e.pointerType !== 'touch') return;
        this.dragTouch.active = true;
        this.dragTouch.item = item;
        this.dragTouch.pointerId = e.pointerId;
        this.dragTouch.startX = e.clientX;
        this.dragTouch.startY = e.clientY;
        this.dragTouch.moved = false;

        this.dragTouch.pressTimer = setTimeout(() => {
            this._showTooltip(item.name, { getBoundingClientRect: () => ({ left: e.clientX, top: e.clientY, width: 1 }) });
        }, 450);
    }

    _onTouchPointerMove(e) {
        if (!this.dragTouch.active || e.pointerId !== this.dragTouch.pointerId) return;
        const dx = e.clientX - this.dragTouch.startX;
        const dy = e.clientY - this.dragTouch.startY;
        if (Math.hypot(dx, dy) < 10) return;

        clearTimeout(this.dragTouch.pressTimer);
        this.dragTouch.moved = true;
        if (!this.dragTouch.ghost) {
            this.dragTouch.ghost = document.createElement('div');
            this.dragTouch.ghost.className = 'creative-touch-ghost';
            this.dragTouch.ghost.style.backgroundImage = this.dragTouch.item.icon || 'none';
            document.body.appendChild(this.dragTouch.ghost);
        }
        this.dragTouch.ghost.style.left = `${e.clientX - 24}px`;
        this.dragTouch.ghost.style.top = `${e.clientY - 24}px`;
    }

    _onTouchPointerUp(e) {
        if (!this.dragTouch.active || e.pointerId !== this.dragTouch.pointerId) return;
        clearTimeout(this.dragTouch.pressTimer);

        if (this.dragTouch.moved) {
            const hotbarIndex = this._getHotbarIndexFromPoint(e.clientX, e.clientY);
            if (hotbarIndex >= 0) {
                this._setHotbarItem(hotbarIndex, this.dragTouch.item.id, this.dragTouch.item.stackSize || 64);
            }
        }

        this._cancelTouchDrag();
    }

    _cancelTouchDrag() {
        clearTimeout(this.dragTouch.pressTimer);
        if (this.dragTouch.ghost) this.dragTouch.ghost.remove();
        this.dragTouch = {
            active: false,
            item: null,
            ghost: null,
            pointerId: null,
            pressTimer: null,
            startX: 0,
            startY: 0,
            moved: false
        };
        this._hideTooltip();
    }

    _showTooltip(text, targetEl) {
        if (!this.tooltipEl || !text) return;
        const rect = targetEl.getBoundingClientRect();
        this.tooltipEl.textContent = text;
        this.tooltipEl.style.display = 'block';
        this.tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
        this.tooltipEl.style.top = `${Math.max(12, rect.top - 8)}px`;
    }

    _hideTooltip() {
        if (!this.tooltipEl) return;
        this.tooltipEl.style.display = 'none';
    }

    _rememberRecent(itemId) {
        const id = String(itemId);
        const list = (this.uiState.lastRecentIds || []).filter((entry) => entry !== id);
        list.unshift(id);
        this.uiState.lastRecentIds = list.slice(0, 24);
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(this.uiState.lastRecentIds));
    }

    _loadRecentItems() {
        try {
            const raw = localStorage.getItem(RECENT_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    _playUiSound() {
        if (!this.soundManager || !this.soundManager.playSound) return;
        this.soundManager.playSound('click');
    }

    _runAutomatedChecks() {
        const hasBlocksCategory = this.fullItems.some((item) => item.category === 'blocks');
        const hasSearchTags = this.fullItems.some((item) => Array.isArray(item.tags) && item.tags.length > 0);
        console.assert(hasBlocksCategory, '[creative-test] categoria blocks precisa ter itens');
        console.assert(hasSearchTags, '[creative-test] itens precisam conter tags para busca');
    }

    open() {
        this.inventoryMenu.style.display = 'none';
        this.menu.style.display = 'none';
        this.menuEl.style.display = 'flex';
        this.uiState.inventoryOpen = true;
        this.menuEl.classList.add('is-open');
        if (this.controls && this.controls.unlock) this.controls.unlock();
        this._applyFilters();
        if (this.searchEl) this.searchEl.focus();
    }

    close() {
        this.menuEl.style.display = 'none';
        this.menuEl.classList.remove('is-open');
        this.mobileActionEl.style.display = 'none';
        this.uiState.inventoryOpen = false;
        this.uiState.cursorItem = null;
        this.uiBuilder.mouseSlot = null;
        if (this.onRenderUI) this.onRenderUI();
        const canRelock = !this.isMobileDevice && this.menu.style.display !== 'flex';
        if (canRelock && this.controls && this.controls.lock) this.controls.lock();
    }

    toggle() {
        if (this.menuEl.style.display === 'flex') this.close();
        else this.open();
    }
}
