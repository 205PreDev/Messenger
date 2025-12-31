import api from './api';
import { ENDPOINTS } from '../utils/endpoints';

class FriendService {
    /**
     * 친구 목록 가져오기
     */
    async getFriends() {
        try {
            const response = await api.get(ENDPOINTS.FRIENDS.LIST);
            return response.data;
        } catch (error) {
            console.error('Error fetching friends:', error);
            throw error;
        }
    }

    /**
     * 친구 요청 보내기
     */
    async sendFriendRequest(username) {
        try {
            const response = await api.post(ENDPOINTS.FRIENDS.REQUEST, { username });
            return response.data;
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw error;
        }
    }

    /**
     * 친구 요청 수락
     */
    async acceptFriendRequest(friendshipId) {
        try {
            const response = await api.post(ENDPOINTS.FRIENDS.ACCEPT(friendshipId));
            return response.data;
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    }

    /**
     * 친구 요청 거절
     */
    async rejectFriendRequest(friendshipId) {
        try {
            const response = await api.post(ENDPOINTS.FRIENDS.REJECT(friendshipId));
            return response.data;
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            throw error;
        }
    }

    /**
     * 친구 삭제
     */
    async removeFriend(friendshipId) {
        try {
            await api.delete(ENDPOINTS.FRIENDS.DELETE(friendshipId));
        } catch (error) {
            console.error('Error removing friend:', error);
            throw error;
        }
    }

    /**
     * 받은 친구 요청 목록 가져오기
     */
    async getPendingRequests() {
        try {
            const response = await api.get('/api/friends/requests');
            return response.data;
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            throw error;
        }
    }
}

export const friendService = new FriendService();
