// More like focused cock LMAO
export class FocusedCookingCondition extends BooleanCondition {
  constructor(data) {
    super(data);
      this.type = 'FocusedCook';
  }

  _checkIfMet(manager) {
    if (manager.game.cooking.passiveCookTimers.size == 0)
      return true;
    return false;
  }

  _assignWrappedHandler(manager, handler) {
    manager.game.cooking.on("passiveCookingChanged", handler);
  }

  _unassignWrappedHandler(manager, handler) {
    manager.game.cooking.off("passiveCookingChanged", handler);
  }
      addTemplateData(templateData, prefix = '', postfix = '') {
        if (this.item !== undefined)
            templateData[`${prefix}ItemName${postfix}`] = this.item.name;
        if (this.recipe !== undefined)
            templateData[`${prefix}PotionName${postfix}`] = this.recipe.name;
    }

}