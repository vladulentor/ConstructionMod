export function patchThievingTargets() {
    const outskirts = game.thieving.areas.getObjectByID("melvorF:OUTSKIRTS");
        const cave = game.thieving.areas.getObjectByID("melvorF:CAVE_OF_GIANTS");

    const bricklayer = game.thieving.actions.getObjectByID("rielkConstruction:BRICKLAYER");
    const construct = game.thieving.actions.getObjectByID("rielkConstruction:CONSTRUCT");
    const brickPile = game.items.getObjectByID("rielkConstruction:Pile_Of_Bricks");
    const brickDrop = {item:brickPile, quantity:1}
    outskirts.npcs.push(bricklayer);
    outskirts.uniqueDrops.push(brickDrop);
    cave.npcs.push(construct);
    }
// I thought it would be harder than this to be honest
// edit, it was, i messed it up