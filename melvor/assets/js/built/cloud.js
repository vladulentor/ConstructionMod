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
const CLOUDURL = '';
const ENABLEPLAYFABAUTH = false;
PlayFab.settings.titleId = 'E3855';
/** Future function to be used to determine whether or not the correct URL origin is used to access the game */
const gameOriginCheck = function() {
    return true;
};
/** Character Selection UI update if connection to PlayFab Failed */
function connectionFailedPlayFab() {
    $('.playfab-connection-text').removeClass('text-info');
    $('.playfab-connection-text').addClass('text-danger');
    $('.playfab-connection-status').addClass('d-none');
    $('.playfab-connection-times').removeClass('d-none');
    warnActivationNotLoggedIn();
}
/** Character Selection UI update if connection to PlayFab Failed */
function connectionSuccessPlayFab() {
    $('.playfab-connection-text').removeClass('text-info');
    $('.playfab-connection-text').addClass('text-success');
    $('.playfab-connection-status').addClass('d-none');
    $('.playfab-connection-check').removeClass('d-none');
}
/** Game version checker to notify idle players of an update that was released */
function checkGameVersion() {
    $.ajax({
        url: CLOUDURL + 'cloud/versionCheck.php',
        type: 'POST',
        async: true,
        data: {
            checkGameVersion: 1,
        },
        success: function(data) {
            if (data !== gameVersion)
                $('#game-update-notification').removeClass('d-none');
        },
    });
}
/** Loads/Creates the Cloud Settings area within the Settings Page */
function loadCloudOptions(isCloud) {
    if (isCloud) {
        $('#header-cloud-save-btn-disconnected').addClass('d-none');
        $('#header-cloud-save-btn-connecting').addClass('d-none');
        $('#header-cloud-save-btn-connected').removeClass('d-none');
        $('#header-cloud-save-time').removeClass('d-none');
        $('#header-cloud-status-options').html(`<h5 class="dropdown-header">${getLangString('CHARACTER_SELECT_79')}</h5>
			<div class="dropdown-item d-flex align-items-center justify-content-between">
				<small id="cloud-dropdown-username">${getLangString('CHARACTER_SELECT_76')} ${cloudManager.cloudUsername}
				</small>
			</div>
			<a class="dropdown-item d-flex align-items-center justify-content-between" href="cloud/logout.php">
				<span class="text-danger">${getLangString('CHARACTER_SELECT_8')}</span>
			</a>`);
        $('#settings-cloud-options').html('');
        $('#settings-push-notifications').removeClass('d-none');
        let s = '';
        s += `<h2 class="content-heading border-bottom mb-4 pb-2">${getLangString('CHARACTER_SELECT_83')}</h2>
                <div class="row">
                    <div class="col-md-6 offset-md-3">
                      <settings-switch class="mb-4" data-setting-id="autoCloudSave" data-size="large"></settings-switch>
                    </div>
                </div>`;
        $('#settings-cloud-options').html(s);
        $('.cloud-save-close').removeClass('d-none');
        $('.dropdown-melvor-cloud').removeClass('d-none');
        if (game.settings.autoCloudSave && confirmedLoaded)
            cloudManager.forceUpdatePlayFabSave();
    } else {
        if (!PlayFabClientSDK.IsClientLoggedIn()) {
            $('#header-cloud-status').html(`${getLangString('CHARACTER_SELECT_89')} <span class="badge badge-pill badge-danger">${getLangString('CHARACTER_SELECT_88')}</span>`);
            $('#header-cloud-save-btn-disconnected').removeClass('d-none');
            $('#header-cloud-save-btn-connecting').addClass('d-none');
            $('#header-cloud-save-btn-connected').addClass('d-none');
            $('#header-cloud-save-time').addClass('d-none');
            $('#header-cloud-status-options').html(`<a class="dropdown-item d-flex align-items-center justify-content-between pointer-enabled" href="index.php"><span>${getLangString('CHARACTER_SELECT_86')}</span></a><a class="dropdown-item d-flex align-items-center justify-content-between" href="index.php"><span>${getLangString('CHARACTER_SELECT_87')}</span></a>`);
            $('#settings-cloud-options').html('');
            $('.cloud-save-close').addClass('d-none');
            $('#settings-push-notifications').addClass('d-none');
        } else
            $('#header-cloud-save-time').removeClass('d-none');
        $('.dropdown-melvor-cloud').addClass('d-none');
    }
    $('#header-account-icon').attr('src', game.currentGamemode.media);
    $('#header-account-icon-dropdown').attr('src', game.currentGamemode.media);
    if (isLoaded)
        game.settings.initializeToggles();
}
/**
 * Function used to get the value of a key from the PlayFab title data of the user.
 * @param {string} key - The key to get the value of
 * @returns {string} The value of the key
 */
