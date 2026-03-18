export function patchWeaponTypeLogic({ patch }) {
    patch(Player, "rewardForDamage").after(function (_, damage) {
        const weap = this.equipment.getItemInSlot("melvorD:Weapon");
        const type = weap.weaponType;

        if (type?.active && !type.masteredWeapons.get(weap.id)) {
            type.checkXP();
            game.bank.renderQueue.mastery = true;
            if (type.perWepMod && weap.masteryMaxed != weap.isMaxMastery)
                type.addweaponmastery(weap);
        }
    });
    patch(Game, "onLoad").after(function (_) {
       this.combat.player.equippedWeaponType = this.combat.player.equipment.getItemInSlot("melvorD:Weapon").weaponType ?? 0;
        for (const m of game.weaponMasteries.allObjects)
            m.onLoad()
    })
    patch(Player, "updateForEquipmentChange").after(function (_) {
        const weap = this.equipment.getItemInSlot("melvorD:Weapon");
        if (this.equippedWeaponType && this.equippedWeaponType !== weap.weaponType) {
            this.equippedWeaponType.unsetActiveWeapon();
        }

        weap.weaponType?.ToggleActiveWeapon(weap);
        this.equippedWeaponType = weap.weaponType;

    });

}