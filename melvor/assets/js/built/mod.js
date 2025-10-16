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
var __asyncValues = (this && this.__asyncValues) || function(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator],
        i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);

    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }

    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
};
var __await = (this && this.__await) || function(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}
var __asyncGenerator = (this && this.__asyncGenerator) || function(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []),
        i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i;

    function verb(n) {
        if (g[n]) i[n] = function(v) {
            return new Promise(function(a, b) {
                q.push([n, v, a, b]) > 1 || resume(n, v);
            });
        };
    }

    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }

    function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }

    function fulfill(value) {
        resume("next", value);
    }

    function reject(value) {
        resume("throw", value);
    }

    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
};
/**
 * Melvor Idle mod support module
 * typedefs found in mod.d.ts
 */
const mod = ((vue) => {
    const i18nPage = 'MOD_MANAGER';
    const platform = nativeManager.isSteam || nativeManager.isEpicGames ?
        'Desktop' :
        nativeManager.isIOS ?
        'iOS' :
        nativeManager.isAndroid ?
        'Android' :
        'Browser';
    const creatorToolkitId = 2419237;
    let ModdingStatus;
    (function(ModdingStatus) {
        ModdingStatus["Enabled"] = "Enabled";
        ModdingStatus["Disabled"] = "Disabled";
    })(ModdingStatus || (ModdingStatus = {}));
    let ModdingMode;
    (function(ModdingMode) {
        ModdingMode["Full"] = "Full";
        ModdingMode["Local"] = "Local";
    })(ModdingMode || (ModdingMode = {}));
    let SortOption;
    (function(SortOption) {
        SortOption["Trending"] = "-popular";
        SortOption["MostPopular"] = "downloads";
        SortOption["Rating"] = "rating";
        SortOption["Subscribers"] = "subscribers";
        SortOption["Newest"] = "-date_live";
        SortOption["LastUpdated"] = "-date_updated";
        SortOption["Alphabetical"] = "name";
    })(SortOption || (SortOption = {}));
    // mod.io API wrapper
    const io = (() => {
        const gameId = 2869;
        const baseUrl = `https://g-${gameId}.modapi.io/v1`;
        const gameUrl = `${baseUrl}/games/${gameId}`;
        const gameProfileUrl = 'https://mod.io/g/melvoridle';
        const apiKey = '18d577bc8c3b77469850cf15d56cc97d';
        const reportUrl = (id) => `https://mod.io/report/mods/${id}/widget`;
        const pageSize = 12;
        const events = mitt();
        //#region Authentication
        let accessToken = null;
        /**
         * Restore an OAuth token generated from a previous session
         * @param token A valid OAuth token.
         */
        function setToken(token) {
            accessToken = token;
        }
        /**
         * Tests if a token is still valid (not expired)
         * @param token OAuth token to test. Omit to the current token instead.
         */
        function isTokenValid(token) {
            if (!token)
                token = accessToken;
            if (!token)
                return false;
            return Date.now() / 1000 < token.date_expires;
        }
        /**
         * Throws an error if the user is not authenticated or if their token has expired.
         */
        function ensureUserIsAuthenticated() {
            if (!accessToken)
                throw new Error('You must be logged in to perform this action.');
            if (!isTokenValid()) {
                events.emit('unauthorized');
                throw new Error('Your session has expired. Please log back in and try again.');
            }
        }
        /**
         * Request mod.io to send a security code to the user's email
         * @param email The user's email address which will receive the security code
         */
        function sendSecurityCode(email) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!email)
                    throw new Error(getLangString('MOD_MANAGER_EMAIL_REQUIRED_AUTHENTICATE'));
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                try {
                    const res = yield fetch(`${baseUrl}/oauth/emailrequest`, {
                        method: 'POST',
                        body: new URLSearchParams({
                            api_key: apiKey,
                            email: email || ''
                        }),
                        headers: new Headers({
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }),
                        signal: controller.signal,
                    });
                    clearTimeout(timeout);
                    if (res.ok)
                        return;
                    const data = yield res.json();
                    if (data.error.errors && data.error.errors.email)
                        throw new Error(data.error.errors.email);
                    throw new Error(data.error.message);
                } catch (_a) {
                    // Timeout
                    throw new Error('mod.io failed to respond');
                }
            });
        }
        /**
         * Request an OAuth token from mod.io and stores it for future API calls in this session
         * @param securityCode The security code sent to the user's email address as part of {@link sendSecurityCode}
         * @returns An OAuth token valid for 1 year
         */
        function getOAuthToken(securityCode) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!securityCode || securityCode.length !== 5)
                    throw new Error(getLangString('MOD_MANAGER_VALID_SECURITY_CODE_REQUIRED'));
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000);
                try {
                    const res = yield fetch(`${baseUrl}/oauth/emailexchange`, {
                        method: 'POST',
                        body: new URLSearchParams({
                            api_key: apiKey,
                            security_code: securityCode || '',
                        }),
                        headers: new Headers({
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }),
                        signal: controller.signal,
                    });
                    clearTimeout(timeout);
                    const {
                        access_token,
                        date_expires,
                        error
                    } = yield res.json();
                    if (error) {
                        if (error.errors && error.errors.security_code)
                            throw new Error(error.errors.security_code);
                        throw new Error(error.message);
                    }
                    accessToken = {
                        access_token,
                        date_expires
                    };
                    return accessToken;
                } catch (_a) {
                    // Timeout
                    throw new Error('mod.io failed to respond');
                }
            });
        }
        //#endregion
        /**
         * Private method to wrap all authenticated API calls
         * @param method The HTTP request method to use
         * @param endpoint The API endpoint to call
         * @param data Data to send with the request
         * @returns The API response body
         */
        function authenticatedReq(method, endpoint, data) {
            return __awaiter(this, void 0, void 0, function*() {
                ensureUserIsAuthenticated();
                const controller = new AbortController();
                const headers = new Headers({
                    Authorization: `Bearer ${accessToken.access_token}`
                });
                const reqBaseUrl = endpoint === 'me' || endpoint.startsWith('me/') ? baseUrl : gameUrl;
                const reqUrl = new URL(`${reqBaseUrl}/${endpoint}`);
                const reqInit = {
                    method,
                    headers,
                    signal: controller.signal
                };
                if (method === 'GET') {
                    if (!data)
                        data = {};
                    data.t = Date.now().toString();
                    reqUrl.search = new URLSearchParams(data).toString();
                } else if (data) {
                    headers.append('Content-Type', 'application/x-www-form-urlencoded');
                    reqInit.body = new URLSearchParams(data);
                }
                const timeout = setTimeout(() => controller.abort(), 90000);
                try {
                    const res = yield fetch(reqUrl, reqInit);
                    clearTimeout(timeout);
                    if (res.status === 401) {
                        events.emit('unauthorized');
                    }
                    if (res.status > 299) {
                        let error;
                        try {
                            error = yield res.json();
                        } catch (_a) {
                            throw new Error(getLangString('MOD_MANAGER_MOD_IO_FAILED_TO_RESPOND'));
                        }
                        if (error && error.message)
                            throw new Error(error.message);
                        throw new Error(getLangString('MOD_MANAGER_MOD_IO_FAILED_TO_RESPOND'));
                    }
                    // For whatever reason, only some mod.io endpoints return a content-length header
                    //    (even if they have a JSON response body), so we assume that if .json() fails,
                    //    there is no actual body.
                    try {
                        return yield res.json();
                    } catch (_b) {
                        return;
                    }
                } catch (e) {
                    // Timeout
                    throw new Error('mod.io failed to respond');
                }
            });
        }

        function authenticatedBinaryPost(endpoint, data) {
            return __awaiter(this, void 0, void 0, function*() {
                ensureUserIsAuthenticated();
                const controller = new AbortController();
                const headers = new Headers({
                    Authorization: `Bearer ${accessToken.access_token}`,
                });
                const reqBaseUrl = endpoint === 'me' || endpoint.startsWith('me/') ? baseUrl : gameUrl;
                const reqUrl = new URL(`${reqBaseUrl}/${endpoint}`);
                const formData = new FormData();
                for (const name in data) {
                    formData.append(name, data[name]);
                }
                const reqInit = {
                    method: 'POST',
                    headers,
                    signal: controller.signal,
                    body: formData
                };
                const timeout = setTimeout(() => controller.abort(), 90000);
                try {
                    const res = yield fetch(reqUrl, reqInit);
                    clearTimeout(timeout);
                    if (res.status === 401) {
                        events.emit('unauthorized');
                    }
                    if (res.status > 299) {
                        let error;
                        try {
                            error = yield res.json();
                        } catch (_a) {
                            throw new Error(getLangString('MOD_MANAGER_MOD_IO_FAILED_TO_RESPOND'));
                        }
                        if (error && error.message)
                            throw new Error(error.message);
                        throw new Error(getLangString('MOD_MANAGER_MOD_IO_FAILED_TO_RESPOND'));
                    }
                    // For whatever reason, only some mod.io endpoints return a content-length header
                    //    (even if they have a JSON response body), so we assume that if .json() fails,
                    //    there is no actual body.
                    try {
                        return yield res.json();
                    } catch (_b) {
                        return;
                    }
                } catch (e) {
                    // Timeout
                    throw new Error('mod.io failed to respond');
                }
            });
        }
        //#region Game
        /**
         * Returns Melvor Idle's mod.io data.
         */
        function getGame() {
            return __awaiter(this, void 0, void 0, function*() {
                return (yield authenticatedReq('GET', ''));
            });
        }
        //#endregion
        //#region User
        /**
         * Gets the authenticated user's details.
         */
        function getUser() {
            return __awaiter(this, void 0, void 0, function*() {
                return (yield authenticatedReq('GET', 'me'));
            });
        }
        /**
         * Gets all of the mods the user is a team member of
         */
        function getUserMods() {
            return __awaiter(this, void 0, void 0, function*() {
                const limit = 100;
                let offset = 0;
                const userMods = [];
                while (offset >= 0 && offset <= 1337) {
                    const params = {
                        game_id: gameId.toString(),
                        _limit: limit.toString(),
                        _offset: offset.toString(),
                    };
                    const missingEntitlements = [];
                    if (!cloudManager.hasTotHEntitlementAndIsEnabled) {
                        missingEntitlements.push('Throne of the Herald');
                    }
                    if (!cloudManager.hasAoDEntitlementAndIsEnabled) {
                        missingEntitlements.push('Atlas of Discovery');
                    }
                    if (!cloudManager.hasItAEntitlementAndIsEnabled) {
                        missingEntitlements.push('Into the Abyss');
                    }
                    if (missingEntitlements.length) {
                        params['tags-not-in'] = missingEntitlements.join(',');
                    }
                    const res = (yield authenticatedReq('GET', 'me/mods', params));
                    userMods.push(...res.data);
                    const end = res.result_count !== res.result_limit || res.result_total === res.result_limit + res.result_offset;
                    if (end)
                        offset = -1;
                    else
                        offset += limit;
                }
                return userMods;
            });
        }
        /**
         * Gets the mods the user is a team member of as a paged set
         * @param sort Sorting type to be applied.
         * @param pagination Pagination details to apply.
         * @param search Optional query to be applied against the mods' names.
         * @param tags Optional tags to filter by.
         * @returns
         */
        function getPagedUserMods(sort, pagination, search, tags) {
            return __awaiter(this, void 0, void 0, function*() {
                const params = {
                    game_id: gameId.toString(),
                    _sort: sort,
                    _limit: pagination.pageSize.toString(),
                    _offset: ((pagination.page - 1) * pagination.pageSize).toString(),
                };
                if (tags && tags.length)
                    params.tags = tags.join(',');
                if (search)
                    params['name-lk'] = `*${search}*`;
                return (yield authenticatedReq('GET', 'me/mods', params));
            });
        }
        /**
         * Returns true if the user has a valid (non-expired) session. Alias for {@link isTokenValid}.
         */
        function isLoggedIn() {
            return isTokenValid();
        }
        //#endregion
        //#region Mods
        /**
         * Get all mods that meet the defined filter and pagination settings
         * @param sort Sorting type to be applied.
         * @param pagination Pagination details to apply.
         * @param search Optional query to be applied against the mods' names.
         * @param tags Optional tags to filter by.
         */
        function getAllMods(sort, pagination, search, tags) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!Object.values(SortOption).includes(sort))
                    throw new Error('A valid sort option is required.');
                if (!pagination)
                    throw new Error('Pagination details are required.');
                if (isNaN(pagination.page) || pagination.page < 0)
                    throw new Error('A valid page is required.');
                if (isNaN(pagination.pageSize) || pagination.pageSize <= 0)
                    throw new Error('A valid page size is required.');
                let url = 'mods';
                if (tags === null || tags === void 0 ? void 0 : tags.includes('dev')) {
                    tags = tags.filter((t) => t !== 'dev');
                    url = `me/${url}`;
                }
                const params = {
                    _sort: sort,
                    _limit: pagination.pageSize.toString(),
                    _offset: ((pagination.page - 1) * pagination.pageSize).toString(),
                };
                const missingEntitlements = [];
                if (!cloudManager.hasTotHEntitlementAndIsEnabled) {
                    missingEntitlements.push('Throne of the Herald');
                }
                if (!cloudManager.hasAoDEntitlementAndIsEnabled) {
                    missingEntitlements.push('Atlas of Discovery');
                }
                if (!cloudManager.hasItAEntitlementAndIsEnabled) {
                    missingEntitlements.push('Into the Abyss');
                }
                if (missingEntitlements.length) {
                    params['tags-not-in'] = missingEntitlements.join(',');
                }
                if (tags && tags.length) {
                    params.tags = tags.join(',');
                }
                if (search) {
                    if (search.startsWith('id:')) {
                        const ids = search.slice(3);
                        params['id-in'] = ids;
                    } else {
                        params['name-lk'] = `*${search}*`;
                    }
                }
                return (yield authenticatedReq('GET', url, params));
            });
        }
        /**
         * Get a mod.
         * @param id The mod id of the mod to get the details of.
         */
        function getMod(id) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!id || isNaN(id))
                    throw new Error("A valid mod ID is required to retrieve a mod's details.");
                return (yield authenticatedReq('GET', `mods/${id}`));
            });
        }
        /**
         * Get the latest modfile of a mod (not necessarily the "Live" release).
         * @param id The mod id of the mod to get the latest modfile of.
         */
        function getLatestModfile(id) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!id || isNaN(id))
                    throw new Error("A valid mod ID is required to retrieve a mod's details.");
                return (yield authenticatedReq('GET', `mods/${id}/files`, {
                    _sort: '-id',
                    _limit: '1'
                })).data[0];
            });
        }
        /**
         * Gets all mods the user is subscribed to.
         */
        function getSubscribed() {
            return __awaiter(this, void 0, void 0, function*() {
                const limit = 100;
                let offset = 0;
                const subscribed = [];
                while (offset >= 0 && offset <= 1337) {
                    const params = {
                        game_id: gameId.toString(),
                        _limit: limit.toString(),
                        _offset: offset.toString(),
                    };
                    const missingEntitlements = [];
                    if (!cloudManager.hasTotHEntitlementAndIsEnabled) {
                        missingEntitlements.push('Throne of the Herald');
                    }
                    if (!cloudManager.hasAoDEntitlementAndIsEnabled) {
                        missingEntitlements.push('Atlas of Discovery');
                    }
                    if (!cloudManager.hasItAEntitlementAndIsEnabled) {
                        missingEntitlements.push('Into the Abyss');
                    }
                    if (missingEntitlements.length) {
                        params['tags-not-in'] = missingEntitlements.join(',');
                    }
                    const res = (yield authenticatedReq('GET', 'me/subscribed', params));
                    subscribed.push(...res.data);
                    const end = res.result_count !== res.result_limit || res.result_total === res.result_limit + res.result_offset;
                    if (end)
                        offset = -1;
                    else
                        offset += limit;
                }
                return subscribed;
            });
        }
        /**
         * Get a mod's dependencies.
         * @param id The mod id of the mod to get the dependencies of.
         */
        function getDependencies(id) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!id || isNaN(id))
                    throw new Error("A valid mod ID is required to retrieve a mod's dependencies.");
                // Technically this endpoint returns a limit of 100 so we'd need pagination
                // but we won't support having over 100 dependencies because that's stupid.
                return (yield authenticatedReq('GET', `mods/${id}/dependencies`)).data;
            });
        }
        /**
         * Subscribe to a mod.
         * @param id The mod id to subscribe to.
         */
        function subscribeTo(id) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!id || isNaN(id))
                    throw new Error('A valid mod ID is required to subscribe to a mod.');
                return (yield authenticatedReq('POST', `mods/${id}/subscribe`, {}));
            });
        }
        /**
         * Unsubscribe from a mod.
         * @param id The mod id to unsubscribe from.
         */
        function unsubscribeFrom(id) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!id || isNaN(id))
                    throw new Error('A valid mod ID is required to unsubscribe from a mod.');
                yield authenticatedReq('DELETE', `mods/${id}/subscribe`, {});
            });
        }
        /**
         * Get the stats object for given mod.
         * @param id The mod id to retrieve the stats for.
         */
        function getStats(id) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!id || isNaN(id))
                    throw new Error('A valid mod ID is required to unsubscribe from a mod.');
                return (yield authenticatedReq('GET', `mods/${id}/stats`));
            });
        }
        /**
         * Gets all mods the user has rated.
         */
        function getRatings() {
            return __awaiter(this, void 0, void 0, function*() {
                const limit = 100;
                let offset = 0;
                const ratings = [];
                while (offset >= 0 && offset <= 1337) {
                    const res = (yield authenticatedReq('GET', 'me/ratings', {
                        game_id: gameId.toString(),
                        _limit: limit.toString(),
                        _offset: offset.toString(),
                    }));
                    ratings.push(...res.data);
                    const end = res.result_count !== res.result_limit || res.result_total === res.result_limit + res.result_offset;
                    if (end)
                        offset = -1;
                    else
                        offset += limit;
                }
                return ratings;
            });
        }
        /**
         * Download a mod's zipped contents.
         * @param modfile The modfile to download. Is not the "Live" release if "Latest" is set as preferred.
         * @param onProgress Callback method for receiving current progress of download.
         */
        function download(modfile, onProgress) {
            var e_1, _a;
            return __awaiter(this, void 0, void 0, function*() {
                if (!modfile)
                    throw new Error('A valid modfile object is required.');
                const reqUrl = new URL(modfile.download.binary_url);
                reqUrl.search = new URLSearchParams({
                    t: Date.now().toString()
                }).toString();
                const res = yield fetch(reqUrl);
                if (!res.body)
                    throw new Error('No such download.');
                /** @type {Uint8Array[]} */
                const chunks = [];
                let downloadSize = 0;
                const startTime = performance.now();
                let intervalStart = startTime - 251;
                try {
                    for (var _b = __asyncValues(downloadStreamIterable(res.body)), _c; _c = yield _b.next(), !_c.done;) {
                        const chunk = _c.value;
                        if (onProgress) {
                            const timeNow = performance.now();
                            const elapsedTime = timeNow - startTime + 1; // Avoid infinity
                            const intervalTime = timeNow - intervalStart;
                            downloadSize += chunk.length;
                            // Only send updates every 250ms
                            if (intervalTime > 250) {
                                intervalStart = timeNow;
                                onProgress(downloadSize, modfile.filesize, (downloadSize / elapsedTime) * 1000);
                            }
                        }
                        chunks.push(chunk);
                    }
                } catch (e_1_1) {
                    e_1 = {
                        error: e_1_1
                    };
                } finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    } finally {
                        if (e_1) throw e_1.error;
                    }
                }
                const blob = new Blob(chunks);
                if (blob.size !== modfile.filesize)
                    throw new Error('An error occurred when downloading the mod. Please try again.');
                return blob;
            });
        }
        /**
         * Streams a download. Example taken from{@link : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of}
         * @param downloadStream
         * @yields A chunk of data
         */
        function downloadStreamIterable(downloadStream) {
            return __asyncGenerator(this, arguments, function* downloadStreamIterable_1() {
                const reader = downloadStream.getReader();
                try {
                    while (true) {
                        const {
                            done,
                            value
                        } = yield __await(reader.read());
                        if (done)
                            return yield __await(void 0);
                        yield yield __await(value);
                    }
                } finally {
                    reader.releaseLock();
                }
            });
        }
        /**
         * Private method used for rating.
         * @param id The mod id to rate.
         * @param rating The rating to give the mod (-1 = Thumbs down, 0 = Remove rating, 1 = Thumbs up)
         */
        function rate(id, rating) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!id || isNaN(id))
                    throw new Error('A valid mod ID is required to rate a mod.');
                if (rating < -1 || rating > 1)
                    throw new Error('Invalid rating value.');
                yield authenticatedReq('POST', `mods/${id}/ratings`, {
                    rating: rating.toString()
                });
            });
        }
        /**
         * Rate a mod positively (thumbs up).
         * @param id The mod id to rate positively.
         */
        function ratePositive(id) {
            return __awaiter(this, void 0, void 0, function*() {
                yield rate(id, 1);
            });
        }
        /**
         * Rate a mod negatively (thumbs down).
         * @param id The mod id to rate negatively.
         */
        function rateNegative(id) {
            return __awaiter(this, void 0, void 0, function*() {
                yield rate(id, -1);
            });
        }
        /**
         * Remove the user's rating from the mod.
         * @param id The mod id to remove the rating from.
         */
        function removeRating(id) {
            return __awaiter(this, void 0, void 0, function*() {
                yield rate(id, 0);
            });
        }
        //#endregion
        return {
            auth: {
                accessToken,
                setToken,
                isTokenValid,
                ensureUserIsAuthenticated,
                sendSecurityCode,
                getOAuthToken,
                authenticatedReq,
                authenticatedBinaryPost,
            },
            game: {
                profileUrl: gameProfileUrl,
                get: getGame,
            },
            user: {
                get: getUser,
                mods: getUserMods,
                pagedMods: getPagedUserMods,
                isLoggedIn,
            },
            mods: {
                pageSize,
                getAll: getAllMods,
                get: getMod,
                getLatestModfile: getLatestModfile,
                getSubscribed,
                getDependencies,
                subscribeTo,
                unsubscribeFrom,
                getStats,
                getRatings,
                download,
                ratePositive,
                rateNegative,
                removeRating,
                reportUrl: reportUrl,
            },
            on: events.on,
            off: events.off,
        };
    })();
    // Modfile parser
    const parser = (() => {
        //#region Tag parsing
        const tagOptions = new Map();
        /**
         * Set up the tag map for categorizing mod tags.
         * @param gameData The mod.io game data for Melvor Idle.
         */
        function setupTagMap(gameData) {
            tagOptions.clear();
            for (const tagSets of gameData.tag_options) {
                const tags = new Set(tagSets.tags);
                tagOptions.set(tagSets.name, tags);
            }
        }
        /**
         * Parse tags and categorize them.
         * @param unformattedTags mod.io tags to parse (categorize).
         */
        function parseTags(unformattedTags) {
            if (!tagOptions.size)
                throw new Error('Parse has not been setup yet!');
            const tags = {
                platforms: [],
                supportedGameVersion: '',
                types: [],
            };
            for (const tag of unformattedTags) {
                if (tagOptions.get('Platform').has(tag.name)) {
                    tags.platforms.push(tag.name);
                    continue;
                }
                if (tagOptions.get('Supported Game Version').has(tag.name)) {
                    tags.supportedGameVersion = tag.name;
                    continue;
                }
                if (tagOptions.get('Type').has(tag.name)) {
                    tags.types.push(tag.name);
                    continue;
                }
            }
            return tags;
        }
        /**
         * Idk where else to put this lol
         */
        function isAvailableOnThisPlatform(tags) {
            // Legacy Steam tag check
            if (platform === 'Desktop' && tags.platforms.includes('Steam'))
                return true;
            if (tags.platforms.length > 0) {
                return tags.platforms.includes(platform);
            }
            return true;
        }
        //#endregion
        //#region File parsing
        /**
         * Parse mods downloaded from mod.io.
         * @param modIoData The mod.io mod object.
         * @param file The binary downloaded.
         */
        function parse(modIoData, modfile, file) {
            return __awaiter(this, void 0, void 0, function*() {
                let unpacked = yield unpack(file);
                // Squash mod paths if all contained within subdirectory
                const paths = Object.keys(unpacked);
                const baseDir = paths[0];
                if (paths.every((p) => p.startsWith(baseDir))) {
                    paths.splice(0, 1);
                    unpacked = Object.assign({}, ...paths.map((key) => ({
                        [removeBaseDir(key, baseDir)]: unpacked[key]
                    })));
                }
                if (!unpacked['manifest.json'])
                    throw new Error(`[${modIoData.name}] No manifest file was found. Expected a "manifest.json" to be at the root.`);
                let manifest;
                try {
                    manifest = JSON.parse(fflate.strFromU8(unpacked['manifest.json']));
                } catch (_a) {
                    throw new Error(`[${modIoData.name}] The manifest is invalid and was not able to be parsed.`);
                }
                if (!manifest.namespace)
                    console.warn(`[${modIoData.name}] No namespace is defined. The mod will have limited access to game APIs.`);
                else if (!NamespaceMap.isValidModdedName(manifest.namespace))
                    throw new Error(`[${modIoData.name}] Namespace is invalid. Namespaces must only contain alphanumeric characters and underscores and cannot start with the word "melvor".`);
                else if (manifest.namespace === 'dev')
                    throw new Error(`[${modIoData.name}] Namespace is invalid. The namespace "dev" is reserved.`);
                if (!manifest.setup && !manifest.load)
                    throw new Error(`[${modIoData.name}] Either a setup or load resource must be defined.`);
                if (manifest.setup && !isValidSetup(manifest.setup))
                    throw new Error(`[${modIoData.name}] Setup resource is not valid.`);
                if (manifest.load && !isValidLoad(manifest.load))
                    throw new Error(`[${modIoData.name}] One or more invalid resources are contained in the load list.`);
                if (manifest.icon && !isValidIcon(manifest.icon))
                    throw new Error(`[${modIoData.name}] Icon resource is not valid.`);
                const tags = parseTags(modIoData.tags);
                if (!tags.supportedGameVersion)
                    throw new Error(`[${modIoData.name}] Invalid supported game version.`);
                let dependencies = [];
                try {
                    dependencies = yield io.mods.getDependencies(modIoData.id);
                } catch (e) {
                    console.error(e);
                    throw new Error(`[${modIoData.name}] Failed to get mod dependencies from mod.io.`);
                }
                const resources = {};
                for (const file in unpacked) {
                    if (!unpacked[file].length)
                        continue;
                    let type = '';
                    if (file.endsWith('.js') || file.endsWith('.mjs'))
                        type = 'text/javascript';
                    else if (file.endsWith('.html'))
                        type = 'text/html';
                    else if (file.endsWith('.svg'))
                        type = 'image/svg+xml';
                    resources[file] = new Blob([unpacked[file]], {
                        type
                    });
                }
                return {
                    id: modIoData.id,
                    name: modIoData.name,
                    namespace: manifest.namespace,
                    version: modfile.version,
                    tags,
                    author: modIoData.submitted_by.username,
                    description: modIoData.summary,
                    icon: manifest.icon,
                    setup: manifest.setup,
                    load: manifest.load,
                    resources,
                    modioUrl: modIoData.profile_url,
                    homepageUrl: modIoData.homepage_url,
                    dependencies,
                    installed: Math.floor(Date.now() / 1000),
                    updated: modfile.date_added,
                    changelog: modfile.changelog,
                };
            });
        }

        function parseLocal(name, file) {
            return __awaiter(this, void 0, void 0, function*() {
                let unpacked = yield unpack(file);
                // Squash mod paths if all contained within subdirectory
                const paths = Object.keys(unpacked);
                const baseDir = paths[0];
                if (paths.every((p) => p.startsWith(baseDir))) {
                    paths.splice(0, 1);
                    unpacked = Object.assign({}, ...paths.map((key) => ({
                        [removeBaseDir(key, baseDir)]: unpacked[key]
                    })));
                }
                if (!unpacked['manifest.json'])
                    throw new Error(`No manifest file was found. Expected a "manifest.json" to be at the root.`);
                let manifest;
                try {
                    manifest = JSON.parse(fflate.strFromU8(unpacked['manifest.json']));
                } catch (_a) {
                    throw new Error(`The manifest is invalid and was not able to be parsed.`);
                }
                if (!manifest.namespace)
                    console.warn(`No namespace is defined. The mod will have limited access to game APIs.`);
                else if (!NamespaceMap.isValidModdedName(manifest.namespace))
                    throw new Error(`Namespace is invalid. Namespaces must only contain alphanumeric characters and underscores and cannot start with the word "melvor".`);
                else if (manifest.namespace === 'dev')
                    throw new Error(`Namespace is invalid. The namespace "dev" is reserved.`);
                if (!manifest.setup && !manifest.load)
                    throw new Error(`Either a setup or load resource must be defined.`);
                if (manifest.setup && !isValidSetup(manifest.setup))
                    throw new Error(`Setup resource is not valid.`);
                if (manifest.load && !isValidLoad(manifest.load))
                    throw new Error(`One or more invalid resources are contained in the load list.`);
                if (manifest.icon && !isValidIcon(manifest.icon))
                    throw new Error(`Icon resource is not valid.`);
                const resources = {};
                for (const file in unpacked) {
                    if (!unpacked[file].length)
                        continue;
                    let type = '';
                    if (file.endsWith('.js') || file.endsWith('.mjs'))
                        type = 'text/javascript';
                    else if (file.endsWith('.html'))
                        type = 'text/html';
                    else if (file.endsWith('.svg'))
                        type = 'image/svg+xml';
                    resources[file] = new Blob([unpacked[file]], {
                        type
                    });
                }
                return {
                    id: -1,
                    name,
                    namespace: manifest.namespace,
                    version: '',
                    tags: {
                        supportedGameVersion: gameVersion.substring(1),
                        platforms: [],
                        types: [],
                    },
                    author: '',
                    description: '',
                    icon: manifest.icon,
                    setup: manifest.setup,
                    load: manifest.load,
                    resources,
                    modioUrl: '',
                    homepageUrl: '',
                    dependencies: [],
                    installed: Math.floor(Date.now() / 1000),
                    updated: 0,
                    changelog: '',
                };
            });
        }
        /**
         * Unzip a mod file and return the contents.
         * @param zip Zip file to unzip.
         */
        function unpack(zip) {
            return __awaiter(this, void 0, void 0, function*() {
                const u8arr = new Uint8Array(yield readAsArrayBuffer(zip));
                return new Promise((resolve, reject) => {
                    fflate.unzip(u8arr, (err, unzipped) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(unzipped);
                    });
                });
            });
        }
        /**
         * Polyfill for Blob.arrayBuffer
         * @param blob Blob to be read as an array buffer
         */
        function readAsArrayBuffer(blob) {
            return __awaiter(this, void 0, void 0, function*() {
                if (blob.arrayBuffer !== undefined)
                    return yield blob.arrayBuffer();
                return new Promise((resolve, reject) => {
                    const fileReader = new FileReader();
                    fileReader.addEventListener('error', () => {
                        reject('Error while converting Blob to array buffer.');
                    });
                    fileReader.addEventListener('load', () => {
                        resolve(fileReader.result);
                    });
                    fileReader.readAsArrayBuffer(blob);
                });
            });
        }
        /**
         * Removes a base directory from a path. Used for shortening a mod's resource path if the manifest is found up a level from the root.
         * @param path Path to strip the baseDir from.
         * @param baseDir The baseDir to strip.
         */
        function removeBaseDir(path, baseDir) {
            return path.replace(baseDir, '');
        }
        /**
         * Validates a resource as being valid for a mod's "setup".
         * @param setup Resource path to test.
         */
        function isValidSetup(setup) {
            return isScriptFile(setup) || isModuleFile(setup);
        }
        /**
         * Tests if a mod's `load` parameter is valid.
         * @param load The mod's resource(s) to load.
         */
        function isValidLoad(load) {
            if (typeof load === 'string')
                return isValidLoadResource(load);
            if (!Array.isArray(load))
                return false;
            return load.every((r) => isValidLoadResource(r));
        }
        /**
         * Tests if a load resource is valid.
         * @param resource Resource path to test.
         */
        function isValidLoadResource(resource) {
            return (isScriptFile(resource) ||
                isModuleFile(resource) ||
                isStylesheetFile(resource) ||
                isJsonFile(resource) ||
                isHTMLFile(resource));
        }
        /**
         * Tests if a resource is a JavaScript (.js) file.
         * @param resource Resource path to test.
         */
        function isScriptFile(resource) {
            return typeof resource === 'string' && resource.endsWith('.js');
        }
        /**
         * Tests if a resource is a JavaScript module (.mjs) file.
         * @param resource Resource path to test.
         */
        function isModuleFile(resource) {
            return typeof resource === 'string' && (resource.endsWith('.js') || resource.endsWith('.mjs'));
        }
        /**
         * Tests if a resource is a stylesheet (.css).
         * @param resource Resource path to test.
         */
        function isStylesheetFile(resource) {
            return typeof resource === 'string' && resource.endsWith('.css');
        }
        /**
         * Tests if a resource is an HTML document (.html).
         * @param resource Resource path to test.
         */
        function isHTMLFile(resource) {
            return typeof resource === 'string' && resource.endsWith('.html');
        }
        /**
         * Tests if a resource is a JSON file (.json).
         * @param resource Resource path to test.
         */
        function isJsonFile(resource) {
            return typeof resource === 'string' && resource.endsWith('.json');
        }
        /**
         * Tests if an icon resource is valid.
         * @param icon Resource path to test.
         */
        function isValidIcon(icon) {
            return typeof icon === 'string' && (icon.endsWith('.png') || icon.endsWith('.svg'));
        }
        //#endregion
        /**
         * Setup parser with necessary tag data.
         * @param gameData The mod.io game data for Melvor Idle.
         */
        function setup(gameData) {
            setupTagMap(gameData);
        }
        return {
            parse,
            parseLocal,
            parseTags,
            isAvailableOnThisPlatform,
            setup,
            isScriptFile,
            isModuleFile,
            isStylesheetFile,
            isHTMLFile,
            isJsonFile,
        };
    })();
    const packager = (() => {
        let fs = null;
        let path = null;

        function zip(name, dir) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!nativeManager.isSteam)
                    throw new Error('Cannot create a zip. This functionality is only available in the Steam client.');
                if (!fs)
                    fs = require('fs/promises');
                if (!path)
                    path = require('path');
                if (!(yield ensureDirExists(dir)))
                    throw new Error(`No such directory exists: "${dir}"`);
                const pkg = yield createPackage(name, yield collectFiles(dir, '', {}, yield getIgnoreSet(dir)));
                return pkg;
            });
        }
        const ALREADY_COMPRESSED = [
            'zip',
            'gz',
            'png',
            'jpg',
            'jpeg',
            'pdf',
            'doc',
            'docx',
            'ppt',
            'pptx',
            'xls',
            'xlsx',
            'heic',
            'heif',
            '7z',
            'bz2',
            'rar',
            'gif',
            'webp',
            'webm',
            'mp4',
            'mov',
            'mp3',
            'aifc',
        ];

        function ensureDirExists(dir) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    return (yield fs.stat(dir)).isDirectory();
                } catch (e) {
                    if ('code' in e && e.code === 'ENOENT')
                        return false;
                    throw e;
                }
            });
        }

        function getIgnoreSet(root) {
            return __awaiter(this, void 0, void 0, function*() {
                const rootDir = (yield fs.readdir(root));
                if (!rootDir.includes('.modignore'))
                    return [];
                const ignoreFile = (yield fs.readFile(path.join(root, '.modignore'), 'UTF-8'));
                return ignoreFile
                    .split(/\r?\n/)
                    .map((i) => new RegExp(`^${i.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`));
            });
        }

        function collectFiles(root, dirPath = '', fileMap = {}, ignoreSet = []) {
            return __awaiter(this, void 0, void 0, function*() {
                const dir = yield fs.readdir(path.join(root, dirPath), {
                    withFileTypes: true
                });
                for (const dirent of dir) {
                    if (dirent.name === '.modignore')
                        continue;
                    let ignored = false;
                    for (const ignore of ignoreSet) {
                        if (ignore.test(dirent.name)) {
                            ignored = true;
                            break;
                        }
                    }
                    if (ignored)
                        continue;
                    if (dirent.isDirectory()) {
                        yield collectFiles(root, path.join(dirPath, dirent.name), fileMap, ignoreSet);
                        continue;
                    }
                    const fileBuffer = yield fs.readFile(path.join(root, dirPath, dirent.name));
                    const ext = dirent.name.slice(dirent.name.lastIndexOf('.') + 1).toLowerCase();
                    fileMap[path.join(dirPath, dirent.name)] = [
                        new Uint8Array(fileBuffer.buffer),
                        {
                            level: ALREADY_COMPRESSED.indexOf(ext) === -1 ? 6 : 0
                        },
                    ];
                }
                return fileMap;
            });
        }

        function createPackage(name, files) {
            return __awaiter(this, void 0, void 0, function*() {
                return new Promise((res, rej) => {
                    fflate.zip(files, (err, out) => {
                        if (err)
                            rej(err);
                        res(new File([out], `${name.toLowerCase().replace(/ /g, '_').replace(/[^\w]/g, '')}.zip`, {
                            type: 'application/zip',
                        }));
                    });
                });
            });
        }
        return {
            zip,
        };
    })();
    // IndexedDb storage API for mods
    const db = (() => {
        const db = new MelvorDatabase();
        //#region mod.io mods
        /**
         * Returns the number of installed mods.
         */
        function countMods() {
            return __awaiter(this, void 0, void 0, function*() {
                return yield db.mods.count();
            });
        }
        /**
         * Gets all locally stored mods.
         */
        function getAllMods() {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    return yield db.mods.toArray();
                } catch (_a) {
                    throw new Error('There was an issue with retrieving locally-stored mods. Please reload the game and try again.');
                }
            });
        }
        /**
         * Get a locally stored mod by mod.io id.
         * @param id mod.io id of the mod to retrieve.
         */
        function getMod(id) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    return yield db.mods.get(id);
                } catch (_a) {
                    throw new Error('There was an issue with retrieving locally-stored mods. Please reload the game and try again.');
                }
            });
        }
        /**
         * Upsert a stored mod (update if already existing, insert otherwise).
         * @param mod The new version of the mod to replace the currently stored version with.
         */
        function putMod(mod) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield db.mods.put(mod);
                } catch (_a) {
                    throw new Error('There was an issue with storing mods locally. Please reload the game and try again.');
                }
            });
        }
        /**
         * Delete a stored mod.
         * @param id mod.io id of the mod to delete.
         */
        function deleteMod(id) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield db.mods.delete(id);
                } catch (_a) {
                    throw new Error('There was an issue with deleting locally-stored mods. Please reload the game and try again.');
                }
            });
        }

        function deleteAllMods() {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield db.mods.clear();
                } catch (_a) {
                    throw new Error('There was an issue with deleting locally-stored mods. Please reload the game and try again.');
                }
            });
        }
        /**
         * Delete all mods from storage that are no longer subscribed to.
         * @param subscribedIds Array of mod.io ids of all currently subscribed mods.
         */
        function deleteUnsubscribedMods(subscribedIds) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield db.mods.where('id').noneOf(subscribedIds).delete();
                } catch (_a) {
                    throw new Error('There was an issue with deleting locally-stored mods. Please reload the game and try again.');
                }
            });
        }
        //#endregion
        //#region Local mods
        /**
         * Returns the number of installed mods.
         */
        function countLocalMods() {
            return __awaiter(this, void 0, void 0, function*() {
                return yield db.localMods.count();
            });
        }
        /**
         * Gets all locally stored mods.
         */
        function getAllLocalMods() {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    return yield db.localMods.toCollection().sortBy('loadPriority');
                } catch (_a) {
                    throw new Error('There was an issue with retrieving locally-stored mods. Please reload the game and try again.');
                }
            });
        }
        /**
         * Get a locally stored mod by mod.io id.
         * @param id mod.io id of the mod to retrieve.
         */
        function getLocalMod(id) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    return yield db.localMods.get(id);
                } catch (_a) {
                    throw new Error('There was an issue with retrieving locally-stored mods. Please reload the game and try again.');
                }
            });
        }
        /**
         * Upsert a stored mod (update if already existing, insert otherwise).
         * @param mod The new version of the mod to replace the currently stored version with.
         */
        function putLocalMod(mod) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield db.localMods.put(mod);
                } catch (_a) {
                    throw new Error('There was an issue with storing mods locally. Please reload the game and try again.');
                }
            });
        }
        /**
         * Delete a stored mod.
         * @param id mod.io id of the mod to delete.
         */
        function deleteLocalMod(id) {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield db.localMods.delete(id);
                } catch (_a) {
                    throw new Error('There was an issue with deleting locally-stored mods. Please reload the game and try again.');
                }
            });
        }

        function deleteAllLocalMods() {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield db.localMods.clear();
                } catch (_a) {
                    throw new Error('There was an issue with deleting locally-stored mods. Please reload the game and try again.');
                }
            });
        }
        //#endregion
        return {
            mods: {
                count: countMods,
                getAll: getAllMods,
                get: getMod,
                put: putMod,
                delete: deleteMod,
                deleteAll: deleteAllMods,
                deleteUnsubscribed: deleteUnsubscribedMods,
            },
            localMods: {
                count: countLocalMods,
                getAll: getAllLocalMods,
                get: getLocalMod,
                put: putLocalMod,
                delete: deleteLocalMod,
                deleteAll: deleteAllLocalMods,
            },
        };
    })();
    // Mod loader for injecting scripts and stylesheets
    const loader = (() => {
        // Map used to keep track of generated resource URLs
        const resourceUrls = new Map();
        /**
         * Retrieves which mod loaded a resource with the given URL.
         * @param url Resource URL to check.
         */
        function getModFromResourceUrl(url) {
            if (!url)
                return;
            for (const [mod, resources] of resourceUrls) {
                for (const [resource, resourceUrl] of resources) {
                    if (resourceUrl === url)
                        return mod;
                }
            }
            return;
        }
        /**
         * Retrieves the original mod url and mod for the loaded resource with the given URL
         * @param url Resource URL to check
         */
        function getModUrlFromResourceUrl(url) {
            if (!url)
                return;
            for (const [mod, resources] of resourceUrls) {
                for (const [resource, resourceUrl] of resources) {
                    if (resourceUrl === url) {
                        return {
                            mod,
                            resource
                        };
                    }
                }
            }
            return;
        }
        /**
         * Load one or many mods.
         * @param mods Mod(s) to load
         */
        function load(mods) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!Array.isArray(mods)) {
                    yield loadMod(mods);
                    return;
                }
                for (const mod of mods) {
                    try {
                        yield loadMod(mod);
                    } catch (e) {
                        console.error(`[${mod.name}]`, e);
                    }
                }
            });
        }
        /**
         * Load a mod.
         * @param mod The mod to be loaded.
         */
        function loadMod(mod) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!mod)
                    throw new Error('Argument "mod" cannot be null or undefined.');
                if (mod.id === creatorToolkitId) {
                    // Do something special
                }
                // Run setup if available
                if (typeof mod.setup === 'string')
                    yield loadSetup(mod, mod.setup);
                // Load any additional resources
                if (typeof mod.load === 'string')
                    yield loadResource(mod, mod.load);
                else if (Array.isArray(mod.load)) {
                    for (const resource of mod.load) {
                        if (typeof resource === 'string')
                            yield loadResource(mod, resource);
                    }
                }
            });
        }
        /**
         * Runs a mod's setup resource.
         * @param mod The mod being setup.
         * @param resource Resource path.
         */
        function loadSetup(mod, resource) {
            return __awaiter(this, void 0, void 0, function*() {
                const module = yield loadModule(mod, resource);
                if (typeof module.setup !== 'function')
                    throw new Error(`[${mod.name}] Setup resource "${resource}" does not export a valid named function "setup".`);
                yield contextApi.runSetup(mod, module.setup);
            });
        }
        /**
         * Loads a mod resource.
         * @param mod The mod being loaded.
         * @param resource Resource path.
         */
        function loadResource(mod, resource) {
            return __awaiter(this, void 0, void 0, function*() {
                if (parser.isScriptFile(resource))
                    return yield loadScript(mod, resource);
                else if (parser.isModuleFile(resource))
                    return yield loadModule(mod, resource);
                else if (parser.isStylesheetFile(resource))
                    return loadStylesheet(mod, resource);
                else if (parser.isHTMLFile(resource))
                    return yield loadTemplates(mod, resource);
                else if (parser.isJsonFile(resource))
                    return yield loadGameData(mod, resource);
                throw new Error(`Mod "${mod.name}" resource "${resource}" is invalid and cannot be loaded.`);
            });
        }
        /**
         * Loads a mod script resource.
         * @param mod The mod being loaded.
         * @param resource Resource path.
         */
        function loadScript(mod, resource) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!parser.isScriptFile(resource))
                    throw new Error(`[${mod.name}] Cannot load resource "${resource}" as a script. Expected file type ".js".`);
                return new Promise((res, rej) => {
                    const scriptEl = document.createElement('script');
                    scriptEl.type = 'text/javascript';
                    scriptEl.src = getResourceUrl(mod, resource);
                    scriptEl.onload = () => res();
                    scriptEl.onerror = () => rej(`[${mod.name}] Error loading resource "${resource}".`);
                    document.body.appendChild(scriptEl);
                });
            });
        }
        /**
         * Loads a JavaScript module resource.
         * @param mod The mod being loaded.
         * @param resource Resource path.
         */
        function loadModule(mod, resource) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!parser.isModuleFile(resource))
                    throw new Error(`[${mod.name}] Cannot load resource "${resource}" as a module. Expected file type ".mjs" or ".js".`);
                return yield
                import (getResourceUrl(mod, resource));
            });
        }
        /**
         * Loads a mod stylesheet resource.
         * @param mod The mod being loaded.
         * @param resource Resource path.
         */
        function loadStylesheet(mod, resource) {
            if (!parser.isStylesheetFile(resource))
                throw new Error(`[${mod.name}] Cannot load resource "${resource}" as a stylesheet. Expected file type ".css".`);
            const styleEl = document.createElement('link');
            styleEl.href = getResourceUrl(mod, resource);
            styleEl.rel = 'stylesheet';
            document.head.appendChild(styleEl);
        }
        /**
         * Loads a mod stylesheet resource.
         * @param mod The mod being loaded.
         * @param resource Resource path.
         */
        function loadTemplates(mod, resource) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!parser.isHTMLFile(resource))
                    throw new Error(`[${mod.name}] Cannot load resource "${resource}" as a template file. Expected file type ".html".`);
                const url = getResourceUrl(mod, resource);
                return new Promise((res, rej) => {
                    const req = new XMLHttpRequest();
                    req.open('GET', url, true);
                    req.responseType = 'document';
                    req.onload = () => {
                        req.response.querySelectorAll('template').forEach((el) => {
                            document.body.append(el.cloneNode(true));
                        });
                        res();
                    };
                    req.onerror = () => {
                        rej(`[${mod.name}] Templates failed to load.`);
                    };
                    req.send();
                });
            });
        }
        /**
         * Loads the data from a JSON resource.
         * @param mod The mod being loaded.
         * @param resource Resource path.
         */
        function loadJson(mod, resource) {
            return __awaiter(this, void 0, void 0, function*() {
                // We need to use this check as well here because we aren't getting the data via `getResourceUrl`
                resource = ensureResourceExists(mod, resource);
                if (!parser.isJsonFile(resource))
                    throw new Error(`[${mod.name}] Cannot load resource "${resource}" as JSON data. Expected file type ".json".`);
                return JSON.parse(yield mod.resources[resource].text());
            });
        }
        /**
         * Loads a game data package from a JSON resource.
         * @param mod The mod being loaded.
         * @param resource Resource path.
         */
        function loadGameData(mod, resource) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!mod.namespace)
                    throw new Error(`[${mod.name}] Cannot load game data "${resource}". No namespace was defined in the mod's manifest.json.`);
                const data = (yield loadJson(mod, resource));
                const ctx = contextApi.getContext(mod.namespace);
                if (ctx.namespaceData)
                    data.namespace = ctx.namespaceData.name;
                try {
                    game.registerDataPackage(data);
                } catch (e) {
                    throw new Error(`[${mod.name}] ${e instanceof Error ? e.message : e}`);
                }
            });
        }
        /**
         * Throws an error if the mod does not contain the given resource.
         * @param mod The mod to check.
         * @param resource Resource path.
         */
        function ensureResourceExists(mod, resource) {
            if (mod.resources[resource])
                return resource;
            const backslashResource = resource.replace(/\//g, '\\');
            if (mod.resources[backslashResource])
                return backslashResource;
            const forwardslashResource = resource.replace(/\\/g, '/');
            if (mod.resources[forwardslashResource])
                return forwardslashResource;
            throw new Error(`[${mod.name}] Could not find resource "${resource}".`);
        }
        /**
         * Gets the Blob of a mod's specified resource
         * @param mod Mod containing the resource to retrieve
         * @param resource Path to the resource
         */
        function getResourceBlob(mod, resource) {
            if (resource.startsWith('melvor:') || resource.startsWith('http:') || resource.startsWith('https:'))
                throw new Error('Cannot get base game or external resource as blob');
            if (resource.includes(':')) {
                const namespace = resource.split(':')[0];
                if (game.registeredNamespaces.hasNamespace(namespace)) {
                    const asset = resource.substring(resource.indexOf(':') + 1);
                    if (mod.namespace === namespace)
                        return getResourceBlob(mod, asset);
                    if (!assetSharingContextApi.isShared(namespace, asset))
                        throw new Error(`[${mod.name}] The asset "${resource}" has not been shared.`);
                    const sharingMod = modStore.loadedModByNamespace(namespace);
                    if (sharingMod)
                        return getResourceBlob(sharingMod, asset);
                }
            }
            resource = ensureResourceExists(mod, resource);
            return mod.resources[resource];
        }
        /**
         * Gets (or generates) the URL to a mod's specified resource.
         * @param mod Mod containing the resource to retrieve.
         * @param resource Path the the resource.
         */
        function getResourceUrl(mod, resource) {
            if (resource.startsWith('melvor:')) {
                return assets.getURI(resource.substring(7));
            } else if (resource.startsWith('http:') || resource.startsWith('https:')) {
                return resource;
            } else if (resource.includes(':')) {
                const namespace = resource.split(':')[0];
                if (game.registeredNamespaces.hasNamespace(namespace)) {
                    const asset = resource.substring(resource.indexOf(':') + 1);
                    if (mod.namespace === namespace)
                        return getResourceUrl(mod, asset);
                    if (!assetSharingContextApi.isShared(namespace, asset))
                        throw new Error(`[${mod.name}] The asset "${resource}" has not been shared.`);
                    const sharingMod = modStore.loadedModByNamespace(namespace);
                    if (sharingMod)
                        return getResourceUrl(sharingMod, asset);
                }
            }
            resource = ensureResourceExists(mod, resource);
            if (!resourceUrls.has(mod))
                resourceUrls.set(mod, new Map());
            const urls = resourceUrls.get(mod);
            if (!urls.has(resource)) {
                const url = URL.createObjectURL(mod.resources[resource]);
                urls.set(resource, url);
            }
            return urls.get(resource);
        }
        return {
            load,
            loadScript,
            loadModule,
            loadStylesheet,
            loadTemplates,
            loadJson,
            getModFromResourceUrl,
            getModUrlFromResourceUrl,
            getResourceBlob,
            getResourceUrl,
        };
    })();
    /** Store for mod.io login process */
    const loginStore = (() => {
        const events = mitt();
        const state = {
            email: '',
            sessionRestored: false,
        };
        const getters = {
            /**
             * Checks if the user is logged into mod.io.
             */
            isLoggedIn() {
                return io.auth.isTokenValid();
            },
        };
        const actions = {
            /**
             * Restores the mod.io client session.
             */
            restoreSession(email, token) {
                if (email) {
                    state.email = email;
                }
                if (token) {
                    state.sessionRestored = true;
                    const parsedToken = JSON.parse(token);
                    actions.login(parsedToken, true);
                }
            },
            /**
             * Sends a security code for mod.io login to the user's email.
             * @param email The user's email to log in with.
             */
            sendSecurityCode(email) {
                return __awaiter(this, void 0, void 0, function*() {
                    state.email = email;
                    yield io.auth.sendSecurityCode(email);
                    playFabManager.queueUpdate('modioEmail', email);
                });
            },
            /**
             * Exchanges a security code for an OAuth token from mod.io.
             * @param code The security code retireved from the user's email.
             */
            loginUsingSecurityCode(code) {
                return __awaiter(this, void 0, void 0, function*() {
                    const token = yield io.auth.getOAuthToken(code);
                    actions.login(token);
                });
            },
            /**
             * Sets the current session's auth token and saves it to the user's cloud storage.
             * @param token Access token to be set.
             */
            login(token, sessionRestore) {
                if (!io.auth.isTokenValid(token))
                    return;
                io.auth.setToken(token);
                if (!sessionRestore) {
                    const serializedToken = JSON.stringify(token);
                    playFabManager.queueUpdate('modioToken', serializedToken);
                }
                events.emit('login');
            },
            /**
             * Clears the mod.io auth token and removes it from storage.
             */
            logout() {
                io.auth.setToken(null);
                playFabManager.queueUpdate('modioToken', null);
                events.emit('logout');
            },
        };
        return {
            state,
            getters,
            actions,
            on: events.on,
            off: events.off,
        };
    })();
    const store = vue.createStore({
        mode: ModdingMode.Full,
        status: ModdingStatus.Disabled,
        didFullModeSetup: false,
        didLocalModeSetup: false,
        autoDownload: !localStorage.getItem('mm__stop-auto-download'),
        creatorToolkitLoaded: false,
        dependencyPromptOpen: false,
        dependencyPrompts: [],
        get gameVersion() {
            return gameVersion.substring(1);
        },
        get isLocalMode() {
            return this.mode === ModdingMode.Local;
        },
        unsetup() {
            document.querySelectorAll('.btn-mod-manager').forEach((e) => e.classList.add('d-none'));
            sidebar.category('Modding').removeItem('Mod Manager');
            sidebar.category('Modding').removeItem('Mod Settings');
        },
        /**
         * Modding setup for mod.io connectivity. If this throws,
         * run Mod Manager in local mode.
         */
        fullModeSetup() {
            return __awaiter(this, void 0, void 0, function*() {
                if (this.didFullModeSetup)
                    return;
                const gameData = yield io.game.get();
                ioStore.setGameData(gameData);
                parser.setup(gameData);
                this.didFullModeSetup = true;
            });
        },
        /**
         * Fallback if cloud mode (mod.io) fails. This runs whatever
         * mods are already installed and configured locally.
         */
        localModeSetup() {
            return __awaiter(this, void 0, void 0, function*() {
                if (this.didLocalModeSetup)
                    return;
                document.querySelectorAll('button.btn-mod-manager').forEach((e) => {
                    e.classList.remove('btn-alt-success');
                    e.classList.add('btn-alt-warning');
                    const i = e.querySelector('i');
                    if (i) {
                        i.classList.remove('fa-cubes');
                        i.classList.add('fa-exclamation-circle');
                    }
                });
                document.querySelectorAll('.btn-mod-manager button').forEach((e) => {
                    e.classList.remove('btn-alt-success');
                    e.classList.add('btn-alt-warning');
                    const i = e.querySelector('i');
                    if (i) {
                        i.classList.remove('fa-cubes');
                        i.classList.add('fa-exclamation-circle');
                    }
                });
                sidebar.category('Modding').item('Mod Manager', {
                    icon: createElement('i', {
                        className: 'fas fa-exclamation-circle text-warning'
                    }),
                });
                this.didLocalModeSetup = true;
            });
        },
        /**
         * Finish full or local mode setup by loading the installed mods
         */
        afterLogin() {
            return __awaiter(this, void 0, void 0, function*() {
                const {
                    modLoadOrder,
                    modDisabled,
                    modProfiles,
                    modActiveProfile,
                    modPreferLatest,
                    modAccountStorage
                } = yield playFabManager.retrieve([
                    'modLoadOrder',
                    'modDisabled',
                    'modProfiles',
                    'modActiveProfile',
                    'modPreferLatest',
                    'modAccountStorage',
                ]);
                modStore.setLoadOrder(modLoadOrder ? JSON.parse(modLoadOrder) : []);
                yield modStore.setup(modPreferLatest);
                profileStore.setup(modProfiles, modActiveProfile, modDisabled);
                accountStorageContextApi.deserializeAll(modAccountStorage);
                yield this.loadEnabledMods();
            });
        },
        loadEnabledMods() {
            return __awaiter(this, void 0, void 0, function*() {
                // Prevent loading mods again if sign out -> sign back in
                // or if the game is already loaded
                if (contextApi.hasCharacterSelectionLoadedTriggered())
                    return;
                cloudManager.log('Loading Mods...');
                cloudManager.setStatus(getLangString('MOD_MANAGER_STATUS_LOADING_MODS'));
                // Load mods in order, skipping disabled
                const toLoad = modStore.loadOrder.filter((id) => modStore.isInstalled(id) && profileStore.isEnabled(id));
                for (let i = 0; i < toLoad.length; i++) {
                    const mod = modStore.mod(toLoad[i]);
                    if (!mod.local)
                        continue;
                    if (modStore.loaded.some((id) => id === mod.id))
                        continue;
                    cloudManager.log(`Loading Mods (${i + 1}/${toLoad.length}): ${mod.local.name} (v${mod.local.version})`);
                    cloudManager.setStatus(templateLangString('MOD_MANAGER_STATUS_LOADING_MODS_INFO', {
                        currentCount: `${i + 1}`,
                        maxCount: `${toLoad.length}`,
                        modName: mod.local.name,
                    }));
                    const depsNotFound = [];
                    if (mod.local.dependencies && mod.local.dependencies.length) {
                        for (const dep of mod.local.dependencies) {
                            if (modStore.loaded.findIndex((id) => id === dep.mod_id) === -1)
                                depsNotFound.push(dep);
                        }
                        if (depsNotFound.length) {
                            console.error(`[${mod.local.name}] Failed to load due to missing dependencies: ${depsNotFound.map((d) => d.name)}`);
                            this.queueDependencyPrompt(mod.local, depsNotFound);
                            continue;
                        }
                    }
                    try {
                        modStore.cacheLoadedMods([mod.local]);
                        modStore.loaded.push(mod.id);
                        yield loader.load(mod.local);
                        if (mod.id === creatorToolkitId) {
                            this.creatorToolkitLoaded = true;
                            const menuBtns = document.querySelectorAll('.btn-group.btn-mod-manager, .btn-mod-manager .btn-group');
                            menuBtns.forEach((e) => {
                                const isMobileBtn = !e.classList.contains('btn-mod-manager');
                                const tkBtn = createElement('button', {
                                    attributes: [
                                        ['role', 'button']
                                    ],
                                    className: `btn btn-alt-warning ${isMobileBtn ? 'my-2' : ''}`,
                                    children: [
                                        createElement('i', {
                                            className: `fas fa-fw fa-asterisk ${isMobileBtn ? '' : 'opacity-50'}`,
                                        }),
                                    ],
                                });
                                tkBtn.addEventListener('click', () => contextApi.trigger.creatorToolkitOpen());
                                e.append(tkBtn);
                            });
                        }
                    } catch (e) {
                        modStore.loaded.pop();
                        console.error(`[${mod.local.name}]`, e);
                    }
                }
                yield contextApi.trigger.modsLoaded();
            });
        },
        /**
         * Queues a Swal2 prompt that will ask the user to install unresolved dependencies for a given mod.
         * @param mod Mod that contains the unresolved dependencies.
         * @param dependencies The unresolved dependencies.
         */
        queueDependencyPrompt(mod, dependencies) {
            if (!dependencies.length)
                return;
            const plural = dependencies.length > 1;
            const dependencyMessage = createElement('span');
            dependencyMessage.innerHTML = templateLangString(`MOD_MANAGER_INSTALLED_MOD_DEPENDENCIES_${plural ? 'PLURAL' : 'SINGULAR'}`, {
                modName: mod.name
            });
            const message = createElement('div', {
                children: [
                    createElement('p', {
                        className: 'mb-0',
                        children: [dependencyMessage],
                    }),
                    createElement('ul', {
                        className: 'list-group',
                        children: dependencies.map((d) => createElement('li', {
                            className: 'list-group-item bg-white border-dark font-weight-bold text-danger',
                            children: [createElement('i', {
                                className: 'fas fa-times-circle mr-2'
                            }), d.name],
                        })),
                    }),
                    createElement('p', {
                        className: 'mb-0',
                        text: getLangString('MOD_MANAGER_MOD_WILL_NOT_BE_LOADED'),
                    }),
                ],
            });
            this.dependencyPrompts.push({
                icon: 'warning',
                title: getLangString(`MOD_MANAGER_MISSING_MOD_DEPENDENCY_${plural ? 'PLURAL' : 'SINGULAR'}`),
                html: message,
                confirmButtonText: getLangString('MOD_MANAGER_SHOW_IN_MOD_MANAGER'),
                denyButtonText: getLangString('MOD_MANAGER_CONTINUE_WITHOUT_LOADING'),
                showDenyButton: true,
                preConfirm: () => this.dependencyPrompts.unshift(`id:${dependencies.map((d) => d.mod_id).join(',')}`),
            });
        },
        toggleAutoDownload() {
            this.autoDownload = !this.autoDownload;
            if (this.autoDownload) {
                localStorage.removeItem('mm__stop-auto-download');
            } else {
                localStorage.setItem('mm__stop-auto-download', '1');
            }
        },
    });
    const uiStore = vue.createStore({
        activeTab: 'browse',
        browseView: 'grid',
        selectedMod: null,
        awaitingReload: false,
        searchQuery: '',
        searchDebounce: null,
        sortOption: SortOption.Trending,
        platformFilter: true,
        filters: [],
        results: [],
        totalResults: 0,
        page: 1,
        gettingResults: false,
        fillSearch: false,
        get platformResults() {
            if (this.platformFilter) {
                return this.results.filter((id) => {
                    const mod = modStore.mod(id);
                    if (!mod.io)
                        return false;
                    return parser.isAvailableOnThisPlatform(mod.io.categorized_tags);
                });
            }
            return this.results;
        },
        get hiddenModCount() {
            return this.results.length - this.platformResults.length;
        },
        changeSearchQuery() {
            if (this.searchDebounce) {
                clearTimeout(this.searchDebounce);
            }
            this.searchDebounce = window.setTimeout(() => {
                this.resetResults();
                this.searchDebounce = null;
            }, 1000);
        },
        changeSortOption(sortOption) {
            this.sortOption = sortOption;
            this.resetResults();
        },
        setActiveTab(tab) {
            if (store.isLocalMode && tab === 'browse')
                return;
            this.activeTab = tab;
        },
        togglePlatformFilter() {
            this.platformFilter = !this.platformFilter;
        },
        toggleFilter(filter) {
            if (filter === 'plat') {
                this.togglePlatformFilter();
                return;
            }
            if (this.filters.indexOf(filter) > -1) {
                this.filters = this.filters.filter((f) => f !== filter);
            } else {
                this.filters = [...this.filters, filter];
            }
            this.resetResults();
        },
        resetResults() {
            return __awaiter(this, void 0, void 0, function*() {
                if (this.gettingResults) {
                    yield new Promise((res) => {
                        const check = setInterval(() => {
                            if (!this.gettingResults) {
                                clearInterval(check);
                                res();
                            }
                        }, 50);
                    });
                }
                if (this.searchDebounce) {
                    clearTimeout(this.searchDebounce);
                    this.searchDebounce = null;
                }
                this.results = [];
                this.page = 1;
                this.totalResults = 0;
                this.search();
            });
        },
        search() {
            return __awaiter(this, void 0, void 0, function*() {
                if (this.gettingResults)
                    return;
                if (this.page > 1 && this.results.length >= this.totalResults)
                    return;
                this.gettingResults = true;
                const mods = yield io.mods.getAll(this.sortOption, {
                    page: this.page,
                    pageSize: 24
                }, this.searchQuery, this.filters);
                modStore.cacheIoMods(mods.data);
                this.results = [...this.results, ...mods.data.map((m) => m.id)];
                this.totalResults = mods.result_total;
                this.page++;
                this.gettingResults = false;
                setTimeout(() => {
                    if (this.fillSearch) {
                        this.search();
                    }
                }, 100);
            });
        },
        triggerReload() {
            if (!contextApi.hasCharacterSelectionLoadedTriggered())
                return;
            this.awaitingReload = true;
        },
    });
    const profileStore = vue.createStore({
        profiles: [],
        active: null,
        selected: null,
        editing: {
            id: '',
            name: '',
            autoEnable: false,
        },
        offlineSubscribedMods: [],
        get profile() {
            return (id) => {
                const profile = this.profiles.find((p) => p.id === id);
                if (!profile)
                    return null;
                return profile;
            };
        },
        get canCreateNew() {
            return this.profiles.length < 6;
        },
        get canSaveEdits() {
            if (!this.editing.name)
                return false;
            return !this.profiles.some((p) => p.id !== this.editing.id && p.name === this.editing.name);
        },
        get isEnabled() {
            return (mod) => {
                if (!this.selected)
                    return false;
                return this.selected.mods.includes(mod);
            };
        },
        setup(profiles, activeProfile, legacyDisabled) {
            if (profiles) {
                this.profiles = JSON.parse(profiles);
            } else {
                const defaultProfile = convertDisabledToProfile(legacyDisabled);
                this.setProfiles([defaultProfile]);
                activeProfile = defaultProfile.id;
                playFabManager.queueUpdate('modActiveProfile', activeProfile);
                playFabManager.queueUpdate('modDisabled', null);
            }
            const nextProfile = localStorage.getItem('modNextActiveProfile');
            if (nextProfile) {
                activeProfile = nextProfile;
                localStorage.removeItem('modNextActiveProfile');
                playFabManager.queueUpdate('modActiveProfile', activeProfile);
            }
            if (!activeProfile || activeProfile === 'no-mods') {
                this.active = null;
            } else {
                const profile = this.profiles.find((p) => p.id === activeProfile);
                this.active = profile || null;
            }
            document.querySelectorAll('.mod-manager-active-profile').forEach((e) => {
                e.classList.toggle('text-danger', this.active === null);
                e.classList.toggle('text-success', this.active !== null);
                e.textContent = this.active === null ? getLangString('MOD_MANAGER_NO_MODS') : this.active.name;
            });
            this.selected = this.active;
            this.enableModsForAutoEnableProfiles(this.offlineSubscribedMods);
        },
        setProfiles(profiles) {
            this.profiles = profiles;
            this.saveProfiles();
        },
        newProfile(name = 'Mod profile') {
            if (!this.canCreateNew)
                return;
            const takenNames = new Set();
            for (const p of this.profiles) {
                takenNames.add(p.name);
            }
            if (takenNames.has(name)) {
                let n = 1;
                while (takenNames.has(`${name} ${n}`)) {
                    // Just an infinite loop catch
                    // But not sure how it would happen
                    if (n > 10)
                        return;
                    n++;
                }
                name = `${name} ${n}`;
            }
            const profile = {
                id: generateUUID(8),
                name,
                autoEnable: false,
                mods: [],
            };
            this.setProfiles([...this.profiles, profile]);
            return profile;
        },
        deleteProfile(profile) {
            if (this.active === profile)
                return;
            if (this.selected === profile) {
                if (this.profiles.length === 1) {
                    this.selected = null;
                } else {
                    const index = this.profiles.indexOf(profile);
                    const newSelectedIndex = index + (index === this.profiles.length - 1 ? -1 : 1);
                    this.selected = this.profiles[newSelectedIndex];
                }
            }
            this.setProfiles(this.profiles.filter((p) => p !== profile));
        },
        editProfile(profile) {
            this.editing.id = profile.id;
            this.editing.name = profile.name;
            this.editing.autoEnable = profile.autoEnable;
        },
        cancelEdits() {
            this.editing.id = '';
            this.editing.name = '';
            this.editing.autoEnable = false;
        },
        saveEdits() {
            if (!this.editing.name)
                return;
            let newName = this.editing.name.substring(0, 50).trim();
            if (newName === 'No mods')
                newName = 'Yes mods';
            if (this.profiles.some((p) => p.id !== this.editing.id && p.name === newName))
                return;
            const profile = this.profile(this.editing.id);
            if (profile) {
                profile.name = newName;
                profile.autoEnable = false; // this.editing.autoEnable;
                this.saveProfiles();
            } else {
                this.setProfiles([
                    ...this.profiles,
                    {
                        id: this.editing.id,
                        name: newName,
                        mods: [],
                        autoEnable: false, // this.editing.autoEnable,
                    },
                ]);
            }
            this.editing.id = '';
            this.editing.name = '';
            this.editing.autoEnable = false;
        },
        toggleAllMods() {
            if (!this.selected)
                return;
            if (this.selected.mods.length >= modStore.subscribed.length) {
                this.selected.mods = [];
            } else {
                this.selected.mods = [...modStore.subscribed];
            }
            if (this.selected === this.active)
                uiStore.triggerReload();
            this.saveProfiles();
        },
        toggleMod(mod) {
            if (!this.selected)
                return;
            if (this.selected.mods.indexOf(mod) > -1) {
                this.selected.mods = this.selected.mods.filter((id) => id !== mod);
            } else {
                this.selected.mods = [...this.selected.mods, mod];
            }
            if (this.selected === this.active)
                uiStore.triggerReload();
            this.saveProfiles();
        },
        enableModsForAutoEnableProfiles(mods) {
            if (!mods.length)
                return;
            for (const profile of this.profiles) {
                if (!profile.autoEnable)
                    continue;
                const enabled = new Set(profile.mods);
                for (const mod of mods) {
                    if (enabled.has(mod))
                        continue;
                    profile.mods.push(mod);
                }
            }
            this.saveProfiles();
        },
        removeModFromAllProfiles(mod) {
            for (const profile of this.profiles) {
                profile.mods = profile.mods.filter((id) => id !== mod);
            }
            this.saveProfiles();
        },
        setNextActive(profile) {
            var _a;
            if (profile === this.active) {
                localStorage.removeItem('modNextActiveProfile');
                return;
            }
            localStorage.setItem('modNextActiveProfile', (_a = profile === null || profile === void 0 ? void 0 : profile.id) !== null && _a !== void 0 ? _a : 'no-mods');
        },
        saveProfiles() {
            playFabManager.queueUpdate('modProfiles', JSON.stringify(this.profiles));
        },
        duplicateProfile() {
            if (!this.selected)
                return;
            if (!this.canCreateNew)
                return;
            const duplicateProfile = this.newProfile(`${this.selected.name.substring(0, 43)} (${getLangString('MOD_MANAGER_COPY')})`);
            if (!duplicateProfile)
                return;
            duplicateProfile.mods = [...this.selected.mods];
            this.saveProfiles();
            this.selected = duplicateProfile;
        },
        importProfile(profile) {
            if (!this.canCreateNew)
                return false;
            const takenNames = new Set();
            for (const p of this.profiles) {
                takenNames.add(p.name);
            }
            if (takenNames.has(profile.name)) {
                let n = 1;
                while (takenNames.has(`${profile.name} ${n}`)) {
                    // Just an infinite loop catch
                    // But not sure how it would happen
                    if (n > 10)
                        return false;
                    n++;
                }
                profile.name = `${profile.name} ${n}`;
            }
            this.setProfiles([
                ...this.profiles,
                Object.assign(Object.assign({}, profile), {
                    autoEnable: false
                }),
            ]);
            return true;
        },
    });
    const convertDisabledToProfile = (disabled) => {
        const profile = {
            id: generateUUID(8),
            name: getLangString('MOD_MANAGER_DEFAULT_MOD_PROFILE'),
            mods: [],
            autoEnable: false, // true,
        };
        const disabledSet = new Set(JSON.parse(disabled || '[]'));
        modStore.subscribed.forEach((id) => !disabledSet.has(id) && profile.mods.push(id));
        return profile;
    };
    const modStore = vue.createStore({
        loadOrder: [],
        dev: [],
        subscribed: [],
        installed: [],
        loaded: [],
        latestPreferred: [],
        cache: {},
        ratings: {},
        hasNewSubscriptions: false,
        newSubscriptionTipDismissed: false,
        currentDownload: {
            bytesDownloaded: 0,
            byteTotal: 0,
            bytesPerSecond: 0,
        },
        get mod() {
            return (id) => {
                return (this.cache[id] || {
                    id,
                    io: null,
                    local: null,
                    loaded: null,
                });
            };
        },
        get isDev() {
            return (id) => this.dev.includes(id);
        },
        get isSubscibed() {
            return (id) => this.subscribed.includes(id);
        },
        get isInstalled() {
            return (id) => this.installed.includes(id);
        },
        get isLoaded() {
            return (id) => this.loaded.includes(id);
        },
        get isLatestPreferred() {
            return (mod) => this.latestPreferred.includes(mod);
        },
        get isUpToDate() {
            return (mod) => {
                var _a;
                const cache = this.cache[mod];
                if (!cache || !cache.local)
                    return false;
                const modfile = this.isLatestPreferred(mod) ? this.cache[mod].latest : (_a = this.cache[mod].io) === null || _a === void 0 ? void 0 : _a.modfile;
                if (!modfile)
                    return true;
                return cache.local.version === modfile.version;
            };
        },
        get rating() {
            return (id) => {
                var _a;
                return (_a = this.ratings[id]) !== null && _a !== void 0 ? _a : 0;
            };
        },
        get installedMods() {
            const mods = [];
            for (const id of this.installed) {
                const cache = this.mod(id);
                if (!cache || !cache.local)
                    continue;
                mods.push(cache.local);
            }
            return mods;
        },
        get loadedMods() {
            const mods = [];
            for (const id of this.loaded) {
                const cache = this.mod(id);
                if (!cache || !cache.loaded)
                    continue;
                mods.push(cache.loaded);
            }
            return mods;
        },
        get loadedModByNamespace() {
            return (namespace) => {
                return this.loadedMods.find((m) => m.namespace === namespace);
            };
        },
        get loadedList() {
            return this.loaded.map((id) => {
                const mod = this.mod(id);
                if (!mod.loaded)
                    return 'Unknown';
                return mod.loaded.name;
            });
        },
        setup(modPreferLatest) {
            return __awaiter(this, void 0, void 0, function*() {
                if (modPreferLatest) {
                    this.latestPreferred = JSON.parse(modPreferLatest);
                }
                if (!store.isLocalMode) {
                    try {
                        const subbed = yield io.mods.getSubscribed();
                        this.cacheIoMods(subbed);
                        const subbedIds = subbed.map((m) => m.id);
                        this.setSubscribedMods(subbedIds);
                        yield db.mods.deleteUnsubscribed(subbedIds);
                        this.reconcileLatestPreferred();
                    } catch (e) {
                        console.error('Failed to fetch subscribed mods from mod.io', e);
                    }
                }
                const installed = yield db.mods.getAll();
                this.cacheLocalMods(installed);
                this.setInstalledMods(installed.map((mod) => mod.id));
                if (!store.isLocalMode) {
                    this.reconcileLoadOrder();
                    cloudManager.log('Checking for Mod Updates...');
                    yield this.updateInstalledMods();
                    if (!taskStore.downloadQueue.isEmpty || !taskStore.installQueue.isEmpty) {
                        cloudManager.log('Updating Mods...');
                        yield taskStore.waitForQueues();
                    }
                }
            });
        },
        reconcileLoadOrder() {
            const subscribed = new Set(this.subscribed);
            const inLoadOrder = new Set();
            const loadOrder = this.loadOrder.filter((id) => {
                if (!subscribed.has(id))
                    return false;
                inLoadOrder.add(id);
                return true;
            });
            for (const id of this.subscribed) {
                if (inLoadOrder.has(id))
                    continue;
                profileStore.offlineSubscribedMods.push(id);
                const mod = this.mod(id);
                if (mod.io && mod.io.categorized_tags.types.includes('Dependency')) {
                    loadOrder.unshift(id);
                } else {
                    loadOrder.push(id);
                }
            }
            this.setLoadOrder(loadOrder);
        },
        reconcileLatestPreferred() {
            this.setLatestPreferred(this.latestPreferred.filter((mod) => this.isSubscibed(mod)));
        },
        setLoadOrder(mods) {
            this.loadOrder = mods;
            uiStore.triggerReload();
            playFabManager.queueUpdate('modLoadOrder', JSON.stringify(this.loadOrder));
        },
        appendToLoadOrder(mod) {
            if (this.loadOrder.includes(mod))
                return;
            this.setLoadOrder([...this.loadOrder, mod]);
        },
        prependToLoadOrder(mod) {
            if (this.loadOrder.includes(mod))
                return;
            this.setLoadOrder([mod, ...this.loadOrder]);
        },
        removeFromLoadOrder(mod) {
            if (!this.loadOrder.includes(mod))
                return;
            this.setLoadOrder(this.loadOrder.filter((id) => id !== mod));
        },
        shiftLoadOrder(mod, up) {
            const currentIndex = this.loadOrder.indexOf(mod);
            if (currentIndex < 0)
                return;
            if (currentIndex === 0 && up)
                return;
            if (currentIndex === this.loadOrder.length - 1 && !up)
                return;
            const loadOrder = [...this.loadOrder];
            const swapIndex = currentIndex + (up ? -1 : 1);
            loadOrder[currentIndex] = loadOrder[swapIndex];
            loadOrder[swapIndex] = mod;
            this.setLoadOrder(loadOrder);
            uiStore.triggerReload();
        },
        setDevMods(mods) {
            this.dev = mods;
        },
        setSubscribedMods(mods) {
            this.subscribed = mods;
        },
        subscribeTo(mod) {
            return __awaiter(this, void 0, void 0, function*() {
                if (store.isLocalMode)
                    return;
                const ioMod = yield taskStore.subscribeQueue.enqueue(mod);
                if (!ioMod)
                    return;
                this.cacheIoMods([ioMod]);
                this.setSubscribedMods([...this.subscribed, mod]);
                this.hasNewSubscriptions = true;
                profileStore.enableModsForAutoEnableProfiles([mod]);
                if (ioMod.categorized_tags.types.includes('Dependency')) {
                    this.prependToLoadOrder(mod);
                } else {
                    this.appendToLoadOrder(mod);
                }
                if (store.autoDownload && !this.isUpToDate(mod)) {
                    this.downloadAndInstall(mod);
                }
            });
        },
        unsubscribeFrom(mod) {
            return __awaiter(this, void 0, void 0, function*() {
                if (store.isLocalMode)
                    return;
                yield taskStore.unsubscribeQueue.enqueue(mod);
                this.setSubscribedMods(this.subscribed.filter((id) => id !== mod));
                this.removeFromLoadOrder(mod);
                profileStore.removeModFromAllProfiles(mod);
                this.uninstall(mod);
            });
        },
        setInstalledMods(mods) {
            this.installed = mods;
            uiStore.triggerReload();
        },
        downloadAndInstall(id) {
            return __awaiter(this, void 0, void 0, function*() {
                if (store.isLocalMode)
                    return;
                const cached = this.cache[id];
                if (!cached || !cached.io)
                    return;
                const mod = cached.io;
                let modfile = mod.modfile;
                if (this.isLatestPreferred(id)) {
                    if (!cached.latest)
                        return;
                    modfile = cached.latest;
                }
                const file = yield taskStore.downloadQueue.enqueue([
                    modfile,
                    (bytesDownloaded, byteTotal, bytesPerSecond) => {
                        this.currentDownload.bytesDownloaded = bytesDownloaded;
                        this.currentDownload.byteTotal = byteTotal;
                        this.currentDownload.bytesPerSecond = bytesPerSecond;
                    },
                ]);
                if (!file)
                    return;
                const localMod = yield taskStore.installQueue.enqueue({
                    mod,
                    modfile,
                    file
                });
                if (!localMod)
                    return;
                this.cacheLocalMods([localMod]);
                this.setInstalledMods([...this.installed, localMod.id]);
            });
        },
        uninstall(mod) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!this.isInstalled(mod))
                    return;
                yield taskStore.uninstallQueue.enqueue(mod);
                this.setInstalledMods(this.installed.filter((id) => id !== mod));
                this.removeLocalCache(mod);
            });
        },
        setLoadedMods(mods) {
            this.loaded = mods;
        },
        addLoadedMod(mod) {
            this.loaded = [...this.loaded, mod];
        },
        setLatestPreferred(latestPreferred) {
            this.latestPreferred = latestPreferred;
            playFabManager.queueUpdate('modPreferLatest', JSON.stringify(this.latestPreferred));
        },
        preferLive(mod) {
            if (!this.isLatestPreferred(mod))
                return;
            this.setLatestPreferred(this.latestPreferred.filter((id) => id !== mod));
            if (this.isSubscibed(mod) && !this.isUpToDate(mod) && store.autoDownload) {
                this.downloadAndInstall(mod);
            }
        },
        preferLatest(mod) {
            return __awaiter(this, void 0, void 0, function*() {
                if (this.isLatestPreferred(mod))
                    return;
                this.setLatestPreferred([...this.latestPreferred, mod]);
                const modfile = yield io.mods.getLatestModfile(mod);
                this.cacheLatestModfile(mod, modfile);
                if (this.isSubscibed(mod) && !this.isUpToDate(mod) && store.autoDownload) {
                    this.downloadAndInstall(mod);
                }
            });
        },
        createModCache(mod) {
            if (this.cache[mod])
                return;
            this.cache[mod] = {
                id: mod,
                io: null,
                local: null,
                loaded: null,
                latest: null,
            };
        },
        cacheIoMods(mods) {
            for (const mod of mods) {
                mod.categorized_tags = parser.parseTags(mod.tags);
                this.createModCache(mod.id);
                this.cache[mod.id].io = mod;
            }
        },
        updateInstalledMods() {
            return __awaiter(this, void 0, void 0, function*() {
                const updatedModsMeta = [];
                for (const mod of this.subscribed) {
                    if (this.isLatestPreferred(mod)) {
                        const modfile = yield io.mods.getLatestModfile(mod);
                        this.cacheLatestModfile(mod, modfile);
                    }
                    if (!this.isUpToDate(mod)) {
                        if (store.autoDownload)
                            this.downloadAndInstall(mod);
                    } else {
                        const {
                            local,
                            io,
                            latest
                        } = this.mod(mod);
                        if (!local || !io)
                            continue;
                        const modfile = this.isLatestPreferred(mod) && latest ? latest : io.modfile;
                        if (local.version !== modfile.version)
                            continue;
                        if (local.changelog === modfile.changelog &&
                            local.description === io.summary &&
                            local.homepageUrl === io.homepage_url &&
                            local.name === io.name &&
                            JSON.stringify(local.tags) === JSON.stringify(io.categorized_tags))
                            continue;
                        const updated = yield db.mods.get(mod);
                        if (!updated)
                            continue;
                        updated.changelog = modfile.changelog;
                        updated.description = io.summary;
                        updated.homepageUrl = io.homepage_url;
                        updated.name = io.name;
                        updated.tags = JSON.parse(JSON.stringify(io.categorized_tags));
                        yield db.mods.put(updated);
                        updatedModsMeta.push(updated);
                    }
                }
                this.cacheLocalMods(updatedModsMeta);
            });
        },
        cacheLocalMods(mods) {
            for (const mod of mods) {
                this.createModCache(mod.id);
                this.cache[mod.id].local = mod;
            }
        },
        cacheLoadedMods(mods) {
            for (const mod of mods) {
                this.createModCache(mod.id);
                this.cache[mod.id].loaded = mod;
            }
        },
        cacheStats(id, stats) {
            var _a;
            const cached = (_a = this.cache[id]) === null || _a === void 0 ? void 0 : _a.io;
            if (!cached)
                return;
            cached.stats = stats;
        },
        cacheLatestModfile(mod, modfile) {
            this.createModCache(mod);
            this.cache[mod].latest = modfile;
        },
        removeLocalCache(mod) {
            if (!this.cache[mod])
                return;
            this.cache[mod].local = null;
        },
        setRatings(ratings) {
            for (const rating of ratings) {
                this.ratings[rating.mod_id] = rating.rating;
            }
        },
        rate(id, rating) {
            return __awaiter(this, void 0, void 0, function*() {
                if (store.isLocalMode)
                    return;
                this.ratings[id] = rating;
                yield taskStore.ratingQueue.enqueue([id, rating]);
                const stats = yield io.mods.getStats(id);
                this.cacheStats(id, stats);
            });
        },
    });
    const ioStore = vue.createStore({
        profileUrl: '',
        instructionsUrl: '',
        competitions: [],
        modTypes: [],
        setGameData(game) {
            this.profileUrl = game.profile_url;
            this.instructionsUrl = game.instructions_url;
            const compTags = game.tag_options.find((o) => o.name === 'Competition');
            if (compTags) {
                this.competitions = compTags.tags.map((t) => ({
                    name: t,
                    count: compTags.tag_count_map[t]
                }));
            }
            const typeTags = game.tag_options.find((o) => o.name === 'Type');
            if (typeTags) {
                this.modTypes = typeTags.tags.map((t) => ({
                    name: t,
                    count: typeTags.tag_count_map[t]
                }));
            }
        },
    });
    const useTaskQueue = (config) => {
        return vue.createStore({
            head: null,
            tail: null,
            isProcessing: false,
            get isEmpty() {
                return this.head === null;
            },
            get items() {
                const items = [];
                let node = this.head;
                while (node) {
                    items.push(node.item);
                    node = node.next;
                }
                return items;
            },
            get peek() {
                if (!this.head)
                    return null;
                return config.toKey(this.head.value);
            },
            contains(key) {
                let node = this.head;
                while (node) {
                    if (config.comparator(key, node.value))
                        return true;
                    node = node.next;
                }
                return false;
            },
            enqueue(value) {
                return new Promise((resolve, reject) => {
                    if (this.contains(config.toKey(value)))
                        return resolve(undefined);
                    const item = {
                        value,
                        resolve,
                        reject,
                        next: null,
                    };
                    if (this.tail === null) {
                        this.head = item;
                    } else {
                        this.tail.next = item;
                    }
                    this.tail = item;
                    this.process();
                });
            },
            dequeue() {
                if (this.head === null)
                    return undefined;
                const item = this.head;
                this.head = this.head.next;
                if (this.head === null)
                    this.tail = null;
                return item;
            },
            process() {
                return __awaiter(this, void 0, void 0, function*() {
                    if (this.isProcessing)
                        return;
                    if (!this.head)
                        return;
                    this.isProcessing = true;
                    const {
                        value,
                        resolve,
                        reject
                    } = this.head;
                    try {
                        const output = yield config.doTask(value);
                        resolve(output);
                    } catch (e) {
                        reject(e);
                    }
                    this.dequeue();
                    this.isProcessing = false;
                    this.process();
                });
            },
        });
    };
    const taskStore = vue.createStore({
        subscribeQueue: useTaskQueue({
            doTask(id) {
                return __awaiter(this, void 0, void 0, function*() {
                    return yield io.mods.subscribeTo(id);
                });
            },
            comparator(a, b) {
                return a === b;
            },
            toKey(id) {
                return id;
            },
        }),
        unsubscribeQueue: useTaskQueue({
            doTask(id) {
                return __awaiter(this, void 0, void 0, function*() {
                    yield io.mods.unsubscribeFrom(id);
                });
            },
            comparator(a, b) {
                return a === b;
            },
            toKey(id) {
                return id;
            },
        }),
        downloadQueue: useTaskQueue({
            doTask([modfile, onProgress]) {
                return __awaiter(this, void 0, void 0, function*() {
                    return yield io.mods.download(modfile, onProgress);
                });
            },
            comparator(modId, [{
                mod_id
            }]) {
                return modId === mod_id;
            },
            toKey([{
                mod_id
            }]) {
                return mod_id;
            },
        }),
        installQueue: useTaskQueue({
            doTask({
                mod,
                modfile,
                file
            }) {
                return __awaiter(this, void 0, void 0, function*() {
                    const localMod = yield parser.parse(mod, modfile, file);
                    yield db.mods.put(localMod);
                    return localMod;
                });
            },
            comparator(id, item) {
                return item.mod.id === id;
            },
            toKey(item) {
                return item.mod.id;
            },
        }),
        uninstallQueue: useTaskQueue({
            doTask(id) {
                return __awaiter(this, void 0, void 0, function*() {
                    yield db.mods.delete(id);
                });
            },
            comparator(a, b) {
                return a === b;
            },
            toKey(id) {
                return id;
            },
        }),
        ratingQueue: useTaskQueue({
            doTask([id, rating]) {
                return __awaiter(this, void 0, void 0, function*() {
                    if (rating > 0) {
                        yield io.mods.ratePositive(id);
                        return;
                    }
                    if (rating < 0) {
                        yield io.mods.rateNegative(id);
                        return;
                    }
                    yield io.mods.removeRating(id);
                });
            },
            comparator(a, [b]) {
                return a === b;
            },
            toKey([id]) {
                return id;
            },
        }),
        get isProcessing() {
            return (this.subscribeQueue.isProcessing ||
                this.unsubscribeQueue.isProcessing ||
                this.downloadQueue.isProcessing ||
                this.installQueue.isProcessing ||
                this.uninstallQueue.isProcessing ||
                this.ratingQueue.isProcessing);
        },
        waitForQueues(timeout = 30000) {
            return new Promise((res, rej) => {
                let totalTime = 0;
                const interval = setInterval(() => {
                    totalTime += 500;
                    if (totalTime > timeout) {
                        clearInterval(interval);
                        rej('Task queues did not resolve in the allowed time.');
                        return;
                    }
                    if (this.isProcessing) {
                        return;
                    }
                    clearInterval(interval);
                    res();
                }, 500);
            });
        },
    });
    const ui = (() => {
        const template = (name) => `#mm__${name}--template`;
        //#region Components
        function Main() {
            return {
                $template: template('main'),
                HeaderMenu,
                DesktopNav,
                MobileNav,
                Browse,
                MyMods,
                DetailsPanel,
                store,
                profileStore,
                modStore,
                uiStore,
                ioStore,
                taskStore,
                noModsText: getLangString('MOD_MANAGER_NO_MODS'),
                getLangString(id) {
                    return getLangString(id);
                },
                openLink(url) {
                    openLink(url);
                },
            };
        }

        function HeaderMenu() {
            return {
                $template: template('header-menu'),
                reload() {
                    return __awaiter(this, void 0, void 0, function*() {
                        yield playFabManager.persist();
                        window.location.reload();
                    });
                },
                signOut() {
                    return __awaiter(this, void 0, void 0, function*() {
                        if (store.isLocalMode)
                            return;
                        loginStore.actions.logout();
                        Swal.close();
                        open();
                    });
                },
            };
        }

        function DesktopNav() {
            return {
                $template: template('desktop-nav'),
                openCreatorToolkit() {
                    if (store.creatorToolkitLoaded) {
                        contextApi.trigger.creatorToolkitOpen();
                        return;
                    }
                    uiStore.setActiveTab('browse');
                    uiStore.searchQuery = `id:${creatorToolkitId}`;
                    uiStore.changeSearchQuery();
                },
            };
        }

        function MobileNav() {
            return {
                $template: template('mobile-nav'),
            };
        }

        function Browse() {
            return {
                $template: template('browse'),
                BrowseToolbar,
                BrowseGridView,
            };
        }

        function BrowseToolbar() {
            return {
                $template: template('browse-toolbar'),
                BrowseFilterItem,
                hasClickedFilters: false,
                sortOptions: [{
                        label: setLang === 'en' ? 'Trending' : getLangString('MOD_MANAGER_POPULAR'),
                        value: SortOption.Trending,
                    },
                    {
                        label: setLang === 'en' ? 'Most Popular' : getLangString('MOD_MANAGER_DOWNLOADS'),
                        value: SortOption.MostPopular,
                    },
                    {
                        label: getLangString('MOD_MANAGER_RATING'),
                        value: SortOption.Rating,
                    },
                    {
                        label: getLangString('MOD_MANAGER_SUBSCRIBERS'),
                        value: SortOption.Subscribers,
                    },
                    {
                        label: getLangString('MOD_MANAGER_NEWEST'),
                        value: SortOption.Newest,
                    },
                    {
                        label: getLangString('MOD_MANAGER_SORT_LAST_UPDATED'),
                        value: SortOption.LastUpdated,
                    },
                    {
                        label: getLangString('MOD_MANAGER_SORT_ALPHABETICAL'),
                        value: SortOption.Alphabetical,
                    },
                ],
            };
        }

        function BrowseFilterItem(props) {
            return {
                $template: template('browse-filter-item'),
                props,
                get id() {
                    return props.tag.toLowerCase().replace(/\s/g, '-');
                },
                get isChecked() {
                    if (this.props.tag === 'plat')
                        return uiStore.platformFilter;
                    return uiStore.filters.includes(props.tag);
                },
            };
        }

        function BrowseGridView() {
            return {
                $template: template('browse-grid-view'),
                BrowseGridViewItem,
                observer: null,
                get results() {
                    if (uiStore.platformFilter)
                        return uiStore.platformResults;
                    return uiStore.results;
                },
                mounted() {
                    const observer = new IntersectionObserver(([{
                        isIntersecting
                    }]) => {
                        uiStore.fillSearch = isIntersecting;
                        if (isIntersecting)
                            uiStore.search();
                    }, {
                        root: this.$refs.scrollArea,
                        threshold: 0.5,
                    });
                    observer.observe(this.$refs.loadTrigger);
                    this.observer = observer;
                },
                unmounted() {
                    this.observer.disconnect();
                },
            };
        }

        function BrowseGridViewItem(props) {
            return {
                $template: template('browse-grid-view-item'),
                get mod() {
                    return modStore.mod(props.modId);
                },
                get isDev() {
                    return modStore.isDev(props.modId);
                },
                get isAvailableForThisPlatform() {
                    if (!this.mod)
                        return true;
                    if (!this.mod.io)
                        return true;
                    return parser.isAvailableOnThisPlatform(this.mod.io.categorized_tags);
                },
                get isSubscribed() {
                    return modStore.isSubscibed(props.modId);
                },
                get subscribers() {
                    var _a, _b;
                    return formatNumber((_b = (_a = this.mod.io) === null || _a === void 0 ? void 0 : _a.stats.subscribers_total) !== null && _b !== void 0 ? _b : 0);
                },
                get rating() {
                    var _a, _b;
                    return formatNumber((_b = (_a = this.mod.io) === null || _a === void 0 ? void 0 : _a.stats.ratings_percentage_positive) !== null && _b !== void 0 ? _b : 0);
                },
                get downloads() {
                    var _a, _b;
                    return formatNumber((_b = (_a = this.mod.io) === null || _a === void 0 ? void 0 : _a.stats.downloads_total) !== null && _b !== void 0 ? _b : 0);
                },
                get isSubbing() {
                    return (taskStore.subscribeQueue.contains(this.mod.id) ||
                        taskStore.downloadQueue.contains(this.mod.id) ||
                        taskStore.installQueue.contains(this.mod.id) ||
                        taskStore.unsubscribeQueue.contains(this.mod.id) ||
                        taskStore.uninstallQueue.contains(this.mod.id));
                },
                sub() {
                    if (modStore.isSubscibed(props.modId)) {
                        modStore.unsubscribeFrom(props.modId);
                        return;
                    }
                    modStore.subscribeTo(props.modId);
                },
            };
        }

        function MyMods() {
            return {
                $template: template('my-mods'),
                MyModsToolbar,
                MyModsListView,
            };
        }

        function MyModsToolbar() {
            return {
                $template: template('my-mods-toolbar'),
                MyModsProfileListItem,
                get allEnabled() {
                    if (!profileStore.selected)
                        return false;
                    return profileStore.selected.mods.length >= modStore.subscribed.length;
                },
                get selectedName() {
                    if (!profileStore.selected)
                        return getLangString('MOD_MANAGER_NO_MODS');
                    return profileStore.selected.name;
                },
                get canDelete() {
                    var _a;
                    return profileStore.editing.id !== ((_a = profileStore.active) === null || _a === void 0 ? void 0 : _a.id);
                },
                get isActiveSelected() {
                    return profileStore.selected === profileStore.active;
                },
                get canDuplicate() {
                    return profileStore.selected !== null && profileStore.canCreateNew;
                },
                createNew() {
                    const profile = profileStore.newProfile();
                    if (!profile)
                        return;
                    profileStore.selected = profile;
                    setTimeout(() => {
                        var _a;
                        (_a = this.$refs['editButton']) === null || _a === void 0 ? void 0 : _a.click();
                        setTimeout(() => {
                            var _a;
                            (_a = this.$refs['nameInput']) === null || _a === void 0 ? void 0 : _a.focus();
                        }, 1);
                    }, 1);
                },
                editSelected() {
                    if (!profileStore.selected)
                        return;
                    profileStore.editProfile(profileStore.selected);
                    setTimeout(() => {
                        var _a;
                        (_a = this.$refs['nameInput']) === null || _a === void 0 ? void 0 : _a.focus();
                    }, 1);
                },
                deleteSelected() {
                    if (!profileStore.selected)
                        return;
                    profileStore.deleteProfile(profileStore.selected);
                    setTimeout(() => {
                        var _a;
                        (_a = this.$refs['cancelTarget']) === null || _a === void 0 ? void 0 : _a.click();
                    }, 1);
                },
                cancelEditing() {
                    profileStore.cancelEdits();
                    setTimeout(() => {
                        var _a;
                        (_a = this.$refs['cancelTarget']) === null || _a === void 0 ? void 0 : _a.click();
                    }, 1);
                },
                saveEditing() {
                    if (!profileStore.editing.name)
                        return;
                    if (profileStore.profiles.some((p) => p.id !== profileStore.editing.id && p.name === profileStore.editing.name))
                        return;
                    profileStore.saveEdits();
                    setTimeout(() => {
                        var _a;
                        (_a = this.$refs['cancelTarget']) === null || _a === void 0 ? void 0 : _a.click();
                    }, 1);
                },
                enterToSaveEditing(e) {
                    if (e.code !== 'Enter')
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.saveEditing();
                    return false;
                },
                copyModList() {
                    copyToClipboard(modStore.loadOrder
                        .map((id) => {
                            const mod = modStore.mod(id);
                            let name = `UNKNOWN MOD: (${id})`;
                            if (mod.io)
                                name = mod.io.name;
                            else if (mod.local)
                                name = mod.local.name;
                            return `${name}${profileStore.isEnabled(id) ? '' : ` (${getLangString('MOD_MANAGER_DISABLED')})`}`;
                        })
                        .join('\n'));
                },
                setAsActive() {
                    return __awaiter(this, void 0, void 0, function*() {
                        profileStore.setNextActive(profileStore.selected);
                        yield playFabManager.persist();
                        window.location.reload();
                    });
                },
            };
        }

        function MyModsProfileListItem(props) {
            return {
                $template: template('my-mods-profile-list-item'),
                props,
                get isActive() {
                    var _a;
                    if (!this.props.profile)
                        return profileStore.active === null;
                    return ((_a = profileStore.active) === null || _a === void 0 ? void 0 : _a.id) === this.props.profile.id;
                },
                get isSelected() {
                    var _a;
                    if (!this.props.profile)
                        return profileStore.selected === null;
                    return ((_a = profileStore.selected) === null || _a === void 0 ? void 0 : _a.id) === this.props.profile.id;
                },
            };
        }

        function MyModsListView() {
            return {
                $template: template('my-mods-list-view'),
                MyModsListViewItem,
                get mods() {
                    const addedMods = new Set();
                    const mods = [];
                    for (const mod of modStore.loadOrder) {
                        addedMods.add(mod);
                        mods.push(mod);
                    }
                    for (const mod of modStore.subscribed) {
                        if (addedMods.has(mod))
                            continue;
                        addedMods.add(mod);
                        mods.push(mod);
                    }
                    if (profileStore.selected) {
                        for (const mod of profileStore.selected.mods) {
                            if (addedMods.has(mod))
                                continue;
                            addedMods.add(mod);
                            mods.push(mod);
                        }
                    }
                    return mods;
                },
            };
        }

        function MyModsListViewItem(props) {
            return {
                $template: template('my-mods-list-view-item'),
                props,
                get mod() {
                    return modStore.mod(this.props.modId);
                },
                get icon() {
                    let img = assets.getURI('assets/media/mods/placeholder_icon.png');
                    if (this.mod.local && this.mod.local.icon) {
                        try {
                            img = loader.getResourceUrl(this.mod.local, this.mod.local.icon);
                        } catch (_a) {
                            console.error(`[${this.mod.local.name}] The icon file "${this.mod.local.icon}" does not exist.`);
                        }
                    }
                    return img;
                },
                get name() {
                    var _a, _b, _c, _d, _e, _f;
                    return (_f = (_d = (_b = (_a = this.mod.local) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = this.mod.loaded) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : (_e = this.mod.io) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : `${this.mod.id}`;
                },
                get isSubscribed() {
                    return modStore.subscribed.includes(this.props.modId);
                },
                get isSubscribing() {
                    return taskStore.subscribeQueue.contains(this.mod.id);
                },
                get isAvailableForThisPlatform() {
                    if (this.mod.local)
                        return true;
                    if (this.mod.io)
                        return parser.isAvailableOnThisPlatform(this.mod.io.categorized_tags);
                    return false;
                },
                get isUpToDate() {
                    if (!this.mod.local)
                        return false;
                    if (!this.mod.io)
                        return true;
                    if (!modStore.isLatestPreferred(this.mod.id) || !this.mod.latest)
                        return this.mod.local.version === this.mod.io.modfile.version;
                    return this.mod.local.version === this.mod.latest.version;
                },
                get isDownloading() {
                    return taskStore.downloadQueue.contains(this.mod.id);
                },
                get isCurrentDownload() {
                    return taskStore.downloadQueue.peek === this.mod.id;
                },
                get downloadPercent() {
                    if (!this.isCurrentDownload)
                        return 0;
                    return Math.floor(modStore.currentDownload.bytesDownloaded / modStore.currentDownload.byteTotal);
                },
                get isInstalled() {
                    return this.mod.local !== null;
                },
                get isInstalling() {
                    return taskStore.installQueue.contains(this.mod.id);
                },
                get isCurrentInstall() {
                    return taskStore.installQueue.peek === this.mod.id;
                },
                get isUninstalling() {
                    return taskStore.unsubscribeQueue.contains(this.mod.id) || taskStore.uninstallQueue.contains(this.mod.id);
                },
                get isInLoadOrder() {
                    return modStore.loadOrder.includes(this.mod.id);
                },
                get isTopOfLoadOrder() {
                    return this.mod.id === modStore.loadOrder[0];
                },
                get isBottomOfLoadOrder() {
                    return this.mod.id === modStore.loadOrder[modStore.loadOrder.length - 1];
                },
                get isDisabled() {
                    if (!profileStore.selected)
                        return true;
                    return !profileStore.selected.mods.includes(this.props.modId);
                },
                get isForLatestGameVersion() {
                    return !this.mod.local || store.gameVersion === this.mod.local.tags.supportedGameVersion;
                },
                get supportedGameVersion() {
                    var _a, _b, _c, _d;
                    return ((_d = (_b = (_a = this.mod.local) === null || _a === void 0 ? void 0 : _a.tags.supportedGameVersion) !== null && _b !== void 0 ? _b : (_c = this.mod.io) === null || _c === void 0 ? void 0 : _c.categorized_tags.supportedGameVersion) !== null && _d !== void 0 ? _d : '-.-.-');
                },
            };
        }

        function DetailsPanel() {
            return {
                $template: template('details-panel'),
                activeImage: 0,
                showDescription: false,
                mod: null,
                isLoading: false,
                get name() {
                    var _a, _b, _c, _d;
                    if (!this.mod)
                        return '';
                    return (_d = (_b = (_a = this.mod.local) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = this.mod.io) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : '';
                },
                get version() {
                    var _a, _b, _c, _d, _e;
                    if (!this.mod)
                        return '';
                    return ((_e = (_b = (_a = this.mod.local) === null || _a === void 0 ? void 0 : _a.version) !== null && _b !== void 0 ? _b : (modStore.isLatestPreferred(this.mod.id) ?
                        (_c = modStore.mod(this.mod.id).latest) === null || _c === void 0 ? void 0 : _c.version :
                        (_d = this.mod.io) === null || _d === void 0 ? void 0 : _d.modfile.version)) !== null && _e !== void 0 ? _e : '...');
                },
                get updateVersion() {
                    var _a, _b, _c;
                    if (!this.mod)
                        return '';
                    return ((_c = (modStore.isLatestPreferred(this.mod.id) ?
                        (_a = modStore.mod(this.mod.id).latest) === null || _a === void 0 ? void 0 : _a.version :
                        (_b = this.mod.io) === null || _b === void 0 ? void 0 : _b.modfile.version)) !== null && _c !== void 0 ? _c : '');
                },
                get author() {
                    var _a, _b, _c, _d;
                    if (!this.mod)
                        return '';
                    return (_d = (_b = (_a = this.mod.local) === null || _a === void 0 ? void 0 : _a.author) !== null && _b !== void 0 ? _b : (_c = this.mod.io) === null || _c === void 0 ? void 0 : _c.submitted_by.username) !== null && _d !== void 0 ? _d : '';
                },
                get isDev() {
                    if (!this.mod)
                        return false;
                    return modStore.isDev(this.mod.id);
                },
                get rating() {
                    if (!this.mod)
                        return 0;
                    return modStore.rating(this.mod.id);
                },
                get totalRatings() {
                    if (!this.mod || !this.mod.io)
                        return 0;
                    return this.mod.io.stats.ratings_total;
                },
                get upvotes() {
                    if (!this.mod || !this.mod.io)
                        return '0';
                    return formatNumber(this.mod.io.stats.ratings_positive);
                },
                get downvotes() {
                    if (!this.mod || !this.mod.io)
                        return '0';
                    return formatNumber(this.mod.io.stats.ratings_negative);
                },
                get ratingPercent() {
                    if (!this.mod || !this.mod.io)
                        return '0';
                    return `${this.mod.io.stats.ratings_percentage_positive}%`;
                },
                get logo() {
                    if (!this.mod || !this.mod.io)
                        return assets.getURI('assets/media/mods/placeholder_thumbnail.png');
                    return this.mod.io.logo.thumb_640x360;
                },
                get gallery() {
                    if (!this.mod || !this.mod.io)
                        return [];
                    return this.mod.io.media.images.slice(0, 4);
                },
                get visibleImage() {
                    if (!this.gallery[this.activeImage])
                        return this.logo;
                    return this.gallery[this.activeImage].thumb_1280x720;
                },
                get isSubscribed() {
                    if (!this.mod)
                        return false;
                    return modStore.isSubscibed(this.mod.id);
                },
                get tags() {
                    var _a, _b, _c, _d;
                    if (!this.mod)
                        return {
                            platforms: [],
                            supportedGameVersion: '-.-.-',
                            types: [],
                        };
                    return ((_d = (_b = (_a = this.mod.io) === null || _a === void 0 ? void 0 : _a.categorized_tags) !== null && _b !== void 0 ? _b : (_c = this.mod.local) === null || _c === void 0 ? void 0 : _c.tags) !== null && _d !== void 0 ? _d : {
                        platforms: [],
                        supportedGameVersion: '-.-.-',
                        types: [],
                    });
                },
                get isAvailableForThisPlatform() {
                    if (!this.mod)
                        return true;
                    if (this.mod.local)
                        return parser.isAvailableOnThisPlatform(this.mod.local.tags);
                    if (this.mod.io)
                        return parser.isAvailableOnThisPlatform(this.mod.io.categorized_tags);
                    return true;
                },
                get summary() {
                    var _a, _b, _c, _d;
                    if (!this.mod)
                        return '';
                    return (_d = (_b = (_a = this.mod.io) === null || _a === void 0 ? void 0 : _a.summary) !== null && _b !== void 0 ? _b : (_c = this.mod.local) === null || _c === void 0 ? void 0 : _c.description) !== null && _d !== void 0 ? _d : '';
                },
                get description() {
                    if (!this.mod || !this.mod.io)
                        return '';
                    return this.mod.io.description;
                },
                get changelog() {
                    var _a, _b, _c;
                    if (!this.mod)
                        return [];
                    const changelog = (_b = (_a = this.mod.io) === null || _a === void 0 ? void 0 : _a.modfile.changelog) !== null && _b !== void 0 ? _b : (_c = this.mod.local) === null || _c === void 0 ? void 0 : _c.changelog;
                    if (!changelog)
                        return [];
                    return changelog.split('\n');
                },
                get isRating() {
                    if (!this.mod)
                        return false;
                    return taskStore.ratingQueue.contains(this.mod.id);
                },
                get isSubbing() {
                    if (!this.mod)
                        return false;
                    return (taskStore.subscribeQueue.contains(this.mod.id) ||
                        taskStore.downloadQueue.contains(this.mod.id) ||
                        taskStore.installQueue.contains(this.mod.id) ||
                        taskStore.unsubscribeQueue.contains(this.mod.id) ||
                        taskStore.uninstallQueue.contains(this.mod.id));
                },
                setMod(id) {
                    return __awaiter(this, void 0, void 0, function*() {
                        this.mod = id === null ? null : modStore.mod(id);
                        this.activeImage = 0;
                        this.showDescription = false;
                        if (!store.isLocalMode && id !== null && this.mod && this.mod.io === null) {
                            this.isLoading = true;
                            const ioMod = yield io.mods.get(id);
                            modStore.cacheIoMods([ioMod]);
                            this.isLoading = false;
                        }
                    });
                },
                openAuthorPage() {
                    if (!this.mod || !this.mod.io)
                        return;
                    openLink(this.mod.io.submitted_by.profile_url);
                },
                openModPage() {
                    if (!this.mod || !this.mod.io)
                        return;
                    openLink(this.mod.io.profile_url);
                },
                openReport() {
                    if (!this.mod)
                        return;
                    openLink(io.mods.reportUrl(this.mod.id));
                },
                openDescriptionLink(e) {
                    if (e.target instanceof HTMLAnchorElement) {
                        openLink(e.target.href);
                        e.preventDefault();
                        return false;
                    }
                },
                upvote() {
                    if (!this.mod)
                        return;
                    modStore.rate(this.mod.id, this.rating === 1 ? 0 : 1);
                },
                downvote() {
                    if (!this.mod)
                        return;
                    modStore.rate(this.mod.id, this.rating === -1 ? 0 : -1);
                },
                sub() {
                    if (!this.mod)
                        return;
                    if (modStore.isSubscibed(this.mod.id)) {
                        modStore.unsubscribeFrom(this.mod.id);
                        return;
                    }
                    modStore.subscribeTo(this.mod.id);
                },
            };
        }

        function PromptProfileMismatch(props) {
            return {
                $template: template('prompt-profile-mismatch'),
                PromptProfileMismatchItem,
                props,
                noModsText: getLangString('MOD_MANAGER_NO_MODS'),
                get canImportProfile() {
                    return profileStore.canCreateNew;
                },
            };
        }

        function PromptProfileMismatchItem(props) {
            return {
                $template: template('prompt-profile-mismatch-item'),
                props,
                get modCount() {
                    if (!props.profile)
                        return 0;
                    return props.profile.mods.length;
                },
                get headerClass() {
                    switch (props.type) {
                        case 'current':
                            return 'text-danger';
                        case 'previous':
                            return 'text-success';
                        case 'missing':
                            return 'text-warning';
                    }
                },
                get headerText() {
                    switch (props.type) {
                        case 'current':
                            return getLangString('MOD_MANAGER_CURRENTLY_ACTIVE');
                        case 'previous':
                            return getLangString('MOD_MANAGER_LAST_USED');
                        case 'missing':
                            return getLangString('MOD_MANAGER_LAST_USED_MISSING');
                    }
                },
                get actionText() {
                    switch (props.type) {
                        case 'current':
                            return '';
                        case 'previous':
                            return getLangString('MOD_MANAGER_REQUIRES_RELOAD');
                        case 'missing':
                            return getLangString('MOD_MANAGER_REQUIRES_IMPORT');
                    }
                },
                onClick() {
                    if (props.disabled)
                        return;
                    props.onClick();
                },
            };
        }

        function PromptProfileSwitch(props) {
            return {
                $template: template('prompt-profile-switch'),
                props,
                noModsText: getLangString('MOD_MANAGER_NO_MODS'),
                get modCount() {
                    if (!props.profile)
                        return 0;
                    return props.profile.mods.length;
                },
            };
        }
        //#endregion
        let initialized = false;
        let root = null;

        function init() {
            return __awaiter(this, void 0, void 0, function*() {
                if (initialized)
                    return;
                initialized = true;
                sidebar.category('Modding', {
                    before: 'General',
                    name: getLangString(`${i18nPage}_MODDING`),
                    nameClass: `page-nav-name-misc-modding`
                }, ({
                    item
                }) => {
                    item('Mod Manager', {
                        name: getLangString(`${i18nPage}_MOD_MANAGER`),
                        aside: cloudManager.hasFullVersionEntitlement ?
                            undefined :
                            createElement('i', {
                                className: 'fas fa-fw fa-lock text-danger'
                            }),
                        icon: createElement('i', {
                            className: 'fas fa-cubes text-success'
                        }),
                        onClick: () => mod.manager.open(),
                        nameClass: `page-nav-name-misc-mod-manager${cloudManager.hasFullVersionEntitlement ? '' : ' text-danger'}`,
                    });
                    item('Mod Settings', {
                        name: getLangString(`${i18nPage}_MOD_SETTINGS`),
                        rootClass: 'd-none',
                        icon: createElement('i', {
                            className: 'fas fa-cog text-dark'
                        }),
                        nameClass: `page-nav-name-misc-mod-settings`,
                    });
                });
                // Hide Mod Manager buttons on character select for demo
                if (!cloudManager.hasFullVersionEntitlement) {
                    document.querySelectorAll('.btn-mod-manager').forEach((e) => e.classList.add('d-none'));
                }
                if (!cloudManager.hasFullVersionEntitlement || !PlayFab.ClientApi.IsClientLoggedIn())
                    return;
                const {
                    modioEmail,
                    modioToken,
                    modManager
                } = yield playFabManager.retrieve([
                    'modioEmail',
                    'modioToken',
                    'modManager',
                ]);
                switch (modManager) {
                    case 'enabled':
                        store.status = ModdingStatus.Enabled;
                        break;
                    default:
                        store.status = ModdingStatus.Disabled;
                }
                if (store.status !== ModdingStatus.Enabled)
                    return;
                document
                    .querySelectorAll('.mod-manager-active-profile')
                    .forEach((e) => {
                        var _a;
                        return (_a = e.parentElement) === null || _a === void 0 ? void 0 : _a.classList.remove('d-none');
                    });
                loginStore.actions.restoreSession(modioEmail, modioToken);
                // User's credentials have expired
                if (loginStore.state.sessionRestored && !loginStore.getters.isLoggedIn()) {
                    yield promptForLogin(true);
                    // If user is still not logged in, run in local-only mode
                    if (!loginStore.getters.isLoggedIn()) {
                        yield promptForLocalMode();
                        if (store.isLocalMode) {
                            yield localModeInit();
                            if (store.didLocalModeSetup)
                                yield processAfterLogin();
                            return;
                        }
                    }
                }
                if (!loginStore.getters.isLoggedIn())
                    return;
                yield fullModeInit();
                if (store.didFullModeSetup)
                    yield processAfterLogin();
            });
        }

        function fullModeInit() {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    const alreadySetup = store.didFullModeSetup;
                    yield store.fullModeSetup();
                    // This is a really dumb way of doing this but I don't feel like refactoring more right now
                    if (!alreadySetup) {
                        io.on('unauthorized', () => {
                            loginStore.actions.logout();
                            promptForLogin(true);
                        });
                        loginStore.on('login', () => {
                            processAfterLogin();
                        });
                    }
                } catch (e) {
                    // Prompt user that mod.io service is down, can reload to try again
                    // or continue in local mode
                    yield promptForLocalMode(true);
                    if (store.isLocalMode) {
                        yield localModeInit();
                        if (store.didLocalModeSetup)
                            yield processAfterLogin();
                        return;
                    }
                }
            });
        }

        function localModeInit() {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield store.localModeSetup();
                } catch (e) {
                    const error = e instanceof Error ? e : new Error(getLangString('MOD_MANAGER_FATAL_ERROR'));
                    yield promptForReloadOnError(error);
                    return;
                }
            });
        }

        function processAfterLogin() {
            return __awaiter(this, void 0, void 0, function*() {
                try {
                    yield store.afterLogin();
                } catch (e) {
                    const error = e instanceof Error ? e : new Error(getLangString('MOD_MANAGER_FATAL_ERROR'));
                    yield promptForReloadOnError(error);
                    return;
                }
            });
        }

        function promptForLogin(expiredLogin = false) {
            return __awaiter(this, void 0, void 0, function*() {
                if (loginStore.getters.isLoggedIn())
                    return;
                const title = getLangString('MOD_MANAGER_SIGN_INTO_MODIO');
                const modioSignin = Swal.mixin({
                    iconHtml: `<img style="width:100%;" src="${assets.getURI('assets/media/mods/modio-color-small.png')}" />`,
                    title,
                    customClass: {
                        container: 'swal-infront',
                        icon: 'border-0 w-50',
                        input: 'text-muted',
                    },
                    showLoaderOnConfirm: true,
                });
                const {
                    isDismissed
                } = yield modioSignin.fire({
                    html: expiredLogin ?
                        createElement('div', {
                            children: [
                                createElement('p', {
                                    className: 'text-danger',
                                    text: getLangString('MOD_MANAGER_MOD_IO_SESSION_EXPIRED'),
                                }),
                                createElement('p', {
                                    className: 'mb-0',
                                    text: getLangString('MOD_MANAGER_ENTER_EMAIL'),
                                }),
                            ],
                        }) :
                        createElement('div', {
                            children: [
                                createElement('p', {
                                    text: getLangString('MOD_MANAGER_POWERED_BY_MODIO')
                                }),
                                createElement('p', {
                                    className: 'mb-0',
                                    text: getLangString('MOD_MANAGER_ENTER_EMAIL_2'),
                                }),
                            ],
                        }),
                    input: 'email',
                    inputValue: loginStore.state.email,
                    confirmButtonText: `${getLangString('MENU_TEXT_NEXT')} <i class="fas fa-fw fa-arrow-right opacity-50 ml-1"></i>`,
                    inputValidator: (value) => __awaiter(this, void 0, void 0, function*() {
                        try {
                            yield loginStore.actions.sendSecurityCode(value);
                            return null;
                        } catch (e) {
                            console.error(e);
                            if (e instanceof Error)
                                return e.message;
                            return getLangString('MOD_MANAGER_MOD_IO_FAILED_TO_RESPOND');
                        }
                    }),
                });
                if (isDismissed)
                    return;
                yield modioSignin.fire({
                    html: createElement('p', {
                        className: 'mb-0',
                        text: getLangString('MOD_MANAGER_ENTER_SECURITY_CODE'),
                    }),
                    input: 'text',
                    confirmButtonText: `<i class="fas fa-fw fa-sign-in-alt opacity-50 mr-1"></i> ${getLangString('CHARACTER_SELECT_6')}`,
                    inputValidator: (value) => __awaiter(this, void 0, void 0, function*() {
                        try {
                            yield loginStore.actions.loginUsingSecurityCode(value);
                            return null;
                        } catch (e) {
                            console.error(e);
                            if (e instanceof Error)
                                return e.message;
                            return getLangString('MOD_MANAGER_MOD_IO_FAILED_TO_RESPOND');
                        }
                    }),
                });
            });
        }

        function EnableBody() {
            const warnings = [
                ['mm__enable-check-2', getLangString('MOD_MANAGER_WARNING_POINT_2')],
                ['mm__enable-check-3', getLangString('MOD_MANAGER_WARNING_POINT_3')],
                ['mm__enable-check-4', getLangString('MOD_MANAGER_WARNING_POINT_4')],
            ];
            const checks = warnings.map((w) => EnableCheck(w[0], w[1]));
            const validation = createElement('span', {
                text: getLangString('MOD_MANAGER_MUST_AGREE'),
                className: 'font-size-sm text-danger d-none',
            });
            const el = createElement('div', {
                children: [
                    createElement('p', {
                        text: getLangString('MOD_MANAGER_USING_MODS_WARNING'),
                        className: 'font-size-sm text-warning',
                    }),
                    ...checks.map((c) => c.el),
                    validation,
                ],
            });

            function canSubmit() {
                const valid = checks.every((c) => c.isChecked());
                validation.classList.toggle('d-none', valid);
                return valid;
            }

            function reset() {
                checks.forEach((c) => c.reset());
                validation.classList.add('d-none');
            }
            return {
                el,
                canSubmit,
                reset,
            };
        }

        function EnableCheck(id, text) {
            const el = createElement('div', {
                className: 'bg-light rounded p-2 mb-2'
            });
            const formGroup = createElement('div', {
                className: 'form-check',
                parent: el
            });
            const checkbox = createElement('input', {
                id,
                className: 'form-check-input pointer-enabled',
                attributes: [
                    ['type', 'checkbox'],
                    ['name', id],
                ],
                parent: formGroup,
            });
            createElement('label', {
                text,
                className: 'form-check-label pointer-enabled font-size-sm text-left',
                attributes: [
                    ['for', id]
                ],
                parent: formGroup,
            });

            function isChecked() {
                return checkbox.checked;
            }

            function reset() {
                checkbox.checked = false;
            }
            return {
                el,
                isChecked,
                reset,
            };
        }
        let enableBody;

        function showPromptToEnable() {
            return __awaiter(this, void 0, void 0, function*() {
                if (!enableBody) {
                    enableBody = EnableBody();
                }
                const enable = yield SwalLocale.fire({
                    icon: 'warning',
                    title: getLangString('MOD_MANAGER_ENABLE_MOD_MANAGER_POPUP_TITLE'),
                    html: enableBody.el,
                    confirmButtonText: getLangString('MOD_MANAGER_ENABLE_MOD_MANAGER_BTN'),
                    showDenyButton: true,
                    denyButtonText: getLangString('CHARACTER_SELECT_45'),
                    preConfirm: () => enableBody.canSubmit(),
                    didClose: () => enableBody.reset(),
                });
                if (enable.isConfirmed) {
                    playFabManager.queueUpdate('modManager', 'enabled');
                    yield playFabManager.persist();
                    uiStore.triggerReload();
                    yield showPromptForReloadToEnable();
                }
                return enable.isConfirmed;
            });
        }

        function showPromptForReloadToEnable() {
            return __awaiter(this, void 0, void 0, function*() {
                const {
                    isConfirmed
                } = yield SwalLocale.fire({
                    title: getLangString(`${i18nPage}_RELOAD_REQUIRED`),
                    icon: 'warning',
                    text: getLangString('MOD_MANAGER_RELOAD_WARNING_0'),
                    showConfirmButton: true,
                    confirmButtonText: getLangString('MOD_MANAGER_RELOAD_WARNING_BTN_0'),
                    showCancelButton: true,
                    cancelButtonText: getLangString('MOD_MANAGER_RELOAD_WARNING_BTN_1'),
                });
                if (isConfirmed) {
                    yield playFabManager.persist();
                    window.location.reload();
                }
            });
        }

        function showPromptForReload(canDefer = true) {
            return __awaiter(this, void 0, void 0, function*() {
                const {
                    isConfirmed
                } = yield SwalLocale.fire({
                    title: getLangString(`${i18nPage}_RELOAD_REQUIRED`),
                    icon: 'warning',
                    text: getLangString('MOD_MANAGER_CHANGES_MADE_MSG'),
                    showConfirmButton: true,
                    confirmButtonText: canDefer ? getLangString('MOD_MANAGER_RELOAD_WARNING_BTN_0') : getLangString('RELOAD'),
                    showDenyButton: canDefer,
                    denyButtonText: getLangString('MOD_MANAGER_RELOAD_WARNING_BTN_1'),
                    willClose: () => __awaiter(this, void 0, void 0, function*() {
                        if (!canDefer) {
                            yield playFabManager.persist();
                            window.location.reload();
                        }
                    }),
                });
                if (isConfirmed) {
                    yield playFabManager.persist();
                    window.location.reload();
                }
            });
        }

        function showPromptForSwitchingProfiles() {
            return __awaiter(this, void 0, void 0, function*() {
                const html = document.createElement('div');
                vue.create(PromptProfileSwitch({
                    profile: profileStore.selected
                }), html);
                const reload = yield SwalLocale.fire({
                    title: getLangString('MOD_MANAGER_SWITCH_MOD_PROFILES_Q'),
                    icon: 'question',
                    html,
                    showConfirmButton: true,
                    confirmButtonText: getLangString('MOD_MANAGER_SWITCH_MOD_PROFILES_YES'),
                    showDenyButton: true,
                    denyButtonText: getLangString('NO'),
                });
                if (reload.isConfirmed) {
                    profileStore.setNextActive(profileStore.selected);
                    yield playFabManager.persist();
                    window.location.reload();
                    return true;
                } else {
                    profileStore.selected = profileStore.active;
                    return false;
                }
            });
        }

        function showPromptForProfileMismatch(profile) {
            return __awaiter(this, void 0, void 0, function*() {
                const profileExists = profile === null || profileStore.profiles.some((p) => p.id === profile.id);
                const html = document.createElement('div');
                html.classList.add('overflow-hidden');
                let activeClicked = false;
                vue.create(PromptProfileMismatch({
                    previousProfileExists: profileExists,
                    activeProfile: profileStore.active,
                    previousProfile: profile,
                    onClickActive() {
                        activeClicked = true;
                        Swal.close();
                    },
                    onClickPrevious() {
                        return __awaiter(this, void 0, void 0, function*() {
                            Swal.close();
                            if (profileExists) {
                                profileStore.setNextActive(profile === null ? null : profileStore.profile(profile.id));
                                yield playFabManager.persist();
                                window.location.reload();
                            } else {
                                open(true);
                                if (profileStore.importProfile(profile)) {
                                    profileStore.selected = profileStore.profile(profile.id);
                                }
                            }
                        });
                    },
                }), html);
                yield SwalLocale.fire({
                    title: getLangString('MOD_MANAGER_MOD_PROFILE_MISMATCH'),
                    icon: 'warning',
                    html,
                    showConfirmButton: false,
                    showDenyButton: true,
                    denyButtonText: getLangString('CHARACTER_SELECT_45'),
                    showCancelButton: false,
                });
                if (activeClicked)
                    return false;
                return true;
            });
        }

        function showPromptForProfileButNotLoggedIn() {
            return __awaiter(this, void 0, void 0, function*() {
                const {
                    isConfirmed
                } = yield SwalLocale.fire({
                    title: getLangString('MOD_MANAGER_MOD_PROFILE_MISMATCH'),
                    icon: 'warning',
                    text: getLangString('MOD_MANAGER_OPEN_MANAGER_ENABLE_MODDING'),
                    showConfirmButton: true,
                    confirmButtonText: getLangString('MOD_MANAGER_OPEN_MOD_MANAGER'),
                    showDenyButton: true,
                    denyButtonText: getLangString('MOD_MANAGER_CONTINUE_WITHOUT_MODS'),
                });
                if (isConfirmed) {
                    open();
                    return true;
                }
                return false;
            });
        }

        function showPromptForInProgress() {
            return __awaiter(this, void 0, void 0, function*() {
                const openPrompt = yield SwalLocale.fire({
                    title: getLangString('MOD_MANAGER_MOD_INSTALLATION_IN_PROGRESS'),
                    icon: 'warning',
                    text: getLangString('MOD_MANAGER_ALLOW_TO_FINISH'),
                    showConfirmButton: true,
                    confirmButtonText: getLangString('MOD_MANAGER_OPEN_MOD_MANAGER'),
                    showDenyButton: true,
                    denyButtonText: getLangString('CHARACTER_SELECT_45'),
                });
                if (openPrompt.isConfirmed)
                    open(true);
            });
        }

        function promptForLocalMode(fromModioFailure = false) {
            return __awaiter(this, void 0, void 0, function*() {
                const localModeText = createElement('span', {
                    className: 'font-weight-bold text-warning pointer-enabled',
                    children: [
                        getLangString('MOD_MANAGER_LOCAL_MODE'),
                        createElement('i', {
                            className: 'fas fa-question-circle ml-1'
                        }),
                    ],
                });
                const localModeMessage = createElement('span');
                localModeMessage.innerHTML = getLangString('MOD_MANAGER_USING_MODS_LOCAL_MOD_WARNING');
                const localModeDescription = createElement('p', {
                    className: 'font-size-sm bg-combat-dark rounded p-2 d-none',
                    attributes: [
                        ['style', 'margin-top:-1rem;']
                    ],
                    children: [localModeMessage],
                });
                localModeText.addEventListener('click', () => localModeDescription.classList.toggle('d-none'));
                const clearCachedCredsText = createElement('span', {
                    text: getLangString('MOD_MANAGER_CLEAR_MODIO_CREDENTIALS'),
                });
                const clearCachedCredsIcon = createElement('i', {
                    className: 'd-none fas fa-spinner fa-pulse ml-1',
                });
                const clearCachedCredsBtn = createElement('button', {
                    className: 'btn btn-info',
                    children: [clearCachedCredsText, clearCachedCredsIcon],
                });
                clearCachedCredsBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function*() {
                    clearCachedCredsBtn.disabled = true;
                    clearCachedCredsIcon.classList.remove('d-none');
                    localStorage.removeItem('modioToken');
                    PlayFab.ClientApi.UpdateUserData({
                        Data: {
                            modioToken: null
                        },
                    }, () => {
                        window.location.reload();
                    });
                }), {
                    once: true
                });
                const {
                    isConfirmed,
                    isDenied,
                    isDismissed
                } = yield SwalLocale.fire({
                    icon: 'warning',
                    title: fromModioFailure ?
                        getLangString('MOD_MANAGER_MOD_IO_UNREACHABLE') :
                        getLangString('MOD_MANAGER_ENABLE_MODS_LOCAL_MODE'),
                    html: createElement('div', {
                        children: [
                            fromModioFailure ?
                            createElement('p', {
                                children: [
                                    ...templateLangStringWithNodes('MOD_MANAGER_MODIO_CANNOT_BE_REACHED_INVALID_CREDENTIALS', {
                                        localModeHelpButton: localModeText
                                    }, {}),
                                ],
                            }) :
                            createElement('p', {
                                children: [
                                    ...templateLangStringWithNodes('MOD_MANAGER_OPTED_TO_NOT_SIGN_BACK_IN', {
                                        localModeHelpButton: localModeText
                                    }, {}),
                                ],
                            }),
                            localModeDescription,
                            clearCachedCredsBtn,
                        ],
                    }),
                    showConfirmButton: true,
                    confirmButtonText: fromModioFailure ?
                        getLangString('MOD_MANAGER_RELOAD_TO_TRY_AGAIN') :
                        getLangString('MOD_MANAGER_SIGN_INTO_MODIO_1'),
                    showDenyButton: true,
                    denyButtonText: getLangString('MOD_MANAGER_USE_LOCAL_MODE'),
                    showCancelButton: true,
                    cancelButtonText: getLangString('MOD_MANAGER_CONTINUE_WITHOUT_MODS'),
                });
                if (isConfirmed) {
                    if (fromModioFailure) {
                        window.location.reload();
                        return;
                    }
                    yield promptForLogin(true);
                    return;
                }
                if (isDenied)
                    store.mode = ModdingMode.Local;
                if (isDismissed && fromModioFailure)
                    store.unsetup();
            });
        }

        function promptForReloadOnError(error) {
            return __awaiter(this, void 0, void 0, function*() {
                const errorLog = createElement('textarea', {
                    className: 'form-control text-danger',
                    attributes: [
                        ['readonly', 'true'],
                        ['rows', '5'],
                    ],
                    children: [
                        `Error Name: ${error.name}\nError Message: ${error.message}\nStack Trace:\n${error.stack || 'Stack not available'}`,
                    ],
                });
                errorLog.addEventListener('click', () => errorLog.setSelectionRange(0, errorLog.value.length));
                const {
                    isConfirmed,
                    isDismissed
                } = yield SwalLocale.fire({
                    icon: 'error',
                    title: getLangString('MOD_MANAGER_FAILED_TO_LOAD'),
                    html: createElement('div', {
                        children: [
                            createElement('p', {
                                text: getLangString('MOD_MANAGER_FAILED_TO_INITIALIZE_NO_MODS_LOADED')
                            }),
                            createElement('div', {
                                className: 'input-group',
                                children: [errorLog],
                            }),
                        ],
                    }),
                    confirmButtonText: getLangString('MOD_MANAGER_RELOAD_TO_TRY_AGAIN'),
                    cancelButtonText: getLangString('MOD_MANAGER_CONTINUE_WITHOUT_MODS'),
                    showCancelButton: true,
                });
                if (isConfirmed)
                    window.location.reload();
                if (isDismissed)
                    store.unsetup();
            });
        }

        function open(openToMyMods, query) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!cloudManager.hasFullVersionEntitlement) {
                    nativeManager.buyFullGameSwal();
                    return;
                }
                if (!PlayFab.ClientApi.IsClientLoggedIn()) {
                    const {
                        isConfirmed
                    } = yield SwalLocale.fire({
                        icon: 'info',
                        title: getLangString('MOD_MANAGER_CLOUD_ACCOUNT_REQUIRED'),
                        text: getLangString('MOD_MANAGER_CREATE_OR_SIGN_IN'),
                        showConfirmButton: true,
                        confirmButtonText: getLangString('CHARACTER_SELECT_6'),
                        showDenyButton: true,
                        denyButtonText: getLangString('CHARACTER_SELECT_45'),
                    });
                    if (isConfirmed) {
                        window.location.href = 'index.php';
                    }
                    return;
                }
                if (store.status !== ModdingStatus.Enabled) {
                    if (uiStore.awaitingReload) {
                        showPromptForReloadToEnable();
                        return;
                    }
                    showPromptToEnable();
                    return;
                }
                if (!store.isLocalMode && !loginStore.getters.isLoggedIn()) {
                    yield promptForLogin();
                    if (loginStore.getters.isLoggedIn()) {
                        yield fullModeInit();
                        processAfterLogin();
                    } else
                        return;
                }
                const canPersist = 'storage' in navigator && 'persist' in navigator.storage;
                if (canPersist) {
                    if (nativeManager.isSteam || nativeManager.isEpicGames || nativeManager.isAndroid || nativeManager.isIOS) {
                        yield navigator.storage.persist();
                    } else if (!localStorage.getItem('hasPromptedPersistedStorage')) {
                        const isPersisted = yield navigator.storage.persisted();
                        if (!isPersisted) {
                            yield Swal.fire({
                                icon: 'info',
                                title: getLangString('MOD_MANAGER_PERSIST_STORAGE'),
                                text: getLangString('MOD_MANAGER_FOR_BEST_PERFORMANCE'),
                                customClass: {
                                    container: 'swal-infront',
                                },
                                confirmButtonText: getLangString('YES'),
                                showCancelButton: true,
                                cancelButtonText: getLangString('NO'),
                                preConfirm: () => __awaiter(this, void 0, void 0, function*() {
                                    yield navigator.storage.persist();
                                }),
                            });
                            localStorage.setItem('hasPromptedPersistedStorage', '1');
                        }
                    }
                }
                if (!root) {
                    root = createElement('div', {
                        className: 'h-100'
                    });
                    vue.create(Main(), root);
                    if (!store.isLocalMode) {
                        (() => __awaiter(this, void 0, void 0, function*() {
                            const mods = yield io.user.mods();
                            modStore.cacheIoMods(mods);
                            modStore.setDevMods(mods.map((m) => m.id));
                            const ratings = yield io.mods.getRatings();
                            modStore.setRatings(ratings);
                        }))();
                    }
                }
                uiStore.setActiveTab(openToMyMods ? 'my-mods' : 'browse');
                if (query) {
                    uiStore.searchQuery = query;
                    uiStore.search();
                }
                yield Swal.fire({
                    allowOutsideClick: false,
                    customClass: {
                        container: 'swal-infront',
                        popup: 'mm__popup',
                        htmlContainer: 'mm__container text-left mt-2 mb-0 mx-3',
                    },
                    html: root,
                    showConfirmButton: false,
                    showCloseButton: true,
                });
                if (profileStore.selected !== profileStore.active && (yield showPromptForSwitchingProfiles()))
                    return;
                if (uiStore.awaitingReload && !store.dependencyPrompts.length && loginStore.getters.isLoggedIn())
                    yield showPromptForReload();
            });
        }

        function openNextDependencyPrompt() {
            return __awaiter(this, void 0, void 0, function*() {
                if (!store.dependencyPrompts.length || store.dependencyPromptOpen)
                    return;
                store.dependencyPromptOpen = true;
                const prompt = store.dependencyPrompts.shift();
                if (!prompt) {
                    openNextDependencyPrompt();
                    return;
                }
                if (typeof prompt === 'string') {
                    yield open(false, prompt);
                } else {
                    const {
                        isConfirmed
                    } = yield SwalLocale.fire(prompt);
                    if (!isConfirmed && uiStore.awaitingReload)
                        yield showPromptForReload();
                }
                store.dependencyPromptOpen = false;
                openNextDependencyPrompt();
            });
        }
        return {
            init,
            open,
            showPromptForProfileMismatch,
            showPromptForProfileButNotLoggedIn,
            showPromptForReload,
            showPromptForInProgress,
            openNextDependencyPrompt,
        };
    })();
    // Method patching module
    const patcher = (() => {
        const blacklist = new Map([
            // Block entirety of classes with empty arrays
            ['SaveWriter', []],
            ['MelvorDatabase', []],
            ['NativeManager', []],
            ['CloudManager', []],
        ]);
        const patchMap = new Map();

        function patch(mod, className, methodOrPropertyName) {
            if (!className)
                throw new Error('A valid class must be specified to patch a method or getter/setter.');
            if (!(methodOrPropertyName in className.prototype))
                throw new Error(`No method or getter/setter "${String(methodOrPropertyName)}" was found on class ${className.name}`);
            if (isBlacklisted(className, methodOrPropertyName))
                throw new Error(`The method or getter/setter "${String(methodOrPropertyName)}" on class ${className.name} cannot be patched.`);
            if (!patchMap.has(className))
                patchMap.set(className, new Map());
            const patches = patchMap.get(className);
            if (!patches.has(methodOrPropertyName)) {
                let inheritanceChain = className.prototype;
                let desc = undefined;
                while (inheritanceChain && !desc) {
                    desc = Object.getOwnPropertyDescriptor(inheritanceChain, methodOrPropertyName);
                    inheritanceChain = inheritanceChain.__proto__;
                }
                if (!desc)
                    throw new Error(`No method or getter/setter "${String(methodOrPropertyName)}" was found on class ${className.name}`);
                const isGetterOrSetter = desc.get !== undefined || desc.set !== undefined;
                const isMethod = typeof desc.value === 'function';
                if (!isGetterOrSetter && !isMethod)
                    throw new Error(`No method or getter/setter "${String(methodOrPropertyName)}" was found on class ${className.name}`);
                const patcher = isGetterOrSetter ?
                    createPropertyPatcher(className, methodOrPropertyName) :
                    createMethodPatcher(className, methodOrPropertyName);
                patches.set(methodOrPropertyName, {
                    mods: new Set(),
                    patcher,
                });
            }
            const patch = patches.get(methodOrPropertyName);
            if (patch.mods.size !== 0) {
                const modNames = [];
                patch.mods.forEach((m) => {
                    if (m.name !== mod.name)
                        modNames.push(m.name);
                });
                if (modNames.length)
                    console.warn(`[${mod.name}] Possible mod conflict - ${className.name}.${String(methodOrPropertyName)} has already been patched by the following mods: ${modNames.map((n) => `"${n}"`).join(', ')}`);
            }
            patch.mods.add(mod);
            return patch.patcher;
        }

        function isPatched(className, methodName) {
            if (!className)
                throw new Error('A valid class must be specified to check if it is patched.');
            if (!(methodName in className.prototype))
                throw new Error(`No method or getter/setter ${String(methodName)} was found on class ${className.name}`);
            if (!patchMap.has(className))
                return false;
            return patchMap.get(className).has(methodName);
        }

        function createMethodPatcher(typeName, methodName) {
            const beforeHooks = [];
            const originalMethod = typeName.prototype[methodName];
            const overrides = [];
            const afterHooks = [];
            /**
             * @param {Function} hook
             */
            function before(hook) {
                if (typeof hook !== 'function') {
                    throw new Error('Expected hook to be of type function.');
                }
                beforeHooks.push(hook);
            }
            /**
             * @param {Function} override
             */
            function replace(override) {
                if (typeof override !== 'function') {
                    throw new Error('Expected override to be of type function.');
                }
                overrides.push(override);
            }
            /**
             * @param {Function} hook
             */
            function after(hook) {
                if (typeof hook !== 'function') {
                    throw new Error('Expected hook to be of type function.');
                }
                afterHooks.push(hook);
            }
            typeName.prototype[methodName] = function(...args) {
                for (const hook of beforeHooks) {
                    const newArgs = hook.apply(this, args);
                    if (Array.isArray(newArgs))
                        args = newArgs;
                }
                let returnValue = undefined;
                if (!overrides.length)
                    returnValue = originalMethod.apply(this, args);
                else {
                    let i = overrides.length - 1;
                    const next = (...nextArgs) => {
                        args = nextArgs;
                        i--;
                        if (i < 0)
                            return originalMethod.call(this, ...args);
                        return overrides[i].call(this, next, ...args);
                    };
                    returnValue = overrides[i].call(this, next, ...args);
                }
                for (const hook of afterHooks) {
                    const newReturn = hook.call(this, returnValue, ...args);
                    if (newReturn !== undefined)
                        returnValue = newReturn;
                }
                return returnValue;
            };
            return {
                before,
                replace,
                after,
            };
        }

        function createPropertyPatcher(typeName, propertyName) {
            let prototype = typeName.prototype;
            let propDesc = undefined;
            while (prototype && !propDesc) {
                propDesc = Object.getOwnPropertyDescriptor(prototype, propertyName);
                if (!propDesc)
                    prototype = prototype.__proto__;
            }
            const originalGetter = propDesc === null || propDesc === void 0 ? void 0 : propDesc.get;
            const getters = [];
            const originalSetter = propDesc === null || propDesc === void 0 ? void 0 : propDesc.set;
            const setters = [];
            Object.defineProperty(typeName.prototype, propertyName, {
                get() {
                    if (!originalGetter && !getters.length)
                        return undefined;
                    if (originalGetter && !getters.length)
                        return originalGetter.call(this);
                    let i = getters.length - 1;
                    const next = () => {
                        i--;
                        if (i < 0)
                            return originalGetter === null || originalGetter === void 0 ? void 0 : originalGetter.call(this);
                        return getters[i].call(this, next);
                    };
                    return getters[i].call(this, next);
                },
                set(value) {
                    if (!originalSetter && !setters.length)
                        return;
                    if (originalSetter && !setters.length)
                        return originalSetter.call(this, value);
                    let i = setters.length - 1;
                    const next = (v) => {
                        i--;
                        if (i < 0) {
                            originalSetter === null || originalSetter === void 0 ? void 0 : originalSetter.call(this, v);
                            return;
                        }
                        setters[i].call(this, next, v);
                    };
                    setters[i].call(this, next, value);
                },
                configurable: true,
            });
            return {
                get(getter) {
                    if (typeof getter !== 'function') {
                        throw new Error('Expected getter to be of type function.');
                    }
                    getters.push(getter);
                },
                set(setter) {
                    if (typeof setter !== 'function') {
                        throw new Error('Expected setter to be of type function.');
                    }
                    setters.push(setter);
                },
                replace(getter, setter) {
                    if (getter && typeof getter !== 'function') {
                        throw new Error('Expected getter to be of type function.');
                    }
                    if (setter && typeof setter !== 'function') {
                        throw new Error('Expected setter to be of type function.');
                    }
                    if (getter)
                        getters.push(getter);
                    if (setter)
                        setters.push(setter);
                },
            };
        }

        function isBlacklisted(typeName, methodName) {
            if (!blacklist.has(typeName.name))
                return false;
            const bl = blacklist.get(typeName.name);
            // All methods are blacklisted
            if (!bl.length)
                return true;
            return bl.some((m) => m === methodName);
        }
        return {
            patch,
            isPatched
        };
    })();
    // API that mods use to perform actions within their own context
    const contextApi = (() => {
        const loadedContexts = new Map();
        //#region Lifecycle Hooks
        let modsLoadedTriggered = false;
        const modsLoadedHooks = new Map();
        let characterSelectionLoadedTriggered = false;
        const characterSelectionLoadedHooks = new Map();
        let interfaceAvailableTriggered = false;
        const interfaceAvailableHooks = new Map();
        let characterLoadedTriggered = false;
        const characterLoadedHooks = new Map();
        let interfaceReadyTriggered = false;
        const interfaceReadyHooks = new Map();
        const creatorToolkitOpenHooks = new Map();

        function modsLoaded() {
            return __awaiter(this, void 0, void 0, function*() {
                if (modsLoadedTriggered)
                    return;
                modsLoadedTriggered = true;
                yield lifecycle(modsLoadedHooks);
            });
        }

        function characterSelectionLoaded() {
            return __awaiter(this, void 0, void 0, function*() {
                if (characterSelectionLoadedTriggered)
                    return;
                characterSelectionLoadedTriggered = true;
                yield lifecycle(characterSelectionLoadedHooks);
                ui.openNextDependencyPrompt();
            });
        }

        function interfaceAvailable() {
            return __awaiter(this, void 0, void 0, function*() {
                if (interfaceAvailableTriggered)
                    return;
                interfaceAvailableTriggered = true;
                yield lifecycle(interfaceAvailableHooks);
            });
        }

        function characterLoaded() {
            return __awaiter(this, void 0, void 0, function*() {
                if (characterLoadedTriggered)
                    return;
                characterLoadedTriggered = true;
                characterStorageContextApi.unlock();
                yield lifecycle(characterLoadedHooks);
            });
        }

        function interfaceReady() {
            return __awaiter(this, void 0, void 0, function*() {
                if (interfaceReadyTriggered)
                    return;
                interfaceReadyTriggered = true;
                settingsContextApi.renderSidebar();
                yield lifecycle(interfaceReadyHooks);
            });
        }

        function creatorToolkitOpen() {
            return __awaiter(this, void 0, void 0, function*() {
                yield lifecycle(creatorToolkitOpenHooks);
            });
        }

        function lifecycle(hooks) {
            return __awaiter(this, void 0, void 0, function*() {
                for (const mod of modStore.loadedMods) {
                    if (!doesContextExist(mod))
                        continue;
                    const ctx = getOrCreateContext(mod);
                    const modHooks = hooks.get(mod.id);
                    if (!modHooks)
                        continue;
                    for (const cb of modHooks) {
                        try {
                            yield cb(ctx);
                        } catch (e) {
                            console.error(`[${mod.name}]`, e);
                        }
                    }
                }
            });
        }
        //#endregion
        /**
         * Checks if a given mod has had a context object created.
         * @param mod Mod to check for a context object existing.
         */
        function doesContextExist(mod) {
            return loadedContexts.has(mod.id);
        }
        /**
         * Gets or creates a modding context for the given mod.
         * @param mod Mod to create the mod context object for.
         */
        function getOrCreateContext(mod) {
            if (!mod)
                throw new Error('A mod must be supplied to get a context.');
            if (!doesContextExist(mod)) {
                if (mod.id === creatorToolkitId)
                    loadedContexts.set(mod.id, createToolkitContext(mod));
                else
                    loadedContexts.set(mod.id, createContext(mod));
            }
            return loadedContexts.get(mod.id);
        }
        /**
         * Gets or creates a modding context for the given reference point.
         * @param namespaceOrResource Either a namespace (string) or resource (script or module import) to link back to a mod.
         */
        function getContext(namespaceOrResource) {
            if (typeof namespaceOrResource === 'string') {
                return getContextFromNamespace(namespaceOrResource);
            }
            return getContextFromResource(namespaceOrResource);
        }
        /**
         * Gets or creates a modding context for the given namespace's mod.
         * @param namespace Namespace to get the mod context for.
         */
        function getContextFromNamespace(namespace) {
            const mod = modStore.loadedModByNamespace(namespace);
            if (!mod || mod.id === creatorToolkitId)
                throw new Error(`"${namespace}" is not a loaded mod's namespace. The namespace must be defined in the mod's manifest.json in order to use it.`);
            return getOrCreateContext(mod);
        }
        /**
         * Gets or creates a modding context for the given resource's mod.
         * @param resource The `<script>` or imported module to get the mod context for.
         */
        function getContextFromResource(resource) {
            let mod;
            // Called from loaded <script> using document.currentScript
            if (resource instanceof HTMLScriptElement) {
                mod = loader.getModFromResourceUrl(resource.src);
            }
            // Called from loaded module using import.meta
            else if (resource && resource.url) {
                mod = loader.getModFromResourceUrl(resource.url);
            }
            if (!mod)
                throw new Error('No mod context is associated with this resource or invalid use of mod.getContext. If calling from a module, pass in import.meta as the parameter. If calling from a script, pass document.currentScript as the parameter.');
            return getOrCreateContext(mod);
        }
        /**
         * Parses the exception from a try catch block and returns basic information about mods that may have caused the error
         * @param error The exception returned from a try catch block
         * @returns An object containing information on if the error was due to mods
         */
        function getModErrorFromError(error) {
            const basicModInfo = [];
            let stack = 'Stack not available';
            if (error instanceof Error && error.stack !== undefined) {
                const modResources = new Map();
                stack = error.stack;
                const regexp = new RegExp(`blob:${escapeRegExp(location.origin)}\\/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}`, 'g');
                const matches = error.stack.match(regexp);
                if (matches !== null) {
                    matches.forEach((match) => {
                        const modURL = loader.getModUrlFromResourceUrl(match);
                        if (modURL !== undefined) {
                            let resourceURLs = modResources.get(modURL.mod);
                            if (resourceURLs === undefined) {
                                resourceURLs = new Set();
                                modResources.set(modURL.mod, resourceURLs);
                            }
                            if (!resourceURLs.has(modURL.resource)) {
                                resourceURLs.add(modURL.resource);
                                stack = stack.replace(new RegExp(escapeRegExp(match), 'g'), `${modURL.mod.name}:${modURL.resource}`);
                            }
                        }
                    });
                }
                modResources.forEach((resources, mod) => {
                    basicModInfo.push({
                        id: mod.id,
                        name: mod.name,
                        version: mod.version,
                    });
                });
            }
            return {
                mods: basicModInfo,
                stack,
            };
        }
        // Dummy mod for mod development purposes
        const devMod = {
            id: 0,
            version: '0.0.0',
            name: 'Dev',
            description: '',
            namespace: 'dev',
            author: 'Melvor Idle',
            resources: {},
            tags: {
                platforms: [],
                supportedGameVersion: '',
                types: []
            },
            modioUrl: '',
            homepageUrl: '',
            dependencies: [],
        };
        /**
         * Gets or creates a dummy mod context for mod development purposes.
         */
        function getDevContext() {
            if (!modStore.loaded.includes(devMod.id)) {
                modStore.cacheLocalMods([devMod]);
                modStore.cacheLoadedMods([devMod]);
                modStore.loaded.push(devMod.id);
            }
            return getOrCreateContext(devMod);
        }
        /**
         * Entry point for scripts for the context API.
         * @param setup The callback function to receive the context object and perform mod setup.
         */
        function register(setup) {
            return __awaiter(this, void 0, void 0, function*() {
                if (!document.currentScript || document.currentScript instanceof SVGScriptElement)
                    throw new Error('Invalid use of mod.register. It may only be called from within a script loaded by the Mod Manager.');
                const mod = loader.getModFromResourceUrl(document.currentScript.src);
                if (!mod)
                    throw new Error('Invalid use of mod.register. It may only be called from within a script loaded by the Mod Manager.');
                return yield runSetup(mod, setup);
            });
        }
        /**
         * Entrypoing for modules for the context API.
         * @param mod The mod being registered.
         * @param setup The callback function to receive the context object and perform mod setup.
         */
        function runSetup(mod, setup) {
            return __awaiter(this, void 0, void 0, function*() {
                if (typeof setup !== 'function')
                    throw new Error(`[${mod.name}] You must supply a callback function to receive the context object when registering a mod.`);
                const ctx = getOrCreateContext(mod);
                const retVal = yield setup(ctx);
                return retVal;
            });
        }

        function createToolkitContext(mod) {
            const ctx = createContext(mod);
            return Object.assign(Object.assign({}, ctx), {
                isAuthenticated: io.user.isLoggedIn,
                request: io.auth.authenticatedReq,
                binaryPost: io.auth.authenticatedBinaryPost,
                zip: packager.zip,
                parse: parser.parse,
                parseLocal: parser.parseLocal,
                getModResourceUrl: loader.getResourceUrl,
                load(mod) {
                    return __awaiter(this, void 0, void 0, function*() {
                        try {
                            modStore.cacheLocalMods([mod]);
                            modStore.cacheLoadedMods([mod]);
                            modStore.loaded.push(mod.id);
                            yield loader.load(mod);
                        } catch (e) {
                            modStore.loaded.pop();
                            throw e;
                        }
                    });
                },
                onOpen(callback) {
                    let hooks = creatorToolkitOpenHooks.get(mod.id);
                    if (!hooks) {
                        hooks = [];
                        creatorToolkitOpenHooks.set(mod.id, hooks);
                    }
                    hooks.push(callback);
                },
                db: db.localMods
            });
        }
        /**
         * Create a context object for the given mod.
         * @param mod Mod that the context will belong to.
         */
        function createContext(mod) {
            let ns = undefined;
            if (mod.namespace) {
                ns = game.registeredNamespaces.registerNamespace(mod.namespace, mod.name, true);
            }
            const gameDataContext = gameDataContextApi.createContext(mod, ns);
            const characterStorageContext = characterStorageContextApi.createContext(mod);
            const accountStorageContext = accountStorageContextApi.createContext(mod);
            const settingsContext = settingsContextApi.createContext(mod, ns);
            const sharingContext = assetSharingContextApi.createContext(mod, ns);
            //#region Resources
            /**
             * Gets a Blob for mod resources. Used for special cases where the Blob is needed directly.
             * @param resourcePath Path to the resource
             */
            function getResourceBlob(resourcePath) {
                return loader.getResourceBlob(mod, resourcePath);
            }
            /**
             * Gets a URL for mod resources. Mainly for use with images.
             * @param resourcePath Path to the resource.
             */
            function getResourceUrl(resourcePath) {
                return loader.getResourceUrl(mod, resourcePath);
            }

            function loadTemplates(resourcePath) {
                return __awaiter(this, void 0, void 0, function*() {
                    yield loader.loadTemplates(mod, resourcePath);
                });
            }
            /**
             * Retrieve a stylesheet and inject it into the page.
             * @param resourcePath Path to the stylesheet to load.
             */
            function loadStylesheet(resourcePath) {
                loader.loadStylesheet(mod, resourcePath);
            }
            /**
             * Retrieve a script and inject it into the page.
             * @param resourcePath Path to the script to load.
             */
            function loadScript(resourcePath) {
                return __awaiter(this, void 0, void 0, function*() {
                    yield loader.loadScript(mod, resourcePath);
                });
            }
            /**
             * Imports a module.
             * @param resourcePath Path to the module to load.
             */
            function loadModule(resourcePath) {
                return __awaiter(this, void 0, void 0, function*() {
                    return yield loader.loadModule(mod, resourcePath);
                });
            }
            /**
             * Load a JSON file as a JavaScript object.
             * @param resourcePath Path to the data to load.
             */
            function loadData(resourcePath) {
                return __awaiter(this, void 0, void 0, function*() {
                    return yield loader.loadJson(mod, resourcePath);
                });
            }
            //#endregion
            //#region Lifecycle Hooks
            /**
             * Registers a callback to be called after all mods have been loaded
             * @param callback Callback to be exeucted.
             */
            function onModsLoaded(callback) {
                if (typeof callback !== 'function')
                    throw new Error(`[${mod.name}] Hook onModsLoaded requires a callback.`);
                let hooks = modsLoadedHooks.get(mod.id);
                if (!hooks) {
                    hooks = [];
                    modsLoadedHooks.set(mod.id, hooks);
                }
                hooks.push(callback);
            }
            /**
             * Registers a callback to be called after the game has been loaded
             * @param callback Callback to be exeucted.
             */
            function onCharacterSelectionLoaded(callback) {
                if (typeof callback !== 'function')
                    throw new Error(`[${mod.name}] Hook onCharacterSelectionLoaded requires a callback.`);
                let hooks = characterSelectionLoadedHooks.get(mod.id);
                if (!hooks) {
                    hooks = [];
                    characterSelectionLoadedHooks.set(mod.id, hooks);
                }
                hooks.push(callback);
            }
            /**
             * Registers a callback to be called after the game's initial interface has been loaded
             * @param callback Callback to be exeucted.
             */
            function onInterfaceAvailable(callback) {
                if (typeof callback !== 'function')
                    throw new Error(`[${mod.name}] Hook onInterfaceAvailable requires a callback.`);
                let hooks = interfaceAvailableHooks.get(mod.id);
                if (!hooks) {
                    hooks = [];
                    interfaceAvailableHooks.set(mod.id, hooks);
                }
                hooks.push(callback);
            }
            /**
             * Registers a callback to be called after the game has been loaded
             * @param callback Callback to be exeucted.
             */
            function onCharacterLoaded(callback) {
                if (typeof callback !== 'function')
                    throw new Error(`[${mod.name}] Hook onCharacterLoaded requires a callback.`);
                let hooks = characterLoadedHooks.get(mod.id);
                if (!hooks) {
                    hooks = [];
                    characterLoadedHooks.set(mod.id, hooks);
                }
                hooks.push(callback);
            }
            /**
             * Registers a callback to be called after the game has been loaded
             * @param callback Callback to be exeucted.
             */
            function onInterfaceReady(callback) {
                if (typeof callback !== 'function')
                    throw new Error(`[${mod.name}] Hook onInterfaceReady requires a callback.`);
                let hooks = interfaceReadyHooks.get(mod.id);
                if (!hooks) {
                    hooks = [];
                    interfaceReadyHooks.set(mod.id, hooks);
                }
                hooks.push(callback);
            }
            //#endregion
            /**
             * Define API endpoints for other mods to interact with.
             */
            function api(endpoints) {
                if (!ns)
                    throw NamespaceError(mod, 'api');
                if (typeof endpoints === 'object')
                    modApis[ns.name] = Object.assign(Object.assign({}, modApis[ns.name]), endpoints);
                else if (typeof endpoints !== 'undefined')
                    throw new Error(`[${mod.name}] Invalid use of api. Parameter endpoints must be of type object.`);
                return modApis[ns.name];
            }
            /**
             * Alias for `patcher.patch`.
             * @param _class Class to patch.
             * @param methodName Method name to patch.
             */
            function patch(_class, methodName) {
                return patcher.patch(mod, _class, methodName);
            }
            /**
             * Alias for `patcher.isPatched`.
             * @param _class Class to check for patching.
             * @param methodName Method name to check for patching.
             */
            function isPatched(_class, methodName) {
                return patcher.isPatched(_class, methodName);
            }
            return {
                get name() {
                    return mod.name;
                },
                get namespace() {
                    return mod.namespace;
                },
                get namespaceData() {
                    return ns;
                },
                get version() {
                    return mod.version;
                },
                gameData: gameDataContext,
                characterStorage: characterStorageContext,
                accountStorage: accountStorageContext,
                settings: settingsContext,
                getResourceBlob,
                getResourceUrl,
                loadTemplates,
                loadStylesheet,
                loadScript,
                loadModule,
                loadData,
                onModsLoaded,
                onCharacterSelectionLoaded,
                onInterfaceAvailable,
                onCharacterLoaded,
                onInterfaceReady,
                share: sharingContext.share,
                api,
                patch,
                isPatched,
            };
        }
        return {
            register,
            runSetup,
            hasModsLoadedTriggered: () => modsLoadedTriggered,
            hasCharacterSelectionLoadedTriggered: () => characterSelectionLoadedTriggered,
            hasCharacterLoadedTriggered: () => characterLoadedTriggered,
            hasInterfaceReadyTriggered: () => interfaceReadyTriggered,
            trigger: {
                modsLoaded,
                characterSelectionLoaded,
                interfaceAvailable,
                characterLoaded,
                interfaceReady,
                creatorToolkitOpen,
            },
            getContext,
            getDevContext,
            getModErrorFromError,
        };
    })();
    const assetSharingContextApi = (() => {
        const sharedAssets = new Map();

        function createContext(mod, ns) {
            if (!ns) {
                return {
                    share: () => {
                        throw NamespaceError(mod, 'share');
                    },
                };
            }

            function share(resourcePath) {
                if (!mod.resources[resourcePath])
                    throw new Error(`[${mod.name}] Cannot share asset "${resourcePath}" as it does not exist.`);
                if (!sharedAssets.has(ns.name))
                    sharedAssets.set(ns.name, new Set());
                sharedAssets.get(ns.name).add(resourcePath);
            }
            return {
                share,
            };
        }

        function isShared(namespace, asset) {
            if (!sharedAssets.has(namespace))
                return false;
            return sharedAssets.get(namespace).has(asset);
        }
        return {
            createContext,
            isShared,
        };
    })();
    /** API for registering and modifying game data */
    const gameDataContextApi = (() => {
        function createContext(mod, ns) {
            if (!ns)
                return {
                    addPackage: () => {
                        throw NamespaceError(mod, 'gameData.addPackage');
                    },
                    buildPackage: () => {
                        throw NamespaceError(mod, 'gameData.buildPackage');
                    },
                };
            /**
             * Register a game package by filename or GameDataPackage
             */
            function addPackage(data) {
                return __awaiter(this, void 0, void 0, function*() {
                    if (typeof data === 'string')
                        data = yield loader.loadJson(mod, data);
                    data.namespace = ns.name;
                    try {
                        game.registerDataPackage(data);
                    } catch (e) {
                        throw new Error(`[${mod.name}] ${e instanceof Error ? e.message : e}`);
                    }
                });
            }
            /**
             * Programmatically build a package to be registered.
             */
            function buildPackage(builder) {
                const pkg = PackageBuilder(ns, builder);
                return {
                    package: pkg,
                    add: () => addPackage(pkg),
                };
            }
            return {
                addPackage,
                buildPackage,
            };
        }
        /**
         * @param ns
         * @param builder
         */
        function PackageBuilder(ns, builder) {
            const pkg = {
                $schema: '../schema/gameData.json',
                namespace: ns.name,
                data: {}
            };
            /**
             * @param key
             * @param data
             */
            function addData(key, data) {
                if (key === 'golbinRaid') {
                    pkg.data[key] = data;
                } else {
                    if (!pkg.data[key])
                        pkg.data[key] = [];
                    pkg.data[key].push(data);
                }
            }

            function modifyData(key, data) {
                if (!pkg.modifications)
                    pkg.modifications = {};
                if (!pkg.modifications[key])
                    pkg.modifications[key] = [];
                pkg.modifications[key].push(data);
            }
            builder({
                ancientRelics: {
                    add: (data) => addData('ancientRelics', data),
                },
                ancientRelicsDisplayOrder: {
                    add: (data) => addData('ancientRelicsDisplayOrder', data),
                },
                ancientSpells: {
                    add: (data) => addData('ancientSpells', data),
                },
                archaicSpells: {
                    add: (data) => addData('archaicSpells', data),
                },
                attacks: {
                    add: (data) => addData('attacks', data),
                },
                attackStyles: {
                    add: (data) => addData('attackStyles', data),
                },
                auroraSpells: {
                    add: (data) => addData('auroraSpells', data),
                },
                bankSortOrder: {
                    add: (data) => addData('bankSortOrder', data),
                },
                combatAreas: {
                    add: (data) => addData('combatAreas', data),
                    modify: (data) => addData('combatAreas', data),
                },
                combatAreaDisplayOrder: {
                    add: (data) => addData('combatAreaDisplayOrder', data),
                },
                combatEvents: {
                    add: (data) => addData('combatEvents', data),
                },
                combatPassives: {
                    add: (data) => addData('combatPassives', data),
                },
                cookingCategories: {
                    modify: (data) => modifyData('cookingCategories', data),
                },
                curseSpells: {
                    add: (data) => addData('curseSpells', data),
                },
                damageTypes: {
                    add: (data) => addData('damageTypes', data),
                    modify: (data) => modifyData('damageTypes', data),
                },
                dungeons: {
                    add: (data) => addData('dungeons', data),
                    modify: (data) => modifyData('dungeons', data),
                },
                dungeonDisplayOrder: {
                    add: (data) => addData('dungeonDisplayOrder', data),
                },
                fletchingRecipes: {
                    modify: (data) => modifyData('fletchingRecipes', data),
                },
                gamemodes: {
                    add: (data) => addData('gamemodes', data),
                    modify: (data) => modifyData('gamemodes', data),
                },
                golbinRaid: {
                    add: (data) => addData('golbinRaid', data),
                },
                items: {
                    add: (data) => addData('items', data),
                    modify: (data) => modifyData('items', data),
                },
                itemSynergies: {
                    add: (data) => addData('itemSynergies', data),
                },
                itemUpgrades: {
                    add: (data) => addData('itemUpgrades', data),
                    modify: (data) => modifyData('itemUpgrades', data),
                },
                lore: {
                    add: (data) => addData('lore', data),
                },
                monsters: {
                    add: (data) => addData('monsters', data),
                    modify: (data) => modifyData('monsters', data),
                },
                pages: {
                    add: (data) => addData('pages', data),
                    modify: (data) => modifyData('pages', data),
                },
                pets: {
                    add: (data) => addData('pets', data),
                    modify: (data) => modifyData('pets', data),
                },
                prayers: {
                    add: (data) => addData('prayers', data),
                },
                randomGems: {
                    add: (data) => addData('randomGems', data),
                },
                randomAbyssalGems: {
                    add: (data) => addData('randomAbyssalGems', data),
                },
                randomFragments: {
                    add: (data) => addData('randomFragments', data),
                },
                randomFiremakingOils: {
                    add: (data) => addData('randomFiremakingOils', data),
                },
                randomSuperiorGems: {
                    add: (data) => addData('randomSuperiorGems', data),
                },
                realms: {
                    add: (data) => addData('realms', data),
                },
                shopCategories: {
                    add: (data) => addData('shopCategories', data),
                },
                shopCategoryOrder: {
                    add: (data) => addData('shopCategoryOrder', data),
                },
                shopPurchases: {
                    add: (data) => addData('shopPurchases', data),
                    modify: (data) => modifyData('shopPurchases', data),
                },
                shopDisplayOrder: {
                    add: (data) => addData('shopDisplayOrder', data),
                },
                shopUpgradeChains: {
                    add: (data) => addData('shopUpgradeChains', data),
                    modify: (data) => modifyData('shopUpgradeChains', data),
                },
                skillLevelCapIncreases: {
                    add: (data) => addData('skillLevelCapIncreases', data),
                    modify: (data) => modifyData('skillLevelCapIncreases', data),
                },
                skills: {
                    add: (_class) => game.registerSkill(ns, _class),
                },
                skillData: {
                    add: (data) => addData('skillData', data),
                    modify: (data) => modifyData('skillData', data),
                },
                skillTreesDisplayOrder: {
                    add: (data) => addData('skillTreesDisplayOrder', data),
                },
                slayerAreas: {
                    add: (data) => addData('slayerAreas', data),
                    modify: (data) => modifyData('slayerAreas', data),
                },
                slayerAreaDisplayOrder: {
                    add: (data) => addData('slayerAreaDisplayOrder', data),
                },
                itmMonsters: {
                    add: (data) => addData('itmMonsters', data),
                },
                spiderLairMonsters: {
                    add: (data) => addData('spiderLairMonsters', data),
                },
                standardSpells: {
                    add: (data) => addData('standardSpells', data),
                },
                steamAchievements: {
                    add: (_data) => console.error('Hah, no.'),
                },
                abyssDepths: {
                    add: (data) => addData('abyssDepths', data),
                    modify: (data) => modifyData('abyssDepths', data),
                },
                tutorialStages: {
                    add: (data) => addData('tutorialStages', data),
                },
                tutorialStageOrder: {
                    add: (data) => addData('tutorialStageOrder', data),
                },
                combatTriangleSets: {
                    add: (data) => addData('combatTriangleSets', data),
                },
                combatEffectGroups: {
                    add: (data) => addData('combatEffectGroups', data),
                },
                combatEffectTemplates: {
                    add: (data) => addData('combatEffectTemplates', data),
                },
                combatEffects: {
                    add: (data) => addData('combatEffects', data),
                },
                combatEffectTables: {
                    add: (data) => addData('combatEffectTables', data),
                },
                slayerTaskCategories: {
                    add: (data) => addData('slayerTaskCategories', data),
                },
                equipmentSlots: {
                    add: (data) => addData('equipmentSlots', data),
                    modify: (data) => modifyData('equipmentSlots', data),
                },
                strongholds: {
                    add: (data) => addData('strongholds', data),
                },
                combatAreaCategories: {
                    add: (data) => addData('combatAreaCategories', data),
                    modify: (data) => modifyData('combatAreaCategories', data),
                },
                combatAreaCategoryOrder: {
                    add: (data) => addData('combatAreaCategoryOrder', data),
                },
                modifiers: {
                    add: (data) => addData('modifiers', data),
                    modify: (data) => modifyData('modifiers', data),
                },
                attackSpellbooks: {
                    add: (data) => addData('attackSpellbooks', data),
                },
                attackSpells: {
                    add: (data) => addData('attackSpells', data),
                },
            });
            return pkg;
        }
        return {
            createContext,
        };
    })();
    // Character-level data persistence submodule of context API
    const characterStorageContextApi = (() => {
        const MAX_CHARACTER_STORAGE = Math.pow(2, 13);
        // Unlocked only upon characterLoaded trigger
        let unlocked = false;
        const characterStorage = new Map();
        /**
         * Create a new character storage context.
         * @param mod The mod that the context belongs to.
         */
        function createContext(mod) {
            /**
             * Calculates the number of bytes currently being used by this mod's character storage
             * @param ignoreKey
             * @returns Total bytes of character storage
             */
            function getCurrentStorage(ignoreKey) {
                if (!characterStorage.has(mod.id))
                    return 0;
                const modData = characterStorage.get(mod.id);
                const totalDataSize = Array.from(modData).reduce((total, [k, v]) => {
                    if (k === ignoreKey)
                        return total;
                    return total + k.length + v.length;
                }, 0);
                return totalDataSize;
            }
            /**
             * Save a key/value pair to the current character
             * @param key
             * @param data
             */
            function setItem(key, data) {
                if (data === undefined)
                    return removeItem(key);
                if (!unlocked)
                    throw LockedError(mod);
                if (typeof key !== 'string')
                    throw new Error(`[${mod.name}] Data key is expected to be of type 'string'.`);
                const storedValue = JSON.stringify(data);
                const thisSize = key.length + storedValue.length;
                if (!characterStorage.has(mod.id))
                    characterStorage.set(mod.id, new Map());
                const modData = characterStorage.get(mod.id);
                const totalDataSize = getCurrentStorage(key);
                const percentFull = Math.floor(((totalDataSize + thisSize) / MAX_CHARACTER_STORAGE) * 100);
                if (percentFull >= 100) {
                    throw new Error(`[${mod.name}] Cannot add ${formatNumber(thisSize)} bytes of data to characterStorage. Total character storage for this mod would exceed the limit of ${formatNumber(MAX_CHARACTER_STORAGE)} bytes.`);
                } else if (percentFull > 75) {
                    console.warn(`[${mod.name}] Nearing total character storage limt. Currently using ${formatNumber(totalDataSize + thisSize)} (${percentFull}%) of ${formatNumber(MAX_CHARACTER_STORAGE)} bytes.`);
                }
                modData.set(key, storedValue);
            }
            /**
             * Retrieve data saved to the character by key
             * @param key
             */
            function getItem(key) {
                if (!unlocked)
                    throw LockedError(mod);
                if (!characterStorage.has(mod.id))
                    return undefined;
                if (!characterStorage.get(mod.id).has(key))
                    return undefined;
                return JSON.parse(characterStorage.get(mod.id).get(key));
            }
            /**
             * Deletes data saved to the character by key
             * @param key
             */
            function removeItem(key) {
                if (!unlocked)
                    throw LockedError(mod);
                if (!characterStorage.has(mod.id))
                    return;
                characterStorage.get(mod.id).delete(key);
            }
            /**
             * Clears all data saved to the character
             */
            function clear() {
                if (!unlocked)
                    throw LockedError(mod);
                if (!characterStorage.has(mod.id))
                    return;
                characterStorage.get(mod.id).clear();
            }
            return {
                get size() {
                    return getCurrentStorage();
                },
                get capacity() {
                    return MAX_CHARACTER_STORAGE;
                },
                get remaining() {
                    return MAX_CHARACTER_STORAGE - this.size;
                },
                get keys() {
                    if (!characterStorage.has(mod.id))
                        return [];
                    return Array.from(characterStorage.get(mod.id).keys());
                },
                setItem,
                getItem,
                removeItem,
                clear,
            };
        }
        /**
         * Creates a new locked error for a given mod.
         */
        function LockedError(mod) {
            return new Error(`[${mod.name}] Cannot use characterStorage before a character has been loaded.`);
        }
        /**
         * Unlocks the character storage API for use.
         */
        function unlock() {
            unlocked = true;
        }
        /**
         * Serialize a mod's data for saving.
         * @param mod The mod whose data to serialize.
         */
        function serialize(mod) {
            if (!characterStorage.has(mod.id))
                return null;
            const data = Array.from(characterStorage.get(mod.id));
            return data.map(([key, value]) => [key, JSON.parse(value)]);
        }
        /**
         * Deserialize a mod's data.
         * @param mod The mod whose data we're deserializing.
         * @param data The data to deserialize.
         */
        function deserialize(mod, data) {
            if (!data)
                return;
            characterStorage.set(mod.id, new Map());
            const modStorage = characterStorage.get(mod.id);
            for (const [key, value] of data) {
                modStorage.set(key, JSON.stringify(value));
            }
        }
        return {
            createContext,
            unlock,
            serialize,
            deserialize,
        };
    })();
    // Account-level data persistence submodule of context API
    const accountStorageContextApi = (() => {
        const MAX_ACCOUNT_STORAGE = Math.pow(2, 13);
        const accountStorage = new Map();
        /**
         * Create a new account storage context.
         * @param mod The mod that the account storage belongs to.
         */
        function createContext(mod) {
            /**
             * Calculates the number of bytes currently being used by this mod's character storage
             * @param ignoreKey
             * @returns Total bytes of character storage
             */
            function getCurrentStorage(ignoreKey) {
                if (!accountStorage.has(mod.id))
                    return 0;
                const modData = accountStorage.get(mod.id);
                const totalDataSize = Array.from(modData).reduce((total, [k, v]) => {
                    if (k === ignoreKey)
                        return total;
                    return total + k.length + v.length;
                }, 0);
                return totalDataSize;
            }
            /**
             * Save a key/value pair to the current character
             * @param key
             * @param data
             */
            function setItem(key, data) {
                if (data === undefined)
                    return removeItem(key);
                if (typeof key !== 'string')
                    throw new Error(`[${mod.name}] Data key is expected to be of type 'string'.`);
                const storedValue = JSON.stringify(data);
                const thisSize = key.length + storedValue.length;
                if (!accountStorage.has(mod.id))
                    accountStorage.set(mod.id, new Map());
                const modData = accountStorage.get(mod.id);
                const totalDataSize = getCurrentStorage(key);
                const percentFull = Math.floor(((totalDataSize + thisSize) / MAX_ACCOUNT_STORAGE) * 100);
                if (percentFull >= 100) {
                    throw new Error(`[${mod.name}] Cannot add ${formatNumber(thisSize)} bytes of data to accountStorage. Total account storage for this mod would exceed the limit of ${formatNumber(MAX_ACCOUNT_STORAGE)} bytes.`);
                } else if (percentFull > 75) {
                    console.warn(`[${mod.name}] Nearing total account storage limt. Currently using ${formatNumber(totalDataSize + thisSize)} (${percentFull}%) of ${formatNumber(MAX_ACCOUNT_STORAGE)} bytes.`);
                }
                modData.set(key, storedValue);
                queuePersist();
            }
            /**
             * Save a key/value pair to the current character
             * @param key
             * @param data
             */
            function getItem(key) {
                if (!accountStorage.has(mod.id))
                    return undefined;
                if (!accountStorage.get(mod.id).has(key))
                    return undefined;
                return JSON.parse(accountStorage.get(mod.id).get(key));
            }
            /**
             * Deletes data saved to the character by key
             * @param {string} key
             */
            function removeItem(key) {
                if (!accountStorage.has(mod.id))
                    return;
                accountStorage.get(mod.id).delete(key);
                queuePersist();
            }
            /**
             * Clears all data saved to the character
             */
            function clear() {
                if (!accountStorage.has(mod.id))
                    return;
                accountStorage.get(mod.id).clear();
                queuePersist();
            }
            return {
                get size() {
                    return getCurrentStorage();
                },
                get capacity() {
                    return MAX_ACCOUNT_STORAGE;
                },
                get remaining() {
                    return MAX_ACCOUNT_STORAGE - this.size;
                },
                get keys() {
                    if (!accountStorage.has(mod.id))
                        return [];
                    return Array.from(accountStorage.get(mod.id).keys());
                },
                setItem,
                getItem,
                removeItem,
                clear,
            };
        }
        /**
         * Queue persistence to the cloud.
         */
        function queuePersist() {
            const data = [];
            for (const mod of modStore.loadedMods) {
                const modData = serialize(mod);
                if (!modData)
                    continue;
                data.push([mod.id, modData]);
            }
            playFabManager.queueUpdate('modAccountStorage', JSON.stringify(data));
        }
        /**
         * Loads all mod data into the account storage.
         * @param allData Account storage data across all mods.
         */
        function deserializeAll(allData) {
            if (!allData)
                return;
            const parsedData = JSON.parse(allData);
            for (const data of parsedData) {
                const modId = data[0];
                const mod = modStore.installedMods.find((m) => m.id === modId);
                if (!mod)
                    continue;
                deserialize(mod, data[1]);
            }
        }
        /**
         * Serialize the specified mod's account storage.
         * @param mod The mod to serialize.
         */
        function serialize(mod) {
            if (!accountStorage.has(mod.id))
                return null;
            const data = Array.from(accountStorage.get(mod.id));
            return data.map(([key, value]) => [key, JSON.parse(value)]);
        }
        /**
         * Deserialize the specified mod's account storage.
         * @param mod The mod to deserialize.
         * @param data The data to deserialize.
         */
        function deserialize(mod, data) {
            if (!data || !Array.isArray(data))
                return;
            accountStorage.set(mod.id, new Map());
            const modStorage = accountStorage.get(mod.id);
            for (const [key, value] of data) {
                modStorage.set(key, JSON.stringify(value));
            }
        }
        return {
            createContext,
            serialize,
            deserialize,
            deserializeAll,
        };
    })();
    // Settings submodule of context API
    // TODO: Account-level settings?
    const settingsContextApi = (() => {
        const allSections = new Map();
        const disabledModSections = new Map();
        const elementValueMap = new Map();
        let sidebarRendered = false;

        function renderSidebar() {
            if (sidebarRendered)
                return;
            sidebarRendered = true;
            for (const [modId] of allSections) {
                const mod = modStore.loadedMods.find((m) => m.id === modId);
                if (!mod)
                    continue;
                renderModSidebar(mod);
            }
        }
        /**
         * Render the Mod Settings sidebar subitem for the specified mod.
         * @param mod The mod to render.
         */
        function renderModSidebar(mod) {
            var _a;
            const modSettingsItem = sidebar.category('Modding').item('Mod Settings');
            (_a = modSettingsItem.rootEl) === null || _a === void 0 ? void 0 : _a.classList.remove('d-none');
            const existingSubitems = modSettingsItem.subitems();
            let before;
            for (const subitem of existingSubitems) {
                if (mod.name < subitem.id) {
                    before = subitem.id;
                    break;
                }
            }
            let iconSrc = assets.getURI('assets/media/mods/placeholder_icon.png');
            if (mod.icon) {
                try {
                    iconSrc = loader.getResourceUrl(mod, mod.icon);
                } catch (_b) {
                    console.error(`[${mod.name}] The icon file "${mod.icon}" does not exist.`);
                }
            }
            modSettingsItem.subitem(mod.name, {
                name: createElement('span', {
                    children: [
                        createElement('img', {
                            className: 'mr-2',
                            attributes: [
                                ['src', iconSrc],
                                ['height', '24'],
                                ['width', '24'],
                            ],
                        }),
                        mod.name,
                    ],
                }),
                before,
                onClick: () => renderModSettings(mod),
            });
        }
        /**
         * Render the Mod Settings popup for the specified mod.
         * @param mod The mod to render.
         */
        function renderModSettings(mod) {
            if (!allSections.has(mod.id))
                return;
            const sections = allSections.get(mod.id);
            if (!sections.length)
                return;
            const html = createElement('div');
            createElement('h3', {
                className: 'block-title mb-2',
                text: `Settings: ${mod.name}`,
                parent: html
            });
            for (const section of sections) {
                createElement('h2', {
                    className: 'content-heading border-bottom mb-4 pb-2',
                    text: section.name,
                    parent: html,
                });
                const settingWrapper = createElement('div', {
                    className: 'col',
                    parent: createElement('div', {
                        className: 'row',
                        parent: html
                    }),
                });
                for (const setting of section.settings) {
                    createElement('div', {
                        className: 'mb-4',
                        parent: settingWrapper,
                        children: [setting.root]
                    });
                }
            }
            Swal.fire({
                customClass: {
                    container: 'swal-infront',
                    htmlContainer: 'mm__container font-size-sm text-left mt-2 mb-0 mx-3',
                },
                html,
                showConfirmButton: false,
                showCloseButton: true,
            });
        }
        /**
         * Create a mod settings context for a mod.
         * @param mod The mod the settings will belong to.
         * @param ns The namespace of the mod.
         */
        function createContext(mod, ns) {
            /**
             * Get or create and then get a section setting.
             * @param name Name/id of the section.
             */
            function section(name) {
                if (name.length > 32)
                    throw new Error(`[${mod.name}] Setting section name is too long. Maximum length is 32 characters.`);
                if (!allSections.has(mod.id))
                    allSections.set(mod.id, []);
                const sections = allSections.get(mod.id);
                let section = sections.find((s) => s.name === name);
                if (!section) {
                    section = {
                        name,
                        settings: []
                    };
                    sections.push(section);
                }
                if (sidebarRendered &&
                    !sidebar
                    .category('Modding')
                    .item('Mod Settings')
                    .subitems()
                    .some((s) => s.id === mod.name)) {
                    renderModSidebar(mod);
                }
                /**
                 * Get the value of a setting.
                 * @param name The name of the setting.
                 */
                function get(name) {
                    const setting = section.settings.find((s) => s.config.name === name);
                    if (!setting)
                        throw new Error(`[${mod.name}] No such setting found.`);
                    return setting.get();
                }
                /**
                 * Set the value of a setting.
                 * @param name The name of the setting.
                 * @param value The value to set the setting to.
                 */
                function set(name, value) {
                    const setting = section.settings.find((s) => s.config.name === name);
                    if (!setting)
                        throw new Error(`[${mod.name}] No such setting found.`);
                    setting.set(value);
                }
                /**
                 * Add a setting or settings to the section.
                 * @param config Configuration object for the setting(s).
                 */
                function add(config) {
                    if (Array.isArray(config)) {
                        for (const c of config) {
                            addSetting(c);
                        }
                        return;
                    }
                    addSetting(config);
                }
                /**
                 * Add a single setting to the section.
                 * @param config Configuration object for the setting.
                 */
                function addSetting(config) {
                    const setting = createSetting(mod, config);
                    section.settings.push(setting);
                }
                return {
                    get,
                    set,
                    add,
                };
            }
            /**
             * @param {string} name
             * @param {Modding.Settings.SettingConfig} config
             */
            function type(name, config, configValidator) {
                if (!ns)
                    throw NamespaceError(mod, 'settings.type');
                createType(mod, name, config, configValidator);
            }
            return {
                section,
                type,
            };
        }
        //#region Setting Types
        /**
         * Create a setting.
         * @param mod Mod creating the setting.
         * @param config Configuration object used to create the setting.
         */
        function createSetting(mod, config) {
            if (mod.namespace) {
                const selfModdedType = `${mod.namespace}:${config.type}`;
                if (types[selfModdedType])
                    return types[selfModdedType](mod, config);
            }
            if (!types[config.type])
                throw new Error(`[${mod.name}] Invalid setting type: "${config.type}".`);
            return types[config.type](mod, config);
        }
        /**
         *
         * @param mod
         * @param name
         * @param config
         * @param configValidator
         */
        function createType(mod, name, config, configValidator) {
            const fullName = `${mod.namespace}:${name}`;
            if (types[fullName])
                throw new Error(`[${mod.name}] Setting type "${fullName}" already exists.`);
            types[fullName] = (instanceMod, instanceConfig) => {
                if (configValidator) {
                    try {
                        configValidator(instanceConfig);
                    } catch (e) {
                        throw new Error(`[${instanceMod.name}] ${e}`);
                    }
                }
                return Custom(instanceMod, Object.assign(Object.assign({}, instanceConfig), {
                    render: config.render,
                    get: config.get,
                    set: config.set
                }));
            };
            return fullName;
        }
        const types = {
            text: Text,
            number: Number,
            switch: Switch,
            dropdown: Dropdown,
            button: Button,
            'checkbox-group': CheckboxGroup,
            'radio-group': RadioGroup,
            label: Label,
            custom: Custom,
        };
        /**
         * Common input setting label, NOT the setting type 'Label'
         */
        function InputLabel(name, label, hint) {
            const labelEl = createElement('label', {
                className: 'font-weight-normal flex-wrap justify-content-start ml-2',
                children: [label],
                attributes: [
                    ['for', name]
                ],
            });
            if (hint) {
                createElement('span', {
                    className: 'ms__force-wrap',
                    parent: labelEl
                });
                createElement('small', {
                    className: 'd-block',
                    children: [hint],
                    parent: labelEl
                });
            }
            return labelEl;
        }
        /**
         * Common validation message
         */
        function ValidationMessage() {
            return createElement('small', {
                className: 'text-danger ms__validation-message validation-message ml-2',
                text: '',
            });
        }

        function Text(mod, config) {
            function render(name, onChange, config) {
                const input = createElement('input', {
                    id: name,
                    className: 'form-control form-control-lg',
                    attributes: [
                        ['type', 'text'],
                        ['name', name],
                    ],
                });
                const group = createElement('div', {
                    className: 'form-group',
                    children: [InputLabel(name, config.label, config.hint), input, ValidationMessage()],
                });
                if (config.maxLength)
                    input.maxLength = config.maxLength;
                if (config.default)
                    input.value = config.default;
                input.addEventListener('change', () => onChange());
                return group;
            }

            function get(root) {
                return root.querySelector('input').value;
            }

            function set(root, data) {
                root.querySelector('input').value = data;
            }
            return Setting(mod, Object.assign(Object.assign({}, config), {
                render,
                get,
                set
            }));
        }

        function Number(mod, config) {
            function render(name, onChange, config) {
                const input = createElement('input', {
                    id: name,
                    className: 'form-control form-control-lg',
                    attributes: [
                        ['type', 'number'],
                        ['name', name],
                    ],
                });
                const group = createElement('div', {
                    className: 'form-group',
                    children: [InputLabel(name, config.label, config.hint), input, ValidationMessage()],
                });
                if (config.min != null)
                    input.min = config.min.toString();
                if (config.max != null)
                    input.max = config.max.toString();
                if (config.default != null)
                    input.value = config.default.toString();
                input.addEventListener('change', () => onChange());
                return group;
            }

            function get(root) {
                const value = parseFloat(root.querySelector('input').value);
                return isNaN(value) ? config.default || 0 : value;
            }

            function set(root, data) {
                var _a;
                root.querySelector('input').value = (data === null || data === void 0 ? void 0 : data.toString()) || ((_a = config.default) === null || _a === void 0 ? void 0 : _a.toString()) || '0';
            }
            return Setting(mod, Object.assign(Object.assign({}, config), {
                render,
                get,
                set
            }));
        }

        function Switch(mod, config) {
            function render(name, onChange, config) {
                const input = createElement('input', {
                    id: name,
                    className: 'custom-control-input',
                    attributes: [
                        ['type', 'checkbox'],
                        ['name', name],
                    ],
                });
                const label = InputLabel(name, config.label, config.hint);
                label.classList.add('custom-control-label');
                const group = createElement('div', {
                    className: 'custom-control custom-switch custom-control-lg',
                    children: [input, label, ValidationMessage()],
                });
                if (config.default)
                    input.checked = true;
                input.addEventListener('change', () => onChange());
                return group;
            }

            function get(root) {
                return root.querySelector('input').checked;
            }

            function set(root, data) {
                root.querySelector('input').checked = data;
            }
            return Setting(mod, Object.assign(Object.assign({}, config), {
                render,
                get,
                set
            }));
        }

        function Dropdown(mod, config) {
            if (config.default === undefined)
                throw new Error(`[${mod.name}] A default value must be specified when creating a dropdown setting.`);
            if (!Array.isArray(config.options) || config.options.length === 0)
                throw new Error(`[${mod.name}] You must define an array of options when creating a dropdown setting.`);
            const defaultOption = config.options.find((o) => o.value === config.default);
            if (defaultOption === undefined)
                throw new Error(`[${mod.name}] The default value must match the value of one of the defined options when creating a dropdown setting.`);

            function render(name, onChange, config) {
                const button = createElement('button', {
                    id: name,
                    className: `btn btn-${config.color || 'primary'} dropdown-toggle font-size-sm`,
                    attributes: [
                        ['type', 'button'],
                        ['data-toggle', 'dropdown'],
                        ['aria-haspopup', 'true'],
                        ['aria-expanded', 'false'],
                    ],
                });
                const options = [];
                for (const option of config.options) {
                    const opt = createElement('button', {
                        className: 'dropdown-item pointer-enabled',
                        children: [option.display],
                    });
                    elementValueMap.set(opt, option.value);
                    opt.addEventListener('click', () => {
                        button.innerHTML = option.display instanceof HTMLElement ? option.display.outerHTML : option.display;
                        elementValueMap.set(button, option.value);
                        onChange();
                    });
                    if (config.default === option.value) {
                        button.innerHTML = opt.innerHTML;
                        elementValueMap.set(button, option.value);
                    }
                    options.push(opt);
                }
                const dropdownMenu = createElement('div', {
                    className: 'dropdown-menu font-size-sm',
                    attributes: [
                        ['aria-labelledby', name]
                    ],
                    children: options,
                });
                const dropdown = createElement('div', {
                    className: 'dropdown',
                    children: [button, dropdownMenu]
                });
                const group = createElement('div', {
                    className: 'form-inline flex-wrap-reverse',
                    children: [ValidationMessage(), dropdown, InputLabel(name, config.label, config.hint)],
                });
                return group;
            }

            function get(root) {
                return elementValueMap.get(root.querySelector('button'));
            }

            function set(root, data) {
                const option = config.options.find((o) => o.value === data);
                if (!option)
                    throw new Error(`[${mod.name}] Could not set setting ${config.label} to ${data}. No valid option found.`);
                const btn = root.querySelector('button');
                elementValueMap.set(btn, data);
                btn.innerHTML = option.display instanceof HTMLElement ? option.display.outerHTML : option.display;
            }
            return Setting(mod, Object.assign(Object.assign({}, config), {
                render,
                get,
                set
            }));
        }

        function Button(mod, config) {
            if (!config.display)
                throw new Error(`[${mod.name}] A display value must be defined when creating a button setting.`);
            if (!config.onClick || typeof config.onClick !== 'function')
                throw new Error(`[${mod.name}] An onClick function must be defined when creating a button setting.`);

            function render(name, onChange, config) {
                const button = createElement('button', {
                    id: name,
                    className: `btn btn-${config.color || 'primary'} font-size-sm`,
                    attributes: [
                        ['type', 'button']
                    ],
                    children: [config.display],
                });
                button.addEventListener('click', () => onChange());
                const group = createElement('div', {
                    className: 'form-inline flex-wrap-reverse',
                    children: [ValidationMessage(), button],
                });
                if (config.label || config.hint)
                    group.appendChild(InputLabel(name, config.label, config.hint));
                return group;
            }

            function get() {}

            function set() {}
            return Setting(mod, Object.assign(Object.assign({}, config), {
                onChange: config.onClick,
                render,
                get,
                set
            }));
        }

        function CheckboxGroup(mod, config) {
            if (!Array.isArray(config.options) || config.options.length === 0)
                throw new Error(`[${mod.name}] You must define an array of options when creating a checkbox group setting.`);

            function render(name, onChange, config) {
                const group = createElement('div', {
                    className: 'form-group'
                });
                if (config.label || config.hint)
                    group.appendChild(InputLabel(name, config.label, config.hint));
                for (let i = 0; i < config.options.length; i++) {
                    const option = config.options[i];
                    const optName = `${name}[${i}]`;
                    const checkbox = createElement('input', {
                        id: optName,
                        className: 'custom-control-input',
                        attributes: [
                            ['type', 'checkbox'],
                            ['name', optName],
                        ],
                    });
                    elementValueMap.set(checkbox, option.value);
                    const label = InputLabel(optName, option.label, option.hint);
                    label.classList.add('custom-control-label');
                    const control = createElement('div', {
                        className: 'custom-control custom-checkbox custom-control-lg mb-1',
                        children: [checkbox, label],
                    });
                    if (config.default && config.default.includes(option.value))
                        checkbox.checked = true;
                    checkbox.addEventListener('change', () => onChange());
                    group.appendChild(control);
                }
                group.appendChild(ValidationMessage());
                return group;
            }

            function get(root) {
                const checkboxes = root.querySelectorAll('input[type="checkbox"]');
                const value = [];
                checkboxes.forEach((c) => c.checked && value.push(elementValueMap.get(c)));
                return value;
            }

            function set(root, data) {
                const checkboxes = root.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach((c) => data && data.includes(elementValueMap.get(c)) && (c.checked = true));
            }
            return Setting(mod, Object.assign(Object.assign({}, config), {
                render,
                get,
                set
            }));
        }

        function RadioGroup(mod, config) {
            if (!Array.isArray(config.options) || config.options.length === 0)
                throw new Error(`[${mod.name}] You must define an array of options when creating a radio group setting.`);

            function render(name, onChange, config) {
                const group = createElement('div', {
                    className: 'form-group'
                });
                if (config.label || config.hint)
                    group.appendChild(InputLabel(name, config.label, config.hint));
                for (let i = 0; i < config.options.length; i++) {
                    const option = config.options[i];
                    const optName = `${name}[${i}]`;
                    const radio = createElement('input', {
                        id: optName,
                        className: 'custom-control-input',
                        attributes: [
                            ['type', 'radio'],
                            ['name', name],
                        ],
                    });
                    elementValueMap.set(radio, option.value);
                    const label = InputLabel(optName, option.label, option.hint);
                    label.classList.add('custom-control-label');
                    const control = createElement('div', {
                        className: 'custom-control custom-radio custom-control-lg mb-1',
                        children: [radio, label],
                    });
                    if (config.default === option.value)
                        radio.checked = true;
                    radio.addEventListener('change', () => onChange());
                    group.appendChild(control);
                }
                group.appendChild(ValidationMessage());
                return group;
            }

            function get(root) {
                const radios = root.querySelectorAll('input[type="radio"]');
                for (const radio of Array.from(radios)) {
                    if (radio.checked)
                        return elementValueMap.get(radio);
                }
                return '';
            }

            function set(root, data) {
                const radios = root.querySelectorAll('input[type="radio"]');
                radios.forEach((c) => {
                    if (elementValueMap.get(c) === data)
                        c.checked = true;
                });
            }
            return Setting(mod, Object.assign(Object.assign({}, config), {
                render,
                get,
                set
            }));
        }

        function Label(mod, config) {
            if (!config.label)
                throw new Error(`[${mod.name}] A label value must be defined when creating a label setting.`);

            function render(name, onChange, config) {
                const label = createElement('span', {
                    id: name,
                    children: [config.label]
                });
                if (config.hint)
                    createElement('small', {
                        className: 'd-block',
                        children: [config.hint],
                        parent: label
                    });
                return label;
            }

            function get() {}

            function set() {}
            return Setting(mod, Object.assign(Object.assign({}, config), {
                render,
                get,
                set
            }));
        }

        function Custom(mod, config) {
            if (!config.render)
                throw new Error(`[${mod.name}] A render function must be defined when creating a custom setting.`);
            if (!config.get)
                throw new Error(`[${mod.name}] A get function must be defined when creating a custom setting.`);
            if (!config.set)
                throw new Error(`[${mod.name}] A set function must be defined when creating a custom setting.`);
            return Setting(mod, Object.assign({}, config));
        }
        /**
         * Base settings input
         * @param mod
         * @param config
         */
        function Setting(mod, config) {
            if (!config.name)
                throw new Error(`[${mod.name}] A name must be defined when creating a setting.`);
            let value = config.default;
            const root = config.render(`${mod.namespace}:${config.name}`, onChange, config);

            function onChange(options) {
                const newValue = config.get(root);
                const res = (options === null || options === void 0 ? void 0 : options.isRestoringValue) ? true : config.onChange ? config.onChange(newValue, value) : true;
                const validation = root.querySelector('.validation-message');
                // Validation error
                if (typeof res === 'string') {
                    config.set(root, value);
                    if (validation) {
                        validation.textContent = res;
                        validation.classList.add('d-block');
                    }
                    return;
                }
                // Reset validation
                if (validation) {
                    validation.textContent = '';
                    validation.classList.remove('d-block');
                }
                // Explicitly rejected change
                if (res !== undefined && !res) {
                    config.set(root, value);
                    return;
                }
                value = newValue;
                config.set(root, value);
            }

            function get() {
                return value;
            }

            function set(val, options) {
                config.set(root, val);
                onChange(options);
            }
            const setting = {
                mod,
                config,
                root,
                get,
                set,
            };
            return setting;
        }
        //#endregion
        function serialize(mod) {
            if (!allSections.has(mod.id))
                return serializeDisabled(mod);
            const sections = allSections.get(mod.id);
            const data = [];
            for (const section of sections) {
                if (!section.settings.length)
                    continue;
                const s = [section.name, []];
                for (const setting of section.settings) {
                    s[1].push([setting.config.name, setting.get()]);
                }
                data.push(s);
            }
            const serializeSize = JSON.stringify(data);
            if (serializeSize.length > 5000) {
                console.error(new Error(`[${mod.name}] Total settings storage is too large (> 5 KB). Settings values will not be persisted.`));
                return null;
            }
            return data;
        }

        function serializeDisabled(mod) {
            if (!disabledModSections.has(mod.id))
                return null;
            return disabledModSections.get(mod.id);
        }

        function deserialize(mod, data) {
            if (!data)
                return;
            if (!allSections.has(mod.id)) {
                deserializeDisabled(mod, data);
                return;
            }
            const sections = allSections.get(mod.id);
            for (const section of data) {
                const s = sections.find((s) => s.name === section[0]);
                if (!s)
                    continue;
                for (const setting of section[1]) {
                    const stg = s.settings.find((s) => s.config.name === setting[0]);
                    if (!stg)
                        continue;
                    stg.set(setting[1], {
                        isRestoringValue: true
                    });
                }
            }
        }

        function deserializeDisabled(mod, data) {
            if (!data)
                return;
            disabledModSections.set(mod.id, data);
        }
        return {
            createContext,
            renderSidebar,
            serialize,
            deserialize,
        };
    })();
    const encoder = (() => {
        function encode(writer) {
            const data = [];
            for (const mod of modStore.installedMods) {
                const settingsData = settingsContextApi.serialize(mod);
                const characterStorageData = characterStorageContextApi.serialize(mod);
                if (!settingsData && !characterStorageData)
                    continue;
                data.push([mod.id, settingsData, characterStorageData]);
            }
            writer.writeArray(data, (mod, w) => {
                w.writeUint32(mod[0]);
                w.writeString(JSON.stringify(mod[1]));
                w.writeString(JSON.stringify(mod[2]));
            });
            return writer;
        }

        function decode(reader, version) {
            reader.getArray((r) => {
                const modId = r.getUint32();
                const setttingsContextAPIRaw = r.getString();
                const characterStorageContextApiRaw = r.getString();
                const mod = modStore.installedMods.find((m) => m.id === modId);
                if (!mod)
                    return;
                settingsContextApi.deserialize(mod, JSON.parse(setttingsContextAPIRaw));
                characterStorageContextApi.deserialize(mod, JSON.parse(characterStorageContextApiRaw));
            });
        }
        return {
            encode,
            decode,
        };
    })();
    const playFabManager = (() => {
        const updates = [];
        const cachedValues = new Map();
        let debounceTimeout = null;

        function queueUpdate(key, data) {
            if (cachedValues.get(key) === data) {
                dequeueUpdate(key);
                return;
            }
            const existingQueuedItem = updates.find((i) => i[0] === key);
            if (existingQueuedItem) {
                existingQueuedItem[1] = data;
                debounce();
                return;
            }
            updates.push([key, data]);
            debounce();
        }

        function dequeueUpdate(key) {
            const existingQueuedIndex = updates.findIndex((i) => i[0] === key);
            if (existingQueuedIndex === -1)
                return;
            updates.splice(existingQueuedIndex, 1);
        }
        /** Delay PlayFab update for 3s after last queued update */
        function debounce() {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
            debounceTimeout = window.setTimeout(persist, 3 * 1000);
        }

        function persist() {
            if (!updates.length)
                return;
            const data = {};
            for (let i = 0; i < 10 && i < updates.length; i++) {
                const key = updates[i][0];
                const value = updates[i][1];
                data[key] = value;
                if (value === null) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, value);
                }
                cachedValues.set(key, value);
            }
            const pulled = updates.splice(0, 10);
            return new Promise((resolve, reject) => {
                PlayFab.ClientApi.UpdateUserData({
                    Data: data,
                }, (_res, err) => {
                    if (err) {
                        updates.push(...pulled);
                        reject(`Error while persisting mod account data: ${PlayFab.GenerateErrorReport(err)}`);
                        return;
                    }
                    resolve();
                });
                persist();
                debounceTimeout = null;
            });
        }
        /**
         * Retrieves a set of keys from PlayFab user data.
         * @param keys Keys to retrieve.
         */
        function retrieve(keys) {
            return __awaiter(this, void 0, void 0, function*() {
                if (keys.length > 10)
                    throw new Error('2 many keyz');
                return new Promise((resolve, reject) => {
                    PlayFab.ClientApi.GetUserData({
                        Keys: keys
                    }, (res, err) => {
                        var _a;
                        if (err) {
                            console.warn(`Error while retrieving mod account data: ${PlayFab.GenerateErrorReport(err)}`);
                            console.warn('Using fallback data from localStorage');
                            const values = {};
                            for (const key of keys) {
                                values[key] = localStorage.getItem(key);
                            }
                            return resolve(values);
                        }
                        const values = {};
                        if (!res.data.Data) {
                            for (const key of keys) {
                                values[key] = null;
                            }
                            return resolve(values);
                        }
                        for (const key of keys) {
                            const value = ((_a = res.data.Data[key]) === null || _a === void 0 ? void 0 : _a.Value) || null;
                            values[key] = value;
                            if (value === null) {
                                localStorage.removeItem(key);
                                cachedValues.delete(key);
                            } else {
                                localStorage.setItem(key, value);
                                cachedValues.set(key, value);
                            }
                        }
                        return resolve(values);
                    });
                });
            });
        }

        function cachedValue(key) {
            return cachedValues.get(key);
        }
        return {
            queueUpdate,
            dequeueUpdate,
            retrieve,
            cachedValue,
            persist,
        };
    })();
    /**
     * Creates an error regarding a missing or invalid namespace.
     * @param mod
     * @param endpoint
     */
    function NamespaceError(mod, endpoint) {
        return new Error(`[${mod.name}] No namespace was registered and so the "${endpoint}" endpoint is not accessible. Please define a valid namespace within manifest.json to use this resource.`);
    }
    const modApis = {};
    return {
        manager: {
            get activeProfile() {
                const profileProxy = profileStore.active;
                if (!profileProxy)
                    return null;
                return {
                    id: profileProxy.id,
                    name: profileProxy.name,
                    mods: [...profileProxy.mods],
                    autoEnable: profileProxy.autoEnable,
                };
            },
            hasProfile(id) {
                return profileStore.profile(id) !== null;
            },
            currentProfileName(id) {
                const profile = profileStore.profile(id);
                if (!profile)
                    return null;
                return profile.name;
            },
            init: ui.init,
            isLoggedIn: () => loginStore.getters.isLoggedIn(),
            isEnabled: () => store.status === ModdingStatus.Enabled,
            open: ui.open,
            isProcessing() {
                return taskStore.isProcessing;
            },
            hasChanges() {
                return uiStore.awaitingReload;
            },
            showPromptForProfileMismatch: ui.showPromptForProfileMismatch,
            showPromptForProfileButNotLoggedIn: ui.showPromptForProfileButNotLoggedIn,
            showPromptForReload: ui.showPromptForReload,
            showPromptForInProgress: ui.showPromptForInProgress,
            getLoadedModList() {
                return modStore.loadedList;
            },
        },
        register: contextApi.register,
        trigger: contextApi.trigger,
        api: modApis,
        getContext: contextApi.getContext,
        getDevContext: contextApi.getDevContext,
        getModErrorFromError: contextApi.getModErrorFromError,
        encode: encoder.encode,
        decode: encoder.decode,
        persist: playFabManager.persist,
    };
})(ui);
//# sourceMappingURL=mod.js.map
checkFileVersion('?12097')