function getPlayFabData(key) {
    const Keys = [key];
    const requestData = {
        Keys
    };
    const data = new Promise((resolve, reject) => {
        PlayFabClientSDK.GetUserData(requestData, function(result, error) {
            if (error) {
                console.log('PlayFab Event Failed.');
                console.log('PlayFab Error: ' + PlayFab.GenerateErrorReport(error));
                return reject(error);
            }
            if (result && result.data && result.data.Data && result.data.Data[key] != undefined)
                return resolve(result.data.Data[key].Value);
            resolve(undefined);
        });
    });
    return data;
}
/**
 * Stores key:value pairs in the PlayFab title data of the user.
 * @param {string} key - The key to set the value of
 * @param {any} value - The value to set the key to
 */
function playFabStoreData(key, value) {
    const data = {
        [key]: value,
    };
    const requestData = {
        Data: data,
    };
    if (requestData !== null) {
        PlayFabClientSDK.UpdateUserData(requestData, playFabStoreDataCallback);
    }
}
/** Callback for above store data method */
function playFabStoreDataCallback(result, error) {
    if (result !== null) {
        console.log('PlayFab Data Stored successfully.');
    }
    if (error !== null) {
        console.log('PlayFab Event Failed.');
        console.log('PlayFab Error: ' + PlayFab.GenerateErrorReport(error));
    }
}
/** Cloud save deleted notification */
function showPlayFabSaveDeletedNotification() {
    fireTopToast(`<div class="block block-rounded-double bg-dark p-2">
  <div class="media d-flex align-items-center push">
    <div class="mr-2"><img class="skill-icon-md" src="${assets.getURI('assets/media/main/cloud.png')}"></div>
    <div class="media-body text-left">
      <div class="font-w700 font-size-lg text-danger">${getLangString('TOASTS_CLOUD_SAVE_DELETED')}</div>
      <div class="font-size-sm">
        ${getLangString('TOASTS_HOPEFULLY_INTENDED')}
      </div>
    </div>
  </div>
</div>`, 3000);
}

function createPlayFabSaves() {
    return game.generateSaveString();
}

function enableCloudCharacterButton() {
    $('.character-selection-toggle').removeAttr('disabled');
    if (currentSaveView === 1 /* SaveViewType.Cloud */ )
        $('#character-selection-toggle-refresh').removeAttr('disabled');
}

function registerToMelvorCloud() {
    return __awaiter(this, void 0, void 0, function*() {
        if (ENABLEPLAYFABAUTH) {
            const username = $('#cloud-register-form-username').val();
            $('#cloud-register-form-error').addClass('d-none');
            disableRegisterForm();
            window.setTimeout(function() {
                $.ajax({
                    url: CLOUDURL + 'cloud/checkCloudUsername.php',
                    type: 'POST',
                    async: true,
                    data: {
                        register: 1,
                        username: username,
                    },
                    success: function(data) {
                        enableRegisterForm();
                        $('#cloud-register-form-error').text(data);
                        $('#cloud-register-form-error').removeClass('d-none');
                    },
                });
            }, 500);
        } else {
            const username = $('#cloud-register-form-username').val();
            const password = $('#cloud-register-form-password').val();
            const passwordConfirm = $('#cloud-register-form-password-confirm').val();
            const email = $('#cloud-register-form-email').val();
            const saves = ['', '', '', '', ''];
            for (let i = 0; i < 5; i++) {
                saves[i] = yield getLocalSaveString(true, i);
            }
            $('#cloud-register-form-error').addClass('d-none');
            disableRegisterForm();
            window.setTimeout(function() {
                $.ajax({
                    url: CLOUDURL + 'cloud/registerToCloud.php',
                    type: 'POST',
                    async: true,
                    data: {
                        register: 1,
                        username: username,
                        password: password,
                        confirmPassword: passwordConfirm,
                        email: email,
                        savegame: saves[0],
                        savegame_2: saves[1],
                        savegame_3: saves[2],
                        savegame_4: saves[3],
                        savegame_5: saves[4],
                    },
                    success: function(data) {
                        if (data === '1') {
                            enableRegisterForm();
                            SwalLocale.fire({
                                icon: 'success',
                                title: 'Successfully Registered!',
                                html: `<span class="text-dark">You may now log in.</span>`,
                            });
                            changePageCharacterSelection(1 /* CharacterSelectPage.Login */ );
                        } else {
                            enableRegisterForm();
                            $('#cloud-register-form-error').text(data);
                            $('#cloud-register-form-error').removeClass('d-none');
                        }
                    },
                });
            }, 500);
        }
    });
}

