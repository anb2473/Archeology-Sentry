import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './routes/auth/auth.js';
import userRoutes from './routes/user/user.js';
import authMiddleware from './middleware/authMiddleware.js';
import logger from './logger.js';
import cookieParser from 'cookie-parser';
import arduinoListener from './arduino_listener.js';
import prisma from './prismaClient.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/ping', (req, res) => {
    return res.status(200).json({ msg: 'pong' });
});

app.use('/auth', authRoutes);
app.use('/user', authMiddleware, userRoutes);

arduinoListener.startSerialReader(async (data) => {
    const code = data.charAt(0);
    const value = data.slice(1);
    switch (code) {
        case 'H':
            break;
        case 'T':
            break;
        case 'E':
            logger.error(`Arduino Error: ${value}`);
            break;
        case 'I':
            logger.info(`Arduino Info: ${value}`);
            break;
    }
})

app.listen(PORT, () => {
    logger.info(`Server local at http://127.0.0.1:${PORT}`);
});