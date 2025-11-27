
import { BaseComponent } from "./BaseComponent.js";

class gcSetupPanel extends BaseComponent {

  onConnected() {
    this.shadowRoot.innerHTML = `
    <style>
      .panel {
        padding: 16px;
        margin-bottom: 12px;
      }

      .control-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      label {
        font-weight: 500;
      }

      select, input[type="text"], input[type="number"] {
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid #ccc;
        font-size: 14px;
      }

      :host([mode="dark"]) select,
      :host([mode="dark"]) input[type="text"],
      :host([mode="dark"]) input[type="number"] {
        background-color: #2a2a2a;
        color: #e0e0e0;
        border-color: #555;
      }

      button {
        padding: 6px 14px;
        border-radius: 4px;
        border: none;
        background-color: #007bff;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      button:hover {
        background-color: #0056b3;
      }

      :host([mode="dark"]) button {
        background-color: #0056b3;
      }

      :host([mode="dark"]) button:hover {
        background-color: #004080;
      }

      .status {
        margin-left: 10px;
        font-weight: bold;
      }

      .status.online {
        color: green;
      }

      .status.offline {
        color: red;
      }

      .mqtt-config {
        margin-top: 10px;
        padding: 12px;
        background-color: #f0f0f0;
        border-radius: 4px;
        display: none;
      }

      :host([mode="dark"]) .mqtt-config {
        background-color: #1a1a1a;
      }

      .mqtt-config.visible {
        display: block;
      }

      .config-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
    </style>

    <div class="panel">
      <div class="control-row">
        <label for="transport-select" data-i18n="setup.transport">Transport:</label>
        <select id="transport-select">
          <option value="websocket">WebSocket (localhost:8080)</option>
          <option value="mqtt">MQTT</option>
        </select>
        <span id="connection-status" class="status offline">● Offline</span>
      </div>

      <div id="mqtt-config" class="mqtt-config">
        <div class="config-row">
          <label for="mqtt-broker" data-i18n="setup.broker">Broker URL:</label>
          <input type="text" id="mqtt-broker" value="broker.hivemq.com" style="width: 250px;" />
        </div>
        <div class="config-row">
          <label for="mqtt-port" data-i18n="setup.port">Port:</label>
          <input type="number" id="mqtt-port" value="8884" style="width: 80px;" />
        </div>
        <div class="config-row">
          <label for="mqtt-topic" data-i18n="setup.topic">Topic:</label>
          <input type="text" id="mqtt-topic" value="gc/data" style="width: 200px;" />
        </div>
        <button id="apply-mqtt" data-i18n="setup.applyButton">Apply & Reconnect</button>
      </div>
    </div>
    `;

    // Transport state
    this._ws = null;
    this._mqtt = null;
    this._currentTransport = 'websocket';

    // Get DOM references
    this._transportSelect = this.shadowRoot.getElementById('transport-select');
    this._mqttConfig = this.shadowRoot.getElementById('mqtt-config');
    this._connectionStatus = this.shadowRoot.getElementById('connection-status');
    this._applyButton = this.shadowRoot.getElementById('apply-mqtt');

    // Event listeners
    this._transportSelect.addEventListener('change', (e) => {
      this._switchTransport(e.target.value);
    });

    this._applyButton.addEventListener('click', () => {
      this._applyMQTTConfig();
    });

    // Initialize WebSocket by default
    this._initWebSocket();
  }

  disconnectedCallback() {
    // Clean up connections
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    if (this._mqtt && this._mqtt.isConnected()) {
      this._mqtt.disconnect();
      this._mqtt = null;
    }
    if (super.disconnectedCallback) super.disconnectedCallback();
  }

  _updateConnectionStatus(online, transport) {
    if (!this._connectionStatus) return;
    const text = online ? '● Online' : '● Offline';
    this._connectionStatus.className = `status ${online ? 'online' : 'offline'}`;
    this._connectionStatus.textContent = `${text} (${transport})`;
  }

