# Archeology Sentry

**Archeology Sentry** is a comprehensive monitoring system designed to help archaeologists track and analyze environmental conditions (temperature and humidity) at archaeological sites to prevent artifact decay. The system consists of an Arduino-based sensor device, a Node.js backend server, and a web-based analytics dashboard.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Usage](#usage)
- [Deployment](#deployment)
- [Development](#development)
- [License](#license)

## Overview

Archeology Sentry monitors microclimate conditions at archaeological sites using:
- **Arduino Device**: DHT11 sensor that reads temperature and humidity
- **Listener Service**: Node.js service that reads serial data from Arduino and sends it to the server
- **Web Server**: Express.js backend with authentication and analytics dashboard
- **Database**: PostgreSQL database for storing sensor readings and user data

The system provides real-time monitoring, historical data analysis, and visualizations to help archaeologists maintain optimal conditions for artifact preservation.

## Architecture

```
┌─────────────┐
│   Arduino   │ (DHT11 Sensor)
│   Device    │
└──────┬──────┘
       │ Serial (9600 baud)
       │
┌──────▼──────────┐
│  Listener       │ (Node.js)
│  Service        │ Reads serial data
└──────┬──────────┘
       │ HTTP POST
       │
┌──────▼──────────┐
│  Express Server │ (Node.js + Express)
│  - Auth         │
│  - API          │
│  - Dashboard    │
└──────┬──────────┘
       │
┌──────▼──────────┐
│  PostgreSQL     │
│  Database       │
└─────────────────┘
```

### Component Flow

1. **Arduino** reads temperature/humidity from DHT11 sensor every 2 seconds
2. **Listener** service reads serial data and parses sensor readings
3. **Listener** authenticates with server and POSTs sensor data
4. **Server** stores data in PostgreSQL database
5. **Web Dashboard** displays analytics with filtering capabilities

## Features

### Core Features
- ✅ Real-time temperature and humidity monitoring
- ✅ User authentication (signup/login with JWT)
- ✅ Secure API endpoints with cookie-based authentication
- ✅ Interactive analytics dashboard with Chart.js
- ✅ Advanced filtering (timeframe, data type, user)
- ✅ Historical data visualization
- ✅ Mobile-responsive design

### Dashboard Features
- Timeframe selection (15 min, 30 min, 1 hour, 6 hours, 24 hours, 7 days, custom range)
- Filter by data type (temperature, humidity)
- Filter by user
- Visual charts with nominal range indicators
- Clear data functionality per dataset

## Technology Stack

### Backend
- **Node.js** (ES Modules)
- **Express.js** 5.1.0 - Web framework
- **Prisma** 6.18.0 - ORM for database
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **SerialPort** - Serial communication

### Frontend
- **HTML/CSS/JavaScript** (Vanilla)
- **Chart.js** - Data visualization
- **Moment.js** - Time formatting

### Hardware
- **Arduino** (Uno/Nano compatible)
- **DHT11** - Temperature and humidity sensor

### DevOps
- **Docker** & **Docker Compose** - Containerization

## Project Structure

```
Archeology-Sentry/
├── server/                 # Backend server
│   ├── routes/
│   │   ├── auth/          # Authentication routes
│   │   │   └── auth.js    # Login, signup endpoints
│   │   └── user/          # User routes
│   │       └── user.js    # Analytics dashboard, sensor data endpoints
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT authentication middleware
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   ├── public/            # Static assets
│   │   ├── icon/          # Logo
│   │   └── images/        # Background images
│   ├── server.js          # Main server file
│   ├── logger.js          # Winston logger configuration
│   ├── prismaClient.js    # Prisma client initialization
│   ├── package.json       # Server dependencies
│   └── Dockerfile         # Docker configuration
│
├── listener/              # Serial data listener service
│   ├── listener.js        # Main listener logic
│   ├── serial_reader.js   # Serial port reader
│   ├── package.json       # Listener dependencies
│   └── .env               # Environment variables
│
├── sentry_arduino/        # Arduino firmware
│   └── sentry_arduino.ino # Arduino code
│
├── docker-compose.yaml    # Docker Compose configuration
├── LICENSE.md             # License file
└── README.md             # This file
```

## Installation

### Prerequisites

- Node.js (v18+)
- PostgreSQL (or use Docker)
- Arduino IDE (for firmware)
- Docker & Docker Compose (optional, for containerized deployment)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Archeology-Sentry
```

### Step 2: Install Server Dependencies

```bash
cd server
npm install
```

### Step 3: Install Listener Dependencies

```bash
cd ../listener
npm install
```

### Step 4: Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE sentry;
```

2. Set up Prisma:
```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

### Step 5: Environment Variables

Create `.env` files in both `server/` and `listener/` directories:

**server/.env:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sentry?schema=public"
JWT_SECRET="your-secret-key-here"
NODE_ENV="development"
PORT=3000
```

**listener/.env:**
```env
SERVER_URL="http://127.0.0.1:3000"
EMAIL="your-email@example.com"
PASSW="your-password"
ARDUINO_PORT="COM3"  # Windows: COM3, Linux/Mac: /dev/ttyUSB0 or /dev/ttyACM0
```

### Step 6: Upload Arduino Firmware

1. Open `sentry_arduino/sentry_arduino.ino` in Arduino IDE
2. Install DHT library: `Tools > Manage Libraries > Search "DHT" > Install`
3. Connect Arduino with DHT11 sensor (pin 2)
4. Select board and port in Arduino IDE
5. Upload the sketch

## Configuration

### Arduino Configuration

- **Sensor Pin**: Pin 2 (defined in `sentry_arduino.ino`)
- **Sensor Type**: DHT11 (change to DHT22 if needed)
- **Baud Rate**: 9600
- **Read Interval**: 2 seconds

### Serial Port Configuration

**Windows:**
- Port format: `COM3`, `COM4`, etc.
- Find port in Device Manager

**Linux/Mac:**
- Port format: `/dev/ttyUSB0`, `/dev/ttyACM0`
- Find port: `ls /dev/tty*`

### Database Configuration

The database uses Prisma ORM. Schema is defined in `server/prisma/schema.prisma`.

To update the database schema:
```bash
cd server
npx prisma migrate dev --name your_migration_name
```

## API Documentation

### Authentication Endpoints

#### POST `/auth/signup`
Create a new user account.

**Request:**
- Headers: `Authorization: Basic <base64(email:password)>`
- Body: None

**Response:**
- `201`: User created successfully
- `400`: Invalid input
- `409`: Email already exists

**Example:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Authorization: Basic $(echo -n 'user@example.com:password' | base64)"
```

#### POST `/auth/login`
Authenticate and receive JWT token.

**Request:**
- Headers: `Authorization: Basic <base64(email:password)>`
- Body: None

**Response:**
- `200`: Login successful (sets JWT cookie)
- `401`: Invalid credentials
- `400`: Invalid email domain (must be gmail.com, yahoo.com, or proton.me)

**Example:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Authorization: Basic $(echo -n 'user@example.com:password' | base64)" \
  -c cookies.txt
```

### User Endpoints (Requires Authentication)

#### GET `/user/analytics`
Render the analytics dashboard page.

**Request:**
- Cookies: `jwt` (required)

**Response:**
- HTML page with analytics dashboard

#### GET `/user/sensor-data`
Retrieve sensor data with optional filters.

**Query Parameters:**
- `timeframe` (number): Milliseconds for relative time (e.g., 3600000 for 1 hour)
- `start` (ISO string): Start date for custom range
- `end` (ISO string): End date for custom range
- `type` (string): Filter by data type ("temperature" or "humidity")
- `userEmail` (string): Filter by user email

**Response:**
```json
{
  "user@example.com temperature": [
    { "x": "2024-01-01T12:00:00Z", "y": 72.5 },
    { "x": "2024-01-01T12:02:00Z", "y": 73.1 }
  ],
  "user@example.com humidity": [
    { "x": "2024-01-01T12:00:00Z", "y": 45.2 }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/user/sensor-data?timeframe=3600000&type=temperature \
  -b cookies.txt
```

#### GET `/user/sensor-data/filters`
Get available filter options (data types and users).

**Response:**
```json
{
  "types": ["temperature", "humidity"],
  "users": ["user1@example.com", "user2@example.com"]
}
```

#### POST `/user/sensor-data`
Submit new sensor data point.

**Request:**
- Headers: `Cookie: jwt=<token>`
- Body:
```json
{
  "type": "temperature",
  "value": 72.5
}
```

**Response:**
- `200`: Data saved successfully
- `400`: Invalid data format
- `401`: Not authenticated

**Example:**
```bash
curl -X POST http://localhost:3000/user/sensor-data \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"type":"temperature","value":72.5}'
```

#### DELETE `/user/cls-data`
Clear sensor data for a specific user and data type.

**Request:**
- Headers: `Cookie: jwt=<token>`
- Body:
```json
{
  "ref": "user@example.com temperature"
}
```

**Response:**
- `200`: Data cleared successfully
- `400`: User not found

### Public Endpoints

#### GET `/`
Landing page with project information.

#### GET `/ping`
Health check endpoint.

**Response:**
```json
{
  "msg": "pong"
}
```

## Database Schema

### User Model
```prisma
model User {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  passw     String     // Hashed password
  createdAt DateTime   @default(now())
  dataPoints DataPoint[]
}
```

### DataPoint Model
```prisma
model DataPoint {
  id        Int      @id @default(autoincrement())
  type      String   // "temperature" or "humidity"
  value     Float    // Sensor reading value
  createdAt DateTime @default(now())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
}
```

## Usage

### Starting the Server

```bash
cd server
npm run prod
# or
node server.js
```

Server runs on `http://localhost:3000` by default.

### Starting the Listener

```bash
cd listener
npm run prod
# or
node listener.js
```

The listener will:
1. Connect to Arduino on the configured serial port
2. Authenticate with the server
3. Read sensor data and POST it to the server

### Accessing the Dashboard

1. Navigate to `http://localhost:3000`
2. Click "Get Started" or go to `/auth/login`
3. Sign up or log in
4. Access analytics at `/user/analytics`

### Using the Analytics Dashboard

1. **Select Timeframe**: Choose from preset ranges or "Custom range"
2. **Filter by Type**: Select "temperature" or "humidity" (or "All")
3. **Filter by User**: Select a specific user (or "All users")
4. **Click Apply**: View filtered data
5. **Click Reset**: Clear all filters

Charts display:
- **Blue**: Values below nominal range
- **Teal**: Values within nominal range
- **Red**: Values above nominal range
- **Dashed lines**: Nominal range thresholds

## Deployment

### Docker Deployment

The project includes Docker Compose configuration for easy deployment.

1. **Start services:**
```bash
docker-compose up -d
```

2. **View logs:**
```bash
docker-compose logs -f
```

3. **Stop services:**
```bash
docker-compose down
```

### Environment Variables for Production

Update `docker-compose.yaml` or use environment files:

**server/.env (production):**
```env
DATABASE_URL="postgresql://postgres:postgres@sentry-db:5432/sentry?schema=public"
JWT_SECRET="strong-production-secret"
NODE_ENV="production"
PORT=3000
```

**listener/.env (production):**
```env
SERVER_URL="http://sentry-server:3000"
EMAIL="production-email@example.com"
PASSW="production-password"
ARDUINO_PORT="/dev/ttyUSB0"
```

### Manual Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations: `npx prisma migrate deploy`
4. Start server: `npm run prod`
5. Start listener: `npm run prod` (on device with Arduino)

## Development

### Development Setup

1. Install dependencies for both server and listener
2. Set `NODE_ENV=development` in server `.env`
3. Run Prisma migrations: `npx prisma migrate dev`
4. Start server in development mode
5. Use file logging (configured in `logger.js`)

### Code Structure

- **Routes**: Organized by feature (auth, user)
- **Middleware**: Authentication and request processing
- **Services**: Business logic (can be extracted from routes)
- **Models**: Database models via Prisma

### Adding New Features

1. **New API Endpoint:**
   - Add route in appropriate file under `routes/`
   - Apply auth middleware if needed
   - Update API documentation

2. **New Sensor Type:**
   - Update Arduino code to send new data format
   - Update listener to parse new format
   - Update dashboard to display new type

3. **Database Changes:**
   - Update `schema.prisma`
   - Create migration: `npx prisma migrate dev --name feature_name`
   - Update TypeScript types: `npx prisma generate`

### Testing

Currently, manual testing is used. Consider adding:
- Unit tests (Jest)
- Integration tests
- API endpoint tests

## Troubleshooting

### Arduino Not Connecting

- Check serial port in `listener/.env`
- Verify Arduino is connected and powered
- Check baud rate matches (9600)
- Try different USB port

### Authentication Fails

- Verify JWT_SECRET is set
- Check cookie settings (httpOnly, secure, sameSite)
- Ensure email domain is allowed (gmail.com, yahoo.com, proton.me)

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure database exists
- Run migrations: `npx prisma migrate deploy`

### No Data in Dashboard

- Verify listener is running and connected
- Check Arduino is sending data
- Verify authentication in listener
- Check server logs for errors

## License

See [LICENSE.md](LICENSE.md) for license information.

## Author

**Austin Nabil Blass**

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- DHT sensor library for Arduino
- Chart.js for data visualization
- Express.js community
- Prisma team

---

For questions or issues, please open an issue on the repository.
