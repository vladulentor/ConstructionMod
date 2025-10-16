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
class KeyBinding extends NamespacedObject {
    constructor(namespace, options, game) {
        super(namespace, options.id);
        /** Set of pages this keybinding fires on. If empty, fires globally. */
        this.pages = new Set();
        /** Currently set keys */
        this.keys = [];
        try {
            this._name = options.name;
            if (options.pageIDs !== undefined)
                this.pages = game.pages.getSetFromIds(options.pageIDs);
            this.defaultKeys = options.defaultKeys;
            this.keyDown = options.keydown;
            this.keyup = options.keyup;
        } catch (e) {
            throw new DataConstructionError(KeyBinding.name, e, this.id);
        }
    }
    get name() {
        if (this.isModded) {
            return this._name;
        } else {
            return getLangString(`KEYBIND_NAME_${this.localID}`);
        }
    }
    static formatKeyMatcher(matcher) {
        const keyText = [];
        if (matcher.ctrlKey) {
            keyText.push(getLangString('KEYBOARD_Control'));
        }
        if (matcher.altKey) {
            keyText.push('Alt (⌥)');
        }
        if (matcher.metaKey) {
            keyText.push('⊞ (⌘)');
        }
        if (matcher.shiftKey) {
            keyText.push(getLangString('KEYBOARD_Shift'));
        }
        switch (matcher.key) {
            case 'CapsLock':
                keyText.push(getLangString('KEYBOARD_CapsLock'));
                break;
            case 'NumLock':
                keyText.push(getLangString('KEYBOARD_NumLock'));
                break;
            case 'ScrollLock':
                keyText.push(getLangString('KEYBOARD_ScrollLock'));
                break;
            case 'Enter':
                keyText.push(getLangString('KEYBOARD_Enter'));
                break;
            case 'Tab':
                keyText.push(getLangString('KEYBOARD_Tab'));
                break;
            case ' ':
                keyText.push(getLangString('KEYBOARD_Spacebar'));
                break;
            case 'ArrowUp':
                keyText.push('↑');
                break;
            case 'ArrowDown':
                keyText.push('↓');
                break;
            case 'ArrowLeft':
                keyText.push('<-');
                break;
            case 'ArrowRight':
                keyText.push('->');
                break;
            case 'End':
                keyText.push(getLangString('KEYBOARD_End'));
                break;
            case 'Home':
                keyText.push(getLangString('KEYBOARD_Home'));
                break;
            case 'PageDown':
                keyText.push(getLangString('KEYBOARD_PageDown'));
                break;
            case 'PageUp':
                keyText.push(getLangString('KEYBOARD_PageUp'));
                break;
            case 'Backspace':
                keyText.push(getLangString('KEYBOARD_Backspace'));
                break;
            case 'Delete':
                keyText.push(getLangString('KEYBOARD_Delete'));
                break;
            case 'Insert':
                keyText.push(getLangString('KEYBOARD_Insert'));
                break;
            case 'Escape':
                keyText.push(getLangString('KEYBOARD_Escape'));
                break;
            case 'Pause':
                keyText.push(getLangString('KEYBOARD_Pause'));
                break;
            case 'PrintScreen':
                keyText.push(getLangString('KEYBOARD_PrintScreen'));
                break;
            default:
                keyText.push(matcher.key.toUpperCase());
        }
        return keyText.join(' + ');
    }
}
class KeyboardInputManager {
    constructor(game) {
        this.game = game;
        this._globalBindings = new Map();
        this._pageBindings = new Map();
        this._bindingSetIndex = 0;
        this._confirmingBinding = false;
        this._bindings = new NamespaceRegistry(game.registeredNamespaces, KeyBinding.name);
    }
    /** If a keybind is currently being set */
    get isSettingKeyBind() {
        return this._bindingBeingSet !== undefined;
    }
    /** Registers a single keybinding under the given namespace */
    registerBinding(namespace, options) {
        this._bindings.registerObject(new KeyBinding(namespace, options, this.game));
    }
    /** Registers multiple keybindings under the same namespace */
    registerBindings(namespace, bindingOptions) {
        bindingOptions.forEach((options) => this.registerBinding(namespace, options));
    }
    /** Gets a KeyBinding by its global ID */
    getBindingByID(id) {
        return this._bindings.getObjectByID(id);
    }
    /** Starts the process for setting a new keybind */
    startBindingKey(binding, index) {
        if (this.isSettingKeyBind)
            return;
        if (!this._isValidKeyIndex(index))
            throw new Error('Invalid Index for setting a keybind.');
        this._bindingBeingSet = binding;
        this._bindingSetIndex = index;
        this._getBindingEdits(binding).forEach((edit) => edit.setBinding(index));
    }
    /** Removes the key binding from the given index */
    clearKeyBinding(binding, index) {
        if (this.isSettingKeyBind)
            return;
        if (!this._isValidKeyIndex(index))
            throw new Error('Invalid Index for clearing a keybind');
        const matcher = binding.keys[index];
        if (matcher === undefined)
            return;
        binding.keys[index] = undefined;
        const keys = this._matcherToKeys(matcher);
        this._removeBindingFromMaps(binding, keys);
        this._renderKeyBindChange(binding);
    }
    /** Resets all key bindings to their default values */
    resetBindingsToDefault() {
        this._bindings.forEach((binding) => {
            binding.keys = [];
        });
        this._constructBindingMaps();
        const edits = document.querySelectorAll('key-binding-edit[data-init]');
        edits.forEach((edit) => {
            const bindingID = edit.getAttribute('data-binding-id');
            if (bindingID === null) {
                console.warn('Tried to update binding edit, but no binding-id was set.');
                console.log(edit);
                return;
            }
            const keyBinding = this._bindings.getObjectByID(bindingID);
            if (keyBinding === undefined) {
                console.warn(`Tried to update binding edit, but no KeyBinding with id: ${bindingID} exists.`);
                return;
            }
            edit.updateBindings(keyBinding);
        });
    }
    /** Called once after save data is loaded */
    onSaveLoad() {
        this._constructBindingMaps();
        document.addEventListener('keydown', (e) => this._onKeydown(e));
        document.addEventListener('keyup', (e) => this._onKeyup(e));
        this._constructBindingsMenu();
        this.initializeBindingEdits();
    }
    /** Hides/shows the bindings menu in the settings if there are registered keybinds, and populates the list of key bind settings */
    _constructBindingsMenu() {
        const container = document.getElementById('key-bindings-container');
        const list = document.getElementById('key-bindings-list');
        if (container === null || list === null)
            return; // On mobile, bindings don't exist
        if (this._bindings.size > 0) {
            showElement(container);
            this._bindings.forEach((binding) => {
                const edit = new KeyBindingEditElement();
                edit.className = 'w-80 mb-2';
                edit.setAttribute('data-binding-id', binding.id);
                list.append(edit);
            });
        } else {
            hideElement(container);
        }
    }
    /** Intializes key-binding-edit components and sets their callback functions */
    initializeBindingEdits() {
        const edits = document.querySelectorAll('key-binding-edit:not([data-init])');
        edits.forEach((edit) => {
            const bindingID = edit.getAttribute('data-binding-id');
            if (bindingID === null) {
                console.warn('Tried to initialize binding edit, but no binding-id was set.');
                console.log(edit);
                return;
            }
            const keyBinding = this._bindings.getObjectByID(bindingID);
            if (keyBinding === undefined) {
                console.warn(`Tried to initialize binding edit, but no KeyBinding with id: ${bindingID} exists.`);
                return;
            }
            edit.initialize(keyBinding, this);
            edit.updateBindings(keyBinding);
        });
    }
    _isValidKeyIndex(index) {
        return Number.isInteger(index) && index >= 0 && index < KeyboardInputManager.MAX_KEYBINDS;
    }
    /** Constructs the keys to KeyBinding maps, and sets default values for empty bindings */
    _constructBindingMaps() {
        this._globalBindings.clear();
        this._pageBindings.clear();
        this._bindings.forEach((binding) => {
            if (binding.keys.length === 0) {
                binding.defaultKeys.forEach((options) => {
                    const matcher = Object.assign({}, KeyboardInputManager.DEFAULT_MATCHER_OPTIONS, options);
                    const keys = this._matcherToKeys(matcher);
                    const conflictList = this._getConflictsFromKeys(binding, keys);
                    if (conflictList.size > 0) {
                        console.warn(`Default key binding for ${binding.id} has conflicts. Unbinding.`);
                        binding.keys.push(undefined);
                    } else {
                        binding.keys.push(matcher);
                    }
                });
                while (binding.keys.length < KeyboardInputManager.MAX_KEYBINDS) {
                    binding.keys.push(undefined);
                }
            }
            binding.keys.forEach((matcher) => {
                if (matcher === undefined)
                    return;
                const keys = this._matcherToKeys(matcher);
                this._setBindingToMaps(binding, keys);
            });
        });
    }
    /** Sets a binding to the specified keys in the global and page binding maps */
    _setBindingToMaps(binding, keys) {
        if (binding.pages.size === 0) {
            this._globalBindings.set(keys, binding);
        } else {
            binding.pages.forEach((page) => {
                let pageMap = this._pageBindings.get(page);
                if (pageMap === undefined) {
                    pageMap = new Map();
                    this._pageBindings.set(page, pageMap);
                }
                pageMap.set(keys, binding);
            });
        }
    }
    /** Deletes a binding from the global and page binding maps */
    _removeBindingFromMaps(binding, keys) {
        if (binding.pages.size > 0) {
            binding.pages.forEach((page) => {
                const pageMap = this._pageBindings.get(page);
                if (pageMap !== undefined)
                    pageMap.delete(keys);
            });
        } else {
            this._globalBindings.delete(keys);
        }
    }
    /** Removes the binding corresponding to keys from all conflicts, and removes them from the global and page binding maps */
    _removeConflictingBindings(conflicts, keys) {
        conflicts.forEach((binding) => {
            binding.keys.forEach((matcher, i) => {
                if (matcher !== undefined && this._matcherToKeys(matcher) === keys) {
                    binding.keys[i] = undefined;
                }
            });
            this._removeBindingFromMaps(binding, keys);
        });
    }
    /** If a keyboard event should be ignored, because it was pressed within a text form */
    _ignoreKeyPress(e) {
        return ((e.target instanceof HTMLElement &&
                (e.target.tagName === 'INPUT' ||
                    e.target.tagName === 'SELECT' ||
                    e.target.tagName === 'TEXTAREA' ||
                    e.target.isContentEditable)) ||
            KeyboardInputManager.INVALID_KEYS.includes(e.key));
    }
    _getKeybindsFromKeys(keys) {
        var _a;
        let pageKeybind = undefined;
        if (this.game.openPage !== undefined)
            pageKeybind = (_a = this._pageBindings.get(this.game.openPage)) === null || _a === void 0 ? void 0 : _a.get(keys);
        const globalKeybind = this._globalBindings.get(keys);
        return {
            page: pageKeybind,
            global: globalKeybind
        };
    }
    /** Returns a list of KeyBindings that conflict with an existing binding */
    _getConflictsFromKeys(binding, keys) {
        const conflictList = new Set();
        const existingGlobal = this._globalBindings.get(keys);
        if (existingGlobal !== undefined && existingGlobal !== binding)
            conflictList.add(existingGlobal);
        binding.pages.forEach((page) => {
            var _a;
            const existingPage = (_a = this._pageBindings.get(page)) === null || _a === void 0 ? void 0 : _a.get(keys);
            if (existingPage !== undefined && existingPage !== binding)
                conflictList.add(existingPage);
        });
        return conflictList;
    }
    /** Shows a confirmation modal for replacing conflicting keybinds */
    _showConflictConfirmation(conflicts, binding, bindingIndex, e) {
        return __awaiter(this, void 0, void 0, function*() {
            let conflictList = '';
            conflicts.forEach((conflict) => {
                conflictList += `<h5 class="text-danger font-w400 mb-1">${conflict.name}</h5>`;
            });
            const response = yield SwalLocale.fire({
                title: getLangString('REPLACE_CONFLICTING_KEYBINDS'),
                html: `<div class="justify-vertical-center text-combat-smoke">
      <h5 class="font-w400 mb-2">${getLangString('FOLLOWING_KEYBINDS_REPLACED')}</h5>
      ${conflictList}
      </div>`,
                showCancelButton: true,
                icon: 'warning',
            });
            if (response.value) {
                const keys = this._matcherToKeys(e);
                this._removeConflictingBindings(conflicts, keys);
                const oldMatcher = binding.keys[this._bindingSetIndex];
                if (oldMatcher !== undefined)
                    this._removeBindingFromMaps(binding, this._matcherToKeys(oldMatcher));
                binding.keys[bindingIndex] = this._eventToKeyMatcher(e);
                this._setBindingToMaps(binding, keys);
                conflicts.forEach((binding) => this._renderKeyBindChange(binding));
            }
            this._renderKeyBindChange(binding);
            this._confirmingBinding = false;
            this._bindingBeingSet = undefined;
        });
    }
    /** Callback function for when a key is pressed down */
    _onKeydown(e) {
        var _a, _b;
        if (this._ignoreKeyPress(e))
            return;
        const keys = this._matcherToKeys(e);
        if (this._bindingBeingSet !== undefined) {
            if (this._confirmingBinding)
                return;
            const conflictList = this._getConflictsFromKeys(this._bindingBeingSet, keys);
            if (conflictList.size > 0) {
                this._confirmingBinding = true;
                this._showConflictConfirmation(conflictList, this._bindingBeingSet, this._bindingSetIndex, e);
            } else {
                const oldMatcher = this._bindingBeingSet.keys[this._bindingSetIndex];
                if (oldMatcher !== undefined)
                    this._removeBindingFromMaps(this._bindingBeingSet, this._matcherToKeys(oldMatcher));
                this._bindingBeingSet.keys[this._bindingSetIndex] = this._eventToKeyMatcher(e);
                this._setBindingToMaps(this._bindingBeingSet, keys);
                this._renderKeyBindChange(this._bindingBeingSet);
                this._bindingBeingSet = undefined;
            }
            e.preventDefault();
        } else {
            const keybinds = this._getKeybindsFromKeys(keys);
            if ((_a = keybinds === null || keybinds === void 0 ? void 0 : keybinds.page) === null || _a === void 0 ? void 0 : _a.keyDown) {
                keybinds.page.keyDown(e);
                e.preventDefault();
            }
            if ((_b = keybinds === null || keybinds === void 0 ? void 0 : keybinds.global) === null || _b === void 0 ? void 0 : _b.keyDown) {
                keybinds.global.keyDown(e);
                e.preventDefault();
            }
        }
    }
    /** Callback function for when a key is released */
    _onKeyup(e) {
        var _a, _b;
        if (this._ignoreKeyPress(e) || this.isSettingKeyBind)
            return;
        const keys = this._matcherToKeys(e);
        const keybinds = this._getKeybindsFromKeys(keys);
        if ((_a = keybinds === null || keybinds === void 0 ? void 0 : keybinds.page) === null || _a === void 0 ? void 0 : _a.keyup) {
            keybinds.page.keyup(e);
            e.preventDefault();
        }
        if ((_b = keybinds === null || keybinds === void 0 ? void 0 : keybinds.global) === null || _b === void 0 ? void 0 : _b.keyup) {
            keybinds.global.keyup(e);
            e.preventDefault();
        }
    }
    /** Converts a key matcher into a string that identifies it */
    _matcherToKeys(matcher) {
        const keys = [];
        if (matcher.key === ' ')
            keys.push('Space');
        else
            keys.push(matcher.key);
        if (matcher.altKey)
            keys.push('Alt');
        if (matcher.ctrlKey)
            keys.push('Control');
        if (matcher.metaKey)
            keys.push('Meta');
        if (matcher.shiftKey)
            keys.push('Shift');
        return keys.join(' ');
    }
    /** Converts a keyboard event into a matcher for that type of event */
    _eventToKeyMatcher(e) {
        return {
            key: e.key,
            altKey: e.altKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
        };
    }
    /** Renders a change in a key binding */
    _renderKeyBindChange(binding) {
        this._getBindingEdits(binding).forEach((edit) => edit.updateBindings(binding));
    }
    _getBindingEdits(binding) {
        return document.querySelectorAll(`key-binding-edit[data-binding-id="${binding.id}"]`);
    }
    encode(writer) {
        writer.writeUint32(this._bindings.size);
        this._bindings.forEach((binding) => {
            writer.writeNamespacedObject(binding);
            writer.writeArray(binding.keys, (matcher) => {
                writer.writeBoolean(matcher !== undefined);
                if (matcher !== undefined) {
                    writer.writeString(matcher.key);
                    writer.writeBoolean(matcher.altKey);
                    writer.writeBoolean(matcher.ctrlKey);
                    writer.writeBoolean(matcher.metaKey);
                    writer.writeBoolean(matcher.shiftKey);
                }
            });
        });
        return writer;
    }
    decode(reader, version) {
        const numBindings = reader.getUint32();
        for (let i = 0; i < numBindings; i++) {
            const binding = reader.getNamespacedObject(this._bindings);
            const keys = reader.getArray((reader) => {
                if (reader.getBoolean()) {
                    return {
                        key: reader.getString(),
                        altKey: reader.getBoolean(),
                        ctrlKey: reader.getBoolean(),
                        metaKey: reader.getBoolean(),
                        shiftKey: reader.getBoolean(),
                    };
                } else {
                    return undefined;
                }
            });
            if (typeof binding !== 'string')
                binding.keys = keys;
        }
    }
}
/** Maximum number of keybinds per callback */
KeyboardInputManager.MAX_KEYBINDS = 2;
/** Keys that cannot be bound */
KeyboardInputManager.INVALID_KEYS = ['Shift', 'Control', 'Meta', 'OS', 'Alt'];
KeyboardInputManager.DEFAULT_MATCHER_OPTIONS = {
    key: '',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
};
class KeyBindingEditElement extends HTMLElement {
    constructor() {
        super();
        this.bindingOptions = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('key-binding-edit-template'));
        this.name = getElementFromFragment(this._content, 'name', 'span');
        for (let i = 0; i < KeyboardInputManager.MAX_KEYBINDS; i++) {
            this.bindingOptions.push({
                binding: getElementFromFragment(this._content, `binding-${i}`, 'button'),
                clear: getElementFromFragment(this._content, `clear-binding-${i}`, 'button'),
            });
        }
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    initialize(binding, manager) {
        this.name.textContent = binding.name;
        for (let i = 0; i < KeyboardInputManager.MAX_KEYBINDS; i++) {
            const option = this.bindingOptions[i];
            option.binding.onclick = () => manager.startBindingKey(binding, i);
            option.clear.onclick = () => manager.clearKeyBinding(binding, i);
        }
        this.setAttribute('data-init', 'true');
    }
    updateBindings(binding) {
        for (let i = 0; i < KeyboardInputManager.MAX_KEYBINDS; i++) {
            const option = this.bindingOptions[i];
            option.binding.classList.remove('text-warning');
            const matcher = binding.keys[i];
            if (matcher === undefined) {
                option.binding.classList.add('text-danger');
                option.binding.textContent = getLangString('KEYBOARD_UNBOUND');
            } else {
                option.binding.classList.remove('text-danger');
                option.binding.textContent = KeyBinding.formatKeyMatcher(matcher);
            }
        }
    }
    setBinding(index) {
        const option = this.bindingOptions[index];
        option.binding.classList.add('text-warning');
        option.binding.textContent = getLangString('PRESS_A_KEY');
    }
}
window.customElements.define('key-binding-edit', KeyBindingEditElement);
//# sourceMappingURL=keyboardInput.js.map
checkFileVersion('?12097')