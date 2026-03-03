const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString, templateRielkLangStringWithNodes } = await loadModule('src/language/translationManager.mjs');
class FixtureCompletionRequirement extends GameRequirement {
    constructor(data, game) {
        super(game);
        this.type = 'Fixture';
        try {
            this.fixture = this.game.construction.fixtures.getObjectSafe(data.fixtureID);
            this.tier = data.tier;
        } catch (e) {
            console.error('[FixtureRequirement] Constructor failed:', e);
            throw new DataConstructionError(FixtureCompletionRequirement.name, e);
        }
    }

    isMet() {
        const result = this.fixture.currentTier >= this.tier;

        return result;
    }

    _assignHandler(handler) {
        this.fixture.on('tierChanged', (...args) => {
            handler(...args);
        });
    }

    _unassignHandler(handler) {
        this.fixture.off('tierChanged', handler);
    }

    notifyFailure() {
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

        return templateRielkLangStringWithNodes(
            'MENU_TEXT_REQUIRES_FIXTURE_TIER',
            { fixtureImage: this.createImage(this.fixture.media, imageClass) },
            { tier: `${this.tier}`, fixtureName: this.fixture.name }
        );
    }
}
export function addFixtureRequirement() {
    const orig = game.getRequirementFromData;


    game.getRequirementFromData = function (data) {

        if (data.type === 'FixtureCompletion') {
            return new FixtureCompletionRequirement(data, this);
        }

        return orig.call(this, data);
    };
}