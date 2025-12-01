const { loadModule } = mod.getContext(import.meta);
const { skillBoostsCompatibility } = await loadModule('src/patches/modPatches/skillBoosts.mjs');
const { tinyIconsCompatibility } = await loadModule('src/patches/modPatches/tinyIcons.mjs');
const { skillsoundfxCompatibility } = await loadModule('src/patches/modPatches/skillsoundfx.mjs');




export function patchMods(ctx, modList) {
    const compatMessages = [];
    if (modList.includes('Skill Boosts')) {
        skillBoostsCompatibility(ctx);
        compatMessages.push({
            name: 'Skill Boosts',
            description: "Construction items added to Skill Boosts, and its dropdown header will be under Your House!",
            color: '#f06292' // pinkish
        });
    }

    if (modList.includes('[Refurbished] Tiny Icons')) {
        tinyIconsCompatibility(ctx);
        compatMessages.push({
            name: 'Tiny Icons',
            description: 'All of our new custom bonuses will have nice new Icons.',
            color: '#64b5f6'
        });
    }
    if (modList.includes('"The future is now..." Text remover')) {
        compatMessages.push({
            name: '"The future is..." Remover',
            description: 'You won\'t see that annoying popup on Efficiency either.',
            color: '#f5d522ff'
        });
    }
    /*if (modList.includes('my skillFX')) {
        skillsoundfxCompatibility(ctx);
        compatMessages.push({
            name: '[PSY] Skill Sound FX',
            description: 'Custom sounds added for construction.',
            color: '#76f522ff'
        });
    }*/


    if (compatMessages.length > 0 && (setLang == 'en' || setLang == 'carrot' || setLang == 'lemon')) {
        console.groupCollapsed(
            '%c[Construction Mod]%c Construction reporting in, I like your choice of mods, here\'s the ones I\'ve got custom support for:',
            'color:#fca32f; background:#fca32f20; font-weight:bold;',
            'font-weight:normal;'
        );

        for (const mod of compatMessages) {
            const bg = `${mod.color}20`;
            console.log(
                `%c> ${mod.name}%c — ${mod.description}`,
                `color:${mod.color}; background:${bg}; font-weight:bold;`,
                ` background:${bg}; font-weight:normal;`
            );
        }

        if (!compatMessages.some(m => m.name === 'Tiny Icons')) {
            console.log(
                '%c[Suggestion]%c Try installing Tiny Icons. It makes all modifiers look fantastic.',
                'color:#1976d2; background:#1976d220; font-weight:bold;',
                'background:#1976d220; font-weight:normal;'
            );
        }

        console.log(
            '%c[Construction Mod]%c That’s it from me. Did I mention you’re looking great today?',
            'color:#fca32f; background:#fca32f20; font-weight:bold;',
            'font-weight:normal;'
        );

        console.groupEnd();
    }
}
// 90% of this is just a conosle message I want to send. Because I WANTED TO, god damn it!!!