"use strict";
const ui = (() => {
    function cloneTemplate(template, host) {
        if (typeof template !== 'string')
            throw new Error(`Parameter "template" must be of type string.`);
        if (!(host instanceof Element))
            throw new Error(`Parameter "host" must be of type Element.`);
        const templ = document.querySelector(template);
        if (!templ)
            throw new Error(`No such template exists: "${template}"`);
        if (!('content' in templ))
            throw new Error(`Template${template} must be of type HTMLTemplateElement.`);
        const clone = templ.content.cloneNode(true);
        host.append(clone);
    }

    function createStatic(template, host) {
        cloneTemplate(template, host);
        host.querySelectorAll('[s-template]').forEach((subHost) => {
            const subTemplate = subHost.getAttribute('s-template');
            subHost.removeAttribute('s-template');
            if (!subTemplate)
                return;
            createStatic(subTemplate, subHost);
        });
        return host;
    }

    function create(props, host) {
        if (!props)
            throw new Error('Parameter "props" must be an object.');
        if (typeof props.$template !== 'string')
            throw new Error('Parameter "props.$template" must be of type string.');
        cloneTemplate(props.$template, host);
        host.setAttribute('v-scope', '');
        PetiteVue.createApp(props).mount(host);
        return host;
    }

    function createStore(props) {
        return PetiteVue.reactive(props);
    }
    return {
        create,
        createStatic,
        createStore,
    };
})();
//# sourceMappingURL=ui.js.map
checkFileVersion('?12097')