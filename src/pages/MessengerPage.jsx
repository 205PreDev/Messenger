import React, { useState, useEffect, useCallback, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { friendService } from '../services/friendService';
import { authService } from '../services/authService';
import { webSocketService } from '../services/webSocketService';
import api from '../services/api';
import { API_URL } from '../utils/constants';
import { getResourceUrl } from '../utils/endpoints';
import { storageService } from '../services/storageService';
import './MessengerPage.css';

function MessengerPage() {
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [profile, setProfile] = useState(null);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [receivedMessage, setReceivedMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const selectedFriendRef = useRef(null);

    // selectedFriend 상태가 바뀔 때마다 Ref 업데이트 (useEffect 클로저 문제 해결용)
    useEffect(() => {
        selectedFriendRef.current = selectedFriend;
    }, [selectedFriend]);

    const loadData = useCallback(async () => {
        try {
            setError(null);
            setIsLoading(true);
            // 1. 내 정보 가져오기
            const myInfo = await authService.getMyInfo();

            // 2. 프로필 및 친구 목록 병렬 조회
            const [profileWithId, friendsDataRaw] = await Promise.all([
                authService.fetchProfile(myInfo?.id),
                friendService.getFriends()
            ]);

            // 3. 재화 정보 탐색 (가이드 우선순위 준수: goldCoins, silverCoins)
            const findCurrency = (objs, keyBase) => {
                const keys = [
                    `${keyBase}Coins`,  // goldCoins, silverCoins
                    keyBase,            // gold, silver
                    `${keyBase}s`,      // golds, silvers
                    `${keyBase}_coins`, // gold_coins, silver_coins
                    'balance',
                    'coin'
                ];
                for (const obj of objs) {
                    if (!obj) continue;
                    for (const k of keys) {
                        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
                    }
                }
                return 0;
            };

            const gold = findCurrency([profileWithId, myInfo], 'gold');
            const silver = findCurrency([profileWithId, myInfo], 'silver');

            const normalizedProfile = {
                ...myInfo,
                ...profileWithId,
                username: myInfo.username || profileWithId.nickname || '사용자',
                goldCoins: gold,
                silverCoins: silver,
                selectedProfile: {
                    imagePath: getResourceUrl(profileWithId.selectedProfile || myInfo.selectedProfile)
                },
                selectedOutline: {
                    imagePath: getResourceUrl(profileWithId.selectedOutline || myInfo.selectedOutline)
                }
            };

            let friendsList = Array.isArray(friendsDataRaw) ? friendsDataRaw : (friendsDataRaw?.content || friendsDataRaw?.data || []);

            const normalizedFriendsBase = friendsList.map(f => {
                const fId = f.userId || f.id;
                const fName = f.username || f.nickname || '알 수 없음';
                const avatarRaw = f.profileImagePath || f.selectedProfile;

                return {
                    ...f,
                    id: fId,
                    username: fName,
                    friend: f.friend || {
                        id: fId,
                        username: fName,
                        selectedProfile: { imagePath: getResourceUrl(avatarRaw) }
                    }
                };
            });

            // 친구들의 온라인 상태 병렬 조회 (숫자 ID를 식별자로 사용)
            const normalizedFriends = await Promise.all(normalizedFriendsBase.map(async (f) => {
                try {
                    // 백엔드 ActiveUserService 명단 키(Numeric ID)와 일치시킴
                    const statusKey = String(f.id);
                    const isOnline = await authService.checkActiveStatus(statusKey);
                    return { ...f, isOnline };
                } catch (e) {
                    return { ...f, isOnline: false };
                }
            }));

            console.log('Normalized Data:', { profile: normalizedProfile, friendsCount: normalizedFriends.length });

            setProfile(normalizedProfile);
            setFriends(normalizedFriends);
            console.log('--- DATA NORMALIZATION COMPLETE ---');
        } catch (error) {
            console.error('Data Loading Error:', error);
            if (error.code === 'ERR_NETWORK' || !error.response) {
                setError('서버에 연결할 수 없습니다. 백엔드 서버(Spring Boot)가 실행 중인지 확인해 주세요.');
            } else {
                setError('데이터를 불러오는 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        const syncInterval = setInterval(() => {
            console.log('[MessengerPage] Periodic data sync...');
            loadData();
        }, 30000);

        return () => {
            clearInterval(syncInterval);
        };
    }, [loadData]);

    useEffect(() => {
        if (!profile) return;

        // WebSocket 연결
        webSocketService.connect(
            (message) => {
                // 메시지 수신 처리
                setReceivedMessage(message);

                const currentFriend = selectedFriendRef.current;
                if (window.electronAPI) {
                    const isFocusingSender = currentFriend &&
                        (currentFriend.id === message.senderId || currentFriend.userId === message.senderId);

                    if (!isFocusingSender) {
                        window.electronAPI.showNotification('새 메시지', message.content);
                    }
                }
            },
            (statusData) => {
                // 실시간 친구 상태 변경 처리 (join/leave)
                console.log('[MessengerPage] Real-time status update:', statusData);

                setFriends(prevFriends => prevFriends.map(friend => {
                    // statusData.userId는 문자열일 수 있으므로 비교 시 주의
                    if (String(friend.id) === String(statusData.userId)) {
                        const isOnline = statusData.action === 'join';
                        console.log(`Updating friend ${friend.username} (${friend.id}) status to: ${isOnline ? 'Online' : 'Offline'}`);
                        return { ...friend, isOnline };
                    }
                    return friend;
                }));
            },
            (connected) => {
                setIsConnected(connected);
            },
            profile
        );

        return () => {
            console.log('Disconnecting WebSocket due to profile change or unmount');
            webSocketService.disconnect();
        };
    }, [profile?.id]); // loadData 의존성 제거 (웹소켓 연결은 프로필 변경 시에만)

    if (error) {
        return (
            <div className="error-container">
                <div className="error-box">
                    <h2>연결 오류</h2>
                    <p>{error}</p>
                    <button className="retry-button" onClick={loadData}>다시 시도</button>
                    <button className="logout-api-button" onClick={() => authService.logout()}>로그아웃</button>
                </div>
            </div>
        );
    }

    if (isLoading && !profile) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>로딩 중...</p>
            </div>
        );
    }

    return (
        <MainLayout
            profile={profile}
            friends={friends}
            selectedFriend={selectedFriend}
            onSelectFriend={setSelectedFriend}
            onRefreshFriends={loadData}
            receivedMessage={receivedMessage}
            isConnected={isConnected}
        />
    );
}

export default MessengerPage;
