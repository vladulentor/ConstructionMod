var scheduledPushNotifications = {};
var storedPushNotificationData = {};

function sendPushNotification(key, text = "", sendAfter = 0) {
    if (key !== "offlineSkill") {
        let send = false;
        if (key === "offlineSkill" && game.settings.enableOfflinePushNotifications) send = true;
        else if (key.includes("farming") && game.settings.enableFarmingPushNotifications) send = true;
        //else if (SETTINGS.general.pushNotificationFarming) send = true;
        if (send && (location.origin === "https://ios.melvoridle.com" || location.origin === "https://android.melvoridle.com" || (storedPushNotificationData["platform"] !== undefined && storedPushNotificationData["platform"] !== ""))) {
            getPushNotificationToken()
                .then((playerID) => {
                    let platform = getPushNotificationPlatform();
                    let timestamp = new Date().getTime();
                    timestamp += sendAfter;
                    let sendTimestamp = new Date(timestamp);
                    if (platform === "" || playerID === "") console.log("Unable to schedule Push Notification.");
                    else {
                        if (checkForExistingScheduledPushNotification(key)) deleteScheduledPushNotification(key);
                        $.ajax({
                            url: "includes/notifications/sendPushNotification.php",
                            type: "POST",
                            async: true,
                            data: {
                                sendNotification: 1,
                                playerID: playerID,
                                timestamp: sendTimestamp,
                                message: text,
                                platform: platform,
                            },
                            success: function(data) {
                                let jsonData = JSON.parse(data);
                                let pushID = JSON.parse(jsonData).id;
                                storeScheduledPushNotification(key, pushID);
                                storeScheduledPushNotification("platform", platform); //store the platform in case player logs in on PC, this way we can clear the notification
                            },
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }
}

function storeScheduledPushNotification(key, pushID) {
    scheduledPushNotifications[key] = pushID;
}

function deleteScheduledPushNotification(key) {
    if (scheduledPushNotifications[key] !== undefined && scheduledPushNotifications[key] !== "") {
        let pushID = scheduledPushNotifications[key];
        let platform = "";
        if (scheduledPushNotifications["platform"] !== undefined && scheduledPushNotifications["platform"] !== null && scheduledPushNotifications["platform"] !== "") platform = scheduledPushNotifications["platform"];
        else platform = getPushNotificationPlatform();
        if (platform === "" || platform === undefined || platform === null) console.log("Unable to process Push Notification Deletion. Platform not detected.");
        else {
            $.ajax({
                url: "includes/notifications/sendPushNotification.php",
                type: "POST",
                async: true,
                data: {
                    deleteNotification: 1,
                    messageID: pushID,
                    platform: platform,
                },
                success: function(data) {
                    //console.log(data);
                    scheduledPushNotifications[key] = "";
                    scheduledPushNotifications["platform"] = "";
                },
            });
        }
    }
}

function checkForExistingScheduledPushNotification(key) {
    if (scheduledPushNotifications[key] === undefined || scheduledPushNotifications[key] === "") return false;
    return true;
}

function connectDevicePushNotifications() {
    if (!connectedToCloud) {
        $("#settings-pushNotification-connect-error").removeClass(`d-none`);
        $("#settings-pushNotification-connect-error").text(`Error: You must be signed into Melvor Cloud to do this.`);
        return;
    }
    $("#settings-pushNotification-connect-btn").html(`<span class="spinner-border spinner-border-sm text-white m-1" role="status"></span>`);
    $("#settings-pushNotification-connect-btn").prop(`disabled`, true);
    $("#settings-pushNotification-connect-error").addClass(`d-none`);
    let platform = getPushNotificationPlatform();
    getPushNotificationToken()
        .then((playerID) => {
            window.setTimeout(function() {
                if (platform !== "" && playerID !== "") {
                    playFabStoreData("one_signal_platform", platform);
                    playFabStoreData("one_signal_token", playerID);
                    $.ajax({
                        url: CLOUDURL + "cloud/connectPushNotificationDevice.php",
                        type: "POST",
                        async: true,
                        data: {
                            connectPushNotifications: 1,
                            platform: platform,
                            token: playerID,
                        },
                        success: function(data) {
                            if (data === "1") {
                                storePushNotificationToken(playerID);
                                storePushNotificationPlatform(platform);
                                $("#settings-pushNotification-connect-success").removeClass(`d-none`);
                                $("#settings-pushNotification-connect-error").addClass(`d-none`);
                                $("#settings-pushNotification-connect-btn").addClass(`d-none`);
                                $("#settings-pushNotification-connect-success").text(`Connected to ${platform} successfully.`);
                                $("#settings-pushNotification-connect-btn").prop(`disabled`, false);
                                $("#settings-pushNotification-disconnect-btn").removeClass(`d-none`);
                            } else {
                                $("#settings-pushNotification-connect-btn").html(`Connect Device`);
                                $("#settings-pushNotification-connect-error").removeClass(`d-none`);
                                $("#settings-pushNotification-connect-error").text(`There was an error connecting your Device. Please try again. Error: ${platform} ${playerID}`);
                                $("#settings-pushNotification-connect-btn").prop(`disabled`, false);
                                $("#settings-pushNotification-disconnect-btn").addClass(`d-none`);
                            }
                        },
                    });
                } else {
                    $("#settings-pushNotification-connect-error").removeClass(`d-none`);
                    $("#settings-pushNotification-connect-error").text(`Error... this can only be done from a Mobile Device. Platform: ${platform} // token: ${token}`);
                    $("#settings-pushNotification-connect-btn").html(`Connect Device`);
                    $("#settings-pushNotification-connect-btn").prop(`disabled`, false);
                }
            }, 1000);
        })
        .catch((error) => {
            console.log(error);
        });
}

function disconnectDevicePushNotifications() {
    $("#settings-pushNotification-disconnect-btn").prop(`disabled`, true);
    $("#settings-pushNotification-disconnect-btn").html(`<span class="spinner-border spinner-border-sm text-white m-1" role="status"></span>`);
    if (PlayFabClientSDK.IsClientLoggedIn()) {
        playFabStoreData("one_signal_token", "");
        playFabStoreData("one_signal_platform", "");
    }
    window.setTimeout(function() {
        $.ajax({
            url: CLOUDURL + "cloud/deletePushNotificationDevice.php",
            type: "POST",
            async: true,
            success: function(data) {
                if (data === "1") {
                    storePushNotificationToken("");
                    storePushNotificationPlatform("");
                    $("#settings-pushNotification-connect-success").addClass(`d-none`);
                    $("#settings-pushNotification-connect-error").addClass(`d-none`);
                    $("#settings-pushNotification-connect-btn").removeClass(`d-none`);
                    $("#settings-pushNotification-connect-btn").prop(`disabled`, false);
                    $("#settings-pushNotification-connect-btn").html(`Connect Device`);
                    $("#settings-pushNotification-disconnect-btn").addClass(`d-none`);
                } else {
                    $("#settings-pushNotification-connect-error").removeClass(`d-none`);
                    $("#settings-pushNotification-connect-error").text(`There was an error disconnecting your Device. Please try again.`);
                    $("#settings-pushNotification-disconnect-btn").removeClass(`d-none`);
                    $("#settings-pushNotification-disconnect-btn").prop(`disabled`, false);
                    $("#settings-pushNotification-disconnect-btn").html(`Disconnect Device`);
                }
            },
        });
    }, 1000);
}

function getConnectedPushNotificationDevice() {
    $("#settings-pushNotification-connect-btn").html(`<span class="spinner-border spinner-border-sm text-white m-1" role="status"></span>`);
    $("#settings-pushNotification-connect-btn").prop(`disabled`, true);
    if (connectedToCloud && storedCloudSaves[7] !== "" && storedCloudSaves[8] !== "") {
        storePushNotificationToken(storedCloudSaves[7]);
        storePushNotificationPlatform(storedCloudSaves[8]);
        $("#settings-pushNotification-connect-success").removeClass(`d-none`);
        $("#settings-pushNotification-connect-error").addClass(`d-none`);
        $("#settings-pushNotification-connect-btn").addClass(`d-none`);
        $("#settings-pushNotification-connect-success").text(`Connected to ${storedCloudSaves[8]} successfully.`);
        $("#settings-pushNotification-connect-btn").prop(`disabled`, false);
        $("#settings-pushNotification-disconnect-btn").removeClass(`d-none`);
    } else if (PlayFabClientSDK.IsClientLoggedIn()) {
        getPlayFabData("one_signal_token").then((data) => {
            if (data) {
                storePushNotificationToken(data);
                getPlayFabData("one_signal_platform").then((platform) => {
                    if (platform) {
                        storePushNotificationPlatform(platform);
                        $("#settings-pushNotification-connect-success").removeClass(`d-none`);
                        $("#settings-pushNotification-connect-error").addClass(`d-none`);
                        $("#settings-pushNotification-connect-btn").addClass(`d-none`);
                        $("#settings-pushNotification-connect-success").text(`Connected to ${platform} successfully.`);
                        $("#settings-pushNotification-connect-btn").prop(`disabled`, false);
                        $("#settings-pushNotification-disconnect-btn").removeClass(`d-none`);
                    } else failedToConnectPushNotificationDevice();
                });
            } else failedToConnectPushNotificationDevice();
        });
    } else {
        failedToConnectPushNotificationDevice();
    }
}

function failedToConnectPushNotificationDevice() {
    $("#settings-pushNotification-connect-btn").html(`Connect Device`);
    $("#settings-pushNotification-connect-btn").prop(`disabled`, false);
    $("#settings-pushNotification-disconnect-btn").addClass(`d-none`);
}

function getPushNotificationPlatform() {
    let platform = "";
    if (storedPushNotificationData["platform"] !== undefined && storedPushNotificationData["platform"] !== "") platform = storedPushNotificationData["platform"];
    else {
        try {
            if (location.origin === "https://ios.melvoridle.com") platform = "iOS";
            else if (location.origin === "https://android.melvoridle.com") {
                if (location.pathname === "/") platform = "AndroidAds";
                else platform = "AndroidAdFree";
            } else if (scheduledPushNotifications["platform"] !== undefined && scheduledPushNotifications["platform"] !== "") {
                platform = scheduledPushNotifications["platform"];
            } else {
                platform = "";
            }
        } catch (e) {
            console.log("There was an issue detecting the Platform. Not on Mobile?");
            platform = "";
        }
    }
    return platform;
}

function getPushNotificationToken() {
    const playerID = new Promise((resolve, reject) => {
        if (storedPushNotificationData["token"] !== undefined && storedPushNotificationData["token"] !== "" && location.origin !== "https://ios.melvoridle.com" && location.origin !== "https://android.melvoridle.com") resolve(storedPushNotificationData["token"]);
        else {
            try {
                //get iOS OneSignal Token
                if (location.origin === "https://ios.melvoridle.com") {
                    window.bridge.post("onesignaltoken", {}, (results, error) => {
                        resolve(results.token);
                    });
                } else if (location.origin === "https://android.melvoridle.com") {
                    resolve(android.getOneSignalRegisteredId());
                } else {
                    failedToConnectPushNotificationDevice();
                    reject("Could not retrieve One Signal Token. Not on Mobile?");
                }
            } catch (e) {
                failedToConnectPushNotificationDevice();
                reject("Could not retrieve One Signal Token. Not on Mobile?");
            }
        }
    });
    return playerID;
}

function storePushNotificationToken(token) {
    storedPushNotificationData["token"] = token;
}

function storePushNotificationPlatform(platform) {
    storedPushNotificationData["platform"] = platform;
}