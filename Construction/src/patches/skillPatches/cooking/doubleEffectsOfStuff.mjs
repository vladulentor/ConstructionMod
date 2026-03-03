
const CookingEquipList = [
    "melvorF:Chefs_Spoon",
    "melvorF:Chefs_Hat",
    "melvorF:Cooking_Apron",
    "melvorD:Cooking_Gloves",
    "melvorTotH:Mortar_and_Pestle",
    "melvorAoD:Old_Wooden_Ladle",

];
const CookingConsumableList = [
    "melvorF:Bad_Cooker_Scroll",
    "melvorF:Summoning_Familiar_Pig",
    "melvorF:Additional_Cooker_Scroll",
    "melvorAoD:Tiny_Spice_Jar",
    "melvorAoD:Ceramic_Jar",
    "melvorItA:Enhanced_Township_Food_Scroll",
    "melvorF:Generous_Cook_Potion_I",
    "melvorF:Generous_Cook_Potion_II",
    "melvorF:Generous_Cook_Potion_III",
    "melvorF:Generous_Cook_Potion_IV",
    "melvorTotH:Multicooker_Potion_I",
    "melvorTotH:Multicooker_Potion_II",
    "melvorTotH:Multicooker_Potion_III",
    "melvorTotH:Multicooker_Potion_IV",
    "melvorItA:Summoning_Familiar_Abyssal_Pig",
    "melvorTotH:Chefs_Bag",
]
const CookingSkillcapeList = [
    "melvorD:Cooking_Skillcape",
    "melvorTotH:Superior_Cooking_Skillcape",
    "melvorF:Max_Skillcape",
    "melvorF:Cape_of_Completion",
    "melvorTotH:Superior_Max_Skillcape",
    "melvorTotH:Superior_Cape_Of_Completion "
]

const CookingFuckassMods = new Set([
    'additionalPerfectItemChance',
    'passiveCookingInterval',
    'cookingSuccessCap',
    'flatCoalGainedOnCookingFailure',
    'perfectCookChance',
    'successfulCookChance',
    'foodPreservationChance',
]);
function multshit(source, mult) {
    if (!source.modifiers) return;
    source.modifiers.forEach((mod) => {
        const skill = mod.skill;
        const id = mod.modifier._localID; // For the unscoped cooking mods
        if (skill === game.cooking || CookingFuckassMods.has(id)) {
            mod.value *= mult;
            mod.value = Math.min(mod.value, 100);
        }

    });

}

function Multiplystuff(Itemlist, multVal) {
    const divisorItem = game.items.getObjectByID(Itemlist[0]); // I don't want to store arleady multiplied values for this edge case, we get modifier 2 from these 3 items and compare it. It's fugly and I DONT CARE
    let divisor = divisorItem.modifiers[1].value
    switch (divisorItem.id) {
        case 'melvorF:Chefs_Spoon':
            break;
        case 'melvorF:Bad_Cooker_Scroll':
            divisor /= 10;
            break;
        case 'melvorD:Cooking_Skillcape':   
            divisor /= 2;
            break;
        default: console.log('Something has gone terribly wrong.');
    }

    const mult = multVal / divisor;
    Itemlist.forEach(name => {
        const item = game.items.getObjectByID(name);
        if (!item) {
            return;
        }
        if (item.modifiers)
            multshit(item, mult);

        if (item.stats)
            multshit(item.stats, mult)

        if (item.conditionalModifiers) //Just for the cooking glove
            item.conditionalModifiers.forEach(conditionalMod => {
                multshit(conditionalMod, mult);
            });
    });
}

export function doubleEffectsOfStuff(fixture) {

    if (this.tier >= 2)
        Multiplystuff(CookingEquipList, 2);
    if (this.tier >= 5) {
        Multiplystuff(CookingSkillcapeList, 1.5);
        Multiplystuff(CookingConsumableList, 1.5);
    }
}
