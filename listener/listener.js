import dotenv from 'dotenv'
import fetch from 'node-fetch';

dotenv.config();

import startSerialReader from './serial_reader.js';

// Use SERVER_URL env var so we can switch between http/https in different environments.
// Default to HTTP localhost because the server is commonly run without TLS in dev.
const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:3000';
const name = process.env.NAME
const passw = process.env.PASSW
console.log(name)

let authCookie = null;

async function getAuthToken() {
    try {
        const credentials = Buffer.from(`${name}:${passw}`).toString('base64');

    console.log(`${SERVER_URL}/auth/login`)
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
            console.error('Login failed:', err, response);
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
    const index = data.indexOf(" ");
    
    const data_type = data.slice(0, index)
    const value = data.slice(index + 1)

    switch (data_type ) {
        case 'External_Temperature':
            const temperature = parseFloat(value);
            console.log(`Temperature: ${temperature}°C`);
            sendPostReq('user/sensor-data', { type: 'temperature', value: temperature });
            break;
        case 'External_Humidity':
            const humidity = parseFloat(value);
            console.log(`Humidity: ${humidity}%`);
            sendPostReq('user/sensor-data', { type: 'humidity', value: humidity });
            break;
        case 'Motion':
            const motion = parseInt(value)
            console.log(`Motion: ${motion}`);
            sendPostReq('user/sensor-data', { type: 'motion', value: motion });
            break;
        case 'Soil_Moisture':
            const soil_moisture = parseInt(value)
            console.log(`Soil Moisture: ${soil_moisture}`)
            sendPostReq('user/sensor-data', { type: 'soil_moisture', value: soil_moisture });
            break;
        case 'Pressure':
            const pressure = parseFloat(value)
            console.log(`Pressure: ${pressure}`)
            sendPostReq('user/sensor-data', { type: 'pressure', value: pressure });
            break;
        case 'Internal_Temp':
            const internal_temp = parseFloat(value)
            console.log(`Internal Temp: ${internal_temp}`)
            sendPostReq('user/sensor-data', { type: 'internal_temp', value: internal_temp });
            break;
        case 'Accel_X':
            const accel_x = parseFloat(value)
            console.log(`Accel X: ${accel_x}`)
            sendPostReq('user/sensor-data', { type: 'accel_x', value: accel_x });
            break;
        case 'Accel_Y':
            const accel_y = parseFloat(value)
            console.log(`Accel Y: ${accel_y}`)
            sendPostReq('user/sensor-data', { type: 'accel_y', value: accel_y });
            break;
        case 'Accel_Z':
            const accel_z = parseFloat(value)
            console.log(`Accel Z: ${accel_z}`)
            sendPostReq('user/sensor-data', { type: 'accel_z', value: accel_z });
            break;
        case 'Gyro_X':
            const gyro_x = parseFloat(value)
            console.log(`Gyro X: ${gyro_x}`)
            sendPostReq('user/sensor-data', { type: 'gyro_x', value: gyro_x });
            break;
        case 'Gyro_Y':
            const gyro_y = parseFloat(value)
            console.log(`Gyro Y: ${gyro_y}`)
            sendPostReq('user/sensor-data', { type: 'gyro_y', value: gyro_y });
            break;
        case 'Gyro_Z':
            const gyro_z = parseFloat(value)
            console.log(`Gyro Z: ${gyro_z}`)
            sendPostReq('user/sensor-data', { type: 'gyro_z', value: gyro_z });
            break;
        case 'Light':
            const lux = parseFloat(value)
            console.log(`Light: ${lux}`)
            sendPostReq('user/sensor-data', { type: 'light', value: lux });
            break;
        case 'UV':
            const uv = parseFloat(value)
            console.log(`UV: ${uv}`)
            sendPostReq('user/sensor-data', { type: 'uv', value: uv });
            break;
        case 'Info':
            console.log(`Info: ${value}`)
            break;
        case 'Error':
            console.log(`Error: ${value}`);
            break;
    }
});
