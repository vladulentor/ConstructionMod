"use strict";
class Telemetry {
    constructor() {
        this.ENABLE_TELEMETRY = true;
        this.TELEMETRY_FIRE_EVENT_LIMIT_IN_SECONDS = 1;
        this.LOG_EVENTS_TO_CONSOLE = false;
        this.lastTelemetryEventFire = 0;
        this.shouldFireTelemetry = false;
        this.enableTelemetryFromCloud = true;
        this.telemetryPayloadsToProcess = new Map();
        this.setEnableTelemetryFromCloud = function() {
            PlayFabClientSDK.GetTitleData({
                Keys: ['enableTelemetryFromCloud']
            }, function(result) {
                if (result.data.Data !== undefined && result.data.Data.enableTelemetryFromCloud !== undefined) {
                    const value = result.data.Data.enableTelemetryFromCloud == 'true';
                    game.telemetry.enableTelemetryFromCloud = value;
                }
            });
        };
    }
    get isTelemetryEnabled() {
        return this.ENABLE_TELEMETRY && PlayFabClientSDK.IsClientLoggedIn() && this.enableTelemetryFromCloud;
    }
    get entitlementStatus() {
        return [
            cloudManager.hasFullVersionEntitlement,
            cloudManager.hasTotHEntitlement,
            cloudManager.hasAoDEntitlement,
            cloudManager.hasItAEntitlement,
        ];
    }
    /** Create a new Monster kill telemetry event.
     * Will automatically update the count if this event is already queued to process.
     * @param monster The monster that was killed
     * @param count The number of monsters killed. Defaults to 1. Override for offline session.
     */
    createMonsterKillEvent(monster, count = 1) {
        if (!this.isTelemetryEnabled)
            return;
        const existingEvent = this.getExistingTelemetryEvent('monster_killed', monster.id);
        const eventData = existingEvent !== undefined ? existingEvent : new MonsterKilledTelemetryEvent(monster, count);
        if (existingEvent !== undefined &&
            existingEvent instanceof MonsterKilledTelemetryEvent &&
            eventData instanceof MonsterKilledTelemetryEvent) {
            eventData.count += count;
        }
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating monster kill telemetry event', eventData);
        this.scheduleTelemetryEvent('monster_killed', monster.id, eventData);
    }
    /** Create a new player death event
     * Will automatically update the count if this event is already queued to process.
     * This one should always send immediately.
     * @param cause The cause of the player's death. Defaults to 'Unknown'.
     * @param itemLost The item that was lost when the player died. Defaults to 'None'.
     */
    createPlayerDeathEvent(cause = 'Unknown', itemLost = 'None') {
        if (!this.isTelemetryEnabled)
            return;
        const existingEvent = this.getExistingTelemetryEvent('player_death', 'player_death');
        const eventData = existingEvent !== undefined ? existingEvent : new PlayerDeathTelemetryEvent(cause, itemLost);
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating player death telemetry event', eventData);
        this.scheduleTelemetryEvent('player_death', 'player_death', eventData);
    }
    /** Updates existing Player Death event with Item Lost data
     * @param itemLost The item that was lost when the player died.
     * @param count The number of items lost. Defaults to 0.
     */
    updatePlayerDeathEventItemLost(itemLost, count = 0) {
        const deathEvent = this.getExistingTelemetryEvent('player_death', 'player_death');
        if (deathEvent === undefined)
            return;
        if (deathEvent instanceof PlayerDeathTelemetryEvent) {
            deathEvent.setItemLost(itemLost, count);
            this.scheduleTelemetryEvent('player_death', 'player_death', deathEvent);
        }
    }
    /** Updates existing Player Death event with the cause
     * @param cause The cause of the player's death.
     */
    updatePlayerDeathEventCause(cause) {
        const deathEvent = this.getExistingTelemetryEvent('player_death', 'player_death');
        if (deathEvent === undefined)
            return;
        if (deathEvent instanceof PlayerDeathTelemetryEvent) {
            deathEvent.setCause(cause);
            this.scheduleTelemetryEvent('player_death', 'player_death', deathEvent);
        }
    }
    /** Create a new offline xp gained event
     * @param skill The skill that gained xp
     */
    createOfflineXPGainEvent(skill, offlineTime, xpBefore, xpAfter, levelBefore, levelAfter) {
        if (!this.isTelemetryEnabled)
            return;
        const existingEvent = this.getExistingTelemetryEvent('offline_xp_gain', skill.id);
        const eventData = existingEvent !== undefined ?
            existingEvent :
            new OfflineXPGainTelemetryEvent(skill, offlineTime, xpBefore, xpAfter, levelBefore, levelAfter);
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating offline skill XP telemetry event', eventData);
        this.scheduleTelemetryEvent('offline_xp_gain', skill.id, eventData);
    }
    /** Create a new offline xp gained event
     * @param skill The skill that gained xp
     */
    createOfflineAXPGainEvent(skill, offlineTime, xpBefore, xpAfter, levelBefore, levelAfter) {
        if (!this.isTelemetryEnabled)
            return;
        const existingEvent = this.getExistingTelemetryEvent('offline_abyssal_xp_gain', skill.id);
        const eventData = existingEvent !== undefined ?
            existingEvent :
            new OfflineAXPGainTelemetryEvent(skill, offlineTime, xpBefore, xpAfter, levelBefore, levelAfter);
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating offline abyssal skill XP telemetry event', eventData);
        this.scheduleTelemetryEvent('offline_abyssal_xp_gain', skill.id, eventData);
    }
    /** Create a new online xp gained event.
     * Updates an existing event if it already exists
     */
    createOnlineXPGainEvent(skill, onlineTime, xpBefore, xpAfter, levelBefore, levelAfter) {
        if (!this.isTelemetryEnabled || loadingOfflineProgress || game.currentGamemode.isEvent)
            return;
        const existingEvent = this.getExistingTelemetryEvent('online_xp_gain', skill.id);
        const eventData = existingEvent !== undefined ?
            existingEvent :
            new OnlineXPGainTelemetryEvent(skill, onlineTime, xpBefore, xpAfter, levelBefore, levelAfter);
        if (existingEvent !== undefined &&
            existingEvent instanceof OnlineXPGainTelemetryEvent &&
            eventData instanceof OnlineXPGainTelemetryEvent) {
            eventData.updateValues(levelAfter, xpAfter, onlineTime);
        }
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating online_xp_gain telemetry event', eventData);
        this.scheduleTelemetryEvent('online_xp_gain', skill.id, eventData);
    }
    /** Create a new online abyssal xp gained event.
     * Updates an existing event if it already exists
     */
    createOnlineAXPGainEvent(skill, onlineTime, xpBefore, xpAfter, levelBefore, levelAfter) {
        if (!this.isTelemetryEnabled || loadingOfflineProgress || game.currentGamemode.isEvent)
            return;
        const existingEvent = this.getExistingTelemetryEvent('online_abyssal_xp_gain', skill.id);
        const eventData = existingEvent !== undefined ?
            existingEvent :
            new OnlineAXPGainTelemetryEvent(skill, onlineTime, xpBefore, xpAfter, levelBefore, levelAfter);
        if (existingEvent !== undefined &&
            existingEvent instanceof OnlineAXPGainTelemetryEvent &&
            eventData instanceof OnlineAXPGainTelemetryEvent) {
            eventData.updateValues(levelAfter, xpAfter, onlineTime);
        }
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating online_abyssal_xp_gain telemetry event', eventData);
        this.scheduleTelemetryEvent('online_abyssal_xp_gain', skill.id, eventData);
    }
    /** Create a new item gained event.
     * Adds volume the existing event if it already exists (Same Item & source)
     * @param item The item that was gained
     * @param volume The number of items gained.
     * @param source Where the item came from
     */
    createItemGainedEvent(item, volume, source) {
        /**if (!this.isTelemetryEnabled || setLang !== 'en') return;
        const eventID = `${item.id}.${source}`;
        const existingEvent = this.getExistingTelemetryEvent('item_gained', eventID);
        const eventData = existingEvent !== undefined ? existingEvent : new ItemGainedTelemetryEvent(item, volume, source);
        if (
          existingEvent !== undefined &&
          existingEvent instanceof ItemGainedTelemetryEvent &&
          eventData instanceof ItemGainedTelemetryEvent
        ) {
          eventData.itemVolume += volume;
        }
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE) console.log('Creating item_gained telemetry event', eventData);
        this.scheduleTelemetryEvent('item_gained', eventID, eventData);**/
    }
    /** Create a new item removed from bank event.
     * Adds volume the existing event if it already exists (Same Item & source)
     * @param item The item that was gained
     * @param volume The number of items gained.
     * @param movedTo Where the item went to (from bank)
     */
    createItemRemovedFromBankEvent(item, volume, movedTo) {
        if (!this.isTelemetryEnabled)
            return;
        const eventID = `${item.id}.${movedTo}`;
        const existingEvent = this.getExistingTelemetryEvent('item_removed_from_bank', eventID);
        const eventData = existingEvent !== undefined ? existingEvent : new ItemRemovedFromBankTelemetryEvent(item, volume, movedTo);
        if (existingEvent !== undefined &&
            existingEvent instanceof ItemRemovedFromBankTelemetryEvent &&
            eventData instanceof ItemRemovedFromBankTelemetryEvent) {
            eventData.itemVolume += volume;
        }
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating item_removed_from_bank telemetry event', eventData);
        this.scheduleTelemetryEvent('item_removed_from_bank', eventID, eventData);
    }
    /** Create a new gp adjusted event.
     * Adds amount the existing event if it already exists (Same source)
     * @param amount The GP amount that was gained/lossed
     * @param total The total GP value.
     * @param source Where the GP adjustment originated from
     */
    createGPAdjustedEvent(amount, total, source) {
        if (!this.isTelemetryEnabled)
            return;
        const eventID = source;
        const existingEvent = this.getExistingTelemetryEvent('gp_adjusted', eventID);
        const eventData = existingEvent !== undefined ? existingEvent : new GPAdjustedTelemetryEvent(amount, total, source);
        if (existingEvent !== undefined &&
            existingEvent instanceof GPAdjustedTelemetryEvent &&
            eventData instanceof GPAdjustedTelemetryEvent) {
            eventData.amount += amount;
            eventData.total = total;
        }
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating gp_adjusted telemetry event', eventData);
        this.scheduleTelemetryEvent('gp_adjusted', eventID, eventData);
    }
    /** Create a new ap adjusted event.
     * Adds amount the existing event if it already exists (Same source)
     * @param amount The AP amount that was gained/lossed
     * @param total The total AP value.
     * @param source Where the AP adjustment originated from
     */
    createAPAdjustedEvent(amount, total, source) {
        if (!this.isTelemetryEnabled)
            return;
        const eventID = source;
        const existingEvent = this.getExistingTelemetryEvent('ap_adjusted', eventID);
        const eventData = existingEvent !== undefined ? existingEvent : new APAdjustedTelemetryEvent(amount, total, source);
        if (existingEvent !== undefined &&
            existingEvent instanceof APAdjustedTelemetryEvent &&
            eventData instanceof APAdjustedTelemetryEvent) {
            eventData.amount += amount;
            eventData.total = total;
        }
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log('Creating ap_adjusted telemetry event', eventData);
        this.scheduleTelemetryEvent('ap_adjusted', eventID, eventData);
    }
    removeTelemetryEvent(eventType, eventID) {
        const events = this.telemetryPayloadsToProcess.get(eventType);
        if (events === undefined)
            return;
        events.delete(eventID);
        if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
            console.log(`Removed Telemetry Event: ${eventType} - ${eventID}`);
    }
    /** Returns existing the existing Telemetry Event that is scheduled to send */
    getExistingTelemetryEvent(eventType, eventID) {
        const events = this.telemetryPayloadsToProcess.get(eventType);
        if (events === undefined)
            return undefined;
        return events.get(eventID);
    }
    /** Returns the Event Body required to send a Telemetry Event via PlayFab API Call */
    getTelemetryEventBody(event) {
        return {
            EventNamespace: 'custom',
            Name: event.type,
            Payload: event.payload,
        };
    }
    /** Fires all events within an Event Type
     * @param eventType The type of event to fire
     */
    fireEventType(eventType) {
        if (!this.isTelemetryEnabled)
            return;
        const events = [];
        const eventToFire = this.telemetryPayloadsToProcess.get(eventType);
        if (eventToFire === undefined)
            return;
        events.push(...this.processTelemetryPayload(eventType, eventToFire));
        this.fireTelemetryEvents(events, true);
        this.telemetryPayloadsToProcess.delete(eventType);
    }
    /** Schedules a Telemtry Event for processing
     * @param eventType The type of event to fire
     * @param eventID The ID of the event to fire
     * @param event The event data to fire
     */
    scheduleTelemetryEvent(eventType, eventID, event) {
        if (!this.isTelemetryEnabled)
            return;
        const currentEvents = this.telemetryPayloadsToProcess.get(eventType);
        const eventData = currentEvents !== undefined ? currentEvents : new Map();
        eventData.set(eventID, event);
        this.telemetryPayloadsToProcess.set(eventType, eventData);
        this.onTelemetryEventCreation();
    }
    /** Perform functions when a Telemetry event is created */
    onTelemetryEventCreation() {
        this.fireEventsIfLimitsReached();
    }
    /** Fire events prior to the event size limit being reached */
    fireEventsIfLimitsReached() {
        if (!this.isTelemetryEnabled)
            return;
        if (this.getTelemetryEventSize() >= 150) {
            this.processScheduledTelemetryData();
        }
    }
    /** Returns the total amount of Telemetry events queued */
    getTelemetryEventSize() {
        let count = 0;
        this.telemetryPayloadsToProcess.forEach((event) => (count += event.size));
        return count;
    }
    /** Process all scheduled Telemetry Events */
    processScheduledTelemetryData() {
        if (!this.isTelemetryEnabled)
            return;
        const events = [];
        this.telemetryPayloadsToProcess.forEach((event, eventType) => {
            events.push(...this.processTelemetryPayload(eventType, event));
            this.telemetryPayloadsToProcess.delete(eventType);
        });
        this.fireTelemetryEvents(events, false);
    }
    /** Processes Telemetry events of the specified event type
     * @param eventType The type of event to process
     * @param event The event data to process
     */
    processTelemetryPayload(eventType, event) {
        if (!this.isTelemetryEnabled)
            return [];
        const events = [];
        event.forEach((eventData) => {
            if (DEBUGENABLED)
                console.log(`Prepairing to fire Telemetry Event (${eventType}): ${JSON.stringify(eventData.payload)}`);
            const eventBody = this.getTelemetryEventBody(eventData);
            events.push(eventBody);
        });
        return events;
    }
    get telemetryCooldownExpired() {
        return Date.now() - this.lastTelemetryEventFire > this.TELEMETRY_FIRE_EVENT_LIMIT_IN_SECONDS * 1000;
    }
    /** Fires a Telemetry Event via PlayFab API Call */
    fireTelemetryEvents(events, bypassCooldown) {
        if (!this.isTelemetryEnabled || events.length < 1 || (!bypassCooldown && !this.telemetryCooldownExpired))
            return;
        const eventBody = {
            Events: events,
        };
        cloudManager
            .playfabEventAPI('WriteTelemetryEvents', eventBody)
            .then((result) => {
                if (result.code === 200) {
                    if (DEBUGENABLED && this.LOG_EVENTS_TO_CONSOLE)
                        console.log(`Telemetry Event(s) fired successfully.`);
                    this.lastTelemetryEventFire = Date.now();
                } else {
                    console.error(`Telemetry Event(s) failed to fire. Error: ${result.errorMessage}`);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }
}
class GenericTelemetryEvent {
    constructor(type) {
        this.type = type;
        this.character = game.characterName;
        this.gamemode = game.currentGamemode.id;
        this.saveSlot = currentCharacter;
        this.gameVersion = gameVersion;
        if (nativeManager.isNativeApp) {
            this.platform = nativeManager.isIOS ? 'ios' : 'android';
        } else if (nativeManager.isSteam)
            this.platform = 'steam';
        else if (nativeManager.isEpicGames)
            this.platform = 'epic';
        else
            this.platform = 'web';
    }
}
class MonsterKilledTelemetryEvent extends GenericTelemetryEvent {
    constructor(monster, count) {
        super('monster_killed');
        this.monster = monster;
        this.count = count;
        this._killCount = game.stats.monsterKillCount(monster);
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            monster_id: this.monster.id,
            count: this.count,
            kill_count: this._killCount + this.count,
        };
    }
}
class PlayerDeathTelemetryEvent extends GenericTelemetryEvent {
    constructor(cause, itemLost) {
        super('player_death');
        this.itemLostCount = 0;
        this.isHardcore = game.currentGamemode.isPermaDeath;
        this.deathNumber = game.stats.Combat.get(CombatStats.Deaths) + 1;
        this.deathCause = 'Unknown';
        this.itemLost = 'None';
        this.setCause(cause);
        this.setItemLost(itemLost);
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            death_cause: this.deathCause,
            is_hardcore: this.isHardcore,
            death_number: this.deathNumber,
            item_lost: this.itemLost,
            item_lost_count: this.itemLostCount,
        };
    }
    setItemLost(itemLost, count = 0) {
        this.itemLost = itemLost === 'None' ? 'None' : itemLost.id;
        this.itemLostCount = count;
    }
    setCause(cause) {
        switch (cause) {
            case 'Thieving':
                this.deathCause = 'Thieving';
                break;
            case 'Unknown':
                this.deathCause = 'Unknown';
                break;
            case 'GolbinRaid':
                this.deathCause = 'GolbinRaid';
                break;
            default:
                this.deathCause = cause.id;
                break;
        }
    }
}
class OfflineXPGainTelemetryEvent extends GenericTelemetryEvent {
    constructor(skill, offlineTime, xpBefore, xpAfter, levelBefore, levelAfter) {
        super('offline_xp_gain');
        this._xpAfter = 0;
        this._levelAfter = 0;
        this._offlineTime = 0;
        this._skill = skill;
        this._offlineTime = offlineTime;
        this._xpBefore = xpBefore;
        this._xpAfter = xpAfter;
        this._levelBefore = levelBefore;
        this._levelAfter = levelAfter;
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            skill_id: this._skill.id,
            xp_before: this._xpBefore,
            xp_after: this._xpAfter,
            level_before: this._levelBefore,
            level_after: this._levelAfter,
            offline_time: this._offlineTime,
        };
    }
    updateValues(level, xp) {
        this._xpAfter = xp;
        this._levelAfter = level;
    }
    get requiresPurge() {
        return this._xpAfter <= this._xpBefore;
    }
}
class OfflineAXPGainTelemetryEvent extends GenericTelemetryEvent {
    constructor(skill, offlineTime, xpBefore, xpAfter, levelBefore, levelAfter) {
        super('offline_abyssal_xp_gain');
        this._xpAfter = 0;
        this._levelAfter = 0;
        this._offlineTime = 0;
        this._skill = skill;
        this._offlineTime = offlineTime;
        this._xpBefore = xpBefore;
        this._xpAfter = xpAfter;
        this._levelBefore = levelBefore;
        this._levelAfter = levelAfter;
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            skill_id: this._skill.id,
            xp_before: this._xpBefore,
            xp_after: this._xpAfter,
            level_before: this._levelBefore,
            level_after: this._levelAfter,
            offline_time: this._offlineTime,
        };
    }
    updateValues(level, xp) {
        this._xpAfter = xp;
        this._levelAfter = level;
    }
    get requiresPurge() {
        return this._xpAfter <= this._xpBefore;
    }
}
class OnlineXPGainTelemetryEvent extends GenericTelemetryEvent {
    constructor(skill, onlineTime, xpBefore, xpAfter, levelBefore, levelAfter) {
        super('online_xp_gain');
        this._xpAfter = 0;
        this._levelAfter = 0;
        this._onlineTime = 0;
        this._skill = skill;
        this._onlineTime = onlineTime;
        this._xpBefore = xpBefore;
        this._xpAfter = xpAfter;
        this._levelBefore = levelBefore;
        this._levelAfter = levelAfter;
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            skill_id: this._skill.id,
            xp_before: this._xpBefore,
            xp_after: this._xpAfter,
            level_before: this._levelBefore,
            level_after: this._levelAfter,
            online_time: this._onlineTime,
        };
    }
    updateValues(level, xp, onlineTime) {
        this._xpAfter = xp;
        this._levelAfter = level;
        this._onlineTime += onlineTime;
    }
    get requiresPurge() {
        return this._xpAfter <= this._xpBefore;
    }
}
class OnlineAXPGainTelemetryEvent extends GenericTelemetryEvent {
    constructor(skill, onlineTime, xpBefore, xpAfter, levelBefore, levelAfter) {
        super('online_abyssal_xp_gain');
        this._xpAfter = 0;
        this._levelAfter = 0;
        this._onlineTime = 0;
        this._skill = skill;
        this._onlineTime = onlineTime;
        this._xpBefore = xpBefore;
        this._xpAfter = xpAfter;
        this._levelBefore = levelBefore;
        this._levelAfter = levelAfter;
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            skill_id: this._skill.id,
            xp_before: this._xpBefore,
            xp_after: this._xpAfter,
            level_before: this._levelBefore,
            level_after: this._levelAfter,
            online_time: this._onlineTime,
        };
    }
    updateValues(level, xp, onlineTime) {
        this._xpAfter = xp;
        this._levelAfter = level;
        this._onlineTime += onlineTime;
    }
    get requiresPurge() {
        return this._xpAfter <= this._xpBefore;
    }
}
class ItemGainedTelemetryEvent extends GenericTelemetryEvent {
    constructor(item, itemVolume, source) {
        super('item_gained');
        this._item = item;
        this.itemVolume = itemVolume;
        this._source = source;
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            item_id: this._item.id,
            item_volume: this.itemVolume,
            source: this._source,
            moved_to: 'Bank',
        };
    }
}
class ItemRemovedFromBankTelemetryEvent extends GenericTelemetryEvent {
    constructor(item, itemVolume, movedTo) {
        super('item_removed_from_bank');
        this._item = item;
        this.itemVolume = itemVolume;
        this._source = 'Bank';
        this._movedTo = movedTo;
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            item_id: this._item.id,
            item_volume: this.itemVolume,
            source: this._source,
            moved_to: this._movedTo,
        };
    }
}
class GPAdjustedTelemetryEvent extends GenericTelemetryEvent {
    constructor(amount, total, source) {
        super('gp_adjusted');
        this.amount = amount;
        this.total = total;
        this._source = source;
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            amount: this.amount,
            total: this.total,
            source: this._source,
        };
    }
}
class APAdjustedTelemetryEvent extends GenericTelemetryEvent {
    constructor(amount, total, source) {
        super('ap_adjusted');
        this.amount = amount;
        this.total = total;
        this._source = source;
    }
    get payload() {
        return {
            game_version: this.gameVersion,
            platform: this.platform,
            language: setLang,
            mods_enabled: mod.manager.isEnabled(),
            active_mods: mod.manager.getLoadedModList(),
            entitlements: game.telemetry.entitlementStatus,
            character: this.character,
            gamemode: this.gamemode,
            save_slot: this.saveSlot,
            amount: this.amount,
            total: this.total,
            source: this._source,
        };
    }
}
//# sourceMappingURL=telemetry.js.map
checkFileVersion('?12097')