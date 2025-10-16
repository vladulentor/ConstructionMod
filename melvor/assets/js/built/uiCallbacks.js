"use strict";
const equipStatKeys = [
    'attackSpeed',
    'stabAttackBonus',
    'slashAttackBonus',
    'blockAttackBonus',
    'rangedAttackBonus',
    'magicAttackBonus',
    'meleeStrengthBonus',
    'rangedStrengthBonus',
    'magicDamageBonus',
    'meleeDefenceBonus',
    'rangedDefenceBonus',
    'magicDefenceBonus',
];
/** Callback function for viewing the contents of an Openable item. Modal will not fire if item is not openable. */
function viewItemContents(item) {
    const dropsOrdered = item.dropTable.sortedDropsArray;
    const drops = dropsOrdered
        .map((drop) => {
            return templateString(getLangString('BANK_STRING_40'), {
                qty: `${numberWithCommas(drop.maxQuantity)}`,
                itemImage: `<img class="skill-icon-xs mr-2" src="${drop.item.media}">`,
                itemName: drop.item.name,
            });
        })
        .join('<br>');
    SwalLocale.fire({
        title: item.name,
        html: getLangString('BANK_STRING_39') + '<br><small>' + drops,
        imageUrl: item.media,
        imageWidth: 64,
        imageHeight: 64,
        imageAlt: item.name,
    });
}
/**
 * Views the stats of an item, and the difference in stats if equipped to the specified set
 * @param item The item to show the stats of
 * @param compareToSet The equipment set to compare the stats of, if the item was equipped
 */
