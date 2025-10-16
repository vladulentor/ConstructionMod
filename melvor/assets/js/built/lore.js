"use strict";
class LoreBook extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        try {
            this._title = data.title;
            this._media = data.media;
            this.unlockRequirements = game.getRequirementsFromData(data.unlockRequirements);
        } catch (e) {
            throw new DataConstructionError(LoreBook.name, e, this.id);
        }
    }
    get title() {
        if (this.isModded)
            return this._title;
        return getLangString(`LORE_TITLE_${this.localID}`);
    }
    get media() {
        return this.getMediaURL(this._media);
    }
}
class Lore {
    constructor(game) {
        this.game = game;
        this.books = new NamespaceRegistry(this.game.registeredNamespaces, LoreBook.name);
        this.renderUnlocks = false;
        this.bookButtons = new Map();
    }
    registerLore(namespace, loreData) {
        loreData.forEach((data) => this.books.registerObject(new LoreBook(namespace, data, this.game)));
    }
    loadLoreButtons() {
        const baseHeader = document.getElementById('base-game-lore-header');
        let lastBase = baseHeader;
        const throneHeader = document.getElementById('throne-lore-header');
        let lastThrone = throneHeader;
        this.books.forEach((book) => {
            const button = new LoreBookButtonElement();
            button.className = `col-12 p-2`;
            button.setImage(book);
            switch (book.namespace) {
                case "melvorD" /* Namespaces.Demo */ :
                case "melvorF" /* Namespaces.Full */ :
                    lastBase.after(button);
                    lastBase = button;
                    break;
                case "melvorTotH" /* Namespaces.Throne */ :
                    lastThrone.after(button);
                    lastThrone = button;
                    break;
            }
            this.bookButtons.set(book, button);
        });
        if (!cloudManager.hasTotHEntitlementAndIsEnabled)
            hideElement(throneHeader);
    }
    onLoad() {
        this.updateLoreBookUnlocks();
    }
    render() {
        if (!this.renderUnlocks)
            return;
        this.updateLoreBookUnlocks();
        this.renderUnlocks = false;
    }
    updateLoreBookUnlocks() {
        this.books.forEach((book) => {
            var _a;
            (_a = this.bookButtons.get(book)) === null || _a === void 0 ? void 0 : _a.updateForUnlock(book, this.game);
        });
    }
    readLore(book) {
        const bookElement = document.getElementById(`modal-book-${book.id}`);
        if (bookElement === null)
            throw new Error(`No Lore book modal for ${book.id} exists in the DOM`);
        $(bookElement).modal('show');
    }
}
Lore.LORE = [{
        get title() {
            return getLangString('LORE_TITLE_Futures_Prophecy');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_0_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_7')}`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_1');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_1_0')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_2');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_2_0')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_3');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_3_0')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_4');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_4_0')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Unknown_Evil');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_5_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_16')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_New_Dawn');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_6_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_6')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Beginning_Of_The_End');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_7_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_19')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Impending_Darkness');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_8_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_29')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_30')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_31')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_32')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_33')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book1');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_9_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_29')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book2');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_10_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_21')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book3');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_11_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_19')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book4');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_12_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_29')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_30')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book5');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_13_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_29')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_30')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_31')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_32')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_33')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_34')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book6');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_14_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_16')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book7a');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_15_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_17')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book7b');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_16_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_29')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_30')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_31')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_32')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_33')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book8');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_17_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_16')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book9');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_18_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_28')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book10');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_19_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_19')}<br>`;
        },
    },
];
class LoreBookButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('lore-book-button-template'));
        this.bookImage = getElementFromFragment(this._content, 'book-image', 'img');
        this.bookTitle = getElementFromFragment(this._content, 'book-title', 'h5');
        this.readButton = getElementFromFragment(this._content, 'read-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setImage(book) {
        this.bookImage.src = book.media;
    }
    updateForUnlock(book, game) {
        const unlockElements = this.createUnlockElements(book, game);
        if (!unlockElements.length) {
            this.bookTitle.innerHTML = book.title;
            this.readButton.disabled = false;
            this.readButton.onclick = () => game.lore.readLore(book);
        } else {
            this.bookTitle.textContent = '';
            this.readButton.disabled = true;
            this.readButton.onclick = null;
            unlockElements.forEach((unlock) => {
                this.bookTitle.appendChild(unlock);
            });
        }
    }
    createUnlockElement(costNodes, met) {
        const element = createElement('div', {
            className: this.getTextClass(met),
            children: costNodes
        });
        return element;
    }
    createUnlockElements(book, game) {
        const requirements = book.unlockRequirements;
        const unlockElements = [];
        requirements.forEach((requirement) => {
            if (game.checkRequirement(requirement))
                return;
            unlockElements.push(this.createUnlockElement(requirement.getNodes('skill-icon-xs mr-1 ml-1'), game.checkRequirement(requirement)));
        });
        return unlockElements;
    }
    getTextClass(met) {
        return met ? 'text-success' : 'text-danger';
    }
}
window.customElements.define('lore-book-button', LoreBookButtonElement);
//# sourceMappingURL=lore.js.map
checkFileVersion('?12097')