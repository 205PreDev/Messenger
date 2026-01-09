import React, { useState } from 'react';
import RoomList from '../components/RoomList';
import FriendList from '../components/FriendList';
import ChatRoom from '../components/ChatRoom';
import Header from '../components/Header';
import './Messenger.css';

function Messenger() {
    const [view, setView] = useState('rooms'); // 'rooms' or 'friends'
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'light'
    );

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // 초기 테마 적용
    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    const handleStartChat = (room) => {
        setSelectedRoom(room);
        setView('rooms');
    };

    return (
        <div className="messenger-container">
            <Header theme={theme} onToggleTheme={toggleTheme} />

            <div className="messenger-content">
                <nav className="side-navigation">
                    <button 
                        className={`nav-item ${view === 'friends' ? 'active' : ''}`}
                        onClick={() => setView('friends')}
                        title="친구"
                    >
                        👤
                    </button>
                    <button 
                        className={`nav-item ${view === 'rooms' ? 'active' : ''}`}
                        onClick={() => setView('rooms')}
                        title="대화"
                    >
                        💬
                    </button>
                </nav>

                {view === 'rooms' ? (
                    <RoomList
                        selectedRoom={selectedRoom}
                        onSelectRoom={setSelectedRoom}
                        onAddNewChat={() => setView('friends')}
                    />
                ) : (
                    <FriendList 
                        onStartChat={handleStartChat}
                    />
                )}

                <div className="chat-area">
                    {selectedRoom ? (
                        <ChatRoom
                            room={selectedRoom}
                            onClose={() => setSelectedRoom(null)}
                        />
                    ) : (
                        <div className="no-chat-selected">
                            <div className="no-chat-icon">💬</div>
                            <h2>대화를 선택하세요</h2>
                            <p>왼쪽 목록에서 대화방을 선택하거나 새로운 대화를 시작하세요</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Messenger;
