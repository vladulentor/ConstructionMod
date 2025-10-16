"use strict";
var ScopeSourceType;
(function(ScopeSourceType) {
    ScopeSourceType["Category"] = "Category";
    ScopeSourceType["Action"] = "Action";
    ScopeSourceType["Subcategory"] = "Subcategory";
})(ScopeSourceType || (ScopeSourceType = {}));
class AttackSpellScopeSource extends NamespacedObject {
    constructor(nameSpace, game) {
        super(nameSpace, 'AttackSpell');
        this.game = game;
    }
    get name() {
        return `Attack Spell Scope`;
    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.game.attackSpellbooks;
            case ScopeSourceType.Action:
                return this.game.attackSpells;
            case ScopeSourceType.Subcategory:
                return this.game.altMagic.spellCategories;
        }
    }
    getPkgObjects(pkg, type) {
        var _a, _b, _c, _d, _e;
        switch (type) {
            case ScopeSourceType.Category:
                return (_a = pkg.data) === null || _a === void 0 ? void 0 : _a.attackSpellbooks;
            case ScopeSourceType.Action:
                return (_b = pkg.data) === null || _b === void 0 ? void 0 : _b.attackSpells;
            case ScopeSourceType.Subcategory:
                return ((_e = (_d = (_c = pkg.data) === null || _c === void 0 ? void 0 : _c.skillData) === null || _d === void 0 ? void 0 : _d.find((s) => s.skillID === "melvorD:Magic" /* SkillIDs.Magic */ )) === null || _e === void 0 ? void 0 : _e.data).spellCategories;
        }
    }
}
class CombatAreaScopeSource extends NamespacedObject {
    constructor(nameSpace, game) {
        super(nameSpace, 'CombatArea');
        this.game = game;
    }
    get name() {
        return `Combat Area Scope`;
    }
    getRegistry(type) {
        switch (type) {
            case ScopeSourceType.Category:
                return this.game.combatAreaCategories;
            case ScopeSourceType.Action:
                return this.game.combatAreas;
        }
    }
    getPkgObjects(pkg, type) {
        if (pkg.data === undefined)
            return;
        switch (type) {
            case ScopeSourceType.Category:
                return pkg.data.combatAreaCategories;
            case ScopeSourceType.Action:
                {
                    const objects = [];
                    if (pkg.data.combatAreas !== undefined)
                        objects.push(...pkg.data.combatAreas);
                    if (pkg.data.slayerAreas !== undefined)
                        objects.push(...pkg.data.slayerAreas);
                    if (pkg.data.dungeons !== undefined)
                        objects.push(...pkg.data.dungeons);
                    if (pkg.data.abyssDepths !== undefined)
                        objects.push(...pkg.data.abyssDepths);
                    if (pkg.data.strongholds !== undefined)
                        objects.push(...pkg.data.strongholds);
                    return objects.length > 0 ? objects : undefined;
                }
        }
    }
}
class ModifierScope {
    constructor(scope) {
        if (scope !== undefined)
            ModifierScope.copyScope(scope, this);
    }
    static forEachTemplateValue(scope, callbackFn) {
        if (scope.skill !== undefined) {
            callbackFn('skillName', scope.skill.name);
        }
        if (scope.damageType !== undefined) {
            callbackFn('damageType', scope.damageType.name);
            callbackFn('resistanceName', scope.damageType.resistanceName);
        }
        if (scope.realm !== undefined) {
            callbackFn('realmName', scope.realm.name);
        }
        if (scope.currency !== undefined) {
            callbackFn('currencyName', scope.currency.name);
        }
        if (scope.category !== undefined) {
            callbackFn('categoryName', scope.category.name);
        }
        if (scope.action !== undefined) {
            callbackFn('actionName', scope.action.name);
        }
        if (scope.subcategory !== undefined) {
            callbackFn('subcategoryName', scope.subcategory.name);
        }
        if (scope.item !== undefined) {
            callbackFn('itemName', scope.item.name);
        }
        if (scope.effectGroup !== undefined) {
            callbackFn('effectGroupName', scope.effectGroup.name);
        }
    }
    static addTemplateData(scope, templateData) {
        this.forEachTemplateValue(scope, (key, value) => {
            templateData[key] = value;
        });
    }
    static addEffectTemplateData(scope, templateData, prefix, postfix) {
        this.forEachTemplateValue(scope, (key, value) => {
            templateData[`${prefix}mod${setToUppercase(key)}${postfix}`] = value;
        });
    }
    static addDescriptionTemplateData(scope, templateData = {}, prefix, postfix) {
        this.forEachTemplateValue(scope, (key) => {
            templateData[key] = `\${${prefix}mod${setToUppercase(key)}${postfix}}`;
        });
        return templateData;
    }
    static getScopefromData(data, game, scopeSource) {
        const scope = {};
        try {
            if (data.skillID !== undefined) {
                scope.skill = game.skills.getObjectSafe(data.skillID);
                scopeSource = scope.skill;
            }
            if (data.damageTypeID !== undefined) {
                scope.damageType = game.damageTypes.getObjectSafe(data.damageTypeID);
            }
            if (data.realmID !== undefined) {
                scope.realm = game.realms.getObjectSafe(data.realmID);
            }
            if (data.currencyID !== undefined) {
                scope.currency = game.currencies.getObjectSafe(data.currencyID);
            }
            if (data.categoryID !== undefined) {
                if (scopeSource === undefined)
                    throw new Error('The category scope requires a skill/source for the scope.');
                scope.category = this.getObjectFromSourceSafe(scopeSource, ScopeSourceType.Category, data.categoryID);
            }
            if (data.actionID !== undefined) {
                if (scopeSource === undefined)
                    throw new Error('The action scope requires a skill/source for the scope.');
                scope.action = this.getObjectFromSourceSafe(scopeSource, ScopeSourceType.Action, data.actionID);
            }
            if (data.subcategoryID !== undefined) {
                if (scopeSource === undefined)
                    throw new Error('The subcategory scope requires a skill/source for scope.');
                scope.subcategory = this.getObjectFromSourceSafe(scopeSource, ScopeSourceType.Subcategory, data.subcategoryID);
            }
            if (data.itemID !== undefined) {
                scope.item = game.items.getObjectSafe(data.itemID);
            }
            if (data.effectGroupID !== undefined) {
                scope.effectGroup = game.combatEffectGroups.getObjectSafe(data.effectGroupID);
            }
        } catch (e) {
            throw new DataConstructionError(ModifierScope.name, e);
        }
        return scope;
    }
    /** Gets an object from a scope source of the given type */
    static getObjectFromSourceSafe(source, type, id) {
        const registry = source.getRegistry(type);
        if (registry === undefined)
            throw new Error(`Skill/Scope source ${source.name} does not support ${type}`);
        return registry.getObjectSafe(id);
    }
    /** Attempts to get an object from a scope source of the given type, returning undefined if it does note exist */
    static getObjectFromSource(source, type, id) {
        const registry = source.getRegistry(type);
        if (registry === undefined)
            return undefined;
        return registry.getObjectByID(id);
    }
    /**
     * Copies the modifier scope from one object to another
     * @param from The modifier scope to copy from
     * @param to The target object to apply the scope to
     */
    static copyScope(from, to) {
        if (from.skill !== undefined)
            to.skill = from.skill;
        if (from.damageType !== undefined)
            to.damageType = from.damageType;
        if (from.realm !== undefined)
            to.realm = from.realm;
        if (from.currency !== undefined)
            to.currency = from.currency;
        if (from.category !== undefined)
            to.category = from.category;
        if (from.action !== undefined)
            to.action = from.action;
        if (from.subcategory !== undefined)
            to.subcategory = from.subcategory;
        if (from.item !== undefined)
            to.item = from.item;
        if (from.effectGroup !== undefined)
            to.effectGroup = from.effectGroup;
    }
    /** Returns how specific a given scope is */
    static getSpecificity(scope) {
        if (scope === undefined)
            return 0;
        return ModifierQuery.getArray(scope).reduce((previous, current) => {
            if (current !== undefined)
                previous++;
            return previous;
        }, 0);
    }
    static getScopeKeyFromData(data) {
        let key = 0;
        if (data.skillID !== undefined)
            key += this.SCOPE_BIT_FIELD.skill;
        if (data.damageTypeID !== undefined)
            key += this.SCOPE_BIT_FIELD.damageType;
        if (data.realmID !== undefined)
            key += this.SCOPE_BIT_FIELD.realm;
        if (data.currencyID !== undefined)
            key += this.SCOPE_BIT_FIELD.currency;
        if (data.categoryID !== undefined)
            key += this.SCOPE_BIT_FIELD.category;
        if (data.actionID !== undefined)
            key += this.SCOPE_BIT_FIELD.action;
        if (data.subcategoryID !== undefined)
            key += this.SCOPE_BIT_FIELD.subcategory;
        if (data.itemID !== undefined)
            key += this.SCOPE_BIT_FIELD.item;
        if (data.effectGroupID !== undefined)
            key += this.SCOPE_BIT_FIELD.effectGroup;
        return key;
    }
}
ModifierScope.SCOPE_BIT_FIELD = {
    skill: 1,
    damageType: 2,
    realm: 4,
    currency: 8,
    category: 16,
    action: 32,
    subcategory: 64,
    item: 128,
    effectGroup: 256,
};
class ModifierAlias extends ModifierScope {
    constructor(data, game, scopeSource) {
        super(ModifierScope.getScopefromData(data, game, scopeSource));
        this.key = data.key;
    }
}
class ModifierValue extends ModifierScope {
    constructor(modifier, value, scope) {
        super(scope);
        this.modifier = modifier;
        this.value = value;
    }
    get isNegative() {
        return this.modifier.inverted !== this.value < 0;
    }
    toComparisonKey() {
        return `${this.modifier.id}-${ModifierTable.getQueryKey(this)}`;
    }
    validateScope() {
        this.validateSign();
        return this.modifier.hasScoping(this);
    }
    validateSign() {
        if (this.value < 0 && !this.modifier.allowNegative)
            console.warn(`${this.modifier.id} does not support negative values, but modifier value has one.`);
        if (this.value > 0 && !this.modifier.allowPositive)
            console.warn(`${this.modifier.id} does not support positive values, but modifier value has one.`);
    }
    clone() {
        return new ModifierValue(this.modifier, this.value, this);
    }
    getDescription(negMult = 1, posMult = 1, precision = 2) {
        const {
            template,
            includeSign,
            inverted
        } = this.modifier.getValueTemplateString(this);
        const templateData = this.getTemplateData(includeSign, negMult, posMult, precision);
        const description = templateString(template, templateData);
        const isNegative = this.isNegative !== inverted;
        return {
            description,
            isNegative
        };
    }
    print(negMult = 1, posMult = 1, precision = 2) {
        const {
            description,
            isNegative
        } = this.getDescription(negMult, posMult, precision);
        return {
            text: description,
            isNegative,
            isDisabled: this.modifier.disabled,
        };
    }
    printEnemy(negMult = 1, posMult = 1, precision = 2, showPrefix = true) {
        const {
            description,
            isNegative
        } = this.getDescription(negMult, posMult, precision);
        return {
            text: `${showPrefix ? `${getLangString('COMBAT_MISC_GIVES_THE_ENEMY')} ` : ''}${description}`,
            isNegative: !isNegative,
            isDisabled: this.modifier.disabled,
        };
    }
    getTemplatedDescription(prefix, postfix) {
        const {
            template,
            includeSign
        } = this.modifier.getValueTemplateString(this);
        const templateData = this.addDescriptionTemplateData({}, includeSign, prefix, postfix);
        return templateString(template, templateData);
    }
    getTemplateData(includeSign, negMult = 1, posMult = 1, precision = 2) {
        const templateData = {};
        ModifierScope.addTemplateData(this, templateData);
        const mult = this.isNegative ? negMult : posMult;
        const value = this.value * mult;
        templateData.value = this.modifier.formatValue(includeSign, value, precision);
        return templateData;
    }
    addEffectTemplateData(templateData, prefix, postfix, mult = 1) {
        ModifierScope.addEffectTemplateData(this, templateData, prefix, postfix);
        templateData[`${prefix}modValue${postfix}`] = this.modifier.formatValue(false, this.value * mult, 2);
    }
    addDescriptionTemplateData(templateData = {}, includeSign, prefix, postfix) {
        ModifierScope.addDescriptionTemplateData(this, templateData, prefix, postfix);
        templateData['value'] = `${includeSign ? (this.isNegative ? '-' : '+') : ''}\${${prefix}modValue${postfix}}`;
        return templateData;
    }
    static encode(writer, value) {
        writer.writeNamespacedObject(value.modifier);
        writer.writeFloat64(value.value);
        const scopeKey = Modifier.getScopeKey(value);
        writer.writeUint32(scopeKey);
        if (value.skill !== undefined)
            writer.writeNamespacedObject(value.skill);
        if (value.damageType !== undefined)
            writer.writeNamespacedObject(value.damageType);
        if (value.realm !== undefined)
            writer.writeNamespacedObject(value.realm);
        if (value.currency !== undefined)
            writer.writeNamespacedObject(value.currency);
        if (value.category !== undefined)
            writer.writeNamespacedObject(value.category);
        if (value.action !== undefined)
            writer.writeNamespacedObject(value.action);
        if (value.subcategory !== undefined)
            writer.writeNamespacedObject(value.subcategory);
        if (value.item !== undefined)
            writer.writeNamespacedObject(value.item);
        if (value.effectGroup !== undefined)
            writer.writeNamespacedObject(value.effectGroup);
        return writer;
    }
    static decode(game, reader, version) {
        var _a;
        const modifier = reader.getNamespacedObject(game.modifierRegistry);
        const value = reader.getFloat64();
        const scopeKey = reader.getUint32();
        const scope = {};
        let scopeSource;
        if (typeof modifier !== 'string') {
            scopeSource = (_a = modifier.getScopingFromKey(scopeKey)) === null || _a === void 0 ? void 0 : _a.scopeSource;
        }
        let failed = false;
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.skill) {
            const skill = reader.getNamespacedObject(game.skills);
            if (typeof skill === 'string') {
                failed = true;
            } else {
                scope.skill = skill;
                scopeSource = skill;
            }
        }
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.damageType) {
            const damageType = reader.getNamespacedObject(game.damageTypes);
            if (typeof damageType === 'string') {
                failed = true;
            } else {
                scope.damageType = damageType;
            }
        }
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.realm) {
            const realm = reader.getNamespacedObject(game.realms);
            if (typeof realm === 'string') {
                failed = true;
            } else {
                scope.realm = realm;
            }
        }
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.currency) {
            const currency = reader.getNamespacedObject(game.currencies);
            if (typeof currency === 'string') {
                failed = true;
            } else {
                scope.currency = currency;
            }
        }
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.category) {
            const categoryID = reader.getNamespacedObjectId();
            if (scopeSource === undefined) {
                failed = true;
            } else {
                const category = ModifierScope.getObjectFromSource(scopeSource, ScopeSourceType.Category, categoryID);
                if (category === undefined) {
                    failed = true;
                } else {
                    scope.category = category;
                }
            }
        }
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.action) {
            const actionID = reader.getNamespacedObjectId();
            if (scopeSource === undefined) {
                failed = true;
            } else {
                const action = ModifierScope.getObjectFromSource(scopeSource, ScopeSourceType.Action, actionID);
                if (action === undefined) {
                    failed = true;
                } else {
                    scope.action = action;
                }
            }
        }
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.subcategory) {
            const subcategoryID = reader.getNamespacedObjectId();
            if (scopeSource === undefined) {
                failed = true;
            } else {
                const subcategory = ModifierScope.getObjectFromSource(scopeSource, ScopeSourceType.Subcategory, subcategoryID);
                if (subcategory === undefined) {
                    failed = true;
                } else {
                    scope.subcategory = subcategory;
                }
            }
        }
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.item) {
            const item = reader.getNamespacedObject(game.items);
            if (typeof item === 'string') {
                failed = true;
            } else {
                scope.item = item;
            }
        }
        if (scopeKey & ModifierScope.SCOPE_BIT_FIELD.effectGroup) {
            const effectGroup = reader.getNamespacedObject(game.combatEffectGroups);
            if (typeof effectGroup === 'string') {
                failed = true;
            } else {
                scope.effectGroup = effectGroup;
            }
        }
        if (typeof modifier === 'string' || failed)
            return undefined;
        return new ModifierValue(modifier, value, scope);
    }
    static skipBytes(reader, version) {
        reader.skipBytes(10);
        for (let i = 0; i < 4; i++) {
            if (reader.getBoolean()) {
                reader.skipBytes(2);
            }
        }
    }
    static fromIDWithRegistry(registry, id, valueData, game) {
        try {
            const modifier = registry.getObjectSafe(id);
            const scoping = modifier.getScopingFromData(valueData);
            const scope = ModifierScope.getScopefromData(valueData, game, scoping.scopeSource);
            const modValue = new ModifierValue(modifier, valueData.value, scope);
            modValue.validateSign();
            return modValue;
        } catch (e) {
            throw new DataConstructionError(ModifierValue.name, e);
        }
    }
    static fromID(id, valueData, game) {
        return this.fromIDWithRegistry(game.modifierRegistry, id, valueData, game);
    }
    static fromEnemyID(id, valueData, game) {
        return this.fromIDWithRegistry(game.modifierRegistry.enemy, id, valueData, game);
    }
    static fromAlias(modifier, valueData, alias, game) {
        const scoping = modifier.getScopingFromDataWithAlias(valueData, alias);
        const scope = ModifierScope.getScopefromData(valueData, game, scoping.scopeSource);
        ModifierScope.copyScope(alias, scope);
        const modValue = new ModifierValue(modifier, valueData.value, scope);
        if (!modValue.validateScope())
            throw new Error(`Error constructing ${ModifierValue.name}. ${Modifier.name} with id: ${modValue.modifier.id} does not support scoping with: ${Object.keys(scope)}`);
        return modValue;
    }
    static fromKey(key, valueData, game) {
        const alias = game.modifierRegistry.getAlias(key);
        if (alias !== undefined) {
            if (alias.isNegative)
                valueData.value = -valueData.value;
            return this.fromAlias(alias.modifier, valueData, alias.alias, game);
        } else {
            const id = Modifier.getIdFromKey(key);
            return this.fromID(id, valueData, game);
        }
    }
    static fromEnemyKey(key, valueData, game) {
        const alias = game.modifierRegistry.getEnemyAlias(key);
        if (alias !== undefined) {
            if (alias.isNegative)
                valueData.value = -valueData.value;
            return this.fromAlias(alias.modifier, valueData, alias.alias, game);
        } else {
            const id = Modifier.getIdFromKey(key);
            return this.fromEnemyID(id, valueData, game);
        }
    }
    /**
     * Attempts to get an instance of this class from a key value pair, returning undefined if any errors occur.
     * Only for use in converting old save data
     */
    static fromKeySafe(key, value, game) {
        try {
            return this.fromKey(key, {
                value
            }, game);
        } catch (_a) {
            return undefined;
        }
    }
    /**
     * Attempts to construct skill scoped modifier instances of this class from a series of skill/value pairs, returning results only for the valid pairs
     * Only for use in converting old save data
     */
    static fromSkillKeyValues(key, values, game) {
        const modValues = [];
        const alias = game.modifierRegistry.getAlias(key);
        if (alias !== undefined) {
            values.forEach(({
                skill,
                value
            }) => {
                if (alias.isNegative)
                    value = -value;
                const newValue = new ModifierValue(alias.modifier, value, {
                    skill
                });
                ModifierScope.copyScope(alias.alias, newValue);
                if (newValue.validateScope())
                    modValues.push(newValue);
            });
        } else {
            const modifier = game.modifierRegistry.getObjectByID(Modifier.getIdFromKey(key));
            if (modifier !== undefined) {
                values.forEach(({
                    skill,
                    value
                }) => {
                    const newValue = new ModifierValue(modifier, value, {
                        skill
                    });
                    if (newValue.validateScope())
                        modValues.push(newValue);
                });
            }
        }
        return modValues;
    }
}
ModifierValue.posTextClass = 'text-success';
ModifierValue.negTextClass = 'font-w700 text-danger';
ModifierValue.neutralTextClass = 'font-w700 text-warning';
ModifierValue.disabledTextClass = 'font-w700 text-disabled';
class ModifierDescription {
    constructor(data, game, scopeSource) {
        /** The exclusive range of values that can be formatted by this description. */
        this.range = [-Infinity, Infinity];
        this.includeSign = true;
        /** If this description should have positive/negative formatting opposite to the modifier */
        this.inverted = false;
        try {
            this._text = data.text;
            if (data.lang !== undefined)
                this._lang = data.lang;
            if (data.above !== undefined)
                this.range[0] = data.above;
            if (data.below !== undefined)
                this.range[1] = data.below;
            if (data.includeSign !== undefined)
                this.includeSign = data.includeSign;
            if (data.inverted !== undefined)
                this.inverted = data.inverted;
            if (data.scope !== undefined)
                this.scope = ModifierScope.getScopefromData(data.scope, game, scopeSource);
        } catch (e) {
            throw new DataConstructionError(ModifierDescription.name, e);
        }
    }
    get template() {
        if (this._lang !== undefined)
            return getLangString(this._lang);
        return this._text;
    }
}
class ModifierScoping {
    constructor(data, game) {
        /** The descriptions for this modifier. Sorted by specificity and minimum range */
        this.descriptions = [];
        try {
            this.scopes = data.scopes;
            if (data.scopeSource !== undefined) {
                this.scopeSource = game.modifierScopeSources.getObjectSafe(data.scopeSource);
            }
            const hasScopeSource = this.scopeSource !== undefined || this.scopes.skill;
            if (this.scopes.category && !hasScopeSource)
                throw new Error('The category scope requires the skill scope, or a scope source.');
            if (this.scopes.action && !hasScopeSource)
                throw new Error(`The action scope requires the skill scope, or a scope source.`);
            if (this.scopes.subcategory && !hasScopeSource)
                throw new Error('The subcategory scope requires the skill scope, or a scope source.');
            this.addDescriptions(data.descriptions, game);
            const scopeKey = Modifier.getScopeKey(this.scopes);
            if (data.posAliases !== undefined)
                this.posAliases = this.constructAliases(scopeKey, game, data.posAliases);
            if (data.negAliases !== undefined)
                this.negAliases = this.constructAliases(scopeKey, game, data.negAliases);
        } catch (e) {
            throw new DataConstructionError(ModifierScoping.name, e);
        }
    }
    applyDataModification(data, game) {
        var _a, _b;
        if (data.descriptions !== undefined) {
            this.addDescriptions(data.descriptions, game);
        }
        const scopeKey = Modifier.getScopeKey(this.scopes);
        if (data.posAliases !== undefined) {
            (_a = this.posAliases) !== null && _a !== void 0 ? _a : (this.posAliases = []);
            this.posAliases.push(...this.constructAliases(scopeKey, game, data.posAliases));
        }
        if (data.negAliases !== undefined) {
            (_b = this.negAliases) !== null && _b !== void 0 ? _b : (this.negAliases = []);
            this.negAliases.push(...this.constructAliases(scopeKey, game, data.negAliases));
        }
    }
    /** Gets the appropriate description for a value within this scope */
    getDescriptionTemplate(modValue) {
        const description = this.descriptions.find((desc) => {
            return ((desc.scope === undefined || ModifierTable.doesQueryMatchScope(desc.scope, modValue)) &&
                desc.range[0] < modValue.value &&
                modValue.value < desc.range[1]);
        });
        if (description === undefined)
            return {
                template: `Error: No suitable description exists for value: ${modValue.value}`,
                includeSign: false,
                inverted: false,
            };
        return description;
    }
    constructAliases(scopeKey, game, data) {
        return data.map((data) => {
            const alias = new ModifierAlias(data, game, this.scopeSource);
            if ((scopeKey | Modifier.getScopeKey(alias)) !== scopeKey)
                throw new Error('Aliases must only contain scopes of their scoping.');
            return alias;
        });
    }
    addDescriptions(data, game) {
        data.forEach((descData) => {
            const description = new ModifierDescription(descData, game, this.scopeSource);
            // Is every query param on the description scope
            if (description.scope !== undefined && !this.isScopeCombatible(description.scope)) {
                throw new Error(`Description with scope ${ModifierTable.getQueryKey(description.scope)} is not compatible with scope ${ModifierTable.getQueryKey(this.scopes)}.`);
            }
            this.descriptions.push(description);
        });
        this.sortDescriptions();
        // TODO_MR Implement checking for description range overlaps and throwing an error
    }
    isScopeCombatible(scope) {
        const thisScope = ModifierQuery.getArray(this.scopes);
        const scopeArray = ModifierQuery.getArray(scope);
        return scopeArray.every((scope, i) => {
            return scope === undefined || thisScope[i];
        });
    }
    sortDescriptions() {
        this.descriptions.sort((a, b) => {
            const specA = ModifierScope.getSpecificity(a.scope);
            const specB = ModifierScope.getSpecificity(b.scope);
            if (specA !== specB)
                return specB - specA;
            if (a.range[0] > b.range[0])
                return 1;
            else if (a.range[0] === b.range[0])
                return 0;
            else
                return -1;
        });
    }
}
class Modifier extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.game = game;
        this.inverted = false;
        this.allowPositive = true;
        this.allowNegative = true;
        this.isCombat = false;
        this.allowEnemy = false;
        this.scopeMap = new Map();
        /** Run-time property that disables this modifier. Disabling prevents the modifier from being added to ModifierTables */
        this.disabled = false;
        try {
            if (data.inverted !== undefined)
                this.inverted = data.inverted;
            if (data.allowPositive !== undefined)
                this.allowPositive = data.allowPositive;
            if (data.allowNegative !== undefined)
                this.allowEnemy = data.allowNegative;
            if (data.isCombat !== undefined)
                this.isCombat = data.isCombat;
            if (data.allowEnemy !== undefined)
                this.allowEnemy = data.allowEnemy;
            if (data.modifyValue !== undefined) {
                this.modifyValue = Modifier.valueTranspiler.buildFunction(data.modifyValue, `Modify Value: `);
            }
            this.allowedScopes = data.allowedScopes.map((d) => {
                const scoping = new ModifierScoping(d, game);
                const key = Modifier.getScopeKey(scoping.scopes);
                if (this.scopeMap.has(key))
                    console.warn(`${Modifier.name} with id "${this.id}" has multiple entries for scope ${Object.keys(scoping.scopes)}`);
                this.scopeMap.set(key, scoping);
                return scoping;
            });
        } catch (e) {
            throw new DataConstructionError(Modifier.name, e, this.id);
        }
    }
    /** If this modifier has a scoping with no specified scopes */
    get hasEmptyScope() {
        return this.scopeMap.has(0);
    }
    applyDataModification(data, game) {
        try {
            data.allowedScopes.forEach((scoping) => {
                const scopeKey = Modifier.getScopeKey(scoping.scopes);
                const existing = this.scopeMap.get(scopeKey);
                if (existing !== undefined) {
                    existing.applyDataModification(scoping, game);
                } else {
                    if (scoping.descriptions === undefined)
                        throw new Error('The "descriptions" property must be defined to add a new scoping.');
                    const newScope = new ModifierScoping(scoping, game);
                    if (DEBUGENABLED)
                        console.warn(`Modifications creating new scoping for modifier ${this.id}`);
                    this.allowedScopes.push(newScope);
                    this.scopeMap.set(scopeKey, newScope);
                }
            });
        } catch (e) {
            throw new DataModificationError(Modifier.name, e, this.id);
        }
    }
    getValueTemplateString(modValue) {
        const scopeKey = Modifier.getScopeKey(modValue);
        let scoping;
        if (modValue.realm !== undefined && this.game.realms.size === 1) {
            const nonRealmKey = scopeKey - ModifierScope.SCOPE_BIT_FIELD.realm;
            scoping = this.scopeMap.get(nonRealmKey);
        }
        if (scoping === undefined)
            scoping = this.scopeMap.get(scopeKey);
        if (scoping === undefined)
            return {
                template: 'Error: No scoping exists for value.',
                includeSign: true,
                inverted: false
            };
        return scoping.getDescriptionTemplate(modValue);
    }
    formatValue(includeSign, value, precision = 2, percent = false) {
        if (this.modifyValue !== undefined) {
            value = this.modifyValue(value);
        }
        if (!includeSign && value < 0)
            value = -value;
        let valueString = !Number.isInteger(value) ? value.toFixed(precision) : numberWithCommas(value);
        if (includeSign && value > 0)
            valueString = `+${valueString}`;
        if (percent)
            valueString += '%';
        return valueString;
    }
    getScopingFromData(data) {
        const scopeKey = ModifierScope.getScopeKeyFromData(data);
        const scoping = this.scopeMap.get(scopeKey);
        if (scoping !== undefined)
            return scoping;
        throw new Error(`No scoping exists for scope: ${Object.keys(data)} for modifier "${this.id}"`);
    }
    getScopingFromDataWithAlias(data, alias) {
        const scopeKey = ModifierScope.getScopeKeyFromData(data) | Modifier.getScopeKey(alias);
        const scoping = this.scopeMap.get(scopeKey);
        if (scoping !== undefined)
            return scoping;
        throw new Error(`No scoping exists for scope: ${Object.keys(data)} for modifier "${this.id}" with alias "${alias.key}"`);
    }
    hasScoping(scope) {
        return this.scopeMap.has(Modifier.getScopeKey(scope));
    }
    getScopingFromKey(scopeKey) {
        return this.scopeMap.get(scopeKey);
    }
    static formatTotalValue(includeSign, value, precision = 2, percent = false) {
        if (!includeSign && value < 0)
            value = -value;
        let valueString = !Number.isInteger(value) ? value.toFixed(precision) : numberWithCommas(value);
        if (includeSign && value > 0)
            valueString = `+${valueString}`;
        if (percent)
            valueString += '%';
        return valueString;
    }
    static getScopeKey(scope) {
        const scopeArray = ModifierQuery.getArray(scope);
        let key = 0;
        for (let i = 0; i < scopeArray.length; i++) {
            if (scopeArray[i] !== undefined)
                key += Math.pow(2, i);
        }
        return key;
    }
    static getIdFromKey(key) {
        return key.includes(':') ? key : `${"melvorD" /* Namespaces.Demo */}:${key}`;
    }
}
Modifier.valueTranspiler = expressions.getModifierValueTranspiler();
/** Holds the keys of the modifiers that were "skill" modifiers. Used for loading old save data */
Modifier.OLD_SKILL_MODIFIER_KEYS = [
    'increasedHiddenSkillLevel',
    'decreasedHiddenSkillLevel',
    'decreasedSkillInterval',
    'decreasedSkillIntervalPercent',
    'increasedMasteryXP',
    'increasedSkillXP',
    'increasedSkillInterval',
    'increasedSkillIntervalPercent',
    'decreasedMasteryXP',
    'decreasedSkillXP',
    'increasedChanceToDoubleItemsSkill',
    'decreasedChanceToDoubleItemsSkill',
    'increasedSkillPreservationChance',
    'decreasedSkillPreservationChance',
    'increasedChanceAdditionalSkillResource',
    'decreasedChanceAdditionalSkillResource',
    'doubleItemsSkill',
    'masteryToken',
    'increasedSkillPreservationCap',
    'decreasedSkillPreservationCap',
    'increasedSkillMasteryXPPerDeedree',
    'increasedSkillMasteryXPPerAmeria',
    'increasedSkillMasteryXPPerVale',
    'increasedSkillMasteryXPPerQimican',
    'increasedSkillMasteryXPPerKo',
    'increasedSkillMasteryXPPerArachi',
    'increasedSkillMasteryXPPerIridan',
    'increasedSkillMasteryXPPerHyden',
    'increasedSkillMasteryXPPerSyllia',
    'increasedHiddenSkillLevelPer2Levels',
    'increasedHiddenSkillLevelBasedOnLevels',
    'increasedMeleeStrengthBonusBasedOnSkillLevel',
    'increasedHiddenSkillLevelPer3Levels',
];
class ModifierRegistry extends NamespaceRegistry {
    constructor(rootNamespaceMap) {
        super(rootNamespaceMap, Modifier.name);
        this.enemyAliases = new Map();
        this.aliases = new Map();
        this.enemy = new NamespaceRegistry(this.rootNamespaceMap, 'EnemyModifier');
    }
    registerObject(modifier) {
        super.registerObject(modifier);
        if (modifier.allowEnemy)
            this.enemy.registerObject(modifier);
        this.updateAliases(modifier);
    }
    updateAliases(modifier) {
        modifier.allowedScopes.forEach((scoping) => {
            var _a, _b;
            (_a = scoping.posAliases) === null || _a === void 0 ? void 0 : _a.forEach((alias) => {
                const aliasInfo = {
                    isNegative: false,
                    modifier,
                    alias,
                };
                this.aliases.set(alias.key, aliasInfo);
                if (modifier.allowEnemy)
                    this.enemyAliases.set(alias.key, aliasInfo);
            });
            (_b = scoping.negAliases) === null || _b === void 0 ? void 0 : _b.forEach((alias) => {
                const aliasInfo = {
                    isNegative: true,
                    modifier,
                    alias,
                };
                this.aliases.set(alias.key, aliasInfo);
                if (modifier.allowEnemy)
                    this.enemyAliases.set(alias.key, aliasInfo);
            });
        });
    }
    getAlias(key) {
        return this.aliases.get(key);
    }
    getEnemyAlias(key) {
        return this.enemyAliases.get(key);
    }
}
/**
 * Formats Modifiers using the given formatter function
 * @param formatter Formats the description and textClass of a modifier
 * @param modifiers The modifier object to format
 * @param negMult Optional. Multiplier applied to negative modifiers.
 * @param posMult Optional. Multiplier applied to positive modifiers.
 * @returns An array of formatted descriptions
 */
