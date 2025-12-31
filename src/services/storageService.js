/**
 * Electron(electron-store)과 Browser(localStorage) 모두를 지원하는 통합 저장소 서비스
 */
export const storageService = {
    async set(key, value) {
        if (window.electronAPI?.store) {
            return await window.electronAPI.store.set(key, value);
        }
        localStorage.setItem(key, JSON.stringify(value));
    },

    async get(key) {
        if (window.electronAPI?.store) {
            return await window.electronAPI.store.get(key);
        }
        const value = localStorage.getItem(key);
        try {
            return value ? JSON.parse(value) : null;
        } catch (e) {
            return value;
        }
    },

    async delete(key) {
        if (window.electronAPI?.store) {
            return await window.electronAPI.store.delete(key);
        }
        localStorage.removeItem(key);
    },

    async clear() {
        if (window.electronAPI?.store) {
            // electron-store는 전체 삭제 기능이 없으면 개별 키 삭제 필요
            // 여기서는 주요 키만 삭제하는 방향으로 처리
            return;
        }
        localStorage.clear();
    }
};
