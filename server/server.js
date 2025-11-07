import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './routes/auth/auth.js';
import userRoutes from './routes/user/user.js';
import authMiddleware from './middleware/authMiddleware.js';
import logger from './logger.js';
import cookieParser from 'cookie-parser';
import { prisma } from './prismaClient.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());
// Serve static assets from the public folder (put icon/logo under public/icon)
app.use(express.static('public'));

app.get('/ping', (req, res) => {
    return res.status(200).json({ msg: 'pong' });
});

app.get('/', (req, res) => {
    return res.send(`<!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Archeology Sentry</title>
        <style>
            :root {
                --bg: #111;
                --fg: #fff;
                --accent: #4ecdc4;
                --muted: #bfbfbf;
            }
            html, body {
                height: 100%;
                margin: 0;
                background: var(--bg);
                color: var(--fg);
                font-family: 'Inter', system-ui, Arial, sans-serif;
            }
            body { min-height: 100vh; }
            a { color: var(--accent); text-decoration: none; }
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
                width: 54px; height: 54px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                box-shadow: 0 2px 12px rgba(0,0,0,0.07);
                transition: box-shadow 0.2s;
                overflow: hidden;
            }
            .navbar .logo img {
                width: 100%; height: 100%; object-fit: contain; display: block;
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
            .section {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 0;
                position: relative;
                text-align: center;
                overflow: hidden;
            }
            .section .bg-image {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                opacity: 0;
                transition: opacity 1s ease-in-out, transform 1.2s ease-out;
                transform: scale(1.1);
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                will-change: transform;
            }
            .section.active .bg-image {
                opacity: 1;
                transform: scale(1);
            }
            .section .content-wrapper {
                position: relative;
                z-index: 2;
                padding: 0 24px;
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.1);
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                max-width: 800px;
                width: 90%;
                margin: 0 auto;
                transform: translateY(30px);
                opacity: 0;
                transition: transform 0.8s ease-out, opacity 0.8s ease-out;
            }
            .section.active .content-wrapper {
                transform: translateY(0);
                opacity: 1;
            }
            .section .parallax-overlay {
                position: absolute;
                inset: 0;
                z-index: 1;
                background: radial-gradient(circle at center, 
                    rgba(0,0,0,0) 0%,
                    rgba(0,0,0,0.4) 100%
                );
                mix-blend-mode: multiply;
                pointer-events: none;
            }
            .section .floating-elements {
                position: absolute;
                inset: 0;
                z-index: 1;
                pointer-events: none;
            }
            .section .floating-element {
                position: absolute;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
                filter: blur(4px);
                animation: float 20s infinite;
            }
            @keyframes float {
                0%, 100% { transform: translate(0, 0); }
                25% { transform: translate(10px, -10px); }
                50% { transform: translate(-5px, 15px); }
                75% { transform: translate(-15px, -5px); }
            }
            .section h1, .section h2 {
                margin: 0 0 24px 0;
                font-size: 3rem;
                font-weight: 900;
                letter-spacing: -1.5px;
            }
            .section p {
                color: var(--muted);
                font-size: 1.25rem;
                max-width: 600px;
                margin: 0 auto 32px auto;
            }
            .section .focus-anim {
                display: inline-block;
                transition: color 0.3s, background 0.3s, box-shadow 0.3s;
                border-radius: 6px;
                padding: 0 6px;
            }
            .section .focus-anim:focus, .section .focus-anim:hover {
                color: var(--bg);
                background: var(--accent);
                box-shadow: 0 2px 16px var(--accent);
                outline: none;
            }
            .section .big-btn {
                background: var(--accent);
                color: #111;
                border: none;
                border-radius: 8px;
                font-size: 1.2rem;
                font-weight: 700;
                padding: 18px 48px;
                margin-top: 32px;
                cursor: pointer;
                box-shadow: 0 2px 12px rgba(78,205,196,0.08);
                transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
            }
                    .section .big-btn:hover, .section .big-btn:focus {
                        background: #7be3db;
                        color: #111;
                        box-shadow: 0 4px 24px var(--accent);
                        transform: translateY(-2px) scale(1.04);
                    }
            .section .icon {
                font-size: 3.5rem;
                margin-bottom: 18px;
                color: var(--accent);
                transition: transform 0.2s;
            }
            .section .icon:hover {
                transform: scale(1.15) rotate(-8deg);
            }
            @media (max-width: 600px) {
                .navbar { padding: 18px 6vw 0 6vw; }
                .section h1, .section h2 { font-size: 2rem; }
                .section p { font-size: 1rem; }
                .section .big-btn { font-size: 1rem; padding: 14px 24px; }
            }
        </style>
    </head>
    <body>
        <nav class="navbar">
            <a href="#" class="logo" tabindex="0" aria-label="Home" title="Home">
                <img src="/icon/logo.png" alt="Archeology Sentry logo" />
            </a>
            <button class="cta" onclick="window.location.href='/auth/login'">Get Started</button>
        </nav>
        <main>
            <section class="section" id="hero">
                <div class="bg-image" style="background-image: url('/images/cover.jpg')"></div>
                <div class="parallax-overlay"></div>
                <div class="floating-elements">
                    <div class="floating-element" style="width:100px;height:100px;top:20%;left:10%"></div>
                    <div class="floating-element" style="width:60px;height:60px;top:60%;right:15%"></div>
                    <div class="floating-element" style="width:80px;height:80px;bottom:20%;left:20%"></div>
                </div>
                <div class="content-wrapper">
                    <h1>Archeology Sentry</h1>
                    <p><span class="focus-anim" tabindex="0">Protecting the past, one microclimate at a time.</span></p>
                    <button class="big-btn" onclick="document.getElementById('section1').scrollIntoView({behavior:'smooth'})">Learn More</button>
                </div>
            </section>
            <section class="section" id="section1">
                <div class="bg-image" style="background-image: url('/images/decay.jpg')"></div>
                <div class="parallax-overlay"></div>
                <div class="floating-elements">
                    <div class="floating-element" style="width:120px;height:120px;top:30%;right:10%"></div>
                    <div class="floating-element" style="width:70px;height:70px;bottom:40%;left:15%"></div>
                </div>
                <div class="content-wrapper">
                    <div class="icon" tabindex="0" title="Heat & Humidity">🌡️</div>
                    <h2>Heat & Humidity: The Hidden Threat</h2>
                    <p>Fluctuations in temperature and moisture silently accelerate artifact decay. <span class="focus-anim" tabindex="0">Preservation starts with awareness.</span></p>
                </div>
            </section>
            <section class="section" id="section2">
                <div class="bg-image" style="background-image: url('/images/monitoring.jpg')"></div>
                <div class="parallax-overlay"></div>
                <div class="floating-elements">
                    <div class="floating-element" style="width:90px;height:90px;top:20%;left:20%"></div>
                    <div class="floating-element" style="width:50px;height:50px;bottom:30%;right:25%"></div>
                </div>
                <div class="content-wrapper">
                    <div class="icon" tabindex="0" title="Our Solution">🔬</div>
                    <h2>Real-Time Microclimate Monitoring</h2>
                    <p>Our device analyzes site conditions and <span class="focus-anim" tabindex="0">alerts you instantly</span> to risks like rising water or humidity spikes.</p>
                </div>
            </section>
            <section class="section" id="section3">
                <div class="bg-image" style="background-image: url('/images/sentry.jpeg')"></div>
                <div class="parallax-overlay"></div>
                <div class="floating-elements">
                    <div class="floating-element" style="width:110px;height:110px;top:40%;right:20%"></div>
                    <div class="floating-element" style="width:65px;height:65px;bottom:25%;left:25%"></div>
                </div>
                <div class="content-wrapper">
                    <div class="icon" tabindex="0" title="Device">⚙️</div>
                    <h2>Small Device, Big Impact</h2>
                    <p>Deploy anywhere. <span class="focus-anim" tabindex="0">Low-power, always-on</span> sensors let you act before damage is done.</p>
                    <button class="big-btn" onclick="window.location.href='/auth/login'">Get Started</button>
                </div>
            </section>
        </main>
            <script>
            // Animate focus-anim spans and handle section transitions
            const sections = document.querySelectorAll('.section');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if(entry.isIntersecting) {
                        entry.target.classList.add('active');
                        
                        // Parallax effect on scroll
                        const bg = entry.target.querySelector('.bg-image');
                        const content = entry.target.querySelector('.content-wrapper');
                        
                        window.addEventListener('scroll', () => {
                            const rect = entry.target.getBoundingClientRect();
                            const scrollProgress = rect.top / window.innerHeight;
                            
                            if (bg) {
                                bg.style.transform = 'scale(1.1) translateY(' + (scrollProgress * 50) + 'px)';
                            }
                            if (content) {
                                content.style.transform = 'translateY(' + (scrollProgress * -30) + 'px)';
                            }
                        });
                    } else {
                        entry.target.classList.remove('active');
                    }
                });
            }, { threshold: 0.3 });
            
            sections.forEach(section => observer.observe(section));

            // Focus animations
            const anims = document.querySelectorAll('.focus-anim');
            const animObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if(entry.isIntersecting) {
                        entry.target.style.background = 'var(--accent)';
                        entry.target.style.color = '#111';
                        entry.target.style.boxShadow = '0 2px 16px var(--accent)';
                    } else {
                        entry.target.style.background = '';
                        entry.target.style.color = '';
                        entry.target.style.boxShadow = '';
                    }
                });
            }, { threshold: 0.7 });
            
            anims.forEach(el => animObserver.observe(el));

            // Add random movement to floating elements
            document.querySelectorAll('.floating-element').forEach(el => {
                el.style.animationDelay = Math.random() * -20 + 's';
                el.style.animationDuration = (20 + Math.random() * 10) + 's';
            });
        </script>
    </body>
    </html>`);
});

app.use('/auth', authRoutes);
app.use('/user', authMiddleware, userRoutes);

app.listen(PORT, () => {
    logger.info(`Server local at http://127.0.0.1:${PORT}`);
});