export function mergeData(target, source) {
    for (const key of Object.keys(source)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        // plain object -> recurse
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
            if (!targetValue || typeof targetValue !== 'object') target[key] = {};
            mergeData(target[key], sourceValue);
        } 
        // arrays
        else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
            // check if array of objects with 'id'
            if (sourceValue.every(v => v && typeof v === 'object' && 'id' in v)) {
                // merge by id
                for (const item of sourceValue) {
                    const index = targetValue.findIndex(t => t.id === item.id);
                    if (index >= 0) {
                        // recursively merge object
                        mergeData(targetValue[index], item);
                    } else {
                        targetValue.push(item);
                    }
                }
            } else {
                // array of primitives: concatenate
                target[key] = [...targetValue, ...sourceValue];
            }
        } 
        // primitives or mismatched types -> overwrite
        else {
            target[key] = sourceValue;
        }
    }
    return target;
}