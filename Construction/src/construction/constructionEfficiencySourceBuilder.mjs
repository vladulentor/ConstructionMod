const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export class EfficiencySourceBuilder { // This whole class exists so the tooltip can look nice
    constructor(modifiers, options = {}) {
        this.modifiers = modifiers;
        this.percent = true; // for chance
        this._chanceSpans = [];
        this._potencySpans = [];
        this._chanceTotal = 0;
        this._potencyTotal = 0;

        const { chanceLabel = getLangString('TOTAL'), potencyLabel = chanceLabel } = options;

        // Add total labels upfront
        this._chanceSpans.push(createElement('span', { className: 'text-white text-left col-8 font-w700 pr-2', text: chanceLabel }));
        this._chanceTotalSpan = createElement('span', { className: 'text-warning col-4 text-right pr-2 font-w400' });
        this._chanceSpans.push(this._chanceTotalSpan);

        this._potencySpans.push(createElement('span', { className: 'text-white text-left col-8 font-w700 pl-2', text: potencyLabel }));
        this._potencyTotalSpan = createElement('span', { className: 'construction-victory col-4 pr-0 text-right font-w400' });
        this._potencySpans.push(this._potencyTotalSpan);
    }
    addChanceSources(key, query = ModifierQuery.EMPTY, mult = 1) {
        const result = this.modifiers.query(key, query);

        result.forEach(entry => {
            let value = mult * entry.value;
            if (value === 0) return;
            value = entry.modifier.modifyValue ? entry.modifier.modifyValue(value) : value;
            this._chanceTotal += value;
            // chance is to the right
            const labelClass = 'text-info text-left col-8 pr-2';
            const valueClass = `${entry.modifier.inverted === value < 0 ? 'text-success' : 'text-danger'} col-4 text-center pr-2`;

            // Format as percentage
            const valueString = entry.modifier.formatValue(true, value, 2, true);
            let displayName = entry.source.name;
            if (displayName.startsWith('Twice-Measured Potion')) {
                const match = displayName.match(/(I{1,3}|IV)$/);
                const tier = match ? match[0] : '';
                displayName = `Twc.Msd.${tier}`;
            }
                       if (displayName.startsWith('Steel-Toed Boots'))
                        displayName = "Steel Boots";

            this._chanceSpans.push(
                createElement('span', { className: labelClass, text: `${displayName}:` }),
                createElement('span', { className: valueClass, text: valueString })
            );
        });
    }

    addPotencySources(key, query = ModifierQuery.EMPTY, mult = 1) {
        const result = this.modifiers.query(key, query);
        const baseValue = 2;
        this._potencyTotal += baseValue; //Potency of Efficiency is always base of 2. I mean I guess you could get it lower but it starts at 2

        result.forEach(entry => {
            let value = mult * entry.value;
            if (value === 0) return;

            value = entry.modifier.modifyValue ? entry.modifier.modifyValue(value) : value;

            this._potencyTotal += value;
            const labelClass = 'text-info text-left col-8 pl-2';
            const valueClass = `${entry.modifier.inverted === value < 0 ? 'text-success' : 'text-danger'} col-4 text-center `;

            const valueString = `+${Number.isInteger(value) ? value : (value).toFixed(2)}`;
            
            let displayName = entry.source.name;
                        // I don't like it when an effect name is over 2 lines, it looks ugly. 

            if (displayName.startsWith('Twice-Measured Potion')) {
                const match = displayName.match(/(I{1,3}|IV)$/);
                const tier = match ? match[0] : '';
                displayName = `Twc.Msd.${tier}`;
            }
             if (displayName == 'Chuck the Foreman') {
                displayName = 'Chuck';
            }

             if (displayName == 'Adamant Saw') {
                displayName = 'Adm. Saw';
            }
            if (displayName.startsWith('Steel-Toed Boots'))
                 displayName = "Steel Boots";
            // Push spans
            this._potencySpans.push(
                createElement('span', { className: labelClass, text: `${displayName}:` }),
                createElement('span', { className: valueClass, text: valueString })
            );
        });
        this._potencySpans.push(
            createElement('span', { className: 'text-info text-left col-8 pl-2', text: getRielkLangString('MENU_EFFICIENCY_BASE') }),
            createElement('span', { className: 'text-success col-4 text-center', text: `+${baseValue}` })
        );

    }


    getSpans() {
        this._chanceTotalSpan.textContent = Modifier.formatTotalValue(true, this._chanceTotal, 2, true);
        if (this._potencyTotal >= 3) { this._potencyTotalSpan.classList.remove('text-warning'); this._potencyTotalSpan.classList.add('construction-victory'); }
        this._potencyTotalSpan.textContent = `x${Number.isInteger(this._potencyTotal) ? this._potencyTotal : this._potencyTotal.toFixed(2)}`;

        return {
            chanceSpans: this._chanceSpans,
            potencySpans: this._potencySpans,
        };
    }
}
