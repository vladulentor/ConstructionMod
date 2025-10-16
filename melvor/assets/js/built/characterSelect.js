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
// All Code relating to the character select page goes here
let inCharacterSelection = false;
let currentSaveView = 0 /* SaveViewType.Local */ ;
let startingGamemode = undefined;
let createNewCharacterSlot = -1;
/** Headers of local saves that have been loaded */
const localSaveHeaders = [];
/** Headers of cloud saves that have been loaded */
const cloudSaveHeaders = [];

function loadCharacterSelection(returnToGame = false) {
    console.log('Loading character selection');
    inCharacterSelection = true;
    returnToGameAfterSubmission = returnToGame;
    $('#m-page-loader-test').attr('class', 'show');
    showLocalSaveSelection();
    cloudManager.updateUIForPlayFabSignIn(); // TODO_C: Should this function be async?
    cloudManager.updateUIForMelvorCloudSignIn();
    cloudManager.updateUIForEntitlements();
    //we need to check if the player is connected to the cloud first
    //if they are, we will display the cloud saves first, with an option to toggle the display of local saves.
    mod.trigger.characterSelectionLoaded();
}

function getCloudInfoInSlot(slotID) {
    let cloudInfo = undefined;
    let hasCloud = false;
    if (cloudSaveHeaders.length === maxSaveSlots) {
        const cloudHeader = cloudSaveHeaders[slotID];
        switch (cloudHeader) {
            case 0 /* SaveLoadError.Empty */ :
                hasCloud = false;
                break;
            case 1 /* SaveLoadError.Corrupt */ :
            case 2 /* SaveLoadError.InvalidVersion */ :
                hasCloud = true;
                break;
            default:
                hasCloud = true;
                cloudInfo = cloudHeader;
                break;
        }
    }
    return {
        cloudInfo,
        hasCloud
    };
}

