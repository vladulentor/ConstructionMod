   export function patchUpgradeArtefactValue(ctx)
   {
    // This is to make the 4th map tier more balanced, otherwise it'll most likely produce 1,1,1,1 artefact value, making refinements useless
    //The last upgrade only gives half the improvement in artefact value.
    // Since getUpgradeArtefactValue rolls from 13 to 23, in the worst case this will still subtract 1 from a value, no extra guards needed
   
   ctx.patch(DigSiteMap, 'upgradeArtefactValue').after(function (oldValue) { 
        if(this.tier.index===4)
        oldValue += Math.floor(this.getUpgradeArtefactValue() / 2);
        return oldValue; 
   });
}