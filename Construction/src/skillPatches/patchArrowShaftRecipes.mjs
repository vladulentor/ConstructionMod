const hasItem = (alt, id) => alt.itemCosts?.some(i => i.item.id === id);

export function patchArrowShaftRecipes(ctx) {
  const recipe = game.fletching.actions.getObjectByID("melvorF:Arrow_Shafts");
  const saveRecipe = game.fletching.setAltRecipes;
  if (!recipe?.alternativeCosts) return;

  const itemReplacements = [
    { remove: "melvorD:Normal_Logs",    replace: "rielkConstruction:Normal_Beams" },
    { remove: "melvorD:Oak_Logs",       replace: "rielkConstruction:Oak_Beams" },
    { remove: "melvorD:Teak_Logs",      replace: "rielkConstruction:Teak_Beams" },
    { remove: "melvorD:Mahogany_Logs",  replace: "rielkConstruction:Mahogany_Beams" },
    { remove: "melvorD:Redwood_Logs",   replace: "rielkConstruction:Redwood_Beams" },
    { remove: "melvorD:Willow_Logs" },
    { remove: "melvorD:Maple_Logs" },
    { remove: "melvorD:Yew_Logs" },
    { remove: "melvorD:Magic_Logs" }
  ];

  const newAltCosts = [...recipe.alternativeCosts];

  for (const { remove, replace } of itemReplacements) {
    const removeIndex = newAltCosts.findIndex(alt => hasItem(alt, remove));
    if (removeIndex === -1) continue;
    if (saveRecipe.get(recipe) === removeIndex) saveRecipe.delete(recipe);

    if (replace) {
      const replaceIndex = newAltCosts.findIndex(alt => hasItem(alt, replace));
      if (replaceIndex !== -1) {
        newAltCosts.splice(removeIndex, 1, ...newAltCosts.splice(replaceIndex, 1));
        continue;
      }
    }

    newAltCosts.splice(removeIndex, 1);
  }

  recipe.alternativeCosts = newAltCosts;

  ctx.patch(Fletching, 'decode').after(function () {
    for (const [recipe, index] of this.setAltRecipes.entries()) {
      const alt = recipe.alternativeCosts?.[index];
      if (!alt || itemReplacements.some(({ remove }) => hasItem(alt, remove))) {
        this.setAltRecipes.delete(recipe);
      } // We change the decoder and pray we don't fuck up someone's 1yr+ old save
    }
  });
}