function viewItemStats(item, compareToSet = game.combat.player.equipment) {
    const itemStats = new EquipmentStats(item.equipmentStats);
    $('#item-view-name').html(item.name);
    $('#item-view-img').attr('src', item.media);
    let levelReqHTML = '';
    const reqHTML = `<div class="font-size-sm">${printAllUnlockRequirementsAsHTML(item.equipRequirements).join('')}</div>`;
    const levelReqs = item.equipRequirements.filter((req) => req.type === 'SkillLevel');
    const abyssalLevelReqs = item.equipRequirements.filter((req) => req.type === 'AbyssalLevel');
    if (levelReqs.length > 0) {
        levelReqs.forEach((req) => {
            levelReqHTML += `<div class="font-size-sm block block-rounded my-1 ${req.isMet() ? 'text-success' : 'font-w600 text-danger'}">${templateLangString('MENU_TEXT_REQUIRES_SKILL_LEVEL', {
                skillImage: `<span class="font-size-sm"><img class="skill-icon-xs mr-2" src="${req.skill.media}">`,
                level: `${req.level}`,
            })}</div><br>`;
        });
        $('#item-view-description-levels').removeClass('d-none');
    }
    if (abyssalLevelReqs.length > 0) {
        abyssalLevelReqs.forEach((req) => {
            levelReqHTML += `<div class="font-size-sm block block-rounded bg-combat-ita my-1 ${req.isMet() ? 'text-success' : 'font-w600 text-danger'}">${templateLangString('REQUIRES_ABYSSAL_LEVEL', {
                skillImage: `<span class="font-size-sm"><img class="skill-icon-xs mr-2" src="${req.skill.media}">`,
                level: `${req.level}`,
            })}</span><br>`;
        });
        $('#item-view-description-levels').removeClass('d-none');
    }
    if (!levelReqs.length && !abyssalLevelReqs.length)
        $('#item-view-description-levels').addClass('d-none');
    $('#item-view-description-levels').html(reqHTML);
    equipStatKeys.forEach((key) => {
        if (key === 'attackSpeed')
            return;
        $(`#item-view-${key}`).text(itemStats[key]);
    });
    if (item.description != undefined) {
        let itemDesc = item.modifiedDescription;
        itemDesc += getSummonMaxHitItemDescription(item);
        $('#item-view-description').html(itemDesc);
        $('#item-view-description').removeClass('d-none');
        if (item.consumesChargesOn != undefined) {
            $('#item-view-description').append(`<br><span class="text-success">${templateLangString('MENU_TEXT_CHARGES_REMAINING', {
                charges: numberWithCommas(game.itemCharges.getCharges(item)),
            })}</span>`);
        }
    } else {
        $('#item-view-description').text('');
        $('#item-view-description').addClass('d-none');
    }
    if (item.specialAttacks.length > 0) {
        const attackHTML = item.specialAttacks
            .map((attack, id) => {
                let chance = attack.defaultChance;
                if (item.overrideSpecialChances !== undefined)
                    chance = item.overrideSpecialChances[id];
                return `<h5 class="font-w400 font-size-sm text-left text-combat-smoke m-1 mb-2"><strong class="text-bank-desc">${attack.name} (${formatPercent(chance)}) </strong><span>${attack.modifiedDescription}</span></h5>`;
            })
            .join('');
        $('#item-view-special-attack-list').html(attackHTML);
        $('#item-view-special-attack').removeClass('d-none');
    } else {
        $('#item-view-special-attack-list').text('');
        $('#item-view-special-attack').addClass('d-none');
    }
    const damageTypeContElem = document.getElementById('item-view-damage-type-cont');
    if (item instanceof WeaponItem) {
        const damageTypeElem = document.getElementById('item-view-damage-type');
        const damageTypeIconElem = document.getElementById('item-view-damage-type-icon');
        if (damageTypeElem !== null) {
            damageTypeElem.textContent = item.damageType.name;
            damageTypeElem.className = item.damageType.spanClass;
        }
        if (damageTypeIconElem !== null) {
            damageTypeIconElem.src = item.damageType.media;
        }
        $(`#item-view-attackSpeed`).text(templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: `${itemStats.attackSpeed / 1000}`
        }));
        if (damageTypeContElem !== null)
            damageTypeContElem.classList.remove('d-none');
        $('#item-view-attack-speed-main').removeClass('d-none');
    } else {
        if (damageTypeContElem !== null)
            damageTypeContElem.classList.add('d-none');
        $('#item-view-attack-speed-main').addClass('d-none');
    }
    let hiddenResistAlreadyShown = false;
    game.damageTypes.forEach((damageType) => {
        const el = resistanceMenus.viewItemStats.get(damageType);
        if (el === undefined)
            return;
        const value = itemStats.getResistance(damageType);
        el.updateResistanceValue(value);
        if (damageType.onlyShowIfUsing) {
            const shouldShow = value !== 0 || game.combat.isDamageTypeInUse(damageType);
            el.toggleResistanceView(shouldShow);
            hiddenResistAlreadyShown = shouldShow;
        }
    });
    if (compareToSet) {
        const currentEquipStats = new EquipmentStats();
        const newEquipStats = new EquipmentStats();
        compareToSet.addEquipmentStats(currentEquipStats);
        compareToSet.addEquipmentStats(newEquipStats);
        const itemsRemovedOnEquip = compareToSet.getItemsAddedOnEquip(item);
        itemsRemovedOnEquip.forEach(({
            item
        }) => {
            newEquipStats.remItemStats(item);
        });
        newEquipStats.addItemStats(item);
        equipStatKeys.forEach((key) => {
            let statDiff = newEquipStats[key] - currentEquipStats[key];
            const diffElem = document.getElementById(`item-view-dif-${key}`);
            let diffText = '';
            let diffType = 1 /* DiffType.Neutral */ ;
            if (key !== 'attackSpeed') {
                if (statDiff > 0) {
                    diffText = `+${statDiff}`;
                    diffType = 2 /* DiffType.Positive */ ;
                } else if (statDiff < 0) {
                    diffText = `${statDiff}`;
                    diffType = 0 /* DiffType.Negative */ ;
                }
            } else if (item.validSlots[0].id === "melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ || item.occupiesSlot("melvorD:Weapon" /* EquipmentSlotIDs.Weapon */ )) {
                statDiff = (newEquipStats.attackSpeed || 4000) - (currentEquipStats.attackSpeed || 4000);
                statDiff /= 1000;
                if (statDiff > 0) {
                    diffText = `+${templateLangString('MENU_TEXT_SECONDS_SHORT', { seconds: `${statDiff}` })}`;
                    diffType = 0 /* DiffType.Negative */ ;
                } else if (statDiff < 0) {
                    diffText = `${templateLangString('MENU_TEXT_SECONDS_SHORT', { seconds: `${statDiff}` })}`;
                    diffType = 2 /* DiffType.Positive */ ;
                }
            }
            diffElem.textContent = diffText;
            switch (diffType) {
                case 0 /* DiffType.Negative */ :
                    diffElem.className = 'text-danger';
                    break;
                case 1 /* DiffType.Neutral */ :
                    diffElem.className = '';
                    break;
                case 2 /* DiffType.Positive */ :
                    diffElem.className = 'text-success';
                    break;
            }
        });
        game.damageTypes.forEach((damageType) => {
            const el = resistanceMenus.viewItemStats.get(damageType);
            if (el === undefined)
                return;
            const newValue = newEquipStats.getResistance(damageType);
            const currentValue = currentEquipStats.getResistance(damageType);
            const diffValue = newValue - currentValue;
            diffValue !== 0 ? el.showResistanceDiff() : el.hideResistanceDiff();
            el.updateResistanceDiff(diffValue);
            if (!hiddenResistAlreadyShown && damageType.onlyShowIfUsing) {
                const shouldShow = currentValue !== 0 || newValue !== 0 || game.combat.isDamageTypeInUse(damageType);
                el.toggleResistanceView(shouldShow);
            }
        });
    } else {
        equipStatKeys.forEach((key) => {
            document.getElementById(`item-view-dif-${key}`).textContent = '';
        });
    }
    if (game.isGolbinRaid)
        $('.modal').css('z-index', '2000');
    else
        $('.modal').css('z-index', '1050');
    $('#modal-item-stats').modal('show');
}
/** Views the stats of the player's currently equipped items */
function viewEquipmentStats() {
    const player = game.isGolbinRaid ? game.golbinRaid.player : game.combat.player;
    $('#item-view-name-current').text(getLangString('COMBAT_MISC_EQUIPPED_ITEMS'));
    $('#item-view-img-current').attr('src', assets.getURI("assets/media/skills/combat/combat.png" /* Assets.Combat */ ));
    const damageTypeElem = document.getElementById('item-view-current-damage-type');
    if (damageTypeElem !== null) {
        damageTypeElem.textContent = player.damageType.name;
        damageTypeElem.className = player.damageType.spanClass;
    }
    const damageTypeIconElem = document.getElementById('item-view-current-damage-type-icon');
    if (damageTypeIconElem !== null)
        damageTypeIconElem.src = player.damageType.media;
    const attackSpeedElem = document.getElementById('item-view-current-attackSpeed');
    if (attackSpeedElem !== null) {
        attackSpeedElem.textContent = templateLangString('MENU_TEXT_SECONDS_SHORT', {
            seconds: `${player.stats.attackInterval / 1000}`,
        });
    }
    equipStatKeys.forEach((key) => {
        if (key === 'attackSpeed')
            return;
        if (key === 'magicDamageBonus')
            $(`#item-view-current-${key}`).text(formatPercent(player.equipmentStats[key]));
        else
            $(`#item-view-current-${key}`).text(player.equipmentStats[key]);
        if (player.equipmentStats[key] > 0) {
            $(`#item-view-current-${key}`).addClass('text-success');
            $(`#item-view-current-${key}`).removeClass('text-danger');
        } else {
            $(`#item-view-current-${key}`).addClass('text-danger');
            $(`#item-view-current-${key}`).removeClass('text-success');
        }
    });
    // Currently we show the value of equipment resistance stats not including any +/- modifiers
    game.damageTypes.forEach((damageType) => {
        const el = resistanceMenus.viewEquipmentStats.get(damageType);
        if (el === undefined)
            return;
        const value = player.equipmentStats.getResistance(damageType);
        el.updateResistanceValue(value);
        el.updateResistanceSpan(value);
        if (damageType.onlyShowIfUsing) {
            const shouldShow = value !== 0 || game.combat.isDamageTypeInUse(damageType);
            el.toggleResistanceView(shouldShow);
        }
    });
    $('#modal-item-stats-current').modal('show');
}
/** Callback function for viewing the drops of a monster
 * @param monster The ID of the monster to view the drops of
 * @param respectArea Whether the drops should obey the type of combat area the player is currently in
 */
