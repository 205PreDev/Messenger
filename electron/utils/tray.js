import { app, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;
let mainWindow = null;

export function createTray(window) {
    mainWindow = window;

    // 트레이 아이콘 생성 (간단한 텍스트 아이콘)
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);

    updateTrayMenu(0);

    // 트레이 아이콘 클릭 시 윈도우 표시/숨김
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
            }
        }
    });

    return tray;
}

export function updateTrayMenu(unreadCount = 0) {
    if (!tray) return;

    const contextMenu = Menu.buildFromTemplate([
        {
            label: unreadCount > 0 ? `새 메시지 ${unreadCount}개` : '3D Community 메신저',
            enabled: false
        },
        { type: 'separator' },
        {
            label: '열기',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip(unreadCount > 0 ? `새 메시지 ${unreadCount}개` : '3D Community 메신저');
}

export function destroyTray() {
    if (tray) {
        tray.destroy();
        tray = null;
    }
}
