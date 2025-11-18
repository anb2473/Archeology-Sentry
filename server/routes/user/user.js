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
            /* ensure padding and width calculations are predictable */
            *, *::before, *::after { box-sizing: border-box; }
            .page-wrapper {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background-image: url('/images/login-img.jpg');
                background-size: cover;
                background-position: center;
                position: relative;
                isolation: isolate;
            }
            .page-wrapper::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.8) 100%);
                z-index: -1;
            }
            .navbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                padding: 1rem;
                display: flex;
                align-items: center;
                z-index: 10;
            }
            .navbar .logo {
                width: 48px;
                height: 48px;
                border-radius: 8px;
                overflow: hidden;
            }
            .navbar .logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
        </style>
    </head>
    <body>
        <nav class="navbar">
            <a href="/" class="logo">
                <img src="/icon/logo.png" alt="Archeology Sentry" />
            </a>
        </nav>
        <div class="page-wrapper">
          <label for="timeframe-search" class="search-label">Search</label>
          <input id="timeframe-search"
            type="text"
            maxlength="50"
            placeholder="60 min"
            style="
              width:160px;
              height:30px;
              padding:4px 8px;
              border-radius:6px;
              border:1px solid #ccc;
              font-size:14px;
            " />
          <div id="list-wrapper">
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

            for (let user in analytics) {
              let user_analytics = analytics[user]
              const canvas = document.createElement("canvas")  
              canvas.id = \`canvas-\${user}\`
              canvas.width = 200
              canvas.height = 100
              canvas.style.border = "1px solid black"

              canvasContainer.appendChild(canvas)
              const ctx = canvas.getContext("2d");
              new Chart(ctx, {
                type: 'line',
                data: {
                  datasets: [{
                    label: user,
                    data: user_analytics,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: false
                  }]
                },
                options: {
                  scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour', // Display unit (e.g., 'minute', 'day', 'month')
                            displayFormats: {
                                hour: 'MMM D, HH:mm' // Format for displaying time
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Value'
                        }
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

              const input = document.getElementById('search-timeframe');

              input.addEventListener('input', async () => {
                  split_query = input.value.split(" ");
                  timeframe = parseInt(split_query[0])
                  if (split_query[split_query.length - 1] == "min") {
                    timeframe *= 60 * 1000
                  }
                  const analytics = await fetch_analytics();
                  console.log(analytics);
                  const wrapper = document.getElementById('list-wrapper');
                  wrapper.querySelectorAll('div').forEach(div => div.remove());
                  render_analytics(analytics);
              });
          })();
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