import React, { useState } from 'react';
import { chatAPI, getProfileUrl } from '../services/api';
// useWebSocket 제거 (상위 컴포넌트에서 관리)
import './RoomList.css';

// [최적화] Props로 데이터 및 핸들러 수신 (Stateless Component)
function RoomList({ selectedRoom, onSelectRoom, onAddNewChat, rooms, loading, onRoomsUpdate, refreshRooms }) {
    const [searchQuery, setSearchQuery] = useState('');

    // 내부 loadRooms 로직 제거됨 (상위 컴포넌트로 위임)

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

        // [Optimistic Update] 1. 상위 상태 업데이트
        onRoomsUpdate(prev => prev.filter(r => r.id !== roomId));

        if (selectedRoom?.id === roomId) {
            onSelectRoom(null);
        }

        try {
            // 2. 백엔드에 실제 요청
            await chatAPI.leaveRoom(roomId);
        } catch (error) {
            console.error('Failed to leave room:', error);
            alert('채팅방 나가기 실패');
            refreshRooms(); // 실패 시 목록 복구
        }
    };

    return (
        <div className="room-list-container">
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
                                <img
                                    src={getProfileUrl(room.profileImagePath || room.selectedProfile?.imagePath || room.selectedProfile)}
                                    alt=""
                                    className="avatar-img"
                                />
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
