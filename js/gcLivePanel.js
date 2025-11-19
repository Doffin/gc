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
          background: #1f1f1f;
          color: #eaeaea;
          border-color: #444;
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

    // Call translation if available
    this.applyTranslations();
  }

  applyTranslations() {
    // If your site has a global translate function:
    if (window.translateElement) {
      window.translateElement(this.shadowRoot);
    }
  }

  /** Update sensor values */
  update(data) {
    for (const [key, value] of Object.entries(data)) {
      document.getElementById(key).textContent += `${value}`;
    }
  }

  originalUpdate(data) {
    const container = this.shadowRoot.querySelector("#sensorContainer");
    container.innerHTML = "";

    for (const [key, value] of Object.entries(data)) {
      const row = document.createElement("div");
      row.className = "sensor";
      row.textContent = `${key}: ${value}`;
      container.appendChild(row);
    }
  }

  applyTranslations() {
    // If your site has a global translate function:
    if (window.translateElement) {
      window.translateElement(this.shadowRoot);
    }
  }

  /** Toggle between light and dark mode */
  toggleMode() {
    const current = this.getAttribute("mode");
    this.setAttribute("mode", current === "dark" ? "light" : "dark");
  }

  updateLanguage(currentLanguageData)
  {
    const title = this.shadowRoot.querySelector(".title");
    title.textContent = resolveKey(currentLanguageData, "livesensor.title") || "Live Sensor Data"; 
  }
}

customElements.define("gc-live-panel", gcLivePanel);
