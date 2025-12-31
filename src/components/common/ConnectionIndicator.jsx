import React from 'react';
import './ConnectionIndicator.css';

const ConnectionIndicator = ({ isConnected }) => {
    return (
        <div className="connection-indicator" title={isConnected ? "서버 연결됨" : "서버 연결 끊김"}>
            <div className={`signal-bar bar-1 ${isConnected ? 'active' : ''}`}></div>
            <div className={`signal-bar bar-2 ${isConnected ? 'active' : ''}`}></div>
            <div className={`signal-bar bar-3 ${isConnected ? 'active' : ''}`}></div>
            <div className={`signal-bar bar-4 ${isConnected ? 'active' : ''}`}></div>
        </div>
    );
};

export default ConnectionIndicator;
