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
        <div id="sensorContainer"></div>
      </div>
    `;
  }

  /** Called when attributes such as mode change */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "mode") {
      // Could be used if you want to run logic on mode change
    }
  }

  /** Update sensor values */
  update(data) {
    const container = this.shadowRoot.querySelector("#sensorContainer");
    container.innerHTML = "";

    for (const [key, value] of Object.entries(data)) {
      const row = document.createElement("div");
      row.className = "sensor";
      row.textContent = `${key}: ${value}`;
      container.appendChild(row);
    }
  }

  /** Toggle between light and dark mode */
  toggleMode() {
    const current = this.getAttribute("mode");
    this.setAttribute("mode", current === "dark" ? "light" : "dark");
  }
}

customElements.define("gc-live-panel", gcLivePanel);