function viewMonsterDrops(monster, respectArea) {
    SwalLocale.fire({
        title: monster.name,
        html: game.combat.getMonsterDropsHTML(monster, respectArea),
        imageUrl: monster.media,
        imageWidth: 128,
        imageHeight: 128,
        imageAlt: monster.name,
    });
}
/** Currently select combat menu */
let selectedCombatMenu = 0 /* CombatMenuId.Equipment */ ;

function changeCombatMenu(id) {
    if (id === 1 /* CombatMenuId.Spellbook */ && !game.altMagic.isUnlocked && !game.isGolbinRaid) {
        lockedSkillAlert(game.altMagic, 'SKILL_UNLOCK_ACCESS_THIS');
    } else if (id === 2 /* CombatMenuId.Prayer */ && !game.prayer.isUnlocked && !game.isGolbinRaid) {
        lockedSkillAlert(game.prayer, 'SKILL_UNLOCK_ACCESS_THIS');
    } else if (id === 5 /* CombatMenuId.Slayer */ && !game.slayer.isUnlocked) {
        lockedSkillAlert(game.slayer, 'SKILL_UNLOCK_ACCESS_THIS');
    } else {
        hideElement(combatMenus.menuPanels[selectedCombatMenu]);
        combatMenus.menuTabs[selectedCombatMenu].classList.remove('border', 'border-2x', 'border-combat-outline');
        selectedCombatMenu = id;
        showElement(combatMenus.menuPanels[id]);
        combatMenus.menuTabs[id].classList.add('border', 'border-2x', 'border-combat-outline');
    }
}

