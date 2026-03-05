const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');


class FixtureGoal extends TownshipTaskGoal {
    constructor(data, game) {
        super(game);
        this.isReversible = false;
        try {
            this.fixture = this.game.construction.fixtures.getObjectSafe(data.fixtureID);
            this.tier = data.tier;
        }
        catch (e) {
            console.error('[FixtureRequirement] Constructor failed:', e);
            throw new DataConstructionError(FixtureCompletionRequirement.name, e);
        }
    }
    checkIfMet() {
        return this.fixture.currentTier >= this.tier;
    }
    getDescriptionHTML() {
        const progress = Math.min(this.fixture.currentTier, this.tier)
        return templateRielkLangString('TOWNSHIP_TASKS_REQ', {
            qty1: progress,
            qty2: this.tier,
            fixImg: `<img class="skill-icon-xs mr-1" src="${this.fixture.media}">`,
            fixName: this.fixture.name,
        });
    }
    _metWithEvent(e) {
        return this.checkIfMet();
    }
    _assignHandler(handler) {
        this.fixture.on('tierChanged', (...args) => {
            handler(...args);
        });
    }

    _unassignHandler(handler) {
        this.fixture.off('tierChanged', handler);
    }
}

export function addFixtureGoalType(){ //this is cursed
console.log("[FixtureGoal Patch] Installing proxy");

const OriginalTownshipTaskGoals = TownshipTaskGoals;

TownshipTaskGoals = new Proxy(OriginalTownshipTaskGoals, {
  construct(target, args, newTarget) {
    const instance = Reflect.construct(target, args, newTarget);
    const [data, game] = args;
    if (data.fixture) {
      data.fixture.forEach((goalData, index) => {
        const goal = new FixtureGoal(goalData, game);
        instance.allGoals.push(goal);
      });
    }
    return instance;
  }
});
}