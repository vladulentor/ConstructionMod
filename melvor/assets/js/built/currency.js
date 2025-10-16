"use strict";
class Currency extends NamespacedObject {
    constructor(namespace, localID, game) {
        super(namespace, localID);
        this.game = game;
        /* #region GameEventEmitter Boilerplate */
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
        this._amount = 0;
        this.renderRequired = false;
        this.stats = new CurrencyStatTracker(game);
        this.modQuery = new ModifierQuery({
            currency: this
        });
    }
    /* #endregion */
    get media() {
        return this.getMediaURL(this._media);
    }
    get amount() {
        return this._amount;
    }
    /** Queues a notification on recieving/losing currency */
    queueNotification(amount) {
        if (!this.shouldNotify)
            return;
        this.game.combat.notifications.add({
            type: 'Currency',
            args: [this, amount],
        });
    }
    /** Renders the current amount of currency owned. */
    renderAmount() {
        this.renderQuantities();
        this.renderTooltips();
    }
    renderQuantities() {
        const formatted = formatNumber(this._amount, 2);
        const commas = numberWithCommas(this._amount);
        const elements = document.querySelectorAll(`[data-currency-quantity="${this.id}"]`);
        const highlight = (this.game.settings.formatNumberSetting === 0 && this._amount >= 10000000) ||
            (this.game.settings.formatNumberSetting === 1 && this._amount >= 1000000);
        elements.forEach((element) => {
            switch (element.getAttribute('data-currency-format')) {
                case 'commas':
                    element.textContent = commas;
                    break;
                case 'youHave':
                    element.innerHTML = templateString(getLangString('COMBAT_MISC_87'), {
                        coinImage: `<img class="skill-icon-xs mr-1 " src="${this.media}">`,
                        qty: `${formatNumber(this._amount)}`,
                    });
                    break;
                case 'formatted':
                default:
                    element.textContent = formatted;
                    break;
            }
            if (element.getAttribute('data-currency-highlight')) {
                element.classList.remove('text-success', 'text-light');
                if (highlight)
                    element.classList.add('text-success');
                else
                    element.classList.add('text-light');
            }
        });
    }
    renderTooltips() {
        const ttContent = this.getTooltipContent();
        const tooltips = document.querySelectorAll(`[data-currency-tooltip="${this.id}"]`);
        tooltips.forEach((element) => {
            element.setAttribute('data-original-title', ttContent);
        });
        if (tooltips.length > 0)
            updateTooltips();
    }
    getTooltipContent() {
        return this.formatAmount(numberWithCommas(this._amount));
    }
    onLoad() {
        this.renderRequired = true;
    }
    onAmountChange() {
        var _a, _b;
        this.renderRequired = true;
        this.game.shop.renderQueue.costs = true;
        if (((_b = (_a = this.game.openPage) === null || _a === void 0 ? void 0 : _a.action) === null || _b === void 0 ? void 0 : _b.queueCurrencyQuantityRender) !== undefined)
            this.game.openPage.action.queueCurrencyQuantityRender(this);
        this._events.emit('amountChanged', new GameEvent());
    }
    queueRender() {
        this.renderRequired = true;
    }
    render() {
        if (!this.renderRequired)
            return;
        this.renderAmount();
        this.renderRequired = false;
    }
    /** Adds amount to the currency */
    add(amount) {
        this._amount += amount;
        this.stats.add(0 /* CurrencyStats.TotalEarned */ , amount);
        this.queueNotification(amount);
        this.onAmountChange();
    }
    /** Removes amount from the currency */
    remove(amount) {
        this._amount -= amount;
        this.stats.add(1 /* CurrencyStats.TotalSpent */ , amount);
        this.queueNotification(-amount);
        this.onAmountChange();
    }
    /** Sets the amount to the given value */
    set(amount) {
        this._amount = amount;
        this.onAmountChange();
    }
    /** Checks if amountToSpend can be afforded from the currency */
    canAfford(amountToSpend) {
        return this._amount >= amountToSpend;
    }
    encode(writer) {
        writer.writeFloat64(this._amount);
        this.stats.encode(writer);
        return writer;
    }
    decode(reader, version) {
        this._amount = Math.floor(reader.getFloat64());
        if (version >= 100 /* SaveVersion.IntoTheAbyss */ )
            this.stats.decode(reader, version);
    }
    /** Dumps any data encoded for a currecny from a SaveWriter */
    static dumpData(reader, version) {
        reader.getFloat64();
        CurrencyStatTracker.dumpData(reader, version);
    }
}
class GP extends Currency {
    constructor(namespace, game) {
        super(namespace, 'GP', game);
        this._media = "assets/media/main/coins.png" /* Assets.GPIcon */ ;
        this.travelCostWeight = 1;
        this.type = 'GP';
    }
    get name() {
        return getLangString('MENU_TEXT_GP');
    }
    get gainTemplate() {
        return getLangString('MENU_TEXT_CURRENCY_GAIN_GP');
    }
    get usedTemplate() {
        return getLangString('MENU_TEXT_CURRENCY_LOSS_GP');
    }
    get shouldNotify() {
        return this.game.settings.showGPNotifications;
    }
    formatAmount(qtyText) {
        return templateLangString('MENU_TEXT_GP_AMOUNT', {
            gp: qtyText
        });
    }
}
class SlayerCoins extends Currency {
    constructor(namespace, game) {
        super(namespace, 'SlayerCoins', game);
        this._media = "assets/media/main/slayer_coins.png" /* Assets.SlayerCoinIcon */ ;
        this.travelCostWeight = 50; // Valued at 50gp per sc, roughly based on bountiful resupply value
        this.type = 'SlayerCoins';
    }
    get name() {
        return getLangString('MENU_TEXT_SLAYER_COINS');
    }
    get gainTemplate() {
        return getLangString('MENU_TEXT_CURRENCY_GAIN_SC');
    }
    get usedTemplate() {
        return getLangString('MENU_TEXT_CURRENCY_LOSS_SC');
    }
    get shouldNotify() {
        return this.game.settings.showSlayerCoinNotifications;
    }
    getTooltipContent() {
        return `${this.formatAmount(numberWithCommas(this._amount))}<br><small class='text-warning'>${getLangString('MENU_TEXT_SLAYER_COINS_FROM_TASKS')}</small>`;
    }
    formatAmount(qtyText) {
        return templateLangString('MENU_TEXT_SLAYER_COIN_AMOUNT', {
            qty: qtyText
        });
    }
}
class RaidCoins extends Currency {
    constructor(namespace, game) {
        super(namespace, 'RaidCoins', game);
        this._media = "assets/media/main/raid_coins.png" /* Assets.RaidCoinIcon */ ;
        this.travelCostWeight = 1;
        this.type = 'RaidCoins';
        this.shouldNotify = true;
    }
    get name() {
        return getLangString('MENU_TEXT_RAID_COINS');
    }
    get gainTemplate() {
        return getLangString('MENU_TEXT_CURRENCY_RAID_COINS');
    }
    get usedTemplate() {
        return getLangString('MENU_TEXT_CURRENCY_LOSS_RAID_COINS');
    }
    formatAmount(qtyText) {
        return `${qtyText} ${getLangString('MENU_TEXT_RAID_COINS')}`;
    }
}
class AbyssalPieces extends Currency {
    constructor(namespace, game) {
        super(namespace, 'AbyssalPieces', game);
        this._media = "assets/media/main/abyssal_pieces.png" /* Assets.APIcon */ ;
        this.travelCostWeight = 1; // TODO_C Set this when some rough conversion factor available
        this.type = 'AbyssalPieces';
    }
    get name() {
        return getLangString('CURRENCY_ABYSSAL_PIECES_SHORTHAND');
    }
    get gainTemplate() {
        return getLangString('CURRENCY_ABYSSAL_PIECES_GAIN_TEMPLATE');
    }
    get usedTemplate() {
        return getLangString('CURRENCY_ABYSSAL_PIECES_USED_TEMPLATE');
    }
    get shouldNotify() {
        return this.game.settings.showAbyssalPiecesNotifications;
    }
    formatAmount(qtyText) {
        return templateLangString('CURRENCY_ABYSSAL_PIECES_AMOUNT', {
            qty: qtyText
        });
    }
}
class AbyssalSlayerCoins extends Currency {
    constructor(namespace, game) {
        super(namespace, 'AbyssalSlayerCoins', game);
        this._media = "assets/media/main/abyssal_slayer_coins.png" /* Assets.ASCIcon */ ;
        this.travelCostWeight = 1; // TODO_C Set this when some rough conversion factor available
        this.type = 'AbyssalSlayerCoins';
    }
    get name() {
        return getLangString('CURRENCY_ABYSSAL_SLAYER_COINS_NAME');
    }
    get gainTemplate() {
        return getLangString('CURRENCY_ABYSSAL_SLAYER_COINS_GAIN_TEMPLATE');
    }
    get usedTemplate() {
        return getLangString('CURRENCY_ABYSSAL_SLAYER_COINS_TEMPLATE');
    }
    get shouldNotify() {
        return this.game.settings.showAbyssalSlayerCoinNotifications;
    }
    formatAmount(qtyText) {
        return templateLangString('CURRENCY_ABYSSAL_SLAYER_COINS_AMOUNT', {
            qty: qtyText
        });
    }
}
//# sourceMappingURL=currency.js.map
checkFileVersion('?12097')