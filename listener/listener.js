import startSerialReader from './serial_reader.js';
import dotenv from 'dotenv'
import fetch from 'node-fetch';

dotenv.config();

// Use SERVER_URL env var so we can switch between http/https in different environments.
// Default to HTTP localhost because the server is commonly run without TLS in dev.
const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:3000';
const email = process.env.EMAIL
const passw = process.env.PASSW

let authCookie = null;

async function getAuthToken() {
    try {
        const credentials = Buffer.from(`${email}:${passw}`).toString('base64');

    const response = await fetch(`${SERVER_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
        });

        const setCookie = response.headers.get('set-cookie');

        if (!response.ok) {
            const err = await response.json();
            console.error('Login failed:', err);
            return null;
        }

        if (setCookie) {
            authCookie = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
            console.log('✅ Got auth cookie:', authCookie);
        } else {
            console.warn('⚠️ No cookie found in response.');
        }

        return authCookie;
    } catch (err) {
        console.error('Error retrieving auth token:', err);
        return null;
    }
}

async function sendPostReq(endpoint, postData) {
    try {
    const response = await fetch(`${SERVER_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': authCookie
            },
            body: JSON.stringify(postData),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.err || 'Unknown error posting data');
        }
    } catch (error) {
        console.error('Error posting data:', error);
    }
}

getAuthToken();

startSerialReader(async (data) => {
    const id = data[0];
    switch (id) {
        case 'T':
            const temperature = parseFloat(data.slice(1));
            console.log(`Temperature: ${temperature}°C`);
            sendPostReq('user/sensor-data', { type: 'temperature', value: temperature });
            break;
        case 'H':
            const humidity = parseFloat(data.slice(1));
            console.log(`Humidity: ${humidity}%`);
            sendPostReq('user/sensor-data', { type: 'humidity', value: humidity });
            break;
        case 'I':
            console.log(`Info: ${data.slice(1)}`);
            break;
        case 'E':
            console.log(`Error: ${data.slice(1)}`);
            break;
    }
});