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
class Game extends GameEventEmitter {
    constructor() {
        super();
        this.loopInterval = -1;
        this.loopStarted = false;
        this.disableClearOffline = false;
        this.previousTickTime = performance.now();
        this.enableRendering = true;
        this.MAX_PROCESS_TICKS = 20 * 60 * 60 * 24;
        this.registeredNamespaces = new NamespaceMap();
        /** Contains dummy namespaces used for unregistered data that is to be kept/displayed */
        this.dummyNamespaces = new NamespaceMap();
        // Misc. Game state properties
        /** Save state property. Last time the game processed time outside of golbin raid. */
        this.tickTimestamp = Date.now();
        /** Last time the game was locally saved */
        this.saveTimestamp = 0;
        /** Save State Property. If the game is currently paused. */
        this._isPaused = false;
        /** Save State Property. If the player has read the Merchant's permite item. */
        this.merchantsPermitRead = false;
        /** Save state property. The skill level cap increases that are currently active. */
        this.activeLevelCapIncreases = [];
        /* Save State property. The level cap increases that are currently being selected by the player. */
        this.levelCapIncreasesBeingSelected = [];
        /** Save State property. The number of skill level caps that have been purchased */
        this._levelCapIncreasesBought = 0;
        /** Save State property. The number of abyssal level caps that have been purchased */
        this._abyssalLevelCapIncreasesBought = 0;
        /** Save state property. Name of loaded character. */
        this.characterName = getLangString('CHARACTER_SELECT_75');
        /** Save State Property. */
        this.minibar = new Minibar(this);
        /** Save State Property. */
        this.petManager = new PetManager(this);
        /** Save State Property. */
        this.shop = new Shop(this);
        /** Save State Property. */
        this.itemCharges = new ItemCharges(this);
        /** Save State Property. */
        this.tutorial = new Tutorial(this);
        /** Save State Property. */
        this.potions = new PotionManager(this);
        /** Save State Property. Stores playfab news that the user has read. */
        this.readNewsIDs = [];
        /** Save State Property. Stores the last version of the game the user has loaded. */
        this.lastLoadedGameVersion = gameVersion;
        this.completion = new Completion(this);
        this.events = new GameEventSystem(this);
        this.lore = new Lore(this);
        // public townshipUI: TownshipUI = new TownshipUI();
        this.eventManager = new EventManager();
        this.notifications = new NotificationsManager();
        this.telemetry = new Telemetry();
        this.clueHunt = new ClueHunt();
        this.birthdayEvent2023CompletionTracker = [false, false, false, false];
        // public christmas2021: Christmas2021 = new Christmas2021(EVENTS[Events.CHRISTMAS2021]);
        this.dropWeightCache = new Map();
        this.refundedAstrology = false;
        this.refundedAstrologyAgain = false;
        this.renderQueue = {
            title: false,
            combatMinibar: false,
            activeSkills: false,
            sidebarSkillUnlock: false,
            clueHuntStep6: false,
            birthdayEventProgress: false,
            realmVisibility: false,
            realmSidebarVisibility: new Set(),
            sidebarSkillOpacity: false,
            sidebarClass: false,
        };
        // Start of Registered game data
        this.realms = new NamespaceRegistry(this.registeredNamespaces, Realm.name);
        this.damageTypes = new NamespaceRegistry(this.registeredNamespaces, DamageType.name);
        this.combatTriangleSets = new NamespaceRegistry(this.registeredNamespaces, CombatTriangleSet.name);
        this.attackStyles = new NamespaceRegistry(this.registeredNamespaces, AttackStyle.name);
        this.combatEffectGroups = new NamespaceRegistry(this.registeredNamespaces, CombatEffectGroup.name);
        this.combatEffectTemplates = new NamespaceRegistry(this.registeredNamespaces, CombatEffectTemplate.name);
        this.combatEffects = new NamespaceRegistry(this.registeredNamespaces, CombatEffect.name);
        this.combatEffectTables = new NamespaceRegistry(this.registeredNamespaces, CombatEffectTable.name);
        this.specialAttacks = new NamespaceRegistry(this.registeredNamespaces, SpecialAttack.name);
        this.currencies = new NamespaceRegistry(this.registeredNamespaces, Currency.name);
        this.equipmentSlots = new NamespaceRegistry(this.registeredNamespaces, EquipmentSlot.name);
        this.items = new ItemRegistry(this.registeredNamespaces);
        this.pages = new NamespaceRegistry(this.registeredNamespaces, Page.name);
        this.actions = new NamespaceRegistry(this.registeredNamespaces, 'Action');
        /** Registry of all active actions */
        this.activeActions = new NamespaceRegistry(this.registeredNamespaces, 'ActiveAction');
        /** Registry of all passive actions */
        this.passiveActions = new NamespaceRegistry(this.registeredNamespaces, 'PassiveAction');
        this._passiveTickers = [];
        this.actionPageMap = new Map();
        this.skillPageMap = new Map();
        /** Registery of all skills */
        this.skills = new NamespaceRegistry(this.registeredNamespaces, Skill.name);
        /** Registry of all skills that have mastery */
        this.masterySkills = new NamespaceRegistry(this.registeredNamespaces, SkillWithMastery.name);
        this.monsters = new NamespaceRegistry(this.registeredNamespaces, Monster.name);
        this.monsterAreas = new Map();
        this.combatPassives = new NamespaceRegistry(this.registeredNamespaces, CombatPassive.name);
        /** Registry of all combat area categories. Categories contain the display order of their areas */
        this.combatAreaCategories = new NamespaceRegistry(this.registeredNamespaces, CombatAreaCategory.name);
        this.combatAreaCategoryOrder = new NamespacedArray(this.combatAreaCategories);
        this.combatAreas = new CombatAreaRegistry(this.registeredNamespaces, CombatArea.name);
        this.slayerAreas = this.combatAreas.slayer;
        this.dungeons = this.combatAreas.dungeons;
        this.abyssDepths = this.combatAreas.abyssDepths;
        this.strongholds = this.combatAreas.strongholds;
        this.combatEvents = new NamespaceRegistry(this.registeredNamespaces, CombatEvent.name);
        this.prayers = new NamespaceRegistry(this.registeredNamespaces, ActivePrayer.name);
        this.attackSpellbooks = new NamespaceRegistry(this.registeredNamespaces, AttackSpellbook.name);
        this.attackSpells = new NamespaceRegistry(this.registeredNamespaces, AttackSpell.name);
        this.curseSpells = new NamespaceRegistry(this.registeredNamespaces, CurseSpell.name);
        this.auroraSpells = new NamespaceRegistry(this.registeredNamespaces, AuroraSpell.name);
        this.pets = new NamespaceRegistry(this.registeredNamespaces, Pet.name);
        this.skillLevelCapIncreases = new NamespaceRegistry(this.registeredNamespaces, SkillLevelCapIncrease.name);
        this.gamemodes = new NamespaceRegistry(this.registeredNamespaces, Gamemode.name);
        this.steamAchievements = new Map();
        this.itemSynergies = new Map();
        this.randomGemTable = new DropTable(this, []);
        this.randomSuperiorGemTable = new DropTable(this, []);
        this.randomAbyssalGemTable = new DropTable(this, []);
        this.randomFragmentTable = new DropTable(this, []);
        this.randomFiremakingOilTable = new DropTable(this, []);
        this.ancientRelics = new NamespaceRegistry(this.registeredNamespaces, AncientRelic.name);
        this.ancientRelicsDisplayOrder = new NamespacedArray(this.skills);
        this.skillTreesDisplayOrder = new NamespacedArray(this.skills);
        /** Registry of all modifier scope sources */
        this.modifierScopeSources = new NamespaceRegistry(this.registeredNamespaces, 'ModifierScopeSource');
        /** Registry of all modifiers */
        this.modifierRegistry = new ModifierRegistry(this.registeredNamespaces);
        /** Utility class for managing realm unlocks */
        this.realmManager = new RealmManager(this);
        this.softDataRegQueue = [];
        this.tokenItemStats = new StatProvider();
        /** If interaction with the game is currently blocked */
        this.interactionBlocked = false;
        /** Determines the minimum time delta in [ms] that triggers offline mode on a game loop */
        this.MIN_OFFLINE_TIME = 60000; // 1 minute
        /** Determines the maximum time delta in [ms] that offline mode can run for */
        this.MAX_OFFLINE_TIME = 86400000; // 24 hours
        /** Determines the minimum offline time left to process in [ms] before offline mode exits  */
        this.OFFLINE_EXIT_TIME = 500;
        /** Manually tuned constant that allows the garbage collector time to run during offline progress */
        this.OFFLINE_GC_RATIO = 0.95;
        /** Determines if the game is processing online/offline time */
        this._isInOnlineLoop = true;
        this._offlineInfo = {
            startTime: 0,
            timeProcessed: 0,
            tickRate: 1000,
        };
        /** The last time the game loop ran */
        this._previousLoopTime = Date.now();
        this._forceOfflineLoop = false;
        /** If a save is scheduled to happen outside of the auto-save interval */
        this._isSaveScheduled = false;
        /** The last timestamp when rich presence was updated */
        this._lastRichPresenceUpdate = Date.now();
        /** The time interval when the game is determined to be inactive (currently 5 mins) */
        this.INACTIVITY_INTERVAL = 5 * 60 * 1000;
        /** The last timestamp of when activity to the game was detected. (Keyboard, Touch or mous interaction) */
        this._inactivityTime = this.INACTIVITY_INTERVAL;
        this._frameRateThrottled = false;
        /** The last timestamp when the cloud was updated */
        this._lastCloudUpdate = Date.now();
        this._lastSaveBodySize = 8192;
        this._lastSaveHeaderSize = 8192;
        this.steamAchievementNames = [
            'NEW_ACHIEVEMENT_1_0',
            'NEW_ACHIEVEMENT_1_1',
            'NEW_ACHIEVEMENT_1_10',
            'NEW_ACHIEVEMENT_1_11',
            'NEW_ACHIEVEMENT_1_12',
            'NEW_ACHIEVEMENT_1_13',
            'NEW_ACHIEVEMENT_1_14',
            'NEW_ACHIEVEMENT_1_15',
            'NEW_ACHIEVEMENT_1_16',
            'NEW_ACHIEVEMENT_1_17',
            'NEW_ACHIEVEMENT_1_18',
            'NEW_ACHIEVEMENT_1_19',
            'NEW_ACHIEVEMENT_1_2',
            'NEW_ACHIEVEMENT_1_20',
            'NEW_ACHIEVEMENT_1_21',
            'NEW_ACHIEVEMENT_1_22',
            'NEW_ACHIEVEMENT_1_23',
            'NEW_ACHIEVEMENT_1_24',
            'NEW_ACHIEVEMENT_1_25',
            'NEW_ACHIEVEMENT_1_26',
            'NEW_ACHIEVEMENT_1_27',
            'NEW_ACHIEVEMENT_1_28',
            'NEW_ACHIEVEMENT_1_29',
            'NEW_ACHIEVEMENT_1_3',
            'NEW_ACHIEVEMENT_1_30',
            'NEW_ACHIEVEMENT_1_31',
            'NEW_ACHIEVEMENT_1_4',
            'NEW_ACHIEVEMENT_1_5',
            'NEW_ACHIEVEMENT_1_6',
            'NEW_ACHIEVEMENT_1_7',
            'NEW_ACHIEVEMENT_1_8',
            'NEW_ACHIEVEMENT_1_9',
            'NEW_ACHIEVEMENT_2_0',
            'NEW_ACHIEVEMENT_2_1',
            'NEW_ACHIEVEMENT_2_10',
            'NEW_ACHIEVEMENT_2_11',
            'NEW_ACHIEVEMENT_2_12',
            'NEW_ACHIEVEMENT_2_13',
            'NEW_ACHIEVEMENT_2_14',
            'NEW_ACHIEVEMENT_2_15',
            'NEW_ACHIEVEMENT_2_16',
            'NEW_ACHIEVEMENT_2_17',
            'NEW_ACHIEVEMENT_2_18',
            'NEW_ACHIEVEMENT_2_19',
            'NEW_ACHIEVEMENT_2_2',
            'NEW_ACHIEVEMENT_2_20',
            'NEW_ACHIEVEMENT_2_21',
            'NEW_ACHIEVEMENT_2_22',
            'NEW_ACHIEVEMENT_2_23',
            'NEW_ACHIEVEMENT_2_24',
            'NEW_ACHIEVEMENT_2_25',
            'NEW_ACHIEVEMENT_2_26',
            'NEW_ACHIEVEMENT_2_27',
            'NEW_ACHIEVEMENT_2_28',
            'NEW_ACHIEVEMENT_2_29',
            'NEW_ACHIEVEMENT_2_3',
            'NEW_ACHIEVEMENT_2_30',
            'NEW_ACHIEVEMENT_2_31',
            'NEW_ACHIEVEMENT_2_4',
            'NEW_ACHIEVEMENT_2_5',
            'NEW_ACHIEVEMENT_2_6',
            'NEW_ACHIEVEMENT_2_7',
            'NEW_ACHIEVEMENT_2_8',
            'NEW_ACHIEVEMENT_2_9',
            'NEW_ACHIEVEMENT_3_0',
            'NEW_ACHIEVEMENT_3_1',
            'NEW_ACHIEVEMENT_3_2',
            'NEW_ACHIEVEMENT_3_25',
            'NEW_ACHIEVEMENT_3_26',
            'NEW_ACHIEVEMENT_3_27',
            'NEW_ACHIEVEMENT_3_28',
            'NEW_ACHIEVEMENT_3_29',
            'NEW_ACHIEVEMENT_3_3',
            'NEW_ACHIEVEMENT_3_30',
            'NEW_ACHIEVEMENT_3_31',
            'NEW_ACHIEVEMENT_3_4',
            'NEW_ACHIEVEMENT_3_5',
            'NEW_ACHIEVEMENT_3_6',
            'NEW_ACHIEVEMENT_4_0',
            'NEW_ACHIEVEMENT_4_1',
            'NEW_ACHIEVEMENT_4_12',
            'NEW_ACHIEVEMENT_4_3',
            'NEW_ACHIEVEMENT_4_4',
            'NEW_ACHIEVEMENT_4_5',
            'NEW_ACHIEVEMENT_4_6',
            'NEW_ACHIEVEMENT_4_7',
        ];
        this.bank = new Bank(this, 12, 20);
        this.keyboard = new KeyboardInputManager(this);
        // Register Special reserved Namespaces used for the completion system
        this.registeredNamespaces.registerNamespace("melvorBaseGame" /* Namespaces.BaseGame */ , 'Base Game', false);
        this.registeredNamespaces.registerNamespace("melvorTrue" /* Namespaces.True */ , 'True', false);
        // Register main name spaces
        const demoNamespace = this.registeredNamespaces.registerNamespace("melvorD" /* Namespaces.Demo */ , 'Demo', false);
        if (cloudManager.hasFullVersionEntitlement) {
            this.registeredNamespaces.registerNamespace("melvorF" /* Namespaces.Full */ , 'Full Version', false);
            //Birthday event 2023
            this.registeredNamespaces.registerNamespace("melvorBirthday2023" /* Namespaces.Birthday2023 */ , 'Birthday Event 2023', false);
            //April Fools event 2024
            this.registeredNamespaces.registerNamespace("melvorAprilFools2024" /* Namespaces.AprilFools2024 */ , 'April Fools Event 2024', false);
        }
        if (cloudManager.hasTotHEntitlementAndIsEnabled)
            this.registeredNamespaces.registerNamespace("melvorTotH" /* Namespaces.Throne */ , 'Throne of the Herald', false);
        if (cloudManager.hasAoDEntitlementAndIsEnabled)
            this.registeredNamespaces.registerNamespace("melvorAoD" /* Namespaces.AtlasOfDiscovery */ , 'Atlas of Discovery', false);
        if (cloudManager.hasItAEntitlementAndIsEnabled)
            this.registeredNamespaces.registerNamespace("melvorItA" /* Namespaces.IntoTheAbyss */ , 'Into The Abyss', false);
        // Registery modifier scope sources
        this.modifierScopeSources.registerObject(new AttackSpellScopeSource(demoNamespace, this));
        this.modifierScopeSources.registerObject(new CombatAreaScopeSource(demoNamespace, this));
        // Register default realm
        this.defaultRealm = new Realm(demoNamespace, {
            id: 'Melvor',
            name: 'Melvor Realm',
            media: 'assets/media/main/logo_no_text.png',
            unlockRequirements: [],
        }, this);
        this.realms.registerObject(this.defaultRealm);
        this.currentRealm = this.defaultRealm;
        // Register normal damage
        this.normalDamage = new DamageType(demoNamespace, {
            id: 'Normal',
            name: 'Normal Damage',
            media: 'assets/media/skills/combat/normal_damage.png',
            resistanceName: 'Damage Reduction',
            resistanceCap: 95,
            immuneTo: [],
            spanClass: 'font-w600 damage-type-normal',
        }, this);
        this.damageTypes.registerObject(this.normalDamage);
        // Register Special data objects
        this.normalCombatTriangleSet = new CombatTriangleSet(demoNamespace, CombatTriangleSet.normalSetData);
        this.combatTriangleSets.registerObject(this.normalCombatTriangleSet);
        this.normalAttack = new SpecialAttack(demoNamespace, {
            id: 'Normal',
            defaultChance: 100,
            damage: [{
                damageType: 'Normal',
                amplitude: 100,
            }, ],
            prehitEffects: [],
            onhitEffects: [],
            cantMiss: false,
            attackCount: 1,
            attackInterval: -1,
            lifesteal: 0,
            usesRunesPerProc: false,
            usesPrayerPointsPerProc: true,
            usesPotionChargesPerProc: true,
            attackTypes: ['melee', 'ranged', 'magic'],
            isDragonbreath: false,
            name: 'Regular Attack',
            description: 'Perform a regular attack.',
            descriptionGenerator: 'Perform a regular attack.',
        }, this);
        this.specialAttacks.registerObject(this.normalAttack);
        // Register Currencies
        this.gp = new GP(demoNamespace, this);
        this.currencies.registerObject(this.gp);
        this.slayerCoins = new SlayerCoins(demoNamespace, this);
        this.currencies.registerObject(this.slayerCoins);
        this.raidCoins = new RaidCoins(demoNamespace, this);
        this.currencies.registerObject(this.raidCoins);
        this.emptyEquipmentItem = new EquipmentItem(demoNamespace, {
            id: 'Empty_Equipment',
            tier: 'emptyItem',
            name: '',
            validSlots: [],
            occupiesSlots: [],
            equipRequirements: [],
            equipmentStats: [],
            category: '',
            type: '',
            media: "assets/media/skills/combat/food_empty.png" /* Assets.EmptyItem */ ,
            ignoreCompletion: true,
            obtainFromItemLog: false,
            golbinRaidExclusive: false,
            sellsFor: 0,
        }, this);
        this.items.registerObject(this.emptyEquipmentItem);
        this.emptyFoodItem = new FoodItem(demoNamespace, {
            itemType: 'Food',
            id: 'Empty_Food',
            name: '',
            healsFor: 0,
            category: '',
            type: '',
            media: "assets/media/skills/combat/food_empty.png" /* Assets.EmptyItem */ ,
            ignoreCompletion: true,
            obtainFromItemLog: false,
            golbinRaidExclusive: false,
            sellsFor: 0,
        }, this);
        this.items.registerObject(this.emptyFoodItem);
        this.unknownCombatArea = new CombatArea(demoNamespace, {
            name: 'Unknown Area',
            id: 'UnknownArea',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            monsterIDs: [],
            difficulty: [0],
            entryRequirements: [],
        }, this);
        this.combatAreas.registerObject(this.unknownCombatArea);
        // Active Action Page
        this.activeActionPage = new Page(demoNamespace, {
            id: 'ActiveSkill',
            customName: 'Active Skill',
            media: 'assets/media/main/logo_no_text.png',
            containerID: '',
            headerBgClass: '',
            hasGameGuide: false,
            canBeDefault: true,
        }, this);
        this.pages.registerObject(this.activeActionPage);
        // Unset Gamemode
        const unsetMode = new Gamemode(demoNamespace, {
            id: 'Unset',
            name: 'Error: Unset Gamemode',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            description: 'Error: Unset Gamemode',
            rules: [],
            textClass: '',
            btnClass: '',
            isPermaDeath: false,
            isEvent: false,
            endDate: 0,
            combatTriangle: 'Standard',
            hitpointMultiplier: 1,
            hasRegen: true,
            capNonCombatSkillLevels: false,
            startingPage: "melvorD:ActiveSkill" /* PageIDs.ActiveSkill */ ,
            startingItems: [],
            allowSkillUnlock: true,
            startingSkills: [],
            skillUnlockCost: [Infinity],
            hasTutorial: false,
        }, this);
        this.gamemodes.registerObject(unsetMode);
        this.currentGamemode = unsetMode;
        this.settings = new Settings(this);
        this.stats = new Statistics(this);
        this.combat = new CombatManager(this, demoNamespace);
        this.golbinRaid = new RaidManager(this, demoNamespace);
        // Register active/passive actions
        this.actions.registerObject(this.combat);
        this.actions.registerObject(this.golbinRaid);
        this.activeActions.registerObject(this.combat);
        this.activeActions.registerObject(this.golbinRaid);
        this.passiveActions.registerObject(this.combat);
        // Register demo skills
        this.attack = this.registerSkill(demoNamespace, Attack);
        this.strength = this.registerSkill(demoNamespace, Strength);
        this.defence = this.registerSkill(demoNamespace, Defence);
        this.hitpoints = this.registerSkill(demoNamespace, Hitpoints);
        this.ranged = this.registerSkill(demoNamespace, Ranged);
        this.altMagic = this.registerSkill(demoNamespace, AltMagic);
        this.prayer = this.registerSkill(demoNamespace, Prayer);
        this.slayer = this.registerSkill(demoNamespace, Slayer);
        this.woodcutting = this.registerSkill(demoNamespace, Woodcutting);
        this.fishing = this.registerSkill(demoNamespace, Fishing);
        this.firemaking = this.registerSkill(demoNamespace, Firemaking);
        this.cooking = this.registerSkill(demoNamespace, Cooking);
        this.mining = this.registerSkill(demoNamespace, Mining);
        this.smithing = this.registerSkill(demoNamespace, Smithing);
        this.thieving = this.registerSkill(demoNamespace, Thieving);
        this.farming = this.registerSkill(demoNamespace, Farming);
        this.fletching = this.registerSkill(demoNamespace, Fletching);
        this.crafting = this.registerSkill(demoNamespace, Crafting);
        this.runecrafting = this.registerSkill(demoNamespace, Runecrafting);
        this.herblore = this.registerSkill(demoNamespace, Herblore);
        this.agility = this.registerSkill(demoNamespace, Agility);
        this.summoning = this.registerSkill(demoNamespace, Summoning);
        this.astrology = this.registerSkill(demoNamespace, Astrology);
        this.township = this.registerSkill(demoNamespace, Township);
        // Register Atlas of Discovery Skills
        if (cloudManager.hasAoDEntitlementAndIsEnabled) {
            const expac2Namespace = this.registeredNamespaces.getNamespace("melvorAoD" /* Namespaces.AtlasOfDiscovery */ );
            if (expac2Namespace === undefined)
                throw new Error('Atlas of Discovery Namespace not registered.');
            this.cartography = this.registerSkill(expac2Namespace, Cartography);
            this.archaeology = this.registerSkill(expac2Namespace, Archaeology);
        }
        // Register Ito the Abyss Skills
        if (cloudManager.hasItAEntitlementAndIsEnabled) {
            const expac3Namespace = this.registeredNamespaces.getNamespace("melvorItA" /* Namespaces.IntoTheAbyss */ );
            if (expac3Namespace === undefined)
                throw new Error('Into the Abyss Namespace not registered.');
            this.harvesting = this.registerSkill(expac3Namespace, Harvesting);
            this.corruption = this.registerSkill(expac3Namespace, Corruption);
            this.abyssalPieces = new AbyssalPieces(expac3Namespace, this);
            this.currencies.registerObject(this.abyssalPieces);
            this.abyssalSlayerCoins = new AbyssalSlayerCoins(expac3Namespace, this);
            this.currencies.registerObject(this.abyssalSlayerCoins);
        }
        // Register Stat Providing subsystems
        this.combat.registerStatProvider(this.tokenItemStats);
        this.combat.registerStatProvider(this.petManager);
        this.combat.registerStatProvider(this.shop.providedStats);
        this.combat.registerStatProvider(this.potions.providedStats);
        // Register Golbin Raid Stat Providing subsystems
        this.golbinRaid.registerStatProvider(this.petManager.raidStats);
        this.golbinRaid.registerStatProvider(this.shop.raidStats);
    }
    get levelCapIncreasesBought() {
        return this._levelCapIncreasesBought;
    }
    get abyssalLevelCapIncreasesBought() {
        return this._abyssalLevelCapIncreasesBought;
    }
    get unlockedRealms() {
        return this.realms.filter((realm) => realm.isUnlocked);
    }
    get playerCombatLevel() {
        switch (this.combat.player.damageType.id) {
            case "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ :
                return this.playerAbyssalCombatLevel;
            default:
                return this.playerNormalCombatLevel;
        }
    }
    get playerNormalCombatLevel() {
        const base = 0.25 * (this.defence.level + this.hitpoints.level + Math.floor(this.prayer.level / 2));
        const melee = 0.325 * (this.attack.level + this.strength.level);
        const range = 0.325 * Math.floor((3 * this.ranged.level) / 2);
        const magic = 0.325 * Math.floor((3 * this.altMagic.level) / 2);
        const levels = [melee, range, magic];
        return Math.floor(base + Math.max(...levels));
    }
    get playerAbyssalCombatLevel() {
        const base = 0.25 *
            (this.defence.level +
                this.defence.abyssalLevel +
                this.hitpoints.level +
                this.hitpoints.abyssalLevel +
                Math.floor((this.prayer.level + this.prayer.abyssalLevel) / 2));
        const melee = 0.325 * (this.attack.level + this.attack.abyssalLevel + this.strength.level + this.strength.abyssalLevel);
        const range = 0.325 * Math.floor((3 * (this.ranged.level + this.ranged.abyssalLevel)) / 2);
        const magic = 0.325 * Math.floor((3 * (this.altMagic.level + this.altMagic.abyssalLevel)) / 2);
        const levels = [melee, range, magic];
        return Math.floor(base + Math.max(...levels));
    }
    get isPaused() {
        return this._isPaused;
    }
    // End of Registered game data
    get isGolbinRaid() {
        return this.activeAction === this.golbinRaid;
    }
    /** Quick refereence for player modifiers */
    get modifiers() {
        return this.combat.player.modifiers;
    }
    get isBirthdayEvent2023Complete() {
        return this.birthdayEvent2023CompletionTracker.every((task) => task);
    }
    fetchAndRegisterDataPackage(url) {
        return __awaiter(this, void 0, void 0, function*() {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            const response = yield fetch(url, {
                method: 'GET',
                headers,
            });
            if (!response.ok)
                throw new Error(`Could not fetch data package with URL: ${url}. Error ${response.status}: ${response.statusText}`);
            const dataPackage = (yield response.json());
            this.registerDataPackage(dataPackage);
        });
    }
    /** Performs the registration of a data package to the game */
    registerDataPackage(dataPackage) {
        var _a;
        if (dataPackage.namespace === undefined)
            throw new Error(`Package does not have a namespace defined.`);
        const namespace = this.registeredNamespaces.getNamespace(dataPackage.namespace);
        if (namespace === undefined)
            throw new Error(`Error trying to register data package. Namespace: "${dataPackage.namespace}" is not registered.`);
        if (dataPackage.data !== undefined)
            this.registerGameData(namespace, dataPackage.data);
        (_a = dataPackage.dependentData) === null || _a === void 0 ? void 0 : _a.forEach((depData) => {
            if (this.registeredNamespaces.hasNamespace(depData.namespace)) {
                if (depData.data !== undefined)
                    this.registerGameData(namespace, depData.data);
                if (depData.modifications !== undefined)
                    this.applyDataModifications(depData.modifications);
            }
        });
        if (dataPackage.modifications !== undefined)
            this.applyDataModifications(dataPackage.modifications);
        if (dataPackage.namespaceChange !== undefined) {
            if (dataPackage.namespaceChange.items !== undefined) {
                this.items.registerNamespaceChange(namespace, dataPackage.namespaceChange.items);
            }
        }
    }
    /** Registers game data under the given namespace */
    registerGameData(namespace, gameData) {
        // Data Is ordered by Hard Dependencies
        if (gameData.realms !== undefined)
            this.registerRealms(namespace, gameData.realms);
        if (gameData.damageTypes !== undefined)
            this.registerDamageTypes(namespace, gameData.damageTypes);
        if (gameData.modifiers !== undefined)
            this.registerModifiers(namespace, gameData.modifiers);
        if (gameData.combatTriangleSets !== undefined)
            this.registerCombatTriangleSets(namespace, gameData.combatTriangleSets);
        if (gameData.combatEffectGroups !== undefined)
            this.registerCombatEffectGroups(namespace, gameData.combatEffectGroups);
        if (gameData.combatEffectTemplates !== undefined)
            this.registerCombatEffectTemplates(namespace, gameData.combatEffectTemplates);
        if (gameData.combatEffects !== undefined)
            this.registerCombatEffects(namespace, gameData.combatEffects);
        if (gameData.combatEffectTables !== undefined)
            this.registerCombatEffectTables(namespace, gameData.combatEffectTables);
        if (gameData.combatPassives !== undefined)
            this.registerCombatPassiveData(namespace, gameData.combatPassives);
        if (gameData.attacks !== undefined)
            this.registerAttackData(namespace, gameData.attacks);
        if (gameData.pages !== undefined)
            this.registerPages(namespace, gameData.pages);
        if (gameData.pets !== undefined)
            this.registerPets(namespace, gameData.pets);
        if (gameData.attackStyles !== undefined)
            this.registerAttackStyles(namespace, gameData.attackStyles);
        if (gameData.prayers !== undefined)
            this.registerPrayerData(namespace, gameData.prayers);
        if (gameData.equipmentSlots !== undefined)
            this.registerEquipmentSlotData(namespace, gameData.equipmentSlots);
        if (gameData.items !== undefined)
            this.registerItemData(namespace, gameData.items);
        if (gameData.bankSortOrder !== undefined)
            this.bank.registerSortOrder(gameData.bankSortOrder);
        if (gameData.itemUpgrades !== undefined)
            this.bank.registerItemUpgrades(gameData.itemUpgrades);
        if (gameData.itemSynergies !== undefined)
            this.registerItemSynergies(gameData.itemSynergies);
        if (gameData.randomGems !== undefined)
            this.randomGemTable.registerDrops(this, gameData.randomGems);
        if (gameData.randomSuperiorGems !== undefined)
            this.randomSuperiorGemTable.registerDrops(this, gameData.randomSuperiorGems);
        if (gameData.randomAbyssalGems !== undefined)
            this.randomAbyssalGemTable.registerDrops(this, gameData.randomAbyssalGems);
        if (gameData.randomFragments !== undefined)
            this.randomFragmentTable.registerDrops(this, gameData.randomFragments);
        if (gameData.randomFiremakingOils !== undefined)
            this.randomFiremakingOilTable.registerDrops(this, gameData.randomFiremakingOils);
        if (gameData.golbinRaid !== undefined)
            this.golbinRaid.registerData(gameData.golbinRaid);
        if (gameData.skillLevelCapIncreases !== undefined)
            this.registerSkillLevelCapIncreases(namespace, gameData.skillLevelCapIncreases);
        if (gameData.gamemodes !== undefined)
            this.registerGamemodes(namespace, gameData.gamemodes);
        if (gameData.attackSpellbooks !== undefined)
            this.registerAttackSpellbookData(namespace, gameData.attackSpellbooks);
        if (gameData.attackSpells !== undefined)
            this.registerAttackSpellData(namespace, gameData.attackSpells);
        if (gameData.standardSpells !== undefined)
            this.registerStandardSpellData(namespace, gameData.standardSpells);
        if (gameData.ancientSpells !== undefined)
            this.registerAncientSpellData(namespace, gameData.ancientSpells);
        if (gameData.archaicSpells !== undefined)
            this.registerArchaicSpellData(namespace, gameData.archaicSpells);
        if (gameData.auroraSpells !== undefined)
            this.registerAuroraSpellData(namespace, gameData.auroraSpells);
        if (gameData.curseSpells !== undefined)
            this.registerCurseSpellData(namespace, gameData.curseSpells);
        if (gameData.monsters !== undefined)
            this.registerMonsterData(namespace, gameData.monsters);
        if (gameData.itmMonsters !== undefined)
            this.registerRandomMonsters(gameData.itmMonsters, this.combat.itmMonsters);
        if (gameData.spiderLairMonsters !== undefined)
            this.registerRandomMonsters(gameData.spiderLairMonsters, this.combat.spiderLairMonsters);
        if (gameData.combatAreas !== undefined)
            this.registerCombatAreaData(namespace, gameData.combatAreas);
        if (gameData.slayerAreas !== undefined)
            this.registerSlayerAreaData(namespace, gameData.slayerAreas);
        if (gameData.combatEvents !== undefined)
            this.registerCombatEventData(namespace, gameData.combatEvents);
        if (gameData.dungeons !== undefined)
            this.registerDungeonData(namespace, gameData.dungeons);
        if (gameData.abyssDepths !== undefined)
            this.registerAbyssDepthData(namespace, gameData.abyssDepths);
        if (gameData.strongholds !== undefined)
            this.registerStrongholdData(namespace, gameData.strongholds);
        if (gameData.combatAreaCategories !== undefined)
            this.registerCombatAreaCategories(namespace, gameData.combatAreaCategories);
        if (gameData.combatAreaCategoryOrder !== undefined)
            this.combatAreaCategoryOrder.registerData(gameData.combatAreaCategoryOrder);
        this.registerOldAreaDisplayOrders(gameData);
        if (gameData.slayerTaskCategories !== undefined)
            this.registerSlayerTaskCategories(namespace, gameData.slayerTaskCategories);
        if (gameData.shopCategories !== undefined)
            this.registerShopCategories(namespace, gameData.shopCategories);
        if (gameData.shopCategoryOrder !== undefined)
            this.shop.categoryDisplayOrder.registerData(gameData.shopCategoryOrder);
        if (gameData.shopPurchases !== undefined)
            this.registerShopPurchases(namespace, gameData.shopPurchases);
        if (gameData.shopDisplayOrder !== undefined)
            this.shop.purchaseDisplayOrder.registerData(gameData.shopDisplayOrder);
        if (gameData.shopUpgradeChains !== undefined)
            this.registerShopUpgradeChains(namespace, gameData.shopUpgradeChains);
        if (gameData.skillTreesDisplayOrder !== undefined)
            this.skillTreesDisplayOrder.registerData(gameData.skillTreesDisplayOrder);
        if (gameData.ancientRelics !== undefined)
            this.registerAncientRelics(namespace, gameData.ancientRelics);
        if (gameData.ancientRelicsDisplayOrder !== undefined)
            this.ancientRelicsDisplayOrder.registerData(gameData.ancientRelicsDisplayOrder);
        if (gameData.skillData !== undefined) {
            gameData.skillData.forEach((skillsData) => {
                const skill = this.skills.getObjectByID(skillsData.skillID);
                if (skill === undefined)
                    throw new Error(`Error registering data package. Cannot register data for unregistered skill: ${skillsData.skillID}.`);
                skill.registerData(namespace, skillsData.data);
            });
        }
        if (!namespace.isModded && gameData.steamAchievements !== undefined)
            this.registerSteamAchievements(gameData.steamAchievements);
        if (gameData.lore !== undefined)
            this.lore.registerLore(namespace, gameData.lore);
        if (!namespace.isModded) {
            if (gameData.tutorialStages !== undefined)
                this.tutorial.registerStages(namespace, gameData.tutorialStages);
            if (gameData.tutorialStageOrder !== undefined)
                this.tutorial.registerStageOrder(gameData.tutorialStageOrder);
        }
        // Register Soft Data Depedencies
        for (let i = 0; i < this.softDataRegQueue.length; i++) {
            const {
                data,
                object,
                where
            } = this.softDataRegQueue[i];
            try {
                object.registerSoftDependencies(data, this);
            } catch (e) {
                if (where !== undefined) {
                    throw new Error(`Error registering soft data dependency in ${where}: ${e}`);
                }
                throw e;
            }
        }
        this.softDataRegQueue = [];
    }
    queueForSoftDependencyReg(data, object, where) {
        this.softDataRegQueue.push({
            data,
            object,
            where,
        });
    }
    postDataRegistration() {
        this.attackSpellbooks.forEach((book) => {
            book.spells.sort((a, b) => a.level - b.level);
        });
        this.combatAreas.forEach((area) => {
            if (area.allowAutoJump)
                area.monsters.forEach((monster) => this.monsterAreas.set(monster, area));
        });
        this.slayerAreas.forEach((area) => {
            const slayerLevelReq = area.entryRequirements.find((req) => {
                return req.type === 'SkillLevel' && req.skill === this.slayer;
            });
            if (slayerLevelReq !== undefined)
                area.slayerLevelRequired = slayerLevelReq.level;
        });
        this.skills.forEach((skill) => {
            if (!skill.isModded) {
                skill.postDataRegistration();
                return;
            }
            try {
                skill.postDataRegistration();
            } catch (e) {
                // TODO handle this and modded objects' methods in general more betterer
                console.error(`[${skill.id}] Error in postDataRegistration:`, e);
            }
        });
        this.shop.postDataRegistration();
        this.golbinRaid.postDataRegistration();
        this.combat.postDataRegistration();
        this._passiveTickers = this.passiveActions.allObjects;
        this.pages.forEach((page) => {
            if (page.action !== undefined)
                this.actionPageMap.set(page.action, page);
            if (page.skills !== undefined) {
                page.skills.forEach((skill) => {
                    const pageArray = this.skillPageMap.get(skill);
                    if (pageArray !== undefined) {
                        pageArray.push(page);
                    } else {
                        this.skillPageMap.set(skill, [page]);
                    }
                });
            }
        });
        this.settings.postDataRegistration();
    }
    registerAttackStyles(namespace, data) {
        data.forEach((data) => this.attackStyles.registerObject(new AttackStyle(namespace, data, this)));
    }
    registerItemData(namespace, data) {
        data.forEach((itemData) => {
            if (itemData.isDebug && !DEBUGENABLED)
                return;
            switch (itemData.itemType) {
                case 'Item':
                    this.items.registerObject(new Item(namespace, itemData, this));
                    break;
                case 'Equipment':
                    this.items.registerObject(new EquipmentItem(namespace, itemData, this));
                    break;
                case 'Weapon':
                    this.items.registerObject(new WeaponItem(namespace, itemData, this));
                    break;
                case 'Food':
                    this.items.registerObject(new FoodItem(namespace, itemData, this));
                    break;
                case 'Bone':
                    this.items.registerObject(new BoneItem(namespace, itemData, this));
                    break;
                case 'Potion':
                    this.items.registerObject(new PotionItem(namespace, itemData, this));
                    break;
                case 'Readable':
                    this.items.registerObject(new ReadableItem(namespace, itemData, this));
                    break;
                case 'Openable':
                    this.items.registerObject(new OpenableItem(namespace, itemData, this));
                    break;
                case 'Token':
                    this.items.registerObject(new TokenItem(namespace, itemData, this));
                    break;
                case 'MasteryToken':
                    this.items.registerObject(new MasteryTokenItem(namespace, itemData, this));
                    break;
                case 'Compost':
                    this.items.registerObject(new CompostItem(namespace, itemData, this));
                    break;
                case 'Soul':
                    this.items.registerObject(new SoulItem(namespace, itemData, this));
                    break;
                case 'Rune':
                    this.items.registerObject(new RuneItem(namespace, itemData, this));
                    break;
                case 'FiremakingOil':
                    this.items.registerObject(new FiremakingOilItem(namespace, itemData, this));
                    break;
            }
        });
    }
    registerAttackData(namespace, data) {
        data.forEach((attackData) => {
            this.specialAttacks.registerObject(new SpecialAttack(namespace, attackData, this));
        });
    }
    registerCombatEffectGroups(namespace, data) {
        data.forEach((data) => this.combatEffectGroups.registerObject(new CombatEffectGroup(namespace, data)));
    }
    registerCombatEffectTemplates(namespace, data) {
        data.forEach((data) => this.combatEffectTemplates.registerObject(new CombatEffectTemplate(namespace, data, this)));
    }
    registerCombatEffects(namespace, data) {
        data.forEach((data) => {
            let effect;
            if ('templateID' in data) {
                const template = this.combatEffectTemplates.getObjectByID(data.templateID);
                if (template === undefined)
                    throw new Error(`Error registering CombatEffect with id: ${data.id}. CombatEffectTemplate with id: ${data.templateID} is not registered.`);
                effect = template.createEffect(namespace, data, this);
            } else {
                effect = new CombatEffect(namespace, data, this);
            }
            this.combatEffects.registerObject(effect);
        });
    }
    registerCombatEffectTables(namespace, data) {
        data.forEach((data) => this.combatEffectTables.registerObject(new CombatEffectTable(namespace, data, this)));
    }
    registerCombatPassiveData(namespace, data) {
        // Special passive that scales
        if (namespace.name === "melvorF" /* Namespaces.Full */ )
            this.combatPassives.registerObject(new ControlledAffliction(namespace, this));
        data.forEach((passiveData) => {
            this.combatPassives.registerObject(new CombatPassive(namespace, passiveData, this));
        });
    }
    registerMonsterData(namespace, data) {
        data.forEach((monsterData) => {
            this.monsters.registerObject(new Monster(namespace, monsterData, this));
        });
    }
    registerRandomMonsters(monsterIDs, monsterArray) {
        monsterIDs.forEach((monsterID) => {
            const monster = this.monsters.getObjectByID(monsterID);
            if (monster === undefined)
                throw new Error(`Error registering random dungeon monsters, monster with id: ${monsterID} is not registered.`);
            monsterArray.push(monster);
        });
    }
    registerCombatAreaData(namespace, data) {
        data.forEach((data) => {
            this.combatAreas.registerObject(new CombatArea(namespace, data, this));
        });
    }
    registerSlayerAreaData(namespace, data) {
        data.forEach((data) => {
            this.combatAreas.registerObject(new SlayerArea(namespace, data, this));
        });
    }
    registerDungeonData(namespace, data) {
        data.forEach((data) => {
            this.combatAreas.registerObject(new Dungeon(namespace, data, this));
        });
    }
    registerAbyssDepthData(namespace, data) {
        data.forEach((data) => {
            this.combatAreas.registerObject(new AbyssDepth(namespace, data, this));
        });
    }
    registerStrongholdData(namespace, data) {
        data.forEach((data) => {
            this.combatAreas.registerObject(new Stronghold(namespace, data, this));
        });
    }
    registerCombatAreaCategories(namespace, data) {
        data.forEach((data) => {
            this.combatAreaCategories.registerObject(new CombatAreaCategory(namespace, data, this));
        });
    }
    /** Provides backwards compatability for the old data format for combat area orders */
    registerOldAreaDisplayOrders(gameData) {
        if (gameData.combatAreaDisplayOrder !== undefined) {
            const category = this.combatAreaCategories.getObjectByID('melvorD:CombatAreas');
            if (category !== undefined)
                category.applyDataModification({
                    id: '',
                    areas: {
                        add: gameData.combatAreaDisplayOrder
                    }
                }, this);
        }
        if (gameData.slayerAreaDisplayOrder !== undefined) {
            const category = this.combatAreaCategories.getObjectByID('melvorF:SlayerAreas');
            if (category !== undefined)
                category.applyDataModification({
                    id: '',
                    areas: {
                        add: gameData.slayerAreaDisplayOrder
                    }
                }, this);
        }
        if (gameData.dungeonDisplayOrder !== undefined) {
            const category = this.combatAreaCategories.getObjectByID('melvorD:Dungeons');
            if (category !== undefined)
                category.applyDataModification({
                    id: '',
                    areas: {
                        add: gameData.dungeonDisplayOrder
                    }
                }, this);
        }
    }
    registerCombatEventData(namespace, data) {
        data.forEach((data) => {
            this.combatEvents.registerObject(new CombatEvent(namespace, data, this));
        });
    }
    registerSlayerTaskCategories(namespace, data) {
        data.forEach((data) => {
            this.combat.slayerTask.categories.registerObject(new SlayerTaskCategory(namespace, data, this));
        });
    }
    registerPrayerData(namespace, data) {
        data.forEach((data) => this.prayers.registerObject(new ActivePrayer(namespace, data, this)));
    }
    registerAttackSpellbookData(namespace, data) {
        data.forEach((data) => this.attackSpellbooks.registerObject(new AttackSpellbook(namespace, data)));
    }
    registerAttackSpellData(namespace, data) {
        data.forEach((data) => this.attackSpells.registerObject(new AttackSpell(namespace, data, this)));
    }
    registerOldAttackSpellData(namespace, data, spellbook) {
        data.forEach((data) => {
            data.spellbook = spellbook;
            this.attackSpells.registerObject(new AttackSpell(namespace, data, this));
        });
    }
    registerStandardSpellData(namespace, data) {
        console.warn('The "standardSpells" property is deprecated. Use "attackSpells" instead.');
        this.registerOldAttackSpellData(namespace, data, "melvorD:Standard" /* AttackSpellbookIds.Standard */ );
    }
    registerAncientSpellData(namespace, data) {
        console.warn('The "ancientSpells" property is deprecated. Use "attackSpells" instead.');
        this.registerOldAttackSpellData(namespace, data, "melvorF:Ancient" /* AttackSpellbookIds.Ancient */ );
    }
    registerArchaicSpellData(namespace, data) {
        console.warn('The "archaicSpells" property is deprecated. Use "attackSpells" instead.');
        this.registerOldAttackSpellData(namespace, data, "melvorTotH:Archaic" /* AttackSpellbookIds.Archaic */ );
    }
    registerCurseSpellData(namespace, data) {
        data.forEach((data) => this.curseSpells.registerObject(new CurseSpell(namespace, data, this)));
    }
    registerAuroraSpellData(namespace, data) {
        data.forEach((data) => this.auroraSpells.registerObject(new AuroraSpell(namespace, data, this)));
    }
    registerPets(namespace, data) {
        data.forEach((data) => this.pets.registerObject(new Pet(namespace, data, this)));
    }
    registerShopCategories(namespace, data) {
        data.forEach((data) => this.shop.categories.registerObject(new ShopCategory(namespace, data, this)));
    }
    registerShopPurchases(namespace, data) {
        data.forEach((data) => this.shop.purchases.registerObject(new ShopPurchase(namespace, data, this)));
    }
    registerShopUpgradeChains(namespace, data) {
        data.forEach((data) => this.shop.upgradeChains.registerObject(new ShopUpgradeChain(namespace, data, this)));
    }
    registerItemSynergies(data) {
        data.forEach((data) => {
            const synergy = new ItemSynergy(data, this);
            synergy.items.forEach((item) => {
                if (!(typeof item === 'string')) {
                    let synergyArray = this.itemSynergies.get(item);
                    if (synergyArray === undefined) {
                        synergyArray = [];
                        this.itemSynergies.set(item, synergyArray);
                    }
                    synergyArray.push(synergy);
                }
            });
        });
    }
    registerSkillLevelCapIncreases(namespace, data) {
        data.forEach((capData) => this.skillLevelCapIncreases.registerObject(new SkillLevelCapIncrease(namespace, capData, this)));
    }
    registerGamemodes(namespace, data) {
        data.forEach((gamemodeData) => this.gamemodes.registerObject(new Gamemode(namespace, gamemodeData, this)));
    }
    registerSteamAchievements(data) {
        data.forEach((achieveData) => this.steamAchievements.set(achieveData.id, new SteamAchievement(achieveData, this)));
    }
    registerRealms(namespace, data) {
        data.forEach((realmData) => this.realms.registerObject(new Realm(namespace, realmData, this)));
    }
    registerDamageTypes(namespace, data) {
        data.forEach((damageTypeData) => this.damageTypes.registerObject(new DamageType(namespace, damageTypeData, this)));
    }
    registerCombatTriangleSets(namespace, data) {
        data.forEach((setData) => this.combatTriangleSets.registerObject(new CombatTriangleSet(namespace, setData)));
    }
    registerPages(namespace, data) {
        data.forEach((pageData) => this.pages.registerObject(new Page(namespace, pageData, this)));
    }
    registerAncientRelics(namespace, data) {
        data.forEach((relicData) => this.ancientRelics.registerObject(new AncientRelic(namespace, relicData, this)));
    }
    registerEquipmentSlotData(namespace, data) {
        data.forEach((slotData) => this.equipmentSlots.registerObject(new EquipmentSlot(namespace, slotData, this)));
    }
    registerModifiers(namespace, data) {
        const newModifiers = [];
        data.forEach((modifierData) => {
            const modifier = new Modifier(namespace, modifierData, this);
            newModifiers.push(modifier);
            this.modifierRegistry.registerObject(modifier);
        });
        expressions.updateModifiers(namespace, newModifiers);
    }
    /** Registers a skill. Returns the constructed instance of the skill */
    registerSkill(namespace, constructor) {
        const skillInstance = new constructor(namespace, this);
        this.skills.registerObject(skillInstance);
        this.modifierScopeSources.registerObject(skillInstance);
        let isAction = false;
        if (skillInstance.passiveTick !== undefined) {
            this.passiveActions.registerObject(skillInstance);
            isAction = true;
        }
        if (skillInstance.activeTick !== undefined) {
            this.activeActions.registerObject(skillInstance);
            isAction = true;
        }
        if (isAction)
            this.actions.registerObject(skillInstance);
        this.combat.registerStatProvider(skillInstance.providedStats);
        if (skillInstance instanceof SkillWithMastery) {
            this.masterySkills.registerObject(skillInstance);
        }
        return skillInstance;
    }
    applyDataModifications(modificationData) {
        var _a, _b, _c;
        if (modificationData.modifiers !== undefined) {
            modificationData.modifiers.forEach((modData) => {
                const modifier = this.modifierRegistry.getObjectByID(modData.id);
                if (modifier === undefined)
                    throw new UnregisteredDataModError(Modifier.name, modData.id);
                modifier.applyDataModification(modData, this);
                this.modifierRegistry.updateAliases(modifier);
            });
        }
        if (modificationData.gamemodes !== undefined) {
            modificationData.gamemodes.forEach((modData) => {
                const gamemode = this.gamemodes.getObjectByID(modData.id);
                if (gamemode === undefined)
                    throw new UnregisteredDataModError(Gamemode.name, modData.id);
                gamemode.applyDataModification(modData, this);
            });
        }
        if (modificationData.combatAreas !== undefined) {
            modificationData.combatAreas.forEach((modData) => {
                const combatArea = this.combatAreas.getObjectByID(modData.id);
                if (combatArea === undefined)
                    throw new UnregisteredDataModError(CombatArea.name, modData.id);
                combatArea.applyDataModification(modData, this);
            });
        }
        if (modificationData.dungeons !== undefined) {
            modificationData.dungeons.forEach((modData) => {
                const dungeon = this.dungeons.getObjectByID(modData.id);
                if (dungeon === undefined)
                    throw new UnregisteredDataModError(Dungeon.name, modData.id);
                dungeon.applyDataModification(modData, this);
            });
        }
        if (modificationData.items !== undefined) {
            modificationData.items.forEach((modData) => {
                const item = this.items.getObjectByID(modData.id);
                if (item === undefined)
                    throw new UnregisteredDataModError(Item.name, modData.id);
                item.applyDataModification(modData, this);
            });
        }
        if (modificationData.monsters !== undefined) {
            modificationData.monsters.forEach((modData) => {
                const monster = this.monsters.getObjectByID(modData.id);
                if (monster === undefined)
                    throw new UnregisteredDataModError(Monster.name, modData.id);
                monster.applyDataModification(modData, this);
            });
        }
        if (modificationData.shopPurchases !== undefined) {
            modificationData.shopPurchases.forEach((modData) => {
                const purchase = this.shop.purchases.getObjectByID(modData.id);
                if (purchase === undefined)
                    throw new UnregisteredDataModError(ShopPurchase.name, modData.id);
                purchase.applyDataModification(modData, this);
            });
        }
        if (modificationData.slayerAreas !== undefined) {
            modificationData.slayerAreas.forEach((modData) => {
                const slayerAreas = this.slayerAreas.getObjectByID(modData.id);
                if (slayerAreas === undefined)
                    throw new UnregisteredDataModError(SlayerArea.name, modData.id);
                slayerAreas.applyDataModification(modData, this);
            });
        }
        (_a = modificationData.shopUpgradeChains) === null || _a === void 0 ? void 0 : _a.forEach((modData) => {
            const upgradeChain = this.shop.upgradeChains.getObjectByID(modData.id);
            if (upgradeChain === undefined)
                throw new UnregisteredDataModError(ShopUpgradeChain.name, modData.id);
            upgradeChain.applyDataModification(modData, this);
        });
        (_b = modificationData.cookingCategories) === null || _b === void 0 ? void 0 : _b.forEach((modData) => {
            const category = this.cooking.categories.getObjectByID(modData.id);
            if (category === undefined)
                throw new UnregisteredDataModError(CookingCategory.name, modData.id);
            category.applyDataModification(modData, this);
        });
        (_c = modificationData.fletchingRecipes) === null || _c === void 0 ? void 0 : _c.forEach((modData) => {
            const recipe = this.fletching.actions.getObjectByID(modData.id);
            if (recipe === undefined)
                throw new UnregisteredDataModError(FletchingRecipe.name, modData.id);
            recipe.applyDataModification(modData, this);
        });
        if (modificationData.pages !== undefined) {
            modificationData.pages.forEach((modData) => {
                const page = this.pages.getObjectByID(modData.id);
                if (page === undefined)
                    throw new UnregisteredDataModError(Page.name, modData.id);
                page.applyDataModification(modData, this);
            });
        }
        if (modificationData.equipmentSlots !== undefined) {
            modificationData.equipmentSlots.forEach((modData) => {
                const equipmentSlot = this.equipmentSlots.getObjectByID(modData.id);
                if (equipmentSlot === undefined)
                    throw new UnregisteredDataModError(EquipmentSlot.name, modData.id);
                equipmentSlot.applyDataModification(modData, this);
            });
        }
        if (modificationData.damageTypes !== undefined) {
            modificationData.damageTypes.forEach((modData) => {
                const damageType = this.damageTypes.getObjectByID(modData.id);
                if (damageType === undefined)
                    throw new UnregisteredDataModError(EquipmentSlot.name, modData.id);
                damageType.applyDataModification(modData, this);
            });
        }
        if (modificationData.combatAreaCategories !== undefined) {
            modificationData.combatAreaCategories.forEach((modData) => {
                const category = this.combatAreaCategories.getObjectByID(modData.id);
                if (category === undefined)
                    throw new UnregisteredDataModError(CombatAreaCategory.name, modData.id);
                category.applyDataModification(modData, this);
            });
        }
        if (modificationData.skillData !== undefined) {
            modificationData.skillData.forEach(({
                skillID,
                data
            }) => {
                const skill = this.skills.getObjectByID(skillID);
                if (skill === undefined)
                    throw new UnregisteredDataModError(Skill.name, skillID);
                skill.modifyData(data);
            });
        }
        if (modificationData.skillLevelCapIncreases !== undefined) {
            modificationData.skillLevelCapIncreases.forEach((modData) => {
                const capIncrease = this.skillLevelCapIncreases.getObjectByID(modData.id);
                if (capIncrease === undefined)
                    throw new UnregisteredDataModError(SkillLevelCapIncrease.name, modData.id);
                capIncrease.applyDataModification(modData, this);
            });
        }
        if (modificationData.pets !== undefined) {
            modificationData.pets.forEach((modData) => {
                const pet = this.pets.getObjectByID(modData.id);
                if (pet === undefined)
                    throw new UnregisteredDataModError(Pet.name, modData.id);
                pet.applyDataModification(modData, this);
            });
        }
        if (modificationData.itemUpgrades !== undefined) {
            this.bank.modifyItemUpgrades(modificationData.itemUpgrades);
        }
    }
    /**
     * Gets an array of equipment stats from data
     * @param statsData The array of equipment stat data
     * @returns Any array of equipment stats
     */
    getEquipStatsFromData(statsData) {
        return statsData.map((data) => {
            switch (data.key) {
                case 'damageReduction':
                    return {
                        key: 'resistance',
                        value: data.value,
                        damageType: this.normalDamage,
                    };
                case 'resistance':
                case 'summoningMaxhit':
                    return {
                        key: data.key,
                        value: data.value,
                        damageType: data.damageType === undefined ? this.normalDamage : this.damageTypes.getObjectSafe(data.damageType),
                    };
                default:
                    return {
                        key: data.key,
                        value: data.value,
                    };
            }
        });
    }
    /**
     * Applies data modifications to an equipment stats array
     * @param equipStats The equipment stats array to modify
     * @param modData The modification data to apply
     * @returns A new modified equipment stats array
     */
    modifyEquipStats(equipStats, modData) {
        const removals = modData.remove;
        if (removals !== undefined) {
            equipStats = equipStats.filter((stat) => !removals.includes(stat.key));
        }
        if (modData.add !== undefined) {
            const addStats = this.getEquipStatsFromData(modData.add);
            addStats.forEach((stat) => {
                const existing = equipStats.find((e) => e.key === stat.key &&
                    ((e.key !== 'resistance' && e.key !== 'summoningMaxhit') ||
                        e.damageType === stat.damageType));
                if (existing !== undefined)
                    existing.value += stat.value;
                else
                    equipStats.push(stat);
            });
        }
        return equipStats;
    }
    getModifierValuesFromArrayData(data) {
        return data.map((modData) => {
            return ModifierValue.fromKey(modData.key, modData, this);
        });
    }
    /**
     * Gets an array of modifier values from a record of modifier data
     * Note: This method should only be called during soft data registration
     * @param data The data to load
     * @returns An array of modifier values
     */
    getModifierValuesFromData(data) {
        const modifiers = [];
        Object.entries(data).forEach(([key, valuesData]) => {
            if (typeof valuesData === 'number') {
                valuesData = [{
                    value: valuesData,
                }, ];
            }
            const alias = this.modifierRegistry.getAlias(key);
            if (alias !== undefined) {
                valuesData.forEach((valueData) => {
                    if (alias.isNegative)
                        valueData.value = -valueData.value;
                    modifiers.push(ModifierValue.fromAlias(alias.modifier, valueData, alias.alias, this));
                });
            } else {
                const id = Modifier.getIdFromKey(key);
                valuesData.forEach((valueData) => {
                    modifiers.push(ModifierValue.fromID(id, valueData, this));
                });
            }
        });
        return modifiers;
    }
    getEnemyModifierValuesFromData(data) {
        const modifiers = [];
        Object.entries(data).forEach(([key, valuesData]) => {
            if (typeof valuesData === 'number') {
                valuesData = [{
                    value: valuesData,
                }, ];
            }
            const alias = this.modifierRegistry.getEnemyAlias(key);
            if (alias !== undefined) {
                valuesData.forEach((valueData) => {
                    if (alias.isNegative)
                        valueData.value = -valueData.value;
                    modifiers.push(ModifierValue.fromAlias(alias.modifier, valueData, alias.alias, this));
                });
            } else {
                const id = Modifier.getIdFromKey(key);
                valuesData.forEach((valueData) => {
                    modifiers.push(ModifierValue.fromEnemyID(id, valueData, this));
                });
            }
        });
        return modifiers;
    }
    _modifyModifierValues(modifiers, modData, getAlias, getValues) {
        if (modData.remove !== undefined) {
            const removeIds = modData.remove.map((key) => {
                const alias = getAlias(key);
                if (alias !== undefined)
                    return alias.modifier.id;
                return Modifier.getIdFromKey(key);
            });
            modifiers = modifiers.filter((value) => {
                return !removeIds.includes(value.modifier.id);
            });
        }
        if (modData.add !== undefined) {
            const newModifiers = getValues(modData.add);
            const existingKeys = modifiers.map((value) => value.toComparisonKey());
            newModifiers.forEach((newValue) => {
                const newKey = newValue.toComparisonKey();
                const existingIdx = existingKeys.findIndex((eKey) => eKey === newKey);
                if (existingIdx !== -1) {
                    modifiers[existingIdx].value = newValue.value;
                } else {
                    modifiers.push(newValue);
                }
            });
        }
        return modifiers;
    }
    /** Applies modification data to a ModifierValue[] array, returning the mutated array */
    modifyModifierValues(modifiers, modData) {
        return this._modifyModifierValues(modifiers, modData, (key) => this.modifierRegistry.getAlias(key), (data) => this.getModifierValuesFromData(data));
    }
    /** Applies modification data to an enemy ModifierValue[] array, returning the mutated array */
    modifyEnemyModifierValues(modifiers, modData) {
        return this._modifyModifierValues(modifiers, modData, (key) => this.modifierRegistry.getEnemyAlias(key), (data) => this.getEnemyModifierValuesFromData(data));
    }
    /** Constructs a Single or Table CombatEffectApplicator from data */
    getCombatEffectApplicatorFromData(data) {
        if ('tableID' in data)
            return TableCombatEffectApplicator.fromData(data, this);
        else
            return SingleCombatEffectApplicator.fromData(data, this);
    }
    /** Constructs an array of Single or Table CombatEffectApplictors from an array of data */
    getCombatEffectApplicatorsFromData(data) {
        return data.map((d) => this.getCombatEffectApplicatorFromData(d));
    }
    /** Constructs a Single or Table CombatEffectApplicator from data */
    getCombatEffectApplicatorWithTriggerFromData(data) {
        if ('tableID' in data)
            return TableCombatEffectApplicator.fromDataWithTrigger(data, this);
        else
            return SingleCombatEffectApplicator.fromDataWithTrigger(data, this);
    }
    /** Constructs an array of Single or Table CombatEffectApplictors from an array of data */
    getCombatEffectApplicatorsWithTriggersFromData(data) {
        return data.map((d) => this.getCombatEffectApplicatorWithTriggerFromData(d));
    }
    /** Applies modification data to a CombatEffectApplicator array. Removals are processed before additions. */
    modifyCombatEffectApplicators(applicators, modData, className = 'Unknown') {
        if (modData.removeEffect !== undefined) {
            modData.removeEffect.forEach((effectID) => {
                const effectIndex = applicators.findIndex((a) => {
                    return a instanceof SingleCombatEffectApplicator && a.effect.id === effectID;
                });
                if (effectIndex < 0) {
                    console.warn(`Warning when removing combat effect applicator from ${className}, effect applicator with effect: ${effectID} does not exist in the ${className}'s combat effect applicators.`);
                    return;
                }
                applicators.splice(effectIndex, 1);
            });
        }
        if (modData.removeTable !== undefined) {
            modData.removeTable.forEach((tableID) => {
                const effectIndex = applicators.findIndex((a) => {
                    return a instanceof TableCombatEffectApplicator && a.table.id === tableID;
                });
                if (effectIndex < 0) {
                    console.warn(`Warning when removing table combat effect applicator from ${className}, effect applicator with effect table: ${tableID} does not exist in the ${className}'s combat effect applicators.`);
                    return;
                }
                applicators.splice(effectIndex, 1);
            });
        }
        if (modData.add !== undefined) {
            applicators.push(...this.getCombatEffectApplicatorsWithTriggersFromData(modData.add));
        }
    }
    getRequirementFromData(data) {
        switch (data.type) {
            case 'DungeonCompletion':
                return new DungeonRequirement(data, this);
            case 'StrongholdCompletion':
                return new StrongholdRequirement(data, this);
            case 'AbyssDepthCompletion':
                return new AbyssDepthRequirement(data, this);
            case 'SkillLevel':
                return new SkillLevelRequirement(data, this);
            case 'ShopPurchase':
                return new ShopPurchaseRequirement(data, this);
            case 'SlayerItem':
                return new SlayerItemRequirement(data, this);
            case 'ItemFound':
                return new ItemFoundRequirement(data, this);
            case 'MonsterKilled':
                return new MonsterKilledRequirement(data, this);
            case 'TownshipBuilding':
                return new TownshipBuildingRequirement(data, this);
            case 'AllSkillLevels':
                return new AllSkillLevelRequirement(data, this);
            case 'SlayerTask':
                return new SlayerTaskRequirement(data, this);
            case 'Completion':
                return new CompletionRequirement(data, this);
            case 'TownshipTask':
                return new TownshipTaskCompletionRequirement(data, this);
            case 'CartographyHexDiscovery':
                return new CartographyHexDiscoveryRequirement(data, this);
            case 'CartographyPOIDiscovery':
                return new CartographyPOIDiscoveryRequirement(data, this);
            case 'ArchaeologyItemsDonated':
                return new ArchaeologyItemsDonatedRequirement(data, this);
            case 'AbyssalLevel':
                return new AbyssalLevelRequirement(data, this);
            case 'SkillTreeNodeUnlocked':
                return new SkillTreeNodeUnlockedRequirement(data, this);
            case 'MasteryLevel':
                return new MasteryLevelRequirement(data, this);
        }
    }
    /** Takes an array of requirement data, and returns an array of requirements */
    getRequirementsFromData(data) {
        return data.map((reqData) => this.getRequirementFromData(reqData));
    }
    /**
     * Takes an array of requirements and applies data modifications to them
     * @param requirements The requirements to modify
     * @param modData The modifications to apply
     * @returns The modified requirements array
     */
    modifyRequirements(requirements, modData) {
        if (modData.remove !== undefined) {
            const removals = modData.remove;
            requirements = requirements.filter((req) => !removals.includes(req.type));
        }
        if (modData.add !== undefined) {
            requirements.push(...this.getRequirementsFromData(modData.add));
        }
        return requirements;
    }
    /** Constructs a CurrencyQuantity object from data */
    getCurrencyQuantity(data) {
        const currency = this.currencies.getObjectByID(data.id);
        if (currency === undefined)
            throw new Error(`Error getting CurrencyQuantity. Currency with id: ${data.id} is not registered.`);
        return {
            currency,
            quantity: data.quantity
        };
    }
    /** Constructs an array of CurrencyQuantity objects from data */
    getCurrencyQuantities(data) {
        return data.map((o) => this.getCurrencyQuantity(o));
    }
    modifyCurrencyQuantities(quantities, data) {
        if (data.remove !== undefined) {
            const removals = data.remove;
            quantities = quantities.filter(({
                currency
            }) => !removals.includes(currency.id));
        }
        if (data.add !== undefined) {
            quantities.push(...this.getCurrencyQuantities(data.add));
        }
        return quantities;
    }
    getEquipmentSlotID(slotID) {
        if (!slotID.includes(':'))
            slotID = `${"melvorD" /* Namespaces.Demo */}:${slotID}`;
        return slotID;
    }
    /** Gets EquipmentSlots from an array of ids. Supports local IDs for demo slots. */
    getEquipmentSlotsFromData(data) {
        return data.map((slotID) => {
            slotID = this.getEquipmentSlotID(slotID);
            const slot = this.equipmentSlots.getObjectByID(slotID);
            if (slot === undefined)
                throw new Error(`Error getting EquipmentSlot. Slot with id: ${slotID} is not registered.`);
            return slot;
        });
    }
    getSkillValuesFromData(data) {
        return data.map(({
            skillID,
            value
        }) => {
            return {
                skill: this.skills.getObjectSafe(skillID),
                value,
            };
        });
    }
    getDummyData(fullID) {
        const [name, localID] = fullID.split(':');
        let dataNamespace = this.dummyNamespaces.getNamespace(name);
        if (dataNamespace === undefined) {
            dataNamespace = this.dummyNamespaces.registerNamespace(name, 'Error: Unregistered Namespace', !name.startsWith('melvor'));
        }
        return {
            dataNamespace,
            localID
        };
    }
    constructDummyObject(id, constructor) {
        const dummyData = this.getDummyData(id);
        return new constructor(dummyData.dataNamespace, dummyData.localID, this);
    }
    startMainLoop() {
        if (!this.loopStarted) {
            this.previousTickTime = performance.now();
            this._previousLoopTime = Date.now();
            this.loopInterval = window.setInterval(this.loop.bind(this), TICK_INTERVAL);
            this.loopStarted = true;
            logConsole('Starting Main Game Loop.');
        } else {
            if (DEBUGENABLED)
                console.warn('Game loop was already started.');
        }
    }
    stopMainLoop() {
        if (this.loopStarted) {
            clearInterval(this.loopInterval);
            this.loopStarted = false;
            logConsole('Stopping Main Game Loop.');
            this.blockInteraction();
        } else {
            if (DEBUGENABLED)
                console.warn('Game loop was already stopped');
        }
    }
    /** Adds an invisible overlay that blocks interaction with the game, while the main loop is paused. Removed when the game loops once. */
    blockInteraction() {
        var _a;
        (_a = document.getElementById('interaction-blocker')) === null || _a === void 0 ? void 0 : _a.classList.remove('d-none');
        this.interactionBlocked = true;
    }
    /** Removes the invisible overlay that blocks interaction. Called when the game loops and interaction is blocked */
    unblockInteraction() {
        var _a;
        (_a = document.getElementById('interaction-blocker')) === null || _a === void 0 ? void 0 : _a.classList.add('d-none');
        this.interactionBlocked = false;
    }
    pauseActiveSkill() {
        if (this._isPaused)
            return;
        this._isPaused = true;
        if (this.pausedAction === undefined) {
            this.pausedAction = this.activeAction;
            this.activeAction = undefined;
        }
    }
    unpauseActiveSkill() {
        if (!this._isPaused)
            return;
        this._isPaused = false;
        if (this.pausedAction !== undefined) {
            this.activeAction = this.pausedAction;
            this.pausedAction = undefined;
        } else if (this.isGolbinRaid) {
            this.activeAction = undefined;
        }
    }
    /** Attempts to stop the currently active action, if it belongs to a skill other than the specified one.
     *  Returns true if the active action could not be stopped
     */
    idleChecker(action) {
        if (this.isGolbinRaid)
            return true;
        if (this.activeAction === undefined)
            return false;
        if (this.activeAction !== action) {
            return !this.activeAction.stop();
        }
        return false;
    }
    stopActiveAction() {
        var _a;
        (_a = this.activeAction) === null || _a === void 0 ? void 0 : _a.stop();
    }
    /** Things to do after a save has loaded */
    onLoad() {
        var _a;
        this.renderQueue.activeSkills = true;
        this.renderQueue.sidebarSkillUnlock = true;
        // Retroactive bugfix for stopping an active skill during raid
        if (this.golbinRaid.raidRunning && this.activeAction !== this.golbinRaid) {
            if (this.pausedAction !== undefined) {
                const paused = this.pausedAction;
                if (!(paused instanceof BaseManager) && !paused.isActive)
                    this.pausedAction = undefined;
            }
            const currentActive = this.activeAction;
            if (currentActive !== undefined && !(currentActive instanceof BaseManager) && currentActive.isActive)
                this.pausedAction = this.activeAction;
            this.activeAction = this.golbinRaid;
        }
        // Retroactive bugfix for bad pause state
        if (this.isPaused && this.pausedAction === undefined && !this.isGolbinRaid)
            this._isPaused = false;
        // This should allow offline progress to go off if the game was in a paused state when it was last saved
        if (this.pausedAction !== undefined && !this.isGolbinRaid) {
            this.activeAction = this.pausedAction;
            this.pausedAction = undefined;
            this._isPaused = false;
            logConsole('Game was paused on load. Setting state to unpaused.');
        }
        // Retroactive bugfix for perma thieving stun
        if (this.thieving.isActive && this.activeAction !== this.thieving && this.pausedAction !== this.thieving) {
            this.disableClearOffline = true;
            this.thieving.resetActionState();
            this.disableClearOffline = false;
        }
        // Retroactive bugfix for having an active action that isn't actually active
        if (this.activeAction !== undefined && !this.activeAction.isActive)
            this.activeAction = undefined;
        this.setUpGamemodeOnLoad();
        this.computeTokenItemStats(false);
        this.skills.forEach((skill) => {
            skill.onLoad();
        });
        this.completion.onLoad();
        this.bank.onLoad();
        this.potions.onLoad();
        this.petManager.onLoad();
        this.shop.onLoad();
        this.combat.initialize();
        this.currencies.forEach((currency) => currency.onLoad());
        this.settings.initializeToggles();
        this.settings.initializeChoices();
        this.township.postStatLoad();
        this.township.casualTasks.onLoad();
        this.township.tasks.onLoad();
        this.settings.onLoad();
        this.keyboard.onSaveLoad();
        (_a = this.archaeology) === null || _a === void 0 ? void 0 : _a.postLoad();
        this.clueHunt.onLoad();
        this.realmManager.onLoad();
        this.renderQueue.birthdayEventProgress = true;
        this.renderQueue.realmVisibility = true;
        this.realms.forEach((realm) => {
            this.renderQueue.realmSidebarVisibility.add(realm);
        });
        this.renderQueue.sidebarSkillOpacity = true;
        this.renderQueue.sidebarClass = true;
        // Assign Game interaction detection
        document.addEventListener('keydown', () => this.onGameInteraction());
        document.addEventListener('pointerdown', () => this.onGameInteraction());
        document.addEventListener('wheel', () => this.onGameInteraction());
    }
    /** Performs set up tasks for the current gamemode when loading a save */
    setUpGamemodeOnLoad() {
        var _a, _b;
        // Disable Modifiers due to the gamemode
        this.currentGamemode.disabledModifiers.forEach((modifier) => (modifier.disabled = true));
        // Set up skill unlock requirements
        if (!this.currentGamemode.useDefaultSkillUnlockRequirements) {
            this.skills.forEach((skill) => (skill.unlockRequirements = []));
        }
        this.currentGamemode.skillUnlockRequirements.forEach((requirements, skill) => {
            skill.unlockRequirements = requirements;
        });
        // Set up skill level Caps
        (_a = this.currentGamemode.initialLevelCaps) === null || _a === void 0 ? void 0 : _a.forEach(({
            skill,
            value
        }) => {
            if (!skill.levelCapSet)
                skill.setLevelCap(value);
        });
        const defaultLevelCap = this.currentGamemode.defaultInitialLevelCap;
        if (defaultLevelCap !== undefined) {
            this.skills.forEach((skill) => {
                if (!skill.levelCapSet)
                    skill.setLevelCap(defaultLevelCap);
            });
        }
        (_b = this.currentGamemode.initialAbyssalLevelCaps) === null || _b === void 0 ? void 0 : _b.forEach(({
            skill,
            value
        }) => {
            if (!skill.abyssalLevelCapSet)
                skill.setAbyssalLevelCap(value);
        });
        const defaultAbyssalLevelCap = this.currentGamemode.defaultInitialAbyssalLevelCap;
        if (defaultAbyssalLevelCap !== undefined) {
            this.skills.forEach((skill) => {
                if (!skill.abyssalLevelCapSet)
                    skill.setAbyssalLevelCap(defaultAbyssalLevelCap);
            });
        }
        this.currentGamemode.levelCapIncreases.forEach((capIncrease) => {
            if (this.activeLevelCapIncreases.includes(capIncrease))
                return;
            this.activeLevelCapIncreases.push(capIncrease);
            capIncrease.requirementSets.forEach((reqSet) => {
                // Give level caps that have been added to the gamemode
                this.increaseSkillLevelCaps(capIncrease, reqSet);
            });
        });
        this.activeLevelCapIncreases.forEach((capIncrease) => {
            let checkSetIncreases = false;
            capIncrease.requirementSets.forEach((reqSet) => {
                if (!checkSetIncreases && capIncrease.setIncreases.length > 0 && this.checkRequirements(reqSet.requirements))
                    checkSetIncreases = true;
                reqSet.requirements.forEach((req) => {
                    switch (req.type) {
                        case 'DungeonCompletion':
                            req.dungeon.skillUnlockCompletions.push(req.count);
                            break;
                        case 'AbyssDepthCompletion':
                            req.depth.skillUnlockCompletions.push(req.count);
                            break;
                        case 'StrongholdCompletion':
                            req.stronghold.skillUnlockCompletions.push(req.count);
                            break;
                    }
                });
                if (reqSet.given)
                    return;
                reqSet.unlisteners = reqSet.requirements.map((req) => {
                    return req.assignHandler(() => this.increaseSkillLevelCaps(capIncrease, reqSet));
                });
            });
            if (checkSetIncreases) {
                // Checks that all set increases have been properly given
                capIncrease.setIncreases.forEach(({
                    skill,
                    value
                }) => {
                    switch (capIncrease.levelType) {
                        case 'Standard':
                            if (skill.isLevelCapBelow(value))
                                skill.applySetLevelCap(value);
                            break;
                        case 'Abyssal':
                            if (skill.isAbyssalLevelCapBelow(value))
                                skill.applySetAbyssalLevelCap(value);
                            break;
                    }
                });
            }
        });
        this.validateRandomLevelCapIncreases();
        this.dungeons.forEach((a) => a.skillUnlockCompletions.sort((a, b) => a - b));
        this.abyssDepths.forEach((a) => a.skillUnlockCompletions.sort((a, b) => a - b));
        this.strongholds.forEach((a) => a.skillUnlockCompletions.sort((a, b) => a - b));
        if (this.currentGamemode.levelCapCost !== undefined) {
            this.currentGamemode.levelCapCost.skillLevelGates.forEach((skill) => (skill.isGatingLevelCapPurchases = true));
        }
        if (this.currentGamemode.abyssalLevelCapCost !== undefined) {
            this.currentGamemode.abyssalLevelCapCost.skillLevelGates.forEach((skill) => (skill.isGatingAbyssalLevelCapPurchases = true));
        }
        combatSkillProgressTable.updateLevelCapButtons(this);
    }
    /** Processes time since the last setInterval */
    processTime() {
        const currentTickTime = performance.now();
        let ticksToRun = Math.floor((currentTickTime - this.previousTickTime) / TICK_INTERVAL);
        if (ticksToRun > this.MAX_PROCESS_TICKS) {
            ticksToRun = this.MAX_PROCESS_TICKS;
            this.previousTickTime = currentTickTime - ticksToRun * TICK_INTERVAL;
        }
        this.runTicks(ticksToRun);
        this.previousTickTime += ticksToRun * TICK_INTERVAL;
    }
    /** Runs the specified amount of game ticks */
    runTicks(ticksToRun) {
        for (let i = 0; i < ticksToRun; i++) {
            this.tick();
        }
    }
    tick() {
        var _a;
        if (this.isGolbinRaid) {
            this.golbinRaid.activeTick();
        } else {
            this._passiveTickers.forEach((action) => {
                action.passiveTick();
            });
            (_a = this.activeAction) === null || _a === void 0 ? void 0 : _a.activeTick();
            this.combat.checkDeath();
        }
        // if (this.combat.enableStatParityCheck) this.combat.testInitializationStatParity();
    }
    queueRequirementRenders() {
        var _a;
        this.combat.renderQueue.areaRequirements = true;
        this.combat.renderQueue.spellBook = true;
        this.shop.renderQueue.requirements = true;
        this.lore.renderUnlocks = true;
        this.combat.renderQueue.areaSkillUnlock = true;
        if (((_a = game.openPage) === null || _a === void 0 ? void 0 : _a.id) === "melvorD:Township" /* PageIDs.Township */ ) {
            this.township.renderQueue.biomeRequirements = true;
            this.township.renderQueue.townSummary = true;
        }
        this._events.emit('requirementChange', new RequirementChangedEvent());
    }
    toggleAbyssalRealm() {
        if (!cloudManager.hasItAEntitlementAndIsEnabled)
            return;
        let realm = this.realms.getObjectSafe("melvorItA:Abyssal" /* RealmIDs.Abyssal */ );
        if (this.currentRealm === realm)
            realm = this.defaultRealm;
        this.selectRealm(realm);
    }
    selectRealm(realm) {
        if (this.currentRealm === realm)
            return;
        if (!realm.isUnlocked) {
            this.realmManager.showRealmUnlockRequirementsModal(realm);
            return;
        }
        SwalLocale.fire({
            title: templateLangString('MENU_TEXT_ENTERING_REALM', {
                realmName: realm.name
            }),
            html: `<div class="overflow-hidden"><div class="spinner-border spinner-border-sm text-info mr-2" role="status"></div><small>${getLangString('MENU_TEXT_POPUP_WILL_AUTO_CLOSE')}</small></div>`,
            showCancelButton: false,
            showConfirmButton: false,
            imageUrl: realm.media,
            imageWidth: 128,
            imageHeight: 128,
            imageAlt: realm.name,
        });
        if (DEBUGENABLED)
            console.log(`Setting global Realm to ${realm.name}`);
        window.setTimeout(() => {
            const oldRealm = this.currentRealm;
            this.currentRealm = realm;
            this.skills.forEach((skill) => {
                skill.selectRealm(realm);
                if (skill instanceof ArtisanSkill) {
                    skill.resetToDefaultSelectedRecipeBasedOnRealm();
                    skill.renderQueue.realmedCategorySelection = true;
                }
            });
            sidebar.category('Realm Selection').item('Select Realm').subitem(realm.id).nameEl.classList.add('text-success');
            sidebar
                .category('Realm Selection')
                .item('Select Realm')
                .subitem(oldRealm.id)
                .nameEl.classList.remove('text-success');
            this.combat.renderQueue.categoryVisibilityByRealm.add(realm);
            this.combat.renderQueue.realmVisibility.add(realm);
            this.renderQueue.sidebarSkillOpacity = true;
            this.renderQueue.sidebarClass = true;
            if (realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) {
                if (!this.settings.showAPNextToShopSidebar)
                    this.settings.toggleSetting('showAPNextToShopSidebar');
                if (!this.settings.showASCNextToSlayerSidebar)
                    this.settings.toggleSetting('showASCNextToSlayerSidebar');
                if (!this.settings.showSPNextToPrayerSidebar)
                    this.settings.toggleSetting('showSPNextToPrayerSidebar');
                if (this.settings.sidebarLevels !== 0 /* SidebarLevelSetting.Both */ )
                    this.settings.changeChoiceSetting('sidebarLevels', 2 /* SidebarLevelSetting.Abyssal */ );
            } else {
                if (this.settings.showAPNextToShopSidebar)
                    this.settings.toggleSetting('showAPNextToShopSidebar');
                if (this.settings.showASCNextToSlayerSidebar)
                    this.settings.toggleSetting('showASCNextToSlayerSidebar');
                if (this.settings.showSPNextToPrayerSidebar)
                    this.settings.toggleSetting('showSPNextToPrayerSidebar');
                if (this.settings.sidebarLevels !== 0 /* SidebarLevelSetting.Both */ )
                    this.settings.changeChoiceSetting('sidebarLevels', 1 /* SidebarLevelSetting.Normal */ );
            }
            sidebar.category('Into the Abyss').item('Abyssal Realm').nameEl.textContent = getLangString(`MENU_TEXT_${realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ? 'LEAVE' : 'ENTER'}_ABYSSAL_REALM`);
            window.setTimeout(() => {
                SwalLocale.close();
            }, 500);
        }, 1000);
    }
    render() {
        if (this.isGolbinRaid) {
            this.golbinRaid.render();
        } else {
            this.combat.render();
            this.skills.forEach((skill) => {
                skill.render();
            });
            this.tutorial.render();
        }
        this.renderGameTitle();
        this.renderCombatMinibar();
        this.renderActiveSkills();
        this.renderSidebarSkillUnlock();
        this.stats.renderMutatedStats();
        this.completion.render();
        this.bank.render();
        this.potions.render();
        this.itemCharges.render();
        this.shop.render();
        this.currencies.forEach((currency) => currency.render());
        this.minibar.render();
        this.lore.render();
        this.clueHunt.render();
        this.renderBirthdayEventProgress();
        skillTreeMenu.render();
        this.renderRealmVisibility();
        this.renderRealmSidebarVisibility();
        this.renderSidebarSkillOpacity();
        this.renderSidebarClass();
        openNextModal();
    }
    renderSidebarClass() {
        if (!this.renderQueue.sidebarClass)
            return;
        if (this.settings.useLegacyRealmSelection) {
            this.realmManager.removeSidebarTheme();
        } else {
            this.realmManager.setSidebarTheme(this.currentRealm);
        }
        this.renderQueue.sidebarClass = false;
    }
    renderSidebarSkillOpacity() {
        if (!this.renderQueue.sidebarSkillOpacity)
            return;
        this.skills.forEach((skill) => {
            skillNav.updateOpacity(skill, skill.shouldShowSkillInSidebar());
        });
        this.renderQueue.sidebarSkillOpacity = false;
    }
    renderRealmVisibility() {
        var _a, _b;
        if (!this.renderQueue.realmVisibility)
            return;
        if (this.settings.useLegacyRealmSelection ||
            this.realms.size < 2 ||
            (cloudManager.hasItAEntitlementAndIsEnabled &&
                this.unlockedRealms.length < 3 &&
                this.realms.filter((realm) => realm.showIfLocked).length === 2 &&
                this.realms.allObjects.includes(this.realms.getObjectSafe("melvorItA:Abyssal" /* RealmIDs.Abyssal */ )))) {
            // Hide realm selection if legacy option enabled, only one realm exists, or if the only two realms available are the default realm and abyssal realm
            (_a = sidebar.category('Realm Selection').rootEl) === null || _a === void 0 ? void 0 : _a.classList.add('d-none');
        } else {
            (_b = sidebar.category('Realm Selection').rootEl) === null || _b === void 0 ? void 0 : _b.classList.remove('d-none');
        }
        this.renderQueue.realmVisibility = false;
    }
    renderRealmSidebarVisibility() {
        if (this.renderQueue.realmSidebarVisibility.size < 1)
            return;
        this.renderQueue.realmSidebarVisibility.forEach((realm) => {
            var _a;
            (_a = this.realmSidebarSelect) === null || _a === void 0 ? void 0 : _a.updateRealmVisibility(realm);
        });
        this.renderQueue.realmSidebarVisibility.clear();
    }
    checkUniqueBirthdayEventCompletions() {
        if (!cloudManager.isBirthdayEvent2023Active())
            return;
        if (!this.birthdayEvent2023CompletionTracker[2]) {
            // BIRTHDAY PRESENTS
            const present1 = this.items.getObjectByID("melvorF:Birthday_Present_Gathering" /* ItemIDs.Birthday_Present_Gathering */ );
            const present2 = this.items.getObjectByID("melvorF:Birthday_Present_Artisan" /* ItemIDs.Birthday_Present_Artisan */ );
            const present3 = this.items.getObjectByID("melvorF:Birthday_Present_Utility" /* ItemIDs.Birthday_Present_Utility */ );
            const present4 = this.items.getObjectByID("melvorF:Birthday_Present_Combat" /* ItemIDs.Birthday_Present_Combat */ );
            if (present1 === undefined || present2 === undefined || present3 === undefined || present4 === undefined)
                return;
            const presentsFound = [present1, present2, present3, present4].every((present) => this.stats.itemFindCount(present) > 0);
            this.birthdayEvent2023CompletionTracker[2] = presentsFound;
        }
        if (!this.birthdayEvent2023CompletionTracker[3]) {
            this.birthdayEvent2023CompletionTracker[3] = true; //removed bday task
        }
    }
    updateBirthdayEventProgress() {
        if (!cloudManager.isBirthdayEvent2023Active())
            return;
        this.checkUniqueBirthdayEventCompletions();
        this.birthdayEvent2023CompletionTracker.forEach((isComplete, id) => {
            if (isComplete) {
                const elDiv = document.getElementById(`bday-2023-tracker-div-${id}`);
                const elIcon = document.getElementById(`bday-2023-tracker-icon-${id}`);
                elDiv === null || elDiv === void 0 ? void 0 : elDiv.classList.replace('text-warning', 'text-success');
                elIcon === null || elIcon === void 0 ? void 0 : elIcon.classList.remove('d-none');
            }
        });
        if (this.birthdayEvent2023CompletionTracker.every((isComplete) => isComplete)) {
            localStorage.setItem('birthdayGamemodeUnlocked', 'true'); //unlock bday gamemode
        }
    }
    renderBirthdayEventProgress() {
        if (!this.renderQueue.birthdayEventProgress || !cloudManager.isBirthdayEvent2023Active())
            return;
        this.updateBirthdayEventProgress();
        this.renderQueue.birthdayEventProgress = false;
    }
    renderGameTitle() {
        if (this.renderQueue.title) {
            let title = gameTitle;
            if (this.activeAction === this.combat || this.activeAction === this.thieving) {
                title = `${getLangString('SKILL_NAME_Hitpoints')} ${numberWithCommas(this.combat.player.hitpoints)}`;
            } else if (this.activeAction === this.golbinRaid) {
                title = `${getLangString('SKILL_NAME_Hitpoints')} ${numberWithCommas(this.golbinRaid.player.hitpoints)}`;
            }
            $('title').text(title);
        }
        this.renderQueue.title = false;
    }
    /** Updates the state of the combat minibar */
    renderCombatMinibar() {
        var _a;
        if (!this.renderQueue.combatMinibar)
            return;
        const minibar = document.getElementById('combat-footer-minibar');
        const inCombatLike = this.activeAction === this.combat || this.activeAction === this.golbinRaid;
        // Show minibar if in combat/golbin raid or thieving. If Display Combat Minibar on Combat Screen setting is active, the minibar will not show on the combat page.
        if (inCombatLike &&
            this.settings.showCombatMinibar &&
            !(((_a = this.openPage) === null || _a === void 0 ? void 0 : _a.id) === "melvorD:Combat" /* PageIDs.Combat */ && !this.settings.showCombatMinibarCombat)) {
            showElement(minibar);
        } else {
            hideElement(minibar);
        }
        this.renderQueue.combatMinibar = false;
    }
    /** Renders Skill unlock available in Ancient Relic gamemode */
    renderSidebarSkillUnlock() {
        if (!this.renderQueue.sidebarSkillUnlock)
            return;
        const sidebarItem = sidebar.category('').item('Ancient Relic Skill Unlock');
        if (this.levelCapIncreasesBeingSelected.length === 0) {
            if (sidebarItem.rootEl)
                sidebarItem.rootEl.classList.add('d-none');
        } else {
            if (sidebarItem.rootEl)
                sidebarItem.rootEl.classList.remove('d-none');
            const totalLeft = this.levelCapIncreasesBeingSelected.reduce((prev, increase) => prev + increase.randomIncreasesLeft, 0);
            if (sidebarItem.asideEl)
                sidebarItem.asideEl.textContent = `${totalLeft}`;
        }
        this.renderQueue.sidebarSkillUnlock = false;
    }
    /** Renders which skills are active in the sidebar */
    renderActiveSkills() {
        if (!this.renderQueue.activeSkills)
            return;
        skillNav.setAllInactive();
        if (this.activeAction !== undefined) {
            this.activeAction.activeSkills.forEach((skill) => {
                skillNav.setActive(skill);
            });
        }
        this.renderQueue.activeSkills = false;
    }
    resetTickTimestamp() {
        this.tickTimestamp = Date.now();
    }
    /** Triggers the game to enter the offline loop on its next loop */
    triggerOfflineLoop() {
        if (!this._isInOnlineLoop || this.isGolbinRaid)
            return;
        this._forceOfflineLoop = true;
    }
    loop() {
        const loopTime = Date.now();
        try {
            if (this._isInOnlineLoop) {
                const delta = Math.max(loopTime - this.tickTimestamp, 0);
                if ((delta >= this.MIN_OFFLINE_TIME || this._forceOfflineLoop) && !this.isGolbinRaid) {
                    this.enterOfflineLoop(loopTime);
                }
            } else {
                const timeOffset = loopTime - this._offlineInfo.startTime - this._offlineInfo.timeProcessed;
                if (timeOffset <= this.OFFLINE_EXIT_TIME || this._offlineInfo.timeProcessed >= this.MAX_OFFLINE_TIME) {
                    this.exitOfflineLoop(loopTime);
                }
            }
        } catch (e) {
            this.stopMainLoop();
            this.showBrokenGame(e, 'An error occured while changing loop states:');
            console.error(e);
            throw new Error(`An error occured while changing loop states: ${e}`);
        }
        if (this._isInOnlineLoop) {
            this.loopOnline(loopTime);
        } else {
            this.loopOffline(loopTime);
        }
        this._previousLoopTime = loopTime;
        if (this.interactionBlocked)
            this.unblockInteraction();
    }
    enterOfflineLoop(loopTime) {
        var _a, _b;
        this._isInOnlineLoop = false;
        loadingOfflineProgress = true;
        if (this.activeAction === this.combat &&
            (!this.settings.enableOfflineCombat ||
                (this.combat.selectedArea instanceof SlayerArea && !this.slayer.isUnlocked))) {
            this.combat.stop();
        }
        if (this.activeAction === this.thieving && !this.thieving.isUnlocked) {
            this.thieving.stop();
        }
        this.resetOfflineTracking();
        this._offlineInfo = {
            action: this.activeAction,
            snapshot: this.snapshotOffline(),
            startTime: this.tickTimestamp,
            timeProcessed: 0,
            tickRate: 1000,
        };
        (_b = (_a = this.activeAction) === null || _a === void 0 ? void 0 : _a.createOfflineSnapshot) === null || _b === void 0 ? void 0 : _b.call(_a);
        pauseModalQueue();
        if (this.activeAction !== undefined) {
            const offlineProgress = createElement('offline-progress');
            addModalToQueue({
                title: getLangString('MISC_STRING_3'),
                html: offlineProgress,
                imageUrl: this.activeAction.media,
                imageWidth: 64,
                imageHeight: 64,
                imageAlt: getLangString('CHARACTER_SELECT_88'),
                allowOutsideClick: false,
                allowEscapeKey: false,
            });
            this._offlineInfo.offlineProgress = offlineProgress;
        }
        $('#modal-offline-loading').modal('show');
        this._events.emit('offlineLoopEntered', new GameEvent());
    }
    exitOfflineLoop(loopTime) {
        this._isInOnlineLoop = true;
        loadingOfflineProgress = false;
        const info = this._offlineInfo;
        if (info.action !== undefined && info.snapshot !== undefined && info.offlineProgress !== undefined) {
            const newSnapshot = this.snapshotOffline();
            info.offlineProgress.setMessages(this, info.snapshot, newSnapshot, info.timeProcessed, info.action);
            this.trackOfflineTelemetry(info.snapshot, newSnapshot, info.timeProcessed);
        }
        $('#modal-offline-loading').modal('hide');
        resumeModalQueue();
        this.tickTimestamp = Date.now();
        this.previousTickTime = performance.now() - (loopTime - this._previousLoopTime);
        this.combat.notifications.clear();
        this._offlineInfo = {
            startTime: 0,
            timeProcessed: 0,
            tickRate: 1000,
        };
        this._forceOfflineLoop = false;
        this._events.emit('offlineLoopExited', new GameEvent());
    }
    /** The main loop for when the game is processing online */
    loopOnline(loopTime) {
        if (!this.isGolbinRaid)
            this.tickTimestamp = loopTime;
        try {
            this.processTime();
        } catch (e) {
            this.stopMainLoop();
            this.showBrokenGame(e, 'An error occurred while processing ticks:');
            console.error(e);
            throw new Error(`An error occurred while processing ticks: ${e}.`);
        }
        if (this.enableRendering) {
            try {
                this.render();
            } catch (e) {
                this.stopMainLoop();
                this.showBrokenGame(e, 'An error occurred while rendering:');
                console.error(e);
                throw new Error(`An error occurred while rendering: ${e}.`);
            }
        }
        // Perform Long scheduled tasks
        this.autoSave(loopTime);
        this.cloudUpdate(loopTime);
        this.updateRichPresence(loopTime);
        this.gameInteractionUpdate(loopTime);
        processScheduledItemNotifications();
    }
    /** The main loop for when the game is processing offline time */
    loopOffline(loopTime) {
        var _a;
        try {
            const totalTime = Math.min(loopTime - this._offlineInfo.startTime, this.MAX_OFFLINE_TIME);
            const ticksLeft = Math.floor((totalTime - this._offlineInfo.timeProcessed) / TICK_INTERVAL);
            const tStart = performance.now();
            const ticksToRun = Math.min(this._offlineInfo.tickRate, ticksLeft);
            this._offlineInfo.timeProcessed += ticksToRun * TICK_INTERVAL;
            this.runTicks(ticksToRun);
            const tEnd = performance.now();
            const tDiff = Math.max(tEnd - tStart, 1);
            const ticksPerMillisecond = ticksToRun / tDiff;
            let newTickRate = Math.floor(ticksPerMillisecond * TICK_INTERVAL * this.OFFLINE_GC_RATIO);
            newTickRate = Math.max(newTickRate, 1);
            this._offlineInfo.tickRate = newTickRate;
            offlineLoading.updateProgress(this._offlineInfo.timeProcessed, totalTime, ticksPerMillisecond * 1000);
        } catch (e) {
            const modError = mod.getModErrorFromError(e);
            const errorLog = this.getErrorLog(e, 'An error occured while processing ticks offline:', modError);
            offlineLoading.setError(e, modError, errorLog);
            // Attempt to stop the currently active skill
            (_a = this.activeAction) === null || _a === void 0 ? void 0 : _a.stop();
        }
    }
    getErrorLog(error, title, modError) {
        var _a, _b;
        let errorBody = 'Could not parse error';
        if (error instanceof Error) {
            errorBody = '';
            const stackTrace = (_a = modError.stack) !== null && _a !== void 0 ? _a : 'Stack not available';
            if (modError.mods.length > 0) {
                errorBody += `\nError due to the following mods:\n`;
                errorBody += modError.mods.map((mod) => `${mod.name} (v${mod.version})`).join('\n');
                errorBody += '\n\n';
            }
            errorBody += `Error Name: ${error.name}
Error Message: ${error.message}
Stack Trace:
${stackTrace}`;
        } else if (typeof error === 'string') {
            errorBody = error;
        }
        let equipmentText = 'Current Equipment:\n';
        let equipmentToLog;
        if (this.isGolbinRaid) {
            equipmentToLog = this.golbinRaid.player.equipment;
        } else {
            equipmentToLog = this.combat.player.equipment;
        }
        equipmentToLog.equippedArray.forEach((equippedItem) => {
            if (equippedItem.providesStats)
                equipmentText += `${equippedItem.slot.id}: ${equippedItem.item.id}\n`;
        });
        let activeSkillLog = 'No Active Action Information\n';
        if (this.activeAction !== undefined) {
            activeSkillLog = 'Action Information:\n';
            activeSkillLog += this.activeAction.getErrorLog();
        }
        let moddingLog = 'Modding Disabled';
        if (mod.manager.isEnabled()) {
            moddingLog = 'Modding Enabled. Loaded mods:\n';
            moddingLog += mod.manager.getLoadedModList().join('\n');
        }
        const errorMessage = `${title}
${errorBody}

Active Action: ${(_b = this.activeAction) === null || _b === void 0 ? void 0 : _b.id}
${equipmentText}
${activeSkillLog}
${moddingLog}`;
        return errorMessage;
    }
    showBrokenGame(error, title) {
        const modError = mod.getModErrorFromError(error);
        const errorLog = this.getErrorLog(error, title, modError);
        showGameErrorModal(title, errorLog, modError.mods);
    }
    clearActiveAction(save = true) {
        if (!this.disableClearOffline) {
            this.activeAction = undefined;
            if (save)
                this.scheduleSave();
            deleteScheduledPushNotification('offlineSkill');
        }
    }
    /** Clears an action that was paused or active, if it is in either state */
    clearActionIfActiveOrPaused(action) {
        if (this.pausedAction === action)
            this.pausedAction = undefined;
        if (this.activeAction === action)
            this.activeAction = undefined;
    }
    trackOfflineTelemetry(oldSnapshot, newSnapshot, timeDiff) {
        newSnapshot.experience.forEach((newXP, skill) => {
            var _a, _b, _c;
            const oldXP = (_a = oldSnapshot.experience.get(skill)) !== null && _a !== void 0 ? _a : 0;
            if (Math.floor(newXP - oldXP) > 0) {
                const oldLevel = (_b = oldSnapshot.levels.get(skill)) !== null && _b !== void 0 ? _b : 0;
                const newLevel = (_c = newSnapshot.levels.get(skill)) !== null && _c !== void 0 ? _c : 0;
                this.telemetry.createOfflineXPGainEvent(skill, timeDiff, oldXP, newXP, oldLevel, newLevel);
            }
        });
        newSnapshot.abyssalExperience.forEach((newAXP, skill) => {
            var _a, _b, _c;
            const oldAXP = (_a = oldSnapshot.abyssalExperience.get(skill)) !== null && _a !== void 0 ? _a : 0;
            if (Math.floor(newAXP - oldAXP) > 0) {
                const oldLevel = (_b = oldSnapshot.abyssalLevels.get(skill)) !== null && _b !== void 0 ? _b : 0;
                const newLevel = (_c = newSnapshot.abyssalLevels.get(skill)) !== null && _c !== void 0 ? _c : 0;
                this.telemetry.createOfflineAXPGainEvent(skill, timeDiff, oldAXP, newAXP, oldLevel, newLevel);
            }
        });
        newSnapshot.monsterKills.forEach((newKills, monster) => {
            var _a;
            const killDiff = newKills - ((_a = oldSnapshot.monsterKills.get(monster)) !== null && _a !== void 0 ? _a : 0);
            if (killDiff > 0) {
                this.telemetry.createMonsterKillEvent(monster, killDiff);
            }
        });
        this.items.forEach((item) => {
            var _a, _b, _c, _d, _e, _f;
            const qtyDiff = ((_a = newSnapshot.bank.get(item)) !== null && _a !== void 0 ? _a : 0) - ((_b = oldSnapshot.bank.get(item)) !== null && _b !== void 0 ? _b : 0);
            if (qtyDiff > 0) {
                this.telemetry.createItemGainedEvent(item, qtyDiff, `Skill.${(_d = (_c = this.activeAction) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : 'Unknown'}`);
            } else if (qtyDiff < 0) {
                this.telemetry.createItemRemovedFromBankEvent(item, qtyDiff, `Skill.${(_f = (_e = this.activeAction) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : 'Unknown'}`);
            }
        });
        this.telemetry.fireEventType('offline_xp_gain'); // Immediately fire offline xp gain event so next event is a fresh start
        this.telemetry.fireEventType('offline_abyssal_xp_gain'); // Immediately fire offline xp gain event so next event is a fresh start
        this.telemetry.fireEventType('monster_killed');
    }
    snapshotOffline() {
        const monsterKills = new Map();
        this.monsters.forEach((monster) => monsterKills.set(monster, this.stats.monsterKillCount(monster)));
        const strongholdCompletion = new Map();
        this.strongholds.forEach((stronghold) => strongholdCompletion.set(stronghold, stronghold.timesCompleted));
        const abyssDepthCompletion = new Map();
        this.abyssDepths.forEach((depth) => abyssDepthCompletion.set(depth, depth.timesCompleted));
        const experience = new Map();
        const levels = new Map();
        const abyssalExperience = new Map();
        const abyssalLevels = new Map();
        const ancientRelics = new Map();
        this.skills.forEach((skill) => {
            experience.set(skill, skill.xp);
            levels.set(skill, skill.level);
            abyssalExperience.set(skill, skill.abyssalXP);
            abyssalLevels.set(skill, skill.abyssalLevel);
            ancientRelics.set(skill, skill.getAncientRelicsSnapshot());
        });
        const currencies = new Map();
        this.currencies.forEach((currency) => currencies.set(currency, currency.amount));
        const snapshot = {
            currencies,
            prayerPoints: this.combat.player.prayerPoints,
            soulPoints: this.combat.player.soulPoints,
            experience,
            levels,
            food: this.combat.player.food.slots.map((food) => {
                return {
                    item: food.item,
                    quantity: food.quantity
                };
            }),
            equipment: this.combat.player.equipment.getSnapshot(),
            bank: this.bank.getSnapShot(),
            loot: this.combat.loot.getSnapshot(),
            monsterKills,
            dungeonCompletion: this.combat.getDungeonCompletionSnapshot(),
            strongholdCompletion,
            abyssDepthCompletion,
            taskCompletions: this.combat.slayerTask.getTaskCompletionSnapshot(),
            summoningMarks: this.summoning.getMarkSnapshot(),
            itemCharges: this.itemCharges.getSnapShot(),
            cookingStockpile: this.cooking.getStockpileSnapshot(),
            meteorite: this.stats.meteoriteSnapshot(),
            onyxNode: this.stats.onyxSnapshot(),
            orichaNode: this.stats.orichaSnapshot(),
            ceruleanNode: this.stats.ceruleanSnapshot(),
            abycite: this.stats.abyciteSnapshot(),
            mysticite: this.stats.mysticiteSnapshot(),
            echocite: this.stats.echociteSnapshot(),
            nightopalNode: this.stats.nightopalSnapshot(),
            shadowpearlNode: this.stats.shadowpearlSnapshot(),
            moonstoneNode: this.stats.moonstoneSnapshot(),
            voidheartNode: this.stats.voidheartSnapshot(),
            ancientRelics,
            townshipHealth: this.township.townData.health,
            townshipStorageFull: this.township.isStorageFull,
            abyssalExperience,
            abyssalLevels,
            corruptionsUnlocked: this.corruption === undefined ? 0 : this.corruption.corruptionEffects.numberUnlocked,
        };
        return snapshot;
    }
    /** Resets properties used to track offline progress */
    resetOfflineTracking() {
        this.combat.resetOfflineTracking();
    }
    /** Puts the game in a state where offline will progress the amount specified */
    testForOffline(timeToGoBack) {
        return __awaiter(this, void 0, void 0, function*() {
            this.stopMainLoop();
            this.tickTimestamp -= timeToGoBack * 60 * 60 * 1000;
            game.skills.forEach((skill) => {
                skill.timeToLevelTracker.clear();
                skill.timeToLevelTicks = 0;
                skill.timeToLevelPercentStart = skill.nextAbyssalLevelProgress;
            });
            saveData();
            this.triggerOfflineLoop();
            this.startMainLoop();
        });
    }
    /** Schedules a save to occur after the next game loop */
    scheduleSave() {
        this._isSaveScheduled = true;
    }
    /** Handles checking if an auto or scheduled save should occur */
    autoSave(time) {
        if (this._isSaveScheduled || time - this.saveTimestamp >= AUTO_SAVE_INTERVAL) {
            saveData();
            this._isSaveScheduled = false;
        }
    }
    updateRichPresence(time) {
        if (time - this._lastRichPresenceUpdate >= RICH_PRESENCE_UPDATE_INTERVAL) {
            if (nativeManager.isSteam || nativeManager.isEpicGames) {
                try {
                    setDiscordRPCDetails();
                } catch (e) {
                    console.error(e);
                }
            }
            this._lastRichPresenceUpdate = time;
            if (!connectedToSteam || cloudManager.isTest)
                return;
            const sLevel = this.completion.skillLevelProgress.currentCount.getSum();
            const gm = this.currentGamemode.name;
            if (nativeManager.isUsingGreenworks) {
                parent.greenworks.setRichPresence('currentGamemode', gm);
                parent.greenworks.setRichPresence('skillLevel', '' + sLevel + '');
                parent.greenworks.setRichPresence('steam_display', '#Status_gamemodeSkillLevel');
            } else if (nativeManager.isUsingSteamworks) {
                parent.steamworksClient.localplayer.setRichPresence('currentGamemode', gm);
                parent.steamworksClient.localplayer.setRichPresence('skillLevel', '' + sLevel + '');
                parent.steamworksClient.localplayer.setRichPresence('steam_display', '#Status_gamemodeSkillLevel');
            }
        }
    }
    /** Controls the throttling of the PIXI.js framerate when the player is inactive */
    gameInteractionUpdate(time) {
        var _a;
        this._inactivityTime -= time - this._previousLoopTime;
        if (!this._frameRateThrottled &&
            ((this.settings.throttleFrameRateOnInactivity && this._inactivityTime <= 0) ||
                ((_a = this.openPage) === null || _a === void 0 ? void 0 : _a.id) !== "melvorAoD:Cartography" /* PageIDs.Cartography */ )) {
            PIXI.Ticker.shared.maxFPS = 10;
            this._frameRateThrottled = true;
        }
    }
    onGameInteraction() {
        var _a;
        this._inactivityTime = this.INACTIVITY_INTERVAL;
        if (this._frameRateThrottled && ((_a = this.openPage) === null || _a === void 0 ? void 0 : _a.id) === "melvorAoD:Cartography" /* PageIDs.Cartography */ ) {
            PIXI.Ticker.shared.maxFPS = this.settings.cartographyFrameRateCap;
            this._frameRateThrottled = false;
        }
    }
    cloudUpdate(time) {
        // TODO There is a good chance most of these functions could be wrapped into the cloudManager IIFE to prevent tampering with the auto-cloudsave
        if (time - this._lastCloudUpdate >= CLOUD_UPDATE_INTERVAL) {
            cloudManager.checkForPlayFabTokenRefresh();
            cloudManager.checkForPlayFabAutoSave();
            cloudManager.isAllowedToSaveToPlayFab ?
                cloudManager.enableForceSyncButton() :
                cloudManager.disableForceSyncButton();
            cloudManager.updateLastSaveTimestampText();
            this._lastCloudUpdate = time;
        }
    }
    generateSaveString() {
        this.saveTimestamp = Date.now();
        const writer = new SaveWriter('Write', 8192, this._lastSaveBodySize, this._lastSaveHeaderSize);
        this.encode(writer);
        const saveString = writer.getSaveString(this.getSaveHeader());
        this._lastSaveBodySize = writer.dataSize;
        this._lastSaveHeaderSize = writer.headerSize;
        return saveString;
    }
    /** Attempts to get a header from a save string. If save is invalid, returns undefined instead. */
    getHeaderFromSaveString(saveString) {
        var _a;
        return __awaiter(this, void 0, void 0, function*() {
            try {
                const reader = new SaveWriter('Read', 1);
                const header = reader.getHeaderFromSaveString(saveString, this);
                if (header.saveVersion > currentSaveVersion)
                    return 2 /* SaveLoadError.InvalidVersion */ ;
                else
                    return header;
            } catch (e) {
                if (e instanceof Error && e.message === 'String is not save.') {
                    try {
                        const idMap = yield getNumericIDMap();
                        const {
                            saveGame
                        } = getSaveFromString(saveString, idMap);
                        const gamemodeID = idMap.gameModes[saveGame.currentGamemode];
                        if (gamemodeID === undefined)
                            throw new Error(`No Gamemode maps to: ${saveGame.currentGamemode}`);
                        let currentGamemode = this.gamemodes.getObjectByID(gamemodeID);
                        if (currentGamemode === undefined) {
                            currentGamemode = new DummyGamemode(this.getDummyData(gamemodeID), this);
                        }
                        let offlineAction = undefined;
                        if (saveGame.offline.skill !== null) {
                            offlineAction = this.activeActions.getObjectByID(idMap.offlineSkillToAction[saveGame.offline.skill]);
                        }
                        const header = {
                            saveVersion: saveGame.version,
                            characterName: saveGame.username,
                            currentGamemode,
                            totalSkillLevel: arrSum(saveGame.skillLevel),
                            gp: saveGame.gp,
                            offlineAction,
                            tickTimestamp: (_a = saveGame.offline.timestamp) !== null && _a !== void 0 ? _a : 0,
                            saveTimestamp: saveGame.saveTimestamp,
                            activeNamespaces: [],
                            modProfile: null,
                        };
                        if (header.saveVersion > currentSaveVersion)
                            return 2 /* SaveLoadError.InvalidVersion */ ;
                        else
                            return header;
                    } catch (_b) {
                        console.error(e);
                        return 1 /* SaveLoadError.Corrupt */ ; // Invalid save
                    }
                } else {
                    console.error(e);
                    return 1 /* SaveLoadError.Corrupt */ ; // Invalid save in new format
                }
            }
        });
    }
    getSaveHeader() {
        let offlineAction = this.activeAction;
        if (offlineAction === undefined)
            offlineAction = this.pausedAction;
        const activeNamespaces = [];
        this.registeredNamespaces.forEach((namespace) => {
            if (!namespace.isModded)
                activeNamespaces.push(namespace.name);
        });
        return {
            saveVersion: currentSaveVersion,
            characterName: this.characterName,
            currentGamemode: this.currentGamemode,
            totalSkillLevel: this.completion.skillLevelProgress.currentCount.getSum(),
            gp: this.gp.amount,
            offlineAction,
            tickTimestamp: this.tickTimestamp,
            saveTimestamp: this.saveTimestamp,
            activeNamespaces,
            modProfile: mod.manager.activeProfile,
        };
    }
    encode(writer) {
        writer.writeFloat64(this.tickTimestamp);
        writer.writeFloat64(this.saveTimestamp);
        writer.writeBoolean(this.activeAction !== undefined);
        if (this.activeAction !== undefined)
            writer.writeNamespacedObject(this.activeAction);
        writer.writeBoolean(this.pausedAction !== undefined);
        if (this.pausedAction !== undefined)
            writer.writeNamespacedObject(this.pausedAction);
        writer.writeBoolean(this._isPaused);
        writer.writeBoolean(this.merchantsPermitRead);
        writer.writeNamespacedObject(this.currentGamemode);
        writer.writeString(this.characterName);
        this.bank.encode(writer);
        this.combat.encode(writer);
        this.golbinRaid.encode(writer);
        this.minibar.encode(writer);
        this.petManager.encode(writer);
        this.shop.encode(writer);
        this.itemCharges.encode(writer);
        this.tutorial.encode(writer);
        this.potions.encode(writer);
        this.stats.encode(writer);
        this.settings.encode(writer);
        writer.writeArray(this.readNewsIDs, (newsID, writer) => {
            writer.writeString(newsID);
        });
        writer.writeString(this.lastLoadedGameVersion);
        nativeManager.encode(writer);
        // Write Skill Data
        writer.writeUint32(this.skills.size);
        this.skills.forEach((skill) => {
            writer.writeNamespacedObject(skill);
            writer.startMarkingWriteRegion();
            skill.encode(writer);
            writer.stopMarkingWriteRegion();
        });
        mod.encode(writer);
        this.completion.encode(writer);
        this.keyboard.encode(writer);
        writer.writeArray(this.birthdayEvent2023CompletionTracker, (completed, writer) => {
            writer.writeBoolean(completed);
        });
        this.clueHunt.encode(writer);
        // Encode Currencies
        writer.writeArray(this.currencies.allObjects, (currency, writer) => {
            writer.writeNamespacedObject(currency);
            currency.encode(writer);
        });
        // Encode area completions
        writer.writeArray(this.abyssDepths.allObjects, (depth, writer) => {
            writer.writeNamespacedObject(depth);
            writer.writeUint32(depth.timesCompleted);
        });
        writer.writeArray(this.strongholds.allObjects, (stronghold, writer) => {
            writer.writeNamespacedObject(stronghold);
            writer.writeUint32(stronghold.timesCompleted);
        });
        // Encode level up unlocks
        writer.writeArray(this.activeLevelCapIncreases, (capIncrease) => {
            writer.writeNamespacedObject(capIncrease);
            capIncrease.encode(writer);
        });
        writer.writeArray(this.levelCapIncreasesBeingSelected, writeNamespaced);
        writer.writeUint16(this._levelCapIncreasesBought);
        writer.writeUint16(this._abyssalLevelCapIncreasesBought);
        writer.writeNamespacedObject(this.currentRealm);
        return writer;
    }
    decode(reader, version) {
        let resetPaused = false;
        this.tickTimestamp = reader.getFloat64();
        this.saveTimestamp = reader.getFloat64();
        if (reader.getBoolean()) {
            const activeAction = reader.getNamespacedObject(this.activeActions);
            if (typeof activeAction !== 'string')
                this.activeAction = activeAction;
        }
        if (reader.getBoolean()) {
            const pausedAction = reader.getNamespacedObject(this.activeActions);
            if (typeof pausedAction === 'string')
                resetPaused = true;
            else
                this.pausedAction = pausedAction;
        }
        this._isPaused = reader.getBoolean();
        this.merchantsPermitRead = reader.getBoolean();
        const gamemode = reader.getNamespacedObject(this.gamemodes);
        if (typeof gamemode === 'string')
            throw new Error('Error loading save. Gamemode is not registered.');
        this.currentGamemode = gamemode;
        this.characterName = reader.getString();
        this.bank.decode(reader, version);
        this.combat.decode(reader, version);
        this.golbinRaid.decode(reader, version);
        this.minibar.decode(reader, version);
        this.petManager.decode(reader, version);
        this.shop.decode(reader, version);
        this.itemCharges.decode(reader, version);
        this.tutorial.decode(reader, version);
        this.potions.decode(reader, version);
        this.stats.decode(reader, version);
        this.settings.decode(reader, version);
        if (version < 100 /* SaveVersion.IntoTheAbyss */ ) {
            this.gp.decode(reader, version);
            this.slayerCoins.decode(reader, version);
            this.raidCoins.decode(reader, version);
        }
        this.readNewsIDs = reader.getArray((reader) => reader.getString());
        this.lastLoadedGameVersion = reader.getString();
        nativeManager.decode(reader, version);
        // Decode Skill Data
        const numSkills = reader.getUint32();
        for (let i = 0; i < numSkills; i++) {
            const skill = reader.getNamespacedObject(this.skills);
            const skillDataSize = reader.getUint32();
            if (typeof skill === 'string')
                reader.getFixedLengthBuffer(skillDataSize);
            else
                skill.decode(reader, version);
        }
        mod.decode(reader, version);
        if (version >= 26)
            this.completion.decode(reader, version);
        if (version >= 51)
            this.keyboard.decode(reader, version);
        if (resetPaused) {
            if (!this.isGolbinRaid)
                this._isPaused = false;
        }
        if (version < 113 /* SaveVersion.GamemodeLevelCaps */ ) {
            let skillUnlocks = [];
            let skillUnlocksRemaining = 0;
            let skillUnlocksRemainingPost99 = 0;
            if (version >= 54) {
                skillUnlocksRemaining = reader.getInt8();
                skillUnlocksRemaining = Math.max(skillUnlocksRemaining, 0);
                skillUnlocks = reader.getArray(readNamespacedReject(this.skills));
            }
            if (version >= 57) {
                skillUnlocksRemainingPost99 = reader.getInt8();
                skillUnlocksRemainingPost99 = Math.max(skillUnlocksRemainingPost99, 0);
            }
            if (skillUnlocksRemaining > 0) {
                if (this.currentGamemode.pre99RollConversion !== undefined) {
                    this.currentGamemode.pre99RollConversion.randomIncreasesLeft = skillUnlocksRemaining;
                    if (skillUnlocks.length > 0)
                        this.currentGamemode.pre99RollConversion.setSelectionFromSkills(skillUnlocks);
                }
            }
            if (skillUnlocksRemainingPost99 > 0) {
                if (this.currentGamemode.post99RollConversion !== undefined) {
                    this.currentGamemode.post99RollConversion.randomIncreasesLeft = skillUnlocksRemainingPost99;
                    if (skillUnlocks.length > 0)
                        this.currentGamemode.post99RollConversion.setSelectionFromSkills(skillUnlocks);
                }
            }
        }
        if (version >= 71) {
            this.birthdayEvent2023CompletionTracker = reader.getArray((reader) => reader.getBoolean());
            this.clueHunt.decode(reader, version);
        }
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            // Decode currencies
            reader.getArray((reader) => {
                const currency = reader.getNamespacedObject(this.currencies);
                if (typeof currency === 'string')
                    Currency.dumpData(reader, version);
                else
                    currency.decode(reader, version);
            });
            // Decode area completions
            reader.getArray((reader) => {
                const depth = reader.getNamespacedObject(this.abyssDepths);
                const timesCompleted = reader.getUint32();
                if (typeof depth !== 'string')
                    depth.timesCompleted = timesCompleted;
            });
            reader.getArray((reader) => {
                const stronghold = reader.getNamespacedObject(this.strongholds);
                const timesCompleted = reader.getUint32();
                if (typeof stronghold !== 'string')
                    stronghold.timesCompleted = timesCompleted;
            });
        }
        if (version >= 113 /* SaveVersion.GamemodeLevelCaps */ ) {
            this.activeLevelCapIncreases = reader.getArray((reader) => {
                const capIncrease = reader.getNamespacedObject(this.skillLevelCapIncreases);
                if (typeof capIncrease === 'string') {
                    SkillLevelCapIncrease.dumpData(reader, version);
                    return undefined;
                } else {
                    capIncrease.decode(reader, version);
                    return capIncrease;
                }
            });
            this.levelCapIncreasesBeingSelected = reader.getArray(readNamespacedReject(this.skillLevelCapIncreases));
        } else {
            this.activeLevelCapIncreases = [...this.currentGamemode.levelCapIncreases];
            this.activeLevelCapIncreases.forEach((capIncrease) => {
                capIncrease.requirementSets.forEach((reqSet) => (reqSet.given = this.checkRequirements(reqSet.requirements)));
            });
        }
        // Fix for level cap increases that are being selected but aren't in the array (Occurs due to save conversion pre GamemodeLevelCaps)
        this.activeLevelCapIncreases.forEach((capIncrease) => {
            if (capIncrease.randomIncreasesLeft > 0 && !this.levelCapIncreasesBeingSelected.includes(capIncrease))
                this.levelCapIncreasesBeingSelected.push(capIncrease);
        });
        if (version >= 114 /* SaveVersion.PurchasableLevelCaps */ ) {
            this._levelCapIncreasesBought = reader.getUint16();
            this._abyssalLevelCapIncreasesBought = reader.getUint16();
        }
        if (version < 100 /* SaveVersion.IntoTheAbyss */ &&
            (this.activeAction === this.thieving || this.activeAction === this.combat)) {
            this.combat.giveFreeDeath = true;
        }
        if (version >= 125 /* SaveVersion.ItANewRealmSelection */ ) {
            const realm = reader.getNamespacedObject(this.realms);
            if (typeof realm !== 'string') {
                this.currentRealm = realm;
            } else {
                this.skills.forEach((skill) => {
                    skill.realmLoadFailed = true;
                });
            }
        }
    }
    deserialize(reader, version, idMap) {
        this.combat.deserialize(reader.getVariableLengthChunk(), version, idMap);
        this.thieving.deserialize(reader.getVariableLengthChunk(), version, idMap);
        const oldActiveAction = idMap.activeActions[reader.getNumber()];
        if (oldActiveAction !== undefined) {
            const action = this.activeActions.getObjectByID(oldActiveAction);
            if (action !== undefined)
                this.activeAction = action;
        }
        const oldPausedAction = idMap.activeActions[reader.getNumber()];
        if (oldPausedAction !== undefined) {
            const action = this.activeActions.getObjectByID(oldPausedAction);
            if (action !== undefined)
                this.pausedAction = action;
        }
        this.merchantsPermitRead = reader.getBool();
        if (version >= 9) {
            this.stats.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.firemaking.deserialize(reader.getVariableLengthChunk(), version, idMap);
        }
        if (version >= 10) {
            this.mining.deserialize(reader.getVariableLengthChunk(), version, idMap);
        }
        if (version >= 12) {
            this.golbinRaid.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this._isPaused = reader.getBool();
            this.woodcutting.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.herblore.deserialize(reader.getVariableLengthChunk(), version, idMap);
        }
        if (version >= 13) {
            this.smithing.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.altMagic.deserialize(reader.getVariableLengthChunk(), version, idMap);
        }
        if (version >= 16) {
            this.runecrafting.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.crafting.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.fletching.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.summoning.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.fishing.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.cooking.deserialize(reader.getVariableLengthChunk(), version, idMap);
        }
        if (version >= 17) {
            this.agility.deserialize(reader.getVariableLengthChunk(), version, idMap);
            this.astrology.deserialize(reader.getVariableLengthChunk(), version, idMap);
        }
        if (version >= 18) {
            this.astrology.shouldRefundStardust = !reader.getBool();
        }
        if (version >= 20) {
            this.township.deserialize(reader.getVariableLengthChunk(), version, idMap);
        }
        // Bug fix for users that were in raid before it was saved.
        if (!this._isPaused && this.activeAction === this.golbinRaid) {
            this.activeAction = this.pausedAction;
        }
    }
    getLootTableWeight(table) {
        let totalWeight = this.dropWeightCache.get(table);
        if (totalWeight === undefined) {
            totalWeight = table.reduce((prev, loot) => prev + loot[1], 0);
            this.dropWeightCache.set(table, totalWeight);
        }
        return totalWeight;
    }
    getItemFromLootTable(table) {
        const dropRoll = Math.floor(Math.random() * this.getLootTableWeight(table));
        let itemWeight = 0;
        const lootIndex = table.findIndex((loot) => {
            itemWeight += loot[1];
            return dropRoll < itemWeight;
        });
        const itemID = table[lootIndex][0];
        const qty = rollInteger(1, table[lootIndex][2]);
        return {
            itemID,
            qty
        };
    }
    getSkillUnlockCount() {
        if (this.currentGamemode.startingSkills === undefined)
            return 0;
        const startingCount = this.currentGamemode.startingSkills.size;
        const currentlyUnlocked = this.skills.reduce((prev, skill) => {
            if (skill.isUnlocked)
                prev++;
            return prev;
        }, 0);
        return currentlyUnlocked - startingCount;
    }
    getSkillUnlockCost() {
        if (!this.currentGamemode.allowSkillUnlock)
            return 0;
        let costIndex = this.getSkillUnlockCount();
        costIndex = Math.min(costIndex, this.currentGamemode.skillUnlockCost.length - 1);
        return this.currentGamemode.skillUnlockCost[costIndex];
    }
    /** Processes level cap increases to skills */
    increaseSkillLevelCaps(capIncrease, reqSet) {
        if (!this.checkRequirements(reqSet.requirements))
            return;
        switch (capIncrease.levelType) {
            case 'Standard':
                capIncrease.fixedIncreases.forEach((skillIncrease) => {
                    skillIncrease.skill.applyLevelCapIncrease(skillIncrease);
                });
                capIncrease.setIncreases.forEach(({
                    skill,
                    value
                }) => {
                    skill.applySetLevelCap(value);
                });
                break;
            case 'Abyssal':
                capIncrease.fixedIncreases.forEach((skillIncrease) => {
                    skillIncrease.skill.applyAbyssalLevelCapIncrease(skillIncrease);
                });
                capIncrease.setIncreases.forEach(({
                    skill,
                    value
                }) => {
                    skill.setAbyssalLevelCap(value);
                });
                break;
        }
        this.validateRandomLevelCapIncreases();
        if (capIncrease.randomIncreases.length > 0 && capIncrease.randomCount > 0) {
            if (capIncrease.randomIncreasesLeft === 0)
                this.levelCapIncreasesBeingSelected.push(capIncrease);
            capIncrease.randomIncreasesLeft += capIncrease.randomCount;
            this.renderQueue.sidebarSkillUnlock = true;
            this.queueNextRandomLevelCapModal();
        }
        this.combat.preventAutoRestart = true;
        reqSet.given = true;
        reqSet.unlisteners.forEach((unlistener) => unlistener());
        reqSet.unlisteners = [];
    }
    /** Validates that the currently selected random level caps are still valid after a fixed/set increase */
    validateRandomLevelCapIncreases() {
        if (this.levelCapIncreasesBeingSelected.length === 0)
            return;
        const capIncrease = this.levelCapIncreasesBeingSelected[0];
        const isInvalid = capIncrease.validateRandomSelection();
        if (capIncrease.randomSelection.size === 0) {
            capIncrease.randomIncreasesLeft = 0;
            this.levelCapIncreasesBeingSelected = this.levelCapIncreasesBeingSelected.filter((s) => s !== capIncrease);
            levelCapIncreaseModal.isActive = false;
            this.renderQueue.sidebarSkillUnlock = true;
            this.queueNextRandomLevelCapModal(true);
        } else if (isInvalid && levelCapIncreaseModal.isActive) {
            levelCapIncreaseModal.setSelection(capIncrease, this);
        }
    }
    queueNextRandomLevelCapModal(noModal = false) {
        if (this.levelCapIncreasesBeingSelected.length === 0) {
            if (levelCapIncreaseModal.isVisible)
                Swal.close();
            return;
        }
        if (levelCapIncreaseModal.isActive)
            return;
        const capIncrease = this.levelCapIncreasesBeingSelected[0];
        if (capIncrease.randomSelection.size === 0)
            capIncrease.rollRandomSelection();
        if (capIncrease.randomSelection.size === 0) {
            capIncrease.randomIncreasesLeft = 0;
            this.levelCapIncreasesBeingSelected = this.levelCapIncreasesBeingSelected.filter((s) => s !== capIncrease);
            this.queueNextRandomLevelCapModal(noModal);
            return;
        }
        if (noModal)
            return;
        levelCapIncreaseModal.setSelection(capIncrease, this);
        if (!levelCapIncreaseModal.isVisible) {
            addModalToQueue({
                title: capIncrease.levelType === 'Standard' ?
                    getLangString('INCREASE_LEVEL_CAP') :
                    getLangString('INCREASE_ABYSSAL_LEVEL_CAP'),
                html: levelCapIncreaseModal,
                showCancelButton: true,
                cancelButtonText: getLangString('MENU_TEXT_CHOOSE_LATER'),
                showConfirmButton: false,
                willOpen: () => {
                    levelCapIncreaseModal.isVisible = true;
                },
                didDestroy: () => {
                    levelCapIncreaseModal.isActive = false;
                    levelCapIncreaseModal.isVisible = false;
                },
            });
        }
    }
    selectRandomLevelCapIncrease(capIncrease, increase) {
        switch (capIncrease.levelType) {
            case 'Standard':
                increase.skill.applyLevelCapIncrease(increase);
                break;
            case 'Abyssal':
                increase.skill.applyAbyssalLevelCapIncrease(increase);
                break;
        }
        capIncrease.randomIncreasesLeft--;
        capIncrease.randomSelection.clear();
        if (capIncrease.randomIncreasesLeft === 0) {
            this.levelCapIncreasesBeingSelected = this.levelCapIncreasesBeingSelected.filter((s) => s !== capIncrease);
        }
        levelCapIncreaseModal.isActive = false;
        if (this.levelCapIncreasesBeingSelected.length === 0) {
            if (levelCapIncreaseModal.isVisible)
                Swal.close();
        } else {
            this.queueNextRandomLevelCapModal();
        }
        this.renderQueue.sidebarSkillUnlock = true;
    }
    fireLevelCapIncreaseModal(skill) {
        if (this.currentGamemode.levelCapCost === undefined)
            return;
        const content = createElement('level-cap-purchase-modal');
        customElements.upgrade(content);
        content.setStandardLevels(skill, this.currentGamemode.levelCapCost, this);
        SwalLocale.fire({
            title: getLangString('INCREASE_LEVEL_CAP'),
            html: content,
            showConfirmButton: false,
            showCancelButton: true,
        });
    }
    fireAbyssalLevelCapIncreaseModal(skill) {
        if (this.currentGamemode.abyssalLevelCapCost === undefined)
            return;
        const content = createElement('level-cap-purchase-modal');
        customElements.upgrade(content);
        content.setAbyssalLevels(skill, this.currentGamemode.abyssalLevelCapCost, this);
        SwalLocale.fire({
            title: getLangString('INCREASE_ABYSSAL_LEVEL_CAP'),
            html: content,
            showConfirmButton: false,
            showCancelButton: true,
        });
    }
    /** Attempts to purchase a skill level cap for a skill */
    purchaseSkillLevelCaps(skill, amount = 1) {
        const capCost = this.currentGamemode.levelCapCost;
        if (capCost === undefined || capCost.getMaxLevelIncreases(skill) < amount)
            return;
        const costs = capCost.getCosts(this, this._levelCapIncreasesBought, amount);
        if (!costs.checkIfOwned())
            return;
        costs.consumeCosts();
        skill.increaseLevelCap(capCost.increase * amount);
        this._levelCapIncreasesBought += amount;
        skill.renderQueue.levelCapPurchase = true;
        Swal.close();
    }
    /** Attempts to purchase an abyssal skill level cap for a skill */
    purchaseAbyssalSkillLevelCaps(skill, amount = 1) {
        const capCost = this.currentGamemode.abyssalLevelCapCost;
        if (capCost === undefined || capCost.getMaxAbyssalLevelIncreases(skill) < amount)
            return;
        const costs = capCost.getCosts(this, this._abyssalLevelCapIncreasesBought, amount);
        if (!costs.checkIfOwned())
            return;
        costs.consumeCosts();
        skill.increaseAbyssalLevelCap(capCost.increase * amount);
        this._abyssalLevelCapIncreasesBought += amount;
        skill.renderQueue.abyssalLevelCapPurchase = true;
        Swal.close();
    }
    /** Checks a single requirement and optionally displays an error message to the player */
    checkRequirement(requirement, notifyOnFailure = false, slayerLevelReq = 0) {
        switch (requirement.type) {
            case 'SlayerItem':
                return requirement.check(notifyOnFailure, slayerLevelReq);
            default:
                return requirement.check(notifyOnFailure);
        }
    }
    /** Checks an array of rqeuirements, and optionally displays an error message to the player for the first failed requirement */
    checkRequirements(requirements, notifyOnFailure = false, slayerLevelReq = 0) {
        return requirements.every((requirement) => this.checkRequirement(requirement, notifyOnFailure, slayerLevelReq));
    }
    /** Returns true if the player owns the item in their bank or equipment */
    isItemOwned(item) {
        return (this.bank.hasItem(item) || (item instanceof EquipmentItem && this.combat.player.checkEquipmentSetsForItem(item)));
    }
    /** Returns the Combat or Slayer area a monster is found in */
    getMonsterArea(monster) {
        let area = this.monsterAreas.get(monster);
        if (area === undefined)
            area = this.unknownCombatArea;
        return area;
    }
    getPageForAction(action) {
        return this.actionPageMap.get(action);
    }
    getPageForActiveAction() {
        if (this.activeAction !== undefined) {
            const page = this.actionPageMap.get(this.activeAction);
            if (page !== undefined)
                return page;
        } else if (this.farming.isUnlocked && this.farming.isAnyPlotGrown) {
            const pages = this.getPagesForSkill(this.farming);
            if (pages !== undefined)
                return pages[0];
        }
        const page = this.pages.getObjectByID("melvorD:Bank" /* PageIDs.Bank */ );
        if (page === undefined)
            throw new Error(`Error, Bank page not registered.`);
        return page;
    }
    getPagesForSkill(skill) {
        return this.skillPageMap.get(skill);
    }
    checkSteamAchievements() {
        if (!connectedToSteam)
            return;
        let achievementIDs = [];
        try {
            achievementIDs = nativeManager.isUsingGreenworks ?
                parent.greenworks.getAchievementNames() :
                this.steamAchievementNames;
            for (let i = steamAchievements.length; i < achievementIDs.length; i++) {
                steamAchievements.push(0);
            }
        } catch (e) {
            console.error(e);
        }
        achievementIDs.forEach((achieveID, i) => {
            const achievement = this.steamAchievements.get(achieveID);
            if (achievement === undefined) {
                console.warn(`Error checking steam achievements, no data exists for achievement with id: ${achieveID}`);
                return;
            }
            if (this.isAchievementMet(achievement))
                unlockSteamAchievement(achieveID, i);
        });
        if (nativeManager.isUsingGreenworks) {
            parent.greenworks.setRichPresence('currentGamemode', this.currentGamemode.name);
            parent.greenworks.setRichPresence('skillLevel', '' + this.completion.skillLevelProgress.currentCount.getSum() + '');
            parent.greenworks.setRichPresence('steam_display', '#Status_gamemodeSkillLevel');
        } else if (nativeManager.isUsingSteamworks) {
            parent.steamworksClient.localplayer.setRichPresence('currentGamemode', this.currentGamemode.name);
            parent.steamworksClient.localplayer.setRichPresence('skillLevel', '' + this.completion.skillLevelProgress.currentCount.getSum() + '');
            parent.steamworksClient.localplayer.setRichPresence('steam_display', '#Status_gamemodeSkillLevel');
        }
    }
    isAchievementMet(achievement) {
        if (achievement.requiredGamemode !== undefined && this.currentGamemode !== achievement.requiredGamemode)
            return false;
        if (achievement.requirements.length > 0)
            return this.checkRequirements(achievement.requirements, false);
        // Hardcoded Achievements
        switch (achievement.id) {
            case 'NEW_ACHIEVEMENT_1_0':
                // Character created
                return true;
            case 'NEW_ACHIEVEMENT_1_1':
                // Any Skill leveled at least once
                return this.skills.some((skill) => skill.level > skill.startingLevel);
            case 'NEW_ACHIEVEMENT_1_2':
                // Any Pet Unlocked
                return this.pets.some((pet) => this.petManager.isPetUnlocked(pet));
            case 'NEW_ACHIEVEMENT_1_3':
                // Any Skill at 99
                return this.skills.some((skill) => skill.level >= 99);
            case 'NEW_ACHIEVEMENT_1_4':
                // Any Mastery at level 99
                return this.masterySkills.some((skill) => skill.isAnyMastery99);
            case 'NEW_ACHIEVEMENT_1_26':
            case 'NEW_ACHIEVEMENT_3_20':
                // 100% Item Completion
                return this.completion.itemProgress.getPercent("melvorBaseGame" /* Namespaces.BaseGame */ ) === 100;
            case 'NEW_ACHIEVEMENT_1_27':
            case 'NEW_ACHIEVEMENT_3_21':
                // 100% Pet Completion
                return this.completion.petProgress.getPercent("melvorBaseGame" /* Namespaces.BaseGame */ ) === 100;
            case 'NEW_ACHIEVEMENT_1_28':
            case 'NEW_ACHIEVEMENT_3_22':
                // 100% Mastery Completion
                return this.completion.masteryProgress.getPercent("melvorBaseGame" /* Namespaces.BaseGame */ ) === 100;
            case 'NEW_ACHIEVEMENT_1_29':
            case 'NEW_ACHIEVEMENT_3_23':
                // 100% Monster Completion
                return this.completion.monsterProgress.getPercent("melvorBaseGame" /* Namespaces.BaseGame */ ) === 100;
            case 'NEW_ACHIEVEMENT_2_24':
                // 80 Bank Spaces
                return this.bank.maximumSlots >= 80;
            case 'NEW_ACHIEVEMENT_2_25':
                // 100 Bank Spaces
                return this.bank.maximumSlots >= 100;
            case 'NEW_ACHIEVEMENT_2_26':
                // 200 Bank Spaces
                return this.bank.maximumSlots >= 200;
            case 'NEW_ACHIEVEMENT_2_27':
                {
                    const plant = this.monsters.getObjectByID("melvorD:Plant" /* MonsterIDs.Plant */ );
                    return plant !== undefined && this.stats.Monsters.get(plant, MonsterStats.KilledPlayer) > 0;
                }
            default:
                return false;
        }
    }
    /** Sets up the current gamemode to it's starting state */
    setupCurrentGamemode() {
        var _a, _b;
        const startingSkills = this.currentGamemode.startingSkills;
        if (startingSkills !== undefined) {
            this.skills.forEach((skill) => {
                skill.setUnlock(startingSkills.has(skill));
            });
        } else {
            this.skills.forEach((skill) => {
                skill.setUnlock((cloudManager.hasFullVersionEntitlement || isDemoSkill(skill)) && skill.unlockRequirements.length === 0);
            });
        }
        (_a = this.currentGamemode.initialLevelCaps) === null || _a === void 0 ? void 0 : _a.forEach(({
            skill,
            value
        }) => {
            skill.setLevelCap(value);
        });
        if (this.currentGamemode.defaultInitialLevelCap !== undefined) {
            const cap = this.currentGamemode.defaultInitialLevelCap;
            this.skills.forEach((skill) => {
                if (!skill.levelCapSet)
                    skill.setLevelCap(cap);
            });
        }
        (_b = this.currentGamemode.initialAbyssalLevelCaps) === null || _b === void 0 ? void 0 : _b.forEach(({
            skill,
            value
        }) => {
            skill.setAbyssalLevelCap(value);
        });
        if (this.currentGamemode.defaultInitialAbyssalLevelCap !== undefined) {
            const cap = this.currentGamemode.defaultInitialAbyssalLevelCap;
            this.skills.forEach((skill) => {
                if (!skill.abyssalLevelCapSet)
                    skill.setAbyssalLevelCap(cap);
            });
        }
        this.currentGamemode.startingItems.forEach(({
            item,
            quantity
        }) => this.bank.addItem(item, quantity, false, true));
        this.settings.changeChoiceSetting('defaultPageOnLoad', this.currentGamemode.startingPage);
    }
    /**
     * Computes the stats currently provided by token items
     * @param updatePlayer If the stats of the player should be recomputed
     */
    computeTokenItemStats(updatePlayer = false) {
        this.tokenItemStats.reset();
        this.items.tokens.forEach((item) => {
            const timesClaimed = item.getTimesClaimed();
            if (timesClaimed > 0) {
                this.tokenItemStats.addStatObject(item, item.stats, timesClaimed, timesClaimed);
            }
        });
        if (updatePlayer)
            this.combat.computeAllStats();
    }
    // Utility Methods for converting old saves
    getItemFromOldID(itemID, idMap) {
        const item = this.items.getObjectByID(idMap.items[itemID]);
        return item;
    }
    /** Converts the data from an old format save */
    convertFromOldFormat(save, idMap) {
        if (save.serialData !== undefined) {
            if (save.version <= 3) {
                this.combat.deserialize(save.serialData, save.version, idMap);
                if (save.offline.skill !== null && save.offline.skill === 9 /* OldSkillsIDs.Hitpoints */ )
                    this.activeAction = this.combat;
            } else
                this.deserialize(save.serialData, save.version, idMap);
        } else {
            this.combat.convertFromOldSaveFormat(save, idMap);
        }
        if (save.version <= 8) {
            this.stats.convertFromOldFormat(save, idMap);
        }
        if (save.version < 10 && (this.activeAction === this.thieving || this.activeAction === this.combat)) {
            this.combat.giveFreeDeath = true;
        }
        if (save.version <= 15) {
            if (save.summoningData !== undefined)
                this.summoning.convertFromOldFormat(save.summoningData, idMap);
            this.fishing.convertFromOldFormat(save);
            this.cooking.convertFromOldFormat(save, idMap);
        }
        if (save.version < 17) {
            this.agility.convertFromOldFormat(save, idMap);
        }
        if (save.currentGamemode !== undefined) {
            const gamemodeID = idMap.gameModes[save.currentGamemode];
            const gamemode = this.gamemodes.getObjectByID(gamemodeID);
            if (gamemode === undefined)
                throw new Error(`Error converting save. Gamemode with id: ${gamemodeID} is not registered.`);
            this.currentGamemode = gamemode;
        }
        this.bank.convertFromOldFormat(save, idMap);
        if (save.glovesTracker !== undefined)
            this.itemCharges.convertFromOldFormat(save.glovesTracker, idMap);
        this.minibar.convertFromOldformat(save, idMap);
        this.potions.convertFromOldFormat(save, idMap);
        this.golbinRaid.convertFromOldFormat(save, idMap);
        if (save.dungeonCompleteCount !== undefined)
            this.combat.convertDungeonCompletion(save.dungeonCompleteCount, idMap);
        this.shop.convertFromOldFormat(save, idMap);
        this.petManager.convertFromOldFormat(save, idMap);
        this.settings.convertFromOldFormat(save, idMap);
        // Convert Skill XP
        if (save.skillXP !== undefined) {
            save.skillXP.forEach((xp, oldSkillID) => {
                const skill = this.skills.getObjectByID(idMap.skills[oldSkillID]);
                if (skill === undefined)
                    return;
                skill.convertOldXP(xp);
            });
        }
        // Convert Unlocked Skills
        if (save.skillsUnlocked !== undefined) {
            save.skillsUnlocked.forEach((isUnlocked, oldSkillID) => {
                const skill = this.skills.getObjectByID(idMap.skills[oldSkillID]);
                if (skill === undefined)
                    return;
                skill.setUnlock(isUnlocked);
            });
        }
        // Convert Skill Mastery
        if (save.MASTERY !== undefined) {
            Object.entries(save.MASTERY).forEach(([oldSkillID, oldMasteryData]) => {
                const skill = this.masterySkills.getObjectByID(idMap.skills[parseInt(oldSkillID)]);
                if (skill === undefined)
                    return;
                skill.convertOldMastery(oldMasteryData, idMap);
            });
        }
        if (save.offline !== undefined)
            this.convertOldOffline(save.offline, idMap);
        if (save.raidCoins !== undefined)
            this.raidCoins.set(save.raidCoins);
        if (save.gp !== undefined)
            this.gp.set(save.gp);
        this.tutorial.convertFromOldFormat(save, idMap);
        this.farming.convertFromOldFormat(save, idMap);
        if (save.username !== undefined)
            this.characterName = save.username;
        if (save.titleNewsID !== undefined)
            this.readNewsIDs = save.titleNewsID;
        if (save.gameUpdateNotification !== undefined)
            this.lastLoadedGameVersion = save.gameUpdateNotification;
        if (save.scheduledPushNotifications !== undefined)
            nativeManager.convertOldNotifications(save.scheduledPushNotifications);
    }
    /** Takes the old offline variable and converts it to the new skill format */
    convertOldOffline(offline, idMap) {
        if (offline.timestamp !== null) {
            this.tickTimestamp = offline.timestamp;
        }
        if (!this.mining.isActive && offline.skill === 4 /* OldSkillsIDs.Mining */ && offline.action !== null) {
            this.mining.setFromOldOffline(offline, idMap);
        }
        if (!this.firemaking.isActive && offline.skill === 2 /* OldSkillsIDs.Firemaking */ && offline.action !== null) {
            this.firemaking.setFromOldOffline(offline, idMap);
        }
        if (!this.woodcutting.isActive && offline.skill === 0 /* OldSkillsIDs.Woodcutting */ && offline.action !== null) {
            this.woodcutting.setFromOldOffline(offline, idMap);
        }
        if (!this.herblore.isActive && offline.skill === 19 /* OldSkillsIDs.Herblore */ && offline.action !== null) {
            this.herblore.setFromOldOffline(offline, idMap);
        }
        if (!this.smithing.isActive && offline.skill === 5 /* OldSkillsIDs.Smithing */ && offline.action !== null) {
            this.smithing.setFromOldOffline(offline, idMap);
        }
        if (!this.runecrafting.isActive && offline.skill === 15 /* OldSkillsIDs.Runecrafting */ && offline.action !== null) {
            this.runecrafting.setFromOldOffline(offline, idMap);
        }
        if (!this.altMagic.isActive && offline.skill === 16 /* OldSkillsIDs.Magic */ && offline.action !== null) {
            this.altMagic.setFromOldOffline(offline, idMap);
        }
        if (!this.crafting.isActive && offline.skill === 14 /* OldSkillsIDs.Crafting */ && offline.action !== null) {
            this.crafting.setFromOldOffline(offline, idMap);
        }
        if (!this.fletching.isActive && offline.skill === 13 /* OldSkillsIDs.Fletching */ && offline.action !== null) {
            this.fletching.setFromOldOffline(offline, idMap);
        }
        if (!this.summoning.isActive && offline.skill === 21 /* OldSkillsIDs.Summoning */ && offline.action !== null) {
            this.smithing.setFromOldOffline(offline, idMap);
        }
        if (!this.fishing.isActive &&
            offline.skill === 1 /* OldSkillsIDs.Fishing */ &&
            offline.action !== null &&
            Array.isArray(offline.action)) {
            this.fishing.setFromOldOffline(offline, idMap);
        }
        if (!this.cooking.isActive && offline.skill === 3 /* OldSkillsIDs.Cooking */ && offline.action !== null) {
            this.cooking.setFromOldOffline(offline, idMap);
        }
        if (!this.agility.isActive && offline.skill === 20 /* OldSkillsIDs.Agility */ && offline.action !== null) {
            this.agility.setFromOldOffline(offline);
        }
        if (!this.astrology.isActive && offline.skill === 22 /* OldSkillsIDs.Astrology */ && offline.action !== null) {
            this.astrology.setFromOldOffline(offline, idMap);
        }
    }
}
/** Time between auto-saves in [ms] */
const AUTO_SAVE_INTERVAL = 10000;
/** Time between checking for updates to the cloud in [ms] */
const CLOUD_UPDATE_INTERVAL = 10000;
/** Time between rich presence updates in [ms] */
const RICH_PRESENCE_UPDATE_INTERVAL = 10000;
class OfflineLoadingElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('offline-loading-template'));
        this.loadingContainer = getElementFromFragment(this._content, 'loading-container', 'div');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'div');
        this.timeLeft = getElementFromFragment(this._content, 'time-left', 'span');
        this.ticksPerSecond = getElementFromFragment(this._content, 'ticks-per-second', 'span');
        this.errorContainer = getElementFromFragment(this._content, 'error-container', 'div');
        this.modText = getElementFromFragment(this._content, 'mod-text', 'h5');
        this.devText = getElementFromFragment(this._content, 'dev-text', 'h5');
        this.errorText = getElementFromFragment(this._content, 'error-text', 'textarea');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /**
     * Updates the current loading progress
     * @param timeProcessed The total amount of time in [ms] that has been processed
     * @param totalTime The amount of time in [ms] left to process
     * @param tps The ticks per second the game is running at
     */
    updateProgress(timeProcessed, totalTime, tps) {
        const percent = (timeProcessed / totalTime) * 100;
        this.progressBar.style.width = `${percent}%`;
        const timeLeft = totalTime - timeProcessed;
        this.timeLeft.textContent = formatAsShorthandTimePeriod(timeLeft, true, false, true);
        this.ticksPerSecond.textContent = templateLangString('OFFLINE_PROGRESS_TICKS_PER_SECOND', {
            value: numberWithCommas(Math.floor(tps)),
        });
    }
    setError(e, modError, log) {
        hideElement(this.loadingContainer);
        showElement(this.errorContainer);
        this.errorText.value = log;
        if (modError.mods.length === 0) {
            this.devText.textContent = `Please let the dev know of this error. Please copy the entire contents of the error message when reporting it:`;
            hideElement(this.modText);
        } else {
            this.devText.textContent = `Please report this error to the mod developer(s):`;
            showElement(this.modText);
            this.modText.innerHTML = `<strong>Error due to Mods:</strong><br>${modError.mods
                .map(({ name, version }) => `
            $ {
                name
            }: v$ {
                version
            }
            `)
                .join('<br>')}`;
        }
    }
}
class OfflineProgressElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('offline-progress-template'));
        this.messageContainer = getElementFromFragment(this._content, 'message-container', 'div');
        this.timeAway = getElementFromFragment(this._content, 'time-away', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setMessages(game, oldSnapshot, newSnapshot, timeDiff, offlineAction) {
        const lostLoot = game.combat.loot.lostLoot;
        const lostItems = game.combat.bank.lostItems;
        const currencyDiffs = new Map();
        game.currencies.forEach((currency) => {
            var _a, _b;
            const qtyDiff = ((_a = newSnapshot.currencies.get(currency)) !== null && _a !== void 0 ? _a : 0) - ((_b = oldSnapshot.currencies.get(currency)) !== null && _b !== void 0 ? _b : 0);
            if (qtyDiff !== 0)
                currencyDiffs.set(currency, qtyDiff);
        });
        const ppDiff = newSnapshot.prayerPoints - oldSnapshot.prayerPoints;
        const spDiff = newSnapshot.soulPoints - oldSnapshot.soulPoints;
        const xpGain = new Map();
        const levelGain = new Map();
        newSnapshot.experience.forEach((xp, skill) => {
            var _a;
            const xpBefore = (_a = oldSnapshot.experience.get(skill)) !== null && _a !== void 0 ? _a : 0;
            const xpDiff = Math.floor(xp - xpBefore);
            if (xpDiff > 0) {
                xpGain.set(skill, xpDiff);
            }
        });
        newSnapshot.levels.forEach((level, skill) => {
            var _a;
            const levelDiff = level - ((_a = oldSnapshot.levels.get(skill)) !== null && _a !== void 0 ? _a : 0);
            if (levelDiff > 0)
                levelGain.set(skill, levelDiff);
        });
        const abyssalXPGain = new Map();
        const abyssalLevelGain = new Map();
        newSnapshot.abyssalExperience.forEach((xp, skill) => {
            var _a;
            const xpBefore = (_a = oldSnapshot.abyssalExperience.get(skill)) !== null && _a !== void 0 ? _a : 0;
            const xpDiff = Math.floor(xp - xpBefore);
            if (xpDiff > 0) {
                abyssalXPGain.set(skill, xpDiff);
            }
        });
        newSnapshot.abyssalLevels.forEach((level, skill) => {
            var _a;
            const levelDiff = level - ((_a = oldSnapshot.abyssalLevels.get(skill)) !== null && _a !== void 0 ? _a : 0);
            if (levelDiff > 0)
                abyssalLevelGain.set(skill, levelDiff);
        });
        const itemsGained = new Map();
        const itemsUsed = new Map();
        const monstersKilled = this.getCountDiff(oldSnapshot.monsterKills, newSnapshot.monsterKills);
        const dungeonsCompleted = this.getCountDiff(oldSnapshot.dungeonCompletion, newSnapshot.dungeonCompletion);
        const strongholdsCompleted = this.getCountDiff(oldSnapshot.strongholdCompletion, newSnapshot.strongholdCompletion);
        const abyssDepthsCompleed = this.getCountDiff(oldSnapshot.abyssDepthCompletion, newSnapshot.abyssDepthCompletion);
        const tasksCompleted = this.getCountDiff(oldSnapshot.taskCompletions, newSnapshot.taskCompletions);
        const marksFound = this.getCountDiff(oldSnapshot.summoningMarks, newSnapshot.summoningMarks);
        const itemChargesUsed = [];
        oldSnapshot.itemCharges.forEach((quantity, item) => {
            var _a;
            quantity -= (_a = newSnapshot.itemCharges.get(item)) !== null && _a !== void 0 ? _a : 0;
            if (quantity > 0)
                itemChargesUsed.push({
                    item,
                    quantity,
                });
        });
        const stockPileItemsGained = [];
        newSnapshot.cookingStockpile.forEach(({
            item,
            quantity
        }, category) => {
            const oldItems = oldSnapshot.cookingStockpile.get(category);
            if (oldItems !== undefined) {
                quantity -= oldItems.quantity;
            }
            if (quantity > 0)
                stockPileItemsGained.push({
                    item,
                    quantity
                });
        });
        game.items.forEach((item) => {
            var _a, _b;
            const qtyDiff = ((_a = newSnapshot.bank.get(item)) !== null && _a !== void 0 ? _a : 0) - ((_b = oldSnapshot.bank.get(item)) !== null && _b !== void 0 ? _b : 0);
            if (qtyDiff > 0) {
                itemsGained.set(item, qtyDiff);
            } else if (qtyDiff < 0) {
                itemsUsed.set(item, qtyDiff);
            }
        });
        const foodEaten = [];
        oldSnapshot.food.forEach(({
            item,
            quantity
        }, i) => {
            var _a;
            const qtyDiff = quantity - newSnapshot.food[i].quantity;
            if (qtyDiff > 0)
                foodEaten.push({
                    item,
                    quantity: qtyDiff
                });
            else if (qtyDiff < 0) {
                item = newSnapshot.food[i].item;
                itemsGained.set(item, ((_a = itemsGained.get(item)) !== null && _a !== void 0 ? _a : 0) - qtyDiff);
            }
        });
        const getNodeDiff = (oldNode, newNode) => {
            return {
                totalFound: newNode.totalFound - oldNode.totalFound,
                hpFound: newNode.hpFound - oldNode.hpFound,
            };
        };
        const meteorite = getNodeDiff(oldSnapshot.meteorite, newSnapshot.meteorite);
        const onyxNode = getNodeDiff(oldSnapshot.onyxNode, newSnapshot.onyxNode);
        const orichaNode = getNodeDiff(oldSnapshot.orichaNode, newSnapshot.orichaNode);
        const ceruleanNode = getNodeDiff(oldSnapshot.ceruleanNode, newSnapshot.ceruleanNode);
        const abycite = getNodeDiff(oldSnapshot.abycite, newSnapshot.abycite);
        const mysticite = getNodeDiff(oldSnapshot.mysticite, newSnapshot.mysticite);
        const echocite = getNodeDiff(oldSnapshot.echocite, newSnapshot.echocite);
        const nightopalNode = getNodeDiff(oldSnapshot.nightopalNode, newSnapshot.nightopalNode);
        const shadowpearlNode = getNodeDiff(oldSnapshot.shadowpearlNode, newSnapshot.shadowpearlNode);
        const moonstoneNode = getNodeDiff(oldSnapshot.moonstoneNode, newSnapshot.moonstoneNode);
        const voidheartNode = getNodeDiff(oldSnapshot.voidheartNode, newSnapshot.voidheartNode);
        const ancientRelics = new Map();
        newSnapshot.ancientRelics.forEach((relicData, skill) => {
            relicData.forEach((count, relic) => {
                var _a, _b;
                const oldCount = (_b = (_a = oldSnapshot.ancientRelics.get(skill)) === null || _a === void 0 ? void 0 : _a.get(relic)) !== null && _b !== void 0 ? _b : 0;
                if (count !== oldCount) {
                    if (!ancientRelics.has(skill))
                        ancientRelics.set(skill, new Map());
                    ancientRelics.get(skill).set(relic, count - oldCount);
                }
            });
        });
        const storageFull = newSnapshot.townshipStorageFull;
        const image = (media) => `<img class="skill-icon-xs" src="${media}">`;
        const posSpan = (text) => `<span class='text-success'>${text}</span>`;
        const negSpan = (text) => `<span class='text-danger'>${text}</span>`;
        const currencyDiff = (diff, name, media) => {
            if (diff > 0) {
                return (templateLangString(`MENU_TEXT_CURRENCY_GAIN_${name}`, {
                    curIcon: image(media),
                    count: posSpan(numberWithCommas(diff)),
                }) + `${setLang === 'en' ? ` (${numberWithCommas(Math.floor(diff / (timeDiff / 1000 / 60 / 60)))} /hr)` : ''}`);
            } else {
                return (templateLangString(`MENU_TEXT_CURRENCY_LOSS_${name}`, {
                    curIcon: image(media),
                    count: negSpan(numberWithCommas(-diff)),
                }) + `${setLang === 'en' ? ` (${numberWithCommas(Math.floor(diff / (timeDiff / 1000 / 60 / 60)))} hr)` : ''}`);
            }
        };
        const outputHeaders = [];
        xpGain.forEach((xpGain, skill) => {
            outputHeaders.push(templateString(getLangString('MISC_STRING_6'), {
                    qty: posSpan(numberWithCommas(xpGain)),
                    skillName: skill.name,
                }) +
                `${setLang === 'en' ? ` (${numberWithCommas(Math.floor(xpGain / (timeDiff / 1000 / 60 / 60)))} XP/hr)` : ''}`);
        });
        levelGain.forEach((levelGain, skill) => {
            var _a, _b;
            const templateData = {
                skillName: skill.name,
                count: `${levelGain}`,
                oldLevel: `${(_a = oldSnapshot.levels.get(skill)) !== null && _a !== void 0 ? _a : 1}`,
                newLevel: `${(_b = newSnapshot.levels.get(skill)) !== null && _b !== void 0 ? _b : 1}`,
            };
            outputHeaders.push(templateLangString(`MENU_TEXT_${levelGain === 1 ? 'LEVELED_UP_SKILL_ONCE' : 'LEVELED_UP_SKILL_TIMES'}`, templateData));
        });
        abyssalXPGain.forEach((xpGain, skill) => {
            outputHeaders.push(templateString(getLangString('MENU_TEXT_ABYSSAL_SKILL_XP_GAINED'), {
                    qty: posSpan(numberWithCommas(xpGain)),
                    skillName: skill.name,
                }) +
                `${setLang === 'en' ? ` (${numberWithCommas(Math.floor(xpGain / (timeDiff / 1000 / 60 / 60)))} AXP/hr)` : ''}`);
        });
        abyssalLevelGain.forEach((levelGain, skill) => {
            var _a, _b;
            const templateData = {
                skillName: skill.name,
                count: `${levelGain}`,
                oldLevel: `${(_a = oldSnapshot.abyssalLevels.get(skill)) !== null && _a !== void 0 ? _a : 1}`,
                newLevel: `${(_b = newSnapshot.abyssalLevels.get(skill)) !== null && _b !== void 0 ? _b : 1}`,
            };
            outputHeaders.push(templateLangString(`MENU_TEXT_ABYSSAL_LEVELED_UP_SKILL`, templateData));
        });
        monstersKilled.forEach((killDiff, monster) => {
            if (killDiff > 0) {
                outputHeaders.push(templateLangString('MENU_TEXT_YOU_KILLED_MONSTER', {
                        count: `${killDiff}`,
                        monsterImage: image(monster.media),
                        monsterName: monster.name,
                    }) +
                    `${setLang === 'en'
                        ? ` (${numberWithCommas(Math.floor(killDiff / (timeDiff / 1000 / 60 / 60)).toFixed(1))} Kills/hr)`
                        : ''}`);
            }
        });
        const createAreaCompletionHeader = (diff, area) => {
            if (diff <= 0)
                return;
            outputHeaders.push(templateLangString(`MENU_TEXT_${diff === 1 ? 'COMPLETED_DUNGEON_ONCE' : 'COMPLETED_DUNGEON_TIMES'}`, {
                    dungeonImage: image(area.media),
                    dungeonName: area.name,
                    count: `${diff}`,
                }) +
                `${setLang === 'en'
                    ? ` (${numberWithCommas(Math.floor(diff / (timeDiff / 1000 / 60 / 60)).toFixed(2))} /hr)`
                    : ''}`);
        };
        dungeonsCompleted.forEach(createAreaCompletionHeader);
        strongholdsCompleted.forEach(createAreaCompletionHeader);
        abyssDepthsCompleed.forEach(createAreaCompletionHeader);
        if (oldSnapshot.corruptionsUnlocked !== newSnapshot.corruptionsUnlocked) {
            const diff = newSnapshot.corruptionsUnlocked - oldSnapshot.corruptionsUnlocked;
            if (diff > 1) {
                outputHeaders.push(templateLangString('UNLOCKED_CORRUPTIONS', {
                    count: `${diff}`
                }));
            } else {
                outputHeaders.push(getLangString('UNLOCKED_CORRUPTION'));
            }
        }
        tasksCompleted.forEach((count, category) => {
            outputHeaders.push(templateString(category.completionText, {
                count: `${count}`
            }));
        });
        marksFound.forEach((markCount, mark) => {
            if (markCount > 0) {
                outputHeaders.push(templateLangString('MENU_TEXT_YOU_FOUND_MARK', {
                    count: posSpan(`${markCount}`),
                    markImage: image(game.summoning.getMarkImage(mark)),
                    markName: game.summoning.getMarkName(mark),
                }));
            }
        });
        const itemCurrencyValue = new SparseNumericMap();
        itemsGained.forEach((qty, item) => {
            outputHeaders.push(templateLangString('MENU_TEXT_YOU_GAINED_ITEM', {
                    count: posSpan(numberWithCommas(qty)),
                    itemImage: image(item.media),
                    itemName: item.name,
                }) +
                `${setLang === 'en'
                    ? ` (${numberWithCommas(Math.floor(qty / (timeDiff / 1000 / 60 / 60)).toFixed(2))} /hr)`
                    : ''}`);
            itemCurrencyValue.add(item.sellsFor.currency, qty * item.sellsFor.quantity);
        });
        stockPileItemsGained.forEach(({
            quantity,
            item
        }) => {
            outputHeaders.push(`${templateLangString('MENU_TEXT_YOU_GAINED_ITEM', {
                count: posSpan(numberWithCommas(quantity)),
                itemImage: image(item.media),
                itemName: item.name,
            })} <span class="text-warning">${getLangString('MENU_TEXT_IN_STOCKPILE')}</span>`);
            itemCurrencyValue.add(item.sellsFor.currency, quantity * item.sellsFor.quantity);
        });
        if (DEBUGENABLED) {
            outputHeaders.push('Total Item Value:');
            itemCurrencyValue.forEach((quantity, currency) => {
                outputHeaders.push(currency.formatAmount(numberWithCommas(quantity)));
            });
        }
        newSnapshot.loot.forEach((qty, item) => {
            outputHeaders.push(templateLangString('MENU_TEXT_YOU_HAVE_ITEM_LOOT', {
                count: posSpan(numberWithCommas(qty)),
                itemImage: image(item.media),
                itemName: item.name,
            }));
        });
        lostLoot.forEach((qty, item) => {
            outputHeaders.push(templateLangString('MENU_TEXT_LOST_ITEM_LOOT', {
                count: posSpan(numberWithCommas(qty)),
                itemImage: image(item.media),
                itemName: item.name,
            }));
        });
        lostItems.forEach((qty, item) => {
            outputHeaders.push(templateLangString('MENU_TEXT_LOST_ITEM_BANK', {
                count: posSpan(numberWithCommas(qty)),
                itemImage: image(item.media),
                itemName: item.name,
            }));
        });
        currencyDiffs.forEach((diff, currency) => {
            if (diff > 0) {
                outputHeaders.push(templateString(currency.gainTemplate, {
                    curIcon: image(currency.media),
                    count: posSpan(numberWithCommas(diff)),
                }));
            } else {
                outputHeaders.push(templateString(currency.usedTemplate, {
                    curIcon: image(currency.media),
                    count: negSpan(numberWithCommas(-diff)),
                }));
            }
        });
        if (ppDiff !== 0) {
            outputHeaders.push(currencyDiff(ppDiff, 'PP', assets.getURI("assets/media/skills/prayer/prayer.png" /* Assets.Prayer */ )));
        }
        if (spDiff !== 0) {
            outputHeaders.push(currencyDiff(spDiff, 'Soul_Points', assets.getURI("assets/media/bank/Lesser_Soul.png" /* Assets.SoulPoints */ )));
        }
        itemsUsed.forEach((qty, item) => {
            outputHeaders.push(templateLangString('MENU_TEXT_ITEM_USAGE', {
                count: negSpan(numberWithCommas(-qty)),
                itemImage: image(item.media),
                itemName: item.name,
            }) + `${setLang === 'en' ? ` (${numberWithCommas(Math.floor(qty / (timeDiff / 1000 / 60 / 60)))} hr)` : ''}`);
        });
        oldSnapshot.equipment.forEach((oldQuantity, slot) => {
            const newQuantity = newSnapshot.equipment.get(slot);
            if (newQuantity === undefined || oldQuantity.item === game.emptyEquipmentItem)
                return;
            const quantityUsed = newQuantity.item === game.emptyEquipmentItem ?
                oldQuantity.quantity :
                oldQuantity.quantity - newQuantity.quantity;
            if (quantityUsed <= 0)
                return;
            outputHeaders.push(templateLangString('MENU_TEXT_ITEM_USAGE', {
                count: negSpan(numberWithCommas(quantityUsed)),
                itemImage: image(oldQuantity.item.media),
                itemName: oldQuantity.item.name,
            }));
        });
        foodEaten.forEach(({
            quantity,
            item
        }) => {
            outputHeaders.push(templateLangString('MENU_TEXT_FOOD_EATEN', {
                    count: negSpan(numberWithCommas(quantity)),
                    itemImage: image(item.media),
                    itemName: item.name,
                }) +
                `${setLang === 'en' ? ` (${numberWithCommas(Math.floor(quantity / (timeDiff / 1000 / 60 / 60)))} /hr)` : ''}`);
        });
        itemChargesUsed.forEach(({
            item,
            quantity
        }) => {
            if (quantity > 0)
                outputHeaders.push(templateLangString('MENU_TEXT_GLOVE_CHARGE_USAGE', {
                    count: negSpan(numberWithCommas(quantity)),
                    itemImage: image(item.media),
                    itemName: item.name,
                }) + ` (${numberWithCommas(Math.floor(quantity / (timeDiff / 1000 / 60 / 60)))} hr)`);
        });
        const addMiningNodeHeader = (nodeDiff, singular, plural, media) => {
            if (nodeDiff.totalFound > 0) {
                outputHeaders.push(templateLangString(`MENU_TEXT_${nodeDiff.totalFound === 1 ? singular : plural}`, {
                        qty1: `${numberWithCommas(nodeDiff.totalFound)}`,
                        qty2: `${numberWithCommas(nodeDiff.hpFound)}`,
                        itemImage: image(assets.getURI(media)),
                    }) +
                    `${setLang === 'en'
                        ? ` (${numberWithCommas(Math.floor(nodeDiff.hpFound / (timeDiff / 1000 / 60 / 60)))} hp/hr)`
                        : ''}`);
            }
        };
        addMiningNodeHeader(meteorite, 'METEORITES_FOUND_ONE', 'METEORITES_FOUND_MANY', 'assets/media/skills/astrology/meteorite.png');
        addMiningNodeHeader(onyxNode, 'ONYX_FOUND_ONE', 'ONYX_FOUND_MANY', "assets/media/bank/onyx.png" /* Assets.Onyx */ );
        addMiningNodeHeader(orichaNode, 'ORICHA_FOUND_ONE', 'ORICHA_FOUND_MANY', "assets/media/bank/oricha.png" /* Assets.Oricha */ );
        addMiningNodeHeader(ceruleanNode, 'CERULEAN_FOUND_ONE', 'CERULEAN_FOUND_MANY', "assets/media/bank/cerulean.png" /* Assets.Cerulean */ );
        addMiningNodeHeader(abycite, 'ABYCITE_FOUND_ONE', 'ABYCITE_FOUND_MANY', 'assets/media/skills/mining/Abycite.png');
        addMiningNodeHeader(mysticite, 'MYSTICITE_FOUND_ONE', 'MYSTICITE_FOUND_MANY', 'assets/media/skills/mining/Mysticite.png');
        addMiningNodeHeader(echocite, 'ECHOCITE_FOUND_ONE', 'ECHOCITE_FOUND_MANY', 'assets/media/skills/mining/Echocite.png');
        addMiningNodeHeader(nightopalNode, 'NIGHTOPAL_FOUND_ONE', 'NIGHTOPAL_FOUND_MANY', 'assets/media/skills/mining/Nightopal.png');
        addMiningNodeHeader(shadowpearlNode, 'SHADOWPEARL_FOUND_ONE', 'SHADOWPEARL_FOUND_MANY', 'assets/media/skills/mining/Shadowpearl.png');
        addMiningNodeHeader(moonstoneNode, 'MOONSTONE_FOUND_ONE', 'MOONSTONE_FOUND_MANY', 'assets/media/skills/mining/Moonstone.png');
        addMiningNodeHeader(voidheartNode, 'VOIDHEART_FOUND_ONE', 'VOIDHEART_FOUND_MANY', 'assets/media/skills/mining/Voidheart.png');
        ancientRelics.forEach((relicData, skill) => {
            relicData.forEach((count, relic) => {
                outputHeaders.push(templateLangString(`ANCIENT_RELIC_LOCATED_COUNT`, {
                    number: `${posSpan(numberWithCommas(count))}`,
                    relicName: relic.name,
                }));
            });
        });
        if (game.township.isUnlocked) {
            outputHeaders.push(negSpan(templateLangString('TOWNSHIP_MENU_OFFLINE_HEALTH', {
                value: `${newSnapshot.townshipHealth}`
            })));
        }
        if (storageFull) {
            outputHeaders.push(negSpan(getLangString('TOWNSHIP_MENU_STORAGE_FULL_OFFLINE')));
        }
        if ((offlineAction === null || offlineAction === void 0 ? void 0 : offlineAction.getOfflineMessages) !== undefined)
            outputHeaders.push(...offlineAction.getOfflineMessages());
        outputHeaders.forEach((headerHTML) => {
            const header = createElement('h5', {
                className: 'font-w600 mb-1',
                parent: this.messageContainer
            });
            header.innerHTML = headerHTML;
        });
        this.timeAway.textContent = templateString(getLangString('MISC_STRING_4'), {
            timeAway: formatAsTimePeriod(timeDiff),
        });
    }
    /**
     * Gets a map of the difference between counts in two snapshot maps
     * @param oldCount The count map for the old snapshot
     * @param newCount The count map for the new snapshot
     * @returns The difference between the two maps (Only includes diffs > 0)
     */
    getCountDiff(oldCount, newCount) {
        const diffMap = new Map();
        newCount.forEach((count, key) => {
            var _a;
            const diff = count - ((_a = oldCount.get(key)) !== null && _a !== void 0 ? _a : 0);
            if (diff > 0)
                diffMap.set(key, diff);
        });
        return diffMap;
    }
}
window.customElements.define('offline-progress', OfflineProgressElement);
//# sourceMappingURL=game.js.map
checkFileVersion('?12097')