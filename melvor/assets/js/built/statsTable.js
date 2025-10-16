"use strict";
/** Tables for displaying statistics. Must be initialized with setData method. */
class StatTableElement extends HTMLElement {
    constructor() {
        super();
        this._rows = [];
        this._data = {
            tableID: '',
            borderClass: 'border-settings',
            title: '',
            rows: [],
            trackerKey: 'General',
        };
        this._content = new DocumentFragment();
        this._content.append(getTemplateNode('stat-table-template'));
        this._title = this._content.getElementById('stats-table-title');
        this._title.removeAttribute('id');
        this._body = this._content.getElementById('stats-table-body');
        this._body.removeAttribute('id');
        this._border = this._content.getElementById('stats-table-border');
        this._border.removeAttribute('id');
    }
    connectedCallback() {
        this.appendChild(this._content);
    }
    removeRows() {
        this._body.textContent = '';
        this._rows = [];
    }
    setData(data) {
        this._border.classList.remove(this._data.borderClass);
        this._data = data;
        this.removeRows();
        this._data.rows.forEach((dataRow) => {
            this.addRow(dataRow);
        });
        this._title.textContent = this._data.title;
        this._border.classList.add(data.borderClass);
    }
    addRow(rowData) {
        var _a;
        const rowContent = new DocumentFragment();
        rowContent.append(getTemplateNode('stats-table-row-template'));
        const rowName = rowContent.getElementById('stat-name');
        rowName.removeAttribute('id');
        rowName.textContent = rowData.name;
        const rowValue = rowContent.getElementById('stat-value');
        rowValue.removeAttribute('id');
        rowValue.textContent = this.formatRowData(rowData);
        this._rows.push({
            name: rowName,
            value: rowValue,
        });
        if (rowData.namespace !== undefined && !game.registeredNamespaces.hasNamespace(rowData.namespace))
            (_a = rowContent.firstElementChild) === null || _a === void 0 ? void 0 : _a.classList.add('d-none');
        this._body.append(rowContent);
    }
    updateRowValues() {
        this._data.rows.forEach((rowData, i) => {
            const row = this._rows[i];
            row.value.textContent = this.formatRowData(rowData);
        });
    }
    formatRowData(rowData) {
        if (rowData.isTime) {
            return formatAsTimePeriod(rowData.value);
        } else {
            return numberWithCommas(rowData.value);
        }
    }
    localize() {
        this._title.textContent = this._data.title;
        this._data.rows.forEach((rowData, i) => {
            const row = this._rows[i];
            row.name.textContent = rowData.name;
        });
        this.updateRowValues();
    }
}
window.customElements.define('stat-table', StatTableElement);
//# sourceMappingURL=statsTable.js.map
checkFileVersion('?12097')