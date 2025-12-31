import React from 'react';
import { ko } from '../../i18n/ko';
import './FriendItem.css';

function FriendItem({ friendship, isSelected, onClick }) {
    const friend = friendship.friend;
    const nickname = friend?.username || friend?.nickname || '알 수 없음';
    const avatarUrl = friend?.selectedProfile?.imagePath;

    const isOnline = friendship.isOnline;

    return (
        <div
            className={`friend-item ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="friend-avatar-container">
                <div className="friend-avatar">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={nickname} />
                    ) : (
                        <div className="avatar-placeholder">
                            {nickname[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`} />
            </div>

            <div className="friend-info">
                <div className="friend-name">{nickname}</div>
                <div className="friend-status">
                    {isOnline ? ko.friends.online : ko.friends.offline}
                </div>
            </div>

            {/* TODO: 읽지 않은 메시지 개수 표시 */}
            {/* <div className="unread-badge">3</div> */}
        </div>
    );
}

export default FriendItem;
