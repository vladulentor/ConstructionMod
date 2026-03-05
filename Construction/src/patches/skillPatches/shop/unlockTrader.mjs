export function unlockTrader(ctx) {
    ctx.patch(TownshipUI, "updateTraderStatus").replace(function (_) {
        const tradingPost = this.township.buildings.getObjectByID("melvorF:Trading_Post" /* TownshipBuildingIDs.Trading_Post */);
        if ((tradingPost !== undefined && this.township.countNumberOfBuildings(tradingPost) <= 0) && !game?.modifiers?.getValue("rielkConstruction:UnlockTrader", ModifierQuery.EMPTY)) {
            showElement(this.defaultElements.trader.noTradingPost);
            this.defaultElements.trader.trader.classList.remove('text-success');
            this.defaultElements.trader.trader.classList.add('text-danger');
        }
        else {
            this.defaultElements.trader.trader.classList.add('text-success');
            this.defaultElements.trader.trader.classList.remove('text-danger');
            hideElement(this.defaultElements.trader.noTradingPost);
        }

    });
    ctx.patch(TownshipUI, 'loadTownshipUI').after(function (_) {
        ctx.onCharacterLoaded(async (ctx) => {
            this.updateTraderStatus()
        })
    });
    ctx.patch(TownshipUI, "showPage").replace(function (_, pageID) {
        if (pageID === 1 /* TownshipPage.Trader */) {
            const tradingPost = this.township.buildings.getObjectByID("melvorF:Trading_Post" /* TownshipBuildingIDs.Trading_Post */);
            if ((tradingPost === undefined || this.township.countNumberOfBuildings(tradingPost) <= 0) && !game?.modifiers?.getValue("rielkConstruction:UnlockTrader", ModifierQuery.EMPTY))
                return;
        }
        this.updatePageHighlight(this.currentPage, pageID);
        this.currentPage = pageID;
        this.defaultElements.div.town.classList.add('d-none');
        this.defaultElements.div.trader.classList.add('d-none');
        this.defaultElements.div.tasks.classList.add('d-none');
        this.defaultElements.div.manageStorage.classList.add('d-none');
        switch (pageID) {
            case 0 /* TownshipPage.Town */:
                this.defaultElements.div.town.classList.remove('d-none');
                this.township.renderQueue.townSummary = true;
                break;
            case 1 /* TownshipPage.Trader */:
                this.township.updateConvertType(this.township.convertType);
                this.defaultElements.div.trader.classList.remove('d-none');
                break;
            case 2 /* TownshipPage.Tasks */:
                this.defaultElements.div.tasks.classList.remove('d-none');
                break;
            case 3 /* TownshipPage.ManageStorage */:
                this.updateConvertVisibility();
                this.defaultElements.div.manageStorage.classList.remove('d-none');
                break;
        }
    });
}

export function refreshTrader() {
    townshipUI.updateTraderStatus();
}