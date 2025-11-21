
import { BaseComponent } from "./BaseComponent.js";

class gcLivePanel extends BaseComponent {

  onConnected() {
    this.shadowRoot.innerHTML = `
    <style>
      .content-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        width: 100%;
        align-items: start;
        padding-top: 6px;
      }

      .sensor-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        width: 100%;
      }

      .sensor {
        display: flex;
        flex-direction: column;
        align-items: stretch;
      }

      .label {
        font-weight: 100;
        font-size: 1.0em;
        margin-bottom: 2px;
      }

      .reading {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        gap: 8px;
      }

      .value {
        text-align: left;
        font-variant-numeric: tabular-nums;
        font-size: 1.6em;
        font-weight: 200;
        line-height: 1;
      }

      .unit {
        font-size: 1.6em;
        opacity: 0.85;
        margin-top: 0;
        margin-left: 4px;
      }

      @media (max-width: 600px) {
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>

    <div class="panel">
      <h2 class="title" data-i18n="livesensor.title">Live Sensor Data</h2>
      
      <div class="content-grid">
        <div class="sensor-grid">
          <div class="sensor">
            <div class="label" data-i18n="livesensor.last">Last</div>
            <div class="reading">
              <div class="value" id="last">--</div>
              <div class="unit" data-i18n="livesensor.lastUnit">--</div>
            </div>
          </div>

          <div class="sensor">
            <div class="label" data-i18n="livesensor.setning">Setning</div>
            <div class="reading">
              <div class="value" id="setning">--</div>
              <div class="unit" data-i18n="livesensor.setningUnit">--</div>
            </div>
          </div>

          <div class="sensor">
            <div class="label" data-i18n="livesensor.tid">Tid</div>
            <div class="reading">
              <div class="value" id="tid">--</div>
            </div>
          </div>
        </div>

        <div class="graph-slot" aria-hidden="true"></div>
      </div>

    </div>
        `;

    // Create canvas in graph-slot and initialize a simple Chart.js chart
    const graphSlot = this.shadowRoot.querySelector('.graph-slot');
    if (graphSlot) {
      const canvas = document.createElement('canvas');
      canvas.id = 'gc-chart';
      canvas.style.width = '100%';
      canvas.style.height = '250px';
      graphSlot.appendChild(canvas);

      // Initialize Chart if available
      const initChart = () => {
        try {
          const ctx = canvas.getContext('2d');
          // initialize empty chart; we'll push points (x=last, y=setning)
          this._chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: [],
              datasets: [{
                label: 'Setning',
                data: [],
                borderColor: '#007bff',
                backgroundColor: 'rgba(0,123,255,0.15)',
                tension: 0.3,
                fill: false,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                title: {
                  text: "Setning som funksjon av Last",
                  color: '#fff', 
                  display: true
                },
                legend: { display: false } 
              },
              scales: { 
                x: { 
                  display: true,
                  color: '#fff',
                  title: {
                    display: true,
                    text: 'Last',
                    color: '#fff'
                  },
                  grid: {
                    color: '#aaa',
                  },
                },                 
                y:{
                  display: true,
                  axis_color: '#fff',
                  title: {
                    display: true,   
                    text: 'Setning',
                    color: '#fff'
                  },   
                  grid: {
                    color: '#aaa',
                  },
                   
                }
               }
            }
          } 
            );
          // buffer for partial updates
          this._pendingLast = null;
          this._pendingSetning = null;
          this._maxPoints = 50;
        } catch (e) {
          console.warn('Chart initialization failed:', e);
        }
      };

      if (typeof Chart === 'undefined') {
        // Chart.js not yet loaded; try after a short delay
        setTimeout(() => { if (typeof Chart !== 'undefined') initChart(); else console.warn('Chart.js not found in page'); }, 100);
      } else {
        initChart();
      }
    }
  }

  disconnectedCallback() {
    if (this._chart) {
      try { this._chart.destroy(); } catch (e) {}
      this._chart = null;
    }
    if (super.disconnectedCallback) super.disconnectedCallback();
  }

  updateLanguage(languageData) {
    this.setLanguageData(languageData);
    if (this._chart) {
      const chart = this._chart;
      chart.options.plugins.title.text = resolveKey(languageData, "content.graphTitle");
      chart.options.scales.x.title.text = resolveKey(languageData, "content.xAxisTitle");
      chart.options.scales.y.title.text = resolveKey(languageData, "content.yAxisTitle");
      chart.data.datasets[0].label = resolveKey(languageData, "content.displacementLabel");
      chart.update();
    }
  }

  update(data) {
    // existing DOM updates
    for (const [key, value] of Object.entries(data)) {
      let prop = this.shadowRoot.getElementById(key);
      if (prop)
        prop.textContent = `${value}`;

      // capture pending values for charting
      if (key === 'last') this._pendingLast = `${value}`;
      if (key === 'setning') {
        const num = Number(value);
        this._pendingSetning = Number.isFinite(num) ? num : null;
      }
    }

    // If chart exists and we have both last and setning, push a new point
    if (this._chart && this._pendingLast != null && this._pendingSetning != null) {
      try {
        const chart = this._chart;
        chart.data.labels.push(String(this._pendingLast));
        chart.data.datasets[0].data.push(this._pendingSetning);

        // trim to maxPoints
        const max = this._maxPoints || 50;
        while (chart.data.labels.length > max) chart.data.labels.shift();
        while (chart.data.datasets[0].data.length > max) chart.data.datasets[0].data.shift();

        chart.update('none');
      } catch (e) {
        console.warn('Failed to push point to chart:', e);
      } finally {
        // clear pending to avoid duplicate pushes until new values arrive
        this._pendingLast = null;
        this._pendingSetning = null;
      }
    }
  }
}


customElements.define("gc-live-panel", gcLivePanel);

