export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

export const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'current_user',
    REMEMBER_ME: 'remember_me',
};

export const WS_CHANNELS = {
    DM_TOPIC: (userId) => `/topic/dm/${userId}`,
    NOTIFICATIONS: '/user/queue/notifications',
    JOIN: '/app/player.join',
};
