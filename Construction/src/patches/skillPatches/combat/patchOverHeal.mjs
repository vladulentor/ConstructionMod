export function patchOverHeal(ctx) {

    // A lot of this is game code i have to change only small parts of
    // Also, due to this being a .replace function, this also contains the code for giving the player seeds when eating food

    //Make food list
    const foodList = new Set(); //make the list a set so afk calculations dont slwo down
    game.farming.actions.registeredObjects.forEach((value, key) => {
        if (value.category.id === "melvorD:Allotment")
            foodList.add(key);
    });
    foodList.add("melvorF:Apple"); //Since it's a special case
    ctx.patch(Player, 'autoEat').before(function (shouldEat) {
        this._allowOverheal = !!this.game.modifiers.getValue("rielkConstruction:autoeatOverheal", ModifierQuery.EMPTY);
    })
    ctx.patch(Player, 'lifesteal').before(function (attack, damage, flatBonus) {
        this._allowOverheal = 0;
    })
    ctx.patch(Player, 'autoEat').after(function (_, shouldEat) {
        this._allowOverheal = true;
    }) // don't allow overheal when autoeating unless you get the upgrade

    ctx.patch(Player, 'heal').replace(function (_, amount) {
        amount = (this.game.modifiers.getValue("rielkConstruction:unlockOverHeal", ModifierQuery.EMPTY) && (this._allowOverheal ?? 1))
            ? Math.min(amount, (this.stats.maxHitpoints +
                Math.floor(this.stats.maxHitpoints *
                    (this.game.modifiers.getValue("rielkConstruction:maxOverheal", ModifierQuery.EMPTY) / 100))) -
                this.hitpoints
            )
            : Math.min(amount, this.stats.maxHitpoints - this.hitpoints);
        this.addHitpoints(amount);
        const isOver = this.hitpoints > this.stats.maxHitpoints;
        this.splashManager.add({
            source: isOver ? 'Overheal' : 'Heal',
            amount,
            xOffset: isOver ? this.hitpointsPercent - 100 : this.hitpointsPercent,
        });
        this.renderQueue.damageSplash = true;
        return amount;
    })

    ctx.patch(Player, 'computeMaxHP').replace(function (_) {
        const oldMax = this.stats.maxHitpoints; //so overheal doesn't get reset
        let maxHP = numberMultiplier * this.levels.Hitpoints;
        if (this.damageType.id === "melvorItA:Abyssal" /* DamageTypeIDs.Abyssal */ || this.damageType.id === "melvorItA:Eternal" /* DamageTypeIDs.Eternal */) {
            maxHP = numberMultiplier * Math.min(99, this.levels.Hitpoints);
            maxHP += numberMultiplier * (this.abyssalLevels.Hitpoints * 20);
            maxHP *= 10;
        }
        maxHP = this.modifyMaxHP(maxHP);
        if (this.game.currentGamemode.overrideMaxHitpoints)
            maxHP = this.game.currentGamemode.overrideMaxHitpoints;
        this.stats.maxHitpoints = maxHP;
        const oldCurrent = this.hitpoints;
        if (this.game.modifiers.getValue("rielkConstruction:unlockOverHeal", ModifierQuery.EMPTY)) { // The patched part
            if (this.hitpoints >= maxHP + Math.floor((this.game.modifiers.getValue("rielkConstruction:maxOverheal", ModifierQuery.EMPTY) / 100) * maxHP))
                this.setHitpoints(maxHP + Math.floor((this.game.modifiers.getValue("rielkConstruction:maxOverheal", ModifierQuery.EMPTY) / 100) * maxHP));
        }
        else if (this.hitpoints >= maxHP)
            this.setHitpoints(maxHP);
        this._events.emit('hitpointsChanged', new HitpointsChangedEvent(oldCurrent, oldMax, this.hitpoints, this.stats.maxHitpoints));
    });

    ctx.patch(Player, 'eatFood').replace(function (_, quantity = 1, interrupt = true, efficiency = 100) {
        const item = this.food.currentSlot.item; // Don't eat when overhealed
        if ((this.game.modifiers.getValue("rielkConstruction:unlockOverHeal", ModifierQuery.EMPTY) && (this.stats.maxHitpoints + Math.floor((this.game.modifiers.getValue("rielkConstruction:maxOverheal", ModifierQuery.EMPTY) / 100) * this.stats.maxHitpoints)) === this.hitpoints)
            || (!this.game.modifiers.getValue("rielkConstruction:unlockOverHeal", ModifierQuery.EMPTY) && this.stats.maxHitpoints === this.hitpoints) ||
            (item === this.game.emptyFoodItem &&
                (!this.game.settings.enableAutoSwapFood || this.modifiers.autoSwapFoodUnlocked < 1))) {
            return;
        }
        else if (this.food.currentSlot.quantity < 1 &&
            this.modifiers.autoSwapFoodUnlocked > 0 &&
            this.game.settings.enableAutoSwapFood) {
            const nonEmptySlot = this.food.slots.findIndex((slot) => slot.item !== this.game.emptyFoodItem);
            if (nonEmptySlot >= 0) {
                const oldFood = this.food.currentSlot.item;
                this.food.setSlot(nonEmptySlot);
                this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
            }
            else {
                return;
            }
        }
        let healingAmount = quantity * Math.max(Math.floor((this.getFoodHealing(item) * efficiency) / 100), 1);
        healingAmount = this.heal(healingAmount);
        this.addItemStat(item, ItemStats.TimesEaten, quantity);
        this.manager.addCombatStat(CombatStats.FoodConsumed, quantity);
        this.addItemStat(item, ItemStats.HealedFor, healingAmount);
        this.manager.addCombatStat(CombatStats.HPFromFood, healingAmount);
        if (!rollPercentage(this.modifiers.getFoodPreservationChance())) {
            const oldFood = this.food.currentSlot.item;
            this.food.consume(quantity);
            this.onSelectedFoodChange(oldFood, this.food.currentSlot.item);
            this.renderQueue.food = true;
        }
        if (interrupt)
            this.interruptAttack();
        if (foodList.has(item.id) && rollPercentage(this.modifiers.getValue("rielkConstruction:getSeedsFromFood", ModifierQuery.EMPTY)))
            game.bank.addItem(game.farming.actions.registeredObjects.get(item.id).seedCost.item, 1, false, true, false, true, "Seed Getback");
        const event = new FoodEatenEvent(item, quantity, healingAmount);
        this._events.emit('foodEaten', event);
    });

    ctx.patch(Player, 'regen').replace(function (_) {
        if (this.game.modifiers.getValue("rielkConstruction:unlockOverHeal", ModifierQuery.EMPTY)) {
            this.regenOverheal = !!this.game.modifiers.getValue("rielkConstruction:regenOverheal", ModifierQuery.EMPTY);
        }
        let changedRegenInterval = this.hpRegenInterval;
        if (this.hitpoints >= this.stats.maxHitpoints) {
            let regen = this.stats.maxHitpoints / 100;
            regen += numberMultiplier * this.modifiers.flatHPRegen;
            if (this.modifiers.hPRegenBasedOnMaxHP > 0) {
                regen += this.modifiers.hPRegenBasedOnMaxHP * (this.stats.maxHitpoints / 100);
            }
            regen += this.bufferedRegen;
            switch (this.attackType) {
                case 'melee':
                    regen += (this.modifiers.flatHPRegenBasedOnMeleeMaxHit * this.stats.maxHit) / 100;
                    break;
                case 'ranged':
                    regen += (this.modifiers.flatHPRegenBasedOnRangedMaxHit * this.stats.maxHit) / 100;
                    break;
                case 'magic':
                    regen += (this.modifiers.flatHPRegenBasedOnMagicMaxHit * this.stats.maxHit) / 100;
                    break;
            }
            let regenModifier = this.modifiers.hitpointRegeneration;
            if (this.modifiers.hpRegenWhenEnemyHasMoreEvasion > 0 &&
                this.manager.fightInProgress &&
                this.stats.averageEvasion < this.target.stats.averageEvasion)
                regenModifier += this.modifiers.hpRegenWhenEnemyHasMoreEvasion;
            if (this.manager.onSlayerTask)
                regenModifier += this.modifiers.hitpointRegenerationAgainstSlayerTasks;
            regen = applyModifier(regen, regenModifier);
            if (!this.regenOverheal && this.hitpoints > this.stats.maxHitpoints) {
                regen *= -0.5; // quintuple negative regen going into max hp
                regen = Math.max(regen, -1 * (this.hitpoints - this.stats.maxHitpoints));
                regen = Math.trunc(regen);
                regen = this.heal(regen);
                if (this.hitpoints > this.stats.maxHitpoints)
                    changedRegenInterval /= 20;
                // This kind of anti regen shouldn't be activating prayers or taking away money from not regenning. Idk if not making it emit an event is a good idea though.
            }
            else if (this.regenOverheal) {
                regen = Math.min(regen, (this.stats.maxHitpoints + Math.floor((this.game.modifiers.getValue("rielkConstruction:maxOverheal", ModifierQuery.EMPTY) / 100) * this.stats.maxHitpoints)) - this.hitpoints)
                regen = Math.floor(regen);
                if (regen) {
                    regen = this.heal(regen);
                    this.modifiers.forEachCurrency("melvorD:currencyGainOnRegenBasedOnHPGained" /* ModifierIDs.currencyGainOnRegenBasedOnHPGained */, (value, currency) => {
                        const amountToAdd = regen * (value / numberMultiplier / 100);
                        if (amountToAdd > 0)
                            this.manager.addCurrency(currency, amountToAdd, 'HPRegen');
                    });
                    this.activePrayers.forEach((prayer) => {
                        !prayer.isAbyssal
                            ? this.consumePrayerPoints(prayer.pointsPerRegen, prayer.isUnholy)
                            : this.consumeSoulPoints(prayer.pointsPerRegen);
                    });
                    const regenEvent = new HitpointRegenerationEvent(regen);
                    this._events.emit('hitpointRegen', regenEvent);
                }
            }
        }
        else if (this.hitpoints < this.stats.maxHitpoints && this.allowRegen) {
            let regen = this.stats.maxHitpoints / 100;
            regen += numberMultiplier * this.modifiers.flatHPRegen;
            if (this.modifiers.hPRegenBasedOnMaxHP > 0) {
                regen += this.modifiers.hPRegenBasedOnMaxHP * (this.stats.maxHitpoints / 100);
            }
            regen += this.bufferedRegen;
            switch (this.attackType) {
                case 'melee':
                    regen += (this.modifiers.flatHPRegenBasedOnMeleeMaxHit * this.stats.maxHit) / 100;
                    break;
                case 'ranged':
                    regen += (this.modifiers.flatHPRegenBasedOnRangedMaxHit * this.stats.maxHit) / 100;
                    break;
                case 'magic':
                    regen += (this.modifiers.flatHPRegenBasedOnMagicMaxHit * this.stats.maxHit) / 100;
                    break;
            }
            let regenModifier = this.modifiers.hitpointRegeneration;
            if (this.modifiers.hpRegenWhenEnemyHasMoreEvasion > 0 &&
                this.manager.fightInProgress &&
                this.stats.averageEvasion < this.target.stats.averageEvasion)
                regenModifier += this.modifiers.hpRegenWhenEnemyHasMoreEvasion;
            if (this.manager.onSlayerTask)
                regenModifier += this.modifiers.hitpointRegenerationAgainstSlayerTasks;
            regen = applyModifier(regen, regenModifier);
            regen = Math.floor(regen);
            regen = this.heal(regen);
            this.modifiers.forEachCurrency("melvorD:currencyGainOnRegenBasedOnHPGained" /* ModifierIDs.currencyGainOnRegenBasedOnHPGained */, (value, currency) => {
                const amountToAdd = regen * (value / numberMultiplier / 100);
                if (amountToAdd > 0)
                    this.manager.addCurrency(currency, amountToAdd, 'HPRegen');
            });
            this.activePrayers.forEach((prayer) => {
                !prayer.isAbyssal
                    ? this.consumePrayerPoints(prayer.pointsPerRegen, prayer.isUnholy)
                    : this.consumeSoulPoints(prayer.pointsPerRegen);
            });
            const regenEvent = new HitpointRegenerationEvent(regen);
            this._events.emit('hitpointRegen', regenEvent);
        }
        this.bufferedRegen = 0;
        this.timers.regen.start(changedRegenInterval);
    });


    // make it look professional
    SplashManager.splashClasses.Overheal = 'construction-success';
    ctx.patch(Character, 'renderHitpoints').after(function (_) {
        const isOverheal = this.hitpoints > this.stats.maxHitpoints;

        if (isOverheal) {
            const overPercent = (Math.min((this.hitpoints / this.stats.maxHitpoints) - 1, 1) * 100).toFixed(1);
            this.statElements.hitpoints.forEach((elem) => (elem.classList.add('construction-success')));
            this.statElements.hitpointsBar.forEach(elem => {
                const color = getComputedStyle(elem).backgroundColor;
                elem.style.background = `linear-gradient(
      to right,
      #fca32f 0%,
      #fca32f ${overPercent}%,
      ${color} ${overPercent}%,
      ${color} 100%
    )`;

                this.statElements.hitpointsBar[0].parentElement.parentElement.parentElement.children[3].children[0].children[0].children[0].classList.add('orange-heart'); //combat heart icon
                this.statElements.hitpointsBar[2].parentElement.parentElement.children[0].children[0].classList.add('orange-heart'); //thieving heart icon
                // queryselectors cower in fear, for I am the DOM walker
                this.displayOverheal = true;
            });
        }
        else {
            if (this.displayOverheal) {
                this.statElements.hitpointsBar.forEach(elem => {
                    const color = getComputedStyle(elem).backgroundColor; // The only reason this isn't hardcoded is damage indicators (the mod) can change the HP bar color
                    elem.style.background = `${color}`;
                });
                this.statElements.hitpoints.forEach((elem) => (elem.classList.remove('construction-success')));
                this.statElements.hitpointsBar[0].parentElement.parentElement.parentElement.children[3].children[0].children[0].children[0].classList.remove('orange-heart'); //combat heart icon
                this.statElements.hitpointsBar[2].parentElement.parentElement.children[0].children[0].classList.remove('orange-heart'); //thieving heart icon

                this.displayOverheal = false;
            }
        }
    })

}
