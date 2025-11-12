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
  <title>Sensor Analytics</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
  <style>
    body{margin:0;font-family:Inter,system-ui,Arial,sans-serif;background:#f5f5f5;color:#222}
    .navbar{background:#333;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
    .container{max-width:1100px;margin:20px auto;padding:0 16px}
    .controls{display:flex;gap:8px;align-items:center;margin-bottom:12px}
    .time-btn{background:#eee;border:0;padding:8px 12px;border-radius:6px;cursor:pointer}
    .time-btn.active{background:#4ecdc4;color:#012}
    .chart-wrap{background:#fff;padding:16px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.06);height:420px}
    #sensorChart{width:100%;height:100%}
    .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:12px}
    .stat-card{background:#fff;padding:12px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.04);text-align:center}
  </style>
</head>
<body>
  <nav class="navbar"><div>Archeology Sentry</div><div><a href="/" style="color:#fff;text-decoration:none">Home</a></div></nav>
  <main class="container">
    <section class="controls">
      <div style="flex:1"><strong>Sensor Readings</strong></div>
      <div>
        <button class="time-btn" data-minutes="60">1h</button>
        <button class="time-btn" data-minutes="360">6h</button>
        <button class="time-btn active" data-minutes="1440">24h</button>
      </div>
    </section>
    <div class="chart-wrap">
      <canvas id="sensorChart"></canvas>
    </div>
    <div class="stats-grid" id="statsGrid"></div>
  </main>

  <script>
    // Simple analytics page script - avoids template literal interpolation on server
    (function(){
      const TIMEOUT_MS = 10000;
      let currentTimeframe = 1440; // minutes
      let chart = null;

      function init(){
        const ctx = document.getElementById('sensorChart').getContext('2d');
        chart = new Chart(ctx, {
          type:'line',
          data:{datasets:[]},
          options:{
            responsive:true,maintainAspectRatio:false,
            scales:{x:{type:'time',time:{unit:'minute',displayFormats:{minute:'HH:mm',hour:'HH:mm'}}},y:{beginAtZero:false}}
          }
        });

        document.querySelectorAll('.time-btn').forEach(b=>b.addEventListener('click',()=>{
          document.querySelectorAll('.time-btn').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          currentTimeframe = parseInt(b.dataset.minutes,10)||1440;
          fetchAndRender();
        }));

        fetchAndRender();
        setInterval(fetchAndRender,TIMEOUT_MS);
      }

      function fetchAndRender(){
        const url = '/user/sensor-data'
        fetch(url).then(r=>{
          if(!r.ok) return r.text().then(t=>{throw new Error('Server: '+t)});
          return r.json();
        }).then(data=>{
          renderData(data);
        }).catch(err=>{
          console.error('Failed to load sensor data',err);
        });
      }

      function renderData(points){
        if(!Array.isArray(points)) return;
        // group by type
        const groups = {};
        points.forEach(p=>{
          const t = p.type||'unknown';
          groups[t] = groups[t]||[];
          groups[t].push({x:new Date(p.createdAt), y: Number(p.value)});
        });

        // build datasets
        const colors = {temperature:'#ff6b6b', humidity:'#4ecdc4'};
        const datasets = Object.keys(groups).map((type,i)=>({
          label:type,
          data: groups[type].sort((a,b)=>a.x-b.x),
          borderColor: colors[type]||('#444'+(i%6)),
          backgroundColor: (colors[type]||'#888')+'33',
          tension:0.2,
          fill:false
        }));

        chart.data.datasets = datasets;
        chart.update();

        renderStats(groups);
      }

      function renderStats(groups){
        const container = document.getElementById('statsGrid');
        container.innerHTML='';
        Object.entries(groups).forEach(([type,arr])=>{
          const values = arr.map(d=>d.y).filter(v=>typeof v==='number' && !isNaN(v));
          const cur = values.length?values[values.length-1].toFixed(2):'N/A';
          const avg = values.length?(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2):'N/A';
          const min = values.length?Math.min(...values).toFixed(2):'N/A';
          const max = values.length?Math.max(...values).toFixed(2):'N/A';
          const card = document.createElement('div'); card.className='stat-card';
          card.innerHTML = '<h4>'+type+'</h4><div style="font-weight:700;font-size:1.1rem">'+cur+'</div>'+
            '<div style="font-size:.85rem;color:#666">avg:'+avg+' min:'+min+' max:'+max+'</div>';
          container.appendChild(card);
        });
      }

      // start
      document.addEventListener('DOMContentLoaded', init);
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
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(data);
  } catch (error) {
    logger.error('Error retrieving sensor data:', error);
    return res.status(500).json({ err: 'Internal server error' });
  }
});

export default router;