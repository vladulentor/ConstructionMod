"use strict";
class BinaryWriter {
    constructor(mode, dataExtensionLength, initialSize = dataExtensionLength) {
        this.mode = mode;
        this.dataExtensionLength = dataExtensionLength;
        this.stringEncoder = new TextEncoder();
        this.stringDecoder = new TextDecoder();
        /** Current byte position in ArrayBuffer */
        this.byteOffset = 0;
        /** Current regions mark offset */
        this.markRegionOffset = -1;
        this._data = new ArrayBuffer(initialSize);
        this.dataView = new DataView(this._data);
        this.uint8View = new Uint8Array(this._data);
    }
    set data(newData) {
        this._data = newData;
        this.dataView = new DataView(newData);
        this.uint8View = new Uint8Array(newData);
    }
    get data() {
        return this._data;
    }
    /** Returns the number of bytes remaining in the data buffer */
    get remainingBytes() {
        return this._data.byteLength - this.byteOffset;
    }
    /** Returns the number of bytes in the ArrayBuffer of the writer */
    get dataSize() {
        return this._data.byteLength;
    }
    /** Checks if the current buffer can fit the specified number of bytes
     *  If it cannot, extends the buffer by the dataExtensionLength until it can
     */
    checkDataSize(bytes) {
        if (this.remainingBytes < bytes) {
            const extensionsRequired = Math.ceil((this.byteOffset + bytes) / this.dataExtensionLength) -
                this._data.byteLength / this.dataExtensionLength;
            const newBuffer = new ArrayBuffer(this._data.byteLength + extensionsRequired * this.dataExtensionLength);
            new Uint8Array(newBuffer).set(new Uint8Array(this._data));
            this.data = newBuffer;
        }
    }
    checkWriteAccess() {
        if (this.mode !== 'Write')
            throw new Error('Writer is set to read only.');
    }
    checkReadAccess() {
        if (this.mode !== 'Read')
            throw new Error('Writer is set to write only.');
    }
    /** Adds a Uint32 marker for a region of encoded data */
    startMarkingWriteRegion() {
        this.checkWriteAccess();
        if (this.markRegionOffset !== -1)
            throw new Error(`Region is already being marked.`);
        this.markRegionOffset = this.byteOffset;
        this.writeUint32(0);
    }
    /** Stops marking a region of encoded data */
    stopMarkingWriteRegion() {
        this.checkWriteAccess();
        const regionSize = this.byteOffset - this.markRegionOffset - Uint32Array.BYTES_PER_ELEMENT;
        this.dataView.setUint32(this.markRegionOffset, regionSize);
        this.markRegionOffset = -1;
    }
    /** Gets a signed 64-bit BigInteger */
    getBigInt64() {
        this.checkReadAccess();
        const int = this.dataView.getBigInt64(this.byteOffset);
        this.byteOffset += BigInt64Array.BYTES_PER_ELEMENT;
        return int;
    }
    /** Gets an unsigned 64-bit BigInteger */
    getBigUint64() {
        this.checkReadAccess();
        const int = this.dataView.getBigUint64(this.byteOffset);
        this.byteOffset += BigUint64Array.BYTES_PER_ELEMENT;
        return int;
    }
    /** Gets a 32-bit Float */
    getFloat32() {
        this.checkReadAccess();
        const value = this.dataView.getFloat32(this.byteOffset);
        this.byteOffset += Float32Array.BYTES_PER_ELEMENT;
        return value;
    }
    /** Gets a 64-bit Float */
    getFloat64() {
        this.checkReadAccess();
        const value = this.dataView.getFloat64(this.byteOffset);
        this.byteOffset += Float64Array.BYTES_PER_ELEMENT;
        return value;
    }
    /** Gets a signed 8-bit integer [-128, 127] */
    getInt8() {
        this.checkReadAccess();
        const value = this.dataView.getInt8(this.byteOffset);
        this.byteOffset += Int8Array.BYTES_PER_ELEMENT;
        return value;
    }
    /** Gets a signed 16-bit integer [-32,768, 32,767] */
    getInt16() {
        this.checkReadAccess();
        const value = this.dataView.getInt16(this.byteOffset);
        this.byteOffset += Int16Array.BYTES_PER_ELEMENT;
        return value;
    }
    /** Gets a signed 32-bit integer [-2,147,483,648, 2,147,483,647] */
    getInt32() {
        this.checkReadAccess();
        const value = this.dataView.getInt32(this.byteOffset);
        this.byteOffset += Int32Array.BYTES_PER_ELEMENT;
        return value;
    }
    /** Gets an unsigned 8-bit integer [0, 255] */
    getUint8() {
        this.checkReadAccess();
        const value = this.dataView.getUint8(this.byteOffset);
        this.byteOffset += Uint8Array.BYTES_PER_ELEMENT;
        return value;
    }
    /** Gets an unsigned 16-bit integer [0, 65,535] */
    getUint16() {
        this.checkReadAccess();
        const value = this.dataView.getUint16(this.byteOffset);
        this.byteOffset += Uint16Array.BYTES_PER_ELEMENT;
        return value;
    }
    /** Gets an unsigned 32-bit integer [0, 4,294,967,295] */
    getUint32() {
        this.checkReadAccess();
        const value = this.dataView.getUint32(this.byteOffset);
        this.byteOffset += Uint32Array.BYTES_PER_ELEMENT;
        return value;
    }
    /** Gets a string. Max length 4,294,967,295 bytes */
    getString() {
        this.checkReadAccess();
        const stringLength = this.getUint32();
        const encodedString = this.uint8View.slice(this.byteOffset, this.byteOffset + stringLength);
        const string = this.stringDecoder.decode(encodedString);
        this.byteOffset += stringLength;
        return string;
    }
    /** Gets a boolean value */
    getBoolean() {
        this.checkReadAccess();
        return this.getUint8() === 1;
    }
    /**
     * Gets an array of arbitrary type. If decoding method returns undefined, element is ommited from array.
     * @param decodeArray Function that performs read operations per array element
     * @returns The decoded array
     */
    getArray(decodeArray) {
        this.checkReadAccess();
        const arrayLength = this.getUint32();
        const array = [];
        for (let i = 0; i < arrayLength; i++) {
            const newElement = decodeArray(this);
            if (newElement !== undefined)
                array.push(newElement);
        }
        return array;
    }
    /**
     * Gets a map of arbitrary key and value type. If key or value functions return undefined, value is not added.
     * @param decodeKey Function that performs read operations to obtain a map key
     * @param decodeValue Function that performs read operations to obtain a map value
     * @returns The decoded map
     */
    getMap(decodeKey, decodeValue) {
        this.checkReadAccess();
        const map = new Map();
        const mapSize = this.getUint32();
        for (let i = 0; i < mapSize; i++) {
            const key = decodeKey(this);
            const value = decodeValue(this, key);
            if (key !== undefined && value !== undefined)
                map.set(key, value);
        }
        return map;
    }
    /**
     * Skips data that was written using the writeMap method.
     * @param skipKey Function that skips bytes for the decodeKey function
     * @param skipValue Function that skips bytes for the decodeValue function
     */
    skipMap(skipKey, skipValue) {
        this.checkReadAccess();
        const mapSize = this.getUint32();
        for (let i = 0; i < mapSize; i++) {
            skipKey(this);
            skipValue(this);
        }
    }
    /**
     * Gets a map with a key and value type that require eachother to decode. If decode returns undefined, value is ommited.
     * @param decode Function that performs read operations to obtain both the key and value
     * @returns The decoded map
     */
    getComplexMap(decode) {
        this.checkReadAccess();
        const map = new Map();
        const mapSize = this.getUint32();
        for (let i = 0; i < mapSize; i++) {
            const keyValuePair = decode(this);
            if (keyValuePair !== undefined)
                map.set(keyValuePair.key, keyValuePair.value);
        }
        return map;
    }
    /**
     * Skips data that was written using the writeComplexMap method.
     * @param skip Function that skips the bytes for the decode function
     */
    skipComplexMap(skip) {
        this.checkReadAccess();
        const mapSize = this.getUint32();
        for (let i = 0; i < mapSize; i++) {
            skip(this);
        }
    }
    /**
     * Gets a SparseNumericMap with the specified key type
     * @param decodeKey Function that performs read operations to obtain a map key. Returning undefined will skip the value in the map
     */
    getSparseNumericMap(decodeKey) {
        this.checkReadAccess();
        const map = new SparseNumericMap();
        const mapSize = this.getUint32();
        for (let i = 0; i < mapSize; i++) {
            const key = decodeKey(this);
            const value = this.getFloat64();
            if (key !== undefined)
                map.set(key, value);
        }
        return map;
    }
    /**
     * Skips data that was written using the writeSpareNumericMap method
     * @param skipKey Funciton that skips the bytes for the decodeKey function
     */
    skipSparseNumericMap(skipKey) {
        this.checkReadAccess();
        const mapSize = this.getUint32();
        for (let i = 0; i < mapSize; i++) {
            skipKey(this);
            this.skipBytes(Float64Array.BYTES_PER_ELEMENT);
        }
    }
    /**
     * Gets a set of arbitrary value type. If value method returns undefined, value is not added.
     * @param decodeValue Function that performs read operations to obtain a set value
     * @returns The decoded set
     */
    getSet(decodeValue) {
        this.checkReadAccess();
        const set = new Set();
        const setSize = this.getUint32();
        for (let i = 0; i < setSize; i++) {
            const newValue = decodeValue(this);
            if (newValue !== undefined)
                set.add(newValue);
        }
        return set;
    }
    /** Gets an ArrayBuffer */
    getBuffer() {
        this.checkReadAccess();
        const bufferByteLength = this.getUint32();
        const buffer = this._data.slice(this.byteOffset, this.byteOffset + bufferByteLength);
        this.byteOffset += bufferByteLength;
        return buffer;
    }
    /** Gets a buffer of a fixed length */
    getFixedLengthBuffer(length) {
        this.checkReadAccess();
        const buffer = this._data.slice(this.byteOffset, this.byteOffset + length);
        this.byteOffset += length;
        return buffer;
    }
    /**
     * Gets a LinkQueue of arbitrary type
     * @param decodeValue Decodes a single value in the queue. If it returns undefined, no value is added to the queue
     * @returns The decoded LinkQueue
     */
    getLinkQueue(decodeValue) {
        this.checkReadAccess();
        const queue = new LinkQueue();
        const queueSize = this.getUint32();
        for (let i = 0; i < queueSize; i++) {
            const newValue = decodeValue(this);
            if (newValue !== undefined)
                queue.queue(newValue);
        }
        return queue;
    }
    /** Tells the reader to skip ahead by length bytes */
    skipBytes(length) {
        this.checkReadAccess();
        this.byteOffset += length;
    }
    /** Tells the reader to skip ahead as if an array with elements that encoded elementByteLength bytes each */
    skipArrayBytes(elementByteLength) {
        this.checkReadAccess();
        const arrayLength = this.getUint32();
        this.byteOffset += arrayLength * elementByteLength;
    }
    /** Writes a bigint as a signed 64-bit integer */
    writeBigInt64(value) {
        this.checkWriteAccess();
        this.checkDataSize(BigInt64Array.BYTES_PER_ELEMENT);
        this.dataView.setBigInt64(this.byteOffset, value);
        this.byteOffset += BigInt64Array.BYTES_PER_ELEMENT;
    }
    /** Writes a bigint as an unsigned 64-bit integer */
    writeBigUInt64(value) {
        this.checkWriteAccess();
        this.checkDataSize(BigUint64Array.BYTES_PER_ELEMENT);
        this.dataView.setBigUint64(this.byteOffset, value);
        this.byteOffset += BigUint64Array.BYTES_PER_ELEMENT;
    }
    /** Writes a number as a 32-bit float */
    writeFloat32(value) {
        this.checkWriteAccess();
        this.checkDataSize(Float32Array.BYTES_PER_ELEMENT);
        this.dataView.setFloat32(this.byteOffset, value);
        this.byteOffset += Float32Array.BYTES_PER_ELEMENT;
    }
    /** Writes a number as a 64-bit float */
    writeFloat64(value) {
        this.checkWriteAccess();
        this.checkDataSize(Float64Array.BYTES_PER_ELEMENT);
        this.dataView.setFloat64(this.byteOffset, value);
        this.byteOffset += Float64Array.BYTES_PER_ELEMENT;
    }
    /** Writes a number as a signed 8-bit integer [-128, 127] */
    writeInt8(value) {
        this.checkWriteAccess();
        this.checkDataSize(Int8Array.BYTES_PER_ELEMENT);
        this.dataView.setInt8(this.byteOffset, value);
        this.byteOffset += Int8Array.BYTES_PER_ELEMENT;
    }
    /** Writes a number as a signed 16-bit integer [-32,768, 32,767] */
    writeInt16(value) {
        this.checkWriteAccess();
        this.checkDataSize(Int16Array.BYTES_PER_ELEMENT);
        this.dataView.setInt16(this.byteOffset, value);
        this.byteOffset += Int16Array.BYTES_PER_ELEMENT;
    }
    /** Writes a number as a signed 32-bit integer [-2,147,483,648, 2,147,483,647] */
    writeInt32(value) {
        this.checkWriteAccess();
        this.checkDataSize(Int32Array.BYTES_PER_ELEMENT);
        this.dataView.setInt32(this.byteOffset, value);
        this.byteOffset += Int32Array.BYTES_PER_ELEMENT;
    }
    /** Writes a number as an unsigned 8-bit integer [0, 255] */
    writeUint8(value) {
        this.checkWriteAccess();
        this.checkDataSize(Uint8Array.BYTES_PER_ELEMENT);
        this.dataView.setUint8(this.byteOffset, value);
        this.byteOffset += Uint8Array.BYTES_PER_ELEMENT;
    }
    /** Writes a number as an unsigned 16-bit integer [0, 65,535] */
    writeUint16(value) {
        this.checkWriteAccess();
        this.checkDataSize(Uint16Array.BYTES_PER_ELEMENT);
        this.dataView.setUint16(this.byteOffset, value);
        this.byteOffset += Uint16Array.BYTES_PER_ELEMENT;
    }
    /** Writes a number as an unsigned 32-bit integer [0, 4,294,967,295] */
    writeUint32(value) {
        this.checkWriteAccess();
        this.checkDataSize(Uint32Array.BYTES_PER_ELEMENT);
        this.dataView.setUint32(this.byteOffset, value);
        this.byteOffset += Uint32Array.BYTES_PER_ELEMENT;
    }
    /** Writes a string. Max length 4,294,967,295 bytes */
    writeString(value) {
        this.checkWriteAccess();
        const encodedString = this.stringEncoder.encode(value);
        if (encodedString.byteLength > BinaryWriter.Uint32Max) {
            throw new Error(`Tried to write string but length exceeds: ${BinaryWriter.Uint32Max}`);
        }
        this.writeUint32(encodedString.byteLength);
        this.checkDataSize(encodedString.byteLength);
        this.uint8View.set(encodedString, this.byteOffset);
        this.byteOffset += encodedString.byteLength;
    }
    /** Writes a boolean value */
    writeBoolean(value) {
        this.checkWriteAccess();
        this.writeUint8(value ? 1 : 0);
    }
    /**
     * Writes an array of arbitrary type to the buffer
     * @param array The array to write
     * @param encodeArray Function that performs write operations per array element
     */
    writeArray(array, encodeArray) {
        this.checkWriteAccess();
        if (array.length > BinaryWriter.Uint32Max) {
            throw new Error(`Tried to write array but length exceeds: ${BinaryWriter.Uint32Max}`);
        }
        this.writeUint32(array.length);
        array.forEach((value) => encodeArray(value, this));
    }
    /**
     * Writes a map of arbitrary key and value type to the buffer
     * @param map The map to write
     * @param encodeKey Function that performs write operations per map key
     * @param encodeValue Function that performs write operations per map value
     */
    writeMap(map, encodeKey, encodeValue) {
        this.checkWriteAccess();
        if (map.size > BinaryWriter.Uint32Max) {
            throw new Error(`Tried to write map, but size exceeds: ${BinaryWriter.Uint32Max}`);
        }
        this.writeUint32(map.size);
        map.forEach((value, key) => {
            encodeKey(key, this, value);
            encodeValue(value, this, key);
        });
    }
    /**
     * Writes a map with key and values that require eachother for decoding to the buffer
     * @param map The map to write
     * @param encode Function that encodes both the key and value
     */
    writeComplexMap(map, encode) {
        this.checkWriteAccess();
        if (map.size > BinaryWriter.Uint32Max) {
            throw new Error(`Tried to write map, but size exceeds: ${BinaryWriter.Uint32Max}`);
        }
        this.writeUint32(map.size);
        map.forEach((value, key) => {
            encode(key, value, this);
        });
    }
    /**
     * Writes a sparse numeric map to the buffer. Numeric values will be written as float64
     * @param map The map to write
     * @param encodeKey Function that encodes the value of the map's keys
     */
    writeSparseNumericMap(map, encodeKey) {
        this.checkWriteAccess();
        if (map.size > BinaryWriter.Uint32Max) {
            throw new Error(`Tried to write SparseNumericMap, but size exceeds: ${BinaryWriter.Uint32Max}`);
        }
        this.writeInt32(map.size);
        map.forEach((value, key) => {
            encodeKey(key, this);
            this.writeFloat64(value);
        });
    }
    /**
     * Writes a set of arbitrary type to the buffer
     * @param set The set to write
     * @param encodeValue Function that performs write operations per set value
     */
    writeSet(set, encodeValue) {
        this.checkWriteAccess();
        if (set.size > BinaryWriter.Uint32Max) {
            throw new Error(`Tried to write set, but size exceeds: ${BinaryWriter.Uint32Max}`);
        }
        this.writeUint32(set.size);
        set.forEach((value) => {
            encodeValue(value, this);
        });
    }
    /**
     * Write a LinkQueue of arbitrary type to the buffer
     * @param queue The LinkQueue to write
     * @param encodeValue Function that encodes each value in the queue to the buffer
     */
    writeLinkQueue(queue, encodeValue) {
        this.checkWriteAccess();
        const sizeOffset = this.byteOffset;
        this.writeUint32(0);
        let size = 0;
        queue.forEachForward((obj) => {
            encodeValue(obj, this);
            size++;
        });
        if (size > BinaryWriter.Uint32Max)
            throw new Error(`Tried to write LinkQueue but size exceeds ${BinaryWriter.Uint32Max}`);
        this.dataView.setUint32(sizeOffset, size);
    }
    /** Writes an array buffer to the buffer */
    writeBuffer(buffer) {
        this.checkWriteAccess();
        if (buffer.byteLength > BinaryWriter.Uint32Max) {
            throw new Error(`Tried to write buffer, but byteLength exceeds: ${BinaryWriter.Uint32Max}`);
        }
        this.writeUint32(buffer.byteLength);
        this.checkDataSize(buffer.byteLength);
        this.uint8View.set(new Uint8Array(buffer), this.byteOffset);
        this.byteOffset += buffer.byteLength;
    }
    /** Writes a buffer of a fixed length */
    writeFixedLengthBuffer(buffer, length) {
        this.checkWriteAccess();
        if (buffer.byteLength !== length)
            throw new Error(`Tried to write fixed length buffer, but byteLength does not match specified`);
        this.checkDataSize(length);
        this.uint8View.set(new Uint8Array(buffer), this.byteOffset);
        this.byteOffset += length;
    }
    /** Returns the raw data, minus empty bytes */
    getRawData() {
        this.checkWriteAccess();
        return this._data.slice(0, this.byteOffset);
    }
    /** Sets the buffer to the supplied data */
    setRawData(data) {
        this.checkReadAccess();
        this.data = data;
    }
}
BinaryWriter.Uint32Max = 4294967295;
/** Specialized class for writing save files */
class SaveWriter extends BinaryWriter {
    constructor(mode, dataExtensionLength, initialBodySize = dataExtensionLength, initialHeaderSize = dataExtensionLength) {
        super(mode, dataExtensionLength, initialBodySize);
        this.namespaceMap = new Map();
        this.nextNumericID = 0;
        this.numericToStringIDMap = new Map();
        this.header = new BinaryWriter(mode, dataExtensionLength, initialHeaderSize);
    }
    get headerSize() {
        return this.header.dataSize;
    }
    writeNamespacedObject(object) {
        let nameMap = this.namespaceMap.get(object.namespace);
        if (nameMap === undefined) {
            nameMap = new Map();
            this.namespaceMap.set(object.namespace, nameMap);
        }
        let numericID = nameMap.get(object.localID);
        if (numericID === undefined) {
            numericID = this.nextNumericID;
            this.nextNumericID++;
            nameMap.set(object.localID, numericID);
        }
        this.writeUint16(numericID);
    }
    /** Gets the ID of a namespaced object written via writeNamespacedObject */
    getNamespacedObjectId() {
        const numericID = this.getUint16();
        const id = this.numericToStringIDMap.get(numericID);
        if (id === undefined)
            throw new Error('Error getting namespaced object, no namespaced id exists for numeric ID');
        return id;
    }
    /** Gets a namespaced object from a registry. If the object is not registered, returns the ID instead. */
    getNamespacedObject(registry) {
        const id = this.getNamespacedObjectId();
        const object = registry.getObjectByID(id);
        if (object === undefined)
            return id;
        return object;
    }
    /** @deprecated Used only for Save compatability. */
    getModifierValueFromKey(key, game) {
        const value = this.getFloat64();
        return ModifierValue.fromKeySafe(key, value, game);
    }
    /** @deprecated Used only for Save compatability. */
    getSkillModifierValuesFromKey(key, game) {
        return ModifierValue.fromSkillKeyValues(key, this.getArray((reader) => {
            const skill = reader.getNamespacedObject(game.skills);
            const value = reader.getFloat64();
            if (typeof skill === 'string')
                return undefined;
            return {
                skill,
                value,
            };
        }), game);
    }
    writeModifierValues(modifiers) {
        this.writeArray(modifiers, (modValue, writer) => {
            ModifierValue.encode(writer, modValue);
        });
    }
    getModifierValues(game, version) {
        if (version < 105 /* SaveVersion.ModifierRework */ ) {
            const values = [];
            const count = this.getUint32();
            for (let i = 0; i < count; i++) {
                const key = ModifierID[this.getUint16()];
                const isSkill = Modifier.OLD_SKILL_MODIFIER_KEYS.includes(key);
                if (isSkill) {
                    values.push(...this.getSkillModifierValuesFromKey(key, game));
                } else {
                    const modValue = this.getModifierValueFromKey(key, game);
                    if (modValue !== undefined)
                        values.push(modValue);
                }
            }
            return values;
        } else {
            return this.getArray((reader) => {
                return ModifierValue.decode(game, reader, version);
            });
        }
    }
    writeHeaderInfo(headerInfo) {
        this.header.writeUint32(headerInfo.saveVersion);
        this.header.writeString(headerInfo.characterName);
        this.header.writeString(headerInfo.currentGamemode.id);
        this.header.writeUint16(headerInfo.totalSkillLevel);
        this.header.writeFloat64(headerInfo.gp);
        this.header.writeBoolean(headerInfo.offlineAction !== undefined);
        if (headerInfo.offlineAction !== undefined) {
            this.header.writeString(headerInfo.offlineAction.id);
        }
        this.header.writeFloat64(headerInfo.tickTimestamp);
        this.header.writeFloat64(headerInfo.saveTimestamp);
        this.header.writeArray(headerInfo.activeNamespaces, (ns, writer) => writer.writeString(ns));
        this.header.writeBoolean(headerInfo.modProfile !== null);
        if (headerInfo.modProfile !== null) {
            this.header.writeString(headerInfo.modProfile.id);
            this.header.writeString(headerInfo.modProfile.name);
            this.header.writeArray(headerInfo.modProfile.mods, (mod, writer) => writer.writeUint32(mod));
        }
    }
    getHeaderFromSaveString(saveString, game) {
        const saveVersion = this.setDataFromSaveString(saveString);
        const characterName = this.header.getString();
        const gamemodeID = this.header.getString();
        let currentGamemode = game.gamemodes.getObjectByID(gamemodeID);
        if (currentGamemode === undefined) {
            currentGamemode = new DummyGamemode(game.getDummyData(gamemodeID), game);
        }
        const totalSkillLevel = this.header.getUint16();
        const gp = this.header.getFloat64();
        let offlineAction = undefined;
        if (this.header.getBoolean()) {
            const activeActionID = this.header.getString();
            offlineAction = game.activeActions.getObjectByID(activeActionID);
            if (offlineAction === undefined) {
                offlineAction = new DummyActiveAction(game.getDummyData(activeActionID));
            }
        }
        const tickTimestamp = this.header.getFloat64();
        const saveTimestamp = this.header.getFloat64();
        let activeNamespaces = [];
        if (saveVersion >= 33) {
            activeNamespaces = this.header.getArray((reader) => reader.getString());
        } else {
            activeNamespaces.push("melvorD" /* Namespaces.Demo */ );
            if (this.namespaceMap.has("melvorTotH" /* Namespaces.Throne */ )) {
                activeNamespaces.push("melvorF" /* Namespaces.Full */ , "melvorTotH" /* Namespaces.Throne */ );
            } else if (this.namespaceMap.has("melvorF" /* Namespaces.Full */ )) {
                activeNamespaces.push("melvorF" /* Namespaces.Full */ );
            }
        }
        let modProfile = null;
        if (saveVersion >= 83 && this.header.getBoolean()) {
            modProfile = {
                id: this.header.getString(),
                name: this.header.getString(),
                mods: this.header.getArray((reader) => reader.getUint32()),
            };
        }
        return {
            saveVersion,
            characterName,
            currentGamemode,
            totalSkillLevel,
            gp,
            offlineAction,
            tickTimestamp,
            saveTimestamp,
            activeNamespaces,
            modProfile,
        };
    }
    getSaveString(headerInfo) {
        // Save namespace mapping as an array, as it is ordered
        this.header.writeMap(this.namespaceMap, (namespace, writer) => {
            writer.writeString(namespace);
        }, (idMap, writer) => {
            writer.writeMap(idMap, (localID, writer) => {
                writer.writeString(localID);
            }, (numericID, writer) => {
                writer.writeUint16(numericID);
            });
        });
        this.writeHeaderInfo(headerInfo);
        // Combine header and namespace data
        const headerData = this.header.getRawData();
        const bodyData = this.getRawData();
        const combinedData = new BinaryWriter('Write', 14 + headerData.byteLength + bodyData.byteLength);
        combinedData.writeFixedLengthBuffer(this.stringEncoder.encode('melvor'), 6);
        combinedData.writeBuffer(headerData);
        combinedData.writeBuffer(bodyData);
        const rawSaveData = combinedData.getRawData();
        const compressedData = fflate.strFromU8(fflate.zlibSync(new Uint8Array(rawSaveData)), true);
        const saveString = btoa(compressedData);
        // console.log(`Compressed: ${compressedData.length} bytes. Save String: ${saveString.length} bytes`);
        return saveString;
    }
    /** Sets the data from a save string. Returns the save version */
    setDataFromSaveString(saveString) {
        const combinedReader = new BinaryWriter('Read', 1);
        try {
            combinedReader.setRawData(fflate.unzlibSync(fflate.strToU8(atob(saveString), true)).buffer);
        } catch (e) {
            console.error(e);
            throw new Error('String is not save.');
        }
        const melvor = this.stringDecoder.decode(combinedReader.getFixedLengthBuffer(6));
        if (melvor !== 'melvor')
            throw new Error('String is not save.');
        this.header = new BinaryWriter('Read', 1);
        this.header.setRawData(combinedReader.getBuffer());
        this.setRawData(combinedReader.getBuffer());
        // Reconstruct the header maps
        this.namespaceMap = this.header.getMap((reader) => {
            return reader.getString();
        }, (reader) => {
            return reader.getMap((reader) => {
                return reader.getString();
            }, (reader) => {
                return reader.getUint16();
            });
        });
        // Construct the numericID to namspace map
        this.namespaceMap.forEach((idMap, namespace) => {
            idMap.forEach((numericID, id) => {
                this.numericToStringIDMap.set(numericID, `${namespace}:${id}`);
            });
        });
        return this.header.getUint32();
    }
}
// Utility Functions for writing complex data structures to saves
const writeNamespaced = (object, writer) => {
    writer.writeNamespacedObject(object);
};
/** Returns a method that reads a namespaced object, but rejects if unregistered. */
function readNamespacedReject(registry) {
    return (reader) => {
        const object = reader.getNamespacedObject(registry);
        if (typeof object === 'string')
            return undefined;
        return object;
    };
}
const writeEncodable = (object, writer) => {
    object.encode(writer);
};
const writeItemQuantity = (quantity, writer) => {
    writer.writeNamespacedObject(quantity.item);
    writer.writeInt32(quantity.quantity);
};

function skipAttackEffectData(reader) {
    const effectType = reader.getUint8();
    if (effectType === 18 /* AttackEffectType.ItemEffect */ ) {
        reader.skipBytes(2);
    } else {
        reader.skipBytes(8);
    }
}
/** Utility method for dumping bytes from a SaveWriter */
const skipBytes = (bytes) => (reader) => reader.skipBytes(bytes);
//# sourceMappingURL=saveWriter.js.map
checkFileVersion('?12097')