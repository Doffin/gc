
import { BaseComponent, resolveKey } from "./BaseComponent.js";

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
        min-width: 320px;
      }

      .sensor-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        width: 100%;
        min-width: 200px;
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

      /* Ensure the graph column has a minimum width so layout can't shrink below chart */
      .graph-slot {
        min-width: 320px;
        min-height: 180px;
      }

      /* Combined content should have at least sensor + graph minimum widths */
      .content-grid {
        min-width: 540px;
      }

      @media (max-width: 600px) {
        .content-grid {
          grid-template-columns: 1fr;
          min-width: unset;
        }
        .graph-slot { min-width: unset; }
        .sensor-grid { min-width: unset; }
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
            type: 'scatter',
            data: {
              labels: [],
              datasets: []
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
                legend: { 
                  display: true,
                  labels: {
                    usePointStyle: true,
                    // make the point style look like a short line
                    pointStyle: 'line',
                    boxWidth: 40
                  }
                } 
              },
              scales: { 
                x: { 
                  display: true,
                  color: '#fff',
                  min: 0,
                  max: 600,
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
                  min: -6,
                  max: 0,
                  title: {
                    display: true,   
                    text: 'Setning (mm)',
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
          // buffer for partial updates and phase tracking
          this._pendingLast = null;
          this._pendingSetning = null;
          this._currentPhase = null;
          this._maxPoints = 50;
          // color palette for phases
          this._phaseColors = {
            'Belastning1': { border: '#007bff', bg: 'rgba(0,123,255,0.15)' },
            'Oppslepp': { border: '#28a745', bg: 'rgba(40,167,69,0.15)' },
            'Belastning2': { border: '#ffc107', bg: 'rgba(255,193,7,0.15)' }
          };
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
    // Always update DOM values
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

    // Handle resets
    if (data.type === 'gc_reset') {
      if (this._chart) {
        this._chart.data.labels = [];
        this._chart.data.datasets = [];
        this._chart.update();
      }
      this._currentPhase = null;
      return;
    }
    // Handle phase finish (just a temporary hack, ignore)
    if (data.phase === 'Finish') {
      this._currentPhase = null;
      return;
    }

    // Track current phase
    if (data.phase) {
      this._currentPhase = data.phase;
    }

    // Only push to chart if type === "gc_save"
    const shouldChart = data.type === 'gc_save';
    
    if (shouldChart && this._chart && this._pendingLast != null && this._pendingSetning != null && this._currentPhase) {
      try {
        const chart = this._chart;
        const phase = this._currentPhase;
        
        // Find or create dataset for this phase
        let datasetIndex = chart.data.datasets.findIndex(ds => ds.label === phase);
        if (datasetIndex === -1) {
          // Create new dataset for this phase
          const colors = this._phaseColors[phase] || { border: '#999', bg: 'rgba(153,153,153,0.15)' };
            const newDataset = {
              label: phase,
              data: [],
              borderColor: colors.border,
              backgroundColor: colors.bg,
              tension: 0.3,
              fill: false,
              pointRadius: 0,
              borderWidth: 2,
              pointStyle: 'line'
            };
          datasetIndex = chart.data.datasets.length;
          chart.data.datasets.push(newDataset);
        }

        // Push point to the appropriate dataset
//        chart.data.labels.push(String(this._pendingLast));
        let newObservation = {
        x: this._pendingLast,
        y: this._pendingSetning
        };
        chart.data.datasets[datasetIndex].data.push(newObservation);

        // trim to maxPoints (apply to all datasets)
        const max = this._maxPoints || 50;
        while (chart.data.labels.length > max) {
          chart.data.labels.shift();
          chart.data.datasets.forEach(ds => {
            if (ds.data.length > 0) ds.data.shift();
          });
        }
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

