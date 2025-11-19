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
        <table style="width:100%;">
        <tr><td><label data-i18n="livesensor.tid">Tid</label></td> <td style="text-align: right"><span id="tid">--</span></td><td><span data-i18n="livesensor.tidUnit">--</span></td></tr>
        <tr><td><label data-i18n="livesensor.last">Last</label></td> <td style="text-align: right"><span id="last">--</span></td><td><span data-i18n="livesensor.lastUnit">--</span></td></tr>
        <tr><td><label data-i18n="livesensor.setning">Setning</label></td> <td style="text-align: right"><span id="setning">--</span></td><td><span data-i18n="livesensor.setningUnit">--</span></td></tr>
        </table>
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

  }

  /** Update sensor values */
  update(data) {
    for (const [key, value] of Object.entries(data)) {
      let prop = this.shadowRoot.getElementById(key);
      if (prop) 
        prop.textContent = `${value}`;
    }
  }

  /** Toggle between light and dark mode */
  setColorMode(newMode) {
    //const current = this.getAttribute("mode");
    this.setAttribute("mode", newMode);
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
