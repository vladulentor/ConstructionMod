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

const xpthresholds = [0, 10, 20, 40, 60, 100];
export class WeaponMastery extends RealmedObject {
    constructor(namespace, data, game) {

        super(namespace, data, game);
        this.name = data.name;//getRielkLangString(`WEAPON_MASTERIES_${this._localID}`);
        this._media = data.media;
        this.fixture = Array.isArray(data.fixture)
            ? data.fixture
            : [data.fixture];
        for(let i=0; i< this.fixture.length; i++)
            this.fixture[i] = game.construction.fixtures.getObjectByID(this.fixture[i]);
        this.allWeapons = [];
        this.levels = data.levels.map(
            (lvl, i) => new WeaponMasteryLevel(namespace, lvl, game, this._localID, i + 1)
        );
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get xp() {
        return this.allWeapons.reduce((acc, weapon) => acc + (weapon._weaponXP || 0), 0);
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
        return 0;
    }
    get levelCap() {
        return Math.min(...this.fixture.map(f => f.currentTier));
    }
    get xpPercentCap() {
        return xpthresholds[this.levelCap];
    }
    get currentXP() {
        return this.allWeapons.reduce((tot, n) => tot + n.weaponXPCapped, 0);
    }
    get maxXP() {
        return this.allWeapons.reduce((tot, n) => tot + n.weaponXPCap, 0);
    }
    get xpPercent() {
        return Math.min(100, this.currentXP / this.maxXP * 100);
    }
    get cappedxpPercent() {
        return Math.min(this.xpPercent, this.xpPercentCap);
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