function forgotPasswordMelvorCloud() {
    const email = $('#cloud-forgot-form-email').val();
    $('#cloud-forgot-form-error').addClass('d-none');
    disableForgotForm();
    window.setTimeout(function() {
        $.ajax({
            url: CLOUDURL + 'cloud/forgotPasswordToCloud.php',
            type: 'POST',
            async: true,
            data: {
                forgotPassword: 1,
                email: email,
            },
            success: function(data) {
                if (data === '1') {
                    SwalLocale.fire({
                        icon: 'success',
                        title: 'Submitted!',
                        html: `<span class="text-dark">Please check your email (and spam folder) for the reset link.</span>`,
                    });
                    changePageCharacterSelection(0 /* CharacterSelectPage.SelectCharacter */ );
                } else {
                    enableForgotForm();
                    $('#cloud-forgot-form-error').removeClass('d-none');
                    $('#cloud-forgot-form-error').text('Unsuccessful. Usually this means you did not attach an email to your Cloud account when registering :(');
                }
            },
        });
    }, 500);
}

function disableLoginForm() {
    $('#cloud-login-form-spinner').removeClass('d-none');
    $('#cloud-login-form').addClass('d-none');
    $('#cloud-login-form-username').prop('disabled', true);
    $('#cloud-login-form-password').prop('disabled', true);
    $('#cloud-login-form-submit').prop('disabled', true);
}

function enableLoginForm() {
    $('#cloud-login-form-spinner').addClass('d-none');
    $('#cloud-login-form').removeClass('d-none');
    $('#cloud-login-form-username').prop('disabled', false);
    $('#cloud-login-form-password').prop('disabled', false);
    $('#cloud-login-form-submit').prop('disabled', false);
}

function disableRegisterForm() {
    $('#cloud-register-form-spinner').removeClass('d-none');
    $('#cloud-register-form').addClass('d-none');
    $('#cloud-register-form-username').prop('disabled', true);
    $('#cloud-register-form-password').prop('disabled', true);
    $('#cloud-register-form-password-confirm').prop('disabled', true);
    $('#cloud-register-form-email').prop('disabled', true);
    $('#cloud-register-form-submit').prop('disabled', true);
}

function enableRegisterForm() {
    $('#cloud-register-form-spinner').addClass('d-none');
    $('#cloud-register-form').removeClass('d-none');
    $('#cloud-register-form-username').prop('disabled', false);
    $('#cloud-register-form-password').prop('disabled', false);
    $('#cloud-register-form-password-confirm').prop('disabled', false);
    $('#cloud-register-form-email').prop('disabled', false);
    $('#cloud-register-form-submit').prop('disabled', false);
}

function disableForgotForm() {
    $('#cloud-forgot-form-spinner').removeClass('d-none');
    $('#cloud-forgot-form').addClass('d-none');
    $('#cloud-forgot-form-email').prop('disabled', true);
    $('#cloud-forgot-form-submit').prop('disabled', true);
}

function enableForgotForm() {
    $('#cloud-forgot-form-spinner').addClass('d-none');
    $('#cloud-forgot-form').removeClass('d-none');
    $('#cloud-forgot-form-email').prop('disabled', false);
    $('#cloud-forgot-form-submit').prop('disabled', false);
}