  _initWebSocket() {
    if (this._ws) {
      this._emitMessage('WebSocket is already initialized.');
      return;
    }
    this._ws = new WebSocket(`ws://localhost:8080`);
    this._ws.onerror = () => {
      this._emitMessage('WebSocket error');
      this._updateConnectionStatus(false, 'WebSocket');
    };
    this._ws.onopen = () => {
      this._emitMessage('WebSocket connection established');
      this._updateConnectionStatus(true, 'WebSocket');
    };
    this._ws.onclose = () => {
      this._emitMessage('WebSocket connection closed');
      this._updateConnectionStatus(false, 'WebSocket');
      this._ws = null;
    };
    this._ws.onmessage = (event) => {
      this._handleMessage(event.data);
    };
  }

  _initMQTT() {
    if (this._mqtt) {
      this._emitMessage('MQTT is already initialized.');
      return;
    }

    const brokerUrl = this.shadowRoot.getElementById('mqtt-broker').value || 'broker.hivemq.com';
    const brokerPort = parseInt(this.shadowRoot.getElementById('mqtt-port').value) || 8884;
    const topic = this.shadowRoot.getElementById('mqtt-topic').value || 'gc/data';
    const clientId = `gc_${Math.random().toString(16).substr(2, 9)}`;

    // Check if Paho is available
    if (typeof Paho === 'undefined') {
      this._emitMessage('MQTT library (Paho) not loaded');
      this._updateConnectionStatus(false, 'MQTT');
      return;
    }

    this._mqtt = new Paho.MQTT.Client(brokerUrl, brokerPort, clientId);
    this._mqtt.onConnectionLost = (responseObject) => {
      this._emitMessage('MQTT connection lost');
      this._updateConnectionStatus(false, 'MQTT');
    };
    this._mqtt.onMessageArrived = (message) => {
      this._handleMessage(message.payloadString);
    };

    this._mqtt.connect({
      onSuccess: () => {
        this._emitMessage('MQTT connection established');
        this._updateConnectionStatus(true, 'MQTT');
        this._mqtt.subscribe(topic);
        this._emitMessage(`Subscribed to topic: ${topic}`);
      },
      onFailure: (error) => {
        this._emitMessage(`MQTT connection failed: ${error.errorMessage}`);
        this._updateConnectionStatus(false, 'MQTT');
      },
      useSSL: true,
      cleanSession: true
    });
  }

  _switchTransport(transport) {
    this._currentTransport = transport;

    if (transport === 'websocket') {
      // Close MQTT if active
      if (this._mqtt && this._mqtt.isConnected()) {
        this._mqtt.disconnect();
        this._mqtt = null;
      }
      // Init WebSocket if not already active
      if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        this._initWebSocket();
      }
      // Hide MQTT config
      this._mqttConfig.classList.remove('visible');
    } else if (transport === 'mqtt') {
      // Close WebSocket if active
      if (this._ws) {
        this._ws.close();
        this._ws = null;
      }
      // Show MQTT config
      this._mqttConfig.classList.add('visible');
      // Init MQTT if not already active
      if (!this._mqtt || !this._mqtt.isConnected()) {
        this._initMQTT();
      }
    }
  }

  _applyMQTTConfig() {
    // Reconnect MQTT with new config
    if (this._mqtt && this._mqtt.isConnected()) {
      this._mqtt.disconnect();
    }
    this._mqtt = null;
    if (this._currentTransport === 'mqtt') {
      this._initMQTT();
    }
  }

  _handleMessage(msgData) {
    try {
      const msg = typeof msgData === 'string' ? JSON.parse(msgData) : msgData;
      // Emit custom event for other components to handle
      this.emit('gc-message', { message: msg });
    } catch (error) {
      this._emitMessage(`Error parsing message: ${error.message}`);
    }
  }

  _emitMessage(text) {
    // Emit status/log messages
    this.emit('gc-status', { text });
  }

  sendMessage(msg) {
    if (this._currentTransport === 'websocket' && this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(msg);
    } else if (this._currentTransport === 'mqtt' && this._mqtt && this._mqtt.isConnected()) {
      const topic = this.shadowRoot.getElementById('mqtt-topic').value || 'gc/data';
      const message = new Paho.MQTT.Message(msg);
      message.destinationName = topic;
      this._mqtt.send(message);
      this._emitMessage(`Published to ${topic}`);
    } else {
      this._emitMessage(`Not connected via ${this._currentTransport}.`);
    }
  }
}

customElements.define("gc-setup-panel", gcSetupPanel);