const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangStringWithNodes } = await loadModule('src/language/translationManager.mjs');
class FixtureCompletionRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'Fixture';

        console.log('[FixtureRequirement] Constructing with data:', data);

        try {
            this.fixture = this.game.construction.fixtures.getObjectSafe(data.fixtureID);
            this.tier = data.tier;

            console.log(
                `[FixtureRequirement] Bound to fixture "${this.fixture?.name}" (ID: ${data.fixtureID}), required tier: ${this.tier}`
            );
        } catch (e) {
            console.error('[FixtureRequirement] Constructor failed:', e);
            throw new DataConstructionError(FixtureCompletionRequirement.name, e);
        }
    }

    isMet() {
        const result = this.fixture.currentTier >= this.tier;

        console.log(
            `[FixtureRequirement] isMet() → ${result} | current: ${this.fixture.currentTier}, required: ${this.tier}`
        );

        return result;
    }

    _assignHandler(handler) {
        console.log(
            `[FixtureRequirement] Assigning handler to ${this.fixture.name} (tierChanged)`
        );
        this.fixture.on('tierChanged', (...args) => {
            console.log('[FixtureRequirement] tierChanged event fired:', args);
            handler(...args);
        });
    }

    _unassignHandler(handler) {
        console.log(
            `[FixtureRequirement] Unassigning handler from ${this.fixture.name}`
        );
        this.fixture.off('tierChanged', handler);
    }

    notifyFailure() {
        console.log('[FixtureRequirement] notifyFailure triggered');

        notifyPlayer(
            this.fixture,
            getRielkLangString('TOASTS_FIXTURE_TIER_REQUIRED', {
                fixtureName: this.fixture.name,
                tier: `${this.tier}`
            }),
            'danger'
        );
    }

    getNodes(imageClass) {
        console.log('[FixtureRequirement] getNodes called');

        return templateRielkLangStringWithNodes(
            'MENU_TEXT_REQUIRES_FIXTURE_TIER',
            { fixtureImage: this.createImage(this.fixture.media, imageClass) },
            { tier: `${this.tier}`, fixtureName: this.fixture.name }
        );
    }
}
export function addFixtureRequirement() {
    const orig = game.getRequirementFromData;

    console.log('[FixtureRequirement] Injecting into getRequirementFromData');

    game.getRequirementFromData = function (data) {
        console.log('[FixtureRequirement] getRequirementFromData called with:', data);

        if (data.type === 'FixtureCompletion') {
            console.log('[FixtureRequirement] Creating FixtureCompletionRequirement');
            return new FixtureCompletionRequirement(data, this);
        }

        return orig.call(this, data);
    };
}