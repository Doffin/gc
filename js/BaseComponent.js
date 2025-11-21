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
        border: 1px solid var(--panel-border-dark);
        box-shadow: 0 2px 6px var(--panel-shadow-dark);
        border-radius: var(--panel-radius);
        padding: var(--panel-padding);
        background-color: var(--panel-bg-dark);
    }

    :host([mode="light"]) {
        color: #111;
        background-color: #fff;
    }

    /* Felles CSS-variabler for alle komponenter */
    :host {
        --panel-radius: 8px;
        --panel-padding: 12px;
        --panel-shadow-light: rgba(0, 0, 0, 0.1);
        --panel-shadow-dark: rgba(0, 0, 0, 0.5);            
        --panel-border-light: #ddd;
        --panel-border-dark: #a00;
        --panel-bg-light: #f7f7f7;
        --panel-bg-dark: #2a2a2a;
    }
`);


/* --------------------------------------------------------
   2. Hjelpefunksjoner (resolveKey, interpolate, debounce)
--------------------------------------------------------- */
export function resolveKey(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}

export function interpolate(text, vars = {}) {
    return text.replace(/\{\{(.*?)\}\}/g, (_, key) => {
        const v = vars[key.trim()];
        return v != null ? v : "";
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
    onConnected() {}
    onDisconnected() {}
    onModeChanged(_newMode) {}
    onAttributeChanged(_name, _old, _new) {}


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

