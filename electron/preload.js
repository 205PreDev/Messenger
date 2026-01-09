const { contextBridge, ipcRenderer } = require('electron');

// Renderer 프로세스에서 안전하게 사용할 수 있는 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 데스크톱 알림 표시
    showNotification: (title, body) => {
        ipcRenderer.send('show-notification', { title, body });
    },

    // 읽지 않은 메시지 뱃지 업데이트
    updateBadge: (count) => {
        ipcRenderer.send('update-badge', count);
    },

    // 창 제어
    windowControl: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close')
    }
});
