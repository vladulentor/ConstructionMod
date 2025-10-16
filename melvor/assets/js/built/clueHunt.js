"use strict";
class ClueHunt {
    constructor() {
        this.ifYouAreReadingThisCodeThenYouAreRuiningTheFunForEveryoneAndYouShouldBeAshamedOfYourself = true;
        this.clueProgress = [{
                id: 'melvorD:Plant',
                progress: 0,
                required: 5,
                complete: false,
                rewardItemID: 'melvorF:Clue_Scroll_2',
            },
            {
                progress: 0,
                required: 1,
                complete: false,
                rewardItemID: 'melvorF:Clue_Scroll_3',
            },
            {
                progress: 0,
                required: 10,
                monsterID: 'melvorD:Chicken',
                equippedFoodItemId: 'melvorD:Bread',
                complete: false,
                rewardItemID: 'melvorF:Clue_Scroll_4',
            },
            {
                progress: 0,
                required: 1,
                monsterID: 'melvorF:WanderingBard',
                prayerID: 'melvorF:Sharp_Eye',
                equippedItems: ['melvorD:Amulet_of_Looting', 'melvorF:Almighty_Lute'],
                complete: false,
                rewardItemID: 'melvorF:Clue_Scroll_5',
            },
            {
                progress: 0,
                required: 6,
                skillIDs: ['melvorD:Firemaking', 'melvorF:Astrology', 'melvorF:Agility'],
                obstacleIDs: ['melvorF:RopeSwing', 'melvorF:BalanceBeam', 'melvorF:SteppingStones', 'melvorF:GapJump'],
                complete: false,
                rewardItemID: 'melvorF:Clue_Scroll_6',
            },
            {
                progress: 0,
                required: 5,
                monsterIDs: ['melvorD:Cow', 'melvorD:BanditLeader', 'melvorD:Golbin'],
                constellationIDs: ['melvorF:Terra'],
                dungeonIDs: ['melvorD:Bandit_Base'],
                runecraftingIDs: ['melvorF:Staff_of_Water'],
                complete: false,
                rewardItemID: 'melvorD:Lemon',
            },
        ];
        this.currentStep = 0;
        this.updateClue1Progress = (event) => {
            if (this.currentStep === 1 && event instanceof MonsterKilledEvent) {
                if (game.clueHunt.clueProgress[0].id == event.monster.id) {
                    game.clueHunt.clueProgress[0].progress += 1;
                    if (game.clueHunt.clueProgress[0].progress >= game.clueHunt.clueProgress[0].required) {
                        game.clueHunt.clueProgress[0].complete = true;
                        this.giveReward(0);
                        this.clueCompletedSwal();
                        this.currentStep = 2;
                        game.combat.off('monsterKilled', this.updateClue1Progress);
                        this.updateClueEventHandlers();
                    }
                }
            }
        };
        this.updateClue2Progress = (event) => {
            if (this.currentStep === 2 &&
                event instanceof TownshipTaskCompletedEvent &&
                event.task instanceof TownshipCasualTask) {
                this.giveReward(1);
                this.clueCompletedSwal();
                this.currentStep = 3;
                game.clueHunt.clueProgress[1].complete = true;
                game.township.tasks.off('townshipTaskCompleted', this.updateClue2Progress);
                this.updateClueEventHandlers();
            }
        };
        this.updateClue3Progress = (event) => {
            if (this.currentStep === 3) {
                if (event.monster.id === game.clueHunt.clueProgress[2].monsterID &&
                    event.player.food.currentSlot.item.id === game.clueHunt.clueProgress[2].equippedFoodItemId) {
                    game.clueHunt.clueProgress[2].progress++;
                    if (game.clueHunt.clueProgress[2].progress >= game.clueHunt.clueProgress[2].required) {
                        this.giveReward(2);
                        this.clueCompletedSwal();
                        this.currentStep = 4;
                        game.clueHunt.clueProgress[2].complete = true;
                        game.combat.off('monsterKilled', this.updateClue3Progress);
                        this.updateClueEventHandlers();
                    }
                }
            }
        };
        this.updateClue4Progress = (event) => {
            if (this.currentStep === 4) {
                if (event.monster.id === game.clueHunt.clueProgress[3].monsterID &&
                    event.player.activePrayers.has(game.prayers.getObjectByID(game.clueHunt.clueProgress[3].prayerID)) &&
                    game.clueHunt.clueProgress[3].equippedItems.every((itemID) => {
                        return event.player.equipment.checkForItemID(itemID);
                    })) {
                    game.clueHunt.clueProgress[3].progress++;
                    if (game.clueHunt.clueProgress[3].progress >= game.clueHunt.clueProgress[3].required) {
                        this.giveReward(3);
                        this.clueCompletedSwal();
                        this.currentStep = 5;
                        game.clueHunt.clueProgress[3].complete = true;
                        game.combat.off('monsterKilled', this.updateClue4Progress);
                        this.updateClueEventHandlers();
                    }
                }
            }
        };
        this.updateClue5Progress = (event) => {
            var _a, _b, _c, _d;
            if (this.currentStep === 5) {
                const obIDs = this.clueProgress[4].obstacleIDs;
                switch (this.clueProgress[4].progress) {
                    case 0:
                        if (event instanceof AstrologyActionEvent) {
                            this.clueProgress[4].progress++;
                        } else {
                            this.clueProgress[4].progress = 0;
                        }
                        break;
                    case 1:
                        if (event instanceof FiremakingActionEvent) {
                            this.clueProgress[4].progress++;
                        } else {
                            this.clueProgress[4].progress = 0;
                        }
                        break;
                    case 2:
                        if (event instanceof AgilityActionEvent && event.action.id === obIDs[0]) {
                            this.clueProgress[4].progress++;
                        } else {
                            this.clueProgress[4].progress = 0;
                        }
                        break;
                    case 3:
                        if (event instanceof AgilityActionEvent && event.action.id === obIDs[1]) {
                            this.clueProgress[4].progress++;
                        } else {
                            this.clueProgress[4].progress = 0;
                        }
                        break;
                    case 4:
                        if (event instanceof AgilityActionEvent && event.action.id === obIDs[2]) {
                            this.clueProgress[4].progress++;
                        } else {
                            this.clueProgress[4].progress = 0;
                        }
                        break;
                    case 5:
                        if (event instanceof AgilityActionEvent && event.action.id === obIDs[3]) {
                            this.giveReward(4);
                            this.clueCompletedSwal();
                            this.currentStep = 6;
                            game.clueHunt.clueProgress[4].complete = true;
                            game.woodcutting.off('action', this.updateClue5Progress);
                            game.fishing.off('action', this.updateClue5Progress);
                            game.firemaking.off('action', this.updateClue5Progress);
                            game.cooking.off('action', this.updateClue5Progress);
                            game.mining.off('action', this.updateClue5Progress);
                            game.smithing.off('action', this.updateClue5Progress);
                            game.thieving.off('action', this.updateClue5Progress);
                            game.fletching.off('action', this.updateClue5Progress);
                            game.crafting.off('action', this.updateClue5Progress);
                            game.runecrafting.off('action', this.updateClue5Progress);
                            game.herblore.off('action', this.updateClue5Progress);
                            game.agility.off('action', this.updateClue5Progress);
                            game.summoning.off('action', this.updateClue5Progress);
                            game.astrology.off('action', this.updateClue5Progress);
                            game.altMagic.off('action', this.updateClue5Progress);
                            (_a = game.cartography) === null || _a === void 0 ? void 0 : _a.off('survey', this.updateClue5Progress);
                            (_b = game.cartography) === null || _b === void 0 ? void 0 : _b.off('madePaper', this.updateClue5Progress);
                            (_c = game.cartography) === null || _c === void 0 ? void 0 : _c.off('upgradeMap', this.updateClue5Progress);
                            (_d = game.archaeology) === null || _d === void 0 ? void 0 : _d.off('action', this.updateClue5Progress);
                            this.updateClueEventHandlers();
                        } else {
                            console.log('wrong action, progress reset');
                            this.clueProgress[4].progress = 0;
                        }
                        break;
                }
            }
        };
        this.updateClue6Progress = (event) => {
            var _a, _b, _c, _d, _e;
            if (this.currentStep === 6) {
                const mIDs = this.clueProgress[5].monsterIDs;
                const constellationIDs = this.clueProgress[5].constellationIDs;
                const dungeonIDs = this.clueProgress[5].dungeonIDs;
                const runecraftingIDs = this.clueProgress[5].runecraftingIDs;
                switch (this.clueProgress[5].progress) {
                    case 0:
                        if (event instanceof MonsterKilledEvent && event.monster.id === mIDs[0]) {
                            this.clueProgress[5].progress++;
                            game.renderQueue.clueHuntStep6 = true;
                        } else {
                            this.clueProgress[5].progress = 0;
                            game.renderQueue.clueHuntStep6 = true;
                        }
                        break;
                    case 1:
                        if (event instanceof AstrologyActionEvent && event.action.id === constellationIDs[0]) {
                            this.clueProgress[5].progress++;
                            game.renderQueue.clueHuntStep6 = true;
                        } else {
                            this.clueProgress[5].progress = 0;
                            game.renderQueue.clueHuntStep6 = true;
                        }
                        break;
                    case 2:
                        if (event instanceof MonsterKilledEvent && event.monster.id === mIDs[1]) {
                            this.clueProgress[5].progress++;
                            game.renderQueue.clueHuntStep6 = true;
                        } else if (((_a = game.combat.selectedArea) === null || _a === void 0 ? void 0 : _a.id) !== dungeonIDs[0]) {
                            this.clueProgress[5].progress = 0;
                            game.renderQueue.clueHuntStep6 = true;
                        }
                        break;
                    case 3:
                        if (event instanceof RunecraftingActionEvent && event.action.id === runecraftingIDs[0]) {
                            this.clueProgress[5].progress++;
                            game.renderQueue.clueHuntStep6 = true;
                        } else {
                            this.clueProgress[5].progress = 0;
                            game.renderQueue.clueHuntStep6 = true;
                        }
                        break;
                    case 4:
                        if (event instanceof MonsterKilledEvent && event.monster.id === mIDs[2]) {
                            this.clueProgress[5].progress++;
                            game.renderQueue.clueHuntStep6 = true;
                            this.giveReward(5);
                            this.clueHuntCompletedSwal();
                            this.currentStep = 7;
                            game.clueHunt.clueProgress[5].complete = true;
                            game.woodcutting.off('action', this.updateClue6Progress);
                            game.fishing.off('action', this.updateClue6Progress);
                            game.firemaking.off('action', this.updateClue6Progress);
                            game.cooking.off('action', this.updateClue6Progress);
                            game.mining.off('action', this.updateClue6Progress);
                            game.smithing.off('action', this.updateClue6Progress);
                            game.thieving.off('action', this.updateClue6Progress);
                            game.fletching.off('action', this.updateClue6Progress);
                            game.crafting.off('action', this.updateClue6Progress);
                            game.runecrafting.off('action', this.updateClue6Progress);
                            game.herblore.off('action', this.updateClue6Progress);
                            game.agility.off('action', this.updateClue6Progress);
                            game.summoning.off('action', this.updateClue6Progress);
                            game.astrology.off('action', this.updateClue6Progress);
                            game.altMagic.off('action', this.updateClue6Progress);
                            (_b = game.cartography) === null || _b === void 0 ? void 0 : _b.off('survey', this.updateClue6Progress);
                            (_c = game.cartography) === null || _c === void 0 ? void 0 : _c.off('madePaper', this.updateClue6Progress);
                            (_d = game.cartography) === null || _d === void 0 ? void 0 : _d.off('upgradeMap', this.updateClue6Progress);
                            (_e = game.archaeology) === null || _e === void 0 ? void 0 : _e.off('action', this.updateClue6Progress);
                            game.combat.off('dungeonCompleted', this.updateClue6Progress);
                            game.combat.off('monsterKilled', this.updateClue6Progress);
                            this.updateClueEventHandlers();
                            game.birthdayEvent2023CompletionTracker[0] = true;
                            game.renderQueue.birthdayEventProgress = true;
                        } else
                            this.resetClue6();
                        break;
                }
            }
        };
    }
    encode(writer) {
        writer.writeInt8(this.currentStep);
        return writer;
    }
    decode(reader, version) {
        if (version >= 71)
            this.currentStep = reader.getInt8();
    }
    onLoad() {
        if (!cloudManager.isBirthdayEvent2023Active())
            return;
        this.updateClueEventHandlers();
        if (this.currentStep === 6) {
            game.renderQueue.clueHuntStep6 = true;
        }
    }
    startClueHunt() {
        game.bank.addItemByID('melvorF:Clue_Scroll_1', 1, false, true, true, true, 'Birthday_Event_2023');
        this.currentStep = 1;
        this.updateClueEventHandlers();
    }
    clueCompletedSwal() {
        SwalLocale.fire({
            title: getLangString('CLUE_COMPLETED'),
            text: getLangString('NEXT_CLUE_IN_YOUR_BANK'),
            icon: 'success',
        });
    }
    clueHuntCompletedSwal() {
        SwalLocale.fire({
            title: getLangString('CLUE_HUNT_COMPLETED'),
            text: getLangString('GOOD_JOB'),
            icon: 'success',
        });
    }
    updateClueEventHandlers() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!cloudManager.isBirthdayEvent2023Active())
            return;
        switch (this.currentStep) {
            case 1:
                game.combat.on('monsterKilled', this.updateClue1Progress);
                break;
            case 2:
                game.township.tasks.on('townshipTaskCompleted', this.updateClue2Progress);
                break;
            case 3:
                game.combat.on('monsterKilled', this.updateClue3Progress);
                break;
            case 4:
                game.combat.on('monsterKilled', this.updateClue4Progress);
                break;
            case 5:
                //Using the function didn't work here so I've ended up just doing this for now
                game.woodcutting.on('action', this.updateClue5Progress);
                game.fishing.on('action', this.updateClue5Progress);
                game.firemaking.on('action', this.updateClue5Progress);
                game.cooking.on('action', this.updateClue5Progress);
                game.mining.on('action', this.updateClue5Progress);
                game.smithing.on('action', this.updateClue5Progress);
                game.thieving.on('action', this.updateClue5Progress);
                game.fletching.on('action', this.updateClue5Progress);
                game.crafting.on('action', this.updateClue5Progress);
                game.runecrafting.on('action', this.updateClue5Progress);
                game.herblore.on('action', this.updateClue5Progress);
                game.agility.on('action', this.updateClue5Progress);
                game.summoning.on('action', this.updateClue5Progress);
                game.astrology.on('action', this.updateClue5Progress);
                game.altMagic.on('action', this.updateClue5Progress);
                (_a = game.cartography) === null || _a === void 0 ? void 0 : _a.on('survey', this.updateClue5Progress);
                (_b = game.cartography) === null || _b === void 0 ? void 0 : _b.on('madePaper', this.updateClue5Progress);
                (_c = game.cartography) === null || _c === void 0 ? void 0 : _c.on('upgradeMap', this.updateClue5Progress);
                (_d = game.archaeology) === null || _d === void 0 ? void 0 : _d.on('action', this.updateClue5Progress);
                break;
            case 6:
                //Using the function didn't work here so I've ended up just doing this for now
                game.woodcutting.on('action', this.updateClue6Progress);
                game.fishing.on('action', this.updateClue6Progress);
                game.firemaking.on('action', this.updateClue6Progress);
                game.cooking.on('action', this.updateClue6Progress);
                game.mining.on('action', this.updateClue6Progress);
                game.smithing.on('action', this.updateClue6Progress);
                game.thieving.on('action', this.updateClue6Progress);
                game.fletching.on('action', this.updateClue6Progress);
                game.crafting.on('action', this.updateClue6Progress);
                game.runecrafting.on('action', this.updateClue6Progress);
                game.herblore.on('action', this.updateClue6Progress);
                game.agility.on('action', this.updateClue6Progress);
                game.summoning.on('action', this.updateClue6Progress);
                game.astrology.on('action', this.updateClue6Progress);
                game.altMagic.on('action', this.updateClue6Progress);
                (_e = game.cartography) === null || _e === void 0 ? void 0 : _e.on('survey', this.updateClue6Progress);
                (_f = game.cartography) === null || _f === void 0 ? void 0 : _f.on('madePaper', this.updateClue6Progress);
                (_g = game.cartography) === null || _g === void 0 ? void 0 : _g.on('upgradeMap', this.updateClue6Progress);
                (_h = game.archaeology) === null || _h === void 0 ? void 0 : _h.on('action', this.updateClue6Progress);
                game.combat.on('dungeonCompleted', game.clueHunt.updateClue6Progress);
                game.combat.on('monsterKilled', game.clueHunt.updateClue6Progress);
                this.resetClue6();
                break;
        }
    }
    giveReward(id) {
        game.bank.addItemByID(this.clueProgress[id].rewardItemID, 1, false, true, true, true, 'Birthday_Event_2023');
    }
    resetClue6() {
        this.clueProgress[5].progress = 0;
        const img = document.getElementById('monster-area-img-melvorD:Cow');
        if (img !== null) {
            img.style.transform = `scaleX(-1)`;
            img.style.webkitTransform = `scaleX(-1)`;
        }
        const img2 = document.getElementById('monster-area-img-melvorD:Golbin');
        if (img2 !== null) {
            img2.src = assets.getURI('assets/media/monsters/goblin.png');
        }
        const img3 = document.getElementById('astro-const-melvorF:Terra');
        if (img3 !== null) {
            img3.style.transform = ``;
            img3.style.webkitTransform = ``;
        }
        const img4 = document.getElementById('area-menu-img-melvorD:Bandit_Base');
        if (img4 !== null) {
            img4.style.transform = ``;
            img4.style.webkitTransform = ``;
        }
        const img5 = document.getElementById('artisan-recipe-melvorF:Staff_of_Water');
        if (img5 !== null) {
            img5.style.transform = ``;
            img5.style.webkitTransform = ``;
        }
    }
    render() {
        this.renderArtwork();
    }
    renderArtwork() {
        if (!game.renderQueue.clueHuntStep6)
            return;
        switch (this.clueProgress[5].progress) {
            case 0:
                this.resetClue6();
                break;
            case 1:
                {
                    const img1 = document.getElementById('monster-area-img-melvorD:Cow');
                    if (img1 !== null) {
                        img1.style.transform = ``;
                        img1.style.webkitTransform = ``;
                    }
                    const img2 = document.getElementById('astro-const-melvorF:Terra');
                    if (img2 !== null) {
                        img2.style.transform = `scaleY(-1)`;
                        img2.style.webkitTransform = `scaleY(-1)`;
                    }
                    break;
                }
            case 2:
                {
                    const img1 = document.getElementById('astro-const-melvorF:Terra');
                    if (img1 !== null) {
                        img1.style.transform = ``;
                        img1.style.webkitTransform = ``;
                    }
                    const img2 = document.getElementById('area-menu-img-melvorD:Bandit_Base');
                    if (img2 !== null) {
                        img2.style.transform = `scaleX(-1)`;
                        img2.style.webkitTransform = `scaleX(-1)`;
                    }
                    break;
                }
            case 3:
                {
                    const img1 = document.getElementById('area-menu-img-melvorD:Bandit_Base');
                    if (img1 !== null) {
                        img1.style.transform = ``;
                        img1.style.webkitTransform = ``;
                    }
                    const img2 = document.getElementById('artisan-recipe-melvorF:Staff_of_Water');
                    if (img2 !== null) {
                        img2.style.transform = `scaleX(-1)`;
                        img2.style.webkitTransform = `scaleX(-1)`;
                    }
                    break;
                }
            case 4:
                {
                    const img1 = document.getElementById('artisan-recipe-melvorF:Staff_of_Water');
                    if (img1 !== null) {
                        img1.style.transform = ``;
                        img1.style.webkitTransform = ``;
                    }
                    const img2 = document.getElementById('monster-area-img-melvorD:Golbin');
                    if (img2 !== null) {
                        img2.src = assets.getURI('assets/media/monsters/goblinn.png');
                    }
                    break;
                }
            case 5:
                {
                    const img2 = document.getElementById('monster-area-img-melvorD:Golbin');
                    if (img2 !== null) {
                        img2.src = assets.getURI('assets/media/monsters/goblin.png');
                    }
                    break;
                }
        }
        game.renderQueue.clueHuntStep6 = false;
    }
}
//# sourceMappingURL=clueHunt.js.map
checkFileVersion('?12097')