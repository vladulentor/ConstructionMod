// I had a list made but I only need to do this like 2,3 times so fuck it, by hand
export function reorderAgiMods(){
const modifiers = game.agility.pillars.getObjectSafe("melvorF:PillarofSkilling").modifiers;
const pid1 = modifiers.findIndex(mod => mod.modifier._localID == "skillEfficiencyChance");
const pid2 = modifiers.findIndex(mod => mod.modifier._localID == "masteryXP");
[modifiers[pid1], modifiers[pid2]] = [modifiers[pid2], modifiers[pid1]];

const modifiers2 = game.agility.actions.getObjectSafe("melvorF:BurningCoals").modifiers;
const cid = modifiers2.findIndex(mod => mod.modifier._localID == "damageDealtToAllMonsters");
const [temp] = modifiers2.splice(cid, 1);
modifiers2.push(temp);

const modifiers3 = game.agility.actions.getObjectSafe("melvorF:SwelteringPools").modifiers;
const sid1 = modifiers3.findIndex(mod => mod.modifier._localID == "skillPreservationChance");
const sid2 = modifiers3.findIndex(mod => mod.modifier._localID == "constructionActionsToUpgrade");
[modifiers3[sid1], modifiers3[sid2]] = [modifiers3[sid2], modifiers3[sid1]];
}