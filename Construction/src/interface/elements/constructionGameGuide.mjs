const { loadModule } = mod.getContext(import.meta);
const ctx = mod.getContext(import.meta);
const { getRielkLangString, templateRielkLangStringWithNodes } =
    await loadModule('src/language/translationManager.mjs');

function BR() { return document.createElement('br'); }
function icon(src, h, cls = 'm-1', style = '') {
    return createElement('img', {
        className: cls,
        attributes: [
            ['src', src],
            ['height', `${h}px`],
            ...(style ? [['style', style]] : []),
        ],
    });
}
function strong(text, extraClass = '') {
    const el = createElement('strong', { className: extraClass });
    el.textContent = text;
    return el;
}
function link(href, childNode = null, opts = {}) {
    const a = createElement('a', {
        className: opts.className ?? '',
        attributes: [['href', href], ['target', '_blank']],
    });
    if (childNode) a.append(childNode);
    if (opts.text) a.append(document.createTextNode(opts.text));
    if (typeof opts.onclick === 'function') a.addEventListener('click', opts.onclick);
    return a;
}
function setCardIcon(cardEl, src) {
    const box = cardEl.querySelector('.mr-3');
    if (!box) return;
    box.append(icon(src, 48, 'm-2'));
}
function setFloatCardIcon(cardEl, src, margin = '0 12px 0 0') {
    if (!cardEl) return;
    const prev = cardEl.querySelector(':scope > img[data-card-float]');
    if (prev) prev.remove();
    const img = icon(src, 56, '', `float:left; margin:${margin};`);
    img.dataset.cardFloat = '1';
    cardEl.prepend(img);
}

