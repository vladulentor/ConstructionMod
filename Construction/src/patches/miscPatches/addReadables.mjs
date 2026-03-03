const { loadModule } = mod.getContext(import.meta);
const { getRielkLangString, templateRielkLangString } = await loadModule('src/language/translationManager.mjs');



export function addReadables({ patch }) {
    patch(Bank, "readItemOnClick").after(function (_, item) {
        switch (item.id) {
            case "rielkConstruction:Engraved_Construct_Diagram":
                game.construction.studyTheDiagram();
                break;
        }
    })
    patch(ReadableItem, "showContents").replace(function () {
        if (this.modalID !== undefined) {
            const modal = document.getElementById(this.modalID);
            if (modal !== null)
                $(modal).modal('show');
            else
                console.warn(`Tried to read item with id: ${this.id}, but modal with id: ${this.modalID} is not in DOM.`);
        }
        else if (this.swalData !== undefined) {
            const html = createElement('div');
            const title = this.namespace === "rielkConstruction"? getRielkLangString(this.swalData.title) :getLangString(this.swalData.title)
            html.append(getTemplateElement(this.swalData.htmlTemplateID).content.cloneNode(true));
            SwalLocale.fire({
                title: title,
                html,
                imageUrl: this.media,
                imageWidth: 64,
                imageHeight: 64,
                imageAlt: this.name,
                didOpen: initializeAltText,
            });
        }
    })
}