function togglePlayerContainer() {
    $('#combat-player-container').toggleClass('d-mobile-none');
}
/** Callback function that changes the summoning category */
function switchSummoningCategory(category) {
    switch (category.type) {
        case 'Synergy':
            openSynergiesBreakdown();
            break;
        case 'Mark':
            $('#summoning-mark-element').removeClass('d-none');
            $('#summoning-creation-element').addClass('d-none');
            summoningMarkMenu.showMarksInCategory(category, game.summoning);
            switchToCategory(summoningSelectionTabs)(category);
            break;
        case 'Tablet':
            $('#summoning-mark-element').addClass('d-none');
            $('#summoning-creation-element').removeClass('d-none');
            switchToCategory(summoningSelectionTabs)(category);
            break;
    }
}
/** Callback function that opens the summoning synergy breakdown menu */
function openSynergiesBreakdown() {
    var _a;
    if (!game.summoning.isUnlocked) {
        lockedSkillAlert(game.summoning, 'SKILL_UNLOCK_OPEN_MENU');
    } else {
        summoningSearchMenu.updateVisibleElementUnlocks();
        summoningSearchMenu.updateVisibleElementQuantities();
        $('#modal-summoning-synergy').modal('show');
        let markToShow;
        if (((_a = game.openPage) === null || _a === void 0 ? void 0 : _a.action) !== undefined) {
            const action = game.openPage.action;
            if (action instanceof Skill)
                markToShow = game.summoning.getMarkForSkill(action);
        }
        if (markToShow !== undefined && game.summoning.getMarkLevel(markToShow) > 0)
            summoningSearchMenu.showSynergiesWithMark(markToShow);
        else
            summoningSearchMenu.showAllSynergies();
    }
}
/** Callback function that opens the browse corruptions menu */
function openBrowseCorruption() {
    if (!cloudManager.hasItAEntitlementAndIsEnabled || game.corruption === undefined)
        return;
    if (!game.corruption.isUnlocked) {
        lockedSkillAlert(game.corruption, 'SKILL_UNLOCK_OPEN_MENU');
    } else {
        browseCorruptionMenu.updateUnlockedStatus();
        $('#modal-browse-corruptions').modal('show');
        combatMenus.menuTabs[7 /* CombatMenuId.Corruption */ ].classList.remove('glow-animation');
        localStorage.setItem('corruptionMenuGlow', '1');
    }
}
let skillsMenu = true;
let combatMenu = true;
/** Callback function for hiding Combat/Non-Combat skills in the sidebar */
function toggleMenu(menu) {
    const c = [6, 7, 8, 9, 12, 16, 17, 18];
    const m = [0, 1, 2, 3, 4, 5, 10, 13, 14, 15, 19];
    if (menu === 0) {
        for (let i = 0; i < c.length; i++) {
            $('#nav-skill-tooltip-' + c[i]).toggleClass('d-none');
        }
        if (combatMenu) {
            $('#skill-menu-icon-1').attr('class', 'far fa-eye-slash text-muted ml-1');
            combatMenu = false;
        } else {
            $('#skill-menu-icon-1').attr('class', 'far fa-eye text-muted ml-1');
            combatMenu = true;
        }
    } else if (menu === 1) {
        $($('.nav-main-heading')[4]).nextUntil('[id=nav-main-heading]').toggleClass('d-none');
        //$('#farming-glower').toggleClass('d-none');
        if (skillsMenu) {
            $('#skill-menu-icon').attr('class', 'far fa-eye-slash text-muted ml-1');
            skillsMenu = false;
        } else {
            $('#skill-menu-icon').attr('class', 'far fa-eye text-muted ml-1');
            skillsMenu = true;
        }
    }
}
/** Callback function for hiding/showing the combat skill progress table */
function toggleCombatSkillMenu() {
    $('#combat-skill-progress-table').toggleClass('d-none');
    $('#combat-skill-menu-open').toggleClass('d-none');
    $('#combat-skill-menu-closed').toggleClass('d-none');
}
/** Callback function for viewing a game guide */
function viewGameGuide() {
    const page = game.openPage;
    if (page === undefined || !page.hasGameGuide)
        return;
    game.pages.forEach((page) => {
        if (page.hasGameGuide) {
            $(`#tutorial-page-${page.localID}`).addClass('d-none');
            $(`#tutorial-page-${page.localID}-1`).addClass('d-none');
        }
    });
    if (setLang === 'en')
        $(`#tutorial-page-${page.localID}`).removeClass('d-none');
    else
        $(`#tutorial-page-${page.localID}-1`).removeClass('d-none');
    $('#modal-game-guide').modal('show');
}
/** @deprecated Callback function for agreeing to a notice? */
function agreeToNotice(noticeID) {
    switch (noticeID) {
        case 0:
            $('#game-notice-0').addClass('d-none');
            $('#character-selection-container').removeClass('d-none');
            break;
    }
}

