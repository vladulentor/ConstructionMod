const { loadModule } = mod.getContext(import.meta);
const { isUsedInConstruction } = await loadModule('src/skillPatches/atlasofdiscovery/archaeology/usedinvault.mjs');
export function patchGenericArtefact(ctx){
ctx.patch(Item, 'modifiedDescription').replace(function () {
        if (this._modifiedDescription !== undefined)
            return this._modifiedDescription;
        let desc = applyDescriptionModifications(this.description);
        if (this.isArtefact) {
            desc += desc.length > 0 ? '<br>' : '';
            desc += `${this.artefactSizeAndLocation}`;
        }
        if (this.isGenericArtefact && setLang == 'en') {
            desc += desc.length > 0 ? '<br>' : '';
            desc += `This is a Generic Artefact.`;
            if (isUsedInConstruction(this))
              desc += '<br>But it could be added to your vault.'
              
        }
        this._modifiedDescription = desc;
        return this._modifiedDescription;
    });
}
