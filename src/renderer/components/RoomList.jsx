import React, { useState, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import './RoomList.css';

function RoomList({ selectedRoom, onSelectRoom, onAddNewChat }) {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { lastNotification } = useWebSocket(); // WebSocket 컨텍스트 사용

    useEffect(() => {
        loadRooms();
    }, []); // 초기 로딩

    useEffect(() => {
        if (lastNotification?.type === 'NEW_MESSAGE' || lastNotification?.type === 'READ_UPDATE') {
            loadRooms();
        }
    }, [lastNotification]); // 알림이 오면 목록 갱신

    const loadRooms = async () => {
        try {
            const response = await chatAPI.getRooms();
            setRooms(response.data);
        } catch (error) {
            console.error('Failed to load rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRooms = rooms.filter(room =>
        (room.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // 오늘
        if (diff < 86400000) {
            return date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        // 어제
        if (diff < 172800000) {
            return '어제';
        }

        // 그 외
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    };

    const handleLeaveRoom = async (e, roomId) => {
        e.stopPropagation();
        if (!window.confirm('채팅방을 나가시겠습니까? 대화 내용이 삭제됩니다.')) return;

        // [Optimistic Update] 1. UI에서 먼저 지워서 즉각 반응 보여주기
        setRooms(prev => prev.filter(r => r.id !== roomId));
        if (selectedRoom?.id === roomId) {
            onSelectRoom(null);
        }

        try {
            // 2. 백엔드에 실제 요청 (사용자는 이미 지워진 걸 보고 있음)
            await chatAPI.leaveRoom(roomId);
        } catch (error) {
            console.error('Failed to leave room:', error);
            alert('채팅방 나가기 실패');
            loadRooms(); // 실패 시 목록 복구
        }
    };

    return (
        <div className="room-list-container">
            <div className="room-list-header">
                <h2>대화</h2>
                <button
                    className="new-chat-button"
                    title="새 대화"
                    onClick={onAddNewChat}
                >
                    ➕
                </button>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="대화 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="room-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>대화방 로딩 중...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="empty-state">
                        <p>대화가 없습니다</p>
                        <button className="start-chat-button" onClick={onAddNewChat}>
                            새 대화 시작하기
                        </button>
                    </div>
                ) : (
                    filteredRooms.map(room => (
                        <div
                            key={room.id}
                            className={`room-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                            onClick={() => onSelectRoom(room)}
                        >
                            <div className="room-avatar">
                                {room.type === 'GROUP' ? '👥' : '👤'}
                            </div>

                            <div className="room-info">
                                <div className="room-header">
                                    <h3 className="room-title text-ellipsis">
                                        {room.title || '대화방'}
                                    </h3>
                                    <span className="room-time">
                                        {formatTime(room.updatedAt)}
                                    </span>
                                </div>

                                <div className="room-footer">
                                    <p className="room-last-message text-ellipsis">
                                        {room.lastMessage || '메시지가 없습니다'}
                                    </p>
                                    <div className="room-actions">
                                        {room.unreadCount > 0 && (
                                            <span className="unread-badge">
                                                {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                            </span>
                                        )}
                                        <button
                                            className="leave-room-btn"
                                            onClick={(e) => handleLeaveRoom(e, room.id)}
                                            title="나가기"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default RoomList;
