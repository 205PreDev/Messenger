import React from 'react';
import { ko } from '../i18n/ko';
import './SettingsPage.css';

function SettingsPage() {
    return (
        <div className="settings-container">
            <div className="settings-content">
                <h1>{ko.settings.settings}</h1>
                <p className="text-secondary">설정 페이지는 향후 구현 예정입니다.</p>
            </div>
        </div>
    );
}

export default SettingsPage;
