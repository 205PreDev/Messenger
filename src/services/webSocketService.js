import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_URL, WS_CHANNELS } from '../utils/constants';
import { authService } from './authService';

class WebSocketService {
    constructor() {
        this.client = null;
        this.onMessageReceived = null;
        this.onStatusChanged = null;
        this.isConnected = false;
        this.isConnecting = false;
    }

    /**
     * WebSocket 연결
     */
    async connect(onMessageReceived, onStatusChanged, onConnectionChange, currentUser) {
        if (this.isConnected || this.isConnecting) return;

        this.isConnecting = true;
        this.onMessageReceived = onMessageReceived;
        this.onStatusChanged = onStatusChanged;
        this.onConnectionChange = onConnectionChange;

        const token = await authService.getToken();
        if (!token) {
            console.error('WebSocket connection failed: No token found');
            this.isConnecting = false;
            return;
        }

        const socket = new SockJS(`${WS_URL}/ws`);
        this.client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            debug: (str) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[STOMP] ' + str);
                }
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
            this.isConnected = true;
            this.isConnecting = false;
            console.log('Connected to WebSocket');
            if (this.onConnectionChange) this.onConnectionChange(true);

            // 플레이어 입장 알림 (온라인 상태 등록)
            if (currentUser) {
                // 백엔드 ActiveUserService는 숫자 ID(String)를 키로 명단을 관리합니다.
                console.log('Sending player.join for online status:', currentUser.id);
                this.sendMessage(WS_CHANNELS.JOIN, {
                    userId: String(currentUser.id),
                    username: currentUser.username
                });
            }

            // 개인 DM 메시지 구독 (토픽 방식: /topic/dm/{userId})
            const dmTopic = WS_CHANNELS.DM_TOPIC(currentUser.id);
            console.log(`[WebSocket] Subscribing to: ${dmTopic}`);
            this.client.subscribe(dmTopic, (message) => {
                if (this.onMessageReceived) {
                    try {
                        const body = JSON.parse(message.body);
                        this.onMessageReceived(body);
                    } catch (e) {
                        console.error('[WebSocket] Failed to parse message body:', e);
                    }
                }
            });

            // 2. 실시간 접속 상태 구독 (요청사항 반영)
            // /topic/players 토픽에서 join/leave 메시지 수신
            console.log('[WebSocket] Subscribing to: /topic/players');
            this.client.subscribe('/topic/players', (message) => {
                try {
                    const data = JSON.parse(message.body);
                    console.log(`[WebSocket] Player status update: ${data.action}`, data);

                    if (this.onStatusChanged) {
                        this.onStatusChanged(data);
                    }
                } catch (error) {
                    console.error('[WebSocket] Error parsing player status:', error);
                }
            });
        };

        this.client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
            this.isConnected = false;
            this.isConnecting = false;
            if (this.onConnectionChange) this.onConnectionChange(false);
        };

        this.client.onDisconnect = () => {
            this.isConnected = false;
            this.isConnecting = false;
            console.log('Disconnected from WebSocket');
            if (this.onConnectionChange) this.onConnectionChange(false);
        };

        this.client.activate();
    }

    /**
     * WebSocket 연결 해제
     */
    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.isConnected = false;
            this.isConnecting = false;
        }
    }

    /**
     * 메시지 발행 (STOMP를 통한 전송 시 사용, 현재는 REST API 사용 중)
     */
    sendMessage(destination, body) {
        if (this.client && this.isConnected) {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
                headers: {
                    Authorization: this.client.connectHeaders.Authorization
                }
            });
        }
    }
}

export const webSocketService = new WebSocketService();
