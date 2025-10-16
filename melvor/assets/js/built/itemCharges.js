"use strict";
class ItemChargesChangedEvent extends GameEvent {
    constructor(item, oldCharges, newCharges) {
        super();
        this.item = item;
        this.oldCharges = oldCharges;
        this.newCharges = newCharges;
    }
}
class ItemCharges extends GameEventEmitter {
    constructor(game) {
        super();
        this.game = game;
        this.charges = new Map();
        this.renderQueue = {
            items: new Set(),
        };
    }
    render() {
        if (this.renderQueue.items.size > 0) {
            this.renderQueue.items.forEach((item) => {
                const charges = this.getCharges(item);
                const elements = document.querySelectorAll(`item-charge-display[data-item-id="${item.id}"]`);
                elements.forEach((chargeDisplay) => {
                    chargeDisplay.updateCharges(charges);
                });
            });
            shopMenu.updateForItemChargeChange();
            this.renderQueue.items.clear();
        }
    }
    getSnapShot() {
        return new Map(this.charges);
    }
    /** Returns true if the item has any charges */
    itemHasCharge(item) {
        return this.charges.has(item);
    }
    /** Returns the number of charges an item has */
    getCharges(item) {
        var _a;
        return (_a = this.charges.get(item)) !== null && _a !== void 0 ? _a : 0;
    }
    /** Adds the amount of charges to the item */
    addCharges(item, amount) {
        if (amount <= 0)
            throw new Error('Tried to add negative or zero item charges.');
        const oldCharges = this.getCharges(item);
        const newCharges = oldCharges + amount;
        this.charges.set(item, newCharges);
        this._events.emit('chargesChanged', new ItemChargesChangedEvent(item, oldCharges, newCharges));
        this.renderQueue.items.add(item);
    }
    /** Removes the amount of charges from the item */
    removeCharges(item, amount) {
        const currentCharges = this.getCharges(item);
        if (currentCharges <= 0)
            return;
        if (amount <= 0)
            throw new Error('Tried to remove negative or zero item charges.');
        const newCharges = currentCharges - amount;
        if (newCharges <= 0) {
            this.charges.delete(item);
            this.game.combat.notifications.add({
                type: 'ItemCharges',
                args: [item],
            });
        } else {
            this.charges.set(item, newCharges);
        }
        this._events.emit('chargesChanged', new ItemChargesChangedEvent(item, currentCharges, newCharges));
        this.renderQueue.items.add(item);
    }
    /** Removes all charges from an item */
    removeAllCharges(item) {
        const oldCharges = this.getCharges(item);
        this.charges.delete(item);
        this._events.emit('chargesChanged', new ItemChargesChangedEvent(item, oldCharges, 0));
        this.renderQueue.items.add(item);
    }
    encode(writer) {
        writer.writeMap(this.charges, writeNamespaced, (charge, writer) => writer.writeUint32(charge));
        return writer;
    }
    decode(reader, version) {
        this.charges = reader.getMap((reader) => {
            const item = reader.getNamespacedObject(this.game.items.equipment);
            if (typeof item === 'string') {
                if (item.startsWith('melvor'))
                    return this.game.items.equipment.getDummyObject(item, DummyEquipmentItem, this.game);
                else
                    return undefined;
            }
            return item;
        }, (reader) => reader.getUint32());
    }
    convertFromOldFormat(oldGloveData, idMap) {
        oldGloveData.forEach((gloveData, gloveID) => {
            if (gloveData.isActive && gloveData.remainingActions > 0) {
                const itemID = idMap.skillGloves[gloveID];
                let item = this.game.items.equipment.getObjectByID(itemID);
                if (item === undefined)
                    item = this.game.items.equipment.getDummyObject(itemID, DummyEquipmentItem, this.game);
                this.charges.set(item, gloveData.remainingActions);
            }
        });
    }
}
//# sourceMappingURL=itemCharges.js.map
checkFileVersion('?12097')