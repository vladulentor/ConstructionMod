const { loadModule } = mod.getContext(import.meta);

const languages = {
    'en': 'src/language/en.mjs',
    'de': 'src/language/de.mjs',
    'ru': 'src/language/ru.mjs',
    'zh-CN': 'src/language/zh-CN.mjs',
    'zh-TW': 'src/language/zh-TW.mjs',
    'it': 'src/language/it.mjs',
    'ko': 'src/language/ko.mjs',
    'ja': 'src/language/ja.mjs',
    'fr': 'src/language/fr.mjs',
};

class TranslationManager {
    async syncLang() {
        if (this.setLang == setLang)
            return;
        this.setLang = setLang;
        if (this.setLang === 'lemon' || this.setLang === 'carrot') {
            this.setLang = 'en';
        }
        var loadPath = languages[this.setLang];
        if (loadPath == undefined) {
            console.error(`No rielk language file specified for language: '${this.setLang}'. Defaulted to English.`)
            loadPath = languages['en'];
        }
        const { language } = await loadModule(loadPath);
        this.loadedLangJson = language;
    }
}

const tm = new TranslationManager();
await tm.syncLang();

export function getRielkLangString(identifier) {
    const translation = tm.loadedLangJson[identifier];
    if (translation === undefined || translation === '') {
        if (DEBUGENABLED) {
            console.warn(`Tried to get unknown language string: ${identifier}`);
        }
        return `UNDEFINED TRANSLATION: (RIELK) :${identifier}`;
    }
    return translation;
}

export function templateRielkLangString(identifier, templateData) {
    return templateString(getRielkLangString(identifier), templateData);
}
export function templateRielkLangStringWithNodes(id, nodeData, textData, clone=true) {
    return templateStringWithNodes(getRielkLangString(id), nodeData, textData, clone);
}

export function patchTranslations(ctx) {
    if (typeof setLanguage === "function") {
        const superSetLanguage = setLanguage;
        setLanguage = (...args) => {
            superSetLanguage(...args);
            if (tm && typeof tm.syncLang === "function") tm.syncLang();
        };
    }
    else if (typeof saveAndLoadLanguage === "function") { 
        const superSaveAndLoadLanguage = saveAndLoadLanguage;
        saveAndLoadLanguage = (...args) => {
            const result = superSaveAndLoadLanguage(...args);
            if (tm && typeof tm.syncLang === "function") tm.syncLang();
            return result;
        };
    }


    const superUpdateUIForLanguageChange = updateUIForLanguageChange;
    updateUIForLanguageChange = (...args) => {
        superUpdateUIForLanguageChange(...args);
        if (window.customElements.get('rielk-lang-string')) {
            const langStrings = document.getElementsByTagName('rielk-lang-string');
            for (let i = 0; i < langStrings.length; i++) {
                langStrings[i].updateTranslation();
            }
        }

    }

    ctx.patch(Item, 'name').get(function (patch) {
        if (this.namespace === 'rielkConstruction') 
            return getRielkLangString(`ITEM_NAME_${this.localID}`);
        return patch();
    });
    ctx.patch(Item, 'description').get(function (patch) {
        if (this.namespace === 'rielkConstruction' && this._customDescription !== undefined) 
            return getRielkLangString(`ITEM_DESCRIPTION_${this.localID}`);
        return patch();
    });
    ctx.patch(ShopPurchase, 'name').get(function (patch) {
        if (this.namespace === 'rielkConstruction' && this._customName !== undefined)
            return getRielkLangString(`SHOP_NAME_${this.localID}`);
        return patch();
    });
    ctx.patch(ShopPurchase, 'description').get(function (patch) {
        if (this.namespace === 'rielkConstruction' && this._customDescription !== undefined) 
            return getRielkLangString(`SHOP_DESCRIPTION_${this.localID}`);
        return patch();
    });
    ctx.patch(HerbloreRecipe, 'name').get(function (patch) {
        if (this.namespace === 'rielkConstruction') 
            return getRielkLangString(`POTION_NAME_${this.localID}`);
        return patch();
    });
    ctx.patch(Pet, 'name').get(function (patch) {
        if (this.namespace === 'rielkConstruction')
            return getRielkLangString(`PET_NAME_${this.localID}`);
        return patch();
    });
    ctx.patch(ModifierDescription, 'template').get(function (patch) {
        const ret = patch();
        if (this._lang !== undefined && ret.startsWith('UNDEFINED TRANSLATION')){
            const ret2 = getRielkLangString(this._lang);
            if (ret2.startsWith('UNDEFINED TRANSLATION'))
                return ret;
            return ret2;
        }
        return ret;
    });
    ctx.patch(MasteryLevelUnlock, 'description').get(function (patch) {
        const ret = patch();
        if (this._descriptionID !== undefined && ret.startsWith('UNDEFINED TRANSLATION')){
            const ret2 = getRielkLangString(`MASTERY_BONUS_ ${this.skill.localID}_ ${this._descriptionID}`);
            if (ret2.startsWith('UNDEFINED TRANSLATION'))
                return ret;
            return ret2;
        }
        return ret;
    });
}
