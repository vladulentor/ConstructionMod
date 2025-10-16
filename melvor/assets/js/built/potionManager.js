"use strict";
/** Management class for potion consumption and charges */
class PotionManager extends GameEventEmitter {
    constructor(game) {
        super();
        this.game = game;
        this.activePotions = new Map();
        /** Actions for which potions should not be automatically re-used */
        this.autoReuseActions = new Set();
        this.renderRequired = false;
        this.providedStats = new StatProvider();
    }
    isPotionActiveForAction(action) {
        return this.activePotions.has(action);
    }
    getActivePotionForAction(action) {
        const activePotion = this.activePotions.get(action);
        return activePotion === null || activePotion === void 0 ? void 0 : activePotion.item;
    }
    isPotionActive(potion) {
        const activePotion = this.activePotions.get(potion.action);
        return activePotion !== undefined && activePotion.item === potion;
    }
    autoReusePotionsForAction(action) {
        return this.autoReuseActions.has(action);
    }
    getPotionCharges(item) {
        let potionCharges = item.charges + this.game.modifiers.getValue("melvorD:flatPotionCharges" /* ModifierIDs.flatPotionCharges */ , item.modQuery);
        const modifier = this.game.modifiers.getValue("melvorD:potionCharges" /* ModifierIDs.potionCharges */ , item.modQuery);
        potionCharges *= 1 + modifier / 100;
        potionCharges = Math.floor(potionCharges);
        return Math.max(1, potionCharges); //can't have less than 1 charge
    }
    usePotion(item, loadPotions = false) {
        if (!this.game.bank.hasItem(item))
            return;
        const existingPotion = this.activePotions.get(item.action);
        const oldItem = existingPotion === null || existingPotion === void 0 ? void 0 : existingPotion.item;
        const charges = this.getPotionCharges(item);
        if (existingPotion !== undefined && existingPotion.item === item) {
            // Just update the charges when re-using the potion
            existingPotion.charges = charges;
        } else {
            if (existingPotion !== undefined)
                this.game.events.unassignMatchers(existingPotion.unassigners);
            this.activePotions.set(item.action, this.createActivePotion(item, charges));
            this.computeProvidedStats();
        }
        this.game.bank.removeItemQuantity(item, 1, true);
        this.game.stats.Herblore.inc(HerbloreStats.PotionsUsed);
        this.renderRequired = true;
        this._events.emit('potionUsed', new PotionUsedEvent(item, charges));
        if (oldItem !== item) {
            this._events.emit('potionChanged', new PotionChangedEvent(item.action, oldItem, item));
        }
        if (loadPotions)
            this.openPotionSelectOnClick(item.action);
    }
    /** Creates an ActivePotion object, and assigns its event matchers */
    createActivePotion(item, charges) {
        const handler = (e) => this.consumeChargeForAction(e, item.action);
        return {
            item,
            charges,
            unassigners: this.game.events.assignMatchers(item.consumesOn, handler),
        };
    }
    removePotion(action, loadPotions = false) {
        const existingPotion = this.activePotions.get(action);
        if (existingPotion === undefined)
            return;
        this.game.events.unassignMatchers(existingPotion.unassigners);
        this.activePotions.delete(action);
        this.computeProvidedStats();
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this.game.herblore, getLangString('TOASTS_POTION_DEPLETED'), 'danger'],
        });
        this.renderRequired = true;
        this._events.emit('potionChanged', new PotionChangedEvent(existingPotion.item.action, existingPotion.item, undefined));
        if (loadPotions)
            this.openPotionSelectOnClick(action);
    }
    consumeChargeForAction(e, action) {
        if (e instanceof CharacterAttackEvent && e.isPlayerMulti && !e.attack.usesPotionChargesPerProc)
            return;
        const potion = this.activePotions.get(action);
        if (potion === undefined)
            throw new Error('Tried to consume charge for action that does not have a potion in use.');
        const event = new PotionChargeUsedEvent(potion.item);
        const preservationChance = Math.min(this.game.modifiers.potionChargePreservationChance, 80);
        if (!rollPercentage(preservationChance)) {
            potion.charges--;
            this.game.stats.Herblore.inc(HerbloreStats.ChargesUsed);
            if (potion.charges <= 0) {
                if (this.autoReuseActions.has(potion.item.action) && this.game.bank.hasItem(potion.item)) {
                    this.usePotion(potion.item);
                } else {
                    this.removePotion(action);
                }
            }
            this.renderRequired = true;
        }
        this._events.emit('chargeUsed', event);
    }
    toggleAutoReusePotion(action) {
        if (this.autoReuseActions.has(action)) {
            this.autoReuseActions.delete(action);
        } else {
            this.autoReuseActions.add(action);
        }
    }
    /** Callback function for opening the potion selection menu */
    openPotionSelectOnClick(action) {
        if (this.game.isGolbinRaid)
            return;
        const potions = this.game.bank.filterItems((bankItem) => {
            const item = bankItem.item;
            return item instanceof PotionItem && item.action === action;
        });
        potionSelectMenu.showPotionSelection(potions, action, this.game);
        $('#modal-potion-select').modal('show');
    }
    /** Recomputes the stats provided by potions */
    computeProvidedStats(updatePlayer = true) {
        this.providedStats.reset();
        this.activePotions.forEach(({
            item
        }) => {
            this.providedStats.addStatObject(item, item.stats);
        });
        if (updatePlayer)
            this.game.combat.computeAllStats();
    }
    render() {
        var _a, _b;
        if (!this.renderRequired)
            return;
        if (((_a = this.game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined) {
            this.updatePotionHeader(this.activePotions.get((_b = this.game.openPage) === null || _b === void 0 ? void 0 : _b.action));
        } else {
            this.updatePotionHeader(undefined);
        }
        this.renderRequired = false;
    }
    onLoad() {
        const potionButton = document.getElementById('page-header-potions-dropdown');
        potionButton.onclick = () => {
            var _a;
            if (((_a = this.game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined)
                this.openPotionSelectOnClick(this.game.openPage.action);
        };
        this.computeProvidedStats(false);
    }
    updatePotionHeader(potion) {
        if (potion === undefined) {
            $('#header-potion-image').attr('src', assets.getURI("assets/media/skills/herblore/potion_empty.png" /* Assets.EmptyPotion */ ));
            $('#header-potion-charges').addClass('d-none');
        } else {
            $('#header-potion-image').attr('src', potion.item.media);
            $('#header-potion-charges').removeClass('d-none');
            $('#header-potion-charges').text(potion.charges);
        }
    }
    encode(writer) {
        writer.writeMap(this.activePotions, writeNamespaced, (activePotion) => {
            writer.writeNamespacedObject(activePotion.item), writer.writeUint32(activePotion.charges);
        });
        writer.writeSet(this.autoReuseActions, writeNamespaced);
        return writer;
    }
    decode(reader, version) {
        this.activePotions = reader.getMap(readNamespacedReject(this.game.actions), (reader) => {
            const item = reader.getNamespacedObject(this.game.items.potions);
            const charges = reader.getUint32();
            if (typeof item === 'string')
                return undefined;
            return this.createActivePotion(item, charges);
        });
        this.autoReuseActions = reader.getSet(readNamespacedReject(this.game.actions));
    }
    convertFromOldFormat(save, idMap) {
        if (save.herbloreBonuses !== undefined) {
            Object.entries(save.herbloreBonuses).forEach(([key, oldBonus]) => {
                const pageID = parseInt(key);
                const action = this.game.actions.getObjectByID(idMap.pageToAction[pageID]);
                if (action !== undefined && oldBonus.charges > 0 && oldBonus.itemID > 0) {
                    const item = this.game.getItemFromOldID(oldBonus.itemID, idMap);
                    if (!(item instanceof PotionItem))
                        return;
                    this.activePotions.set(action, this.createActivePotion(item, oldBonus.charges));
                }
            });
        }
        if (save.version >= 0 && save.version < 4 && save.autoPotion !== undefined && save.autoPotion) {
            this.autoReuseActions.clear();
            this.game.actions.forEach((action) => this.autoReuseActions.add(action));
        }
        if (save.SETTINGS !== undefined) {
            this.autoReuseActions.clear();
            save.SETTINGS.general.autoReusePotion.forEach((oldPageID) => {
                const action = this.game.actions.getObjectByID(idMap.pageToAction[oldPageID]);
                if (action !== undefined)
                    this.autoReuseActions.add(action);
            });
        }
    }
}
class PotionSelectMenuItemElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('potion-select-menu-item-template'));
        this.potionImage = getElementFromFragment(this._content, 'potion-image', 'img');
        this.potionQuantity = getElementFromFragment(this._content, 'potion-quantity', 'h5');
        this.potionName = getElementFromFragment(this._content, 'potion-name', 'span');
        this.useButton = getElementFromFragment(this._content, 'use-button', 'button');
        this.potionDescription = getElementFromFragment(this._content, 'potion-description', 'h5');
        this.potionCharges = getElementFromFragment(this._content, 'potion-charges', 'h5');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setPotion(potion, game) {
        this.potionImage.src = potion.media;
        this.potionQuantity.textContent = numberWithCommas(game.bank.getQty(potion));
        this.potionName.textContent = potion.name;
        this.potionDescription.innerHTML = potion.modifiedDescription;
        this.potionCharges.textContent = templateLangString('MISC_STRING_28', {
            num: `${potion.charges}`
        });
        const isActive = game.potions.isPotionActive(potion);
        if (isActive) {
            this.useButton.textContent = getLangString('MISC_STRING_30');
            this.useButton.onclick = () => game.potions.removePotion(potion.action, true);
            this.useButton.classList.replace('btn-success', 'btn-danger');
            this.potionName.classList.replace('text-success', 'text-danger');
        } else {
            this.useButton.textContent = getLangString('MISC_STRING_29');
            this.useButton.onclick = () => game.potions.usePotion(potion, true);
            this.useButton.classList.replace('btn-danger', 'btn-success');
            this.potionName.classList.replace('text-danger', 'text-success');
        }
    }
}
window.customElements.define('potion-select-menu-item', PotionSelectMenuItemElement);
class PotionSelectMenuElement extends HTMLElement {
    constructor() {
        super();
        this.menuItems = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('potion-select-menu-template'));
        this.potionContainer = getElementFromFragment(this._content, 'potion-container', 'div');
        this.autoReuseCheckBox = getElementFromFragment(this._content, 'auto-reuse-checkbox', 'input');
        this.autoReuseCheckBox.id = 'auto-reuse-checkbox';
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    showPotionSelection(potions, action, game) {
        while (this.menuItems.length < potions.length) {
            this.menuItems.push(createElement('potion-select-menu-item', {
                className: setLang == 'de' || setLang == 'es' ? 'col-12 col-xl-4 col-lg-6' : 'col-12 col-lg-4 col-md-6',
                parent: this.potionContainer,
            }));
        }
        this.menuItems.forEach((menuItem, i) => {
            if (i < potions.length) {
                const potion = potions[i];
                const isActive = game.potions.isPotionActive(potion);
                if (game.settings.showPotionTiers[potion.tier] || isActive) {
                    menuItem.setPotion(potion, game);
                    showElement(menuItem);
                } else {
                    hideElement(menuItem);
                }
            } else {
                hideElement(menuItem);
            }
        });
        this.autoReuseCheckBox.checked = game.potions.autoReusePotionsForAction(action);
        this.autoReuseCheckBox.onchange = () => game.potions.toggleAutoReusePotion(action);
    }
}
//# sourceMappingURL=potionManager.js.map
checkFileVersion('?12097')