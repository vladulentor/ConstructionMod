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
let currentCharacter = 0;
// eslint-disable-next-line prefer-const
let characterSelected = false;
/** @deprecated Unused global that is no longer needed */
// eslint-disable-next-line prefer-const
let backupSave = '';
let dataDeleted = false;
const keyVersion = 'A04';
let key = 'MI-' + keyVersion + '-' + currentCharacter + '-';
let currentStartPage = 8 /* CharacterSelectPage.UpdateNotification */ ;
// eslint-disable-next-line prefer-const
let panVal = 0;
let GUID;
const setSaveGUID = () => {
    if (GUID === undefined) {
        GUID = Math.random().toString(36).substring(2, 6);
    }
};
let sidebarSwipeTimer = -1;
/** Flags whether swipe events should be blocked */
let disableSwipeEvents = false;
/** Flags whether swipe events should be blocked due to a modal being open */
let disableModalSwipe = false;
let disableSidebarSwipe = false;

function disableSidebarSwipeTimer() {
    disableSidebarSwipe = true;
    clearTimeout(sidebarSwipeTimer);
    sidebarSwipeTimer = window.setTimeout(function() {
        disableSidebarSwipe = false;
    }, 1000);
}

function updateKeys() {
    key = getKeyForSaveSlot(currentCharacter);
}
/** Gets the localstorage key prefix for the given save slot */
function getKeyForSaveSlot(slotID) {
    let saveKey;
    if (slotID === 0) {
        saveKey = `MI-${keyVersion}`;
    } else {
        saveKey = `MI-${keyVersion}-${slotID}-`;
    }
    if (cloudManager.isBeta)
        saveKey = `MI-beta-${saveKey}`;
    else if (cloudManager.isTest)
        saveKey = `MI-test-${saveKey}`;
    return saveKey;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getItem(key) {
    const keydata = localStorage.getItem(key);
    if (keydata === null)
        return null;
    if (keydata === 'undefined')
        return undefined;
    return JSON.parse(keydata);
}

function removeItem(key) {
    localStorage.removeItem(key);
}

function saveData() {
    if (!dataDeleted &&
        !inCharacterSelection &&
        !(game.currentGamemode.isPermaDeath && lolYouDiedGetRekt) &&
        !blockCorruptSaving &&
        !loadingOfflineProgress) {
        updateKeys();
        if (DEBUGENABLED) {
            game.combat.saveStats();
        }
        const saveString = game.generateSaveString();
        localStorage.setItem(`${key}saveGame`, saveString);
        nativeManager.saveToNativeCloudBackup(`${key}saveGame`, saveString);
        cloudManager.saveToSteamCloud(`${key}saveGame`, saveString);
    }
}
/** Gets a savegame in the old localstorage format */
function getSaveGameOld(keyPrefix) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saveGame = {};
    allVars.forEach((varName) => {
        const data = getItem(keyPrefix + varName);
        if (data !== null && data !== undefined) {
            saveGame[varName] = data;
        } else {
            saveGame[varName] = defaultSaveValues[varName];
        }
    });
    saveGame.version = -1;
    return saveGame;
}
/** Removes a savegame in the old localstorage format */
function removeSaveOld(keyPrefix) {
    allVars.forEach((varName) => {
        removeItem(keyPrefix + varName);
    });
    console.log('Removed old local storage keys.');
}
/** Updates a Partial Settings object to have the full settings */
function updatePartialSettings(partialSettings) {
    const defaultSettings = defaultSaveValues.SETTINGS;
    Object.keys(defaultSettings).forEach((category) => {
        if (partialSettings[category] !== undefined) {
            Object.assign(defaultSettings[category], partialSettings[category]);
        }
    });
    return defaultSettings;
}
/**
 * Checks if the local save with the key exists
 * @param {string} keyPrefix
 * @returns {0|1|2} 0: No save, 1: Old format save, 2: new format save
 */
function doesLocalSaveExist(keyPrefix) {
    return __awaiter(this, void 0, void 0, function*() {
        const saveString = localStorage.getItem(`${keyPrefix}saveGame`);
        if (saveString === null) {
            if (localStorage.getItem(`${keyPrefix}skillLevel`) !== null) {
                return 1;
            } else {
                if (nativeManager.isSteam) {
                    const steamBackup = yield cloudManager.readFromSteamCloud(`${keyPrefix}saveGame`);
                    if (steamBackup !== undefined && steamBackup !== null)
                        return 2;
                } else {
                    const nativeBackup = yield nativeManager.getNativeCloudBackup(`${keyPrefix}saveGame`);
                    if (nativeBackup.status == 'success')
                        return 2;
                }
                return 0;
            }
        } else {
            return 2;
        }
    });
}

