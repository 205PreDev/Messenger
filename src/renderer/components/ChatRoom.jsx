import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, getProfileUrl } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import MessageItem from './MessageItem';
import './ChatRoom.css';

function ChatRoom({ room, messagesPromise, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);

    // [무한 스크롤] 상태 추가
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const messagesEndRef = useRef(null);
    const chatAreaRef = useRef(null); // 스크롤 영역 ref 추가
    const isTypingSentRef = useRef(false);
    const lastTypingSentTimeRef = useRef(0); // [Heartbeat] 마지막 전송 시간
    const prevScrollHeightRef = useRef(0); // 스크롤 복원용 height 저장

    const { subscribeToRoom, unsubscribeFromRoom, sendTypingIndicator, connected } = useWebSocket();
    const { user } = useAuth();

    // [Typing Timeout] 타임아웃 체크 (5초)
    useEffect(() => {
        const interval = setInterval(() => {
            setTypingUsers(prev => {
                const now = Date.now();
                return prev.filter(u => {
                    const lastActive = u.lastActive || now;
                    return now - lastActive < 5000; // 5초 이상 신호 없으면 제거
                });
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadMessages();
        isTypingSentRef.current = false;
        setHasMore(true); // 방 변경 시 초기화

        // WebSocket 연결 상태가 true일 때만 구독 시도
        if (connected) {
            console.log(`[ChatRoom] Subscribing to room ${room.id} `);
            const subscription = subscribeToRoom(room.id, handleNewMessage);
            return () => {
                unsubscribeFromRoom(room.id);
            };
        }
    }, [room.id, connected, messagesPromise]);

    // [무한 스크롤] 메시지가 추가되었을 때 스크롤 위치 복원 (과거 메시지 로딩 시)
    useEffect(() => {
        if (isLoadingMore && chatAreaRef.current) {
            const newScrollHeight = chatAreaRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            chatAreaRef.current.scrollTop = diff;
            setIsLoadingMore(false); // 로딩 상태 해제
        } else if (!isLoadingMore && !loading) {
            // 일반적인 새 메시지 수신 or 초기 로딩 시에는 바닥으로 (사용자가 바닥 근처에 있을 때만 하는게 좋지만 일단 단순화)
            scrollToBottom();
        }
    }, [messages]);

    // [Helper] 메시지 데이터 정규화 (프로필 URL 등)
    const normalizeMessage = (msg) => {
        const rawData = msg.type === 'MESSAGE' ? msg.data : msg;
        const senderIdStr = rawData.senderId ? rawData.senderId.toString() : (rawData.userId ? rawData.userId.toString() : null);

        // 닉네임 우선순위:
        // 1. 데이터 자체의 nickname / senderNickname
        // 2. 방 참여자 목록(room.users)에서 닉네임 검색
        // 3. (DM인 경우) 상대방이면 room.title (보통 닉네임으로 설정됨)
        // 4. 본인인 경우 AuthContext의 정보
        // 5. 최종 폴백 (senderName/username)

        let displayName = rawData.nickname || rawData.senderNickname;

        // 방 참여자 정보에서 검색
        if (!displayName && room.users && Array.isArray(room.users)) {
            const foundUser = room.users.find(u => String(u.id) === senderIdStr);
            if (foundUser) {
                // nickname 필드가 있다면 최우선, 아니면 username/name
                displayName = foundUser.nickname || foundUser.username || foundUser.name;
            }
        }

        // DM 방이고 상대방인 경우, 방 제목(room.title)은 보통 상대방의 닉네임입니다.
        if (!displayName && room.type === 'DM' && senderIdStr !== String(user?.id)) {
            displayName = room.title;
        }

        // 본인인 경우
        if (!displayName && senderIdStr === String(user?.id)) {
            displayName = user?.nickname || user?.username;
        }

        // 최종 폴백
        if (!displayName) {
            displayName = rawData.senderName || rawData.username || '알 수 없음';
        }

        // 프로필 사진 우선순위:
        // 1. 방 참여자 목록(room.users)에서 해당 유저의 프로필 경로 검색
        // 2. (DM인 경우) 상대방이면 room.selectedProfile의 경로 (방 목록 프로필 사진과 동일)
        // 3. 데이터 자체의 profileImage / selectedProfile 등
        // 4. 본인인 경우 AuthContext의 정보

        let profilePath = null;

        // 방 참여자 정보에서 검색
        if (room.users && Array.isArray(room.users)) {
            const foundUser = room.users.find(u => String(u.id) === senderIdStr);
            if (foundUser) {
                profilePath = foundUser.profileImagePath || foundUser.selectedProfile?.imagePath || foundUser.selectedProfile || foundUser.profileImage;
            }
        }

        // DM 방이고 상대방인 경우, 방 전체 정보에 있는 프로필을 활용 (가장 정확)
        if (!profilePath && room.type === 'DM' && senderIdStr !== String(user?.id)) {
            profilePath = room.profileImagePath || room.selectedProfile?.imagePath || room.selectedProfile;
        }

        // 본인인 경우
        if (!profilePath && senderIdStr === String(user?.id)) {
            profilePath = user?.selectedProfile?.imagePath || user?.selectedProfile || user?.profileImage;
        }

        // 최종 폴백 (메시지 데이터 자체)
        if (!profilePath) {
            profilePath = rawData.profileImageUrl || rawData.selectedProfile?.imagePath || rawData.selectedProfile || rawData.profileImage;
        }

        return {
            ...rawData,
            id: rawData.id,
            content: rawData.content || rawData.message,
            senderName: displayName,
            createdAt: rawData.createdAt || rawData.timestamp,
            senderId: senderIdStr,
            profileImageUrl: getProfileUrl(profilePath)
        };
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            let response;

            // [최적화] Prefetch된 Promise가 있으면 사용, 없으면 직접 요청
            if (messagesPromise) {
                response = await messagesPromise;
            } else {
                response = await chatAPI.getMessages(room.id);
            }

            // 초기 로딩 시 데이터가 50개 미만이면 더 이상 없다고 판단
            if (response.data.length < 50) {
                setHasMore(false);
            }

            // 데이터 정규화 및 역순 정렬
            const normalizedData = response.data.map(normalizeMessage);
            setMessages([...normalizedData].reverse());

            // [최적화] 읽음 처리를 비동기로 수행하여 렌더링 차단 방지 (Non-blocking)
            if (response.data.length > 0) {
                const latestMessage = response.data[0];
                chatAPI.markAsRead(room.id, latestMessage.id).catch(err => {
                    console.error('Failed to mark as read (background):', err);
                });
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    // [무한 스크롤] 이전 메시지 불러오기
    const loadPreviousMessages = async () => {
        if (isLoadingMore || !hasMore || messages.length === 0) return;

        try {
            // 현재 스크롤 높이 저장 (복원용)
            prevScrollHeightRef.current = chatAreaRef.current.scrollHeight;
            setIsLoadingMore(true);

            const oldestMessageId = messages[0].id;
            console.log(`[ChatRoom] Loading previous messages before ID: ${oldestMessageId} `);

            const response = await chatAPI.getMessages(room.id, oldestMessageId); // lastId 전달

            if (response.data.length === 0) {
                setHasMore(false);
                setIsLoadingMore(false);
                return;
            }

            if (response.data.length < 50) {
                setHasMore(false);
            }

            // 기존 메시지 앞에 추가
            const normalizedData = response.data.map(normalizeMessage);
            const previousMessages = [...normalizedData].reverse();
            setMessages(prev => [...previousMessages, ...prev]);

            // 주의: setIsLoadingMore(false)는 useEffect에서 처리됨 (스크롤 복원 후)
        } catch (error) {
            console.error('Failed to load previous messages:', error);
            setIsLoadingMore(false);
        }
    };

    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMore && !isLoadingMore) {
            loadPreviousMessages();
        }
    };

    const handleNewMessage = (message) => {
        console.log('[ChatRoom] WebSocket 수신 원본:', message);

        // 타이핑 인디케이터 처리
        if (message.type === 'TYPING' || (message.data && message.data.isTyping !== undefined) || message.isTyping !== undefined) {
            const typingData = message.type === 'TYPING' ? message.data : (message.data || message);
            handleTypingIndicator(typingData);
            return;
        }

        // 일반 메시지 처리
        if (!message.type || message.type === 'MESSAGE') {
            const normalizedMessage = normalizeMessage(message);

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

        if (typingUserId === currentUserId) return;

        // 이름 찾기 시도: 1. WebSocket 데이터 닉네임 2. 계정명 3. 방 참여자 목록 4. fallback
        let typingUsername = data.nickname || data.senderNickname || data.username || data.senderName;

        if (!typingUsername && room.users && Array.isArray(room.users)) {
            const foundUser = room.users.find(u => String(u.id) === typingUserId);
            if (foundUser) typingUsername = foundUser.nickname || foundUser.username || foundUser.name;
        }

        if (!typingUsername) {
            // [수정] DM의 경우 방 제목이 곧 상대방 닉네임일 가능성이 높음 (최종 수단)
            if (room.type === 'DM' && room.title) {
                typingUsername = room.title;
            } else {
                typingUsername = '알 수 없음';
            }
        }

        console.log(`[ChatRoom] 타이핑 이벤트 처리 - 대상: ${typingUserId} (${typingUsername}), 상태: ${data.isTyping}`);

        if (data.isTyping) {
            setTypingUsers(prev => {
                const now = Date.now();
                // 이미 존재하는지 확인
                const existingIndex = prev.findIndex(u => (typeof u === 'string' ? u : u.id) === typingUserId);

                if (existingIndex !== -1) {
                    // 시간만 갱신 (Heartbeat 수신)
                    const updated = [...prev];
                    const existing = prev[existingIndex];
                    const userObj = typeof existing === 'string' ? { id: existing, name: typingUsername } : existing;
                    updated[existingIndex] = { ...userObj, lastActive: now };
                    return updated;
                }

                // 신규 추가
                return [...prev, { id: typingUserId, name: typingUsername, lastActive: now }];
            });
        } else {
            setTypingUsers(prev => prev.filter(u => (typeof u === 'string' ? u : u.id) !== typingUserId));
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        const hasText = newValue.length > 0;
        const now = Date.now();

        // 1. 입력이 시작되거나, 2. 입력 중인데 3초가 지났다면 (Heartbeat) -> 전송
        if (hasText) {
            if (!isTypingSentRef.current || (now - lastTypingSentTimeRef.current > 3000)) {
                sendTypingIndicator(room.id, true);
                isTypingSentRef.current = true;
                lastTypingSentTimeRef.current = now;
            }
        }
        // 입력이 비어있으면 즉시 해제 신호 전송
        else if (!hasText && isTypingSentRef.current) {
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

        console.log(`[ChatRoom] 메시지 전송 시도 - 방 ID: ${room.id}, 내용: ${content.substring(0, 20)}${content.length > 20 ? '...' : ''} `);

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

            <div className="messages-container" ref={chatAreaRef} onScroll={handleScroll}>
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
                        {messages.map((msg, index) => {
                            // 날짜 구분선 로직 등은 여기에
                            return (
                                <MessageItem
                                    key={msg.id}
                                    message={msg}
                                    isOwn={msg.senderId === user.id}
                                    showAvatar={
                                        index === 0 ||
                                        messages[index - 1].senderId !== msg.senderId
                                    }
                                />
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Typing Indicator - Moved outside messages-container to stay above input */}
            {typingUsers.length > 0 && (
                <div className="typing-indicator-wrapper">
                    <div className="typing-indicator-container">
                        <div className="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span className="typing-text">
                            {typingUsers.length > 3
                                ? '여러 명이 입력 중...'
                                : `${typingUsers.map(u => u.name || u).join(', ')}님이 입력 중...`}
                        </span>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={`#${room.title || '채팅방'}에 메시지 보내기`}
                    disabled={sending}
                    maxLength={5000}
                />
                <button type="submit" disabled={!inputValue.trim() || sending}>
                    전송
                </button>
            </form>
        </div>
    );
}

export default ChatRoom;
