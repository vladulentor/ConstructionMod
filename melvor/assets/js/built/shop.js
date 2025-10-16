"use strict";
class ShopCategory extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.isGolbinRaid = false;
        this.allowedGamemodes = new Set();
        this._name = data.name;
        this._media = data.media;
        if (data.isGolbinRaid !== undefined)
            this.isGolbinRaid = data.isGolbinRaid;
        if (data.allowedGamemodeIDs !== undefined) {
            data.allowedGamemodeIDs.forEach((id) => {
                const mode = game.gamemodes.getObjectByID(id);
                if (mode === undefined)
                    throw new UnregisteredConstructionError(this, Gamemode.name, id);
                this.allowedGamemodes.add(mode);
            });
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`SHOP_CAT_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
}
/**
 * @deprecated TODO_D - remove this once old currency props removed
 * Returns true if the ShopCostAmount will always be nothing */
function isShopCostZero(cost) {
    return cost.type === 'Fixed' && cost.cost === 0;
}
class ShopPurchase extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this._costs = new Map();
        this._purchaseRequirements = new Map();
        this._defaultPurchaseRequirements = [];
        /** Purchase limit by Gamemode. If unset, no limit exists. */
        this._buyLimitOverrides = new Map();
        this.allowedGamemodes = new Set();
        try {
            this._media = data.media;
            this.category = game.shop.categories.getObjectSafe(data.category);
            this.contains = {
                items: game.items.getQuantities(data.contains.items),
            };
            if (data.contains.itemCharges !== undefined)
                this.contains.itemCharges = game.items.equipment.getQuantity(data.contains.itemCharges);
            if (data.contains.petID !== undefined) {
                this.contains.pet = game.pets.getObjectSafe(data.contains.petID);
            }
            if (data.contains.lootBox)
                this.contains.lootBox = data.contains.lootBox;
            if (data.contains.bankTab)
                this.contains.bankTab = data.contains.bankTab;
            if (StatObject.hasStatsData(data.contains))
                this.contains.stats = new StatObject(data.contains, game, `${ShopPurchase.name} with id "${this.id}"`);
            this._defaultCosts = this.getCostsFromData(data.cost, game);
            this.unlockRequirements = data.unlockRequirements.map((data) => new ShopPurchaseRequirement(data, game));
            data.buyLimitOverrides.forEach(({
                gamemodeID,
                maximum
            }) => {
                const mode = game.gamemodes.getObjectSafe(gamemodeID);
                this._buyLimitOverrides.set(mode, maximum);
            });
            this._defaultBuyLimit = data.defaultBuyLimit;
            this.allowQuantityPurchase = data.allowQuantityPurchase;
            this.showBuyLimit = data.showBuyLimit;
            this.currentDescription = data.currentDescription;
            this._customName = data.customName;
            this._customDescription = data.customDescription;
            if (data.allowedGamemodeIDs !== undefined) {
                data.allowedGamemodeIDs.forEach((id) => {
                    const mode = game.gamemodes.getObjectByID(id);
                    if (mode === undefined)
                        throw new UnregisteredConstructionError(this, Gamemode.name, id);
                    this.allowedGamemodes.add(mode);
                });
            }
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(ShopPurchase.name, e, this.id);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        if (this._customName !== undefined) {
            if (this.isModded) {
                return this._customName;
            } else {
                return getLangString(`SHOP_NAME_${this.localID}`);
            }
        }
        if (this.contains.itemCharges !== undefined) {
            return this.contains.itemCharges.item.name;
        }
        if (this.contains.items.length > 0) {
            return this.contains.items[0].item.name;
        }
        if (this.contains.pet !== undefined) {
            return this.contains.pet.name;
        }
        return 'Error: No Purchase Name.';
    }
    get englishName() {
        var _a;
        return (_a = this._customName) !== null && _a !== void 0 ? _a : '';
    }
    get englishDescription() {
        var _a;
        return (_a = this._customDescription) !== null && _a !== void 0 ? _a : '';
    }
    get hasCustomName() {
        return this._customName !== undefined;
    }
    get hasCustomDescription() {
        return this._customDescription !== undefined;
    }
    get description() {
        let desc = '';
        if (this._customDescription !== undefined) {
            if (this.isModded) {
                return this._customDescription;
            } else {
                return getLangString(`SHOP_DESCRIPTION_${this.localID}`);
            }
        }
        if (this.contains.itemCharges !== undefined) {
            return this.contains.itemCharges.item.description;
        }
        if (this.contains.items.length === 1) {
            return this.contains.items[0].item.modifiedDescription;
        }
        if (this.contains.pet !== undefined) {
            return this.contains.pet.description;
        }
        if (this.contains.stats !== undefined) {
            desc = this.contains.stats.describePlain();
        }
        if (this.hasDisabledModifier)
            desc += getLangString('MENU_TEXT_CONTAINS_DISABLED_MODIFIER');
        return desc !== '' ? desc : 'Error: No Purchase Description';
    }
    get hasDisabledModifier() {
        return (this.contains.stats !== undefined &&
            this.contains.stats.modifiers !== undefined &&
            containsDisabledModifier(this.contains.stats.modifiers));
    }
    get costs() {
        var _a;
        return (_a = this._costs.get(game.currentGamemode)) !== null && _a !== void 0 ? _a : this._defaultCosts;
    }
    get purchaseRequirements() {
        var _a;
        return (_a = this._purchaseRequirements.get(game.currentGamemode)) !== null && _a !== void 0 ? _a : this._defaultPurchaseRequirements;
    }
    registerSoftDependencies(data, game) {
        try {
            this._defaultPurchaseRequirements = game.getRequirementsFromData(data.purchaseRequirements);
        } catch (e) {
            throw new DataConstructionError(ShopPurchase.name, e, this.id);
        }
    }
    applyDataModification(modData, game) {
        var _a;
        (_a = modData.buyLimitOverrides) === null || _a === void 0 ? void 0 : _a.forEach(({
            gamemodeID,
            maximum
        }) => {
            const mode = game.gamemodes.getObjectByID(gamemodeID);
            if (mode === undefined)
                throw new Error(`Error modifying ShopPurchase with id: ${this.id}. Gamemode with id: ${gamemodeID} is not registered.`);
            this._buyLimitOverrides.set(mode, maximum);
        });
        if (modData.purchaseRequirements !== undefined) {
            modData.purchaseRequirements.forEach(({
                gamemodeID,
                newRequirements
            }) => {
                const mode = game.gamemodes.getObjectByID(gamemodeID);
                if (mode === undefined)
                    throw new Error(`Error modifying ShopPurchase with id: ${this.id}. Gamemode with id: ${gamemodeID} is not registered.`);
                this._purchaseRequirements.set(mode, game.getRequirementsFromData(newRequirements));
            });
        }
        if (modData.cost !== undefined) {
            modData.cost.forEach(({
                gamemodeID,
                newCosts
            }) => {
                const mode = game.gamemodes.getObjectByID(gamemodeID);
                if (mode === undefined)
                    throw new Error(`Error modifying ShopPurchase with id: ${this.id}. Gamemode with id: ${gamemodeID} is not registered.`);
                this._costs.set(mode, this.getCostsFromData(newCosts, game));
            });
        }
    }
    getBuyLimit(gamemode) {
        var _a;
        let limit = (_a = this._buyLimitOverrides.get(gamemode)) !== null && _a !== void 0 ? _a : this._defaultBuyLimit;
        if (limit === 0)
            limit = Infinity;
        return limit;
    }
    /** Returns the description templated with buyQuantity */
    getTemplatedDescription(shop) {
        return templateString(this.description, this.getDescriptionTemplateData(shop.capPurchaseQuantity(this, shop.buyQuantity)));
    }
    /** Gets template data for the description */
    getDescriptionTemplateData(buyQuantity) {
        const templateData = {};
        templateData.qty = numberWithCommas(buyQuantity);
        this.contains.items.forEach(({
            quantity
        }, i) => {
            templateData[`qty${i + 1}`] = numberWithCommas(quantity * buyQuantity);
        });
        return templateData;
    }
    getCostsFromData(data, game) {
        let currencies = [];
        if (data.currencies !== undefined)
            currencies = data.currencies.map((costData) => {
                const currency = game.currencies.getObjectByID(costData.currency);
                if (currencies === undefined)
                    throw new Error(`Error constructing ShopCosts, currency with id ${costData.currency} is not registered.`);
                return Object.assign(costData, {
                    currency
                });
            });
        // TODO_D - Deprecated properties
        if (data.gp && !isShopCostZero(data.gp))
            currencies.push(Object.assign(data.gp, {
                currency: game.gp
            }));
        if (data.slayerCoins && !isShopCostZero(data.slayerCoins))
            currencies.push(Object.assign(data.slayerCoins, {
                currency: game.slayerCoins
            }));
        if (data.raidCoins && !isShopCostZero(data.raidCoins))
            currencies.push(Object.assign(data.raidCoins, {
                currency: game.raidCoins
            }));
        return {
            currencies,
            items: game.items.getQuantities(data.items),
        };
    }
}
class DummyShopPurchase extends ShopPurchase {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            category: "melvorD:SkillUpgrades" /* ShopCategoryIDs.SkillUpgrades */ ,
            contains: {
                items: [],
            },
            cost: {
                items: [],
            },
            allowQuantityPurchase: false,
            unlockRequirements: [],
            purchaseRequirements: [],
            defaultBuyLimit: 0,
            buyLimitOverrides: [],
            showBuyLimit: false,
        }, game);
    }
}
class ShopUpgradeChain extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this._defaultMedia = "assets/media/main/question.png" /* Assets.QuestionMark */ ;
        try {
            this.rootUpgrade = game.shop.purchases.getObjectSafe(data.rootUpgradeID);
            this._chainName = data.chainName;
            this._defaultName = data.defaultName;
            this._defaultDescription = data.defaultDescription;
            this.nameLang = data.defaultNameLang;
            this.descriptionLang = data.descriptionLang;
            this.chainNameLang = data.chainNameLang;
            if (data.defaultMedia !== undefined)
                this._defaultMedia = data.defaultMedia;
        } catch (e) {
            throw new DataConstructionError(ShopUpgradeChain.name, e, this.id);
        }
    }
    get chainName() {
        if (this.chainNameLang !== undefined)
            return getLangString(this.chainNameLang);
        return this._chainName;
    }
    get defaultName() {
        if (this.nameLang !== undefined)
            return getLangString(this.nameLang);
        return this._defaultName;
    }
    get defaultDescription() {
        if (this.descriptionLang !== undefined)
            return getLangString(this.descriptionLang);
        return this._defaultDescription;
    }
    get media() {
        return this.rootUpgrade.media;
    }
    get defaultMedia() {
        return assets.getURI(this._defaultMedia);
    }
    applyDataModification(modData, game) {
        if (modData.rootUpgradeID !== undefined) {
            const upgrade = game.shop.purchases.getObjectByID(modData.rootUpgradeID);
            if (upgrade === undefined)
                throw new UnregisteredApplyDataModError(this, ShopPurchase.name, modData.rootUpgradeID);
            this.rootUpgrade = upgrade;
        }
    }
}
class ShopRenderQueue {
    constructor() {
        this.requirements = false;
        this.costs = false;
        this.upgrades = false;
    }
}
class Shop extends GameEventEmitter {
    constructor(game) {
        super();
        this.game = game;
        this.providedStats = new StatProvider();
        this.raidStats = new StatProvider();
        /** Stores the number of times an upgrade has been purchased */
        this.upgradesPurchased = new Map();
        this.buyQuantity = 1;
        this.purchasesByItem = new Map();
        this.renderQueue = new ShopRenderQueue();
        this.purchases = new NamespaceRegistry(game.registeredNamespaces, ShopPurchase.name);
        this.upgradeChains = new NamespaceRegistry(game.registeredNamespaces, ShopUpgradeChain.name);
        this.purchaseDisplayOrder = new NamespacedArray(this.purchases);
        this.categories = new NamespaceRegistry(game.registeredNamespaces, ShopCategory.name);
        this.categoryDisplayOrder = new NamespacedArray(this.categories);
    }
    onLoad() {
        this.computeProvidedStats(false);
        this.renderQueue.upgrades = true;
        this.updateBuyQuantity(this.buyQuantity);
    }
    render() {
        this.renderCosts();
        this.renderRequirements();
        this.renderUpgrades();
    }
    renderCosts() {
        if (!this.renderQueue.costs)
            return;
        shopMenu.updateForCostChange();
        this.renderQueue.costs = false;
    }
    renderRequirements() {
        if (!this.renderQueue.requirements)
            return;
        shopMenu.updateForRequirementChange();
        this.renderQueue.requirements = false;
    }
    renderUpgrades() {
        if (!this.renderQueue.upgrades)
            return;
        if (this.game.modifiers.treeCutLimit > 0)
            $('#skill-woodcutting-multitree').removeClass('d-none');
        combatMenus.slayerTask.toggleAutoSlayerCheckbox(this.game.modifiers.autoSlayerUnlocked > 0);
        this.upgradeChains.forEach((chain) => {
            var _a, _b;
            const lowestPurchase = this.getLowestUpgradeInChain(chain.rootUpgrade);
            const upgradeName = (_a = lowestPurchase === null || lowestPurchase === void 0 ? void 0 : lowestPurchase.name) !== null && _a !== void 0 ? _a : chain.defaultName;
            const upgradeImg = (_b = lowestPurchase === null || lowestPurchase === void 0 ? void 0 : lowestPurchase.media) !== null && _b !== void 0 ? _b : chain.defaultMedia;
            let upgradeDesc;
            if (lowestPurchase !== undefined) {
                const totalStats = this.getTotalStatsInChain(lowestPurchase);
                upgradeDesc = totalStats.getAllDescriptions().map(spanHTMLDescriptionFormatter).join('<br>');
            } else {
                upgradeDesc = chain.defaultDescription;
            }
            const chainDisplays = document.querySelectorAll(`upgrade-chain-display[data-upgrade-chain-id="${chain.id}"]`);
            chainDisplays.forEach((chainDisplay) => {
                chainDisplay.setUpgrade(upgradeName, upgradeDesc, upgradeImg);
            });
        });
        this.renderQueue.upgrades = false;
    }
    postDataRegistration() {
        this.purchases.forEach((purchase) => {
            if (purchase.contains.items.length < 2) {
                purchase.contains.items.forEach(({
                    item
                }) => {
                    this.purchasesByItem.set(item, purchase);
                });
            }
            if (purchase.contains.itemCharges !== undefined) {
                this.purchasesByItem.set(purchase.contains.itemCharges.item, purchase);
            }
        });
    }
    /** Gets the total number of upgrades purchased. If golbinRaid, returns for Raid, else for base game. */
    getTotalUpgradesPurchased(golbinRaid) {
        let totalCount = 0;
        this.upgradesPurchased.forEach((count, purchase) => {
            if (purchase.category.isGolbinRaid === golbinRaid)
                totalCount += count;
        });
        return totalCount;
    }
    isUpgradePurchased(upgrade) {
        return this.upgradesPurchased.has(upgrade);
    }
    getPurchaseCount(purchase) {
        var _a;
        return (_a = this.upgradesPurchased.get(purchase)) !== null && _a !== void 0 ? _a : 0;
    }
    isPurchaseAtBuyLimit(purchase) {
        return purchase.getBuyLimit(this.game.currentGamemode) <= this.getPurchaseCount(purchase);
    }
    getQuickBuyPurchase(item) {
        return this.purchasesByItem.get(item);
    }
    /** Starting with an upgrade, progresses down it's unlock requirements until a purchase that is owned is found. Returns undefined if no purchase found. */
    getLowestUpgradeInChain(purchase) {
        while (true) {
            if (this.isUpgradePurchased(purchase))
                return purchase;
            if (purchase.unlockRequirements[0] !== undefined) {
                purchase = purchase.unlockRequirements[0].purchase;
            } else {
                return undefined;
            }
        }
    }
    getTotalStatsInChain(purchase) {
        var _a;
        const summary = new StatObjectSummary();
        while (purchase !== undefined) {
            if (purchase.contains.stats !== undefined)
                summary.addStatObject(purchase, purchase.contains.stats);
            purchase = (_a = purchase.unlockRequirements[0]) === null || _a === void 0 ? void 0 : _a.purchase;
        }
        return summary;
    }
    capPurchaseQuantity(purchase, buyQuantity) {
        const buyLimit = purchase.getBuyLimit(this.game.currentGamemode);
        const existingPurchases = this.getPurchaseCount(purchase);
        return Math.min(buyQuantity, buyLimit - existingPurchases);
    }
    getPurchaseCosts(purchase, quantity) {
        const costs = new Costs(this.game);
        costs.setSource(`Game.ShopPurchase.${purchase.id}`);
        const amountBought = this.getPurchaseCount(purchase);
        purchase.costs.currencies.forEach((currencyCost) => {
            costs.addCurrency(currencyCost.currency, this.getCurrencyCost(currencyCost, quantity, amountBought));
        });
        purchase.costs.items.forEach((itemCost) => {
            costs.addItem(itemCost.item, quantity * itemCost.quantity);
        });
        return costs;
    }
    /** On click callback function for quick buying */
    quickBuyItemOnClick(purchase) {
        shopMenu.changeQuickBuyItem(purchase);
        this.updateBuyQuantity(this.buyQuantity);
        $('#modal-quick-buy-item').modal('show');
    }
    /** On click callback for buying a shop item */
    buyItemOnClick(purchase, confirmed = false) {
        var _a, _b;
        if (!this.game.tutorial.complete && !this.game.tutorial.allowedShopPurchases.has(purchase)) {
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_SHOP_ITEM_LOCKED'),
                html: `<h5 class="font-w400 text-combat-smoke font-size-sm"><img class="skill-icon-xs mr-1" src="${purchase.media}"> ${getLangString('TUTORIAL_SHOP_LOCKED')}</h5>
        <h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('TUTORIAL_CONTINUE_TUTORIAL_SHOP')}</h5>`,
                icon: 'warning',
            });
            return;
        }
        let quantityToBuy = 1;
        if (purchase.allowQuantityPurchase) {
            quantityToBuy = this.capPurchaseQuantity(purchase, this.buyQuantity);
        }
        const costs = this.getPurchaseCosts(purchase, quantityToBuy);
        const canBuy = !this.isPurchaseAtBuyLimit(purchase) &&
            costs.checkIfOwned() &&
            this.game.checkRequirements(purchase.purchaseRequirements);
        if (!canBuy)
            return;
        if (!confirmed && this.game.settings.showShopConfirmations) {
            shopMenu.showConfirmBuyPrompt(purchase);
            return;
        }
        const itemsToAdd = purchase.contains.items.map(({
            item,
            quantity
        }) => {
            quantity *= quantityToBuy;
            return {
                item,
                quantity,
            };
        });
        if (purchase.contains.itemCharges !== undefined && !this.game.isItemOwned(purchase.contains.itemCharges.item)) {
            itemsToAdd.push({
                item: purchase.contains.itemCharges.item,
                quantity: 1
            });
        }
        if (!this.game.bank.willItemsFit(itemsToAdd)) {
            bankFullNotify();
            return;
        }
        costs.consumeCosts();
        // Record Purchase Statistics
        costs.recordBulkItemStat(this.game.stats.Shop, ShopStats.ItemsSpent);
        costs.recordCurrencyStats(3 /* CurrencyStats.SpentInShop */ );
        this.game.stats.Shop.inc(ShopStats.PurchasesMade);
        let savePurchase = purchase.contains.stats !== undefined;
        // Give Purchase Rewards
        if (purchase.contains.pet !== undefined) {
            this.game.petManager.unlockPet(purchase.contains.pet);
            savePurchase = true;
        }
        if (purchase.contains.lootBox) {
            this.game.golbinRaid.openGolbinCrate();
            savePurchase = true;
        }
        if (purchase.contains.bankTab) {
            this.game.bank.addTabs(quantityToBuy);
            savePurchase = true;
        }
        itemsToAdd.forEach(({
            item,
            quantity
        }) => {
            this.game.bank.addItem(item, quantity, false, true, false, true, `Shop.${purchase.id}`);
            this.game.stats.Shop.add(ShopStats.ItemsPurchased, quantity);
        });
        if (purchase.contains.itemCharges !== undefined) {
            const chargesToAdd = purchase.contains.itemCharges.quantity * quantityToBuy;
            this.game.itemCharges.addCharges(purchase.contains.itemCharges.item, chargesToAdd);
            this.game.stats.Shop.add(ShopStats.GloveChargesPurchased, chargesToAdd);
        }
        if (savePurchase) {
            this.upgradesPurchased.set(purchase, this.getPurchaseCount(purchase) + quantityToBuy);
            this.renderQueue.upgrades = true;
            this.game.queueRequirementRenders();
            this.game.woodcutting.renderQueue.treeUnlocks = true;
            this.game.mining.renderQueue.rockUnlock = true;
            if (this.game.harvesting !== undefined)
                this.game.harvesting.renderQueue.veinUnlock = true;
            (_a = this.game.archaeology) === null || _a === void 0 ? void 0 : _a.actions.forEach((action) => {
                var _a;
                (_a = this.game.archaeology) === null || _a === void 0 ? void 0 : _a.renderQueue.digSites.add(action);
            });
            this.game.firemaking.renderQueue.oilQty = true;
        }
        const event = new ShopPurchaseMadeEvent(purchase, quantityToBuy);
        this._events.emit('purchaseMade', event);
        if (purchase.contains.stats !== undefined)
            this.computeProvidedStats();
        $('#modal-quick-buy-item').modal('hide');
        (_b = shopMenu.tabs.get(purchase.category)) === null || _b === void 0 ? void 0 : _b.menu.updateItemSelection();
        shopMenu.updateItemPostPurchase(purchase);
    }
    /** Callback function for updating the buy quantity */
    updateBuyQuantity(quantity) {
        quantity = Math.min(Shop.MAX_BUY_QUANTITY, quantity);
        this.buyQuantity = quantity;
        $('.shop-buy-qty-btn').text(templateLangString('MENU_TEXT_BUY_X', {
            num: formatNumber(this.buyQuantity)
        }));
        shopMenu.updateForBuyQtyChange();
    }
    encode(writer) {
        writer.writeMap(this.upgradesPurchased, writeNamespaced, (count, writer) => writer.writeUint32(count));
        writer.writeFloat64(this.buyQuantity);
        return writer;
    }
    decode(reader, version) {
        this.upgradesPurchased = reader.getMap((reader) => {
            const purchase = reader.getNamespacedObject(this.purchases);
            if (typeof purchase === 'string') {
                if (purchase.startsWith('melvor')) {
                    return this.purchases.getDummyObject(purchase, DummyShopPurchase, this.game);
                } else
                    return undefined;
            }
            return purchase;
        }, (reader) => reader.getUint32());
        this.buyQuantity = reader.getFloat64();
    }
    computeProvidedStats(updatePlayers = true) {
        this.providedStats.reset();
        this.raidStats.reset();
        this.upgradesPurchased.forEach((count, purchase) => {
            if (purchase.contains.stats !== undefined) {
                if (purchase.category.isGolbinRaid) {
                    this.raidStats.addStatObject(purchase, purchase.contains.stats, count, count);
                } else {
                    this.providedStats.addStatObject(purchase, purchase.contains.stats, count, count);
                }
            }
        });
        if (updatePlayers) {
            this.game.combat.computeAllStats();
            this.game.golbinRaid.computeAllStats();
        }
    }
    /** Gets the currency cost for a given purchase quantity */
    getCurrencyCost(cost, buyQuantity, boughtQuantity) {
        const newQuantity = buyQuantity + boughtQuantity;
        switch (cost.type) {
            case 'Linear':
                return ((cost.scaling / 2) * (newQuantity * (newQuantity - 1) - boughtQuantity * (boughtQuantity - 1)) +
                    buyQuantity * cost.initial);
            case 'Glove':
                return cost.cost * buyQuantity * (this.game.merchantsPermitRead ? 0.9 : 1);
            case 'BankSlot':
                {
                    let cost = 0;
                    for (let i = boughtQuantity; i < newQuantity; i++) {
                        const nextCost = newNewBankUpgradeCost.level_to_gp(i + 2);
                        if (nextCost < 5000000) {
                            cost += nextCost;
                        } else {
                            return cost + (newQuantity - i) * 5000000;
                        }
                    }
                    return cost;
                }
            case 'Fixed':
                return cost.cost * buyQuantity;
        }
    }
    getCurrentDescription(purchase) {
        if (purchase.currentDescription !== undefined && purchase.contains.stats !== undefined) {
            const stats = purchase.contains.stats;
            let value = 0;
            if (stats.modifiers !== undefined) {
                value = stats.modifiers[0].value;
            } else if (stats.combatEffects !== undefined) {
                const firstApplicator = stats.combatEffects[0];
                value = firstApplicator.baseChance;
                if (firstApplicator.conditionChances.length > 0)
                    value = firstApplicator.conditionChances[0].chance;
            }
            value *= this.getPurchaseCount(purchase);
            switch (purchase.currentDescription) {
                case 'Decrease':
                    return templateLangString('MENU_TEXT_CURRENTLY_QTY_DEC', {
                        qty: formatNumber(value)
                    });
                case 'Increase':
                    return templateLangString('MENU_TEXT_CURRENTLY_QTY_INC', {
                        qty: formatNumber(value)
                    });
                case 'PercentDecrease':
                    return templateLangString('MENU_TEXT_CURRENTLY_PERCENT_DEC', {
                        percent: formatNumber(value)
                    });
                case 'PercentIncrease':
                    return templateLangString('MENU_TEXT_CURRENTLY_PERCENT_INC', {
                        percent: formatNumber(value)
                    });
                case 'SecondsDecrease':
                    return templateLangString('MENU_TEXT_CURRENTLY_SECONDS_DEC', {
                        seconds: formatFixed(value / 1000, 1),
                    });
                case 'SecondsIncrease':
                    return templateLangString('MENU_TEXT_CURRENTLY_SECONDS_INC', {
                        seconds: formatFixed(value / 1000, 1),
                    });
            }
        }
        return '';
    }
    convertFromOldFormat(save, idMap) {
        if (save.shopItemsPurchased !== undefined) {
            save.shopItemsPurchased.forEach((purchasedItem, oldPurchaseID) => {
                const newID = idMap.shopPurchase[oldPurchaseID];
                let purchase = this.purchases.getObjectByID(newID);
                if (purchase === undefined)
                    purchase = this.purchases.getDummyObject(newID, DummyShopPurchase, this.game);
                if ((save.version > 17 && purchase.category.id === "melvorD:GolbinRaid" /* ShopCategoryIDs.GolbinRaid */ ) ||
                    purchase.category.id === "melvorF:Township" /* ShopCategoryIDs.Township */ ) {
                    purchasedItem.quantity = Math.min(purchasedItem.quantity, purchase.getBuyLimit(this.game.currentGamemode)); // Special fix for bad shop saving
                }
                if (newID === "melvorD:GolbinCrate" /* ShopPurchaseIDs.GolbinCrate */ )
                    purchasedItem.quantity = this.game.golbinRaid.cratesPurchased;
                this.upgradesPurchased.set(purchase, purchasedItem.quantity);
            });
        }
        if (save.buyQty !== undefined)
            this.buyQuantity = save.buyQty;
    }
    /** Removes purchases that are above their buy limit */
    removePurchasesAboveLimit() {
        /*
          If you're looking at my code and stumble upon this - This function is used to remove duplicate shop items from the shopItemsPurchased array.
          If your skill intervals are literally 0, and your bank spaces are almost double what you previously had, then you have duplicate shop items.
          It check for all Skill Upgrades, and then removes Bank Spaces based on how much duplicates were found.
          Run it with caution, but this is what I used to manually fix saves for those who asked me to.
          Simply run this, and then refresh for the changes to be seen (and saved)
          Update: I've fixed this function to work again. It just generically remove any violations of the shop buy limit for your gamemode - Coolrox
        */
        let violationFound = false;
        this.upgradesPurchased.forEach((count, purchase) => {
            const newCount = Math.min(purchase.getBuyLimit(this.game.currentGamemode), count);
            this.upgradesPurchased.set(purchase, newCount);
            if (newCount !== count)
                violationFound = true;
        });
        if (violationFound) {
            this.computeProvidedStats(true);
            this.game.combat.player.updateForEquipSetChange();
            saveData();
        }
    }
}
/** Maximum that the buy quantity can be set to. Uint32 Max */
Shop.MAX_BUY_QUANTITY = 4294967295;
// Utility Classes for Computing Bank Upgrade Costs
class BankUpgradeCost {
    equate(gp) {
        return Math.floor(gp + 300 * Math.pow(2, gp / 7));
    }
    level_to_gp(level) {
        let gp = 0;
        for (let i = 1; i < level; i++)
            gp += this.equate(i);
        return Math.floor(gp / 2);
    }
    gp_to_level(gp) {
        let level = 1;
        while (this.level_to_gp(level) < gp)
            level++;
        return level;
    }
}
class NewNewBankUpgradeCost {
    equate(level) {
        return Math.floor((2654570 * (50 * level)) / Math.pow(142015, 163 / (120 + level)));
    }
    level_to_gp(level) {
        const cost = this.equate(level);
        return cost;
    }
}
class NewBankUpgradeCost {
    equate(gp) {
        return Math.floor(gp + 300 * Math.pow(2, gp / 7));
    }
    level_to_gp(level) {
        let gp = 0;
        for (let i = 1; i < level; i++)
            gp += this.equate(i);
        return Math.floor(gp / 3);
    }
    gp_to_level(gp) {
        let level = 1;
        while (this.level_to_gp(level) < gp)
            level++;
        return level;
    }
}
const bankUpgradeCost = new BankUpgradeCost();
const newBankUpgradeCost = new NewBankUpgradeCost();
const newNewBankUpgradeCost = new NewNewBankUpgradeCost();
//# sourceMappingURL=shop.js.map
checkFileVersion('?12097')