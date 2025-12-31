import api from './api';
import { ENDPOINTS } from '../utils/endpoints';

class MessageService {
    /**
     * 대화 목록 가져오기
     */
    async getConversations() {
        try {
            const response = await api.get(ENDPOINTS.MESSAGES.CONVERSATIONS);
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    }

    /**
     * 특정 친구와의 메시지 내역 가져오기
     */
    async getMessages(friendId) {
        try {
            const response = await api.get(ENDPOINTS.MESSAGES.HISTORY(friendId));
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    /**
     * DM 전송
     */
    async sendMessage(receiverId, content) {
        try {
            const response = await api.post(ENDPOINTS.MESSAGES.SEND, {
                receiverId,
                content,
            });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * 메시지 읽음 처리
     */
    async markAsRead(friendId) {
        try {
            await api.post(ENDPOINTS.MESSAGES.MARK_READ(friendId));
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }

    /**
     * 읽지 않은 메시지 개수 가져오기
     */
    async getUnreadCount() {
        try {
            const response = await api.get(ENDPOINTS.MESSAGES.UNREAD_COUNT);
            return response.data;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    }
}

export const messageService = new MessageService();
