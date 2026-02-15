import express from 'express';
import { prisma } from '../../prismaClient.js';
import logger from '../../logger.js';
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10;
const minPasswLen = 6;

function parseBasicAuth(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Basic ')) return null;

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [email, password] = credentials.split(':');
  return { email, password };
}

const router = express.Router();

router.get('/sensors', (req, res) => {
  res.send(`<!doctype html>
  <html lang="en">
  <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Archeology Sentry - Sensors</title>
      <style>
          :root {
              --bg: #111;
              --fg: #fff;
              --accent: #4ecdc4;
              --muted: #bfbfbf;
              --error: #ff4444;
              --success: #51cf66;
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
              padding: 2rem 1rem;
              padding-top: 6rem;
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
          }

          .nav-link {
              color: #fff;
              background: transparent;
              border: none;
              padding: 10px 14px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              text-decoration: none;
              position: relative;
              outline: none;
              transition: color 0.2s ease;
          }

          .nav-link::after {
              content: '';
              position: absolute;
              left: 0;
              right: 0;
              bottom: -2px;
              height: 2px;
              background: transparent;
              transition: background 180ms ease;
          }

          .nav-link:hover::after,
          .nav-link:focus::after {
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
              box-shadow: 0 2px 12px rgba(78,205,196,0.08);
              transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
          }

          .navbar .cta:hover, .navbar .cta:focus {
              background: #7be3db;
              color: #111;
              box-shadow: 0 4px 24px var(--accent);
              transform: translateY(-2px) scale(1.04);
          }

          .content-header {
              width: 100%;
              max-width: 1100px;
              margin-bottom: 2rem;
              text-align: center;
          }

          .content-header h1 {
              font-size: 2.5rem;
              color: var(--accent);
              margin: 0 0 0.5rem 0;
              font-weight: 700;
          }

          .content-header p {
              font-size: 1.1rem;
              color: var(--muted);
              margin: 0;
          }

          .message-box {
              width: 100%;
              max-width: 1100px;
              padding: 1rem 1.5rem;
              border-radius: 12px;
              margin-bottom: 1.5rem;
              font-size: 0.95rem;
              display: none;
              align-items: center;
              gap: 0.75rem;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .message-box.error {
              background: rgba(255, 68, 68, 0.1);
              border: 1px solid rgba(255, 68, 68, 0.4);
              color: var(--error);
              display: flex;
          }

          .message-box.success {
              background: rgba(81, 207, 102, 0.1);
              border: 1px solid rgba(81, 207, 102, 0.4);
              color: var(--success);
              display: flex;
          }

          .message-box-icon {
              font-size: 1.2rem;
              flex-shrink: 0;
          }

          .message-box-content {
              flex: 1;
              font-weight: 500;
          }

          .message-box-close {
              background: none;
              border: none;
              color: inherit;
              cursor: pointer;
              font-size: 1.3rem;
              padding: 0;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0.7;
              transition: opacity 0.2s ease;
              flex-shrink: 0;
          }

          .message-box-close:hover {
              opacity: 1;
          }

          .action-bar {
              width: 100%;
              max-width: 1100px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 2rem;
              gap: 1rem;
              flex-wrap: wrap;
          }

          .search-box {
              flex: 1;
              min-width: 280px;
              max-width: 500px;
              position: relative;
          }

          .search-box input {
              width: 100%;
              padding: 12px 16px 12px 44px;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.6);
              background: rgba(255,255,255,0.06);
              color: var(--fg);
              font-size: 0.95rem;
              outline: none;
              transition: all 0.3s ease;
          }

          .search-box input:focus {
              border-color: var(--accent);
              background-color: rgba(78,205,196,0.1);
          }

          .search-box input::placeholder {
              color: var(--muted);
          }

          .search-box::before {
              content: '🔍';
              position: absolute;
              left: 16px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 1rem;
              opacity: 0.6;
          }

          .add-sensor-btn {
              background: var(--accent);
              color: #111;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 700;
              padding: 12px 28px;
              cursor: pointer;
              box-shadow: 0 2px 12px rgba(78,205,196,0.08);
              transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
              display: none;
              align-items: center;
              gap: 0.5rem;
              white-space: nowrap;
          }

          .add-sensor-btn.visible {
              display: flex;
          }

          .add-sensor-btn:hover {
              background: #7be3db;
              box-shadow: 0 4px 24px var(--accent);
              transform: translateY(-2px) scale(1.04);
          }

          .add-sensor-btn::before {
              content: '+';
              font-size: 1.3rem;
              font-weight: 700;
          }

          .sensors-grid {
              width: 100%;
              max-width: 1100px;
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
              gap: 1.5rem;
          }

          .sensor-card {
              padding: 2rem;
              border-radius: 16px;
              background: linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
              border: 1px solid rgba(78, 205, 196, 0.25);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              cursor: pointer;
              text-decoration: none;
              color: inherit;
              display: flex;
              flex-direction: column;
              gap: 1rem;
              position: relative;
              overflow: hidden;
          }

          .sensor-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, var(--accent) 0%, #7be3db 100%);
              transform: scaleX(0);
              transform-origin: left;
              transition: transform 0.3s ease;
          }

          .sensor-card:hover::before {
              transform: scaleX(1);
          }

          .sensor-card:hover {
              transform: translateY(-8px) scale(1.02);
              box-shadow: 0 16px 32px rgba(78, 205, 196, 0.3);
              border-color: var(--accent);
              background: linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
          }

          .sensor-card-header {
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-bottom: 0.5rem;
          }

          .sensor-icon {
              width: 48px;
              height: 48px;
              border-radius: 12px;
              background: linear-gradient(135deg, var(--accent) 0%, #7be3db 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.5rem;
              flex-shrink: 0;
              box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
          }

          .sensor-name {
              font-size: 1.5rem;
              font-weight: 700;
              color: var(--fg);
              margin: 0;
              letter-spacing: -0.02em;
          }

          .sensor-types {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
          }

          .sensor-type-badge {
              padding: 0.4rem 0.85rem;
              border-radius: 8px;
              background: rgba(78, 205, 196, 0.12);
              border: 1px solid rgba(78, 205, 196, 0.35);
              font-size: 0.8rem;
              color: var(--accent);
              font-weight: 600;
              letter-spacing: 0.02em;
              text-transform: uppercase;
              transition: all 0.2s ease;
          }

          .sensor-card:hover .sensor-type-badge {
              background: rgba(78, 205, 196, 0.2);
              border-color: var(--accent);
          }

          .loading {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 3rem;
              color: var(--accent);
              font-size: 1.1rem;
          }

          .empty-state {
              text-align: center;
              padding: 4rem 2rem;
              color: var(--muted);
              grid-column: 1 / -1;
          }

          .empty-state h3 {
              color: var(--accent);
              margin-bottom: 0.5rem;
          }

          /* Modal Styles */
          .modal-overlay {
              display: none;
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.75);
              backdrop-filter: blur(8px);
              z-index: 1000;
              align-items: center;
              justify-content: center;
              padding: 1rem;
          }

          .modal-overlay.active {
              display: flex;
          }

          .modal {
              background: #1a1a1a;
              border-radius: 12px;
              border: 1px solid rgba(78, 205, 196, 0.3);
              max-width: 500px;
              width: 100%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          }

          .modal-header {
              padding: 1.5rem 1.5rem 1rem 1.5rem;
              border-bottom: 1px solid rgba(78, 205, 196, 0.2);
          }

          .modal-header h2 {
              margin: 0;
              font-size: 1.5rem;
              font-weight: 700;
              color: var(--accent);
          }

          .modal-body {
              padding: 1.5rem;
          }

          .modal-message {
              padding: 1rem 1.25rem;
              border-radius: 8px;
              margin-bottom: 1.25rem;
              font-size: 0.9rem;
              display: none;
              align-items: center;
              gap: 0.75rem;
          }

          .modal-message.error {
              background: rgba(255, 68, 68, 0.15);
              border: 1px solid rgba(255, 68, 68, 0.5);
              color: var(--error);
              display: flex;
          }

          .modal-message.success {
              background: rgba(81, 207, 102, 0.15);
              border: 1px solid rgba(81, 207, 102, 0.5);
              color: var(--success);
              display: flex;
          }

          .modal-message-icon {
              font-size: 1.1rem;
              flex-shrink: 0;
          }

          .modal-message-content {
              flex: 1;
              font-weight: 500;
          }

          .form-group {
              margin-bottom: 1.25rem;
          }

          .form-group:last-child {
              margin-bottom: 0;
          }

          .form-group label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 600;
              color: var(--fg);
              font-size: 0.95rem;
          }

          .form-group input {
              width: 100%;
              padding: 12px 16px;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.6);
              background: rgba(255,255,255,0.06);
              color: var(--fg);
              font-size: 0.95rem;
              outline: none;
              transition: all 0.3s ease;
          }

          .form-group input:focus {
              border-color: var(--accent);
              background-color: rgba(78,205,196,0.1);
          }

          .form-group input::placeholder {
              color: var(--muted);
          }

          .modal-footer {
              padding: 1rem 1.5rem 1.5rem 1.5rem;
              display: flex;
              gap: 1rem;
              justify-content: flex-end;
          }

          .modal-btn {
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 0.95rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              border: none;
          }

          .modal-btn-primary {
              background: var(--accent);
              color: #111;
          }

          .modal-btn-primary:hover {
              background: #7be3db;
              transform: translateY(-2px);
              box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3);
          }

          .modal-btn-secondary {
              background: transparent;
              color: var(--muted);
              border: 1px solid rgba(78, 205, 196, 0.4);
          }

          .modal-btn-secondary:hover {
              background: rgba(255, 255, 255, 0.05);
              color: var(--fg);
              border-color: var(--accent);
          }

          @media (max-width: 768px) {
              .sensors-grid {
                  grid-template-columns: 1fr;
              }

              .content-header h1 {
                  font-size: 2rem;
              }

              .navbar .cta {
                  font-size: 0.95rem;
                  padding: 10px 20px;
              }

              .page-wrapper {
                  padding-top: 5.5rem;
              }

              .action-bar {
                  flex-direction: column;
                  align-items: stretch;
              }

              .search-box {
                  max-width: 100%;
              }

              .add-sensor-btn {
                  justify-content: center;
              }
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
                  <div class="nav-actions">
                      <a href="/user/admin" class="nav-link">Admin</a>
                      <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
                  </div>
              </nav>
              <div class="page-wrapper">
                  <div class="content-header">
                      <h1>Sensor Dashboard</h1>
                      <p>Select a sensor to view its analytics</p>
                  </div>
                  
                  <div id="message-box" class="message-box">
                      <span class="message-box-icon" id="message-icon"></span>
                      <span class="message-box-content" id="message-content"></span>
                      <button class="message-box-close" onclick="hideMessage()">×</button>
                  </div>

                  <div class="action-bar">
                      <div class="search-box">
                          <input type="text" id="search-input" placeholder="Search sensors..." />
                      </div>
                      <button id="add-sensor-btn" class="add-sensor-btn">
                          Add Sensor
                      </button>
                  </div>
                  <div id="sensors-container" class="sensors-grid"></div>
              </div>
          </div>
      </div>

      <!-- Add Sensor Modal -->
      <div id="sensor-modal" class="modal-overlay">
          <div class="modal">
              <div class="modal-header">
                  <h2>Add New Sensor</h2>
              </div>
              <div class="modal-body">
                  <div id="modal-message" class="modal-message">
                      <span class="modal-message-icon" id="modal-message-icon"></span>
                      <span class="modal-message-content" id="modal-message-content"></span>
                  </div>
                  <form id="sensor-form">
                      <div class="form-group">
                          <label for="sensor-name">Sensor Name</label>
                          <input type="text" id="sensor-name" placeholder="e.g., Temperature Sensor 01" required />
                      </div>
                      <div class="form-group">
                          <label for="sensor-password">Sensor Password</label>
                          <input type="password" id="sensor-password" placeholder="Enter sensor password" required />
                      </div>
                  </form>
              </div>
              <div class="modal-footer">
                  <button class="modal-btn modal-btn-secondary" onclick="closeModal()">Cancel</button>
                  <button class="modal-btn modal-btn-primary" onclick="createSensor()">Create Sensor</button>
              </div>
          </div>
      </div>

      <script>
          let allSensors = [];
          let isAdmin = false;

          function showModalMessage(message, type = 'error') {
              const messageBox = document.getElementById('modal-message');
              const messageIcon = document.getElementById('modal-message-icon');
              const messageContent = document.getElementById('modal-message-content');

              messageBox.className = 'modal-message ' + type;
              messageIcon.textContent = type === 'error' ? '⚠️' : '✓';
              messageContent.textContent = message;
          }

          function hideModalMessage() {
              const messageBox = document.getElementById('modal-message');
              messageBox.className = 'modal-message';
          }

          function showMessage(message, type = 'success') {
              const messageBox = document.getElementById('message-box');
              const messageIcon = document.getElementById('message-icon');
              const messageContent = document.getElementById('message-content');

              messageBox.className = 'message-box ' + type;
              messageIcon.textContent = type === 'error' ? '⚠️' : '✓';
              messageContent.textContent = message;
          }

          function hideMessage() {
              const messageBox = document.getElementById('message-box');
              messageBox.className = 'message-box';
          }

          async function checkAdminPermissions() {
              try {
                  const response = await fetch('/user/permissions');
                  const data = await response.json();
                  isAdmin = data.permissions === true;

                  if (isAdmin) {
                      document.getElementById('add-sensor-btn').classList.add('visible');
                  }
              } catch (error) {
                  console.error('Error checking permissions:', error);
              }
          }

          function getRandomIcon() {
              const icons = ['📡', '🔬', '🌡️', '💧', '⚡', '🔋', '📊', '🎯', '🌐', '⚙️'];
              return icons[Math.floor(Math.random() * icons.length)];
          }

          async function fetchSensors() {
              try {
                  const response = await fetch('/user/load-sensors', { method: 'GET' });
                  if (!response.ok) {
                      throw new Error('Failed to fetch sensors');
                  }
                  const { sensors = [] } = await response.json();
                  return sensors.map(sensor => sensor.name);
              } catch (error) {
                  console.error('Error loading sensors:', error);
                  return [];
              }
          }

          async function fetchSensorTypes() {
              try {
                  const response = await fetch('/user/sensor-data/filters', { method: 'GET' });
                  if (!response.ok) {
                      throw new Error('Failed to fetch sensor types');
                  }
                  const { types = [] } = await response.json();
                  return types;
              } catch (error) {
                  console.error('Error loading sensor types:', error);
                  return [];
              }
          }

          function showLoading() {
              const container = document.getElementById('sensors-container');
              container.innerHTML = '<div class="loading">Loading sensors...</div>';
          }

          function showEmptyState() {
              const container = document.getElementById('sensors-container');
              container.innerHTML = \`
                  <div class="empty-state">
                      <h3>No Sensors Found</h3>
                      <p>No sensors are currently available</p>
                  </div>
              \`;
          }

          function renderSensors(sensors, types, searchTerm = '') {
              const container = document.getElementById('sensors-container');
              container.innerHTML = '';

              const filteredSensors = sensors.filter(sensor =>
                  sensor.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (filteredSensors.length === 0) {
                  if (searchTerm) {
                      container.innerHTML = \`
                          <div class="empty-state">
                              <h3>No Results Found</h3>
                              <p>Try a different search term</p>
                          </div>
                      \`;
                  } else {
                      showEmptyState();
                  }
                  return;
              }

              filteredSensors.forEach(sensor => {
                  const card = document.createElement('a');
                  card.className = 'sensor-card';
                  card.href = \`/user/analytics?sensor=\${encodeURIComponent(sensor)}\`;

                  const header = document.createElement('div');
                  header.className = 'sensor-card-header';

                  const icon = document.createElement('div');
                  icon.className = 'sensor-icon';
                  icon.textContent = getRandomIcon();
                  header.appendChild(icon);

                  const name = document.createElement('h2');
                  name.className = 'sensor-name';
                  name.textContent = sensor;
                  header.appendChild(name);

                  card.appendChild(header);

                  if (types.length > 0) {
                      const typesContainer = document.createElement('div');
                      typesContainer.className = 'sensor-types';
                      
                      types.forEach(type => {
                          const badge = document.createElement('span');
                          badge.className = 'sensor-type-badge';
                          badge.textContent = type.replace('_', ' ');
                          typesContainer.appendChild(badge);
                      });
                      
                      card.appendChild(typesContainer);
                  }

                  container.appendChild(card);
              });
          }

          function openModal() {
              document.getElementById('sensor-modal').classList.add('active');
              hideModalMessage();
          }

          function closeModal() {
              document.getElementById('sensor-modal').classList.remove('active');
              document.getElementById('sensor-form').reset();
              hideModalMessage();
          }

          async function createSensor() {
              const name = document.getElementById('sensor-name').value.trim();
              const passw = document.getElementById('sensor-password').value.trim();

              if (!name || !passw) {
                  showModalMessage('Please fill in all fields', 'error');
                  return;
              }

              try {
                  // Encode credentials as Basic Auth
                  const credentials = btoa(\`\${name}:\${passw}\`);
                  
                  const response = await fetch('/user/create-sensor', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': \`Basic \${credentials}\`
                      }
                  });

                  const data = await response.json();

                  if (!response.ok) {
                      showModalMessage(data.err || 'Failed to create sensor', 'error');
                      return;
                  }

                  closeModal();
                  showMessage('Sensor created successfully!', 'success');
                  await initialize();
              } catch (error) {
                  console.error('Error creating sensor:', error);
                  showModalMessage(error.message || 'An unexpected error occurred', 'error');
              }
          }

          async function initialize() {
              showLoading();
              await checkAdminPermissions();
              const sensors = await fetchSensors();
              const types = await fetchSensorTypes();
              allSensors = sensors;
              renderSensors(sensors, types);
          }

          // Search functionality
          document.addEventListener('DOMContentLoaded', () => {
              const searchInput = document.getElementById('search-input');
              searchInput.addEventListener('input', async (e) => {
                  const types = await fetchSensorTypes();
                  renderSensors(allSensors, types, e.target.value);
              });

              document.getElementById('add-sensor-btn').addEventListener('click', openModal);

              // Close modal on overlay click
              document.getElementById('sensor-modal').addEventListener('click', (e) => {
                  if (e.target.id === 'sensor-modal') {
                      closeModal();
                  }
              });
          });

          initialize();

          window.addEventListener("load", () => {
              const app = document.getElementById("app");
              app.style.filter = "blur(0px)";
              app.style.opacity = "1";
          });
      </script>
  </body>
  </html>`);
});

