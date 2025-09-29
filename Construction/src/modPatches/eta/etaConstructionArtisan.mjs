// code taken from ETASkill under GNU license
// so I can extend their mod since they provide the ETA object but no way to make a calculator
// So I added it all in a gigantic file to make my own


export class ActionCounterWrapper {
  constructor() {
    this.active = this.empty
    this.skill = this.empty
    this.nextSkill = this.empty
    this.nextMilestone = this.empty
    this.mastery = this.empty
    this.pool = this.empty
    this.count = this.empty
  }

  get empty() {
    return ActionCounter.emptyCounter
  }

  reset() {
    this.active = this.empty
    this.skill = this.empty
    this.nextSkill = this.empty
    this.nextMilestone = this.empty
    this.mastery = this.empty
    this.pool = this.empty
    this.count = this.empty
  }
}

export class ActionCounter {
  constructor(ms, actions, unit) {
    this.ms = ms
    this.actions = actions
    this.unit = unit
  }

  static get emptyCounter() {
    return new ActionCounter(0, 0, 1)
  }

  clone() {
    return new ActionCounter(this.ms, this.actions, this.unit)
  }
}


export class Rates {
  constructor(xp, successRate, ms, unit) {
    this.xp = xp
    this.successRate = successRate
    this.ms = ms
    this.unit = unit
  }

  static get emptyRates() {
    return new Rates(0, 1, 0, 1)
  }

  static get hourUnit() {
    return 3600 * 1000
  }

  get hourlyRates() {
    return this.scaledRates(Rates.hourUnit)
  }

  scaledRates(unit) {
    const factor = unit / this.unit
    return new Rates(this.xp * factor, this.successRate, this.ms, unit)
  }
}

export class EtaCosts {
  constructor() {
    this._items = new Map()
    this._currencies = new Map()
  }

  clearItem(item) {
    this._items.delete(item)
  }

  setItem(item, quantity) {
    this._items.set(item, quantity)
  }

  addItem(item, quantity) {
    var _a
    this._items.set(
      item,
      quantity +
        ((_a = this._items.get(item)) !== null && _a !== void 0 ? _a : 0)
    )
  }

  addCurrency(currency, quantity) {
    var _a
    this._currencies.set(
      currency,
      quantity +
        ((_a = this._currencies.get(currency)) !== null && _a !== void 0
          ? _a
          : 0)
    )
  }

  /**
   * Gets an ItemQuantity array to interface with UI classes
   */
  getItemQuantityArray() {
    const costArray = []
    this._items.forEach((quantity, item) => costArray.push({ item, quantity }))
    return costArray
  }

  /** Gets a CurrencyQuantity array to interface with UI classes */
  getCurrencyQuantityArray() {
    const currencies = []
    this._currencies.forEach((quantity, currency) =>
      currencies.push({ currency, quantity })
    )
    return currencies
  }

  /** Adds another costs object's costs to this one */
  addCosts(costs) {
    costs._items.forEach((quantity, item) => {
      this.addItem(item, quantity)
    })
    costs._currencies.forEach((quantity, currency) => {
      this.addCurrency(currency, quantity)
    })
  }
}

export class EtaSkill {
  constructor(...[game, skill, action, settings]) {
    this.skill = skill
    this.action = action
    this.modifiers = game.modifiers
    this.settings = settings
    this.initial = Rates.emptyRates
    this.skill.baseInterval = skill.baseInterval ?? 0
    this.actionsTaken = new ActionCounterWrapper()
    this.skillXp = 0
    this.nextMilestone = 0
    this.milestoneMedia = []
    this.currentRatesSet = false
    this.attemptsPerHour = 0
    this.currentRates = Rates.emptyRates
    this.infiniteActions = false
    // @ts-ignore
    this.TICK_INTERVAL = TICK_INTERVAL
    // flag to check if target was already reached
    this.nextSkillReached = false
    this.nextMilestoneReached = false
    this.skillReached = false
    this.isComputing = false
  }

