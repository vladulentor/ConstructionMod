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
const DEBUGENABLED = false; // TODO_R: SET TO FALSE FOR PRODUCTION
const releaseDate = 1637258400000;
const DEBUG_REPORTER = [];
//Initialise vars
const gameTitle = 'Melvor Idle :: v1.3.1';
// eslint-disable-next-line prefer-const
let currentTitleNewsID = [];
// eslint-disable-next-line prefer-const
let playFabEventQueue = [];
let isLoaded = false;
let confirmedLoaded = false;
let steamAchievements = [];
let connectedToSteam = false;
let lolYouDiedGetRekt = false;
/** Multiplier for HP and damage values */
let numberMultiplier = 10;
let returnToGameAfterSubmission = false;
let modalQueuePaused = false;
const modalQueue = [];
const cloudSaveHeartbeatLevel = 0;
let loadingOfflineProgress = false;
let modalIsOpen = false;
let offlineProgressCache;
$('body').on('click', '#header-equipment-dropdown', function(e) {
    e.stopPropagation();
});
$('body').on('click', '#header-user-options-dropdown', function(e) {
    e.stopPropagation();
});
// Set tippy z-index to allow tooltips to work in Swal and modals
tippy.setDefaultProps({
    zIndex: 2000000,
});
/** Update everything on screen when loading the game */
function updateWindow() {
    var _a, _b, _c, _d, _e, _f, _g;
    return __awaiter(this, void 0, void 0, function*() {
        try {
            setGameBackgroundImage(game.settings.backgroundImage.toString());
            setSaveGUID();
            //if (location.origin === "https://steam.melvoridle.com") new SimpleBar($(".js-sidebar-scroll")[0]);
            new SimpleBar($('.js-sidebar-scroll')[0]);
            One.helpers('core-bootstrap-tabs');
            $('#modal-spend-mastery-xp').on('hide.bs.modal', () => {
                spendMasteryMenu.unsetSkill();
            });
            $('#modal-skill-tree').on('hide.bs.modal', () => {
                skillTreeMenu.onClose();
            });
            $('.modal').on('show.bs.modal', () => {
                disableModalSwipe = true;
            });
            $('.modal').on('hide.bs.modal', () => {
                disableModalSwipe = false;
            });
            //ENABLE SIDE OVERLAY EVENT
            jQuery('#page-overlay').on('click.pixelcave.overlay', (e) => {
                closeBankSidebar();
            });
            if (cloudManager.hasFullVersionEntitlement)
                sidebar.removeCategory('Demo Version');
            if (!cloudManager.hasTotHEntitlementAndIsEnabled)
                sidebar.removeCategory('Expansion 1');
            if (!cloudManager.hasAoDEntitlementAndIsEnabled)
                sidebar.removeCategory('Expansion 2');
            if (!cloudManager.hasItAEntitlementAndIsEnabled)
                sidebar.removeCategory('Expansion 3');
            if (game.stats.General.get(GeneralStats.AccountCreationDate) === 0)
                game.stats.General.set(GeneralStats.AccountCreationDate, Date.now());
            dataDeleted = false;
            numberMultiplier = game.currentGamemode.hitpointMultiplier;
            // Retroactive Bug Fix for Impending Darkness dungeon completion not being tracked
            const bane = game.monsters.getObjectByID("melvorF:BaneInstrumentOfFear" /* MonsterIDs.BaneInstrumentOfFear */ );
            const impendingDarkness = game.dungeons.getObjectByID("melvorF:Impending_Darkness" /* DungeonIDs.Impending_Darkness */ );
            if (bane !== undefined &&
                impendingDarkness !== undefined &&
                game.stats.Monsters.get(bane, MonsterStats.KilledByPlayer) > 0 &&
                game.combat.getDungeonCompleteCount(impendingDarkness) < 1) {
                game.combat.setDungeonCompleteCount(impendingDarkness, game.stats.Monsters.get(bane, MonsterStats.KilledByPlayer));
            }
            cleanSaveFile();
            initializeStatTables();
            shopMenu = new ShopMenu(game);
            game.mining.initializeRocks();
            loadMiningOres();
            (_a = game.harvesting) === null || _a === void 0 ? void 0 : _a.initializeVeins();
            $('#account-name').text(game.characterName);
            combatMenus.runes.init(game);
            game.onLoad();
            //combat
            combatAreaMenus.all.forEach((menu) => {
                menu.updateRewards();
                menu.updateMonsterValues();
            });
            combatMenus.runes.updateCounts(game.bank);
            changeCombatMenu(0);
            combatMenus.prayer.updateForLevel(game.combat.player, game.prayer.level, game.prayer.abyssalLevel);
            //completion
            buildSkillsLog(game);
            buildMasteryLog(game);
            buildMonsterLog(game);
            buildPetLog(game);
            game.combat.player.checkEquipmentRequirements();
            if (game.tutorial.shouldStart) {
                game.tutorial.continueOnLoad();
                const tutorialPage = game.pages.getObjectByID("melvorD:TutorialIsland" /* PageIDs.TutorialIsland */ );
                if (tutorialPage === undefined)
                    throw new Error(`Error tutorial page not registered.`);
                changePage(tutorialPage, -1, undefined, false, false);
            } else {
                (_b = sidebar.category('').item("melvorD:TutorialIsland" /* PageIDs.TutorialIsland */ ).rootEl) === null || _b === void 0 ? void 0 : _b.classList.add('d-none');
                if (isCreatingSave)
                    game.setupCurrentGamemode();
                game.tutorial.complete = true;
                setupSkillLock(game);
                if (game.isGolbinRaid)
                    changePage(game.getPageForActiveAction(), -1, undefined, false, false);
                else
                    changePage(game.settings.defaultPageOnLoad, -1, undefined, false, false);
            }
            eventManager.loadEvents();
            game.combat.retroactivelyAddOneTimeRewards();
            initSteam();
            loadLore();
            game.golbinRaid.onLoad();
            game.lore.onLoad();
            //pingAsActive(true);
            isLoaded = true;
            updateUIForLanguageChange();
            characterSelected = true;
            inCharacterSelection = false;
            $('#m-page-loader').attr('class', 'd-none');
            console.log('Game Loaded');
            Summoning.updateSearchArray();
            Agility.updateSearchArray();
            initTooltips();
            cloudManager.updateUIForPlayFabSignIn();
            cloudManager.updateUIForMelvorCloudSignIn();
            cloudManager.updateUIForEntitlements();
            initChangelog();
            updateAllGameMedia();
            updatePlayerLangTags();
            if (game.currentGamemode.enableInstantActions)
                game.combat.notifications.disableMaxQueue();
            if (cloudManager.hasItAEntitlementAndIsEnabled)
                (_c = sidebar.category('Into the Abyss').rootEl) === null || _c === void 0 ? void 0 : _c.classList.remove('d-none');
            game.currentGamemode.allowAncientRelicDrops ?
                (_d = sidebar.category('Ancient Relics').rootEl) === null || _d === void 0 ? void 0 : _d.classList.remove('d-none') :
                (_e = sidebar.category('Ancient Relics').rootEl) === null || _e === void 0 ? void 0 : _e.classList.add('d-none');
            game.skills.some((skill) => skill.hasSkillTree) ?
                (_f = sidebar.category('Into the Abyss').item('View Skill Trees').rootEl) === null || _f === void 0 ? void 0 : _f.classList.remove('d-none') :
                (_g = sidebar.category('Into the Abyss').item('View Skill Trees').rootEl) === null || _g === void 0 ? void 0 : _g.classList.add('d-none');
            sidebar
                .category('Realm Selection')
                .item('Select Realm')
                .subitem(game.currentRealm.id)
                .nameEl.classList.add('text-success');
            if (game.currentRealm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ )
                sidebar.category('Into the Abyss').item('Abyssal Realm').nameEl.textContent = getLangString('MENU_TEXT_LEAVE_ABYSSAL_REALM');
            else if (game.unlockedRealms.find((realm) => realm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ) !== undefined)
                sidebar.category('Into the Abyss').item('Abyssal Realm').nameEl.textContent = getLangString('MENU_TEXT_ENTER_ABYSSAL_REALM');
            if (!game.settings.useLegacyRealmSelection && game.unlockedRealms.length > 1) {
                game.combat.renderQueue.categoryVisibilityByRealm.add(game.currentRealm);
            }
            game.combat.renderQueue.realmVisibility.add(game.currentRealm);
            if (nativeManager.isNativeApp)
                nativeManager.updateLocalPriceElements();
            One.helpers('core-toggle-class');
            const zoomLevel = localStorage.getItem('steamZoomLevel');
            if ((nativeManager.isSteam || nativeManager.isEpicGames) &&
                localStorage.getItem('steamZoomLevel') !== undefined &&
                zoomLevel !== null) {
                if (!Number.isInteger(zoomLevel))
                    adjustZoom(Number.parseFloat(zoomLevel));
                else
                    removeItem('steamZoomLevel');
            }
            if (localStorage.getItem('creationDate') === undefined || localStorage.getItem('creationDate') === null)
                localStorage.setItem('creationDate', `${new Date().getTime()}`);
            if (game.settings.enableOfflineCombat ||
                (localStorage.getItem('offlineCombatDismissed') !== null &&
                    localStorage.getItem('offlineCombatDismissed') !== undefined))
                $('#offline-combat-alert').addClass('d-none');
            if (game.settings.continueThievingOnStun ||
                (localStorage.getItem('offlineThievingDismissed') !== null &&
                    localStorage.getItem('offlineThievingDismissed') !== undefined))
                $('#offline-thieving-alert').addClass('d-none');
            window.setTimeout(function() {
                gameUpdate();
            }, 5000);
            yield mod.trigger.characterLoaded();
        } catch (e) {
            handleGameLoadingError('An error occured while Updating Game Interface', e);
        }
    });
}
/**
 * Shows the broken game modal
 * @param title The title of the error to report
 * @param errorLog The error log that can be copied
 * @param brokenMods Optional. Array of mod information from stack trace analysis
 */