function formatModifiers(formatter, modifiers, negMult = 1, posMult = 1) {
    return modifiers.map((modValue) => formatter(modValue.print(negMult, posMult)));
}

function addEffectModifierTemplateData(templateData, modifiers, prefix) {
    modifiers.forEach((modValue, i) => {
        modValue.addEffectTemplateData(templateData, prefix, `${i}`);
    });
}

function getModifierDataDescriptions(modifiers, prefix) {
    const descriptions = modifiers.map((modValue, i) => {
        return modValue.getTemplatedDescription(prefix, `${i}`);
    });
    return descriptions;
}

function generateModifierDataDescription(modifiers, key) {
    return joinAsList(getModifierDataDescriptions(modifiers, key));
}
/** Gets an array of plain modifier descriptions from data*/
function getPlainModifierDescriptions(modifiers) {
    return formatModifiers(plainDescriptionFormatter, modifiers);
}

function containsDisabledModifier(modifiers) {
    if (modifiers === undefined)
        return false;
    return modifiers.some((modValue) => modValue.modifier.disabled);
}
/** Describes modifiers and joins them as a list with no HTML formatting, unless the modifier is disabled */
function describeModifierDataPlain(modifiers) {
    return joinAsList(getPlainModifierDescriptions(modifiers));
}
/** Describes modifiers and joins them as a list separated by HTML line breaks with no HTML formatting for the modifier itself */
function describeModifierDataPlainLineBreak(modifiers) {
    return joinAsLineBreakList(getPlainModifierDescriptions(modifiers));
}
/** Describes modifiers and joins them as a list using Intl.ListFormat */
function describeModifierData(modifiers) {
    const modSpans = getModifierDataSpans(modifiers);
    return joinAsList(modSpans);
}
/** Describes modifiers and joins them as a list separated by HTML line breaks */
function describeModifierDataLineBreak(modifiers) {
    const modSpans = getModifierDataSpans(modifiers);
    return joinAsLineBreakList(modSpans);
}
/** Gets span HTML that describes modifiers */
function getModifierDataSpans(modifiers, negMult = 1, posMult = 1) {
    return formatModifiers(spanHTMLDescriptionFormatter, modifiers, negMult, posMult);
}

function getSpansFromModifierObject(modifiers, negMult = 1, posMult = 1, className) {
    return formatModifiers(getElementDescriptionFormatter('span', className), modifiers, negMult, posMult);
}
//# sourceMappingURL=modifiers.js.map
checkFileVersion('?12097')