"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new(P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }

        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }

        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const nativeManager = (() => {
    let deviceInfo;
    let onesignalInfo = {};
    let scheduledPushNotifications = [];
    let waitingForPurchaseToFinish = false;
    const waitingForPurchaseInfoToLoad = true;
    let productIDInPurchaseFlow = '';
    let receiptData = {};
    let nativeIAPInfo;
    let nativeAppIAPLoaded = false;
    const showNewAppBeta = true;
    const productIDs = {
        ios: {
            fullGame: 'com.gamesbymalcs.melvoridle.removeAds',
            expansions: [
                'com.gamesbymalcs.melvoridle.expansion1',
                'com.gamesbymalcs.melvoridle.expansion2',
                'com.gamesbymalcs.melvoridle.expansion3',
            ],
            bundles: ['com.gamesbymalcs.melvoridle.expandedEdition'],
        },
        android: {
            fullGame: 'com.malcs.melvoridle.removeads',
            expansions: [
                'com.malcs.melvoridle.expansion1',
                'com.malcs.melvoridle.expansion2',
                'com.malcs.melvoridle.expansion3',
            ],
            bundles: ['com.malcs.melvoridle.expandededition'],
        },
    };
    const defaultIAPPricing = {
        ios: {
            fullGame: 'US$9.99',
            expansions: ['US$4.99', 'US$4.99', 'US$4.99'],
            expandedEdition: 'US$14.99'
        },
        android: {
            fullGame: 'US$9.99',
            expansions: ['US$4.99', 'US$4.99', 'US$4.99'],
            expandedEdition: 'US$14.99'
        },
    };
    const localPriceElements = {
        baseGame: document.getElementById('iap-local-price-base'),
        toth: document.getElementById('iap-local-price-toth'),
        aod: document.getElementById('iap-local-price-aod'),
        ita: document.getElementById('iap-local-price-ita'),
        expandedEdition: document.getElementById('iap-local-price-expanded'),
        baseGameInt: document.getElementById('iap-local-price-base-int'),
        tothInt: document.getElementById('iap-local-price-toth-int'),
        aodInt: document.getElementById('iap-local-price-aod-int'),
        itaInt: document.getElementById('iap-local-price-ita-int'),
        expandedEditionInt: document.getElementById('iap-local-price-expanded-int'),
    };

    function isIOS() {
        return location.origin === 'https://ios.melvoridle.com' || navigator.userAgent.includes('gonative_ios');
    }

    function isAndroid() {
        return location.origin === 'https://android.melvoridle.com' || navigator.userAgent.includes('gonative_android');
    }

    function isGeckoView() {
        return navigator.userAgent.includes('geckoview');
    }

    function isAndroidGeckoView() {
        return navigator.userAgent.includes('gonative_android_geckoview');
    }

    function isAndroidPaidGeckoView() {
        return navigator.userAgent.includes('gonative_android_paid_geckoview');
    }

    function isMobile() {
        return isIOS() || isAndroid() || location.pathname.includes('index_mobile.php');
    }

    function isSteam() {
        return location.origin === 'https://steam.melvoridle.com' || isUsingGreenworks() || isUsingSteamworks();
    }

    function isEpicGames() {
        return location.origin === 'https://epicgames.melvoridle.com';
    }

    function isDesktop() {
        return isSteam() || isEpicGames();
    }

    function isUsingGreenworks() {
        return parent.greenworks !== undefined;
    }

    function isUsingSteamworks() {
        return parent.steamworks !== undefined && parent.steamworksClient !== undefined;
    }

    function appVersion() {
        return deviceInfo !== undefined ? deviceInfo.appVersion : '1.0.0';
    }
    /** Determines if native app is being used */
    function isNativeApp() {
        return navigator.userAgent.includes('gonative');
    }
    /** Determines if Android full version native app is being used, which has limited functionality */
    function isAndroidFullVersionNativeApp() {
        return navigator.userAgent.includes('gonative_android_adfree');
    }

    function constructor() {
        if (!isNativeApp()) {
            showBrowserOnlyElements();
            return;
        }
        showNativeOnlyElements();
        initNativeManager();
    }

    function initNativeManager() {
        return __awaiter(this, void 0, void 0, function*() {
            deviceInfo = yield getDeviceInfo();
            onesignalInfo = yield getOneSignalInfo();
        });
    }

    function hideNativeIOSElements() {
        const elements = document.querySelectorAll('.native-ios');
        elements.forEach((element) => {
            element.classList.add('d-none');
        });
    }

    function showNativeIOSElements() {
        const elements = document.querySelectorAll('.native-ios');
        elements.forEach((element) => {
            element.classList.remove('d-none');
        });
    }

    function hideNativeAndroidElements() {
        const elements = document.querySelectorAll('.native-android');
        elements.forEach((element) => {
            element.classList.add('d-none');
        });
    }

    function showNativeAndroidElements() {
        const elements = document.querySelectorAll('.native-android');
        elements.forEach((element) => {
            element.classList.remove('d-none');
        });
    }
    /** Schedules a Push Notification via One Signal based on the endDate provided */
    function schedulePushNotification(notificationType, msg, endDate) {
        return __awaiter(this, void 0, void 0, function*() {
            const oneSignalUserID = onesignalInfo.oneSignalUserId;
            const platform = isIOS() ? 'iOS' : 'AndroidAds';
            if (oneSignalUserID === undefined)
                return Promise.reject('One Signal User ID not found');
            if (platform === undefined)
                return Promise.reject('One Signal Platform not found');
            //If notification type is unique, cancel any existing unique notifications
            if (notificationType === PushNotificationType.Unique)
                yield cancelUniquePushNotification();
            const data = {
                sendNotification: 1,
                playerID: oneSignalUserID,
                timestamp: endDate,
                message: msg,
                platform: platform,
            };
            $.ajax({
                    url: 'includes/notifications/sendPushNotification.php',
                    method: 'POST',
                    async: true,
                    data: data,
                })
                .done((result) => {
                    if (result.errors === undefined)
                        saveScheduledPushNotification(result.id, data.timestamp, data.platform);
                    else
                        console.log(JSON.stringify(result.errors));
                })
                .fail((error) => {});
        });
    }
    /** Process cancellation of a unique push notification with One Signal */
    function cancelUniquePushNotification() {
        return __awaiter(this, void 0, void 0, function*() {
            const existingNotification = findUniqueScheduledPushNotification();
            //If there is an existing unique notification, cancel it
            if (existingNotification !== undefined) {
                try {
                    const cancelled = yield cancelPushNotification(existingNotification);
                    Promise.resolve(cancelled);
                } catch (e) {
                    const errorMessage = `Native Manager Error: cancelUniquePushNotification: ${e}`;
                    console.log(errorMessage);
                    Promise.resolve(false);
                }
            }
            return Promise.resolve(true);
        });
    }
    /** Cancels a scheduled push notification with One Signal based on data provided */
    function cancelPushNotification(data) {
        return __awaiter(this, void 0, void 0, function*() {
            console.log(`Cancelling push notification: ${data.id}`);
            return $.ajax({
                    url: 'includes/notifications/sendPushNotification.php',
                    method: 'POST',
                    async: true,
                    data: {
                        deleteNotification: 1,
                        messageID: data.id,
                        platform: data.platform,
                    },
                })
                .then((result) => {
                    if (result.success)
                        return true;
                    else
                        return false;
                })
                .fail((error) => {
                    return 'Error cancelling push notification: ' + error;
                });
        });
    }
    /** Save the data of a successfully scheduled push notification */
    function saveScheduledPushNotification(id, endDate, platform) {
        const data = {
            id: id,
            notificationType: 0,
            startDate: Date.now(),
            endDate: endDate,
            platform: platform,
        };
        scheduledPushNotifications.push(data);
    }
    /** Finds a scheduled push notification using the notification ID provided by One Signal */
    function findScheduledPushNotification(id) {}
    /** Finds and returns a unique scheduled push notification. Only 1 unique notification can be scheduled at a time.  */
    function findUniqueScheduledPushNotification() {
        return scheduledPushNotifications.find((notification) => notification.notificationType === PushNotificationType.Unique);
    }

    function encode(writer) {
        writer.writeArray(scheduledPushNotifications, (notification, writer) => {
            writer.writeString(notification.id);
            writer.writeFloat64(notification.startDate);
            writer.writeFloat64(notification.endDate);
            writer.writeUint8(notification.notificationType);
            writer.writeString(notification.platform);
        });
        return writer;
    }

    function decode(reader, version) {
        scheduledPushNotifications = reader.getArray((reader) => {
            return {
                id: reader.getString(),
                startDate: reader.getFloat64(),
                endDate: reader.getFloat64(),
                notificationType: reader.getUint8(),
                platform: reader.getString(),
            };
        });
    }

    function convertOldNotifications(oldNotifications) {
        // TODO_C Write code to handle old push notification data
    }
    /** Shows the browser only elements if not running native app */
    function showNativeOnlyElements() {
        const elements = document.querySelectorAll('.native-only');
        elements.forEach((element) => {
            element.classList.remove('d-none');
        });
    }
    /** Shows the native only elements if running native app */
    function showBrowserOnlyElements() {
        const elements = document.querySelectorAll('.browser-only');
        elements.forEach((element) => {
            element.classList.remove('d-none');
        });
    }
    /** Toggles the visibility of platform specific UI-elements */
    function togglePlatformSpecificElements() {
        if (!isNativeApp()) {
            showBrowserOnlyElements();
        } else {
            showNativeOnlyElements();
        }
        if (!isIOS())
            hideNativeIOSElements();
        if (!isAndroid())
            hideNativeAndroidElements();
    }
    /** Returns the device info in JSON format
     * Info contains detail such as platform, app version, hardware, tokens, device model etc etc
     */
    function getDeviceInfo() {
        return __awaiter(this, void 0, void 0, function*() {
            try {
                const info = yield gonative.deviceInfo();
                return info;
            } catch (e) {
                console.log(`Native Manager Error: getDeviceError: ${e}`);
                return {};
            }
        });
    }
    /** Returns onesignal information in JSON format
     * Info contains userID, tokens, device model etc etc
     */
    function getOneSignalInfo() {
        return __awaiter(this, void 0, void 0, function*() {
            try {
                const info = yield gonative.onesignal.onesignalInfo();
                return info;
            } catch (e) {
                console.log(`Native Manager Error: getOneSignalInfo: ${e}`);
                return {};
            }
        });
    }
    /** Triggers the one signal notification prompt */
    function registerOneSignal() {
        try {
            gonative.onesignal.register();
        } catch (e) {
            console.log(`Native Manager Error: registerOneSignal: ${e}`);
        }
    }
    /** Open share dialogue to share URL. Leave blank to share current page. */
    function sharePage(URL) {
        try {
            gonative.share.sharePage(URL);
        } catch (e) {
            console.log(`Native Manager Error: sharePage: ${e}`);
        }
    }
    /** Opens the app settings on device */
    function openAppSettings() {
        try {
            gonative.open.appSettings();
        } catch (e) {
            console.log(`Native Manager Error: openAppSettings: ${e}`);
        }
    }
    /** Attempts to clear the current web cache based on the current platform */
    function attemptToClearCache() {
        console.log('Attempting to clear web cache');
        if (isNativeApp()) {
            gonative.webview.clearCache();
        }
        // TODO: Implement cache clearing for desktop apps
    }
    /** Clears the webview cache and reloads the page */
    function clearWebviewCache() {
        try {
            attemptToClearCache();
            location.reload();
        } catch (e) {
            console.log(`Native Manager Error: clearWebviewCache: ${e}`);
        }
    }
    /** Downloads a file from the specified URL */
    function downloadFile(URL) {
        try {
            gonative.share.downloadFile({
                url: URL,
                open: true
            });
        } catch (e) {
            console.log(`Native Manager Error: downloadFile: ${e}`);
        }
    }
    /** Sets the device brightness. Value between 0 and 1 */
    function setDeviceBrightness(brightness, restoreOnNavigation) {
        try {
            gonative.screen.setBrightness({
                brightness: brightness,
                restoreOnNavigation: restoreOnNavigation
            });
        } catch (e) {
            console.log(`Native Manager Error: setDeviceBrightness: ${e}`);
        }
    }
    /**
     * @deprecated No longer supported by native app
     * Set a NON-PERSISTENT local setting, stored within the native app itself.
     * Non-Persistent settings are cleared when the app is updated or uninstalled/re-installed, or the device is upgraded.
     */
    function setNonPersistentLocalSetting(key, value) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support local settings`);
            return;
        }
        try {
            gonative.localpreferences.nonpersistent.set({
                key: key,
                value: value,
                statuscallback: setNonPersistentCallback,
            });
        } catch (e) {
            console.log(`Native Manager Error: setNonPersistentLocalSetting: ${e}`);
        }
    }

    function setNonPersistentCallback(result) {
        if (result.status)
            console.log(result.status);
    }
    /**
     * @deprecated No longer supported by native app
     * Returns the value of a NON-PERSISTENT local setting, stored within the native app itself.
     * Non-Persistent settings are cleared when the app is updated or uninstalled/re-installed, or the device is upgraded.
     */
    function getNonPersistentLocalSetting(key) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support local settings`);
            return;
        }
        try {
            gonative.localpreferences.nonpersistent.get({
                key: key,
                callback: getNonPersistentCallback
            });
        } catch (e) {
            console.log(`Native Manager Error: getNonPersistentLocalSetting: ${e}`);
        }
    }

    function getNonPersistentCallback(result) {
        console.log(result);
    }
    /**
     * @deprecated No longer supported by native app
     * Deletes a NON-PERSISTENT local setting, stored within the native app itself.
     * Non-Persistent settings are cleared when the app is updated or uninstalled/re-installed, or the device is upgraded.
     */
    function deleteNonPersistentLocalSetting(key) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support local settings`);
            return;
        }
        try {
            gonative.localpreferences.nonpersistent.delete({
                key: key,
                statuscallback: deleteNonPersistentCallback
            });
        } catch (e) {
            console.log(`Native Manager Error: deleteNonPersistentLocalSetting: ${e}`);
        }
    }
    /**
     * @deprecated No longer supported by native app
     * Deletes ALL NON-PERSISTENT local setting, stored within the native app itself.
     * Non-Persistent settings are cleared when the app is updated or uninstalled/re-installed, or the device is upgraded.
     */
    function deleteAllNonPersistentLocalSettings() {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support local settings`);
            return;
        }
        try {
            gonative.localpreferences.nonpersistent.deleteAll({
                statuscallback: deleteNonPersistentCallback
            });
        } catch (e) {
            console.log(`Native Manager Error: deleteAllNonPersistentLocalSettings: ${e}`);
        }
    }

    function deleteNonPersistentCallback(result) {
        console.log(result);
    }
    /**
     * @deprecated No longer supported by native app
     * Set a PERSISTENT local setting, stored within the native app itself.
     * Persistent settings are designed to continue to be available through app updates and re-installation, and through device upgrades when possible through the device.
     */
    function setPersistentLocalSetting(key, value) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support local settings`);
            return;
        }
        try {
            gonative.localpreferences.nonpersistent.set({
                key: key,
                value: value,
                statuscallback: setPersistentCallback,
            });
        } catch (e) {
            console.log(`Native Manager Error: setPersistentLocalSetting: ${e}`);
        }
    }
    /** @deprecated No longer supported by native app */
    function setPersistentCallback(result) {
        if (result.status)
            console.log(result.status);
    }
    /**
     * @deprecated No longer supported by native app
     * Returns the value of a PERSISTENT local setting, stored within the native app itself.
     * Persistent settings are designed to continue to be available through app updates and re-installation, and through device upgrades when possible through the device.
     */
    function getPersistentLocalSetting(key) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support local settings`);
            return;
        }
        try {
            gonative.localpreferences.persistent.get({
                key: key,
                callback: getPersistentCallback
            });
        } catch (e) {
            console.log(`Native Manager Error: getPersistentLocalSetting: ${e}`);
        }
    }

    function getPersistentCallback(result) {
        console.log(result);
    }
    /**
     * @deprecated No longer supported by native app
     * Deletes a PERSISTENT local setting, stored within the native app itself.
     * Persistent settings are designed to continue to be available through app updates and re-installation, and through device upgrades when possible through the device.
     */
    function deletePersistentLocalSetting(key) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support local settings`);
            return;
        }
        try {
            gonative.localpreferences.persistent.delete({
                key: key,
                statuscallback: deletePersistentCallback
            });
        } catch (e) {
            console.log(`Native Manager Error: deletePersistentLocalSetting: ${e}`);
        }
    }
    /**
     * @deprecated No longer supported by native app
     * Deletes ALL PERSISTENT local setting, stored within the native app itself.
     * Persistent settings are designed to continue to be available through app updates and re-installation, and through device upgrades when possible through the device.
     */
    function deleteAllPersistentLocalSettings() {
        try {
            gonative.localpreferences.persistent.deleteAll({
                statuscallback: deletePersistentCallback
            });
        } catch (e) {
            console.log(`Native Manager Error: deleteAllPersistentLocalSettings: ${e}`);
        }
    }
    /** @deprecated No longer supported by native app */
    function deletePersistentCallback(result) {
        console.log(result);
    }
    /**
     * Stores key:value pair to the device's native cloud backup.
     * This option utilizes Android SharedPreferences combined with the native Android Backup Service and Apple Keychain Services to store the local app settings on a device.
     */
    function saveToNativeCloudBackup(key, value) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp())
            return;
        gonative.storage.cloud.set({
            key: key,
            value: value,
            statuscallback: saveToNativeCloudBackupCallback,
        });
    }

    function saveToNativeCloudBackupCallback(result) {
        if (!isNativeApp())
            return;
        if (DEBUGENABLED)
            console.log(result);
    }
    /**
     * Retrieves key:value pair from the device's native cloud backup.
     * This option utilizes Android SharedPreferences combined with the native Android Backup Service and Apple Keychain Services to store the local app settings on a device.
     */
    function getNativeCloudBackup(key) {
        return __awaiter(this, void 0, void 0, function*() {
            if (!isNativeApp() || isAndroidFullVersionNativeApp())
                return {
                    status: 'preference-not-found',
                };
            return gonative.storage.cloud.get({
                key: key,
            });
        });
    }
    /**
     * Deletes key:value pair from the device's native cloud backup.
     * This option utilizes Android SharedPreferences combined with the native Android Backup Service and Apple Keychain Services to store the local app settings on a device.
     */
    function deleteNativeCloudBackup(key) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp())
            return;
        gonative.storage.cloud.delete({
            key: key,
            statuscallback: deletetNativeCloudBackupCallback,
        });
    }
    /**
     * Deletes ALL SAVED key:value pair from the device's native cloud backup.
     * This option utilizes Android SharedPreferences combined with the native Android Backup Service and Apple Keychain Services to store the local app settings on a device.
     */
    function deletetAllNativeCloudBackup(key) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp())
            return;
        gonative.storage.cloud.deleteAll({
            statuscallback: deletetNativeCloudBackupCallback
        });
    }

    function deletetNativeCloudBackupCallback(result) {
        if (!isNativeApp())
            return;
        if (DEBUGENABLED)
            console.log(result);
    }
    /**
     * Triggers haptic feedback on the Native app based on style.
     * @param style - impactLight, impactMedium, impactHeavy, notificationSuccess, notificationWarning, notificationErro, tick (Android Only), click (Android Only), double_click (Android Only)
     */
    function triggerHaptic(style) {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support haptics`);
            return;
        }
        gonative.haptics.trigger({
            style: style
        });
    }
    /**
     * Triggers app review popup.
     */
    function promptForAppReview() {
        if (!isNativeApp() || isAndroidFullVersionNativeApp()) {
            console.log(`Native Manager Error: This version of the app does not support App Review`);
            return;
        }
        gonative.appreview.prompt({});
    }
    /** Activates the native purchase process for product ID */
    function purchaseIAP(productID) {
        try {
            waitingForPurchaseToFinish = true;
            productIDInPurchaseFlow = productID;
            if (!isNativeApp()) {
                if (isIOS())
                    window.bridge.post('make_purchase', {});
                else if (isAndroid())
                    android.buyItem();
            } else {
                if (isIOS() && validateIOSIAP(receiptData, productID))
                    purchaseAlreadyMade();
                else if (isAndroid() && validateAndroidIAP(receiptData, productID))
                    purchaseAlreadyMade();
                else {
                    gonative.purchase({
                        productID: productID
                    });
                    purchaseInProgressPopup();
                }
            }
        } catch (e) {
            console.log(`Native Manager Error: purchaseIOSIAP: ${e}`);
            performPostIAPPurchaseActions();
        }
    }

    function performPostIAPPurchaseActions() {
        enableBuyNowExpandedEditionBtn();
    }
    /** Executes the restore purchase function as required to restore IAP */
    function restorePurchases() {
        if (!isIOS())
            return;
        SwalLocale.fire({
            title: getLangString('IAP_RESTORING_PURCHASES'),
            html: `<div class="spinner-border spinner-border-sm text-info mr-2" role="status"></div><small>${getLangString('IAP_PLEASE_WAIT')}</small>`,
            showCancelButton: false,
            showConfirmButton: false,
        });
        try {
            gonative.iap.restorePurchases();
            window.setTimeout(() => {
                SwalLocale.fire({
                    title: getLangString('IAP_PURCHASES_RESTORED'),
                    html: `<small>${getLangString('IAP_PURCHASES_RESTORED_INFO')}</small>`,
                    showCancelButton: false,
                    icon: 'success',
                });
            }, 2000);
        } catch (e) {
            console.log(`Native Manager Error: restorePurchases: ${e}`);
        }
    }

    function purchaseInProgressPopup() {
        SwalLocale.fire({
            title: getLangString('MENU_TEXT_PURCHASE_IN_PROGRESS'),
            html: `<h5 class="font-w400 text-combat-smoke font-size-sm">${getLangString('MENU_TEXT_PREMIUM_PURCHASE_INFO_0')}</h5><h5 class="font-w400 text-info font-size-sm">${getLangString('MENU_TEXT_PREMIUM_PURCHASE_INFO_1')}</h5>`,
            icon: 'info',
            showConfirmButton: false,
        });
    }

    function purchaseAlreadyMade() {
        setLang == 'en' ?
            $('#modal-expanded-edition').modal('hide') :
            $('#modal-expanded-edition-international').modal('hide');
        SwalLocale.fire({
            title: getLangString('IAP_PURCHASE_ALREADY_ACTIVE'),
            html: `<small>${getLangString('IAP_PURCHASE_ALREADY_ACTIVE_INFO')}</small>`,
            icon: 'success',
        });
        performPostIAPPurchaseActions();
    }

    function validateIOSIAP(data, productID) {
        if (!data['hasValidReceipt'])
            return false;
        if (!data['allPurchases'].length)
            return false;
        const purchase = data['allPurchases'].find((x) => x.productIdentifier == productID);
        if (purchase === undefined)
            return false;
        return true;
    }

    function validateAndroidIAP(data, productID) {
        if (data['allPurchases'] === undefined || !data['allPurchases'].length)
            return false;
        const purchase = data['allPurchases'].find((x) => x.productID == productID);
        if (purchase === undefined)
            return false;
        if (purchase.purchaseState !== 0)
            return false;
        return true;
    }

    function getIAPPrice(productID, formatted) {
        let price = '';
        switch (productID) {
            case 'com.gamesbymalcs.melvoridle.removeAds':
            case 'com.malcs.melvoridle.removeads':
                price = defaultIAPPricing.ios.fullGame;
                break;
            case 'com.gamesbymalcs.melvoridle.expansion1':
            case 'com.malcs.melvoridle.expansion1':
                price = defaultIAPPricing.ios.expansions[0];
                break;
            case 'com.gamesbymalcs.melvoridle.expansion2':
            case 'com.malcs.melvoridle.expansion2':
                price = defaultIAPPricing.ios.expansions[1];
                break;
            case 'com.gamesbymalcs.melvoridle.expansion3':
            case 'com.malcs.melvoridle.expansion3':
                price = defaultIAPPricing.ios.expansions[2];
                break;
            case 'com.gamesbymalcs.melvoridle.expandedEdition':
            case 'com.malcs.melvoridle.expandededition':
                price = defaultIAPPricing.ios.expandedEdition;
        }
        if (nativeIAPInfo !== undefined) {
            const product = nativeIAPInfo.inAppPurchases.products.find((x) => x.productID == productID);
            if (product !== undefined) {
                if (product.price !== undefined) {
                    if (isIOS())
                        price = formatted && product.priceFormatted ? product.priceFormatted : product.price.toString();
                    else if (isAndroid())
                        price = product.price.toString();
                } else if (product.purchaseOfferDetails !== undefined) {
                    // This is an Android only field
                    if (isAndroid())
                        price = product.purchaseOfferDetails.formattedPrice;
                }
            }
        }
        return price;
    }

    function updateLocalPriceElements() {
        localPriceElements.baseGame.textContent = getIAPPrice(getFullGameIAPProductID(), true);
        localPriceElements.toth.textContent = getIAPPrice(getExpansionIAPProductID(0), true);
        localPriceElements.aod.textContent = getIAPPrice(getExpansionIAPProductID(1), true);
        localPriceElements.ita.textContent = getIAPPrice(getExpansionIAPProductID(2), true);
        localPriceElements.expandedEdition.textContent = getIAPPrice(getExpandedEditionIAPProductID(0), true);
        localPriceElements.baseGameInt.textContent = getIAPPrice(getFullGameIAPProductID(), true);
        localPriceElements.tothInt.textContent = getIAPPrice(getExpansionIAPProductID(0), true);
        localPriceElements.aodInt.textContent = getIAPPrice(getExpansionIAPProductID(1), true);
        localPriceElements.itaInt.textContent = getIAPPrice(getExpansionIAPProductID(2), true);
        localPriceElements.expandedEditionInt.textContent = getIAPPrice(getExpandedEditionIAPProductID(0), true);
    }

    function getFullGameIAPProductID() {
        if (isIOS())
            return productIDs.ios.fullGame;
        if (isAndroid())
            return productIDs.android.fullGame;
        return '';
    }

    function getExpansionIAPProductID(expansionID) {
        if (isIOS())
            return productIDs.ios.expansions[expansionID];
        if (isAndroid())
            return productIDs.android.expansions[expansionID];
        return '';
    }

    function getExpandedEditionIAPProductID(bundleID) {
        if (isIOS())
            return productIDs.ios.bundles[bundleID];
        if (isAndroid())
            return productIDs.android.bundles[bundleID];
        return '';
    }

    function doesIAPExist(productID) {
        if (!isNativeApp())
            return true;
        if (nativeIAPInfo === undefined)
            return false;
        return nativeIAPInfo.inAppPurchases.products.find((x) => x.productID == productID) !== undefined;
    }

    function setExpandedEditionVisibility() {
        const exists = doesIAPExist(getExpandedEditionIAPProductID(0));
        const eeEl = document.getElementById('expanded-edition-iap-content');
        const eeEl2 = document.getElementById('expanded-edition-iap-content-1');
        if (eeEl !== null) {
            exists ? showElement(eeEl) : hideElement(eeEl);
        }
        if (eeEl2 !== null) {
            exists ? showElement(eeEl2) : hideElement(eeEl2);
        }
    }

    function buyFullGameSwal(skill) {
        if (isNativeApp()) {
            updateLocalPriceElements();
            setExpandedEditionVisibility();
        }
        setLang == 'en' ?
            $('#modal-expanded-edition').modal('show') :
            $('#modal-expanded-edition-international').modal('show');
    }

    function buyFullGame() {
        const productID = getFullGameIAPProductID();
        performUnlockIAP(productID);
    }

    function buyExpansion1Swal() {
        if (!cloudManager.hasFullVersionEntitlement)
            return buyTheFullGameFirst();
        const productID = getExpansionIAPProductID(0);
        const price = isNativeApp() ? getIAPPrice(productID, true) : '$4.99 USD';
        let html = getLangString('IAP_PURCHASE_TOTH_Q');
        if (!isNativeApp() && !isSteam() && !isEpicGames() && setLang == 'en')
            html += `<br><br><small class="font-w600">${getLangString('IAP_TOTH_GRANDFATHERED')}</small>`;
        SwalLocale.fire({
            title: 'Throne of the Herald',
            html: html,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: templateString(getLangString('IAP_PRICE'), {
                price: `${price}`,
            }),
        }).then((result) => {
            if (result.value) {
                performUnlockExpansionIAP(productID, 0);
            }
        });
    }

    function buyExpansion2Swal() {
        if (!cloudManager.hasFullVersionEntitlement)
            return buyTheFullGameFirst();
        const productID = getExpansionIAPProductID(1);
        const price = isNativeApp() ? getIAPPrice(productID, true) : '$4.99 USD';
        let html = getLangString('IAP_PURCHASE_AOD_Q');
        if (!isNativeApp() && !isSteam() && !isEpicGames() && setLang == 'en')
            html += `<br><br><small class="font-w600">${getLangString('IAP_TOTH_GRANDFATHERED')}</small>`;
        SwalLocale.fire({
            title: 'Atlas of Discovery',
            html: html,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: templateString(getLangString('IAP_PRICE'), {
                price: `${price}`,
            }),
        }).then((result) => {
            if (result.value) {
                performUnlockExpansionIAP(productID, 1);
            }
        });
    }

    function buyExpansion3Swal() {
        if (!cloudManager.hasFullVersionEntitlement)
            return buyTheFullGameFirst();
        const productID = getExpansionIAPProductID(2);
        const price = isNativeApp() ? getIAPPrice(productID, true) : '$4.99 USD';
        let html = getLangString('IAP_PURCHASE_ITA_Q');
        if (!isNativeApp() && !isSteam() && !isEpicGames() && setLang == 'en')
            html += `<br><br><small class="font-w600">${getLangString('IAP_TOTH_GRANDFATHERED')}</small>`;
        SwalLocale.fire({
            title: 'Into the Abyss',
            html: html,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: templateString(getLangString('IAP_PRICE'), {
                price: `${price}`,
            }),
        }).then((result) => {
            if (result.value) {
                performUnlockExpansionIAP(productID, 2);
            }
        });
    }

    function buyExpandedEdition() {
        const productID = getExpandedEditionIAPProductID(0);
        performUnlockExpandedEditionIAP(productID);
    }

    function buyTheFullGameFirst() {
        SwalLocale.fire({
            title: getLangString('FULL_GAME_REQUIRED'),
            html: getLangString('IAP_TOTH_FULL_GAME_REQUIRED'),
            showCancelButton: false,
            icon: 'warning',
        });
    }

    function finalizePurchaseIAP(productID) {
        return __awaiter(this, void 0, void 0, function*() {
            if (!PlayFabClientSDK.IsClientLoggedIn())
                return (location.href = 'index.php'); // Reload if we aren't logged in
            if ((isIOS() && productID == productIDs.ios.fullGame) || (isAndroid() && productID == productIDs.android.fullGame))
                yield validateMobilePurchaseStatus();
            else if ((isIOS() && productID == productIDs.ios.expansions[0]) ||
                (isAndroid() && productID == productIDs.android.expansions[0]))
                yield validateMobileExpansionPurchaseStatus();
            else if ((isIOS() && productID == productIDs.ios.expansions[1]) ||
                (isAndroid() && productID == productIDs.android.expansions[1]))
                yield validateMobileExpansion2PurchaseStatus();
            else if ((isIOS() && productID == productIDs.ios.bundles[0]) ||
                (isAndroid() && productID == productIDs.android.bundles[0]))
                yield validateMobileExpandedEditionPurchaseStatus();
            else if ((isIOS() && productID == productIDs.ios.expansions[2]) ||
                (isAndroid() && productID == productIDs.android.expansions[2]))
                yield validateMobileExpansion3PurchaseStatus();
            location.href = 'index.php';
        });
    }

    function onIAPPurchases(data) {
        return __awaiter(this, void 0, void 0, function*() {
            if (nativeManager.isGeckoView && nativeManager.isAndroid)
                yield gonative.iap.info();
            console.log(JSON.stringify(data));
            receiptData = data;
            cloudManager.updateEntitlementsFromReceiptData();
            //If we are waiting for the purchase to finish, then reload the page
            if (waitingForPurchaseToFinish &&
                ((isIOS() && validateIOSIAP(data, productIDInPurchaseFlow)) ||
                    (isAndroid() && validateAndroidIAP(data, productIDInPurchaseFlow))))
                finalizePurchaseIAP(productIDInPurchaseFlow);
            nativeAppIAPLoaded = true;
        });
    }

    function onInfoReady(data) {
        console.log('gonative_info_ready');
        nativeIAPInfo = data;
    }

    function isIAPInitialized() {
        return nativeIAPInfo !== undefined;
    }

    function hasValidIOSExpandedEdition() {
        return validateIOSIAP(receiptData, productIDs.ios.bundles[0]);
    }

    function hasValidIOSFullGame() {
        return validateIOSIAP(receiptData, productIDs.ios.fullGame);
    }

    function hasValidIOSTotH() {
        return validateIOSIAP(receiptData, productIDs.ios.expansions[0]);
    }

    function hasValidIOSAoD() {
        return validateIOSIAP(receiptData, productIDs.ios.expansions[1]);
    }

    function hasValidIOSItA() {
        return validateIOSIAP(receiptData, productIDs.ios.expansions[2]);
    }

    function hasValidAndroidExpandedEdition() {
        return validateAndroidIAP(receiptData, productIDs.android.bundles[0]);
    }

    function hasValidAndroidFullGame() {
        return validateAndroidIAP(receiptData, productIDs.android.fullGame);
    }

    function hasValidAndroidTotH() {
        return validateAndroidIAP(receiptData, productIDs.android.expansions[0]);
    }

    function hasValidAndroidAoD() {
        return validateAndroidIAP(receiptData, productIDs.android.expansions[1]);
    }

    function hasValidAndroidItA() {
        return validateAndroidIAP(receiptData, productIDs.android.expansions[2]);
    }

    function hasReceiptData() {
        return receiptData !== undefined;
    }
    /** Promise that uses Playfab to check active purchase status of Mobile version */
    function validateMobilePurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                if (isAndroidFullVersionNativeApp()) {
                    PlayFabClientSDK.ExecuteCloudScript({
                        FunctionName: 'validateMobilePurchaseFullVersion',
                        FunctionParameter: {
                            receipt: receiptData
                        },
                    }, function(d, error) {
                        if (error !== null)
                            reject(error);
                        resolve(d.data.FunctionResult);
                    });
                } else {
                    PlayFabClientSDK.ExecuteCloudScript({
                        FunctionName: 'validateMobilePurchase',
                        FunctionParameter: {
                            receipt: receiptData
                        }
                    }, function(d, error) {
                        if (error !== null)
                            reject(error);
                        resolve(d.data.FunctionResult);
                    });
                }
            });
            return isMobilePurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Mobile version */
    function validateMobileExpansionPurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'validateMobileExpansionPurchase',
                    FunctionParameter: {
                        receipt: receiptData
                    }
                }, function(d, error) {
                    if (error !== null)
                        reject(error);
                    resolve(d.data.FunctionResult);
                });
            });
            return isMobilePurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status Atlas of Discovery for Mobile */
    function validateMobileExpansion2PurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'validateMobileExpansion2Purchase',
                    FunctionParameter: {
                        receipt: receiptData
                    }
                }, function(d, error) {
                    if (error !== null)
                        reject(error);
                    resolve(d.data.FunctionResult);
                });
            });
            return isMobilePurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status ItA for Mobile */
    function validateMobileExpansion3PurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'validateMobileExpansion3Purchase',
                    FunctionParameter: {
                        receipt: receiptData
                    }
                }, function(d, error) {
                    if (error !== null)
                        reject(error);
                    resolve(d.data.FunctionResult);
                });
            });
            return isMobilePurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status of the Mobile Expanded Edition version */
    function validateMobileExpandedEditionPurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'validateMobileExpandedEditionPurchase',
                    FunctionParameter: {
                        receipt: receiptData
                    },
                }, function(d, error) {
                    if (error !== null)
                        reject(error);
                    resolve(d.data.FunctionResult);
                });
            });
            return isMobilePurchased;
        });
    }
    constructor();
    return Object.freeze({
        get hasReceiptData() {
            return hasReceiptData();
        },
        get nativeAppIAPLoaded() {
            return nativeAppIAPLoaded;
        },
        get showNewAppBeta() {
            return showNewAppBeta;
        },
        get isIOS() {
            return isIOS();
        },
        get isAndroid() {
            return isAndroid();
        },
        get isGeckoView() {
            return isGeckoView();
        },
        get isMobile() {
            return isMobile();
        },
        get isSteam() {
            return isSteam();
        },
        get isEpicGames() {
            return isEpicGames();
        },
        get isDesktop() {
            return isDesktop();
        },
        get isUsingGreenworks() {
            return isUsingGreenworks();
        },
        get isUsingSteamworks() {
            return isUsingSteamworks();
        },
        get isNativeApp() {
            return isNativeApp();
        },
        get isAndroidFullVersionNativeApp() {
            return isAndroidFullVersionNativeApp();
        },
        get isIAPInitialized() {
            return isIAPInitialized();
        },
        togglePlatformSpecificElements,
        /*
        Disabled these from being exposed until push notifications implemented again. May adjust how this works
        schedulePushNotification,
        cancelPushNotification,
        saveScheduledPushNotification,
        findScheduledPushNotification,
        findUniqueScheduledPushNotification,
        */
        encode,
        decode,
        convertOldNotifications,
        attemptToClearCache,
        clearWebviewCache,
        downloadFile,
        /*
        Disabled these from being exposed as they currently are not used by anything
        sharePage,
        openAppSettings,
        setDeviceBrightness,
        setNonPersistentLocalSetting,
        getNonPersistentLocalSetting,
        deleteNonPersistentLocalSetting,
        deleteAllNonPersistentLocalSettings,
        setPersistentLocalSetting,
        getPersistentLocalSetting,
        deletePersistentLocalSetting,
        deleteAllPersistentLocalSettings,
        triggerHaptic,
        promptForAppReview,
        */
        saveToNativeCloudBackup,
        getNativeCloudBackup,
        deleteNativeCloudBackup,
        deletetAllNativeCloudBackup,
        purchaseIAP,
        restorePurchases,
        validateMobilePurchaseStatus,
        validateMobileExpansionPurchaseStatus,
        validateMobileExpansion2PurchaseStatus,
        validateMobileExpandedEditionPurchaseStatus,
        hasValidIOSExpandedEdition,
        hasValidIOSFullGame,
        hasValidIOSTotH,
        hasValidIOSAoD,
        hasValidIOSItA,
        hasValidAndroidExpandedEdition,
        hasValidAndroidFullGame,
        hasValidAndroidTotH,
        hasValidAndroidAoD,
        hasValidAndroidItA,
        getIAPPrice,
        buyFullGameSwal,
        buyFullGame,
        buyExpansion1Swal,
        buyExpansion2Swal,
        buyExpandedEdition,
        onIAPPurchases,
        onInfoReady,
        updateLocalPriceElements,
        buyExpansion3Swal,
        validateMobileExpansion3PurchaseStatus,
    });
})();

function gonative_iap_purchases(data) {
    nativeManager.onIAPPurchases(data);
}

function gonative_info_ready(data) {
    nativeManager.onInfoReady(data);
}

function median_library_ready() {
    median_match_statusbar_to_body_background_color();
    if (navigator.userAgent.indexOf('median') > -1) {
        median.screen.setMode({
            mode: 'auto'
        });
    }
}
//# sourceMappingURL=nativeManager.js.map
checkFileVersion('?12097')