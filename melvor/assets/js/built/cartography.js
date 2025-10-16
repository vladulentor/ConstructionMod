"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class CartographyOfflineSnapshot {
    constructor(cartography) {
        /** Stores a snapshot of the total number of hexes surveyed in each WorldMap */
        this.hexesSurveyed = new Map();
        /** Stores a snapshot of the total number of hexes mastered in each WorldMap */
        this.hexesMastered = new Map();
        cartography.worldMaps.forEach((map) => {
            this.hexesSurveyed.set(map, map.fullySurveyedHexes);
            this.hexesMastered.set(map, map.masteredHexes);
        });
    }
}
class CartographyRenderQueue extends SkillRenderQueue {
    constructor() {
        super();
        /** Triggers the game to recompute the path to the currently selected hex */
        this.hexPath = false;
        /** Hexes that need their background to be updated */
        this.hexBackground = new Set();
        /** Holes in the map that need their background to be updated */
        this.mapHoles = new Set();
        /** Hexes that need their xp progress to be updated */
        this.hexProgress = new Set();
        /** Updates all hexes that are in vision range of the player */
        this.visionRange = false;
        this.hexOverview = false;
        this.hexOverviewSurvey = false;
        /** Updates item and currency quantities in the hex overview */
        this.hexOverviewQuantities = false;
        /** Updates the queue markers on the map */
        this.surveyQueue = false;
        /** Updates the position of the player marker on the World Map */
        this.playerMarker = false;
        /** Updates the markers for points of interests on the World Map */
        this.poiMarkers = new Set();
        /** Updates the mastery markers for hexes on the World Map */
        this.masteryMarkers = new Set();
        /** Updates the survey indicator on the hex currently being surveyed */
        this.surveyMarker = false;
        /** Updates the XP and interval for surveying */
        this.surveyRates = false;
        /** Updates the progress bar for paper making */
        this.paperMakingProgress = false;
        /** Renders updates for the selected paper recipe */
        this.selectedPaperRecipe = false;
        /** Renders quantities for making paper */
        this.paperMakingQuantities = false;
        /** Renders modifier rates for making paper */
        this.paperMakingRates = false;
        /** Updates the progress bar for upgrading a map */
        this.mapUpgradeProgress = false;
        /** Renders quantities for upgrading/creating maps */
        this.mapUpgradeQuantities = false;
        /** Renders modifier rates for upgrading maps */
        this.mapUpgradeRates = false;
        /** Renders the number of upgrade actions of the dig site map */
        this.mapUpgradeActions = false;
        /** Renders the refinements of the dig site map */
        this.mapRefinements = false;
        /** Updates the quantites of map refinement costs */
        this.mapRefinementQuantities = false;
        /** Updates the map creation and refinement menus for the currently selected dig site */
        this.selectedUpgradeDigSite = false;
        /** Updates the map creation and refinement menus for the currently selected map */
        this.selectedUpgradeMap = false;
        /** Updates the create map button spinner and info text */
        this.createMapSpinner = false;
        /** Updates the dig sites that are visible in the DigSiteSelectMenu */
        this.digSiteSelect = false;
        /** Updates the options on the currently open POI discovery modal */
        this.poiDiscoveryOptions = false;
        /** Updates the POI discovery button in the top overlay */
        this.poiDiscoveryBtn = false;
        /** Updates the total Hex Mastered count */
        this.hexMasteryCount = false;
    }
}
class PaperMakingRecipe extends SingleProductRecipe {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        try {
            this.baseQuantity = data.baseQuantity;
            this.costs = new FixedCosts(data.costs, game);
        } catch (e) {
            throw new DataConstructionError(PaperMakingRecipe.name, e);
        }
    }
}
class CartographyHexSurveyedEvent extends GameEvent {
    constructor(worldMap, hex, oldCount, newCount) {
        super();
        this.worldMap = worldMap;
        this.hex = hex;
        this.oldCount = oldCount;
        this.newCount = newCount;
    }
}
class CartographyPOIDiscoveredEvent extends GameEvent {
    constructor(worldMap, poi) {
        super();
        this.worldMap = worldMap;
        this.poi = poi;
    }
}
class Cartography extends Skill {
    constructor(namespace, game) {
        super(namespace, 'Cartography', game);
        this._media = "assets/media/skills/cartography/cartography.png" /* Assets.Cartography */ ;
        this.renderQueue = new CartographyRenderQueue();
        this.refinementSlotCosts = [];
        /** Modifiers that are available for each refinement slot of dig site maps */
        this.refinementModifiers = [];
        /** Convenience array of all registered travel events */
        this.allTravelEvents = [];
        /** Total weight of all registered travel events */
        this.totalTravelEventWeight = 0;
        this.BASE_TRAVEL_EVENT_CHANCE = 1 / 50;
        this.isActive = false;
        /** Current mode of surveying that is active */
        this._actionMode = 0 /* CartographyActionMode.None */ ;
        /** Queue of hexes in the currently active map to survey */
        this.surveyQueue = new LinkQueue();
        /** Shared timer used for cartography actions */
        this.actionTimer = new Timer('Skill', () => this.action());
        /** Base interval that surveying takes in [ms] */
        this.BASE_SURVEY_INTERVAL = 5000;
        /** Base interval that making paper takes in [ms] */
        this.BASE_PAPER_MAKING_INTERVAL = 5000;
        /** Base interval that upgrading maps takes in [ms] */
        this.BASE_MAP_UPGRADE_INTERVAL = 5000;
        this.activeDiscoveryModifiers = new Set();
        /** If the map creation modal is open and should receive rendering updates */
        this.modalOpen = false;
        /** If the poi discovery modal is open */
        this.discoveryModalState = 0 /* DiscoveryModalState.Closed */ ;
        /** The number of POI discovery modals that have been queued */
        this.poiModalsQueued = 0;
        /** If the go to discovery modal has been queued or is visible */
        this.goToModalQueued = false;
        /** Should the player receive retroactive POI rewards from balance changes */
        this.shouldReceiveRetroactivePOIRewards1 = false;
        /** Last travel cost multiplier computed since modifiers changed */
        this._lastTravelCostMultiplier = this.travelCostMultiplier;
        this.worldMaps = new NamespaceRegistry(game.registeredNamespaces, WorldMap.name);
        this.travelEventRegistry = new NamespaceRegistry(game.registeredNamespaces, RandomTravelEvent.name);
        this.paperRecipes = new NamespaceRegistry(game.registeredNamespaces, PaperMakingRecipe.name);
        this.hiddenPOIRenderHandler = () => this.queueHiddenPoiRenders();
    }
    get maxLevelCap() {
        return 120;
    }
    /** True if the skill is active and in a surveying mode */
    get isSurveying() {
        return ((this.isActive && this._actionMode === 1 /* CartographyActionMode.QueueSurvey */ ) ||
            this._actionMode === 2 /* CartographyActionMode.AutoSurvey */ );
    }
    get activeSkills() {
        if (!this.isActive)
            return [];
        else
            return [this];
    }
    get actionMode() {
        return this._actionMode;
    }
    isHexFirstInQueue(hex) {
        return this.surveyQueue.peek() === hex;
    }
    isHexInQueue(hex) {
        return this.surveyQueue.inQueue(hex);
    }
    /** Returns the position of a hex in the survey queue. Returns -1 if hex is not in queue. */
    getHexQueuePosition(hex) {
        return this.surveyQueue.findIndex((h) => h === hex);
    }
    /** Returns true if the hex is currently being autosurveyed */
    isAutoSurveyingHex(hex) {
        return this.autoSurveyHex === hex;
    }
    shouldShowSkillInSidebar() {
        return super.shouldShowSkillInSidebar() || this.game.currentRealm === this.game.defaultRealm;
    }
    /** Returns the hex that is currently being surveyed */
    get currentlySurveyedHex() {
        switch (this.actionMode) {
            case 1 /* CartographyActionMode.QueueSurvey */ :
                return this.surveyQueue.peek();
            case 2 /* CartographyActionMode.AutoSurvey */ :
                return this.autoSurveyHex;
            default:
                return undefined;
        }
    }
    /** The maximum max survey level a hex can have */
    static get MAX_SURVEY_LEVEL() {
        return Cartography.SURVEY_XP_PER_LEVEL.length - 1;
    }
    /** The interval that a survey action takes in [ms] */
    get surveyInterval() {
        return this.modifyInterval(this.BASE_SURVEY_INTERVAL);
    }
    /** Checks if player has Carthulu pet */
    get hasCarthuluPet() {
        const pet = game.pets.getObjectByID("melvorAoD:MapMasteryPet" /* PetIDs.Carthulu */ );
        return pet !== undefined ? this.game.petManager.isPetUnlocked(pet) : false;
    }
    /** Returns the current map that is being upgraded. Returns undefined if none is selected */
    get currentUpgradeMap() {
        var _a;
        return (_a = this.selectedMapUpgradeDigsite) === null || _a === void 0 ? void 0 : _a.selectedUpgradeMap;
    }
    /** Returns the interval of the action currently being performed in [ms] */
    get currentActionInteral() {
        return this.actionTimer.maxTicks * TICK_INTERVAL;
    }
    /** Currently active potion for this skill */
    get activePotion() {
        return this.game.potions.getActivePotionForAction(this);
    }
    registerKeyBinds() {
        game.keyboard.registerBindings(this._namespace, [{
                id: 'CART_PAN_UP',
                name: 'Pan Cartography Map Up',
                pageIDs: ["melvorAoD:Cartography" /* PageIDs.Cartography */ ],
                defaultKeys: [{
                        key: 'w',
                    },
                    {
                        key: 'ArrowUp',
                    },
                ],
                keydown: () => {
                    cartographyMap.onPanKeyDown('UP');
                },
                keyup: () => {
                    cartographyMap.onPanKeyUp('UP');
                },
            },
            {
                id: 'CART_PAN_LEFT',
                name: 'Pan Cartography Map Left',
                pageIDs: ["melvorAoD:Cartography" /* PageIDs.Cartography */ ],
                defaultKeys: [{
                        key: 'a',
                    },
                    {
                        key: 'ArrowLeft',
                    },
                ],
                keydown: () => {
                    cartographyMap.onPanKeyDown('LEFT');
                },
                keyup: () => {
                    cartographyMap.onPanKeyUp('LEFT');
                },
            },
            {
                id: 'CART_PAN_DOWN',
                name: 'Pan Cartography Map Down',
                pageIDs: ["melvorAoD:Cartography" /* PageIDs.Cartography */ ],
                defaultKeys: [{
                        key: 's',
                    },
                    {
                        key: 'ArrowDown',
                    },
                ],
                keydown: () => {
                    cartographyMap.onPanKeyDown('DOWN');
                },
                keyup: () => {
                    cartographyMap.onPanKeyUp('DOWN');
                },
            },
            {
                id: 'CART_PAN_RIGHT',
                name: 'Pan Cartography Map Right',
                pageIDs: ["melvorAoD:Cartography" /* PageIDs.Cartography */ ],
                defaultKeys: [{
                        key: 'd',
                    },
                    {
                        key: 'ArrowRight',
                    },
                ],
                keydown: () => {
                    cartographyMap.onPanKeyDown('RIGHT');
                },
                keyup: () => {
                    cartographyMap.onPanKeyUp('RIGHT');
                },
            },
            {
                id: 'CART_ZOOM_IN',
                name: 'Zoom Cartography Map In',
                pageIDs: ["melvorAoD:Cartography" /* PageIDs.Cartography */ ],
                defaultKeys: [{
                        key: '+',
                    },
                    {
                        key: '=',
                    },
                ],
                keydown: () => {
                    if (this.activeMap !== undefined)
                        cartographyMap.onZoomInDown(this.activeMap);
                },
            },
            {
                id: 'CART_ZOOM_OUT',
                name: 'Zoom Cartography Map Out',
                pageIDs: ["melvorAoD:Cartography" /* PageIDs.Cartography */ ],
                defaultKeys: [{
                    key: '-',
                }, ],
                keydown: () => {
                    if (this.activeMap !== undefined)
                        cartographyMap.onZoomOutDown(this.activeMap);
                },
            },
        ]);
    }
    registerData(namespace, data) {
        var _a, _b, _c, _d, _e, _f;
        super.registerData(namespace, data);
        (_a = data.worldMaps) === null || _a === void 0 ? void 0 : _a.forEach((mapData) => {
            this.worldMaps.registerObject(new WorldMap(namespace, mapData, this.game, this));
        });
        (_b = data.mapPortals) === null || _b === void 0 ? void 0 : _b.forEach(({
            portalA,
            portalB
        }) => {
            const mapA = this.worldMaps.getObjectByID(portalA.originWorldMap);
            if (mapA === undefined)
                throw new Error(`Error registering World Map Portal. World Map with id: ${portalA.originWorldMap} is not registered.`);
            const hexA = mapA.getHex(HexCoords.fromData(portalA.coords));
            if (hexA === undefined)
                throw new Error(`Error registering World Map Portal. ${mapA.id} does not have hex at: ${portalA.coords.q}, ${portalA.coords.r}`);
            const mapB = this.worldMaps.getObjectByID(portalB.originWorldMap);
            if (mapB === undefined)
                throw new Error(`Error registering World Map Portal. World Map with id: ${portalB.originWorldMap} is not registered.`);
            const hexB = mapB.getHex(HexCoords.fromData(portalB.coords));
            if (hexB === undefined)
                throw new Error(`Error registering World Map Portal. ${mapB.id} does not have hex at: ${portalB.coords.q}, ${portalB.coords.r}`);
            mapA.pointsOfInterest.registerObject(new PortalPOI(namespace, portalA, this.game, mapA, hexB));
            mapB.pointsOfInterest.registerObject(new PortalPOI(namespace, portalB, this.game, mapB, hexA));
        });
        (_c = data.travelEvents) === null || _c === void 0 ? void 0 : _c.forEach((eventData) => {
            this.travelEventRegistry.registerObject(new RandomTravelEvent(namespace, eventData, this.game));
        });
        (_d = data.refinementSlotCosts) === null || _d === void 0 ? void 0 : _d.forEach((costData) => {
            this.refinementSlotCosts.push(new FixedCosts(costData, this.game));
        });
        (_e = data.paperRecipes) === null || _e === void 0 ? void 0 : _e.forEach((recipeData) => {
            this.paperRecipes.registerObject(new PaperMakingRecipe(namespace, recipeData, this.game));
        });
        (_f = data.refinementModifiers) === null || _f === void 0 ? void 0 : _f.forEach((modArrayData) => {
            this.refinementModifiers.push(game.getModifierValuesFromArrayData(modArrayData));
        });
    }
    modifyData(data) {
        super.modifyData(data);
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.worldMaps.forEach((map) => map.postDataRegistration());
        this.allTravelEvents = this.travelEventRegistry.allObjects;
        this.totalTravelEventWeight = this.allTravelEvents.reduce((total, event) => total + event.weight, 0);
    }
    getErrorLog() {
        var _a, _b, _c;
        return `Is Active: ${this.isActive}
_actionMode: ${this._actionMode}
activeMap: ${(_a = this.activeMap) === null || _a === void 0 ? void 0 : _a.id}
selectedPaperRecipe: ${(_b = this.selectedPaperRecipe) === null || _b === void 0 ? void 0 : _b.id}
selectedMapUpgradeDigsite: ${(_c = this.selectedMapUpgradeDigsite) === null || _c === void 0 ? void 0 : _c.id}`;
    }
    render() {
        super.render();
        if (cartographyMap.initialized) {
            this.renderHexPath();
            this.renderVisionRange();
            this.renderHexBackgrounds();
            this.renderMapHoles();
            this.renderHexProgress();
            this.renderSurveyQueue();
            this.renderSurveyMarker();
            this.renderSurveyRates();
            this.renderMasteryMarkers();
            this.renderPlayerMarker();
            this.renderPOIMarkers();
        }
        this.renderHexOverview();
        this.renderHexOverviewQueue();
        this.renderHexOverviewQuantities();
        this.renderPaperMakingProgress();
        this.renderSelectedPaperRecipe();
        this.renderPaperMakingQuantities();
        this.renderPaperMakingRates();
        this.renderMapUpgradeProgress();
        this.renderSelectedUpgradeDigSite();
        this.renderSelectedUpgradeMap();
        this.renderMapUpgradeActions();
        this.renderMapRefinements();
        this.renderMapRefinementQuantities();
        this.renderMapUpgradeQuantities();
        this.renderMapUpgradeRates();
        this.renderCreateMapSpinner();
        this.renderDigSiteSelect();
        this.renderPOIDiscoveryOptions();
        this.renderPOIDiscoveryBtn();
        this.renderHexMasteryCount();
    }
    renderHexPath() {
        if (!this.renderQueue.hexPath)
            return;
        if (this.activeMap !== undefined) {
            this.activeMap.updateSelectedPath();
            cartographyMap.updateHexPath(this.activeMap);
            this.renderQueue.hexOverview = true;
        }
        this.renderQueue.hexPath = false;
    }
    renderVisionRange() {
        if (!this.renderQueue.visionRange)
            return;
        if (this.activeMap !== undefined)
            cartographyMap.updateVision(this.activeMap, this);
        this.renderQueue.visionRange = false;
    }
    renderHexBackgrounds() {
        if (this.renderQueue.hexBackground.size > 0) {
            if (this.activeMap !== undefined) {
                const map = this.activeMap;
                this.renderQueue.hexBackground.forEach((hex) => {
                    cartographyMap.updateHexBackground(map, hex);
                });
            }
            this.renderQueue.hexBackground.clear();
        }
    }
    renderMapHoles() {
        if (this.renderQueue.mapHoles.size === 0)
            return;
        this.renderQueue.mapHoles.forEach((hole) => {
            cartographyMap.updateHole(hole);
        });
        this.renderQueue.mapHoles.clear();
    }
    renderHexProgress() {
        if (this.renderQueue.hexProgress.size === 0)
            return;
        this.renderQueue.hexProgress.forEach((hex) => {
            cartographyMap.updateHexProgress(hex, this);
        });
        this.renderQueue.hexProgress.clear();
    }
    renderHexOverview() {
        if (!this.renderQueue.hexOverview)
            return;
        if (this.activeMap !== undefined)
            cartographyMap.updateOverview(this.activeMap, this.game, this);
        this.renderQueue.hexOverview = false;
        this.renderQueue.hexOverviewSurvey = false;
    }
    renderHexOverviewQueue() {
        if (!this.renderQueue.hexOverviewSurvey)
            return;
        if (this.activeMap !== undefined)
            cartographyMap.updateOverviewSurvey(this.activeMap, this.game, this);
        this.renderQueue.hexOverviewSurvey = false;
    }
    renderHexOverviewQuantities() {
        if (!this.renderQueue.hexOverviewQuantities)
            return;
        cartographyMap.updateOverviewQuantities(this.game);
        this.renderQueue.hexOverviewQuantities = false;
    }
    renderSurveyQueue() {
        if (!this.renderQueue.surveyQueue)
            return;
        switch (this.actionMode) {
            case 1 /* CartographyActionMode.QueueSurvey */ :
                cartographyMap.updateQueueMarkers(this.surveyQueue);
                break;
            case 2 /* CartographyActionMode.AutoSurvey */ :
                cartographyMap.updateAutoSurveyMarkers(this.autoSurveyHex === undefined ? [] : this.getNextAutoSurveyHexes(this.autoSurveyHex, 10));
                break;
            default:
                cartographyMap.updateAutoSurveyMarkers([]);
                break;
        }
        this.renderQueue.surveyQueue = false;
    }
    renderSurveyMarker() {
        if (!this.renderQueue.surveyMarker)
            return;
        cartographyMap.updateSurveyMarker(this.currentlySurveyedHex, this.actionTimer, this);
        this.renderQueue.surveyRates = false;
        this.renderQueue.surveyMarker = false;
    }
    renderSurveyRates() {
        if (!this.renderQueue.surveyRates)
            return;
        const hex = this.currentlySurveyedHex;
        if (hex !== undefined)
            cartographyMap.updateSurveyRates(this, hex);
        this.renderQueue.surveyRates = false;
    }
    renderMasteryMarkers() {
        if (this.renderQueue.masteryMarkers.size === 0)
            return;
        this.renderQueue.masteryMarkers.forEach((hex) => cartographyMap.updateMasteryMarker(hex));
        this.renderQueue.masteryMarkers.clear();
    }
    renderPlayerMarker() {
        if (!this.renderQueue.playerMarker)
            return;
        if (this.activeMap !== undefined) {
            cartographyMap.movePlayerMarker(this.activeMap.playerPosition);
        }
        this.renderQueue.playerMarker = false;
    }
    renderPOIMarkers() {
        if (this.renderQueue.poiMarkers.size === 0)
            return;
        if (this.activeMap !== undefined) {
            const map = this.activeMap;
            this.renderQueue.poiMarkers.forEach((poi) => {
                cartographyMap.updatePOIMarker(map, poi, this);
            });
        }
        this.renderQueue.poiMarkers.clear();
    }
    renderPaperMakingProgress() {
        if (!this.renderQueue.paperMakingProgress)
            return;
        if (this.isActive && this._actionMode === 3 /* CartographyActionMode.PaperMaking */ )
            cartographyMapCreateMenu.paperMakingMenu.progressBar.animateProgressFromTimer(this.actionTimer);
        else
            cartographyMapCreateMenu.paperMakingMenu.progressBar.stopAnimation();
        this.renderQueue.paperMakingProgress = false;
    }
    renderSelectedPaperRecipe() {
        if (!this.renderQueue.selectedPaperRecipe)
            return;
        if (this.selectedPaperRecipe === undefined) {
            cartographyMapCreateMenu.paperMakingMenu.unsetRecipe();
        } else {
            cartographyMapCreateMenu.paperMakingMenu.setSelectedRecipe(this, this.selectedPaperRecipe, this.game);
        }
        this.renderQueue.selectedPaperRecipe = false;
    }
    renderPaperMakingQuantities() {
        if (!this.renderQueue.paperMakingQuantities)
            return;
        cartographyMapCreateMenu.paperMakingMenu.updateQuantities(this.game);
        this.renderQueue.paperMakingQuantities = false;
    }
    renderPaperMakingRates() {
        if (!this.renderQueue.paperMakingRates)
            return;
        if (this.selectedPaperRecipe !== undefined) {
            cartographyMapCreateMenu.paperMakingMenu.updateRates(this, this.selectedPaperRecipe);
        }
        this.renderQueue.paperMakingRates = false;
    }
    renderMapUpgradeProgress() {
        if (!this.renderQueue.mapUpgradeProgress)
            return;
        if (this.isActive && this._actionMode === 4 /* CartographyActionMode.MapUpgrading */ )
            cartographyMapCreateMenu.mapUpgradeMenu.progressBar.animateProgressFromTimer(this.actionTimer);
        else
            cartographyMapCreateMenu.mapUpgradeMenu.progressBar.stopAnimation();
        this.renderQueue.mapUpgradeProgress = false;
    }
    renderMapUpgradeQuantities() {
        if (!this.renderQueue.mapUpgradeQuantities)
            return;
        cartographyMapCreateMenu.mapUpgradeMenu.updateQuantities(this.game);
        this.renderQueue.mapUpgradeQuantities = false;
    }
    renderMapUpgradeRates() {
        var _a;
        if (!this.renderQueue.mapUpgradeRates)
            return;
        if (((_a = this.selectedMapUpgradeDigsite) === null || _a === void 0 ? void 0 : _a.selectedUpgradeMap) !== undefined) {
            cartographyMapCreateMenu.mapUpgradeMenu.updateRates(this, this.selectedMapUpgradeDigsite.selectedUpgradeMap);
        }
        this.renderQueue.mapUpgradeRates = false;
    }
    renderMapUpgradeActions() {
        var _a;
        if (!this.renderQueue.mapUpgradeActions)
            return;
        if (((_a = this.selectedMapUpgradeDigsite) === null || _a === void 0 ? void 0 : _a.selectedUpgradeMap) !== undefined) {
            cartographyMapCreateMenu.updateUpgradeProgress(this.selectedMapUpgradeDigsite.selectedUpgradeMap);
        }
        this.renderQueue.mapUpgradeActions = false;
    }
    renderMapRefinements() {
        var _a;
        if (!this.renderQueue.mapRefinements)
            return;
        if (((_a = this.selectedMapUpgradeDigsite) === null || _a === void 0 ? void 0 : _a.selectedUpgradeMap) !== undefined) {
            cartographyMapCreateMenu.mapRefinementMenu.updateRefinements(this.selectedMapUpgradeDigsite.selectedUpgradeMap);
            cartographyMapCreateMenu.mapRefinementMenu.updateNewRefinement(this.selectedMapUpgradeDigsite.selectedUpgradeMap, this, this.game);
        }
        this.renderQueue.mapRefinements = false;
    }
    renderMapRefinementQuantities() {
        if (!this.renderQueue.mapRefinementQuantities)
            return;
        cartographyMapCreateMenu.mapRefinementMenu.updateQuantities(this.game);
        this.renderQueue.mapRefinementQuantities = false;
    }
    renderSelectedUpgradeDigSite() {
        if (!this.renderQueue.selectedUpgradeDigSite)
            return;
        if (this.selectedMapUpgradeDigsite === undefined) {
            cartographyMapCreateMenu.mapUpgradeMenu.unsetDigSite();
            cartographyMapCreateMenu.mapRefinementMenu.unsetDigSite();
            cartographyMapCreateMenu.digSiteSelect.setInactiveDigSite();
        } else {
            cartographyMapCreateMenu.mapUpgradeMenu.setDigSite(this.selectedMapUpgradeDigsite, this);
            cartographyMapCreateMenu.mapRefinementMenu.setDigSite(this.selectedMapUpgradeDigsite, this);
            cartographyMapCreateMenu.digSiteSelect.setActiveDigSite(this.selectedMapUpgradeDigsite);
        }
        this.renderQueue.selectedUpgradeDigSite = false;
    }
    renderSelectedUpgradeMap() {
        if (!this.renderQueue.selectedUpgradeMap)
            return;
        if (this.selectedMapUpgradeDigsite === undefined ||
            this.selectedMapUpgradeDigsite.selectedUpgradeMap === undefined) {
            cartographyMapCreateMenu.mapUpgradeMenu.unsetDigSiteMap();
            cartographyMapCreateMenu.mapRefinementMenu.unsetDigSiteMap();
        } else {
            cartographyMapCreateMenu.mapUpgradeMenu.setDigSiteMap(this.selectedMapUpgradeDigsite.selectedUpgradeMap, this, this.game);
            cartographyMapCreateMenu.mapRefinementMenu.setDigSiteMap(this.selectedMapUpgradeDigsite.selectedUpgradeMap, this, this.game);
            this.renderQueue.mapRefinements = false;
        }
        this.renderQueue.selectedUpgradeMap = false;
    }
    renderCreateMapSpinner() {
        if (!this.renderQueue.createMapSpinner)
            return;
        cartographyMap.updateSpinner(this);
        this.renderQueue.createMapSpinner = false;
    }
    renderDigSiteSelect() {
        if (!this.renderQueue.digSiteSelect)
            return;
        cartographyMapCreateMenu.digSiteSelect.updateDigSites();
        this.renderQueue.digSiteSelect = false;
    }
    renderPOIDiscoveryOptions() {
        if (!this.renderQueue.poiDiscoveryOptions)
            return;
        if (this.discoveryModalState)
            this.updateDiscoveryModal();
        this.renderQueue.poiDiscoveryOptions = false;
    }
    renderPOIDiscoveryBtn() {
        var _a;
        if (!this.renderQueue.poiDiscoveryBtn)
            return;
        cartographyMap.updatePOIDiscoveryBtn((_a = this.activeMap) === null || _a === void 0 ? void 0 : _a.undiscoveredPOIs[0]);
        this.renderQueue.poiDiscoveryBtn = false;
    }
    renderHexMasteryCount() {
        if (!this.renderQueue.hexMasteryCount || this.activeMap === undefined)
            return;
        cartographyMapMasteryMenu.setHexMasteryCount(this.activeMap);
        this.renderQueue.hexMasteryCount = false;
    }
    /** Queues up hidden pois that are set to show a marker for rendering when requirements change */
    queueHiddenPoiRenders() {
        if (this.activeMap === undefined)
            return;
        this.activeMap.markedUndiscoveredHiddenPOIs.forEach((poi) => {
            this.renderQueue.poiMarkers.add(poi);
        });
    }
    removeHiddenPOIDiscoverHandler() {
        if (this.hiddenPOIDiscoveryHandler !== undefined)
            this.game.off('requirementChange', this.hiddenPOIDiscoveryHandler);
        this.hiddenPOIDiscoveryHandler = undefined;
    }
    addHiddenPOIDiscoveryHandler() {
        if (this.activeMap === undefined)
            return;
        const poi = this.activeMap.playerPosition.pointOfInterest;
        if (poi !== undefined && !poi.isDiscovered && poi.hidden !== undefined) {
            this.hiddenPOIDiscoveryHandler = () => {
                if (!poi.isDiscovered && poi.hidden !== undefined && this.isHiddenPOIMet(poi.hidden))
                    this.discoverPOI(poi);
            };
            this.game.on('requirementChange', this.hiddenPOIDiscoveryHandler);
        }
    }
    updateHiddenPOIDiscoveryHandler() {
        this.removeHiddenPOIDiscoverHandler();
        this.addHiddenPOIDiscoveryHandler();
    }
    getPercentageIntervalModifier(action) {
        let modifier = super.getPercentageIntervalModifier(action);
        if (action instanceof PaperMakingRecipe) {
            modifier += this.game.modifiers.cartographyPaperMakingInterval;
        } else if (action instanceof ArchaeologyDigSite) {
            modifier += this.game.modifiers.cartographyMapUpgradeInterval;
        } else {
            // Default to surveying
            modifier += this.game.modifiers.cartographySurveyInterval;
        }
        return modifier;
    }
    _buildPercentageIntervalSources(action) {
        const builder = super._buildPercentageIntervalSources(action);
        if (action instanceof PaperMakingRecipe) {
            builder.addSources("melvorD:cartographyPaperMakingInterval" /* ModifierIDs.cartographyPaperMakingInterval */ );
        } else if (action instanceof ArchaeologyDigSite) {
            builder.addSources("melvorD:cartographyMapUpgradeInterval" /* ModifierIDs.cartographyMapUpgradeInterval */ );
        } else {
            builder.addSources("melvorD:cartographySurveyInterval" /* ModifierIDs.cartographySurveyInterval */ );
        }
        return builder;
    }
    /** Returns the multiplier for all hex travel costs to apply */
    get travelCostMultiplier() {
        return Math.max(1 + this.game.modifiers.cartographyTravelCost / 100, 0);
    }
    /** Gets the costs to travel to a hex */
    getTravelCosts(path) {
        const travelCosts = new Costs(this.game);
        for (let i = 0; i < path.length - 1; i++) {
            const next = path[i];
            const prev = path[i + 1];
            if (prev.canFastTravelTo(next))
                continue;
            travelCosts.addItemsAndCurrency(next.travelCost, this.travelCostMultiplier);
        }
        return travelCosts;
    }
    getFastTravelUnlockCosts(fastTravel) {
        const costs = new Costs(this.game);
        if (fastTravel.unlockCosts !== undefined)
            costs.addItemsAndCurrency(fastTravel.unlockCosts);
        return costs;
    }
    /** Checks if the hidden requirements for a POI are met */
    isHiddenPOIMet(hidden) {
        return (this.game.checkRequirements(hidden.requirements) &&
            hidden.itemsWorn.every((item) => this.game.combat.player.equipment.checkForItem(item)));
    }
    /** Callback function for when a hex is tapped */
    onHexTap(hex) {
        if (this.activeMap !== hex.map)
            return;
        if (this.activeMap.selectedHex !== undefined && !hex.isSelected) {
            cartographyMap.unHighlightHex(this.activeMap.selectedHex);
        }
        if (hex.isSelected) {
            this.deselectHexOnClick(hex);
        } else if (hex.surveyLevel > 0 || hex.inSightRange || this.currentlySurveyedHex === hex) {
            hex.map.selectHex(hex);
            cartographyMap.highlightHex(hex);
            cartographyMap.showOverview();
            cartographyMap.updateOverview(hex.map, this.game, this);
            cartographyMap.updateHexPath(hex.map);
        }
    }
    /** Callback function for deselecting the currently selected hex. */
    deselectHexOnClick(hex) {
        if (this.activeMap === undefined)
            return;
        this.activeMap.deselectHex();
        cartographyMap.unHighlightHex(hex);
        cartographyMap.hideOverview();
        cartographyMap.removeHexPath();
    }
    /** Callback function for when the travel button is clicked */
    travelOnClick() {
        if (this.game.isGolbinRaid || this.activeMap === undefined || this.activeMap.selectedHexPath === undefined)
            return;
        const path = this.activeMap.selectedHexPath;
        this.movePlayer(path, false);
        this.render();
    }
    /** Attempts to move the player along the given path */
    movePlayer(path, ignoreCosts) {
        var _a;
        if (this.game.isGolbinRaid || this.activeMap === undefined)
            return;
        if (!ignoreCosts) {
            const costs = this.getTravelCosts(path);
            if (!costs.checkIfOwned())
                return;
            costs.consumeCosts();
            costs.recordSkillCurrencyStats(this, 1 /* SkillCurrencyStats.Spent */ );
            costs.recordSkillCurrencyStats(this, 3 /* SkillCurrencyStats.SpentTravelling */ );
            costs.recordBulkItemStat(this.game.stats.Cartography, 16 /* CartographyStats.TravelItemsUsed */ );
        }
        const destHex = path[0];
        const actionEvent = new CartographyTravelEvent(this, destHex);
        actionEvent.interval = this.currentActionInteral;
        // Remove hidden poi handler before any requirement changes can occur
        this.removeHiddenPOIDiscoverHandler();
        // Roll for travel events
        this.rollForTravelEvent(path);
        this.game.stats.Cartography.add(19 /* CartographyStats.HexesTravelled */ , path.length - 1);
        this._events.emit('travel', actionEvent);
        // Perform the move
        this.activeMap.setPlayerPosition(destHex);
        // Decrease Active Modifiers
        this.activeDiscoveryModifiers.forEach((discoveryModifier) => {
            discoveryModifier.movesLeft--;
            if (discoveryModifier.movesLeft === 0)
                this.activeDiscoveryModifiers.delete(discoveryModifier);
        });
        // Check for hidden and undiscovered POIs
        if (destHex.pointOfInterest !== undefined &&
            !destHex.pointOfInterest.isDiscovered &&
            (destHex.pointOfInterest.hidden === undefined || this.isHiddenPOIMet((_a = destHex.pointOfInterest) === null || _a === void 0 ? void 0 : _a.hidden))) {
            this.discoverPOI(destHex.pointOfInterest);
        }
        // Recompute Modifiers for active Modifiers
        this.computeProvidedStats(true);
        // Re-add hidden poi handler if needed, after any requirement changes have occured
        this.updateHiddenPOIDiscoveryHandler();
        // Perform rendering updates
        this.renderQueue.visionRange = true;
        this.renderQueue.playerMarker = true;
        this.renderQueue.hexPath = true;
        // If the player is currently surveying, stop the action
        if (this.isSurveying)
            this.stop();
    }
    /** Callback function for when the auto survey button is clicked */
    autoSurveyOnClick(hex) {
        if (this.isActive && this._actionMode === 2 /* CartographyActionMode.AutoSurvey */ && this.autoSurveyHex === hex) {
            this.stop();
            return;
        }
        if (this.isActive && !this.stop())
            return;
        this.startAutoSurvey(hex);
    }
    /** Callback function for when the survey/queue button is clicked */
    surveyOnClick(hex) {
        if (this.isActive && this._actionMode === 1 /* CartographyActionMode.QueueSurvey */ ) {
            if (this.surveyQueue.peek() === hex) {
                // The currently surveyed hex is the one in the queue
                this.surveyQueue.dequeue();
                this.validateSurveyQueue();
                if (this.surveyQueue.isEmpty)
                    this.stop();
                else
                    this.startSurveyTimer();
            } else if (this.surveyQueue.inQueue(hex)) {
                // The hex is in the queue, but not currently being surveyed
                this.surveyQueue.delete(hex);
                this.validateSurveyQueue();
                if (this.surveyQueue.isEmpty)
                    this.stop();
            } else {
                // The hex is not in the queue
                this.surveyQueue.queue(hex);
            }
            this.renderQueue.surveyQueue = true;
            this.renderQueue.hexOverviewSurvey = true;
            return;
        }
        if (this.isActive && !this.stop())
            return;
        this.surveyQueue.queue(hex);
        this.startSurveyQueue();
    }
    /** Checks that all hexes in the queue have a surveyed or queue neighbour, and removes them from the queue if not */
    validateSurveyQueue() {
        const beforeSet = new Set();
        this.surveyQueue.forEachForward((hex) => {
            if (!hex.someNeighbour((neighbour) => neighbour.isFullySurveyed || beforeSet.has(neighbour)))
                this.surveyQueue.delete(hex);
            else
                beforeSet.add(hex);
        });
    }
    /** Callback function for unlocking fast travel on a poi */
    unlockFastTravelOnClick(poi) {
        var _a;
        if (((_a = poi.fastTravel) === null || _a === void 0 ? void 0 : _a.unlockCosts) === undefined)
            throw new Error('POI does not have fast travel, or does not have unlock costs');
        const costs = new Costs(this.game);
        costs.addItemsAndCurrency(poi.fastTravel.unlockCosts);
        if (!costs.checkIfOwned())
            return;
        costs.consumeCosts();
        poi.fastTravel.isUnlocked = true;
        this.renderQueue.hexOverview = true;
        this.renderQueue.hexPath = true;
    }
    /** Callback function for when the Go To ${worldMap} button is clicked*/
    goToWorldMapOnClick(poi) {
        return __awaiter(this, void 0, void 0, function*() {
            if (this.game.isGolbinRaid)
                return;
            if (this.isActive &&
                (this.actionMode === 2 /* CartographyActionMode.AutoSurvey */ || this.actionMode === 1 /* CartographyActionMode.QueueSurvey */ ) &&
                !this.stop())
                return;
            cartographyMap.showLoading();
            this.activeMap = poi.destination.map;
            this.activeMap.setPlayerPosition(poi.destination);
            this.renderQueue.hexOverview = true;
            const destPOI = poi.destination.pointOfInterest;
            if (destPOI !== undefined &&
                !destPOI.isDiscovered &&
                (destPOI.hidden === undefined || this.isHiddenPOIMet(destPOI.hidden)))
                this.discoverPOI(destPOI);
            this.updateHiddenPOIDiscoveryHandler();
            yield Promise.all([cartographyMap.loadWorldMap(this.activeMap, this), delayPromise(1000)]);
            cartographyMap.hideLoading();
        });
    }
    /** Callback function for returning to the player's current location on the map */
    goToPlayerOnClick() {
        if (this.activeMap === undefined)
            return;
        cartographyMap.animateMoveToHex(this.activeMap.playerPosition, 1);
    }
    /** Callback function for when a map filter setting is changed */
    mapFilterOnChange(filter, newValue) {
        if (this.activeMap === undefined)
            return;
        this.activeMap.filterSettings.set(filter, newValue);
        switch (filter) {
            case 0 /* MapFilterType.PlayerMarker */ :
                cartographyMap.togglePlayerMarker(newValue);
                break;
            case 6 /* MapFilterType.HexGrid */ :
                cartographyMap.updateAllHexBackgrounds(this.activeMap);
                break;
            case 8 /* MapFilterType.HexProgress */ :
                cartographyMap.updateAllHexProgress(this.activeMap, this);
                break;
            case 7 /* MapFilterType.MasteryMarkers */ :
                cartographyMap.updateAllMasteryMarkers(this.activeMap);
                break;
            default:
                cartographyMap.updatePOIMarkers(this.activeMap, this);
        }
    }
    /** Callback function for when a fast travel group visibility is toggled */
    fastTravelGroupOnChange(group, newValue) {
        if (this.activeMap === undefined)
            return;
        this.activeMap.filterSettings.setGroup(group, newValue);
        cartographyMap.updatePOIMarkers(this.activeMap, this);
    }
    /** Method for when the disableHexGridOutsideVision setting is changed */
    onHexGridSettingChange() {
        if (this.activeMap !== undefined && cartographyMap.initialized)
            cartographyMap.updateAllHexBackgrounds(this.activeMap);
    }
    /** Starts the survey timer at the player's current survey interval */
    startSurveyTimer() {
        this.actionTimer.start(this.surveyInterval);
        this.renderQueue.surveyMarker = true;
    }
    /** Starts automatically surveying hexes */
    startAutoSurvey(hex) {
        const canStart = !this.game.idleChecker(this);
        if (canStart) {
            if (!this.game.currentGamemode.enableInstantActions) {
                this.isActive = true;
                this._actionMode = 2 /* CartographyActionMode.AutoSurvey */ ;
                this.autoSurveyHex = hex;
                this.renderQueue.hexOverviewSurvey = true;
                this.renderQueue.surveyQueue = true;
                this.game.renderQueue.activeSkills = true;
                this.game.activeAction = this;
                this.startSurveyTimer();
                this.game.scheduleSave();
            } else {
                this.isActive = true;
                this._actionMode = 2 /* CartographyActionMode.AutoSurvey */ ;
                this.autoSurveyHex = hex;
                this.renderQueue.hexOverviewSurvey = true;
                this.renderQueue.surveyQueue = true;
                this.game.renderQueue.activeSkills = true;
                this.game.activeAction = this;
                const actionsToPerform = this.game.modifiers.getInstantActionsToPerform();
                for (let i = 0; i < actionsToPerform; i++) {
                    this.action();
                    this.game.township.tickTimerOnClick();
                }
                this.stop();
            }
        }
        return canStart;
    }
    /** Starts surveying a hex */
    startSurveyQueue() {
        const canStart = !this.game.idleChecker(this);
        if (canStart) {
            if (!this.game.currentGamemode.enableInstantActions) {
                this.isActive = true;
                this._actionMode = 1 /* CartographyActionMode.QueueSurvey */ ;
                this.renderQueue.hexOverviewSurvey = true;
                this.game.renderQueue.activeSkills = true;
                this.game.activeAction = this;
                this.startSurveyTimer();
                this.game.scheduleSave();
            } else {
                this.isActive = true;
                this._actionMode = 1 /* CartographyActionMode.QueueSurvey */ ;
                this.renderQueue.hexOverviewSurvey = true;
                this.game.renderQueue.activeSkills = true;
                this.game.activeAction = this;
                const actionsToPerform = this.game.modifiers.getInstantActionsToPerform();
                for (let i = 0; i < actionsToPerform; i++) {
                    this.action();
                    this.game.township.tickTimerOnClick();
                }
                this.stop();
            }
        }
        return canStart;
    }
    /** Method for when the actionTimer is completed */
    action() {
        switch (this._actionMode) {
            case 1 /* CartographyActionMode.QueueSurvey */ :
                this.surveyActionQueue();
                break;
            case 2 /* CartographyActionMode.AutoSurvey */ :
                this.surveyAuto();
                break;
            case 3 /* CartographyActionMode.PaperMaking */ :
                this.paperMakingAction();
                break;
            case 4 /* CartographyActionMode.MapUpgrading */ :
                this.mapUpgradeAction();
                break;
        }
    }
    /** Rolls for rewards common for skill actions */
    addCommonRewards(rewards, actionLevel, realm) {
        this.rollForRareDrops(actionLevel, rewards);
        this.rollForPets(this.currentActionInteral);
        if (realm !== undefined)
            this.rollForAncientRelics(actionLevel, realm);
        else
            this.rollForAncientRelics(actionLevel, game.defaultRealm);
        this.game.summoning.rollMarksForSkill(this, this.currentActionInteral, realm);
    }
    /** Computes the base Skill XP gained per survey action of a hex */
    getSkillXPForHexSurveyAction(hex) {
        const multi = hex.isFullySurveyed ? 2.1 : 1;
        return hex.cartographyLevel * 2.6 * multi;
    }
    /** Finds the next hex to autosurvey, starting from hex. Returns undefined if no suitable hex is found. */
    getNextAutoSurveyHex(hex, nextHexes = []) {
        const map = hex.map;
        let nextCoords = hex;
        let nextHex = undefined;
        let lastDistance = HexCoords.distance(nextCoords, map.playerPosition);
        let expandSearch = true;
        while (nextHex === undefined) {
            nextCoords = HexCoords.getNextInSpiral(nextCoords, map.playerPosition);
            // If we complete an entire ring with the same distance, and the coordinates all either: Have no hex, a hex that is not fully surveyed, then loop back to center.
            const nextDistance = HexCoords.distance(nextCoords, map.playerPosition);
            if (lastDistance !== nextDistance) {
                if (!expandSearch) {
                    nextCoords = map.playerPosition;
                    lastDistance = 0;
                } else {
                    lastDistance = nextDistance;
                }
                expandSearch = false;
            }
            nextHex = map.getHex(nextCoords);
            // Early Exit if we traversed every hex
            if (nextHex === hex) {
                nextHex = undefined;
                break;
            }
            if (nextHex !== undefined) {
                if (nextHex.isFullySurveyed)
                    expandSearch = true;
                const hasSurveyedNeighbour = nextHex.someNeighbour((hex) => {
                    return hex.isFullySurveyed || nextHexes.includes(hex);
                });
                if (nextHex.isMaxLevel ||
                    !this.game.checkRequirements(nextHex.requirements) ||
                    !hasSurveyedNeighbour ||
                    nextHexes.includes(nextHex))
                    nextHex = undefined;
            }
        }
        return nextHex;
    }
    /** Finds the next ${count} hexes to autosurvey, startng from hex. Returns less than count if not enough suitable hexes are found */
    getNextAutoSurveyHexes(hex, count) {
        const nextHexes = [];
        let nextHex = hex;
        for (let i = 0; i < count; i++) {
            nextHexes.push(nextHex);
            nextHex = this.getNextAutoSurveyHex(nextHex, nextHexes);
            if (nextHex === undefined)
                break;
        }
        return nextHexes;
    }
    /** Processes the auto survey */
    surveyAuto() {
        if (this.autoSurveyHex === undefined)
            throw new Error('No Hex selected for auto survey.');
        const actionEvent = new CartographySurveyEvent(this, this.autoSurveyHex);
        actionEvent.interval = this.currentActionInteral;
        this.surveyHex(this.autoSurveyHex);
        this.game.stats.Cartography.inc(0 /* CartographyStats.SurveyActions */ );
        this.game.stats.Cartography.add(1 /* CartographyStats.TimeSpentSurveying */ , this.currentActionInteral);
        this._events.emit('survey', actionEvent);
        if (this.autoSurveyHex.isMaxLevel) {
            const nextHex = this.getNextAutoSurveyHex(this.autoSurveyHex);
            if (nextHex === undefined)
                this.stop();
            else {
                this.autoSurveyHex = nextHex;
                this.renderQueue.hexProgress.add(nextHex);
                this.renderQueue.surveyQueue = true;
                this.startSurveyTimer();
            }
        } else {
            this.startSurveyTimer();
        }
    }
    /** Processes the next hex in the survey queue */
    surveyActionQueue() {
        var _a;
        const hex = this.surveyQueue.peek();
        if (hex === undefined)
            throw new Error('Survey Queue is empty');
        const actionEvent = new CartographySurveyEvent(this, hex);
        actionEvent.interval = this.currentActionInteral;
        this.surveyHex(hex);
        this.game.stats.Cartography.inc(0 /* CartographyStats.SurveyActions */ );
        this.game.stats.Cartography.add(1 /* CartographyStats.TimeSpentSurveying */ , this.currentActionInteral);
        this._events.emit('survey', actionEvent);
        if (hex.isMaxLevel) {
            this.surveyQueue.dequeue();
            this.renderQueue.surveyQueue = true;
        }
        if (this.surveyQueue.isEmpty)
            this.stop();
        else {
            if (this.surveyQueue.peek() === ((_a = this.activeMap) === null || _a === void 0 ? void 0 : _a.selectedHex))
                this.renderQueue.hexOverviewSurvey = true;
            this.startSurveyTimer();
        }
    }
    /** Performs the survey operation on a single hex */
    surveyHex(hex) {
        const rewards = new Rewards(this.game);
        let surveyXPToAdd = Cartography.BASE_SURVEY_XP;
        surveyXPToAdd *= 1 + this.game.modifiers.cartographySurveyXP / 100;
        const oldLevel = hex.surveyLevel;
        const levelUp = hex.addSurveyXP(surveyXPToAdd);
        this.renderQueue.hexProgress.add(hex);
        if (levelUp)
            this.renderQueue.hexBackground.add(hex);
        rewards.addXP(this, this.getSkillXPForHexSurveyAction(hex));
        this.addCommonRewards(rewards, hex.cartographyLevel);
        rewards.giveRewards();
        if (hex.isSelected)
            this.renderQueue.hexOverview = true;
        if (oldLevel < hex.maxSurveyLevel && hex.isFullySurveyed)
            this.onHexFullSurvey(hex);
        if (oldLevel < hex.maxMasteryLevel && hex.isMastered)
            this.onHexMastery(hex);
    }
    /** Processes stat, path and poi changes triggers by fully surveying a hex */
    onHexFullSurvey(hex) {
        hex.map.fullySurveyedHexes++;
        hex.holes.forEach((hole) => {
            hole.surveyedHexes.push(hex);
            if (hole.surveyedHexes.length === hole.hexes.length)
                this.renderQueue.mapHoles.add(hole);
        });
        const poi = hex.pointOfInterest;
        if (poi !== undefined && poi.hidden === undefined) {
            poi.surveyOrder = hex.map.fullySurveyedHexes;
            hex.map.undiscoveredPOIs.push(poi);
            this.renderQueue.poiDiscoveryBtn = true;
            this.renderQueue.poiMarkers.add(poi);
            this.queueGoToDiscoveryModal(true);
        }
        if (hex.map.isFullySurveyed) {
            this.onMapFullSurvey(hex.map);
        }
        this.renderQueue.hexPath = true;
        this.renderQueue.poiDiscoveryOptions = true;
        this._events.emit('hexSurveyed', new CartographyHexSurveyedEvent(hex.map, hex, hex.map.fullySurveyedHexes - 1, hex.map.fullySurveyedHexes));
        this.game.queueRequirementRenders();
    }
    /** Called when a hex becomes mastered. Awards map mastery bonuses that are unlocked */
    onHexMastery(hex) {
        const map = hex.map;
        map.masteredHexes++;
        let statsUnlocked = false;
        for (let i = map.unlockedMasteryBonuses; i < map.sortedMasteryBonuses.length; i++) {
            const bonus = map.sortedMasteryBonuses[i];
            if (map.masteredHexes >= bonus.masteredHexes) {
                this.awardMasteryBonus(map, bonus);
                map.unlockedMasteryBonuses++;
                if (bonus.stats.hasStats)
                    statsUnlocked = true;
            } else {
                break;
            }
        }
        if (statsUnlocked)
            this.computeProvidedStats(true);
        this.renderQueue.masteryMarkers.add(hex);
        this.renderQueue.hexMasteryCount = true;
        if (map.isMastered) {
            this.onMapFullMastery(map);
        }
    }
    /** Called when all hexes on a map become fully surveyed */
    onMapFullSurvey(map) {
        map.getHexesInRange(map.playerPosition, map.surveyRange).forEach((hex) => this.renderQueue.hexProgress.add(hex));
        this.queueMapSurveyModal(map);
        // Unlock Survey Pet
        this.checkForHexPetUnlock(map);
    }
    checkForHexPetUnlock(map) {
        if (map.id === "melvorAoD:Melvor" /* CartographyWorldMapIDs.Melvor */ && map.isFullySurveyed)
            this.game.petManager.unlockPetByID("melvorAoD:Hex" /* PetIDs.Hex */ );
    }
    /** Queues a congratulatory modal for fully surveying a map, and tells the player they unlocked hex mastery */
    queueMapSurveyModal(map) {
        const modalBody = createElement('div', {
            className: 'justify-vertical-center'
        });
        createElement('h5', {
            text: templateLangString('FULLY_SURVEYED_MAP', {
                worldName: map.name
            }),
            className: 'font-w400 mb-2',
            parent: modalBody,
        });
        createElement('h5', {
            text: getLangString('HEX_MASTERY_UNLOCKED'),
            className: 'text-warning font-w600 font-size-lg mb-2',
            parent: modalBody,
        });
        createElement('p', {
            text: getLangString('HEX_MASTERY_INFO'),
            className: 'text-info mb-0',
            parent: modalBody,
        });
        addModalToQueue({
            titleText: getLangString('COMPLETION_CONGRATS'),
            imageUrl: this.media,
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: true,
            imageWidth: 128,
            imageHeight: 128,
        });
    }
    /** Called when all hexes on a map become mastered */
    onMapFullMastery(map) {
        this.queueMapMasteryModal(map);
    }
    /** Queues a congratulatory modal for mastering a map. */
    queueMapMasteryModal(map) {
        const modalBody = createElement('div', {
            className: 'justify-vertical-center'
        });
        createElement('h5', {
            text: templateLangString('FULLY_MASTERED_MAP', {
                worldName: map.name
            }),
            className: 'font-w400 mb-0',
            parent: modalBody,
        });
        addModalToQueue({
            titleText: getLangString('COMPLETION_CONGRATS'),
            imageUrl: this.media,
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: true,
            imageWidth: 128,
            imageHeight: 128,
        });
    }
    /**
     * Awards a mastery bonus from a map to the player. Does not recompute provided stats.
     * @param map The map that the bonus belongs to
     * @param bonus The bonus to give
     */
    awardMasteryBonus(map, bonus) {
        var _a, _b, _c;
        this.queueMasteryBonusModal(map, bonus);
        (_a = bonus.pets) === null || _a === void 0 ? void 0 : _a.forEach((pet) => {
            this.game.petManager.unlockPet(pet);
        });
        (_b = bonus.currencies) === null || _b === void 0 ? void 0 : _b.forEach(({
            currency,
            quantity
        }) => currency.add(quantity));
        (_c = bonus.items) === null || _c === void 0 ? void 0 : _c.forEach(({
            item,
            quantity
        }) => {
            this.game.bank.addItem(item, quantity, false, true, true, true, `Skill.${this.id}`);
        });
        bonus.awarded = true;
    }
    /**
     * Queues a modal for unlocking a new mastery bonus for a map
     * @param map The Map the bonus belongs to
     * @param bonus The bonus unlocked
     */
    queueMasteryBonusModal(map, bonus) {
        const modalBody = createElement('div', {
            className: 'justify-vertical-center'
        });
        createElement('h5', {
            text: templateLangString('UNLOCKED_HEX_MASTERY_FOR_MAP', {
                worldName: map.name,
            }),
            className: 'font-w400 mb-0',
            parent: modalBody,
        });
        if (bonus.stats.hasStats) {
            createElement('h5', {
                text: getLangString('PERMANENT_BONUS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            modalBody.append(...bonus.stats.describeAsSpans());
        }
        const rewardNodes = this.createItemCurrencyNodes(bonus);
        if (rewardNodes.length > 0) {
            createElement('h5', {
                text: getLangString('REWARDS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            modalBody.append(...rewardNodes);
        }
        if (bonus.pets !== undefined) {
            createElement('h5', {
                text: bonus.pets.length > 1 ? getLangString('PETS_UNLOCKED') : getLangString('COMPLETION_LOG_PETS_UNLOCKED'),
                className: 'font-w600 font-size-lg text-warning mb-0 mt-2',
                parent: modalBody,
            });
            bonus.pets.forEach((pet) => {
                const petSpan = createElement('span', {
                    className: 'text-success',
                    parent: modalBody
                });
                petSpan.append(createElement('img', {
                    className: 'skill-icon-md mr-1',
                    attributes: [
                        ['src', pet.media]
                    ]
                }), pet.name);
            });
        }
        addModalToQueue({
            titleText: getLangString('MASTERY_BONUS_UNLOCKED'),
            imageUrl: this.media,
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: true,
            imageWidth: 128,
            imageHeight: 128,
        });
    }
    /** Triggers the discovery process for a Point of Interest, adding modifiers and rewards */
    discoverPOI(poi) {
        const map = poi.hex.map;
        map.discoveredPOIs.push(poi);
        if (poi.hidden !== undefined && poi.hidden.showMarker)
            map.markedUndiscoveredHiddenPOIs.delete(poi);
        const undiscoveredIdx = map.undiscoveredPOIs.findIndex((p) => p === poi);
        if (undiscoveredIdx !== -1)
            map.undiscoveredPOIs.splice(undiscoveredIdx, 1);
        this.renderQueue.poiDiscoveryBtn = true;
        poi.isDiscovered = true;
        if (poi.hex.isPlayerHere)
            this.updateHiddenPOIDiscoveryHandler();
        if (poi.discoveryModifiers !== undefined) {
            poi.discoveryModifiers.movesLeft = poi.discoveryModifiers.moves;
            this.activeDiscoveryModifiers.add(poi.discoveryModifiers);
        }
        if (poi.activeStats.hasStats) {
            if (poi.hex.isPlayerHere) {
                const posMult = this.hasCarthuluPet ? 2 : 1;
                this.providedStats.addStatObject(poi, poi.activeStats, 1, posMult);
            }
            this.renderQueue.hexBackground.add(poi.hex);
        }
        this.addPoiModifiers(poi);
        this.game.combat.computeAllStats();
        if (poi.discoveryRewards !== undefined) {
            const rewards = new Rewards(this.game);
            rewards.addItemsAndCurrency(poi.discoveryRewards);
            rewards.giveRewards(true);
        }
        if (poi instanceof Watchtower)
            this.processWatchTower(poi);
        this.renderQueue.poiMarkers.add(poi);
        if (poi.hex.isSelected)
            this.renderQueue.hexOverview = true;
        if (poi instanceof DigSitePOI) {
            // Create a free initial average excellent map
            poi.digSite.maps.push(DigSiteMap.createAverageMap(poi.digSite, this.game, this, DigSiteMap.tiers[2]));
            if (poi.digSite.maps.length === 1)
                poi.digSite.selectedUpgradeIndex = 0; // No need to render this, as the player wouldn't have access to map making for the poi yet
            if (poi.digSite === this.selectedMapUpgradeDigsite)
                this.renderQueue.selectedUpgradeDigSite = true;
            this.renderQueue.digSiteSelect = true;
            if (this.game.archaeology !== undefined) {
                this.game.archaeology.renderQueue.digSiteVisibility = true;
                this.game.archaeology.renderQueue.mapSelection.add(poi.digSite);
            }
        }
        this.game.woodcutting.renderQueue.treeUnlocks = true;
        this.queuePOIDiscoveryModal(poi);
        this.renderQueue.poiDiscoveryOptions = true;
        this._events.emit('poiDiscovered', new CartographyPOIDiscoveredEvent(map, poi));
        this.game.queueRequirementRenders();
    }
    /** Processes a watch tower, surveying all the tiles around it */
    processWatchTower(poi) {
        const hexes = poi.hex.map.getHexesInRange(poi.hex, poi.towerRange);
        hexes.forEach((hex) => {
            if (hex.isFullySurveyed)
                return;
            const oldLevel = hex.surveyLevel;
            const xpToAdd = Hex.getXPFromLevel(hex.maxSurveyLevel) - hex.surveyXP;
            hex.addSurveyXP(xpToAdd);
            if (this.actionMode === 1 /* CartographyActionMode.QueueSurvey */ && this.surveyQueue.inQueue(hex))
                this.surveyQueue.delete(hex);
            this.renderQueue.hexBackground.add(hex);
            if (hex.isSelected)
                this.renderQueue.hexOverview = true;
            this.onHexFullSurvey(hex);
            if (oldLevel < hex.maxMasteryLevel && hex.isMastered)
                this.onHexMastery(hex);
        });
    }
    /** When the survey range changes, due to either modifiers or the player moving handle stopping the action/ adjusting queue */
    onSurveyRangeChange() {
        if (!this.isActive)
            return;
        switch (this._actionMode) {
            case 1 /* CartographyActionMode.QueueSurvey */ :
                {
                    const originalSize = this.surveyQueue.size;
                    const firstInQueue = this.surveyQueue.peek();
                    const beforeSet = new Set();
                    this.surveyQueue.forEachForward((hex) => {
                        if (!hex.inSurveyRange ||
                            !hex.someNeighbour((neighbour) => neighbour.isFullySurveyed || beforeSet.has(neighbour))) {
                            if (hex.isSelected)
                                this.renderQueue.hexOverviewSurvey = true;
                            this.surveyQueue.delete(hex);
                        } else {
                            beforeSet.add(hex);
                        }
                    });
                    if (this.surveyQueue.isEmpty)
                        this.stop();
                    else if (firstInQueue !== this.surveyQueue.peek())
                        this.startSurveyTimer();
                    if (originalSize !== this.surveyQueue.size)
                        this.renderQueue.surveyQueue = true;
                }
                break;
        }
    }
    /** Queues up a notification that the player has no ingredients to make paper */
    paperIngredientNotify() {
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, getLangString('TOASTS_MATERIALS_MAKE_PAPER'), 'danger'],
        });
    }
    /** Callback function for selecting a paper recipe */
    selectPaperRecipeOnClick(recipe) {
        // Stop if the player is making paper and selects a different recipe
        if (recipe !== this.selectedPaperRecipe &&
            this.isActive &&
            this._actionMode === 3 /* CartographyActionMode.PaperMaking */ &&
            !this.stop())
            return;
        this.selectedPaperRecipe = recipe;
        this.renderQueue.selectedPaperRecipe = true;
        this.renderQueue.paperMakingRates = true;
    }
    /** Callback function for the make/stop paper button */
    makePaperOnClick() {
        if (this.selectedPaperRecipe === undefined)
            return;
        if (this.isActive) {
            if (this._actionMode === 3 /* CartographyActionMode.PaperMaking */ ) {
                this.stop();
                return;
            } else if (!this.stop())
                return;
        }
        if (this.getPaperMakingCosts(this.selectedPaperRecipe).checkIfOwned()) {
            this.startMakingPaper(this.selectedPaperRecipe);
        } else {
            this.paperIngredientNotify();
        }
    }
    /** Starts making paper with the interval for the given recipe */
    startMakingPaper(recipe) {
        const canStart = !this.game.idleChecker(this);
        if (canStart) {
            if (!this.game.currentGamemode.enableInstantActions) {
                this.isActive = true;
                this._actionMode = 3 /* CartographyActionMode.PaperMaking */ ;
                this.game.renderQueue.activeSkills = true;
                this.renderQueue.createMapSpinner = true;
                this.game.activeAction = this;
                this.startPaperMakingTimer(recipe);
                this.game.scheduleSave();
            } else {
                this.isActive = true;
                this._actionMode = 3 /* CartographyActionMode.PaperMaking */ ;
                this.game.renderQueue.activeSkills = true;
                this.renderQueue.createMapSpinner = true;
                this.game.activeAction = this;
                const actionsToPerform = this.game.modifiers.getInstantActionsToPerform();
                for (let i = 0; i < actionsToPerform; i++) {
                    this.action();
                    this.game.township.tickTimerOnClick();
                }
                this.stop();
            }
        }
        return canStart;
    }
    /** Gets the costs for making paper with a given recipe */
    getPaperMakingCosts(recipe) {
        const costs = new Costs(this.game);
        costs.addItemsAndCurrency(recipe.costs);
        return costs;
    }
    /** Gets the interval in [ms] for making paper with a given recipe */
    getPaperMakingInterval(recipe) {
        return this.modifyInterval(this.BASE_PAPER_MAKING_INTERVAL, recipe);
    }
    /** Starts the action timer for making paper with a given recipe */
    startPaperMakingTimer(recipe) {
        this.actionTimer.start(this.getPaperMakingInterval(recipe));
        this.renderQueue.paperMakingProgress = true;
    }
    /** Performs the action for creating paper */
    paperMakingAction() {
        if (this.selectedPaperRecipe === undefined)
            throw new Error('No paper making recipe is selected');
        const actionEvent = new CartographyPaperMakingEvent(this, this.selectedPaperRecipe);
        actionEvent.interval = this.currentActionInteral;
        const paperCosts = this.getPaperMakingCosts(this.selectedPaperRecipe);
        if (!paperCosts.checkIfOwned) {
            this.paperIngredientNotify();
            this.stop();
            return;
        }
        // Add Rewards
        const rewards = new Rewards(this.game);
        const paperQuantity = this.modifyPrimaryProductQuantity(this.selectedPaperRecipe.product, this.selectedPaperRecipe.baseQuantity, this.selectedPaperRecipe);
        actionEvent.productQuantity = paperQuantity;
        rewards.addItem(this.selectedPaperRecipe.product, paperQuantity);
        this.addCurrencyFromPrimaryProductGain(rewards, this.selectedPaperRecipe.product, paperQuantity, this.selectedPaperRecipe);
        rewards.addXP(this, this.selectedPaperRecipe.baseExperience, this.selectedPaperRecipe);
        this.addCommonRewards(rewards, this.selectedPaperRecipe.level, this.selectedPaperRecipe.realm);
        const allGiven = !rewards.giveRewards();
        // Consume Costs
        if (rollPercentage(this.getPreservationChance(this.selectedPaperRecipe))) {
            paperCosts.recordBulkItemStat(this.game.stats.Cartography, 6 /* CartographyStats.LogsPreserved */ );
        } else {
            paperCosts.consumeCosts();
            paperCosts.recordBulkItemStat(this.game.stats.Cartography, 5 /* CartographyStats.LogsUsed */ );
        }
        // Record Stats
        this.game.stats.Cartography.inc(2 /* CartographyStats.PaperMakingActions */ );
        this.game.stats.Cartography.add(4 /* CartographyStats.PaperMade */ , paperQuantity);
        this.game.stats.Cartography.add(3 /* CartographyStats.TimeSpentMakingPaper */ , this.currentActionInteral);
        this._events.emit('madePaper', actionEvent);
        const continueSkill = allGiven || this.game.settings.continueIfBankFull;
        const nextPaperCosts = this.getPaperMakingCosts(this.selectedPaperRecipe);
        if (nextPaperCosts.checkIfOwned() && continueSkill) {
            this.startPaperMakingTimer(this.selectedPaperRecipe);
        } else {
            this.paperIngredientNotify();
            this.stop();
        }
    }
    /** Queues up a notification that the player has no ingredients to upgrade maps */
    mapIngredientNotify() {
        this.game.combat.notifications.add({
            type: 'Player',
            args: [this, getLangString('TOASTS_MATERIALS_UPGRADE_MAP'), 'danger'],
        });
    }
    /** Callback function for when the create map button is clicked */
    createMapOnClick() {
        $('#cartography-map-creation-modal').modal('show');
        this.queueModalProgressBarRenders();
    }
    queueModalProgressBarRenders() {
        if (this.isActive) {
            switch (this.actionMode) {
                case 3 /* CartographyActionMode.PaperMaking */ :
                    this.renderQueue.paperMakingProgress = true;
                    break;
                case 4 /* CartographyActionMode.MapUpgrading */ :
                    this.renderQueue.mapUpgradeProgress = true;
                    break;
            }
        }
    }
    /** Callback function for when a dig site is selected in the map creation menu */
    selectDigSiteOnClick(digSite) {
        if (digSite !== this.selectedMapUpgradeDigsite &&
            this.isActive &&
            this._actionMode === 4 /* CartographyActionMode.MapUpgrading */ &&
            !this.stop())
            return;
        cartographyMapCreateMenu.toggleDigSiteSelect();
        this.selectedMapUpgradeDigsite = digSite;
        this.renderQueue.selectedUpgradeDigSite = true;
        this.renderQueue.selectedUpgradeMap = true;
        this.renderQueue.mapUpgradeRates = true;
    }
    /** Callback function for selecting a digsite map */
    selectDigSiteMapOnClick(mapIndex) {
        if (this.selectedMapUpgradeDigsite === undefined || this.selectedMapUpgradeDigsite.maps.length <= mapIndex)
            return;
        // Stop if selecting a new map
        if (mapIndex !== this.selectedMapUpgradeDigsite.selectedUpgradeIndex &&
            this.isActive &&
            this._actionMode === 4 /* CartographyActionMode.MapUpgrading */ &&
            !this.stop())
            return;
        this.selectedMapUpgradeDigsite.selectedUpgradeIndex = mapIndex;
        this.renderQueue.selectedUpgradeDigSite = true;
        this.renderQueue.selectedUpgradeMap = true;
        this.renderQueue.mapUpgradeRates = true;
    }
    /** Callback function for deleting a digsite map */
    deleteDigSiteMapOnClick(map, confirmed = false) {
        var _a, _b, _c;
        if (this.selectedMapUpgradeDigsite === undefined)
            return;
        if (!confirmed) {
            SwalLocale.fire({
                title: getLangString('DELETE_DIG_SITE_MAP_CONFIRM'),
                html: `<span class="text-danger font-w600">${getLangString('MENU_TEXT_CANNOT_UNDO')}</span>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: getLangString('CHARACTER_SELECT_47'),
                cancelButtonText: getLangString('CHARACTER_SELECT_45'),
                showConfirmButton: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    this.deleteDigSiteMapOnClick(map, true);
                }
            });
            return;
        }
        // Stop upgrading if currently upgrading the selected map
        if (this.isActive && this._actionMode === 4 /* CartographyActionMode.MapUpgrading */ && !this.stop())
            return;
        // Stop archaeology if currently excavating on the selected map
        if (((_a = this.game.archaeology) === null || _a === void 0 ? void 0 : _a.isActive) &&
            ((_c = (_b = this.game.archaeology) === null || _b === void 0 ? void 0 : _b.currentDigSite) === null || _c === void 0 ? void 0 : _c.selectedMap) === this.selectedMapUpgradeDigsite.selectedUpgradeMap &&
            !this.game.archaeology.stop())
            return;
        const mapIndex = this.selectedMapUpgradeDigsite.maps.indexOf(map);
        this.destroyDigSiteMap(this.selectedMapUpgradeDigsite, mapIndex);
    }
    /** Callback function for starting/stoping upgrading a map */
    startMapUpgradeOnClick() {
        var _a;
        if (((_a = this.selectedMapUpgradeDigsite) === null || _a === void 0 ? void 0 : _a.selectedUpgradeMap) === undefined ||
            this.selectedMapUpgradeDigsite.selectedUpgradeMap.atMaxTier)
            return;
        if (this.isActive) {
            if (this._actionMode === 4 /* CartographyActionMode.MapUpgrading */ ) {
                this.stop();
                return;
            } else if (!this.stop())
                return;
        }
        if (this.getMapUpgradeCosts(this.selectedMapUpgradeDigsite.selectedUpgradeMap).checkIfOwned()) {
            this.startUpgradingMap(this.selectedMapUpgradeDigsite);
        } else {
            this.mapIngredientNotify();
        }
    }
    /** Starts upgrading a map with the interval for the given dig site */
    startUpgradingMap(digSite) {
        const canStart = !this.game.idleChecker(this);
        if (canStart) {
            if (!this.game.currentGamemode.enableInstantActions) {
                this.isActive = true;
                this._actionMode = 4 /* CartographyActionMode.MapUpgrading */ ;
                this.game.renderQueue.activeSkills = true;
                this.renderQueue.createMapSpinner = true;
                this.game.activeAction = this;
                this.startMapUpgradeTimer(digSite);
                this.game.scheduleSave();
            } else {
                this.isActive = true;
                this._actionMode = 4 /* CartographyActionMode.MapUpgrading */ ;
                this.game.renderQueue.activeSkills = true;
                this.renderQueue.createMapSpinner = true;
                this.game.activeAction = this;
                const actionsToPerform = this.game.modifiers.getInstantActionsToPerform();
                for (let i = 0; i < actionsToPerform; i++) {
                    this.action();
                    this.game.township.tickTimerOnClick();
                }
                this.stop();
            }
        }
        return canStart;
    }
    /** Gets the interval to upgrade a map for a given dig site */
    getMapUpgradeInterval(digSite) {
        return this.modifyInterval(this.BASE_MAP_UPGRADE_INTERVAL, digSite);
    }
    /** Starts the action time for upgrading a map */
    startMapUpgradeTimer(digSite) {
        this.actionTimer.start(this.getMapUpgradeInterval(digSite));
        this.renderQueue.mapUpgradeProgress = true;
    }
    /** Gets the costs to perform an upgrade action for a map */
    getMapUpgradeCosts(map) {
        const costs = new Costs(this.game);
        if (map.tier.index < map.digSite.mapUpgradeCost.length)
            costs.addItemsAndCurrency(map.digSite.mapUpgradeCost[map.tier.index]);
        return costs;
    }
    getMapUpgradeBaseXP(map) {
        return map.digSite.level * 2;
    }
    /** Performs the action for upgrading a map */
    mapUpgradeAction() {
        const digSite = this.selectedMapUpgradeDigsite;
        if (digSite === undefined)
            throw new Error('No digsite is selected.');
        let map = digSite.selectedUpgradeMap;
        if (map === undefined)
            throw new Error('No map is selected.');
        // Get costs for upgrading selected map
        const upgradeCost = this.getMapUpgradeCosts(map);
        if (!upgradeCost.checkIfOwned()) {
            this.mapIngredientNotify();
            this.stop();
            return;
        }
        const actionEvent = new CartographyMapUpgradeEvent(this, map);
        actionEvent.interval = this.currentActionInteral;
        const statTracker = this.game.stats.Cartography;
        const rewards = new Rewards(this.game);
        rewards.addXP(this, this.getMapUpgradeBaseXP(map));
        this.addCommonRewards(rewards, digSite.poiCartographyLevel, digSite.realm);
        rewards.giveRewards();
        // Consume Costs, and record stats
        if (rollPercentage(this.getPreservationChance(digSite))) {
            upgradeCost.recordBulkItemStat(statTracker, 13 /* CartographyStats.MapUpgradeItemsPreserved */ );
            upgradeCost.recordSkillCurrencyStats(this, 2 /* SkillCurrencyStats.Preserved */ );
            upgradeCost.recordSkillCurrencyStats(this, 5 /* SkillCurrencyStats.PreservedMapUpgrading */ );
        } else {
            upgradeCost.consumeCosts();
            upgradeCost.recordBulkItemStat(statTracker, 10 /* CartographyStats.MapUpgradeItemsUsed */ );
            upgradeCost.recordSkillCurrencyStats(this, 1 /* SkillCurrencyStats.Spent */ );
            upgradeCost.recordSkillCurrencyStats(this, 4 /* SkillCurrencyStats.SpentMapUpgrading */ );
        }
        // Perform map upgrade action
        const tierUpgraded = map.addUpgradeAction();
        if (tierUpgraded) {
            this.renderQueue.selectedUpgradeMap = true;
            if (digSite.selectedMap === map && this.game.archaeology !== undefined) {
                this.game.archaeology.renderQueue.selectedMap.add(digSite);
            }
        }
        this.renderQueue.mapUpgradeActions = true;
        statTracker.inc(8 /* CartographyStats.MapUpgradeActions */ );
        statTracker.add(9 /* CartographyStats.TimeSpentUpgradingMaps */ , this.currentActionInteral);
        this._events.emit('upgradeMap', actionEvent);
        let continueSkill = true;
        if (map.atMaxTier) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, getLangString('TOASTS_MAX_MAP_TIER'), 'danger'],
            });
            // Search for a map that isn't max tier, and start upgrading it, else stop the skill
            const nextMapIndex = digSite.maps.findIndex((map) => !map.atMaxTier);
            if (nextMapIndex !== -1) {
                digSite.selectedUpgradeIndex = nextMapIndex;
                this.renderQueue.selectedUpgradeDigSite = true;
                this.renderQueue.mapUpgradeRates = true;
                map = digSite.maps[nextMapIndex];
            } else {
                continueSkill = false;
            }
        }
        if (continueSkill) {
            const nextUpgradeCosts = this.getMapUpgradeCosts(map);
            if (nextUpgradeCosts.checkIfOwned()) {
                this.startMapUpgradeTimer(digSite);
            } else {
                this.mapIngredientNotify();
                this.stop();
            }
        } else {
            this.stop();
        }
    }
    /** Gets the costs to create a map for a dig site */
    getMapCreationCosts(digSite) {
        const costs = new Costs(this.game);
        costs.addItemsAndCurrency(digSite.mapCreationCost);
        return costs;
    }
    /**
     * Create a new blank Map for specified dig site. Maximum of 3 maps per dig site.
     * @param digSite The Dig Site to create the map for.
     */
    createNewMapForDigSite(digSite) {
        var _a;
        const maxMaps = digSite.getMaxMaps();
        if (digSite.maps.length > maxMaps) {
            console.log(`Unable to create new map. Maximum of ${maxMaps} maps already created.`);
            return;
        }
        const costs = this.getMapCreationCosts(digSite);
        if (!costs.checkIfOwned()) {
            this.game.combat.notifications.add({
                type: 'Player',
                args: [this, getLangString('TOASTS_MATERIALS_CREATE_MAP'), 'danger'],
            });
            return;
        }
        costs.consumeCosts();
        const map = new DigSiteMap(digSite, this.game, this);
        digSite.maps.push(map);
        this.game.stats.Cartography.inc(7 /* CartographyStats.MapsCreated */ );
        (_a = this.game.archaeology) === null || _a === void 0 ? void 0 : _a.renderQueue.mapSelection.add(digSite);
        this.renderQueue.selectedUpgradeDigSite = true;
        // Auto Select the map if it is the first one created for the dig site
        if (digSite.maps.length === 1)
            this.selectDigSiteMapOnClick(0);
    }
    /** Uses a charge/action on the currently selected map for a dig site */
    useDigSiteMapCharges(digSite, charges = 1) {
        var _a;
        if (digSite.selectedMap === undefined)
            return;
        digSite.selectedMap.charges -= charges;
        if (digSite === this.selectedMapUpgradeDigsite)
            this.renderQueue.selectedUpgradeMap = true; // TODO: This may be a bit heavy, may want to reduce this to just the charges
        (_a = this.game.archaeology) === null || _a === void 0 ? void 0 : _a.renderQueue.selectedMapCharges.add(digSite);
        if (digSite.selectedMap.charges <= 0)
            this.destroyDigSiteMap(digSite, digSite.selectedMapIndex);
    }
    /** Destroys the dig site map at the specified index */
    destroyDigSiteMap(digSite, index) {
        if (digSite.maps.length <= index)
            throw new Error('Tried to destroy nonexistant dig site map');
        if (this.game.archaeology === undefined)
            throw new Error('Archaeology not registered');
        digSite.maps.splice(index, 1);
        // Handle Currently selected maps being destroyed
        if (index === digSite.selectedMapIndex) {
            if (digSite.maps.length > 0) {
                digSite.selectedMapIndex = 0;
            } else {
                digSite.selectedMapIndex = -1;
            }
            if (this.game.archaeology.isActive)
                this.game.archaeology.computeProvidedStats(true);
        } else if (index < digSite.selectedMapIndex) {
            digSite.selectedMapIndex--;
        }
        if (index === digSite.selectedUpgradeIndex) {
            digSite.selectedUpgradeIndex = -1;
        } else if (index < digSite.selectedUpgradeIndex) {
            digSite.selectedUpgradeIndex--;
        }
        // Queue renders for cartography and archaeology
        if (digSite === this.selectedMapUpgradeDigsite) {
            this.renderQueue.selectedUpgradeDigSite = true;
            this.renderQueue.selectedUpgradeMap = true;
        }
        this.game.archaeology.renderQueue.selectedMap.add(digSite);
        this.game.archaeology.renderQueue.mapSelection.add(digSite);
        this.game.stats.Archaeology.inc(9 /* ArchaeologyStats.DigSiteMapsDepleted */ );
    }
    /** Callback function when selecting a refinement to add to a map */
    selectRefinementOnClick(map, selectIndex) {
        var _a, _b, _c;
        const refinementIndex = map.refinements.length;
        if (refinementIndex >= map.tier.refinementSlots)
            return; // Reject if at max slots
        const costs = this.getNextRefinementSlotCost(map);
        if (!costs.checkIfOwned())
            return; // Reject if player can't afford
        costs.consumeCosts();
        const newRefinement = this.refinementModifiers[refinementIndex][selectIndex].clone();
        map.refinements.push(newRefinement);
        switch (newRefinement.modifier.id) {
            case "melvorD:flatDigSiteMapCharges" /* ModifierIDs.flatDigSiteMapCharges */ :
                map.charges += newRefinement.value;
                this.renderQueue.selectedUpgradeMap = true; // TODO: This may be a bit heavy, may want to reduce this to just the charges
                (_a = this.game.archaeology) === null || _a === void 0 ? void 0 : _a.renderQueue.selectedMapCharges.add(map.digSite);
                break;
            case "melvorD:tinyArtefactValue" /* ModifierIDs.tinyArtefactValue */ :
                map.artefactValues.tiny = Math.max(1, map.artefactValues.tiny + newRefinement.value);
                this.renderQueue.selectedUpgradeMap = true;
                break;
            case "melvorD:smallArtefactValue" /* ModifierIDs.smallArtefactValue */ :
                map.artefactValues.small = Math.max(1, map.artefactValues.small + newRefinement.value);
                this.renderQueue.selectedUpgradeMap = true;
                break;
            case "melvorD:mediumArtefactValue" /* ModifierIDs.mediumArtefactValue */ :
                map.artefactValues.medium = Math.max(1, map.artefactValues.medium + newRefinement.value);
                this.renderQueue.selectedUpgradeMap = true;
                break;
            case "melvorD:largeArtefactValue" /* ModifierIDs.largeArtefactValue */ :
                map.artefactValues.large = Math.max(1, map.artefactValues.large + newRefinement.value);
                this.renderQueue.selectedUpgradeMap = true;
                break;
        }
        this.game.stats.Cartography.inc(21 /* CartographyStats.RefinementsPurchased */ );
        this._events.emit('mapRefinement', new CartographyMapRefinementEvent(this, map));
        if (((_b = this.game.archaeology) === null || _b === void 0 ? void 0 : _b.isActive) &&
            this.game.archaeology.currentDigSite === map.digSite &&
            map.digSite.selectedMap === map)
            this.game.archaeology.computeProvidedStats(true);
        this.renderQueue.mapRefinements = true;
        (_c = this.game.archaeology) === null || _c === void 0 ? void 0 : _c.onActiveMapChange(map.digSite);
    }
    /** Gets the cost for adding the next refinement slot to a dig site map. */
    getNextRefinementSlotCost(map) {
        const costs = new Costs(this.game);
        const costMultiplier = Math.max(1 + this.game.modifiers.mapRefinementCost / 100, 0);
        if (map.refinements.length >= this.refinementSlotCosts.length) {
            costs.addItemsAndCurrency(this.refinementSlotCosts[this.refinementSlotCosts.length - 1], costMultiplier);
        } else {
            costs.addItemsAndCurrency(this.refinementSlotCosts[map.refinements.length], costMultiplier);
        }
        return costs;
    }
    surveyWholeMap() {
        if (this.activeMap === undefined)
            return;
        this.activeMap.forEach((hex) => {
            const xpNeeded = Hex.getXPFromLevel(hex.maxSurveyLevel) - hex.surveyXP + 1;
            const up = hex.addSurveyXP(xpNeeded);
            if (up)
                this.onHexFullSurvey(hex);
        });
    }
    unsurveyWholeMap() {
        if (this.activeMap === undefined)
            return;
        this.activeMap.forEach((hex) => {
            const down = hex.addSurveyXP(-hex.surveyXP);
            if (down)
                this.renderQueue.hexBackground.add(hex);
        });
        this.activeMap.discoveredPOIs = [];
        this.computeProvidedStats();
    }
    /** Selected a random travel event based on the path the player travels. Returns true if provided stats should be recomputed */
    rollForTravelEvent(path) {
        var _a;
        let computeModifiers = ((_a = this.lastTravelEvent) === null || _a === void 0 ? void 0 : _a.tempBonuses) !== undefined;
        this.lastTravelEvent = undefined;
        const waterHexes = path.reduce((total, hex) => {
            if (hex.isWater)
                total++;
            return total;
        }, 0);
        if (waterHexes !== 0) {
            const chancePerHex = this.BASE_TRAVEL_EVENT_CHANCE * (1 + this.game.modifiers.travelEventChance / 100);
            const eventChance = 1 - Math.pow(1 - chancePerHex, waterHexes);
            if (Math.random() < eventChance) {
                const event = this.selectTravelEvent();
                this.processTravelEvent(event);
                computeModifiers || (computeModifiers = event.tempBonuses !== undefined);
            }
        }
        if (computeModifiers)
            this.computeProvidedStats();
    }
    /** Gets a random travel event that the player meets the requirements to do */
    selectTravelEvent() {
        let event = selectFromWeightedArray(this.allTravelEvents, this.totalTravelEventWeight);
        while (!(event.itemsRequired === undefined || this.game.bank.checkForItems(event.itemsRequired))) {
            event = selectFromWeightedArray(this.allTravelEvents, this.totalTravelEventWeight);
        }
        return event;
    }
    /** Processes a travel event, removing items, providing modifiers etc. */
    processTravelEvent(event) {
        var _a;
        if (event.itemsRequired !== undefined) {
            event.itemsRequired.forEach(({
                item,
                quantity
            }) => this.game.bank.removeItemQuantity(item, quantity, true));
        }
        if (event.rewards !== undefined) {
            (_a = event.rewards.currencies) === null || _a === void 0 ? void 0 : _a.forEach(({
                currency,
                quantity
            }) => {
                currency.add(quantity);
            });
            if (event.rewards.items !== undefined)
                event.rewards.items.forEach(({
                    item,
                    quantity
                }) => {
                    if (quantity > 0)
                        this.game.bank.addItem(item, quantity, true, true, true, true, `Skill.${this.id}`);
                });
        }
        this.game.stats.Cartography.inc(20 /* CartographyStats.TravelEventsSeen */ );
        this.lastTravelEvent = event;
        this.queueTravelEventModal(event);
    }
    createItemCurrencyNodes(costs) {
        var _a, _b;
        const nodes = [];
        const createSpan = (children) => {
            nodes.push(createElement('span', {
                className: 'text-success',
                children
            }));
        };
        const smallImage = (media) => createElement('img', {
            className: 'skill-icon-xs',
            attributes: [
                ['src', media]
            ]
        });
        (_a = costs.currencies) === null || _a === void 0 ? void 0 : _a.forEach(({
            currency,
            quantity
        }) => {
            createSpan(templateStringWithNodes(currency.gainTemplate, {
                curIcon: smallImage(currency.media)
            }, {
                count: numberWithCommas(quantity)
            }));
        });
        (_b = costs.items) === null || _b === void 0 ? void 0 : _b.forEach(({
            item,
            quantity
        }) => {
            createSpan(templateLangStringWithNodes('MENU_TEXT_YOU_GAINED_ITEM', {
                itemImage: smallImage(item.media)
            }, {
                count: numberWithCommas(quantity),
                itemName: item.name
            }));
        });
        return nodes;
    }
    /** Queues up a modal to display when a random event fires */
    queueTravelEventModal(event) {
        const modalBody = createElement('div', {
            className: 'justify-vertical-center h-100'
        });
        const scrollBlock = createElement('div', {
            className: 'mm__flex-expand d-flex flex-column',
            parent: modalBody
        });
        scrollBlock.addEventListener('touchmove', (e) => e.stopPropagation());
        const mainText = createElement('div', {
            className: 'm-auto',
            parent: scrollBlock
        });
        mainText.append(createElement('p', {
            text: event.description,
            className: 'text-info'
        }));
        const smallImage = (media) => createElement('img', {
            className: 'skill-icon-xs',
            attributes: [
                ['src', media]
            ]
        });
        if (event.rewards !== undefined) {
            const rewardCont = createElement('div', {
                className: 'justify-vertical-center',
                parent: mainText
            });
            rewardCont.append(...this.createItemCurrencyNodes(event.rewards));
        }
        if (event.itemsRequired !== undefined) {
            const itemCont = createElement('div', {
                className: 'justify-vertical-center',
                parent: mainText
            });
            const appendNegSpan = (nodes) => {
                itemCont.append(createElement('span', {
                    className: 'text-danger',
                    children: nodes
                }));
            };
            event.itemsRequired.forEach(({
                item,
                quantity
            }) => {
                appendNegSpan(templateLangStringWithNodes('MENU_TEXT_ITEM_USAGE', {
                    itemImage: smallImage(item.media)
                }, {
                    count: numberWithCommas(quantity),
                    itemName: item.name
                }));
            });
        }
        if (event.tempBonuses !== undefined) {
            mainText.append(createElement('h5', {
                text: getLangString('BONUS_UNTIL_TRAVEL')
            }));
            const modCont = createElement('div', {
                className: 'justify-vertical-center',
                parent: mainText
            });
            modCont.append(...getSpansFromModifierObject(event.tempBonuses));
        }
        addModalToQueue({
            titleText: getLangString('RANDOM_TRAVEL_EVENT'),
            html: modalBody,
            allowOutsideClick: false,
            showConfirmButton: true,
            customClass: createSwalCustomClass({
                popup: 'cartography__event_popup',
            }),
        });
    }
    /** Queues up a modal to display when a point of interest is discovered */
    queuePOIDiscoveryModal(poi) {
        const {
            modalBody,
            title
        } = this.getPoiDiscoveryNode(poi);
        this.createTravelCosts(modalBody);
        addModalToQueue({
            imageUrl: poi.media,
            titleText: title,
            html: modalBody,
            allowOutsideClick: false,
            willOpen: () => {
                this.discoveryModalState = 2 /* DiscoveryModalState.POI */ ;
                this.poiModalsQueued--;
                this.updateDiscoveryModal();
            },
            preConfirm: () => {
                return this.onPOIDiscoveryConfirm();
            },
            didDestroy: () => {
                this.discoveryModalState = 0 /* DiscoveryModalState.Closed */ ;
            },
            customClass: createSwalCustomClass({
                image: 'cartography__image',
                container: 'cartography__poi_container',
                popup: 'cartography__poi_popup',
            }),
        });
        this.poiModalsQueued++;
    }
    /** Fires a go to discovery modal that allows the player to quickly travel and discover a POI */
    queueGoToDiscoveryModal(fromSurvey) {
        var _a;
        if (this.poiModalsQueued > 0 || this.goToModalQueued || this.discoveryModalState)
            return;
        const nextPOI = (_a = this.activeMap) === null || _a === void 0 ? void 0 : _a.undiscoveredPOIs[0];
        if (nextPOI === undefined) {
            console.warn('Tried to fire go to discovery modal, but none are in queue');
            return;
        }
        const isDigSite = nextPOI instanceof DigSitePOI;
        const modalBody = createElement('div', {
            className: 'justify-vertical-center'
        });
        this.createTravelCosts(modalBody);
        let titleText;
        if (fromSurvey) {
            titleText = getLangString(isDigSite ? 'UNDISCOVERED_DIG_SITE_SURVEYED' : 'UNDISCOVERED_POI_SURVEYED');
        } else {
            titleText = getLangString(isDigSite ? 'UNDISCOVERED_DIG_SITE' : 'UNDISCOVERED_POI');
        }
        addModalToQueue({
            imageUrl: assets.getURI(isDigSite ? "assets/media/skills/cartography/sprites/undisc_dig_site.svg" /* Assets.UndiscoveredDigSite */ : "assets/media/skills/cartography/sprites/undisc_POI.svg" /* Assets.UndiscoveredPOI */ ),
            titleText,
            html: modalBody,
            allowOutsideClick: false,
            willOpen: () => {
                this.discoveryModalState = 1 /* DiscoveryModalState.GoTo */ ;
                this.updateDiscoveryModal();
            },
            didOpen: () => {
                this.goToModalQueued = false;
            },
            preConfirm: () => {
                return this.onPOIDiscoveryConfirm();
            },
            didDestroy: () => {
                this.discoveryModalState = 0 /* DiscoveryModalState.Closed */ ;
            },
            customClass: createSwalCustomClass({
                image: 'cartography__image',
            }),
        });
        this.goToModalQueued = true;
    }
    createTravelCosts(modalBody) {
        const travelCosts = new PoiDiscoveryCostsElement();
        travelCosts.id = 'cartography-poi-modal-costs';
        modalBody.append(travelCosts);
    }
    /** Updates the options on the currently open POI discovery modal */
    updateDiscoveryModal() {
        if (this.activeMap === undefined)
            return;
        const costs = document.getElementById('cartography-poi-modal-costs');
        if (costs === null)
            return; // Just return here, as Swal doesn't have a proper hooks that work
        let disableConfirm = false;
        if (this.poiModalsQueued > 0 || this.activeMap.undiscoveredPOIs.length === 0) {
            // There are other POIs in the modal Queue, or the discovery queue is empty. Show only a confirm button
            Swal.update({
                showDenyButton: false,
                showConfirmButton: true,
                confirmButtonText: getLangString('CHARACTER_SELECT_42'),
            });
            hideElement(costs);
        } else {
            const nextPOI = this.activeMap.undiscoveredPOIs[0];
            const path = this.activeMap.computePath(this.activeMap.playerPosition, nextPOI.hex);
            if (path === undefined) {
                Swal.update({
                    showDenyButton: false,
                    showConfirmButton: true,
                    confirmButtonText: getLangString('NO_PATH_TO_POI'),
                });
                hideElement(costs);
            } else {
                const travelCosts = this.getTravelCosts(path);
                Swal.update({
                    showDenyButton: true,
                    denyButtonText: getLangString('VIEW_LATER'),
                    showConfirmButton: true,
                    confirmButtonText: getLangString('TRAVEL_NOW'),
                });
                disableConfirm = !travelCosts.checkIfOwned();
                costs.setCosts(travelCosts, this.game);
                costs.setInfoText(this.discoveryModalState, nextPOI instanceof DigSitePOI);
                showElement(costs);
            }
        }
        const confirmButton = Swal.getConfirmButton();
        if (confirmButton)
            confirmButton.disabled = disableConfirm;
    }
    /** Callback function for when the confirm button of the POI discovery modal is clicked */
    onPOIDiscoveryConfirm() {
        if (this.activeMap === undefined || this.poiModalsQueued > 0)
            return;
        const nextPOI = this.activeMap.undiscoveredPOIs[0];
        if (nextPOI !== undefined) {
            const path = this.activeMap.computePath(this.activeMap.playerPosition, nextPOI.hex);
            if (path === undefined) {
                notifyPlayer(this, getLangString('NO_PATH_POI_NOTIFY'), 'danger');
                return false;
            }
            const costs = this.getTravelCosts(path);
            if (costs.checkIfOwned()) {
                this.movePlayer(path, false);
                if (cartographyMap.initialized)
                    cartographyMap.animateMoveToHex(nextPOI.hex, 1);
                return true;
            } else {
                notifyPlayer(this, getLangString('TOASTS_CANNOT_AFFORD_THAT'), 'danger');
                return false;
            }
        }
    }
    /** Fires an individual point of interest discovery modal for a poi that has already been seen before */
    firePOIDiscoveryModal(poi) {
        const {
            modalBody,
            title
        } = this.getPoiDiscoveryNode(poi);
        SwalLocale.fire({
            imageUrl: poi.media,
            titleText: title,
            html: modalBody,
            showConfirmButton: true,
            customClass: createSwalCustomClass({
                image: 'cartography__image',
                container: 'cartography__poi_container',
                popup: 'cartography__poi_popup',
            }),
        });
    }
    getPoiDiscoveryNode(poi) {
        const modalBody = createElement('div', {
            className: 'justify-vertical-center h-100'
        });
        const scrollBlock = createElement('div', {
            className: 'mm__flex-expand d-flex flex-column',
            parent: modalBody,
        });
        scrollBlock.addEventListener('touchmove', (e) => e.stopPropagation());
        const mainText = createElement('div', {
            className: 'm-auto',
            parent: scrollBlock
        });
        mainText.append(createElement('h5', {
            text: poi.name,
            className: 'text-warning mb-2'
        }));
        const descParts = poi.description.split('<br>');
        descParts.forEach((part, i) => {
            mainText.append(createElement('p', {
                text: part,
                className: 'text-info mb-2'
            }));
            if (i !== descParts.length - 1)
                mainText.append(createElement('br'));
        });
        let title;
        if (poi instanceof Watchtower) {
            title = getLangString('WATCH_TOWER_DISCOVERED');
        } else if (poi instanceof DigSitePOI) {
            title = getLangString('DIG_SITE_DISCOVERED');
            const noticeEl = createElement('p', {
                className: 'font-w600 mb-2'
            });
            noticeEl.innerHTML = templateLangString('MENU_TEXT_BEGIN_MAKING_MAPS', {
                mapIcon: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/archaeology/map_colour.png" /* Assets.FullMapSlot */)}">`,
                digSiteName: poi.name,
            });
            const secondaryNoticeEl = createElement('p', {
                className: 'text-success font-w600 mb-2'
            });
            secondaryNoticeEl.innerHTML = templateLangString('MENU_TEXT_FREE_MAP', {
                mapIcon: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/archaeology/map_colour.png" /* Assets.FullMapSlot */)}">`,
            });
            mainText.append(noticeEl);
            mainText.append(secondaryNoticeEl);
        } else {
            title = getLangString('POI_DISCOVERED');
        }
        if (poi.discoveryRewards !== undefined) {
            const rewardCont = createElement('div', {
                className: 'justify-vertical-center',
                parent: mainText
            });
            rewardCont.append(...this.createItemCurrencyNodes(poi.discoveryRewards));
        }
        if (poi.discoveryModifiers !== undefined) {
            mainText.append(createElement('h5', {
                className: 'mb-2',
                text: templateLangString('BONUS_FOR_NEXT_TRAVELS', {
                    moveCount: `${poi.discoveryModifiers.moves}`,
                }),
            }));
            const modCont = createElement('div', {
                className: 'justify-vertical-center',
                parent: mainText
            });
            modCont.append(...getSpansFromModifierObject(poi.discoveryModifiers.modifiers));
        }
        return {
            modalBody,
            title
        };
    }
    /** Fires off a modal that shows the hex mastery bonuses for a map */
    fireMapMasteryModal() {
        if (this.activeMap === undefined)
            return;
        cartographyMapMasteryMenu.setMap(this.activeMap);
        $('#cartography-map-mastery-modal').modal('show');
    }
    stop() {
        if (!this.isActive || this.game.isGolbinRaid)
            return false;
        switch (this._actionMode) {
            case 1 /* CartographyActionMode.QueueSurvey */ :
                this.surveyQueue.clear();
                this.renderQueue.surveyMarker = true;
                this.renderQueue.surveyQueue = true;
                this.renderQueue.hexOverviewSurvey = true;
                break;
            case 2 /* CartographyActionMode.AutoSurvey */ :
                this.autoSurveyHex = undefined;
                this.renderQueue.surveyMarker = true;
                this.renderQueue.surveyQueue = true;
                this.renderQueue.hexOverviewSurvey = true;
                break;
            case 3 /* CartographyActionMode.PaperMaking */ :
                this.renderQueue.paperMakingProgress = true;
                this.renderQueue.createMapSpinner = true;
                break;
            case 4 /* CartographyActionMode.MapUpgrading */ :
                this.renderQueue.mapUpgradeProgress = true;
                this.renderQueue.createMapSpinner = true;
                break;
        }
        this._actionMode = 0 /* CartographyActionMode.None */ ;
        this.isActive = false;
        this.actionTimer.stop();
        this.game.renderQueue.activeSkills = true;
        this.game.clearActiveAction(false);
        this.game.scheduleSave();
        return true;
    }
    activeTick() {
        this.actionTimer.tick();
    }
    initMenus() {
        var _a;
        super.initMenus();
        const hexMasteryButton = createElement('button', {
            className: 'btn btn-small btn-info font-size-xs p-1',
            attributes: [
                ['role', 'button']
            ],
            text: getLangString('VIEW_HEX_MASTERY_BONUSES'),
        });
        hexMasteryButton.onclick = () => this.fireMapMasteryModal();
        (_a = this.header) === null || _a === void 0 ? void 0 : _a.appendUpper(hexMasteryButton);
    }
    /** Called on save file load */
    onLoad() {
        window.customElements.define('world-map-display', WorldMapDisplayElement); // Defer registration to now, so antialias setting works
        if (this.game.archaeology === undefined)
            throw new Error('Cannot initialize Cartography. Archaeology is not registered.');
        if (this.activeMap === undefined) {
            const defaultMap = this.worldMaps.getObjectByID("melvorAoD:Melvor" /* CartographyWorldMapIDs.Melvor */ );
            if (defaultMap === undefined)
                throw new Error('Error loading Cartography. Default map is not registered.');
            this.activeMap = defaultMap;
        }
        const modal = $('#cartography-map-creation-modal');
        modal.on('show.bs.modal', () => {
            this.modalOpen = true;
            this.onModalOpen();
        });
        modal.on('hidden.bs.modal', () => {
            this.modalOpen = false;
        });
        cartographyMapCreateMenu.init(this.game.archaeology, this, this.game);
        this.worldMaps.forEach((map) => {
            map.onLoad();
            map.pointsOfInterest.forEach((poi) => {
                if (poi.discoveryModifiers !== undefined && poi.discoveryModifiers.movesLeft > 0)
                    this.activeDiscoveryModifiers.add(poi.discoveryModifiers);
            });
            // Unlock Map Mastery Bonuses and count unlock count
            map.sortedMasteryBonuses.some((bonus) => {
                if (map.masteredHexes >= bonus.masteredHexes) {
                    map.unlockedMasteryBonuses++;
                    if (!bonus.awarded)
                        this.awardMasteryBonus(map, bonus);
                }
                return bonus.masteredHexes > map.masteredHexes;
            });
            this.checkForHexPetUnlock(map);
        });
        super.onLoad();
        this.updateHiddenPOIDiscoveryHandler();
        this.renderQueue.selectedPaperRecipe = true;
        this.renderQueue.paperMakingRates = true;
        this.renderQueue.selectedUpgradeDigSite = true;
        this.renderQueue.selectedUpgradeMap = true;
        this.renderQueue.mapUpgradeRates = true;
        this.renderQueue.createMapSpinner = true;
        this.renderQueue.poiDiscoveryBtn = true;
        window.setTimeout(() => {
            this.grantRetroactivePOIDiscoveryRewards();
        }, 5000);
    }
    onModalOpen() {
        this.queueModalModifierChange();
        this.queueModalQuantityChange();
    }
    onPageChange() {
        document.getElementById('page-container').classList.remove('pb-5-mobile');
        this.queueHiddenPoiRenders();
        this.game.on('requirementChange', this.hiddenPOIRenderHandler);
    }
    onPageVisible() {
        return __awaiter(this, void 0, void 0, function*() {
            disableSwipeEvents = true;
            yield cartographyMap.onShow();
            if (this.activeMap === undefined)
                return;
            if (cartographyMap.lastDrawnMap !== this.activeMap) {
                cartographyMap.showLoading();
                yield cartographyMap.loadWorldMap(this.activeMap, this);
                if (this.isSurveying) {
                    this.renderQueue.surveyMarker = true;
                    this.renderQueue.surveyQueue = true;
                }
                this.render();
                cartographyMap.hideLoading();
            } else {
                if (this.isSurveying) {
                    this.renderQueue.surveyMarker = true;
                }
                this.renderQueue.hexOverviewQuantities = true;
                cartographyMap.updateBackgroundTiles(this.activeMap);
                this.renderModifierChange();
                this.render();
            }
        });
    }
    onPageLeave() {
        document.getElementById('page-container').classList.add('pb-5-mobile');
        this.game.off('requirementChange', this.hiddenPOIRenderHandler);
        disableSwipeEvents = false;
        cartographyMap.onHide();
    }
    queueModalModifierChange() {
        this.renderQueue.paperMakingRates = true;
        this.renderQueue.mapUpgradeRates = true;
        this.renderQueue.selectedUpgradeDigSite = true;
        this.renderQueue.selectedUpgradeMap = true;
        this.renderQueue.mapRefinements = true;
    }
    queueModalQuantityChange() {
        this.renderQueue.paperMakingQuantities = true;
        this.renderQueue.mapUpgradeQuantities = true;
        this.renderQueue.mapRefinementQuantities = true;
    }
    renderModifierChange() {
        this.renderQueue.visionRange = true;
        this.renderQueue.surveyRates = true;
        const newTravelCostMultiplier = this.travelCostMultiplier;
        if (newTravelCostMultiplier !== this._lastTravelCostMultiplier) {
            this.renderQueue.hexPath = true;
            this._lastTravelCostMultiplier = newTravelCostMultiplier;
        }
        if (this.modalOpen)
            this.queueModalModifierChange();
    }
    queueBankQuantityRender(item) {
        this.renderQueue.hexOverviewQuantities = true;
        this.renderQueue.poiDiscoveryOptions = true;
        if (this.modalOpen)
            this.queueModalQuantityChange();
    }
    queueCurrencyQuantityRender(currency) {
        this.renderQueue.hexOverviewQuantities = true;
        this.renderQueue.poiDiscoveryOptions = true;
        if (this.modalOpen)
            this.queueModalQuantityChange();
    }
    onModifierChangeWhileActive() {
        this.onSurveyRangeChange();
    }
    createOfflineSnapshot() {
        this.offlineSnapshot = new CartographyOfflineSnapshot(this);
        if (this.selectedMapUpgradeDigsite !== undefined) {
            const mapSnapshot = new Map();
            this.selectedMapUpgradeDigsite.maps.forEach((map) => {
                mapSnapshot.set(map, {
                    oldTier: map.tier,
                    oldUpgradeActions: map.upgradeActions,
                });
            });
            this.offlineSnapshot.upgradeMapDigSite = mapSnapshot;
        }
    }
    getOfflineMessages() {
        const messages = [];
        const snapshot = this.offlineSnapshot;
        if (snapshot === undefined)
            return messages;
        this.worldMaps.forEach((map) => {
            var _a, _b;
            const hexesSurveyed = map.fullySurveyedHexes - ((_a = snapshot.hexesSurveyed.get(map)) !== null && _a !== void 0 ? _a : 0);
            if (hexesSurveyed > 0)
                messages.push(templateLangString('SURVEYED_HEXES_IN_MAP', {
                    count: numberWithCommas(hexesSurveyed),
                    worldName: map.name,
                }));
            const hexesMastered = map.masteredHexes - ((_b = snapshot.hexesMastered.get(map)) !== null && _b !== void 0 ? _b : 0);
            if (hexesMastered > 0)
                messages.push(templateLangString('MASTERED_HEXES_IN_MAP', {
                    count: numberWithCommas(hexesMastered),
                    worldName: map.name,
                }));
        });
        if (this.activeMap !== undefined) {
            let undiscoveredPOIS = 0;
            let undiscoveredDigSites = 0;
            this.activeMap.undiscoveredPOIs.forEach((poi) => {
                if (poi instanceof DigSitePOI)
                    undiscoveredDigSites++;
                else
                    undiscoveredPOIS++;
            });
            if (undiscoveredDigSites > 0) {
                messages.push(templateLangString('DIGSITES_WAITING_TO_BE_DISCOVERED', {
                    count: numberWithCommas(undiscoveredDigSites),
                }));
            }
            if (undiscoveredPOIS > 0) {
                messages.push(templateLangString('POIS_WAITING_TO_BE_DISCOVERED', {
                    count: numberWithCommas(undiscoveredPOIS),
                }));
            }
        }
        if (snapshot.upgradeMapDigSite !== undefined) {
            snapshot.upgradeMapDigSite.forEach(({
                oldTier,
                oldUpgradeActions
            }, map) => {
                const upgradeActions = map.upgradeActions - oldUpgradeActions;
                if (upgradeActions > 0) {
                    messages.push(templateLangString('UPGRADED_MAP_TIMES', {
                        digSiteName: map.digSite.name,
                        count: numberWithCommas(upgradeActions),
                    }));
                }
                if (map.tier !== oldTier) {
                    messages.push(templateLangString('IMPROVED_MAP_TIER', {
                        digSiteName: map.digSite.name,
                        oldTierName: oldTier.name,
                        newTierName: map.tier.name,
                    }));
                }
            });
        }
        this.offlineSnapshot = undefined;
        return messages;
    }
    /** Called when the player changes equipments */
    onEquipmentChange() {
        var _a;
        if (this.activeMap === undefined)
            return;
        const positionPOI = (_a = this.activeMap.playerPosition) === null || _a === void 0 ? void 0 : _a.pointOfInterest;
        if ((positionPOI === null || positionPOI === void 0 ? void 0 : positionPOI.hidden) !== undefined && !positionPOI.isDiscovered) {
            if (this.isHiddenPOIMet(positionPOI.hidden))
                this.discoverPOI(positionPOI);
        }
        this.activeMap.markedUndiscoveredHiddenPOIs.forEach((poi) => {
            this.renderQueue.poiMarkers.add(poi);
        });
    }
    addPoiModifiers(poi) {
        if (poi.discoveryModifiers !== undefined && poi.discoveryModifiers.movesLeft > 0)
            this.providedStats.modifiers.addModifiers(poi, poi.discoveryModifiers.modifiers);
    }
    addProvidedStats() {
        var _a, _b;
        super.addProvidedStats();
        this.worldMaps.forEach((map) => {
            map.pointsOfInterest.forEach((poi) => {
                if (!poi.isDiscovered)
                    return;
                this.addPoiModifiers(poi);
            });
            map.sortedMasteryBonuses.some((bonus) => {
                if (map.masteredHexes >= bonus.masteredHexes) {
                    this.providedStats.addStatObject(map, bonus.stats);
                }
                return bonus.masteredHexes > map.masteredHexes;
            });
        });
        if (((_a = this.lastTravelEvent) === null || _a === void 0 ? void 0 : _a.tempBonuses) !== undefined)
            this.providedStats.modifiers.addModifiers(this.lastTravelEvent, this.lastTravelEvent.tempBonuses);
        const playerPOI = (_b = this.activeMap) === null || _b === void 0 ? void 0 : _b.playerPosition.pointOfInterest;
        if (playerPOI !== undefined && playerPOI.activeStats.hasStats) {
            const posMult = this.hasCarthuluPet ? 2 : 1;
            this.providedStats.addStatObject(playerPOI, playerPOI.activeStats, 1, posMult);
        }
    }
    encode(writer) {
        super.encode(writer);
        writer.writeArray(this.worldMaps.allObjects, (worldMap, writer) => {
            writer.writeNamespacedObject(worldMap);
            worldMap.encode(writer);
        });
        // Write Action State
        writer.writeBoolean(this.isActive);
        writer.writeUint8(this._actionMode);
        this.actionTimer.encode(writer);
        writer.writeBoolean(this.activeMap !== undefined);
        const map = this.activeMap;
        if (map !== undefined) {
            writer.writeNamespacedObject(map);
            writer.writeLinkQueue(this.surveyQueue, (hex, writer) => {
                map.encodeHexCoords(writer, hex);
            });
            writer.writeBoolean(this.autoSurveyHex !== undefined);
            if (this.autoSurveyHex !== undefined)
                map.encodeHexCoords(writer, this.autoSurveyHex);
        }
        writer.writeBoolean(this.lastTravelEvent !== undefined);
        if (this.lastTravelEvent !== undefined)
            writer.writeNamespacedObject(this.lastTravelEvent);
        writer.writeBoolean(this.selectedPaperRecipe !== undefined);
        if (this.selectedPaperRecipe !== undefined)
            writer.writeNamespacedObject(this.selectedPaperRecipe);
        writer.writeBoolean(this.selectedMapUpgradeDigsite !== undefined);
        if (this.selectedMapUpgradeDigsite !== undefined)
            writer.writeNamespacedObject(this.selectedMapUpgradeDigsite);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        reader.getArray((reader) => {
            const worldMap = reader.getNamespacedObject(this.worldMaps);
            if (typeof worldMap === 'string') {
                const dummyMap = this.worldMaps.getDummyObject(worldMap, DummyWorldMap, this.game);
                dummyMap.decode(reader, version);
            } else {
                worldMap.decode(reader, version);
            }
        });
        // Read Action State
        let shouldResetAction = false;
        this.isActive = reader.getBoolean();
        this._actionMode = reader.getUint8();
        this.actionTimer.decode(reader, version);
        if (reader.getBoolean()) {
            let readMap = reader.getNamespacedObject(this.worldMaps);
            if (typeof readMap === 'string') {
                readMap = this.worldMaps.getDummyObject(readMap, DummyWorldMap, this.game);
                if (this._actionMode === 2 /* CartographyActionMode.AutoSurvey */ ||
                    this._actionMode === 1 /* CartographyActionMode.QueueSurvey */ )
                    shouldResetAction = true;
            } else {
                this.activeMap = readMap;
            }
            const map = readMap;
            this.surveyQueue = reader.getLinkQueue((reader) => {
                const hex = map.getHex(map.decodeHexCoords(reader, version));
                if (hex === undefined && this._actionMode === 1 /* CartographyActionMode.QueueSurvey */ )
                    shouldResetAction = true;
                return hex;
            });
            if (reader.getBoolean()) {
                const autoSurvey = map.getHex(map.decodeHexCoords(reader, version));
                if (autoSurvey === undefined && this._actionMode === 2 /* CartographyActionMode.AutoSurvey */ )
                    shouldResetAction = true;
                this.autoSurveyHex = autoSurvey;
            }
        }
        if (reader.getBoolean()) {
            const event = reader.getNamespacedObject(this.travelEventRegistry);
            if (!(typeof event === 'string'))
                this.lastTravelEvent = event;
        }
        if (reader.getBoolean()) {
            const paperRecipe = reader.getNamespacedObject(this.paperRecipes);
            if (typeof paperRecipe === 'string') {
                if (this._actionMode === 3 /* CartographyActionMode.PaperMaking */ )
                    shouldResetAction = true;
            } else {
                this.selectedPaperRecipe = paperRecipe;
            }
        }
        if (reader.getBoolean()) {
            if (this.game.archaeology === undefined)
                throw new Error('Cannot decode cartography. Archaeology is not registered.');
            const digSite = reader.getNamespacedObject(this.game.archaeology.actions);
            if (typeof digSite === 'string') {
                if (this._actionMode === 4 /* CartographyActionMode.MapUpgrading */ )
                    shouldResetAction = true;
            } else {
                this.selectedMapUpgradeDigsite = digSite;
            }
        }
        if (shouldResetAction)
            this.resetActionState();
        if (version < 80)
            this.shouldReceiveRetroactivePOIRewards1 = true;
    }
    resetActionState() {
        if (this.isActive)
            this.game.clearActiveAction(false);
        this.isActive = false;
        this._actionMode = 0 /* CartographyActionMode.None */ ;
        this.actionTimer.stop();
        this.surveyQueue.clear();
        this.autoSurveyHex = undefined;
        this.selectedPaperRecipe = undefined;
        this.selectedMapUpgradeDigsite = undefined;
    }
    /** Utility function for exporting the survey levels for each cartography level */
    exportActiveMapLevels() {
        const levelCounts = new Map();
        if (this.activeMap !== undefined) {
            this.activeMap.forEach((hex) => {
                const levelReq = hex.requirements.find((req) => {
                    return req.type === 'SkillLevel' && req.skill === this;
                });
                const level = levelReq === undefined ? 1 : levelReq.level;
                let levelCount = levelCounts.get(level);
                if (levelCount === undefined) {
                    levelCount = {
                        survey: [0, 0, 0, 0, 0],
                        master: [0, 0, 0, 0, 0],
                    };
                    levelCounts.set(level, levelCount);
                }
                levelCount.survey[hex.maxSurveyLevel - 1]++;
                levelCount.master[hex.maxMasteryLevel - 1]++;
            });
        }
        downloadTextFile('mapLevels.csv', buildCSVFile(['Cartography Level', '1', '2', '3', '4', '5'], [...levelCounts.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([level, {
                survey,
                master
            }]) => {
                return [`${level}`, ...survey.map((a) => `${a}`)];
            })));
    }
    getObtainableItems() {
        const obtainable = super.getObtainableItems();
        this.worldMaps.forEach((map) => {
            map.sortedMasteryBonuses.forEach((bonus) => {
                var _a;
                (_a = bonus.items) === null || _a === void 0 ? void 0 : _a.forEach(({
                    item
                }) => obtainable.add(item));
            });
            map.pointsOfInterest.forEach((poi) => {
                var _a, _b;
                (_b = (_a = poi.discoveryRewards) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.forEach(({
                    item
                }) => obtainable.add(item));
            });
        });
        this.paperRecipes.forEach((recipe) => obtainable.add(recipe.product));
        this.travelEventRegistry.forEach((event) => {
            var _a, _b;
            (_b = (_a = event.rewards) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.forEach(({
                item
            }) => obtainable.add(item));
        });
        return obtainable;
    }
    /** Provide discovery rewards retroactively for POIs where new rewards have been added after someone has disovered it */
    grantRetroactivePOIDiscoveryRewards() {
        if (!this.shouldReceiveRetroactivePOIRewards1)
            return;
        const poiIDs = [
            'melvorAoD:BustlingPassage',
            'melvorAoD:OuterRegions',
            'melvorAoD:BeaconPort',
            'melvorAoD:SwirlingAbyss',
            'melvorAoD:CalmBeforeTheStorm',
            'melvorAoD:HuntForTheGildedGolbins',
            'melvorAoD:AbandonedTemple',
            'melvorAoD:TreacherousNorth',
            'melvorAoD:ShroudedHorizon',
            'melvorAoD:SandyShores',
            'melvorAoD:VibrantCoralGardens',
            'melvorAoD:CursedIsland',
            'melvorAoD:MioliteCaves',
            'melvorAoD:GiantDungeon',
            'melvorAoD:TranquilOpenWaters',
            'melvorAoD:AncientWreckage',
            'melvorAoD:ShroudedBadlands',
            'melvorAoD:ShadowLurkers',
            'melvorAoD:WetForest',
            'melvorAoD:HighLands',
            'melvorAoD:PenguinBay',
            'melvorAoD:FrozenPerch',
            'melvorAoD:NewHorizon',
            'melvorAoD:GlacialExpanse',
            'melvorAoD:GolbinVillage',
            'melvorAoD:FrostyHaven',
            'melvorAoD:PerilousAscent',
            'melvorAoD:RiverRest',
            'melvorAoD:FrostbiteBluff',
            'melvorAoD:DragonValley',
            'melvorAoD:OldMine',
            'melvorAoD:CityscapeBridge',
            'melvorAoD:MoonlitPier',
            'melvorAoD:SecludedHut',
            'melvorAoD:HarvestHavenFarm',
            'melvorAoD:FarmersMarket',
            'melvorAoD:RiverCrossroads',
            'melvorAoD:RestlessSanctum',
            'melvorAoD:FlickeringFireCamp',
            'melvorAoD:PratsBridge',
        ];
        const rewards = new Rewards(this.game);
        poiIDs.forEach((id) => {
            const worldMap = this.worldMaps.getObjectByID('melvorAoD:Melvor');
            if (worldMap === undefined)
                throw new Error(`Could not find world map with id melvorAoD:Melvor`);
            const poi = worldMap.pointsOfInterest.getObjectByID(id);
            if (poi === undefined)
                throw new Error(`Could not find poi with id ${id}`);
            if (poi.discoveryRewards !== undefined && poi.isDiscovered) {
                console.log(`Granting retroactive rewards for ${poi.name}`);
                rewards.addItemsAndCurrency(poi.discoveryRewards);
            }
        });
        rewards.giveRewards(true);
        this.shouldReceiveRetroactivePOIRewards1 = false;
    }
}
/** Base amount of survey XP earned on a hex per survey action */
Cartography.BASE_SURVEY_XP = 1;
/** Determines the survey XP required per survey level */
Cartography.SURVEY_XP_PER_LEVEL = [0, 24, 108, 264, 504, 864];
class RandomTravelEvent extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this.weight = data.weight;
            this._description = data.description;
            if (data.rewards !== undefined)
                this.rewards = new FixedCosts(data.rewards, game);
            if (data.itemsRequired !== undefined)
                this.itemsRequired = game.items.getQuantities(data.itemsRequired);
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(RandomTravelEvent.name, e, this.id);
        }
    }
    get name() {
        return getLangString('RANDOM_TRAVEL_EVENT');
    }
    /** Localized description of the event */
    get description() {
        if (this.isModded)
            return this._description;
        else
            return getLangString(`TRAVEL_EVENT_${this.localID}`);
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.tempBonuses !== undefined)
                this.tempBonuses = game.getModifierValuesFromData(data.tempBonuses);
        } catch (e) {
            throw new DataConstructionError(RandomTravelEvent.name, e, this.id);
        }
    }
}
/** Stores the data for a map created for a digsite */
class DigSiteMap {
    /* #endregion */
    constructor(digSite, game, cartography) {
        this.digSite = digSite;
        this.game = game;
        this.cartography = cartography;
        /* #region Game State Properties */
        /** Number of actions the player has performed to upgrade this map */
        this._upgradeActions = 0;
        /** Refinements (modifiers) that the map has */
        this.refinements = [];
        this.charges = this.getUpgradeCharges();
        this.tier = DigSiteMap.tiers[0];
        this.artefactValues = {
            tiny: this.modifyInitialArtefactValue(DigSiteMap.BASE_ARTEFACT_VALUES.tiny),
            small: this.modifyInitialArtefactValue(DigSiteMap.BASE_ARTEFACT_VALUES.small),
            medium: this.modifyInitialArtefactValue(DigSiteMap.BASE_ARTEFACT_VALUES.medium),
            large: this.modifyInitialArtefactValue(DigSiteMap.BASE_ARTEFACT_VALUES.large),
        };
    }
    /** If this map has reached the maximum tier */
    get atMaxTier() {
        return this.tier === DigSiteMap.tiers[DigSiteMap.tiers.length - 1];
    }
    /** Gets the current number of actions the map has upgraded to */
    get upgradeActions() {
        return this._upgradeActions;
    }
    /** Gets the total number of actions required to upgrade the map to the next tier */
    get nextTierActions() {
        if (this.atMaxTier)
            return this.tier.upgradeActions;
        return DigSiteMap.tiers[this.tier.index + 1].upgradeActions;
    }
    /** The Archaeology level of the map */
    get level() {
        return (19300 /
            (game.archaeology.getArtefactValue(ArtefactType.TINY, this.digSite, this) +
                game.archaeology.getArtefactValue(ArtefactType.SMALL, this.digSite, this) +
                game.archaeology.getArtefactValue(ArtefactType.MEDIUM, this.digSite, this) +
                game.archaeology.getArtefactValue(ArtefactType.LARGE, this.digSite, this) +
                124));
    }
    /** Adds an upgrade action to the map. Returns true if the map has reached the next tier. */
    addUpgradeAction() {
        if (this.atMaxTier)
            return false;
        const oldTier = this.tier;
        const nextTier = DigSiteMap.tiers[oldTier.index + 1];
        this._upgradeActions++;
        if (this._upgradeActions >= nextTier.upgradeActions) {
            this.upgradeTier(nextTier);
        }
        return this.tier !== oldTier;
    }
    /** Performs an upgrade on this map. Adds new charges, and improves artefact values */
    upgradeTier(newTier) {
        this.tier = newTier;
        this.charges += this.getUpgradeCharges();
        this.artefactValues.tiny = this.upgradeArtefactValue(this.artefactValues.tiny);
        this.artefactValues.small = this.upgradeArtefactValue(this.artefactValues.small);
        this.artefactValues.medium = this.upgradeArtefactValue(this.artefactValues.medium);
        this.artefactValues.large = this.upgradeArtefactValue(this.artefactValues.large);
    }
    upgradeArtefactValue(oldValue) {
        oldValue -= this.getUpgradeArtefactValue();
        oldValue = Math.max(oldValue, 1);
        return oldValue;
    }
    /** Rolls a random amount of charges to give on a tier upgrade */
    getUpgradeCharges() {
        let charges = rollInteger(DigSiteMap.CHARGES_PER_TIER.min, DigSiteMap.CHARGES_PER_TIER.max);
        charges *= 1 + this.game.modifiers.mapUpgradeActions / 100;
        charges = Math.max(Math.floor(charges), 0);
        return charges;
    }
    /** Modifies the initial values of the artefact values for a map */
    modifyInitialArtefactValue(value) {
        value *= 1 + this.game.modifiers.initialMapArtefactValues / 100;
        value = Math.max(Math.floor(value), 1);
        return value;
    }
    /** Rolls a random amount of Artefact value to give on a tier upgrade */
    getUpgradeArtefactValue() {
        return rollInteger(DigSiteMap.ARTEFACT_VALUE_PER_TIER.min, DigSiteMap.ARTEFACT_VALUE_PER_TIER.max);
    }
    /** Recomputes the tier of this map */
    computeTier() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.tier = DigSiteMap.tiers.find((tier, i, arr) => {
            return (i === arr.length - 1 ||
                (this._upgradeActions >= tier.upgradeActions && this._upgradeActions < arr[i + 1].upgradeActions));
        });
    }
    getChanceForArtefact(type) {
        var _a;
        const tool = (_a = game.archaeology) === null || _a === void 0 ? void 0 : _a.artefactTypeTools.get(type);
        if (tool === undefined)
            throw new Error(`No tool found for ${type} artefact type`);
        const baseToolCalc = 5 * (1 + (tool.level + 1) / 4);
        switch (type) {
            case ArtefactType.TINY:
                return ((baseToolCalc / (game.archaeology.getArtefactValue(ArtefactType.TINY, this.digSite, this) + 31)) * 100 +
                    this.game.modifiers.tinyArtefactChance);
            case ArtefactType.SMALL:
                return ((baseToolCalc / (game.archaeology.getArtefactValue(ArtefactType.SMALL, this.digSite, this) + 31)) * 100 +
                    this.game.modifiers.smallArtefactChance);
            case ArtefactType.MEDIUM:
                return ((baseToolCalc / (game.archaeology.getArtefactValue(ArtefactType.MEDIUM, this.digSite, this) + 31)) * 100 +
                    this.game.modifiers.mediumArtefactChance);
            case ArtefactType.LARGE:
                return ((baseToolCalc / (game.archaeology.getArtefactValue(ArtefactType.LARGE, this.digSite, this) + 31)) * 100 +
                    this.game.modifiers.largeArtefactChance);
            default:
                return 0;
        }
    }
    consumeCharges(actions = 1) {
        this.cartography.useDigSiteMapCharges(this.digSite, actions);
    }
    encode(writer) {
        writer.writeUint32(this._upgradeActions);
        writer.writeUint32(this.charges);
        writer.writeUint16(this.artefactValues.tiny);
        writer.writeUint16(this.artefactValues.small);
        writer.writeUint16(this.artefactValues.medium);
        writer.writeUint16(this.artefactValues.large);
        writer.writeModifierValues(this.refinements);
        return writer;
    }
    decode(reader, version) {
        this._upgradeActions = reader.getUint32();
        this.charges = reader.getUint32();
        this.artefactValues.tiny = reader.getUint16();
        this.artefactValues.small = reader.getUint16();
        this.artefactValues.medium = reader.getUint16();
        this.artefactValues.large = reader.getUint16();
        this.refinements = reader.getModifierValues(this.game, version);
        if (version < 69)
            reader.getModifierValues(this.game, version);
        this.computeTier();
    }
    /** Creates a new map with average statistics for the given tier. Does not include modifiers */
    static createAverageMap(digSite, game, cartography, tier) {
        const newMap = new DigSiteMap(digSite, game, cartography);
        // Set Upgrade Progress
        newMap._upgradeActions = tier.upgradeActions;
        newMap.tier = tier;
        // Set Charges
        newMap.charges = Math.round(((DigSiteMap.CHARGES_PER_TIER.min + DigSiteMap.CHARGES_PER_TIER.max) * (tier.index + 1)) / 2);
        // Set Artefact Values
        const artefactValuePerTier = Math.round(((DigSiteMap.ARTEFACT_VALUE_PER_TIER.min + DigSiteMap.ARTEFACT_VALUE_PER_TIER.max) * tier.index) / 2);
        newMap.artefactValues.tiny = DigSiteMap.BASE_ARTEFACT_VALUES.tiny - artefactValuePerTier;
        newMap.artefactValues.small = DigSiteMap.BASE_ARTEFACT_VALUES.small - artefactValuePerTier;
        newMap.artefactValues.medium = DigSiteMap.BASE_ARTEFACT_VALUES.medium - artefactValuePerTier;
        newMap.artefactValues.large = DigSiteMap.BASE_ARTEFACT_VALUES.large - artefactValuePerTier;
        return newMap;
    }
}
/** Data for each of the tiers of map */
DigSiteMap.tiers = [{
        index: 0,
        get name() {
            return getLangString('MAP_TIER_NAME_POOR');
        },
        upgradeActions: 0,
        refinementSlots: 1,
    },
    {
        index: 1,
        get name() {
            return getLangString('MAP_TIER_NAME_FINE');
        },
        upgradeActions: 1920,
        refinementSlots: 2,
    },
    {
        index: 2,
        get name() {
            return getLangString('MAP_TIER_NAME_EXCELLENT');
        },
        upgradeActions: 3840,
        refinementSlots: 3,
    },
    {
        index: 3,
        get name() {
            return getLangString('MAP_TIER_NAME_PERFECT');
        },
        upgradeActions: 5760,
        refinementSlots: 6,
    },
];
/** Configures the number of charges given when a maps tier is upgraded */
DigSiteMap.CHARGES_PER_TIER = {
    min: 2000,
    max: 4000,
};
/** Configures the decrease in artefact value when a maps tier is upgraded */
DigSiteMap.ARTEFACT_VALUE_PER_TIER = {
    min: 13,
    max: 23,
};
DigSiteMap.BASE_ARTEFACT_VALUES = {
    tiny: 69,
    small: 69,
    medium: 69,
    large: 69,
};
/** Number of refinements that are selected from when adding a new one */
DigSiteMap.REFINEMENT_SELECTION_COUNT = 3;

function generatePaperMakingRecipes(namespace) {
    const recipes = [];
    const trees = game.woodcutting.actions.namespaceMaps.get(namespace);
    if (trees !== undefined) {
        trees.forEach((tree) => {
            recipes.push({
                id: `Paper_${tree.product.localID}`,
                get baseExperience() {
                    return this.baseQuantity + 2;
                },
                level: 1,
                productId: `${"melvorAoD" /* Namespaces.AtlasOfDiscovery */}:Paper`,
                baseQuantity: Math.ceil(tree.level / 10 + 1),
                costs: {
                    items: [{
                        id: tree.product.id,
                        quantity: 1
                    }],
                },
            });
        });
    }
    downloadTextFile(`paperRecipes_${namespace}.json`, JSON.stringify(recipes), 'data:text/json');
}
//# sourceMappingURL=cartography.js.map
checkFileVersion('?12097')