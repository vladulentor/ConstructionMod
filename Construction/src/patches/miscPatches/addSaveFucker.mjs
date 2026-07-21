export function addSaveFucker() {

        //Hyper mega grimy emergency save file fix
    const originalTrigger = mod.trigger.interfaceAvailable;
    mod.trigger.interfaceAvailable = async function () {
        const isMasterLoaded = mod.manager ? mod.manager.getLoadedModList().includes("Weapon Types × Mastery") : false;
        if (!isMasterLoaded) {
            console.error("Master mod missing! Aborting interface load to protect save data.");

            alert("You do not have 'Weapon Types × Mastery' downloaded, normally this would delete your Construction save. But to not lose your progress I will instead reload melvor");

            window.location.reload();
            return;
        }

        return await originalTrigger.apply(this, arguments); // For people who fat finger it
    }

}