let guard2 = false;
let guard5 = false;
export function addBonusToPool() {
  const miningbon = game.mining.masteryPoolBonuses
  if (this.tier >= 2 && !guard2) {
    const miningbon1 = miningbon.get(game.realms.getObjectByID("melvorD:Melvor")).find(mas => mas.percent === 10);
    const miningbon2 = miningbon.get(game.realms.getObjectByID("melvorD:Melvor")).find(mas => mas.percent === 25);
    const ourmod1 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:skillXP'), 5, { skill: game.smithing })
    const ourmod2 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:skillPreservationChance'), 5, { skill: game.smithing })

    miningbon1.modifiers.push(ourmod1)
    miningbon2.modifiers.push(ourmod2)
    guard2 = true
  }
  if (this.tier >= 5 && !guard5) {
    const miningbon3 = miningbon.get(game.realms.getObjectByID("melvorD:Melvor")).find(mas => mas.percent === 50);
    const miningbon4 = miningbon.get(game.realms.getObjectByID("melvorD:Melvor")).find(mas => mas.percent === 95);
    const ourmod3 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:flatSkillInterval'), -200, { skill: game.smithing })
    const ourmod4 = new ModifierValue(game.modifierRegistry.getObjectByID('melvorD:masteryXP'), 5, { skill: game.smithing })

    miningbon3.modifiers.push(ourmod3)
    miningbon4.modifiers.push(ourmod4)
    guard5 = true
  }
    game.mining.computeProvidedStats(game.construction.notifs); 
}
