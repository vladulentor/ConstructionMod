"use strict";
class CombatLoot {
    constructor(maxLoot, game) {
        this.maxLoot = maxLoot;
        this.game = game;
        this.drops = [];
        this.renderRequired = true;
        this.lostLoot = new Map();
    }
    initializeMenus() {
        combatMenus.loot.initialize(this);
        document.getElementById('combat-btn-destroy-all-loot').onclick = () => this.destroyAllLoot();
    }
    add(item, quantity, stack = false) {
        if (stack) {
            const existingDrop = this.drops.find((drop) => drop.item === item);
            if (existingDrop !== undefined) {
                existingDrop.quantity += quantity;
            } else {
                this.makeDropRoom();
                this.drops.unshift({
                    item,
                    quantity,
                });
            }
        } else {
            this.makeDropRoom();
            let startIndex = 1;
            if (this.game.modifiers.autoBurying > 0 && this.game.prayer.isUnlocked)
                startIndex = 0; // If auto-burying is enabled, we want to put the item at the top of the list
            this.drops.splice(startIndex, 0, {
                item,
                quantity,
            });
        }
        this.renderRequired = true;
    }
    removeAll() {
        this.drops = [];
        this.renderRequired = true;
    }
    makeDropRoom() {
        var _a;
        if (this.drops.length === this.maxLoot) {
            const removed = this.drops.pop();
            if (removed !== undefined) {
                this.lostLoot.set(removed.item, ((_a = this.lostLoot.get(removed.item)) !== null && _a !== void 0 ? _a : 0) + removed.quantity);
            }
        }
    }
    lootAll() {
        this.drops = this.drops.filter((drop) => {
            const fit = this.game.bank.addItem(drop.item, drop.quantity, false, true, false, true, 'Other.CombatLootContainer');
            if (fit)
                this.game.stats.Combat.add(CombatStats.ItemsLooted, drop.quantity);
            return !fit;
        });
        if (this.drops.length > 0)
            notifyPlayer(this.game.attack, getLangString('TOASTS_NO_BANK_ROOM_EVERYTHING'), 'danger');
        this.renderRequired = true;
        this.render();
    }
    destroyAllLoot() {
        SwalLocale.fire({
            title: getLangString('MENU_TEXT_DESTROY_LOOT_TITLE'),
            html: `<div class="text-center">${getLangString('MENU_TEXT_DESTROY_LOOT_BODY')}</div>`,
            confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
            showCancelButton: true,
            cancelButtonText: getLangString('CHARACTER_SELECT_50'),
        }).then((result) => {
            if (result.isConfirmed) {
                this.actuallyDestroyAllLootNow();
            }
        });
    }
    actuallyDestroyAllLootNow() {
        this.removeAll();
        this.render();
    }
    getSnapshot() {
        const snapshot = new Map();
        this.drops.forEach((drop) => {
            var _a;
            snapshot.set(drop.item, ((_a = snapshot.get(drop.item)) !== null && _a !== void 0 ? _a : 0) + drop.quantity);
        });
        return snapshot;
    }
    lootItem(id) {
        const drop = this.drops[id];
        if (this.game.bank.addItem(drop.item, drop.quantity, false, true, false, true, 'Other.CombatLootContainer')) {
            this.game.stats.Combat.add(CombatStats.ItemsLooted, drop.quantity);
            this.drops.splice(id, 1);
            this.renderRequired = true;
            this.render();
        } else {
            notifyPlayer(this.game.attack, getLangString('TOASTS_NO_BANK_ROOM'), 'danger');
        }
    }
    render() {
        if (this.renderRequired) {
            combatMenus.loot.renderDrops(this.drops, this.maxLoot, this);
        }
        this.renderRequired = false;
    }
    encode(writer) {
        writer.writeArray(this.drops, ({
            item,
            quantity
        }) => {
            writer.writeNamespacedObject(item);
            writer.writeUint32(quantity);
        });
        return writer;
    }
    decode(reader, version) {
        this.drops = reader.getArray((reader) => {
            const item = reader.getNamespacedObject(this.game.items);
            const quantity = reader.getUint32();
            if (typeof item === 'string')
                return undefined;
            return {
                item,
                quantity,
            };
        });
    }
    deserialize(reader, version, idMap) {
        this.drops = [];
        const numDrops = reader.getNumber();
        if (numDrops > this.maxLoot)
            throw new Error('Number of drops exceeds maximum drops.');
        for (let i = 0; i < numDrops; i++) {
            const item = this.game.items.getObjectByID(idMap.items[reader.getNumber()]);
            const quantity = reader.getNumber();
            if (item !== undefined)
                this.drops.push({
                    item,
                    quantity,
                });
        }
        this.renderRequired = true;
    }
}
class CombatLootMenuElement extends HTMLElement {
    constructor() {
        super();
        this.dropElements = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('combat-loot-menu-template'));
        this.lootQuantity = getElementFromFragment(this._content, 'loot-quantity', 'h5');
        this.lootAllButton = getElementFromFragment(this._content, 'loot-all-button', 'button');
        this.lootContainer = getElementFromFragment(this._content, 'loot-container', 'div');
        this.lootingAmuletText = getElementFromFragment(this._content, 'looting-amulet-text', 'small');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Set callbacks and translations */
    initialize(loot) {
        this.lootAllButton.onclick = () => loot.lootAll();
        this.lootingAmuletText.innerHTML = templateLangString('COMBAT_MISC_45', {
            itemName: `<span class="text-danger">${getLangString('ITEM_NAME_Amulet_of_Looting')}</span>`,
            dungeonName: getLangString('DUNGEON_NAME_Spider_Forest'),
        });
    }
    renderDrops(drops, maxDrops, loot) {
        while (this.dropElements.length < drops.length) {
            this.createDropElement();
        }
        this.dropElements.forEach((dropElement, i) => {
            if (drops.length > i) {
                const drop = drops[i];
                dropElement.image.src = drop.item.media;
                dropElement.qty.textContent = numberWithCommas(drop.quantity);
                dropElement.container.onclick = () => loot.lootItem(i);
                dropElement.tooltip.setContent(createItemInformationTooltip(drop.item, true));
                showElement(dropElement.container);
            } else {
                hideElement(dropElement.container);
            }
        });
        this.lootQuantity.textContent = `${getLangString('COMBAT_MISC_44')} ( ${drops.length} / ${maxDrops} )`;
    }
    createDropElement() {
        const drop = createElement('div', {
            className: 'bank-item no-bg btn-light pointer-enabled',
            attributes: [
                ['role', 'button'],
                ['style', 'margin: 10px;'],
            ],
        });
        const dropImage = createElement('img', {
            className: 'bank-img p-3'
        });
        const dropQty = createElement('div', {
            className: 'font-size-sm font-w600 text-center text-combat-smoke loot-span',
            text: '1',
        });
        drop.append(dropImage, createElement('br'), dropQty);
        const tooltip = this.createTooltip(drop);
        this.lootContainer.append(drop);
        this.dropElements.push({
            container: drop,
            image: dropImage,
            qty: dropQty,
            tooltip: tooltip,
        });
    }
    createTooltip(parent) {
        return tippy(parent, {
            content: 'No Loot',
            placement: 'top',
            interactive: false,
            animation: false,
            allowHTML: true,
        });
    }
}
window.customElements.define('combat-loot-menu', CombatLootMenuElement);
//# sourceMappingURL=combatLoot.js.map
checkFileVersion('?12097')