function openLink(url) {
    if (nativeManager.isSteam || nativeManager.isEpicGames) {
        try {
            // TODO: Replace with workaround for opening separated child process for NW.js
            parent.nw.Shell.openExternal(url);
        } catch (e) {
            console.warn(`Unable to open URL (${url})`, e);
        }
    } else {
        const newWindow = window.open(url, '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openDiscordLink() {
    if (nativeManager.isSteam || nativeManager.isEpicGames) {
        try {
            parent.nw.Shell.openExternal('https://discord.gg/melvoridle');
        } catch (e) {
            console.warn('Unable to open Discord URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://discord.gg/melvoridle', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openWikiLink() {
    if (nativeManager.isSteam || nativeManager.isEpicGames) {
        try {
            parent.nw.Shell.openExternal('https://wiki.melvoridle.com');
        } catch (e) {
            console.warn('Unable to open Wiki URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://wiki.melvoridle.com', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openExpansionSteamLink() {
    if (nativeManager.isSteam) {
        try {
            parent.nw.Shell.openExternal('https://store.steampowered.com/app/2055140/Melvor_Idle_Throne_of_the_Herald/');
        } catch (e) {
            console.warn('Unable to open Steam URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://store.steampowered.com/app/2055140/Melvor_Idle_Throne_of_the_Herald/', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openExpansion2SteamLink() {
    if (nativeManager.isSteam) {
        try {
            parent.nw.Shell.openExternal('https://store.steampowered.com/app/2492940/Melvor_Idle_Atlas_of_Discovery/');
        } catch (e) {
            console.warn('Unable to open Steam URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://store.steampowered.com/app/2492940/Melvor_Idle_Atlas_of_Discovery/', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openExpansion3SteamLink() {
    if (nativeManager.isSteam) {
        try {
            parent.nw.Shell.openExternal('https://store.steampowered.com/app/2860590/Melvor_Idle_Into_the_Abyss');
        } catch (e) {
            console.warn('Unable to open Steam URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://store.steampowered.com/app/2860590/Melvor_Idle_Into_the_Abyss', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openExpansionEpicLink() {
    if (nativeManager.isEpicGames) {
        try {
            parent.nw.Shell.openExternal('https://store.epicgames.com/p/melvor-idle-throne-of-the-herald-84326d');
        } catch (e) {
            console.warn('Unable to open Epic Games URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://store.epicgames.com/p/melvor-idle-throne-of-the-herald-84326d', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openExpansion2EpicLink() {
    if (nativeManager.isEpicGames) {
        try {
            parent.nw.Shell.openExternal('https://store.epicgames.com/p/melvor-idle-atlas-of-discovery-98f07c');
        } catch (e) {
            console.warn('Unable to open Epic Games URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://store.epicgames.com/p/melvor-idle-atlas-of-discovery-98f07c', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openExpansion3EpicLink() {
    if (nativeManager.isEpicGames) {
        try {
            parent.nw.Shell.openExternal('https://store.epicgames.com/p/melvor-idle-into-the-abyss-8dbc43');
        } catch (e) {
            console.warn('Unable to open Epic URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://store.epicgames.com/p/melvor-idle-into-the-abyss-8dbc43', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function openExpandedEditionSteamLink() {
    if (nativeManager.isSteam) {
        try {
            parent.nw.Shell.openExternal('https://store.steampowered.com/bundle/30301/Melvor_Idle_Expanded_Edition/');
        } catch (e) {
            console.warn('Unable to open Steam URL: ' + e);
        }
    } else {
        const newWindow = window.open('https://store.steampowered.com/bundle/30301/Melvor_Idle_Expanded_Edition/', '_blank');
        if (newWindow !== null)
            newWindow.focus();
    }
}

function viewMonsterStats(monster) {
    monsterStatsModal.setMonster(monster);
    $('#modal-view-monster-info').modal('show');
}
const changePage = (page, subCategory = -1, skill, showRaidShop = false, toggleSidebar = true) => {
    var _a, _b, _c;
    let headerPage = page;
    switch (page.id) {
        case "melvorD:ActiveSkill" /* PageIDs.ActiveSkill */ :
            // Switch the the games currently active skill
            page = game.getPageForActiveAction();
            headerPage = page;
            break;
        case "melvorD:GolbinRaid" /* PageIDs.GolbinRaid */ :
            if (!game.tutorial.complete) {
                SwalLocale.fire({
                    title: getLangString('TUTORIAL_MINIGAME_LOCKED'),
                    html: `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/pets/golden_golbin.png" /* Assets.GolbinRaid */)}"> ${getLangString('TUTORIAL_GOLBIN_RAID_LOCKED')}</h5>
          <h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('TUTORIAL_CONTINUE_TUTORIAL')}</h5>`,
                    icon: 'warning',
                });
                return;
            }
            if (game.isGolbinRaid) {
                // Redirect to combat page, but use golbin raid page for header
                page = game.getPageForActiveAction();
            }
            break;
        case "melvorD:Combat" /* PageIDs.Combat */ :
            if (!game.tutorial.complete && !game.tutorial.allowCombat) {
                SwalLocale.fire({
                    title: getLangString('TUTORIAL_PAGE_LOCKED'),
                    html: `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/skills/combat/combat.png" /* Assets.Combat */)}"> ${getLangString('TUTORIAL_COMBAT_LOCKED')}</h5>
          <h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('TUTORIAL_CONTINUE_TUTORIAL')}</h5>`,
                    icon: 'warning',
                });
                return;
            }
            if (game.isGolbinRaid) {
                // Use golbin raid page for header
                headerPage = game.getPageForActiveAction();
            }
            break;
    }
    if (skill === undefined && page.id !== "melvorD:Combat" /* PageIDs.Combat */ && page.skills !== undefined)
        skill = page.skills[0];
    if (skill !== undefined && !skill.isUnlocked) {
        if (!game.tutorial.complete) {
            // Tutorial is incomplete, show warning to player
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_SKILL_LOCKED'),
                html: `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${skill.media}"> ${templateString(getLangString('TUTORIAL_SKILL_LOCKED'), { skillName: skill.name })}</h5>
			<h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('TUTORIAL_CONTINUE_TUTORIAL')}</h5>`,
                icon: 'warning',
            });
        } else if (!cloudManager.hasFullVersionEntitlement && !isDemoSkill(skill)) {
            // Skill is Full Version only, show premium modal
            nativeManager.buyFullGameSwal();
        } else if (!game.checkRequirements(skill.unlockRequirements)) {
            // Skill has unlock requirements that are not met
            const modalBody = createElement('div', {
                className: 'justify-vertical-center'
            });
            createElement('h5', {
                className: 'font-w600 font-size-base',
                text: getLangString('MUST_MEET_REQUIREMENTS_TO_UNLOCK'),
                parent: modalBody,
            });
            skill.unlockRequirements.forEach((req) => {
                createElement('span', {
                    className: game.checkRequirement(req) ? 'text-success' : 'text-danger',
                    children: req.getNodes('skill-icon-xs mr-1'),
                    parent: modalBody,
                });
            });
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_SKILL_LOCKED'),
                html: modalBody,
                icon: 'warning',
            });
        } else if (game.currentGamemode.allowSkillUnlock) {
            // Gamemode allows skill unlocks, show skill unlock modal
            const unlockCost = game.getSkillUnlockCost();
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_SKILL_LOCKED'),
                html: `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${skill.media}"> ${templateString(getLangString('TUTORIAL_SKILL_LOCKED'), { skillName: skill.name })}</h5>
			<h5 class="font-w400 text-combat-smoke font-size-sm">${templateString(getLangString('MENU_TEXT_UNLOCK_FOR'), {
                    gpIcon: `<img class="skill-icon-xs mr-1" src="${assets.getURI("assets/media/main/coins.png" /* Assets.GPIcon */)}">`,
                    value: `${numberWithCommas(unlockCost)}`,
                })}</h5>`,
                showCancelButton: true,
                icon: 'warning',
                confirmButtonText: getLangString('MENU_TEXT_UNLOCK'),
                showConfirmButton: game.gp.canAfford(unlockCost),
            }).then((result) => {
                if (!result.value)
                    return;
                // @ts-expect-error Skill cannot be mutated beyond this point, so it cannot be undefined.
                skill.unlockOnClick();
            });
        } else {
            // Gamemode does not allow skill unlocks. Show locked modal
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_SKILL_LOCKED'),
                html: `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${skill.media}"> ${templateString(getLangString('TUTORIAL_SKILL_LOCKED'), { skillName: skill.name })}</h5>`,
                showCancelButton: true,
                icon: 'warning',
                showConfirmButton: false,
            });
        }
        return;
    }
    // Hide Current Page
    if (game.openPage !== undefined) {
        const pageElem = $(`#${game.openPage.containerID}`);
        pageElem.addClass('d-none');
        if (game.openPage.displayClass !== undefined)
            pageElem.removeClass(game.openPage.displayClass);
        if (((_a = game.openPage.action) === null || _a === void 0 ? void 0 : _a.onPageLeave) !== undefined)
            game.openPage.action.onPageLeave();
    }
    // Update Page Header
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
        headerTitle.textContent = headerPage.name;
        if (headerPage.name.length > 16) {
            headerTitle.classList.replace('font-size-sm-mobile', 'font-size-xs-mobile');
        } else {
            headerTitle.classList.replace('font-size-xs-mobile', 'font-size-sm-mobile');
        }
    }
    $('#header-icon').attr('src', headerPage.media);
    $('#header-theme').attr('class', `content-header game-page-header ${headerPage.headerBgClass}`);
    $('#page-header').attr('class', headerPage.headerBgClass);
    const headerGameGuide = document.getElementById('game-guide-header-link');
    if (skill !== undefined || page.id === "melvorD:Combat" /* PageIDs.Combat */ )
        headerGameGuide === null || headerGameGuide === void 0 ? void 0 : headerGameGuide.classList.remove('d-none');
    else
        headerGameGuide === null || headerGameGuide === void 0 ? void 0 : headerGameGuide.classList.add('d-none');
    // Set Current Page
    game.openPage = page;
    // Perform UI updates for the new page
    $('#skill-footer-minibar-items-container').addClass('d-none');
    if (((_b = page.action) === null || _b === void 0 ? void 0 : _b.onPageChange) !== undefined)
        page.action.onPageChange();
    // Special page change updates for pages that do not have associated actions
    switch (page.id) {
        case "melvorD:Shop" /* PageIDs.Shop */ :
            game.shop.renderQueue.costs = true;
            game.shop.renderQueue.requirements = true;
            if (showRaidShop) {
                shopMenu.showAllRaidTabs();
            } else {
                shopMenu.showAllTabsButRaid();
            }
            break;
        case "melvorD:Statistics" /* PageIDs.Statistics */ :
            updateStats(selectedStatCategory);
            break;
        case "melvorD:CompletionLog" /* PageIDs.CompletionLog */ :
            showCompletionCategory(subCategory);
            break;
    }
    if (toggleSidebar && !window.matchMedia('(min-width: 992px)').matches) {
        One.layout('sidebar_toggle');
    }
    game.renderQueue.combatMinibar = true;
    game.potions.renderRequired = true;
    if (skill === undefined || !skill.hasMinibar || page.id === "melvorD:Combat" /* PageIDs.Combat */ )
        game.minibar.setSkill();
    else
        game.minibar.setSkill(skill);
    window.scrollTo(0, 0);
    if (page.id === "melvorD:TutorialIsland" /* PageIDs.TutorialIsland */ && !game.tutorial.complete) {
        $('#tutorial-container').addClass('d-none');
    } else if (!game.tutorial.complete) {
        $('#tutorial-container').removeClass('d-none');
    }
    // Show New Page
    const pageElem = $(`#${page.containerID}`);
    pageElem.removeClass('d-none');
    if (page.displayClass !== undefined)
        pageElem.addClass(page.displayClass);
    if (((_c = page.action) === null || _c === void 0 ? void 0 : _c.onPageVisible) !== undefined)
        page.action.onPageVisible();
};
/** Function for reading an lore entry */
function readLore(loreID) {
    $('#modal-book-' + loreID).modal('show');
}

function toggleWikiLinkVisibility() {
    Array.from(document.getElementsByClassName('wiki-link')).forEach((element) => {
        game.settings.showWikiLinks ? element.classList.remove('d-none') : element.classList.add('d-none');
    });
}

function getSummonMaxHitItemDescription(item) {
    let description = '';
    if (item.fitsInSlot("melvorD:Summon1" /* EquipmentSlotIDs.Summon1 */ ) || item.fitsInSlot("melvorD:Summon2" /* EquipmentSlotIDs.Summon2 */ )) {
        let hasMaxHit = false;
        item.equipmentStats.forEach((stat) => {
            if (stat.key === 'summoningMaxhit') {
                description += `<br><span class="text-warning">${templateLangString('BASE_SUMMON_MAX_HIT', {
                    value: numberWithCommas(multiplyByNumberMultiplier(stat.value)),
                })}<br>${templateLangString('SUMMON_DEALS_DAMAGE_TYPE', {
                    damageTypeName: `<img class="skill-icon-xxs mr-1" src="${stat.damageType.media}"><span class="${stat.damageType.spanClass}">${stat.damageType.name}</span>`,
                })}</span>`;
                hasMaxHit = true;
            }
        });
        if (!hasMaxHit)
            description += `<br><span class="text-danger">${getLangString('SUMMON_DOES_NOT_ATTACK')}</span>`;
    }
    return description;
}

function setGameBackgroundImage(image) {
    const currentImage = localStorage.getItem('setBackground');
    const bodyEls = document.getElementsByTagName('body');
    Array.from(bodyEls).forEach((element) => {
        currentImage === null ? element.classList.remove('bg3') : element.classList.remove(`bg${currentImage}`);
        element.classList.add(`bg${image}`);
    });
    const otherEls = document.getElementsByClassName('bg-selection');
    Array.from(otherEls).forEach((element) => {
        element.style.backgroundImage = `url('${assets.getURI(`assets/media/main/bg_${image}.jpg`)}')`;
    });
    localStorage.setItem('setBackground', image);
}

function filterItemsByAbyssalLevel(skill) {
    const itemMap = new Map();
    return game.items.equipment
        .filter((item) => {
            const levelReq = item.equipRequirements.find((req) => req.type === 'AbyssalLevel' && req.skill === skill);
            if (levelReq !== undefined)
                itemMap.set(item, levelReq.level);
            return levelReq !== undefined;
        })
        .sort((a, b) => {
            return itemMap.get(a) - itemMap.get(b);
        })
        .map((item) => {
            return `${item.name}: ${itemMap.get(item)}`;
        });
}
/** Callback function for opening the skill tree modal */
function openSkillTreeModalFromSidebar() {
    if (game.openPage === undefined || game.openPage.skills === undefined || !game.openPage.skills[0].hasSkillTree) {
        game.attack.openSkillTreeModal();
        return;
    }
    if (game.openPage.skills !== undefined) {
        game.openPage.skills[0].openSkillTreeModal();
        return;
    }
    game.attack.openSkillTreeModal();
}

function openCombatTriangleModal() {
    $('#modal-combat-triangle').modal('show');
}

function openViewMonsterListModal() {
    $('#modal-view-monster-list').modal('show');
}

function displayReportContentSwal() {
    SwalLocale.fire({
        title: getLangString('REPORT_INAPPROPRIATE_CONTENT_TITLE'),
        html: templateLangString('REPORT_INAPPROPRIATE_CONTENT', {
            url: `<br><br><a class="pointer-enabled link-fx" onclick="openLink('https://help.jagex.com/hc/en-gb/requests/new?ticket_form_id=23548257838353')">https://help.jagex.com/hc/en-gb/requests/new?ticket_form_id=23548257838353</a>`,
        }),
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: getLangString('CHARACTER_SELECT_45'),
    });
}
//# sourceMappingURL=uiCallbacks.js.map
checkFileVersion('?12097')