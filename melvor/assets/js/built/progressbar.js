"use strict";
class ProgressBarElement extends HTMLElement {
    constructor() {
        super();
        this.currentStyle = 'bg-info';
        this.isStriped = false;
        this.isReversed = false;
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('progress-bar-template'));
        this.outerBar = getElementFromFragment(this._content, 'outer-bar', 'div');
        this.innerBar = getElementFromFragment(this._content, 'inner-bar', 'div');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    animateProgressFromTimer(timer) {
        this.animateProgress((timer.maxTicks - timer.ticksLeft) * TICK_INTERVAL, timer.maxTicks * TICK_INTERVAL);
    }
    /** Animates the progress bar from start to end over the alloted interval */
    animateProgress(elapsedTime, totalTime) {
        if (!game.settings.enableProgressBars)
            return;
        //animation-duration can control how long it lasts
        //animation-delay can control when it starts
        if (this.isStriped)
            this.innerBar.classList.remove(...ProgressBarElement.stripeClasses);
        const delay = -elapsedTime / 1000;
        const duration = totalTime / 1000;
        this.setAnimation('none');
        this.innerBar.style.animation = 'none';
        void this.innerBar.offsetHeight;
        //this.barElem.style.width = '100%';
        this.setAnimation(`${duration}s linear ${delay}s 1 progressBar`);
    }
    animateStriped() {
        if (!game.settings.enableProgressBars)
            return;
        this.setAnimation('');
        this.isStriped = true;
        void this.innerBar.offsetHeight;
        this.innerBar.style.width = '100%';
        this.innerBar.classList.add(...ProgressBarElement.stripeClasses);
    }
    stopAnimation() {
        if (!game.settings.enableProgressBars)
            return;
        void this.innerBar.offsetHeight;
        if (this.isStriped)
            this.innerBar.classList.remove(...ProgressBarElement.stripeClasses);
        this.innerBar.style.width = '0%';
        this.setAnimation('none');
    }
    /** Sets the style class of the progress bar element */
    setStyle(newStyle) {
        this.innerBar.classList.remove(this.currentStyle);
        this.innerBar.classList.add(newStyle);
        this.currentStyle = newStyle;
    }
    setAnimation(animation) {
        this.innerBar.style.animation = animation;
        //this.barElem.style.webkitAnimation = animation;
        if (this.isReversed)
            this.innerBar.style.animationDirection = 'reverse';
    }
    /** Sets the progress bar to a fixed position. Will stop existing progress animations. */
    setFixedPosition(percent) {
        if (this.innerBar.style.animation !== '')
            this.stopAnimation();
        if (this.isReversed)
            percent = 100 - percent;
        this.innerBar.style.width = `${percent}%`;
    }
}
ProgressBarElement.stripeClasses = ['progress-bar-striped', 'progress-bar-animated'];
window.customElements.define('progress-bar', ProgressBarElement);
//# sourceMappingURL=progressbar.js.map
checkFileVersion('?12097')