function deleteLocalSaveInSlot(slotID) {
    if (slotID === undefined)
        slotID = currentCharacter;
    const storageKey = getKeyForSaveSlot(slotID);
    if (localStorage.getItem(`${storageKey}saveGame`) !== null) {
        localStorage.removeItem(`${storageKey}saveGame`);
    }
    nativeManager.deleteNativeCloudBackup(`${storageKey}saveGame`);
    cloudManager.deleteFromSteamCloud(`${storageKey}saveGame`);
    removeSaveOld(storageKey);
    console.log(`Deleted local save in slot: ${slotID}.`);
    dataDeleted = true;
}
/** Callback function for exporting a save */
function exportSave(update = false) {
    return __awaiter(this, void 0, void 0, function*() {
        const exportSaved = yield getLocalSaveString();
        if (!update) {
            const exportField = document.getElementById('exportSaveField');
            const exportField2 = document.getElementById('exportSaveField2');
            exportField.value = exportSaved;
            exportField2.value = exportSaved;
        } else {
            const exportField = document.getElementById('exportSaveFieldUpdate');
            const exportField2 = document.getElementById('exportSaveFieldUpdate2');
            exportField.value = exportSaved;
            exportField2.value = exportSaved;
        }
    });
}
/** Sets the specified local save slot to the given saveString */
function setSlotToSaveString(slotID, saveString) {
    return __awaiter(this, void 0, void 0, function*() {
        const keyToUse = getKeyForSaveSlot(slotID);
        const existingSave = yield doesLocalSaveExist(keyToUse);
        if (existingSave === 1) {
            removeSaveOld(keyToUse);
        }
        localStorage.setItem(`${keyToUse}saveGame`, saveString);
        nativeManager.saveToNativeCloudBackup(`${keyToUse}saveGame`, saveString);
    });
}
/** Attempts to import a save to the specified slot. Returns a promise which if resolved to true means the import was a success. */
function importSaveToSlot(saveString, slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        if (saveString === '')
            return false;
        const saveHeader = yield game.getHeaderFromSaveString(saveString);
        if (typeof saveHeader === 'number')
            return false;
        setSlotToSaveString(slotID, saveString);
        return true;
    });
}
/**
 * Copies a given string to the clipboard
 * @param input Text to copy to the clipboard
 * @returns True if copy was successful, false if not
 */
function copyToClipboard(input) {
    return __awaiter(this, void 0, void 0, function*() {
        const copyIcon = document.getElementById('copy-icon');
        if (navigator.clipboard) {
            try {
                yield navigator.clipboard.writeText(input);
                copyUICallback(copyIcon);
                return true;
            } catch (e) {
                console.error('Failed to copy the text to clipboard using Clipboard API:', e);
            }
        }
        const textarea = document.createElement('textarea');
        textarea.value = input;
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.position = 'fixed';
        document.body.append(textarea);
        textarea.focus();
        textarea.select();
        let res = false;
        try {
            res = document.execCommand('copy');
        } catch (e) {
            console.error('Failed to copy the text to clipboard using execCommand:', e);
        }
        document.body.removeChild(textarea);
        copyUICallback(copyIcon);
        return res;
    });
}

function copyUICallback(el) {
    if (el !== null) {
        el.classList.remove('fa-copy');
        el.classList.remove('text-info');
        el.classList.add('fa-check');
        el.classList.add('text-success');
        setTimeout(function() {
            el.classList.remove('fa-check');
            el.classList.add('fa-copy');
            el.classList.add('text-info');
            el.classList.remove('text-success');
        }, 2000);
    }
}
/**
 * Gets a save string for a local save
 * @param customKey
 * @param charID
 * @returns
 */
