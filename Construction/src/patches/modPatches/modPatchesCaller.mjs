const { loadModule } = mod.getContext(import.meta);
const { skillBoostsCompatibility } = await loadModule('src/patches/modPatches/skillBoosts.mjs');
const { tinyIconsCompatibility } = await loadModule('src/patches/modPatches/tinyIcons.mjs');
const { skillsoundfxCompatibility } = await loadModule('src/patches/modPatches/skillsoundfx.mjs');
const { showItemSourcesAndUsesCompatibility } = await loadModule('src/patches/modPatches/showItemSourcesAndUses.mjs');



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

       if (modList.includes('Mastery Pool Can Overflow')) {
        compatMessages.push({
            name: 'Mastery Pool Can Overflow',
            description: 'Made so that Mastery Pool overflowing still works with our Mastery Pool increases and decreases.',
            color: '#e5ae67'
        });
    }
    // After trying it for a bit, I've discovered that this man's mod is insane, the only way to add compat is to make a pull request :(
    /* if (modList.includes('Show Item Sources And Uses')) {
         showItemSourcesAndUsesCompatibility(ctx);
         compatMessages.push({
             name: 'Show Item Sources And Uses',
             description: 'All of our new custom bonuses will have nice new Icons.',
             color: '#5a0253'
         });
     }*/
    if (modList.includes('[PSY] Skill Sound FX')) {
        skillsoundfxCompatibility(ctx);
        compatMessages.push({
            name: '[PSY] Skill Sound FX',
            description: 'Construction will have custom sounds now.',
            color: '#76f522'
        });
    }
    if (modList.includes('Ancient Relics Doubling and Preservation Enabled')) {
        compatMessages.push({
            name: 'Ancient Relics Doubling and Preservation Enabled',
            description: 'Efficiency will also work in Ancient Relics',
            color: '#f58822'
        });
    }

    if (modList.includes('Ancient Relic Mode 1.3')) {
        compatMessages.push({
            name: 'Ancient Relic Mode 1.3',
            description: 'The mod won\'t destroy your save with Ancient Relics even on gamemodes that don\'t have rolling caps',
            color: '#949684'
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
        endingMessages.push('You\'d be amazed at the things this mod gets pushed back for.');
        endingMessages.push('Thank you again for downloading me.');
        endingMessages.push('Did you know mods feel pain when you delete them?');
        endingMessages.push('Don\'t forget to brush your teeth.');
        endingMessages.push('Did you know the orange color we use is called "Construction-Victory"?');
        endingMessages.push("Sawdust is actually perfectly safe to inhanle. OSHA is lying to you.");
        endingMessages.push("The potion this mod adds is choccy milk.");
        endingMessages.push("People that only exist in my head keep asking me why the 'Jar of Tar' helps in Thieving and Agility, and why you get it from Fishing. First of all, Tar was used in Shipwrighting to keep rope still. Second of all, tar is sticky, you use it to grip better.");
        endingMessages.push("Measuring twice is twice the fun!");

        console.log(
            `%c[Ending Message]%c ${endingMessages[Math.floor(Math.random() * endingMessages.length)]}`,
            'color:#fca32f; background:#fca32f20; font-weight:bold;',
            'font-weight:normal;'
        );

        console.groupEnd();
    }
}
// 90% of this is just a conosle message I want to send. Because I WANTED TO, god damn it!!!