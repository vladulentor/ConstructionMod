export function unlockPlot() {
    const tierlvl = this.tier; //just take the tier from ID since recipes don't hold their own tier
    const plotMap = {
        "1": "rielkConstruction:AllotmentPlotRielk1",
        "2": "rielkConstruction:HerbPlotRielk1",
        "3": "rielkConstruction:AllotmentPlotRielk2",
        "4": "rielkConstruction:HerbPlotRielk2",
        "5": "rielkConstruction:TreePlotRielk1"
    }
    const plotID = game.farming.plots.getObjectSafe(plotMap[tierlvl]);
    if (plotID.state == 0) {
        plotID.state = 1;
    }
    game.farming.showPlotsInCategory(plotID.category);
}