function showGameErrorModal(title, errorLog, brokenMods = []) {
    $('#game-error-title').text(title);
    $('#game-error-log').val(errorLog);
    if (brokenMods.length === 0) {
        $('#game-error-dev').text('Maybe you should let the dev know about this error. Please copy the entire contents of this error message when reporting:');
    } else {
        $('#game-error-text').html(`<strong>${getLangString('MOD_MANAGER_ERROR_DUE_TO_MODS')}</strong><br>${brokenMods
            .map(({ name, version }) => `
            $ {
                name
            }: v$ {
                version
            }
            `)
            .join('<br>')}`);
        $('#game-error-dev').text(getLangString('MOD_MANAGER_REPORT_TO_MOD_DEVS'));
    }
    $('#modal-game-error').modal('show');
}
/**
 * Handles errors when loading the game. Shows the error modal and removes the loader.
 * @param e Exception from the try catch block
 */
function handleGameLoadingError(title, e) {
    $('#m-page-loader').attr('class', 'd-none');
    showTitleScreenError(e, title);
    console.error(e);
}
/** Loads the lore book modal text */
function loadLore() {
    for (let i = 0; i < LORE.length; i++) {
        $('#lore-' + i + '-header').html(LORE[i].title);
        $('#lore-' + i + '-title').html(LORE[i].title);
        $('#lore-' + i + '-text').html(LORE[i].paragraphs);
    }
}
/** Removes old variables from localstorage, and fixes invalid bank tabs */
function cleanSaveFile() {
    //Remove all vars that are no longer needed from previous versions of the game
    const defunctVars = [
        'farmingAreas',
        'killCount',
        'mbucks',
        'caseInventory',
        'totalMbucksSpent',
        'arcXP',
        'arcLevel',
        'arcNextLevelProgress',
        'easterEggs',
        'easterMaxScores',
        'totalEasterEggs',
        'autoSlayerTask',
        'slayerTaskCompetion',
    ];
    defunctVars.forEach((varName) => {
        if (getItem(`${key}${varName}`) !== null)
            removeItem(`${key}${varName}`);
    });
}

