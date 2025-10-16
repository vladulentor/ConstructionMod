"use strict";
class EquipmentSlot extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.requirements = [];
        try {
            this.allowQuantity = data.allowQuantity;
            this.providesEquipStats = data.providesEquipStats;
            this._emptyMedia = data.emptyMedia;
            this._emptyName = data.emptyName;
            this.gridPosition = EquipmentSlot.getValidGridPosition(data);
            EquipmentSlot.setGridPosition(this.gridPosition);
            if (data.requirements !== undefined)
                game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(EquipmentSlot.name, e, this.id);
        }
    }
    get emptyMedia() {
        return this.getMediaURL(this._emptyMedia);
    }
    get emptyName() {
        if (this.isModded) {
            return this._emptyName;
        } else {
            return getLangString(`EQUIP_SLOT_${this.localID}`);
        }
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.requirements !== undefined)
                this.requirements = game.getRequirementsFromData(data.requirements);
        } catch (e) {
            throw new DataConstructionError(EquipmentSlot.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        if (modData.allowQuantity !== undefined)
            this.allowQuantity = modData.allowQuantity;
        if (modData.providesEquipStats !== undefined)
            this.providesEquipStats = modData.providesEquipStats;
        if (modData.gridPosition !== undefined) {
            EquipmentSlot.checkGridColValid(modData.gridPosition.col);
            if (EquipmentSlot.isGridPositionFree(modData.gridPosition)) {
                EquipmentSlot.freeGridPosition(this.gridPosition);
                EquipmentSlot.setGridPosition(modData.gridPosition);
                this.gridPosition = modData.gridPosition;
            } else {
                console.warn(`Warning modifying Equipment Slot: ${this.id}. Grid Position: ${modData.gridPosition.col}, ${modData.gridPosition.row} is occupied.`);
            }
        }
        if (modData.requirements !== undefined) {
            if (modData.requirements.remove !== undefined) {
                modData.requirements.remove.forEach((type) => {
                    this.requirements = this.requirements.filter((req) => req.type !== type);
                });
            }
            if (modData.requirements.add !== undefined) {
                this.requirements.push(...game.getRequirementsFromData(modData.requirements.add));
            }
        }
    }
    static checkGridColValid(col) {
        if (col < this.gridColRange[0])
            throw new Error(`Invalid Equipment Grid Column: ${col}. Value cannot be below: ${this.gridColRange[0]}`);
        if (col > this.gridColRange[1])
            throw new Error(`Invalid Equipment Grid Column: ${col}. Value cannot exceed: ${this.gridColRange[1]}`);
    }
    static isGridPositionFree(position) {
        const gridRow = this.gridPositions.get(position.row);
        return gridRow === undefined || !gridRow.has(position.col);
    }
    static getValidGridPosition(data) {
        this.checkGridColValid(data.gridPosition.col);
        if (this.isGridPositionFree(data.gridPosition))
            return data.gridPosition;
        if (data.alternativePositions !== undefined) {
            for (let i = 0; i < data.alternativePositions.length; i++) {
                const position = data.alternativePositions[i];
                this.checkGridColValid(position.col);
                if (this.isGridPositionFree(position))
                    return position;
            }
        }
        // Fallback: Add to end of row range
        const row = this.gridRowRange[1] + 1;
        return {
            col: data.gridPosition.col,
            row
        };
    }
    static setGridPosition(position) {
        const {
            row,
            col
        } = position;
        let gridRow = this.gridPositions.get(row);
        if (gridRow === undefined) {
            gridRow = new Set();
            this.gridPositions.set(row, gridRow);
        }
        gridRow.add(col);
        if (row < this.gridRowRange[0])
            this.gridRowRange[0] = row;
        if (row > this.gridRowRange[1])
            this.gridRowRange[1] = row;
    }
    static freeGridPosition(position) {
        const {
            row,
            col
        } = position;
        const gridRow = this.gridPositions.get(row);
        if (gridRow === undefined)
            throw new Error(`Error freeing grid position, position is not set.`);
        gridRow.delete(col);
        if (gridRow.size === 0) {
            this.gridPositions.delete(row);
            if (row === this.gridRowRange[0]) {
                for (let i = row; i <= this.gridRowRange[1]; i++) {
                    if (this.gridPositions.has(i)) {
                        this.gridRowRange[0] = i;
                        break;
                    }
                }
            } else if (row === this.gridRowRange[1]) {
                for (let i = row; i >= this.gridRowRange[0]; i--) {
                    if (this.gridPositions.has(i)) {
                        this.gridRowRange[1] = i;
                        break;
                    }
                }
            }
        }
    }
    static init() {
        this.setGridPosition(this.SUMMONING_SYNERGY_POSITION);
    }
    static getGridSize() {
        return {
            cols: {
                min: this.gridColRange[0],
                max: this.gridColRange[1],
            },
            rows: {
                min: this.gridRowRange[0],
                max: this.gridRowRange[1],
            },
        };
    }
}
/** Map of grid rows -> grid columns -> slots */
EquipmentSlot.gridPositions = new Map();
EquipmentSlot.gridColRange = [0, 4];
EquipmentSlot.gridRowRange = [0, 0];
EquipmentSlot.SUMMONING_SYNERGY_POSITION = {
    col: 2,
    row: 5,
};
EquipmentSlot.init();
const MAX_QUICK_EQUIP_ITEMS = 3;
class Equipment {
    /** Class to manage the equipped items of players */
    constructor(game) {
        this.game = game;
        this.equippedItems = {};
        this.equippedArray = [];
        /** Maps EquipmentItems to EquipmentSlots */
        this.itemSlotMap = new Map();
        /** Slots that provide stats and use charges */
        this.itemChargeUsers = new Set();
        game.equipmentSlots.forEach((slot) => {
            const equippedItem = new EquippedItem(slot, this.game.emptyEquipmentItem);
            this.equippedItems[slot.id] = equippedItem;
            this.equippedArray.push(equippedItem);
        });
    }
    /** Determines if the equipped Weapon is 2-Handed */
    get isWeapon2H() {
        return this.equippedItems["melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ ].item.occupiesSlots.some((slot) => slot.id === "melvorD:Shield" /* EquipmentSlotIDs.Shield */ );
    }
    get equipMenuMedia() {
        return this.equippedItems["melvorD:Helmet" /* EquipmentSlotIDs.Helmet */ ].media;
    }
    /** Returns the items that will be removed on equipping */
    getItemsAddedOnEquip(item, slot) {
        if (slot === undefined)
            slot = item.validSlots[0];
        const slotsToUnequip = this.getSlotsToUnequip(item, slot);
        const itemsAdded = slotsToUnequip.map((slot) => {
            const equippedItem = this.equippedItems[slot.id];
            return {
                item: equippedItem.item,
                quantity: equippedItem.quantity,
            };
        });
        return itemsAdded;
    }
    /** Returns the items that will be removed on unequipping */
    getItemsAddedOnUnequip(slot) {
        const rootSlot = this.getRootSlot(slot);
        const unequipSlot = this.equippedItems[rootSlot.id];
        return {
            item: unequipSlot.item,
            quantity: unequipSlot.quantity,
        };
    }
    /** Gets the actually equipped slots to unequip when equipping an item */
    getSlotsToUnequip(itemToEquip, slot) {
        const slotsRequired = [slot, ...itemToEquip.occupiesSlots];
        // First identify the slots that will be unequipped
        const slotsToUnequip = [];
        slotsRequired.forEach((slot) => {
            const equippedItem = this.equippedItems[slot.id];
            if (!equippedItem.isEmpty) {
                const rootSlotType = this.getRootSlot(slot);
                if (!slotsToUnequip.includes(rootSlotType))
                    slotsToUnequip.push(rootSlotType);
            }
        });
        return slotsToUnequip;
    }
    /** Gets the root slot of an occupied slot */
    getRootSlot(slot) {
        const equippedItem = this.equippedItems[slot.id];
        let rootSlotType;
        if (equippedItem.occupiedBy === undefined) {
            rootSlotType = slot;
        } else {
            rootSlotType = equippedItem.occupiedBy;
        }
        return rootSlotType;
    }
    /** Performs the equipment process, removing equipped items */
    equipItem(itemToEquip, slot, quantity) {
        const slotsToUnequip = this.getSlotsToUnequip(itemToEquip, slot);
        // Set the slots to unequip to empty
        slotsToUnequip.forEach((unequipType) => {
            this.unequipItem(unequipType);
        });
        this.itemSlotMap.set(itemToEquip, slot);
        if (itemToEquip.consumesChargesOn !== undefined)
            this.itemChargeUsers.add(this.equippedItems[slot.id]);
        // Set the new slots to be occupied
        this.equippedItems[slot.id].setEquipped(itemToEquip, quantity, itemToEquip.occupiesSlots);
        itemToEquip.occupiesSlots.forEach((occupied) => this.equippedItems[occupied.id].setOccupied(itemToEquip, slot));
    }
    /** Performs the unequipment process, removing the item */
    unequipItem(slot) {
        const unequip = this.equippedItems[this.getRootSlot(slot).id];
        this.itemSlotMap.delete(unequip.item);
        if (unequip.item.consumesChargesOn !== undefined)
            this.itemChargeUsers.delete(unequip);
        unequip.occupies.forEach((occupied) => this.equippedItems[occupied.id].setEmpty());
        unequip.setEmpty();
    }
    /** Sets the given slots quick equip item in the position to the currently equipped item */
    setQuickEquip(slot, pos) {
        this.equippedItems[slot.id].setQuickEquip(pos);
    }
    setQuickEquipItems(slot, items) {
        const equipped = this.equippedItems[slot.id];
        equipped.quickEquipItems = items;
        equipped.trimQuickEquipItems();
    }
    forceAddAllToBank() {
        this.equippedArray.forEach((equippedItem) => {
            if (equippedItem.providesStats)
                this.game.bank.addItem(equippedItem.item, equippedItem.quantity, false, false, true);
        });
    }
    /** Determines if an itemID is equipped */
    checkForItem(item) {
        return this.itemSlotMap.has(item);
    }
    checkForItemID(itemID) {
        const item = this.game.items.equipment.getObjectByID(itemID);
        if (item === undefined)
            return false;
        return this.checkForItem(item);
    }
    checkForItemIDs(itemIDs) {
        const idsNotFound = [...itemIDs];
        return this.equippedArray.some((equippedItem) => {
            const idIndex = idsNotFound.findIndex((id) => equippedItem.isItem(id));
            if (idIndex !== -1)
                idsNotFound.splice(idIndex, 1);
            return idsNotFound.length === 0;
        });
    }
    getSlotOfItem(item) {
        return this.itemSlotMap.get(item);
    }
    getQuantityOfItem(item) {
        const equipped = this.equippedArray.find((equipped) => {
            return equipped.item === item && equipped.occupiedBy === undefined;
        });
        return equipped === undefined ? 0 : equipped.quantity;
    }
    getEquippedInSlot(slot) {
        return this.equippedItems[slot.id];
    }
    getItemInSlot(slotID) {
        return this.equippedItems[slotID].item;
    }
    getQuantityInSlot(slotID) {
        return this.equippedItems[slotID].quantity;
    }
    isSlotEmpty(slotID) {
        return this.equippedItems[slotID].isEmpty;
    }
    getQuickEquipItem(slot, pos) {
        return this.equippedItems[slot.id].quickEquipItems[pos];
    }
    isQuickEquipEmpty(slot, pos) {
        return this.equippedItems[slot.id].isQuickEquipEmpty(pos);
    }
    isQuickEquipValid(slot, pos) {
        return this.equippedItems[slot.id].item.fitsInSlot(slot.id);
    }
    addQuantityToSlot(slot, quantity) {
        this.equippedItems[slot.id].quantity += quantity;
    }
    /** Removes quantity from a slot. Returns true if slot is now empty and stats need updating */
    removeQuantityFromSlot(slotID, quantity) {
        const equipped = this.equippedItems[slotID];
        equipped.quantity -= quantity;
        if (equipped.quantity <= 0) {
            this.unequipItem(equipped.slot);
            return true;
        }
        return false;
    }
    /** Adds the stats of the equipped items to an equipment stats object */
    addEquipmentStats(stats) {
        this.equippedArray.forEach((equippedItem) => {
            if (equippedItem.providesStats && equippedItem.slot.providesEquipStats) {
                stats.addItemStats(equippedItem.item);
            }
        });
    }
    /** Gets a snapshot of the equipment slots with quantities */
    getSnapshot() {
        const snapshot = new Map();
        this.equippedArray.forEach((equippedItem) => {
            if (equippedItem.slot.allowQuantity)
                snapshot.set(equippedItem.slot, {
                    item: equippedItem.item,
                    quantity: equippedItem.quantity,
                });
        });
        return snapshot;
    }
    encode(writer) {
        writer.writeArray(this.equippedArray, (equippedItem, writer) => {
            writer.writeNamespacedObject(equippedItem.slot);
            writer.writeBoolean(equippedItem.providesStats);
            if (equippedItem.providesStats) {
                writer.writeNamespacedObject(equippedItem.item);
                writer.writeUint32(equippedItem.quantity);
            }
            writer.writeArray(equippedItem.quickEquipItems, writeNamespaced);
        });
        return writer;
    }
    decode(reader, version, addOnFail = false) {
        reader.getArray((reader) => {
            var _a;
            let slot;
            if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
                slot = reader.getNamespacedObject(this.game.equipmentSlots);
            } else {
                const slotID = Equipment.slotIDMap[reader.getUint8()];
                slot = (_a = this.game.equipmentSlots.getObjectByID(slotID)) !== null && _a !== void 0 ? _a : slotID;
            }
            if (reader.getBoolean()) {
                const item = reader.getNamespacedObject(this.game.items.equipment);
                const quantity = reader.getUint32();
                if (typeof slot === 'string') {
                    if (typeof item !== 'string') {
                        this.game.bank.addItemOnLoad(item, quantity);
                    } else if (item.startsWith('melvor') && addOnFail) {
                        this.game.bank.addDummyItemOnLoad(item, quantity);
                    }
                } else {
                    if (typeof item !== 'string') {
                        this.equipItem(item, slot, quantity);
                    } else if (item.startsWith('melvor') && addOnFail) {
                        this.game.bank.addDummyItemOnLoad(item, quantity);
                    }
                }
            }
            const quickEquipItems = reader.getArray((reader) => {
                let item = reader.getNamespacedObject(this.game.items.equipment);
                if (typeof item === 'string' || typeof slot === 'string' || !item.fitsInSlot(slot.id))
                    item = this.game.emptyEquipmentItem;
                return item;
            });
            if (typeof slot !== 'string') {
                const equippedItems = this.equippedItems[slot.id];
                equippedItems.quickEquipItems = quickEquipItems;
                equippedItems.trimQuickEquipItems();
            }
        });
    }
    deserialize(reader, version, idMap, addOnFail = false) {
        const numItems = reader.dataLength / 3;
        for (let i = 0; i < numItems; i++) {
            const slotID = reader.getNumber();
            const itemID = reader.getNumber();
            const quantity = reader.getNumber();
            const newID = idMap.items[itemID];
            const item = this.game.items.equipment.getObjectByID(newID);
            const slot = this.game.equipmentSlots.getObjectByID(Equipment.slotIDMap[slotID]);
            if (item !== undefined && slot !== undefined) {
                this.equipItem(item, slot, quantity);
                if (version < 21 && item.fitsInSlot(slot.id))
                    this.equippedItems[slot.id].quickEquipItems[0] = item;
            } else if (addOnFail)
                this.game.bank.addDummyItemOnLoad(newID, quantity);
        }
    }
    convertFromOldFormat(oldData, idMap) {
        if (oldData.equipment[OldEquipmentSlotIDs.Weapon] === oldData.equipment[OldEquipmentSlotIDs.Quiver]) {
            oldData.equipment[OldEquipmentSlotIDs.Weapon] = 0;
        }
        // Going to need some special check for the weapon being the quiver
        oldData.equipment.forEach((oldItemID, oldSlotID) => {
            if (oldItemID !== 0) {
                let quantity = 1;
                if (oldSlotID === OldEquipmentSlotIDs.Quiver)
                    quantity = oldData.ammo;
                if (oldSlotID === OldEquipmentSlotIDs.Summon1)
                    quantity = oldData.summonAmmo[0];
                if (oldSlotID === OldEquipmentSlotIDs.Summon2)
                    quantity = oldData.summonAmmo[1];
                const itemID = idMap.items[oldItemID];
                const item = this.game.items.getObjectByID(itemID);
                const slot = this.game.equipmentSlots.getObjectByID(Equipment.slotIDMap[oldSlotID]);
                if (item instanceof EquipmentItem && slot !== undefined) {
                    this.equipItem(item, slot, quantity);
                } else if (item !== undefined) {
                    this.game.bank.addItem(item, quantity, false, false, true);
                    console.log(`Non-equipment item was found equipped during save conversion, adding to bank.`);
                } else {
                    this.game.bank.addDummyItemOnLoad(itemID, quantity);
                }
            }
        });
    }
    /** Removes all equipment */
    unequipAll() {
        this.equippedArray.forEach((equipped) => equipped.setEmpty());
        this.itemSlotMap.clear();
    }
    static getEquipStatDescription(stat) {
        let statValue;
        switch (stat.key) {
            case 'attackSpeed':
                statValue = `${formatFixed(stat.value / 1000, 2)}`;
                break;
            case 'summoningMaxhit':
                return this.getSummoningMaxHitStatDescription(stat.damageType, stat.value);
            case 'resistance':
                return this.getEquipResistStatDescription(stat.damageType, stat.value);
            default:
                statValue = `${stat.value}`;
        }
        if (stat.value > 0)
            statValue = '+' + statValue;
        return templateLangString(`EQUIPMENT_STAT_${stat.key}`, {
            statValue
        });
    }
    static getSummoningMaxHitStatDescription(damageType, value) {
        let statValue = `${Math.round(value * numberMultiplier)}`;
        if (value > 0)
            statValue = '+' + statValue;
        return `${templateLangString(`EQUIPMENT_STAT_summoningMaxhit`, { statValue })} (${damageType.name})`;
    }
    static getEquipResistStatDescription(damageType, value) {
        let statValue = `${formatPercent(value)}`;
        if (value > 0)
            statValue = '+' + statValue;
        return `${statValue} ${damageType.resistanceName}`;
    }
}
/** Maps the old IDs for equipment slots to the new ones */
Equipment.slotIDMap = {
    0: "melvorD:Helmet" /* EquipmentSlotIDs.Helmet */ ,
    1: "melvorD:Platebody" /* EquipmentSlotIDs.Platebody */ ,
    2: "melvorD:Platelegs" /* EquipmentSlotIDs.Platelegs */ ,
    3: "melvorD:Boots" /* EquipmentSlotIDs.Boots */ ,
    4: "melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ ,
    5: "melvorD:Shield" /* EquipmentSlotIDs.Shield */ ,
    6: "melvorD:Amulet" /* EquipmentSlotIDs.Amulet */ ,
    7: "melvorD:Ring" /* EquipmentSlotIDs.Ring */ ,
    8: "melvorD:Gloves" /* EquipmentSlotIDs.Gloves */ ,
    9: "melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ ,
    10: "melvorD:Cape" /* EquipmentSlotIDs.Cape */ ,
    11: "melvorD:Passive" /* EquipmentSlotIDs.Passive */ ,
    12: "melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ ,
    13: "melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ ,
    14: "melvorD:Consumable" /* EquipmentSlotIDs.Consumable */ ,
    15: "melvorD:Gem" /* EquipmentSlotIDs.Gem */ ,
};
/** Class for storing all data for a players equipment set */
class EquipmentSet {
    constructor(game) {
        this.game = game;
        this.prayerSelection = new Set();
        this.equipment = new Equipment(game);
        this.spellSelection = new SpellSelection(game);
    }
    encode(writer) {
        this.equipment.encode(writer);
        this.spellSelection.encode(writer);
        writer.writeSet(this.prayerSelection, writeNamespaced);
        return writer;
    }
    decode(reader, version, addOnFail = false) {
        this.equipment.decode(reader, version, addOnFail);
        this.spellSelection.decode(reader, version);
        this.prayerSelection = reader.getSet(readNamespacedReject(this.game.prayers));
    }
}
class EquipmentSetMenu {
    constructor(containerID, buttonClasses) {
        this.buttonClasses = buttonClasses;
        this.buttons = [];
        this.highlightedButton = -1;
        const cont = document.getElementById(containerID);
        if (cont === null)
            throw new Error(`Invalid id: ${containerID}`);
        this.container = cont;
    }
    render(sets, selected, player) {
        this.renderSets(sets, player);
        this.renderSelected(selected);
        this.setCallbacks(player);
    }
    renderSets(sets, player) {
        for (let i = 0; i < player.numEquipSets; i++) {
            const set = sets[i];
            let button = this.buttons[i];
            if (button === undefined) {
                button = this.addButton(`${i + 1}`);
            }
            showElement(button.button);
            button.tooltip.setProps({
                onShow: (instance) => {
                    instance.setContent(this.getTooltipContent(set));
                },
            });
        }
        for (let i = player.numEquipSets; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            hideElement(button.button);
        }
    }
    renderSelected(selected) {
        if (this.highlightedButton !== -1) {
            const oldButton = this.buttons[this.highlightedButton].button;
            oldButton.classList.remove('btn-success');
            oldButton.classList.add('btn-primary');
        }
        this.buttons[selected].button.classList.remove();
        this.highlightedButton = selected;
        const newButton = this.buttons[selected].button;
        newButton.classList.add('btn-success');
        newButton.classList.remove('btn-primary');
    }
    setCallbacks(player) {
        this.buttons.forEach((button, i) => {
            button.button.onclick = () => player.changeEquipmentSet(i);
        });
    }
    getTooltipRow(media, name) {
        return `<img class="skill-icon-xxs mr-1" src="${media}">${name}<br>`;
    }
    getTooltipContent(set) {
        const equipmentHTML = set.equipment.equippedArray
            .map((slot) => {
                if (slot.providesStats) {
                    return this.getTooltipRow(slot.item.media, slot.item.name);
                } else {
                    return '';
                }
            })
            .join('');
        let prayerHTML = '';
        set.prayerSelection.forEach((prayer) => {
            prayerHTML += this.getTooltipRow(prayer.media, prayer.name);
        });
        let spellHTML = '';
        if (set.spellSelection.attack !== undefined)
            spellHTML += this.getTooltipRow(set.spellSelection.attack.media, set.spellSelection.attack.name);
        if (set.spellSelection.curse !== undefined)
            spellHTML += this.getTooltipRow(set.spellSelection.curse.media, set.spellSelection.curse.name);
        if (set.spellSelection.aurora !== undefined)
            spellHTML += this.getTooltipRow(set.spellSelection.aurora.media, set.spellSelection.aurora.name);
        let mainHTML = `<div class="text-center">
    <span class="text-info">${getLangString('COMBAT_MISC_18')}</span><br>
    ${equipmentHTML.length > 0 ? equipmentHTML : `${getLangString('MENU_TEXT_NONE')}<br>`}`;
        if (spellHTML.length > 0) {
            mainHTML += `<span class="text-info">${getLangString('COMBAT_MISC_SPELLS')}</span><br>${spellHTML}`;
        }
        if (prayerHTML.length > 0) {
            mainHTML += `<span class="text-info">${getLangString('COMBAT_MISC_17')}</span><br>${prayerHTML}`;
        }
        mainHTML += `</div>`;
        return mainHTML;
    }
    addButton(text) {
        const newButton = createElement('button', {
            text: text,
            classList: [...this.buttonClasses, 'btn-primary'],
        });
        newButton.style.pointerEvents = 'auto';
        const newTooltip = this.createTooltip(newButton);
        const button = {
            button: newButton,
            tooltip: newTooltip,
        };
        this.buttons.push(button);
        this.container.append(newButton);
        return button;
    }
    createTooltip(parent) {
        return tippy(parent, {
            content: '',
            allowHTML: true,
            placement: 'top',
            interactive: false,
            animation: false,
        });
    }
}
class EquippedItem {
    constructor(slot, emptyItem) {
        this.slot = slot;
        this.emptyItem = emptyItem;
        /** Quantity of the item equipped */
        this.quantity = 0;
        /** Other slots occupied by this item */
        this.occupies = [];
        this.item = emptyItem;
        this.quickEquipItems = new Array(MAX_QUICK_EQUIP_ITEMS).fill(emptyItem);
    }
    /** Gets the media to display in the slot */
    get media() {
        return this.isEmpty ? this.slot.emptyMedia : this.item.media;
    }
    get isEmpty() {
        return this.item === this.emptyItem;
    }
    get providesStats() {
        return !this.isEmpty && this.occupiedBy === undefined;
    }
    isItem(item) {
        if (typeof item !== 'string')
            return item === this.item;
        else {
            switch (item) {
                case 'ThrowingWeapon':
                    return (this.item instanceof WeaponItem &&
                        (this.item.ammoTypeRequired === AmmoTypeID.Javelins ||
                            this.item.ammoTypeRequired === AmmoTypeID.ThrowingKnives));
                case 'Melee2HWeapon':
                    return (this.item instanceof WeaponItem &&
                        this.item.attackType === 'melee' &&
                        this.item.occupiesSlot("melvorD:Shield" /* EquipmentSlotIDs.Shield */ ));
                default:
                    return false;
            }
        }
    }
    setOccupied(item, slot) {
        this.item = item;
        this.occupiedBy = slot;
        this.quantity = 0;
        this.occupies = [];
    }
    setEquipped(item, quantity, occupies) {
        this.item = item;
        this.occupiedBy = undefined;
        this.quantity = quantity;
        this.occupies = occupies;
    }
    setEmpty() {
        this.item = this.emptyItem;
        this.occupiedBy = undefined;
        this.quantity = 0;
        this.occupies = [];
    }
    isQuickEquipEmpty(pos) {
        return this.quickEquipItems[pos] === this.emptyItem;
    }
    setQuickEquip(pos) {
        if (this.isEmpty || this.item.fitsInSlot(this.slot.id))
            this.quickEquipItems[pos] = this.item;
    }
    /** Ensures the quickEquipItems array is the appropriate length */
    trimQuickEquipItems() {
        if (this.quickEquipItems.length > MAX_QUICK_EQUIP_ITEMS) {
            this.quickEquipItems.splice(MAX_QUICK_EQUIP_ITEMS - 1);
        }
        while (this.quickEquipItems.length < MAX_QUICK_EQUIP_ITEMS) {
            this.quickEquipItems.push(this.emptyItem);
        }
    }
}
class EquipmentGridIconElement extends HTMLElement {
    constructor() {
        super();
        this.quickEquipEnabled = true;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('equipment-grid-icon-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'span');
        this.tooltipElem = new EquipmentTooltipElement();
        this.quickEquip = new QuickEquipTooltipElement();
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this.image, {
            content: this.tooltipElem,
            placement: 'top',
            interactive: false,
            animation: false,
            popperOptions: {
                strategy: 'fixed',
                modifiers: [{
                        name: 'flip',
                        options: {
                            fallbackPlacements: ['top'],
                        },
                    },
                    {
                        name: 'preventOverflow',
                        options: {
                            altAxis: true,
                            tether: false,
                        },
                    },
                ],
            },
        });
        this.quickEquipTooltip = tippy(this.image, {
            content: this.quickEquip,
            placement: 'bottom',
            interactive: true,
            animation: false,
            trigger: 'click',
            popperOptions: {
                strategy: 'fixed',
                modifiers: [{
                        name: 'flip',
                        options: {
                            fallbackPlacements: ['bottom'],
                        },
                    },
                    {
                        name: 'preventOverflow',
                        options: {
                            altAxis: true,
                            tether: false,
                        },
                    },
                ],
            },
        });
        if (!this.quickEquipEnabled)
            this.quickEquipTooltip.disable();
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
        if (this.quickEquipTooltip !== undefined) {
            this.quickEquipTooltip.destroy();
            this.quickEquipTooltip = undefined;
        }
    }
    setSlot(slot, game) {
        this.image.src = slot.emptyMedia;
        if (slot.allowQuantity)
            showElement(this.quantity);
        else
            hideElement(this.quantity);
        this.quickEquip.init(MAX_QUICK_EQUIP_ITEMS);
    }
    setEquipped(player, equipped) {
        this.image.src = equipped.media;
        if (equipped.occupiedBy !== undefined) {
            this.image.classList.add('faded-image');
        } else {
            this.image.classList.remove('faded-image');
        }
        // Set Item Synergy Borders
        this.image.classList.remove('border-synergy-0', 'border-synergy-1', 'border-synergy-2', 'border-synergy-3');
        let borderID = 0;
        player.activeItemSynergies.forEach((synergy) => {
            if (synergy.items.some((id) => equipped.isItem(id))) {
                this.image.classList.add(`border-synergy-${borderID}`);
            }
            borderID++;
        });
        this.quantity.textContent = formatNumber(equipped.quantity);
        this.tooltipElem.setFromSlot(equipped);
        if (this.quickEquipTooltip !== undefined) {
            this.quickEquipTooltip.setProps({
                onShow: () => this.quickEquip.setEquipped(player, equipped),
            });
        }
    }
    /** Sets if the quick equip menu is available for this icon */
    setQuickEquipEnabled(isEnabled) {
        if (this.quickEquipEnabled === isEnabled)
            return;
        if (this.quickEquipTooltip !== undefined) {
            if (isEnabled)
                this.quickEquipTooltip.enable();
            else
                this.quickEquipTooltip.disable();
        }
        this.quickEquipEnabled = isEnabled;
    }
}
window.customElements.define('equipment-grid-icon', EquipmentGridIconElement);
class EquipmentGridElement extends HTMLElement {
    constructor() {
        super();
        this.icons = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('equipment-grid-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.summoningSynergyContainer = getElementFromFragment(this._content, 'summoning-synergy-container', 'div');
        this.summoningSynergyIcon = getElementFromFragment(this._content, 'summoning-synergy-icon', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.summoningSynergyTooltip = tippy(this.summoningSynergyIcon, {
            content: '',
            placement: 'bottom',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    }
    initialize(game) {
        const gridSize = EquipmentSlot.getGridSize();
        const numCols = gridSize.cols.max - gridSize.cols.min + 1;
        const numRows = gridSize.rows.max - gridSize.rows.min + 1;
        const colOffset = 1 - gridSize.cols.min;
        const rowOffset = 1 - gridSize.rows.min;
        this.container.style.gridTemplateColumns = `repeat(${numCols}, auto)`;
        this.container.style.gridTemplateRows = `repeat(${numRows}, auto)`;
        game.equipmentSlots.forEach((slot) => {
            const gridIcon = new EquipmentGridIconElement();
            gridIcon.style.gridColumn = `${slot.gridPosition.col + colOffset}`;
            gridIcon.style.gridRow = `${slot.gridPosition.row + rowOffset}`;
            this.container.append(gridIcon);
            gridIcon.setSlot(slot, game);
            this.icons.set(slot, gridIcon);
        });
        this.summoningSynergyContainer.style.gridColumn = `${EquipmentSlot.SUMMONING_SYNERGY_POSITION.col + colOffset}`;
        this.summoningSynergyContainer.style.gridRow = `${EquipmentSlot.SUMMONING_SYNERGY_POSITION.row + rowOffset}`;
    }
    setEquipment(player) {
        this.icons.forEach((icon, slot) => {
            const equipped = player.equipment.getEquippedInSlot(slot);
            icon.setEquipped(player, equipped);
            if (player.isEquipmentSlotUnlocked(slot)) {
                showElement(icon);
            } else {
                hideElement(icon);
            }
        });
        // Update Summoning Synergy
        const synergyDescription = player.synergyDescription;
        let synergyMedia = '';
        switch (synergyDescription) {
            case '':
                synergyMedia = assets.getURI('assets/media/skills/summoning/synergy_inactive.png');
                break;
            case getLangString('MENU_TEXT_LOCKED'):
                synergyMedia = assets.getURI('assets/media/skills/summoning/synergy_locked.png');
                break;
            default:
                synergyMedia = assets.getURI('assets/media/skills/summoning/synergy.png');
                break;
        }
        this.summoningSynergyIcon.src = synergyMedia;
        if (this.summoningSynergyTooltip !== undefined)
            this.summoningSynergyTooltip.setContent(this.getSynergyTooltipContent(synergyDescription));
    }
    setQuickEquipEnabled(isEnabled) {
        this.icons.forEach((icon) => {
            icon.setQuickEquipEnabled(isEnabled);
        });
    }
    getSynergyTooltipContent(synergyDescription) {
        let html = `<div class="text-center"><h5 class="font-w600 mb-0 `;
        switch (synergyDescription) {
            case '':
                html += `font-size-sm text-danger">${getLangString('COMBAT_MISC_117')}`;
                break;
            case 'Locked':
                html += `font-size-sm text-danger">${getLangString('COMBAT_MISC_118')}</h5><h5 class="font-w400 font-size-sm text-warning mb-0">${getLangString('COMBAT_MISC_119')}`;
                break;
            default:
                html += `text-success">${getLangString('COMBAT_MISC_120')}</h5><h5 class="font-w400 font-size-sm text-info mb-0">${synergyDescription}`;
                break;
        }
        html += `</h5></div>`;
        return html;
    }
}
class EquipmentTooltipElement extends HTMLElement {
    constructor() {
        super();
        this.unset = true;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('equipment-tooltip-template'));
        this.itemName = getElementFromFragment(this._content, 'item-name', 'span');
        this.itemDescription = getElementFromFragment(this._content, 'item-description', 'small');
        this.itemSpec = getElementFromFragment(this._content, 'item-spec', 'small');
        this.statContainer = getElementFromFragment(this._content, 'stat-container', 'small');
        this.itemDamageType = getElementFromFragment(this._content, 'item-damage-type', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setFromSlot(equipped) {
        if (equipped.isEmpty) {
            this.setEmpty();
        } else {
            this.setItem(equipped.item, equipped.slot.providesEquipStats);
        }
    }
    setItem(item, showStats) {
        if (this.lastItem === item && !this.unset)
            return;
        this.itemName.classList.add('text-warning');
        this.itemName.textContent = item.name;
        if (item instanceof WeaponItem) {
            this.itemDamageType.innerHTML = `<div class="font-size-sm">${templateLangString('MENU_TEXT_DEALS_DAMAGE_TYPE', {
                damageTypeName: `<img class="skill-icon-xxs mr-1" src="${item.damageType.media}"><span class="${item.damageType.spanClass}">${item.damageType.name}</span>`,
            })}</div>`;
            showElement(this.itemDamageType);
        } else {
            this.itemDamageType.textContent = '';
            hideElement(this.itemDamageType);
        }
        if (item.hasDescription && item.description !== '') {
            this.itemDescription.innerHTML = item.modifiedDescription;
            this.itemDescription.innerHTML += getSummonMaxHitItemDescription(item);
            showElement(this.itemDescription);
        } else {
            hideElement(this.itemDescription);
        }
        this.itemSpec.innerHTML = getItemSpecialAttackInformation(item);
        showElement(this.itemSpec);
        if (showStats) {
            this.statContainer.textContent = '';
            item.equipmentStats.forEach((stat) => {
                this.statContainer.append(createElement('span', {
                    text: Equipment.getEquipStatDescription(stat),
                    className: stat.value < 0 ? 'text-danger' : '',
                }));
            });
            showElement(this.statContainer);
        } else {
            hideElement(this.statContainer);
        }
        this.lastItem = item;
        this.unset = false;
    }
    setEmpty() {
        if (this.lastItem === undefined && !this.unset)
            return;
        this.itemName.classList.remove('text-warning');
        this.itemName.textContent = getLangString('COMBAT_MISC_116');
        hideElement(this.itemDescription);
        hideElement(this.itemSpec);
        hideElement(this.itemDamageType);
        hideElement(this.statContainer);
        this.lastItem = undefined;
        this.unset = false;
    }
}
window.customElements.define('equipment-tooltip', EquipmentTooltipElement);
class QuickEquipTooltipElement extends HTMLElement {
    constructor() {
        super();
        this.buttons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('quick-equip-tooltip-template'));
        this.buttonContainer = getElementFromFragment(this._content, 'button-container', 'ul');
        this.unequipButton = getElementFromFragment(this._content, 'unequip-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    init(numButtons) {
        const template = getTemplateElement('quick-equip-tooltip-button-template').content;
        for (let i = 0; i < numButtons; i++) {
            const newButton = new DocumentFragment();
            newButton.append(template.cloneNode(true));
            const equip = getElementFromFragment(newButton, 'equip', 'button');
            const image = getElementFromFragment(newButton, 'image', 'img');
            const set = getElementFromFragment(newButton, 'set', 'button');
            this.buttonContainer.prepend(newButton);
            this.buttons.push({
                equip,
                image,
                set
            });
        }
    }
    setEquipped(player, equipped) {
        const slot = equipped.slot;
        equipped.quickEquipItems.forEach((item, i) => {
            const {
                equip,
                image,
                set
            } = this.buttons[i];
            image.src = item.media;
            equip.classList.remove('btn-outline-success', 'btn-outline-secondary');
            if (!equipped.isEmpty && item === equipped.item)
                equip.classList.add('btn-outline-success');
            else
                equip.classList.add('btn-outline-secondary');
            set.onclick = () => {
                const changed = player.setQuickEquipItem(slot, i);
                if (changed)
                    image.src = equipped.item.media;
            };
            equip.onclick = () => player.onQuickEquipClick(slot, i);
        });
        this.unequipButton.onclick = player.unequipCallback(slot);
    }
}
window.customElements.define('quick-equip-tooltip', QuickEquipTooltipElement);
//# sourceMappingURL=equipment.js.map
checkFileVersion('?12097')