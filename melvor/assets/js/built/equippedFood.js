"use strict";
class EquippedFood {
    constructor(maxSlots, game) {
        this.maxSlots = maxSlots;
        this.game = game;
        this.slots = [];
        this.selectedSlot = 0;
        for (let i = 0; i < maxSlots; i++) {
            this.addSlot();
        }
    }
    get currentSlot() {
        return this.slots[this.selectedSlot];
    }
    addSlot() {
        this.slots.push({
            item: this.game.emptyFoodItem,
            quantity: 0,
        });
    }
    equip(item, quantity) {
        let food = this.slots.find((slot) => slot.item === item);
        if (food === undefined)
            food = this.slots.find((slot) => slot.item === this.game.emptyFoodItem);
        if (food !== undefined) {
            food.item = item;
            food.quantity += quantity;
        }
        return food !== undefined;
    }
    unequipSelected() {
        const food = this.currentSlot;
        food.item = this.game.emptyFoodItem;
        food.quantity = 0;
    }
    consume(quantity = 1) {
        if (this.currentSlot.quantity < quantity)
            throw new Error(`Tried to consume more food than equipped.`);
        this.currentSlot.quantity -= quantity;
        if (this.currentSlot.quantity === 0) {
            this.unequipSelected();
        }
    }
    setSlot(slotID) {
        this.checkSlotid(slotID);
        this.selectedSlot = slotID;
    }
    checkSlotid(slotID) {
        if (slotID >= this.maxSlots)
            throw new Error(`Tried to equip food to invalid slot id: ${slotID}. Max id is: ${this.maxSlots - 1}`);
    }
    encode(writer) {
        writer.writeUint32(this.selectedSlot);
        writer.writeUint32(this.maxSlots);
        writer.writeArray(this.slots, (slot, writer) => {
            writer.writeNamespacedObject(slot.item);
            writer.writeUint32(slot.quantity);
        });
        return writer;
    }
    decode(reader, version, addOnFail = false) {
        this.selectedSlot = reader.getUint32();
        this.maxSlots = reader.getUint32();
        this.slots = reader.getArray((reader) => {
            const item = reader.getNamespacedObject(this.game.items.food);
            const quantity = reader.getUint32();
            if (typeof item !== 'string') {
                return {
                    item,
                    quantity,
                };
            } else if (item.startsWith('melvor') && addOnFail) {
                this.game.bank.addDummyItemOnLoad(item, quantity);
            }
            return undefined;
        });
        while (this.slots.length < this.maxSlots) {
            this.addSlot();
        }
    }
    deserialize(reader, version, idMap, addOnFail = false) {
        this.selectedSlot = reader.getNumber();
        this.maxSlots = reader.getNumber();
        for (let i = 0; i < this.maxSlots; i++) {
            const itemID = reader.getNumber();
            let quantity = reader.getNumber();
            if (this.slots[i] === undefined) {
                this.addSlot();
            }
            const slot = this.slots[i];
            let item = this.game.emptyFoodItem;
            if (itemID !== -1) {
                const newID = idMap.items[itemID];
                const tempItem = this.game.items.food.getObjectByID(newID);
                if (tempItem !== undefined)
                    item = tempItem;
                else {
                    if (addOnFail)
                        this.game.bank.addDummyItemOnLoad(newID, quantity);
                    quantity = 0;
                }
            }
            slot.item = item;
            slot.quantity = quantity;
        }
    }
    convertFromOldSaveFormat(oldData, idMap) {
        this.maxSlots = 3;
        for (let i = 0; i < 3; i++) {
            if (this.slots[i] === undefined) {
                this.addSlot();
            }
            const slot = this.slots[i];
            const oldQty = oldData[i];
            if (oldQty.itemID !== 0) {
                const newID = idMap.items[oldQty.itemID];
                const item = this.game.items.getObjectByID(newID);
                if (item === undefined)
                    throw new Error('Error converting old equipment. Food item is not registered.');
                if (item instanceof FoodItem) {
                    slot.item = item;
                    slot.quantity = oldQty.qty;
                } else if (item !== undefined) {
                    this.game.bank.addItem(item, oldQty.qty, false, false, true);
                    console.log(`Non-food item was found equipped during save conversion, adding to bank.`);
                } else {
                    this.game.bank.addDummyItemOnLoad(newID, oldQty.qty);
                }
            }
        }
    }
}
class FoodSelectOptionElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('food-select-option-template'));
        this.quantity = getElementFromFragment(this._content, 'quantity', 'span');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.hitpoints = getElementFromFragment(this._content, 'hitpoints', 'span');
        this.modifiers = getElementFromFragment(this._content, 'modifiers', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setFood(food, player) {
        if (food.quantity === 0) {
            this.quantity.textContent = '';
            this.hitpoints.textContent = getLangString('COMBAT_MISC_116');
        } else {
            this.quantity.textContent = `(${numberWithCommas(food.quantity)})`;
            this.hitpoints.textContent = templateLangString('MENU_TEXT_PLUS_HP', {
                value: numberWithCommas(player.getFoodHealing(food.item)),
            });
        }
        this.image.src = food.item.media;
        this.modifiers.innerHTML = `<span class="font-w600">${getLangString('MENU_TEXT_FOOD_WHEN_SET_AS')}</span><br>`;
        if (food.item.stats.hasStats) {
            this.modifiers.innerHTML += food.item.stats.describeLineBreak();
            showElement(this.modifiers);
        } else {
            hideElement(this.modifiers);
        }
    }
}
window.customElements.define('food-select-option', FoodSelectOptionElement);
class FoodSelectMenuElement extends HTMLElement {
    constructor() {
        super();
        this.dropOptions = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('food-select-menu-template'));
        this.eatButton = getElementFromFragment(this._content, 'eat-button', 'button');
        this.selected = getElementFromFragment(this._content, 'selected', 'food-select-option');
        this.optionsContainer = getElementFromFragment(this._content, 'options-container', 'div');
        this.dropDivider = getElementFromFragment(this._content, 'drop-divider', 'div');
        this.unequipButton = getElementFromFragment(this._content, 'unequip-button', 'a');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    addDropdownOption() {
        const newButton = createElement('a', {
            className: 'dropdown-item pointer-enabled'
        });
        this.dropOptions.push(createElement('food-select-option', {
            parent: newButton
        }));
        this.optionsContainer.insertBefore(newButton, this.dropDivider);
    }
    removeDropOption() {
        const removedOption = this.dropOptions.pop();
        if (removedOption !== undefined) {
            if (removedOption.parentElement)
                this.optionsContainer.removeChild(removedOption.parentElement);
        } else {
            throw new Error(`Tried to remove drop option when options are empty.`);
        }
    }
    showHoldToEat() {
        this.eatButton.classList.replace('btn-outline-secondary', 'btn-outline-success');
    }
    hideHoldToEat() {
        this.eatButton.classList.replace('btn-outline-success', 'btn-outline-secondary');
    }
    renderSelection(foods, player) {
        foods.forEach((food, i) => {
            if (this.dropOptions[i] === undefined)
                this.addDropdownOption();
            const dropOption = this.dropOptions[i];
            dropOption.setFood(food, player);
        });
        const optsToRemove = this.dropOptions.length - foods.length;
        for (let i = 0; i < optsToRemove; i++)
            this.removeDropOption();
    }
    render(player) {
        this.selected.setFood(player.food.currentSlot, player);
        this.renderSelection(player.food.slots, player);
    }
    setCallbacks(player) {
        this.unequipButton.onclick = () => player.unequipFood();
        this.eatButton.onclick = () => {
            player.eatFood();
            player.render();
        };
        /* MOBILE */
        this.eatButton.ontouchstart = (e) => {
            player.eatFood();
            player.render();
            player.startHoldToEat();
            this.showHoldToEat();
            e.preventDefault(); //This prevents the mobile devices from selecting or displaying OS level popup menus
        };
        this.eatButton.ontouchend = (e) => {
            player.stopHoldToEat();
            this.hideHoldToEat();
            e.preventDefault();
        };
        /* DESKTOP */
        this.eatButton.onmousedown = (e) => {
            player.startHoldToEat();
            this.showHoldToEat();
            e.preventDefault();
        };
        this.eatButton.onmouseup = () => {
            player.stopHoldToEat();
            this.hideHoldToEat();
        };
        this.eatButton.onmouseleave = () => {
            player.stopHoldToEat();
            this.hideHoldToEat();
        };
        this.dropOptions.forEach((option, i) => {
            if (option.parentElement)
                option.parentElement.onclick = () => player.selectFood(i);
        });
    }
}
window.customElements.define('food-select-menu', FoodSelectMenuElement);
//# sourceMappingURL=equippedFood.js.map
checkFileVersion('?12097')