function getCloudSaveHeartbeatInterval() {
    //all intervals are in (ms)
    const initialInterval = 43200000; //12 hours
    return initialInterval;
    /*if (cloudSaveHeartbeatLevel <= 0) return initialInterval;
    let interval = initialInterval * Math.pow(2, cloudSaveHeartbeatLevel);
    if (interval > 57600000) interval = 57600000; //16 hours
    return interval;*/
}
const isAdsPath = function() {
    return location.pathname.includes('index_ads.php') || location.pathname.includes('siwg_test.html');
};
/**
 * @deprecated Use nativeManager.isIOS
 */
function isIOS() {
    return nativeManager.isIOS;
}
/**
 * @deprecated Use nativeManager.isAndroid
 */
function isAndroid() {
    return nativeManager.isAndroid;
}
/**
 * @deprecated Use nativeManager.isMobile
 */
function isMobile() {
    return nativeManager.isMobile;
}
/**
 * @deprecated Use nativeManager.isSteam
 */
function isSteam() {
    return nativeManager.isSteam;
}
const isDemoSkill = (skill) => {
    const f = new Set([
        "melvorD:Attack" /* SkillIDs.Attack */ ,
        "melvorD:Strength" /* SkillIDs.Strength */ ,
        "melvorD:Defence" /* SkillIDs.Defence */ ,
        "melvorD:Hitpoints" /* SkillIDs.Hitpoints */ ,
        "melvorD:Woodcutting" /* SkillIDs.Woodcutting */ ,
        "melvorD:Fishing" /* SkillIDs.Fishing */ ,
        "melvorD:Firemaking" /* SkillIDs.Firemaking */ ,
        "melvorD:Cooking" /* SkillIDs.Cooking */ ,
        "melvorD:Mining" /* SkillIDs.Mining */ ,
        "melvorD:Smithing" /* SkillIDs.Smithing */ ,
        "melvorD:Farming" /* SkillIDs.Farming */ ,
    ]);
    return f.has(skill.id);
};
const getLockedTitle = function(skill, dungeon) {
    let title = '';
    if (!cloudManager.hasFullVersionEntitlement) {
        if ((skill === undefined && dungeon === undefined) || cloudManager.isOnAuthPage)
            title += getLangString('IAP_BTN_MOBILE_Q');
        else if (skill !== undefined)
            title += getLangString('MENU_TEXT_SKILL_LOCKED');
        else if (dungeon !== undefined)
            title += getLangString('MENU_TEXT_DUNGEON_LOCKED');
    } else {
        title += getLangString('MENU_TEXT_SKILL_LOCKED');
    }
    return title;
};
const getLockedMessage = function(skill, dungeon) {
    let msg = '';
    if (!cloudManager.hasFullVersionEntitlement) {
        if (skill === undefined && dungeon === undefined && setLang != 'en')
            msg += `<h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('IAP_DESC_WEB')}</h5>`;
        else if (skill !== undefined)
            msg += `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${skill.media}"> ${templateString(getLangString('IAP_DESC_SKILL'), { skillName: skill.name })}</h5>`;
        else if (dungeon !== undefined)
            msg += `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${dungeon.media}"> ${templateString(getLangString('IAP_DESC_DUNGEON'), { dungeonName: dungeon.name })}</h5>`;
        if (setLang == 'en')
            msg += `<h5 class="font-w400 text-combat-smoke font-size-sm">Purchasing the <strong class="text-success">Full Version</strong> unlocks a variety of extra content!</h5><h5 class="font-w400 text-combat-smoke font-size-sm"><strong class="text-success">13</strong> more unique Skills<br><strong class="text-success">7</strong> extra challenging Dungeons<br><strong class="text-success">2</strong> new Gamemodes<br><strong class="text-success">One-time Purchase</strong> only</h5>`;
        msg += `<h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('IAP_CALL_TO_ACTION')}</h5>`;
    } else if (skill !== undefined) {
        msg += `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${skill.media}"> ${templateString(getLangString('IAP_DESC_SKILL'), { skillName: skill.name })}</h5>`;
    }
    return msg;
};
let IAPPrice = '';
const getLocaleIAPPrice = function() {
    if (location.origin === 'https://ios.melvoridle.com') {
        window.bridge.post('iap_price', {}, (results, error) => {
            IAPPrice = results.price;
        });
    }
};
const IAPPurchaseInProcess = false;
let IAPTimer;
const performUnlockIAP = function(productID) {
    if (nativeManager.isIOS || nativeManager.isAndroid) {
        disableBuyNowFullGameBtn();
        try {
            if (nativeManager.isIOS || nativeManager.isAndroid)
                nativeManager.purchaseIAP(productID);
            startIAPPurchaseInterval();
        } catch (e) {
            console.error(e);
        }
    } else {
        const newWindow = window.open('https://store.steampowered.com/app/1267910/Melvor_Idle/', '_blank');
        if (newWindow === null)
            throw new Error('Could not open IAP window');
        newWindow.focus();
    }
};
const performUnlockExpansionIAP = function(productID, expansionID) {
    if (nativeManager.isIOS || nativeManager.isAndroid) {
        if (!nativeManager.isNativeApp)
            return;
        try {
            if (nativeManager.isIOS || nativeManager.isAndroid)
                nativeManager.purchaseIAP(productID);
            startIAPPurchaseInterval();
        } catch (e) {
            console.error(e);
        }
    } else {
        switch (expansionID) {
            case 0:
                !nativeManager.isEpicGames ? openExpansionSteamLink() : openExpansionEpicLink();
                break;
            case 1:
                !nativeManager.isEpicGames ? openExpansion2SteamLink() : openExpansion2EpicLink();
                break;
            case 2:
                !nativeManager.isEpicGames ? openExpansion3SteamLink() : openExpansion3EpicLink();
                break;
        }
    }
};
const performUnlockExpandedEditionIAP = function(productID) {
    if (nativeManager.isIOS || nativeManager.isAndroid) {
        if (!nativeManager.isNativeApp)
            return;
        try {
            disableBuyNowExpandedEditionBtn();
            if (nativeManager.isIOS || nativeManager.isAndroid)
                nativeManager.purchaseIAP(productID);
            startIAPPurchaseInterval();
        } catch (e) {
            console.error(e);
        }
    } else {
        openExpandedEditionSteamLink();
    }
};
const enableBuyNowExpandedEditionBtn = function() {
    const btn = document.getElementById('btn-buy-now-expanded-edition');
    if (btn !== null) {
        btn.innerHTML = getLangString('BUY_NOW');
        btn.disabled = false;
    }
};
const disableBuyNowExpandedEditionBtn = function() {
    const btn = document.getElementById('btn-buy-now-expanded-edition');
    if (btn !== null) {
        btn.innerHTML = `<div class="spinner-border spinner-border-sm text-white mr-2" role="status"></div>${getLangString('CHARACTER_SELECT_77')}`;
        btn.disabled = true;
    }
};
const enableBuyNowFullGameBtn = function() {
    const btn = document.getElementById('btn-buy-now-base-game');
    const btn1 = document.getElementById('btn-buy-now-base-game-1');
    if (btn !== null) {
        btn.innerHTML = getLangString('BUY_NOW');
        btn.disabled = false;
    }
    if (btn1 !== null) {
        btn1.innerHTML = getLangString('BUY_NOW');
        btn1.disabled = false;
    }
};
const disableBuyNowFullGameBtn = function() {
    const btn = document.getElementById('btn-buy-now-base-game');
    const btn1 = document.getElementById('btn-buy-now-base-game-1');
    if (btn !== null) {
        btn.innerHTML = `<div class="spinner-border spinner-border-sm text-white mr-2" role="status"></div>${getLangString('CHARACTER_SELECT_77')}`;
        btn.disabled = true;
    }
    if (btn1 !== null) {
        btn1.innerHTML = `<div class="spinner-border spinner-border-sm text-white mr-2" role="status"></div>${getLangString('CHARACTER_SELECT_77')}`;
        btn1.disabled = true;
    }
};
const startIAPPurchaseInterval = function() {
    if (!nativeManager.isNativeApp)
        return;
    clearInterval(IAPTimer);
    IAPTimer = window.setInterval(function() {
        if (nativeManager.isIOS && !nativeManager.isNativeApp) {
            window.bridge.post('app_purchased', {}, (results, error) => {
                if (results.purchased)
                    window.location.href = 'index.php';
            });
        } else if (!nativeManager.isNativeApp && nativeManager.isAndroid) {
            getAndroidIAPStatus().then((isPurchased) => {
                if (isPurchased)
                    window.location.href = 'index.php';
            });
            if (android.isProductPurchased())
                window.location.href = 'index.php';
        }
    }, 2000);
};
const getAndroidIAPStatus = function() {
    const isPurchased = new Promise((resolve, reject) => {
        resolve(android.isProductPurchased());
    });
    return isPurchased;
};
const updateMobilePurchaseStatus = function() {
    if (nativeManager.isNativeApp)
        return;
    if (location.origin === 'https://ios.melvoridle.com') {
        window.bridge.post('app_purchased', {}, (results, error) => {
            if (results.purchased) {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'checkValidMobilePurchase',
                    FunctionParameter: {
                        isValid: results.purchased
                    }
                }, () => {});
            }
        });
    } else if (location.origin === 'https://android.melvoridle.com') {
        getAndroidIAPStatus().then((isPurchased) => {
            if (isPurchased) {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'checkValidMobilePurchase',
                    FunctionParameter: {
                        isValid: isPurchased
                    }
                }, () => {});
            } else if (location.pathname == '/adfree/index.php') {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'checkValidMobilePurchase',
                    FunctionParameter: {
                        isValid: 'true'
                    }
                }, () => {});
            }
        });
    }
};
const getLockedBtn = function(productID) {
    let msg = '';
    if ((nativeManager.isIOS || nativeManager.isAndroid) && nativeManager.isNativeApp) {
        msg = templateString(getLangString('IAP_PRICE'), {
            price: `${nativeManager.getIAPPrice(productID, true)}`,
        });
    } else {
        msg = getLangString('IAP_BTN_WEB');
    }
    return msg;
};
/** Temporarily stops modals from being automatically opened when added to the queue */
function pauseModalQueue() {
    modalQueuePaused = true;
}
/** Resumes modals being automatically opened when added to the queue, and opens the next one */
function resumeModalQueue() {
    modalQueuePaused = false;
    openNextModal();
}

