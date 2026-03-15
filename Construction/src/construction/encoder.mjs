const { onCharacterLoaded } = mod.getContext(import.meta);
const BIG_UPDATE_NUMBER = 8;
export class Encoder {
    static encode(construction, writer) {
        const _constructionVersion = 9;
        writer.writeUint32(_constructionVersion);
        writer.writeBoolean(construction.extSaveData.showUpdateTooltip);

        writer.writeBoolean(game.firemaking.isRoaringBonfire);
        writer.writeSet(construction.hiddenRooms, writeNamespaced);
        writer.writeBoolean(construction.extSaveData.hasStudiedDiagram)
        construction.stats.encode(writer);
        writer.writeArray(construction.fixtures.allObjects, (fixture, writer) => {
            writer.writeNamespacedObject(fixture);
            writer.writeUint32(fixture.currentTier);
            writer.writeUint32(fixture.progress);
        });
        writer.writeUint8(construction._actionMode);
        if (construction._actionMode == 1) {
            writer.writeNamespacedObject(construction.selectedRoom);
            writer.writeNamespacedObject(construction.selectedFixture);
            writer.writeNamespacedObject(construction.selectedFixtureRecipe);
        }
        writer.writeArray(construction.tierMasteries.allObjects, (tier, writer) => {
            writer.writeNamespacedObject(tier);
            writer.writeBoolean(tier.completed);
        })
    }

    static decode(construction, reader) {
        const _constructionVersion = reader.getUint32();

        if (_constructionVersion >= BIG_UPDATE_NUMBER) { //If the player has loaded the big update before, remember their state to the tooltip, otherwise make it true.
            construction.extSaveData.showUpdateTooltip = reader.getBoolean();
        }
        else if (_constructionVersion >= 6) {
            reader.getBoolean();
            construction.extSaveData.showUpdateTooltip = true;
        }
        if (_constructionVersion >= 7)
            game.firemaking.isRoaringBonfire = reader.getBoolean();
        else
            game.firemaking.isRoaringFire = false;
        construction.hiddenRooms = reader.getSet(readNamespacedReject(construction.rooms));
        if (_constructionVersion >= 9)
            construction.extSaveData.hasStudiedDiagram = reader.getBoolean();
        construction.stats.decode(reader);
        const readFixture = readNamespacedReject(construction.fixtures);
        reader.getArray((reader) => {
            const fixture = readFixture(reader) ?? {};
            fixture.currentTier = reader.getUint32();
            fixture.progress = reader.getUint32();
        });
        construction._actionMode = reader.getUint8();
        if (construction._actionMode == 1) {
            const room = reader.getNamespacedObject(construction.rooms);
            if (typeof room === 'string')
                construction.shouldResetAction = true;
            else
                construction.selectedRoom = room;
            const fixture = reader.getNamespacedObject(construction.fixtures);
            if (typeof fixture === 'string')
                construction.shouldResetAction = true;
            else
                construction.selectedFixture = fixture;
            const fixtureRecipe = reader.getNamespacedObject(construction.actions);
            if (typeof fixtureRecipe === 'string')
                construction.shouldResetAction = true;
            else
                construction.selectedFixtureRecipe = fixtureRecipe;
        }
        if (_constructionVersion >= 5) {
            const readTierMastered = readNamespacedReject(construction.tierMasteries);
            reader.getArray((reader) => {
                const tier = readTierMastered(reader);
                tier.completed = reader.getBoolean();
            })
        }


        if (_constructionVersion < 4)
            onCharacterLoaded(() => construction.updateForExistingCapIncreases());

        if (construction.shouldResetAction)
            construction.resetActionState();

    }
}
