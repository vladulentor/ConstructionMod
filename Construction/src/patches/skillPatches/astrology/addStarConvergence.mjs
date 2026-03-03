const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');


export function addStarConvergence({ patch }) {

  // ------- LOGIC SHIT ----------------------
  patch(AstrologyRecipe, 'applyDataModification').after(function (_, data, game) {
    if (data.convergenceRunes !== undefined) {
      this.convergenceRunes = data.convergenceRunes.map(entry => {
        const [item, quantity] = Object.entries(entry)[0];
        return {
          item: game.items.getObjectByID(item),
          quantity
        }
      });
    }
    if (data.goldvergenceRunes !== undefined) {
      this.goldvergenceRunes = data.goldvergenceRunes.map(entry => {
        const [item, quantity] = Object.entries(entry)[0];
        return {
          item: game.items.getObjectByID(item),
          quantity
        }
      });
    }
  });

  patch(Astrology, "actionRewards").get(function (orig) {
    const rewards = orig.call();
    const addShit = this.game.modifiers.getValue("rielkConstruction:UnlockConvergence", ModifierQuery.EMPTY)
    if (addShit) {
      const conste = this.activeConstellation;
      let hasDust = 0
      let hasGoldDust = 0
      let hasRune = 0
      for (const [item, _] of rewards._items) {
        switch (item._localID) { //Checking local ID is a bodge, but is (probably) faster than checking the whole item against others, and is lang asymptomatic
          case "Stardust":
            hasDust = true;
            break;
          case "Golden_Stardust":
            hasGoldDust = true;
            break;
          case "Rune_Essence":
            hasRune = true;
            break;
        }
        if (hasDust && hasGoldDust && hasRune)
          break;
      }
      if (hasRune) {
        if (hasDust) {
          rewards.addItemsAndCurrency(makeRewardArray(conste.convergenceRunes, conste.standardModifiers))
        }
        if (hasGoldDust) {
          rewards.addItemsAndCurrency(makeRewardArray(conste.goldvergenceRunes, conste.uniqueModifiers))
        }
      }
    }
    return rewards;
  })

  function makeRewardArray(runes, modifs) {
    let rewards = { items: [] }
    runes.forEach((rune, i) => {
      if (modifs[i].isMaxed)
        rewards.items.push({ item: rune.item, quantity: rune.quantity })
    })
    return rewards
  }

  // ----------- HOOKING IN UI --------------
  patch(AstrologyExplorationPanelElement, 'connectedCallback').after(function () {
    if (this.convergenceDiv) return;

    const div = document.createElement('div');
    div.textContent = 'UI injection test: it lives';
    div.className = 'p-2 text-warning';
    this.convergenceDiv = div;
  });
  patch(Astrology, "render").after(function (_) {
    this.renderConvergenceTooltips()
  })

  Astrology.prototype.renderConvergenceTooltips = function () {
    if (!this.renderQueue.convergenceTooltips)
      return;
    astrologyMenus.explorePanel.convergenceBox?.updateTooltipchance()
  }
  patch(Astrology, "onModifierChange").after(function (_) {
    if (game.modifiers.getValue(
      "rielkConstruction:UnlockConvergence", ModifierQuery.EMPTY))
      this.renderQueue.convergenceTooltips = true
  });

  patch(Astrology, "onConstellationUpgrade").after(function (_, conste, type, modID) {
    if (this.game.modifiers.getValue("rielkConstruction:UnlockConvergence", ModifierQuery.EMPTY)
      && astrologyMenus.explorePanel.convergenceBox?.represConstellation.id == conste.id) { //Very long if chain to mean "if you are looking at the right convergence box and it exists"
      const ourmod = conste.standardModifiers[modID]
      if (ourmod.isMaxed)
        switch (type) {
          case AstrologyModifierType.Standard:
            astrologyMenus.explorePanel.convergenceBox.unlockIcon('left', modID)
            break;
          case AstrologyModifierType.Unique:
            astrologyMenus.explorePanel.convergenceBox.unlockIcon('right', modID)
            break;
        } // Don't do anything on abyssal constellations because they suck
    }
  })
  patch(AstrologyExplorationPanelElement, 'setConstellation').after(function (_, constellation) {
    let buildConv = 0
    if (game.modifiers.getValue(
      "rielkConstruction:UnlockConvergence", ModifierQuery.EMPTY)) {
      if (!this.convergenceDiv && constellation.convergenceRunes) {
        const div = document.createElement('div');
        const innerRow = this.querySelector('.row.no-gutters');
        innerRow.appendChild(div);
        this.convergenceDiv = div;
        div.classList.add('w-100');
        const convergenceBox = document.createElement('convergence-box');
        this.convergenceDiv.appendChild(convergenceBox);
        this.convergenceBox = convergenceBox;
        buildConv = 1

      }
      if (constellation.convergenceRunes) {
        this.convergenceBox.classList.remove('d-none')
        let convArray = [...constellation.convergenceRunes, ...constellation.goldvergenceRunes]
        convArray.forEach((ent, i) => {
          if (i <= 2)
            ent.locked = !constellation.standardModifiers[i].isMaxed
          else if (i <= 5)
            ent.locked = !constellation.uniqueModifiers[i - 3].isMaxed
        })
        if (buildConv)
          this.convergenceBox.setGroups(convArray, constellation,)
        else
          this.convergenceBox.updateGroups(convArray, constellation)
      }
      else
        this.convergenceBox?.classList.add('d-none')
    }
  });

}