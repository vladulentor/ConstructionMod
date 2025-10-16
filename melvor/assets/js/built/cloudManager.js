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
const cloudManager = (() => {
    const TITLE_ID = 'E3855';
    const enableAccountCreation = true;
    const enableMelvorCloudRegistration = true;
    const enableSkipRegistration = true;
    const maxSaveSlots = 8;
    const enableSignInWithApple = false;
    const enableSignInWithGoogle = false;
    const enableSignInWithMelvorCloud = true;
    const enableSteamCloud = false;
    const enableMelvorCloudBypass = false; // TODO_R: SET TO FALSE FOR PRODUCTION
    const cloudBypassMode = 6 /* CloudBypassMode.AllExpacs */ ;
    const PLAYFAB_SAVE_INTERVAL = 10; // IN SECONDS
    const PLAYFAB_TOKEN_REFRESH_INTERVAL = 16; // IN HOURS
    let PLAYFAB_AUTO_SAVE_INTERVAL = 23; //IN HOURS - default to 23hr auto cloud save if not set
    const melvorCloudLoginURL = 'cloud/api/';
    const grandfatheredTimestamp = 1634774400000;
    const expansionRelease = 1694095200000;
    const itaReleaseDate = 1718290800000;
    const remindLaterDuration = 172800000;
    const birthdayEvent2023Begin = 1695276000000;
    const birthdayEvent2023End = 1698199200000;
    const aprilFoolsEvent2024End = 1714532399000;
    let accountCreated = '';
    let isAuthenticated = false;
    let canAccessTest = false;
    let showTestLink = false;
    const DEBUG = false;
    let appleToken = '';
    let googleToken = '';
    let customID = '';
    let EOSAccessToken = '';
    let JWT = '';
    let disableSocialSignIn = false;
    let JWTData;
    let accountInfo;
    let playfabSaves = {};
    let patreonAccessToken = '';
    let patreonRefreshToken = '';
    let lastSaveTimestamp = 0;
    let playFabLoginTimestamp = 0;
    let isRedirectingToEOSAuthentication = false;
    let EOSConsentFailed = false;
    const entitlements = {
        fullGame: false,
        TotH: false,
        AoD: false,
        ItA: false,
    };
    const enabledExpansions = {
        TotH: true,
        AoD: true,
        ItA: true,
    };
    const formElements = {
        default: {
            title: document.getElementById('formElements-default-title'),
            logo: document.getElementById('formElements-default-logo'),
        },
        signIn: {
            container: document.getElementById('formElements-signIn-container'),
            submit: document.getElementById('formElements-signIn-submit'),
            username: document.getElementById('formElements-signIn-username'),
            password: document.getElementById('formElements-signIn-password'),
            error: document.getElementById('formElements-signIn-error'),
            withSocialsTitle: document.getElementById('formElements-signIn-withSocialsTitle'),
        },
        register: {
            container: document.getElementById('formElements-register-container'),
            submit: document.getElementById('formElements-register-submit'),
            username: document.getElementById('formElements-register-username'),
            password: document.getElementById('formElements-register-password'),
            confirmPassword: document.getElementById('formElements-register-confirmPassword'),
            email: document.getElementById('formElements-register-email'),
            error: document.getElementById('formElements-register-error'),
        },
        forgot: {
            container: document.getElementById('formElements-forgot-container'),
            submit: document.getElementById('formElements-forgot-submit'),
            email: document.getElementById('formElements-forgot-email'),
            error: document.getElementById('formElements-forgot-error'),
        },
        characterSelect: {
            email: {
                input: document.getElementById('formElements-characterSelect-email-input'),
                submit: document.getElementById('formElements-characterSelect-email-submit'),
                error: document.getElementById('formElements-characterSelect-email-error'),
            },
            changePassword: {
                currentPassword: document.getElementById('formElements-characterSelect-changePassword-currentPassword'),
                newPassword: document.getElementById('formElements-characterSelect-changePassword-newPassword'),
                confirmNewPassword: document.getElementById('formElements-characterSelect-changePassword-confirmNewPassword'),
                submit: document.getElementById('formElements-characterSelect-changePassword-submit'),
                error: document.getElementById('formElements-characterSelect-changePassword-error'),
            },
        },
        signInWithApple: {
            native: {
                register: document.getElementById('formElements-signInWithApple-native-register'),
                login: document.getElementById('formElements-signInWithApple-native-login'),
            },
            browser: document.getElementById('appleid-signin'),
        },
        signInWithGoogle: {
            native: document.getElementById('formElements-signInWithGoogle-native'),
            browser: document.getElementById('formElements-signInWithGoogle-browser'),
        },
        env: {
            container: document.getElementById('formElements-env-container'),
            baseGame: document.getElementById('formElements-env-baseGame'),
            testServer: document.getElementById('formElements-env-testServer'),
            desktopTest: document.getElementById('formElements-env-desktopTest'),
            mobileTest: document.getElementById('formElements-env-mobileTest'),
            patreonConnect: document.getElementById('formElements-env-patreonConnect'),
        },
        language: {
            container: document.getElementById('formElements-language-container'),
        },
        debug: {
            container: document.getElementById('formElements-debug-container'),
            log: document.getElementById('formElements-debug-log'),
            status: document.getElementById('page-loader-status-text'),
            pageLoader: document.getElementById('m-page-loader'),
        },
    };
    const formInnerHTML = {
        signIn: {
            submit: {
                original: '',
            },
        },
        register: {
            submit: {
                original: '',
            },
        },
        forgot: {
            submit: {
                original: '',
            },
        },
        changePassword: {
            submit: {
                original: '',
            },
        },
    };
    const defaultPlayFabPurchaseValidation = {
        baseGame: false,
        TotH: false,
        AoD: false,
        ItA: false,
    };

    function isEpicAccountLinked() {
        return localStorage.getItem('epicAccountLinked') === '1';
    }

    function constructor() {
        if (isOnAuthPage())
            onAuthPageLoad();
    }

    function cloudUsername() {
        var _a;
        return (_a = JWTData === null || JWTData === void 0 ? void 0 : JWTData.username) !== null && _a !== void 0 ? _a : 'Error getting username';
    }

    function inProgressSpinner() {
        return `<div class="spinner-border spinner-border-sm text-light" role="status"><span class="sr-only">Loading...</span></div>`;
    }

    function btnSubmitInnerHTML() {
        return `<i class="fa fa-fw fa-sign-in-alt mr-1 opacity-50"></i> <lang-string lang-id="CHARACTER_SELECT_6"></lang-string>`;
    }

    function btnPatreonConnectSpinner() {
        return `<div class="spinner-border spinner-border-sm text-light" role="status"><span class="sr-only">Please wait...</span></div>`;
    }

    function isTest() {
        return (location.origin.includes('test.melvoridle.com') &&
            !location.pathname.includes('expandedEdition') &&
            !location.pathname.includes('birthday2023') &&
            !location.pathname.includes('beta') &&
            !location.pathname.includes('public_test'));
    }

    function isBeta() {
        return location.pathname.includes('beta') || location.pathname.includes('public_test');
    }

    function aodReleased() {
        const currentDateTime = new Date().getTime();
        return currentDateTime >= expansionRelease;
    }

    function itaReleased() {
        return new Date().getTime() >= itaReleaseDate;
    }

    function checkAuthentication() {
        return __awaiter(this, void 0, void 0, function*() {
            setStatus(getLangString('MENU_TEXT_LOADING_MSG_AUTH_CLOUD'));
            return isAuthenticated;
        });
    }

    function hasFullVersionEntitlement() {
        return entitlements.fullGame || nativeManager.isSteam || nativeManager.isEpicGames;
    }

    function hasTotHEntitlement() {
        return hasFullVersionEntitlement() && entitlements.TotH;
    }

    function hasTotHEntitlementAndIsEnabled() {
        return hasTotHEntitlement() && enabledExpansions.TotH;
    }

    function hasAoDEntitlement() {
        return hasFullVersionEntitlement() && entitlements.AoD;
    }

    function hasAoDEntitlementAndIsEnabled() {
        return hasAoDEntitlement() && enabledExpansions.AoD;
    }

    function hasItAEntitlement() {
        return hasFullVersionEntitlement() && entitlements.ItA;
    }

    function hasItAEntitlementAndIsEnabled() {
        return hasItAEntitlement() && enabledExpansions.ItA;
    }

    function isBirthdayEvent2023Active() {
        return false;
    }

    function isAprilFoolsEvent2024Active() {
        const currentDateTime = new Date().getTime();
        return currentDateTime < aprilFoolsEvent2024End && hasFullVersionEntitlement();
    }
    /** If the user owns any expansion to the game */
    function hasExpansionEntitlement() {
        return entitlements.TotH || entitlements.AoD || entitlements.ItA;
    }
    /** If the user owns any expansion to the game and is currently enabled */
    function hasExpansionEntitlementAndIsEnabled() {
        return hasTotHEntitlementAndIsEnabled() || hasAoDEntitlementAndIsEnabled() || hasItAEntitlementAndIsEnabled();
    }
    /** Perform these functions if player is sitting on main authentication page (index.php) */
    function onAuthPageLoad() {
        if (!isOnAuthPage())
            return;
        initDebug();
        createOnClickEvents();
        if (!enableSignInWithApple)
            removeSignInWithApple();
        if (!enableSignInWithGoogle)
            removeSignInWithGoogle();
        if (!enableSignInWithApple && !enableSignInWithGoogle)
            hideSignInWithSocialsTitle();
    }

    function hidePageLoader() {
        formElements.debug.pageLoader.classList.add('d-none');
        formElements.debug.pageLoader.classList.remove('show');
    }

    function showPageLoader() {
        setStatus('Loading...');
        formElements.debug.pageLoader.classList.add('show');
        formElements.debug.pageLoader.classList.remove('d-none');
    }

    function hideAllContainers() {
        hideSignInContainer();
        hideRegisterContainer();
        hideForgotContainer();
        hideEnvSelectionContainer();
    }

    function showEnvSelectionContainer() {
        formElements.env.container.classList.remove('d-none');
    }

    function hideEnvSelectionContainer() {
        formElements.env.container.classList.add('d-none');
    }

    function hideSignInContainer() {
        formElements.signIn.container.classList.add('d-none');
    }

    function showSignInContainer() {
        hideAllContainers();
        formElements.default.title.innerText = 'Sign In';
        formElements.signIn.container.classList.remove('d-none');
    }

    function showRegisterContainer() {
        if (!enableMelvorCloudRegistration || isTest())
            return registrationDisabled();
        hideAllContainers();
        formElements.default.title.innerText = 'Register';
        formElements.register.container.classList.remove('d-none');
    }

    function hideRegisterContainer() {
        formElements.register.container.classList.add('d-none');
    }

    function showForgotContainer() {
        hideAllContainers();
        formElements.default.title.innerText = 'Forgot Password';
        formElements.forgot.container.classList.remove('d-none');
    }

    function hideForgotContainer() {
        formElements.forgot.container.classList.add('d-none');
    }

    function removeSignInWithApple() {
        const elements = document.getElementsByClassName('signInWithApple');
        while (elements.length > 0) {
            elements[0].remove();
        }
    }

    function removeSignInWithGoogle() {
        const elements = document.getElementsByClassName('signInWithGoogle');
        while (elements.length > 0) {
            elements[0].remove();
        }
    }

    function hideSignInWithSocialsTitle() {
        formElements.signIn.withSocialsTitle.classList.add('d-none');
    }

    function showSignInWithSocialsTitle() {
        formElements.signIn.withSocialsTitle.classList.remove('d-none');
    }

    function showLanguageSelection() {
        hideAllContainers();
        formElements.language.container.classList.remove('d-none');
    }

    function getOldCloudTokens() {
        const selector = getCookie('random_selector');
        const random_password = getCookie('random_password');
        const username = getCookie('member_login');
        return {
            selector,
            random_password,
            username
        };
    }

    function hasOldCloudTokens() {
        const {
            selector,
            random_password,
            username
        } = getOldCloudTokens();
        return selector !== undefined && random_password !== undefined && username !== undefined;
    }
    /** Initiates a silent sign in using tokens stored from previous login sessions
     * This is done on first load of the game
     * Updates the status message to reflect the current state of the sign in process
     * TODO: clean up cloud bypass functionality
     */
    function initSilentSignIn() {
        return __awaiter(this, void 0, void 0, function*() {
            getTokensFromLocalStorage();
            if ((nativeManager.isIOS || nativeManager.isAndroid) && !nativeManager.isNativeApp) {
                location.href = 'updateApp.php';
                return;
            }
            // If there is a token stored, try to sign in with it
            // JWT first, then social sign ins
            setStatus(getLangString('MENU_TEXT_LOADING_MSG_ATTEMPTING_SIGN_IN'));
            if (JWT !== '') {
                log('Silent Sign in with JWT');
                try {
                    const data = yield performJWTValidation(JWT);
                    saveDataFromJWT(data);
                    initPlayFabLogin('customID');
                    isAuthenticated = true;
                    return;
                } catch (e) {
                    isAuthenticated = false;
                    log('JWT validation failed: ' + e);
                    removeJWTFromLocalStorage();
                    if (enableMelvorCloudBypass) {
                        if (localStorage.getItem('playFabID') !== null) {
                            customID = localStorage.getItem('playFabID');
                            initPlayFabLogin('customID');
                        } else if (!isOnAuthPage())
                            return (location.href = 'index.php');
                    }
                    if (!isOnAuthPage() && !enableMelvorCloudBypass)
                        return (location.href = 'index.php');
                    else
                        finalizeSignIn();
                }
            } else if (enableSignInWithApple && appleToken != '')
                handleSignInWithApple(appleToken);
            else if (hasOldCloudTokens()) {
                setStatus(getLangString('MENU_TEXT_LOADING_MSG_CONVERTING_TOKENS'));
                yield performMelvorCloudConversion();
            } else if (enableMelvorCloudBypass) {
                if (localStorage.getItem('playFabID') !== null) {
                    customID = localStorage.getItem('playFabID');
                    initPlayFabLogin('customID');
                } else if (!isOnAuthPage() && !enableSkipRegistration)
                    return (location.href = 'index.php');
                else
                    finalizeSignIn();
            } else if (isTest() && !enableMelvorCloudBypass && !isOnAuthPage()) {
                return (location.href = 'index.php');
            } else {
                finalizeSignIn();
            }
            if (appleToken !== '') {
                //do apple sign in
                return;
            }
            if (googleToken !== '') {
                //do google sign in
                return;
            }
            //hidePageLoader();
        });
    }
    /**
     * Performs the conversion process of old Melvor Cloud auth tokens to new JWT system
     * Used during the first load of the update
     */
    function performMelvorCloudConversion() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!hasOldCloudTokens())
                Promise.reject('No old cloud tokens found');
            const {
                selector,
                random_password,
                username
            } = getOldCloudTokens();
            log('Initiated Melvor Cloud token conversion');
            let loginRejected = false;
            try {
                const loginResponse = yield convertMelvorCloudViaPOST(selector, random_password, username);
                if (loginResponse.jwt !== undefined) {
                    try {
                        const data = yield performJWTValidation(loginResponse.jwt);
                        deleteOldTokenCookies();
                        continueSuccessfulMelvorCloudLogin(data);
                    } catch (e) {
                        finalizeSignIn();
                    }
                } else {
                    loginRejected = true;
                    log(loginResponse.message);
                }
            } catch (e) {
                loginRejected = true;
            }
            if (loginRejected)
                finalizeSignIn();
        });
    }

    function deleteOldTokenCookies() {
        deleteCookie('member_login');
        deleteCookie('random_selector');
        deleteCookie('random_password');
    }

    function continueSuccessfulMelvorCloudLogin(data) {
        saveDataFromJWT(data);
        initPlayFabLogin('customID');
        isAuthenticated = true;
    }
    /** Authenticate with Melvor Cloud via a POST request. Returns JWT session token on success.
     * @param selector - The random selector stored as a Cookie
     * @param random_password - The random password stored as a Cookie
     * @param username - The username stored as a Cookie
     * @returns JSON containing the JWT session token on success
     */
    function convertMelvorCloudViaPOST(selector, random_password, username) {
        log('Converting Melvor Cloud tokens to JWT via POST');
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', melvorCloudLoginURL + 'loginWithOldToken.php');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch (e) {
                    reject();
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            const data = JSON.stringify({
                member_login: username,
                random_selector: selector,
                random_password: random_password,
            });
            xhr.send(data);
        });
    }

    function isNativeAppLoadedYet() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;
            const interval = setInterval(() => {
                if (nativeManager.nativeAppIAPLoaded) {
                    clearInterval(interval);
                    resolve(true);
                }
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 100);
        });
    }

    function loadGameData() {
        return __awaiter(this, void 0, void 0, function*() {
            yield game.fetchAndRegisterDataPackage(`assets/data/melvorDemo.json?${DATA_VERSION}`);
            console.log('Registered Demo Data.');
            if (hasFullVersionEntitlement()) {
                yield game.fetchAndRegisterDataPackage(`assets/data/melvorFull.json?${DATA_VERSION}`);
                console.log('Registered Full Version Data.');
                if (isBirthdayEvent2023Active()) {
                    yield game.fetchAndRegisterDataPackage(`assets/data/melvorBirthday2023.json?${DATA_VERSION}`);
                    console.log('Registered Birthday Event 2023 Data.');
                }
                if (isAprilFoolsEvent2024Active()) {
                    yield game.fetchAndRegisterDataPackage(`assets/data/melvorAprilFools2024.json?${DATA_VERSION}`);
                    console.log('Registered April Fools Event 2024 Data.');
                }
                if (hasTotHEntitlementAndIsEnabled()) {
                    yield game.fetchAndRegisterDataPackage(`assets/data/melvorTotH.json?${DATA_VERSION}`);
                    console.log('Registered Throne of the Herald Data.');
                }
                if (hasAoDEntitlementAndIsEnabled()) {
                    yield game.fetchAndRegisterDataPackage(`assets/data/melvorExpansion2.json?${DATA_VERSION}`);
                    game.cartography.registerKeyBinds();
                    console.log('Registered Atlas of Discovery Data.');
                }
                if (hasItAEntitlementAndIsEnabled()) {
                    yield game.fetchAndRegisterDataPackage(`assets/data/melvorItA.json?${DATA_VERSION}`);
                    console.log('Registered Into the Abyss Data.');
                }
            }
        });
    }
    /** Final step of a successful sign in. Used to enter the game or initiate test server access */
    function finalizeSignIn() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Authenticated w/ Melvor Cloud: ' + isAuthenticated);
            log('Authenticated w/ PlayFab: ' + PlayFabClientSDK.IsClientLoggedIn());
            if (nativeManager.isSteam && DEBUGENABLED) {
                console.log('Is using greenworks:', nativeManager.isUsingGreenworks);
                console.log('Is using steamworks:', nativeManager.isUsingSteamworks);
            }
            // Silently store access token if using Epic games client
            // Must be done prior to loading away from auth page
            if (nativeManager.isEpicGames) {
                const wasRunViaEpic = yield wasGameLaunchedViaEpicGamesStore();
                if (!wasRunViaEpic) {
                    showEpicGamesLaunchError();
                    return;
                }
                yield storeEpicGamesAcccessToken();
            }
            if (!isOnAuthPage()) {
                // Check that the game file version check passed
                if (!gameFileVersionCheckPassed) {
                    showFileVersionMismatch();
                    return;
                }
                // Silently link Epic Games account on load if using Epic games client
                // Must be done prior to entitlement checks
                if (nativeManager.isEpicGames && PlayFabClientSDK.IsClientLoggedIn())
                    yield linkEpicGamesAccountToPlayFab();
                // Check entitlements
                if (nativeManager.isNativeApp && !nativeManager.nativeAppIAPLoaded) {
                    const nativeLoaded = yield isNativeAppLoadedYet();
                    if (!nativeLoaded)
                        console.warn('Native App IAP failed to load.');
                }
                if (PlayFabClientSDK.IsClientLoggedIn() && !enableMelvorCloudBypass && !DEBUGENABLED && !isTest()) {
                    const hasEntitlements = yield getEntitlementPurchaseStatus();
                    if (hasEntitlements.baseGame)
                        entitlements.fullGame = true;
                    if (hasEntitlements.TotH)
                        entitlements.TotH = true;
                    if (hasEntitlements.AoD)
                        entitlements.AoD = true;
                    if (hasEntitlements.ItA)
                        entitlements.ItA = true;
                }
                const hasFull = yield hasFullGame();
                if (hasFull) {
                    yield hasTotH();
                    yield hasAoD();
                    yield hasItA();
                }
                // Check which expansions to load based on player's setting
                yield getEnabledExpansionsFromPlayFab();
                // Load game class + register data
                initGameClass();
                log('Loading Game Data...');
                setStatus(getLangString('MENU_TEXT_LOADING_MSG_LOADING_GAME_DATA'));
                try {
                    yield loadGameData();
                } catch (e) {
                    handleLoadingError('Error Loading Game Data', e);
                    return;
                }
                // Initialize Mod Manager
                log('Initializing Mod Manager...');
                setStatus(getLangString('MENU_TEXT_LOADING_MSG_LOADING_MOD_MANAGER'));
                yield mod.manager.init();
                try {
                    game.postDataRegistration();
                } catch (e) {
                    handleLoadingError('Error in Game Post Data Registration', e);
                    return;
                }
                log('Loading Local Saves...');
                setStatus(getLangString('MENU_TEXT_LOADING_MSG_LOCAL_SAVES'));
                yield updateLocalSaveHeaders();
                if (PlayFabClientSDK.IsClientLoggedIn()) {
                    log('Loading Cloud Saves...');
                    setStatus(getLangString('MENU_TEXT_LOADING_MSG_CLOUD_SAVES'));
                    yield refreshPlayFabSaves();
                }
                log('Saves retrieved');
                loadCharacterSelection();
                loadOnScreenWarnings();
            } else if (PlayFabClientSDK.IsClientLoggedIn()) {
                if (nativeManager.isNativeApp)
                    location.href = 'index_mobile.php';
                else if (nativeManager.isEpicGames && !isEpicAccountLinked())
                    redirectToEOSAuthentication();
                else
                    location.href = 'index_game.php';
                return;
            }
            onloadEvent(false); //language is already initialised prior to initSilentSignIn()
            if (!isRedirectingToEOSAuthentication)
                hidePageLoader(); //Don't show the index page if we need to redirect to EOS authentication
        });
    }

    function loadOnScreenWarnings() {
        if (nativeManager.isEpicGames && EOSConsentFailed) {
            const eosConsentEl = document.getElementById('epic-games-account-issue');
            if (eosConsentEl !== null)
                eosConsentEl.classList.remove('d-none');
        }
    }
    /** Loads stored tokens from local storage on page load */
    function getTokensFromLocalStorage() {
        const appleAuthToken = localStorage.getItem('appleAuthToken');
        appleToken = appleAuthToken ? appleAuthToken : '';
        const googleAuthToken = localStorage.getItem('googleAuthToken');
        googleToken = googleAuthToken ? googleAuthToken : '';
        const melvorCloudAuthToken = localStorage.getItem('melvorCloudAuthToken');
        JWT = melvorCloudAuthToken ? melvorCloudAuthToken : '';
    }
    /** Removes Melvor Cloud JWT token from local storage */
    function removeJWTFromLocalStorage() {
        localStorage.removeItem('melvorCloudAuthToken');
    }
    /** Removes Apple Auth token from local storage */
    function removeAppleTokenFromLocalStorage() {
        localStorage.removeItem('appleAuthToken');
    }
    /** Removes Google Auth token from local storage */
    function removeGoogleTokenFromLocalStorage() {
        localStorage.removeItem('googleAuthToken');
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts !== undefined && parts.length === 2)
            return parts.pop().split(';').shift();
    }

    function deleteCookie(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    /** Handles the Sign in with Apple callback after Native App or Browser handles authorization
     * @param token - (Optional) The token received from the Native App (Optional)
     */
    function handleSignInWithApple(token) {
        if (token !== undefined)
            storeAppleToken(token);
        initPlayFabLogin('apple');
    }
    /** Handles the Sign in with Google callback after Native App or Browser handles authorization
     * @param token - (Optional) The token received when authorized with Google
     */
    function handleSignInWithGoogle(token) {
        if (token !== undefined)
            storeGoogleToken(token);
        initPlayFabLogin('google');
    }
    /** Stores the Apple Token recveived from Native App or Browser
     * @param token - The token received when authorized with Apple
     */
    function storeAppleToken(token) {
        log('Storing Apple Token');
        appleToken = token;
        localStorage.setItem('appleAuthToken', token);
    }
    /** Stores the Google Token recveived from Native App or Browser
     * @param token - The token received when authorized with Google
     */
    function storeGoogleToken(token) {
        log('Storing Google Token');
        googleToken = token;
        localStorage.setItem('googleAuthToken', token);
    }
    /** Stores the Melvor Cloud Token received with login to Melvor Cloud POST
     * @param token - The token received when authorized with Melvor Cloud
     */
    function storeMelvorCloudToken(token) {
        log('Storing Melvor Cloud Token');
        JWT = token;
        localStorage.setItem('melvorCloudAuthToken', token);
    }
    /** Performs necessary actions for when a player initiates the sign in process */
    function initSignIn() {
        log('Initiating sign in');
        disableSignInForm();
        showSignInProgressSpinner();
        hideSignInError();
    }
    /** Performs necessary actions for when a player initiates the registration process */
    function initRegistration() {
        log('Initiating registration');
        disableRegisterForm();
        showRegisterProgressSpinner();
        hideRegisterError();
    }
    /** Performs necessary actions for when a player initiates the forgot password process */
    function initForgotPassword() {
        log('Initiating forgot password');
        disableForgotForm();
        showForgotProgressSpinner();
        hideForgotError();
    }
    /** Performs necessary actions for when a player initiates the change email process */
    function initChangeEmail() {
        log('Initiating change email');
        disableChangeEmailForm();
        showChangeEmailProgressSpinner();
        hideChangeEmailError();
    }
    /** Performs necessary actions for when a player initiates the change password process */
    function initChangePassword() {
        log('Initiating change password');
        disableChangePasswordForm();
        showChangePasswordProgressSpinner();
        hideChangePasswordError();
    }
    /** Disables the sign in form */
    function disableSignInForm() {
        disableSocialSignIn = true;
        formElements.signIn.username.disabled = true;
        formElements.signIn.password.disabled = true;
        formElements.signIn.submit.disabled = true;
    }
    /** Enables the sign in form */
    function enableSignInForm() {
        disableSocialSignIn = false;
        formElements.signIn.username.disabled = false;
        formElements.signIn.password.disabled = false;
        formElements.signIn.submit.disabled = false;
    }
    /** Disables the register form */
    function disableRegisterForm() {
        disableSocialSignIn = true;
        formElements.register.username.disabled = true;
        formElements.register.password.disabled = true;
        formElements.register.confirmPassword.disabled = true;
        formElements.register.email.disabled = true;
        formElements.register.submit.disabled = true;
    }
    /** Enables the register form */
    function enableRegisterForm() {
        disableSocialSignIn = false;
        formElements.register.username.disabled = false;
        formElements.register.password.disabled = false;
        formElements.register.confirmPassword.disabled = false;
        formElements.register.email.disabled = false;
        formElements.register.submit.disabled = false;
    }
    /** Disables the forgot password form */
    function disableForgotForm() {
        disableSocialSignIn = true;
        formElements.forgot.email.disabled = true;
        formElements.forgot.submit.disabled = true;
    }
    /** Enables the forgot password form */
    function enableForgotForm() {
        disableSocialSignIn = false;
        formElements.forgot.email.disabled = false;
        formElements.forgot.submit.disabled = false;
    }
    /** Disables the change password form */
    function disableChangeEmailForm() {
        formElements.characterSelect.email.input.disabled = true;
        formElements.characterSelect.email.submit.disabled = true;
    }
    /** Enables the change password form */
    function enableChangeEmailForm() {
        formElements.characterSelect.email.input.disabled = false;
        formElements.characterSelect.email.submit.disabled = false;
    }
    /** Disables the change password form */
    function disableChangePasswordForm() {
        formElements.characterSelect.changePassword.currentPassword.disabled = true;
        formElements.characterSelect.changePassword.newPassword.disabled = true;
        formElements.characterSelect.changePassword.confirmNewPassword.disabled = true;
        formElements.characterSelect.changePassword.submit.disabled = true;
    }
    /** Enables the change password form */
    function enableChangePasswordForm() {
        formElements.characterSelect.changePassword.currentPassword.disabled = false;
        formElements.characterSelect.changePassword.newPassword.disabled = false;
        formElements.characterSelect.changePassword.confirmNewPassword.disabled = false;
        formElements.characterSelect.changePassword.submit.disabled = false;
    }
    /** Displays the progress spinner on the Sign In button. Stores the original inner HTML to use later */
    function showSignInProgressSpinner() {
        formInnerHTML.signIn.submit.original = formElements.signIn.submit.innerHTML;
        formElements.signIn.submit.innerHTML = inProgressSpinner();
    }
    /** Removes the Sign In progress spinner by replacing it with the original inner HTML */
    function hideSignInProgressSpinner() {
        formElements.signIn.submit.innerHTML = formInnerHTML.signIn.submit.original;
    }
    /** Displays the progress spinner on the Register button. Stores the original inner HTML to use later */
    function showRegisterProgressSpinner() {
        formInnerHTML.register.submit.original = formElements.register.submit.innerHTML;
        formElements.register.submit.innerHTML = inProgressSpinner();
    }
    /** Removes the Register progress spinner by replacing it with the original inner HTML */
    function hideRegisterProgressSpinner() {
        formElements.register.submit.innerHTML = formInnerHTML.register.submit.original;
    }
    /** Displays the progress spinner on the Forgot Password button. Stores the original inner HTML to use later */
    function showForgotProgressSpinner() {
        formInnerHTML.forgot.submit.original = formElements.forgot.submit.innerHTML;
        formElements.forgot.submit.innerHTML = inProgressSpinner();
    }
    /** Removes the Forgot Password progress spinner by replacing it with the original inner HTML */
    function hideForgotProgressSpinner() {
        formElements.forgot.submit.innerHTML = formInnerHTML.forgot.submit.original;
    }
    /** Displays the progress spinner on the Change Email button. Stores the original inner HTML to use later */
    function showChangeEmailProgressSpinner() {
        formInnerHTML.changePassword.submit.original = formElements.characterSelect.email.submit.innerHTML;
        formElements.characterSelect.email.submit.innerHTML = inProgressSpinner();
    }
    /** Removes the Change Email progress spinner by replacing it with the original inner HTML */
    function hideChangeEmailProgressSpinner() {
        formElements.characterSelect.email.submit.innerHTML = formInnerHTML.changePassword.submit.original;
    }
    /** Displays the progress spinner on the Change Password button. Stores the original inner HTML to use later */
    function showChangePasswordProgressSpinner() {
        formInnerHTML.changePassword.submit.original = formElements.characterSelect.changePassword.submit.innerHTML;
        formElements.characterSelect.changePassword.submit.innerHTML = inProgressSpinner();
    }
    /** Removes the Change Password progress spinner by replacing it with the original inner HTML */
    function hideChangePasswordProgressSpinner() {
        formElements.characterSelect.changePassword.submit.innerHTML = formInnerHTML.changePassword.submit.original;
    }
    /** Create required onclick events for form submission */
    function createOnClickEvents() {
        if (enableSignInWithApple)
            createSignInWithAppleEvent();
        if (enableSignInWithGoogle)
            createSignInWithGoogleEvent();
        if (isOnAuthPage()) {
            createLoginToMelvorCloudEvents();
            createRegisterToMelvorCloudEvents();
            createForgortPasswordCloudEvents();
        } else {
            createChangeEmailCloudEvents();
            createChangePasswordCloudEvents();
        }
    }
    /** Creates Login to Melvor Cloud events (login form) */
    function createLoginToMelvorCloudEvents() {
        formElements.signIn.submit.onclick = (e) => {
            initSignIn();
            loginToMelvorCloud();
            e.preventDefault();
        };
    }
    /** Creates Login to Melvor Cloud events (register form) */
    function createRegisterToMelvorCloudEvents() {
        formElements.register.submit.onclick = (e) => {
            initRegistration();
            registerToMelvorCloud();
            e.preventDefault();
        };
    }
    /** Creates Login to Melvor Cloud events (register form) */
    function createForgortPasswordCloudEvents() {
        formElements.forgot.submit.onclick = (e) => {
            initForgotPassword();
            forgotPasswordToMelvorCloud();
            e.preventDefault();
        };
    }
    /** Creates Login to Melvor Cloud events (register form) */
    function createChangeEmailCloudEvents() {
        formElements.characterSelect.email.submit.onclick = (e) => {
            initChangeEmail();
            updateEmailAddress();
            e.preventDefault();
        };
    }

    function performChanceEmail() {
        initChangeEmail();
        updateEmailAddress();
    }
    /** Creates Login to Melvor Cloud events (register form) */
    function createChangePasswordCloudEvents() {}
    /** Callback for Sign in with Apple after native functions have been processed */
    function signInWithAppleCallback(response) {
        console.log(JSON.stringify(response));
        log('Apple Login Callback');
        let idToken;
        if (response.detail) {
            // browser-only
            if (response.detail.authorization)
                idToken = response.detail.authorization.id_token;
        } else {
            // native-only
            idToken = response.idToken;
        }
        if (idToken)
            handleSignInWithApple(idToken);
        else
            failSocialSignIn();
    }
    /** Creates Sign in with Apple button events */
    function createSignInWithAppleEvent() {
        console.log('Creating Sign in with Apple event');
        formElements.signInWithApple.native.register.onclick = () => {
            console.log('SIWA clicked');
            if (disableSocialSignIn)
                return; // Don't do anything if sign in is already in progress
            initSignIn();
            log('Sign in with Apple');
            if (nativeManager.isNativeApp) {
                log('Calling native social login');
                gonative.socialLogin.apple.login({
                    callback: signInWithAppleCallback,
                    scope: 'full_name, email',
                });
            }
        };
        formElements.signInWithApple.native.login.onclick = () => {
            console.log('SIWA clicked');
            if (disableSocialSignIn)
                return; // Don't do anything if sign in is already in progress
            initSignIn();
            log('Sign in with Apple');
            if (nativeManager.isNativeApp) {
                log('Calling native social login');
                gonative.socialLogin.apple.login({
                    callback: signInWithAppleCallback,
                    scope: 'full_name, email',
                });
            }
        };
    }
    /** Callback for Sign in with Google after native functions have been processed */
    function signInWithGoogleCallback(response) {
        log('Google Login Callback');
        let idToken;
        if (response.credential) {
            // browser-only
            idToken = response.credential;
        } else {
            // native-only
            idToken = response.idToken;
        }
        if (idToken)
            handleSignInWithGoogle(idToken);
        else
            failSocialSignIn();
    }
    /** Creates Sign in with Google button events */
    function createSignInWithGoogleEvent() {
        formElements.signInWithGoogle.native.onclick = () => {
            if (disableSocialSignIn)
                return; // Don't do anything if sign in is already in progress
            initSignIn();
            log('Sign in with Google');
            if (nativeManager.isNativeApp) {
                log('Calling native social login');
                gonative.socialLogin.google.login({
                    callback: signInWithGoogleCallback,
                });
            }
        };
    }
    /** Wrapper function for playfab API so we can use them as promises */
    function playfabAPI(endpoint, requestObject) {
        return new Promise(function(resolve, reject) {
            // @ts-expect-error requestObject cannot be resolved properly, but the index signature of the function is type safe
            PlayFabClientSDK[endpoint](requestObject, function(result, error) {
                if (error !== null) {
                    // Request error
                    return reject(error);
                } else if (result && result.code == 200) {
                    // Request successful
                    return resolve(result);
                } else {
                    // Non-200 HTTP status
                    return reject(new Error(result.status));
                }
            });
        });
    }
    /** Wrapper function for playfab API so we can use them as promises */
    function playfabEventAPI(endpoint, requestObject) {
        return new Promise(function(resolve, reject) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            PlayFabEventsSDK[endpoint](requestObject, function(result, error) {
                if (error !== null) {
                    // Request error
                    return reject(new Error(PlayFab.GenerateErrorReport(error)));
                } else if (result && result.code == 200) {
                    // Request successful
                    return resolve(result);
                } else {
                    // Non-200 HTTP status
                    return reject(new Error(result.status));
                }
            });
        });
    }
    /** Initialized the playfab login with defined method */
    function initPlayFabLogin(method) {
        return __awaiter(this, void 0, void 0, function*() {
            log(`Initializing PlayFab login. Method: ${method}`);
            let authorized;
            switch (method) {
                case 'apple':
                    authorized = yield loginWithAppleViaPlayFab();
                    break;
                case 'google':
                    authorized = yield loginWithGoogleViaPlayFab();
                    break;
                case 'customID':
                    try {
                        authorized = yield loginWithCustomIDViaPlayFab();
                    } catch (e) {
                        removeJWTFromLocalStorage();
                    }
            }
            if (authorized && authorized.code === 200) {
                handleSuccessfulSignIn();
            } else if (method === 'apple' || method === 'google')
                failSocialSignIn();
            else
                handleFailedSignIn();
        });
    }

    function getPlayFabTitleData(keys) {
        return __awaiter(this, void 0, void 0, function*() {
            return playfabAPI('GetTitleData', {
                Keys: keys
            });
        });
    }

    function updatePlayFabAutoSaveInterval() {
        return __awaiter(this, void 0, void 0, function*() {
            getPlayFabTitleData(['cloudSaveInterval'])
                .then((result) => {
                    if (result.data.Data !== undefined && result.data.Data.cloudSaveInterval !== undefined) {
                        const interval = Number.parseInt(result.data.Data.cloudSaveInterval);
                        setPlayFabAutoSaveInterval(interval);
                    }
                })
                .catch((e) => {
                    log('Error updating PlayFab auto save interval');
                    log(e);
                });
        });
    }

    function setPlayFabAutoSaveInterval(interval) {
        PLAYFAB_AUTO_SAVE_INTERVAL = interval * 60 * 60 * 1000;
    }

    function shouldRefreshPlayFabToken() {
        return (PlayFabClientSDK.IsClientLoggedIn() &&
            Date.now() - playFabLoginTimestamp >= PLAYFAB_TOKEN_REFRESH_INTERVAL * 60 * 60 * 1000);
    }

    function shouldAutoSaveToPlayFab() {
        return (PlayFabClientSDK.IsClientLoggedIn() &&
            Date.now() - lastSaveTimestamp >= PLAYFAB_SAVE_INTERVAL * 60 * 60 * 1000 &&
            game.settings.autoCloudSave);
    }

    function checkForPlayFabTokenRefresh() {
        shouldRefreshPlayFabToken() ? refreshPlayFabToken('customID') : null;
    }

    function checkForPlayFabAutoSave() {
        if (shouldAutoSaveToPlayFab()) {
            forceUpdatePlayFabSave();
            updatePlayFabAutoSaveInterval();
        }
    }
    /** Refresh the PlayFab token by loggin in again */
    function refreshPlayFabToken(method) {
        return __awaiter(this, void 0, void 0, function*() {
            log(`Initializing PlayFab login. Method: ${method}`);
            let authorized;
            switch (method) {
                case 'apple':
                    authorized = yield loginWithAppleViaPlayFab();
                    playFabLoginTimestamp = Date.now();
                    break;
                case 'google':
                    authorized = yield loginWithGoogleViaPlayFab();
                    break;
                case 'customID':
                    try {
                        authorized = yield loginWithCustomIDViaPlayFab();
                    } catch (e) {
                        removeJWTFromLocalStorage();
                    }
            }
        });
    }
    /** Sign in to PlayFab via CustomID
     * Uses customID acquired login to melvor cloud from stored JWT
     */
    function loginWithCustomIDViaPlayFab() {
        log('Logging in with Custom ID via PlayFab');
        setStatus(getLangString('MENU_TEXT_LOADING_MSG_PLAYFAB'));
        if (customID != '') {
            const request = {
                CustomId: customID,
                TitleId: PlayFab.settings.titleId,
                CreateAccount: enableAccountCreation,
            };
            return playfabAPI('LoginWithCustomID', request)
                .then((result) => {
                    if (result.code === 200) {
                        playFabLoginTimestamp = Date.now();
                        log('Login with custom ID success');
                    }
                    return Promise.resolve(result);
                })
                .catch((error) => {
                    setStatus(`PlayFab Error:\n${error.error}. ${error.status}.\nPlease try again later.`);
                    log(error);
                    return Promise.reject(error);
                });
        } else {
            log('Custom ID is empty');
            return Promise.reject('Custom ID is empty');
        }
    }
    /** Sign in to PlayFab via OpenID
     * Uses openID token acquired from authorization server
     */
    function loginWithOpenIDViaPlayFab() {
        log('Logging in with Open ID via PlayFab');
        setStatus(getLangString('MENU_TEXT_LOADING_MSG_PLAYFAB'));
        if (EOSAccessToken != '') {
            const request = {
                IdToken: EOSAccessToken,
                TitleId: PlayFab.settings.titleId,
                ConnectionId: 'EpicOnlineServices',
                CreateAccount: false,
            };
            return playfabAPI('LoginWithOpenIdConnect', request)
                .then((result) => {
                    if (result.code === 200) {
                        playFabLoginTimestamp = Date.now();
                        log('Login with open ID success');
                    }
                    return Promise.resolve(result);
                })
                .catch((error) => {
                    setStatus(`PlayFab Error:\n${error.error}. ${error.status}.\nPlease try again later.`);
                    log(error);
                    return Promise.reject(error);
                });
        } else {
            log('Open ID token is empty');
            return Promise.reject('Open ID Token is empty');
        }
    }
    /** Sign in with Apple for PlayFab
     * Uses apple token acquired in previous apple sign in callback
     */
    function loginWithAppleViaPlayFab() {
        log('Logging in with Apple via PlayFab');
        if (appleToken != '') {
            const request = {
                IdentityToken: appleToken,
                TitleId: PlayFab.settings.titleId,
                CreateAccount: enableAccountCreation,
            };
            return playfabAPI('LoginWithApple', request)
                .then((result) => {
                    if (result.code === 200) {
                        playFabLoginTimestamp = Date.now();
                        log('Login with apple success');
                    }
                    return Promise.resolve(result);
                })
                .catch((error) => {
                    log(error);
                    return Promise.reject(error);
                });
        } else {
            log('Apple Token is empty');
            return Promise.reject('Apple Token is empty');
        }
    }
    /** Links Apple to current PlayFab account
     * Uses apple token acquired in previous apple sign in callback
     */
    function linkOpenIDToPlayFab() {
        log('Linking Open ID to PlayFab account');
        if (!PlayFabClientSDK.IsClientLoggedIn())
            return Promise.reject('Player not logged in');
        if (EOSAccessToken != '') {
            const request = {
                IdToken: EOSAccessToken,
                ConnectionId: 'EpicOnlineServices',
                ForceLink: true,
            };
            return playfabAPI('LinkOpenIdConnect', request)
                .then((result) => {
                    if (result.code === 200)
                        log('Link Open ID success');
                    Promise.resolve(result);
                })
                .catch((error) => {
                    log(error);
                    Promise.reject(error);
                });
        } else {
            log('Open ID Token is empty');
            return Promise.reject('Open ID Token is empty');
        }
    }
    /** Links Apple to current PlayFab account
     * Uses apple token acquired in previous apple sign in callback
     */
    function linkAppleToPlayFab() {
        log('Linking Apple to PlayFab account');
        if (!PlayFabClientSDK.IsClientLoggedIn())
            return Promise.reject('Player not logged in');
        if (appleToken != '') {
            const request = {
                IdentityToken: appleToken
            };
            return playfabAPI('LinkApple', request)
                .then((result) => {
                    if (result.code === 200)
                        log('Link apple success');
                    Promise.resolve(result);
                })
                .catch((error) => {
                    log(error);
                    Promise.reject(error);
                });
        } else {
            log('Apple Token is empty');
            return Promise.reject('Apple Token is empty');
        }
    }
    /** Sign in with Google for PlayFab
     * Uses google token acquired in previous google sign in callback
     */
    function loginWithGoogleViaPlayFab() {
        log('Logging in with Google via PlayFab');
        if (googleToken != '') {
            const request = {
                AccessToken: googleToken,
                TitleId: PlayFab.settings.titleId,
                CreateAccount: enableAccountCreation,
            };
            return playfabAPI('LoginWithGoogleAccount', request)
                .then((result) => {
                    if (result.code === 200) {
                        playFabLoginTimestamp = Date.now();
                        log('Login with google success');
                    }
                    return Promise.resolve(result);
                })
                .catch((error) => {
                    log(error);
                    return Promise.reject(error);
                });
        } else {
            log('Google Token is empty');
            return Promise.reject('Google Token is empty');
        }
    }
    /** Links Google account to current PlayFab account
     * Uses Google token acquired in previous Google sign in callback
     * Returns boolean result of the request
     */
    function linkGoogleToPlayFab() {
        log('Linking Google to PlayFab account');
        /* TODO: Properly implement this method. The current request body is invalid for the playfab API
        if (!PlayFabClientSDK.IsClientLoggedIn()) return Promise.reject('Player not logged in');
        if (googleToken != '') {
          const request: PlayFabClientModels.LinkGoogleAccountRequest = { IdentityToken: googleToken };
          return playfabAPI('LinkGoogleAccount', request)
            .then((result) => {
              if (result.code === 200) log('Link Google success');
              Promise.resolve(result);
            })
            .catch((error) => {
              log(error);
              Promise.reject(error);
            });
        } else {
          log('Google token is empty');
          return Promise.reject('Google token is empty');
        }
        */
    }
    /** Performs necessary functions when social sign in fails due to user cancel or failed authorization */
    function failSocialSignIn() {
        log('Social sign in failed');
        if (!formElements.signIn.submit.disabled)
            return;
        handleFailedSignIn();
    }
    /** Main handler for failed sign in attempts */
    function handleFailedSignIn() {
        enableSignInForm();
        hideSignInProgressSpinner();
    }
    /** Main handler for successful sign in attempts */
    function handleSuccessfulSignIn() {
        return __awaiter(this, void 0, void 0, function*() {
            try {
                /** Test access check */
                let canAccess = true;
                canAccess = yield checkTestAccess();
                if (isTest() && !canAccess)
                    return accessDenied();
                if (isOnAuthPage() && isTest())
                    return signInRedirect();
                /** End test access check */
                const newAccountInfo = yield getAccountInfo();
                if (newAccountInfo.data.AccountInfo !== undefined) {
                    accountInfo = newAccountInfo.data.AccountInfo;
                } else {
                    throw new Error(`Error: Account Info was unable to be retrieved. AccountInfo is undefined.`);
                }
                log('Account info retrieved');
                yield performRequireAccountUpdates();
                finalizeSignIn();
            } catch (error) {
                removeJWTFromLocalStorage();
                if (error instanceof Error)
                    log(error.message);
            }
        });
    }
    /** Fetches saves from PlayFab and stores them locally for us */
    function refreshPlayFabSaves() {
        return __awaiter(this, void 0, void 0, function*() {
            const saves = yield getSavesFromPlayFab();
            if (saves.data.Data !== undefined)
                playfabSaves = saves.data.Data;
            if (!isOnAuthPage())
                yield updateCloudSaveHeaders();
        });
    }
    /** Redirect to main game on successful sign in. No need to load playfab saves and stuff on login screen. */
    function signInRedirect() {
        hideSignInContainer();
        showEnvContainer();
        showTestServerSelectionBtn();
        hidePageLoader();
    }
    /** Checks if the user is currently on the main authentication page
     * Returns boolean result of the check
     */
    function isOnAuthPage() {
        return (!location.href.includes('index_noads.php') &&
            !location.href.includes('index_game.php') &&
            !location.href.includes('index_ads.php') &&
            !location.href.includes('index_mobile.php') &&
            !location.href.includes('siwg_test.html'));
    }

    function accessDenied() {
        log(`You do not have access to the Test Server.`);
        displaySignInError(`You do not have access to the Test Server. Please connect to Patreon.`);
        hideSignInContainer();
        showEnvContainer();
        showPatreonConnectBtn();
        removeJWTFromLocalStorage();
    }

    function displaySignInError(msg) {
        formElements.signIn.error.innerText = msg;
        formElements.signIn.error.classList.remove('d-none');
    }

    function hideSignInError() {
        formElements.signIn.error.classList.add('d-none');
    }

    function displayRegisterError(msg) {
        formElements.register.error.innerText = msg;
        formElements.register.error.classList.remove('d-none');
    }

    function hideRegisterError() {
        formElements.register.error.classList.add('d-none');
    }

    function displayForgotError(msg) {
        formElements.forgot.error.innerText = msg;
        formElements.forgot.error.classList.remove('d-none');
    }

    function hideForgotError() {
        formElements.forgot.error.classList.add('d-none');
    }

    function displayChangeEmailError(msg) {
        formElements.characterSelect.email.error.innerText = msg;
        formElements.characterSelect.email.error.classList.remove('d-none');
    }

    function hideChangeEmailError() {
        formElements.characterSelect.email.error.classList.add('d-none');
    }

    function displayChangePasswordError(msg) {
        formElements.characterSelect.changePassword.error.innerText = msg;
        formElements.characterSelect.changePassword.error.classList.remove('d-none');
    }

    function hideChangePasswordError() {
        formElements.characterSelect.changePassword.error.classList.add('d-none');
    }
    /** Returns the Account info from playfab of authorized user */
    function getAccountInfo() {
        log('Getting account info');
        setStatus(getLangString('MENU_TEXT_LOADING_MSG_ACCOUNT_INFO'));
        return playfabAPI('GetAccountInfo', {});
    }
    /** Returns the stored saves in playfab of the authorized user */
    function getSavesFromPlayFab() {
        log('Getting saves from playfab');
        setStatus(getLangString('MENU_TEXT_LOADING_MSG_FETCHING_CLOUD'));
        return playfabAPI('GetUserData', {
            Keys: getPlayFabSaveKeys()
        });
    }
    /** Returns the stored saves in playfab of the authorized user */
    function getUserDataFromPlayFab(keys) {
        log('Getting keys from playfab');
        return playfabAPI('GetUserData', {
            Keys: keys
        });
    }

    function wasGameLaunchedViaEpicGamesStore() {
        return __awaiter(this, void 0, void 0, function*() {
            const epicSandboxId = getEOSSandboxIDFromArgv(parent.nw.App.argv);
            if (epicSandboxId === '')
                return Promise.resolve(false);
            return Promise.resolve(true);
        });
    }
    /** This function will be used to perform required playfab data updates */
    function performRequireAccountUpdates() {
        return __awaiter(this, void 0, void 0, function*() {
            if (nativeManager.isSteam)
                linkSteamAccountToPlayFab(true); //no need to await this
            if (nativeManager.isEpicGames)
                yield linkEpicGamesAccountToPlayFab();
            updatePlayFabDisplayName(); // No need to await this;
            if (nativeManager.isNativeApp && nativeManager.hasReceiptData) {
                nativeManager.validateMobilePurchaseStatus();
                nativeManager.validateMobileExpansionPurchaseStatus();
                nativeManager.validateMobileExpansion2PurchaseStatus();
                nativeManager.validateMobileExpandedEditionPurchaseStatus();
                nativeManager.validateMobileExpansion3PurchaseStatus();
            }
            return Promise.resolve(true);
        });
    }

    function checkEpicGamesOwnershipLocal(entitlementToCheck) {
        return __awaiter(this, void 0, void 0, function*() {
            const epicAccountId = getEOSAccountIDFromArgv(parent.nw.App.argv);
            if (epicAccountId === '')
                return Promise.reject(false);
            const epicSandboxId = getEOSSandboxIDFromArgv(parent.nw.App.argv);
            if (epicSandboxId === '')
                return Promise.reject(false);
            const url = './includes/epicGames.php';
            const data = {
                epicAccountId: epicAccountId,
                accessToken: EOSAccessToken,
                entitlementToCheck: entitlementToCheck,
                sandboxId: epicSandboxId,
            };
            try {
                const response = yield fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(data),
                });
                const result = yield response.text();
                if (result === '1')
                    return Promise.resolve(true);
                else
                    return Promise.resolve(false);
            } catch (error) {
                console.error('Error:', error);
                return Promise.resolve(false);
            }
        });
    }

    function EOSAlreadyLinked() {
        var _a, _b;
        return (_b = (_a = accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.OpenIdInfo) === null || _a === void 0 ? void 0 : _a.some((account) => account.ConnectionId === 'EpicOnlineServices')) !== null && _b !== void 0 ? _b : false;
    }

    function getEOSAccountID() {
        var _a, _b, _c;
        return ((_c = (_b = (_a = accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.OpenIdInfo) === null || _a === void 0 ? void 0 : _a.find((account) => account.ConnectionId === 'EpicOnlineServices')) === null || _b === void 0 ? void 0 : _b.Subject) !== null && _c !== void 0 ? _c : 'Error getting Epic Account ID');
    }

    function onEOSClick() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!EOSAlreadyLinked()) {
                return;
            } else {
                EOSPurchaseValidSwal();
            }
        });
    }

    function EOSPurchaseValidationIssueSwal() {
        //TODO_L
        return SwalLocale.fire({
            text: 'Your Epic Games account is already linked to this Melvor Cloud account, but there was an issue validating purchase status.',
            icon: 'warning',
            confirmButtonText: 'OK',
            showCancelButton: false,
        });
    }

    function EOSPurchaseValidSwal() {
        return __awaiter(this, void 0, void 0, function*() {
            SwalLocale.fire({
                text: getLangString('MENU_TEXT_LOADING_PLEASE_WAIT'),
            });
            const epicAccountID = getEOSAccountID();
            const displayName = yield getEOSAccountName();
            const baseGame = yield getEpicPurchaseStatus();
            const toth = yield getEpicExpansionPurchaseStatus();
            const aod = yield getEpicExpansion2PurchaseStatus();
            const ita = yield getEpicExpansion3PurchaseStatus();
            const html = `<span class="font-w400">${getLangString('MENU_TEXT_EPIC_LINK_INFO_0')}<br><br>
    <span class="font-w600">${getLangString('MENU_TEXT_EPIC_LINK_INFO_1')}</span> <span class="text-info">${epicAccountID}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_EPIC_LINK_INFO_2')}</span> <span class="text-info">${displayName}</span><br><br>
    <span class="font-w600">${getLangString('MENU_TEXT_EPIC_LINK_INFO_3')}</span> <span class="${baseGame ? 'text-success' : 'text-danger'}">${baseGame}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_EPIC_LINK_INFO_4')}</span> <span class="${toth ? 'text-success' : 'text-danger'}">${toth}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_EPIC_LINK_INFO_5')}</span> <span class="${aod ? 'text-success' : 'text-danger'}">${aod}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_STEAM_LINK_INFO_7')}</span> <span class="${ita ? 'text-success' : 'text-danger'}">${ita}</span>`;
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_EPIC_LINK_INFO_TITLE'),
                html: html,
            });
        });
    }

    function redirectToEOSAuthentication() {
        if (isRedirectingToEOSAuthentication)
            return;
        console.log('Redirecting to Epic Games login');
        isRedirectingToEOSAuthentication = true;
        parent.window.location.href = `https://www.epicgames.com/id/authorize?client_id=xyza7891ew689l7t6TLl2CRiJZtIb6Th&redirect_uri=https://epicgames.melvoridle.com/epicAccountLinkedStatus.php&response_type=code&scope=basic_profile`;
    }

    function connectToEOSSwal() {
        return __awaiter(this, void 0, void 0, function*() {
            const confirmation = new Promise((resolve, reject) => {
                SwalLocale.fire({
                    title: getLangString('SWAL_LINK_EPIC_GAMES_TITLE'),
                    html: `<p>${getLangString('SWAL_LINK_EPIC_GAMES_BODY_0')}</p><p>${getLangString('SWAL_LINK_EPIC_GAMES_BODY_1')}</p>${getLangString('SWAL_LINK_EPIC_GAMES_BODY_2')}`,
                    showCancelButton: true,
                    icon: 'info',
                    confirmButtonText: getLangString('SWAL_LINK_EPIC_GAMES_BTN_CONFIRM'),
                    cancelButtonText: getLangString('SWAL_LINK_EPIC_GAMES_BTN_CANCEL'),
                }).then((result) => {
                    if (result.value) {
                        resolve(true);
                    } else
                        resolve(false);
                });
            });
            return confirmation;
        });
    }

    function grantPermissionsEOSSwal() {
        return __awaiter(this, void 0, void 0, function*() {
            const confirmation = new Promise((resolve, reject) => {
                SwalLocale.fire({
                    title: getLangString('SWAL_LINK_EPIC_GAMES_2_TITLE'),
                    html: `<p>${getLangString('SWAL_LINK_EPIC_GAMES_2_BODY_0')}</p><p>${getLangString('SWAL_LINK_EPIC_GAMES_2_BODY_1')}</p>${getLangString('SWAL_LINK_EPIC_GAMES_2_BODY_2')}`,
                    showCancelButton: false,
                    allowOutsideClick: false,
                    icon: 'info',
                    confirmButtonText: getLangString('SWAL_LINK_EPIC_GAMES_2_BTN_CONTINUE'),
                }).then((result) => {
                    if (result.value) {
                        resolve(true);
                    } else
                        resolve(false);
                });
            });
            return confirmation;
        });
    }

    function storeEpicGamesAcccessToken() {
        return __awaiter(this, void 0, void 0, function*() {
            try {
                const epicCode = yield requestAccessTokenFromEOSUsingExchangeToken();
                if (DEBUGENABLED)
                    console.log('Epic Games OpenID code:', epicCode);
                EOSAccessToken = epicCode;
            } catch (e) {
                console.log('Error getting Epic Games access token');
                console.log(e);
            }
        });
    }
    /** Handles Epic Games Account OpenID connection */
    function linkEpicGamesAccountToPlayFab() {
        return __awaiter(this, void 0, void 0, function*() {
            if (nativeManager.isEpicGames &&
                PlayFabClientSDK.IsClientLoggedIn() &&
                !EOSAlreadyLinked() &&
                !isOnAuthPage() &&
                EOSAccessToken !== '') {
                console.log('Epic Games Client detected. Attempting to link new OpenID connection');
                try {
                    yield linkOpenIDToPlayFab();
                    const newAccountInfo = yield getAccountInfo();
                    accountInfo = newAccountInfo.data.AccountInfo;
                } catch (e) {
                    console.log('Error linking Epic Games account to PlayFab');
                    console.log(e);
                }
                return Promise.resolve();
            } else
                return Promise.resolve();
        });
    }

    function requestAccessTokenFromEOSUsingExchangeToken() {
        var _a;
        return __awaiter(this, void 0, void 0, function*() {
            const eosResponse = yield requestAccessTokenFromEOSUsingExchangeTokenLocal();
            const validResponse = yield processEOSResponse(eosResponse);
            if (validResponse) {
                localStorage.setItem('epicAccountLinked', '1');
                parent.localStorage.setItem('EOSAccessToken', JSON.stringify(eosResponse));
                localStorage.setItem('EOSAccessToken', JSON.stringify(eosResponse));
            }
            return (_a = eosResponse.access_token) !== null && _a !== void 0 ? _a : '';
        });
    }

    function processEOSResponse(eosResponse) {
        return __awaiter(this, void 0, void 0, function*() {
            if (eosResponse.errorCode !== undefined) {
                if (eosResponse.errorCode === 'errors.com.epicgames.oauth.scope_consent_required') {
                    EOSConsentFailed = true;
                    if (localStorage.getItem('epicAccountLinked') !== '1')
                        redirectToEOSAuthentication();
                    return false;
                }
                if (eosResponse.errorCode === 'errors.com.epicgames.account.oauth.exchange_code_not_found')
                    return false;
            }
            EOSConsentFailed = false;
            return true;
        });
    }

    function getCachedAccessToken() {
        const cachedTokenData = parent.localStorage.getItem('EOSAccessToken');
        return cachedTokenData !== undefined && cachedTokenData !== null ?
            JSON.parse(cachedTokenData) :
            undefined;
    }
    /**
     * Acquires the refresh token from the local storage data.
     * If undefined or error, return the exchange code from the client itself.
     * Exchange token from client is only a one time use token, so we need to use the refresh token if possible.
     */
    function getRefreshTokenFromCachedData(cachedData) {
        return cachedData !== undefined &&
            cachedData.refresh_token !== undefined &&
            cachedData.refresh_token !== null &&
            cachedData.errorCode === undefined ?
            cachedData.refresh_token :
            getEOSAuthPasswordFromArgv(parent.nw.App.argv);
    }

    function isCachedDataValid(cachedData) {
        return cachedData !== undefined && cachedData.refresh_token !== null && cachedData.errorCode === undefined;
    }

    function requestAccessTokenFromEOSUsingExchangeTokenLocal() {
        return __awaiter(this, void 0, void 0, function*() {
            const cachedData = getCachedAccessToken();
            const exchangeToken = getRefreshTokenFromCachedData(cachedData);
            let useRefreshToken = '0';
            if (isCachedDataValid(cachedData)) {
                useRefreshToken = '1';
                console.log('Using cached EOS refresh token');
            }
            if (!exchangeToken) {
                return Promise.reject(new Error('Error: No exchange token or refresh token available. Please restart the client and try again.'));
            }
            const epicAccountId = getEOSAccountIDFromArgv(parent.nw.App.argv);
            if (!epicAccountId) {
                return Promise.reject(new Error('Error: No valid Epic account ID available. Please restart the client and try again.'));
            }
            const epicSandboxId = getEOSSandboxIDFromArgv(parent.nw.App.argv);
            if (epicSandboxId === '')
                return Promise.reject(new Error('Erro: No valid Epic sandbox ID available. Please restart the client and try again.'));
            if (DEBUGENABLED) {
                console.log(`Requesting access token from EOS using exchange token ${exchangeToken} with sandbox id ${epicSandboxId}`);
            }
            const url = './includes/epicGamesAccessToken.php';
            const data = {
                epicAccountId,
                exchangeToken,
                useRefreshToken: useRefreshToken,
                sandboxId: epicSandboxId,
            };
            try {
                const response = yield fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(data),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const jsonResult = (yield response.json());
                if (DEBUGENABLED)
                    console.log(jsonResult);
                return jsonResult;
            } catch (error) {
                console.error('Error:', error);
                return Promise.resolve({
                    access_token: '',
                    refresh_token: ''
                });
            }
        });
    }

    function getEOSAuthPasswordFromArgv(argv) {
        const prefix = '-AUTH_PASSWORD=';
        const authPasswordArg = argv.find((arg) => arg.startsWith(prefix));
        if (authPasswordArg) {
            return authPasswordArg.substring(prefix.length);
        }
        return '';
    }

    function getEOSAccountIDFromArgv(argv) {
        const prefix = '-epicuserid=';
        const userId = argv.find((arg) => arg.startsWith(prefix));
        if (userId) {
            return userId.substring(prefix.length);
        }
        return '';
    }

    function getEOSSandboxIDFromArgv(argv) {
        const prefix = '-epicsandboxid=';
        const userId = argv.find((arg) => arg.startsWith(prefix));
        if (userId) {
            return userId.substring(prefix.length);
        }
        return '';
    }

    function updatePlayFabDisplayName() {
        var _a, _b;
        if (!PlayFabClientSDK.IsClientLoggedIn() || cloudUsername() === '')
            return;
        if (accountInfo === undefined ||
            (accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.TitleInfo) === undefined ||
            ((_a = accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.TitleInfo) === null || _a === void 0 ? void 0 : _a.DisplayName) === undefined)
            return;
        if (((_b = accountInfo === null || accountInfo === void 0 ? void 0 : accountInfo.TitleInfo) === null || _b === void 0 ? void 0 : _b.DisplayName) === cloudUsername())
            return;
        playfabAPI('UpdateUserTitleDisplayName', {
            DisplayName: cloudUsername()
        });
    }
    /** For those who don't want to use a cloud account for some reason */
    function skipCloudAuthentication() {
        if (!enableSkipRegistration || isTest())
            return skipDisabled();
        SwalLocale.fire({
            title: getLangString('SKIP_CLOUD_AUTHENTICATION'),
            html: `<h5 class="font-w600 text-combat-smoke font-size-sm mb-2">${getLangString('SKIP_CLOUD_AUTHENTICATION_MSG')}</h5>`,
            showCancelButton: true,
            icon: 'warning',
            confirmButtonText: getLangString('COMBAT_MISC_86'),
        }).then((result) => {
            if (result.value) {
                if (nativeManager.isNativeApp)
                    location.href = 'index_mobile.php';
                else if (nativeManager.isEpicGames && !isEpicAccountLinked())
                    redirectToEOSAuthentication();
                else
                    location.href = 'index_game.php';
            }
        });
    }
    /** Popup if registration is disabled */
    function registrationDisabled() {
        SwalLocale.fire({
            title: 'Registration Disabled',
            html: `<h5 class="font-w600 text-combat-smoke font-size-sm mb-2">Registration is currently disabled.</h5>`,
            icon: 'warning',
        });
    }
    /** Popup if skip is disabled */
    function skipDisabled() {
        SwalLocale.fire({
            title: getLangString('SKIP_CLOUD_AUTHENTICATION'),
            html: `<h5 class="font-w600 text-combat-smoke font-size-sm mb-2">Skipping authentication is currently disabled.</h5>`,
            icon: 'warning',
        });
    }
    /** Initiates debugging for the cloud manager */
    function initDebug() {
        if (!DEBUG)
            return;
        formElements.debug.log.classList.remove('d-none');
    }
    /** Logs cloud manager events
     * @param message - The message to log
     */
    function log(message) {
        console.log(message);
        //setStatus(message);
        if (isOnAuthPage() && DEBUG) {
            const element = document.createElement('div');
            element.classList.add('font-size-xs');
            element.innerText = message;
            formElements.debug.log.append(element);
        }
    }
    /** Sets the message seen on game loading screen */
    function setStatus(message) {
        formElements.debug.status.innerText = message;
    }
    /** Determines if the login form has valid inputs from the user
     * @returns boolean result of the validation
     */
    function isLoginFormValid() {
        return formElements.signIn.username.value !== '' && formElements.signIn.password.value !== '';
    }
    /** Determines if the change email form has valid inputs from the user
     * @returns boolean result of the validation
     */
    function isChangeEmailFormValid() {
        return formElements.characterSelect.email.input.value !== '';
    }
    /** Determines if the change password form has valid inputs from the user
     * @returns boolean result of the validation
     */
    function isChangePasswordFormValid() {
        return (formElements.characterSelect.changePassword.currentPassword.value !== '' &&
            formElements.characterSelect.changePassword.newPassword.value !== '' &&
            formElements.characterSelect.changePassword.confirmNewPassword.value !== '' &&
            doChangePasswordsMatch());
    }
    /**
     * Determines if the change password form passwords match
     * @returns
     */
    function doChangePasswordsMatch() {
        return (formElements.characterSelect.changePassword.newPassword.value ===
            formElements.characterSelect.changePassword.confirmNewPassword.value);
    }
    /** Determines if the register form has valid inputs from the user
     * @returns boolean result of the validation
     */
    function isRegisterFormValid() {
        return (formElements.register.username.value !== '' &&
            formElements.register.password.value !== '' &&
            formElements.register.confirmPassword.value !== '' &&
            formElements.register.email.value !== '' &&
            doRegisterPasswordsMatch());
    }
    /** Determines if the forgot password form has valid inputs from the user
     * @returns boolean result of the validation
     */
    function isForgotFormValid() {
        return formElements.forgot.email.value !== '';
    }
    /**
     * Determines if the register form passwords match
     * @returns
     */
    function doRegisterPasswordsMatch() {
        return formElements.register.password.value === formElements.register.confirmPassword.value;
    }
    /** Acquires the login form input values
     * @returns an object containing the username and password
     */
    function getLoginFormInput() {
        const username = formElements.signIn.username.value;
        const password = formElements.signIn.password.value;
        return {
            username,
            password
        };
    }
    /** Acquires the register form input values
     * @returns an object containing the username and password
     */
    function getRegisterFormInput() {
        const username = formElements.register.username.value;
        const password = formElements.register.password.value;
        const confirmPassword = formElements.register.confirmPassword.value;
        const email = formElements.register.email.value;
        return {
            username,
            password,
            confirmPassword,
            email
        };
    }
    /** Acquires the forgot password form input values
     * @returns the email
     */
    function getForgotFormInput() {
        const email = formElements.forgot.email.value;
        return email;
    }
    /** Acquires the change email form input values
     * @returns the email
     */
    function getChangeEmailFormInput() {
        const email = formElements.characterSelect.email.input.value;
        return email;
    }
    /** Acquires the change password form input values
     * @returns an object containing the current password, new password and confirm new password
     */
    function getChangePasswordFormInput() {
        const currentPassword = formElements.characterSelect.changePassword.currentPassword.value;
        const newPassword = formElements.characterSelect.changePassword.newPassword.value;
        const confirmNewPassword = formElements.characterSelect.changePassword.confirmNewPassword.value;
        return {
            currentPassword,
            newPassword,
            confirmNewPassword
        };
    }
    /** Initiates the login to melvor cloud via login form
     */
    function loginToMelvorCloud() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Initiated login to Melvor Cloud');
            if (!isLoginFormValid()) {
                log('Login form is invalid');
                enableSignInForm();
                hideSignInProgressSpinner();
                return;
            }
            const {
                username,
                password
            } = getLoginFormInput();
            let loginRejected = false;
            try {
                const loginResponse = yield loginToMelvorCloudViaPOST(username, password);
                if (loginResponse.jwt !== undefined) {
                    try {
                        const data = yield performJWTValidation(loginResponse.jwt);
                        continueSuccessfulMelvorCloudLogin(data);
                    } catch (e) {
                        isAuthenticated = false;
                        displaySignInError('Unknown Melvor Cloud error: ' + e);
                        enableSignInForm();
                        hideSignInProgressSpinner();
                        log('Login to Melvor Cloud error: ' + e);
                    }
                } else {
                    loginRejected = true;
                    log(loginResponse.message);
                }
            } catch (e) {
                loginRejected = true;
            }
            if (loginRejected) {
                isAuthenticated = false;
                displaySignInError(getLangString('CHARACTER_SELECT_58'));
                enableSignInForm();
                hideSignInProgressSpinner();
                log('Login failed');
            }
        });
    }
    /**  Initiates the registration for a Melvor Cloud account */
    function registerToMelvorCloud() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Initiated register to Melvor Cloud');
            if (!isRegisterFormValid()) {
                log('Register form is invalid');
                if (!doRegisterPasswordsMatch())
                    displayRegisterError('Passwords do not match.');
                enableRegisterForm();
                hideRegisterProgressSpinner();
                return;
            }
            const {
                username,
                password,
                confirmPassword,
                email
            } = getRegisterFormInput();
            let registerRejected = true;
            const registerResponse = yield registerToMelvorCloudViaPOST(username, password, confirmPassword, email);
            if (registerResponse.success !== undefined) {
                try {
                    registrationSuccessfulSwal();
                    showSignInContainer();
                    registerRejected = false;
                } catch (e) {
                    isAuthenticated = false;
                    displayRegisterError('Unknown Melvor Cloud error: ' + e);
                    log('Register to Melvor Cloud error: ' + e);
                }
                enableRegisterForm();
                hideRegisterProgressSpinner();
            } else {
                log(registerResponse.message);
                displayRegisterError(registerResponse.message);
            }
            if (registerRejected) {
                enableRegisterForm();
                hideRegisterProgressSpinner();
                log('Registration error.');
            }
        });
    }

    function registrationSuccessfulSwal() {
        SwalLocale.fire({
            icon: 'success',
            title: 'Successfully Registered!',
            html: `<span class="text-dark">You may now log in.</span>`,
        });
    }
    /**  Initiates the Forgot Password for a Melvor Cloud account */
    function forgotPasswordToMelvorCloud() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Initiated Forgot Password to Melvor Cloud');
            if (!isForgotFormValid()) {
                log('Forgot Password form is invalid');
                enableForgotForm();
                hideForgotProgressSpinner();
                return;
            }
            const email = getForgotFormInput();
            let forgotRejected = false;
            try {
                const forgotResponse = yield forgotPasswordToMelvorCloudViaPOST(email);
                if (forgotResponse.success !== undefined) {
                    try {
                        forgotPasswordSuccessfulSwal();
                        showSignInContainer();
                    } catch (e) {
                        isAuthenticated = false;
                        displayForgotError('Unknown Melvor Cloud error: ' + e);
                        log('Forgot Password to Melvor Cloud error: ' + e);
                    }
                    enableForgotForm();
                    hideForgotProgressSpinner();
                } else {
                    forgotRejected = true;
                    log(forgotResponse.message);
                    displayForgotError(forgotResponse.message);
                }
            } catch (e) {
                forgotRejected = true;
            }
            if (forgotRejected) {
                enableForgotForm();
                hideForgotProgressSpinner();
                log('Forgot Password failed');
            }
        });
    }

    function forgotPasswordSuccessfulSwal() {
        SwalLocale.fire({
            icon: 'success',
            title: 'Forgot Password Submitted',
            html: `<span class="text-dark">An email is on the way to your inbox. Please follow the instructions.<br><br>Note: Your username is displayed inside the email you receive.</span>`,
        });
    }
    /** Initiates the update email address to melvor cloud via form
     */
    function updateEmailAddress() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Initiated update email address');
            if (!isChangeEmailFormValid()) {
                log('Change email form is invalid');
                enableChangeEmailForm();
                hideChangeEmailProgressSpinner();
                return;
            }
            const email = getChangeEmailFormInput();
            let changeRejected = false;
            try {
                const response = yield changeEmailMelvorCloudViaPOST(email);
                if (response.jwt !== undefined) {
                    try {
                        const data = yield performJWTValidation(response.jwt);
                        saveDataFromJWT(data);
                        changeEmailSuccessfulSwal();
                        enableChangeEmailForm();
                    } catch (e) {
                        displayChangeEmailError('Unknown Melvor Cloud error: ' + e);
                        enableChangeEmailForm();
                        hideChangeEmailProgressSpinner();
                        log('Change Email Melvor Cloud error: ' + e);
                    }
                } else {
                    changeRejected = true;
                    log(response.message);
                }
            } catch (e) {
                changeRejected = true;
            }
            if (changeRejected) {
                displayChangeEmailError('Change email failed due to unknown error');
                enableChangeEmailForm();
                hideChangeEmailProgressSpinner();
                log('Change email failed');
            }
        });
    }

    function changeEmailSuccessfulSwal() {
        SwalLocale.fire({
            icon: 'success',
            html: `<span class="text-dark">Your email has been updated successfully.</span>`,
        });
    }
    /** Initiates the update email address to melvor cloud via form
     */
    function changePasswordToMelvorCloud() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Initiated change password');
            if (!isChangePasswordFormValid()) {
                log('Change password form is invalid');
                enableChangePasswordForm();
                hideChangePasswordProgressSpinner();
                return;
            }
            const {
                currentPassword,
                newPassword,
                confirmNewPassword
            } = getChangePasswordFormInput();
            let changeRejected = false;
            let rejectMessage = '';
            try {
                const response = yield changePasswordMelvorCloudViaPOST(currentPassword, newPassword);
                if (response.jwt !== undefined) {
                    try {
                        const data = yield performJWTValidation(response.jwt);
                        saveDataFromJWT(data);
                        changePasswordSuccessfulSwal();
                        enableChangePasswordForm();
                        hideChangePasswordProgressSpinner();
                    } catch (e) {
                        displayChangePasswordError('Unknown Melvor Cloud error: ' + e);
                        enableChangePasswordForm();
                        hideChangePasswordProgressSpinner();
                        log('Change Password Melvor Cloud error: ' + e);
                    }
                } else {
                    changeRejected = true;
                    rejectMessage = response.message;
                    log(rejectMessage);
                }
            } catch (e) {
                changeRejected = true;
            }
            if (changeRejected) {
                displayChangePasswordError(rejectMessage === '' ? 'Change password failed due to unknown error' : rejectMessage);
                enableChangePasswordForm();
                hideChangePasswordProgressSpinner();
                log('Change password failed');
            }
        });
    }

    function changePasswordSuccessfulSwal() {
        SwalLocale.fire({
            icon: 'success',
            html: `<span class="text-dark">Your password has been updated successfully.</span>`,
        });
    }
    /** Saves data from JWT to use later without further token validation */
    function saveDataFromJWT(data) {
        JWTData = data;
        customID = JWTData.playfabID;
        accountCreated = JWTData.created;
        localStorage.setItem('playFabID', customID);
        if (JWTData.patreonAccessToken !== null)
            patreonAccessToken = JWTData.patreonAccessToken;
        if (JWTData.patreonRefreshToken !== null)
            patreonRefreshToken = JWTData.patreonRefreshToken;
        if (data.canTest === '1')
            canAccessTest = true;
    }
    /** Performs JWT Validation and returns Melvor Cloud Data as a Promise
     * @param jwt - The JWT to validate
     * @returns Melvor Cloud Data as a Promise
     */
    function performJWTValidation(jwt) {
        return __awaiter(this, void 0, void 0, function*() {
            try {
                const validatedData = yield validateMelvorCloudToken(jwt);
                const data = validatedData.data;
                if (data !== undefined) {
                    storeMelvorCloudToken(jwt); //store JWT once validated
                    return Promise.resolve(data);
                } else if (validatedData.error !== undefined) {
                    log(validatedData.error);
                    return Promise.reject('If you got here then idk what to say');
                } else {
                    log('If you got here then idk what to say');
                    return Promise.reject('If you got here then idk what to say');
                }
            } catch (e) {
                log('Token validation produced an error.');
                removeJWTFromLocalStorage();
                return Promise.reject(e);
            }
        });
    }
    /** Authenticate with Melvor Cloud via a POST request. Returns JWT session token on success.
     * @param username - The username to authenticate with
     * @param password - The password to authenticate with
     * @returns JSON containing the JWT session token on success
     */
    function loginToMelvorCloudViaPOST(username, password) {
        log('Logging in to Melvor Cloud via POST');
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', melvorCloudLoginURL + 'login.php');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch (e) {
                    reject();
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            const data = JSON.stringify({
                username: username,
                password: password
            });
            xhr.send(data);
        });
    }
    /** Register with Melvor Cloud via a POST request.
     * @param username - The username to register with
     * @param password - The password to register with
     * @param confirmPassword - Confirm password matches
     * @param email - The email to register with
     * @returns JSON containing success message or error message
     */
    function registerToMelvorCloudViaPOST(username, password, confirmPassword, email) {
        log('Registering Melvor Cloud via POST');
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', melvorCloudLoginURL + 'createUser.php');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch (e) {
                    reject();
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            const data = JSON.stringify({
                username: username,
                password: password,
                confirmPassword: confirmPassword,
                email: email,
            });
            xhr.send(data);
        });
    }
    /** Forgot Password to Melvor Cloud via a POST request.
     * @param email - The email associated with the account
     * @returns JSON containing success message or error message
     */
    function forgotPasswordToMelvorCloudViaPOST(email) {
        log('Forgot Password to Melvor Cloud via POST');
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', melvorCloudLoginURL + 'forgotPassword.php');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch (e) {
                    reject();
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            const data = JSON.stringify({
                email: email,
            });
            xhr.send(data);
        });
    }
    /** Change email address of user. Returns new and updated JWT session token on success.
     * @param email - The email to change to
     * @returns JSON containing the JWT session token on success
     */
    function changeEmailMelvorCloudViaPOST(email) {
        log('Changing email to Melvor Cloud via POST');
        if (JWTData === undefined)
            return Promise.reject('JWTData is undefined');
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', melvorCloudLoginURL + 'updateEmail.php');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch (e) {
                    reject();
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            const data = JSON.stringify({
                email: email,
                jwt: JWT,
            });
            xhr.send(data);
        });
    }
    /** Change email address of user. Returns new and updated JWT session token on success.
     * @param email - The email to change to
     * @returns JSON containing the JWT session token on success
     */
    function changePasswordMelvorCloudViaPOST(currentPassword, newPassword) {
        log('Changing password to Melvor Cloud via POST');
        if (JWTData === undefined)
            return Promise.reject('JWTData is undefined');
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', melvorCloudLoginURL + 'updateUser.php');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                try {
                    resolve(JSON.parse(xhr.response));
                } catch (e) {
                    reject();
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            const email = JWTData === null || JWTData === void 0 ? void 0 : JWTData.email;
            const data = JSON.stringify({
                email: email,
                newPassword: newPassword,
                currentPassword: currentPassword,
                jwt: JWT,
            });
            xhr.send(data);
        });
    }
    /** Validates a stored JWT token received when authenticating to Melvor Cloud
     * @param token - The token to validate
     * @returns A promise that resolves to the token if valid, or rejects if invalid
     */
    function validateMelvorCloudToken(token) {
        log('Validating Melvor Cloud token');
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', melvorCloudLoginURL + 'validateToken.php');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                    });
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            const data = JSON.stringify({
                jwt: token
            });
            xhr.send(data);
        });
    }
    /** Deletes a user's Melvor Cloud account and all data associated with it.
     * @returns boolean result
     */
    function deleteMelvorCloudAccountViaPOST() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Deleting Melvor Cloud account via POST');
            if (JWTData === undefined)
                return Promise.reject('JWTData is undefined');
            return new Promise(function(resolve, reject) {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', melvorCloudLoginURL + 'deleteUser.php');
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onload = () => {
                    try {
                        resolve(JSON.parse(xhr.response));
                    } catch (e) {
                        reject();
                    }
                };
                xhr.onerror = () => {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                    });
                };
                const data = JSON.stringify({
                    jwt: JWT,
                });
                xhr.send(data);
            });
        });
    }
    /** Displays the container containing misc buttons after sign in */
    function showEnvContainer() {
        formElements.env.container.classList.remove('d-none');
    }
    /** Displays the connect to Patreon button for the test environment */
    function showPatreonConnectBtn() {
        formElements.env.patreonConnect.classList.remove('d-none');
    }
    /** Displays the connect to Patreon button for the test environment */
    function showTestServerSelectionBtn() {
        formElements.env.desktopTest.classList.remove('d-none');
        formElements.env.mobileTest.classList.remove('d-none');
    }
    /** Displays button to direct players to live version of the game */
    function showBaseGameBtn() {
        formElements.env.baseGame.classList.remove('d-none');
    }
    /** Displays button to direct players to test server */
    function showTestServerBtn() {
        formElements.env.testServer.classList.remove('d-none');
    }
    /** Redirect to the live game */
    function accessBaseGame() {
        location.href = 'https://melvoridle.com/';
    }
    /** Redirect to the test server */
    function accessTestServer(device = 'desktop') {
        switch (device) {
            case 'desktop':
                location.href = 'index_game.php';
                break;
            case 'mobile':
                location.href = 'index_mobile.php';
                break;
        }
    }
    /** Redirects user to patreon connect page. Also deletes JWT token from local storage as reauthentication is required upon return */
    function connectToPatreon() {
        removeJWTFromLocalStorage(); //We need to log in again once connected to retrieve Patreon tokens
        formElements.env.patreonConnect.innerHTML = btnPatreonConnectSpinner();
        location.href = 'https://test.melvoridle.com/cloud/patreon.php';
    }
    /** Checks test server access by authenticating against Patreon using stored tokens */
    function checkTestAccess() {
        return __awaiter(this, void 0, void 0, function*() {
            if (isTest())
                log('Checking access to test server');
            const canAccess = yield checkPatreon();
            if (isTest())
                log('Can Access? ' + canAccess);
            if (canAccess) {
                if (isTest())
                    log('Access Confirmed');
                showTestLink = true;
                return Promise.resolve(canAccess);
            } else {
                if (isTest())
                    log('Access Denied');
                return Promise.resolve(canAccess);
            }
        });
    }
    /** Initiates the check to Patreon to return current subscription status
     * Only initiates if user is accessing Test Server
     * @returns a promise that resolves to the Patreon subscription status as a Boolean
     */
    function checkPatreon() {
        return __awaiter(this, void 0, void 0, function*() {
            if (canAccessTest)
                return Promise.resolve(true);
            if (isTest())
                log('Checking Patreon');
            let validated = false;
            if (patreonAccessToken === '' || patreonRefreshToken === '') {
                if (isTest())
                    log('No Patreon Access Token or Refresh Token');
                return Promise.resolve(false);
            }
            try {
                const patreonData = yield getPatreonData();
                validated = validatePatreonSubscription(patreonData);
            } catch (e) {
                if (isTest()) {
                    log('Error checking Patreon: ' + e);
                    removeJWTFromLocalStorage();
                }
                return Promise.resolve(false);
            }
            return Promise.resolve(validated);
        });
    }
    /**
     * Gets Patreon data using Access Token and Refresh Token obtained from Cloud.
     * @returns A promise containing Patrein data that resolves to the tokens if valid, or rejects if invalid
     */
    function getPatreonData() {
        if (canAccessTest)
            log('Checking if user has test access via Patreon');
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', melvorCloudLoginURL + 'checkPatreon.php');
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                    });
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            const data = JSON.stringify({
                checkPatreon: 1,
                accessToken: patreonAccessToken,
                refreshToken: patreonRefreshToken,
            });
            xhr.send(data);
        });
    }
    /**
     * Validates active Patreon subscription based on current entitlement (in cents)
     * @param data - The data returned from checkTestAccessViaPatreon
     * @returns {boolean}
     */
    function validatePatreonSubscription(data) {
        let valid = false;
        if (data.included !== undefined) {
            for (let i = 0; i < data.included.length; i++) {
                const status = data.included[i].attributes.patron_status;
                const currentEntitlement = data.included[i].attributes.currently_entitled_amount_cents;
                if (status == 'active_patron' && currentEntitlement >= 440)
                    valid = true;
            }
        }
        return valid;
    }
    /** Get the save keys as an array for playfab api calls */
    function getPlayFabSaveKeys() {
        const keys = [];
        for (let i = 0; i < maxSaveSlots; i++) {
            keys.push(getPlayFabSaveKey(i));
        }
        return keys;
    }
    /** Returns the save key for PlayFab for specified save slot
     * @param saveSlot - The save slot to get the save key for
     */
    function getPlayFabSaveKey(saveSlot) {
        if (isBeta())
            return `save${saveSlot}_beta`;
        if (isTest())
            return `save${saveSlot}_test`;
        return `save${saveSlot}`;
    }
    /** Return the stored PlayFab save string. If no save found, returns empty string
     * @param saveSlot - The save slot to get the save string for
     */
    function getPlayFabSave(saveSlot) {
        var _a;
        const key = getPlayFabSaveKey(saveSlot);
        return playfabSaves[key] === undefined ? '' : (_a = playfabSaves[key].Value) !== null && _a !== void 0 ? _a : '';
    }
    /** Return the stored PlayFab save string. If no save found, returns empty string
     * @param saveSlot - The save slot to get the save string for
     */
    function getSaveFromLocalStorage(saveSlot) {
        return __awaiter(this, void 0, void 0, function*() {
            return yield getLocalSaveString(true, saveSlot);
        });
    }
    /** Update playfab save with current local save */
    function updatePlayFabSave() {
        return __awaiter(this, void 0, void 0, function*() {
            const saveKey = getPlayFabSaveKey(currentCharacter);
            const saveString = yield getSaveFromLocalStorage(currentCharacter);
            const requestData = {
                Data: {
                    [saveKey]: saveString,
                    currentGamemode: game.currentGamemode.id,
                },
            };
            return playfabAPI('UpdateUserData', requestData)
                .then((result) => {
                    if (result.code === 200)
                        log('PlayFab save updated successfully');
                    return Promise.resolve(result);
                })
                .catch((error) => {
                    log(error);
                    return Promise.reject(error);
                });
        });
    }
    /** Delete playfab save for defined save slot */
    function deletePlayFabSave(saveSlot) {
        return __awaiter(this, void 0, void 0, function*() {
            const saveKey = getPlayFabSaveKey(saveSlot);
            const requestData = {
                KeysToRemove: [saveKey],
            };
            return playfabAPI('UpdateUserData', requestData)
                .then((result) => {
                    if (result.code === 200) {
                        log('PlayFab save updated successfully');
                        refreshCloudSavesOnClick();
                    }
                    return Promise.resolve(result);
                })
                .catch((error) => {
                    log(error);
                    return Promise.reject(error);
                });
        });
    }

    function isAllowedToSaveToPlayFab() {
        return (Date.now() - lastSaveTimestamp) / 1000 > PLAYFAB_SAVE_INTERVAL;
    }
    /** Force a save update to PlayFab -  procs a local save */
    function forceUpdatePlayFabSave() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!isAllowedToSaveToPlayFab())
                return; // don't allow more than one sync per 10 seconds
            enableForceSyncStatus();
            disableForceSyncButton();
            saveData(); //proc a local save
            try {
                const update = yield updatePlayFabSave();
                if (update.code === 200) {
                    updateLastSaveTimestamp();
                    showPlayFabSaveSuccessfulNotification();
                    disableForceSyncStatus();
                    game.telemetry.processScheduledTelemetryData();
                    return Promise.resolve();
                }
            } catch (e) {
                displayUpdatePlayFabSaveErrorSwal(e);
                disableForceSyncStatus();
                enableForceSyncButton();
                return Promise.reject(e);
            }
        });
    }

    function updateLastSaveTimestamp() {
        lastSaveTimestamp = Date.now();
        updateLastSaveTimestampText();
    }

    function updateLastSaveTimestampText() {
        const time = Date.now();
        const lastSave = time - lastSaveTimestamp;
        if (lastSaveTimestamp > 0) {
            const el = document.getElementById('last-cloudsave-time');
            if (el !== null)
                el.textContent = formatAsShorthandTimePeriod(lastSave);
        }
    }

    function displayUpdatePlayFabSaveErrorSwal(error) {
        SwalLocale.fire({
            icon: 'error',
            title: getLangString('MENU_TEXT_CLOUD_SAVE_FAILED'),
            html: `<h5 class="font-w600">${getLangString('MENU_TEXT_CLOUD_SAVE_FAILED_BODY')}</h5><h5 class="font-w600 text-danger font-size-sm">Error: ${PlayFab.GenerateErrorReport(error)}</h5>`,
        });
    }
    /** Cloud save successful notification */
    function showPlayFabSaveSuccessfulNotification() {
        fireTopToast(`<div class="block block-rounded-double bg-dark p-2">
        <div class="media d-flex align-items-center push">
          <div class="mr-2"><img class="skill-icon-md" src="${assets.getURI('assets/media/main/cloud.png')}"></div>
          <div class="media-body text-left">
            <div class="font-w700 font-size-lg text-success">${getLangString('TOASTS_CLOUD_SAVE_SUCCESS')}</div>
            <div class="font-size-sm">
              ${getLangString('TOASTS_TAKE_A_BREATH')}
            </div>
          </div>
        </div>
      </div>`, 3000);
    }

    function enableForceSyncStatus() {
        const spinner = document.getElementById(`forceSyncSpinner`);
        spinner === null || spinner === void 0 ? void 0 : spinner.classList.remove('d-none');
    }

    function disableForceSyncStatus() {
        const spinner = document.getElementById(`forceSyncSpinner`);
        spinner === null || spinner === void 0 ? void 0 : spinner.classList.add('d-none');
    }

    function disableForceSyncButton() {
        const el = document.getElementById(`header-cloud-save-btn-connected`);
        if (el !== null)
            el.disabled = true;
    }

    function enableForceSyncButton() {
        const el = document.getElementById(`header-cloud-save-btn-connected`);
        if (el !== null)
            el.disabled = false;
    }
    /** Updates various UI elements in the game based on PlayFab authentication status
     * Runs on character select screen and again after character is selected
     */
    function updateUIForPlayFabSignIn() {
        var _a, _b, _c, _d, _e, _f;
        if (PlayFabClientSDK.IsClientLoggedIn()) {
            connectionSuccessPlayFab();
            console.log('Connected to PlayFab successfully');
            updatePlayFabAutoSaveInterval();
            game.telemetry.setEnableTelemetryFromCloud();
            (_a = document.getElementById('header-cloud-save-btn-disconnected')) === null || _a === void 0 ? void 0 : _a.classList.add('d-none');
            (_b = document.getElementById('header-cloud-save-btn-connecting')) === null || _b === void 0 ? void 0 : _b.classList.add('d-none');
            (_c = document.getElementById('header-cloud-save-btn-connected')) === null || _c === void 0 ? void 0 : _c.classList.remove('d-none');
            (_d = document.getElementById('header-cloud-save-time')) === null || _d === void 0 ? void 0 : _d.classList.remove('d-none');
            setLang !== 'en' ?
                (_e = document.getElementById('last-cloud-save-span')) === null || _e === void 0 ? void 0 : _e.classList.add('d-none') :
                (_f = document.getElementById('last-cloud-save-span')) === null || _f === void 0 ? void 0 : _f.classList.remove('d-none');
            updateMobilePurchaseStatus(); // TODO: Move to account update function on sign in
            enableCloudCharacterButton();
            updateUIForAccountSteamLinkStatus();
            updateUIForAccountEOSLinkStatus();
            document.querySelectorAll('.player-logged-in').forEach((el) => {
                hasExpansionEntitlement() ? showElement(el) : hideElement(el);
            });
        } else {
            connectionFailedPlayFab();
            document.querySelectorAll('.cloud-connection-status-spinner').forEach((element) => {
                element.textContent = 'There was an issue logging into the PlayFab service. Please refresh to try again.';
                element.classList.add('text-danger');
            });
            document.querySelectorAll('.cloud-connection-status-text').forEach((element) => {
                element.classList.add('d-none');
            });
        }
    }
    /** Updates various UI elements in the game based on Melvor Cloud authentication status
     * Runs on character select screen and again after character is selected
     */
    function updateUIForMelvorCloudSignIn() {
        if (isAuthenticated) {
            connectionSuccessMelvorCloud();
            if (!isOnAuthPage())
                updateCharacterSelectManagePage();
        } else
            connectionFailedMelvorCloud();
        if (characterSelected)
            loadCloudOptions(isAuthenticated); //TODO: Rewrite loadCloudOptions
        if (isAuthenticated && PlayFabClientSDK.IsClientLoggedIn() && showTestLink) {
            Array.from(document.getElementsByClassName('test-link')).forEach((el) => el.classList.remove('d-none'));
        }
    }
    /** Update UI elements on the character select page in the Manage section */
    function updateCharacterSelectManagePage() {
        if (JWTData === undefined)
            throw new Error('Player is authenticated but JWTData is undefined');
        const usernameText = document.getElementById('character-cloud-manage-username');
        usernameText.innerText = JWTData.username;
        const usernameField = document.getElementById('cloud-manage-form-username');
        usernameField.value = JWTData.username;
        formElements.characterSelect.email.input.value = JWTData.email;
        document.querySelectorAll('.btn-cloud-sign-in').forEach((element) => {
            element.classList.add('d-none');
        });
    }
    /**
     * Updates UI elements based on purchase status of full game or expansions
     */
    function updateUIForEntitlements() {
        const currentTime = new Date().getTime();
        document.querySelectorAll('.demo-version').forEach((element) => {
            if (entitlements.fullGame)
                element.remove();
        });
        document.querySelectorAll('.expansion-1-status').forEach((element) => {
            element.classList.remove('text-danger');
            element.classList.remove('text-warning');
            element.classList.remove('text-success');
            element.classList.remove('d-none');
            if (hasTotHEntitlementAndIsEnabled()) {
                element.innerHTML = `<i class="text-success fa fa-check-circle mr-1"></i>Throne of the Herald`;
                element.classList.add('text-success');
            } else if (hasTotHEntitlement()) {
                element.innerHTML = '<i class="text-warning fa fa-exclamation-circle mr-1"></i>Throne of the Herald';
                element.classList.add('text-warning');
            } else {
                element.innerHTML = '<i class="text-danger fa fa-times-circle mr-1"></i>Throne of the Herald';
                element.classList.add('text-danger');
            }
        });
        document.querySelectorAll('.expansion-1-show').forEach((element) => {
            hasTotHEntitlementAndIsEnabled() ? element.classList.remove('d-none') : element.classList.add('d-none');
        });
        document.querySelectorAll('.expansion-1-owned').forEach((element) => {
            entitlements.TotH ? element.classList.remove('d-none') : element.classList.add('d-none');
        });
        document.querySelectorAll('.btn-view-all-expansions').forEach((element) => {
            element.classList.remove('d-none');
        });
        document.querySelectorAll('.expansion-2-show').forEach((el) => {
            hasAoDEntitlementAndIsEnabled() ? showElement(el) : hideElement(el);
        });
        document.querySelectorAll('.expansion-2-owned').forEach((el) => {
            entitlements.AoD ? showElement(el) : hideElement(el);
        });
        document.querySelectorAll('.expansion-2-status').forEach((element) => {
            element.classList.remove('text-danger');
            element.classList.remove('text-warning');
            element.classList.remove('text-success');
            element.classList.remove('d-none');
            if (hasAoDEntitlementAndIsEnabled()) {
                element.innerHTML = `<i class="text-success fa fa-check-circle mr-1"></i>Atlas of Discovery`;
                element.classList.add('text-success');
            } else if (hasAoDEntitlement()) {
                element.innerHTML = '<i class="text-warning fa fa-exclamation-circle mr-1"></i>Atlas of Discovery';
                element.classList.add('text-warning');
            } else {
                element.innerHTML = '<i class="text-danger fa fa-times-circle mr-1"></i>Atlas of Discovery';
                element.classList.add('text-danger');
            }
        });
        document.querySelectorAll('.expansion-3-show').forEach((el) => {
            hasItAEntitlementAndIsEnabled() ? showElement(el) : hideElement(el);
        });
        document.querySelectorAll('.expansion-3-owned').forEach((el) => {
            entitlements.ItA ? showElement(el) : hideElement(el);
        });
        document.querySelectorAll('.expansion-3-status').forEach((element) => {
            element.classList.remove('text-danger');
            element.classList.remove('text-warning');
            element.classList.remove('text-success');
            element.classList.remove('d-none');
            if (hasItAEntitlementAndIsEnabled()) {
                element.innerHTML = `<i class="text-success fa fa-check-circle mr-1"></i>Into the Abyss`;
                element.classList.add('text-success');
            } else if (hasItAEntitlement()) {
                element.innerHTML = '<i class="text-warning fa fa-exclamation-circle mr-1"></i>Into the Abyss';
                element.classList.add('text-warning');
            } else {
                element.innerHTML = '<i class="text-danger fa fa-times-circle mr-1"></i>Into the Abyss';
                element.classList.add('text-danger');
            }
        });
        document.querySelectorAll('.expansion-any-show').forEach((el) => {
            hasExpansionEntitlementAndIsEnabled() ? showElement(el) : hideElement(el);
        });
        document.querySelectorAll('.expansion-not-owned').forEach((element) => {
            if (hasTotHEntitlement())
                element.remove();
        });
        document.querySelectorAll('.expansion-not-owned-2').forEach((element) => {
            if (hasAoDEntitlement())
                element.remove();
        });
        document.querySelectorAll('.expansion-not-owned-3').forEach((element) => {
            if (hasItAEntitlement())
                element.remove();
        });
        document.querySelectorAll('.expansion-2-buy-btn').forEach((element) => {
            if (!aodReleased())
                element.remove();
        });
        document.querySelectorAll('.expansion-2-release-date').forEach((element) => {
            if (!aodReleased())
                element.textContent = `Releasing 7 September 2023`;
        });
        document.querySelectorAll('.expansion-3-buy-btn').forEach((element) => {
            if (!itaReleased())
                element.remove();
        });
        document.querySelectorAll('.expansion-3-release-date').forEach((element) => {
            element.textContent = !itaReleased() ? `Releasing 13 June 2024` : 'Now Available!';
        });
        document.querySelectorAll('.expansion-not-owned-3-dismissable').forEach((element) => {
            const isDimissed = itaReleased() ?
                localStorage.getItem('expansion-not-owned-3-dismissed-released') :
                localStorage.getItem('expansion-not-owned-3-dismissed');
            const remindLater = itaReleased() ?
                localStorage.getItem('expansion-not-owned-3-remind-later-released') :
                localStorage.getItem('expansion-not-owned-3-remind-later');
            if (remindLater) {
                try {
                    const timestamp = Number.parseInt(remindLater);
                    if (currentTime - timestamp < remindLaterDuration)
                        element.remove();
                } catch (e) {
                    localStorage.removeItem('expansion-not-owned-3-remind-later');
                    localStorage.removeItem('expansion-not-owned-3-remind-later-released');
                    element.remove();
                }
            }
            if (isDimissed)
                element.remove();
        });
        document.querySelectorAll('.toth-release-date').forEach((element) => {
            element.remove();
        });
        /** EXPANSION SIDEBAR CATEGORIES */
        document.querySelectorAll('.expansion-1-version').forEach((element) => {
            hasTotHEntitlementAndIsEnabled() ? element.classList.remove('d-none') : element.classList.add('d-none');
        });
        document.querySelectorAll('.expansion-2-version').forEach((element) => {
            hasAoDEntitlementAndIsEnabled() ? element.classList.remove('d-none') : element.classList.add('d-none');
        });
        document.querySelectorAll('.expansion-3-version').forEach((element) => {
            hasItAEntitlementAndIsEnabled() ? element.classList.remove('d-none') : element.classList.add('d-none');
        });
        const slots = [
            document.getElementById('combat-equipment-slot-15-0'),
            document.getElementById('combat-equipment-slot-15-1'),
            document.getElementById('combat-equipment-slot-15-2'),
        ];
        slots.forEach((slot) => {
            if (slot !== null) {
                hasAoDEntitlementAndIsEnabled() ? slot.classList.remove('d-none') : slot.classList.add('d-none');
            }
        });
        document.querySelectorAll('.expansion-1-status-dot').forEach((element) => {
            hasTotHEntitlementAndIsEnabled() ? element.classList.remove('d-none') : element.classList.add('d-none');
        });
        document.querySelectorAll('.expansion-2-status-dot').forEach((element) => {
            hasAoDEntitlementAndIsEnabled() ? element.classList.remove('d-none') : element.classList.add('d-none');
        });
        document.querySelectorAll('.expansion-3-status-dot').forEach((element) => {
            hasItAEntitlementAndIsEnabled() ? element.classList.remove('d-none') : element.classList.add('d-none');
        });
    }

    function dismissExpansionNotOwned2() {
        aodReleased() ?
            localStorage.setItem('expansion-not-owned-2-dismissed-released', '1') :
            localStorage.setItem('expansion-not-owned-2-dismissed', '1');
        document.querySelectorAll('.expansion-not-owned-2-dismissable').forEach((element) => {
            element.remove();
        });
    }

    function remindLaterExpansionNotOwned2() {
        const currentTime = new Date().getTime();
        aodReleased() ?
            localStorage.setItem('expansion-not-owned-2-remind-later-released', currentTime.toString()) :
            localStorage.setItem('expansion-not-owned-2-remind-later', currentTime.toString());
        document.querySelectorAll('.expansion-not-owned-2-dismissable').forEach((element) => {
            element.remove();
        });
    }

    function dismissExpansionNotOwned3() {
        itaReleased() ?
            localStorage.setItem('expansion-not-owned-3-dismissed-released', '1') :
            localStorage.setItem('expansion-not-owned-3-dismissed', '1');
        document.querySelectorAll('.expansion-not-owned-3-dismissable').forEach((element) => {
            element.remove();
        });
    }

    function remindLaterExpansionNotOwned3() {
        const currentTime = new Date().getTime();
        itaReleased() ?
            localStorage.setItem('expansion-not-owned-3-remind-later-released', currentTime.toString()) :
            localStorage.setItem('expansion-not-owned-3-remind-later', currentTime.toString());
        document.querySelectorAll('.expansion-not-owned-3-dismissable').forEach((element) => {
            element.remove();
        });
    }

    function viewOtherExpansions() {
        $('#modal-expansions').modal('show');
    }
    /** UI update if connection to Melvor Cloud Succeeded */
    function connectionSuccessMelvorCloud() {
        Array.from(document.getElementsByClassName('melvor-cloud-connection-text')).forEach((element) => {
            element.classList.add('text-success');
            element.classList.remove('text-danger');
            element.classList.remove('text-info');
        });
        Array.from(document.getElementsByClassName('melvor-cloud-connection-status')).forEach((element) => {
            element.classList.add('d-none');
        });
        Array.from(document.getElementsByClassName('melvor-cloud-connection-check')).forEach((element) => {
            element.classList.remove('d-none');
        });
        Array.from(document.getElementsByClassName('btn-cloud-sign-out')).forEach((element) => {
            element.classList.remove('d-none');
        });
        Array.from(document.getElementsByClassName('btn-cloud-manage')).forEach((element) => {
            element.classList.remove('d-none');
        });
        Array.from(document.getElementsByClassName('character-selection-login')).forEach((element) => {
            element.classList.add('d-none');
        });
    }
    /** UI update if connection to Melvor Cloud Failed */
    function connectionFailedMelvorCloud() {
        Array.from(document.getElementsByClassName('melvor-cloud-connection-text')).forEach((element) => {
            element.classList.remove('text-success');
            element.classList.add('text-danger');
        });
        Array.from(document.getElementsByClassName('melvor-cloud-connection-status')).forEach((element) => {
            element.classList.add('d-none');
        });
        Array.from(document.getElementsByClassName('melvor-cloud-connection-times')).forEach((element) => {
            element.classList.remove('d-none');
        });
        failPlatformPurchase('steam');
        failPlatformPurchase('epic');
    }

    function logout() {
        changePageCharacterSelection(5);
        Array.from(document.getElementsByClassName('btn-cloud-sign-out')).forEach((element) => {
            element.classList.add('d-none');
        });
        Array.from(document.getElementsByClassName('btn-cloud-manage')).forEach((element) => {
            element.classList.add('d-none');
        });
        clearStoredCloudCredentials();
        returnToGameAfterSubmission = false;
        window.setTimeout(function() {
            location.href = 'index.php';
        }, 500);
    }

    function clearStoredCloudCredentials() {
        removeAppleTokenFromLocalStorage();
        removeGoogleTokenFromLocalStorage();
        removeJWTFromLocalStorage();
        localStorage.removeItem('isPremium');
        localStorage.removeItem('playFabID');
    }

    function hasFullGame() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!nativeManager.isSteam)
                setStatus(getLangString('MENU_TEXT_LOADING_MSG_VALIDATING_PURCHASES'));
            else
                setStatus(getLangString('MENU_TEXT_LOADING_MSG_VALIDATING_PURCHASES_STEAM'));
            log('Checking for valid full version');
            if ((enableMelvorCloudBypass && DEBUGENABLED) || (isDevModeEnabled() && isTest())) {
                switch (getCloudBypassMode()) {
                    case 0 /* CloudBypassMode.Custom */ :
                        {
                            const userResponse = yield SwalLocale.fire({
                                title: 'Load Full Version Data?',
                                showCancelButton: true,
                                icon: 'question',
                                confirmButtonText: 'Yes',
                                cancelButtonText: 'No',
                            });
                            entitlements.fullGame = userResponse.isConfirmed;
                        }
                        break;
                    case 1 /* CloudBypassMode.Demo */ :
                        entitlements.fullGame = false;
                        break;
                    default:
                        entitlements.fullGame = true;
                        break;
                }
                return entitlements.fullGame;
            }
            //check test server and force true
            if (isTest() ||
                hasFullVersionEntitlement() ||
                nativeManager.isAndroidFullVersionNativeApp ||
                isLocalSteamBaseGameVerified()) {
                entitlements.fullGame = true;
                return Promise.resolve(true);
            }
            if (PlayFabClientSDK.IsClientLoggedIn()) {
                //Check Steam
                /**try {
                  const steamStatus = await getSteamPurchaseStatus();
                  if (steamStatus.isOwned) {
                    entitlements.fullGame = true;
                    return Promise.resolve(true);
                  }
                } catch (e) {
                  console.log(e);
                }
                //Then check mobile
                try {
                  const mobileStatus = await getMobilePurchaseStatus();
                  if (mobileStatus) {
                    entitlements.fullGame = true;
                    return Promise.resolve(true);
                  }
                } catch (e) {
                  console.log(e);
                }
                //Then Epic
                try {
                  const status = await getEpicPurchaseStatus();
                  if (status) {
                    entitlements.fullGame = true;
                    return Promise.resolve(true);
                  }
                } catch (e) {
                  console.log(e);
                }**/
                //Check playfab grandfathered date
                try {
                    const playFabCreationDate = yield compareCreationDates();
                    if (playFabCreationDate) {
                        entitlements.fullGame = true;
                        return Promise.resolve(true);
                    }
                } catch (e) {
                    console.log(e);
                }
            } else if (nativeManager.isEpicGames) {
                try {
                    const status = yield checkEpicGamesOwnershipLocal('FullGame');
                    if (status) {
                        entitlements.fullGame = true;
                        return Promise.resolve(status);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            //Then check grandfathered account
            try {
                const grandfathered = checkMelvorCloudGrandfathered();
                if (grandfathered) {
                    entitlements.fullGame = true;
                    return Promise.resolve(grandfathered);
                }
            } catch (e) {
                console.log(e);
            }
            //Return false if nothing
            return Promise.resolve(false);
        });
    }

    function hasTotH() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Checking for valid TotH purchase');
            if ((enableMelvorCloudBypass && DEBUGENABLED) || (isDevModeEnabled() && isTest())) {
                switch (getCloudBypassMode()) {
                    case 0 /* CloudBypassMode.Custom */ :
                        {
                            const userResponse = yield SwalLocale.fire({
                                title: 'Load Throne of the Herald Data?',
                                showCancelButton: true,
                                icon: 'question',
                                confirmButtonText: 'Yes',
                                cancelButtonText: 'No',
                            });
                            entitlements.TotH = userResponse.isConfirmed;
                            break;
                        }
                    case 3 /* CloudBypassMode.ToTH */ :
                    case 6 /* CloudBypassMode.AllExpacs */ :
                        entitlements.TotH = true;
                        break;
                    default:
                        entitlements.TotH = false;
                        break;
                }
                return entitlements.TotH;
            }
            //check test server and force true
            if (isTest() || hasTotHEntitlement()) {
                entitlements.TotH = true;
                return Promise.resolve(true);
            } else if (isLocalSteamToTHVerified()) {
                entitlements.TotH = true;
                return Promise.resolve(true);
            } else if (PlayFabClientSDK.IsClientLoggedIn()) {
                //Check Steam
                /**try {
                  const steamStatus = await getSteamExpansionPurchaseStatus();
                  if (steamStatus.isOwned) {
                    entitlements.TotH = true;
                    return Promise.resolve(true);
                  }
                } catch (e) {
                  console.log(e);
                }
                //Then check mobile expansion
                try {
                  const mobileStatus = await getMobileExpansionStatus();
                  if (mobileStatus) {
                    entitlements.TotH = mobileStatus;
                    return Promise.resolve(mobileStatus);
                  }
                } catch (e) {
                  console.log(e);
                }
                //Check Epic
                try {
                  const status = await getEpicExpansionPurchaseStatus();
                  if (status) {
                    entitlements.TotH = true;
                    return Promise.resolve(true);
                  }
                } catch (e) {
                  console.log(e);
                }**/
            } else if (nativeManager.isEpicGames) {
                try {
                    const status = yield checkEpicGamesOwnershipLocal('TotH');
                    if (status) {
                        entitlements.TotH = true;
                        return Promise.resolve(status);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            //Return false if nothing
            entitlements.TotH = false;
            return Promise.resolve(false);
        });
    }

    function isDevModeEnabled() {
        const devMode = localStorage.getItem('enableDevMode');
        if (devMode)
            return true;
        return false;
    }

    function toggleDevMode() {
        const devMode = localStorage.getItem('enableDevMode');
        if (devMode)
            localStorage.removeItem('enableDevMode');
        else
            localStorage.setItem('enableDevMode', 'true');
    }

    function getCloudBypassMode() {
        if (isDevModeEnabled() && isTest())
            return 0 /* CloudBypassMode.Custom */ ;
        return cloudBypassMode;
    }

    function hasAoD() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Checking for valid Atlas of Discovery purchase');
            if ((enableMelvorCloudBypass && DEBUGENABLED) || (isDevModeEnabled() && isTest())) {
                switch (getCloudBypassMode()) {
                    case 0 /* CloudBypassMode.Custom */ :
                        {
                            const userResponse = yield SwalLocale.fire({
                                title: 'Load Atlas of Discovery Data?',
                                showCancelButton: true,
                                icon: 'question',
                                confirmButtonText: 'Yes',
                                cancelButtonText: 'No',
                            });
                            entitlements.AoD = userResponse.isConfirmed;
                        }
                        break;
                    case 4 /* CloudBypassMode.AoD */ :
                    case 6 /* CloudBypassMode.AllExpacs */ :
                        entitlements.AoD = true;
                        break;
                    default:
                        entitlements.AoD = false;
                        break;
                }
                return entitlements.AoD;
            }
            if (isTest() || hasAoDEntitlement()) {
                entitlements.AoD = true;
                return Promise.resolve(true);
            } else if (isLocalSteamAoDVerified()) {
                entitlements.AoD = true;
                return Promise.resolve(true);
            } else if (nativeManager.isEpicGames) {
                try {
                    const status = yield checkEpicGamesOwnershipLocal('AoD');
                    if (status) {
                        entitlements.AoD = true;
                        return Promise.resolve(status);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            return Promise.resolve(false);
        });
    }

    function hasItA() {
        return __awaiter(this, void 0, void 0, function*() {
            log('Checking for valid Into the Abyss purchase');
            if ((enableMelvorCloudBypass && DEBUGENABLED) || (isDevModeEnabled() && isTest())) {
                switch (getCloudBypassMode()) {
                    case 0 /* CloudBypassMode.Custom */ :
                        {
                            const userResponse = yield SwalLocale.fire({
                                title: 'Load Into the Abyss Data?',
                                showCancelButton: true,
                                icon: 'question',
                                confirmButtonText: 'Yes',
                                cancelButtonText: 'No',
                            });
                            entitlements.ItA = userResponse.isConfirmed;
                        }
                        break;
                    case 5 /* CloudBypassMode.ItA */ :
                    case 6 /* CloudBypassMode.AllExpacs */ :
                        entitlements.ItA = true;
                        break;
                    default:
                        entitlements.ItA = false;
                        break;
                }
                return entitlements.ItA;
            }
            if (isTest() || hasItAEntitlement()) {
                entitlements.ItA = true;
                return Promise.resolve(true);
            } else if (isLocalSteamItAVerified()) {
                entitlements.ItA = true;
                return Promise.resolve(true);
            } else if (nativeManager.isEpicGames) {
                try {
                    const status = yield checkEpicGamesOwnershipLocal('ItA');
                    if (status) {
                        entitlements.ItA = true;
                        return Promise.resolve(status);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            return Promise.resolve(false);
        });
    }

    function isLocalSteamBaseGameVerified() {
        if (!nativeManager.isSteam)
            return false;
        if (nativeManager.isUsingGreenworks) {
            return (parent.greenworks.isSteamRunning() &&
                parent.greenworks.init() &&
                parent.greenworks.initAPI() &&
                parent.greenworks.isSubscribedApp(1267910));
        } else if (nativeManager.isUsingSteamworks) {
            return parent.steamworksClient.apps.isSubscribedApp(1267910);
        }
        return false;
    }

    function isLocalSteamToTHVerified() {
        if (!nativeManager.isSteam)
            return false;
        if (nativeManager.isUsingGreenworks) {
            return (parent.greenworks.isSteamRunning() &&
                parent.greenworks.init() &&
                parent.greenworks.initAPI() &&
                parent.greenworks.isSubscribedApp(2055140));
        } else if (nativeManager.isUsingSteamworks) {
            return parent.steamworksClient.apps.isSubscribedApp(2055140);
        }
        return false;
    }

    function isLocalSteamAoDVerified() {
        if (!nativeManager.isSteam)
            return false;
        if (nativeManager.isUsingGreenworks) {
            return (parent.greenworks.isSteamRunning() &&
                parent.greenworks.init() &&
                parent.greenworks.initAPI() &&
                parent.greenworks.isSubscribedApp(2492940));
        } else if (nativeManager.isUsingSteamworks) {
            return parent.steamworksClient.apps.isSubscribedApp(2492940);
        }
        return false;
    }

    function isLocalSteamItAVerified() {
        if (!nativeManager.isSteam)
            return false;
        if (nativeManager.isUsingGreenworks) {
            return (parent.greenworks.isSteamRunning() &&
                parent.greenworks.init() &&
                parent.greenworks.initAPI() &&
                parent.greenworks.isSubscribedApp(2860590));
        } else if (nativeManager.isUsingSteamworks) {
            return parent.steamworksClient.apps.isSubscribedApp(2860590);
        }
        return false;
    }

    function updateUIForAccountSteamLinkStatus(updateAccountInfo = false) {
        return __awaiter(this, void 0, void 0, function*() {
            if (!PlayFabClientSDK.IsClientLoggedIn()) {
                failPlatformPurchase('steam');
                nativeManager.isEpicGames ? hidePlatformPurchase('steam') : showPlatformPurchase('steam');
                return;
            }
            if (updateAccountInfo) {
                const newAccountInfo = yield getAccountInfo();
                accountInfo = newAccountInfo.data.AccountInfo;
            }
            try {
                const steamStatus = yield getSteamPurchaseStatus();
                if (steamStatus.isOwned) {
                    confirmPlatformPurchase('steam');
                    showPlatformPurchase('steam');
                } else if ((accountInfo !== undefined && accountInfo.SteamInfo !== undefined) || isLocalSteamBaseGameVerified()) {
                    warningPlatformPurchase('steam');
                    nativeManager.isEpicGames ? hidePlatformPurchase('steam') : showPlatformPurchase('steam');
                } else {
                    failPlatformPurchase('steam');
                    nativeManager.isEpicGames ? hidePlatformPurchase('steam') : showPlatformPurchase('steam');
                }
            } catch (e) {
                console.log(e);
                failPlatformPurchase('steam');
                nativeManager.isEpicGames ? hidePlatformPurchase('steam') : showPlatformPurchase('steam');
            }
        });
    }

    function updateUIForAccountEOSLinkStatus(updateAccountInfo = false) {
        return __awaiter(this, void 0, void 0, function*() {
            if (!PlayFabClientSDK.IsClientLoggedIn()) {
                failPlatformPurchase('epic');
                nativeManager.isSteam ? hidePlatformPurchase('epic') : showPlatformPurchase('epic');
                return;
            }
            if (updateAccountInfo) {
                const newAccountInfo = yield getAccountInfo();
                accountInfo = newAccountInfo.data.AccountInfo;
            }
            try {
                const epicStatus = yield getEpicPurchaseStatus();
                if (epicStatus) {
                    confirmPlatformPurchase('epic');
                    showPlatformPurchase('epic');
                } else if (EOSAlreadyLinked()) {
                    warningPlatformPurchase('epic');
                    nativeManager.isSteam ? hidePlatformPurchase('epic') : showPlatformPurchase('epic');
                } else {
                    failPlatformPurchase('epic');
                    nativeManager.isSteam ? hidePlatformPurchase('epic') : showPlatformPurchase('epic');
                }
            } catch (e) {
                console.log(e);
                EOSAlreadyLinked() ? warningPlatformPurchase('epic') : failPlatformPurchase('epic');
                nativeManager.isSteam ? hidePlatformPurchase('epic') : showPlatformPurchase('epic');
            }
        });
    }

    function displaySteamLinkSwal(useEpic = false) {
        return __awaiter(this, void 0, void 0, function*() {
            if (useEpic) {
                onEOSClick();
                return;
            }
            if (!PlayFabClientSDK.IsClientLoggedIn()) {
                SwalLocale.fire({
                    html: getLangString('MENU_TEXT_NOT_LOGGED_IN_STEAM'),
                });
                return;
            }
            SwalLocale.fire({
                html: getLangString('MENU_TEXT_LOADING_PLEASE_WAIT'),
            });
            const steamID = accountInfo !== undefined && accountInfo.SteamInfo !== undefined ?
                accountInfo.SteamInfo.SteamId :
                getLangString('MENU_TEXT_NA');
            const steamName = accountInfo !== undefined && accountInfo.SteamInfo !== undefined ?
                accountInfo.SteamInfo.SteamName :
                getLangString('MENU_TEXT_NA');
            let hasSteamTotH = false;
            let hasSteamFullGame = false;
            let hasSteamAoD = false;
            let hasSteamItA = false;
            const steamHasFullGame = yield getSteamPurchaseStatus();
            if (steamHasFullGame.isOwned)
                hasSteamFullGame = true;
            const steamHasTotH = yield getSteamExpansionPurchaseStatus();
            if (steamHasTotH.isOwned)
                hasSteamTotH = true;
            const steamHasAoD = yield getSteamExpansion2PurchaseStatus();
            if (steamHasAoD.isOwned)
                hasSteamAoD = true;
            const steamHasItA = yield getSteamExpansion3PurchaseStatus();
            if (steamHasItA.isOwned)
                hasSteamItA = true;
            const html = `<span class="font-w400">${getLangString('MENU_TEXT_STEAM_LINK_INFO_0')}<br><br>
    <span class="font-w600">${getLangString('MENU_TEXT_STEAM_LINK_INFO_1')}</span> <span class="text-info">${steamID}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_STEAM_LINK_INFO_2')}</span> <span class="text-info">${steamName}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_STEAM_LINK_INFO_3')}</span> <span class="${hasSteamFullGame ? 'text-success' : 'text-danger'}">${hasSteamFullGame}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_STEAM_LINK_INFO_4')}</span> <span class="${hasSteamTotH ? 'text-success' : 'text-danger'}">${hasSteamTotH}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_STEAM_LINK_INFO_6')}</span> <span class="${hasSteamAoD ? 'text-success' : 'text-danger'}">${hasSteamAoD}</span><br>
    <span class="font-w600">${getLangString('MENU_TEXT_STEAM_LINK_INFO_7')}</span> <span class="${hasSteamItA ? 'text-success' : 'text-danger'}">${hasSteamItA}</span><br><br>
    <small class="text-warning">${getLangString('MENU_TEXT_STEAM_LINK_INFO_5')}</small>
    ${nativeManager.isSteam
                ? `<br><br><small class="text-warning"><a class="link-fx text-primary pointer-enabled" onclick="cloudManager.unlinkSteamAccountFromPlayFab();">Force Steam account relink</a> (Game will reload)</small>`
                : ``}
    `;
            SwalLocale.fire({
                title: getLangString('MENU_TEXT_STEAM_LINK_INFO_TITLE'),
                html: html,
            });
        });
    }
    /** Promise that uses Playfab to check active purchase status of all versions of the game. */
    function getEntitlementPurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const sandboxID = nativeManager.isEpicGames ? getEOSSandboxIDFromArgv(parent.nw.App.argv) : '';
            const validation = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'checkAppOwnership',
                    FunctionParameter: {
                        authCode: EOSAccessToken,
                        sandboxID: sandboxID
                    }
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve(defaultPlayFabPurchaseValidation);
                });
            });
            return validation;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Steam version. Utilises Steam's Web API */
    function getSteamPurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isSteamPurchased = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'steamCheckAppOwnership'
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve({
                            isOwned: false
                        });
                });
            });
            return isSteamPurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Expansion 1 via Steam. Utilises Steam's Web API */
    function getSteamExpansionPurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isSteamPurchased = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'steamCheckExpansionOwnership'
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve({
                            isOwned: false
                        });
                });
            });
            return isSteamPurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Expansion 2 via Steam. Utilises Steam's Web API */
    function getSteamExpansion2PurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isSteamPurchased = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'steamCheckExpansion2Ownership'
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve({
                            isOwned: false
                        });
                });
            });
            return isSteamPurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Expansion 3 via Steam. Utilises Steam's Web API */
    function getSteamExpansion3PurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isSteamPurchased = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'steamCheckExpansion3Ownership'
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve({
                            isOwned: false
                        });
                });
            });
            return isSteamPurchased;
        });
    }
    /** Removes the linked Steam account from the current logged in PlayFab account and reloads the game */
    function unlinkSteamAccountFromPlayFab() {
        return __awaiter(this, void 0, void 0, function*() {
            SwalLocale.fire({
                text: getLangString('MENU_TEXT_LOADING_PLEASE_WAIT'),
            });
            const accountUnlinked = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'unlinkSteamAccount'
                }, function(result, error) {
                    location.reload();
                });
            });
            return accountUnlinked;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Mobile version */
    function getMobilePurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'getMobilePurchaseStatus'
                }, function(d, error) {
                    if (d !== undefined && d !== null && d.data.FunctionResult !== undefined)
                        resolve(d.data.FunctionResult);
                    else
                        reject(error);
                });
            });
            return isMobilePurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Mobile version */
    function getMobileExpansionStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'getMobileExpansionStatus'
                }, function(d, error) {
                    if (d !== undefined && d !== null && d.data.FunctionResult !== undefined)
                        resolve(d.data.FunctionResult);
                    else
                        reject(error);
                });
            });
            return isMobilePurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Mobile version */
    function getMobileExpansion2Status() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'getMobileExpansion2Status'
                }, function(d, error) {
                    if (d !== undefined && d !== null && d.data.FunctionResult !== undefined)
                        resolve(d.data.FunctionResult);
                    else
                        reject(error);
                });
            });
            return isMobilePurchased;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Epic Games version. Utilises Epic Game's Web API */
    function getEpicPurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const sandboxID = nativeManager.isEpicGames ? getEOSSandboxIDFromArgv(parent.nw.App.argv) : '';
            const valid = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'EOSCheckAppOwnership',
                    FunctionParameter: {
                        authCode: EOSAccessToken,
                        sandboxID: sandboxID
                    }
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve(false);
                });
            });
            return valid;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Expansion 1 via Epic. Utilises Epic's Web API */
    function getEpicExpansionPurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const sandboxID = nativeManager.isEpicGames ? getEOSSandboxIDFromArgv(parent.nw.App.argv) : '';
            const valid = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'EOSCheckExpansionOwnership',
                    FunctionParameter: {
                        authCode: EOSAccessToken,
                        sandboxID: sandboxID
                    },
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve(false);
                });
            });
            return valid;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Expansion 2 via Epic. Utilises Epic's Web API */
    function getEpicExpansion2PurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const sandboxID = nativeManager.isEpicGames ? getEOSSandboxIDFromArgv(parent.nw.App.argv) : '';
            const valid = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'EOSCheckExpansion2Ownership',
                    FunctionParameter: {
                        authCode: EOSAccessToken,
                        sandboxID: sandboxID
                    },
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve(false);
                });
            });
            return valid;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Expansion 3 via Epic. Utilises Epic's Web API */
    function getEpicExpansion3PurchaseStatus() {
        return __awaiter(this, void 0, void 0, function*() {
            const sandboxID = nativeManager.isEpicGames ? getEOSSandboxIDFromArgv(parent.nw.App.argv) : '';
            const valid = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'EOSCheckExpansion3Ownership',
                    FunctionParameter: {
                        authCode: EOSAccessToken,
                        sandboxID: sandboxID
                    },
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve(false);
                });
            });
            return valid;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Epic Games version. Utilises Epic Game's Web API */
    function getEOSAccountName() {
        return __awaiter(this, void 0, void 0, function*() {
            const valid = new Promise((resolve) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'getEOSAccountInformation',
                    FunctionParameter: {
                        authCode: EOSAccessToken
                    }
                }, function(result, error) {
                    if (result !== null)
                        resolve(result.data.FunctionResult);
                    else
                        resolve('N/A');
                });
            });
            return valid;
        });
    }
    /** Promise that uses Playfab to check active purchase status of Mobile version */
    function getMobileExpansion3Status() {
        return __awaiter(this, void 0, void 0, function*() {
            const isMobilePurchased = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'getMobileExpansion3Status'
                }, function(d, error) {
                    if (d !== undefined && d !== null && d.data.FunctionResult !== undefined)
                        resolve(d.data.FunctionResult);
                    else
                        reject(error);
                });
            });
            return isMobilePurchased;
        });
    }
    /** Promise that deletes a user's playfab account */
    function deletePlayFabAccount() {
        return __awaiter(this, void 0, void 0, function*() {
            const deletePlayer = new Promise((resolve, reject) => {
                PlayFabClientSDK.ExecuteCloudScript({
                    FunctionName: 'deletePlayer'
                }, function(d, error) {
                    if (d !== undefined && d !== null && d.data.FunctionResult !== undefined)
                        resolve(d.data.FunctionResult);
                    else
                        reject(error);
                });
            });
            return deletePlayer;
        });
    }

    function getPlayFabCreationDate() {
        return __awaiter(this, void 0, void 0, function*() {
            const date = new Promise((resolve, reject) => {
                if (accountInfo === undefined)
                    reject(false);
                else
                    resolve(accountInfo.Created);
            });
            return date;
        });
    }

    function compareCreationDates() {
        return __awaiter(this, void 0, void 0, function*() {
            getPlayFabCreationDate().then((creationDate) => {
                if (creationDate !== false) {
                    if (new Date(creationDate).getTime() < grandfatheredTimestamp) {
                        return Promise.resolve(true);
                    } else
                        return Promise.resolve(false);
                } else
                    return Promise.resolve(false);
            });
            return Promise.resolve(false);
        });
    }

    function updateEntitlementsFromReceiptData() {
        if (nativeManager.hasValidIOSExpandedEdition()) {
            entitlements.fullGame = true;
            entitlements.TotH = true;
        }
        if (!entitlements.fullGame && nativeManager.hasValidIOSFullGame())
            entitlements.fullGame = true;
        if (!entitlements.TotH && nativeManager.hasValidIOSTotH())
            entitlements.TotH = true;
        if (!entitlements.AoD && nativeManager.hasValidIOSAoD())
            entitlements.AoD = true;
        if (!entitlements.ItA && nativeManager.hasValidIOSItA())
            entitlements.ItA = true;
        if (nativeManager.hasValidAndroidExpandedEdition()) {
            entitlements.fullGame = true;
            entitlements.TotH = true;
        }
        if (!entitlements.fullGame && nativeManager.hasValidAndroidFullGame())
            entitlements.fullGame = true;
        if (!entitlements.TotH && nativeManager.hasValidAndroidTotH())
            entitlements.TotH = true;
        if (!entitlements.AoD && nativeManager.hasValidAndroidAoD())
            entitlements.AoD = true;
        if (!entitlements.ItA && nativeManager.hasValidAndroidItA())
            entitlements.ItA = true;
    }

    function checkMelvorCloudGrandfathered() {
        const iosDate = new Date(accountCreated.replace(/\s/, 'T'));
        if (JWTData === undefined)
            return false;
        if (JWTData.created === undefined || JWTData.created === null)
            return false;
        return new Date(iosDate).getTime() < grandfatheredTimestamp;
    }

    function handleLoadingError(title, e) {
        var _a;
        console.error(e);
        const errorBox = document.getElementById('on-load-error');
        if (errorBox === null)
            return;
        errorBox.innerHTML += `<h4 class="text-danger mb-2">${title}</h4>`;
        const errorArea = createElement('textarea', {
            className: 'form-control text-danger'
        });
        errorArea.rows = 5;
        errorArea.readOnly = true;
        errorArea.onclick = () => errorArea.setSelectionRange(0, errorArea.value.length);
        if (e instanceof Error) {
            errorArea.value = `${e.name}: ${e.message}
=== Stack Trace ===
${(_a = e.stack) !== null && _a !== void 0 ? _a : 'Stack not available.'}`;
        } else {
            errorArea.value = `Unknown error: ${e}`;
        }
        errorBox.append(errorArea);
    }

    function showEpicGamesLaunchError() {
        const errorBox = document.getElementById('on-load-error');
        if (errorBox === null)
            return;
        errorBox.innerHTML += `<h4 class="text-danger mb-2">${'Error: Game configuration not located. Please launch the game via the Epic Games Launcher.'}</h4>`;
    }

    function showFileVersionMismatch() {
        const errorBox = document.getElementById('on-load-error');
        if (errorBox === null)
            return;
        errorBox.innerHTML += `<h4 class="text-danger mb-2">${'Error: Game File Version Mismatch. Please reload the game.'}</h4>`;
    }

    function failPlatformPurchase(platform) {
        $(`.full-activation-status-${platform}-spinner`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-check`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-times`).removeClass(`d-none`);
        $(`.full-activation-status-${platform}-warning`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-text`).addClass(`text-danger`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-success`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-warning`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-white`);
    }

    function confirmPlatformPurchase(platform) {
        $(`.full-activation-status-${platform}-spinner`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-check`).removeClass(`d-none`);
        $(`.full-activation-status-${platform}-times`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-warning`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-danger`);
        $(`.full-activation-status-${platform}-text`).addClass(`text-success`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-warning`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-white`);
    }

    function warningPlatformPurchase(platform) {
        $(`.full-activation-status-${platform}-spinner`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-check`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-times`).addClass(`d-none`);
        $(`.full-activation-status-${platform}-warning`).removeClass(`d-none`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-danger`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-success`);
        $(`.full-activation-status-${platform}-text`).addClass(`text-warning`);
        $(`.full-activation-status-${platform}-text`).removeClass(`text-white`);
    }

    function hidePlatformPurchase(platform) {
        $(`.full-activation-${platform}`).addClass(`d-none`);
    }

    function showPlatformPurchase(platform) {
        $(`.full-activation-${platform}`).removeClass(`d-none`);
    }

    function saveToSteamCloud(key, value) {
        if (!nativeManager.isSteam || !enableSteamCloud)
            return;
        if (nativeManager.isUsingGreenworks) {
            if (!parent.greenworks.isCloudEnabled() || !parent.greenworks.isCloudEnabledForUser()) {
                if (DEBUGENABLED)
                    console.warn('Steam Cloud is not enabled');
                return;
            }
            parent.greenworks.saveTextToFile(`savegame_${key}.txt`, value.toString(), () => {
                if (DEBUGENABLED)
                    console.log(`Save key ${key} saved to Steam Cloud`);
            }, (err) => {
                if (DEBUGENABLED)
                    console.log(`Error saving key ${key} to Steam Cloud: ${err}`);
            });
        } else if (nativeManager.isUsingSteamworks) {
            if (!parent.steamworksClient.cloud.isEnabledForApp() || !parent.steamworksClient.cloud.isEnabledForAccount()) {
                if (DEBUGENABLED)
                    console.warn('Steam Cloud is not enabled');
                return;
            }
            const saved = parent.steamworksClient.cloud.writeFile(`savegame_${key}.txt`, value.toString());
            if (DEBUGENABLED)
                console.log(`Save key ${key} saved to Steam Cloud: ${saved}`);
        }
    }

    function readFromSteamCloud(key) {
        return __awaiter(this, void 0, void 0, function*() {
            if (!nativeManager.isSteam || !enableSteamCloud)
                return;
            if (nativeManager.isUsingGreenworks) {
                if (!parent.greenworks.isCloudEnabled() || !parent.greenworks.isCloudEnabledForUser()) {
                    if (DEBUGENABLED)
                        console.warn('Steam Cloud is not enabled');
                    return Promise.resolve(undefined);
                }
                const saveString = new Promise((resolve) => {
                    parent.greenworks.readTextFromFile(`savegame_${key}.txt`, (saveString) => {
                        if (DEBUGENABLED)
                            console.log(`Save key ${key} from Steam Cloud located`);
                        return resolve(saveString);
                    }, (err) => {
                        if (DEBUGENABLED)
                            console.log(`Error reading save key ${key} from Steam Cloud: ${err}`);
                        return resolve(undefined);
                    });
                });
                return saveString;
            } else if (nativeManager.isUsingSteamworks) {
                if (!parent.steamworksClient.cloud.isEnabledForApp() || !parent.steamworksClient.cloud.isEnabledForAccount()) {
                    const saveString = new Promise((resolve) => {
                        const saveString = parent.steamworksClient.cloud.readFile(`savegame_${key}.txt`);
                        if (DEBUGENABLED)
                            console.log(`Save key ${key} from Steam Cloud located`);
                        return resolve(saveString);
                    });
                    return saveString;
                }
            }
        });
    }

    function deleteFromSteamCloud(key) {
        if (!nativeManager.isSteam || !enableSteamCloud)
            return;
        if (nativeManager.isUsingGreenworks) {
            if (!parent.greenworks.isCloudEnabled() || !parent.greenworks.isCloudEnabledForUser()) {
                if (DEBUGENABLED)
                    console.warn('Steam Cloud is not enabled');
                return;
            }
            parent.greenworks.deleteFile(`savegame_${key}.txt`, () => {
                console.log(`Save key ${key} deleted from Steam Cloud`);
            }, (err) => {
                console.log(`Error deleting save key ${key} from Steam Cloud: ${err}`);
            });
        } else if (nativeManager.isUsingSteamworks) {
            if (!parent.steamworksClient.cloud.isEnabledForApp() || !parent.steamworksClient.cloud.isEnabledForAccount()) {
                const deleted = parent.steamworksClient.cloud.deleteFile(`savegame_${key}.txt`);
                console.log(`Save key ${key} deleted from Steam Cloud: ${deleted}`);
            }
        }
    }

    function getSearchParam(key) {
        const params = new URLSearchParams(window.location.search);
        return params.get(key);
    }

    function toggleExpansionLoading(expansion) {
        const keySuffix = isTest() ? '_Test' : '';
        switch (expansion) {
            case 0:
                enabledExpansions.TotH = !enabledExpansions.TotH;
                updatePlayFabUserData(`TotHEnabled${keySuffix}`, enabledExpansions.TotH ? '1' : '0');
                break;
            case 1:
                enabledExpansions.AoD = !enabledExpansions.AoD;
                updatePlayFabUserData(`AoDEnabled${keySuffix}`, enabledExpansions.AoD ? '1' : '0');
                break;
            case 2:
                enabledExpansions.ItA = !enabledExpansions.ItA;
                updatePlayFabUserData(`ItAEnabled${keySuffix}`, enabledExpansions.ItA ? '1' : '0');
                break;
        }
    }

    function getEnabledExpansionsFromPlayFab() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!PlayFabClientSDK.IsClientLoggedIn())
                return;
            setStatus('Confirming Expansions to load...');
            const keySuffix = isTest() ? '_Test' : '';
            const keys = [`TotHEnabled${keySuffix}`, `AoDEnabled${keySuffix}`, `ItAEnabled${keySuffix}`];
            const result = yield getUserDataFromPlayFab(keys);
            if (result.data.Data === undefined)
                return;
            if (result.data.Data[`TotHEnabled${keySuffix}`] !== undefined)
                enabledExpansions.TotH = result.data.Data[`TotHEnabled${keySuffix}`].Value === '1';
            if (result.data.Data[`AoDEnabled${keySuffix}`] !== undefined)
                enabledExpansions.AoD = result.data.Data[`AoDEnabled${keySuffix}`].Value === '1';
            if (result.data.Data[`ItAEnabled${keySuffix}`] !== undefined)
                enabledExpansions.ItA = result.data.Data[`ItAEnabled${keySuffix}`].Value === '1';
            const tothToggle = document.getElementById('toggle-toth');
            if (tothToggle !== null)
                tothToggle.checked = enabledExpansions.TotH;
            const aodToggle = document.getElementById('toggle-aod');
            if (aodToggle !== null)
                aodToggle.checked = enabledExpansions.AoD;
            const itaToggle = document.getElementById('toggle-ita');
            if (itaToggle !== null)
                itaToggle.checked = enabledExpansions.ItA;
        });
    }
    /** Update playfab save with current local save */
    function updatePlayFabUserData(key, value) {
        return __awaiter(this, void 0, void 0, function*() {
            const requestData = {
                Data: {
                    [key]: value,
                },
            };
            return playfabAPI('UpdateUserData', requestData)
                .then((result) => {
                    if (result.code === 200)
                        console.log('PlayFab user data updated successfully', key, value);
                    return Promise.resolve(result);
                })
                .catch((error) => {
                    log(error);
                    return Promise.reject(error);
                });
        });
    }

    function deleteMelvorCloudAccount(confirmationStep = 0) {
        return __awaiter(this, void 0, void 0, function*() {
            if (confirmationStep === 0) {
                SwalLocale.fire({
                    title: getLangString('DELETE_MELVOR_CLOUD_ACCOUNT_TITLE'),
                    html: `<div class="font-w600 mb-3">${getLangString('DELETE_MELVOR_CLOUD_ACCOUNT_1')}</div><div class="font-w600 text-danger">${getLangString('DELETE_MELVOR_CLOUD_ACCOUNT_3')}</div>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: getLangString('MENU_TEXT_DELETE_CLOUD_ACCOUNT'),
                    cancelButtonText: getLangString('CHARACTER_SELECT_45'),
                }).then((result) => {
                    if (result.value) {
                        deleteMelvorCloudAccount(1);
                    }
                });
            } else if (confirmationStep === 1) {
                SwalLocale.fire({
                    title: `${setLang === 'en' ? 'This is your last warning!' : getLangString('DELETE_MELVOR_CLOUD_ACCOUNT_TITLE')}`,
                    html: `<div class="font-w600 mb-3">${getLangString('DELETE_MELVOR_CLOUD_ACCOUNT_2')}</div><div class="font-w600 text-danger">${getLangString('DELETE_MELVOR_CLOUD_ACCOUNT_3')}</div>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: getLangString('MENU_TEXT_DELETE_CLOUD_ACCOUNT'),
                    cancelButtonText: getLangString('CHARACTER_SELECT_45'),
                }).then((result) => {
                    if (result.value)
                        deleteMelvorCloudAccount(2);
                });
            } else if (confirmationStep === 2) {
                const result = yield processMelvorCloudAccountDeletion();
                if (result) {
                    SwalLocale.fire({
                        icon: 'success',
                        html: `<span class="text-dark">${getLangString('DELETE_MELVOR_CLOUD_ACCOUNT_SUCCESS')}</span>`,
                        showCancelButton: false,
                        showConfirmButton: false,
                        allowEnterKey: false,
                        allowEscapeKey: false,
                        allowOutsideClick: false,
                    });
                    window.setTimeout(function() {
                        location.href = 'index.php';
                    }, 2000);
                } else {
                    SwalLocale.fire({
                        icon: 'error',
                        html: `<span class="text-dark">${getLangString('DELETE_MELVOR_CLOUD_ACCOUNT_ERROR')}</span>`,
                    });
                    window.setTimeout(function() {
                        location.href = 'index.php';
                    }, 5000);
                }
            }
        });
    }

    function processMelvorCloudAccountDeletion() {
        return __awaiter(this, void 0, void 0, function*() {
            showPageLoader();
            setStatus('Deleting Melvor Cloud Account...');
            try {
                let result = yield deleteMelvorCloudAccountViaPOST();
                result = yield deletePlayFabAccount();
                clearStoredCloudCredentials();
                return true;
            } catch (e) {
                console.log(e);
                return false;
            }
        });
    }
    constructor();
    return Object.freeze({
        get isAuthenticated() {
            return isAuthenticated;
        },
        get cloudUsername() {
            return cloudUsername();
        },
        get isTest() {
            return isTest();
        },
        get isBeta() {
            return isBeta();
        },
        checkAuthentication,
        get hasFullVersionEntitlement() {
            return hasFullVersionEntitlement();
        },
        get hasTotHEntitlement() {
            return hasTotHEntitlement();
        },
        get hasAoDEntitlement() {
            return hasAoDEntitlement();
        },
        get hasItAEntitlement() {
            return hasItAEntitlement();
        },
        get hasTotHEntitlementAndIsEnabled() {
            return hasTotHEntitlementAndIsEnabled();
        },
        get hasAoDEntitlementAndIsEnabled() {
            return hasAoDEntitlementAndIsEnabled();
        },
        get hasItAEntitlementAndIsEnabled() {
            return hasItAEntitlementAndIsEnabled();
        },
        get hasExpansionEntitlement() {
            return hasExpansionEntitlement();
        },
        get hasExpansionEntitlementAndIsEnabled() {
            return hasExpansionEntitlementAndIsEnabled();
        },
        hidePageLoader,
        showPageLoader,
        showSignInContainer,
        showRegisterContainer,
        showForgotContainer,
        showLanguageSelection,
        initSilentSignIn,
        initChangePassword,
        performChanceEmail,
        playfabEventAPI,
        checkForPlayFabTokenRefresh,
        checkForPlayFabAutoSave,
        refreshPlayFabSaves,
        get isOnAuthPage() {
            return isOnAuthPage();
        },
        skipCloudAuthentication,
        log,
        setStatus,
        changePasswordToMelvorCloud,
        accessBaseGame,
        accessTestServer,
        connectToPatreon,
        getPlayFabSave,
        deletePlayFabSave,
        get isAllowedToSaveToPlayFab() {
            return isAllowedToSaveToPlayFab();
        },
        forceUpdatePlayFabSave,
        updateLastSaveTimestampText,
        disableForceSyncButton,
        enableForceSyncButton,
        updateUIForPlayFabSignIn,
        updateUIForMelvorCloudSignIn,
        updateUIForEntitlements,
        connectionSuccessMelvorCloud,
        connectionFailedMelvorCloud,
        logout,
        updateUIForAccountSteamLinkStatus,
        displaySteamLinkSwal,
        updateEntitlementsFromReceiptData,
        saveToSteamCloud,
        readFromSteamCloud,
        deleteFromSteamCloud,
        dismissExpansionNotOwned2,
        remindLaterExpansionNotOwned2,
        viewOtherExpansions,
        isBirthdayEvent2023Active,
        toggleDevMode,
        isDevModeEnabled,
        requestAccessTokenFromEOSUsingExchangeTokenLocal,
        checkEpicGamesOwnershipLocal,
        toggleExpansionLoading,
        isAprilFoolsEvent2024Active,
        deleteMelvorCloudAccount,
        dismissExpansionNotOwned3,
        remindLaterExpansionNotOwned3,
        unlinkSteamAccountFromPlayFab,
    });
})();
//# sourceMappingURL=cloudManager.js.map
checkFileVersion('?12097')