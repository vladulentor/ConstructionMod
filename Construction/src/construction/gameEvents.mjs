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
        console.log('[Matcher] constructor called', { options, game });

        try {
            if (options.actionIDs !== undefined) {
                console.log('[Matcher] processing actionIDs', options.actionIDs);
                this.actions = game.construction.actions.getSetFromIds(options.actionIDs);
                console.log('[Matcher] actions set', this.actions);
            }
            if (options.categoryIDs !== undefined) {
                console.log('[Matcher] processing categoryIDs', options.categoryIDs);
                this.categories = game.construction.categories.getSetFromIds(options.categoryIDs);
                console.log('[Matcher] categories set', this.categories);
            }
            if (options.consumedItemIDs !== undefined) {
                console.log('[Matcher] processing consumedItemIDs', options.consumedItemIDs);
                this.consumedItems = game.items.getSetFromIds(options.consumedItemIDs);
                console.log('[Matcher] consumedItems set', this.consumedItems);
            }
        } catch (e) {
            console.error('[Matcher] constructor error', e);
            throw new DataConstructionError(ConstructionActionEventMatcher.name, e);
        }
    }

    doesEventMatch(event) {
        const actionCheck = this.actions === undefined || this.actions.has(event.action);
        const categoryCheck = this.categories === undefined || this.categories.has(event.action.category);
        const consumedCheck = this.consumedItems === undefined || event.action.itemCosts.some(({item}) => this.consumedItems.has(item));
        const superCheck = super.doesEventMatch(event);

        console.log('[Matcher] doesEventMatch', { event, actionCheck, categoryCheck, consumedCheck, superCheck });

        return actionCheck && categoryCheck && consumedCheck && superCheck;
    }

    _assignNonRaidHandler(handler) {
        console.log('[Matcher] assigning handler', handler);
        this.game.construction.on('action', handler);
    }

    _unassignNonRaidHandler(handler) {
        console.log('[Matcher] unassigning handler', handler);
        this.game.construction.off('action', handler);
    }
}

export function patchGameEventSystem(ctx) {
    ctx.patch(GameEventSystem, 'constructMatcher').after(function(_, data) {
        if (data.type === 'ConstructionAction') {
            console.log('[Patch] creating ConstructionActionEventMatcher', data);
            return new ConstructionActionEventMatcher(data, this.game);
        }
    });
}   