export function mountConstructionGuide({ construction, masteryBarImageSrc, formatter = ({ text }) => text }) {
    const nodeData = {
        ConstructionIcon64: icon(game.construction.media, 64, 'm-2'),
        ConstructionIcon24: icon(game.construction.media, 24, 'm-1'),
        ConstructionIcon16: icon(game.construction.media, 16, 'm-1'),

        HouseIcon24: icon(masteryBarImageSrc, 24, 'm-1'),
        HouseIcon16: icon(masteryBarImageSrc, 16, 'm-1'),

        HouseWordStyled: (() => {
            const s = createElement('span', { className: 'construction-victory' });
            s.textContent = getRielkLangString('MENU_HOUSE');
            return s;
        })(),

        Beam16: icon(game.items.getObjectByID('rielkConstruction:Teak_Beams').media, 16),
        Bar16: icon(game.items.getObjectByID('melvorD:Mithril_Bar').media, 16),
        Slivers16: icon(game.items.getObjectByID('rielkConstruction:Red_Dhide_Leather_Slivers').media, 16),
        Rune16: icon(game.items.getObjectByID('melvorD:Fire_Rune').media, 16),

        Fletching16: icon('assets/media/skills/fletching/fletching.png', 16, 'm-1'),
        Woodcutting16: icon('assets/media/skills/woodcutting/woodcutting.png', 16, 'm-1'),
        Smithing16: icon('assets/media/skills/smithing/smithing.png', 16, 'm-1'),
        Mining16: icon('assets/media/skills/mining/mining.png', 16, 'm-1'),
        Crafting16: icon('assets/media/skills/crafting/crafting.png', 16, 'm-1'),
        Shop16: icon('assets/media/main/gp.png', 16, 'm-1'),
        Runecrafting16: icon('assets/media/skills/runecrafting/runecrafting.png', 16, 'm-1'),

        MaterialsCat16: icon(construction.categories.getObjectByID('rielkConstruction:Materials').media, 16, 'm-1'),
        FurnitureCat16: icon(construction.categories.getObjectByID('rielkConstruction:House').media, 16, 'm-1'),
        Efficiency16: icon(ctx.getResourceUrl('assets/efficiency.webp'), 16, 'm-1'),

        BR: BR(),
        BothStrong: strong(getRielkLangString('GUIDE_TERM_BOTH')),

        ModioLink: link(
            'https://mod.io/g/melvoridle/m/rielk-construction',
            icon('https://mod.io/images/branding/modio-cog-white.svg', 16, 'skill-icon-xs'),
            { className: 'btn btn-sm btn-outline-secondary p-0 modio-link ml-2 pointer-enabled' }
        ),
        ChangeListLink: link(
            'https://github.com/vladulentor/ConstructionMod/blob/master/CHANGE_LIST.md',
            null,
            { text: getRielkLangString('GUIDE_LINK_HERE') }
        ),
    };

    function appendLangNodes(targetEl, id, extraNodeData = {}, extraTextData = {}) {
        let nodes = templateRielkLangStringWithNodes(
            id,
            { ...nodeData, ...extraNodeData },
            {
                constructionTitle: getRielkLangString('SKILL_NAME_Construction'),
                houseWord: getRielkLangString('MENU_HOUSE'),
                materialsWord: getRielkLangString('GUIDE_TERM_MATERIALS'),
                furnitureWord: getRielkLangString('GUIDE_TERM_FURNITURE'),
                Beams: getRielkLangString('GUIDE_TERM_BEAMS'),
                Bars: getRielkLangString('GUIDE_TERM_BARS'),
                Slivers: getRielkLangString('GUIDE_TERM_SLIVERS'),
                Runes: getRielkLangString('GUIDE_TERM_RUNES'),
                Fletching: getRielkLangString('GUIDE_TERM_FLETCHING'),
                Runecrafting: getLangString('SKILL_NAME_Runecrafting'),
                Woodcutting: getRielkLangString('GUIDE_TERM_WOODCUTTING'),
                Smithing: getRielkLangString('GUIDE_TERM_SMITHING'),
                Mining: getRielkLangString('GUIDE_TERM_MINING'),
                Crafting: getRielkLangString('GUIDE_TERM_CRAFTING'),
                Shop: getRielkLangString('GUIDE_TERM_SHOP'),
                ExternalLinkNote: getRielkLangString('GUIDE_EXTERNAL_LINK_NOTE'),
                ...extraTextData,
            }
        );
        nodes = nodes.map(n => (typeof n === 'string' ? formatter({ text: n }) : n));
        targetEl.replaceChildren(...nodes);
    }

    const frag = new DocumentFragment();
    let root;

    if (setLang == 'en' || setLang == 'carrot' || setLang == 'lemon') {
        frag.append(getTemplateNode('tutorial-template-Construction'));
        root = getElementFromFragment(frag, 'tutorial-page-Construction', 'div', true);

    }
    else {
        frag.append(getTemplateNode('tutorial-template-Construction-translated'));
        root = getElementFromFragment(frag, 'tutorial-page-Construction-1', 'div', true);
    }
    const guideContainer = document.querySelector('#modal-game-guide .block-content.block-content-full');
    guideContainer.append(root);

    const h2 = root.querySelector('h2.h1.mb-2');
    const subs = root.querySelectorAll('h5.font-w400');
    const sub1 = subs[0];
    const sub2 = subs[1];

    const mainRow = root.querySelector('.row.gutters-tiny');
    const [leftCol, rightCol] = mainRow.querySelectorAll(':scope > .col-md-6');

    const leftCards = leftCol.querySelectorAll('.media.d-flex');
    const rightCards = rightCol.querySelectorAll('.media.d-flex');

    const planksCard = leftCards[0];
    const nailsCard = leftCards[1];
    const strapsCard = rightCards[0];
    const bricksCard = rightCards[1];

    const nestedRows = mainRow.querySelectorAll(':scope > .row');
    const mechRow = nestedRows[0];
    const extRow = nestedRows[1];

    const mechCols = mechRow.querySelectorAll(':scope > .col-md-6');
    const mechOuterLeft = mechCols[0].querySelector(':scope > .block-content.block-content-full.p-0.text-left');
    const mechOuterRight = mechCols[1].querySelector(':scope > .block-content.block-content-full.p-0.text-left');
    const effCard = mechOuterLeft.querySelector(':scope > .block-content.block-content-full.text-left');
    const houseCard = mechOuterRight.querySelector(':scope > .block-content.block-content-full.text-left');

    const [extColLeft] = extRow.querySelectorAll(':scope > .col-md-6');
    const extOuterLeft = extColLeft?.querySelector(':scope > .block-content.block-content-full.p-0.text-left');
    const extCard = extOuterLeft?.querySelector(':scope > .block-content.block-content-full.text-left');

    appendLangNodes(h2, 'GUIDE_CONSTR_HERO', {}, { constructionTitle: getRielkLangString('SKILL_NAME_Construction') });
    appendLangNodes(sub1, 'GUIDE_CONSTR_SUB1');
    appendLangNodes(sub2, 'GUIDE_CONSTR_SUB2', {}, { constructionTitle: getRielkLangString('SKILL_NAME_Construction') });

    root.querySelectorAll('h4.mb-2')[0].textContent = getRielkLangString('GUIDE_SECTION_MATERIALS_TITLE');
    root.querySelectorAll('h4.mb-2')[2].textContent = getRielkLangString('GUIDE_SECTION_MECH_TITLE');
    root.querySelectorAll('h4.mb-2')[3].textContent = getRielkLangString('GUIDE_SECTION_HOUSE_TITLE');
    root.querySelectorAll('h4.mb-2')[4].textContent = getRielkLangString('GUIDE_SECTION_EXTENDED_TITLE');

    const fillMaterial = (cardEl, nameKey, textKey) => {
        cardEl.querySelector('.font-w600').textContent = getRielkLangString(nameKey);
        appendLangNodes(cardEl.querySelector('.font-size-sm'), textKey);
    };
    fillMaterial(planksCard, 'GUIDE_PLANKS_NAME', 'GUIDE_PLANKS_TEXT');
    fillMaterial(nailsCard, 'GUIDE_NAILS_NAME', 'GUIDE_NAILS_TEXT');
    fillMaterial(strapsCard, 'GUIDE_STRAPS_NAME', 'GUIDE_STRAPS_TEXT');
    fillMaterial(bricksCard, 'GUIDE_BRICKS_NAME', 'GUIDE_BRICKS_TEXT');

    setCardIcon(planksCard, game.items.getObjectByID('rielkConstruction:Teak_Planks').media);
    setCardIcon(nailsCard, game.items.getObjectByID('rielkConstruction:Mithril_Nails').media);
    setCardIcon(strapsCard, game.items.getObjectByID('rielkConstruction:Red_Dhide_Leather_Straps').media);
    setCardIcon(bricksCard, game.items.getObjectByID('rielkConstruction:Limestone_Bricks').media);

    effCard.querySelector('.font-w600').textContent = getRielkLangString('GUIDE_EFFICIENCY_TITLE');
    const effParas = effCard.querySelectorAll('.font-size-sm.mb-2');
    appendLangNodes(effParas[0], 'GUIDE_EFFICIENCY_P1A');
    appendLangNodes(effParas[0], 'GUIDE_EFFICIENCY_P1B');
    appendLangNodes(effParas[1], 'GUIDE_EFFICIENCY_P2');
    const warn = createElement('span', { className: 'text-warning' });
    warn.textContent = getRielkLangString('GUIDE_EFFICIENCY_WARNING');
    effParas[2].replaceChildren(warn);

    houseCard.querySelector('.font-w600').textContent = getRielkLangString('GUIDE_SECTION_HOUSE_TITLE');
    const houseParas = houseCard.querySelectorAll('.font-size-sm.mb-2');
    appendLangNodes(houseParas[0], 'GUIDE_HOUSE_P1');
    appendLangNodes(houseParas[1], 'GUIDE_HOUSE_P2');
    appendLangNodes(houseParas[2], 'GUIDE_HOUSE_P3');

    if (extCard) {
        extCard.querySelector('.font-w600').textContent = getRielkLangString('GUIDE_EXTENDED_TITLE');
        const extParas = extCard.querySelectorAll('.font-size-sm.mb-2');
        appendLangNodes(extParas[0], 'GUIDE_EXTENDED_P1');
        appendLangNodes(extParas[1], 'GUIDE_EXTENDED_P2');
    }

    setFloatCardIcon(effCard, ctx.getResourceUrl('assets/efficiency.webp'), '0 12px 0 0');
    setFloatCardIcon(houseCard, masteryBarImageSrc, '0 12px 12px 0');
    if (extCard) setFloatCardIcon(extCard, game.items.getObjectByID('rielkConstruction:Beam_Box_II').media, '0 12px 0 0');

    const guideHeaderLinkEl = document.querySelector('#game-guide-header-link a.pointer-enabled');
    if (guideHeaderLinkEl) {
        const oldClick = guideHeaderLinkEl.onclick;
        guideHeaderLinkEl.onclick = function (event) {
            if (typeof oldClick === 'function') oldClick.call(this, event);
            construction.disableToolTip?.();
        };
    }

    return { root };
}
