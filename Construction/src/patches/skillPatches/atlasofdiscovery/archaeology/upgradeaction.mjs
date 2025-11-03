export function patchUpgradeAction(ctx) {
    ctx.patch(DigSiteMap, 'addUpgradeAction').replace(function (original, ...args) {

        if (this.atMaxTier) {
            return false;
        }

        const oldTier = this.tier;
        const nextTier = DigSiteMap.tiers[oldTier.index + 1];


        if (!nextTier) {
            return false;
        }

        this._upgradeActions++;

        // Check if we should upgrade
        if (this._upgradeActions >= nextTier.upgradeActions) {
            const upgradeCharges = this.getUpgradeCharges();

            this.upgradeTier(nextTier);

        } else {
        }
        return this.tier !== oldTier;
    });
}