  get levelReqReached() {
    return (
      this.action.level <= this.skill.level &&
      this.action.abyssalLevel <= this.skill.abyssalLevel
    )
  }

  get actionLevel() {
    const realmID = this.actionRealmID
    if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
      return this.action.level
    } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
      return this.action.abyssalLevel
    }
    return 0
  }

  get skillLevel() {
    return this.xpToLevel(this.skillXp)
  }

  get initialVirtualLevel() {
    return this.xpToLevel(this.initial.xp)
  }

  get melvorSkillLevel() {
    if (this.actionRealmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
      // compute the currently simulated skill level when we are in Melvor
      return Math.min(this.skillLevel, this.skill.currentLevelCap)
    }
    // return the current skill level in case we are in another realm
    return this.skill.level
  }

  /***
   * Interval methods
   */

  get actionInterval() {
    return this.modifyInterval(this.skill.baseInterval)
  }

  // for skills without respawns or failures this is a duplicate of actionInterval
  get averageAttemptTime() {
    return this.actionInterval
  }

  get successRate() {
    return 1
  }

  get skillCompleted() {
    return (
      !this.skillReached && this.skillLevel >= this.targets.skillLevelTarget
    )
  }

  get nextSkillCompleted() {
    return (
      !this.nextSkillReached && this.skillLevel >= this.initialVirtualLevel + 1
    )
  }

  get nextMilestoneCompleted() {
    return !this.nextMilestoneReached && this.skillLevel >= this.nextMilestone
  }

  get activeRealmID() {
    // @ts-ignore
    return this.activeRealm().id
  }

  get actionRealmID() {
    // @ts-ignore
    return this.actionRealm().id
  }

  get actionIsInActiveRealm() {
    return this.actionRealmID === this.activeRealmID
  }

  setNextMilestone() {
    const realmID = this.actionRealmID
    let milestones = []
    let milestoneLevels = []
    if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
      milestones = this.skill.milestones
      milestoneLevels = milestones.map(x => x.level)
    } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
      milestones = this.skill.abyssalMilestones
      milestoneLevels = milestones.map(x => x.abyssalLevel)
    }
    this.nextMilestone =
      milestoneLevels.find(milestone => milestone > this.skillLevel) ?? Infinity
    if (this.nextMilestone === Infinity) {
      this.nextMilestoneReached = true
      return
    }
    this.milestoneMedia = []
    milestones.forEach((milestone, idx) => {
      if (milestoneLevels[idx] === this.nextMilestone) {
        this.milestoneMedia.push(milestones[idx].media)
      }
    })
  }

  activeRealm() {
    return this.skill.currentRealm
  }

  actionRealm() {
    return this.action.realm
  }

  skip() {
    return !this.actionIsInActiveRealm
  }

  /***
   * Get and set rates
   */

  gainsPerAction() {
    return new Rates(
      this.actionXP(this.actionRealmID),
      this.successRate,
      this.averageAttemptTime,
      // unit
      1
    )
  }

  actionXP(realmID) {
    if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
      return this.modifyMelvorXP(this.action.baseExperience)
    } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
      return this.modifyAbyssalXP(this.action.baseAbyssalExperience)
    }
    return 0
  }

  completed() {
    return this.infiniteActions || this.targets.completed()
  }

  getTargets() {
    return new Targets(this, this.settings)
  }

  init(game) {
    const realmID = this.actionRealmID
    this.isComputing = true
    // get initial values
    // actions performed
    this.actionsTaken.reset()
    // current xp
    this.skillXp = 0
    if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
      this.skillXp = this.skill.xp
    } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
      this.skillXp = this.skill.abyssalXP
    }
    // initial
    this.initial = new Rates(
      this.skillXp,
      this.successRate, // ms
      0, // unit
      1
    )
    // current rates have not yet been computed
    this.currentRatesSet = false
    this.infiniteActions = false
    // flag to check if target was already reached
    this.nextSkillReached = !this.settings.get("SHOW_LEVEL_NEXT")
    this.nextMilestoneReached = !this.settings.get("SHOW_LEVEL_MILESTONE")
    this.skillReached = !this.settings.get("SHOW_LEVEL_TARGET")
    // compute the targets
    this.setNextMilestone()
  }

  setFinalValues() {
    // check targets
    if (this.nextSkillCompleted) {
      this.actionsTaken.nextSkill = this.actionsTaken.active.clone()
      this.nextSkillReached = true
    }
    if (this.nextMilestoneCompleted) {
      this.actionsTaken.nextMilestone = this.actionsTaken.active.clone()
      this.nextMilestoneReached = true
    }
    if (this.skillCompleted) {
      this.actionsTaken.skill = this.actionsTaken.active.clone()
      this.skillReached = true
    }
  }

  iterate(game) {
    this.init(game)
    this.targets = this.getTargets()
    this.iterateInner()
    this.setCurrentRates(this.gainsPerAction())
  }

  iterateInner() {
    // limit to 1000 iterations, in case something goes wrong
    const maxIt = 1000
    let it = 0
    this.setFinalValues()
    while (!this.completed()) {
      this.progress()
      it++
      if (it >= maxIt) {
        console.error(
          `ETA skill ${this.skill.id} ran out of iterations for action ${this.action.id} !`
        )
        break
      }
    }
  }

  xpToNextLevel(level, xp) {
    let nextXp = this.levelToXp(level + 1)
    while (nextXp <= xp) {
      level++
      nextXp = this.levelToXp(level + 1)
    }
    return nextXp - xp
  }

  masteryXpToNextLevel(level, xp) {
    let nextXp = this.masteryLevelToXp(level + 1)
    while (nextXp <= xp) {
      level++
      nextXp = this.masteryLevelToXp(level + 1)
    }
    return nextXp - xp
  }

  progress() {
    const gainsPerAction = this.gainsPerAction()
    let attempts = this.attemptsToCheckpoint(gainsPerAction)
    if (attempts === Infinity) {
      this.infiniteActions = true
      return
    }
    if (attempts < 1) {
      console.warn(
        "ETA: attempts to checkpoint is lower than 1:",
        attempts,
        this
      )
      attempts = 1
    }
    this.addAttempts(gainsPerAction, attempts)
    this.setFinalValues()
  }

  attemptsToCheckpoint(gainsPerAction) {
    // if current rates is not set, then we are in the first iteration, and we can set it
    this.setCurrentRates(gainsPerAction)
    const requiredForXPCheckPoint = this.xpToNextLevel(
      this.skillLevel,
      this.skillXp
    )
    const attemptsToXPCheckpoint =
      requiredForXPCheckPoint / gainsPerAction.xp / gainsPerAction.successRate
    return Math.ceil(attemptsToXPCheckpoint)
  }

  addAttempts(gainsPerAction, attempts) {
    this.skillXp += gainsPerAction.xp * attempts * gainsPerAction.successRate
    this.actionsTaken.active.actions += attempts
    this.actionsTaken.active.ms += attempts * gainsPerAction.ms
  }

  setCurrentRates(gains) {
    if (!this.currentRatesSet) {
      this.setCurrentRatesNoCheck(gains)
    }
    this.currentRatesSet = true
  }

  setCurrentRatesNoCheck(gains) {
    // ms per hour divided by ms per attempt
    this.attemptsPerHour = (3600 * 1000) / this.averageAttemptTime
    return (this.currentRates = new Rates(
      (gains.xp / gains.ms) * gains.successRate,
      gains.successRate,
      gains.ms,
      // unit
      1
    ))
  }

  /***
   * XP methods
   */

  xpToLevel(xp) {
    const realmID = this.actionRealmID
    if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
      // @ts-ignore 2304
      return exp.xpToLevel(xp)
    } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
      // @ts-ignore 2304
      return abyssalExp.xpToLevel(xp)
    }
    return 1
  }

  levelToXp(level) {
    const realmID = this.actionRealmID
    if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
      // @ts-ignore 2304
      return exp.levelToXP(level)
    } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
      // @ts-ignore 2304
      return abyssalExp.levelToXP(level)
    }
    return 1
  }

  masteryXpToLevel(xp) {
    // @ts-ignore 2304
    return exp.xpToLevel(xp)
  }

  masteryLevelToXp(level) {
    // @ts-ignore 2304
    return exp.levelToXP(level) + 0.00001
  }

  modifyMelvorXP(amount) {
    amount *= 1 + this.getMelvorXPModifier() / 100
    if (this.modifiers.halveSkillXP > 0) {
      amount /= 2
    }
    return amount
  }

  modifyAbyssalXP(amount) {
    amount *= 1 + this.getAbyssalXPModifier() / 100
    return amount
  }

  getMelvorXPModifier() {
    let modifier = this.modifiers.getValue(
      "melvorD:skillXP" /* ModifierIDs.skillXP */,
      this.getActionModifierQuery()
    )
    modifier += this.modifiers.nonCombatSkillXP
    return modifier
  }

  getAbyssalXPModifier() {
    let modifier = this.modifiers.getValue(
      "melvorD:abyssalSkillXP" /* ModifierIDs.abyssalSkillXP */,
      this.getActionModifierQuery()
    )
    if (this.skill.isCombat) {
      modifier += this.modifiers.abyssalCombatSkillXP
    }
    return modifier
  }

  modifyInterval(interval) {
    const flatModifier = this.getFlatIntervalModifier()
    const percentModifier = this.getPercentageIntervalModifier()
    interval *= 1 + percentModifier / 100
    interval += flatModifier
    if (this.modifiers.halveSkillInterval > 0) {
      interval /= 2
    }
    // @ts-ignore
    interval = roundToTickInterval(interval)
    return Math.max(interval, this.settings.get("minimalActionTime"))
  }

  getFlatIntervalModifier() {
    return this.modifiers.getValue(
      "melvorD:flatSkillInterval" /* ModifierIDs.flatSkillInterval */,
      this.getActionModifierQuery()
    )
  }

  getPercentageIntervalModifier() {
    return this.modifiers.getValue(
      "melvorD:skillInterval" /* ModifierIDs.skillInterval */,
      this.getActionModifierQuery()
    )
  }

  getXpMap() {
    const levels = new Map()
    levels.set("skillXp", this.skillXp)
    return levels
  }

  getActionModifierQuery() {
    return this.skill.getActionModifierQuery(this.action)
  }
}


