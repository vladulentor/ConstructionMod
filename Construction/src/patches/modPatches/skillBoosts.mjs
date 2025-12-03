const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function skillBoostsCompatibility({ patch }) {
    skillBoosts.addNewSkill({

        skill: game.construction,

        realmIDs: ['melvorD:Melvor'],
        header: '#skill-boosts-append',
        noPreservation: false,
        noMastery: true,
        noSummon: true,
        noPotion: false,
        noDoubling: true,
        noInterval: false,
        noConsumable: true,
        noPrimaryResource: false,
        isArtisan: true,
    });
    skillBoosts.addNewModifiers({
        skills: [game.construction],
        modifiers: new Map([['melvorD:Melvor', ['rielkConstruction:skillEfficiencyChance', 'rielkConstruction:skillEfficiencyPotency', 'rielkConstruction:skillEfficiencyCost']]])
    });
    skillBoosts.addNewModifiers({
        skills: [game.fishing],
        modifiers: new Map([['melvorD:Melvor', ['rielkConstruction:loseGPOnFishingBasedOnFish', 'rielkConstruction:fishingTreasureNoReplace']]])
    });
    //scoobs compatibility
    patch(skillBoosts.__proto__.constructor, 'createPetTooltip').after(function (_, container, item) {
        if (item.id === "rielkConstruction:Scoobs") {
            let progress = game.construction.recipeCountByTier.reduce((a, b) => a + b, 0);
            let goal = game.construction.recipeNumber * game.construction.tierMasteries.size;
            const miscContainer = container.querySelector('.sb-font-sm');
            miscContainer.querySelectorAll('.sb-font-2sm').forEach(el => el.remove());
            const elem = document.createElement('span');
            elem.className = 'text-info sb-font-2sm';
            elem.style.marginTop = '4px';
            elem.textContent = `${getLangString('TUTORIAL_MISC_0')}: ${numberWithCommas(progress)}/${numberWithCommas(goal)}`;

            miscContainer.appendChild(elem);
        }
    });



    // Adding furniture to Skillboosts
    // Most of this code is the Music mod's integration that SB has internally, just with its guts changed to construction
    // (thanks slash)
    let ConstructionIntegration;

    class constructionIntegration {
        constructor() {
            this.SB = mod.api.Skill_Boosts.SkillBoosts;
            this.SBMenu = mod.api.Skill_Boosts.SkillBoostsMenu;
            this.Construction = game.construction.__proto__.constructor;
            this.ConstructionFixture = game.construction.fixtures.getObjectByID('rielkConstruction:Apparatus').__proto__.constructor;
            this.init();
        }
        init() {
            this.patchSB();
            this.patchConstruction();
        }
        patchSB() {
            // Add to the renderQueue. This value must be the icon category in all lower-case.
            skillBoosts.renderQueue.fixture = {
                bg: new Set(),
            }

            // Patch SB's functions
            patch(this.SBMenu, 'updateIcon').after(function (_, icon) {
                if (icon?.category === 'Fixture') {
                    let queue = skillBoosts.renderQueue.fixture;
                    // queue.bg.add(icon.item); Adding to the bg render queue is always done inside updateIcon and therefor isn't needed.
                }
            });
            patch(this.SB, 'initSB').after(function (_) {
                ConstructionIntegration.filterFixtures();
            });
            patch(this.SB, 'setIconOnClick').after(function(_, icon, item, category) {
                if (category === 'Fixture') {
                    icon.onclick = () => ConstructionIntegration.fixtureOnClick(icon);
                }
            });
            patch(this.SB, 'render').after(function (_) {
                ConstructionIntegration.renderFixtureBg();
            });
            patch(this.SB, 'createTooltip').after(function (content, item, icon) {
                if (icon.category === 'Fixture') {
                    let container = content.children[0].children[1];
                    ConstructionIntegration.createFixtureTooltip(container, item, icon);
                }
            });

            // Add integration for the red background setting. Must be done during the onModsLoaded lifecycle hook. The `value` must be the icon category (case-sensitive)
            mod.api.Skill_Boosts.redBGOptions.push({ value: 'Fixture', label: getRielkLangString('SKILL_CATEGORY_ Construction_ House') });
        }
        patchConstruction() { 
            patch(this.ConstructionFixture, 'upgrade').after(function (_, construction) {
                if (this.isMaxTier)
                    skillBoosts.removeIcon(this);
                //If a fixture has no more useful bonuses for a skill, it will not be removed from the list, only when it is done
                //This is because checking that would require either recreating the icon (which fails because I don't know how to set tooltips even if I rerun the filter)
                //Or checking the current pushed modifiers from the icon into every skill, removing them, and removing the icon if there are none left, which I won't try
                //me and my big chungus life
            });
        }
        renderFixtureBg() {
            if (skillBoosts.renderQueue.fixture.bg.size === 0)
                return;
            skillBoosts.renderQueue.fixture.bg.forEach(fixture => this.updateFixtureBg(fixture));
            skillBoosts.setIconSearch(); // When updating backgrounds, this must be set to preserve/update the search query
            skillBoosts.renderQueue.fixture.bg.clear();
        }
        filterFixtures() {
            game.construction.fixtures.filter(fixture => !fixture.isMaxTier).forEach(fixture => {
                ConstructionIntegration.filterFixture(fixture);
            });
        }
        filterFixture(fixture) {
            let { statObject, modifiers } = this.getFixtureModifiers(fixture);
            skillBoosts.data.skills.forEach(skill => {

                let { realms, modifiers } = skillBoosts.hasModifiers(skill, skillBoosts.getItemMods(statObject));
                if (realms.length > 0) {
                    // Icon Category (fixture) must match the word used in the render queue. The category is case insensitive - The render queue should be all lower case.
                    return skillBoosts.createIcon(fixture, modifiers, realms, skill, 4, 'Fixture');
                }
            });
        }
        updateFixtureBg(fixture, icon = skillBoosts.getItemIcon(fixture)) {
            if (icon === undefined || fixture.isMaxTier)
                return;

            let recipe = fixture.currentRecipe;
            if (!fixture.getTotalRemainingCost().checkIfOwned()) {
                icon.setBg('sb-red-bg');
            } else if (recipe.level > game.construction.level) {
                icon.setBg('sb-yellow-bg');
            } else {
                icon.setBg('sb-default-bg');
            }

            skillBoosts.hideUndiscoveredIcons(icon, 'Fixture');
        }
        fixtureOnClick(icon) {
            if (skillBoosts.isSpecialModeActive(icon)) {
                return;
            } 
        }
        //We may add special behaviour to this, but since Astrology stars don't, it'd maybe be fine to not.
        getFixtureCost(fixture) {
            let hireModifier = game.construction.manager.getHireCostModifier(fixture),
                { costs, unlocked } = game.construction.manager.calculateHireCost(fixture);

            return Math.floor(costs[unlocked - 1] * (1 + hireModifier / 100));
        }
        getFixtureModifiers(fixture) { // we only care about the fixture tiers we don't yet have.
            let modifiers = fixture.recipes.filter(r => r.tier > fixture.currentTier).flatMap(recipe => recipe.modifiers._stats ?? []),
                statObject = {
                    modifiers: [],
                    enemyModifiers: [],
                    combatEffects: [],
                    conditionalModifiers: []
                };

            modifiers.forEach(modifier => {
                if (modifier.modifiers) {
                    statObject.modifiers.push(...modifier.modifiers);
                }
                if (modifier.enemyModifiers) {
                    statObject.enemyModifiers.push(...modifier.enemyModifiers);
                }
                if (modifier.combatEffects) {
                    statObject.combatEffects.push(...modifier.combatEffects);
                }
                if (modifier.conditionalModifiers) {
                    statObject.conditionalModifiers.push(...modifier.conditionalModifiers);
                }
            });
            return { statObject, modifiers };
        }
        getRecipeModifiers(recipe) {
            let modifiers = Object.entries(recipe.modifiers._stats).map(([key, value]) => ({ [key]: value })),
                statObject = {
                    modifiers: [],
                    enemyModifiers: [],
                    combatEffects: [],
                    conditionalModifiers: []
                };
            modifiers.forEach(modifier => {
                if (modifier.modifiers) {
                    statObject.modifiers.push(...modifier.modifiers);
                }
                if (modifier.enemyModifiers) {
                    statObject.enemyModifiers.push(...modifier.enemyModifiers);
                }
                if (modifier.combatEffects) {
                    statObject.combatEffects.push(...modifier.combatEffects);
                }
                if (modifier.conditionalModifiers) {
                    statObject.conditionalModifiers.push(...modifier.conditionalModifiers);
                }
            });
            return { statObject, modifiers };

        }
        getRomanNumeral(num) { // I hope roman numerals are valid across languages, *shrug*
            const romans = ['I', 'II', 'III ', 'IV', 'V', 'VI', 'VII', 'VIII'];
            return romans[num - 1] || '';
        }
        RecipeModifierSpans(container, complete, isShiny, statObject) {
            let nodes = skillBoosts.getModifierNodes(statObject, 1, 1, true);
            nodes.forEach(node => {
                if (complete) {
                    if (isShiny)
                        node.classList.add('fuck-you');
                    else
                        node.classList.replace('text-success', 'text-warning');
                }
                container.append(node);
            });
        }
        createFixtureTooltip(container, fixture, icon) {
            fixture.recipes.forEach((recipe, i) => {
                let recipeContainer = i !== 0 ? skillBoosts.createDividerElem(container, ' sb-font-sm') : container,
                    { statObject, modifiers } = ConstructionIntegration.getRecipeModifiers(recipe),
                    tierText = createElement('span', { text: templateRielkLangString('MENU_TIER', { tiername: ConstructionIntegration.getRomanNumeral(i + 1) }) });
                recipeContainer.style.fontSize = '1em';
                tierText.style.fontSize = '1.2em';
                tierText.style.fontWeight = 'bold';
                recipeContainer.append(tierText);
                ConstructionIntegration.RecipeModifierSpans(recipeContainer, fixture.currentTier >= i + 1, recipe.shinyMods, statObject);
            })

        }
    }


    ConstructionIntegration = new constructionIntegration();
}   