router.get('/analytics', (req, res) => {
  const sensor = req.query.sensor || '';
  
  if (!sensor) {
      return res.redirect('/sensors');
  }
  
  res.send(`<!doctype html>
  <html lang="en">
  <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.0"></script>
      <title>Archeology Sentry - ${sensor}</title>
      <style>
          :root {
              --bg: #111;
              --fg: #fff;
              --accent: #4ecdc4;
              --muted: #bfbfbf;
              --error: #ff4444;
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

          .page-wrapper {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 2rem 1rem;
              padding-top: 6rem;
              position: relative;
          }

          #app-bg::before {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.85) 100%);
              z-index: 0;
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
          }

          .nav-link {
              color: #fff;
              background: transparent;
              border: none;
              padding: 10px 14px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              text-decoration: none;
              position: relative;
              outline: none;
              transition: color 0.2s ease;
          }

          .nav-link::after {
              content: '';
              position: absolute;
              left: 0;
              right: 0;
              bottom: -2px;
              height: 2px;
              background: transparent;
              transition: background 180ms ease;
          }

          .nav-link:hover::after,
          .nav-link:focus::after {
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
              box-shadow: 0 2px 12px rgba(78,205,196,0.08);
              transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
          }

          .navbar .cta:hover, .navbar .cta:focus {
              background: #7be3db;
              color: #111;
              box-shadow: 0 4px 24px var(--accent);
              transform: translateY(-2px) scale(1.04);
          }

          .page-header {
              width: 100%;
              max-width: 1100px;
              margin-bottom: 1.5rem;
              text-align: center;
          }

          .page-header h1 {
              font-size: 2.2rem;
              color: var(--accent);
              margin: 0 0 0.25rem 0;
              font-weight: 700;
          }

          .page-header p {
              font-size: 1rem;
              color: var(--muted);
              margin: 0;
          }

          .timeframe-selector {
              width: 100%;
              max-width: 1100px;
              display: flex;
              gap: 0.75rem;
              flex-wrap: wrap;
              margin-bottom: 1.5rem;
              justify-content: center;
          }

          .timeframe-btn {
              padding: 10px 20px;
              border-radius: 8px;
              border: 1px solid rgba(78, 205, 196, 0.3);
              background: rgba(255, 255, 255, 0.05);
              color: var(--fg);
              font-size: 0.9rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
          }

          .timeframe-btn:hover {
              background: rgba(78, 205, 196, 0.1);
              border-color: var(--accent);
              transform: translateY(-2px);
          }

          .timeframe-btn.active {
              background: var(--accent);
              color: #111;
              border-color: var(--accent);
          }

          .timeframe-btn.custom {
              border-style: dashed;
          }

          .custom-range-container {
              width: 100%;
              max-width: 1100px;
              margin-bottom: 1.5rem;
              padding: 1.25rem;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(78, 205, 196, 0.25);
              display: none;
              align-items: center;
              gap: 1rem;
          }

          .custom-range-container.active {
              display: flex;
          }

          .custom-range-inputs {
              display: flex;
              gap: 1rem;
              flex: 1;
              align-items: center;
          }

          .custom-range-inputs label {
              color: var(--muted);
              font-size: 0.9rem;
              font-weight: 600;
          }

          .custom-range-inputs input {
              flex: 1;
              padding: 10px 12px;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.6);
              background: rgba(255,255,255,0.06);
              color: var(--fg);
              font-size: 0.9rem;
              outline: none;
          }

          .custom-range-inputs input:focus {
              border-color: var(--accent);
              background-color: rgba(78,205,196,0.1);
          }

          .custom-range-apply {
              padding: 10px 24px;
              border-radius: 8px;
              border: none;
              background: var(--accent);
              color: #111;
              font-size: 0.9rem;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.2s ease;
          }

          .custom-range-apply:hover {
              background: #7be3db;
              transform: translateY(-2px);
          }

          #list-wrapper {
              width: 100%;
              max-width: 1100px;
              display: flex;
              flex-direction: column;
              gap: 2rem;
          }

          .loading {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 3rem;
              color: var(--accent);
              font-size: 1.1rem;
          }

          .empty-state {
              text-align: center;
              padding: 4rem 2rem;
              color: var(--muted);
          }

          .empty-state h3 {
              color: var(--accent);
              margin-bottom: 0.5rem;
          }

          canvas {
              width: 100%;
              aspect-ratio: 16 / 9;
              border-radius: 12px;
              padding: 1rem;
              background: rgba(255,255,255,0.04);
              border: 1px solid rgba(78,205,196,0.3);
          }

          .cls-button {
              background: transparent;
              color: var(--accent);
              border: 1px solid var(--accent);
              border-radius: 8px;
              font-size: 0.95rem;
              font-weight: 600;
              padding: 10px 24px;
              cursor: pointer;
              transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
              letter-spacing: 0.3px;
          }

          .cls-button:hover, .cls-button:focus {
              background: var(--accent);
              color: #111;
              box-shadow: 0 4px 16px rgba(78,205,196,0.3);
              transform: translateY(-2px);
          }

          .cls-button:active {
              transform: translateY(0);
          }

          .dataset-wrapper {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              padding: 1rem 1.5rem;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(78, 205, 196, 0.3);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .dataset-wrapper:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
          }

          @media (max-width: 768px) {
              canvas {
                  aspect-ratio: 4 / 3;
              }
              .navbar .cta {
                  font-size: 0.95rem;
                  padding: 10px 20px;
              }
              .page-wrapper {
                  padding-top: 5.5rem;
                  padding-left: 0.75rem;
                  padding-right: 0.75rem;
              }
              .timeframe-selector {
                  gap: 0.5rem;
              }
              .timeframe-btn {
                  padding: 8px 16px;
                  font-size: 0.85rem;
              }
              .custom-range-container {
                  flex-direction: column;
                  align-items: stretch;
              }
              .custom-range-inputs {
                  flex-direction: column;
              }
              .custom-range-apply {
                  width: 100%;
              }
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
                  <div class="nav-actions">
                      <a href="/user/sensors" class="nav-link">← Back to Sensors</a>
                      <a href="/user/admin" class="nav-link">Admin</a>
                      <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
                  </div>
              </nav>
              <div class="page-wrapper">
                  <div class="page-header">
                      <h1>${sensor}</h1>
                      <p>Viewing sensor analytics</p>
                  </div>

                  <div class="timeframe-selector">
                      <button class="timeframe-btn" data-timeframe="900000">15 min</button>
                      <button class="timeframe-btn" data-timeframe="1800000">30 min</button>
                      <button class="timeframe-btn active" data-timeframe="3600000">1 hour</button>
                      <button class="timeframe-btn" data-timeframe="21600000">6 hours</button>
                      <button class="timeframe-btn" data-timeframe="86400000">24 hours</button>
                      <button class="timeframe-btn" data-timeframe="604800000">7 days</button>
                      <button class="timeframe-btn custom" data-timeframe="custom">Custom</button>
                  </div>

                  <div class="custom-range-container" id="custom-range-container">
                      <div class="custom-range-inputs">
                          <label>From:</label>
                          <input id="start-datetime" type="datetime-local" />
                          <label>To:</label>
                          <input id="end-datetime" type="datetime-local" />
                      </div>
                      <button class="custom-range-apply" onclick="applyCustomRange()">Apply</button>
                  </div>

                  <div id="list-wrapper"></div>
              </div>
          </div>
      </div>

      <script>
          const SENSOR = '${sensor}';
          let currentTimeframe = '3600000';
          let customStart = null;
          let customEnd = null;

          function buildFilterParams() {
              const params = new URLSearchParams();
              params.append('userEmail', SENSOR);

              if (currentTimeframe === 'custom' && customStart && customEnd) {
                  params.append('start', customStart);
                  params.append('end', customEnd);
              } else if (currentTimeframe !== 'custom') {
                  params.append('timeframe', currentTimeframe);
              }

              return params.toString();
          }

          async function fetch_analytics() {
              try {
                  const query = buildFilterParams();
                  const response = await fetch(\`/user/sensor-data?\${query}\`, { method: 'GET' });
                  
                  if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ err: 'Failed to fetch data' }));
                      throw new Error(errorData.err || 'Failed to fetch analytics');
                  }

                  const data = await response.json();
                  return data;
              } catch (error) {
                  console.error('Error fetching analytics:', error);
                  alert(error.message || 'Failed to fetch analytics data');
                  return {};
              }
          }

          function render_analytics(analytics) {
              const canvasContainer = document.getElementById("list-wrapper");

              type_range = {
                  "temperature": [32, 122],
                  "humidity": [0, 100],
                  "motion": [0, 1],
                  "soil_moisture": [0, 100],
                  "pressure": [870, 1085],
                  "internal_temp": [32, 122],
                  "accel_x": [-78.4, 78.4],
                  "accel_y": [-78.4, 78.4],
                  "accel_z": [-78.4, 78.4],
                  "gyro_x": [-34.9, 34.9],
                  "gyro_y": [-34.9, 34.9],
                  "gyro_z": [-34.9, 34.9],
                  "light": [0, 188000],
                  "uv": [0, 15]
              }

              nominal_range = {
                  "temperature": [65, 75],
                  "humidity": [30, 50],
                  "motion": [0, 0],
                  "soil_moisture": [40, 60],
                  "pressure": [1000, 1020],
                  "internal_temp": [65, 75],
                  "accel_x": [-1, 1],
                  "accel_y": [-1, 1],
                  "accel_z": [8.8, 10.8],
                  "gyro_x": [-0.1, 0.1],
                  "gyro_y": [-0.1, 0.1],
                  "gyro_z": [-0.1, 0.1],
                  "light": [0, 1000],
                  "uv": [0, 2]
              }

              for (let user in analytics) {
                  let user_analytics = analytics[user];
                  const split_ref = user.split(" ");
                  const range = type_range[split_ref[1]]
                  const nominalMin = nominal_range[split_ref[1]][0];
                  const nominalMax = nominal_range[split_ref[1]][1];

                  const dataBelowNominal = [];
                  const dataNormal = [];
                  const dataAboveNominal = [];

                  let minTime = null;
                  let maxTime = null;

                  user_analytics.forEach(point => {
                      if (!minTime || point.x < minTime) minTime = point.x;
                      if (!maxTime || point.x > maxTime) maxTime = point.x;

                      if (point.y < nominalMin) {
                          dataBelowNominal.push(point);
                      } else if (point.y > nominalMax) {
                          dataAboveNominal.push(point);
                      } else {
                          dataNormal.push(point);
                      }
                  });

                  const minThresholdLine = minTime && maxTime ? [
                      { x: minTime, y: nominalMin },
                      { x: maxTime, y: nominalMin }
                  ] : [];
                  const maxThresholdLine = minTime && maxTime ? [
                      { x: minTime, y: nominalMax },
                      { x: maxTime, y: nominalMax }
                  ] : [];

                  const wrapper_div = document.createElement("div")
                  wrapper_div.className = 'dataset-wrapper'
                  canvasContainer.appendChild(wrapper_div)

                  const canvas = document.createElement("canvas")
                  canvas.id = \`canvas-\${user}\`
                  canvas.width = 200
                  canvas.height = 100
                  wrapper_div.appendChild(canvas)

                  const cls_button = document.createElement("button")
                  cls_button.addEventListener('click', () => {
                      cls_data(event.target.id);
                  })
                  cls_button.className = 'cls-button'
                  cls_button.id = user
                  cls_button.textContent = 'Clear Data'
                  wrapper_div.appendChild(cls_button)

                  const ctx = canvas.getContext("2d");
                  new Chart(ctx, {
                      type: 'line',
                      data: {
                          datasets: [
                              {
                                  data: dataBelowNominal,
                                  borderColor: 'rgba(100, 149, 237, 1)',
                                  backgroundColor: 'rgba(100, 149, 237, 0.1)',
                                  borderWidth: 2,
                                  pointRadius: 4,
                                  pointBackgroundColor: 'rgba(100, 149, 237, 1)',
                                  pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                                  pointBorderWidth: 1.5,
                                  pointHoverRadius: 6,
                                  pointHoverBackgroundColor: 'rgba(100, 149, 237, 1)',
                                  pointHoverBorderColor: 'rgba(255, 255, 255, 1)',
                                  pointHoverBorderWidth: 2,
                                  fill: false,
                                  tension: 0.1
                              },
                              {
                                  data: dataNormal,
                                  borderColor: 'rgba(75, 192, 192, 1)',
                                  backgroundColor: 'rgba(75, 192, 192, 0.1)',
                                  borderWidth: 2,
                                  pointRadius: 3,
                                  pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                                  pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                                  pointBorderWidth: 1.5,
                                  pointHoverRadius: 5,
                                  pointHoverBackgroundColor: 'rgba(75, 192, 192, 1)',
                                  pointHoverBorderColor: 'rgba(255, 255, 255, 1)',
                                  pointHoverBorderWidth: 2,
                                  fill: false,
                                  tension: 0.1
                              },
                              {
                                  data: dataAboveNominal,
                                  borderColor: 'rgba(255, 99, 132, 1)',
                                  backgroundColor: 'rgba(255, 99, 132, 0.1)',
                                  borderWidth: 2,
                                  pointRadius: 4,
                                  pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                                  pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                                  pointBorderWidth: 1.5,
                                  pointHoverRadius: 6,
                                  pointHoverBackgroundColor: 'rgba(255, 99, 132, 1)',
                                  pointHoverBorderColor: 'rgba(255, 255, 255, 1)',
                                  pointHoverBorderWidth: 2,
                                  fill: false,
                                  tension: 0.1
                              },
                              {
                                  data: minThresholdLine,
                                  borderColor: 'rgba(100, 149, 237, 0.6)',
                                  borderWidth: 2,
                                  borderDash: [5, 5],
                                  pointRadius: 0,
                                  pointHoverRadius: 0,
                                  fill: false,
                                  tension: 0,
                                  order: -1
                              },
                              {
                                  data: maxThresholdLine,
                                  borderColor: 'rgba(255, 99, 132, 0.6)',
                                  borderWidth: 2,
                                  borderDash: [5, 5],
                                  pointRadius: 0,
                                  pointHoverRadius: 0,
                                  fill: false,
                                  tension: 0,
                                  order: -1
                              }
                          ]
                      },
                      options: {
                          plugins: {
                              title: {
                                  display: true,
                                  text: split_ref[1].charAt(0).toUpperCase() + split_ref[1].slice(1).replace('_', ' '),
                                  font: {
                                      size: 20,
                                  },
                                  color: '#ffffff89',
                                  padding: { top: 10, bottom: 20 },
                                  align: 'center'
                              },
                              legend: { display: false },
                              tooltip: {
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  titleColor: '#ffffff',
                                  bodyColor: '#ffffff',
                                  borderColor: 'rgba(78, 205, 196, 0.5)',
                                  borderWidth: 1,
                                  padding: 12,
                                  displayColors: true,
                                  callbacks: {
                                      label: function(context) {
                                          let label = context.dataset.label || '';
                                          if (label) {
                                              label += ': ';
                                          }
                                          label += context.parsed.y.toFixed(1);
                                          return label;
                                      }
                                  }
                              }
                          },
                          scales: {
                              x: {
                                  type: 'time',
                                  time: {
                                      unit: 'minute',
                                      displayFormats: {
                                          hour: 'HH:mm'
                                      }
                                  },
                                  title: {
                                      display: true,
                                      text: 'Time',
                                      font: {
                                          size: 16,
                                      },
                                      color: '#ffffff89'
                                  },
                                  grid: {
                                      color: 'rgba(255, 255, 255, 0.1)'
                                  },
                                  ticks: {
                                      color: '#ffffff89'
                                  }
                              },
                              y: {
                                  beginAtZero: false,
                                  suggestedMin: range[0],
                                  suggestedMax: range[1],
                                  title: {
                                      display: true,
                                      text: split_ref[1].charAt(0).toUpperCase() + split_ref[1].slice(1).replace('_', ' '),
                                      font: {
                                          size: 16,
                                      },
                                      color: '#ffffff89'
                                  },
                                  grid: {
                                      color: 'rgba(255, 255, 255, 0.1)'
                                  },
                                  ticks: {
                                      color: '#ffffff89'
                                  }
                              }
                          }
                      }
                  })
              }
          }

          function showLoading() {
              const wrapper = document.getElementById('list-wrapper');
              wrapper.innerHTML = '<div class="loading">Loading analytics...</div>';
          }

          function showEmptyState() {
              const wrapper = document.getElementById('list-wrapper');
              wrapper.innerHTML = \`
                  <div class="empty-state">
                      <h3>No Data Available</h3>
                      <p>Try adjusting your timeframe to see more results</p>
                  </div>
              \`;
          }

          async function loadAnalytics() {
              showLoading();
              
              try {
                  const analytics = await fetch_analytics();
                  const wrapper = document.getElementById('list-wrapper');
                  wrapper.innerHTML = '';
                  
                  if (Object.keys(analytics).length === 0) {
                      showEmptyState();
                  } else {
                      render_analytics(analytics);
                  }
              } catch (error) {
                  const wrapper = document.getElementById('list-wrapper');
                  wrapper.innerHTML = \`
                      <div class="empty-state">
                          <h3>Error Loading Data</h3>
                          <p>\${error.message || 'Please try again'}</p>
                      </div>
                  \`;
              }
              
              await checkAnalyticsPermissions();
          }

          function applyCustomRange() {
              const start = document.getElementById('start-datetime').value;
              const end = document.getElementById('end-datetime').value;

              if (!start || !end) {
                  alert('Please select both start and end dates');
                  return;
              }

              customStart = new Date(start).toISOString();
              customEnd = new Date(end).toISOString();
              loadAnalytics();
          }

          async function checkAnalyticsPermissions() {
              try {
                  const response = await fetch('/user/permissions');
                  const data = await response.json();
                  const hasPermissions = data.permissions === true;

                  const clearButtons = document.querySelectorAll('.cls-button');
                  
                  if (!hasPermissions) {
                      clearButtons.forEach(button => {
                          button.style.display = 'none';
                      });
                  }
              } catch (error) {
                  console.error('Error fetching permissions:', error);
              }
          }

          // Timeframe button handling
          document.querySelectorAll('.timeframe-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                  const timeframe = btn.getAttribute('data-timeframe');
                  
                  // Update active state
                  document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                  btn.classList.add('active');
                  
                  currentTimeframe = timeframe;
                  
                  // Show/hide custom range
                  const customContainer = document.getElementById('custom-range-container');
                  if (timeframe === 'custom') {
                      customContainer.classList.add('active');
                  } else {
                      customContainer.classList.remove('active');
                      customStart = null;
                      customEnd = null;
                      loadAnalytics();
                  }
              });
          });

          (async () => {
              await loadAnalytics();
          })();

          window.addEventListener("load", () => {
              const app = document.getElementById("app");
              app.style.filter = "blur(0px)";
              app.style.opacity = "1";
          });

          function cls_data(ref) {
              fetch('/user/cls-data', {
                  method: 'DELETE',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      ref: ref
                  })
              });
          }
      </script>
  </body>
  </html>`);
});

