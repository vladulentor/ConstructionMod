"use strict";
class SpecialAttack extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.canNormalAttack = false;
        /** Damage dealt by attack */
        this.damage = [];
        /** Effects of attack before it hits*/
        this.prehitEffects = [];
        /** Efects of attack when it hits */
        this.onhitEffects = [];
        /** Attack consumes Runes per hit */
        this.usesRunesPerProc = false;
        /** Attack consumes Prayer Points per hit */
        this.usesPrayerPointsPerProc = false;
        /** Attack consumes Potion Charges per hit */
        this.usesPotionChargesPerProc = false;
        /** Attack is considered to be dragonbreath */
        this.isDragonbreath = false;
        this.minAccuracy = -Infinity;
        try {
            this.defaultChance = data.defaultChance;
            this.damage = constructDamageFromData(data.damage);
            this.cantMiss = data.cantMiss;
            if (data.canNormalAttack)
                this.canNormalAttack = true;
            this.attackCount = data.attackCount;
            this.attackInterval = data.attackInterval;
            this.lifesteal = data.lifesteal;
            if (data.usesRunesPerProc !== undefined)
                this.usesRunesPerProc = data.usesRunesPerProc;
            if (data.usesPrayerPointsPerProc !== undefined)
                this.usesPrayerPointsPerProc = data.usesPrayerPointsPerProc;
            if (data.usesPotionChargesPerProc !== undefined)
                this.usesPotionChargesPerProc = data.usesPotionChargesPerProc;
            if (data.attackTypes !== undefined) {
                this.attackTypes = new Set(data.attackTypes);
            }
            if (data.isDragonbreath !== undefined)
                this.isDragonbreath = data.isDragonbreath;
            if (data.minAccuracy !== undefined)
                this.minAccuracy = data.minAccuracy;
            this.descriptionGenerator = data.descriptionGenerator;
            this._name = data.name;
            this._description = data.description;
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(SpecialAttack.name, e, this.id);
        }
    }
    /** Localized name of the attack */
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`SPECIAL_ATTACK_NAME_${this.localID}`);
        }
    }
    get englishName() {
        return this._name;
    }
    get englishDescription() {
        return this._description;
    }
    /** Localized description of the attack */
    get description() {
        let stringTemplate;
        if (this.isModded) {
            stringTemplate = this._description;
        } else {
            stringTemplate = getLangString(`SPECIAL_ATTACK_${this.localID}`);
        }
        return templateString(stringTemplate, this.descriptionTemplateData);
    }
    get modifiedDescription() {
        if (this._modifiedDescription !== undefined)
            return this._modifiedDescription;
        this._modifiedDescription = applyDescriptionModifications(this.description);
        return this._modifiedDescription;
    }
    get descriptionTemplateData() {
        const templateData = {};
        templateData.hitCount = `${this.attackCount}`;
        templateData.interval = `${this.attackInterval / 1000}`;
        templateData.duration = `${((this.attackCount - 1) * this.attackInterval) / 1000}`;
        templateData.lifesteal = `${this.lifesteal}`;
        addDamageTemplateData(templateData, this.damage, 'attack');
        this.onhitEffects.forEach((applicator, i) => {
            addEffectApplicatorTemplateData(templateData, applicator, false, i);
        });
        this.prehitEffects.forEach((applicator, i) => {
            addEffectApplicatorTemplateData(templateData, applicator, true, i);
        });
        return templateData;
    }
    registerSoftDependencies(data, game) {
        try {
            this.prehitEffects = game.getCombatEffectApplicatorsFromData(data.prehitEffects);
            this.onhitEffects = game.getCombatEffectApplicatorsFromData(data.onhitEffects);
            if (data.consumesEffect !== undefined) {
                const consumes = data.consumesEffect;
                const effect = game.combatEffects.getObjectSafe(consumes.effectID);
                if (effect.parameters[consumes.paramName] === undefined)
                    throw new Error(`Attack defines effect consumption refering to parameter: ${consumes.paramName}, but parameter does not exist on CombatEffect.`);
                this.consumesEffect = {
                    effect,
                    paramName: consumes.paramName
                };
            }
            if (data.extraRuneConsumption !== undefined)
                this.extraRuneConsumption = game.items.runes.getQuantities(data.extraRuneConsumption);
        } catch (e) {
            throw new DataConstructionError(SpecialAttack.name, e, this.id);
        }
    }
}

function constructDamageFromData(data) {
    return data.map((damageData) => {
        switch (damageData.damageType) {
            case 'Normal':
                return new NormalDamage(damageData.amplitude, damageData.attackCount);
            case 'Custom':
                return damageData;
            default:
                throw new Error('Invalid damage data type.');
        }
    });
}
//# sourceMappingURL=attacks2.js.map
checkFileVersion('?12097')