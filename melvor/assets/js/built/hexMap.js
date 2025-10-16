"use strict";
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static fromData(data) {
        return new Point(data.x, data.y);
    }
    static add(a, b) {
        return new Point(a.x + b.x, a.y + b.y);
    }
    static sub(a, b) {
        return new Point(a.x - b.x, a.y - b.y);
    }
    static divide(a, k) {
        return new Point(a.x / k, a.y / k);
    }
    static mult(a, k) {
        return new Point(a.x * k, a.y * k);
    }
    static average(a, b) {
        return Point.divide(Point.add(a, b), 2);
    }
    static distance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }
    static originDistance(a) {
        return Math.sqrt(Math.pow(a.x, 2) + Math.pow(a.y, 2));
    }
    /** Tests if the coordinates of the points match */
    static isEqual(a, b) {
        return a.x === b.x && a.y === b.y;
    }
    /**
     * Returns the angle of the vector formed between a and b in radians
     * @param a Starting point of the vector
     * @param b End point of the vector
     */
    static vecAngle(a, b) {
        const vec = Point.sub(b, a);
        return Math.atan2(vec.y, vec.x);
    }
    static toPIXI(a) {
        return new PIXI.Point(a.x, a.y);
    }
}
class OffSetHexCoords {
    constructor(col, row) {
        this._col = col;
        this._row = row;
    }
    get col() {
        return this._col;
    }
    get row() {
        return this._row;
    }
    /** Formats these coordinates as Alphabetic coordinates */
    toAlphaCoords() {
        return `${formatIntegerAlphabetic(this.col)}${this.row + 1}`;
    }
    /** Converts to axial coords as if this were odd-q */
    oddq_to_axial() {
        const q = this.col;
        const r = this.row - (this.col - (this.col & 1)) / 2;
        return new HexCoords(q, r);
    }
    /** Converts to axial coords as if this were even-q */
    evenq_to_axial() {
        const q = this.col;
        const r = this.row - (this.col + (this.col & 1)) / 2;
        return new HexCoords(q, r);
    }
    static fromAlphaCoords(alphaCoords) {
        const alpha = alphaCoords.match(/^[A-Z]+/);
        const int = alphaCoords.match(/\d+$/);
        if (alpha === null || int === null)
            throw new Error('Invalid Alphabetic Coords');
        const col = getIntegerFromAlphabetic(alpha[0]);
        const row = Number.parseInt(int[0]) - 1;
        return new OffSetHexCoords(col, row);
    }
}
class HexCoords {
    constructor(q, r) {
        this._q = q;
        this._r = r;
    }
    get q() {
        return this._q;
    }
    get r() {
        return this._r;
    }
    get s() {
        return -this._q - this._r;
    }
    isEqual(a) {
        return a.q === this.q && a.r === this.r;
    }
    /** Converts to Odd Q Offset Coordinates */
    to_oddq() {
        const col = this.q;
        const row = this.r + (this.q - (this.q & 1)) / 2;
        return new OffSetHexCoords(col, row);
    }
    /** Converts to Even Q Offset Coordinates */
    to_evenq() {
        const col = this.q;
        const row = this.r + (this.q + (this.q & 1)) / 2;
        return new OffSetHexCoords(col, row);
    }
    static add(a, b) {
        return new HexCoords(a.q + b.q, a.r + b.r);
    }
    static subtract(a, b) {
        return new HexCoords(a.q - b.q, a.r - b.r);
    }
    static multiply(a, k) {
        return new HexCoords(a.q * k, a.r * k);
    }
    /** Returns the hex distance between two coordinates */
    static distance(a, b) {
        return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
    }
    /** Rounds fractional hex coordinates to integer coordinates */
    static round(fract) {
        let q = Math.round(fract.q);
        let r = Math.round(fract.r);
        const s = Math.round(fract.s);
        const qDiff = Math.abs(q - fract.q);
        const rDiff = Math.abs(r - fract.r);
        const sDiff = Math.abs(s - fract.s);
        if (qDiff > rDiff && qDiff > sDiff) {
            q = -r - s;
        } else if (rDiff > sDiff) {
            r = -q - s;
        }
        return new HexCoords(q, r);
    }
    static fromData(data) {
        return new HexCoords(data.q, data.r);
    }
    static axialNeighbor(hex, dir) {
        return HexCoords.add(hex, HexCoords.axialDirVectors[dir]);
    }
    static getNextInSpiral(current, center) {
        const offset = HexCoords.subtract(current, center);
        let nextDir;
        // 6 cases for each of the directions
        if (offset.r > 0) {
            if (offset.q >= 0) {
                nextDir = 1 /* HexDirVec.NorthEast */ ;
            } else {
                if (offset.s > 0) {
                    nextDir = 5 /* HexDirVec.South */ ;
                } else {
                    nextDir = 0 /* HexDirVec.SouthEast */ ;
                }
            }
        } else {
            if (offset.q <= 0) {
                nextDir = 4 /* HexDirVec.SouthWest */ ;
            } else {
                if (offset.s < 0) {
                    nextDir = 2 /* HexDirVec.North */ ;
                } else {
                    nextDir = 3 /* HexDirVec.NorthWest */ ;
                }
            }
        }
        return HexCoords.axialNeighbor(current, nextDir);
    }
}
HexCoords.axialDirVectors = [
    new HexCoords(1, 0),
    new HexCoords(1, -1),
    new HexCoords(0, -1),
    new HexCoords(-1, 0),
    new HexCoords(-1, 1),
    new HexCoords(0, 1),
];
HexCoords.PI_3 = Math.PI / 3;
HexCoords.SQRT3 = Math.sqrt(3);
class FastTravelGroup extends NamespacedObject {
    constructor(namespace, data, map) {
        super(namespace, data.id);
        this.map = map;
        this.pois = [];
        this._name = data.name;
        this._media = data.media;
    }
    get name() {
        if (this.isModded)
            return this._name;
        return getLangString(`FAST_TRAVEL_NAME_${this.map.localID}_${this.localID}`);
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get assetURL() {
        return this.getPixiAssetURL(this._media);
    }
}
class PointOfInterest extends NamespacedObject {
    constructor(namespace, data, game, map) {
        var _a;
        super(namespace, data.id);
        /** Save state property. If the point of interest has been discovered. */
        this.isDiscovered = false;
        /** Save state property. The order in which this POI was fully surveyed, used to assemble the queue of discovery modals. -1 indicates the poi should not be queued. */
        this.surveyOrder = -1;
        try {
            const hex = map.getHex(HexCoords.fromData(data.coords));
            if (hex === undefined)
                throw new Error(`Hex at q: ${data.coords.q} r: ${data.coords.r} does not exist.`);
            if (hex.pointOfInterest !== undefined)
                throw new Error(`Hex already has a POI.`);
            this.hex = hex;
            hex.pointOfInterest = this;
            this._name = data.name;
            this._description = data.description;
            this._media = data.media;
            this.activeStats = new StatObject((_a = data.activeStats) !== null && _a !== void 0 ? _a : {}, game, `${PointOfInterest.name} with id "${this.id}"`);
            if (data.fastTravel !== undefined) {
                const group = map.fastTravelGroups.getObjectByID(data.fastTravel.groupID);
                if (group === undefined)
                    throw new UnregisteredConstructionError(this, FastTravelGroup.name, data.fastTravel.groupID);
                this.fastTravel = {
                    group,
                    isUnlocked: true,
                };
                if (data.fastTravel.unlockCosts !== undefined) {
                    this.fastTravel.unlockCosts = new FixedCosts(data.fastTravel.unlockCosts, game);
                    this.fastTravel.isUnlocked = false;
                }
                group.pois.push([this, this.fastTravel]);
            }
            if (data.discoveryRewards !== undefined)
                this.discoveryRewards = new FixedCosts(data.discoveryRewards, game);
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(PointOfInterest.name, e, this.id);
        }
    }
    /** Localized name of POI */
    get name() {
        if (this.isModded)
            return this._name;
        return getLangString(`POI_NAME_${this.hex.map.localID}_${this.localID}`);
    }
    /** Localized text that should be indexed when searching for this POI */
    get searchText() {
        let text = '';
        if (this.hasActiveEffect) {
            text += `${getLangString('ACTIVE_MODIFIERS')}\n${this.activeStats.describeSearch()}`;
        }
        return text;
    }
    /** Localized description of POI */
    get description() {
        if (this.isModded)
            return this._description;
        return getLangString(`POI_DESCRIPTION_${this.hex.map.localID}_${this.localID}`);
    }
    /** Full URI for POI's image */
    get media() {
        return this.getMediaURL(this._media);
    }
    /** If this poi has any active modifiers or combat effects */
    get hasActiveEffect() {
        return this.activeStats.hasStats;
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.discoveryModifiers !== undefined)
                this.discoveryModifiers = {
                    moves: data.discoveryModifiers.moves,
                    modifiers: game.getModifierValuesFromData(data.discoveryModifiers.modifiers),
                    movesLeft: 0,
                };
            if (data.hidden !== undefined) {
                this.hidden = {
                    requirements: game.getRequirementsFromData(data.hidden.requirements),
                    itemsWorn: game.items.equipment.getArrayFromIds(data.hidden.itemsWorn),
                    showMarker: data.hidden.showMarker,
                };
            }
        } catch (e) {
            throw new DataConstructionError(PointOfInterest.name, e, this.id);
        }
    }
}
class DigSitePOI extends PointOfInterest {
    constructor(namespace, data, game, map) {
        super(namespace, data, game, map);
        try {
            if (game.archaeology === undefined)
                throw new UnregisteredObjectError(Skill.name, "melvorAoD:Archaeology" /* SkillIDs.Archaeology */ );
            const digSite = game.archaeology.actions.getObjectSafe(data.digSiteID);
            this.digSite = digSite;
            if (digSite.poi !== undefined)
                throw new Error(`${ArchaeologyDigSite.name} with id: "${digSite.id}" already has a POI.`);
            digSite.poi = this;
        } catch (e) {
            throw new DataConstructionError(DigSitePOI.name, e, this.id);
        }
    }
    get searchText() {
        return `${getLangString('DIG_SITE')}\n${super.searchText}`;
    }
}
class Watchtower extends PointOfInterest {
    constructor(namespace, data, game, map) {
        super(namespace, data, game, map);
        this.towerRange = data.towerRange;
    }
    get searchText() {
        return `${getLangString('WATCHTOWER')}\n${super.searchText}`;
    }
}
class PortalPOI extends PointOfInterest {
    constructor(namespace, data, game, map, destination) {
        super(namespace, data, game, map);
        this.destination = destination;
    }
}
/** Realized hex in map, this class will eventually contain state data for each hex */
class Hex extends HexCoords {
    constructor(data, game, _map) {
        super(data.coordinates.q, data.coordinates.r);
        this._map = _map;
        /** Requirements that must be met to survey the hex */
        this.requirements = [];
        /** Cartography level required to survey this hex. Derived from requirements. */
        this.cartographyLevel = 1;
        this._lastCostMultiplier = 0;
        this._combinedCost = 0;
        /** Current survey xp that the hex has */
        this._surveyXP = 0;
        /** Current survey level the hex has */
        this._surveyLevel = 0;
        /** Holes that this hex is on the edge of */
        this.holes = [];
        try {
            if (data.maxSurveyLevel > Cartography.MAX_SURVEY_LEVEL)
                throw new Error(`Max survey level exceeds ${Cartography.MAX_SURVEY_LEVEL}`);
            this.maxSurveyLevel = data.maxSurveyLevel;
            this.maxMasteryLevel = data.maxMasteryLevel;
            this.travelCost = new FixedCosts(data.travelCost, game);
            this.isWater = data.isWater;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(Hex.name, e, `Coords: ${this.q}, ${this.r}`);
        }
    }
    /* #endregion */
    /* #region  Game State Properties */
    /** Returns the WorldMap this hex belongs to */
    get map() {
        return this._map;
    }
    /** Returns the current survey level of the hex */
    get surveyLevel() {
        return this._surveyLevel;
    }
    /** Returns the current xp the hex has */
    get surveyXP() {
        return this._surveyXP;
    }
    /** If this hex is in survey range of the player */
    get inSurveyRange() {
        return HexCoords.distance(this, this.map.playerPosition) <= this.map.surveyRange;
    }
    /** If this hex is in sight range of the player */
    get inSightRange() {
        return HexCoords.distance(this, this.map.playerPosition) <= this.map.sightRange;
    }
    /** If this hex has been fully surveyed */
    get isFullySurveyed() {
        return this._surveyLevel >= this.maxSurveyLevel;
    }
    /** If this hex has been mastered */
    get isMastered() {
        return this._surveyLevel >= this.maxMasteryLevel;
    }
    /** Returns if the hex is currently at the max level possible. Accounts for Mastery system being enabled */
    get isMaxLevel() {
        return this.map.isFullySurveyed ? this.isMastered : this.isFullySurveyed;
    }
    /** Returns the maximum survey level this hex can reach. Accounts for mastery system being enabled */
    get maxLevel() {
        return this.map.isFullySurveyed ? Math.max(this.maxSurveyLevel, this.maxMasteryLevel) : this.maxSurveyLevel;
    }
    /** If the player is located at this hex */
    get isPlayerHere() {
        return this.map.playerPosition === this;
    }
    /** If this hex is currently selected in it's map */
    get isSelected() {
        return this.map.selectedHex === this;
    }
    /** If this hex has a point of interest */
    get hasPOI() {
        return this.pointOfInterest !== undefined;
    }
    getAccessibleDescription(cartography) {
        // TODO_L
        const coords = this.to_oddq();
        // First describe the basic state of the hex
        let desc = '';
        if (this.surveyLevel === 0) {
            desc = 'Unsurveyed Hex';
        } else if (!this.isFullySurveyed) {
            desc = 'Partially Surveyed Hex';
        } else if (this.map.isFullySurveyed) {
            if (this.isMastered) {
                desc = 'Mastered Hex';
            } else {
                desc = 'Unmastered Hex';
            }
        } else {
            desc = 'Fully Surveyed Hex';
        }
        // Next describe POIs in the hex or player location
        const poi = this.pointOfInterest;
        if (poi !== undefined) {
            if (poi.isDiscovered) {
                if (poi instanceof DigSitePOI) {
                    desc += ` with Dig Site: ${poi.name}`;
                } else if (poi instanceof Watchtower) {
                    desc += ` with Watchtower: ${poi.name}`;
                } else {
                    desc += ` with Point of Interest: ${poi.name}`;
                }
            } else if (poi.hidden === undefined) {
                if (poi instanceof DigSitePOI) {
                    desc += ` with Undiscovered Dig Site`;
                } else {
                    desc += ` with Undiscovered Point of Interest`;
                }
            } else if (poi.hidden.showMarker && cartography.isHiddenPOIMet(poi.hidden)) {
                desc += ` with Marked Location`;
            }
        }
        desc += ` at ${coords.col}, ${coords.row}. `;
        if (this.isPlayerHere)
            desc += `You are here.`;
        return desc;
    }
    /** Gets detailed information about the hex when it is queried */
    getAccessibleDetails(cartography) {
        let desc = '';
        if (this.inSurveyRange) {
            desc = 'Hex is in survey range. ';
        } else if (this.inSightRange) {
            desc = 'Hex is in sight range. ';
        } else {
            desc = 'Hex is outside sight range. ';
        }
        if (this.isMaxLevel) {
            desc += 'Survey Level is maxed. ';
        } else {
            desc += `Survey Level is ${this.surveyLevel} out of ${this.maxLevel} `;
        }
        const nextLevel = Math.min(this.maxLevel, this.surveyLevel + 1);
        const xpToNext = Hex.getXPFromLevel(nextLevel);
        desc += `Survey XP is ${Math.floor(this.surveyXP)} out of ${xpToNext} `;
        if (this.isSelected)
            desc += 'Hex is currently selected. ';
        if (this === cartography.currentlySurveyedHex)
            desc += 'Hex is being surveyed. ';
        if (cartography.isHexInQueue(this)) {
            const queuePosition = cartography.getHexQueuePosition(this);
            desc += `Hex is queued for survey in position ${queuePosition + 1}. `;
        }
        if (this.surveyLevel > 0 || this.inSightRange || this === cartography.currentlySurveyedHex) {
            if (this.isSelected) {
                desc += 'Press 0 to deselect hex. ';
            } else {
                desc += `Press 0 to select hex. `;
            }
        }
        desc += `Press 1 to view previous hexes.`;
        return desc;
    }
    getCombinedCost(multiplier) {
        var _a, _b;
        if (this._lastCostMultiplier === multiplier)
            return this._combinedCost;
        let totalCost = 0;
        (_a = this.travelCost.currencies) === null || _a === void 0 ? void 0 : _a.forEach(({
            currency,
            quantity
        }) => {
            totalCost += Math.floor(quantity * currency.travelCostWeight * multiplier);
        });
        (_b = this.travelCost.items) === null || _b === void 0 ? void 0 : _b.forEach(({
            item,
            quantity
        }) => {
            quantity = Math.max(Math.floor(quantity * multiplier), 1);
            totalCost += item.sellsFor.quantity * item.sellsFor.currency.travelCostWeight * quantity;
        });
        this._combinedCost = totalCost;
        return this._combinedCost;
    }
    /* #endregion */
    /** Returns the height of the hex */
    get height() {
        return this.map.hexScale.y * HexCoords.SQRT3;
    }
    /** Returns the width of the hex */
    get width() {
        return this.map.hexScale.x * 2;
    }
    /** Returns the cartesian coordinates of this hexes global origin */
    get origin() {
        return this.map.getHexOrigin(this);
    }
    registerSoftDependencies(data, game) {
        try {
            this.requirements = game.getRequirementsFromData(data.requirements);
            this.cartographyLevel = this.requirements.reduce((prev, req) => {
                if (req.type === 'SkillLevel' && req.skill instanceof Cartography) {
                    prev = Math.max(prev, req.level);
                }
                return prev;
            }, 1);
        } catch (e) {
            throw new DataConstructionError(Hex.name, e, `Coords: ${this.q}, ${this.r}`);
        }
    }
    /**
     * Add survey XP to the hex
     * @param amount The amount of XP to add
     * @returns If the survey level of the hex changed
     */
    addSurveyXP(amount) {
        const oldLevel = this.surveyLevel;
        this._surveyXP += amount;
        this.computeSurveyLevel(oldLevel);
        if (this.surveyLevel === this.maxLevel)
            this._surveyXP = Hex.getXPFromLevel(this.maxLevel);
        return oldLevel !== this.surveyLevel;
    }
    /**
     * Sets ths survey level of the hex to the specified value. Clamps to expected values
     * @param level Positive Integer, level to set to
     */
    setSurveyLevel(level) {
        level = clampValue(level, 0, this.maxLevel);
        this._surveyXP = Hex.getXPFromLevel(level);
        this._surveyLevel = level;
    }
    /** Recomputes the survey level for this hex starting from level */
    computeSurveyLevel(level = 0) {
        this.computeUnclampedLevel(level);
        this.clampSurveyLevel();
    }
    /** Recomputes the survey level of this hex starting from level, does not clamp to maximum */
    computeUnclampedLevel(level = 0) {
        this._surveyLevel = Hex.getLevelFromXP(this._surveyXP, 0);
    }
    /** Clamps the current survey level of this hex to the maximum possible level */
    clampSurveyLevel() {
        this._surveyLevel = Math.min(this._surveyLevel, this.maxLevel);
    }
    canFastTravelTo(hex) {
        var _a, _b, _c, _d;
        return (((_b = (_a = this.pointOfInterest) === null || _a === void 0 ? void 0 : _a.fastTravel) === null || _b === void 0 ? void 0 : _b.isUnlocked) &&
            ((_d = (_c = hex.pointOfInterest) === null || _c === void 0 ? void 0 : _c.fastTravel) === null || _d === void 0 ? void 0 : _d.isUnlocked) &&
            this.pointOfInterest.fastTravel.group === hex.pointOfInterest.fastTravel.group);
    }
    /** Returns true if this hex has a neighbour that is fully surveyed */
    get hasSurveyedNeighbour() {
        return this.someNeighbour((hex) => hex.isFullySurveyed);
    }
    /** Returns true if this hex has a neighbour that is fully surveyed or in the cartography queue */
    hasSurveyedOrQueuedNeighbour(cartography) {
        return this.someNeighbour((hex) => hex.isFullySurveyed || cartography.isHexInQueue(hex));
    }
    /** Iterates over each neighbour hex and returns true if predicate is true for any of them */
    someNeighbour(predicate) {
        return HexCoords.axialDirVectors.some((_, i) => {
            const neighbourHex = this.map.getHex(HexCoords.axialNeighbor(this, i));
            return neighbourHex !== undefined && predicate(neighbourHex);
        });
    }
    /** Returns the cartesian coordinates of a specific vertex, local to this hex's origin */
    getLocalVertex(vertex) {
        return this.map.getLocalHexVertex(vertex);
    }
    /** Returns the cartesian coordinates of a specific vertex, relative to the map's origin */
    getGlobalVertex(vertex) {
        return this.map.getGlobalHexVertex(this, vertex);
    }
    /** Returns the cartesian coordinates of all vertices of this hex, local to this hex's origin */
    getLocalVertices() {
        return this.map.getHexVertices();
    }
    /** Returns the cartesian coordinates of all vertices of this hex, relative to the map's origin */
    getGlobalVertices() {
        const origin = this.origin;
        return this.getLocalVertices().map(({
            x,
            y
        }) => new Point(x + origin.x, y + origin.y));
    }
    encode(writer) {
        writer.writeFloat64(this._surveyXP);
        return writer;
    }
    decode(reader, version) {
        this._surveyXP = reader.getFloat64();
        this.computeUnclampedLevel();
    }
    /**
     *
     * @param xp The XP required per level
     * @param level The level to start the search from
     * @returns The level corresponding to the amount of xp
     */
    static getLevelFromXP(xp, level = 0) {
        for (level; level < Cartography.SURVEY_XP_PER_LEVEL.length; level++) {
            if (Cartography.SURVEY_XP_PER_LEVEL[level] > xp)
                break;
        }
        level--;
        return level;
    }
    static getXPFromLevel(level) {
        return Cartography.SURVEY_XP_PER_LEVEL[level];
    }
}
/** Dummy hex class, used for dumping save data for unregistered hexes */
class DummyHex extends Hex {
    constructor(game, map) {
        super({
            coordinates: {
                q: 0,
                r: 0
            },
            maxSurveyLevel: 2,
            maxMasteryLevel: 2,
            requirements: [],
            travelCost: {},
            isWater: true,
        }, game, map);
    }
}
const flatHexOrient = {
    forward: [
        [3 / 2, 0],
        [HexCoords.SQRT3 / 2, HexCoords.SQRT3],
    ],
    inverse: [
        [2 / 3, 0],
        [-1 / 3, HexCoords.SQRT3 / 3],
    ],
};
class WorldMapMasteryBonus extends NamespacedObject {
    constructor(namepsace, data, game) {
        super(namepsace, data.id);
        /** Save State property. Determines if this bonus has been awarded to the player. */
        this.awarded = false;
        try {
            this.masteredHexes = data.masteredHexes;
            this.stats = new StatObject(data, game, `${WorldMapMasteryBonus.name} with id "${this.id}"`);
            if (data.pets !== undefined)
                this.pets = game.pets.getArrayFromIds(data.pets);
            if (data.currencies)
                this.currencies = game.getCurrencyQuantities(data.currencies);
            // TODO_D - deprecated property support
            if (data.gp) {
                if (!this.currencies)
                    this.currencies = [];
                this.currencies.push({
                    currency: game.gp,
                    quantity: data.gp
                });
            }
            if (data.sc) {
                if (!this.currencies)
                    this.currencies = [];
                this.currencies.push({
                    currency: game.slayerCoins,
                    quantity: data.sc
                });
            }
            if (data.items !== undefined)
                this.items = game.items.getQuantities(data.items);
        } catch (e) {
            throw new DataConstructionError(WorldMapMasteryBonus.name, e, this.id);
        }
    }
}
/** Utility class for managing world map filter settings */
class MapFilterSettings {
    constructor(map) {
        this.map = map;
        /** Settings of each marker type */
        this.markerSettings = new Array(10 /* MapFilterType.MaxLength */ ).fill(true);
        /** Set of FastTravelGroups that should not be shown on the map */
        this.hiddenFastTravelGroups = new Set();
    }
    /** Sets a standard filter to be visible */
    set(type, value) {
        this.markerSettings[type] = value;
    }
    /** Gets if a standard filter should be visible */
    get(type) {
        return this.markerSettings[type];
    }
    /** Sets if a fast travel group should be visible */
    setGroup(group, value) {
        if (value)
            this.hiddenFastTravelGroups.delete(group);
        else
            this.hiddenFastTravelGroups.add(group);
    }
    /** Returns if the icons of a fast travel group should be visible */
    getGroup(group) {
        return !this.hiddenFastTravelGroups.has(group);
    }
    encode(writer) {
        writer.writeArray(this.markerSettings, (val, writer) => writer.writeBoolean(val));
        writer.writeSet(this.hiddenFastTravelGroups, writeNamespaced);
        return writer;
    }
    decode(reader, version) {
        this.markerSettings = reader.getArray((reader) => reader.getBoolean());
        while (this.markerSettings.length < 10 /* MapFilterType.MaxLength */ )
            this.markerSettings.push(true);
        this.hiddenFastTravelGroups = reader.getSet(readNamespacedReject(this.map.fastTravelGroups));
    }
}
MapFilterSettings.filters = [{
        get name() {
            return getLangString('CURRENT_LOCATION');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/location_pin.svg" /* Assets.PlayerMarker */ );
        },
    },
    {
        get name() {
            return getLangString('UNDISCOVERED_DIG_SITE');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/undisc_dig_site.svg" /* Assets.UndiscoveredDigSite */ );
        },
    },
    {
        get name() {
            return getLangString('UNDISCOVERED_POI');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/undisc_POI.svg" /* Assets.UndiscoveredPOI */ );
        },
    },
    {
        get name() {
            return getLangString('DIG_SITE');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/dig_site.png" /* Assets.DigSite */ );
        },
    },
    {
        get name() {
            return getLangString('WATCHTOWER');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/watchtower.png" /* Assets.Watchtower */ );
        },
    },
    {
        get name() {
            return getLangString('POINT_OF_INTEREST');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/point_of_interest.png" /* Assets.PointOfInterest */ );
        },
    },
    {
        get name() {
            return getLangString('SHOW_HEX_GRID');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/hex_grid.png" /* Assets.HexGrid */ );
        },
    },
    {
        get name() {
            return getLangString('HEX_MASTERY');
        },
        get media() {
            return assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */ );
        },
    },
    {
        get name() {
            return getLangString('SHOW_SURVEY_PROGRESS');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/survey_icon.png" /* Assets.SurveyIcon */ );
        },
    },
    {
        get name() {
            return getLangString('ACTIVE_POINT_OF_INTEREST');
        },
        get media() {
            return assets.getURI("assets/media/skills/cartography/sprites/active_poi.png" /* Assets.ActivePOI */ );
        },
    },
];
/** Determines the display order of map filters in the dropdown menu */
MapFilterSettings.filterDisplayOrder = [
    0 /* MapFilterType.PlayerMarker */ ,
    1 /* MapFilterType.UndiscoveredDigsite */ ,
    2 /* MapFilterType.UndiscoveredPOI */ ,
    3 /* MapFilterType.Digsites */ ,
    4 /* MapFilterType.Watchtowers */ ,
    5 /* MapFilterType.OtherPOIs */ ,
    9 /* MapFilterType.ActivePOIs */ ,
    6 /* MapFilterType.HexGrid */ ,
    8 /* MapFilterType.HexProgress */ ,
    7 /* MapFilterType.MasteryMarkers */ ,
];
class WorldMap extends NamespacedObject {
    constructor(namespace, data, game, cartography) {
        super(namespace, data.id);
        this.game = game;
        this.cartography = cartography;
        /** The base sight range the player has on this map */
        this.baseSightRange = 2;
        /** The base survey range the player has on this map */
        this.baseSurveyRange = 1;
        /** Internal counter for the total number of hexes in this map */
        this._totalHexCount = 0;
        /** Map of q to map of r to Hex */
        this.hexes = new Map();
        /** Holes in the map, computed after data is registered */
        this.holes = [];
        /** Array of mastery bonuses this map gives. Sorted in order of lowest number of mastered hexes to highest number. */
        this.sortedMasteryBonuses = [];
        /** The lowest cost in the map to travel to another hex. Used to scale the heuristic function in the A* algorithm. */
        this._lowestTravelCost = 1;
        /** List of points of interest that have been discovered */
        this.discoveredPOIs = [];
        /** Set of POIs that are undiscovered, hidden and should show a marker */
        this.markedUndiscoveredHiddenPOIs = new Set();
        /** Queue of points of interest that have been surveyed, but are undiscovered */
        this.undiscoveredPOIs = [];
        /** Total number of hexes in the map that are fully surveyed */
        this.fullySurveyedHexes = 0;
        /** Total number of hexes in the map that are mastered */
        this.masteredHexes = 0;
        /** Total number of mastery bonuses that have been unlocked */
        this.unlockedMasteryBonuses = 0;
        /** If there are any dig site POIs on the map */
        this.hasDigSites = false;
        /** If there are any watchtower POIs on the map */
        this.hasWatchtowers = false;
        /** If there are any POIs with active modifiers on the map */
        this.hasActivePOIs = false;
        try {
            this.fastTravelGroups = new NamespaceRegistry(game.registeredNamespaces, FastTravelGroup.name);
            this.pointsOfInterest = new NamespaceRegistry(game.registeredNamespaces, PointOfInterest.name);
            this.masteryBonuses = new NamespaceRegistry(game.registeredNamespaces, WorldMapMasteryBonus.name);
            this._name = data.name;
            this.tiles = {
                dimensions: Point.fromData(data.bgTiles.dimensions),
                tileSize: Point.fromData(data.bgTiles.tileSize),
                tilePath: data.bgTiles.tilePath,
            };
            if (!this.tiles.tilePath.endsWith('/'))
                this.tiles.tilePath += '/';
            this.worldSize = Point.fromData(data.worldSize);
            // Validate Tile data
            const totalTileWidth = this.tiles.dimensions.x * this.tiles.tileSize.x;
            const totalTileHeight = this.tiles.dimensions.y * this.tiles.tileSize.y;
            if (this.worldSize.x !== totalTileWidth)
                throw new Error(`Tile X dimensions do not match worldSize.`);
            if (this.worldSize.y !== totalTileHeight)
                throw new Error(`Tile Y dimensions do not match worldSize.`);
            this.hexScale = Point.fromData(data.hexScale);
            this.hexBorderColour = Number.parseInt(data.hexBorderColour, 16);
            this.activePOIBorderColour = Number.parseInt(data.activePOIBorderColour, 16);
            this.origin = Point.fromData(data.origin);
            data.hexes.forEach((hexData) => {
                let rMap = this.hexes.get(hexData.coordinates.q);
                if (rMap === undefined) {
                    rMap = new Map();
                    this.hexes.set(hexData.coordinates.q, rMap);
                }
                if (rMap.has(hexData.coordinates.r))
                    throw new Error(`Duplicate hex at q: ${hexData.coordinates.q}, r: ${hexData.coordinates.r}`);
                const hex = new Hex(hexData, game, this);
                rMap.set(hexData.coordinates.r, hex);
            });
            const playerStart = this.getHex(HexCoords.fromData(data.startingLocation));
            if (playerStart === undefined)
                throw new Error(`Player starting position is not a hex.`);
            this.startingLocation = playerStart;
            this._playerPosition = playerStart;
            playerStart.setSurveyLevel(playerStart.maxSurveyLevel);
            data.fastTravelGroups.forEach((groupData) => {
                this.fastTravelGroups.registerObject(new FastTravelGroup(namespace, groupData, this));
            });
            data.pointsOfInterest.forEach((poiData) => {
                switch (poiData.type) {
                    case 'DigSite':
                        this.pointsOfInterest.registerObject(new DigSitePOI(namespace, poiData, game, this));
                        this.hasDigSites = true;
                        break;
                    case 'Watchtower':
                        this.pointsOfInterest.registerObject(new Watchtower(namespace, poiData, game, this));
                        this.hasWatchtowers = true;
                        break;
                    case 'Other':
                        this.pointsOfInterest.registerObject(new PointOfInterest(namespace, poiData, game, this));
                        if (poiData.activeStats !== undefined)
                            this.hasActivePOIs = true;
                        break;
                }
            });
            this.filterSettings = new MapFilterSettings(this);
            data.masteryBonuses.forEach((bonusData) => {
                this.masteryBonuses.registerObject(new WorldMapMasteryBonus(namespace, bonusData, game));
            });
        } catch (e) {
            throw new DataConstructionError(WorldMap.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        }
        return getLangString(`WORLD_MAP_NAME_${this.localID}`);
    }
    /** The range that the player can see hexes */
    get sightRange() {
        return Math.max(1, this.baseSightRange + this.game.modifiers.cartographySightRange);
    }
    /** The range that the player can survey hexes*/
    get surveyRange() {
        return clampValue(this.baseSurveyRange + this.game.modifiers.cartographySurveyRange, 1, this.sightRange);
    }
    /** Returns the total number of hexes that exist in this map */
    get numberOfHexes() {
        return this._totalHexCount;
    }
    /** Returns The hex that the player is currently located at */
    get playerPosition() {
        return this._playerPosition;
    }
    /** Returns The hex that the player has currently selected */
    get selectedHex() {
        return this._selectedHex;
    }
    /** Returns the Path to the currently selected hex. Undefined if no path exists. */
    get selectedHexPath() {
        return this._pathToSelected;
    }
    /** Returns if every hex in the map has been fully surveyed */
    get isFullySurveyed() {
        return this.fullySurveyedHexes === this._totalHexCount;
    }
    /** Returns if every hex in the map has been mastered */
    get isMastered() {
        return this.masteredHexes === this._totalHexCount;
    }
    /** Gets the hex at the given hex coordinates */
    getHex(coords) {
        var _a;
        return (_a = this.hexes.get(coords.q)) === null || _a === void 0 ? void 0 : _a.get(coords.r);
    }
    /**
     * Gets the hexes that are in range of another hex
     * @param center The coordinates of the center hex
     * @param range The int range from the center hex
     * @returns The hexes that are in range and exist in the map
     */
    getHexesInRange(center, range) {
        const hexes = [];
        for (let q = -range; q <= range; q++) {
            const rMin = Math.max(-range, -q - range);
            const rMax = Math.min(range, -q + range);
            for (let r = rMin; r <= rMax; r++) {
                const hex = this.getHex(HexCoords.add(center, new HexCoords(q, r)));
                if (hex !== undefined)
                    hexes.push(hex);
            }
        }
        return hexes;
    }
    /**
     * Gets the hexes that are in a ring around another hex
     * @param center The center hex of the ring
     * @param radius The radius of the ring
     * @returns The hexes in the ring that exist in the map
     */
    getHexesInRing(center, radius) {
        if (radius <= 0)
            throw new Error('Cannot get hexe ring with 0 or negative radius');
        const hexes = [];
        let coords = HexCoords.add(center, HexCoords.multiply(HexCoords.axialDirVectors[4], radius));
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < radius; j++) {
                const hex = this.getHex(coords);
                if (hex !== undefined)
                    hexes.push(hex);
                coords = HexCoords.axialNeighbor(coords, i);
            }
        }
        return hexes;
    }
    /**
     * Gets the hexes that are within a rectangle
     * @param rect Rectangle that hexes should overlap with
     */
    getHexesInRectangle(rect) {
        const hexes = [];
        const hexDims = this.getHexDimensions();
        const topLeft = this.getCoordsFromPoint(new Point(rect.left, rect.top));
        const topRight = this.getCoordsFromPoint(new Point(rect.right, rect.top));
        const botLeft = this.getCoordsFromPoint(new Point(rect.left, rect.bottom));
        // Check if rMin should decrease on "odd" columns from the left
        const topLeftNE = HexCoords.axialNeighbor(topLeft, 1 /* HexDirVec.NorthEast */ );
        const oddRMinDec = this.getHexOrigin(topLeftNE).y + hexDims.height / 2 > rect.top;
        // Check if rMax should decrease on "odd" columns from the left
        const botLeftSE = HexCoords.axialNeighbor(botLeft, 0 /* HexDirVec.SouthEast */ );
        const oddRMaxDec = this.getHexOrigin(botLeftSE).y - hexDims.height / 2 >= rect.bottom;
        // Check for additional column on left side
        const topLeftSW = HexCoords.axialNeighbor(topLeft, 4 /* HexDirVec.SouthWest */ );
        if (this.getHexOrigin(topLeftSW).x + hexDims.width / 2 > rect.left) {
            const q = topLeftSW.q;
            for (let r = topLeftSW.r; r <= botLeft.r; r++) {
                const hex = this.getHex(new HexCoords(q, r));
                if (hex !== undefined)
                    hexes.push(hex);
            }
        }
        // Add central
        for (let q = topLeft.q; q <= topRight.q; q++) {
            const qOffset = Math.floor((q - topLeft.q) / 2);
            const oddCol = (q - topLeft.q) % 2 !== 0;
            const rMin = topLeft.r - qOffset - (oddCol && oddRMinDec ? 1 : 0);
            const rMax = botLeft.r - qOffset - (oddCol && oddRMaxDec ? 1 : 0);
            for (let r = rMin; r <= rMax; r++) {
                const hex = this.getHex(new HexCoords(q, r));
                if (hex !== undefined)
                    hexes.push(hex);
            }
        }
        // Check for additional column on right side
        const topRightSE = HexCoords.axialNeighbor(topRight, 0 /* HexDirVec.SouthEast */ );
        if (this.getHexOrigin(topRightSE).x - hexDims.width / 2 < rect.right) {
            const q = topRightSE.q;
            const qOffset = Math.floor((q - topLeft.q) / 2);
            const oddCol = (q - topLeft.q) % 2 !== 0;
            const rMax = botLeft.r - qOffset - (oddCol && oddRMaxDec ? 1 : 0);
            for (let r = topRightSE.r; r <= rMax; r++) {
                const hex = this.getHex(new HexCoords(q, r));
                if (hex !== undefined)
                    hexes.push(hex);
            }
        }
        return hexes;
    }
    /** Computes the edges in the map, returning the polygon they form and the hexes that border them */
    computeEdges() {
        const mapEdges = [];
        const visitedEdges = new Map();

        function getVisitedSet(hex) {
            let visitedSet = visitedEdges.get(hex);
            if (visitedSet === undefined) {
                visitedSet = new Set();
                visitedEdges.set(hex, visitedSet);
            }
            return visitedSet;
        }
        const getVertex = (hex, edge) => {
            const vertex = (7 - edge) % 6;
            const point = this.getGlobalHexVertex(hex, vertex);
            point.x = clampValue(point.x, 0, this.worldSize.x);
            point.y = clampValue(point.y, 0, this.worldSize.y);
            return Point.toPIXI(point);
        };
        const getMapEdge = (startingHex, startingEdge) => {
            const edgeHexes = [startingHex];
            const edgePoints = [getVertex(startingHex, startingEdge)];
            const startingSet = getVisitedSet(startingHex);
            let hex = startingHex;
            let nextEdge = (startingEdge + 1) % 6;
            let nextHex = this.getHex(HexCoords.axialNeighbor(startingHex, nextEdge));
            let visitedSet = getVisitedSet(hex);
            while (!(nextHex === startingHex || (hex === startingHex && nextEdge === startingEdge))) {
                edgePoints.push(getVertex(hex, nextEdge));
                visitedSet.add(nextEdge);
                if (nextHex === undefined) {
                    // Continue Along the edge
                    nextEdge = (nextEdge + 1) % 6;
                } else {
                    // Step into the neighbor hex, marking known edges and starting from unknown ones
                    edgeHexes.push(nextHex);
                    hex = nextHex;
                    visitedSet = getVisitedSet(hex);
                    visitedSet.add((nextEdge + 4) % 6); // We know this edge has no neighbour
                    visitedSet.add((nextEdge + 3) % 6); // We know this edge has a neighbour
                    nextEdge = (nextEdge + 5) % 6;
                }
                nextHex = this.getHex(HexCoords.axialNeighbor(hex, nextEdge));
            }
            // Mark the edges back to the initial edge
            let markEdge = (nextEdge + 4) % 6;
            while (markEdge !== startingEdge) {
                edgePoints.push(getVertex(startingHex, markEdge));
                startingSet.add(markEdge);
                markEdge = (markEdge + 1) % 6;
            }
            const edgePolygon = new PIXI.Polygon(edgePoints);
            return {
                hexes: edgeHexes,
                polygon: edgePolygon
            };
        };
        this.forEach((hex) => {
            const visitedSet = getVisitedSet(hex);
            if (visitedSet.size === 6)
                return; // Skip Hexes that have had all edges visited
            for (let edge = 0; edge < 6; edge++) {
                if (visitedSet.has(edge))
                    return; // Skip Edges that have already been visited
                const neighbour = this.getHex(HexCoords.axialNeighbor(hex, edge));
                if (neighbour === undefined)
                    mapEdges.push(getMapEdge(hex, edge));
                else {
                    visitedSet.add(edge);
                    getVisitedSet(neighbour).add((edge + 3) % 6);
                }
            }
        });
        return mapEdges;
    }
    /** Gets a polygon representing the exterior rectangle of the map boundary */
    getExteriorRect() {
        return new PIXI.Polygon([
            new PIXI.Point(0, 0),
            new PIXI.Point(this.worldSize.x, 0),
            new PIXI.Point(this.worldSize.x, this.worldSize.y),
            new PIXI.Point(0, this.worldSize.y),
        ]);
    }
    /** Sorts the edges of the map into a left-child, right-sibling tree, where child polygons are contained by their parent polygons, but their siblings have no intersection */
    sortEdges(edges) {
        /** Root node of the tree */
        const root = {
            edge: {
                hexes: [],
                polygon: this.getExteriorRect(),
            },
        };
        /**
         *
         * @param a The parent edge node
         * @param b The potential child node
         * @returns If the polygon of a contains the polygon of b
         */
        function doesEdgeContainEdge(a, b) {
            if (a === root)
                return true; // All edge polygons are contained within the root
            const numPoints = b.edge.polygon.points.length / 2;
            for (let i = 0; i < numPoints; i += 2) {
                if (a.edge.polygon.contains(b.edge.polygon.points[i], b.edge.polygon.points[i + 1]))
                    return true;
            }
            return false;
        }
        edges.forEach((edge) => {
            const edgeNode = {
                edge,
            };
            // Find the edge node that contains the edge's polygon
            let container = root;
            let child = root.leftChild;
            while (child !== undefined) {
                if (doesEdgeContainEdge(child, edgeNode)) {
                    container = child;
                    child = container.leftChild;
                } else {
                    child = child.rightSibling;
                }
            }
            // Check if any of the containers children are contained by the edge's polygon
            // If they are, replace their parent with the edgeNode
            let leftSibling = undefined;
            child = container.leftChild;
            while (child !== undefined) {
                const nextChild = child.rightSibling;
                if (doesEdgeContainEdge(edgeNode, child)) {
                    // Remove child from container
                    if (leftSibling === undefined) {
                        container.leftChild = child.rightSibling;
                    } else {
                        leftSibling.rightSibling = child.rightSibling;
                    }
                    // Make child of edgeNode
                    child.parent = edgeNode;
                    child.rightSibling = edgeNode.leftChild;
                    edgeNode.leftChild = child;
                } else {
                    leftSibling = child;
                }
                child = nextChild;
            }
            // Make the edge node a child of the container
            edgeNode.parent = container;
            edgeNode.rightSibling = container.leftChild;
            container.leftChild = edgeNode;
        });
        return root;
    }
    /** Converts the left-child, right-sibling tree into an array of hole objects for use in rendering */
    convertEdgeNodesToHoles(root) {
        const holes = [];

        function convertNodeToHole(node) {
            const hole = {
                exterior: node.edge.polygon,
                holes: [],
                hexes: [...node.edge.hexes],
                surveyedHexes: [],
            };
            let child = node.leftChild;
            while (child !== undefined) {
                let grandChild = child.leftChild;
                while (grandChild !== undefined) {
                    convertNodeToHole(grandChild);
                    grandChild = grandChild.rightSibling;
                }
                hole.holes.push(child.edge.polygon);
                hole.hexes.push(...child.edge.hexes);
                child = child.rightSibling;
            }
            holes.push(hole);
        }
        convertNodeToHole(root);
        return holes;
    }
    /** Computes the hole objects for this map */
    computeHoles() {
        const edges = this.computeEdges();
        const root = this.sortEdges(edges);
        return this.convertEdgeNodesToHoles(root);
    }
    /** Returns the cartesian coordinates of a hex's center */
    getHexOrigin(coords) {
        const x = (flatHexOrient.forward[0][0] * coords.q + flatHexOrient.forward[0][1] * coords.r) * this.hexScale.x +
            this.origin.x;
        const y = (flatHexOrient.forward[1][0] * coords.q + flatHexOrient.forward[1][1] * coords.r) * this.hexScale.y +
            this.origin.y;
        return new Point(x, y);
    }
    /** Returns the local coordinates of a hex vertex */
    getLocalHexVertex(vertex) {
        const theta = HexCoords.PI_3 * vertex;
        const x = this.hexScale.x * Math.cos(theta);
        const y = this.hexScale.y * Math.sin(theta);
        return new Point(x, y);
    }
    /** Returns the global coordinates of a hex vertex */
    getGlobalHexVertex(coords, vertex) {
        return Point.add(this.getLocalHexVertex(vertex), this.getHexOrigin(coords));
    }
    /** Gets fractional coordinates from a point on the map */
    getFractionalCoordsFromPoint(point) {
        let pt = Point.sub(point, this.origin);
        pt = new Point(pt.x / this.hexScale.x, pt.y / this.hexScale.y);
        const q = flatHexOrient.inverse[0][0] * pt.x + flatHexOrient.inverse[0][1] * pt.y;
        const r = flatHexOrient.inverse[1][0] * pt.x + flatHexOrient.inverse[1][1] * pt.y;
        return new HexCoords(q, r);
    }
    /** Gets hex coordinates from a point on the map */
    getCoordsFromPoint(point) {
        return HexCoords.round(this.getFractionalCoordsFromPoint(point));
    }
    /** Gets the local coordinates of the vertices of a hex */
    getHexVertices() {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const theta = i * HexCoords.PI_3;
            const x = this.hexScale.x * Math.cos(theta);
            const y = this.hexScale.y * Math.sin(theta);
            points.push(new Point(x, y));
        }
        return points;
    }
    /** Returns the rectangular width and height of a hex */
    getHexDimensions() {
        return {
            width: this.hexScale.x * 2,
            height: this.hexScale.y * HexCoords.SQRT3,
        };
    }
    /** Iterates through each hex in the map. */
    forEach(callbackfn) {
        this.hexes.forEach((rMap) => {
            rMap.forEach((hex) => callbackfn(hex));
        });
    }
    setPlayerPosition(hex) {
        if (hex.map !== this)
            throw new Error('Tried to move player to hex that is not in this map');
        this._playerPosition = hex;
        this.updateSelectedPath();
    }
    /** Deselects the currently selected hex */
    deselectHex() {
        this._selectedHex = undefined;
        this.updateSelectedPath();
    }
    /** Sets the hex that is currently selected */
    selectHex(hex) {
        if (hex.map !== this)
            throw new Error('Tried to select hex that is not in this map');
        this._selectedHex = hex;
        this.updateSelectedPath();
    }
    /** Recomputes the path to the selected hex */
    updateSelectedPath() {
        if (this._selectedHex === undefined ||
            !this._selectedHex.isFullySurveyed ||
            this._selectedHex === this._playerPosition)
            this._pathToSelected = undefined;
        else
            this._pathToSelected = this.computePath(this._playerPosition, this._selectedHex);
    }
    getHexNeighboursAndCosts(hex, costModifier) {
        var _a, _b, _c;
        const neighbourCosts = [];
        const neighbourSet = new Set();
        // Check for Fast Travel Neighbours First
        if (((_b = (_a = hex.pointOfInterest) === null || _a === void 0 ? void 0 : _a.fastTravel) === null || _b === void 0 ? void 0 : _b.isUnlocked) && ((_c = hex.pointOfInterest) === null || _c === void 0 ? void 0 : _c.isDiscovered)) {
            hex.pointOfInterest.fastTravel.group.pois.forEach(([poi, fastTravel]) => {
                if (poi.hex === hex || !poi.isDiscovered || !fastTravel.isUnlocked)
                    return;
                neighbourCosts.push([poi.hex, 0]);
                neighbourSet.add(poi.hex);
            });
        }
        HexCoords.axialDirVectors.forEach((_, i) => {
            const neighbourCoords = HexCoords.axialNeighbor(hex, i);
            const neighbourHex = this.getHex(neighbourCoords);
            if (neighbourHex !== undefined && !neighbourSet.has(neighbourHex) && neighbourHex.isFullySurveyed)
                neighbourCosts.push([neighbourHex, neighbourHex.getCombinedCost(costModifier)]);
        });
        return neighbourCosts;
    }
    /**
     * Computes a cost minimized path from one hex to another, using the A* algorithm
     * @param start The starting Hex
     * @param goal The end Hex
     * @returns an array of hexes to traverse, or undefined if no path was found
     */
    computePath(start, goal) {
        const openSet = new MinHeapPriorityQueue([], []);
        openSet.insert(start, 0); // Insert the first node into the queue, and track it in the node map
        const cameFrom = new Map();
        const costSoFar = new Map();
        const costModifier = this.cartography.travelCostMultiplier;
        const heuristicScale = costModifier * this._lowestTravelCost;
        costSoFar.set(start, 0);
        while (!openSet.isEmpty) {
            const current = openSet.extractMin(); // Always available since it's not empty
            if (current === goal)
                return this._reconstructPath(cameFrom, current);
            this.getHexNeighboursAndCosts(current, costModifier).forEach(([neighbor, cost]) => {
                const newCost = costSoFar.get(current) + cost;
                const nextCost = costSoFar.get(neighbor);
                if (nextCost === undefined || newCost < nextCost) {
                    costSoFar.set(neighbor, newCost);
                    const priority = newCost + this._pathHeuristic(goal, neighbor, heuristicScale);
                    cameFrom.set(neighbor, current);
                    if (openSet.inQueue(neighbor)) {
                        openSet.decreasePriority(neighbor, priority);
                    } else {
                        openSet.insert(neighbor, priority);
                    }
                }
            });
        }
        return undefined;
    }
    /** Tests path finding and draws a path between two hexes */
    testPathCoords(startCoords, goalCoords) {
        const start = this.getHex(HexCoords.fromData(startCoords));
        const goal = this.getHex(HexCoords.fromData(goalCoords));
        if (start === undefined || goal === undefined)
            throw new Error('Invalid Coords');
        const path = this.computePath(start, goal);
        if (path === undefined)
            console.log('No Path Found');
        else
            cartographyMap.drawHexPath(this, path);
    }
    _pathHeuristic(a, b, scaling) {
        return HexCoords.distance(a, b) * scaling;
    }
    _reconstructPath(cameFrom, current) {
        const path = [current];
        while (true) {
            const prevNode = cameFrom.get(current);
            if (prevNode === undefined)
                break;
            current = prevNode;
            path.push(current);
        }
        return path;
    }
    /** Precomputes the lowest cost to travel to a hex with no cost multiplier */
    _computeLowestTravelCost() {
        let lowestCost = Infinity;
        this.forEach((hex) => {
            const cost = hex.getCombinedCost(1);
            if (cost < lowestCost)
                lowestCost = cost;
        });
        this._lowestTravelCost = lowestCost;
    }
    /** Method called once after all game data has been registered */
    postDataRegistration() {
        this.holes = this.computeHoles();
        this.holes.forEach((hole) => {
            hole.hexes.forEach((hex) => {
                hex.holes.push(hole);
            });
        });
        this.computeTotalHexes();
        this._computeLowestTravelCost();
        this.sortedMasteryBonuses = this.masteryBonuses.allObjects;
        this.sortedMasteryBonuses.sort((a, b) => a.masteredHexes - b.masteredHexes);
    }
    /** Recomputes the total number of hexes in this map */
    computeTotalHexes() {
        this._totalHexCount = 0;
        this.hexes.forEach((rMap) => {
            this._totalHexCount += rMap.size;
        });
    }
    getTileTexturePath(i, j, quality) {
        const basePath = `${this.tiles.tilePath}tile_${i}_${j}`;
        let path;
        switch (quality) {
            case 2 /* MapTextureQuality.High */ :
                path = `${basePath}@1x.png`;
                break;
            case 1 /* MapTextureQuality.Medium */ :
                path = `${basePath}@1x.basis`;
                break;
            case 0 /* MapTextureQuality.Low */ :
                path = `${basePath}@0.5x.basis`;
                break;
        }
        return path;
    }
    /** Returns the URI for the .basis file representing the tile at [i,j] */
    getTileTexture(i, j, quality) {
        return this.getPixiAssetURL(this.getTileTexturePath(i, j, quality));
    }
    /** Returns if a border should be shown for the given hex */
    shouldHexHaveBorder(hex) {
        return (this.filterSettings.get(6 /* MapFilterType.HexGrid */ ) &&
            (!this.game.settings.disableHexGridOutsideSight || hex.inSightRange));
    }
    /** Called for each map on save load. */
    onLoad() {
        // Count total number of fully surveyed hexes, and discovered pois
        this.forEach((hex) => {
            if (hex.isFullySurveyed) {
                this.fullySurveyedHexes++;
                hex.holes.forEach((hole) => {
                    hole.surveyedHexes.push(hex);
                });
            }
        });
        // Clamp Hex Level, and count fully mastered hexes
        this.forEach((hex) => {
            hex.clampSurveyLevel();
            if (hex.isMastered)
                this.masteredHexes++;
        });
        this.pointsOfInterest.forEach((poi) => {
            if (poi.isDiscovered) {
                this.discoveredPOIs.push(poi);
            } else if (poi.hidden === undefined) {
                if (poi.hex.isFullySurveyed && poi.surveyOrder === -1)
                    poi.surveyOrder = 0;
                if (poi.surveyOrder !== -1)
                    this.undiscoveredPOIs.push(poi);
            } else if (poi.hidden.showMarker) {
                this.markedUndiscoveredHiddenPOIs.add(poi);
            }
        });
        this.undiscoveredPOIs.sort((a, b) => a.surveyOrder - b.surveyOrder);
    }
    encode(writer) {
        writer.writeComplexMap(this.hexes, (q, rMap, writer) => {
            writer.writeInt16(q);
            writer.writeComplexMap(rMap, (r, hex, writer) => {
                writer.writeInt16(r);
                hex.encode(writer);
            });
        });
        this.encodeHexCoords(writer, this._playerPosition);
        this.filterSettings.encode(writer);
        writer.writeArray(this.pointsOfInterest.allObjects, (poi) => {
            var _a, _b;
            writer.writeNamespacedObject(poi);
            writer.writeBoolean(poi.isDiscovered);
            if (poi.fastTravel !== undefined) {
                writer.writeUint8(poi.fastTravel.isUnlocked ? 1 /* FastTravelSaveState.Unlocked */ : 2 /* FastTravelSaveState.Locked */ );
            } else {
                writer.writeUint8(0 /* FastTravelSaveState.None */ );
            }
            writer.writeUint8((_b = (_a = poi.discoveryModifiers) === null || _a === void 0 ? void 0 : _a.movesLeft) !== null && _b !== void 0 ? _b : 0);
            writer.writeInt16(poi.surveyOrder);
        });
        writer.writeArray(this.masteryBonuses.allObjects, (bonus) => {
            writer.writeNamespacedObject(bonus);
            writer.writeBoolean(bonus.awarded);
        });
        return writer;
    }
    decode(reader, version) {
        var _a;
        reader.getComplexMap((reader) => {
            const q = reader.getInt16();
            const rMap = reader.getComplexMap((reader) => {
                const r = reader.getInt16();
                const hex = this.getHex(new HexCoords(q, r));
                if (hex === undefined) {
                    new DummyHex(this.game, this).decode(reader, version);
                    return undefined;
                } else {
                    hex.decode(reader, version);
                    return {
                        key: r,
                        value: hex,
                    };
                }
            });
            if (rMap.size === 0)
                return undefined;
            return {
                key: q,
                value: rMap,
            };
        });
        this._playerPosition = (_a = this.getHex(this.decodeHexCoords(reader, version))) !== null && _a !== void 0 ? _a : this.startingLocation;
        this.filterSettings.decode(reader, version);
        reader.getArray((reader) => {
            const poi = reader.getNamespacedObject(this.pointsOfInterest);
            const discovered = reader.getBoolean();
            const fastTravelUnlocked = reader.getUint8();
            const discoveryMovesLeft = reader.getUint8();
            let surveyOrder = -1;
            if (version >= 74)
                surveyOrder = reader.getInt16();
            if (typeof poi !== 'string') {
                poi.isDiscovered = discovered;
                if (poi.fastTravel !== undefined && fastTravelUnlocked !== 0 /* FastTravelSaveState.None */ )
                    poi.fastTravel.isUnlocked = fastTravelUnlocked === 1 /* FastTravelSaveState.Unlocked */ ;
                if (poi.discoveryModifiers !== undefined)
                    poi.discoveryModifiers.movesLeft = discoveryMovesLeft;
                poi.surveyOrder = surveyOrder;
            }
        });
        reader.getArray((reader) => {
            const bonus = reader.getNamespacedObject(this.masteryBonuses);
            const isUnlocked = reader.getBoolean();
            if (typeof bonus !== 'string')
                bonus.awarded = isUnlocked;
        });
    }
    encodeHexCoords(writer, hex) {
        writer.writeInt16(hex.q);
        writer.writeInt16(hex.r);
    }
    decodeHexCoords(reader, version) {
        return new HexCoords(reader.getInt16(), reader.getInt16());
    }
}
class DummyWorldMap extends WorldMap {
    constructor(namespace, localID, game) {
        super(namespace, {
            id: localID,
            name: '',
            bgTiles: {
                dimensions: {
                    x: 0,
                    y: 0
                },
                tileSize: {
                    x: 0,
                    y: 0
                },
                tilePath: '',
            },
            worldSize: {
                x: 0,
                y: 0
            },
            hexScale: {
                x: 1,
                y: 1
            },
            hexBorderColour: 'FFFFFF',
            activePOIBorderColour: 'FFFFFF',
            origin: {
                x: 0,
                y: 0
            },
            startingLocation: {
                q: 0,
                r: 0
            },
            fastTravelGroups: [],
            pointsOfInterest: [],
            hexes: [{
                coordinates: {
                    q: 0,
                    r: 0
                },
                maxSurveyLevel: 2,
                maxMasteryLevel: 2,
                requirements: [],
                travelCost: {},
                isWater: true,
            }, ],
            masteryBonuses: [],
        }, game, game.cartography);
    }
}

