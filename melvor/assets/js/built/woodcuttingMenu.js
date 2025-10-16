"use strict";
class WoodcuttingTreeElement extends HTMLElement {
    constructor() {
        super();
        this.requirementElements = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('woodcutting-tree-template'));
        this.button = getElementFromFragment(this._content, 'button', 'a');
        this.treeName = getElementFromFragment(this._content, 'tree-name', 'span');
        this.xpText = getElementFromFragment(this._content, 'xp-text', 'span');
        this.intervalText = getElementFromFragment(this._content, 'interval-text', 'span');
        this.treeImage = getElementFromFragment(this._content, 'tree-image', 'img');
        this.progressBar = getElementFromFragment(this._content, 'progress-bar', 'div');
        this.requirements = getElementFromFragment(this._content, 'requirements', 'div');
        this.levelRequired = getElementFromFragment(this._content, 'level-required', 'span');
        this.abyssalLevelRequired = getElementFromFragment(this._content, 'abyssal-level-required', 'div');
        this.mastery = getElementFromFragment(this._content, 'mastery', 'mastery-display');
        this.lockedContainer = getElementFromFragment(this._content, 'locked-container', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    updateTreeVisibility(tree, woodcutting) {
        woodcutting.currentRealm !== tree.realm ? hideElement(this) : showElement(this);
    }
    setMastery(woodcutting, tree) {
        this.mastery.setMastery(woodcutting, tree);
    }
    setTree(tree, woodcutting) {
        this.button.onclick = () => woodcutting.selectTree(tree);
        this.button.classList.remove('border-danger', 'bg-gray-dark', 'pointer-events-none', 'd-flex', 'justify-vertical-center');
        this.button.classList.add('border-woodcutting', 'pointer-enabled');
        this.treeName.textContent = tree.name;
        this.treeImage.src = tree.media;
        this.levelRequired.textContent = templateLangString('MENU_TEXT_LEVEL', {
            level: `${tree.level}`,
        });
        if (game.woodcutting.hasAbyssalLevels && tree.abyssalLevel > 0) {
            this.abyssalLevelRequired.textContent = templateLangString('MENU_TEXT_ABYSSAL_LEVEL', {
                level: `${tree.abyssalLevel}`,
            });
            showElement(this.abyssalLevelRequired);
        } else
            hideElement(this.abyssalLevelRequired);
        this.requirementElements.forEach((element) => {
            element.remove();
        });
        this.requirementElements = [];
        tree.requirements.forEach((requirement) => {
            const elem = createElement('small', {
                className: 'font-w600 text-danger'
            });
            elem.append(...requirement.getNodes('skill-icon-xs mx-1'));
            this.requirements.append(elem);
            this.requirementElements.push(elem);
        });
        this.updateLockedRequirements(tree, game);
    }
    setTreeUnlocked() {
        hideElement(this.lockedContainer);
        showElement(this.button);
    }
    setTreeLocked(tree, game) {
        showElement(this.lockedContainer);
        hideElement(this.button);
        this.updateLockedRequirements(tree, game);
    }
    updateLockedRequirements(tree, game) {
        if (game.woodcutting.level >= tree.level) {
            this.levelRequired.classList.replace('badge-danger', 'badge-success');
        } else {
            this.levelRequired.classList.replace('badge-success', 'badge-danger');
        }
        if (game.woodcutting.abyssalLevel >= tree.abyssalLevel) {
            this.abyssalLevelRequired.classList.replace('badge-danger', 'badge-success');
        } else {
            this.abyssalLevelRequired.classList.replace('badge-success', 'badge-danger');
        }
        tree.requirements.forEach((requirement, i) => {
            const elem = this.requirementElements[i];
            toggleDangerSuccess(elem, game.checkRequirement(requirement));
        });
    }
    updateRates(tree, woodcutting) {
        if (tree.baseExperience > 0) {
            this.xpText.textContent = templateLangString('MENU_TEXT_XP_AMOUNT', {
                xp: `${Math.floor(woodcutting.modifyXP(tree.baseExperience, tree))}`,
            });
        } else if (tree.baseAbyssalExperience > 0) {
            this.xpText.textContent = templateLangString('MENU_TEXT_AXP_AMOUNT', {
                xp: `${Math.floor(woodcutting.modifyAbyssalXP(tree.baseAbyssalExperience, tree))}`,
            });
        }
        const cutInterval = woodcutting.getTreeInterval(tree) / 1000;
        this.intervalText.textContent = templateLangString('MENU_TEXT_SECONDS', {
            seconds: `${numberWithCommas(cutInterval)}`,
        });
    }
    setActive() {
        this.progressBar.style.width = '100%';
    }
    setInactive() {
        this.progressBar.style.width = '0%';
    }
}
window.customElements.define('woodcutting-tree', WoodcuttingTreeElement);
/** Class to manage the woodcutting page's menu */
class WoodcuttingMenu {
    constructor(woodcutting) {
        this.woodcutting = woodcutting;
        this.treeMenus = new Map();
        this.progressBar = document.getElementById('cut-tree-progress');
        this.infoMessage = document.getElementById('woodcutting-info-message');
        this.grantsContainer = document.getElementById('woodcutting-grants');
        this.treeContainer = document.getElementById('woodcutting-tree-container');
        this.treeGrants = [];
        this.selectedTrees = new Set();
        this.lowerGrants = createElement('div', {
            className: 'row justify-content-center ml-2 mr-2 icon-size-48'
        });
        this.grantsContainer.append(this.lowerGrants);
        this.xpIcon = createElement('xp-icon', {
            parent: this.lowerGrants
        });
        this.abyssalXPIcon = createElement('abyssal-xp-icon', {
            className: 'd-none',
            parent: this.lowerGrants
        });
        this.poolXPIcon = createElement('mastery-pool-icon', {
            parent: this.lowerGrants
        });
        this.intervalIcon = createElement('interval-icon', {
            parent: this.lowerGrants
        });
        hideElement(this.lowerGrants);
        this.progressBar.setStyle('bg-woodcutting');
    }
    createTreeMenus(game) {
        game.woodcutting.sortedMasteryActions.forEach((action) => {
            const treeMenu = new WoodcuttingTreeElement();
            treeMenu.className = 'col-6 col-md-4 col-lg-4 col-xl-3';
            treeMenu.setTree(action, game.woodcutting);
            this.treeContainer.append(treeMenu);
            this.treeMenus.set(action, treeMenu);
            treeMenu.setMastery(game.woodcutting, action);
            game.woodcutting.updateMasteryDisplays(action);
        });
    }
    updateTreeRates(woodcutting) {
        this.treeMenus.forEach((menu, tree) => menu.updateRates(tree, woodcutting));
    }
    updateTreeUnlocks(game) {
        game.woodcutting.sortedMasteryActions.forEach((tree, i) => {
            const menu = this.treeMenus.get(tree);
            if (menu === undefined)
                throw new Error(`Error updating tree unlocks, menu does not exist for tree: ${tree.id}`);
            if (game.woodcutting.isTreeUnlocked(tree)) {
                menu.setTreeUnlocked();
                menu.updateTreeVisibility(tree, game.woodcutting);
            } else {
                menu.setTreeLocked(tree, game);
                menu.updateTreeVisibility(tree, game.woodcutting);
            }
        });
    }
    setTrees(trees) {
        let i = 0;
        trees.forEach((tree) => {
            if (this.treeGrants.length <= i) {
                const container = createElement('div', {
                    className: 'row justify-content-center mr-2 ml-2 icon-size-48'
                });
                const itemIcon = createElement('item-quantity-icon', {
                    parent: container
                }); // Does not allow quickbuy
                const masteryXPIcon = createElement('mastery-xp-icon', {
                    parent: container
                });
                this.infoMessage.after(container);
                // Grants do not exist need to create them
                this.treeGrants.push({
                    itemIcon,
                    masteryXPIcon,
                    container,
                });
            }
            i++;
        });
        for (let i = this.treeGrants.length - 1; i >= trees.size; i--) {
            this.destroyTreeGrants(this.treeGrants[i]);
            this.treeGrants.pop();
        }
        // Set the tree menu progress bars to full/unfull
        this.selectedTrees.forEach((tree) => {
            var _a;
            if (!trees.has(tree)) {
                (_a = this.treeMenus.get(tree)) === null || _a === void 0 ? void 0 : _a.setInactive();
                this.selectedTrees.delete(tree);
            }
        });
        trees.forEach((tree) => {
            var _a;
            if (!this.selectedTrees.has(tree)) {
                (_a = this.treeMenus.get(tree)) === null || _a === void 0 ? void 0 : _a.setActive();
                this.selectedTrees.add(tree);
            }
        });
        this.updateSelectedTrees();
    }
    destroyTreeGrants(treeGrant) {
        this.grantsContainer.removeChild(treeGrant.container);
    }
    /** Updates the currently selected tree icons */
    updateSelectedTrees() {
        let i = 0;
        this.selectedTrees.forEach((tree) => {
            const treeGrant = this.treeGrants[i];
            treeGrant.itemIcon.setItem(tree.product, Math.floor(game.woodcutting.getTreeMultiplier(tree)));
            treeGrant.masteryXPIcon.setXP(this.woodcutting.getTreeMasteryXP(tree), this.woodcutting.getBaseTreeMasteryXP(tree));
            treeGrant.masteryXPIcon.setSources(game.woodcutting.getMasteryXPSources(tree));
            this.poolXPIcon.setRealm(tree.realm);
            i++;
        });
        if (this.selectedTrees.size > 0) {
            hideElement(this.infoMessage);
            showElement(this.lowerGrants);
            this.xpIcon.setXP(this.woodcutting.totalXPToAdd, this.woodcutting.baseXPToAdd);
            this.xpIcon.setSources(game.woodcutting.getXPSources(Array.from(this.selectedTrees)[0]));
            this.poolXPIcon.setXP(this.woodcutting.totalPoolXPToAdd);
            this.intervalIcon.setInterval(this.woodcutting.actionInterval, this.woodcutting.getIntervalSources(Array.from(this.selectedTrees)[0]));
            this.abyssalXPIcon.setXP(this.woodcutting.totalAbyssalXPToAdd, this.woodcutting.baseAbyssalXPToAdd);
            this.abyssalXPIcon.setSources(game.woodcutting.getAbyssalXPSources(Array.from(this.selectedTrees)[0]));
            if (this.woodcutting.baseAbyssalXPToAdd > 1)
                showElement(this.abyssalXPIcon);
            else
                hideElement(this.abyssalXPIcon);
        } else {
            showElement(this.infoMessage);
            hideElement(this.lowerGrants);
        }
    }
}
//# sourceMappingURL=woodcuttingMenu.js.map
checkFileVersion('?12097')