function openNextModal() {
    if (modalQueue.length && !(modalIsOpen || Swal.isVisible())) {
        SwalLocale.fire(modalQueue[0]).then(() => {
            modalIsOpen = false;
            openNextModal();
        });
        modalQueue.splice(0, 1);
        modalIsOpen = true;
    } else if (!modalQueue.length)
        modalIsOpen = false;
}

function addModalToQueue(modal) {
    modalQueue.push(modal);
    if (!modalQueuePaused)
        openNextModal();
}

function showBaneCompletionModal() {
    const time = game.stats.General.get(GeneralStats.AccountCreationDate);
    if (time === 0)
        return;
    SwalLocale.fire({
        title: 'Congratulations!',
        html: `You defeated Bane in ${formatAsTimePeriod(new Date().getTime() - time)}`,
        imageUrl: assets.getURI('assets/media/main/has.png'),
        imageWidth: 128,
        imageHeight: 128,
        imageAlt: 'Yay',
    });
}

function onSaveDataLoad() {
    return __awaiter(this, void 0, void 0, function*() {
        yield updateWindow();
        if (!isLoaded)
            throw new Error('updateWindow failed.');
        $('#m-page-loader-test').attr('class', 'd-none');
        game.blockInteraction();
        if (isCreatingSave)
            game.resetTickTimestamp();
        else
            game.triggerOfflineLoop();
        game.startMainLoop();
        confirmedLoaded = true;
        if (!isCreatingSave)
            yield delayUntilGameEvent(game, 'offlineLoopExited');
        yield mod.trigger.interfaceReady();
    });
}