router.post('/set-permissions', async (req, res) => {
  try {
    const auth = parseBasicAuth(req);
    if (!auth) return res.status(400).json({ err: 'Missing Basic Auth' });
    const admin = req.body.admin || false
    if (typeof admin !== 'boolean') {
      return req.status(400).json({err: "Invalid permissions"})
    }

    const userId = req.userID;
    const passw = auth.password;
    if (typeof passw !== 'string') {     // Input validation
      return res.status(400).json({ err: 'Invalid password' });
    }
    const passwCorrect = await bcrypt.compare(passw, Buffer.from(process.env.PASSW, 'base64').toString('utf8'));
    if (passwCorrect) {
      await prisma.user.update({
        where: {id: userId},
        data: {admin: admin}
      })
      return res.status(200).json({ msg: "Successfully updated permissions"})
    }
    return res.status(403).json({ msg: "Passw incorrect"})
  } catch (error) {
    logger.error('Error setting user permissions:', error);
    return res.status(500).json({ err: 'Internal server error' });
  }
})

router.get('/admin', (req, res) => {
  res.send(`<!doctype html>
  <html lang="en">
  <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Archeology Sentry - Admin Access</title>
      <style>
          :root {
              --bg: #111;
              --fg: #fff;
              --accent: #4ecdc4;
              --muted: #bfbfbf;
              --error: #ff4444;
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
              padding: 2rem 1rem;
              padding-top: 6rem;
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
          }

          .nav-link {
              color: #fff;
              background: transparent;
              border: none;
              padding: 10px 14px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              text-decoration: none;
              position: relative;
              outline: none;
              transition: color 0.2s ease;
          }

          .nav-link::after {
              content: '';
              position: absolute;
              left: 0;
              right: 0;
              bottom: -2px;
              height: 2px;
              background: transparent;
              transition: background 180ms ease;
          }

          .nav-link:hover::after,
          .nav-link:focus::after {
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
              box-shadow: 0 2px 12px rgba(78,205,196,0.08);
              transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
          }

          .navbar .cta:hover, .navbar .cta:focus {
              background: #7be3db;
              color: #111;
              box-shadow: 0 4px 24px var(--accent);
              transform: translateY(-2px) scale(1.04);
          }

          .content-container {
              width: 100%;
              max-width: 600px;
              display: flex;
              flex-direction: column;
              align-items: center;
          }

          .content-header {
              width: 100%;
              margin-bottom: 2rem;
              text-align: center;
          }

          .content-header h1 {
              font-size: 2.5rem;
              color: var(--accent);
              margin: 0 0 0.5rem 0;
              font-weight: 700;
          }

          .content-header p {
              font-size: 1.1rem;
              color: var(--muted);
              margin: 0;
          }

          .admin-card {
              width: 100%;
              padding: 2rem;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(78, 205, 196, 0.3);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .status-section {
              margin-bottom: 2rem;
              padding: 1.5rem;
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(78, 205, 196, 0.2);
              text-align: center;
          }

          .status-label {
              font-size: 0.9rem;
              color: var(--muted);
              margin-bottom: 0.5rem;
          }

          .status-value {
              font-size: 1.5rem;
              font-weight: 700;
              color: var(--accent);
          }

          .status-value.active {
              color: #51cf66;
          }

          .status-value.inactive {
              color: var(--muted);
          }

          .form-section {
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
          }

          .form-group {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
          }

          .form-group label {
              font-weight: 600;
              color: var(--fg);
              font-size: 0.95rem;
          }

          .form-group input {
              width: 100%;
              padding: 12px 16px;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.6);
              background: rgba(255,255,255,0.06);
              color: var(--fg);
              font-size: 0.95rem;
              outline: none;
              transition: all 0.3s ease;
          }

          .form-group input:focus {
              border-color: var(--accent);
              background-color: rgba(78,205,196,0.1);
          }

          .form-group input::placeholder {
              color: var(--muted);
          }

          .button-group {
              display: flex;
              gap: 1rem;
              margin-top: 1rem;
          }

          .btn {
              flex: 1;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 0.95rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              border: none;
          }

          .btn-primary {
              background: var(--accent);
              color: #111;
          }

          .btn-primary:hover {
              background: #7be3db;
              transform: translateY(-2px);
              box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3);
          }

          .btn-primary:disabled {
              opacity: 0.5;
              cursor: not-allowed;
              transform: none;
          }

          .btn-secondary {
              background: transparent;
              color: var(--muted);
              border: 1px solid rgba(78, 205, 196, 0.4);
          }

          .btn-secondary:hover {
              background: rgba(255, 255, 255, 0.05);
              color: var(--fg);
              border-color: var(--accent);
          }

          .message {
              padding: 1rem;
              border-radius: 8px;
              margin-top: 1rem;
              font-size: 0.9rem;
              display: none;
          }

          .message.success {
              background: rgba(81, 207, 102, 0.1);
              border: 1px solid rgba(81, 207, 102, 0.4);
              color: #51cf66;
              display: block;
          }

          .message.error {
              background: rgba(255, 68, 68, 0.1);
              border: 1px solid rgba(255, 68, 68, 0.4);
              color: var(--error);
              display: block;
          }

          @media (max-width: 768px) {
              .content-header h1 {
                  font-size: 2rem;
              }

              .navbar .cta {
                  font-size: 0.95rem;
                  padding: 10px 20px;
              }

              .page-wrapper {
                  padding-top: 5.5rem;
              }

              .button-group {
                  flex-direction: column;
              }
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
                  <div class="nav-actions">
                      <a href="/user/sensors" class="nav-link">Sensors</a>
                      <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
                  </div>
              </nav>
              <div class="page-wrapper">
                  <div class="content-container">
                      <div class="content-header">
                          <h1>Admin Access</h1>
                          <p>Request administrator permissions</p>
                      </div>

                      <div class="admin-card">
                          <div class="status-section">
                              <div class="status-label">Current Status</div>
                              <div class="status-value" id="admin-status">Loading...</div>
                          </div>

                          <div class="form-section">
                              <div class="form-group">
                                  <label for="admin-password">Admin Password</label>
                                  <input 
                                      type="password" 
                                      id="admin-password" 
                                      placeholder="Enter admin password" 
                                      required 
                                  />
                              </div>

                              <div class="button-group">
                                  <button class="btn btn-secondary" onclick="resetForm()">Reset</button>
                                  <button class="btn btn-primary" id="submit-btn" onclick="submitRequest()">Submit</button>
                              </div>

                              <div class="message" id="message"></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <script>
          async function checkAdminStatus() {
              try {
                  const response = await fetch('/user/permissions');
                  const data = await response.json();
                  const isAdmin = data.permissions === true;

                  const statusEl = document.getElementById('admin-status');
                  if (isAdmin) {
                      statusEl.textContent = 'Administrator';
                      statusEl.className = 'status-value active';
                  } else {
                      statusEl.textContent = 'Standard User';
                      statusEl.className = 'status-value inactive';
                  }

                  return isAdmin;
              } catch (error) {
                  console.error('Error checking admin status:', error);
                  document.getElementById('admin-status').textContent = 'Error';
                  return false;
              }
          }

          function resetForm() {
              document.getElementById('admin-password').value = '';
              hideMessage();
          }

          function showMessage(text, type) {
              const messageEl = document.getElementById('message');
              messageEl.textContent = text;
              messageEl.className = 'message ' + type;
          }

          function hideMessage() {
              const messageEl = document.getElementById('message');
              messageEl.className = 'message';
          }

          async function submitRequest() {
              const password = document.getElementById('admin-password').value.trim();
              const submitBtn = document.getElementById('submit-btn');

              if (!password) {
                  showMessage('Please enter the admin password', 'error');
                  return;
              }

              submitBtn.disabled = true;
              submitBtn.textContent = 'Processing...';
              hideMessage();

              try {
                  const credentials = btoa(\`:\${password}\`);
                  
                  const response = await fetch('/user/set-permissions', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': \`Basic \${credentials}\`
                      },
                      body: JSON.stringify({ admin: true })
                  });

                  const data = await response.json();

                  if (response.ok) {
                      showMessage(data.msg || 'Permissions updated successfully!', 'success');
                      await checkAdminStatus();
                      resetForm();
                  } else {
                      showMessage(data.err || data.msg || 'Failed to update permissions', 'error');
                  }
              } catch (error) {
                  console.error('Error updating permissions:', error);
                  showMessage('An error occurred. Please try again.', 'error');
              } finally {
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Submit';
              }
          }

          // Initialize
          checkAdminStatus();

          window.addEventListener("load", () => {
              const app = document.getElementById("app");
              app.style.filter = "blur(0px)";
              app.style.opacity = "1";
          });
      </script>
  </body>
  </html>`);
});

