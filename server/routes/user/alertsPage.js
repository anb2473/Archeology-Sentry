export function getAlertsPageHtml({ NAVBAR_TOGGLE_BTN, NAVBAR_TOGGLE_SCRIPT, NAVBAR_RESPONSIVE_CSS }) {
  return `<!doctype html>
  <html lang="en">
  <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Archeology Sentry - Alerts</title>
      <style>
          :root {
              --bg: #111;
              --fg: #fff;
              --accent: #4ecdc4;
              --muted: #bfbfbf;
              --error: #ff4444;
              --warn: #ffa94d;
          }

          html, body {
              height: 100%;
              margin: 0;
              background: var(--bg);
              color: var(--fg);
              font-family: 'Inter', system-ui, Arial, sans-serif;
          }

          *, *::before, *::after { box-sizing: border-box; }

          #app {
              filter: blur(15px);
              opacity: 0;
              transition: filter 0.8s ease, opacity 0.8s ease;
          }

          #app-bg {
              min-height: 100vh;
              position: relative;
              background-image: url('/images/login-img.jpg');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              background-attachment: fixed;
          }

          #app-bg::before {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.85) 100%);
              z-index: 0;
          }

          .page-wrapper {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 6rem 1rem 7rem;
              position: relative;
          }

          .navbar {
              width: 100%;
              max-width: 100vw;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 20px 5vw;
              background: none;
              position: fixed;
              top: 0;
              left: 0;
              z-index: 100;
          }

          .navbar .logo {
              width: 54px;
              height: 54px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
          }

          .navbar .logo img {
              width: 100%;
              height: 100%;
              object-fit: contain;
          }

          .nav-actions {
              margin-left: auto;
              display: flex;
              gap: 1rem;
              align-items: center;
              flex-shrink: 1;
              min-width: 0;
          }
${NAVBAR_RESPONSIVE_CSS}

          .nav-link {
              color: #b8b8b8;
              background: transparent;
              border: none;
              padding: 10px 14px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              text-decoration: none;
              position: relative;
              outline: none;
          }

          .nav-link.navfocus { color: #fff; }
          .nav-link.navfocus::after {
              content: '';
              position: absolute;
              left: 0;
              right: 0;
              bottom: -2px;
              height: 2px;
              background: var(--accent);
          }

          .navbar .cta {
              background: var(--accent);
              color: #111;
              border: none;
              border-radius: 8px;
              font-size: 1.1rem;
              font-weight: 700;
              padding: 12px 32px;
              cursor: pointer;
          }

          .alerts-content {
              width: 100%;
              max-width: 720px;
              display: flex;
              flex-direction: column;
              gap: 2rem;
              z-index: 1;
          }

          .alerts-header h1 {
              margin: 0 0 0.5rem 0;
              font-size: 2rem;
              font-weight: 700;
              color: var(--accent);
          }

          .alerts-header p {
              margin: 0;
              color: var(--muted);
              line-height: 1.5;
          }

          .criteria-preview {
              margin-top: 1rem;
              padding: 0.85rem 1rem;
              border-radius: 8px;
              background: rgba(78, 205, 196, 0.08);
              border: 1px solid rgba(78, 205, 196, 0.25);
              color: var(--accent);
              font-size: 0.95rem;
          }

          .alert-form-card {
              width: 100%;
              padding: 1.75rem;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(78, 205, 196, 0.3);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .alert-form-card.editing {
              border-color: var(--accent);
              box-shadow: 0 0 0 1px rgba(78, 205, 196, 0.35);
          }

          .form-section-title {
              margin: 0 0 1rem 0;
              font-size: 0.8rem;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--muted);
          }

          .form-section + .form-section {
              margin-top: 1.5rem;
              padding-top: 1.5rem;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          .form-field {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              margin-bottom: 1rem;
          }

          .form-field label {
              font-weight: 600;
              font-size: 0.95rem;
          }

          .form-field input,
          .form-field select {
              width: 100%;
              padding: 10px 14px;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.6);
              background: rgba(255,255,255,0.06);
              color: var(--fg);
              font-size: 0.95rem;
              outline: none;
          }

          .form-field input:focus,
          .form-field select:focus {
              border-color: var(--accent);
              background: rgba(78,205,196,0.1);
          }

          .condition-options {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
          }

          .condition-option {
              display: flex;
              align-items: flex-start;
              gap: 0.75rem;
              padding: 0.85rem 1rem;
              border-radius: 10px;
              border: 1px solid rgba(78, 205, 196, 0.25);
              background: rgba(255, 255, 255, 0.03);
              cursor: pointer;
              transition: border-color 0.2s, background 0.2s;
          }

          .condition-option:has(input:checked) {
              border-color: var(--accent);
              background: rgba(78, 205, 196, 0.1);
          }

          .condition-option input {
              margin-top: 0.2rem;
              accent-color: var(--accent);
          }

          .condition-option-text strong {
              display: block;
              margin-bottom: 0.15rem;
          }

          .condition-option-text span {
              color: var(--muted);
              font-size: 0.85rem;
          }

          .threshold-panel {
              display: none;
              margin-top: 0.75rem;
              padding: 1rem;
              border-radius: 8px;
              background: rgba(0, 0, 0, 0.25);
              border: 1px solid rgba(78, 205, 196, 0.2);
          }

          .threshold-panel.active {
              display: block;
          }

          .threshold-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
          }

          .threshold-hint {
              margin: 0.5rem 0 0 0;
              font-size: 0.85rem;
              color: var(--muted);
          }

          .form-actions {
              display: flex;
              flex-wrap: wrap;
              gap: 0.75rem;
              align-items: center;
              margin-top: 1.25rem;
          }

          .primary-button,
          .secondary-button,
          .danger-button {
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 0.95rem;
              font-weight: 600;
              cursor: pointer;
              border: none;
          }

          .primary-button {
              background: var(--accent);
              color: #111;
          }

          .primary-button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
          }

          .secondary-button {
              background: transparent;
              color: var(--muted);
              border: 1px solid rgba(78, 205, 196, 0.4);
          }

          .danger-button {
              background: transparent;
              color: var(--error);
              border: 1px solid rgba(255, 68, 68, 0.45);
          }

          .message {
              width: 100%;
              padding: 0.85rem 1rem;
              border-radius: 8px;
              font-size: 0.9rem;
              display: none;
          }

          .message.success {
              display: block;
              background: rgba(81, 207, 102, 0.12);
              border: 1px solid rgba(81, 207, 102, 0.4);
              color: #51cf66;
          }

          .message.error {
              display: block;
              background: rgba(255, 68, 68, 0.12);
              border: 1px solid rgba(255, 68, 68, 0.4);
              color: var(--error);
          }

          .saved-alerts h2 {
              margin: 0 0 1rem 0;
              font-size: 1.25rem;
              color: var(--fg);
          }

          .saved-alerts-list {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
          }

          .saved-alert-card {
              padding: 1.25rem;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(78, 205, 196, 0.22);
          }

          .saved-alert-card-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 1rem;
              margin-bottom: 0.5rem;
          }

          .saved-alert-card h3 {
              margin: 0;
              font-size: 1.1rem;
          }

          .saved-alert-criteria {
              color: var(--muted);
              font-size: 0.9rem;
              margin: 0 0 0.35rem 0;
          }

          .saved-alert-email {
              font-size: 0.85rem;
              color: var(--muted);
          }

          .saved-alert-actions {
              display: flex;
              gap: 0.5rem;
              flex-shrink: 0;
          }

          .empty-hint {
              color: var(--muted);
              font-style: italic;
          }

          .alert-toast-tray {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              z-index: 200;
              display: flex;
              flex-direction: column-reverse;
              gap: 0.5rem;
              padding: 1rem;
              max-height: 45vh;
              overflow-y: auto;
              pointer-events: none;
          }

          .trigger-toast {
              pointer-events: auto;
              max-width: 420px;
              margin-left: auto;
              margin-right: auto;
              width: 100%;
              padding: 1rem 1.15rem;
              border-radius: 12px;
              background: rgba(17, 17, 17, 0.95);
              backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 169, 77, 0.55);
              box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5);
              animation: slideUp 0.35s ease;
          }

          @keyframes slideUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
          }

          .trigger-toast-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 0.5rem;
              margin-bottom: 0.35rem;
          }

          .trigger-toast-title {
              margin: 0;
              font-size: 1rem;
              font-weight: 700;
              color: var(--warn);
          }

          .trigger-toast-time {
              font-size: 0.8rem;
              color: var(--muted);
              white-space: nowrap;
          }

          .trigger-toast-body {
              margin: 0;
              font-size: 0.9rem;
              color: var(--fg);
              line-height: 1.45;
          }

          .trigger-toast-dismiss {
              background: none;
              border: none;
              color: var(--muted);
              cursor: pointer;
              font-size: 1.2rem;
              padding: 0;
              line-height: 1;
          }

          @media (max-width: 600px) {
              .threshold-row { grid-template-columns: 1fr; }
              .saved-alert-card-header { flex-direction: column; }
          }
      </style>
  </head>
  <body>
      <div id="app">
          <div id="app-bg">
              <nav class="navbar">
                  <a href="/" class="logo">
                      <img src="/icon/logo.png" alt="Archeology Sentry" />
                  </a>
                  ${NAVBAR_TOGGLE_BTN}
                  <div class="nav-actions" id="nav-actions">
                      <a href="/user/sensors" class="nav-link">Sensors</a>
                      <a href="/user/map" class="nav-link">Map</a>
                      <a href="/user/alerts" class="nav-link navfocus">Alerts</a>
                      <a href="/user/admin" class="nav-link">Admin</a>
                      <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
                  </div>
              </nav>
              <div class="page-wrapper">
                  <div class="alerts-content">
                      <header class="alerts-header">
                          <h1 id="alerts-title">Alerts</h1>
                          <p>Set rules for your sensors. When a reading matches your criteria, a notification appears at the bottom of this page.</p>
                          <div id="criteria-preview" class="criteria-preview">Select options below to preview your alert rule.</div>
                      </header>

                      <section class="alert-form-card" id="alert-form-card">
                          <div class="form-section">
                              <h2 class="form-section-title">1 — Alert details</h2>
                              <div class="form-field">
                                  <label for="name">Alert name</label>
                                  <input type="text" id="name" placeholder="e.g. Gallery humidity too high" />
                              </div>
                              <div class="form-field">
                                  <label for="email">Notify email</label>
                                  <input type="email" id="email" placeholder="you@example.com" />
                              </div>
                          </div>

                          <div class="form-section">
                              <h2 class="form-section-title">2 — What to watch</h2>
                              <div class="form-field">
                                  <label for="sensor-select">Sensor</label>
                                  <select id="sensor-select">
                                      <option value="">Loading sensors...</option>
                                  </select>
                              </div>
                              <div class="form-field">
                                  <label for="datatype-select">Reading type</label>
                                  <select id="datatype-select">
                                      <option value="">Select a sensor first</option>
                                  </select>
                              </div>
                          </div>

                          <div class="form-section">
                              <h2 class="form-section-title">3 — When to trigger</h2>
                              <div class="condition-options" id="condition-options">
                                  <label class="condition-option">
                                      <input type="radio" name="condition" value="above" checked />
                                      <span class="condition-option-text">
                                          <strong>Goes above a limit</strong>
                                          <span>Fire when the reading is higher than your threshold (e.g. humidity too high).</span>
                                      </span>
                                  </label>
                                  <label class="condition-option">
                                      <input type="radio" name="condition" value="below" />
                                      <span class="condition-option-text">
                                          <strong>Falls below a limit</strong>
                                          <span>Fire when the reading drops under your threshold (e.g. temperature too low).</span>
                                      </span>
                                  </label>
                                  <label class="condition-option">
                                      <input type="radio" name="condition" value="outside" />
                                      <span class="condition-option-text">
                                          <strong>Leaves the safe range</strong>
                                          <span>Fire when the reading is below the low limit or above the high limit.</span>
                                      </span>
                                  </label>
                              </div>

                              <div id="panel-above" class="threshold-panel active">
                                  <div class="form-field">
                                      <label for="threshold-above">Trigger when value is above</label>
                                      <input type="number" id="threshold-above" step="any" placeholder="e.g. 80" />
                                  </div>
                              </div>
                              <div id="panel-below" class="threshold-panel">
                                  <div class="form-field">
                                      <label for="threshold-below">Trigger when value is below</label>
                                      <input type="number" id="threshold-below" step="any" placeholder="e.g. 10" />
                                  </div>
                              </div>
                              <div id="panel-outside" class="threshold-panel">
                                  <div class="threshold-row">
                                      <div class="form-field">
                                          <label for="threshold-low">Safe range — low limit</label>
                                          <input type="number" id="threshold-low" step="any" placeholder="e.g. 30" />
                                      </div>
                                      <div class="form-field">
                                          <label for="threshold-high">Safe range — high limit</label>
                                          <input type="number" id="threshold-high" step="any" placeholder="e.g. 70" />
                                      </div>
                                  </div>
                                  <p class="threshold-hint">Alert fires if the reading is below the low limit or above the high limit.</p>
                              </div>
                          </div>

                          <div class="form-actions">
                              <button type="button" id="save-button" class="primary-button">Create alert</button>
                              <button type="button" id="cancel-edit-button" class="secondary-button" style="display:none;">Cancel</button>
                              <button type="button" id="delete-button" class="danger-button" style="display:none;">Delete</button>
                          </div>
                          <div class="message" id="message"></div>
                      </section>

                      <section class="saved-alerts">
                          <h2>Your alert rules</h2>
                          <div id="saved-alerts-list" class="saved-alerts-list">
                              <p class="empty-hint">Loading...</p>
                          </div>
                      </section>
                  </div>
              </div>
          </div>
      </div>

      <div id="alert-toast-tray" class="alert-toast-tray" aria-live="polite"></div>

      <script>
          const saveButton = document.getElementById('save-button');
          const cancelEditButton = document.getElementById('cancel-edit-button');
          const deleteButton = document.getElementById('delete-button');
          const nameInput = document.getElementById('name');
          const emailInput = document.getElementById('email');
          const sensorSelect = document.getElementById('sensor-select');
          const datatypeSelect = document.getElementById('datatype-select');
          const criteriaPreview = document.getElementById('criteria-preview');
          const savedAlertsList = document.getElementById('saved-alerts-list');
          const alertFormCard = document.getElementById('alert-form-card');
          const alertsTitle = document.getElementById('alerts-title');
          const toastTray = document.getElementById('alert-toast-tray');
          const conditionRadios = document.querySelectorAll('input[name="condition"]');
          const panels = {
              above: document.getElementById('panel-above'),
              below: document.getElementById('panel-below'),
              outside: document.getElementById('panel-outside'),
          };

          let editingAlertName = null;
          let sensorsCache = [];
          let lastEventPoll = new Date().toISOString();
          const seenEventIds = new Set();

          function getCondition() {
              const checked = document.querySelector('input[name="condition"]:checked');
              return checked ? checked.value : 'above';
          }

          function updateConditionPanels() {
              const condition = getCondition();
              Object.keys(panels).forEach(function (key) {
                  panels[key].classList.toggle('active', key === condition);
              });
              updateCriteriaPreview();
          }

          function formatTypeLabel(type) {
              return type.replace(/_/g, ' ');
          }

          function buildCriteriaText() {
              const sensor = sensorSelect.value;
              const datatype = datatypeSelect.value;
              const condition = getCondition();

              if (!sensor || !datatype) {
                  return 'Select a sensor and reading type to preview your rule.';
              }

              const typeLabel = formatTypeLabel(datatype);

              if (condition === 'above') {
                  const v = document.getElementById('threshold-above').value;
                  return v
                      ? 'Alert when ' + typeLabel + ' on "' + sensor + '" goes above ' + v + '.'
                      : 'Alert when ' + typeLabel + ' on "' + sensor + '" goes above (enter a value).';
              }
              if (condition === 'below') {
                  const v = document.getElementById('threshold-below').value;
                  return v
                      ? 'Alert when ' + typeLabel + ' on "' + sensor + '" falls below ' + v + '.'
                      : 'Alert when ' + typeLabel + ' on "' + sensor + '" falls below (enter a value).';
              }
              const low = document.getElementById('threshold-low').value;
              const high = document.getElementById('threshold-high').value;
              if (low && high) {
                  return 'Alert when ' + typeLabel + ' on "' + sensor + '" leaves the safe range (' + low + ' to ' + high + ').';
              }
              return 'Alert when ' + typeLabel + ' on "' + sensor + '" leaves the safe range (set low and high limits).';
          }

          function updateCriteriaPreview() {
              criteriaPreview.textContent = buildCriteriaText();
          }

          function populateDatatypesForSensor(sensorName) {
              datatypeSelect.innerHTML = '';
              const sensor = sensorsCache.find(function (s) { return s.name === sensorName; });
              const types = sensor && sensor.types && sensor.types.length
                  ? sensor.types
                  : [];

              if (!types.length) {
                  const opt = document.createElement('option');
                  opt.value = '';
                  opt.textContent = sensorName ? 'No readings yet — select a common type' : 'Select a sensor first';
                  datatypeSelect.appendChild(opt);
                  ['temperature', 'humidity', 'pressure', 'motion', 'soil_moisture'].forEach(function (t) {
                      const o = document.createElement('option');
                      o.value = t;
                      o.textContent = formatTypeLabel(t);
                      datatypeSelect.appendChild(o);
                  });
                  return;
              }

              const placeholder = document.createElement('option');
              placeholder.value = '';
              placeholder.textContent = 'Select reading type';
              datatypeSelect.appendChild(placeholder);

              types.forEach(function (t) {
                  const o = document.createElement('option');
                  o.value = t;
                  o.textContent = formatTypeLabel(t);
                  datatypeSelect.appendChild(o);
              });
          }

          async function loadSensors() {
              try {
                  const response = await fetch('/user/load-sensors');
                  if (!response.ok) throw new Error('Failed to load sensors');
                  const data = await response.json();
                  sensorsCache = data.sensors || [];

                  sensorSelect.innerHTML = '';
                  const placeholder = document.createElement('option');
                  placeholder.value = '';
                  placeholder.textContent = sensorsCache.length ? 'Select a sensor' : 'No sensors registered yet';
                  sensorSelect.appendChild(placeholder);

                  sensorsCache.forEach(function (sensor) {
                      const opt = document.createElement('option');
                      opt.value = sensor.name;
                      opt.textContent = sensor.name;
                      sensorSelect.appendChild(opt);
                  });

                  saveButton.disabled = sensorsCache.length === 0;
              } catch (err) {
                  console.error(err);
                  showMessage('Could not load sensors.', 'error');
                  saveButton.disabled = true;
              }
          }

          function formatCriteriaFromAlert(alert) {
              const condition = alert.condition || (alert.min != null && alert.max != null ? 'outside' : alert.min != null ? 'below' : 'above');
              const typeLabel = formatTypeLabel(alert.datatype || 'reading');
              const sensor = alert.sensor && alert.sensor.name ? alert.sensor.name : 'sensor';

              if (condition === 'above') {
                  return typeLabel + ' on "' + sensor + '" goes above ' + alert.max;
              }
              if (condition === 'below') {
                  return typeLabel + ' on "' + sensor + '" falls below ' + alert.min;
              }
              return typeLabel + ' on "' + sensor + '" outside ' + alert.min + '–' + alert.max;
          }

          async function loadSavedAlerts() {
              try {
                  savedAlertsList.innerHTML = '<p class="empty-hint">Loading...</p>';
                  const response = await fetch('/user/alerts', {
                      headers: { Accept: 'application/json' },
                  });
                  if (!response.ok) throw new Error('Failed to load alerts');
                  const data = await response.json();
                  const alerts = data.alerts || [];

                  if (!alerts.length) {
                      savedAlertsList.innerHTML = '<p class="empty-hint">No alerts yet. Create one above.</p>';
                      return;
                  }

                  savedAlertsList.innerHTML = '';
                  alerts.forEach(function (alert) {
                      const card = document.createElement('div');
                      card.className = 'saved-alert-card';

                      const header = document.createElement('div');
                      header.className = 'saved-alert-card-header';

                      const left = document.createElement('div');
                      const title = document.createElement('h3');
                      title.textContent = alert.name;
                      const criteria = document.createElement('p');
                      criteria.className = 'saved-alert-criteria';
                      criteria.textContent = formatCriteriaFromAlert(alert);
                      const email = document.createElement('p');
                      email.className = 'saved-alert-email';
                      email.textContent = 'Email: ' + (alert.email || '—');
                      left.appendChild(title);
                      left.appendChild(criteria);
                      left.appendChild(email);

                      const actions = document.createElement('div');
                      actions.className = 'saved-alert-actions';
                      const editBtn = document.createElement('button');
                      editBtn.type = 'button';
                      editBtn.className = 'secondary-button';
                      editBtn.textContent = 'Edit';
                      editBtn.addEventListener('click', function () { startEdit(alert); });
                      actions.appendChild(editBtn);

                      header.appendChild(left);
                      header.appendChild(actions);
                      card.appendChild(header);
                      savedAlertsList.appendChild(card);
                  });
              } catch (err) {
                  console.error(err);
                  savedAlertsList.innerHTML = '<p class="empty-hint">Unable to load alerts.</p>';
              }
          }

          function setConditionValue(condition) {
              conditionRadios.forEach(function (radio) {
                  radio.checked = radio.value === condition;
              });
              updateConditionPanels();
          }

          function startEdit(alert) {
              editingAlertName = alert.name;
              nameInput.value = alert.name || '';
              emailInput.value = alert.email || '';
              sensorSelect.value = alert.sensor && alert.sensor.name ? alert.sensor.name : '';
              populateDatatypesForSensor(sensorSelect.value);
              datatypeSelect.value = alert.datatype || '';

              const condition = alert.condition || (alert.min != null && alert.max != null ? 'outside' : alert.min != null ? 'below' : 'above');
              setConditionValue(condition);

              document.getElementById('threshold-above').value = alert.max ?? '';
              document.getElementById('threshold-below').value = alert.min ?? '';
              document.getElementById('threshold-low').value = alert.min ?? '';
              document.getElementById('threshold-high').value = alert.max ?? '';

              saveButton.textContent = 'Save alert';
              alertsTitle.textContent = 'Edit alert';
              cancelEditButton.style.display = 'inline-flex';
              deleteButton.style.display = 'inline-flex';
              alertFormCard.classList.add('editing');
              updateCriteriaPreview();
              alertFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          function resetForm() {
              editingAlertName = null;
              nameInput.value = '';
              emailInput.value = '';
              sensorSelect.value = '';
              datatypeSelect.innerHTML = '<option value="">Select a sensor first</option>';
              setConditionValue('above');
              document.getElementById('threshold-above').value = '';
              document.getElementById('threshold-below').value = '';
              document.getElementById('threshold-low').value = '';
              document.getElementById('threshold-high').value = '';
              saveButton.textContent = 'Create alert';
              alertsTitle.textContent = 'Alerts';
              cancelEditButton.style.display = 'none';
              deleteButton.style.display = 'none';
              alertFormCard.classList.remove('editing');
              updateCriteriaPreview();
          }

          function getPayload() {
              const condition = getCondition();
              const payload = {
                  name: nameInput.value.trim(),
                  originalName: editingAlertName,
                  sensor: sensorSelect.value,
                  datatype: datatypeSelect.value,
                  alertEmail: emailInput.value.trim(),
                  condition: condition,
                  min: null,
                  max: null,
              };

              if (condition === 'above') {
                  payload.max = document.getElementById('threshold-above').value;
              } else if (condition === 'below') {
                  payload.min = document.getElementById('threshold-below').value;
              } else {
                  payload.min = document.getElementById('threshold-low').value;
                  payload.max = document.getElementById('threshold-high').value;
              }

              return payload;
          }

          async function saveAlert() {
              const payload = getPayload();
              if (!payload.name || !payload.alertEmail || !payload.sensor || !payload.datatype) {
                  showMessage('Fill in name, email, sensor, and reading type.', 'error');
                  return;
              }

              saveButton.disabled = true;
              hideMessage();

              try {
                  const response = await fetch('/user/alert', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                  });
                  const data = await response.json().catch(function () { return {}; });
                  if (!response.ok) {
                      showMessage(data.err || 'Failed to save alert', 'error');
                      return;
                  }
                  showMessage(data.msg || 'Alert saved', 'success');
                  resetForm();
                  await loadSavedAlerts();
              } catch (err) {
                  console.error(err);
                  showMessage('Something went wrong while saving.', 'error');
              } finally {
                  saveButton.disabled = sensorsCache.length === 0;
              }
          }

          async function deleteAlert() {
              if (!editingAlertName) return;
              if (!confirm('Delete alert "' + editingAlertName + '"?')) return;

              try {
                  const response = await fetch('/user/alert', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: editingAlertName }),
                  });
                  const data = await response.json().catch(function () { return {}; });
                  if (!response.ok) {
                      showMessage(data.err || 'Failed to delete', 'error');
                      return;
                  }
                  showMessage('Alert deleted', 'success');
                  resetForm();
                  await loadSavedAlerts();
              } catch (err) {
                  console.error(err);
                  showMessage('Could not delete alert.', 'error');
              }
          }

          function formatTime(iso) {
              const d = new Date(iso);
              return d.toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
              });
          }

          function showTriggerToast(event) {
              if (seenEventIds.has(event.id)) return;
              seenEventIds.add(event.id);

              const alert = event.alert || {};
              const sensor = alert.sensor && alert.sensor.name ? alert.sensor.name : 'sensor';
              const toast = document.createElement('div');
              toast.className = 'trigger-toast';
              toast.dataset.eventId = String(event.id);

              const header = document.createElement('div');
              header.className = 'trigger-toast-header';

              const title = document.createElement('h3');
              title.className = 'trigger-toast-title';
              title.textContent = alert.name || 'Alert triggered';

              const dismiss = document.createElement('button');
              dismiss.type = 'button';
              dismiss.className = 'trigger-toast-dismiss';
              dismiss.setAttribute('aria-label', 'Dismiss');
              dismiss.textContent = '×';
              dismiss.addEventListener('click', function () { toast.remove(); });

              const time = document.createElement('span');
              time.className = 'trigger-toast-time';
              time.textContent = formatTime(event.triggeredAt);

              header.appendChild(title);
              header.appendChild(time);
              header.appendChild(dismiss);

              const body = document.createElement('p');
              body.className = 'trigger-toast-body';
              body.textContent = formatTypeLabel(alert.datatype || 'reading') + ' on "' + sensor + '" hit ' + event.value + ' at ' + formatTime(event.triggeredAt) + '.';

              toast.appendChild(header);
              toast.appendChild(body);
              toastTray.appendChild(toast);
          }

          async function pollAlertEvents() {
              try {
                  const response = await fetch('/user/alert-events?since=' + encodeURIComponent(lastEventPoll), {
                      headers: { Accept: 'application/json' },
                  });
                  if (!response.ok) return;
                  const data = await response.json();
                  const events = data.events || [];
                  if (events.length) {
                      lastEventPoll = new Date().toISOString();
                      events.slice().reverse().forEach(showTriggerToast);
                  }
              } catch (err) {
                  console.error('Poll error', err);
              }
          }

          function showMessage(text, type) {
              const messageEl = document.getElementById('message');
              messageEl.textContent = text;
              messageEl.className = 'message ' + type;
          }

          function hideMessage() {
              document.getElementById('message').className = 'message';
          }

          conditionRadios.forEach(function (radio) {
              radio.addEventListener('change', updateConditionPanels);
          });

          sensorSelect.addEventListener('change', function () {
              populateDatatypesForSensor(sensorSelect.value);
              updateCriteriaPreview();
          });

          ['threshold-above', 'threshold-below', 'threshold-low', 'threshold-high'].forEach(function (id) {
              document.getElementById(id).addEventListener('input', updateCriteriaPreview);
          });

          datatypeSelect.addEventListener('change', updateCriteriaPreview);
          nameInput.addEventListener('input', updateCriteriaPreview);

          saveButton.addEventListener('click', saveAlert);
          cancelEditButton.addEventListener('click', function () {
              resetForm();
              showMessage('Edit cancelled.', 'success');
          });
          deleteButton.addEventListener('click', deleteAlert);

          window.addEventListener('load', function () {
              const app = document.getElementById('app');
              app.style.filter = 'blur(0px)';
              app.style.opacity = '1';
              loadSensors().then(function () {
                  updateConditionPanels();
                  loadSavedAlerts();
              });
              pollAlertEvents();
              setInterval(pollAlertEvents, 5000);
          });
      </script>
  ${NAVBAR_TOGGLE_SCRIPT}
  </body>
  </html>`;
}
