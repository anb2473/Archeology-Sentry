import express from 'express';
import { prisma } from '../../prismaClient.js';
import logger from '../../logger.js';

const router = express.Router();

router.get('/analytics', (req, res) => {
    res.send(`<!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.0"></script>
        <title>Analytics - Archeology Sentry</title>
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
              background-attachment: fixed; /* Keeps it from scrolling */
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
                top: 0; left: 0;
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

            /* Filter styling */
            .search-label {
                margin-bottom: 0.35rem;
                font-size: 0.9rem;
                color: var(--accent);
                letter-spacing: 0.5px;
            }

            .filter-panel {
                width: 100%;
                max-width: 1100px;
                margin-top: 0;
                padding: 1.25rem 1.5rem;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(78,205,196,0.2);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
            }

            .filters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 1rem;
                align-items: end;
            }

            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            .select-input, .text-input {
                width: 100%;
                height: 40px;
                padding: 8px 10px;
                border-radius: 8px;
                border: 1px solid rgba(78,205,196,0.6);
                color: var(--fg);
                background-color: rgba(255,255,255,0.06);
                font-size: 15px;
                outline: none;
                transition: border-color 0.2s ease, background-color 0.2s ease;
            }

            .select-input:focus, .text-input:focus {
                border-color: var(--accent);
                background-color: rgba(78,205,196,0.1);
            }

            .select-input option {
                background: #0e1319;
                color: var(--fg);
            }

            .custom-range {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
            }

            .filter-actions {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                justify-content: flex-start;
            }

            /* Graph container */
            #list-wrapper {
                width: 100%;
                max-width: 900px;
                margin-top: 2rem;
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            
            /* Loading state */
            .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 3rem;
                color: var(--accent);
                font-size: 1.1rem;
            }
            
            /* Empty state */
            .empty-state {
                text-align: center;
                padding: 4rem 2rem;
                color: var(--muted);
            }
            
            .empty-state h3 {
                color: var(--accent);
                margin-bottom: 0.5rem;
            }

            /* Canvas styling with preserved aspect ratio */
            canvas {
                width: 100%;
                aspect-ratio: 16 / 9;
                border-radius: 12px;
                padding: 1rem;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(78,205,196,0.3);
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
            .cta {
                background: var(--accent);
                color: #111;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                padding: 12px 28px;
                cursor: pointer;
                box-shadow: 0 2px 12px rgba(78,205,196,0.08);
                transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
            }
            .cta:hover, .cta:focus {
                background: #7be3db;
                color: #111;
                box-shadow: 0 4px 24px var(--accent);
                transform: translateY(-2px) scale(1.04);
            }

              /* Mobile responsiveness */
              @media (max-width: 600px) {
                  canvas {
                      aspect-ratio: 4 / 3;
                  }
                  .navbar .cta {
                    font-size: 0.95rem;
                    padding: 10px 20px;
                  }
                  .page-wrapper {
                    padding-top: 25%;
                  }
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

              /* Mobile responsiveness */
              @media (max-width: 600px) {
                  canvas {
                      aspect-ratio: 4 / 3;
                  }
                  .navbar {
                      padding: 16px 4vw;
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
                  .filter-panel {
                      padding: 1rem 1.25rem;
                  }
                  .filter-actions {
                      justify-content: center;
                      width: 100%;
                  }
                  .filter-actions .cta,
                  .filter-actions .cls-button {
                      flex: 1;
                      max-width: 150px;
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
                <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
            </nav>
            <div class="page-wrapper">
              <div class="filter-panel">
                <div class="filters-grid">
                  <div class="filter-group">
                    <label for="timeframe-select" class="search-label">Timeframe</label>
                    <select id="timeframe-select" class="select-input">
                      <option value="900000">Last 15 minutes</option>
                      <option value="1800000">Last 30 minutes</option>
                      <option value="3600000" selected>Last 1 hour</option>
                      <option value="21600000">Last 6 hours</option>
                      <option value="86400000">Last 24 hours</option>
                      <option value="604800000">Last 7 days</option>
                      <option value="custom">Custom range</option>
                    </select>
                  </div>

                  <div class="filter-group" id="custom-range-group" style="display:none;">
                    <label class="search-label">Custom range</label>
                    <div class="custom-range">
                      <input id="start-datetime" type="datetime-local" class="text-input" />
                      <input id="end-datetime" type="datetime-local" class="text-input" />
                    </div>
                  </div>

                  <div class="filter-group">
                    <label for="type-select" class="search-label">Data type</label>
                    <select id="type-select" class="select-input">
                      <option value="">All data types</option>
                    </select>
                  </div>

                  <div class="filter-group">
                    <label for="user-select" class="search-label">User</label>
                    <select id="user-select" class="select-input">
                      <option value="">All users</option>
                    </select>
                  </div>

                  <div class="filter-actions">
                    <button id="apply-filters" class="cta" type="button">Apply</button>
                    <button id="reset-filters" class="cls-button" type="button">Reset</button>
                  </div>
                </div>
              </div>

              <div id="list-wrapper"></div>
            </div>
          </div>
        </div>
        <script>
          // Get DOM elements
          const timeframeSelect = document.getElementById('timeframe-select');
          const customRangeGroup = document.getElementById('custom-range-group');
          const startInput = document.getElementById('start-datetime');
          const endInput = document.getElementById('end-datetime');
          const typeSelect = document.getElementById('type-select');
          const userSelect = document.getElementById('user-select');
          const applyButton = document.getElementById('apply-filters');
          const resetButton = document.getElementById('reset-filters');

          // Toggle custom range visibility
          function toggleCustomRange() {
            customRangeGroup.style.display = timeframeSelect.value === 'custom' ? 'block' : 'none';
          }

          timeframeSelect.addEventListener('change', toggleCustomRange);

          // Populate select dropdown with options
          function populateSelect(selectEl, options, placeholder = '') {
            // Clear existing options except the first one (placeholder)
            while (selectEl.options.length > 1) {
              selectEl.remove(1);
            }
            
            options.forEach(optionValue => {
              const option = document.createElement('option');
              option.value = optionValue;
              option.textContent = optionValue;
              selectEl.appendChild(option);
            });
          }

          // Fetch available filter options from backend
          async function fetchFilterOptions() {
            try {
              const response = await fetch('/user/sensor-data/filters', { method: 'GET' });
              if (!response.ok) {
                console.error('Failed to fetch filter options');
                return;
              }
              const { types = [], users = [] } = await response.json();
              populateSelect(typeSelect, types);
              populateSelect(userSelect, users);
            } catch (error) {
              console.error('Error loading filter options:', error);
            }
          }

          // Build query parameters from filter selections
          function buildFilterParams() {
            const params = new URLSearchParams();

            // Handle timeframe
            if (timeframeSelect.value === 'custom') {
              const startValue = startInput.value;
              const endValue = endInput.value;

              if (!startValue || !endValue) {
                alert('Please select both start and end dates for custom range.');
                throw new Error('Custom range requires both dates');
              }

              params.append('start', new Date(startValue).toISOString());
              params.append('end', new Date(endValue).toISOString());
            } else {
              params.append('timeframe', timeframeSelect.value);
            }

            // Add type filter if selected
            if (typeSelect.value) {
              params.append('type', typeSelect.value);
            }

            // Add user filter if selected
            if (userSelect.value) {
              params.append('userEmail', userSelect.value);
            }

            return params.toString();
          }

          // Fetch analytics data with current filters
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

            // Y-axis display range
            type_range = {
              "humidity": [0, 80],
              "temperature": [32, 122]
            }

            // Nominal range (acceptable operating range)
            nominal_range = {
              "humidity": [10, 20],
              "temperature": [65, 75]
            }

            for (let user in analytics) {
              let user_analytics = analytics[user];
              const split_ref = user.split(" ");
              const range = type_range[split_ref[1]]  // Y-axis range
              const nominalMin = nominal_range[split_ref[1]][0];
              const nominalMax = nominal_range[split_ref[1]][1];

              // Separate data points into below nominal min, normal, and above nominal max
              const dataBelowNominal = [];
              const dataNormal = [];
              const dataAboveNominal = [];

              // Get time range for threshold lines
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

              // Create threshold line data points for nominal range
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
              canvas.style.border = "1px solid rgba(75, 192, 192, 1)',"
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
                    // Below nominal min - blue
                    {
                      data: dataBelowNominal,
                      borderColor: 'rgba(100, 149, 237, 1)', // Cornflower blue
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
                    // Normal range - teal
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
                    // Above nominal max - red
                    {
                      data: dataAboveNominal,
                      borderColor: 'rgba(255, 99, 132, 1)', // Red
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
                    // Min nominal threshold line
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
                    // Max nominal threshold line
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
                      text: split_ref[0],
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
                            text: split_ref[1].charAt(0).toUpperCase() + split_ref[1].slice(1),
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

          // Show loading state
          function showLoading() {
            const wrapper = document.getElementById('list-wrapper');
            wrapper.innerHTML = '<div class="loading">Loading analytics</div>';
          }
          
          // Show empty state
          function showEmptyState() {
            const wrapper = document.getElementById('list-wrapper');
            wrapper.innerHTML = \`
              <div class="empty-state">
                <h3>No Data Available</h3>
                <p>Try adjusting your filters to see more results</p>
              </div>
            \`;
          }

          // Apply filters and refresh analytics
          async function applyFilters() {
            const wrapper = document.getElementById('list-wrapper');
            const applyBtn = document.getElementById('apply-filters');
            
            // Show loading state
            showLoading();
            
            // Disable button during loading
            applyBtn.disabled = true;
            applyBtn.style.opacity = '0.6';
            applyBtn.style.cursor = 'not-allowed';
            
            try {
              const analytics = await fetch_analytics();
              
              // Clear wrapper
              wrapper.innerHTML = '';
              
              // Check if we have data
              if (Object.keys(analytics).length === 0) {
                showEmptyState();
              } else {
                render_analytics(analytics);
              }
            } catch (error) {
              wrapper.innerHTML = \`
                <div class="empty-state">
                  <h3>Error Loading Data</h3>
                  <p>\${error.message || 'Please try again'}</p>
                </div>
              \`;
            } finally {
              // Re-enable button
              applyBtn.disabled = false;
              applyBtn.style.opacity = '1';
              applyBtn.style.cursor = 'pointer';
            }
          }

          // Reset filters to default values
          function resetFilters() {
            timeframeSelect.value = '3600000'; // Default to 1 hour
            typeSelect.value = '';
            userSelect.value = '';
            startInput.value = '';
            endInput.value = '';
            toggleCustomRange();
            applyFilters();
          }

          // Set up event listeners
          applyButton.addEventListener('click', applyFilters);
          resetButton.addEventListener('click', resetFilters);

          // Initialize on page load
          (async () => {
            // Load filter options first
            await fetchFilterOptions();
            
            // Load initial data with default filters
            await applyFilters();
          })();
        </script>
        <script>
          window.addEventListener("load", () => {
              const app = document.getElementById("app");

              // Unblur & fade in the page
              app.style.filter = "blur(0px)";
              app.style.opacity = "1";
          });
        </script>
        <script>
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

router.post('/sensor-data', async (req, res) => {
    try {
        const { type, value } = req.body;

        if (typeof type !== 'string' || typeof value !== 'number') {
            return res.status(400).json({ err: 'Invalid sensor data format' });
        }

    // Ensure the request is authenticated and user exists
    const userId = req.userID;
    if (!userId) {
      return res.status(401).json({ err: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(400).json({ err: 'User not found' });
    }

    // Create datapoint and connect to user relation
    await prisma.dataPoint.create({
      data: {
        type,
        value,
        user: { connect: { id: userId } }
      }
    });

        return res.status(200).json({ msg: 'Sensor data saved successfully' });
    } catch (error) {
        logger.error('Error saving sensor data:', error);
        return res.status(500).json({ err: 'Internal server error' });
    }
});

router.get('/sensor-data/filters', async (req, res) => {
  try {
    // Get all data points to extract unique types and users
    const dataPoints = await prisma.dataPoint.findMany({
      select: {
        type: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    // Extract unique types and emails
    const types = [...new Set(dataPoints.map(dp => dp.type))].filter(Boolean).sort();
    const userEmails = [...new Set(dataPoints.map(dp => dp.user.email))].filter(Boolean).sort();

    return res.status(200).json({
      types,
      users: userEmails
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
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (!user) {
        return res.status(404).json({ err: 'User not found' });
      }
      
      whereClause.userId = user.id;
    }

    const data = await prisma.dataPoint.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        value: true,
        type: true,
        user: {
          select: {
            email: true,
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
        const email = point.user.email;
        const type = point.type
        const fref = email + " " + type

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

router.delete('/cls-data', async (req, res) => {
  const data_email_type = req.body.ref;
  const split_ref = data_email_type.split(" ");
  const email = split_ref[0]
  const type = split_ref[1]
  
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (!user) {
      return res.status(400).json({err: 'User Not Found'})
    }
    
    await prisma.dataPoint.deleteMany({
      where: {
        userId: user.id,
        type: type
      }
    });

    return res.status(200).json({ msg: 'Successfully Cleared Data' } )
  } catch (error) {
    logger.error('Error clearing sensor data:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

export default router;