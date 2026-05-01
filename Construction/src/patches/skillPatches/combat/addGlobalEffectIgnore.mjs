export function addGlobalEffectIgnore({ patch }) {
    patch(Character, "getEffectIgnoreChance").after(function (chance, effect) {
        const gi = this.modifiers.getValue("melvorD:effectIgnoreChance", ModifierQuery.EMPTY);
        if (gi) {
            return Math.min(100, chance + gi);
        }

    });

}