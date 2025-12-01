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
                cost: new Set()
            }

            // Patch SB's functions
            patch(this.SBMenu, 'updateIcon').after(function (_, icon) {
                if (icon?.category === 'Fixture') {
                    let queue = skillBoosts.renderQueue.fixture;
                    // queue.bg.add(icon.item); Adding to the bg render queue is always done inside updateIcon and therefor isn't needed.
                    queue.cost.add(icon.item);
                }
            });
            patch(this.SB, 'initSB').after(function (_) {
                ConstructionIntegration.filterFixtures();
            });
            /*patch(this.SB, 'setIconOnClick').after(function(_, icon, item, category) {
                if (category === 'Fixture') {
                    icon.onclick = () => constructionIntegration.fixtureOnClick(icon);
                }
            });*/
            /*patch(this.SB, 'render').after(function (_) {
                ConstructionIntegration.renderFixtureBg();
                ConstructionIntegration.renderFixtureCost();
            });*/
            patch(this.SB, 'createTooltip').after(function (content, item, icon) {
                if (icon.category === 'Fixture') {
                    let container = content.children[0].children[1];
                    ConstructionIntegration.createFixtureTooltip(container, item, icon);
                }
            });

            // Add integration for the red background setting. Must be done during the onModsLoaded lifecycle hook. The `value` must be the icon category (case-sensitive)
            mod.api.Skill_Boosts.redBGOptions.push({ value: 'Fixture', label: skillBoosts.getLang('INSTRUMENT') });
        }
        patchConstruction() {
            patch(this.Construction, 'computeProvidedStats').after(function (_) {
                skillBoosts.getCategoryIcons('Fixture', true).forEach(fixture => {
                    ConstructionIntegration.updateFixtureBg(fixture);
                });
            });
        }
        renderFixtureBg() {
            if (skillBoosts.renderQueue.fixture.bg.size === 0)
                return;
            skillBoosts.renderQueue.fixture.bg.forEach(fixture => this.updateFixtureBg(fixture));
            skillBoosts.setIconSearch(); // When updating backgrounds, this must be set to preserve/update the search query
            skillBoosts.renderQueue.fixture.bg.clear();
        }
        renderFixtureCost() {
            if (skillBoosts.renderQueue.fixture.cost.size === 0)
                return;
            skillBoosts.renderQueue.fixture.cost.forEach(fixture => this.updateFixtureCost(fixture));
            skillBoosts.renderQueue.fixture.cost.clear();
        }
        filterFixtures() {
            game.construction.fixtures.forEach(fixture => {
                let processedSkills = [],
                    { statObject, modifiers } = this.getFixtureModifiers(fixture);

                skillBoosts.data.skills.forEach(skill => {
                    let { realms, modifiers } = skillBoosts.hasModifiers(skill, skillBoosts.getItemMods(statObject));
                    if (realms.length > 0) {
                        // Icon Category (fixture) must match the word used in the render queue. The category is case insensitive - The render queue should be all lower case.
                        let icon = skillBoosts.createIcon(fixture, modifiers, realms, skill, 0, 'Fixture');
                        icon.createText();
                    }
                });
            });
        }
        updateFixtureBg(fixture, icon = skillBoosts.getItemIcon(fixture)) {
            if (icon === undefined)
                return;

            if (game.construction.bards.isHired(fixture)) {
                icon.setBg('sb-green-bg');
            } else if (!game.construction.isBasicSkillRecipeUnlocked(fixture)) {
                icon.setBg('sb-red-bg');
            } else if (!game.gp.canAfford(this.getFixtureCost(fixture))) {
                icon.setBg('sb-yellow-bg');
            } else {
                icon.setBg('sb-default-bg');
            }

            skillBoosts.hideUndiscoveredIcons(icon, 'Fixture');
        }
        updateFixtureCost(fixture, icon = skillBoosts.getItemIcon(fixture), hideIcons = true) {
            if (icon === undefined)
                return;

            let gpCost = this.getFixtureCost(fixture);
            if (gpCost === undefined)
                return icon.setText(0);

            icon.setText(gpCost);
        }
        /*fixtureOnClick(icon) {
            if (skillBoosts.isSpecialModeActive(icon)) {
                return;
            } else if (game.music.isBasicSkillRecipeUnlocked(icon.item)) {
                game.music.hire(icon.item);
            }
        }*/
        //We may add special behaviour to this, but since Astrology stars don't, it'd maybe be fine to not.
        getFixtureCost(fixture) {
            let hireModifier = game.construction.manager.getHireCostModifier(fixture),
                { costs, unlocked } = game.construction.manager.calculateHireCost(fixture);

            return Math.floor(costs[unlocked - 1] * (1 + hireModifier / 100));
        }
        getFixtureModifiers(fixture) {
            let modifiers = fixture.recipes
                .flatMap(recipe => recipe.modifiers._stats) ?? [],
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
            console.log("flatmap", modifiers);
            console.log("statObject", statObject);
            return { statObject, modifiers };
        }
        createFixtureTooltip(container, fixture, icon) {
            let { statObject, modifiers } = this.getFixtureModifiers(fixture),
                modifierContainer = skillBoosts.createModifierTooltip(container, fixture, statObject);

        }
    }


    ConstructionIntegration = new constructionIntegration();
}   