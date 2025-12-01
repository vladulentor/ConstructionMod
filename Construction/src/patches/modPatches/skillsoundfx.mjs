export function skillsoundfxCompatibility(ctx){
    const skillsound = mod.api.my_melvorSoundFx;
    const sounds = {sXPDrop:ctx.getResourceUrl('assets/sounds/planks.wav')}
   skillsound.registerSkillSounds(game.construction.name, sounds);
}