function resetAccountData() {
    if (game.currentGamemode.isPermaDeath) {
        lolYouDiedGetRekt = true;
        if (game.settings.showCloseConfirmations)
            game.settings.toggleSetting('showCloseConfirmations');
        deleteLocalSaveInSlot();
        dataDeleted = true;
        if (PlayFabClientSDK.IsClientLoggedIn())
            cloudManager.deletePlayFabSave(currentCharacter);
        location.href = 'index.php';
    }
}

function setDiscordRPCDetails() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    return __awaiter(this, void 0, void 0, function*() {
        if (cloudManager.isTest)
            return;
        if (!game.settings.toggleDiscordRPC && (nativeManager.isSteam || nativeManager.isEpicGames)) {
            try {
                parent.rpc.clearActivity();
            } catch (e) {
                console.error(e);
            }
        }
        const gm = game.currentGamemode.name;
        const sLevel = game.completion.skillLevelProgress.currentCount.getSum();
        const details = `${gm} (${sLevel} Total Level) (${Math.floor(game.completion.totalProgressTrue)}%)`;
        let state = 'idk what is happening';
        switch (game.activeAction) {
            case undefined:
                state = 'Currently bank standing...';
                break;
            case game.combat:
                state = `Fighting ${(_a = game.combat.enemy.monster) === null || _a === void 0 ? void 0 : _a.name} in ${(_b = game.combat.selectedArea) === null || _b === void 0 ? void 0 : _b.name}`;
                break;
            case game.woodcutting:
                state = `Woodcutting (${game.woodcutting.virtualLevel}/${game.woodcutting.maxLevelCap})`;
                break;
            case game.fishing:
                state = `Fishing ${game.fishing.activeFish.name} (${game.fishing.virtualLevel}/${game.fishing.maxLevelCap})`;
                break;
            case game.firemaking:
                state = `Firemaking lol (${game.firemaking.virtualLevel}/${game.firemaking.maxLevelCap})`;
                break;
            case game.cooking:
                state = `Cooking ${game.cooking.activeRecipe.name} (${game.cooking.virtualLevel}/${game.cooking.level})`;
                break;
            case game.mining:
                state = `Mining ${game.mining.activeRock.name} (${game.mining.virtualLevel}/${game.mining.maxLevelCap})`;
                break;
            case game.smithing:
                state = `Smithing ${game.smithing.activeRecipe.name} (${game.smithing.virtualLevel}/${game.smithing.maxLevelCap})`;
                break;
            case game.thieving:
                state = `Thieving ${(_c = game.thieving.currentNPC) === null || _c === void 0 ? void 0 : _c.name} (${game.thieving.virtualLevel}/${game.thieving.maxLevelCap})`;
                break;
            case game.fletching:
                state = `Fletching ${game.fletching.activeRecipe.name} (${game.fletching.virtualLevel}/${game.fletching.maxLevelCap})`;
                break;
            case game.crafting:
                state = `Crafting ${game.crafting.activeRecipe.name} (${game.crafting.virtualLevel}/${game.crafting.maxLevelCap})`;
                break;
            case game.runecrafting:
                state = `Runecrafting ${game.runecrafting.activeRecipe.name} (${game.runecrafting.virtualLevel}/${game.runecrafting.maxLevelCap})`;
                break;
            case game.herblore:
                state = `Herblore ${game.herblore.activeRecipe.name} (${game.herblore.virtualLevel}/${game.herblore.maxLevelCap})`;
                break;
            case game.agility:
                state = `Training Agility (${game.agility.virtualLevel}/${game.agility.maxLevelCap})`;
                break;
            case game.summoning:
                state = `Creating ${game.summoning.activeRecipe.name} Tablets (${game.summoning.virtualLevel}/${game.summoning.maxLevelCap})`;
                break;
            case game.astrology:
                state = `Studying ${game.astrology.activeConstellation.name} (${game.astrology.virtualLevel}/${game.astrology.maxLevelCap})`;
                break;
            case game.altMagic:
                state = `Training Alt. Magic (${game.altMagic.activeSpell.name}) (${game.altMagic.virtualLevel}/${game.altMagic.maxLevelCap})`;
                break;
            case game.golbinRaid:
                state = `Raiding Golbins (Wave ${game.golbinRaid.wave + 1}) (${game.golbinRaid.difficulty.name})`;
                break;
            case game.archaeology:
                state = `Excavating ${(_e = (_d = game.archaeology) === null || _d === void 0 ? void 0 : _d.currentDigSite) === null || _e === void 0 ? void 0 : _e.name} (${(_f = game.archaeology) === null || _f === void 0 ? void 0 : _f.virtualLevel}/${(_g = game.archaeology) === null || _g === void 0 ? void 0 : _g.maxLevelCap})`;
                break;
            case game.cartography:
                {
                    if (((_h = game.cartography) === null || _h === void 0 ? void 0 : _h.currentlySurveyedHex) !== undefined)
                        state = `Surveying ${(_j = game.cartography) === null || _j === void 0 ? void 0 : _j.currentlySurveyedHex.map.name} (${(_k = game.cartography) === null || _k === void 0 ? void 0 : _k.virtualLevel}/${(_l = game.cartography) === null || _l === void 0 ? void 0 : _l.maxLevelCap})`;
                    else if (((_m = game.cartography) === null || _m === void 0 ? void 0 : _m.currentUpgradeMap) !== undefined)
                        state = `Upgrading ${(_o = game.cartography) === null || _o === void 0 ? void 0 : _o.currentUpgradeMap.digSite.name} Maps (${(_p = game.cartography) === null || _p === void 0 ? void 0 : _p.virtualLevel}/${(_q = game.cartography) === null || _q === void 0 ? void 0 : _q.maxLevelCap})`;
                    else
                        state = `Doing something in Cartography (${(_r = game.cartography) === null || _r === void 0 ? void 0 : _r.virtualLevel}/${(_s = game.cartography) === null || _s === void 0 ? void 0 : _s.maxLevelCap})`;
                }
                break;
            default:
                state = `Currently playing with mods`;
                break;
        }
        parent.setActivityDetails(`${details}`, `${state}`);
    });
}