function disableChangeEmailForm() {
    $('#formElements-characterSelect-email-error').addClass('d-none');
    $('#formElements-characterSelect-email').prop('disabled', true);
    $('#formElements-characterSelect-email-submit').prop('disabled', true);
}

function enableChangeEmailForm() {
    $('#formElements-characterSelect-email-submit').html('Update');
    $('#formElements-characterSelect-email-input').prop('disabled', false);
    $('#formElements-characterSelect-email-submit').prop('disabled', false);
}

function disableChangePasswordForm() {
    $('#cloud-manage-form-password-error').addClass('d-none');
    $('#cloud-manage-form-password-current').prop('disabled', true);
    $('#cloud-manage-form-password-new').prop('disabled', true);
    $('#cloud-manage-form-password-new-confirm').prop('disabled', true);
    $('#cloud-manage-form-password-btn').prop('disabled', true);
}

function enableChangePasswordForm() {
    $('#cloud-manage-form-password-btn').html(getLangString('CHARACTER_SELECT_60'));
    $('#cloud-manage-form-password-current').prop('disabled', false);
    $('#cloud-manage-form-password-new').prop('disabled', false);
    $('#cloud-manage-form-password-new-confirm').prop('disabled', false);
    $('#cloud-manage-form-password-btn').prop('disabled', false);
}

function updateEmailMelvorCloud() {
    const newEmail = $('#formElements-characterSelect-email-input').val();
    disableChangeEmailForm();
    $('#formElements-characterSelect-email-submit').html(`<span class="spinner-border spinner-border-sm text-info mr-2" role="status"></span>`);
    window.setTimeout(function() {
        $.ajax({
            url: CLOUDURL + 'cloud/changeEmailToCloud.php',
            type: 'POST',
            async: true,
            data: {
                changeEmail: 1,
                email: newEmail,
            },
            success: function(data) {
                if (data === '1') {
                    SwalLocale.fire({
                        icon: 'success',
                        html: `<span class="text-dark">Your email has been updated successfully.</span>`,
                    });
                    enableChangeEmailForm();
                } else {
                    enableChangeEmailForm();
                    $('#formElements-characterSelect-email-error').removeClass('d-none');
                    $('#formElements-characterSelect-email-error').text('Unable to update email. Please confirm a valid email was entered.');
                }
            },
        });
    }, 500);
}

