import React from 'react';
import './TitleBar.css';

function TitleBar() {
    const handleMinimize = () => {
        window.electronAPI.windowControl.minimize();
    };

    const handleMaximize = () => {
        window.electronAPI.windowControl.maximize();
    };

    const handleClose = () => {
        window.electronAPI.windowControl.close();
    };

    return (
        <div className="title-bar">
            <div className="title-bar-left">
                <img src="./icon.png" alt="logo" className="title-bar-icon" onError={(e) => e.target.style.display = 'none'} />
                <span className="title-bar-text">3DCommu Messenger</span>
            </div>

            <div className="title-bar-controls">
                <button className="control-btn" onClick={handleMinimize} title="최소화">
                    <svg viewBox="0 0 10 1">
                        <path d="M0 0h10v1H0z" fill="currentColor" />
                    </svg>
                </button>
                <button className="control-btn" onClick={handleMaximize} title="최대화">
                    <svg viewBox="0 0 10 10">
                        <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" />
                    </svg>
                </button>
                <button className="control-btn close" onClick={handleClose} title="닫기">
                    <svg viewBox="0 0 10 10">
                        <path d="M0 0l10 10M10 0L0 10" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default TitleBar;