function getLocalSaveString(customKey = false, charID = 0) {
    return __awaiter(this, void 0, void 0, function*() {
        let keyPrefix = key;
        if (customKey)
            keyPrefix = getKeyForSaveSlot(charID);
        const saveExists = yield doesLocalSaveExist(keyPrefix);
        if (saveExists) {
            switch (saveExists) {
                case 1:
                    return getSaveStringOld(keyPrefix);
                case 2:
                    {
                        //Load steam cloud local save first if it exists
                        if (nativeManager.isSteam) {
                            if (DEBUGENABLED)
                                console.log(`Checking for Steam Cloud save in slot: ${charID}`);
                            const steamBackup = yield cloudManager.readFromSteamCloud(`${keyPrefix}saveGame`);
                            if (steamBackup !== undefined && steamBackup !== null)
                                return steamBackup;
                            if (DEBUGENABLED)
                                console.log(`Steam Cloud save does not exist in slot: ${charID}`);
                        }
                        const saveString = localStorage.getItem(`${keyPrefix}saveGame`);
                        if (saveString === null) {
                            const nativeBackup = yield nativeManager.getNativeCloudBackup(`${keyPrefix}saveGame`);
                            if (nativeBackup.status == 'success' && nativeBackup.data !== undefined)
                                return nativeBackup.data;
                            return '';
                        } else
                            return saveString;
                    }
            }
        } else
            return '';
    });
}
/**
 *
 * @param {string} keyPrefix
 * @returns {string}
 */
function getSaveStringOld(keyPrefix) {
    const toSave = getSaveGameOld(keyPrefix);
    const compressedSave = fflate.strFromU8(fflate.gzipSync(fflate.strToU8(JSON.stringify(toSave))), true);
    return btoa(compressedSave);
}
let loadedIDMap = undefined;

function getNumericIDMap() {
    return __awaiter(this, void 0, void 0, function*() {
        if (loadedIDMap === undefined) {
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            const response = yield fetch('assets/data/oldIDMaps.json', {
                method: 'GET',
                headers,
            });
            loadedIDMap = (yield response.json());
        }
        return loadedIDMap;
    });
}

function downloadSave(backup = false, slotID = -1) {
    return __awaiter(this, void 0, void 0, function*() {
        let saveString;
        let saveUsername = '';
        const saveTimestamp = replaceAll(new Date().toLocaleDateString(), '/', '-') +
            '_' +
            replaceAll(replaceAll(new Date().toLocaleTimeString(), ':', ''), ' ', '');
        if (!backup && slotID < 0)
            saveString = yield getLocalSaveString();
        else if (slotID >= 0)
            saveString = yield getLocalSaveString(true, slotID);
        else
            saveString = backupSave;
        const file = new Blob([saveString], {
            type: 'text/plain'
        });
        if (slotID >= 0) {
            const saveInfo = yield game.getHeaderFromSaveString(saveString);
            if (typeof saveInfo === 'number') {
                console.log('Unable to get save username. Using default.');
                saveUsername = `ErrorSaveSlot${slotID + 1}`;
            } else {
                saveUsername = saveInfo.characterName;
            }
        } else {
            saveUsername = game.characterName;
        }
        // Others
        try {
            const a = document.createElement('a'),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = 'melvoridlesave_' + saveUsername + '_' + saveTimestamp + '.txt';
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
            return true;
        } catch (e) {
            return false;
        }
    });
}

function isOldItemStats(itemStats) {
    return itemStats.length > 0 && !('stats' in itemStats[0]);
}

