
import { BaseComponent } from "./BaseComponent.js";

class gcLivePanel extends BaseComponent {

  onConnected() {
    this.shadowRoot.innerHTML = `
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

  update(data) {
    for (const [key, value] of Object.entries(data)) {
      let prop = this.shadowRoot.getElementById(key);
      if (prop)
        prop.textContent = `${value}`;
    }
  }
}

customElements.define("gc-live-panel", gcLivePanel);
