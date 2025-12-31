import React, { useState } from 'react';
import FriendItem from './FriendItem';
import { ko } from '../../i18n/ko';
import './FriendList.css';

function FriendList({ friends, selectedFriend, onSelectFriend, onRefresh }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFriends = friends.filter(friendship => {
        const friend = friendship?.friend || (friendship?.username ? friendship : null) || (friendship?.nickname ? friendship : null);
        const nickname = friend?.username || friend?.nickname || '';
        return nickname.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="friend-list">
            <div className="friend-list-header">
                <h2>{ko.friends.friendList}</h2>
                <button className="refresh-button" onClick={onRefresh} title="새로고침">
                    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            <div className="search-box">
                <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder={ko.friends.searchFriends}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="friend-list-content">
                {filteredFriends.length === 0 ? (
                    <div className="empty-state">
                        <p>{searchQuery ? '검색 결과가 없습니다' : ko.friends.noFriends}</p>
                    </div>
                ) : (
                    filteredFriends.map((item, index) => {
                        // 가이드 v1.0에 따르면 친구 목록은 User 객체 리스트일 수도, Friendship 객체 리스트일 수도 있음
                        const friend = item?.friend || (item?.id ? item : null) || (item?.username ? item : null) || (item?.nickname ? item : null);
                        if (!friend) return null;

                        // 고유 키 생성 (friendship ID 또는 user ID)
                        const itemKey = item?.id || friend?.id || `friend-${index}`;

                        return (
                            <div key={itemKey} className="friend-item-anim" style={{ '--index': index }}>
                                <FriendItem
                                    friendship={item?.friend ? item : { friend: item }}
                                    isSelected={selectedFriend?.id === friend?.id}
                                    onClick={() => {
                                        console.log('Selecting friend:', friend);
                                        onSelectFriend(friend);
                                    }}
                                />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default FriendList;
