import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import './Header.css';

function Header({ theme, onToggleTheme }) {
    const { user, logout } = useAuth();
    const { connected, reconnecting } = useWebSocket();

    return (
        <header className="messenger-header">
            <div className="header-left">
                <h1 className="app-title">3DCommu Messenger</h1>

                {/* WebSocket 연결 상태 표시 */}
                <div className="connection-status">
                    {reconnecting ? (
                        <span className="status-reconnecting">
                            <span className="status-dot"></span>
                            재연결 중...
                        </span>
                    ) : connected ? (
                        <span className="status-connected">
                            <span className="status-dot"></span>
                            연결됨
                        </span>
                    ) : (
                        <span className="status-disconnected">
                            <span className="status-dot"></span>
                            연결 끊김
                        </span>
                    )}
                </div>
            </div>

            <div className="header-right">
                <span className="user-name">{user?.username}</span>

                <button
                    className="theme-toggle"
                    onClick={onToggleTheme}
                    title={theme === 'light' ? '다크 모드' : '라이트 모드'}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <button className="logout-button" onClick={logout}>
                    로그아웃
                </button>
            </div>
        </header>
    );
}

export default Header;
