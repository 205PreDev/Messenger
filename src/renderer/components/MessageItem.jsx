import React from 'react';
import './MessageItem.css';

function MessageItem({ message, isOwn, showAvatar }) {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`message-item ${showAvatar ? 'has-avatar' : 'no-avatar'}`}>
            <div className="message-avatar">
                {showAvatar && (
                    <>
                        <img src={message.profileImageUrl} alt="" className="avatar-img" />
                    </>
                )}
            </div>

            <div className="message-content-wrapper">
                {showAvatar && (
                    <div className="message-header-info">
                        <span className="message-sender-name">
                            {message.senderName || '알 수 없음'}
                        </span>
                        <span className="message-time">
                            {formatTime(message.createdAt)}
                        </span>
                    </div>
                )}

                <div className="message-text">
                    {message.content}
                </div>
            </div>
        </div>
    );
}

export default MessageItem;

