const itemUpgrades = [
    { item: "melvorF:Mirror_Shield", upgrades: [{ key: 'meleeStrengthBonus', value: 3 }, { key: 'meleeDefenceBonus', value: 15 }, { key: 'rangedDefenceBonus', value: 10 }, { key: 'magicDefenceBonus', value: 20 }] },
    { item: "melvorAoD:Mining_Lantern", upgrades: [{ key: 'rangedAttackBonus', value: 5 }, { key: 'magicAttackBonus', value: 20 }, { key: 'meleeStrengthBonus', value: 15 }, { key: "slashAttackBonus", value: 15 }, { key: "stabAttackBonus", value: 15 }, { key: "blockAttackBonus", value: 15 }] },
    { item: "melvorF:Desert_Hat", upgrades: [{ key: 'rangedAttackBonus', value: 5 }, { key: 'magicAttackBonus', value: 20 }, { key: 'meleeStrengthBonus', value: 15 }, { key: 'meleeDefenceBonus', value: 15 }, { key: "resistance", value: 1 }] },
    { item: "melvorF:Magical_Ring", upgrades: [{ key: 'meleeDefenceBonus', value: 20 }, { key: 'rangedDefenceBonus', value: 20 }, { key: 'magicDefenceBonus', value: 20 }] },
    { item: "melvorF:Blazing_Lantern", upgrades: [{ key: 'rangedStrengthBonus', value: 5 }, { key: 'magicDamageBonus', value: 25 }, { key: 'meleeStrengthBonus', value: 15 }, { key: "magicDamageBonus", value: 3 }] },
    { item: "melvorF:Climbing_Boots", upgrades: [{ key: 'meleeStrengthBonus', value: 18 }, { key: 'meleeDefenceBonus', value: 15 }, { key: "resistance", value: 2 }] },
    { item: "melvorTotH:Slayer_Torch", upgrades: [{ key: 'rangedAttackBonus', value: 10 }, { key: 'magicAttackBonus', value: 10 }, { key: 'meleeStrengthBonus', value: 10 }] },
    { item: "melvorTotH:Mystic_Lantern", upgrades: [{ key: 'rangedAttackBonus', value: 15 }, { key: 'magicAttackBonus', value: 15 }, { key: 'meleeStrengthBonus', value: 15 }] },
    { item: "melvorF:Slayer_Skillcape", upgrades: [{ key: 'meleeDefenceBonus', value: 15 }, { key: 'rangedDefenceBonus', value: 15 }, { key: 'magicDefenceBonus', value: 15 }, { key: "resistance", value: 2 }] },
    { item: "melvorTotH:Superior_Slayer_Skillcape", upgrades: [{ key: 'meleeDefenceBonus', value: 25 }, { key: 'rangedDefenceBonus', value: 25 }, { key: 'magicDefenceBonus', value: 25 }, { key: "resistance", value: 3 }] }


]

export function buffSlayerItems() {
    itemUpgrades.forEach(upgradeset => {
        const item = game.items.getObjectByID(upgradeset.item);
        if (item == undefined) return;
        upgradeset.upgrades.forEach(upgrade => {
                if(upgrade.key == 'resistance')
                {upgrade.damageType = game.damageTypes.getObjectByID("melvorD:Normal") }
            const index = item.equipmentStats.findIndex(stat => stat.key === upgrade.key);
            if (index == -1)
                item.equipmentStats.push(upgrade)
            else
                item.equipmentStats[index].value += upgrade.value

        })
    })
}