function generateWorldMapData() {
    const WORLD_WIDTH = 1000;
    const WORLD_HEIGHT = 1000;
    const numCols = 4;
    const hexPerCol = 3;
    const xScale = WORLD_WIDTH / (0.5 + 1.5 * numCols);
    const yScale = WORLD_HEIGHT / (HexCoords.SQRT3 * hexPerCol);
    return {
        id: 'Melvor',
        name: 'Melvor',
        bgTiles: {
            dimensions: {
                x: 1,
                y: 1
            },
            tileSize: {
                x: WORLD_WIDTH,
                y: WORLD_HEIGHT
            },
            tilePath: 'assets/media/skills/cartography/maps/',
        },
        worldSize: {
            x: WORLD_WIDTH,
            y: WORLD_HEIGHT,
        },
        hexScale: {
            x: xScale,
            y: yScale,
        },
        hexBorderColour: '',
        activePOIBorderColour: '',
        origin: {
            x: xScale,
            y: (yScale * HexCoords.SQRT3) / 2,
        },
        startingLocation: {
            q: 0,
            r: 0,
        },
        fastTravelGroups: [],
        pointsOfInterest: [],
        hexes: generateHexData(0, hexPerCol - 1, 0, numCols - 1),
        masteryBonuses: [],
    };
}
/** Generates a rectangular hex grid in data form */
function generateHexData(top, bottom, left, right) {
    const hexData = [];
    for (let q = left; q <= right; q++) {
        const q_offset = Math.floor(q / 2);
        const oddOffset = q % 2 === 0 ? 0 : 1;
        for (let r = top - q_offset; r <= bottom - q_offset - oddOffset; r++) {
            const lemons = rollInteger(0, 3);
            hexData.push({
                coordinates: {
                    q,
                    r,
                },
                maxSurveyLevel: 2,
                maxMasteryLevel: 2,
                requirements: [],
                travelCost: {
                    items: [{
                        id: "melvorD:Lemon" /* ItemIDs.Lemon */ ,
                        quantity: lemons,
                    }, ],
                },
                isWater: false,
            });
        }
    }
    return hexData;
}
//# sourceMappingURL=hexMap.js.map
checkFileVersion('?12097')