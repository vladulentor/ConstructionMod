"use strict";
const saveFormat2Version = 21;
// NOTICE: When updating the save version, and save encoding/decoding, please use the SaveVersion enum
// This is to prevent conflicts between branches that both change the save version, as well as avoid future use of magic numbers in encoding/decoding
// The enum members name should typically match what feature was added that required a save version bump
const currentSaveVersion = 131 /* SaveVersion.ItemClaimCount */ ;
const numberVarDiff = {
    0: {
        add: [
            'firstTime',
            'nameChanges',
            'gp',
            'defaultPageOnLoad',
            'levelUpScreen',
            'attackStyle',
            'currentCombatFood',
            'showItemNotify',
            'myBankVersion',
            'selectedSpell',
            'buyQty',
            'sellQty',
            'accountGameVersion',
            'prayerPoints',
            'slayerCoins',
            'selectedEquipmentSet',
            'formatNumberSetting',
            'saveTimestamp',
            'activeAurora',
            'currentGamemode',
            'raidCoins',
            'agilityPassivePillarActive',
        ],
        remove: [],
    },
    1: {
        add: [],
        remove: [],
    },
    2: {
        add: [],
        remove: [
            'currentCombatFood',
            'selectedSpell',
            'prayerPoints',
            'slayerCoins',
            'selectedEquipmentSet',
            'activeAurora',
        ],
    },
    3: {
        add: [],
        remove: [],
    },
    4: {
        add: [],
        remove: [],
    },
    5: {
        add: [],
        remove: [],
    },
    6: {
        add: ['tutorialProgress'],
        remove: []
    },
    7: {
        add: [],
        remove: [],
    },
    8: {
        add: [],
        remove: [],
    },
    9: {
        add: [],
        remove: [],
    },
    10: {
        add: [],
        remove: [],
    },
    11: {
        add: ['christmas2021Progress'],
        remove: [],
    },
    12: {
        add: [],
        remove: [],
    },
    13: {
        add: [],
        remove: [],
    },
    14: {
        add: [],
        remove: [],
    },
    15: {
        add: [],
        remove: [],
    },
    16: {
        add: [],
        remove: [],
    },
    17: {
        add: [],
        remove: ['agilityPassivePillarActive'],
    },
    18: {
        add: [],
        remove: [],
    },
    19: {
        add: [],
        remove: [],
    },
    20: {
        add: [],
        remove: [],
    },
    21: {
        add: [],
        remove: [],
    },
    22: {
        add: [],
        remove: [],
    },
};
const boolVarDiff = {
    0: {
        add: [
            'ignoreBankFull',
            'continueThievingOnStun',
            'autoRestartDungeon',
            'autoSaveCloud',
            'darkMode',
            'showGPNotify',
            'enableAccessibility',
            'showEnemySkillLevels',
            'confirmationOnClose',
            'autoPotion',
            'showCommas',
            'showVirtualLevels',
            'secretAreaUnlocked',
            'showSaleNotifications',
            'showShopNotifications',
            'pauseOfflineActions',
            'showCombatMinibar',
            'showCombatMinibarCombat',
            'showSkillMinibar',
            'disableAds',
            'useCombinationRunes',
            'firstTimeLoad',
            'autoSlayer',
        ],
        remove: [],
    },
    1: {
        add: [],
        remove: [],
    },
    2: {
        add: [],
        remove: [],
    },
    3: {
        add: [],
        remove: [],
    },
    4: {
        add: [],
        remove: ['continueThievingOnStun'],
    },
    5: {
        add: [],
        remove: ['autoPotion'],
    },
    6: {
        add: ['tutorialComplete'],
        remove: [],
    },
    7: {
        add: [],
        remove: [],
    },
    8: {
        add: [],
        remove: [],
    },
    9: {
        add: [],
        remove: [],
    },
    10: {
        add: [],
        remove: [],
    },
    11: {
        add: [],
        remove: [],
    },
    12: {
        add: [],
        remove: [],
    },
    13: {
        add: [],
        remove: [],
    },
    14: {
        add: [],
        remove: [],
    },
    15: {
        add: [],
        remove: [],
    },
    16: {
        add: [],
        remove: ['secretAreaUnlocked'],
    },
    17: {
        add: [],
        remove: [],
    },
    18: {
        add: [],
        remove: [],
    },
    19: {
        add: [],
        remove: [],
    },
    20: {
        add: [],
        remove: [],
    },
    21: {
        add: [],
        remove: [],
    },
};
const otherVarDiff = {
    0: {
        add: [
            'offline',
            'titleNewsID',
            'scheduledPushNotifications',
            'username',
            'gameUpdateNotification',
            'randomModifiers',
        ],
        remove: [],
    },
    1: {
        add: ['summoningData'],
        remove: [],
    },
    2: {
        add: [],
        remove: ['randomModifiers'],
    },
    3: {
        add: [],
        remove: [],
    },
    4: {
        add: ['cookingStockpiles'],
        remove: [],
    },
    5: {
        add: [],
        remove: [],
    },
    6: {
        add: ['completedTasks', 'activeTasks'],
        remove: [],
    },
    7: {
        add: [],
        remove: [],
    },
    8: {
        add: [],
        remove: [],
    },
    9: {
        add: ['activeAstrologyModifiers', 'plantAllSelected'],
        remove: [],
    },
    10: {
        add: [],
        remove: [],
    },
    11: {
        add: ['christmas2021PresentProgress'],
        remove: [],
    },
    12: {
        add: [],
        remove: [],
    },
    13: {
        add: [],
        remove: [],
    },
    14: {
        add: ['bankTabIcons'],
        remove: [],
    },
    15: {
        add: ['customMinibarItems'],
        remove: [],
    },
    16: {
        add: [],
        remove: ['summoningData', 'cookingStockpiles'],
    },
    17: {
        add: [],
        remove: ['activeAstrologyModifiers'],
    },
    18: {
        add: [],
        remove: [],
    },
    19: {
        add: [],
        remove: [],
    },
    20: {
        add: [],
        remove: [],
    },
    21: {
        add: [],
        remove: [],
    },
};
const serialVarDiff = {
    0: {
        add: [
            'bank',
            'statsGeneral',
            'statsWoodcutting',
            'statsFiremaking',
            'statsFishing',
            'statsCooking',
            'statsMining',
            'statsSmithing',
            'statsCombat',
            'statsThieving',
            'statsFarming',
            'statsFletching',
            'statsCrafting',
            'statsRunecrafting',
            'statsHerblore',
            'glovesTracker',
            'rockData',
            'herbloreBonuses',
            'tutorialTips',
            'shopItemsPurchased',
            'combatData',
            'equippedFood',
            'SETTINGS',
            'monsterStats',
            'petUnlocked',
            'skillsUnlocked',
            'equipmentSets',
            'skillXP',
            'dungeonCompleteCount',
            'selectedAttackStyle',
            'lockedItems',
            'golbinRaidStats',
            'slayerTask',
            'slayerTaskCompletion',
            'chosenAgilityObstacles',
            'agilityObstacleBuildCount',
            'itemsAlreadyFound',
            'saveStateBeforeRaid',
        ],
        remove: [],
    },
    1: {
        add: [],
        remove: [],
    },
    2: {
        add: [],
        remove: [
            'combatData',
            'equippedFood',
            'equipmentSets',
            'selectedAttackStyle',
            'slayerTask',
            'slayerTaskCompletion',
            'saveStateBeforeRaid',
        ],
    },
    3: {
        add: [],
        remove: [],
    },
    4: {
        add: [],
        remove: [],
    },
    5: {
        add: [],
        remove: [],
    },
    6: {
        add: [],
        remove: [],
    },
    7: {
        add: [],
        remove: [],
    },
    8: {
        add: [],
        remove: [],
    },
    9: {
        add: [],
        remove: [
            'statsGeneral',
            'statsWoodcutting',
            'statsFiremaking',
            'statsFishing',
            'statsCooking',
            'statsMining',
            'statsSmithing',
            'statsCombat',
            'statsThieving',
            'statsFarming',
            'statsFletching',
            'statsCrafting',
            'statsRunecrafting',
            'statsHerblore',
            'monsterStats',
            'golbinRaidStats',
        ],
    },
    10: {
        add: [],
        remove: ['rockData'],
    },
    11: {
        add: [],
        remove: [],
    },
    12: {
        add: [],
        remove: [],
    },
    13: {
        add: [],
        remove: [],
    },
    14: {
        add: [],
        remove: [],
    },
    15: {
        add: [],
        remove: [],
    },
    16: {
        add: [],
        remove: ['tutorialTips'],
    },
    17: {
        add: [],
        remove: ['chosenAgilityObstacles', 'agilityObstacleBuildCount'],
    },
    18: {
        add: [],
        remove: [],
    },
    19: {
        add: [],
        remove: [],
    },
    20: {
        add: [],
        remove: [],
    },
    21: {
        add: [],
        remove: [],
    },
};
const nestedVarDiff = {
    0: {
        add: ['newFarmingAreas', 'MASTERY', 'golbinRaidHistory', 'itemStats'],
        remove: [],
    },
    1: {
        add: [],
        remove: [],
    },
    2: {
        add: [],
        remove: [],
    },
    3: {
        add: [],
        remove: [],
    },
    4: {
        add: [],
        remove: [],
    },
    5: {
        add: [],
        remove: [],
    },
    6: {
        add: [],
        remove: [],
    },
    7: {
        add: [],
        remove: [],
    },
    8: {
        add: [],
        remove: [],
    },
    9: {
        add: [],
        remove: ['itemStats'],
    },
    10: {
        add: [],
        remove: [],
    },
    11: {
        add: [],
        remove: [],
    },
    12: {
        add: [],
        remove: [],
    },
    13: {
        add: [],
        remove: [],
    },
    14: {
        add: [],
        remove: [],
    },
    15: {
        add: [],
        remove: [],
    },
    16: {
        add: [],
        remove: [],
    },
    17: {
        add: [],
        remove: [],
    },
    18: {
        add: [],
        remove: [],
    },
    19: {
        add: [],
        remove: [],
    },
    20: {
        add: [],
        remove: [],
    },
    21: {
        add: [],
        remove: [],
    },
};
/** Readonly object, will return a new save game object */
const defaultSaveValues = {
    ignoreBankFull: false,
    continueThievingOnStun: false,
    autoRestartDungeon: true,
    autoSaveCloud: true,
    darkMode: true,
    showGPNotify: true,
    enableAccessibility: false,
    showEnemySkillLevels: false,
    confirmationOnClose: false,
    autoPotion: false,
    showCommas: true,
    showVirtualLevels: false,
    secretAreaUnlocked: false,
    showSaleNotifications: true,
    showShopNotifications: true,
    pauseOfflineActions: true,
    showCombatMinibar: true,
    showCombatMinibarCombat: true,
    showSkillMinibar: true,
    disableAds: false,
    useCombinationRunes: false,
    firstTimeLoad: false,
    autoSlayer: false,
    firstTime: 0,
    nameChanges: 0,
    gp: 0,
    defaultPageOnLoad: 0,
    levelUpScreen: 1,
    attackStyle: 0,
    currentCombatFood: 0,
    showItemNotify: 1,
    myBankVersion: 1,
    buyQty: 1,
    sellQty: 1,
    accountGameVersion: 0,
    formatNumberSetting: 0,
    saveTimestamp: 0,
    currentGamemode: 0,
    raidCoins: 0,
    agilityPassivePillarActive: -1,
    get bank() {
        return [];
    },
    get statsGeneral() {
        return [{
                stat: 'Total GP earnt',
                id: '#stat-general-gp-earnt',
                count: 0,
            },
            {
                stat: 'Total items sold',
                id: '#stat-general-items-sold',
                count: 0,
            },
            {
                stat: 'Attempts at username changes',
                id: '#stat-general-name-changes',
                count: 0,
            },
        ];
    },
    get statsWoodcutting() {
        return [{
                stat: 'Total trees cut / Environmental Impact',
                id: '#stat-woodcutting-trees-cut',
                count: 0,
            },
            {
                stat: 'Logs sold',
                id: '#stat-woodcutting-logs-sold',
                count: 0,
            },
            {
                stat: 'GP earnt from logs sold',
                id: '#stat-woodcutting-gp-earnt-logs',
                count: 0,
            },
            {
                stat: 'Seconds spent cutting',
                id: '#stat-woodcutting-seconds-spent-cutting',
                count: 0,
            },
        ];
    },
    get statsFiremaking() {
        return [{
                stat: 'Logs burnt',
                id: '#stat-firemaking-logs-burnt',
                count: 0,
            },
            {
                stat: 'GP Burnt',
                id: '#stat-firemaking-gp-burnt',
                count: 0,
            },
            {
                stat: 'Seconds spent burning',
                id: '#stat-firemaking-seconds-spent-burning',
                count: 0,
            },
            {
                stat: 'Bonfire bonus XP',
                id: '#stat-firemaking-bonfire-bonus-xp',
                count: 0,
            },
        ];
    },
    get statsFishing() {
        return [{
                stat: 'Fish caught',
                id: '#stat-fishing-fish-caught',
                count: 0,
            },
            {
                stat: 'Fish failed to catch',
                id: '#stat-fishing-fish-failed',
                count: 0,
            },
            {
                stat: 'Seconds spent fishing',
                id: '#stat-fishing-seconds-spent',
                count: 0,
            },
            {
                stat: 'fish sold',
                id: '#stat-fishing-fish-sold',
                count: 0,
            },
            {
                stat: 'GP earnt from fishing',
                id: '#stat-fishing-gp-earnt',
                count: 0,
            },
            {
                stat: 'Junk caught',
                id: '#stat-fishing-junk-caught',
                count: 0,
            },
            {
                stat: 'Special Items caught',
                id: '#stat-fishing-special-caught',
                count: 0,
            },
        ];
    },
    get statsCooking() {
        return [{
                stat: 'Food cooked',
                id: '#stat-cooking-food-cooked',
                count: 0,
            },
            {
                stat: 'Food burnt',
                id: '#stat-cooking-food-burnt',
                count: 0,
            },
            {
                stat: 'Seconds spent burning',
                id: '#stat-cooking-time-spent',
                count: 0,
            },
        ];
    },
    get statsMining() {
        return [{
                stat: 'Ores mined',
                id: '#stat-mining-ores-mined',
                count: 0,
            },
            {
                stat: 'Empty ores miend',
                id: '#stat-mining-empty-ore',
                count: 0,
            },
        ];
    },
    get statsSmithing() {
        return [{
                stat: 'Bars smithed',
                id: '#stat-smithing-bars-smelted',
                count: 0,
            },
            {
                stat: 'Items smelted',
                id: '#stat-smithing-items-smithed',
                count: 0,
            },
            {
                stat: 'Seconds spent smelting',
                id: '#stat-smithing-seconds-smelting',
                count: 0,
            },
            {
                stat: 'Seconds spend smithing',
                id: '#stat-smithing-seconds-smithing',
                count: 0,
            },
        ];
    },
    get statsCombat() {
        return [{
                stat: 'Monsters killed',
                id: '#stat-combat-monsters-killed',
                count: 0,
            },
            {
                stat: 'Damage Dealt',
                id: '#stat-combat-damage-dealt',
                count: 0,
            },
            {
                stat: 'Damage Taken',
                id: '#stat-combat-damage-taken',
                count: 0,
            },
            {
                stat: 'Attacks missed',
                id: '#stat-combat-attacks-missed',
                count: 0,
            },
            {
                stat: 'Deaths',
                id: '#stat-combat-deaths',
                count: 0,
            },
            {
                stat: 'Food Consumed',
                id: '#stat-combat-food-eaten',
                count: 0,
            },
            {
                stat: 'Health gained from food',
                id: '#stat-combat-health-from-food',
                count: 0,
            },
        ];
    },
    get statsThieving() {
        return [{
                stat: 'Total successful pickpockets',
                id: '#stat-thieving-successful-pickpockets',
                count: 0,
            },
            {
                stat: 'Total failed pickpockets',
                id: '#stat-thieving-failed-pickpockets',
                count: 0,
            },
            {
                stat: 'Damage taken from NPCs',
                id: '#stat-thieving-damage-taken',
                count: 0,
            },
            {
                stat: 'Seconds spent stunned',
                id: '#stat-thieving-time-stunned',
                count: 0,
            },
        ];
    },
    get statsFarming() {
        return [{
                stat: 'Total allotments harvested',
                id: '#stat-farming-allotments-harvested',
                count: 0,
            },
            {
                stat: 'Compost used',
                id: '#stat-farming-compost-used',
                count: 0,
            },
            {
                stat: 'Crops died due to intentional neglect',
                id: '#stat-farming-crops-died',
                count: 0,
            },
            {
                stat: 'Seconds spent waiting for crops to grow',
                id: '#stat-farming-time-spent',
                count: 0,
            },
            {
                stat: 'Seconds spent waiting for crops to die',
                id: '#stat-farming-time-spent-die',
                count: 0,
            },
            {
                stat: 'Weird Gloop Used',
                id: '#stat-farming-gloop-used',
                count: 0,
            },
        ];
    },
    get statsFletching() {
        return [{
                stat: 'Arrow Shafts created',
                id: '#stat-fletching-arrow-shafts',
                count: 0,
            },
            {
                stat: 'Items fletched',
                id: '#stat-fletching-items-fletched',
                count: 0,
            },
            {
                stat: 'Time spent fletching',
                id: '#stat-fletching-time-spent',
                count: 0,
            },
        ];
    },
    get statsCrafting() {
        return [{
                stat: 'Items crafted',
                id: '#stat-crafting-items-crafted',
                count: 0,
            },
            {
                stat: 'Time spent crafting',
                id: '#stat-crafting-time-spent',
                count: 0,
            },
        ];
    },
    get statsRunecrafting() {
        return [{
                stat: 'Items crafted',
                id: '#stat-runecrafting-items-crafted',
                count: 0,
            },
            {
                stat: 'Time spent crafting',
                id: '#stat-runecrafting-time-spent',
                count: 0,
            },
        ];
    },
    get statsHerblore() {
        return [{
                stat: 'Potions made',
                id: '#stat-herblore-potions-made',
                count: 0,
            },
            {
                stat: 'Time spent brewing',
                id: '#stat-herblore-time-spent',
                count: 0,
            },
            {
                stat: 'Potions used',
                id: '#stat-herblore-potions-used',
                count: 0,
            },
            {
                stat: 'Charges used',
                id: '#stat-herblore-charges-used',
                count: 0,
            },
        ];
    },
    get glovesTracker() {
        return [{
                name: 'Cooking',
                isActive: false,
                remainingActions: 0,
            },
            {
                name: 'Mining',
                isActive: false,
                remainingActions: 0,
            },
            {
                name: 'Smithing',
                isActive: false,
                remainingActions: 0,
            },
            {
                name: 'Thieving',
                isActive: false,
                remainingActions: 0,
            },
            {
                name: 'Gems',
                isActive: false,
                remainingActions: 0,
            },
        ];
    },
    get rockData() {
        return [];
    },
    get herbloreBonuses() {
        return {};
    },
    get tutorialTips() {
        const tipQty = 7;
        const tips = [];
        for (let i = 0; i < tipQty; i++) {
            tips.push({
                activated: false,
            });
        }
        return tips;
    },
    get shopItemsPurchased() {
        return new Map();
    },
    get SETTINGS() {
        return {
            bank: {
                bankBorder: 0,
                currentEquipDefault: true,
                defaultBankSort: 0,
                defaultItemTab: [],
            },
            mastery: {
                hideMaxLevel: false,
                confirmationCheckpoint: true,
            },
            general: {
                pushNotificationOffline: true,
                pushNotificationFarming: true,
                enabledOfflineCombat: false,
                enableNeutralSpecModifiers: false,
                autoReusePotion: [],
                miniSidebar: false,
                autoEquipFood: true,
                autoSwapFood: true,
                continueThievingOnStun: false,
                showPotionTier: [true, true, true, true],
                allowPerfectCook: true,
                showDestroyCropConfirmation: true,
                showAstrologyMaxRollConfirmation: true,
                showQtyInItemNotification: true,
                showItemPreservationNotification: true,
                showSlayerCoinNotification: true,
                combatMinibarShowEquipmentSets: true,
                combatMinibarShowEnemyBars: true,
            },
            notifications: {
                combatStunned: true,
                combatSleep: true,
                summoningMark: true,
            },
            performance: {
                disableDamageSplashes: false,
                disableProgressBars: false,
            },
            accessibility: {
                colourBlindMode: 0,
            },
        };
    },
    get monsterStats() {
        return [];
    },
    get petUnlocked() {
        return [];
    },
    get skillsUnlocked() {
        return [];
    },
    get skillXP() {
        return [0, 0, 0, 0, 0, 0, 0, 0, 0, 1155, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    },
    get dungeonCompleteCount() {
        return [];
    },
    get lockedItems() {
        return [];
    },
    get golbinRaidStats() {
        return [0, 0, 0, 0, 0, 0];
    },
    get chosenAgilityObstacles() {
        return [];
    },
    get agilityObstacleBuildCount() {
        return [];
    },
    get itemsAlreadyFound() {
        return [];
    },
    get saveStateBeforeRaid() {
        return [];
    },
    get newFarmingAreas() {
        return [{
                id: 0,
                areaName: 'Allotments',
                patches: [{
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: true,
                        gloop: false,
                        level: 1,
                        cost: 0,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 1,
                        cost: 500,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 1,
                        cost: 5000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 10,
                        cost: 15000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 20,
                        cost: 25000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 30,
                        cost: 40000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 40,
                        cost: 65000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 50,
                        cost: 80000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 60,
                        cost: 100000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 70,
                        cost: 120000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 80,
                        cost: 150000,
                    },
                    {
                        type: 'Allotment',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 90,
                        cost: 200000,
                    },
                ],
            },
            {
                id: 1,
                areaName: 'Herbs',
                patches: [{
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 5,
                        cost: 10000,
                    },
                    {
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 5,
                        cost: 20000,
                    },
                    {
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 15,
                        cost: 35000,
                    },
                    {
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 35,
                        cost: 50000,
                    },
                    {
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 45,
                        cost: 80000,
                    },
                    {
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 55,
                        cost: 100000,
                    },
                    {
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 65,
                        cost: 125000,
                    },
                    {
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 75,
                        cost: 150000,
                    },
                    {
                        type: 'Herb',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 85,
                        cost: 200000,
                    },
                ],
            },
            {
                id: 2,
                areaName: 'Trees',
                patches: [{
                        type: 'Tree',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 15,
                        cost: 50000,
                    },
                    {
                        type: 'Tree',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 30,
                        cost: 100000,
                    },
                    {
                        type: 'Tree',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 60,
                        cost: 250000,
                    },
                    {
                        type: 'Tree',
                        seedID: 0,
                        compost: 0,
                        timePlanted: 0,
                        setInterval: 0,
                        timeout: null,
                        hasGrown: false,
                        unlocked: false,
                        gloop: false,
                        level: 80,
                        cost: 400000,
                    },
                ],
            },
        ];
    },
    get MASTERY() {
        return {};
    },
    get golbinRaidHistory() {
        return [];
    },
    get itemStats() {
        return [];
    },
    get offline() {
        return {
            skill: null,
            action: null,
            timestamp: null,
        };
    },
    get titleNewsID() {
        return [];
    },
    get scheduledPushNotifications() {
        return {};
    },
    username: 'Insubordinate',
    gameUpdateNotification: 'Alpha v0.20',
    get summoningData() {
        return {
            MarksDiscovered: {},
            defaultRecipe: [],
        };
    },
    get skillLevel() {
        return [1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    },
    get nextLevelProgress() {
        return [];
    },
    version: saveFormat2Version,
    // Old Variables
    selectedEquipmentSet: 0,
    selectedSpell: 0,
    prayerPoints: 0,
    slayerCoins: 0,
    activeAurora: -1,
    get equippedFood() {
        return [{
                itemID: 0,
                qty: 0
            },
            {
                itemID: 0,
                qty: 0
            },
            {
                itemID: 0,
                qty: 0
            },
        ];
    },
    equipmentSets: [],
    get combatData() {
        return {
            enemy: {},
            player: {
                hitpoints: 100
            },
        };
    },
    get slayerTask() {
        return [];
    },
    get slayerTaskCompletion() {
        return [0, 0, 0, 0, 0];
    },
    get randomModifiers() {
        return {
            equipment: {},
            player: {}
        };
    },
    get selectedAttackStyle() {
        return [0, 3, 6];
    },
    get equippedItems() {
        return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    },
    ammo: 0,
    currentBankUpgrade: 1,
    get treeMasteryData() {
        return [];
    },
    currentAxe: 0,
    treeCutLimit: 0,
    bankMax: 0,
    get logsMastery() {
        return [];
    },
    get fishMastery() {
        return [];
    },
    currentRod: 0,
    get cookingMastery() {
        return [];
    },
    upgradedToRange: false,
    get miningOreMastery() {
        return [];
    },
    currentPickaxe: 0,
    get smithingMastery() {
        return [];
    },
    get thievingMastery() {
        return [];
    },
    get farmingMastery() {
        return [];
    },
    currentCookingFire: 0,
    get fletchingMastery() {
        return [];
    },
    get craftingMastery() {
        return [];
    },
    get runecraftingMastery() {
        return [];
    },
    get itemLog() {
        return [];
    },
    showSkillNav: false,
    get herbloreMastery() {
        return [];
    },
    currentAutoEat: 0,
    get equipmentSetsPurchased() {
        return [false, false];
    },
    showHPNotify: false,
    equipmentSwapPurchased: false,
    get godUpgrade() {
        return [false, false, false, false];
    },
    autoSlayerUnlocked: false,
    get killCount() {
        return [];
    },
    xmasPresents: 0,
    get serialData() {
        return new DataReader([]);
    },
    cookingStockpiles: [{
            itemID: -1,
            qty: 0
        },
        {
            itemID: -1,
            qty: 0
        },
        {
            itemID: -1,
            qty: 0
        },
    ],
    get activeAstrologyModifiers() {
        return [];
    },
    tutorialComplete: false,
    tutorialProgress: -1,
    get activeTasks() {
        return {};
    },
    get completedTasks() {
        return [];
    },
    get plantAllSelected() {
        return {};
    },
    christmas2021Progress: 0,
    christmas2021PresentProgress: [0, 0, 0, 0, 0],
    bankTabIcons: [],
    customMinibarItems: {},
};

function getSaveKeysFromDiff(diff) {
    const verArray = [];
    const keyArray = [];
    for (let i = 0; i <= saveFormat2Version; i++) {
        let verDiff = diff[i];
        if (verDiff === undefined)
            verDiff = {
                add: [],
                remove: [],
            };
        verDiff.remove.forEach((removeKey) => {
            const removeIndex = keyArray.indexOf(removeKey);
            if (removeIndex === -1)
                throw new Error(`Error processing diff, could not remove ${removeKey}`);
            keyArray.splice(removeIndex, 1);
        });
        keyArray.push(...verDiff.add);
        verArray.push([...keyArray]);
    }
    return verArray;
}

function testDiff(diff, vars, version) {
    const produced = getSaveKeysFromDiff(diff)[version];
    const actual = vars[version];
    if (actual.length !== produced.length)
        console.warn('Actual and produced have different lengths');
    actual.forEach((key, i) => {
        if (key !== produced[i])
            console.warn(`Actual key: ${key} is different at ${i}`);
    });
}
/** Variables that store a number */
const numberVars = getSaveKeysFromDiff(numberVarDiff);
/** Variables that store a boolean */
const boolVars = getSaveKeysFromDiff(boolVarDiff);
/** Variables with other types that are too mishapen or not fit for serialization */
const otherVars = getSaveKeysFromDiff(otherVarDiff);
/** Variables that are serializable */
const serialVars = getSaveKeysFromDiff(serialVarDiff);
/** Variables that are nested serializable */
const nestedVars = getSaveKeysFromDiff(nestedVarDiff);
const deserializeNumberArray = (sData, sVersion) => {
    return [...sData];
};
const deserializeRaidHistory = (sData, sVersion) => {
    const golbinRaidHistory = [];
    let equipLength = 16;
    if (sVersion < 1) {
        equipLength = 12;
    } else if (sVersion < 22) {
        equipLength = 14;
    }
    sData.forEach((subData) => {
        const nonInventoryDataLength = equipLength + (sVersion >= 12 ? 14 : 13);
        const inventory = [];
        // Start Retro-fix for bad inventory decoding
        let nullCount = 0;
        for (let i = subData.length - 1; i > 0; i--) {
            const data = subData[i];
            if (data === null)
                nullCount++;
            else
                break;
        }
        if (nullCount > 0) {
            subData.splice(-nullCount, nullCount);
            subData.splice(nonInventoryDataLength, nullCount);
        }
        // End retro fix
        for (let i = equipLength + nonInventoryDataLength; i < subData.length; i += 2) {
            inventory.push({
                id: subData[i],
                qty: subData[i + 1],
            });
        }
        const equipment = subData.slice(1, equipLength + 1);
        if (sVersion < 1) {
            equipment.push(0, 0);
        }
        let difficulty = RaidDifficulty.Medium;
        if (sVersion >= 12)
            difficulty = subData[equipLength + 13];
        golbinRaidHistory.push({
            skillLevels: subData.slice(equipLength + 5, equipLength + 11),
            equipment: equipment,
            ammo: subData[0],
            inventory: inventory,
            food: {
                itemID: subData[equipLength + 1],
                qty: subData[equipLength + 2]
            },
            wave: subData[equipLength + 12],
            kills: subData[equipLength + 3],
            timestamp: subData[equipLength + 11],
            raidCoinsEarned: subData[equipLength + 4],
            difficulty,
        });
    });
    return golbinRaidHistory;
};
const deserializeMastery = (sData, sVersion) => {
    const MASTERY = {};
    sData.forEach((subData) => {
        MASTERY[subData[0]] = {
            pool: subData[1],
            xp: subData.slice(2),
        };
    });
    return MASTERY;
};
const deserializeEquipment = (sData, sVersion) => {
    let numSlots = 14;
    const equipmentSets = [];
    switch (sVersion) {
        case 1:
            {
                for (let i = 0; i < sData.length; i += 17) {
                    equipmentSets.push({
                        equipment: [...sData.slice(i + 3, i + 3 + numSlots)],
                        ammo: sData[i],
                        summonAmmo: [sData[i + 1], sData[i + 2]],
                    });
                }
                break;
            }
        case 0:
            {
                numSlots = 12;
                for (let i = 0; i < sData.length; i += 13) {
                    equipmentSets.push({
                        equipment: [...sData.slice(i + 1, i + 1 + numSlots), 0, 0],
                        ammo: sData[i],
                        summonAmmo: [0, 0],
                    });
                }
                break;
            }
    }
    return equipmentSets;
};
const deserializeBoolArray = (sData, sVersion) => {
    return sData.map((val) => val === 1);
};
const deserializeMonsterStats = (sData, sVersion) => {
    const numStats = 10;
    const monsterStats = [];
    for (let i = 0; i < sData.length; i += numStats) {
        monsterStats.push({
            monsterID: i / numStats,
            stats: sData.slice(i, i + numStats),
        });
    }
    return monsterStats;
};
const itemStatTypes = [
    'all',
    'weapon',
    'quiver',
    'armour',
    'chests',
    'seeds',
    'harvest',
    'food',
    'rune',
];

function deserializeItemStatsPortion(portion, subData, stats, itemStatVer) {
    const statItems = [...portion.items];
    let hasRemoved = false;
    for (let i = itemStatVer; i < curItemStatVer; i++) {
        const removed = portion.removed[itemStatVer];
        if (removed !== undefined) {
            statItems.push(...removed);
            hasRemoved = true;
        }
    }
    if (hasRemoved)
        statItems.sort((a, b) => a - b);
    const numStats = portion.stats.length;
    for (let i = 0; i < subData.length; i += numStats) {
        const stat = stats[statItems[i / numStats]];
        portion.stats.forEach((statID, j) => {
            stat.stats[statID] = subData[i + j];
        });
    }
}
const curItemStatVer = 1;
const deserializeItemStats = (sData, sVersion, idMap) => {
    var _a, _b;
    const itemStats = idMap.itemStatsData.all.items.map((_, id) => {
        return {
            itemID: id,
            stats: Array(17).fill(0),
        };
    });
    const itemStatVer = (_b = (_a = sData[itemStatTypes.length]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : 0;
    itemStatTypes.forEach((type, i) => {
        deserializeItemStatsPortion(idMap.itemStatsData[type], sData[i], itemStats, itemStatVer);
    });
    return itemStats;
};
const deserializeSettings = (sData, sVersion) => {
    if (sVersion <= 3)
        return deserializeSettingsOld(sData, sVersion);
    const reader = new DataReader(sData);
    const settings = defaultSaveValues.SETTINGS;
    settings.bank.bankBorder = reader.getNumber();
    settings.bank.currentEquipDefault = reader.getBool();
    settings.bank.defaultBankSort = reader.getNumber();
    settings.mastery.hideMaxLevel = reader.getBool();
    settings.mastery.confirmationCheckpoint = reader.getBool();
    settings.general.pushNotificationOffline = reader.getBool();
    settings.general.pushNotificationFarming = reader.getBool();
    settings.notifications.combatStunned = reader.getBool();
    settings.notifications.combatSleep = reader.getBool();
    settings.notifications.summoningMark = reader.getBool();
    settings.performance.disableDamageSplashes = reader.getBool();
    settings.performance.disableProgressBars = reader.getBool();
    settings.general.enabledOfflineCombat = reader.getBool();
    settings.general.enableNeutralSpecModifiers = reader.getBool();
    settings.general.miniSidebar = reader.getBool();
    settings.general.autoEquipFood = reader.getBool();
    settings.general.autoSwapFood = reader.getBool();
    settings.general.continueThievingOnStun = reader.getBool();
    if (sVersion >= 5)
        settings.general.allowPerfectCook = reader.getBool();
    if (sVersion >= 11) {
        settings.general.showDestroyCropConfirmation = reader.getBool();
        settings.general.showAstrologyMaxRollConfirmation = reader.getBool();
        settings.general.showQtyInItemNotification = reader.getBool();
        settings.general.showItemPreservationNotification = reader.getBool();
        settings.general.showSlayerCoinNotification = reader.getBool();
    }
    if (sVersion >= 15) {
        settings.general.combatMinibarShowEquipmentSets = reader.getBool();
        settings.general.combatMinibarShowEnemyBars = reader.getBool();
    }
    settings.accessibility.colourBlindMode = reader.getNumber();
    settings.general.showPotionTier = reader.getBoolArray();
    settings.bank.defaultItemTab = deserializeDefaultItemTabs(reader.getVariableLengthChunk().getRawData(), sVersion);
    settings.general.autoReusePotion = reader.getVariableLengthChunk().getRawData();
    return settings;
};
const deserializeSettingsOld = (sData, sVersion) => {
    let numSettings = 14;
    if (sVersion < 3)
        numSettings = 12;
    if (sVersion < 2)
        numSettings = 7;
    const newSettings = {
        bank: {
            bankBorder: sData[0],
            currentEquipDefault: sData[1] === 1,
            defaultBankSort: sData[2],
            defaultItemTab: deserializeDefaultItemTabs(sData.slice(numSettings), sVersion),
        },
        mastery: {
            hideMaxLevel: sData[3] === 1,
            confirmationCheckpoint: sData[4] === 1,
        },
        general: {
            pushNotificationOffline: sData[5] === 1,
            pushNotificationFarming: sData[6] === 1,
            enabledOfflineCombat: sVersion < 3 ? false : sData[12] === 0,
            enableNeutralSpecModifiers: sVersion < 3 ? false : sData[13] === 0,
            autoReusePotion: [],
            miniSidebar: false,
            autoEquipFood: true,
            autoSwapFood: true,
            continueThievingOnStun: false,
            showPotionTier: [true, true, true, true],
            allowPerfectCook: true,
            showDestroyCropConfirmation: true,
            showAstrologyMaxRollConfirmation: true,
            showQtyInItemNotification: true,
            showItemPreservationNotification: true,
            showSlayerCoinNotification: true,
            combatMinibarShowEquipmentSets: true,
            combatMinibarShowEnemyBars: true,
        },
        notifications: {
            combatStunned: sVersion < 2 ? true : sData[7] === 1,
            combatSleep: sVersion < 2 ? true : sData[8] === 1,
            summoningMark: sVersion < 2 ? true : sData[9] === 1,
        },
        performance: {
            disableDamageSplashes: sVersion < 2 ? false : sData[10] === 1,
            disableProgressBars: sVersion < 2 ? false : sData[11] === 1,
        },
        accessibility: {
            colourBlindMode: 0,
        },
    };
    return newSettings;
};
const deserializeDefaultItemTabs = (sData, sVersion) => {
    let nullCount = 0;
    let lastNull = sData.length - 1;
    for (let i = sData.length - 1; i >= 0; i--) {
        if (sData[i] === null) {
            nullCount++;
            lastNull = i;
        }
    }
    if (nullCount !== 0) {
        sData = sData.slice(nullCount, lastNull);
    }
    const defaultItemTab = [];
    for (let i = 0; i < sData.length; i += 2) {
        defaultItemTab.push({
            itemID: sData[i],
            tab: sData[i + 1],
        });
    }
    return defaultItemTab;
};
const deserializeBank = (sData, sVersion) => {
    const bank = [];
    for (let i = 0; i < sData.length; i += 3) {
        const id = sData[i];
        const qty = sData[i + 1];
        const tab = sData[i + 2];
        bank.push({
            id: id,
            qty: qty,
            tab: tab,
            locked: false,
        });
    }
    return bank;
};

function getStatDeserializer(statVar) {
    const templateVar = JSON.stringify(statVar);
    return (sData, sVersion) => {
        const gameStat = JSON.parse(templateVar);
        sData.forEach((count, i) => {
            gameStat[i].count = count;
        });
        return gameStat;
    };
}
const deserializeStats = {
    general: getStatDeserializer(defaultSaveValues.statsGeneral),
    woodcutting: getStatDeserializer(defaultSaveValues.statsWoodcutting),
    firemaking: getStatDeserializer(defaultSaveValues.statsFiremaking),
    fishing: getStatDeserializer(defaultSaveValues.statsFishing),
    cooking: getStatDeserializer(defaultSaveValues.statsCooking),
    mining: getStatDeserializer(defaultSaveValues.statsMining),
    smithing: getStatDeserializer(defaultSaveValues.statsSmithing),
    combat: getStatDeserializer(defaultSaveValues.statsCombat),
    thieving: getStatDeserializer(defaultSaveValues.statsThieving),
    farming: getStatDeserializer(defaultSaveValues.statsFarming),
    fletching: getStatDeserializer(defaultSaveValues.statsFletching),
    crafting: getStatDeserializer(defaultSaveValues.statsCrafting),
    runecrafting: getStatDeserializer(defaultSaveValues.statsRunecrafting),
    herblore: getStatDeserializer(defaultSaveValues.statsHerblore),
};
const deserializeGlovesTracker = (sData, sVersion) => {
    const newGlovesTracker = [];
    for (let i = 0; i < sData.length; i += 2) {
        newGlovesTracker.push({
            isActive: sData[i] === 1,
            remainingActions: sData[i + 1],
        });
    }
    return newGlovesTracker;
};
const deserializeRockData = (sData, sVersion) => {
    const rockData = [];
    for (let i = 0; i < sData.length; i += 3) {
        rockData.push({
            maxHP: sData[i],
            damage: sData[i + 1],
            depleted: sData[i + 2] === 1,
            respawnTimer: null,
        });
    }
    return rockData;
};
const deserializeSlayerTask = (sData, sVersion) => {
    const slayerTask = [];
    for (let i = 0; i < sData.length; i += 4) {
        slayerTask.push({
            monsterID: sData[i],
            count: sData[i + 1],
            tier: sData[i + 2],
            extended: sData[i + 3] === 1,
        });
    }
    return slayerTask;
};
const deserializeFarmingAreas = (function() {
    return (sData, sVersion) => {
        const farmingAreas = [];
        sData.forEach((subData, j) => {
            farmingAreas.push({
                id: j,
                patches: [],
            });
            for (let i = 0; i < subData.length; i += 7) {
                const patch = {
                    seedID: 0,
                    compost: 0,
                    timePlanted: 0,
                    setInterval: 0,
                    hasGrown: false,
                    unlocked: false,
                    gloop: false,
                };
                farmingAreas[j].patches.push(patch);
                patch.seedID = subData[i];
                patch.compost = subData[i + 1];
                patch.timePlanted = subData[i + 2];
                patch.setInterval = subData[i + 3];
                patch.hasGrown = subData[i + 4] === 1;
                patch.unlocked = subData[i + 5] === 1;
                patch.gloop = subData[i + 6] === 1;
            }
        });
        return farmingAreas;
    };
})();
const deserializeHerbloreBonuses = (sData, sVersion) => {
    const herbloreBonuses = {};
    for (let i = 0; i < sData.length; i += 5) {
        let bonus1 = sData[i + 2];
        let bonus2 = sData[i + 3];
        if (bonus1 === -1)
            bonus1 = null;
        if (bonus2 === -1)
            bonus2 = null;
        herbloreBonuses[sData[i]] = {
            itemID: sData[i + 1],
            bonus: [bonus1, bonus2],
            charges: sData[i + 4],
        };
    }
    return herbloreBonuses;
};
const deserializeTutorialTips = (sData, sVersion) => {
    const newTips = [];
    sData.forEach((tipActive) => {
        newTips.push({
            activated: tipActive === 1
        });
    });
    return newTips;
};
const deserializeShopItems = (sData, sVersion) => {
    let shopCategories;
    if (sVersion <= 17) {
        shopCategories = [
            'General',
            'SkillUpgrades',
            'Slayer',
            'Gloves',
            'Skillcapes',
            'Materials',
            'GolbinRaid', // 6
        ];
    } else {
        shopCategories = [
            'General',
            'SkillUpgrades',
            'Slayer',
            'Gloves',
            'Skillcapes',
            'SuperiorSkillcapes',
            'GolbinRaid',
            'GolbinRaid',
            'Township', // 8 - This would always be township
        ];
    }
    const shopItemsPurchased = new Map();
    for (let i = 0; i < sData.length; i += 3) {
        const catID = sData[i];
        const id = sData[i + 1];
        const quantity = sData[i + 2];
        let category = shopCategories[catID];
        if (sVersion > 17 && catID === 7 && id > 13)
            category = 'Township'; // Special fix for bad shop saving
        const combinedID = `${category}:${id}`;
        const existingPurchase = shopItemsPurchased.get(combinedID);
        if (existingPurchase !== undefined)
            existingPurchase.quantity += quantity;
        else
            shopItemsPurchased.set(`${category}:${id}`, {
                category,
                id,
                quantity,
            });
    }
    return shopItemsPurchased;
};
const deserializeCombatData = (sData, sVersion) => {
    return {
        player: {
            hitpoints: sData[0],
        },
    };
};
const deserializeFood = (sData, sVersion) => {
    const newEquippedFood = [];
    for (let i = 0; i < sData.length; i += 2) {
        newEquippedFood.push({
            itemID: sData[i],
            qty: sData[i + 1],
        });
    }
    return newEquippedFood;
};
/** Decodes and decompresses a save string */
function decompressSaveString(saveString) {
    const toUnpack = atob(saveString);
    let raw;
    try {
        raw = fflate.strFromU8(fflate.gunzipSync(fflate.strToU8(toUnpack, true)), true);
    } catch (_a) {
        raw = toUnpack;
    }
    return JSON.parse(raw);
}
/** Gets a savegame object from a save string */
function getSaveFromString(saveString, idMap) {
    var _a, _b, _c, _d, _e;
    let saveGame = {};
    const packed = decompressSaveString(saveString);
    let oldFormat = false;
    let saveVersion = 1;
    if (!('v' in packed)) {
        saveGame = packed;
        oldFormat = true;
        saveVersion = -1;
        if (saveGame.SETTINGS === undefined) {
            saveGame.SETTINGS = defaultSaveValues.SETTINGS;
        } else {
            saveGame.SETTINGS = updatePartialSettings(saveGame.SETTINGS);
        }
        // Attempt to upgrade very old save strings
        allVars.forEach((varKey) => {
            if (saveGame[varKey] === undefined)
                setSaveKeyToDefault(saveGame, varKey);
        });
    } else {
        const serializedData = packed.s;
        const nestedSerializedData = packed.ns;
        const numberData = packed.n;
        const boolData = packed.b;
        const otherData = packed.o;
        saveVersion = packed.v;
        // Set Number Vars
        numberData.forEach((value, i) => {
            saveGame[numberVars[saveVersion][i]] = value;
        });
        // Set Bool Vars
        boolData.forEach((value, i) => {
            saveGame[boolVars[saveVersion][i]] = value === 1;
        });
        // Deserialize vars
        serialVars[saveVersion].forEach((key, i) => {
            const args = [serializedData[i], saveVersion];
            switch (key) {
                case 'bank':
                    saveGame[key] = deserializeBank(...args);
                    break;
                case 'statsGeneral':
                    saveGame[key] = deserializeStats.general(...args);
                    break;
                case 'statsWoodcutting':
                    saveGame[key] = deserializeStats.woodcutting(...args);
                    break;
                case 'statsFiremaking':
                    saveGame[key] = deserializeStats.firemaking(...args);
                    break;
                case 'statsFishing':
                    saveGame[key] = deserializeStats.fishing(...args);
                    break;
                case 'statsCooking':
                    saveGame[key] = deserializeStats.cooking(...args);
                    break;
                case 'statsMining':
                    saveGame[key] = deserializeStats.mining(...args);
                    break;
                case 'statsSmithing':
                    saveGame[key] = deserializeStats.smithing(...args);
                    break;
                case 'statsCombat':
                    saveGame[key] = deserializeStats.combat(...args);
                    break;
                case 'statsThieving':
                    saveGame[key] = deserializeStats.thieving(...args);
                    break;
                case 'statsFarming':
                    saveGame[key] = deserializeStats.farming(...args);
                    break;
                case 'statsFletching':
                    saveGame[key] = deserializeStats.fletching(...args);
                    break;
                case 'statsCrafting':
                    saveGame[key] = deserializeStats.crafting(...args);
                    break;
                case 'statsRunecrafting':
                    saveGame[key] = deserializeStats.runecrafting(...args);
                    break;
                case 'statsHerblore':
                    saveGame[key] = deserializeStats.herblore(...args);
                    break;
                case 'glovesTracker':
                    saveGame[key] = deserializeGlovesTracker(...args);
                    break;
                case 'rockData':
                    saveGame[key] = deserializeRockData(...args);
                    break;
                case 'herbloreBonuses':
                    saveGame[key] = deserializeHerbloreBonuses(...args);
                    break;
                case 'tutorialTips':
                    saveGame[key] = deserializeTutorialTips(...args);
                    break;
                case 'shopItemsPurchased':
                    saveGame[key] = deserializeShopItems(...args);
                    break;
                case 'combatData':
                    saveGame[key] = deserializeCombatData(...args);
                    break;
                case 'equippedFood':
                    saveGame[key] = deserializeFood(...args);
                    break;
                case 'SETTINGS':
                    saveGame[key] = deserializeSettings(...args);
                    break;
                case 'monsterStats':
                    saveGame[key] = deserializeMonsterStats(...args);
                    break;
                case 'skillsUnlocked':
                case 'petUnlocked':
                    saveGame[key] = deserializeBoolArray(...args);
                    break;
                case 'equipmentSets':
                    saveGame[key] = deserializeEquipment(...args);
                    break;
                case 'skillXP':
                case 'dungeonCompleteCount':
                case 'selectedAttackStyle':
                case 'lockedItems':
                case 'golbinRaidStats':
                case 'slayerTaskCompletion':
                case 'chosenAgilityObstacles':
                case 'agilityObstacleBuildCount':
                case 'itemsAlreadyFound':
                case 'saveStateBeforeRaid':
                    saveGame[key] = deserializeNumberArray(...args);
                    break;
                case 'slayerTask':
                    saveGame[key] = deserializeSlayerTask(...args);
                    break;
                default:
                    throw new Error(`Error loading save: Invalid variable for deserialization: ${key}`);
            }
        });
        // Deserialize nested vars
        nestedVars[saveVersion].forEach((key, i) => {
            const args = [nestedSerializedData[i], saveVersion];
            switch (key) {
                case 'newFarmingAreas':
                    saveGame[key] = deserializeFarmingAreas(...args);
                    break;
                case 'MASTERY':
                    saveGame[key] = deserializeMastery(...args);
                    break;
                case 'golbinRaidHistory':
                    saveGame[key] = deserializeRaidHistory(...args);
                    break;
                case 'itemStats':
                    saveGame[key] = deserializeItemStats(...args, idMap);
                    break;
                default:
                    throw new Error(`Error loading save: Invalid variable for nested deserialization: ${key}`);
            }
        });
        // Deserialize other vars
        otherVars[saveVersion].forEach((key, i) => {
            saveGame[key] = JSON.parse(otherData[i]);
        });
        constructRedundantVars(saveGame, saveVersion);
        if (saveVersion > 1)
            saveGame.serialData = new DataReader(packed.cd);
        // Add all the variables that were added to the save
        for (let i = saveVersion + 1; i <= saveFormat2Version; i++) {
            (_a = numberVarDiff[i]) === null || _a === void 0 ? void 0 : _a.add.forEach((key) => {
                setSaveKeyToDefault(saveGame, key);
            });
            (_b = boolVarDiff[i]) === null || _b === void 0 ? void 0 : _b.add.forEach((key) => {
                setSaveKeyToDefault(saveGame, key);
            });
            (_c = otherVarDiff[i]) === null || _c === void 0 ? void 0 : _c.add.forEach((key) => {
                setSaveKeyToDefault(saveGame, key);
            });
            (_d = serialVarDiff[i]) === null || _d === void 0 ? void 0 : _d.add.forEach((key) => {
                setSaveKeyToDefault(saveGame, key);
            });
            (_e = nestedVarDiff[i]) === null || _e === void 0 ? void 0 : _e.add.forEach((key) => {
                setSaveKeyToDefault(saveGame, key);
            });
        }
    }
    saveGame.version = saveVersion;
    return {
        saveGame: saveGame,
        oldFormat: oldFormat
    };
}

function setSaveKeyToDefault(saveGame, key) {
    saveGame[key] = defaultSaveValues[key];
}
/** Converts herblore bonuses from array */
function convertHerbloreBonusesFromArray(herbloreBonuses) {
    const newBonuses = {};
    herbloreBonuses.forEach((bonus, pageID) => {
        if (bonus !== null && bonus !== undefined)
            newBonuses[pageID] = bonus;
    });
    return newBonuses;
}
/** Reconstructs variables that did not need to be saved (and performs some post processing for others) */
function constructRedundantVars(saveGame, saveVersion) {
    var _a;
    saveGame.skillLevel = saveGame.skillXP.map((xp) => Math.max(Math.min(exp.xpToLevel(xp) - 1, 120), 1));
    saveGame.nextLevelProgress = (_a = saveGame.skillXP) === null || _a === void 0 ? void 0 : _a.map((xp, skill) => {
        //Check amount of XP required for current level and next level
        const currentLevelXP = exp.levelToXP(saveGame.skillLevel[skill]);
        const nextLevelXP = exp.levelToXP(saveGame.skillLevel[skill] + 1);
        //Figure out next level progress percentage
        let progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        progress = Math.min(progress, 100);
        // Cap at 100%
        return progress;
    });
    if (saveGame.equipmentSets !== undefined && saveGame.selectedEquipmentSet !== undefined) {
        saveGame.equippedItems = saveGame.equipmentSets[saveGame.selectedEquipmentSet].equipment;
        saveGame.ammo = saveGame.equipmentSets[saveGame.selectedEquipmentSet].ammo;
    }
    saveGame.bank.forEach((bankItem) => {
        bankItem.locked = saveGame.lockedItems.includes(bankItem.id);
    });
}
class DataReader {
    constructor(data) {
        this.data = data;
        this.dataIndex = 0;
    }
    get dataLength() {
        return this.data.length;
    }
    /** If the reader is at the end of the data */
    get atEnd() {
        return this.dataLength === this.dataIndex;
    }
    getBool() {
        return this.nextValue() === 1;
    }
    getNumber() {
        let value = this.nextValue();
        if (value === null)
            value = Infinity;
        return value;
    }
    nextValue() {
        const value = this.data[this.dataIndex];
        this.dataIndex++;
        return value;
    }
    skipValue() {
        this.dataIndex++;
    }
    skipValues(count) {
        this.dataIndex += count;
    }
    getChunk(length) {
        const chunk = this.data.slice(this.dataIndex, this.dataIndex + length);
        this.dataIndex += length;
        return chunk;
    }
    getVariableLengthChunk() {
        const dataLength = this.nextValue();
        return new DataReader(this.getChunk(dataLength));
    }
    skipVariableLengthChunk() {
        const dataLength = this.nextValue();
        this.dataIndex += dataLength;
    }
    getBoolArray() {
        const dataLength = this.nextValue();
        return this.getChunk(dataLength).map((val) => val === 1);
    }
    getActionType() {
        return this.nextValue() === 1 ? 'Attack' : 'Nothing';
    }
    getAttack(game, idMap) {
        return game.specialAttacks.getObjectByID(idMap.attacks[this.nextValue()]);
    }
    getLocation(game, idMap) {
        switch (this.getNumber() - 1) {
            case CombatAreaType.Combat:
                {
                    const areaID = this.getNumber();
                    if (areaID === -1) {
                        return game.unknownCombatArea;
                    } else {
                        return game.combatAreas.getObjectByID(idMap.combatAreas[areaID]);
                    }
                }
            case CombatAreaType.Dungeon:
                {
                    return game.dungeons.getObjectByID(idMap.dungeons[this.getNumber()]);
                }
            case CombatAreaType.Slayer:
                {
                    return game.slayerAreas.getObjectByID(idMap.slayerAreas[this.getNumber()]);
                }
            default:
                throw new Error(`Error deserializing data, invalid location type.`);
        }
    }
    getRandomAttackType() {
        return AttackTypeID[this.getNumber()];
    }
    getMonsterAttackType() {
        return AttackTypeID[this.getNumber()];
    }
    getString() {
        const strLength = this.getNumber();
        return String.fromCharCode(...this.getChunk(strLength));
    }
    getCombatModifierArray() {
        const modifiers = [];
        const numMods = this.getNumber();
        for (let i = 0; i < numMods; i++) {
            const key = ModifierID[this.getNumber()];
            const value = this.getNumber();
            const modValue = ModifierValue.fromKeySafe(key, value, game);
            if (modValue !== undefined)
                modifiers.push(modValue);
        }
        return modifiers;
    }
    getModifierArray(game, idMap) {
        const modArray = [];
        const numModifiers = this.getNumber();
        for (let i = 0; i < numModifiers; i++) {
            const key = ModifierID[this.getNumber()];
            if (Modifier.OLD_SKILL_MODIFIER_KEYS.includes(key)) {
                const values = [];
                const numSkills = this.getNumber();
                for (let j = 0; j < numSkills; j++) {
                    const skill = game.skills.getObjectByID(idMap.skills[this.getNumber()]);
                    const value = this.getNumber();
                    if (skill !== undefined)
                        values.push({
                            skill,
                            value,
                        });
                }
                modArray.push(...ModifierValue.fromSkillKeyValues(key, values, game));
            } else {
                const value = this.getNumber();
                const modValue = ModifierValue.fromKeySafe(key, value, game);
                if (modValue !== undefined)
                    modArray.push(modValue);
            }
        }
        return modArray;
    }
    getTownshipBuildingDataMap(game, idMap) {
        const data = new Map();
        const size = this.getNumber();
        for (let i = 0; i < size; i++) {
            const building = game.township.buildings.getObjectByID(idMap.townshipBuildings[i]);
            const count = this.getNumber();
            if (building === undefined)
                throw new Error('Error Building is not registered.');
            if (count > 0)
                data.set(building, count);
        }
        return data;
    }
    getAstrologyModifierArray(game, idMap) {
        const modArray = [];
        const numModifiers = this.getNumber();
        for (let i = 0; i < numModifiers; i++) {
            modArray.push(this.getModifierArray(game, idMap));
        }
        return modArray;
    }
    getRaidSelectionArray() {
        const items = [];
        const numItems = this.getNumber();
        for (let i = 0; i < numItems; i++) {
            items.push({
                itemID: this.getNumber(),
                quantity: this.getNumber(),
                isAlt: this.getBool(),
            });
        }
        return items;
    }
    getItemQuantities() {
        const quantities = [];
        const numItems = this.getNumber();
        for (let i = 0; i < numItems; i++) {
            quantities.push({
                id: this.getNumber(),
                qty: this.getNumber(),
            });
        }
        return quantities;
    }
    getRawData() {
        return this.data;
    }
}
var DotTypeIDs;
(function(DotTypeIDs) {
    DotTypeIDs[DotTypeIDs["Burn"] = 0] = "Burn";
    DotTypeIDs[DotTypeIDs["Bleed"] = 1] = "Bleed";
    DotTypeIDs[DotTypeIDs["Poison"] = 2] = "Poison";
    DotTypeIDs[DotTypeIDs["Regen"] = 3] = "Regen";
    DotTypeIDs[DotTypeIDs["DeadlyPoison"] = 4] = "DeadlyPoison";
    DotTypeIDs[DotTypeIDs["BarrierBleed"] = 5] = "BarrierBleed";
    DotTypeIDs[DotTypeIDs["BarrierBurn"] = 6] = "BarrierBurn";
})(DotTypeIDs || (DotTypeIDs = {}));
var AttackTypeID;
(function(AttackTypeID) {
    AttackTypeID[AttackTypeID["melee"] = 0] = "melee";
    AttackTypeID[AttackTypeID["ranged"] = 1] = "ranged";
    AttackTypeID[AttackTypeID["magic"] = 2] = "magic";
    AttackTypeID[AttackTypeID["unset"] = 3] = "unset";
    AttackTypeID[AttackTypeID["random"] = 4] = "random";
})(AttackTypeID || (AttackTypeID = {}));

function updateSavePre110(savegame) {
    var _a;
    //UPDATE SAVE TO ALPHA V0.05
    //Changed variables - skillLevel, skillXP, nextLevelProgress
    if (savegame.skillLevel.length < 18 || savegame.skillXP.length < 18 || savegame.nextLevelProgress.length < 18) {
        console.log('Updating save game to Alpha v0.05...');
        //Update skillLevel
        while (savegame.skillLevel.length < 18) {
            savegame.skillLevel.push(1);
        }
        //Set hitpoints level to 10
        savegame.skillLevel[9] = 10;
        //Update skillXP
        while (savegame.skillXP.length < 18) {
            savegame.skillXP.push(0);
        }
        //Set hitpoints XP to 969
        savegame.skillXP[9] = 1155;
        //Update nextLevelProgress
        while (savegame.nextLevelProgress.length < 18) {
            savegame.nextLevelProgress.push(0);
        }
        console.log('Save game update successful...');
    }
    //UPDATE MASTERY LENGTHS TO ACCOMODATE FOR NEW MASTERIES
    //SMITHING
    if (savegame.smithingMastery !== undefined) {
        while (savegame.smithingMastery.length < 9) {
            savegame.smithingMastery.push({
                mastery: 1,
                masteryXP: 0
            });
            console.log('Smithing Mastery +1');
        }
    }
    //UPDATE TO V0.07
    //update equip items array
    if (savegame.equippedItems !== undefined) {
        while (savegame.equippedItems.length < 11) {
            savegame.equippedItems.push(0);
            console.log('Updated Equip Array');
        }
        //provide shop gloves to inventory
        const gloveID = [
            335 /* OldItemIDs.Cooking_Gloves */ ,
            336 /* OldItemIDs.Mining_Gloves */ ,
            337 /* OldItemIDs.Smithing_Gloves */ ,
            338 /* OldItemIDs.Thieving_Gloves */ ,
            339 /* OldItemIDs.Gem_Gloves */ ,
        ];
        for (let i = 0; i < savegame.glovesTracker.length; i++) {
            if (savegame.glovesTracker[i].isActive) {
                const itemID = gloveID[i];
                const foundItem = savegame.bank.some((bankItem) => bankItem.id);
                if (!foundItem && savegame.equippedItems[OldEquipmentSlotIDs.Gloves] !== itemID) {
                    savegame.bank.push({
                        id: gloveID[i],
                        qty: 1,
                        tab: 0,
                        locked: false,
                    });
                }
            }
        }
    }
    //refund range
    if (savegame.upgradedToRange) {
        savegame.upgradedToRange = false;
        savegame.gp += 500000;
        console.log('Cooking Range refunded for 500K');
    }
    if (savegame.glovesTracker.length < 5)
        savegame.glovesTracker.push({
            isActive: false,
            remainingActions: 0
        });
    //update everyones bank and refund excess gp
    if (savegame.myBankVersion < 2 && savegame.currentBankUpgrade !== undefined) {
        console.log('Updating bank slots to new formula');
        let totalGP = 0;
        let newGP = 0;
        for (let i = 0; i < savegame.currentBankUpgrade; i++)
            totalGP += bankUpgradeCost.level_to_gp(i);
        for (let i = 0; i < savegame.currentBankUpgrade; i++)
            newGP += newBankUpgradeCost.level_to_gp(i);
        savegame.gp += totalGP - newGP;
        savegame.myBankVersion++;
        console.log(formatNumber(totalGP - newGP) + ' GP refunded for bank slot adjustment');
    }
    if (savegame.myBankVersion < 4 && savegame.currentBankUpgrade !== undefined) {
        console.log('Updating bank slots to new new formula');
        let totalGP = 0;
        let newGP = 0;
        for (let i = 0; i < savegame.currentBankUpgrade; i++) {
            totalGP += newBankUpgradeCost.level_to_gp(i);
            newGP += newNewBankUpgradeCost.level_to_gp(i);
        }
        if (totalGP > newGP) {
            savegame.gp += totalGP - newGP;
            console.log(formatNumber(totalGP - newGP) + ' GP refunded for bank slot adjustment');
        } else
            console.log('No refund required for new bankslot formula');
        savegame.myBankVersion = 4;
    }
    //gp fix
    savegame.gp = Math.floor(savegame.gp);
    //item log update
    if (savegame.combatData !== undefined)
        savegame.combatData.player.hitpoints *= 10;
    //stats
    let found = 0;
    const itemStats = [];
    const qtyMap = new Map();
    let maxItemID = 0;
    savegame.bank.forEach((bankItem) => {
        qtyMap.set(bankItem.id, bankItem.qty);
        maxItemID = Math.max(maxItemID, bankItem.id);
    });
    for (let id = 0; id < maxItemID; id++) {
        found = (_a = qtyMap.get(id)) !== null && _a !== void 0 ? _a : 0;
        itemStats.push({
            itemID: id,
            stats: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        });
        itemStats[id].stats[ItemStats.TimesFound] += found;
    }
    savegame.itemStats = itemStats;
    const monsterStats = [];
    if (savegame.killCount !== undefined) {
        for (let i = 0; i < savegame.killCount.length; i++) {
            monsterStats.push({
                monsterID: i,
                stats: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            });
            monsterStats[i].stats[MonsterStats.KilledByPlayer] += savegame.killCount[i];
        }
    }
    savegame.monsterStats = monsterStats;
    savegame.accountGameVersion = 110;
}

function updateSavePre121(savegame) {
    if (savegame.equipmentSets === undefined)
        savegame.equipmentSets = [];
    if (savegame.equippedItems !== undefined && savegame.ammo !== undefined) {
        for (let i = savegame.equipmentSets.length; i < 3; i++) {
            if (i === 0)
                savegame.equipmentSets.push({
                    equipment: savegame.equippedItems,
                    ammo: savegame.ammo,
                    summonAmmo: [0, 0],
                });
            else
                savegame.equipmentSets.push({
                    equipment: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    ammo: 0,
                    summonAmmo: [0, 0],
                });
        }
    }
    savegame.accountGameVersion = 121;
}

function cleanSaveGame(savegame) {
    var _a;
    savegame.bank.forEach((bankItem) => {
        if (bankItem.tab === undefined)
            bankItem.tab = 0;
    });
    if (savegame.equippedItems !== undefined) {
        for (let i = savegame.equippedItems.length; i < 14; i++)
            savegame.equippedItems.push(0);
    }
    if (savegame.equipmentSets !== undefined) {
        for (let i = 0; i < savegame.equipmentSets.length; i++) {
            if (savegame.equipmentSets[i].equipment.length < 14) {
                for (let j = savegame.equipmentSets[i].equipment.length; j < 14; j++)
                    savegame.equipmentSets[i].equipment.push(0);
            }
            if (savegame.equipmentSets[i].summonAmmo === undefined)
                savegame.equipmentSets[i].summonAmmo = [0, 0];
        }
    }
    //v0.14.1
    //fishing stats
    if (savegame.statsFishing !== undefined && savegame.statsFishing.length !== 7) {
        savegame.statsFishing.push({
            stat: 'Junk caught',
            id: '#stat-fishing-junk-caught',
            count: 0,
        }, {
            stat: 'Special Items caught',
            id: '#stat-fishing-special-caught',
            count: 0,
        });
    }
    // gloop stats
    if (savegame.statsFarming !== undefined &&
        savegame.statsFarming[5] === undefined &&
        savegame.itemStats !== undefined &&
        !isOldItemStats(savegame.itemStats)) {
        const gloopStats = savegame.itemStats[679 /* OldItemIDs.Weird_Gloop */ ];
        let count = 0;
        if (gloopStats !== undefined) {
            count = gloopStats.stats[ItemStats.TimesFound] - gloopStats.stats[ItemStats.TimesSold];
        }
        const gloopInBank = savegame.bank.find((bankItem) => bankItem.id === 679 /* OldItemIDs.Weird_Gloop */ );
        if (gloopInBank !== undefined)
            count -= gloopInBank.qty;
        savegame.statsFarming.push({
            stat: 'Weird Gloop Used',
            id: '#stat-farming-gloop-used',
            count: count,
        });
    }
    //v0.18 -> v0.19
    if (Array.isArray(savegame.shopItemsPurchased)) {
        // This validation is now done in convertOldFormatSave
        const oldPurchases = savegame.shopItemsPurchased;
        const shopMap = new Map();
        oldPurchases.forEach((upgrade) => {
            const cat = upgrade[0];
            const id = upgrade[1];
            const key = `${cat}:${id}`;
            let owned = shopMap.get(key);
            if (owned === undefined) {
                owned = {
                    category: cat,
                    id: id,
                    quantity: 0,
                };
                shopMap.set(key, owned);
            }
            owned.quantity++;
        });
        savegame.shopItemsPurchased = shopMap;
    }
    if (!(savegame.shopItemsPurchased instanceof Map))
        savegame.shopItemsPurchased = defaultSaveValues.shopItemsPurchased;
    const addPurchase = (cat, id, qty = 1) => {
        const key = `${cat}:${id}`;
        let owned = savegame.shopItemsPurchased.get(key);
        if (owned === undefined) {
            owned = {
                category: cat,
                id: id,
                quantity: 0,
            };
            savegame.shopItemsPurchased.set(key, owned);
        }
        owned.quantity += qty;
    };
    if (savegame.autoSlayerUnlocked) {
        addPurchase('Slayer', 0);
    }
    if (savegame.bankMax !== undefined && savegame.bankMax > 0)
        addPurchase('General', 0, savegame.bankMax);
    if (savegame.currentAxe !== undefined) {
        for (let i = 0; i < savegame.currentAxe; i++) {
            addPurchase('SkillUpgrades', 0 /* OldSkillShopPurchaseIDs.Iron_Axe */ + i);
        }
    }
    if (savegame.currentRod !== undefined) {
        for (let i = 0; i < savegame.currentRod; i++) {
            addPurchase('SkillUpgrades', 7 /* OldSkillShopPurchaseIDs.Iron_Fishing_Rod */ + i);
        }
    }
    if (savegame.currentPickaxe !== undefined) {
        for (let i = 0; i < savegame.currentPickaxe; i++) {
            addPurchase('SkillUpgrades', 14 /* OldSkillShopPurchaseIDs.Iron_Pickaxe */ + i);
        }
    }
    if (savegame.currentCookingFire !== undefined) {
        for (let i = 0; i < savegame.currentCookingFire; i++) {
            addPurchase('SkillUpgrades', 21 /* OldSkillShopPurchaseIDs.Normal_Cooking_Fire */ + i);
        }
    }
    if (savegame.equipmentSetsPurchased !== undefined) {
        if (savegame.equipmentSetsPurchased[0]) {
            addPurchase('General', 4 /* OldGeneralShopPurchaseIDs.Extra_Equipment_Set_I */ );
        }
        if (savegame.equipmentSetsPurchased[1]) {
            addPurchase('General', 5 /* OldGeneralShopPurchaseIDs.Extra_Equipment_Set_II */ );
        }
    }
    if (savegame.godUpgrade !== undefined) {
        if (savegame.godUpgrade[0]) {
            addPurchase('SkillUpgrades', 30 /* OldSkillShopPurchaseIDs.Perpetual_Haste */ );
        }
        if (savegame.godUpgrade[1]) {
            addPurchase('SkillUpgrades', 31 /* OldSkillShopPurchaseIDs.Expanded_Knowledge */ );
        }
        if (savegame.godUpgrade[2]) {
            addPurchase('SkillUpgrades', 32 /* OldSkillShopPurchaseIDs.Master_of_Nature */ );
        }
        if (savegame.godUpgrade[3]) {
            addPurchase('SkillUpgrades', 33 /* OldSkillShopPurchaseIDs.Art_of_Control */ );
        }
    }
    if (savegame.equipmentSwapPurchased) {
        addPurchase('General', 6 /* OldGeneralShopPurchaseIDs.Dungeon_Equipment_Swapping */ );
    }
    if (savegame.currentAutoEat !== undefined) {
        if (savegame.currentAutoEat >= 3) {
            addPurchase('General', 3 /* OldGeneralShopPurchaseIDs.Auto_Eat_Tier_III */ );
        }
        if (savegame.currentAutoEat >= 2) {
            addPurchase('General', 2 /* OldGeneralShopPurchaseIDs.Auto_Eat_Tier_II */ );
        }
        if (savegame.currentAutoEat >= 1) {
            addPurchase('General', 1 /* OldGeneralShopPurchaseIDs.Auto_Eat_Tier_I */ );
        }
    }
    if (((_a = savegame.treeCutLimit) !== null && _a !== void 0 ? _a : 0) > 1) {
        addPurchase('General', 7 /* OldGeneralShopPurchaseIDs.Multi_Tree */ );
    }
    if (Array.isArray(savegame.herbloreBonuses)) {
        savegame.herbloreBonuses = convertHerbloreBonusesFromArray(savegame.herbloreBonuses);
    }
    if (savegame.saveStateBeforeRaid !== undefined && savegame.saveStateBeforeRaid.length > 0) {
        if (savegame.combatData !== undefined)
            savegame.combatData.player.hitpoints = savegame.saveStateBeforeRaid[0];
        savegame.selectedEquipmentSet = savegame.saveStateBeforeRaid[1];
        savegame.currentCombatFood = savegame.saveStateBeforeRaid[2];
    }
    if (savegame.skillXP !== undefined && savegame.skillLevel !== undefined) {
        savegame.skillXP.forEach((xp, skillID) => {
            if (xp === null)
                savegame.skillXP[skillID] = exp.levelToXP(savegame.skillLevel[skillID] + 1);
        });
    }
}
/** Converts a savegame's old mastery to new mastery */
function convertOldMastery(savegame) {
    function convertToNewMastery(old) {
        return {
            pool: 0,
            xp: old.map(({
                mastery
            }) => {
                const level = Math.min(99, mastery + 1);
                return exp.levelToXP(level) + 1;
            }),
        };
    }
    if (savegame.fishMastery !== undefined)
        savegame.MASTERY[1 /* OldSkillsIDs.Fishing */ ] = convertToNewMastery(savegame.fishMastery);
    if (savegame.logsMastery !== undefined)
        savegame.MASTERY[2 /* OldSkillsIDs.Firemaking */ ] = convertToNewMastery(savegame.logsMastery);
    if (savegame.cookingMastery !== undefined)
        savegame.MASTERY[3 /* OldSkillsIDs.Cooking */ ] = convertToNewMastery(savegame.cookingMastery);
    if (savegame.miningOreMastery !== undefined)
        savegame.MASTERY[4 /* OldSkillsIDs.Mining */ ] = convertToNewMastery(savegame.miningOreMastery);
    if (savegame.smithingMastery !== undefined)
        savegame.MASTERY[5 /* OldSkillsIDs.Smithing */ ] = convertToNewMastery(savegame.smithingMastery);
    if (savegame.farmingMastery !== undefined)
        savegame.MASTERY[11 /* OldSkillsIDs.Farming */ ] = convertToNewMastery(savegame.farmingMastery);
    if (savegame.fletchingMastery !== undefined)
        savegame.MASTERY[13 /* OldSkillsIDs.Fletching */ ] = convertToNewMastery(savegame.fletchingMastery);
    if (savegame.craftingMastery !== undefined)
        savegame.MASTERY[14 /* OldSkillsIDs.Crafting */ ] = convertToNewMastery(savegame.craftingMastery);
    if (savegame.runecraftingMastery !== undefined)
        savegame.MASTERY[15 /* OldSkillsIDs.Runecrafting */ ] = convertToNewMastery(savegame.runecraftingMastery);
    if (savegame.herbloreMastery !== undefined)
        savegame.MASTERY[19 /* OldSkillsIDs.Herblore */ ] = convertToNewMastery(savegame.herbloreMastery);
    if (savegame.treeMasteryData !== undefined)
        savegame.MASTERY[0 /* OldSkillsIDs.Woodcutting */ ] = convertToNewMastery(savegame.treeMasteryData);
    if (savegame.thievingMastery !== undefined)
        savegame.MASTERY[10 /* OldSkillsIDs.Thieving */ ] = convertToNewMastery(savegame.thievingMastery);
}
//# sourceMappingURL=serializeSave.js.map
checkFileVersion('?12097')