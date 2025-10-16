"use strict";
class Pet extends NamespacedObject {
    constructor(namespace, data, game) {
        super(namespace, data.id);
        this.realms = new Set();
        try {
            this._name = data.name;
            this._media = data.media;
            this._hint = data.hint;
            if (data.langHint !== undefined)
                this._langHint = data.langHint;
            if (data.skillID !== undefined) {
                this.skill = game.skills.getObjectSafe(data.skillID);
            }
            this.ignoreCompletion = data.ignoreCompletion;
            this.stats = new StatObject(data, game, `${Pet.name} with id "${this.id}"`);
            this.activeInRaid = data.activeInRaid;
            if (data.patreonName !== undefined)
                this._patreonName = data.patreonName;
            if (data.langCustomDescription !== undefined)
                this._langCustomDescription = data.langCustomDescription;
            this.scaleChanceWithMasteryPool = data.scaleChanceWithMasteryPool;
            if (data.realms !== undefined) {
                data.realms.forEach((realmID) => {
                    const realm = game.realms.getObjectSafe(realmID);
                    if (realm !== undefined)
                        this.realms.add(realm);
                });
            }
        } catch (e) {
            throw new DataConstructionError(Pet.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`PET_NAME_${this.localID}`);
        }
    }
    get media() {
        return this.getMediaURL(this._media);
    }
    get acquiredBy() {
        if (this.isModded && this._hint !== undefined) {
            return this._hint;
        } else if (this._langHint !== undefined) {
            return getLangString(this._langHint);
        }
        if (this.skill !== undefined)
            return this.skill.name;
        return 'Error: No Hint.';
    }
    get description() {
        const descriptionLines = [];
        if (!this.isModded && this._patreonName !== undefined) {
            descriptionLines.push(`<small>${getLangString('MISC_STRING_1')} ${this._patreonName}</small>`);
        }
        descriptionLines.push(this.acquiredBy);
        const modDesc = this.stats.describePlain();
        if (modDesc !== '')
            descriptionLines.push(modDesc);
        if (this.isModded && this._customDescription !== undefined) {
            descriptionLines.push(this._customDescription);
        }
        if (this._langCustomDescription !== undefined) {
            descriptionLines.push(getLangString(this._langCustomDescription));
        }
        return descriptionLines.join('<br>');
    }
    applyDataModification(data, game) {
        try {
            this.stats.applyDataModification(data, game);
        } catch (e) {
            throw new DataModificationError(Pet.name, e, this.id);
        }
    }
    isCorrectRealmForPetDrop(realm) {
        return this.realms.size === 0 || this.realms.has(realm);
    }
}
class DummyPet extends Pet {
    constructor(namespace, id, game) {
        super(namespace, {
            id,
            name: '',
            media: "assets/media/main/question.png" /* Assets.QuestionMark */ ,
            scaleChanceWithMasteryPool: false,
            ignoreCompletion: true,
            modifiers: {},
            activeInRaid: false,
        }, game);
    }
}
class PetManager extends StatProvider {
    constructor(game) {
        super();
        this.game = game;
        this.raidStats = new StatProvider();
        this.unlocked = new Set();
    }
    onLoad() {
        this.computeProvidedStats(false);
    }
    isPetUnlocked(pet) {
        return this.unlocked.has(pet);
    }
    /** Rolls to unlock a pet with a fixed percentage chance */
    rollForPet(chance) {
        if (this.unlocked.has(chance.pet))
            return;
        if (rollPercentage(100 / chance.weight))
            this.unlockPet(chance.pet);
    }
    /** Rolls to unlock a skill pet */
    rollForSkillPet(pet, actionInterval, forceSkill) {
        if (this.unlocked.has(pet))
            return;
        if (forceSkill === undefined)
            forceSkill = pet.skill;
        if (forceSkill === undefined)
            return;
        let virtualLevel = 0;
        switch (forceSkill.id) {
            case "melvorItA:Harvesting" /* SkillIDs.Harvesting */ :
            case "melvorItA:Corruption" /* SkillIDs.Corruption */ :
                virtualLevel = forceSkill.abyssalLevel;
                break;
            default:
                virtualLevel = forceSkill.virtualLevel;
                break;
        }
        let chanceForPet = 0;
        if (pet.id !== "melvorD:LarryTheLonelyLizard" /* PetIDs.LarryTheLonelyLizard */ )
            chanceForPet =
            (((actionInterval / 1000) * virtualLevel) / 250000) * (1 + this.game.modifiers.skillPetLocationChance / 100);
        else
            chanceForPet =
            ((actionInterval * virtualLevel) / 25000000) * (1 + this.game.modifiers.skillPetLocationChance / 100);
        if (rollPercentage(chanceForPet))
            this.unlockPet(pet);
    }
    /** Unlocks a pet, if it wasn't already unlocked */
    unlockPet(pet) {
        if (this.unlocked.has(pet))
            return;
        this.unlocked.add(pet);
        this.game.completion.updatePet(pet);
        this.computeProvidedStats();
        this.firePetUnlockModal(pet);
    }
    /**
     * @description Attempts to unlock a pet with the given id. Throws an error if the pet is not registered.
     * @param petID
     */
    unlockPetByID(petID) {
        const pet = this.game.pets.getObjectByID(petID);
        if (pet === undefined)
            throw new Error(`Error unlocking pet. Pet with id: ${petID} is not registered.`);
        this.unlockPet(pet);
    }
    /**
     * @description Callback function for petting a pet
     * @param pet The pet to pet
     */
    petPet(pet) {
        imageNotify(pet.media, templateLangString('COMPLETION_LOG_PETS_Pet', {
            petName: pet.name
        }), 'success');
        if (pet.id === "melvorD:CoolRock" /* PetIDs.CoolRock */ )
            this.game.combat.player.pets++;
    }
    firePetUnlockModal(pet) {
        addModalToQueue({
            title: getLangString('COMPLETION_LOG_PETS_UNLOCKED'),
            html: `<span class="text-success">${pet.name}</span><br><small class="text-info">${pet.description}</small><div class='h5 font-w300 font-size-sm pt-4 mb-0 text-warning'><em>${getLangString('COMPLETION_LOG_PETS_MISC')}</em></div>`,
            imageUrl: pet.media,
            imageWidth: 128,
            imageHeight: 128,
            imageAlt: pet.name,
        });
    }
    computeProvidedStats(updatePlayers = true) {
        this.reset();
        this.raidStats.reset();
        this.unlocked.forEach((pet) => {
            if (pet.activeInRaid) {
                this.raidStats.addStatObject(pet, pet.stats);
            } else {
                this.addStatObject(pet, pet.stats);
            }
        });
        if (updatePlayers) {
            this.game.combat.computeAllStats();
            this.game.golbinRaid.computeAllStats();
        }
    }
    encode(writer) {
        writer.writeSet(this.unlocked, writeNamespaced);
        return writer;
    }
    decode(reader, version) {
        this.unlocked = reader.getSet((reader) => {
            const pet = reader.getNamespacedObject(this.game.pets);
            if (typeof pet === 'string') {
                if (pet.startsWith('melvor'))
                    return this.game.pets.getDummyObject(pet, DummyPet, this.game);
                else
                    return undefined;
            } else
                return pet;
        });
    }
    convertFromOldFormat(save, idMap) {
        if (save.petUnlocked !== undefined) {
            save.petUnlocked.forEach((isUnlocked, oldPetID) => {
                if (!isUnlocked)
                    return;
                const newID = idMap.pets[oldPetID];
                let pet = this.game.pets.getObjectByID(newID);
                if (pet === undefined)
                    pet = this.game.pets.getDummyObject(newID, DummyPet, this.game);
                this.unlocked.add(pet);
            });
        }
    }
}
//# sourceMappingURL=pets.js.map
checkFileVersion('?12097')