router.get('/active-id', async (req, res) => {
  return res.status(200).json({ id: req.userID})
})

router.delete('/delete-sensor', async (req, res) => {
  try {
    const sensorId = req.sensorId;
    const userId = req.userID
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    if (!user.admin) {
      return res.status(403).json({ err: "Must have admin permissions" })
    }
    await prisma.dataPoint.deleteMany({
      where: { sensorId: sensorId }
    });
    await prisma.sensor.delete({
      where: {
        id: sensorId
      }
    })
    return res.status(200).json({ msg: "Successfully deleted sensor" })
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({ err: 'Internal server error' });
  }
})

router.post('/sensor-data', async (req, res) => {
    try {
        const { type, value } = req.body;

        if (typeof type !== 'string' || typeof value !== 'number') {
            return res.status(400).json({ err: 'Invalid sensor data format' });
        }

      // Ensure the request is authenticated and sensor exists
      const sensorId  = req.sensorID;
      if (!sensorId) {
        return res.status(401).json({ err: 'Not authenticated' });
      }

      const sensor = await prisma.sensor.findUnique({ where: { id: sensorId } });
      if (!sensor) {
        return res.status(400).json({ err: 'Sensor not found' });
      }

      // Create datapoint and connect to sensor relation
      await prisma.dataPoint.create({
        data: {
          type,
          value,
          sensor: { connect: { id: sensorId } }
        }
      });

        return res.status(200).json({ msg: 'Sensor data saved successfully' });
    } catch (error) {
        logger.error('Error saving sensor data:', error);
        return res.status(500).json({ err: 'Internal server error' });
    }
});

