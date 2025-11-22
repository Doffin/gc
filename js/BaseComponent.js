// --------------------------------------------------------
//  BaseComponent.js
//  En superklasse for moderne WebComponents
// --------------------------------------------------------

/* --------------------------------------------------------
   1. Felles Constructable Stylesheet
--------------------------------------------------------- */
const baseStyles = new CSSStyleSheet();
baseStyles.replaceSync(`
    :host {
        display: block;
        font-family: sans-serif;
        box-sizing: border-box;
    }

    :host([hidden]) {
        display: none !important;
    }

    :host([mode="dark"]) {
        color: #eaeaea;
        background-color: #1e1e1e;
        border-radius: 8px;
        border: 1px solid #444;
    } 
    
    :host([mode="dark"]) .panel {
        border-radius: var(--panel-radius);
        padding: var(--panel-padding);
        background-color: var(--panel-bg-dark);
        }


    :host([mode="light"]) {
        color: #111;
        background-color: #fff;
        border-radius: 8px;
        border: 1px solid #ccc;
    }

    :host([mode="light"]) .panel {
        border-radius: var(--panel-radius);
        padding: var(--panel-padding);
        background-color: var(--panel-bg-light);
    }

    /* Felles CSS-variabler for alle komponenter */
    :host {
        --panel-radius: 8px;
        --panel-padding: 12px;
        --panel-bg-light: #f7f7f7;
        --panel-bg-dark: #2a2a2a;
    }

`);


/* --------------------------------------------------------
   2. Hjelpefunksjoner (resolveKey, interpolate, debounce)
--------------------------------------------------------- */
export function resolveKey(obj, key) {
    return key.split('.').reduce((o, p) => o?.[p], obj);
}

export function interpolate(template, variables = {}) {
    return template.replace(/\{([^}]+)\}/g, (_, key) => {
        return variables[key] ?? `{${key}}`;
    });
}


export function debounce(func, delay = 100) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

export const wait = (ms) => new Promise(r => setTimeout(r, ms));


/* --------------------------------------------------------
   3. BaseComponent class
--------------------------------------------------------- */
export class BaseComponent extends HTMLElement {

    static get observedAttributes() {
        return ["mode", "lang"];
    }

    constructor() {
        super();

        // Opprett shadow DOM
        this.attachShadow({ mode: "open" });

        // Felles styles for alle arvede komponenter
        this.shadowRoot.adoptedStyleSheets = [baseStyles];

        // Holder språkdata hvis komponent oppdateres
        this._langData = null;

        // System dark-mode media matcher
        this._media = window.matchMedia("(prefers-color-scheme: dark)");

        // For enkel logging
        this.debug = false;
    }


    /* --------------------------------------------------------
       4. Lifecycle 
    --------------------------------------------------------- */
    connectedCallback() {
        // Følg systemets mørk/lys-tema
        this._applySystemTheme();
        this._mediaListener = (e) =>
            this.setAttribute("mode", e.matches ? "dark" : "light");
        this._media.addEventListener("change", this._mediaListener);

        // Hook for arvede komponenter
        this.onConnected();
    }

    disconnectedCallback() {
        // Rydd opp
        if (this._mediaListener)
            this._media.removeEventListener("change", this._mediaListener);

        // Hook for arvede komponenter
        this.onDisconnected();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "mode") this.onModeChanged(newValue);
        if (name === "lang") this.refreshLanguage();

        // Hook for arvede komponenter
        this.onAttributeChanged(name, oldValue, newValue);
    }


    /* --------------------------------------------------------
       5. Hooks – kan overstyres i barnekomponenter
    --------------------------------------------------------- */
    onConnected() { }
    onDisconnected() { }
    onModeChanged(_newMode) { }
    onAttributeChanged(_name, _old, _new) { }


    /* --------------------------------------------------------
       6. Tema/dark-mode logikk
    --------------------------------------------------------- */
    _applySystemTheme() {
        const systemDark = this._media.matches;
        this.setAttribute("mode", systemDark ? "dark" : "light");
    }

    setColorMode(mode) {
        this.setAttribute("mode", mode);
    }


    /* --------------------------------------------------------
       7. i18n støtte
    --------------------------------------------------------- */
    setLanguageData(langData = {}, variables = {}) {
        this._langData = langData;
        this._langVars = variables;
        this.refreshLanguage();
    }

    refreshLanguage() {
        if (!this._langData) return;

        this.shadowRoot.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            const text = resolveKey(this._langData, key);
            if (text) el.textContent = interpolate(text, this._langVars || {});
        });
    }

    updateLanguage(currentLanguageData, currentVariables = {}) {

        this.shadowRoot.querySelectorAll("[data-i18n]").forEach(el => {

            const key = el.getAttribute("data-i18n");

            // hent riktig tekst fra JSON (nå med dot-notation støtte)
            const raw = resolveKey(currentLanguageData, key);

            // hvis nøkkelen ikke finnes → logg, men ikke crash
            if (raw === undefined || raw === null) {
                console.warn("Missing i18n key:", key);
                return;
            }

            // interpoler tekst (f.eks "Hello {name}")
            let text = interpolate(raw, currentVariables);

            // fallback dersom interpolate returnerer undefined/null
            if (text === undefined || text === null) {
                text = raw;
            }

            el.textContent = text;
        });
    }



    /* --------------------------------------------------------
       8. Event helpers
    --------------------------------------------------------- */
    emit(name, detail = {}, options = {}) {
        this.dispatchEvent(new CustomEvent(name, {
            detail,
            bubbles: options.bubbles ?? true,
            composed: options.composed ?? true
        }));
    }

    on(event, callback) {
        this.addEventListener(event, callback);
    }


    /* --------------------------------------------------------
       9. Logging helpers
    --------------------------------------------------------- */
    log(...args) {
        if (this.debug) console.log(`[${this.tagName}]`, ...args);
    }
}

