"use strict";
/** Generic class for tracking statistics */
class StatTracker {
    constructor() {
        this.stats = new Map();
        this.wasMutated = false;
    }
    add(stat, qty) {
        var _a;
        this.stats.set(stat, ((_a = this.stats.get(stat)) !== null && _a !== void 0 ? _a : 0) + qty);
        this.wasMutated = true;
    }
    set(stat, value) {
        if (value !== 0) {
            this.stats.set(stat, value);
        } else {
            this.remove(stat);
        }
        this.wasMutated = true;
    }
    /** Increments a stat by 1 */
    inc(stat) {
        this.add(stat, 1);
    }
    get(stat) {
        var _a;
        return (_a = this.stats.get(stat)) !== null && _a !== void 0 ? _a : 0;
    }
    /** Gets the sum of a number of stats */
    getSum(stats) {
        return stats.reduce((sum, stat) => {
            return this.get(stat) + sum;
        }, 0);
    }
    remove(stat) {
        this.stats.delete(stat);
        this.wasMutated = true;
    }
    /** Gets a stat and then removes it */
    convert(stat) {
        const value = this.stats.get(stat);
        if (value !== undefined) {
            this.stats.delete(stat);
            return value;
        }
        return 0;
    }
    encode(writer) {
        writer.writeMap(this.stats, (key, writer) => writer.writeUint32(key), (key, writer) => writer.writeFloat64(key));
        return writer;
    }
    decode(reader, version) {
        this.stats = reader.getMap((reader) => reader.getUint32(), (reader) => reader.getFloat64());
    }
    deserialize(reader, version) {
        this.stats.clear();
        for (let i = 0; i < reader.dataLength; i += 2) {
            this.stats.set(reader.getNumber(), reader.getNumber());
        }
    }
    convertFromOldStatArray(oldStats) {
        oldStats.forEach((stat, statID) => {
            if (stat.count !== 0)
                this.add(statID, stat.count);
        });
    }
    static dumpData(reader, version) {
        reader.skipMap((reader) => reader.skipBytes(4), (reader) => reader.skipBytes(8));
    }
}
/** Generic class for tracking stats for registries */
class MappedStatTracker {
    constructor(registry, game, dummyConstructor) {
        this.registry = registry;
        this.game = game;
        this.dummyConstructor = dummyConstructor;
        this.statsMap = new Map();
    }
    add(key, statID, qty) {
        let tracker = this.statsMap.get(key);
        if (tracker === undefined) {
            tracker = new StatTracker();
            this.statsMap.set(key, tracker);
        }
        tracker.add(statID, qty);
    }
    get(key, statID) {
        const tracker = this.statsMap.get(key);
        if (tracker === undefined) {
            return 0;
        }
        return tracker.get(statID);
    }
    getTracker(key) {
        return this.statsMap.get(key) || new StatTracker();
    }
    encode(writer) {
        writer.writeMap(this.statsMap, writeNamespaced, (tracker, writer) => {
            tracker.encode(writer);
        });
        return writer;
    }
    decode(reader, version) {
        this.statsMap = reader.getMap((reader) => {
            const object = reader.getNamespacedObject(this.registry);
            if (typeof object === 'string') {
                if (object.startsWith('melvor') && this.dummyConstructor !== undefined)
                    return this.registry.getDummyObject(object, this.dummyConstructor, this.game);
                else
                    return undefined;
            }
            return object;
        }, (reader) => {
            const tracker = new StatTracker();
            tracker.decode(reader, version);
            return tracker;
        });
    }
    deserialize(reader, version, idMap) {
        this.statsMap.clear();
        const numIds = reader.getNumber();
        for (let i = 0; i < numIds; i++) {
            const id = reader.getNumber();
            const trackerData = reader.getVariableLengthChunk();
            const newID = idMap[id];
            if (newID !== undefined) {
                let key = this.registry.getObjectByID(newID);
                if (key === undefined && this.dummyConstructor !== undefined)
                    key = this.registry.getDummyObject(idMap[id], this.dummyConstructor, this.game);
                if (key !== undefined) {
                    const tracker = new StatTracker();
                    tracker.deserialize(trackerData, version);
                    this.statsMap.set(key, tracker);
                }
            }
        }
    }
    static dumpData(reader, version) {
        reader.skipMap((reader) => reader.skipBytes(2), (reader) => StatTracker.dumpData(reader, version));
    }
}
class CurrencyStatTracker extends StatTracker {
    constructor(game) {
        super();
        this.skill = new MappedStatTracker(game.skills, game);
    }
    encode(writer) {
        super.encode(writer);
        this.skill.encode(writer);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.skill.decode(reader, version);
    }
    static dumpData(reader, version) {
        super.dumpData(reader, version);
        MappedStatTracker.dumpData(reader, version);
    }
}
//# sourceMappingURL=statTracker.js.map
checkFileVersion('?12097')