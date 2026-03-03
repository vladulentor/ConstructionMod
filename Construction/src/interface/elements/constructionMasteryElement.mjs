const ctx = mod.getContext(import.meta);
const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');


class RielkConstructionMasteryElement extends HTMLElement {
  constructor() {
    super();
    this._content = new DocumentFragment();
    this._content.append(getTemplateNode('rielk-construction-mastery'));
    this._image =getElementFromFragment(this._content, 'house-image', 'img');
    this.barsContainer = getElementFromFragment(this._content, 'mastery-bars-container', 'div');
    this._aggregateTiers = getElementFromFragment(this._content, 'tiers-completed-aggregate', 'small');
    this._bars = []; // will hold objects: {bar, tierText, currentTier, fixturesInTier}
    this.aggregateTotal = 0;
    this.aggregateBuilt = 0;
  }

  connectedCallback() {
    this.appendChild(this._content);

    const hasDLC = cloudManager?.hasTotHEntitlementAndIsEnabled ?? false;
    const maxTiers = 5; // hasDLC ? 8 : 5;
      // This'll be changed when the TotH tiers will actually be added
    this._bars = [];
     if(window.innerWidth <= 968) 
    this.barsContainer.classList.add("flex-column");
    // tier bars
    for (let i = 0; i < maxTiers; i++) {
      const barWrapper = document.createElement("div");
      barWrapper.className = "d-flex flex-column mx-1";
      barWrapper.style.width = "100%";
      // empty bars
      const progressContainer = document.createElement("div");
      progressContainer.className = "mastery empty mb-1";
      progressContainer.style.height = "4px";
      progressContainer.style.width = "100%";
      progressContainer.style.position = "relative";
      progressContainer.style.borderRadius = "2px";
      progressContainer.style.overflow = "hidden";

      // color fill
      const bar = document.createElement("div");
      bar.className =   "mastery filled1";
      bar.setAttribute("role", "progressbar");
      bar.style.height = "100%";          // match container
      bar.style.width = "0%";             // start empty
      bar.style.transition = "width 0.3s ease";
      bar.style.borderRadius = "2px";
      progressContainer.appendChild(bar);

      const tierText = document.createElement("small");
      tierText.className = "text-muted";
      tierText.style.fontSize = "0.65rem";
      tierText.style.alignSelf = "flex-start";
      tierText.textContent = ``;

      barWrapper.appendChild(progressContainer);
      barWrapper.appendChild(tierText);
      this.barsContainer.appendChild(barWrapper);
      this._aggregateTiers.textContent = "0 / 0 (0%)"
      this._bars.push({
        bar,
        tierText,
        currentBuilt: 0,
      });
      this.fixturesInTier = 24; // default for no mods or DLC
    }
    this._image.src= ctx.getResourceUrl('assets/cabin.webp');

  }
  setFixtureCount(fixtureCount) {
    if (fixtureCount <= 0) return;
    this.fixturesInTier = fixtureCount;

  }

  // Update a single tier by index
  updateTier(index, newBuilt) {
    if (index < 0 || index >= this._bars.length) return;

    const tier = this._bars[index];
    tier.currentBuilt = Math.min(newBuilt, this.fixturesInTier);
    const percent = (tier.currentBuilt / this.fixturesInTier) * 100;
    tier.bar.style.width = `${percent}%`;
    tier.tierText.textContent = `${tier.currentBuilt} / ${this.fixturesInTier} (${percent.toFixed(2)}%)`;
    this.setAggregate();
  }
  updateAllTiers(fixArray) {
    if (!Array.isArray(fixArray)) {
      console.error('fixArray is not an array', fixArray);
      return;
    }
    fixArray.forEach((fixture, i) => this.updateTier(i, fixture));
  }

  setAggregate() {
    this.aggregateBuilt = this._bars.reduce((sum, bar) => sum + bar.currentBuilt, 0);
    this.aggregateTotal = this.fixturesInTier * this._bars.length;
    this._aggregateTiers.textContent = `${this.aggregateBuilt} / ${this.aggregateTotal} (${((this.aggregateBuilt / this.aggregateTotal) * 100).toFixed(2)}%) ${getRielkLangString('MENU_BUILT')}`;
    if(this._bars.slice(0, 5).every(bar => bar.currentBuilt >= bar.totalBuilt))  this._image.src= ctx.getResourceUrl('assets/cabin_max.webp');
  }

  initMasteryBar(construction) {
    this.setFixtureCount(construction.recipeNumber);
    this.updateAllTiers(construction.recipeCountByTier);
    this.setAggregate();


  }

}

customElements.define("rielk-construction-mastery", RielkConstructionMasteryElement);
