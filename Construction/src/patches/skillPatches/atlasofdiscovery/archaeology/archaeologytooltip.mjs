const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function patchArchTooltip(ctx)

{ctx.patch(DigSiteMapSelectElement, 'getLockedMapSlotTooltipContent').after(function(returnValue) {
    return returnValue + `<div class="font-w600 text-center">Or building up your Vault</div>`;
});}