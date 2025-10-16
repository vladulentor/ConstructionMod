"use strict";
class Minibar {
    constructor(game) {
        this.game = game;
        this.pets = [];
        this.upgrades = [];
        this.customItems = new Map();
        this.renderQueue = {
            quickEquipIcons: false,
        };
        this.quickEquipIcons = new Map();
        this.minibar = [];
        this.toggleDeleteItems = false;
        //Add default minibar elements
        this.masteryUnlocks = this.createMinibarItem('minibar-mastery', assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */ ), `<div class="text-center"><small>${getLangString('MISC_STRING_MINIBAR_3')}</small></div>`, {});
        this.milestones = this.createMinibarItem('minibar-milestones', assets.getURI("assets/media/main/milestones_header.png" /* Assets.SkillMilestones */ ), `<div class="text-center"><small>${getLangString('MISC_STRING_MINIBAR_2')}</small></div>`, {});
        this.summoning = this.createMinibarItem('minibar-summoning', assets.getURI("assets/media/skills/summoning/summoning.png" /* Assets.Summoning */ ), `<div class="text-center"><small>${getLangString('COMBAT_MISC_MENU_4')}</small></div>`, {
            onClick: () => openSynergiesBreakdown(),
        });
        this.quickEquip = this.createMinibarItem('minibar-quick-equip', assets.getURI('assets/media/main/settings_header.png'), '', {
            onClick: () => displayQuickItemEquip(),
        });
        this.ancientRelics = this.createMinibarItem('minibar-ancient-relics', assets.getURI('assets/media/main/gamemode_ancient_relic.png'), `<div class="text-center"><small>${getLangString('MENU_TEXT_VIEW_ANCIENT_RELICS')}</small></div>`, {});
    }
    get minibarElement() {
        return document.getElementById('skill-footer-minibar');
    }
    get quickEquipContainer() {
        const container = document.getElementById('minibar-skill-item-container');
        if (container === null)
            throw new Error(`UI is not loaded yet.`);
        return container;
    }
    /** Appends the minibar items to the DOM */
    initialize() {
        const minibarElement = this.minibarElement;
        minibarElement.prepend(this.ancientRelics.element);
        minibarElement.prepend(this.masteryUnlocks.element);
        minibarElement.prepend(this.milestones.element);
        minibarElement.prepend(this.summoning.element);
        minibarElement.prepend(this.quickEquip.element);
        Sortable.create(document.getElementById('minibar-skill-item-container'), {
            group: 'minibar',
            delay: 200,
            delayOnTouchOnly: getSortableDelayOnTouch(),
            onEnd: (evt) => {
                const {
                    newIndex,
                    oldIndex
                } = evt;
                if (newIndex === undefined || oldIndex === undefined)
                    return;
                this.changeItemOrder(newIndex, oldIndex);
            },
            onMove: function() {
                tippy.hideAll();
            },
            onChoose: function(evt) {
                tippy.hideAll();
            },
        });
    }
    render() {
        if (this.renderQueue.quickEquipIcons) {
            if (this.activeSkill !== undefined) {
                const skill = this.activeSkill;
                const quickEquipItems = this.getCustomItemsForSkill(skill);
                quickEquipItems.forEach((item) => {
                    if (!this.quickEquipIcons.has(item))
                        this.createQuickEquipIcon(item, skill);
                });
            }
            this.renderQueue.quickEquipIcons = false;
        }
    }
    encode(writer) {
        writer.writeMap(this.customItems, writeNamespaced, (items, writer) => {
            writer.writeArray(items, writeNamespaced);
        });
        return writer;
    }
    decode(reader, version) {
        this.customItems = reader.getMap(readNamespacedReject(this.game.skills), (reader) => {
            return reader.getArray(readNamespacedReject(this.game.items.equipment));
        });
    }
    convertFromOldformat(save, idMap) {
        if (save.customMinibarItems !== undefined) {
            Object.entries(save.customMinibarItems).forEach(([skillID, itemIDs]) => {
                const skill = this.game.skills.getObjectByID(idMap.skills[parseInt(skillID)]);
                if (skill === undefined)
                    throw new Error(`Error converting save. Skill is unregistered.`);
                const items = [];
                itemIDs.forEach((itemID) => {
                    const item = this.game.items.equipment.getObjectByID(idMap.items[itemID]);
                    if (item !== undefined && this.game.stats.itemFindCount(item) > 0)
                        items.push(item);
                });
                this.customItems.set(skill, items);
            });
        }
    }
    getCustomItemsForSkill(skill) {
        let customItems = this.customItems.get(skill);
        if (customItems === undefined)
            customItems = this.setCustomItemsToDefault(skill);
        return customItems;
    }
    setCustomItemsToDefault(skill) {
        const defaultItems = [];
        skill.minibarOptions.defaultItems.forEach((item) => {
            if (this.game.stats.itemFindCount(item) > 0)
                defaultItems.push(item);
        });
        this.customItems.set(skill, defaultItems);
        return defaultItems;
    }
    /** Adds an item to a skills custom items */
    addItemOnDiscovery(item) {
        this.game.skills.forEach((skill) => {
            if (skill.minibarOptions.defaultItems.has(item)) {
                const customItems = this.customItems.get(skill);
                if (customItems !== undefined) {
                    customItems.push(item);
                } else {
                    this.setCustomItemsToDefault(skill);
                }
                if (skill === this.activeSkill)
                    this.renderQueue.quickEquipIcons = true;
            }
        });
    }
    /** Toggles a custom quick-equip item for the given skill. Returns true if the item was added. */
    toggleCustomItem(skill, item) {
        const customItems = this.getCustomItemsForSkill(skill);
        const itemIndex = customItems.findIndex((customItem) => customItem === item);
        if (itemIndex === -1) {
            customItems.push(item);
            return true;
        } else {
            customItems.splice(itemIndex, 1);
            return false;
        }
    }
    /** Returns if the skill has the given item in the minibar selection */
    isCustomItemSet(skill, item) {
        return this.getCustomItemsForSkill(skill).includes(item);
    }
    setSkill(skill) {
        if (skill === undefined || !this.game.settings.showSkillingMinibar) {
            this.destroyQuickEquipIcons();
            $('#skill-footer-minibar-container').addClass('d-none');
            return;
        }
        // Reset the pets and upgrades
        this.pets.forEach((petItem) => this.removeItem(petItem));
        this.pets = [];
        this.upgrades.forEach((upgradeItem) => this.removeItem(upgradeItem));
        this.upgrades = [];
        // Show/Hide Elements and update callbacks
        this.milestones.element.onclick = () => {
            skill.openMilestoneModal();
            this.milestones.element.blur();
        };
        if (skill instanceof SkillWithMastery && skill.hasMastery) {
            this.masteryUnlocks.element.onclick = () => {
                skill.openMasteryLevelUnlockModal();
                this.masteryUnlocks.element.blur();
            };
            showElement(this.masteryUnlocks.element);
        } else {
            hideElement(this.masteryUnlocks.element);
        }
        // Update the quick-equip menu
        this.createQuickEquipIcons(skill);
        const minibarElement = this.minibarElement;
        // Create pet/upgrade elements
        skill.minibarOptions.pets.forEach((pet) => {
            if (this.game.petManager.isPetUnlocked(pet)) {
                const petItem = this.createPetItem(pet);
                this.pets.push(petItem);
                minibarElement.prepend(petItem.element);
            }
        });
        skill.minibarOptions.upgrades.forEach((upgrade) => {
            if (this.game.shop.isUpgradePurchased(upgrade)) {
                const upgradeItem = this.createUpgradeItem(upgrade);
                this.upgrades.push(upgradeItem);
                minibarElement.prepend(upgradeItem.element);
            }
        });
        if (this.game.currentGamemode.allowAncientRelicDrops && skill.hasAncientRelics) {
            this.ancientRelics.element.onclick = () => {
                var _a;
                ancientRelicsMenu.selectSkill(skill);
                (_a = this.ancientRelics) === null || _a === void 0 ? void 0 : _a.element.blur();
            };
            showElement(this.ancientRelics.element);
        } else {
            hideElement(this.ancientRelics.element);
        }
        this.activeSkill = skill;
        $('#skill-footer-minibar-container').removeClass('d-none');
    }
    updateEquippedTicks() {
        this.quickEquipIcons.forEach((icon, item) => {
            if (this.game.combat.player.equipment.checkForItem(item)) {
                showElement(icon.equippedTick);
            } else {
                hideElement(icon.equippedTick);
            }
        });
    }
    destroyQuickEquipIcons() {
        this.quickEquipIcons.forEach((icon) => {
            icon.tooltip.destroy();
            icon.button.remove();
        });
        this.quickEquipIcons.clear();
    }
    createQuickEquipIcons(skill) {
        this.destroyQuickEquipIcons();
        const quickEquipItems = this.getCustomItemsForSkill(skill);
        quickEquipItems.forEach((item) => this.createQuickEquipIcon(item, skill));
        const deleteButton = document.getElementById('toggle-delete-item-quick-equip');
        if (deleteButton !== null) {
            deleteButton.onclick = () => this.toggleRemoveItemsQuickEquip(skill);
        }
    }
    createQuickEquipIcon(item, skill) {
        const itemContainer = this.quickEquipContainer;
        const equippedTick = createElement('img', {
            className: `skill-icon-xxs minibar-equipped${!this.game.combat.player.equipment.checkForItem(item) ? ' d-none' : ''}`,
            attributes: [
                ['src', assets.getURI("assets/media/main/tick.png" /* Assets.Checkbox */ )]
            ],
        });
        const btnGroup = createElement('div', {
            className: 'btn-group-vertical',
            parent: itemContainer
        });
        const button = createElement('button', {
            className: 'btn btn-sm btn-outline-secondary overlay-container overlay-bottom',
            children: [createElement('img', {
                className: 'skill-icon-xs',
                attributes: [
                    ['src', item.media]
                ]
            }), equippedTick],
            parent: btnGroup,
        });
        const deleteButton = createElement('button', {
            className: `btn btn-xs btn-outline-danger p-0${this.toggleDeleteItems ? '' : ' d-none'}`,
            children: [createElement('i', {
                className: 'fas fa-trash'
            })],
            parent: btnGroup,
        });
        button.onclick = () => {
            this.game.combat.player.quickEquipItem(item, skill);
            button.blur();
        };
        deleteButton.onclick = () => {
            this.removeItemFromQuickEquip(skill, item);
        };
        let itemDescription = '';
        if (item.hasDescription)
            itemDescription = item.modifiedDescription;
        const tooltip = tippy(button, {
            content: `<div class="text-center"><span class="text-warning">${item.name}</span><br><small>${itemDescription}<br><span class="text-info">${getLangString('MISC_STRING_MINIBAR_0')}</span><br><span class="text-danger">${getLangString('MISC_STRING_MINIBAR_1')}</span></small></div>`,
            placement: 'left',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
        this.quickEquipIcons.set(item, {
            button: btnGroup,
            tooltip,
            equippedTick
        });
    }
    removeItemFromQuickEquip(skill, item) {
        this.toggleCustomItem(skill, item);
        this.createQuickEquipIcons(skill);
    }
    toggleRemoveItemsQuickEquip(skill) {
        this.toggleDeleteItems = !this.toggleDeleteItems;
        this.createQuickEquipIcons(skill);
    }
    createPetItem(pet) {
        return this.createMinibarItem(`minibar-pet-${pet.id}`, pet.media, '<div class="text-center"><small class="text-success">' +
            getLangString('MENU_TEXT_ACTIVE') +
            '</small><br><span class="text-warning">' +
            pet.name +
            '</span><br><small>' +
            pet.description +
            '</small></div>', {
                onClick: () => this.game.petManager.petPet(pet),
            });
    }
    createUpgradeItem(upgrade) {
        return this.createMinibarItem(`minibar-upgrade-${upgrade.id}`, upgrade.media, `<div class="text-center"><small class="text-success">${getLangString('MENU_TEXT_ACTIVE')}</small><br><span class="text-warning">${upgrade.name}</span><small><br>${upgrade.description}</small></div>`, {});
    }
    createMinibarItem(elementID, media, tooltipContent, options) {
        const element = createElement('button', {
            id: elementID,
            className: 'btn btn-sm btn-light'
        });
        element.innerHTML = `<img class="skill-icon-xs m-0" src="${media}">`;
        this.applyOptionsToElement(element, options);
        const item = {
            element,
        };
        if (tooltipContent !== '') {
            item.tooltip = this.createElementTooltip(element, tooltipContent);
        }
        return item;
    }
    applyOptionsToElement(element, options) {
        if (options.onClick !== undefined) {
            element.onclick = options.onClick;
        }
        if (options.hideOnCreate)
            element.classList.add('d-none');
    }
    createElementTooltip(element, tooltipContent) {
        tooltipContent = `<div style="max-width:70vw!important">${tooltipContent}</div>`;
        return tippy(element, {
            content: tooltipContent,
            placement: 'left',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
    }
    removeItem(item) {
        if (item.tooltip !== undefined)
            item.tooltip.destroy();
        item.element.remove();
    }
    changeItemOrder(newIndex, oldIndex) {
        if (this.activeSkill === undefined)
            return;
        const customItems = this.getCustomItemsForSkill(this.activeSkill);
        customItems.splice(newIndex, 0, ...customItems.splice(oldIndex, 1));
        if (DEBUGENABLED) {
            console.log(`END: NEW INDEX: ${newIndex} | OLD INDEX: ${oldIndex}`);
            console.log(customItems);
        }
    }
}

function toggleSkillMinibar() {
    const minibar = $('#skill-footer-minibar');
    minibar.toggleClass('d-none');
    $('#skill-footer-minibar-icon').toggleClass('si-arrow-up');
    $('#skill-footer-minibar-icon').toggleClass('si-arrow-down');
    // Close the quick equip container if it is open
    if (minibar.hasClass('d-none')) {
        $('#skill-footer-minibar-items-container').addClass('d-none');
    }
}

function displayQuickItemEquip() {
    if (checkMediaQuery('(hover: none)'))
        $('#skill-footer-minibar-items-container').toggleClass('d-none'); // only do this for devices without hover functionality. Desktop has hover functionality
}
//# sourceMappingURL=minibar.js.map
checkFileVersion('?12097')