import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Messenger from './pages/Messenger';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';

import TitleBar from './components/TitleBar';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>; // 초기 복구 중 대기
    }

    return user ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <Router>
                    <div className="app-main-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-primary)' }}>
                        <TitleBar />
                        <div className="app-content-outer" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
                            <Routes>
                                <Route path="/login" element={<div style={{ height: '100%', width: '100%', pointerEvents: 'auto' }}><Login /></div>} />
                                <Route
                                    path="/"
                                    element={
                                        <PrivateRoute>
                                            <Messenger />
                                        </PrivateRoute>
                                    }
                                />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </div>
                </Router>
            </WebSocketProvider>
        </AuthProvider>
    );
}

export default App;
