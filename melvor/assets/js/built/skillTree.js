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
class SkillTreeNodeCosts extends FixedCosts {
    constructor(data, game) {
        super(data, game);
        /** The number of skill tree points required to purchase the node */
        this.points = 0;
        if (data.points)
            this.points = data.points;
    }
}
class SkillTreeNode extends NamespacedObject {
    constructor(namespace, data, tree, game) {
        super(namespace, data.id);
        this.tree = tree;
        this.game = game;
        /** The child nodes of this node */
        this.children = [];
        this.requirements = [];
        /** Save state property. If the node has been unlocked. */
        this.isUnlocked = false;
        try {
            this._name = data.name;
            if (data.parents !== undefined) {
                this.parents = data.parents.map((nodeID) => {
                    const node = tree.nodes.getObjectSafe(nodeID);
                    node.children.push(this);
                    return node;
                });
            } else {
                tree.root.push(this);
            }
            this.costs = new SkillTreeNodeCosts(data.costs, game);
            this.stats = new StatObject(data, game, `${SkillTreeNode.name} with id "${this.id}"`);
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(SkillTreeNode.name, e, this.id);
        }
    }
    /** The name of this node as it shows in modifier sources */
    get name() {
        return templateLangString('SKILL_TREE_NODE_NAME', {
            skillName: this.tree.skill.name,
            skillTree: this.tree.name,
            number: this._name,
        });
    }
    get shortName() {
        return this._name;
    }
    /** Returns if this node can be unlocked */
    get canUnlock() {
        return this.parentsUnlocked && this.requirementsMet;
    }
    get parentsUnlocked() {
        return this.parents === undefined || this.parents.every((node) => node.isUnlocked);
    }
    get requirementsMet() {
        return this.game.checkRequirements(this.requirements);
    }
    /** Returns if this is a root node of the tree */
    get isRoot() {
        return this.parents === undefined;
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.requirements !== undefined)
                this.requirements = game.getRequirementsFromData(data.requirements);
        } catch (e) {
            throw new DataConstructionError(SkillTreeNode.name, e, this.id);
        }
    }
}
class SkillTreeNodeUnlockedEvent extends GameEvent {
    constructor(tree, node) {
        super();
        this.tree = tree;
        this.node = node;
    }
}
class SkillTree extends NamespacedObject {
    constructor(namespace, data, game, skill) {
        super(namespace, data.id);
        this.game = game;
        this.skill = skill;
        /* #region GameEventEmitter Boilerplate */
        this._events = mitt();
        this.on = this._events.on;
        this.off = this._events.off;
        this.root = [];
        /** List of nodes that have been unlocked */
        this.unlockedNodes = [];
        /** Save property. How many skill points are available to spend. */
        this._points = 0;
        try {
            this._name = data.name;
            if (data.nameLang !== undefined)
                this._nameLang = data.nameLang;
            this._media = data.media;
            this.unlockRequirements = [];
            this.nodes = new NamespaceRegistry(game.registeredNamespaces, SkillTreeNode.name);
            data.nodes.forEach((data) => {
                this.nodes.registerObject(new SkillTreeNode(namespace, data, this, game));
            });
            game.queueForSoftDependencyReg(data, this);
        } catch (e) {
            throw new DataConstructionError(SkillTree.name, e, this.id);
        }
    }
    /* #endregion */
    get media() {
        return this.getMediaURL(this._media);
    }
    get name() {
        if (this._nameLang !== undefined)
            return getLangString(this._nameLang);
        return this._name;
    }
    get points() {
        return this._points;
    }
    registerSoftDependencies(data, game) {
        try {
            if (data.unlockRequirements !== undefined)
                this.unlockRequirements = game.getRequirementsFromData(data.unlockRequirements);
        } catch (e) {
            throw new DataConstructionError(SkillTree.name, e, this.id);
        }
    }
    encode(writer) {
        writer.writeArray(this.nodes.allObjects, (node) => {
            writer.writeNamespacedObject(node);
            writer.writeBoolean(node.isUnlocked);
        });
        writer.writeUint8(this._points);
        return writer;
    }
    decode(reader, version) {
        reader.getArray((reader) => {
            const node = reader.getNamespacedObject(this.nodes);
            const unlocked = reader.getBoolean();
            if (typeof node !== 'string') {
                node.isUnlocked = unlocked;
            }
        });
        this._points = reader.getUint8();
    }
    /** Called for each skill tree on save load. */
    onLoad() {
        this.nodes.forEach((node) => {
            if (node.isUnlocked)
                this.unlockedNodes.push(node);
        });
    }
    getNodeCosts(node) {
        const costs = new Costs(this.game);
        costs.addItemsAndCurrency(node.costs);
        return costs;
    }
    canAffordNode(node) {
        return this.getNodeCosts(node).checkIfOwned() && this._points >= node.costs.points;
    }
    canAffordAnyNode() {
        return this.nodes.some((node) => this.canAffordNode(node) && node.canUnlock && !node.isUnlocked);
    }
    onNodeIconClick(node) {
        return __awaiter(this, void 0, void 0, function*() {
            if (node.isUnlocked || !node.canUnlock)
                return;
            const nodeInfo = createElement('skill-tree-node-info');
            nodeInfo.setNode(this, node);
            const result = yield SwalLocale.fire({
                title: getLangString('SKILL_TREE_UNLOCK_NODE'),
                html: nodeInfo,
                confirmButtonText: getLangString('MENU_TEXT_UNLOCK'),
                showConfirmButton: this.canAffordNode(node),
                showCancelButton: true,
            });
            if (result.isConfirmed)
                this.unlockNode(node);
        });
    }
    unlockNode(node) {
        if (node.isUnlocked || !node.canUnlock)
            return;
        const costs = this.getNodeCosts(node);
        if (this._points < node.costs.points || !costs.checkIfOwned())
            return;
        node.isUnlocked = true;
        this._points -= node.costs.points;
        this._events.emit('pointsChanged', new GameEvent());
        costs.consumeCosts();
        this.onNodeUnlocked(node);
        this.skill.computeProvidedStats(true);
    }
    onNodeUnlocked(node) {
        if (!this.unlockedNodes.includes(node))
            this.unlockedNodes.push(node);
        this._events.emit('nodeUnlocked', new SkillTreeNodeUnlockedEvent(this, node));
        this.game.queueRequirementRenders();
        skillTreeMenu.renderQueue.dropdownPoints.add(this.skill);
    }
    addPoints(amount) {
        this._points += amount;
        skillTreeMenu.renderQueue.dropdownPoints.add(this.skill);
        this._events.emit('pointsChanged', new GameEvent());
    }
    /** Gets the total amount of points spent in this tree */
    getTotalPointsSpent() {
        return this.unlockedNodes.reduce((prev, node) => prev + node.costs.points, 0);
    }
}
class DummySkillTree extends SkillTree {
    constructor(namespace, localID, game) {
        super(namespace, {
            id: localID,
            name: '',
            media: '',
            unlockRequirements: [],
            nodes: [],
        }, game, game.woodcutting);
    }
}
//# sourceMappingURL=skillTree.js.map
checkFileVersion('?12097')