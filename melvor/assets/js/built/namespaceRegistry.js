"use strict";
class NamespaceMap {
    constructor() {
        this.registeredNamespaces = new Map();
    }
    /** Returns true if the map has a namespace with the given name */
    hasNamespace(name) {
        return this.registeredNamespaces.has(name);
    }
    getNamespace(name) {
        return this.registeredNamespaces.get(name);
    }
    getNamespaceSafe(name) {
        const ns = this.getNamespace(name);
        if (ns === undefined)
            throw new Error(`Namespace "${name}" is not registered.`);
        return ns;
    }
    registerNamespace(name, displayName, isModded) {
        if (isModded) {
            if (!NamespaceMap.isValidModdedName(name))
                throw new Error(`Error trying to register modded namespace. Name: "${name}" is invalid.`);
        } else {
            if (!NamespaceMap.isValidName(name))
                throw new Error(`Error trying to regsiter game namespace. Name: "${name}" is invalid.`);
        }
        if (this.hasNamespace(name))
            throw new Error(`Tried to register namespace: "${name}", but it already exists`);
        const newNamespace = {
            name,
            displayName,
            isModded,
        };
        this.registeredNamespaces.set(name, newNamespace);
        return newNamespace;
    }
    forEach(callbackfn) {
        this.registeredNamespaces.forEach((namespace) => callbackfn(namespace));
    }
    static isValidName(name) {
        return /^melvor[\w]+$/.test(name);
    }
    static isValidModdedName(name) {
        return /^(?!melvor)[\w]+$/.test(name);
    }
}
class NamespacedObject {
    constructor(_namespace, localID) {
        this._namespace = _namespace;
        try {
            if (!NamespacedObject.isValidLocalID(localID))
                throw new Error(`Local ID "${localID}" is invalid.`);
            this._localID = localID;
        } catch (e) {
            throw new DataConstructionError(NamespacedObject.name, e);
        }
        this.uid = NamespacedObject._instanceCount;
        NamespacedObject._instanceCount++;
    }
    /** Readonly namespace of object */
    get namespace() {
        return this._namespace.name;
    }
    /** Readonly namespace of object */
    get namespaceDisplayName() {
        return this._namespace.displayName;
    }
    /** Readonly global id of the object */
    get id() {
        return `${this._namespace.name}:${this._localID}`;
    }
    /** Readonly id of object within its namepsace */
    get localID() {
        return this._localID;
    }
    /** Readonly. If the object is from a mod. */
    get isModded() {
        return this._namespace.isModded;
    }
    getMediaURL(media) {
        if (this._namespace.isModded) {
            try {
                return mod.getContext(this._namespace.name).getResourceUrl(media);
            } catch (e) {
                console.error(e);
                return assets.getURI("assets/media/main/missing_artwork.png" /* Assets.Missing */ );
            }
        } else {
            return assets.getURI(media);
        }
    }
    getPixiAssetURL(media) {
        if (this._namespace.isModded) {
            try {
                if (this.isAssetURLExternal(media)) {
                    return mod.getContext(this._namespace.name).getResourceUrl(media);
                } else {
                    return `modAsset:${media}`;
                }
            } catch (e) {
                console.error(e);
                return assets.getURI("assets/media/main/missing_artwork.png" /* Assets.Missing */ );
            }
        } else {
            return assets.getURI(media);
        }
    }
    /** If the URL to a PIXI.js texture should be resolved as a Blob */
    isAssetURLExternal(path) {
        return this.isModded && (path.startsWith('melvor:') || path.startsWith('http:') || path.startsWith('https:'));
    }
    static isValidLocalID(localID) {
        return /^[\w]+$/.test(localID);
    }
}
NamespacedObject._instanceCount = 0;
class NamespaceRegistry {
    constructor(rootNamespaceMap, className) {
        this.rootNamespaceMap = rootNamespaceMap;
        this.className = className;
        /** Map of namespace: id: object */
        this.namespaceMaps = new Map();
        this.registeredObjects = new Map();
        this.dummyObjects = new Map();
        /** A map of the old namespace, to a map of ids to the new namespace */
        this.namespaceChanges = new Map();
    }
    /** Returns the number of objects registered */
    get size() {
        return this.registeredObjects.size;
    }
    get dummySize() {
        return this.dummyObjects.size;
    }
    /** Returns an array of all objects which have been registered */
    get allObjects() {
        return [...this.registeredObjects.values()];
    }
    get firstObject() {
        const [first] = this.registeredObjects.values();
        return first;
    }
    registerObject(object) {
        if (!this.rootNamespaceMap.hasNamespace(object.namespace))
            throw new Error(`Tried to register object with namespace: ${object.namespace}, but namespace does not exist.`);
        let nameMap = this.namespaceMaps.get(object.namespace);
        if (nameMap === undefined) {
            nameMap = new Map();
            this.namespaceMaps.set(object.namespace, nameMap);
        }
        if (nameMap.has(object.localID))
            throw new Error(`Tried to register object with id: ${object.localID} and namespace: ${object.namespace}, but object with that id is already registered.`);
        nameMap.set(object.localID, object);
        this.registeredObjects.set(`${object.namespace}:${object.localID}`, object);
    }
    registerNamespaceChange(oldNamespace, data) {
        var _a;
        const changes = (_a = this.namespaceChanges.get(oldNamespace.name)) !== null && _a !== void 0 ? _a : new Map();
        data.forEach((data) => {
            data.ids.forEach((id) => {
                changes.set(id, data.newNamespace);
            });
        });
        this.namespaceChanges.set(oldNamespace.name, changes);
    }
    /** Gets an object with the specified namespace and id. Returns undefined if no object is registered. */
    getObject(namespace, id) {
        var _a;
        return (_a = this.namespaceMaps.get(namespace)) === null || _a === void 0 ? void 0 : _a.get(id);
    }
    /** Gets an object with a quick id: `${namespace}:${id}` */
    getObjectByID(id) {
        return this.registeredObjects.get(id);
    }
    /** Gets an object by id, throwing an error if it is not registered */
    getObjectSafe(id) {
        const obj = this.registeredObjects.get(id);
        if (obj === undefined)
            throw new UnregisteredObjectError(this.className, id);
        return obj;
    }
    /** Gets a dummy object for the given id. Requires a DummyObject constructor which returns a new dummy object in the event it is unregistered. */
    getDummyObject(id, DummyObject, game) {
        var _a;
        let dummyObject = this.dummyObjects.get(id);
        if (dummyObject === undefined) {
            const dummyData = game.getDummyData(id);
            const newNamespace = (_a = this.namespaceChanges.get(dummyData.dataNamespace.name)) === null || _a === void 0 ? void 0 : _a.get(dummyData.localID);
            const newObject = this.getObjectByID(`${newNamespace}:${dummyData.localID}`);
            if (newObject !== undefined)
                return newObject;
            dummyObject = new DummyObject(dummyData.dataNamespace, dummyData.localID, game);
            this.dummyObjects.set(id, dummyObject);
        }
        return dummyObject;
    }
    forEach(callbackfn) {
        this.registeredObjects.forEach(callbackfn);
    }
    forEachDummy(callbackfn) {
        this.dummyObjects.forEach(callbackfn);
    }
    /** Searches for the first object which matches predicate. If none found, returns undefined */
    find(predicate) {
        for (const [id, value] of this.registeredObjects) {
            if (predicate(value, id, this.registeredObjects))
                return value;
        }
        return undefined;
    }
    /** Returns an array of objects that meet the condition specified by predicate */
    filter(predicate) {
        const results = [];
        this.forEach((value, key, map) => {
            if (predicate(value, key, map)) {
                results.push(value);
            }
        });
        return results;
    }
    every(predicate) {
        for (const [id, value] of this.registeredObjects) {
            if (predicate(value, id, this.registeredObjects))
                continue;
            return false;
        }
        return true;
    }
    /** Executes the provided callback function once per each registered object in the given namespace. Supports Completion namepsaces (e.g. True and BaseGame). */
    forEachInNamespace(namespace, callbackfn) {
        switch (namespace) {
            case "melvorTrue" /* Namespaces.True */ :
                this.forEach(callbackfn);
                break;
            case "melvorBaseGame" /* Namespaces.BaseGame */ :
                this.forEachInNamespace("melvorD" /* Namespaces.Demo */ , callbackfn) && this.forEachInNamespace("melvorF" /* Namespaces.Full */ , callbackfn);
                break;
            default:
                {
                    const namespaceMap = this.namespaceMaps.get(namespace);
                    if (namespaceMap === undefined)
                        return true;
                    for (const [id, value] of namespaceMap) {
                        callbackfn(value, id);
                    }
                }
                break;
        }
    }
    /** Returns true if every object registered to namespace matches predicate. Supports Completion namepsaces (e.g. True and BaseGame). If the namespace has nothing registered, returns true. */
    everyInNamespace(namespace, predicate) {
        switch (namespace) {
            case "melvorTrue" /* Namespaces.True */ :
                return this.every(predicate);
            case "melvorBaseGame" /* Namespaces.BaseGame */ :
                return this.everyInNamespace("melvorD" /* Namespaces.Demo */ , predicate) && this.everyInNamespace("melvorF" /* Namespaces.Full */ , predicate);
            default:
                {
                    const namespaceMap = this.namespaceMaps.get(namespace);
                    if (namespaceMap === undefined)
                        return true;
                    for (const [id, value] of namespaceMap) {
                        if (predicate(value, id))
                            continue;
                        return false;
                    }
                }
                break;
        }
        return true;
    }
    some(predicate) {
        for (const [id, value] of this.registeredObjects) {
            if (predicate(value, id, this.registeredObjects))
                return true;
        }
        return false;
    }
    /** Returns true if any object registered to the namespace matched predicate. Supports Completion namespaces (e.g. True and BaseGame). If the namespace has nothing registered, returns false. */
    someInNamespace(namespace, predicate) {
        switch (namespace) {
            case "melvorTrue" /* Namespaces.True */ :
                return this.some(predicate);
            case "melvorBaseGame" /* Namespaces.BaseGame */ :
                return this.someInNamespace("melvorD" /* Namespaces.Demo */ , predicate) || this.someInNamespace("melvorF" /* Namespaces.Full */ , predicate);
            default:
                {
                    const namespaceMap = this.namespaceMaps.get(namespace);
                    if (namespaceMap === undefined)
                        return false;
                    for (const [id, value] of namespaceMap) {
                        if (predicate(value, id))
                            return true;
                    }
                }
        }
        return false;
    }
    reduce(callbackfn, initialValue) {
        for (const [id, value] of this.registeredObjects) {
            initialValue = callbackfn(initialValue, value, id, this.registeredObjects);
        }
        return initialValue;
    }
    /** Gets an array of objects from ids. Useful for constructing data classes. */
    getArrayFromIds(ids) {
        return ids.map((id) => this.getObjectSafe(id));
    }
    /** Gets a set of objects from ids. Useful fro constructing data classes. */
    getSetFromIds(ids) {
        return new Set(this.getArrayFromIds(ids));
    }
    getQuantity(quantity) {
        return {
            item: this.getObjectSafe(quantity.id),
            quantity: quantity.quantity,
        };
    }
    getQuantities(quantities) {
        return quantities.map((quantity) => this.getQuantity(quantity));
    }
    /** Applies data modifications to the item quantity array provided */
    modifyQuantities(quantities, data) {
        if (data.remove !== undefined) {
            const removals = data.remove;
            quantities = quantities.filter(({
                item
            }) => !removals.includes(item.id));
        }
        if (data.add !== undefined) {
            quantities.push(...this.getQuantities(data.add));
        }
        return quantities;
    }
    /** Returns if a namespace has registered an object */
    hasObjectInNamespace(namespace) {
        return this.namespaceMaps.has(namespace);
    }
}
class ItemRegistry extends NamespaceRegistry {
    constructor(rootNamespaceMap) {
        super(rootNamespaceMap, Item.name);
        this.equipment = new NamespaceRegistry(this.rootNamespaceMap, EquipmentItem.name);
        this.weapons = new NamespaceRegistry(this.rootNamespaceMap, WeaponItem.name);
        this.food = new NamespaceRegistry(this.rootNamespaceMap, FoodItem.name);
        this.bones = new NamespaceRegistry(this.rootNamespaceMap, BoneItem.name);
        this.potions = new NamespaceRegistry(this.rootNamespaceMap, PotionItem.name);
        this.readables = new NamespaceRegistry(this.rootNamespaceMap, ReadableItem.name);
        this.openables = new NamespaceRegistry(this.rootNamespaceMap, OpenableItem.name);
        this.tokens = new NamespaceRegistry(this.rootNamespaceMap, TokenItem.name);
        this.masteryTokens = new NamespaceRegistry(this.rootNamespaceMap, MasteryTokenItem.name);
        this.composts = new NamespaceRegistry(this.rootNamespaceMap, CompostItem.name);
        this.souls = new NamespaceRegistry(this.rootNamespaceMap, SoulItem.name);
        this.runes = new NamespaceRegistry(this.rootNamespaceMap, RuneItem.name);
        this.firemakingOils = new NamespaceRegistry(this.rootNamespaceMap, FiremakingOilItem.name);
    }
    registerObject(object) {
        super.registerObject(object);
        if (object instanceof WeaponItem) {
            this.weapons.registerObject(object);
        }
        if (object instanceof EquipmentItem) {
            this.equipment.registerObject(object);
        }
        if (object instanceof FoodItem) {
            this.food.registerObject(object);
        }
        if (object instanceof BoneItem) {
            this.bones.registerObject(object);
        }
        if (object instanceof PotionItem) {
            this.potions.registerObject(object);
        }
        if (object instanceof ReadableItem) {
            this.readables.registerObject(object);
        }
        if (object instanceof OpenableItem) {
            this.openables.registerObject(object);
        }
        if (object instanceof TokenItem) {
            this.tokens.registerObject(object);
        }
        if (object instanceof MasteryTokenItem) {
            this.masteryTokens.registerObject(object);
        }
        if (object instanceof CompostItem) {
            this.composts.registerObject(object);
        }
        if (object instanceof SoulItem) {
            this.souls.registerObject(object);
        }
        if (object instanceof RuneItem) {
            this.runes.registerObject(object);
        }
        if (object instanceof FiremakingOilItem) {
            this.firemakingOils.registerObject(object);
        }
    }
    registerNamespaceChange(oldNamespace, data) {
        super.registerNamespaceChange(oldNamespace, data);
        data.forEach((data) => {
            switch (data.itemType) {
                case 'Weapon':
                    this.weapons.registerNamespaceChange(oldNamespace, [data]);
                    // fallthrough
                case 'Equipment':
                    this.equipment.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Food':
                    this.food.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Bone':
                    this.bones.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Potion':
                    this.potions.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Readable':
                    this.readables.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Openable':
                    this.openables.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Token':
                    this.tokens.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Compost':
                    this.composts.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Soul':
                    this.souls.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'Rune':
                    this.runes.registerNamespaceChange(oldNamespace, [data]);
                    break;
                case 'FiremakingOil':
                    this.firemakingOils.registerNamespaceChange(oldNamespace, [data]);
                    break;
            }
        });
    }
}
class CombatAreaRegistry extends NamespaceRegistry {
    constructor() {
        super(...arguments);
        this.slayer = new NamespaceRegistry(this.rootNamespaceMap, SlayerArea.name);
        this.dungeons = new NamespaceRegistry(this.rootNamespaceMap, Dungeon.name);
        this.strongholds = new NamespaceRegistry(this.rootNamespaceMap, Stronghold.name);
        this.abyssDepths = new NamespaceRegistry(this.rootNamespaceMap, AbyssDepth.name);
    }
    registerObject(object) {
        super.registerObject(object);
        if (object instanceof SlayerArea) {
            this.slayer.registerObject(object);
        }
        if (object instanceof AbyssDepth) {
            this.abyssDepths.registerObject(object);
        } else if (object instanceof Dungeon) {
            this.dungeons.registerObject(object);
        }
        if (object instanceof Stronghold) {
            this.strongholds.registerObject(object);
        }
    }
}
class NamespacedArray extends Array {
    constructor(registery, ...items) {
        super(...items);
        this.registery = registery;
    }
    /**
     * Registers new objects to this array in the order specified
     * @param insertions The new objects to insert
     * @returns An array of all new objects inserted
     */
    registerData(insertions) {
        const inserted = [];
        insertions.forEach((order) => {
            const objectsToInsert = order.ids.map((id) => {
                return this.registery.getObjectSafe(id);
            });
            inserted.push(...objectsToInsert);
            switch (order.insertAt) {
                case 'Start':
                    this.splice(0, 0, ...objectsToInsert);
                    break;
                case 'End':
                    this.push(...objectsToInsert);
                    break;
                case 'Before':
                    {
                        const beforeItem = this.registery.getObjectSafe(order.beforeID);
                        const beforeIndex = this.findIndex((item) => item === beforeItem);
                        if (beforeIndex === -1)
                            throw new Error(`Error inserting before. Object with id: ${order.beforeID} is not in array.`);
                        this.splice(beforeIndex, 0, ...objectsToInsert);
                    }
                    break;
                case 'After':
                    {
                        const afterItem = this.registery.getObjectSafe(order.afterID);
                        const afterIndex = this.findIndex((item) => item === afterItem);
                        if (afterIndex === -1)
                            throw new Error(`Error inserting after. Object with id: ${order.afterID} is not in array.`);
                        this.splice(afterIndex + 1, 0, ...objectsToInsert);
                    }
                    break;
            }
        });
        return inserted;
    }
}
class UnregisteredObjectError extends Error {
    get name() {
        return UnregisteredObjectError.name;
    }
    constructor(className, id) {
        super(`${className} with id: "${id}" is not registered.`);
    }
}
//# sourceMappingURL=namespaceRegistry.js.map
checkFileVersion('?12097')