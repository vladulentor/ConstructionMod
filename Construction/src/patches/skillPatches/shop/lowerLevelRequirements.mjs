export function lowerLevelRequirements(){
    if(this.tier) // ==3 or
    {
        const trades = game.township.itemConversions.fromTownship
        for (const tradecat of trades.values()){
            tradecat.forEach(trade => {
                if(!trade.unlockRequirements) return;
                    trade.unlockRequirements.forEach(req => {
                        if(req instanceof SkillLevelRequirement && req.type !== "AbyssalLevel") //if it's a level req
                        req.level = Math.max(req.level-5, 0)
                        if(req instanceof TownshipTaskCompletionRequirement && req.realm._localID !== "Abyssal") // if it's a counting requirement
                        req.count = Math.max(req.count-5, 0)
                    })
            })
        }
    }

}