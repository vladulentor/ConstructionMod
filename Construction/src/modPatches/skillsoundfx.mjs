
function skillsoundfx(ctx){
       ctx.patch.after(() => {sfx.playSound(sXpDrop, skillname, skilltype)});
    }