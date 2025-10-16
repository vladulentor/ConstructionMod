"use strict";
class GenericNotification {
    constructor(type) {
        this._type = type;
    }
    get type() {
        return this._type;
    }
}
class AddCurrencyNotification extends GenericNotification {
    constructor(currency) {
        super('AddCurrency');
        this._currency = currency;
    }
    get currency() {
        return this._currency;
    }
}
class RemoveCurrencyNotification extends GenericNotification {
    constructor(currency) {
        super('RemoveCurrency');
        this._currency = currency;
    }
    get currency() {
        return this._currency;
    }
}
class AddItemNotification extends GenericNotification {
    constructor(item) {
        super('AddItem');
        this._item = item;
    }
    get item() {
        return this._item;
    }
}
class RemoveItemNotification extends GenericNotification {
    constructor(item) {
        super('RemoveItem');
        this._item = item;
    }
    get item() {
        return this._item;
    }
}
class SummoningMarkNotification extends GenericNotification {
    constructor(mark) {
        super('SummoningMark');
        this._mark = mark;
    }
    get mark() {
        return this._mark;
    }
}
class ErrorNotification extends GenericNotification {
    constructor(customID) {
        super('Error');
        this._customID = customID;
    }
    get customID() {
        return this._customID;
    }
}
class SuccessNotification extends GenericNotification {
    constructor(customID) {
        super('Success');
        this._customID = customID;
    }
    get customID() {
        return this._customID;
    }
}
class InfoNotification extends GenericNotification {
    constructor(customID) {
        super('Info');
        this._customID = customID;
    }
    get customID() {
        return this._customID;
    }
}
class SkillXPNotification extends GenericNotification {
    constructor(skill) {
        super('SkillXP');
        this._skill = skill;
    }
    get skill() {
        return this._skill;
    }
}
class AbyssalXPNotification extends GenericNotification {
    constructor(skill) {
        super('AbyssalXP');
        this._skill = skill;
    }
    get skill() {
        return this._skill;
    }
}
class MasteryLevelNotification extends GenericNotification {
    constructor(action) {
        super('MasteryLevel');
        this._action = action;
    }
    get action() {
        return this._action;
    }
}
class NotificationsManager {
    constructor() {
        this.OFFSET = 5;
        this.activeNotifications = new Map();
        this.activeNotificationElements = new Map();
        this.timeoutIds = new Map();
        this.addCurrencyNotifications = new Map();
        this.removeCurrencyNotifications = new Map();
        this.addItemNotificationClasses = new Map();
        this.removeItemNotificationClasses = new Map();
        this.summoningMarkNotificationClasses = new Map();
        this.errorNotificationClasses = new Map();
        this.successNotificationClasses = new Map();
        this.infoNotificationClasses = new Map();
        this.genericNotificationClasses = new Map();
        this.skillXPNotificationClasses = new Map();
        this.masteryLevelNotificationClasses = new Map();
        this.abyssalXPNotificationClasses = new Map();
    }
    get genericNotificationData() {
        return {
            media: assets.getURI("assets/media/main/question.png" /* Assets.QuestionMark */ ),
            quantity: 0,
            text: '',
            isImportant: false,
            isError: false,
        };
    }
    get timeoutDelay() {
        return game.settings.notificationDisappearDelay * 1000;
    }
    createSkillXPNotification(skill, quantity) {
        const notification = this.genericNotificationData;
        notification.media = skill.media;
        if (quantity < 1 && quantity > 0)
            notification.quantity = Number.parseFloat(quantity.toFixed(2));
        else
            notification.quantity = Math.floor(quantity);
        notification.text = isOnMobileLayout ?
            getLangString('MENU_TEXT_XP_HEADER') :
            templateLangString('SKILL_NAME_SKILL_XP_NO_QTY', {
                skillName: skill.name
            });
        notification.isImportant = false;
        notification.isError = false;
        const skillNotification = this.newSkillXPNotification(skill);
        if (skillNotification !== undefined)
            this.addNotification(skillNotification, notification);
    }
    newSkillXPNotification(skill) {
        if (this.skillXPNotificationClasses.has(skill))
            return this.skillXPNotificationClasses.get(skill);
        const skillNotification = new SkillXPNotification(skill);
        this.skillXPNotificationClasses.set(skill, skillNotification);
        return skillNotification;
    }
    createAbyssalXPNotification(skill, quantity) {
        const notification = this.genericNotificationData;
        notification.media = skill.media;
        if (quantity < 1 && quantity > 0)
            notification.quantity = Number.parseFloat(quantity.toFixed(2));
        else
            notification.quantity = Math.floor(quantity);
        notification.text = isOnMobileLayout ?
            getLangString('ABYSSAL_XP') :
            templateLangString('MENU_TEXT_AXP_SKILL_NAME', {
                skillName: skill.name
            });
        notification.isImportant = false;
        notification.isError = false;
        const abyssalNotification = this.newAbyssalXPNotification(skill);
        if (abyssalNotification !== undefined)
            this.addNotification(abyssalNotification, notification);
    }
    newAbyssalXPNotification(skill) {
        if (this.abyssalXPNotificationClasses.has(skill))
            return this.abyssalXPNotificationClasses.get(skill);
        const abyssalNotification = new AbyssalXPNotification(skill);
        this.abyssalXPNotificationClasses.set(skill, abyssalNotification);
        return abyssalNotification;
    }
    createMasteryLevelNotification(action, level) {
        const notification = this.genericNotificationData;
        notification.media = assets.getURI("assets/media/main/mastery_header.png" /* Assets.MasteryIcon */ );
        notification.quantity = level;
        notification.text = `<img class="newNotification-img ${game.settings.useCompactNotifications ? 'compact' : ''}" src="${action.media}">`;
        notification.isImportant = false;
        notification.isError = false;
        const masteryLevelNotification = this.newMasteryLevelNotification(action);
        if (masteryLevelNotification !== undefined)
            this.addNotification(masteryLevelNotification, notification);
    }
    newMasteryLevelNotification(action) {
        if (this.masteryLevelNotificationClasses.has(action))
            return this.masteryLevelNotificationClasses.get(action);
        const masteryLevelNotification = new MasteryLevelNotification(action);
        this.masteryLevelNotificationClasses.set(action, masteryLevelNotification);
        return masteryLevelNotification;
    }
    createItemNotification(item, quantity) {
        const notification = this.genericNotificationData;
        notification.media = item.media;
        notification.quantity = quantity;
        notification.text = item.name;
        notification.isImportant = false;
        notification.isError = false;
        const itemNotification = quantity > 0 ? this.newAddItemNotification(item) : this.newRemoveItemNotification(item);
        if (itemNotification !== undefined)
            this.addNotification(itemNotification, notification);
    }
    newAddItemNotification(item) {
        if (this.addItemNotificationClasses.has(item))
            return this.addItemNotificationClasses.get(item);
        const itemNotification = new AddItemNotification(item);
        this.addItemNotificationClasses.set(item, itemNotification);
        return itemNotification;
    }
    newRemoveItemNotification(item) {
        if (this.removeItemNotificationClasses.has(item))
            return this.removeItemNotificationClasses.get(item);
        const itemNotification = new RemoveItemNotification(item);
        this.removeItemNotificationClasses.set(item, itemNotification);
        return itemNotification;
    }
    createCurrencyNotification(currency, quantity) {
        const notification = this.genericNotificationData;
        notification.media = currency.media;
        notification.quantity = quantity;
        notification.text = '';
        notification.isImportant = false;
        notification.isError = false;
        const currencyNotification = quantity > 0 ? this.getAddCurrencyNotification(currency) : this.getRemoveCurrencyNotification(currency);
        this.addNotification(currencyNotification, notification);
    }
    getAddCurrencyNotification(currency) {
        const existing = this.addCurrencyNotifications.get(currency);
        if (existing !== undefined)
            return existing;
        const notification = new AddCurrencyNotification(currency);
        this.addCurrencyNotifications.set(currency, notification);
        return notification;
    }
    getRemoveCurrencyNotification(currency) {
        const existing = this.removeCurrencyNotifications.get(currency);
        if (existing !== undefined)
            return existing;
        const notification = new RemoveCurrencyNotification(currency);
        this.removeCurrencyNotifications.set(currency, notification);
        return notification;
    }
    createGPNotification(quantity) {
        const notification = this.genericNotificationData;
        notification.media = assets.getURI("assets/media/main/coins.png" /* Assets.GPIcon */ );
        notification.quantity = quantity;
        notification.text = '';
        notification.isImportant = false;
        notification.isError = false;
        const gpNotification = quantity > 0 ? this.newAddGenericNotification('AddGP') : this.newRemoveGenericNotification('RemoveGP');
        if (gpNotification !== undefined)
            this.addNotification(gpNotification, notification);
    }
    createSlayerCoinsNotification(quantity) {
        const notification = this.genericNotificationData;
        notification.media = assets.getURI("assets/media/main/slayer_coins.png" /* Assets.SlayerCoinIcon */ );
        notification.quantity = quantity;
        notification.text = '';
        notification.isImportant = false;
        notification.isError = false;
        const scNotification = quantity > 0 ?
            this.newAddGenericNotification('AddSlayerCoins') :
            this.newRemoveGenericNotification('RemoveSlayerCoins');
        if (scNotification !== undefined)
            this.addNotification(scNotification, notification);
    }
    createSummoningMarkNotification(mark) {
        const notification = this.genericNotificationData;
        notification.media = mark.markMedia;
        notification.quantity = 1;
        notification.text = templateLangString('NOTIFICATIONS_V2_SUMMONING_MARK_DISCOVERED', {
            markName: game.summoning.getMarkName(mark),
            value: `${game.summoning.getMarkLevel(mark)}`,
        });
        notification.isImportant = game.settings.importanceSummoningMarkFound;
        notification.isError = false;
        const markNotification = this.newSummoningMarkNotification(mark);
        if (markNotification !== undefined)
            this.addNotification(markNotification, notification);
    }
    createErrorNotification(customID, msg) {
        const notification = this.genericNotificationData;
        notification.media = assets.getURI("assets/media/main/error.png" /* Assets.ErrorIcon */ );
        notification.quantity = 1;
        notification.text = msg;
        notification.isImportant = game.settings.importanceErrorMessages;
        notification.isError = true;
        const errorNotification = this.newAddErrorNotification(customID);
        if (errorNotification !== undefined)
            this.addNotification(errorNotification, notification);
    }
    createSuccessNotification(customID, msg, media, quantity = 1) {
        const notification = this.genericNotificationData;
        notification.media = media;
        notification.quantity = quantity;
        notification.text = msg;
        notification.isImportant = false;
        notification.isError = false;
        const successNotification = this.newAddSuccessNotification(customID);
        if (successNotification !== undefined)
            this.addNotification(successNotification, notification);
    }
    createInfoNotification(customID, msg, media, quantity = 1) {
        const notification = this.genericNotificationData;
        notification.media = media;
        notification.quantity = quantity;
        notification.text = msg;
        notification.isImportant = false;
        notification.isError = false;
        const infoNotification = this.newAddInfoNotification(customID);
        if (infoNotification !== undefined)
            this.addNotification(infoNotification, notification);
    }
    newAddGenericNotification(type) {
        if (this.genericNotificationClasses.has(type))
            return this.genericNotificationClasses.get(type);
        const gn = new GenericNotification(type);
        this.genericNotificationClasses.set(type, gn);
        return gn;
    }
    newRemoveGenericNotification(type) {
        if (this.genericNotificationClasses.has(type))
            return this.genericNotificationClasses.get(type);
        const gn = new GenericNotification(type);
        this.genericNotificationClasses.set(type, gn);
        return gn;
    }
    newSummoningMarkNotification(mark) {
        if (this.summoningMarkNotificationClasses.has(mark))
            return this.summoningMarkNotificationClasses.get(mark);
        const smn = new SummoningMarkNotification(mark);
        this.summoningMarkNotificationClasses.set(mark, smn);
        return smn;
    }
    newAddErrorNotification(customID) {
        if (this.errorNotificationClasses.has(customID))
            return this.errorNotificationClasses.get(customID);
        const en = new ErrorNotification(customID);
        this.errorNotificationClasses.set(customID, en);
        return en;
    }
    newAddSuccessNotification(customID) {
        if (this.successNotificationClasses.has(customID))
            return this.successNotificationClasses.get(customID);
        const en = new SuccessNotification(customID);
        this.successNotificationClasses.set(customID, en);
        return en;
    }
    newAddInfoNotification(customID) {
        if (this.infoNotificationClasses.has(customID))
            return this.infoNotificationClasses.get(customID);
        const en = new InfoNotification(customID);
        this.infoNotificationClasses.set(customID, en);
        return en;
    }
    addNotification(key, notification) {
        if (notification.quantity > 0 && notification.quantity < 1)
            return;
        if (this.activeNotifications.has(key)) {
            this.editNotification(key, notification);
        } else {
            this.activeNotifications.set(key, notification);
            this.displayNotification(key, notification);
            this.activeNotifications = this.sortNotifications();
            this.adjustAllNotificationPositions();
        }
    }
    /** Sort notifications so important and errors always display first */
    sortNotifications() {
        const sorted = [...this.activeNotifications.entries()].sort((a, b) => {
            if (a[1].isError && !b[1].isError)
                return -1;
            if (!a[1].isError && b[1].isError)
                return 1;
            if (a[1].isImportant && !b[1].isImportant)
                return -1;
            if (!a[1].isImportant && b[1].isImportant)
                return 1;
            return 0;
        });
        return new Map(sorted);
    }
    removeNotification(key) {
        this.activeNotifications.delete(key);
        this.removeNotificationElement(key);
        this.adjustAllNotificationPositions();
    }
    editNotification(key, notification) {
        const existingNotification = this.activeNotifications.get(key);
        if (existingNotification) {
            const updatedNotification = Object.assign({}, existingNotification);
            key.type === 'MasteryLevel' ?
                (updatedNotification.quantity = notification.quantity) :
                (updatedNotification.quantity += notification.quantity);
            updatedNotification.text = notification.text;
            this.activeNotifications.set(key, updatedNotification);
            this.updateNotificationElement(key, updatedNotification, notification.quantity);
            this.setNotificationText(key, updatedNotification);
            this.pulseNotificationContainer(key);
            this.resetTimeout(key);
        }
    }
    displayNotification(key, notification) {
        const notificationsContainer = this.createNotificationContainer(key, notification);
        notificationsContainer.setNotification(key, notification, game);
        notificationsContainer.setQuantity(notification, key.type);
        notificationsContainer.setHorizontalPos(game.settings.notificationHorizontalPosition);
        notificationsContainer.setImportance(key, notification, game);
        document.body.appendChild(notificationsContainer);
        this.activeNotificationElements.set(key, notificationsContainer);
        this.setInBankText(key);
        this.setNotificationText(key, notification);
        this.resetTimeout(key);
    }
    removeNotificationElement(key) {
        const notificationElement = this.activeNotificationElements.get(key);
        if (notificationElement) {
            notificationElement.remove();
            this.activeNotificationElements.delete(key);
        }
        this.clearTimeout(key);
    }
    updateNotificationElement(key, notification, qtyChange) {
        var _a, _b;
        const notificationElement = this.activeNotificationElements.get(key);
        if (notificationElement) {
            notificationElement.setQuantity(notification, key.type);
            this.setInBankText(key);
            const source = qtyChange > 0 && !notification.isError ? 'Heal' : 'Attack';
            (_a = notificationElement.splashManager) === null || _a === void 0 ? void 0 : _a.add({
                source: source,
                amount: qtyChange,
                xOffset: 100,
            });
            (_b = notificationElement.splashManager) === null || _b === void 0 ? void 0 : _b.render();
        }
    }
    createNotificationContainer(key, notification) {
        const el = new GameNotificationElement();
        el.setBottomPos(5 + this.activeNotificationElements.size * 45 + this.OFFSET * this.activeNotificationElements.size);
        el.setBorder(this.getBorderColour(key.type, notification));
        return el;
    }
    getBorderColour(type, notification) {
        switch (type) {
            case 'AddItem':
                return '#1b9f12';
            case 'RemoveItem':
                return `#e56767`;
            case 'SummoningMark':
                return `#5cace5`;
            case 'AddGP':
            case 'RemoveGP':
                return notification.quantity <= 0 ? `#e56767` : 'yellow';
            case 'AddSlayerCoins':
            case 'RemoveSlayerCoins':
            case 'AddCurrency':
            case 'RemoveCurrency':
                return notification.quantity <= 0 ? `#e56767` : 'green';
            case 'Error':
                return `#e56767`;
            case 'Success':
                return `#30c78d`;
            case 'Info':
            case 'SkillXP':
            case 'MasteryLevel':
                return `#5cace5`;
            case 'AbyssalXP':
                return 'red';
        }
    }
    updateAllNotificationPositions() {
        this.activeNotificationElements.forEach((el) => {
            el.setHorizontalPos(game.settings.notificationHorizontalPosition);
        });
    }
    updateAllNotificationText() {
        this.activeNotifications.forEach((notification, key) => {
            if (key.type === 'AddItem' || key.type === 'RemoveItem') {
                this.setNotificationText(key, notification);
                this.setInBankText(key);
            }
        });
    }
    updateAllNotificationImportance() {
        this.activeNotifications.forEach((notification, key) => {
            switch (key.type) {
                case 'SummoningMark':
                    notification.isImportant = game.settings.importanceSummoningMarkFound;
                    break;
                case 'Error':
                    notification.isImportant = game.settings.importanceErrorMessages;
                    break;
            }
            const el = this.activeNotificationElements.get(key);
            el === null || el === void 0 ? void 0 : el.setImportance(key, notification, game);
            this.resetTimeout(key);
        });
    }
    toggleCompactNotifications() {
        this.activeNotificationElements.forEach((el) => {
            el.toggleCompact();
        });
        this.adjustAllNotificationPositions();
    }
    setInBankText(key) {
        const el = this.activeNotificationElements.get(key);
        if (key instanceof AddItemNotification || key instanceof RemoveItemNotification) {
            const inBank = game.settings.showQuantityInItemNotifications ? formatNumber(game.bank.getQty(key.item)) : '';
            el === null || el === void 0 ? void 0 : el.setInBankText(inBank);
        }
    }
    setNotificationText(key, notification) {
        const el = this.activeNotificationElements.get(key);
        if (key.type !== 'AddItem' && key.type !== 'RemoveItem') {
            el === null || el === void 0 ? void 0 : el.setText(notification.text);
            switch (key.type) {
                case 'SkillXP':
                case 'AbyssalXP':
                case 'MasteryLevel':
                case 'AddGP':
                case 'RemoveGP':
                case 'AddSlayerCoins':
                case 'RemoveSlayerCoins':
                    el === null || el === void 0 ? void 0 : el.setTextMinWidth('');
                    break;
                case 'Error':
                case 'SummoningMark':
                case 'Info':
                case 'Success':
                    el === null || el === void 0 ? void 0 : el.setTextMinWidth('200px');
                    break;
                default:
                    el === null || el === void 0 ? void 0 : el.setTextMinWidth('100px');
                    break;
            }
        } else if (game.settings.showItemNamesInNotifications) {
            el === null || el === void 0 ? void 0 : el.setText(notification.text);
            el === null || el === void 0 ? void 0 : el.setTextMinWidth('100px');
        }
    }
    pulseNotificationContainer(key) {
        const notificationsContainer = this.activeNotificationElements.get(key);
        if (notificationsContainer) {
            notificationsContainer.addPulse();
            setTimeout(() => {
                notificationsContainer.removePulse();
            }, 300);
        }
    }
    adjustAllNotificationPositions() {
        let pos = 0;
        let totalHeight = 0;
        this.activeNotifications.forEach((_, key) => {
            var _a;
            const el = this.activeNotificationElements.get(key);
            const childNode = el === null || el === void 0 ? void 0 : el.childNodes[1];
            el === null || el === void 0 ? void 0 : el.setBottomPos(5 + totalHeight + this.OFFSET * pos);
            totalHeight += (_a = childNode === null || childNode === void 0 ? void 0 : childNode.offsetHeight) !== null && _a !== void 0 ? _a : 0;
            pos++;
        });
    }
    clearTimeout(key) {
        const timeoutId = this.timeoutIds.get(key);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeoutIds.delete(key);
        }
    }
    resetTimeout(key) {
        this.clearTimeout(key);
        const timeoutId = window.setTimeout(() => {
            const notification = this.activeNotifications.get(key);
            if (!(notification === null || notification === void 0 ? void 0 : notification.isImportant))
                this.removeNotification(key);
        }, this.timeoutDelay);
        this.timeoutIds.set(key, timeoutId);
    }
}
class GameNotificationElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('game-notification-template'));
        this.container = getElementFromFragment(this._content, 'container', 'div');
        this.media = getElementFromFragment(this._content, 'media', 'img');
        this.quantity = getElementFromFragment(this._content, 'quantity', 'span');
        this.divQuantity = getElementFromFragment(this._content, 'div-quantity', 'div');
        this.text = getElementFromFragment(this._content, 'text', 'span');
        this.inBank = getElementFromFragment(this._content, 'in-bank', 'span');
        this.iconImportant = getElementFromFragment(this._content, 'icon-important', 'div');
        this.splashContainer = getElementFromFragment(this._content, 'splash-container', 'div');
    }
    get isCompact() {
        return this.container.classList.contains('compact');
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.initSplashManager();
    }
    initSplashManager() {
        this.splashManager = new SplashManager(this.splashContainer);
    }
    setNotification(key, notification, game) {
        this.media.src = notification.media;
        this.setQuantity(notification, key.type);
        if (game.settings.showItemNamesInNotifications)
            this.setText(notification.text);
        this.toggleCompact();
    }
    setImportance(key, notification, game) {
        if (notification.isImportant) {
            this.container.style.pointerEvents = 'all';
            this.container.classList.add('pointer-enabled');
            this.iconImportant.classList.remove('d-none');
            this.container.onclick = () => {
                game.notifications.removeNotification(key);
            };
        } else {
            this.container.style.pointerEvents = 'none';
            this.container.classList.remove('pointer-enabled');
            this.iconImportant.classList.add('d-none');
            this.container.onclick = () => {};
        }
    }
    setTextMinWidth(width) {
        //this.text.style.minWidth = width;
    }
    setText(text) {
        this.text.innerHTML = text;
    }
    setInBankText(text) {
        this.inBank.textContent = text;
    }
    toggleCompact() {
        if (game.settings.useCompactNotifications) {
            this.container.classList.add('compact');
            this.media.classList.add('compact');
            this.quantity.classList.add('font-size-sm');
        } else {
            this.container.classList.remove('compact');
            this.media.classList.remove('compact');
            this.quantity.classList.remove('font-size-sm');
        }
    }
    setQuantity(notification, type) {
        if (notification.quantity === 0)
            this.divQuantity.classList.add('d-none');
        else
            this.divQuantity.classList.remove('d-none');
        const textClass = notification.quantity > 0 && !notification.isError ? 'text-success' : 'text-danger';
        const textSymbol = notification.quantity > 0 && !notification.isError && type !== 'MasteryLevel' ? '+' : '';
        this.quantity.classList.add(textClass);
        let qty = `${textSymbol}${numberWithCommas(notification.quantity)}`;
        if (notification.isError) {
            for (let i = 3; i < notification.quantity; i += 3) {
                if (i % 12 === 0)
                    qty = `${textSymbol}${numberWithCommas(notification.quantity)}`;
                qty += `?`;
            }
        }
        this.quantity.textContent = qty;
    }
    setBorder(colour) {
        this.container.style.border = `1px solid ${colour}`;
    }
    setBottomPos(pos) {
        this.container.style.bottom = `${pos}px`;
    }
    setHorizontalPos(posType) {
        switch (posType) {
            case 0 /* NotificationHorizontalPositions.LEFT */ :
                this.container.style.left = window.innerWidth >= 992 ? '245px' : '5px';
                this.container.style.marginRight = '60px';
                this.container.style.marginLeft = '';
                this.container.style.right = 'unset';
                this.container.style.transform = 'translateX(0%)';
                break;
            case 2 /* NotificationHorizontalPositions.RIGHT */ :
                this.container.style.right = '0px';
                this.container.style.marginLeft = '10%';
                this.container.style.marginRight = '60px';
                this.container.style.left = 'unset';
                this.container.style.transform = 'translateX(0%)';
                break;
            case 1 /* NotificationHorizontalPositions.CENTER */ :
                this.container.style.left = '50%';
                this.container.style.marginRight = '-40%';
                this.container.style.marginLeft = '';
                this.container.style.right = 'unset';
                this.container.style.transform = 'translateX(-50%)';
        }
    }
    addPulse() {
        this.divQuantity.classList.add('pulseNotification');
    }
    removePulse() {
        this.divQuantity.classList.remove('pulseNotification');
    }
}
window.customElements.define('game-notification', GameNotificationElement);
//# sourceMappingURL=notifications.js.map
checkFileVersion('?12097')