"use strict";
const gameVersion = 'v1.3.1';
const previousGameVersion = 'v1.3';
const characterSelectAnnouncementVersion = 4;
/** Locks/Unlocks Base Game skills based on full version entitlement */
const setupSkillLock = (game) => {
    if (!game.tutorial.complete || game.currentGamemode.startingSkills !== undefined)
        return;
    game.skills.forEach((skill) => {
        if (skill.unlockRequirements.length === 0)
            skill.setUnlock(cloudManager.hasFullVersionEntitlement || isDemoSkill(skill));
        else
            skill.setUnlock(game.checkRequirements(skill.unlockRequirements));
    });
};
/** Callback function for the "Change Character Name" button in the account menu */
function showUsernameChange() {
    //Show the username change screen
    $('#modal-account-change').modal('show');
}
/** Callback function for changing the character name */
function changeName() {
    let newName = document.getElementById('username-change').value;
    if (newName === '')
        newName = getLangString('CHARACTER_SELECT_75');
    game.characterName = newName;
    $('#account-name').text(newName);
    game.stats.General.inc(GeneralStats.UsernameChanges);
}
/** Callback function for the "Delete Character" button on the Settings page */
function accountDeletion(confirmation = false) {
    if (inCharacterSelection)
        return;
    if (!confirmation && confirmedLoaded) {
        $('#modal-account-deletion').modal('show');
    } else {
        deleteLocalSaveInSlot();
        window.setTimeout(function() {
            location.reload();
        }, 1000);
    }
}
/** Notifies the player if the game has updated, if they last loaded the game on an older version */
function gameUpdate() {
    if (gameVersion !== game.lastLoadedGameVersion) {
        let html = getLangString('CHARACTER_SELECT_74');
        if (setLang === 'en') {
            html += `<br><br><a class="pointer-enabled" onclick="openLink('https://news.melvoridle.com');">View Changelog (External Link)</a>`;
        }
        addModalToQueue({
            title: gameVersion,
            html: html,
            imageUrl: assets.getURI('assets/media/main/logo_no_text.png'),
            imageWidth: 128,
            imageHeight: 128,
            imageAlt: 'Melvor Idle',
        });
    }
    game.lastLoadedGameVersion = gameVersion;
}
//# sourceMappingURL=account.js.map
checkFileVersion('?12097')