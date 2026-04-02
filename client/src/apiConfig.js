/**
 * Tactical Networking Config
 * Handles dynamic routing for both Vercel (Production) and Local (Development)
 */

// Use Render Production URL as Primary
const RENDER_API_BASE = 'https://event-management-9ft1.onrender.com/api';
const RENDER_SOCKET_URL = 'https://event-management-9ft1.onrender.com';

// Use environment variables (provided by Vercel) or fallback to Render
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || RENDER_API_BASE || '/api';

// For Socket.io (no /api suffix)
const localSocket = `http://${window.location.hostname}:5001`;
export const SOCKET_URL = import.meta.env.VITE_API_URL || RENDER_SOCKET_URL || localSocket;




