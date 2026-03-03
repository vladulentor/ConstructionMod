const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function addRoaringFire(ctx) {
  // Menu stuff
  ctx.patch(FiremakingBonfireMenuElement, 'init').after(function (_, firemaking) {
    this.bonfireNotice = document.querySelector('[lang-id="MENU_TEXT_FIREMAKING_BONFIRE_NOTICE"]');
    this.noticeText = this.bonfireNotice.innerText
    this.roaringWrapper = document.createElement('div');
    const textSpan = document.createElement('span');
    textSpan.className = 'roaring-text';
    textSpan.textContent = getRielkLangString('BONFIRE_ROARING_MOD');
    this.roaringState = document.createElement('span');
    this.roaringState.className = 'roaring-state';
    this.roaringState.textContent = '+0% Nothing Yet';
    this.roaringState.classList.add('text-danger');
    this.roaringWrapper.append(textSpan, this.roaringState);
    this.abyssalXpBonus?.after(this.roaringWrapper);
    hideElement(this.roaringWrapper);
    const btn = this.lightButton.cloneNode(true);
    btn.classList.remove('btn-primary');

    btn.classList.add('btn-construction');
    btn.onclick = () => firemaking.stokeBonfire?.();
    this.stopButton.parentElement.insertBefore(btn, this.stopButton.nextSibling);
    this.stokeButton = btn;
    hideElement(btn); // more like stroke button
    // I wish someone'd stroke my button
  });

  ctx.patch(FiremakingBonfireMenuElement, 'updateInfo').before(function (firemaking, recipe) {
    if (recipe !== undefined) {
      const stokeCost = recipe.bonfireCost * 10 + game.modifiers.getValue("rielkConstruction:roaringLogCostReduction", ModifierQuery.EMPTY);
      this.stokeButton.innerText = templateRielkLangString('MENU_TEXT_STOKE_BONFIRE', {
        qty: numberWithCommas(stokeCost),
        logName: recipe.log.name,
      });
      this.roaringState.innerHTML = " " + (recipe.roaringStats ? recipe.roaringStats.describeAsSpanHTML() : "--");
      for (const child of this.roaringState.children) {
        child.classList.replace('text-success', `${firemaking.isRoaringBonfire ? 'construction-victory' : 'text-danger'}`);
      }

    }
  });

  ctx.patch(FiremakingBonfireMenuElement, 'setActive').before(function () {
    if (game?.modifiers?.getValue("rielkConstruction:unlockRoaring", ModifierQuery.EMPTY) && game.firemaking.litBonfireRecipe.roaringStats) { // This is the whole way we hide the system from the player.
      showElement(this.stokeButton);
      showElement(this.roaringWrapper);
      this.bonfireNotice.parentElement.classList.replace('construction-victory', 'text-info');
      this.bonfireNotice.innerText = this.noticeText;

    }
  });
  ctx.patch(FiremakingBonfireMenuElement, 'setInactive').before(function () {
    hideElement(this.stokeButton);
    this.progressBar.children[0].children[0].classList.remove('construction-bar');
    this.roaringState.classList.remove('construction-victory', 'fuck-you');
    this.roaringState.classList.add('text-danger');
    this.bonfireNotice.parentElement.classList.replace('construction-victory', 'text-info');
    this.bonfireNotice.innerText = this.noticeText;

  });
  FiremakingBonfireMenuElement.prototype.activateRoaring = function () {
  }
  FiremakingBonfireMenuElement.prototype.setRoaring = function () {
    // Change the color state
    this.bonfireNotice.parentElement.classList.replace('text-info', 'construction-victory');
    this.bonfireNotice.innerText = getRielkLangString('BONFIRE_ROARING_NOTICE');
    this.progressBar.children[0].children[0].classList.add('construction-bar');
    this.roaringState.classList.remove('text-danger');
    this.roaringState.innerHTML = game.firemaking.litBonfireRecipe.roaringStats.describeAsSpanHTML();
    for (const child of this.roaringState.children) {
      child.classList.remove('text-danger');
      child.classList.replace('text-success', 'construction-victory');
    }
    this.roaringState.classList.add('construction-victory', 'fuck-you');
    this.bonfireImage.src = ctx.getResourceUrl(
      'assets/replacements/bonfire_roaring.webp'
    );
    showElement(this.stopButton);
    hideElement(this.stokeButton);
    showElement(this.roaringWrapper); // For loading stoked
    hideElement(this.lightButton);
  };


  // Logic stuff
  ctx.patch(Firemaking, 'renderBonfireStatus').before(function () {
    if (!this.renderQueue.bonfireStatus)
      return;
    if (this.isRoaringBonfire && this.isBonfireActive) {
      firemakingMenu.bonfire.setRoaring();
      this.renderQueue.bonfireStatus = false;
    }
  });


  ctx.patch(Firemaking, 'onLoad').after(function () {
    this._uifire ??= {
      el: sidebar.category('Non-Combat').item('melvorD:Firemaking').nameEl,
      active: false
    };
    ctx.onCharacterLoaded(() => {
      if (game.modifiers.getValue("rielkConstruction:unlockRoaring", ModifierQuery.EMPTY)) {
        showElement(firemakingMenu.bonfire.roaringWrapper);
        if (this.isRoaringBonfire) {
          firemakingMenu.bonfire.setActive();
          firemakingMenu.bonfire.setRoaring();
          this.computeProvidedStats(true);
          this.hookIntoSkillTick();
        }
      }
    });
  });

  ctx.patch(FiremakingLog, 'applyDataModification').after(function (_, data, game) {
    if (data.modifiers !== undefined) {
      this.roaringStats = new StatObject(data, game);
      if (data.roaringSkill !== undefined)
        this.roaringSkill = game.skills.getObjectSafe(data.roaringSkill);
    }
  });


  ctx.patch(Firemaking, 'addProvidedStats').after(function (_) {// I don't know what the fuck a statObject wants, fuck stat objects
    if (this.isRoaringBonfire)
      this.providedStats.addStatObject({ name: `${templateRielkLangString('MENU_BONFIRE_SOURCE', { logName: this.litBonfireRecipe.name })}` }, this.litBonfireRecipe.roaringStats);
  });


  Firemaking.prototype.stokeBonfire = function () {
    if (!this.isBonfireActive)
      return notifyPlayer(this, 'No active bonfire to stoke!', 'danger');

    let recipe = this.litBonfireRecipe;
    this.renderQueue.bonfireStatus = true;
    const stokeCosts = new Costs(this.game);
    stokeCosts.setSource(`Skill.${this.id}.Bonfire.${recipe.id}`);
    const roaringCost = recipe.bonfireCost * 10 + game.modifiers.getValue("rielkConstruction:roaringLogCostReduction", ModifierQuery.EMPTY);
    stokeCosts.addItem(recipe.log, roaringCost); // This is where cost reductions can live.
    if (stokeCosts.checkIfOwned()) {
      this.isRoaringBonfire = true;
      if (skillNav.active.has(recipe.roaringSkill)) {
        this._uifire.el.classList.add('construction-success', 'fuck-you');
        this._uifire.active = true;
      }
      this.renderQueue.bonfireStatus = true;
      this.renderQueue.bonfireInfo = true;
      this.renderQueue.bonfireQty = true;
      this.computeProvidedStats(true);
      stokeCosts.consumeCosts();
      this.hookIntoSkillTick();
      return true;

    }
    else {
      notifyPlayer(this, getRielkLangString('TOASTS_NO_LOGS_FOR_STOKE'), 'danger');
      return false;
    }
  }
  ctx.patch(Firemaking, 'renderBonfireProgress').replace(function () {
    if (!this.renderQueue.bonfireProgress)
      return;
    if (this.isBonfireActive) {
      if (this.isActive ||
        (this.isRoaringBonfire &&  //roaring checks
          (this.litBonfireRecipe?.roaringSkill?.isActive || //for non-combat skills
            (this.litBonfireRecipe?.roaringSkill?.isCombat && this.game.activeAction == this.game.combat && this.game.combat.activeSkills.includes(game.firemaking?.litBonfireRecipe?.roaringSkill) && !this.game.combat.spawnTimer.isActive)))) //for combat
      {
        firemakingMenu.bonfire.progressBar.animateProgressFromTimer(this.bonfireTimer);
      }
      else {
        firemakingMenu.bonfire.progressBar.setFixedPosition(this.bonfireTimer.progress * 100);
      }
    }
    else {
      firemakingMenu.bonfire.progressBar.stopAnimation();
    }

    this.renderQueue.bonfireProgress = false;
  });

  Firemaking.prototype.hookIntoSkillTick = function () {
    if (this.litBonfireRecipe.roaringSkill.isCombat) {
      const proto = this.game.combat.player.constructor;
      if (ctx.isPatched(proto, 'activeTick')) return;

      ctx.patch(proto, 'activeTick').after(function () {
        if (game.firemaking.isRoaringBonfire && game.activeAction == this.manager && this.manager.activeSkills.includes(game.firemaking?.litBonfireRecipe?.roaringSkill) && !this.manager.spawnTimer.isActive) {
          game.firemaking.bonfireTimer.tick();
          game.firemaking.renderQueue.bonfireProgress = true;
          game.firemaking.renderQueue.bonfireInfo = true;
        }
      });
    }
    else {
      const proto = this.litBonfireRecipe.roaringSkill.constructor; //most skills don't define activeTick
      if (ctx.isPatched(proto, 'activeTick')) return;
      ctx.patch(proto, 'activeTick').after(function () {
        if (game.firemaking.isRoaringBonfire && game.firemaking?.litBonfireRecipe?.roaringSkill == this) {
          game.firemaking.bonfireTimer.tick();
          if (game.openPage.id == "melvorD:Firemaking") {
            game.firemaking.renderQueue.bonfireProgress = true;
            game.firemaking.renderQueue.bonfireInfo = true;
          }
        }
      });
    }
  }

  ctx.patch(SkillNav, 'setActive').after(function (_, skill) {
    const uifire = game.firemaking._uifire;
    if ((game.firemaking.isRoaringBonfire && game.firemaking.litBonfireRecipe?.roaringSkill == skill) && !uifire.active) {
      uifire.el.classList.add('construction-success', 'fuck-you');
      uifire.active = true;
    }
  });
  ctx.patch(SkillNav, 'setInactive').after(function (_, skill) {
    const uifire = game.firemaking._uifire;
    if ((game.firemaking.isRoaringBonfire && game.firemaking.litBonfireRecipe?.roaringSkill == skill) && uifire.active) {
      uifire.el.classList.remove('construction-success', 'fuck-you');
      uifire.active = false;
    }
  });


  ctx.patch(Firemaking, 'stopBonfire').after(function () { //Function called when you press to sotp
    if (this.isRoaringBonfire) {
      this._uifire.el.classList.remove('fuck-you', 'construction-success');
      this._uifire.active = false;
      this.isRoaringBonfire = false;
      this.computeProvidedStats(true);
    }
  });
  ctx.patch(Firemaking, 'endBonFire').replace(function () {
    const previousBonfire = this.litBonfireRecipe;
    this.litBonfireRecipe = undefined;
    this.renderQueue.logInfo = true;
    this.renderQueue.bonfireStatus = true;
    this.renderQueue.bonfireProgress = true;
    this.renderQueue.bonfireInfo = true;
    if (this.isActive ||
      (this.isRoaringBonfire &&  //roaring checks
        (previousBonfire.roaringSkill?.isActive || //for non-combat skills
          (previousBonfire.roaringSkill?.isCombat && this.game.activeAction == this.game.combat && this.game.combat.activeSkills.includes(previousBonfire.roaringSkill))))) //for combat
    //We COULD simplify this and make it a getter. We could.
    {
      // Attempt to re-light and restoke the same bonfire
      const relit = this.lightBonfire(previousBonfire);
      const restoked = this.isRoaringBonfire ? this.stokeBonfire(previousBonfire) : false;
      if (this.isRoaringBonfire && restoked !== true) // if ran out of logs for stoking, close the fire down, no need to keep it normally lit.
      {
        this.stopBonfire()
      }
      // On only relight with current logs if this is the active skill.
      if (!relit && this.isActive)
        this.lightBonfire();
    }
  }
  );


}