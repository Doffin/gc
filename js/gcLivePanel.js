
import { BaseComponent, resolveKey } from "./BaseComponent.js";

class gcLivePanel extends BaseComponent {

  onConnected() {
    this.shadowRoot.innerHTML = `
    <style>
      .content-grid {
        display: grid;
        grid-template-columns: 1fr 3fr;
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
        min-height: 400px;
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
            <div class="label" data-i18n="livesensor.name">Navn</div>
            <div class="reading">
              <div class="value" id="livesensor.name">--</div>
            </div>
          </div>
          <div class="sensor">
            <div class="label" data-i18n="livesensor.location">Posisjon</div>
            <div class="reading">
              <div class="value" id="livesensor.location">Lat, Lon</div>
            </div>
          </div>

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
      canvas.style.height = '400px';
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
                  max: 800,
                  title: {
                    display: true,
                    text: 'Belastning',
                    color: '#fff'
                  },
                  grid: {
                    color: '#aaa',
                  },
                },                 
                y:{
                  display: true,
                  axis_color: '#fff',
                  min:-2,
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
            'phase1': { border: '#ff0055', bg: 'rgba(0,123,255,0.15)' },
            'phase2': { border: '#777777', bg: 'rgba(40,167,69,0.15)' },
            'phase3': { border: '#28a745', bg: 'rgba(255,193,7,0.15)' }
          };
          this.initializeDataset("Belastning1", "phase1");
          this.initializeDataset("Oppslepp", "phase2");
          this.initializeDataset("Belastning2", "phase3");
          // Use human-friendly display labels for legend immediately
          this._chart.data.datasets.forEach(ds => {
            if (ds.displayLabel) ds.label = ds.displayLabel;
          });

          // If language data is already available, apply localized labels
          if (this._langData) this.updateLanguage(this._langData);

          this._chart.update();

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

    // Listen for global language change events (dispatched by languageLoader)
    this._gcLangHandler = (e) => {
      if (e?.detail?.languageData) this.updateLanguage(e.detail.languageData);
    };
    window.addEventListener('gc-language-changed', this._gcLangHandler);
  }

  disconnectedCallback() {
    if (this._chart) {
      try { this._chart.destroy(); } catch (e) {}
      this._chart = null;
    }
    if (this._gcLangHandler) window.removeEventListener('gc-language-changed', this._gcLangHandler);
    if (super.disconnectedCallback) super.disconnectedCallback();
  }

  updateLanguage(languageData) {
    this.setLanguageData(languageData);
    if (this._chart) {
      const chart = this._chart;
      chart.options.plugins.title.text = resolveKey(languageData, "chart.graphTitle");
      chart.options.scales.x.title.text = resolveKey(languageData, "chart.xAxisTitle");
      chart.options.scales.y.title.text = resolveKey(languageData, "chart.yAxisTitle");
      // Update dataset labels (legend) using phase keys -> i18n mapping when available
      const phaseLabelMap = {
        'phase1': resolveKey(languageData, 'chart.phase1Label'),
        'phase2': resolveKey(languageData, 'chart.phase2Label'),
        'phase3': resolveKey(languageData, 'chart.phase3Label')
      };

      chart.data.datasets.forEach(ds => {
        if (ds.phaseKey && phaseLabelMap[ds.phaseKey]) {
          ds.label = phaseLabelMap[ds.phaseKey];
        }
      });

      chart.update();
    }
  }

  initializeDataset(phaseLabel, phaseNr) {
    const newDataset = {
      // use phase key as dataset label so we can address datasets by phase value
      label: phaseNr,
      // human readable label saved separately (not used for lookup)
      displayLabel: phaseLabel,
      phaseKey: phaseNr,
      data: [],
      borderColor: this._phaseColors[phaseNr].border,
      backgroundColor: this._phaseColors[phaseNr].bg,
      tension: 0.3,
      fill: false,
      pointRadius: 2,
      borderWidth: 1,
      pointStyle: 'circle',
      showLine: true,
    };
    this._chart.data.datasets.push(newDataset);
  }

  removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    chart.update();
  }

  update(data) {
    // Always update DOM values
    for (const [key, value] of Object.entries(data)) {
      let prop = this.shadowRoot.getElementById(key);
      if (prop)
        prop.textContent = `${value}`;

      // capture pending values for charting
      if (key === 'last') 
        this._pendingLast = parseFloat(`${value}`).toFixed(1);
      if (key === 'setning') {
        this._pendingSetning = parseFloat(`${value}`).toFixed(2)*-1.0;
      }
    }

    // Handle resets
    if (data.type === 'R') { // Reset message
      if (this._chart) {
        this.removeData(this._chart);
        //this._chart.data.labels = [];
        //this._chart.data.datasets = [];
        this.initializeDataset("Belastning1", "phase1");
        this.initializeDataset("Oppslepp", "phase2");
        this.initializeDataset("Belastning2", "phase3");
        this._chart.update();
      }
      this._currentPhase = null;
      return;
    }

    // Track current phase
    if (data.phase) {
      this._currentPhase = data.phase;
    }

    // Only push to chart if type === "S"
    const shouldChart = true; //data.type === 'S';
    
    if (shouldChart && this._chart && this._pendingLast != null && this._pendingSetning != null && this._currentPhase) {
      try {
        const chart = this._chart;
        const phase = this._currentPhase;

        let newObservation = { x: Number(this._pendingLast), y: this._pendingSetning };

        // Determine target dataset index: allow numeric phase (0/1/2) or phase key string ('phase1')
        let targetIndex = -1;
        if (/^\d+$/.test(String(phase))) {
          targetIndex = Number(phase);
        } else {
          targetIndex = chart.data.datasets.findIndex(ds => ds.phaseKey === phase || ds.label === phase);
        }

        if (targetIndex === -1 || !chart.data.datasets[targetIndex]) {
          console.warn('Unknown phase for charting:', phase);
        } else {
          chart.data.datasets[targetIndex].data.push(newObservation);
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

