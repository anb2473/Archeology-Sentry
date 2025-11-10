import express from 'express';
import { prisma } from '../../prismaClient.js';
import logger from '../../logger.js';

const router = express.Router();

router.get('/analytics', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sensor Analytics</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f5f5f5;
                }
                .navbar {
                    background-color: #333;
                    padding: 1rem;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .navbar h1 {
                    margin: 0;
                    font-size: 1.5rem;
                }
                .navbar-links {
                    display: flex;
                    gap: 1rem;
                }
                .navbar-links a {
                    color: white;
                    text-decoration: none;
                }
                .container {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }
                .data-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .data-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .data-card h3 {
                    margin-top: 0;
                    color: #333;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 0.5rem;
                }
                .data-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .data-item {
                    padding: 0.5rem;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                }
                .data-item:last-child {
                    border-bottom: none;
                }
                .data-value {
                    font-weight: bold;
                }
                .data-timestamp {
                    color: #666;
                    font-size: 0.9rem;
                }
                @media (max-width: 768px) {
                    .data-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <nav class="navbar">
                <h1>Sensor Analytics</h1>
                <div class="navbar-links">
                    <a href="/">Home</a>
                    <a href="/logout">Logout</a>
                </div>
            </nav>
            <div class="container">
                <div class="data-grid" id="dataGrid">
                    <!-- Data cards will be dynamically inserted here -->
                </div>
            </div>
            <script>
                // Group data by type and update the UI
                function updateDataDisplay(data) {
                    const dataGrid = document.getElementById('dataGrid');
                    const groupedData = {};
                    
                    // Group data by type
                    data.forEach(item => {
                        if (!groupedData[item.type]) {
                            groupedData[item.type] = [];
                        }
                        groupedData[item.type].push(item);
                    });
                    
                    // Clear existing content
                    dataGrid.innerHTML = '';
                    
                    // Create cards for each sensor type
                    Object.entries(groupedData).forEach(([type, items]) => {
                        const card = document.createElement('div');
                        card.className = 'data-card';
                        card.innerHTML = \`
                            <h3>\${type} Sensor</h3>
                            <ul class="data-list">
                                \${items.map(item => \`
                                    <li class="data-item">
                                        <span class="data-value">\${item.value.toFixed(2)}</span>
                                        <span class="data-timestamp">\${new Date(item.createdAt).toLocaleString()}</span>
                                    </li>
                                \`).join('')}
                            </ul>
                        \`;
                        dataGrid.appendChild(card);
                    });
                }

                // Fetch data every 2 seconds
                async function fetchData() {
                    try {
                        const response = await fetch('/user/sensor-data?timeframe=60');
                        if (!response.ok) throw new Error('Failed to fetch data');
                        const data = await response.json();
                        updateDataDisplay(data);
                    } catch (error) {
                        console.error('Error fetching sensor data:', error);
                    }
                }

                // Initial fetch and setup interval
                fetchData();
                setInterval(fetchData, 2000);
            </script>
        </body>
        </html>
    `);
});

router.post('/sensor-data', async (req, res) => {
    try {
        const { type, value } = req.body;

        if (typeof type !== 'string' || typeof value !== 'number') {
            return res.status(400).json({ err: 'Invalid sensor data format' });
        }

        prisma.dataPoint.create({
            type, value
        });

        return res.status(200).json({ msg: 'Sensor data saved successfully' });
    } catch (error) {
        logger.error('Error saving sensor data:', error);
        return res.status(500).json({ err: 'Internal server error' });
    }
});

router.get('/sensor-data', async (req, res) => {
    const timeframe = req.query.timeframe;
    if (!timeframe || isNaN(parseInt(timeframe))) {
        return res.status(400).json({ err: 'Invalid or missing timeframe parameter' });
    }
    try {
        const data = await prisma.dataPoint.findMany({
            orderBy: { createdAt: 'desc' },
            where: {
                createdAt: {
                    gte: new Date(Date.now() - parseInt(timeframe) * 60000)
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