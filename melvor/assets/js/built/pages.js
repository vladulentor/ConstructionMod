"use strict";
class Page extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this._customName = data.customName;
            this._media = data.media;
            this.containerID = data.containerID;
            this.headerBgClass = data.headerBgClass;
            this.hasGameGuide = data.hasGameGuide;
            this.canBeDefault = data.canBeDefault;
            if (data.skills !== undefined) {
                this.skills = game.skills.getArrayFromIds(data.skills);
            }
            if (data.action !== undefined) {
                this.action = game.actions.getObjectSafe(data.action);
            }
            this.skillSidebarCategoryID = data.skillSidebarCategoryID;
            this.sidebarItem = data.sidebarItem;
            this.sidebarSubItems = data.sidebarSubItems;
            this.displayClass = data.displayClass;
        } catch (e) {
            throw new DataConstructionError(Page.name, e, this.id);
        }
    }
    get name() {
        if (this._customName !== undefined) {
            if (this.isModded) {
                return this._customName;
            } else {
                return getLangString(`PAGE_NAME_${this.localID}`);
            }
        }
        if (this.skills !== undefined) {
            return this.skills[0].name;
        }
        return 'Error: No Page Name';
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    applyDataModification(modData, game) {
        var _a;
        if (modData.skills !== undefined) {
            if (modData.skills.remove !== undefined) {
                const removeSet = new Set(modData.skills.remove);
                this.skills = (_a = this.skills) === null || _a === void 0 ? void 0 : _a.filter((skill) => !removeSet.has(skill.id));
            }
            if (modData.skills.add !== undefined) {
                modData.skills.add.forEach((s) => {
                    var _a, _b;
                    const skill = game.skills.getObjectByID(s.skillID);
                    if (skill === undefined)
                        throw new Error(`Error modifying Page: ${this.id}. Skill with id: ${s.skillID} is not registered.`);
                    if (this.skills !== undefined && s.insertAt !== undefined) {
                        if (s.insertAt >= this.skills.length) {
                            this.skills.push(skill);
                        } else {
                            (_a = this.skills) === null || _a === void 0 ? void 0 : _a.splice(s.insertAt, 0, skill);
                        }
                    } else if (this.skills !== undefined) {
                        (_b = this.skills) === null || _b === void 0 ? void 0 : _b.push(skill);
                    } else {
                        this.skills = [skill];
                    }
                });
            }
        }
    }
    /** Generates sidebar elements for the page, with the exception of skills */
    generateSideBar() {
        var _a, _b;
        if (this.sidebarItem !== undefined) {
            const category = sidebar.category(this.sidebarItem.categoryID);
            const itemConfig = JSON.parse(JSON.stringify(this.sidebarItem));
            itemConfig.onClick = () => changePage(this);
            itemConfig.name = this.name;
            if (this.sidebarItem.icon !== undefined && this.sidebarItem.icon !== null)
                itemConfig.icon = this.getMediaURL(this.sidebarItem.icon);
            // Specific generation for game pages
            switch (this.id) {
                case "melvorD:TutorialIsland" /* PageIDs.TutorialIsland */ :
                    itemConfig.aside = createElement('i', {
                        className: 'text-success fa fa-check mr-2'
                    });
                    break;
                case "melvorD:Bank" /* PageIDs.Bank */ :
                    itemConfig.aside = createElement('span', {
                        className: 'spinner-border spinner-border-sm text-info'
                    });
                    break;
                case "melvorD:Shop" /* PageIDs.Shop */ :
                    {
                        itemConfig.asideClass = 'bg-dark rounded p-1 font-size-xs text-right lh-1-2';
                        const gpEl = createElement('span', {
                            id: 'nav-shop-currency-quantity',
                            className: 'font-w600 js-tooltip-enabled',
                            text: '',
                            attributes: [
                                ['data-currency-quantity', "melvorD:GP" /* CurrencyIDs.GP */ ],
                                ['data-currency-highlight', 'true'],
                            ],
                        });
                        gpEl.innerHTML = '<span class="spinner-border spinner-border-sm text-info"></span>';
                        itemConfig.aside = createElement('span', {
                            id: 'nav-shop-currency-tooltip',
                            attributes: [
                                ['data-currency-tooltip', "melvorD:GP" /* CurrencyIDs.GP */ ],
                                ['data-toggle', 'tooltip'],
                                ['data-html', 'true'],
                                ['data-placement', 'bottom'],
                                ['data-original-title', '0'],
                            ],
                            children: [
                                createElement('img', {
                                    id: 'nav-shop-currency-image',
                                    className: 'skill-icon-xxs',
                                    attributes: [
                                        ['src', assets.getURI("assets/media/main/coins.png" /* Assets.GPIcon */ )]
                                    ],
                                }),
                                gpEl,
                            ],
                        });
                        break;
                    }
            }
            category.item(this.id, itemConfig);
        }
        (_a = this.skills) === null || _a === void 0 ? void 0 : _a.forEach((skill) => {
            var _a, _b, _c;
            const category = sidebar.category(this.skillSidebarCategoryID || (this.id === "melvorD:Combat" /* PageIDs.Combat */ ? 'Combat' : 'Non-Combat'));
            const sideBarOptions = {
                icon: skill.media,
                name: skill.name,
                aside: createElement('span'),
                onClick: () => changePage(this, -1, skill),
            };
            if (skill.id === "melvorD:Magic" /* SkillIDs.Magic */ && this.id !== "melvorD:Combat" /* PageIDs.Combat */ )
                sideBarOptions.name = this.name;
            const navItem = category.item(skill.id, sideBarOptions);
            switch (skill.id) {
                case "melvorD:Hitpoints" /* SkillIDs.Hitpoints */ :
                    (_a = navItem.nameEl) === null || _a === void 0 ? void 0 : _a.appendChild(createElement('small', {
                        id: 'nav-hitpoints-current',
                        className: 'text-success',
                        text: '(10)'
                    }));
                    break;
                case "melvorD:Prayer" /* SkillIDs.Prayer */ :
                    (_b = navItem.nameEl) === null || _b === void 0 ? void 0 : _b.appendChild(createElement('small', {
                        id: 'combat-player-prayer-points-2',
                        className: 'ml-1 text-success',
                        text: '1'
                    }));
                    break;
                case "melvorD:Slayer" /* SkillIDs.Slayer */ :
                    {
                        const currency = createElement('small', {
                            className: 'text-success'
                        });
                        const img = createElement('img', {
                            id: 'nav-slayer-currency-icon',
                            className: 'skill-icon-xxs ml-1',
                        });
                        img.src = assets.getURI("assets/media/main/slayer_coins.png" /* Assets.SlayerCoinIcon */ );
                        currency.append(img, createElement('span', {
                            id: 'nav-slayer-currency',
                            attributes: [
                                ['data-currency-quantity', "melvorD:SlayerCoins" /* CurrencyIDs.SlayerCoins */ ]
                            ],
                        }));
                        (_c = navItem.nameEl) === null || _c === void 0 ? void 0 : _c.appendChild(currency);
                    }
                    break;
            }
        });
        (_b = this.sidebarSubItems) === null || _b === void 0 ? void 0 : _b.forEach((subItem, i) => {
            const category = sidebar.category(subItem.categoryID);
            const item = category.item(subItem.itemID);
            const subItemConfig = JSON.parse(JSON.stringify(subItem));
            subItemConfig.onClick = () => changePage(this, i);
            if (!this.isModded && subItemConfig.name !== undefined) {
                subItemConfig.name = getLangString(`PAGE_NAME_${this.localID}_SUBCATEGORY_${i}`);
            }
            item.subitem(`${this.id}:${i}`, subItemConfig);
        });
    }
}
//# sourceMappingURL=pages.js.map
checkFileVersion('?12097')