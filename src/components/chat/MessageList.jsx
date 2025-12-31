import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { formatMessageDate } from '../../utils/dateFormatter';
import { ko } from '../../i18n/ko';
import './MessageList.css';

function MessageList({ messages, isLoading, currentUserId, friend, me }) {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="message-list">
                <div className="message-list-loading">
                    <div className="loading-spinner"></div>
                    <p>{ko.common.loading}</p>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="message-list">
                <div className="message-list-empty">
                    <p>{ko.chat.noMessages}</p>
                </div>
            </div>
        );
    }

    // 날짜별로 메시지 그룹화
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatMessageDate(message.createdAt);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    return (
        <div className="message-list">
            <div className="message-list-content">
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date} className="message-group">
                        <div className="date-divider">
                            <span>{date}</span>
                        </div>
                        {dateMessages.map((message, idx) => (
                            <MessageBubble
                                key={message.id || `msg-${idx}`}
                                message={message}
                                isSent={message.senderId === currentUserId}
                                sender={message.senderId === currentUserId ? me : friend}
                            />
                        ))}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}

export default MessageList;
