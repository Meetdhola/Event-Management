/**
 * Tactical Networking Config
 * Handles dynamic routing for both Vercel (Production) and Local (Development)
 */

// Detect if running on localhost
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use Render Production URL as Primary
const RENDER_API_BASE = 'https://event-management-9ft1.onrender.com/api';
const RENDER_SOCKET_URL = 'https://event-management-9ft1.onrender.com';
const LOCAL_API_BASE = 'http://localhost:5001/api';
const LOCAL_SOCKET_URL = 'http://localhost:5001';

// Determine URLs based on environment
export const API_BASE_URL = import.meta.env.DEV ? RENDER_API_BASE : (import.meta.env.VITE_API_BASE_URL || RENDER_API_BASE);
export const SOCKET_URL = import.meta.env.DEV ? RENDER_SOCKET_URL : (import.meta.env.VITE_API_URL || RENDER_SOCKET_URL);




