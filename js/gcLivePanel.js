class gcLivePanel extends HTMLElement {
  static get observedAttributes() {
    return ["mode"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .panel {
          font-family: sans-serif;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 12px;
          width: 250px;
          background: #f7f7f7;
          color: #000;
          transition: background .3s, color .3s;
        }

        /* --- Dark Mode Styles --- */
        :host([mode="dark"]) .panel {
          background: #222222;
          color: #eaeaea;
          border-color: #888888;
          border: 1px solid #888888;
        }

        .title {
          font-weight: bold;
          margin-bottom: 8px;
        }

        .sensor {
          margin: 4px 0;
        }
      </style>
      <div class="panel">
        <div class="title" data-i18n="livesensor.title">Live Sensor Data</div>
        <div id="sensorContainer">
        <label data-i18n="livesensor.temperature">Temperature:</label> <span id="temperature">--</span><br />
        <label data-i18n="livesensor.humidity">Humidity:</label> <span id="humidity">--</span><br />
        <label data-i18n="livesensor.pressure">Pressure:</label> <span id="pressure">--</span><br />
        </div>
      </div>
    `;
  }

  /** Called when attributes such as mode change */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "mode") {
      // Could be used if you want to run logic on mode change
    }
  }

  connectedCallback() {
    // Set initial mode based on system
    this.setAttribute("mode", this.media.matches ? "dark" : "light");

    // React to OS theme change
    this.media.addEventListener("change", (e) => {
      this.setAttribute("mode", e.matches ? "dark" : "light");
    });

  }

  /** Update sensor values */
  update(data) {
    for (const [key, value] of Object.entries(data)) {
      this.shadowRoot.getElementById(key).textContent = `${value}`;
    }
  }

  /** Toggle between light and dark mode */
  setColorMode(newMode) {
    const current = this.getAttribute("mode");
    this.setAttribute("mode", newMode === "dark" ? "dark" : "light");
  }

  updateLanguage(currentLanguageData) {
    this.shadowRoot.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        let value = resolveKey(currentLanguageData, key);
        if (value) {
            el.textContent = interpolate(value, currentVariables);
        }
    });
  }
}

customElements.define("gc-live-panel", gcLivePanel);
