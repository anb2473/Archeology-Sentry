import express from 'express';
import { prisma } from '../../prismaClient.js';
import logger from '../../logger.js';

const router = express.Router();

router.get('/analytics', (req, res) => {
    const timeframe = req.query.timeframe || '3600000';
    const type = req.query.type || '';
    const userEmail = req.query.userEmail || '';
    const start = req.query.start || '';
    const end = req.query.end || '';
    
    const isCustomRange = start && end;
    
    res.send(`<!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.0"></script>
        <title>Archeology Sentry</title>
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

            /* Right-aligned actions container for navbar */
            .nav-actions {
              margin-left: auto;
              display: flex;
              gap: 1rem;
              align-items: center;
            }

            /* Simple link-style button used alongside the primary CTA */
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
              font-size: 1.1rem;
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

            .nav-link:focus { outline: none; }

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
                padding: 0;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(78,205,196,0.25);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
                overflow: hidden;
            }

            .filters-grid {
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            .filter-group {
                border-bottom: 1px solid rgba(78,205,196,0.1);
            }

            .filter-group:last-child {
                border-bottom: none;
            }

            .filter-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.125rem 1.5rem;
                cursor: pointer;
                user-select: none;
                transition: all 0.2s ease;
                background-color: transparent;
            }

            .filter-header:hover {
                background-color: rgba(78, 205, 196, 0.08);
            }

            .filter-group.expanded .filter-header {
                background-color: rgba(78, 205, 196, 0.1);
                border-bottom: 1px solid rgba(78, 205, 196, 0.2);
            }

            .filter-header-title {
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--accent);
                letter-spacing: 0.3px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .filter-header-icon {
                color: var(--accent);
                font-size: 0.85rem;
                transition: transform 0.3s ease;
                margin-left: auto;
            }

            .filter-group.expanded .filter-header-icon {
                transform: rotate(180deg);
            }

            .filter-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease, padding 0.3s ease;
                padding: 0 1.5rem;
                background-color: rgba(0, 0, 0, 0.15);
            }

            .filter-group.expanded .filter-content {
                max-height: 200px;
                padding: 0 1.5rem 1.25rem 1.5rem;
            }

            .filter-inner {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                padding-top: 0.75rem;
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
                gap: 0.75rem;
                align-items: center;
                justify-content: center;
                padding: 1.5rem 1.5rem;
                background: rgba(0, 0, 0, 0.25);
                border-top: 1px solid rgba(78,205,196,0.15);
            }

            #list-wrapper {
                width: 100%;
                max-width: 900px;
                margin-top: 2rem;
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
                padding: 0;
            }
            .filter-header {
                padding: 0.875rem 1.25rem;
            }
            .filter-group.expanded .filter-content {
                padding: 0 1.25rem 1rem 1.25rem;
            }
            .filter-actions {
                padding: 1rem 1.25rem;
                flex-direction: column;
                gap: 0.75rem;
            }
            .filter-actions .cta,
            .filter-actions .cls-button {
                width: 100%;
                max-width: none;
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
                <button class="nav-link" onclick="window.location.href='/user/user-search'">Users</button>
                <button class="nav-link" onclick="window.location.href='/user/sensor-map'">Map</button>
                <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
              </div>
            </nav>
            <div class="page-wrapper">
              <div class="filter-panel">
                <div class="filters-grid">
                  <div class="filter-group" id="timeframe-group">
                    <div class="filter-header" onclick="toggleFilter('timeframe-group')">
                      <span class="filter-header-title">Timeframe</span>
                      <span class="filter-header-icon">▼</span>
                    </div>
                    <div class="filter-content">
                      <div class="filter-inner">
                        <select id="timeframe-select" class="select-input">
                          <option value="900000" ${timeframe === '900000' ? 'selected' : ''}>Last 15 minutes</option>
                          <option value="1800000" ${timeframe === '1800000' ? 'selected' : ''}>Last 30 minutes</option>
                          <option value="3600000" ${timeframe === '3600000' ? 'selected' : ''}>Last 1 hour</option>
                          <option value="21600000" ${timeframe === '21600000' ? 'selected' : ''}>Last 6 hours</option>
                          <option value="86400000" ${timeframe === '86400000' ? 'selected' : ''}>Last 24 hours</option>
                          <option value="604800000" ${timeframe === '604800000' ? 'selected' : ''}>Last 7 days</option>
                          <option value="custom" ${isCustomRange ? 'selected' : ''}>Custom range</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="filter-group${isCustomRange ? ' expanded' : ''}" id="custom-range-group">
                    <div class="filter-header" onclick="toggleFilter('custom-range-group')">
                      <span class="filter-header-title">Custom Date Range</span>
                      <span class="filter-header-icon">▼</span>
                    </div>
                    <div class="filter-content">
                      <div class="filter-inner">
                        <div class="custom-range">
                          <input id="start-datetime" type="datetime-local" class="text-input" value="${start ? new Date(start).toISOString().slice(0, 16) : ''}" />
                          <input id="end-datetime" type="datetime-local" class="text-input" value="${end ? new Date(end).toISOString().slice(0, 16) : ''}" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="filter-group" id="type-group">
                    <div class="filter-header" onclick="toggleFilter('type-group')">
                      <span class="filter-header-title">Data Type</span>
                      <span class="filter-header-icon">▼</span>
                    </div>
                    <div class="filter-content">
                      <div class="filter-inner">
                        <select id="type-select" class="select-input">
                          <option value="">All data types</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="filter-group" id="user-group">
                    <div class="filter-header" onclick="toggleFilter('user-group')">
                      <span class="filter-header-title">User</span>
                      <span class="filter-header-icon">▼</span>
                    </div>
                    <div class="filter-content">
                      <div class="filter-inner">
                        <select id="user-select" class="select-input">
                          <option value="">All users</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div class="filter-actions">
                    <button id="apply-filters" class="cta" type="button">Apply Filters</button>
                    <button id="reset-filters" class="cls-button" type="button">Reset</button>
                  </div>
                </div>
              </div>

              <div id="list-wrapper"></div>
            </div>
          </div>
        </div>
        <script>
          const INITIAL_TYPE = '${type}';
          const INITIAL_USER = '${userEmail}';
          
          const timeframeSelect = document.getElementById('timeframe-select');
          const customRangeGroup = document.getElementById('custom-range-group');
          const startInput = document.getElementById('start-datetime');
          const endInput = document.getElementById('end-datetime');
          const typeSelect = document.getElementById('type-select');
          const userSelect = document.getElementById('user-select');
          const applyButton = document.getElementById('apply-filters');
          const resetButton = document.getElementById('reset-filters');

          window.toggleFilter = function(groupId) {
            const group = document.getElementById(groupId);
            group.classList.toggle('expanded');
          };

          function toggleCustomRange() {
            const show = timeframeSelect.value === 'custom';
            if (show) {
              customRangeGroup.classList.add('expanded');
            }
          }

          timeframeSelect.addEventListener('change', toggleCustomRange);
          // Ensure initial visibility matches the selected timeframe on page load
          toggleCustomRange();

          function populateSelect(selectEl, options, initialValue = '') {
            while (selectEl.options.length > 1) {
              selectEl.remove(1);
            }
            
            options.forEach(optionValue => {
              const option = document.createElement('option');
              option.value = optionValue;
              option.textContent = optionValue;
              if (optionValue === initialValue) {
                option.selected = true;
              }
              selectEl.appendChild(option);
            });
          }

          async function fetchFilterOptions() {
            try {
              const response = await fetch('/user/sensor-data/filters', { method: 'GET' });
              if (!response.ok) {
                console.error('Failed to fetch filter options');
                return;
              }
              const { types = [], users = [] } = await response.json();
              populateSelect(typeSelect, types, INITIAL_TYPE);
              populateSelect(userSelect, users, INITIAL_USER);
            } catch (error) {
              console.error('Error loading filter options:', error);
            }
          }

          function buildFilterParams() {
            const params = new URLSearchParams();

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

            if (typeSelect.value) {
              params.append('type', typeSelect.value);
            }

            if (userSelect.value) {
              params.append('userEmail', userSelect.value);
            }

            return params.toString();
          }

          function updateURL() {
            const params = new URLSearchParams();
            
            if (timeframeSelect.value === 'custom') {
              if (startInput.value) params.append('start', new Date(startInput.value).toISOString());
              if (endInput.value) params.append('end', new Date(endInput.value).toISOString());
            } else {
              params.append('timeframe', timeframeSelect.value);
            }
            
            if (typeSelect.value) params.append('type', typeSelect.value);
            if (userSelect.value) params.append('userEmail', userSelect.value);
            
            const newURL = window.location.pathname + '?' + params.toString();
            window.history.replaceState({}, '', newURL);
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
              "humidity": [0, 80],
              "temperature": [32, 122],
              "motion": [0, 1]
            }

            nominal_range = {
              "humidity": [10, 20],
              "temperature": [65, 75],
              "motion": [0, 0.5]
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

          function showLoading() {
            const wrapper = document.getElementById('list-wrapper');
            wrapper.innerHTML = '<div class="loading">Loading analytics</div>';
          }
          
          function showEmptyState() {
            const wrapper = document.getElementById('list-wrapper');
            wrapper.innerHTML = \`
              <div class="empty-state">
                <h3>No Data Available</h3>
                <p>Try adjusting your filters to see more results</p>
              </div>
            \`;
          }

          async function applyFilters() {
            const wrapper = document.getElementById('list-wrapper');
            const applyBtn = document.getElementById('apply-filters');
            
            showLoading();
            
            updateURL();
            
            applyBtn.disabled = true;
            applyBtn.style.opacity = '0.6';
            applyBtn.style.cursor = 'not-allowed';
            
            try {
              const analytics = await fetch_analytics();
              
              wrapper.innerHTML = '';
              
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
              applyBtn.disabled = false;
              applyBtn.style.opacity = '1';
              applyBtn.style.cursor = 'pointer';
            }
          }

          function resetFilters() {
            window.location.href = window.location.pathname;
          }

          applyButton.addEventListener('click', applyFilters);
          resetButton.addEventListener('click', resetFilters);

          (async () => {
            await fetchFilterOptions();
            await applyFilters();
          })();
        </script>
        <script>
          window.addEventListener("load", () => {
              const app = document.getElementById("app");
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

router.get('/user-search', (req, res) => {
  res.send(`<!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.0"></script>
        <title>Archeology Sentry</title>
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

            /* Right-aligned actions container for navbar */
            .nav-actions {
              margin-left: auto;
              display: flex;
              gap: 1rem;
              align-items: center;
            }

            /* Simple link-style button used alongside the primary CTA */
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

            .nav-link:focus { outline: none; }

            /* Search bar styling */
            .search-panel {
                width: 100%;
                max-width: 1100px;
                margin-top: 0;
                padding: 1.5rem 2rem;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(78,205,196,0.2);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
            }

            .search-wrapper {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .search-label {
                font-size: 1rem;
                color: var(--accent);
                letter-spacing: 0.5px;
                font-weight: 500;
            }

            .search-input {
                width: 100%;
                height: 50px;
                padding: 12px 18px;
                border-radius: 10px;
                border: 2px solid rgba(78,205,196,0.6);
                color: var(--fg);
                background-color: rgba(255,255,255,0.06);
                font-size: 16px;
                outline: none;
                transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
            }

            .search-input:focus {
                border-color: var(--accent);
                background-color: rgba(78,205,196,0.1);
                box-shadow: 0 0 0 3px rgba(78,205,196,0.2);
            }

            .search-input::placeholder {
                color: var(--muted);
                opacity: 0.6;
            }

            .delete-button {
              width: auto;
              height: auto;
              padding: 8px 16px;
              margin-left: auto;
              border-radius: 8px;
              border: 2px solid rgba(255, 68, 68, 0.5);
              color: #ff4444;
              background-color: rgba(255, 68, 68, 0.1);
              font-size: 1.2rem;
              outline: none;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .delete-button:hover {
              border-color: #ff4444;
              background-color: rgba(255, 68, 68, 0.2);
              box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.2);
              transform: scale(1.1);
            }

            .delete-button:active {
              transform: scale(0.95);
            }

            /* User list */
            #list-wrapper {
                width: 100%;
                max-width: 1100px;
                margin-top: 2rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
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

            .user-wrapper {
                background: rgba(255, 255, 255, 0.05);
                color: var(--fg);
                border: 1px solid rgba(78,205,196,0.3);
                border-radius: 10px;
                font-size: 1rem;
                font-weight: 500;
                padding: 18px 24px;
                cursor: pointer;
                transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.15s;
                letter-spacing: 0.3px;
                display: flex;
                align-items: center;
                gap: 1rem;
              }

            .user-wrapper:hover {
                background: rgba(78,205,196,0.1);
                border-color: var(--accent);
                box-shadow: 0 4px 16px rgba(78,205,196,0.3);
                transform: translateY(-2px);
            }

            .user-wrapper.hidden {
                display: none;
            }

            /* Mobile responsiveness */
            @media (max-width: 600px) {
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
                .search-panel {
                    padding: 1.25rem 1.5rem;
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
                <button class="nav-link" onclick="window.location.href='/user/analytics'">Analytics</button>
                <button class="nav-link" onclick="window.location.href='/user/sensor-map'">Map</button>
                <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
              </div>
            </nav>
            <div class="page-wrapper">
              <div class="search-panel">
                <div class="search-wrapper">
                  <label for="user-search" class="search-label">Search Users</label>
                  <input 
                    id="user-search" 
                    type="text" 
                    class="search-input" 
                    placeholder="Type to search by email or name..."
                    autocomplete="off"
                  />
                </div>
              </div>

              <div id="list-wrapper">
                <div class="loading">Loading users...</div>
              </div>
            </div>
          </div>
        </div>
        <script>
          const list_wrapper = document.getElementById("list-wrapper");
          const search_input = document.getElementById("user-search");
          let allUsers = [];

          async function fetch_users() {
            try {
              list_wrapper.innerHTML = '<div class="loading">Loading users...</div>';
              
              const response = await fetch('/user/get-users');
              if (!response.ok) throw new Error('Failed to fetch users');
              
              const users = await response.json();
              allUsers = users;
              
              render_users(users);
              
            } catch (error) {
              console.error('Error fetching users:', error);
              list_wrapper.innerHTML = '<div class="empty-state"><h3>Error</h3><p>Failed to load users. Please try again.</p></div>';
            }
          }

          async function deleteUser() {
            try {
              const response = await fetch('/user/delete-user', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                alert(data.err);
                return false;
              }
              
              // Refresh the user list after successful deletion
              window.location.href = '/auth/login'
              return true;
            } catch (error) {
              console.error('Error deleting user:', error);
              alert('Failed to delete user. Please try again.');
              return false;
            }
          }

          async function getActiveId() {
            try {
              const response = await fetch('/user/active-id');
              const data = await response.json();
              if (!response.ok) {
                alert(data.err);
                return false;
              }
              return data.id;
            } catch (error) {
              console.error('Error getting active ID:', error);
              return null;
            }
          }
          
          async function render_users(users) {
            list_wrapper.innerHTML = '';
            
            if (users.length === 0) {
              list_wrapper.innerHTML = '<div class="empty-state"><h3>No users found</h3><p>Try a different search term.</p></div>';
              return;
            }
            
            // Get active ID asynchronously
            const id = await getActiveId();
            
            users.forEach(user => {
              const userElement = document.createElement('div');
              userElement.className = "user-wrapper";
              
              const emailSpan = document.createElement('span');
              emailSpan.textContent = user.email;
              userElement.appendChild(emailSpan);
              
              userElement.dataset.email = user.email.toLowerCase();
              userElement.dataset.name = (user.name || '').toLowerCase();

              console.log(user.id, id)
              
              if (user.id === id) {
                const deleteButton = document.createElement('button');
                deleteButton.className = "delete-button";
                deleteButton.textContent = "🗑️";
                
                deleteButton.addEventListener("click", async (e) => {
                  e.stopPropagation();
                  
                  if (confirm(\`Are you sure you want to delete \${user.email}?\`)) {
                    await deleteUser();
                  }
                });
                
                userElement.appendChild(deleteButton);
              }
              
              userElement.addEventListener("click", async () => {
                const params = new URLSearchParams({
                  userEmail: user.email
                });
                
                window.location.href = \`/user/analytics?\${params.toString()}\`;
              });
              
              list_wrapper.appendChild(userElement);
            });
          }

          function filter_users(searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            
            if (term === '') {
              // Show all users if search is empty
              render_users(allUsers);
              return;
            }
            
            // Filter users based on search term
            const filtered = allUsers.filter(user => {
              const email = (user.email || '').toLowerCase();
              const name = (user.name || '').toLowerCase();
              return email.includes(term) || name.includes(term);
            });
            
            render_users(filtered);
          }

          // Add event listener for search input
          search_input.addEventListener('input', (e) => {
            filter_users(e.target.value);
          });

          // Initial fetch
          fetch_users();
        </script>
        <script>
          window.addEventListener("load", () => {
              const app = document.getElementById("app");
              app.style.filter = "blur(0px)";
              app.style.opacity = "1";
          });
        </script>
    </body>
    </html>`);
})

router.get('/sensor-map', (req, res) => {
  res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.0"></script>
      <title>Archeology Sentry</title>
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

  /* Right-aligned actions container for navbar */
  .nav-actions {
    margin-left: auto;
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  /* Simple link-style button used alongside the primary CTA */
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
  }

  nav-link::after {
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

  #graph {
      position: relative;
      width: 100%;
      height: calc(100vh - 200px);
      min-height: 400px;
      margin-bottom: 10px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      overflow: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      -webkit-overflow-scrolling: touch;
  }

  #graph-content {
      position: relative;
      width: 5000px;
      height: 5000px;
      min-width: 100%;
      min-height: 100%;
  }

  .grid-line {
      position: absolute;
      background: rgba(255, 255, 255, 0.08);
      opacity: 0.6;
  }

  .grid-line.vertical {
      width: 1px;
      position: absolute;
      top: 0;
      bottom: 0;
  }

  .grid-line.horizontal {
      height: 1px;
      position: absolute;
      left: 0;
      right: 0;
  }

  .point {
      position: absolute;
      width: 14px;
      height: 14px;
      background: var(--accent);
      border: 2.5px solid white;
      border-radius: 50%;
      cursor: grab;
      transform: translate(-50%, -50%);
      box-shadow: 0 3px 8px rgba(78, 205, 196, 0.4), 0 0 0 2px rgba(78, 205, 196, 0.1);
      z-index: 200;
      transition: transform 0.2s, box-shadow 0.2s;
  }

  .point::before {
      content: '';
      position: absolute;
      width: 50px;
      height: 50px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      /* Invisible hover area */
  }

  .point:hover {
      background: #7be3db;
      transform: translate(-50%, -50%) scale(1.2);
      box-shadow: 0 4px 12px rgba(78, 205, 196, 0.6), 0 0 0 3px rgba(78, 205, 196, 0.2);
  }

  .point.dragging {
      cursor: grabbing;
      background: #7be3db;
      transform: translate(-50%, -50%) scale(1.15);
      box-shadow: 0 5px 15px rgba(78, 205, 196, 0.5);
  }

  .point-label {
      position: absolute;
      font-size: 11px;
      font-weight: 500;
      text-align: center;
      pointer-events: none;
      white-space: nowrap;
      transform: translateX(-50%);
      z-index: 201;
      background: rgba(17, 17, 17, 0.92);
      backdrop-filter: blur(8px);
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid rgba(78, 205, 196, 0.3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(78, 205, 196, 0.1);
      color: var(--fg);
      letter-spacing: 0.3px;
  }

  .intersection-marker {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2.5px solid var(--accent);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 50;
      box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.2), 0 2px 6px rgba(78, 205, 196, 0.4);
      animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
      0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
  }

  .rectangle {
      position: absolute;
      border: 2.5px solid #28a745;
      background: rgba(40, 167, 69, 0.15);
      cursor: move;
      transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
      border-radius: 2px;
  }

  .rectangle:hover {
      background: rgba(40, 167, 69, 0.25);
      border-color: #20c997;
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
  }

  .rectangle.dragging {
      cursor: grabbing;
      background: rgba(40, 167, 69, 0.35);
      box-shadow: 0 6px 16px rgba(40, 167, 69, 0.5);
      transition: none;
  }

.delete-btn {
            position: absolute;
            width: 20px;
            height: 20px;
            background: rgba(255, 68, 68, 0.1);
            color:  #ff4444;
            border: 2px solid rgba(255, 68, 68, 0.5);
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: bold;
            line-height: 1;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            z-index: 100;
            pointer-events: auto;
            transition: all 0.05s ease;
            transform: scale(1.1);
            padding: 0;
            margin: 0;
        }
        
        .delete-btn::before {
            content: '×';
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            line-height: 1;
            margin: 0;
            padding: 0;
        }

        .delete-btn:hover {
            background: rgba(255, 68, 68, 0.2);
            border-color: #ff4444;
            transform: scale(1.2);
        }


  .point:hover .delete-btn,
  .rectangle:hover .delete-btn {
      display: flex;
  }

  .point .delete-btn {
      pointer-events: auto;
      z-index: 300;
  }

  .rectangle .delete-btn {
      pointer-events: auto;
  }

  .measurement {
      position: absolute;
      font-size: 11px;
      font-weight: bold;
      color: #333;
      background: white;
      padding: 2px 6px;
      border-radius: 3px;
      pointer-events: none;
      display: none;
      white-space: nowrap;
      line-height: 1.2;
  }

  .rectangle:hover .measurement {
      display: block;
  }

  .drawing-preview {
      position: absolute;
      border: 3px dashed #28a745;
      background: rgba(40, 167, 69, 0.08);
      pointer-events: none;
      border-radius: 2px;
      animation: dash 1s linear infinite;
  }

  @keyframes dash {
      to { stroke-dashoffset: -20; }
  }

   #addUserBtn, #addBoundaryBtn, #panBtn, #centerBtn, .navbar .cta {
              background: var(--accent);
              color: #111;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              padding: 10px 24px;
              cursor: pointer;
              box-shadow: 0 2px 12px rgba(78,205,196,0.08);
              transition: all 0.2s ease;
              display: inline-flex;
              align-items: center;
              justify-content: center;
          }
          #addUserBtn:hover:not(:disabled), #addUserBtn:focus:not(:disabled), #addBoundaryBtn:hover, #addBoundaryBtn:focus, #panBtn:hover, #panBtn:focus, #centerBtn:hover, #centerBtn:focus, .navbar .cta:hover, .navbar .cta:focus {
              background: #7be3db;
              color: #111;
              box-shadow: 0 4px 24px rgba(78, 205, 196, 0.4);
              transform: translateY(-2px);
          }

      #addUserBtn, #addBoundaryBtn, #panBtn, #centerBtn {
          position: relative;
      }

      #addBoundaryBtn.active, #panBtn.active {
          background: #7be3db;
          box-shadow: 0 4px 24px rgba(78, 205, 196, 0.4);
      }

      .tool-wrapper {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        align-items: center;
        flex-wrap: wrap;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 1rem;
      }

      .dropdown-wrapper {
        position: relative;
        display: inline-block;
      }

      .dropdown-menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        background: rgba(17, 17, 17, 0.98);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(78, 205, 196, 0.3);
        border-radius: 8px;
        min-width: 220px;
        max-width: 320px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(78, 205, 196, 0.1);
      }

      .dropdown-menu::-webkit-scrollbar {
        width: 6px;
      }

      .dropdown-menu::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      .dropdown-menu::-webkit-scrollbar-thumb {
        background: rgba(78, 205, 196, 0.3);
        border-radius: 3px;
      }

      .dropdown-menu::-webkit-scrollbar-thumb:hover {
        background: rgba(78, 205, 196, 0.5);
      }

      .user-list-item {
        padding: 0.875rem 1.25rem;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: var(--fg);
        font-size: 0.95rem;
      }

      .user-list-item:first-child {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
      }

      .user-list-item:last-child {
        border-bottom: none;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
      }

      .user-list-item:hover {
        background: rgba(78, 205, 196, 0.15);
        color: var(--accent);
        padding-left: 1.5rem;
      }

      .user-list-item.empty {
        padding: 1.5rem;
        text-align: center;
        color: var(--muted);
        cursor: default;
        font-style: italic;
        font-size: 0.9rem;
      }

      .user-list-item.empty:hover {
        background: transparent;
        padding-left: 1.25rem;
        color: var(--muted);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        color: var(--fg);
        font-size: 0.7rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 12px;
        margin-left: 0.5rem;
        min-width: 22px;
        height: 22px;
        text-align: center;
        border: 1px solid rgba(78, 205, 196, 0.3);
      }

      .dropdown-arrow {
        margin-left: 0.5rem;
        font-size: 0.65rem;
        transition: transform 0.2s;
        opacity: 0.7;
      }

      #addUserBtn.active .dropdown-arrow {
        transform: rotate(180deg);
        opacity: 1;
      }

      #addUserBtn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: rgba(78, 205, 196, 0.3);
      }

      #addUserBtn:disabled:hover {
        background: rgba(78, 205, 196, 0.3);
        transform: none;
        box-shadow: 0 2px 12px rgba(78,205,196,0.08);
      }

      #addUserBtn.active {
        background: #7be3db;
        box-shadow: 0 4px 24px rgba(78, 205, 196, 0.4);
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
              <button class="nav-link" onclick="window.location.href='/user/analytics'">Analytics</button>
              <button class="nav-link" onclick="window.location.href='/user/user-search'">Users</button>
              <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
            </div>
          </nav>
          <div class="page-wrapper">
            <div id="graph">
              <div id="graph-content"></div>
            </div>  
            <div class="tool-wrapper">
              <div class="dropdown-wrapper">
                <button id="addUserBtn" onclick="graph.toggleUserDropdown()">
                  <span class="button-text">Add User</span>
                  <span id="user-count-badge" class="badge" style="display: none;"></span>
                  <span class="dropdown-arrow">▼</span>
                </button>
                <div id="user-dropdown" class="dropdown-menu" style="display: none;">
                  <div id="user-list"></div>
                </div>
              </div>
              <button id="addBoundaryBtn" onclick="graph.toggleDrawMode()">Add Boundary</button>
              <button id="panBtn" onclick="graph.togglePanMode()">Pan</button>
              <button id="centerBtn" onclick="graph.centerView()">Center</button>
            </div>
          </div>
        </div>
      </div>
        <script>
            class GridGraph {
                constructor(containerId, gridSize = 50) {
                    this.container = document.getElementById(containerId);
                    this.content = document.getElementById(containerId + '-content');
                    this.gridSize = gridSize;
                    
                    // Fixed grid dimensions: 100x100 grid
                    this.maxGridX = 100;
                    this.maxGridY = 100;
                    
                    // Set fixed content size based on grid
                    this.content.style.width = (this.maxGridX * this.gridSize) + 'px';
                    this.content.style.height = (this.maxGridY * this.gridSize) + 'px';
                    
                    this.points = new Map(); // Maps pointId -> {gridX, gridY, name, element, labelElement, userId}
                    this.rectangles = new Map(); // Maps rectId -> {startGridX, startGridY, endGridX, endGridY, element, measurements, boundaryId}
                    this.pointCounter = 0;
                    this.rectangleCounter = 0;
                    this.draggingPoint = null;
                    this.draggingRectangle = null;
                    this.dragOffset = { x: 0, y: 0 };
                    this.intersectionMarker = null;
                    
                    // Rectangle drawing mode
                    this.drawMode = false;
                    this.drawStart = null;
                    this.drawPreview = null;
                    
                    // User placement mode
                    this.addUserMode = false;
                    this.selectedUser = null;
                    this.users = [];
                    this.usersWithoutLocation = [];
                    
                    // Pan mode
                    this.panMode = false;
                    this.isPanning = false;
                    this.panStart = { x: 0, y: 0 };
                    this.panScroll = { x: 0, y: 0 };
                    
                    // Grid tracking
                    this.gridLines = new Set();
                    this.viewportPadding = 2;
                    
                    // Center position (grid coordinates 50, 50)
                    this.centerGridX = 50;
                    this.centerGridY = 50;
                    
                    // Initialize scroll to center
                    this.centerView();
                    
                    this.createIntersectionMarker();
                    this.setupEventListeners();
                    this.updateGrid();
                    this.loadData();
                }

                updateGrid() {
                    const scrollLeft = this.container.scrollLeft;
                    const scrollTop = this.container.scrollTop;
                    const viewportWidth = this.container.offsetWidth;
                    const viewportHeight = this.container.offsetHeight;
                    
                    // Calculate visible grid range (0-100 grid)
                    const startGridX = Math.max(0, Math.floor((scrollLeft - this.viewportPadding * this.gridSize) / this.gridSize));
                    const endGridX = Math.min(this.maxGridX, Math.ceil((scrollLeft + viewportWidth + this.viewportPadding * this.gridSize) / this.gridSize));
                    const startGridY = Math.max(0, Math.floor((scrollTop - this.viewportPadding * this.gridSize) / this.gridSize));
                    const endGridY = Math.min(this.maxGridY, Math.ceil((scrollTop + viewportHeight + this.viewportPadding * this.gridSize) / this.gridSize));
                    
                    // Remove grid lines outside viewport
                    const linesToRemove = [];
                    for (let lineId of this.gridLines) {
                        const line = document.getElementById(lineId);
                        if (line) {
                            const lineX = parseInt(line.dataset.gridX);
                            const lineY = parseInt(line.dataset.gridY);
                            const isVertical = line.classList.contains('vertical');
                            
                            if (isVertical && (lineX < startGridX || lineX > endGridX || isNaN(lineX))) {
                                linesToRemove.push(lineId);
                            } else if (!isVertical && (lineY < startGridY || lineY > endGridY || isNaN(lineY))) {
                                linesToRemove.push(lineId);
                            }
                        }
                    }
                    
                    linesToRemove.forEach(lineId => {
                        const line = document.getElementById(lineId);
                        if (line) line.remove();
                        this.gridLines.delete(lineId);
                    });
                    
                    // Add missing vertical lines
                    for (let gridX = startGridX; gridX <= endGridX; gridX++) {
                        const lineId = 'vline-' + gridX;
                        if (!this.gridLines.has(lineId)) {
                            const line = document.createElement('div');
                            line.id = lineId;
                            line.className = 'grid-line vertical';
                            line.dataset.gridX = gridX;
                            const pixelX = gridX * this.gridSize;
                            line.style.left = pixelX + 'px';
                            line.style.top = '0px';
                            line.style.height = this.content.offsetHeight + 'px';
                            this.content.appendChild(line);
                            this.gridLines.add(lineId);
                        }
                    }
                    
                    // Add missing horizontal lines
                    for (let gridY = startGridY; gridY <= endGridY; gridY++) {
                        const lineId = 'hline-' + gridY;
                        if (!this.gridLines.has(lineId)) {
                            const line = document.createElement('div');
                            line.id = lineId;
                            line.className = 'grid-line horizontal';
                            line.dataset.gridY = gridY;
                            const pixelY = gridY * this.gridSize;
                            line.style.top = pixelY + 'px';
                            line.style.left = '0px';
                            line.style.width = this.content.offsetWidth + 'px';
                            this.content.appendChild(line);
                            this.gridLines.add(lineId);
                        }
                    }
                }

                createIntersectionMarker() {
                    this.intersectionMarker = document.createElement('div');
                    this.intersectionMarker.className = 'intersection-marker';
                    this.intersectionMarker.style.display = 'none';
                    this.content.appendChild(this.intersectionMarker);
                }
                
                centerView() {
                    const centerPixelX = this.centerGridX * this.gridSize;
                    const centerPixelY = this.centerGridY * this.gridSize;
                    const viewportWidth = this.container.offsetWidth;
                    const viewportHeight = this.container.offsetHeight;
                    
                    this.container.scrollLeft = centerPixelX - (viewportWidth / 2);
                    this.container.scrollTop = centerPixelY - (viewportHeight / 2);
                }
                
                togglePanMode() {
                    this.panMode = !this.panMode;
                    const btn = document.getElementById('panBtn');
                    
                    if (this.panMode) {
                        // Turn off other modes
                        if (this.addUserMode) {
                            this.toggleAddUserMode();
                        }
                        if (this.drawMode) {
                            this.toggleDrawMode();
                        }
                        btn.classList.add('active');
                        btn.textContent = 'Panning...';
                        this.container.style.cursor = 'grab';
                    } else {
                        btn.classList.remove('active');
                        btn.textContent = 'Pan';
                        this.container.style.cursor = 'default';
                    }
                }

                setupEventListeners() {
                    this.content.addEventListener('mousedown', (e) => this.handleMouseDown(e));
                    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                    document.addEventListener('mouseup', () => this.handleMouseUp());
                    this.content.addEventListener('mouseleave', () => {
                        this.intersectionMarker.style.display = 'none';
                    });
                    
                    // Scroll event for dynamic grid generation
                    this.container.addEventListener('scroll', () => {
                        this.updateGrid();
                    });
                    
                    // Resize event
                    window.addEventListener('resize', () => {
                        this.updateGrid();
                    });
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', (e) => {
                        const dropdown = document.getElementById('user-dropdown');
                        const btn = document.getElementById('addUserBtn');
                        if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
                            this.closeUserDropdown();
                        }
                    });
                }
                
                getEventCoordinates(e) {
                    const rect = this.container.getBoundingClientRect();
                    const scrollLeft = this.container.scrollLeft;
                    const scrollTop = this.container.scrollTop;
                    return {
                        pixelX: e.clientX - rect.left + scrollLeft,
                        pixelY: e.clientY - rect.top + scrollTop
                    };
                }

                gridToPixel(gridX, gridY) {
                    return {
                        x: gridX * this.gridSize,
                        y: gridY * this.gridSize
                    };
                }

                pixelToGrid(pixelX, pixelY) {
                    return {
                        x: Math.round(pixelX / this.gridSize),
                        y: Math.round(pixelY / this.gridSize)
                    };
                }

                isPointAtIntersection(gridX, gridY) {
                    // Check if any point exists at this grid intersection
                    for (let [id, pointData] of this.points) {
                        if (pointData.gridX === gridX && pointData.gridY === gridY) {
                            return true;
                        }
                    }
                    return false;
                }

                updateIntersectionMarker(pixelX, pixelY) {
                    // Find nearest grid intersection
                    const grid = this.pixelToGrid(pixelX, pixelY);
                    const pixel = this.gridToPixel(grid.x, grid.y);
                    
                    // Check if there's already a point at this intersection
                    if (this.isPointAtIntersection(grid.x, grid.y)) {
                        this.intersectionMarker.style.display = 'none';
                    } else {
                        // Show marker at the intersection
                        this.intersectionMarker.style.display = 'block';
                        this.intersectionMarker.style.left = pixel.x + 'px';
                        this.intersectionMarker.style.top = pixel.y + 'px';
                    }
                }

                async handleMouseDown(e) {
                    // Check if clicking delete button - stop all other actions
                    if (e.target.classList.contains('delete-btn')) {
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                    
                    if (this.panMode) {
                        // Start panning
                        this.isPanning = true;
                        this.panStart.x = e.clientX;
                        this.panStart.y = e.clientY;
                        this.panScroll.x = this.container.scrollLeft;
                        this.panScroll.y = this.container.scrollTop;
                        this.container.style.cursor = 'grabbing';
                        e.preventDefault();
                        return;
                    }
                    
                    const coords = this.getEventCoordinates(e);
                    const grid = this.pixelToGrid(coords.pixelX, coords.pixelY);
                    
                    // Clamp grid coordinates to valid range (0-100)
                    grid.x = Math.max(0, Math.min(this.maxGridX, grid.x));
                    grid.y = Math.max(0, Math.min(this.maxGridY, grid.y));
                    
                    if (this.addUserMode && this.selectedUser) {
                        // Place user at clicked location
                        await this.addUserPoint(grid.x, grid.y, this.selectedUser);
                        this.selectedUser = null;
                        this.toggleAddUserMode();
                        // Update button state after adding user
                        this.updateUserButtonState();
                    } else if (this.drawMode) {
                        // Start drawing rectangle
                        this.drawStart = grid;
                        
                        // Create preview element
                        this.drawPreview = document.createElement('div');
                        this.drawPreview.className = 'drawing-preview';
                        this.content.appendChild(this.drawPreview);
                    } else if (e.target.classList.contains('rectangle')) {
                        // Start dragging rectangle
                        this.draggingRectangle = e.target;
                        this.draggingRectangle.classList.add('dragging');
                        
                        const coords = this.getEventCoordinates(e);
                        const rectLeft = parseInt(this.draggingRectangle.style.left);
                        const rectTop = parseInt(this.draggingRectangle.style.top);
                        
                        this.dragOffset = {
                            x: coords.pixelX - rectLeft,
                            y: coords.pixelY - rectTop
                        };
                    } else if (e.target.classList.contains('point')) {
                        // Start dragging point
                        this.draggingPoint = e.target;
                        this.draggingPoint.classList.add('dragging');
                    }
                }

                handleMouseMove(e) {
                    if (this.isPanning && this.panMode) {
                        // Handle panning
                        const deltaX = this.panStart.x - e.clientX;
                        const deltaY = this.panStart.y - e.clientY;
                        this.container.scrollLeft = this.panScroll.x + deltaX;
                        this.container.scrollTop = this.panScroll.y + deltaY;
                        return;
                    }
                    
                    const coords = this.getEventCoordinates(e);
                    const pixelX = coords.pixelX;
                    const pixelY = coords.pixelY;
                    
                    if (this.drawMode && this.drawStart && this.drawPreview) {
                        let grid = this.pixelToGrid(pixelX, pixelY);
                        // Clamp to valid range
                        grid.x = Math.max(0, Math.min(this.maxGridX, grid.x));
                        grid.y = Math.max(0, Math.min(this.maxGridY, grid.y));
                        
                        const pixel = this.gridToPixel(grid.x, grid.y);
                        const startPixel = this.gridToPixel(this.drawStart.x, this.drawStart.y);
                        
                        const left = Math.min(startPixel.x, pixel.x);
                        const top = Math.min(startPixel.y, pixel.y);
                        const width = Math.abs(pixel.x - startPixel.x);
                        const height = Math.abs(pixel.y - startPixel.y);
                        
                        this.drawPreview.style.left = left + 'px';
                        this.drawPreview.style.top = top + 'px';
                        this.drawPreview.style.width = width + 'px';
                        this.drawPreview.style.height = height + 'px';
                        
                        const widthFt = Math.abs(grid.x - this.drawStart.x);
                        const heightFt = Math.abs(grid.y - this.drawStart.y);
                        
                        const oldWidthLabel = document.getElementById('preview-width-label');
                        const oldHeightLabel = document.getElementById('preview-height-label');
                        if (oldWidthLabel) oldWidthLabel.remove();
                        if (oldHeightLabel) oldHeightLabel.remove();
                        
                        if (widthFt > 0) {
                            const widthLabel = document.createElement('div');
                            widthLabel.id = 'preview-width-label';
                            widthLabel.className = 'measurement';
                            widthLabel.style.display = 'block';
                            widthLabel.style.background = '#ffffcc';
                            widthLabel.textContent = widthFt + ' ft';
                            widthLabel.style.left = (left + width / 2) + 'px';
                            widthLabel.style.top = (top - 28) + 'px';
                            widthLabel.style.transform = 'translateX(-50%)';
                            widthLabel.style.whiteSpace = 'nowrap';
                            this.content.appendChild(widthLabel);
                        }
                        
                        if (heightFt > 0) {
                            const heightLabel = document.createElement('div');
                            heightLabel.id = 'preview-height-label';
                            heightLabel.className = 'measurement';
                            heightLabel.style.display = 'block';
                            heightLabel.style.background = '#ffffcc';
                            heightLabel.textContent = heightFt + ' ft';
                            heightLabel.style.left = (left + width + 10) + 'px';
                            heightLabel.style.top = (top + height / 2) + 'px';
                            heightLabel.style.transform = 'translateY(-50%)';
                            heightLabel.style.whiteSpace = 'nowrap';
                            this.content.appendChild(heightLabel);
                        }
                    } else if (this.draggingRectangle) {
                        const rectId = this.draggingRectangle.dataset.id;
                        const rectData = this.rectangles.get(rectId);
                        
                        const widthPx = parseInt(this.draggingRectangle.style.width);
                        const heightPx = parseInt(this.draggingRectangle.style.height);

                        // Get container dimensions
                        const containerWidth = this.content.offsetWidth;
                        const containerHeight = this.content.offsetHeight;

                        // Calculate potential new position and snap to grid immediately
                        let newX = pixelX - this.dragOffset.x;
                        let newY = pixelY - this.dragOffset.y;
                        
                        // Snap to grid first
                        const grid = this.pixelToGrid(newX, newY);
                        const pixel = this.gridToPixel(grid.x, grid.y);
                        
                        // Clamp position to keep rectangle inside grid (after snapping)
                        const finalX = Math.max(0, Math.min(pixel.x, containerWidth - widthPx));
                        const finalY = Math.max(0, Math.min(pixel.y, containerHeight - heightPx));

                        // Apply position immediately (no smooth transition during drag)
                        this.draggingRectangle.style.transition = 'none';
                        this.draggingRectangle.style.left = finalX + 'px';
                        this.draggingRectangle.style.top = finalY + 'px';
                        
                        const finalGrid = this.pixelToGrid(finalX, finalY);
                        const widthGrid = rectData.endGridX - rectData.startGridX;
                        const heightGrid = rectData.endGridY - rectData.startGridY;

                        rectData.startGridX = finalGrid.x;
                        rectData.startGridY = finalGrid.y;
                        rectData.endGridX = finalGrid.x + widthGrid;
                        rectData.endGridY = finalGrid.y + heightGrid;
                        
                        this.updateRectangleMeasurements(rectId);
                        
                        // Update boundary on server (using POST with id for updates)
                        if (rectData.boundaryId) {
                            fetch('/user/boundary', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    id: rectData.boundaryId,
                                    x: finalGrid.x,
                                    y: finalGrid.y,
                                    width: widthGrid,
                                    height: heightGrid
                                })
                            }).catch(error => {
                                console.error('Error updating boundary:', error);
                            });
                        }
                    } else if (this.draggingPoint) {
                        // Move point with boundary constraints
                        const grid = this.pixelToGrid(pixelX, pixelY);
                        
                        // Clamp grid coordinates to valid range
                        const clampedGridX = Math.max(0, Math.min(this.maxGridX, grid.x));
                        const clampedGridY = Math.max(0, Math.min(this.maxGridY, grid.y));
                        
                        const pixel = this.gridToPixel(clampedGridX, clampedGridY);
                        
                        this.draggingPoint.style.left = pixel.x + 'px';
                        this.draggingPoint.style.top = pixel.y + 'px';
                        
                        const pointId = this.draggingPoint.dataset.id;
                        const pointData = this.points.get(pointId);
                        pointData.gridX = clampedGridX;
                        pointData.gridY = clampedGridY;
                        
                        this.updateLabel(pointId);
                    } else {
                        this.updateIntersectionMarker(pixelX, pixelY);
                    }
                }

                async handleMouseUp() {
                    if (this.isPanning) {
                        this.isPanning = false;
                        this.container.style.cursor = this.panMode ? 'grab' : 'default';
                        return;
                    }
                    
                    if (this.drawMode && this.drawStart && this.drawPreview) {
                        // Finish drawing rectangle - use the stored pixel positions
                        const left = parseInt(this.drawPreview.style.left);
                        const top = parseInt(this.drawPreview.style.top);
                        const width = parseInt(this.drawPreview.style.width);
                        const height = parseInt(this.drawPreview.style.height);
                        
                        // Only create if rectangle has BOTH width AND height
                        if (width > 0 && height > 0) {
                            const startGrid = this.pixelToGrid(left, top);
                            const endGrid = this.pixelToGrid(left + width, top + height);
                            
                            // Clamp to valid range
                            startGrid.x = Math.max(0, Math.min(this.maxGridX, startGrid.x));
                            startGrid.y = Math.max(0, Math.min(this.maxGridY, startGrid.y));
                            endGrid.x = Math.max(0, Math.min(this.maxGridX, endGrid.x));
                            endGrid.y = Math.max(0, Math.min(this.maxGridY, endGrid.y));
                            
                            // Additional check: ensure grid coordinates are different
                            if (startGrid.x !== endGrid.x && startGrid.y !== endGrid.y) {
                                await this.addRectangle(startGrid.x, startGrid.y, endGrid.x, endGrid.y);
                            }
                        }
                        
                        // Clean up preview and preview measurements
                        this.drawPreview.remove();
                        this.drawPreview = null;
                        this.drawStart = null;
                        
                        const oldWidthLabel = document.getElementById('preview-width-label');
                        const oldHeightLabel = document.getElementById('preview-height-label');
                        if (oldWidthLabel) oldWidthLabel.remove();
                        if (oldHeightLabel) oldHeightLabel.remove();
                        
                        // Auto-deactivate draw mode after creating rectangle
                        this.toggleDrawMode();
                    } else if (this.draggingRectangle) {
                        // Restore transition after dragging
                        this.draggingRectangle.style.transition = '';
                        this.draggingRectangle.classList.remove('dragging');
                        this.draggingRectangle = null;
                    } else if (this.draggingPoint) {
                        // Update user location on server when dragging ends
                        const pointId = this.draggingPoint.dataset.id;
                        const pointData = this.points.get(pointId);
                        if (pointData && pointData.userId) {
                            fetch('/user/user-location', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    id: pointData.userId,
                                    x: pointData.gridX,
                                    y: pointData.gridY
                                })
                            }).catch(error => {
                                console.error('Error updating user location:', error);
                            });
                        }
                        this.draggingPoint.classList.remove('dragging');
                        this.draggingPoint = null;
                    }
                }

                updateLabel(pointId) {
                    const pointData = this.points.get(pointId);
                    const label = document.getElementById('label-' + pointId);
                    const pixel = this.gridToPixel(pointData.gridX, pointData.gridY);
                    label.style.left = pixel.x + 'px';
                    label.style.top = (pixel.y + 15) + 'px';
                }

                /**
                 * Add a user point at grid coordinates
                 * @param {number} gridX - Grid X coordinate
                 * @param {number} gridY - Grid Y coordinate
                 * @param {object} user - User object with id and email
                 * @param {boolean} saveToServer - Whether to save to server (default: true)
                 * @returns {string} Point ID
                 */
                async addUserPoint(gridX, gridY, user, saveToServer = true) {
                    const pointId = 'point-' + Date.now() + '-' + Math.random();
                    this.pointCounter++;

                    this.intersectionMarker.style.display = 'none';
                    
                    const pixel = this.gridToPixel(gridX, gridY);
                    
                    // Create point element
                    const point = document.createElement('div');
                    point.className = 'point';
                    point.dataset.id = pointId;
                    point.style.left = pixel.x + 'px';
                    point.style.top = pixel.y + 'px';
                    this.content.appendChild(point);
                    
                    // Create delete button
                    const deleteBtn = document.createElement('div');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.style.top = '-8px';
                    deleteBtn.style.left = '15px';
                    deleteBtn.onmousedown = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    };
                    deleteBtn.onclick = async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        await this.removeUserPoint(pointId);
                    };
                    point.appendChild(deleteBtn);
                    
                    // Create label element
                    const label = document.createElement('div');
                    label.className = 'point-label';
                    label.id = 'label-' + pointId;
                    label.textContent = user.email;
                    label.style.left = pixel.x + 'px';
                    label.style.top = (pixel.y + 15) + 'px';
                    this.content.appendChild(label);
                    
                    // Store point data
                    this.points.set(pointId, {
                        gridX: gridX,
                        gridY: gridY,
                        name: user.email,
                        element: point,
                        labelElement: label,
                        userId: user.id
                    });
                    
                    // Save to server if needed
                    if (saveToServer) {
                        try {
                            await fetch('/user/user-location', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    id: user.id,
                                    x: gridX,
                                    y: gridY
                                })
                            });
                            // Remove from usersWithoutLocation
                            this.usersWithoutLocation = this.usersWithoutLocation.filter(u => u.id !== user.id);
                        } catch (error) {
                            console.error('Error saving user location:', error);
                        }
                    }
                    
                    return pointId;
                }

                /**
                 * Move a point to new grid coordinates
                 * @param {string} pointId - Point ID
                 * @param {number} gridX - New grid X coordinate
                 * @param {number} gridY - New grid Y coordinate
                 */
                movePoint(pointId, gridX, gridY) {
                    const pointData = this.points.get(pointId);
                    if (!pointData) return;
                    
                    pointData.gridX = gridX;
                    pointData.gridY = gridY;
                    
                    const pixel = this.gridToPixel(gridX, gridY);
                    pointData.element.style.left = pixel.x + 'px';
                    pointData.element.style.top = pixel.y + 'px';
                    
                    this.updateLabel(pointId);
                }

                /**
                 * Find point by name
                 * @param {string} name - Point name
                 * @returns {string|null} Point ID or null
                 */
                findPointByName(name) {
                    for (let [id, data] of this.points) {
                        if (data.name === name) return id;
                    }
                    return null;
                }

                /**
                 * Get point data
                 * @param {string} pointId - Point ID
                 * @returns {object|null} Point data or null
                 */
                getPoint(pointId) {
                    return this.points.get(pointId) || null;
                }

                /**
                 * Remove a user point
                 * @param {string} pointId - Point ID
                 */
                async removeUserPoint(pointId) {
                    const pointData = this.points.get(pointId);
                    if (!pointData) return;
                    
                    // Delete from server
                    if (pointData.userId) {
                        try {
                            await fetch('/user/user-location', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: pointData.userId })
                            });
                            // Add back to usersWithoutLocation
                            const user = this.users.find(u => u.id === pointData.userId);
                            if (user && !this.usersWithoutLocation.find(u => u.id === user.id)) {
                                this.usersWithoutLocation.push(user);
                                this.updateUserButtonState();
                            }
                        } catch (error) {
                            console.error('Error deleting user location:', error);
                        }
                    }
                    
                    pointData.element.remove();
                    pointData.labelElement.remove();
                    this.points.delete(pointId);
                }

                clearPoints() {
                    for (let [id, data] of this.points) {
                        data.element.remove();
                        data.labelElement.remove();
                    }
                    this.points.clear();
                    this.pointCounter = 0;
                }

                toggleDrawMode() {
                    if (this.panMode) {
                      this.togglePanMode()
                    }
                    this.drawMode = !this.drawMode;
                    const btn = document.getElementById('addBoundaryBtn');
                    if (this.drawMode) {
                        // Turn off add user mode if it's on
                        if (this.addUserMode) {
                            this.toggleAddUserMode();
                        }
                        btn.classList.add('active');
                        btn.textContent = 'Click & Drag to Draw...';
                        this.container.style.cursor = 'crosshair';
                    } else {
                        btn.classList.remove('active');
                        btn.textContent = 'Add Boundary';
                        this.container.style.cursor = 'default';
                    }
                }

                async loadData() {
                    try {
                        // Load users
                        const usersResponse = await fetch('/user/get-users');
                        if (usersResponse.ok) {
                            this.users = await usersResponse.json();
                            this.usersWithoutLocation = this.users.filter(u => u.x === null || u.y === null);
                            
                            // Update button state
                            this.updateUserButtonState();
                            
                            // Place users with coordinates
                            this.users.forEach(user => {
                                if (user.x !== null && user.y !== null) {
                                    this.addUserPoint(user.x, user.y, user, false);
                                }
                            });
                        }
                        
                        // Load boundaries
                        const boundariesResponse = await fetch('/user/get-boundaries');
                        if (boundariesResponse.ok) {
                            const boundaries = await boundariesResponse.json();
                            boundaries.forEach(boundary => {
                                // Convert boundary coordinates to grid coordinates
                                const startGridX = boundary.x;
                                const startGridY = boundary.y;
                                const endGridX = boundary.x + boundary.width;
                                const endGridY = boundary.y + boundary.height;
                                this.addRectangle(startGridX, startGridY, endGridX, endGridY, boundary.id, false);
                            });
                        }
                    } catch (error) {
                        console.error('Error loading data:', error);
                    }
                }

                toggleUserDropdown() {
                    const dropdown = document.getElementById('user-dropdown');
                    const btn = document.getElementById('addUserBtn');
                    
                    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                        // Open dropdown
                        if (this.usersWithoutLocation.length > 0) {
                            this.updateUserDropdown();
                            dropdown.style.display = 'block';
                            btn.classList.add('active');
                        }
                    } else {
                        // Close dropdown
                        dropdown.style.display = 'none';
                        btn.classList.remove('active');
                    }
                }

                updateUserDropdown() {
                    const userList = document.getElementById('user-list');
                    userList.innerHTML = '';
                    
                    if (this.usersWithoutLocation.length === 0) {
                        const emptyItem = document.createElement('div');
                        emptyItem.className = 'user-list-item empty';
                        emptyItem.textContent = 'No users available';
                        userList.appendChild(emptyItem);
                    } else {
                        this.usersWithoutLocation.forEach(user => {
                            const item = document.createElement('div');
                            item.className = 'user-list-item';
                            item.textContent = user.email;
                            item.onclick = () => {
                                this.selectedUser = user;
                                this.closeUserDropdown();
                                this.activateAddUserMode();
                            };
                            userList.appendChild(item);
                        });
                    }
                }

                closeUserDropdown() {
                    const dropdown = document.getElementById('user-dropdown');
                    const btn = document.getElementById('addUserBtn');
                    dropdown.style.display = 'none';
                    btn.classList.remove('active');
                }

                activateAddUserMode() {
                    if (this.panMode) {
                      this.togglePanMode();
                    }

                    if (!this.selectedUser) return;
                    
                    this.addUserMode = true;
                    const btn = document.getElementById('addUserBtn');
                    
                    // Turn off draw mode if it's on
                    if (this.drawMode) {
                        this.toggleDrawMode();
                    }
                    
                    btn.classList.add('active');
                    btn.querySelector('.button-text').textContent = 'Click to Place: ' + this.selectedUser.email;
                    this.container.style.cursor = 'crosshair';
                }

                toggleAddUserMode() {
                    this.addUserMode = !this.addUserMode;
                    const btn = document.getElementById('addUserBtn');
                    
                    if (this.addUserMode && this.selectedUser) {
                        btn.classList.add('active');
                        btn.querySelector('span').textContent = 'Click to Place: ' + this.selectedUser.email;
                        this.container.style.cursor = 'crosshair';
                    } else {
                        this.addUserMode = false;
                        this.selectedUser = null;
                        btn.classList.remove('active');
                        btn.querySelector('.button-text').textContent = 'Add User';
                        this.container.style.cursor = 'default';
                        this.closeUserDropdown();
                    }
                }

                updateUserButtonState() {
                    const btn = document.getElementById('addUserBtn');
                    const badge = document.getElementById('user-count-badge');
                    
                    if (this.usersWithoutLocation.length > 0) {
                        btn.disabled = false;
                        badge.textContent = this.usersWithoutLocation.length;
                        badge.style.display = 'inline-block';
                    } else {
                        btn.disabled = true;
                        badge.style.display = 'none';
                    }
                }

                updateRectangleMeasurements(rectId) {
                    const rectData = this.rectangles.get(rectId);
                    if (!rectData) return;
                    
                    const startPixel = this.gridToPixel(rectData.startGridX, rectData.startGridY);
                    const endPixel = this.gridToPixel(rectData.endGridX, rectData.endGridY);
                    const width = endPixel.x - startPixel.x;
                    const height = endPixel.y - startPixel.y;
                    
                    // Update width measurement (top) - relative to rectangle
                    if (rectData.measurements[0]) {
                        rectData.measurements[0].style.left = (width / 2) + 'px';
                        rectData.measurements[0].style.top = '-28px';
                    }
                    
                    // Update height measurement (right) - relative to rectangle
                    if (rectData.measurements[1]) {
                        rectData.measurements[1].style.left = (width + 10) + 'px';
                        rectData.measurements[1].style.top = (height / 2) + 'px';
                    }
                }

                /**
                 * Add a boundary rectangle to the graph
                 * @param {number} startGridX - Starting grid X coordinate
                 * @param {number} startGridY - Starting grid Y coordinate
                 * @param {number} endGridX - Ending grid X coordinate
                 * @param {number} endGridY - Ending grid Y coordinate
                 * @param {number} boundaryId - Optional boundary ID if loading from server
                 * @param {boolean} saveToServer - Whether to save to server (default: true)
                 * @returns {string} Rectangle ID
                 */
                async addRectangle(startGridX, startGridY, endGridX, endGridY, boundaryId = null, saveToServer = true) {
                    const rectId = 'rect-' + Date.now() + '-' + Math.random();
                    this.rectangleCounter++;
                    
                    const x1 = Math.min(startGridX, endGridX);
                    const y1 = Math.min(startGridY, endGridY);
                    const x2 = Math.max(startGridX, endGridX);
                    const y2 = Math.max(startGridY, endGridY);
                    
                    const startPixel = this.gridToPixel(x1, y1);
                    const endPixel = this.gridToPixel(x2, y2);
                    
                    const width = endPixel.x - startPixel.x;
                    const height = endPixel.y - startPixel.y;
                    
                    // Create rectangle element
                    const rect = document.createElement('div');
                    rect.className = 'rectangle';
                    rect.dataset.id = rectId;
                    rect.style.left = startPixel.x + 'px';
                    rect.style.top = startPixel.y + 'px';
                    rect.style.width = width + 'px';
                    rect.style.height = height + 'px';
                    this.content.appendChild(rect);
                    
                    // Create delete button
                    const deleteBtn = document.createElement('div');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.style.top = '5px';
                    deleteBtn.style.right = '5px';
                    deleteBtn.onmousedown = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    };
                    deleteBtn.onclick = async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        await this.removeBoundary(rectId);
                    };
                    rect.appendChild(deleteBtn);
                    
                    // Calculate dimensions in feet (each grid square = 1 ft)
                    const widthFt = x2 - x1;
                    const heightFt = y2 - y1;
                    
                    const measurements = [];
                    
                    // Add width measurement (top) - append to rectangle
                    if (widthFt > 0) {
                        const widthLabel = document.createElement('div');
                        widthLabel.className = 'measurement';
                        widthLabel.textContent = widthFt + ' ft';
                        widthLabel.style.left = (width / 2) + 'px';
                        widthLabel.style.top = '-28px';
                        widthLabel.style.transform = 'translateX(-50%)';
                        widthLabel.style.whiteSpace = 'nowrap';
                        rect.appendChild(widthLabel);
                        measurements.push(widthLabel);
                    }
                    
                    // Add height measurement (right) - append to rectangle
                    if (heightFt > 0) {
                        const heightLabel = document.createElement('div');
                        heightLabel.className = 'measurement';
                        heightLabel.textContent = heightFt + ' ft';
                        heightLabel.style.left = (width + 10) + 'px';
                        heightLabel.style.top = (height / 2) + 'px';
                        heightLabel.style.transform = 'translateY(-50%)';
                        heightLabel.style.whiteSpace = 'nowrap';
                        rect.appendChild(heightLabel);
                        measurements.push(heightLabel);
                    }
                    
                    // Store rectangle data
                    this.rectangles.set(rectId, {
                        startGridX: x1,
                        startGridY: y1,
                        endGridX: x2,
                        endGridY: y2,
                        widthFt: widthFt,
                        heightFt: heightFt,
                        element: rect,
                        measurements: measurements,
                        boundaryId: boundaryId
                    });
                    
                    // Save to server if needed
                    if (saveToServer && !boundaryId) {
                        try {
                            const response = await fetch('/user/boundary', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    x: x1,
                                    y: y1,
                                    width: widthFt,
                                    height: heightFt
                                })
                            });
                            const data = await response.json();
                            if (response.ok && data.id) {
                                // Update stored boundary ID
                                const rectData = this.rectangles.get(rectId);
                                if (rectData) {
                                    rectData.boundaryId = data.id;
                                }
                            }
                        } catch (error) {
                            console.error('Error saving boundary:', error);
                        }
                    }
                    
                    return rectId;
                }

                /**
                 * Remove a boundary rectangle
                 * @param {string} rectId - Rectangle ID
                 */
                async removeBoundary(rectId) {
                    const rectData = this.rectangles.get(rectId);
                    if (!rectData) return;
                    
                    // Delete from server
                    if (rectData.boundaryId) {
                        try {
                            await fetch('/user/boundary', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: rectData.boundaryId })
                            });
                        } catch (error) {
                            console.error('Error deleting boundary:', error);
                        }
                    }
                    
                    rectData.element.remove();
                    rectData.measurements.forEach(m => m.remove());
                    this.rectangles.delete(rectId);
                }

                clearRectangles() {
                    for (let [id, data] of this.rectangles) {
                        data.element.remove();
                        data.measurements.forEach(m => m.remove());
                    }
                    this.rectangles.clear();
                    this.rectangleCounter = 0;
                }
            }

            // Initialize the graph with fixed 50px grid (1ft = 50px)
            // Grid is 100x100 (0-100 in both directions)
            const graph = new GridGraph('graph', 50);

            window.addEventListener("load", () => {
              const app = document.getElementById("app");
              app.style.filter = "blur(0px)";
              app.style.opacity = "1";
            });
        </script>
    </body>
    </html>`)
})

router.get('/active-id', async (req, res) => {
  return res.status(200).json({ id: req.userID})
})

router.delete('/delete-user', async (req, res) => {
  try {
    const userId = req.userID;
    await prisma.dataPoint.deleteMany({
      where: { userId: userId }
    });
    await prisma.user.delete({
      where: {
        id: userId
      }
    })
    return res.status(200).json({ msg: "Successfully deleted user" })
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

router.get('/user-risk', async (req, res) => {
  try {
    const datapoints = prisma.DataPoint.findMany()
  } catch (error) {
        logger.error('Error retrieving user risk data:', error);
        return res.status(500).json({ err: 'Internal server error' });
    }
})

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

router.get('/get-users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    return res.status(200).json(users)
  } catch {
    logger.error('Error retrieving data:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.post('/user-location', async (req, res) => {
  try {
      await prisma.user.update({
        where: {id: req.body.id},
        data: {x: req.body.x, y: req.body.y}
      })
      return res.status(200).json({ msg: "Successfully updated user location"})
  } catch (error) {
    logger.error('Error updating user location:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

router.delete('/user-location', async (req, res) => {
  try {
      await prisma.user.update({
        where: {id: req.body.id},
        data: {x: null, y: null}
      })
      return res.status(200).json({ msg: "Successfully deleted user location"})
  } catch (error) {
    logger.error('Error deleting user location:', error);
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

export default router;