function isOldMonsterStats(monsterStats) {
    return monsterStats.length > 0 && !('stats' in monsterStats[0]);
}
/** Converts 1st item stats format stats to the 2nd item stats format */
function convertItemStats(oldItemStats) {
    const newItemStats = [];
    for (let i = 0; i < oldItemStats.length; i++) {
        newItemStats.push({
            itemID: i,
            stats: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        });
        newItemStats[i].stats[0] = oldItemStats[i].timesFound;
        newItemStats[i].stats[1] = oldItemStats[i].timesSold;
        newItemStats[i].stats[2] = oldItemStats[i].gpFromSale;
        newItemStats[i].stats[3] = oldItemStats[i].deathCount;
        newItemStats[i].stats[4] = oldItemStats[i].damageTaken;
        newItemStats[i].stats[5] = oldItemStats[i].damageDealt;
        newItemStats[i].stats[6] = oldItemStats[i].missedAttacks;
        newItemStats[i].stats[7] = oldItemStats[i].timesEaten;
        newItemStats[i].stats[8] = oldItemStats[i].healedFor;
        newItemStats[i].stats[9] = oldItemStats[i].totalAttacks;
        newItemStats[i].stats[10] = oldItemStats[i].amountUsedInCombat;
        newItemStats[i].stats[11] = oldItemStats[i].timeWaited;
        newItemStats[i].stats[12] = oldItemStats[i].timesDied;
        newItemStats[i].stats[13] = oldItemStats[i].timesGrown;
        newItemStats[i].stats[14] = oldItemStats[i].harvestAmount;
        newItemStats[i].stats[15] = oldItemStats[i].enemiesKilled;
        newItemStats[i].stats[16] = oldItemStats[i].timesOpened;
    }
    return newItemStats;
}
/** Converts 1st monster stats format to the 2nd monster stats format */
function convertMonsterStats(oldMonsterStats) {
    const newMonsterStats = [];
    for (let i = 0; i < oldMonsterStats.length; i++) {
        newMonsterStats.push({
            monsterID: i,
            stats: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        });
        newMonsterStats[i].stats[0] = oldMonsterStats[i].damageDealtToPlayer;
        newMonsterStats[i].stats[1] = oldMonsterStats[i].damageTakenFromPlayer;
        newMonsterStats[i].stats[2] = oldMonsterStats[i].killedByPlayer;
        newMonsterStats[i].stats[3] = oldMonsterStats[i].killedPlayer;
        newMonsterStats[i].stats[4] = oldMonsterStats[i].hitsToPlayer;
        newMonsterStats[i].stats[5] = oldMonsterStats[i].hitsFromPlayer;
        newMonsterStats[i].stats[6] = oldMonsterStats[i].enemyMissed;
        newMonsterStats[i].stats[7] = oldMonsterStats[i].playerMissed;
        newMonsterStats[i].stats[8] = oldMonsterStats[i].seen;
        newMonsterStats[i].stats[9] = oldMonsterStats[i].ranAway;
    }
    return newMonsterStats;
}
let blockCorruptSaving = false;
/**
 * Converts an old format savegame
 * @param {NewSaveGame} savegame
 */