export class Targets {
  constructor(current, settings) {
    this.current = current
    if (current.action === undefined) {
      this.skillLevel = 0
      this.skillXp = 0
      this.skillLevelTarget = 0
      this.hideSkillTarget = false
      return this
    }
    // target level
    const currentLevel = current.initialVirtualLevel
    let targets = []

    if (this.current.settings.get("SHOW_LEVEL_NEXT")) {
      targets.push(currentLevel + 1)
    }
    if (
      this.current.settings.get("SHOW_LEVEL_MILESTONE") &&
      current.nextMilestone !== Infinity
    ) {
      targets.push(current.nextMilestone)
    }
    this.skillLevelTarget = settings.getTargetLevel(
      current.actionRealmID,
      current.skill,
      currentLevel
    )
    if (this.current.settings.get("SHOW_LEVEL_TARGET")) {
      targets.push(this.skillLevelTarget)
    }
    this.skillLevel = Math.max(1, ...targets)

    // if the skill level target is
    this.hideSkillTarget = this.skillLevelTarget <= currentLevel
    this.skillXp = this.current.levelToXp(this.skillLevel)
  }

  skillCompleted() {
    return this.skillXp <= this.current.skillXp
  }

  completed() {
    // check skill xp
    return this.skillCompleted()
  }
}

