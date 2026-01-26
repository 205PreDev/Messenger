import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
const SERVER_URL = 'http://localhost:8080';

// 기본 이미지 상수
const DEFAULT_PROFILE = '/resources/Profile/base-profile3.png';

export const getProfileUrl = (path) => {
    const relativePath = path || DEFAULT_PROFILE;
    return `${SERVER_URL}${relativePath}`;
};

// Axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 요청 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
            headers: config.headers
        });
        const token = localStorage.getItem('authToken');
        // 로그인/회원가입 요청 시에는 토큰을 보내지 않음 (만료된 토큰으로 인한 서버 에러 방지)
        const isAuthRequest = config.url.includes('/auth/login') || config.url.includes('/auth/register');
        if (token && !isAuthRequest) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 에러 처리
apiClient.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        const status = error.response?.status;
        const errorData = error.response?.data;

        // 401 Unauthorized 또는 500 내부에 JWT 만료 메시지가 있는 경우 처리
        if (status === 401 || (status === 500 && errorData?.message?.includes('JWT expired'))) {
            console.warn('[Session Expired] Logging out...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            // 로그인 페이지가 아닌 경우에만 리다이렉트
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// 인증 API
export const authAPI = {
    login: (email, password) =>
        apiClient.post('/auth/login', { email, password }),

    register: (userData) =>
        apiClient.post('/auth/register', userData),
};

// 채팅방 API
export const chatAPI = {
    // 대화방 목록 조회
    getRooms: () =>
        apiClient.get('/chat/rooms'),

    // 대화방 생성
    createRoom: (type, inviteUserIds, title = null) =>
        apiClient.post('/chat/rooms', { type, inviteUserIds, title }),

    // 메시지 내역 조회 (페이징)
    getMessages: (roomId, lastId = null, size = 50) =>
        apiClient.get(`/chat/rooms/${roomId}/messages`, {
            params: { lastId, size }
        }),

    // 메시지 전송
    sendMessage: (roomId, content) =>
        apiClient.post(`/chat/rooms/${roomId}/messages`, { content }),

    // 읽음 처리
    markAsRead: (roomId, lastMessageId) =>
        apiClient.patch(`/chat/rooms/${roomId}/read`, { lastMessageId }),

    // 사용자 초대
    inviteUsers: (roomId, userIds) =>
        apiClient.post(`/chat/rooms/${roomId}/invite`, { userIds }),

    // 방 나가기
    leaveRoom: (roomId) =>
        apiClient.delete(`/chat/rooms/${roomId}/leave`),

    // 방 제목 수정
    updateRoomTitle: (roomId, title) =>
        apiClient.patch(`/chat/rooms/${roomId}`, { title }),

    // 메시지 검색
    searchMessages: (roomId, keyword) =>
        apiClient.get(`/chat/rooms/${roomId}/search`, {
            params: { keyword }
        })
};

// 사용자 API
export const userAPI = {
    // 친구 목록 조회
    getFriends: () =>
        apiClient.get('/friends'),

    // 사용자 검색
    searchUsers: (query) =>
        apiClient.get('/friends/search', { params: { username: query } }),

    // 프로필 조회
    getProfile: (userId) =>
        apiClient.get(`/profile/${userId}`)
};

export default apiClient;
