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

    // subscribeToUser 함수 정의
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
        if (clientRef.current?.active) {
            return; // 이미 연결됨
        }

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                console.log('[WebSocket]', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('WebSocket Connected');
                setConnected(true);
                setReconnecting(false);

                // 개인 알림 구독
                if (user?.id) {
                    subscribeToUser(user.id);
                }
            },
            onDisconnect: () => {
                console.log('WebSocket Disconnected');
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error('WebSocket Error:', frame);
                setReconnecting(true);
            }
        });

        client.activate();
        clientRef.current = client;
    }, [token, user?.id, subscribeToUser]);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            // 모든 구독 해제
            subscriptionsRef.current.forEach((subscription) => {
                try {
                    subscription.unsubscribe();
                } catch (e) {
                    console.warn('Failed to unsubscribe:', e);
                }
            });
            subscriptionsRef.current.clear();

            clientRef.current.deactivate();
            clientRef.current = null;
            setConnected(false);
        }
    }, []);

    useEffect(() => {
        if (user && token) {
            connect();
        } else {
            disconnect();
        }

        return () => {
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
