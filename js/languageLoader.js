const langSelect = document.getElementById("language-select");

let currentLanguageData = {};
let currentLang = 'norsk';
let currentVariables = {
    name: "Testbruker",
    count: 3
};

// Interpolerer {variable} i teksten
function interpolate(text, vars) {
    return text.replace(/\{(\w+)\}/g, (_, key) => 
        vars[key] !== undefined ? vars[key] : `{${key}}`
    );
}

// Returnerer nested verdi fra JSON
function resolveKey(obj, key) {
    return key.split('.').reduce((o, i) => o[i], obj);
}

// Oppdaterer ALLE data-i18n felt
function updateText() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        let value = resolveKey(currentLanguageData, key);
        if (value) {
            el.textContent = interpolate(value, currentVariables);
        }
    });
    // Oppdaterer også web component
    let live = document.getElementById("live");
    if(live!=null) live.updateLanguage(currentLanguageData);
    w3.includeHTML();
    // Broadcast a global event so components can listen for language changes
    try {
        window.dispatchEvent(new CustomEvent('gc-language-changed', { detail: { languageData: currentLanguageData, lang: currentLang } }));
    } catch (e) {
        console.warn('Failed to dispatch language change event', e);
    }
}

// Laster språkfil
async function loadLanguage(lang) {
    currentLang = lang;
    const response = await fetch(`lang/${lang}.json`);
    currentLanguageData = await response.json();
    updateText();
}

// Demo: oppdater variabler dynamisk
document.getElementById("updateVars").addEventListener("click", () => {
    currentVariables.name = document.getElementById("nameInput").value;
    //currentVariables.count = parseInt(document.getElementById("countInput").value);
    updateText();
});

// Init
loadLanguage("norsk");

langSelect.addEventListener("change", () => {
    loadLanguage(langSelect.value);
});
