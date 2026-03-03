export function patchBackground(ctx) {
    window.setBackground = function (id) { // Save data stores the background option as an Int8, which means we have a max of 128 possible choices here.
                                            // So in average it will take until 2200 to fill these options up.
    
        const els = document.querySelectorAll('bg-selection');

        let url;
        if (id >= 100) {
            url = ctx.getResourceUrl(`assets/others/custom${id - 99}.webp`);
        } else {
            url = assets.getURI(`assets/media/main/bg_${id}.jpg`);
        }

        els.forEach(el => {
            el.style.backgroundImage = `url('${url}')`;
        });
    };

    const backg = game.settings.choiceData.backgroundImage;
    backg.options.push({
        value: 100,
        name: `<img src='${ctx.getResourceUrl('assets/others/custom1.webp')}' style="width:256px"/>`
    });

    window.setGameBackgroundImage = function (image) {
        const currentImage = localStorage.getItem('setBackground');
        const bodyEls = document.getElementsByTagName('body');

        Array.from(bodyEls).forEach((element) => {
            if (currentImage === null) {
                element.classList.remove('bg3');
            } else {
                element.classList.forEach(cls => {
                    if (cls.startsWith('bg')) element.classList.remove(cls);
                });
            }

            if (image >= 100) {
                element.classList.forEach(cls => {
                    if (cls.startsWith('bg-')) element.classList.remove(cls);
                });

                const customClass = `bg-${image}`;
                element.classList.add(customClass);

                let styleEl = document.getElementById(customClass);
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = customClass;
                    styleEl.textContent = `
                        body.${customClass}::before {
                            background-image: url('${ctx.getResourceUrl(`assets/others/custom${image - 99}.webp`)}');
                        }
                    `;
                    document.head.appendChild(styleEl);
                }

                element.style.backgroundImage = `url('${ctx.getResourceUrl(`assets/others/custom${image - 99}.webp`)}')`;
            } else {
                element.classList.add(`bg${image}`);
                element.style.backgroundImage = `url('${assets.getURI(`assets/media/main/bg_${image}.jpg`)}')`;
            }
        });

        const previewEls = document.getElementsByClassName('bg-selection');
        Array.from(previewEls).forEach((el) => {
            let url;
            if (image >= 100) {
                url = ctx.getResourceUrl(`assets/others/custom${image - 99}.webp`);
            } else {
                url = assets.getURI(`assets/media/main/bg_${image}.jpg`);
            }
            el.style.backgroundImage = `url('${url}')`;
        });

        localStorage.setItem('setBackground', image);
    };
}
