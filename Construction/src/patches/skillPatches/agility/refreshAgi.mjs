
let guard = false;
const ctx = mod.getContext(import.meta);

export function refreshAgi() {

    if (!game.construction.notifs && !guard) {
        ctx.onCharacterLoaded(async (ctx) => {
            game.agility.computeProvidedStats(true);
        });
        guard = true
    }
    if (game.construction.notifs)
        game.agility.computeProvidedStats(true);
}