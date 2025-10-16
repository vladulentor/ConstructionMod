const { loadModule } = mod.getContext(import.meta);

const { ConstructionModifierTiers } = await loadModule('src/construction/constructionModifierTier.mjs');

const ctx = mod.getContext(import.meta);

export class ConstructionTierMastery extends RealmedObject {
    constructor(namespace, data, game, construction) {
        super(namespace, data, game);
        this.tier = data.tier || -1;
        this.name = data.name || 0;
        // Progress tracking
        this.currentProgress = 0;
        this.maxProgress = 100;
        this.completed = false;
        if (data.pets !== undefined)
            this.pets = game.pets.getArrayFromIds(data.pets);
        if (data.itemAwards !== undefined) this.itemAwards = data.itemAwards.map(({ id, quantity }) => ({ item: game.items.getObjectSafe(id), quantity })) || [];
        //this.pets=data.pets;
        this.modifiers = new ConstructionModifierTiers(data, game, `${this.id}`);
    }

    applyDataModification(data, game) {
        super.applyDataModification(data, game);
        if (data.tier !== undefined) this.tier = data.tier;
        if (data.name !== undefined) this.name = data.name;
        if (data.currentProgress !== undefined) this.currentProgress = data.currentProgress;
        if (data.completed !== undefined) this.completed = data.completed;
        if (data.itemAwards !== undefined) this.itemAwards = data.itemAwards.map(({ id, quantity }) => ({ item: game.items.getObjectSafe(id), quantity }));
        if (data.modifiers !== undefined) this.modifiers = data.modifiers;
    }

    // Progression methods
    addProgress(construction) {
        this.currentProgress++;

        if (this.currentProgress >= this.maxProgress) {
            this.currentProgress = this.maxProgress; // just to be sure
            this.onComplete(construction);
        }
    }

    onComplete(construction) {
        if (this.completed) return;
        this.completed = true;

        // Grant item awards
        this.itemAwards.forEach(({ item, quantity }) => {
            game.bank.addItem(item, quantity, false, true, false, true, "TierMastery");
        });
        construction.computeProvidedStats(true);
        if (game.modifiers) {
            construction.queueMasteryBonusModal(this);
            if (this.tier == 5)
                showFireworks();
        }
        if (this.pets)
            this.pets.forEach((pet) => { game.petManager.unlockPet(pet); });
        else ctx.onInterfaceReady((ctx) => {
            construction.queueMasteryBonusModal(this);
        });
        // Trigger UI refresh for the specific case of finishing a fixture with the menu open
    }


    addProvidedStatsTo(statProvider) {
        if (this.completed) { statProvider.addStatObject(this, this.modifiers._stats); }
    }
}