const skills = [
  game.skills.Woodcutting,
  game.skills.Fishing,
  game.skills.Mining,
];

const capIncrease = {
  levelType: 'Standard',

  fixedIncreases: skills.map(skill => ({
    skill,
    increase: 5,
    maxCap: skill.maxLevelCap,
  })),

  setIncreases: [],
  randomIncreases: [],
  randomCount: 0,
  randomSelection: new Set(),
  randomIncreasesLeft: 0,
};

export function addNonCombatSkillCap({patch}){


    
}