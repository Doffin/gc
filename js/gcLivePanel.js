class gcLivePanel extends HTMLElement {
  static get observedAttributes() {
    return ["mode"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
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

        :host([mode="dark"]) .panel {
          background: #1f1f1f;
          color: #eaeaea;
          border-color: #444;
        }

        .title {
          font-weight: bold;
          margin-bottom: 8px;
        }
      </style>

      <div class="panel">
        <div class="title" data-i18n="livesensor.title">Live Sensor Data</div>
        <div id="sensorContainer"></div>
      </div>
    `;

    // Detect system dark mode
    this.media = window.matchMedia("(prefers-color-scheme: dark)");
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

  update(data) {
    const container = this.shadowRoot.querySelector("#sensorContainer");
    container.innerHTML = "";

    for (const [key, value] of Object.entries(data)) {
      const row = document.createElement("div");
      row.textContent = `${key}: ${value}`;
      container.appendChild(row);
    }
  }
}

customElements.define("gc-live-panel", gcLivePanel);
