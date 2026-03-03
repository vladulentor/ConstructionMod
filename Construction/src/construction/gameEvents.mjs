export class ConstructionActionEvent extends SkillActionEvent {
    constructor(skill, action) {
        super();
        this.skill = skill;
        this.action = action;
        this.activePotion = skill.activePotion;
        this.realm = action.realm;
    }
}
class ConstructionActionEventMatcher extends SkillActionEventMatcher {
    constructor(options, game) {
        super(options, game);
        this.type = 'ConstructionAction';
        try {
            if (options.actionIDs !== undefined) {
                this.actions = game.construction.actions.getSetFromIds(options.actionIDs);
            }
            if (options.categoryIDs !== undefined) {
                this.categories = game.construction.categories.getSetFromIds(options.categoryIDs);
            }
            if (options.consumedItemIDs !== undefined) {
                this.consumedItems = game.items.getSetFromIds(options.consumedItemIDs);
            }
        } catch (e) {
            throw new DataConstructionError(ConstructionActionEventMatcher.name, e);
        }
    }

    doesEventMatch(event) {
        const actionCheck = this.actions === undefined || this.actions.has(event.action);
        const categoryCheck = this.categories === undefined || this.categories.has(event.action.category);
        const consumedCheck = this.consumedItems === undefined || event.action.itemCosts.some(({item}) => this.consumedItems.has(item));
        const superCheck = super.doesEventMatch(event);

        return actionCheck && categoryCheck && consumedCheck && superCheck;
    }

    _assignNonRaidHandler(handler) {
        this.game.construction.on('action', handler);
    }

    _unassignNonRaidHandler(handler) {
        this.game.construction.off('action', handler);
    }
}

export function patchGameEventSystem(ctx) {
    ctx.patch(GameEventSystem, 'constructMatcher').after(function(_, data) {
        if (data.type === 'ConstructionAction') {
            return new ConstructionActionEventMatcher(data, this.game);
        }
    });
}   