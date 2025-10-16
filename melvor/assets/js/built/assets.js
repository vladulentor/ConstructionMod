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
const assets = (() => {
    const IMAGE_SRC_ATTRIBUTE = `data-src`;
    const USE_CDN = true; // TODO_R: SET TO TRUE FOR PRODUCTION
    const CDN_VERSION = 'v018';
    const CDN_ENDPOINT = 'https://cdn.melvor.net/core';
    const CDNDIR_ORIGINAL = `${CDN_ENDPOINT}/${CDN_VERSION}/`;
    const LOCAL_FILE_PATH =
        // @ts-expect-error NW.js specific API
        nativeManager.isDesktop && window.chrome ? `chrome-extension://${window.chrome.runtime.id}/` : '';

    function getPathWithoutFile() {
        const path = location.pathname;
        const pathParts = path.split('/');
        // Remove the last element (file)
        pathParts.pop();
        const newPath = pathParts.join('/');
        return newPath;
    }
    const GET_CDN_DIR = () => {
        if (location.origin == 'https://test.melvoridle.com')
            return `https://cdn2-test.melvor.net${getPathWithoutFile()}/`;
        return `https://cdn2-main.melvor.net${getPathWithoutFile()}/`;
    };
    const CDNDIR = GET_CDN_DIR();
    const ASSET_PATH_REGEXP = /\bdata-src="(assets\/([\w-]+\/)+[\w-]+\.(apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)\??\d?)"/g;
    const CSS_PATH_REGEXP = /url\((assets\/([\w-]+\/)+[\w-]+\.(apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)\??\d?)\)/g;
    let fs = null;
    if (nativeManager.isDesktop) {
        fs = require('fs');
    }

    function stripCacheBuster(baseURI) {
        return baseURI.replace(/\?\d+$/, '');
    }

    function getLocalURI(baseURI) {
        return `${LOCAL_FILE_PATH}${stripCacheBuster(baseURI)}`;
    }

    function getAssetURL(baseURI) {
        if (USE_CDN) {
            return `${CDNDIR}${baseURI}`;
        } else {
            return baseURI;
        }
    }
    /** Cache of Asset URIs that are known to exist */
    const existingAssets = new Set();
    /** Checks if a file exists at the given URI */
    function fileExists(baseURI) {
        if (existingAssets.has(baseURI))
            return true;
        const fileURI = stripCacheBuster(baseURI);
        if (fs) {
            try {
                fs.accessSync(fileURI);
                existingAssets.add(baseURI);
                return true;
            } catch (_a) {
                if (DEBUGENABLED)
                    console.warn(`Asset: ${baseURI} does not exist.`);
                return false;
            }
        } else {
            return false;
        }
    }
    /** Gets the appropriate URI of a game asset based on the current platform */
    function getURI(baseURI) {
        if (fileExists(baseURI)) {
            return getLocalURI(baseURI);
        } else {
            return getAssetURL(baseURI);
        }
    }
    /** Replaces Asset URIs in a string with the */
    function replaceLangStringURIs(langString) {
        return langString.replace(ASSET_PATH_REGEXP, (_, baseURI) => {
            return `src="${getURI(baseURI)}"`;
        });
    }

    function setDocumentImageSources(elem) {
        const images = elem.querySelectorAll(`img[${IMAGE_SRC_ATTRIBUTE}]:not([src])`);
        images.forEach((image) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const baseURI = image.getAttribute(IMAGE_SRC_ATTRIBUTE);
            image.src = getURI(baseURI);
        });
    }
    /** Adjusts the src property of all img elements in the Document and HTMLTemplateElements to the appropriate asset URI */
    function setImageSources() {
        setDocumentImageSources(document);
        const templates = document.querySelectorAll('template:not([data-image-init])');
        templates.forEach((template) => {
            setDocumentImageSources(template.content);
            template.setAttribute('data-image-init', 'true');
        });
    }
    /** Logs the img elements in the DOM which have a non-file src set */
    function logNonLocalImages() {
        document.querySelectorAll('img:not([data-src])').forEach((img) => {
            const src = img.getAttribute('src');
            if (src !== null && !(src.startsWith('chrome-extension:') || src.startsWith('blob:')))
                console.log(img);
        });
    }
    let assetCSS;

    function setCSSAssetStyle() {
        return __awaiter(this, void 0, void 0, function*() {
            if (nativeManager.isDesktop) {
                if (!assetCSS) {
                    if (fileExists(getLocalURI('assets/css/assets.css'))) {
                        const response = yield fetch(getLocalURI('assets/css/assets.css'));
                        if (!response.ok) {
                            console.warn('Could not load local asset CSS. File not found.');
                            return;
                        }
                        let cssFile = yield response.text();
                        cssFile = cssFile.replace(CSS_PATH_REGEXP, (_, baseURI) => {
                            return `url('${getURI(baseURI)}')`;
                        });
                        assetCSS = createElement('style');
                        assetCSS.innerHTML = cssFile;
                        document.body.appendChild(assetCSS);
                    } else {
                        console.warn('Could not load local asset CSS. File not found. Probably using an outdated client.');
                    }
                }
                document.body.classList.add('local-assets');
            } else {
                document.body.classList.remove('local-assets');
            }
        });
    }
    return Object.freeze({
        getURI,
        replaceLangStringURIs,
        setImageSources,
        logNonLocalImages,
        setCSSAssetStyle,
        get USE_CDN() {
            return USE_CDN;
        },
        get CDNDIR() {
            return CDNDIR;
        },
        get CDNVersion() {
            return CDN_VERSION;
        },
        get CDNEndpoint() {
            return CDN_VERSION;
        },
        get CDNDIR_ORIGINAL() {
            return CDNDIR_ORIGINAL;
        },
    });
})();
/** @deprecated Use assets.getURI instead */
const cdnMedia = assets.getURI;
/** @deprecated Use assets.getURI instead */
const useCDN = assets.USE_CDN;
/** @deprecated Use assets.getURI instead */
const CDNDIR = () => assets.CDNDIR;
/** @deprecated Use assets.CDNVersion instead */
const CDNVersion = assets.CDNVersion;
/** @deprecated Use assets.CDNEndpoint instead */
const CDNEndpoint = assets.CDNEndpoint;
/** @deprecated Use assets.CDNDIR_ORIGINAL instead */
const CDNDIR_ORIGINAL = assets.CDNDIR_ORIGINAL;
//# sourceMappingURL=assets.js.map
checkFileVersion('?12097')