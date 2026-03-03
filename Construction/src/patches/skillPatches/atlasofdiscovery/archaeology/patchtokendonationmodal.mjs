export function patchTokenDonationModal(ctx){
ctx.patch(ArchaeologyMuseum, 'getDonateGenericInfo')
  .replace(function (o) {
    let tokenGain = 0;
    const currencyValue = new SparseNumericMap();
    let itemCount = 0;

    this.forEachGenericArtefactInBank((item, donateQuantity) => {
      tokenGain += donateQuantity;
      itemCount += donateQuantity;
      currencyValue.add(item.sellsFor.currency, item.sellsFor.quantity * donateQuantity);
      if (!this.isItemDonated(item)) {
        tokenGain--;
      }
    });
    const bonus = this.game.modifiers.getValue("rielkConstruction:museumTokenDoubled", ModifierQuery.EMPTY) === 1 ? 2 : 1;
    tokenGain *= bonus;

    return { tokenGain, currencyValue, itemCount };
  });
}