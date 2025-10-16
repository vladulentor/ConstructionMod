"use strict";
var _a;
/** Utility class for generating a unique modifier source from some other source object. */
class ForwardingModifierSource {
    constructor(originalSource) {
        this.originalSource = originalSource;
    }
    get name() {
        return this.originalSource.name;
    }
}
class ModifierQueryResult {
    constructor(source, modifier, scope, value) {
        this.source = source;
        this.modifier = modifier;
        this.scope = scope;
        this.value = value;
    }
}
class ModifierTableEntry {
    constructor(source, modValue, negMult, posMult) {
        this.modValue = modValue;
        this.scopeUIDs = [];
        this.anyScopeUIDs = [];
        this.data = new ModifierQueryResult(source, modValue.modifier, modValue, this.getValue(negMult, posMult));
        const scopeArray = ModifierTable.getScopeArray(modValue);
        for (let i = 0; i < scopeArray.length; i++) {
            const scope = scopeArray[i];
            if (scope === undefined)
                continue;
            this.scopeUIDs.push(scope.uid);
            this.anyScopeUIDs.push(-1 - i);
        }
    }
    getValue(negMult, posMult) {
        let value = this.modValue.value;
        if (this.modValue.modifier.inverted === value < 0)
            value *= posMult;
        else
            value *= negMult;
        return value;
    }
    updateValue(negMult, posMult) {
        this.data.value = this.getValue(negMult, posMult);
    }
}
class ModifierQuery {
    constructor(options, enableCaching = true) {
        this.enableCaching = enableCaching;
        this.set = new Set();
        this.scopeSets = [];
        this.caches = new Map();
        for (let i = 0; i < ModifierQuery.SCOPE_COUNT; i++) {
            this.scopeSets.push(new Set());
        }
        if (options !== undefined)
            this.add(options);
    }
    add(options) {
        const queryArray = ModifierQuery.getArray(options);
        for (let i = 0; i < queryArray.length; i++) {
            const query = queryArray[i];
            if (query === undefined)
                continue;
            if (query === true) {
                this.addUID(-1 - i, i);
            } else if (Array.isArray(query)) {
                for (let j = 0; j < query.length; j++) {
                    this.addUID(query[j].uid, i);
                }
            } else {
                this.addUID(query.uid, i);
            }
        }
        this.dirtyCaches();
    }
    replace(options) {
        const queryArray = ModifierQuery.getArray(options);
        for (let i = 0; i < queryArray.length; i++) {
            const query = queryArray[i];
            if (query === undefined)
                continue;
            for (const uid of this.scopeSets[i]) {
                this.set.delete(uid);
            }
            this.scopeSets[i].clear();
            if (query === true) {
                this.addUID(-1 - i, i);
            } else if (Array.isArray(query)) {
                for (let j = 0; j < query.length; j++) {
                    this.addUID(query[j].uid, i);
                }
            } else {
                this.addUID(query.uid, i);
            }
        }
        this.dirtyCaches();
    }
    remove(options) {
        const queryArray = ModifierQuery.getArray(options);
        for (let i = 0; i < queryArray.length; i++) {
            const query = queryArray[i];
            if (query === undefined)
                continue;
            if (query === true) {
                this.removeUID(-1 - i, i);
            } else if (Array.isArray(query)) {
                for (let j = 0; j < query.length; j++) {
                    this.removeUID(query[j].uid, i);
                }
            } else {
                this.removeUID(query.uid, i);
            }
        }
        this.dirtyCaches();
    }
    addUID(uid, i) {
        this.set.add(uid);
        this.scopeSets[i].add(uid);
    }
    removeUID(uid, i) {
        this.set.delete(uid);
        this.scopeSets[i].delete(uid);
    }
    clear() {
        this.set.clear();
        this.scopeSets.forEach((set) => set.clear());
        this.dirtyCaches();
    }
    clone() {
        const clone = new ModifierQuery();
        clone.set = new Set(this.set);
        clone.scopeSets = this.scopeSets.map((set) => new Set(set));
        return clone;
    }
    getCache(table, key) {
        let keyMap = this.caches.get(table);
        if (keyMap === undefined) {
            keyMap = new Map();
            this.caches.set(table, keyMap);
        }
        let cache = keyMap.get(key);
        if (cache === undefined) {
            cache = {
                query: [],
                queryDirty: true,
            };
            keyMap.set(key, cache);
        } else {
            cache.queryDirty = true;
        }
        return cache;
    }
    dirtyCaches() {
        if (!this.enableCaching)
            return;
        this.caches.forEach((keyMap, table) => {
            keyMap.forEach((cache, key) => {
                cache.query = [];
                cache.queryDirty = true;
                table.dirtyValue(key, this);
            });
        });
    }
    static getArray(options) {
        return [
            options.skill,
            options.damageType,
            options.realm,
            options.currency,
            options.category,
            options.action,
            options.subcategory,
            options.item,
            options.effectGroup,
        ];
    }
}
_a = ModifierQuery;
ModifierQuery.ANY_UID = {
    skill: -1,
    damageType: -2,
    realm: -3,
    currency: -4,
    category: -5,
    action: -6,
    subcategory: -7,
    item: -8,
    effectGroup: -9,
};
ModifierQuery.SCOPE_COUNT = Object.keys(_a.ANY_UID).length;
ModifierQuery.EMPTY = new ModifierQuery();
ModifierQuery.ANY_SKILL = new ModifierQuery({
    skill: true
});
ModifierQuery.ANY_CURRENCY = new ModifierQuery({
    currency: true
});
ModifierQuery.ANY_DAMAGETYPE = new ModifierQuery({
    damageType: true
});
ModifierQuery.ANY_CURRENCY_AND_DAMAGETYPE = new ModifierQuery({
    currency: true,
    damageType: true
});
class ModifierTable {
    constructor() {
        /** Stores the modifier entries in this table, based on their source */
        this.entries = new Map();
        /** Maps the IDs of Modifiers to an array of entries corresponding to it */
        this.entriesByID = new Map();
        /** Maps the IDs of Modifiers to an array of query caches for that key */
        this.queryCaches = new Map();
        this.valueCaches = new Map();
    }
    /**
     * Queries the table, returning all entries that match
     * @param query
     * @param queryKey
     * @returns
     */
    query(key, query) {
        if (query.enableCaching) {
            const cache = this.getAndUpdateEntries(key, query);
            return cache.query;
        }
        return this.computeQuery(key, query);
    }
    getQueryCache(key, query) {
        let cacheMap = this.queryCaches.get(key);
        if (cacheMap === undefined) {
            cacheMap = new WeakMap();
            this.queryCaches.set(key, cacheMap);
        }
        let cache = cacheMap.get(query);
        if (cache === undefined) {
            cache = query.getCache(this, key);
            cacheMap.set(query, cache);
        }
        return cache;
    }
    getCachedValue(key, query) {
        let cacheMap = this.valueCaches.get(key);
        if (cacheMap === undefined) {
            cacheMap = new WeakMap();
            this.valueCaches.set(key, cacheMap);
            const value = this.computeValue(this.query(key, query));
            cacheMap.set(query, value);
            return value;
        } else {
            const cached = cacheMap.get(query);
            if (cached !== undefined)
                return cached;
            const value = this.computeValue(this.query(key, query));
            cacheMap.set(query, value);
            return value;
        }
    }
    getAndUpdateEntries(key, query) {
        const cache = this.getQueryCache(key, query);
        if (cache.queryDirty) {
            cache.query = this.computeQuery(key, query);
            cache.queryDirty = false;
        }
        return cache;
    }
    computeQuery(key, query) {
        const result = [];
        const entries = this.entriesByID.get(key);
        if (entries !== undefined && entries.length > 0) {
            for (let i = 0; i < entries.length; i++) {
                if (ModifierTable.doesEntryMatchSet(entries[i], query.set))
                    result.push(entries[i].data);
            }
        }
        return result;
    }
    /** Gets the total value of all modifiers that match the given query */
    getValue(key, query) {
        if (query.enableCaching) {
            return this.getCachedValue(key, query);
        }
        return this.computeValue(this.computeQuery(key, query));
    }
    dirtyValue(key, query) {
        const cacheMap = this.valueCaches.get(key);
        if (cacheMap === undefined)
            return;
        cacheMap.delete(query);
    }
    computeValue(entries) {
        return entries.reduce((previous, entry) => {
            return previous + entry.value;
        }, 0);
    }
    printSources(key, params = {}) {
        const query = new ModifierQuery(params);
        const result = this.query(key, query);
        result.forEach((entry) => {
            if (entry.value === 0)
                return;
            console.log(`${entry.source.name}: ${entry.value}`);
        });
    }
    /** Removes all modifiers stored in this table, and invalidates the entire cache */
    empty() {
        this.entries.clear();
        this.entriesByID.clear();
        this.queryCaches.clear();
        this.valueCaches.clear();
    }
    /**
     * Adds a new modifier value to the table
     * @param source The source of the value
     * @param modValue The value to add
     * @param negMult Multiplier to apply to "negative" modifier values
     * @param posMult Multiplier to apply to "positive" modifier values
     * @returns If a modifier that impacts combat stats changed
     */
    addModifier(source, modValue, negMult, posMult) {
        if (modValue.modifier.disabled)
            return;
        const entry = new ModifierTableEntry(source, modValue, negMult, posMult);
        this.addEntry(source, entry);
    }
    /**
     * Adds an array of modifier values to the table
     * @param source The source of the values
     * @param modifiers The values to add
     * @param negMult Optional multiplier to apply to "negative" modifier values
     * @param posMult Optional multiplier to apply to "positive" modifier values
     * @returns If a modifier that impacts combat stats changed
     */
    addModifiers(source, modifiers, negMult = 1, posMult = 1) {
        for (let i = 0; i < modifiers.length; i++) {
            this.addModifier(source, modifiers[i], negMult, posMult);
        }
    }
    /** Removes all modifiers that were added to the table from a given source */
    removeModifiers(source) {
        // Remove from primary data structure
        const removed = this.entries.get(source);
        this.entries.delete(source);
        if (removed === undefined)
            return;
        // Maintain the key indexing + invalidate query caching
        this.maintainCaches(removed);
    }
    /** Updates the modifiers in this table, invalidating only the value cache */
    updateModifiers(source, negMult, posMult) {
        const entries = this.entries.get(source);
        if (entries === undefined)
            return;
        entries.forEach((entry) => {
            entry.updateValue(negMult, posMult);
            this.valueCaches.delete(entry.data.modifier.id);
        });
    }
    addTable(table) {
        table.entries.forEach((entries, source) => {
            entries.forEach((entry) => {
                this.addEntry(source, entry);
            });
        });
    }
    removeTable(table) {
        const removed = [];
        table.entries.forEach((entriesToRemove, source) => {
            const sourceEntries = this.entries.get(source);
            if (sourceEntries === undefined)
                return;
            const newSourceEntries = sourceEntries.filter((entry) => {
                if (entriesToRemove.includes(entry)) {
                    removed.push(entry);
                    return false;
                }
                return true;
            });
            if (newSourceEntries.length > 0) {
                this.entries.set(source, newSourceEntries);
            } else {
                this.entries.delete(source);
            }
        });
        this.maintainCaches(removed);
    }
    getActiveModifierDescriptions() {
        const condensed = this.toCondensedValues();
        const descriptions = [];
        condensed.forEach((value) => {
            if (value.value !== 0)
                descriptions.push(value.print());
        });
        return descriptions;
    }
    getEnemyModifierDescriptions() {
        const condensed = this.toCondensedValues();
        const descriptions = [];
        condensed.forEach((value) => {
            if (value.value !== 0)
                descriptions.push(value.printEnemy());
        });
        return descriptions;
    }
    getModifierDescriptionsAsNodes(tagName, additionalClasses = []) {
        const nodes = [];
        const descriptions = this.getActiveModifierDescriptions();
        if (descriptions.length > 0) {
            descriptions.forEach((desc) => {
                nodes.push(createElement(tagName, {
                    className: getStandardDescTextClass(desc, true),
                    classList: additionalClasses,
                    text: desc.text,
                }));
            });
        } else {
            nodes.push(createElement(tagName, {
                className: ModifierValue.negTextClass,
                classList: additionalClasses,
                text: getLangString('MENU_TEXT_NONE'),
            }));
        }
        return nodes;
    }
    /** Gets a log of the modifiers that are contained in this object. Useful for debugging. */
    getLog() {
        const condensed = this.toCondensedValues();
        return condensed.map((modValue) => {
            return {
                name: modValue.toComparisonKey(),
                value: modValue.value,
            };
        });
    }
    /** Condenses the entries held within this table into a single array of ModifierValues with unique scopes */
    toCondensedValues() {
        const condensed = [];
        this.entriesByID.forEach((idEntries) => {
            const merged = new Map();
            idEntries.forEach((entry) => {
                const queryKey = ModifierTable.getQueryKey(entry.data.scope);
                let modValue = merged.get(queryKey);
                if (modValue === undefined) {
                    modValue = new ModifierValue(entry.data.modifier, entry.data.value, entry.data.scope);
                    merged.set(queryKey, modValue);
                } else {
                    modValue.value += entry.data.value;
                }
            });
            condensed.push(...merged.values());
        });
        return condensed;
    }
    addEntry(source, entry) {
        let sourceEntries = this.entries.get(source);
        if (sourceEntries === undefined) {
            sourceEntries = [];
            this.entries.set(source, sourceEntries);
        }
        sourceEntries.push(entry);
        const key = entry.data.modifier.id;
        // Maintain the key indexing
        let keyEntries = this.entriesByID.get(key);
        if (keyEntries === undefined) {
            keyEntries = [];
            this.entriesByID.set(key, keyEntries);
        }
        keyEntries.push(entry);
        this.invalidateCaches(key);
    }
    maintainCaches(removed) {
        removed.forEach((entry) => {
            const key = entry.data.modifier.id;
            const keyEntries = this.entriesByID.get(key);
            if (keyEntries !== undefined) {
                const newEntries = keyEntries.filter((kEntry) => kEntry !== entry);
                if (newEntries.length > 0) {
                    this.entriesByID.set(key, newEntries);
                } else {
                    this.entriesByID.delete(key);
                }
            }
            this.invalidateCaches(key);
        });
    }
    invalidateCaches(key) {
        this.queryCaches.delete(key);
        this.valueCaches.delete(key);
    }
    /** Determines if a given query matches the provided scope */
    static doesQueryMatchScopeArray(scopeArray, queryArray) {
        return scopeArray.every((scope, i) => {
            const query = queryArray[i];
            if (query === true) {
                // Wildcard query
                return scope !== undefined;
            } else if (Array.isArray(query)) {
                // Multiple values accepted
                return scope === undefined || query.includes(scope);
            } else {
                // Accept no entry or an equivalent entry
                return scope === undefined || scope === query;
            }
        });
    }
    static getScopeArray(scope) {
        return [
            scope.skill,
            scope.damageType,
            scope.realm,
            scope.currency,
            scope.category,
            scope.action,
            scope.subcategory,
            scope.item,
            scope.effectGroup,
        ];
    }
    static buildQueryKey(queryArray) {
        return queryArray
            .map((obj) => {
                if (obj === undefined)
                    return '';
                if (obj === true)
                    return '*';
                if (Array.isArray(obj))
                    return obj.map((o) => o.id).join(',');
                return obj.id;
            })
            .join('-');
    }
    static getQueryKey(options) {
        return this.buildQueryKey(ModifierQuery.getArray(options));
    }
    static doesQueryMatchScope(scope, options) {
        const scopeArray = this.getScopeArray(scope);
        const queryArray = ModifierQuery.getArray(options);
        return this.doesQueryMatchScopeArray(scopeArray, queryArray);
    }
    static doesEntryMatchSet(entry, querySet) {
        for (let i = 0; i < entry.scopeUIDs.length; i++) {
            if (!(querySet.has(entry.scopeUIDs[i]) || querySet.has(entry.anyScopeUIDs[i])))
                return false;
        }
        return true;
    }
}
/** A data view for an ActiveCharacterModifiers object. Provides convenience getters for CombatModifiers */
class CharacterModifierTable extends ModifierTable {
    constructor() {
        super();
    }
    init(game) {
        game.modifierRegistry.forEach((modifier) => {
            if (modifier.isModded || !modifier.hasEmptyScope || !modifier.allowEnemy)
                return;
            const id = modifier.id;
            Object.defineProperty(this, modifier.localID, {
                get: () => {
                    return this.getValue(id, ModifierQuery.EMPTY);
                },
            });
        });
    }
    /** Iterates on each entry in the table with a damageType scoping */
    forEachDamageType(key, callbackFn) {
        const result = this.query(key, ModifierQuery.ANY_DAMAGETYPE);
        result.forEach((entry) => {
            callbackFn(entry.value, entry.scope.damageType);
        });
    }
    /** Iterates on each entry in the table with a currency scoping */
    forEachCurrency(key, callbackFn) {
        const result = this.query(key, ModifierQuery.ANY_CURRENCY);
        result.forEach((entry) => {
            callbackFn(entry.value, entry.scope.currency);
        });
    }
    getDOTLifesteal(type) {
        let value = 0;
        switch (type) {
            case 'Bleed':
                value += this.bleedLifesteal;
                break;
            case 'Burn':
                value += this.burnLifesteal;
                break;
            case 'Poison':
            case 'DeadlyPoison':
                value += this.poisonLifesteal;
                break;
            case 'Laceration':
                value += this.lacerationLifesteal;
                break;
            case 'Ablaze':
                value += this.ablazeLifesteal;
                break;
            case 'Toxin':
                value += this.toxinLifesteal;
                break;
        }
        return value;
    }
    getCritChance(type) {
        let totalBonus = this.critChance;
        switch (type) {
            case 'melee':
                totalBonus += this.meleeCritChance;
                break;
            case 'ranged':
                totalBonus += this.rangedCritChance;
                break;
            case 'magic':
                totalBonus += this.magicCritChance;
                break;
            default:
                throw new Error(`Invalid attack type: ${type} while calculating crit chance.`);
        }
        return totalBonus;
    }
    getProtectionValue(type) {
        switch (type) {
            case 'melee':
                return this.meleeProtection;
            case 'ranged':
                return this.rangedProtection;
            case 'magic':
                return this.magicProtection;
        }
    }
    getImmunity(type) {
        switch (type) {
            case 'melee':
                return this.meleeImmunity > 0;
            case 'ranged':
                return this.rangedImmunity > 0;
            case 'magic':
                return this.magicImmunity > 0;
        }
    }
    getFlatReflectDamage() {
        const value = this.flatReflectDamage;
        return Math.max(0, value);
    }
    getRolledReflectDamage() {
        const value = this.rolledReflectDamage;
        return Math.max(0, value);
    }
    getReflectPercent() {
        const value = this.reflectDamage;
        return Math.max(0, value);
    }
}
/** A data view for an ActivePlayerModifiers object. Provides convenience getters for NonCombatModifiers */
class PlayerModifierTable extends CharacterModifierTable {
    constructor() {
        super();
    }
    getRunePreservationChance() {
        let chance = this.bypassRunePreservationChance;
        chance += this.runePreservationChance;
        return clampValue(chance, 0, 80);
    }
    getAmmoPreservationChance() {
        let chance = this.bypassAmmoPreservationChance;
        chance += this.ammoPreservationChance;
        return clampValue(chance, 0, 80);
    }
    getFoodPreservationChance() {
        return clampValue(this.foodPreservationChance, 0, 80);
    }
    init(game) {
        super.init(game);
        game.modifierRegistry.forEach((modifier) => {
            if (modifier.isModded || !modifier.hasEmptyScope || modifier.allowEnemy)
                return;
            const id = modifier.id;
            Object.defineProperty(this, modifier.localID, {
                get: () => {
                    return this.getValue(id, ModifierQuery.EMPTY);
                },
            });
        });
    }
    getHiddenSkillLevels(skill) {
        const per2Levels = Math.floor(skill.level * (this.getValue("melvorD:flatHiddenSkillLevelPer2Levels" /* ModifierIDs.flatHiddenSkillLevelPer2Levels */ , skill.modQuery) / 2));
        const per3Levels = Math.floor(skill.level * (this.getValue("melvorD:flatHiddenSkillLevelPer3Levels" /* ModifierIDs.flatHiddenSkillLevelPer3Levels */ , skill.modQuery) / 3));
        const percLevels = Math.floor((this.getValue("melvorD:flatHiddenSkillLevelBasedOnLevels" /* ModifierIDs.flatHiddenSkillLevelBasedOnLevels */ , skill.modQuery) / 100) * skill.level);
        return per2Levels + per3Levels + percLevels + this.getValue("melvorD:flatHiddenSkillLevel" /* ModifierIDs.flatHiddenSkillLevel */ , skill.modQuery);
    }
    getInstantActionsToPerform() {
        if (!game.currentGamemode.enableInstantActions)
            return 0;
        let actions = 1;
        actions += this.actionsPerClick;
        if (rollPercentage(this.extraActionPerClickChance))
            actions++;
        if (rollPercentage(this.doubleActionsPerClickChance))
            actions *= 2;
        return actions;
    }
}
/** Utility class for formatting and creating modifier source spans */
class ModifierSourceBuilder {
    constructor(modifiers, percent = false, totalLangString = getLangString('TOTAL')) {
        this.modifiers = modifiers;
        this.percent = percent;
        this._totalValue = 0;
        this._spans = [];
        this._totalValueSpan = createElement('span', {
            className: `text-warning col-2 text-left font-w400`,
        });
        this._spans.push(createElement('span', {
            className: `text-white text-right col-10 font-w700`,
            text: totalLangString,
        }), this._totalValueSpan);
    }
    addBaseSource(sourceName, value, isPositive = true) {
        this._totalValue += value;
        this._spans.push(createElement('span', {
            text: sourceName,
            className: 'text-info text-right col-10'
        }), createElement('span', {
            text: Modifier.formatTotalValue(true, value, 2, this.percent),
            className: `${isPositive ? 'text-success' : 'text-danger'} col-2 text-right pr-2`,
        }));
    }
    addSources(key, query = ModifierQuery.EMPTY, mult = 1) {
        const result = this.modifiers.query(key, query);
        result.forEach((entry) => {
            const value = mult * entry.value;
            if (value === 0)
                return;
            this._totalValue += entry.modifier.modifyValue ? entry.modifier.modifyValue(value) : value;
            this._spans.push(createElement('span', {
                className: 'text-info text-right col-10',
                text: `${entry.source.name}:`,
            }));
            const valueString = entry.modifier.formatValue(true, value, 2, this.percent);
            const isPositive = entry.modifier.inverted === value < 0;
            this._spans.push(createElement('span', {
                className: `${isPositive ? 'text-success' : 'text-danger'} col-2 text-right pr-2`,
                text: valueString,
            }));
        });
    }
    getSpans() {
        this._totalValueSpan.textContent = Modifier.formatTotalValue(true, this._totalValue, 2, this.percent);
        return this._spans;
    }
}
//# sourceMappingURL=modifierTable.js.map
checkFileVersion('?12097')