function getLocalInfoInSlot(slotID) {
    let localInfo = undefined;
    if (localSaveHeaders.length === maxSaveSlots) {
        const localHeader = localSaveHeaders[slotID];
        if (!(typeof localHeader === 'number'))
            localInfo = localHeader;
    }
    return localInfo;
}
/** Callback function for when the user refreshes the cloud save selection */
function refreshCloudSavesOnClick() {
    return __awaiter(this, void 0, void 0, function*() {
        if (!PlayFabClientSDK.IsClientLoggedIn())
            return;
        const refresh = document.getElementById('character-selection-toggle-refresh');
        refresh.disabled = true;
        refresh.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div>`;
        yield cloudManager.refreshPlayFabSaves();
        if (currentSaveView === 1 /* SaveViewType.Cloud */ )
            showCloudSaveSelection();
        refresh.innerHTML = `<i class="si si-refresh"></i>`;
        refresh.disabled = false;
    });
}
/** Shows the saves that are locally present on the character selection page */
function showLocalSaveSelection() {
    if (localSaveHeaders.length < maxSaveSlots)
        throw new Error('Local saves have not been loaded yet.');
    const saveContainer = $('#character-selection-container');
    let html = createCharacterSelectSettings();
    if (cloudManager.isBeta)
        html += createSaveInfoBox();
    //html += createDisableModsInfoBox();
    html += createToggleCharacterSelectionViewBtn();
    saveContainer.html(html);
    localSaveHeaders.forEach((localInfo, slotID) => {
        const saveSlotDisplay = createElement('save-slot-display', {
            id: `save-slot-display-${slotID}`
        });
        saveContainer.append(saveSlotDisplay);
        const {
            cloudInfo,
            hasCloud
        } = getCloudInfoInSlot(slotID);
        switch (localInfo) {
            case 0 /* SaveLoadError.Empty */ :
                saveSlotDisplay.setEmptyLocal(slotID, hasCloud);
                break;
            case 1 /* SaveLoadError.Corrupt */ :
                saveSlotDisplay.setError(slotID, getLangString('MENU_TEXT_SAVE_ERROR_MESSAGE_2'), false);
                break;
            case 2 /* SaveLoadError.InvalidVersion */ :
                saveSlotDisplay.setError(slotID, getLangString('MENU_TEXT_SAVE_ERROR_MESSAGE_1'), false);
                break;
            default:
                saveSlotDisplay.setLocalSave(slotID, localInfo, cloudInfo);
                break;
        }
        saveSlotDisplay.characterDisplay.toggleTestWarning(cloudManager.isTest);
    });
    saveContainer.append(createLatestDeathNotification());
}
/** Shows the saves that have been fetched from the cloud on the character selection page */
function showCloudSaveSelection() {
    if (cloudSaveHeaders.length < maxSaveSlots)
        throw new Error(`Cloud saves have not been loaded yet.`);
    const saveContainer = $('#character-selection-container');
    let html = createCharacterSelectSettings();
    if (cloudManager.isBeta)
        html += createSaveInfoBox();
    //html += createDisableModsInfoBox();
    html += createToggleCharacterSelectionViewBtn();
    saveContainer.html(html);
    cloudSaveHeaders.forEach((cloudInfo, slotID) => {
        const saveSlotDisplay = createElement('save-slot-display', {
            id: `save-slot-display-${slotID}`
        });
        saveContainer.append(saveSlotDisplay);
        const localInfo = getLocalInfoInSlot(slotID);
        switch (cloudInfo) {
            case 0 /* SaveLoadError.Empty */ :
                saveSlotDisplay.setEmptyCloud(slotID);
                break;
            case 1 /* SaveLoadError.Corrupt */ :
                saveSlotDisplay.setError(slotID, getLangString('MENU_TEXT_SAVE_ERROR_MESSAGE_3'), true);
                break;
            case 2 /* SaveLoadError.InvalidVersion */ :
                saveSlotDisplay.setError(slotID, getLangString('MENU_TEXT_SAVE_ERROR_MESSAGE_4'), true);
                break;
            default:
                saveSlotDisplay.setCloudSave(slotID, cloudInfo, localInfo);
                break;
        }
        saveSlotDisplay.characterDisplay.toggleTestWarning(cloudManager.isTest);
    });
}
/** Shows the save selection as loading a save in a given slot */
function showSaveSelectionLoading(slotLoading) {
    for (let slotID = 0; slotID < maxSaveSlots; slotID++) {
        const slotElement = document.getElementById(`save-slot-display-${slotID}`);
        if (slotElement === null)
            continue;
        if (slotID === slotLoading) {
            slotElement.setSaveLoading();
        } else {
            slotElement.setDisabled();
        }
    }
}

function setSaveLoadingMessage(slotID, message) {
    if (setLang !== 'en')
        return;
    const slotElement = document.getElementById(`save-slot-display-${slotID}`);
    if (slotElement === null)
        return;
    slotElement.setLoadingMessage(message);
}

function showSaveLoadingError(slotID, message, isCloud) {
    const slotElement = document.getElementById(`save-slot-display-${slotID}`);
    if (slotElement === null)
        return;
    slotElement.setError(slotID, message, isCloud);
}
/** Changes the type of saves being displayed. */
function toggleSaveSelectionView(newView = -1) {
    if (newView === -1) {
        switch (currentSaveView) {
            case 0 /* SaveViewType.Local */ :
                newView = 1 /* SaveViewType.Cloud */ ;
                break;
            case 1 /* SaveViewType.Cloud */ :
                newView = 0 /* SaveViewType.Local */ ;
                break;
        }
    }
    switch (newView) {
        case 0 /* SaveViewType.Local */ :
            {
                currentSaveView = 0 /* SaveViewType.Local */ ;
                showLocalSaveSelection();
            }
            break;
        case 1 /* SaveViewType.Cloud */ :
            {
                currentSaveView = 1 /* SaveViewType.Cloud */ ;
                showCloudSaveSelection();
            }
            break;
    }
}
/**
 * Checks the header of a savegame for expansion or full version content, and if that content is installed.
 * @param saveInfo A header of a savegame
 * @returns The first namespace of the expansion that is not installed, or undefined if all are installed
 */
function checkSaveExpansions(saveInfo) {
    let notInstalled = undefined;
    for (let i = saveInfo.activeNamespaces.length - 1; i >= 0; i--) {
        const ns = saveInfo.activeNamespaces[i];
        if (!game.registeredNamespaces.hasNamespace(ns)) {
            notInstalled = ns;
            break;
        }
    }
    return notInstalled;
}
/**
 * Shows an error to the end user that their save cannot be loaded because an expansion is not installed
 * @param ns The namespace of the expansion that is not installed
 */
function showSaveExpansionError(ns) {
    const modalBody = createElement('div');
    switch (ns) {
        case "melvorItA" /* Namespaces.IntoTheAbyss */ :
            modalBody.append(createElement('p', {
                text: getLangString('CHARACTER_SELECT_SAVE_CONTENT_ERROR_ITA'),
            }));
            break;
        case "melvorAoD" /* Namespaces.AtlasOfDiscovery */ :
            modalBody.append(createElement('p', {
                text: getLangString('CHARACTER_SELECT_SAVE_CONTENT_ERROR_ATLAS'),
            }));
            break;
        case "melvorTotH" /* Namespaces.Throne */ :
            modalBody.append(createElement('p', {
                text: getLangString('CHARACTER_SELECT_SAVE_CONTENT_ERROR_THRONE'),
            }));
            break;
        case "melvorF" /* Namespaces.Full */ :
            modalBody.append(createElement('p', {
                text: getLangString('CHARACTER_SELECT_SAVE_CONTENT_ERROR_FULL'),
            }));
            break;
        case "melvorD" /* Namespaces.Demo */ :
            modalBody.append(createElement('p', {
                text: getLangString('CHARACTER_SELECT_SAVE_CONTENT_ERROR_DEMO')
            }));
            break;
    }
    const instructions = createElement('p', {
        parent: modalBody
    });
    instructions.innerHTML = templateLangString('CHARACTER_SELECT_SAVE_CONTENT_ERROR_INSTRUCTIONS', {
        icon1: '<i class="fa fa-cog mr-1"></i>',
        icon2: '<i class="fa fa-exclamation-circle mr-1"></i>',
    });
    SwalLocale.fire({
        titleText: getLangString('CHARACTER_SELECT_ERROR_LOADING_SAVE'),
        icon: 'error',
        html: modalBody,
    });
}
/** Callback function for when the force load save setting is clicked on */
function forceLoadSaveOnClick(slotID, isCloud) {
    return __awaiter(this, void 0, void 0, function*() {
        const saveInfo = isCloud ? cloudSaveHeaders[slotID] : localSaveHeaders[slotID];
        if (typeof saveInfo === 'number')
            throw new Error('Tried to force load invalid save.');
        // Show a warning to the user and await confirmation
        const modalBody = createElement('div');
        modalBody.append(createElement('p', {
            text: getLangString('CHARACTER_SELECT_FORCE_LOAD_WARNING'),
            className: 'font-size-sm text-warning',
        }));
        const el = createElement('div', {
            className: 'bg-light rounded p-2 mb-2',
            parent: modalBody
        });
        const formGroup = createElement('div', {
            className: 'form-check',
            parent: el,
        });
        const confirmCheck = createElement('input', {
            className: 'form-check-input pointer-enabled',
            attributes: [
                ['type', 'checkbox']
            ],
            id: 'force-load-save-check',
            parent: formGroup,
        });
        createElement('label', {
            text: getLangString('CHARACTER_SELECT_FORCE_LOAD_CONFIRMATION'),
            className: 'form-check-label pointer-enabled font-size-sm text-left',
            attributes: [
                ['for', 'force-load-save-check']
            ],
            parent: formGroup,
        });
        const userResponse = yield SwalLocale.fire({
            titleText: getLangString('CHARACTER_SELECT_FORCE_LOAD_SAVE'),
            icon: 'warning',
            html: modalBody,
            confirmButtonText: getLangString('CHARACTER_SELECT_FORCE_LOAD'),
            showCancelButton: true,
            preConfirm: () => {
                return confirmCheck.checked;
            },
        });
        if (!userResponse.value)
            return;
        if (isCloud)
            loadCloudSaveOnClick(slotID, true);
        else
            loadLocalSaveOnClick(slotID, true);
    });
}
/** Callback function for when a local save is clicked on */
function loadLocalSaveOnClick(slotID, force = false) {
    return __awaiter(this, void 0, void 0, function*() {
        if (isLoadingSave)
            return;
        if (showModManagerPrompts())
            return;
        const localInfo = localSaveHeaders[slotID];
        if (typeof localInfo === 'number')
            throw new Error('Tried to load invalid local save.');
        if (localInfo.saveVersion >= 83 && (yield showModProfilePrompts(localInfo.modProfile)))
            return;
        const unloadedNS = checkSaveExpansions(localInfo);
        if (unloadedNS !== undefined && !force) {
            showSaveExpansionError(unloadedNS);
            return;
        }
        if (localStorageSettings.enableSaveOverwriteWarning == 'true' && PlayFabClientSDK.IsClientLoggedIn()) {
            const html = createElement('div');
            html.append(createElement('h5', {
                className: 'text-dark font-size-sm',
                text: getLangString('CHARACTER_SELECT_69')
            }), getLocalSaveSummary(slotID), createElement('h5', {
                className: 'font-w600 text-danger mb-3 mt-3',
                text: getLangString('MENU_TEXT_WILL_OVERWRITE'),
            }), getCloudSaveSummary(slotID));
            const userResponse = yield SwalLocale.fire({
                title: getLangString('CHARACTER_SELECT_67'),
                html: html,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
            });
            if (userResponse.value) {
                showSaveSelectionLoading(slotID);
                yield loadLocalSave(slotID);
                yield mod.trigger.characterLoaded();
            }
        } else {
            showSaveSelectionLoading(slotID);
            yield loadLocalSave(slotID);
            yield mod.trigger.characterLoaded();
        }
    });
}
/** Callback function for when a cloud save is clicked on */
function loadCloudSaveOnClick(slotID, force = false) {
    return __awaiter(this, void 0, void 0, function*() {
        if (isLoadingSave)
            return;
        if (showModManagerPrompts())
            return;
        const cloudInfo = cloudSaveHeaders[slotID];
        if (typeof cloudInfo === 'number')
            throw new Error('Tried to load invalid cloud save.');
        if (cloudInfo.saveVersion >= 83 && (yield showModProfilePrompts(cloudInfo.modProfile)))
            return;
        const unloadedNS = checkSaveExpansions(cloudInfo);
        if (unloadedNS !== undefined && !force) {
            showSaveExpansionError(unloadedNS);
            return;
        }
        if (localStorageSettings.enableSaveOverwriteWarning == 'true') {
            const html = createElement('div');
            html.append(createElement('h5', {
                className: 'text-dark font-size-sm',
                text: getLangString('CHARACTER_SELECT_70')
            }), getCloudSaveSummary(slotID), createElement('h5', {
                className: 'font-w600 text-danger mb-3 mt-3',
                text: getLangString('MENU_TEXT_WILL_OVERWRITE'),
            }), getLocalSaveSummary(slotID));
            const userResponse = yield SwalLocale.fire({
                title: getLangString('CHARACTER_SELECT_68'),
                html: html,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
            });
            if (userResponse.value) {
                showSaveSelectionLoading(slotID);
                yield loadCloudSave(slotID);
            }
        } else {
            showSaveSelectionLoading(slotID);
            yield loadCloudSave(slotID);
        }
    });
}
/** Gets an element that displays the info on a local save in the given save slot */
function getLocalSaveSummary(slotID) {
    if (localSaveHeaders.length < maxSaveSlots)
        throw new Error('Local saves not loaded.');
    const localInfo = localSaveHeaders[slotID];
    switch (localInfo) {
        case 0 /* SaveLoadError.Empty */ :
            return createElement('h5', {
                className: 'font-w400 font-size-sm mb-3',
                text: getLangString('GOLBIN_RAID_POPUP_9'),
            });
        case 1 /* SaveLoadError.Corrupt */ :
        case 2 /* SaveLoadError.InvalidVersion */ :
            return createElement('h5', {
                className: 'font-w600 text-danger font-size-sm mb-3',
                text: getLangString('MENU_TEXT_ERROR_DISPLAY_LOCAL'),
            });
        default:
            {
                const characterDisplay = createElement('character-display');
                const {
                    cloudInfo
                } = getCloudInfoInSlot(slotID);
                characterDisplay.setLocalSave(slotID, localInfo, cloudInfo, true);
                return characterDisplay;
            }
    }
}
/** Gets an element that displays the info on a cloud save in the given save slot */
function getCloudSaveSummary(slotID) {
    if (cloudSaveHeaders.length < maxSaveSlots)
        throw new Error('Cloud saves not loaded.');
    const cloudInfo = cloudSaveHeaders[slotID];
    switch (cloudInfo) {
        case 0 /* SaveLoadError.Empty */ :
            return createElement('h5', {
                className: 'font-w400 font-size-sm mb-3',
                text: getLangString('GOLBIN_RAID_POPUP_9'),
            });
        case 1 /* SaveLoadError.Corrupt */ :
        case 2 /* SaveLoadError.InvalidVersion */ :
            return createElement('h5', {
                className: 'font-w600 text-danger font-size-sm mb-3',
                text: getLangString('MENU_TEXT_ERROR_DISPLAY_CLOUD'),
            });
        default:
            {
                const characterDisplay = createElement('character-display');
                const localInfo = getLocalInfoInSlot(slotID);
                characterDisplay.setCloudSave(slotID, cloudInfo, localInfo, true);
                return characterDisplay;
            }
    }
}
/** Opens the import save from string form */
function showImportSaveFromStringForm(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        const userResponse = yield SwalLocale.fire({
            title: getLangString('CHARACTER_SELECT_38'),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('CHARACTER_SELECT_43')}</h5>
					<div class="form-group">
						<textarea class="form-control" id="import-save-character-selection" name="import-save-character-selection" rows="8" placeholder="${getLangString('CHARACTER_SELECT_91')}" onclick="this.select();"></textarea>
					</div>`,
            showCancelButton: true,
            confirmButtonText: getLangString('CHARACTER_SELECT_44'),
        });
        if (!userResponse.value)
            return;
        const saveString = $('#import-save-character-selection').val();
        if (saveString.startsWith('https://melvoridle.com/save/') && saveString.length < 100) {
            yield processImportSaveFromLink(saveString, slotID);
        } else {
            const importSuccess = yield importSaveToSlot(saveString, slotID);
            if (importSuccess) {
                SwalLocale.fire({
                    icon: 'success',
                    title: getLangString('CHARACTER_SELECT_73'),
                    html: `<span class='text-dark'>${getLangString('CHARACTER_SELECT_92')}</span>`,
                });
                yield updateLocalSaveHeaders();
                toggleSaveSelectionView(0 /* SaveViewType.Local */ );
                inCharacterSelection = true;
            } else {
                SwalLocale.fire({
                    icon: 'error',
                    title: getLangString('CHARACTER_SELECT_93'),
                    html: `<span class='text-dark'>${getLangString('CHARACTER_SELECT_94')}</span>`,
                });
            }
        }
    });
}
/** Opens the import save from link form */
function showImportSaveFromLinkForm(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        const userResponse = yield SwalLocale.fire({
            title: getLangString('CHARACTER_SELECT_38'),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('CHARACTER_SELECT_43')}</h5>
					<div class="form-group">
						<input type="text" class="form-control" id="import-save-link-character-selection" name="import-save-link-character-selection" rows="1" placeholder="${getLangString('CHARACTER_SELECT_91')}"/>
					</div>`,
            showCancelButton: true,
            confirmButtonText: getLangString('CHARACTER_SELECT_44'),
        });
        if (!userResponse.value)
            return;
        const link = $('#import-save-link-character-selection').val();
        if (link.startsWith('https://melvoridle.com/save/') && link.length < 100)
            yield processImportSaveFromLink(link, slotID);
    });
}
/** Attempts to import a save from a link */
function processImportSaveFromLink(link, slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        const shortLink = replaceAll(link, 'https://melvoridle.com/save/', '');
        const URL = `cloud/getSaveFromLink.php?saveLink=${shortLink}`;
        const response = yield fetch(URL, {
            method: 'GET',
        });
        const saveString = yield response.text();
        const importSuccess = yield importSaveToSlot(saveString, slotID);
        if (importSuccess) {
            SwalLocale.fire({
                icon: 'success',
                title: getLangString('CHARACTER_SELECT_73'),
                html: `<span class='text-dark'>${getLangString('CHARACTER_SELECT_92')}</span>`,
            });
            inCharacterSelection = true;
            yield updateLocalSaveHeaders();
            toggleSaveSelectionView(0 /* SaveViewType.Local */ );
        } else {
            SwalLocale.fire({
                icon: 'error',
                title: getLangString('CHARACTER_SELECT_93'),
                html: `<span class='text-dark'>${getLangString('CHARACTER_SELECT_94')}</span>`,
            });
        }
    });
}

function createLocalSaveOnClick(slotID) {
    if (showModManagerPrompts())
        return;
    if (cloudManager.getPlayFabSave(slotID) === '') {
        displayGamemodeSelection(slotID);
        return;
    }
    const html = createElement('div');
    html.append(createElement('h5', {
        className: 'font-w600 font-size-sm mb-3',
        text: getLangString('MENU_TEXT_EXISTING_CLOUD_SAVE_POPUP_BODY_CREATING'),
    }), createElement('h5', {
        className: 'font-w600 text-danger mb-3 mt-3',
        text: getLangString('MENU_TEXT_WILL_OVERWRITE'),
    }), getCloudSaveSummary(slotID));
    SwalLocale.fire({
        title: templateString(getLangString('MENU_TEXT_EXISTING_CLOUD_SAVE_POPUP_TITLE'), {
            number: `${slotID + 1}`,
        }),
        html,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
        cancelButtonText: getLangString('CHARACTER_SELECT_45'),
    }).then((result) => {
        if (result.value)
            displayGamemodeSelection(slotID);
    });
}
/** Callback function. Setup the user account on first load */
function createNewSave() {
    if (createNewCharacterSlot === -1 || startingGamemode === undefined)
        throw new Error('Error new save data not set.');
    $('#start-game-btn').addClass('d-none');
    $('#spinner-begin-journey').removeClass('d-none');
    logConsole('Set Timeout: createNewSave');
    window.setTimeout(function() {
        if (startingGamemode === undefined)
            throw new Error(`Error trying to create save. No gameode selected.`);
        $('#m-page-loader').attr('class', 'show');
        let startingCharacterName = $('#username-set-main').val();
        if (startingCharacterName === '') {
            startingCharacterName = getLangString('CHARACTER_SELECT_75');
        }
        createNewCharacterInSlot(createNewCharacterSlot, startingGamemode, startingCharacterName);
    }, 1000);
}

function createLatestDeathNotification() {
    const latestHCDeath = localStorage.getItem('LatestHCDeath');
    let html = '';
    if (latestHCDeath !== undefined && latestHCDeath !== null) {
        const latestHCDeathJSON = JSON.parse(latestHCDeath);
        html += `<div class="mt-2 font-w600 font-size-sm text-center text-danger">${templateString(getLangString('MENU_TEXT_LATEST_PERMADEATH'), {
            username: latestHCDeathJSON.PlayerName,
            killedBy: latestHCDeathJSON.killedBy,
            number: `${latestHCDeathJSON.TotalSkillLevel}`,
            localDateTime: new Date(latestHCDeathJSON.timestamp).toLocaleString(),
        })}</div>`;
    }
    return html;
}

function showDiscontinuedModal(title) {
    SwalLocale.fire({
        title: title,
        html: getLangString('CHARACTER_SELECT_100'),
        icon: 'error',
    });
}

function createToggleCharacterSelectionViewBtn() {
    let disabled = '';
    if (!PlayFabClientSDK.IsClientLoggedIn())
        disabled = 'disabled';
    const html = `<div class="btn-group mt-1 mb-1 w-100" role="group" aria-label="Horizontal Primary">
					<button type="button" class="btn btn-lg btn-alt-primary mt-2 mb-2 w-100 character-selection-toggle" onclick="toggleSaveSelectionView();" ${disabled}>${getLangString(`CHARACTER_SELECT_${currentSaveView === 0 /* SaveViewType.Local */ ? '33' : '34'}`)}</button>
					<button type="button" class="btn btn-lg btn-alt-info mt-2 mb-2 w-100" id="character-selection-toggle-refresh"${currentSaveView === 0 /* SaveViewType.Local */ || !PlayFabClientSDK.IsClientLoggedIn() ? ' disabled' : ''} style="max-width:15%;" onclick="refreshCloudSavesOnClick();">
						<i class="si si-refresh"></i>
					</button>
				</div>`;
    return html;
}

function createSaveInfoBox() {
    const html = `<div class="alert bg-dark border border-danger d-flex align-items-center w-100 text-danger mb-2 p-2" role="alert" >
	            <div class="flex-00-auto">
	              <i class="fa fa-fw fa-info-circle"></i>
	            </div>
	            <div class="flex-fill ml-2">
	              <p class="mb-0" id="agility-pillar-cost-info">This is the <span class="font-w700">Test Environment</span>. Local & Cloud saves are <span class="font-w700">NOT</span> shared with the Live game.</p>
	            </div>
	          </div>
            <div class="alert bg-dark border border-danger d-flex align-items-center w-100 text-danger mb-0 p-2 d-none" role="alert" >
	            <div class="flex-00-auto">
	              <i class="fa fa-fw fa-info-circle"></i>
	            </div>
	            <div class="flex-fill ml-2">
	              <p class="mb-0" id="agility-pillar-cost-info"><span class="font-w700">DO NOT</span> export a Test save to the Live game until the versions match (Eg. v1.3.1).</p>
	            </div>
	          </div>`;
    return html;
}

function createDisableModsInfoBox() {
    if (setLang !== 'en')
        return '';
    const html = ` <div class="alert bg-dark border border-danger d-flex align-items-center w-100 text-danger mb-0 p-2" role="alert" >
	            <div class="flex-00-auto">
	              <i class="fa fa-fw fa-info-circle"></i>
	            </div>
	            <div class="flex-fill ml-2">
	              <p class="mb-0" id="agility-pillar-cost-info"><span class="font-w700">MAJOR UPDATE RELEASED</span>! Please <span class="font-w700">disable your mods</span> until you can confirm they are updated and working as intended.</p>
	            </div>
	          </div>`;
    return html;
}

function createCharacterSelectSettings() {
    let checked = 'checked';
    if (localStorageSettings.enableSaveOverwriteWarning == 'false')
        checked = '';
    const html = `<div class="col-12 text-center">
				<div class="custom-control custom-switch mb-2">
					<input type="checkbox" class="custom-control-input pointer-enabled" id="enableSaveOverwriteWarning" name="enableSaveOverwriteWarning" ${checked} onClick="toggleCharacteSelectWarningPopup();">
					<label class="custom-control-label pointer-enabled text-light" for="enableSaveOverwriteWarning">${getLangString('MENU_TEXT_ENABLE_OVERWRITE_SAVE_POPUP')}</label>
				</div>
			</div>`;
    return html;
}

function toggleCharacteSelectWarningPopup() {
    if (localStorageSettings.enableSaveOverwriteWarning === undefined ||
        localStorageSettings.enableSaveOverwriteWarning.includes('false')) {
        localStorageSettings.enableSaveOverwriteWarning = 'true';
        $('#enableSaveOverwriteWarning').prop('checked', true);
    } else {
        localStorageSettings.enableSaveOverwriteWarning = 'false';
        $('#enableSaveOverwriteWarning').prop('checked', false);
    }
    localStorage.setItem('enableSaveOverwriteWarning', localStorageSettings.enableSaveOverwriteWarning);
}

function setNewStartPage(page) {
    $('#character-selection-page-' + currentStartPage).attr('class', 'd-none animated fadeOutRight');
    $('#character-selection-page-' + page).attr('class', 'w-100 animated fadeInRight');
    currentStartPage = page;
    if (page !== 0 /* CharacterSelectPage.SelectCharacter */ ) {
        $('.btn-cloud-sign-in').addClass('d-none');
        $('.btn-cloud-sign-in-back').removeClass('d-none');
    } else {
        if (!cloudManager.isAuthenticated)
            $('.btn-cloud-sign-in').removeClass('d-none');
        $('.btn-cloud-sign-in-back').addClass('d-none');
    }
}
/** Checks mod manager status, and shows a prompt to the user. Returns true if the current callback function should abort early. */
function showModManagerPrompts() {
    if (mod.manager.isProcessing()) {
        mod.manager.showPromptForInProgress();
        return true;
    }
    if (mod.manager.hasChanges()) {
        mod.manager.showPromptForReload(false);
        return true;
    }
    return false;
}
/** Checks save's mod profile against the currently active mod profile. Returns true if the current callback function should abort early. */
function showModProfilePrompts(profile) {
    return __awaiter(this, void 0, void 0, function*() {
        if (!PlayFab.ClientApi.IsClientLoggedIn())
            return false;
        const activeProfile = mod.manager.activeProfile;
        const isCharacterProfileActive = profile === null ? activeProfile === null : activeProfile !== null && profile.id === activeProfile.id;
        if (isCharacterProfileActive)
            return false;
        if (!mod.manager.isLoggedIn()) {
            return yield mod.manager.showPromptForProfileButNotLoggedIn();
        }
        return yield mod.manager.showPromptForProfileMismatch(profile);
    });
}

function displayGamemodeSelection(slotID) {
    createNewCharacterSlot = slotID;
    const gamemodeDisplayContainer = document.getElementById('gamemode-selection');
    if (gamemodeDisplayContainer === null)
        throw new Error('Gamemode container does not exist.');
    gamemodeDisplayContainer.textContent = '';
    const displayGamemode = function(gamemode) {
        if (gamemode.id === `melvorD:Unset`)
            return;
        if (gamemode.startDate !== undefined && gamemode.startDate > Date.now())
            return;
        if (gamemode.endDate > 0 && Date.now() > gamemode.endDate)
            return;
        if (gamemode.requireLocalStorageKey !== undefined &&
            (localStorage.getItem(gamemode.requireLocalStorageKey) === null ||
                localStorage.getItem(gamemode.requireLocalStorageKey) === undefined))
            return;
        const gamemodeSelect = createElement('gamemode-selection');
        gamemodeSelect.setGamemode(gamemode);
        gamemodeDisplayContainer.append(gamemodeSelect);
    };
    //Show official gamemodes first
    game.gamemodes.forEach((gamemode) => {
        if (!gamemode.isEvent && gamemode.isUsingRequiredLang)
            displayGamemode(gamemode);
    });
    //then show event gamemodes
    game.gamemodes.forEach((gamemode) => {
        if (gamemode.isEvent && gamemode.isUsingRequiredLang)
            displayGamemode(gamemode);
    });
    setNewStartPage(3 /* CharacterSelectPage.SelectGamemode */ );
}
const setStartingGamemode = function(gamemode) {
    startingGamemode = gamemode;
    $('#gamemode-selection-text').html(`<img class="skill-icon-xs mr-2" src="${gamemode.media}">${gamemode.name}`);
    changePageCharacterSelection(4 /* CharacterSelectPage.SetCharacterName */ );
};
/* #region Save Slot Settings Callbacks */
/** Callback function for when the Import Save option is clicked */
function importSaveOnClick(slotID) {
    if (cloudManager.getPlayFabSave(slotID) !== '') {
        const html = createElement('div');
        html.append(getLangString('MENU_TEXT_EXISTING_CLOUD_SAVE_POPUP_BODY'), createElement('h5', {
            className: 'font-w600 text-danger mb-3 mt-3',
            text: getLangString('MENU_TEXT_WILL_OVERWRITE'),
        }), getCloudSaveSummary(slotID));
        SwalLocale.fire({
            title: templateString(getLangString('MENU_TEXT_EXISTING_CLOUD_SAVE_POPUP_TITLE'), {
                number: `${slotID + 1}`,
            }),
            html,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: getLangString('MENU_TEXT_CONFIRM'),
            cancelButtonText: getLangString('CHARACTER_SELECT_45'),
        }).then((result) => {
            if (result.value)
                showImportSaveFromStringForm(slotID);
        });
    } else
        showImportSaveFromStringForm(slotID);
}
/** Callback function for when the Create Sharable Save URL option is clicked */
function createSaveShareLink(characterID) {
    return __awaiter(this, void 0, void 0, function*() {
        SwalLocale.fire({
            title: getLangString('MENU_TEXT_SAVE_LINK'),
            html: `<div id="saveLink" class="font-size-sm text-info" style="-webkit-user-select: all!important;
    -moz-user-select: -moz-all!important;
    -ms-user-select: all!important;
    user-select: all!important;"><span class="spinner-border text-info skill-icon-xs"></span></div>`,
            showCancelButton: false,
        });
        const save = yield getLocalSaveString(true, characterID);
        $.ajax({
            url: 'cloud/shareSave.php',
            type: 'POST',
            async: true,
            data: {
                shareSave: save,
            },
        }).done(function(d) {
            $('#saveLink').html(`${d}<i class="fa fa-copy ml-3 pointer-enabled" id="copy-icon" onClick="copyToClipboard('${d}')"></i>`);
        });
    });
}
/** Callback function for when the Download Save option is clicked */
function openDownloadSave(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        const downloadSuccessful = yield downloadSave(false, slotID);
        if (downloadSuccessful) {
            SwalLocale.fire({
                icon: 'success',
                title: getLangString('CHARACTER_SELECT_73'),
                html: `<span class='text-dark'>${getLangString('CHARACTER_SELECT_95')}</span>`,
            });
        } else {
            SwalLocale.fire({
                icon: 'error',
                title: getLangString('CHARACTER_SELECT_93'),
                html: `<span class='text-dark'>${getLangString('CHARACTER_SELECT_96')}</span>`,
            });
        }
    });
}
/** Callback function for when the Export Save option is clicked */
function openExportSave(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        const saveString = yield getLocalSaveString(true, slotID);
        SwalLocale.fire({
            title: getLangString('CHARACTER_SELECT_37'),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm mb-1">${getLangString('CHARACTER_SELECT_40')}</h5>
				<h5 class="font-w600 text-danger font-size-sm">${getLangString('CHARACTER_SELECT_41')}</h5>
					<div class="form-group">
						<textarea class="form-control" id="export-save-character-selection" name="export-save-character-selection" rows="8" onclick="this.select();">${saveString}</textarea>
					</div>`,
            showCancelButton: false,
        });
    });
}
/** Callback function for when the Delete Local save option is clicked */
function confirmLocalSaveDeletion(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        const userResponse = yield SwalLocale.fire({
            title: getLangString('CHARACTER_SELECT_39'),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm">${''}</h5>
    <h5 class="font-w600 text-danger font-size-sm">${getLangString('CHARACTER_SELECT_46')}</h5>`,
            showCancelButton: true,
            confirmButtonText: getLangString('CHARACTER_SELECT_47'),
        });
        if (!userResponse.value)
            return;
        deleteLocalSaveInSlot(slotID);
        yield updateLocalSaveHeaders();
        toggleSaveSelectionView(currentSaveView);
        dataDeleted = false;
        SwalLocale.fire({
            icon: 'success',
            title: getLangString('CHARACTER_SELECT_73'),
            html: `<span class="text-dark">${getLangString('CHARACTER_SELECT_72')}</span>`,
        });
    });
}
/** Callback function for when the Delete Cloud save option is clicked. */
function confirmCloudSaveDeletion(slotID) {
    return __awaiter(this, void 0, void 0, function*() {
        const userResponse = yield SwalLocale.fire({
            title: getLangString('CHARACTER_SELECT_39'),
            html: `<h5 class="font-w600 text-danger font-size-sm">${getLangString('CHARACTER_SELECT_46')}</h5>`,
            showCancelButton: true,
            confirmButtonText: getLangString('CHARACTER_SELECT_47'),
        });
        if (!userResponse.value)
            return;
        cloudManager.deletePlayFabSave(slotID);
    });
}
/* #endregion */
//# sourceMappingURL=characterSelect.js.map
checkFileVersion('?12097')