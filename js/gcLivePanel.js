class gcLivePanel extends BaseComponent {

  onConnected() {
    this.shadowRoot.innerHTML = `
      <style>

        .panel {
          background: var(--panel-bg-light);
          border-radius: var(--panel-radius);
          padding: var(--panel-padding);
          border: 1px solid #ccc;
          transition: background .3s, color .3s, border .3s;
        }

        :host([mode="dark"]) .panel {
          background: var(--panel-bg-dark);
          border-color: #444;
        }

        .title {
          font-weight: bold;
          margin-bottom: 8px;
        }

        /* --- New Grid Layout --- */
        .sensor-grid {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 6px 10px;
          align-items: center;
          width: 100%;
          padding-top: 6px;
        }

        .label {
          font-weight: 500;
        }

        .value {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .unit {
          opacity: 0.75;
        }

      </style>

      <div class="panel">
        <div class="title" data-i18n="livesensor.title">Live Sensor Data</div>

        <div class="sensor-grid">

          <div class="label" data-i18n="livesensor.tid">Tid</div>
          <div class="value" id="tid">--</div>
          <div class="unit" data-i18n="livesensor.tidUnit">--</div>

          <div class="label" data-i18n="livesensor.last">Last</div>
          <div class="value" id="last">--</div>
          <div class="unit" data-i18n="livesensor.lastUnit">--</div>

          <div class="label" data-i18n="livesensor.setning">Setning</div>
          <div class="value" id="setning">--</div>
          <div class="unit" data-i18n="livesensor.setningUnit">--</div>

        </div>
      </div>
    `;
  }

  update(data) {
    for (const [key, value] of Object.entries(data)) {
      let prop = this.shadowRoot.getElementById(key);
      if (prop) prop.textContent = `${value}`;
    }
  }
}

customElements.define("gc-live-panel", gcLivePanel);

gcLivePanel.prototype.setColorMode = function(mode) {
  this.setAttribute("mode", mode);
};
