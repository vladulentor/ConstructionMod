export function buyBankTabs(){
    if(!game.construction.extSaveData.boughtBankTabs)
    {
        game.bank.addTabs(2);
        game.construction.extSaveData.boughtBankTabs = 1;
    }
}