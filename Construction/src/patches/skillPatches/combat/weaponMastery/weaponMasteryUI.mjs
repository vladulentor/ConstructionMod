const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');
const { WeaponMasteryUI } = await loadModule('src/interface/elements/constructionWeaponMastery.mjs');

export function addWeaponMasteryUI(ctx) {
    ctx.onInterfaceReady(async (ctx) => {
        const sidebar = bankSideBarMenu; // or however it’s added
        const menu = sidebar.selectedMenu;

        if (!menu.weaponMasteryUI) {
            menu.weaponMasteryUI = new WeaponMasteryUI();
            menu.equipItemContainer.after(menu.weaponMasteryUI.container);
        }

        const originalSetItem = menu.setItem.bind(menu);
        menu.setItem = (bankItem, bank) => {
            originalSetItem(bankItem, bank);

            if (false /*bankItem.item instanceof WeaponItem && bankItem.item.weaponType*/) {
                menu.weaponMasteryUI.setWeapon(bankItem.item);
                menu.weaponMasteryUI.show();
            } else {
                menu.weaponMasteryUI.hide();
            }
        };
    });
}
