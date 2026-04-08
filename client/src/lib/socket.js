import { io } from 'socket.io-client';
import { SOCKET_URL } from '../apiConfig';

export const socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
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
