"use strict";
class EffectRenderer {
    constructor(iconContainer, progressBarContainer, progressIconContainer) {
        this.iconContainer = iconContainer;
        this.progressBarContainer = progressBarContainer;
        this.progressIconContainer = progressIconContainer;
        this.icons = new Map();
        this.progressBarPool = [];
        this.progressBars = new Map();
        this.removalQueue = new Set();
    }
    /** Renders an effect */
    removeEffects() {
        // Remove everything from the removal queue
        this.removalQueue.forEach((activeEffect) => {
            const icon = this.icons.get(activeEffect);
            if (icon !== undefined) {
                this.iconContainer.removeChild(icon.container);
                icon.tooltip.destroy();
                this.icons.delete(activeEffect);
            }
            const progressBar = this.progressBars.get(activeEffect);
            if (progressBar !== undefined) {
                // Make the bar invisible and return it to the object pool
                progressBar.barContainer.classList.add('invisible');
                progressBar.iconSpan.classList.add('invisible');
                this.progressBars.delete(activeEffect);
                this.progressBarPool.push(progressBar);
            }
        });
        this.flushRemovalQueue();
    }
    /** Clears the removal queue */
    flushRemovalQueue() {
        this.removalQueue.clear();
    }
    /** Adds a new icon for an active effect */
    createEffect(icon, turns, tooltipContent) {
        const container = document.createElement('div');
        container.classList.add('overlay-container', 'overlay-bottom');
        const image = document.createElement('img');
        image.classList.add('mastery-icon-sm', 'mr-2');
        image.src = icon;
        const text = document.createElement('div');
        text.classList.add('overlay-item', 'mr-1', 'font-w700');
        text.textContent = turns;
        container.appendChild(image);
        container.appendChild(text);
        this.iconContainer.appendChild(container);
        return {
            container: container,
            icon: image,
            number: text,
            tooltip: this.createTooltip(container, tooltipContent),
        };
    }
    /** Creates a tooltip instance for an icon */
    createTooltip(element, content) {
        return tippy(element, {
            content: content,
            allowHTML: true,
            placement: 'bottom',
            interactive: false,
            animation: false,
        });
    }
    /** If the activeEffect is already rendered, updates its turnText and tooltip, else adds a new icon */
    addEffectIcon(activeEffect, turnText, tooltipContent, media) {
        const existingEffect = this.icons.get(activeEffect);
        if (existingEffect === undefined) {
            const newEffect = this.createEffect(media, turnText, tooltipContent);
            this.icons.set(activeEffect, newEffect);
        } else {
            existingEffect.number.textContent = turnText;
            existingEffect.tooltip.setContent(tooltipContent);
        }
    }
    /** Gets a progress bar for use. Attempts to remove one from the pool first before creating a new one */
    getProgressBar() {
        const progressBar = this.progressBarPool.pop();
        if (progressBar !== undefined)
            return progressBar;
        const iconSpan = createElement('span', {
            className: 'font-w700 align-middle ml-2 invisible',
            parent: this.progressIconContainer,
        });
        const image = createElement('img', {
            className: 'skill-icon-xs mr-1',
            parent: iconSpan
        });
        const current = createElement('span', {
            parent: iconSpan
        });
        createElement('span', {
            text: '/',
            className: 'font-size-xs font-w400',
            parent: iconSpan
        });
        const max = createElement('span', {
            parent: iconSpan
        });
        const tooltip = this.createTooltip(iconSpan, createElement('div'));
        const barContainer = createElement('div', {
            className: 'row m-0 position-relative invisible',
            parent: this.progressBarContainer,
        });
        const barExt = createElement('div', {
            className: 'progress combat active mt-1 col-12 p-0 height-6',
            parent: barContainer,
        });
        const bar = createElement('div', {
            className: 'progress-bar',
            attributes: [
                ['role', 'progressbar'],
                ['aria-valuenow', '0'],
                ['aria-valuemin', '0'],
                ['aria-valuemax', '100'],
            ],
            parent: barExt,
        });
        return {
            tooltip,
            barContainer,
            bar,
            iconSpan,
            image,
            current,
            max,
        };
    }
    addEffectProgressBar(activeEffect, progressBar) {
        const effect = activeEffect.effect;
        let existing = this.progressBars.get(activeEffect);
        const currentValue = progressBar.currentValue(activeEffect);
        const maxValue = progressBar.maxValue(activeEffect);
        const percent = clampValue((currentValue / maxValue) * 100, 0, 100);
        const isFull = maxValue === currentValue;
        const tooltipContent = this.getTooltipContent(activeEffect);
        if (existing === undefined) {
            existing = this.getProgressBar();
            existing.barContainer.classList.remove('invisible');
            existing.bar.classList.add(progressBar.barStyle);
            existing.iconSpan.classList.remove('invisible');
            existing.image.src = effect.media;
            this.progressBars.set(activeEffect, existing);
        }
        existing.current.textContent = `${currentValue}`;
        existing.max.textContent = `${maxValue}`;
        existing.tooltip.setContent(tooltipContent);
        existing.bar.style.width = `${percent}%`;
        if (isFull) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            progressBar.fullStyles.forEach((s) => existing.bar.classList.add(s));
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            progressBar.fullStyles.forEach((s) => existing.bar.classList.remove(s));
        }
    }
    /** Adds/Updates the rendering of an active combat effect */
    add(activeEffect) {
        const effect = activeEffect.effect;
        if (!effect.noIcon) {
            let turnText = '';
            if (activeEffect.effect.turnText !== undefined)
                turnText = `${activeEffect.effect.turnText(activeEffect)}`;
            this.addEffectIcon(activeEffect, turnText, this.getTooltipContent(activeEffect), activeEffect.effect.media);
        }
        if (effect.progressBar !== undefined)
            this.addEffectProgressBar(activeEffect, effect.progressBar);
    }
    getTooltipContent(activeEffect) {
        const effect = activeEffect.effect;
        const tooltipContent = createElement('div', {
            className: 'justify-vertical-center text-center'
        });
        createElement('span', {
            className: 'text-warning',
            text: effect.name,
            parent: tooltipContent
        });
        effect.tooltipSpans.forEach((ttSpan) => {
            if (!ttSpan.shouldShow(activeEffect))
                return;
            tooltipContent.append(...ttSpan.getSpans(activeEffect));
        });
        return tooltipContent;
    }
    /** Queues the removal of an effect */
    queueRemoval(activeEffect) {
        // Queue is only added to if the effect is already rendered. This will prevent memory leaks.
        if (this.icons.get(activeEffect))
            this.removalQueue.add(activeEffect);
        if (this.progressBars.get(activeEffect))
            this.removalQueue.add(activeEffect);
    }
    queueRemoveAll() {
        this.icons.forEach((_, activeEffect) => {
            this.queueRemoval(activeEffect);
        });
        this.progressBars.forEach((_, activeEffect) => {
            this.queueRemoval(activeEffect);
        });
    }
}
const effectMedia = {
    offenseUp: 'assets/media/status/attack_increase.png',
    defenseUp: 'assets/media/status/evasion_increase.png',
    offenseDown: 'assets/media/status/attack_decrease.png',
    defenseDown: 'assets/media/status/evasion_decrease.png',
    frozen: 'assets/media/status/frozen.png',
    stun: 'assets/media/status/stunned.png',
    sleep: 'assets/media/status/sleep.png',
    slowed: 'assets/media/status/slowed.png',
    markOfDeath: 'assets/media/misc/mark_of_death.png',
    afflicted: 'assets/media/misc/afflicted.png',
    speedup: 'assets/media/status/speedup.png',
    frostBurn: 'assets/media/status/frostburn.png',
    decay: 'assets/media/skills/magic/decay.png',
    madness: 'assets/media/bank/Mask_of_Madness.png',
    torment: 'assets/media/bank/Mask_of_Torment.png',
    despair: 'assets/media/bank/Mask_of_Despair.png',
    stunImmunity: 'assets/media/status/stun_immunity.png',
    shocked: 'assets/media/status/shocked.png',
    crystallize: 'assets/media/status/crystallized.png',
    crystalSanction: 'assets/media/status/crystal_sanction.png',
};
const dotMedia = {
    Burn: 'assets/media/main/burn.png',
    Bleed: 'assets/media/misc/blood.png',
    Poison: 'assets/media/status/poison.png',
    Regen: 'assets/media/status/regen_increase.png',
    DeadlyPoison: 'assets/media/status/poison.png',
    BarrierBleed: 'assets/media/misc/blood.png',
    BarrierBurn: 'assets/media/main/burn.png',
};
//# sourceMappingURL=effectRenderer.js.map
checkFileVersion('?12097')