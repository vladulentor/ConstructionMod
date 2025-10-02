const { onCharacterLoaded } = mod.getContext(import.meta);

export class Encoder {
    static encode(construction, writer) {
        const _constructionVersion = 4;
        writer.writeUint32(_constructionVersion);
        writer.writeSet(construction.hiddenRooms, writeNamespaced);
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
    }

    static decode(construction, reader) {
        const _constructionVersion = reader.getUint32();

        construction.hiddenRooms = reader.getSet(readNamespacedReject(construction.rooms));
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

        if (_constructionVersion < 4)
            onCharacterLoaded(() => construction.updateForExistingCapIncreases());

        if (construction.shouldResetAction)
            construction.resetActionState();
    }
}
