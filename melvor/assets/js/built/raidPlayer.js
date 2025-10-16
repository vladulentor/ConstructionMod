"use strict";
/** Player Class for Golbin Raid */
class RaidPlayer extends Player {
    /** Constructs a player for golbin raid */
    constructor(manager, game) {
        super(manager, game);
        this.manager = manager;
        this.food = new EquippedFood(1, this.game);
        this.altAttacks = new Map();
        this.baseSpawnInterval = 1500;
    }
    get isPrayerUnlocked() {
        return this.modifiers.golbinRaidPrayerUnlocked > 0;
    }
    get prayerPointsOnWaveCompletion() {
        return 20 + this.modifiers.golbinRaidPrayerPointsPerWave;
    }
    get allowRegen() {
        return true;
    }
    get useCombinationRunes() {
        // Override. Raid player's should never use combo runes as they are not available.
        return false;
    }
    get addItemsToBankOnLoadFail() {
        return false;
    }
    isEquipmentSlotUnlocked(slot) {
        switch (slot.id) {
            case "melvorD:Passive" /* EquipmentSlotIDs.Passive */ :
                {
                    return this.modifiers.golbinRaidPassiveSlotUnlocked > 0;
                }
            default:
                return true;
        }
    }
    modifyAttackInterval(interval) {
        interval = super.modifyAttackInterval(interval);
        interval /= 2;
        return interval;
    }
    resetAltAttacks() {
        this.altAttacks.clear();
    }
    getSlotAttacks(equipped) {
        const altAttacks = this.altAttacks.get(equipped.slot);
        if (altAttacks !== undefined)
            return altAttacks;
        else
            return super.getSlotAttacks(equipped);
    }
    computeLevels() {
        this.levels.Attack = this.getSkillLevel('Attack') + this.modifiers.getHiddenSkillLevels(this.game.attack);
        this.levels.Strength = this.getSkillLevel('Strength') + this.modifiers.getHiddenSkillLevels(this.game.strength);
        this.levels.Defence = this.getSkillLevel('Defence') + this.modifiers.getHiddenSkillLevels(this.game.defence);
        this.levels.Hitpoints = this.getSkillLevel('Hitpoints') + this.modifiers.getHiddenSkillLevels(this.game.hitpoints);
        this.levels.Ranged = this.getSkillLevel('Ranged') + this.modifiers.getHiddenSkillLevels(this.game.ranged);
        this.levels.Magic = this.getSkillLevel('Magic') + this.modifiers.getHiddenSkillLevels(this.game.altMagic);
        this.levels.Prayer = this.getSkillLevel('Prayer');
        this.levels.Corruption = this.getSkillLevel('Corruption');
        this.renderQueue.levels = true;
    }
    computeModifiers() {
        this.modifiers.empty();
        this.addProviderModifiers();
        this.modifiers.addModifiers(this.manager.randomModifierSource, this.manager.randomPlayerModifiers);
        this.addEquippedItemModifiers();
        this.addConditionalModifiers();
        this.addAttackStyleModifiers();
        this.addPassiveModifiers();
        this.addPrayerModifiers();
        this.checkMagicUsage();
        this.addAuroraModifiers();
        this.addMiscModifiers();
        this.addEffectModifiers();
        this.renderQueue.autoEat = true;
    }
    mergeUninheritedEffectApplicators() {}
    processDeath() {
        this.removeAllEffects();
        this.setHitpoints(10 * numberMultiplier);
        this.disableActivePrayers();
        this.game.telemetry.updatePlayerDeathEventCause('GolbinRaid');
        this.game.telemetry.fireEventType('player_death');
    }
    equipItem(item, set, slot = item.validSlots[0], quantity = 1, altAttacks = []) {
        const equipment = this.equipmentSets[set].equipment;
        if (!slot.allowQuantity)
            quantity = 1;
        if (equipment.checkForItem(item)) {
            // Edge case for adding quantity to an existing slot
            if (slot.allowQuantity) {
                equipment.addQuantityToSlot(slot, quantity);
                // Update user interface for increased quantity
                this.renderQueue.equipment = true;
                this.render();
                return true;
            } else {
                notifyPlayer(this.game.attack, templateLangString('TOASTS_ITEM_ALREADY_EQUIPPED', {
                    itemName: item.name
                }), 'danger');
                return false;
            }
        }
        // Wipe the alt attacks of equipment being removed
        this.equipment.getSlotsToUnequip(item, slot).forEach((slot) => {
            this.altAttacks.delete(slot);
        });
        if (altAttacks.length)
            this.altAttacks.set(slot, altAttacks);
        if (slot.id === "melvorD:Quiver" /* EquipmentSlotIDs.Quiver */ )
            quantity += equipment.getQuantityInSlot(slot.id);
        this.equipment.equipItem(item, slot, quantity);
        if (set === this.selectedEquipmentSet) {
            this.updateForEquipmentChange();
        } else {
            this.updateForEquipSetChange();
        }
        return true;
    }
    updateForEquipmentChange() {
        this.renderQueue.equipment = true;
        this._events.emit('equipmentChanged', new EquipmentChangedEvent(this));
        this.manager.computeAllStats();
        this.assignEquipmentEventHandlers();
        this.renderQueue.attackStyle = true;
        this.renderQueue.equipmentSets = true;
        this.game.renderQueue.activeSkills = true;
        this.interruptAttack();
        this.render();
    }
    /** Equips the selected food, replacing it if it is different */
    equipFood(item, quantity) {
        const oldFood = this.food.currentSlot.item;
        if (this.food.currentSlot.item !== item) {
            this.food.unequipSelected();
        }
        // Proceed to equip the food
        const equipped = this.food.equip(item, quantity);
        if (equipped) {
            this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
            this.renderFood();
            return true;
        } else {
            notifyPlayer(this.game.hitpoints, getLangString('TOASTS_NEED_FREE_SLOT'), 'danger');
            return false;
        }
    }
    /** Sets default starting equipment for golbin raid */
    setEquipmentToDefault() {
        this.resetAltAttacks();
        this.equipment.unequipAll();
        this.equipDefaultWeapon();
        if (this.manager.startingAmmo)
            this.equipItem(this.manager.startingAmmo.item, this.selectedEquipmentSet, undefined, this.manager.startingAmmo.quantity);
        this.food.unequipSelected();
        if (this.manager.startingFood)
            this.equipFood(this.manager.startingFood, 10);
        this.prayerPoints = 0;
        this.addPrayerPoints(this.modifiers.golbinRaidStartingPrayerPoints);
    }
    addMiscModifiers() {
        this.modifiers.addModifiers({
            get name() {
                return getLangString('COMBAT_MISC_AUTO_EAT');
            },
        }, this.manager.staticPlayerModifiers);
    }
    getSkillLevel(skill) {
        let level = this.manager.wave + 1;
        if (skill === 'Hitpoints')
            level += 9;
        if (skill === 'Prayer')
            level = 1 + this.modifiers.golbinRaidPrayerLevel;
        return level;
    }
    getLevelHistory() {
        return [
            this.getSkillLevel('Attack'),
            this.getSkillLevel('Strength'),
            this.getSkillLevel('Defence'),
            this.getSkillLevel('Hitpoints'),
            this.getSkillLevel('Ranged'),
            this.getSkillLevel('Magic'),
        ];
    }
    getEquipmentHistory() {
        const history = [];
        this.equipment.equippedArray.forEach((equipped) => {
            if (equipped.providesStats)
                history.push(equipped.item);
        });
        return history;
    }
    getFoodHealingBonus(item) {
        return this.modifiers.foodHealingValue;
    }
    onMagicAttackFailure() {
        this.equipDefaultWeapon();
    }
    onRangedAttackFailure(quiver) {
        this.equipDefaultWeapon();
    }
    consumeAmmo() {
        super.consumeAmmo();
        if (this.equipment.isSlotEmpty("melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ ))
            this.equipDefaultWeapon();
    }
    equipDefaultWeapon() {
        const weaponIndex = Math.min(this.modifiers.golbinRaidStartingWeapon, this.manager.startingWeapons.length - 1);
        const weapon = this.manager.startingWeapons[weaponIndex];
        this.equipItem(weapon, this.selectedEquipmentSet);
    }
    rewardForDamage(damage) {
        // Give nothing, this is golbin raid
    }
    trackItemUsage(costs) {
        // Don't track item usage stats
    }
    trackWeaponStat(stat, amount = 1) {
        // Don't track weapon stats
    }
    consumeItemCharges(e, item) {
        // Don't use item charges
    }
    consumeItemQuantities(e, equipped) {
        // Override to consume item quantities only, but with no XP gain
        if (this.equipment.removeQuantityFromSlot(equipped.slot.id, 1)) {
            this.onUnequipFromQuantityUse();
        }
        this.renderQueue.equipment = true;
    }
    consumeSynergyTablets(e) {
        // Don't use summoning synergy charges
    }
    trackArmourStat(stat, amount = 1) {
        // Don't track armour stats
    }
    addItemStat(item, stat, amount) {
        // Don't track any item stats
    }
    trackPrayerStats(stat, amount) {
        // Don't track any prayer stats
    }
    checkIfCantEquip() {
        notifyPlayer(this.game.attack, getLangString('TOASTS_CANNOT_DURING_RAID'), 'danger');
        return true;
    }
    render() {
        super.render();
        if (this.renderQueue.levels)
            this.renderLevels();
    }
    renderLevels() {
        COMBAT_LEVEL_KEYS.forEach((skill) => {
            const level = this.getSkillLevel(skill);
            const el = this.statElements.golbinLevels[skill];
            if (el !== undefined && el !== null)
                el.textContent = `${level}`;
        });
        this.renderQueue.levels = false;
    }
    encode(writer) {
        super.encode(writer);
        writer.writeMap(this.altAttacks, writeNamespaced, (attacks) => {
            writer.writeArray(attacks, writeNamespaced);
        });
        return writer;
    }
    decode(reader, version) {
        if (version >= 24)
            super.decode(reader, version);
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            this.altAttacks = reader.getMap(readNamespacedReject(this.game.equipmentSlots), (reader) => reader.getArray(readNamespacedReject(this.game.specialAttacks)));
        } else {
            reader.getArray((reader) => {
                const oldSlotID = reader.getUint8();
                const slot = this.game.equipmentSlots.getObjectByID(Equipment.slotIDMap[oldSlotID]);
                const attacks = reader.getArray(readNamespacedReject(this.game.specialAttacks));
                if (attacks.length && slot !== undefined)
                    this.altAttacks.set(slot, attacks);
            });
        }
    }
    deserializeAltAttacks(reader, version, idMap) {
        while (!reader.atEnd) {
            const oldSlotID = reader.getNumber();
            const slot = this.game.equipmentSlots.getObjectByID(Equipment.slotIDMap[oldSlotID]);
            const numAttacks = reader.getNumber();
            const altAttackArray = [];
            reader.getChunk(numAttacks).forEach((attackID) => {
                const attack = this.game.specialAttacks.getObjectByID(idMap.attacks[attackID]);
                if (attack !== undefined)
                    altAttackArray.push(attack);
            });
            if (altAttackArray.length && slot !== undefined)
                this.altAttacks.set(slot, altAttackArray);
        }
    }
    deserialize(reader, version, idMap) {
        // Fix for forgetting to save alt attacks.
        if (version <= 12) {
            super.deserialize(reader, version, idMap);
            return;
        }
        super.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.deserializeAltAttacks(reader.getVariableLengthChunk(), version, idMap);
    }
}
//# sourceMappingURL=raidPlayer.js.map
checkFileVersion('?12097')