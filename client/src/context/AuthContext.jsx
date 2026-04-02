import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../apiConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configure axios defaults
    axios.defaults.baseURL = API_BASE_URL;

    // Check if token exists on load
    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const res = await axios.get('/auth/me');
                    setUser(res.data);
                } catch (error) {
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const register = async (userData) => {
        try {
            const res = await axios.post('/auth/register', userData);
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            setUser(res.data);
            toast.success('Registration successful!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
            return false;
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            setUser(res.data);
            toast.success('Login successful!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        toast.success('Logged out successfully');
        window.location.href = '/';
    };

    const sendOTP = async (email) => {
        try {
            await axios.post('/auth/send-otp', { email });
            toast.success('OTP sent to your email');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, register, login, logout, sendOTP, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
