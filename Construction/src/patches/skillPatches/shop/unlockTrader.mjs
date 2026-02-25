export function unlockTrader({ patch }) {
    patch(Township, "updateTraderStatus").replace(function (_) {
        const tradingPost = this.township.buildings.getObjectByID("melvorF:Trading_Post" /* TownshipBuildingIDs.Trading_Post */);
        if ((tradingPost !== undefined && this.township.countNumberOfBuildings(tradingPost) <= 0) || this.game.modifiers.getValue("rielkConstruction:UnlockTrader", ModifierQuery.EMPTY)) {
            showElement(this.defaultElements.trader.noTradingPost);
            this.defaultElements.trader.trader.classList.remove('text-success');
            this.defaultElements.trader.trader.classList.add('text-danger');
        }
        else {
            this.defaultElements.trader.trader.classList.add('text-success');
            this.defaultElements.trader.trader.classList.remove('text-danger');
            hideElement(this.defaultElements.trader.noTradingPost);
        }

    })

}