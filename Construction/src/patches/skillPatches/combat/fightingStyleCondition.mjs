// More like focused cock LMAO
export class fightingStyleCondition extends BooleanCondition {
    constructor(data) {
        super(data);
        this.type = 'AttackStyle';
        this.attackStyle = data.attackStyle
    }

    _checkIfMet(manager) {
        const plSt = manager.game.player.attackStyle._localID
        if (this.attackStyle == "Defensive" && (plSt == "Defensive" || plSt == "Longrange" || plSt == "Block"))
            return true;
        else if (manager.game.player.attackStyle._localID == this.attackStyle)
            return true;
        return false;
    }

    _assignWrappedHandler(manager, handler) {
        manager.game.cooking.on("passiveCookingChanged", handler);
    }

    _unassignWrappedHandler(manager, handler) {
        manager.game.cooking.off("passiveCookingChanged", handler);
    }
    addTemplateData(templateData, prefix = '', postfix = '') {    }

}