function loadOldSaveGame(savegame) {
    return __awaiter(this, void 0, void 0, function*() {
        const idMap = yield getNumericIDMap();
        try {
            if (savegame.accountGameVersion < 110)
                updateSavePre110(savegame);
            if (savegame.accountGameVersion < 121)
                updateSavePre121(savegame);
            if (savegame.version <= 8) {
                if (savegame.itemStats !== undefined && isOldItemStats(savegame.itemStats)) {
                    savegame.itemStats = convertItemStats(savegame.itemStats);
                }
                if (savegame.monsterStats !== undefined && isOldMonsterStats(savegame.monsterStats)) {
                    savegame.monsterStats = convertMonsterStats(savegame.monsterStats);
                }
            }
            cleanSaveGame(savegame);
            convertOldMastery(savegame);
            game.convertFromOldFormat(savegame, idMap);
        } catch (e) {
            blockCorruptSaving = true;
            handleGameLoadingError('An error occured while loading Old Save Game', e);
        }
    });
}
let quickEquipInterval = -1;
let inFocus = true;
const onloadEvent = function(accessCheck = false) {
    var _a;
    if (!gameOriginCheck())
        $('body').html(`Why tho<br><img src="${assets.getURI('assets/april/images/lemon.jpg')}">`);
    else {
        let errorNum = '0';
        try {
            let bgToUse = localStorage.getItem('setBackground');
            bgToUse = bgToUse === null ? '0' : bgToUse;
            setGameBackgroundImage(bgToUse);
            //DEBUG_REPORTER.push("onLoadEvent start");
            updateKeys();
            //$("title").text(gameTitle);
            $('.cloud-connection-status-text').removeClass('text-danger');
            $('.cloud-connection-status-text').removeClass('text-success');
            if (!cloudManager.isAuthenticated)
                $('.btn-cloud-sign-in').removeClass('d-none');
            if (nativeManager.isSteam || !cloudManager.hasFullVersionEntitlement)
                $('.cloud-connection-status-header-mobile').addClass('d-none');
            if (cloudManager.isTest && accessCheck) {
                if (!confirmedLoaded)
                    $('#m-page-loader-test').attr('class', 'show');
                $('#m-page-loader').attr('class', 'd-none');
            } else {
                errorNum = '4';
                /*
                let CSAV;
                if (getItem('CSAV') === undefined || getItem('CSAV') === null) CSAV = 3;
                else CSAV = getItem('CSAV');
                if (CSAV < characterSelectAnnouncementVersion) {
                  $('#character-selection-page-8').removeClass('d-none');
                  $('#character-selection-page-0').addClass('d-none');
                  currentStartPage = CharacterSelectPage.UpdateNotification;
                  setItem('CSAV', characterSelectAnnouncementVersion);
                }
                */
                $('#character-selection-page-8').addClass('d-none');
                if (localStorage.getItem('language') !== undefined &&
                    localStorage.getItem('language') !== null &&
                    currentStartPage !== 9 /* CharacterSelectPage.LanguageSelect */ ) {
                    $('#character-selection-page-0').removeClass('d-none');
                    currentStartPage = 0 /* CharacterSelectPage.SelectCharacter */ ;
                }
                updateUIForLanguageChange();
                updateUIForAnnouncements();
                //listeners
                errorNum = '8';
                if (checkMediaQuery('(hover: hover)')) {
                    $('#minibar-quick-equip')
                        .on('mouseover', function() {
                            $('#skill-footer-minibar-items-container').removeClass('d-none');
                        })
                        .on('mouseout', function() {
                            quickEquipInterval = window.setInterval(function() {
                                if (!$('#skill-footer-minibar-items-container:hover').length &&
                                    !$('#minibar-quick-equip:hover').length) {
                                    $('#skill-footer-minibar-items-container').addClass('d-none');
                                    clearInterval(quickEquipInterval);
                                }
                            }, 500);
                        });
                }
                errorNum = '9';
                errorNum = '10';
                if (cloudManager.isTest || cloudManager.isBeta)
                    (_a = sidebar.category('Test Environment').rootEl) === null || _a === void 0 ? void 0 : _a.classList.remove('d-none');
                ifvisible.on('blur', function() {
                    if (nativeManager.isSteam || nativeManager.isEpicGames)
                        return;
                    if (confirmedLoaded && inFocus)
                        game.combat.player.stopHoldToEat();
                    if (confirmedLoaded &&
                        (game.settings.pauseOnUnfocus || nativeManager.isNativeApp) &&
                        !game.isGolbinRaid &&
                        inFocus &&
                        game.tutorial.complete) {
                        inFocus = false;
                        game.stopMainLoop();
                        game.telemetry.fireEventType('online_xp_gain');
                    }
                });
                ifvisible.on('focus', function() {
                    if (nativeManager.isSteam || nativeManager.isEpicGames)
                        return;
                    if (confirmedLoaded &&
                        (game.settings.pauseOnUnfocus || nativeManager.isNativeApp) &&
                        !game.isGolbinRaid &&
                        !inFocus &&
                        game.tutorial.complete) {
                        inFocus = true;
                        game.triggerOfflineLoop();
                        game.startMainLoop();
                    }
                });
                window.addEventListener('beforeunload', function() {
                    if (!game.settings.enableOfflineCombat && characterSelected) {
                        if (game.combat.isActive)
                            game.combat.stop();
                    }
                    if (!game.tutorial.complete)
                        game.stopActiveAction();
                    if (!dataDeleted &&
                        characterSelected &&
                        (getItem('MI-forceReload-') === undefined || getItem('MI-forceReload-') === null)) {
                        saveData();
                    }
                    if (setLang === 'lemon') {
                        const prevLang = localStorage.getItem('prevLanguage');
                        if (prevLang !== null) {
                            localStorage.setItem('language', prevLang);
                            localStorage.removeItem('prevLanguage');
                        }
                    }
                    if (game.settings.showCloseConfirmations &&
                        !nativeManager.isSteam &&
                        !nativeManager.isNativeApp &&
                        !nativeManager.isEpicGames)
                        return getLangString('CHARACTER_SELECT_97');
                });
                errorNum = '12';
                $('body').on('swipeleft', function() {
                    const mq = checkMediaQuery('(max-width: 991px)');
                    if (mq && !disableSwipeEvents && !disableModalSwipe && game.settings.enableSwipeSidebar)
                        One._uiApiLayout('sidebar_close');
                });
                $('body').on('swiperight', function() {
                    const mq = checkMediaQuery('(max-width: 991px)');
                    if (mq &&
                        !disableSwipeEvents &&
                        !disableModalSwipe &&
                        !disableSidebarSwipe &&
                        game.settings.enableSwipeSidebar)
                        One._uiApiLayout('sidebar_open');
                });
            }
        } catch (e) {
            // TODO_L: Localize this error message
            if (e instanceof Error)
                $('#on-load-error').html("<span class='font-w700'>An error has occured loading the game:<br>If you are on Android, please clear your app cache in hopes to remove this error.</span><br>" +
                    e.message +
                    '<br>' +
                    e.stack);
        }
    }
};
//Do this stuff when the page loads
window.onload = function() {
    return __awaiter(this, void 0, void 0, function*() {
        assets.setImageSources();
        assets.setCSSAssetStyle();
        let langToSet = 'en';
        $('.language-select').removeClass('d-none');
        if (localStorage.getItem('language') !== undefined && localStorage.getItem('language') !== null)
            langToSet = localStorage.getItem('language');
        else {
            cloudManager.hidePageLoader();
            if (cloudManager.isOnAuthPage)
                cloudManager.showLanguageSelection();
            else
                changePageCharacterSelection(9 /* CharacterSelectPage.LanguageSelect */ );
        }
        initLocalStorageSettings();
        nativeManager.togglePlatformSpecificElements();
        cloudManager.setStatus('Loading Language Data...');
        yield setLanguage(langToSet);
        yield cloudManager.initSilentSignIn();
    });
};

