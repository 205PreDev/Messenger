import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import { createTray, updateTrayMenu, destroyTray } from './utils/tray.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();

let mainWindow;
let tray;
let isQuitting = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, '../public/icon.png'),
    });

    // 개발 모드에서는 Vite 서버에서 로드, 프로덕션에서는 빌드된 파일 로드
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // 시스템 트레이 생성
    tray = createTray(mainWindow);

    // 윈도우 닫기 버튼 클릭 시 트레이로 최소화
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // macOS가 아닌 경우에도 트레이에서 실행 유지
    // 사용자가 명시적으로 종료할 때까지 실행
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('will-quit', () => {
    destroyTray();
});

// IPC 핸들러: 알림 표시
ipcMain.handle('show-notification', (event, title, body) => {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title,
            body,
        });
        notification.show();

        notification.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            }
        });
    }
});

// IPC 핸들러: 윈도우 제어
ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
});

// IPC 핸들러: electron-store
ipcMain.handle('store-get', (event, key) => {
    return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
    store.set(key, value);
});

ipcMain.handle('store-delete', (event, key) => {
    store.delete(key);
});

// IPC 핸들러: 트레이 읽지 않은 개수 설정
ipcMain.on('set-tray-count', (event, count) => {
    updateTrayMenu(count);
});
