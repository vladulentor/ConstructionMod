function getBankMult() {
    const cap = game.modifiers.getValue("rielkConstruction:expandBankSlotCap2", ModifierQuery.EMPTY) ? 10000 : game.modifiers.getValue("rielkConstruction:expandBankSlotCap1", ModifierQuery.EMPTY) ? 20 : 5;
    const bonAm = Math.min(cap, game.bank.items.size / 50 | 0) // funny bitwise operation because apparently javascript has no division without rest wtf
    return bonAm
}

export function addPerBankSlotsBoosts({ patch }) {
    patch(Skill, "getDoublingChance").after(function (org, action) {
        if (!game.currentGamemode.disableDoubling) {
            const ext = game.modifiers.getValue("rielkConstruction:doublingankslots", ModifierQuery.EMPTY);
            if (ext) {
                return org + ext * getBankMult();
            }

        }
    });
    patch(Skill, "_buildDoublingSources").after(function (builder, action) {
        if (!game.currentGamemode.disableDoubling) {
            builder.addSources("rielkConstruction:doublingankslots", {}, getBankMult());

        }

    })
    patch(Skill, "getCurrencyModifier").after(function (org, currency, action) {
        const ext = game.modifiers.getValue("rielkConstruction:globalCurrencyBanksSlots", this.getCurrencyModifierQuery(currency, action));
        if (ext)
            return org + ext * getBankMult();
    })
    patch(CombatManager, "getCurrencyModifier").after(function (org, currency) { // boy am I glad the game caches these checks, idk why it's queried in a different way in combat
        const ext = game.modifiers.getValue("rielkConstruction:globalCurrencyBanksSlots", currency.modQuery);
        if (ext)
            return org + ext * getBankMult();
    });
    patch(PetManager, "rollForSkillPet").after(function(_, pet, actionInterval, forceSkill){
        if(this.hasRolled){
            this.hasRolled = 0;
            return;}
        const ext = game.modifiers.getValue("rielkConstruction:skillPetChanceBankSlots", ModifierQuery.EMPTY);
        if(ext && rollPercentage(ext * getBankMult))
        {this.hasRolled = 1; // though we shouldn't need this, ever.... ah well.
            this.rollForSkillPet(pet,actionInterval,forceSkill);
        }
        
    })
    /* Doesn't fit the chest, sadly
    patch(Skill, 'getXPModifier').after(function (org, action) {
        const ext = game.modifiers.getValue("rielkConstruction:xpperbankslots", ModifierQuery.EMPTY);
        if (ext)
            return org + ext * getBankMult();

    });*/
}