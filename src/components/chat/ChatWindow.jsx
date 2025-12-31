import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { messageService } from '../../services/messageService';
import { authService } from '../../services/authService';
import { ko } from '../../i18n/ko';
import './ChatWindow.css';

function ChatWindow({ selectedFriend, receivedMessage, profile }) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const currentUserId = profile?.id; // profile에서 직접 숫자 ID 참조


    useEffect(() => {
        if (selectedFriend) {
            console.log('ChatWindow - selectedFriend:', selectedFriend);
            loadMessages();
        } else {
            setMessages([]);
        }
    }, [selectedFriend]);

    // 실시간 메시지 수신 처리
    // 실시간 메시지 수신 처리
    useEffect(() => {
        if (!receivedMessage || !selectedFriend) return;

        console.log('ChatWindow - Processing received message:', receivedMessage);

        // ID 비교를 위해 문자열로 변환하여 안전하게 비교
        const isRelated =
            String(receivedMessage.senderId) === String(selectedFriend.id) ||
            String(receivedMessage.receiverId) === String(selectedFriend.id);

        if (isRelated) {
            console.log('ChatWindow - Message is related to active chat. Appending...');
            setMessages(prev => {
                // 중복 방지 (이미 전송한 메시지일 수 있음)
                if (prev.some(m => String(m.id) === String(receivedMessage.id))) {
                    console.log('ChatWindow - Duplicate message ignored:', receivedMessage.id);
                    return prev;
                }
                return [...prev, receivedMessage];
            });
        }
    }, [receivedMessage, selectedFriend]);

    const loadMessages = async () => {
        if (!selectedFriend || selectedFriend.id === undefined || selectedFriend.id === null) {
            console.warn('ChatWindow - Cannot load messages: selectedFriend.id is missing', selectedFriend);
            return;
        }

        setIsLoading(true);
        try {
            const data = await messageService.getMessages(selectedFriend.id);
            setMessages(data);

            // 메시지 읽음 처리
            await messageService.markAsRead(selectedFriend.id);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (content) => {
        if (!selectedFriend || !content.trim()) return;

        // 낙관적 UI 업데이트: 서버 응답 전 화면에 즉시 표시
        const tempId = Date.now();
        const optimisticMessage = {
            id: tempId,
            senderId: currentUserId,
            receiverId: selectedFriend.id,
            content: content.trim(),
            createdAt: new Date().toISOString(),
            isRead: true,
            status: 'sending' // 전송 중 상태 표시 가능
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const result = await messageService.sendMessage(selectedFriend.id, content);
            const actualMessage = result.data || result; // data 필드가 있으면 사용, 없으면 전체 반환값 사용

            // 실제 데이터로 교체 (서버에서 생성된 ID 등 반영)
            setMessages(prev => prev.map(m => m.id === tempId ? { ...actualMessage, status: 'sent' } : m));
        } catch (error) {
            console.error('Error sending message:', error);
            // 실패 시 최신 메시지 제거 또는 에러 상태 표시
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            alert('메시지 전송에 실패했습니다.');
        }
    };

    if (!selectedFriend) {
        return (
            <div className="chat-window-empty">
                <div className="empty-state-content">
                    <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>{ko.chat.selectFriend}</p>
                </div>
            </div>
        );
    }

    const nickname = selectedFriend.username || '알 수 없음';

    return (
        <div className="chat-window">
            <div className="chat-header">
                <div className="chat-friend-info">
                    <div className="chat-friend-avatar">
                        {selectedFriend.selectedProfile?.imagePath ? (
                            <img src={selectedFriend.selectedProfile.imagePath} alt={nickname} />
                        ) : (
                            <div className="avatar-placeholder">
                                {nickname[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="chat-friend-name">{nickname}</div>
                        <div className={`chat-friend-status ${selectedFriend.isOnline ? 'online' : 'offline'}`}>
                            {selectedFriend.isOnline ? ko.friends.online : ko.friends.offline}
                        </div>
                    </div>
                </div>
            </div>

            <MessageList
                messages={messages}
                isLoading={isLoading}
                currentUserId={currentUserId}
                friend={selectedFriend}
                me={profile}
            />

            <MessageInput onSendMessage={handleSendMessage} />
        </div>
    );
}

export default ChatWindow;
