const { loadModule, loadTemplates, loadStylesheet } = mod.getContext(import.meta);
await loadModule('src/construction/deepmerge.mjs');


export function mergeConstructionData(baseData, TotHData)
{    return deepmerge(baseData, TotHData, {
    arrayMerge: (target, source, options) => {
        // Check if array contains objects with 'id' or 'skillID'
        if (source.length && typeof source[0] === 'object' && (source[0].id || source[0].skillID)) {
            const destination = [...target];

            source.forEach(item => {
                const key = item.id ?? item.skillID; // use id first, then skillID
                const index = destination.findIndex(t => (t.id ?? t.skillID) === key);

                if (index >= 0) {
                    // Recursively merge objects with the same key
                    destination[index] = deepmerge(destination[index], item, { arrayMerge: options.arrayMerge });
                } else {
                    destination.push(item);
                }
            });

            return destination;
        }

        // Fallback to original behavior for other arrays
        const destination = target.slice();
        source.forEach((item, index) => {
            if (typeof destination[index] === 'undefined') {
                destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
            } else if (options.isMergeableObject(item)) {
                destination[index] = deepmerge(target[index], item, options);
            } else if (target.indexOf(item) === -1) {
                destination.push(item);
            }
        });
        return destination;
    }
});
}