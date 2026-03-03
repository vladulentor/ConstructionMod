const { loadModule } = mod.getContext(import.meta);

const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function patchMasteryElement(ctx) {
    ctx.patch(MasteryCompletionElement, 'setSkill').before(function (skill) {
        if (skill._localID === 'Construction') {
            this.progressButton.style.display = 'none';
         //   const masteryMXP = this._content.querySelector('h5 span:nth-child(2)');
           // if (masteryMXP) {
                // Remove "MXP" but keep the number and parentheses (if this is the )
             //   masteryMXP.textContent = masteryMXP.textContent.replace(' MXp)', `${getRielkLangString('MENU_FIXTURES')})`);
            //}
            //else {
              //  const firstSpan = this._content.querySelector('h5 span:nth-child(1)');
                //if (firstSpan) {
                  //  firstSpan.textContent = `${firstSpan.textContent} (${getRielkLangString('MENU_FIXTURES')})`;
               // }
            //}
        }
    });
}