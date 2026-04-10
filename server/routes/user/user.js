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

router.get('/map', (req, res) => {
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
              color: #9f9f9f;
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

          .navfocus {
            color: #fff
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
                    <a href="/user/sensors" class="nav-link">Sensors</a>
                    <a href="/user/map" class="nav-link navfocus">Map</a>
                    <a href="/user/alerts" class="nav-link">Alerts</a>
                    <a href="/user/admin" class="nav-link">Admin</a>
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
                  <span class="button-text">Add Sensor</span>
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
                    point.onclick = "window.location.href='/analytics?sensor={pointId}'"
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
                    label.textContent = user.name;
                    label.style.left = pixel.x + 'px';
                    label.style.top = (pixel.y + 15) + 'px';
                    this.content.appendChild(label);
                    
                    // Store point data
                    this.points.set(pointId, {
                        gridX: gridX,
                        gridY: gridY,
                        name: user.name,
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
                            item.textContent = user.name;
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
                    btn.querySelector('.button-text').textContent = 'Click to Place: ' + this.selectedUser.name;
                    this.container.style.cursor = 'crosshair';
                }

                toggleAddUserMode() {
                    this.addUserMode = !this.addUserMode;
                    const btn = document.getElementById('addUserBtn');
                    
                    if (this.addUserMode && this.selectedUser) {
                        btn.classList.add('active');
                        btn.querySelector('span').textContent = 'Click to Place: ' + this.selectedUser.name;
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

            async function checkSensorMapPermissions() {
              try {
                const response = await fetch('/user/permissions');
                const data = await response.json();
                const hasPermissions = data.permissions === true;

                if (!hasPermissions) {
                  const addUserBtn = document.getElementById('addUserBtn');
                  const addBoundaryBtn = document.getElementById('addBoundaryBtn');
                  
                  if (addUserBtn) addUserBtn.style.display = 'none';
                  if (addBoundaryBtn) addBoundaryBtn.style.display = 'none';
                  
                  const styleEl = document.createElement('style');
                  styleEl.textContent = '.delete-btn { display: none !important; }';
                  document.head.appendChild(styleEl);

                  const pageWrapper = document.querySelector('.page-wrapper');
                  const message = document.createElement('div');
                  message.style.cssText = 'padding: 1.25rem 1.5rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(78, 205, 196, 0.3); border-radius: 12px; margin: 1.5rem auto; max-width: 1100px; color: var(--accent); font-size: 0.95rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);';
                  message.innerHTML = '<strong>Read-Only Mode:</strong> You do not have permission to add, edit, or delete sensors and boundaries. Contact an administrator to request editing access.';
                  
                  pageWrapper.insertBefore(message, pageWrapper.firstChild);
                }
              } catch (error) {
                console.error('Error fetching permissions:', error);
              }
            }

            checkSensorMapPermissions();


            window.addEventListener("load", () => {
              const app = document.getElementById("app");
              app.style.filter = "blur(0px)";
              app.style.opacity = "1";
            });
        </script>
    </body>
    </html>`)
})

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

          .navfocus {
            color: #fff
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
                        <a href="/user/sensors" class="nav-link navfocus">Sensors</a>
                        <a href="/user/map" class="nav-link">Map</a>
                        <a href="/user/alerts" class="nav-link">Alerts</a>
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
                  return sensors
              } catch (error) {
                  console.error('Error loading sensors:', error);
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

          function renderSensors(sensors, searchTerm = '') {
              const container = document.getElementById('sensors-container');
              container.innerHTML = '';

              const filteredSensors = sensors.filter(sensor =>
                  sensor.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                  card.href = \`/user/analytics?sensor=\${encodeURIComponent(sensor.name)}\`;

                  const header = document.createElement('div');
                  header.className = 'sensor-card-header';

                  const icon = document.createElement('div');
                  icon.className = 'sensor-icon';
                  icon.textContent = getRandomIcon();
                  header.appendChild(icon);

                  const name = document.createElement('h2');
                  name.className = 'sensor-name';
                  name.textContent = sensor.name;
                  header.appendChild(name);

                  card.appendChild(header);

                  if (sensor.types.length > 0) {
                      const typesContainer = document.createElement('div');
                      typesContainer.className = 'sensor-types';
                      
                      sensor.types.forEach(type => {
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
              allSensors = sensors;
              renderSensors(sensors);
          }

          // Search functionality
          document.addEventListener('DOMContentLoaded', () => {
              const searchInput = document.getElementById('search-input');
              searchInput.addEventListener('input', async (e) => {
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

          .navfocus {
            color: #fff
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
                      <a href="/user/sensors" class="nav-link">Sensors</a>
                      <a href="/user/map" class="nav-link">Map</a>
                      <a href="/user/alerts" class="nav-link">Alerts</a>
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
                      <button class="timeframe-btn" data-timeframe="3600000">1 hour</button>
                      <button class="timeframe-btn" data-timeframe="21600000">6 hours</button>
                      <button class="timeframe-btn active" data-timeframe="86400000">24 hours</button>
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
                  "uv": [0, 15],
                  "rain": [0, 1]
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
                  "uv": [0, 2],
                  "rain": [0, 0]
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
        
          .navfocus {
            color: #fff
          }
          .nav-link.navfocus::after {
            background: var(--accent);
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
            
          .navfocus {
            color: #fff
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
                      <a href="/user/map" class="nav-link">Map</a>
                      <a href="/user/alerts" class="nav-link">Alerts</a>
                      <a href="/user/admin" class="nav-link navfocus">Admin</a>
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

router.get('/alerts', async (req, res, next) => {
    const accepts = req.headers['accept'] || '';
    const wantsJson = req.xhr || accepts.includes('application/json');
    if (wantsJson) {
        return next();
    }
    return res.send(`<!doctype html>
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
              padding: 6rem 1rem 3rem;
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
        
          .navfocus {
            color: #fff
          }
          .nav-link.navfocus::after {
            background: var(--accent);
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
            
          .navfocus {
            color: #fff
          }

          .alerts-content {
              width: 100%;
              max-width: 900px;
              display: flex;
              flex-direction: column;
              gap: 2rem;
          }

          .alerts-header h1 {
              margin: 0 0 0.5rem 0;
              font-size: 2.2rem;
              font-weight: 700;
              color: var(--accent);
          }

          .alerts-header p {
              margin: 0;
              color: var(--muted);
              font-size: 1rem;
          }

          .editing-label {
              margin-top: 0.35rem;
              font-size: 0.9rem;
              color: var(--accent);
          }

          .new-alert {
              width: 100%;
              padding: 2rem;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(78, 205, 196, 0.3);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .alert-form-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 1.25rem 1.5rem;
              margin-top: 1.5rem;
          }

          .form-field {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
          }

          .form-field label {
              font-weight: 600;
              color: var(--fg);
              font-size: 0.95rem;
          }

          .form-field input,
          .form-field select {
              width: 100%;
              padding: 10px 14px;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.6);
              background: transparent;
              color: var(--fg);
              font-size: 0.95rem;
              outline: none;
              transition: all 0.3s ease;
          }

          .form-field input:focus,
          .form-field select:focus {
              border-color: var(--accent);
              background-color: rgba(78,205,196,0.12);
          }

          /* Custom dropdown component */
          .dropdown {
              position: relative;
              width: 100%;
          }

          .dropdown-display {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 14px;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.6);
              color: var(--fg);
              cursor: pointer;
              transition: all 0.2s ease;
          }

          .dropdown-display:hover,
          .dropdown.dropdown-open .dropdown-display {
              border-color: var(--accent);
              background: rgba(78,205,196,0.12);
          }

          .dropdown-value {
              font-size: 0.95rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
          }

          .dropdown-arrow {
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 6px solid var(--accent);
              margin-left: 10px;
              flex-shrink: 0;
          }

          .dropdown-menu {
              position: absolute;
              left: 0;
              right: 0;
              top: calc(100% + 6px);
              max-height: 220px;
              overflow-y: auto;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.6);
              background: #111;
              box-shadow: 0 10px 30px rgba(0,0,0,0.7);
              z-index: 50;
              display: none;
          }

          .dropdown.dropdown-open .dropdown-menu {
              display: block;
          }

          .dropdown-option {
              padding: 8px 14px;
              font-size: 0.9rem;
              cursor: pointer;
              color: var(--fg);
          }

          .dropdown-option:hover {
              background: rgba(78,205,196,0.15);
          }

          .dropdown-option.disabled {
              cursor: default;
              color: var(--muted);
          }

          /* Hide default number input arrows */
          .form-field input[type="number"]::-webkit-outer-spin-button,
          .form-field input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
          }

          .form-field input[type="number"] {
              -moz-appearance: textfield;
          }

          .form-actions {
              margin-top: 1.75rem;
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              align-items: center;
          }

          .primary-button {
              padding: 12px 24px;
              border-radius: 8px;
              border: none;
              background: var(--accent);
              color: #111;
              font-weight: 600;
              font-size: 0.95rem;
              cursor: pointer;
              transition: all 0.2s ease;
          }

          .primary-button:hover {
              background: #7be3db;
              transform: translateY(-2px);
              box-shadow: 0 4px 16px rgba(78, 205, 196, 0.3);
          }

          .primary-button:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
              box-shadow: none;
          }

          .secondary-button {
              padding: 10px 18px;
              border-radius: 8px;
              border: 1px solid rgba(78,205,196,0.4);
              background: transparent;
              color: var(--muted);
              font-weight: 500;
              font-size: 0.9rem;
              cursor: pointer;
              transition: all 0.2s ease;
          }

          .secondary-button:hover {
              background: rgba(255,255,255,0.05);
              color: var(--fg);
              border-color: var(--accent);
          }

          .new-alert.editing {
              border-color: var(--accent);
              box-shadow: 0 0 0 1px rgba(78,205,196,0.4), 0 4px 18px rgba(0,0,0,0.6);
          }

          .message {
              padding: 0.9rem 1rem;
              border-radius: 8px;
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

          .alerts-lists {
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              margin-top: 0.5rem;
          }

          .alerts-list {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
          }

          .alert-row {
              display: grid;
              grid-template-columns: 1.6fr 1.2fr 1fr 1fr 1.6fr auto;
              align-items: center;
              padding: 0.55rem 0.25rem;
              column-gap: 0.75rem;
              border-bottom: 1px solid rgba(255,255,255,0.04);
          }

          .alert-row:last-child {
              border-bottom: none;
          }

          .alert-header-row {
              font-size: 0.78rem;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--muted);
          }

          .alert-row:not(.alert-header-row):hover {
              background: rgba(255,255,255,0.03);
          }

          .alert-cell {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
          }

          .alert-actions {
              display: flex;
              justify-content: flex-end;
          }

          .alert-actions .primary-button {
              padding: 6px 12px;
              font-size: 0.8rem;
          }

          .alert-card {
              width: 100%;
              padding: 1.1rem 1.25rem;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(78, 205, 196, 0.25);
              box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
          }

          .alert-card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.75rem;
          }

          .alert-card-title {
              margin: 0;
              font-size: 1.1rem;
              font-weight: 600;
              color: var(--fg);
          }

          .alert-card-view {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
              gap: 0.4rem 1.25rem;
          }

          .alert-card-field {
              display: flex;
              flex-direction: column;
              gap: 0.1rem;
              font-size: 0.85rem;
          }

          .alert-card-field-label {
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--muted);
              font-size: 0.75rem;
          }

          .alert-card-field-value {
              color: var(--fg);
          }

          .inline-input {
              width: 100%;
              padding: 6px 8px;
              border-radius: 6px;
              border: 1px solid rgba(78,205,196,0.6);
              background: rgba(0,0,0,0.7);
              color: var(--fg);
              font-size: 0.85rem;
              outline: none;
          }

          .inline-input:focus {
              border-color: var(--accent);
              background: rgba(78,205,196,0.18);
          }

          .inline-range-inputs {
              display: flex;
              gap: 0.25rem;
          }

          @media (max-width: 768px) {
              .navbar .cta {
                  font-size: 0.95rem;
                  padding: 10px 20px;
              }

              .page-wrapper {
                  padding-top: 5.5rem;
              }

              .new-alert {
                  padding: 1.5rem;
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
                      <a href="/user/map" class="nav-link">Map</a>
                      <a href="/user/alerts" class="nav-link navfocus">Alerts</a>
                      <button class="cta" onclick="window.location.href='/auth/login'">Logout</button>
                  </div>
              </nav>
              <div class="page-wrapper">
                  <div class="alerts-content">
                      <header class="alerts-header">
                          <h1 id="alerts-title">Create a New Alert</h1>
                          <p>Choose a sensor and data type, then define when alerts should trigger.</p>
                          <div id="editing-label" class="editing-label" style="display:none;"></div>
                      </header>

                      <section class="new-alert" id="alert-form-card">
                          <div class="alert-form-grid">
                              <div class="form-field">
                                  <label for="name">Alert Name</label>
                                  <input type="text" id="name" name="name" placeholder="e.g. High Humidity in Gallery A" />
                              </div>

                              <div class="form-field">
                                  <label for="sensor-dropdown">Sensor</label>
                                  <div class="dropdown" id="sensor-dropdown" data-placeholder="Select a sensor">
                                      <div class="dropdown-display">
                                          <span class="dropdown-value">Loading sensors...</span>
                                          <span class="dropdown-arrow"></span>
                                      </div>
                                      <div class="dropdown-menu"></div>
                                  </div>
                              </div>

                              <div class="form-field">
                                  <label for="data-type">Data Type</label>
                                  <div class="dropdown" id="data-type" data-placeholder="Select a data type">
                                      <div class="dropdown-display">
                                          <span class="dropdown-value">Loading data types...</span>
                                          <span class="dropdown-arrow"></span>
                                      </div>
                                      <div class="dropdown-menu"></div>
                                  </div>
                              </div>

                              <div class="form-field">
                                  <label for="min">Minimum Trigger Value</label>
                                  <input type="number" id="min" name="min" placeholder="Optional" />
                              </div>

                              <div class="form-field">
                                  <label for="max">Maximum Trigger Value</label>
                                  <input type="number" id="max" name="max" placeholder="Optional" />
                              </div>

                              <div class="form-field">
                                  <label for="email">Alert Email</label>
                                  <input type="email" id="email" name="email" placeholder="you@example.com" />
                              </div>
                          </div>

                          <div class="form-actions">
                              <button id="create-button" class="primary-button">Create Alert</button>
                              <button id="cancel-edit-button" class="secondary-button" type="button" style="display:none;">Cancel Edit</button>
                              <div class="message" id="message"></div>
                          </div>
                      </section>

                      <section class="alerts-lists" id="alerts-lists">
                          Existing alerts and history will appear here in the future.
                      </section>
                  </div>
              </div>
          </div>
      </div>
      <script>
          const createAlertButton = document.getElementById('create-button');
          const cancelEditButton = document.getElementById('cancel-edit-button');
          const nameInput = document.getElementById('name');
          const emailInput = document.getElementById('email');
          const minInput = document.getElementById('min');
          const maxInput = document.getElementById('max');
          const sensorDropdown = document.getElementById('sensor-dropdown');
          const datatypeSelect = document.getElementById('data-type');
          const alertsListContainer = document.getElementById('alerts-lists');
          const alertFormCard = document.getElementById('alert-form-card');
          const alertsTitle = document.getElementById('alerts-title');
          const editingLabel = document.getElementById('editing-label');
          let editingAlertName = null;
          let sensorOptionsCache = [];
          let typeOptionsCache = [];

          function setupDropdown(container, options, placeholderText, emptyText) {
              if (!container) return;

              container.dataset.value = '';
              const display = container.querySelector('.dropdown-value');
              const menu = container.querySelector('.dropdown-menu');
              if (!display || !menu) return;

              display.textContent = placeholderText;
              menu.innerHTML = '';

              if (!options.length) {
                  const item = document.createElement('div');
                  item.className = 'dropdown-option disabled';
                  item.textContent = emptyText || 'No options';
                  menu.appendChild(item);
                  return;
              }

              options.forEach(function(opt) {
                  const item = document.createElement('div');
                  item.className = 'dropdown-option';
                  item.textContent = opt.label;
                  item.setAttribute('data-value', opt.value);
                  item.addEventListener('click', function() {
                      container.dataset.value = String(opt.value);
                      display.textContent = opt.label;
                      container.classList.remove('dropdown-open');
                  });
                  menu.appendChild(item);
              });

              container.addEventListener('click', function(e) {
                  const isOption = e.target.classList.contains('dropdown-option');
                  if (!isOption) {
                      container.classList.toggle('dropdown-open');
                  }
              });
          }

          function setDropdownValue(container, value) {
              if (!container) return;
              const menu = container.querySelector('.dropdown-menu');
              const display = container.querySelector('.dropdown-value');
              if (!menu || !display) return;

              const items = menu.querySelectorAll('.dropdown-option');
              for (let i = 0; i < items.length; i++) {
                  const item = items[i];
                  if (item.getAttribute('data-value') === String(value)) {
                      container.dataset.value = String(value);
                      display.textContent = item.textContent;
                      break;
                  }
              }
          }

          function exitEditMode() {
              editingAlertName = null;
              createAlertButton.textContent = 'Create Alert';
              if (alertsTitle) {
                  alertsTitle.textContent = 'Create a New Alert';
              }
              if (editingLabel) {
                  editingLabel.style.display = 'none';
                  editingLabel.textContent = '';
              }
              if (cancelEditButton) {
                  cancelEditButton.style.display = 'none';
              }
              if (alertFormCard) {
                  alertFormCard.classList.remove('editing');
              }
              nameInput.value = '';
              emailInput.value = '';
              minInput.value = '';
              maxInput.value = '';
              sensorDropdown.dataset.value = '';
              datatypeSelect.dataset.value = '';
              loadFilterOptions();
          }

          async function loadFilterOptions() {
              try {
                  const response = await fetch('/user/sensor-data/filters');
                  if (!response.ok) {
                      throw new Error('Failed to load filter options');
                  }

                  const data = await response.json();
                  const { users = [], types = [] } = data;

                  const sensorOptions = users.map(function(name) {
                      return { value: name, label: name };
                  });

                  const typeOptions = types.map(function(type) {
                      return { value: type, label: type };
                  });

                  sensorOptionsCache = sensorOptions;
                  typeOptionsCache = typeOptions;

                  setupDropdown(
                      sensorDropdown,
                      sensorOptions,
                      users.length ? 'Select a sensor' : 'No sensors available',
                      'No sensors available'
                  );

                  setupDropdown(
                      datatypeSelect,
                      typeOptions,
                      types.length ? 'Select a data type' : 'No data types available',
                      'No data types available'
                  );

                  const disableForm = !users.length || !types.length;
                  createAlertButton.disabled = disableForm;
              } catch (error) {
                  console.error('Error loading filter options:', error);
                  showMessage('Unable to load sensors and data types. Please try again later.', 'error');
                  createAlertButton.disabled = true;
              }
          }

          async function loadAlerts() {
              try {
                  alertsListContainer.textContent = 'Loading alerts...';

                  const response = await fetch('/user/alerts', {
                      headers: {
                          'Accept': 'application/json'
                      }
                  });

                  if (!response.ok) {
                      throw new Error('Failed to load alerts');
                  }

                  const data = await response.json();
                  const alerts = data.alerts || [];

                  if (!alerts.length) {
                      alertsListContainer.textContent = 'No alerts have been created yet.';
                      return;
                  }

                  alertsListContainer.innerHTML = '';

                  alerts.forEach(function (alert) {
                      const card = document.createElement('div');
                      card.className = 'alert-card';

                      const header = document.createElement('div');
                      header.className = 'alert-card-header';

                      const title = document.createElement('h2');
                      title.className = 'alert-card-title';
                      title.textContent = alert.name;

                      const editBtn = document.createElement('button');
                      editBtn.type = 'button';
                      editBtn.className = 'secondary-button';
                      editBtn.textContent = 'Edit';

                      header.appendChild(title);
                      header.appendChild(editBtn);
                      card.appendChild(header);

                      const view = document.createElement('div');
                      view.className = 'alert-card-view';

                      function addField(labelText, valueText) {
                          const field = document.createElement('div');
                          field.className = 'alert-card-field';

                          const label = document.createElement('span');
                          label.className = 'alert-card-field-label';
                          label.textContent = labelText;

                          const value = document.createElement('span');
                          value.className = 'alert-card-field-value';
                          value.textContent = valueText;

                          field.appendChild(label);
                          field.appendChild(value);
                          view.appendChild(field);
                      }

                      addField('Sensor', (alert.sensor && alert.sensor.name) ? alert.sensor.name : '-');
                      addField('Data Type', alert.datatype || '-');

                      const parts = [];
                      if (alert.min !== null && alert.min !== undefined) {
                          parts.push('min ' + alert.min);
                      }
                      if (alert.max !== null && alert.max !== undefined) {
                          parts.push('max ' + alert.max);
                      }
                      addField('Range', parts.length ? parts.join(', ') : '-');
                      addField('Email', alert.email || '-');

                      card.appendChild(view);

                      editBtn.addEventListener('click', function () {
                          editingAlertName = alert.name;
                          nameInput.value = alert.name || '';
                          emailInput.value = alert.email || '';
                          minInput.value = alert.min ?? '';
                          maxInput.value = alert.max ?? '';

                          if (sensorOptionsCache.length && alert.sensor && alert.sensor.name) {
                              setDropdownValue(sensorDropdown, alert.sensor.name);
                          }
                          if (typeOptionsCache.length && alert.datatype) {
                              setDropdownValue(datatypeSelect, alert.datatype);
                          }

                          createAlertButton.textContent = 'Save Alert';
                          if (alertsTitle) {
                              alertsTitle.textContent = 'Edit Alert';
                          }
                          if (editingLabel) {
                              editingLabel.textContent = 'Editing "' + (alert.name || '') + '". Make changes above, then save or cancel.';
                              editingLabel.style.display = 'block';
                          }
                          if (cancelEditButton) {
                              cancelEditButton.style.display = 'inline-flex';
                          }
                          if (alertFormCard) {
                              alertFormCard.classList.add('editing');
                              alertFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                          nameInput.focus();
                      });

                      alertsListContainer.appendChild(card);
                  });
              } catch (error) {
                  console.error('Error loading alerts:', error);
                  alertsListContainer.textContent = 'Unable to load alerts right now.';
              }
          }

          createAlertButton.addEventListener('click', async () => {
              const name = nameInput.value.trim();
              const email = emailInput.value.trim();
              const sensor = sensorDropdown.dataset.value || '';
              const datatype = datatypeSelect.dataset.value || '';
              const min = minInput.value;
              const max = maxInput.value;

              if (!name || !email || !sensor || !datatype) {
                  showMessage('Please fill in alert name, email, sensor, and data type.', 'error');
                  return;
              }

              createAlertButton.disabled = true;
              hideMessage();

              try {
                  const response = await fetch('/user/alert', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                          name,
                          originalName: editingAlertName,
                          sensor,
                          datatype,
                          min: min !== '' ? Number(min) : null,
                          max: max !== '' ? Number(max) : null,
                          alertEmail: email
                      })
                  });

                  const data = await response.json().catch(() => ({}));

                  if (!response.ok) {
                      showMessage(data.err || 'Failed to save alert', 'error');
                  } else {
                      showMessage(data.msg || 'Alert saved successfully', 'success');
                      exitEditMode();
                      await loadAlerts();
                  }
              } catch (error) {
                  console.error('Error creating alert:', error);
                  showMessage('An error occurred while creating the alert. Please try again.', 'error');
              } finally {
                  createAlertButton.disabled = false;
              }
          });

          function showMessage(text, type) {
              const messageEl = document.getElementById('message');
              messageEl.textContent = text;
              messageEl.className = 'message ' + type;
          }

          function hideMessage() {
              const messageEl = document.getElementById('message');
              messageEl.className = 'message';
          }

          if (cancelEditButton) {
              cancelEditButton.addEventListener('click', function() {
                  exitEditMode();
                  showMessage('Edit cancelled.', 'success');
              });
          }
          window.addEventListener("load", () => {
              const app = document.getElementById("app");
              app.style.filter = "blur(0px)";
              app.style.opacity = "1";
              loadFilterOptions();
              loadAlerts();
          });
      </script>
  </body>
  </html>`)
})

router.get('/alerts', async (req, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            include: {
                sensor: { select: { name: true } }
            }
        });
        return res.status(200).json({alerts})
    } catch (error) {
        logger.error('Error getting alerts:', error);
        return res.status(500).json({ err: 'Internal server error' });
    }
})

router.post('/alert', async (req, res) => {
    try {
        const name = req.body.name;
        const originalName = req.body.originalName || name;
        const sensorName = req.body.sensor;
        const datatype = req.body.datatype;
        const min = req.body.min;
        const max = req.body.max;
        const alertEmail = req.body.alertEmail;

        if (!sensorName) {
            return res.status(400).json({ err: 'Sensor is required for alert' });
        }

        const sensor = await prisma.sensor.findUnique({
                where: {
                    name: sensorName
                }
            });

        if (!sensor) {
            return res.status(404).json({err: "Sensor does not exist"})
        }
        
        await prisma.alert.deleteMany({
            where: { name: originalName }
        });

        await prisma.alert.create({
            data: {
                sensor: {connect: {id: sensor.id}},
                email: alertEmail,
                min: min,
                max: max,
                datatype,
                name,
            }
        });

        return res.status(200).json({ msg: 'Alert saved successfully' });
    } catch (error) {
        logger.error('Error creating alert:', error);
        return res.status(500).json({ err: 'Internal server error' });
    }
})

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
      await prisma.sensor.update({
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
      where: {id: req.userID}
    })
    if (!user.admin) {
      return res.status(403).json({ msg: "Must be admin" })
    }
    const id = req.body.id
    await prisma.Boundary.delete({
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
    const sensors = await prisma.sensor.findMany({
        include: {
            dataPoints: {
                select: {type: true}
            }
        }
    })
    const formattedSensors = sensors.map(sensor => {
        const types = [...new Set(sensor.dataPoints.map(dp => dp.type))].filter(Boolean).sort();
        const {dataPoints, ...sensorData} = sensor;
        return {...sensorData, types}
    })
    return res.status(200).json({sensors: formattedSensors})
  } catch (error) {
    logger.error('Error loading sensors:', error);
    return res.status(500).json ({ err: 'Internal server error' })
  }
})

export default router;
