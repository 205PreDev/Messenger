import React, { useState, useEffect } from 'react';
import { userAPI, chatAPI, getProfileUrl } from '../services/api';
import './FriendList.css';

function FriendList({ onSelectFriend, onStartChat }) {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [creatingChat, setCreatingChat] = useState(false);

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        try {
            const response = await userAPI.getFriends();
            setFriends(response.data);
        } catch (error) {
            console.error('Failed to load friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = friends.filter(friend =>
        friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFriendClick = async (friend) => {
        if (creatingChat) return;

        try {
            setCreatingChat(true);
            // 1:1 채팅방 생성 또는 기존 방 조회
            const response = await chatAPI.createRoom('DM', [friend.userId]);
            onStartChat(response.data);
        } catch (error) {
            console.error('Failed to start chat:', error);
            alert('채팅을 시작할 수 없습니다.');
        } finally {
            setCreatingChat(false);
        }
    };

    return (
        <div className="friend-list-container">
            <div className="search-box">
                <input
                    type="text"
                    placeholder="친구 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="friend-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>친구 로딩 중...</p>
                    </div>
                ) : filteredFriends.length === 0 ? (
                    <div className="empty-state">
                        <p>{searchQuery ? '검색 결과가 없습니다' : '친구가 없습니다'}</p>
                    </div>
                ) : (
                    filteredFriends.map(friend => (
                        <div
                            key={friend.userId}
                            className={`friend-item ${creatingChat ? 'disabled' : ''}`}
                            onClick={() => handleFriendClick(friend)}
                            style={{ cursor: creatingChat ? 'wait' : 'pointer', opacity: creatingChat ? 0.7 : 1 }}
                        >
                            <div className="friend-avatar">
                                <img
                                    src={getProfileUrl(friend.profileImagePath || friend.selectedProfile?.imagePath || friend.selectedProfile)}
                                    alt=""
                                    className="avatar-img"
                                />
                                {friend.online !== undefined && (
                                    <span className={`status-indicator ${friend.online ? 'online' : 'offline'}`}></span>
                                )}
                            </div>
                            <div className="friend-info">
                                <div className="friend-header">
                                    <h3 className="friend-name">{friend.username}</h3>
                                    {friend.online !== undefined && (
                                        <span className={`status-text ${friend.online ? 'online' : 'offline'}`}>
                                            {friend.online ? '온라인' : '오프라인'}
                                        </span>
                                    )}
                                </div>
                                <p className="friend-status-msg text-ellipsis">
                                    {friend.statusMessage || '상태 메시지가 없습니다'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default FriendList;
