// This is a completely unnecessary addition.
// It exists, solely, and I do mean solely so that the bonuses from cooking, conditional to not passive cooking, update the moment you click them and not later.
// We could've used the normal cooking emitter's "isPassiveCooking" attribute, but that only updates after you finish cooking.
// That's not an acceptable level of polish.
// End of manifesto

export function emitPassiveCook(ctx) {
    ctx.patch(Cooking, 'startPassiveCooking').after(function (_,category) {
            this._events.emit("passiveCookingChanged", {
                skill: this
            });
                    this.renderQueue.recipeRates = true;
    });
    ctx.patch(Cooking, 'stopPassiveCooking').after(function (stopped) {
        if (this.passiveCookTimers.size == 0)
           { this._events.emit("passiveCookingChanged", {
                skill: this
            });
                this.renderQueue.recipeRates = true;
            }
    });
}
