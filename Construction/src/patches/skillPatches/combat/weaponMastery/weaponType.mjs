// Hello, and welcome to hell
const { loadModule, onInterfaceReady } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');
const { EffectRegistry } = await loadModule('src/patches/skillPatches/patchRegistry.mjs');

game.weaponTypeStats = new StatProvider();
game.combat.registerStatProvider(game.weaponTypeStats);

class WeaponMasteryLevel extends RealmedObject {
    constructor(namespace, data, game, parentType, levelIndex) {
        super(namespace, data, game);
        if (data.changeFunc) {
            this.changeFunc = Array.isArray(data.changeFunc)
                ? data.changeFunc
                : [data.changeFunc];
            this.canCallChangeFunc = true;
        }
        this.type = parentType
        this.name = templateRielkLangString("WEAPON_TYPE_LEVEL", { weaponType: parentType._localID, level: levelIndex });
        if (data.shiny) this.shiny = data.shiny;
        this.wepModifiers = new StatObject(data, game, this._localID)

    }


    callChangeFunc() {
        this.changeFunc.forEach(funcName => {
            const effectFunc = EffectRegistry[funcName];
            if (typeof effectFunc === "function") {
                effectFunc.call(this);
            } else {
                console.warn(`Effect not found in registry, going insane: ${funcName}`);
            }
        });
        this.canCallChangeFunc = false;
    }
}

const xpthresholds = [0, 7, 20, 40, 65, 95];
export class WeaponMastery extends RealmedObject {
    constructor(namespace, data, game) {

        super(namespace, data, game);
        this.name = data.name; //getRielkLangString(`WEAPON_MASTERIES_${this._localID}`);
        this._media = data.media;
        this.providedStats = new StatProvider();
        game.combat.registerStatProvider(this.providedStats);
        this._curLvl = 0;
        this.activeWeapon = undefined
        this.game = game;

        this.isPerWepMod = data.isPerWepMod ?? false;
        if (this.isPerWepMod) {
            this.wepModifiers = data.wepModifiers;
            this._uiWepMod = new StatObject({ conditionalModifiers: [{ condition: { type: "Weapon", weapon: `Fucking_NOTHING` }, ...this.wepModifiers, descriptionLang: "Wow, it works!" }] }, this.game, null);
        }
        else {
            this.wepModifiers = new StatObject(data.wepModifiers, game, this._localID);
            this._uiWepMod = this.wepModifiers;
        }

        this.fixture = Array.isArray(data.fixture)
            ? data.fixture
            : [data.fixture];
        for (let i = 0; i < this.fixture.length; i++)
            this.fixture[i] = game.construction.fixtures.getObjectByID(this.fixture[i]);
        this.allWeapons = [];
        this.masteredWeapons = new Map();
        this.levels = data.levels.map(
            (lvl, i) => new WeaponMasteryLevel(namespace, lvl, game, this, i + 1)
        );

    }
    get media() {
        return this.getMediaURL(this._media);
    }
    ToggleActiveWeapon(weap) {
        if (weap.weaponType?.name === this.name) {
            this.setActiveWeapon(weap);
        }
        else {
            this.unsetActiveWeapon();
        }
    }
    setActiveWeapon(weapon) {
        this.activeWeapon = true;
        this._cachedXP = this.allWeapons.reduce((acc, w) => {
            if (w.id === weapon.id) return acc;
            return acc + (w.weaponXPCapped || 0); // this java stuff with the return is so cool, I'd thought it just returns 1 since C++ 
        }, 0);
    }
    unsetActiveWeapon() {
        this.activeWeapon = false;

        this._cachedXP = this.allWeapons.reduce((acc, w) => {
            return acc + (w.weaponXPCapped || 0);
        }, 0);
    }
    get xp() {
        const weap = game.combat.player.equipment.getItemInSlot("melvorD:Weapon");
        if (this.activeWeapon === undefined) { this.ToggleActiveWeapon(weap) }
        return this.activeWeapon ? this._cachedXP + (weap?.weaponXPCapped || 0) : this._cachedXP;
    }
    get uncappedxpPercent() {
        return Math.min(100, this.xp / this.maxXP * 100);
    }
    get xpPercent() {
        return Math.min(this.uncappedxpPercent, this.xpPercentCap);
    }
    get xpPercentCap() {
        if (this.levelCap == 5) return 100;
        return xpthresholds[this.levelCap];
    }
    get active() {
        return this.levelCap > 0
    }
    get level() {
        const cap = this.levelCap;
        for (let i = cap; i >= 0; i--) {
            if (this.xp >= this.maxXP * (xpthresholds[i] / 100)) return i;
        }
        return 0;
    }
    get levelCap() {
        return Math.min(...this.fixture.map(f => f.currentTier));
    }
    get IndMods() {
        return this.levelCap >= 2;
    }
    get doubledIndBonuses(){
        return this.levelCap >=5 ? 2 : 1;
    }
    makeWeaponConditional(weapon) {
        const cond = new StatObject({ conditionalModifiers: [{ condition: { type: "Weapon", weapon: `${weapon._localID}` }, ...this.wepModifiers, descripiton: "Wow, it works!" }] }, this.game, null);
        weapon.uniqMasteryMod = cond;
    }

    makeMasteredWeaponsMap() {
        for (const weapon of this.allWeapons) {
            if (weapon.masteryMaxed || weapon.isMaxMastery) {
                this.addweaponmastery(weapon);
            }
        }
    }
    addweaponmastery(weapon) {
        if (this.IndMods) {
            let weapMod = this.isPerWepMod ? weapon.uniqMasteryMod : this.wepModifiers;
            this.providedStats.addStatObject("Mastered Weapon", weapMod, this.doubledIndBonusesZ, 1);
        }
        weapon.masteryMaxed = 1;
        this.masteredWeapons.set(weapon.id, weapon);
    }
    levelUp() {
        this._curLvl += 1;
        this.computeProvidedStats(false);
    }
    onLoad() {
        this.maxXP = this.allWeapons.reduce((tot, w) => tot + w.weaponXPCap, 0);
        this._curLvl = this.level;
        this.computeProvidedStats(false);
    }

    computeProvidedStats(updatePlayer = true) {
        this.providedStats.reset();
        for (let lvl = 1; lvl <= this._curLvl; lvl++) {
            this.providedStats.addStatObject(this.levels[lvl - 1], this.levels[lvl - 1].wepModifiers, 1, 1);
            if (this.levels[lvl - 1].canCallChangeFunc)
                this.levels[lvl - 1].callChangeFunc();
        }
        this.masteredWeapons.clear();
        this.makeMasteredWeaponsMap();
        if (updatePlayer)
            this.game.combat.computeAllStats();
    }
    checkXP() {
        const temlvl = this.level;
        while (temlvl > this._curLvl) {
            this.levelUp();
        }
    }
    showWeaponswithXP() {
        for (const weapon of this.allWeapons)
            if (weapon._weaponXP > 0)
                console.log("Weapon:", weapon.name, " XP:", weapon._weaponXP, "\n");
    }
}

