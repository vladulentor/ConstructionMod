const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');
const { createOrangeNotification } = await loadModule('src/interface/elements/constructionEfficiencyNotification.mjs');

const { EfficiencyIconElement } = await loadModule('src/interface/elements/constructionEfficiencyIconElement.mjs');


export function addEfficiencyToOffSkills({ patch, onInterfaceReady }) {

    //---------------              LOGIC
    const skills = [Crafting, Fletching];
    for (const oSkill of skills) {
        oSkill.prototype.getEfficiencyChance = function (action) {
            return this.game.modifiers.getValue("rielkConstruction:unlockEfficiencySkill", this.getActionModifierQuery(action)) && action.realm._localID == "Melvor" ? game.construction.getEfficiencyChance(action) / 2 : 0;
        }

        oSkill.prototype.getEfficiencyCostMultiplier = function (action) {
            return this.game.construction.getEfficiencyCostMultiplier(action);
        }
        oSkill.prototype.getEfficiencyPotencyMultiplier = function (action) {
            return game.construction.getEfficiencyPotencyMultiplier(action);
        }
        oSkill.prototype.applyEfficiencyProductMultipliers = function (item, quantity, action, query) {

            return this.getEfficiencyPotencyMultiplier(action);
        }
        oSkill.prototype.getEfficiencyChancePotencySources = function (action, half = 0.5) {
            return game.construction.getEfficiencyChancePotencySources(action, half);
        }
        patch(oSkill, "render").after(function () { });
        patch(oSkill, "preAction").before(function () {
            if (rollPercentage(this.getEfficiencyChance(this.activeRecipe))) this.efficient = true;
            if (game.construction.notifs && this.efficient && !game.settings.useLegacyNotifications) {
                createOrangeNotification({
                    text: getRielkLangString('TOASTS_EFFICIENCY'),
                    quantity: this.getEfficiencyPotencyMultiplier(this.activeRecipe)
                });
            }

        })

        patch(oSkill, "modifyPrimaryProductQuantity").replace(function (_, item, quantity, action, effect) {
            const query = this.getActionModifierQuery(action);
            quantity += this.getFlatBasePrimaryProductQuantityModifier(item, query);
            quantity += this.getRandomFlatBasePrimaryProductQuantity(item, query);
            quantity *= this.efficient ? this.applyEfficiencyProductMultipliers(item, quantity, action, query) : 1;
            quantity *= 1 + this.getBasePrimaryProductQuantityModifier(item, query) / 100;
            quantity = Math.floor(quantity);
            quantity = this.applyPrimaryProductMultipliers(item, quantity, action, query);
            quantity += this.getFlatAdditionalPrimaryProductQuantity(item, query);
            quantity += this.getRandomFlatAdditionalPrimaryProductQuantity(item, action, query);
            return Math.max(quantity, 1);

        })
        patch(oSkill, "postAction").after(function (_) {
            this.efficient = false;
        })
        patch(oSkill, "getMasteryXPToAddForAction").after(function (ret, action, interval) {
            if (this.efficient)
                return ret * this.getEfficiencyPotencyMultiplier(action);
        })
        //Funnily enough this part is not how I do it in Construction so if it breaks then I'm the biggest idiot of the day
        patch(oSkill, "modifyItemCost").before(function (item, quantity, recipe) {
            if (this.efficient) {
                return [item, quantity * this.getEfficiencyCostMultiplier(recipe), recipe];
            }
            //returns same on false
        });
        patch(oSkill, "actionRewards").get(function (orig) {
            const rew = orig.call();
            if (this.efficient)    // - 1 since it's adding ontop of the base game's.
            { rew.addXP(this, Math.floor(this.actionXP * Math.max(0, this.getEfficiencyPotencyMultiplier(this.activeRecipe) - 1)), this.activeRecipe); }
            return rew;
        });


        //--------------- UI (I HATE THIS SHIT)
        //Replace because of optimization. If we do an .after patch it will run on every render loop even when the render flag is set to false.
        patch(oSkill, "renderRecipeInfo").replace(function (_) {
            if (!this.renderQueue.recipeInfo) return;
            const recipe = this.masteryAction;
            const masteryXPToAdd = this.getMasteryXPToAddForAction(recipe, this.masteryModifiedInterval);
            const baseMasteryXP = this.getBaseMasteryXPToAddForAction(recipe, this.masteryModifiedInterval);
            this.menu.updateGrants(this.modifyXP(this.actionXP), this.actionXP, masteryXPToAdd, baseMasteryXP, this.getMasteryXPToAddToPool(masteryXPToAdd), this.activeRecipe.realm);
            this.menu.updateGrantsSources(this, recipe);
            this.menu.updateChances(this.getPreservationChance(recipe), this.getPreservationCap(recipe), this.getPreservationSources(recipe), this.getDoublingChance(recipe), this.getDoublingSources(recipe));
            const query = this.getActionModifierQuery(recipe);
            this.menu.updateAdditionalPrimaryQuantity(this.getFlatAdditionalPrimaryProductQuantity(this.actionItem, query), this.getAdditionalPrimaryResourceQuantitySources(query));
            this.menu.updateCostReduction(this.getCostReduction(recipe), this.getCostReductionSources(recipe));
            this.menu.updateInterval(this.actionInterval, this.getIntervalSources(recipe));
            this.menu.updateAbyssalGrants(this.modifyAbyssalXP(this.actionAbyssalXP), this.actionAbyssalXP);

            //Eff code
            if (!this.game.modifiers.getValue("rielkConstruction:unlockEfficiencySkill", this.getActionModifierQuery(recipe))) return;
            if (!this.menu.efficiencyIcon) {
                this.menu.efficiencyIcon = new EfficiencyIconElement();
                this.menu.productDoubling.after(this.menu.efficiencyIcon);}
            showElement(this.menu.efficiencyIcon);
            this.menu.efficiencyIcon.setChance(this.getEfficiencyChance(recipe), this.getEfficiencyPotencyMultiplier(recipe), this.getEfficiencyCostMultiplier(recipe), this.getEfficiencyChancePotencySources(recipe), "artisan", false);


            this.renderQueue.recipeInfo = false;

        })

    }

}

export function addEfftoSkillBoosts() {
    if (mod.manager.getLoadedModList().includes("Skill Boosts")) {
        skillBoosts.addNewModifiers({
            skills: [game.crafting, game.fletching],
            modifiers: new Map([['melvorD:Melvor', ['rielkConstruction:skillEfficiencyChance', 'rielkConstruction:skillEfficiencyPotency', 'rielkConstruction:skillEfficiencyCost', 'rielkConstruction:bypassEfficiencyChance'
                , 'rielkConstruction:skillEfficiencyChancePerHamrielStar'
            ]]])
        });

    }
}