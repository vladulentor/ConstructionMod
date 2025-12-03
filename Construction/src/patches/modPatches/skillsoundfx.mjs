export function skillsoundfxCompatibility({getResourceUrl}){
    const skillsound = mod.api.psy_melvorSoundFx;
    const sounds = {sXPDrop:getResourceUrl('assets/sounds/planks.mp3'), sLevel:getResourceUrl('assets/sounds/level_up.ogg')}
   skillsound.registerSkillSounds(game.construction.name, sounds);
}