import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MessengerPage from './pages/MessengerPage';
import SettingsPage from './pages/SettingsPage';
import AuthGuard from './components/auth/AuthGuard';
import { authService } from './services/authService';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 앱 시작 시 인증 상태 확인
        const checkAuth = async () => {
            const authenticated = await authService.isAuthenticated();
            setIsAuthenticated(authenticated);
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#1a1a1a',
                color: '#fff'
            }}>
                <div>로딩 중...</div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />
                    }
                />
                <Route
                    path="/"
                    element={
                        <AuthGuard isAuthenticated={isAuthenticated}>
                            <MessengerPage />
                        </AuthGuard>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <AuthGuard isAuthenticated={isAuthenticated}>
                            <SettingsPage />
                        </AuthGuard>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
