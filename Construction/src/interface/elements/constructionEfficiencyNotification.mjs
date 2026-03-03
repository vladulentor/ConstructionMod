const { loadModule } = mod.getContext(import.meta);

const ctx = mod.getContext(import.meta);
const { getRielkLangString } = await loadModule('src/language/translationManager.mjs');

export function createOrangeNotification({
    id = "Efficiency",
    text = "",
    media = ctx.getResourceUrl("assets/efficiency.webp"),
    quantity = 0,
} = {}) {
    game.notifications.createSuccessNotification(id, text, media, quantity);
    // apply custom style right after render
    setTimeout(() => {
        const notifEls = Array.from(document.querySelectorAll(".newNotification, .newNotification-container, .notification, .notification-container, .new-notification"));
        
        if (notifEls.length === 0) return;
        const ourNotif = notifEls.find(el => el.innerText.trim().includes(getRielkLangString('TOASTS_EFFICIENCY'))); 
        if (!ourNotif) return;
        const quantSpan = ourNotif
            .children[0]
            .children[1]
            .children[1]
            .children[0];    // Just using a queryselector would've been faster, but this is the correct path to the +X text
        let quant = quantSpan.innerText.trim();
        quant = quant.replace(/^[-+]/, 'x');
        if (quantSpan.firstChild && quantSpan.firstChild.nodeType === Node.TEXT_NODE) {
            quantSpan.firstChild.nodeValue = quant;
        } else {
            quantSpan.textContent = quant;
        }
        ourNotif.style.border = '1px solid #eac14f';
        quantSpan.classList.remove('text-success');
        quantSpan.style.color = 'gold';
        quantSpan.style.fontWeight = 'bold';
    }, 2);

}