function initSteam() {
    if (location.origin === 'https://steam.melvoridle.com') {
        if (nativeManager.isUsingGreenworks && parent.greenworks.initAPI() && parent.greenworks.init())
            connectedToSteam = true;
        else if (nativeManager.isUsingSteamworks)
            connectedToSteam = true;
        else
            console.log('There was an error connecting to Steam. Steam Achievement functionality will not work.');
        if (connectedToSteam)
            game.checkSteamAchievements();
    }
}

function unlockSteamAchievement(achievementName, i) {
    try {
        nativeManager.isUsingGreenworks ?
            parent.greenworks.activateAchievement(achievementName, function() {}) :
            parent.steamworksClient.achievement.activate(achievementName);
        steamAchievements[i] = 1;
        //console.log(achievementName + " Unlocked");
    } catch (e) {
        console.error(e);
    }
}

function showPageLoader() {
    $('#m-page-loader').attr('class', 'show');
}

function initTooltips() {
    tippy('.mastery-icon', {
        content: getLangString('MENU_TEXT_MASTERY'),
        placement: 'bottom',
        interactive: false,
        animation: false,
    });
    tippy('.prayer-points-icon', {
        content: `<small>${getLangString('COMBAT_MISC_16')}<br>${getLangString('COMBAT_MISC_GAINED_FROM_BURYING')}</small>`,
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#combat-menu-item-0', {
        content: "<div class='text-center'>" + getLangString('COMBAT_MISC_MENU_0') + '</div>',
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#combat-menu-item-1', {
        content: "<div class='text-center'>" + getLangString('COMBAT_MISC_MENU_1') + '</div>',
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#combat-menu-item-2', {
        content: "<div class='text-center'>" + getLangString('COMBAT_MISC_MENU_3') + '</div>',
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#combat-menu-item-3', {
        content: "<div class='text-center'>" + getLangString('COMBAT_MISC_MENU_2') + '</div>',
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#combat-menu-item-4', {
        content: `<div class='text-center'>${getLangString('COMBAT_MISC_MENU_6')}</div>`,
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#combat-menu-item-5', {
        content: "<div class='text-center'>" + getLangString('COMBAT_MISC_MENU_5') + '</div>',
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#combat-menu-item-6', {
        content: "<div class='text-center'>" + getLangString('COMBAT_MISC_MENU_4') + '</div>',
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#combat-menu-item-7', {
        content: `<div class='text-center'>${getLangString('VIEW_CORRUPTIONS')}</div>`,
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('#last-cloud-save-question', {
        content: `<h5 class="font-w400 font-size-sm mb-1">${getLangString('MENU_TEXT_CLOUD_INFO_TT_0')}<br><span class="text-warning">${getLangString('MENU_TEXT_CLOUD_INFO_TT_1')}</span></h5>`,
        placement: 'bottom',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('.summoning-combat-bar', {
        content: ``,
        placement: 'top',
        allowHTML: true,
        interactive: false,
        animation: false,
        onShow: (instance) => {
            instance.setContent(`<h5 class="font-w400 font-size-sm mb-1 text-center">${templateLangString('COMBAT_MISC_SUMMON_BAR_TT', {
                value: (game.combat.player.summonAttackInterval / 1000).toPrecision(3),
            })}</h5>`);
        },
    });
    tippy('.barrier-info', {
        content: `${templateLangString('MENU_TEXT_BARRIER_NOTIFICATION_TOOLTIP_0', {
            barrierIcon: `<img class="skill-icon-xxs" src="${assets.getURI("assets/media/skills/combat/barrier.png" /* Assets.Barrier */)}">`,
        })}<div role="separator" class="dropdown-divider"></div>${templateLangString('MENU_TEXT_BARRIER_NOTIFICATION_TOOLTIP_1', {
            barrierIcon: `<img class="skill-icon-xxs" src="${assets.getURI("assets/media/skills/combat/barrier.png" /* Assets.Barrier */)}">`,
        })}<div role="separator" class="dropdown-divider"></div>${templateLangString('MENU_TEXT_BARRIER_NOTIFICATION_TOOLTIP_3', {
            barrierIcon: `<img class="skill-icon-xxs" src="${assets.getURI("assets/media/skills/combat/barrier.png" /* Assets.Barrier */)}">`,
            summoningIcon: `<img class="skill-icon-xxs" src="${assets.getURI("assets/media/skills/summoning/summoning.png" /* Assets.Summoning */)}">`,
        })}<div role="separator" class="dropdown-divider"></div>${templateLangString('MENU_TEXT_BARRIER_NOTIFICATION_TOOLTIP_4', {
            barrierIcon: `<img class="skill-icon-xxs" src="${assets.getURI("assets/media/skills/combat/barrier.png" /* Assets.Barrier */)}">`,
        })}`,
        placement: 'top',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
    tippy('.wiki-link', {
        content: `<div class="font-size-sm">${getLangString('VIEW_ON_OFFICIAL_WIKI')}</div>`,
        placement: 'top',
        allowHTML: true,
        interactive: false,
        animation: false,
    });
}

function generateLoreModals() {
    let html = '';
    for (let i = 9; i < LORE.length; i++) {
        html += `
	<div class="modal" id="modal-book-${i}" tabindex="-1" role="dialog" aria-labelledby="modal-block-extra-large" aria-modal="true" style="display: none;">
	  <div class="modal-dialog modal-lg" role="document">
	    <div class="modal-content" style="height:100%;">
	      <div class="block block-themed block-transparent mb-0">
	        <div class="block-header bg-primary-dark">
	          <h3 class="block-title" id="lore-${i}-header"></h3>
	          <div class="block-options">
	            <button type="button" class="btn-block-option" data-dismiss="modal" aria-label="Close">
	              <i class="fa fa-fw fa-times"></i>
	            </button>
	          </div>
	        </div>
	        <div class="block-content block-content-full text-center">
	          <h5 class="font-w600 text-combat-smoke" id="lore-${i}-title"></h5>
	          <h5 class="font-w300 font-size-sm text-combat-smoke" id="lore-${i}-text"></h5>
	        </div>
	      </div>
	    </div>
	  </div>
	</div>`;
    }
    return html;
}

function resetSkillsTo99(confirmed = false) {
    if (!confirmed) {
        SwalLocale.fire({
            title: getLangString('SETTINGS_RESET_99_SWAL_TITLE'),
            html: `${getLangString('SETTINGS_RESET_99_SWAL_BODY_0')}<br><br><strong>${getLangString('SETTINGS_RESET_99_MSG_0')}</strong><br><br><strong class="text-warning">${getLangString('SETTINGS_RESET_99_MSG_2')}</strong><br><br>${getLangString('SETTINGS_RESET_99_SWAL_BODY_1')}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
        }).then((result) => {
            if (result.value) {
                resetSkillsTo99(true);
            }
        });
        return;
    }
    game.skills.forEach((skill) => {
        if (skill.xp >= exp.levelToXP(100))
            skill.setXP(exp.levelToXP(100) - 1);
    });
    saveData();
    location.href = 'index.php';
}

function resetAbyssalSkills() {
    game.skills.forEach((skill) => {
        skill.setAbyssalXP(abyssalExp.levelToXP(1));
    });
    saveData();
    location.reload();
}

function setBackground(id) {
    const bg = document.querySelectorAll('bg-selection');
    bg.forEach((el) => {
        el.style.backgroundImage = `url('assets/media/main/bg_${id}.jpg')`;
    });
}

function initChangelog() {}
/** CORE GAME FUNCTIONS */
function updateAllGameMedia() {
    switch (setLang) {
        case 'lemon':
            updateGameMedia('assets/april/images/lemon.jpg');
            Array.from(document.getElementsByTagName('img')).forEach((img) => {
                img.src = assets.getURI('assets/april/images/lemon.jpg');
            });
            break;
        case 'carrot':
            updateGameMedia('assets/media/bank/carrot.png');
            Array.from(document.getElementsByTagName('img')).forEach((img) => {
                img.src = assets.getURI('assets/media/bank/carrot.png');
            });
            break;
    }
}

function updateGameMedia(media) {
    game.items.allObjects.forEach((entry) => entry.overrideMedia(media));
    game.monsters.allObjects.forEach((entry) => entry.overrideMedia(media));
    game.combatAreas.allObjects.forEach((entry) => entry.overrideMedia(media));
    game.slayerAreas.allObjects.forEach((entry) => entry.overrideMedia(media));
    game.dungeons.allObjects.forEach((entry) => entry.overrideMedia(media));
}

function viewExpansion2Details() {
    openLink('https://store.steampowered.com/app/2492940/Melvor_Idle_Atlas_of_Discovery/');
}

function resetClient() {
    if (nativeManager.isSteam || nativeManager.isEpicGames) {
        try {
            parent.localStorage.removeItem('EOSAccessToken');
            localStorage.removeItem('EOSAccessToken');
            parent.localStorage.removeItem('epicAccountLinked');
            localStorage.removeItem('epicAccountLinked');
            localStorage.removeItem('playFabID');
            localStorage.removeItem('melvorCloudAuthToken');
            //@ts-expect-error - NW.js specific API
            window.chrome.cookies.getAll({}, function(cookies) {
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    // @ts-expect-error - NW.js specific API
                    window.chrome.cookies.remove({
                        url: 'http://' + cookie.domain + cookie.path,
                        name: cookie.name,
                    });
                    // @ts-expect-error - NW.js specific API
                    window.chrome.cookies.remove({
                        url: 'https://' + cookie.domain + cookie.path,
                        name: cookie.name,
                    });
                }
            });
            parent.nw.App.clearCache();
            parent.nw.App.closeAllWindows();
        } catch (e) {
            console.error(e);
        }
    }
}
let shamedThisSession = false;

function showActionsRunOutSwal() {
    if (!rollPercentage(0.1) || shamedThisSession)
        return;
    SwalLocale.fire({
        title: 'Out of Actions!',
        html: `You have run out of free actions for the month. You can no longer play until you buy more actions via our "Convenience Pack".
    <br><br><strong>Cost:</strong>
    <br><img class=skill-icon-xs mr-1" src="${assets.getURI('assets/media/main/mbuck.png')}">69 MBucks for 1 action<br><img class=skill-icon-xs mr-1" src="${assets.getURI('assets/media/main/mbuck.png')}">690 MBucks for 8 actions<br><img class=skill-icon-xs mr-1" src="${assets.getURI('assets/media/main/mbuck.png')}">69,000 MBucks for lifetime* actions<br><br><small><em>*Lifetime actions are only valid for the current hour</em></small>`,
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: `I can't afford this!`,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
    }).then((result) => {
        if (result.isConfirmed) {
            giveShameToken();
            showShameSwal();
            shamedThisSession = true;
        }
    });
}

function giveShameToken() {
    const shameToken = game.items.getObjectByID('melvorAprilFools2024:Shame_Buck');
    if (shameToken !== undefined)
        game.bank.addItem(shameToken, 1, false, true, true, true);
}

function showShameSwal() {
    SwalLocale.fire({
        title: `Aw that's a shame!`,
        html: `Hopefully the next time we notify you, you'll have enough MBucks to buy more actions!
    <br><br><strong>You've been given:</strong>
    <br><img class=skill-icon-xs mr-1" src="${assets.getURI('assets/media/bank/shame_buck.png')}">1 Shame Buck`,
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: `:(`,
    });
}

function showToggleExpansionsModal() {
    $('#modal-toggle-expansions').modal('show');
}
//# sourceMappingURL=main.js.map
checkFileVersion('?12097')