router.get('/user-risk', async (req, res) => {
  try {
    const datapoints = prisma.DataPoint.findMany()
  } catch (error) {
        logger.error('Error retrieving sensor risk data:', error);
        return res.status(500).json({ err: 'Internal server error' });
    }
})

router.get('/sensor-data/filters', async (req, res) => {
  try {
    // Get all data points to extract unique types and users
    const dataPoints = await prisma.dataPoint.findMany({
      select: {
        type: true,
        sensor: {
          select: {
            name: true
          }
        }
      }
    });

    // Extract unique types and names
    const types = [...new Set(dataPoints.map(dp => dp.type))].filter(Boolean).sort();
    const sensorNames = [...new Set(dataPoints.map(dp => dp.sensor.name))].filter(Boolean).sort();

    return res.status(200).json({
      types,
      users: sensorNames
    });
  } catch (error) {
    logger.error('Error fetching filter options:', error);
    return res.status(500).json({ err: 'Internal server error' });
  }
});

router.get('/sensor-data', async (req, res) => {
  try {
    const { timeframe, start, end, type, userEmail } = req.query;

    // Build where clause for filtering
    const whereClause = {};

    // Handle timeframe - either relative (timeframe) or absolute (start/end)
    if (start && end) {
      // Custom date range
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ err: 'Invalid date format for start or end' });
      }
      
      if (startDate > endDate) {
        return res.status(400).json({ err: 'Start date must be before end date' });
      }

      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };
    } else if (timeframe) {
      // Relative timeframe
      const timeframeMs = parseInt(timeframe);
      if (isNaN(timeframeMs) || timeframeMs <= 0) {
        return res.status(400).json({ err: 'Invalid timeframe value' });
      }
      
      const sinceDate = new Date(Date.now() - timeframeMs);
      whereClause.createdAt = { gte: sinceDate };
    } else {
      // Default to last hour if no timeframe specified
      const sinceDate = new Date(Date.now() - 3600000);
      whereClause.createdAt = { gte: sinceDate };
    }

    // Filter by data type if provided
    if (type) {
      whereClause.type = type;
    }

    // Filter by user email if provided
    if (userEmail) {
      const sensor = await prisma.sensor.findUnique({
        where: { name: userEmail }
      });
      
      if (!sensor) {
        return res.status(404).json({ err: 'Sensor not found' });
      }
      
      whereClause.sensorId = sensor.id;
    }

    const data = await prisma.dataPoint.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        value: true,
        type: true,
        sensor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    let analytics = {}

    for (let i = 0; i < data.length; i++) {
        const point = data[i];
        const name = point.sensor.name;
        const type = point.type
        const fref = name + " " + type

        if (!analytics[fref]) {
            analytics[fref] = [];
        }

        analytics[fref].push({
            x: point.createdAt,
            y: point.value
        });
    }
          
    return res.status(200).json(analytics);
  } catch (error) {
    logger.error('Error retrieving sensor data:', error);
    return res.status(500).json({ err: 'Internal server error' });
  }
});

