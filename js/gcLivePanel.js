class gcLivePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Initial DOM template
    this.shadowRoot.innerHTML = `
      <style>
        .panel {
          font-family: sans-serif;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 12px;
          width: 250px;
          background: #f7f7f7;
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
        <div class="title">Live Sensor Data</div>
        <div id="sensorContainer"></div>
      </div>
    `;
  }

  // Method to update sensor values dynamically
  update(data) {
    const container = this.shadowRoot.querySelector("#sensorContainer");
    container.innerHTML = "";

    Object.entries(data).forEach(([key, value]) => {
      const row = document.createElement("div");
      row.className = "sensor";
      row.textContent = `${key}: ${value}`;
      container.appendChild(row);
    });
  }
}

// Register the component
customElements.define("gc-live-panel", gcLivePanel);
