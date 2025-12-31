const { contextBridge, ipcRenderer } = require('electron');

// Electron API를 렌더러 프로세스에 안전하게 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 알림
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),

    // 윈도우 제어
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),

    // 시스템 트레이
    setTrayUnreadCount: (count) => ipcRenderer.send('set-tray-count', count),

    // 저장소
    store: {
        get: (key) => ipcRenderer.invoke('store-get', key),
        set: (key, value) => ipcRenderer.invoke('store-set', key, value),
        delete: (key) => ipcRenderer.invoke('store-delete', key),
    },
});
