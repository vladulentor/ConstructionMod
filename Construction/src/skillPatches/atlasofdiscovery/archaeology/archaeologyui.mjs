export function patchArchUI(ctx){
 ctx.patch(DigSiteMapSelectElement, 'generateMapSelect').replace(function(originalMethod, digSite, archaeology) {
    const maxPossibleMaps = 6; // increased from 5 to 6
    while (this.mapElements.length < maxPossibleMaps) {
        const img = createElement('img', { className: 'skill-icon-sm my-0 mx-2 p-1' });
        this.mapContainer.append(img);
        const tooltip = tippy(img, {
            content: this.getTooltipContent(digSite, this.mapElements.length),
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
        });
        this.mapElements.push({ img, tooltip });
    }
});
}