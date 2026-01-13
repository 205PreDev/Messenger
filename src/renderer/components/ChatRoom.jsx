import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, getProfileUrl } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import MessageItem from './MessageItem';
import './ChatRoom.css';

function ChatRoom({ room, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const isTypingSentRef = useRef(false);
    const { subscribeToRoom, unsubscribeFromRoom, sendTypingIndicator, connected } = useWebSocket();
    const { user } = useAuth();

    useEffect(() => {
        loadMessages();
        isTypingSentRef.current = false; // 방 변경 시 타이핑 상태 초기화

        // WebSocket 연결 상태가 true일 때만 구독 시도
        if (connected) {
            console.log(`[ChatRoom] Subscribing to room ${room.id}`);
            const subscription = subscribeToRoom(room.id, handleNewMessage);
            return () => {
                unsubscribeFromRoom(room.id);
            };
        }
    }, [room.id, connected]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const loadMessages = async () => {
        try {
            const response = await chatAPI.getMessages(room.id);

            // 읽음 처리 (response.data[0]이 가장 최신 메시지임 - DESC 정렬)
            if (response.data.length > 0) {
                const latestMessage = response.data[0];
                await chatAPI.markAsRead(room.id, latestMessage.id);
            }

            // UI 표시를 위해 역순(과거->현재)으로 정렬
            setMessages([...response.data].reverse());
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        console.log('[ChatRoom] WebSocket 수신 원본:', message);

        // 타이핑 인디케이터 처리 (메시지 타입이 TYPING이거나 데이터에 isTyping 필드가 있는 경우)
        if (message.type === 'TYPING' || (message.data && message.data.isTyping !== undefined) || message.isTyping !== undefined) {
            const typingData = message.type === 'TYPING' ? message.data : (message.data || message);
            handleTypingIndicator(typingData);
            return;
        }

        // 일반 메시지 처리
        if (!message.type || message.type === 'MESSAGE') {
            const rawData = message.type === 'MESSAGE' ? message.data : message;

            // 데이터 필드 보정 (서버마다 content/message, senderName/username 등 다를 수 있음)
            // 프로필 경로 추출 및 절대 URL 변환
            const profilePath = rawData.selectedProfile?.imagePath || rawData.selectedProfile || rawData.profileImage;

            const normalizedMessage = {
                ...rawData,
                id: rawData.id,
                content: rawData.content || rawData.message,
                senderName: rawData.senderName || rawData.username,
                createdAt: rawData.createdAt || rawData.timestamp,
                senderId: rawData.senderId ? rawData.senderId.toString() : (rawData.userId ? rawData.userId.toString() : null),
                profileImageUrl: getProfileUrl(profilePath)
            };

            if (normalizedMessage.id || normalizedMessage.content) {
                console.log('[ChatRoom] 보정된 메시지 데이터:', normalizedMessage);

                setMessages(prev => {
                    if (prev.some(m => m.id === normalizedMessage.id)) return prev;
                    return [...prev, normalizedMessage];
                });

                if (normalizedMessage.senderId?.toString() !== user.id?.toString()) {
                    chatAPI.markAsRead(room.id, normalizedMessage.id);
                }
            }
        }
    };

    const handleTypingIndicator = (data) => {
        // data.userId와 user.id 모두 문자열로 변환하여 비교 (타입 불일치 방지)
        const typingUserId = String(data.userId);
        const currentUserId = String(user.id);

        console.log(`[ChatRoom] 타이핑 이벤트 처리 - 대상: ${typingUserId}, 상태: ${data.isTyping}`);

        if (typingUserId === currentUserId) return;

        if (data.isTyping) {
            setTypingUsers(prev => {
                const prevStrings = prev.map(id => String(id));
                if (!prevStrings.includes(typingUserId)) {
                    return [...prevStrings, typingUserId];
                }
                return prevStrings;
            });
        } else {
            setTypingUsers(prev => prev.map(id => String(id)).filter(id => id !== typingUserId));
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // [Optimized] 상태가 변할 때만 신호 전송 (네트워크 자원 절약)
        const hasText = newValue.length > 0;
        if (hasText && !isTypingSentRef.current) {
            sendTypingIndicator(room.id, true);
            isTypingSentRef.current = true;
        } else if (!hasText && isTypingSentRef.current) {
            sendTypingIndicator(room.id, false);
            isTypingSentRef.current = false;
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        const content = inputValue.trim();
        if (!content || content.length > 5000) {
            return;
        }

        console.log(`[ChatRoom] 메시지 전송 시도 - 방 ID: ${room.id}, 내용: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''}`);

        setSending(true);
        setInputValue('');

        // 메시지 전송 시 타이핑 상태 즉시 해제
        if (isTypingSentRef.current) {
            sendTypingIndicator(room.id, false);
            isTypingSentRef.current = false;
        }

        try {
            const response = await chatAPI.sendMessage(room.id, content);
            console.log('[ChatRoom] 메시지 전송 성공:', response.data);
        } catch (error) {
            console.error('[ChatRoom] 메시지 전송 실패:', error);
            // 전송 실패 시 입력값 복원
            setInputValue(content);
            alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="chat-room-container">
            <div className="chat-room-header">
                <div className="chat-room-info">
                    <span className="room-icon-discord">#</span>
                    <h2>{room.title || '대화방'}</h2>
                    <span className="room-type-badge">
                        {room.type === 'GROUP' ? '그룹' : 'DM'}
                    </span>
                </div>

                <button className="close-button" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="messages-container">
                {loading ? (
                    <div className="loading-messages">
                        <div className="spinner"></div>
                        <p>메시지 로딩 중...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-messages">
                        <p>메시지가 없습니다</p>
                        <p>첫 메시지를 보내보세요!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <MessageItem
                                key={message.id}
                                message={message}
                                isOwn={message.senderId === user.id}
                                showAvatar={
                                    index === 0 ||
                                    messages[index - 1].senderId !== message.senderId
                                }
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {typingUsers.length > 0 && (
                <div className="typing-indicator-wrapper">
                    <div className="typing-indicator">
                        <span className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                        <span className="typing-text">
                            {typingUsers.length === 1 ? '누군가 입력 중...' : `${typingUsers.length}명이 입력 중...`}
                        </span>
                    </div>
                </div>
            )}

            <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="메시지를 입력하세요..."
                    disabled={sending}
                    maxLength={5000}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || sending}
                >
                    {sending ? '전송 중...' : '전송'}
                </button>
            </form>
        </div>
    );
}

export default ChatRoom;