export function ResourceSkill(baseSkill) {
  return class extends baseSkill {
    constructor(...args) {
      super(...args)
      this.actionsTaken = new ResourceActionCounterWrapper()
      this.remainingResources = ResourceActionCounter.emptyCounter
      this.resourcesReached = false
      this.originalCosts = new EtaCosts()
      this.finalXpMap = new Map()
    }

    get noResourceCheckpointLeft() {
      return this.attemptsToResourceCheckpoint() <= 0
    }

    get resourcesCompleted() {
      return !this.resourcesReached && this.noResourceCheckpointLeft
    }

    activeRealm() {
      return this.skill.selectedRecipe.realm
    }

    skip() {
      return (
        this.action !== this.skill.selectedRecipe || !this.actionIsInActiveRealm
      )
    }

    completed() {
      return super.completed() && this.noResourceCheckpointLeft
    }

    init(game) {
      super.init(game)
      this.originalCosts = this.getCurrentRecipeCosts()

      // set up actions performed
      this.actionsTaken.reset()

      // set up remaining resources
      this.remainingResources = ResourceActionCounter.emptyCounter

      // populate
      this.originalCosts.getItemQuantityArray().forEach(cost => {
        this.actionsTaken.active.items.set(cost.item, 0)
        this.remainingResources.items.set(
          cost.item,
          game.bank.getQty(cost.item)
        )
      })
      this.originalCosts.getCurrencyQuantityArray().forEach(cost => {
        this.actionsTaken.active.currencies.set(cost.currency, cost.quantity)
        // @ts-ignore
        this.remainingResources.currencies.set(
          cost.currency,
          game.currencies.getObjectByID(cost.currency.id).amount
        )
      })

      // flag to check if target was already reached
      this.resourcesReached = false
    }

    attemptsToCheckpoint(gainsPerAction) {
      const resourceActions = this.attemptsToResourceCheckpoint()
      if (resourceActions === 0) {
        // ran out of resources, now check other targets
        return super.attemptsToCheckpoint(gainsPerAction)
      }
      return Math.ceil(
        Math.min(super.attemptsToCheckpoint(gainsPerAction), resourceActions)
      )
    }

    attemptsToResourceCheckpoint(costs = this.getCurrentRecipeCosts()) {
      const attemptsToCheckpoint = []
      costs.getItemQuantityArray().forEach(cost => {
        if (cost.quantity > 0) {
          attemptsToCheckpoint.push(
            (this.remainingResources.items.get(cost.item) ?? 0) / cost.quantity
          )
        }
      })
      costs.getCurrencyQuantityArray().forEach(cost => {
        if (cost.quantity > 0) {
          attemptsToCheckpoint.push(
            (this.remainingResources.currencies.get(cost.currency) ?? 0) /
              cost.quantity
          )
        }
      })
      const resourceSets = Math.floor(
        Math.min(...attemptsToCheckpoint, Infinity)
      )
      if (resourceSets <= 0) {
        return 0
      }
      // apply preservation
      return Math.floor(
        resourceSets / (1 - this.getPreservationChance(0) / 100)
      )
    }

    addAttempts(gainsPerAction, attempts) {
      // compute preservation before increasing the stats
      const preservation = this.getPreservationChance(0)
      super.addAttempts(gainsPerAction, attempts)
      // reduce remaining resources
      this.addCost(this.remainingResources, -attempts, preservation)
      // increase actions taken
      this.addCost(this.actionsTaken.active, attempts, preservation)
    }

    addCost(counter, attempts, preservation) {
      // set resourceSetsUsed to at most -1 for negative and at least 1 for positive values
      let resourceSetsUsed = attempts * (1 - preservation / 100)
      if (-1 < resourceSetsUsed && resourceSetsUsed < 0) {
        resourceSetsUsed = -1
      }
      if (0 < resourceSetsUsed && resourceSetsUsed < 1) {
        resourceSetsUsed = 1
      }

      const currentCosts = this.getCurrentRecipeCosts()

      currentCosts.getItemQuantityArray().forEach(cost => {
        const amt = counter.items.get(cost.item) ?? 0
        counter.items.set(cost.item, amt + cost.quantity * resourceSetsUsed)
      })
      currentCosts.getCurrencyQuantityArray().forEach(cost => {
        const amt = counter.currencies.get(cost.currency) ?? 0
        counter.currencies.set(
          cost.currency,
          amt + cost.quantity * resourceSetsUsed
        )
      })
    }

    setFinalValues() {
      super.setFinalValues()
      if (this.resourcesCompleted) {
        this.actionsTaken.resources = this.actionsTaken.active.clone()
        this.finalXpMap = this.getXpMap()
        this.resourcesReached = true
      }
      this.originalCosts = this.getCurrentRecipeCosts()
    }

    getPreservationChance(chance) {
      chance += this.modifiers.getValue(
        "melvorD:skillPreservationChance" /* ModifierIDs.skillPreservationChance */,
        this.getActionModifierQuery()
      )
      if (this.skill.game.currentGamemode.disablePreservation) {
        chance = 0
      }
      chance += this.modifiers.bypassGlobalPreservationChance
      chance = Math.min(chance, this.getPreservationCap())
      if (chance < 0) {
        return 0
      }
      return chance
    }

    getPreservationCap() {
      const baseCap = 80
      const modifier = this.modifiers.getValue(
        "melvorD:skillPreservationCap" /* ModifierIDs.skillPreservationCap */,
        this.getActionModifierQuery()
      )
      return baseCap + modifier
    }

    getCurrentRecipeCosts() {
      return this.getRecipeCosts()
    }

    getRecipeCosts() {
      // @ts-ignore
      const costs = new Costs(undefined)
      this.action.itemCosts.forEach(cost => {
        let quantity = this.modifyItemCost(cost.item, cost.quantity)
        costs.addItem(cost.item, quantity)
      })
      this.action.currencyCosts.forEach(cost => {
        let quantity = this.modifyCurrencyCost(cost.currency, cost.quantity)
        costs.addCurrency(cost.currency, quantity)
      })
      return costs
    }

    getUncappedCostReduction(item) {
      return this.modifiers.getValue(
        // ModifierIDs.skillCostReduction
        "melvorD:skillCostReduction",
        this.getActionModifierQuery()
      )
    }

    getCostReduction(item = undefined) {
      return Math.min(80, this.getUncappedCostReduction(item))
    }

    getFlatCostReduction(item) {
      return 0
    }

    modifyItemCost(item, quantity) {
      const costReduction = this.getCostReduction(item)
      quantity *= 1 - costReduction / 100
      quantity = Math.ceil(quantity)
      quantity -= this.getFlatCostReduction(item)
      return Math.max(1, quantity)
    }

    modifyCurrencyCost(currency, quantity) {
      const costReduction = this.getCostReduction()
      quantity *= 1 - costReduction / 100
      quantity = Math.ceil(quantity)
      quantity -= this.getFlatCostReduction(undefined)
      return Math.max(1, quantity)
    }
  }
}


