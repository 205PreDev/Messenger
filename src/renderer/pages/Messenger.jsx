import React, { useState, useEffect } from 'react';
import RoomList from '../components/RoomList';
import FriendList from '../components/FriendList';
import ChatRoom from '../components/ChatRoom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { getProfileUrl } from '../services/api';
import './Messenger.css';

function Messenger() {
    const [view, setView] = useState('rooms'); // 'rooms' or 'friends'
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'dark'
    );
    const { user, logout } = useAuth();
    const { connected, reconnecting } = useWebSocket();

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // 초기 및 변경되는 테마 적용
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleStartChat = (room) => {
        setSelectedRoom(room);
        setView('rooms');
    };

    return (
        <div className="messenger-container" data-theme={theme}>
            {/* 1. Leftmost Navigation Sidebar (Icons + Theme) */}
            <nav className="side-navigation">
                <div className="nav-group top">
                    <button
                        className={`nav-item ${view === 'friends' ? 'active' : ''}`}
                        onClick={() => setView('friends')}
                        title="친구"
                    >
                        👤
                    </button>
                    <button
                        className={`nav-item ${view === 'rooms' ? 'active' : ''}`}
                        onClick={() => setView('rooms')}
                        title="대화"
                    >
                        💬
                    </button>
                </div>

                <div className="nav-group bottom">
                    <button
                        className="nav-item util-item"
                        onClick={toggleTheme}
                        title={theme === 'light' ? '다크 모드' : '라이트 모드'}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                </div>
            </nav>

            {/* 2. Middle Content Sidebar (App Info + List + User Panel) */}
            <div className="messenger-sidebar">
                <header className="sidebar-header">
                    <h1 className="app-title">3DCommu</h1>
                    <div className="connection-status">
                        <span className={`status-dot ${reconnecting ? 'status-reconnecting' : connected ? 'status-connected' : 'status-disconnected'}`}
                            title={reconnecting ? '재연결 중' : connected ? '연결됨' : '오프라인'}></span>
                    </div>
                </header>

                <div className="sidebar-list-area">
                    {view === 'rooms' ? (
                        <RoomList
                            selectedRoom={selectedRoom}
                            onSelectRoom={setSelectedRoom}
                            onAddNewChat={() => setView('friends')}
                        />
                    ) : (
                        <FriendList
                            onStartChat={handleStartChat}
                        />
                    )}
                </div>

                <footer className="user-panel">
                    <div className="user-info">
                        <div className="user-avatar-small">
                            <img
                                src={getProfileUrl(user?.selectedProfile?.imagePath || user?.selectedProfile)}
                                alt=""
                                className="avatar-img"
                            />
                        </div>
                        <div className="user-text">
                            <span className="user-name-label">{user?.username}</span>
                            <span className="user-status-label">Online</span>
                        </div>
                    </div>
                    <button className="logout-btn-small" onClick={logout} title="로그아웃">
                        ✕
                    </button>
                </footer>
            </div>

            {/* 3. Main Chat Area */}
            <main className="chat-area">
                {selectedRoom ? (
                    <ChatRoom
                        room={selectedRoom}
                        onClose={() => setSelectedRoom(null)}
                    />
                ) : (
                    <div className="no-chat-selected">
                        <div className="no-chat-icon">💬</div>
                        <h2>대화를 시작하세요</h2>
                        <p>대화방을 선택하거나 친구 목록에서 새로운 대화를 시작하세요.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Messenger;