function confirmedAuthenticated() {
    let langToSet = 'en';
    $('.language-select').removeClass('d-none');
    if (localStorage.getItem('language') !== undefined && localStorage.getItem('language') !== null)
        langToSet = localStorage.getItem('language');
    else
        changePageCharacterSelection(9 /* CharacterSelectPage.LanguageSelect */ );
    initLocalStorageSettings();
    setLanguage(langToSet).then(() => {
        onloadEvent(false);
    });
}

function checkIfAuthenticated() {
    return __awaiter(this, void 0, void 0, function*() {
        //Will check for an existing session/token and auto authenticate
        const isAuthenticated = yield cloudManager.checkAuthentication();
        if (!isAuthenticated)
            $('#m-page-loader').attr('class', 'd-none');
        else
            confirmedAuthenticated();
    });
}
const INTERFACE_VERSION = 213;

function assertInterfaceVersion() {
    const versionElement = document.getElementById('interface-version');
    if (versionElement === null || versionElement.textContent === null) {
        nativeManager.attemptToClearCache();
        throw new Error(`Interface version mismatch. Expected ${INTERFACE_VERSION}, got null.`);
    }
    const interfaceVersion = Number.parseInt(versionElement.textContent);
    if (interfaceVersion !== INTERFACE_VERSION) {
        nativeManager.attemptToClearCache();
        throw new Error(`Interface version mismatch. Expected ${INTERFACE_VERSION}, got ${interfaceVersion}.`);
    }
}
/** Sets the save loading message with setTimeout to allow the UI to refresh */
function setSaveLoadingMessageAsync(slotID, message) {
    return new Promise((resolve) => {
        setTimeout(() => {
            setSaveLoadingMessage(slotID, message);
            resolve();
        }, 0);
    });
}

