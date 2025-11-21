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
        <title>Login - Archeology Sentry</title>
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
                padding: 28px 5vw 0 5vw;
                background: none;
                position: absolute;
                top: 0; left: 0;
                z-index: 10;
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

            /* Search Styling */
            .search-label {
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
                color: var(--accent);
                letter-spacing: 0.5px;
            }

            #timeframe-search {
                width: 200px;
                max-width: 80vw;
                height: 38px;
                padding: 6px 10px;
                border-radius: 8px;
                border: 1px solid var(--accent);
                color: var(--fg);
                background-color: rgba(255,255,255,0.05);
                font-size: 15px;
                outline: none;
                transition: border-color 0.2s ease, background-color 0.2s ease;
            }

            #timeframe-search::placeholder {
                color: var(--muted);
            }

            #timeframe-search:focus {
                border-color: var(--accent);
                background-color: rgba(78,205,196,0.1);
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

            /* Canvas styling with preserved aspect ratio */
            canvas {
                width: 100%;
                aspect-ratio: 16 / 9;  /* clean, non-stretched shape */
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

              /* Mobile responsiveness */
              @media (max-width: 600px) {
                  canvas {
                      aspect-ratio: 4 / 3; /* better for smaller screens */
                  }
                  #timeframe-search {
                      width: 100%;
                  }
                  .navbar .cta {
                    font-size: 0.95rem;
                    padding: 10px 20px;
                  }
                  .page-wrapper {
                    padding-top: 25%;
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
              <label for="timeframe-search" class="search-label">Search</label>
              <input id="timeframe-search"
                type="text"
                maxlength="50"
                value="60 min"
              />
              <div id="list-wrapper">
              </div>
            </div>
          </div>
        </div>
        <script>
          async function fetch_analytics(timeframe) {   
            const url = '/user/sensor-data';
            const analytics = {};

            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) return analytics;

            const data = await response.json();

            for (let i = 0; i < data.length; i++) {
                const point = data[i];
                const email = point.user.email;
                const type = point.type
                const fref = email + " " + type

                if (!analytics[fref]) {
                    analytics[fref] = [];
                }

                const createdMs = new Date(point.createdAt).getTime();

                if (createdMs >= Date.now() - timeframe) {
                  analytics[fref].push({
                      x: point.createdAt,
                      y: point.value
                  });
                }
            }

            return analytics
          }

          function render_analytics(analytics) {
            const canvasContainer = document.getElementById("list-wrapper");

            type_range = {
              "humidity": [0, 80],
              "temperature": [32, 122]
            }

            for (let user in analytics) {
              let user_analytics = analytics[user]
            const canvas = document.createElement("canvas")  
              canvas.id = \`canvas-\${user}\`
              canvas.width = 200
              canvas.height = 100
              canvas.style.border = "1px solid rgba(75, 192, 192, 1)',"

              const split_ref = user.split(" ");
              const range = type_range[split_ref[1]]
              
              canvasContainer.appendChild(canvas)
              const ctx = canvas.getContext("2d");
              new Chart(ctx, {
                type: 'line',
                data: {
                  datasets: [{
                    data: user_analytics,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: false

                  }]
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
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute', // Display unit (e.g., 'minute', 'day', 'month')
                            displayFormats: {
                                hour: 'HH:mm' // Format for displaying time
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time',
                            font: {
                              size: 16,
                            },
                            color: '#ffffff89'
                        }
                    },
                    y: {
                        beginAtZero: true,
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
                    }
                }
                }
              })
            }
          }

          (async () => {
              const oneHour = 60 * 60 * 1000;
              const analytics = await fetch_analytics(oneHour);
              console.log(analytics);
              render_analytics(analytics);

              const input = document.getElementById('timeframe-search');

              input.addEventListener('keydown', async (e) => {
                if (e.key !== 'Enter') return;
                
                split_query = input.value.split(" ");
                timeframe = parseInt(split_query[0])
                if (split_query[split_query.length - 1] == "min") {
                  timeframe *= 60 * 1000
                }
                const analytics = await fetch_analytics(timeframe);
                console.log(analytics);
                const wrapper = document.getElementById('list-wrapper');
                // Remove all child elements
                while (wrapper.firstChild) {
                    wrapper.firstChild.remove();
                }
                render_analytics(analytics);
              });
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

router.get('/sensor-data', async (req, res) => {
  // timeframe in minutes. Accept 'all' to return everything.
  try {
    const data = await prisma.dataPoint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
        select: { email: true }
        }
      }
    });

    return res.status(200).json(data);
  } catch (error) {
    logger.error('Error retrieving sensor data:', error);
    return res.status(500).json({ err: 'Internal server error' });
  }
});

export default router;