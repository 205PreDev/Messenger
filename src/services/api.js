import axios from 'axios';
import { API_URL, STORAGE_KEYS } from '../utils/constants';
import { storageService } from './storageService';

// Axios 인스턴스 생성
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: JWT 토큰 추가
api.interceptors.request.use(
    async (config) => {
        // 로그인 요청에는 기존 토큰을 첨부하지 않음 (멀티 유저 간섭 방지)
        if (config.url && (config.url.endsWith('/login') || config.url.includes('/api/auth/login'))) {
            return config;
        }

        // storageService 사용하여 토큰 가져오기 (Electron/Browser 공통)
        const token = await storageService.get(STORAGE_KEYS.TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 401 오류 처리
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // 토큰 만료 또는 인증 실패 - 세션 비우기
            await storageService.delete(STORAGE_KEYS.TOKEN);
            await storageService.delete(STORAGE_KEYS.USER);

            // 로그인 페이지로 리다이렉트
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
