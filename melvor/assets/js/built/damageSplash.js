"use strict";
class SplashManager {
    constructor(container) {
        this.container = container;
        this.queue = [];
        this.splashDelay = 200;
        this.maxSplashes = 10;
    }
    add(splash) {
        if (!game.settings.enableCombatDamageSplashes)
            return;
        this.queue.push(splash);
        if (this.queue.length > this.maxSplashes) {
            this.queue.shift();
        }
    }
    render() {
        if (this.container.offsetParent === null)
            return;
        this.queue.forEach((splash, i) => {
            setTimeout(() => this.renderSplash(splash), i * this.splashDelay);
        });
        this.queue = [];
    }
    renderSplash(splash) {
        const newSplash = document.createElement('div');
        if (splash.text !== undefined)
            newSplash.textContent = splash.text;
        else
            newSplash.textContent = formatNumber(splash.amount);
        newSplash.classList.add('splash-animation', SplashManager.splashClasses[splash.source], 'splash-shadow');
        newSplash.style.left = `${splash.xOffset}%`;
        this.container.appendChild(newSplash);
        newSplash.onanimationend = () => {
            this.container.removeChild(newSplash);
        };
    }
}
SplashManager.splashClasses = {
    Burn: 'text-burn',
    Bleed: 'text-bleed',
    Poison: 'text-poison',
    Regen: 'text-success',
    Attack: 'text-splash-attack',
    Crit: 'text-crit',
    Heal: 'text-success',
    DeadlyPoison: 'text-deadlypoison',
    SummonAttack: 'text-primary',
    BarrierBleed: 'text-bleed',
    BarrierBurn: 'text-burn',
    Laceration: 'text-bleed',
    Voidburst: 'text-voidburst',
    Ablaze: 'text-burn',
    Toxin: 'text-poison', // TODO_C Consider making this unique
};
//# sourceMappingURL=damageSplash.js.map
checkFileVersion('?12097')