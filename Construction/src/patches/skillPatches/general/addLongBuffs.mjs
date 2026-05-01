
export function addLongBuffs({ patch }) {
    patch(GatheringSkill, "start").after(function (isST) {
        if (isST && game.construction.extSaveData.longSkill !== this.id) {
            game.construction.extSaveData.longSkill = this.id;
            game.construction.extSaveData.longSkillBuffs = 0;
            game.construction.setLongSkillBuffs();
            game.construction.startFTimer();

        }
    })
    patch(BaseManager, "startFight").before(function () {
        game.construction.extSaveData.longSkill = "";
        game.construction.extSaveData.longSkillBuffs = 0;
        game.construction.setLongSkillBuffs();
        game.construction.startFTimer();
    });
}
export function activateLongBuffs() {
    game.construction.extSaveData.longSkill = game.activeAction ? game.activeAction.id : "";
    game.construction.setLongSkillBuffs();
    game.construction.startFTimer();

}