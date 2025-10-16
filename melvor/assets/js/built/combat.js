"use strict";
// Main file for combat rewrite
/** Global Game Object */
let game;
let offlineLoading;
let skillNav;
let skillProgressDisplay;
let combatSkillProgressTable;
let spendMasteryMenu;
let skillMilestoneDisplay;
let skillTreeMenu;
/** Cache of elements required to render the enemy */
let enemyHTMLElements;
/** Cache of elements required to render the player */
let playerHTMLElements;
let thievingMenu;
let firemakingMenu;
let woodcuttingMenu;
let eventManager;
// Herblore Menus
let herbloreArtisanMenu;
let herbloreCategoryMenu;
const herbloreSelectionTabs = new Map();
let potionSelectMenu;
// Smithing Menus
let smithingArtisanMenu;
const smithingSelectionTabs = new Map();
let smithingCategoryMenu;
// Alt Magic Menus
let altMagicMenu;
let altMagicItemMenu;
let altMagicSelection;
// Runecrafting Menus
let runecraftingCategoryMenu;
let runecraftingArtisanMenu;
const runecraftingSelectionTabs = new Map();
// Crafting Menus
let craftingCategoryMenu;
let craftingArtisanMenu;
const craftingSelectionTabs = new Map();
// Fletching Menus
let fletchingCategoryMenu;
let fletchingArtisanMenu;
const fletchingSelectionTabs = new Map();
// Summoning Menus
let summoningArtisanMenu;
const summoningSelectionTabs = new Map();
let summoningCategoryMenu;
let summoningMarkMenu;
let summoningSearchMenu;
// Fishing Menus
const fishingAreaMenus = new Map();
// Cooking Menus
const cookingMenus = new Map();
// Agility Menus
const agilityObstacleMenus = [];
const agilityPillarMenus = [];
const agilityObstacleSelectMenus = [];
let agilityBreakdownMenu;
// Astrology Menus
let astrologyMenus;
// Farming Menus
let farmingMenus;
// Township Menus
let townshipUI;
// Archaeology Menus
let archaeologyMenus;
let archaeologyUI;
// Ancient Relic Menus
let ancientRelicsMenu;
// Bank Menus
let bankTabMenu;
let bankOptionsMenu;
let bankMoveModeMenu;
let bankSellModeMenu;
let bankSideBarMenu;
let bankItemSettingsMenu;
let itemUpgradeMenu;
// Cartography Menus
let cartographyMap;
let cartographyMapCreateMenu;
let cartographyMapMasteryMenu;
// Corruption Menus
let browseCorruptionMenu;
// Level Increase Menu
let levelCapIncreaseModal;
/** Monster Stats Component used in the view stats modal */
let monsterStatsModal;
const COMBAT_LEVEL_KEYS = [
    'Hitpoints',
    'Attack',
    'Strength',
    'Defence',
    'Ranged',
    'Magic',
    'Prayer',
    'Corruption',
];
// Shop Menus
let shopMenu;
let tutorialMenus;
let combatMenus;
const combatAreaMenus = new CombatAreaMenuManager();
const resistanceMenus = {
    viewItemStats: new Map(),
    viewEquipmentStats: new Map(),
    itemUpgrade: new Map(),
};
/** Constructs game object, sets global callbacks + references derived from it */
function initGameClass() {
    game = new Game();
    eventManager = new EventManager();
}
/** Constructs menus after game data registration */
function initMenus() {
    // Initialize custom components
    window.customElements.define('farming-seed-select', FarmingSeedSelectElement);
    window.customElements.define('spend-mastery-menu', SpendMasteryMenuElement);
    window.customElements.define('skill-milestone-display', SkillMilestoneDisplayElement);
    window.customElements.define('skill-tree-menu', SkillTreeMenuElement);
    window.customElements.define('potion-select-menu', PotionSelectMenuElement);
    window.customElements.define('item-upgrade-menu', ItemUpgradeMenuElement);
    window.customElements.define('equipment-grid', EquipmentGridElement);
    window.customElements.define('offline-loading', OfflineLoadingElement);
    window.customElements.define('mastery-pool-bonuses', MasteryPoolBonusesElement);
    window.customElements.define('ancient-relics-menu', AncientRelicsMenuElement);
    window.customElements.define('monster-stats', MonsterStatsElement);
    if (checkMediaQuery('(max-width: 991px)'))
        shiftToMobileLayout();
    addMediaQueryListener('(max-width: 991px)', onMobileScreenWidthChange);
    const header = document.getElementById('page-header');
    updateStickyElements(header.offsetHeight);
    const resizeObserver = new ResizeObserver((entries) => {
        updateStickyElements(header.offsetHeight);
    });
    resizeObserver.observe(header);
    sidebar.render();
    enemyHTMLElements = {
        maxHitpoints: [
            document.getElementById('combat-enemy-hitpoints-max'),
            document.getElementById('combat-enemy-hitpoints-max-1'),
        ],
        attackInterval: [document.getElementById('combat-enemy-attack-speed')],
        resistances: new Map(),
        hitpoints: [
            document.getElementById('combat-enemy-hitpoints-current'),
            document.getElementById('combat-enemy-hitpoints-current-1'),
        ],
        hitpointsBar: [
            document.getElementById('combat-enemy-hitpoints-bar'),
            document.getElementById('combat-enemy-hitpoints-bar-1'),
        ],
        image: document.getElementById('combat-enemy-img'),
        name: [document.getElementById('combat-enemy-name')],
        attackName: [document.getElementById('combat-enemy-attack-speed-desc')],
        attackType: [document.getElementById('combat-enemy-attack-type-name')],
        barrier: [document.getElementById('combat-enemy-barrier-current')],
        barrierBar: [
            document.getElementById('combat-enemy-barrier-bar'),
            document.getElementById('combat-enemy-barrier-bar-1'),
        ],
        maxBarrier: [document.getElementById('combat-enemy-barrier-max')],
        barrierContainer: [
            document.getElementById('combat-enemy-barrier-container'),
            document.getElementById('combat-enemy-barrier-container-1'),
        ],
    };
    // Set up sidebar
    game.pages.forEach((page) => page.generateSideBar());
    offlineLoading = document.getElementById('offline-loading-modal');
    skillNav = new SkillNav(game);
    // Set up page change buttons
    const pageButtons = document.querySelectorAll('button[data-page-id]');
    pageButtons.forEach((button) => {
        const pageID = button.getAttribute('data-page-id');
        if (pageID === null) {
            console.warn('Tried to initialize page change button, but page-id is null');
            console.log(button);
            return;
        }
        const page = game.pages.getObjectByID(pageID);
        if (page === undefined) {
            console.warn(`Tried to initialize page change button, but page with id: ${pageID} is not registered.`);
            console.log(button);
            return;
        }
        button.onclick = () => {
            changePage(page, -1, undefined, true, false);
            button.blur();
        };
    });
    playerHTMLElements = {
        maxHitpoints: [
            document.getElementById('combat-player-hitpoints-max'),
            document.getElementById('combat-player-hitpoints-max-1'),
            document.getElementById('thieving-player-hitpoints-max'),
        ],
        attackInterval: [document.getElementById('combat-player-attack-speed')],
        resistances: new Map(),
        hitpoints: [
            document.getElementById('combat-player-hitpoints-current'),
            document.getElementById('combat-player-hitpoints-current-1'),
            document.getElementById('thieving-player-hitpoints-current'),
        ],
        hitpointsBar: [
            document.getElementById('combat-player-hitpoints-bar'),
            document.getElementById('combat-player-hitpoints-bar-1'),
            document.getElementById('thieving-player-hitpoints-bar'),
        ],
        navHitpoints: [document.getElementById('nav-hitpoints-current')],
        navPrayerPoints: [document.getElementById('combat-player-prayer-points-2')],
        combatLevel: [sidebar.category('Combat').item("melvorD:Combat" /* PageIDs.Combat */ ).nameEl],
        attackName: [document.getElementById('combat-player-attack-speed-desc')],
        specialIcon: document.getElementById('combat-player-special-attack-icon'),
        specialTooltip: tippy(document.getElementById('combat-player-special-attack-icon'), {
            content: '',
            placement: 'bottom',
            allowHTML: true,
            interactive: false,
            animation: false,
        }),
        autoEatIcons: [
            document.getElementById('combat-player-auto-eat'),
            document.getElementById('thieving-player-auto-eat'),
        ],
        autoEatSpans: [
            document.getElementById('combat-player-auto-eat-span'),
            document.getElementById('thieving-player-auto-eat-span'),
        ],
        autoEatTooltips: tippy('.auto-eat-icon', {
            content: '',
            placement: 'bottom',
            allowHTML: true,
            interactive: false,
            animation: false,
        }),
        //triangleReductionIcon: document.getElementById('combat-player-damage-reduction-tooltip') as HTMLElement,
        golbinLevels: {
            Attack: document.getElementById('combat-player-golbin-stat-Attack'),
            Strength: document.getElementById('combat-player-golbin-stat-Strength'),
            Defence: document.getElementById('combat-player-golbin-stat-Defence'),
            Hitpoints: document.getElementById('combat-player-golbin-stat-Hitpoints'),
            Ranged: document.getElementById('combat-player-golbin-stat-Ranged'),
            Magic: document.getElementById('combat-player-golbin-stat-Magic'),
            Prayer: document.getElementById('golbin-raid-prayer-level-text'),
            Corruption: document.getElementById('golbin-raid-prayer-level-text'), //TODO_C - Add new element
        },
        barrier: [
            //document.getElementById('combat-player-barrier-current') as HTMLSpanElement,
            //document.getElementById('combat-player-barrier-current-1') as HTMLSpanElement,
        ],
        barrierBar: [
            //document.getElementById('combat-player-barrier-bar') as HTMLDivElement,
            //document.getElementById('combat-player-barrier-bar-1') as HTMLDivElement,
        ],
        maxBarrier: [
            //document.getElementById('combat-player-barrier-max') as HTMLElement,
            //document.getElementById('combat-player-barrier-max-1') as HTMLElement,
        ],
        barrierContainer: [
            //document.getElementById('combat-player-barrier-max') as HTMLElement,
            //document.getElementById('combat-player-barrier-max-1') as HTMLElement,
        ],
    };
    //Resistance elements
    // TODO_C Refactor
    game.damageTypes.forEach((damageType) => {
        // ITEM VIEW MENU
        const itemViewResistMenu = new CharacterResistanceElement(damageType);
        itemViewResistMenu.replaceResistanceDivClass('text-right', 'text-left');
        const itemViewResistEl = document.getElementById(`item-view-resistances`);
        if (itemViewResistEl === null)
            throw new Error('Item view resistances div element not found');
        itemViewResistEl.append(itemViewResistMenu);
        resistanceMenus.viewItemStats.set(damageType, itemViewResistMenu);
        // CURRENT ITEM VIEW MENU
        const itemViewCurrentResistMenu = new CharacterResistanceElement(damageType);
        itemViewCurrentResistMenu.replaceResistanceDivClass('text-right', 'text-left');
        const itemViewCurrentResistEl = document.getElementById(`item-view-current-resistances`);
        if (itemViewCurrentResistEl === null)
            throw new Error('Item view current resistances div element not found');
        itemViewCurrentResistEl.append(itemViewCurrentResistMenu);
        resistanceMenus.viewEquipmentStats.set(damageType, itemViewCurrentResistMenu);
    });
    skillProgressDisplay = new SkillProgressDisplay(game);
    combatSkillProgressTable = document.getElementById('combat-skill-progress-table');
    combatSkillProgressTable.initialize(game);
    // Load combat Menus
    const eventMenu = document.getElementById('combat-event-menu');
    combatMenus = {
        progressBars: {
            playerAttack: document.getElementById('combat-progress-attack-player'),
            playerAttackMinibar: document.getElementById('combat-progress-attack-player-1'),
            playerSummon: document.getElementById('combat-progress-attack-summoning'),
            playerSummonMinibar: document.getElementById('combat-progress-attack-summoning-1'),
            enemyAttack: document.getElementById('combat-progress-attack-enemy'),
            enemyAttackMinibar: document.getElementById('combat-progress-attack-enemy-1'),
        },
        playerEffectRenderer: new EffectRenderer(document.getElementById('combat-player-effect-icon-container'), document.getElementById('combat-player-effect-progress-bar-container'), document.getElementById('combat-player-effect-progress-icon-container')),
        enemyEffectRenderer: new EffectRenderer(document.getElementById('combat-enemy-effect-icon-container'), document.getElementById('combat-enemy-effect-progress-bar-container'), document.getElementById('combat-enemy-effect-progress-icon-container')),
        playerSplashManager: new SplashManager(document.getElementById('combat-player-splash-container')),
        enemySplashManager: new SplashManager(document.getElementById('combat-enemy-splash-container')),
        spells: document.getElementById('combat-spellbook-menu'),
        prayer: document.getElementById('combat-prayer-book-menu'),
        runes: document.getElementById('combat-rune-menu'),
        equipSets: [
            new EquipmentSetMenu('combat-equipment-set-menu-0', ['btn', 'border-dark']),
            new EquipmentSetMenu('combat-equipment-set-menu-1', ['btn', 'btn-sm', 'border-dark']),
            new EquipmentSetMenu('combat-equipment-set-menu-2', ['btn', 'btn-sm', 'border-dark', 'fixed-size', 'mt-1']),
        ],
        combatFood: document.getElementById('combat-food-select'),
        thievingFood: document.getElementById('thieving-food-select'),
        equipment: [],
        eventMenu,
        loot: document.getElementById('combat-loot'),
        slayerTask: document.getElementById('combat-slayer-task-menu'),
        runButton: document.getElementById('combat-btn-run'),
        minibarRunButton: document.getElementById('combat-footer-minibar-run-btn'),
        minibarEatButton: document.getElementById('combat-footer-minibar-eat-btn'),
        viewDropsButton: document.getElementById('combat-btn-monster-drops'),
        attackMonsterButton: document.getElementById('combat-btn-attack'),
        locationElements: {
            image: document.getElementById('combat-dungeon-img'),
            name: document.getElementById('combat-dungeon-name'),
            floorCount: document.getElementById('combat-dungeon-floor-count'),
            count: document.getElementById('combat-dungeon-count'),
            areaEffect: document.getElementById('combat-area-effect'),
        },
        equipmentMenuIcons: [
            document.getElementById('combat-menu-item-0'),
            document.getElementById('page-header-equipment-dropdown-image'),
        ],
        corruptionSettings: document.getElementById('combat-corruption-settings'),
        menuTabs: [],
        menuPanels: [],
        enemyOffensiveStats: document.getElementById('combat-enemy-offensive-stats'),
        enemyDefensiveStats: document.getElementById('combat-enemy-defensive-stats'),
        playerStats: document.getElementById('combat-player-stats'),
        enemyPassives: document.getElementById('combat-enemy-passives'),
        enemySpecialAttacks: document.getElementById('combat-enemy-special-attacks'),
        enemyLevels: document.getElementById('combat-enemy-levels'),
    };
    for (let i = 0; i < 8 /* CombatMenuId.Count */ ; i++) {
        combatMenus.menuTabs.push(document.getElementById(`combat-menu-item-${i}`));
        combatMenus.menuPanels.push(document.getElementById(`combat-menu-${i}`));
    }
    combatMenus.progressBars.playerSummon.setStyle('bg-secondary');
    combatMenus.progressBars.playerSummonMinibar.setStyle('bg-secondary');
    document.querySelectorAll('equipment-grid').forEach((grid) => {
        grid.initialize(game);
        combatMenus.equipment.push(grid);
    });
    // Initialize Combat Menus
    combatMenus.spells.init(game);
    combatMenus.prayer.init(game);
    combatMenus.playerStats.init(game);
    combatMenus.enemyDefensiveStats.init(game);
    // Generate combat area menus
    const combatAreaCategoryMenu = document.getElementById('combat-area-category-menu');
    combatAreaCategoryMenu.addOptions(game.combatAreaCategoryOrder, getLangString('SELECT_COMBAT_AREA'), (category) => combatAreaMenus.toggleCategory(category));
    combatAreaMenus.init(game, combatAreaCategoryMenu);
    // Generate Attack Style Buttons
    game.attackStyles.forEach((style) => {
        const container = document.getElementById(`${style.attackType}-attack-style-buttons`);
        const button = createElement('button', {
            className: 'btn btn-outline-secondary my-1',
            id: style.buttonID
        });
        button.style.width = '100%';
        style.experienceGain.forEach(({
            skill
        }) => {
            button.append(createElement('img', {
                className: 'nav-img',
                attributes: [
                    ['src', skill.media]
                ]
            }));
        });
        button.append(createElement('span', {
            text: style.name
        }));
        container.appendChild(createElement('div', {
            className: 'col-6 col-lg-12'
        })).appendChild(button);
        tippy(button, {
            content: style.toolTipContent,
            placement: 'right',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    });
    // Load Woodcutting Menus
    woodcuttingMenu = new WoodcuttingMenu(game.woodcutting);
    // Load Fishing Menus
    const fishingAreaMenuContainer = document.getElementById('fishing-area-menu-container');
    game.fishing.areas.allObjects
        .sort((a, b) => {
            return BasicSkillRecipe.sortByLevels(a.fish[0], b.fish[0]);
        })
        .forEach((area) => {
            const menu = new FishingAreaMenuElement();
            menu.className = 'col-12 col-xl-6';
            fishingAreaMenuContainer.append(menu);
            fishingAreaMenus.set(area, menu);
        });
    // Load Cooking Menus
    const cookingMenuContainer = document.getElementById('cooking-menu-container');
    game.cooking.categories.forEach((category) => {
        const menu = createElement('cooking-menu', {
            className: 'col-12 col-lg-4',
            parent: cookingMenuContainer
        });
        menu.init(category, game);
        cookingMenus.set(category, menu);
    });
    // Load Astrology Menus
    const constellations = new Map();
    const infoPanel = document.getElementById('astrology-info-panel');
    infoPanel.initialize(game);
    const explorePanel = document.getElementById('astrology-exploration-panel');
    const lockedConstellation = document.getElementById('astrology-locked-constellation');
    game.astrology.sortedMasteryActions.forEach((recipe) => {
        const constellationMenu = createElement('constellation-menu', {
            className: 'col-6 col-lg-3'
        });
        constellationMenu.initIcons(game);
        lockedConstellation.before(constellationMenu);
        constellations.set(recipe, constellationMenu);
    });
    astrologyMenus = {
        constellations,
        locked: lockedConstellation,
        infoPanel,
        explorePanel,
    };
    // Load Herblore Menus
    herbloreArtisanMenu = document.getElementById('herblore-artisan-menu');
    herbloreCategoryMenu = document.getElementById('herblore-category-menu');
    herbloreCategoryMenu.addOptions(game.herblore.categories.allObjects, getLangString('MENU_TEXT_SELECT_HERBLORE_CATEGORY'), switchToCategory(herbloreSelectionTabs));
    const herbCategoryContainer = document.getElementById('herblore-category-container');
    game.herblore.categories.forEach((category) => {
        const recipes = game.herblore.actions.filter((r) => r.category === category);
        recipes.sort(BasicSkillRecipe.sortByLevels);
        const tab = createElement('recipe-selection-tab', {
            className: 'col-12 col-md-8 d-none',
            attributes: [
                ['data-option-tag-name', 'herblore-recipe-option']
            ],
            parent: herbCategoryContainer,
        });
        tab.setRecipes(recipes, game.herblore);
        herbloreSelectionTabs.set(category, tab);
    });
    potionSelectMenu = document.getElementById('potion-select-menu-modal');
    // Load Agility Menus
    agilityBreakdownMenu = document.getElementById('agility-breakdown');
    // Load Smithing Menus
    smithingCategoryMenu = document.getElementById('smithing-category-menu');
    smithingCategoryMenu.addOptions(game.smithing.categories.allObjects, getLangString('MENU_TEXT_SELECT_SMITHING_CATEGORY'), switchToCategory(smithingSelectionTabs));
    smithingArtisanMenu = document.getElementById('smithing-artisan-menu');
    smithingArtisanMenu.init(game.smithing);
    const smithCategoryContainer = document.getElementById('smithing-category-container');
    game.smithing.categories.forEach((category) => {
        const recipes = game.smithing.actions.filter((r) => r.category === category);
        recipes.sort(BasicSkillRecipe.sortByLevels);
        const tab = createElement('recipe-selection-tab', {
            className: 'col-12 col-md-8 d-none',
            attributes: [
                ['data-option-tag-name', 'smithing-recipe-option']
            ],
            parent: smithCategoryContainer,
        });
        tab.setRecipes(recipes, game.smithing);
        smithingSelectionTabs.set(category, tab);
    });
    // Load Runecrafting Menus
    runecraftingCategoryMenu = document.getElementById('runecrafting-category-menu');
    runecraftingCategoryMenu.addOptions(game.runecrafting.categories.allObjects, getLangString('MENU_TEXT_SELECT_RUNECRAFTING_CATEGORY'), switchToCategory(runecraftingSelectionTabs));
    runecraftingArtisanMenu = document.getElementById('runecrafting-artisan-menu');
    runecraftingArtisanMenu.init(game.runecrafting);
    const runecraftingCategoryContainer = document.getElementById('runecrafting-category-container');
    game.runecrafting.categories.forEach((category) => {
        const recipes = game.runecrafting.actions.filter((recipe) => recipe.category === category);
        recipes.sort(BasicSkillRecipe.sortByLevels);
        const tab = createElement('recipe-selection-tab', {
            className: 'col-12 col-md-8 d-none',
            attributes: [
                ['data-option-tag-name', 'runecrafting-recipe-option']
            ],
            parent: runecraftingCategoryContainer,
        });
        tab.setRecipes(recipes, game.runecrafting);
        runecraftingSelectionTabs.set(category, tab);
    });
    // Load Crafting Menus
    craftingCategoryMenu = document.getElementById('crafting-category-menu');
    craftingCategoryMenu.addOptions(game.crafting.categories.allObjects, getLangString('MENU_TEXT_SELECT_CRAFTING_CATEGORY'), switchToCategory(craftingSelectionTabs));
    craftingArtisanMenu = document.getElementById('crafting-artisan-menu');
    craftingArtisanMenu.init(game.crafting);
    const craftingCategoryContainer = document.getElementById('crafting-category-container');
    game.crafting.categories.forEach((category) => {
        const recipes = game.crafting.actions.filter((r) => r.category === category);
        recipes.sort(BasicSkillRecipe.sortByLevels);
        const tab = createElement('recipe-selection-tab', {
            className: 'col-12 col-md-8 d-none',
            attributes: [
                ['data-option-tag-name', 'crafting-recipe-option']
            ],
            parent: craftingCategoryContainer,
        });
        tab.setRecipes(recipes, game.crafting);
        craftingSelectionTabs.set(category, tab);
    });
    // Load Fletching Menus
    fletchingCategoryMenu = document.getElementById('fletching-category-menu');
    fletchingCategoryMenu.addOptions(game.fletching.categories.allObjects, getLangString('MENU_TEXT_SELECT_FLETCHING_CATEGORY'), switchToCategory(fletchingSelectionTabs));
    fletchingArtisanMenu = document.getElementById('fletching-artisan-menu');
    fletchingArtisanMenu.init(game.fletching);
    const fletchingCategoryContainer = document.getElementById('fletching-category-container');
    game.fletching.categories.forEach((category) => {
        const recipes = game.fletching.actions.filter((r) => r.category === category);
        recipes.sort(BasicSkillRecipe.sortByLevels);
        const tab = createElement('recipe-selection-tab', {
            className: 'col-12 col-md-8 d-none',
            attributes: [
                ['data-option-tag-name', 'fletching-recipe-option']
            ],
            parent: fletchingCategoryContainer,
        });
        tab.setRecipes(recipes, game.fletching);
        fletchingSelectionTabs.set(category, tab);
    });
    // Load Summoning Menus
    summoningCategoryMenu = document.getElementById('summoning-category-menu');
    summoningCategoryMenu.addOptions(game.summoning.categories.allObjects, getLangString('MENU_TEXT_SELECT_SUMMONING_CATEGORY'), switchSummoningCategory);
    summoningArtisanMenu = document.getElementById('summoning-artisan-menu');
    summoningArtisanMenu.init(game.summoning);
    const summoningCategoryContainer = document.getElementById('summoning-category-container');
    game.summoning.categories.forEach((category) => {
        if (category.type !== 'Tablet')
            return;
        const recipes = game.summoning.actions.filter((r) => r.category === category);
        recipes.sort(BasicSkillRecipe.sortByLevels);
        const tab = createElement('summoning-selection-tab', {
            className: 'col-12 col-lg-8 d-none',
            parent: summoningCategoryContainer,
        });
        tab.setRecipes(recipes, game.summoning);
        summoningSelectionTabs.set(category, tab);
    });
    summoningMarkMenu = document.getElementById('summoning-mark-menu');
    const summoningSearchMenuCont = document.getElementById('summoning-synergies-search-cont');
    summoningSearchMenu = new SynergySearchMenuElement();
    summoningSearchMenu.classList.add('row');
    summoningSearchMenuCont.append(summoningSearchMenu);
    // Cache/load alt magic menus
    altMagicMenu = document.getElementById('magic-screen-cast');
    altMagicItemMenu = document.getElementById('magic-screen-select');
    const altMagicCategoryContainer = document.getElementById('altmagic-category-container');
    altMagicSelection = createElement('recipe-selection-tab', {
        className: 'col-12 col-md-8',
        attributes: [
            ['data-option-tag-name', 'alt-magic-spell-option']
        ],
        parent: altMagicCategoryContainer,
    });
    altMagicSelection.setRecipes(game.altMagic.actions.allObjects.sort(BasicSkillRecipe.sortByLevels), game.altMagic);
    // Load Bank Menus
    bankTabMenu = document.getElementById('bank-tab-menu');
    bankMoveModeMenu = document.getElementById('main-bank-move-mode');
    bankSellModeMenu = document.getElementById('main-bank-sell-mode');
    bankOptionsMenu = document.getElementById('main-bank-options');
    bankSideBarMenu = document.getElementById('main-bank-sidebar');
    itemUpgradeMenu = document.getElementById('item-upgrade-menu');
    itemUpgradeMenu.initResistances(game);
    // Initialize the bank menus
    bankMoveModeMenu.initialize(game.bank);
    bankSellModeMenu.initialize(game.bank);
    bankOptionsMenu.initialize(game.bank);
    bankSideBarMenu.initialize(game);
    bankTabMenu.initialize(game.bank);
    // Load Thieving Menus
    thievingMenu = new ThievingMenu('thieving-npc-container', game.thieving);
    // Load Firemaking Menus
    firemakingMenu = {
        logs: document.getElementById('firemaking-log-menu'),
        bonfire: document.getElementById('firemaking-bonfire-menu'),
        oil: document.getElementById('firemaking-oil-menu'),
    };
    firemakingMenu.logs.init(game, game.firemaking);
    firemakingMenu.bonfire.init(game.firemaking);
    firemakingMenu.oil.init(game.firemaking);
    spendMasteryMenu = document.getElementById('modal-spend-mastery-menu');
    skillMilestoneDisplay = document.getElementById('skill-milestones');
    // Load Farming Menus
    farmingMenus = {
        categoryOptions: document.getElementById('farming-category-options'),
        categoryButtons: new Map(),
        plots: [],
        plotMap: new Map(),
        lockedPlotMap: new Map(),
        lockedPlots: [],
        seedSelect: document.getElementById('farming-seed-select'),
        plotContainer: document.getElementById('farming-plot-container'),
        compostIcons: [],
    };
    const farmingCategoryContainer = document.getElementById('farming-category-container');
    game.farming.categories.forEach((category) => {
        const button = createElement('farming-category-button', {
            className: 'col-12 col-md-6 col-xl-4'
        });
        button.setCategory(category, game.farming);
        farmingMenus.categoryButtons.set(category, button);
        farmingCategoryContainer.append(button);
    });
    // Load township menus
    townshipUI = new TownshipUI(game, game.township);
    // Load Ancient Relics Menus
    ancientRelicsMenu = document.getElementById('modal-ancient-relics-menu');
    ancientRelicsMenu.init(game);
    // Load Tutorial Menus
    tutorialMenus = {
        headerStage: document.getElementById('tutorial-stage-header'),
        progress: document.getElementById('tutorial-progress'),
        stageContainer: document.getElementById('tutorial-stage-container'),
        stages: [],
    };
    skillTreeMenu = document.getElementById('modal-skill-tree-menu');
    skillTreeMenu.initialize(game);
    monsterStatsModal = document.getElementById('modal-monster-stats');
    monsterStatsModal.init(game);
    // Load lore buttons
    game.lore.loadLoreButtons();
    levelCapIncreaseModal = createElement('skill-cap-increase-modal');
    UpgradeChainDisplayElement.initializeAll(game);
    game.minibar.initialize();
    game.combat.loot.initializeMenus();
    combatMenus.slayerTask.initialize(game);
    if (cloudManager.hasAoDEntitlementAndIsEnabled) {
        archaeologyUI = new ArchaeologyUI(game.archaeology);
        // Load Cartography Menus
        cartographyMap = document.getElementById('cartography-map-display');
        cartographyMapCreateMenu = document.getElementById('modal-create-map-menu');
        cartographyMapMasteryMenu = document.getElementById('modal-map-mastery-menu');
        // Load Archaeology Menus
        const digSites = new Map();
        game.archaeology.actions.forEach((digSite) => {
            const digSiteContainer = new ArchaeologyDigSiteContainerElement();
            digSiteContainer.classList.add('col-12', 'col-md-6', 'col-xl-3');
            archaeologyUI.defaultElements.containers.digSites.appendChild(digSiteContainer);
            digSites.set(digSite, digSiteContainer);
        });
        archaeologyMenus = {
            digSites,
        };
    }
    if (cloudManager.hasItAEntitlementAndIsEnabled) {
        const browseCorruptionMenuCont = document.getElementById('browse-corruptions-cont');
        browseCorruptionMenu = new CorruptionMenuElement();
        browseCorruptionMenu.classList.add('row');
        browseCorruptionMenuCont.append(browseCorruptionMenu);
    }
    game.skills.forEach((skill) => skill.initMenus());
    game.realmSidebarSelect = new RealmSidebarSelect();
    if (DEBUGENABLED) {
        const cheatButton = createElement('button', {
            text: 'Cheat',
            className: 'btn btn-success'
        });
        cheatButton.onclick = () => game.testForOffline(24);
        cheatButton.style.width = '150px';
        cheatButton.style.height = '50px';
        cheatButton.style.position = 'fixed';
        cheatButton.style.top = '0px';
        cheatButton.style.left = '50%';
        cheatButton.style.zIndex = '100000';
        document.body.append(cheatButton);
    }
}
//# sourceMappingURL=combat.js.map
checkFileVersion('?12097')