function updatePasswordMelvorCloud() {
    const currentPassword = $('#cloud-manage-form-password-current').val();
    const newPassword = $('#cloud-manage-form-password-new').val();
    const newPasswordConfirm = $('#cloud-manage-form-password-new-confirm').val();
    disableChangePasswordForm();
    $('#cloud-manage-form-password-btn').html(`<span class="spinner-border spinner-border-sm text-info mr-2" role="status"></span>`);
    window.setTimeout(function() {
        $.ajax({
            url: CLOUDURL + 'cloud/changePasswordToCloud.php',
            type: 'POST',
            async: true,
            data: {
                changePassword: 1,
                currentPassword: currentPassword,
                newPassword: newPassword,
                newPasswordConfirm: newPasswordConfirm,
            },
            success: function(data) {
                if (data === '1') {
                    SwalLocale.fire({
                        icon: 'success',
                        html: "<span class='text-dark'>Your password has been updated successfully.</span>",
                    });
                    $('#cloud-manage-form-password-current').val('');
                    $('#cloud-manage-form-password-new').val('');
                    $('#cloud-manage-form-password-new-confirm').val('');
                    enableChangePasswordForm();
                } else {
                    enableChangePasswordForm();
                    $('#cloud-manage-form-password-error').removeClass('d-none');
                    $('#cloud-manage-form-password-error').text(data);
                }
            },
        });
    }, 500);
}
/** Links the user's Steam ID to their PlayFab account which can be used alongside Steam Web API */
const linkSteamAccountToPlayFab = function(forceLink) {
    if (nativeManager.isSteam && PlayFabClientSDK.IsClientLoggedIn()) {
        try {
            if (nativeManager.isUsingGreenworks && parent.greenworks.init() && parent.greenworks.initAPI()) {
                parent.greenworks.getAuthSessionTicket(function(ticket) {
                    PlayFabClientSDK.ExecuteCloudScript({
                        FunctionName: 'performSteamLink',
                        FunctionParameter: {
                            ticket: ticket.ticket.toString('hex')
                        }
                    }, function(d, error) {
                        if (error)
                            console.log(error);
                    });
                }, function(e) {
                    console.log('Error getting Steam Auth Ticket');
                });
            } else if (nativeManager.isUsingSteamworks) {
                parent.steamworksClient.auth
                    .getSessionTicket()
                    .then((ticket) => {
                        PlayFabClientSDK.ExecuteCloudScript({
                            FunctionName: 'performSteamLink',
                            FunctionParameter: {
                                ticket: ticket.getBytes().toString('hex')
                            }
                        }, function(d, error) {
                            if (error)
                                console.log(error);
                        });
                    })
                    .catch((e) => {
                        console.log('Error getting Steam Auth Ticket');
                    });
            }
        } catch (e) {
            console.warn('Steam Account Link failed:' + e);
        }
    }
};
/** Genereates a UUID for active user tracking */
function generateUUID(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function failMobilePurchase() {
    $('.full-activation-status-mobile-spinner').addClass('d-none');
    $('.full-activation-status-mobile-check').addClass('d-none');
    $('.full-activation-status-mobile-times').removeClass('d-none');
    $('.full-activation-status-mobile-warning').addClass('d-none');
}

function confirmMobilePurchase() {
    $('.full-activation-status-mobile-spinner').addClass('d-none');
    $('.full-activation-status-mobile-check').removeClass('d-none');
    $('.full-activation-status-mobile-times').addClass('d-none');
    $('.full-activation-status-mobile-warning').addClass('d-none');
    hideActivationError(2);
}

function warningMobilePurchase() {
    $('.full-activation-status-mobile-spinner').addClass('d-none');
    $('.full-activation-status-mobile-check').addClass('d-none');
    $('.full-activation-status-mobile-times').addClass('d-none');
    $('.full-activation-status-mobile-warning').removeClass('d-none');
}

function failBrowserPurchase() {
    $('.full-activation-status-browser-spinner').addClass('d-none');
    $('.full-activation-status-browser-check').addClass('d-none');
    $('.full-activation-status-browser-times').removeClass('d-none');
    $('.full-activation-status-browser-warning').addClass('d-none');
}

function confirmBrowserPurchase() {
    $('.full-activation-status-browser-spinner').addClass('d-none');
    $('.full-activation-status-browser-check').removeClass('d-none');
    $('.full-activation-status-browser-times').addClass('d-none');
    $('.full-activation-status-browser-warning').addClass('d-none');
    hideActivationError(2);
}

function warningBrowserPurchase() {
    $('.full-activation-status-browser-spinner').addClass('d-none');
    $('.full-activation-status-browser-check').addClass('d-none');
    $('.full-activation-status-browser-times').addClass('d-none');
    $('.full-activation-status-browser-warning').removeClass('d-none');
}

function showActivationError(error) {
    $(`.full-activation-status-error-${error}`).removeClass('d-none');
}

function hideActivationError(error) {
    $(`.full-activation-status-error-${error}`).addClass('d-none');
}

function warnActivationNotLoggedIn() {
    //warningSteamPurchase();
    warningMobilePurchase();
    warningBrowserPurchase();
    showActivationError(2);
}
const updatePlayerTags = function() {
    console.log('updatePlayerTags');
    let tag = 'Unknown';
    if (nativeManager.isSteam)
        tag = 'Steam';
    else if (nativeManager.isAndroid)
        tag = 'Android';
    else if (nativeManager.isIOS)
        tag = 'iOS';
    else if (location.origin === 'https://melvoridle.com')
        tag = 'Web';
    PlayFabClientSDK.ExecuteCloudScript({
        FunctionName: 'applyPlayerTag',
        FunctionParameter: {
            device: tag
        }
    }, () => {});
};
const updatePlayerLangTags = function() {
    if (!PlayFabClientSDK.IsClientLoggedIn())
        return;
    console.log('updatePlayerTags');
    PlayFabClientSDK.ExecuteCloudScript({
        FunctionName: 'applyPlayerTag',
        FunctionParameter: {
            device: setLang
        }
    }, () => {});
};
//# sourceMappingURL=cloud.js.map
checkFileVersion('?12097')