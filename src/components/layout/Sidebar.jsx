import React, { useState } from 'react';
import FriendList from '../friends/FriendList';
import { authService } from '../../services/authService';
import ConnectionIndicator from '../common/ConnectionIndicator';
import { ko } from '../../i18n/ko';
import './Sidebar.css';

function Sidebar({ profile, friends, selectedFriend, onSelectFriend, onRefreshFriends, isConnected }) {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        console.log('[Sidebar] Logout clicked - showing custom confirm');
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        console.log('[Sidebar] Logout confirmed');
        await authService.logout();
    };

    const cancelLogout = () => {
        console.log('[Sidebar] Logout cancelled');
        setShowLogoutConfirm(false);
    };

    return (
        <div className="sidebar">
            {/* 프로필 헤더 */}
            <div className="sidebar-header">
                <div className="profile-section">
                    <div className="profile-avatar">
                        {profile?.selectedProfile?.imagePath ? (
                            <img src={profile.selectedProfile.imagePath} alt={profile.username} />
                        ) : (
                            <div className="avatar-placeholder">
                                {profile?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <div className="profile-name">{profile?.username || profile?.nickname || '사용자'}</div>
                        <div className="profile-stats">
                            {/* Stats */}
                        </div>
                    </div>
                </div>
                <div className="sidebar-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ConnectionIndicator isConnected={isConnected} />
                    <button className="logout-button" onClick={handleLogoutClick} title={ko.auth.logout}>
                        <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 로그아웃 확인 오버레이 */}
            {showLogoutConfirm && (
                <div className="logout-confirm-overlay">
                    <div className="logout-confirm-box">
                        <p>로그아웃하시겠습니까?</p>
                        <div className="confirm-buttons">
                            <button className="confirm-btn yes" onClick={confirmLogout}>확인</button>
                            <button className="confirm-btn no" onClick={cancelLogout}>취소</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 친구 목록 */}
            <div className="sidebar-content">
                <FriendList
                    friends={friends}
                    selectedFriend={selectedFriend}
                    onSelectFriend={onSelectFriend}
                    onRefresh={onRefreshFriends}
                />
            </div>
        </div>
    );
}

export default Sidebar;
