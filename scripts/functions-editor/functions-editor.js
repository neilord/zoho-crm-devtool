function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}


async function changeButtons() {
    const headerSelector = '.w100p.untitledRepTextPar.aIC.dF.spaceBetween.h70';
    const buttonsSelector = '.dIB.mL10.viewaschartbtn.addchartbtnhere.vam';
    const buttonSelector = '.lyte-button.lyteDefaultBtn';
    const buttonElement = 'lyte-button';

    await waitForElement(buttonsSelector);

    if (document.querySelectorAll(buttonSelector).length == 1) {
        // Add Details button
        document.querySelector(buttonsSelector).appendChild(document.createElement(buttonElement));
        const detailsButton = document.querySelectorAll(buttonSelector)[1];
        detailsButton.setAttribute('onclick','ZohoDRE.editArguments(true); return false;');
        detailsButton.firstElementChild.innerHTML = 'Details';
        detailsButton.className = 'lyte-button lytePrimaryBtn';

        // Add Close button
        document.querySelector(headerSelector).children[0].before(document.createElement(buttonElement));
        const closeButton = document.querySelectorAll(buttonSelector)[0];
        closeButton.onclick = function() { document.querySelector('#functionCancel').click(); };
        closeButton.firstElementChild.innerHTML = 'Close';
    }
}

async function functionsEditorOpened() {
    const editorSelector = '#createfunctionpopdiv';

    await waitForElement(editorSelector);

    changeButtons()

    // Restart on the next Functions Editor open
    new MutationObserver(mutations => {
        functionsEditorOpened();
    }).observe(document.querySelector(editorSelector), { childList: true });

} functionsEditorOpened();
