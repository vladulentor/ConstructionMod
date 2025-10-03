//const { loadModule } = mod.getContext(import.meta);

//const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function patchMasteryElement(ctx) {
    ctx.patch(MasteryCompletionElement, 'setSkill').before(function (skill) {
        if (skill._localID === 'Construction') {
            this.progressButton.style.display = 'none';
       //     console.log(this._content);
         //   console.log(this._content.querySelector('h5 span:nth-child(2)'));
           // const mastery = this._content.querySelector('h5 span:nth-child(2)');
            //if (mastery) {
                // Remove "MXP" but keep the number and parentheses
              //  mastery.textContent = mastery.textContent.replace(' MXp', getRielkLangString('MENU_FIXTURES'));
            //}
        }
    });
}