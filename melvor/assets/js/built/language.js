"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let setLang = 'en';
let loadedLangJson;
/** Language specific collator for the currently loaded language. Useful for sorting things alphabetically. */
let langCollator = new Intl.Collator('en');
const langVersion = 1656;
const LANGS = [
    'en',
    'zh-CN',
    'zh-TW',
    'fr',
    'de',
    'it',
    'ko',
    'ja',
    'pt',
    'pt-br',
    'es',
    'ru',
    'tr',
    'lemon',
    'carrot',
];

function fetchLanguageJSON(lang) {
    return __awaiter(this, void 0, void 0, function*() {
        const URL = `./lang/${lang}.json?${langVersion}`;
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const response = yield fetch(URL, {
            method: 'GET',
            headers: headers,
        });
        if (!response.ok)
            throw new Error(`Could not fetch file: ${URL}`);
        return yield response.json();
    });
}

function setLanguage(lang) {
    return __awaiter(this, void 0, void 0, function*() {
        if (setLang !== 'lemon' && lang !== 'lemon')
            localStorage.setItem('prevLanguage', lang);
        if (!LANGS.includes(lang))
            lang = LANGS[0];
        localStorage.setItem('language', lang);
        langCollator = new Intl.Collator(lang === 'lemon' || lang === 'carrot' ? 'en' : lang);
        yield fetchLanguageJSON(lang).then((json) => {
            Object.entries(json).forEach(([key, value]) => {
                json[key] = assets.replaceLangStringURIs(value);
            });
            loadedLangJson = json;
            setLang = lang;
            updateUIForLanguageChange();
        }, (error) => {
            console.error(error);
            // Insert actual error message to user here
        });
    });
}

function localiseSwal2() {
    if (setLang !== 'en') {
        $('.swal2-confirm').text(getLangString('CHARACTER_SELECT_42'));
        $('.swal2-cancel').text(getLangString('CHARACTER_SELECT_45'));
    }
}
const defaultSwalCustomClass = {
    container: 'swal-infront',
    confirmButton: 'btn btn-primary m-1',
    denyButton: 'btn btn-secondary m-1',
    cancelButton: 'btn btn-danger m-1',
};
let SwalLocale = Swal.mixin({
    didOpen: () => {
        localiseSwal2();
    },
    customClass: defaultSwalCustomClass,
    buttonsStyling: false,
});
/** Creates a custom class object for Swal2 based on the default custom styling */
function createSwalCustomClass(customClass) {
    return Object.assign({}, defaultSwalCustomClass, customClass);
}

function updateUIForLanguageChange() {
    SwalLocale = Swal.mixin({
        customClass: defaultSwalCustomClass,
        buttonsStyling: false,
        confirmButtonText: getLangString('CHARACTER_SELECT_42'),
        cancelButtonText: getLangString('CHARACTER_SELECT_45'),
    });
    $('.page-nav-name-misc-modding').text(getLangString('MOD_MANAGER_MODDING'));
    $('.page-nav-name-misc-mod-manager').text(getLangString('MOD_MANAGER_MOD_MANAGER'));
    $('.page-nav-name-misc-mod-settings').text(getLangString('MOD_MANAGER_MOD_SETTINGS'));
    $('.placeholder-username').attr('placeholder', getLangString('CHARACTER_SELECT_16'));
    $('.placeholder-password').attr('placeholder', getLangString('CHARACTER_SELECT_17'));
    $('.placeholder-confirm-password').attr('placeholder', getLangString('CHARACTER_SELECT_22'));
    $('.placeholder-email').attr('placeholder', getLangString('CHARACTER_SELECT_21'));
    $('.toth-lang-cta').text(getLangString('IAP_BUY_TOTH'));
    if (setLang === 'ru')
        $('#game-guide-header-span').text(getLangString('MENU_TEXT_HELP'));
    if (isLoaded) {
        smithingSelectionTabs.forEach((tab) => tab.localize(game.smithing));
        fletchingSelectionTabs.forEach((tab) => tab.localize(game.fletching));
        craftingSelectionTabs.forEach((tab) => tab.localize(game.crafting));
        runecraftingSelectionTabs.forEach((tab) => tab.localize(game.runecrafting));
        herbloreSelectionTabs.forEach((tab) => tab.localize(game.herblore));
        altMagicSelection.localize(game.altMagic);
        game.firemaking.localize();
        localizeSummoning();
        localizeSettings();
        $('.lang-bank-string-55').html(getLangString('BANK_STRING_55'));
        $('.lang-bank-string-56').html(getLangString('BANK_STRING_56'));
        $('.lang-bank-string-57').html(getLangString('BANK_STRING_57'));
        statTables.forEach((table) => table.localize());
        $('.placeholder-search-bank').attr('placeholder', getLangString('BANK_STRING_5'));
        $('.placeholder-exported-save').attr('placeholder', getLangString('MENU_TEXT_PLACEHOLDER_EXPORTED_SAVE'));
        $('.placeholder-sell-x').attr('placeholder', getLangString('MENU_TEXT_PLACEHOLDER_SELL_X'));
        $('.lang-minibar-you').html(templateString(getLangString('MENU_TEXT_MINIBAR_YOU'), {
            hpValue: ``
        }));
        $('.lang-minibar-enemy').html(templateString(getLangString('MENU_TEXT_MINIBAR_ENEMY'), {
            hpValue: ``
        }));
        $('.lang-bank-59').html(templateString(getLangString('BANK_STRING_59'), {
            bankSpace: ``
        }));
        if (setLang !== 'en') {
            $('.alt-desc').addClass('d-none');
            $('.hide-non-en').addClass('d-none');
        }
        Array.from(document.getElementsByClassName('todo-localize')).forEach((el) => {
            setLang !== 'en' ? el.classList.add('d-none') : el.classList.remove('d-none');
        });
    }
    if (window.customElements.get('lang-string')) {
        const langStrings = document.getElementsByTagName('lang-string');
        for (let i = 0; i < langStrings.length; i++) {
            langStrings[i].updateTranslation();
        }
    } else {
        window.customElements.define('lang-string', LangStringElement); //Define this element here
    }
}

function getLangString(identifier) {
    const translation = loadedLangJson[identifier];
    if (translation === undefined || translation === '') {
        if (DEBUGENABLED) {
            console.warn(`Tried to get unknown language string: ${identifier}`);
            // console.trace();
        }
        return `UNDEFINED TRANSLATION: :${identifier}`;
    }
    return translation;
}

function initializeAltText() {
    if (game.settings.enableAccessibility) {
        const images = document.querySelectorAll('img[data-alt-lang-id]');
        images.forEach((img) => {
            const langID = img.getAttribute('data-alt-lang-id');
            img.alt = getLangString(langID);
            img.removeAttribute('data-alt-lang-id');
        });
    }
}
//# sourceMappingURL=language.js.map
checkFileVersion('?12097')