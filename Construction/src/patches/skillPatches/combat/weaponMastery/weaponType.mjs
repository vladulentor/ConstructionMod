// Hello, and welcome to hell
const { loadModule, onInterfaceReady } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');

class WeaponMasteryLevel extends RealmedObject {
    constructor(namespace, data, game, typeID, levelIndex) {
        super(namespace, { id: `${typeID}_level_${levelIndex}` }, game);

        if (data.shiny) this.shiny = data.shiny;
        this.wepModifiers = data.modifiers
            ? new StatObject(data, game, this._localID)
            : null;
    }

}

const xpthresholds = [100, 250, 500, 1000, 2000];
export class WeaponMastery extends RealmedObject {
    constructor(namespace, data, game) {
        
        super(namespace, data, game);
        this.name = data.name;//getRielkLangString(`WEAPON_MASTERIES_${this._localID}`);
        this._xp = 0;
        this._media = data.media;
        this.fixture = game.construction.fixtures.getObjectByID("rielkConstruction:Training_Dummy");
        this.levels = data.levels.map(
            (lvl, i) => new WeaponMasteryLevel(namespace, lvl, game, this._localID, i + 1)
        );
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    xpToLvl(xp) {
        for (let i = xpthresholds.length - 1; i >= 0; i--) {
            if (xp >= xpthresholds[i]) return i;
        }
        return -1;

    }
    get level() {
        for (let i = xpthresholds.length - 1; i >= 0; i--) {
            if (this._xp >= xpthresholds[i]) return i;
        }
        return -1;
    }
    levelUp() {
        //no idea yet
    }
    addXP(xpamount) {
        if (this.xpToLvl(this._xp + xpamount) > this.level) {
            if (this.fixture === this.level) // basically if you'd level over your fixtures
            {/* Do nothing */ }
            else {
                this._xp += xpamount;
                this.levelUp()
            }
        }
        else
            this._xp += xpamount
    }
}
