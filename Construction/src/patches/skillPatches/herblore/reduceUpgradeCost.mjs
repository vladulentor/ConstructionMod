 
export function reduceUpgradeCost(){
        for(const [key, value] of game.bank.itemUpgrades){
            if(key instanceof PotionItem)
            {value[0].itemCosts[0].quantity -= 1}
        }
}