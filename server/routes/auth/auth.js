import express from 'express';
import { prisma } from '../../prismaClient.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import logger from '../../logger.js';

const SALT_ROUNDS = 10;
const maxJWTAge = 24 * 60 * 60 * 1000; // 24 hrs in ms
const minPasswLen = 6;
const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

function parseBasicAuth(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Basic ')) return null;

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [email, password] = credentials.split(':');
  return { email, password };
}

router.get('/signup', async (req, res) => {
    return res.send(`<!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Sign Up - Archeology Sentry</title>
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
            .auth-container {
                background: rgba(255,255,255,0.03);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                    padding: 3rem;
                width: 100%;
                max-width: 400px;
                margin: 1rem;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                transform: translateY(0);
                transition: transform 0.3s ease;
            }
            .auth-container:hover {
                transform: translateY(-5px);
            }
            h1 {
                margin: 0 0 1.5rem 0;
                font-size: 2rem;
                font-weight: 700;
            }
            .input-group {
                margin-bottom: 1.5rem;
            }
            label {
                display: block;
                margin-bottom: 0.5rem;
                color: var(--muted);
                font-size: 0.9rem;
            }
            input {
                width: 100%;
                padding: 0.75rem 1rem;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: var(--fg);
                font-size: 1rem;
                transition: all 0.2s ease;
            }
            input:focus {
                outline: none;
                border-color: var(--accent);
                background: rgba(255,255,255,0.08);
            }
            .submit-btn {
                width: 100%;
                padding: 0.875rem;
                background: var(--accent);
                color: #111;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .submit-btn:hover {
                background: #7be3db;
                transform: translateY(-2px);
            }
            .alt-action {
                margin-top: 1rem;
                text-align: center;
                color: var(--muted);
            }
            .alt-action a {
                color: var(--accent);
                text-decoration: none;
                font-weight: 500;
            }
            .alt-action a:hover {
                text-decoration: underline;
            }
            .error-message {
                color: var(--error);
                background: rgba(255,68,68,0.1);
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                display: none;
            }
            @media (max-width: 480px) {
                .auth-container {
                    padding: 1.5rem;
                }
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
            <div class="auth-container">
                <h1>Create Account</h1>
                <div id="error-message" class="error-message"></div>
                <form id="signup-form" onsubmit="handleSubmit(event)">
                    <div class="input-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required autocomplete="email" />
                    </div>
                    <div class="input-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required minlength="6" />
                    </div>
                    <div class="input-group">
                        <label for="confirm-password">Confirm Password</label>
                        <input type="password" id="confirm-password" name="confirm-password" required minlength="6" />
                    </div>
                    <button type="submit" class="submit-btn">Sign Up</button>
                </form>
                <div class="alt-action">
                    Already have an account? <a href="/auth/login">Log In</a>
                </div>
            </div>
        </div>
        <script>
            async function handleSubmit(e) {
                e.preventDefault();
                const errorElement = document.getElementById('error-message');
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                if (password !== confirmPassword) {
                    errorElement.textContent = 'Passwords do not match';
                    errorElement.style.display = 'block';
                    return;
                }

                try {
                    const credentials = btoa(email + ':' + password);
                    const response = await fetch('/auth/signup', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + credentials
                        }
                    });

                    if (response.ok) {
                        window.location.href = '/user/analytics'; // Redirect to analytics dashboard
                    } else {
                        const data = await response.json();
                        errorElement.textContent = data.err || 'Signup failed';
                        errorElement.style.display = 'block';
                    }
                } catch (err) {
                    errorElement.textContent = 'An error occurred. Please try again.';
                    errorElement.style.display = 'block';
                }
            }
        </script>
    </body>
    </html>`);
});

