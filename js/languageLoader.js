const langSelect = document.getElementById("language-select");

let currentLanguageData = {};
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
    updateChartText(chart);
    w3.includeHTML();
}

function updateChartText(chart) {
    chart.options.plugins.title.text = resolveKey(currentLanguageData, "content.graphTitle");
    chart.options.scales.x.title.text = resolveKey(currentLanguageData, "content.xAxisTitle");
    chart.options.scales.y.title.text = resolveKey(currentLanguageData, "content.yAxisTitle");
    chart.data.datasets[0].label = resolveKey(currentLanguageData, "content.displacementLabel");
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

langSelect.addEventListener("change", () => {
    loadLanguage(langSelect.value);
});
