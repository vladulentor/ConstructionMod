const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs'); //Even though we've patched the MasteryLevelUnlock text with the translationManager already,
//we're adding this too late for any of that to run, apparently, so we do it by hand

const text = game.woodcutting.masteryLevelUnlocks;
const effects = game.woodcutting.masteryLevelBonuses;

const xpBonusText = new MasteryLevelUnlock({ description: getRielkLangString('MASTERY_BONUS_Woodcutting_2'), level: 50 }, game.woodcutting);
const intervBonusText = new MasteryLevelUnlock({ description: getRielkLangString('MASTERY_BONUS_Woodcutting_3'), level: 99 }, game.woodcutting);

const xpData = { modifiers: { "melvorD:skillXP": 0.25 }, autoScopeToAction: false, level: 50 };
const intervData = { modifiers: { "melvorD:skillInterval": -0.1 }, autoScopeToAction: false, level: 99 };

const xpBonusEffect = new MasteryLevelBonus(xpData, game);
const intervBonusEffect = new MasteryLevelBonus(intervData, game);
let Guard3 = 0;
let Guard5 = 0;
export function addBonusesToTreeMastery() {

    if (this.tier >= 2 && Guard3 == 0) {
        text.push(xpBonusText);
        effects.push(xpBonusEffect);
        xpBonusEffect.registerSoftDependencies(xpData, game); // This is so that the modifier resolves, since we are away from the setup when this happens.
        Guard3 = 1;                                           // That function calls a registerModifier fucntion which says it should only be run in setup
        // Oh well
    }
    if (this.tier >= 5 && Guard5 == 0) {
        text.push(intervBonusText);
        effects.push(intervBonusEffect);
        intervBonusEffect.registerSoftDependencies(intervData, game);
        Guard5 = 1;
    }
    text.sort((a, b) => a.level - b.level);
     // Quick way to tell we're out of loading.
        game.woodcutting.computeProvidedStats(game.construction.notifs); // I don't know why, but the interval upgrade needs recomputing of combat stats... if we're NOT in the loading stage, so we do it.
        //recomputing stats at this point, when loading, is inefficient, but it's also basically needed to make this work

}