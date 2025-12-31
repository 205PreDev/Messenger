import React from 'react';
import Sidebar from './Sidebar';
import ChatWindow from '../chat/ChatWindow';
import './MainLayout.css';

function MainLayout({ profile, friends, selectedFriend, onSelectFriend, onRefreshFriends, receivedMessage, isConnected }) {
    return (
        <div className="main-layout">
            <Sidebar
                profile={profile}
                friends={friends}
                selectedFriend={selectedFriend}
                onSelectFriend={onSelectFriend}
                onRefreshFriends={onRefreshFriends}
                isConnected={isConnected}
            />
            <div className="main-content">
                <ChatWindow
                    selectedFriend={selectedFriend}
                    receivedMessage={receivedMessage}
                    profile={profile}
                />
            </div>
        </div>
    );
}

export default MainLayout;
