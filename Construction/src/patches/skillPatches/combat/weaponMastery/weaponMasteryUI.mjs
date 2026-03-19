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

            if (bankItem.item instanceof WeaponItem && bankItem.item.weaponType && bankItem.item.weaponType.active) {
                menu.weaponMasteryUI.setWeapon(bankItem.item);
                menu.weaponMasteryUI.show();
            } else {
                menu.weaponMasteryUI.hide();
            }
        };
    });
    ctx.patch(Bank, 'render').after(function (_) {
        if (this.renderQueue.mastery) {
            const masteryMenu = bankSideBarMenu.selectedMenu.weaponMasteryUI;
            if (masteryMenu && !masteryMenu.container.classList.contains("d-none") && masteryMenu.type === game.combat.player.equippedWeaponType)
                bankSideBarMenu.selectedMenu.weaponMasteryUI.render();
            this.renderQueue.mastery = false;
        }
    })
}
