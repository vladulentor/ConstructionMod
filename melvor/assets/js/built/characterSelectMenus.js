"use strict";
class CharacterDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('character-display-template'));
        this.selectCharacterButton = getElementFromFragment(this._content, 'select-character-button', 'button');
        this.gamemodeBackground = getElementFromFragment(this._content, 'gamemode-background', 'div');
        this.gamemodeIcon = getElementFromFragment(this._content, 'gamemode-icon', 'img');
        //this.testServerNotice = getElementFromFragment(this._content, 'test-server-notice', 'h5');
        this.saveType = getElementFromFragment(this._content, 'save-type', 'h5');
        this.characterName = getElementFromFragment(this._content, 'character-name', 'h5');
        this.totalSkillLevel = getElementFromFragment(this._content, 'total-skill-level', 'span');
        this.gpAmount = getElementFromFragment(this._content, 'gp-amount', 'span');
        this.offlineActionImage = getElementFromFragment(this._content, 'offline-action-image', 'img');
        this.offlineActionName = getElementFromFragment(this._content, 'offline-action-name', 'span');
        this.offlineActionTime = getElementFromFragment(this._content, 'offline-action-time', 'span');
        this.saveTimestamp = getElementFromFragment(this._content, 'save-timestamp', 'span');
        this.timestampComparison = getElementFromFragment(this._content, 'cloud-comparison', 'h5');
        this.modProfileContainer = getElementFromFragment(this._content, 'mod-profile-container', 'h5');
        this.modProfileIcon = getElementFromFragment(this._content, 'mod-profile-icon', 'i');
        this.modProfileName = getElementFromFragment(this._content, 'mod-profile-name', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    toggleTestWarning(isTest) {
        //if (isTest) showElement(this.testServerNotice);
        //else hideElement(this.testServerNotice);
    }
    setLocalSave(slotID, localInfo, cloudInfo, disableCallbacks = false) {
        this.setCharacter(slotID, localInfo, false, disableCallbacks);
        this.updateTimestampComparison(localInfo, cloudInfo);
    }
    setCloudSave(slotID, cloudInfo, localInfo, disableCallbacks = false) {
        this.setCharacter(slotID, cloudInfo, true, disableCallbacks);
        this.updateTimestampComparison(cloudInfo, localInfo);
    }
    setDisabled() {
        this.disableCallbacks();
        this.selectCharacterButton.disabled = true;
    }
    disableCallbacks() {
        this.selectCharacterButton.onclick = null;
        this.selectCharacterButton.onmouseover = null;
        this.selectCharacterButton.onmouseout = null;
    }
    setCharacter(slotID, headerInfo, isCloud, disableCallbacks = false) {
        const currentTime = Date.now();
        const gamemode = headerInfo.currentGamemode;
        const discontinued = gamemode.endDate !== 0 && currentTime >= gamemode.endDate;
        this.selectCharacterButton.className = `btn btn-lg ${gamemode.btnClass}`;
        this.gamemodeBackground.style.backgroundImage = `url('${gamemode.media}')`;
        this.gamemodeIcon.src = gamemode.media;
        if (gamemode instanceof DummyGamemode) {
            this.selectCharacterButton.disabled = true;
            disableCallbacks = true;
        } else {
            this.selectCharacterButton.disabled = false;
        }
        this.saveType.textContent = isCloud ? getLangString('CHARACTER_SELECT_32') : getLangString('CHARACTER_SELECT_31');
        isCloud ? this.saveType.classList.add('text-success') : this.saveType.classList.add('text-warning');
        if (gamemode.endDate !== 0) {
            if (currentTime >= gamemode.endDate) {
                this.saveType.append(' ', getLangString('CHARACTER_SELECT_DISCONTINUED'));
            } else {
                const modeTimeRemaining = gamemode.endDate - currentTime;
                this.saveType.append(createElement('br'), createElement('span', {
                    className: 'font-w400 font-size-sm text-white',
                    text: templateLangString('CHARACTER_SELECT_GAMEMODE_ENDS_IN', {
                        timePeriod: formatAsShorthandTimePeriod(modeTimeRemaining),
                    }),
                }));
            }
        }
        if (disableCallbacks) {
            this.disableCallbacks();
        } else {
            if (discontinued) {
                this.selectCharacterButton.onclick = () => showDiscontinuedModal(gamemode.name);
            } else if (isCloud) {
                this.selectCharacterButton.onclick = () => loadCloudSaveOnClick(slotID);
            } else {
                this.selectCharacterButton.onclick = () => loadLocalSaveOnClick(slotID);
            }
            this.selectCharacterButton.onmouseover = () => {
                this.selectCharacterButton.classList.add('opacity-40');
            };
            this.selectCharacterButton.onmouseout = () => {
                this.selectCharacterButton.classList.remove('opacity-40');
            };
        }
        if (headerInfo.characterName.length >= 15) {
            this.characterName.classList.replace('font-size-lg', 'font-size-md');
        } else {
            this.characterName.classList.replace('font-size-md', 'font-size-lg');
        }
        this.characterName.textContent = headerInfo.characterName;
        this.totalSkillLevel.textContent = templateLangString('CHARACTER_SELECT_71', {
            level: numberWithCommas(headerInfo.totalSkillLevel, true),
        });
        this.saveTimestamp.textContent = `${new Date(headerInfo.saveTimestamp).toLocaleString()} ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
        const gpToShow = headerInfo.gp >= 100000000 ? formatNumber(headerInfo.gp) : numberWithCommas(headerInfo.gp, true);
        this.gpAmount.textContent = templateLangString('MENU_TEXT_GP_AMOUNT', {
            gp: gpToShow,
        });
        if (headerInfo.offlineAction !== undefined) {
            this.offlineActionImage.src = headerInfo.offlineAction.media;
            showElement(this.offlineActionImage);
            this.offlineActionName.textContent = headerInfo.offlineAction.name;
            this.offlineActionName.classList.remove('text-danger');
            const timeAwayMs = currentTime - headerInfo.tickTimestamp;
            if (setLang === 'en') {
                const timeAwayHours = timeAwayMs / 1000 / 60 / 60;
                this.offlineActionTime.textContent = `since ${timeAwayHours < 1 ? `${Math.floor(timeAwayHours * 60)} minutes` : `${Math.floor(timeAwayHours)} hours`} ago`;
            } else {
                this.offlineActionTime.textContent = formatAsTimePeriod(timeAwayMs);
            }
            showElement(this.offlineActionTime);
        } else {
            hideElement(this.offlineActionImage);
            this.offlineActionName.textContent = getLangString('CHARACTER_SELECT_29');
            this.offlineActionName.classList.add('text-danger');
            hideElement(this.offlineActionTime);
        }
        this.modProfileContainer.classList.toggle('d-none', headerInfo.saveVersion < 83 || !cloudManager.hasFullVersionEntitlement);
        this.modProfileContainer.classList.toggle('d-flex', headerInfo.saveVersion >= 83 && cloudManager.hasFullVersionEntitlement);
        if (headerInfo.saveVersion >= 83 && cloudManager.hasFullVersionEntitlement) {
            const activeProfile = mod.manager.activeProfile;
            const isActiveProfile = headerInfo.modProfile === null ? activeProfile === null : headerInfo.modProfile.id === (activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.id);
            if (isActiveProfile) {
                this.modProfileContainer.classList.remove('border-danger', 'border-warning');
                this.modProfileContainer.classList.add('border-success');
                this.modProfileIcon.classList.remove('fa-user-alt-slash', 'fa-exclamation-circle', 'text-danger', 'text-warning');
                this.modProfileIcon.classList.add('fa-user-alt', 'text-success');
            } else if (headerInfo.modProfile === null || mod.manager.hasProfile(headerInfo.modProfile.id)) {
                // Not active but exists
                this.modProfileContainer.classList.remove('border-success', 'border-warning');
                this.modProfileContainer.classList.add('border-danger');
                this.modProfileIcon.classList.remove('fa-user-alt', 'fa-exclamation-circle', 'text-success', 'text-warning');
                this.modProfileIcon.classList.add('fa-user-alt-slash', 'text-danger');
            } else {
                // Missing
                this.modProfileContainer.classList.remove('border-success', 'border-danger');
                this.modProfileContainer.classList.add('border-warning');
                this.modProfileIcon.classList.remove('fa-user-alt', 'fa-user-alt-slash', 'text-success', 'text-danger');
                this.modProfileIcon.classList.add('fa-exclamation-circle', 'text-warning');
            }
            let profileName = getLangString('MOD_MANAGER_NO_MODS');
            if (headerInfo.modProfile !== null) {
                profileName = mod.manager.currentProfileName(headerInfo.modProfile.id) || headerInfo.modProfile.name;
            }
            this.modProfileName.textContent = profileName;
        }
    }
    updateTimestampComparison(viewedInfo, comparedInfo) {
        if (comparedInfo === undefined) {
            this.timestampComparison.classList.add('invisible');
        } else {
            if (viewedInfo.saveTimestamp >= comparedInfo.saveTimestamp) {
                this.timestampComparison.classList.replace('bg-danger', 'bg-success');
                this.timestampComparison.textContent = getLangString('CHARACTER_SELECT_65');
            } else {
                this.timestampComparison.classList.replace('bg-success', 'bg-danger');
                this.timestampComparison.textContent = getLangString('CHARACTER_SELECT_66');
            }
            this.timestampComparison.classList.remove('invisible');
        }
    }
}
window.customElements.define('character-display', CharacterDisplayElement);
class SaveSlotDisplayElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('save-slot-display-template'));
        this.slotTitle = getElementFromFragment(this._content, 'slot-title', 'h3');
        this.settingsButton = getElementFromFragment(this._content, 'settings-button', 'button');
        this.importSaveOption = getElementFromFragment(this._content, 'import-save-option', 'a');
        this.forceLoadOption = getElementFromFragment(this._content, 'force-load-option', 'a');
        this.settingsDivider = getElementFromFragment(this._content, 'settings-divider', 'div');
        this.createSaveLinkOption = getElementFromFragment(this._content, 'create-save-link-option', 'a');
        this.downloadSaveOption = getElementFromFragment(this._content, 'download-save-option', 'a');
        this.exportSaveOption = getElementFromFragment(this._content, 'export-save-option', 'a');
        this.deleteSettingsDivider = getElementFromFragment(this._content, 'delete-settings-divider', 'div');
        this.deleteLocalOption = getElementFromFragment(this._content, 'delete-local-option', 'a');
        this.deleteCloudOption = getElementFromFragment(this._content, 'delete-cloud-option', 'a');
        this.emptySlotContainer = getElementFromFragment(this._content, 'empty-slot-container', 'div');
        this.emptySlotButton = getElementFromFragment(this._content, 'empty-slot-button', 'button');
        this.emptySlotText = getElementFromFragment(this._content, 'empty-slot-text', 'h5');
        this.existingCloudWarning = getElementFromFragment(this._content, 'existing-cloud-warning', 'h5');
        this.saveLoadingSpinner = getElementFromFragment(this._content, 'save-loading-spinner', 'button');
        this.saveLoadingMessage = getElementFromFragment(this._content, 'save-loading-message', 'span');
        this.characterDisplay = getElementFromFragment(this._content, 'character-display', 'character-display');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSlotID(slotID) {
        this.slotTitle.textContent = templateLangString('MENU_TEXT_SAVE_SLOT_NUM', {
            number: `${slotID + 1}`
        });
        this.importSaveOption.onclick = () => importSaveOnClick(slotID);
        this.createSaveLinkOption.onclick = () => createSaveShareLink(slotID);
        this.downloadSaveOption.onclick = () => openDownloadSave(slotID);
        this.exportSaveOption.onclick = () => openExportSave(slotID);
        this.deleteLocalOption.onclick = () => confirmLocalSaveDeletion(slotID);
        this.deleteCloudOption.onclick = () => confirmCloudSaveDeletion(slotID);
    }
    showCloudSettings(forceLoad) {
        hideElement(this.importSaveOption);
        if (forceLoad) {
            showElement(this.forceLoadOption);
        } else {
            hideElement(this.forceLoadOption);
        }
        hideElement(this.settingsDivider);
        hideElement(this.createSaveLinkOption);
        hideElement(this.downloadSaveOption);
        hideElement(this.exportSaveOption);
        hideElement(this.deleteSettingsDivider);
        hideElement(this.deleteLocalOption);
        showElement(this.deleteCloudOption);
    }
    showEmptySaveSettings() {
        showElement(this.importSaveOption);
        hideElement(this.forceLoadOption);
        hideElement(this.settingsDivider);
        hideElement(this.createSaveLinkOption);
        hideElement(this.downloadSaveOption);
        hideElement(this.exportSaveOption);
        hideElement(this.deleteSettingsDivider);
        hideElement(this.deleteLocalOption);
        hideElement(this.deleteCloudOption);
    }
    showLocalSettings(forceLoad) {
        showElement(this.importSaveOption);
        if (forceLoad) {
            showElement(this.forceLoadOption);
        } else {
            hideElement(this.forceLoadOption);
        }
        showElement(this.settingsDivider);
        showElement(this.createSaveLinkOption);
        showElement(this.downloadSaveOption);
        showElement(this.exportSaveOption);
        showElement(this.deleteSettingsDivider);
        showElement(this.deleteLocalOption);
        hideElement(this.deleteCloudOption);
    }
    setEmptyOutline(type) {
        this.emptySlotButton.classList.remove('btn-outline-danger', 'btn-outline-success', 'btn-outline-warning');
        this.emptySlotButton.classList.add(`btn-outline-${type}`);
    }
    setEmptyLocal(slotID, hasCloud) {
        this.setSlotID(slotID);
        showElement(this.emptySlotContainer);
        hideElement(this.characterDisplay);
        this.emptySlotButton.disabled = false;
        this.showEmptySaveSettings();
        this.emptySlotText.textContent = getLangString('MENU_TEXT_CLICK_CREATE_CHARACTER');
        this.emptySlotButton.onclick = () => createLocalSaveOnClick(slotID);
        if (hasCloud) {
            this.setEmptyOutline('warning');
            this.existingCloudWarning.classList.replace('text-info', 'text-danger');
            this.existingCloudWarning.textContent = getLangString('MENU_TEXT_EXISTING_CLOUD_SAVE');
            showElement(this.existingCloudWarning);
        } else {
            this.setEmptyOutline('success');
            hideElement(this.existingCloudWarning);
        }
    }
    setEmptyCloud(slotID) {
        this.setSlotID(slotID);
        showElement(this.emptySlotContainer);
        hideElement(this.characterDisplay);
        this.setEmptyOutline('success');
        this.emptySlotButton.disabled = true;
        this.emptySlotButton.onclick = null;
        this.showCloudSettings(false);
        this.emptySlotText.textContent = templateLangString('MENU_TEXT_CLOUD_SAVE_SLOT_EMPTY', {
            number: `${slotID + 1}`,
        });
        this.existingCloudWarning.classList.replace('text-danger', 'text-info');
        this.existingCloudWarning.textContent = getLangString('MENU_TEXT_CREATE_LOCAL_SAVE');
        showElement(this.existingCloudWarning);
    }
    setError(slotID, message, isCloud) {
        this.setSlotID(slotID);
        showElement(this.emptySlotContainer);
        hideElement(this.characterDisplay);
        hideElement(this.saveLoadingSpinner);
        showElement(this.emptySlotButton);
        this.setEmptyOutline('danger');
        this.emptySlotButton.disabled = true;
        this.emptySlotButton.onclick = null;
        if (isCloud) {
            this.showCloudSettings(false);
        } else {
            this.showLocalSettings(false);
        }
        this.emptySlotText.textContent = message;
        hideElement(this.existingCloudWarning);
    }
    setCloudSave(slotID, cloudInfo, localInfo) {
        this.setSlotID(slotID);
        hideElement(this.emptySlotContainer);
        showElement(this.characterDisplay);
        const showForceLoad = checkSaveExpansions(cloudInfo) !== undefined;
        this.showCloudSettings(showForceLoad);
        if (showForceLoad)
            this.forceLoadOption.onclick = () => forceLoadSaveOnClick(slotID, true);
        else
            this.forceLoadOption.onclick = null;
        this.characterDisplay.setCloudSave(slotID, cloudInfo, localInfo, false);
    }
    setLocalSave(slotID, localInfo, cloudInfo) {
        this.setSlotID(slotID);
        hideElement(this.emptySlotContainer);
        showElement(this.characterDisplay);
        const showForceLoad = checkSaveExpansions(localInfo) !== undefined;
        this.showLocalSettings(showForceLoad);
        if (showForceLoad)
            this.forceLoadOption.onclick = () => forceLoadSaveOnClick(slotID, false);
        else
            this.forceLoadOption.onclick = null;
        this.characterDisplay.setLocalSave(slotID, localInfo, cloudInfo, false);
    }
    setSaveLoading() {
        showElement(this.emptySlotContainer);
        hideElement(this.characterDisplay);
        hideElement(this.emptySlotButton);
        showElement(this.saveLoadingSpinner);
        this.setDisabled();
    }
    setDisabled() {
        this.emptySlotButton.disabled = true;
        this.settingsButton.disabled = true;
        this.characterDisplay.setDisabled();
    }
    setLoadingMessage(message) {
        this.saveLoadingMessage.textContent = message;
    }
}
window.customElements.define('save-slot-display', SaveSlotDisplayElement);
class GamemodeSelectionElement extends HTMLElement {
    constructor() {
        super();
        this.rules = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('gamemode-selection-template'));
        this.selectButton = getElementFromFragment(this._content, 'select-button', 'button');
        this.backgroundDiv = getElementFromFragment(this._content, 'background-div', 'div');
        this.eventNotice = getElementFromFragment(this._content, 'event-notice', 'span');
        this.timeRemaining = getElementFromFragment(this._content, 'time-remaining', 'span');
        this.name = getElementFromFragment(this._content, 'name', 'h5');
        this.safety = getElementFromFragment(this._content, 'safety', 'h5');
        this.activeNotice = getElementFromFragment(this._content, 'active-notice', 'h5');
        this.description = getElementFromFragment(this._content, 'description', 'h5');
        this.rulesContainer = getElementFromFragment(this._content, 'rules-container', 'ul');
        this.selectButton.onmouseover = () => {
            this.backgroundDiv.classList.add('opacity-40');
        };
        this.selectButton.onmouseout = () => {
            this.backgroundDiv.classList.remove('opacity-40');
        };
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setGamemode(gamemode) {
        this.selectButton.className = `btn btn-lg ${gamemode.btnClass}`;
        this.backgroundDiv.style.backgroundImage = `url('${gamemode.media}')`;
        if (gamemode.isEvent) {
            showElement(this.eventNotice);
        } else {
            hideElement(this.eventNotice);
        }
        if (gamemode.endDate > 0) {
            showElement(this.timeRemaining);
            const timeLeft = gamemode.endDate - Date.now();
            this.timeRemaining.textContent = templateLangString('CHARACTER_SELECT_GAMEMODE_ENDS_IN', {
                timePeriod: formatAsShorthandTimePeriod(timeLeft),
            });
        } else {
            hideElement(this.timeRemaining);
        }
        this.name.className = `font-w600 mb-1 pt-2 font-size-lg ${gamemode.textClass}`;
        this.name.textContent = gamemode.name;
        if (gamemode.isPermaDeath) {
            this.safety.classList.replace('bg-combat-menu-selected', 'bg-danger');
            this.safety.textContent = getLangString('GAMEMODES_GAMEMODE_MISC_1');
        } else {
            this.safety.classList.replace('bg-danger', 'bg-combat-menu-selected');
            this.safety.textContent = getLangString('GAMEMODES_GAMEMODE_MISC_0');
        }
        if (gamemode.hasActiveGameplay) {
            showElement(this.activeNotice);
        } else {
            hideElement(this.activeNotice);
        }
        this.description.textContent = gamemode.description;
        this.rules.forEach((rule) => {
            rule.remove();
        });
        this.rules = [];
        gamemode.rules.forEach((ruleDescription) => {
            const rule = createElement('li', {
                className: 'font-w400 font-size-sm mb-0 text-white',
                text: `${ruleDescription}`,
            });
            this.rulesContainer.append(rule);
            this.rules.push(rule);
        });
        this.selectButton.onclick = () => setStartingGamemode(gamemode);
    }
}
window.customElements.define('gamemode-selection', GamemodeSelectionElement);
//# sourceMappingURL=characterSelectMenus.js.map
checkFileVersion('?12097')