function loadGameInterface(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        const url = `pageContainer.php?${INTERFACE_VERSION}`;
        let response;
        try {
            yield setSaveLoadingMessageAsync(slotID, `Loading Game Interface (fetching)...`);
            response = yield fetch(url);
        } catch (e) {
            throw new Error(`Error fetching game interface: ${e}`);
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch game interface. Status Code: ${response.status}. Status Text: ${response.statusText}`);
        }
        yield setSaveLoadingMessageAsync(slotID, `Loading Game Interface (getting text)...`);
        const text = yield response.text();
        yield setSaveLoadingMessageAsync(slotID, `Loading Game Interface (setting html)...`);
        const container = document.getElementById('page-container');
        if (container === null)
            throw new Error('Page container is null');
        container.innerHTML = text;
        yield setSaveLoadingMessageAsync(slotID, `Loading Game Interface (checking version)...`);
        assertInterfaceVersion();
        nativeManager.togglePlatformSpecificElements();
        yield setSaveLoadingMessageAsync(slotID, `Loading Game Interface (setting images)...`);
        assets.setImageSources();
        yield setSaveLoadingMessageAsync(slotID, `Loading Game Interface (mod interface available)...`);
        yield mod.trigger.interfaceAvailable();
        yield setSaveLoadingMessageAsync(slotID, `Loading Game Interface (initializing menus)...`);
        initMenus();
        yield setSaveLoadingMessageAsync(slotID, `Loading Game Interface (load event)...`);
        onloadEvent(false);
    });
}
const DATA_VERSION = 528;

function changePageCharacterSelection(page) {
    if (currentStartPage !== page) {
        if (page !== 3 /* CharacterSelectPage.SelectGamemode */ )
            setNewStartPage(page);
        if (page === 1 /* CharacterSelectPage.Login */ )
            enableLoginForm();
    }
}
/** Future announcement handler that will occur dynamically. For now this is hard coded. */
function updateUIForAnnouncements() {
    if (cloudManager.isOnAuthPage)
        return;
    //fanart contest announcement
    //if (localStorage.getItem("a-fanart") === undefined || localStorage.getItem("a-fanart") === null) $(".a-fanart").removeClass("d-none");
    //if (nativeManager.isAndroid && (localStorage.getItem("a-2") === undefined || localStorage.getItem("a-2") === null)) $(".a-2").removeClass("d-none");
    //if (localStorage.getItem("a-3") === undefined || localStorage.getItem("a-3") === null) $(".a-3").removeClass("d-none");
    //if (localStorage.getItem("a-4") === undefined || localStorage.getItem("a-4") === null) $(".a-4").removeClass("d-none");
    const btnBeta = document.getElementById('btn-android-beta');
    if (btnBeta !== null && nativeManager.isAndroid && !nativeManager.isGeckoView && nativeManager.showNewAppBeta)
        btnBeta.classList.remove('d-none');
    const btn = document.getElementById('android-app-join-beta');
    if (btn !== null) {
        btn.onclick = () => {
            nativeManager.isAndroidFullVersionNativeApp ?
                openLink('https://play.google.com/store/apps/details?id=com.malcs.melvoridleadfree') :
                openLink('https://play.google.com/store/apps/details?id=com.malcs.melvoridle');
        };
    }
    if (nativeManager.isAndroid &&
        !nativeManager.isGeckoView &&
        nativeManager.showNewAppBeta &&
        (localStorage.getItem('android-beta-popup') === undefined || localStorage.getItem('android-beta-popup') === null)) {
        localStorage.setItem('android-beta-popup', '1');
        $('#modal-a-6').modal('show');
    }
}

function hideUIForAnnouncement(id) {
    //if (id === 0) localStorage.setItem("a-fanart", "1");
    //if (id === 1) localStorage.setItem("a-2", "1");
    //if (id === 2) localStorage.setItem("a-3", "1");
    //if (id === 3) localStorage.setItem("a-4", "1");
    //if (id === 5) localStorage.setItem('a-5', '1');
    //if (id === 6) localStorage.setItem('a-6', '1');
    if (id === 7)
        localStorage.setItem('a-7', '1');
}
const maxSaveSlots = 8;

function updateLocalSaveHeaders() {
    return __awaiter(this, void 0, void 0, function*() {
        for (let slotID = 0; slotID < maxSaveSlots; slotID++) {
            const saveString = yield getLocalSaveString(true, slotID);
            if (saveString === '') {
                localSaveHeaders[slotID] = 0 /* SaveLoadError.Empty */ ;
            } else {
                localSaveHeaders[slotID] = yield game.getHeaderFromSaveString(saveString);
            }
        }
    });
}

function updateCloudSaveHeaders() {
    return __awaiter(this, void 0, void 0, function*() {
        for (let slotID = 0; slotID < maxSaveSlots; slotID++) {
            const saveString = cloudManager.getPlayFabSave(slotID);
            if (saveString === '') {
                cloudSaveHeaders[slotID] = 0 /* SaveLoadError.Empty */ ;
            } else {
                cloudSaveHeaders[slotID] = yield game.getHeaderFromSaveString(saveString);
            }
        }
    });
}
/** If the game is currently trying to load a save file */
let isLoadingSave = false;
/** If the game is currently creating a new save file */
let isCreatingSave = false;
/** Attempts to load the save in the string */
function loadSaveFromString(saveString, slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        // First Attempt to load the game interface
        setSaveLoadingMessage(slotID, 'Loading Game Interface...');
        yield loadGameInterface(slotID);
        // Next attempt to decode the save string
        setSaveLoadingMessage(slotID, 'Decoding Save...');
        let loadedOldFormatLocalSave = false;
        try {
            const reader = new SaveWriter('Read', 1);
            const saveVersion = reader.setDataFromSaveString(saveString);
            if (saveVersion > currentSaveVersion) {
                throw new Error("Invalid save version." /* SaveLoadErrorMessage.InvalidVersion */ );
            } else {
                game.decode(reader, saveVersion);
            }
        } catch (e) {
            if (e instanceof Error && e.message === 'String is not save.') {
                try {
                    const idMap = yield getNumericIDMap();
                    const {
                        saveGame,
                        oldFormat
                    } = getSaveFromString(saveString, idMap);
                    yield loadOldSaveGame(saveGame);
                    if (oldFormat) {
                        loadedOldFormatLocalSave = true;
                    }
                } catch (e) {
                    console.error(e);
                    throw new Error("Corrupt Save." /* SaveLoadErrorMessage.CorruptSave */ );
                }
            } else {
                console.error(e);
                throw new Error("Corrupt Save." /* SaveLoadErrorMessage.CorruptSave */ );
            }
        }
        // Finally update the user interface with the save data
        setSaveLoadingMessage(slotID, 'Updating Game Interface...');
        onSaveDataLoad();
        // Perform save operations/cleanup if all is well
    });
}

function processSaveLoadError(slotID, isCloud, error) {
    if (error instanceof Error) {
        showSaveLoadingError(slotID, error.message, isCloud);
    } else {
        showSaveLoadingError(slotID, 'Unknown Error Loading Save.', isCloud);
    }
    showTitleScreenError(error, 'An error occured while loading your save:');
}

function showTitleScreenError(error, title) {
    const modError = mod.getModErrorFromError(error);
    const errorLog = getTitleScreenErrorLog(error, title, modError);
    showGameErrorModal(title, errorLog, modError.mods);
}

function getTitleScreenErrorLog(error, title, modError) {
    let errorBody = 'Could not parse error';
    if (error instanceof Error) {
        errorBody = '';
        if (modError.mods.length > 0) {
            errorBody += `\nError due to the following mods:\n`;
            errorBody += modError.mods.map((mod) => `${mod.name} (v${mod.version})`).join('\n');
            errorBody += '\n\n';
        }
        errorBody += `Error Name: ${error.name}
Error Message: ${error.message}
Stack Trace:
${modError.stack}`;
    } else if (typeof error === 'string') {
        errorBody = error;
    }
    let moddingLog = 'Modding Disabled';
    if (mod.manager.isEnabled()) {
        moddingLog = 'Modding Enabled. Loaded mods:\n';
        moddingLog += mod.manager.getLoadedModList().join('\n');
    }
    const errorMessage = `${title}
${errorBody}

${moddingLog}`;
    return errorMessage;
}
/** Attempts to load the local save in the given save slot */
function loadLocalSave(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        if (isLoadingSave)
            return;
        isLoadingSave = true;
        currentCharacter = slotID;
        updateKeys();
        setSaveLoadingMessage(slotID, 'Getting Local Save...');
        const saveString = yield getLocalSaveString(true, slotID);
        if (saveString === '') {
            showSaveLoadingError(slotID, 'Error: Local Save Does not exist.', false);
        } else {
            try {
                yield loadSaveFromString(saveString, slotID);
            } catch (e) {
                processSaveLoadError(slotID, false, e);
            }
        }
    });
}
/** Attempts to load the cloud save in the given save slot */
function loadCloudSave(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        if (isLoadingSave)
            return;
        isLoadingSave = true;
        currentCharacter = slotID;
        updateKeys();
        const saveString = cloudManager.getPlayFabSave(slotID);
        if (saveString === '') {
            showSaveLoadingError(slotID, 'Error: Cloud Save Does not exist.', true);
        } else {
            try {
                yield loadSaveFromString(saveString, slotID);
            } catch (e) {
                processSaveLoadError(slotID, true, e);
            }
        }
    });
}

function createNewCharacterInSlot(slotID, gamemode, characterName) {
    return __awaiter(this, void 0, void 0, function*() {
        if (isLoadingSave)
            return;
        isLoadingSave = true;
        isCreatingSave = true;
        currentCharacter = slotID;
        updateKeys();
        deleteLocalSaveInSlot();
        dataDeleted = true;
        yield loadGameInterface(slotID);
        game.characterName = characterName;
        game.currentGamemode = gamemode;
        game.combat.player.hitpoints = 10 * gamemode.hitpointMultiplier;
        game.combat.player.setDefaultEquipmentSets();
        game.combat.player.setDefaultAttackStyles();
        game.combat.player.setDefaultSpells();
        game.golbinRaid.player.setDefaultEquipmentSets();
        game.golbinRaid.player.setDefaultAttackStyles();
        game.golbinRaid.player.setDefaultSpells();
        onSaveDataLoad();
        dataDeleted = false;
        saveData();
    });
}
//# sourceMappingURL=save.js.map
checkFileVersion('?12097')