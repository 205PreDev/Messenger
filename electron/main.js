const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;

// GPU 가속 비활성화 (오류 방지)
app.disableHardwareAcceleration();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: false, // 프레임 제거
        autoHideMenuBar: true, // 메뉴 바 숨김
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../assets/icon.png')
    });

    // 메뉴 바 설정 (단축키 활성화를 위해 null 대신 최소 메뉴 설정)
    const template = [
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
                { role: 'cut' }, { role: 'copy' }, { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // ... (existing dev server loading logic)

    // IPC 핸들러: 창 제어
    ipcMain.on('window-minimize', () => {
        if (mainWindow) mainWindow.minimize();
    });

    ipcMain.on('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.on('window-close', () => {
        if (mainWindow) mainWindow.close();
    });

    // 개발 모드: webpack dev server 로드
    // 프로덕션: 빌드된 파일 로드
    // 'electron .' 명령어로 실행 시 dist 파일이 아닌 것으로 간주될 수 있으므로
    // --dev 인자를 확인하거나 NODE_ENV를 확인합니다.
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    // 개발 서버 포트가 3001이라고 가정
    const startUrl = isDev
        ? 'http://localhost:3001'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    console.log('Loading URL:', startUrl);
    mainWindow.loadURL(startUrl);

    // 개발자 도구 (개발 모드에서만)
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // 창 닫기 이벤트
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    // 시스템 트레이 아이콘 생성
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath);

    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '메신저 열기',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: '종료',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('3DCommu Messenger');
    tray.setContextMenu(contextMenu);

    // 트레이 아이콘 클릭 시 창 표시
    tray.on('click', () => {
        mainWindow.show();
    });
}

// 앱 준비 완료
app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 모든 창이 닫혔을 때
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC 핸들러: 데스크톱 알림
ipcMain.on('show-notification', (event, { title, body }) => {
    if (Notification.isSupported()) {
        new Notification({
            title: title,
            body: body,
            icon: path.join(__dirname, '../assets/icon.png')
        }).show();
    }
});

// IPC 핸들러: 읽지 않은 메시지 뱃지
ipcMain.on('update-badge', (event, count) => {
    if (process.platform === 'darwin') {
        app.dock.setBadge(count > 0 ? count.toString() : '');
    } else if (process.platform === 'win32') {
        // Windows: 오버레이 아이콘으로 표시
        if (count > 0) {
            // 간단한 뱃지 이미지 생성 (실제로는 이미지 파일 사용 권장)
            mainWindow.setOverlayIcon(
                path.join(__dirname, '../assets/badge.png'),
                `${count} 개의 읽지 않은 메시지`
            );
        } else {
            mainWindow.setOverlayIcon(null, '');
        }
    }
});

// 전역 단축키 등록 (선택사항)
app.on('ready', () => {
    const { globalShortcut } = require('electron');

    // Ctrl+Shift+M: 메신저 창 토글
    globalShortcut.register('CommandOrControl+Shift+M', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
});

app.on('will-quit', () => {
    const { globalShortcut } = require('electron');
    globalShortcut.unregisterAll();
});
