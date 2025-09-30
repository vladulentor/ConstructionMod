export function patchMasteryElement(ctx){
ctx.patch(MasteryCompletionElement, 'setSkill').before(function(skill) {
    console.log(skill);
    if (skill._localID === 'Construction') {
        this.progressButton.style.display = 'none';
    }
});}