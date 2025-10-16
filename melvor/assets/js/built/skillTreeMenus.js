"use strict";
class SkillTreeButtonElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-tree-button-template'));
        this.viewBtn = getElementFromFragment(this._content, 'view-button', 'button');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setSkill(skill) {
        this.viewBtn.onclick = () => skill.openSkillTreeModal();
    }
}
window.customElements.define('skill-tree-button', SkillTreeButtonElement);
class SkillTreeNodeInfoElement extends HTMLElement {
    constructor() {
        super();
        this.costElements = [];
        this.requirementElements = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-tree-node-info-template'));
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.stats = getElementFromFragment(this._content, 'stats', 'div');
        this.requirements = getElementFromFragment(this._content, 'requirements', 'div');
        this.costs = getElementFromFragment(this._content, 'costs', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    setNode(tree, node) {
        this.name.textContent = node.shortName;
        this.stats.innerHTML = node.stats.describeLineBreak();
        this.clearCosts();
        this.updateStatus(tree, node);
    }
    clearRequirements() {
        this.requirements.textContent = '';
        this.requirementElements = [];
        hideElement(this.requirements);
    }
    setRequirements(node) {
        this.requirements.textContent = '';
        this.requirementElements = [];
        if (node.parents !== undefined) {
            const elem = createElement('span', {
                className: 'text-danger',
                text: getLangString('MENU_TEXT_SKILL_TREE_REQUIRES_UNLOCKING'),
                parent: this.requirements,
            });
            this.requirementElements.push(elem);
        }
        node.requirements.forEach((requirement) => {
            const elem = createElement('span', {
                className: 'text-danger',
                children: requirement.getNodes('skill-icon-xs mx-1'),
                parent: this.requirements,
            });
            this.requirementElements.push(elem);
        });
        showElement(this.requirements);
    }
    clearCosts() {
        this.costElements.forEach((e) => e.remove());
        this.costElements = [];
        hideElement(this.costs);
    }
    setCosts(tree, node) {
        this.costElements.forEach((e) => e.remove());
        this.costElements = [];
        const costs = tree.getNodeCosts(node);
        let i = 0;
        if (node.costs.points) {
            const elem = createElement('span', {
                className: 'text-danger',
                text: node.costs.points > 1 ?
                    templateLangString('SKILL_TREE_POINT_PLURAL', {
                        qty: `${node.costs.points}`,
                    }) :
                    templateLangString('SKILL_TREE_POINT', {
                        qty: `${node.costs.points}`,
                    }),
                parent: this.costs,
            });
            this.costElements.push(elem);
            i++;
        }
        costs.getItemQuantityArray().forEach(({
            item,
            quantity
        }) => {
            this.costElements.push(this.createCost(item.media, `${numberWithCommas(quantity)} ${item.name}`));
            i++;
        });
        costs.getCurrencyQuantityArray().forEach(({
            currency,
            quantity
        }) => {
            this.costElements.push(this.createCost(currency.media, currency.formatAmount(formatNumber(quantity))));
            i++;
        });
        showElement(this.costs);
    }
    createCost(media, text) {
        const elem = createElement('span', {
            className: 'text-danger'
        });
        createElement('img', {
            className: 'skill-icon-xs mr-2',
            attributes: [
                ['src', media]
            ],
            parent: elem
        });
        elem.append(text);
        return elem;
    }
    updateStatus(tree, node) {
        if (node.isUnlocked) {
            this.clearRequirements();
            this.clearCosts();
        } else if (node.canUnlock) {
            this.clearRequirements();
            if (!this.costElements.length) {
                this.setCosts(tree, node);
                this.updateCosts(tree, node);
            }
        } else {
            if (!this.requirementElements.length)
                this.setRequirements(node);
            this.updateRequirements(node);
            this.clearCosts();
        }
    }
    updateRequirements(node) {
        if (!this.requirementElements.length)
            return;
        let i = 0;
        const updateElem = (met) => {
            const elem = this.requirementElements[i];
            toggleDangerSuccess(elem, met);
            i++;
        };
        if (node.parents !== undefined)
            updateElem(node.parentsUnlocked);
        node.requirements.forEach((requirement) => updateElem(game.checkRequirement(requirement)));
    }
    updateCosts(tree, node) {
        if (!this.costElements.length)
            return;
        const costs = tree.getNodeCosts(node);
        let i = 0;
        const updateElem = (met) => {
            const elem = this.costElements[i];
            toggleDangerSuccess(elem, met);
            i++;
        };
        if (node.costs.points)
            updateElem(tree.points >= node.costs.points);
        costs.getItemQuantityArray().forEach(({
            item,
            quantity
        }) => updateElem(game.bank.getQty(item) >= quantity));
        costs.getCurrencyQuantityArray().forEach(({
            currency,
            quantity
        }) => updateElem(currency.canAfford(quantity)));
    }
}
window.customElements.define('skill-tree-node-info', SkillTreeNodeInfoElement);
class SkillTreeNodeIconElement extends HTMLElement {
    constructor() {
        super();
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-tree-node-icon-template'));
        this.name = getElementFromFragment(this._content, 'name', 'span');
        this.iconImage = getElementFromFragment(this._content, 'icon-image', 'img');
        this.lockedImage = getElementFromFragment(this._content, 'locked-image', 'img');
        this.description = getElementFromFragment(this._content, 'description', 'div');
        this.pointCost = getElementFromFragment(this._content, 'point-cost', 'span');
        this.tooltipContent = createElement('skill-tree-node-info');
        this.iconImage.oncontextmenu = (e) => e.preventDefault();
        this.lockedImage.oncontextmenu = (e) => e.preventDefault();
    }
    connectedCallback() {
        this.appendChild(this._content);
        this.tooltip = tippy(this, {
            content: this.tooltipContent,
            placement: 'top',
            allowHTML: true,
            interactive: false,
            animation: false,
            touch: 'hold',
        });
    }
    disconnectedCallback() {
        if (this.tooltip !== undefined) {
            this.tooltip.destroy();
            this.tooltip = undefined;
        }
    }
    setNode(tree, node) {
        this.name.textContent = node.shortName;
        this.iconImage.src = assets.getURI('assets/media/skillTree/locked_bg.png');
        this.onclick = () => tree.onNodeIconClick(node);
        this.tooltipContent.setNode(tree, node);
        this.updateImage(tree, node);
        this.updatePointCost(tree, node);
        this.updateModifiers(tree, node);
    }
    updateImage(tree, node) {
        this.iconImage.classList.remove('border-danger', 'border-success', 'border-warning', 'desaturate-50');
        if (node.isUnlocked) {
            this.lockedImage.src = assets.getURI('assets/media/skillTree/tick.png');
            this.iconImage.src = assets.getURI('assets/media/skillTree/unlocked_bg.png');
            showElement(this.lockedImage);
            hideElement(this.pointCost);
            this.iconImage.classList.add('border-success');
        } else if (node.canUnlock) {
            this.iconImage.src = assets.getURI('assets/media/skillTree/ready_bg.png');
            hideElement(this.lockedImage);
            showElement(this.pointCost);
            this.pointCost.textContent = `${node.costs.points}`;
            this.iconImage.classList.add('border-warning', 'desaturate-50');
        } else {
            this.iconImage.src = assets.getURI('assets/media/skillTree/locked_bg.png');
            this.lockedImage.src = assets.getURI('assets/media/skillTree/locked.png');
            showElement(this.lockedImage);
            hideElement(this.pointCost);
            this.iconImage.classList.add('border-danger', 'desaturate-50');
        }
        if (DEBUGENABLED) {
            this.pointCost.textContent = `${node.costs.points}`;
            showElement(this.pointCost);
        }
    }
    updatePointCost(tree, node) {
        if (tree.points >= node.costs.points) {
            this.pointCost.classList.replace('badge-danger', 'badge-success');
        } else {
            this.pointCost.classList.replace('badge-success', 'badge-danger');
        }
    }
    updateModifiers(tree, node) {
        this.description.textContent = '';
        this.description.append(...node.stats.describeAsSpans());
    }
    updateStatus(tree, node) {
        this.updateImage(tree, node);
        this.tooltipContent.updateStatus(tree, node);
    }
    updateCosts(tree, node) {
        this.tooltipContent.updateCosts(tree, node);
        this.updatePointCost(tree, node);
    }
}
window.customElements.define('skill-tree-node-icon', SkillTreeNodeIconElement);
class SkillTreeRenderQueue {
    constructor() {
        this.requirements = false;
        this.costs = false;
        this.currentPoints = false;
        this.dropdownPoints = new Set();
    }
}
class SkillTreeMenuElement extends HTMLElement {
    constructor() {
        super();
        this.dropdownItemMap = new Map();
        this.nodeIcons = [];
        this.nodeIconMap = new Map();
        this.edges = [];
        this.zoomLevel = 3;
        this.renderQueue = new SkillTreeRenderQueue();
        this.eventUnlisteners = [];
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('skill-tree-menu-template'));
        this.nodeScrollContainer = getElementFromFragment(this._content, 'node-scroll-container', 'div');
        this.nodeContainer = getElementFromFragment(this._content, 'node-container', 'div');
        this.zoomIn = getElementFromFragment(this._content, 'zoom-in', 'button');
        this.zoomOut = getElementFromFragment(this._content, 'zoom-out', 'button');
        this.pointsCount = getElementFromFragment(this._content, 'points-count', 'span');
        this.edgeContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.edgeContainer.setAttribute('height', '100%');
        this.edgeContainer.setAttribute('width', '100%');
        this.edgeContainer.setAttribute('preserveAspectRatio', 'none');
        this.edgeContainer.classList.add('position-absolute', 'h-100', 'w-100');
        this.dropdownBtn = getElementFromFragment(this._content, 'btn-skill-trees-dropdown', 'button');
        this.dropdownItems = getElementFromFragment(this._content, 'skill-trees-dropdown-items', 'div');
        this.nodeContainer.append(this.edgeContainer);
        this.zoomIn.onclick = () => this.onZoomIn();
        this.zoomOut.onclick = () => this.onZoomOut();
        this.elementScrollDragger = new ElementScrollDragger(this.nodeScrollContainer);
    }
    get currentSkillTree() {
        return this._currentSkillTree;
    }
    get sizeScale() {
        return SkillTreeMenuElement.CONFIG.ZOOM_LEVELS[this.zoomLevel];
    }
    initialize(game) {
        game.skillTreesDisplayOrder.forEach((skill) => {
            if (skill.hasSkillTree)
                this.createDropdownItem(skill);
        });
    }
    createDropdownItem(skill) {
        const item = document.createElement('a');
        item.classList.add('dropdown-item', 'pointer-enabled');
        item.append(this.getSkillItem(skill));
        item.append(skill.name);
        const currentPoints = createElement('span', {
            classList: ['text-success']
        });
        item.append(currentPoints);
        this.dropdownItemMap.set(skill, currentPoints);
        item.onclick = () => {
            skill.openSkillTreeModal();
        };
        this.dropdownItems.append(item);
    }
    updateDropdownItem(skill) {
        const menu = this.dropdownItemMap.get(skill);
        if (menu !== undefined && skill.hasSkillTree) {
            const skillTree = skill.skillTrees.getObjectSafe('melvorItA:Abyssal');
            if (skillTree.points > 0) {
                menu.textContent = ` (${skillTree.points})`;
                const canAffordNode = skillTree.canAffordAnyNode();
                toggleDangerSuccess(menu, canAffordNode);
            } else {
                menu.textContent = '';
            }
        }
    }
    getSkillItem(skill) {
        const img = document.createElement('img');
        img.classList.add('nav-img');
        img.src = skill.media;
        return img;
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    getNodeIcon(node) {
        return this.nodeIconMap.get(node);
    }
    updateMenu(skill) {
        this.dropdownBtn.innerHTML = '';
        this.dropdownBtn.append(this.getSkillItem(skill));
        this.dropdownBtn.append(skill.name);
    }
    setSkillTree(tree, game) {
        var _a, _b;
        this.unassignRenderListeners();
        this._currentSkillTree = tree;
        this.assignRenderListeners(tree, game);
        this.pointsCount.textContent = numberWithCommas(tree.points);
        toggleDangerSuccess(this.pointsCount, tree.points > 0);
        this.nodeIcons.forEach((icon) => icon.remove());
        while (this.nodeIcons.length < tree.nodes.size) {
            const nodeIcon = createElement('skill-tree-node-icon');
            nodeIcon.classList.add('flex', 'flex-grow');
            this.nodeIcons.push(nodeIcon);
        }
        this.nodeIconMap.clear();
        const layout = this.computeLayout(tree);
        const graph = layout.graph();
        const GRAPH_HEIGHT = (_a = graph.height) !== null && _a !== void 0 ? _a : 1;
        const GRAPH_WIDTH = (_b = graph.width) !== null && _b !== void 0 ? _b : 1;
        let i = 0;
        let totalPoints = 0;
        tree.nodes.forEach((node) => {
            const icon = this.nodeIcons[i];
            this.nodeIconMap.set(node, icon);
            icon.setNode(tree, node);
            this.setIconPosition(icon, layout.node(node.id));
            this.nodeContainer.append(icon);
            totalPoints += node.costs.points;
            i++;
        });
        this.edgeContainer.innerHTML = '';
        this.edges = [];
        layout.edges().forEach((graphEdge) => {
            const from = tree.nodes.getObjectByID(graphEdge.v);
            const to = tree.nodes.getObjectByID(graphEdge.w);
            const {
                points
            } = layout.edge(graphEdge);
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', this.computeEdgePath(points));
            path.classList.add('stroke-width-3x');
            path.setAttribute('fill', 'none');
            const edge = {
                from,
                to,
                path,
            };
            this.updateEdge(edge);
            this.edgeContainer.append(path);
            this.edges.push(edge);
        });
        this.edgeContainer.setAttribute('viewBox', `0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`);
        this.nodeContainer.style.width = `${GRAPH_WIDTH}px`;
        this.nodeContainer.style.height = `${GRAPH_HEIGHT}px`;
        game.skills.forEach((skill) => {
            if (skill.hasSkillTree)
                this.updateDropdownItem(skill);
        });
    }
    setIconPosition(icon, position) {
        icon.style.width = `${position.width}px`;
        icon.style.height = `${position.height}px`;
        icon.style.left = `${position.x - position.width / 2}px`;
        icon.style.top = `${position.y - position.height / 2}px`;
    }
    computeEdgePath(points) {
        let d = '';
        points.forEach((p, i) => {
            let point = Point.fromData(p);
            if (i === 0) {
                // Extend the starting point
                const nextPoint = Point.fromData(points[1]);
                point = Point.sub(nextPoint, Point.mult(Point.sub(nextPoint, point), 1.1));
            } else if (i == points.length - 1) {
                // Extend the end point
                const lastPoint = Point.fromData(points[points.length - 2]);
                point = Point.add(Point.mult(Point.sub(point, lastPoint), 1.1), lastPoint);
            }
            switch (i) {
                case 0:
                    d += `M${point.x},${point.y} `;
                    break;
                default:
                    d += `L${point.x},${point.y} `;
                    break;
            }
        });
        return d;
    }
    computeLayout(tree) {
        const g = new dagre.graphlib.Graph();
        g.setGraph({
            nodesep: SkillTreeMenuElement.CONFIG.NODE_SEPERATION * this.sizeScale,
            edgesep: SkillTreeMenuElement.CONFIG.EDGE_SEPERATION * this.sizeScale,
            ranksep: SkillTreeMenuElement.CONFIG.RANK_SEPERATION * this.sizeScale,
            marginx: SkillTreeMenuElement.CONFIG.MARGIN_X * this.sizeScale,
        });
        g.setDefaultEdgeLabel(() => ({}));
        const NODE_WIDTH = SkillTreeMenuElement.CONFIG.NODE_WIDTH * this.sizeScale;
        const NODE_HEIGHT = SkillTreeMenuElement.CONFIG.NODE_HEIGHT * this.sizeScale;
        // Add nodes to the graph
        tree.nodes.forEach((node) => {
            g.setNode(node.id, {
                width: NODE_WIDTH,
                height: NODE_HEIGHT
            });
        });
        // Add edges to the graph
        tree.nodes.forEach((node) => {
            node.children.forEach((child) => {
                g.setEdge(node.id, child.id);
            });
        });
        // Compute the layout of the graph
        dagre.layout(g);
        return g;
    }
    onZoomChange() {
        var _a, _b;
        if (this._currentSkillTree === undefined)
            return;
        const tree = this._currentSkillTree;
        const layout = this.computeLayout(tree);
        const graph = layout.graph();
        const GRAPH_HEIGHT = (_a = graph.height) !== null && _a !== void 0 ? _a : 1;
        const GRAPH_WIDTH = (_b = graph.width) !== null && _b !== void 0 ? _b : 1;
        this.nodeIconMap.forEach((icon, node) => {
            this.setIconPosition(icon, layout.node(node.id));
        });
        this.edges.forEach((edge) => {
            const {
                points
            } = layout.edge({
                v: edge.from.id,
                w: edge.to.id
            });
            edge.path.setAttribute('d', this.computeEdgePath(points));
        });
        this.edgeContainer.setAttribute('viewBox', `0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`);
        this.nodeContainer.style.width = `${GRAPH_WIDTH}px`;
        this.nodeContainer.style.height = `${GRAPH_HEIGHT}px`;
    }
    onZoomIn() {
        if (this.zoomLevel === 0)
            return;
        this.zoomLevel--;
        if (this.zoomLevel === 0)
            this.zoomIn.disabled = true;
        this.zoomOut.disabled = false;
        this.onZoomChange();
    }
    onZoomOut() {
        const maxLevel = SkillTreeMenuElement.CONFIG.ZOOM_LEVELS.length - 1;
        if (this.zoomLevel === maxLevel)
            return;
        this.zoomLevel++;
        if (this.zoomLevel === maxLevel)
            this.zoomOut.disabled = true;
        this.zoomIn.disabled = false;
        this.onZoomChange();
    }
    updateEdge(edge) {
        edge.path.classList.remove('stroke-success', 'stroke-warning', 'stroke-danger');
        if (edge.to.isUnlocked) {
            edge.path.classList.add('stroke-success');
        } else if (edge.to.canUnlock) {
            edge.path.classList.add('stroke-warning');
        } else {
            edge.path.classList.add('stroke-danger');
        }
    }
    assignRenderListeners(tree, game) {
        const onRequirementChange = () => {
            this.renderQueue.requirements = true;
        };
        game.on('requirementChange', onRequirementChange);
        this.eventUnlisteners.push(() => game.off('requirementChange', onRequirementChange));
        const onCostsChange = () => {
            this.renderQueue.costs = true;
        };
        game.bank.on('itemChanged', onCostsChange);
        this.eventUnlisteners.push(() => game.bank.off('itemChanged', onCostsChange));
        game.currencies.forEach((currency) => {
            currency.on('amountChanged', onCostsChange);
            this.eventUnlisteners.push(() => currency.off('amountChanged', onCostsChange));
        });
        const onPointsChange = () => {
            onCostsChange();
            this.renderQueue.currentPoints = true;
        };
        tree.on('pointsChanged', onPointsChange);
        this.eventUnlisteners.push(() => tree.off('pointsChanged', onPointsChange));
    }
    unassignRenderListeners() {
        this.eventUnlisteners.forEach((unlistener) => unlistener());
        this.eventUnlisteners = [];
    }
    onClose() {
        this.unassignRenderListeners();
        this._currentSkillTree = undefined;
    }
    render() {
        this.renderDropdownPoints();
        if (this._currentSkillTree === undefined)
            return;
        this.renderNodeRequirements(this._currentSkillTree);
        this.renderNodeCosts(this._currentSkillTree);
        this.renderCurrentPoints(this._currentSkillTree);
    }
    renderNodeRequirements(tree) {
        if (!this.renderQueue.requirements)
            return;
        this.nodeIconMap.forEach((menu, node) => {
            menu.updateStatus(tree, node);
        });
        this.edges.forEach((edge) => this.updateEdge(edge));
        this.renderQueue.requirements = false;
    }
    renderNodeCosts(tree) {
        if (!this.renderQueue.costs)
            return;
        this.nodeIconMap.forEach((menu, node) => {
            menu.updateCosts(tree, node);
        });
        this.renderQueue.costs = false;
    }
    renderCurrentPoints(tree) {
        if (!this.renderQueue.currentPoints)
            return;
        this.pointsCount.textContent = numberWithCommas(tree.points);
        toggleDangerSuccess(this.pointsCount, tree.points > 0);
        this.renderQueue.currentPoints = false;
    }
    renderDropdownPoints() {
        if (this.renderQueue.dropdownPoints.size === 0)
            return;
        this.renderQueue.dropdownPoints.forEach((skill) => {
            this.updateDropdownItem(skill);
        });
        this.renderQueue.dropdownPoints.clear();
    }
}
SkillTreeMenuElement.CONFIG = {
    NODE_WIDTH: 300,
    NODE_HEIGHT: 200,
    MARGIN_X: 50,
    NODE_SEPERATION: 75,
    EDGE_SEPERATION: 10,
    RANK_SEPERATION: 75,
    ZOOM_LEVELS: [2, 1.5, 1, 0.75, 0.5],
};
class ElementScrollDragger {
    constructor(element) {
        this.isDown = false;
        this.preventClick = false;
        this.startX = 0;
        this.scrollLeft = 0;
        this.slider = element;
        if (this.slider === null)
            throw new Error('ElementScrollDragger: Element not found');
        this.init();
    }
    init() {
        this.slider.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.slider.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.slider.addEventListener('mouseup', () => this.handleMouseUp());
        this.slider.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.slider.addEventListener('click', (e) => this.handleClick(e));
    }
    handleMouseDown(e) {
        this.isDown = true;
        disableSwipeEvents = true;
        this.slider.classList.add('active');
        const pageX = e.pageX;
        this.startX = pageX - this.slider.offsetLeft;
        this.scrollLeft = this.slider.scrollLeft;
        this.preventClick = false;
    }
    handleMouseLeave() {
        this.isDown = false;
        disableSwipeEvents = false;
        this.slider.classList.remove('active');
    }
    handleMouseUp() {
        this.isDown = false;
        disableSwipeEvents = false;
        this.slider.classList.remove('active');
    }
    handleMouseMove(e) {
        if (!this.isDown)
            return;
        e.preventDefault();
        const pageX = e.pageX;
        const horizontalWalk = pageX - this.startX;
        this.slider.scrollLeft = this.scrollLeft - horizontalWalk;
        this.preventClick = true;
    }
    handleClick(e) {
        if (this.preventClick) {
            e.preventDefault();
        }
    }
}
//# sourceMappingURL=skillTreeMenus.js.map
checkFileVersion('?12097')