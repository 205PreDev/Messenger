import { API_URL } from './constants';

/**
 * 백엔드 API 엔드포인트 모음
 */
export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        ME: '/api/auth/me',
        IS_ACTIVE: (userId) => `/api/auth/is-active/${userId}`,
        ONLINE_COUNT: '/api/auth/online-count',
    },
    PROFILE: {
        BASE: '/api/profile',
        GET: (userId) => `/api/profile/${userId}`,
        UPDATE: '/api/profile',
    },
    FRIENDS: {
        LIST: '/api/friends',
        SEARCH: (query) => `/api/friends/search?username=${query}`,
        REQUEST: '/api/friends/request',
        ACCEPT: (id) => `/api/friends/accept/${id}`,
        REJECT: (id) => `/api/friends/reject/${id}`,
        DELETE: (id) => `/api/friends/${id}`,
    },
    MESSAGES: {
        CONVERSATIONS: '/api/messages/conversations',
        HISTORY: (friendId) => `/api/messages/dm/${friendId}`,
        SEND: '/api/messages/dm',
        MARK_READ: (friendId) => `/api/messages/mark-read/${friendId}`,
        UNREAD_COUNT: '/api/messages/unread-count',
    }
};

/**
 * 리소스(이미지 등)의 전체 URL을 생성
 * @param {string|object} data - 서버에서 내려준 상대 경로 또는 객체
 * @returns {string} - 전체 주소
 */
export const getResourceUrl = (data) => {
    if (!data) return null;

    let path = typeof data === 'string' ? data : (data.imagePath || data.profileImagePath || data.outlineImagePath);

    if (!path || typeof path !== 'string') return null;
    if (path.startsWith('http')) return path;

    let cleanPath = path;
    // '/resources/' 가 누락된 경우에 대한 보정
    if (!cleanPath.includes('resources/')) {
        if (cleanPath.startsWith('Profile/') || cleanPath.startsWith('Outline/') ||
            cleanPath.startsWith('/Profile/') || cleanPath.startsWith('/Outline/')) {
            cleanPath = `/resources/${cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath}`;
        }
    }

    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${API_URL}${finalPath}`;
};
