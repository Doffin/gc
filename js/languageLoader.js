const langSelect = document.getElementById("language-select");

let currentLanguageData = {};
let currentLang = 'english';
let langConfig = null;

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

// Populerer språk-dropdown fra config
async function populateLanguageSelect() {
    try {
        const response = await fetch('lang/config.json');
        langConfig = await response.json();
        
        // Fjern eksisterende options
        langSelect.innerHTML = '';
        
        // Legg til options fra config
        langConfig.languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.displayName;
            langSelect.appendChild(option);
        });
        
        // Sett default språk
        const defaultLang = langConfig.defaultLanguage || 'english';
        langSelect.value = defaultLang;
        await loadLanguage(defaultLang);
        
    } catch (error) {
        console.error('Failed to load language config:', error);
        // Fallback til norsk hvis config ikke kan lastes
        await loadLanguage('norsk');
    }
}

// Init
populateLanguageSelect();

langSelect.addEventListener("change", () => {
    loadLanguage(langSelect.value);
});
