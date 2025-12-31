import api from './api';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_KEYS } from '../utils/constants';
import { ENDPOINTS } from '../utils/endpoints';
import { storageService } from './storageService';

class AuthService {
    /**
     * 로그인
     */
    async login(username, password, rememberMe = false) {
        try {
            // 새 로그인 전 이전 세션 정보 초기화
            await storageService.delete(STORAGE_KEYS.TOKEN);
            await storageService.delete(STORAGE_KEYS.USER);

            const response = await api.post('/api/auth/login', {
                email: username,  // 백엔드는 email 필드를 요구함
                password,
            });

            const { token, user } = response.data;

            // 토큰과 사용자 정보 저장 (storageService 사용)
            await storageService.set(STORAGE_KEYS.TOKEN, token);
            await storageService.set(STORAGE_KEYS.USER, user);
            await storageService.set(STORAGE_KEYS.REMEMBER_ME, rememberMe);

            return { success: true, user };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.message || '로그인에 실패했습니다',
            };
        }
    }

    /**
     * 로그아웃
     */
    async logout() {
        console.log('[AuthService] Logging out...');
        try {
            await storageService.delete(STORAGE_KEYS.TOKEN);
            await storageService.delete(STORAGE_KEYS.USER);
            await storageService.delete(STORAGE_KEYS.REMEMBER_ME);
            console.log('[AuthService] Storage cleared');
        } catch (error) {
            console.error('[AuthService] Error clearing storage:', error);
        }

        // 브라우저 환경에서 확실한 페이지 이동을 위해 assign 사용
        window.location.assign('/login');
    }

    /**
     * 저장된 JWT 토큰 가져오기
     */
    async getToken() {
        return await storageService.get(STORAGE_KEYS.TOKEN);
    }

    /**
     * 인증 상태 확인
     */
    async isAuthenticated() {
        const token = await this.getToken();
        if (!token) return false;

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            // 토큰 만료 확인
            if (decoded.exp < currentTime) {
                await this.logout();
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    /**
     * 현재 사용자 정보 가져오기 (JWT에서)
     */
    async getCurrentUser() {
        const token = await this.getToken();
        if (!token) return null;

        try {
            const decoded = jwtDecode(token);
            return {
                id: decoded.userId || decoded.sub,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role,
            };
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    /**
     * 내 기본 정보 조회 (식별 정보, 권한 등)
     */
    async getMyInfo() {
        try {
            const response = await api.get(ENDPOINTS.AUTH.ME);
            return response.data;
        } catch (error) {
            console.error('Error fetching my info:', error);
            throw error;
        }
    }

    /**
     * 상세 프로필 정보 가져오기
     */
    async fetchProfile(userId) {
        try {
            if (!userId) {
                const user = await this.getCurrentUser();
                userId = user?.id;
            }

            const url = userId ? ENDPOINTS.PROFILE.GET(userId) : ENDPOINTS.PROFILE.BASE;
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    }

    /**
     * 특정 유저의 온라인 접속 상태 확인
     */
    async checkActiveStatus(userId) {
        if (!userId) return false;
        try {
            const response = await api.get(ENDPOINTS.AUTH.IS_ACTIVE(userId));
            return response.data.isActive;
        } catch (error) {
            console.error(`Error checking status for ${userId}:`, error);
            return false;
        }
    }

    /**
     * 전체 온라인 유저 수 조회
     */
    async getOnlineCount() {
        try {
            const response = await api.get(ENDPOINTS.AUTH.ONLINE_COUNT);
            return response.data.count;
        } catch (error) {
            console.error('Error fetching online count:', error);
            return 0;
        }
    }
}

export const authService = new AuthService();
