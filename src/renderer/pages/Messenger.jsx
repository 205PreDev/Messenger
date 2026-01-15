import React, { useState, useEffect, useCallback } from 'react';
import RoomList from '../components/RoomList';
import FriendList from '../components/FriendList';
import ChatRoom from '../components/ChatRoom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { getProfileUrl, userAPI, chatAPI } from '../services/api'; // userAPI, chatAPI 추가
import './Messenger.css';

function Messenger() {
    const [view, setView] = useState('rooms'); // 'rooms' or 'friends'
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'dark'
    );

    // [최적화] 상태 끌어올리기 (Lifting State Up)
    const [friends, setFriends] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user, logout } = useAuth();
    const { connected, reconnecting, lastNotification } = useWebSocket();

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // 초기 및 변경되는 테마 적용
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // [최적화] 초기 데이터 병렬 로딩 (Parallel Fetching)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const [friendsRes, roomsRes] = await Promise.all([
                    userAPI.getFriends(),
                    chatAPI.getRooms()
                ]);
                setFriends(friendsRes.data);
                setRooms(roomsRes.data);
            } catch (error) {
                console.error('Failed to load initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadInitialData();
        }
    }, [user]);

    // [최적화] WebSocket 알림에 따른 데이터 갱신 (Centralized Update)
    useEffect(() => {
        if (!lastNotification) return;

        console.log('[Messenger] Notification received:', lastNotification.type);

        if (lastNotification.type === 'NEW_MESSAGE' || lastNotification.type === 'READ_UPDATE') {
            refreshRooms();
        }
        // 친구 상태 업데이트 처리 (다양한 타입 명칭 대응)
        else if (['FRIEND_STATUS', 'FRIEND_ONLINE', 'FRIEND_OFFLINE', 'USER_STATUS', 'FRIEND_UPDATE'].includes(lastNotification.type)) {
            refreshFriends();
        }
    }, [lastNotification]);

    const [messagesPromise, setMessagesPromise] = useState(null);

    const refreshFriends = async () => {
        try {
            const response = await userAPI.getFriends();
            setFriends(response.data);
        } catch (error) {
            console.error('Failed to refresh friends:', error);
        }
    };

    const refreshRooms = async () => {
        try {
            const response = await chatAPI.getRooms();
            setRooms(response.data);
        } catch (error) {
            console.error('Failed to refresh rooms:', error);
        }
    };

    // [최적화] 채팅방 선택 시 Prefetching 수행
    const handleSelectRoom = (room) => {
        if (!room) {
            setSelectedRoom(null);
            setMessagesPromise(null);
            return;
        }

        // 렌더링 전에 API 요청 시작 (Parallel Fetching)
        const promise = chatAPI.getMessages(room.id);
        setMessagesPromise(promise);

        setSelectedRoom(room);
        setView('rooms');
    };

    const handleStartChat = (room) => {
        handleSelectRoom(room);
        // 새 대화방이 생겼을 수 있으므로 목록 갱신
        refreshRooms();
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
                    {/* [최적화] Display Toggling 방식으로 변경 (언마운트 방지) */}
                    <div style={{ display: view === 'rooms' ? 'block' : 'none', height: '100%' }}>
                        <RoomList
                            rooms={rooms}
                            loading={loading}
                            selectedRoom={selectedRoom}
                            onSelectRoom={handleSelectRoom}
                            onAddNewChat={() => setView('friends')}
                            onRoomsUpdate={setRooms} // Optimistic update용
                            refreshRooms={refreshRooms} // 실패 시 복구용
                        />
                    </div>
                    <div style={{ display: view === 'friends' ? 'block' : 'none', height: '100%' }}>
                        <FriendList
                            friends={friends}
                            loading={loading}
                            onStartChat={handleStartChat}
                        />
                    </div>
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
                        messagesPromise={messagesPromise}
                        onClose={() => handleSelectRoom(null)}
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