router.get('/permissions', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({where: {id: req.userID}})
    return res.status(200).json({ permissions: user.admin })
  } catch (error) {
    logger.error('Error retrieving permissions:', error);
    return res.status(500).json({ err: 'Internal server error' });
  }
})

router.delete('/cls-data', async (req, res) => {
  const data_name_type = req.body.ref;
  const split_ref = data_name_type.split(" ");
  const name = split_ref[0]
  const type = split_ref[1]
  
  try {
    const sensor = await prisma.sensor.findUnique({
      where: {
        name: name
      }
    });

    if (!sensor) {
      return res.status(400).json({err: 'Sensor Not Found'})
    }

    if (!sensor.admin) {
      return res.status(403).json({ msg: "Must be admin" })
    }
    
    await prisma.dataPoint.deleteMany({
      where: {
        sensorId: sensor.id,
        type: type
      }
    });

    return res.status(200).json({ msg: 'Successfully Cleared Data' } )
  } catch (error) {
    logger.error('Error clearing sensor data:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.get('/get-users', async (req, res) => {
  try {
    const users = await prisma.sensor.findMany();

    return res.status(200).json(users)
  } catch {
    logger.error('Error retrieving data:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.post('/user-location', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {id: req.userID}
    })
    if (!user.admin) {
      return res.status(403).json({ msg: "Must be admin" })
    }
      await prisma.sensor.update({
        where: {id: req.body.id},
        data: {x: req.body.x, y: req.body.y}
      })
      return res.status(200).json({ msg: "Successfully updated sensor location"})
  } catch (error) {
    logger.error('Error updating sensor location:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.delete('/user-location', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {id: req.userID}
    })
    if (!user.admin) {
      return res.status(403).json({ msg: "Must be admin" })
    }
      await prisma.user.update({
        where: {id: req.body.id},
        data: {x: null, y: null}
      })
      return res.status(200).json({ msg: "Successfully deleted sensor location"})
  } catch (error) {
    logger.error('Error deleting sensor location:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.get('/get-boundaries', async (req, res) => {
  try {
    const boundaries = await prisma.Boundary.findMany();
    return res.status(200).json(boundaries)
  } catch {
    logger.error('Error retrieving data:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.delete('/boundary', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {id: req.userId}
    })
    if (!user.admin) {
      return res.status(403).json({ msg: "Must be admin" })
    }
    const id = req.body.id
    const boundary = await prisma.Boundary.delete({
      where: {id: id}
    })
    return res.status(200).json({ msg: "Successfully deleted boundary" })
  } catch (error) {
    logger.error('Error deleting boundary:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.post('/boundary', async (req, res) => {
  try {
    const x = req.body.x
    const y = req.body.y
    const width = req.body.width
    const height = req.body.height
    const id = req.body.id
    
    if (id) {
      const user = await prisma.user.findUnique({
        where: {id: req.userID}
      })
      if (!user.admin) {
        return res.status(403).json({ msg: "Must be admin" })
      }
      // Update existing boundary
      const boundary = await prisma.Boundary.update({
        where: { id: id },
        data: {
          x: x,
          y: y,
          width: width,
          height: height
        }
      })
      return res.status(200).json({ msg: "Successfully updated boundary", id: boundary.id })
    } else {
      // Create new boundary
      const boundary = await prisma.Boundary.create({
        data: {
          x: x,
          y: y,
          width: width,
          height: height
        }
      })
      return res.status(200).json({ msg: "Successfully created boundary", id: boundary.id })
    }
  } catch (error) {
    logger.error('Error saving boundary:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.post('/create-sensor', async (req, res) => {
  try {
    const userId = req.userID;
    const user = await prisma.user.findUnique({
      where: {id: userId}
    })
    if (!user.admin) {
      return res.status(403).json({err: "Must be an admin"})
    }
    const auth = parseBasicAuth(req)
    if (typeof auth.password !== 'string' || auth.password.length < minPasswLen) {     // Input validation
      return res.status(400).json({ err: 'Invalid password' });
    }
    const existing = await prisma.sensor.findUnique({
      where: {name:auth.email}
    })
    if (existing) {
      return res.status(400).json({err: "Sensor already exists"})
    }
    await prisma.sensor.create({
      data: {
        name:auth.email,
        passw:await bcrypt.hash(auth.password, SALT_ROUNDS),
      }
    })
    return res.status(200).json({msg: "Successfully created sensor"})
  } catch (error) {
    logger.error('Error creating sensor:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.get('/load-sensors', async (req, res) => {
  try {
    const sensors = await prisma.sensor.findMany()
    return res.status(200).json({sensors})
  } catch (error) {
    logger.error('Error loading sensors:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

export default router;
