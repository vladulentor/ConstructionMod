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
// Change the default font style to match the rest of the game
PIXI.TextStyle.defaultStyle.fontFamily = 'Inter';
// Support High Density Displays and Browser Zoom
PIXI.settings.RESOLUTION = window.devicePixelRatio;
PIXI.Filter.defaultResolution = window.devicePixelRatio;
// Configure PIXI asset loader with a cache buster
const MAP_ASSET_VERSION = 14;
PIXI.Assets.init({
    defaultSearchParams: `${MAP_ASSET_VERSION}`
});
class WorldMapDisplayElement extends HTMLElement {
    constructor() {
        /* #region Component Boilerplate */
        super();
        this.mapFilters = [];
        this.accessibleOptions = [];
        this.accessibleOptionsText = [];
        /** If this menu has been initialized */
        this._initialized = false;
        /** Loaded assets for use in the map */
        this.spriteSheets = {};
        /** Loaded assets from the currently visible map */
        this.mapAssets = {};
        /** The unscaled size that the viewport border should be in pixels. Updated on canvas resize */
        this.viewportBorderSize = {
            left: 1,
            right: 1,
            top: 1,
            bottom: 1,
        };
        /** Cache of Graphics of various hexes. Indexed by [borderColour, borderAlpha, bgColour, bgAlpha]*/
        this.hexGraphicCache = new MultiMap(4);
        this.hexPolygon = new PIXI.Polygon();
        /** Map of q, r coords to HexDisplays */
        this.hexDisplays = new Map();
        /** Graphics that show the holes in the map */
        this.holeGraphics = new Map();
        /** MultiMap of q, r coords to HexTooltipElements */
        this.hexTooltips = new MultiMap(2);
        /** Point of interest markers */
        this.poiMarkers = new Map();
        /** Hexes that have queue markers in them */
        this.queueMarked = new Set();
        /** All tooltips that have been assigned to display objects */
        this.tooltips = new Map();
        /** The set of tooltips that are visible on the map. */
        this.visibleTooltips = new Set();
        /** If tooltips are enabled and should show when hovering over display objects */
        this._tooltipsEnabled = true;
        /** The last position the player was rendered on in the map */
        this.lastPlayerPosition = new HexCoords(0, 0);
        /** The last sight range that was rendered on the map */
        this.lastSightRange = 0;
        /** The last survey range that was rendered on the map */
        this.lastSurveyRange = 0;
        this.accessibleModeActive = false;
        this._currentLOD = WorldMapDisplayElement.zoomLevels[0];
        /** The last range of tiles that were drawn */
        this.lastTileRange = {
            start: new Point(0, 0),
            end: new Point(0, 0),
        };
        this.bgTiles = new Map();
        this.visibleAccessibleHexes = [];
        this.accessibleHexPage = 0;
        /** The last aria-alert given to the user. Used to prevent alert spam. */
        this.lastAccessibleAlert = '';
        /** Configures the dimensions of the region in which accessibility should be enabled */
        this.accessibilityRectSize = {
            width: 300,
            height: 300,
        };
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('world-map-display-template'));
        this.canvas = getElementFromFragment(this._content, 'canvas', 'canvas');
        this.bottomLeftOverlay = getElementFromFragment(this._content, 'bottom-left-overlay', 'div');
        this.loadScreen = getElementFromFragment(this._content, 'load-screen', 'div');
        this.loadMessage = getElementFromFragment(this._content, 'load-message', 'span');
        this.surveyOverview = getElementFromFragment(this._content, 'survey-overview', 'survey-overview');
        this.hexOverview = getElementFromFragment(this._content, 'hex-overview', 'hex-overview');
        this.zoomInButton = getElementFromFragment(this._content, 'zoom-in-button', 'button');
        this.zoomOutButton = getElementFromFragment(this._content, 'zoom-out-button', 'button');
        this.homeButton = getElementFromFragment(this._content, 'home-button', 'button');
        this.accessibleOverlay = getElementFromFragment(this._content, 'accessible-overlay', 'div');
        this.accessibleInfo = getElementFromFragment(this._content, 'accessible-info', 'div');
        for (let i = 0; i < 10; i++) {
            this.accessibleOptions.push(getElementFromFragment(this._content, `accessible-option-${i}`, 'div'));
            this.accessibleOptionsText.push(getElementFromFragment(this._content, `accessible-option-${i}-text`, 'span'));
        }
        this.topOverlay = getElementFromFragment(this._content, 'top-overlay', 'div');
        this.locationSearchBar = getElementFromFragment(this._content, 'location-search-bar', 'input');
        this.locationSearchBar.placeholder = getLangString('SEARCH_LOCATIONS');
        this.clearLocationSearchBtn = getElementFromFragment(this._content, 'clear-location-search-btn', 'button');
        this.searchResultsCont = getElementFromFragment(this._content, 'search-results-cont', 'div');
        this.noSearchResult = getElementFromFragment(this._content, 'no-search-result', 'p');
        this.searchResults = getElementFromFragment(this._content, 'search-results', 'ul');
        this.createMapBtn = getElementFromFragment(this._content, 'create-map-btn', 'button');
        this.createMapBtnText = getElementFromFragment(this._content, 'create-map-btn-text', 'span');
        this.createMapSpinner = getElementFromFragment(this._content, 'create-map-spinner', 'div');
        this.createMapInfo = getElementFromFragment(this._content, 'create-map-info', 'span');
        this.poiDiscoveryBtn = getElementFromFragment(this._content, 'poi-discovery-btn', 'button');
        this.poiDiscoveryImg = getElementFromFragment(this._content, 'poi-discovery-img', 'img');
        this.mapFilterBtn = getElementFromFragment(this._content, 'map-filter-btn', 'button');
        this.mapFilterCont = getElementFromFragment(this._content, 'map-filter-cont', 'div');
        this.mapFilterCont.onclick = (e) => e.stopPropagation();
        /* #endregion */
        this.app = new PIXI.Application({
            view: this.canvas,
            autoStart: false,
            autoDensity: true,
            antialias: game.settings.enableMapAntialiasing,
            sharedTicker: true,
        });
        this.app.resizeTo = this;
        // Set up viewport
        this.viewport = new pixi_viewport.Viewport({
            screenWidth: this.offsetWidth,
            screenHeight: this.offsetHeight,
            worldWidth: 1000,
            worldHeight: 1000,
            events: this.app.renderer.events,
        });
        this.keyboardPanning = new KeyboardPanning(this.viewport, {
            deceleration: 3000,
        });
        this.viewport.plugins.add('keyboard-pan', this.keyboardPanning);
        this.viewport
            .drag({})
            .decelerate({
                minSpeed: 0.3,
                friction: 0.96,
            })
            .pinch({})
            .wheel({});
        const tooltipDisabler = new TooltipDisabler(this.viewport, this);
        this.viewport.plugins.add('tooltip-disabler', tooltipDisabler);
        this.app.stage.addChild(this.viewport);
        // Create background layer
        this.bgLayer = new PIXI.Container();
        this.viewport.addChild(this.bgLayer);
        // Create hex overlay container
        this.hexLayer = new PIXI.Container();
        this.viewport.addChild(this.hexLayer);
        this.pathLayer = new PIXI.Container();
        this.pathLayer.eventMode = 'none';
        this.viewport.addChild(this.pathLayer);
        this.markerLayer = new PIXI.Container();
        this.markerLayer.eventMode = 'none';
        this.viewport.addChild(this.markerLayer);
        // Create special functions
        this.updateViewCoords = () => {
            this.lastViewportCoords = new Point(this.viewport.x, this.viewport.y);
        };
        // Load player pin
        this.playerPin = new PIXI.Sprite();
        this.playerPin.anchor.set(0.5, 1);
        this.markerLayer.addChild(this.playerPin);
        // Add Rectangle for accessibility
        this.accessibleRect = new PIXI.Graphics();
        this.accessibleRect.lineStyle({
            width: 2,
            color: 15034215 /* Colours.Danger */ ,
            alignment: 0,
        });
        this.accessibleRect.beginFill(0, 0);
        this.accessibleRect.drawRect(-this.accessibilityRectSize.width / 2, -this.accessibilityRectSize.height / 2, this.accessibilityRectSize.width, this.accessibilityRectSize.height);
        this.accessibleRect.visible = false;
        this.app.stage.addChild(this.accessibleRect);
        this.canvas.setAttribute('aria-label', getLangString('CARTOGRAPHY_PAN_HINT'));
        // Assign Callbacks
        this.clearLocationSearchBtn.onclick = () => this.clearLocationSearch();
        this.canvas.addEventListener('mousedown', (e) => {
            // This prevents mouse clicks from focusing the canvas
            e.preventDefault();
        });
        this.canvas.onfocus = (e) => {
            this.accessibleModeActive = true;
            this.accessibleRect.visible = true;
            showElement(this.accessibleOverlay);
        };
        this.canvas.onblur = () => {
            this.accessibleModeActive = false;
            this.accessibleRect.visible = false;
            hideElement(this.accessibleOverlay);
        };
        this.hexOverview.style.minWidth = '350px'; // Apply minimum width to hex overview
        this.hexOverview.style.zIndex = '1001'; // Overlay on top of Combat minibar
        if (checkMediaQuery('(max-width: 600px)'))
            this.hexOverview.style.width = '100vw'; // Hex overview media query for sizing on mobile
        this.surveyOverview.style.zIndex = '1000'; // Overlay on top of Combat minibar
        if (checkMediaQuery('(max-width: 600px)')) {
            this.surveyOverview.style.width = 'auto'; // survey overview media query for sizing on mobile
            this.surveyOverview.style.marginRight = '52px'; // survey overview media query for sizing on mobile
        }
    }
    get initialized() {
        return this._initialized;
    }
    get ticker() {
        return this.app.ticker;
    }
    /** Readonly. Gets if tooltips are currently enabled. */
    get tooltipsEnabled() {
        return this._tooltipsEnabled;
    }
    get lastDrawnMap() {
        return this._lastDrawnMap;
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Initializes this menu, loading assets */
    init() {
        return __awaiter(this, void 0, void 0, function*() {
            if (this._initialized)
                return;
            // Load the basis parse WASM
            yield PIXI.BasisParser.loadTranscoder('assets/js/basis_transcoder.js', 'assets/js/basis_transcoder.wasm');
            const standardBundle = {};
            standardBundle['standard'] = 'assets/media/skills/cartography/sprites/standardSprites.json';
            PIXI.Assets.addBundle('standard', standardBundle);
            this.spriteSheets = yield PIXI.Assets.loadBundle('standard');
            this.playerPin.texture = this.getStandardTexture("location_pin.png" /* SpriteNames.PlayerMarker */ );
            this._initialized = true;
        });
    }
    getStandardTexture(name) {
        return this.spriteSheets['standard'].textures[name];
    }
    checkInit() {
        if (!this._initialized)
            throw new Error('World Map is not initialized.');
    }
    /** Computes the distance the viewport is from a point */
    getViewportDistance(point) {
        return new Point(this.viewport.x - point.x, this.viewport.y - point.y);
    }
    configureViewport(map, cartography) {
        this.viewport.worldWidth = map.worldSize.x;
        this.viewport.worldHeight = map.worldSize.y;
        this.setViewportSize();
        if (this.viewportEventRemover !== undefined)
            this.viewportEventRemover();
        const zoomListener = (e) => {
            if (e.type !== 'clamp-zoom') {
                this.onZoomChange(map);
                if (e.original !== undefined)
                    this.updateAccessibleZoomAlert(e.original);
            }
        };
        this.viewport.on('zoomed', zoomListener);
        const zoomEndListener = () => {
            this.updateAccessibleMenu(map, cartography);
        };
        this.viewport.on('zoomed-end', zoomEndListener);
        const movedListener = (e) => {
            this.updateBackgroundTiles(map);
            if (e.original !== undefined)
                this.updateAccessibleMoveAlert(e.original);
        };
        this.viewport.on('moved', movedListener);
        const movedEndListener = () => {
            this.updateAccessibleMenu(map, cartography);
        };
        this.viewport.on('moved-end', movedEndListener);
        this.viewportEventRemover = () => {
            this.viewport.off('zoomed-end', zoomEndListener);
            this.viewport.off('zoomed', zoomListener);
            this.viewport.off('moved', movedListener);
            this.viewport.off('moved-end', movedEndListener);
        };
    }
    setViewportSize() {
        if (this.offsetParent === null)
            return;
        this.viewport.resize(this.clientWidth, this.clientHeight);
        // Configure viewport clamping to prevent zooming past world size
        this.viewport.clampZoom({
            maxWidth: this.viewport.worldWidth,
            maxHeight: this.viewport.worldHeight,
            minWidth: this.clientWidth,
            minHeight: this.clientHeight,
        });
        this.computeViewportBorders();
        this.setViewportClamp();
    }
    /** Computes the unscaled border region that the viewport should have */
    computeViewportBorders() {
        // Simple calculation based on canvas size
        this.viewportBorderSize.top = this.clientHeight / 2;
        this.viewportBorderSize.bottom = this.clientHeight / 2;
        this.viewportBorderSize.left = this.clientWidth / 2;
        this.viewportBorderSize.right = this.clientWidth / 2;
        // More complicated calculation based on UI elements
        /*
        const canvasRect = this.canvas.getBoundingClientRect();
        // Set top based on top overlay size
        this.viewportBorderSize.top = this.topOverlay.offsetHeight - this.searchResultsCont.offsetHeight;
        // Bottom overlay size is too variable, just set this to half the canvas height
        this.viewportBorderSize.bottom = canvasRect.height / 2;
        // Left border depends on the current media query for the bottom overlay css
        if (checkMediaQuery('(min-width: 1250px)')) {
          this.viewportBorderSize.left = canvasRect.width * 0.25;
        } else if (checkMediaQuery('(min-width: 768px)')) {
          this.viewportBorderSize.left = canvasRect.width * 0.5;
        } else {
          const homeRect = this.homeButton.getBoundingClientRect();
          this.viewportBorderSize.left = homeRect.right - canvasRect.left;
        }
        // Right border depends on the skilling minibars width (and potentially combat minibar?)
        const minibarRect = (
          document.getElementById('skill-footer-minibar-container') as HTMLDivElement
        ).getBoundingClientRect();
        this.viewportBorderSize.right = canvasRect.right - minibarRect.left;
        */
    }
    /** Configures the clamping of the viewport, based on scaling */
    setViewportClamp() {
        const scale = this.viewport.scaled;
        this.viewport.clamp({
            left: -this.viewportBorderSize.left / scale,
            right: this.viewport.worldWidth + this.viewportBorderSize.right / scale,
            top: -this.viewportBorderSize.top / scale,
            bottom: this.viewport.worldHeight + this.viewportBorderSize.bottom / scale,
            underflow: 'top-left',
        });
    }
    setAccessibleRectPos() {
        if (this.offsetParent === null)
            return;
        this.accessibleRect.x = this.clientWidth / 2;
        this.accessibleRect.y = this.clientHeight / 2;
    }
    configureResizeListener(map) {
        if (this.resizeListener !== undefined)
            window.removeEventListener('resize', this.resizeListener);
        const resizeListener = () => {
            this.setViewportSize();
            this.setAccessibleRectPos();
            if (this.offsetParent !== null)
                this.updateBackgroundTiles(map);
            // Dynamically adjust resolution to support browser zoom operations
            if (window.devicePixelRatio !== this.app.renderer.resolution) {
                this.app.renderer.resolution = window.devicePixelRatio;
                PIXI.Filter.defaultResolution = window.devicePixelRatio;
            }
        };
        window.addEventListener('resize', resizeListener);
        this.resizeListener = resizeListener;
    }
    onZoomChange(map) {
        this.updateBackgroundTiles(map);
        this.setViewportClamp();
        const newScale = this.viewport.scaled;
        let i = 0;
        let newLOD = WorldMapDisplayElement.zoomLevels[i];
        while (newScale < newLOD.minScale) {
            i++;
            newLOD = WorldMapDisplayElement.zoomLevels[i];
        }
        if (newLOD === this._currentLOD)
            return;
        const oldLOD = this._currentLOD;
        this._currentLOD = newLOD;
        // Process XP Progress text scale
        if (newLOD.xpProgressText !== oldLOD.xpProgressText && map.filterSettings.get(8 /* MapFilterType.HexProgress */ )) {
            map.getHexesInRange(map.playerPosition, map.surveyRange).forEach((hex) => {
                var _a;
                (_a = this.getHexDisplay(hex)) === null || _a === void 0 ? void 0 : _a.toggleXPProgressText(newLOD.xpProgressText);
            });
        }
        // Process Border Size Scale
        if (newLOD.hexBorderWidth !== oldLOD.hexBorderWidth && map.filterSettings.get(6 /* MapFilterType.HexGrid */ )) {
            this.hexGraphicCache.clear();
            this.updateAllHexBackgrounds(map);
        }
    }
    onShow() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!this._initialized)
                yield this.init();
            this.app.start();
            this.app.resize();
            this.setViewportSize();
            this.setAccessibleRectPos();
        });
    }
    onHide() {
        this.app.stop();
    }
    showLoading() {
        showElement(this.loadScreen);
    }
    hideLoading() {
        hideElement(this.loadScreen);
    }
    downloadAsJPEG(fileName) {
        return __awaiter(this, void 0, void 0, function*() {
            const imageData = yield this.app.renderer.extract.base64(this.viewport, 'image/jpeg');
            const link = document.createElement('a');
            link.href = imageData;
            link.download = fileName;
            link.textContent = fileName;
            SwalLocale.fire({
                title: 'Download Image',
                html: link,
            });
        });
    }
    showOverview() {
        showElement(this.hexOverview);
        this.surveyOverview.classList.replace('mb-0', 'mb-2');
    }
    hideOverview() {
        hideElement(this.hexOverview);
        this.surveyOverview.classList.replace('mb-2', 'mb-0');
    }
    updateOverview(map, game, cartography) {
        if (map.selectedHex === undefined)
            return;
        else
            this.hexOverview.displayHex(map.selectedHex, game, cartography);
    }
    /** Updates the survey options on the hex-overview */
    updateOverviewSurvey(map, game, cartography) {
        if (map.selectedHex === undefined)
            return;
        this.hexOverview.updateSurveyButtons(map.selectedHex, game, cartography);
    }
    updateOverviewQuantities(game) {
        this.hexOverview.updateQuantities(game);
    }
    highlightHex(hex) {
        const display = this.getHexDisplay(hex);
        if (display === undefined)
            return;
        if (this.lastSurveyedHex === hex)
            display.removeAnimatedBorder();
        display.addAnimatedBorder(hex, 8671702 /* Colours.Amethyst */ );
    }
    unHighlightHex(hex) {
        const display = this.getHexDisplay(hex);
        if (display === undefined)
            return;
        display.removeAnimatedBorder();
        if (this.lastSurveyedHex === hex)
            display.addAnimatedBorder(hex, 3196813 /* Colours.Success */ );
    }
    loadMapAssets(map) {
        return __awaiter(this, void 0, void 0, function*() {
            if (map.assets === undefined) {
                const mapBundle = [];
                let quality = game.settings.mapTextureQuality;
                if (nativeManager.isNativeApp && quality === 2 /* MapTextureQuality.High */ )
                    quality = 1 /* MapTextureQuality.Medium */ ; // Cap quality on mobile
                let tileData = {};
                if (map.isModded)
                    tileData = {
                        modContext: mod.getContext(map.namespace)
                    };
                for (let i = 0; i < map.tiles.dimensions.x; i++) {
                    for (let j = 0; j < map.tiles.dimensions.y; j++) {
                        mapBundle.push({
                            name: `bgTile${i}${j}`,
                            srcs: map.getTileTexture(i, j, quality),
                            data: tileData,
                        });
                    }
                }
                map.fastTravelGroups.forEach((group) => {
                    let groupData = {};
                    if (group.isModded)
                        groupData = {
                            modContext: mod.getContext(group.namespace)
                        };
                    mapBundle.push({
                        name: `fastTravelGroup:${group.id}`,
                        srcs: group.assetURL,
                        data: groupData,
                    });
                });
                PIXI.Assets.addBundle(map.id, mapBundle);
                this.loadMessage.textContent = templateLangString('LOADING_MAP', {
                    percent: '0'
                });
                this.mapAssets = yield PIXI.Assets.loadBundle(map.id, (progress) => {
                    this.loadMessage.textContent = templateLangString('LOADING_MAP', {
                        percent: (progress * 100).toFixed(0)
                    });
                });
                map.assets = this.mapAssets;
            } else {
                this.mapAssets = map.assets;
            }
        });
    }
    computeTileRange(map) {
        const start = new Point(Math.max(Math.floor(this.viewport.left / map.tiles.tileSize.x), 0), Math.max(Math.floor(this.viewport.top / map.tiles.tileSize.y), 0));
        const end = new Point(Math.min(Math.ceil(this.viewport.right / map.tiles.tileSize.x), map.tiles.dimensions.x), Math.min(Math.ceil(this.viewport.bottom / map.tiles.tileSize.y), map.tiles.dimensions.y));
        return {
            start,
            end
        };
    }
    initBackgroundTiles(map) {
        this.bgLayer.removeChildren().forEach((child) => child.destroy({
            children: true,
        }));
        this.bgTiles.clear();
        const tileRange = this.computeTileRange(map);
        this.drawBackgroundTiles(map, tileRange);
    }
    /** Redraws the Background tiles if the tile range changes */
    updateBackgroundTiles(map) {
        const tileRange = this.computeTileRange(map);
        if (Point.isEqual(tileRange.start, this.lastTileRange.start) &&
            Point.isEqual(tileRange.end, this.lastTileRange.end))
            return;
        // Remove BG Sprites that no longer need to be visible
        for (let i = this.lastTileRange.start.x; i < this.lastTileRange.end.x; i++) {
            for (let j = this.lastTileRange.start.y; j < this.lastTileRange.end.y; j++) {
                if (j < tileRange.start.y || j >= tileRange.end.y || i < tileRange.start.x || j >= tileRange.end.x) {
                    const tileID = `${i}_${j}`;
                    const oldTile = this.bgTiles.get(tileID);
                    if (oldTile !== undefined) {
                        this.bgLayer.removeChild(oldTile);
                        oldTile.destroy({
                            children: true
                        });
                        this.bgTiles.delete(tileID);
                    }
                }
            }
        }
        this.drawBackgroundTiles(map, tileRange);
    }
    /** Draws Background tiles that aren't currently visible */
    drawBackgroundTiles(map, tileRange) {
        for (let i = tileRange.start.x; i < tileRange.end.x; i++) {
            for (let j = tileRange.start.y; j < tileRange.end.y; j++) {
                const tileID = `${i}_${j}`;
                if (this.bgTiles.has(tileID))
                    continue;
                const tileSprite = new PIXI.Sprite(this.mapAssets[`bgTile${i}${j}`]);
                tileSprite.width = map.tiles.tileSize.x;
                tileSprite.height = map.tiles.tileSize.y;
                tileSprite.x = i * map.tiles.tileSize.x;
                tileSprite.y = j * map.tiles.tileSize.y;
                this.bgLayer.addChild(tileSprite);
                this.bgTiles.set(tileID, tileSprite);
            }
        }
        this.lastTileRange = tileRange;
    }
    /** Redraws the hex overlay */
    drawHexOverlay(map, cartography) {
        this.hexLayer.removeChildren().forEach((child) => child.destroy({
            children: true,
        }));
        this.hexDisplays.clear();
        this.hexTooltips.clear();
        this.holeGraphics.clear();
        // Draw the holes
        map.holes.forEach((hole) => {
            const graphic = this.getHoleGraphic(hole);
            graphic.eventMode = 'none';
            this.hexLayer.addChild(graphic);
            this.holeGraphics.set(hole, graphic);
            graphic.visible = hole.hexes.length !== hole.surveyedHexes.length;
        });
        // Draw the hex displays
        const vertices = map.getHexVertices();
        this.hexPolygon = new PIXI.Polygon(vertices.map((point) => new PIXI.Point(point.x, point.y)));
        const coordStyle = new PIXI.TextStyle({
            fill: 'white',
            fontSize: 32,
            fontWeight: 'bold',
        });
        // Clone the hex add coordinate labels
        const hexDims = map.getHexDimensions();
        const topLeftLocal = {
            x: -hexDims.width / 2,
            y: -hexDims.height / 2
        };
        const topRightLocal = {
            x: hexDims.width / 2,
            y: hexDims.height / 2
        };
        const showProgress = map.filterSettings.get(8 /* MapFilterType.HexProgress */ );
        const showMastery = map.filterSettings.get(7 /* MapFilterType.MasteryMarkers */ );
        map.forEach((hex) => {
            const hexOrigin = map.getHexOrigin(hex);
            const hexDisp = new HexDisplay(this, hexOrigin, this.getHexGraphics(this.getHexBorderColour(map, hex), this.getHexBorderAlpha(hex), this.getHexBGColour(map, hex), this.getHexBgAlpha(hex)));
            // hexDisp.addCoords(hex, coordStyle);
            if (showProgress && hex.inSurveyRange)
                hexDisp.addXPProgress(hex);
            if (showMastery && hex.isMastered)
                hexDisp.addMasteryMarker(hex);
            // Assign Events to Hexes
            hexDisp.eventMode = 'static';
            this.bindTapEvent(hexDisp, () => cartography.onHexTap(hex));
            const hexTooltip = new HexTooltipElement();
            this.hexTooltips.set(hexTooltip, hex.q, hex.r);
            this.bindTooltip(hexDisp, {
                allowHTML: false,
                content: hexTooltip,
                onShow: () => {
                    hexTooltip.updateContents(hex, cartography);
                },
            }, () => {
                const topLeft = new PIXI.Point();
                const botRight = new PIXI.Point();
                hexDisp.toGlobal(topLeftLocal, topLeft, true);
                hexDisp.toGlobal(topRightLocal, botRight, true);
                const width = botRight.x - topLeft.x;
                const height = botRight.y - topLeft.y;
                return new PIXI.Rectangle(topLeft.x, topLeft.y, width, height);
            });
            this.hexLayer.addChild(hexDisp);
            // Store display
            let rMap = this.hexDisplays.get(hex.q);
            if (rMap === undefined) {
                rMap = new Map();
                this.hexDisplays.set(hex.q, rMap);
            }
            rMap.set(hex.r, hexDisp);
        });
        this.lastPlayerPosition = map.playerPosition;
        this.lastSightRange = map.sightRange;
        this.lastSurveyRange = map.surveyRange;
    }
    getHoleGraphic(hole) {
        const holeGraphic = new PIXI.Graphics();
        holeGraphic.beginFill(3422784 /* Colours.Gray800 */ , 1);
        holeGraphic.drawPolygon(hole.exterior);
        holeGraphic.beginHole();
        hole.holes.forEach((hole) => {
            holeGraphic.drawPolygon(hole);
        });
        holeGraphic.endHole();
        holeGraphic.endFill();
        return holeGraphic;
    }
    updatePOIMarkers(map, cartography) {
        this.clearPOIMarkers();
        map.pointsOfInterest.forEach((poi) => {
            var _a;
            if (poi.isDiscovered ||
                ((poi.hex.inSightRange || poi.hex.isFullySurveyed) && poi.hidden === undefined) ||
                ((_a = poi.hidden) === null || _a === void 0 ? void 0 : _a.showMarker))
                this.updatePOIMarker(map, poi, cartography);
        });
    }
    updateQueueMarkers(queue) {
        const newMarked = new Set();
        queue.forEachForward((hex, i) => {
            if (i === 0)
                return;
            const display = this.getHexDisplay(hex);
            if (display === undefined)
                return;
            this.queueMarked.delete(display);
            newMarked.add(display);
            display.addUpdateQueueMark(hex, i);
        });
        this.queueMarked.forEach((disp) => disp.removeQueueMarker());
        this.queueMarked = newMarked;
    }
    updateAutoSurveyMarkers(nextHexes) {
        const newMarked = new Set();
        nextHexes.forEach((hex, i) => {
            if (i === 0)
                return;
            const display = this.getHexDisplay(hex);
            if (display === undefined)
                return;
            this.queueMarked.delete(display);
            newMarked.add(display);
            display.addUpdateQueueMark(hex, i);
        });
        this.queueMarked.forEach((disp) => disp.removeQueueMarker());
        this.queueMarked = newMarked;
    }
    updateSurveyMarker(hex, timer, cartography) {
        if (this.lastSurveyedHex !== undefined && hex !== this.lastSurveyedHex) {
            const display = this.getHexDisplay(this.lastSurveyedHex);
            display === null || display === void 0 ? void 0 : display.removeSurveyMarker();
            if (!this.lastSurveyedHex.isSelected)
                display === null || display === void 0 ? void 0 : display.removeAnimatedBorder();
            this.lastSurveyedHex = undefined;
        }
        if (hex !== undefined) {
            const display = this.getHexDisplay(hex);
            display === null || display === void 0 ? void 0 : display.addUpdateSurveyMarker(hex, timer);
            if (!hex.isSelected)
                display === null || display === void 0 ? void 0 : display.addAnimatedBorder(hex, 3196813 /* Colours.Success */ );
            this.lastSurveyedHex = hex;
            this.surveyOverview.setHex(cartography, hex);
            showElement(this.surveyOverview);
            this.surveyOverview.progressBar.animateProgressFromTimer(timer);
        } else {
            hideElement(this.surveyOverview);
            this.surveyOverview.progressBar.stopAnimation();
        }
    }
    updateSurveyRates(cartography, hex) {
        this.surveyOverview.updateRates(cartography, hex);
    }
    updateMasteryMarker(hex) {
        const display = this.getHexDisplay(hex);
        if (display === undefined)
            return;
        if (hex.map.filterSettings.get(7 /* MapFilterType.MasteryMarkers */ ) && hex.isMastered) {
            display.addMasteryMarker(hex);
        } else {
            display.removeMasteryMarker();
        }
    }
    updateAllMasteryMarkers(map) {
        map.forEach((hex) => this.updateMasteryMarker(hex));
    }
    /** Loads the assets for a worldMap, then draws it */
    loadWorldMap(map, cartography) {
        return __awaiter(this, void 0, void 0, function*() {
            this.setCreateMapBtn(cartography);
            this.poiDiscoveryBtn.onclick = () => cartography.queueGoToDiscoveryModal(false);
            this.homeButton.onclick = () => cartography.goToPlayerOnClick();
            this.zoomInButton.onclick = () => this.onZoomInDown(map);
            this.zoomOutButton.onclick = () => this.onZoomOutDown(map);
            this.locationSearchBar.onkeyup = () => this.onLocationSearchChange(map, cartography);
            this.canvas.onkeydown = (e) => this.onCanvasKeydown(e, cartography);
            this.populateFilterSettings(map, cartography);
            yield this.loadMapAssets(map);
            this.configureViewport(map, cartography);
            this.configureResizeListener(map);
            this.configurePlayerPin(map);
            this.hexGraphicCache.clear();
            this.drawHexOverlay(map, cartography);
            this.movePlayerMarker(map.playerPosition);
            this.updatePOIMarkers(map, cartography);
            this.moveToHex(map.playerPosition, 1);
            this.initBackgroundTiles(map);
            this._lastDrawnMap = map;
        });
    }
    setCreateMapBtn(cartography) {
        this.createMapBtnText.innerHTML = templateLangString('CREATE_MAP_ICON', {
            icon: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/archaeology/map_colour.png" /* Assets.FullMapSlot */)}">`,
        });
        this.createMapBtn.onclick = () => cartography.createMapOnClick();
    }
    /** Configures the size of the player pin based on map hex scaling */
    configurePlayerPin(map) {
        const scale = (HexCoords.SQRT3 * map.hexScale.y) / this.playerPin.texture.orig.height / 2;
        this.playerPin.scale.set(scale);
    }
    /** Moves the player marker to the specified hex */
    movePlayerMarker(hex) {
        const display = this.getHexDisplay(hex);
        if (display === undefined)
            return;
        this.playerPin.x = display.x;
        this.playerPin.y = display.y;
    }
    /** Toggles the visibility of the player location pin */
    togglePlayerMarker(visible) {
        this.playerPin.visible = visible;
    }
    /** Toggles the visibility of the hex grid (only the lines) */
    updateAllHexBackgrounds(map) {
        map.forEach((hex) => {
            this.updateHexBackground(map, hex);
        });
    }
    /** Updates the hex progress of all the hexes currently in sight range */
    updateAllHexProgress(map, cartography) {
        map.getHexesInRange(map.playerPosition, map.surveyRange).forEach((hex) => {
            this.updateHexProgress(hex, cartography);
        });
    }
    /**
     * Instantly moves the viewport to the center of a hex at given zoom level
     * @param hex The hex to move the center of the viewport to
     * @param zoom The new zoom level
     */
    moveToHex(hex, zoom) {
        if (zoom !== undefined)
            this.viewport.scaled = zoom;
        this.viewport.moveCenter(hex.map.getHexOrigin(hex));
    }
    /**
     * Animates the viewport to move to the center of a hex at a given zoom level
     * @param hex The hex to move the viewport to
     * @param newZoom The zoomlevel to have after moving
     * @param travelSpeed World Units to travel per second
     * @param zoomDoubleTime Time in [s] for each zoom doubling
     */
    animateMoveToHex(hex, newZoom, travelSpeed = 3500, zoomDoubleTime = 0.5) {
        const currentOrigin = this.viewport.center;
        const currentZoom = this.viewport.scaled;
        const newOrigin = hex.map.getHexOrigin(hex);
        const distance = Point.distance(newOrigin, currentOrigin);
        const zoomChange = newZoom > currentZoom ? newZoom / currentZoom : currentZoom / newZoom;
        const time = Math.max((1000 * distance) / travelSpeed, 500 * zoomChange * zoomDoubleTime);
        this.viewport.animate({
            time,
            position: newOrigin,
            scale: newZoom,
            ease: 'easeInOutSine',
        });
    }
    updateHexPath(map) {
        if (map.selectedHexPath === undefined)
            this.removeHexPath();
        else
            this.drawHexPath(map, map.selectedHexPath);
    }
    removeHexPath() {
        this.pathLayer.removeChildren().forEach((child) => child.destroy({
            children: true
        }));
    }
    drawHexPath(map, path) {
        this.checkInit();
        this.removeHexPath();
        for (let i = 0; i < path.length - 1; i++) {
            const next = path[i];
            const prev = path[i + 1];
            if (prev.canFastTravelTo(next))
                this.drawFastTravelPath(next, prev);
            else
                this.drawPathArrow(next, prev);
        }
    }
    drawPathArrow(next, prev) {
        const nextOrigin = next.map.getHexOrigin(next);
        const prevOrigin = next.map.getHexOrigin(prev);
        const midOrigin = Point.average(nextOrigin, prevOrigin);
        const arrowLength = Point.distance(nextOrigin, prevOrigin) * 0.8;
        const shaftWidth = (arrowLength * 0.1) / 2;
        const headWidth = (arrowLength * 0.2) / 2;
        const headHeight = (headWidth / 2) * Math.sqrt(3);
        const shaftHeight = arrowLength - headHeight;
        const bottom = -arrowLength / 2;
        const top = -bottom;
        const shaftTop = bottom + shaftHeight;
        const arrowPoly = new PIXI.Polygon([
            new PIXI.Point(-shaftWidth, bottom),
            new PIXI.Point(-shaftWidth, shaftTop),
            new PIXI.Point(-headWidth, shaftTop),
            new PIXI.Point(0, top),
            new PIXI.Point(headWidth, shaftTop),
            new PIXI.Point(shaftWidth, shaftTop),
            new PIXI.Point(shaftWidth, bottom),
        ]);
        const arrowGraphics = new PIXI.Graphics();
        arrowGraphics.lineStyle({
            width: 2,
            color: 3884628 /* Colours.PrimaryDark */ ,
            alignment: 0.5,
        });
        arrowGraphics.beginFill(5339606 /* Colours.Primary */ , 1);
        arrowGraphics.drawPolygon(arrowPoly);
        arrowGraphics.endFill();
        arrowGraphics.x = midOrigin.x;
        arrowGraphics.y = midOrigin.y;
        arrowGraphics.rotation = Point.vecAngle(prevOrigin, nextOrigin) - Math.PI / 2;
        this.pathLayer.addChild(arrowGraphics);
    }
    drawFastTravelPath(next, prev) {
        const destOrigin = next.map.getHexOrigin(next);
        const prevOrigin = next.map.getHexOrigin(prev);
        const distance = Point.distance(destOrigin, prevOrigin);
        const pathUnitVec = Point.divide(Point.sub(destOrigin, prevOrigin), distance);
        const dotRadius = next.height / 16;
        const dotGap = dotRadius * 2;
        const unitLength = 2 * dotRadius + dotGap;
        const numDots = Math.floor(distance / unitLength);
        const endPadding = (distance - numDots * unitLength) / 2;
        const unitVec = Point.mult(pathUnitVec, unitLength);
        const dotPath = new PIXI.Graphics();
        dotPath.beginFill(15034215 /* Colours.Danger */ );
        const currentCenter = Point.mult(pathUnitVec, endPadding + unitLength / 2);
        for (let i = 0; i < numDots; i++) {
            dotPath.drawCircle(currentCenter.x, currentCenter.y, dotRadius);
            currentCenter.x += unitVec.x;
            currentCenter.y += unitVec.y;
        }
        dotPath.endFill();
        dotPath.x = prevOrigin.x;
        dotPath.y = prevOrigin.y;
        this.pathLayer.addChild(dotPath);
    }
    updateVision(map, cartography) {
        const oldHexes = map.getHexesInRange(this.lastPlayerPosition, this.lastSightRange);
        const newHexes = map.getHexesInRange(map.playerPosition, map.sightRange);
        const updated = new Set();
        const updateHex = (hex) => {
            if (updated.has(hex))
                return;
            this.updateHexBackground(map, hex);
            this.updateHexProgress(hex, cartography);
            updated.add(hex);
        };
        oldHexes.forEach(updateHex);
        newHexes.forEach(updateHex);
        // Update POI markers.
        const shownPoi = new Set();
        newHexes.forEach((hex) => {
            if (hex.pointOfInterest === undefined)
                return;
            this.updatePOIMarker(map, hex.pointOfInterest, cartography);
            shownPoi.add(hex);
        });
        oldHexes.forEach((hex) => {
            if (hex.pointOfInterest === undefined || shownPoi.has(hex) || hex.pointOfInterest.isDiscovered)
                return;
            this.removePOIMarker(hex.pointOfInterest);
        });
        this.lastPlayerPosition = map.playerPosition;
        this.lastSightRange = map.sightRange;
        this.lastSurveyRange = map.surveyRange;
    }
    updateHexBackground(map, hex) {
        const display = this.getHexDisplay(hex);
        if (display === undefined)
            return;
        const borderColour = this.getHexBorderColour(map, hex);
        const borderAlpha = this.getHexBorderAlpha(hex);
        const bgAlpha = map.numberOfHexes - map.fullySurveyedHexes < 5 && !hex.isFullySurveyed ? 1 : this.getHexBgAlpha(hex);
        const bgColour = this.getHexBGColour(map, hex);
        display.setHexColour(borderColour, borderAlpha, bgColour, bgAlpha);
    }
    /** Updates the visibility of a hole based on the hexes around it */
    updateHole(hole) {
        const holeGraphic = this.holeGraphics.get(hole);
        if (holeGraphic === undefined)
            return;
        holeGraphic.visible = hole.hexes.length !== hole.surveyedHexes.length;
    }
    updateHexProgress(hex, cartography) {
        const display = this.getHexDisplay(hex);
        if (display === undefined)
            return;
        if ((hex.inSurveyRange || hex === cartography.currentlySurveyedHex) &&
            hex.map.filterSettings.get(8 /* MapFilterType.HexProgress */ )) {
            if (display.xpProgress !== undefined)
                display.updateXPProgress(hex);
            else
                display.addXPProgress(hex);
        } else {
            display.removeXPProgress();
        }
    }
    clearPOIMarkers() {
        this.poiMarkers.forEach((marker) => {
            this.markerLayer.removeChild(marker);
            marker.destroy();
        });
        this.poiMarkers.clear();
    }
    updatePOIMarker(map, poi, cartography) {
        const existingMarker = this.poiMarkers.get(poi);
        let markerTexture;
        let shouldShow;
        if (poi.isDiscovered) {
            if (poi instanceof DigSitePOI) {
                markerTexture = this.getStandardTexture("dig_site.png" /* SpriteNames.DigSite */ );
                shouldShow = map.filterSettings.get(3 /* MapFilterType.Digsites */ );
            } else if (poi instanceof Watchtower) {
                markerTexture = this.getStandardTexture("watchtower.png" /* SpriteNames.Watchtower */ );
                shouldShow = map.filterSettings.get(4 /* MapFilterType.Watchtowers */ );
            } else if (poi.fastTravel !== undefined) {
                markerTexture = this.mapAssets[`fastTravelGroup:${poi.fastTravel.group.id}`];
                shouldShow = map.filterSettings.getGroup(poi.fastTravel.group);
            } else if (poi.hasActiveEffect) {
                markerTexture = this.getStandardTexture("active_poi.png" /* SpriteNames.ActivePOI */ );
                shouldShow = map.filterSettings.get(9 /* MapFilterType.ActivePOIs */ );
            } else {
                markerTexture = this.getStandardTexture("point_of_interest.png" /* SpriteNames.PointOfInterest */ );
                shouldShow = map.filterSettings.get(5 /* MapFilterType.OtherPOIs */ );
            }
        } else if (poi.hidden === undefined) {
            if (poi instanceof DigSitePOI) {
                markerTexture = this.getStandardTexture("undisc_dig_site.png" /* SpriteNames.UndiscoveredDigSite */ );
                shouldShow = map.filterSettings.get(1 /* MapFilterType.UndiscoveredDigsite */ );
            } else {
                markerTexture = this.getStandardTexture("undisc_POI.png" /* SpriteNames.UndiscoveredPOI */ );
                shouldShow = map.filterSettings.get(2 /* MapFilterType.UndiscoveredPOI */ );
            }
        } else if (poi.hidden.showMarker && cartography.isHiddenPOIMet(poi.hidden)) {
            const marker = game.settings.useCat ? "hidden_poi.png" /* SpriteNames.HiddenMarker */ : "undisc_dig_site.png" /* SpriteNames.UndiscoveredDigSite */ ;
            markerTexture = this.getStandardTexture(marker);
            shouldShow = true; // TODO: Add a map filter for this
        } else {
            return; // Do not show hidden POIs that do not show markers
        }
        if (!shouldShow)
            return;
        if (existingMarker === undefined)
            this.drawPOIMarker(poi, markerTexture);
        else
            this.changePoiMarkerTexture(existingMarker, poi, markerTexture);
    }
    drawPOIMarker(poi, texture) {
        const marker = new PIXI.Sprite();
        this.changePoiMarkerTexture(marker, poi, texture);
        marker.anchor.set(0.5);
        const display = this.getHexDisplay(poi.hex);
        if (display === undefined)
            return;
        marker.x = display.x;
        marker.y = display.y;
        this.markerLayer.addChildAt(marker, 0);
        this.poiMarkers.set(poi, marker);
    }
    changePoiMarkerTexture(marker, poi, texture) {
        marker.texture = texture;
        marker.scale.set((poi.hex.height * 0.5) / marker.texture.orig.height);
    }
    removePOIMarker(poi) {
        const marker = this.poiMarkers.get(poi);
        if (marker === undefined)
            return;
        this.markerLayer.removeChild(marker);
        marker.destroy();
        this.poiMarkers.delete(poi);
    }
    getHexBorderColour(map, hex) {
        var _a;
        if (((_a = hex.pointOfInterest) === null || _a === void 0 ? void 0 : _a.hasActiveEffect) && hex.pointOfInterest.isDiscovered) {
            return map.activePOIBorderColour;
        } else {
            return map.hexBorderColour;
        }
    }
    getHexBorderAlpha(hex) {
        return hex.map.shouldHexHaveBorder(hex) ? 1 : 0;
    }
    getHexBgAlpha(hex) {
        return 1 - hex.surveyLevel / hex.maxSurveyLevel;
    }
    getHexBGColour(map, hex) {
        const distance = HexCoords.distance(hex, map.playerPosition);
        if (distance > map.sightRange) {
            return 3422784 /* Colours.Gray800 */ ;
        } else if (distance > map.surveyRange) {
            return 4804695 /* Colours.Gray700 */ ;
        } else {
            return 7107965 /* Colours.Gray600 */ ;
        }
    }
    getHexDisplay(coords) {
        var _a;
        return (_a = this.hexDisplays.get(coords.q)) === null || _a === void 0 ? void 0 : _a.get(coords.r);
    }
    /**
     * Gets a hex graphics with specified style
     * @param border Hex colour of border
     * @param bg Hex colour of background
     * @param bgAlpha Alpha value of background
     * @returns
     */
    getHexGraphics(border, borderAlpha, bg, bgAlpha) {
        let hex = this.hexGraphicCache.get(border, borderAlpha, bg, bgAlpha);
        if (hex === undefined) {
            hex = this.createHexGraphics(border, borderAlpha, bg, bgAlpha);
            this.hexGraphicCache.set(hex, border, borderAlpha, bg, bgAlpha);
        }
        return hex;
    }
    createHexGraphics(border, borderAlpha, bg, bgAlpha) {
        const hex = new PIXI.Graphics();
        hex.lineStyle({
            width: this._currentLOD.hexBorderWidth,
            color: border,
            alpha: borderAlpha,
            alignment: 0,
        });
        hex.beginFill(bg, bgAlpha);
        hex.drawPolygon(this.hexPolygon);
        hex.endFill();
        return hex;
    }
    /**
     * Binds a tooltip to a display object
     * @param displayObj The object to bind a tooltip to.
     * @param props Standard Tippy properties for the tooltip
     * @param rectCalculator Optional. Custom global bounds calculator for the display object. Used to determine the bounding rectangle for the tooltip. If unset bounds of display object will be used
     * @returns
     */
    bindTooltip(displayObj, props, rectCalculator) {
        if (this.tooltips.has(displayObj))
            throw new Error('Object already has a tooltip');
        const boundingRect = new DOMRect();
        const tooltip = tippy(this.canvas, Object.assign({
            getReferenceClientRect: () => boundingRect,
            trigger: 'manual',
        }, props));
        const mapTooltip = {
            eventUnbinder: () => {},
            clientRect: boundingRect,
            displayObj,
            tooltip,
        };
        if (rectCalculator !== undefined)
            mapTooltip.rectCalculator = rectCalculator;
        const mouseover = (e) => {
            if (e.nativeEvent.target !== this.canvas || !this._tooltipsEnabled)
                return;
            this.showTooltip(mapTooltip);
        };
        const mouseout = (e) => {
            if (e.nativeEvent.target !== this.canvas || !this._tooltipsEnabled)
                return;
            this.hideTooltip(mapTooltip);
        };
        const removed = () => this.unbindTooltip(displayObj);
        displayObj.on('mouseover', mouseover);
        displayObj.on('mouseout', mouseout);
        displayObj.on('removed', removed);
        mapTooltip.eventUnbinder = () => {
            displayObj.removeListener('mouseovercapture', mouseover);
            displayObj.removeListener('mouseoutcapture', mouseout);
            displayObj.removeListener('removed', removed);
        };
        this.tooltips.set(displayObj, mapTooltip);
        return mapTooltip;
    }
    showTooltip(mapTooltip) {
        this.setTooltipClientRect(mapTooltip);
        mapTooltip.tooltip.show();
        this.visibleTooltips.add(mapTooltip);
    }
    hideTooltip(mapTooltip) {
        mapTooltip.tooltip.hide();
        this.visibleTooltips.delete(mapTooltip);
    }
    /** Unbinds a tooltip from a display object */
    unbindTooltip(displayObj) {
        const mapTooltip = this.tooltips.get(displayObj);
        if (mapTooltip === undefined)
            return;
        mapTooltip.eventUnbinder();
        mapTooltip.tooltip.destroy();
        this.tooltips.delete(displayObj);
    }
    getTooltipUnderPointer() {
        const pointer = this.app.renderer.events.pointer;
        if (pointer.pointerType !== 'mouse')
            return;
        const dispObject = this.app.renderer.events.rootBoundary.hitTest(pointer.globalX, pointer.globalY);
        return this.tooltips.get(dispObject);
    }
    showTooltipsOnMove() {
        var _a;
        const shouldShow = this.getTooltipUnderPointer();
        let isShown = false;
        this.visibleTooltips.forEach((tooltip) => {
            if (tooltip === shouldShow) {
                isShown = true;
            } else {
                this.hideTooltip(tooltip);
            }
        });
        if (shouldShow !== undefined) {
            if (!isShown) {
                this.showTooltip(shouldShow);
            } else {
                this.setTooltipClientRect(shouldShow);
                (_a = shouldShow.tooltip.popperInstance) === null || _a === void 0 ? void 0 : _a.update();
            }
        }
    }
    /** Performs hit detection, and shows the tooltip for the DisplayObject currently under the cursor (if any) */
    showTooltipUnderPointer() {
        const tooltip = this.getTooltipUnderPointer();
        if (tooltip !== undefined)
            this.showTooltip(tooltip);
    }
    /** Disables tooltips, and hides the currently open one (if any) */
    disableTooltips() {
        if (!this._tooltipsEnabled)
            return;
        this.visibleTooltips.forEach((tooltip) => this.hideTooltip(tooltip));
        this._tooltipsEnabled = false;
    }
    /** Enables tooltips, and performs hit detection to show the appropriate tooltip the pointer is over (if any) */
    enableTooltips() {
        if (this._tooltipsEnabled)
            return;
        if (this.canvas.matches(':hover'))
            this.showTooltipUnderPointer();
        this._tooltipsEnabled = true;
    }
    viewCoordsChanged() {
        return (this.lastViewportCoords !== undefined &&
            (this.lastViewportCoords.x !== this.viewport.x || this.lastViewportCoords.y !== this.viewport.y));
    }
    /** Binds a tap event to a display object. Prevents accidental taps that result from dragging the viewport */
    bindTapEvent(displayObj, callback) {
        displayObj.on('pointerdown', this.updateViewCoords);
        displayObj.on('pointertap', () => {
            if (this.viewCoordsChanged())
                return;
            callback();
        });
    }
    getTooltipClientRect(mapTooltip) {
        const objBounds = mapTooltip.rectCalculator !== undefined ? mapTooltip.rectCalculator() : mapTooltip.displayObj.getBounds(true);
        const canvasRect = this.canvas.getBoundingClientRect();
        return new DOMRect(objBounds.x + canvasRect.x, objBounds.y + canvasRect.y, objBounds.width, objBounds.height);
    }
    setTooltipClientRect(mapTooltip) {
        const bounds = this.getTooltipClientRect(mapTooltip);
        mapTooltip.clientRect.x = bounds.x;
        mapTooltip.clientRect.y = bounds.y;
        mapTooltip.clientRect.width = bounds.width;
        mapTooltip.clientRect.height = bounds.height;
    }
    onPanKeyDown(dir) {
        this.keyboardPanning.setMove(dir);
    }
    onPanKeyUp(dir) {
        this.keyboardPanning.removeMove(dir);
    }
    onZoomInDown(map) {
        const newZoom = this.viewport.scaled * 1.2;
        this.viewport.animate({
            time: 100,
            scale: newZoom,
        });
    }
    onZoomOutDown(map) {
        const newZoom = this.viewport.scaled * 0.8;
        this.viewport.animate({
            time: 100,
            scale: newZoom,
        });
    }
    clearLocationSearch() {
        this.locationSearchBar.value = '';
        hideElement(this.searchResultsCont);
    }
    onLocationSearchChange(map, cartography) {
        const query = this.locationSearchBar.value.trim();
        if (query === '') {
            hideElement(this.searchResultsCont);
        } else {
            const fuse = new Fuse(map.discoveredPOIs, {
                shouldSort: true,
                tokenize: true,
                matchAllTokens: true,
                findAllMatches: true,
                threshold: 0.1,
                location: 0,
                distance: 100,
                maxPatternLength: 32,
                minMatchCharLength: 1,
                keys: ['name', 'searchText'],
            });
            const result = fuse.search(query);
            this.searchResults.textContent = '';
            if (result.length === 0) {
                this.locationSearchBar.classList.add('text-danger');
                showElement(this.noSearchResult);
                hideElement(this.searchResults);
            } else {
                this.locationSearchBar.classList.remove('text-danger');
                hideElement(this.noSearchResult);
                showElement(this.searchResults);
                result.forEach((poi) => {
                    const newResult = new PoiSearchResultElement();
                    newResult.setCallback(() => {
                        this.animateMoveToHex(poi.hex, 1);
                        cartography.onHexTap(poi.hex);
                    });
                    newResult.setPoi(poi, cartography);
                    this.searchResults.append(newResult);
                });
            }
            showElement(this.searchResultsCont);
        }
    }
    populateFilterSettings(map, cartography) {
        this.mapFilterCont.textContent = '';
        this.mapFilters = [];
        MapFilterSettings.filterDisplayOrder.forEach((i) => {
            switch (i) {
                case 1 /* MapFilterType.UndiscoveredDigsite */ :
                case 3 /* MapFilterType.Digsites */ :
                    if (!map.hasDigSites)
                        return;
                    break;
                case 4 /* MapFilterType.Watchtowers */ :
                    if (!map.hasWatchtowers)
                        return;
                    break;
                case 9 /* MapFilterType.ActivePOIs */ :
                    if (!map.hasActivePOIs)
                        return;
                    break;
            }
            const filter = MapFilterSettings.filters[i];
            const filterOption = createElement('world-map-filter', {
                parent: this.mapFilterCont
            });
            filterOption.setFilter(filter.media, filter.name, (newValue) => cartography.mapFilterOnChange(i, newValue), `map-filter-setting-${i}`);
            filterOption.updateChecked(map.filterSettings.get(i));
            this.mapFilters.push(filterOption);
        });
        map.fastTravelGroups.forEach((group) => {
            const filterOption = createElement('world-map-filter', {
                parent: this.mapFilterCont
            });
            filterOption.setFilter(group.media, group.name, (newValue) => cartography.fastTravelGroupOnChange(group, newValue), `map-filter-setting-${group.id}`);
            filterOption.updateChecked(map.filterSettings.getGroup(group));
            this.mapFilters.push(filterOption);
        });
    }
    /** Updates the spinner and progress in the world map spinner */
    updateSpinner(cartography) {
        if (cartography.isActive) {
            switch (cartography.actionMode) {
                case 3 /* CartographyActionMode.PaperMaking */ :
                    showElement(this.createMapSpinner);
                    this.createMapInfo.textContent = getLangString('MAKING_PAPER');
                    break;
                case 4 /* CartographyActionMode.MapUpgrading */ :
                    showElement(this.createMapSpinner);
                    this.createMapInfo.textContent = getLangString('UPGRADING_MAPS');
                    break;
                default:
                    hideElement(this.createMapSpinner);
            }
        } else {
            hideElement(this.createMapSpinner);
        }
    }
    /** Gets the hexes that are within the accessibility rectangle */
    getAccessibleHexes(map) {
        const worldWidth = this.accessibilityRectSize.width / this.viewport.scale.x;
        const worldHeight = this.accessibilityRectSize.height / this.viewport.scale.y;
        const center = this.viewport.center;
        return map.getHexesInRectangle(new PIXI.Rectangle(center.x - worldWidth / 2, center.y - worldWidth / 2, worldWidth, worldHeight));
    }
    showAccessibleInfo(message) {
        if (message === this.lastAccessibleAlert)
            return;
        this.accessibleOverlay.removeAttribute('aria-label');
        this.accessibleInfo.textContent = message;
        this.accessibleOptions.forEach(hideElement);
        showElement(this.accessibleInfo);
        this.lastAccessibleAlert = message;
    }
    updateAccessibleMoveAlert(originalPos) {
        const distance = this.getViewportDistance(originalPos);
        const angle = PIXI.RAD_TO_DEG * Math.atan2(distance.y, distance.x);
        let direction;
        if (angle < -157.5) {
            direction = 'East';
        } else if (angle < -112.5) {
            direction = 'Southeast';
        } else if (angle < -67.5) {
            direction = 'South';
        } else if (angle < -22.5) {
            direction = 'Southwest';
        } else if (angle < 22.5) {
            direction = 'West';
        } else if (angle < 67.5) {
            direction = 'Northwest';
        } else if (angle < 112.5) {
            direction = 'North';
        } else if (angle < 157.5) {
            direction = 'Northeast';
        } else {
            direction = 'East';
        }
        this.showAccessibleInfo(`Moving ${direction}`); // TODO_L
    }
    updateAccessibleZoomAlert(originalScale) {
        let message;
        if (this.viewport.scale.x > originalScale.x) {
            this.showAccessibleInfo('Zooming In'); // TODO_L
        } else if (this.viewport.scale.x < originalScale.x) {
            this.showAccessibleInfo('Zooming Out'); // TODO_L
        }
    }
    updateAccessibleMenu(map, cartography) {
        const hexes = this.getAccessibleHexes(map);
        this.visibleAccessibleHexes = hexes;
        if (hexes.length > 0) {
            this.showAccessibleHexPage(0, cartography);
            hideElement(this.accessibleInfo);
            this.accessibleInfo.textContent = '';
            this.lastAccessibleAlert = '';
        } else {
            this.showAccessibleInfo('No locations in highlighted area'); // TODO_L
        }
    }
    hasNextAccessiblePage(currentPage) {
        return this.visibleAccessibleHexes.length > (currentPage + 1) * 8;
    }
    showAccessibleHexPage(page, cartography) {
        this.detailViewedHex = undefined;
        this.accessibleHexPage = page;
        const ariaSentences = [];
        const startIndex = page * 8;
        for (let i = 0; i < 8; i++) {
            const hex = this.visibleAccessibleHexes[startIndex + i];
            if (hex === undefined) {
                hideElement(this.accessibleOptions[i]);
                this.accessibleOptionsText[i].textContent = '';
            } else {
                const desc = hex.getAccessibleDescription(cartography);
                this.accessibleOptions[i].setAttribute('aria-hidden', 'true');
                this.accessibleOptionsText[i].textContent = desc;
                if (i === 0)
                    ariaSentences.push(`Press ${i} to get details about ${desc}`); // TODO_L
                else
                    ariaSentences.push(`${i} for ${desc}`); // TODO_L
                showElement(this.accessibleOptions[i]);
            }
        }
        if (page > 0) {
            this.accessibleOptionsText[8].textContent = 'View previous in area'; // TODO_L
            ariaSentences.push(`Press 8 to view previous in area.`);
            this.accessibleOptions[8].setAttribute('aria-hidden', 'true');
            showElement(this.accessibleOptions[8]);
        } else {
            hideElement(this.accessibleOptions[8]);
        }
        if (this.hasNextAccessiblePage(page)) {
            this.accessibleOptionsText[9].textContent = 'View more in area'; // TODO_L
            ariaSentences.push(`Press 9 to view more in area.`);
            this.accessibleOptions[9].setAttribute('aria-hidden', 'true');
            showElement(this.accessibleOptions[9]);
        } else {
            hideElement(this.accessibleOptions[9]);
        }
        this.accessibleOverlay.setAttribute('aria-label', ariaSentences.join(' '));
    }
    showAccessibleHexDetails(hex, cartography) {
        this.detailViewedHex = hex;
        const desc = hex.getAccessibleDetails(cartography);
        for (let i = 0; i < 10; i++) {
            switch (i) {
                case 0:
                    if (hex.surveyLevel > 0 || hex.inSightRange || hex === cartography.currentlySurveyedHex) {
                        this.accessibleOptionsText[i].textContent = hex.isSelected ? 'Deselect Hex' : 'Select Hex';
                        showElement(this.accessibleOptions[i]);
                    } else {
                        hideElement(this.accessibleOptions[i]);
                    }
                    break;
                case 1:
                    this.accessibleOptionsText[i].textContent = 'View Previous';
                    showElement(this.accessibleOptions[i]);
                    break;
                default:
                    hideElement(this.accessibleOptions[i]);
                    break;
            }
        }
        this.accessibleOverlay.setAttribute('aria-label', desc);
    }
    onCanvasKeydown(e, cartography) {
        if (!this.accessibleModeActive)
            return;
        // Ignore any input with key modifiers
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)
            return;
        if (this.detailViewedHex === undefined) {
            // Process number inputs based on accessibleHexes
            if (this.visibleAccessibleHexes.length === 0)
                return;
            const startIndex = this.accessibleHexPage * 8;
            switch (e.key) {
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                    {
                        const index = Number.parseInt(e.key);
                        const hexIndex = startIndex + index;
                        const hex = this.visibleAccessibleHexes[hexIndex];
                        this.showAccessibleHexDetails(hex, cartography);
                    }
                    break;
                case '8':
                    // Go to previous page
                    if (this.accessibleHexPage > 0)
                        this.showAccessibleHexPage(this.accessibleHexPage - 1, cartography);
                    break;
                case '9':
                    // Go to next page
                    if (this.hasNextAccessiblePage(this.accessibleHexPage))
                        this.showAccessibleHexPage(this.accessibleHexPage + 1, cartography);
                    break;
            }
        } else {
            switch (e.key) {
                case '0':
                    cartography.onHexTap(this.detailViewedHex);
                    break;
                case '1':
                    this.showAccessibleHexPage(this.accessibleHexPage, cartography);
                    break;
            }
        }
    }
    /** Updates the visibility and image of the POI discovery button */
    updatePOIDiscoveryBtn(nextPOI) {
        if (nextPOI === undefined) {
            hideElement(this.poiDiscoveryBtn);
        } else {
            if (nextPOI instanceof DigSitePOI) {
                this.poiDiscoveryImg.src = assets.getURI("assets/media/skills/cartography/sprites/undisc_dig_site.svg" /* Assets.UndiscoveredDigSite */ );
            } else {
                this.poiDiscoveryImg.src = assets.getURI("assets/media/skills/cartography/sprites/undisc_POI.svg" /* Assets.UndiscoveredPOI */ );
            }
            showElement(this.poiDiscoveryBtn);
        }
    }
    addFPSCounter() {
        const fpsLabel = new PIXI.Text('0 FPS', {
            fill: '#008000',
            fontFamily: '"Lucida Console", Monaco, monospace',
            stroke: '#ffffff',
            strokeThickness: 1,
            align: 'right',
        });
        this.app.stage.addChild(fpsLabel);
        fpsLabel.y = 200;
        this.app.ticker.add(() => {
            fpsLabel.text = `${Math.round(this.app.ticker.FPS)} FPS`;
        });
    }
}
WorldMapDisplayElement.zoomLevels = [{
        xpProgressText: true,
        hexBorderWidth: 2,
        minScale: 0.5,
    },
    {
        xpProgressText: false,
        hexBorderWidth: 3,
        minScale: 0.25,
    },
    {
        xpProgressText: false,
        hexBorderWidth: 4,
        minScale: 0.125,
    },
    {
        xpProgressText: false,
        hexBorderWidth: 5,
        minScale: -Infinity,
    },
];
let soonTM = false;

function onYouTubeIframeAPIReady() {
    soonTM = true;
}
class HexDisplay extends PIXI.Container {
    constructor(worldMap, origin, template) {
        super();
        this.worldMap = worldMap;
        this.x = origin.x;
        this.y = origin.y;
        this.addChild(new PIXI.Graphics(template.geometry));
        this.interactiveChildren = false;
        this.sortableChildren = true;
        this.hitArea = worldMap.hexPolygon;
        this.cullable = true;
    }
    get hasAnimatedBorder() {
        return this.animatedBorder !== undefined;
    }
    /** Swaps the hex graphics with the provided */
    swapHex(template) {
        this.removeChildAt(0).destroy();
        this.addChildAt(new PIXI.Graphics(template.geometry), 0);
    }
    setHexColour(border, borderAlpha, bg, bgAlpha) {
        this.swapHex(this.worldMap.getHexGraphics(border, borderAlpha, bg, bgAlpha));
    }
    addCoords(hex, style) {
        const offset = hex.to_oddq();
        const pixelRatio = window.devicePixelRatio || 1;
        const coordText = new PIXI.Text(`${offset.toAlphaCoords()}\n q: ${hex.q}, r: ${hex.r}`, style);
        coordText.resolution = pixelRatio;
        coordText.anchor.set(0.5);
        coordText.zIndex = 5 /* HexDisplayZIndex.CoordText */ ;
        this.addChild(coordText);
    }
    updateXPProgress(hex) {
        if (this.xpProgress === undefined)
            return;
        const level = hex.surveyLevel;
        const maxLevel = hex.maxLevel;
        const xp = hex.surveyXP;
        const nextLevel = Math.min(hex.maxLevel, level + 1);
        const xpToCurrent = Hex.getXPFromLevel(level);
        const xpToNext = Hex.getXPFromLevel(nextLevel);
        const xpProgress = hex.isMaxLevel ? 1 : (xp - xpToCurrent) / (xpToNext - xpToCurrent);
        this.xpProgress.progressPercent = xpProgress;
        this.xpProgress.botText = `${Math.floor(xp)} / ${xpToNext}`;
        if (hex.isMaxLevel) {
            this.xpProgress.topText = getLangString('MAX_LEVEL');
            this.xpProgress.fillColour = 15052391 /* Colours.Warning */ ;
        } else {
            this.xpProgress.topText = templateLangString('MENU_TEXT_LEVEL_OUT_OF', {
                level: `${level}`,
                maxLevel: `${maxLevel}`,
            });
            this.xpProgress.fillColour = 6073573 /* Colours.Info */ ;
        }
    }
    addXPProgress(hex) {
        if (this.xpProgress !== undefined)
            throw new Error('Already has xp progress.');
        const progress = new XPProgressDisplay({
            width: hex.map.hexScale.x,
            height: hex.height / 4,
        });
        progress.position.set(0, hex.height * 0.375);
        progress.zIndex = 1 /* HexDisplayZIndex.XPProgress */ ;
        this.addChild(progress);
        this.xpProgress = progress;
        this.updateXPProgress(hex);
    }
    removeXPProgress() {
        if (this.xpProgress === undefined)
            return;
        this.removeChild(this.xpProgress);
        this.xpProgress.destroy({
            children: true
        });
        this.xpProgress = undefined;
    }
    toggleXPProgressText(visible) {
        if (this.xpProgress === undefined)
            return;
        this.xpProgress.toggleText(visible);
    }
    addUpdateQueueMark(hex, position) {
        if (this.queueMarker === undefined) {
            this.queueMarker = new QueueMarker(hex, position, this.worldMap.getStandardTexture("survey_icon.png" /* SpriteNames.SurveyIcon */ ));
            this.queueMarker.zIndex = 2 /* HexDisplayZIndex.QueueMarker */ ;
            this.addChild(this.queueMarker);
        } else {
            this.queueMarker.updatePosition(position);
        }
    }
    removeQueueMarker() {
        if (this.queueMarker === undefined)
            return;
        this.removeChild(this.queueMarker);
        this.queueMarker.destroy({
            children: true
        });
        this.queueMarker = undefined;
    }
    addUpdateSurveyMarker(hex, timer) {
        if (this.surveyMarker === undefined) {
            const texture = this.worldMap.getStandardTexture("survey_icon.png" /* SpriteNames.SurveyIcon */ );
            this.surveyMarker = new ImageProgressBar(texture, this.worldMap.ticker, {
                fillAngle: 315,
                startRatio: 0.083,
                endRatio: 0.88,
            });
            const vertex = hex.getLocalVertex(5 /* HexVertex.NorthEast */ );
            this.surveyMarker.position.set(vertex.x * 0.75, vertex.y * 0.75);
            const scale = (Point.originDistance(vertex) * 0.3) / texture.orig.width;
            this.surveyMarker.scale.set(scale);
            this.surveyMarker.zIndex = 3 /* HexDisplayZIndex.SurveyMarker */ ;
            this.addChild(this.surveyMarker);
            this.surveyMarker.animateFromTimer(timer);
        } else {
            this.surveyMarker.animateFromTimer(timer);
        }
    }
    removeSurveyMarker() {
        if (this.surveyMarker === undefined)
            return;
        this.removeChild(this.surveyMarker);
        this.surveyMarker.destroy({
            children: true
        });
        this.surveyMarker = undefined;
    }
    addAnimatedBorder(hex, colour) {
        if (this.animatedBorder !== undefined)
            return;
        this.animatedBorder = new HexAnimatedBorder(this.worldMap, hex, {
            borderColour: colour
        });
        this.animatedBorder.zIndex = 0 /* HexDisplayZIndex.AnimatedBorder */ ;
        this.addChild(this.animatedBorder);
    }
    removeAnimatedBorder() {
        if (this.animatedBorder === undefined)
            return;
        this.removeChild(this.animatedBorder);
        this.animatedBorder.destroy({
            children: true
        });
        this.animatedBorder = undefined;
    }
    addMasteryMarker(hex) {
        if (this.masteryMarker !== undefined)
            return;
        const texture = this.worldMap.getStandardTexture("mastery_header.png" /* SpriteNames.MasteryIcon */ );
        this.masteryMarker = new PIXI.Sprite(texture);
        const vertex = hex.getLocalVertex(4 /* HexVertex.NorthWest */ );
        this.masteryMarker.position.set(vertex.x * 0.75, vertex.y * 0.75);
        this.masteryMarker.anchor.set(0.5);
        const scale = (Point.originDistance(vertex) * 0.3) / texture.orig.width;
        this.masteryMarker.scale.set(scale);
        this.masteryMarker.zIndex = 4 /* HexDisplayZIndex.MasteryMarker */ ;
        this.addChild(this.masteryMarker);
    }
    removeMasteryMarker() {
        if (this.masteryMarker === undefined)
            return;
        this.removeChild(this.masteryMarker);
        this.masteryMarker.destroy({
            children: true
        });
        this.masteryMarker = undefined;
    }
}
class HexAnimatedBorder extends PIXI.Container {
    constructor(map, hex, options) {
        super();
        this.borderSegments = [];
        this.spriteMasks = [];
        this.segmentSprites = [];
        this.segTimes = [];
        this.spriteVectors = [];
        this.borderDistance = 0;
        /** Position of the center of the animation around the border */
        this.progress = 0;
        this.opts = Object.assign({}, HexAnimatedBorder.DEFAULT_OPTIONS, options);
        const vertices = hex.getLocalVertices();
        const gradient = map.getStandardTexture("border_gradient.png" /* SpriteNames.HexBorderGradient */ );
        const segLengths = [];
        for (let i = 0; i < 6; i++) {
            const firstVertex = vertices[i];
            const secondVertex = vertices[i === 5 ? 0 : i + 1];
            const segLength = Point.distance(firstVertex, secondVertex);
            segLengths.push(segLength);
            const origin = Point.sub(firstVertex, Point.sub(secondVertex, firstVertex));
            this.spriteVectors.push({
                origin,
                dir: Point.sub(secondVertex, origin),
            });
            this.borderDistance += segLength;
            const segment = new PIXI.Graphics();
            const segmentPoly = new PIXI.Polygon([
                firstVertex,
                secondVertex,
                Point.mult(secondVertex, 1 - this.opts.thicknessRatio),
                Point.mult(firstVertex, 1 - this.opts.thicknessRatio),
            ]);
            segment.beginFill(this.opts.borderColour);
            segment.drawPolygon(segmentPoly);
            segment.endFill();
            const spriteMask = new PIXI.Graphics(segment.geometry);
            this.spriteMasks.push(spriteMask);
            const sprite = new PIXI.Sprite(gradient);
            sprite.rotation = Point.vecAngle(firstVertex, secondVertex);
            sprite.position.set(firstVertex.x, firstVertex.y);
            sprite.scale.set(segLength / gradient.orig.width, 1);
            sprite.mask = spriteMask;
            this.addChild(segment);
            this.addChild(sprite);
            this.addChild(spriteMask);
            this.borderSegments.push(segment);
            this.segmentSprites.push(sprite);
        }
        // Compute start and end times for each sprite
        let tProgress = 0;
        for (let i = 0; i < 6; i++) {
            const tSeg = segLengths[i] / this.borderDistance;
            let start = tProgress - tSeg;
            if (start < 0)
                start += 1;
            let end = start + 2 * tSeg;
            if (end >= 1)
                end -= 1;
            this.segTimes.push({
                start,
                end,
                total: 2 * tSeg,
                between: start > end,
            });
            tProgress += tSeg;
        }
        this.ticker = map.ticker;
        this.updateFn = (dT) => this.update(dT);
        this.ticker.add(this.updateFn);
    }
    update(dT) {
        const deltaMs = (dT * 1000) / 60;
        this.progress += deltaMs / this.opts.animationTime;
        if (this.progress >= 1)
            this.progress -= 1;
        for (let i = 0; i < 6; i++) {
            const sprite = this.segmentSprites[i];
            const {
                origin,
                dir
            } = this.spriteVectors[i];
            const times = this.segTimes[i];
            let posRatio = 0;
            if (!times.between && this.progress > times.start && this.progress < times.end) {
                posRatio = (this.progress - times.start) / times.total;
            } else if (times.between && this.progress > times.start) {
                posRatio = (this.progress - times.start) / times.total;
            } else if (times.between && this.progress < times.end) {
                posRatio = (1 - times.start + this.progress) / times.total;
            }
            const pos = Point.add(origin, Point.mult(dir, posRatio));
            sprite.position.set(pos.x, pos.y);
        }
    }
    destroy(options) {
        super.destroy(options);
        this.ticker.remove(this.updateFn);
    }
}
HexAnimatedBorder.DEFAULT_OPTIONS = {
    borderColour: 8671702 /* Colours.Amethyst */ ,
    thicknessRatio: 0.05,
    animationTime: 1500,
};
class XPProgressDisplay extends PIXI.Container {
    constructor(options) {
        super();
        const opts = Object.assign({}, XPProgressDisplay.DEFAULT_OPTIONS, options);
        const thirdHeight = opts.height / 3;
        this._thirdHeight = thirdHeight;
        this._outlineColour = opts.outlineColour;
        this._bgColour = opts.bgColour;
        this._fillColour = opts.fillColour;
        this._barCont = new PIXI.Container();
        this._background = new PIXI.Graphics();
        this._topTextBackground = new PIXI.Graphics(XPProgressDisplay.TEXT_BG_GRAPHICS.geometry);
        this._botTextBackground = new PIXI.Graphics(XPProgressDisplay.TEXT_BG_GRAPHICS.geometry);
        this._outline = new PIXI.Graphics();
        this._progressBar = new PIXI.Graphics();
        this._barWidth = opts.width;
        this._barHeight = thirdHeight;
        this._progressPerc = opts.progressPercent;
        this._barCont.addChild(this._background, this._progressBar, this._outline);
        this._barCont.position.set(-this._barWidth / 2, -this._barHeight / 2);
        const fontStyle = new PIXI.TextStyle({
            fill: 16777215 /* Colours.White */ ,
            fontWeight: 'bold',
            fontSize: thirdHeight,
        });
        this._topText = new PIXI.Text('Level 1', fontStyle);
        this._topText.anchor.set(0.5);
        this._topText.position.set(0, -thirdHeight);
        this._topTextBackground.position.set(0, -thirdHeight);
        this._botText = new PIXI.Text('0 / 83', fontStyle);
        this._botText.anchor.set(0.5);
        this._botText.position.set(0, thirdHeight);
        this._botTextBackground.position.set(0, thirdHeight);
        this.drawBackground();
        this.scaleTopText();
        this.scaleBotText();
        this.drawProgress();
        this.drawOutline();
        this.updateProgress();
        this.addChild(this._topTextBackground);
        this.addChild(this._botTextBackground);
        this.addChild(this._barCont);
        this.addChild(this._topText);
        this.addChild(this._botText);
    }
    set outlineColour(colour) {
        this._outlineColour = colour;
        this.drawOutline();
    }
    get outlineColour() {
        return this._outlineColour;
    }
    set bgColour(colour) {
        this._bgColour = colour;
        this.drawBackground();
    }
    get bgColour() {
        return this._bgColour;
    }
    set fillColour(colour) {
        this._fillColour = colour;
        this.drawProgress();
    }
    get fillColour() {
        return this._fillColour;
    }
    set progressPercent(percent) {
        this._progressPerc = percent;
        this.updateProgress();
    }
    get progressPercent() {
        return this._progressPerc;
    }
    set topText(text) {
        this._topText.text = text;
        this.scaleTopText();
    }
    set botText(text) {
        this._botText.text = text;
        this.scaleBotText();
    }
    toggleText(visible) {
        this._topText.visible = visible;
        this._botText.visible = visible;
        this._topTextBackground.visible = visible;
        this._botTextBackground.visible = visible;
    }
    /** Adjusts the scaling of the top text size and background */
    scaleTopText() {
        this.scaleText(this._topText, this._topTextBackground);
    }
    /** Adjusts the scaling of the top text size and background */
    scaleBotText() {
        this.scaleText(this._botText, this._botTextBackground);
    }
    scaleText(text, bg) {
        text.height = this._thirdHeight * XPProgressDisplay.CONFIG.textHeightRatio;
        text.scale.x = text.scale.y;
        bg.height = text.height * XPProgressDisplay.CONFIG.bgHeightRatio;
        bg.width = text.width * XPProgressDisplay.CONFIG.bgWidthRatio;
    }
    drawBackground() {
        this._background.clear();
        this._background.beginFill(this._bgColour);
        this._background.drawRect(0, 0, this._barWidth, this._barHeight);
        this._background.endFill();
    }
    drawOutline() {
        this._outline.clear();
        this._outline.lineStyle({
            width: 1,
            color: this._outlineColour,
            alignment: 0
        });
        this._outline.beginFill(0, 0);
        this._outline.drawRect(0, 0, this._barWidth, this._barHeight);
        this._outline.endFill();
    }
    drawProgress() {
        this._progressBar.clear();
        this._progressBar.beginFill(this._fillColour);
        this._progressBar.drawRect(0, 0, this._barWidth, this._barHeight);
        this._progressBar.endFill();
    }
    updateProgress() {
        this._progressBar.scale.set(this._progressPerc, 1);
    }
    static drawTextBG() {
        const bg = new PIXI.Graphics();
        bg.beginFill(2172201 /* Colours.Gray900 */ , 0.5);
        bg.drawRoundedRect(-XPProgressDisplay.CONFIG.bgWidth / 2, -XPProgressDisplay.CONFIG.bgHeight / 2, XPProgressDisplay.CONFIG.bgWidth, XPProgressDisplay.CONFIG.bgHeight, XPProgressDisplay.CONFIG.bgRadius);
        bg.endFill();
        return bg;
    }
}
XPProgressDisplay.CONFIG = {
    /** Ratio between 1/3rd of the displays height and text height */
    textHeightRatio: 0.8,
    /** Ratio between the text background width vs the text width */
    bgWidthRatio: 1.2,
    /** Ratio between the text background height vs the text height */
    bgHeightRatio: 1.1,
    /** Configures the width of the text background geometry */
    bgWidth: 8,
    /** Configures the height of the text background geometry */
    bgHeight: 2,
    /** Configures the border radius of the text background geometry */
    bgRadius: 1.5,
};
XPProgressDisplay.DEFAULT_OPTIONS = {
    width: 100,
    height: 50,
    outlineColour: 0,
    bgColour: 16777215 /* Colours.White */ ,
    fillColour: 6073573 /* Colours.Info */ ,
    progressPercent: 0.5,
};
XPProgressDisplay.TEXT_BG_GRAPHICS = XPProgressDisplay.drawTextBG();
class QueueMarker extends PIXI.Container {
    constructor(hex, position, texture) {
        super();
        const vertex = hex.getLocalVertex(5 /* HexVertex.NorthEast */ );
        const vertexDist = Point.originDistance(vertex);
        this.x = vertex.x * 0.75;
        this.y = vertex.y * 0.75;
        this.icon = new PIXI.Sprite(texture);
        this.icon.anchor.set(0.5);
        this.icon.scale.set((vertexDist * QueueMarker.CONFIG.iconSizeRatio) / texture.orig.width);
        this.icon.filters = QueueMarker.CONFIG.imageFilters;
        this.text = new PIXI.Text(`${position}`, new PIXI.TextStyle({
            fill: 16119285 /* Colours.WhiteSmoke */ ,
            fontSize: vertexDist * QueueMarker.CONFIG.fontSizeRatio,
        }));
        this.circle = new PIXI.Graphics();
        this.circle.beginFill(5339606 /* Colours.Primary */ );
        const radius = Point.originDistance(vertex) * QueueMarker.CONFIG.circleRadiusRatio;
        this.circle.drawCircle(0, 0, radius);
        const xOffset = vertexDist * QueueMarker.CONFIG.numberXOffsetRatio;
        const yOffset = vertexDist * QueueMarker.CONFIG.numberYOffsetRatio;
        this.circle.x = xOffset;
        this.circle.y = yOffset;
        this.text.x = xOffset;
        this.text.y = yOffset;
        this.text.anchor.set(0.5);
        this.addChild(this.icon, this.circle, this.text);
    }
    updatePosition(position) {
        this.text.text = `${position}`;
    }
}
QueueMarker.CONFIG = {
    imageFilters: (() => {
        const filter = new PIXI.ColorMatrixFilter();
        filter.saturate(-0.75);
        return [filter];
    })(),
    iconSizeRatio: 0.3,
    fontSizeRatio: 0.15,
    circleRadiusRatio: 0.1,
    numberYOffsetRatio: -0.08,
    numberXOffsetRatio: -0.08,
};
class ImageProgressBar extends PIXI.Container {
    constructor(texture, ticker, options) {
        super();
        this.texture = texture;
        this.ticker = ticker;
        const opts = Object.assign({}, ImageProgressBar.DEFAULT_OPTIONS, options);
        this.startRatio = opts.startRatio;
        this.ratioSlope = opts.endRatio - opts.startRatio;
        this.bgSprite = new PIXI.Sprite(texture);
        this.bgSprite.anchor.set(0.5);
        this.bgSprite.filters = opts.bgFilters;
        this.addChild(this.bgSprite);
        this.fillSprite = new PIXI.Sprite(texture);
        this.fillSprite.anchor.set(0.5);
        this.addChild(this.fillSprite);
        this.fillMask = new PIXI.Graphics();
        this.fillSprite.mask = this.fillMask;
        this.addChild(this.fillMask);
        const radAngle = PIXI.DEG_TO_RAD * (opts.fillAngle % 90);
        const tWidth = this.texture.orig.width;
        const tHeight = this.texture.orig.height;
        const fWidth = tWidth + tHeight / Math.tan(Math.PI / 2 - radAngle);
        const fHeight = tHeight + tWidth / Math.tan(radAngle);
        let fillOrigin;
        const fillAngle = opts.fillAngle % 360;
        if (fillAngle === 0) {
            // Fill from right to left
            this.fillType = 'horizontal';
            this.fillWidth = tWidth;
            this.fillHeight = tHeight;
            fillOrigin = 1 /* RectVertex.BottomLeft */ ;
        } else if (fillAngle < 90) {
            // Fill from bot-left at angle
            this.fillType = 'triangle';
            this.fillWidth = fWidth;
            this.fillHeight = fHeight;
            fillOrigin = 1 /* RectVertex.BottomLeft */ ;
        } else if (fillAngle === 90) {
            // Fill from bottom to top
            this.fillType = 'vertical';
            this.fillWidth = tWidth;
            this.fillHeight = tHeight;
            fillOrigin = 1 /* RectVertex.BottomLeft */ ;
        } else if (fillAngle < 180) {
            // Fill from bot-right at angle
            this.fillType = 'triangle';
            this.fillWidth = -fWidth;
            this.fillHeight = fHeight;
            fillOrigin = 0 /* RectVertex.BottomRight */ ;
        } else if (fillAngle === 180) {
            // Fill from left to right
            this.fillType = 'horizontal';
            this.fillWidth = -tWidth;
            this.fillHeight = tHeight;
            fillOrigin = 0 /* RectVertex.BottomRight */ ;
        } else if (fillAngle < 270) {
            // Fill from top-right at angle
            this.fillType = 'triangle';
            this.fillWidth = -fWidth;
            this.fillHeight = -fHeight;
            fillOrigin = 3 /* RectVertex.TopRight */ ;
        } else if (fillAngle === 270) {
            // Fill from top to bottom
            this.fillType = 'vertical';
            this.fillWidth = tWidth;
            this.fillHeight = -tHeight;
            fillOrigin = 2 /* RectVertex.TopLeft */ ;
        } else {
            // Fill from top-left at angle
            this.fillType = 'triangle';
            this.fillWidth = fWidth;
            this.fillHeight = -fHeight;
            fillOrigin = 2 /* RectVertex.TopLeft */ ;
        }
        switch (fillOrigin) {
            case 0 /* RectVertex.BottomRight */ :
                this.fillOrigin = new Point(tWidth / 2, -tHeight / 2);
                break;
            case 1 /* RectVertex.BottomLeft */ :
                this.fillOrigin = new Point(-tWidth / 2, -tHeight / 2);
                break;
            case 2 /* RectVertex.TopLeft */ :
                this.fillOrigin = new Point(-tWidth / 2, tHeight / 2);
                break;
            case 3 /* RectVertex.TopRight */ :
                this.fillOrigin = new Point(tWidth / 2, tHeight / 2);
                break;
        }
    }
    destroy(options) {
        super.destroy(options);
        this.stopAnimation();
    }
    updateFill(ratio) {
        ratio = this.startRatio + this.ratioSlope * ratio;
        this.fillMask.clear();
        this.fillMask.beginFill(16777215 /* Colours.White */ , 1);
        switch (this.fillType) {
            case 'horizontal':
                this.fillMask.drawRect(this.fillOrigin.x, this.fillOrigin.y, this.fillWidth * ratio, this.fillHeight);
                break;
            case 'vertical':
                this.fillMask.drawRect(this.fillOrigin.x, this.fillOrigin.y, this.fillWidth, this.fillHeight * ratio);
                break;
            case 'triangle':
                this.fillMask.moveTo(this.fillOrigin.x, this.fillOrigin.y);
                this.fillMask.lineTo(this.fillOrigin.x + this.fillWidth * ratio, this.fillOrigin.y);
                this.fillMask.lineTo(this.fillOrigin.x, this.fillOrigin.y + this.fillHeight * ratio);
                break;
        }
    }
    toggleMask() {
        if (this.fillSprite.mask === null)
            this.fillSprite.mask = this.fillMask;
        else
            this.fillSprite.mask = null;
    }
    /**
     *
     * @param interval Interval of progress in ms
     * @param startRatio Starting percent of the progress
     */
    animateOnce(interval, startRatio = 0) {
        this.stopAnimation();
        let lastTime = interval * startRatio;
        this.tickerFn = () => {
            lastTime = lastTime + this.ticker.deltaMS;
            const fillRatio = clampValue(lastTime / interval, 0, 1);
            this.updateFill(fillRatio);
            if (fillRatio === 1)
                this.stopAnimation();
        };
        this.ticker.add(this.tickerFn);
    }
    animateLoop(interval, startRatio = 0) {
        this.stopAnimation();
        let lastTime = interval * startRatio;
        this.tickerFn = () => {
            lastTime = lastTime + this.ticker.deltaMS;
            lastTime = lastTime % interval;
            const fillRatio = lastTime / interval;
            this.updateFill(fillRatio);
        };
        this.ticker.add(this.tickerFn);
    }
    stopAnimation() {
        if (this.tickerFn === undefined)
            return;
        this.ticker.remove(this.tickerFn);
        this.tickerFn = undefined;
    }
    animateFromTimer(timer) {
        this.animateOnce(timer.maxTicks * TICK_INTERVAL, (timer.maxTicks - timer.ticksLeft) / timer.maxTicks);
    }
}
ImageProgressBar.DEFAULT_OPTIONS = {
    bgFilters: (() => {
        const filter = new PIXI.ColorMatrixFilter();
        filter.desaturate();
        return [filter];
    })(),
    fillAngle: 0,
    startRatio: 0,
    endRatio: 1,
};
const imageExtensions = ['.jpeg', '.jpg', '.png', '.webp', '.avif'];
const basisExtensions = ['.basis'];
const modAssetPath = PIXI.utils.path.join(PIXI.utils.path.toPosix(PIXI.settings.ADAPTER.getBaseUrl()).split('?')[0].split('#')[0], 'modAsset:');
/** Custom LoaderParser for modded PIXI.js assets. Instantiates them directly from Blob */
const loadModAssets = {
    name: 'loadModAssets',
    extension: {
        type: PIXI.ExtensionType.LoadParser,
        priority: 3,
    },
    config: {},
    test(url) {
        return (url.startsWith(modAssetPath) &&
            (PIXI.checkExtension(url, imageExtensions) || PIXI.checkExtension(url, basisExtensions)));
    },
    load(url, asset, loader) {
        var _a;
        return __awaiter(this, void 0, void 0, function*() {
            const trueURL = url.substring(modAssetPath.length).split('?')[0];
            if (asset.data === undefined)
                throw new Error(`Cannot load modded PIXI asset. Modding context not passed as data.`);
            const blob = asset.data.modContext.getResourceBlob(trueURL);
            if (PIXI.checkExtension(trueURL, imageExtensions)) {
                // Load blob as image. Adapted from PIXI.js loadTextures.ts
                const imageBitmap = yield createImageBitmap(blob);
                const options = Object.assign({}, asset.data);
                (_a = options.resolution) !== null && _a !== void 0 ? _a : (options.resolution = PIXI.utils.getResolutionOfUrl(trueURL));
                const base = new PIXI.BaseTexture(imageBitmap, options);
                base.resource.src = url;
                return PIXI.createTexture(base, loader, url);
            } else {
                // Load blob as basis. Adapted from PIXI.js loadBasis.ts
                yield PIXI.TranscoderWorker.onTranscoderInitialized;
                const arrayBuffer = yield blob.arrayBuffer();
                const resources = yield PIXI.BasisParser.transcode(arrayBuffer);
                const type = PIXI.BASIS_FORMAT_TO_TYPE[resources.basisFormat];
                const format = resources.basisFormat !== PIXI.BASIS_FORMATS.cTFRGBA32 ? PIXI.FORMATS.RGB : PIXI.FORMATS.RGBA;
                const textures = resources.map((resource) => {
                    const base = new PIXI.BaseTexture(resource, Object.assign({
                        mipmap: resource instanceof PIXI.CompressedTextureResource && resource.levels > 1 ?
                            PIXI.MIPMAP_MODES.ON_MANUAL :
                            PIXI.MIPMAP_MODES.OFF,
                        alphaMode: PIXI.ALPHA_MODES.NO_PREMULTIPLIED_ALPHA,
                        type,
                        format
                    }, asset.data));
                    return PIXI.createTexture(base, loader, url);
                });
                return textures.length === 1 ? textures[0] : textures;
            }
        });
    },
    unload(asset) {
        if (Array.isArray(asset)) {
            asset.forEach((t) => t.destroy(true));
        } else {
            asset.destroy(true);
        }
    },
};
PIXI.extensions.add(loadModAssets);

function drawBoundingBox(object, colour) {
    if (object.parent === null)
        return;
    const boundingBox = new PIXI.Graphics();
    boundingBox.lineStyle({
        width: 2,
        color: colour,
        alignment: 0,
    });
    boundingBox.beginFill(0, 0);
    const bounds = object.getBounds();
    const globalPos = object.getGlobalPosition();
    const offsetX = globalPos.x - object.x;
    const offsetY = globalPos.y - object.y;
    boundingBox.drawRect(0, 0, bounds.width, bounds.height);
    boundingBox.x = bounds.left - offsetX;
    boundingBox.y = bounds.top - offsetY;
    object.parent.addChild(boundingBox);
    return boundingBox;
}
/** pixi_viewport Plugin used to implement keyboard panning */
class KeyboardPanning extends pixi_viewport.Plugin {
    constructor(parent, options = {}) {
        super(parent);
        /** Velocity of the follower in pix/s */
        this._velocity = new Point(0, 0);
        this._moveCount = 0;
        this._accelDirections = {
            UP: false,
            DOWN: false,
            LEFT: false,
            RIGHT: false,
        };
        this._options = Object.assign({}, KeyboardPanning.DEFAULT_OPTIONS, options);
        this.parent.on('moved', (e) => {
            if (!this.isMoving)
                return;
            switch (e.type) {
                case 'clamp-x':
                    this._velocity.x = 0;
                    break;
                case 'clamp-y':
                    this._velocity.y = 0;
                    break;
            }
        });
    }
    get isMoving() {
        return this._velocity.x !== 0 || this._velocity.y !== 0;
    }
    get isAccelerating() {
        return this._moveCount > 0;
    }
    setMove(dir) {
        if (this._accelDirections[dir])
            return;
        this._accelDirections[dir] = true;
        this._moveCount++;
        switch (dir) {
            case 'UP':
                this._velocity.y = -this._options.impulseVelocity;
                break;
            case 'DOWN':
                this._velocity.y = this._options.impulseVelocity;
                break;
            case 'LEFT':
                this._velocity.x = -this._options.impulseVelocity;
                break;
            case 'RIGHT':
                this._velocity.x = this._options.impulseVelocity;
                break;
        }
    }
    removeMove(dir) {
        if (!this._accelDirections[dir])
            return;
        this._accelDirections[dir] = false;
        this._moveCount--;
    }
    update(elapsed) {
        if (!(this.isMoving || this.isAccelerating))
            return;
        const timeDiff = elapsed / 1000;
        // Perform Acceleration
        let dVel = this._options.acceleration * timeDiff;
        if (this._accelDirections.UP)
            this._velocity.y -= dVel;
        if (this._accelDirections.DOWN)
            this._velocity.y += dVel;
        if (this._accelDirections.LEFT)
            this._velocity.x -= dVel;
        if (this._accelDirections.RIGHT)
            this._velocity.x += dVel;
        this._velocity.x = clampValue(this._velocity.x, -this._options.maxVelocity, this._options.maxVelocity);
        this._velocity.y = clampValue(this._velocity.y, -this._options.maxVelocity, this._options.maxVelocity);
        // Perform Deceleration
        dVel = this._options.deceleration * timeDiff;
        const speed = Point.originDistance(this._velocity);
        if (!this._accelDirections.UP && !this._accelDirections.DOWN) {
            let dVelY = (-this._velocity.y / speed) * dVel;
            if (this._velocity.y > 0)
                dVelY = Math.max(dVelY, -this._velocity.y);
            else
                dVelY = Math.min(dVelY, -this._velocity.y);
            this._velocity.y += dVelY;
        }
        if (!this._accelDirections.LEFT && !this._accelDirections.RIGHT) {
            let dVelX = (-this._velocity.x / speed) * dVel;
            if (this._velocity.x > 0)
                dVelX = Math.max(dVelX, -this._velocity.x);
            else
                dVelX = Math.min(dVelX, -this._velocity.x);
            this._velocity.x += dVelX;
        }
        // Perform Movement
        const original = new PIXI.Point(this.parent.x, this.parent.y);
        this.parent.x -= this._velocity.x * timeDiff;
        this.parent.y -= this._velocity.y * timeDiff;
        this.parent.emit('moved', {
            viewport: this.parent,
            type: 'animate',
            original
        });
        if (this._velocity.x === 0 && this._velocity.y === 0)
            this.parent.emit('moved-end', this.parent);
    }
}
KeyboardPanning.DEFAULT_OPTIONS = {
    impulseVelocity: 500,
    maxVelocity: 2000,
    acceleration: 1000,
    deceleration: 2000,
};
class TooltipDisabler extends pixi_viewport.Plugin {
    constructor(parent, mapDisplay) {
        super(parent);
        this.mapDisplay = mapDisplay;
        this._isDragging = false;
        this.parent.on('zoomed', (e) => {
            if (e.type === 'clamp-zoom') {
                this.mapDisplay.enableTooltips();
            } else {
                this.mapDisplay.disableTooltips();
            }
        });
        this.parent.on('zoomed-end', () => {
            this.mapDisplay.enableTooltips();
        });
        this.parent.on('moved', (e) => {
            this.mapDisplay.disableTooltips();
        });
        this.parent.on('moved-end', () => {
            if (!this._isDragging)
                this.mapDisplay.enableTooltips();
        });
        this.parent.on('drag-start', () => {
            this.mapDisplay.disableTooltips();
            this._isDragging = true;
        });
        this.parent.on('drag-end', () => {
            this._isDragging = false;
        });
    }
    up(event) {
        if (this.parent.input.count() === 0) {
            const decel = this.parent.plugins.get('decelerate');
            if (!(decel !== null && decel !== undefined && (decel.x || decel.y)))
                this.mapDisplay.enableTooltips();
        }
        return false;
    }
}
class HexOverviewElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('hex-overview-template'));
        this.hexCoords = getElementFromFragment(this._content, 'hex-coords', 'span');
        this.closeBtn = getElementFromFragment(this._content, 'close-btn', 'button');
        this.poiInfo = getElementFromFragment(this._content, 'poi-info', 'div');
        this.poiName = getElementFromFragment(this._content, 'poi-name', 'h5');
        this.poiImage = getElementFromFragment(this._content, 'poi-image', 'img');
        this.poiDiscoveryBtn = getElementFromFragment(this._content, 'poi-discovery-btn', 'button');
        this.activeModifiersCont = getElementFromFragment(this._content, 'active-modifiers-cont', 'div');
        this.activeModifiersList = getElementFromFragment(this._content, 'active-modifiers-list', 'div');
        this.requirements = getElementFromFragment(this._content, 'requirements', 'div');
        this.requirementList = getElementFromFragment(this._content, 'requirement-list', 'ul');
        this.fastTravel = getElementFromFragment(this._content, 'fast-travel-unlock', 'div');
        this.fastTravelInfo = getElementFromFragment(this._content, 'fast-travel-info', 'p');
        this.fastTravelUnlockCost = getElementFromFragment(this._content, 'fast-travel-unlock-cost', 'quantity-icons');
        this.fastTravelUnlockBtn = getElementFromFragment(this._content, 'fast-travel-unlock-btn', 'button');
        this.travelCost = getElementFromFragment(this._content, 'travel-cost', 'div');
        this.travelCostList = getElementFromFragment(this._content, 'travel-cost-list', 'quantity-icons');
        this.interactions = getElementFromFragment(this._content, 'interactions', 'div');
        this.queueSurveyBtn = getElementFromFragment(this._content, 'queue-survey-btn', 'button');
        this.autoSurveyBtn = getElementFromFragment(this._content, 'auto-survey-btn', 'button');
        this.travelBtn = getElementFromFragment(this._content, 'travel-btn', 'button');
        this.portalBtn = getElementFromFragment(this._content, 'portal-btn', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    displayHex(hex, game, cartography) {
        this.closeBtn.onclick = () => cartography.deselectHexOnClick(hex);
        const offsetCoords = hex.to_oddq();
        this.hexCoords.textContent = `(${offsetCoords.col}, ${offsetCoords.row})`;
        if (hex.isFullySurveyed) {
            if (hex.map.selectedHexPath === undefined) {
                hideElement(this.travelCost);
                this.travelBtn.disabled = true;
            } else {
                const costs = cartography.getTravelCosts(hex.map.selectedHexPath);
                this.updateTravelCosts(costs, game);
                showElement(this.travelCost);
                this.travelBtn.disabled = hex.isPlayerHere || !costs.checkIfOwned();
            }
            this.updateFastTravel(hex, game, cartography);
            hideElement(this.requirements);
            showElement(this.travelBtn);
            this.travelBtn.onclick = () => cartography.travelOnClick();
            if (hex.pointOfInterest !== undefined && hex.pointOfInterest.isDiscovered) {
                this.showPoiInfo(hex.pointOfInterest, cartography);
            } else {
                hideElement(this.poiInfo);
                hideElement(this.portalBtn);
            }
        } else {
            hideElement(this.fastTravel);
            hideElement(this.travelCost);
            hideElement(this.travelBtn);
            hideElement(this.portalBtn);
            if (hex.pointOfInterest !== undefined && hex.pointOfInterest.hidden === undefined)
                this.showUnknownPoi();
            else
                hideElement(this.poiInfo);
        }
        if (!hex.isMaxLevel) {
            if (hex.requirements.length > 0) {
                this.requirementList.textContent = '';
                hex.requirements.forEach((req) => {
                    const met = game.checkRequirement(req);
                    const elem = createElement('li', {
                        className: `font-size-sm font-w400 ${met ? 'text-success' : 'text-danger'}`,
                        children: req.getNodes('skill-icon-xs mr-2'),
                    });
                    this.requirementList.append(elem);
                });
                showElement(this.requirements);
            } else {
                hideElement(this.requirements);
            }
        }
        this.updateSurveyButtons(hex, game, cartography);
    }
    updateTravelCosts(costs, game) {
        if (costs.isFree) {
            this.travelCostList.setFree();
        } else {
            this.travelCostList.setSelected();
            this.travelCostList.setIconsForCosts(costs);
        }
    }
    updateFastTravel(hex, game, cartography) {
        const poi = hex.pointOfInterest;
        if ((poi === null || poi === void 0 ? void 0 : poi.fastTravel) === undefined || !poi.isDiscovered) {
            hideElement(this.fastTravel);
            return;
        }
        showElement(this.fastTravel);
        if (poi.fastTravel.isUnlocked) {
            this.fastTravelInfo.textContent = templateLangString('TRAVEL_TO_HEXES_IS_FREE', {
                groupName: poi.fastTravel.group.name,
            });
            hideElement(this.fastTravelUnlockCost);
            hideElement(this.fastTravelUnlockBtn);
        } else {
            this.fastTravelInfo.textContent = templateLangString('UNLOCK_TRAVEL_FOR_FREE', {
                groupName: poi.fastTravel.group.name,
            });
            const costs = cartography.getFastTravelUnlockCosts(poi.fastTravel);
            this.fastTravelUnlockCost.setSelected();
            this.fastTravelUnlockCost.setIconsForCosts(costs, false);
            showElement(this.fastTravelUnlockCost);
            showElement(this.fastTravelUnlockBtn);
            this.fastTravelUnlockBtn.onclick = () => cartography.unlockFastTravelOnClick(poi);
            this.fastTravelUnlockBtn.disabled = !costs.checkIfOwned();
        }
    }
    /** Updates the survey buttons, depending on cartography state */
    updateSurveyButtons(hex, game, cartography) {
        if (hex.isMaxLevel) {
            hideElement(this.queueSurveyBtn);
            hideElement(this.autoSurveyBtn);
        } else {
            showElement(this.queueSurveyBtn);
            showElement(this.autoSurveyBtn);
            const reqsMet = game.checkRequirements(hex.requirements);
            this.updateQueueButtonText(hex, cartography);
            this.updateAutoSurveyButtonText(hex, cartography);
            this.queueSurveyBtn.disabled = !(hex.inSurveyRange && reqsMet && hex.hasSurveyedOrQueuedNeighbour(cartography));
            this.autoSurveyBtn.disabled = !((hex.inSurveyRange || cartography.isAutoSurveyingHex(hex)) &&
                reqsMet &&
                hex.hasSurveyedNeighbour);
            this.queueSurveyBtn.onclick = () => cartography.surveyOnClick(hex);
            this.autoSurveyBtn.onclick = () => cartography.autoSurveyOnClick(hex);
        }
    }
    /** Updates the text and colour of the queue button depending on current cartography state */
    updateQueueButtonText(hex, cartography) {
        this.queueSurveyBtn.classList.remove('btn-primary', 'btn-success', 'btn-danger', 'btn-warning');
        if (cartography.isActive && cartography.actionMode === 1 /* CartographyActionMode.QueueSurvey */ ) {
            if (cartography.isHexFirstInQueue(hex)) {
                this.queueSurveyBtn.textContent = getLangString('STOP_SURVEYING');
                this.queueSurveyBtn.classList.add('btn-danger');
            } else if (cartography.isHexInQueue(hex)) {
                this.queueSurveyBtn.textContent = getLangString('REMOVE_FROM_QUEUE');
                this.queueSurveyBtn.classList.add('btn-warning');
            } else {
                this.queueSurveyBtn.textContent = getLangString('QUEUE_FOR_SURVEY');
                this.queueSurveyBtn.classList.add('btn-primary');
            }
        } else {
            this.queueSurveyBtn.textContent = getLangString('SURVEY');
            this.queueSurveyBtn.classList.add('btn-success');
        }
    }
    /** Updates the text and colour of the auto-survey button based on cartography state */
    updateAutoSurveyButtonText(hex, cartography) {
        this.autoSurveyBtn.classList.remove('btn-success', 'btn-danger');
        if (cartography.isAutoSurveyingHex(hex)) {
            this.autoSurveyBtn.classList.add('btn-danger');
            this.autoSurveyBtn.textContent = getLangString('STOP_AUTO_SURVEYING');
        } else {
            this.autoSurveyBtn.classList.add('btn-success');
            this.autoSurveyBtn.textContent = getLangString('AUTO_SURVEY');
        }
    }
    /** Updates the quantites of bank items and currencies */
    updateQuantities(game) {
        this.travelCostList.updateQuantities(game);
        this.fastTravelUnlockCost.updateQuantities(game);
    }
    showPoiInfo(poi, cartography) {
        showElement(this.poiInfo);
        this.poiName.textContent = poi.name;
        this.poiImage.src = poi.media;
        this.poiDiscoveryBtn.onclick = () => cartography.firePOIDiscoveryModal(poi);
        showElement(this.poiDiscoveryBtn);
        if (poi.hasActiveEffect) {
            const posMult = cartography.hasCarthuluPet ? 2 : 1;
            this.activeModifiersList.textContent = '';
            const descriptions = poi.activeStats.describeAsSpans(1, posMult);
            this.activeModifiersList.append(...descriptions);
            showElement(this.activeModifiersCont);
        } else {
            hideElement(this.activeModifiersCont);
        }
        if (poi instanceof PortalPOI) {
            showElement(this.portalBtn);
            this.portalBtn.textContent = templateLangString('GO_TO_MAP', {
                worldName: poi.destination.map.name
            });
            this.portalBtn.onclick = () => cartography.goToWorldMapOnClick(poi);
            this.portalBtn.disabled = !poi.hex.isPlayerHere;
        } else {
            hideElement(this.portalBtn);
        }
    }
    showUnknownPoi() {
        showElement(this.poiInfo);
        this.poiName.textContent = getLangString('UNDISCOVERED_POI');
        this.poiImage.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        hideElement(this.poiDiscoveryBtn);
        hideElement(this.activeModifiersCont);
    }
}
window.customElements.define('hex-overview', HexOverviewElement);
class SurveyOverviewElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('survey-overview-template'));
        this.goToHexButton = getElementFromFragment(this._content, 'go-to-hex-button', 'button');
        this.goToHexButton.setAttribute('aria-label', getLangString('GO_TO_CURRENTLY_SURVEYED_HEX'));
        this.hexName = getElementFromFragment(this._content, 'hex-name', 'span');
        this.xpIcon = getElementFromFragment(this._content, 'xp-icon', 'xp-icon');
        this.intervalIcon = getElementFromFragment(this._content, 'interval-icon', 'interval-icon');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setHex(cartography, hex) {
        this.goToHexButton.onclick = () => {
            cartographyMap.animateMoveToHex(hex, 1);
            if (hex.map.selectedHex !== hex)
                cartography.onHexTap(hex);
        };
        let hexName;
        const poi = hex.pointOfInterest;
        if (poi !== undefined && poi.isDiscovered) {
            hexName = poi.name;
        } else if (poi !== undefined && poi.hidden === undefined) {
            if (hex.pointOfInterest instanceof DigSitePOI) {
                hexName = getLangString('UNDISCOVERED_DIG_SITE');
            } else {
                hexName = getLangString('UNDISCOVERED_POI');
            }
        } else if (hex.isFullySurveyed) {
            hexName = getLangString('HEX');
        } else {
            hexName = getLangString('UNDISCOVERED_HEX');
        }
        this.hexName.textContent = hexName;
        this.updateRates(cartography, hex);
    }
    /** Updates the xp and interval for surveying a hex */
    updateRates(cartography, hex) {
        this.intervalIcon.setInterval(cartography.surveyInterval, cartography.getIntervalSources());
        const baseXP = cartography.getSkillXPForHexSurveyAction(hex);
        const modifiedXP = cartography.modifyXP(baseXP);
        this.xpIcon.setXP(modifiedXP, baseXP);
        this.xpIcon.setSources(cartography.getXPSources());
    }
}
window.customElements.define('survey-overview', SurveyOverviewElement);
class WorldMapFilterElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('world-map-filter-template'));
        this.checkbox = getElementFromFragment(this._content, 'checkbox', 'input');
        this.icon = getElementFromFragment(this._content, 'icon', 'img');
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.label = getElementFromFragment(this._content, 'label', 'label');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /**
     *
     * @param icon URI of icon to display
     * @param text Text of icon to display, should be localized
     * @param callback Callback function when checkbox value changes
     * @param id ID to use for the checkbox and label
     */
    setFilter(icon, text, callback, id) {
        this.icon.src = icon;
        this.name.textContent = text;
        this.checkbox.onchange = () => callback(this.checkbox.checked);
        this.checkbox.id = id;
        this.label.setAttribute('for', id);
    }
    /** Updates if the checkbox should be currently checked */
    updateChecked(isChecked) {
        this.checkbox.checked = isChecked;
    }
}
window.customElements.define('world-map-filter', WorldMapFilterElement);
class ImageSearchResultElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('image-search-result-template'));
        this.item = getElementFromFragment(this._content, 'item', 'li');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.text = getElementFromFragment(this._content, 'text', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setActive() {
        this.item.classList.add('active');
    }
    setInactive() {
        this.item.classList.remove('active');
    }
}
window.customElements.define('image-search-result', ImageSearchResultElement);
class PoiSearchResultElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('poi-search-result-template'));
        this.item = getElementFromFragment(this._content, 'item', 'li');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.text = getElementFromFragment(this._content, 'text', 'span');
        this.poiName = getElementFromFragment(this._content, 'poi-name', 'div');
        this.activeModifiers = getElementFromFragment(this._content, 'active-modifiers', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCallback(callback) {
        this.item.onclick = callback;
    }
    setPoi(poi, cartography) {
        this.image.src = poi.media;
        this.poiName.textContent = poi.name;
        this.activeModifiers.textContent = '';
        if (poi.hasActiveEffect) {
            const posMult = cartography.hasCarthuluPet ? 2 : 1;
            this.activeModifiers.append(createElement('span', {
                className: 'text-warning font-w600',
                text: getLangString('ACTIVE_MODIFIERS')
            }), ...poi.activeStats.describeAsSpans(1, posMult));
            showElement(this.activeModifiers);
        } else {
            hideElement(this.activeModifiers);
        }
    }
}
window.customElements.define('poi-search-result', PoiSearchResultElement);
class CreateMapMenuElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('create-map-menu-template'));
        this.digSiteSelect = getElementFromFragment(this._content, 'dig-site-select', 'dig-site-select-menu');
        this.createPaperTab = getElementFromFragment(this._content, 'create-paper-tab', 'a', true);
        this.mapCreateTab = getElementFromFragment(this._content, 'map-create-tab', 'a', true);
        this.paperMakingMenu = getElementFromFragment(this._content, 'paper-making-menu', 'paper-making-menu');
        this.mapUpgradeMenu = getElementFromFragment(this._content, 'map-upgrade-menu', 'map-upgrade-menu');
        this.mapRefinementMenu = getElementFromFragment(this._content, 'map-refinement-menu', 'map-refinement-menu');
        this.digSiteSelectToggle = getElementFromFragment(this._content, 'dig-site-select-toggle', 'button');
        this.digSiteSelectToggle.onclick = () => this.toggleDigSiteSelect();
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    toggleDigSiteSelect() {
        this.digSiteSelect.classList.toggle('d-none');
    }
    /** Initializes the menu, assigning callbacks and generating menu elements */
    init(archaeology, cartography, game) {
        this.createPaperTab.addEventListener('click', () => cartography.queueModalProgressBarRenders());
        this.mapCreateTab.addEventListener('click', () => cartography.queueModalProgressBarRenders());
        this.digSiteSelect.init(archaeology, cartography);
        this.paperMakingMenu.init(cartography, game);
        this.mapUpgradeMenu.init(cartography);
    }
    updateUpgradeProgress(map) {
        this.mapUpgradeMenu.mapInfo.updateUpgradeProgress(map);
        this.mapRefinementMenu.mapInfo.updateUpgradeProgress(map);
    }
}
window.customElements.define('create-map-menu', CreateMapMenuElement);
class DigSiteSelectMenuElement extends HTMLElement {
    constructor() {
        super();
        this.digSiteOptions = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dig-site-select-menu-template'));
        this.digSiteSearchBar = getElementFromFragment(this._content, 'dig-site-search-bar', 'input');
        this.digSiteSearchBar.placeholder = getLangString('SEARCH_DIG_SITES');
        this.clearDigSiteSearchBtn = getElementFromFragment(this._content, 'clear-dig-site-search-btn', 'button');
        this.noDigSiteMessage = getElementFromFragment(this._content, 'no-dig-site-message', 'p');
        this.digSiteContainer = getElementFromFragment(this._content, 'dig-site-container', 'ul');
        this.clearDigSiteSearchBtn.onclick = () => this.clearSearch();
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Initializes the menu, assigning callbacks and generating digsites */
    init(archaeology, cartography) {
        archaeology.actions.forEach((digSite) => {
            const option = new ImageSearchResultElement();
            option.image.src = digSite.media;
            option.text.textContent = digSite.name;
            option.item.onclick = () => cartography.selectDigSiteOnClick(digSite);
            this.digSiteContainer.append(option);
            this.digSiteOptions.set(digSite, option);
        });
        this.digSiteSearchBar.onkeyup = () => this.updateDigSites();
        this.updateDigSites();
    }
    /** Callback function for when the clear search button is clicked */
    clearSearch() {
        this.digSiteSearchBar.value = '';
    }
    /** Updates the dig sites that are currently displayed based on the current search query and if they are discovered */
    updateDigSites() {
        const query = this.digSiteSearchBar.value.trim();
        if (query === '') {
            // Show all Dig Sites
            let noneShown = true;
            this.digSiteOptions.forEach((option, digSite) => {
                if (digSite.isDiscovered) {
                    showElement(option);
                    noneShown = false;
                } else
                    hideElement(option);
            });
            if (noneShown) {
                this.noDigSiteMessage.textContent = getLangString('NO_DIG_SITES_DISCOVERED');
                showElement(this.noDigSiteMessage);
            } else {
                hideElement(this.noDigSiteMessage);
            }
        } else {
            // Perform fuzzy search of dig sites
            const fuse = new Fuse([...this.digSiteOptions.keys()], {
                shouldSort: true,
                tokenize: true,
                matchAllTokens: true,
                findAllMatches: true,
                threshold: 0.1,
                location: 0,
                distance: 100,
                maxPatternLength: 32,
                minMatchCharLength: 1,
                keys: ['name'],
            });
            const fuseResult = fuse.search(query);
            const result = fuseResult.filter((digSite) => digSite.isDiscovered);
            if (result.length === 0) {
                this.digSiteSearchBar.classList.add('text-danger');
                this.noDigSiteMessage.textContent = getLangString('NO_DIG_SITES_FOUND');
                showElement(this.noDigSiteMessage);
            } else {
                this.digSiteSearchBar.classList.remove('text-danger');
                hideElement(this.noDigSiteMessage);
            }
            const resultSet = new Set(result);
            this.digSiteOptions.forEach((option, digSite) => {
                if (resultSet.has(digSite))
                    showElement(option);
                else
                    hideElement(option);
            });
        }
    }
    /** Sets the digsite to being currently selected */
    setActiveDigSite(digSite) {
        if (this.active !== undefined)
            this.active.setInactive();
        const elem = this.digSiteOptions.get(digSite);
        if (elem !== undefined)
            elem.setActive();
        this.active = elem;
    }
    /** Sets the menu to no digsite being selected */
    setInactiveDigSite() {
        if (this.active !== undefined)
            this.active.setInactive();
        this.active = undefined;
    }
}
window.customElements.define('dig-site-select-menu', DigSiteSelectMenuElement);
class PaperMakingMenuElement extends HTMLElement {
    constructor() {
        super();
        this.recipeCosts = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('paper-making-menu-template'));
        this.recipeSelectButton = getElementFromFragment(this._content, 'recipe-select-button', 'button');
        this.recipeOptions = getElementFromFragment(this._content, 'recipe-options', 'div');
        this.doublingIcon = getElementFromFragment(this._content, 'doubling-icon', 'doubling-icon');
        this.preserveIcon = getElementFromFragment(this._content, 'preserve-icon', 'preservation-icon');
        this.requires = getElementFromFragment(this._content, 'requires', 'requires-box');
        this.haves = getElementFromFragment(this._content, 'haves', 'haves-box');
        this.produces = getElementFromFragment(this._content, 'produces', 'produces-box');
        this.producesHaves = getElementFromFragment(this._content, 'produces-haves', 'haves-box');
        this.grants = getElementFromFragment(this._content, 'grants', 'grants-box');
        this.intervalIcon = getElementFromFragment(this._content, 'interval-icon', 'interval-icon');
        this.createButton = getElementFromFragment(this._content, 'create-button', 'button');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Initializes the menu, assigning callbacks and generating recipe select */
    init(cartography, game) {
        cartography.paperRecipes.forEach((recipe) => {
            const recipeOption = createElement('a', {
                className: 'dropdown-item pointer-enabled'
            });
            recipeOption.onclick = () => cartography.selectPaperRecipeOnClick(recipe);
            const optionCont = createElement('div', {
                parent: recipeOption,
                className: 'row gutters-tiny align-items-center icon-size-48',
            });
            const costs = createElement('quantity-icons', {
                parent: optionCont
            });
            costs.setSelected();
            costs.setIconsForFixedCosts(recipe.costs);
            this.recipeCosts.push(costs);
            optionCont.append('->');
            const productIcon = createElement('item-quantity-icon', {
                parent: optionCont
            });
            productIcon.setItem(recipe.product, recipe.baseQuantity, false);
            this.recipeOptions.append(recipeOption);
        });
        this.recipeSelectButton.onclick = () => this.updateRecipeOptions(game);
        this.createButton.onclick = () => cartography.makePaperOnClick();
    }
    /** Sets the currently selected recipe */
    setSelectedRecipe(cartography, recipe, game) {
        const costs = cartography.getPaperMakingCosts(recipe);
        this.requires.setSelected();
        this.requires.setItems(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray());
        this.haves.setSelected();
        this.haves.setItems(costs.getItemQuantityArray(), costs.getCurrencyQuantityArray(), game);
        const products = [{
            item: recipe.product,
            quantity: recipe.baseQuantity
        }];
        this.produces.setSelected();
        this.produces.setItems(products, []);
        this.producesHaves.setSelected();
        this.producesHaves.setItems(products, [], game);
        this.grants.setSelected();
        this.grants.hideMastery();
    }
    unsetRecipe() {
        this.requires.setUnselected();
        this.haves.setUnselected();
        this.produces.setUnselected();
        this.grants.setUnselected();
    }
    updateQuantities(game) {
        this.producesHaves.updateQuantities(game);
        this.haves.updateQuantities(game);
    }
    updateRates(cartography, recipe) {
        this.intervalIcon.setInterval(cartography.getPaperMakingInterval(recipe), cartography.getIntervalSources(recipe));
        this.preserveIcon.setChance(cartography.getPreservationChance(recipe), cartography.getPreservationCap(recipe), cartography.getPreservationSources(recipe));
        this.doublingIcon.setChance(cartography.getDoublingChance(recipe), cartography.getDoublingSources(recipe));
        const baseXP = recipe.baseExperience;
        this.grants.updateGrants(cartography.modifyXP(baseXP, recipe), baseXP, 0, 0, 0, recipe.realm);
        this.grants.setSources(cartography, recipe);
        const baseAXP = recipe.baseAbyssalExperience;
        this.grants.updateAbyssalGrants(cartography.modifyAbyssalXP(baseAXP, recipe), baseAXP);
    }
    updateRecipeOptions(game) {
        this.recipeCosts.forEach((costs) => costs.updateQuantities(game));
    }
}
window.customElements.define('paper-making-menu', PaperMakingMenuElement);
class DigSiteMapInfoElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dig-site-map-info-template'));
        this.noMapContainer = getElementFromFragment(this._content, 'no-map-container', 'div');
        this.infoContainer = getElementFromFragment(this._content, 'info-container', 'div');
        this.mapTier = getElementFromFragment(this._content, 'map-tier', 'span');
        this.mapUpgradeProgress = getElementFromFragment(this._content, 'map-upgrade-progress', 'span');
        this.mapCharges = getElementFromFragment(this._content, 'map-charges', 'span');
        this.artefactValueTiny = getElementFromFragment(this._content, 'artefact-value-tiny', 'td');
        this.artefactValueSmall = getElementFromFragment(this._content, 'artefact-value-small', 'td');
        this.artefactValueMedium = getElementFromFragment(this._content, 'artefact-value-medium', 'td');
        this.artefactValueLarge = getElementFromFragment(this._content, 'artefact-value-large', 'td');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setMap(map) {
        this.updateValues(map);
        this.updateUpgradeProgress(map);
        hideElement(this.noMapContainer);
        showElement(this.infoContainer);
    }
    /** Sets the map level, charges and artefact values */
    updateValues(map) {
        this.mapTier.textContent = map.tier.name;
        this.mapCharges.textContent = numberWithCommas(map.charges);
        this.artefactValueTiny.textContent = numberWithCommas(game.archaeology.getArtefactValue(ArtefactType.TINY, map.digSite, map));
        this.artefactValueSmall.textContent = numberWithCommas(game.archaeology.getArtefactValue(ArtefactType.SMALL, map.digSite, map));
        this.artefactValueMedium.textContent = numberWithCommas(game.archaeology.getArtefactValue(ArtefactType.MEDIUM, map.digSite, map));
        this.artefactValueLarge.textContent = numberWithCommas(game.archaeology.getArtefactValue(ArtefactType.LARGE, map.digSite, map));
    }
    /** Updates the current progress of a maps upgrade actions */
    updateUpgradeProgress(map) {
        this.mapUpgradeProgress.textContent = `${numberWithCommas(map.upgradeActions)} / ${numberWithCommas(map.nextTierActions)}`;
        if (map.atMaxTier) {
            this.mapUpgradeProgress.classList.replace('text-success', 'text-warning');
        } else {
            this.mapUpgradeProgress.classList.replace('text-warning', 'text-success');
        }
    }
    setUnselected() {
        hideElement(this.infoContainer);
        showElement(this.noMapContainer);
    }
}
window.customElements.define('dig-site-map-info', DigSiteMapInfoElement);
class MapUpgradeMenuElement extends HTMLElement {
    constructor() {
        super();
        this.selectMapIcons = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('map-upgrade-menu-template'));
        this.digSiteName = getElementFromFragment(this._content, 'dig-site-name', 'h5');
        this.digSiteImage = getElementFromFragment(this._content, 'dig-site-image', 'img');
        this.createMapButton = getElementFromFragment(this._content, 'create-map-button', 'button');
        this.mapCreationCosts = getElementFromFragment(this._content, 'map-creation-costs', 'quantity-icons');
        this.mapInfo = getElementFromFragment(this._content, 'map-info', 'dig-site-map-info');
        this.upgradeRequires = getElementFromFragment(this._content, 'upgrade-requires', 'requires-box');
        this.upgradeHaves = getElementFromFragment(this._content, 'upgrade-haves', 'haves-box');
        this.grants = getElementFromFragment(this._content, 'grants', 'grants-box');
        this.upgradeButton = getElementFromFragment(this._content, 'upgrade-button', 'button');
        this.intervalIcon = getElementFromFragment(this._content, 'interval-icon', 'interval-icon');
        this.preserveIcon = getElementFromFragment(this._content, 'preserve-icon', 'preservation-icon');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'progress-bar');
        this.deleteMap = getElementFromFragment(this._content, 'delete-map', 'a');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Initializes the menu, assigning callback functions */
    init(cartography) {
        this.upgradeButton.onclick = () => cartography.startMapUpgradeOnClick();
    }
    unsetDigSite() {
        this.digSiteName.textContent = getLangString('NO_DIG_SITE_SELECTED');
        this.digSiteImage.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.selectMapIcons.forEach((icon) => hideElement(icon.img));
        hideElement(this.createMapButton);
    }
    setDigSite(digSite, cartography) {
        this.digSiteName.textContent = digSite.name;
        this.digSiteImage.src = digSite.media;
        this.updateMapSelectButtons(digSite, cartography);
        if (digSite.getMaxMaps() > digSite.maps.length) {
            this.updateMapCreationCost(digSite);
            this.createMapButton.onclick = () => cartography.createNewMapForDigSite(digSite);
            showElement(this.createMapButton);
        } else {
            hideElement(this.createMapButton);
        }
    }
    unsetDigSiteMap() {
        this.mapInfo.setUnselected();
        this.upgradeHaves.destroyIcons();
        this.upgradeRequires.destroyIcons();
        this.upgradeRequires.setUnselected();
        this.upgradeHaves.setUnselected();
        this.upgradeButton.disabled = true;
        this.intervalIcon.setInterval(0, []);
        this.preserveIcon.setChance(0, 80, []);
        this.grants.setUnselected();
    }
    /** Sets the menu for a given map */
    setDigSiteMap(map, cartography, game) {
        this.mapInfo.setMap(map);
        this.updateUpgradeCosts(map, cartography, game);
        this.grants.setSelected(false);
        this.grants.hideMastery();
        this.upgradeButton.disabled = map.atMaxTier;
        this.deleteMap.onclick = () => cartography.deleteDigSiteMapOnClick(map);
    }
    updateMapSelectButtons(digSite, cartography) {
        while (this.selectMapIcons.length < digSite.maps.length) {
            const img = createElement('img', {
                className: 'skill-icon-sm p-1 pointer-enabled',
                attributes: [
                    ['src', assets.getURI("assets/media/skills/archaeology/map_colour.png" /* Assets.FullMapSlot */ )]
                ],
            });
            const tooltip = tippy(img, {});
            this.createMapButton.before(img);
            this.selectMapIcons.push({
                img,
                tooltip
            });
        }
        digSite.maps.forEach((map, index) => {
            const icon = this.selectMapIcons[index];
            showElement(icon.img);
            if (digSite.selectedUpgradeIndex === index) {
                icon.img.classList.add('border', 'border-2x', 'border-success');
            } else {
                icon.img.classList.remove('border', 'border-2x', 'border-success');
            }
            icon.img.onclick = () => cartography.selectDigSiteMapOnClick(index);
            icon.tooltip.setContent(templateLangString('LEVEL_X_MAP', {
                level: map.level.toFixed(0)
            }));
        });
        for (let i = digSite.maps.length; i < this.selectMapIcons.length; i++) {
            hideElement(this.selectMapIcons[i].img);
        }
    }
    /** Updates the cost to perform a single upgrade action */
    updateUpgradeCosts(map, cartography, game) {
        const costs = cartography.getMapUpgradeCosts(map);
        this.upgradeRequires.setSelected();
        this.upgradeRequires.setItemsFromCosts(costs);
        this.upgradeHaves.setSelected();
        this.upgradeHaves.setItemsFromCosts(costs, game);
    }
    /** Updates the cost to create a new map */
    updateMapCreationCost(digSite) {
        this.mapCreationCosts.setSelected();
        this.mapCreationCosts.setIconsForFixedCosts(digSite.mapCreationCost, true);
    }
    updateQuantities(game) {
        this.mapCreationCosts.updateQuantities(game);
        this.upgradeHaves.updateQuantities(game);
    }
    /** Updates the interval and preservation chance when modifiers change */
    updateRates(cartography, map) {
        this.intervalIcon.setInterval(cartography.getMapUpgradeInterval(map.digSite), cartography.getIntervalSources(map.digSite));
        this.preserveIcon.setChance(cartography.getPreservationChance(map.digSite), cartography.getPreservationCap(map.digSite), cartography.getPreservationSources(map.digSite));
        const baseXP = cartography.getMapUpgradeBaseXP(map);
        this.grants.updateGrants(cartography.modifyXP(baseXP), baseXP, 0, 0, 0, map.digSite.realm);
        this.grants.setSources(cartography, map.digSite);
        this.grants.updateAbyssalGrants(0, 0);
    }
}
window.customElements.define('map-upgrade-menu', MapUpgradeMenuElement);
class MapRefinementMenuElement extends HTMLElement {
    constructor() {
        super();
        this.selectMapImages = [];
        this.refinements = [];
        this.refinementSelects = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('map-refinement-menu-template'));
        this.digSiteName = getElementFromFragment(this._content, 'dig-site-name', 'h5');
        this.digSiteImage = getElementFromFragment(this._content, 'dig-site-image', 'img');
        this.selectMapContainer = getElementFromFragment(this._content, 'select-map-container', 'div');
        this.mapInfo = getElementFromFragment(this._content, 'map-info', 'dig-site-map-info');
        this.refinementInfoContainer = getElementFromFragment(this._content, 'refinement-info-container', 'div');
        this.refinementCount = getElementFromFragment(this._content, 'refinement-count', 'span');
        this.refinementContainer = getElementFromFragment(this._content, 'refinement-container', 'ul');
        this.newContainer = getElementFromFragment(this._content, 'new-container', 'div');
        this.refinementCosts = getElementFromFragment(this._content, 'refinement-costs', 'quantity-icons');
        this.refinementSelectContainer = getElementFromFragment(this._content, 'refinement-select-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Sets the menu to display no dig site */
    unsetDigSite() {
        this.digSiteName.textContent = getLangString('NO_DIG_SITE_SELECTED');
        this.digSiteImage.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.selectMapImages.forEach((img) => hideElement(img));
    }
    /** Updates the map selection for a given digsite */
    setDigSite(digSite, cartography) {
        this.digSiteName.textContent = digSite.name;
        this.digSiteImage.src = digSite.media;
        const maxMaps = Math.max(digSite.getMaxMaps(), digSite.maps.length);
        while (maxMaps > this.selectMapImages.length) {
            this.selectMapImages.push(createElement('img', {
                className: 'skill-icon-sm p-1',
                parent: this.selectMapContainer
            }));
        }
        this.selectMapImages.forEach((img, i) => {
            if (i >= maxMaps) {
                hideElement(img);
            } else {
                img.classList.remove('pointer-enabled', 'border', 'border-2x', 'border-success');
                if (i >= digSite.maps.length) {
                    img.src = assets.getURI("assets/media/skills/archaeology/map_blank.png" /* Assets.EmptyMapSlot */ );
                } else {
                    img.src = assets.getURI("assets/media/skills/archaeology/map_colour.png" /* Assets.FullMapSlot */ );
                    img.classList.add('pointer-enabled');
                    if (i === digSite.selectedUpgradeIndex) {
                        img.classList.add('border', 'border-2x', 'border-success');
                    }
                    img.onclick = () => cartography.selectDigSiteMapOnClick(i);
                }
                showElement(img);
            }
        });
    }
    unsetDigSiteMap() {
        this.mapInfo.setUnselected();
        hideElement(this.refinementInfoContainer);
    }
    setDigSiteMap(map, cartography, game) {
        this.mapInfo.setMap(map);
        this.updateRefinements(map);
        this.updateNewRefinement(map, cartography, game);
        showElement(this.refinementInfoContainer);
    }
    /** Updates the current refinements for the selected map */
    updateRefinements(map) {
        this.refinementCount.textContent = `${map.refinements.length} / ${map.tier.refinementSlots}`;
        while (this.refinements.length < map.refinements.length) {
            this.refinements.push(createElement('li', {
                className: 'list-group-item text-success',
                parent: this.refinementContainer
            }));
        }
        this.refinements.forEach((li, i) => {
            if (i >= map.refinements.length) {
                hideElement(li);
            } else {
                const {
                    text
                } = map.refinements[i].print();
                li.textContent = templateLangString('FOR_THIS_MAP_ONLY', {
                    modifierDescription: text
                });
                showElement(li);
            }
        });
    }
    /** Updates the refinement selection for the given map */
    updateNewRefinement(map, cartography, game) {
        const refinementIndex = map.refinements.length;
        if (refinementIndex >= map.tier.refinementSlots) {
            hideElement(this.newContainer);
        } else {
            // Update Costs
            const costs = cartography.getNextRefinementSlotCost(map);
            this.refinementCosts.setSelected();
            this.refinementCosts.setIconsForCosts(costs, true);
            this.updateQuantities(game);
            // Update refinement selection
            const refinementSelection = cartography.refinementModifiers[refinementIndex];
            while (this.refinementSelects.length < refinementSelection.length) {
                this.refinementSelects.push(createElement('button', {
                    className: 'btn btn-outline-primary text-success',
                    attributes: [
                        ['type', 'button']
                    ],
                    parent: this.refinementSelectContainer,
                }));
            }
            this.refinementSelects.forEach((button, i) => {
                if (i >= refinementSelection.length) {
                    hideElement(button);
                } else {
                    const {
                        text
                    } = refinementSelection[i].print();
                    button.textContent = templateLangString('FOR_THIS_MAP_ONLY', {
                        modifierDescription: text
                    });
                    button.onclick = () => cartography.selectRefinementOnClick(map, i);
                    showElement(button);
                }
            });
            showElement(this.newContainer);
        }
    }
    updateQuantities(game) {
        this.refinementCosts.updateQuantities(game);
    }
}
window.customElements.define('map-refinement-menu', MapRefinementMenuElement);
class HexTooltipElement extends HTMLElement {
    constructor() {
        super();
        this.costElements = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('hex-tooltip-template'));
        this.coords = getElementFromFragment(this._content, 'coords', 'span');
        this.xp = getElementFromFragment(this._content, 'xp', 'span');
        this.level = getElementFromFragment(this._content, 'level', 'span');
        this.skillXP = getElementFromFragment(this._content, 'skill-xp', 'span');
        this.reqsContainer = getElementFromFragment(this._content, 'reqs-container', 'div');
        this.poiContainer = getElementFromFragment(this._content, 'poi-container', 'div');
        this.poiMedia = getElementFromFragment(this._content, 'poi-media', 'img');
        this.poiTitle = getElementFromFragment(this._content, 'poi-title', 'span');
        this.poiName = getElementFromFragment(this._content, 'poi-name', 'span');
        this.travelContainer = getElementFromFragment(this._content, 'travel-container', 'div');
        this.travelInfo = getElementFromFragment(this._content, 'travel-info', 'h5');
        this.travelCosts = getElementFromFragment(this._content, 'travel-costs', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    updateContents(hex, cartography) {
        this.setHex(hex, cartography);
        this.setRequirements(hex);
        if (hex.pointOfInterest !== undefined &&
            ((hex.pointOfInterest.hidden === undefined && hex.inSightRange) || hex.pointOfInterest.isDiscovered)) {
            this.setPOI(hex.pointOfInterest);
        } else {
            this.hidePOI();
        }
        // Compute path and travel costs
        if (!hex.isFullySurveyed) {
            this.hideTravelCosts();
        } else {
            if (hex.isPlayerHere) {
                this.showTravelHere();
            } else {
                const hexPath = hex.map.computePath(hex.map.playerPosition, hex);
                if (hexPath !== undefined) {
                    const costs = cartography.getTravelCosts(hexPath);
                    this.showTravelCosts(costs);
                } else {
                    this.showTravelNoPath();
                }
            }
        }
    }
    setHex(hex, cartography) {
        if (HexTooltipElement.showAxialCoords) {
            this.coords.textContent = `q:${hex.q}, r:${hex.r}`;
        } else {
            const offsetCoords = hex.to_oddq();
            this.coords.textContent = `(${offsetCoords.col}, ${offsetCoords.row})`;
        }
        if (hex.surveyXP > 0 || hex.inSightRange) {
            const nextLevel = Math.min(hex.maxLevel, hex.surveyLevel + 1);
            const xpToNext = Hex.getXPFromLevel(nextLevel);
            this.xp.textContent = `${numberWithCommas(hex.surveyXP)} / ${numberWithCommas(xpToNext)}`;
            this.level.textContent = `${hex.surveyLevel} / ${hex.maxLevel}`;
        }
        this.skillXP.textContent = numberWithCommas(Math.floor(cartography.getSkillXPForHexSurveyAction(hex)));
    }
    setRequirements(hex) {
        this.reqsContainer.innerHTML = printUnlockRequirementsAsHTML(hex.requirements).join('');
    }
    setPOI(poi) {
        if (poi instanceof DigSitePOI) {
            this.setTitle(getLangString('DIG_SITE'));
        } else if (poi instanceof Watchtower) {
            this.setTitle(getLangString('WATCHTOWER'));
        } else {
            this.setTitle(getLangString('POINT_OF_INTEREST'));
        }
        this.poiMedia.src = poi.isDiscovered ? poi.media : assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.poiName.textContent = poi.isDiscovered ? poi.name : getLangString('UNDISCOVERED');
        this.poiContainer.classList.add('d-flex');
        showElement(this.poiContainer);
    }
    hidePOI() {
        this.setTitle('');
        this.poiMedia.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
        this.poiName.textContent = '';
        this.poiContainer.classList.remove('d-flex');
        hideElement(this.poiContainer);
    }
    showTravelHere() {
        this.travelInfo.textContent = getLangString('YOU_ARE_HERE');
        hideElement(this.travelCosts);
        showElement(this.travelContainer);
    }
    showTravelNoPath() {
        this.travelInfo.textContent = getLangString('NO_ROUTE_HERE');
        hideElement(this.travelCosts);
        showElement(this.travelContainer);
    }
    showTravelCosts(costs) {
        this.travelInfo.textContent = getLangString('TRAVEL_COSTS');
        let i = 0;
        costs.getCurrencyQuantityArray().forEach(({
            currency,
            quantity
        }) => {
            this.addCostElement(currency.media, currency.formatAmount(formatNumber(quantity)), currency.canAfford(quantity), i);
            i++;
        });
        costs.getItemQuantityArray().forEach(({
            item,
            quantity
        }) => {
            this.addCostElement(item.media, `${numberWithCommas(quantity)} ${item.name}`, game.bank.getQty(item) >= quantity, i);
            i++;
        });
        for (let j = i; j < this.costElements.length; j++) {
            hideElement(this.costElements[j].cont);
        }
        showElement(this.travelCosts);
        showElement(this.travelContainer);
    }
    addCostElement(media, text, met, i) {
        let cost = this.costElements[i];
        if (cost === undefined) {
            const cont = createElement('div', {
                parent: this.travelCosts
            });
            const img = createElement('img', {
                className: 'skill-icon-xs'
            });
            const text = createElement('span', {
                className: 'text-success'
            });
            cont.append(img, text);
            cost = {
                cont,
                img,
                text
            };
            this.costElements.push(cost);
        }
        cost.img.src = media;
        cost.text.textContent = text;
        toggleDangerSuccess(cost.text, met);
        showElement(cost.cont);
    }
    hideTravelCosts() {
        hideElement(this.travelContainer);
    }
    setTitle(text) {
        this.poiTitle.textContent = text;
    }
}
HexTooltipElement.showAxialCoords = DEBUGENABLED;
window.customElements.define('hex-tooltip', HexTooltipElement);
class MapMasteryMenuElement extends HTMLElement {
    constructor() {
        super();
        this.masteryBonuses = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('map-mastery-menu-template'));
        this.mapTitle = getElementFromFragment(this._content, 'map-title', 'h3');
        this.masteryContainer = getElementFromFragment(this._content, 'mastery-container', 'div');
        this.hexMasteryCount = getElementFromFragment(this._content, 'hex-mastery-count', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setMap(map) {
        templateLangString('HEX_MASTERY_BONUSES_FOR_MAP', {
            worldName: map.name
        });
        this.setHexMasteryCount(map);
        while (this.masteryBonuses.length < map.sortedMasteryBonuses.length) {
            const newElem = new MapMasteryBonusElement();
            newElem.className = 'col-12';
            this.masteryContainer.appendChild(newElem);
            this.masteryBonuses.push(newElem);
        }
        map.sortedMasteryBonuses.forEach((bonus, i) => {
            const bonusElem = this.masteryBonuses[i];
            bonusElem.setBonus(bonus);
            showElement(bonusElem);
        });
        for (let i = map.sortedMasteryBonuses.length; i < this.masteryBonuses.length; i++) {
            hideElement(this.masteryBonuses[i]);
        }
    }
    setHexMasteryCount(map) {
        this.hexMasteryCount.innerHTML = templateLangString('HEX_MASTERY_COUNT_HTML', {
            value: numberWithCommas(map.masteredHexes),
        });
    }
}
window.customElements.define('map-mastery-menu', MapMasteryMenuElement);
class MapMasteryBonusElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('map-mastery-bonus-template'));
        this.hexCount = getElementFromFragment(this._content, 'hex-count', 'h3');
        this.modifierContainer = getElementFromFragment(this._content, 'modifier-container', 'div');
        this.modifierList = getElementFromFragment(this._content, 'modifier-list', 'div');
        this.rewardContainer = getElementFromFragment(this._content, 'reward-container', 'div');
        this.rewardList = getElementFromFragment(this._content, 'reward-list', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setBonus(bonus) {
        this.hexCount.textContent = templateLangString('HEX_COUNT', {
            count: numberWithCommas(bonus.masteredHexes)
        });
        toggleDangerSuccess(this.hexCount, bonus.awarded);
        this.modifierList.textContent = '';
        if (bonus.stats.hasStats) {
            this.modifierList.append(...bonus.stats.describeAsSpans());
            showElement(this.modifierContainer);
        } else {
            hideElement(this.modifierContainer);
        }
        this.rewardList.textContent = '';
        let hasRewards = false;
        if (bonus.currencies !== undefined) {
            hasRewards = true;
            bonus.currencies.forEach(({
                currency,
                quantity
            }) => {
                this.createReward(currency.media, numberWithCommas(quantity), currency.name);
            });
        }
        if (bonus.items !== undefined) {
            hasRewards = true;
            bonus.items.forEach(({
                item,
                quantity
            }) => {
                this.createReward(item.media, numberWithCommas(quantity), item.name);
            });
        }
        if (bonus.pets !== undefined) {
            hasRewards = true;
            bonus.pets.forEach((pet) => {
                this.createReward(pet.media, '', pet.name);
            });
        }
        if (hasRewards) {
            showElement(this.rewardContainer);
        } else {
            hideElement(this.rewardContainer);
        }
    }
    createReward(media, quantity, name) {
        const rewardElem = createElement('inline-requirement', {
            className: 'mx-2 text-success',
            parent: this.rewardList
        });
        rewardElem.setContent(media, quantity, name);
    }
}
window.customElements.define('map-mastery-bonus', MapMasteryBonusElement);
class PoiDiscoveryCostsElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('poi-discovery-costs-template'));
        this.infoText = getElementFromFragment(this._content, 'info-text', 'h5');
        this.costsBox = getElementFromFragment(this._content, 'costs-box', 'requires-box');
        this.havesBox = getElementFromFragment(this._content, 'haves-box', 'haves-box');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setCosts(costs, game) {
        this.costsBox.setSelected();
        this.costsBox.setItemsFromCosts(costs);
        this.havesBox.setSelected();
        this.havesBox.setItemsFromCosts(costs, game);
    }
    setInfoText(modalState, isDigSite) {
        if (modalState === 1 /* DiscoveryModalState.GoTo */ ) {
            if (isDigSite) {
                this.infoText.textContent = getLangString('DISCOVERED_INFO_TEXT_0');
            } else {
                this.infoText.textContent = getLangString('DISCOVERED_INFO_TEXT_1');
            }
        } else {
            this.infoText.textContent = getLangString('DISCOVERED_INFO_TEXT_2');
        }
    }
    destroyIcons() {
        this.costsBox.destroyIcons();
        this.havesBox.destroyIcons();
    }
    disconnectedCallback() {
        this.destroyIcons();
    }
}
window.customElements.define('poi-discovery-costs', PoiDiscoveryCostsElement);
//# sourceMappingURL=cartographyMenu.js.map
checkFileVersion('?12097')