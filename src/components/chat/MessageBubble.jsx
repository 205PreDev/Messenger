import React from 'react';
import { formatMessageTime } from '../../utils/dateFormatter';
import './MessageBubble.css';

function MessageBubble({ message, isSent, sender }) {
    const avatarUrl = sender?.selectedProfile?.imagePath;
    const initial = sender?.username?.[0]?.toUpperCase() || '?';
    const isSystem = message.senderId === 'system';

    return (
        <div className={`message-row ${isSent ? 'sent' : 'received'} ${isSystem ? 'system' : ''}`}>
            {!isSystem && (
                <div className="message-avatar-col">
                    <div className="message-avatar">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={sender.username} />
                        ) : (
                            <div className="avatar-placeholder">{initial}</div>
                        )}
                    </div>
                </div>
            )}

            <div className="message-content-col">
                {!isSystem && (
                    <div className="message-header">
                        <span className="message-username" style={{ color: isSent ? 'var(--pastel-blue)' : 'var(--pastel-green)' }}>
                            {sender?.username || 'Unknown'}
                        </span>
                        <span className="message-timestamp">
                            {formatMessageTime(message.createdAt)}
                        </span>
                    </div>
                )}

                <div className="message-text">
                    {message.content}
                    {isSystem && <span className="message-timestamp system-time">{formatMessageTime(message.createdAt)}</span>}
                </div>
            </div>
        </div>
    );
}

export default MessageBubble;
