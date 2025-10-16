"use strict";
class CombatAreaMenu {
    constructor(container, areas) {
        this.container = container;
        this.areas = areas;
        this.menuElems = new Map();
        this.container.textContent = '';
        this.areas.forEach((area) => {
            const element = new CombatAreaMenuElement();
            element.className = 'col-12 col-md-6 col-xl-4';
            this.container.append(element);
            element.setArea(area);
            this.menuElems.set(area, element);
        });
    }
    open() {
        this.container.classList.remove('d-none');
    }
    close() {
        this.container.classList.add('d-none');
    }
    updateRewards() {
        this.menuElems.forEach((menuElem, area) => {
            menuElem.setRewards(area);
        });
    }
    updateRequirements() {
        this.menuElems.forEach((menu, area) => menu.updateRequirements(area));
    }
    updateCompletionCount(area) {
        const menu = this.menuElems.get(area);
        menu === null || menu === void 0 ? void 0 : menu.updateCompletionCount(area);
    }
    updatePetStatus(area) {
        const menu = this.menuElems.get(area);
        menu === null || menu === void 0 ? void 0 : menu.updatePetStatus(area);
    }
    updateEvent(activeAreas) {
        this.menuElems.forEach((menu, area) => {
            menu.updateEvent(activeAreas.has(area));
        });
    }
    updateAreaEffectValues() {
        this.menuElems.forEach((menu, area) => menu.updateAreaEffect(area));
    }
    updateAreaSkillUnlock() {
        this.menuElems.forEach((menu, area) => menu.updateAreaSkillUnlock(area));
    }
    removeEvent() {
        this.menuElems.forEach((menu) => menu.removeEvent());
    }
    setTutorialHighlight(area) {
        const areaMenu = this.menuElems.get(area);
        if (areaMenu === undefined)
            throw new Error('Tried to set tutorial highlight for invalid area.');
        this.removeTutorialHighlight();
        this.highlightedArea = areaMenu;
        areaMenu.classList.add('glow-success');
    }
    removeTutorialHighlight() {
        if (this.highlightedArea !== undefined) {
            this.highlightedArea.classList.remove('glow-success');
        }
        this.highlightedArea = undefined;
    }
    updateAreaBackgroundColours() {
        this.menuElems.forEach((menu, area) => menu.toggleBackgroundColour(area));
    }
    updateAreaWarnings() {
        this.menuElems.forEach((menu, area) => menu.toggleAreaWarnings(area));
    }
    updateMonsterValues() {
        this.menuElems.forEach((menu, area) => {
            menu.updateOpenOptions(area);
        });
    }
}
class CombatAreaMenuElement extends HTMLElement {
    constructor() {
        super();
        this.requirements = [];
        this.isEventActive = false;
        this.isOpen = false;
        this.monsterSelectElements = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('combat-area-menu-template'));
        this.openButton = getElementFromFragment(this._content, 'open-button', 'div');
        this.image = getElementFromFragment(this._content, 'image', 'img');
        this.lockedContainer = getElementFromFragment(this._content, 'locked-container', 'div');
        this.unlockedContainer = getElementFromFragment(this._content, 'unlocked-container', 'div');
        this.unlockText = getElementFromFragment(this._content, 'unlock-text', 'div');
        this.tutorialHere = getElementFromFragment(this._content, 'tutorial-here', 'span');
        this.areaName = getElementFromFragment(this._content, 'area-name', 'span');
        this.minDifficultyBadge = getElementFromFragment(this._content, 'min-difficulty-badge', 'span');
        this.difficultyDash = getElementFromFragment(this._content, 'difficulty-dash', 'span');
        this.maxDifficultyBadge = getElementFromFragment(this._content, 'max-difficulty-badge', 'span');
        this.barrierNotification = getElementFromFragment(this._content, 'barrier-notification', 'div');
        this.combatTriangleNotification = getElementFromFragment(this._content, 'combat-triangle-notification', 'div');
        this.damageTypeNotification = getElementFromFragment(this._content, 'damage-type-notification', 'div');
        this.entryRequirementsTitle = getElementFromFragment(this._content, 'entry-requirements-title', 'div');
        this.entryRequirements = getElementFromFragment(this._content, 'entry-requirements', 'ul');
        this.areaEffectContainer = getElementFromFragment(this._content, 'area-effect-container', 'div');
        this.effectDescription = getElementFromFragment(this._content, 'effect-description', 'span');
        this.monsterCount = getElementFromFragment(this._content, 'monster-count', 'div');
        this.monsterLevel = getElementFromFragment(this._content, 'monster-level', 'div');
        this.rewards = getElementFromFragment(this._content, 'rewards', 'div');
        this.openOptions = getElementFromFragment(this._content, 'open-options', 'div');
        this.eventButtonCont = getElementFromFragment(this._content, 'event-button-cont', 'div');
        this.eventButton = getElementFromFragment(this._content, 'event-button', 'button');
        this.skillUnlock = getElementFromFragment(this._content, 'skill-unlock', 'div');
        this.wikiLink = getElementFromFragment(this._content, 'wiki-link', 'a');
        this.titleAoD = getElementFromFragment(this._content, 'title-aod', 'img');
        this.titleTotH = getElementFromFragment(this._content, 'title-toth', 'img');
        this.viewCombatTriangleAnchor = getElementFromFragment(this._content, 'view-combat-triangle', 'a');
        this.completeCount = getElementFromFragment(this._content, 'complete-count', 'div');
        this.petLocated = getElementFromFragment(this._content, 'pet-located', 'div');
        this.areaInfoDivider = getElementFromFragment(this._content, 'area-info-divider', 'div');
        this.viewMonsterListCont = getElementFromFragment(this._content, 'view-monster-list-cont', 'a');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setArea(area) {
        this.openButton.onclick = () => this.toggleOptions(area);
        this.image.src = area.media;
        this.image.id = `area-menu-img-${area.id}`;
        this.tutorialHere.id = `tutorial-${area.id}`;
        this.areaName.textContent = area.name;
        this.setDifficultyBadge(this.minDifficultyBadge, area.difficulty[0]);
        if (area.difficulty.length > 1) {
            showElement(this.difficultyDash);
            showElement(this.maxDifficultyBadge);
            this.setDifficultyBadge(this.maxDifficultyBadge, area.difficulty[1]);
        } else {
            hideElement(this.difficultyDash);
            hideElement(this.maxDifficultyBadge);
        }
        this.setRequirements(area);
        this.setOpenOptions(area);
        this.setEventStartButton(area);
        this.setAreaEffect(area);
        let infoCount = 0;
        let hasPet = false;
        if (area instanceof Dungeon) {
            this.setDungeonInfo(area);
            showElement(this.completeCount);
            showElement(this.viewMonsterListCont);
            hasPet = area.pet !== undefined;
            infoCount++;
        } else if (area instanceof Stronghold) {
            this.setStrongholdInfo(area);
            showElement(this.completeCount);
            showElement(this.viewMonsterListCont);
            hasPet = area.pet !== undefined;
            infoCount++;
        } else {
            hideElement(this.monsterCount);
            hideElement(this.monsterLevel);
            hideElement(this.rewards);
            hideElement(this.completeCount);
            hideElement(this.viewMonsterListCont);
        }
        if (area instanceof SlayerArea) {
            hasPet = area.pet !== undefined;
        }
        if (hasPet) {
            showElement(this.petLocated);
            infoCount++;
        } else {
            hideElement(this.petLocated);
        }
        infoCount > 0 ? showElement(this.areaInfoDivider) : hideElement(this.areaInfoDivider);
        this.toggleAreaWarnings(area);
        this.wikiLink.onclick = () => openLink(`https://wiki.melvoridle.com/w/${area.wikiName}`);
        this.toggleBackgroundColour(area);
        this.viewCombatTriangleAnchor.onclick = (e) => {
            this.viewCombatTriangle(area);
            e.stopPropagation();
        };
        this.viewMonsterListCont.onclick = (e) => {
            if (area instanceof Dungeon || area instanceof Stronghold)
                this.viewMonsterList(area);
            e.stopPropagation();
        };
        if (area instanceof Dungeon || area instanceof Stronghold || area instanceof SlayerArea) {
            this.petLocated.onclick = (e) => {
                if (area.pet !== undefined && game.petManager.isPetUnlocked(area.pet.pet))
                    game.petManager.firePetUnlockModal(area.pet.pet);
                e.stopPropagation();
            };
        }
    }
    updateCompletionCount(area) {
        const timesCompleted = area instanceof Stronghold || area instanceof AbyssDepth ?
            area.timesCompleted :
            game.combat.getDungeonCompleteCount(area);
        this.completeCount.textContent = templateLangString('MENU_TEXT_VIEW_COMPLETION_COUNT', {
            value: numberWithCommas(timesCompleted),
        });
    }
    updatePetStatus(area) {
        if (area.pet === undefined)
            return;
        const havePet = game.petManager.isPetUnlocked(area.pet.pet);
        if (havePet) {
            this.petLocated.innerHTML = templateLangString('MENU_TEXT_VIEW_PET_LOCATED', {
                value: `<span class="text-success">${getLangString('YES')}</span>`,
            });
        } else {
            this.petLocated.innerHTML = templateLangString('MENU_TEXT_VIEW_PET_LOCATED', {
                value: `<span class="text-danger">${getLangString('NO')}</span>`,
            });
            if (area instanceof Stronghold && setLang === 'en') {
                this.petLocated.innerHTML += '<br><small>Pet only drops from Superior Tier</small>';
            }
        }
    }
    viewCombatTriangle(area) {
        const modal = document.getElementById('modal-combat-triangle-cont');
        const triangleTable = new CombatTriangleSetTableElement();
        triangleTable.setCombatTriangle(area);
        modal.innerHTML = '';
        modal.append(triangleTable);
        openCombatTriangleModal();
    }
    viewMonsterList(area) {
        const modal = document.getElementById('modal-view-monster-list-cont');
        const monsterListTable = new ViewMonsterListTableElement();
        monsterListTable.setArea(area);
        modal.innerHTML = '';
        modal.append(monsterListTable);
        openViewMonsterListModal();
    }
    toggleAreaWarnings(area) {
        game.settings.showCombatAreaWarnings && area.hasBarrierMonsters ?
            this.showBarrierNotification() :
            this.hideBarrierNotification();
        !area.usesStandardCombatTriangle ?
            this.showCombatTriangleNotification(area) :
            this.hideCombatTriangleNotification();
        this.showDamageTypeNotification(area);
    }
    toggleBackgroundColour(area) {
        if (game.settings.showExpansionBackgroundColours && area.namespace === "melvorAoD" /* Namespaces.AtlasOfDiscovery */ )
            this.openButton.classList.add('bg-combat-aod');
        else
            this.openButton.classList.remove('bg-combat-aod');
        if (game.settings.showExpansionBackgroundColours && area.namespace === "melvorTotH" /* Namespaces.Throne */ )
            this.openButton.classList.add('bg-combat-toth');
        else
            this.openButton.classList.remove('bg-combat-toth');
        if (game.settings.showExpansionBackgroundColours && area.namespace === "melvorItA" /* Namespaces.IntoTheAbyss */ )
            this.openButton.classList.add('bg-combat-ita');
        else
            this.openButton.classList.remove('bg-combat-ita');
    }
    setRewards(area) {
        if (!(area instanceof Dungeon)) {
            hideElement(this.rewards);
            return;
        }
        if (area.rewards.length > 0) {
            this.rewards.textContent = '';
            this.rewards.append(getLangString('COMBAT_MISC_51'));
            area.rewards.forEach((item) => {
                if (item instanceof OpenableItem) {
                    const link = createElement('a', {
                        className: 'combat-action'
                    });
                    link.onclick = () => viewItemContents(item);
                    link.append(this.createRewardImage(item.media), item.name);
                    this.rewards.append(link);
                } else {
                    this.rewards.append(this.createRewardImage(item.media), item.name);
                }
            });
            showElement(this.rewards);
        } else {
            hideElement(this.rewards);
        }
    }
    showBarrierNotification() {
        this.barrierNotification.innerHTML = `<i class="fa fa-fw fa-info-circle mr-1"></i>${templateLangString('MENU_TEXT_BARRIER_NOTIFICATION', { barrierIcon: `<img class="skill-icon-xxs" src="${assets.getURI("assets/media/skills/combat/barrier.png" /* Assets.Barrier */)}">` })}`;
        showElement(this.barrierNotification);
    }
    hideBarrierNotification() {
        this.barrierNotification.innerHTML = '';
        hideElement(this.barrierNotification);
    }
    showCombatTriangleNotification(area) {
        this.combatTriangleNotification.innerHTML = '<i class="fa fa-fw fa-info-circle mr-1"></i>';
        this.combatTriangleNotification.append(...templateLangStringWithNodes('MENU_TEXT_COMBAT_TRIANGLE_NOTIFICATION', {
            combatTriangleIcon: createImage(area.combatTriangleSet.media, 'skill-icon-xxs mr-1'),
        }, {
            combatTriangleName: area.combatTriangleSet.name,
        }));
        showElement(this.combatTriangleNotification);
    }
    showDamageTypeNotification(area) {
        if (area.overrideDamageType === undefined) {
            hideElement(this.damageTypeNotification);
            return;
        }
        showElement(this.damageTypeNotification);
        this.damageTypeNotification.innerHTML = `<i class="fa fa-fw fa-info-circle mr-1"></i>${templateLangString('MENU_TEXT_DAMAGE_TYPE_NOTIFICATION', {
            damageIcon: `<img class="skill-icon-xxs mr-1" src="${area.overrideDamageType.media}">`,
            damageType: `<span class="${area.overrideDamageType.spanClass};">${area.overrideDamageType.name}</span>`,
        })}`;
        showElement(this.combatTriangleNotification);
    }
    hideCombatTriangleNotification() {
        this.combatTriangleNotification.innerHTML = '';
        hideElement(this.combatTriangleNotification);
    }
    setDifficultyBadge(badge, difficulty) {
        const diffData = CombatAreaMenuElement.difficulty[difficulty];
        badge.classList.add(diffData.class);
        badge.textContent = diffData.name;
    }
    setRequirements(area) {
        if (area.entryRequirements.length > 0) {
            this.entryRequirements.innerHTML = '';
            this.requirements = [];
            const small = this.entryRequirements;
            const reqSpans = this.requirements;
            area.entryRequirements.forEach((requirement) => {
                var _a, _b;
                const listEl = createElement('li');
                let reqSpan;
                switch (requirement.type) {
                    case 'SkillLevel':
                        listEl.appendChild(this.createReqImage(requirement.skill.media));
                        reqSpan = this.createReqSpan(templateString(getLangString('MENU_TEXT_LEVEL'), {
                            level: ` ${requirement.level}`
                        }));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'AllSkillLevels':
                        {
                            const templateData = {
                                level: `${requirement.level}`,
                                skillNames: requirement.exceptions !== undefined ?
                                    joinAsList([...requirement.exceptions].map((skill) => skill.name)) :
                                    '',
                                modName: (_b = (_a = requirement.namespace) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '',
                            };
                            let langID = requirement.exceptions === undefined ?
                                'MENU_TEXT_REQUIRES_ALL_SKILL' :
                                'MENU_TEXT_REQUIRES_ALL_SKILL_EXCEPTION';
                            if (requirement.namespace !== undefined && !(requirement.namespace.name === "melvorTrue" /* Namespaces.True */ )) {
                                if (requirement.namespace.isModded) {
                                    langID = `${langID}_MOD`;
                                } else {
                                    langID = `${langID}_${requirement.namespace.name}`;
                                }
                            }
                            reqSpan = this.createReqSpan(' ' + templateLangString(langID, templateData));
                            reqSpans.push(reqSpan);
                            listEl.appendChild(reqSpan);
                        }
                        break;
                    case 'DungeonCompletion':
                        {
                            const dungeon = requirement.dungeon;
                            const clearsLeft = Math.max(requirement.count - game.combat.getDungeonCompleteCount(dungeon), 0);
                            listEl.appendChild(this.createReqImage(`${dungeon.media}`));
                            const templateData = {
                                dungeonName: dungeon.name,
                                count: `${clearsLeft}`,
                                dungeonImage: ``,
                            };
                            if (clearsLeft > 0 || requirement.count === 1) {
                                reqSpan = this.createReqSpan(templateLangString(`COMBAT_MISC_${requirement.count === 1 ? 'DUNGEON_CLEARED' : 'DUNGEON_CLEARED_TIMES'}`, templateData));
                            } else {
                                templateData.count = `${requirement.count}`;
                                reqSpan = this.createReqSpan(templateLangString(`MENU_TEXT_COMPLETE_DUNGEON_TIMES`, templateData));
                            }
                            reqSpans.push(reqSpan);
                            listEl.appendChild(reqSpan);
                        }
                        break;
                    case 'StrongholdCompletion':
                        {
                            const stronghold = requirement.stronghold;
                            const clearsLeft = Math.max(requirement.count - stronghold.timesCompleted, 0);
                            listEl.appendChild(this.createReqImage(`${stronghold.media}`));
                            const templateData = {
                                dungeonName: stronghold.name,
                                count: `${clearsLeft}`,
                                dungeonImage: ``,
                            };
                            if (clearsLeft > 0 || requirement.count === 1) {
                                reqSpan = this.createReqSpan(templateLangString(`COMBAT_MISC_${requirement.count === 1 ? 'DUNGEON_CLEARED' : 'DUNGEON_CLEARED_TIMES'}`, templateData));
                            } else {
                                templateData.count = `${requirement.count}`;
                                reqSpan = this.createReqSpan(templateLangString(`MENU_TEXT_COMPLETE_DUNGEON_TIMES`, templateData));
                            }
                            reqSpans.push(reqSpan);
                            listEl.appendChild(reqSpan);
                        }
                        break;
                    case 'AbyssDepthCompletion':
                        {
                            const depth = requirement.depth;
                            const clearsLeft = Math.max(requirement.count - depth.timesCompleted, 0);
                            listEl.appendChild(this.createReqImage(`${depth.media}`));
                            const templateData = {
                                depthName: depth.name,
                                count: `${clearsLeft}`,
                            };
                            reqSpan = this.createReqSpan(templateLangString(`COMBAT_MISC_${requirement.count === 1 ? 'THE_ABYSS_CLEARED' : 'THE_ABYSS_CLEARED_TIMES'}`, templateData));
                            reqSpans.push(reqSpan);
                            listEl.appendChild(reqSpan);
                        }
                        break;
                    case 'SlayerItem':
                        listEl.appendChild(this.createReqImage(requirement.item.media));
                        reqSpan = this.createReqSpan(getLangString('COMBAT_MISC_110'));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'Completion':
                        reqSpan = this.createReqSpan(templateLangString(`MENU_TEXT_${requirement.namespace.isModded
                            ? 'REQUIRES_COMPLETION_MOD'
                            : `REQUIRES_COMPLETION_${requirement.namespace.name}`}`, {
                            percent: `${requirement.percent}`,
                            modName: requirement.namespace.displayName
                        }));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'ShopPurchase':
                        {
                            const purchase = requirement.purchase;
                            listEl.appendChild(this.createReqImage(purchase.media));
                            reqSpan = this.createReqSpan(templateLangString('COMBAT_MISC_SHOP_ITEM_PURCHASED', {
                                purchaseName: purchase.name
                            }));
                            reqSpans.push(reqSpan);
                            listEl.appendChild(reqSpan);
                        }
                        break;
                    case 'SlayerTask':
                        reqSpan = this.createReqSpan(templateString(requirement.category.reqText, {
                            count: `${requirement.count}`,
                        }));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'ItemFound':
                        {
                            reqSpan = this.createReqSpan('');
                            reqSpan.append(...templateLangStringWithNodes('MENU_TEXT_FIND_ITEM', {
                                itemImage: this.createReqImage(requirement.item.media)
                            }, {
                                itemName: requirement.item.name
                            }));
                            reqSpans.push(reqSpan);
                            listEl.appendChild(reqSpan);
                        }
                        break;
                    case 'MonsterKilled':
                        {
                            reqSpan = this.createReqSpan('');
                            reqSpan.append(...templateLangStringWithNodes(`MENU_TEXT_${requirement.count > 1 ? 'DEFEAT_MONSTER_TIMES' : 'DEFEAT_MONSTER_ONCE'}`, {
                                monsterImage: this.createReqImage(requirement.monster.media)
                            }, {
                                monsterName: requirement.monster.name,
                                count: `${requirement.count}`
                            }));
                            reqSpans.push(reqSpan);
                            listEl.appendChild(reqSpan);
                        }
                        break;
                    case 'TownshipTask':
                        if (requirement.realm === game.defaultRealm && game.realms.size <= 1) {
                            reqSpan = this.createReqSpan(templateLangString('MENU_TEXT_REQUIRES_TOWNSHIP_TASKS', {
                                count: `${requirement.count}`
                            }));
                        } else {
                            reqSpan = this.createReqSpan('');
                            reqSpan.append(...templateLangStringWithNodes('MENU_TEXT_REQUIRES_TOWNSHIP_TASKS_REALM', {
                                realmIcon: createImage(requirement.realm.media, 'skill-icon-xxs mr-1'),
                            }, {
                                count: `${requirement.count}`,
                                realmName: requirement.realm.name,
                            }));
                        }
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'TownshipBuilding':
                        reqSpan = this.createReqSpan(templateLangString('MENU_TEXT_REQUIRES_TOWNSHIP_BUILDINGS', {
                            count: `${requirement.count}`,
                            buildingName: `${requirement.building.name}`,
                        }));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'CartographyHexDiscovery':
                        reqSpan = this.createReqSpan(templateLangString('REQUIRES_HEX_SURVEY', {
                            worldName: requirement.worldMap.name,
                            count: `${requirement.count}`,
                        }));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'CartographyPOIDiscovery':
                        reqSpan = this.createReqSpan(templateLangString('REQUIRES_POI_DISCOVERY', {
                            placeNames: joinAsList(requirement.pois.map((poi) => poi.name)),
                            worldName: requirement.worldMap.name,
                        }));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'AbyssalLevel':
                        listEl.appendChild(this.createReqImage(requirement.skill.media));
                        reqSpan = this.createReqSpan(templateString(getLangString('MENU_TEXT_ABYSSAL_LEVEL'), {
                            level: ` ${requirement.level}`
                        }));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                    case 'SkillTreeNodeUnlocked':
                        listEl.appendChild(this.createReqImage(requirement.skill.media));
                        reqSpan = this.createReqSpan(templateLangString('REQUIRES_SKILL_TREE_NODE_UNLOCKED', {
                            skillTree: `${requirement.skillTree.name}`,
                            node: `${requirement.node.shortName}`,
                            skillName: `${requirement.skill.name}`,
                        }));
                        reqSpans.push(reqSpan);
                        listEl.appendChild(reqSpan);
                        break;
                }
                small.appendChild(listEl);
            });
            showElement(this.entryRequirementsTitle);
            showElement(this.entryRequirements);
        } else {
            hideElement(this.entryRequirementsTitle);
            hideElement(this.entryRequirements);
        }
    }
    createReqImage(media) {
        return createElement('img', {
            className: 'skill-icon-xs mr-1',
            attributes: [
                ['src', media]
            ]
        });
    }
    createReqSpan(text) {
        return createElement('span', {
            className: 'text-danger mr-1 ml-2',
            text
        });
    }
    setOpenOptions(area) {
        if (area instanceof AbyssDepth) {
            const depthSelect = new AbyssDepthSelectElement();
            depthSelect.setDepth(area);
            this.openOptions.append(depthSelect);
        } else if (area instanceof Dungeon) {
            const dungeonSelect = new DungeonSelectElement();
            dungeonSelect.setDungeon(area);
            this.openOptions.append(dungeonSelect);
        } else if (area instanceof Stronghold) {
            const strongholdSelect = new StrongholdSelectElement();
            this.openOptions.append(strongholdSelect);
            strongholdSelect.setStronghold(area);
            this.strongholdSelect = strongholdSelect;
        } else {
            const monsterSelect = new MonsterSelectTableElement();
            monsterSelect.setArea(area);
            this.openOptions.append(monsterSelect);
            this.monsterSelectElements.set(area, monsterSelect);
        }
    }
    updateOpenOptions(area) {
        if (area instanceof CombatArea || SlayerArea) {
            const el = this.monsterSelectElements.get(area);
            area.monsters.forEach((monster) => {
                if (el !== undefined)
                    el.updateMonsterValuesAfterLoad(monster);
            });
        }
    }
    setMonsterCount(numMonsters, lastMonster) {
        this.monsterCount.textContent = `${getLangString('COMBAT_MISC_49')} ${numMonsters}`;
        this.monsterLevel.textContent = templateString(getLangString('COMBAT_MISC_108'), {
            combatLevel: `${numberWithCommas(lastMonster.combatLevel)}`,
        });
        showElement(this.monsterCount);
        showElement(this.monsterLevel);
    }
    setDungeonInfo(dungeon) {
        const numMonsters = dungeon.event !== undefined ? getLangString('MENU_TEXT_QUESTION_MARKS') : `${dungeon.monsters.length}`;
        this.setMonsterCount(numMonsters, dungeon.monsters[dungeon.monsters.length - 1]);
    }
    setStrongholdInfo(stronghold) {
        this.setMonsterCount(`${stronghold.monsters.length}`, stronghold.monsters[stronghold.monsters.length - 1]);
        hideElement(this.rewards);
    }
    createRewardImage(media) {
        return createElement('img', {
            className: 'skill-icon-xxs ml-3 mr-2',
            attributes: [
                ['src', media]
            ]
        });
    }
    setAreaEffect(area) {
        if (area instanceof SlayerArea) {
            showElement(this.areaEffectContainer);
            if (area.areaEffect === undefined) {
                this.areaEffectContainer.classList.replace('text-danger', 'text-success');
                this.effectDescription.textContent = getLangString('COMBAT_MISC_NO_AREA_EFFECT');
            } else {
                this.areaEffectContainer.classList.replace('text-success', 'text-danger');
                this.effectDescription.textContent = templateString(area.areaEffectDescription, {
                    effectValue: `${area.areaEffect.magnitude}`,
                });
            }
        } else {
            hideElement(this.areaEffectContainer);
        }
    }
    setEventStartButton(area) {
        this.eventButton.textContent = getLangString('COMBAT_MISC_109');
        if (area instanceof SlayerArea)
            this.eventButton.onclick = () => game.combat.selectEventArea(area);
    }
    toggleOptions(area) {
        if ((area instanceof Dungeon &&
                area.unlockRequirement !== undefined &&
                !game.checkRequirements(area.unlockRequirement)) ||
            (game.combat.isEventActive && !this.isEventActive)) {
            return;
        }
        let elementToToggle = this.openOptions;
        if (game.combat.isEventActive && this.isEventActive) {
            elementToToggle = this.eventButtonCont;
        }
        if (this.isOpen) {
            hideElement(elementToToggle);
        } else {
            showElement(elementToToggle);
        }
        this.isOpen = !this.isOpen;
    }
    updateRequirements(area) {
        area.isRequiredGamemode(game.currentGamemode) ? showElement(this) : hideElement(this);
        this.setRequirements(area);
        //if (area.entryRequirements.length !== this.requirements.length) this.setRequirements(area);
        const slayerLevelReq = area instanceof SlayerArea ? area.slayerLevelRequired : 0;
        area.entryRequirements.forEach((requirement, i) => {
            toggleDangerSuccess(this.requirements[i], game.checkRequirement(requirement, false, slayerLevelReq));
        });
        const unlocked = !(area instanceof Dungeon) ||
            area.unlockRequirement === undefined ||
            game.checkRequirements(area.unlockRequirement);
        if (unlocked) {
            showElement(this.unlockedContainer);
            hideElement(this.lockedContainer);
            this.image.src = area.media;
            game.settings.showWikiLinks ? showElement(this.wikiLink) : hideElement(this.wikiLink);
            showElement(this);
        } else {
            area.hideIfLocked ? hideElement(this) : showElement(this);
            this.updateUnlockMessage(area);
            showElement(this.lockedContainer);
            hideElement(this.unlockedContainer);
            this.image.src = assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ );
            hideElement(this.wikiLink);
        }
        if (area instanceof Stronghold && this.strongholdSelect !== undefined)
            this.strongholdSelect.updateRequirements(area);
    }
    updateUnlockMessage(area) {
        if (area instanceof Dungeon && area.unlockRequirement !== undefined) {
            const dungReq = area.unlockRequirement;
            let unlockMessage;
            if (area.showUnlockRequirements) {
                unlockMessage = printAllUnlockRequirementsAsHTML(dungReq).join('<br>');
            } else {
                unlockMessage = getLangString('COMBAT_MISC_111');
            }
            this.unlockText.innerHTML = unlockMessage;
        }
    }
    isDungeonUnlocked(dungeon) {
        if (dungeon.unlockRequirement !== undefined) {
            return game.checkRequirements(dungeon.unlockRequirement);
        } else {
            return true;
        }
    }
    updateEvent(isActive) {
        if (isActive) {
            this.isEventActive = true;
            this.openButton.classList.remove('faded-image');
        } else {
            this.isEventActive = false;
            this.openButton.classList.add('faded-image');
        }
        if (this.isOpen) {
            hideElement(this.openOptions);
            this.isOpen = false;
        }
    }
    removeEvent() {
        this.isEventActive = false;
        this.openButton.classList.remove('faded-image');
    }
    updateAreaEffect(area) {
        if (area instanceof SlayerArea && area.areaEffect) {
            this.effectDescription.textContent = templateString(area.areaEffectDescription, {
                effectValue: `${game.combat.getAreaEffectMagnitude(area.areaEffect, area.realm)}`,
            });
        }
    }
    updateAreaSkillUnlock(area) {
        let counts;
        let currentCount;
        if (area instanceof AbyssDepth) {
            counts = area.skillUnlockCompletions;
            currentCount = area.timesCompleted;
        } else if (area instanceof Dungeon) {
            counts = area.skillUnlockCompletions;
            currentCount = game.combat.getDungeonCompleteCount(area);
        } else if (area instanceof Stronghold) {
            counts = area.skillUnlockCompletions;
            currentCount = area.timesCompleted;
        } else {
            hideElement(this.skillUnlock);
            return;
        }
        const nextCount = counts.find((count) => count > currentCount);
        if (nextCount === undefined) {
            hideElement(this.skillUnlock);
        } else {
            this.skillUnlock.textContent = templateLangString('MENU_TEXT_COMPLETIONS_UNTIL_SKILL_UNLOCK', {
                value: `${nextCount - currentCount}`,
            });
            showElement(this.skillUnlock);
        }
    }
}
CombatAreaMenuElement.difficulty = [{
        get name() {
            return getLangString('COMBAT_MISC_23');
        },
        class: 'badge-success',
    },
    {
        get name() {
            return getLangString('COMBAT_MISC_24');
        },
        class: 'badge-warning',
    },
    {
        get name() {
            return getLangString('COMBAT_MISC_25');
        },
        class: 'badge-danger',
    },
    {
        get name() {
            return getLangString('COMBAT_MISC_26');
        },
        class: 'badge-danger-dark',
    },
    {
        get name() {
            return getLangString('COMBAT_MISC_27');
        },
        class: 'badge-dark',
    },
    {
        get name() {
            return getLangString('COMBAT_MISC_SLAYER_TIER_5');
        },
        class: 'badge-secondary',
    },
    {
        get name() {
            return getLangString('COMBAT_MISC_SLAYER_TIER_6');
        },
        class: 'badge-mythical',
    },
    {
        get name() {
            return getLangString('MENU_TEXT_QUESTION_MARKS');
        },
        class: 'badge-rip',
    },
    {
        get name() {
            return getLangString('SLAYER_TASK_CATEGORY_Woe');
        },
        class: 'badge-woe',
    },
    {
        get name() {
            return getLangString('SLAYER_TASK_CATEGORY_Decay');
        },
        class: 'badge-decay',
    },
    {
        get name() {
            return getLangString('SLAYER_TASK_CATEGORY_Fear');
        },
        class: 'badge-fear',
    },
    {
        get name() {
            return getLangString('SLAYER_TASK_CATEGORY_Ruin');
        },
        class: 'badge-ruin',
    },
    {
        get name() {
            return getLangString('SLAYER_TASK_CATEGORY_Isolation');
        },
        class: 'badge-isolation',
    },
    {
        get name() {
            return getLangString('SLAYER_TASK_CATEGORY_Dissolution');
        },
        class: 'badge-dissolve',
    },
    {
        get name() {
            return getLangString('SLAYER_TASK_CATEGORY_Resolution');
        },
        class: 'badge-resolve',
    },
    {
        get name() {
            return getLangString('MENU_TEXT_QUESTION_MARKS');
        },
        class: 'badge-rip',
    },
];
window.customElements.define('combat-area-menu', CombatAreaMenuElement);
class MonsterSelectTableElement extends HTMLElement {
    constructor() {
        super();
        this.monsterHPSpan = new Map();
        this.monsterBarrierSpan = new Map();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('monster-select-table-template'));
        this.tableBody = getElementFromFragment(this._content, 'table-body', 'tbody');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setArea(area) {
        this.tableBody.textContent = '';
        area.monsters.forEach((monster) => {
            this.createRow(monster, area);
        });
    }
    createRow(monster, area) {
        const content = new DocumentFragment();
        content.append(getTemplateNode('monster-select-table-row-template'));
        const row = getElementFromFragment(content, 'row', 'tr');
        const monsterImage = getElementFromFragment(content, 'monster-image', 'img');
        monsterImage.src = monster.media;
        monsterImage.id = `monster-area-img-${monster.id}`;
        const monsterName = getElementFromFragment(content, 'monster-name', 'span');
        monsterName.textContent = monster.name;
        const combatLevel = getElementFromFragment(content, 'combat-level', 'small');
        combatLevel.textContent = templateString(getLangString('COMBAT_MISC_93'), {
            level: `${numberWithCommas(monster.combatLevel)}`,
        });
        const barrier = getElementFromFragment(content, 'barrier', 'span');
        const barrierIcon = getElementFromFragment(content, 'barrier-icon', 'img');
        if (monster.hasBarrier) {
            barrier.textContent = numberWithCommas(applyModifier(numberMultiplier * monster.levels.Hitpoints, monster.barrierPercent, 3));
            showElement(barrierIcon);
            showElement(barrier);
        } else {
            barrier.textContent = '';
            hideElement(barrierIcon);
            hideElement(barrier);
        }
        this.monsterBarrierSpan.set(monster, barrier);
        const hitpoints = getElementFromFragment(content, 'hitpoints', 'span');
        hitpoints.textContent = numberWithCommas(numberMultiplier * monster.levels.Hitpoints);
        this.monsterHPSpan.set(monster, hitpoints);
        const attackType = getElementFromFragment(content, 'attack-type', 'img');
        attackType.src = assets.getURI(MonsterSelectTableElement.attackTypeMedia[monster.attackType]);
        const fightButton = getElementFromFragment(content, 'fight-button', 'button');
        fightButton.onclick = () => game.combat.selectMonster(monster, area);
        const dropsButton = getElementFromFragment(content, 'drops-button', 'button');
        dropsButton.onclick = (event) => {
            viewMonsterDrops(monster, false);
            event.stopPropagation();
        };
        this.tableBody.append(row);
    }
    updateMonsterValuesAfterLoad(monster) {
        const barrier = this.monsterBarrierSpan.get(monster);
        if (barrier !== undefined && monster.hasBarrier) {
            barrier.textContent = numberWithCommas(applyModifier(numberMultiplier * monster.levels.Hitpoints, monster.barrierPercent, 3));
        }
        const hitpoints = this.monsterHPSpan.get(monster);
        if (hitpoints !== undefined) {
            hitpoints.textContent = numberWithCommas(numberMultiplier * monster.levels.Hitpoints);
        }
    }
}
MonsterSelectTableElement.attackTypeMedia = {
    melee: 'assets/media/skills/combat/attack.png',
    ranged: "assets/media/skills/ranged/ranged.png" /* Assets.Ranged */ ,
    magic: "assets/media/skills/magic/magic.png" /* Assets.Magic */ ,
    random: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
};
window.customElements.define('monster-select-table', MonsterSelectTableElement);
class MonsterSelectTableRowElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('monster-select-table-row-template'));
        this.monsterImage = getElementFromFragment(this._content, 'monster-image', 'img');
        this.monsterName = getElementFromFragment(this._content, 'monster-name', 'span');
        this.combatLevel = getElementFromFragment(this._content, 'combat-level', 'small');
        this.barrier = getElementFromFragment(this._content, 'barrier', 'span');
        this.barrierIcon = getElementFromFragment(this._content, 'barrier-icon', 'img');
        this.hitpoints = getElementFromFragment(this._content, 'hitpoints', 'span');
        this.attackType = getElementFromFragment(this._content, 'attack-type', 'img');
        this.fightButton = getElementFromFragment(this._content, 'fight-button', 'button');
        this.dropsButton = getElementFromFragment(this._content, 'drops-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setRow(monster, area) {
        const content = new DocumentFragment();
        content.append(getTemplateNode('monster-select-table-row-template'));
        this.monsterImage.src = monster.media;
        this.monsterImage.id = `monster-area-img-${monster.id}`;
        this.monsterName.textContent = monster.name;
        this.combatLevel.textContent = templateString(getLangString('COMBAT_MISC_93'), {
            level: `${numberWithCommas(monster.combatLevel)}`,
        });
        this.setHitpoints(monster);
        this.setBarrier(monster);
        this.attackType.src = assets.getURI(MonsterSelectTableElement.attackTypeMedia[monster.attackType]);
        this.fightButton.onclick = () => game.combat.selectMonster(monster, area);
        this.dropsButton.onclick = (event) => {
            viewMonsterDrops(monster, false);
            event.stopPropagation();
        };
    }
    setHitpoints(monster) {
        this.hitpoints.textContent = numberWithCommas(numberMultiplier * monster.levels.Hitpoints);
    }
    setBarrier(monster) {
        if (monster.hasBarrier) {
            this.barrier.textContent = numberWithCommas(applyModifier(numberMultiplier * monster.levels.Hitpoints, monster.barrierPercent, 3));
            showElement(this.barrierIcon);
            showElement(this.barrier);
        } else {
            this.barrier.textContent = '';
            hideElement(this.barrierIcon);
            hideElement(this.barrier);
        }
    }
}
window.customElements.define('monster-select-table-row', MonsterSelectTableRowElement);
class DungeonSelectElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('dungeon-select-template'));
        this.startButton = getElementFromFragment(this._content, 'start-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setDungeon(dungeon) {
        if (dungeon.event === undefined) {
            this.startButton.textContent = getLangString('COMBAT_MISC_52');
            this.startButton.classList.add('btn-danger');
        } else {
            this.startButton.textContent = getLangString('BANE_EVENT_BTN_0');
            this.startButton.classList.add('btn-success');
        }
        this.startButton.onclick = () => game.combat.selectDungeon(dungeon);
    }
}
window.customElements.define('dungeon-select', DungeonSelectElement);
class AbyssDepthSelectElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('abyss-depth-select-template'));
        this.startButton = getElementFromFragment(this._content, 'start-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setDepth(depth) {
        this.startButton.textContent = getLangString('THE_ABYSS_ENTER_DEPTH');
        this.startButton.classList.add('btn-danger');
        this.startButton.onclick = () => game.combat.selectAbyssDepth(depth);
    }
}
window.customElements.define('abyss-depth-select', AbyssDepthSelectElement);
class StrongholdTierRow {
    constructor() {
        this.requirements = [];
        const content = new DocumentFragment();
        content.append(getTemplateNode('stronghold-tier-row-template'));
        this.row = getElementFromFragment(content, 'row', 'tr');
        this.startButton = getElementFromFragment(content, 'start-button', 'button');
        this.rewardsButton = getElementFromFragment(content, 'rewards-button', 'button');
        this.name = getElementFromFragment(content, 'name', 'span');
        this.requirementsContainer = getElementFromFragment(content, 'requirements-container', 'ul');
    }
    setTier(stronghold, tier) {
        switch (tier) {
            case 'Standard':
                this.name.textContent = getLangString('STRONGHOLD_TIER_STANDARD');
                break;
            case 'Augmented':
                this.name.textContent = getLangString('STRONGHOLD_TIER_AUGMENTED');
                break;
            case 'Superior':
                this.name.textContent = getLangString('STRONGHOLD_TIER_SUPERIOR');
                break;
        }
        this.requirementsContainer.textContent = '';
        this.requirements = [];
        const itemsRequired = stronghold.tiers[tier].requiredItems;
        if (itemsRequired.length) {
            itemsRequired.forEach((item) => {
                const li = createElement('li', {
                    parent: this.requirementsContainer
                });
                createElement('img', {
                    className: 'skill-icon-xs mr-1',
                    attributes: [
                        ['src', item.media]
                    ],
                    parent: li
                });
                this.requirements.push(createElement('span', {
                    className: 'text-danger mr-1 ml-2',
                    text: getLangString('COMBAT_MISC_110'),
                    parent: li,
                }));
                tippy(li, {
                    content: item.name
                });
            });
        } else {
            createElement('li', {
                className: 'text-success',
                text: 'None',
                parent: this.requirementsContainer
            });
        }
        this.startButton.onclick = () => game.combat.selectStronghold(stronghold, tier);
        this.rewardsButton.onclick = (e) => {
            this.viewStrongholdRewards(stronghold, tier);
            e.stopPropagation();
        };
    }
    updateRequirements(stronghold, tier) {
        const itemsRequired = stronghold.tiers[tier].requiredItems;
        let met = true;
        this.requirements.forEach((span, i) => {
            const item = itemsRequired[i];
            const equipped = game.combat.player.equipment.checkForItem(item);
            toggleDangerSuccess(span, equipped);
            if (!equipped)
                met = false;
        });
        this.startButton.disabled = !met;
    }
    viewStrongholdRewards(stronghold, tier) {
        var _a, _b;
        const modalBody = createElement('div', {
            className: 'justify-vertical-center'
        });
        createElement('span', {
            className: 'font-w600',
            text: getLangString('TUTORIAL_MISC_2'),
            parent: modalBody
        });
        const rewards = stronghold.tiers[tier].rewards;
        if (rewards.chance !== 100) {
            createElement('span', {
                text: templateLangString('STRONGHOLD_REWARDS_CHANCE', {
                    chance: `${rewards.chance}`
                }),
                parent: modalBody,
            });
        }
        (_a = rewards.items) === null || _a === void 0 ? void 0 : _a.forEach(({
            item,
            quantity
        }) => {
            const reward = createElement('inline-requirement', {
                className: 'text-success',
                parent: modalBody
            });
            reward.setContent(item.media, `${numberWithCommas(quantity)} ${item.name}`, item.name);
            reward.disableTooltip();
        });
        (_b = rewards.currencies) === null || _b === void 0 ? void 0 : _b.forEach(({
            currency,
            quantity
        }) => {
            const reward = createElement('inline-requirement', {
                className: 'text-success',
                parent: modalBody
            });
            reward.setContent(currency.media, numberWithCommas(quantity), currency.name);
            reward.disableTooltip();
        });
        SwalLocale.fire({
            title: stronghold.getTierName(tier),
            html: modalBody,
            imageUrl: stronghold.media,
            imageWidth: 128,
            imageHeight: 128,
            imageAlt: stronghold.name,
        });
    }
}
class StrongholdSelectElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('stronghold-select-template'));
        this.tableBody = getElementFromFragment(this._content, 'table-body', 'tbody');
        this.standardRow = new StrongholdTierRow();
        this.augmentedRow = new StrongholdTierRow();
        this.superiorRow = new StrongholdTierRow();
        this.tableBody.append(this.standardRow.row, this.augmentedRow.row, this.superiorRow.row);
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setStronghold(stronghold) {
        this.standardRow.setTier(stronghold, 'Standard');
        this.augmentedRow.setTier(stronghold, 'Augmented');
        this.superiorRow.setTier(stronghold, 'Superior');
    }
    updateRequirements(stronghold) {
        this.standardRow.updateRequirements(stronghold, 'Standard');
        this.augmentedRow.updateRequirements(stronghold, 'Augmented');
        this.superiorRow.updateRequirements(stronghold, 'Superior');
    }
}
window.customElements.define('stronghold-select', StrongholdSelectElement);
class CombatAreaMenuManager {
    constructor() {
        this.all = new Map();
    }
    init(game, categoryMenu) {
        this.categoryMenu = categoryMenu;
        let insertPoint = categoryMenu;
        game.combatAreaCategories.forEach((category) => {
            const container = createElement('div', {
                className: 'row row-deck gutters-tiny mt-3 d-none'
            });
            const areaMenu = new CombatAreaMenu(container, category.areas);
            this.all.set(category, areaMenu);
            insertPoint.insertAdjacentElement('afterend', container);
            insertPoint = container;
        });
    }
    closeOpen() {
        if (this.open === undefined)
            return;
        const areaMenu = this.all.get(this.open);
        if (areaMenu !== undefined)
            areaMenu.close();
        this.categoryMenu.unhighlightOption(this.open);
        this.open = undefined;
    }
    toggleCategory(category) {
        const areaMenu = this.all.get(category);
        if (areaMenu === undefined)
            return;
        const wasOpen = this.open === category;
        this.closeOpen();
        if (!wasOpen) {
            areaMenu.open();
            this.categoryMenu.highlightOption(category);
            this.open = category;
        }
    }
    toggleCategoryVisibilityByRealm(realm) {
        this.all.forEach((areaMenu, category) => {
            if (game.settings.useLegacyRealmSelection || category.areas.some((area) => area.realm === realm)) {
                this.categoryMenu.showCategory(category);
            } else {
                this.categoryMenu.hideCategory(category);
            }
        });
    }
    openCategory(category) {
        const areaMenu = this.all.get(category);
        if (areaMenu === undefined || this.open === category)
            return;
        this.toggleCategory(category);
    }
    showMenuRealmHeader() {
        this.categoryMenu.setHeaderVisibility(true);
    }
    hideMenuRealmHeader() {
        this.categoryMenu.setHeaderVisibility(false);
    }
    updateMenuHeaderText(text) {
        this.categoryMenu.setHeaderText(text);
    }
    updateMenuHeaderClass(realm) {
        this.categoryMenu.setHeaderClass(realm.realmClass);
    }
}
class CombatArea extends RealmedObject {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this._entryRequirements = [];
        this.gamemodeEntryRequirements = new Map();
        /** If monsters in this area should drop their bones */
        this.dropsBones = true;
        /** If monsters in this area should drop their loot table */
        this.dropsLoot = true;
        /** If monsters in this area should drop their currencies */
        this.dropsCurrency = true;
        /** If monster kills in this area should count towards slayer area tasks */
        this.allowSlayerKills = true;
        /** If monsters in this area can be automatically jumped to */
        this.allowAutoJump = true;
        /** Determines which damage types are allowed in this area. Unset allows all damage types */
        this.allowedDamageTypes = new Set();
        this.allowedGamemodes = new Set();
        try {
            this.monsters = game.monsters.getArrayFromIds(data.monsterIDs);
            this._name = data.name;
            this._media = data.media;
            this.difficulty = data.difficulty;
            if (data.requiredLanguages)
                this._requiredLanguages = [...data.requiredLanguages];
            if (data.combatTriangleSet !== undefined) {
                this.combatTriangleSet = game.combatTriangleSets.getObjectSafe(data.combatTriangleSet);
            } else
                this.combatTriangleSet = game.normalCombatTriangleSet;
            if (data.overrideDamageType !== undefined) {
                this.overrideDamageType = game.damageTypes.getObjectSafe(data.overrideDamageType);
            }
            if (data.allowedGamemodeIDs) {
                data.allowedGamemodeIDs.forEach((id) => {
                    const gamemode = game.gamemodes.getObjectByID(id);
                    if (gamemode === undefined)
                        throw new Error(`Error constructing Combat Area: ${this.id}. Gamemode with id: ${id} is not registered.`);
                    this.allowedGamemodes.add(gamemode);
                });
            }
            if (data.allowedDamageTypeIDs !== undefined) {
                this.allowedDamageTypes = new Set(data.allowedDamageTypeIDs.map((id) => game.damageTypes.getObjectSafe(id)));
            }
            this.modQuery = new ModifierQuery({
                realm: this.realm,
                action: this,
            });
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(CombatArea.name, e, this.id);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        if (this.isModded || this.localID.includes('Lemon') || this.localID.includes('Carrot')) {
            return this._name;
        } else {
            return getLangString(`COMBAT_AREA_NAME_${this.localID}`);
        }
    }
    get wikiName() {
        return replaceAll(this._name, ' ', '_');
    }
    get hasRequiredLanguage() {
        if (this._requiredLanguages === undefined)
            return true;
        return this._requiredLanguages.includes(setLang);
    }
    get hasBarrierMonsters() {
        return this.monsters.some((monster) => monster.hasBarrier);
    }
    get usesStandardCombatTriangle() {
        return this.combatTriangleSet === game.normalCombatTriangleSet;
    }
    get entryRequirements() {
        var _a;
        return (_a = this.gamemodeEntryRequirements.get(game.currentGamemode)) !== null && _a !== void 0 ? _a : this._entryRequirements;
    }
    get category() {
        return this._category;
    }
    registerSoftDependencies(data, game) {
        try {
            this._entryRequirements = game.getRequirementsFromData(data.entryRequirements);
            if (data.gamemodeEntryRequirements !== undefined) {
                data.gamemodeEntryRequirements.forEach((gamemodeReq) => {
                    const gamemode = game.gamemodes.getObjectSafe(gamemodeReq.gamemodeID);
                    const reqs = [...this._entryRequirements];
                    reqs.push(...game.getRequirementsFromData(gamemodeReq.entryRequirements));
                    this.gamemodeEntryRequirements.set(gamemode, reqs);
                });
            }
        } catch (e) {
            throw new DataConstructionError(CombatArea.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        var _a;
        if (modData.difficulty !== undefined) {
            this.difficulty = modData.difficulty;
        }
        if (modData.entryRequirements !== undefined) {
            if (modData.entryRequirements.remove !== undefined) {
                modData.entryRequirements.remove.forEach((type) => {
                    this._entryRequirements = this._entryRequirements.filter((req) => req.type !== type);
                });
            }
            if (modData.entryRequirements.add !== undefined) {
                this._entryRequirements.push(...game.getRequirementsFromData(modData.entryRequirements.add));
            }
        }
        if (modData.gamemodeEntryRequirements !== undefined) {
            const gamemode = game.gamemodes.getObjectByID(modData.gamemodeEntryRequirements.gamemodeID);
            if (gamemode === undefined)
                throw new Error(`Error applying modification to Combat Area: ${this.id}. Gamemode with id: ${modData.gamemodeEntryRequirements.gamemodeID} is not registered.`);
            let reqs = [...((_a = this.gamemodeEntryRequirements.get(gamemode)) !== null && _a !== void 0 ? _a : this._entryRequirements)];
            if (modData.gamemodeEntryRequirements.remove !== undefined) {
                modData.gamemodeEntryRequirements.remove.forEach((type) => {
                    reqs = reqs.filter((req) => req.type !== type);
                });
            }
            if (modData.gamemodeEntryRequirements.add !== undefined) {
                reqs.push(...game.getRequirementsFromData(modData.gamemodeEntryRequirements.add));
            }
            this.gamemodeEntryRequirements.set(gamemode, reqs);
        }
        if (modData.monsters !== undefined) {
            if (modData.monsters.remove !== undefined) {
                modData.monsters.remove.forEach((m) => {
                    var _a;
                    if (m.removeAt !== undefined) {
                        if (((_a = this.monsters[m.removeAt]) === null || _a === void 0 ? void 0 : _a.id) === m.monsterID) {
                            this.monsters.splice(m.removeAt, 1);
                        } else {
                            console.warn(`Warning modifying Combat Area: ${this.id}. Monster with id: ${m.monsterID} is not located at position: ${m.removeAt}.`);
                        }
                    } else {
                        this.monsters = this.monsters.filter((monster) => monster.id !== m.monsterID);
                    }
                });
            }
            if (modData.monsters.add !== undefined) {
                modData.monsters.add.forEach((m) => {
                    const monster = game.monsters.getObjectByID(m.monsterID);
                    if (monster === undefined)
                        throw new Error(`Error modifying Combat Area: ${this.id}. Monster with id: ${m.monsterID} is not registered.`);
                    if (m.insertAt !== undefined) {
                        if (m.insertAt >= this.monsters.length) {
                            this.monsters.push(monster);
                        } else {
                            this.monsters.splice(m.insertAt, 0, monster);
                        }
                    } else {
                        this.monsters.push(monster);
                    }
                });
            }
        }
        if (modData.allowedDamageTypeIDs !== undefined) {
            if (modData.allowedDamageTypeIDs.remove !== undefined) {
                modData.allowedDamageTypeIDs.remove.forEach((damageTypeID) => {
                    const damageType = game.damageTypes.getObjectByID(damageTypeID);
                    if (damageType === undefined)
                        throw new Error(`Error modifying Combat Area: ${this.id}. Damage Type with id: ${damageTypeID} is not registered.`);
                    this.allowedDamageTypes.delete(damageType);
                });
            }
            if (modData.allowedDamageTypeIDs.add !== undefined) {
                modData.allowedDamageTypeIDs.add.forEach((damageTypeID) => {
                    const damageType = game.damageTypes.getObjectByID(damageTypeID);
                    if (damageType === undefined)
                        throw new Error(`Error modifying Combat Area: ${this.id}. Damage Type with id: ${damageTypeID} is not registered.`);
                    this.allowedDamageTypes.add(damageType);
                });
            }
        }
    }
    overrideMedia(media) {
        if (!this.localID.includes('Lemon') && !this.localID.includes('Carrot'))
            this._media = media;
    }
    /** Constructs a CombatAreaEffect object from data */
    constructAreaEffect(data, game) {
        try {
            const areaEffect = {
                target: data.target,
                magnitude: data.magnitude,
            };
            if (data.applicator !== undefined)
                areaEffect.applicator = game.getCombatEffectApplicatorWithTriggerFromData(data.applicator);
            const modifiers = [];
            if (data.target === 'Enemy') {
                if (data.modifiers !== undefined)
                    modifiers.push(...game.getEnemyModifierValuesFromData(data.modifiers));
                if (data.modifier !== undefined) {
                    console.warn(`The modifier property for CombatAreaEffects is deprecated. Use the modifiers property instead.`);
                    modifiers.push(ModifierValue.fromEnemyKey(data.modifier, {
                        value: 1
                    }, game));
                }
            } else {
                if (data.modifiers !== undefined)
                    modifiers.push(...game.getModifierValuesFromData(data.modifiers));
                if (data.modifier !== undefined) {
                    console.warn(`The modifier property for CombatAreaEffects is deprecated. Use the modifiers property instead.`);
                    modifiers.push(ModifierValue.fromKey(data.modifier, {
                        value: 0
                    }, game));
                }
            }
            if (modifiers.length > 0)
                areaEffect.modifiers = modifiers;
            return areaEffect;
        } catch (e) {
            throw new DataConstructionError('CombatAreaEffect', e);
        }
    }
    isRequiredGamemode(gamemode) {
        return this.allowedGamemodes.size < 1 || this.allowedGamemodes.has(gamemode);
    }
    canEnterWithDamageType(damageType) {
        return this.allowedDamageTypes.size === 0 || this.allowedDamageTypes.has(damageType);
    }
    setCategory(category) {
        if (this._category !== undefined)
            throw new Error(`${CombatArea.name} with id "${this.id}" already belongs to a category.`);
        this._category = category;
        this.modQuery.add({
            category
        });
    }
    removeCategory() {
        if (this._category === undefined)
            return;
        this._category = undefined;
        this.modQuery.remove({
            category: this._category
        });
    }
}
class SlayerArea extends CombatArea {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.slayerLevelRequired = 0;
        try {
            this._areaEffectDescription = data.areaEffectDescription;
            if (data.areaEffect !== undefined)
                this.areaEffect = this.constructAreaEffect(data.areaEffect, game);
            if (data.pet !== undefined) {
                this.pet = {
                    pet: game.pets.getObjectSafe(data.pet.petID),
                    weight: data.pet.weight,
                };
            }
        } catch (e) {
            throw new DataConstructionError(SlayerArea.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`SLAYER_AREA_NAME_${this.localID}`);
        }
    }
    get wikiName() {
        return replaceAll(this._name, ' ', '_');
    }
    get areaEffectDescription() {
        if (this.areaEffect === undefined)
            return getLangString('COMBAT_MISC_NO_AREA_EFFECT');
        if (this.isModded) {
            if (this._areaEffectDescription !== undefined) {
                return this._areaEffectDescription;
            } else {
                return 'Error. No description.';
            }
        } else {
            return getLangString(`SLAYER_AREA_EFFECT_${this.localID}`);
        }
    }
    get hasBarrierMonsters() {
        return this.monsters.some((monster) => monster.hasBarrier);
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        if (modData.areaEffect !== undefined) {
            this.areaEffect = modData.areaEffect !== null ? this.constructAreaEffect(modData.areaEffect, game) : undefined;
        }
        if (modData.areaEffectDescription !== undefined) {
            this._areaEffectDescription = modData.areaEffectDescription !== null ? modData.areaEffectDescription : undefined;
        }
        if (modData.pet !== undefined) {
            if (modData.pet === null) {
                this.pet = undefined;
            } else {
                const pet = game.pets.getObjectByID(modData.pet.petID);
                if (pet === undefined)
                    throw new Error(`Error modifying slayer area with id: ${this.id}. Pet with id: ${modData.pet.petID} is not registered.`);
                this.pet = {
                    pet,
                    weight: modData.pet.weight,
                };
            }
        }
    }
}
class Dungeon extends CombatArea {
    constructor(namespace, data, game) {
        var _a, _b;
        super(namespace, data, game);
        this.bossOnlyPassives = [];
        this.gamemodeRewards = new Map();
        this.skillUnlockCompletions = [];
        try {
            this.dropsBones = data.dropBones;
            this.dropsLoot = false;
            this.dropsCurrency = false;
            this.allowSlayerKills = false;
            this.allowAutoJump = false;
            this._rewards = game.items.getArrayFromIds(data.rewardItemIDs);
            if (data.floors !== undefined)
                this.floors = data.floors;
            if (data.eventID !== undefined) {
                this.event = game.combatEvents.getObjectSafe(data.eventID);
            }
            if (data.pet !== undefined) {
                this.pet = {
                    pet: game.pets.getObjectSafe(data.pet.petID),
                    weight: data.pet.weight,
                };
            }
            this.fixedPetClears = data.fixedPetClears;
            this.pauseOnBosses = data.pauseOnBosses;
            if (data.oneTimeRewardID !== undefined) {
                this.oneTimeReward = game.items.getObjectSafe(data.oneTimeRewardID);
            }
            if (data.nonBossPassives !== undefined) {
                this.nonBossPassives = game.combatPassives.getArrayFromIds(data.nonBossPassives);
            }
            if (data.bossOnlyPassives !== undefined) {
                this.bossOnlyPassives = game.combatPassives.getArrayFromIds(data.bossOnlyPassives);
            }
            if (data.gamemodeRewardItemIDs !== undefined) {
                data.gamemodeRewardItemIDs.forEach((reward) => {
                    const gamemode = game.gamemodes.getObjectSafe(reward.gamemodeID);
                    const itemRewards = game.items.getArrayFromIds(data.rewardItemIDs);
                    this.gamemodeRewards.set(gamemode, itemRewards);
                });
            }
            this.showUnlockRequirements = (_a = data.showUnlockRequirements) !== null && _a !== void 0 ? _a : true;
            this.hideIfLocked = (_b = data.hideIfLocked) !== null && _b !== void 0 ? _b : false;
        } catch (e) {
            throw new DataConstructionError(Dungeon.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`DUNGEON_NAME_${this.localID}`);
        }
    }
    get hasBarrierMonsters() {
        return this.monsters.some((monster) => monster.hasBarrier);
    }
    get rewards() {
        const items = [];
        items.push(...this._rewards);
        const gamemodeRewards = this.gamemodeRewards.get(game.currentGamemode);
        if (gamemodeRewards !== undefined)
            items.push(...gamemodeRewards);
        return items;
    }
    get wikiName() {
        return replaceAll(this._name, ' ', '_');
    }
    registerSoftDependencies(data, game) {
        super.registerSoftDependencies(data, game);
        try {
            if (data.unlockRequirement !== undefined)
                this.unlockRequirement = data.unlockRequirement.map((data) => game.getRequirementFromData(data));
        } catch (e) {
            throw new DataConstructionError(Dungeon.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        super.applyDataModification(modData, game);
        if (modData.dropBones !== undefined) {
            this.dropsBones = modData.dropBones;
        }
        if (modData.eventID !== undefined) {
            if (modData.eventID === null) {
                this.event = undefined;
            } else {
                const event = game.combatEvents.getObjectByID(modData.eventID);
                if (event === undefined)
                    throw new Error(`Error modifying Dungeon: ${this.id}. Event with id: ${modData.eventID} is not registered.`);
                this.event = event;
            }
        }
        if (modData.fixedPetClears !== undefined) {
            this.fixedPetClears = modData.fixedPetClears;
        }
        if (modData.floors !== undefined) {
            this.floors = modData.floors !== null ? modData.floors : undefined;
        }
        if (modData.nonBossPassives !== undefined) {
            if (modData.nonBossPassives.remove !== undefined) {
                if (this.nonBossPassives !== undefined) {
                    modData.nonBossPassives.remove.forEach((passiveID) => {
                        var _a;
                        return (this.nonBossPassives = (_a = this.nonBossPassives) === null || _a === void 0 ? void 0 : _a.filter((passive) => passive.id !== passiveID));
                    });
                }
            }
            if (modData.nonBossPassives.add !== undefined) {
                if (this.nonBossPassives === undefined)
                    this.nonBossPassives = [];
                this.nonBossPassives.push(...modData.nonBossPassives.add.map((passiveID) => {
                    const passive = game.combatPassives.getObjectByID(passiveID);
                    if (passive === undefined)
                        throw new Error(`Error modifying Dungeon: ${this.id}. Non-boss passive with id: ${passiveID} is not registered.`);
                    return passive;
                }));
            }
        }
        if (modData.oneTimeRewardID !== undefined) {
            if (modData.oneTimeRewardID === null) {
                this.oneTimeReward = undefined;
            } else {
                const item = game.items.getObjectByID(modData.oneTimeRewardID);
                if (item === undefined)
                    throw new Error(`Error modifying Dungeon: ${this.id}. One time reward with id: ${modData.oneTimeRewardID} is not registered.`);
                this.oneTimeReward = item;
            }
        }
        if (modData.pauseOnBosses !== undefined) {
            this.pauseOnBosses = modData.pauseOnBosses;
        }
        if (modData.pet !== undefined) {
            const pet = game.pets.getObjectByID(modData.pet.petID);
            if (pet === undefined)
                throw new Error(`Error modifying dungeon with id: ${this.id}. Pet with id: ${modData.pet.petID} is not registered.`);
            this.pet = {
                pet,
                weight: modData.pet.weight,
            };
        }
        if (modData.rewardItemIDs !== undefined) {
            if (modData.rewardItemIDs.remove !== undefined) {
                modData.rewardItemIDs.remove.forEach((itemID) => {
                    const itemIndex = this._rewards.findIndex((i) => i.id === itemID);
                    if (itemIndex < 0) {
                        console.warn(`Warning when modifying Dungeon: ${this.id}. Reward item with with ID: ${itemID} does not exist in the dungeon's reward items.`);
                        return;
                    }
                    this._rewards.splice(itemIndex, 1);
                });
            }
            if (modData.rewardItemIDs.add !== undefined) {
                modData.rewardItemIDs.add.forEach((itemID) => {
                    const item = game.items.getObjectByID(itemID);
                    if (item === undefined)
                        throw new Error(`Error modifying Dungeon: ${this.id}. Reward item with id: ${itemID} is not registered.`);
                    return item;
                });
            }
        }
        if (modData.unlockRequirement !== undefined) {
            if (modData.unlockRequirement.remove !== undefined && this.unlockRequirement !== undefined) {
                modData.unlockRequirement.remove.forEach((type) => {
                    var _a;
                    this.unlockRequirement = (_a = this.unlockRequirement) === null || _a === void 0 ? void 0 : _a.filter((req) => req.type !== type);
                });
            }
            if (modData.unlockRequirement.add !== undefined) {
                if (this.unlockRequirement === undefined)
                    this.unlockRequirement = [];
                this.unlockRequirement.push(...game.getRequirementsFromData(modData.unlockRequirement.add));
            }
        }
        if (modData.gamemodeRewardItemIDs !== undefined) {
            if (modData.gamemodeRewardItemIDs.add !== undefined) {
                modData.gamemodeRewardItemIDs.add.forEach((reward) => {
                    const gamemode = game.gamemodes.getObjectByID(reward.gamemodeID);
                    if (gamemode === undefined) {
                        throw new Error(`Error modifying Dungeon: ${this.id}. Gamemode with id: ${reward.gamemodeID} is not registered.`);
                    }
                    const itemRewards = reward.rewardItemIDs.map((itemID) => {
                        const item = game.items.getObjectByID(itemID);
                        if (item === undefined)
                            throw new Error(`Error modifying Dungeon: ${this.id}. Gamemode Reward item with id: ${itemID} is not registered.`);
                        return item;
                    });
                    this.gamemodeRewards.set(gamemode, itemRewards);
                });
            }
        }
    }
}
class AbyssDepth extends Dungeon {
    constructor() {
        super(...arguments);
        /** Save state property. Stores the number of times this depth has been completed. */
        this.timesCompleted = 0;
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`THE_ABYSS_NAME_${this.localID}`);
        }
    }
}
class DummyDungeon extends Dungeon {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            monsterIDs: [],
            difficulty: [0],
            entryRequirements: [],
            rewardItemIDs: [],
            dropBones: false,
            pet: {
                petID: "melvorD:Chick" /* PetIDs.Chick */ ,
                weight: -1,
            },
            fixedPetClears: false,
            pauseOnBosses: false,
        }, game);
    }
}
class DummyAbyssDepth extends AbyssDepth {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            monsterIDs: [],
            difficulty: [0],
            entryRequirements: [],
            rewardItemIDs: [],
            dropBones: false,
            pet: {
                petID: "melvorD:Chick" /* PetIDs.Chick */ ,
                weight: -1,
            },
            fixedPetClears: false,
            pauseOnBosses: false,
        }, game);
    }
}
/** Utility class for stronghold rewards */
class StrongholdRewards extends FixedCosts {
    constructor(data, game) {
        super(data, game);
        this.chance = data.chance;
    }
}
class Stronghold extends CombatArea {
    constructor(namespace, data, game) {
        super(namespace, data, game);
        this.bossOnlyPassives = [];
        /** Save state property. Stores the number of times this stronghold has been completed */
        this.timesCompleted = 0;
        this.skillUnlockCompletions = [];
        try {
            this.allowSlayerKills = false;
            this.allowAutoJump = false;
            this.tiers = {};
            Object.entries(data.tiers).forEach(([tierName, tierData]) => {
                const tier = {
                    requiredItems: game.items.equipment.getArrayFromIds(tierData.requiredItems),
                    passives: game.combatPassives.getArrayFromIds(tierData.passives),
                    rewards: new StrongholdRewards(tierData.rewards, game),
                };
                this.tiers[tierName] = tier;
            });
            if (data.pet !== undefined) {
                this.pet = {
                    pet: game.pets.getObjectSafe(data.pet.petID),
                    weight: data.pet.weight,
                    fixedClears: data.pet.fixedClears !== undefined ? data.pet.fixedClears : false,
                };
            }
            if (data.bossOnlyPassives !== undefined) {
                this.bossOnlyPassives = game.combatPassives.getArrayFromIds(data.bossOnlyPassives);
            }
        } catch (e) {
            throw new DataConstructionError(Stronghold.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`STRONGHOLD_NAME_${this.localID}`);
        }
    }
    getTierName(tier) {
        switch (tier) {
            case 'Standard':
                return this.name;
            case 'Augmented':
                return templateLangString(`STRONGHOLD_TIER_AUGMENTED_NAME`, {
                    strongholdName: this.name
                });
            case 'Superior':
                return templateLangString(`STRONGHOLD_TIER_SUPERIOR_NAME`, {
                    strongholdName: this.name
                });
        }
    }
}
Stronghold.TierIDs = {
    Standard: 0,
    Augmented: 1,
    Superior: 2,
    0: 'Standard',
    1: 'Augmented',
    2: 'Superior',
};
class CombatAreaCategory extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this._name = data.name;
            this._media = data.media;
            this.areas = new NamespacedArray(game.combatAreas);
            this.areas.registerData([{
                insertAt: 'Start',
                ids: data.areas,
            }, ]);
            this.areas.forEach((area) => area.setCategory(this));
        } catch (e) {
            throw new DataConstructionError(CombatAreaCategory.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        }
        return getLangString(`COMBAT_AREA_CATEGORY_${this.localID}`);
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    applyDataModification(modData, game) {
        if (modData.areas !== undefined) {
            if (modData.areas.remove !== undefined) {
                const remove = modData.areas.remove;
                this.areas = new NamespacedArray(game.combatAreas, ...this.areas.filter((area) => {
                    const shouldRemove = remove.includes(area.id);
                    if (shouldRemove)
                        area.removeCategory();
                    return !shouldRemove;
                }));
            }
            if (modData.areas.add !== undefined) {
                const inserted = this.areas.registerData(modData.areas.add);
                inserted.forEach((area) => area.setCategory(this));
            }
        }
    }
}
class ViewMonsterListTableElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('view-monster-list-table-template'));
        this.tableBody = getElementFromFragment(this._content, 'table-body', 'tbody');
        this.areaName = getElementFromFragment(this._content, 'area-name', 'span');
        this.areaImg = getElementFromFragment(this._content, 'area-img', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setArea(area) {
        this.areaName.textContent = area.name;
        this.areaImg.src = area.media;
        this.tableBody.textContent = '';
        this.createRows(area);
    }
    createRows(area) {
        let currentMonster = area.monsters[0];
        let count = 0;
        area.monsters.forEach((monster, id) => {
            if (monster !== currentMonster) {
                const row = new ViewMonsterListTableRowElement();
                row.setRow(currentMonster, count);
                this.tableBody.append(row);
                currentMonster = monster;
                count = 1;
            } else {
                count++;
            }
            if (id === area.monsters.length - 1) {
                const row = new ViewMonsterListTableRowElement();
                row.setRow(monster, count);
                this.tableBody.append(row);
            }
        });
    }
}
window.customElements.define('view-monster-list-table', ViewMonsterListTableElement);
class ViewMonsterListTableRowElement extends HTMLElement {
    constructor() {
        super();
        this.attackTypeMedia = {
            melee: 'assets/media/skills/combat/attack.png',
            ranged: "assets/media/skills/ranged/ranged.png" /* Assets.Ranged */ ,
            magic: "assets/media/skills/magic/magic.png" /* Assets.Magic */ ,
            random: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
        };
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('view-monster-list-table-row-template'));
        this.count = getElementFromFragment(this._content, 'count', 'span');
        this.name = getElementFromFragment(this._content, 'name', 'a');
        this.attackType = getElementFromFragment(this._content, 'attack-type', 'img');
        this.combatLevel = getElementFromFragment(this._content, 'combat-level', 'span');
        this.hitpoints = getElementFromFragment(this._content, 'hitpoints', 'span');
        this.barrier = getElementFromFragment(this._content, 'barrier', 'span');
        this.barrierContainer = getElementFromFragment(this._content, 'barrier-container', 'li');
        this.monsterImg = getElementFromFragment(this._content, 'monster-img', 'img');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setRow(monster, count) {
        if (game.stats.monsterKillCount(monster) > 0) {
            this.setSeenMonster(monster, count);
        } else {
            this.setUnseenMonster();
        }
        if (!monster.isBoss)
            this.monsterImg.className = 'resize-64';
        else
            this.monsterImg.className = 'resize-128 resize-64-mobile';
    }
    setSeenMonster(monster, count) {
        this.count.textContent = count.toString();
        this.name.textContent = monster.name;
        this.name.onclick = () => {
            viewMonsterStats(monster);
        };
        this.name.classList.add('pointer-enabled', 'link-fx');
        this.attackType.src = this.attackTypeMedia[monster.attackType];
        this.monsterImg.src = monster.media;
        this.combatLevel.textContent = templateLangString('COMBAT_MISC_93', {
            level: numberWithCommas(monster.combatLevel),
        });
        this.hitpoints.textContent = numberWithCommas(monster.levels.Hitpoints * numberMultiplier);
        if (monster.hasBarrier) {
            this.barrier.textContent = numberWithCommas(applyModifier(numberMultiplier * monster.levels.Hitpoints, monster.barrierPercent, 3));
            showElement(this.barrierContainer);
        } else {
            this.barrier.textContent = '';
            hideElement(this.barrierContainer);
        }
    }
    setUnseenMonster() {
        this.count.textContent = '?';
        this.name.textContent = getLangString('MENU_TEXT_QUESTION_MARKS');
        this.attackType.src = "assets/media/main/question.png" /* Assets.QuestionMark */ ;
        this.monsterImg.src = "assets/media/main/question.png" /* Assets.QuestionMark */ ;
        this.combatLevel.textContent = templateLangString('COMBAT_MISC_93', {
            level: getLangString('MENU_TEXT_QUESTION_MARKS'),
        });
        this.hitpoints.textContent = getLangString('MENU_TEXT_QUESTION_MARKS');
        hideElement(this.barrierContainer);
    }
}
window.customElements.define('view-monster-list-table-row', ViewMonsterListTableRowElement);
//# sourceMappingURL=combatAreas.js.map
checkFileVersion('?12097')