import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true
});

export const joinRoom = (room) => {
    if (socket.connected) {
        socket.emit('join_room', room);
    } else {
        socket.on('connect', () => {
            socket.emit('join_room', room);
        });
    }
};

export const subscribeToNotifications = (callback) => {
    socket.on('notification', callback);
    return () => socket.off('notification', callback);
};

export default socket;
