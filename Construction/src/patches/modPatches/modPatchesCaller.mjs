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
            description: "Construction items added to Skill Boosts, and now Furniture is added to Skill boosts as well.",
            color: '#f06292'
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
            color: '#f5d522'
        });
    }
    if (modList.includes('[PSY] Skill Sound FX')) {
        skillsoundfxCompatibility(ctx);
        compatMessages.push({
            name: '[PSY] Skill Sound FX',
            description: 'Construction will have custom sounds now.',
            color: '#76f522'
        });
    }


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
        const endingMessages = [];
        if (!compatMessages.some(m => m.name === 'Tiny Icons')) {
            endingMessages.push('Try installing Tiny Icons. And tell Kuma I sent ya.')
        }
        
        endingMessages.push('Did I mention you\'re looking great today?');
                endingMessages.push('That\'s all from me, toodles.');
        endingMessages.push('Thank you again for downloading me.');
        endingMessages.push('Did you know mods feel pain when you delete them?');
        endingMessages.push('Don\'t forget to brush your teeth.');
        endingMessages.push('Did you know the orange color we use is called "Construction-Victory"?');
        endingMessages.push("Sawdust is actually perfectly safe to inhanle. OSHA is lying to you.");
        endingMessages.push("Measuring twice is twice the fun!");

        console.log(
            `%c[Enging Message]%c ${endingMessages[Math.floor(Math.random() * endingMessages.length)]}`,
            'color:#fca32f; background:#fca32f20; font-weight:bold;',
            'font-weight:normal;'
        );

        console.groupEnd();
    }
}
// 90% of this is just a conosle message I want to send. Because I WANTED TO, god damn it!!!