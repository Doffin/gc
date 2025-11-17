const langSelect = document.getElementById("language-select");

let currentLanguageData = {};
let currentVariables = {
    name: "Ola",
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
    document.getElementById("chartTitle").textContent = interpolate("graphTitle", currentVariables);
    chart.options.plugins.title.text = interpolate("graphTitle", currentVariables);
    chart.options.scales.x.title.text = interpolate("xAxisTitle", currentVariables);
    chart.options.scales.y.title.text = interpolate("yAxisTitle", currentVariables);
    chart.update();
}

// Laster språkfil
async function loadLanguage(lang) {
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
