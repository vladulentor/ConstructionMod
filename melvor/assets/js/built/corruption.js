"use strict";
class CorruptionEffectTable {
    constructor(game, corruption) {
        this.game = game;
        this.corruption = corruption;
        this.allRows = [];
        this.unlockedRows = [];
        this.lockedRows = [];
        this.selectedUnlockRows = new Map();
        this.NEW_EFFECT_CHANCE = 0.2;
        this.effectRemovalHandler = (e) => this.onEffectRemoval(e);
    }
    get allEffectRows() {
        return this.allRows;
    }
    /** Gets the number of corruptions the player has unlocked */
    get numberUnlocked() {
        return this.unlockedRows.length;
    }
    /** Gets a number of unique effect applicators */
    getApplicators(count, monsterLevel) {
        const rows = [];
        let newCount = 0;
        if (monsterLevel !== undefined && this.lockedRows.length) {
            for (let i = 0; i < count; i++) {
                if (rollPercentage(this.NEW_EFFECT_CHANCE))
                    newCount++;
            }
            if (newCount > 0) {
                const newRowSelection = this.lockedRows.filter((row) => row.minMonsterLevel <= monsterLevel);
                newCount = Math.min(newCount, newRowSelection.length);
                const newRows = getExclusiveRandomArrayElements(newRowSelection, newCount);
                newRows.forEach((row) => {
                    this.selectedUnlockRows.set(row.effect, row);
                });
                if (newRows.size > 0)
                    this.game.combat.enemy.on('effectRemoved', this.effectRemovalHandler);
                rows.push(...newRows);
            }
        }
        const unlockedCount = Math.min(count - newCount, this.unlockedRows.length);
        rows.push(...getExclusiveRandomArrayElements(this.unlockedRows, unlockedCount));
        return rows.map((row) => {
            const applicator = new SingleCombatEffectApplicator(row.effect);
            applicator.baseChance = 100;
            return applicator;
        });
    }
    unlockRow(row) {
        const index = this.lockedRows.findIndex((r) => r === row);
        if (index === -1)
            return;
        this.lockedRows.splice(index, 1);
        this.unlockedRows.push(row);
        row.isUnlocked = true;
        notifyPlayer(this.corruption, getLangString('CORRUPTION_UNLOCKED'));
    }
    onEffectRemoval(e) {
        if (this.selectedUnlockRows.size === 0)
            throw new Error(`Effect Removal Handler assigned but no rows are selected for unlock`);
        const row = this.selectedUnlockRows.get(e.effect);
        if (row === undefined)
            return;
        if (this.game.combat.enemy.state === EnemyState.Dead)
            this.unlockRow(row);
        this.selectedUnlockRows.delete(e.effect);
        if (this.selectedUnlockRows.size === 0)
            this.game.combat.enemy.off('effectRemoved', this.effectRemovalHandler);
    }
    registerRows(data) {
        data.forEach((row) => {
            var _a, _b, _c;
            try {
                const effect = this.game.combatEffects.getObjectSafe(row.effectID);
                const startsUnlocked = (_a = row.startsUnlocked) !== null && _a !== void 0 ? _a : false;
                const customDescription = (_b = row.customDescription) !== null && _b !== void 0 ? _b : '';
                const langStringID = (_c = row.langStringID) !== null && _c !== void 0 ? _c : '';
                this.allRows.push({
                    effect,
                    startsUnlocked,
                    isUnlocked: startsUnlocked,
                    minMonsterLevel: row.minMonsterLevel,
                    customDescription,
                    langStringID,
                });
            } catch (e) {
                throw new DataConstructionError('CorruptionEffectTableRow', e);
            }
        });
    }
    onLoad() {
        this.allRows.forEach((row) => {
            if (row.isUnlocked)
                this.unlockedRows.push(row);
            else
                this.lockedRows.push(row);
        });
        if (this.selectedUnlockRows.size !== 0)
            this.game.combat.enemy.on('effectRemoved', this.effectRemovalHandler);
    }
    encode(writer) {
        writer.writeArray(this.allRows, (row, writer) => {
            writer.writeNamespacedObject(row.effect);
            writer.writeBoolean(row.isUnlocked);
        });
        writer.writeMap(this.selectedUnlockRows, writeNamespaced, () => {});
        return writer;
    }
    decode(reader, version) {
        const effectRowMap = new Map();
        this.allRows.forEach((row) => effectRowMap.set(row.effect, row));
        reader.getArray((reader) => {
            const effect = reader.getNamespacedObject(this.game.combatEffects);
            const isUnlocked = reader.getBoolean();
            if (typeof effect === 'string')
                return;
            const row = effectRowMap.get(effect);
            if (row === undefined)
                return;
            row.isUnlocked = isUnlocked;
        });
        if (version < 120 /* SaveVersion.CorruptionUnlocks */ ) {
            if (reader.getBoolean()) {
                const effect = reader.getNamespacedObject(this.game.combatEffects);
                if (typeof effect !== 'string') {
                    const row = effectRowMap.get(effect);
                    if (row !== undefined)
                        this.selectedUnlockRows.set(effect, row);
                }
            }
        } else {
            this.selectedUnlockRows = reader.getMap(readNamespacedReject(this.game.combatEffects), (_, key) => {
                if (key === undefined)
                    return undefined;
                return effectRowMap.get(key);
            });
        }
    }
}
class Corruption extends CombatSkill {
    constructor(namespace, game) {
        super(namespace, 'Corruption', game);
        this._media = 'assets/media/skills/corruption/corruption.png';
        this.renderQueue = new SkillRenderQueue();
        this.corruptionEffects = new CorruptionEffectTable(this.game, this);
    }
    get maxLevelCap() {
        return 1;
    }
    registerData(namespace, data) {
        super.registerData(namespace, data);
        if (data.enemyApplicator !== undefined)
            this.enemyApplicator = this.game.getCombatEffectApplicatorWithTriggerFromData(data.enemyApplicator);
        if (data.playerApplicator !== undefined)
            this.playerApplicator = this.game.getCombatEffectApplicatorWithTriggerFromData(data.playerApplicator);
        if (data.corruptionEffects !== undefined)
            this.corruptionEffects.registerRows(data.corruptionEffects);
    }
    modifyData(data) {
        super.modifyData(data);
    }
    postDataRegistration() {
        super.postDataRegistration();
        this.sortMilestones();
    }
    addProvidedStats() {
        super.addProvidedStats();
        if (this.enemyApplicator !== undefined)
            this.providedStats.combatEffects.push(this.enemyApplicator);
        if (this.isUnlocked && this.playerApplicator !== undefined)
            this.providedStats.combatEffects.push(this.playerApplicator);
    }
    incStat(stat) {
        this.game.stats.Corruption.inc(stat);
    }
    onLoad() {
        super.onLoad();
        this.corruptionEffects.onLoad();
    }
    onUnlock() {
        super.onUnlock();
        this.game.combat.renderQueue.corruptionMenus = true;
        this.computeProvidedStats(true);
    }
    encode(writer) {
        super.encode(writer);
        this.corruptionEffects.encode(writer);
        return writer;
    }
    decode(reader, version) {
        super.decode(reader, version);
        this.corruptionEffects.decode(reader, version);
    }
    shouldShowSkillInSidebar() {
        return super.shouldShowSkillInSidebar() || this.currentRealm.id === "melvorItA:Abyssal" /* RealmIDs.Abyssal */ ;
    }
}
/** Menu for browsing corruptions */
class CorruptionMenuElement extends HTMLElement {
    constructor() {
        var _a;
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('corruption-menu-template'));
        // Generate elements for each corruption effect
        this.corruptionElements = new Map((_a = game.corruption) === null || _a === void 0 ? void 0 : _a.corruptionEffects.allEffectRows.map((effect) => {
            const el = new CorruptionElementElement();
            el.className = 'col-12 col-xl-4 col-lg-6';
            el.initialize(effect);
            this._content.append(el);
            return [effect, el];
        }));
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    updateUnlockedStatus() {
        this.corruptionElements.forEach((el, effect) => {
            effect.isUnlocked ? el.setUnlocked() : el.setLocked();
        });
    }
}
window.customElements.define('corruption-menu', CorruptionMenuElement);
class CorruptionElementElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('corruption-element-template'));
        this.description = getElementFromFragment(this._content, 'description', 'span');
        this.img = getElementFromFragment(this._content, 'img', 'img');
        this.unlocked = getElementFromFragment(this._content, 'unlocked', 'span');
        this.locked = getElementFromFragment(this._content, 'locked', 'span');
        this.unlockReqs = getElementFromFragment(this._content, 'unlock-reqs', 'span');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    /** Initializes the display */
    initialize(corruptionEffect) {
        this.description.textContent =
            corruptionEffect.langStringID !== '' ?
            getLangString(corruptionEffect.langStringID) :
            corruptionEffect.customDescription;
        this.img.src = corruptionEffect.effect.media;
        this.unlockReqs.textContent = templateLangString('MENU_TEXT_CORRUPTION_UNLOCK_LEVEL', {
            level: numberWithCommas(corruptionEffect.minMonsterLevel),
        });
        corruptionEffect.isUnlocked ? this.setUnlocked() : this.setLocked();
    }
    setLocked() {
        hideElement(this.unlocked);
        showElement(this.locked);
        showElement(this.unlockReqs);
        hideElement(this.description);
    }
    setUnlocked() {
        hideElement(this.locked);
        showElement(this.unlocked);
        hideElement(this.unlockReqs);
        showElement(this.description);
    }
}
window.customElements.define('corruption-element', CorruptionElementElement);
//# sourceMappingURL=corruption.js.map
checkFileVersion('?12097')