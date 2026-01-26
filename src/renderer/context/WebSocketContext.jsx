import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
    const { user, token } = useAuth();
    const clientRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [lastNotification, setLastNotification] = useState(null); // [NEW]
    const subscriptionsRef = useRef(new Map());

    const isIntentionalDisconnectRef = useRef(false);
    const retryCountRef = useRef(0);
    const retryTimeoutRef = useRef(null);

    const subscribeToUser = useCallback((userId) => {
        if (!clientRef.current?.connected) return;

        const destination = `/topic/user/${userId}/updates`;
        if (subscriptionsRef.current.has(destination)) return;

        const subscription = clientRef.current.subscribe(destination, (message) => {
            const data = JSON.parse(message.body);
            console.log('User update received:', data);

            // 전역 상태 업데이트
            setLastNotification(data);

            // 새 메시지 알림
            if (data.type === 'NEW_MESSAGE') {
                // Electron 데스크톱 알림
                if (window.electronAPI) {
                    window.electronAPI.showNotification(
                        data.senderName || '새 메시지',
                        data.content || '메시지를 확인하세요'
                    );
                }
            }
        });

        subscriptionsRef.current.set(destination, subscription);
    }, []);

    const connect = useCallback(() => {
        // 이미 활성화된 클라이언트가 있다면 재사용 (단, 연결 끊긴 상태라면 재활성화 시도)
        if (clientRef.current?.active) {
            return;
        }

        // 재연결 타이머가 있다면 취소 (중복 실행 방지)
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        isIntentionalDisconnectRef.current = false;

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                // console.log('[WebSocket]', str); // 너무 많은 로그 방지
            },
            reconnectDelay: 0, // [Fast Retry] 자동 재연결 끄기 (수동 제어)
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('✅ WebSocket Connected');
                console.log('📊 User info:', { userId: user?.id, username: user?.username });
                setConnected(true);
                setReconnecting(false);
                retryCountRef.current = 0; // [Fast Retry] 연결 성공 시 카운트 초기화

                // 온라인 상태 알림
                if (user?.id && user?.username) {
                    const joinMessage = { userId: user.id, username: user.username };
                    clientRef.current.publish({
                        destination: '/app/player.join',
                        body: JSON.stringify(joinMessage)
                    });
                    console.log('✅ Online status sent to backend');
                }

                // 개인 알림 구독
                if (user?.id) subscribeToUser(user.id);
            },
            onWebSocketClose: () => {
                console.log('⚠️ WebSocket Closed');
                setConnected(false);

                // [Fast Retry] 의도치 않은 종료 시 빠른 재접속 시도
                if (!isIntentionalDisconnectRef.current) {
                    const count = retryCountRef.current;
                    let delay = 5000;

                    // Fast Retry 전략: 0.5초 -> 1초 -> 이후 5초
                    if (count === 0) delay = 500;
                    else if (count === 1) delay = 1000;

                    console.log(`🔄 Reconnecting in ${delay}ms (Attempt ${count + 1})...`);
                    setReconnecting(true);

                    retryTimeoutRef.current = setTimeout(() => {
                        retryCountRef.current += 1;
                        connect(); // 재귀 호출이 아니라 useCallback 의존성에 따른 새 호출
                    }, delay);
                }
            },
            onStompError: (frame) => {
                console.error('WebSocket Error (STOMP):', frame);
                // STOMP 에러(예: 중복 로그인) 시에도 소켓이 닫히므로 onWebSocketClose에서 처리됨
            }
        });

        client.activate();
        clientRef.current = client;
    }, [token, user?.id, subscribeToUser]); // connect 자체는 의존성 변경 시 새로 생성됨

    const disconnect = useCallback(() => {
        isIntentionalDisconnectRef.current = true; // [Fast Retry] 재접속 방지

        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        if (clientRef.current) {
            // [Session Cleanup] 명시적 퇴장 메시지 (가능한 경우)
            if (clientRef.current.connected && user?.id) {
                try {
                    clientRef.current.publish({
                        destination: '/app/player.leave',
                        body: JSON.stringify({ userId: user.id, username: user.username })
                    });
                } catch (err) { console.warn(err); }
            }

            // 구독 해제
            subscriptionsRef.current.forEach(sub => sub.unsubscribe());
            subscriptionsRef.current.clear();

            clientRef.current.deactivate();
            clientRef.current = null;
            setConnected(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && token) {
            // [Smart Reconnect] 새로고침 감지
            const navEntry = performance.getEntriesByType("navigation")[0];
            const isReload = navEntry && navEntry.type === 'reload';

            console.log(`[WebSocketContext] Connection attempt. user=${!!user}, token=${!!token}, isReload=${isReload}`);

            if (isReload) {
                console.log('🔄 [Smart Reconnect] 새로고침 감지됨 (0.5s 지연 대기)');
                const timer = setTimeout(() => {
                    console.log('⏰ [Smart Reconnect] 지연 시간 종료, 접속 시도...');
                    connect();
                }, 500);
                return () => clearTimeout(timer);
            } else {
                console.log('🚀 [Smart Reconnect] 즉시 접속 시도');
                connect();
            }
        } else {
            disconnect();
        }

        // [Session Cleanup] 새로고침/종료 시 명시적 연결 해제
        const handleBeforeUnload = () => {
            disconnect();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            disconnect();
        };
    }, [user, token, connect, disconnect]);

    const subscribeToRoom = useCallback((roomId, callback) => {
        if (!clientRef.current?.connected) {
            console.warn('WebSocket not connected');
            return null;
        }

        const roomIdStr = String(roomId); // Force string
        const destination = `/topic/chat/room/${roomIdStr}`;
        console.log(`[WebSocket] Subscribing to: ${destination}`);

        // 이미 구독 중이면 기존 구독 해제 (콜백 갱신을 위해)
        if (subscriptionsRef.current.has(destination)) {
            console.log(`[WebSocket] Already subscribed to ${roomIdStr}, resubscribing...`);
            subscriptionsRef.current.get(destination).unsubscribe();
        }

        const subscription = clientRef.current.subscribe(destination, (message) => {
            console.log(`[WebSocket] Message received on ${destination}:`, message.body);
            const data = JSON.parse(message.body);
            callback(data);
        });

        subscriptionsRef.current.set(destination, subscription);
        return subscription;
    }, []); // 의존성 없음 (ref 사용)

    const unsubscribeFromRoom = useCallback((roomId) => {
        const roomIdStr = String(roomId);
        const destination = `/topic/chat/room/${roomIdStr}`;
        const subscription = subscriptionsRef.current.get(destination);

        if (subscription) {
            console.log(`[WebSocket] Unsubscribing from: ${destination}`);
            subscription.unsubscribe();
            subscriptionsRef.current.delete(destination);
        }
    }, []);

    const sendTypingIndicator = useCallback((roomId, isTyping) => {
        if (!clientRef.current?.connected || !user) return;

        console.log(`[WebSocket] 타이핑 상태 전송 - 방 ID: ${roomId}, 상태: ${isTyping ? '입력 중' : '중단'}`);

        clientRef.current.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({
                roomId,
                userId: user.id,
                isTyping
            })
        });
    }, [user]);

    const value = useMemo(() => ({
        connected,
        reconnecting,
        lastNotification, // [NEW] 실시간 알림 상태 노출
        subscribeToRoom,
        unsubscribeFromRoom,
        sendTypingIndicator
    }), [connected, reconnecting, lastNotification, subscribeToRoom, unsubscribeFromRoom, sendTypingIndicator]);

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
}