export class ResourceSkillWithoutMastery extends ResourceSkill(EtaSkill) {}

export class EtaCrafting extends ResourceSkillWithoutMastery {
  constructor(game, crafting, action, settings) {
    super(game, crafting, action, settings)
  }

  get masteryModifiedInterval() {
    return this.skill.masteryModifiedInterval
  }

  getPreservationChance(chance) {
    chance += this.changeInMasteryLevel * 0.2
    if (this.checkMasteryMilestone(99)) {
      chance += 5
    }
    if (this.isMelvorPoolTierActive(1)) {
      chance += 5
    }
    return super.getPreservationChance(chance)
  }

  getFlatIntervalModifier() {
    let modifier = super.getFlatIntervalModifier()
    if (this.isMelvorPoolTierActive(2)) {
      modifier -= 200
    }
    if (this.isAbyssalPoolTierActive(3)) {
      modifier -= 200
    }
    return modifier
  }


  getFlatCostReduction(item) {
    let reduction = super.getFlatCostReduction(item)
    // TODO: Convert to category scoped modifier
    // Monkey + Pig Synergy: Dragonhide cost reduced by 1. Minimum 1.
    if (
      this.action.category.id ===
      "melvorF:Dragonhide" /* CraftingCategoryIDs.Dragonhide */
    ) {
      reduction -= this.modifiers.flatCraftingDragonhideCost
    }
    return reduction
  }
}
