"use strict";
class DefaultPageOption {
    constructor(value) {
        this.value = value;
    }
    get name() {
        return this.value.name;
    }
    get media() {
        if (this.value.action !== undefined)
            return this.value.action.media;
        return this.value.media;
    }
}
class Settings {
    constructor(game) {
        this.game = game;
        /** The set of mastery namespaces that should be hidden in the spend mastery modal */
        this.hiddenMasteryNamespaces = new Set();
        this.boolData = {
            continueIfBankFull: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_SETTING_1_0');
                },
                saveOnChange: false,
            },
            continueThievingOnStun: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_SETTING_1_1');
                },
                saveOnChange: false,
            },
            autoRestartDungeon: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_1_2');
                },
                saveOnChange: false,
            },
            autoCloudSave: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('CHARACTER_SELECT_80');
                },
                saveOnChange: false,
            },
            darkMode: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_5_3');
                },
                onChange: (oldValue, newValue) => {
                    if (newValue) {
                        document.body.classList.add('darkMode');
                        $('#first-time-btn-light').attr('class', 'btn btn-outline-info');
                    } else if (!this.game.settings.superDarkMode) {
                        document.body.classList.remove('darkMode');
                        $('#first-time-btn-light').attr('class', 'btn btn-info');
                    }
                },
                saveOnChange: false,
            },
            showGPNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_3');
                },
                saveOnChange: false,
            },
            enableAccessibility: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_SETTING_5_7');
                },
                onChange: (oldValue, newValue) => {
                    initializeAltText();
                },
                saveOnChange: true,
            },
            showEnemySkillLevels: {
                currentValue: false,
                defaultValue: false,
                name: 'Show Enemy Skill Levels',
                onChange: (oldValue, newValue) => {
                    if (newValue) {
                        $('#combat-enemy-stats').removeClass('d-none');
                    } else {
                        $('#combat-enemy-stats').addClass('d-none');
                    }
                },
                saveOnChange: true,
            },
            showCloseConfirmations: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_8');
                },
                saveOnChange: true,
            },
            hideThousandsSeperator: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return `${getLangString('SETTINGS_SETTING_5_5')}<br><small>${getLangString('SETTINGS_SETTING_5_6')}</small>`;
                },
                saveOnChange: true,
            },
            showVirtualLevels: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_SETTING_1_3');
                },
                onChange: (oldValue, newValue) => {
                    this.game.skills.forEach((skill) => {
                        skill.renderQueue.level = true;
                        skill.renderQueue.xp = true;
                    });
                },
                saveOnChange: true,
            },
            showSaleConfirmations: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_0');
                },
                saveOnChange: true,
            },
            showShopConfirmations: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_1');
                },
                saveOnChange: true,
            },
            pauseOnUnfocus: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_1_5');
                },
                saveOnChange: true,
            },
            showCombatMinibar: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_4_1');
                },
                onChange: (oldValue, newValue) => {
                    if (newValue &&
                        ((this.game.isGolbinRaid && this.game.golbinRaid.isActive) ||
                            (!this.game.isGolbinRaid && this.game.combat.isActive))) {
                        $('#combat-footer-minibar').removeClass('d-none');
                    } else {
                        $('#combat-footer-minibar').addClass('d-none');
                    }
                },
                saveOnChange: true,
            },
            showCombatMinibarCombat: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_4_2');
                },
                saveOnChange: true,
            },
            showSkillingMinibar: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_4_0');
                },
                saveOnChange: true,
            },
            useCombinationRunes: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('MENU_TEXT_USE_COMBINATION_RUNES');
                },
                onChange: (oldValue, newValue) => {
                    this.game.combat.player.renderQueue.runesUsed = true;
                    this.game.altMagic.onComboRunesChange();
                },
                saveOnChange: false,
            },
            enableAutoSlayer: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('COMBAT_MISC_30');
                },
                saveOnChange: false,
            },
            showItemNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_2');
                },
                saveOnChange: false,
            },
            useSmallLevelUpNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_5_1');
                },
                saveOnChange: false,
            },
            useDefaultBankBorders: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('BANK_STRING_11');
                },
                onChange: (oldValue, newValue) => {
                    this.game.bank.updateItemBorders();
                },
                saveOnChange: true,
            },
            defaultToCurrentEquipSet: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('BANK_STRING_10');
                },
                saveOnChange: true,
            },
            hideMaxLevelMasteries: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('MENU_TEXT_HIDE_99');
                },
                onChange: () => {
                    spendMasteryMenu.onFilterChange();
                },
                saveOnChange: true,
            },
            showMasteryCheckpointconfirmations: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_4');
                },
                saveOnChange: true,
            },
            enableOfflinePushNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_3_0');
                },
                saveOnChange: true,
            },
            enableFarmingPushNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_3_1');
                },
                saveOnChange: true,
            },
            enableOfflineCombat: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return `${getLangString('SETTINGS_SETTING_0_0')}<br><small>${getLangString('SETTINGS_SETTING_0_1')}</small>`;
                },
                shouldChange: (oldValue, newValue) => {
                    const canChange = oldValue || offlineCombatChecks.every((check) => check);
                    if (!canChange) {
                        $('#modal-offline-combat-warning').modal('show');
                    }
                    return canChange;
                },
                saveOnChange: true,
            },
            enableMiniSidebar: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_SETTING_5_2');
                },
                onChange: (oldValue, newValue) => {
                    if (newValue) {
                        One.layout('sidebar_mini_on');
                    } else {
                        One.layout('sidebar_mini_off');
                    }
                },
                saveOnChange: false,
            },
            enableAutoEquipFood: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_MISC_0');
                },
                saveOnChange: true,
            },
            enableAutoSwapFood: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('COMBAT_MISC_121');
                },
                saveOnChange: true,
            },
            enablePerfectCooking: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_MISC_1');
                },
                onChange: (oldValue, newValue) => {
                    this.game.cooking.renderQueue.recipeRates = true;
                },
                saveOnChange: true,
            },
            showCropDestructionConfirmations: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_9');
                },
                saveOnChange: true,
            },
            showAstrologyMaxRollConfirmations: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_10');
                },
                saveOnChange: true,
            },
            showQuantityInItemNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_11');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    this.game.notifications.updateAllNotificationText();
                },
            },
            showItemPreservationNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_12');
                },
                saveOnChange: true,
            },
            showSlayerCoinNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_13');
                },
                saveOnChange: true,
            },
            showEquipmentSetsInCombatMinibar: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_4_3');
                },
                onChange: (oldValue, newValue) => {
                    if (newValue) {
                        $('.combatMinibarShowEquipmentSets').removeClass('d-none');
                    } else {
                        $('.combatMinibarShowEquipmentSets').addClass('d-none');
                    }
                },
                saveOnChange: true,
            },
            showBarsInCombatMinibar: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_4_4');
                },
                onChange: (oldValue, newValue) => {
                    if (newValue) {
                        $('.combatMinibarShowEnemyBars').removeClass('d-none');
                    } else {
                        $('.combatMinibarShowEnemyBars').addClass('d-none');
                    }
                },
                saveOnChange: true,
            },
            showCombatStunNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_5');
                },
                saveOnChange: true,
            },
            showCombatSleepNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_6');
                },
                saveOnChange: true,
            },
            showSummoningMarkDiscoveryModals: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_2_7');
                },
                saveOnChange: true,
            },
            enableCombatDamageSplashes: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_6_0');
                },
                saveOnChange: true,
            },
            enableProgressBars: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_6_1');
                },
                saveOnChange: true,
            },
            showTierIPotions: {
                currentValue: true,
                defaultValue: true,
                name: 'I',
                onChange: () => {
                    var _a;
                    if (((_a = this.game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined)
                        this.game.potions.openPotionSelectOnClick(this.game.openPage.action);
                },
                saveOnChange: true,
            },
            showTierIIPotions: {
                currentValue: true,
                defaultValue: true,
                name: 'II',
                onChange: () => {
                    var _a;
                    if (((_a = this.game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined)
                        this.game.potions.openPotionSelectOnClick(this.game.openPage.action);
                },
                saveOnChange: true,
            },
            showTierIIIPotions: {
                currentValue: true,
                defaultValue: true,
                name: 'III',
                onChange: () => {
                    var _a;
                    if (((_a = this.game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined)
                        this.game.potions.openPotionSelectOnClick(this.game.openPage.action);
                },
                saveOnChange: true,
            },
            showTierIVPotions: {
                currentValue: true,
                defaultValue: true,
                name: 'IV',
                onChange: () => {
                    var _a;
                    if (((_a = this.game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined)
                        this.game.potions.openPotionSelectOnClick(this.game.openPage.action);
                },
                saveOnChange: true,
            },
            enableEyebleachMode: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_TOGGLE_EYEBLEACH');
                },
                saveOnChange: true,
            },
            enableQuickConvert: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return 'Enable Quick Convert?';
                },
                saveOnChange: true,
            },
            showLockedTownshipBuildings: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('TOWNSHIP_MENU_SHOW_LOCKED_BUILDINGS');
                },
                onChange: () => {},
                saveOnChange: true,
            },
            useNewNotifications: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_NOTIFICATIONS_V2_TOGGLE');
                },
                onChange: () => {},
                saveOnChange: true,
            },
            showItemNamesInNotifications: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_NOTIFICATIONS_V2_ITEM_NAMES');
                },
                onChange: () => {
                    this.game.notifications.updateAllNotificationText();
                },
                saveOnChange: true,
            },
            importanceSummoningMarkFound: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_NOTIFICATIONS_V2_IMPORTANCE_SUMMONING');
                },
                onChange: () => {
                    this.game.notifications.updateAllNotificationImportance();
                },
                saveOnChange: true,
            },
            importanceErrorMessages: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_NOTIFICATIONS_V2_IMPORTANCE_ERROR');
                },
                onChange: () => {
                    this.game.notifications.updateAllNotificationImportance();
                },
                saveOnChange: true,
            },
            enableScrollableBankTabs: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_ENABLE_SCROLLABLE_BANK_TABS');
                },
                onChange: (_, newValue) => {
                    bankTabMenu.toggleScrollableTabs(newValue);
                },
                saveOnChange: false,
            },
            showWikiLinks: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_TOGGLE_OPEN_ON_WIKI_ICON');
                },
                onChange: () => {
                    toggleWikiLinkVisibility();
                },
                saveOnChange: true,
            },
            disableHexGridOutsideSight: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_HIDE_HEX_GRID_RANGE');
                },
                onChange: () => {
                    var _a;
                    (_a = this.game.cartography) === null || _a === void 0 ? void 0 : _a.onHexGridSettingChange();
                },
                saveOnChange: false,
            },
            enableMapAntialiasing: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_CARTOGRAPHY_MAP_ANTIALIASING');
                },
                saveOnChange: true,
            },
            showSkillXPNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_NOTIFICATIONS_V2_SKILL_XP');
                },
                saveOnChange: true,
            },
            superDarkMode: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_SUPER_DARK');
                },
                onChange: (oldValue, newValue) => {
                    if (newValue) {
                        if (!this.game.settings.darkMode)
                            document.body.classList.add('darkMode');
                        document.body.classList.add('superDark');
                        $('#first-time-btn-light').attr('class', 'btn btn-outline-info');
                    } else {
                        if (!this.game.settings.darkMode)
                            document.body.classList.remove('darkMode');
                        document.body.classList.remove('superDark');
                        $('#first-time-btn-light').attr('class', 'btn btn-info');
                    }
                },
                saveOnChange: false,
            },
            showExpansionBackgroundColours: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SHOW_EXPANSION_BACKGROUND_COLOURS');
                },
                onChange: () => {
                    combatAreaMenus.all.forEach((menu) => menu.updateAreaBackgroundColours());
                },
                saveOnChange: true,
            },
            showCombatAreaWarnings: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SHOW_COMBAT_AREA_WARNINGS');
                },
                onChange: () => {
                    combatAreaMenus.all.forEach((menu) => menu.updateAreaWarnings());
                },
                saveOnChange: true,
            },
            useCompactNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_USE_COMPACT_NOTIFICATIONS');
                },
                onChange: () => {
                    this.game.notifications.toggleCompactNotifications();
                },
                saveOnChange: true,
            },
            useLegacyNotifications: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_USE_LEGACY_NOTIFICATIONS');
                },
                onChange: () => {},
                saveOnChange: true,
            },
            useCat: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return 'Toggle cat';
                },
                onChange: () => {},
                saveOnChange: true,
            },
            throttleFrameRateOnInactivity: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return `${getLangString('SETTINGS_THROTTLE_FRAME_RATE')}<br><small>${getLangString('SETTINGS_THROTTLE_FRAME_RATE_DESC')}</small>`;
                },
                onChange: () => {},
                saveOnChange: true,
            },
            toggleBirthdayEvent: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('BIRTHDAY_EVENT_2023_TOGGLE_BIRTHDAY_MODE');
                },
                onChange: () => {},
                saveOnChange: true,
            },
            toggleDiscordRPC: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTING_ENABLE_DISCORD_RICH_PRESENCE');
                },
                onChange: () => {
                    setDiscordRPCDetails();
                },
                saveOnChange: true,
            },
            genericArtefactAllButOne: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('BANK_STRING_21');
                },
                onChange: () => {
                    if (this.game.archaeology) {
                        this.game.archaeology.museum.renderQueue.genericDonationInfo = true;
                    }
                },
                saveOnChange: true,
            },
            showAbyssalPiecesNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SHOW_ABYSSAL_PIECES_NOTIFICATIONS');
                },
                saveOnChange: true,
            },
            showAbyssalSlayerCoinNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_SHOW_ABYSSAL_SLAYER_COIN_NOTIFICATIONS');
                },
                saveOnChange: true,
            },
            enablePermaCorruption: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_enablePermaCorruption_HTML');
                },
                saveOnChange: true,
            },
            showAPNextToShopSidebar: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_showAPNextToShopSidebar');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    const sidebarQuantity = document.getElementById('nav-shop-currency-quantity');
                    const sidebarImage = document.getElementById('nav-shop-currency-image');
                    const sidebarTooltip = document.getElementById('nav-shop-currency-tooltip');
                    let newCurrency = this.game.gp;
                    if (newValue && this.game.abyssalPieces !== undefined)
                        newCurrency = this.game.abyssalPieces;
                    sidebarQuantity === null || sidebarQuantity === void 0 ? void 0 : sidebarQuantity.setAttribute('data-currency-quantity', newCurrency.id);
                    sidebarImage === null || sidebarImage === void 0 ? void 0 : sidebarImage.setAttribute('src', newCurrency.media);
                    sidebarTooltip === null || sidebarTooltip === void 0 ? void 0 : sidebarTooltip.setAttribute('data-currency-tooltip', newCurrency.id);
                    newCurrency.queueRender();
                },
            },
            showASCNextToSlayerSidebar: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_showASCNextToSlayerSidebar');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    const sidebarQuantity = document.getElementById('nav-slayer-currency');
                    const sidebarQuantityIcon = document.getElementById('nav-slayer-currency-icon');
                    let newCurrency = this.game.slayerCoins;
                    if (newValue && this.game.abyssalSlayerCoins !== undefined)
                        newCurrency = this.game.abyssalSlayerCoins;
                    sidebarQuantity === null || sidebarQuantity === void 0 ? void 0 : sidebarQuantity.setAttribute('data-currency-quantity', newCurrency.id);
                    if (sidebarQuantityIcon !== null)
                        sidebarQuantityIcon.src = newCurrency.media;
                    newCurrency.queueRender();
                },
            },
            showAbyssalXPNotifications: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_NOTIFICATIONS_V2_ABYSSAL_XP');
                },
                saveOnChange: true,
            },
            enableDoubleClickEquip: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_enableDoubleClickEquip');
                },
                saveOnChange: true,
            },
            enableDoubleClickOpen: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_enableDoubleClickOpen');
                },
                saveOnChange: true,
            },
            enableDoubleClickBury: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_enableDoubleClickBury');
                },
                saveOnChange: true,
            },
            showSPNextToPrayerSidebar: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_showSPNextToPrayerSidebar');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    this.game.combat.player.renderQueue.prayerPoints = true;
                    this.game.combat.player.renderQueue.soulPoints = true;
                },
            },
            enableStickyBankTabs: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_enableStickyBankTabs');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    newValue ? bankTabMenu.enableStickyBankTabs() : bankTabMenu.disableStickyBankTabs();
                },
            },
            useLegacyRealmSelection: {
                currentValue: false,
                defaultValue: false,
                get name() {
                    return getLangString('SETTINGS_useLegacyRealmSelection');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    var _a, _b;
                    this.game.skills.forEach((skill) => {
                        if (skill instanceof ArtisanSkill) {
                            skill.resetToDefaultSelectedRecipeBasedOnRealm();
                            skill.renderQueue.realmedCategorySelection = true;
                        }
                        if (!newValue)
                            skill.selectRealm(this.game.currentRealm);
                        else if (skill instanceof GatheringSkill || skill instanceof Farming || skill instanceof Township) {
                            skill.updateSkillHeaderRealm();
                        }
                    });
                    this.game.combat.renderQueue.categoryVisibilityByRealm.add(this.game.currentRealm);
                    this.game.combat.renderQueue.realmVisibility.add(this.game.currentRealm);
                    !newValue && this.game.realms.allObjects.find((realm) => realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) !== undefined ?
                        (_a = sidebar.category('Into the Abyss').item('Abyssal Realm').rootEl) === null || _a === void 0 ? void 0 : _a.classList.remove('d-none') :
                        (_b = sidebar.category('Into the Abyss').item('Abyssal Realm').rootEl) === null || _b === void 0 ? void 0 : _b.classList.add('d-none');
                    this.game.skills.forEach((skill) => {
                        skill.renderQueue.realmSelection = true;
                    });
                    this.game.renderQueue.realmVisibility = true;
                    this.game.realms.forEach((realm) => {
                        this.game.renderQueue.realmSidebarVisibility.add(realm);
                    });
                    this.game.renderQueue.sidebarSkillOpacity = true;
                    this.game.renderQueue.sidebarClass = true;
                },
            },
            showOpacityForSkillNavs: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_showOpacityForSkillNavs');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    this.game.renderQueue.sidebarSkillOpacity = true;
                },
            },
            bankFilterShowAll: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowAll');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (newValue) {
                        if (!this.bankFilterShowDemo)
                            this.toggleSetting('bankFilterShowDemo');
                        if (!this.bankFilterShowFull)
                            this.toggleSetting('bankFilterShowFull');
                        if (!this.bankFilterShowTotH)
                            this.toggleSetting('bankFilterShowTotH');
                        if (!this.bankFilterShowAoD)
                            this.toggleSetting('bankFilterShowAoD');
                        if (!this.bankFilterShowItA)
                            this.toggleSetting('bankFilterShowItA');
                        if (!this.bankFilterShowDamageReduction)
                            this.toggleSetting('bankFilterShowDamageReduction');
                        if (!this.bankFilterShowAbyssalResistance)
                            this.toggleSetting('bankFilterShowAbyssalResistance');
                        if (!this.bankFilterShowNormalDamage)
                            this.toggleSetting('bankFilterShowNormalDamage');
                        if (!this.bankFilterShowAbyssalDamage)
                            this.toggleSetting('bankFilterShowAbyssalDamage');
                        if (!this.bankFilterShowSkillXP)
                            this.toggleSetting('bankFilterShowSkillXP');
                        if (!this.bankFilterShowAbyssalXP)
                            this.toggleSetting('bankFilterShowAbyssalXP');
                        this.game.bank.renderQueue.bankFilter = true;
                    }
                },
            },
            bankFilterShowDemo: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowDemo');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowFull: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowFull');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowTotH: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowTotH');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowAoD: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowAoD');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowItA: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowItA');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowDamageReduction: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowDamageReduction');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowAbyssalResistance: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowAbyssalResistance');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowNormalDamage: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowNormalDamage');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowAbyssalDamage: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowAbyssalDamage');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowSkillXP: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowSkillXP');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            bankFilterShowAbyssalXP: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_bankFilterShowAbyssalXP');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    if (!newValue) {
                        if (this.bankFilterShowAll)
                            this.toggleSetting('bankFilterShowAll');
                    }
                    this.game.bank.renderQueue.bankFilter = true;
                },
            },
            alwaysShowRealmSelectAgility: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return getLangString('SETTINGS_alwaysShowRealmSelectAgility');
                },
                saveOnChange: true,
                onChange: (oldValue, newValue) => {
                    this.game.agility.renderQueue.realmSelection = true;
                },
            },
            enableSwipeSidebar: {
                currentValue: true,
                defaultValue: true,
                get name() {
                    return '(MOBILE) Enable Swipe to open Sidebar';
                },
                saveOnChange: true,
            },
        };
        this.choiceData = {
            showNeutralAttackModifiers: {
                currentValue: false,
                defaultValue: false,
                saveOnChange: true,
                get name() {
                    return `${getLangString('SETTINGS_SETTING_0_2')}<br><small>${getLangString('SETTINGS_SETTING_0_3')}</small>`;
                },
                options: [{
                        value: false,
                        get name() {
                            return setLang !== 'fr' ?
                                getLangString('SETTINGS_SETTING_0_4') :
                                `<span class="font-size-xs">${getLangString('SETTINGS_SETTING_0_4')}</span>`;
                        },
                    },
                    {
                        value: true,
                        get name() {
                            return setLang !== 'fr' ?
                                `<span class="text-warning">${getLangString('SETTINGS_SETTING_0_5')}</span>` :
                                `<span class="text-warning font-size-xs">${getLangString('SETTINGS_SETTING_0_5')}</span>`;
                        },
                    },
                ],
                onChange: (oldValue, newValue) => {
                    if (this.game.isGolbinRaid) {
                        this.game.golbinRaid.player.renderQueue.effects = true;
                        this.game.golbinRaid.renderQueue.spellBook = true;
                    } else {
                        this.game.combat.player.renderQueue.effects = true;
                        this.game.combat.renderQueue.spellBook = true;
                    }
                },
            },
            defaultPageOnLoad: {
                currentValue: this.game.activeActionPage,
                defaultValue: this.game.activeActionPage,
                saveOnChange: true,
                get name() {
                    return getLangString('SETTINGS_SETTING_5_0');
                },
                options: [],
                shouldChange: (oldValue, newValue) => {
                    if (newValue.action !== undefined) {
                        const action = newValue.action;
                        if (action instanceof Skill) {
                            if (action.isUnlocked)
                                return true;
                            SwalLocale.fire({
                                icon: 'error',
                                title: getLangString('MENU_TEXT_SKILL_LOCKED'),
                                html: `<span class='text-dark'>${getLangString('MENU_TEXT_SKILL_UNLOCK_DEFAULT_PAGE')}</span>`,
                            });
                            return false;
                        }
                    }
                    return true;
                },
            },
            formatNumberSetting: {
                currentValue: 0 /* NumberFormatSetting.ShowThousands */ ,
                defaultValue: 0 /* NumberFormatSetting.ShowThousands */ ,
                saveOnChange: true,
                get name() {
                    return `${getLangString('SETTINGS_SETTING_5_4')}<br><small>${getLangString('SETTINGS_SETTING_5_6')}</small>`;
                },
                options: [{
                        value: 0 /* NumberFormatSetting.ShowThousands */ ,
                        get name() {
                            return `1,000${getLangString('NUM_K')}`;
                        },
                    },
                    {
                        value: 1 /* NumberFormatSetting.CondenseThousands */ ,
                        get name() {
                            return `1${getLangString('NUM_M')}`;
                        },
                    },
                ],
            },
            bankSortOrder: {
                currentValue: 0 /* BankSortOrderSetting.Default */ ,
                defaultValue: 0 /* BankSortOrderSetting.Default */ ,
                saveOnChange: true,
                get name() {
                    return getLangString('BANK_STRING_12');
                },
                options: [{
                        value: 0 /* BankSortOrderSetting.Default */ ,
                        get name() {
                            return getLangString('BANK_STRING_14');
                        },
                    },
                    {
                        value: 5 /* BankSortOrderSetting.Custom */ ,
                        get name() {
                            return getLangString('BANK_STRING_42');
                        },
                    },
                    {
                        value: 1 /* BankSortOrderSetting.ItemValueDescending */ ,
                        get name() {
                            return getLangString('ITEM_VALUE_DESCENDING');
                        },
                    },
                    {
                        value: 2 /* BankSortOrderSetting.ItemValueAscending */ ,
                        get name() {
                            return getLangString('ITEM_VALUE_ASCENDING');
                        },
                    },
                    {
                        value: 3 /* BankSortOrderSetting.StackValueDescending */ ,
                        get name() {
                            return getLangString('STACK_VALUE_DESCENDING');
                        },
                    },
                    {
                        value: 4 /* BankSortOrderSetting.StackValueAscending */ ,
                        get name() {
                            return getLangString('STACK_VALUE_ASCENDING');
                        },
                    },
                ],
            },
            colourBlindMode: {
                currentValue: 0 /* ColourBlindModeSetting.None */ ,
                defaultValue: 0 /* ColourBlindModeSetting.None */ ,
                saveOnChange: true,
                name: 'Colour Blindness Mode',
                options: [{
                        value: 0 /* ColourBlindModeSetting.None */ ,
                        name: 'None',
                    },
                    {
                        value: 1 /* ColourBlindModeSetting.RedGreen */ ,
                        name: 'Red-Green',
                    },
                ],
                onChange: (oldValue, newValue) => {
                    if (oldValue !== 0 /* ColourBlindModeSetting.None */ ) {
                        document.body.classList.remove(colourBlindClasses[oldValue]);
                    }
                    if (newValue !== 0 /* ColourBlindModeSetting.None */ ) {
                        document.body.classList.add(colourBlindClasses[newValue]);
                    }
                },
            },
            notificationHorizontalPosition: {
                currentValue: 1 /* NotificationHorizontalPositions.CENTER */ ,
                defaultValue: 1 /* NotificationHorizontalPositions.CENTER */ ,
                saveOnChange: true,
                get name() {
                    return getLangString('SETTINGS_NOTIFICATIONS_V2_POSITION');
                },
                options: [{
                        value: 1 /* NotificationHorizontalPositions.CENTER */ ,
                        get name() {
                            return getLangString('SETTINGS_NOTIFICATIONS_V2_POSITION_Center');
                        },
                    },
                    {
                        value: 0 /* NotificationHorizontalPositions.LEFT */ ,
                        get name() {
                            return getLangString('SETTINGS_NOTIFICATIONS_V2_POSITION_Left');
                        },
                    },
                    {
                        value: 2 /* NotificationHorizontalPositions.RIGHT */ ,
                        get name() {
                            return getLangString('SETTINGS_NOTIFICATIONS_V2_POSITION_Right');
                        },
                    },
                ],
                onChange: () => {
                    this.game.notifications.updateAllNotificationPositions();
                },
            },
            notificationDisappearDelay: {
                currentValue: 2,
                defaultValue: 2,
                saveOnChange: true,
                get name() {
                    return getLangString('SETTINGS_NOTIFICATIONS_V2_DELAY');
                },
                options: [{
                        value: 1,
                        get name() {
                            return getLangString('TIME_UNIT_second');
                        },
                    },
                    {
                        value: 2,
                        get name() {
                            return templateLangString('TIME_UNIT_seconds', {
                                seconds: `${2}`
                            });
                        },
                    },
                    {
                        value: 3,
                        get name() {
                            return templateLangString('TIME_UNIT_seconds', {
                                seconds: `${3}`
                            });
                        },
                    },
                    {
                        value: 4,
                        get name() {
                            return templateLangString('TIME_UNIT_seconds', {
                                seconds: `${4}`
                            });
                        },
                    },
                    {
                        value: 5,
                        get name() {
                            return templateLangString('TIME_UNIT_seconds', {
                                seconds: `${5}`
                            });
                        },
                    },
                    {
                        value: 10,
                        get name() {
                            return templateLangString('TIME_UNIT_seconds', {
                                seconds: `${10}`
                            });
                        },
                    },
                    {
                        value: 20,
                        get name() {
                            return templateLangString('TIME_UNIT_seconds', {
                                seconds: `${20}`
                            });
                        },
                    },
                ],
                onChange: () => {},
            },
            mapTextureQuality: {
                currentValue: 2 /* MapTextureQuality.High */ ,
                defaultValue: 2 /* MapTextureQuality.High */ ,
                saveOnChange: true,
                get name() {
                    return getLangString('SETTINGS_CARTOGRAPHY_MAP_TEXTURE_QUALITY');
                },
                options: [{
                        value: 2 /* MapTextureQuality.High */ ,
                        name: getLangString('QUALITY_HIGH'),
                    },
                    {
                        value: 1 /* MapTextureQuality.Medium */ ,
                        name: getLangString('QUALITY_MEDIUM'),
                    },
                    {
                        value: 0 /* MapTextureQuality.Low */ ,
                        name: getLangString('QUALITY_LOW'),
                    },
                ],
            },
            backgroundImage: {
                currentValue: 2,
                defaultValue: 2,
                saveOnChange: true,
                get name() {
                    return getLangString('SETTINGS_BACKGROUND_IMAGE');
                },
                options: [{
                        value: 0,
                        name: `<img src="${assets.getURI('assets/media/main/bg_0_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 1,
                        name: `<img src="${assets.getURI('assets/media/main/bg_1_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 2,
                        name: `<img src="${assets.getURI('assets/media/main/bg_2_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 3,
                        name: `<img src="${assets.getURI('assets/media/main/bg_3_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 4,
                        name: `<img src="${assets.getURI('assets/media/main/bg_4_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 5,
                        name: `<img src="${assets.getURI('assets/media/main/bg_5_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 6,
                        name: `<img src="${assets.getURI('assets/media/main/bg_6_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 7,
                        name: `<img src="${assets.getURI('assets/media/main/bg_7_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 9,
                        name: `<img src="${assets.getURI('assets/media/main/bg_9_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                    {
                        value: 8,
                        name: `<img src="${assets.getURI('assets/media/main/bg_8_thumbnail.jpg')}" style="width:256px"/>`,
                    },
                ],
                onChange: (_, newValue) => {
                    setGameBackgroundImage(newValue.toString());
                },
            },
            cartographyFrameRateCap: {
                currentValue: 0,
                defaultValue: 0,
                saveOnChange: true,
                get name() {
                    return getLangString('SETTINGS_FRAME_RATE_CAP');
                },
                options: [{
                        value: 0,
                        get name() {
                            return getLangString('SETTINGS_NATIVE_REFRESH_RATE');
                        },
                    },
                    {
                        value: 30,
                        get name() {
                            return templateLangString('SETTINGS_FPS', {
                                value: `${numberWithCommas(30)}`
                            });
                        },
                    },
                    {
                        value: 45,
                        get name() {
                            return templateLangString('SETTINGS_FPS', {
                                value: `${numberWithCommas(45)}`
                            });
                        },
                    },
                    {
                        value: 60,
                        get name() {
                            return templateLangString('SETTINGS_FPS', {
                                value: `${numberWithCommas(60)}`
                            });
                        },
                    },
                    {
                        value: 72,
                        get name() {
                            return templateLangString('SETTINGS_FPS', {
                                value: `${numberWithCommas(72)}`
                            });
                        },
                    },
                    {
                        value: 90,
                        get name() {
                            return templateLangString('SETTINGS_FPS', {
                                value: `${numberWithCommas(90)}`
                            });
                        },
                    },
                    {
                        value: 120,
                        get name() {
                            return templateLangString('SETTINGS_FPS', {
                                value: `${numberWithCommas(120)}`
                            });
                        },
                    },
                    {
                        value: 144,
                        get name() {
                            return templateLangString('SETTINGS_FPS', {
                                value: `${numberWithCommas(144)}`
                            });
                        },
                    },
                    {
                        value: 240,
                        get name() {
                            return templateLangString('SETTINGS_FPS', {
                                value: `${numberWithCommas(240)}`
                            });
                        },
                    },
                ],
                onChange: (oldValue, newValue) => {
                    PIXI.Ticker.shared.maxFPS = newValue;
                },
            },
            sidebarLevels: {
                currentValue: 0 /* SidebarLevelSetting.Both */ ,
                defaultValue: 0 /* SidebarLevelSetting.Both */ ,
                saveOnChange: true,
                get name() {
                    return getLangString('SETTINGS_sidebarLevels');
                },
                options: [{
                        value: 0 /* SidebarLevelSetting.Both */ ,
                        get name() {
                            return getLangString('SETTINGS_sidebarLevels_BOTH');
                        },
                    },
                    {
                        value: 1 /* SidebarLevelSetting.Normal */ ,
                        get name() {
                            return getLangString('SETTINGS_sidebarLevels_NORMAL');
                        },
                    },
                    {
                        value: 2 /* SidebarLevelSetting.Abyssal */ ,
                        get name() {
                            return getLangString('SETTINGS_sidebarLevels_ABYSSAL');
                        },
                    },
                ],
                onChange(oldValue, newValue) {
                    skillNav.updateDisplayedLevels();
                },
            },
        };
    }
    get continueIfBankFull() {
        return this.boolData.continueIfBankFull.currentValue;
    }
    get continueThievingOnStun() {
        return this.boolData.continueThievingOnStun.currentValue;
    }
    get autoRestartDungeon() {
        return this.boolData.autoRestartDungeon.currentValue;
    }
    get autoCloudSave() {
        return this.boolData.autoCloudSave.currentValue;
    }
    get darkMode() {
        return this.boolData.darkMode.currentValue;
    }
    get showGPNotifications() {
        return this.boolData.showGPNotifications.currentValue;
    }
    get enableAccessibility() {
        return this.boolData.enableAccessibility.currentValue;
    }
    get showEnemySkillLevels() {
        return this.boolData.showEnemySkillLevels.currentValue;
    }
    get showCloseConfirmations() {
        return this.boolData.showCloseConfirmations.currentValue;
    }
    get hideThousandsSeperator() {
        return this.boolData.hideThousandsSeperator.currentValue;
    }
    get showVirtualLevels() {
        return this.boolData.showVirtualLevels.currentValue;
    }
    get showSaleConfirmations() {
        return this.boolData.showSaleConfirmations.currentValue;
    }
    get showShopConfirmations() {
        return this.boolData.showShopConfirmations.currentValue;
    }
    get pauseOnUnfocus() {
        return this.boolData.pauseOnUnfocus.currentValue;
    }
    get showCombatMinibar() {
        return this.boolData.showCombatMinibar.currentValue;
    }
    get showCombatMinibarCombat() {
        return this.boolData.showCombatMinibarCombat.currentValue;
    }
    get showSkillingMinibar() {
        return this.boolData.showSkillingMinibar.currentValue;
    }
    get useCombinationRunes() {
        return this.boolData.useCombinationRunes.currentValue;
    }
    get enableAutoSlayer() {
        return this.boolData.enableAutoSlayer.currentValue;
    }
    get useDefaultBankBorders() {
        return this.boolData.useDefaultBankBorders.currentValue;
    }
    get defaultToCurrentEquipSet() {
        return this.boolData.defaultToCurrentEquipSet.currentValue;
    }
    get hideMaxLevelMasteries() {
        return this.boolData.hideMaxLevelMasteries.currentValue;
    }
    get showMasteryCheckpointconfirmations() {
        return this.boolData.showMasteryCheckpointconfirmations.currentValue;
    }
    get enableOfflinePushNotifications() {
        return this.boolData.enableOfflinePushNotifications.currentValue;
    }
    get enableFarmingPushNotifications() {
        return this.boolData.enableFarmingPushNotifications.currentValue;
    }
    get enableOfflineCombat() {
        return this.boolData.enableOfflineCombat.currentValue;
    }
    get showNeutralAttackModifiers() {
        return this.choiceData.showNeutralAttackModifiers.currentValue;
    }
    get enableMiniSidebar() {
        return this.boolData.enableMiniSidebar.currentValue;
    }
    get enableAutoEquipFood() {
        return this.boolData.enableAutoEquipFood.currentValue;
    }
    get enableAutoSwapFood() {
        return this.boolData.enableAutoSwapFood.currentValue;
    }
    get enablePerfectCooking() {
        return this.boolData.enablePerfectCooking.currentValue;
    }
    get showCropDestructionConfirmations() {
        return this.boolData.showCropDestructionConfirmations.currentValue;
    }
    get showAstrologyMaxRollConfirmations() {
        return this.boolData.showAstrologyMaxRollConfirmations.currentValue;
    }
    get showQuantityInItemNotifications() {
        return this.boolData.showQuantityInItemNotifications.currentValue;
    }
    get showItemPreservationNotifications() {
        return this.boolData.showItemPreservationNotifications.currentValue;
    }
    get showSlayerCoinNotifications() {
        return this.boolData.showSlayerCoinNotifications.currentValue;
    }
    get showEquipmentSetsInCombatMinibar() {
        return this.boolData.showEquipmentSetsInCombatMinibar.currentValue;
    }
    get showBarsInCombatMinibar() {
        return this.boolData.showBarsInCombatMinibar.currentValue;
    }
    get showCombatStunNotifications() {
        return this.boolData.showCombatStunNotifications.currentValue;
    }
    get showCombatSleepNotifications() {
        return this.boolData.showCombatSleepNotifications.currentValue;
    }
    get showSummoningMarkDiscoveryModals() {
        return this.boolData.showSummoningMarkDiscoveryModals.currentValue;
    }
    get enableCombatDamageSplashes() {
        return this.boolData.enableCombatDamageSplashes.currentValue;
    }
    get enableProgressBars() {
        return this.boolData.enableProgressBars.currentValue;
    }
    get showItemNotifications() {
        return this.boolData.showItemNotifications.currentValue;
    }
    get useSmallLevelUpNotifications() {
        return this.boolData.useSmallLevelUpNotifications.currentValue;
    }
    get showTierIPotions() {
        return this.boolData.showTierIPotions.currentValue;
    }
    get showTierIIPotions() {
        return this.boolData.showTierIIPotions.currentValue;
    }
    get showTierIIIPotions() {
        return this.boolData.showTierIIIPotions.currentValue;
    }
    get showTierIVPotions() {
        return this.boolData.showTierIVPotions.currentValue;
    }
    get showPotionTiers() {
        return [this.showTierIPotions, this.showTierIIPotions, this.showTierIIIPotions, this.showTierIVPotions];
    }
    get enableEyebleachMode() {
        return this.boolData.enableEyebleachMode.currentValue;
    }
    get enableQuickConvert() {
        return this.boolData.enableQuickConvert.currentValue;
    }
    get showLockedTownshipBuildings() {
        return this.boolData.showLockedTownshipBuildings.currentValue;
    }
    get useNewNotifications() {
        return this.boolData.useNewNotifications.currentValue;
    }
    get showItemNamesInNotifications() {
        return this.boolData.showItemNamesInNotifications.currentValue;
    }
    get importanceSummoningMarkFound() {
        return this.boolData.importanceSummoningMarkFound.currentValue;
    }
    get importanceErrorMessages() {
        return this.boolData.importanceErrorMessages.currentValue;
    }
    get showWikiLinks() {
        return this.boolData.showWikiLinks.currentValue;
    }
    get defaultPageOnLoad() {
        return this.choiceData.defaultPageOnLoad.currentValue;
    }
    get formatNumberSetting() {
        return this.choiceData.formatNumberSetting.currentValue;
    }
    get bankSortOrder() {
        return this.choiceData.bankSortOrder.currentValue;
    }
    get colourBlindMode() {
        return this.choiceData.colourBlindMode.currentValue;
    }
    get notificationHorizontalPosition() {
        return this.choiceData.notificationHorizontalPosition.currentValue;
    }
    get notificationDisappearDelay() {
        return this.choiceData.notificationDisappearDelay.currentValue;
    }
    get enableScrollableBankTabs() {
        return this.boolData.enableScrollableBankTabs.currentValue;
    }
    get disableHexGridOutsideSight() {
        return this.boolData.disableHexGridOutsideSight.currentValue;
    }
    get mapTextureQuality() {
        return this.choiceData.mapTextureQuality.currentValue;
    }
    get enableMapAntialiasing() {
        return this.boolData.enableMapAntialiasing.currentValue;
    }
    get showSkillXPNotifications() {
        return this.boolData.showSkillXPNotifications.currentValue;
    }
    get backgroundImage() {
        return this.choiceData.backgroundImage.currentValue;
    }
    get superDarkMode() {
        return this.boolData.superDarkMode.currentValue;
    }
    get showExpansionBackgroundColours() {
        return this.boolData.showExpansionBackgroundColours.currentValue;
    }
    get showCombatAreaWarnings() {
        return this.boolData.showCombatAreaWarnings.currentValue;
    }
    get useCompactNotifications() {
        return this.boolData.useCompactNotifications.currentValue;
    }
    get useLegacyNotifications() {
        return this.boolData.useLegacyNotifications.currentValue;
    }
    get useCat() {
        return this.boolData.useCat.currentValue;
    }
    get throttleFrameRateOnInactivity() {
        return this.boolData.throttleFrameRateOnInactivity.currentValue;
    }
    get cartographyFrameRateCap() {
        return this.choiceData.cartographyFrameRateCap.currentValue;
    }
    get toggleBirthdayEvent() {
        return this.boolData.toggleBirthdayEvent.currentValue;
    }
    get toggleDiscordRPC() {
        return this.boolData.toggleDiscordRPC.currentValue;
    }
    get genericArtefactAllButOne() {
        return this.boolData.genericArtefactAllButOne.currentValue;
    }
    get showAbyssalPiecesNotifications() {
        return this.boolData.showAbyssalPiecesNotifications.currentValue;
    }
    get showAbyssalSlayerCoinNotifications() {
        return this.boolData.showAbyssalSlayerCoinNotifications.currentValue;
    }
    get enablePermaCorruption() {
        return this.boolData.enablePermaCorruption.currentValue;
    }
    get showAPNextToShopSidebar() {
        return this.boolData.showAPNextToShopSidebar.currentValue;
    }
    get showASCNextToSlayerSidebar() {
        return this.boolData.showASCNextToSlayerSidebar.currentValue;
    }
    get sidebarLevels() {
        return this.choiceData.sidebarLevels.currentValue;
    }
    get showAbyssalXPNotifications() {
        return this.boolData.showAbyssalXPNotifications.currentValue;
    }
    get enableDoubleClickEquip() {
        return this.boolData.enableDoubleClickEquip.currentValue;
    }
    get enableDoubleClickOpen() {
        return this.boolData.enableDoubleClickOpen.currentValue;
    }
    get enableDoubleClickBury() {
        return this.boolData.enableDoubleClickBury.currentValue;
    }
    get showSPNextToPrayerSidebar() {
        return this.boolData.showSPNextToPrayerSidebar.currentValue;
    }
    get enableStickyBankTabs() {
        return this.boolData.enableStickyBankTabs.currentValue;
    }
    get useLegacyRealmSelection() {
        return this.boolData.useLegacyRealmSelection.currentValue;
    }
    get showOpacityForSkillNavs() {
        return this.boolData.showOpacityForSkillNavs.currentValue;
    }
    get bankFilterShowAll() {
        return this.boolData.bankFilterShowAll.currentValue;
    }
    get bankFilterShowDemo() {
        return this.boolData.bankFilterShowDemo.currentValue;
    }
    get bankFilterShowFull() {
        return this.boolData.bankFilterShowFull.currentValue;
    }
    get bankFilterShowTotH() {
        return this.boolData.bankFilterShowTotH.currentValue;
    }
    get bankFilterShowAoD() {
        return this.boolData.bankFilterShowAoD.currentValue;
    }
    get bankFilterShowItA() {
        return this.boolData.bankFilterShowItA.currentValue;
    }
    get bankFilterShowDamageReduction() {
        return this.boolData.bankFilterShowDamageReduction.currentValue;
    }
    get bankFilterShowAbyssalResistance() {
        return this.boolData.bankFilterShowAbyssalResistance.currentValue;
    }
    get bankFilterShowNormalDamage() {
        return this.boolData.bankFilterShowNormalDamage.currentValue;
    }
    get bankFilterShowAbyssalDamage() {
        return this.boolData.bankFilterShowAbyssalDamage.currentValue;
    }
    get bankFilterShowSkillXP() {
        return this.boolData.bankFilterShowSkillXP.currentValue;
    }
    get bankFilterShowAbyssalXP() {
        return this.boolData.bankFilterShowAbyssalXP.currentValue;
    }
    get alwaysShowRealmSelectAgility() {
        return this.boolData.alwaysShowRealmSelectAgility.currentValue;
    }
    get enableSwipeSidebar() {
        return this.boolData.enableSwipeSidebar.currentValue;
    }
    postDataRegistration() {
        // Populate default page options
        const defaultPages = this.game.pages.filter((page) => page.canBeDefault);
        this.choiceData.defaultPageOnLoad.options = defaultPages.map((page) => {
            return new DefaultPageOption(page);
        });
    }
    encode(writer) {
        writer.writeBoolean(this.boolData.continueIfBankFull.currentValue);
        writer.writeBoolean(this.boolData.continueThievingOnStun.currentValue);
        writer.writeBoolean(this.boolData.autoRestartDungeon.currentValue);
        writer.writeBoolean(this.boolData.autoCloudSave.currentValue);
        writer.writeBoolean(this.boolData.darkMode.currentValue);
        writer.writeBoolean(this.boolData.showGPNotifications.currentValue);
        writer.writeBoolean(this.boolData.enableAccessibility.currentValue);
        writer.writeBoolean(this.boolData.showEnemySkillLevels.currentValue);
        writer.writeBoolean(this.boolData.showCloseConfirmations.currentValue);
        writer.writeBoolean(this.boolData.hideThousandsSeperator.currentValue);
        writer.writeBoolean(this.boolData.showVirtualLevels.currentValue);
        writer.writeBoolean(this.boolData.showSaleConfirmations.currentValue);
        writer.writeBoolean(this.boolData.showShopConfirmations.currentValue);
        writer.writeBoolean(this.boolData.pauseOnUnfocus.currentValue);
        writer.writeBoolean(this.boolData.showCombatMinibar.currentValue);
        writer.writeBoolean(this.boolData.showCombatMinibarCombat.currentValue);
        writer.writeBoolean(this.boolData.showSkillingMinibar.currentValue);
        writer.writeBoolean(this.boolData.useCombinationRunes.currentValue);
        writer.writeBoolean(this.boolData.enableAutoSlayer.currentValue);
        writer.writeBoolean(this.boolData.showItemNotifications.currentValue);
        writer.writeBoolean(this.boolData.useSmallLevelUpNotifications.currentValue);
        writer.writeBoolean(this.boolData.useDefaultBankBorders.currentValue);
        writer.writeBoolean(this.boolData.defaultToCurrentEquipSet.currentValue);
        writer.writeBoolean(this.boolData.hideMaxLevelMasteries.currentValue);
        writer.writeBoolean(this.boolData.showMasteryCheckpointconfirmations.currentValue);
        writer.writeBoolean(this.boolData.enableOfflinePushNotifications.currentValue);
        writer.writeBoolean(this.boolData.enableFarmingPushNotifications.currentValue);
        writer.writeBoolean(this.boolData.enableOfflineCombat.currentValue);
        writer.writeBoolean(this.boolData.enableMiniSidebar.currentValue);
        writer.writeBoolean(this.boolData.enableAutoEquipFood.currentValue);
        writer.writeBoolean(this.boolData.enableAutoSwapFood.currentValue);
        writer.writeBoolean(this.boolData.enablePerfectCooking.currentValue);
        writer.writeBoolean(this.boolData.showCropDestructionConfirmations.currentValue);
        writer.writeBoolean(this.boolData.showAstrologyMaxRollConfirmations.currentValue);
        writer.writeBoolean(this.boolData.showQuantityInItemNotifications.currentValue);
        writer.writeBoolean(this.boolData.showItemPreservationNotifications.currentValue);
        writer.writeBoolean(this.boolData.showSlayerCoinNotifications.currentValue);
        writer.writeBoolean(this.boolData.showEquipmentSetsInCombatMinibar.currentValue);
        writer.writeBoolean(this.boolData.showBarsInCombatMinibar.currentValue);
        writer.writeBoolean(this.boolData.showCombatStunNotifications.currentValue);
        writer.writeBoolean(this.boolData.showCombatSleepNotifications.currentValue);
        writer.writeBoolean(this.boolData.showSummoningMarkDiscoveryModals.currentValue);
        writer.writeBoolean(this.boolData.enableCombatDamageSplashes.currentValue);
        writer.writeBoolean(this.boolData.enableProgressBars.currentValue);
        writer.writeBoolean(this.boolData.showTierIPotions.currentValue);
        writer.writeBoolean(this.boolData.showTierIIPotions.currentValue);
        writer.writeBoolean(this.boolData.showTierIIIPotions.currentValue);
        writer.writeBoolean(this.boolData.showTierIVPotions.currentValue);
        writer.writeBoolean(this.choiceData.showNeutralAttackModifiers.currentValue);
        writer.writeNamespacedObject(this.choiceData.defaultPageOnLoad.currentValue);
        writer.writeUint8(this.choiceData.formatNumberSetting.currentValue);
        writer.writeUint8(this.choiceData.bankSortOrder.currentValue);
        writer.writeUint8(this.choiceData.colourBlindMode.currentValue);
        writer.writeBoolean(this.boolData.enableEyebleachMode.currentValue);
        writer.writeBoolean(this.boolData.enableQuickConvert.currentValue);
        writer.writeBoolean(this.boolData.showLockedTownshipBuildings.currentValue);
        writer.writeBoolean(this.boolData.useNewNotifications.currentValue);
        writer.writeUint8(this.choiceData.notificationHorizontalPosition.currentValue);
        writer.writeUint8(this.choiceData.notificationDisappearDelay.currentValue);
        writer.writeBoolean(this.boolData.showItemNamesInNotifications.currentValue);
        writer.writeBoolean(this.boolData.importanceSummoningMarkFound.currentValue);
        writer.writeBoolean(this.boolData.importanceErrorMessages.currentValue);
        writer.writeBoolean(this.boolData.enableScrollableBankTabs.currentValue);
        writer.writeBoolean(this.boolData.showWikiLinks.currentValue);
        writer.writeBoolean(this.boolData.disableHexGridOutsideSight.currentValue);
        writer.writeUint8(this.choiceData.mapTextureQuality.currentValue);
        writer.writeBoolean(this.boolData.enableMapAntialiasing.currentValue);
        writer.writeBoolean(this.boolData.showSkillXPNotifications.currentValue);
        writer.writeInt8(this.choiceData.backgroundImage.currentValue);
        writer.writeBoolean(this.boolData.superDarkMode.currentValue);
        writer.writeBoolean(this.boolData.showExpansionBackgroundColours.currentValue);
        writer.writeBoolean(this.boolData.showCombatAreaWarnings.currentValue);
        writer.writeBoolean(this.boolData.useCompactNotifications.currentValue);
        writer.writeBoolean(this.boolData.useLegacyNotifications.currentValue);
        writer.writeBoolean(this.boolData.useCat.currentValue);
        writer.writeBoolean(this.boolData.throttleFrameRateOnInactivity.currentValue);
        writer.writeUint16(this.choiceData.cartographyFrameRateCap.currentValue);
        writer.writeBoolean(this.boolData.toggleBirthdayEvent.currentValue);
        writer.writeBoolean(this.boolData.toggleDiscordRPC.currentValue);
        writer.writeBoolean(this.boolData.genericArtefactAllButOne.currentValue);
        writer.writeSet(this.hiddenMasteryNamespaces, (namespace, writer) => writer.writeString(namespace));
        writer.writeBoolean(this.boolData.enableDoubleClickEquip.currentValue);
        writer.writeBoolean(this.boolData.enableDoubleClickOpen.currentValue);
        writer.writeBoolean(this.boolData.enableDoubleClickBury.currentValue);
        writer.writeBoolean(this.boolData.showAbyssalPiecesNotifications.currentValue);
        writer.writeBoolean(this.boolData.showAbyssalSlayerCoinNotifications.currentValue);
        writer.writeBoolean(this.boolData.enablePermaCorruption.currentValue);
        writer.writeBoolean(this.boolData.showAPNextToShopSidebar.currentValue);
        writer.writeBoolean(this.boolData.showASCNextToSlayerSidebar.currentValue);
        writer.writeUint8(this.choiceData.sidebarLevels.currentValue);
        writer.writeBoolean(this.boolData.showAbyssalXPNotifications.currentValue);
        writer.writeBoolean(this.boolData.showSPNextToPrayerSidebar.currentValue);
        writer.writeBoolean(this.boolData.enableStickyBankTabs.currentValue);
        writer.writeBoolean(this.boolData.useLegacyRealmSelection.currentValue);
        writer.writeBoolean(this.boolData.showOpacityForSkillNavs.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowAll.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowDemo.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowFull.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowTotH.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowAoD.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowItA.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowDamageReduction.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowAbyssalResistance.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowNormalDamage.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowAbyssalDamage.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowSkillXP.currentValue);
        writer.writeBoolean(this.boolData.bankFilterShowAbyssalXP.currentValue);
        writer.writeBoolean(this.boolData.alwaysShowRealmSelectAgility.currentValue);
        writer.writeBoolean(this.boolData.enableSwipeSidebar.currentValue);
        return writer;
    }
    decode(reader, version) {
        this.boolData.continueIfBankFull.currentValue = reader.getBoolean();
        this.boolData.continueThievingOnStun.currentValue = reader.getBoolean();
        this.boolData.autoRestartDungeon.currentValue = reader.getBoolean();
        this.boolData.autoCloudSave.currentValue = reader.getBoolean();
        this.boolData.darkMode.currentValue = reader.getBoolean();
        this.boolData.showGPNotifications.currentValue = reader.getBoolean();
        this.boolData.enableAccessibility.currentValue = reader.getBoolean();
        this.boolData.showEnemySkillLevels.currentValue = reader.getBoolean();
        this.boolData.showCloseConfirmations.currentValue = reader.getBoolean();
        this.boolData.hideThousandsSeperator.currentValue = reader.getBoolean();
        this.boolData.showVirtualLevels.currentValue = reader.getBoolean();
        this.boolData.showSaleConfirmations.currentValue = reader.getBoolean();
        this.boolData.showShopConfirmations.currentValue = reader.getBoolean();
        this.boolData.pauseOnUnfocus.currentValue = reader.getBoolean();
        this.boolData.showCombatMinibar.currentValue = reader.getBoolean();
        this.boolData.showCombatMinibarCombat.currentValue = reader.getBoolean();
        this.boolData.showSkillingMinibar.currentValue = reader.getBoolean();
        this.boolData.useCombinationRunes.currentValue = reader.getBoolean();
        this.boolData.enableAutoSlayer.currentValue = reader.getBoolean();
        this.boolData.showItemNotifications.currentValue = reader.getBoolean();
        this.boolData.useSmallLevelUpNotifications.currentValue = reader.getBoolean();
        this.boolData.useDefaultBankBorders.currentValue = reader.getBoolean();
        this.boolData.defaultToCurrentEquipSet.currentValue = reader.getBoolean();
        this.boolData.hideMaxLevelMasteries.currentValue = reader.getBoolean();
        this.boolData.showMasteryCheckpointconfirmations.currentValue = reader.getBoolean();
        this.boolData.enableOfflinePushNotifications.currentValue = reader.getBoolean();
        this.boolData.enableFarmingPushNotifications.currentValue = reader.getBoolean();
        this.boolData.enableOfflineCombat.currentValue = reader.getBoolean();
        this.boolData.enableMiniSidebar.currentValue = reader.getBoolean();
        this.boolData.enableAutoEquipFood.currentValue = reader.getBoolean();
        this.boolData.enableAutoSwapFood.currentValue = reader.getBoolean();
        this.boolData.enablePerfectCooking.currentValue = reader.getBoolean();
        this.boolData.showCropDestructionConfirmations.currentValue = reader.getBoolean();
        this.boolData.showAstrologyMaxRollConfirmations.currentValue = reader.getBoolean();
        this.boolData.showQuantityInItemNotifications.currentValue = reader.getBoolean();
        this.boolData.showItemPreservationNotifications.currentValue = reader.getBoolean();
        this.boolData.showSlayerCoinNotifications.currentValue = reader.getBoolean();
        this.boolData.showEquipmentSetsInCombatMinibar.currentValue = reader.getBoolean();
        this.boolData.showBarsInCombatMinibar.currentValue = reader.getBoolean();
        this.boolData.showCombatStunNotifications.currentValue = reader.getBoolean();
        this.boolData.showCombatSleepNotifications.currentValue = reader.getBoolean();
        this.boolData.showSummoningMarkDiscoveryModals.currentValue = reader.getBoolean();
        this.boolData.enableCombatDamageSplashes.currentValue = reader.getBoolean();
        this.boolData.enableProgressBars.currentValue = reader.getBoolean();
        this.boolData.showTierIPotions.currentValue = reader.getBoolean();
        this.boolData.showTierIIPotions.currentValue = reader.getBoolean();
        this.boolData.showTierIIIPotions.currentValue = reader.getBoolean();
        this.boolData.showTierIVPotions.currentValue = reader.getBoolean();
        this.choiceData.showNeutralAttackModifiers.currentValue = reader.getBoolean();
        let defaultPageOnLoad = reader.getNamespacedObject(this.game.pages);
        if (typeof defaultPageOnLoad === 'string')
            defaultPageOnLoad = this.game.currentGamemode.startingPage;
        this.choiceData.defaultPageOnLoad.currentValue = defaultPageOnLoad;
        this.choiceData.formatNumberSetting.currentValue = reader.getUint8();
        this.choiceData.bankSortOrder.currentValue = reader.getUint8();
        this.choiceData.colourBlindMode.currentValue = reader.getUint8();
        if (version >= 26)
            this.boolData.enableEyebleachMode.currentValue = reader.getBoolean();
        if (version >= 27)
            this.boolData.enableQuickConvert.currentValue = reader.getBoolean();
        if (version >= 28)
            this.boolData.showLockedTownshipBuildings.currentValue = reader.getBoolean();
        if (version >= 48) {
            this.boolData.useNewNotifications.currentValue = reader.getBoolean();
            this.choiceData.notificationHorizontalPosition.currentValue = reader.getUint8();
            this.choiceData.notificationDisappearDelay.currentValue = reader.getUint8();
            this.boolData.showItemNamesInNotifications.currentValue = reader.getBoolean();
        }
        if (version >= 49) {
            this.boolData.importanceSummoningMarkFound.currentValue = reader.getBoolean();
            this.boolData.importanceErrorMessages.currentValue = reader.getBoolean();
        }
        if (version >= 51 && version < 59)
            reader.getBoolean();
        if (version >= 58)
            this.boolData.enableScrollableBankTabs.currentValue = reader.getBoolean();
        if (version >= 60) {
            this.boolData.showWikiLinks.currentValue = reader.getBoolean();
        }
        if (version >= 61) {
            this.boolData.disableHexGridOutsideSight.currentValue = reader.getBoolean();
        }
        if (version === 63)
            reader.getBoolean();
        if (version >= 64) {
            this.choiceData.mapTextureQuality.currentValue = reader.getUint8();
            this.boolData.enableMapAntialiasing.currentValue = reader.getBoolean();
        }
        if (version >= 66)
            this.boolData.showSkillXPNotifications.currentValue = reader.getBoolean();
        if (version >= 67)
            this.choiceData.backgroundImage.currentValue = reader.getInt8();
        if (version >= 68)
            this.boolData.superDarkMode.currentValue = reader.getBoolean();
        if (version >= 70) {
            this.boolData.showExpansionBackgroundColours.currentValue = reader.getBoolean();
            this.boolData.showCombatAreaWarnings.currentValue = reader.getBoolean();
        }
        if (version >= 73)
            this.boolData.useCompactNotifications.currentValue = reader.getBoolean();
        if (version >= 75) {
            this.boolData.useLegacyNotifications.currentValue = reader.getBoolean();
        }
        if (version >= 77)
            this.boolData.useCat.currentValue = reader.getBoolean();
        if (version >= 78) {
            this.boolData.throttleFrameRateOnInactivity.currentValue = reader.getBoolean();
            this.choiceData.cartographyFrameRateCap.currentValue = reader.getUint16();
        }
        if (version >= 79)
            this.boolData.toggleBirthdayEvent.currentValue = reader.getBoolean();
        if (version >= 81)
            this.boolData.toggleDiscordRPC.currentValue = reader.getBoolean();
        if (version >= 82)
            this.boolData.genericArtefactAllButOne.currentValue = reader.getBoolean();
        if (version >= 84 /* SaveVersion.MasteryModalFilter */ )
            this.hiddenMasteryNamespaces = reader.getSet((reader) => {
                const namespace = reader.getString();
                if (this.game.registeredNamespaces.hasNamespace(namespace))
                    return namespace;
                return undefined;
            });
        if ((version >= 86 /* SaveVersion.DoubleClickItemSettings */ && version < 100 /* SaveVersion.IntoTheAbyss */ ) ||
            version >= 110 /* SaveVersion.AprilFoolsMerge */ ) {
            this.boolData.enableDoubleClickEquip.currentValue = reader.getBoolean();
            this.boolData.enableDoubleClickOpen.currentValue = reader.getBoolean();
            this.boolData.enableDoubleClickBury.currentValue = reader.getBoolean();
        }
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ ) {
            this.boolData.showAbyssalPiecesNotifications.currentValue = reader.getBoolean();
            this.boolData.showAbyssalSlayerCoinNotifications.currentValue = reader.getBoolean();
        }
        if (version >= 104 /* SaveVersion.ITASettings */ ) {
            this.boolData.enablePermaCorruption.currentValue = reader.getBoolean();
            this.boolData.showAPNextToShopSidebar.currentValue = reader.getBoolean();
            this.boolData.showASCNextToSlayerSidebar.currentValue = reader.getBoolean();
            this.choiceData.sidebarLevels.currentValue = reader.getUint8();
        }
        if (version >= 106 /* SaveVersion.ITANotificationSettings */ ) {
            this.boolData.showAbyssalXPNotifications.currentValue = reader.getBoolean();
        }
        if (version >= 122 /* SaveVersion.ITAShowSoulPointsSetting */ ) {
            this.boolData.showSPNextToPrayerSidebar.currentValue = reader.getBoolean();
        }
        if (version >= 123 /* SaveVersion.StickyBankTabsSetting */ ) {
            this.boolData.enableStickyBankTabs.currentValue = reader.getBoolean();
        }
        if (version >= 125 /* SaveVersion.ItANewRealmSelection */ ) {
            this.boolData.useLegacyRealmSelection.currentValue = reader.getBoolean();
        }
        if (version >= 126 /* SaveVersion.ITASkillNavOpacity */ ) {
            this.boolData.showOpacityForSkillNavs.currentValue = reader.getBoolean();
        }
        if (version >= 127 /* SaveVersion.ITABankFilterSettings */ ) {
            this.boolData.bankFilterShowAll.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowDemo.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowFull.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowTotH.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowAoD.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowItA.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowDamageReduction.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowAbyssalResistance.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowNormalDamage.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowAbyssalDamage.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowSkillXP.currentValue = reader.getBoolean();
            this.boolData.bankFilterShowAbyssalXP.currentValue = reader.getBoolean();
        }
        if (version >= 128 /* SaveVersion.ITARealmSelectAgility */ ) {
            this.boolData.alwaysShowRealmSelectAgility.currentValue = reader.getBoolean();
        }
        if (version >= 130 /* SaveVersion.SwipeSidebarSetting */ ) {
            this.boolData.enableSwipeSidebar.currentValue = reader.getBoolean();
        }
    }
    /** Transfer settings from old savegame */
    convertFromOldFormat(savegame, idMap) {
        if (savegame.ignoreBankFull !== undefined)
            this.boolData.continueIfBankFull.currentValue = savegame.ignoreBankFull;
        if (savegame.autoRestartDungeon !== undefined)
            this.boolData.autoRestartDungeon.currentValue = savegame.autoRestartDungeon;
        if (savegame.autoSaveCloud !== undefined)
            this.boolData.autoCloudSave.currentValue = savegame.autoSaveCloud;
        if (savegame.darkMode !== undefined)
            this.boolData.darkMode.currentValue = savegame.darkMode;
        if (savegame.showGPNotify !== undefined)
            this.boolData.showGPNotifications.currentValue = savegame.showGPNotify;
        if (savegame.enableAccessibility !== undefined)
            this.boolData.enableAccessibility.currentValue = savegame.enableAccessibility;
        if (savegame.showEnemySkillLevels !== undefined)
            this.boolData.showEnemySkillLevels.currentValue = savegame.showEnemySkillLevels;
        if (savegame.confirmationOnClose !== undefined)
            this.boolData.showCloseConfirmations.currentValue = savegame.confirmationOnClose;
        if (savegame.showCommas !== undefined)
            this.boolData.hideThousandsSeperator.currentValue = !savegame.showCommas;
        if (savegame.showVirtualLevels !== undefined)
            this.boolData.showVirtualLevels.currentValue = savegame.showVirtualLevels;
        if (savegame.showSaleNotifications !== undefined)
            this.boolData.showSaleConfirmations.currentValue = savegame.showSaleNotifications;
        if (savegame.showShopNotifications !== undefined)
            this.boolData.showShopConfirmations.currentValue = savegame.showShopNotifications;
        if (savegame.pauseOfflineActions !== undefined)
            this.boolData.pauseOnUnfocus.currentValue = savegame.pauseOfflineActions;
        if (savegame.showCombatMinibar !== undefined)
            this.boolData.showCombatMinibar.currentValue = savegame.showCombatMinibar;
        if (savegame.showCombatMinibarCombat !== undefined)
            this.boolData.showCombatMinibarCombat.currentValue = savegame.showCombatMinibarCombat;
        if (savegame.showSkillMinibar !== undefined)
            this.boolData.showSkillingMinibar.currentValue = savegame.showSkillMinibar;
        if (savegame.useCombinationRunes !== undefined)
            this.boolData.useCombinationRunes.currentValue = savegame.useCombinationRunes;
        if (savegame.autoSlayer !== undefined)
            this.boolData.enableAutoSlayer.currentValue = savegame.autoSlayer;
        if (savegame.levelUpScreen !== undefined)
            this.boolData.useSmallLevelUpNotifications.currentValue = savegame.levelUpScreen === 1;
        if (savegame.showItemNotify !== undefined)
            this.boolData.showItemNotifications.currentValue = savegame.showItemNotify === 1;
        if (savegame.defaultPageOnLoad !== undefined) {
            const defaultPage = this.game.pages.getObjectByID(idMap.pages[savegame.defaultPageOnLoad]);
            if (defaultPage !== undefined) {
                this.choiceData.defaultPageOnLoad.currentValue = defaultPage;
            }
        }
        if (savegame.formatNumberSetting !== undefined)
            this.choiceData.formatNumberSetting.currentValue = savegame.formatNumberSetting;
        if (savegame.SETTINGS !== undefined) {
            this.boolData.continueThievingOnStun.currentValue = savegame.SETTINGS.general.continueThievingOnStun;
            this.boolData.useDefaultBankBorders.currentValue =
                savegame.SETTINGS.bank.bankBorder === 0 /* BankBorderSetting.Default */ ;
            this.choiceData.bankSortOrder.currentValue = savegame.SETTINGS.bank.defaultBankSort;
            this.boolData.defaultToCurrentEquipSet.currentValue = savegame.SETTINGS.bank.currentEquipDefault;
            this.boolData.hideMaxLevelMasteries.currentValue = savegame.SETTINGS.mastery.hideMaxLevel;
            this.boolData.showMasteryCheckpointconfirmations.currentValue = savegame.SETTINGS.mastery.confirmationCheckpoint;
            // General Settings
            this.boolData.enableOfflinePushNotifications.currentValue = savegame.SETTINGS.general.pushNotificationOffline;
            this.boolData.enableFarmingPushNotifications.currentValue = savegame.SETTINGS.general.pushNotificationFarming;
            this.boolData.enableOfflineCombat.currentValue = savegame.SETTINGS.general.enabledOfflineCombat;
            this.choiceData.showNeutralAttackModifiers.currentValue = savegame.SETTINGS.general.enableNeutralSpecModifiers;
            this.boolData.enableMiniSidebar.currentValue = savegame.SETTINGS.general.miniSidebar;
            this.boolData.enableAutoEquipFood.currentValue = savegame.SETTINGS.general.autoEquipFood;
            this.boolData.enableAutoSwapFood.currentValue = savegame.SETTINGS.general.autoSwapFood;
            this.boolData.continueThievingOnStun.currentValue = savegame.SETTINGS.general.continueThievingOnStun;
            this.boolData.enablePerfectCooking.currentValue = savegame.SETTINGS.general.allowPerfectCook;
            this.boolData.showCropDestructionConfirmations.currentValue =
                savegame.SETTINGS.general.showDestroyCropConfirmation;
            this.boolData.showAstrologyMaxRollConfirmations.currentValue =
                savegame.SETTINGS.general.showAstrologyMaxRollConfirmation;
            this.boolData.showQuantityInItemNotifications.currentValue = savegame.SETTINGS.general.showQtyInItemNotification;
            this.boolData.showItemPreservationNotifications.currentValue =
                savegame.SETTINGS.general.showItemPreservationNotification;
            this.boolData.showSlayerCoinNotifications.currentValue = savegame.SETTINGS.general.showSlayerCoinNotification;
            this.boolData.showEquipmentSetsInCombatMinibar.currentValue =
                savegame.SETTINGS.general.combatMinibarShowEquipmentSets;
            this.boolData.showBarsInCombatMinibar.currentValue = savegame.SETTINGS.general.combatMinibarShowEnemyBars;
            this.boolData.showTierIPotions.currentValue = savegame.SETTINGS.general.showPotionTier[0];
            this.boolData.showTierIIPotions.currentValue = savegame.SETTINGS.general.showPotionTier[1];
            this.boolData.showTierIIIPotions.currentValue = savegame.SETTINGS.general.showPotionTier[2];
            this.boolData.showTierIVPotions.currentValue = savegame.SETTINGS.general.showPotionTier[3];
            // Notification Settings
            this.boolData.showCombatStunNotifications.currentValue = savegame.SETTINGS.notifications.combatStunned;
            this.boolData.showCombatSleepNotifications.currentValue = savegame.SETTINGS.notifications.combatSleep;
            this.boolData.showSummoningMarkDiscoveryModals.currentValue = savegame.SETTINGS.notifications.summoningMark;
            // Performance Settings
            this.boolData.enableCombatDamageSplashes.currentValue = !savegame.SETTINGS.performance.disableDamageSplashes;
            this.boolData.enableProgressBars.currentValue = !savegame.SETTINGS.performance.disableProgressBars;
            this.choiceData.colourBlindMode.currentValue = savegame.SETTINGS.accessibility.colourBlindMode;
        }
    }
    /** Initializes all <settings-checkbox> and <settings-toggle> components */
    initializeToggles() {
        const attributes = ':not([data-init])';
        const toggles = document.querySelectorAll(`settings-checkbox${attributes}, settings-switch${attributes}`);
        toggles.forEach((toggle) => {
            const settingID = toggle.getAttribute('data-setting-id');
            if (settingID === null) {
                console.warn('Tried to initialize toggle but no setting-id was set.');
                console.log(toggle);
                return;
            }
            if (this.isBooleanSetting(settingID)) {
                toggle.initialize(this.boolData[settingID], () => this.toggleSetting(settingID));
            } else {
                console.warn(`Tried to initialize toggle, but it has an invalid setting: ${settingID}`);
            }
        });
    }
    /** Initializes all <settings-dropdown> components */
    initializeChoices() {
        const attributes = ':not([data-init])';
        const dropdowns = document.querySelectorAll(`settings-dropdown${attributes}`);
        dropdowns.forEach((dropdown) => {
            const settingID = dropdown.getAttribute('data-setting-id');
            if (settingID === null) {
                console.warn('Tried to initialize settings-dropdown but no setting-id was set.');
                console.log(dropdown);
                return;
            }
            if (this.isChoiceSetting(settingID)) {
                const data = this.choiceData[settingID];
                // @ts-expect-error ChoiceSettingData is generic, so these inputs match the signature
                const option = this.getOptionFromValue(data.currentValue, data);
                // @ts-expect-error ChoiceSettingData is generic, so these inputs match the signature
                dropdown.initialize(data, (newValue) => this.changeChoiceSetting(settingID, newValue));
                dropdown.updateValue(option);
            } else {
                console.warn(`Tried to initialize toggle, but it has an invalid setting: ${settingID}`);
            }
        });
    }
    isBooleanSetting(settingID) {
        const data = this.boolData[settingID];
        return data !== undefined;
    }
    isChoiceSetting(settingID) {
        const data = this.choiceData[settingID];
        return data !== undefined;
    }
    toggleSetting(setting) {
        const data = this.boolData[setting];
        const oldValue = data.currentValue;
        const newValue = !data.currentValue;
        if (data.shouldChange !== undefined && !data.shouldChange(oldValue, newValue)) {
            this.setTogglesChecked(setting, data.currentValue);
            return;
        }
        data.currentValue = newValue;
        if (data.onChange !== undefined)
            data.onChange(oldValue, newValue);
        this.setTogglesChecked(setting, data.currentValue);
        if (data.saveOnChange)
            saveData();
    }
    setTogglesChecked(setting, isChecked) {
        const attributes = `[data-setting-id="${setting}"]`;
        const toggles = document.querySelectorAll(`settings-checkbox${attributes}, settings-switch${attributes}`);
        toggles.forEach((toggle) => {
            toggle.setChecked(isChecked);
        });
    }
    changeChoiceSetting(setting, newValue) {
        const data = this.choiceData[setting];
        const oldValue = data.currentValue;
        if (data.shouldChange !== undefined && !data.shouldChange(oldValue, newValue))
            return;
        data.currentValue = newValue;
        if (data.onChange !== undefined)
            data.onChange(oldValue, newValue);
        const attributes = `[data-setting-id="${setting}"]`;
        const dropdowns = document.querySelectorAll(`settings-dropdown${attributes}`);
        const option = this.getOptionFromValue(newValue, data);
        dropdowns.forEach((dropdown) => {
            dropdown.updateValue(option);
        });
        if (data.saveOnChange)
            saveData();
    }
    getOptionFromValue(value, data) {
        const option = data.options.find((option) => option.value === value);
        if (option === undefined)
            throw new Error('Tried to change choice setting, but option does not exist');
        return option;
    }
    /** Load the current settings */
    onLoad() {
        Object.values(this.boolData).forEach((boolSetting) => {
            if (boolSetting.currentValue !== boolSetting.defaultValue && boolSetting.onChange !== undefined)
                boolSetting.onChange(boolSetting.defaultValue, boolSetting.currentValue);
        });
        Object.values(this.choiceData).forEach((choiceSetting) => {
            if (choiceSetting.currentValue !== choiceSetting.defaultValue && choiceSetting.onChange !== undefined)
                // @ts-expect-error Compiler errors but vscode doesn't?
                choiceSetting.onChange(choiceSetting.defaultValue, choiceSetting.currentValue);
        });
    }
}
// eslint-disable-next-line no-var
var localStorageSettings = {};
/*function adjustZoom(zoomLevel) {
  if (zoomLevel < 5) zoomLevel = 100;
  let zoom = zoomLevel / 100;
  $("html").css("zoom", zoom);
  setItem("zoomLevel", zoomLevel);
}*/
/** Adjusts the zoom level. Only applies to the steam client */
function adjustZoom(zoomLevel) {
    try {
        const nwWin = parent.nw.Window.get();
        nwWin.zoomLevel = zoomLevel;
        localStorage.setItem('steamZoomLevel', `${zoomLevel}`);
        saveData();
    } catch (e) {
        console.error(e);
    }
}
/** Toggles the game to fullscreen mode. Only applies to the steam client */
function toggleFullScreen() {
    try {
        parent.win.toggleFullscreen();
    } catch (e) {
        console.error(e);
    }
}
/*function adjustZoom(zoomLevel) {
  if (zoomLevel > 3 || zoomLevel < -3) zoomLevel = 0;
  try {
    let nwWin = parent.nw.Window.get();
    nwWin.zoomLevel = zoomLevel;
  } catch (e) {
    console.warn("Failed to adjust zoom level: " + e);
  }
  setItem("zoomLevel", zoomLevel);
}*/
/** Stores class names utilized for colour blind modes for the game */
const colourBlindClasses = {
    [0 /* ColourBlindModeSetting.None */ ]: '',
    [1 /* ColourBlindModeSetting.RedGreen */ ]: 'colourAdjustment',
    // New colourblind css classes can be added here
};
/** Localizes elements in the settings menu */
function localizeSettings() {
    $('#setting-3-3').html(getLangString('SETTINGS_SETTING_3_3'));
}
const offlineCombatChecks = [false, false, false, false, false];

function showEnableOfflineCombatModal() {
    $('#modal-offline-combat-warning').modal('show');
}

function dismissOfflineCombatAlert() {
    $('#offline-combat-alert').addClass('d-none');
    localStorage.setItem('offlineCombatDismissed', '1');
}

function dismissOfflineThievingAlert() {
    $('#offline-thieving-alert').addClass('d-none');
    localStorage.setItem('offlineThievingDismissed', '1');
}

function toggleOfflineCombatCheckbox(id) {
    offlineCombatChecks[id] = $(`#cb-offline-combat-${id}`).prop('checked');
    updateEnableOfflineCombatBtn();
}

function updateEnableOfflineCombatBtn() {
    if (offlineCombatChecks.includes(false))
        $(`#cb-offline-combat-btn`).prop('disabled', true);
    else
        $(`#cb-offline-combat-btn`).prop('disabled', false);
}

function enableOfflineCombat() {
    if (offlineCombatChecks.includes(false))
        notifyPlayer(game.attack, getLangString('TOASTS_OFFLINE_COMBAT_ENABLE_FAILURE'), 'danger');
    else {
        game.settings.toggleSetting('enableOfflineCombat');
        dismissOfflineCombatAlert();
    }
}

function enableOfflineThieving() {
    game.settings.toggleSetting('continueThievingOnStun');
    $('#offline-thieving-alert').addClass('d-none');
}

function initLocalStorageSettings() {
    const hideEmptySaveSlots = localStorage.getItem('hideEmptySaveSlots');
    const enableSaveOverwriteWarning = localStorage.getItem('enableSaveOverwriteWarning');
    const enableMostRecentSaveBanner = localStorage.getItem('enableMostRecentSaveBanner');
    if (hideEmptySaveSlots !== null && hideEmptySaveSlots !== undefined)
        localStorageSettings.hideEmptySaveSlots = hideEmptySaveSlots;
    if (enableSaveOverwriteWarning !== null && enableSaveOverwriteWarning !== undefined)
        localStorageSettings.enableSaveOverwriteWarning = enableSaveOverwriteWarning;
    if (enableMostRecentSaveBanner !== null && enableMostRecentSaveBanner !== undefined)
        localStorageSettings.enableMostRecentSaveBanner = enableMostRecentSaveBanner;
    if (localStorageSettings.hideEmptySaveSlots === undefined) {
        localStorageSettings.hideEmptySaveSlots = 'false';
        localStorage.setItem('hideEmptySaveSlots', 'false');
    }
    if (localStorageSettings.enableSaveOverwriteWarning === undefined) {
        localStorageSettings.enableSaveOverwriteWarning = 'true';
        localStorage.setItem('enableSaveOverwriteWarning', 'true');
    }
    if (localStorageSettings.enableMostRecentSaveBanner === undefined) {
        localStorageSettings.enableMostRecentSaveBanner = 'true';
        localStorage.setItem('enableMostRecentSaveBanner', 'true');
    }
}
//# sourceMappingURL=settings.js.map
checkFileVersion('?12097')