router.post('/signup', async (req, res) => {
    try {
        const auth = parseBasicAuth(req);

        if (!auth) return res.status(400).json({ err: 'Missing Basic Auth' });

        const email = auth.email.trim();  // not username for signup
        const passw = auth.password;

        if (!validator.isEmail(email)) {
            return res.status(400).json({ err: 'Invalid email format' });
        }
        if (typeof passw !== 'string' || passw.length < minPasswLen) {
            return res.status(400).json({ err: 'Password must be at least 6 characters' });
        }

        // Check if email or username already exists
        const existing = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (existing) {
            return res.status(409).json({ err: 'Email already in use' });
        }

        try {
            const passw_hash = await bcrypt.hash(passw, SALT_ROUNDS);

            const newUser = await prisma.user.create({
                data: {
                    email,
                    passw: passw_hash,
                }
            });

            // Generate JWT token for new user
            const token = jwt.sign(
                { userId: newUser.id, email: newUser.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Set JWT token in HTTP-only cookie
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none',
                maxAge: maxJWTAge
            });

            return res.status(201).json({ message: 'User created successfully' });
        } catch (err) {
            logger.error('Error in signup - user creation / jwt catch:', {
                error: err,
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            return res.status(500).json({ 
                err: 'Internal server error',
            });
        }           
    } catch (err) {
        logger.error('Error in signup - validation / existing check catch:', {
            error: err,
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        return res.status(500).json({ err: 'Internal server error' });
    }
});

router.get('/login', async (req, res) => {
    return res.send(`<!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
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
            .auth-container {
                background: rgba(255,255,255,0.03);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 16px;
                    padding: 3rem;
                width: 100%;
                max-width: 400px;
                margin: 1rem;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                transform: translateY(0);
                transition: transform 0.3s ease;
            }
            .auth-container:hover {
                transform: translateY(-5px);
            }
            h1 {
                margin: 0 0 1.5rem 0;
                font-size: 2rem;
                font-weight: 700;
            }
            .input-group {
                margin-bottom: 1.5rem;
            }
            label {
                display: block;
                margin-bottom: 0.5rem;
                color: var(--muted);
                font-size: 0.9rem;
            }
            input {
                width: 100%;
                padding: 0.75rem 1rem;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: var(--fg);
                font-size: 1rem;
                transition: all 0.2s ease;
            }
            input:focus {
                outline: none;
                border-color: var(--accent);
                background: rgba(255,255,255,0.08);
            }
            .submit-btn {
                width: 100%;
                padding: 0.875rem;
                background: var(--accent);
                color: #111;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .submit-btn:hover {
                background: #7be3db;
                transform: translateY(-2px);
            }
            .alt-action {
                margin-top: 1rem;
                text-align: center;
                color: var(--muted);
            }
            .alt-action a {
                color: var(--accent);
                text-decoration: none;
                font-weight: 500;
            }
            .alt-action a:hover {
                text-decoration: underline;
            }
            .error-message {
                color: var(--error);
                background: rgba(255,68,68,0.1);
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                display: none;
            }
            @media (max-width: 480px) {
                .auth-container {
                    padding: 1.5rem;
                }
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
            <div class="auth-container">
                <h1>Welcome Back</h1>
                <div id="error-message" class="error-message"></div>
                <form id="login-form" onsubmit="handleSubmit(event)">
                    <div class="input-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required autocomplete="email" />
                    </div>
                    <div class="input-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required />
                    </div>
                    <button type="submit" class="submit-btn">Log In</button>
                </form>
                <div class="alt-action">
                    Don't have an account? <a href="/auth/signup">Sign Up</a>
                </div>
            </div>
        </div>
        <script>
            async function handleSubmit(e) {
                e.preventDefault();
                const errorElement = document.getElementById('error-message');
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                try {
                    const credentials = btoa(email + ':' + password);
                    const response = await fetch('/auth/login', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + credentials
                        }
                    });

                    if (response.ok) {
                        window.location.href = '/user/analytics'; // Redirect to analytics dashboard
                    } else {
                        const data = await response.json();
                        errorElement.textContent = data.err || 'Login failed';
                        errorElement.style.display = 'block';
                    }
                } catch (err) {
                    errorElement.textContent = 'An error occurred. Please try again.';
                    errorElement.style.display = 'block';
                }
            }
        </script>
    </body>
    </html>`);
});

router.post('/login', async (req, res) => {
    try {
        const auth = parseBasicAuth(req);
        if (!auth) return res.status(400).json({ err: 'Missing Basic Auth' });

        const email = auth.email.trim();
        const passw = auth.password;

        // Validate input
        if (validator.isEmail(email)) {
            // Check domain
            const allowedDomains = ['gmail.com', 'yahoo.com', 'proton.me'];
            const domain = email.split('@')[1];
            if (!allowedDomains.includes(domain)) {
                return res.status(400).json({ err: 'Email domain not allowed' });
            }
        }

        if (typeof passw !== 'string' || passw.length < minPasswLen) {     // Input validation
            return res.status(400).json({ err: 'Invalid password' });
        }

        // Find user by email
        const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: email },
              ]
            }
        });
          
        if (!user) {
            return res.status(404).json({ err: 'Incorrect password or email' });
        }

        // Check for valid password
        const passwCorrect = await bcrypt.compare(passw, user.passw);
        if (passwCorrect) {
            // Generate JWT token   
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Set JWT token in HTTP-only cookie
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none',
                maxAge: maxJWTAge
            });

            return res.status(200).json({ message: 'Login successful' });
        } else {
            return res.status(401).json({ err: 'Incorrect password or email' });
        }
    } catch (err) {
        logger.error('Error in login', {
            error: err,
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        return res.status(500).json({ err: 'Internal server error' });
    }
});

export default router;
